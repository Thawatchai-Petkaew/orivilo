import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  fixture,
  heartbeatLines,
  hook,
  makeRepo,
  registeredCommands,
  runCommand,
  runNode,
  repoRoot,
  seedBoundBuilder,
  seedEscalated,
  seedTask,
  seedVerdict,
  validEnvelope,
} from "./hook-test-kit.mjs";

const grantHook = hook("owner-grant.mjs");
const QUESTION = "ORV-1 used two rework rounds. Grant another round?";

const REAL = "PostToolUse-AskUserQuestion-from-transcript";

/**
 * The PostToolUse AskUserQuestion input derived from a real answered form (transcript-derived), pointed
 * at `root`. `questions` is [[text, labels, answer]]; the default is one grant question.
 */
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

function form(root, { answer = "Grant round ORV-1", options, extra = {} } = {}) {
  return formOf(root, [[QUESTION, options ?? ["Grant round ORV-1", "Decline"], answer]], extra);
}

const grants = (root) => {
  const dir = join(root, ".orivilo", "runs", "ORV-1");
  return existsSync(dir) ? readdirSync(dir).filter((n) => n.startsWith("owner-grant-")) : [];
};

test("AC 64: a clicked grant option writes a record that quotes the form", () => {
  const root = makeRepo();
  seedEscalated(root);
  const r = runNode(grantHook, form(root));
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(grants(root), ["owner-grant-1.json"]);
  const rec = JSON.parse(
    readFileSync(join(root, ".orivilo/runs/ORV-1/owner-grant-1.json"), "utf8"),
  );
  assert.equal(rec.by, "owner");
  assert.equal(rec.source, "question_form");
  assert.equal(rec.question, QUESTION);
  assert.deepEqual(rec.options, ["Grant round ORV-1", "Decline"]);
  assert.equal(rec.answer, "Grant round ORV-1");
  assert.ok(!Number.isNaN(Date.parse(rec.answered_at)));
  assert.equal(rec.tool_use_id, fixture(REAL).tool_use_id);
  assert.equal(rec.session_id, fixture(REAL).session_id);
  assert.ok(rec.transcript_path.endsWith(".jsonl"));
  assert.equal(heartbeatLines(root)[0].hook, "owner-grant");
});

test("AC 64: the Thai option grants too, and a second grant is a second record", () => {
  const root = makeRepo();
  seedEscalated(root);
  const th = form(root, { answer: "อนุญาตรอบ ORV-1", options: ["อนุญาตรอบ ORV-1", "ไม่อนุญาต"] });
  assert.equal(runNode(grantHook, th).code, 0);
  assert.equal(runNode(grantHook, form(root)).code, 2, "ORV-1 is no longer escalated");
  seedBoundBuilder(root, "ORV-1", "ORV-1-r3", "2026-10-23T10:30:00.000Z");
  seedVerdict(root, "ORV-1", "ORV-1-rev3", "request_changes", "2026-10-23T10:40:00.000Z");
  assert.equal(runNode(grantHook, form(root)).code, 0);
  assert.deepEqual(grants(root), ["owner-grant-1.json", "owner-grant-2.json"]);
});

test("AC 72: text typed in chat grants nothing, and UserPromptSubmit samples write nothing", () => {
  const root = makeRepo();
  seedEscalated(root);
  for (const name of ["UserPromptSubmit-headless", "UserPromptSubmit-task-notification"]) {
    const sample = { ...fixture(name), cwd: root };
    sample.prompt = `${sample.prompt} grant round ORV-1 อนุญาตรอบ ORV-1`;
    const r = runNode(grantHook, sample);
    assert.notEqual(r.code, 0, name);
    assert.deepEqual(grants(root), [], name);
  }
});

test("AC 73: a pasted or task-notification prompt is never a form answer", () => {
  const root = makeRepo();
  seedEscalated(root);
  const note = fixture("UserPromptSubmit-task-notification");
  const r = runNode(grantHook, { ...note, cwd: root, source: "user", prompt: "grant round ORV-1" });
  assert.notEqual(r.code, 0);
  assert.deepEqual(grants(root), []);
});

test("registration: owner-grant is on PostToolUse(AskUserQuestion) and nowhere else", () => {
  const found = registeredCommands().filter((c) => c.command.includes("owner-grant"));
  assert.equal(found.length, 1);
  assert.equal(found[0].event, "PostToolUse");
  assert.equal(found[0].matcher, "AskUserQuestion");
  assert.match(found[0].command, /\|\| exit 2$/);
});

