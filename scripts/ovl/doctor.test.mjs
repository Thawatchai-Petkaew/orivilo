import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { hook, makeRepo, runNode } from "./hook-test-kit.mjs";

const doctor = join(dirname(fileURLToPath(import.meta.url)), "doctor.mjs");

const run = (root, ...args) => {
  const r = spawnSync(process.execPath, [doctor, ...args], { cwd: root, encoding: "utf8" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
};

function registerGuards(root, names) {
  mkdirSync(join(root, ".claude"), { recursive: true });
  const hooks = names.map((name) => ({
    matcher: "Agent",
    hooks: [
      {
        type: "command",
        command: `node "$CLAUDE_PROJECT_DIR/.claude/hooks/${name}.mjs" || exit 2`,
      },
    ],
  }));
  writeFileSync(
    join(root, ".claude", "settings.json"),
    JSON.stringify({ hooks: { PreToolUse: hooks } }),
  );
}

test("AC 1: plan lists a probe only for the guards registered in settings.json", () => {
  const root = makeRepo();
  registerGuards(root, ["envelope-guard"]);
  const plan = JSON.parse(run(root, "plan").stdout);
  assert.deepEqual(
    plan.guards.map((g) => g.name),
    ["envelope-guard"],
  );
  assert.equal(plan.guards[0].probe.tool_name, "Agent");
  assert.ok(!Number.isNaN(Date.parse(plan.since)));
  registerGuards(root, []);
  assert.deepEqual(JSON.parse(run(root, "plan").stdout).guards, []);
});

test("AC 1: the planned probe is blocked by envelope-guard and logs a heartbeat, so check passes", () => {
  const root = makeRepo();
  registerGuards(root, ["envelope-guard"]);
  const plan = JSON.parse(run(root, "plan").stdout);
  const probe = { ...plan.guards[0].probe, cwd: root };
  const r = runNode(hook("envelope-guard.mjs"), probe);
  assert.equal(r.code, 2);
  const check = run(root, "check", plan.since);
  assert.equal(check.code, 0, check.stderr);
});

test("AC 1: a silent guard stops the run and is named", () => {
  const root = makeRepo();
  registerGuards(root, ["envelope-guard"]);
  const plan = JSON.parse(run(root, "plan").stdout);
  const check = run(root, "check", plan.since);
  assert.equal(check.code, 2);
  assert.match(check.stderr, /envelope-guard/);
});

test("a heartbeat older than the run start does not count", () => {
  const root = makeRepo();
  registerGuards(root, ["envelope-guard"]);
  mkdirSync(join(root, ".orivilo"), { recursive: true });
  const old = {
    hook: "envelope-guard",
    event: "PreToolUse",
    at: "2020-01-01T00:00:00.000Z",
    tool: "Agent",
    agent_id: null,
    decision: "block",
  };
  writeFileSync(join(root, ".orivilo", "heartbeat.jsonl"), `${JSON.stringify(old)}\n`);
  assert.equal(run(root, "check", new Date().toISOString()).code, 2);
});

test("a guard that cannot be probed is listed, not failed", () => {
  const root = makeRepo();
  registerGuards(root, ["owner-grant"]);
  const plan = JSON.parse(run(root, "plan").stdout);
  assert.equal(plan.guards[0].probe, null);
  assert.match(plan.guards[0].reason, /owner/);
  assert.equal(run(root, "check", plan.since).code, 0);
});

test("a usage error or missing settings exits 2", () => {
  const root = makeRepo();
  assert.equal(run(root).code, 2);
  assert.equal(run(root, "plan").code, 2);
  registerGuards(root, []);
  assert.equal(run(root, "check", "not a time").code, 2);
});

test("S-2: an allow heartbeat from a guard does not count as proof it blocks", () => {
  const root = makeRepo();
  registerGuards(root, ["envelope-guard"]);
  mkdirSync(join(root, ".orivilo"), { recursive: true });
  const beat = (decision) => ({
    hook: "envelope-guard",
    event: "PreToolUse",
    at: new Date(Date.now() + 1000).toISOString(),
    tool: "Agent",
    agent_id: null,
    decision,
  });
  const since = new Date().toISOString();
  writeFileSync(join(root, ".orivilo", "heartbeat.jsonl"), `${JSON.stringify(beat("allow"))}\n`);
  assert.equal(run(root, "check", since).code, 2);
  writeFileSync(join(root, ".orivilo", "heartbeat.jsonl"), `${JSON.stringify(beat("block"))}\n`);
  assert.equal(run(root, "check", since).code, 0);
});
