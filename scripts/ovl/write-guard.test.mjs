// ORV-93: write-guard. Inputs come from hook stdin recorded in Claude Code 2.1.282
// (docs/specs/ORV-93/samples.md); a test never feeds an invented shape.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  fixture,
  heartbeatLines,
  hook,
  makeRepo,
  registeredCommands,
  runCommand,
  runNode,
  seedTask,
  validEnvelope,
} from "./hook-test-kit.mjs";
import { describeCause } from "./shell-words.mjs";
import { judge } from "./write-guard.mjs";

const SUB = "asub1";

/** A repo with one commit and a worktree `.claude/worktrees/w`. */
function world() {
  const main = makeRepo();
  const git = (...args) =>
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], {
      cwd: main,
      stdio: "ignore",
    });
  git("add", "-A");
  git("commit", "-q", "-m", "init");
  mkdirSync(join(main, ".claude", "worktrees"), { recursive: true });
  const wt = join(main, ".claude", "worktrees", "w");
  git("worktree", "add", "-q", "-b", "feature/ORV-1-w", wt);
  return { main, wt: realpathSync(wt) };
}

/** Runs the guard in-process with CLAUDE_PROJECT_DIR set to `main`. */
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

const TOOLS = {
  Write: { fixture: "PreToolUse-Write", field: "file_path" },
  Edit: { fixture: "PreToolUse-Edit", field: "file_path" },
  MultiEdit: { fixture: "PreToolUse-MultiEdit-derived", field: "file_path" },
  NotebookEdit: { fixture: "PreToolUse-NotebookEdit", field: "notebook_path" },
};

/** A tool write from the main session, or from subagent `agentId`. */
function tool(name, cwd, path, { agentId, extra = {} } = {}) {
  const spec = TOOLS[name];
  const base = fixture(spec.fixture);
  return {
    ...base,
    cwd,
    tool_input: { ...base.tool_input, [spec.field]: path, ...extra },
    ...(agentId ? { agent_id: agentId, agent_type: "builder" } : {}),
  };
}

function bash(cwd, command, agentId) {
  const base = fixture(agentId ? "PreToolUse-Bash-subagent" : "PreToolUse-Bash-main");
  return {
    ...base,
    cwd,
    tool_input: { ...base.tool_input, command },
    ...(agentId ? { agent_id: agentId } : {}),
  };
}

const blocked = (r, ...patterns) => {
  assert.equal(r.code, 2, r.stderr);
  assert.match(r.stderr, /^write-guard blocked:/);
  for (const p of patterns) assert.match(r.stderr, p);
};
const allowed = (r) => assert.deepEqual(r, { code: 0, stderr: "" });

function bindBuilder(main, taskId, agentId, writeSet, extra = {}) {
  seedTask(main, "ORV-1", taskId, {
    envelope: validEnvelope(main, { task_id: taskId, write_set: writeSet }),
    agent: { agent_id: agentId, agent_type: "builder", started_at: "2026-10-24T09:00:00.000Z" },
    ...extra,
  });
}

function bindShooter(main, role, taskId, agentId, extra = {}) {
  seedTask(main, "ORV-1", taskId, {
    envelope: validEnvelope(main, {
      task_id: taskId,
      role,
      write_set: [],
      skills:
        role === "qa" ? ["quality-gate", "webapp-testing"] : ["frontend-design", "webapp-testing"],
    }),
    agent: { agent_id: agentId, agent_type: role, started_at: "2026-10-24T09:00:00.000Z" },
    ...extra,
  });
}

// ---- rows 1 and 2: deliverables ----

test("row 1: the main session is blocked from a deliverable by each write tool", () => {
  const { main } = world();
  const cases = [
    ["Write", "packages/a.ts"],
    ["Edit", "apps/web/a.tsx"],
    ["MultiEdit", "apps/web/a.tsx"],
    ["NotebookEdit", "apps/web/n.ipynb"],
  ];
  for (const [name, path] of cases) {
    const r = call(main, tool(name, main, path));
    blocked(r, /deliverable/, new RegExp(path.replace(".", "\\.")), /dispatch a builder envelope/);
  }
  assert.ok(!existsSync(join(main, "packages", "a.ts")));
  assert.equal(heartbeatLines(main).filter((b) => b.decision === "block").length, 4);
});

test("row 2: a worktree path, a worktree cwd, another case and a link into packages/ are blocked", () => {
  const { main, wt } = world();
  mkdirSync(join(main, "docs", "real"), { recursive: true });
  symlinkSync(join(main, "packages"), join(main, "docs", "x"));
  mkdirSync(join(main, "packages"), { recursive: true });
  const inputs = [
    tool("Write", main, join(wt, "packages", "a.ts")),
    tool("Write", wt, "packages/a.ts"),
    tool("Write", main, "Packages/A.ts"),
    tool("Write", main, "docs/x/a.ts"),
  ];
  for (const input of inputs) blocked(call(main, input), /deliverable/);
});

test("row 3: a subagent, bound or not, may write a deliverable and the heartbeat names it", () => {
  const { main } = world();
  const sub = fixture("PreToolUse-Write-subagent");
  const input = {
    ...sub,
    cwd: main,
    tool_input: { ...sub.tool_input, file_path: join(main, "packages", "a.ts") },
  };
  allowed(call(main, input));
  assert.equal(heartbeatLines(main).at(-1).agent_id, sub.agent_id);
  assert.equal(heartbeatLines(main).at(-1).decision, "allow");
  allowed(call(main, tool("Edit", main, "apps/web/a.tsx", { agentId: "other" })));
});

// ---- rows 4 and 5: records ----

test("row 4: nobody writes a record by a tool, not even a builder that lists it", () => {
  const { main, wt } = world();
  bindBuilder(main, "ORV-1-b", SUB, [".orivilo/runs/ORV-1/t/qa.json"]);
  const targets = [
    ".orivilo/runs/ORV-1/t/qa.json",
    ".orivilo/heartbeat.jsonl",
    ".orivilo/owner-approvals/7.json",
    ".orivilo/metrics/ORV-1.json",
    ".quality-gate/report.json",
    join(wt, ".orivilo/runs/ORV-1/t/result.json"),
  ];
  for (const target of targets) {
    blocked(
      call(main, tool("Write", main, target)),
      /record/,
      /only hooks and the scripts in scripts\/ovl\//,
    );
    blocked(call(main, tool("Write", main, target, { agentId: SUB })), /record/);
  }
  assert.ok(!existsSync(join(main, ".quality-gate", "report.json")));
});

test("row 5: a redirect, an append and a cp into a record are blocked for the main session and a subagent", () => {
  const { main } = world();
  const commands = [
    "echo {} > .orivilo/runs/ORV-1/t/qa.json",
    "echo x >> .orivilo/heartbeat.jsonl",
    "cp r.json .quality-gate/report.json",
    "echo {} > .orivilo//runs/ORV-1/t/qa.json",
    "cp r.json ./.quality-gate/./report.json",
    "rm -rf .orivilo",
    "rm -rf .quality-gate",
  ];
  for (const command of commands) {
    blocked(call(main, bash(main, command)));
    blocked(call(main, bash(main, command, SUB)));
  }
});

// ---- rows 6 to 8: guard files ----

const GUARD_TARGETS = [
  ".claude/hooks/a.mjs",
  "scripts/ovl/a.mjs",
  ".claude/settings.json",
  ".claude/settings.local.json",
  "scripts/quality-gate.mjs",
  ".github/workflows/ci.yml",
  ".gitignore",
];

test("row 6: the main session, an unbound subagent and a bound reviewer cannot write a guard file", () => {
  const { main } = world();
  seedTask(main, "ORV-1", "ORV-1-rev", {
    envelope: validEnvelope(main, {
      task_id: "ORV-1-rev",
      role: "reviewer",
      write_set: [],
    }),
    agent: { agent_id: "arev", agent_type: "reviewer", started_at: "2026-10-24T09:00:00.000Z" },
  });
  for (const target of GUARD_TARGETS) {
    for (const agentId of [undefined, "unbound", "arev"]) {
      blocked(
        call(main, tool("Edit", main, target, { agentId })),
        /guard file/,
        /only a builder whose open envelope lists the exact path may write it/,
      );
    }
  }
});

test("row 7: a bound builder writes only the guard path its open envelope lists", () => {
  const { main } = world();
  bindBuilder(main, "ORV-1-b", SUB, ["scripts/ovl/write-guard.mjs", "scripts/ovl/*.mjs"]);
  allowed(call(main, tool("Write", main, "scripts/ovl/write-guard.mjs", { agentId: SUB })));
  blocked(
    call(main, tool("Write", main, "scripts/ovl/doctor.mjs", { agentId: SUB })),
    /guard file/,
  );
  assert.deepEqual(
    heartbeatLines(main).map((b) => b.decision),
    ["allow", "block"],
  );
});

