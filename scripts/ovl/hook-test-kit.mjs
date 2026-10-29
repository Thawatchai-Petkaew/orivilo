// Shared helpers for the ovl hook tests: temp repos, recorded stdin fixtures, seeded records.
import { spawnSync, execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, "..", "..");

export const fixture = (name) =>
  JSON.parse(readFileSync(join(here, "fixtures", "hook-stdin", `${name}.json`), "utf8"));

/** A fresh git repo with the files the valid envelope cites. */
export function makeRepo(branch = "feature/ORV-1-test") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "ovl-test-")));
  execFileSync("git", ["init", "-q", "-b", branch], { cwd: root });
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "docs", "spec.md"), "spec\n");
  return root;
}

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/** A repo with one commit on `branch` and a second worktree on its own branch `second`: {main, wt}. */
export function twoCheckouts(branch = "feature/ORV-1-test", second = "feature/ORV-2-second") {
  const main = makeRepo(branch);
  git(main, "config", "user.email", "t@example.com");
  git(main, "config", "user.name", "t");
  git(main, "add", "-A");
  git(main, "commit", "-q", "-m", "base");
  const wt = join(realpathSync(mkdtempSync(join(tmpdir(), "ovl-wt-"))), "second");
  git(main, "worktree", "add", "-q", "-b", second, wt);
  return { main, wt };
}

export function validEnvelope(root, overrides = {}) {
  return {
    envelope_version: 1,
    task_id: "ORV-1-a",
    issue: "ORV-1",
    role: "builder",
    objective: "Build the thing",
    worktree: root,
    write_set: ["packages/design-system/src/components/checkbox/**"],
    context_pointers: ["docs/spec.md"],
    facts: [{ claim: "The spec exists", checked_by: "docs/spec.md" }],
    boundaries: [],
    done_when: ["pnpm test"],
    skills: ["quality-gate"],
    ...overrides,
  };
}

/** PreToolUse Agent input built from the recorded sample, pointed at `root`. */
export function agentInput(root, envelope, toolInput = {}) {
  const base = fixture("PreToolUse-Agent");
  return {
    ...base,
    cwd: root,
    tool_input: {
      ...base.tool_input,
      subagent_type: envelope?.role ?? base.tool_input.subagent_type,
      prompt: envelope ? JSON.stringify(envelope) : base.tool_input.prompt,
      ...toolInput,
    },
  };
}

