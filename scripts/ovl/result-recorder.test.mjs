import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { storyTitle } from "./result-recorder.mjs";
import { validate } from "./validate.mjs";
import {
  agentInput,
  fixture,
  heartbeatLines,
  hook,
  makeRepo,
  postAgentFailureInput,
  postAgentInput,
  postBashFailureInput,
  postBashInput,
  registeredCommands,
  repoRoot,
  runCommand,
  runNode,
  seedTask,
  startInput,
  stopInput,
  validEnvelope,
} from "./hook-test-kit.mjs";

const recorder = hook("result-recorder.mjs");
const wrapper = hook("result-recorder.sh");
const run = (input) => runNode(recorder, input);

const taskDir = (root, task = "ORV-1-a", issue = "ORV-1") =>
  join(root, ".orivilo", "runs", issue, task);
const read = (root, name, task) =>
  JSON.parse(readFileSync(join(taskDir(root, task), name), "utf8"));
const has = (root, name, task) => existsSync(join(taskDir(root, task), name));

const git = (root, ...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

const DEFAULT_SPEC = [
  "| #   | Given | When | User sees                         | Evidence |",
  "| --- | ----- | ---- | --------------------------------- | -------- |",
  "| 1   | a     | b    | The check is centred on the label | test     |",
  "| 2   | a     | b    | The row is saved                  | test     |",
  "",
].join("\n");

/**
 * A repo with a base commit on origin/develop, then a PR commit that changes one story file. `spec` is
 * the text of docs/specs/ORV-1/spec.md in the base commit, or a function that makes that path.
 */
function makePrRepo(spec = DEFAULT_SPEC) {
  const root = makeRepo();
  git(root, "config", "user.email", "t@example.com");
  git(root, "config", "user.name", "t");
  mkdirSync(join(root, "docs", "specs", "ORV-1"), { recursive: true });
  const specPath = join(root, "docs", "specs", "ORV-1", "spec.md");
  if (typeof spec === "function") spec(specPath);
  else writeFileSync(specPath, spec);
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "base");
  git(root, "update-ref", "refs/remotes/origin/develop", "HEAD");
  const story = join(root, "packages", "ds", "src", "checkbox");
  mkdirSync(story, { recursive: true });
  writeFileSync(
    join(story, "checkbox.stories.tsx"),
    'export default { title: "Components/Checkbox" };\nexport const Basic = {};\n',
  );
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "pr");
  return { root, head: git(root, "rev-parse", "HEAD") };
}

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(8),
]);

function writeShot(root, task, name, bytes = PNG) {
  const dir = join(taskDir(root, task), "screenshots");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), bytes);
  return `.orivilo/runs/ORV-1/${task}/screenshots/${name}`;
}

function writeGate(root, head, over = {}) {
  mkdirSync(join(root, ".quality-gate"), { recursive: true });
  writeFileSync(
    join(root, ".quality-gate", "report.json"),
    JSON.stringify({
      schemaVersion: 1,
      ok: true,
      stepsSource: "gate",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      git: { branch: "feature/ORV-1-test", sha: head, dirty: false },
      steps: [],
      ...over,
    }),
  );
}

/** A bound, open envelope for `role`, with agent id `agent-<task>`. */
function bind(root, role, task, over = {}) {
  seedTask(root, "ORV-1", task, {
    envelope: validEnvelope(root, {
      task_id: task,
      role,
      write_set: role === "builder" ? ["packages/ds/src/x/**"] : [],
      skills:
        role === "qa"
          ? ["quality-gate", "webapp-testing"]
          : role === "builder"
            ? ["quality-gate"]
            : [],
      ...over,
    }),
    agent: { agent_id: `agent-${task}`, agent_type: role, started_at: "2026-10-23T09:00:00.000Z" },
  });
  return `agent-${task}`;
}

const implementer = (task, over = {}) => ({
  task_id: task,
  result: "done",
  changed: [{ file: "a.mjs", note: "x" }],
  verified: [{ check: "pnpm test", evidence: "ok" }],
  skills_used: [],
  deviations: [],
  needs_decision: [],
  blocked_on: null,
  ...over,
});

const SHA = "a".repeat(40);
const cmdEvidence = { kind: "command", ref: "pnpm test", observed: "12 passed" };
const reviewer = (task, over = {}) => ({
  task_id: task,
  verdict: "approve",
  head_sha: SHA,
  checks_run: [{ command: "pnpm test", exit_code: 0, summary: "ok" }],
  findings: [],
  ...over,
});
const finding = (over = {}) => ({
  id: "F1",
  severity: "Important",
  claim: "claim",
  expected: "expected",
  evidence: cmdEvidence,
  ...over,
});

/** A passing qa.v1 report for the PR repo, with both screenshots written. */
function qaReport(root, head, task, over = {}) {
  const light = writeShot(root, task, "components-checkbox--basic-light.png");
  const dark = writeShot(root, task, "components-checkbox--basic-dark.png");
  const shot = (path, mode) => ({
    story: "components-checkbox--basic",
    mode,
    path,
    looked_at: true,
    note: "the check glyph sits on the label centre line",
  });
  return {
    task_id: task,
    issue: "ORV-1",
    pr: 7,
    verdict: "approve",
    head_sha: head,
    quality_gate: { report: ".quality-gate/report.json", ok: true, head_sha: head },
    ac: [
      {
        row: 1,
        status: "pass",
        visual: true,
        evidence: [{ kind: "screenshot", ref: light }],
      },
      { row: 2, status: "pass", visual: false, evidence: [cmdEvidence] },
    ],
    screenshots: [shot(light, "light"), shot(dark, "dark")],
    findings: [],
    ...over,
  };
}

/** Sets up the PR repo with a bound qa envelope, a passing gate report and a passing report. */
function qaSetup(over = {}, spec = DEFAULT_SPEC) {
  const { root, head } = makePrRepo(spec);
  const agent = bind(root, "qa", "ORV-1-qa");
  writeGate(root, head);
  return { root, head, agent, report: qaReport(root, head, "ORV-1-qa", over) };
}

const stopWith = (root, agent, role, report) =>
  run(stopInput(root, agent, role, typeof report === "string" ? report : JSON.stringify(report)));

// ---- Binding -------------------------------------------------------------------------------

test("SubagentStart binds the one open unbound envelope of the agent type", () => {
  const root = makeRepo();
  seedTask(root, "ORV-1", "ORV-1-a", { envelope: validEnvelope(root) });
  const r = run(startInput(root, "agent-1", "builder"));
  assert.equal(r.code, 0, r.stderr);
  const agent = read(root, "agent.json");
  assert.equal(agent.agent_id, "agent-1");
  assert.equal(agent.agent_type, "builder");
  assert.ok(!Number.isNaN(Date.parse(agent.started_at)));
});

test("SubagentStart for Explore binds nothing; for a type with no open envelope it exits 2", () => {
  const root = makeRepo();
  seedTask(root, "ORV-1", "ORV-1-a", { envelope: validEnvelope(root) });
  assert.equal(run(startInput(root, "agent-x", "Explore")).code, 0);
  assert.equal(has(root, "agent.json"), false);
  const r = run(startInput(root, "agent-2", "reviewer"));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /reviewer/);
});

/** Runs the recorder on `input` without blocking, so several hooks can run at the same moment. */
const runAsync = (input) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [recorder], { stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => resolve({ code, stderr }));
    child.stdin.end(JSON.stringify(input));
  });

test("I-6: SubagentStart hooks for different roles started at once all bind", async () => {
  const roles = [
    "builder",
    "reviewer",
    "qa",
    "designer",
    "ds-architect",
    "product",
    "release",
    "architect",
    "security",
    "research",
  ];
  for (let trial = 0; trial < 60; trial++) {
    const root = makeRepo();
    for (const role of roles) {
      seedTask(root, "ORV-1", `ORV-1-${role}`, {
        envelope: validEnvelope(root, { task_id: `ORV-1-${role}`, role }),
      });
    }
    const results = await Promise.all(
      roles.map((role) => runAsync(startInput(root, `agent-${role}`, role))),
    );
    assert.deepEqual(
      results.filter((r) => r.code !== 0).map((r) => r.stderr),
      [],
      `trial ${trial}`,
    );
    for (const role of roles) {
      assert.equal(read(root, "agent.json", `ORV-1-${role}`).agent_id, `agent-${role}`);
    }
  }
});

test("SubagentStart does not bind an envelope that is already bound or closed", () => {
  const root = makeRepo();
  bind(root, "builder", "ORV-1-a");
  seedTask(root, "ORV-1", "ORV-1-b", {
    envelope: validEnvelope(root, { task_id: "ORV-1-b" }),
    closed: { reason: "denied", closed_at: "2026-10-23T09:00:00.000Z" },
  });
  assert.equal(run(startInput(root, "agent-2", "builder")).code, 2);
  assert.equal(has(root, "agent.json", "ORV-1-b"), false);
});

// ---- SubagentStop: AC 15, 17, 54, 63 ---------------------------------------------------------

test("AC 15: a subagent that ends with prose is sent back and no result.json exists", () => {
  const root = makeRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  const r = stopWith(root, agent, "builder", "All done, everything works.");
  assert.equal(r.code, 2);
  assert.match(r.stderr, /implementer\.v1/);
  assert.equal(has(root, "result.json"), false);
  assert.equal(has(root, "closed.json"), false);
});

