import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { seedGate, seedTask, validEnvelope } from "./hook-test-kit.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, "metrics.mjs");
const sampleProjects = join(here, "fixtures", "metrics", "projects");
const CANARY = "CANARY-7c1f";
const SESSION = "33333333-3333-4333-8333-333333333333";

const schema = JSON.parse(readFileSync(join(here, "schemas", "metrics.v1.json"), "utf8"));
const checkSchema = new Ajv2020({ strict: true, allErrors: true }).compile(schema);

/** A checkout (records) and a Claude projects folder (transcripts), both empty. */
function world() {
  const base = realpathSync(mkdtempSync(join(tmpdir(), "ovl-metrics-")));
  const root = join(base, "repo");
  const projects = join(base, "projects");
  mkdirSync(root);
  mkdirSync(projects);
  return { base, root, projects };
}

const collect = (w, ...args) =>
  spawnSync(
    process.execPath,
    [script, "collect", "ORV-1", "--root", w.root, "--projects", w.projects, ...args],
    { encoding: "utf8" },
  );

const metricsOf = (w, issue = "ORV-1") =>
  JSON.parse(readFileSync(join(w.root, ".orivilo", "metrics", `${issue}.json`), "utf8"));

/** Every file under `dir` with its sha256, to prove nothing was changed. */
function hashes(dir) {
  const out = {};
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue;
    const file = join(entry.parentPath, entry.name);
    out[file] = createHash("sha256").update(readFileSync(file)).digest("hex");
  }
  return out;
}

const at = (n) => new Date(Date.UTC(2026, 9, 23, 10, 0, 0) + n * 1000).toISOString();

/** An assistant line of an agent transcript. `blocks` lines share one message id, as Claude Code writes them. */
function assistant({ id, usage, tools = [], ts, version = "2.1.308", model = "claude-opus-5-5" }) {
  const [i, cw, cr, o] = usage;
  return {
    type: "assistant",
    timestamp: ts,
    version,
    isSidechain: true,
    message: {
      id,
      model,
      role: "assistant",
      content: [
        { type: "text", text: CANARY },
        ...tools.map((t) => ({
          type: "tool_use",
          id: t,
          name: "Bash",
          input: { command: CANARY },
        })),
      ],
      usage: {
        input_tokens: i,
        cache_creation_input_tokens: cw,
        cache_read_input_tokens: cr,
        output_tokens: o,
      },
    },
  };
}

function writeAgentTranscript(w, agentId, lines, { raw = [] } = {}) {
  const dir = join(w.projects, "-proj", SESSION, "subagents");
  mkdirSync(dir, { recursive: true });
  const body = [...lines.map((l) => JSON.stringify(l)), ...raw].join("\n");
  writeFileSync(join(dir, `agent-${agentId}.jsonl`), `${body}\n`);
}

function writeMainTranscript(w, lines) {
  const dir = join(w.projects, "-proj");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, `${SESSION}.jsonl`),
    `${lines.map((l) => JSON.stringify(l)).join("\n")}\n`,
  );
}

/** A bound task with a record set. `files` overrides or adds records. */
function seed(w, taskId, { role = "builder", agentId = "aaaa1111", files = {} } = {}) {
  seedTask(w.root, "ORV-1", taskId, {
    envelope: validEnvelope(w.root, { task_id: taskId, role }),
    agent: { agent_id: agentId, agent_type: role, started_at: at(0) },
    ...files,
  });
}

const reviewerResult = (report, dropped = []) => ({
  contract: "reviewer.v1",
  agent_id: "aaaa1111",
  agent_type: "reviewer",
  round: 1,
  recorded_at: at(60),
  report,
  dropped,
});

const finding = (severity) => ({ id: `F-${severity}`, severity, claim: CANARY });

test("AC1: collect writes one valid metrics.v1 row per task", () => {
  const w = world();
  seed(w, "ORV-1-build", {
    files: {
      result: {
        contract: "implementer.v1",
        agent_id: "aaaa1111",
        agent_type: "builder",
        round: 0,
        recorded_at: at(30),
        report: { task_id: "ORV-1-build", result: "done", changed: [], verified: [] },
        dropped: [],
      },
    },
  });
  seedTask(w.root, "ORV-1", "gates", {});
  writeAgentTranscript(w, "aaaa1111", [
    assistant({ id: "m1", usage: [2, 3643, 28976, 116], tools: ["t1"], ts: at(1) }),
  ]);
  const r = collect(w);
  assert.equal(r.status, 0, r.stderr);
  const m = metricsOf(w);
  assert.equal(checkSchema(m), true, JSON.stringify(checkSchema.errors));
  assert.equal(m.metrics_version, 1);
  assert.equal(m.issue, "ORV-1");
  assert.equal(m.tasks.length, 1);
  const t = m.tasks.find((x) => x.task_id === "ORV-1-build");
  assert.equal(t.role, "builder");
  assert.equal(t.agent_id, "aaaa1111");
  assert.equal(t.model, "claude-opus-5-5");
  assert.equal(t.round, 0);
  assert.equal(t.outcome, "done");
  assert.equal(t.runs[0].start, "fresh");
  assert.equal(t.runs[0].tool_uses, 1);
  assert.equal(t.runs[0].session_id, SESSION);
  assert.equal(t.runs[0].duration_ms, 0);
  assert.match(r.stdout, /ORV-1-build/);
});

