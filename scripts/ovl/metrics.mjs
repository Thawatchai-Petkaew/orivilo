#!/usr/bin/env node
// The ORV-87 collector: turns the /ovl run records and the Claude Code transcripts into numbers per task.
// Usage: node scripts/ovl/metrics.mjs collect <ISSUE> [--root <checkout holding .orivilo>] [--projects <folder>]
//        node scripts/ovl/metrics.mjs report <ISSUE...> [--root <folder>] [--out <name>]
//        node scripts/ovl/metrics.mjs session <session id> [--projects <folder>]
//        node scripts/ovl/metrics.mjs due [--lessons <folder>] [--today YYYY-MM-DD]
// Writes `.orivilo/metrics/<ISSUE>.json` (metrics.v1) and nothing else. It keeps numbers, ids, enums,
// times and model ids only: no prompt, message, description, file path or transcript path is ever
// copied into a file, stdout or stderr. The one exception: `report --out` prints `wrote <absolute path>`
// of the file it wrote, and nothing else holds a path. Exit 0 on success (gaps are warned about on stderr),
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
/** Agent types kept from a meta file: the envelope roles and Claude Code's own. Any other text is dropped. */
const AGENT_TYPES = [
  "product",
  "ds-architect",
  "designer",
  "builder",
  "qa",
  "reviewer",
  "release",
  "Explore",
  "Plan",
  "general-purpose",
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

const md = (head, rows) =>
  [
    `| ${head.join(" | ")} |`,
    `|${head.map(() => " --- ").join("|")}|`,
    ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`),
  ].join("\n");

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

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

const SUM_HEAD = [
  "tasks",
  "runs",
  "runs_without_tokens",
  "api_calls",
  ...KINDS.map(([name]) => name),
  "total",
  "tool_uses",
  "duration_ms",
  "critical",
  "important",
  "suggestion",
  "dropped",
  "sent_back",
];

/** One row of sums over tasks; a run without a number adds nothing to that sum, and is counted apart. */
function sums(tasks) {
  const runs = tasks.flatMap((t) => t.runs);
  const add = (values) => values.reduce((a, v) => a + (v ?? 0), 0);
  const findings = (key) => add(tasks.map((t) => t.findings?.[key]));
  return [
    tasks.length,
    runs.length,
    runs.filter((r) => r.tokens === null).length,
    add(runs.map((r) => r.api_calls)),
    ...KINDS.map(([name]) => add(runs.map((r) => r.tokens?.[name]))),
    add(runs.map((r) => r.tokens?.total)),
    add(runs.map((r) => r.tool_uses)),
    add(runs.map((r) => r.duration_ms)),
    findings("critical"),
    findings("important"),
    findings("suggestion"),
    findings("dropped"),
    add(tasks.map((t) => t.sent_back)),
  ];
}

function readMetrics(root, issue) {
  const file = join(root, ".orivilo", "metrics", `${issue}.json`);
  if (!existsSync(file)) {
    usage(`no metrics for ${issue}, run collect ${issue} first`);
  }
  const metrics = JSON.parse(readFileSync(file, "utf8"));
  const check = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
  if (!check(metrics)) throw new Error("the metrics did not match metrics.v1");
  return metrics;
}

/** One short line per honest limit of docs/specs/ORV-87/spec.md; report and session both end with it. */
const FOOTER = [
  "The orchestrator's own tokens are not split per task here; the session command shows them per session.",
  "tokens.total is a count of tokens, not a cost: a cache read is not priced like an output token, and the owner's plan is in no source.",
  "Cache write and cache read are counts as the API reported them; why a cache missed is not shown.",
  "Waiting is not measured: CI, the owner's answers and permission prompts are not in duration_ms.",
  "Tokens, rounds and finding counts do not show whether a review was good; defects found after G3 are not counted.",
  "Runs outside the records (Explore, sessions without /ovl) have no task, role or round; the session command lists them.",
  "A resume sent with SendMessage runs without an envelope check; it is attached to its task by agent_id only.",
  "Medians show n; a small batch is a sign, not proof.",
  "Transcripts live outside the repo and can be edited; metrics are never evidence for a gate.",
  "The transcript shape is Claude Code's; a missing field shows as -, never a guessed 0, and an unrecorded version is warned about.",
  "If Claude Code cleans up a transcript before collect runs, that task's numbers are -.",
].join("\n");

export function report(all) {
  const tasks = all.flatMap((m) => m.tasks);
  const byRole = [...new Set(tasks.map((t) => t.role))]
    .sort()
    .map((role) => [role, ...sums(tasks.filter((t) => t.role === role))]);
  const byIssue = all.map((m) => [m.issue, ...sums(m.tasks), m.gates.passed, m.gates.failed]);
  const split = [];
  for (const role of [...new Set(tasks.map((t) => t.role))].sort()) {
    for (const start of ["fresh", "resumed"]) {
      const runs = tasks
        .filter((t) => t.role === role)
        .flatMap((t) => t.runs)
        .filter((r) => r.start === start);
      if (runs.length === 0) continue;
      // The medians use the runs that have both numbers; n says how many that is.
      const counted = runs.filter((r) => r.tokens && r.tool_uses !== null);
      split.push([
        role,
        start,
        runs.length,
        counted.length,
        median(counted.map((r) => r.tokens.total)),
        median(counted.map((r) => r.tool_uses)),
      ]);
    }
  }
  return [
    `# Metrics report: ${all.map((m) => m.issue).join(", ")}`,
    "## By role",
    md(["role", ...SUM_HEAD], byRole),
    "## By issue",
    md(["issue", ...SUM_HEAD, "gates_passed", "gates_failed"], byIssue),
    "## Fresh and resumed runs",
    md(["role", "start", "runs", "n", "median_tokens_total", "median_tool_uses"], split),
    "## Reading notes",
    md(
      ["issue", "skipped_lines", "cc_versions"],
      all.map((m) => [m.issue, m.skipped_lines, m.cc_versions.join(" ")]),
    ),
    FOOTER,
    "",
  ].join("\n\n");
}

