// ORV-138 rows 24, 25, 50 and 51: worktree-guard rule switch-1 (a main-session branch switch while
// an envelope is bound to that checkout, or its checkout is unknown), read by shell-1. Inputs come
// from hook stdin recorded in Claude Code 2.1.282 (docs/specs/ORV-93/samples.md); a test never
// feeds an invented shape.
//
// Branch switch forms covered (docs/specs/ORV-138/spec.md "Branch switch forms"): git switch
// <branch>, git switch -c <branch>, git checkout <branch>, git checkout -b <branch>,
// git -C <path> switch <branch>, gh pr checkout <n>; the probed forms (cd into the bound checkout,
// a group, `&`, `if`, `git --no-pager`, `env`, `command`, a variable prefix, `||` with `cd`); and
// the text shapes around them: every segment separator (; && || | newline), quotes, backslashes,
// upper case, git options -c and -C (also a quoted -C path with a space), and a checkout reached
// through a link. "Branch forms to keep" are row 50 and "Unknown checkout forms" row 51.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fixture, heartbeatLines, makeRepo, seedTask, validEnvelope } from "./hook-test-kit.mjs";
import { judge } from "./worktree-guard.mjs";

const git = (cwd, ...args) =>
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], {
    cwd,
    stdio: "ignore",
  });

/** A repo with one commit and a worktree `.claude/worktrees/w`; both paths are real paths. */
function world() {
  const main = makeRepo();
  git(main, "add", "-A");
  git(main, "commit", "-q", "-m", "init");
  mkdirSync(join(main, ".claude", "worktrees"), { recursive: true });
  const wt = join(main, ".claude", "worktrees", "w");
  git(main, "worktree", "add", "-q", "-b", "feature/ORV-1-w", wt);
  return { main, wt: realpathSync(wt) };
}

/** Binds a builder envelope for `worktree`: an agent.json and neither a result nor a closed record. */
function bind(main, worktree, taskId = "ORV-1-a", extra = {}) {
  seedTask(main, "ORV-1", taskId, {
    envelope: validEnvelope(worktree, { task_id: taskId }),
    agent: {
      agent_id: `a-${taskId}`,
      agent_type: "builder",
      started_at: "2026-10-24T09:00:00.000Z",
    },
    ...extra,
  });
}

function bash(cwd, command, agentId) {
  const base = fixture(agentId ? "PreToolUse-Bash-subagent" : "PreToolUse-Bash-main");
  const input = { ...base, cwd, tool_input: { ...base.tool_input, command } };
  if (agentId) input.agent_id = agentId;
  else delete input.agent_id;
  return input;
}

/** Runs the check in-process with CLAUDE_PROJECT_DIR set to `main`. */
function call(main, input) {
  const before = process.env.CLAUDE_PROJECT_DIR;
  process.env.CLAUDE_PROJECT_DIR = main;
  try {
    return judge(JSON.stringify(input));
  } finally {
    if (before === undefined) delete process.env.CLAUDE_PROJECT_DIR;
    else process.env.CLAUDE_PROJECT_DIR = before;
  }
}

const blocked = (r, ...patterns) => {
  assert.equal(r.code, 2, r.stderr);
  assert.match(r.stderr, /^worktree-guard blocked:/);
  for (const p of patterns) assert.match(r.stderr, p);
};
const allowed = (r) => assert.deepEqual(r, { code: 0, stderr: "" });

const FORMS = (wt) => [
  "git switch feature/x",
  "git switch -c feature/x",
  "git checkout feature/x",
  "git checkout -b feature/x",
  `git -C ${wt} switch feature/x`,
  "gh pr checkout 5",
];

test("ORV-138 row 24: each switch form is blocked in a checkout with a bound envelope and names its task id", () => {
  const { main, wt } = world();
  bind(main, wt, "ORV-1-bound");
  for (const command of FORMS(wt)) {
    blocked(call(main, bash(wt, command)), /ORV-1-bound/);
  }
  // A -C path reaches the bound checkout from another one.
  blocked(call(main, bash(main, `git -C ${wt} switch feature/x`)), /ORV-1-bound/);
});