test("AC2: one message id on three lines counts once", () => {
  const w = world();
  seed(w, "ORV-1-a");
  const same = { id: "m1", usage: [2, 100, 1000, 50], tools: ["t1"] };
  writeAgentTranscript(w, "aaaa1111", [
    assistant({ ...same, ts: at(1) }),
    assistant({ ...same, ts: at(2) }),
    assistant({ ...same, ts: at(3) }),
    assistant({ id: "m2", usage: [1, 10, 100, 5], ts: at(4) }),
  ]);
  assert.equal(collect(w).status, 0);
  const run = metricsOf(w).tasks[0].runs[0];
  assert.equal(run.api_calls, 2);
  assert.deepEqual(run.tokens, {
    input: 3,
    cache_creation: 110,
    cache_read: 1100,
    output: 55,
    total: 1268,
  });
  assert.equal(run.tool_uses, 1);
});

test("AC2b: the last line of a message id holds the real usage, the first a placeholder", () => {
  const w = world();
  seed(w, "ORV-1-a");
  writeAgentTranscript(w, "aaaa1111", [
    assistant({ id: "m1", usage: [2, 100, 1000, 1], ts: at(1), version: "2.1.282" }),
    assistant({ id: "m1", usage: [2, 100, 1000, 500], ts: at(2), version: "2.1.282" }),
  ]);
  assert.equal(collect(w).status, 0);
  const run = metricsOf(w).tasks[0].runs[0];
  assert.equal(run.api_calls, 1);
  assert.equal(run.tokens.output, 500);
  assert.equal(run.tokens.total, 1602);
});

test("AC3: four sums and their total are kept", () => {
  const w = world();
  seed(w, "ORV-1-a");
  writeAgentTranscript(w, "aaaa1111", [
    assistant({ id: "m1", usage: [2, 3643, 28976, 116], ts: at(1) }),
  ]);
  assert.equal(collect(w).status, 0);
  assert.deepEqual(metricsOf(w).tasks[0].runs[0].tokens, {
    input: 2,
    cache_creation: 3643,
    cache_read: 28976,
    output: 116,
    total: 32737,
  });
});

test("AC4: a reported total is kept beside the sum and a gap over 1% is flagged", () => {
  const w = world();
  seed(w, "ORV-1-a");
  writeAgentTranscript(w, "aaaa1111", [
    assistant({ id: "m1", usage: [2, 100, 1000, 50], ts: at(1) }),
  ]);
  const foreground = (total) => ({
    type: "user",
    timestamp: at(2),
    version: "2.1.308",
    toolUseResult: {
      agentId: "aaaa1111",
      totalTokens: total,
      totalDurationMs: 4321,
      totalToolUseCount: 3,
    },
  });
  writeMainTranscript(w, [foreground(1152)]);
  assert.equal(collect(w).status, 0);
  let run = metricsOf(w).tasks[0].runs[0];
  assert.equal(run.reported_total, 1152);
  assert.equal(run.total_mismatch, false);
  assert.equal(run.duration_ms, 4321);

  writeMainTranscript(w, [foreground(900)]);
  assert.equal(collect(w).status, 0);
  run = metricsOf(w).tasks[0].runs[0];
  assert.equal(run.tokens.total, 1152);
  assert.equal(run.reported_total, 900);
  assert.equal(run.total_mismatch, true);
});

test("AC5: kept findings by severity, dropped counted apart", () => {
  const w = world();
  seed(w, "ORV-1-review", {
    role: "reviewer",
    files: {
      result: reviewerResult(
        {
          verdict: "request_changes",
          findings: [finding("Critical"), finding("Important"), finding("Important")],
        },
        [finding("Suggestion")],
      ),
    },
  });
  assert.equal(collect(w).status, 0);
  const t = metricsOf(w).tasks[0];
  assert.deepEqual(t.findings, { critical: 1, important: 2, suggestion: 0, dropped: 1 });
  assert.equal(t.outcome, "request_changes");
  assert.equal(t.round, 1);
});

