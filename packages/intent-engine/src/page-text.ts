// The page text of ORV-128 spec "Page text": rules html-text-1 and word-count-1, and the stylesheet
// links, all on one parse of the document bytes by the pinned tokenizer (parse5 8.0.1, K-0082).
// Pure: no I/O, no clock, no randomness. Changing any rule below bumps `analyser.version`.

import { defaultTreeAdapter, parse, Parser, type DefaultTreeAdapterMap, type Token } from "parse5";
import { PATH_MAX_CHARS } from "./evidence";

// The engine's tsconfig has no DOM or Node lib, so the global this file uses is declared here,
// module-scoped, with only the member it reads. It exists in every runtime the engine runs in.
declare class TextDecoder {
  decode(input: Uint8Array): string;
}

type Document = DefaultTreeAdapterMap["document"];
type Element = DefaultTreeAdapterMap["element"];
type ChildNode = DefaultTreeAdapterMap["childNode"];
type TextNode = DefaultTreeAdapterMap["textNode"];
type ParentNode = DefaultTreeAdapterMap["parentNode"];

export type TextBlock = {
  /** Element path such as `html>body>main:nth-of-type(1)>h1:nth-of-type(1)`; html, head and body carry no index. */
  path: string;
  kind: "title" | "meta" | "heading" | "body";
  /** The normalised text; a quote's locator offsets index this string. */
  text: string;
  /** Offsets of the source text this block came from, in the document decoded by html-text-1. */
  span: { start: number; end: number };
};

/** html-text-1: body text stops at this many characters, and so does heading text, each on its own. */
export const BODY_MAX_CHARS = 5000;
/**
 * html-text-1 and the Depth bound: an element below this depth (html is 1) gives no block and no link,
 * and the parse stops at the push that would make the tree builder's stack one deeper (the Nesting count).
 */
export const MAX_DEPTH = 128;

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const BLOCKS = new Set([
  "p",
  "li",
  "dt",
  "dd",
  "blockquote",
  "figcaption",
  "caption",
  "td",
  "th",
  "pre",
  "button",
  "label",
  "summary",
]);
const SKIPPED = new Set(["script", "style", "template", "svg", "iframe"]);

const isElement = (n: ChildNode): n is Element => "tagName" in n;
const isText = (n: ChildNode): n is TextNode => n.nodeName === "#text";
const attr = (e: Element, name: string): string | undefined =>
  e.attrs.find((a) => a.name === name)?.value;

/**
 * The Work bound: element pushes in one parse, attribute names in one tag or on one html or body
 * element, and list steps in one parse (2^28; tech notes section 6, The List steps).
 */
const MAX_ELEMENT_PUSHES = 1_048_576;
const MAX_ATTRIBUTES = 256;
const MAX_LIST_STEPS = 268_435_456;

/**
 * A stop of the parse, thrown from a tree adapter hook: the Nesting count, the Element count, the
 * Attribute merge or the List steps. Private to this module: parseBounded catches it and rethrows anything else.
 */
class NestingStop {
  readonly cut: number;
  constructor(cut: number) {
    this.cut = cut;
  }
}

