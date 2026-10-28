// The worktree-guard check (ORV-89, R89-3). A subagent must not remove a worktree: the session's
// hook files live in its checkout, and once they are gone no hook can run (a SubagentStop wrapper
// that cannot be found exits 2 even with stop_hook_active true).
// Reads PreToolUse(Bash) input. The rule is a fail-closed text rule, not a parser: a call from a
// subagent whose command text, with quote and backslash characters removed and lowercased, holds
// both "worktree" and "remove" (or "prune") is blocked. That verdict is fixed before any checkout
// is looked up and never depends on one, and so is every verdict except a main-session branch
// switch (switch-1 below), so the guard can never lock a session out of Bash; only the heartbeat
// resolves the records folder.
// The heartbeat is written only when the call's cwd belongs to this project's repo (the same main
// checkout as CLAUDE_PROJECT_DIR); a cwd in any other repo gets no .orivilo, and the verdict is
// the same either way.
//
// Rule switch-1 (ORV-138, ORV-130, L-0032) is the second check, for the main session: a branch switch
// form is blocked while an open envelope is bound to the checkout the call runs in. It is the same
// kind of text rule. A switch form fails closed: when the records or the checkout cannot be read, it
// is blocked, and every other call keeps the verdict it had.
import { readFileSync, realpathSync, writeSync } from "node:fs";
import { resolve } from "node:path";
import { beat, gitTop, recordsRoot } from "./hook.mjs";
import { allTasks, isOpen } from "./records.mjs";

const MESSAGE =
  "a subagent must not remove or prune a worktree: the hooks live in it and stop working. " +
  "Finish your report; the orchestrator removes worktrees after the agent stops";

/** True when `command` looks like it removes or prunes a worktree. */
export function removesWorktree(command) {
  const text = command.replace(/["'\\]/g, "").toLowerCase();
  return text.includes("worktree") && (text.includes("remove") || text.includes("prune"));
}

/**
 * The directory each branch switch form in `command` runs in: a -C path resolved against `cwd`, else
 * `cwd`. Segments split at ; && | (so also ||) and newlines, after quotes and backslashes are removed. A form is
 * `git [-C <path>] [-c <kv>] switch|checkout` or `gh pr checkout`. A -C path may hold spaces (its
 * quotes are gone), so it runs up to the next `switch`, `checkout` or option word.
 */
export function switchForms(command, cwd) {
  const dirs = [];
  for (const segment of command.replace(/["'\\]/g, "").split(/&&|[;|\n]/)) {
    const words = segment.trim().split(/\s+/);
    const lower = words.map((w) => w.toLowerCase());
    if (lower[0] === "gh") {
      if (lower[1] === "pr" && lower[2] === "checkout") dirs.push(cwd);
      continue;
    }
    if (lower[0] !== "git") continue;
    let dir = cwd;
    let i = 1;
    while (i < words.length) {
      if (words[i] === "-c") {
        i += 2;
      } else if (words[i] === "-C") {
        const start = ++i;
        while (
          i < words.length &&
          !["switch", "checkout"].includes(lower[i]) &&
          words[i][0] !== "-"
        )
          i++;
        dir = resolve(dir, words.slice(start, i).join(" "));
      } else {
        break;
      }
    }
    if (lower[i] === "switch" || lower[i] === "checkout") dirs.push(dir);
  }
  return dirs;
}

/**
 * Rule switch-1 for one main-session call: the reason to block, or undefined. A switch form is
 * blocked when an open bound envelope (agent.json, no result.json, no closed.json) has the checkout
 * the form runs in as its worktree, and when the records or that checkout cannot be read.
 */
function switchBlock(command, cwd) {
  const dirs = switchForms(command, cwd);
  if (dirs.length === 0) return undefined;
  try {
    const store = recordsRoot(cwd);
    const bound = allTasks(store).filter((t) => isOpen(t) && t.agent !== undefined);
    const checkouts = dirs.map((dir) => gitTop(dir));
    const ids = bound
      .filter((t) => {
        try {
          return checkouts.includes(realpathSync(t.envelope.worktree));
        } catch {
          return false; // a worktree that is gone is no checkout a call can run in
        }
      })
      .map((t) => t.id);
    return ids.length === 0
      ? undefined
      : `a branch switch is blocked while envelope ${ids.join(", ")} is bound to this checkout: ` +
          "one issue per checkout (L-0032). Start a claude --worktree session for the other issue, " +
          "or close the envelope first";
  } catch (error) {
    return `a branch switch is blocked because the records or the checkout cannot be read: ${error.message}`;
  }
}

/** Returns {code, stderr}: 2 for a subagent's worktree removal, a main-session branch switch (switch-1), or input that is not a Bash call. */
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
  const { command } = input.tool_input;
  let reason;
  if (input.agent_id === undefined) reason = switchBlock(command, input.cwd);
  else if (removesWorktree(command)) reason = MESSAGE;
  const block = reason !== undefined;
  try {
    const store = recordsRoot(input.cwd);
    if (store === recordsRoot(process.env.CLAUDE_PROJECT_DIR)) {
      beat(store, "worktree-guard", input, block ? "block" : "allow");
    }
  } catch {
    // No store to write to (cwd outside a checkout, or its worktree is gone): the verdict stands.
  }
  return block
    ? { code: 2, stderr: `worktree-guard blocked:\n- ${reason}` }
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
