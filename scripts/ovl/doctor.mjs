#!/usr/bin/env node
// ovl-doctor (ORV-81 spec, end of Hooks): proves every registered guard still runs.
//   node scripts/ovl/doctor.mjs plan             prints {since, guards:[{name, probe|null, reason?}], closed_pre_a3}
//   node scripts/ovl/doctor.mjs check <since>    exits 2 and names each probed guard with no heartbeat since <since>
//   node scripts/ovl/doctor.mjs recorder <since> exits 2 unless result-recorder wrote a SubagentStart, SubagentStop or Agent heartbeat since <since>
// Every command first checks that the dependencies are installed and names `pnpm install` when not.
// A heartbeat counts only with decision "block": each probe is built to be blocked.
// The main session makes the planned probe call for each guard (each is built to be blocked, so it
// changes nothing), then runs `check`. Only guards registered in .claude/settings.json are planned,
// so a slice that has not shipped a guard yet does not stop a run. Exit 2 on any problem.
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gitTop } from "./hook.mjs";
import { allTasks, isOpen, taskDir, writeClosed } from "./records.mjs";

/** The probe call for each guard that can be probed without a person. A slice adds its guard here. */
const PROBES = {
  "envelope-guard": {
    hook_event_name: "PreToolUse",
    tool_name: "Agent",
    tool_input: {
      description: "ovl-doctor probe",
      subagent_type: "builder",
      prompt: "ovl-doctor probe: this is not an envelope, so envelope-guard must block it",
    },
  },
};

/** Guards that write heartbeats but need a person or a dispatch, so no probe exists. */
const UNPROBEABLE = {
  "owner-grant": "it runs only after the owner answers a question form",
  "result-recorder":
    "it runs only when a subagent starts or stops; use `recorder` after the first Agent call",
};

/** The packages the hooks import. A missing one crashed a hook once (ORV-85 review), so the run stops here. */
function checkDependencies() {
  const require = createRequire(import.meta.url);
  for (const [name, entry] of [["ajv", "ajv/dist/2020.js"]]) {
    try {
      require.resolve(entry);
    } catch {
      throw new Error(
        `the dependency ${name} is not installed; run \`pnpm install\` and start the run again`,
      );
    }
  }
}

function beatsOf(root) {
  const file = join(root, ".orivilo", "heartbeat.jsonl");
  return existsSync(file)
    ? readFileSync(file, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l))
    : [];
}

function registeredGuards(root) {
  const file = join(root, ".claude", "settings.json");
  if (!existsSync(file)) throw new Error(`${file} does not exist`);
  const commands = Object.values(JSON.parse(readFileSync(file, "utf8")).hooks ?? {})
    .flat()
    .flatMap((group) => group.hooks.map((h) => h.command));
  const names = new Set();
  for (const command of commands) {
    for (const m of command.matchAll(/\.claude\/hooks\/([a-z0-9-]+)\.(?:mjs|sh)/g)) names.add(m[1]);
  }
  return [...names].filter((n) => n in PROBES || n in UNPROBEABLE);
}

function plan(root) {
  const guards = registeredGuards(root).map((name) =>
    name in PROBES
      ? { name, probe: PROBES[name] }
      : { name, probe: null, reason: `not probed: ${UNPROBEABLE[name]}` },
  );
  return { since: new Date().toISOString(), guards, closed_pre_a3: closePreA3(root) };
}

/**
 * Slice A2 wrote envelopes but nothing closed them. Once result-recorder is registered, each open
 * envelope with no agent.json that is older than the first recorder heartbeat (or any, while the
 * recorder has not run yet) is closed as pre_a3. It was never bound, so it is never a round (AC 76).
 */
function closePreA3(root) {
  if (!registeredGuards(root).includes("result-recorder")) return [];
  const first = beatsOf(root).find((b) => b.hook === "result-recorder");
  const cutoff = first ? Date.parse(first.at) : Infinity;
  const closed = [];
  for (const task of allTasks(root)) {
    const written = statSync(join(taskDir(root, task.issue, task.id), "envelope.json")).mtimeMs;
    if (isOpen(task) && task.agent === undefined && written < cutoff) {
      writeClosed(root, task, "pre_a3");
      closed.push(task.id);
    }
  }
  return closed;
}

function check(root, since) {
  const sinceMs = Date.parse(since);
  if (Number.isNaN(sinceMs)) throw new Error(`"${since}" is not a time`);
  const beats = beatsOf(root);
  return registeredGuards(root)
    .filter((name) => name in PROBES)
    .filter(
      (name) =>
        !beats.some(
          (b) => b.hook === name && b.decision === "block" && Date.parse(b.at) >= sinceMs,
        ),
    );
}

function main(argv) {
  const [command, since] = argv;
  checkDependencies();
  const root = gitTop(process.cwd());
  if (command === "plan" && argv.length === 1) {
    console.log(JSON.stringify(plan(root), null, 2));
    return 0;
  }
  if (command === "check" && argv.length === 2) {
    const silent = check(root, since);
    if (silent.length === 0) return 0;
    console.error(
      `ovl-doctor: no heartbeat since ${since} from: ${silent.join(", ")}. Stop the run.`,
    );
    return 2;
  }
  if (command === "recorder" && argv.length === 2) {
    const sinceMs = Date.parse(since);
    if (Number.isNaN(sinceMs)) throw new Error(`"${since}" is not a time`);
    // Bash calls also write recorder heartbeats, so only a subagent event or an Agent call proves the registration.
    const subagentBeat = (b) =>
      b.event === "SubagentStart" || b.event === "SubagentStop" || b.tool === "Agent";
    if (
      beatsOf(root).some(
        (b) => b.hook === "result-recorder" && subagentBeat(b) && Date.parse(b.at) >= sinceMs,
      )
    ) {
      return 0;
    }
    console.error(`ovl-doctor: result-recorder wrote no heartbeat since ${since}. Stop the run.`);
    return 2;
  }
  console.error("usage: doctor.mjs plan | check <since> | recorder <since>");
  return 2;
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`ovl-doctor failed: ${error.message}`);
    process.exit(2);
  }
}