// The Attribute count's scan (tech notes section 6, Work bound, The Attribute count): the attribute
// states of the WHATWG tokenizer, as parse5's tokenizer has them (K-0082 section 7 (a)).
const TAG_NAME = 0;
const BEFORE_NAME = 1;
const NAME = 2;
const AFTER_NAME = 3;
const BEFORE_VALUE = 4;
const VALUE_DQ = 5;
const VALUE_SQ = 6;
const UNQUOTED = 7;
const AFTER_QUOTED = 8;
const SELF_CLOSING = 9;
const STATES = 10;
/** A step to this ends the run: the `>` that emits the tag. */
const END = 10;
/** Added to the next state of a step that starts an attribute name (the tokenizer's `_createAttr`). */
const STARTS_NAME = 16;
const CLASSES = 7;
const WHITESPACE = 0;
const SLASH = 1;
const GT = 2;
const EQUALS = 3;
const DOUBLE = 4;
const SINGLE = 5;
const OTHER = 6;
const N = NAME | STARTS_NAME;
// Rows are states, columns are the character classes: whitespace, "/", ">", "=", '"', "'", any other.
const STEPS = Int8Array.from(
  [
    [BEFORE_NAME, SELF_CLOSING, END, TAG_NAME, TAG_NAME, TAG_NAME, TAG_NAME], // TAG_NAME
    [BEFORE_NAME, SELF_CLOSING, END, N, N, N, N], // BEFORE_NAME
    [AFTER_NAME, SELF_CLOSING, END, BEFORE_VALUE, NAME, NAME, NAME], // NAME
    [AFTER_NAME, SELF_CLOSING, END, BEFORE_VALUE, N, N, N], // AFTER_NAME
    [BEFORE_VALUE, UNQUOTED, END, UNQUOTED, VALUE_DQ, VALUE_SQ, UNQUOTED], // BEFORE_VALUE
    [VALUE_DQ, VALUE_DQ, VALUE_DQ, VALUE_DQ, AFTER_QUOTED, VALUE_DQ, VALUE_DQ], // VALUE_DQ
    [VALUE_SQ, VALUE_SQ, VALUE_SQ, VALUE_SQ, VALUE_SQ, AFTER_QUOTED, VALUE_SQ], // VALUE_SQ
    [BEFORE_NAME, UNQUOTED, END, UNQUOTED, UNQUOTED, UNQUOTED, UNQUOTED], // UNQUOTED
    [BEFORE_NAME, SELF_CLOSING, END, N, N, N, N], // AFTER_QUOTED
    [BEFORE_NAME, SELF_CLOSING, END, N, N, N, N], // SELF_CLOSING
  ].flat(),
);

/** The class of a character for STEPS. Whitespace is tab, line feed, form feed, carriage return and space. */
function classOf(code: number): number {
  switch (code) {
    case 9:
    case 10:
    case 12:
    case 13:
    case 32:
      return WHITESPACE;
    case 47:
      return SLASH;
    case 62:
      return GT;
    case 61:
      return EQUALS;
    case 34:
      return DOUBLE;
    case 39:
      return SINGLE;
    default:
      return OTHER;
  }
}

/**
 * The Attribute count (spec Work bound): the offset to cut the decoded text at, or -1. A run enters
 * the tag name state at every `<` or `</` followed by an ASCII letter, wherever it lies, and the
 * scan steps every live run through the tokenizer's attribute states. Two runs in the same state
 * move alike from then on, so only one is kept per state: the higher count, the earlier start on a
 * tie. The scan stops at the character where a run starts its 257th name and returns that run's
 * start. It counts at least what the tokenizer counts for any tag it reads, and may count more
 * where the tokenizer reads no tag (a comment, a value, the text of a `script`).
 */
function attributeCut(text: string): number {
  let counts = new Int32Array(STATES).fill(-1);
  let starts = new Int32Array(STATES);
  let nextCounts = new Int32Array(STATES);
  let nextStarts = new Int32Array(STATES);
  let live = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (live > 0) {
      const cls = classOf(code);
      nextCounts.fill(-1);
      live = 0;
      for (let state = 0; state < STATES; state++) {
        const count = counts[state] as number;
        if (count < 0) continue;
        const step = STEPS[state * CLASSES + cls] as number;
        const to = step & 15;
        if (to === END) continue;
        const next = step & STARTS_NAME ? count + 1 : count;
        const start = starts[state] as number;
        if (next > MAX_ATTRIBUTES) return start;
        const held = nextCounts[to] as number;
        if (held < 0) live++;
        if (next > held || (next === held && start < (nextStarts[to] as number))) {
          nextCounts[to] = next;
          nextStarts[to] = start;
        }
      }
      [counts, nextCounts] = [nextCounts, counts];
      [starts, nextStarts] = [nextStarts, starts];
    }
    if ((code | 32) >= 97 && (code | 32) <= 122 && i > 0) {
      const before = text.charCodeAt(i - 1);
      const tagStart =
        before === 60
          ? i - 1
          : before === 47 && i > 1 && text.charCodeAt(i - 2) === 60
            ? i - 2
            : -1;
      if (tagStart >= 0 && (counts[TAG_NAME] as number) < 0) {
        counts[TAG_NAME] = 0;
        starts[TAG_NAME] = tagStart;
        live++;
      }
    }
  }
  return -1;
}