test("row 7: the builder grant holds only in the checkout equal to the envelope worktree", () => {
  const { main, wt } = world();
  const other = join(main, ".claude", "worktrees", "other");
  execFileSync("git", ["worktree", "add", "-q", "-b", "feature/ORV-1-o", other], {
    cwd: main,
    stdio: "ignore",
  });
  seedTask(main, "ORV-1", "ORV-1-wt", {
    envelope: validEnvelope(main, {
      task_id: "ORV-1-wt",
      worktree: wt,
      write_set: ["scripts/ovl/write-guard.mjs"],
    }),
    agent: { agent_id: SUB, agent_type: "builder", started_at: "2026-10-24T09:00:00.000Z" },
  });
  const path = "scripts/ovl/write-guard.mjs";
  allowed(call(main, tool("Write", wt, path, { agentId: SUB })));
  blocked(call(main, tool("Write", main, path, { agentId: SUB })), /guard file/);
  blocked(call(main, tool("Write", realpathSync(other), path, { agentId: SUB })), /guard file/);
});

test("row 7: a glob grants nothing, and a closed envelope grants nothing", () => {
  const { main } = world();
  bindBuilder(main, "ORV-1-g", "aglob", ["scripts/ovl/*.mjs"]);
  blocked(call(main, tool("Write", main, "scripts/ovl/a.mjs", { agentId: "aglob" })));
  bindBuilder(main, "ORV-1-r", "ares", ["scripts/ovl/a.mjs"], {
    result: { contract: "implementer.v1", recorded_at: "2026-10-24T10:00:00.000Z", report: {} },
  });
  blocked(call(main, tool("Write", main, "scripts/ovl/a.mjs", { agentId: "ares" })));
  bindBuilder(main, "ORV-1-c", "aclo", ["scripts/ovl/a.mjs"], {
    closed: { reason: "abandoned", closed_at: "2026-10-24T10:00:00.000Z" },
  });
  blocked(call(main, tool("Write", main, "scripts/ovl/a.mjs", { agentId: "aclo" })));
});

test("row 8: a guard file changes only by a tool write (Write, Edit, MultiEdit or NotebookEdit), even for the builder that lists it", () => {
  const { main } = world();
  bindBuilder(main, "ORV-1-b", SUB, ["scripts/ovl/a.mjs", ".claude/settings.json", ".gitignore"]);
  const commands = [
    "sed -i s/a/b/ scripts/ovl/a.mjs",
    "tee .claude/settings.json",
    "git checkout -- scripts/ovl/a.mjs",
    "git restore .gitignore",
    "git restore --source=HEAD .claude/settings.json",
    "rm .claude/hooks/a.mjs",
    "ln scripts/ovl/a.mjs docs/a.mjs",
    "touch scripts/ovl/new.mjs",
    "node --test scripts/ovl/a.test.mjs > /tmp/out",
  ];
  for (const command of commands) {
    blocked(call(main, bash(main, command, SUB)), /guard file/);
    blocked(call(main, bash(main, command, "unbound")));
  }
  allowed(call(main, bash(main, "cat scripts/ovl/a.mjs", SUB)));
  allowed(call(main, bash(main, "node --test scripts/ovl/a.test.mjs 2>&1 | tail -5", SUB)));
});

// ---- rows 9 to 11: screenshots ----

const shots = (main, task) => join(main, ".orivilo", "runs", "ORV-1", task, "screenshots");

test("row 9: a qa copies or writes a PNG into its own screenshots folder", () => {
  const { main } = world();
  bindShooter(main, "qa", "ORV-1-qa-1", "aqa");
  const png = join(shots(main, "ORV-1-qa-1"), "button--primary-light.png");
  allowed(call(main, bash(main, `cp /tmp/s.png ${png}`, "aqa")));
  allowed(call(main, bash(main, `cp "/tmp/s s.png" "${png}"`, "aqa")));
  allowed(call(main, tool("Write", main, png, { agentId: "aqa" })));
  assert.ok(heartbeatLines(main).every((b) => b.decision === "allow"));
});

test("row 10: the PNG exception is only the writer's own png, while its envelope is open", () => {
  const { main, wt } = world();
  bindShooter(main, "qa", "ORV-1-qa-1", "aqa");
  const own = shots(main, "ORV-1-qa-1");
  const record = join(main, ".orivilo", "runs", "ORV-1", "ORV-1-qa-1", "qa.json");
  const blockedCalls = [
    bash(main, `cp /tmp/s.txt ${own}/a.txt`, "aqa"),
    bash(main, `cp ${record} ${own}/a.png`, "aqa"),
    bash(main, `cp /tmp/s.png ${own}/a.png && rm ${record}`, "aqa"),
    tool("Write", main, own + "/a.txt", { agentId: "aqa" }),
    tool("Write", main, join(main, ".orivilo/runs/ORV-1/ORV-1-qa-1/qa.json"), { agentId: "aqa" }),
    tool("Write", main, join(shots(main, "ORV-1-other"), "a.png"), { agentId: "aqa" }),
    tool("Write", main, join(wt, ".orivilo/runs/ORV-1/ORV-1-qa-1/screenshots/a.png"), {
      agentId: "aqa",
    }),
    tool("Write", main, own + "/a.png", { agentId: undefined }),
  ];
  for (const input of blockedCalls) blocked(call(main, input), /record|guard file/);
  seedTask(main, "ORV-1", "ORV-1-qa-1", {
    closed: { reason: "no_report", closed_at: "2026-10-24T10:00:00.000Z" },
  });
  blocked(call(main, tool("Write", main, own + "/button--primary-light.png", { agentId: "aqa" })));
});

test("row 11: an exception matches the writer's agent id, never its type", () => {
  const { main } = world();
  bindShooter(main, "qa", "ORV-1-qa-1", "aqa");
  bindShooter(main, "designer", "ORV-1-des-1", "ades");
  const designerPng = join(shots(main, "ORV-1-des-1"), "a.png");
  blocked(call(main, bash(main, `cp /tmp/s.png ${designerPng}`, "aqa")));
  blocked(call(main, tool("Write", main, designerPng, { agentId: "aqa" })));
  allowed(call(main, tool("Write", main, designerPng, { agentId: "ades" })));
});

// ---- rows 12 to 17: Bash in the main session ----

test("row 12: plain reads and one whole git write are allowed", () => {
  const { main, wt } = world();
  const commands = [
    "git diff -- .claude/hooks/",
    `git -C ${wt} log -- scripts/ovl/`,
    "git show HEAD:scripts/ovl/a.mjs",
    "git status",
    "ls .orivilo/runs",
    "grep -n verdict .orivilo/runs/ORV-1/t/result.json",
    `jq .report ${main}/.orivilo/runs/ORV-1/t/result.json`,
    `cat ${main}/.orivilo/runs/ORV-1/t/result.json | jq .report`,
    "git add scripts/ovl/a.mjs .claude/settings.json",
    `git -C ${wt} add packages/a.ts`,
    "git add -A",
    "git add .",
    'git commit -m "ORV-1: fix scripts/ovl/a.mjs"',
    'git commit -m "ORV-1: fix packages/a.ts\n\nsecond line"',
    "git commit -F /tmp/scratch/msg.txt",
    "git push",
    "git push -u origin feature/ORV-1-x",
  ];
  for (const command of commands) allowed(call(main, bash(main, command)));
});

test("row 13: a command that names a protected path and is not one whole plain form is blocked", () => {
  const { main } = world();
  const commands = [
    "git diff --output=x -- scripts/ovl/",
    "cat .orivilo/a > b",
    "git show HEAD:scripts/ovl/a.mjs | tee scripts/ovl/a.mjs",
    "ls .orivilo; rm -r .orivilo/runs",
    "ls .orivilo && touch .orivilo/x",
    "echo $(cat .orivilo/a)",
    "pnpm exec prettier --write scripts/ovl/a.mjs",
    "sed -n --in-place 1p scripts/ovl/a.mjs",
    'sed -n "1w packages/a.ts" scripts/ovl/a.mjs',
    "cat > packages/a.ts",
    "git add x && rm scripts/ovl/a.mjs",
    'git commit -m "x"; rm .orivilo/x',
    'git commit -m "x" > .orivilo/x',
    'git commit -m "$(cat .orivilo/a)"',
    "git commit -F .orivilo/runs/ORV-1/t/qa.json",
    "git push && touch scripts/ovl/a.mjs",
    'git commit -m "x"\nrm scripts/ovl/a.mjs',
    'git commit -m "fix packages/ x && y"',
  ];
  for (const command of commands) blocked(call(main, bash(main, command)));
});

test("row 14: whole script runs are allowed, from a checkout of this project", () => {
  const { main } = world();
  const commands = [
    "node scripts/ovl/doctor.mjs plan",
    "node scripts/ovl/doctor.mjs migrate",
    `node ${main}/scripts/ovl/metrics.mjs report ORV-1 --out batch`,
    `node "${main}/scripts/ovl/metrics.mjs" session abc --out s-1`,
    "node scripts/ovl/close-envelope.mjs ORV-1-x",
    "pnpm quality-gate",
    "pnpm run quality-gate",
    "node scripts/quality-gate.mjs",
  ];
  for (const command of commands) allowed(call(main, bash(main, command)));
});

