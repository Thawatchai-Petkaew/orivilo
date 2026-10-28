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
import { join } from "node:path";
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