test("AC6: a SendMessage resume adds a resumed run (recorded 2.1.308 sample)", () => {
  const w = world();
  cpSync(sampleProjects, w.projects, { recursive: true });
  seed(w, "ORV-1-a", { agentId: "a4749f50857d699e3" });
  const r = collect(w);
  assert.equal(r.status, 0, r.stderr);
  const t = metricsOf(w).tasks[0];
  assert.equal(checkSchema(metricsOf(w)), true);
  assert.equal(t.runs.length, 2);
  assert.equal(t.runs[0].start, "fresh");
  assert.equal(t.runs[1].start, "resumed");
  assert.deepEqual(t.runs[0].tokens, {
    input: 10,
    cache_creation: 21511,
    cache_read: 66748,
    output: 2925,
    total: 91194,
  });
  assert.deepEqual(t.runs[1].tokens, {
    input: 4,
    cache_creation: 4732,
    cache_read: 44722,
    output: 601,
    total: 50059,
  });
  assert.deepEqual([t.runs[0].tool_uses, t.runs[1].tool_uses], [6, 1]);
  // Claude Code's notice reports the last call's context size, not the sum over calls.
  assert.deepEqual([t.runs[0].reported_total, t.runs[1].reported_total], [22745, 26735]);
  assert.deepEqual([t.runs[0].duration_ms, t.runs[1].duration_ms], [49037, 10809]);
  assert.equal(t.runs[0].total_mismatch, true);
  assert.equal(t.runs[1].started_at, "2026-10-23T10:52:24.465Z");
  assert.equal(t.runs[0].api_calls, 5);
  assert.equal(t.runs[1].api_calls, 2);
  assert.deepEqual(metricsOf(w).cc_versions, ["2.1.308"]);
});

test("AC7: a task closed no_report stays, with its tokens and outcome", () => {
  const w = world();
  seed(w, "ORV-1-a", { files: { closed: { reason: "no_report", closed_at: at(50) } } });
  writeAgentTranscript(w, "aaaa1111", [assistant({ id: "m1", usage: [1, 2, 3, 4], ts: at(1) })]);
  assert.equal(collect(w).status, 0);
  const t = metricsOf(w).tasks[0];
  assert.equal(t.outcome, "no_report");
  assert.equal(t.round, null);
  assert.equal(t.runs[0].tokens.total, 10);
});

test("AC8: every SubagentStop that sent the agent back is counted", () => {
  const w = world();
  seed(w, "ORV-1-a");
  const beat = (agent, decision, event = "SubagentStop") =>
    JSON.stringify({
      hook: "result-recorder",
      event,
      at: at(5),
      tool: null,
      agent_id: agent,
      decision,
    });
  mkdirSync(join(w.root, ".orivilo"), { recursive: true });
  writeFileSync(
    join(w.root, ".orivilo", "heartbeat.jsonl"),
    [
      beat("aaaa1111", "block"),
      beat("aaaa1111", "block"),
      beat("aaaa1111", "allow"),
      beat("bbbb2222", "block"),
      beat("aaaa1111", "block", "PreToolUse"),
    ].join("\n") + "\n",
  );
  assert.equal(collect(w).status, 0);
  assert.equal(metricsOf(w).tasks[0].sent_back, 2);
});

test("AC9: the envelope's size is kept", () => {
  const w = world();
  seed(w, "ORV-1-a");
  assert.equal(collect(w).status, 0);
  const file = join(w.root, ".orivilo", "runs", "ORV-1", "ORV-1-a", "envelope.json");
  const t = metricsOf(w).tasks[0];
  assert.deepEqual(t.envelope, { bytes: statSync(file).size, context_pointers: 1, facts: 1 });
});

test("AC10: a bound task with no transcript gives null numbers, exit 0 and a named gap", () => {
  const w = world();
  seed(w, "ORV-1-a");
  const r = collect(w);
  assert.equal(r.status, 0);
  assert.match(r.stderr, /ORV-1-a/);
  assert.match(r.stderr, /agent transcript/);
  const t = metricsOf(w).tasks[0];
  assert.deepEqual(t.missing, ["agent_transcript"]);
  assert.equal(t.model, null);
  assert.equal(t.runs[0].tokens, null);
  assert.equal(t.runs[0].tool_uses, null);
  assert.equal(t.runs[0].duration_ms, null);
  assert.equal(t.runs[0].api_calls, null);
});

test("AC11: a line that is not JSON is skipped and counted", () => {
  const w = world();
  seed(w, "ORV-1-a");
  writeAgentTranscript(w, "aaaa1111", [assistant({ id: "m1", usage: [1, 1, 1, 1], ts: at(1) })], {
    raw: [`not json ${CANARY}`],
  });
  assert.equal(collect(w).status, 0);
  const m1 = metricsOf(w);
  assert.equal(m1.skipped_lines, 1);
  assert.equal(m1.tasks[0].runs[0].tokens.total, 4);
});