test("row 14: a checkout path with a space is a project path when quoted", () => {
  const holder = realpathSync(mkdtempSync(join(tmpdir(), "ovl-sp-")));
  const space = join(holder, "My Work");
  mkdirSync(space);
  execFileSync("git", ["init", "-q", "-b", "feature/ORV-1-x"], { cwd: space });
  allowed(call(space, bash(space, `node "${space}/scripts/ovl/doctor.mjs" plan`)));
});

test("row 15: a script run with anything appended, or from outside, is a normal command", () => {
  const { main } = world();
  const commands = [
    "node scripts/ovl/doctor.mjs plan > .orivilo/x",
    "node scripts/ovl/doctor.mjs plan && echo > .orivilo/x",
    "node scripts/ovl/doctor.mjs plan; rm .orivilo/x",
    "pnpm quality-gate > .orivilo/x",
    "node scripts/ovl/../x.mjs",
    "node /tmp/scripts/ovl/x.mjs .orivilo",
  ];
  for (const command of commands) blocked(call(main, bash(main, command)));
});

test("row 15: an allowed script run is one line; a second line is a second command", () => {
  const { main } = world();
  const commands = [
    "node scripts/ovl/doctor.mjs plan\ncp /tmp/e.mjs scripts/ovl/write-guard.mjs",
    "node scripts/ovl/doctor.mjs plan\r\nrm -rf .orivilo",
    "node scripts/ovl/doctor.mjs plan\rrm -rf .orivilo",
    "pnpm quality-gate\nrm -rf .orivilo",
    "pnpm quality-gate\ncp /tmp/e.mjs scripts/ovl/write-guard.mjs",
  ];
  for (const command of commands) blocked(call(main, bash(main, command)));
});

test("row 13: a plain read has no process substitution", () => {
  const { main } = world();
  const commands = [
    "cat <(cp /tmp/qa.json .orivilo/runs/ORV-1/t/qa.json)",
    "cat <(touch packages/a.ts)",
    "cat .orivilo/a >(tee scripts/ovl/a.mjs)",
    "cat < .orivilo/a",
  ];
  for (const command of commands) blocked(call(main, bash(main, command)));
});

test("rows 5, 8 and 13: a doubled slash, a ./ segment or a folder without its slash still names it", () => {
  const { main } = world();
  const both = [
    "cp /tmp/e.mjs scripts//ovl/write-guard.mjs",
    "cp /tmp/e.mjs scripts/./ovl/write-guard.mjs",
    "cp /tmp/e.mjs scripts/.//./ovl/write-guard.mjs",
    "rm -rf scripts/ovl",
    "rm -rf .claude/hooks",
    "rm -rf .github/workflows",
    "rm -rf .claude//hooks/a.mjs",
    "cp -r /tmp/x .orivilo//runs",
  ];
  for (const command of both) {
    blocked(call(main, bash(main, command)));
    blocked(call(main, bash(main, command, SUB)));
  }
  for (const command of ["cp -r /tmp/x packages", "rm -rf apps", "cp /tmp/x packages//a.ts"]) {
    blocked(call(main, bash(main, command)));
  }
  allowed(call(main, bash(main, 'git commit -m "bump packages"')));
  allowed(call(main, bash(main, "cp /tmp/x packages-notes.txt", SUB)));
});

test("row 12: a pipe or a backslash inside a quoted pattern is not a pipe between reads", () => {
  const { main } = world();
  const commands = [
    'grep -n "a|b" scripts/ovl/x.mjs',
    'grep -n "a\\|b" scripts/ovl/x.mjs',
    "grep -n 'a|b' scripts/ovl/x.mjs",
    'grep -n "a|b" scripts/ovl/x.mjs | head -3',
    'grep -n "a;b" .orivilo/x',
  ];
  for (const command of commands) allowed(call(main, bash(main, command)));
  blocked(call(main, bash(main, 'grep -n "a|b" scripts/ovl/x.mjs | tee scripts/ovl/y.mjs')));
  blocked(call(main, bash(main, 'grep -n "a" scripts/ovl/x.mjs ; rm .orivilo/x')));
});

test("row 12: a null device or fd redirect is not a write, and a quoted > is not a redirect", () => {
  const { main } = world();
  const reads = [
    "ls .orivilo 2>/dev/null",
    "cat .orivilo/a 2>&1 | head -3",
    "grep -n verdict .orivilo/a &>/dev/null",
    'grep -n "=>" scripts/ovl/x.mjs',
  ];
  for (const command of reads) allowed(call(main, bash(main, command)));
  allowed(call(main, bash(main, 'grep -n "=>" scripts/ovl/write-guard.mjs', SUB)));
  allowed(call(main, bash(main, "grep -n '=>' scripts/ovl/write-guard.mjs 2>/dev/null", SUB)));
  const writes = [
    'echo "x" > scripts/ovl/a.mjs',
    'echo \\" > scripts/ovl/a.mjs \\"',
    'echo "$(echo "y" > scripts/ovl/a.mjs)"',
    "echo `echo y > scripts/ovl/a.mjs`",
    'echo "x" >> .orivilo/heartbeat.jsonl',
  ];
  for (const command of writes) blocked(call(main, bash(main, command, SUB)));
  blocked(call(main, bash(main, 'cat .orivilo/a "=>" > b')));
});

test("row 12: sed -n, tail and wc are plain reads; sed that writes is not", () => {
  const { main } = world();
  const reads = [
    "sed -n 1,5p scripts/ovl/x.mjs",
    "sed -n 7p scripts/ovl/x.mjs",
    "sed -n '3,$p' scripts/ovl/x.mjs",
    "sed -n /verdict/p .orivilo/runs/ORV-1/t/result.json",
    "tail -n 5 .orivilo/heartbeat.jsonl",
    "wc -l scripts/ovl/x.mjs",
    "cat scripts/ovl/x.mjs | sed -n 1,5p | wc -l",
  ];
  for (const command of reads) allowed(call(main, bash(main, command)));
  const writes = [
    "sed -i s/a/b/ scripts/ovl/x.mjs",
    "sed -n -i 1p scripts/ovl/x.mjs",
    "sed -n 1p -i scripts/ovl/x.mjs",
    "sed -n 1p --in-place scripts/ovl/x.mjs",
    "sed -n 1w.orivilo/x scripts/ovl/x.mjs",
    "sed -n '1w .orivilo/x' scripts/ovl/x.mjs",
    "sed -n -e 1p scripts/ovl/x.mjs",
    "sed 1p scripts/ovl/x.mjs",
    "sed -n 1p scripts/ovl/x.mjs > .orivilo/x",
  ];
  for (const command of writes) blocked(call(main, bash(main, command)));
});

test("row 8: a subagent cannot restore a guard file by checkout, switch, stash or reset", () => {
  const { main } = world();
  bindBuilder(main, "ORV-1-b", SUB, ["scripts/ovl/write-guard.mjs"]);
  const commands = [
    "git checkout HEAD scripts/ovl/write-guard.mjs",
    "git checkout HEAD~1 -- scripts/ovl/write-guard.mjs",
    "git checkout main -f .claude/hooks/a.mjs",
    "git switch -f scripts/ovl/write-guard.mjs",
    "git stash push scripts/ovl/write-guard.mjs",
    "git reset --hard HEAD scripts/ovl/write-guard.mjs",
    "git checkout HEAD .orivilo/runs/ORV-1",
  ];
  for (const command of commands) {
    blocked(call(main, bash(main, command, SUB)));
    blocked(call(main, bash(main, command, "unbound")));
  }
  allowed(call(main, bash(main, "git checkout feature/ORV-1-x", SUB)));
});

