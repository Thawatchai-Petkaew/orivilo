import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  agentInput,
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
  seedGate,
  seedGrant,
  seedTask,
  seedVerdict,
  validEnvelope,
} from "./hook-test-kit.mjs";

const guard = hook("envelope-guard.mjs");
const dispatch = (root, envelope, toolInput) =>
  runNode(guard, agentInput(root, envelope, toolInput));

test("AC 7: a valid envelope runs, is saved, and leaves a heartbeat", () => {
  const root = makeRepo();
  const r = dispatch(root, validEnvelope(root));
  assert.equal(r.code, 0, r.stderr);
  const saved = join(root, ".orivilo", "runs", "ORV-1", "ORV-1-a", "envelope.json");
  assert.equal(JSON.parse(readFileSync(saved, "utf8")).task_id, "ORV-1-a");
  const [beat] = heartbeatLines(root);
  assert.equal(beat.hook, "envelope-guard");
  assert.equal(beat.decision, "allow");
  assert.equal(beat.tool, "Agent");
  assert.equal(beat.agent_id, null);
});

test("a blocked call leaves a block heartbeat and writes no envelope", () => {
  const root = makeRepo();
  const r = dispatch(root, validEnvelope(root, { objective: "" }));
  assert.equal(r.code, 2);
  assert.equal(heartbeatLines(root)[0].decision, "block");
  assert.equal(existsSync(join(root, ".orivilo", "runs")), false);
});

test("an envelope whose task folder exists is never rewritten", () => {
  const root = makeRepo();
  assert.equal(dispatch(root, validEnvelope(root)).code, 0);
  const r = dispatch(root, validEnvelope(root));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ORV-1-a/);
});

test("AC 2: a fact with a missing or blank checked_by is named", () => {
  const root = makeRepo();
  const blank = validEnvelope(root, { facts: [{ claim: "Claim one", checked_by: "  " }] });
  const r = dispatch(root, blank);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /facts\[0\].*Claim one/);
  const missing = validEnvelope(root, { facts: [{ claim: "Claim two" }] });
  const m = dispatch(root, missing);
  assert.equal(m.code, 2);
  assert.match(m.stderr, /facts\[0\].*Claim two/);
});

test("AC 3: a prose checked_by lists the allowed forms", () => {
  const root = makeRepo();
  const r = dispatch(
    root,
    validEnvelope(root, { facts: [{ claim: "C", checked_by: "I saw it" }] }),
  );
  assert.equal(r.code, 2);
  assert.match(r.stderr, /allowed/);
  for (const form of ["pnpm", "path", "https://", "ORV-<n> comment <id>"]) {
    assert.ok(r.stderr.includes(form), form);
  }
});

test("checked_by accepts a command, a path:line, a URL and a Jira reference", () => {
  const root = makeRepo();
  const checks = ["git log -1", "docs/spec.md:1", "https://example.com/x", "ORV-81 comment 10056"];
  const facts = checks.map((checked_by, i) => ({ claim: `c${i}`, checked_by }));
  const r = dispatch(root, validEnvelope(root, { facts }));
  assert.equal(r.code, 0, r.stderr);
  const missing = dispatch(
    root,
    validEnvelope(root, {
      task_id: "ORV-1-b",
      facts: [{ claim: "c", checked_by: "docs/nope.md" }],
    }),
  );
  assert.equal(missing.code, 2);
});

test("AC 4: qa without webapp-testing names the role and the skill", () => {
  const root = makeRepo();
  const qa = validEnvelope(root, { role: "qa", write_set: [], skills: ["quality-gate"] });
  const r = dispatch(root, qa);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /qa/);
  assert.match(r.stderr, /webapp-testing/);
  const ok = dispatch(
    root,
    validEnvelope(root, {
      role: "qa",
      write_set: [],
      skills: ["quality-gate", "webapp-testing"],
    }),
  );
  assert.equal(ok.code, 0, ok.stderr);
});

