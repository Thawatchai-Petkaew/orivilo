#!/usr/bin/env node
// ovl-doctor (ORV-81 spec, end of Hooks): proves every registered guard still runs.
//   node scripts/ovl/doctor.mjs plan             prints {since, guards:[{name, probe|null, reason?}], closed_pre_a3}
//   node scripts/ovl/doctor.mjs check <since>    exits 2 and names each probed guard with no heartbeat since <since>
//   node scripts/ovl/doctor.mjs migrate         moves records kept in another worktree's own .orivilo/runs into the shared root
//   node scripts/ovl/doctor.mjs recorder <since> exits 2 unless result-recorder wrote a SubagentStart, SubagentStop or Agent heartbeat since <since>
// Every command first checks that the dependencies are installed and names `pnpm install` when not.
// A heartbeat counts only with decision "block": each probe is built to be blocked.
// The main session makes the planned probe call for each guard (each is built to be blocked, so it
// changes nothing), then runs `check`. Only guards registered in .claude/settings.json are planned,
// so a slice that has not shipped a guard yet does not stop a run. Exit 2 on any problem.
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmdirSync,
  rmSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gitTop, recordsRoot } from "./hook.mjs";
import { allTasks, isOpen, runsDir, taskDir, writeClosed } from "./records.mjs";

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
  "resume-guard": {
    hook_event_name: "PreToolUse",
    tool_name: "SendMessage",
    tool_input: {
      to: "ovl-doctor-probe",
      summary: "ovl-doctor probe",
      message: "ovl-doctor probe: resume-guard must block this",
    },
  },
};

/** Guards that write heartbeats but need a person or a dispatch, so no probe exists. */
const UNPROBEABLE = {
  "owner-grant": "it runs only after the owner answers a question form",
  "worktree-guard":
    "it judges only a subagent's Bash call, and a probe from the main session is always allowed",
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

function beatsOf(store) {
  const file = join(store, ".orivilo", "heartbeat.jsonl");
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

/** The files and the links under `dir`, as paths relative to `base`. A link is never followed. */
function entriesUnder(dir, base = dir) {
  const found = { files: [], links: [] };
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, e.name);
    if (e.isSymbolicLink()) found.links.push(relative(base, path));
    else if (e.isDirectory()) {
      const inner = entriesUnder(path, base);
      found.files.push(...inner.files);
      found.links.push(...inner.links);
    } else found.files.push(relative(base, path));
  }
  return found;
}

/**
 * Before ORV-89 each worktree kept its own records. Returns [{runs, heartbeat, files, links}] for every
 * worktree other than the main checkout whose `.orivilo/runs` still holds a file or a link: the hooks
 * no longer read them.
 */
function strayRecords(store) {
  const listing = execFileSync("git", ["worktree", "list", "--porcelain"], {
    cwd: store,
    encoding: "utf8",
  });
  return listing
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length))
    .filter((path) => existsSync(path) && realpathSync(path) !== store)
    .map((path) => {
      const top = realpathSync(path);
      const runs = runsDir(top);
      const found = existsSync(runs) ? entriesUnder(runs) : { files: [], links: [] };
      return { runs, heartbeat: join(top, ".orivilo", "heartbeat.jsonl"), ...found };
    })
    .filter((stray) => stray.files.length + stray.links.length > 0);
}

/** The units migrate moves whole: a task folder, or one gate record. Returns relative paths. */
function unitsOf(runs) {
  const units = [];
  for (const issue of readdirSync(runs, { withFileTypes: true })) {
    if (!issue.isDirectory()) {
      units.push(issue.name);
      continue;
    }
    for (const e of readdirSync(join(runs, issue.name), { withFileTypes: true })) {
      if (e.isDirectory() && e.name === "gates") {
        for (const g of readdirSync(join(runs, issue.name, "gates"))) {
          units.push(join(issue.name, "gates", g));
        }
      } else units.push(join(issue.name, e.name));
    }
  }
  return units;
}

/**
 * Moves each stray task folder into the shared root, whole, never over one that is already there:
 * a task folder that exists in main stays complete in the worktree and is listed as a conflict, so a
 * result or a closing never attaches to a different envelope. Stray links stop the run before any move.
 * The worktree's heartbeat lines are appended to the shared heartbeat.
 */
