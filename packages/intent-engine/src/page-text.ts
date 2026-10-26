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
  /** Element path such as `html>body>main>h1:nth-of-type(1)`; html, head and body carry no index. */
  path: string;
  kind: "title" | "meta" | "heading" | "body";
  /** The normalised text; a quote's locator offsets index this string. */
  text: string;
  /** Offsets of the source text this block came from, in the document decoded by html-text-1. */
  span: { start: number; end: number };
};

/** html-text-1: body text stops at this many characters. */
export const BODY_MAX_CHARS = 5000;

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

function pathOf(e: Element): string {
  const segments: string[] = [];
  let node: Element | null = e;
  while (node) {
    const parent: Element | null =
      node.parentNode && "tagName" in node.parentNode ? (node.parentNode as Element) : null;
    if (node.tagName === "html" || node.tagName === "head" || node.tagName === "body") {
      segments.unshift(node.tagName);
    } else {
      const same = (parent?.childNodes ?? []).filter(
        (c) => isElement(c) && c.tagName === node?.tagName,
      );
      segments.unshift(`${node.tagName}:nth-of-type(${same.indexOf(node) + 1})`);
    }
    node = parent;
  }
  return segments.join(">");
}

/** The text nodes of a block: its descendants without hidden subtrees and without nested blocks. */
function textNodesOf(e: Element, out: TextNode[] = []): TextNode[] {
  for (const c of e.childNodes) {
    if (isText(c)) out.push(c);
    else if (isElement(c) && !hidden(c) && !isListedBlock(c)) textNodesOf(c, out);
  }
  return out;
}

const isListedBlock = (e: Element) => HEADINGS.has(e.tagName) || BLOCKS.has(e.tagName);

function blockOf(e: Element, kind: "heading" | "body"): TextBlock | null {
  const nodes = textNodesOf(e);
  const text = fold(nodes.map((n) => n.value).join(""));
  const first = nodes.find((n) => n.sourceCodeLocation);
  const last = [...nodes].reverse().find((n) => n.sourceCodeLocation);
  if (text === "" || !first?.sourceCodeLocation || !last?.sourceCodeLocation) return null;
  return {
    path: pathOf(e),
    kind,
    text,
    span: { start: first.sourceCodeLocation.startOffset, end: last.sourceCodeLocation.endOffset },
  };
}

/** The blocks of the document bytes in document order, by html-text-1. */
export function pageTextOf(documentBytes: Uint8Array): TextBlock[] {
  const blocks: TextBlock[] = [];
  let used = 0; // body characters kept so far
  let bodyFull = false;
  let haveTitle = false;
  let haveMeta = false;

  const addBody = (b: TextBlock) => {
    if (bodyFull) return;
    const room = BODY_MAX_CHARS - used;
    if (b.text.length <= room) {
      used += b.text.length;
      blocks.push(b);
      return;
    }
    bodyFull = true;
    // cut on whitespace within the limit: a space at the limit itself counts
    const at = b.text.lastIndexOf(" ", room);
    const text = at < 0 ? "" : b.text.slice(0, at).trimEnd();
    if (text !== "") blocks.push({ ...b, text });
  };

  const inHead = (e: Element) => {
    for (const c of e.childNodes) {
      if (!isElement(c)) continue;
      if (c.tagName === "title" && !haveTitle && !hidden(c)) {
        const b = blockOf(c, "body");
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
            path: pathOf(c),
            kind: "meta",
            text,
            span: { start: loc.startOffset, end: loc.endOffset },
          });
        }
      }
    }
  };

  const visit = (e: Element, inBlock: boolean) => {
    if (e.tagName === "head") return inHead(e);
    if (hidden(e)) return;
    let block = inBlock;
    if (HEADINGS.has(e.tagName)) {
      const b = blockOf(e, "heading");
      if (b) blocks.push(b);
      block = true;
    } else if (BLOCKS.has(e.tagName)) {
      const b = blockOf(e, "body");
      if (b) addBody(b);
      block = true;
    } else if (!inBlock && e.childNodes.some((c) => isText(c) && fold(c.value) !== "")) {
      const b = blockOf(e, "body");
      if (b) addBody(b);
      block = true;
    }
    for (const c of e.childNodes) if (isElement(c)) visit(c, block);
  };

  const doc = parseDocument(documentBytes);
  for (const c of doc.childNodes) if (isElement(c)) visit(c, false);
  return blocks;
}

/** The href of each `link rel="stylesheet"` in document order, as written (the caller resolves it). */
export function stylesheetLinksOf(documentBytes: Uint8Array): string[] {
  const hrefs: string[] = [];
  const walk = (e: Element) => {
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
    for (const c of e.childNodes) if (isElement(c)) walk(c);
  };
  for (const c of parseDocument(documentBytes).childNodes) if (isElement(c)) walk(c);
  return hrefs;
}

// word-count-1: one segmenter, built once. Its data (ICU) comes with the Node build.
const SEGMENTER = new Intl.Segmenter("th", { granularity: "word" });

/** word-count-1: the number of word-like segments, so Thai without spaces counts in words. */
export function wordCount(text: string): number {
  let n = 0;
  for (const s of SEGMENTER.segment(text)) if (s.isWordLike) n++;
  return n;
}