test("a report that fails its contract is sent back with the JSON path of the error", () => {
  const root = makeRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  const r = stopWith(root, agent, "builder", { ...implementer("ORV-1-a"), result: "finished" });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /\/result/);
  assert.doesNotMatch(r.stderr, /rawErrors|schemaPath/);
});

test("a valid report passes SubagentStop and a report for another task is sent back", () => {
  const root = makeRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  assert.equal(stopWith(root, agent, "builder", implementer("ORV-1-a")).code, 0);
  assert.equal(has(root, "result.json"), false);
  const wrong = stopWith(root, agent, "builder", implementer("ORV-1-zzz"));
  assert.equal(wrong.code, 2);
  assert.match(wrong.stderr, /task_id/);
});

test("AC 17: a qa.v1 report from a builder exits 2 and writes no result.json", () => {
  const { root, head } = makePrRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  const r = stopWith(root, agent, "builder", qaReport(root, head, "ORV-1-a"));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /qa\.v1 comes only from qa/);
  assert.equal(has(root, "result.json"), false);
});

test("a reviewer.v1 report from a builder is refused; a designer may send one when its envelope says so", () => {
  const root = makeRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  const r = stopWith(root, agent, "builder", reviewer("ORV-1-a"));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /reviewer\.v1 comes only from reviewer or designer/);
  const designer = bind(root, "designer", "ORV-1-d", {
    report_contract: "reviewer.v1",
    skills: ["frontend-design", "webapp-testing"],
    write_set: ["docs/specs/ORV-1/design.md"],
  });
  assert.equal(stopWith(root, designer, "designer", reviewer("ORV-1-d")).code, 0);
});

test("a security subagent may send a reviewer.v1 report", () => {
  const root = makeRepo();
  const agent = bind(root, "security", "ORV-1-s", {
    report_contract: "reviewer.v1",
    skills: ["quality-gate"],
  });
  const message = JSON.stringify(reviewer("ORV-1-s"));
  const r = run(postAgentInput(root, agent, "security", message));
  assert.equal(r.code, 0, r.stderr);
  const result = read(root, "result.json", "ORV-1-s");
  assert.equal(result.contract, "reviewer.v1");
  assert.equal(result.report.verdict, "approve");
});

test("AC 54: an Explore subagent ends with exit 0 and nothing is recorded", () => {
  const root = makeRepo();
  bind(root, "builder", "ORV-1-a");
  const r = run(stopInput(root, "agent-explore", "Explore", "free prose"));
  assert.equal(r.code, 0, r.stderr);
  assert.equal(has(root, "result.json"), false);
  assert.equal(has(root, "closed.json"), false);
  const post = run(postAgentInput(root, "agent-explore", "Explore", "free prose"));
  assert.equal(post.code, 0, post.stderr);
});

test("AC 63: with stop_hook_active true an invalid report ends the subagent with exit 0", () => {
  const root = makeRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  const r = run(stopInput(root, agent, "builder", "prose", { stop_hook_active: true }));
  assert.equal(r.code, 0, r.stderr);
  assert.equal(has(root, "result.json"), false);
  const last = heartbeatLines(root).at(-1);
  assert.equal(last.event, "SubagentStop");
  assert.equal(last.decision, "allow");
});

test("AC 63: the wrapper returns 0 for stop_hook_active true when the recorder crashes, 2 otherwise", () => {
  const notARepo = "/";
  const env = { CLAUDE_PROJECT_DIR: repoRoot };
  const active = stopInput(notARepo, "agent-1", "builder", "x", { stop_hook_active: true });
  const crashed = runCommand(`"${wrapper}" || exit 2`, active, env);
  assert.equal(crashed.code, 0, crashed.stderr);
  const inactive = stopInput(notARepo, "agent-1", "builder", "x", { stop_hook_active: false });
  assert.equal(runCommand(`"${wrapper}" || exit 2`, inactive, env).code, 2);
  assert.equal(runCommand(`"${wrapper}" || exit 2`, "{not json", env).code, 2);
});

test("the wrapper passes a valid stop and blocks prose, through the real recorder", () => {
  const root = makeRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  const env = { CLAUDE_PROJECT_DIR: repoRoot };
  const good = stopInput(root, agent, "builder", JSON.stringify(implementer("ORV-1-a")));
  assert.equal(runCommand(`"${wrapper}" || exit 2`, good, env).code, 0);
  const bad = stopInput(root, agent, "builder", "prose");
  assert.equal(runCommand(`"${wrapper}" || exit 2`, bad, env).code, 2);
});

// ---- PostToolUse(Agent): AC 16, 51, 18 --------------------------------------------------------

test("AC 16: a valid report is recorded with contract, agent_id, agent_type and round", () => {
  const root = makeRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  const message = JSON.stringify(implementer("ORV-1-a"));
  const r = run(postAgentInput(root, agent, "builder", message));
  assert.equal(r.code, 0, r.stderr);
  const result = read(root, "result.json");
  assert.equal(result.contract, "implementer.v1");
  assert.equal(result.agent_id, agent);
  assert.equal(result.agent_type, "builder");
  assert.equal(result.round, 0);
  assert.equal(result.report.task_id, "ORV-1-a");
  assert.deepEqual(result.dropped, []);
  assert.ok(!Number.isNaN(Date.parse(result.recorded_at)));
  assert.equal(has(root, "qa.json"), false);
});

test("a result is never rewritten: a second PostToolUse for the same task exits 2", () => {
  const root = makeRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  const input = postAgentInput(root, agent, "builder", JSON.stringify(implementer("ORV-1-a")));
  assert.equal(run(input).code, 0);
  assert.equal(run(input).code, 2);
});

test("a PostToolUse whose agentId matches no bound envelope writes nothing and exits 2", () => {
  const root = makeRepo();
  bind(root, "builder", "ORV-1-a");
  const r = run(
    postAgentInput(root, "agent-stranger", "builder", JSON.stringify(implementer("ORV-1-a"))),
  );
  assert.equal(r.code, 2);
  assert.equal(has(root, "result.json"), false);
  const noId = postAgentInput(root, "x", "builder", "{}");
  delete noId.tool_response.agentId;
  assert.equal(run(noId).code, 2);
});

test("AC 51: no valid report closes the envelope as no_report and exits 2", () => {
  const root = makeRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  const r = run(postAgentInput(root, agent, "builder", "just prose"));
  assert.equal(r.code, 2);
  assert.equal(read(root, "closed.json").reason, "no_report");
  assert.equal(has(root, "result.json"), false);
});

test("AC 18: a finding with no re-executable evidence moves to dropped and does not count", () => {
  const root = makeRepo();
  const agent = bind(root, "reviewer", "ORV-1-rev");
  const weak = finding({
    id: "W1",
    severity: "Suggestion",
    evidence: { kind: "command", ref: "pnpm test" },
  });
  const r = run(
    postAgentInput(
      root,
      agent,
      "reviewer",
      JSON.stringify(reviewer("ORV-1-rev", { findings: [weak] })),
    ),
  );
  assert.equal(r.code, 0, r.stderr);
  const result = read(root, "result.json", "ORV-1-rev");
  assert.deepEqual(result.report.findings, []);
  assert.deepEqual(
    result.dropped.map((f) => f.id),
    ["W1"],
  );
});

test("reviewer evidence kinds: command, computed_style, screenshot and code are kept only when they can be run again", () => {
  const { root, head } = makePrRepo();
  const agent = bind(root, "reviewer", "ORV-1-rev");
  const shot = writeShot(root, "ORV-1-rev", "x--y-light.png");
  const kept = [
    finding({ id: "K1", severity: "Suggestion" }),
    finding({
      id: "K2",
      severity: "Suggestion",
      evidence: {
        kind: "computed_style",
        ref: "components-checkbox--basic .label gap",
        observed: "8px",
      },
    }),
    finding({ id: "K3", severity: "Suggestion", evidence: { kind: "screenshot", ref: shot } }),
    finding({
      id: "K4",
      severity: "Suggestion",
      file: "docs/specs/ORV-1/spec.md",
      line: 2,
      evidence: { kind: "code", ref: "docs/specs/ORV-1/spec.md:2" },
    }),
  ];
  const dropped = [
    finding({
      id: "D1",
      severity: "Suggestion",
      evidence: { kind: "screenshot", ref: "elsewhere.png" },
    }),
    finding({
      id: "D2",
      severity: "Suggestion",
      evidence: { kind: "computed_style", ref: "just a story", observed: "8px" },
    }),
    finding({
      id: "D3",
      severity: "Suggestion",
      file: "docs/specs/ORV-1/spec.md",
      line: 999,
      evidence: { kind: "code", ref: "docs/specs/ORV-1/spec.md:999" },
    }),
    finding({ id: "D4", severity: "Suggestion", evidence: { kind: "code", ref: "x" } }),
  ];
  const report = reviewer("ORV-1-rev", { head_sha: head, findings: [...kept, ...dropped] });
  const r = run(postAgentInput(root, agent, "reviewer", JSON.stringify(report)));
  assert.equal(r.code, 0, r.stderr);
  const result = read(root, "result.json", "ORV-1-rev");
  assert.deepEqual(
    result.report.findings.map((f) => f.id),
    ["K1", "K2", "K3", "K4"],
  );
  assert.deepEqual(
    result.dropped.map((f) => f.id),
    ["D1", "D2", "D3", "D4"],
  );
});

