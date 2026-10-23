#!/usr/bin/env node
// The ORV-87 collector: turns the /ovl run records and the Claude Code transcripts into numbers per task.
// Usage: node scripts/ovl/metrics.mjs collect <ISSUE> [--root <checkout holding .orivilo>] [--projects <folder>]
// Writes `.orivilo/metrics/<ISSUE>.json` (metrics.v1) and nothing else. It keeps numbers, ids, enums,
// times and model ids only: no prompt, message, description, file path or transcript path is ever
// copied into a file, stdout or stderr. Exit 0 on success (gaps are warned about on stderr),
// 1 on an unexpected failure, 2 on a usage error.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { recordsRoot } from "./hook.mjs";
import { readIssue, taskDir } from "./records.mjs";

/** Claude Code versions the transcript reading was recorded on (docs/specs/ORV-87/samples.md). */
const KNOWN_VERSIONS = ["2.1.308"];
/** A reported total that differs from the sum of the four kinds by more than this is flagged. */
const MISMATCH = 0.01;
const KINDS = [
  ["input", "input_tokens"],
  ["cache_creation", "cache_creation_input_tokens"],
  ["cache_read", "cache_read_input_tokens"],
  ["output", "output_tokens"],
];
const ID = /^[A-Za-z0-9]+$/;
const SAFE_ID = /^[A-Za-z0-9-]+$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const MODEL = /^[A-Za-z0-9._:/-]+$/;
const NOTICE =
  /<task-id>([A-Za-z0-9]+)<\/task-id>[\s\S]*?<subagent_tokens>(\d+)<\/subagent_tokens>\s*<tool_uses>(\d+)<\/tool_uses>\s*<duration_ms>(\d+)<\/duration_ms>/g;

const schema = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "schemas", "metrics.v1.json"), "utf8"),
);

const isCount = (x) => Number.isInteger(x) && x >= 0;
const ms = (value) => (typeof value === "string" ? Date.parse(value) : NaN);
const iso = (t) => (Number.isNaN(t) ? null : new Date(t).toISOString());

/** Reads JSONL files once each; a line that is not JSON is skipped and counted. */
class Lines {
  skipped = 0;
  versions = new Set();
  #cache = new Map();

  /** Records the Claude Code version of a line the numbers were taken from. */
  note(line) {
    if (typeof line?.version === "string" && VERSION.test(line.version)) {
      this.versions.add(line.version);
    }
  }

  read(file) {
    if (!this.#cache.has(file)) {
      const out = [];
      for (const line of readFileSync(file, "utf8").split("\n")) {
        if (line.trim() === "") continue;
        try {
          out.push(JSON.parse(line));
        } catch {
          this.skipped += 1;
        }
      }
      this.#cache.set(file, out);
    }
    return this.#cache.get(file);
  }
}

/** {file, session, main} of the agent's transcript, found by glob over the projects folder, or null. */
function findTranscript(projects, agentId) {
  if (!ID.test(agentId) || !existsSync(projects)) return null;
  for (const folder of readdirSync(projects)) {
    const base = join(projects, folder);
    if (!statSync(base).isDirectory()) continue;
    for (const session of readdirSync(base)) {
      const file = join(base, session, "subagents", `agent-${agentId}.jsonl`);
      if (SAFE_ID.test(session) && existsSync(file)) {
        const main = join(base, `${session}.jsonl`);
        return { file, session, main: existsSync(main) ? main : null };
      }
    }
  }
  return null;
}

/** What the main session says about one agent: resume times and the reported numbers per run. */
function mainFacts(lines, agentId, note) {
  const resumes = new Set();
  const notices = new Map();
  let foreground = null;
  for (const line of lines) {
    const result = line?.toolUseResult;
    if (result?.resumedAgentId === agentId) {
      resumes.add(ms(line.timestamp));
      note(line);
    }
    if (result?.agentId === agentId && isCount(result.totalTokens)) {
      note(line);
      foreground = {
        total: result.totalTokens,
        tools: isCount(result.totalToolUseCount) ? result.totalToolUseCount : null,
        duration: isCount(result.totalDurationMs) ? result.totalDurationMs : null,
      };
    }
    for (const text of [line?.content, line?.message?.content]) {
      if (typeof text !== "string") continue;
      for (const [, id, tokens, tools, duration] of text.matchAll(NOTICE)) {
        if (id !== agentId) continue;
        note(line);
        const key = `${tokens}/${tools}/${duration}`;
        notices.set(key, {
          total: Number(tokens),
          tools: Number(tools),
          duration: Number(duration),
        });
      }
    }
  }
  return {
    resumes: [...resumes].filter((t) => !Number.isNaN(t)).sort((a, b) => a - b),
    reported: [...(foreground ? [foreground] : []), ...notices.values()],
  };
}

