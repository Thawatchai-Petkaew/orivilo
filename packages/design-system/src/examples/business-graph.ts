import { BUSINESS_EDGES, type BusinessNodeId, type BusinessView } from "@orivilo/intent-engine";
import type { BoardEdge, BoardNode, Graph, PortSpec } from "../components/canvas-board/graph";
import type { Messages } from "../i18n/messages/index";
import { nodeTitle } from "./business-text";

/**
 * The business nodes as a present board (ORV-281 design section 6.3, ORV-282 slice 2). A pure
 * function of the view and the catalog: five `CanvasNode`s in ORV-126's fill order, which is the
 * Tab order, and the six edges the engine's `BUSINESS_EDGES` names. Positions are a fixed table:
 * the columns are 136 and 152 apart and the column-2 pitch is 312, so a card's label and the next card
 * never meet at any zoom the board allows. Nothing is saved on the board and nothing moves.
 */

/** Where each node sits, in board pixels (design 6.3): `situation` and `positioning` centre on `audience`. */
export const BUSINESS_POSITIONS: Record<BusinessNodeId, { x: number; y: number }> = {
  situation: { x: 0, y: 326 },
  "business-core": { x: 456, y: 28 },
  audience: { x: 456, y: 340 },
  "competitive-frame": { x: 456, y: 652 },
  positioning: { x: 928, y: 326 },
};

const OUT = "out";
const IN = "in";
const from = (id: BusinessNodeId) => `from-${id}`;

const port = (id: string, label: string): PortSpec => ({ id, kind: "text", label });

/** The ports of one node: what it takes in from the nodes before it, and what it gives on. */
function portsOf(id: BusinessNodeId, m: Messages): { inputs: PortSpec[]; outputs: PortSpec[] } {
  const sources = BUSINESS_EDGES.filter(([, to]) => to === id).map(([source]) => source);
  const feeds = BUSINESS_EDGES.some(([source]) => source === id);
  return {
    // Positioning has three inputs, each labelled by the node it comes from, in column order.
    inputs:
      id === "positioning"
        ? sources.map((source) => port(from(source), nodeTitle(m, source)))
        : sources.map((source) => port(IN, nodeTitle(m, source))),
    outputs: feeds ? [port(OUT, nodeTitle(m, id))] : [],
  };
}

export function boardGraphOf(view: BusinessView, m: Messages): Graph {
  const nodes: BoardNode[] = view.nodes.map((node) => ({
    id: node.id,
    type: "orivilo",
    position: BUSINESS_POSITIONS[node.id],
    data: {
      title: nodeTitle(m, node.id),
      kind: "knowledge",
      size: "md",
      pad: "text",
      // A business node opens one view, not pages, so it has no count (decision N1, option a).
      open: {},
      ...portsOf(node.id, m),
    },
  }));
  const edges: BoardEdge[] = BUSINESS_EDGES.map(([source, target]) => {
    const targetHandle = target === "positioning" ? from(source) : IN;
    return {
      id: `e:${source}:${OUT}:${target}:${targetHandle}`,
      type: "orivilo",
      source,
      sourceHandle: OUT,
      target,
      targetHandle,
      // The solid stroke and the port glyphs carry the meaning; six pills would crowd Positioning.
      data: { meaning: "input", label: false },
    };
  });
  return { nodes, edges };
}
