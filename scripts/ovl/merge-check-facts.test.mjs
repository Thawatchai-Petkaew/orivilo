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
  fetchPrHead,
  readChecks,
  readFileAtHead,
  readPr,
} from "./merge-check-facts.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(here, "fixtures", "gh");
const VIEW = join(fixtureDir, "pr-view.json");
const CHECKS = join(fixtureDir, "pr-checks.json");

/** A `gh` on PATH. `view` and `checks` are file paths printed to stdout; exits are per call. */
function fixtureGh({ view = VIEW, checks = CHECKS, viewExit = 0, checksExit = 0, checksOut } = {}) {
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
esac
exit 9
`,
  );
  chmodSync(gh, 0o755);
  return { env: { ...process.env, PATH: `${dir}:${process.env.PATH}` }, dir };
}

/** A view fixture edited by `edit`. */
function editedView(edit) {
  const data = JSON.parse(readFileSync(VIEW, "utf8"));
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
  assert.ok(pr.files.includes("docs/specs/ORV-93/spec.md"));
  assert.match(
    readFileSync(join(dir, "calls"), "utf8"),
    /^pr view 87 --json number,title,baseRefName,headRefName,headRefOid,files,changedFiles$/m,
  );
});

test("row 28: a file list GitHub cut blocks", () => {
  const view = editedView((d) => {
    d.changedFiles = 120;
  });
  assert.throws(
    () => readPr(87, { env: fixtureGh({ view }).env }),
    (e) => e instanceof FactsError && /cut/.test(e.message),
  );
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
  const noFiles = editedView((d) => {
    delete d.files;
  });
  assert.throws(() => readPr(87, { env: fixtureGh({ view: noFiles }).env }), FactsError);
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
