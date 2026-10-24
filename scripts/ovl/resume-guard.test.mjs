// ORV-88: resume-guard blocks every SendMessage. Inputs come from hook stdin recorded in Claude Code
// 2.1.282 (docs/specs/ORV-88/samples.md); a test never feeds an invented shape.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  agentInput,
  fixture,
  heartbeatLines,
  hook,
  makeRepo,
  registeredCommands,
  runNode,
  seedTask,
  validEnvelope,
} from "./hook-test-kit.mjs";
import { judge } from "./resume-guard.mjs";

const guard = hook("resume-guard.mjs");
const mainCall = (cwd, toolInput = {}) => {
  const base = fixture("PreToolUse-SendMessage");
  return { ...base, cwd, tool_input: { ...base.tool_input, ...toolInput } };
};
const subagentCall = (cwd, toolInput = {}) => {
  const base = fixture("PreToolUse-SendMessage-subagent");
  return { ...base, cwd, tool_input: { ...base.tool_input, ...toolInput } };
};
const run = (root, input) => runNode(guard, input, { CLAUDE_PROJECT_DIR: root });

const AGENT = "a1b2c3d4e5f607182";
const seedBound = (root, issue, taskId, agentId = AGENT) =>
  seedTask(root, issue, taskId, {
    envelope: validEnvelope(root, { task_id: taskId, issue, role: "reviewer", write_set: [] }),
    agent: { agent_id: agentId, agent_type: "reviewer", started_at: "2026-10-23T10:00:00.000Z" },
    result: { contract: "reviewer.v1", recorded_at: "2026-10-23T10:05:00.000Z", report: {} },
  });

test("recorded samples are SendMessage calls, one from a subagent", () => {
  assert.equal(fixture("PreToolUse-SendMessage").tool_name, "SendMessage");
  assert.equal(fixture("PreToolUse-SendMessage").agent_id, undefined);
  assert.equal(typeof fixture("PreToolUse-SendMessage-subagent").agent_id, "string");
});