test("AC12: a canary in every text field reaches no file, stdout or stderr", () => {
  const w = world();
  seedTask(w.root, "ORV-1", "ORV-1-a", {
    envelope: validEnvelope(w.root, {
      task_id: "ORV-1-a",
      objective: CANARY,
      facts: [{ claim: CANARY, checked_by: CANARY }],
      boundaries: [CANARY],
      done_when: [CANARY],
    }),
    agent: { agent_id: "aaaa1111", agent_type: "builder", started_at: at(0) },
    result: reviewerResult({ verdict: "approve", findings: [], summary: CANARY }, [
      { ...finding("Suggestion"), claim: CANARY },
    ]),
  });
  writeAgentTranscript(
    w,
    "aaaa1111",
    [
      { type: "user", timestamp: at(0), message: { role: "user", content: CANARY } },
      assistant({ id: "m1", usage: [1, 1, 1, 1], tools: ["t1"], ts: at(1) }),
      {
        type: "user",
        timestamp: at(1),
        message: { role: "user", content: [{ type: "tool_result", content: CANARY }] },
        toolUseResult: { stdout: CANARY },
      },
    ],
    { raw: [`{"broken": "${CANARY}`] },
  );
  writeFileSync(
    join(w.projects, "-proj", SESSION, "subagents", "agent-aaaa1111.meta.json"),
    JSON.stringify({ agentType: "builder", description: CANARY, requestShape: "x" }),
  );
  writeMainTranscript(w, [
    {
      type: "user",
      timestamp: at(1),
      version: "2.1.308",
      message: { role: "user", content: [{ type: "tool_result", content: CANARY }] },
      toolUseResult: {
        resumedAgentId: "aaaa1111",
        message: CANARY,
        last_assistant_message: CANARY,
      },
    },
    {
      type: "queue-operation",
      timestamp: at(2),
      content: `<task-notification><task-id>aaaa1111</task-id><summary>${CANARY}</summary><usage><subagent_tokens>4</subagent_tokens><tool_uses>1</tool_uses><duration_ms>900</duration_ms></usage></task-notification>`,
    },
  ]);
  mkdirSync(join(w.root, ".orivilo"), { recursive: true });
  writeFileSync(
    join(w.root, ".orivilo", "heartbeat.jsonl"),
    `${JSON.stringify({ event: "SubagentStop", agent_id: "aaaa1111", decision: "block", tool: CANARY })}\n`,
  );
  const r = collect(w);
  assert.equal(r.status, 0, r.stderr);
  const seen =
    r.stdout + r.stderr + readFileSync(join(w.root, ".orivilo", "metrics", "ORV-1.json"), "utf8");
  assert.equal(seen.includes("CANARY"), false);
  for (const file of Object.keys(hashes(join(w.root, ".orivilo", "metrics")))) {
    assert.equal(readFileSync(file, "utf8").includes("CANARY"), false);
  }
});

test("AC13: no transcript path or home folder in any output", () => {
  const w = world();
  seed(w, "ORV-1-a");
  writeAgentTranscript(w, "aaaa1111", [assistant({ id: "m1", usage: [1, 1, 1, 1], ts: at(1) })]);
  const ok = collect(w);
  const gap = collect({ ...w, projects: join(w.base, "no-such-folder") });
  const bad = spawnSync(
    process.execPath,
    [script, "collect", "ORV-1", "--root", join(w.base, "nope")],
    {
      encoding: "utf8",
    },
  );
  const seen =
    ok.stdout +
    ok.stderr +
    gap.stdout +
    gap.stderr +
    bad.stdout +
    bad.stderr +
    readFileSync(join(w.root, ".orivilo", "metrics", "ORV-1.json"), "utf8");
  for (const forbidden of [w.base, w.projects, homedir(), ".jsonl", "/Users/"]) {
    assert.equal(seen.includes(forbidden), false, `output holds ${forbidden}`);
  }
  assert.equal(bad.status, 2);
});

test("AC14: records and transcripts are byte for byte unchanged; writes are under .orivilo/metrics", () => {
  const w = world();
  cpSync(sampleProjects, w.projects, { recursive: true });
  seed(w, "ORV-1-a", { agentId: "a4749f50857d699e3" });
  mkdirSync(join(w.root, ".orivilo"), { recursive: true });
  writeFileSync(join(w.root, ".orivilo", "heartbeat.jsonl"), "");
  const beforeProjects = hashes(w.projects);
  const beforeRoot = hashes(w.root);
  assert.equal(collect(w).status, 0);
  assert.deepEqual(hashes(w.projects), beforeProjects);
  const afterRoot = hashes(w.root);
  const added = Object.keys(afterRoot).filter((f) => !(f in beforeRoot));
  assert.deepEqual(added, [join(w.root, ".orivilo", "metrics", "ORV-1.json")]);
  for (const [file, hash] of Object.entries(beforeRoot)) assert.equal(afterRoot[file], hash);
});

test("AC15: a transcript version not recorded on gives a warning and still counts", () => {
  const w = world();
  seed(w, "ORV-1-a");
  writeAgentTranscript(w, "aaaa1111", [
    assistant({ id: "m1", usage: [1, 1, 1, 1], ts: at(1), version: "9.9.9" }),
    assistant({ id: "m2", usage: [1, 1, 1, 1], ts: at(2), version: "2.1.308" }),
  ]);
  const r = collect(w);
  assert.equal(r.status, 0);
  assert.match(r.stderr, /9\.9\.9/);
  assert.doesNotMatch(r.stderr, /2\.1\.308/);
  const m1 = metricsOf(w);
  assert.deepEqual(m1.cc_versions, ["2.1.308", "9.9.9"]);
  assert.equal(m1.tasks[0].runs[0].tokens.total, 8);
});

