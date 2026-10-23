// The result-recorder checks (ORV-81 spec, Hooks and "The recorder applies these rules"). The hook in
// .claude/hooks/result-recorder.mjs feeds it every event and turns the returned reasons into exit 2.
//   SubagentStart      binds the subagent to its open envelope (agent.json)
//   SubagentStop       sends a bad report back to the subagent (exit 2); writes no record
//   PostToolUse Agent  records result.json (and qa.json), or closes the envelope as no_report
//   PostToolUse Bash   records a gate record when the main session ran the quality gate
//   PostToolUseFailure Bash   the same for a gate run that exited non-zero (a failed gate is a verdict)
//   PostToolUseFailure Agent  closes a bound open envelope as no_report when its Agent call failed
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROLE_CONTRACTS } from "./envelope-guard.mjs";
import {
  allTasks,
  branchOf,
  isOpen,
  readIssue,
  reworkState,
  runsDir,
  taskDir,
  writeClosed,
  writeJson,
} from "./records.mjs";
import { validate } from "./validate.mjs";

/** Contracts only some agent types may send. */
const OWNERS = { "qa.v1": ["qa"], "reviewer.v1": ["reviewer", "designer"] };
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** A Result cell with one of these words makes the AC row visual (spec, qa.v1 recorder rules). */
const VISUAL = /layout|spacing|gap|align|centre|center|colou?r|overlap|motion|position/i;
/** computed_style evidence: `<story id> <selector> <css property>`. */
const STYLE_REF = /^[a-z0-9-]+--[a-z0-9-]+ \S.* [a-z-]+$/;

