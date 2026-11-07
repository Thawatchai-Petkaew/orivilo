import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  agentInput,
  fixture,
  heartbeatLines,
  hook,
  makeRepo,
  registeredCommands,
  repoRoot,
  runCommand,
  runNode,
  seedBoundBuilder,
  seedTask,
  seedVerdict,
  validEnvelope,
} from "./hook-test-kit.mjs";
import { reworkState, readIssue } from "./records.mjs";

const closeHook = hook("owner-close.mjs");
const REAL = "PostToolUse-AskUserQuestion-from-transcript";
const QUESTION =
  "ORV-1-b is bound to agent a-b (builder, started 2026-10-23T09:00:00.000Z). Close it?";
const CLOSE = "Close envelope ORV-1-b";

/** A stuck builder envelope: open, bound, no final SubagentStop. */
const stuck = (root, id = "ORV-1-b") =>
  seedTask(root, "ORV-1", id, {
    envelope: validEnvelope(root, { task_id: id }),
    agent: { agent_id: `a-${id}`, agent_type: "builder", started_at: "2026-10-23T09:00:00.000Z" },
  });

function formOf(root, questions, extra = {}) {
  const base = fixture(REAL);
  const shaped = questions.map(([question, labels]) => ({
    ...base.tool_input.questions[0],
    question,
    options: labels.map((label) => ({ label, description: label })),
  }));
  return {
    ...base,
    cwd: root,
    tool_input: { questions: shaped },
    tool_response: {
      questions: shaped,
      answers: Object.fromEntries(questions.map(([question, , answer]) => [question, answer])),
    },
    ...extra,
  };
}

function form(root, { answer = CLOSE, options, extra = {} } = {}) {
  return formOf(root, [[QUESTION, options ?? [CLOSE, "Keep open"], answer]], extra);
}

const closedFile = (root, id = "ORV-1-b") => join(root, ".orivilo/runs/ORV-1", id, "closed.json");
const closedOf = (root, id) => JSON.parse(readFileSync(closedFile(root, id), "utf8"));
const stopBeat = (root, agentId) => {
  mkdirSync(join(root, ".orivilo"), { recursive: true });
  appendFileSync(
    join(root, ".orivilo", "heartbeat.jsonl"),
    `${JSON.stringify({
      hook: "result-recorder",
      event: "SubagentStop",
      at: new Date().toISOString(),
      tool: null,
      agent_id: agentId,
      decision: "allow",
    })}\n`,
  );
};

function refused(root, input, pattern) {
  const r = runNode(closeHook, input);
  assert.equal(r.code, 2, r.stderr);
  assert.match(r.stderr, pattern);
  assert.equal(existsSync(closedFile(root)), false);
}

test("AC 23: the clicked English option closes the envelope and the record quotes the form", () => {
  const root = makeRepo();
  stuck(root);
  const r = runNode(closeHook, form(root));
  assert.equal(r.code, 0, r.stderr);
  const rec = closedOf(root);
  assert.equal(rec.reason, "abandoned");
  assert.equal(rec.by, "owner");
  assert.equal(rec.source, "question_form");
  assert.equal(rec.question, QUESTION);
  assert.deepEqual(rec.options, [CLOSE, "Keep open"]);
  assert.equal(rec.answer, CLOSE);
  assert.ok(!Number.isNaN(Date.parse(rec.answered_at)));
  assert.equal(rec.tool_use_id, fixture(REAL).tool_use_id);
  assert.equal(rec.session_id, fixture(REAL).session_id);
  assert.ok(rec.transcript_path.endsWith(".jsonl"));
  assert.equal(heartbeatLines(root)[0].hook, "owner-close");
  // The next builder envelope passes the open-envelope check.
  const next = runNode(
    hook("envelope-guard.mjs"),
    agentInput(root, validEnvelope(root, { task_id: "ORV-1-c" })),
  );
  assert.equal(next.code, 0, next.stderr);
});

test("AC 24: the Thai option closes the envelope the same way", () => {
  const root = makeRepo();
  stuck(root);
  const label = "ปิดงาน ORV-1-b";
  const r = runNode(closeHook, form(root, { answer: label, options: [label, "ยังไม่ปิด"] }));
  assert.equal(r.code, 0, r.stderr);
  assert.equal(closedOf(root).answer, label);
  assert.equal(closedOf(root).reason, "abandoned");
  assert.equal(closedOf(root).source, "question_form");
});

