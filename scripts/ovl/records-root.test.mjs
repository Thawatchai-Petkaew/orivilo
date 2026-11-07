// ORV-89: the run records live in the main checkout's .orivilo/, shared by every worktree of the repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { handle, recordsRoot } from "./hook.mjs";
import { worktreesOf } from "./records.mjs";
import {
  agentInput,
  fixture,
  heartbeatLines,
  hook,
  makeRepo,
  postAgentFailureInput,
  postBashInput,
  registeredCommands,
  repoRoot,
  runCommand,
  runNode,
  seedBoundBuilder,
  seedEscalated,
  seedTask,
  seedVerdict,
  startInput,
  stopInput,
  twoCheckouts,
  validEnvelope,
} from "./hook-test-kit.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

const runScript = (script, cwd, ...args) => {
  const r = spawnSync(process.execPath, [join(here, script), ...args], { cwd, encoding: "utf8" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
};

test("recordsRoot is the main checkout from the main checkout and from a second worktree", () => {
  const { main, wt } = twoCheckouts();
  assert.equal(recordsRoot(main), main);
  assert.equal(recordsRoot(wt), main);
  mkdirSync(join(wt, "docs"), { recursive: true });
  assert.equal(recordsRoot(join(wt, "docs")), main);
});

test("ORV-146: worktreesOf lists every worktree of the repo with its branch, from any of them", () => {
  const { main, wt } = twoCheckouts();
  const expected = [
    { path: main, branch: "feature/ORV-1-test" },
    { path: wt, branch: "feature/ORV-2-second" },
  ];
  assert.deepEqual(worktreesOf(main), expected);
  assert.deepEqual(worktreesOf(wt), expected);
  git(wt, "checkout", "-q", "--detach");
  assert.equal(worktreesOf(main).find((w) => w.path === wt).branch, "");
});

test("ORV-146: worktreesOf leaves out a worktree whose folder is gone", () => {
  const { main, wt } = twoCheckouts();
  rmSync(wt, { recursive: true });
  assert.deepEqual(worktreesOf(main), [{ path: main, branch: "feature/ORV-1-test" }]);
});

test("ORV-146: worktreesOf leaves out the bare repo that worktrees hang from", () => {
  const { main } = twoCheckouts();
  const bare = join(realpathSync(mkdtempSync(join(tmpdir(), "ovl-bare-"))), "repo.git");
  git(main, "clone", "-q", "--bare", main, bare);
  const wt = join(dirname(bare), "wt");
  git(bare, "worktree", "add", "-q", wt, "feature/ORV-1-test");
  assert.deepEqual(worktreesOf(wt), [{ path: realpathSync(wt), branch: "feature/ORV-1-test" }]);
});

test("a cwd that no longer exists fails closed with a clear message, not a raw ENOENT", () => {
  const { main, wt } = twoCheckouts();
  git(main, "worktree", "remove", "--force", wt);
  const r = handle("probe-hook", JSON.stringify({ cwd: wt }), () => []);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /no longer exists/);
  assert.doesNotMatch(r.stderr, /ENOENT/);
  assert.throws(() => recordsRoot(wt), /no longer exists/);
});

test("envelope-guard run from a worktree saves the envelope and heartbeat in the main checkout", () => {
  const { main, wt } = twoCheckouts();
  const envelope = validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" });
  const r = runNode(hook("envelope-guard.mjs"), agentInput(wt, envelope));
  assert.equal(r.code, 0, r.stderr);
  assert.ok(existsSync(join(main, ".orivilo/runs/ORV-2/ORV-2-a/envelope.json")));
  assert.equal(existsSync(join(wt, ".orivilo")), false);
  assert.equal(heartbeatLines(main).length, 1);
});

test("records written from a worktree survive git worktree remove", () => {
  const { main, wt } = twoCheckouts();
  const envelope = validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" });
  assert.equal(runNode(hook("envelope-guard.mjs"), agentInput(wt, envelope)).code, 0);
  const start = runNode(hook("result-recorder.mjs"), startInput(wt, "agent-1", "builder"));
  assert.equal(start.code, 0, start.stderr);
  git(main, "worktree", "remove", "--force", wt);
  const dir = join(main, ".orivilo/runs/ORV-2/ORV-2-a");
  assert.equal(JSON.parse(readFileSync(join(dir, "agent.json"), "utf8")).agent_id, "agent-1");
  assert.ok(existsSync(join(dir, "envelope.json")));
});

test("close-envelope run from a worktree closes the envelope in the main checkout", () => {
  const { main, wt } = twoCheckouts();
  seedTask(main, "ORV-1", "ORV-1-a", { envelope: validEnvelope(main) });
  const r = runScript("close-envelope.mjs", wt, "ORV-1-a");
  assert.equal(r.code, 0, r.stderr);
  const closed = JSON.parse(
    readFileSync(join(main, ".orivilo/runs/ORV-1/ORV-1-a/closed.json"), "utf8"),
  );
  assert.equal(closed.reason, "denied");
});

test("doctor check run from a worktree reads the heartbeat of the main checkout", () => {
  const { wt } = twoCheckouts();
  mkdirSync(join(wt, ".claude"), { recursive: true });
  const settings = {
    hooks: {
      PreToolUse: [
        {
          matcher: "Agent",
          hooks: [
            {
              type: "command",
              command: `node "$CLAUDE_PROJECT_DIR/.claude/hooks/envelope-guard.mjs" || exit 2`,
            },
          ],
        },
      ],
    },
  };
  writeFileSync(join(wt, ".claude", "settings.json"), JSON.stringify(settings));
  const plan = JSON.parse(runScript("doctor.mjs", wt, "plan").stdout);
  const probe = { ...plan.guards[0].probe, cwd: wt };
  assert.equal(runNode(hook("envelope-guard.mjs"), probe).code, 2);
  assert.equal(existsSync(join(wt, ".orivilo")), false);
  const check = runScript("doctor.mjs", wt, "check", plan.since);
  assert.equal(check.code, 0, check.stderr);
});

test("metrics collect run from a worktree reads and writes under the main checkout", () => {
  const { main, wt } = twoCheckouts();
  seedTask(main, "ORV-1", "ORV-1-a", { envelope: validEnvelope(main) });
  const projects = mkdtempSync(join(tmpdir(), "ovl-proj-"));
  const r = runScript("metrics.mjs", wt, "collect", "ORV-1", "--projects", projects);
  assert.equal(r.code, 0, r.stderr);
  assert.ok(existsSync(join(main, ".orivilo/metrics/ORV-1.json")));
  assert.equal(existsSync(join(wt, ".orivilo")), false);
});

// ---- R89-4: each store redirection is decided by the main checkout, run from a second worktree ----

test("a second builder of one issue is blocked by an open builder recorded in the main checkout", () => {
  const { main, wt } = twoCheckouts();
  seedTask(main, "ORV-2", "ORV-2-first", {
    envelope: validEnvelope(wt, { task_id: "ORV-2-first", issue: "ORV-2" }),
  });
  const envelope = validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" });
  const r = runNode(hook("envelope-guard.mjs"), agentInput(wt, envelope));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ORV-2-first is still open/);
});

