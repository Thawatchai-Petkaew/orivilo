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
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ExportError, ensureDevelopExport } from "./develop-export.mjs";

const git = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

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

test("row 13: no origin fails closed at ls-remote", () => {
  const { clone } = setup();
  git(clone, "remote", "remove", "origin");
  assert.throws(
    () => ensureDevelopExport({ cwd: clone }),
    (e) => e instanceof ExportError && e.message.includes("git ls-remote"),
  );
});
