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
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, normalize, resolve } from "node:path";
import { beat, recordsRoot } from "./hook.mjs";
import { allTasks, isOpen } from "./records.mjs";

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

// ---- expand-1 (ORV-96): a path the text does not spell out ----

/** The index after the `)` that closes a heredoc opened by match `m`, or -1 when its first X line is not followed by `)`. */
function heredocEnd(command, m) {
  let pos = m.index + m[0].length;
  while (pos <= command.length) {
    const eol = command.indexOf("\n", pos);
    const line = command.slice(pos, eol < 0 ? command.length : eol);
    if ((m[1] ? line.replace(/^\t+/, "") : line) === m[3]) {
      const close = /^\s*\)/.exec(command.slice(pos + line.length));
      return close ? pos + line.length + close[0].length : -1;
    }
    if (eol < 0) return -1;
    pos = eol + 1;
  }
  return -1;
}

/**
 * heredoc-1: every `$(cat <<'X'` ... `X` ... `)` with a quoted delimiter, whose body ends at the
 * first line that is exactly X and whose `)` follows, becomes one plain letter. Claude Code's
 * commit and PR body forms; an unquoted delimiter, or anything else around X, is left as it is.
 */
function withoutHeredocs(command) {
  const open = /\$\(\s*cat\s+<<(-?)\s*(['"])([A-Za-z_]\w*)\2[ \t]*\n/g;
  let out = "";
  let from = 0;
  for (let m = open.exec(command); m !== null; m = open.exec(command)) {
    const end = heredocEnd(command, m);
    if (end < 0) continue;
    out += `${command.slice(from, m.index)}x`;
    from = end;
    open.lastIndex = end;
  }
  return out + command.slice(from);
}

/**
 * The command as segments of words (split at `;`, `&`, `|`, `(`, `)` and newlines), each word
 * {raw, fixed, expands, redirect}: `fixed` is the text before the first character that expands
 * (`?`, `*`, `[` or `{` outside any quotes, `$` or a backtick outside single quotes), `redirect`
 * says the word follows `<` or `>`. A `$(` or backtick substitution is entered, so a command
 * inside it makes its own segments.
 */
function shellWords(command) {
  const segments = [[]];
  const subs = [];
  let quote = null;
  let word = null;
  let redirect = false;
  const begin = () => {
    word ??= { raw: "", fixed: "", expands: false, redirect };
    redirect = false;
    return word;
  };
  const literal = (ch, raw = ch) => {
    const w = begin();
    w.raw += raw;
    if (!w.expands) w.fixed += ch;
  };
  const expand = (ch) => {
    const w = begin();
    w.raw += ch;
    w.expands = true;
  };
  const endWord = () => {
    if (word) segments.at(-1).push(word);
    word = null;
  };
  const endSegment = () => {
    endWord();
    if (segments.at(-1).length > 0) segments.push([]);
  };
  const open = (kind) => {
    endSegment();
    subs.push({ kind, depth: 0, quote, word });
    word = null;
    quote = null;
  };
  const close = () => {
    endSegment();
    ({ quote, word } = subs.pop());
  };
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    const next = command[i + 1];
    const top = subs.at(-1);
    if (quote === "'") {
      if (ch === "'") quote = null;
      else literal(ch);
    } else if (ch === "`") {
      if (top?.kind === "tick" && quote === null) {
        close();
      } else {
        expand(ch);
        open("tick");
      }
    } else if (ch === "$") {
      expand(ch);
      if (next === "(") {
        i += 1;
        open("paren");
      }
    } else if (quote === '"') {
      if (ch === '"') quote = null;
      else if (ch === "\\" && next !== undefined && '$`"\\'.includes(next)) {
        literal(next);
        i += 1;
      } else literal(ch);
    } else if (ch === "\\") {
      if (next === "\n") i += 1;
      else if (next !== undefined) {
        literal(next, `\\${next}`);
        i += 1;
      }
    } else if (ch === "'" || ch === '"') {
      begin().raw += ch;
      quote = ch;
    } else if (ch === ")" && top?.kind === "paren" && top.depth === 0) {
      close();
    } else if (";&|\n()".includes(ch)) {
      if (top?.kind === "paren") top.depth += ch === "(" ? 1 : ch === ")" ? -1 : 0;
      endSegment();
    } else if (ch === "<" || ch === ">") {
      endWord();
      redirect = true;
    } else if (/\s/.test(ch)) {
      endWord();
    } else if ("?*[{".includes(ch)) {
      expand(ch);
    } else {
      literal(ch);
    }
  }
  endWord();
  return segments;
}

/** Words that are shell syntax, not a glob, even though they hold `{`, `}`, `[` or `]`. */
const SYNTAX_WORDS = new Set(["{", "}", "[", "]", "[[", "]]"]);
const RESERVED = new Set(["!", "{", "then", "do", "else", "elif", "if", "while", "until", "time"]);
const CD_COMMANDS = new Set(["cd", "pushd", "popd"]);

/** The protected name prefixes (relative to a checkout) of `sets`. */
const prefixesOf = (sets) => sets.flatMap((set) => TEXT_PREFIXES[set]);

/**
 * Could a path that begins with the lowercased absolute text `p` (its last part may be the start of a name)
 * land in a protected set of `sets`? Yes when `p` is at or above a checkout, names a checkout root's
 * own entry, lies inside a protected set, or begins the name of a protected path.
 */
function reaches(p, ctx, sets) {
  if ([`${ctx.mainLow}/`, `${ctx.mainLow}/.claude/worktrees/`].some((x) => x.startsWith(p))) {
    return true;
  }
  const inside = checkoutRel(p, ctx.mainLow);
  if (inside === null) return false;
  const cut = inside.rel.lastIndexOf("/");
  if (cut < 0) return true;
  return (
    sets.includes(setOf(`${inside.rel.slice(0, cut)}/_`)) ||
    prefixesOf(sets).some((q) => q.startsWith(inside.rel))
  );
}

/** expand-1 (a): could the fixed part of an expansion word, from the folder `cur`, begin a protected path? */
function wordReaches(fixed, cur, ctx, sets) {
  let text = fixed;
  if (text.startsWith("~")) {
    if (text !== "~" && !text.startsWith("~/")) return true;
    text = homedir() + text.slice(1);
  }
  if (text === "") return true;
  const abs = normalize(isAbsolute(text) ? text : `${cur}/${text}`);
  const slash = abs.endsWith("/");
  const dir = slash ? abs.slice(0, -1) || "/" : dirname(abs);
  const partial = slash ? "" : basename(abs);
  const real = `${resolveReal(dir).replace(/\/$/, "")}/${partial}`;
  return [abs, real].some((p) => reaches(p.toLowerCase(), ctx, sets));
}

/** expand-1 (b) and (c): does the folder `path` lie inside a protected set, or above one inside a checkout? */
function folderReaches(path, ctx, sets, { ancestors }) {
  return [path, resolveReal(path)].some((p) => {
    const inside = checkoutRel(p.toLowerCase(), ctx.mainLow);
    if (inside === null) return false;
    return (
      sets.includes(setOf(`${inside.rel}/_`)) ||
      (ancestors &&
        inside.rel !== "" &&
        prefixesOf(sets).some((q) => q.startsWith(`${inside.rel}/`)))
    );
  });
}

/**
 * expand-1: true when the call holds a write form and names a protected path some way the text
 * does not spell out: (a) an expansion word that could begin one, (b) a cd, pushd or popd that
 * moves into one or cannot be followed, (c) a working directory inside one. A cwd or a cd target
 * that cannot be resolved counts as (a) (fail closed).
 */
function hidesProtectedPath(input, command, sets) {
  const flat = withoutHeredocs(command);
  const text = flat.replace(/["'\\]/g, "").toLowerCase();
  if (!hasWriteForm(text, blankQuoted(flat).toLowerCase())) return false;
  if (typeof input.cwd !== "string" || input.cwd === "" || !existsSync(input.cwd)) return true;
  const ctx = context(input);
  let cur = resolve(input.cwd);
  if (folderReaches(cur, ctx, sets, { ancestors: false })) return true;
  for (const segment of shellWords(flat)) {
    const words = segment.filter((w) => !w.redirect);
    for (const w of segment) {
      if (w.expands && !SYNTAX_WORDS.has(w.raw) && wordReaches(w.fixed, cur, ctx, sets)) {
        return true;
      }
    }
    let at = 0;
    while (
      at < words.length &&
      !words[at].expands &&
      (/^[A-Za-z_]\w*=/.test(words[at].raw) || RESERVED.has(words[at].raw))
    ) {
      at += 1;
    }
    if (!CD_COMMANDS.has(words[at]?.raw)) continue;
    const args = words.slice(at + 1);
    while (args.length > 0 && args[0].fixed.startsWith("-") && args[0].fixed !== "-") {
      if (args.shift().fixed === "--") break;
    }
    const target = args[0];
    if (target === undefined || target.expands || target.fixed === "-") return true;
    let dir = target.fixed;
    if (dir.startsWith("~")) {
      if (dir !== "~" && !dir.startsWith("~/")) return true;
      dir = homedir() + dir.slice(1);
    }
    cur = resolve(cur, dir);
    if (folderReaches(cur, ctx, sets, { ancestors: true })) return true;
  }
  return false;
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
  const sets = subagent ? ["guard file", "record"] : Object.keys(TEXT_PREFIXES);
  const names = named(text, sets);
  let list = names.map(([set, prefix]) => `${set} ${prefix}`).join(", ");
  if (names.length === 0) {
    if (!hidesProtectedPath(input, command, sets)) return [];
    list = "a protected path through an expansion, a cd or the working directory";
  }
  if (subagent) {
    if (!hasWriteForm(text, blankQuoted(command).toLowerCase())) return [];
    const ctx = context(input);
    const folder = ownScreenshots(input, ctx);
    if (folder && isOwnScreenshotWrite(text, folder)) return [];
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