test("ORV-138 row 24: the stderr names every bound task id of the checkout", () => {
  const { main, wt } = world();
  bind(main, wt, "ORV-1-one");
  bind(main, wt, "ORV-1-two");
  blocked(call(main, bash(wt, "git switch x")), /ORV-1-one/, /ORV-1-two/);
});

test("ORV-138 row 24: with no bound envelope every switch form is allowed", () => {
  const { main, wt } = world();
  for (const command of FORMS(wt)) allowed(call(main, bash(wt, command)));
});

test("ORV-138 row 24: an envelope with a result, a closed record, or no agent.json does not bind", () => {
  const { main, wt } = world();
  const report = {
    contract: "implementer.v1",
    recorded_at: "2026-10-24T10:00:00.000Z",
    report: {},
  };
  bind(main, wt, "ORV-1-done", { result: report });
  bind(main, wt, "ORV-1-closed", {
    closed: { reason: "no_report", closed_at: "2026-10-24T10:00:00Z" },
  });
  seedTask(main, "ORV-1", "ORV-1-unbound", {
    envelope: validEnvelope(wt, { task_id: "ORV-1-unbound" }),
  });
  for (const command of FORMS(wt)) allowed(call(main, bash(wt, command)));
});

test("ORV-138 row 24: an envelope bound to another checkout does not block, and -C picks the checkout", () => {
  const { main, wt } = world();
  bind(main, main, "ORV-1-main");
  allowed(call(main, bash(wt, "git switch x")));
  allowed(call(main, bash(wt, `git -C ${wt} switch x`)));
  blocked(call(main, bash(wt, `git -C ${main} switch x`)), /ORV-1-main/);
  blocked(call(main, bash(main, "git switch x")), /ORV-1-main/);
  // A bound envelope whose worktree is gone is no checkout a call can run in.
  bind(main, join(main, "gone"), "ORV-1-gone");
  allowed(call(main, bash(wt, "git switch x")));
});

test("ORV-138 row 24: a subagent's call is not judged by switch-1", () => {
  const { main, wt } = world();
  bind(main, wt);
  for (const command of FORMS(wt)) allowed(call(main, bash(wt, command, "asub1")));
});

test("ORV-138 row 24: a switch form is found in every segment, whatever the quotes, case or separator", () => {
  const { main, wt } = world();
  bind(main, wt);
  for (const command of [
    "ls; git switch x",
    "ls && git switch x",
    "false || git switch x",
    "ls | git switch x",
    "ls\ngit switch x",
    'git "switch" x',
    "git 'checkout' x",
    "git swi\\tch x",
    "GIT SWITCH x",
    "git -c core.editor=true switch x",
    `git -C ${wt} -c core.editor=true checkout x`,
    `git -c core.editor=true -C ${wt} checkout x`,
    "GH PR CHECKOUT 5",
    "echo hi; gh pr checkout 5",
  ]) {
    blocked(call(main, bash(wt, command)), /ORV-1-a/);
  }
});

test("ORV-138 row 24: a -C path with a space and a checkout reached through a link are found", () => {
  const { main, wt } = world();
  const spaced = join(realpathSync(mkdtempSync(join(tmpdir(), "ovl-sp-"))), "My Work");
  git(main, "worktree", "add", "-q", "-b", "feature/ORV-1-sp", spaced);
  bind(main, spaced, "ORV-1-space");
  blocked(call(main, bash(wt, `git -C "${spaced}" switch x`)), /ORV-1-space/);
  allowed(call(main, bash(spaced, `git -C ${wt} switch x`)));
  // A relative -C path is resolved against the call's cwd. Its space is quoted: shell-1 splits an
  // unquoted space into two words, as the shell does (the greedy -C read it replaces joined them).
  blocked(call(main, bash(wt, `git -C "${relative(wt, spaced)}" switch x`)), /ORV-1-space/);
  allowed(call(main, bash(main, "git -C .claude/worktrees/w switch x")));
  const link = join(realpathSync(mkdtempSync(join(tmpdir(), "ovl-ln-"))), "link");
  symlinkSync(spaced, link);
  blocked(call(main, bash(link, "git switch x")), /ORV-1-space/);
  blocked(call(main, bash(wt, `git -C ${link} switch x`)), /ORV-1-space/);
  // The envelope may name the checkout through a link too.
  bind(main, link, "ORV-1-link");
  blocked(call(main, bash(wt, `git -C "${spaced}" switch x`)), /ORV-1-link/);
  rmSync(link);
});