/**
 * One parse with scripting off and source locations on. The tree builder's stack of open elements
 * is counted through parse5's tree adapter hooks `onItemPush` and `onItemPop` (K-0082
 * section 6): a new adapter for each call, so no count outlives it. A hook runs after the stack has
 * changed, so inside `onItemPush` the depth is already the new one, and the only way out of the
 * parse is to throw. The push that makes the stack one deeper than MAX_DEPTH stops the parse
 * (the Nesting count), and so does the one that would be the 1,048,577th (the Element count). The
 * adapter's `adoptAttributes` replaces the default's merge of an `html` or `body` start tag's
 * attributes into the element and stops the parse when the element would hold more than
 * MAX_ATTRIBUTES names (the Attribute merge). The List steps add the length of each walk of a
 * child list (`insertBefore`, `insertTextBefore`, `detachNode`) and of the list of active
 * formatting elements (at each push) to `steps`, and stop the parse past MAX_LIST_STEPS (tech
 * notes section 6, The List steps). `cut` is the greatest start offset of any element
 * pushed so far, the one whose push passed the bound included: for an element made from its own
 * start tag that is the tag's offset, and for one the tree builder adds with none it is the latest
 * start tag whose element was pushed (tech notes section 6, "Where the cut falls"). A merge or a
 * list step stops at that same `cut`, since neither is passed the tag's location.
 *
 * The parse runs through `Parser`, which parse5 marks `@internal`, because `onItemPush` reads
 * `parser.activeFormattingElements.entries` (also `@internal`) and `parse` does not hand out its
 * parser. The body is that of `Parser.parse` in 8.0.1; the exact pin of parse5 holds it (K-0082).
 */
function parseText(text: string): { document: Document } | { stoppedAt: number } {
  let depth = 0;
  let pushes = 0;
  let steps = 0;
  let cut = 0;
  const names = new Map<Element, Set<string>>();
  const addSteps = (n: number) => {
    steps += n;
    if (steps > MAX_LIST_STEPS) throw new NestingStop(cut);
  };
  /** The place of `ref` in `parent`, found from the end: a fostered node's reference is the table, near the end. */
  const placeOf = (parent: ParentNode, ref: ChildNode) => {
    const at = parent.childNodes.lastIndexOf(ref);
    addSteps(parent.childNodes.length - at);
    return at;
  };
  const treeAdapter = {
    ...defaultTreeAdapter,
    onItemPush(item: Element) {
      depth++;
      pushes++;
      const start = item.sourceCodeLocation?.startOffset;
      if (start !== undefined && start > cut) cut = start;
      if (depth > MAX_DEPTH || pushes > MAX_ELEMENT_PUSHES) throw new NestingStop(cut);
      addSteps(parser.activeFormattingElements.entries.length);
    },
    onItemPop() {
      depth--;
    },
    adoptAttributes(recipient: Element, attrs: Token.Attribute[]) {
      if (attrs.length === 0) return;
      let held = names.get(recipient);
      if (!held) {
        held = new Set(recipient.attrs.map((a) => a.name));
        names.set(recipient, held);
      }
      const fresh = attrs.filter((a) => !held.has(a.name));
      if (held.size + fresh.length > MAX_ATTRIBUTES) throw new NestingStop(cut);
      for (const a of fresh) {
        recipient.attrs.push(a);
        held.add(a.name);
      }
    },
    insertBefore(parent: ParentNode, node: ChildNode, ref: ChildNode) {
      parent.childNodes.splice(placeOf(parent, ref), 0, node);
      node.parentNode = parent;
    },
    insertTextBefore(parent: ParentNode, value: string, ref: ChildNode) {
      const at = placeOf(parent, ref);
      const before = parent.childNodes[at - 1];
      if (before && defaultTreeAdapter.isTextNode(before)) {
        before.value += value;
      } else {
        const node = defaultTreeAdapter.createTextNode(value);
        parent.childNodes.splice(at, 0, node);
        node.parentNode = parent;
      }
    },
    detachNode(node: ChildNode) {
      if (node.parentNode) addSteps(node.parentNode.childNodes.length);
      defaultTreeAdapter.detachNode(node);
    },
  };
  const parser = new Parser<DefaultTreeAdapterMap>({
    scriptingEnabled: false,
    sourceCodeLocationInfo: true,
    treeAdapter,
  });
  try {
    parser.tokenizer.write(text, true);
    return { document: parser.document };
  } catch (error) {
    if (error instanceof NestingStop) return { stoppedAt: error.cut };
    throw error;
  }
}