test("row 16: close-envelope --owner is blocked in any Claude Code session", () => {
  const { main } = world();
  const command = "node scripts/ovl/close-envelope.mjs ORV-1-x --owner";
  for (const agentId of [undefined, SUB]) {
    blocked(call(main, bash(main, command, agentId)), /owner's own terminal/);
  }
  assert.ok(!existsSync(join(main, ".orivilo", "runs", "ORV-1", "ORV-1-x", "closed.json")));
});

test("row 17: only the main session closes an envelope", () => {
  const { main } = world();
  blocked(
    call(main, bash(main, "node scripts/ovl/close-envelope.mjs ORV-1-x", SUB)),
    /only the main session closes an envelope/,
  );
});

// ---- rows 18 to 20: the handoff and docs ----

test("row 18: the main session writes .orivilo/handoff.md by Write or Edit, from any checkout", () => {
  const { main, wt } = world();
  for (const name of ["Write", "Edit"]) {
    allowed(call(main, tool(name, main, ".orivilo/handoff.md")));
    allowed(call(main, tool(name, wt, join(main, ".orivilo", "handoff.md"))));
  }
  assert.ok(heartbeatLines(main).every((b) => b.decision === "allow"));
});

test("row 19: only that exact file, by a tool, from the main session", () => {
  const { main, wt } = world();
  blocked(call(main, bash(main, "echo x > .orivilo/handoff.md")));
  blocked(call(main, tool("Write", main, ".orivilo/handoff.md", { agentId: SUB })));
  blocked(call(main, tool("Write", main, join(wt, ".orivilo/handoff.md"))));
  blocked(call(main, tool("Write", main, ".orivilo/handoff.md.bak")));
  blocked(call(main, tool("Write", main, ".orivilo/runs/handoff.md")));
  blocked(call(main, tool("MultiEdit", main, ".orivilo/handoff.md")));
  mkdirSync(join(main, ".orivilo", "runs", "ORV-1", "t"), { recursive: true });
  writeFileSync(join(main, ".orivilo", "runs", "ORV-1", "t", "qa.json"), "{}");
  symlinkSync(
    join(main, ".orivilo", "runs", "ORV-1", "t", "qa.json"),
    join(main, ".orivilo", "handoff.md"),
  );
  blocked(call(main, tool("Write", main, ".orivilo/handoff.md")));
});

test("row 20: docs and a scratchpad outside the repo are in no protected set", () => {
  const { main } = world();
  const scratch = realpathSync(mkdtempSync(join(tmpdir(), "ovl-scratch-")));
  for (const path of [
    "docs/specs/ORV-1/jira-issue.md",
    "docs/context/handoff.md",
    "docs/plans/master-plan.md",
    join(scratch, "a.txt"),
  ]) {
    allowed(call(main, tool("Write", main, path)));
  }
});

// ---- rows 22 to 26: failing closed, cwd, canary ----

test("row 22: malformed input, an unknown tool and a missing field fail closed", () => {
  const { main } = world();
  const process_ = (raw) => {
    const before = process.env.CLAUDE_PROJECT_DIR;
    process.env.CLAUDE_PROJECT_DIR = main;
    try {
      return judge(raw);
    } finally {
      process.env.CLAUDE_PROJECT_DIR = before;
    }
  };
  for (const raw of ["", "not json", "null", "[]", '"x"']) {
    const r = process_(raw);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^write-guard failed closed:/);
  }
  const base = fixture("PreToolUse-Write");
  const bad = [
    { ...base, cwd: main, tool_name: "Read" },
    { ...base, cwd: main, tool_input: { content: "x" } },
    tool("Edit", main, "a.txt", { extra: { file_path: undefined } }),
    { ...tool("NotebookEdit", main, "n"), tool_input: { cell_id: "c1" } },
    { ...fixture("PreToolUse-Bash-main"), cwd: main, tool_input: {} },
  ];
  for (const input of bad) {
    const r = call(main, input);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^write-guard failed closed:/);
  }
  assert.ok(heartbeatLines(main).length >= bad.length);
  assert.ok(heartbeatLines(main).every((b) => b.decision === "error"));
});

test("row 23: a record that cannot be read grants no exception, and docs needs none", () => {
  const { main } = world();
  mkdirSync(join(main, ".orivilo", "runs", "ORV-1", "t"), { recursive: true });
  writeFileSync(join(main, ".orivilo", "runs", "ORV-1", "t", "agent.json"), "{ not json");
  for (const path of ["scripts/ovl/a.mjs", ".orivilo/runs/ORV-1/t/qa.json"]) {
    const r = call(main, tool("Write", main, path, { agentId: SUB }));
    assert.equal(r.code, 2);
    assert.match(r.stderr, /failed closed/);
  }
  allowed(call(main, tool("Write", main, "docs/a.md", { agentId: SUB })));
  assert.equal(heartbeatLines(main).at(0).decision, "error");
});

test("row 24: a call whose cwd is outside any repo, in another repo or removed names nothing protected", () => {
  const { main } = world();
  const other = makeRepo();
  const outside = realpathSync(mkdtempSync(join(tmpdir(), "ovl-out-")));
  const gone = join(main, ".claude", "worktrees", "gone");
  allowed(call(main, bash(outside, "ls")));
  allowed(call(main, bash(other, "ls")));
  allowed(call(main, bash(gone, "ls")));
  allowed(call(main, tool("Write", gone, "/tmp/x/a.txt")));
  assert.ok(!existsSync(join(outside, ".orivilo")));
  assert.ok(!existsSync(join(other, ".orivilo")));
  assert.equal(heartbeatLines(main).length, 0);
  allowed(call(main, bash(main, "ls")));
  assert.equal(heartbeatLines(main).length, 1);
});

test("row 25: a relative path with a removed cwd cannot be resolved and fails closed", () => {
  const { main } = world();
  const gone = join(main, ".claude", "worktrees", "gone");
  const r = call(main, tool("Write", gone, "a.txt"));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /^write-guard failed closed:/);
  assert.equal(heartbeatLines(main).length, 0);
});

test("row 26: content and commands never reach stderr or the heartbeat", () => {
  const { main } = world();
  const results = [
    call(main, tool("Write", main, "packages/a.ts", { extra: { content: "CANARY" } })),
    call(main, tool("Edit", main, "docs/a.md", { extra: { new_string: "CANARY" } })),
    call(main, bash(main, "echo CANARY > .orivilo/x")),
    call(main, bash(main, "echo CANARY packages/")),
    call(main, bash(main, "ls CANARY")),
  ];
  assert.deepEqual(
    results.map((r) => r.code),
    [2, 0, 2, 2, 0],
  );
  for (const r of results) assert.ok(!r.stderr.includes("CANARY"));
  const text = readFileSync(join(main, ".orivilo", "heartbeat.jsonl"), "utf8");
  assert.ok(!text.includes("CANARY"));
  for (const line of heartbeatLines(main)) {
    assert.deepEqual(Object.keys(line), ["hook", "event", "at", "tool", "agent_id", "decision"]);
  }
});

// ---- row 27: registration and the real launcher ----

test("row 27: write-guard is registered on PreToolUse twice, and on no other event", () => {
  const guard = registeredCommands().filter((c) => c.command.includes("write-guard"));
  const command = 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/write-guard.mjs" || exit 2';
  assert.deepEqual(
    guard.map((c) => [c.event, c.matcher, c.command]),
    [
      ["PreToolUse", "Bash", command],
      ["PreToolUse", "Write|Edit|MultiEdit|NotebookEdit", command],
    ],
  );
});

test("row 27: the launcher, run as settings.json runs it, blocks and allows with exit codes", () => {
  const { main } = world();
  const root = join(import.meta.dirname, "..", "..");
  const command = registeredCommands().find((c) => c.command.includes("write-guard")).command;
  // cwd is the temp repo, so the real checkout's heartbeat stays untouched.
  const run = (path) =>
    runCommand(command, tool("Write", main, join(root, path)), { CLAUDE_PROJECT_DIR: root });
  assert.equal(run("packages/a.ts").code, 2);
  assert.equal(run("docs/a.md").code, 0);
  assert.equal(runNode(hook("write-guard.mjs"), "nope").code, 2);
});

// ---- ORV-138 rows 27 to 30 and 45 to 49: resolve-1 on shell-1 (ORV-96) ----

const HIDDEN = "a protected path through an expansion, a cd or the working directory";

/** The call is blocked by resolve-1 (not by a literal name), as the main session and as a subagent. */
function blockedByResolve(main, command, cwd = main) {
  blocked(call(main, bash(cwd, command)), new RegExp(`the command names ${HIDDEN} and is neither`));
  blocked(call(main, bash(cwd, command, SUB)), new RegExp(`a write form names ${HIDDEN}`));
}

/** The call is allowed, as the main session and as a subagent. */
function allowedBoth(main, command, cwd = main) {
  allowed(call(main, bash(cwd, command)));
  allowed(call(main, bash(cwd, command, SUB)));
}

const OWNER_FORM = (folder) => `cd .oriv?lo/${folder} && printf '{"by":"owner"}' > 7.json`;

test("ORV-138 row 27: the review F5 form into owner-approvals and owner-waivers is blocked for the main session and a subagent", () => {
  const { main } = world();
  for (const folder of ["owner-approvals", "owner-waivers"]) {
    blockedByResolve(main, OWNER_FORM(folder));
  }
  assert.ok(!existsSync(join(main, ".orivilo", "owner-approvals", "7.json")));
});

test("ORV-138 row 28: every form of 'Write-guard forms to catch' is blocked, as the main session and as a subagent", () => {
  const { main } = world();
  const cwdInSet = join(main, ".orivilo", "owner-approvals");
  mkdirSync(cwdInSet, { recursive: true });
  const forms = [
    OWNER_FORM("owner-approvals"),
    OWNER_FORM("owner-waivers"),
    "cp -r /tmp/x .oriv*/exports/abc",
    "printf x > .oriv[i]lo/owner-approvals/7.json",
    "printf x > .or{i,}vilo/owner-approvals/7.json",
    "D=.oriv; printf x > ${D}ilo/owner-approvals/7.json",
    'printf x > "$(printf .oriv)ilo/owner-approvals/7.json"',
    "printf x > `printf .oriv`ilo/owner-approvals/7.json",
    "cd scripts/o?l && tee a.mjs",
    "cd - && rm x",
    "cd && rm x",
  ];
  for (const form of forms) blockedByResolve(main, form);
  blockedByResolve(main, "printf x > 7.json", cwdInSet);
});

