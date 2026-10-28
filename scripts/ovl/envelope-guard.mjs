// The envelope-guard checks (ORV-81 spec, "The envelope guard adds"). Pure of stdin: the hook in
// .claude/hooks/envelope-guard.mjs feeds it and turns the returned reasons into exit 2.
import {
  existsSync,
  linkSync,
  mkdirSync,
  realpathSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import {
  allTasks,
  branchOf,
  isOpen,
  readIssue,
  reworkState,
  runsDir,
  writeClosed,
} from "./records.mjs";
import { validate } from "./validate.mjs";

const REQUIRED_SKILLS = {
  product: ["discover"],
  "ds-architect": [],
  designer: ["frontend-design", "webapp-testing"],
  builder: ["quality-gate"],
  qa: ["quality-gate", "webapp-testing"],
  reviewer: [],
  release: ["gate-packet"],
  architect: [],
  security: ["quality-gate"],
  research: [],
};

export const ROLE_CONTRACTS = {
  product: ["implementer.v1"],
  "ds-architect": ["implementer.v1"],
  designer: ["implementer.v1", "reviewer.v1"],
  builder: ["implementer.v1"],
  qa: ["qa.v1"],
  reviewer: ["reviewer.v1"],
  release: ["implementer.v1"],
  architect: ["implementer.v1"],
  security: ["reviewer.v1"],
  research: ["implementer.v1"],
};

/** Every role but release: a release envelope has an empty write_set and its G5 packet spans a batch (ORV-138 open question 1). */
const ISSUE_ROLES = new Set([
  "builder",
  "reviewer",
  "qa",
  "designer",
  "security",
  "product",
  "architect",
  "ds-architect",
  "research",
]);
const EMPTY_WRITE_SET = new Set(["reviewer", "qa", "release", "security"]);

/** A designer judges a head (reviewer.v1) and edits no file; any other designer shape writes design files. */
const writesNothing = (env) =>
  EMPTY_WRITE_SET.has(env.role) ||
  (env.role === "designer" && env.report_contract === "reviewer.v1");
const COMMAND = /^(pnpm|node|git|gh|test|grep|jq) \S/;
const COMMAND_FORM = "a command starting with pnpm, node, git, gh, test, grep or jq";
const PATH_FORM = "a path or path:line that exists in the worktree";
const URL_FORM = "an https:// URL";
const JIRA_FORM = "a Jira reference: ORV-<n> comment <id>";

const show = (text) => (text.length > 80 ? `${text.slice(0, 77)}...` : text);

/** True when `ref` (a repo-relative path, optionally with :line) names an existing file or folder in `root`. */
function pathExists(root, ref, lineRequired) {
  const m = /^(.+?)(?::(\d+))?$/.exec(ref);
  if (!m || (lineRequired && !m[2])) return false;
  if (isAbsolute(m[1]) || m[1].split("/").includes("..")) return false;
  const full = resolve(root, m[1]);
  return !relative(root, full).startsWith("..") && existsSync(full);
}

const checkedByOk = (root, ref) =>
  COMMAND.test(ref) ||
  /^https:\/\/\S+$/.test(ref) ||
  /^ORV-\d+ comment \d+$/.test(ref) ||
  pathExists(root, ref, false);

const doneWhenOk = (root, entry) => COMMAND.test(entry) || pathExists(root, entry, true);

/** Why a write_set entry is not allowed, or null. An entry is an exact file or a glob under two fixed folders. */
function writeSetProblem(root, entry) {
  const segments = entry.split("/");
  if (entry === "" || entry.startsWith("/")) return "must be repo-relative, with no leading /";
  if (segments.some((s, i) => s === "" && i < segments.length - 1)) {
    return "must not have empty path segments";
  }
  if (segments.some((s) => s === "." || s === "..")) {
    return "must not contain a . or .. segment";
  }
  const glob = entry.search(/[*?[{(!+@]/);
  if (glob === -1) {
    if (entry.endsWith("/")) return "is a folder, not an exact file path";
    const full = join(root, entry);
    return existsSync(full) && statSync(full).isDirectory()
      ? "is a folder, not an exact file path"
      : null;
  }
  // A glob character before the second folder (a brace list, an extglob) can name several top-level folders.
  const folders = entry.slice(0, glob).split("/").slice(0, -1);
  return folders.length >= 2 ? null : "is a glob that does not sit under two fixed folders";
}

function factProblems(facts) {
  const out = [];
  facts.forEach((fact, i) => {
    if (fact === null || typeof fact !== "object") return;
    const by = fact.checked_by;
    if (typeof by !== "string" || by.trim() === "") {
      out.push(`facts[${i}] ("${show(String(fact.claim ?? ""))}") has no checked_by`);
    }
  });
  return out;
}

function semanticProblems(env, toolInput, root) {
  const out = [];
  const { role } = env;
  if (toolInput.subagent_type !== role) {
    out.push(`envelope role "${role}" and subagent_type "${toolInput.subagent_type}" differ`);
  }
  for (const skill of REQUIRED_SKILLS[role]) {
    if (!env.skills.includes(skill)) out.push(`role ${role} needs the skill "${skill}" in skills`);
  }
  const contracts = ROLE_CONTRACTS[role];
  if (env.report_contract !== undefined && !contracts.includes(env.report_contract)) {
    out.push(
      `report_contract "${env.report_contract}" is not allowed for role ${role} (allowed: ${contracts.join(", ")})`,
    );
  }
  if (writesNothing(env) && env.write_set.length > 0) {
    out.push(`write_set must be empty for role ${role}`);
  }
  if (!writesNothing(env) && env.write_set.length === 0) {
    out.push(`write_set must not be empty for role ${role}`);
  }
  for (const entry of env.write_set) {
    const why = writeSetProblem(root, entry);
    if (why) out.push(`write_set entry "${entry}" ${why}`);
  }
  for (const entry of env.done_when) {
    if (!doneWhenOk(root, entry)) {
      out.push(
        `done_when entry "${show(entry)}" is not a check; allowed: ${COMMAND_FORM}, or a path:line reference to a file in the worktree`,
      );
    }
  }
  env.facts.forEach((fact, i) => {
    if (!checkedByOk(root, fact.checked_by.trim())) {
      out.push(
        `facts[${i}] ("${show(fact.claim)}") checked_by is prose; allowed: ${[COMMAND_FORM, PATH_FORM, URL_FORM, JIRA_FORM].join("; ")}`,
      );
    }
  });
  return out;
}

/** The envelope's issue must be the one the checkout's branch names (<type>/ORV-<n>-<slug>), so a relabelled issue cannot dodge a rework count. */
function branchProblems(env, root) {
  const branch = branchOf(root);
  const key = /^[a-z]+\/(ORV-\d+)-/.exec(branch)?.[1];
  if (key === undefined) {
    return [
      `branch "${branch}" names no issue key (<type>/ORV-<n>-<slug>), so ${env.issue} cannot be checked`,
    ];
  }
  return key === env.issue
    ? []
    : [`envelope issue ${env.issue} differs from the issue ${key} in branch "${branch}"`];
}

/** One open envelope per role in the checkout, all issues together (spec, Envelope guard). */
function openProblems(env, store) {
  const open = allTasks(store).find((t) => isOpen(t) && t.envelope.role === env.role);
  return open
    ? [
        `${env.role} envelope ${open.id} is still open; wait for its report, or close it with: node scripts/ovl/close-envelope.mjs ${open.id}`,
      ]
    : [];
}

function reworkProblems(env, store) {
  const data = readIssue(store, env.issue);
  const state = reworkState(data);
  const out = [];
  if (state.hasVerdict && !env.rework_of) {
    out.push(
      `${env.issue} has a verdict (request_changes or a failed gate): a builder envelope must name rework_of`,
    );
  }
  if (env.rework_of !== undefined && !data.tasks.some((t) => t.id === env.rework_of && t.agent)) {
    out.push(
      `rework_of "${env.rework_of}" must name a bound task of ${env.issue} (one with an agent.json)`,
    );
  }
  if (state.roundsUsed) {
    out.push(
      state.escalated
        ? state.allowance === 2
          ? "Two rework rounds used. Escalate to the owner."
          : `${state.allowance} rework rounds used (two plus the owner's grants). Escalate to the owner.`
        : `${state.allowance} rework rounds used and no verdict has rejected the last one. Get a verdict on the last builder round first (qa, reviewer or the gate); the owner is asked only if it requests changes.`,
    );
  }
  return out;
}

/** The reasons to block this Agent call, or [] after saving its envelope.json. */
export function checkEnvelope(input, { root, store }) {
  const toolInput = input.tool_input;
  if (input.tool_name !== "Agent" || toolInput === null || typeof toolInput !== "object") {
    throw new Error("input is not an Agent tool call");
  }
  if (typeof toolInput.subagent_type !== "string" || toolInput.subagent_type === "") {
    throw new Error("tool_input.subagent_type is missing");
  }

  const reasons = [];
  if (toolInput.run_in_background !== undefined && toolInput.run_in_background !== false) {
    reasons.push("run_in_background is blocked: a background call returns before its report");
  }
  if (toolInput.model !== undefined) {
    reasons.push("model is blocked: the model comes from the agent file");
  }
  if (toolInput.isolation !== undefined) {
    reasons.push("isolation is blocked: the subagent must run in the envelope worktree");
  }

  if (toolInput.subagent_type === "Explore") return reasons;

  let env;
  try {
    env = JSON.parse(String(toolInput.prompt ?? "").trim());
  } catch {
    env = undefined;
  }
  if (env === null || typeof env !== "object" || Array.isArray(env)) {
    reasons.push(
      "the prompt is not one envelope.v1 JSON object; only the Explore agent runs without an envelope",
    );
    return reasons;
  }

  if (Array.isArray(env.facts)) reasons.push(...factProblems(env.facts));
  const { ok, errors } = validate("envelope.v1", env);
  if (!ok) {
    reasons.push(...errors.map((e) => `envelope.v1 ${e}`));
    return reasons;
  }

  reasons.push(...semanticProblems(env, toolInput, root));
  if (toolInput.cwd !== undefined && toolInput.cwd !== env.worktree) {
    reasons.push(`cwd "${toolInput.cwd}" must equal the envelope worktree "${env.worktree}"`);
  }
  let worktree = env.worktree;
  try {
    worktree = realpathSync(env.worktree);
  } catch {
    // A worktree that does not exist cannot be this checkout; the comparison below reports it.
  }
  if (worktree !== root) reasons.push(`worktree "${env.worktree}" must be this checkout (${root})`);
  if (ISSUE_ROLES.has(env.role)) reasons.push(...branchProblems(env, root));
  reasons.push(...openProblems(env, store));
  if (env.role === "builder") reasons.push(...reworkProblems(env, store));

  const dir = join(runsDir(store), env.issue, env.task_id);
  if (existsSync(join(dir, "envelope.json"))) {
    reasons.push(`task_id "${env.task_id}" already has an envelope; use a new task_id`);
  }
  if (reasons.length > 0) return reasons;

  return saveEnvelope(store, env, dir);
}

/**
 * Saves envelope.json whole (written aside, then linked into place, so no reader sees half of it),
 * then looks again for another open envelope of the role. Two calls made at the same moment both
 * pass the first check; after both have saved, each sees the other and closes its own as denied,
 * so neither runs. A call that saved and looked before the other saved is the one that runs.
 * Returns the reasons to block, [] when this envelope is the only open one of its role.
 */
function saveEnvelope(store, env, dir) {
  mkdirSync(dir, { recursive: true });
  const aside = join(dir, `envelope.json.${process.pid}.tmp`);
  writeFileSync(aside, `${JSON.stringify(env, null, 2)}\n`, { flag: "wx" });
  try {
    linkSync(aside, join(dir, "envelope.json"));
  } finally {
    unlinkSync(aside);
  }
  const task = { issue: env.issue, id: env.task_id };
  let rival;
  try {
    rival = allTasks(store).find(
      (t) => t.id !== env.task_id && isOpen(t) && t.envelope.role === env.role,
    );
  } catch (error) {
    writeClosed(store, task, "denied");
    throw error;
  }
  if (rival === undefined) return [];
  writeClosed(store, task, "denied");
  return [
    `${env.role} envelope ${rival.id} was dispatched at the same moment; ${env.task_id} is closed as denied, dispatch it again after ${rival.id} reports`,
  ];
}
