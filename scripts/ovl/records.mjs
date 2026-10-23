// Reads the run records under `.orivilo/runs/` and derives the rework state (ORV-81 spec, Records
// and Rework loop step 8). Read-only: only hooks and the close scripts write records.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
 * rounds: builder envelopes that were bound (have agent.json) and started after the first negative
 * verdict, however they ended. allowance: two plus one per owner-grant record. roundsUsed: the
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
  const rounds = first === undefined ? 0 : builders.filter((at) => at > first.at).length;
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