/**
 * html-text-1: decode as UTF-8 (each invalid sequence becomes U+FFFD), cut the text at the Attribute
 * count if it says so, then parse. When a count stops the parse, only the text before the cut is
 * parsed again and `cut` is true. That second parse cannot pass the Nesting count or the Attribute
 * merge; the Element count and the List steps can stop it at the end of the text (tech notes
 * section 6). Should it stop, the parse of the empty text is returned, still with `cut` true.
 */
function parseBounded(bytes: Uint8Array): { document: Document; cut: boolean } {
  const decoded = new TextDecoder().decode(bytes);
  const scanned = attributeCut(decoded);
  const text = scanned < 0 ? decoded : decoded.slice(0, scanned);
  const first = parseText(text);
  if ("document" in first) return { document: first.document, cut: scanned >= 0 };
  const second = parseText(text.slice(0, first.stoppedAt));
  if ("document" in second) return { document: second.document, cut: true };
  return {
    document: parse("", { scriptingEnabled: false, sourceCodeLocationInfo: true }),
    cut: true,
  };
}

function hidden(e: Element): boolean {
  return (
    SKIPPED.has(e.tagName) || attr(e, "hidden") !== undefined || attr(e, "aria-hidden") === "true"
  );
}

const fold = (s: string) => s.replace(/[\t\n\f\r ]+/g, " ").trim();

/** The 1-based position of each child element among the same-named children of one parent. */
type TypeIndexes = Map<Element, Map<Element, number>>;

/** One pass per parent, however many blocks ask: the cost of all paths stays linear in the children. */
function typeIndexOf(e: Element, parent: Element, cache: TypeIndexes): number {
  let indexes = cache.get(parent);
  if (!indexes) {
    indexes = new Map();
    const counts = new Map<string, number>();
    for (const c of parent.childNodes) {
      if (!isElement(c)) continue;
      const n = (counts.get(c.tagName) ?? 0) + 1;
      counts.set(c.tagName, n);
      indexes.set(c, n);
    }
    cache.set(parent, indexes);
  }
  return indexes.get(e) ?? 1;
}

/**
 * The element path of `e` (form in tech notes section 8), or null once it passes PATH_MAX_CHARS
 * (Path bound): it stops building then, before it works out the next segment's index or joins
 * anything, so no path longer than the bound is ever built. A path of exactly PATH_MAX_CHARS is kept.
 */