test("a message without a usage field gives null tokens, never 0", () => {
  const w = world();
  seed(w, "ORV-1-a");
  const partial = assistant({ id: "m1", usage: [1, 1, 1, 1], ts: at(1) });
  delete partial.message.usage.cache_read_input_tokens;
  writeAgentTranscript(w, "aaaa1111", [partial]);
  assert.equal(collect(w).status, 0);
  const run = metricsOf(w).tasks[0].runs[0];
  assert.equal(run.tokens, null);
  assert.equal(run.api_calls, 1);
});

test("a model id with a path or space is not recorded", () => {
  const w = world();
  seed(w, "ORV-1-a");
  writeAgentTranscript(w, "aaaa1111", [
    assistant({ id: "m1", usage: [1, 1, 1, 1], ts: at(1), model: "my model with spaces" }),
  ]);
  assert.equal(collect(w).status, 0);
  assert.equal(metricsOf(w).tasks[0].model, null);
});

test("only gate runs are counted in gates, stub runs are not", () => {
  const w = world();
  seed(w, "ORV-1-a");
  const dir = join(w.root, ".orivilo", "runs", "ORV-1");
  const record = (ok, steps_source) => ({ ok, steps_source });
  const files = [record(true, "gate"), record(false, "gate"), record(false, "stub")];
  files.forEach((g, i) => {
    mkdirSync(join(dir, "gates"), { recursive: true });
    writeFileSync(join(dir, "gates", `g${i}.json`), JSON.stringify(g));
  });
  assert.equal(collect(w).status, 0);
  assert.deepEqual(metricsOf(w).gates, { passed: 1, failed: 1 });
});

test("a SubagentStop that failed closed (error) also counts as sent back", () => {
  const w = world();
  seed(w, "ORV-1-a");
  const beat = (decision) =>
    JSON.stringify({ event: "SubagentStop", agent_id: "aaaa1111", decision });
  mkdirSync(join(w.root, ".orivilo"), { recursive: true });
  writeFileSync(
    join(w.root, ".orivilo", "heartbeat.jsonl"),
    [beat("block"), beat("error"), beat("allow")].join("\n") + "\n",
  );
  assert.equal(collect(w).status, 0);
  assert.equal(metricsOf(w).tasks[0].sent_back, 2);
});

test("a version on an unrelated main-session line is not recorded or warned about", () => {
  const w = world();
  seed(w, "ORV-1-a");
  writeAgentTranscript(w, "aaaa1111", [assistant({ id: "m1", usage: [1, 1, 1, 1], ts: at(1) })]);
  writeMainTranscript(w, [
    { type: "user", timestamp: at(0), version: "9.9.9", message: { role: "user", content: "x" } },
  ]);
  const r = collect(w);
  assert.equal(r.status, 0);
  assert.doesNotMatch(r.stderr, /9\.9\.9/);
  assert.deepEqual(metricsOf(w).cc_versions, ["2.1.308"]);
});

test("an unexpected failure exits 1 with only the error code or name, never its text", () => {
  const w = world();
  seed(w, "ORV-1-a", { files: {} });
  const file = join(w.root, ".orivilo", "runs", "ORV-1", "ORV-1-a", "result.json");
  writeFileSync(file, `${CANARY} is not json`);
  const r = collect(w);
  assert.equal(r.status, 1);
  const seen = r.stdout + r.stderr;
  for (const forbidden of ["CANARY", w.base, homedir(), ".jsonl"]) {
    assert.equal(seen.includes(forbidden), false, `output holds ${forbidden}`);
  }
});

test("usage errors exit 2", () => {
  for (const args of [[], ["collect"], ["collect", "not-an-issue"], ["wat", "ORV-1"]]) {
    const r = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
    assert.equal(r.status, 2, args.join(" "));
  }
});

// Slice 2: report and session.

const run = (w, command, ...args) =>
  spawnSync(
    process.execPath,
    [
      script,
      command,
      ...args,
      ...(command === "session" ? ["--projects", w.projects] : ["--root", w.root]),
    ],
    { encoding: "utf8" },
  );

/** The cells of the table row whose first cell is `label`, in the first table that has it. */
function row(stdout, label) {
  const line = stdout.split("\n").find((l) => l.startsWith(`| ${label} |`));
  assert.ok(line, `no row for ${label}`);
  return line
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim());
}

/** Rows whose first two cells are `label` and `second`. */
function row2(stdout, label, second) {
  const line = stdout.split("\n").find((l) => l.startsWith(`| ${label} | ${second} |`));
  assert.ok(line, `no row for ${label} ${second}`);
  return line
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim());
}

function collectIssue(w, issue) {
  const r = spawnSync(
    process.execPath,
    [script, "collect", issue, "--root", w.root, "--projects", w.projects],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr);
}