test("a builder without rework_of is blocked by a request_changes recorded in the main checkout", () => {
  const { main, wt } = twoCheckouts();
  seedVerdict(main, "ORV-2", "ORV-2-rev", "request_changes", "2026-10-23T10:00:00.000Z");
  const envelope = validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" });
  const r = runNode(hook("envelope-guard.mjs"), agentInput(wt, envelope));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /must name rework_of/);
});

test("the rework round limit counts the rounds recorded in the main checkout", () => {
  const { main, wt } = twoCheckouts();
  seedEscalated(main, "ORV-2");
  seedBoundBuilder(main, "ORV-2", "ORV-2-r0", "2026-10-23T10:01:00.000Z");
  const envelope = validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2", rework_of: "ORV-2-r1" });
  const r = runNode(hook("envelope-guard.mjs"), agentInput(wt, envelope));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /Escalate to the owner/);
});

test("a grant clicked in a form asked from a worktree is written in the main checkout", () => {
  const { main, wt } = twoCheckouts();
  seedEscalated(main, "ORV-2");
  const base = fixture("PostToolUse-AskUserQuestion-from-transcript");
  const question = "ORV-2 used two rework rounds. Grant another round?";
  const shaped = [
    {
      ...base.tool_input.questions[0],
      question,
      options: ["Grant round ORV-2", "Decline"].map((label) => ({ label, description: label })),
    },
  ];
  const input = {
    ...base,
    cwd: wt,
    tool_input: { questions: shaped },
    tool_response: { questions: shaped, answers: { [question]: "Grant round ORV-2" } },
  };
  const r = runNode(hook("owner-grant.mjs"), input);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(
    readdirSync(join(main, ".orivilo/runs/ORV-2")).filter((n) => /grant/.test(n)),
    ["owner-grant-1.json"],
  );
  assert.equal(existsSync(join(wt, ".orivilo")), false);
});