/**
 * The numbers of each run of one agent transcript, split at the resume times. A message id is counted
 * once, with the usage of its last line: before Claude Code 2.1.308 the first line holds a placeholder
 * output_tokens and the last holds the real count (2.1.308 writes the same usage on every line).
 */
function readRuns(lines, resumes, note) {
  const runs = [...Array(resumes.length + 1)].map(() => ({
    messages: new Map(),
    tools: new Set(),
    first: NaN,
    last: NaN,
    model: null,
  }));
  const owner = new Map();
  for (const line of lines) {
    const t = ms(line?.timestamp);
    if (Number.isNaN(t)) continue;
    note(line);
    const run = runs[resumes.filter((b) => b <= t).length];
    if (Number.isNaN(run.first) || t < run.first) run.first = t;
    if (Number.isNaN(run.last) || t > run.last) run.last = t;
    const message = line.type === "assistant" ? line.message : null;
    if (typeof message?.id !== "string" || typeof message.usage !== "object") continue;
    for (const block of Array.isArray(message.content) ? message.content : []) {
      if (block?.type === "tool_use" && typeof block.id === "string") run.tools.add(block.id);
    }
    const first = !owner.has(message.id);
    if (first) owner.set(message.id, run);
    owner.get(message.id).messages.set(message.id, message.usage);
    if (!first) continue;
    if (run.model === null && MODEL.test(message.model ?? "")) run.model = message.model;
  }
  return runs;
}

function sumTokens(messages) {
  const sums = Object.fromEntries(KINDS.map(([name]) => [name, 0]));
  for (const usage of messages.values()) {
    for (const [name, key] of KINDS) {
      if (!isCount(usage[key])) return null;
      sums[name] += usage[key];
    }
  }
  return { ...sums, total: KINDS.reduce((a, [name]) => a + sums[name], 0) };
}

function buildRun(index, run, bounds, reported, session) {
  const found = run.messages.size > 0;
  const tokens = found ? sumTokens(run.messages) : null;
  const total = reported?.total ?? null;
  const started = index === 0 ? run.first : bounds[index - 1];
  const duration =
    reported?.duration ?? (found && !Number.isNaN(started) ? run.last - started : null);
  return {
    start: index === 0 ? "fresh" : "resumed",
    session_id: session,
    api_calls: found ? run.messages.size : null,
    tokens,
    reported_total: total,
    total_mismatch:
      tokens && total !== null ? Math.abs(tokens.total - total) > MISMATCH * total : null,
    tool_uses: found ? run.tools.size : (reported?.tools ?? null),
    duration_ms: duration,
    started_at: iso(started),
    ended_at: found ? iso(run.last) : null,
  };
}

const outcomeOf = (t) => {
  const report = t.result?.report;
  if (t.result?.contract === "implementer.v1" && report?.result) return report.result;
  if (["reviewer.v1", "qa.v1"].includes(t.result?.contract) && report?.verdict)
    return report.verdict;
  return t.closed?.reason ?? "open";
};

function findingsOf(result) {
  if (result === undefined) return null;
  const count = (severity) =>
    (result.report?.findings ?? []).filter((f) => f?.severity === severity).length;
  return {
    critical: count("Critical"),
    important: count("Important"),
    suggestion: count("Suggestion"),
    dropped: Array.isArray(result.dropped) ? result.dropped.length : 0,
  };
}