test("ORV-138 row 28: resolve-1 (d) judges the fixed part of a glob or expansion word against the cwd, a worktree and a protected folder", () => {
  const { main, wt } = world();
  // A worktree root is a checkout too; so is a path that begins the name of a protected folder.
  blockedByResolve(main, "printf x > .oriv?lo/a", wt);
  blockedByResolve(main, "tee scripts/o?l/a.mjs");
  blockedByResolve(main, "tee .claude/hoo*/a.mjs");
  blockedByResolve(main, "touch .claude/work*/w/a");
  blockedByResolve(main, "rm *.tmp");
  blockedByResolve(main, `rm ${main.slice(0, -3)}*`);
  blockedByResolve(main, "rm ${X}");
  // An empty fixed part always could, whatever the cwd; a folder inside a set (named by the cwd) does too.
  mkdirSync(join(main, "docs"), { recursive: true });
  mkdirSync(join(main, "scripts"), { recursive: true });
  blockedByResolve(main, 'printf x > "$D"/a', join(main, "docs"));
  blockedByResolve(main, "tee ovl/a*.mjs", join(main, "scripts"));
  // A word whose fixed part is a folder outside every checkout is no reason.
  allowedBoth(main, "touch /tmp/zz*/a ../../zz*/a", join(main, "docs"));
  // The main session also protects deliverables; a subagent may write them.
  blocked(call(main, bash(main, "touch packages/a*")));
  allowed(call(main, bash(main, "touch packages/a*", SUB)));
  // A quote or a backslash makes a glob character a plain one; single quotes hold a `$`.
  allowedBoth(main, "printf x > 'a?b' && touch \\*.tmp '$HOME'");
  // `{`, `}`, `[` and `]` alone are shell syntax.
  allowedBoth(main, "[ -f a ] && { rm b; }");
});

test("ORV-138 row 28: resolve-1 (b) follows cd, pushd and popd into a protected set (shell-1 (e))", () => {
  const { main } = world();
  mkdirSync(join(main, "scripts"), { recursive: true });
  mkdirSync(join(main, "docs"), { recursive: true });
  symlinkSync(join(main, ".orivilo"), join(main, "docs", "lnk"));
  mkdirSync(join(main, ".orivilo"), { recursive: true });
  // A target that resolves into a set with no protected name in the text: a name the cwd completes,
  // a folder above a set, and a link.
  blockedByResolve(main, "cd ovl && tee a.mjs", join(main, "scripts"));
  blockedByResolve(main, "cd scripts && tee ovl/a.mjs");
  blockedByResolve(main, "cd docs/lnk && printf x > a");
  blockedByResolve(main, "pushd scripts && cd ovl && tee a.mjs");
  blockedByResolve(main, "popd && rm x");
  blockedByResolve(main, "cd -P -- scripts && cd ovl && rm x");
  blockedByResolve(main, "cd ~nobody/x && rm y");
  // An expansion word as the target is a reason of its own, even where its fixed part is harmless.
  blockedByResolve(main, "cd /tmp/y* && rm z");
  // The main session also protects deliverables.
  blocked(call(main, bash(main, "cd apps && rm x")));
  blocked(call(main, bash(main, "cd packages/web && rm x")));
  allowed(call(main, bash(main, "cd apps && rm x", SUB)));
  // A cd to a folder outside every set, or back to the root, is no reason by itself.
  allowedBoth(main, "cd docs && rm x");
  allowedBoth(main, `cd /tmp && cd ${main} && rm x`);
});

test("ORV-138 row 28: resolve-1 (c) judges a relative target from the cwd of the call; the main session also protects deliverables", () => {
  const { main, wt } = world();
  for (const folder of [".orivilo/runs", ".quality-gate"]) {
    mkdirSync(join(main, folder), { recursive: true });
    blockedByResolve(main, "touch x", join(main, folder));
  }
  mkdirSync(join(wt, ".claude", "hooks"), { recursive: true });
  blockedByResolve(main, "touch x", join(wt, ".claude", "hooks"));
  mkdirSync(join(main, "apps", "web"), { recursive: true });
  blocked(call(main, bash(join(main, "apps", "web"), "touch x")));
  allowed(call(main, bash(join(main, "apps", "web"), "touch x", SUB)));
  allowedBoth(main, "touch x", wt);
});

test("ORV-138 row 29: every form of 'Write-guard forms to keep' is allowed in the session the list names", () => {
  const { main, wt } = world();
  const mainForms = [
    "git grep -n -F 'old' HEAD -- $(git diff --name-only origin/develop...HEAD)",
    `{ git diff --name-only --diff-filter=d HEAD -- docs/knowledge; git ls-files -o --exclude-standard -- docs/knowledge; } | xargs grep -n -E '^source: "?([^"]*; )?(/Users/|/home/|/private/|/tmp/|~/)'`,
    "export TEST_DATABASE_URL=postgres://localhost/x REQUIRE_DB_TESTS=1; pnpm quality-gate",
    `git -C ${wt} push -u origin HEAD`,
    "pnpm lint && pnpm typecheck && pnpm test && pnpm build",
  ];
  for (const form of mainForms) allowed(call(main, bash(main, form)));
  const subForms = [
    "node --test scripts/ovl/*.test.mjs",
    "pnpm test:scripts 2>&1 | tail -5",
    "rm -rf /tmp/orv-*",
  ];
  for (const form of subForms) allowed(call(main, bash(main, form, SUB)));
  bindShooter(main, "qa", "ORV-1-qa-1", "aqa");
  allowed(
    call(main, bash(main, `ls ${main}/.orivilo/runs/ORV-1/ORV-1-qa-1/screenshots/*.png`, "aqa")),
  );
});

test("ORV-138 row 29: shell-1 (f) lets a commit and a PR body form hold >, rm and git switch", () => {
  const { main } = world();
  const body =
    "fix: a -> b\n\nremove the old file, rm it, a > b\ngit switch x and git checkout y\n$(rm z)";
  const forms = [
    `git commit -m "$(cat <<'EOF'\n${body}\nEOF\n)"`,
    `git commit -m "$(cat <<"EOF"\n${body}\nEOF\n)"`,
    `gh pr create --title "ORV-138: x" --body "$(cat <<'EOF'\n${body}\nEOF\n)"`,
  ];
  for (const form of forms) allowed(call(main, bash(main, form)));
});

test("ORV-138 row 29: shell-1 (f) judges what runs around a here-document body, and the substitutions inside an unquoted one", () => {
  const { main } = world();
  const body = "a > b rm c";
  const forms = [
    // A command after the closing delimiter, or after the closing parenthesis, is judged.
    `git commit -m "$(cat <<'EOF'\n${body}\nEOF\n; rm .oriv?lo/x\n)"`,
    `git commit -m "$(cat <<'EOF'\n${body}\nEOF\n)" && rm .oriv?lo/x`,
    // A command on the opening line is judged.
    `git commit -m "$(cat <<'EOF' > .oriv?lo/x\n${body}\nEOF\n)"`,
    // An unquoted delimiter: the shell expands the body, so a substitution in it runs.
    `git commit -m "$(cat <<EOF\n${body} $(rm .oriv?lo/x)\nEOF\n)"`,
    `git commit -m "$(cat <<EOF\n${body} \`rm .oriv?lo/x\`\nEOF\n)"`,
    // The body of a here-document with a tab-indented delimiter ends there.
    `cat <<-EOF\n\t${body}\n\tEOF\nrm .oriv?lo/x`,
  ];
  for (const form of forms) {
    blocked(call(main, bash(main, form)), new RegExp(`names ${HIDDEN}`));
  }
});

test("ORV-138 row 29: shell-1 (f) lets an unquoted delimiter body without a substitution, and a body with no closing delimiter, run nothing", () => {
  const { main } = world();
  const body = "a > b rm c";
  // The v1.1 text rule blocked both; v1.2 reads only what the shell runs: a body is no command.
  allowedBoth(main, `git commit -m "$(cat <<EOF\n${body}\nEOF\n)"`);
  allowedBoth(main, `git commit -m "$(cat <<'EOF'\n${body}\n)"`);
});

/** A folder outside every checkout and not above one (`/tmp` is above a checkout when the tests run under it). */
function outside(main) {
  return main.startsWith("/tmp/") ? realpathSync(mkdtempSync(join(tmpdir(), "ovl-out-"))) : "/tmp";
}

test("ORV-138 row 30: resolve-1 (e) blocks a relative target when the cwd is missing or gone, and allows an absolute one", () => {
  const { main } = world();
  const out = outside(main);
  const gone = join(main, ".claude", "worktrees", "gone");
  blockedByResolve(main, "touch a.txt", gone);
  // v1.1 blocked every write form from a missing cwd; v1.2 needs a base only for a relative target.
  allowedBoth(main, `rm -rf ${out}/orv-x`, gone);
  const noCwd = (command, agentId) => ({ ...bash(main, command, agentId), cwd: undefined });
  blocked(call(main, noCwd("touch a.txt")), new RegExp(`names ${HIDDEN}`));
  blocked(call(main, noCwd("touch a.txt", SUB)), new RegExp(`names ${HIDDEN}`));
  allowed(call(main, noCwd(`touch ${out}/a.txt`)));
  allowed(call(main, noCwd(`touch ${out}/a.txt`, SUB)));
  allowedBoth(main, "ls", gone);
  // A cd target that cannot be followed (another user's home) is the same.
  blockedByResolve(main, "cd ~nobody/x && rm y");
  blockedByResolve(main, "pushd ~nobody && rm y");
});