test("a gate run in a worktree writes its gate record under the main checkout", () => {
  const { main, wt } = twoCheckouts();
  mkdirSync(join(wt, ".quality-gate"), { recursive: true });
  const now = new Date().toISOString();
  writeFileSync(
    join(wt, ".quality-gate", "report.json"),
    JSON.stringify({
      schemaVersion: 1,
      ok: true,
      stepsSource: "gate",
      startedAt: now,
      finishedAt: now,
      git: { branch: "feature/ORV-2-second", sha: git(wt, "rev-parse", "HEAD"), dirty: false },
      steps: [],
    }),
  );
  const r = runNode(hook("result-recorder.mjs"), postBashInput(wt, "pnpm quality-gate"));
  assert.equal(r.code, 0, r.stderr);
  assert.equal(readdirSync(join(main, ".orivilo/runs/ORV-2/gates")).length, 1);
  assert.equal(existsSync(join(wt, ".orivilo")), false);
});

test("a failed Agent call from a worktree closes the envelope bound in the main checkout", () => {
  const { main, wt } = twoCheckouts();
  seedBoundBuilder(main, "ORV-2", "ORV-2-a", "2026-10-23T10:00:00.000Z", true);
  const prompt = JSON.stringify(validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" }));
  const r = runNode(hook("result-recorder.mjs"), postAgentFailureInput(wt, prompt));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ORV-2-a closed as no_report/);
  const closed = join(main, ".orivilo/runs/ORV-2/ORV-2-a/closed.json");
  assert.equal(JSON.parse(readFileSync(closed, "utf8")).reason, "no_report");
});

test("recordsRoot refuses a repo whose git dir is not a .git folder inside a checkout", () => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), "ovl-layout-")));
  const work = join(parent, "work");
  mkdirSync(work);
  git(work, "init", "-q", "--separate-git-dir", join(parent, "gitdata"));
  assert.throws(() => recordsRoot(work), /not the \.git folder/);
  const bare = join(parent, "bare.git");
  git(parent, "init", "-q", "--bare", bare);
  assert.throws(() => recordsRoot(bare), /not the \.git folder/);
});

// ---- R89-6: the store must be inside the main checkout --------------------------------------

test("recordsRoot refuses a .orivilo that is a link to a folder outside the checkout", () => {
  const { main, wt } = twoCheckouts();
  const outside = realpathSync(mkdtempSync(join(tmpdir(), "ovl-outside-")));
  symlinkSync(outside, join(main, ".orivilo"));
  assert.throws(() => recordsRoot(wt), /outside/);
  const envelope = validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" });
  const r = runNode(hook("envelope-guard.mjs"), agentInput(wt, envelope));
  assert.equal(r.code, 2);
  assert.deepEqual(readdirSync(outside), []);
});

test("recordsRoot accepts a .orivilo that is a link to a folder inside the checkout", () => {
  const { main, wt } = twoCheckouts();
  mkdirSync(join(main, "state"));
  symlinkSync(join(main, "state"), join(main, ".orivilo"));
  assert.equal(recordsRoot(wt), main);
});

// ---- R89-2: records left in another worktree's own .orivilo/ ---------------------------------

const settingsWith = (dir) => {
  mkdirSync(join(dir, ".claude"), { recursive: true });
  writeFileSync(
    join(dir, ".claude", "settings.json"),
    JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: "Agent",
            hooks: [
              {
                type: "command",
                command: `node "$CLAUDE_PROJECT_DIR/.claude/hooks/envelope-guard.mjs" || exit 2`,
              },
            ],
          },
        ],
      },
    }),
  );
};

test("doctor plan stops and names each worktree that still holds records of its own", () => {
  const { main, wt } = twoCheckouts();
  settingsWith(main);
  settingsWith(wt);
  assert.equal(runScript("doctor.mjs", main, "plan").code, 0);
  seedVerdict(wt, "ORV-2", "ORV-2-rev", "request_changes", "2026-10-23T10:00:00.000Z");
  for (const cwd of [main, wt]) {
    const r = runScript("doctor.mjs", cwd, "plan");
    assert.equal(r.code, 2, cwd);
    assert.ok(r.stderr.includes(join(wt, ".orivilo", "runs")), r.stderr);
    assert.match(r.stderr, /doctor\.mjs migrate/);
  }
});

