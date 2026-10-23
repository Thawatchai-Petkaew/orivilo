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

export const seedBoundBuilder = (root, issue, taskId, startedAt) =>
  seedTask(root, issue, taskId, {
    envelope: validEnvelope(root, { task_id: taskId, issue }),
    agent: { agent_id: `a-${taskId}`, agent_type: "builder", started_at: startedAt },
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
