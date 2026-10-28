// ORV-138 rule shell-1 (docs/specs/ORV-138/spec.md): the one reader of Bash text for write-guard
// (resolve-1) and worktree-guard (switch-1). It reads the forms survey K-0090 classes M and U, left
// to right, with the quoting of each word kept: nothing is unquoted before the split. It is pure:
// no hook, no stdin; the only system reads are the existence of the call's cwd and the home folder.
//
// It is not a shell parser. The classes K-0090 marks B and S (eval, sh -c, xargs, a variable that
// holds a command, an alias, CDPATH, ...) and the zsh-only forms are Honest limits of the spec.
//
//   readShell(text, { cwd, home }) -> { segments, substitutions }
//
//   segments       every command of the text, a command inside a substitution after its own list:
//     words          the words that are no redirect, in order, prefixes included
//     command        the lowercased command name, or null (no command, or an unknown one)
//     unknown        true when a command runs but its name is not readable ($G, env -S, ...)
//     commandWords   the words from the command name on (empty when command is null and not unknown)
//     redirects      [{ op, fd, word, write }], in order
//     writeTargets   the words that redirects write to (clause (g))
//     envChdir       the words of each `env -C` option; gitEnv: [{ name, word }] for GIT_DIR and
//                    GIT_WORK_TREE assignments, as a prefix or an env word (clause (d))
//     cwd            the folders the segment may run in, or null when unknown (clause (e))
//     ends           the operator that ends the segment, or null at the end of the text
//   substitutions  the "$(", "`", "<(" and ">(" opened outside single quotes and escapes, in order
//
//   a word is { raw, fixed, kind, expansions, parts }: the text as written, the text before its first
//   expansion with quotes and escaping backslashes removed, "none" | "glob" | "any" (clause (c)), the
//   expansions found, in order, and the path components of the word, split at every "/" (quoted or
//   not): [{ fixed, glob }], where fixed is the component's text before its first expansion and glob
//   says the component holds one (resolve-1 (d) collapses ".." against a glob name with them).
import { statSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const RESERVED = new Set([
  "if",
  "then",
  "elif",
  "else",
  "fi",
  "while",
  "until",
  "do",
  "done",
  "for",
  "select",
  "case",
  "esac",
  "coproc",
  "function",
  "{",
  "}",
  "[[",
  "]]",
  "!",
  "time",
]);
/** After these the rest of the segment is no command (a name list, a pattern or a test expression). */
const NO_COMMAND_AFTER = new Set(["for", "select", "case", "[["]);
const ASSIGNMENT = /^([A-Za-z_][A-Za-z0-9_]*)\+?=/;
const GIT_ENV = new Set(["GIT_DIR", "GIT_WORK_TREE"]);
/** Redirect operators, longest first. */
const REDIRECT_OPS = [
  "&>>",
  "<<<",
  "<<-",
  "<<",
  "&>",
  "<&",
  "<>",
  ">>",
  ">&",
  ">|",
  ">!",
  "<",
  ">",
];
const ALWAYS_WRITE = new Set([">", ">>", ">|", ">!", "&>", "&>>", "<>"]);
/** A control operator ends a word; `<(` and `>(` are checked apart. */
const WORD_END = new Set([" ", "\t", "\n", ";", "&", "|", "(", ")", "<", ">"]);

/** @typedef {{ raw: string, fixed: string, kind: "none" | "glob" | "any", expansions: string[], parts: { fixed: string, glob: boolean }[] }} Word */

/**
 * @param {string} text the Bash command text
 * @param {{ cwd?: string, home?: string }} [options] the call's cwd (unknown when missing or not an
 *   existing folder) and the home folder (the hook process's by default)
 */
export function readShell(text, { cwd, home = homedir() } = {}) {
  const start = existingFolder(cwd);
  const ctx = {
    home,
    segments: [],
    substitutions: [],
    pending: [],
    all: start === null ? null : [start],
  };
  parseList({ s: text, i: 0 }, ctx, null);
  return { segments: ctx.segments, substitutions: ctx.substitutions };
}

function existingFolder(cwd) {
  if (typeof cwd !== "string" || cwd === "") return null;
  try {
    return statSync(cwd).isDirectory() ? resolve(cwd) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------------------------
// Lists and segments (clause (a))

/**
 * Reads segments until the end of the reader, or until the `)` that closes a `$(`, `<(` or `>(`.
 * Each list keeps its own and-or state; the call-wide set of folders is in `ctx.all`.
 */
function parseList(r, ctx, closer) {
  const list = { latest: undefined, andOnly: true };
  let seg = { words: [], redirects: [] };
  let depth = 0;
  const end = (op) => {
    finish(seg, op, list, ctx);
    seg = { words: [], redirects: [] };
  };
  for (;;) {
    skipBlanks(r);
    if (r.i >= r.s.length) return end(null);
    const c = r.s[r.i];
    if (c === "\n") {
      r.i++;
      end("\n");
      readHeredocBodies(r, ctx);
    } else if (c === ";") {
      const op = [";;&", ";;", ";&"].find((o) => r.s.startsWith(o, r.i)) ?? ";";
      r.i += op.length;
      end(op);
    } else if (c === "&" && r.s[r.i + 1] !== ">") {
      const op = r.s[r.i + 1] === "&" ? "&&" : "&";
      r.i += op.length;
      end(op);
    } else if (c === "|") {
      const op = r.s[r.i + 1] === "|" ? "||" : r.s[r.i + 1] === "&" ? "|&" : "|";
      r.i += op.length;
      end(op);
    } else if (c === "(") {
      r.i++;
      end("(");
      depth++;
    } else if (c === ")") {
      r.i++;
      end(")");
      if (depth > 0) depth--;
      else if (closer === ")") return;
    } else if ((c === "<" || c === ">") && r.s[r.i + 1] !== "(") {
      readRedirect(r, ctx, seg, null);
    } else if (c === "&") {
      readRedirect(r, ctx, seg, null);
    } else {
      const word = readWord(r, ctx);
      const next = r.s[r.i];
      const fd = /^\d+$/.test(word.raw) || /^\{[A-Za-z_][A-Za-z0-9_]*\}$/.test(word.raw);
      if (fd && (next === "<" || next === ">") && r.s[r.i + 1] !== "(") {
        readRedirect(r, ctx, seg, word.raw);
      } else {
        seg.words.push(word);
      }
    }
  }
}

function skipBlanks(r) {
  for (;;) {
    const c = r.s[r.i];
    if (c === " " || c === "\t") r.i++;
    else if (c === "\\" && r.s[r.i + 1] === "\n") r.i += 2;
    else return;
  }
}

/** Fills the segment's derived fields, moves the cwd sets, pushes it, and updates the list state. */
function finish(seg, op, list, ctx) {
  if (seg.words.length > 0 || seg.redirects.length > 0) {
    const found = resolveCommand(seg.words);
    seg.command = found.command;
    seg.unknown = found.unknown;
    seg.commandWords = seg.words.slice(found.index);
    seg.envChdir = found.envChdir;
    seg.gitEnv = found.gitEnv;
    seg.writeTargets = seg.redirects.filter((x) => x.write).map((x) => x.word);
    seg.ends = op;
    seg.cwd = list.latest !== undefined && list.andOnly ? list.latest : ctx.all;
    const moved =
      seg.command === null ? undefined : moveCwd(seg.command, seg.commandWords.slice(1), seg.cwd);
    if (moved !== undefined) {
      list.latest = moved;
      ctx.all = union(ctx.all, moved);
    }
    ctx.segments.push(seg);
  }
  if (op === "&&") return;
  if (op === "||" || op === "|" || op === "|&") list.andOnly = false;
  else {
    list.latest = undefined;
    list.andOnly = true;
  }
}

// ---------------------------------------------------------------------------------------------
// Words: quoting, expansions, fixed part and kind (clauses (b) and (c))

/**
 * Reads one word at r.i, which is neither blank nor a control operator (`<(` and `>(` start a word).
 * The word is first a list of pieces, a literal character with its quoted flag or an expansion, so
 * that `[` and `{` can look ahead for their closing character before the fixed part is cut.
 */
function readWord(r, ctx) {
  const s = r.s;
  const begin = r.i;
  const pieces = [];
  while (r.i < s.length) {
    const c = s[r.i];
    if ((c === "<" || c === ">") && pieces.length === 0 && s[r.i + 1] === "(") {
      processSubstitution(r, ctx, pieces);
    } else if (WORD_END.has(c)) {
      break;
    } else if (c === "\\") {
      const n = s[r.i + 1];
      if (n === "\n") r.i += 2;
      else if (n === undefined) {
        pieces.push({ c, q: true });
        r.i++;
      } else {
        pieces.push({ c: n, q: true });
        r.i += 2;
      }
    } else if (c === "'") {
      r.i++;
      while (r.i < s.length && s[r.i] !== "'") pieces.push({ c: s[r.i++], q: true });
      r.i++;
    } else if (c === '"') {
      r.i++;
      readDoubleQuoted(r, ctx, pieces);
    } else if (c === "`") {
      backquote(r, ctx);
      pieces.push({ e: "`" });
    } else if (c === "$") {
      dollar(r, ctx, pieces, false);
    } else {
      pieces.push({ c, q: false });
      r.i++;
    }
  }
  return makeWord(s.slice(begin, r.i), pieces, ctx.home);
}

/** After the opening quote, up to the closing one. `$` and a backquote stay live inside. */
function readDoubleQuoted(r, ctx, pieces) {
  const s = r.s;
  while (r.i < s.length) {
    const c = s[r.i];
    if (c === '"') {
      r.i++;
      return;
    }
    if (c === "\\") {
      const n = s[r.i + 1];
      if (n === "\n") r.i += 2;
      else if (n === "$" || n === "`" || n === '"' || n === "\\") {
        pieces.push({ c: n, q: true });
        r.i += 2;
      } else {
        pieces.push({ c, q: true });
        r.i++;
      }
    } else if (c === "$") {
      dollar(r, ctx, pieces, true);
    } else if (c === "`") {
      backquote(r, ctx);
      pieces.push({ e: "`" });
    } else {
      pieces.push({ c, q: true });
      r.i++;
    }
  }
}

/** r.s[r.i] is `$`. Adds the expansion (or the literal text of a plain `$'...'`) to the pieces. */
function dollar(r, ctx, pieces, inDouble) {
  const s = r.s;
  const n = s[r.i + 1];
  if (n === "(") {
    const arith = s[r.i + 2] === "(" ? arithmeticEnd(s, r.i + 3) : -1;
    if (arith >= 0) {
      scanText(ctx, s.slice(r.i + 3, arith - 1));
      r.i = arith + 1;
      pieces.push({ e: "$((" });
    } else {
      r.i += 2;
      ctx.substitutions.push("$(");
      parseList(r, ctx, ")");
      pieces.push({ e: "$(" });
    }
  } else if (n === "{") {
    const close = braceEnd(s, r.i + 2);
    scanText(ctx, s.slice(r.i + 2, close));
    r.i = Math.min(close + 1, s.length);
    pieces.push({ e: "${" });
  } else if (n === "'" && !inDouble) {
    r.i += 2;
    const body = [];
    let escaped = false;
    while (r.i < s.length && s[r.i] !== "'") {
      if (s[r.i] === "\\") {
        escaped = true;
        r.i++;
      }
      body.push(s[r.i++]);
    }
    r.i++;
    if (escaped) pieces.push({ e: "$'" });
    else for (const c of body) pieces.push({ c, q: true });
  } else if (n === '"' && !inDouble) {
    r.i += 2;
    pieces.push({ e: '$"' });
    readDoubleQuoted(r, ctx, pieces);
  } else {
    r.i++;
    if (n !== undefined && /[A-Za-z_]/.test(n)) while (/[A-Za-z0-9_]/.test(s[r.i] ?? "")) r.i++;
    else if (n !== undefined && /[0-9@*#?$!-]/.test(n)) r.i++;
    pieces.push({ e: "$" });
  }
}

/** The index of the last `)` of `$((expr))` when `from` is after the three opening characters, or -1. */
function arithmeticEnd(s, from) {
  let depth = 2;
  for (let j = from; j < s.length; j++) {
    if (s[j] === "(") depth++;
    else if (s[j] === ")") {
      depth--;
      if (depth === 1) return s[j + 1] === ")" ? j + 1 : -1;
    }
  }
  return -1;
}

/** The index of the `}` that closes a `${` whose body starts at `from` (the end of the text if none). */
function braceEnd(s, from) {
  let depth = 1;
  for (let j = from; j < s.length; j++) {
    const c = s[j];
    if (c === "\\") j++;
    else if (c === "'" || c === '"') {
      const close = s.indexOf(c, j + 1);
      if (close < 0) return s.length;
      j = close;
    } else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return j;
  }
  return s.length;
}

/** r.s[r.i] is a backquote: reads up to the closing one and its commands as a nested list. */
function backquote(r, ctx) {
  const s = r.s;
  let inner = "";
  let j = r.i + 1;
  for (; j < s.length && s[j] !== "`"; j++) {
    if (s[j] === "\\" && "`\\$".includes(s[j + 1] ?? "")) j++;
    inner += s[j];
  }
  r.i = j + 1;
  ctx.substitutions.push("`");
  parseList({ s: inner, i: 0 }, ctx, null);
}

function processSubstitution(r, ctx, pieces) {
  const open = `${r.s[r.i]}(`;
  r.i += 2;
  ctx.substitutions.push(open);
  parseList(r, ctx, ")");
  pieces.push({ e: open });
}

/**
 * Reads the substitutions of text that is read as in double quotes (a here-document body, an
 * arithmetic expansion, the body of `${ }`): only `$(` and a backquote count.
 */
function scanText(ctx, text) {
  const r = { s: text, i: 0 };
  while (r.i < text.length) {
    const c = text[r.i];
    if (c === "\\") r.i += 2;
    else if (c === "$" && text[r.i + 1] === "(") {
      if (text[r.i + 2] === "(") r.i += 3;
      else {
        r.i += 2;
        ctx.substitutions.push("$(");
        parseList(r, ctx, ")");
      }
    } else if (c === "`") backquote(r, ctx);
    else r.i++;
  }
}

/** Resolves `?`, `*`, `[`, `{` and `~`, then cuts the fixed part and decides the kind. */
function makeWord(raw, pieces, home) {
  const isLit = (p, ch) => p !== undefined && p.e === undefined && p.q === false && p.c === ch;
  const list = [...pieces];
  if (isLit(list[0], "~")) {
    if (list.length === 1 || isLit(list[1], "/")) {
      list.splice(0, 1, ...[...home].map((c) => ({ c, q: true })));
    } else list[0] = { e: "~" };
  }
  const expansions = [];
  const parts = [];
  let part = { fixed: "", glob: false };
  let fixed = "";
  let open = true;
  list.forEach((p, idx) => {
    let type = p.e;
    if (type === undefined && p.q === false) {
      if (p.c === "?" || p.c === "*") type = p.c;
      else if (p.c === "[" && list.slice(idx + 1).some((x) => isLit(x, "]"))) type = "[";
      else if (p.c === "{" && braceExpansion(list.slice(idx + 1), isLit)) type = "{";
    }
    if (type !== undefined) {
      expansions.push(type);
      open = false;
      part.glob = true;
    } else {
      if (p.c === "/") {
        parts.push(part);
        part = { fixed: "", glob: false };
      } else if (!part.glob) part.fixed += p.c;
      if (open) fixed += p.c;
    }
  });
  parts.push(part);
  const kind =
    expansions.length === 0
      ? "none"
      : expansions.every((e) => e === "?" || e === "*" || e === "[")
        ? "glob"
        : "any";
  return { raw, fixed, kind, expansions, parts };
}

/** True when the pieces after a `{` hold an unquoted `}` and, before it, an unquoted `,` or `..`. */
function braceExpansion(rest, isLit) {
  const close = rest.findIndex((p) => isLit(p, "}"));
  if (close < 0) return false;
  const body = rest.slice(0, close);
  return body.some((p, k) => isLit(p, ",") || (isLit(p, ".") && isLit(body[k + 1], ".")));
}

// ---------------------------------------------------------------------------------------------
// Redirects and here-documents (clauses (f) and (g))

/** r.s[r.i] starts a redirect operator; `fd` is the number or `{name}` word before it, if any. */
function readRedirect(r, ctx, seg, fd) {
  const op = REDIRECT_OPS.find((o) => r.s.startsWith(o, r.i));
  if (op === undefined) {
    // a lone `&` that is no `&>`: cannot happen here, but never loop without moving
    r.i++;
    return;
  }
  r.i += op.length;
  skipBlanks(r);
  const c = r.s[r.i];
  const hasWord =
    c !== undefined && (!WORD_END.has(c) || ((c === "<" || c === ">") && r.s[r.i + 1] === "("));
  const word = hasWord ? readWord(r, ctx) : null;
  const write =
    word !== null && (ALWAYS_WRITE.has(op) || (op === ">&" && !/^(?:\d+-?|-)$/.test(word.raw)));
  seg.redirects.push({ op, fd, word, write });
  if ((op === "<<" || op === "<<-") && word !== null) {
    ctx.pending.push({
      delim: word.raw.replace(/\\(.)/gs, "$1").replace(/['"]/g, ""),
      strip: op === "<<-",
      quoted: /['"\\]/.test(word.raw),
    });
  }
}

/** After a newline: the body of each pending here-document, up to its delimiter line or the end. */
function readHeredocBodies(r, ctx) {
  while (ctx.pending.length > 0) {
    const doc = ctx.pending.shift();
    const lines = [];
    while (r.i < r.s.length) {
      const nl = r.s.indexOf("\n", r.i);
      const line = nl < 0 ? r.s.slice(r.i) : r.s.slice(r.i, nl);
      r.i = nl < 0 ? r.s.length : nl + 1;
      if ((doc.strip ? line.replace(/^\t+/, "") : line) === doc.delim) break;
      lines.push(line);
    }
    if (!doc.quoted) scanText(ctx, lines.join("\n"));
  }
}

// ---------------------------------------------------------------------------------------------
// Command position (clause (d))

/**
 * Skips what comes before the command name. `index` is the position of the command name in `words`,
 * or the number of words when no command runs.
 */
function resolveCommand(words) {
  const out = { command: null, unknown: false, index: words.length, envChdir: [], gitEnv: [] };
  const unknown = (at) => {
    out.unknown = true;
    out.index = at;
    return out;
  };
  const noCommand = () => {
    out.index = words.length;
    return out;
  };
  /** The fixed text of an option word at `at`, or null when there is none or it has an expansion. */
  const optionAt = (at) => (words[at]?.kind === "none" ? words[at].fixed : null);
  let i = 0;
  for (;;) {
    const w = words[i];
    if (w === undefined) return noCommand();
    const assignment = ASSIGNMENT.exec(w.raw);
    if (assignment) {
      if (GIT_ENV.has(assignment[1])) out.gitEnv.push({ name: assignment[1], word: w });
      i++;
      continue;
    }
    if (RESERVED.has(w.raw)) {
      if (NO_COMMAND_AFTER.has(w.raw)) return noCommand();
      i += w.raw === "function" ? 2 : 1;
      if (w.raw === "time" && optionAt(i) === "-p") i++;
      continue;
    }
    if (w.kind !== "none") return unknown(i);
    // The lowercased base name of the fixed part, so /usr/bin/tee reads as tee (orchestrator decision
    // on ORV-138-build-shell; clause (d) says "its fixed part, lowercased").
    const name = w.fixed.slice(w.fixed.lastIndexOf("/") + 1).toLowerCase();
    if (name === "builtin" || name === "nohup") {
      i++;
    } else if (name === "command") {
      i++;
      for (let f = optionAt(i); f !== null && f.startsWith("-"); f = optionAt(i)) {
        i++;
        if (f === "--") break;
        if (!/^-[pvV]+$/.test(f)) return unknown(i - 1);
        if (/[vV]/.test(f)) return noCommand();
      }
    } else if (name === "exec") {
      i++;
      for (let f = optionAt(i); f !== null && f.startsWith("-"); f = optionAt(i)) {
        i++;
        if (f === "--") break;
        if (f === "-a") i++;
        else if (!/^-[cl]+$/.test(f)) return unknown(i - 1);
      }
    } else if (name === "timeout") {
      i++;
      for (let f = optionAt(i); f !== null && f.startsWith("-"); f = optionAt(i)) {
        i++;
        if (f === "--") break;
        if (f === "-s" || f === "-k" || f === "--signal" || f === "--kill-after") i++;
        else if (
          !/^(?:-v|--verbose|--foreground|--preserve-status|-[sk].+|--(?:signal|kill-after)=.*)$/.test(
            f,
          )
        )
          return unknown(i - 1);
      }
      i++; // the DURATION
    } else if (name === "env") {
      i = skipEnv(words, i + 1, out);
      if (i < 0) return unknown(-i - 1);
    } else {
      out.command = name;
      out.index = i;
      return out;
    }
  }
}

/**
 * Skips the options and NAME=VALUE words of an `env` whose options start at `i`; records `-C` and
 * the git variables in `out`. Returns the index of the first word after them, or `-(k + 1)` when the
 * word at k makes the command unknown (an option we do not read, or `-S`).
 */
function skipEnv(words, i, out) {
  for (;;) {
    const w = words[i];
    if (w === undefined || w.kind !== "none") return i;
    const assignment = ASSIGNMENT.exec(w.raw);
    if (assignment) {
      if (GIT_ENV.has(assignment[1])) out.gitEnv.push({ name: assignment[1], word: w });
      i++;
      continue;
    }
    const f = w.fixed;
    if (!f.startsWith("-")) return i;
    if (f === "-" || f === "--" || /^-[i0v]+$/.test(f)) i++;
    else if (/^--(?:ignore-environment|null|debug)$/.test(f)) i++;
    else if (/^(?:-[ua]|--unset|--argv0)$/.test(f)) i += 2;
    else if (/^(?:-[ua].+|--(?:unset|argv0)=.*)$/.test(f)) i++;
    else if (f === "-C" || f === "--chdir") {
      if (words[i + 1] !== undefined) out.envChdir.push(words[i + 1]);
      i += 2;
    } else if (/^(?:-C.+|--chdir=.*)$/.test(f)) {
      out.envChdir.push(w);
      i++;
    } else return -(i + 1);
  }
}

// ---------------------------------------------------------------------------------------------
// Effective cwd (clause (e))

/**
 * The folders after a `cd`, `pushd` or `popd` that runs from `folders` (null = unknown), null when
 * they are unknown, or undefined when the command moves nothing.
 */
function moveCwd(command, args, folders) {
  if (command !== "cd" && command !== "pushd" && command !== "popd") return undefined;
  if (command === "popd") return null;
  const option = command === "pushd" ? /^-[LPe@n]+$/ : /^-[LPe@]+$/;
  let k = 0;
  let noMove = false;
  for (; k < args.length && args[k].kind === "none"; k++) {
    const f = args[k].fixed;
    if (f === "--") {
      k++;
      break;
    }
    if (!option.test(f)) break;
    if (f.includes("n")) noMove = true;
  }
  if (noMove) return undefined;
  const rest = args.slice(k);
  if (rest.length !== 1) return null;
  const target = rest[0];
  if (target.kind !== "none" || target.fixed === "-") return null;
  if (command === "pushd" && /^[+-]\d+$/.test(target.fixed)) return null;
  if (folders === null) return null;
  return [...new Set(folders.map((f) => resolve(f, target.fixed)))];
}

function union(a, b) {
  return a === null || b === null ? null : [...new Set([...a, ...b])];
}