test("an approve with a kept Critical finding is invalid; a request_changes with none kept goes back", () => {
  const root = makeRepo();
  const agent = bind(root, "reviewer", "ORV-1-rev");
  const critical = finding({ severity: "Critical" });
  const approve = stopWith(
    root,
    agent,
    "reviewer",
    reviewer("ORV-1-rev", { findings: [critical] }),
  );
  assert.equal(approve.code, 2);
  assert.match(approve.stderr, /approve .*Critical/);
  const weak = finding({ evidence: { kind: "command", ref: "pnpm test" } });
  const none = stopWith(
    root,
    agent,
    "reviewer",
    reviewer("ORV-1-rev", { verdict: "request_changes", findings: [weak] }),
  );
  assert.equal(none.code, 2);
  assert.match(none.stderr, /request_changes needs at least one kept Critical or Important/);
  const ok = stopWith(
    root,
    agent,
    "reviewer",
    reviewer("ORV-1-rev", { verdict: "request_changes", findings: [finding()] }),
  );
  assert.equal(ok.code, 0, ok.stderr);
});

test("I-4: a request_changes that keeps only a Suggestion finding goes back", () => {
  const root = makeRepo();
  const agent = bind(root, "reviewer", "ORV-1-rev");
  const r = stopWith(
    root,
    agent,
    "reviewer",
    reviewer("ORV-1-rev", {
      verdict: "request_changes",
      findings: [finding({ severity: "Suggestion" })],
    }),
  );
  assert.equal(r.code, 2);
  assert.match(r.stderr, /request_changes needs at least one kept Critical or Important/);
});

test("I-4: computed_style evidence with a valid ref and no observed value moves to dropped", () => {
  const root = makeRepo();
  const agent = bind(root, "reviewer", "ORV-1-rev");
  const noObserved = finding({
    id: "D1",
    severity: "Suggestion",
    evidence: {
      kind: "computed_style",
      ref: "components-checkbox--basic .label gap",
      observed: " ",
    },
  });
  const report = reviewer("ORV-1-rev", { findings: [noObserved] });
  const r = run(postAgentInput(root, agent, "reviewer", JSON.stringify(report)));
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(
    read(root, "result.json", "ORV-1-rev").dropped.map((f) => f.id),
    ["D1"],
  );
});

test("round in result.json is the issue's rounds used at record time", () => {
  const root = makeRepo();
  seedTask(root, "ORV-1", "ORV-1-b0", {
    envelope: validEnvelope(root, { task_id: "ORV-1-b0" }),
    agent: { agent_id: "a-b0", agent_type: "builder", started_at: "2026-10-23T07:30:00.000Z" },
    closed: { reason: "no_report", closed_at: "2026-10-23T07:40:00.000Z" },
  });
  seedTask(root, "ORV-1", "ORV-1-old", {
    envelope: validEnvelope(root, {
      task_id: "ORV-1-old",
      role: "reviewer",
      write_set: [],
      skills: [],
    }),
    result: {
      contract: "reviewer.v1",
      recorded_at: "2026-10-23T08:00:00.000Z",
      report: { verdict: "request_changes" },
    },
  });
  seedTask(root, "ORV-1", "ORV-1-r1", {
    envelope: validEnvelope(root, { task_id: "ORV-1-r1" }),
    agent: { agent_id: "a-r1", agent_type: "builder", started_at: "2026-10-23T08:30:00.000Z" },
    closed: { reason: "no_report", closed_at: "2026-10-23T08:40:00.000Z" },
  });
  const agent = bind(root, "reviewer", "ORV-1-rev");
  assert.equal(
    run(postAgentInput(root, agent, "reviewer", JSON.stringify(reviewer("ORV-1-rev")))).code,
    0,
  );
  assert.equal(read(root, "result.json", "ORV-1-rev").round, 1);
});

// ---- qa.v1 rules: AC 19 to 24, 58 ------------------------------------------------------------

test("a passing qa.v1 report passes SubagentStop; PostToolUse writes result.json and qa.json", () => {
  const { root, agent, report } = qaSetup();
  assert.equal(stopWith(root, agent, "qa", report).code, 0);
  const r = run(postAgentInput(root, agent, "qa", JSON.stringify(report)));
  assert.equal(r.code, 0, r.stderr);
  assert.equal(read(root, "result.json", "ORV-1-qa").contract, "qa.v1");
  assert.equal(read(root, "qa.json", "ORV-1-qa").report.verdict, "approve");
});

test("AC 19: a visual row whose only evidence is a test exits 2", () => {
  const { root, agent, report } = qaSetup();
  report.ac[0].evidence = [cmdEvidence];
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /screenshot|computed_style/);
  assert.equal(has(root, "result.json", "ORV-1-qa"), false);
});

test("AC 20: a row marked visual false that the spec makes visual exits 2", () => {
  const { root, agent, report } = qaSetup();
  report.ac[0].visual = false;
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /row 1/);
  assert.match(r.stderr, /visual/);
});

test("a report that skips a spec AC row exits 2 and names the row", () => {
  const { root, agent, report } = qaSetup();
  report.ac.pop();
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /row 2/);
});

test("AC 21: an approve with quality_gate.ok false exits 2", () => {
  const { root, agent, report } = qaSetup();
  report.quality_gate.ok = false;
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /quality_gate/);
});

test("an approve with a failing AC row exits 2", () => {
  const { root, agent, report } = qaSetup();
  report.ac[1].status = "fail";
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /row 2/);
});

test("AC 22: an approve whose gate SHA is not head_sha exits 2 as stale evidence", () => {
  const { root, agent, report } = qaSetup();
  report.quality_gate.head_sha = "b".repeat(40);
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /stale/);
});

test("the gate report on disk must match head_sha, be clean, ok and from a real gate run", () => {
  const cases = [
    [{ git: { branch: "b", sha: "c".repeat(40), dirty: false } }, /stale/],
    [{ git: { branch: "b", sha: "HEAD", dirty: true } }, /dirty|stale/],
    [{ ok: false }, /ok/],
  ];
  for (const [over, pattern] of cases) {
    const { root, head, agent, report } = qaSetup();
    writeGate(root, head, over);
    const r = stopWith(root, agent, "qa", report);
    assert.equal(r.code, 2, JSON.stringify(over));
    assert.match(r.stderr, pattern, JSON.stringify(over));
  }
});

test("a dirty gate report exits 2", () => {
  const { root, head, agent, report } = qaSetup();
  writeGate(root, head, { git: { branch: "b", sha: head, dirty: true } });
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /dirty/);
});

test("AC 58: an approve on a stub gate report exits 2", () => {
  const { root, head, agent, report } = qaSetup();
  writeGate(root, head, { stepsSource: "stub", ok: false });
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /stepsSource/);
});

test("AC 23: an approve missing a light screenshot names the story id and the mode", () => {
  const { root, agent, report } = qaSetup();
  report.screenshots = report.screenshots.filter((s) => s.mode !== "light");
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /components-checkbox/);
  assert.match(r.stderr, /light/);
});

test("an approve with no story under a changed stories file's title names the title", () => {
  const { root, agent, report } = qaSetup();
  report.screenshots = [];
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /Components\/Checkbox/);
});

test("AC 24: a screenshot outside its qa task folder exits 2 and names the path", () => {
  const { root, agent, report } = qaSetup();
  const other = writeShot(root, "ORV-1-other", "components-checkbox--basic-light.png");
  report.screenshots[0].path = other;
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, new RegExp(other.replaceAll(".", "\\.")));
});

test("AC 24: a screenshot that is not a PNG, or does not exist, exits 2 and names the path", () => {
  const { root, agent, report } = qaSetup();
  const path = writeShot(
    root,
    "ORV-1-qa",
    "components-checkbox--basic-light.png",
    Buffer.from("not a png"),
  );
  let r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, new RegExp(path.replaceAll(".", "\\.")));
  report.screenshots[0].path = path.replace("light", "missing");
  r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /missing/);
});

test("a screenshot named for another story or mode exits 2", () => {
  const { root, agent, report } = qaSetup();
  report.screenshots[0].path = report.screenshots[1].path;
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /must be named/);
});

test("storyTitle reads a named meta object, with satisfies or a type annotation, and the inline form", () => {
  const { root } = makePrRepo();
  const dir = join(root, "packages", "ds", "src", "forms");
  mkdirSync(dir, { recursive: true });
  const cases = {
    "named.stories.tsx":
      'const meta = {\n  title: "A/Named",\n  args: { title: "x" },\n} satisfies Meta<typeof X>;\nexport default meta;\n',
    "typed.stories.tsx":
      'const meta: Meta<typeof X> = {\n  title: "A/Typed",\n};\nexport default meta;\n',
    "inline.stories.tsx": 'export default {\n  title: "A/Inline",\n};\n',
  };
  for (const [name, body] of Object.entries(cases)) writeFileSync(join(dir, name), body);
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "titles");
  const head = git(root, "rev-parse", "HEAD");
  const at = (n) => storyTitle(root, head, `packages/ds/src/forms/${n}`);
  assert.equal(at("named.stories.tsx"), "A/Named");
  assert.equal(at("typed.stories.tsx"), "A/Typed");
  assert.equal(at("inline.stories.tsx"), "A/Inline");
});