test("AC 5: a schema failure gives the JSON path of each error", () => {
  const root = makeRepo();
  const r = dispatch(root, validEnvelope(root, { objective: "", issue: "bad" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /\/objective/);
  assert.match(r.stderr, /\/issue/);
});

test("AC 6: done_when prose is rejected with the entry and the allowed forms", () => {
  const root = makeRepo();
  const r = dispatch(root, validEnvelope(root, { done_when: ["tests pass"] }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /tests pass/);
  assert.match(r.stderr, /pnpm/);
  const ok = dispatch(
    root,
    validEnvelope(root, { task_id: "ORV-1-b", done_when: ["docs/spec.md:1"] }),
  );
  assert.equal(ok.code, 0, ok.stderr);
});

test("AC 8: the envelope role and the subagent type must match", () => {
  const root = makeRepo();
  const qa = validEnvelope(root, {
    role: "qa",
    write_set: [],
    skills: ["quality-gate", "webapp-testing"],
  });
  const r = dispatch(root, qa, { subagent_type: "builder" });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /differ/);
});

test("AC 9: no envelope runs only for Explore", () => {
  const root = makeRepo();
  const explore = runNode(guard, {
    ...agentInput(root, null),
    tool_input: { subagent_type: "Explore", prompt: "find x", description: "d" },
  });
  assert.equal(explore.code, 0, explore.stderr);
  assert.equal(existsSync(join(root, ".orivilo", "runs")), false);
  const recorded = runNode(guard, agentInput(root, null));
  assert.equal(recorded.code, 2);
  assert.match(recorded.stderr, /Explore/);
  const prose = runNode(
    guard,
    agentInput(root, null, { subagent_type: "builder", prompt: "please build it" }),
  );
  assert.equal(prose.code, 2);
});

test("AC 10: write_set entries that are too broad are blocked", () => {
  const root = makeRepo();
  for (const entry of [
    "packages/",
    "apps/**",
    "**",
    "/etc/passwd",
    "../x/y.txt",
    "packages/foo*/x",
  ]) {
    const r = dispatch(root, validEnvelope(root, { write_set: [entry] }));
    assert.equal(r.code, 2, entry);
    assert.ok(r.stderr.includes(entry), entry);
  }
  for (const entry of ["package.json", ".claude/hooks/**", "scripts/ovl/*.mjs"]) {
    const r = dispatch(
      root,
      validEnvelope(root, { task_id: `ORV-1-${entry.length}`, write_set: [entry] }),
    );
    assert.equal(r.code, 0, `${entry}: ${r.stderr}`);
  }
});

test("write_set is empty for reviewer, qa and release and not empty for the others", () => {
  const root = makeRepo();
  const reviewer = dispatch(
    root,
    validEnvelope(root, { role: "reviewer", skills: [], write_set: ["scripts/ovl/**"] }),
  );
  assert.equal(reviewer.code, 2);
  assert.match(reviewer.stderr, /reviewer/);
  const builder = dispatch(root, validEnvelope(root, { task_id: "ORV-1-b", write_set: [] }));
  assert.equal(builder.code, 2);
});

test("report_contract must be one the role may use", () => {
  const root = makeRepo();
  const r = dispatch(root, validEnvelope(root, { report_contract: "qa.v1" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /report_contract/);
});

test("AC 69 and 70: the recorded background call with a model is blocked for both", () => {
  const root = makeRepo();
  const recorded = { ...fixture("PreToolUse-Agent-background-model"), cwd: root };
  const env = validEnvelope(root, { role: "builder" });
  recorded.tool_input = {
    ...recorded.tool_input,
    subagent_type: "builder",
    prompt: JSON.stringify(env),
  };
  const r = runNode(guard, recorded);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /run_in_background/);
  assert.match(r.stderr, /model/);
});

test("AC 71: isolation and a foreign cwd are blocked; a foreign worktree too", () => {
  const root = makeRepo();
  const iso = dispatch(root, validEnvelope(root), { isolation: "worktree" });
  assert.equal(iso.code, 2);
  assert.match(iso.stderr, /isolation/);
  const cwd = dispatch(root, validEnvelope(root, { task_id: "ORV-1-b" }), {
    cwd: "/somewhere/else",
  });
  assert.equal(cwd.code, 2);
  assert.match(cwd.stderr, /cwd/);
  const same = dispatch(root, validEnvelope(root, { task_id: "ORV-1-c" }), { cwd: root });
  assert.equal(same.code, 0, same.stderr);
  const foreign = dispatch(
    root,
    validEnvelope(root, { task_id: "ORV-1-d", worktree: "/somewhere/else" }),
  );
  assert.equal(foreign.code, 2);
  assert.match(foreign.stderr, /worktree/);
});

test("AC 11: two rounds used blocks a third builder envelope", () => {
  const root = makeRepo();
  seedEscalated(root);
  const r = dispatch(root, validEnvelope(root, { task_id: "ORV-1-r3", rework_of: "ORV-1-r2" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /Two rework rounds used\. Escalate to the owner\./);
});

test("AC 12: rounds count per issue, not per rework_of chain", () => {
  const root = makeRepo();
  seedEscalated(root);
  const r = dispatch(root, validEnvelope(root, { task_id: "ORV-1-d", rework_of: "ORV-1-r1" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /Escalate to the owner/);
});

test("AC 13: after a request_changes or a failed gate a builder must name rework_of", () => {
  const root = makeRepo();
  seedVerdict(root, "ORV-1", "ORV-1-rev", "request_changes", "2026-10-23T10:00:00.000Z");
  seedBoundBuilder(root, "ORV-1", "ORV-1-first", "2026-10-23T09:00:00.000Z");
  const none = dispatch(root, validEnvelope(root, { task_id: "ORV-1-r1" }));
  assert.equal(none.code, 2);
  assert.match(none.stderr, /rework_of/);
  const unbound = dispatch(
    root,
    validEnvelope(root, { task_id: "ORV-1-r1", rework_of: "ORV-1-nope" }),
  );
  assert.equal(unbound.code, 2);
  assert.match(unbound.stderr, /ORV-1-nope/);
  const ok = dispatch(root, validEnvelope(root, { task_id: "ORV-1-r1", rework_of: "ORV-1-first" }));
  assert.equal(ok.code, 0, ok.stderr);

  const gateRoot = makeRepo("feature/ORV-2-test");
  seedGate(gateRoot, "ORV-2", "g1", {
    ok: false,
    sha: "a".repeat(40),
    dirty: false,
    steps_source: "gate",
    recorded_at: "2026-10-23T10:00:00.000Z",
  });
  const failed = dispatch(
    gateRoot,
    validEnvelope(gateRoot, { task_id: "ORV-2-r1", issue: "ORV-2" }),
  );
  assert.equal(failed.code, 2);
  assert.match(failed.stderr, /rework_of/);

  const stubRoot = makeRepo("feature/ORV-2-test");
  seedGate(stubRoot, "ORV-2", "g1", {
    ok: false,
    sha: "a".repeat(40),
    dirty: false,
    steps_source: "stub",
    recorded_at: "2026-10-23T10:00:00.000Z",
  });
  const stub = dispatch(stubRoot, validEnvelope(stubRoot, { task_id: "ORV-2-r1", issue: "ORV-2" }));
  assert.equal(stub.code, 0, `a stub run is never a verdict: ${stub.stderr}`);
});

test("AC 14: each owner-grant record adds one round after round 2", () => {
  const root = makeRepo();
  seedEscalated(root);
  seedGrant(root, "ORV-1", 1);
  const granted = dispatch(
    root,
    validEnvelope(root, { task_id: "ORV-1-r3", rework_of: "ORV-1-r2" }),
  );
  assert.equal(granted.code, 0, granted.stderr);
  seedBoundBuilder(root, "ORV-1", "ORV-1-r3", "2026-10-23T10:30:00.000Z");
  seedVerdict(root, "ORV-1", "ORV-1-rev3", "request_changes", "2026-10-23T10:40:00.000Z");
  const again = dispatch(root, validEnvelope(root, { task_id: "ORV-1-r4", rework_of: "ORV-1-r3" }));
  assert.equal(again.code, 2);
  assert.match(again.stderr, /Escalate to the owner/);
});

test("an envelope never bound is not a round", () => {
  const root = makeRepo();
  seedVerdict(root, "ORV-1", "ORV-1-rev", "request_changes", "2026-10-23T10:00:00.000Z");
  seedBoundBuilder(root, "ORV-1", "ORV-1-first", "2026-10-23T09:00:00.000Z");
  seedBoundBuilder(root, "ORV-1", "ORV-1-r1", "2026-10-23T10:05:00.000Z");
  seedTask(root, "ORV-1", "ORV-1-denied", {
    envelope: validEnvelope(root, { task_id: "ORV-1-denied" }),
  });
  const r = dispatch(root, validEnvelope(root, { task_id: "ORV-1-r2", rework_of: "ORV-1-r1" }));
  assert.equal(r.code, 0, r.stderr);
});

test("AC 47: malformed or empty stdin exits 2", () => {
  for (const raw of ["", "{not json", "null", "[]", '"x"']) {
    const r = runNode(guard, raw);
    assert.equal(r.code, 2, raw);
    assert.match(r.stderr, /envelope-guard/);
  }
});

test("AC 48: a recorded call whose cwd is not a git checkout fails closed", () => {
  const r = runNode(guard, fixture("PreToolUse-Agent"));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /envelope-guard/);
});

test("AC 48: a missing tool_input fails closed", () => {
  const root = makeRepo();
  const r = runNode(guard, { ...agentInput(root, null), tool_input: undefined });
  assert.equal(r.code, 2);
});

test("settings.json registers envelope-guard on PreToolUse Agent with || exit 2, and node missing blocks", () => {
  const entry = registeredCommands().find((c) => c.command.includes("envelope-guard"));
  assert.equal(entry.event, "PreToolUse");
  assert.equal(entry.matcher, "Agent");
  assert.match(entry.command, /\|\| exit 2$/);
  const root = makeRepo();
  const env = { CLAUDE_PROJECT_DIR: repoRoot };
  const withNode = runCommand(entry.command, agentInput(root, validEnvelope(root)), env);
  assert.equal(withNode.code, 0, withNode.stderr);
  const noNode = runCommand(
    entry.command,
    agentInput(root, validEnvelope(root, { task_id: "ORV-1-z" })),
    {
      ...env,
      PATH: join(root, "empty"),
    },
  );
  assert.equal(noNode.code, 2);
});

test("the recorded general-purpose Agent sample, through its settings command, exits 2", () => {
  const entry = registeredCommands().find((c) => c.command.includes("envelope-guard"));
  const r = runCommand(entry.command, fixture("PreToolUse-Agent"), {
    CLAUDE_PROJECT_DIR: repoRoot,
  });
  assert.equal(r.code, 2);
});

test("I-1: write_set spellings that dodge the two-folder rule are blocked", () => {
  const root = makeRepo();
  const bypasses = [
    "./packages/**",
    "packages/./**",
    "packages/{a,..}/**",
    "{packages,apps}/x/**",
    "packages/a/../../**",
    "packages//**",
    "@(packages)/x/**",
    "!(packages)/x/**",
    "+(packages)/x/**",
    "[p]ackages/x/**",
    "./packages/design-system/src/x.ts",
  ];
  for (const entry of bypasses) {
    const r = dispatch(root, validEnvelope(root, { task_id: "ORV-1-w", write_set: [entry] }));
    assert.equal(r.code, 2, entry);
    assert.match(r.stderr, /write_set/, entry);
  }
  const ok = dispatch(
    root,
    validEnvelope(root, { task_id: "ORV-1-w2", write_set: ["scripts/ovl/*.mjs"] }),
  );
  assert.equal(ok.code, 0, ok.stderr);
});

test("I-4 and S-5: Explore cannot carry model, isolation or a background flag", () => {
  const root = makeRepo();
  for (const extra of [
    { model: "opus" },
    { isolation: "worktree" },
    { run_in_background: true },
    { run_in_background: "true" },
    { run_in_background: 1 },
  ]) {
    const r = runNode(guard, {
      ...agentInput(root, null),
      tool_input: { subagent_type: "Explore", prompt: "find x", description: "d", ...extra },
    });
    assert.equal(r.code, 2, JSON.stringify(extra));
  }
  const bg = dispatch(root, validEnvelope(root, { task_id: "ORV-1-bg" }), {
    run_in_background: "true",
  });
  assert.equal(bg.code, 2);
  assert.match(bg.stderr, /run_in_background/);
});

test("I-6: the envelope issue must equal the issue key in the worktree branch", () => {
  const root = makeRepo();
  for (const role of ["builder", "reviewer", "qa", "designer"]) {
    const write = role === "builder" || role === "designer" ? undefined : [];
    const skills = {
      builder: ["quality-gate"],
      reviewer: [],
      qa: ["quality-gate", "webapp-testing"],
      designer: ["frontend-design", "webapp-testing"],
    }[role];
    const base = { task_id: `ORV-1000-${role}`, issue: "ORV-1000", role, skills };
    const r = dispatch(root, validEnvelope(root, write ? { ...base, write_set: write } : base));
    assert.equal(r.code, 2, role);
    assert.match(r.stderr, /branch/, role);
  }
});

test("I-6: a branch with no issue key fails closed", () => {
  const root = makeRepo("main");
  const r = dispatch(root, validEnvelope(root));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /branch/);
});

test("I-2: the guard and owner-grant agree: escalated, then a later approve, still blocks the builder", () => {
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
  const blocked = dispatch(
    root,
    validEnvelope(root, { task_id: "ORV-1-r3", rework_of: "ORV-1-r2" }),
  );
  assert.equal(blocked.code, 2);
  assert.match(blocked.stderr, /Escalate to the owner/);
  seedGrant(root, "ORV-1", 1);
  const granted = dispatch(
    root,
    validEnvelope(root, { task_id: "ORV-1-r3", rework_of: "ORV-1-r2" }),
  );
  assert.equal(granted.code, 0, granted.stderr);
});

test("I-6: a branch without a type folder, or with a nested one, names no issue", () => {
  for (const branch of ["ORV-1-x", "feature/x/ORV-1-y"]) {
    const root = makeRepo(branch);
    const r = dispatch(root, validEnvelope(root));
    assert.equal(r.code, 2, branch);
    assert.match(r.stderr, /names no issue key/, branch);
  }
});

test("AC 80: approve results alone are no verdict, so a builder needs no rework_of", () => {
  const root = makeRepo();
  seedBoundBuilder(root, "ORV-1", "ORV-1-first", "2026-10-23T09:00:00.000Z");
  seedVerdict(root, "ORV-1", "ORV-1-rev", "approve", "2026-10-23T10:00:00.000Z");
  seedVerdict(root, "ORV-1", "ORV-1-qa", "approve", "2026-10-23T10:10:00.000Z", "qa.v1");
  const r = dispatch(root, validEnvelope(root, { task_id: "ORV-1-next" }));
  assert.equal(r.code, 0, r.stderr);
});

test("S-6: with the last round unreviewed the guard asks for a verdict, not for the owner, and owner-grant refuses", () => {
  const root = makeRepo();
  seedVerdict(root, "ORV-1", "ORV-1-rev", "request_changes", "2026-10-23T10:00:00.000Z");
  seedBoundBuilder(root, "ORV-1", "ORV-1-r1", "2026-10-23T10:05:00.000Z");
  seedBoundBuilder(root, "ORV-1", "ORV-1-r2", "2026-10-23T10:15:00.000Z");
  const r = dispatch(root, validEnvelope(root, { task_id: "ORV-1-r3", rework_of: "ORV-1-r2" }));
  assert.equal(r.code, 2);
  assert.match(
    r.stderr,
    /Get a verdict on the last builder round first \(qa, reviewer or the gate\)/,
  );
  assert.doesNotMatch(r.stderr, /Escalate to the owner/);
  const grantForm = {
    ...fixture("PostToolUse-AskUserQuestion-from-transcript"),
    cwd: root,
  };
  const q = "ORV-1 used two rework rounds. Grant another round?";
  const options = [{ label: "Grant round ORV-1" }, { label: "Decline" }];
  grantForm.tool_input = { questions: [{ question: q, options }] };
  grantForm.tool_response = {
    questions: [{ question: q, options }],
    answers: { [q]: "Grant round ORV-1" },
  };
  assert.equal(runNode(hook("owner-grant.mjs"), grantForm).code, 2);
  assert.equal(existsSync(join(root, ".orivilo/runs/ORV-1/owner-grant-1.json")), false);
});
