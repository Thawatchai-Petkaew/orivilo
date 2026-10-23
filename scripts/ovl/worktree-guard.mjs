// The worktree-guard check (ORV-89, R89-3). A subagent must not remove a worktree: the session's
// hook files live in its checkout, and once they are gone no hook can run (a SubagentStop wrapper
// that cannot be found exits 2 even with stop_hook_active true).
// Reads PreToolUse(Bash) input. The rule is a fail-closed text rule, not a parser: a call from a
// subagent whose command text, with quote and backslash characters removed and lowercased, holds
// both "worktree" and "remove" (or "prune") is blocked. Every other call is allowed before any
// checkout is looked up, so the guard can never lock a session out of Bash.
import { readFileSync, writeSync } from "node:fs";
import { beat, recordsRoot } from "./hook.mjs";

const MESSAGE =
  "a subagent must not remove or prune a worktree: the hooks live in it and stop working. " +
  "Finish your report; the orchestrator removes worktrees after the agent stops";

/** True when `command` looks like it removes or prunes a worktree. */
export function removesWorktree(command) {
  const text = command.replace(/["'\\]/g, "").toLowerCase();
  return text.includes("worktree") && (text.includes("remove") || text.includes("prune"));
}

/** Returns {code, stderr}: 2 only for a subagent's worktree removal, or input that is not a Bash call. */
export function judge(raw) {
  let input;
  try {
    input = JSON.parse(raw);
    if (
      input === null ||
      typeof input !== "object" ||
      input.tool_name !== "Bash" ||
      typeof input.tool_input?.command !== "string"
    ) {
      throw new Error("input is not a Bash tool call");
    }
  } catch (error) {
    return { code: 2, stderr: `worktree-guard failed closed: ${error.message}` };
  }
  const block = input.agent_id !== undefined && removesWorktree(input.tool_input.command);
  try {
    beat(recordsRoot(input.cwd), "worktree-guard", input, block ? "block" : "allow");
  } catch {
    // No store to write to (cwd outside a checkout, or its worktree is gone): the verdict stands.
  }
  return block
    ? { code: 2, stderr: `worktree-guard blocked:\n- ${MESSAGE}` }
    : { code: 0, stderr: "" };
}

/** Entry point of the hook script: reads stdin, prints the reason on stderr, exits. */
export function runWorktreeGuard() {
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
