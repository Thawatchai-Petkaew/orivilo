#!/usr/bin/env node
// ORV-98: g3-check, the guard on a Jira move to "G3 PR review" (spec ORV-98 v1.1). Two stages:
//   call stage     `g3Check()` below, run by .claude/hooks/g3-check.mjs from the session's checkout. It reads
//                  the tool input and scripts/ovl/jira-transitions.json, makes no network call and reads no
//                  record. It allows every known move to another status and blocks an unknown id or name.
//   records stage  `node <develop export>/scripts/ovl/g3-check.mjs <ISSUE>`, run only for a G3 move. It
//                  finds the issue's latest merged PR into develop and judges it with merge-check, so a
//                  G3 move rests on the checks a merge rests on. It writes nothing. Every non-zero exit is 2.
// Tool input, PR titles and check text are untrusted: stderr names rules, keys, PR numbers and SHAs, each
// cut at 200 characters with control characters removed.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ExportError, ensureDevelopExport } from "./develop-export.mjs";
import { runMergeCheck } from "./merge-check.mjs";

const TRANSITIONS = join(dirname(fileURLToPath(import.meta.url)), "jira-transitions.json");
const LIST_NAME = "scripts/ovl/jira-transitions.json";
const G3_STATUS = "G3 PR review";
const TOOL = /^mcp__.*[Aa]tlassian.*__(transitionJiraIssue|executeWrite|executeDestructive)$/;
const KEY = /^ORV-[0-9]+$/;
const SHA = /^[0-9a-f]{40}$/;
const PROBE_KEY = "ORV-0";
const LIST_LIMIT = 100;
/** Spawn bounds in ms; the hook timeout in .claude/settings.json (300 s) stays above their sum. */
export const GH_LIST_TIMEOUT_MS = 30_000;
export const RECORDS_TIMEOUT_MS = 120_000;
const USAGE = "usage: g3-check.mjs <ISSUE> (a key like ORV-123)";

/** Untrusted text made safe to print: control characters removed, cut at 200 characters. */
const clean = (value) =>
  String(value)
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    .slice(0, 200);

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value) => typeof value === "string" && value !== "";

/** The id list, validated. Throws (fail closed) when it cannot be read or holds a bad entry. */
function loadTransitions(file) {
  let list;
  try {
    list = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error(`the id list ${LIST_NAME} cannot be read as JSON`);
  }
  const entries =
    isObject(list) && isObject(list.transitions) ? Object.entries(list.transitions) : [];
  const names = new Set();
  const valid =
    entries.length > 0 &&
    entries.every(
      ([, e]) =>
        isObject(e) &&
        nonEmpty(e.name) &&
        nonEmpty(e.to) &&
        !names.has(e.name) &&
        names.add(e.name),
    ) &&
    entries.some(([, e]) => e.to === G3_STATUS);
  if (!valid) {
    throw new Error(
      `the id list ${LIST_NAME} must hold named transitions with unique names and one that goes to ${G3_STATUS}`,
    );
  }
  return new Map(entries);
}

/**
 * The transition a call names: `{id, entry}`, or `{reason}` when it names none, an unknown one, or two
 * that differ. `fields` holds `transitionId` and `transitionName`.
 */
function resolve(fields, transitions) {
  const hasId = fields.transitionId !== undefined;
  const hasName = fields.transitionName !== undefined;
  const id = fields.transitionId;
  const name = fields.transitionName;
  const idOk =
    (typeof id === "string" && /^[0-9]+$/.test(id)) || (Number.isSafeInteger(id) && id >= 0);
  if (
    (!hasId && !hasName) ||
    (hasId && !idOk && typeof id !== "string") ||
    (hasName && typeof name !== "string")
  ) {
    return {
      reason:
        "the call names no transition (transitionId or transitionName) that g3-check can judge",
    };
  }
  let byId = null;
  if (hasId) {
    byId = String(id);
    if (!transitions.has(byId)) return { reason: `the transition id is not in ${LIST_NAME}` };
  }
  let byName = null;
  if (hasName) {
    byName = [...transitions].find(([, e]) => e.name === name)?.[0] ?? null;
    if (byName === null) return { reason: `the transition name is not in ${LIST_NAME}` };
  }
  if (byId !== null && byName !== null && byId !== byName) {
    return { reason: "the transition id and the transition name name different transitions" };
  }
  const resolved = byId ?? byName;
  return { id: resolved, entry: transitions.get(resolved) };
}

