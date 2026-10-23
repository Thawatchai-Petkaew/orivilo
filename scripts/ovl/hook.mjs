// Shared runner for the ovl hooks (ORV-81 spec, Hooks). A hook never fails open: malformed input,
// a missing field or any thrown error exits 2, and every run leaves one heartbeat line.
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, realpathSync, writeSync } from "node:fs";
import { join } from "node:path";

/** The git top level of `cwd`, the checkout whose `.orivilo/` holds the records. Throws outside a checkout. */
export function gitTop(cwd) {
  if (typeof cwd !== "string" || cwd === "") throw new Error("hook input has no cwd");
  const top = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  return realpathSync(top);
}

function beat(root, hook, input, decision) {
  const dir = join(root, ".orivilo");
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
 * Runs `check(input, {root})`, which returns the reasons to block (empty to allow) and may throw.
 * Returns {code, stderr}: 0 to allow, 2 to block or on any error.
 */
export function handle(hook, raw, check) {
  let input;
  let root;
  try {
    input = JSON.parse(raw);
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new Error("hook input is not a JSON object");
    }
    root = gitTop(input.cwd);
    const reasons = check(input, { root });
    beat(root, hook, input, reasons.length > 0 ? "block" : "allow");
    if (reasons.length === 0) return { code: 0, stderr: "" };
    return { code: 2, stderr: `${hook} blocked:\n- ${reasons.join("\n- ")}` };
  } catch (error) {
    try {
      if (root) beat(root, hook, input, "error");
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
