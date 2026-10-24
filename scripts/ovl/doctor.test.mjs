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

test("ORV-88 row 10: plan lists the resume-guard probe, a SendMessage call", () => {
  const root = makeRepo();
  registerGuards(root, ["resume-guard"]);
  const entry = JSON.parse(run(root, "plan").stdout).guards.find((g) => g.name === "resume-guard");
  assert.equal(entry.probe.tool_name, "SendMessage");
  assert.deepEqual(entry.probe.tool_input, {
    to: "ovl-doctor-probe",
    summary: "ovl-doctor probe",
    message: "ovl-doctor probe: resume-guard must block this",
  });
});

test("ORV-88 row 11: check names a silent resume-guard and passes after its probe is blocked", () => {
  const root = makeRepo();
  registerGuards(root, ["resume-guard"]);
  const plan = JSON.parse(run(root, "plan").stdout);
  const silent = run(root, "check", plan.since);
  assert.equal(silent.code, 2);
  assert.match(silent.stderr, /resume-guard/);
  const probe = { ...plan.guards[0].probe, cwd: root };
  assert.equal(runNode(hook("resume-guard.mjs"), probe, { CLAUDE_PROJECT_DIR: root }).code, 2);
  assert.equal(run(root, "check", plan.since).code, 0);
});

// ORV-93 rows 28 and 29: the write-guard probe and the probe file.

const writeBeat = (root, decision, at, hook = "write-guard", tool = "Write") => {
  mkdirSync(join(root, ".orivilo"), { recursive: true });
  writeFileSync(
    join(root, ".orivilo", "heartbeat.jsonl"),
    `${JSON.stringify({ hook, event: "PreToolUse", at, tool, agent_id: null, decision })}\n`,
  );
};

test("ORV-93 row 28: plan lists write-guard with the Write probe into packages/", () => {
  const root = makeRepo();
  registerGuards(root, ["write-guard"]);
  const plan = JSON.parse(run(root, "plan").stdout);
  assert.equal(plan.guards[0].name, "write-guard");
  assert.deepEqual(plan.guards[0].probe, {
    hook_event_name: "PreToolUse",
    tool_name: "Write",
    tool_input: {
      file_path: "packages/.ovl-probe",
      content: "ovl-doctor probe: write-guard must block this",
    },
  });
});

test("ORV-93 row 29: check names write-guard when it logged no block, and passes with a block line", () => {
  const root = makeRepo();
  registerGuards(root, ["write-guard"]);
  const since = new Date().toISOString();
  const silent = run(root, "check", since);
  assert.equal(silent.code, 2);
  assert.match(silent.stderr, /write-guard/);
  writeBeat(root, "block", new Date(Date.now() + 1000).toISOString());
  assert.equal(run(root, "check", since).code, 0);
});

test("ORV-93 row 29: a probe file in packages/ means the guard let the probe write", () => {
  const root = makeRepo();
  registerGuards(root, ["write-guard"]);
  const since = new Date().toISOString();
  writeBeat(root, "block", new Date(Date.now() + 1000).toISOString());
  mkdirSync(join(root, "packages"), { recursive: true });
  writeFileSync(join(root, "packages", ".ovl-probe"), "x");
  const r = run(root, "check", since);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /packages\/\.ovl-probe/);
  assert.match(r.stderr, /let the probe write/);
});

test("ORV-95 row 40: plan lists merge-guard with the gh pr merge 0 probe", () => {
  const root = makeRepo();
  registerGuards(root, ["merge-guard"]);
  const plan = JSON.parse(run(root, "plan").stdout);
  assert.equal(plan.guards[0].name, "merge-guard");
  assert.deepEqual(plan.guards[0].probe, {
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    tool_input: {
      command: "gh pr merge 0",
      description: "ovl-doctor probe: merge-guard must block this",
    },
  });
});

test("ORV-95 row 41: check names merge-guard without a block heartbeat, then passes with one", () => {
  const root = makeRepo();
  registerGuards(root, ["merge-guard"]);
  const since = new Date().toISOString();
  const silent = run(root, "check", since);
  assert.equal(silent.code, 2);
  assert.match(silent.stderr, /merge-guard/);
  writeBeat(root, "block", new Date(Date.now() + 1000).toISOString(), "merge-guard", "Bash");
  assert.equal(run(root, "check", since).code, 0);
});