/** The agent ids, type and runs of one session, found by glob, with or without run records. */
export function session({ projects, id }) {
  const found = { main: null, dir: null };
  if (existsSync(projects)) {
    for (const folder of readdirSync(projects)) {
      const base = join(projects, folder);
      if (!statSync(base).isDirectory()) continue;
      if (existsSync(join(base, `${id}.jsonl`))) found.main = join(base, `${id}.jsonl`);
      if (existsSync(join(base, id, "subagents"))) found.dir = join(base, id, "subagents");
    }
  }
  if (found.main === null && found.dir === null) return null;
  const lines = new Lines();
  const note = (l) => lines.note(l);
  const mainLines = found.main ? lines.read(found.main) : [];
  const rows = [];
  for (const file of found.dir ? readdirSync(found.dir).sort() : []) {
    const agentId = /^agent-([A-Za-z0-9]+)\.jsonl$/.exec(file)?.[1];
    if (!agentId) continue;
    const facts = mainFacts(mainLines, agentId, note);
    const parsed = readRuns(lines.read(join(found.dir, file)), facts.resumes, note);
    const metaFile = join(found.dir, `agent-${agentId}.meta.json`);
    let type = null;
    try {
      const meta = existsSync(metaFile) ? JSON.parse(readFileSync(metaFile, "utf8")) : null;
      if (AGENT_TYPES.includes(meta?.agentType)) type = meta.agentType;
    } catch {
      lines.skipped += 1;
    }
    parsed.forEach((run, i) => {
      rows.push({
        agentId,
        type,
        ...buildRun(i, run, facts.resumes, facts.reported[i], id),
      });
    });
  }
  rows.sort(
    (a, b) =>
      (a.started_at ?? "").localeCompare(b.started_at ?? "") || a.agentId.localeCompare(b.agentId),
  );
  const mainRun = readRuns(mainLines, [], note)[0];
  return {
    rows,
    main: { calls: mainRun.messages.size, tokens: sumTokens(mainRun.messages) },
    versions: [...lines.versions].sort(),
    skipped: lines.skipped,
  };
}

export function sessionText(id, data) {
  const head = [
    "agent_id",
    "agent_type",
    "start",
    "api_calls",
    ...KINDS.map(([name]) => name),
    "total",
    "notice",
    "tool_uses",
    "duration_ms",
    "started_at",
  ];
  const body = data.rows.map((r) => [
    r.agentId,
    r.type,
    r.start,
    r.api_calls,
    ...KINDS.map(([name]) => r.tokens?.[name]),
    r.tokens?.total,
    r.reported_total,
    r.tool_uses,
    r.duration_ms,
    r.started_at,
  ]);
  const one = data.rows.filter((r) => r.api_calls === 1 && r.tokens && r.reported_total !== null);
  const agree = one.filter((r) => !r.total_mismatch).length;
  const main = data.main.tokens;
  return [
    `# Session ${id}`,
    md(head, body),
    `runs ${data.rows.length}, with a notice ${data.rows.filter((r) => r.reported_total !== null).length}, without tokens ${data.rows.filter((r) => r.tokens === null).length}`,
    `one-call runs ${one.length}, notice within 1% of tokens.total ${agree}`,
    main
      ? `main session, not per task: calls ${data.main.calls}, ${KINDS.map(([name]) => `${name} ${main[name]}`).join(", ")}, total ${main.total}`
      : "main session, not per task: no usage found",
    `skipped lines ${data.skipped}, Claude Code versions ${data.versions.join(" ") || "-"}`,
    "notice is the size of a run's last call, so it differs from tokens.total on every run of more than one call.",
    FOOTER,
    "",
  ].join("\n\n");
}