test("storyTitle resolves the real CanvasChat and visual-asserts stories at HEAD", () => {
  const head = git(repoRoot, "rev-parse", "HEAD");
  const ds = "packages/design-system/src";
  assert.equal(
    storyTitle(repoRoot, head, `${ds}/components/canvas-chat/CanvasChat.stories.tsx`),
    "Application/Canvas chat",
  );
  assert.equal(
    storyTitle(repoRoot, head, `${ds}/testing/visual-asserts.stories.tsx`),
    "Foundations/Visual asserts",
  );
});

test("a title-less stories file takes Storybook's auto title from its path", () => {
  const { root, head: first } = makePrRepo();
  const dir = join(root, "packages", "ds", "src", "button");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "button.stories.tsx"), "export default {};\nexport const Basic = {};\n");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "more");
  const head = git(root, "rev-parse", "HEAD");
  assert.notEqual(head, first);
  const agent = bind(root, "qa", "ORV-1-qa");
  writeGate(root, head);
  const report = qaReport(root, head, "ORV-1-qa");
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /button\/button|button/);
});

test("a request_changes qa report needs no gate or screenshots but still follows the finding rules", () => {
  const { root, head, agent } = qaSetup();
  const base = qaReport(root, head, "ORV-1-qa");
  const report = {
    ...base,
    verdict: "request_changes",
    quality_gate: { ...base.quality_gate, ok: false },
    screenshots: [],
    findings: [finding()],
    ac: [{ ...base.ac[0], status: "fail" }, base.ac[1]],
  };
  assert.equal(stopWith(root, agent, "qa", report).code, 0);
});

test("I-2: a visual row whose computed_style evidence has no observed value or a malformed ref exits 2", () => {
  for (const evidence of [
    { kind: "computed_style", ref: "components-checkbox--basic .label gap", observed: "" },
    { kind: "computed_style", ref: "x", observed: "8px" },
  ]) {
    const { root, agent, report } = qaSetup();
    report.ac[0].evidence = [evidence];
    const r = stopWith(root, agent, "qa", report);
    assert.equal(r.code, 2, JSON.stringify(evidence));
    assert.match(r.stderr, /row 1/);
  }
});

test("I-7: an ac row's screenshot evidence outside its task folder, missing or not a PNG exits 2 and records nothing", () => {
  const { root, agent, report } = qaSetup();
  const elsewhere = writeShot(root, "ORV-1-other", "components-checkbox--basic-light.png");
  const notPng = writeShot(root, "ORV-1-qa", "notes.png", Buffer.from("not a png"));
  for (const [ref, named] of [
    [elsewhere, elsewhere],
    [notPng, notPng],
    [notPng.replace("notes", "absent"), "absent"],
  ]) {
    const bad = structuredClone(report);
    bad.ac[0].evidence = [{ kind: "screenshot", ref }];
    const r = stopWith(root, agent, "qa", bad);
    assert.equal(r.code, 2, ref);
    assert.ok(r.stderr.includes(named), `${ref}: ${r.stderr}`);
    assert.equal(has(root, "qa.json", "ORV-1-qa"), false);
  }
  assert.equal(stopWith(root, agent, "qa", report).code, 0);
});

test("I-2: an owner_verify row needs a screenshot in its evidence", () => {
  const { root, agent, report } = qaSetup();
  const shot = report.ac[0].evidence;
  report.ac[1] = { row: 2, status: "owner_verify", visual: false, evidence: [cmdEvidence] };
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /row 2.*owner_verify.*screenshot/);
  report.ac[1].evidence = shot;
  assert.equal(stopWith(root, agent, "qa", report).code, 0);
});

test("I-2: a row listed twice, or a row the spec does not have, exits 2", () => {
  const dup = qaSetup();
  dup.report.ac.push({ ...dup.report.ac[1], status: "fail" });
  const d = stopWith(dup.root, dup.agent, "qa", dup.report);
  assert.equal(d.code, 2);
  assert.match(d.stderr, /row 2 .*more than once/);
  const extra = qaSetup();
  extra.report.ac.push({ ...extra.report.ac[1], row: 99, status: "fail" });
  const e = stopWith(extra.root, extra.agent, "qa", extra.report);
  assert.equal(e.code, 2);
  assert.match(e.stderr, /row 99 .*not a row of the spec/);
});

test("S-2: an approve on a report marked partial exits 2 even when ok is true", () => {
  const { root, head, agent, report } = qaSetup();
  writeGate(root, head, { partial: true });
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /partial/);
});

// ---- Gate record: AC 55, 56 -----------------------------------------------------------------

const gates = (root) => {
  const dir = join(root, ".orivilo", "runs", "ORV-1", "gates");
  return existsSync(dir)
    ? execFileSync("ls", [dir], { encoding: "utf8" }).split("\n").filter(Boolean)
    : [];
};

test("AC 56: the main session running the gate writes a gate record from the report", () => {
  for (const command of [
    "pnpm quality-gate",
    "pnpm  run   quality-gate",
    "node scripts/quality-gate.mjs",
    "pnpm quality-gate --bail",
  ]) {
    const { root, head } = makePrRepo();
    writeGate(root, head);
    const r = run(postBashInput(root, command));
    assert.equal(r.code, 0, `${command}: ${r.stderr}`);
    const [file] = gates(root);
    const record = JSON.parse(readFileSync(join(root, ".orivilo/runs/ORV-1/gates", file), "utf8"));
    assert.equal(record.ok, true, command);
    assert.equal(record.sha, head);
    assert.equal(record.dirty, false);
    assert.equal(record.steps_source, "gate");
    assert.ok(!Number.isNaN(Date.parse(record.recorded_at)));
  }
});

test("the gate record carries a failed or stub report as it is", () => {
  const { root, head } = makePrRepo();
  writeGate(root, head, { ok: false, stepsSource: "stub" });
  assert.equal(run(postBashInput(root, "pnpm quality-gate")).code, 0);
  const [file] = gates(root);
  const record = JSON.parse(readFileSync(join(root, ".orivilo/runs/ORV-1/gates", file), "utf8"));
  assert.deepEqual([record.ok, record.steps_source], [false, "stub"]);
});

test("AC 55: a gate run inside a subagent writes no gate record", () => {
  const { root, head } = makePrRepo();
  writeGate(root, head, { ok: false });
  const r = run(postBashInput(root, "pnpm quality-gate", "agent-1"));
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(gates(root), []);
});

test("a command that only mentions the gate, or another command, writes no gate record", () => {
  const { root, head } = makePrRepo();
  writeGate(root, head);
  for (const command of [
    "echo pnpm quality-gate",
    "pnpm test",
    "git status",
    "cat quality-gate.mjs",
  ]) {
    assert.equal(run(postBashInput(root, command)).code, 0, command);
  }
  assert.deepEqual(gates(root), []);
});

test("a partial gate run (--only) is not a verdict and writes no gate record", () => {
  const { root, head } = makePrRepo();
  writeGate(root, head, { ok: false, partial: true });
  assert.equal(run(postBashInput(root, "pnpm quality-gate --only lint")).code, 0);
  assert.deepEqual(gates(root), []);
});

test("a gate run with an unreadable or malformed report exits 2", () => {
  const { root } = makePrRepo();
  assert.equal(run(postBashInput(root, "pnpm quality-gate")).code, 2);
  mkdirSync(join(root, ".quality-gate"), { recursive: true });
  writeFileSync(join(root, ".quality-gate", "report.json"), JSON.stringify({ ok: true }));
  assert.equal(run(postBashInput(root, "pnpm quality-gate")).code, 2);
});

test("C-1: a failed gate run reaches PostToolUseFailure and writes a failed gate record", () => {
  const { root, head } = makePrRepo();
  writeGate(root, head, { ok: false });
  const r = run(postBashFailureInput(root, "pnpm quality-gate"));
  assert.equal(r.code, 0, r.stderr);
  const [file] = gates(root);
  const record = JSON.parse(readFileSync(join(root, ".orivilo/runs/ORV-1/gates", file), "utf8"));
  assert.deepEqual([record.ok, record.sha, record.steps_source], [false, head, "gate"]);
});

test("C-1: an interrupted gate run, a failed other command or a subagent's failed run writes no record", () => {
  const { root, head } = makePrRepo();
  writeGate(root, head, { ok: false });
  assert.equal(
    run(postBashFailureInput(root, "pnpm quality-gate", { is_interrupt: true })).code,
    0,
  );
  assert.equal(run(postBashFailureInput(root, "pnpm test")).code, 0);
  assert.equal(
    run(postBashFailureInput(root, "pnpm quality-gate", { agent_id: "agent-1" })).code,
    0,
  );
  assert.deepEqual(gates(root), []);
});

test("S-1: a report older than the command, or for another commit, writes no gate record", () => {
  const { root, head } = makePrRepo();
  writeGate(root, head, { ok: false, finishedAt: new Date(Date.now() - 60_000).toISOString() });
  assert.equal(run(postBashFailureInput(root, "pnpm quality-gate; true")).code, 0);
  assert.equal(run(postBashInput(root, "pnpm quality-gate")).code, 0);
  writeGate(root, SHA, { ok: false });
  assert.equal(run(postBashFailureInput(root, "pnpm quality-gate")).code, 0);
  assert.deepEqual(gates(root), []);
});

