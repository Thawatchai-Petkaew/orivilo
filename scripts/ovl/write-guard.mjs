// The write-guard check (ORV-93, ORV-81 spec Hooks). Reads PreToolUse input for Write, Edit,
// MultiEdit, NotebookEdit and Bash and keeps three protected sets out of reach:
//   deliverable  packages/, apps/                       the main session is blocked, subagents may write
//   guard file   .claude/hooks/, .claude/settings*.json, scripts/ovl/, scripts/quality-gate.mjs,
//                .github/workflows/, the root .gitignore   every session is blocked, except a bound
//                                                           builder's tool write to a path its open envelope lists
//   record       .orivilo/, .quality-gate/                 every session is blocked, except the main
//                session's Write or Edit of .orivilo/handoff.md and a qa or designer's own screenshot PNG
// The verdict is a deterministic path and text rule, never a model. Tool paths are judged after they are
// made absolute and resolved through realpath, lowercased. Bash is a text rule (quotes and backslashes
// removed, lowercased), not a parser. Every non-zero exit is 2; anything unexpected fails closed.
// stderr and the heartbeat never hold file content or a whole command (the heartbeat is beat()'s six fields).
import { existsSync, lstatSync, readFileSync, realpathSync, writeSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { beat, recordsRoot } from "./hook.mjs";
import { allTasks, isOpen } from "./records.mjs";

const PATH_FIELD = {
  Write: "file_path",
  Edit: "file_path",
  MultiEdit: "file_path",
  NotebookEdit: "notebook_path",
};

/** How Bash names each set: a substring of the lowercased command text. */
const TEXT_PREFIXES = {
  deliverable: ["packages/", "apps/"],
  "guard file": [
    ".claude/hooks/",
    ".claude/settings",
    "scripts/ovl/",
    "scripts/quality-gate.mjs",
    ".github/workflows/",
    ".gitignore",
  ],
  record: [".orivilo", ".quality-gate"],
};

const GUARD_PATH =
  /^(?:\.claude\/hooks\/|\.claude\/settings[^/]*\.json$|scripts\/ovl\/|scripts\/quality-gate\.mjs$|\.github\/workflows\/|\.gitignore$)/;

const HANDOFF = ".orivilo/handoff.md";

const MESSAGES = {
  deliverable: (where) =>
    `deliverable ${where}: the main session does not edit deliverables; dispatch a builder envelope`,
  "guard file": (where) =>
    `guard file ${where}: only a builder whose open envelope lists the exact path may write it, by Write or Edit`,
  record: (where) => `record ${where}: only hooks and the scripts in scripts/ovl/ write records`,
};

/** [[set, prefix]] for every prefix of `sets` that the text holds. */
function named(text, sets = Object.keys(TEXT_PREFIXES)) {
  return sets.flatMap((set) =>
    TEXT_PREFIXES[set].filter((p) => text.includes(p)).map((p) => [set, p]),
  );
}

/** The set of a path relative to its checkout, or null. */
function setOf(rel) {
  if (/^(?:packages|apps)\//.test(rel)) return "deliverable";
  if (/^(?:\.orivilo|\.quality-gate)(?:\/|$)/.test(rel)) return "record";
  return GUARD_PATH.test(rel) ? "guard file" : null;
}

/** {set, rel, checkout, isMain} for a lowercased absolute path inside a checkout of this project. */
function classify(path, mainLow) {
  if (path !== mainLow && !path.startsWith(`${mainLow}/`)) return null;
  let rest = path.slice(mainLow.length);
  let checkout = mainLow;
  const worktree = /^\/\.claude\/worktrees\/([^/]+)(\/.*)?$/.exec(rest);
  if (worktree) {
    checkout = `${mainLow}/.claude/worktrees/${worktree[1]}`;
    rest = worktree[2] ?? "";
  }
  const rel = rest.replace(/^\//, "");
  const set = setOf(rel);
  return set ? { set, rel, checkout, isMain: checkout === mainLow } : null;
}

/** The path with its nearest existing folder resolved through realpath (links followed). */
function resolveReal(abs) {
  let existing = abs;
  const rest = [];
  for (;;) {
    try {
      lstatSync(existing);
      break;
    } catch {
      rest.unshift(basename(existing));
      const up = dirname(existing);
      if (up === existing) break;
      existing = up;
    }
  }
  return join(realpathSync(existing), ...rest);
}

/** The shared context of one call: the main checkout and a lazy read of the run records. */
function context(input) {
  const main = recordsRoot(process.env.CLAUDE_PROJECT_DIR || input.cwd);
  let tasks;
  return {
    main,
    mainLow: main.toLowerCase(),
    tasks: () => (tasks ??= allTasks(main)),
  };
}

/** The open envelope this subagent is bound to, or undefined. */
const boundTask = (input, ctx) =>
  ctx.tasks().find((t) => t.agent?.agent_id === input.agent_id && isOpen(t));

/** The screenshots folder (lowercase, ends with /) of a qa or designer bound to an open envelope, or null. */
function ownScreenshots(input, ctx) {
  const task = boundTask(input, ctx);
  if (!task || !["qa", "designer"].includes(task.envelope.role)) return null;
  return `${ctx.mainLow}/.orivilo/runs/${task.issue}/${task.id}/screenshots/`.toLowerCase();
}

/** A bound builder whose open envelope lists the exact path in `write_set` (a glob grants nothing). */
function builderGrant(input, ctx, c) {
  const task = boundTask(input, ctx);
  if (task?.envelope.role !== "builder") return false;
  try {
    if (realpathSync(task.envelope.worktree).toLowerCase() !== c.checkout) return false;
  } catch {
    return false;
  }
  return task.envelope.write_set.some(
    (entry) => !/[*?[\]{}()!+@]/.test(entry) && entry.toLowerCase() === c.rel,
  );
}

/** The reasons to block one resolved path of a tool write (empty to allow). */
function judgePath(input, ctx, path) {
  const c = classify(path, ctx.mainLow);
  if (c === null) return [];
  const mainSession = input.agent_id == null;
  if (c.set === "deliverable") return mainSession ? [MESSAGES.deliverable(c.rel)] : [];
  if (c.set === "guard file") {
    return !mainSession && builderGrant(input, ctx, c) ? [] : [MESSAGES["guard file"](c.rel)];
  }
  if (mainSession && ["Write", "Edit"].includes(input.tool_name) && c.isMain && c.rel === HANDOFF) {
    return [];
  }
  if (!mainSession) {
    const folder = ownScreenshots(input, ctx);
    if (folder && new RegExp(`^${escapeRegExp(folder)}[a-z0-9][a-z0-9._-]*\\.png$`).test(path))
      return [];
  }
  return [MESSAGES.record(c.rel)];
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function judgeToolWrite(input, target) {
  let abs;
  if (isAbsolute(target)) {
    abs = resolve(target);
  } else {
    if (typeof input.cwd !== "string" || input.cwd === "" || !existsSync(input.cwd)) {
      throw new Error("the path is relative and its working directory cannot be resolved");
    }
    abs = resolve(input.cwd, target);
  }
  const ctx = context(input);
  const paths = new Set([abs.toLowerCase(), resolveReal(abs).toLowerCase()]);
  return [...new Set([...paths].flatMap((p) => judgePath(input, ctx, p)))];
}

// ---- Bash ----

const BEFORE = String.raw`(?:^|[\s;&|(\`])`;
const WRITE_FORMS = [
  new RegExp(`${BEFORE}(?:tee|cp|mv|rm|ln|touch)(?:\\s|$)`),
  new RegExp(`${BEFORE}sed(?=\\s)[^;&|]*\\s-(?:[a-z]*i|-in-place)`),
  new RegExp(`${BEFORE}git\\s[^;&|]*\\b(?:apply|restore)\\b`),
  new RegExp(`${BEFORE}git\\s[^;&|]*\\bcheckout\\b[^;&|]*\\s--(?:\\s|$)`),
];

/** True when the text holds a subagent write form: a redirect to a file, or one of the write commands. */
function hasWriteForm(text) {
  const withoutFds = text
    .replace(/\d*>&(?:\d+|-)/g, "")
    .replace(/&>\s*\/dev\/null/g, "")
    .replace(/\d*>>?\s*\/dev\/null/g, "");
  return withoutFds.includes(">") || WRITE_FORMS.some((re) => re.test(text));
}

/** Splits a command into words, honouring quotes. Null when a newline or backslash is outside them. */
function words(command) {
  const out = [];
  let current = "";
  let started = false;
  let quote = null;
  for (const ch of command) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
    } else if (ch === "\n" || ch === "\\") {
      return null;
    } else if (/\s/.test(ch)) {
      if (started) out.push(current);
      current = "";
      started = false;
    } else {
      current += ch;
      started = true;
    }
  }
  if (quote) return null;
  if (started) out.push(current);
  return out;
}

const READERS = new Set(["cat", "ls", "head", "jq", "grep"]);
const GIT_READS = new Set(["diff", "log", "show", "status"]);

/** Form (a): plain reads joined only by pipes into one another. */
function isPlainRead(command) {
  const cmd = command.trim();
  if (/[;&`]|\$\(|>|--output|\n/.test(cmd)) return false;
  return cmd.split("|").every((segment) => {
    const w = words(segment.trim());
    if (!w || w.length === 0) return false;
    if (w[0] === "git") return GIT_READS.has(w[w[1] === "-C" ? 3 : 1]);
    return READERS.has(w[0]);
  });
}

const ARGS = String.raw`(?:\s+[A-Za-z0-9_@%+=:,./~-]+)*`;
const TARGET = String.raw`scripts/(?:ovl/[a-z-]+|quality-gate)\.mjs`;
const NODE_RUNS = [
  new RegExp(String.raw`^node\s+"([^"]*?)${TARGET}"${ARGS}$`),
  new RegExp(String.raw`^node\s+'([^']*?)${TARGET}'${ARGS}$`),
  new RegExp(String.raw`^node\s+(\S*?)${TARGET}${ARGS}$`),
];
const PNPM_RUN = new RegExp(String.raw`^pnpm(?:\s+run)?\s+quality-gate${ARGS}$`);

/** Form (b): a whole script run from a checkout of this project. */
function isAllowedRun(command, ctx) {
  const cmd = command.trim();
  if (PNPM_RUN.test(cmd)) return true;
  for (const re of NODE_RUNS) {
    const match = re.exec(cmd);
    if (!match) continue;
    if (match[1] === "") return true;
    if (!match[1].endsWith("/")) return false;
    const dir = match[1].slice(0, -1).toLowerCase();
    const worktrees = `${ctx.mainLow}/.claude/worktrees/`;
    return (
      dir === ctx.mainLow ||
      (dir.startsWith(worktrees) && !dir.slice(worktrees.length).includes("/"))
    );
  }
  return false;
}

/** Form (c): exactly one whole git add, commit or push. */
function isWholeGitWrite(command) {
  const cmd = command.trim();
  if (/[;|&<>`\\]|\$\(/.test(cmd)) return false;
  const w = words(cmd);
  if (!w || w[0] !== "git") return false;
  const at = w[1] === "-C" ? 3 : 1;
  const sub = w[at];
  if (!["add", "commit", "push"].includes(sub)) return false;
  const args = w.slice(at + 1);
  if (sub === "add") return true;
  const rest = [];
  let message = false;
  for (let i = 0; i < args.length; i++) {
    if (/^-[a-zA-Z]*m$/.test(args[i])) {
      message = true;
      i += 1;
    } else {
      rest.push(args[i]);
    }
  }
  if (sub === "commit" && !message && !rest.includes("-F")) return false;
  return named([...w.slice(0, at), ...rest].join(" ").toLowerCase()).length === 0;
}

/** The PNG exception: one cp, mv or redirect that writes only PNGs inside the writer's own folder. */
function isOwnScreenshotWrite(text, folder) {
  if (/[;&|`\n]|\$\(/.test(text)) return false;
  const residue = text
    .trim()
    .replace(new RegExp(`${escapeRegExp(folder)}[a-z0-9][a-z0-9._-]*\\.png`, "g"), "@png@");
  if (named(residue, ["guard file", "record"]).length > 0) return false;
  if (/^(?:cp|mv)\s+(?:-\S+\s+)*.+?\s+@png@$/.test(residue)) return true;
  const redirect = /^([^>]*?)\s*>>?\s*@png@$/.exec(residue);
  return redirect !== null && !hasWriteForm(redirect[1]);
}

const OWNER_CLOSE =
  "the owner's close runs only from the owner's own terminal, outside Claude Code";
const MAIN_ONLY_CLOSE = "only the main session closes an envelope";

function judgeBash(input, command) {
  const text = command.replace(/["'\\]/g, "").toLowerCase();
  const subagent = input.agent_id != null;
  const closes = new RegExp(`${BEFORE}node\\s+\\S*close-envelope\\.mjs`).test(text);
  if (closes && text.includes("--owner")) return [OWNER_CLOSE];
  if (closes && subagent) return [MAIN_ONLY_CLOSE];
  const names = named(text, subagent ? ["guard file", "record"] : undefined);
  if (names.length === 0) return [];
  const list = names.map(([set, prefix]) => `${set} ${prefix}`).join(", ");
  if (subagent) {
    if (!hasWriteForm(text)) return [];
    const ctx = context(input);
    const folder = ownScreenshots(input, ctx);
    if (folder && isOwnScreenshotWrite(text, folder)) return [];
    return [
      `a write form names ${list}: guard files change only by Write or Edit from a bound builder, records only by hooks and scripts`,
    ];
  }
  if (isPlainRead(command) || isWholeGitWrite(command) || isAllowedRun(command, context(input))) {
    return [];
  }
  return [
    `the command names ${list} and is neither a plain read, a whole script run nor one whole git add, commit or push`,
  ];
}

// ---- entry ----

function decide(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("hook input is not a JSON object");
  }
  const tool = input.tool_name;
  if (tool === "Bash") {
    const command = input.tool_input?.command;
    if (typeof command !== "string" || command === "") throw new Error("Bash input has no command");
    return judgeBash(input, command);
  }
  const field = PATH_FIELD[tool];
  if (field === undefined) {
    throw new Error("tool_name is not Write, Edit, MultiEdit, NotebookEdit or Bash");
  }
  const target = input.tool_input?.[field];
  if (typeof target !== "string" || target === "") throw new Error(`${tool} input has no ${field}`);
  return judgeToolWrite(input, target);
}

/** One heartbeat line, only when the call's cwd belongs to this project's repo. */
function heartbeat(input, decision) {
  if (input === null || typeof input !== "object") return;
  try {
    const store = recordsRoot(input.cwd);
    if (store === recordsRoot(process.env.CLAUDE_PROJECT_DIR)) {
      beat(store, "write-guard", input, decision);
    }
  } catch {
    // No store to write to (cwd outside a checkout, or its worktree is gone): the verdict stands.
  }
}

/** Returns {code, stderr}: 2 to block or on any error, 0 to allow. */
export function judge(raw) {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return { code: 2, stderr: "write-guard failed closed: stdin is not valid JSON" };
  }
  let reasons;
  try {
    reasons = decide(input);
  } catch (error) {
    heartbeat(input, "error");
    return { code: 2, stderr: `write-guard failed closed: ${error.message}` };
  }
  heartbeat(input, reasons.length > 0 ? "block" : "allow");
  return reasons.length > 0
    ? { code: 2, stderr: `write-guard blocked:\n- ${reasons.join("\n- ")}` }
    : { code: 0, stderr: "" };
}

/** Entry point of the hook script: reads stdin, prints the reason on stderr, exits. */
export function runWriteGuard() {
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