// One test per cause of an unknown base (resolve-1 (e)): the relative target is blocked, the
// absolute one in the same call shape is allowed.
const UNKNOWN_BASE = [
  ["cd", (t) => `cd && tee ${t}`],
  ["cd -", (t) => `cd - && tee ${t}`],
  ['cd "$D"', (t) => `cd "$D" && tee ${t}`],
  ["cd ~-", (t) => `cd ~- && tee ${t}`],
  ["pushd", (t) => `pushd && tee ${t}`],
  ["pushd +1", (t) => `pushd +1 && tee ${t}`],
  ["popd", (t) => `popd && tee ${t}`],
  ["env -C /tmp", (t) => `env -C /tmp tee ${t}`],
  ["git --work-tree=x restore", (t) => `git --work-tree=x restore ${t}`],
  ["git --git-dir x restore", (t) => `git --git-dir x restore ${t}`],
  ["GIT_DIR=x git restore", (t) => `GIT_DIR=x git restore ${t}`],
  ["env GIT_WORK_TREE=x git restore", (t) => `env GIT_WORK_TREE=x git restore ${t}`],
];
for (const [cause, form] of UNKNOWN_BASE) {
  test(`ORV-138 row 30: resolve-1 (e) ${cause} makes the base unknown: a relative target is blocked, an absolute one allowed`, () => {
    const { main } = world();
    blockedByResolve(main, form("a.txt"));
    allowedBoth(main, form(`${outside(main)}/a.txt`));
  });
}

test("ORV-138 row 30: resolve-1 (e) a missing call cwd makes the base unknown", () => {
  const { main } = world();
  const out = outside(main);
  const noCwd = (command) => ({ ...bash(main, command), cwd: undefined });
  blocked(call(main, noCwd("tee a.txt")), new RegExp(`names ${HIDDEN}`));
  allowed(call(main, noCwd(`tee ${out}/a.txt`)));
  // A redirect target is a write target too.
  blocked(call(main, noCwd("printf x > a.txt")), new RegExp(`names ${HIDDEN}`));
  allowed(call(main, noCwd(`printf x > ${out}/a.txt`)));
});

// ---- ORV-138 rows 28 and 29: the forms added in v1.2 ----

test("ORV-138 row 28: the forms of 'Write-guard forms to catch' added in v1.2 are blocked, as the main session and as a subagent", () => {
  const { main } = world();
  for (const folder of [".claude", "scripts", ".github"]) {
    mkdirSync(join(main, folder), { recursive: true });
  }
  // RV-1: the F5 form wrapped in single quotes around a here-document opener.
  blockedByResolve(
    main,
    `echo '$(cat <<"EOF"\n' ; cd .oriv?lo/owner-approvals && printf x > 7.json ; echo '\nEOF\n)'`,
  );
  // RV-2: a cwd left by an earlier call.
  blockedByResolve(main, "printf x > settings.json", join(main, ".claude"));
  blockedByResolve(main, "tee ovl/a.mjs", join(main, "scripts"));
  blockedByResolve(main, "printf x > workflows/ci.yml", join(main, ".github"));
  // RV-6: the command word is not spelt "cd".
  blockedByResolve(main, '"cd" scripts && tee ovl/a.mjs');
  blockedByResolve(main, "\\cd scripts && tee ovl/a.mjs");
  blockedByResolve(main, "builtin cd scripts && tee ovl/a.mjs");
  blockedByResolve(main, "command cd .claude && printf x > settings.json");
  // RV-8: a `..` in the target.
  blockedByResolve(main, "printf x > scripts/x/../ovl/a.mjs");
  // sec-F1: a here-document as a path part.
  blockedByResolve(main, `printf x > "$(cat <<"EOF"\n.oriv\nEOF\n)ilo/owner-approvals/7.json"`);
  // shell-1 (a), (b), (e) and resolve-1 (a), (c). v1.4: a comment ends at its newline, so the write
  // stands on the next line (v1.2 to v1.3 had `git status # ;` before the write on the same line,
  // which the shell does not run).
  blockedByResolve(main, "git status # it's\nprintf x > .oriv?lo/owner-approvals/7.json");
  blockedByResolve(main, "printf x > $'\\x2eorivilo/owner-approvals/7.json'");
  blockedByResolve(main, "printf x > >(cat > .oriv?lo/owner-approvals/7.json)");
  blockedByResolve(main, "false && cd /tmp; printf x > settings.json", join(main, ".claude"));
  blockedByResolve(main, "cp --target-directory=.oriv?lo/exports /tmp/x");
  blockedByResolve(main, "cd .claude && rm -rf hooks");
});

test("ORV-138 row 29: the redirect and glob forms of the review stay allowed, as the main session and as a subagent, from the checkout root", () => {
  const { main } = world();
  const out = outside(main);
  const forms = [
    `cat > ${out}/x.json <<'EOF'\n{"a": 1}\nEOF`,
    `printf a > ${out}/y.txt; echo "exit=$?"`,
    `for n in 1 2; do printf x > ${out}/orv-$n.txt; done`,
    `grep -n x "$HOME/.zshrc" > ${out}/g.txt`,
    `pnpm test > ${out}/t.log 2>&1; echo "exit=$?"`,
    `echo "$(git rev-parse HEAD)"; node -e 'process.exit(1 > 0 ? 0 : 1)'`,
  ];
  for (const form of forms) allowedBoth(main, form);
});

test("ORV-138 row 29: the commit and PR forms and the doc forms stay allowed with a here-document body that holds a protected-looking command", () => {
  const { main } = world();
  const body = "fix: x\n\ncd .oriv?lo/owner-approvals\nprintf x > 7.json\n$(rm -rf .claude)";
  allowed(call(main, bash(main, `git commit -m "$(cat <<'EOF'\n${body}\nEOF\n)"`)));
  allowed(
    call(
      main,
      bash(main, `gh pr create --title "ORV-138: x" --body "$(cat <<'EOF'\n${body}\nEOF\n)"`),
    ),
  );
  for (const delimiter of [`"EOF"`, "\\EOF", `E"O"F`]) {
    allowed(call(main, bash(main, `git commit -m "$(cat <<${delimiter}\n${body}\nEOF\n)"`)));
  }
});

// ---- ORV-138 rows 45 to 49: resolve-1 (a) to (f) ----

/** One form per write program (clause (a)): `p` is the path argument the form writes. */
const PROGRAMS = {
  tee: (p) => `tee ${p}`,
  cp: (p) => `cp /tmp/a ${p}`,
  mv: (p) => `mv /tmp/a ${p}`,
  rm: (p) => `rm ${p}`,
  ln: (p) => `ln -s /tmp/a ${p}`,
  touch: (p) => `touch ${p}`,
  "sed -i": (p) => `sed -i s/a/b/ ${p}`,
  "git apply": (p) => `git apply ${p}`,
  "git restore": (p) => `git restore ${p}`,
  "git checkout": (p) => `git checkout -- ${p}`,
  "git switch": (p) => `git switch ${p}`,
  "git stash": (p) => `git stash push -- ${p}`,
  "git reset": (p) => `git reset -- ${p}`,
};

for (const [program, form] of Object.entries(PROGRAMS)) {
  test(`ORV-138 row 45: resolve-1 (a) ${program}: a path argument .oriv?lo/x is blocked and an absolute one outside every checkout is allowed`, () => {
    const { main } = world();
    blockedByResolve(main, form(".oriv?lo/x"));
    allowedBoth(main, form(`${outside(main)}/x`));
  });
}

test("ORV-138 row 45: resolve-1 (a) reads the option value, the sed -i forms, the base name, and git's global options", () => {
  const { main } = world();
  blockedByResolve(main, "cp --target-directory=.oriv?lo/exports /tmp/a");
  allowedBoth(main, `cp --target-directory=${outside(main)}/exports /tmp/a`);
  // `-t` takes the next word, which is a path argument too.
  blockedByResolve(main, "cp -t .oriv?lo/exports /tmp/a");
  // sed: alone, in a group, with a suffix, or --in-place; without -i it writes nothing.
  for (const flag of ["-i", "-ni", "-i.bak", "--in-place", "-n -i"]) {
    blockedByResolve(main, `sed ${flag} s/a/b/ .oriv?lo/x`);
  }
  allowedBoth(main, "sed -n s/a/b/p .oriv?lo/x");
  // The base name of the command word.
  blockedByResolve(main, "/usr/bin/tee .oriv?lo/x");
  blockedByResolve(main, "/usr/bin/git restore .oriv?lo/x");
  // git's global options come before the subcommand and take their value.
  blockedByResolve(main, "git -c a=b restore .oriv?lo/x");
  blockedByResolve(main, "git -c a=b -C . restore .oriv?lo/x");
  // A word after `--` is a path even if it starts with a dash.
  blockedByResolve(main, "rm -- -x .oriv?lo/y");
  blockedByResolve(main, "rm -- -$X");
  // Other git subcommands and other programs write no path of this rule, and a glob word that is
  // no write target is not judged.
  allowedBoth(main, "git status .oriv?lo/a");
  allowedBoth(main, "git diff -- .oriv?lo/a");
  allowedBoth(main, `grep -n x .oriv?lo/a > ${outside(main)}/g.txt`);
  allowedBoth(main, `ls .oriv?lo > ${outside(main)}/g.txt`);
});