test("S-6: a failed gate run whose input has no duration_ms exits 2 and writes no record", () => {
  const { root, head } = makePrRepo();
  writeGate(root, head, { ok: false });
  const input = postBashFailureInput(root, "pnpm quality-gate");
  delete input.duration_ms;
  const r = run(input);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /duration_ms/);
  assert.deepEqual(gates(root), []);
});

test("S-7: a report that started before the command, or finished after now, writes no gate record", () => {
  const { root, head } = makePrRepo();
  const ago = (ms) => new Date(Date.now() + ms).toISOString();
  // The command ran for 1s; this report started long before it and finished inside it.
  writeGate(root, head, { ok: false, startedAt: ago(-20_000), finishedAt: ago(-200) });
  assert.equal(run(postBashFailureInput(root, "pnpm quality-gate; true")).code, 0);
  // This report claims to finish a minute from now, so it would pass every later check.
  writeGate(root, head, { ok: false, startedAt: ago(-200), finishedAt: ago(60_000) });
  assert.equal(run(postBashFailureInput(root, "pnpm quality-gate; true")).code, 0);
  assert.deepEqual(gates(root), []);
  writeGate(root, head, { ok: false, startedAt: ago(-500), finishedAt: ago(-100) });
  assert.equal(run(postBashFailureInput(root, "pnpm quality-gate")).code, 0);
  assert.equal(gates(root).length, 1);
});

// ---- Failed Agent calls: I-3 -------------------------------------------------------------------

test("I-3: a failed Agent call closes its bound open envelope as no_report and exits 2", () => {
  const root = makeRepo();
  bind(root, "builder", "ORV-1-a");
  const prompt = JSON.stringify(validEnvelope(root, { task_id: "ORV-1-a" }));
  const r = run(postAgentFailureInput(root, prompt));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ORV-1-a closed as no_report/);
  assert.equal(read(root, "closed.json", "ORV-1-a").reason, "no_report");
  assert.equal(has(root, "result.json", "ORV-1-a"), false);
});

test("I-3: a failed Agent call with an unbound, closed, foreign or non-envelope prompt changes nothing", () => {
  const root = makeRepo();
  seedTask(root, "ORV-1", "ORV-1-u", { envelope: validEnvelope(root, { task_id: "ORV-1-u" }) });
  seedTask(root, "ORV-1", "ORV-1-done", {
    envelope: validEnvelope(root, { task_id: "ORV-1-done", role: "reviewer", write_set: [] }),
    agent: { agent_id: "x", agent_type: "reviewer", started_at: "2026-10-23T09:00:00.000Z" },
    closed: { reason: "no_report", closed_at: "2026-10-23T09:01:00.000Z" },
  });
  for (const task of ["ORV-1-u", "ORV-1-done", "ORV-1-nobody"]) {
    const prompt = JSON.stringify(validEnvelope(root, { task_id: task }));
    assert.equal(run(postAgentFailureInput(root, prompt)).code, 0, task);
  }
  assert.equal(run(postAgentFailureInput(root, "not an envelope")).code, 0);
  assert.equal(has(root, "closed.json", "ORV-1-u"), false);
});

test("S-8: a failed Agent call closes only the envelope of its own issue, task_id and role", () => {
  const root = makeRepo();
  seedTask(root, "ORV-0", "dup", {
    envelope: validEnvelope(root, {
      issue: "ORV-0",
      task_id: "dup",
      role: "product",
      write_set: [],
    }),
    agent: { agent_id: "agent-0", agent_type: "product", started_at: "2026-10-23T09:00:00.000Z" },
  });
  seedTask(root, "ORV-1", "dup", {
    envelope: validEnvelope(root, { task_id: "dup", role: "builder" }),
    agent: { agent_id: "agent-1", agent_type: "builder", started_at: "2026-10-23T09:00:00.000Z" },
  });
  const wrongRole = JSON.stringify(validEnvelope(root, { task_id: "dup", role: "reviewer" }));
  assert.equal(run(postAgentFailureInput(root, wrongRole)).code, 0);
  assert.equal(has(root, "closed.json", "dup"), false);
  const prompt = JSON.stringify(validEnvelope(root, { task_id: "dup", role: "builder" }));
  const r = run(postAgentFailureInput(root, prompt));
  assert.equal(r.code, 2);
  assert.equal(has(root, "closed.json", "dup"), true);
  assert.equal(existsSync(join(root, ".orivilo/runs/ORV-0/dup/closed.json")), false);
});

test("I-8: a failed Agent call for one issue leaves a same-role, same-task_id envelope of another issue open", () => {
  const root = makeRepo();
  for (const issue of ["ORV-0", "ORV-1"]) {
    seedTask(root, issue, "dup", {
      envelope: validEnvelope(root, { issue, task_id: "dup", role: "builder" }),
      agent: {
        agent_id: `agent-${issue}`,
        agent_type: "builder",
        started_at: "2026-10-23T09:00:00.000Z",
      },
    });
  }
  const prompt = JSON.stringify(
    validEnvelope(root, { issue: "ORV-1", task_id: "dup", role: "builder" }),
  );
  assert.equal(run(postAgentFailureInput(root, prompt)).code, 2);
  assert.equal(existsSync(join(root, ".orivilo/runs/ORV-1/dup/closed.json")), true);
  assert.equal(existsSync(join(root, ".orivilo/runs/ORV-0/dup/closed.json")), false);
});

test("I-9: the report skeleton in each agent file builds a sample that passes its schema, and a stray field fails", () => {
  const skeletons = {
    builder: "implementer.v1",
    product: "implementer.v1",
    "ds-architect": "implementer.v1",
    designer: "implementer.v1",
    release: "implementer.v1",
    reviewer: "reviewer.v1",
  };
  for (const [agent, contract] of Object.entries(skeletons)) {
    const text = readFileSync(join(repoRoot, ".claude/agents", `${agent}.md`), "utf8");
    const match = text.match(/exactly these fields and no others: `(\{.*?\})`\./);
    assert.ok(match, `${agent} lists its fields`);
    const sample = JSON.parse(
      match[1]
        .replace(/"done" or "blocked"/, '"done"')
        .replace(/"approve" or "request_changes"/, '"approve"')
        .replace(/"Critical" or "Important" or "Suggestion"/, '"Important"')
        .replace("<40 lowercase hex>", "a".repeat(40)),
    );
    if (contract === "implementer.v1") {
      assert.deepEqual(validate(contract, sample).errors, [], agent);
    } else {
      sample.findings[0].evidence = { kind: "command", ref: "pnpm test", observed: "ok" };
      assert.deepEqual(validate(contract, sample).errors, [], agent);
    }
    assert.notEqual(validate(contract, { ...sample, summary: "x" }).errors.length, 0, agent);
  }
});

// ---- AC 47, 48 and registration ---------------------------------------------------------------

test("AC 47: malformed stdin exits 2 for the recorder and the wrapper", () => {
  for (const raw of ["", "{x", "null", "[]"]) {
    assert.equal(runNode(recorder, raw).code, 2, raw);
  }
});

test("AC 48: an event the recorder does not know, or a missing field, fails closed", () => {
  const root = makeRepo();
  assert.equal(run({ cwd: root, hook_event_name: "Notification" }).code, 2);
  const start = startInput(root, "a", "builder");
  delete start.agent_id;
  assert.equal(run(start).code, 2);
  const stop = stopInput(root, "a", "builder", "x");
  delete stop.last_assistant_message;
  assert.equal(run(stop).code, 2);
});

test("the recorder is registered on SubagentStart, SubagentStop, PostToolUse and PostToolUseFailure for Agent and Bash", () => {
  const mine = registeredCommands().filter((c) => c.command.includes("result-recorder"));
  const key = (c) => `${c.event}:${c.matcher ?? ""}`;
  assert.deepEqual(mine.map(key).sort(), [
    "PostToolUse:Agent",
    "PostToolUse:Bash",
    "PostToolUseFailure:Agent",
    "PostToolUseFailure:Bash",
    "SubagentStart:",
    "SubagentStop:",
  ]);
  const stop = mine.find((c) => c.event === "SubagentStop");
  assert.match(stop.command, /result-recorder\.sh/);
  for (const c of mine) assert.match(c.command, /\|\| exit 2$/);
});

// ---- ORV-89: a background Agent call is recorded at SubagentStop -----------------------------

/** The recorded background launch, pointed at `root`, for a launch whose agent id is `agentId`. */
const backgroundLaunch = (root, agentId, subagentType) => {
  const base = fixture("PostToolUse-Agent-background");
  return {
    ...base,
    cwd: root,
    tool_input: { ...base.tool_input, subagent_type: subagentType },
    tool_response: { ...base.tool_response, agentId },
  };
};

/** The recorded background SubagentStop: the agent still lists itself as a running background task. */
const backgroundStop = (root, agentId, agentType, message, extra = {}) => ({
  ...fixture("SubagentStop-background"),
  cwd: root,
  agent_id: agentId,
  agent_type: agentType,
  last_assistant_message: typeof message === "string" ? message : JSON.stringify(message),
  background_tasks: [
    { id: agentId, type: "subagent", status: "running", description: "x", agent_type: agentType },
  ],
  ...extra,
});

