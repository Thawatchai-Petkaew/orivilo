// ORV-95 task 4: the develop export (spec rows 10, 13, 14), tested on a throwaway origin and clone.
// A `git` shim on PATH counts calls and can fail one subcommand; the real .orivilo is never touched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ExportError, ensureDevelopExport as ensureRaw } from "./develop-export.mjs";

const git = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

// The fixture origin is a local path, so the tests pass it as the expected URL (the function
// parameter of the spec); `expectedUrl: null` keeps the real constant.
const ensureDevelopExport = (o) => {
  let expectedUrl = "none";
  try {
    expectedUrl = git(o.cwd, "config", "--get", "remote.origin.url");
  } catch {
    // no origin: the run must fail at its first step
  }
  return ensureRaw({ expectedUrl, ...o });
};

/** A bare origin whose develop holds scripts/ovl files, and a clone of it. */
function setup({ withMergeCheck = true } = {}) {
  const base = realpathSync(mkdtempSync(join(tmpdir(), "devexp-")));
  const origin = join(base, "origin.git");
  const seed = join(base, "seed");
  const clone = join(base, "clone");
  git(base, "init", "--bare", "-b", "develop", origin);
  git(base, "init", "-b", "develop", seed);
  git(seed, "config", "user.email", "t@example.com");
  git(seed, "config", "user.name", "t");
  git(seed, "config", "commit.gpgsign", "false");
  mkdirSync(join(seed, "scripts", "ovl"), { recursive: true });
  mkdirSync(join(seed, "other"));
  writeFileSync(join(seed, "scripts", "ovl", "hook.mjs"), "// hook\n");
  writeFileSync(join(seed, "other", "x.txt"), "x\n");
  if (withMergeCheck) writeFileSync(join(seed, "scripts", "ovl", "merge-check.mjs"), "// mc\n");
  git(seed, "add", ".");
  git(seed, "commit", "-m", "seed");
  git(seed, "push", origin, "develop");
  git(base, "clone", "-b", "develop", origin, clone);
  const sha = git(seed, "rev-parse", "HEAD");
  return { base, clone, sha };
}

/** A `git` on PATH that logs its subcommand and exits 1 for `failOn`. */
function gitShim(base, failOn) {
  const dir = join(base, "shim");
  mkdirSync(dir, { recursive: true });
  const real = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const sh = join(dir, "git");
  writeFileSync(
    sh,
    `#!/bin/sh
echo "$1" >> '${dir}/calls'
if [ "$1" = '${failOn ?? ""}' ]; then echo boom >&2; exit 1; fi
exec '${real}' "$@"
`,
  );
  chmodSync(sh, 0o755);
  const calls = (name) =>
    existsSync(join(dir, "calls"))
      ? readFileSync(join(dir, "calls"), "utf8")
          .split("\n")
          .filter((c) => c === name).length
      : 0;
  return { env: { ...process.env, PATH: `${dir}:${process.env.PATH}` }, calls };
}

const finished = (clone) => {
  const dir = join(clone, ".orivilo", "exports");
  return existsSync(dir) ? readdirSync(dir).filter((n) => !n.startsWith(".")) : [];
};

test("row 14: extracts scripts/ovl only, then reuses without git archive", () => {
  const { base, clone, sha } = setup();
  const shim = gitShim(base);
  const first = ensureDevelopExport({ cwd: clone, env: shim.env });
  assert.equal(first.sha, sha);
  assert.equal(first.dir, join(clone, ".orivilo", "exports", sha));
  assert.ok(existsSync(join(first.dir, "scripts", "ovl", "merge-check.mjs")));
  assert.deepEqual(readdirSync(first.dir), ["scripts"]);
  assert.deepEqual(readdirSync(join(first.dir, "scripts")), ["ovl"]);
  assert.equal(shim.calls("archive"), 1);
  const second = ensureDevelopExport({ cwd: clone, env: shim.env });
  assert.equal(second.dir, first.dir);
  assert.equal(shim.calls("archive"), 1);
  assert.deepEqual(readdirSync(join(clone, ".orivilo", "exports")), [sha]);
});