function pathOf(e: Element, cache: TypeIndexes): string | null {
  const segments: string[] = [];
  let length = 0;
  let node: Element | null = e;
  while (node) {
    const parent: Element | null =
      node.parentNode && "tagName" in node.parentNode ? (node.parentNode as Element) : null;
    length += node.tagName.length + (segments.length > 0 ? 1 : 0); // the name, and the ">" before it
    if (length > PATH_MAX_CHARS) return null;
    if (node.tagName === "html" || node.tagName === "head" || node.tagName === "body" || !parent) {
      segments.push(node.tagName);
    } else {
      const segment = `${node.tagName}:nth-of-type(${typeIndexOf(node, parent, cache)})`;
      length += segment.length - node.tagName.length;
      if (length > PATH_MAX_CHARS) return null;
      segments.push(segment);
    }
    node = parent;
  }
  return segments.reverse().join(">");
}

const isListedBlock = (e: Element) => HEADINGS.has(e.tagName) || BLOCKS.has(e.tagName);

/**
 * The text nodes of a block: its descendants without hidden subtrees and without nested blocks. No
 * depth check: an inline element in a block lies no deeper than the Nesting count lets the stack go
 * (a search of 400,000 generated documents found none deeper), and the walk is iterative.
 */
function textNodesOf(root: Element): TextNode[] {
  const out: TextNode[] = [];
  const stack: ChildNode[] = [];
  const pushChildren = (e: Element) => {
    for (let i = e.childNodes.length - 1; i >= 0; i--) {
      const child = e.childNodes[i];
      if (child) stack.push(child);
    }
  };
  pushChildren(root);
  for (let n = stack.pop(); n; n = stack.pop()) {
    if (isText(n)) out.push(n);
    else if (isElement(n) && !hidden(n) && !isListedBlock(n)) pushChildren(n);
  }
  return out;
}

/** The block of `e`, null when it holds no text, or "long" when its path passes the Path bound. */
function blockOf(
  e: Element,
  kind: "heading" | "body",
  cache: TypeIndexes,
): TextBlock | "long" | null {
  const nodes = textNodesOf(e);
  const text = fold(nodes.map((n) => n.value).join(""));
  const first = nodes.find((n) => n.sourceCodeLocation);
  const last = [...nodes].reverse().find((n) => n.sourceCodeLocation);
  if (text === "" || !first?.sourceCodeLocation || !last?.sourceCodeLocation) return null;
  const path = pathOf(e, cache);
  if (path === null) return "long";
  return {
    path,
    kind,
    text,
    span: { start: first.sourceCodeLocation.startOffset, end: last.sourceCodeLocation.endOffset },
  };
}

/** Pushes the element nodes onto the stack in reverse, so a pop order is document order. A loop, not a spread: a flat page has many children. */
function pushElements<T>(stack: T[], nodes: ChildNode[], make: (c: Element) => T): void {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const c = nodes[i];
    if (c && isElement(c)) stack.push(make(c));
  }
}

export type PageText = {
  blocks: TextBlock[];
  /** True when the Nesting count, the depth bound, the Heading bound or the Path bound cut something: the read is `page-incomplete`. */
  incomplete: boolean;
};

/** The blocks of the document bytes in document order, by html-text-1. Walks with an explicit stack. */
export function pageTextOf(documentBytes: Uint8Array): PageText {
  const { document, cut } = parseBounded(documentBytes);
  return textOf(document, cut);
}

/**
 * The walk of html-text-1 over a parsed tree; `cut` is true when the parse stopped early. Shared by
 * `pageTextOf` and `pageTextAndPathsOf`, so the two cannot drift.
 */