test("ORV-89: a background launch (async_launched) before the bind exits 0 and records nothing", () => {
  const root = makeRepo();
  seedTask(root, "ORV-1", "ORV-1-a", { envelope: validEnvelope(root) });
  const launch = run(backgroundLaunch(root, "agent-bg", "builder"));
  assert.equal(launch.code, 0, launch.stderr);
  assert.equal(has(root, "result.json"), false);
  assert.equal(has(root, "closed.json"), false);
  assert.equal(run(startInput(root, "agent-bg", "builder")).code, 0);
});

test("ORV-89: launch and start at the same moment, then a valid report at SubagentStop gives one result.json", () => {
  const root = makeRepo();
  seedTask(root, "ORV-1", "ORV-1-a", { envelope: validEnvelope(root) });
  assert.equal(run(backgroundLaunch(root, "agent-bg", "builder")).code, 0);
  assert.equal(run(startInput(root, "agent-bg", "builder")).code, 0);
  assert.equal(has(root, "result.json"), false);
  const stop = run(backgroundStop(root, "agent-bg", "builder", implementer("ORV-1-a")));
  assert.equal(stop.code, 0, stop.stderr);
  const result = read(root, "result.json");
  assert.equal(result.contract, "implementer.v1");
  assert.equal(result.agent_id, "agent-bg");
  assert.equal(result.report.task_id, "ORV-1-a");
  assert.equal(validate("implementer.v1", result.report).ok, true);
  assert.equal(has(root, "closed.json"), false);
  // A second stop for the same agent records nothing more and is not a second result.
  const again = run(backgroundStop(root, "agent-bg", "builder", implementer("ORV-1-a")));
  assert.equal(again.code, 2);
  assert.match(again.stderr, /already closed/);
});

test("ORV-89: the start may come before the launch hook; the result is still recorded once", () => {
  const root = makeRepo();
  seedTask(root, "ORV-1", "ORV-1-a", { envelope: validEnvelope(root) });
  assert.equal(run(startInput(root, "agent-bg", "builder")).code, 0);
  assert.equal(run(backgroundLaunch(root, "agent-bg", "builder")).code, 0);
  assert.equal(run(backgroundStop(root, "agent-bg", "builder", implementer("ORV-1-a"))).code, 0);
  assert.equal(read(root, "result.json").agent_id, "agent-bg");
});

test("ORV-89: a background report that fails its contract is sent back; with stop_hook_active it is closed as no_report", () => {
  const root = makeRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  const sent = run(backgroundStop(root, agent, "builder", "prose"));
  assert.equal(sent.code, 2);
  assert.match(sent.stderr, /implementer\.v1/);
  assert.equal(has(root, "result.json"), false);
  assert.equal(has(root, "closed.json"), false);
  const last = run(backgroundStop(root, agent, "builder", "prose", { stop_hook_active: true }));
  assert.equal(last.code, 0, last.stderr);
  assert.equal(has(root, "result.json"), false);
  assert.equal(read(root, "closed.json").reason, "no_report");
});

test("ORV-89: a foreground call still records once, at PostToolUse, and not at SubagentStop", () => {
  const root = makeRepo();
  const agent = bind(root, "builder", "ORV-1-a");
  assert.equal(
    run(stopInput(root, agent, "builder", JSON.stringify(implementer("ORV-1-a")))).code,
    0,
  );
  assert.equal(has(root, "result.json"), false);
  const post = run(postAgentInput(root, agent, "builder", JSON.stringify(implementer("ORV-1-a"))));
  assert.equal(post.code, 0, post.stderr);
  assert.equal(read(root, "result.json").agent_id, agent);
});

// ---- ORV-93 PR 1: a qa works in the PR checkout, its records live in the main checkout --------

test("ORV-93 row 31: a qa envelope is dispatched, bound at start and recorded with qa.json at stop", () => {
  const { root, head } = makePrRepo();
  writeGate(root, head);
  const envelope = validEnvelope(root, {
    task_id: "ORV-1-qa-1",
    role: "qa",
    write_set: [],
    facts: [{ claim: "The PR exists", checked_by: "gh pr view 7" }],
    skills: ["quality-gate", "webapp-testing"],
  });
  const guard = runNode(hook("envelope-guard.mjs"), agentInput(root, envelope));
  assert.equal(guard.code, 0, guard.stderr);
  assert.equal(run(startInput(root, "agent-qa-1", "qa")).code, 0);
  assert.equal(read(root, "agent.json", "ORV-1-qa-1").agent_type, "qa");
  const report = qaReport(root, head, "ORV-1-qa-1");
  assert.equal(stopWith(root, "agent-qa-1", "qa", report).code, 0);
  const r = run(postAgentInput(root, "agent-qa-1", "qa", JSON.stringify(report)));
  assert.equal(r.code, 0, r.stderr);
  for (const name of ["envelope.json", "agent.json", "result.json", "qa.json"]) {
    assert.ok(has(root, name, "ORV-1-qa-1"), name);
  }
  assert.equal(read(root, "qa.json", "ORV-1-qa-1").report.verdict, "approve");
});

test("ORV-93 row 32: screenshots are found in the main checkout's records, not the qa's own worktree", () => {
  const { root, head } = makePrRepo();
  const wt = join(root, ".claude", "worktrees", "w");
  git(root, "worktree", "add", "-q", "-b", "feature/ORV-1-wt", wt);
  writeGate(wt, head);
  const agent = bind(root, "qa", "ORV-1-qa-1", { worktree: wt });
  const report = qaReport(root, head, "ORV-1-qa-1");
  const ok = run(stopInput(wt, agent, "qa", JSON.stringify(report)));
  assert.equal(ok.code, 0, ok.stderr);
  const done = run(postAgentInput(wt, agent, "qa", JSON.stringify(report)));
  assert.equal(done.code, 0, done.stderr);
  assert.ok(has(root, "result.json", "ORV-1-qa-1"));

  const other = makePrRepo();
  const wt2 = join(other.root, ".claude", "worktrees", "w");
  git(other.root, "worktree", "add", "-q", "-b", "feature/ORV-1-wt", wt2);
  writeGate(wt2, other.head);
  const agent2 = bind(other.root, "qa", "ORV-1-qa-1", { worktree: wt2 });
  const inWt = qaReport(wt2, other.head, "ORV-1-qa-1");
  const bad = run(stopInput(wt2, agent2, "qa", JSON.stringify(inWt)));
  assert.equal(bad.code, 2);
  assert.match(bad.stderr, /screenshots\/components-checkbox--basic-light\.png/);
  assert.match(bad.stderr, /main checkout/);
  assert.equal(has(other.root, "result.json", "ORV-1-qa-1"), false);
});

test("ORV-93: a reviewer in a worktree keeps a finding whose screenshot lives in the main checkout's records", () => {
  const { root, head } = makePrRepo();
  const wt = join(root, ".claude", "worktrees", "w");
  git(root, "worktree", "add", "-q", "-b", "feature/ORV-1-wt", wt);
  const agent = bind(root, "reviewer", "ORV-1-rev", { worktree: wt });
  const shot = writeShot(root, "ORV-1-rev", "x--y-light.png");
  assert.equal(existsSync(join(wt, shot)), false);
  const report = reviewer("ORV-1-rev", {
    verdict: "request_changes",
    head_sha: head,
    findings: [finding({ id: "S1", evidence: { kind: "screenshot", ref: shot } })],
  });
  const stop = run(stopInput(wt, agent, "reviewer", JSON.stringify(report)));
  assert.equal(stop.code, 0, stop.stderr);
  const r = run(postAgentInput(wt, agent, "reviewer", JSON.stringify(report)));
  assert.equal(r.code, 0, r.stderr);
  const result = read(root, "result.json", "ORV-1-rev");
  assert.deepEqual(
    result.report.findings.map((f) => f.id),
    ["S1"],
  );
  assert.deepEqual(result.dropped, []);
});

// ---- ORV-138: qa-spec-1, a qa report on an issue with no usable spec ---------------------------

const NO_TABLE = "no acceptance table in docs/specs/ORV-1/spec.md";
/** The whole stderr of a refusal: the header and the one problem, nothing else. */
const ONLY_NO_TABLE = `result-recorder blocked:\n- ${NO_TABLE}`;
const specFile = (root) => join(root, "docs", "specs", "ORV-1", "spec.md");

/**
 * The ways the spec can be unusable at the head, as the `spec` argument of makePrRepo: no file, a
 * folder where the file should be, prose with no `#` table.
 */
const brokenSpecs = {
  missing: () => {},
  unreadable: (path) => {
    mkdirSync(path);
    writeFileSync(join(path, "x"), "x\n");
  },
  "no acceptance table": "# ORV-1\n\n| Name | Value |\n| --- | --- |\n| a | b |\n",
};

test("ORV-138 row 3: a qa report on an issue whose spec file is missing or unreadable is sent back with the one problem, never a throw", () => {
  for (const kind of ["missing", "unreadable"]) {
    const { root, agent, report } = qaSetup({}, brokenSpecs[kind]);
    const r = stopWith(root, agent, "qa", report);
    assert.equal(r.code, 2, `${kind}: ${r.stderr}`);
    assert.equal(r.stderr.trim(), ONLY_NO_TABLE, kind);
    const last = heartbeatLines(root).at(-1);
    assert.equal(last.event, "SubagentStop", kind);
    assert.equal(last.decision, "block", kind);
    assert.equal(has(root, "result.json", "ORV-1-qa"), false, kind);
  }
});