/** `{key, fields}` of the transition a call carries, or null when the call is not a transition. */
function transitionOf(input) {
  const toolInput = input.tool_input;
  if (!isObject(toolInput)) throw new Error("tool_input is missing");
  const tool = TOOL.exec(input.tool_name ?? "")?.[1];
  if (tool === undefined) throw new Error("tool_name is not an Atlassian transition tool");
  const inputs = tool === "transitionJiraIssue" ? toolInput : toolInput.inputs;
  const named = tool === "transitionJiraIssue" || toolInput.name === "transitionJiraIssue";
  const holdsMove =
    isObject(inputs) && (inputs.transitionId !== undefined || inputs.transitionName !== undefined);
  if (!named && !holdsMove) return null;
  const fields = isObject(inputs) ? inputs : {};
  return { key: fields.issueIdOrKey, fields };
}

/** The reasons from the records stage (a process run from the develop export), or throws. */
function recordsStage(input, issue, env) {
  let exported;
  try {
    exported = ensureDevelopExport({ cwd: input.cwd, env });
  } catch (error) {
    if (error instanceof ExportError && error.bootstrap) {
      return [
        "develop has no scripts/ovl/merge-check.mjs yet, so the owner moves the issue in the Jira web UI",
      ];
    }
    throw error;
  }
  const script = join(exported.dir, "scripts", "ovl", "g3-check.mjs");
  if (!existsSync(script)) {
    return [
      "develop has no scripts/ovl/g3-check.mjs yet, so the owner moves the issue in the Jira web UI",
    ];
  }
  const r = spawnSync(process.execPath, [script, issue], {
    cwd: input.cwd,
    env,
    encoding: "utf8",
    timeout: RECORDS_TIMEOUT_MS,
  });
  if (r.error) throw new Error(`the records stage could not run (${r.error.code ?? "error"})`);
  if (r.status === 0) return [];
  const lines = r.stderr
    .split("\n")
    .map((line) => line.replace(/^- /, "").trim())
    .filter((line) => line !== "" && line !== "g3-check blocked:");
  const failed = /^g3-check failed closed: (.*)$/.exec(lines[0] ?? "");
  if (failed) throw new Error(clean(failed[1]));
  return lines.length > 0 ? lines.map(clean) : [`the records stage exited ${r.status}`];
}

/**
 * The call stage as a `check` for runHook/handle. `transitionsPath` is a function parameter for tests only.
 */
export function g3Check({ transitionsPath = TRANSITIONS, env = process.env } = {}) {
  return (input) => {
    const move = transitionOf(input);
    if (move === null) return [];
    const resolved = resolve(move.fields, loadTransitions(transitionsPath));
    if (resolved.reason) return [resolved.reason];
    if (resolved.entry.to !== G3_STATUS) return [];
    if (typeof move.key !== "string" || !KEY.test(move.key)) {
      return [`a move to ${G3_STATUS} names the issue by its key ORV-<n>`];
    }
    if (move.key === PROBE_KEY)
      return [`${PROBE_KEY} is the ovl-doctor probe, so the move is blocked`];
    return recordsStage(input, move.key, env);
  };
}

/**
 * `gh pr list` for the issue: the entries as gh reports them. The search list (all states, found through
 * GitHub's search index) or, without a search, the open list. Throws when gh fails, is too slow or prints
 * another shape.
 */
