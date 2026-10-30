// The worktree-guard check (ORV-89, R89-3). A subagent must not remove a worktree: the session's
// hook files live in its checkout, and once they are gone no hook can run (a SubagentStop wrapper
// that cannot be found exits 2 even with stop_hook_active true).
// Reads PreToolUse(Bash) input. The rule is a fail-closed text rule, not a parser: a call from a
// subagent whose command text, with quote and backslash characters removed and lowercased, holds
// both "worktree" and "remove" (or "prune") is blocked. That verdict is fixed before any checkout
// is looked up and never depends on one, and so is every verdict except a main-session branch
// switch or a call that shell-1 cannot read (switch-1 below), so the guard can never lock a
// session out of Bash; only the heartbeat resolves the records folder.
// The heartbeat is written only when the call's cwd belongs to this project's repo (the same main
// checkout as CLAUDE_PROJECT_DIR); a cwd in any other repo gets no .orivilo, and the verdict is
// the same either way.
//
// Rule switch-1 (ORV-138, ORV-130, L-0032) is the second check, for the main session: a branch switch
// form is blocked while an open envelope is bound to the checkout the call runs in, or while any
// envelope is bound and the checkout is unknown; a call that shell-1 marks unknown (unknown-1) is
// blocked while any envelope is bound (clause (d)). The call is read by scripts/ovl/shell-words.mjs
// (shell-1), the one reader of Bash text for the guards: this file splits and unquotes nothing
// itself. The envelopes are read from the records of CLAUDE_PROJECT_DIR when it is set, else of the
// call's cwd, as write-guard reads them (RV2-5). A switch form or an unknown call fails closed: when
// the records or the checkout cannot be read, it is blocked, and every other call keeps the verdict
// it had.
import { readFileSync, realpathSync, writeSync } from "node:fs";
import { resolve } from "node:path";
import { beat, gitTop, recordsRoot } from "./hook.mjs";
import { allTasks, isOpen } from "./records.mjs";
import { describeCause, readShell } from "./shell-words.mjs";

const MESSAGE =
  "a subagent must not remove or prune a worktree: the hooks live in it and stop working. " +
  "Finish your report; the orchestrator removes worktrees after the agent stops";

/** True when `command` looks like it removes or prunes a worktree. */
export function removesWorktree(command) {
  const text = command.replace(/["'\\]/g, "").toLowerCase();
  return text.includes("worktree") && (text.includes("remove") || text.includes("prune"));
}

/** Git's global options that take the next word as their value (git(1), switch-1 (a)). */
const VALUE_OPTION = /^(?:-[Cc]|--git-dir|--work-tree)$/;
/** `--git-dir` and `--work-tree`, with or without `=`: the checkout is set by a path not followed (switch-1 (c)). */
const REDIRECTED_OPTION = /^--(?:git-dir|work-tree)(?:=|$)/;

/**
 * Rule switch-1 (a) to (c): the branch switch forms among the segments shell-1 read. Each form is
 * `{ folders, unknown }`: the folders git runs in (null when unknown) and whether its checkout is
 * unknown. A segment is a form when its command is `git` and the first word after git's global
 * options is `switch` or `checkout`, or when it is `gh pr checkout`.
 */
export function switchForms(segments) {
  const forms = [];
  const lowered = (word) => (word?.kind === "none" ? word.fixed.toLowerCase() : null);
  for (const segment of segments) {
    const args = segment.commandWords.slice(1);
    let unknown = segment.cwd === null || segment.envChdir.length > 0 || segment.gitEnv.length > 0;
    if (segment.command === "gh") {
      if (lowered(args[0]) === "pr" && lowered(args[1]) === "checkout") {
        forms.push({ folders: segment.cwd, unknown });
      }
      continue;
    }
    if (segment.command !== "git") continue;
    let folders = segment.cwd;
    let at = 0;
    for (; at < args.length && args[at].fixed.startsWith("-"); at++) {
      const option = args[at].fixed;
      if (REDIRECTED_OPTION.test(option)) unknown = true;
      if (args[at].kind !== "none" || !VALUE_OPTION.test(option)) continue;
      const value = args[++at];
      if (option !== "-C" || value === undefined) continue;
      // `-C ""` resolves to the folder itself, which is what git does.
      if (value.kind !== "none") unknown = true;
      else if (folders !== null) {
        folders = [...new Set(folders.map((folder) => resolve(folder, value.fixed)))];
      }
    }
    if (["switch", "checkout"].includes(lowered(args[at]))) forms.push({ folders, unknown });
  }
  return forms;
}

/**
 * Rule switch-1 for one main-session call: the reason to block, or undefined. A switch form is
 * blocked when an open bound envelope (agent.json, no result.json, no closed.json) has the checkout
 * the form runs in as its worktree; when its checkout is unknown while any envelope is bound; and
 * when the records or the checkout cannot be read. A call that shell-1 marks unknown (unknown-1) is
 * blocked while any envelope is bound, whatever its segments, and when the records cannot be read
 * (clause (d)); no segment of such a call is judged. The records are those of CLAUDE_PROJECT_DIR
 * when it is set, else of the call's cwd (RV2-5).
 */
function switchBlock(command, cwd) {
  const read = readShell(command, { cwd });
  const forms = read.unknown ? [] : switchForms(read.segments);
  if (!read.unknown && forms.length === 0) return undefined;
  const causes = read.causes.map(describeCause).join("; ");
  try {
    const store = recordsRoot(process.env.CLAUDE_PROJECT_DIR || cwd);
    const bound = allTasks(store).filter((t) => isOpen(t) && t.agent !== undefined);
    if (read.unknown) {
      if (bound.length === 0) return undefined;
      return (
        `the call could not be read (rule unknown-1: ${causes}) while envelope ` +
        `${bound.map((t) => t.id).join(", ")} is bound: a branch switch could hide in it. ` +
        "Split it into simpler calls"
      );
    }
    for (const { folders, unknown } of forms) {
      if (unknown) {
        if (bound.length === 0) continue;
        return (
          "a branch switch is blocked because its checkout is unknown while envelope " +
          `${bound.map((t) => t.id).join(", ")} is bound: name the checkout with a literal ` +
          "git -C <path> and join the steps with &&"
        );
      }
      const checkouts = folders.map((dir) => gitTop(dir));
      const ids = bound
        .filter((t) => {
          try {
            return checkouts.includes(realpathSync(t.envelope.worktree));
          } catch {
            return false; // a worktree that is gone is no checkout a call can run in
          }
        })
        .map((t) => t.id);
      if (ids.length > 0) {
        return (
          `a branch switch is blocked while envelope ${ids.join(", ")} is bound to this checkout: ` +
          "one issue per checkout (L-0032). Start a claude --worktree session for the other issue, " +
          "or close the envelope first"
        );
      }
    }
    return undefined;
  } catch (error) {
    return read.unknown
      ? `the call could not be read (rule unknown-1: ${causes}) and the records cannot be read, so it is blocked: ${error.message}`
      : `a branch switch is blocked because the records or the checkout cannot be read (the checkout is unknown): ${error.message}`;
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
