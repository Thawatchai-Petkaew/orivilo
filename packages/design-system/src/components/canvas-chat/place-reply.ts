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
import type { ChatBasis } from "./CanvasChat";

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
 * `placeBlock`), so selection and focus do not move.
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
  return { nodes: [...graph.nodes, node], edges: [...graph.edges, ...edges] };
}