test("row 14: an aside folder from a stopped run is never used", () => {
  const { base, clone, sha } = setup();
  const aside = join(clone, ".orivilo", "exports", `.aside-${sha}-1`);
  mkdirSync(join(aside, "scripts", "ovl"), { recursive: true });
  writeFileSync(join(aside, "scripts", "ovl", "merge-check.mjs"), "// stale\n");
  const shim = gitShim(base);
  const out = ensureDevelopExport({ cwd: clone, env: shim.env });
  assert.equal(shim.calls("archive"), 1);
  assert.equal(readFileSync(join(out.dir, "scripts", "ovl", "merge-check.mjs"), "utf8"), "// mc\n");
});

test("row 10: develop without merge-check.mjs blocks as the bootstrap", () => {
  const { clone } = setup({ withMergeCheck: false });
  assert.throws(
    () => ensureDevelopExport({ cwd: clone }),
    (e) =>
      e instanceof ExportError &&
      e.bootstrap === true &&
      /develop has no scripts\/ovl\/merge-check\.mjs yet/.test(e.message) &&
      /GitHub web UI/.test(e.message),
  );
});

test("row 13: ls-remote, fetch and archive failures fail closed and name the step", () => {
  for (const step of ["ls-remote", "fetch", "archive"]) {
    const { base, clone } = setup();
    const shim = gitShim(base, step);
    assert.throws(
      () => ensureDevelopExport({ cwd: clone, env: shim.env }),
      (e) => e instanceof ExportError && !e.bootstrap && e.message.includes(`git ${step}`),
      step,
    );
    assert.deepEqual(finished(clone), [], step);
  }
});

const MARKER_STUB = (marker) =>
  `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(marker)}, "ran");\n`;
const exportDir = (clone, sha) => join(clone, ".orivilo", "exports", sha);
const mcPath = (dir) => join(dir, "scripts", "ovl", "merge-check.mjs");
const asides = (clone) =>
  readdirSync(join(clone, ".orivilo", "exports")).filter((n) => n.startsWith(".aside-"));

test("row 14 (F5): a changed, added, removed or planted export is extracted again", () => {
  const cases = {
    changed: (d) => writeFileSync(join(d, "scripts", "ovl", "hook.mjs"), "// evil\n"),
    "added file": (d) => writeFileSync(join(d, "scripts", "ovl", "x.mjs"), "// x\n"),
    "added package.json": (d) => writeFileSync(join(d, "package.json"), "{}\n"),
    "added node_modules": (d) => {
      mkdirSync(join(d, "node_modules"));
      writeFileSync(join(d, "node_modules", "a.js"), "// a\n");
    },
    removed: (d) => rmSync(join(d, "scripts", "ovl", "hook.mjs")),
    symlink: (d) => {
      rmSync(join(d, "scripts", "ovl", "hook.mjs"));
      symlinkSync(mcPath(d), join(d, "scripts", "ovl", "hook.mjs"));
    },
  };
  for (const [name, tamper] of Object.entries(cases)) {
    const { base, clone, sha } = setup();
    ensureDevelopExport({ cwd: clone });
    tamper(exportDir(clone, sha));
    const shim = gitShim(base);
    const out = ensureDevelopExport({ cwd: clone, env: shim.env });
    assert.equal(shim.calls("archive"), 1, name);
    assert.deepEqual(readdirSync(out.dir), ["scripts"], name);
    assert.deepEqual(readdirSync(join(out.dir, "scripts", "ovl")).sort(), [
      "hook.mjs",
      "merge-check.mjs",
    ]);
    assert.equal(readFileSync(join(out.dir, "scripts", "ovl", "hook.mjs"), "utf8"), "// hook\n");
  }
});

test("row 14 (F5): a pre-planted export folder is replaced and its code never runs", () => {
  const { clone, sha, base } = setup();
  const marker = join(base, "MARKER");
  mkdirSync(join(exportDir(clone, sha), "scripts", "ovl"), { recursive: true });
  writeFileSync(mcPath(exportDir(clone, sha)), MARKER_STUB(marker));
  const out = ensureDevelopExport({ cwd: clone });
  assert.equal(readFileSync(mcPath(out.dir), "utf8"), "// mc\n");
  assert.equal(existsSync(marker), false);
});

