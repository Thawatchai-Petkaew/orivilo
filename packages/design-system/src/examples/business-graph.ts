import {
  BUSINESS_EDGES,
  type BusinessNodeId,
  type BusinessView,
  FOUNDATION_EDGES,
  type FoundationNodeId,
} from "@orivilo/intent-engine";
import type { BoardEdge, BoardNode, Graph, PortSpec } from "../components/canvas-board/graph";
import type { Messages } from "../i18n/messages/index";
import { nodeTitle } from "./business-text";

/**
 * The business nodes as a present board (ORV-281 design section 6.3, ORV-282 slice 2). A pure
 * function of the view and the catalog: five `CanvasNode`s in ORV-126's fill order, which is the
 * Tab order, and the six edges the engine's `BUSINESS_EDGES` names. Positions are a fixed table:
 * the columns are 136 and 152 apart and the column-2 pitch is 312, so a card's label and the next card
 * never meet at any zoom the board allows. Nothing is saved on the board and nothing moves.
 *
 * ORV-291: the foundation nodes of the view follow the business nodes, with one edge per require
 * (`FOUNDATION_EDGES`) whose target the view holds. A node with more than one source gets one input
 * handle per source, named `from-<source>`; a node with one source keeps the single `in`.
 */

/** Where each node sits, in board pixels (design 6.3): `situation` and `positioning` centre on `audience`. */
export const BUSINESS_POSITIONS: Record<
  BusinessNodeId | FoundationNodeId,
  { x: number; y: number }
> = {
  situation: { x: 0, y: 326 },
  "business-core": { x: 456, y: 28 },
  audience: { x: 456, y: 340 },
  "competitive-frame": { x: 456, y: 652 },
  positioning: { x: 928, y: 326 },
  // Column 4, the upper lane (ORV-291 design 2.1), 152 right of Positioning.
  "identity-frame": { x: 1400, y: 160 },
};

const OUT = "out";
const IN = "in";
type NodeRef = BusinessNodeId | FoundationNodeId;
const from = (id: NodeRef) => `from-${id}`;

/** The edges of the board: ORV-281's six, then the foundation requires whose target the view holds. */
const edgesOf = (view: BusinessView): ReadonlyArray<readonly [NodeRef, NodeRef]> => [
  ...BUSINESS_EDGES,
  ...FOUNDATION_EDGES.filter(([, to]) => view.foundation.some((node) => node.id === to)),
];

const port = (id: string, label: string): PortSpec => ({ id, kind: "text", label });

/** The ports of one node: what it takes in from the nodes before it, and what it gives on. */
function portsOf(
  id: NodeRef,
  edges: ReturnType<typeof edgesOf>,
  m: Messages,
): { inputs: PortSpec[]; outputs: PortSpec[] } {
  const sources = edges.filter(([, to]) => to === id).map(([source]) => source);
  const feeds = edges.some(([source]) => source === id);
  return {
    // A node with several sources has one input per source, each labelled by the node it comes from.
    inputs:
      sources.length > 1
        ? sources.map((source) => port(from(source), nodeTitle(m, source)))
        : sources.map((source) => port(IN, nodeTitle(m, source))),
    outputs: feeds ? [port(OUT, nodeTitle(m, id))] : [],
  };
}

export function boardGraphOf(view: BusinessView, m: Messages): Graph {
  const edgeList = edgesOf(view);
  const nodes: BoardNode[] = [...view.nodes, ...view.foundation].map((node) => ({
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
      ...portsOf(node.id, edgeList, m),
    },
  }));
  const edges: BoardEdge[] = edgeList.map(([source, target]) => {
    const targetHandle = edgeList.filter(([, to]) => to === target).length > 1 ? from(source) : IN;
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