test("AC 25: text typed under Other closes nothing, even the close phrase", () => {
  const root = makeRepo();
  stuck(root);
  refused(root, form(root, { options: ["Keep open", "Something else"] }), /option label/);
  refused(root, form(root, { answer: "close envelope ORV-1-b" }), /option label/);
});

test("AC 26: a subagent's form closes nothing", () => {
  const root = makeRepo();
  stuck(root);
  refused(
    root,
    form(root, { extra: { agent_id: "a-x", agent_type: "builder" } }),
    /subagent asked/,
  );
});

test("AC 27: an envelope that was never bound is refused with the terminal command", () => {
  const root = makeRepo();
  seedTask(root, "ORV-1", "ORV-1-b", { envelope: validEnvelope(root, { task_id: "ORV-1-b" }) });
  refused(
    root,
    form(root),
    /ORV-1-b was never bound; close it with: node scripts\/ovl\/close-envelope\.mjs ORV-1-b/,
  );
});

test("AC 28: an envelope whose final SubagentStop was recorded is refused", () => {
  const root = makeRepo();
  stuck(root);
  stopBeat(root, "a-ORV-1-b");
  refused(
    root,
    form(root),
    /ORV-1-b has stopped; close it with: node scripts\/ovl\/close-envelope\.mjs ORV-1-b/,
  );
});

test("AC 29: an unknown task id and an already closed one are refused", () => {
  const root = makeRepo();
  const label = "Close envelope ORV-1-zz";
  const unknown = runNode(closeHook, form(root, { answer: label, options: [label, "Keep open"] }));
  assert.equal(unknown.code, 2);
  assert.match(unknown.stderr, /ORV-1-zz/);
  assert.match(unknown.stderr, /no such envelope/);

  stuck(root);
  assert.equal(runNode(closeHook, form(root)).code, 0);
  const again = runNode(closeHook, form(root));
  assert.equal(again.code, 2);
  assert.match(again.stderr, /ORV-1-b/);
  assert.match(again.stderr, /already closed/);
});

test("AC 30: a task the input lists as running is refused; one not listed, or no field, is closed", () => {
  const listed = { id: "a-ORV-1-b", type: "subagent", status: "running", description: "x" };
  const root = makeRepo();
  stuck(root);
  refused(
    root,
    form(root, { extra: { background_tasks: [listed] } }),
    /ORV-1-b is still running in this session/,
  );
  // Another agent running, or this agent listed with another status, does not stop the owner.
  const other = { ...listed, id: "a-other" };
  const done = { ...listed, status: "completed" };
  const r = runNode(closeHook, form(root, { extra: { background_tasks: [other, done] } }));
  assert.equal(r.code, 0, r.stderr);

  const root2 = makeRepo();
  stuck(root2);
  assert.equal(runNode(closeHook, form(root2)).code, 0);
});

test("AC 31: malformed JSON and a missing field fail closed with no record", () => {
  const root = makeRepo();
  stuck(root);
  const bad = runNode(closeHook, "{not json");
  assert.equal(bad.code, 2);
  assert.match(bad.stderr, /owner-close failed closed/);

  const missing = {
    tool_use_id: (f) => delete f.tool_use_id,
    session_id: (f) => delete f.session_id,
    transcript_path: (f) => delete f.transcript_path,
    question: (f) => {
      f.tool_input.questions[0].question = "";
    },
    "option label": (f) => {
      f.tool_input.questions[0].options[0] = {};
    },
    answer: (f) => {
      f.tool_response.answers = {};
    },
  };
  for (const [what, strip] of Object.entries(missing)) {
    const input = form(root);
    strip(input);
    const r = runNode(closeHook, input);
    assert.equal(r.code, 2, what);
    assert.match(r.stderr, /owner-close failed closed/, what);
    assert.ok(r.stderr.includes(what.replace(" ", "_")) || r.stderr.includes(what), what);
    assert.equal(existsSync(closedFile(root)), false, what);
  }
});

test("AC 32: declining writes nothing, exits 0 and says nothing", () => {
  for (const label of ["Keep open", "ยังไม่ปิด"]) {
    const root = makeRepo();
    stuck(root);
    const r = runNode(closeHook, form(root, { answer: label, options: [CLOSE, label] }));
    assert.equal(r.code, 0, label);
    assert.equal(r.stderr, "", label);
    assert.equal(existsSync(closedFile(root)), false, label);
  }
});

