// ORV-138 rule shell-1 (docs/specs/ORV-138/spec.md): the one reader of Bash text for write-guard
// (resolve-1) and worktree-guard (switch-1). It reads the forms survey K-0090 classes M and U, the
// section 10 rows it marks model and the runners its section 11 marks M, left to right, with the
// quoting of each word kept: nothing is unquoted before the split. It is pure: no hook, no stdin;
// the only system reads are the existence of the call's cwd and the home folder.
//
// It is not a shell parser. The classes K-0090 marks B and S (eval, sh -c, xargs, a variable that
// holds a command, an alias, CDPATH, ...) are Honest limits of the spec. A form it cannot read makes
// the whole call unknown (clause (h), unknown-1); a throw still fails closed in both guards.
//
//   readShell(text, { cwd, home }) -> { segments, substitutions, heredocBodies, unknown, causes }
//
//   segments       every command of the text, a command inside a substitution after its own list:
//     words          the words that are no redirect, in order, prefixes included
//     command        the lowercased command name, or null (no command, or an unknown one)
//     unknown        true when a command runs but its name is not readable ($G, a runner option, ...)
//     commandWords   the words from the command name on (empty when command is null and not unknown)
//     redirects      [{ op, fd, word, write }], in order
//     writeTargets   the words that redirects write to (clause (g))
//     envChdir       the words of each folder change: env -C, sudo -D, sudo -R, the NEWROOT of chroot;
//                    gitEnv: [{ name, word }] for GIT_DIR and GIT_WORK_TREE assignments, as a prefix,
//                    an env or sudo word or the value of arch -e (clause (d))
//     cwd            the folders the segment may run in, or null when unknown (clause (e))
//     ends           the operator that ends the segment, or null at the end of the text
//   substitutions  the "$(", "`", "<(", ">(", "=(", "${" opened outside single quotes and escapes
//   heredocBodies  [{ start, end }] the place in the text of each here-document body with a quoted
//                  delimiter (literal text, no segment comes from it; clause (f), resolve-1 (f)): the
//                  first character of the body to the start of its delimiter line (or the text end)
//   unknown        true when the call holds a form of unknown-1 (clause (h)); neither guard judges
//                  its segments
//   causes         why, in the order found: "length", "C6", "C7", "H4", "H5", "H8", "H9", "H11",
//                  "H12", "H13", "S2", "S3", "S4", "S11" (K-0090 row ids) or "runner:<name>"
//
//   a word is { raw, fixed, kind, expansions, parts }: the text as written, the text before its first
//   expansion with quotes and escaping backslashes removed, "none" | "glob" | "any" (clause (c)), the
//   expansions found, in order, and the path components of the word, split at every "/" (quoted or
//   not): [{ fixed, glob }], where fixed is the component's text before its first expansion and glob
//   says the component holds one (resolve-1 (d) collapses ".." against a glob name with them).
import { statSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

/** unknown-1: a call longer than this is unknown (a bound the orchestrator set, not a derived number). */
export const MAX_CALL_LENGTH = 200000;

/** The sentence for each cause that `readShell` gives, for a guard's stderr. */
const CAUSE_TEXT = {
  length: `the call is longer than ${MAX_CALL_LENGTH} characters`,
  C6: "a backquote pair holds a comment (K-0090 C6)",
  C7: "the call assigns histchars (K-0090 C7)",
  H4: "a here-document opens in a substitution that closes on its own line (K-0090 H4)",
  H5: "a here-document opens in a backquote pair that closes on its own line (K-0090 H5)",
  H8: "a here-document delimiter in $'...' holds a backslash (K-0090 H8)",
  H9: 'a here-document delimiter is $"..." (K-0090 H9)',
  H11: "a here-document delimiter holds a backquote (K-0090 H11)",
  H12: "a here-document delimiter holds a backslash before a newline (K-0090 H12)",
  H13: "a here-document body ends a line in a backslash (K-0090 H13)",
  S2: "a backquote pair leaves a quote open (K-0090 S2)",
  S3: "a $(( does not close as arithmetic (K-0090 S3)",
  S4: "a (( at command position does not close as arithmetic (K-0090 S4)",
  S11: "a ( stands inside a word, as in a function definition, an array assignment or a glob qualifier (K-0090 S11)",
};

/** The sentence for one cause of `readShell`. */
export function describeCause(cause) {
  if (cause.startsWith("runner:")) {
    return `${cause.slice("runner:".length)} is a runner form shell-1 cannot read (K-0090 section 11)`;
  }
  return CAUSE_TEXT[cause] ?? cause;
}

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
  // zsh (K-0090 Z2, Z5): `repeat` takes one word
  "repeat",
  "foreach",
  "end",
  "nocorrect",
  "always",
]);
/** After these the rest of the segment is no command (a name list or a pattern). */
const NO_COMMAND_AFTER = new Set(["for", "select", "case"]);
const ASSIGNMENT = /^([A-Za-z_][A-Za-z0-9_]*)\+?=/;
const GIT_ENV = new Set(["GIT_DIR", "GIT_WORK_TREE"]);
/** Redirect operators, longest first. */
const REDIRECT_OPS = [
  "&>>",
  "&>|",
  "&>!",
  ">>|",
  ">>!",
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
const ALWAYS_WRITE = new Set([
  ">",
  ">>",
  ">|",
  ">!",
  ">>|",
  ">>!",
  "&>",
  "&>>",
  "&>|",
  "&>!",
  "<>",
]);
/** A control operator ends a word; `<(` and `>(` are checked apart. */
const WORD_END = new Set([" ", "\t", "\n", ";", "&", "|", "(", ")", "<", ">"]);
const CASE_ARM_END = new Set([";;", ";&", ";;&"]);

/** @typedef {{ raw: string, fixed: string, kind: "none" | "glob" | "any", expansions: string[], parts: { fixed: string, glob: boolean }[] }} Word */

/**
 * @param {string} text the Bash command text
 * @param {{ cwd?: string, home?: string }} [options] the call's cwd (unknown when missing or not an
 *   existing folder) and the home folder (the hook process's by default)
 */
export function readShell(text, { cwd, home = homedir() } = {}) {
  if (text.length > MAX_CALL_LENGTH) {
    return {
      segments: [],
      substitutions: [],
      heredocBodies: [],
      unknown: true,
      causes: ["length"],
    };
  }
  const start = existingFolder(cwd);
  const ctx = {
    text,
    home,
    segments: [],
    substitutions: [],
    heredocBodies: [],
    causes: [],
    inBackquote: 0,
    arithFailed: false,
    all: start === null ? null : [start],
  };
  parseList({ s: text, i: 0, openQuote: false }, ctx, null);
  return {
    segments: ctx.segments,
    substitutions: ctx.substitutions,
    heredocBodies: ctx.heredocBodies,
    unknown: ctx.causes.length > 0,
    causes: ctx.causes,
  };
}

function existingFolder(cwd) {
  if (typeof cwd !== "string" || cwd === "") return null;
  try {
    return statSync(cwd).isDirectory() ? resolve(cwd) : null;
  } catch {
    return null;
  }
}

function unknownBecause(ctx, cause) {
  if (!ctx.causes.includes(cause)) ctx.causes.push(cause);
}

// ---------------------------------------------------------------------------------------------
// Lists and segments (clause (a))

/**
 * Reads segments until the end of the reader, or until the `)` that closes a `$(`, `<(`, `>(` or
 * `=(`, or the `}` that closes a `${ `. Each list keeps its own and-or state, here-documents that
 * wait for a body (clause (f): the body starts after the next newline at this list's level), `case`
 * and `[[` state, and `{` groups; the call-wide set of folders is in `ctx.all`. `closer` is "`" for
 * the text of a backquote pair.
 */
function parseList(r, ctx, closer) {
  const list = {
    latest: undefined,
    andOnly: true,
    pending: [],
    braces: 0,
    cases: 0,
    patternMode: false,
    cond: false,
  };
  let seg = { words: [], redirects: [] };
  // True while every word of the segment is a reserved word or an assignment (command position).
  let prefixOnly = true;
  let sawCase = false;
  let sawIn = false;
  let depth = 0;
  const end = (op) => {
    finish(seg, op, list, ctx);
    seg = { words: [], redirects: [] };
    prefixOnly = true;
    sawCase = false;
    sawIn = false;
    if (CASE_ARM_END.has(op) && list.cases > 0) list.patternMode = true;
  };
  const leave = () => {
    if (list.pending.length > 0 && closer !== null)
      unknownBecause(ctx, closer === "`" ? "H5" : "H4");
  };
  for (;;) {
    skipBlanks(r);
    if (r.i >= r.s.length) {
      end(null);
      return leave();
    }
    const c = r.s[r.i];
    if (c === "#") {
      // An unquoted # at the start of a word: a comment to the end of its line (K-0090 C1 to C5).
      if (ctx.inBackquote > 0) unknownBecause(ctx, "C6");
      const nl = r.s.indexOf("\n", r.i);
      r.i = nl < 0 ? r.s.length : nl;
    } else if (c === "\n") {
      r.i++;
      list.cond = false;
      end("\n");
      readHeredocBodies(r, ctx, list);
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
      if (
        list.patternMode &&
        (seg.words.length === 0 || seg.words[seg.words.length - 1].raw === "in")
      ) {
        r.i++; // the optional opening parenthesis of a case pattern
      } else if (r.s[r.i + 1] === "(" && prefixOnly && arithmeticCommand(r, ctx)) {
        // `(( expression ))` was read as arithmetic
      } else {
        r.i++;
        end("(");
        depth++;
      }
    } else if (c === ")") {
      r.i++;
      end(")");
      if (list.patternMode)
        list.patternMode = false; // the `)` that ends a case pattern
      else if (depth > 0) depth--;
      else if (closer === ")") return leave();
    } else if ((c === "<" || c === ">") && r.s[r.i + 1] !== "(") {
      if (list.cond) {
        // a comparison between [[ and ]] (H19), not a redirect
        r.i++;
        seg.words.push(makeWord(c, [{ c, q: false }], ctx.home));
        prefixOnly = false;
      } else readRedirect(r, ctx, list, seg, null);
    } else if (c === "&") {
      readRedirect(r, ctx, list, seg, null);
    } else {
      const word = readWord(r, ctx);
      const next = r.s[r.i];
      const fd = /^\d+$/.test(word.raw) || /^\{[A-Za-z_][A-Za-z0-9_]*\}$/.test(word.raw);
      if (fd && (next === "<" || next === ">") && r.s[r.i + 1] !== "(") {
        readRedirect(r, ctx, list, seg, word.raw);
        continue;
      }
      const raw = word.raw;
      if (raw === "}" && (list.braces > 0 || closer === "}")) {
        // zsh's `}` in any position (Z4), and the end of a `${ ...; }`
        end("}");
        if (list.braces > 0) list.braces--;
        else return leave();
        continue;
      }
      if (raw === "{" && (seg.words.length === 0 || opensGroup(seg.words))) list.braces++;
      else if (raw === "[[" && prefixOnly) list.cond = true;
      else if (raw === "]]") list.cond = false;
      else if (raw === "case" && prefixOnly) {
        sawCase = true;
        list.cases++;
      } else if (raw === "in" && sawCase && !sawIn) {
        sawIn = true;
        list.patternMode = true;
      } else if (raw === "esac" && list.cases > 0 && (list.patternMode || prefixOnly)) {
        list.cases--;
        list.patternMode = false;
      }
      seg.words.push(word);
      prefixOnly = prefixOnly && (RESERVED.has(raw) || ASSIGNMENT.test(raw));
    }
  }
}

/** True when the last word before a `{` leaves the `{` at command position (a group or a body). */
function opensGroup(words) {
  const prev = words[words.length - 1].raw;
  return RESERVED.has(prev) || words[words.length - 2]?.raw === "function";
}

function skipBlanks(r) {
  for (;;) {
    const c = r.s[r.i];
    if (c === " " || c === "\t") r.i++;
    else if (c === "\\" && r.s[r.i + 1] === "\n") r.i += 2;
    else return;
  }
}

/**
 * r.s[r.i] and the next character are `((` at command position: arithmetic when it closes with `))`
 * (the shift `<<` inside it opens no here-document, H17; true, and the reader is past it). Else the
 * shell may read a group or arithmetic: the call is unknown (S4) and the caller reads a group.
 */
function arithmeticCommand(r, ctx) {
  const close = ctx.arithFailed ? -1 : arithmeticEnd(r.s, r.i + 2);
  if (close < 0) {
    ctx.arithFailed = true;
    unknownBecause(ctx, "S4");
    return false;
  }
  scanText(ctx, r.s.slice(r.i + 2, close - 1));
  r.i = close + 1;
  return true;
}

/** Fills the segment's derived fields, moves the cwd sets, pushes it, and updates the list state. */
function finish(seg, op, list, ctx) {
  if (seg.words.length > 0 || seg.redirects.length > 0) {
    const found = resolveCommand(seg.words);
    for (const cause of found.causes) unknownBecause(ctx, cause);
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
 * Reads one word at r.i, which is neither blank nor a control operator (`<(`, `>(` and `=(` start a
 * word). The word is first a list of pieces, a literal character with its quoted flag or an
 * expansion, so that `[` and `{` can look ahead for their closing character before the fixed part is
 * cut.
 */
function readWord(r, ctx) {
  const s = r.s;
  const begin = r.i;
  const pieces = [];
  while (r.i < s.length) {
    const c = s[r.i];
    if (pieces.length === 0 && s[r.i + 1] === "(" && (c === "<" || c === ">" || c === "=")) {
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
      if (r.i >= s.length) r.openQuote = true;
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
  // S11: a ( inside a word (a function definition, x=(a b), a glob qualifier or an extglob)
  if (s[r.i] === "(" && r.i > begin) unknownBecause(ctx, "S11");
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
  r.openQuote = true;
}

/** r.s[r.i] is `$`. Adds the expansion (or the literal text of a plain `$'...'`) to the pieces. */
function dollar(r, ctx, pieces, inDouble) {
  const s = r.s;
  const n = s[r.i + 1];
  if (n === "(") {
    const opensArithmetic = s[r.i + 2] === "(";
    const arith = opensArithmetic && !ctx.arithFailed ? arithmeticEnd(s, r.i + 3) : -1;
    if (arith >= 0) {
      scanText(ctx, s.slice(r.i + 3, arith - 1));
      r.i = arith + 1;
      pieces.push({ e: "$((" });
    } else {
      if (opensArithmetic) {
        ctx.arithFailed = true;
        unknownBecause(ctx, "S3");
      }
      r.i += 2;
      ctx.substitutions.push("$(");
      parseList(r, ctx, ")");
      pieces.push({ e: "$(" });
    }
  } else if (n === "{") {
    if (" \t\n|".includes(s[r.i + 2] ?? "x")) {
      // Bash 5.3 `${ list; }` and `${| list; }` (S6): the list runs
      r.i += s[r.i + 2] === "|" ? 3 : 2;
      ctx.substitutions.push("${");
      parseList(r, ctx, "}");
    } else {
      const close = braceEnd(s, r.i + 2);
      scanText(ctx, s.slice(r.i + 2, close));
      r.i = Math.min(close + 1, s.length);
    }
    pieces.push({ e: "${" });
  } else if (n === "[") {
    // zsh `$[expression]` (S7): arithmetic, ends at its matching ]
    const close = bracketEnd(s, r.i + 2);
    scanText(ctx, s.slice(r.i + 2, close));
    r.i = Math.min(close + 1, s.length);
    pieces.push({ e: "$[" });
  } else if (n === "'" && !inDouble) {
    r.i += 2;
    const body = [];
    let escaped = false;
    while (r.i < s.length && s[r.i] !== "'") {
      if (s[r.i] === "\\") {
        // a backslash escape, `\'` included (Q1): the next character never ends the quote
        escaped = true;
        r.i++;
      }
      body.push(s[r.i++]);
    }
    if (r.i >= s.length) r.openQuote = true;
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

/** The index of the `]` that closes a `$[` whose body starts at `from` (the end of the text if none). */
function bracketEnd(s, from) {
  let depth = 1;
  for (let j = from; j < s.length; j++) {
    const c = s[j];
    if (c === "\\") j++;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) return j;
  }
  return s.length;
}

/**
 * r.s[r.i] is a backquote: reads up to the first one that is not after a backslash (S1) and its
 * commands as a nested list. A quote the text leaves open at its end is unknown (S2); a comment in it
 * is too (C6, in parseList).
 */
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
  const reader = { s: inner, i: 0, openQuote: false };
  ctx.inBackquote++;
  parseList(reader, ctx, "`");
  ctx.inBackquote--;
  if (reader.openQuote) unknownBecause(ctx, "S2");
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
  const r = { s: text, i: 0, openQuote: false };
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
  // One pass from the right for what `[` and `{` look ahead for, so that a word of n characters is
  // read in time linear in n (sec-F7): the last unquoted `]`; per index, the next unquoted `}` and
  // the counts of unquoted `,` and `..` before it.
  const n = list.length;
  let lastBracketClose = -1;
  for (let k = n - 1; k >= 0 && lastBracketClose < 0; k--) {
    if (isLit(list[k], "]")) lastBracketClose = k;
  }
  const nextBrace = new Array(n).fill(-1);
  for (let k = n - 1, next = -1; k >= 0; k--) {
    nextBrace[k] = next;
    if (isLit(list[k], "}")) next = k;
  }
  const commas = new Array(n + 1).fill(0);
  const dots = new Array(n + 1).fill(0);
  for (let k = 0; k < n; k++) {
    commas[k + 1] = commas[k] + (isLit(list[k], ",") ? 1 : 0);
    dots[k + 1] = dots[k] + (isLit(list[k], ".") && isLit(list[k + 1], ".") ? 1 : 0);
  }
  /** True when the `{` at idx has an unquoted `}` after it and, between them, an unquoted `,` or `..`. */
  const braceExpansion = (idx) => {
    const close = nextBrace[idx];
    if (close < 0 || close === idx + 1) return false;
    if (commas[close] - commas[idx + 1] > 0) return true;
    return close - 1 > idx + 1 && dots[close - 1] - dots[idx + 1] > 0;
  };
  const expansions = [];
  const parts = [];
  let part = { fixed: "", glob: false };
  let fixed = "";
  let open = true;
  list.forEach((p, idx) => {
    let type = p.e;
    if (type === undefined && p.q === false) {
      if (p.c === "?" || p.c === "*") type = p.c;
      else if (p.c === "[" && lastBracketClose > idx) type = "[";
      else if (p.c === "{" && braceExpansion(idx)) type = "{";
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

// ---------------------------------------------------------------------------------------------
// Redirects and here-documents (clauses (f) and (g))

/** r.s[r.i] starts a redirect operator; `fd` is the number or `{name}` word before it, if any. */
function readRedirect(r, ctx, list, seg, fd) {
  let op = REDIRECT_OPS.find((o) => r.s.startsWith(o, r.i));
  if (op === undefined) {
    // a lone `&` that is no `&>`: cannot happen here, but never loop without moving
    r.i++;
    return;
  }
  // zsh `<<(list)` is `< <(list)`, a process substitution and no here-document (H20)
  if (op === "<<" && r.s[r.i + 2] === "(") op = "<";
  r.i += op.length;
  skipBlanks(r);
  const c = r.s[r.i];
  const hasWord =
    c !== undefined &&
    c !== "#" &&
    (!WORD_END.has(c) || ((c === "<" || c === ">") && r.s[r.i + 1] === "("));
  const word = hasWord ? readWord(r, ctx) : null;
  const write =
    word !== null && (ALWAYS_WRITE.has(op) || (op === ">&" && !/^(?:\d+-?|-)$/.test(word.raw)));
  seg.redirects.push({ op, fd, word, write });
  if ((op === "<<" || op === "<<-") && word !== null) {
    const delimiter = heredocDelimiter(word.raw, ctx);
    list.pending.push({ ...delimiter, strip: op === "<<-" });
  }
}

/**
 * The delimiter of a here-document from its word as written: the literal text after quote removal,
 * with no expansion (`<<$X` ends at the line `$X`, H10), and whether any part of it is quoted (the
 * body is then a literal, H7). A delimiter the two shells may read differently is unknown-1's case:
 * `$'...'` with a backslash (H8), `$"..."` (H9), a backquote (H11), a backslash before a newline (H12).
 */
function heredocDelimiter(raw, ctx) {
  if (raw.includes("`")) unknownBecause(ctx, "H11");
  if (raw.includes("\\\n")) unknownBecause(ctx, "H12");
  let delim = "";
  let quoted = false;
  let i = 0;
  while (i < raw.length) {
    const c = raw[i];
    if (c === "\\") {
      quoted = true;
      if (raw[i + 1] !== "\n") delim += raw[i + 1] ?? "";
      i += 2;
    } else if (c === "'") {
      quoted = true;
      const close = raw.indexOf("'", i + 1);
      const stop = close < 0 ? raw.length : close;
      delim += raw.slice(i + 1, stop);
      i = stop + 1;
    } else if (c === '"' || (c === "$" && raw[i + 1] === '"')) {
      quoted = true;
      if (c === "$") {
        unknownBecause(ctx, "H9");
        i++;
      }
      i++;
      for (; i < raw.length && raw[i] !== '"'; i++) {
        if (raw[i] === "\\" && '$`"\\'.includes(raw[i + 1] ?? "")) i++;
        delim += raw[i] ?? "";
      }
      i++;
    } else if (c === "$" && raw[i + 1] === "'") {
      quoted = true;
      let j = i + 2;
      let escaped = false;
      for (; j < raw.length && raw[j] !== "'"; j++) {
        if (raw[j] === "\\") {
          escaped = true;
          j++;
        }
        delim += raw[j] ?? "";
      }
      if (escaped) unknownBecause(ctx, "H8");
      i = j + 1;
    } else {
      delim += c;
      i++;
    }
  }
  return { delim, quoted };
}

/** After a newline: the body of each here-document of this list, up to its delimiter line or the end. */
function readHeredocBodies(r, ctx, list) {
  while (list.pending.length > 0) {
    const doc = list.pending.shift();
    const start = r.i;
    let bodyEnd = r.s.length;
    const lines = [];
    while (r.i < r.s.length) {
      const lineStart = r.i;
      const nl = r.s.indexOf("\n", r.i);
      const line = nl < 0 ? r.s.slice(r.i) : r.s.slice(r.i, nl);
      r.i = nl < 0 ? r.s.length : nl + 1;
      if ((doc.strip ? line.replace(/^\t+/, "") : line) === doc.delim) {
        bodyEnd = lineStart;
        break;
      }
      lines.push(line);
    }
    if (doc.quoted) {
      if (r.s === ctx.text) ctx.heredocBodies.push({ start, end: bodyEnd });
    } else {
      if (lines.some(endsInBackslash)) unknownBecause(ctx, "H13");
      scanText(ctx, lines.join("\n"));
    }
  }
}

/** True when the line ends in a backslash that is not itself escaped (an odd run of them). */
function endsInBackslash(line) {
  let run = 0;
  for (let k = line.length - 1; k >= 0 && line[k] === "\\"; k--) run++;
  return run % 2 === 1;
}

// ---------------------------------------------------------------------------------------------
// Command position (clause (d))

/**
 * Runner grammar (spec "Runner grammar", K-0090 section 11), one row per runner:
 *   val       options that take a value (the next word, or the rest of a short option word, or the
 *             text after `=` of a long one)
 *   flag      options that take none
 *   eq        long options that take a value only after `=`
 *   eqOpt     long options that stand alone or take a value after `=`
 *   attached  short options (letters) whose value must be attached to them
 *   prefix    long option prefixes that stand alone (xcrun --show-)
 *   whole     each option is one word, no letter groups (arch)
 *   digits    `-` and digits is an option word (nice)
 *   loneDash  a lone `-` is an option (env)
 *   assign    NAME=VALUE words stand among the options and are recorded (env, sudo)
 *   chdir     options whose value is a folder change
 *   envOpt    options whose value is a NAME=value assignment (arch -e)
 *   pos       the positional words before the command: "one", "priority", "flock", "script", "newroot"
 * A form outside the row makes the call unknown (unknown-1): the options a row does not give, `-S`,
 * `-c` and the other forms of its "Makes the call unknown" cell, and an expansion where an option or
 * a positional word may stand.
 */
const RUNNERS = new Map(
  Object.entries({
    nice: { val: ["-n", "--adjustment"], flag: ["--help", "--version"], digits: true },
    time: {
      val: ["-f", "--format", "-o", "--output"],
      flag: ["-p", "--portability", "-a", "--append", "-v", "-q", "-h", "-l", "-V", "--help"],
    },
    stdbuf: {
      val: ["-i", "--input", "-o", "--output", "-e", "--error"],
      flag: ["--help", "--version"],
    },
    caffeinate: { val: ["-t", "-w"], flag: ["-d", "-i", "-m", "-s", "-u"] },
    ionice: {
      val: ["-c", "--class", "-n", "--classdata", "-p", "--pid", "-P", "--pgid", "-u", "--uid"],
      flag: ["-t", "--ignore"],
    },
    setsid: { flag: ["-c", "-f", "-w", "-h", "-V"] },
    chrt: {
      val: ["-T", "-P", "-D", "-U", "-X"],
      flag: [
        "-o",
        "-f",
        "-r",
        "-b",
        "-i",
        "-d",
        "-e",
        "-G",
        "-O",
        "-R",
        "-a",
        "-m",
        "-p",
        "-v",
        "-h",
        "-V",
      ],
      pos: "priority",
    },
    taskset: { flag: ["-a", "-c", "-p", "-h", "-V"], pos: "one" },
    flock: {
      val: ["-E", "--conflict-exit-code", "-w", "--wait", "--timeout", "--start", "--length"],
      flag: [
        "-F",
        "-n",
        "--nb",
        "--nonblocking",
        "-o",
        "-s",
        "-u",
        "-e",
        "-x",
        "--exclusive",
        "--verbose",
        "--fcntl",
        "-h",
        "-V",
      ],
      pos: "flock",
    },
    lockf: { val: ["-t"], flag: ["-k", "-n", "-s", "-w"], pos: "one" },
    sudo: {
      val: ["-a", "-C", "-c", "-D", "-g", "-p", "-R", "-r", "-t", "-T", "-U", "-u"],
      flag: [
        "-A",
        "-B",
        "-b",
        "-E",
        "-e",
        "-H",
        "-K",
        "-k",
        "-l",
        "-N",
        "-n",
        "-P",
        "-S",
        "-V",
        "-v",
      ],
      eq: ["--preserve-env"],
      attached: ["h"],
      assign: true,
      chdir: ["-D", "-R"],
    },
    doas: { val: ["-a", "-C", "-u"], flag: ["-L", "-n", "-s"] },
    chronic: { flag: ["-e", "-v"] },
    unbuffer: { flag: ["-p"] },
    script: {
      val: [
        "-E",
        "--echo",
        "-B",
        "--log-io",
        "-I",
        "--log-in",
        "-O",
        "--log-out",
        "-T",
        "--log-timing",
        "-m",
        "--logging-format",
        "-o",
        "--output-limit",
      ],
      flag: ["-a", "-d", "-e", "-F", "-f", "--force", "-k", "-p", "-q", "-r", "-h", "-V"],
      eqOpt: ["--timing"],
      attached: ["t"],
      pos: "script",
    },
    nohup: { flag: ["--help", "--version"] },
    timeout: {
      val: ["-k", "--kill-after", "-s", "--signal"],
      flag: [
        "-f",
        "--foreground",
        "-p",
        "--preserve-status",
        "-v",
        "--verbose",
        "--help",
        "--version",
      ],
      pos: "one",
    },
    env: {
      val: ["-a", "--argv0", "-u", "--unset", "-C", "--chdir", "-P"],
      flag: [
        "-i",
        "--ignore-environment",
        "-0",
        "--null",
        "-v",
        "--debug",
        "--list-signal-handling",
      ],
      eqOpt: ["--block-signal", "--default-signal", "--ignore-signal"],
      loneDash: true,
      assign: true,
      chdir: ["-C", "--chdir"],
    },
    chroot: {
      eq: ["--groups", "--userspec"],
      flag: ["--skip-chdir", "--help", "--version"],
      pos: "newroot",
    },
    prlimit: {
      val: ["-o", "--output", "-p", "--pid"],
      flag: ["--noheadings", "--raw", "--verbose", "-h", "-V"],
      eq: [
        "--core",
        "--data",
        "--nice",
        "--fsize",
        "--sigpending",
        "--memlock",
        "--rss",
        "--nofile",
        "--msgqueue",
        "--rtprio",
        "--stack",
        "--cpu",
        "--nproc",
        "--as",
        "--locks",
        "--rttime",
      ],
    },
    arch: {
      val: ["-arch", "-d", "-e"],
      flag: ["-32", "-64", "-c", "-h", "-i386", "-x86_64", "-x86_64h", "-arm64", "-arm64e"],
      whole: true,
      envOpt: ["-e"],
    },
    xcrun: {
      val: ["--sdk", "--toolchain"],
      flag: ["-v", "-n", "-k", "-l", "-f", "-r", "--find"],
      prefix: ["--show-"],
    },
    "sandbox-exec": { val: ["-f", "-n", "-p", "-D"] },
    "pnpm exec": {
      val: ["--resume-from", "--filter"],
      flag: ["-r", "--recursive", "--parallel", "--no-reporter-hide-prefix", "--report-summary"],
    },
    npx: { val: ["--package", "-p"], flag: ["--yes", "-y", "--no"] },
  }).map(([name, row]) => [
    name,
    {
      val: new Set(row.val ?? []),
      flag: new Set(row.flag ?? []),
      eq: new Set(row.eq ?? []),
      eqOpt: new Set(row.eqOpt ?? []),
      attached: new Set(row.attached ?? []),
      prefix: row.prefix ?? [],
      whole: row.whole === true,
      digits: row.digits === true,
      loneDash: row.loneDash === true,
      assign: row.assign === true,
      chdir: new Set(row.chdir ?? []),
      envOpt: new Set(row.envOpt ?? []),
      pos: row.pos ?? "none",
    },
  ]),
);

/**
 * Skips what comes before the command name. `index` is the position of the command name in `words`,
 * or the number of words when no command runs. `causes` are the unknown-1 causes the words give.
 */
function resolveCommand(words) {
  const out = {
    command: null,
    unknown: false,
    index: words.length,
    envChdir: [],
    gitEnv: [],
    causes: [],
  };
  const unknown = (at, cause) => {
    out.unknown = true;
    out.index = at;
    if (cause !== undefined) out.causes.push(cause);
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
      recordAssignment(out, assignment[1], w);
      i++;
      continue;
    }
    if (RESERVED.has(w.raw)) {
      if (w.raw === "[[") {
        // the words from [[ to its ]] are a condition; the word after ]] is at command position (Z3)
        let close = i + 1;
        while (close < words.length && words[close].raw !== "]]") close++;
        if (close >= words.length) return noCommand();
        i = close + 1;
        continue;
      }
      if (NO_COMMAND_AFTER.has(w.raw)) return noCommand();
      i += w.raw === "function" || w.raw === "repeat" ? 2 : 1;
      continue;
    }
    if (w.kind !== "none") return unknown(i);
    // The lowercased base name of the fixed part, so /usr/bin/tee reads as tee (orchestrator decision
    // on ORV-138-build-shell; clause (d) says "its fixed part, lowercased"). zsh's `=word` at command
    // position reads as `word` (S9).
    const fixed = w.raw.startsWith("=") ? w.fixed.slice(1) : w.fixed;
    const name = fixed.slice(fixed.lastIndexOf("/") + 1).toLowerCase();
    if (name === "builtin" || name === "noglob" || name === "-") {
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
    } else if (name === "watch" || name === "parallel") {
      return unknown(i, `runner:${name}`);
    } else if (name === "pnpm" && optionAt(i + 1) === "exec") {
      i = skipRunner(words, i + 2, "pnpm exec", out);
      if (i < 0) return unknown(-i - 1);
    } else if (RUNNERS.has(name)) {
      i = skipRunner(words, i + 1, name, out);
      if (i < 0) return unknown(-i - 1);
    } else {
      out.command = name;
      out.index = i;
      return out;
    }
  }
}

/** Records an assignment word's effect: GIT_DIR and GIT_WORK_TREE (switch-1, resolve-1), histchars (C7). */
function recordAssignment(out, name, word) {
  if (GIT_ENV.has(name)) out.gitEnv.push({ name, word });
  if (name === "histchars") out.causes.push("C7");
}

/**
 * Skips a runner whose name is `name` in RUNNERS, from its first option at `start`: its options as
 * getopt reads them, then its positional words (clause (d)). Returns the index of the first word
 * after them, or `-(k + 1)` when the word at k makes the call unknown (the cause is added to
 * `out.causes`). Records folder changes and NAME=VALUE words in `out`.
 */
function skipRunner(words, start, name, out) {
  const row = RUNNERS.get(name);
  const bad = (at) => {
    out.causes.push(`runner:${name}`);
    return -(at + 1);
  };
  const last = (i) => Math.min(i, words.length);
  const record = (opt, word) => {
    if (word === undefined) return;
    if (row.chdir.has(opt)) out.envChdir.push(word);
    if (row.envOpt.has(opt)) {
      const assignment = ASSIGNMENT.exec(word.raw);
      if (assignment) recordAssignment(out, assignment[1], word);
    }
  };
  let i = start;
  let dashDash = false;
  for (;;) {
    const w = words[i];
    if (w === undefined) return last(i);
    if (row.assign) {
      const assignment = ASSIGNMENT.exec(w.raw);
      if (assignment) {
        recordAssignment(out, assignment[1], w);
        i++;
        continue;
      }
    }
    const f = w.fixed;
    if (!f.startsWith("-")) {
      // an expansion at the start of the word may be an option (nice $N git)
      if (f === "" && w.kind !== "none") return bad(i);
      break;
    }
    if (f === "--" && w.kind === "none") {
      dashDash = true;
      i++;
      break;
    }
    if (f === "-" && w.kind === "none") {
      if (!row.loneDash) break;
      i++;
      continue;
    }
    if (row.digits && w.kind === "none" && /^-\d+$/.test(f)) {
      i++;
      continue;
    }
    if (f.startsWith("--") || row.whole) {
      const eq = row.whole ? -1 : f.indexOf("=");
      const option = eq < 0 ? f : f.slice(0, eq);
      if (eq >= 0) {
        if (!(row.val.has(option) || row.eq.has(option) || row.eqOpt.has(option))) return bad(i);
        if (row.chdir.has(option)) out.envChdir.push(w);
        i++;
      } else {
        if (w.kind !== "none") return bad(i);
        if (row.val.has(option)) {
          record(option, words[i + 1]);
          i += 2;
        } else if (
          row.flag.has(option) ||
          row.eqOpt.has(option) ||
          row.prefix.some((p) => option.startsWith(p))
        ) {
          i++;
        } else return bad(i);
      }
      continue;
    }
    // short options, letter by letter
    let valued = false;
    for (let k = 1; k < f.length && !valued; k++) {
      const key = `-${f[k]}`;
      const tail = k === f.length - 1 && w.kind === "none";
      if (row.attached.has(f[k])) {
        if (tail) return bad(i);
        valued = true;
        i++;
      } else if (row.val.has(key)) {
        valued = true;
        if (tail) {
          record(key, words[i + 1]);
          i += 2;
        } else {
          if (row.chdir.has(key)) out.envChdir.push(w);
          i++;
        }
      } else if (!row.flag.has(key)) return bad(i);
    }
    if (!valued) {
      // every letter was a flag; an expansion after them may be more letters
      if (w.kind !== "none") return bad(i);
      i++;
    }
  }
  const w = words[i];
  if (w === undefined) return last(i);
  switch (row.pos) {
    case "none":
      return i;
    case "one":
      return w.kind === "none" ? i + 1 : bad(i);
    case "priority":
      return w.kind === "none" && /^\d+$/.test(w.fixed) ? i + 1 : bad(i);
    case "flock": {
      if (w.kind !== "none") return bad(i);
      const next = fixedAt(words, i + 1);
      return next === "-c" || next === "--command" || next?.startsWith("--command=")
        ? bad(i + 1)
        : i + 1;
    }
    case "newroot":
      out.envChdir.push(w);
      return i + 1;
    case "script": {
      if (dashDash) return i;
      if (w.kind !== "none") return bad(i);
      return words[i + 1]?.raw === "--" ? i + 2 : i + 1;
    }
    default:
      return i;
  }
}

/** The fixed text of the word at `at`, or null when there is none or it has an expansion. */
function fixedAt(words, at) {
  return words[at]?.kind === "none" ? words[at].fixed : null;
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