/** Runs a node script with `input` (object or raw string) on stdin. */
export function runNode(script, input, env = {}) {
  const stdin = typeof input === "string" ? input : JSON.stringify(input);
  const r = spawnSync(process.execPath, [script], {
    input: stdin,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return { code: r.status, stderr: r.stderr, stdout: r.stdout };
}

/** Runs a shell command string exactly as settings.json hands it to Claude Code. */
export function runCommand(command, input, env = {}) {
  const r = spawnSync("/bin/sh", ["-c", command], {
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return { code: r.status, stderr: r.stderr };
}

export const hook = (name) => join(repoRoot, ".claude", "hooks", name);

export function registeredCommands() {
  const settings = JSON.parse(readFileSync(join(repoRoot, ".claude", "settings.json"), "utf8"));
  return Object.entries(settings.hooks).flatMap(([event, groups]) =>
    groups.flatMap((g) => g.hooks.map((h) => ({ event, matcher: g.matcher, command: h.command }))),
  );
}

export function seedTask(root, issue, taskId, files) {
  const dir = join(root, ".orivilo", "runs", issue, taskId);
  mkdirSync(dir, { recursive: true });
  for (const [name, value] of Object.entries(files)) {
    writeFileSync(join(dir, `${name}.json`), JSON.stringify(value));
  }
}

/** A bound builder round. It is closed by a result unless `open` is true (one open builder per checkout). */
export const seedBoundBuilder = (root, issue, taskId, startedAt, open = false) =>
  seedTask(root, issue, taskId, {
    envelope: validEnvelope(root, { task_id: taskId, issue }),
    agent: { agent_id: `a-${taskId}`, agent_type: "builder", started_at: startedAt },
    ...(open
      ? {}
      : {
          closed: {
            reason: "no_report",
            closed_at: new Date(Date.parse(startedAt) + 1).toISOString(),
          },
        }),
  });

export const seedVerdict = (root, issue, taskId, verdict, recordedAt, contract = "reviewer.v1") =>
  seedTask(root, issue, taskId, {
    envelope: validEnvelope(root, { task_id: taskId, issue, role: "reviewer", write_set: [] }),
    result: { contract, recorded_at: recordedAt, report: { verdict } },
  });

export function seedGate(root, issue, name, record) {
  const dir = join(root, ".orivilo", "runs", issue, "gates");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.json`), JSON.stringify(record));
}

export function seedGrant(root, issue, n) {
  const dir = join(root, ".orivilo", "runs", issue);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `owner-grant-${n}.json`), JSON.stringify({ by: "owner" }));
}

/** ORV-1 after two failed rounds: a request_changes, builder r1, builder r2, then request_changes again. */
export function seedEscalated(root, issue = "ORV-1") {
  seedVerdict(root, issue, `${issue}-rev`, "request_changes", "2026-10-23T10:00:00.000Z");
  seedBoundBuilder(root, issue, `${issue}-r1`, "2026-10-23T10:05:00.000Z");
  seedBoundBuilder(root, issue, `${issue}-r2`, "2026-10-23T10:15:00.000Z");
  seedVerdict(root, issue, `${issue}-rev2`, "request_changes", "2026-10-23T10:20:00.000Z");
}

export function heartbeatLines(root) {
  const file = join(root, ".orivilo", "heartbeat.jsonl");
  return existsSync(file)
    ? readFileSync(file, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l))
    : [];
}

/** SubagentStart input from the recorded sample, for `agentType` with `agentId`, in `root`. */
export const startInput = (root, agentId, agentType) => ({
  ...fixture("SubagentStart"),
  cwd: root,
  agent_id: agentId,
  agent_type: agentType,
});

/** SubagentStop input from the recorded sample. */
export const stopInput = (root, agentId, agentType, message, extra = {}) => ({
  ...fixture("SubagentStop"),
  cwd: root,
  agent_id: agentId,
  agent_type: agentType,
  last_assistant_message: message,
  ...extra,
});

/** PostToolUse(Agent) input from the recorded sample, carrying `message` as the subagent's report. */
export function postAgentInput(root, agentId, subagentType, message) {
  const base = fixture("PostToolUse-Agent");
  return {
    ...base,
    cwd: root,
    tool_input: { ...base.tool_input, subagent_type: subagentType },
    tool_response: {
      ...base.tool_response,
      agentId,
      agentType: subagentType,
      content: [{ type: "text", text: message }],
    },
  };
}

/** PostToolUse(Bash) input from the PreToolUse sample's shape, for the main session unless `agentId` is set. */
export function postBashInput(root, command, agentId) {
  const base = fixture(agentId ? "PreToolUse-Bash-subagent" : "PreToolUse-Bash-main");
  return {
    ...base,
    hook_event_name: "PostToolUse",
    cwd: root,
    tool_input: { ...base.tool_input, command },
    duration_ms: 1000,
    ...(agentId ? { agent_id: agentId } : {}),
  };
}

/** PostToolUseFailure(Bash) input; the fixture is derived from the binary's field set, not recorded. */
export const postBashFailureInput = (root, command, extra = {}) => ({
  ...fixture("PostToolUseFailure-Bash-derived-from-binary"),
  cwd: root,
  tool_input: { command },
  ...extra,
});

/** PostToolUseFailure(Agent) input carrying `prompt`; the fixture is derived from the binary, not recorded. */
export const postAgentFailureInput = (root, prompt, extra = {}) => {
  const base = fixture("PostToolUseFailure-Agent-derived-from-binary");
  return { ...base, cwd: root, tool_input: { ...base.tool_input, prompt }, ...extra };
};

export const gitIn = (cwd, ...args) =>
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], {
    cwd,
    encoding: "utf8",
  }).trim();
export const commitFile = (cwd, file, text = `${file}\n`) => {
  writeFileSync(join(cwd, file), text);
  gitIn(cwd, "add", file);
  gitIn(cwd, "commit", "-q", "-m", `edit ${file}`);
  return gitIn(cwd, "rev-parse", "HEAD");
};

/**
 * origin (bare) with develop; `work` is a clone on feature/ORV-1-x with one commit f.txt (h0);
 * `other` is a second clone that advances develop. Nothing is fetched into work yet. `cloneOrigin()`
 * makes one more clone of origin as it is now.
 */
export function mergeRepo() {
  const root = mkdtempSync(join(tmpdir(), "mergegit-"));
  const origin = join(root, "origin.git");
  gitIn(root, "init", "-q", "--bare", "-b", "develop", origin);
  const seed = join(root, "seed");
  gitIn(root, "init", "-q", "-b", "develop", seed);
  commitFile(seed, "a.txt");
  gitIn(seed, "remote", "add", "origin", origin);
  gitIn(seed, "push", "-q", "origin", "develop");
  const work = join(root, "work");
  gitIn(root, "clone", "-q", origin, work);
  gitIn(work, "checkout", "-q", "-b", "feature/ORV-1-x");
  const h0 = commitFile(work, "f.txt");
  const other = join(root, "other");
  gitIn(root, "clone", "-q", origin, other);
  const advance = (file, text) => {
    const sha = commitFile(other, file, text);
    gitIn(other, "push", "-q", "origin", "develop");
    return sha;
  };
  const mergeBase = () => {
    gitIn(work, "fetch", "-q", "origin", "develop");
    gitIn(work, "merge", "-q", "--no-ff", "-m", "merge develop", "origin/develop");
    return gitIn(work, "rev-parse", "HEAD");
  };
  let clones = 0;
  const cloneOrigin = () => {
    const dir = join(root, `clone-${clones++}`);
    gitIn(root, "clone", "-q", origin, dir);
    return dir;
  };
  return { work, h0, advance, mergeBase, cloneOrigin };
}
