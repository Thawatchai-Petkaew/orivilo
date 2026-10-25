// The secret scan and the code scan: report mode and blocking mode (ORV-108 rows 17 and 19).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "scan.mjs");

/** A git repo with the given tracked files; returns a runner for the scan in it. */
function repoWith(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "scan-"));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), content);
  }
  spawnSync("git", ["init", "-q"], { cwd: dir });
  spawnSync("git", ["add", "."], { cwd: dir });
  return (...args) => {
    const r = spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: "utf8" });
    return { status: r.status, out: `${r.stdout}${r.stderr}` };
  };
}

// A GitHub personal access token shape, the way the recommended preset knows it. Not a real token.
const TOKEN = `ghp_${"a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8"}`;

test("row 17: a tracked credential fails the secret scan, and --report names it and exits 0", () => {
  const run = repoWith({ "config.txt": `token = ${TOKEN}\n` });
  const blocking = run("secrets");
  assert.notEqual(blocking.status, 0);
  assert.match(blocking.out, /config\.txt:1 @secretlint\/secretlint-rule-github/);
  assert.ok(!blocking.out.includes(TOKEN), "the scan never prints the secret");
  const report = run("secrets", "--report");
  assert.equal(report.status, 0);
  assert.match(report.out, /config\.txt:1 @secretlint\/secretlint-rule-github/);
  assert.match(report.out, /report mode: 1 findings, not blocking\n$/);
});

test("a clean tree passes the secret scan without --report", () => {
  const run = repoWith({ "a.txt": "nothing here\n" });
  assert.equal(run("secrets").status, 0);
});

test("row 19: eval with a variable fails the code scan, and --report names the rule and exits 0", () => {
  const run = repoWith({ "scripts/bad.mjs": "export const f = (code) => eval(code);\n" });
  const blocking = run("code");
  assert.notEqual(blocking.status, 0);
  assert.match(blocking.out, /scripts\/bad\.mjs:1 security\/detect-eval-with-expression/);
  const report = run("code", "--report");
  assert.equal(report.status, 0);
  assert.match(report.out, /security\/detect-eval-with-expression/);
  assert.match(report.out, /report mode: 1 findings, not blocking\n$/);
});

test("the code scan reads TypeScript files", () => {
  const run = repoWith({
    "packages/x/a.ts": "export const f = (c: string): unknown => eval(c);\n",
  });
  assert.match(run("code", "--report").out, /packages\/x\/a\.ts:1 security\/detect-eval/);
});

test("an unknown scan or flag prints usage and exits 2", () => {
  const run = repoWith({ "a.txt": "x\n" });
  assert.equal(run("nope").status, 2);
  assert.equal(run("secrets", "--fix").status, 2);
});