function listPrs(issue, { cwd, env, search, timeoutMs }) {
  const label = search ? "search" : "open";
  const r = spawnSync(
    "gh",
    [
      "pr",
      "list",
      "--base",
      "develop",
      ...(search ? ["--state", "all", "--search", `${issue} in:title`] : ["--state", "open"]),
      "--limit",
      String(LIST_LIMIT),
      "--json",
      "number,state,title,headRefName,headRefOid,mergedAt",
    ],
    { cwd, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: timeoutMs },
  );
  if (r.error?.code === "ETIMEDOUT") throw new Error(`gh pr list (${label}) timed out`);
  if (r.error) throw new Error(`gh could not run (${r.error.code ?? "error"})`);
  if (r.status !== 0) throw new Error(`gh pr list exited ${r.status}`);
  let list;
  try {
    list = JSON.parse(r.stdout);
  } catch {
    throw new Error("gh pr list printed text that is not JSON");
  }
  const ok =
    Array.isArray(list) &&
    list.every(
      (p) =>
        isObject(p) &&
        Number.isInteger(p.number) &&
        typeof p.state === "string" &&
        typeof p.title === "string" &&
        typeof p.headRefName === "string" &&
        SHA.test(p.headRefOid) &&
        (p.mergedAt === null || typeof p.mergedAt === "string"),
    );
  if (!ok) throw new Error("gh pr list printed a list in an unexpected shape");
  return list;
}

/** The records stage: `{code, stderr}` for `argv` (the issue key). */
export function runG3Check(
  argv,
  { cwd = process.cwd(), env = process.env, ghTimeoutMs = GH_LIST_TIMEOUT_MS } = {},
) {
  try {
    if (argv.length !== 1 || !KEY.test(argv[0])) throw new Error(USAGE);
    const issue = argv[0];
    const searched = listPrs(issue, { cwd, env, search: true, timeoutMs: ghTimeoutMs });
    const openList = listPrs(issue, { cwd, env, search: false, timeoutMs: ghTimeoutMs });
    for (const list of [searched, openList]) {
      if (list.length >= LIST_LIMIT) {
        return block([`the PR list of ${issue} may be cut at ${LIST_LIMIT} entries`]);
      }
    }
    const isMine = (p) =>
      /^[a-z]+\/(ORV-\d+)-/.exec(p.headRefName)?.[1] === issue &&
      /^(ORV-\d+):/.exec(p.title)?.[1] === issue;
    const mine = searched.filter(isMine);
    const open = new Map();
    for (const p of [...mine, ...openList.filter(isMine)]) {
      if (p.state === "OPEN") open.set(p.number, p);
    }
    if (open.size > 0) {
      return block(
        [...open.values()].map(
          (p) => `PR ${p.number} of ${issue} is open, so its work is not all merged`,
        ),
      );
    }
    let merged;
    let mergedAt = -Infinity;
    for (const p of mine.filter((p) => p.state === "MERGED")) {
      const ms = Date.parse(p.mergedAt ?? "");
      if (Number.isNaN(ms)) throw new Error(`PR ${p.number} has no valid merge time`);
      if (ms >= mergedAt) {
        merged = p;
        mergedAt = ms;
      }
    }
    if (merged === undefined) return block([`no PR of ${issue} is merged into develop`]);
    const result = runMergeCheck([String(merged.number), "--head", merged.headRefOid], {
      cwd,
      env,
    });
    if (result.code === 0) return { code: 0, stderr: "" };
    const lines = result.stderr
      .split("\n")
      .map((line) => line.replace(/^- /, "").trim())
      .filter((line) => line !== "" && line !== "merge-check blocked:");
    return block([
      `PR ${merged.number} of ${issue}, head ${merged.headRefOid}, does not pass merge-check:`,
      ...(lines.length > 0 ? lines : [`merge-check exited ${result.code}`]),
    ]);
  } catch (error) {
    return { code: 2, stderr: `g3-check failed closed: ${clean(error.message)}` };
  }
}

const block = (reasons) => ({
  code: 2,
  stderr: `g3-check blocked:\n- ${reasons.map(clean).join("\n- ")}`,
});

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  const { code, stderr } = runG3Check(process.argv.slice(2));
  if (stderr) process.stderr.write(`${stderr}\n`);
  process.exit(code);
}
