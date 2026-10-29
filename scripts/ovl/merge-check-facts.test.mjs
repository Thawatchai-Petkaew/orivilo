// ORV-95 task 2: the gh and git reads of merge-check, tested with a fixture gh on PATH
// that prints the recorded samples (scripts/ovl/fixtures/gh, docs/specs/ORV-95/samples.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FactsError,
  fetchBase,
  fetchPrHead,
  readBaseMerge,
  readChecks,
  readFileAtHead,
  readPr,
} from "./merge-check-facts.mjs";
import { commitFile, gitIn, mergeRepo } from "./hook-test-kit.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(here, "fixtures", "gh");
const VIEW = join(fixtureDir, "pr-view.json");
const CHECKS = join(fixtureDir, "pr-checks.json");

/** A `gh` on PATH. `view` and `checks` are file paths printed to stdout; exits are per call. */
function fixtureGh({
  view = crossFalseView(),
  checks = CHECKS,
  viewExit = 0,
  checksExit = 0,
  checksOut,
  files = pages(10),
  filesExit = 0,
} = {}) {
  const dir = mkdtempSync(join(tmpdir(), "ghfix-"));
  const gh = join(dir, "gh");
  const checksCmd = checksOut === undefined ? `cat '${checks}'` : `printf '%s' '${checksOut}'`;
  writeFileSync(
    gh,
    `#!/bin/sh
echo "$@" >> '${dir}/calls'
case "$2" in
  view) cat '${view}'; exit ${viewExit} ;;
  checks) ${checksCmd}; exit ${checksExit} ;;
  repos/*) cat '${files}'; exit ${filesExit} ;;
esac
exit 9
`,
  );
  chmodSync(gh, 0o755);
  return { env: { ...process.env, PATH: `${dir}:${process.env.PATH}` }, dir };
}

/** A file that prints what `gh api --paginate --slurp` prints: `counts` items per page. */
function pages(...counts) {
  let i = 0;
  const data = counts.map((count) =>
    Array.from({ length: count }, () => ({ filename: `dir/file-${i++}.txt`, status: "added" })),
  );
  return rawFiles(JSON.stringify(data));
}
function rawFiles(text) {
  const file = join(mkdtempSync(join(tmpdir(), "filesfix-")), "files.json");
  writeFileSync(file, text);
  return file;
}

function crossFalseView() {
  return editedView(() => {});
}

/** The recorded view sample (a same-repository PR) edited by `edit`. */
function editedView(edit) {
  const data = JSON.parse(readFileSync(VIEW, "utf8"));
  data.isCrossRepository = false;
  edit(data);
  const file = join(mkdtempSync(join(tmpdir(), "viewfix-")), "view.json");
  writeFileSync(file, JSON.stringify(data));
  return file;
}

test("readPr parses the recorded sample into a flat PR with file paths", () => {
  const { env, dir } = fixtureGh();
  const pr = readPr(87, { env });
  assert.equal(pr.number, 87);
  assert.equal(pr.baseRefName, "develop");
  assert.equal(pr.headRefName, "docs/ORV-93-improvement-and-docs");
  assert.match(pr.headRefOid, /^[0-9a-f]{40}$/);
  assert.equal(pr.changedFiles, 10);
  assert.equal(pr.files.length, 10);
  assert.equal(pr.files[0], "dir/file-0.txt");
  const calls = readFileSync(join(dir, "calls"), "utf8");
  assert.match(
    calls,
    /^pr view 87 --json number,title,baseRefName,headRefName,headRefOid,changedFiles,isCrossRepository$/m,
  );
  assert.match(calls, /^api repos\/\{owner\}\/\{repo\}\/pulls\/87\/files --paginate --slurp$/m);
});

test("ORV-115 row 7: 117 files across two pages are all read", () => {
  const view = editedView((d) => {
    d.changedFiles = 117;
  });
  const pr = readPr(87, { env: fixtureGh({ view, files: pages(100, 17) }).env });
  assert.equal(pr.changedFiles, 117);
  assert.equal(pr.files.length, 117);
  assert.equal(pr.files[116], "dir/file-116.txt");
});

