// The page text of ORV-128 spec "Page text": rules html-text-1 and word-count-1, and the stylesheet
// links, all on one parse of the document bytes by the pinned tokenizer (parse5 8.0.1, K-0082).
// Pure: no I/O, no clock, no randomness. Changing any rule below bumps `analyser.version`.

import { parse, type DefaultTreeAdapterMap } from "parse5";

// The engine's tsconfig has no DOM or Node lib, so the global this file uses is declared here,
// module-scoped, with only the member it reads. It exists in every runtime the engine runs in.
declare class TextDecoder {
  decode(input: Uint8Array): string;
}

type Element = DefaultTreeAdapterMap["element"];
type ChildNode = DefaultTreeAdapterMap["childNode"];
type TextNode = DefaultTreeAdapterMap["textNode"];

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
/** html-text-1 and the depth bound: elements below this depth (html is 1) give no block and no link. */
export const MAX_DEPTH = 512;

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

/** html-text-1: decode as UTF-8, each invalid sequence becomes U+FFFD, then parse with scripting off. */
function parseDocument(bytes: Uint8Array) {
  return parse(new TextDecoder().decode(bytes), {
    scriptingEnabled: false,
    sourceCodeLocationInfo: true,
  });
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

function pathOf(e: Element, cache: TypeIndexes): string {
  const segments: string[] = [];
  let node: Element | null = e;
  while (node) {
    const parent: Element | null =
      node.parentNode && "tagName" in node.parentNode ? (node.parentNode as Element) : null;
    if (node.tagName === "html" || node.tagName === "head" || node.tagName === "body" || !parent) {
      segments.push(node.tagName);
    } else {
      segments.push(`${node.tagName}:nth-of-type(${typeIndexOf(node, parent, cache)})`);
    }
    node = parent;
  }
  return segments.reverse().join(">");
}

const isListedBlock = (e: Element) => HEADINGS.has(e.tagName) || BLOCKS.has(e.tagName);

/** The text nodes of a block: its descendants without hidden subtrees and without nested blocks. */
function textNodesOf(root: Element, rootDepth: number): TextNode[] {
  const out: TextNode[] = [];
  const stack: [ChildNode, number][] = [];
  const pushChildren = (e: Element, depth: number) => {
    for (let i = e.childNodes.length - 1; i >= 0; i--) {
      const child = e.childNodes[i];
      if (child) stack.push([child, depth + 1]);
    }
  };
  pushChildren(root, rootDepth);
  for (let item = stack.pop(); item; item = stack.pop()) {
    const [n, depth] = item;
    if (isText(n)) out.push(n);
    else if (isElement(n) && depth <= MAX_DEPTH && !hidden(n) && !isListedBlock(n)) {
      pushChildren(n, depth);
    }
  }
  return out;
}

function blockOf(
  e: Element,
  kind: "heading" | "body",
  depth: number,
  cache: TypeIndexes,
): TextBlock | null {
  const nodes = textNodesOf(e, depth);
  const text = fold(nodes.map((n) => n.value).join(""));
  const first = nodes.find((n) => n.sourceCodeLocation);
  const last = [...nodes].reverse().find((n) => n.sourceCodeLocation);
  if (text === "" || !first?.sourceCodeLocation || !last?.sourceCodeLocation) return null;
  return {
    path: pathOf(e, cache),
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
  /** True when the depth bound or the heading bound cut something: the read is `page-incomplete`. */
  incomplete: boolean;
};

/** The blocks of the document bytes in document order, by html-text-1. Walks with an explicit stack. */
export function pageTextOf(documentBytes: Uint8Array): PageText {
  const blocks: TextBlock[] = [];
  const cache: TypeIndexes = new Map();
  let incomplete = false;
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

  const inHead = (e: Element, depth: number) => {
    for (const c of e.childNodes) {
      if (!isElement(c)) continue;
      if (c.tagName === "title" && !haveTitle && !hidden(c)) {
        const b = blockOf(c, "body", depth + 1, cache);
        if (b) {
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
          haveMeta = true;
          blocks.push({
            path: pathOf(c, cache),
            kind: "meta",
            text,
            span: { start: loc.startOffset, end: loc.endOffset },
          });
        }
      }
    }
  };

  type Entry = { e: Element; inBlock: boolean; depth: number };
  const doc = parseDocument(documentBytes);
  const stack: Entry[] = [];
  pushElements(stack, doc.childNodes, (e) => ({ e, inBlock: false, depth: 1 }));
  for (let item = stack.pop(); item; item = stack.pop()) {
    const { e, inBlock, depth } = item;
    if (depth > MAX_DEPTH) {
      incomplete = true;
      continue;
    }
    if (e.tagName === "head") {
      inHead(e, depth);
      continue;
    }
    if (hidden(e)) continue;
    let block = inBlock;
    if (HEADINGS.has(e.tagName)) {
      if (!headingFull) {
        const b = blockOf(e, "heading", depth, cache);
        if (b) {
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
        const b = blockOf(e, "body", depth, cache);
        if (b) {
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
      const b = blockOf(e, "body", depth, cache);
      if (b) {
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

/** The href of each `link rel="stylesheet"` in document order, as written (the caller resolves it). */
export function stylesheetLinksOf(documentBytes: Uint8Array): {
  hrefs: string[];
  /** True when an element lay below the depth bound and was not looked at. */
  incomplete: boolean;
} {
  const hrefs: string[] = [];
  let incomplete = false;
  const stack: (readonly [Element, number])[] = [];
  pushElements(stack, parseDocument(documentBytes).childNodes, (e) => [e, 1] as const);
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