function buildTask(ctx, t) {
  const agentId =
    typeof t.agent?.agent_id === "string" && ID.test(t.agent.agent_id) ? t.agent.agent_id : null;
  const envelopeFile = join(taskDir(ctx.root, ctx.issue, t.id), "envelope.json");
  const missing = [];
  let runs = [];
  let model = null;
  let found = null;
  if (agentId === null) {
    missing.push("agent.json");
  } else {
    found = findTranscript(ctx.projects, agentId);
    if (found === null) missing.push("agent_transcript");
    else if (found.main === null) missing.push("session_transcript");
  }
  const facts = found?.main
    ? mainFacts(ctx.lines.read(found.main), agentId, (l) => ctx.lines.note(l))
    : { resumes: [], reported: [] };
  if (found) {
    const parsed = readRuns(ctx.lines.read(found.file), facts.resumes, (l) => ctx.lines.note(l));
    model = parsed[0].model;
    runs = parsed.map((run, i) =>
      buildRun(i, run, facts.resumes, facts.reported[i], found.session),
    );
  } else {
    runs = [
      buildRun(
        0,
        { messages: new Map(), tools: new Set(), first: NaN, last: NaN },
        [],
        undefined,
        null,
      ),
    ];
  }
  for (const gap of missing) {
    process.stderr.write(
      `metrics: ${t.id}: ${gap.replace("_", " ")} not found${agentId ? ` for agent ${agentId}` : ""}\n`,
    );
  }
  return {
    task_id: t.id,
    role: t.envelope.role,
    agent_id: agentId,
    model,
    round: isCount(t.result?.round) ? t.result.round : null,
    outcome: outcomeOf(t),
    envelope: {
      bytes: statSync(envelopeFile).size,
      context_pointers: Array.isArray(t.envelope.context_pointers)
        ? t.envelope.context_pointers.length
        : null,
      facts: Array.isArray(t.envelope.facts) ? t.envelope.facts.length : null,
    },
    findings: findingsOf(t.result),
    sent_back: ctx.beats.filter(
      (b) =>
        b?.event === "SubagentStop" &&
        ["block", "error"].includes(b.decision) &&
        b.agent_id === agentId,
    ).length,
    missing,
    runs,
  };
}

export function collect({ root, projects, issue }) {
  const data = readIssue(root, issue);
  const lines = new Lines();
  const heartbeat = join(root, ".orivilo", "heartbeat.jsonl");
  const beats = existsSync(heartbeat) ? lines.read(heartbeat) : [];
  const ctx = { root, projects, issue, lines, beats };
  const tasks = data.tasks
    .filter((t) => t.envelope !== undefined)
    .map((t) => buildTask(ctx, t))
    .sort((a, b) => a.task_id.localeCompare(b.task_id));
  const gates = data.gates.filter((g) => g?.steps_source === "gate");
  const metrics = {
    metrics_version: 1,
    issue,
    collected_at: new Date().toISOString(),
    cc_versions: [...lines.versions].sort(),
    skipped_lines: lines.skipped,
    gates: {
      passed: gates.filter((g) => g.ok === true).length,
      failed: gates.filter((g) => g.ok === false).length,
    },
    tasks,
  };
  const check = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
  if (!check(metrics)) throw new Error("the metrics did not match metrics.v1");
  return metrics;
}

const cell = (x) => (x === null || x === undefined ? "-" : String(x));

function table(metrics) {
  const rows = metrics.tasks.map((t) => {
    const sum = (key) =>
      t.runs.some((r) => r[key] === null) ? null : t.runs.reduce((a, r) => a + r[key], 0);
    const tokens = t.runs.some((r) => r.tokens === null)
      ? null
      : t.runs.reduce((a, r) => a + r.tokens.total, 0);
    return [t.task_id, t.role, t.round, t.outcome, tokens, sum("tool_uses"), sum("duration_ms")]
      .map(cell)
      .join("\t");
  });
  return ["task\trole\tround\toutcome\ttokens\ttool_uses\tduration_ms", ...rows].join("\n");
}

function usage(message) {
  process.stderr.write(
    `metrics: ${message}\nusage: metrics.mjs collect <ISSUE> [--root <checkout holding .orivilo>] [--projects <folder>]\n`,
  );
  process.exit(2);
}

function main(argv) {
  const [command, issue, ...rest] = argv;
  if (command !== "collect") usage("the only command is collect");
  if (!/^ORV-\d+$/.test(issue ?? "")) usage("collect needs an issue key such as ORV-87");
  const flags = { root: undefined, projects: join(homedir(), ".claude", "projects") };
  for (let i = 0; i < rest.length; i += 2) {
    const name = rest[i]?.replace(/^--/, "");
    if (!(name in flags) || rest[i + 1] === undefined) usage("unknown or incomplete option");
    flags[name] = rest[i + 1];
  }
  if (flags.root !== undefined && !existsSync(flags.root)) usage("--root is not a folder");
  const root = flags.root ?? recordsRoot(process.cwd());
  const metrics = collect({ root, projects: flags.projects, issue });
  const out = join(root, ".orivilo", "metrics");
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${issue}.json`), `${JSON.stringify(metrics, null, 2)}\n`);
  for (const version of metrics.cc_versions.filter((v) => !KNOWN_VERSIONS.includes(v))) {
    process.stderr.write(
      `metrics: transcript version ${version} was not recorded on, check the numbers\n`,
    );
  }
  process.stdout.write(`${table(metrics)}\nwrote .orivilo/metrics/${issue}.json\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    // Only the error code or name: a message can hold a file path.
    process.stderr.write(`metrics: failed (${error.code ?? error.name})\n`);
    process.exit(1);
  }
}