test("ORV-115 row 8: a list shorter or longer than changedFiles fails closed", () => {
  for (const [changed, counts] of [
    [3000, [100, 100]],
    [120, [100]],
    [5, [3, 3]],
  ]) {
    const view = editedView((d) => {
      d.changedFiles = changed;
    });
    assert.throws(
      () => readPr(87, { env: fixtureGh({ view, files: pages(...counts) }).env }),
      (e) => e instanceof FactsError && /cut the file list of PR 87/.test(e.message),
    );
  }
});

test("ORV-115 row 9: a failing gh api, text that is not JSON and an item with no filename fail closed", () => {
  const bad = [
    { filesExit: 1 },
    { files: rawFiles("not json") },
    { files: rawFiles('{"filename":"a"}') },
    { files: rawFiles('[[{"filename":"a"},{"path":"b"}]]') },
    { files: rawFiles('[[{"filename":7}]]') },
    { files: rawFiles("[[null]]") },
  ];
  for (const over of bad) {
    const view = editedView((d) => {
      d.changedFiles = 2;
    });
    assert.throws(() => readPr(87, { env: fixtureGh({ view, ...over }).env }), FactsError);
  }
});

test("row 34: gh exiting 1, gh missing and a malformed view fail closed", () => {
  assert.throws(() => readPr(87, { env: fixtureGh({ viewExit: 1 }).env }), FactsError);
  assert.throws(
    () => readPr(87, { env: { ...process.env, PATH: "/nonexistent" } }),
    (e) => e instanceof FactsError && /gh/.test(e.message),
  );
  const noOid = editedView((d) => {
    d.headRefOid = "abc";
  });
  assert.throws(() => readPr(87, { env: fixtureGh({ view: noOid }).env }), FactsError);
  const noCount = editedView((d) => {
    delete d.changedFiles;
  });
  assert.throws(() => readPr(87, { env: fixtureGh({ view: noCount }).env }), FactsError);
});

test("a PR number that is not a whole number of 1 or more is refused before any call", () => {
  const { env, dir } = fixtureGh();
  for (const n of [0, -1, 1.5, "7; rm x", NaN]) assert.throws(() => readPr(n, { env }), FactsError);
  assert.throws(() => readFileSync(join(dir, "calls")));
});

test("readChecks parses the recorded sample, Vercel en dash names intact", () => {
  const { env, dir } = fixtureGh();
  const checks = readChecks(87, { env });
  assert.equal(checks.length, 3);
  assert.deepEqual(
    checks.map((c) => [c.name, c.bucket]),
    [
      ["check", "pass"],
      ["Vercel – orivilo", "fail"],
      ["Vercel – orivilo-design-system", "fail"],
    ],
  );
  assert.ok(checks[1].description.startsWith("Deployment rate limited"));
  assert.match(
    readFileSync(join(dir, "calls"), "utf8"),
    /^pr checks 87 --json name,state,bucket,description,link,workflow$/m,
  );
});

test("row 19: stdout is read whatever the exit code", () => {
  const checks = readChecks(87, { env: fixtureGh({ checksExit: 8 }).env });
  assert.equal(checks.length, 3);
});

test("row 19: no checks is an empty list, text that is not JSON blocks", () => {
  assert.deepEqual(readChecks(7, { env: fixtureGh({ checksOut: "[]" }).env }), []);
  for (const out of ["", "no checks reported", '{"a":1}', '[{"name":"ci"}]']) {
    assert.throws(() => readChecks(7, { env: fixtureGh({ checksOut: out }).env }), FactsError, out);
  }
});

test("row 34: gh missing blocks the checks read too", () => {
  assert.throws(() => readChecks(7, { env: { ...process.env, PATH: "/nonexistent" } }), FactsError);
});

