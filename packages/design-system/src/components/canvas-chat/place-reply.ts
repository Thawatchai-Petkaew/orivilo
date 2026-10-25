/**
 * Places a finished chat reply on the board (ORV-106, ADR 0004): a note linked by `derived` edges
 * to the nodes it is about. Pure and deterministic, so the shell can run it on a saved board. No
 * React, no time or random value; the caller gives the id.
 */
import type { Locale } from "../../i18n/locale";
import { fill, messagesFor } from "../../i18n/messages/index";
import { GRID, rectOf } from "../canvas-board/arrange";
import {
  type BoardEdge,
  type BoardNode,
  edgeFor,
  type Graph,
  type PortSpec,
} from "../canvas-board/graph";
import type { ChatBasis } from "../canvas-board/graph";

/** How many graphemes of the question the reply title keeps. */
const TOPIC_LENGTH = 40;

/** The question's first 40 graphemes with line breaks folded into spaces: what a reply is "on". */
export function replyTopic(question: string, locale: Locale): string {
  const flat = question.replace(/\s+/g, " ").trim();
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") {
    return Array.from(flat).slice(0, TOPIC_LENGTH).join("");
  }
  return Array.from(new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(flat))
    .slice(0, TOPIC_LENGTH)
    .map((s) => s.segment)
    .join("");
}

/** The `chat.replyTitle` text ("Reply on {topic}" in English): the topic is the question's first 40 graphemes. */
export function replyTitle(question: string, locale: Locale): string {
  return fill(messagesFor(locale).chat.replyTitle, { topic: replyTopic(question, locale) });
}

/**
 * Browser probe (ORV-107, Chromium, `OnBoard` story, light, sm note, 240 px wide): a reply note is
 * the header, the input port row and the border and padding, 156 px in all with no text, plus 22.4
 * px (the body line height) a line; the text column is 206 px wide, about 29 characters of Thai or
 * Latin text a line. 20 characters a line leaves room for wide glyphs and a title that wraps, so
 * the estimate never falls under a measured reply (223 px for the Thai fixture, 245 px for the
 * English one).
 */
const REPLY_CHROME = 156;
const REPLY_LINE_HEIGHT = 22.4;
const REPLY_CHARS_PER_LINE = 20;

/** The height, in flow px, a reply note with this text is expected to render at; worked out from the text alone. */
export function estimateReplyHeight(text: string): number {
  const lines = Math.max(1, Math.ceil(Array.from(text).length / REPLY_CHARS_PER_LINE));
  return Math.ceil(REPLY_CHROME + lines * REPLY_LINE_HEIGHT);
}

export interface PlacedReply {
  id: string;
  title: string;
  text: string;
  basis: ChatBasis;
  /** Node ids the reply is about; ones gone from the graph are skipped, a repeat counts once. */
  sources: readonly string[];
  /** Where the node lands when no source is on the board (flow coordinates); the origin if absent. */
  position?: { x: number; y: number } | undefined;
}

/**
 * The graph with the reply added as a `note`, one input port per source that has an output, and a
 * `derived` edge from each. Existing nodes and edges keep their `selected` state (unlike
 * `placeBlock`), so selection and focus do not move. The note lands at the first spot, stepping
 * down by the grid gap, where it covers no node at its estimated height.
 */
export function placeReply(graph: Graph, reply: PlacedReply): Graph {
  const sources = [...new Set(reply.sources)]
    .map((id) => graph.nodes.find((n) => n.id === id))
    .filter((n): n is BoardNode => n !== undefined);

  const inputs: PortSpec[] = [];
  const edges: BoardEdge[] = [];
  for (const source of sources) {
    const out = source.data.outputs[0];
    if (!out) continue;
    const port: PortSpec = { id: `from-${source.id}`, kind: out.kind, label: source.data.title };
    inputs.push(port);
    edges.push({
      ...edgeFor(
        { source: source.id, sourceHandle: out.id, target: reply.id, targetHandle: port.id },
        "derived",
      ),
    });
  }

  const anchor = sources[0];
  let position = reply.position ?? { x: 0, y: 0 };
  if (anchor) {
    const at = rectOf(graph.nodes, anchor);
    // Below the lowest earlier reply that this source already links to.
    const earlier = graph.edges
      .filter((e) => e.source === anchor.id && e.data?.meaning === "derived")
      .map((e) => graph.nodes.find((n) => n.id === e.target))
      .filter((n): n is BoardNode => n?.data.basis !== undefined);
    const lowest = Math.max(
      ...earlier.map((n) => {
        const r = rectOf(graph.nodes, n);
        return r.y + r.height;
      }),
    );
    position = {
      x: at.x + at.width + GRID,
      y: earlier.length > 0 ? Math.max(at.y, lowest + GRID) : at.y,
    };
  }

  const node: BoardNode = {
    id: reply.id,
    type: "orivilo",
    position,
    data: {
      title: reply.title,
      kind: "note",
      size: "sm",
      summary: reply.text,
      basis: reply.basis,
      inputs,
      outputs: [],
    },
  };
  // Never cover a node: step down by the grid gap until the note's rect meets none (ORV-107 row 30).
  // The rect is as high as the note is expected to render (not rectOf's default height), so a gap
  // that fits only the default does not take it. Past the lowest node nothing is left to meet.
  const others = graph.nodes.filter((n) => !n.hidden).map((n) => rectOf(graph.nodes, n));
  const meets = () => {
    const r = { ...rectOf([node], node), height: estimateReplyHeight(reply.text) };
    return others.some(
      (o) =>
        r.x < o.x + o.width && r.x + r.width > o.x && r.y < o.y + o.height && r.y + r.height > o.y,
    );
  };
  while (meets()) node.position = { x: node.position.x, y: node.position.y + GRID };
  return { nodes: [...graph.nodes, node], edges: [...graph.edges, ...edges] };
}