function reportWorld() {
  const w = world();
  cpSync(sampleProjects, w.projects, { recursive: true });
  seed(w, "ORV-1-build");
  seed(w, "ORV-1-review", {
    role: "reviewer",
    agentId: "a4749f50857d699e3",
    files: {
      result: reviewerResult({ verdict: "request_changes", findings: [finding("Critical")] }, [
        finding("Suggestion"),
      ]),
    },
  });
  writeAgentTranscript(w, "aaaa1111", [
    assistant({ id: "m1", usage: [2, 3643, 28976, 116], tools: ["t1"], ts: at(1) }),
  ]);
  seedTask(w.root, "ORV-2", "ORV-2-build", {
    envelope: validEnvelope(w.root, { task_id: "ORV-2-build", issue: "ORV-2" }),
    agent: { agent_id: "bbbb2222", agent_type: "builder", started_at: at(0) },
  });
  writeAgentTranscript(w, "bbbb2222", [assistant({ id: "m9", usage: [1, 2, 3, 4], ts: at(1) })]);
  // two send-backs for the builder aaaa1111, one for the reviewer
  const beat = (agent, decision) =>
    JSON.stringify({
      hook: "result-recorder",
      event: "SubagentStop",
      at: at(5),
      tool: null,
      agent_id: agent,
      decision,
    });
  mkdirSync(join(w.root, ".orivilo"), { recursive: true });
  writeFileSync(
    join(w.root, ".orivilo", "heartbeat.jsonl"),
    [
      beat("aaaa1111", "block"),
      beat("aaaa1111", "error"),
      beat("aaaa1111", "allow"),
      beat("a4749f50857d699e3", "block"),
    ].join("\n") + "\n",
  );
  // two gate passes and one failure for ORV-1, none for ORV-2
  [true, true, false].forEach((ok, i) =>
    seedGate(w.root, "ORV-1", `g${i}`, { ok, steps_source: "gate" }),
  );
  collectIssue(w, "ORV-1");
  collectIssue(w, "ORV-2");
  return w;
}

test("AC16: report prints tables by role and by issue with every metrics.v1 sum", () => {
  const w = reportWorld();
  const r = run(w, "report", "ORV-1", "ORV-2");
  assert.equal(r.status, 0, r.stderr);
  // label, tasks, runs, runs without tokens, calls, 4 kinds, total, tool uses, duration, findings, sent back
  assert.deepEqual(row(r.stdout, "builder"), [
    ...["builder", "2", "2", "0", "2", "3", "3645", "28979", "120", "32747", "1", "0"],
    ...["0", "0", "0", "0", "2"],
  ]);
  assert.deepEqual(row(r.stdout, "reviewer"), [
    ...["reviewer", "1", "2", "0", "7", "14", "26243", "111470", "3526", "141253", "7", "59846"],
    ...["1", "0", "0", "1", "1"],
  ]);
  // by issue: the same columns, then gates passed and failed
  assert.deepEqual(row(r.stdout, "ORV-1"), [
    ...["ORV-1", "2", "3", "0", "8", "16", "29886", "140446", "3642", "173990", "8", "59846"],
    ...["1", "0", "0", "1", "3", "2", "1"],
  ]);
  assert.deepEqual(row(r.stdout, "ORV-2"), [
    ...["ORV-2", "1", "1", "0", "1", "1", "2", "3", "4", "10", "0", "0"],
    ...["0", "0", "0", "0", "0", "0", "0"],
  ]);
  assert.match(r.stdout, /not a cost/);
  assert.match(r.stdout, /orchestrator/);

  const out = run(w, "report", "ORV-1", "ORV-2", "--out", "batch-1");
  assert.equal(out.status, 0, out.stderr);
  assert.equal(readFileSync(join(w.root, ".orivilo", "metrics", "batch-1.md"), "utf8"), r.stdout);
  assert.match(out.stdout, /batch-1\.md/);
});

test("AC17: fresh and resumed runs are apart, with runs, median tokens and median tool uses", () => {
  const w = reportWorld();
  const r = run(w, "report", "ORV-1", "ORV-2");
  assert.deepEqual(row2(r.stdout, "reviewer", "fresh"), [
    "reviewer",
    "fresh",
    "1",
    "1",
    "91194",
    "6",
  ]);
  assert.deepEqual(row2(r.stdout, "reviewer", "resumed"), [
    "reviewer",
    "resumed",
    "1",
    "1",
    "50059",
    "1",
  ]);
  // two builders: 32737 and 10, tool uses 1 and 0, medians of an even count are halved
  assert.deepEqual(row2(r.stdout, "builder", "fresh"), [
    "builder",
    "fresh",
    "2",
    "2",
    "16373.5",
    "0.5",
  ]);
});

