/**
 * A board midway through the MVP path, for the block library, prompt and node stories (ORV-44
 * part 2): typed colours feed the starter colours (both summarized), the brief is partial and
 * feeds an empty audience, the brand personality has content but no edge (unlinked), and mood and
 * theme is still empty.
 */
import { type Answer, blockById, nodeForBlock } from "../../blocks/index";
import type { BoardEdge, BoardNode, Graph } from "../canvas-board/graph";

export function blockNode(
  id: string,
  blockId: string,
  position: { x: number; y: number },
  answers: Record<string, Answer> = {},
): BoardNode {
  const block = blockById(blockId);
  if (!block) throw new Error(`no block ${blockId}`);
  const node = nodeForBlock(block, id, position, "th");
  return { ...node, selected: false, data: { ...node.data, answers } };
}

export function feed(source: string, target: string, input: string): BoardEdge {
  return {
    id: `${source}-${target}-${input}`,
    type: "orivilo",
    source,
    target,
    sourceHandle: "out",
    targetHandle: input,
    data: { meaning: "input" },
  };
}

export const MIDWAY: Graph = {
  nodes: [
    blockNode("colours", "typed-colours", { x: 0, y: 0 }, { colours: ["#7a22c7", "#c6f432"] }),
    blockNode("starter", "starter-colours", { x: 400, y: 0 }),
    blockNode("brief", "brief", { x: 0, y: 260 }, { product: "แอปออมเงินสำหรับคนทำงาน" }),
    blockNode("audience", "audience", { x: 400, y: 260 }),
    blockNode("mood", "mood-theme", { x: 800, y: 260 }),
    blockNode(
      "personality",
      "brand-personality",
      { x: 800, y: 0 },
      {
        traits: "อบอุ่น จริงใจ ชัดเจน",
      },
    ),
  ],
  edges: [feed("colours", "starter", "primary"), feed("brief", "audience", "brief")],
};