test("ORV-138 row 46: resolve-1 (b) collapses . and .. on the text and through realpath, and applies git -C", () => {
  const { main } = world();
  const out = outside(main);
  mkdirSync(join(main, ".orivilo"), { recursive: true });
  symlinkSync(join(main, ".orivilo"), join(main, "l"));
  blockedByResolve(main, "printf x > scripts/x/../ovl/a.mjs");
  blockedByResolve(main, "git -C .claude restore settings.json");
  blockedByResolve(main, "git -C .claude -C . restore settings.json");
  blockedByResolve(main, "git -C scripts -C ovl restore a.mjs");
  blockedByResolve(main, "git -C scripts -C ../.claude restore settings.json");
  // `-C ""` changes nothing.
  allowedBoth(main, 'git -C "" restore docs/spec.md');
  // env -C moves the program, not the redirect: the base of the path argument is unknown.
  blockedByResolve(main, "env -C /tmp tee a.txt");
  allowedBoth(main, `env -C /tmp tee ${out}/a.txt`);
  // A link to a record folder is followed.
  blockedByResolve(main, "printf x > l/a");
  // A relative target that leaves a protected folder by `..` is judged where it lands.
  allowedBoth(main, "printf x > scripts/../docs/a.md");
  // The text result counts as well as the realpath result: here the guard folder is a link to a
  // folder outside, so only the text finds the guard file (either result counts).
  const holder = realpathSync(mkdtempSync(join(tmpdir(), "ovl-link-")));
  mkdirSync(join(holder, "ovl"));
  symlinkSync(holder, join(main, "scripts"));
  blockedByResolve(main, "printf x > scripts/x/../ovl/a.mjs");
  blockedByResolve(main, "cd scripts && printf x > ovl/a.mjs");
});

test("ORV-138 row 47: resolve-1 (c) judges a literal target against the protected sets, from the cwd", () => {
  const { main } = world();
  for (const folder of [".claude", "scripts", ".github"]) {
    mkdirSync(join(main, folder), { recursive: true });
  }
  blockedByResolve(main, "printf x > settings.json", join(main, ".claude"));
  blockedByResolve(main, "tee ovl/a.mjs", join(main, "scripts"));
  blockedByResolve(main, "printf x > workflows/ci.yml", join(main, ".github"));
  blockedByResolve(main, "cd .claude && rm -rf hooks");
  // The set's own folder counts; so does a file in it.
  blockedByResolve(main, "rm -rf .claude/hook?");
  blockedByResolve(main, "touch .quality-gat?/x");
  // The deliverable set is the main session's: a subagent may write it.
  blocked(call(main, bash(main, "printf x > packages/a.ts")));
  allowed(call(main, bash(main, "printf x > packages/a.ts", SUB)));
  blocked(call(main, bash(main, "cd apps && rm x")));
  allowed(call(main, bash(main, "cd apps && rm x", SUB)));
  // A literal target outside every set is no reason.
  allowedBoth(main, "printf x > docs/a.md");
  allowedBoth(main, "rm scripts-notes.txt");
});

test("ORV-138 row 48: resolve-1 (d) judges a glob or expansion target by its fixed part, from the checkout root", () => {
  const { main } = world();
  const out = outside(main);
  mkdirSync(join(main, "docs"), { recursive: true });
  mkdirSync(join(main, "xa"), { recursive: true });
  // The five words of the Worked examples, shell-1 (c), as redirect targets.
  blockedByResolve(main, "printf x > .oriv[i]lo/owner-approvals/7.json");
  blockedByResolve(main, "printf x > .or{i,}vilo/owner-approvals/7.json");
  blockedByResolve(main, "printf x > ${D}ilo/owner-approvals/7.json");
  allowedBoth(main, `printf x > ${out}/orv-$n.txt`);
  allowedBoth(main, `printf x > ${out}/orv-*`);
  // A glob in a checkout root, and from a folder that holds no protected path.
  blockedByResolve(main, "rm *.tmp");
  allowedBoth(main, "rm *.tmp", join(main, "docs"));
  // An expansion inside a checkout.
  blockedByResolve(main, "printf x > logs/$n.txt", join(main, "docs"));
  blockedByResolve(main, 'printf x > "$f"', join(main, "docs"));
  // A link is followed for the fixed part of a glob and for the folder of an expansion.
  mkdirSync(join(main, ".orivilo"), { recursive: true });
  symlinkSync(join(main, ".orivilo"), join(main, "docs", "lnk"));
  blockedByResolve(main, "printf x > docs/lnk/a*");
  const elsewhere = realpathSync(mkdtempSync(join(tmpdir(), "ovl-link-")));
  symlinkSync(main, join(elsewhere, "lnkmain"));
  blockedByResolve(main, `printf x > ${elsewhere}/lnkmain/$n`);
  allowedBoth(main, `printf x > ${elsewhere}/$n`);
  // An expansion with an empty fixed part could be anything, wherever the cwd is.
  const far = join(realpathSync(mkdtempSync(join(tmpdir(), "ovl-far-"))), "a", "b");
  mkdirSync(far, { recursive: true });
  blockedByResolve(main, 'printf x > "$D"/x', far);
  // A folder outside every checkout, and not above one, is no reason.
  allowedBoth(main, `printf x > ${out}/$n.txt`, far);
  // A `..` after a glob name cancels the name.
  blockedByResolve(main, "printf x > x*/../.oriv?lo/owner-approvals/7.json");
  // A glob name that a `..` collapses away leaves a literal path, judged as one.
  allowedBoth(main, "printf x > x*/../docs/a.md");
  blockedByResolve(main, "cd scripts && printf x > x*/../ovl/a.mjs");
  // A glob that can begin the name of a guard file, and of a worktree folder.
  blockedByResolve(main, "cd .claude && printf x > settings.j*");
  blockedByResolve(main, "printf x > .claude/work*/w/a");
  // Above a checkout, an expansion or a glob can reach one.
  blockedByResolve(main, `rm ${dirname(main)}/*`);
  blockedByResolve(main, `rm ${dirname(main)}/$X`);
});

test("ORV-138 row 49: resolve-1 (f) leaves the screenshot exception and the older rules as they were", () => {
  const { main } = world();
  bindShooter(main, "qa", "ORV-1-qa-1", "aqa");
  const own = shots(main, "ORV-1-qa-1");
  const other = shots(main, "ORV-1-other");
  allowed(call(main, bash(main, `cp /tmp/a.png ${own}/a.png`, "aqa")));
  blocked(call(main, bash(main, `cp /tmp/a.png ${other}/a.png`, "aqa")));
  // A subagent call that names a record and writes it by a base-named program, with no write form in
  // its text, is read by resolve-1.
  blocked(call(main, bash(main, `/usr/bin/tee ${other}/a.png`, "aqa")));
  blocked(call(main, bash(main, `/usr/bin/tee ${own}/a.txt`, "aqa")));
  // A read that names a record stays allowed.
  allowed(call(main, bash(main, `ls ${own}`, "aqa")));
});

// ---- ORV-138 rows 28, 58 and 60 (v1.4): resolve-1 (g) blocks an unknown call, (f) skips a quoted body ----

/** The call is blocked because shell-1 could not read it (resolve-1 (g)), as the main session and as a subagent. */
function blockedUnknown(main, command, cause, cwd = main) {
  for (const agentId of [undefined, SUB]) {
    const result = call(main, bash(cwd, command, agentId));
    blocked(result, /the call could not be read/);
    assert.ok(result.stderr.includes(describeCause(cause)), `${cause}: ${result.stderr}`);
  }
}