/** The calendar date on this machine, YYYY-MM-DD: the owner's day, not the UTC day. */
function localDate(now) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * The promoted lessons whose `Check after` date has come and that have no `## Measured after`.
 * Returns {id, checkAfter, daysOver, file} only: no text of a lesson leaves this function.
 */
export function due({ lessons, today }) {
  const out = [];
  for (const file of readdirSync(lessons).sort()) {
    const name = file.match(/^(L-\d{4})-[a-z0-9-]+\.md$/);
    if (!name) continue;
    const text = readFileSync(join(lessons, file), "utf8");
    if (!/^Status:\s*promoted/m.test(text) || /^## Measured after\s*$/m.test(text)) continue;
    const after = text.match(
      /^## Expected saving\s*$(?:(?!^## )[\s\S])*?^- Check after:\s*(\d{4}-\d{2}-\d{2})\s*$/m,
    )?.[1];
    if (after === undefined || Number.isNaN(Date.parse(after)) || after > today) continue;
    const daysOver = Math.round((Date.parse(today) - Date.parse(after)) / 86400000);
    out.push({ id: name[1], checkAfter: after, daysOver, file });
  }
  return out;
}

function usage(message) {
  process.stderr.write(
    `metrics: ${message}\nusage: metrics.mjs collect <ISSUE> [--root <checkout holding .orivilo>] [--projects <folder>]\n       metrics.mjs report <ISSUE...> [--root <folder>] [--out <name>]\n       metrics.mjs session <session id> [--projects <folder>]\n       metrics.mjs due [--lessons <folder>] [--today YYYY-MM-DD]\n`,
  );
  process.exit(2);
}

/** Splits positionals from `--name value` pairs; only the names in `flags` are allowed. */
function parse(rest, flags) {
  const positional = [];
  let i = 0;
  while (i < rest.length && !rest[i].startsWith("--")) positional.push(rest[i++]);
  for (; i < rest.length; i += 2) {
    const name = rest[i].replace(/^--/, "");
    if (!(name in flags) || rest[i + 1] === undefined) usage("unknown or incomplete option");
    flags[name] = rest[i + 1];
  }
  if (flags.root !== undefined && !existsSync(flags.root)) usage("--root is not a folder");
  return positional;
}

function main(argv) {
  const [command, ...rest] = argv;
  const projects = join(homedir(), ".claude", "projects");
  if (command === "collect") {
    const flags = { root: undefined, projects };
    const [issue, ...extra] = parse(rest, flags);
    if (extra.length > 0 || !/^ORV-\d+$/.test(issue ?? ""))
      usage("collect needs an issue key such as ORV-87");
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
  } else if (command === "report") {
    const flags = { root: undefined, out: undefined };
    const issues = parse(rest, flags);
    if (issues.length === 0 || !issues.every((i) => /^ORV-\d+$/.test(i)))
      usage("report needs issue keys such as ORV-87");
    if (flags.out !== undefined && !/^[A-Za-z0-9_-]+$/.test(flags.out))
      usage("--out is a plain name, not a path");
    const root = flags.root ?? recordsRoot(process.cwd());
    const text = report(issues.map((i) => readMetrics(root, i)));
    if (flags.out === undefined) {
      process.stdout.write(text);
    } else {
      const dir = join(root, ".orivilo", "metrics");
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${flags.out}.md`), text);
      process.stdout.write(`wrote ${join(dir, `${flags.out}.md`)}\n`);
    }
  } else if (command === "session") {
    const flags = { projects };
    const [id, ...extra] = parse(rest, flags);
    if (extra.length > 0 || !SAFE_ID.test(id ?? "")) usage("session needs a session id");
    const data = session({ projects: flags.projects, id });
    if (data === null) usage("no transcript found for that session id");
    for (const version of data.versions.filter((v) => !KNOWN_VERSIONS.includes(v))) {
      process.stderr.write(
        `metrics: transcript version ${version} was not recorded on, check the numbers\n`,
      );
    }
    process.stdout.write(sessionText(id, data));
  } else if (command === "due") {
    const flags = { lessons: join(process.cwd(), "docs", "lessons"), today: undefined };
    if (parse(rest, flags).length > 0) usage("due takes no positional argument");
    const today = flags.today ?? localDate(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || Number.isNaN(Date.parse(today)))
      usage("--today is a date such as 2026-11-06");
    if (!existsSync(flags.lessons)) usage("--lessons is not a folder");
    const list = due({ lessons: flags.lessons, today });
    process.stdout.write(
      list.length === 0
        ? "no checks due\n"
        : `${list.map((d) => [d.id, d.checkAfter, d.daysOver, d.file].join("\t")).join("\n")}\n`,
    );
  } else {
    usage("the commands are collect, report, session and due");
  }
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
