import { test } from "node:test";
import assert from "node:assert/strict";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { hook, makeRepo, runNode, seedTask, validEnvelope } from "./hook-test-kit.mjs";

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

const recorderBeat = (at) =>
  `${JSON.stringify({ hook: "result-recorder", event: "SubagentStart", at, tool: null, agent_id: "x", decision: "allow" })}\n`;

const envelopeFile = (root, task) => join(root, ".orivilo/runs/ORV-1", task, "envelope.json");

test("AC 76: with result-recorder registered, open unbound A2-era envelopes close once as pre_a3 and are listed", () => {
  const root = makeRepo();
  registerGuards(root, ["envelope-guard", "result-recorder"]);
  seedTask(root, "ORV-1", "ORV-1-old", { envelope: validEnvelope(root, { task_id: "ORV-1-old" }) });
  seedTask(root, "ORV-1", "ORV-1-bound", {
    envelope: validEnvelope(root, { task_id: "ORV-1-bound" }),
    agent: { agent_id: "a", agent_type: "builder", started_at: "2026-10-23T09:00:00.000Z" },
  });
  const plan = JSON.parse(run(root, "plan").stdout);
  assert.deepEqual(plan.closed_pre_a3, ["ORV-1-old"]);
  const closed = JSON.parse(
    readFileSync(join(root, ".orivilo/runs/ORV-1/ORV-1-old/closed.json"), "utf8"),
  );
  assert.equal(closed.reason, "pre_a3");
  assert.equal(existsSync(join(root, ".orivilo/runs/ORV-1/ORV-1-bound/closed.json")), false);
  assert.deepEqual(JSON.parse(run(root, "plan").stdout).closed_pre_a3, []);
});

test("AC 76: an envelope newer than the first result-recorder heartbeat is not pre_a3", () => {
  const root = makeRepo();
  registerGuards(root, ["result-recorder"]);
  mkdirSync(join(root, ".orivilo"), { recursive: true });
  writeFileSync(
    join(root, ".orivilo", "heartbeat.jsonl"),
    recorderBeat("2026-10-23T09:00:00.000Z"),
  );
  seedTask(root, "ORV-1", "ORV-1-old", { envelope: validEnvelope(root, { task_id: "ORV-1-old" }) });
  seedTask(root, "ORV-1", "ORV-1-new", { envelope: validEnvelope(root, { task_id: "ORV-1-new" }) });
  const old = new Date("2026-10-23T08:00:00.000Z");
  utimesSync(envelopeFile(root, "ORV-1-old"), old, old);
  assert.deepEqual(JSON.parse(run(root, "plan").stdout).closed_pre_a3, ["ORV-1-old"]);
  assert.equal(existsSync(join(root, ".orivilo/runs/ORV-1/ORV-1-new/closed.json")), false);
});

test("AC 76: nothing is closed while result-recorder is not registered", () => {
  const root = makeRepo();
  registerGuards(root, ["envelope-guard"]);
  seedTask(root, "ORV-1", "ORV-1-old", { envelope: validEnvelope(root, { task_id: "ORV-1-old" }) });
  assert.deepEqual(JSON.parse(run(root, "plan").stdout).closed_pre_a3, []);
  assert.equal(existsSync(join(root, ".orivilo/runs/ORV-1/ORV-1-old/closed.json")), false);
});

test("result-recorder is listed as not probed, and `recorder` fails until it has written a heartbeat", () => {
  const root = makeRepo();
  registerGuards(root, ["result-recorder"]);
  const plan = JSON.parse(run(root, "plan").stdout);
  assert.equal(plan.guards[0].name, "result-recorder");
  assert.equal(plan.guards[0].probe, null);
  const silent = run(root, "recorder", plan.since);
  assert.equal(silent.code, 2);
  assert.match(silent.stderr, /result-recorder/);
  mkdirSync(join(root, ".orivilo"), { recursive: true });
  writeFileSync(
    join(root, ".orivilo", "heartbeat.jsonl"),
    recorderBeat(new Date(Date.now() + 1000).toISOString()),
  );
  assert.equal(run(root, "recorder", plan.since).code, 0);
});

test("I-1: `recorder` ignores heartbeats of main-session Bash calls and counts Agent ones", () => {
  const root = makeRepo();
  registerGuards(root, ["result-recorder"]);
  const at = new Date(Date.now() + 1000).toISOString();
  const beat = (event, tool) =>
    `${JSON.stringify({ hook: "result-recorder", event, at, tool, agent_id: null, decision: "allow" })}\n`;
  const since = new Date().toISOString();
  mkdirSync(join(root, ".orivilo"), { recursive: true });
  const file = join(root, ".orivilo", "heartbeat.jsonl");
  writeFileSync(file, beat("PostToolUse", "Bash") + beat("PostToolUseFailure", "Bash"));
  assert.equal(run(root, "recorder", since).code, 2);
  writeFileSync(file, beat("PostToolUse", "Agent"));
  assert.equal(run(root, "recorder", since).code, 0);
  writeFileSync(file, beat("SubagentStop", null));
  assert.equal(run(root, "recorder", since).code, 0);
});

test("a missing dependency stops the run and names `pnpm install`", () => {
  const root = makeRepo();
  registerGuards(root, ["envelope-guard"]);
  const lonely = mkdtempSync(join(tmpdir(), "ovl-doctor-copy-"));
  for (const f of ["doctor.mjs", "hook.mjs", "records.mjs"]) {
    copyFileSync(join(dirname(doctor), f), join(lonely, f));
  }
  const r = spawnSync(process.execPath, [join(lonely, "doctor.mjs"), "plan"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /ajv/);
  assert.match(r.stderr, /pnpm install/);
});