test("ORV-138 row 28: the round 1 re-check forms of 'Write-guard forms to catch' (v1.4) are blocked, as the main session and as a subagent", () => {
  const { main } = world();
  const f5 = OWNER_FORM("owner-approvals");
  for (const form of [
    // RV2-1, sec-F5 (1): a quote in a comment opens no quote, so the write on the next line is live.
    `true # it's done\n${f5}`,
    `# the "owner\n${f5}`,
    // RV2-2: a shift inside (( )) opens no here-document.
    `(( n = 1 << 2 ))\n${f5}`,
    // sec-F5 (3): a here-document pending across the newline of a $( ).
    `cat <<'EOF' $(\n${f5}\n)\nx\nEOF`,
    // sec-F5 (4): a $'...' delimiter.
    `cat <<$'EOF'\nx\nEOF\n${f5}`,
    // RV2-4 and sec-F6: a runner before the write program.
    "nice cp /dev/null .oriv?lo/owner-approvals/",
    "caffeinate -i cp /dev/null .oriv?lo/owner-approvals/",
    "/usr/bin/time cp /dev/null .oriv?lo/owner-approvals/",
    "cd .oriv?lo/owner-approvals && nice tee 7.json",
    "cd .oriv?lo/owner-approvals && nice cp /tmp/a 7.json",
    "cd .oriv?lo/owner-approvals && stdbuf -o0 tee 7.json",
    "cd .oriv?lo/owner-approvals && /usr/bin/time cp /tmp/a 7.json",
  ]) {
    blockedByResolve(main, form);
  }
  // RV2-2, sec-F5 (2): a here-document in a substitution that closes on its own line makes the call
  // unknown (unknown-1, H4 and H5), and resolve-1 (g) blocks it.
  blockedUnknown(main, `x=$(cat <<'EOF')\n${f5}\nEOF`, "H4");
  blockedUnknown(main, `x=\`cat <<'EOF'\`\n${f5}\nEOF`, "H5");
});

/** Each form of "Unknown call forms" (unknown-1) with the cause shell-1 gives; NL is a newline. */
const UNKNOWN_CALLS = [
  ["C6", "x=`echo a # `\necho b`"],
  ["C7", "histchars='!^%'\necho % it's\ngit status"],
  ["H4", "x=$(cat <<'EOF')\ngit status\nEOF"],
  ["H5", "x=`cat <<'EOF'`\ngit status\nEOF"],
  ["H8", "cat <<$'E\\x4fF'\nx\nEOF"],
  ["H9", 'cat <<$"EOF"\nx\nEOF'],
  ["H11", "cat <<`EOF`\nx\n`EOF`"],
  ["H12", "cat <<E\\\nOF\nx\nEOF"],
  ["H13", "cat <<EOF\nEO\\\nF\ngit status"],
  ["S2", 'echo `echo "a` b"'],
  ["S3", "echo $((cd /tmp; git status) )"],
  ["S4", "((git status) )"],
  ["S11", "ls a(b|c)"],
  ["S11", "print *(e:'git status':)"],
  ["runner:env", "env -S 'git status'"],
  ["runner:flock", "flock /tmp/orv.lock -c 'git status'"],
  ["runner:sudo", "sudo -s git status"],
  ["runner:sudo", "sudo -i git status"],
  ["runner:sudo", "sudo -h git status"],
  ["runner:script", "script -c 'git status' /tmp/t"],
  ["runner:script", "script -t /tmp/t"],
  ["runner:watch", "watch git status"],
  ["runner:watch", "watch -x git status"],
  ["runner:parallel", "parallel git status ::: a"],
  ["runner:pnpm exec", "pnpm exec -c 'git status'"],
  ["runner:npx", "npx -c 'git status'"],
  ["runner:chrt", "chrt git status"],
  ["runner:prlimit", "prlimit -n 5 git status"],
  ["runner:prlimit", "prlimit --nofile git status"],
  ["runner:nice", "nice -z git status"],
  ["runner:nice", "nice $N git status"],
  ["length", `echo ${"a".repeat(199996)}`],
];

// The forms are harmless commands, so the block comes from the reading alone.
let unknownWorld;
for (const [cause, form] of UNKNOWN_CALLS) {
  test(`ORV-138 row 58: resolve-1 (g) blocks ${cause} ${JSON.stringify(form.length > 60 ? form.slice(0, 20) : form)} as the main session and as a subagent, and says the call could not be read`, () => {
    unknownWorld ??= world();
    blockedUnknown(unknownWorld.main, form, cause);
  });
}

test("ORV-138 row 58: resolve-1 (g) comes after the close rules and the screenshot exception, and before any target is judged", () => {
  const { main } = world();
  // The close rules read the call first, whatever shell-1 makes of it.
  blocked(
    call(main, bash(main, "histchars=x node scripts/ovl/close-envelope.mjs ORV-1-a --owner")),
    /owner's own terminal/,
  );
  blocked(
    call(main, bash(main, "histchars=x node scripts/ovl/close-envelope.mjs ORV-1-a", SUB)),
    /only the main session closes/,
  );
  // The screenshot exception allows a qa's copy of its own PNG although the call is unknown (S11);
  // the same copy into another task's folder is blocked, as an unknown call.
  bindShooter(main, "qa", "ORV-1-qa-1", "aqa");
  allowed(call(main, bash(main, `cp /tmp/a(b).png ${shots(main, "ORV-1-qa-1")}/a.png`, "aqa")));
  const result = call(
    main,
    bash(main, `cp /tmp/a(b).png ${shots(main, "ORV-1-other")}/a.png`, "aqa"),
  );
  blocked(result, /the call could not be read/);
  assert.ok(result.stderr.includes(describeCause("S11")), result.stderr);
  // No target is judged first: the call names no protected path and no write program.
  const harmless = call(main, bash(main, "ls a(b)", SUB));
  blocked(harmless, /the call could not be read/);
  assert.doesNotMatch(harmless.stderr, /a write form names/);
});

const REPORT_BODY =
  '{"file": "scripts/ovl/write-guard.mjs", "ref": ".orivilo/runs/ORV-138/x/result.json"}';

test("ORV-138 row 60: a subagent writes a report from a quoted here-document whose body names a guard path and a record path, and validates it (RV2-3)", () => {
  const { main } = world();
  const out = outside(main);
  for (const delimiter of ["'EOF'", '"EOF"', "\\EOF", 'E"O"F']) {
    allowed(
      call(
        main,
        bash(main, `cat > ${out}/orv-report.json <<${delimiter}\n${REPORT_BODY}\nEOF`, SUB),
      ),
    );
  }
  allowed(
    call(main, bash(main, `node scripts/ovl/validate.mjs reviewer.v1 ${out}/orv-report.json`, SUB)),
  );
});

test("ORV-138 row 60: the same report with an unquoted delimiter is blocked as a subagent, and so is a body that names a record for the main session", () => {
  const { main } = world();
  const out = outside(main);
  const unquoted = `cat > ${out}/orv-report.json <<EOF\n${REPORT_BODY}\nEOF`;
  blocked(call(main, bash(main, unquoted, SUB)), /a write form names/);
  blocked(call(main, bash(main, unquoted)), /the command names/);
});

test("ORV-138 row 60: a here-document that writes into a record is blocked as the main session and as a subagent", () => {
  const { main } = world();
  const form = "cat > .orivilo/x.json <<'EOF'\n{}\nEOF";
  blocked(call(main, bash(main, form)));
  blocked(call(main, bash(main, form, SUB)));
  // The opener line and what runs after the delimiter line are read as before.
  for (const hidden of [
    "cat <<'EOF' > .oriv?lo/x.json\n{}\nEOF",
    "cat > /tmp/orv-x.json <<'EOF'\n{}\nEOF\nrm .orivilo/x",
    "cat > /tmp/orv-x.json <<'EOF'\n{}\nEOF\nrm .oriv?lo/x",
  ]) {
    blocked(call(main, bash(main, hidden)));
    blocked(call(main, bash(main, hidden, SUB)));
  }
});

test("ORV-138 row 60: as the main session, a quoted here-document body that names a record write is text, not a write", () => {
  const { main } = world();
  const out = outside(main);
  const note = `cat > ${out}/orv-note.md <<'EOF'\nprintf x > .orivilo/owner-approvals/7.json\nEOF`;
  allowed(call(main, bash(main, note)));
  allowed(call(main, bash(main, note, SUB)));
  // A tab-indented delimiter ends a <<- body; the body is text there too.
  allowed(call(main, bash(main, `cat > ${out}/orv-note.md <<-'EOF'\n\trm .orivilo/x\n\tEOF`)));
});

test("ORV-138 row 60: every quoted here-document body of a call is skipped by the text rules, not only the first", () => {
  const { main } = world();
  const out = outside(main);
  const two = `cat > ${out}/a.md <<'A'; cat > ${out}/b.md <<'B'\n${REPORT_BODY}\nA\n${REPORT_BODY}\nB`;
  allowed(call(main, bash(main, two)));
  allowed(call(main, bash(main, two, SUB)));
  // A body after an unquoted delimiter is still read, whichever place it takes in the call.
  const mixed = `cat > ${out}/a.md <<'A'; cat > ${out}/b.md <<B\n${REPORT_BODY}\nA\n${REPORT_BODY}\nB`;
  blocked(call(main, bash(main, mixed)), /the command names/);
  blocked(call(main, bash(main, mixed, SUB)), /a write form names/);
});

test("ORV-138 row 60: a quoted here-document body that holds a > or a write command is no write form for the subagent text rule", () => {
  const { main } = world();
  // The call names a guard path outside its body, so the ORV-93 text rule reads it.
  const piped = `node scripts/ovl/validate.mjs reviewer.v1 /dev/stdin <<'EOF'\n{"note": "a"}\nwhen a > b\ncp x y\nEOF`;
  allowed(call(main, bash(main, piped, SUB)));
  blocked(call(main, bash(main, piped.replace("<<'EOF'", "<<EOF"), SUB)), /a write form names/);
});
