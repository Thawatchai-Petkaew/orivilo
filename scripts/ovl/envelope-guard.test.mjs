import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readIssue, reworkState } from "./records.mjs";
import {
  agentInput,
  fixture,
  heartbeatLines,
  hook,
  makeRepo,
  outsideWorktree,
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
  twoCheckouts,
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
    const fresh = makeRepo();
    const r = dispatch(fresh, validEnvelope(fresh, { write_set: [entry] }));
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
    closed: { reason: "denied", closed_at: "2026-10-23T10:06:00.000Z" },
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
  for (const role of ["builder", "reviewer", "qa", "designer", "security"]) {
    const write = role === "builder" || role === "designer" ? undefined : [];
    const skills = {
      builder: ["quality-gate"],
      reviewer: [],
      qa: ["quality-gate", "webapp-testing"],
      designer: ["frontend-design", "webapp-testing"],
      security: ["quality-gate"],
    }[role];
    const base = { task_id: `ORV-1000-${role}`, issue: "ORV-1000", role, skills };
    const r = dispatch(root, validEnvelope(root, write ? { ...base, write_set: write } : base));
    assert.equal(r.code, 2, role);
    assert.match(r.stderr, /branch/, role);
  }
});

const SECURITY = { role: "security", skills: ["quality-gate"], write_set: [] };
const ADR = "docs/adr/0015-standards-and-required-controls.md";

test("ORV-108 row 4: an architect envelope with no skills and an ADR write_set is saved, on a branch keyed to its issue", () => {
  const root = makeRepo();
  const r = dispatch(
    root,
    validEnvelope(root, { role: "architect", skills: [], write_set: [ADR] }),
  );
  assert.equal(r.code, 0, r.stderr);
  assert.equal(
    existsSync(join(root, ".orivilo", "runs", "ORV-1", "ORV-1-a", "envelope.json")),
    true,
  );
});

test("ORV-108 row 5: architect and research need a non-empty write_set", () => {
  const root = makeRepo();
  for (const role of ["architect", "research"]) {
    const r = dispatch(root, validEnvelope(root, { role, skills: [], write_set: [] }));
    assert.equal(r.code, 2, role);
    assert.match(r.stderr, new RegExp(`write_set must not be empty for role ${role}`));
  }
});