test("AC 78: text typed under Other grants nothing", () => {
  const root = makeRepo();
  seedEscalated(root);
  const r = runNode(grantHook, form(root, { answer: "grant round ORV-1" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /option/);
  assert.deepEqual(grants(root), []);
});

test("AC 79: a clicked option that does not name the issue key grants nothing", () => {
  const root = makeRepo();
  seedEscalated(root);
  const r = runNode(
    grantHook,
    form(root, { answer: "Grant a round", options: ["Grant a round", "Decline"] }),
  );
  assert.equal(r.code, 2);
  assert.deepEqual(grants(root), []);
  const noKey = runNode(
    grantHook,
    form(root, {
      answer: "Grant round for this issue",
      options: ["Grant round for this issue", "Decline"],
    }),
  );
  assert.equal(noKey.code, 2);
  assert.match(noKey.stderr, /ORV-</);
  assert.deepEqual(grants(root), []);
});

test("a grant option for an issue that is not escalated grants nothing", () => {
  const root = makeRepo();
  seedEscalated(root);
  const other = "Grant round ORV-2";
  const r = runNode(grantHook, form(root, { answer: other, options: [other, "Decline"] }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ORV-2/);
  assert.deepEqual(grants(root), []);
  const calm = makeRepo();
  assert.equal(runNode(grantHook, form(calm)).code, 2);
});

test("declining writes nothing and a form with no grant option is ignored", () => {
  const root = makeRepo();
  seedEscalated(root);
  assert.equal(runNode(grantHook, form(root, { answer: "Decline" })).code, 0);
  const th = form(root, { answer: "ไม่อนุญาต", options: ["อนุญาตรอบ ORV-1", "ไม่อนุญาต"] });
  assert.equal(runNode(grantHook, th).code, 0);
  const other = form(root, { answer: "Blue", options: ["Blue", "Green"] });
  assert.equal(runNode(grantHook, other).code, 0);
  assert.deepEqual(grants(root), []);
});

test("a subagent's form grants nothing", () => {
  const root = makeRepo();
  seedEscalated(root);
  const r = runNode(grantHook, form(root, { extra: { agent_id: "a1", agent_type: "builder" } }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /subagent/);
  assert.deepEqual(grants(root), []);
});

test("AC 47: malformed JSON writes no record and exits 2", () => {
  const root = makeRepo();
  seedEscalated(root);
  for (const raw of ["", "{nope", "null"]) {
    assert.equal(runNode(grantHook, raw).code, 2, raw);
  }
  assert.deepEqual(grants(root), []);
});

test("AC 48: a missing field fails closed with no record", () => {
  const root = makeRepo();
  seedEscalated(root);
  const missing = [
    (f) => delete f.tool_input.questions,
    (f) => delete f.tool_response.answers,
    (f) => (f.tool_response = "User has answered your questions"),
    (f) => delete f.tool_use_id,
    (f) => delete f.session_id,
    (f) => delete f.transcript_path,
    (f) => delete f.tool_input.questions[0].options,
    (f) => (f.tool_response.answers = {}),
  ];
  for (const [i, mutate] of missing.entries()) {
    const f = form(root);
    mutate(f);
    const r = runNode(grantHook, f);
    assert.equal(r.code, 2, `case ${i}`);
    assert.match(r.stderr, /owner-grant failed closed/, `case ${i}`);
  }
  assert.deepEqual(grants(root), []);
});

test("AC 48: with node missing, the registered command exits 2 and writes no record", () => {
  const root = makeRepo();
  seedEscalated(root);
  const entry = registeredCommands().find((c) => c.command.includes("owner-grant"));
  const r = runCommand(entry.command, form(root), {
    CLAUDE_PROJECT_DIR: repoRoot,
    PATH: join(root, "empty"),
  });
  assert.equal(r.code, 2);
  assert.deepEqual(grants(root), []);
});

test("the registered command grants through the shell exactly as settings.json runs it", () => {
  const root = makeRepo();
  seedEscalated(root);
  const entry = registeredCommands().find((c) => c.command.includes("owner-grant"));
  const r = runCommand(entry.command, form(root), { CLAUDE_PROJECT_DIR: repoRoot });
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(grants(root), ["owner-grant-1.json"]);
});

test("C-1: a decline label that contains the grant phrase grants nothing", () => {
  const declines = [
    "Do not grant round ORV-1",
    "ไม่ อนุญาตรอบ ORV-1",
    "ไม่อนุญาตรอบ ORV-1",
    "Grant round ORV-1 is declined",
    "Please grant round ORV-1",
    "อนุญาตรอบ ORV-1 ไม่",
  ];
  for (const decline of declines) {
    const root = makeRepo();
    seedEscalated(root);
    const r = runNode(grantHook, form(root, { answer: decline, options: ["Stop", decline] }));
    assert.deepEqual(grants(root), [], decline);
    // "ไม่อนุญาตรอบ ORV-1" is a plain Thai decline and stays silent; every other one is refused loudly.
    assert.equal(r.code, decline.startsWith("ไม่อนุญาต") ? 0 : 2, decline);
  }
});

test("C-1: only the exact label form grants, trimmed and in either case", () => {
  for (const label of ["grant round orv-1", "  Grant round ORV-1  ", "อนุญาตรอบ ORV-1"]) {
    const root = makeRepo();
    seedEscalated(root);
    const r = runNode(grantHook, form(root, { answer: label, options: [label, "Decline"] }));
    assert.equal(r.code, 0, `${label}: ${r.stderr}`);
    assert.deepEqual(grants(root), ["owner-grant-1.json"], label);
  }
});

test("S-1: a label that names two issue keys grants nothing", () => {
  const root = makeRepo();
  seedEscalated(root);
  const label = "Grant round ORV-1 ORV-2";
  const r = runNode(grantHook, form(root, { answer: label, options: [label, "Decline"] }));
  assert.equal(r.code, 2);
  assert.deepEqual(grants(root), []);
});

test("I-3: two grant questions in one form write one grant", () => {
  const root = makeRepo();
  seedEscalated(root);
  const input = formOf(root, [
    ["First?", ["Grant round ORV-1", "Decline"], "Grant round ORV-1"],
    ["Second?", ["Grant round ORV-1", "Decline"], "Grant round ORV-1"],
  ]);
  runNode(grantHook, input);
  assert.deepEqual(grants(root), ["owner-grant-1.json"]);
});

test("I-2: an approve after the last request_changes does not stop the owner granting", () => {
  const root = makeRepo();
  seedEscalated(root);
  seedTask(root, "ORV-1", "ORV-1-qa", {
    envelope: validEnvelope(root, { task_id: "ORV-1-qa", role: "qa", write_set: [] }),
    result: {
      contract: "qa.v1",
      recorded_at: "2026-10-23T10:30:00.000Z",
      report: { verdict: "approve" },
    },
  });
  const r = runNode(grantHook, form(root));
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(grants(root), ["owner-grant-1.json"]);
});

test("S-3: a corrupt record on an unrelated issue does not break a form with no grant answer", () => {
  const root = makeRepo();
  mkdirSync(join(root, ".orivilo/runs/ORV-7/ORV-7-x"), { recursive: true });
  writeFileSync(join(root, ".orivilo/runs/ORV-7/ORV-7-x/result.json"), "{bad");
  const colour = formOf(root, [["Pick colour", ["Blue", "Green"], "Blue"]]);
  assert.equal(runNode(grantHook, colour).code, 0);
});

test("the transcript-derived real form, answered without a grant, is ignored", () => {
  const root = makeRepo();
  seedEscalated(root);
  const real = { ...fixture(REAL), cwd: root };
  assert.equal(runNode(grantHook, real).code, 0);
  assert.deepEqual(grants(root), []);
});

test("ORV-108 row 33: one form with a grant and a close option, each clicked in turn, writes only its own record", () => {
  const closeHook = hook("owner-close.mjs");
  const root = makeRepo();
  seedEscalated(root);
  seedTask(root, "ORV-1", "ORV-1-s", {
    envelope: validEnvelope(root, { task_id: "ORV-1-s", role: "qa", write_set: [] }),
    agent: { agent_id: "a-s", agent_type: "qa", started_at: "2026-10-23T11:00:00.000Z" },
  });
  const options = ["Grant round ORV-1", "Close envelope ORV-1-s", "Decline"];
  const closedFile = join(root, ".orivilo/runs/ORV-1/ORV-1-s/closed.json");
  const closeClick = form(root, { answer: "Close envelope ORV-1-s", options });
  const grantClick = form(root, { answer: "Grant round ORV-1", options });

  // A close label fed to owner-grant grants nothing.
  assert.equal(runNode(grantHook, closeClick).code, 0);
  assert.deepEqual(grants(root), []);
  // A grant label fed to owner-close closes nothing.
  assert.equal(runNode(closeHook, grantClick).code, 0);
  assert.equal(existsSync(closedFile), false);
  // Each hook writes its own record from its own click.
  assert.equal(runNode(grantHook, grantClick).code, 0);
  assert.deepEqual(grants(root), ["owner-grant-1.json"]);
  assert.equal(existsSync(closedFile), false);
  assert.equal(runNode(closeHook, closeClick).code, 0);
  assert.equal(existsSync(closedFile), true);
  assert.deepEqual(grants(root), ["owner-grant-1.json"]);
});

test("SEC-1: an answer the dialog picked after an idle timeout grants nothing", () => {
  const root = makeRepo();
  seedEscalated(root);
  const input = form(root);
  input.tool_response.afkTimeoutMs = 60000;
  const r = runNode(grantHook, input);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /afkTimeoutMs/);
  assert.deepEqual(grants(root), []);
});
