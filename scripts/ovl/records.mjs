// Reads the run records under `.orivilo/runs/` and derives the rework state (ORV-81 spec, Records
// and Rework loop step 8). Reads everywhere; the one writer, writeJson, creates a file exclusively and
// is called only by hooks, close-envelope.mjs and doctor.mjs.
import {
  existsSync,
  linkSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";

export const runsDir = (root) => join(root, ".orivilo", "runs");

const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : undefined);

function time(value, what) {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) throw new Error(`${what} has no valid time`);
  return ms;
}

/** Every record of one issue: its tasks, gate records and the number of owner-grant records. */
export function readIssue(root, issue) {
  const dir = join(runsDir(root), issue);
  const data = { tasks: [], gates: [], grants: 0 };
  if (!existsSync(dir)) return data;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name === "gates") {
      for (const f of readdirSync(join(dir, "gates")).filter((n) => n.endsWith(".json"))) {
        data.gates.push(readJson(join(dir, "gates", f)));
      }
    } else if (entry.isDirectory()) {
      const task = join(dir, entry.name);
      data.tasks.push({
        id: entry.name,
        envelope: readJson(join(task, "envelope.json")),
        agent: readJson(join(task, "agent.json")),
        result: readJson(join(task, "result.json")),
        closed: readJson(join(task, "closed.json")),
      });
    } else if (/^owner-grant-\d+\.json$/.test(entry.name)) {
      data.grants += 1;
    }
  }
  return data;
}

/**
 * A verdict is a qa.v1 or reviewer.v1 result, or a failed gate record from a real gate run
 * (a stub run is never a verdict). Returns {at, negative} for each.
 */
function verdicts(data) {
  const events = [];
  for (const t of data.tasks) {
    const r = t.result;
    if (r && (r.contract === "qa.v1" || r.contract === "reviewer.v1")) {
      events.push({
        at: time(r.recorded_at, `result of ${t.id}`),
        negative: r.report?.verdict === "request_changes",
      });
    }
  }
  for (const g of data.gates) {
    if (g.steps_source === "gate" && g.ok === false) {
      events.push({ at: time(g.recorded_at, "a gate record"), negative: true });
    }
  }
  return events.sort((a, b) => a.at - b.at);
}

/**
 * {hasVerdict, rounds, allowance, roundsUsed, escalated}. hasVerdict: a negative verdict exists.
 * rounds: bound builder envelopes (have agent.json), however they ended, that count as a rework round
 * (rule rework-1, ORV-138): a builder counts only when a negative verdict was recorded after the start
 * of the latest earlier bound builder and before it started. The first builder never counts, and a
 * builder that follows another builder with no verdict between them is a continuation, not a round.
 * allowance: two plus one per owner-grant record. roundsUsed: the
 * allowance is spent, so no builder envelope may be saved. escalated: roundsUsed and the latest
 * negative verdict is newer than the last bound builder, so the owner is asked; a later approve does
 * not undo it. This is the one place that decides; envelope-guard blocks on roundsUsed and
 * owner-grant writes a grant only when escalated.
 */
export function reworkState(data) {
  const events = verdicts(data);
  const negatives = events.filter((e) => e.negative);
  const first = negatives[0];
  const builders = data.tasks
    .filter((t) => t.envelope?.role === "builder" && t.agent)
    .map((t) => time(t.agent.started_at, `agent.json of ${t.id}`));
  const sorted = [...builders].sort((a, b) => a - b);
  const rounds = sorted.filter(
    (at, i) => i > 0 && negatives.some((n) => n.at > sorted[i - 1] && n.at < at),
  ).length;
  const allowance = 2 + data.grants;
  const roundsUsed = first !== undefined && rounds >= allowance;
  const lastBuilder = Math.max(-Infinity, ...builders);
  return {
    hasVerdict: first !== undefined,
    rounds,
    allowance,
    roundsUsed,
    escalated: roundsUsed && negatives.at(-1).at > lastBuilder,
  };
}

/** The issue keys, under `.orivilo/runs/`, that are escalated to the owner. */
export function escalatedIssues(root) {
  const dir = runsDir(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /^ORV-\d+$/.test(name))
    .filter((issue) => reworkState(readIssue(root, issue)).escalated);
}

/**
 * Creates `file` with `value` as JSON, exclusively: a record that exists is never rewritten. The JSON
 * is written aside under a unique name, then linked into place, so a reader never sees half a record
 * (the aside name does not end in `.json`, so a gate listing skips it).
 */
export function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  const aside = `${file}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(aside, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  try {
    linkSync(aside, file);
  } finally {
    unlinkSync(aside);
  }
}

export const taskDir = (root, issue, taskId) => join(runsDir(root), issue, taskId);

/** Every task of every issue in the checkout, each with its `issue`. */
export function allTasks(root) {
  const dir = runsDir(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /^ORV-\d+$/.test(name))
    .flatMap((issue) => readIssue(root, issue).tasks.map((t) => ({ ...t, issue })))
    .filter((t) => t.envelope !== undefined);
}

/** Open: an envelope with neither a result nor a closed record. */
export const isOpen = (t) => t.result === undefined && t.closed === undefined;

/** Closes an envelope with `closed.json` (the reason is denied, no_report, abandoned or pre_a3). */
export function writeClosed(root, task, reason, extra = {}) {
  writeJson(join(taskDir(root, task.issue, task.id), "closed.json"), {
    reason,
    closed_at: new Date().toISOString(),
    ...extra,
  });
}

/** The checkout's current branch name ("" when detached). */
export const branchOf = (root) =>
  execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();

/**
 * Every git worktree of the repo that `root` belongs to, as {path, branch}: the real path, and the
 * branch name ("" when the head is detached). A worktree whose folder is gone is left out.
 */
export function worktreesOf(root) {
  const listing = execFileSync("git", ["worktree", "list", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });
  const found = [];
  for (const block of listing.split("\n\n")) {
    const lines = block.split("\n");
    const path = lines.find((l) => l.startsWith("worktree "))?.slice("worktree ".length);
    if (path === undefined || lines.includes("bare")) continue;
    const ref = lines.find((l) => l.startsWith("branch "))?.slice("branch ".length) ?? "";
    try {
      found.push({ path: realpathSync(path), branch: ref.replace(/^refs\/heads\//, "") });
    } catch {
      // The folder is gone but git still lists it: it cannot hold an envelope.
    }
  }
  return found;
}