test("doctor plan ignores a worktree whose .orivilo/runs holds no file", () => {
  const { main, wt } = twoCheckouts();
  settingsWith(main);
  mkdirSync(join(wt, ".orivilo", "runs", "ORV-2", "ORV-2-a"), { recursive: true });
  assert.equal(runScript("doctor.mjs", main, "plan").code, 0);
});

test("doctor migrate moves a worktree's records into the main checkout and the rules see them", () => {
  const { main, wt } = twoCheckouts();
  settingsWith(main);
  seedVerdict(wt, "ORV-2", "ORV-2-rev", "request_changes", "2026-10-23T10:00:00.000Z");
  const migrated = runScript("doctor.mjs", wt, "migrate");
  assert.equal(migrated.code, 0, migrated.stderr);
  assert.ok(existsSync(join(main, ".orivilo/runs/ORV-2/ORV-2-rev/result.json")));
  assert.ok(existsSync(join(main, ".orivilo/runs/ORV-2/ORV-2-rev/envelope.json")));
  assert.equal(existsSync(join(wt, ".orivilo", "runs", "ORV-2")), false);
  assert.equal(runScript("doctor.mjs", main, "plan").code, 0);
  const envelope = validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" });
  const blocked = runNode(hook("envelope-guard.mjs"), agentInput(wt, envelope));
  assert.equal(blocked.code, 2);
  assert.match(blocked.stderr, /must name rework_of/);
});

test("doctor migrate leaves a whole task folder in the worktree when main already has that task", () => {
  const { main, wt } = twoCheckouts();
  settingsWith(main);
  seedTask(main, "ORV-2", "ORV-2-a", {
    envelope: validEnvelope(main, { task_id: "ORV-2-a", issue: "ORV-2" }),
    agent: { agent_id: "a-main", agent_type: "builder", started_at: "2026-10-23T10:00:00.000Z" },
  });
  seedTask(wt, "ORV-2", "ORV-2-a", {
    envelope: { from: "worktree" },
    closed: { reason: "no_report", closed_at: "2026-10-23T10:01:00.000Z" },
  });
  seedVerdict(wt, "ORV-2", "ORV-2-rev", "approve", "2026-10-23T10:02:00.000Z");
  const r = runScript("doctor.mjs", main, "migrate");
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ORV-2-a/);
  const kept = JSON.parse(readFileSync(join(main, ".orivilo/runs/ORV-2/ORV-2-a/envelope.json")));
  assert.equal(kept.task_id, "ORV-2-a");
  assert.equal(existsSync(join(main, ".orivilo/runs/ORV-2/ORV-2-a/closed.json")), false);
  assert.ok(existsSync(join(wt, ".orivilo/runs/ORV-2/ORV-2-a/closed.json")));
  assert.ok(existsSync(join(main, ".orivilo/runs/ORV-2/ORV-2-rev/result.json")));
  assert.equal(existsSync(join(wt, ".orivilo/runs/ORV-2/ORV-2-rev")), false);
  assert.equal(runScript("doctor.mjs", main, "plan").code, 2);
  // The main task stays open, so a second builder is still refused.
  const second = validEnvelope(wt, { task_id: "ORV-2-b", issue: "ORV-2" });
  assert.equal(runNode(hook("envelope-guard.mjs"), agentInput(wt, second)).code, 2);
});

test("doctor migrate appends the worktree heartbeat so a migrated bound envelope can be closed", () => {
  const { main, wt } = twoCheckouts();
  settingsWith(main);
  seedBoundBuilder(wt, "ORV-2", "ORV-2-a", "2026-10-23T10:00:00.000Z", true);
  const line = (event) =>
    JSON.stringify({
      hook: "result-recorder",
      event,
      at: "2026-10-23T10:05:00.000Z",
      tool: null,
      agent_id: "a-ORV-2-a",
      decision: "allow",
    });
  mkdirSync(join(wt, ".orivilo"), { recursive: true });
  writeFileSync(join(wt, ".orivilo/heartbeat.jsonl"), `${line("SubagentStop")}\n`);
  mkdirSync(join(main, ".orivilo"), { recursive: true });
  writeFileSync(join(main, ".orivilo/heartbeat.jsonl"), `${line("SubagentStart")}\n`);
  const before = runScript("close-envelope.mjs", main, "ORV-2-a");
  assert.equal(before.code, 2);
  const migrated = runScript("doctor.mjs", wt, "migrate");
  assert.equal(migrated.code, 0, migrated.stderr);
  assert.deepEqual(
    heartbeatLines(main).map((b) => b.event),
    ["SubagentStart", "SubagentStop"],
  );
  assert.equal(existsSync(join(wt, ".orivilo/heartbeat.jsonl")), false);
  const closed = runScript("close-envelope.mjs", main, "ORV-2-a");
  assert.equal(closed.code, 0, closed.stderr);
});