function textOf(doc: Document, cut: boolean): PageText {
  const blocks: TextBlock[] = [];
  const cache: TypeIndexes = new Map();
  let incomplete = cut;
  let used = 0; // body characters kept so far
  let bodyFull = false;
  let headingUsed = 0; // heading characters kept so far
  let headingFull = false;
  let haveTitle = false;
  let haveMeta = false;

  /** Keeps whole blocks up to the limit, then the last one cut on whitespace; returns whether the limit was hit. */
  const addBounded = (b: TextBlock, usedSoFar: number): { used: number; full: boolean } => {
    const room = BODY_MAX_CHARS - usedSoFar;
    if (b.text.length <= room) {
      blocks.push(b);
      return { used: usedSoFar + b.text.length, full: false };
    }
    // cut on whitespace within the limit: a space at the limit itself counts
    const at = b.text.lastIndexOf(" ", room);
    const text = at < 0 ? "" : b.text.slice(0, at).trimEnd();
    if (text !== "") blocks.push({ ...b, text });
    return { used: usedSoFar, full: true };
  };

  const inHead = (e: Element) => {
    for (const c of e.childNodes) {
      if (!isElement(c)) continue;
      if (c.tagName === "title" && !haveTitle && !hidden(c)) {
        const b = blockOf(c, "body", cache);
        if (b === "long") incomplete = true;
        else if (b) {
          haveTitle = true;
          blocks.push({ ...b, kind: "title" });
        }
      } else if (
        c.tagName === "meta" &&
        !haveMeta &&
        attr(c, "name")?.toLowerCase() === "description"
      ) {
        const text = fold(attr(c, "content") ?? "");
        const loc = c.sourceCodeLocation;
        if (text !== "" && loc) {
          const path = pathOf(c, cache);
          if (path === null) incomplete = true;
          else {
            haveMeta = true;
            blocks.push({
              path,
              kind: "meta",
              text,
              span: { start: loc.startOffset, end: loc.endOffset },
            });
          }
        }
      }
    }
  };

  type Entry = { e: Element; inBlock: boolean; depth: number };
  const stack: Entry[] = [];
  pushElements(stack, doc.childNodes, (e) => ({ e, inBlock: false, depth: 1 }));
  for (let item = stack.pop(); item; item = stack.pop()) {
    const { e, inBlock, depth } = item;
    if (depth > MAX_DEPTH) {
      incomplete = true;
      continue;
    }
    if (e.tagName === "head") {
      inHead(e);
      continue;
    }
    if (hidden(e)) continue;
    let block = inBlock;
    if (HEADINGS.has(e.tagName)) {
      if (!headingFull) {
        const b = blockOf(e, "heading", cache);
        if (b === "long") incomplete = true;
        else if (b) {
          // the heading bound shares the body bound's size and cut
          const r = addBounded(b, headingUsed);
          headingUsed = r.used;
          if (r.full) {
            headingFull = true;
            incomplete = true;
          }
        }
      }
      block = true;
    } else if (BLOCKS.has(e.tagName)) {
      if (!bodyFull) {
        const b = blockOf(e, "body", cache);
        if (b === "long") incomplete = true;
        else if (b) {
          const r = addBounded(b, used);
          used = r.used;
          bodyFull = r.full;
        }
      }
      block = true;
    } else if (
      !inBlock &&
      !bodyFull &&
      e.childNodes.some((c) => isText(c) && fold(c.value) !== "")
    ) {
      const b = blockOf(e, "body", cache);
      if (b === "long") incomplete = true;
      else if (b) {
        const r = addBounded(b, used);
        used = r.used;
        bodyFull = r.full;
      }
      block = true;
    }
    pushElements(stack, e.childNodes, (c) => ({ e: c, inBlock: block, depth: depth + 1 }));
  }
  return { blocks, incomplete };
}

const BARE_NAMES = new Set(["html", "head", "body"]); // the names `pathOf` writes without an index
/** A segment `pathOf` writes below the root: the name, matched from the right, then `:nth-of-type(n)` with n from 1. */
const INDEXED = /^([\s\S]+):nth-of-type\(([1-9][0-9]*)\)$/;
/** For each parent looked at, its child elements by name, in document order: built on the first visit. */
type NameMaps = Map<ParentNode, Map<string, Element[]>>;

