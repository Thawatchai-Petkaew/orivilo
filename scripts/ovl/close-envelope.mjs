#!/usr/bin/env node
// Closes an envelope that no report will close (ORV-81 spec, Records and AC 50, 68):
//   node scripts/ovl/close-envelope.mjs <task_id>          never bound: closed.json {reason: denied}.
//                                                          bound: {reason: abandoned}, only after its final SubagentStop.
//   node scripts/ovl/close-envelope.mjs <task_id> --owner  from the owner's terminal: also closes a bound
//                                                          envelope whose session died ({reason: abandoned, by: owner}).
// Exit 0 when closed, 2 on any problem.
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { recordsRoot } from "./hook.mjs";
import { allTasks, isOpen, writeClosed } from "./records.mjs";

/** True when the recorder let this agent's SubagentStop through (decision allow): the subagent has ended. */
function hasFinalStop(root, agentId) {
  const file = join(root, ".orivilo", "heartbeat.jsonl");
  if (!existsSync(file)) return false;
  return readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .some(
      (b) =>
        b.hook === "result-recorder" &&
        b.event === "SubagentStop" &&
        b.decision === "allow" &&
        b.agent_id === agentId,
    );
}

function main(argv) {
  const owner = argv.includes("--owner");
  const rest = argv.filter((a) => a !== "--owner");
  if (rest.length !== 1 || rest[0].startsWith("-") || argv.length > 2) {
    console.error("usage: close-envelope.mjs <task_id> [--owner]");
    return 2;
  }
  const root = recordsRoot(process.cwd());
  const task = allTasks(root).find((t) => t.id === rest[0]);
  if (!task) {
    console.error(`close-envelope: no envelope for task "${rest[0]}" in ${root}`);
    return 2;
  }
  if (!isOpen(task)) {
    console.error(`close-envelope: ${task.id} is already closed`);
    return 2;
  }
  const by = owner ? { by: "owner" } : {};
  if (task.agent === undefined) {
    writeClosed(root, task, "denied", by);
    console.log(`${task.id} closed: denied (never started, not a round)`);
    return 0;
  }
  if (!owner && !hasFinalStop(root, task.agent.agent_id)) {
    console.error(
      `close-envelope: ${task.id} is bound to agent ${task.agent.agent_id} and no final SubagentStop was recorded, so the subagent may still run. If the session ended, the owner closes it from a terminal with --owner.`,
    );
    return 2;
  }
  writeClosed(root, task, "abandoned", by);
  console.log(`${task.id} closed: abandoned (still a round if it was a builder)`);
  return 0;
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`close-envelope failed: ${error.message}`);
    process.exit(2);
  }
}
