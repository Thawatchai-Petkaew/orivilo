// commitlint config, the commit-msg hook and `pnpm lint:commits` (ORV-108 rows 58 to 60).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { lintMessage } from "./check-commits.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts/check-commits.mjs");

test("row 58: commitlint accepts a typed header with an issue key and refuses the rest", () => {
  assert.equal(lintMessage("chore(ORV-103): Vercel creates deployments for main only").ok, true);
  assert.equal(lintMessage("update stuff").ok, false);
  assert.equal(lintMessage("ORV-107: CanvasChat slice C").ok, false);
  const noKey = lintMessage("feat: add a button");
  assert.equal(noKey.ok, false);
  assert.match(noKey.output, /issue key/);
});

test("the existing style passes: a Co-Authored-By trailer and a long header", () => {
  const long = `feat(ORV-108): ${"visual-asserts helpers, ".repeat(5)}slice A part 2`;
  const message = `${long}\n\nBody line.\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\n`;
  assert.equal(lintMessage(message).ok, true);
});

/** A git repo wired to the real hook, with the root's node_modules and commitlint config. */
function hookedRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), "hook-"));
  const git = (...a) =>
    spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], {
      cwd: dir,
      encoding: "utf8",
    });
  git("init", "-q");
  symlinkSync(path.join(root, "node_modules"), path.join(dir, "node_modules"));
  copyFileSync(path.join(root, "commitlint.config.mjs"), path.join(dir, "commitlint.config.mjs"));
  writeFileSync(path.join(dir, "package.json"), '{"name":"hook-test","type":"module"}\n');
  git("config", "core.hooksPath", path.join(root, ".githooks"));
  return git;
}

test("row 59: with the hook on, a bad message is refused and a good one is committed", () => {
  const git = hookedRepo();
  const bad = git("commit", "--allow-empty", "-m", "update stuff");
  assert.notEqual(bad.status, 0);
  assert.match(`${bad.stdout}${bad.stderr}`, /subject may not be empty|type may not be empty/);
  const good = git("commit", "--allow-empty", "-m", "chore(ORV-1): set up");
  assert.equal(good.status, 0, good.stderr);
});

test("row 59: the prepare script switches the hook on", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.scripts.prepare, "git config core.hooksPath .githooks");
  assert.equal(pkg.scripts["lint:commits"], "node scripts/check-commits.mjs");
});

/** A repo whose origin/develop is the first commit; returns a runner for check-commits. */
function branchRepo(...messages) {
  const dir = mkdtempSync(path.join(tmpdir(), "branch-"));
  const git = (...a) =>
    spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], {
      cwd: dir,
      encoding: "utf8",
    });
  git("init", "-q");
  git("commit", "-q", "--allow-empty", "-m", "base");
  git("update-ref", "refs/remotes/origin/develop", "HEAD");
  for (const m of messages) git("commit", "-q", "--allow-empty", "-m", m);
  return (env = {}) => {
    const r = spawnSync(process.execPath, [script], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, GITHUB_BASE_REF: "", ...env },
    });
    return { status: r.status, out: `${r.stdout}${r.stderr}`, git };
  };
}

test("row 60: a bad commit after origin/develop fails, naming its short SHA and the rule", () => {
  const run = branchRepo("chore(ORV-1): fine", "update stuff");
  const r = run();
  assert.equal(r.status, 1);
  assert.match(r.out, /commit [0-9a-f]{7} failed/);
  assert.match(r.out, /\[(?:subject-empty|type-empty|header-names-issue-key)\]/);
  assert.doesNotMatch(r.out, /fine/);
});

test("row 60: with every commit valid it passes", () => {
  const r = branchRepo("chore(ORV-1): one", "fix(ORV-1): two")();
  assert.equal(r.status, 0);
  assert.match(r.out, /2 commits ok/);
});

test("row 60: a release PR into main is skipped", () => {
  const r = branchRepo("update stuff")({ GITHUB_BASE_REF: "main" });
  assert.equal(r.status, 0);
  assert.match(r.out, /release PR: each commit was checked on its own PR/);
});