test("ORV-138 row 24: a blocked switch leaves a block heartbeat", () => {
  const { main, wt } = world();
  bind(main, wt);
  blocked(call(main, bash(wt, "git switch x")));
  assert.deepEqual(
    heartbeatLines(main)
      .filter((b) => b.hook === "worktree-guard")
      .map((b) => b.decision),
    ["block"],
  );
});

test("ORV-138 row 25: other git commands stay allowed while an envelope is bound", () => {
  const { main, wt } = world();
  bind(main, wt);
  for (const command of [
    `git worktree add ${join(main, "other")}`,
    "git status",
    "git branch -a",
    "git log",
    "git log --oneline switch",
    "git -C /nowhere status",
    'git commit -m "fix: switch the form"',
    'git commit -m "git switch x"',
    "git push -u origin HEAD",
    "echo switch checkout",
    "gh pr view 5",
    "gh repo checkout 5",
    "gh pr create --title checkout",
  ]) {
    allowed(call(main, bash(wt, command)));
  }
});

test("ORV-138 row 25: a switch form is blocked when the records or the checkout cannot be read, and other calls keep their verdict", () => {
  const { main, wt } = world();
  const outside = realpathSync(mkdtempSync(join(tmpdir(), "ovl-plain-")));
  const gone = join(main, "gone");
  // The checkout cannot be read: the call's cwd is outside a repo, is gone, or -C names a non-repo.
  for (const cwd of [outside, gone]) {
    blocked(call(main, bash(cwd, "git switch x")), /cannot be read/);
    allowed(call(main, bash(cwd, "git status")));
  }
  blocked(call(main, bash(wt, `git -C ${outside} switch x`)), /cannot be read/);
  allowed(call(main, bash(wt, `git -C ${outside} status`)));
  // The records cannot be read: an envelope.json that is not JSON.
  const dir = join(main, ".orivilo", "runs", "ORV-1", "ORV-1-bad");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "envelope.json"), "{ not json");
  blocked(call(main, bash(wt, "git switch x")), /cannot be read/);
  blocked(call(main, bash(wt, "gh pr checkout 5")), /cannot be read/);
  allowed(call(main, bash(wt, "git status")));
  // A subagent is still not judged by switch-1 there.
  allowed(call(main, bash(wt, "git switch x", "asub1")));
});

/** `world()` and a second, unbound worktree `.claude/worktrees/u`. */
function worldWithOther() {
  const { main, wt } = world();
  const u = join(main, ".claude", "worktrees", "u");
  git(main, "worktree", "add", "-q", "-b", "feature/ORV-1-u", u);
  return { main, wt, u: realpathSync(u) };
}

test("ORV-138 row 24: the probed switch forms are blocked, each with an envelope bound to the checkout it reaches", () => {
  const { main, wt, u } = worldWithOther();
  bind(main, wt, "ORV-1-bound");
  // cd into the bound checkout, from a cwd in an unbound worktree (RV-4, sec-F2).
  blocked(call(main, bash(u, `cd ${wt} && git switch x`)), /ORV-1-bound/);
  for (const command of [
    // RV-7, sec-F2: a group, `&`, a reserved word.
    "(git switch x)",
    "git status & git switch x",
    "if true; then git switch x; fi",
    // RV-7, sec-F2: a global option with no value.
    "git --no-pager checkout x",
    // sec-F2: prefixes before git.
    "env git switch x",
    "command git switch x",
    "GIT_TRACE=0 git switch x",
    // shell-1 (e): the cd may be skipped, so the start folder counts too.
    `true || cd ${u} && git switch x`,
    `false && cd ${u}; git switch x`,
  ]) {
    blocked(call(main, bash(wt, command)), /ORV-1-bound/);
  }
});

test("ORV-138 row 24: a switch form inside a substitution is found and one inside a quoted word is not", () => {
  const { main, wt } = world();
  bind(main, wt, "ORV-1-bound");
  blocked(call(main, bash(wt, "echo $(git switch x)")), /ORV-1-bound/);
  blocked(call(main, bash(wt, "echo `git checkout x`")), /ORV-1-bound/);
  allowed(call(main, bash(wt, "echo 'git switch x'")));
  allowed(call(main, bash(wt, 'git commit -m "x; git switch y"')));
});