const nonblank = (v) => typeof v === "string" && v.trim() !== "";
const contractOf = (env) => env.report_contract ?? ROLE_CONTRACTS[env.role][0];
const screenshotsDir = (env) => `.orivilo/runs/${env.issue}/${env.task_id}/screenshots/`;
const git = (root, args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

function field(input, name, what = "a string") {
  if (!nonblank(input[name])) throw new Error(`hook input has no ${name} (${what})`);
  return input[name];
}

/** The screenshot problem for `path`, or null when it is a PNG under the task's own screenshots folder. */
function pngProblem(root, env, path) {
  const dir = screenshotsDir(env);
  if (!path.startsWith(dir) || !/^[A-Za-z0-9._-]+$/.test(path.slice(dir.length))) {
    return `screenshot ${path} is outside ${dir}`;
  }
  if (!path.endsWith(".png")) return `screenshot ${path} is not a PNG file`;
  const full = join(root, path);
  if (!existsSync(full)) return `screenshot ${path} does not exist`;
  return readFileSync(full).subarray(0, 8).equals(PNG_SIGNATURE)
    ? null
    : `screenshot ${path} is not a PNG file`;
}

function codeExists(root, head, file, line) {
  if (!nonblank(file) || !Number.isInteger(line) || file.startsWith("/") || file.includes("..")) {
    return false;
  }
  try {
    return git(root, ["show", `${head}:${file}`]).split("\n").length >= line;
  } catch {
    return false;
  }
}

const styleOk = (e) => STYLE_REF.test(e.ref) && nonblank(e.observed);

/** True when the finding's evidence can be run or opened again (spec, reviewer.v1 rules). */
function runnable(root, env, head, f) {
  const e = f.evidence;
  if (e.kind === "command") return nonblank(e.ref) && nonblank(e.observed);
  if (e.kind === "screenshot") return pngProblem(root, env, e.ref) === null;
  if (e.kind === "computed_style") return styleOk(e);
  return e.kind === "code" && codeExists(root, head, f.file, f.line);
}

/** The reviewer.v1 rules, shared by qa.v1: unprovable findings move to dropped, then the verdict is checked. */
function findingProblems(root, env, report) {
  const kept = report.findings.filter((f) => runnable(root, env, report.head_sha, f));
  const moved = report.findings.filter((f) => !kept.includes(f));
  const problems = [];
  const heavy = kept.filter((f) => f.severity !== "Suggestion");
  if (report.verdict === "approve" && kept.some((f) => f.severity === "Critical")) {
    problems.push("an approve with a kept Critical finding is invalid");
  }
  if (report.verdict === "request_changes" && heavy.length === 0) {
    problems.push(
      `request_changes needs at least one kept Critical or Important finding with re-executable evidence${moved.length ? ` (${moved.length} finding(s) moved to dropped)` : ""}`,
    );
  }
  const { dropped: earlier = [], ...rest } = report;
  return { problems, report: { ...rest, findings: kept }, dropped: [...earlier, ...moved] };
}

/** The rows of the first table in `docs/specs/<issue>/spec.md` whose header starts with `#`, as {row, result}. */
function specRows(root, issue) {
  const lines = readFileSync(join(root, "docs", "specs", issue, "spec.md"), "utf8").split("\n");
  const start = lines.findIndex((l) => /^\|\s*#\s*\|/.test(l));
  const rows = [];
  for (const line of start < 0 ? [] : lines.slice(start + 2)) {
    if (!line.startsWith("|")) break;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (/^\d+$/.test(cells[0])) rows.push({ row: Number(cells[0]), result: cells[3] ?? "" });
  }
  if (rows.length === 0)
    throw new Error(`docs/specs/${issue}/spec.md has no acceptance criteria table`);
  return rows;
}

/** The gate report in the checkout, read as the gate record needs it. Throws on a missing or malformed file. */
function gateReport(root) {
  const r = JSON.parse(readFileSync(join(root, ".quality-gate", "report.json"), "utf8"));
  const ok =
    typeof r.ok === "boolean" &&
    typeof r.stepsSource === "string" &&
    typeof r.git?.sha === "string" &&
    typeof r.git?.dirty === "boolean";
  if (!ok) throw new Error(".quality-gate/report.json lacks ok, stepsSource, git.sha or git.dirty");
  return r;
}

/** Storybook's title for a changed stories file: the default export's `title`, else its path under src/. */
function storyTitle(root, head, file) {
  const source = git(root, ["show", `${head}:${file}`]);
  const explicit = /export default[\s\S]*?\btitle:\s*(["'`])(.+?)\1/.exec(source)?.[2];
  if (explicit) return explicit;
  const parts = file
    .slice(file.indexOf("/src/") + 5)
    .replace(/\.stories\.tsx?$/, "")
    .split("/");
  if (parts.length > 1 && parts.at(-1) === parts.at(-2)) parts.pop();
  return parts.join("/");
}

const storyPrefix = (title) =>
  `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}--`;

function screenshotProblems(root, env, report) {
  const out = [];
  const dir = screenshotsDir(env);
  for (const s of report.screenshots) {
    const problem = pngProblem(root, env, s.path);
    if (problem) out.push(problem);
    else if (s.path !== `${dir}${s.story}-${s.mode}.png`) {
      out.push(`screenshot ${s.path} must be named ${dir}${s.story}-${s.mode}.png`);
    }
  }
  return out;
}

function approveProblems(root, report) {
  const out = [];
  if (report.quality_gate.head_sha !== report.head_sha) {
    out.push("quality_gate.head_sha differs from head_sha: the evidence is stale");
  }
  const gate = gateReport(root);
  if (gate.git.sha !== report.head_sha) {
    out.push(
      `.quality-gate/report.json is for ${gate.git.sha}, not head_sha: the evidence is stale`,
    );
  }
  if (gate.git.dirty)
    out.push(".quality-gate/report.json is dirty: it ran with uncommitted changes");
  if (gate.stepsSource !== "gate") {
    out.push(
      `.quality-gate/report.json has stepsSource "${gate.stepsSource}"; an approve needs "gate"`,
    );
  }
  if (!gate.ok) out.push(".quality-gate/report.json has ok: false");
  if (gate.partial === true) {
    out.push(".quality-gate/report.json is partial (--only); an approve needs a full gate run");
  }

  const files = git(root, ["diff", "--name-only", `origin/develop...${report.head_sha}`])
    .split("\n")
    .filter((f) => f.endsWith(".stories.tsx"));
  for (const file of files) {
    const title = storyTitle(root, report.head_sha, file);
    const prefix = storyPrefix(title);
    const shots = report.screenshots.filter((s) => s.story.startsWith(prefix));
    if (shots.length === 0) {
      out.push(
        `no screenshot for a story of "${title}" (${prefix}*) changed in ${file}: needs light and dark`,
      );
    }
    for (const story of new Set(shots.map((s) => s.story))) {
      for (const mode of ["light", "dark"]) {
        if (!shots.some((s) => s.story === story && s.mode === mode)) {
          out.push(`story ${story} has no ${mode} screenshot`);
        }
      }
    }
  }
  return out;
}

/** The problem with one ac evidence item, or null. Screenshots and computed styles are checked like a finding's. */
function acEvidenceProblem(root, env, e) {
  if (e.kind === "screenshot") return pngProblem(root, env, e.ref);
  if (e.kind === "computed_style" && !styleOk(e)) {
    return `computed_style evidence needs a ref "<story-id> <selector> <property>" and an observed value`;
  }
  return null;
}

function qaProblems(root, env, report) {
  const out = [];
  const specRowList = specRows(root, env.issue);
  const seen = new Set();
  for (const ac of report.ac) {
    if (seen.has(ac.row)) out.push(`ac row ${ac.row} appears more than once`);
    seen.add(ac.row);
    if (!specRowList.some((s) => s.row === ac.row)) {
      out.push(`ac row ${ac.row} is not a row of the spec`);
    }
  }
  for (const { row, result } of specRowList) {
    const ac = report.ac.find((a) => a.row === row);
    if (!ac) {
      out.push(`ac has no entry for spec row ${row}`);
      continue;
    }
    if (VISUAL.test(result) && !ac.visual) {
      out.push(`ac row ${row} is visual by the spec's keyword list; visual cannot be false`);
    }
    if (report.verdict === "approve" && ac.status === "fail") {
      out.push(`ac row ${row} is fail; an approve needs every row pass or owner_verify`);
    }
    if (ac.status === "owner_verify" && !ac.evidence.some((e) => e.kind === "screenshot")) {
      out.push(`ac row ${row} is owner_verify; its evidence needs a screenshot`);
    }
    for (const e of ac.evidence) {
      const problem = acEvidenceProblem(root, env, e);
      if (problem) out.push(`ac row ${row}: ${problem}`);
    }
  }
  out.push(...screenshotProblems(root, env, report));
  if (report.verdict === "approve") out.push(...approveProblems(root, report));
  return out;
}

/** Judges one final message for one envelope: {problems, report, dropped}. Problems are what to send back. */
function judge(root, task, text) {
  const env = task.envelope;
  const contract = contractOf(env);
  let report;
  try {
    report = JSON.parse(String(text).trim());
  } catch {
    report = undefined;
  }
  if (report === null || typeof report !== "object" || Array.isArray(report)) {
    return {
      problems: [
        `the final message must be exactly one JSON object in ${contract} and nothing else`,
      ],
    };
  }
  for (const [name, types] of Object.entries(OWNERS)) {
    if (name !== contract && validate(name, report).ok) {
      return {
        problems: [
          `this is a ${name} report but the envelope's contract is ${contract}; ${name} comes only from ${types.join(" or ")}`,
        ],
      };
    }
  }
  const { ok, errors } = validate(contract, report);
  if (!ok) return { problems: errors.map((e) => `${contract} ${e}`) };
  if (report.task_id !== env.task_id) {
    return { problems: [`report task_id "${report.task_id}" must be "${env.task_id}"`] };
  }
  if (contract === "implementer.v1") return { problems: [], report, dropped: [] };
  const judged = findingProblems(root, env, report);
  if (contract === "qa.v1") judged.problems.push(...qaProblems(root, env, report));
  return judged;
}

function onStart(input, { root }) {
  const agentId = field(input, "agent_id");
  const agentType = field(input, "agent_type");
  if (agentType === "Explore") return [];
  const open = allTasks(root).filter(
    (t) => isOpen(t) && t.agent === undefined && t.envelope.role === agentType,
  );
  if (open.length !== 1) {
    return [`${open.length} open unbound ${agentType} envelopes; binding needs exactly one`];
  }
  writeJson(join(taskDir(root, open[0].issue, open[0].id), "agent.json"), {
    agent_id: agentId,
    agent_type: agentType,
    started_at: new Date().toISOString(),
  });
  return [];
}

/** The open, bound envelope of `agentId`, or the reason there is none. */
function boundTask(root, agentId) {
  const task = allTasks(root).find((t) => t.agent?.agent_id === agentId);
  if (!task) return { reason: `no envelope is bound to agent ${agentId}` };
  return isOpen(task) ? { task } : { reason: `envelope ${task.id} is already closed` };
}

function onStop(input, { root }) {
  const active = input.stop_hook_active === true;
  try {
    const agentId = field(input, "agent_id");
    if (field(input, "agent_type") === "Explore") return [];
    const { task, reason } = boundTask(root, agentId);
    const problems = task
      ? judge(root, task, field(input, "last_assistant_message", "the final message")).problems
      : [reason];
    // A subagent sent back once cannot be sent back again: it stops, and nothing is recorded.
    return active ? [] : problems;
  } catch (error) {
    if (active) return [];
    throw error;
  }
}

function onAgent(input, { root }) {
  if (input.tool_input?.subagent_type === "Explore") return [];
  const response = input.tool_response;
  const { task, reason } = boundTask(root, response?.agentId);
  if (!task) return [reason];
  const text = (response.content ?? [])
    .filter((c) => c?.type === "text")
    .map((c) => c.text)
    .join("\n");
  const judged = judge(root, task, text);
  if (judged.problems.length > 0) {
    writeClosed(root, task, "no_report");
    return [...judged.problems, `${task.id} closed as no_report`];
  }
  const contract = contractOf(task.envelope);
  const result = {
    contract,
    agent_id: task.agent.agent_id,
    agent_type: task.agent.agent_type,
    round: reworkState(readIssue(root, task.issue)).rounds,
    recorded_at: new Date().toISOString(),
    report: judged.report,
    dropped: judged.dropped,
  };
  const dir = taskDir(root, task.issue, task.id);
  writeJson(join(dir, "result.json"), result);
  if (contract === "qa.v1") writeJson(join(dir, "qa.json"), result);
  return [];
}

/** True when a segment of the command runs the quality gate (after whitespace is collapsed). */
const runsGate = (command) =>
  command
    .replace(/\s+/g, " ")
    .split(/\s*(?:&&|\|\||;|\|)\s*/)
    .some((segment) =>
      /^(?:node scripts\/quality-gate\.mjs|pnpm (?:run )?quality-gate)(?: |$)/.test(segment),
    );

/**
 * Records the main session's gate run. `input` is a PostToolUse, or a PostToolUseFailure: a failing
 * gate exits 1, so Claude Code reports it as a tool failure and a failed run is a verdict.
 */
function onBash(input, { root }) {
  // A gate run inside a subagent is a builder's own TDD run: no record, no verdict (AC 55).
  if (input.agent_id !== undefined || !runsGate(String(input.tool_input?.command ?? ""))) return [];
  if (input.hook_event_name === "PostToolUseFailure" && input.is_interrupt === true) return [];
  const report = gateReport(root);
  // A partial run (--only) is not valid evidence, so it is not a verdict either.
  if (report.partial === true) return [];
  if (typeof input.duration_ms !== "number") throw new Error("hook input has no duration_ms");
  // The report must be this command's own: written after it started, for the commit now checked out.
  // It started no earlier than the command and finished no later than now (a future time is no proof).
  const commandStart = Date.now() - input.duration_ms;
  const started = Date.parse(report.startedAt);
  const finished = Date.parse(report.finishedAt);
  if (!(commandStart <= started && started <= finished && finished <= Date.now())) return [];
  if (report.git.sha !== git(root, ["rev-parse", "HEAD"]).trim()) return [];
  const issue = /^[a-z]+\/(ORV-\d+)-/.exec(branchOf(root))?.[1];
  if (issue === undefined)
    throw new Error("the branch names no issue key, so the gate record has no issue");
  const recordedAt = new Date().toISOString();
  writeJson(join(runsDir(root), issue, "gates", `${recordedAt}.json`), {
    ok: report.ok,
    sha: report.git.sha,
    dirty: report.git.dirty,
    steps_source: report.stepsSource,
    recorded_at: recordedAt,
  });
  return [];
}

/** A failed or interrupted Agent call never reaches PostToolUse: its bound open envelope is closed here. */
function onAgentFailure(input, { root }) {
  if (input.tool_input?.subagent_type === "Explore") return [];
  let env;
  try {
    env = JSON.parse(String(input.tool_input?.prompt ?? "").trim());
  } catch {
    return [];
  }
  const task = allTasks(root).find(
    (t) => t.issue === env?.issue && t.id === env?.task_id && t.envelope.role === env?.role,
  );
  if (task === undefined || task.agent === undefined || !isOpen(task)) return [];
  writeClosed(root, task, "no_report");
  return [`the Agent call for ${task.id} failed; ${task.id} closed as no_report`];
}

/** The reasons to block (exit 2) for one hook input, after doing the recording for its event. */
export function checkRecorder(input, ctx) {
  if (input.hook_event_name === "SubagentStart") return onStart(input, ctx);
  if (input.hook_event_name === "SubagentStop") return onStop(input, ctx);
  if (input.hook_event_name === "PostToolUse" && input.tool_name === "Agent") {
    return onAgent(input, ctx);
  }
  if (input.hook_event_name === "PostToolUse" && input.tool_name === "Bash") {
    return onBash(input, ctx);
  }
  if (input.hook_event_name === "PostToolUseFailure" && input.tool_name === "Bash") {
    return onBash(input, ctx);
  }
  if (input.hook_event_name === "PostToolUseFailure" && input.tool_name === "Agent") {
    return onAgentFailure(input, ctx);
  }
  throw new Error(
    `result-recorder does not handle ${input.hook_event_name} ${input.tool_name ?? ""}`,
  );
}
