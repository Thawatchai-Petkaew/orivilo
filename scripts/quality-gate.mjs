#!/usr/bin/env node
/**
 * The full gate as one command with a report a gate packet can quote (ORV-13, E0-4).
 *
 *   pnpm quality-gate            run every step, keep going after a failure
 *   pnpm quality-gate --bail     stop at the first failure (the rest report "not run")
 *   pnpm quality-gate --only lint,test   a partial run: the rest report "not run", ok is false
 *
 * An unknown flag, an unknown step name or a missing --only value prints usage and exits 2 without running anything.
 * Writes `.quality-gate/report.json` (schemaVersion 1) and `.quality-gate/report.md`, prints the
 * markdown, and exits non-zero when any step fails or does not run. Output is captured as it
 * really came out (ANSI stripped); nothing is summarised as a pass.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** The gate, in the order CI runs it (.github/workflows/ci.yml). */
const GATE_STEPS = [
  { name: "format", command: ["pnpm", "format:check"] },
  // Blocking from the start (ORV-108): each commit of origin/develop..HEAD passes commitlint.
  { name: "commits", command: ["pnpm", "lint:commits"] },
  // The script tests CI runs right after format:check (.github/workflows/ci.yml).
  { name: "scripts", command: ["pnpm", "test:scripts"] },
  { name: "lint", command: ["pnpm", "lint"] },
  // Report mode (ORV-108): findings print and block nothing until a guard-file PR removes --report here and in CI.
  { name: "secrets", command: ["pnpm", "scan:secrets", "--report"] },
  { name: "codescan", command: ["pnpm", "scan:code", "--report"] },
  { name: "typecheck", command: ["pnpm", "typecheck"] },
  { name: "contrast", command: ["pnpm", "contrast"] },
  // --force: turbo keys its test cache without TEST_DATABASE_URL (passThroughEnv), so a cached run
  // can replay output from a run that skipped the database tests.
  // --continue: every package reports even when one fails.
  // REQUIRE_DB_TESTS=1: a missing test database fails the step instead of skipping silently.
  {
    name: "test",
    command: ["pnpm", "test", "--force", "--continue"],
    env: { REQUIRE_DB_TESTS: "1" },
  },
  { name: "build", command: ["pnpm", "build"] },
  { name: "audit", command: ["pnpm", "audit", "--prod", "--audit-level", "high"] },
];

// Test hook: a JSON file of steps replaces the gate, so the script's own tests can run main().
// A report from such a run says so (stepsSource "stub") and is never ok.
export const STEPS_SOURCE = process.env.QUALITY_GATE_STEPS_FILE ? "stub" : "gate";
export const STEPS = process.env.QUALITY_GATE_STEPS_FILE
  ? JSON.parse(readFileSync(process.env.QUALITY_GATE_STEPS_FILE, "utf8"))
  : GATE_STEPS;

const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;

export function stripAnsi(text) {
  return text.replace(ANSI, "");
}