test("row 14 (F5): node_modules or package.json under .orivilo or .orivilo/exports fails closed", () => {
  for (const planted of [
    [".orivilo", "node_modules"],
    [".orivilo", "package.json"],
    [".orivilo", "exports", "node_modules"],
    [".orivilo", "exports", "package.json"],
  ]) {
    const { clone } = setup();
    mkdirSync(join(clone, ".orivilo", "exports"), { recursive: true });
    const path = join(clone, ...planted);
    if (planted.at(-1) === "node_modules") mkdirSync(path);
    else writeFileSync(path, "{}\n");
    assert.throws(
      () => ensureDevelopExport({ cwd: clone }),
      (e) => e instanceof ExportError && !e.bootstrap && e.message.includes(path),
      planted.join("/"),
    );
    assert.deepEqual(
      finished(clone).filter((n) => n.length === 40),
      [],
      planted.join("/"),
    );
  }
});

test("row 14 (QA-F5 c): a run stopped before the rename leaves only an aside folder", () => {
  const { base, clone, sha } = setup();
  const shim = gitShim(base);
  assert.throws(
    () => ensureDevelopExport({ cwd: clone, env: shim.env, stopBeforeRename: true }),
    (e) => e instanceof ExportError && !e.bootstrap,
  );
  assert.equal(shim.calls("archive"), 1);
  assert.equal(existsSync(exportDir(clone, sha)), false);
  assert.equal(asides(clone).length, 1);
  assert.ok(existsSync(mcPath(join(clone, ".orivilo", "exports", asides(clone)[0]))));
  const out = ensureDevelopExport({ cwd: clone, env: shim.env });
  assert.equal(shim.calls("archive"), 2);
  assert.equal(out.dir, exportDir(clone, sha));
  assert.equal(readFileSync(mcPath(out.dir), "utf8"), "// mc\n");
  assert.deepEqual(asides(clone), []);
});

test("row 13 (F3): an origin URL other than the expected one stops before any other step", () => {
  const { base, clone } = setup();
  const shim = gitShim(base);
  assert.throws(
    () => ensureRaw({ cwd: clone, env: shim.env }),
    (e) =>
      e instanceof ExportError &&
      !e.bootstrap &&
      e.message.includes("origin URL check") &&
      !e.message.includes(base),
  );
  assert.equal(shim.calls("fetch"), 0);
  assert.equal(shim.calls("archive"), 0);
  assert.equal(existsSync(join(clone, ".orivilo")), false);
});

test("row 13 (F3): the three expected spellings pass the URL check, an insteadOf rewrite does not", () => {
  const { base, clone } = setup();
  const evil = join(base, "origin.git");
  for (const url of [
    "https://github.com/Thawatchai-Petkaew/orivilo.git",
    "https://github.com/thawatchai-petkaew/orivilo/",
    "git@github.com:Thawatchai-Petkaew/orivilo.git",
    "ssh://git@github.com/Thawatchai-Petkaew/orivilo",
  ]) {
    git(clone, "remote", "set-url", "origin", url);
    git(clone, "config", `url.${evil}.insteadOf`, url);
    assert.throws(
      () => ensureRaw({ cwd: clone }),
      (e) => e instanceof ExportError && e.message.includes("origin URL check"),
      url,
    );
    git(clone, "config", "--unset", `url.${evil}.insteadOf`);
    // The spelling is accepted: the run goes on and then fails at ls-remote of the unreachable URL.
    assert.throws(
      () => ensureRaw({ cwd: clone, env: { ...process.env, GIT_ALLOW_PROTOCOL: "none" } }),
      (e) => e instanceof ExportError && !e.message.includes("origin URL check"),
      url,
    );
  }
});

test("row 13: no origin fails closed at ls-remote", () => {
  const { clone } = setup();
  git(clone, "remote", "remove", "origin");
  assert.throws(
    () => ensureDevelopExport({ cwd: clone }),
    (e) => e instanceof ExportError && e.message.includes("git ls-remote"),
  );
});
