// The write-guard check (ORV-93, ORV-81 spec Hooks). Reads PreToolUse input for Write, Edit,
// MultiEdit, NotebookEdit and Bash and keeps three protected sets out of reach:
//   deliverable  packages/, apps/                       the main session is blocked, subagents may write
//   guard file   .claude/hooks/, .claude/settings*.json, scripts/ovl/, scripts/quality-gate.mjs,
//                .github/workflows/, the root .gitignore   every session is blocked, except a bound
//                                                           builder's tool write to a path its open envelope lists
//   record       .orivilo/, .quality-gate/                 every session is blocked, except the main
//                session's Write or Edit of .orivilo/handoff.md and a qa or designer's own screenshot PNG
// The verdict is a deterministic path and text rule, never a model. Tool paths are judged after they are
// made absolute and resolved through realpath, lowercased. Bash is judged two ways, neither a sandbox:
// a text rule (quotes and backslashes removed, lowercased) for a protected name the text spells out, and
// rule resolve-1 (ORV-138 spec) for the write targets that scripts/ovl/shell-words.mjs (shell-1) reads
// from the call. Every non-zero exit is 2; anything unexpected fails closed.
// stderr and the heartbeat never hold file content or a whole command (the heartbeat is beat()'s six fields).
import { existsSync, lstatSync, readFileSync, realpathSync, writeSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { beat, recordsRoot } from "./hook.mjs";
import { allTasks, isOpen } from "./records.mjs";
import { readShell } from "./shell-words.mjs";

const PATH_FIELD = {
  Write: "file_path",
  Edit: "file_path",
  MultiEdit: "file_path",
  NotebookEdit: "notebook_path",
};

/** How Bash names each set: a folder or file name in the lowercased command text, see named(). */
const TEXT_PREFIXES = {
  deliverable: ["packages", "apps"],
  "guard file": [
    ".claude/hooks",
    ".claude/settings",
    "scripts/ovl",
    "scripts/quality-gate.mjs",
    ".github/workflows",
    ".gitignore",
  ],
  record: [".orivilo", ".quality-gate"],
};

export const GUARD_PATH =
  /^(?:\.claude\/hooks\/|\.claude\/settings[^/]*\.json$|scripts\/ovl\/|scripts\/quality-gate\.mjs$|\.github\/workflows\/|\.gitignore$)/;

const HANDOFF = ".orivilo/handoff.md";

const MESSAGES = {
  deliverable: (where) =>
    `deliverable ${where}: the main session does not edit deliverables; dispatch a builder envelope`,
  "guard file": (where) =>
    `guard file ${where}: only a builder whose open envelope lists the exact path may write it, by a tool write (Write, Edit, MultiEdit or NotebookEdit)`,
  record: (where) => `record ${where}: only hooks and the scripts in scripts/ovl/ write records`,
};

/** Prefixes that name a folder: matched as a whole name, with or without the closing slash. */
const FOLDERS = new Set(["packages", "apps", ".claude/hooks", "scripts/ovl", ".github/workflows"]);

/** The text with repeated slashes collapsed and `./` segments dropped, so `a//b` and `a/./b` read as `a/b`. */
const collapsePath = (text) => {
  let out = text.replace(/\/+/g, "/");
  for (let prev = ""; prev !== out;) {
    prev = out;
    out = out.replace(/\/\.\//g, "/");
  }
  return out;
};

/** [[set, prefix]] for every name of `sets` that the text holds, as a whole name (not followed by a name character). */
function named(text, sets = Object.keys(TEXT_PREFIXES)) {
  const flat = collapsePath(text);
  return sets.flatMap((set) =>
    TEXT_PREFIXES[set]
      .filter((p) =>
        FOLDERS.has(p) ? new RegExp(`${escapeRegExp(p)}(?![\\w.-])`).test(flat) : flat.includes(p),
      )
      .map((p) => [set, p]),
  );
}

/** The set of a path relative to its checkout, or null. */
function setOf(rel) {
  if (/^(?:packages|apps)\//.test(rel)) return "deliverable";
  if (/^(?:\.orivilo|\.quality-gate)(?:\/|$)/.test(rel)) return "record";
  return GUARD_PATH.test(rel) ? "guard file" : null;
}

/** {rel, checkout} for a lowercased absolute path inside a checkout of this project (the main one or a worktree), or null. */
function checkoutRel(path, mainLow) {
  if (path !== mainLow && !path.startsWith(`${mainLow}/`)) return null;
  let rest = path.slice(mainLow.length);
  let checkout = mainLow;
  const worktree = /^\/\.claude\/worktrees\/([^/]+)(\/.*)?$/.exec(rest);
  if (worktree) {
    checkout = `${mainLow}/.claude/worktrees/${worktree[1]}`;
    rest = worktree[2] ?? "";
  }
  return { rel: rest.replace(/^\//, ""), checkout };
}

/** {set, rel, checkout, isMain} for a lowercased absolute path inside a checkout of this project. */
function classify(path, mainLow) {
  const inside = checkoutRel(path, mainLow);
  if (inside === null) return null;
  const set = setOf(inside.rel);
  return set ? { set, ...inside, isMain: inside.checkout === mainLow } : null;
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
  new RegExp(`${BEFORE}git\\s[^;&|]*\\b(?:checkout|switch|stash|reset)\\b`),
];

/** The text without the redirects that write no file: fd copies and the null device. */
const withoutFds = (text) =>
  text
    .replace(/\d*>&(?:\d+|-)/g, "")
    .replace(/&>\s*\/dev\/null(?![\w./-])/g, "")
    .replace(/\d*>>?\s*\/dev\/null(?![\w./-])/g, "");

/**
 * The command with the inside of quotes and backslash escapes blanked to `_` (same length), so a
 * `>` or `|` left in it is a real shell character. From the first `$(` or backtick that can run,
 * nothing is blanked: a command inside it is read as it is.
 */
function blankQuoted(command) {
  let out = "";
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (ch === "$" ? command[i + 1] === "(" : ch === "`") {
      return out + command.slice(i);
    }
    if (ch === "\\") {
      out += command[i + 1] === "\n" ? "_\n" : "_".repeat(Math.min(2, command.length - i));
      i += 1;
    } else if (ch === "'") {
      const end = command.indexOf("'", i + 1);
      const stop = end < 0 ? command.length : end;
      out += `'${"_".repeat(stop - i - 1)}${end < 0 ? "" : "'"}`;
      i = stop;
    } else if (ch === '"') {
      let j = i + 1;
      while (j < command.length && command[j] !== '"') j += command[j] === "\\" ? 2 : 1;
      j = Math.min(j, command.length);
      const inside = command.slice(i + 1, j);
      if (/\$\(|`/.test(inside)) return out + command.slice(i);
      out += `"${"_".repeat(inside.length)}${j < command.length ? '"' : ""}`;
      i = j;
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * True when the text holds a subagent write form: a redirect to a file, or one of the write
 * commands. `shape` is the same command through blankQuoted, where a quoted `>` is not a redirect.
 */
function hasWriteForm(text, shape = text) {
  return withoutFds(shape).includes(">") || WRITE_FORMS.some((re) => re.test(text));
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

const READERS = new Set(["cat", "ls", "head", "tail", "wc", "jq", "grep"]);
const GIT_READS = new Set(["diff", "log", "show", "status"]);

/** `sed -n` with a line range or one /pattern/ and the p command, then only files: it prints and writes nothing. */
const isSedPrint = (w) =>
  w[1] === "-n" &&
  /^(?:(?:\d+|\$)(?:,(?:\d+|\$))?|\/[^/]*\/)p$/.test(w[2] ?? "") &&
  w.slice(3).every((arg) => !arg.startsWith("-"));

/** Form (a): plain reads joined only by pipes into one another (a pipe or `>` inside quotes is no pipe or redirect). */
function isPlainRead(command) {
  const cmd = command.trim();
  const shape = blankQuoted(cmd);
  if (/[;&`<>\r\n]|\$\(/.test(withoutFds(shape)) || cmd.includes("--output")) return false;
  const segments = [];
  let from = 0;
  for (let i = 0; i <= shape.length; i++) {
    if (i === shape.length || shape[i] === "|") {
      segments.push(cmd.slice(from, i));
      from = i + 1;
    }
  }
  return segments.every((segment) => {
    const w = words(segment.trim());
    if (!w || w.length === 0) return false;
    if (w[0] === "git") return GIT_READS.has(w[w[1] === "-C" ? 3 : 1]);
    if (w[0] === "sed") return isSedPrint(w);
    return READERS.has(w[0]);
  });
}

const ARGS = String.raw`(?:[ \t]+[A-Za-z0-9_@%+=:,./~-]+)*`;
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
  if (/[\r\n]/.test(cmd)) return false;
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

// ---- resolve-1 (ORV-138 spec): the write targets of a call, as shell-words reads them ----

/** The programs whose path arguments are write targets (clause (a)); sed needs `-i`, git a write subcommand. */
const WRITE_PROGRAMS = new Set(["tee", "cp", "mv", "rm", "ln", "touch"]);
const GIT_WRITES = new Set(["apply", "restore", "checkout", "switch", "stash", "reset"]);
const SED_IN_PLACE = /^-(?:[a-z]*i|-in-place)/;

/** The protected name prefixes (relative to a checkout) of `sets`. */
const prefixesOf = (sets) => sets.flatMap((set) => TEXT_PREFIXES[set]);

/** True when the lowercased path `rel` (relative to a checkout) is in a protected set, or is its own folder. */
const inSet = (rel, sets) => sets.includes(setOf(rel)) || sets.includes(setOf(`${rel}/_`));

/** (c) The literal path `abs` lies inside a protected set, on the text or through realpath. */
function literalHits(abs, ctx, sets) {
  return [abs, resolveReal(abs)].some((p) => {
    const inside = checkoutRel(p.toLowerCase(), ctx.mainLow);
    return inside !== null && inSet(inside.rel, sets);
  });
}

/**
 * (d) glob: could a path that begins with the lowercased absolute text `p` (its last name may be only
 * the start of one) be protected? Yes when a checkout begins with `p`, when `p` lies inside a
 * protected set, or when a protected path begins with it.
 */
function globBegins(p, ctx, sets) {
  if ([`${ctx.mainLow}/`, `${ctx.mainLow}/.claude/worktrees/`].some((x) => x.startsWith(p))) {
    return true;
  }
  const inside = checkoutRel(p, ctx.mainLow);
  if (inside === null) return false;
  return (
    inSet(inside.rel, sets) ||
    prefixesOf(sets).some((q) => q.startsWith(inside.rel)) ||
    (sets.includes("guard file") && /^\.claude\/settings[^/]*$/.test(inside.rel))
  );
}

/** (d) glob: the target's path with `.` and `..` collapsed, a glob name counting as one name. */
function globHits(base, word, ctx, sets) {
  const stack = word.fixed.startsWith("/")
    ? []
    : base
        .split("/")
        .filter(Boolean)
        .map((fixed) => ({ fixed, glob: false }));
  for (const part of word.parts) {
    if (part.glob || (part.fixed !== "" && part.fixed !== "." && part.fixed !== "..")) {
      stack.push(part);
    } else if (part.fixed === "..") stack.pop();
  }
  const at = stack.findIndex((part) => part.glob);
  // The glob name was collapsed away by a `..`: what is left is a literal path.
  if (at < 0) return literalHits(`/${stack.map((p) => p.fixed).join("/")}`, ctx, sets);
  const names = [...stack.slice(0, at), stack[at]].map((p) => p.fixed);
  const text = `/${names.join("/")}`;
  const cut = text.lastIndexOf("/") + 1;
  const real = `${resolveReal(text.slice(0, cut)).replace(/\/$/, "")}/${text.slice(cut)}`;
  return [text, real].some((p) => globBegins(p.toLowerCase(), ctx, sets));
}

/** (d) any: the folder the fixed part names lies inside a checkout or above one. */
function anyHits(abs, endsInSlash, ctx) {
  const dir = endsInSlash ? abs : dirname(abs);
  return [dir, resolveReal(dir)].some((p) => {
    const low = p.toLowerCase();
    return (
      checkoutRel(low, ctx.mainLow) !== null || ctx.mainLow.startsWith(low.replace(/\/$/, "") + "/")
    );
  });
}

/**
 * Does one write target, a word with the folders its segment may run in (null = unknown), reach a
 * protected set (clauses (c) to (e))? An absolute target needs no base; any other with an unknown base
 * is blocked.
 */
function targetHits(word, folders, ctx, sets) {
  if (word.kind === "any" && word.fixed === "") return true;
  const absolute = word.fixed.startsWith("/");
  if (!absolute && folders === null) return true;
  return (absolute ? [""] : folders).some((base) => {
    const abs = absolute ? resolve(word.fixed) : resolve(base, word.fixed);
    if (word.kind === "none") return literalHits(abs, ctx, sets);
    if (word.kind === "glob") return globHits(base, word, ctx, sets);
    return anyHits(abs, word.fixed.endsWith("/"), ctx);
  });
}

/** An option word that carries a value (`--target-directory=<folder>`), as a word of that value; else null. */
function optionValue(word) {
  const at = word.parts[0].fixed.indexOf("=");
  if (at < 0) return null;
  const parts = [
    { ...word.parts[0], fixed: word.parts[0].fixed.slice(at + 1) },
    ...word.parts.slice(1),
  ];
  return { ...word, fixed: word.fixed.slice(word.fixed.indexOf("=") + 1), parts };
}

/** The path arguments of a write program: every word that is no option, and the value of an option word. */
function pathArguments(args) {
  const out = [];
  let ended = false;
  for (const word of args) {
    if (!ended && word.fixed === "--" && word.kind === "none") ended = true;
    else if (ended || !word.fixed.startsWith("-")) out.push(word);
    else {
      const value = optionValue(word);
      if (value !== null) out.push(value);
    }
  }
  return out;
}

/**
 * The write targets of one segment of the call: {word, folders} (folders: the folders it is judged
 * from, null when unknown). A redirect is judged from the segment's effective cwd; a path argument of a
 * write program too, with git's -C applied, and from an unknown folder under `env -C`, `--git-dir`,
 * `--work-tree` or a GIT_DIR or GIT_WORK_TREE assignment.
 */
function segmentTargets(segment) {
  const targets = segment.writeTargets.map((word) => ({ word, folders: segment.cwd }));
  if (segment.command === null) return targets;
  const args = segment.commandWords.slice(1);
  let unknownBase = segment.envChdir.length > 0 || segment.gitEnv.length > 0;
  let folders = segment.cwd;
  let list = null;
  if (WRITE_PROGRAMS.has(segment.command)) list = args;
  else if (
    segment.command === "sed" &&
    args.some((a) => a.kind === "none" && SED_IN_PLACE.test(a.fixed.toLowerCase()))
  ) {
    list = args;
  } else if (segment.command === "git") {
    let at = 0;
    for (; at < args.length && args[at].fixed.startsWith("-"); at++) {
      const option = args[at].kind === "none" ? args[at].fixed : "";
      if (option === "-C") {
        const value = args[++at];
        if (value === undefined || folders === null) continue;
        // `-C ""` resolves to the folder itself, which is what git does.
        folders =
          value.kind === "none" ? [...new Set(folders.map((f) => resolve(f, value.fixed)))] : null;
      } else if (option === "-c") at++;
      else if (/^--(?:git-dir|work-tree)(?:=|$)/.test(option)) {
        unknownBase = true;
        if (!option.includes("=")) at++;
      }
    }
    const sub = args[at]?.kind === "none" ? args[at].fixed.toLowerCase() : null;
    if (GIT_WRITES.has(sub)) list = args.slice(at + 1);
  }
  if (list === null) return targets;
  for (const word of pathArguments(list)) {
    targets.push({ word, folders: unknownBase ? null : folders });
  }
  return targets;
}

/**
 * resolve-1: true when a write target of the call reaches a protected set of `sets`. The targets are
 * the redirect targets and the path arguments of a write program, read by shell-words.
 */
function writesProtectedPath(input, command, sets) {
  const { segments } = readShell(command, { cwd: input.cwd });
  const ctx = context(input);
  return segments.some((segment) =>
    segmentTargets(segment).some(({ word, folders }) => targetHits(word, folders, ctx, sets)),
  );
}

const OWNER_CLOSE =
  "the owner's close runs only from the owner's own terminal, outside Claude Code";
const MAIN_ONLY_CLOSE = "only the main session closes an envelope";
const HIDDEN = "a protected path through an expansion, a cd or the working directory";

function judgeBash(input, command) {
  const text = command.replace(/["'\\]/g, "").toLowerCase();
  const subagent = input.agent_id != null;
  const closes = new RegExp(`${BEFORE}node\\s+\\S*close-envelope\\.mjs`).test(text);
  if (closes && text.includes("--owner")) return [OWNER_CLOSE];
  if (closes && subagent) return [MAIN_ONLY_CLOSE];
  const sets = subagent ? ["guard file", "record"] : Object.keys(TEXT_PREFIXES);
  const names = named(text, sets);
  let list = names.map(([set, prefix]) => `${set} ${prefix}`).join(", ");
  if (subagent && names.length > 0) {
    // The screenshot exception comes before resolve-1 is read (resolve-1 (f)); then the ORV-93 text rule.
    const folder = ownScreenshots(input, context(input));
    if (folder && isOwnScreenshotWrite(text, folder)) return [];
    if (!hasWriteForm(text, blankQuoted(command).toLowerCase())) {
      if (!writesProtectedPath(input, command, sets)) return [];
      list = HIDDEN;
    }
  } else if (names.length === 0) {
    if (!writesProtectedPath(input, command, sets)) return [];
    list = HIDDEN;
  }
  if (subagent) {
    return [
      `a write form names ${list}: guard files change only by a tool write (Write, Edit, MultiEdit or NotebookEdit) from a bound builder, records only by hooks and scripts`,
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