/** Lines worth quoting: test counts, contrast totals, failures, audit totals. */
const KEY_LINE =
  /(\bTests\s+\d|\bFAIL\b|^(#|ℹ)\s+(pass|fail)\s+\d|pairs x|\berror\b|ERR_|vulnerabilit|Code style issues|All matched files use Prettier|Compiled successfully|Cached:\s+\d)/;

export function summarize(output, limit = 30) {
  const lines = stripAnsi(output)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const keys = [...new Set(lines.filter((l) => KEY_LINE.test(l)))].slice(0, limit);
  return { summary: keys, tail: lines.slice(-limit) };
}

/**
 * Always lists every step. pass when the step exited 0, fail otherwise; a step that never ran is
 * "not run", never a pass. ok needs every step to pass and git to be readable and unchanged.
 */
export function buildReport({
  results,
  git,
  gitEnd = git,
  env,
  only,
  startedAt,
  finishedAt,
  steps = STEPS,
  stepsSource = STEPS_SOURCE,
}) {
  const byName = new Map(results.map((r) => [r.name, r]));
  const rows = steps.map((s) => {
    const r = byName.get(s.name);
    if (!r) {
      const excluded = only && !only.includes(s.name);
      return {
        name: s.name,
        command: s.command.join(" "),
        status: "not run",
        reason: excluded ? "excluded by --only" : "skipped after an earlier failure",
      };
    }
    return {
      name: s.name,
      command: s.command.join(" "),
      status: r.exitCode === 0 ? "pass" : "fail",
      exitCode: r.exitCode,
      durationMs: r.durationMs,
      ...summarize(r.output),
    };
  });
  const problems = [];
  if (stepsSource === "stub")
    problems.push("steps replaced by QUALITY_GATE_STEPS_FILE (test hook)");
  if (results.length === 0) problems.push("no step ran");
  if (env?.TEST_DATABASE_URL === "unset" && byName.has("test"))
    problems.push("TEST_DATABASE_URL is unset, so the database tests could not run");
  if (git.sha === "unknown" || gitEnd.sha === "unknown")
    problems.push("git was unreadable, so the commit this run covers is unknown");
  else if (git.sha !== gitEnd.sha)
    problems.push(
      `HEAD changed during the run (${git.sha.slice(0, 7)} to ${gitEnd.sha.slice(0, 7)})`,
    );
  return {
    schemaVersion: 1,
    ok: rows.every((r) => r.status === "pass") && problems.length === 0,
    partial: only !== undefined,
    stepsSource,
    startedAt,
    finishedAt,
    git,
    ...(env ? { env } : {}),
    problems,
    steps: rows,
  };
}

export function toMarkdown(report) {
  const head = [
    `**Quality gate: ${report.ok ? "pass" : "FAIL"}** (${report.git.branch} @ ${report.git.sha.slice(0, 7)}${report.git.dirty ? ", uncommitted changes" : ""})`,
    ...(report.partial ? ["Partial run (--only): not valid evidence for G3.", ""] : []),
    ...report.problems.map((p) => `Problem: ${p}`),
    ...(report.problems.length ? [""] : []),
    "| Step | Result | Time | Key lines |",
    "| --- | --- | --- | --- |",
  ];
  const rows = report.steps.map((s) => {
    const time = s.durationMs === undefined ? "" : `${Math.round(s.durationMs / 1000)}s`;
    const keys = (s.summary ?? []).slice(0, 6).join("<br>").replaceAll("|", "\\|");
    return `| ${s.name} | ${s.status} | ${time} | ${keys || (s.reason ?? "")} |`;
  });
  return [...head, ...rows, ""].join("\n");
}

function git(args) {
  const r = spawnSync("git", args, { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "unknown";
}

export function readGit() {
  return {
    branch: git(["rev-parse", "--abbrev-ref", "HEAD"]),
    sha: git(["rev-parse", "HEAD"]),
    dirty: git(["status", "--porcelain"]) !== "",
  };
}

function run(step) {
  return new Promise((resolve) => {
    const started = Date.now();
    const [cmd, ...args] = step.command;
    const child = spawn(cmd, args, { env: { ...process.env, FORCE_COLOR: "0", ...step.env } });
    let output = "";
    const take = (chunk) => {
      output += chunk;
      process.stderr.write(chunk);
    };
    child.stdout.on("data", take);
    child.stderr.on("data", take);
    child.on("error", (err) => {
      output += `\n${err.message}`;
    });
    child.on("close", (code) =>
      resolve({ name: step.name, exitCode: code ?? 1, durationMs: Date.now() - started, output }),
    );
  });
}

export const USAGE = `Usage: pnpm quality-gate [--bail] [--only <step>[,<step>...]]
Steps: ${STEPS.map((s) => s.name).join(", ")}`;

/** Throws on an unknown flag, an unknown step name, or a missing --only value. */
export function parseArgs(argv) {
  let only;
  let bail = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--bail") bail = true;
    else if (arg === "--only" || arg.startsWith("--only=")) {
      let value;
      if (arg === "--only") {
        value = argv[i + 1]?.startsWith("--") ? undefined : argv[i + 1];
        i++;
      } else value = arg.slice("--only=".length);
      if (!value) throw new Error("--only needs a comma-separated list of step names");
      only = value.split(",");
    } else throw new Error(`unknown option "${arg}"`);
  }
  const known = STEPS.map((s) => s.name);
  for (const name of only ?? [])
    if (!known.includes(name)) throw new Error(`unknown step "${name}"`);
  return { bail, only };
}

/** What the report records about the environment: set or unset, never a value. */
export function reportEnv(processEnv) {
  return {
    TEST_DATABASE_URL: processEnv.TEST_DATABASE_URL ? "set" : "unset",
    REQUIRE_DB_TESTS: "1",
  };
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`quality-gate: ${err.message}\n${USAGE}\n`);
    process.exitCode = 2;
    return;
  }
  const { bail, only } = args;
  const steps = only ? STEPS.filter((s) => only.includes(s.name)) : STEPS;
  const startedAt = new Date().toISOString();
  const gitStart = readGit();
  const results = [];
  for (const step of steps) {
    process.stderr.write(`\n=== quality-gate: ${step.name} (${step.command.join(" ")}) ===\n`);
    const result = await run(step);
    results.push(result);
    if (bail && result.exitCode !== 0) break;
  }
  const report = buildReport({
    results,
    only,
    startedAt,
    finishedAt: new Date().toISOString(),
    git: gitStart,
    gitEnd: readGit(),
    env: reportEnv(process.env),
  });
  mkdirSync(".quality-gate", { recursive: true });
  writeFileSync(".quality-gate/report.json", `${JSON.stringify(report, null, 2)}\n`);
  const md = toMarkdown(report);
  writeFileSync(".quality-gate/report.md", md);
  process.stdout.write(`\n${md}`);
  process.exitCode = report.ok ? 0 : 1;
}

const self = fileURLToPath(import.meta.url);
const started = process.argv[1] ? path.resolve(process.argv[1]) : "";
let startedReal = started;
try {
  startedReal = realpathSync(started);
} catch {
  // Not a file on disk; compared as given.
}
if (startedReal === self) await main();