test("AC17b: a median takes the middle run and leaves out a run without tokens", () => {
  const w = world();
  for (const [i, total] of [10, 30, 20].entries()) {
    const id = `cccc${i}`;
    seed(w, `ORV-1-t${i}`, { agentId: id });
    writeAgentTranscript(w, id, [assistant({ id: `m${i}`, usage: [total, 0, 0, 0], ts: at(1) })]);
  }
  seed(w, "ORV-1-t9", { agentId: "cccc9" });
  collectIssue(w, "ORV-1");
  const r = run(w, "report", "ORV-1");
  assert.deepEqual(row2(r.stdout, "builder", "fresh"), ["builder", "fresh", "4", "3", "20", "0"]);
  assert.equal(row(r.stdout, "builder")[3], "1");
});

test("AC17c: a median is the middle value, not the mean, of a skewed set", () => {
  const w = world();
  for (const [i, total] of [10, 900, 20].entries()) {
    const id = `dddd${i}`;
    seed(w, `ORV-1-t${i}`, { agentId: id });
    writeAgentTranscript(w, id, [assistant({ id: `m${i}`, usage: [total, 0, 0, 0], ts: at(1) })]);
  }
  collectIssue(w, "ORV-1");
  const r = run(w, "report", "ORV-1");
  assert.deepEqual(row2(r.stdout, "builder", "fresh"), ["builder", "fresh", "3", "3", "20", "0"]);
});

test("report: a missing metrics file or a bad issue key exits 2 with no path", () => {
  const w = world();
  const missing = run(w, "report", "ORV-9");
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /ORV-9/);
  assert.equal((missing.stdout + missing.stderr).includes(w.base), false);
  assert.equal(run(w, "report").status, 2);
  assert.equal(run(w, "report", "nope").status, 2);
});

test("report: --out takes a plain name and writes nothing outside .orivilo/metrics", () => {
  const w = reportWorld();
  const before = hashes(w.base);
  for (const out of ["../x", "../../escaped", "a/b", "x.md", ""]) {
    const r = run(w, "report", "ORV-1", "--out", out);
    assert.equal(r.status, 2, `--out ${out}`);
    assert.match(r.stderr, /--out/);
  }
  assert.deepEqual(hashes(w.base), before);
});

test("report: a metrics file that breaks metrics.v1 exits 1 and its text is not printed", () => {
  const w = reportWorld();
  const file = join(w.root, ".orivilo", "metrics", "ORV-1.json");
  const bad = { ...JSON.parse(readFileSync(file, "utf8")), note: CANARY };
  writeFileSync(file, JSON.stringify(bad));
  const r = run(w, "report", "ORV-1");
  assert.equal(r.status, 1);
  assert.equal((r.stdout + r.stderr).includes("CANARY"), false);
});