test("a decline label that contains the close phrase closes nothing", () => {
  for (const label of [
    "Do not close envelope ORV-1-b",
    "Close envelope ORV-1-b later",
    "Close envelope ORV-1-b ORV-1-c",
    "ปิดงาน ORV-1-b ไม่",
  ]) {
    const root = makeRepo();
    stuck(root);
    const r = runNode(closeHook, form(root, { answer: label, options: [label, "Keep open"] }));
    assert.equal(r.code, 2, label);
    assert.equal(existsSync(closedFile(root)), false, label);
  }
});

test("the exact label closes when trimmed or in any case of the English phrase", () => {
  for (const label of ["CLOSE ENVELOPE ORV-1-b", "  Close envelope ORV-1-b  "]) {
    const root = makeRepo();
    stuck(root);
    const r = runNode(closeHook, form(root, { answer: label, options: [label, "Keep open"] }));
    assert.equal(r.code, 0, `${label}: ${r.stderr}`);
    assert.equal(closedOf(root).reason, "abandoned");
  }
});

test("AC 34: a builder envelope closed by the form counts as a rework round", () => {
  const root = makeRepo();
  seedBoundBuilder(root, "ORV-1", "ORV-1-b0", "2026-10-23T07:30:00.000Z");
  seedVerdict(root, "ORV-1", "ORV-1-rev", "request_changes", "2026-10-23T08:00:00.000Z");
  seedBoundBuilder(root, "ORV-1", "ORV-1-r1", "2026-10-23T08:30:00.000Z");
  seedVerdict(root, "ORV-1", "ORV-1-revb", "request_changes", "2026-10-23T08:45:00.000Z");
  stuck(root);
  assert.equal(reworkState(readIssue(root, "ORV-1")).rounds, 2);
  assert.equal(runNode(closeHook, form(root)).code, 0);
  assert.equal(reworkState(readIssue(root, "ORV-1")).rounds, 2);
});

test("AC 35: owner-close is registered on PostToolUse(AskUserQuestion) and on no other event", () => {
  const found = registeredCommands().filter((c) => c.command.includes("owner-close"));
  assert.equal(found.length, 1);
  assert.equal(found[0].event, "PostToolUse");
  assert.equal(found[0].matcher, "AskUserQuestion");
  assert.match(found[0].command, /\|\| exit 2$/);
});

test("the registered command closes through the shell exactly as settings.json runs it", () => {
  const root = makeRepo();
  stuck(root);
  const entry = registeredCommands().find((c) => c.command.includes("owner-close"));
  const r = runCommand(entry.command, form(root), { CLAUDE_PROJECT_DIR: repoRoot });
  assert.equal(r.code, 0, r.stderr);
  assert.equal(closedOf(root).source, "question_form");
});

test("a late SubagentStop for an envelope closed by the form writes no result", () => {
  const root = makeRepo();
  stuck(root);
  assert.equal(runNode(closeHook, form(root)).code, 0);
  assert.equal(existsSync(join(root, ".orivilo/runs/ORV-1/ORV-1-b/result.json")), false);
  const stop = runNode(hook("result-recorder.mjs"), {
    ...fixture("SubagentStop"),
    cwd: root,
    agent_id: "a-ORV-1-b",
    agent_type: "builder",
    last_assistant_message: "{}",
  });
  assert.match(stop.stderr, /already closed/);
  assert.equal(existsSync(join(root, ".orivilo/runs/ORV-1/ORV-1-b/result.json")), false);
});

test("AC 37: the ovl skill section 4 gives the close form", () => {
  const skill = readFileSync(join(repoRoot, ".claude/skills/ovl/SKILL.md"), "utf8");
  const section = skill.split("## 4.")[1].split("## 5.")[0];
  assert.match(section, /`ปิดงาน <task_id>`/);
  assert.match(section, /`Close envelope <task_id>`/);
  assert.match(section, /`Keep open`/);
  assert.match(section, /`ยังไม่ปิด`/);
  assert.match(section, /Text typed in chat never closes/);
});

test("SEC-1: an answer the dialog picked after an idle timeout closes nothing", () => {
  const root = makeRepo();
  stuck(root);
  const input = form(root);
  input.tool_response.afkTimeoutMs = 60000;
  refused(root, input, /afkTimeoutMs/);
});