/** A repo with origin holding a PR head ref and one file at that commit. */
function prRepo() {
  const root = mkdtempSync(join(tmpdir(), "factsgit-"));
  const git = (cwd, ...args) =>
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], {
      cwd,
      encoding: "utf8",
    }).trim();
  const origin = join(root, "origin.git");
  git(root, "init", "-q", "--bare", origin);
  const work = join(root, "work");
  git(root, "init", "-q", work);
  writeFileSync(join(work, "a.txt"), "hello\n");
  git(work, "add", "a.txt");
  git(work, "commit", "-q", "-m", "one");
  const sha = git(work, "rev-parse", "HEAD");
  git(work, "remote", "add", "origin", origin);
  git(work, "push", "-q", "origin", `${sha}:refs/pull/7/head`);
  const clone = join(root, "clone");
  git(root, "clone", "-q", origin, clone);
  return { clone, sha };
}

test("fetchPrHead fetches the PR head, then readFileAtHead reads a file or null", () => {
  const { clone, sha } = prRepo();
  fetchPrHead(7, { cwd: clone });
  assert.equal(readFileAtHead(sha, "a.txt", { cwd: clone }), "hello\n");
  assert.equal(readFileAtHead(sha, "gone.stories.tsx", { cwd: clone }), null);
});

test("row 34: a failed fetch or an unknown SHA fails closed", () => {
  const { clone, sha } = prRepo();
  assert.throws(() => fetchPrHead(8, { cwd: clone }), FactsError);
  assert.throws(() => readFileAtHead("f".repeat(40), "a.txt", { cwd: clone }), FactsError);
  assert.throws(() => readFileAtHead("HEAD", "a.txt", { cwd: clone }), FactsError);
  assert.throws(() => readFileAtHead(sha, "../a.txt", { cwd: clone }), FactsError);
});

test("ORV-115 SEC-1: isCrossRepository is read, and a missing or non-boolean value fails closed", () => {
  assert.equal(readPr(87, { env: fixtureGh().env }).isCrossRepository, false);
  for (const value of [undefined, "false", null]) {
    const view = editedView((d) => {
      if (value === undefined) delete d.isCrossRepository;
      else d.isCrossRepository = value;
    });
    assert.throws(
      () => readPr(87, { env: fixtureGh({ view }).env }),
      (e) => e instanceof FactsError && /unexpected shape/.test(e.message),
    );
  }
});

test("ORV-115 SEC-3: a renamed file returns its previous path too", () => {
  const files = rawFiles(
    JSON.stringify([
      [
        ...Array.from({ length: 9 }, (_, i) => ({ filename: `dir/f-${i}.txt`, status: "added" })),
        { filename: "new/ci.yml", status: "renamed", previous_filename: "old/ci.yml" },
      ],
    ]),
  );
  const pr = readPr(87, { env: fixtureGh({ files }).env });
  assert.equal(pr.files.length, 10);
  assert.deepEqual(pr.previousFiles, ["old/ci.yml"]);
});

// ---- ORV-146: an approve carried across a merge of the base branch ----

test("ORV-146: readBaseMerge returns the files a base merge brought and the files the PR had", () => {
  const { work, h0, advance, mergeBase } = mergeRepo();
  advance("c.txt");
  const h1 = mergeBase();
  assert.deepEqual(readBaseMerge(h0, h1, "develop", { cwd: work }), {
    changed: ["c.txt"],
    approvedFiles: ["f.txt"],
  });
});

test("ORV-146: readBaseMerge reports a conflict file as changed and as a file of the PR", () => {
  const { work, h0, advance } = mergeRepo();
  advance("f.txt", "from develop\n");
  gitIn(work, "fetch", "-q", "origin", "develop");
  try {
    gitIn(work, "merge", "-q", "--no-ff", "-m", "merge develop", "origin/develop");
  } catch {
    writeFileSync(join(work, "f.txt"), "resolved\n");
    gitIn(work, "add", "f.txt");
    gitIn(work, "commit", "-q", "-m", "merge develop");
  }
  const h1 = gitIn(work, "rev-parse", "HEAD");
  const merge = readBaseMerge(h0, h1, "develop", { cwd: work });
  assert.deepEqual(merge.changed, ["f.txt"]);
  assert.deepEqual(merge.approvedFiles, ["f.txt"]);
});