function migrate(store) {
  const strays = strayRecords(store);
  const links = strays.flatMap((s) => s.links.map((l) => join(s.runs, l)));
  if (links.length > 0) return { moved: 0, conflicts: [], links };
  const conflicts = [];
  let moved = 0;
  for (const { runs, heartbeat } of strays) {
    for (const unit of unitsOf(runs)) {
      const from = join(runs, unit);
      const to = join(runsDir(store), unit);
      if (existsSync(to)) {
        conflicts.push(`${from} (${to} exists)`);
        continue;
      }
      mkdirSync(dirname(to), { recursive: true });
      const count = statSync(from).isDirectory() ? entriesUnder(from).files.length : 1;
      cpSync(from, to, { recursive: true, errorOnExist: true });
      rmSync(from, { recursive: true });
      moved += count;
    }
    pruneEmpty(runs);
    if (existsSync(heartbeat)) {
      mkdirSync(join(store, ".orivilo"), { recursive: true });
      appendFileSync(join(store, ".orivilo", "heartbeat.jsonl"), readFileSync(heartbeat));
      unlinkSync(heartbeat);
    }
  }
  return { moved, conflicts, links };
}

/** Removes the empty folders under `dir`, `dir` included. */
function pruneEmpty(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) pruneEmpty(join(dir, e.name));
  }
  if (readdirSync(dir).length === 0) rmdirSync(dir);
}

function plan(root, store) {
  const stray = strayRecords(store);
  if (stray.length > 0) {
    throw new Error(
      `records written before the shared root still sit in ${stray.map((s) => s.runs).join(", ")}; ` +
        "the hooks no longer read them, so rework rules would restart. " +
        "Run `node scripts/ovl/doctor.mjs migrate`, then plan again",
    );
  }
  const guards = registeredGuards(root).map((name) =>
    name in PROBES
      ? { name, probe: PROBES[name] }
      : { name, probe: null, reason: `not probed: ${UNPROBEABLE[name]}` },
  );
  return { since: new Date().toISOString(), guards, closed_pre_a3: closePreA3(root, store) };
}

/**
 * Slice A2 wrote envelopes but nothing closed them. Once result-recorder is registered, each open
 * envelope with no agent.json that is older than the first recorder heartbeat (or any, while the
 * recorder has not run yet) is closed as pre_a3. It was never bound, so it is never a round (AC 76).
 */
function closePreA3(root, store) {
  if (!registeredGuards(root).includes("result-recorder")) return [];
  const first = beatsOf(store).find((b) => b.hook === "result-recorder");
  const cutoff = first ? Date.parse(first.at) : Infinity;
  const closed = [];
  for (const task of allTasks(store)) {
    const written = statSync(join(taskDir(store, task.issue, task.id), "envelope.json")).mtimeMs;
    if (isOpen(task) && task.agent === undefined && written < cutoff) {
      writeClosed(store, task, "pre_a3");
      closed.push(task.id);
    }
  }
  return closed;
}

function check(root, store, since) {
  const sinceMs = Date.parse(since);
  if (Number.isNaN(sinceMs)) throw new Error(`"${since}" is not a time`);
  const beats = beatsOf(store);
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
  const store = recordsRoot(process.cwd());
  if (command === "plan" && argv.length === 1) {
    console.log(JSON.stringify(plan(root, store), null, 2));
    return 0;
  }
  if (command === "migrate" && argv.length === 1) {
    const { moved, conflicts, links } = migrate(store);
    if (links.length > 0) {
      console.error(
        `ovl-doctor: links found, nothing moved:\n- ${links.join("\n- ")}\nRemove or replace each link by hand, then run migrate again.`,
      );
      return 2;
    }
    console.log(`ovl-doctor: moved ${moved} record file(s) into ${runsDir(store)}`);
    if (conflicts.length === 0) return 0;
    console.error(
      `ovl-doctor: left in place, not overwritten:\n- ${conflicts.join("\n- ")}\nResolve each by hand, then run migrate again.`,
    );
    return 2;
  }
  if (command === "check" && argv.length === 2) {
    const silent = check(root, store, since);
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
      beatsOf(store).some(
        (b) => b.hook === "result-recorder" && subagentBeat(b) && Date.parse(b.at) >= sinceMs,
      )
    ) {
      return 0;
    }
    console.error(`ovl-doctor: result-recorder wrote no heartbeat since ${since}. Stop the run.`);
    return 2;
  }
  console.error("usage: doctor.mjs plan | migrate | check <since> | recorder <since>");
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
