// The resume-guard check (ORV-88). A resume goes through the SendMessage tool and runs a subagent
// with no envelope, so nobody checked its brief, facts, write_set or done_when (ADR 0013 decision 2).
// Reads PreToolUse(SendMessage) input. The rule blocks every call, from the main session and from
// any subagent, whatever `to` names: records miss agents (Explore, unbound, other sessions) and a
// name is never in the records, so there is no allow-list.
// The verdict is fixed before any checkout or record is read, as in worktree-guard. The task hint
// (which recorded task `to` belongs to) and the heartbeat come after and never change the verdict.
// message, summary and to are untrusted: they are never echoed, logged or used in a path.
import { readFileSync, writeSync } from "node:fs";
import { beat, recordsRoot } from "./hook.mjs";
import { allTasks } from "./records.mjs";

const RESUME =
  "a resume runs a subagent with no envelope, so nobody checked its brief, facts, write_set or done_when. " +
  "SendMessage is blocked whatever `to` names";
const FRESH =
  "Dispatch a fresh envelope with a new task_id instead, and put the earlier result.json absolute paths in context_pointers";

/** The recorded task whose bound agent_id equals `agentId`, or undefined. Never builds a path from it. */
function taskOfAgent(store, agentId) {
  return allTasks(store).find((t) => t.agent?.agent_id === agentId);
}

/** Returns {code, stderr}: 2 for every SendMessage, and for input that is not one. */
export function judge(raw, lookup = taskOfAgent) {
  let input;
  try {
    input = JSON.parse(raw);
    if (
      input === null ||
      typeof input !== "object" ||
      input.tool_name !== "SendMessage" ||
      typeof input.tool_input?.to !== "string"
    ) {
      throw new Error("input is not a SendMessage tool call with a string `to`");
    }
  } catch (error) {
    input = input !== null && typeof input === "object" ? input : undefined;
    if (input) heartbeat(input, "error");
    return { code: 2, stderr: `resume-guard failed closed: ${error.message}` };
  }
  let hint = `\`to\` names no recorded agent. ${RESUME}`;
  const store = heartbeat(input, "block");
  if (store !== undefined) {
    try {
      const task = lookup(store, input.tool_input.to);
      if (task) {
        hint = `${RESUME}. \`to\` is the agent of task ${task.id} (${task.issue})`;
      }
    } catch {
      // The hint is optional: the verdict stands.
    }
  }
  return { code: 2, stderr: `resume-guard blocked:\n- ${hint}\n- ${FRESH}` };
}

/** Writes one heartbeat when the call's cwd belongs to this project's repo. Returns that store, or undefined. */
function heartbeat(input, decision) {
  try {
    const store = recordsRoot(input.cwd);
    if (store !== recordsRoot(process.env.CLAUDE_PROJECT_DIR)) return undefined;
    beat(store, "resume-guard", input, decision);
    return store;
  } catch {
    // No store to write to (cwd outside a checkout, or its worktree is gone): the verdict stands.
    return undefined;
  }
}

/** Entry point of the hook script: reads stdin, prints the reason on stderr, exits. */
export function runResumeGuard() {
  let raw = "";
  try {
    raw = readFileSync(0, "utf8");
  } catch {
    // An unreadable stdin leaves raw empty, which judge() rejects.
  }
  const { code, stderr } = judge(raw);
  if (stderr) writeSync(2, `${stderr}\n`);
  process.exit(code);
}