test("doctor migrate refuses links in stray runs before it moves anything", () => {
  const { main, wt } = twoCheckouts();
  settingsWith(main);
  seedVerdict(wt, "ORV-2", "ORV-2-rev", "approve", "2026-10-23T10:00:00.000Z");
  const outside = realpathSync(mkdtempSync(join(tmpdir(), "ovl-link-")));
  writeFileSync(join(outside, "secret.txt"), "x");
  symlinkSync(outside, join(wt, ".orivilo/runs/ORV-2/zz-link"));
  symlinkSync(join(outside, "secret.txt"), join(wt, ".orivilo/runs/ORV-2/ORV-2-rev/note.txt"));
  const r = runScript("doctor.mjs", main, "migrate");
  assert.equal(r.code, 2);
  assert.match(r.stderr, /zz-link/);
  assert.match(r.stderr, /note\.txt/);
  assert.equal(existsSync(join(main, ".orivilo/runs")), false);
  assert.ok(existsSync(join(wt, ".orivilo/runs/ORV-2/ORV-2-rev/result.json")));
});

test("doctor plan names worktree-guard as not probed, with its reason", () => {
  const { main } = twoCheckouts();
  mkdirSync(join(main, ".claude"), { recursive: true });
  writeFileSync(
    join(main, ".claude", "settings.json"),
    JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: "Bash",
            hooks: [
              {
                type: "command",
                command: `node "$CLAUDE_PROJECT_DIR/.claude/hooks/worktree-guard.mjs" || exit 2`,
              },
            ],
          },
        ],
      },
    }),
  );
  const r = runScript("doctor.mjs", main, "plan");
  assert.equal(r.code, 0, r.stderr);
  const entry = JSON.parse(r.stdout).guards.find((g) => g.name === "worktree-guard");
  assert.equal(entry.probe, null);
  assert.match(entry.reason, /^not probed: .*subagent/);
});

// ---- R89-3: the session's own worktree -------------------------------------------------------

const guardCommand = registeredCommands().find((c) => c.command.includes("worktree-guard"));
const subagentBash = (cwd, command) => ({
  ...fixture("PreToolUse-Bash-subagent"),
  cwd,
  tool_input: { command },
});
const guard = (input, projectDir = repoRoot) => {
  assert.ok(guardCommand, "worktree-guard is registered");
  // The registered command finds the script under the project dir, so a project other than this
  // repo runs the same script directly.
  return projectDir === repoRoot
    ? runCommand(guardCommand.command, input, { CLAUDE_PROJECT_DIR: projectDir })
    : runNode(hook("worktree-guard.mjs"), input, { CLAUDE_PROJECT_DIR: projectDir });
};

test("worktree-guard is registered on PreToolUse Bash", () => {
  assert.ok(guardCommand);
  assert.equal(guardCommand.event, "PreToolUse");
  assert.equal(guardCommand.matcher, "Bash");
});

const asMainSession = (input) => {
  const copy = { ...input };
  delete copy.agent_id;
  delete copy.agent_type;
  return copy;
};

test("worktree-guard blocks every form of a subagent removing a worktree", () => {
  const { main, wt } = twoCheckouts();
  for (const command of [
    `git worktree remove ${wt}`,
    `git worktree remove --force "${wt}"`,
    `git -C ${main} worktree remove -f '${wt}'`,
    `cd ${main} && git worktree remove ${wt}`,
    `git worktree remove .`,
    `git worktree remove $WT`,
    `echo done; git worktree remove "$(pwd)"`,
    `git -C "$PWD" worktree remove .`,
    `/usr/bin/git worktree remove ${wt}`,
    `echo ${wt} | xargs git worktree remove`,
    `echo ${wt} | xargs -I{} git worktree remove {}`,
    `sh -c 'git worktree remove ${wt}'`,
    `bash -c "git worktree remove ${wt}"`,
    `(git worktree remove ${wt})`,
    `git worktree remove ${wt.slice(0, 6)}"${wt.slice(6)}"`,
    `g"i"t worktree remove ${wt}`,
    `git -c alias.x="worktree remove" x ${wt}`,
    `git worktree prune`,
    `GIT worktree REMOVE ${wt}`,
    `git 'worktree' 'remove' ${wt}`,
    `git work\\tree remove ${wt}`,
  ]) {
    const r = guard(subagentBash(wt, command));
    assert.equal(r.code, 2, command);
    assert.match(r.stderr, /worktree-guard blocked/, command);
    assert.match(r.stderr, /orchestrator/, command);
  }
});