test("row 1: a resume of a recorded agent is blocked and names its task", () => {
  const root = makeRepo();
  seedBound(root, "ORV-1", "ORV-1-review-1");
  const r = run(root, mainCall(root, { to: AGENT }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /^resume-guard blocked:/);
  assert.match(r.stderr, /no envelope/);
  assert.match(r.stderr, /ORV-1/);
  assert.match(r.stderr, /ORV-1-review-1/);
  assert.match(r.stderr, /new task_id/);
  const beats = heartbeatLines(root);
  assert.equal(beats.length, 1);
  assert.deepEqual(Object.keys(beats[0]).sort(), [
    "agent_id",
    "at",
    "decision",
    "event",
    "hook",
    "tool",
  ]);
  assert.equal(beats[0].hook, "resume-guard");
  assert.equal(beats[0].event, "PreToolUse");
  assert.equal(beats[0].tool, "SendMessage");
  assert.equal(beats[0].decision, "block");
  assert.equal(existsSync(join(root, ".orivilo", "runs", "ORV-1", "ORV-1-review-2")), false);
});

test("row 2: an agent id in no record is blocked with the no-record reason", () => {
  const root = makeRepo();
  seedBound(root, "ORV-1", "ORV-1-review-1");
  const r = run(root, mainCall(root, { to: "affffffffffffffff" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /^resume-guard blocked:/);
  assert.match(r.stderr, /names no recorded agent/);
  assert.match(r.stderr, /whatever `to` names/);
  assert.doesNotMatch(r.stderr, /ORV-1-review-1/);
  assert.equal(heartbeatLines(root)[0].decision, "block");
});

test("row 3: a name is blocked like an id", () => {
  const root = makeRepo();
  for (const to of ["reviewer", "main", "prober"]) {
    const r = run(root, mainCall(root, { to, recipient: to }));
    assert.equal(r.code, 2, to);
    assert.match(r.stderr, /names no recorded agent/, to);
  }
  assert.equal(heartbeatLines(root).length, 3);
});

test("row 4: a subagent's SendMessage is blocked and the heartbeat holds its agent_id", () => {
  const root = makeRepo();
  const input = subagentCall(root, { to: "main" });
  const r = run(root, input);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /^resume-guard blocked:/);
  assert.match(r.stderr, /names no recorded agent/);
  assert.equal(heartbeatLines(root)[0].agent_id, input.agent_id);
});

test("row 5: malformed input, another tool or a missing to fails closed", () => {
  const root = makeRepo();
  const cases = [
    "not json",
    "",
    "null",
    "[]",
    JSON.stringify({ ...mainCall(root), tool_name: "Bash" }),
    JSON.stringify({ ...mainCall(root), tool_input: {} }),
    JSON.stringify({ ...mainCall(root), tool_input: { to: 7 } }),
    JSON.stringify({ ...mainCall(root), tool_input: undefined }),
  ];
  for (const raw of cases) {
    const r = run(root, raw);
    assert.equal(r.code, 2, raw);
    assert.match(r.stderr, /^resume-guard failed closed:/, raw);
  }
  const beats = heartbeatLines(root);
  assert.ok(beats.length > 0);
  assert.ok(beats.every((b) => b.decision === "error"));
});

test("row 6: an agent.json that is not JSON, or a lookup that throws, still blocks", () => {
  const root = makeRepo();
  const dir = join(root, ".orivilo", "runs", "ORV-1", "ORV-1-review-1");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "envelope.json"), JSON.stringify(validEnvelope(root)));
  writeFileSync(join(dir, "agent.json"), "{ not json");
  const r = run(root, mainCall(root, { to: AGENT }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /^resume-guard blocked:/);
  assert.equal(heartbeatLines(root)[0].decision, "block");

  const thrown = judge(JSON.stringify(mainCall(root, { to: AGENT })), () => {
    throw new Error("boom");
  });
  assert.equal(thrown.code, 2);
  assert.match(thrown.stderr, /^resume-guard blocked:/);
  assert.doesNotMatch(thrown.stderr, /boom/);
});

test("row 7: a cwd outside this project's repo blocks and creates no .orivilo", () => {
  const root = makeRepo();
  const other = makeRepo();
  const outside = realpathSync(mkdtempSync(join(tmpdir(), "ovl-outside-")));
  const gone = join(outside, "removed");
  for (const cwd of [other, outside, gone]) {
    const r = run(root, mainCall(cwd, { to: AGENT }));
    assert.equal(r.code, 2, cwd);
    assert.match(r.stderr, /^resume-guard blocked:/, cwd);
    assert.equal(existsSync(join(cwd, ".orivilo")), false, cwd);
  }
  assert.equal(heartbeatLines(root).length, 0);
});

test("row 8: message, summary and to are never echoed or logged", () => {
  const root = makeRepo();
  const r = run(root, mainCall(root, { to: "CANARY", message: "CANARY", summary: "CANARY" }));
  assert.equal(r.code, 2);
  assert.doesNotMatch(r.stderr, /CANARY/);
  const file = join(root, ".orivilo", "heartbeat.jsonl");
  assert.doesNotMatch(readFileSync(file, "utf8"), /CANARY/);
  assert.equal(heartbeatLines(root)[0].decision, "block");
});

test("row 8: a recorded id equal to a canary to is not echoed either", () => {
  const root = makeRepo();
  seedBound(root, "ORV-1", "ORV-1-review-1", "CANARYid");
  const r = run(root, mainCall(root, { to: "CANARYid" }));
  assert.equal(r.code, 2);
  assert.doesNotMatch(r.stderr, /CANARY/);
});

test("row 9: resume-guard is registered on PreToolUse SendMessage and nowhere else", () => {
  const found = registeredCommands().filter((c) => c.command.includes("resume-guard"));
  assert.equal(found.length, 1);
  assert.equal(found[0].event, "PreToolUse");
  assert.equal(found[0].matcher, "SendMessage");
  assert.equal(
    found[0].command,
    'node "$CLAUDE_PROJECT_DIR/.claude/hooks/resume-guard.mjs" || exit 2',
  );
});

test("rows 13 and 14: a fresh re-check envelope passes, the same task_id again does not", () => {
  const root = makeRepo();
  const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8" });
  git("config", "user.email", "t@example.com");
  seedBound(root, "ORV-1", "ORV-1-review-1");
  const blocked = run(root, mainCall(root, { to: AGENT }));
  assert.equal(blocked.code, 2);
  const previous = join(root, ".orivilo", "runs", "ORV-1", "ORV-1-review-1", "result.json");
  const recheck = (taskId) =>
    runNode(
      hook("envelope-guard.mjs"),
      agentInput(
        root,
        validEnvelope(root, {
          task_id: taskId,
          issue: "ORV-1",
          role: "reviewer",
          write_set: [],
          context_pointers: ["docs/spec.md", previous],
        }),
      ),
      { CLAUDE_PROJECT_DIR: root },
    );
  const fresh = recheck("ORV-1-review-2");
  assert.equal(fresh.code, 0, fresh.stderr);
  assert.ok(existsSync(join(root, ".orivilo", "runs", "ORV-1", "ORV-1-review-2", "envelope.json")));
  const again = recheck("ORV-1-review-1");
  assert.equal(again.code, 2);
  assert.match(again.stderr, /already has an envelope/);
});