test("report: each issue shows its skipped lines and Claude Code versions", () => {
  const w = reportWorld();
  const r = run(w, "report", "ORV-1", "ORV-2");
  assert.match(r.stdout, /## Reading notes/);
  assert.deepEqual(row2(r.stdout, "ORV-1", "0").slice(0, 3), ["ORV-1", "0", "2.1.308"]);
  assert.deepEqual(row2(r.stdout, "ORV-2", "0").slice(0, 3), ["ORV-2", "0", "2.1.308"]);
});

/** One key phrase per honest limit of the spec; every report and session footer must say each. */
const LIMITS = [
  /orchestrator's own tokens/,
  /not a cost/,
  /Cache write and cache read/,
  /Waiting is not measured/,
  /do not show whether a review was good/,
  /Runs outside the records/,
  /without an envelope check/,
  /a sign, not proof/,
  /can be edited/,
  /never a guessed 0/,
  /before collect runs/,
];

test("report and session footers state every honest limit", () => {
  const w = reportWorld();
  cpSync(sampleProjects, w.projects, { recursive: true });
  const outputs = [
    run(w, "report", "ORV-1").stdout,
    run(w, "session", "22222222-2222-4222-8222-222222222222").stdout,
  ];
  for (const out of outputs) {
    for (const limit of LIMITS) assert.match(out, limit);
  }
});

test("session: skipped lines and versions are printed", () => {
  const w = world();
  seed(w, "ORV-1-a");
  writeAgentTranscript(w, "aaaa1111", [assistant({ id: "m1", usage: [1, 1, 1, 1], ts: at(1) })], {
    raw: ["not json", "also not json"],
  });
  const r = run(w, "session", SESSION);
  assert.match(r.stdout, /skipped lines 2, Claude Code versions 2\.1\.308/);
});

test("AC18: session counts each completion notice once and sums the main session apart", () => {
  const w = world();
  seed(w, "ORV-1-a");
  writeAgentTranscript(w, "aaaa1111", [
    assistant({ id: "m1", usage: [1, 10, 100, 4], tools: ["t1"], ts: at(1) }),
  ]);
  const notice = (ts, type) => ({
    type,
    timestamp: ts,
    version: "2.1.308",
    content: `<task-notification><task-id>aaaa1111</task-id><usage><subagent_tokens>115</subagent_tokens><tool_uses>1</tool_uses><duration_ms>900</duration_ms></usage></task-notification>`,
  });
  const mainCall = { id: "main1", usage: [5, 20, 200, 10] };
  writeMainTranscript(w, [
    assistant({ ...mainCall, ts: at(0) }),
    assistant({ ...mainCall, ts: at(0) }),
    notice(at(2), "queue-operation"),
    notice(at(3), "user"),
  ]);
  const r = run(w, "session", SESSION);
  assert.equal(r.status, 0, r.stderr);
  const lines = r.stdout.split("\n").filter((l) => l.startsWith("| aaaa1111 |"));
  assert.equal(lines.length, 1);
  const cells = row(r.stdout, "aaaa1111");
  // agent, type, start, calls, 4 kinds, total, notice, tool uses, duration, started
  assert.deepEqual(cells.slice(0, 11), [
    ...["aaaa1111", "-", "fresh", "1", "1", "10", "100", "4", "115", "115", "1"],
  ]);
  assert.match(
    r.stdout,
    /main session, not per task: calls 1, input 5, cache_creation 20, cache_read 200, output 10, total 235/,
  );
  assert.match(r.stdout, /runs 1, with a notice 1/);
});

test("AC18b: session splits resumed runs and lists the notice figure beside tokens.total", () => {
  const w = world();
  cpSync(sampleProjects, w.projects, { recursive: true });
  const r = run(w, "session", "22222222-2222-4222-8222-222222222222");
  assert.equal(r.status, 0, r.stderr);
  const fresh = row2(r.stdout, "a4749f50857d699e3", "-");
  assert.equal(fresh[2], "fresh");
  assert.equal(fresh[8], "91194");
  assert.equal(fresh[9], "22745");
  const resumed = r.stdout.split("\n").find((l) => l.includes("| resumed |"));
  assert.match(resumed, /\| 50059 \| 26735 \|/);
  assert.match(r.stdout, /runs 2, with a notice 2/);
  assert.match(r.stdout, /one-call runs 0/);
});

test("session: a one-call run is checked against its notice and an unknown session exits 2", () => {
  const w = world();
  seed(w, "ORV-1-a");
  writeAgentTranscript(w, "aaaa1111", [assistant({ id: "m1", usage: [1, 10, 100, 4], ts: at(1) })]);
  writeMainTranscript(w, [
    {
      type: "queue-operation",
      timestamp: at(2),
      version: "2.1.308",
      content: `<task-id>aaaa1111</task-id><usage><subagent_tokens>115</subagent_tokens><tool_uses>0</tool_uses><duration_ms>5</duration_ms></usage>`,
    },
  ]);
  const r = run(w, "session", SESSION);
  assert.match(r.stdout, /one-call runs 1, notice within 1% of tokens.total 1/);
  const none = run(w, "session", "44444444-4444-4444-8444-444444444444");
  assert.equal(none.status, 2);
  assert.equal(run(w, "session", "../x").status, 2);
});

test("AC12b: a canary in every text field reaches no output of report or session", () => {
  const w = world();
  seed(w, "ORV-1-a", {
    files: { result: reviewerResult({ verdict: "approve", findings: [], summary: CANARY }) },
  });
  writeAgentTranscript(w, "aaaa1111", [
    { type: "user", timestamp: at(0), message: { role: "user", content: CANARY } },
    assistant({ id: "m1", usage: [1, 1, 1, 1], tools: ["t1"], ts: at(1) }),
  ]);
  writeFileSync(
    join(w.projects, "-proj", SESSION, "subagents", "agent-aaaa1111.meta.json"),
    JSON.stringify({ agentType: CANARY, description: CANARY, requestShape: CANARY }),
  );
  writeMainTranscript(w, [
    assistant({ id: "main1", usage: [1, 1, 1, 1], ts: at(0) }),
    {
      type: "queue-operation",
      timestamp: at(2),
      version: "2.1.308",
      content: `<task-id>aaaa1111</task-id><summary>${CANARY}</summary><usage><subagent_tokens>4</subagent_tokens><tool_uses>1</tool_uses><duration_ms>9</duration_ms></usage>`,
    },
  ]);
  collectIssue(w, "ORV-1");
  const results = [
    run(w, "report", "ORV-1"),
    run(w, "report", "ORV-1", "--out", "canary"),
    run(w, "session", SESSION),
  ];
  const seen =
    results.map((r) => r.stdout + r.stderr).join("") +
    readFileSync(join(w.root, ".orivilo", "metrics", "canary.md"), "utf8");
  for (const r of results) assert.equal(r.status, 0, r.stderr);
  for (const forbidden of ["CANARY", w.base, w.projects, homedir(), ".jsonl", "/Users/"]) {
    assert.equal(seen.includes(forbidden), false, `output holds ${forbidden}`);
  }
});

test("report and session change no record and no transcript", () => {
  const w = reportWorld();
  const before = { ...hashes(w.projects), ...hashes(w.root) };
  run(w, "report", "ORV-1", "ORV-2");
  run(w, "session", "22222222-2222-4222-8222-222222222222");
  const after = { ...hashes(w.projects), ...hashes(w.root) };
  assert.deepEqual(after, before);
});