function childrenNamed(parent: ParentNode, maps: NameMaps): Map<string, Element[]> {
  let named = maps.get(parent);
  if (!named) {
    named = new Map();
    for (const c of parent.childNodes) {
      if (!isElement(c)) continue;
      const list = named.get(c.tagName);
      if (list) list.push(c);
      else named.set(c.tagName, [c]);
    }
    maps.set(parent, named);
  }
  return named;
}

/**
 * The inverse of `pathOf`: whether `path` names an element of the tree. It goes down from the
 * document one segment at a time. The first segment is a bare name among the document's child
 * elements. Below it, a bare segment is taken only for html, head and body and names the first
 * child of that name; any other segment must end in `:nth-of-type(n)` and names the nth child of
 * that name. A segment `pathOf` never writes names nothing. `template` content lies outside the
 * child lists, so it is not reached. A path over PATH_MAX_CHARS names nothing, as `pathOf` never builds one.
 */
function hasElementAt(document: Document, path: string, maps: NameMaps): boolean {
  if (path.length > PATH_MAX_CHARS) return false;
  let parent: ParentNode = document;
  const segments = path.split(">");
  for (const [i, segment] of segments.entries()) {
    const named = childrenNamed(parent, maps);
    let next: Element | undefined;
    if (i === 0 || BARE_NAMES.has(segment)) {
      next = named.get(segment)?.[0];
    } else {
      const m = INDEXED.exec(segment);
      const name = m?.[1];
      if (name !== undefined && !BARE_NAMES.has(name)) {
        next = named.get(name)?.[Number(m?.[2]) - 1];
      }
    }
    if (!next) return false;
    parent = next;
  }
  return true;
}

/**
 * The blocks of `pageTextOf` and, from the same bounded parse, how many of the given element paths
 * name no element of the tokenized document (F52). `pageTextAndPathsOf(bytes, []).text` equals
 * `pageTextOf(bytes)`. The paths are looked up one by one; no set of every path is built.
 */
export function pageTextAndPathsOf(
  documentBytes: Uint8Array,
  paths: readonly string[],
): { text: PageText; unmatchedPaths: number } {
  const { document, cut } = parseBounded(documentBytes);
  const maps: NameMaps = new Map();
  let unmatchedPaths = 0;
  for (const path of paths) if (!hasElementAt(document, path, maps)) unmatchedPaths++;
  return { text: textOf(document, cut), unmatchedPaths };
}

/** The href of each `link rel="stylesheet"` in document order, as written (the caller resolves it). */
export function stylesheetLinksOf(documentBytes: Uint8Array): {
  hrefs: string[];
  /** True when the Nesting count cut the parse, or an element lay below the depth bound and was not looked at. */
  incomplete: boolean;
} {
  const hrefs: string[] = [];
  const { document, cut } = parseBounded(documentBytes);
  let incomplete = cut;
  const stack: (readonly [Element, number])[] = [];
  pushElements(stack, document.childNodes, (e) => [e, 1] as const);
  for (let item = stack.pop(); item; item = stack.pop()) {
    const [e, depth] = item;
    if (depth > MAX_DEPTH) {
      incomplete = true;
      continue;
    }
    if (e.tagName === "link") {
      const rel =
        attr(e, "rel")
          ?.toLowerCase()
          .split(/[\t\n\f\r ]+/) ?? [];
      const href = attr(e, "href");
      if (rel.includes("stylesheet") && href !== undefined && href.trim() !== "") {
        hrefs.push(href.trim());
      }
    }
    pushElements(stack, e.childNodes, (c) => [c, depth + 1] as const);
  }
  return { hrefs, incomplete };
}

// word-count-1: one segmenter, built once. Its data (ICU) comes with the Node build.
const SEGMENTER = new Intl.Segmenter("th", { granularity: "word" });

/** word-count-1: the number of word-like segments, so Thai without spaces counts in words. */
export function wordCount(text: string): number {
  let n = 0;
  for (const s of SEGMENTER.segment(text)) if (s.isWordLike) n++;
  return n;
}