test("ORV-138 row 4: a qa report on a spec with no acceptance table is sent back with the one problem", () => {
  const { root, agent, report } = qaSetup({}, brokenSpecs["no acceptance table"]);
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2, r.stderr);
  assert.equal(r.stderr.trim(), ONLY_NO_TABLE);
  assert.equal(heartbeatLines(root).at(-1).decision, "block");
  // A table whose header starts with `#` but holds no numbered row is no acceptance table either.
  const empty = qaSetup({}, "| # | Criterion |\n| --- | --- |\n| x | y |\n");
  const e = stopWith(empty.root, empty.agent, "qa", empty.report);
  assert.equal(e.code, 2, e.stderr);
  assert.equal(e.stderr.trim(), ONLY_NO_TABLE);
});

test("ORV-138 row 5: PostToolUse on the Agent call of a qa report with no usable spec closes the envelope as no_report", () => {
  for (const kind of Object.keys(brokenSpecs)) {
    const { root, agent, report } = qaSetup({}, brokenSpecs[kind]);
    const r = run(postAgentInput(root, agent, "qa", JSON.stringify(report)));
    assert.equal(r.code, 2, `${kind}: ${r.stderr}`);
    assert.ok(r.stderr.includes(NO_TABLE), kind);
    assert.match(r.stderr, /ORV-1-qa closed as no_report/, kind);
    assert.equal(read(root, "closed.json", "ORV-1-qa").reason, "no_report", kind);
    assert.equal(has(root, "result.json", "ORV-1-qa"), false, kind);
  }
});

test("ORV-138 row 8: a qa report on a slice issue is recorded against the slice's own spec, and no parent spec is read", () => {
  const { root } = makePrRepo();
  // ORV-2 is a slice of ORV-1. Its own spec holds the copied rows 7 and 8; the parent spec (ORV-1) holds rows 1 and 2.
  mkdirSync(join(root, "docs", "specs", "ORV-2"), { recursive: true });
  writeFileSync(
    join(root, "docs", "specs", "ORV-2", "spec.md"),
    [
      "| #   | Given | When | Result            | Evidence |",
      "| --- | ----- | ---- | ----------------- | -------- |",
      "| 7   | a     | b    | The row is saved  | test     |",
      "| 8   | a     | b    | The row is listed | test     |",
      "",
    ].join("\n"),
  );
  git(root, "add", "docs/specs/ORV-2/spec.md");
  git(root, "commit", "-q", "-m", "slice spec");
  const head = git(root, "rev-parse", "HEAD");
  writeGate(root, head);
  const task = "ORV-2-qa";
  const agent = `agent-${task}`;
  seedTask(root, "ORV-2", task, {
    envelope: validEnvelope(root, {
      task_id: task,
      issue: "ORV-2",
      role: "qa",
      write_set: [],
      skills: ["quality-gate", "webapp-testing"],
    }),
    agent: { agent_id: agent, agent_type: "qa", started_at: "2026-10-23T09:00:00.000Z" },
  });
  const shotDir = join(taskDir(root, task, "ORV-2"), "screenshots");
  mkdirSync(shotDir, { recursive: true });
  const shot = (mode) => {
    const name = `components-checkbox--basic-${mode}.png`;
    writeFileSync(join(shotDir, name), PNG);
    return {
      story: "components-checkbox--basic",
      mode,
      path: `.orivilo/runs/ORV-2/${task}/screenshots/${name}`,
      looked_at: true,
      note: "the check glyph sits on the label centre line",
    };
  };
  const rows = (list) =>
    list.map((row) => ({ row, status: "pass", visual: false, evidence: [cmdEvidence] }));
  const report = {
    task_id: task,
    issue: "ORV-2",
    pr: 8,
    verdict: "approve",
    head_sha: head,
    quality_gate: { report: ".quality-gate/report.json", ok: true, head_sha: head },
    ac: rows([7, 8]),
    screenshots: [shot("light"), shot("dark")],
    findings: [],
  };
  // The parent's rows are not the slice's: a report that carries them is refused as rows the spec lacks.
  const parentRows = stopWith(root, agent, "qa", { ...report, ac: rows([1, 2]) });
  assert.equal(parentRows.code, 2, parentRows.stderr);
  assert.match(parentRows.stderr, /row 1/);
  // The slice's own rows are accepted and recorded.
  const stop = stopWith(root, agent, "qa", report);
  assert.equal(stop.code, 0, stop.stderr);
  const recorded = run(postAgentInput(root, agent, "qa", JSON.stringify(report)));
  assert.equal(recorded.code, 0, recorded.stderr);
  const qa = JSON.parse(readFileSync(join(taskDir(root, task, "ORV-2"), "qa.json"), "utf8"));
  assert.deepEqual(
    qa.report.ac.map((a) => a.row),
    [7, 8],
  );
});

// ---- ORV-138 (ORV-136): spec-at-head-1, qa-scope-1, qa-scope-2, no-throw-1 --------------------

const ROW3 = "| 3   | a     | b    | The row is listed                 | test     |\n";
const THREE_ROWS = DEFAULT_SPEC + ROW3;
const passRow = (row) => ({ row, status: "pass", visual: false, evidence: [cmdEvidence] });
const rowsOf = (report) => report.ac.map((a) => a.row);

test("ORV-138 row 13: the spec is read as committed at the report's head, not from the working tree", () => {
  // The working tree holds prose with no table; the head holds the table: the walk is accepted.
  const a = qaSetup();
  writeFileSync(specFile(a.root), "# changed after the commit\n");
  const accepted = stopWith(a.root, a.agent, "qa", a.report);
  assert.equal(accepted.code, 0, accepted.stderr);
  // The head holds row 3 and the working tree does not: a report without row 3 is refused for it.
  const b = qaSetup({}, THREE_ROWS);
  writeFileSync(specFile(b.root), DEFAULT_SPEC);
  const refused = stopWith(b.root, b.agent, "qa", b.report);
  assert.equal(refused.code, 2, refused.stderr);
  assert.match(refused.stderr, /ac has no entry for spec row 3/);
  // The reverse: the working tree has row 3 and the head does not.
  const c = qaSetup();
  writeFileSync(specFile(c.root), THREE_ROWS);
  assert.equal(stopWith(c.root, c.agent, "qa", c.report).code, 0);
});

const PER_PR = `${THREE_ROWS}\n## Rows per PR\n\n- PR 7: rows 1, 3\n- PR 8: rows 2\n`;

test("ORV-138 row 14: an approve on a PR with a line has an entry for each listed row only; with no line every row counts", () => {
  const listed = qaSetup({}, PER_PR);
  listed.report.ac = [listed.report.ac[0], passRow(3)];
  const ok = stopWith(listed.root, listed.agent, "qa", listed.report);
  assert.equal(ok.code, 0, ok.stderr);
  const rec = run(postAgentInput(listed.root, listed.agent, "qa", JSON.stringify(listed.report)));
  assert.equal(rec.code, 0, rec.stderr);
  assert.deepEqual(rowsOf(read(listed.root, "qa.json", "ORV-1-qa").report), [1, 3]);
  // A range in the list.
  const range = qaSetup({}, PER_PR.replace("rows 1, 3", "rows 1-3"));
  range.report.ac = [range.report.ac[0], range.report.ac[1], passRow(3)];
  assert.equal(stopWith(range.root, range.agent, "qa", range.report).code, 0);
  // No line for PR 7 (only PR 8 has one): every row of the table is in scope, as before.
  const fallback = qaSetup({}, THREE_ROWS + "\n## Rows per PR\n\n- PR 8: rows 2\n");
  fallback.report.ac.push(passRow(3));
  assert.equal(stopWith(fallback.root, fallback.agent, "qa", fallback.report).code, 0);
  const skipped = qaSetup({}, THREE_ROWS + "\n## Rows per PR\n\n- PR 8: rows 2\n");
  const miss = stopWith(skipped.root, skipped.agent, "qa", skipped.report);
  assert.equal(miss.code, 2);
  assert.match(miss.stderr, /ac has no entry for spec row 3/);
  // No section at all.
  const none = qaSetup({}, THREE_ROWS);
  none.report.ac.push(passRow(3));
  assert.equal(stopWith(none.root, none.agent, "qa", none.report).code, 0);
});

