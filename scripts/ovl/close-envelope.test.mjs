import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { agentInput, hook, makeRepo, runNode, seedTask, validEnvelope } from "./hook-test-kit.mjs";

const script = join(dirname(fileURLToPath(import.meta.url)), "close-envelope.mjs");
const close = (root, ...args) => {
  const r = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
};
const closedOf = (root, task = "ORV-1-a") =>
  JSON.parse(readFileSync(join(root, ".orivilo/runs/ORV-1", task, "closed.json"), "utf8"));

function beat(root, fields) {
  mkdirSync(join(root, ".orivilo"), { recursive: true });
  const line = {
    hook: "result-recorder",
    event: "SubagentStop",
    at: new Date().toISOString(),
    tool: null,
    agent_id: "agent-1",
    decision: "allow",
    ...fields,
  };
  appendFileSync(join(root, ".orivilo", "heartbeat.jsonl"), `${JSON.stringify(line)}\n`);
}

const boundEnvelope = (root) =>
  seedTask(root, "ORV-1", "ORV-1-a", {
    envelope: validEnvelope(root),
    agent: { agent_id: "agent-1", agent_type: "builder", started_at: "2026-10-23T09:00:00.000Z" },
  });

test("AC 50: an envelope that never started is closed as denied, and the next builder envelope is allowed", () => {
  const root = makeRepo();
  seedTask(root, "ORV-1", "ORV-1-a", { envelope: validEnvelope(root) });
  const blocked = runNode(
    hook("envelope-guard.mjs"),
    agentInput(root, validEnvelope(root, { task_id: "ORV-1-b" })),
  );
  assert.equal(blocked.code, 2);
  assert.match(blocked.stderr, /ORV-1-a/);
  assert.match(blocked.stderr, /close-envelope\.mjs ORV-1-a/);
  const r = close(root, "ORV-1-a");
  assert.equal(r.code, 0, r.stderr);
  const record = closedOf(root);
  assert.equal(record.reason, "denied");
  assert.ok(!Number.isNaN(Date.parse(record.closed_at)));
  const next = runNode(
    hook("envelope-guard.mjs"),
    agentInput(root, validEnvelope(root, { task_id: "ORV-1-b" })),
  );
  assert.equal(next.code, 0, next.stderr);
});

test("AC 68: a bound envelope with no SubagentStop heartbeat is not closed", () => {
  const root = makeRepo();
  boundEnvelope(root);
  const r = close(root, "ORV-1-a");
  assert.equal(r.code, 2);
  assert.match(r.stderr, /may still run/);
  assert.equal(existsSync(join(root, ".orivilo/runs/ORV-1/ORV-1-a/closed.json")), false);
});

test("a SubagentStop that was sent back (block) or belongs to another agent is not a final stop", () => {
  const root = makeRepo();
  boundEnvelope(root);
  beat(root, { decision: "block" });
  beat(root, { decision: "error" });
  beat(root, { agent_id: "agent-other" });
  beat(root, { event: "SubagentStart" });
  assert.equal(close(root, "ORV-1-a").code, 2);
});

test("a final SubagentStop (allow) lets a bound envelope close as abandoned", () => {
  const root = makeRepo();
  boundEnvelope(root);
  beat(root, {});
  const r = close(root, "ORV-1-a");
  assert.equal(r.code, 0, r.stderr);
  assert.equal(closedOf(root).reason, "abandoned");
  assert.equal(closedOf(root).by, undefined);
});

test("--owner closes a bound envelope with no heartbeat as abandoned by the owner", () => {
  const root = makeRepo();
  boundEnvelope(root);
  const r = close(root, "ORV-1-a", "--owner");
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual([closedOf(root).reason, closedOf(root).by], ["abandoned", "owner"]);
});

test("an unknown task, a closed task and bad usage exit 2", () => {
  const root = makeRepo();
  assert.equal(close(root, "ORV-1-nope").code, 2);
  seedTask(root, "ORV-1", "ORV-1-a", {
    envelope: validEnvelope(root),
    result: { contract: "implementer.v1", recorded_at: "2026-10-23T09:00:00.000Z", report: {} },
  });
  assert.equal(close(root, "ORV-1-a").code, 2);
  assert.equal(close(root).code, 2);
  assert.equal(close(root, "ORV-1-a", "--force").code, 2);
});
