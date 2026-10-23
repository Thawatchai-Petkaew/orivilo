import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handle } from "./hook.mjs";
import {
  heartbeatLines,
  makeRepo,
  registeredCommands,
  runCommand,
  repoRoot,
} from "./hook-test-kit.mjs";

test("AC 48: a guard that throws exits 2, never 0 or 1, and leaves an error heartbeat", () => {
  const root = makeRepo();
  const r = handle("probe-hook", JSON.stringify({ cwd: root }), () => {
    throw new Error("boom");
  });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /probe-hook failed closed: boom/);
  assert.equal(heartbeatLines(root)[0].decision, "error");
});

test("AC 47: input that is not a JSON object exits 2", () => {
  for (const raw of ["", "{x", "null", "3", "[]"]) {
    assert.equal(handle("probe-hook", raw, () => []).code, 2, raw);
  }
});

test("a guard that allows exits 0; one that returns reasons exits 2 and lists them", () => {
  const root = makeRepo();
  const input = JSON.stringify({ cwd: root, hook_event_name: "PreToolUse", tool_name: "Agent" });
  assert.equal(handle("probe-hook", input, () => []).code, 0);
  const blocked = handle("probe-hook", input, () => ["first", "second"]);
  assert.equal(blocked.code, 2);
  assert.match(blocked.stderr, /first[\s\S]*second/);
  assert.deepEqual(
    heartbeatLines(root).map((b) => b.decision),
    ["allow", "block"],
  );
});

test("every registration ends in || exit 2", () => {
  const all = registeredCommands();
  assert.ok(all.length >= 3);
  for (const c of all) assert.match(c.command, /\|\| exit 2$/, c.command);
});

/** A PATH folder that holds bash, cat and a pnpm stub but no node (the shebang needs bash). */
function sandboxPath(pnpmExit) {
  const bin = mkdtempSync(join(tmpdir(), "ovl-bin-"));
  symlinkSync("/bin/cat", join(bin, "cat"));
  symlinkSync("/bin/bash", join(bin, "bash"));
  const pnpm = join(bin, "pnpm");
  writeFileSync(pnpm, `#!/bin/sh\nexit ${pnpmExit}\n`);
  chmodSync(pnpm, 0o755);
  return bin;
}

const preCommit = registeredCommands().find((c) => c.command.includes("pre-commit-gate"));
const run = (input, env = {}) =>
  runCommand(preCommit.command, input, { CLAUDE_PROJECT_DIR: repoRoot, ...env });

test("pre-commit-gate: malformed input exits 2, never 0", () => {
  for (const raw of ["", "{nope", "null", "[]"]) {
    assert.equal(run(raw).code, 2, raw);
  }
});

test("pre-commit-gate: a command that is not git commit passes", () => {
  const r = run({ tool_input: { command: "ls" } });
  assert.equal(r.code, 0, r.stderr);
});

test("pre-commit-gate: git commit is blocked while lint or typecheck fails and passes when both pass", () => {
  const commit = { tool_input: { command: "git commit -m x" } };
  const node = process.execPath.replace(/\/node$/, "");
  const failing = run(commit, { PATH: `${sandboxPath(1)}:${node}` });
  assert.equal(failing.code, 2);
  assert.match(failing.stderr, /BLOCK/);
  const passing = run(commit, { PATH: `${sandboxPath(0)}:${node}` });
  assert.equal(passing.code, 0, passing.stderr);
});

test("pre-commit-gate: a missing node exits 2", () => {
  const r = run({ tool_input: { command: "ls" } }, { PATH: sandboxPath(0) });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /pre-commit-gate/);
});