test("ORV-138 row 15: each condition of qa-scope-1, broken, refuses the report", () => {
  const refusal = (spec, edit, pattern, label) => {
    const s = qaSetup({}, spec);
    edit(s.report);
    const r = stopWith(s.root, s.agent, "qa", s.report);
    assert.equal(r.code, 2, `${label}: ${r.stderr}`);
    assert.match(r.stderr, pattern, label);
    assert.equal(heartbeatLines(s.root).at(-1).decision, "block", label);
  };
  // 1. exactly one entry for each listed row: one missing, one repeated
  refusal(
    PER_PR,
    (report) => (report.ac = [report.ac[0]]),
    /ac has no entry for spec row 3/,
    "missing entry",
  );
  refusal(
    PER_PR,
    (report) => (report.ac = [report.ac[0], passRow(3), passRow(3)]),
    /ac row 3 appears more than once/,
    "repeated entry",
  );
  // 2. an entry for an unlisted row
  refusal(
    PER_PR,
    (report) => report.ac.push(passRow(3)),
    /ac row 2 is not in PR 7's rows/,
    "unlisted row",
  );
  // 3. a listed number that is not a row of the table
  refusal(
    PER_PR.replace("rows 1, 3", "rows 1, 3, 9"),
    (report) => (report.ac = [report.ac[0], passRow(3)]),
    /PR 7 lists row 9, which is not in the acceptance table/,
    "listed number not in the table",
  );
  // 4. an approve needs every listed row pass or owner_verify
  refusal(
    PER_PR,
    (report) => (report.ac = [report.ac[0], { ...passRow(3), status: "fail" }]),
    /ac row 3 is fail; an approve needs every row pass or owner_verify/,
    "listed row fail",
  );
  // A malformed line leaves the scope unknown, so it refuses and does not widen the scope.
  for (const bad of ["- PR 7: rows 3-1", "- PR 7: rows one", "- PR seven: rows 1"]) {
    refusal(
      `${THREE_ROWS}\n## Rows per PR\n\n${bad}\n`,
      () => {},
      /malformed line under "## Rows per PR"/,
      bad,
    );
  }
});

const ENGINE_CELL = "`colour-area` items whose `area-share` sums to 1 within 0.001 per scope";
const engineSpec = (nothing = "") =>
  [
    "| #   | Given | When | User sees   | Evidence |",
    "| --- | ----- | ---- | ----------- | -------- |",
    `| 1   | a     | b    | ${ENGINE_CELL} | test     |`,
    "| 2   | a     | b    | The row is saved | test |",
    "",
    nothing,
  ].join("\n");
const NOTHING = (list) => `## Rows that render nothing\n\n- Rows: ${list}\n`;

test("ORV-138 row 16: qa-scope-2 exempts a listed row from the keyword rule, and reads only the User sees column", () => {
  const engine = (nothing, edit) => {
    const s = qaSetup({}, engineSpec(nothing));
    s.report.ac = [{ ...passRow(1) }, passRow(2)];
    edit?.(s.report);
    return { ...s, r: stopWith(s.root, s.agent, "qa", s.report) };
  };
  // Unlisted: the keyword in the User sees cell makes row 1 visual, so visual: false is refused.
  const unlisted = engine("");
  assert.equal(unlisted.r.code, 2, unlisted.r.stderr);
  assert.match(unlisted.r.stderr, /ac row 1 is visual by the spec's keyword list/);
  // Listed: the same entry is accepted.
  const listed = engine(NOTHING("1"));
  assert.equal(listed.r.code, 0, listed.r.stderr);
  // Listed and marked visual: still needs screenshot or computed_style evidence.
  const marked = engine(NOTHING("1"), (report) => (report.ac[0].visual = true));
  assert.equal(marked.r.code, 2, marked.r.stderr);
  assert.match(marked.r.stderr, /screenshot|computed_style/);
  const shot = qaReport(marked.root, marked.head, "ORV-1-qa").ac[0].evidence;
  const withShot = engine(NOTHING("1"), (report) => {
    report.ac[0] = { row: 1, status: "pass", visual: true, evidence: shot };
  });
  assert.equal(withShot.r.code, 0, withShot.r.stderr);
  // A listed number that is not a row of the table refuses the report.
  const stray = engine(NOTHING("1, 9"));
  assert.equal(stray.r.code, 2, stray.r.stderr);
  assert.match(stray.r.stderr, /lists row 9, which is not in the acceptance table/);
  // A malformed line of the section leaves the exemption unknown, so it refuses.
  const bad = engine("## Rows that render nothing\n\n- Rows: one\n");
  assert.equal(bad.r.code, 2, bad.r.stderr);
  assert.match(bad.r.stderr, /malformed line under "## Rows that render nothing"/);
  // Column case: this spec's own header; a keyword in the Check cell of an unlisted row is no keyword row.
  const checkSpec = [
    "| # | Source | Criterion | Check |",
    "| --- | --- | --- | --- |",
    "| 1 | ORV-1 | The label is centred | the colour and spacing of the layout |",
    "| 2 | ORV-1 | The row is saved | pnpm test |",
    "",
  ].join("\n");
  const column = qaSetup({}, checkSpec);
  column.report.ac = [passRow(1), passRow(2)];
  const c = stopWith(column.root, column.agent, "qa", column.report);
  assert.equal(c.code, 0, c.stderr);
});

/** A qa approve whose head is a commit that removes the stories file the base holds. */
function removedStorySetup() {
  const { root } = makePrRepo();
  git(root, "update-ref", "refs/remotes/origin/develop", "HEAD");
  git(root, "rm", "-q", "packages/ds/src/checkbox/checkbox.stories.tsx");
  git(root, "commit", "-q", "-m", "remove the story");
  const head = git(root, "rev-parse", "HEAD");
  const agent = bind(root, "qa", "ORV-1-qa");
  writeGate(root, head);
  return { root, head, agent, report: qaReport(root, head, "ORV-1-qa") };
}

test("ORV-138 row 36: a gate report or git read that fails gives a refusal, at SubagentStop and at PostToolUse, never a throw", () => {
  const cases = {
    "(a) no gate report": [
      ({ root }) => rmSync(join(root, ".quality-gate", "report.json")),
      /\.quality-gate\/report\.json cannot be read in /,
    ],
    "(b) gate report is not JSON": [
      ({ root }) => writeFileSync(join(root, ".quality-gate", "report.json"), "not json"),
      /\.quality-gate\/report\.json is not JSON/,
    ],
    "(c) gate report lacks the fields": [
      ({ root }) => writeFileSync(join(root, ".quality-gate", "report.json"), '{"ok":true}'),
      /\.quality-gate\/report\.json lacks ok, stepsSource, git\.sha or git\.dirty/,
    ],
    "(c) gate report is null": [
      ({ root }) => writeFileSync(join(root, ".quality-gate", "report.json"), "null"),
      /\.quality-gate\/report\.json lacks ok, stepsSource, git\.sha or git\.dirty/,
    ],
    "(d) head is not in the checkout": [
      ({ report }) => {
        report.head_sha = "f".repeat(40);
        report.quality_gate.head_sha = report.head_sha;
      },
      // spec-at-head-1 reads first: a head the checkout lacks has no spec, which is qa-spec-1's refusal.
      new RegExp(NO_TABLE),
    ],
    "(d) origin/develop is not in the checkout": [
      ({ root }) => git(root, "update-ref", "-d", "refs/remotes/origin/develop"),
      /git diff origin\/develop\.\.\.[0-9a-f]{40} failed in .*: fetch the head and origin\/develop there/,
    ],
  };
  for (const [label, [break_, pattern]] of Object.entries(cases)) {
    const stopSide = qaSetup();
    break_(stopSide);
    const stop = stopWith(stopSide.root, stopSide.agent, "qa", stopSide.report);
    assert.equal(stop.code, 2, `${label}: ${stop.stderr}`);
    assert.match(stop.stderr, pattern, label);
    assert.equal(heartbeatLines(stopSide.root).at(-1).event, "SubagentStop", label);
    assert.equal(heartbeatLines(stopSide.root).at(-1).decision, "block", label);
    const postSide = qaSetup();
    break_(postSide);
    const post = run(
      postAgentInput(postSide.root, postSide.agent, "qa", JSON.stringify(postSide.report)),
    );
    assert.equal(post.code, 2, `${label}: ${post.stderr}`);
    assert.match(post.stderr, pattern, label);
    assert.match(post.stderr, /ORV-1-qa closed as no_report/, label);
    assert.equal(heartbeatLines(postSide.root).at(-1).decision, "block", label);
    assert.equal(read(postSide.root, "closed.json", "ORV-1-qa").reason, "no_report", label);
  }
  // The other problems of the report are still listed when the gate report is unusable.
  const both = qaSetup();
  rmSync(join(both.root, ".quality-gate", "report.json"));
  both.report.ac[1].status = "fail";
  both.report.screenshots = [];
  const listed = stopWith(both.root, both.agent, "qa", both.report);
  assert.match(listed.stderr, /cannot be read in /);
  assert.match(listed.stderr, /ac row 2 is fail/);
  assert.match(listed.stderr, /no screenshot for a story of "Components\/Checkbox"/);
  // (e) a changed stories file that the head removed is skipped: no story, no screenshot, no refusal.
  const removed = removedStorySetup();
  const ok = stopWith(removed.root, removed.agent, "qa", removed.report);
  assert.equal(ok.code, 0, ok.stderr);
  const okPost = run(
    postAgentInput(removed.root, removed.agent, "qa", JSON.stringify(removed.report)),
  );
  assert.equal(okPost.code, 0, okPost.stderr);
});

test("ORV-138 no-throw-1: a screenshot path that is a folder is refused as not a PNG, never a throw", () => {
  const { root, agent, report } = qaSetup();
  const shot = join(root, report.screenshots[0].path);
  rmSync(shot);
  mkdirSync(shot);
  const r = stopWith(root, agent, "qa", report);
  assert.equal(r.code, 2, r.stderr);
  assert.match(r.stderr, /is not a PNG file/);
  assert.equal(heartbeatLines(root).at(-1).decision, "block");
});