test("ORV-108 row 6: a security envelope without quality-gate is blocked", () => {
  const root = makeRepo();
  const r = dispatch(root, validEnvelope(root, { ...SECURITY, skills: [] }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /role security needs the skill "quality-gate" in skills/);
  assert.equal(dispatch(root, validEnvelope(root, SECURITY)).code, 0);
});

test("ORV-108 row 7: a security envelope has an empty write_set and the branch issue", () => {
  const root = makeRepo();
  const full = dispatch(root, validEnvelope(root, { ...SECURITY, write_set: ["docs/spec.md"] }));
  assert.equal(full.code, 2);
  assert.match(full.stderr, /write_set must be empty for role security/);
  const other = dispatch(
    root,
    validEnvelope(root, { ...SECURITY, task_id: "ORV-9-sec", issue: "ORV-9" }),
  );
  assert.equal(other.code, 2);
  assert.match(other.stderr, /envelope issue ORV-9 differs from the issue ORV-1 in branch/);
});

test("ORV-108 row 8: a research envelope may glob under docs/knowledge", () => {
  const root = makeRepo();
  const r = dispatch(
    root,
    validEnvelope(root, { role: "research", skills: [], write_set: ["docs/knowledge/*/K-*.md"] }),
  );
  assert.equal(r.code, 0, r.stderr);
});

test("ORV-108 row 9: a report_contract the role may not use names the allowed one", () => {
  const root = makeRepo();
  const sec = dispatch(
    root,
    validEnvelope(root, { ...SECURITY, report_contract: "implementer.v1" }),
  );
  assert.equal(sec.code, 2);
  assert.match(
    sec.stderr,
    /report_contract "implementer\.v1" is not allowed for role security.*reviewer\.v1/,
  );
  const arch = dispatch(
    root,
    validEnvelope(root, {
      role: "architect",
      skills: [],
      write_set: [ADR],
      report_contract: "reviewer.v1",
    }),
  );
  assert.equal(arch.code, 2);
  assert.match(
    arch.stderr,
    /report_contract "reviewer\.v1" is not allowed for role architect.*implementer\.v1/,
  );
});

const FOUR_UNCHECKED_ROLES = [
  { role: "research", skills: [], write_set: ["docs/knowledge/*/K-*.md"] },
  { role: "product", skills: ["discover"], write_set: ["docs/specs/ORV-9/spec.md"] },
  { role: "architect", skills: [], write_set: [ADR] },
  { role: "ds-architect", skills: [], write_set: ["docs/specs/ORV-9/design.md"] },
];

test("ORV-138 row 22: a research, product, architect or ds-architect envelope on another issue's branch is blocked with the branch-key reason", () => {
  for (const extra of FOUR_UNCHECKED_ROLES) {
    const root = makeRepo();
    const r = dispatch(root, validEnvelope(root, { task_id: "ORV-9-x", issue: "ORV-9", ...extra }));
    assert.equal(r.code, 2, extra.role);
    assert.match(
      r.stderr,
      /envelope issue ORV-9 differs from the issue ORV-1 in branch "feature\/ORV-1-test"/,
      extra.role,
    );
    assert.equal(existsSync(join(root, ".orivilo", "runs")), false, extra.role);
  }
});

test("ORV-138 row 22: the same four envelopes on the branch of their own issue are saved", () => {
  for (const extra of FOUR_UNCHECKED_ROLES) {
    const root = makeRepo();
    const r = dispatch(root, validEnvelope(root, extra));
    assert.equal(r.code, 0, `${extra.role}: ${r.stderr}`);
  }
});

test("ORV-138 row 22: a release envelope stays out of the branch-key check", () => {
  const root = makeRepo();
  const release = {
    task_id: "ORV-9-rel",
    issue: "ORV-9",
    role: "release",
    skills: ["gate-packet"],
    write_set: [],
  };
  const r = dispatch(root, validEnvelope(root, release));
  assert.equal(r.code, 0, r.stderr);
});

test("ORV-138 row 23: a retro envelope (ds-architect, skill retro) on chore/<slice key>-retro-lessons with that key passes", () => {
  const root = makeRepo("chore/ORV-138-retro-lessons");
  const retro = {
    task_id: "ORV-138-retro",
    issue: "ORV-138",
    role: "ds-architect",
    skills: ["retro"],
    write_set: ["docs/lessons/L-0100.md"],
  };
  const r = dispatch(root, validEnvelope(root, retro));
  assert.equal(r.code, 0, r.stderr);
  const wrong = dispatch(
    root,
    validEnvelope(root, { ...retro, task_id: "ORV-9-retro", issue: "ORV-9" }),
  );
  assert.equal(wrong.code, 2);
  assert.match(wrong.stderr, /envelope issue ORV-9 differs from the issue ORV-138 in branch/);
});

/** A closed task of `role` whose recorded report requests changes. */
const seedRoleVerdict = (root, role, taskId) =>
  seedTask(root, "ORV-1", taskId, {
    envelope: validEnvelope(root, { task_id: taskId, role, write_set: [], skills: [] }),
    agent: { agent_id: `a-${taskId}`, agent_type: role, started_at: "2026-10-23T09:00:00.000Z" },
    result: {
      contract: "reviewer.v1",
      recorded_at: "2026-10-23T10:00:00.000Z",
      report: { verdict: "request_changes" },
    },
  });

test("ORV-108 rows 10 and 41: a security or designer request_changes forces rework_of on the next builder", () => {
  for (const [role, taskId] of [
    ["security", "ORV-1-sec"],
    ["designer", "ORV-1-des"],
  ]) {
    const root = makeRepo();
    seedRoleVerdict(root, role, taskId);
    const r = dispatch(root, validEnvelope(root, { task_id: "ORV-1-b" }));
    assert.equal(r.code, 2, role);
    assert.match(r.stderr, /has a verdict.*a builder envelope must name rework_of/, role);
  }
});

test("ORV-108 row 40: a designer sign-off (reviewer.v1, empty write_set) is allowed; other shapes need a write_set", () => {
  const root = makeRepo();
  const designer = {
    role: "designer",
    skills: ["frontend-design", "webapp-testing"],
    write_set: [],
  };
  const ok = dispatch(root, validEnvelope(root, { ...designer, report_contract: "reviewer.v1" }));
  assert.equal(ok.code, 0, ok.stderr);
  for (const extra of [{ report_contract: "implementer.v1" }, {}]) {
    const r = dispatch(root, validEnvelope(root, { ...designer, task_id: "ORV-1-d2", ...extra }));
    assert.equal(r.code, 2, JSON.stringify(extra));
    assert.match(r.stderr, /write_set must not be empty for role designer/);
  }
});

test("ORV-108: a designer sign-off edits no file", () => {
  const root = makeRepo();
  const r = dispatch(
    root,
    validEnvelope(root, {
      role: "designer",
      skills: ["frontend-design", "webapp-testing"],
      report_contract: "reviewer.v1",
      write_set: ["docs/specs/ORV-1/design.md"],
    }),
  );
  assert.equal(r.code, 2);
  assert.match(r.stderr, /write_set must be empty for role designer/);
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
  seedBoundBuilder(root, "ORV-1", "ORV-1-b0", "2026-10-23T09:50:00.000Z");
  seedVerdict(root, "ORV-1", "ORV-1-rev", "request_changes", "2026-10-23T10:00:00.000Z");
  seedBoundBuilder(root, "ORV-1", "ORV-1-r1", "2026-10-23T10:05:00.000Z");
  seedVerdict(root, "ORV-1", "ORV-1-revb", "request_changes", "2026-10-23T10:10:00.000Z");
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

test("ORV-146: a second builder envelope is blocked while one is open for the same issue", () => {
  const root = makeRepo();
  seedTask(root, "ORV-1", "ORV-1-other", {
    envelope: validEnvelope(root, { task_id: "ORV-1-other" }),
  });
  const r = dispatch(root, validEnvelope(root, { task_id: "ORV-1-b" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ORV-1-other/);
  assert.match(r.stderr, /close-envelope\.mjs ORV-1-other/);
});

test("ORV-146: a bound open envelope of another issue does not block the role", () => {
  const root = makeRepo();
  seedBoundBuilder(root, "ORV-9", "ORV-9-other", "2026-10-23T10:00:00.000Z", true);
  const r = dispatch(root, validEnvelope(root));
  assert.equal(r.code, 0, r.stderr);
});

test("ORV-146 SEC-4: an unbound open envelope of the same role blocks a dispatch for any issue", () => {
  const root = makeRepo();
  seedTask(root, "ORV-9", "ORV-9-other", {
    envelope: validEnvelope(root, { task_id: "ORV-9-other", issue: "ORV-9" }),
  });
  const r = dispatch(root, validEnvelope(root));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ORV-9-other of ORV-9 is open and no subagent has started on it/);
  assert.match(r.stderr, /close-envelope\.mjs ORV-9-other/);
  assert.equal(savedEnvelope(root, "ORV-1", "ORV-1-a"), false);
  const reviewer = dispatch(
    root,
    validEnvelope(root, { task_id: "ORV-1-rev", role: "reviewer", skills: [], write_set: [] }),
  );
  assert.equal(reviewer.code, 0, reviewer.stderr);
});

test("ORV-146 SEC-4: a bound open envelope of the same role and issue blocks", () => {
  const root = makeRepo();
  seedBoundBuilder(root, "ORV-1", "ORV-1-bound", "2026-10-23T10:00:00.000Z", true);
  const r = dispatch(root, validEnvelope(root, { task_id: "ORV-1-b" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ORV-1-bound is still open/);
});

test("AC 52: another role's open envelope does not block, and a closed one does not either", () => {
  const root = makeRepo();
  seedTask(root, "ORV-1", "ORV-1-rev", {
    envelope: validEnvelope(root, {
      task_id: "ORV-1-rev",
      role: "reviewer",
      write_set: [],
      skills: [],
    }),
  });
  seedTask(root, "ORV-1", "ORV-1-old", {
    envelope: validEnvelope(root, { task_id: "ORV-1-old" }),
    closed: { reason: "pre_a3", closed_at: "2026-10-23T09:00:00.000Z" },
  });
  const r = dispatch(root, validEnvelope(root));
  assert.equal(r.code, 0, r.stderr);
  const second = dispatch(root, validEnvelope(root, { task_id: "ORV-1-b" }));
  assert.equal(second.code, 2);
  assert.match(second.stderr, /ORV-1-a/);
});

test("AC 67: a bound builder that ended no_report after a verdict is a round; a denied one is not", () => {
  const root = makeRepo();
  seedBoundBuilder(root, "ORV-1", "ORV-1-b0", "2026-10-23T09:50:00.000Z");
  seedVerdict(root, "ORV-1", "ORV-1-rev", "request_changes", "2026-10-23T10:00:00.000Z");
  seedBoundBuilder(root, "ORV-1", "ORV-1-r1", "2026-10-23T10:05:00.000Z");
  seedVerdict(root, "ORV-1", "ORV-1-revb", "request_changes", "2026-10-23T10:10:00.000Z");
  seedTask(root, "ORV-1", "ORV-1-r2", {
    envelope: validEnvelope(root, { task_id: "ORV-1-r2" }),
    agent: { agent_id: "a-r2", agent_type: "builder", started_at: "2026-10-23T10:15:00.000Z" },
    closed: { reason: "no_report", closed_at: "2026-10-23T10:16:00.000Z" },
  });
  seedTask(root, "ORV-1", "ORV-1-r3", {
    envelope: validEnvelope(root, { task_id: "ORV-1-r3" }),
    closed: { reason: "denied", closed_at: "2026-10-23T10:17:00.000Z" },
  });
  const r = dispatch(root, validEnvelope(root, { task_id: "ORV-1-r4", rework_of: "ORV-1-r2" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /rework rounds used/);
});

// ORV-138 rework-1: the ORV-139 timeline (build-1, build-2, build-3 starts; qa-1 and qa-2 request_changes).
const seedOrv139 = (root) => {
  const at = (id, t) => seedBoundBuilder(root, "ORV-1", id, t);
  at("ORV-1-build-1", "2026-10-28T18:50:51.651Z");
  seedVerdict(root, "ORV-1", "ORV-1-qa-1", "request_changes", "2026-10-28T19:51:09.039Z", "qa.v1");
  at("ORV-1-build-2", "2026-10-28T19:51:32.972Z");
  at("ORV-1-build-3", "2026-10-28T20:01:52.849Z");
  seedVerdict(root, "ORV-1", "ORV-1-qa-2", "request_changes", "2026-10-28T20:31:41.852Z", "qa.v1");
};

test("ORV-138 row 19: the ORV-139 timeline has 1 round used, and the next rework builder is allowed", () => {
  const root = makeRepo();
  seedOrv139(root);
  assert.equal(reworkState(readIssue(root, "ORV-1")).rounds, 1);
  const r = dispatch(
    root,
    validEnvelope(root, { task_id: "ORV-1-build-4", rework_of: "ORV-1-build-3" }),
  );
  assert.equal(r.code, 0, r.stderr);
});

test("ORV-138 row 19: a first builder after a verdict, and a builder with no verdict since the last one, are not rounds", () => {
  const root = makeRepo();
  seedVerdict(root, "ORV-1", "ORV-1-rev", "request_changes", "2026-10-23T10:00:00.000Z");
  seedBoundBuilder(root, "ORV-1", "ORV-1-a", "2026-10-23T10:05:00.000Z");
  assert.equal(reworkState(readIssue(root, "ORV-1")).rounds, 0);
  seedBoundBuilder(root, "ORV-1", "ORV-1-b", "2026-10-23T10:10:00.000Z");
  assert.equal(reworkState(readIssue(root, "ORV-1")).rounds, 0);
});

test("ORV-138 row 20: a builder after a verdict on a builder's head counts, and the allowance still blocks the next one", () => {
  const root = makeRepo();
  seedBoundBuilder(root, "ORV-1", "ORV-1-first", "2026-10-23T09:00:00.000Z");
  seedVerdict(root, "ORV-1", "ORV-1-v1", "request_changes", "2026-10-23T10:00:00.000Z");
  seedBoundBuilder(root, "ORV-1", "ORV-1-r1", "2026-10-23T10:05:00.000Z");
  assert.equal(reworkState(readIssue(root, "ORV-1")).rounds, 1);
  seedVerdict(root, "ORV-1", "ORV-1-v2", "request_changes", "2026-10-23T10:10:00.000Z");
  seedBoundBuilder(root, "ORV-1", "ORV-1-r2", "2026-10-23T10:15:00.000Z");
  assert.equal(reworkState(readIssue(root, "ORV-1")).rounds, 2);
  seedVerdict(root, "ORV-1", "ORV-1-v3", "request_changes", "2026-10-23T10:20:00.000Z");
  const r = dispatch(root, validEnvelope(root, { task_id: "ORV-1-r3", rework_of: "ORV-1-r2" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /Two rework rounds used\. Escalate to the owner\./);
});

/** Runs the guard as a child that starts now; resolves with its exit code. */
const dispatchAsync = (input) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [guard]);
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => resolve({ code, stderr }));
    child.stdin.end(JSON.stringify(input));
  });

test("C-2: two builder envelopes dispatched at the same moment never both run", async () => {
  for (let trial = 0; trial < 8; trial++) {
    const root = makeRepo();
    const tasks = ["ORV-1-a", "ORV-1-b"];
    const runs = await Promise.all(
      tasks.map((task_id) => dispatchAsync(agentInput(root, validEnvelope(root, { task_id })))),
    );
    const why = `trial ${trial}: ${runs.map((r) => `${r.code} ${r.stderr}`).join(" | ")}`;
    const allowed = runs.filter((r) => r.code === 0).length;
    assert.ok(allowed <= 1, why);
    const dir = (t) => join(root, ".orivilo", "runs", "ORV-1", t);
    // An envelope still open is one that runs; any other that was saved is closed as denied.
    const open = tasks.filter(
      (t) => existsSync(join(dir(t), "envelope.json")) && !existsSync(join(dir(t), "closed.json")),
    );
    assert.equal(open.length, allowed, why);
    for (const t of tasks.filter((t) => existsSync(join(dir(t), "closed.json")))) {
      assert.equal(JSON.parse(readFileSync(join(dir(t), "closed.json"), "utf8")).reason, "denied");
    }
  }
});

// ---- ORV-146 point 1: any worktree of this repo whose branch names the envelope issue ----

const savedEnvelope = (main, issue, task) =>
  existsSync(join(main, ".orivilo", "runs", issue, task, "envelope.json"));

test("ORV-146: a session in the main checkout dispatches a builder into a worktree of another issue", () => {
  const { main, wt } = twoCheckouts();
  const env = validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" });
  const r = dispatch(main, env, { cwd: wt });
  assert.equal(r.code, 0, r.stderr);
  assert.equal(savedEnvelope(main, "ORV-2", "ORV-2-a"), true);
});

test("ORV-146: the issue is read from the envelope worktree's branch, not the session checkout's", () => {
  const { main, wt } = twoCheckouts("main");
  const ok = dispatch(main, validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" }));
  assert.equal(ok.code, 0, ok.stderr);
  const wrong = dispatch(main, validEnvelope(wt, { task_id: "ORV-1-a", issue: "ORV-1" }));
  assert.equal(wrong.code, 2);
  assert.match(wrong.stderr, /envelope issue ORV-1 differs from the issue ORV-2 in branch/);
});

test("ORV-146: a session in a worktree dispatches into the main checkout and into a sibling", () => {
  const { main, wt } = twoCheckouts();
  const toMain = dispatch(wt, validEnvelope(main, { task_id: "ORV-1-a" }));
  assert.equal(toMain.code, 0, toMain.stderr);
  seedTask(main, "ORV-1", "ORV-1-a", {
    agent: { agent_id: "a-ORV-1-a", agent_type: "builder", started_at: "2026-10-23T10:00:00.000Z" },
  });
  const self = dispatch(wt, validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" }));
  assert.equal(self.code, 0, self.stderr);
});

test("ORV-146: every issue role is judged by the branch of its envelope worktree", () => {
  const { main, wt } = twoCheckouts();
  const roles = {
    reviewer: { skills: [], write_set: [] },
    qa: { skills: ["quality-gate", "webapp-testing"], write_set: [] },
    security: { skills: ["quality-gate"], write_set: [] },
    designer: { skills: ["frontend-design", "webapp-testing"], write_set: ["docs/spec.md"] },
  };
  for (const [role, shape] of Object.entries(roles)) {
    const task_id = `ORV-2-${role}`;
    const base = { task_id, issue: "ORV-2", role, ...shape };
    const ok = dispatch(main, validEnvelope(wt, base));
    assert.equal(ok.code, 0, `${role}: ${ok.stderr}`);
    const bad = dispatch(
      main,
      validEnvelope(wt, { ...base, task_id: `ORV-1-${role}`, issue: "ORV-1" }),
    );
    assert.equal(bad.code, 2, role);
    assert.match(bad.stderr, /differs from the issue ORV-2 in branch/, role);
  }
});

test("ORV-146: a path that is no worktree of this repo is blocked, whatever its branch", () => {
  const { main } = twoCheckouts();
  const stranger = makeRepo("feature/ORV-3-stranger");
  const r = dispatch(main, validEnvelope(stranger, { task_id: "ORV-3-a", issue: "ORV-3" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /worktree .* is not a git worktree of this repo/);
  assert.equal(savedEnvelope(main, "ORV-3", "ORV-3-a"), false);
  const gone = dispatch(
    main,
    validEnvelope(main, { task_id: "ORV-1-b", worktree: `${main}/nope` }),
  );
  assert.equal(gone.code, 2);
  assert.match(gone.stderr, /is not a git worktree of this repo/);
});

test("ORV-146: a worktree on a detached head or a branch with no key is blocked", () => {
  const { main, wt } = twoCheckouts();
  execFileSync("git", ["checkout", "-q", "--detach"], { cwd: wt });
  const detached = dispatch(main, validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" }));
  assert.equal(detached.code, 2);
  assert.match(detached.stderr, /names no issue key/);
  execFileSync("git", ["checkout", "-q", "-b", "scratch"], { cwd: wt });
  const keyless = dispatch(main, validEnvelope(wt, { task_id: "ORV-2-b", issue: "ORV-2" }));
  assert.equal(keyless.code, 2);
  assert.match(keyless.stderr, /branch "scratch" of worktree .* names no issue key/);
});

test("ORV-146: a worktree other than the session checkout is still refused for a role with no issue check", () => {
  const { main, wt } = twoCheckouts();
  const env = validEnvelope(wt, { role: "architect", skills: [], write_set: [ADR] });
  const r = dispatch(main, env);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /must be this checkout/);
});

test("ORV-146: the cwd of the call must still equal the envelope worktree", () => {
  const { main, wt } = twoCheckouts();
  const r = dispatch(main, validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" }), {
    cwd: main,
  });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /cwd .* must equal the envelope worktree/);
});

test("ORV-146: builders of two issues run at once; a second builder of one issue is blocked", () => {
  const { main, wt } = twoCheckouts();
  const first = dispatch(main, validEnvelope(main, { task_id: "ORV-1-a" }), { cwd: main });
  assert.equal(first.code, 0, first.stderr);
  const early = dispatch(main, validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" }), {
    cwd: wt,
  });
  assert.equal(early.code, 2, "the first builder is not bound yet");
  seedTask(main, "ORV-1", "ORV-1-a", {
    agent: { agent_id: "a-ORV-1-a", agent_type: "builder", started_at: "2026-10-23T10:00:00.000Z" },
  });
  const other = dispatch(main, validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" }), {
    cwd: wt,
  });
  assert.equal(other.code, 0, other.stderr);
  const again = dispatch(main, validEnvelope(wt, { task_id: "ORV-2-b", issue: "ORV-2" }), {
    cwd: wt,
  });
  assert.equal(again.code, 2);
  assert.match(again.stderr, /ORV-2-a is still open/);
  const reviewer = dispatch(
    main,
    validEnvelope(wt, {
      task_id: "ORV-2-rev",
      issue: "ORV-2",
      role: "reviewer",
      skills: [],
      write_set: [],
    }),
    { cwd: wt },
  );
  assert.equal(reviewer.code, 0, reviewer.stderr);
});

test("ORV-146 SEC-4: two builder envelopes of different issues dispatched at the same moment never both run", async () => {
  for (let trial = 0; trial < 4; trial++) {
    const { main, wt } = twoCheckouts();
    const calls = [
      agentInput(main, validEnvelope(main, { task_id: "ORV-1-a" })),
      agentInput(main, validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" })),
    ];
    const runs = await Promise.all(calls.map(dispatchAsync));
    const why = `trial ${trial}: ${runs.map((r) => `${r.code} ${r.stderr}`).join(" | ")}`;
    const allowed = runs.filter((r) => r.code === 0).length;
    assert.ok(allowed <= 1, why);
    const tasks = [
      ["ORV-1", "ORV-1-a"],
      ["ORV-2", "ORV-2-a"],
    ];
    const dir = ([issue, task]) => join(main, ".orivilo/runs", issue, task);
    // An envelope still open is one that runs; any other that was saved is closed as denied.
    const open = tasks.filter(
      (t) => existsSync(join(dir(t), "envelope.json")) && !existsSync(join(dir(t), "closed.json")),
    );
    assert.equal(open.length, allowed, why);
    for (const t of tasks.filter((t) => existsSync(join(dir(t), "closed.json")))) {
      assert.equal(JSON.parse(readFileSync(join(dir(t), "closed.json"), "utf8")).reason, "denied");
    }
  }
});

// ---- ORV-146 SEC-3: only the paths write-guard judges ----

test("ORV-146 SEC-3: a worktree outside .claude/worktrees is blocked for every issue role", () => {
  const { main } = twoCheckouts();
  const out = outsideWorktree(main);
  const roles = {
    builder: { skills: ["quality-gate"], write_set: ["scripts/ovl/x.mjs"] },
    reviewer: { skills: [], write_set: [] },
    qa: { skills: ["quality-gate", "webapp-testing"], write_set: [] },
    security: { skills: ["quality-gate"], write_set: [] },
    designer: { skills: ["frontend-design", "webapp-testing"], write_set: ["docs/spec.md"] },
  };
  for (const [role, shape] of Object.entries(roles)) {
    const task_id = `ORV-3-${role}`;
    const r = dispatch(main, validEnvelope(out, { task_id, issue: "ORV-3", role, ...shape }));
    assert.equal(r.code, 2, role);
    assert.match(r.stderr, /must be the main working tree or a folder under .*\.claude\/worktrees/);
    assert.equal(savedEnvelope(main, "ORV-3", task_id), false, role);
  }
});

test("ORV-146 SEC-3: a worktree nested below .claude/worktrees/<name> is blocked", () => {
  const { main } = twoCheckouts();
  const nested = join(main, ".claude", "worktrees", "a", "b");
  execFileSync("git", ["worktree", "add", "-q", "-b", "feature/ORV-3-nested", nested], {
    cwd: main,
  });
  const r = dispatch(main, validEnvelope(nested, { task_id: "ORV-3-a", issue: "ORV-3" }));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /must be the main working tree or a folder under/);
});