test("ORV-138 row 50: the branch forms to keep are allowed while an envelope is bound to the main checkout", () => {
  const { main, wt, u } = worldWithOther();
  bind(main, main, "ORV-1-main");
  // The three forms of "Branch forms to keep", from a cwd in the main checkout.
  allowed(call(main, bash(main, `cd ${u} && git switch x`)));
  allowed(call(main, bash(main, `git -C ${u} switch x`)));
  allowed(call(main, bash(main, `git -C ${u} add checkout`)));
  // A relative -C path is resolved against the cwd.
  allowed(call(main, bash(main, "git -C .claude/worktrees/u switch x")));
  // switch-1 (b): each -C is applied in order, against the folder before it.
  allowed(call(main, bash(u, `git -C ${main} -C .claude/worktrees/w switch x`)));
  blocked(call(main, bash(main, `git -C ${wt} -C ${main} switch x`)), /ORV-1-main/);
  // `-C ""` changes nothing.
  allowed(call(main, bash(u, 'git -C "" switch x')));
  blocked(call(main, bash(main, 'git -C "" switch x')), /ORV-1-main/);
  allowed(call(main, bash(main, `git -C ${u} -C "" switch x`)));
  // The same cwd and forms with no bound envelope stay allowed.
  const free = worldWithOther();
  allowed(call(free.main, bash(free.main, "git switch x")));
});

test("ORV-138 row 50: git's global options before the subcommand do not hide the subcommand", () => {
  const { main, wt } = world();
  bind(main, wt, "ORV-1-bound");
  // `-C`, `-c` and `--git-dir`/`--work-tree` without `=` take the next word as their value.
  allowed(call(main, bash(wt, `git -C ${wt} add checkout`)));
  allowed(call(main, bash(wt, "git -c core.editor=true add switch")));
  allowed(call(main, bash(wt, "git add switch")));
  blocked(call(main, bash(wt, "git -c core.editor=true -c user.name=x switch x")), /ORV-1-bound/);
});

test("ORV-138 row 51: each unknown checkout form is blocked while any envelope is bound and says so", () => {
  const { main, u } = worldWithOther();
  bind(main, main, "ORV-1-main");
  for (const command of [
    "cd - && git switch x",
    'cd "$W" && git switch x',
    'git -C "$W" switch x',
    `git --git-dir=${u}/.git switch x`,
    `git --work-tree ${u} checkout x`,
    `git --git-dir ${u}/.git switch x`,
    `git --work-tree=${u} switch x`,
    `GIT_DIR=${u}/.git git switch x`,
    `GIT_WORK_TREE=${u} git switch x`,
    `env -C ${u} git switch x`,
    `env GIT_DIR=${u}/.git git switch x`,
    `env -C ${u} gh pr checkout 5`,
    "cd && git switch x",
    "popd && git switch x",
  ]) {
    const result = call(main, bash(u, command));
    blocked(result, /checkout is unknown/, /ORV-1-main/);
    // The unknown checkout is the rule's own verdict, not a read failure.
    assert.doesNotMatch(result.stderr, /cannot be read/, command);
  }
  // A known switch in the same call is still judged on its own.
  allowed(call(main, bash(u, "git switch x")));
  // A subagent's call is not judged.
  allowed(call(main, bash(u, "cd - && git switch x", "asub1")));
});

test("ORV-138 row 51: with no bound envelope each unknown checkout form is allowed", () => {
  const { main, u } = worldWithOther();
  for (const command of [
    "cd - && git switch x",
    'cd "$W" && git switch x',
    'git -C "$W" switch x',
    `git --git-dir=${u}/.git switch x`,
    `git --work-tree ${u} checkout x`,
    `GIT_DIR=${u}/.git git switch x`,
    `env -C ${u} git switch x`,
  ]) {
    allowed(call(main, bash(u, command)));
  }
  // An envelope that is closed, finished or not bound does not count as bound.
  seedTask(main, "ORV-1", "ORV-1-unbound", {
    envelope: validEnvelope(main, { task_id: "ORV-1-unbound" }),
  });
  allowed(call(main, bash(u, "cd - && git switch x")));
});