test("ORV-146: readBaseMerge is null when the head adds a commit of its own", () => {
  const { work, h0, advance, mergeBase } = mergeRepo();
  advance("c.txt");
  mergeBase();
  const h2 = commitFile(work, "g.txt");
  assert.equal(readBaseMerge(h0, h2, "develop", { cwd: work }), null);
  const own = commitFile(work, "h.txt");
  assert.equal(readBaseMerge(h2, own, "develop", { cwd: work }), null);
});

test("ORV-146: readBaseMerge is null for a merge of a branch that is not the base", () => {
  const { work, h0 } = mergeRepo();
  gitIn(work, "checkout", "-q", "-b", "side", "origin/develop");
  commitFile(work, "side.txt");
  gitIn(work, "checkout", "-q", "feature/ORV-1-x");
  gitIn(work, "merge", "-q", "--no-ff", "-m", "merge side", "side");
  const h1 = gitIn(work, "rev-parse", "HEAD");
  assert.equal(readBaseMerge(h0, h1, "develop", { cwd: work }), null);
});

test("ORV-146: readBaseMerge is null when the approved commit is not behind the head or not known", () => {
  const { work, h0, advance, mergeBase } = mergeRepo();
  advance("c.txt");
  const h1 = mergeBase();
  assert.equal(readBaseMerge(h1, h0, "develop", { cwd: work }), null);
  assert.equal(readBaseMerge("f".repeat(40), h1, "develop", { cwd: work }), null);
  for (const name of ["not-a-sha", "HEAD", "feature/ORV-1-x", "--all"]) {
    assert.equal(readBaseMerge(name, h1, "develop", { cwd: work }), null, name);
  }
});

test("ORV-146: readBaseMerge fails closed when the head or origin/<base> is not in the repo", () => {
  const { work, h0 } = mergeRepo();
  assert.throws(
    () => readBaseMerge(h0, "f".repeat(40), "develop", { cwd: work }),
    (e) => e instanceof FactsError && /is-ancestor/.test(e.message),
  );
  assert.throws(
    () => readBaseMerge(h0, h0, "nothere", { cwd: work }),
    (e) => e instanceof FactsError && /rev-list/.test(e.message),
  );
});

test("ORV-146: readBaseMerge lists a renamed file by both paths", () => {
  const { work, advance, mergeBase } = mergeRepo();
  gitIn(work, "mv", "a.txt", "b.txt");
  gitIn(work, "commit", "-q", "-m", "rename");
  const approved = gitIn(work, "rev-parse", "HEAD");
  advance("d.txt");
  const h1 = mergeBase();
  const merge = readBaseMerge(approved, h1, "develop", { cwd: work });
  assert.deepEqual(merge.changed, ["d.txt"]);
  assert.deepEqual(merge.approvedFiles.sort(), ["a.txt", "b.txt", "f.txt"]);
});

const isPlainNameError = (e) => e instanceof FactsError && /plain branch name/.test(e.message);

test("ORV-146: readBaseMerge refuses a head or base that is not a plain sha or branch name", () => {
  const { work, h0 } = mergeRepo();
  assert.throws(
    () => readBaseMerge(h0, "HEAD", "develop", { cwd: work }),
    (e) => e instanceof FactsError && /40-hex/.test(e.message),
  );
  for (const base of ["--upload-pack=x", "a b", "", "dev;x"]) {
    assert.throws(() => readBaseMerge(h0, h0, base, { cwd: work }), isPlainNameError, base);
  }
});

test("ORV-146: fetchBase brings origin/<base> up to date, and a missing branch fails closed", () => {
  const { work, advance } = mergeRepo();
  const sha = advance("c.txt");
  fetchBase("develop", { cwd: work });
  assert.equal(gitIn(work, "rev-parse", "origin/develop"), sha);
  assert.throws(() => fetchBase("nope", { cwd: work }), FactsError);
  assert.throws(() => fetchBase("--all", { cwd: work }), isPlainNameError);
});