test("worktree-guard blocks removing the checkout that holds the hooks", () => {
  const { wt } = twoCheckouts();
  const r = guard(subagentBash(wt, `git worktree remove "${repoRoot}"`));
  assert.equal(r.code, 2);
});

test("worktree-guard lets a subagent run other git commands and the main session remove any worktree", () => {
  const { main, wt } = twoCheckouts();
  assert.equal(guard(subagentBash(wt, "git worktree list")).code, 0);
  assert.equal(guard(subagentBash(wt, "git status")).code, 0);
  const removeOther = asMainSession(subagentBash(main, `git worktree remove ${wt}`));
  assert.equal(guard(removeOther).code, 0);
  const removeOwn = asMainSession(subagentBash(wt, `git worktree remove ${wt}`));
  assert.equal(guard(removeOwn).code, 0);
});

test("worktree-guard never locks Bash out, whatever the working directory is", () => {
  const { main, wt } = twoCheckouts();
  const outside = realpathSync(mkdtempSync(join(tmpdir(), "ovl-plain-")));
  git(main, "worktree", "remove", "--force", wt);
  for (const cwd of [outside, wt]) {
    const call = subagentBash(cwd, "ls");
    assert.equal(guard(call).code, 0, `subagent in ${cwd}`);
    assert.equal(guard(asMainSession(call)).code, 0, `main session in ${cwd}`);
    // A removal from there is still refused for a subagent, without needing a checkout.
    const removal = subagentBash(cwd, `git worktree remove ${wt}`);
    assert.equal(guard(removal).code, 2, `removal in ${cwd}`);
    assert.equal(guard(asMainSession(removal)).code, 0, `main removal in ${cwd}`);
  }
  assert.equal(existsSync(join(outside, ".orivilo")), false);
});

test("worktree-guard records a heartbeat when it can find the store", () => {
  const { main, wt } = twoCheckouts();
  assert.equal(guard(subagentBash(wt, "ls"), main).code, 0);
  assert.equal(guard(subagentBash(wt, `git worktree remove ${wt}`), main).code, 2);
  const beats = heartbeatLines(main).filter((b) => b.hook === "worktree-guard");
  assert.deepEqual(
    beats.map((b) => b.decision),
    ["allow", "block"],
  );
});

test("worktree-guard writes no heartbeat into a repo that is not this project's", () => {
  const project = makeRepo();
  const other = makeRepo();
  for (const [command, code] of [
    ["ls", 0],
    [`git worktree remove ${other}`, 2],
  ]) {
    assert.equal(guard(subagentBash(other, command), project).code, code, command);
    assert.equal(guard(asMainSession(subagentBash(other, command)), project).code, 0, command);
  }
  assert.equal(existsSync(join(other, ".orivilo")), false);
  assert.equal(existsSync(join(project, ".orivilo")), false);
});

test("worktree-guard fails closed on input that is not a Bash tool call", () => {
  const r = runCommand(
    guardCommand.command,
    { tool_name: "Read" },
    { CLAUDE_PROJECT_DIR: repoRoot },
  );
  assert.equal(r.code, 2);
});

test("SubagentStop fails closed, recording nothing, when the session's own worktree was removed", () => {
  const { main, wt } = twoCheckouts();
  const envelope = validEnvelope(wt, { task_id: "ORV-2-a", issue: "ORV-2" });
  assert.equal(runNode(hook("envelope-guard.mjs"), agentInput(wt, envelope)).code, 0);
  git(main, "worktree", "remove", "--force", wt);
  const stop = registeredCommands().find((c) => c.event === "SubagentStop");
  const input = stopInput(main, "agent-1", "builder", "x", { stop_hook_active: true });
  const r = runCommand(stop.command, input, { CLAUDE_PROJECT_DIR: wt });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /No such file|not found/);
  assert.equal(existsSync(join(main, ".orivilo/runs/ORV-2/ORV-2-a/result.json")), false);
});
