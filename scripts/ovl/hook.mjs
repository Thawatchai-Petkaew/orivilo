// Shared runner for the ovl hooks (ORV-81 spec, Hooks). A hook never fails open: malformed input,
// a missing field or any thrown error exits 2, and every run leaves one heartbeat line.
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";

function gitOut(cwd, args) {
  if (typeof cwd !== "string" || cwd === "") throw new Error("hook input has no cwd");
  if (!existsSync(cwd)) {
    throw new Error(
      `the working directory ${cwd} no longer exists (its worktree was removed); run from the main checkout`,
    );
  }
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/** The git top level of `cwd`, the checkout whose files the hook judges. Throws outside a checkout. */
export function gitTop(cwd) {
  return realpathSync(gitOut(cwd, ["rev-parse", "--show-toplevel"]));
}

/**
 * The checkout that holds the run records (`.orivilo/`): the main checkout of the repo, found through
 * the common git dir, so every worktree of the repo shares one set of records and removing a worktree
 * keeps them. Throws when `cwd` is gone, the repo has no main checkout (a bare repo), or the
 * checkout's `.orivilo` leads outside it (a link would send the records anywhere).
 */
export function recordsRoot(cwd) {
  const common = realpathSync(resolve(cwd, gitOut(cwd, ["rev-parse", "--git-common-dir"])));
  if (basename(common) !== ".git")
    throw new Error(`${common} is not the .git folder of a checkout`);
  const main = dirname(common);
  const store = join(main, ".orivilo");
  try {
    lstatSync(store);
  } catch {
    return main; // no records yet
  }
  const real = realpathSync(store);
  const inside = relative(main, real);
  if (inside.startsWith("..") || isAbsolute(inside)) {
    throw new Error(`${store} leads to ${real}, outside the main checkout ${main}`);
  }
  return main;
}

export function beat(store, hook, input, decision) {
  const dir = join(store, ".orivilo");
  mkdirSync(dir, { recursive: true });
  const line = {
    hook,
    event: input.hook_event_name ?? null,
    at: new Date().toISOString(),
    tool: input.tool_name ?? null,
    agent_id: input.agent_id ?? null,
    decision,
  };
  appendFileSync(join(dir, "heartbeat.jsonl"), `${JSON.stringify(line)}\n`);
}

/**
 * Runs `check(input, {root, store})` (root: this checkout; store: the checkout holding the records),
 * which returns the reasons to block (empty to allow) and may throw.
 * Returns {code, stderr}: 0 to allow, 2 to block or on any error.
 */
export function handle(hook, raw, check) {
  let input;
  let root;
  let store;
  try {
    input = JSON.parse(raw);
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new Error("hook input is not a JSON object");
    }
    root = gitTop(input.cwd);
    store = recordsRoot(input.cwd);
    const reasons = check(input, { root, store });
    beat(store, hook, input, reasons.length > 0 ? "block" : "allow");
    if (reasons.length === 0) return { code: 0, stderr: "" };
    return { code: 2, stderr: `${hook} blocked:\n- ${reasons.join("\n- ")}` };
  } catch (error) {
    try {
      if (store) beat(store, hook, input, "error");
    } catch {
      // The failure is reported below; a heartbeat that cannot be written must not hide it.
    }
    return { code: 2, stderr: `${hook} failed closed: ${error.message}` };
  }
}

/** Entry point of a hook script: reads stdin, prints the reason on stderr, exits. */
export function runHook(hook, check) {
  let raw = "";
  try {
    raw = readFileSync(0, "utf8");
  } catch {
    // An unreadable stdin leaves raw empty, which handle() rejects.
  }
  const { code, stderr } = handle(hook, raw, check);
  if (stderr) writeSync(2, `${stderr}\n`);
  process.exit(code);
}
