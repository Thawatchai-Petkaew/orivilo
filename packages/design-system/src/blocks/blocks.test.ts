/**
 * The derived rules of block nodes (spec ORV-44 part 2, AC 3 to 9): fill state from answers and
 * edges, missing inputs, the rule-based summary and placing a block.
 */
import { describe, expect, it } from "vitest";
import type { BoardEdge, BoardNode, Graph } from "../components/canvas-board/graph";
import {
  type Block,
  blockById,
  blocksByModule,
  BLOCKS,
  fillState,
  missingInputs,
  nodeForBlock,
  nodeOfBlock,
  normaliseColour,
  placeBlock,
  summarize,
} from "./index";

const block = (id: string): Block => {
  const b = blockById(id);
  if (!b) throw new Error(id);
  return b;
};

function node(id: string, blockId: string, answers: Record<string, string | string[]> = {}) {
  const n: BoardNode = nodeForBlock(block(blockId), id, { x: 0, y: 0 }, "th");
  return { ...n, selected: false, data: { ...n.data, answers } };
}

function edge(source: string, target: string, handle: string): BoardEdge {
  return {
    id: `${source}-${target}-${handle}`,
    type: "orivilo",
    source,
    target,
    sourceHandle: "out",
    targetHandle: handle,
    data: { meaning: "input" },
  };
}

describe("fill state", () => {
  it("is empty with no required answer, even when an optional one is given", () => {
    const g: Graph = { nodes: [node("b", "brief", { industry: "การเงิน" })], edges: [] };
    expect(fillState(g, "b")).toBe("empty");
    expect(missingInputs(g, "b").map((i) => i.id)).toEqual(["product", "goal"]);
  });

  it("is partial with some required answers and summarized with all", () => {
    const partial: Graph = { nodes: [node("b", "brief", { product: "แอปออมเงิน" })], edges: [] };
    expect(fillState(partial, "b")).toBe("partial");
    expect(missingInputs(partial, "b").map((i) => i.id)).toEqual(["goal"]);
    const full: Graph = {
      nodes: [node("b", "brief", { product: "แอปออมเงิน", goal: "ช่วยคนทำงานเก็บเงิน" })],
      edges: [],
    };
    expect(fillState(full, "b")).toBe("summarized");
    expect(missingInputs(full, "b")).toEqual([]);
  });

  it("treats a blank answer or an empty list as missing", () => {
    const g: Graph = { nodes: [node("c", "typed-colours", { colours: [] })], edges: [] };
    expect(fillState(g, "c")).toBe("empty");
    const blank: Graph = { nodes: [node("b", "brief", { product: "  " })], edges: [] };
    expect(fillState(blank, "b")).toBe("empty");
  });

  it("is unlinked when it has content and no edge on a board with other nodes", () => {
    const g: Graph = {
      nodes: [node("c", "typed-colours", { colours: ["#1f6feb"] }), node("f", "font")],
      edges: [],
    };
    expect(fillState(g, "c")).toBe("unlinked");
    // An empty node stays empty: what it lacks matters more than its edges.
    expect(fillState(g, "f")).toBe("empty");
  });

  it("is undefined for a node outside the registry", () => {
    const plain: BoardNode = {
      id: "n",
      type: "orivilo",
      position: { x: 0, y: 0 },
      data: { title: "โน้ต", kind: "note", inputs: [], outputs: [] },
    };
    expect(fillState({ nodes: [plain], edges: [] }, "n")).toBeUndefined();
    expect(missingInputs({ nodes: [plain], edges: [] }, "n")).toEqual([]);
  });
});

describe("inputs fed by edges (AC 9)", () => {
  const colours = node("c", "typed-colours", { colours: ["#1f6feb", "#f5a524"] });

  it("counts a required input as filled when a complete upstream node feeds it", () => {
    const g: Graph = {
      nodes: [colours, node("s", "starter-colours")],
      edges: [edge("c", "s", "primary")],
    };
    expect(missingInputs(g, "s")).toEqual([]);
    expect(fillState(g, "s")).toBe("summarized");
  });

  it("does not count an edge from an incomplete node", () => {
    const g: Graph = {
      nodes: [node("c", "typed-colours"), node("s", "starter-colours")],
      edges: [edge("c", "s", "primary")],
    };
    expect(missingInputs(g, "s").map((i) => i.id)).toEqual(["primary"]);
  });

  it("does not count an edge into the wrong input or from a block the input does not take", () => {
    const g: Graph = {
      nodes: [
        colours,
        node("s", "starter-colours"),
        node("b", "brief", { product: "x", goal: "y" }),
      ],
      edges: [edge("c", "s", "secondary"), edge("b", "s", "primary")],
    };
    expect(missingInputs(g, "s").map((i) => i.id)).toEqual(["primary"]);
  });

  it("clears the downstream mark once the last upstream answer is saved (AC 8)", () => {
    const mood = node("m", "mood-theme", { feeling: "อุ่นใจ" });
    const before: Graph = {
      nodes: [node("p", "brand-personality"), mood],
      edges: [edge("p", "m", "personality")],
    };
    expect(missingInputs(before, "m").map((i) => i.id)).toEqual(["personality"]);
    const after: Graph = {
      ...before,
      nodes: [node("p", "brand-personality", { traits: "อบอุ่น จริงใจ ชัดเจน" }), mood],
    };
    expect(missingInputs(after, "m")).toEqual([]);
    expect(fillState(after, "m")).toBe("summarized");
  });
});

describe("summary", () => {
  it("lists the filled inputs by label and names the source of a fed one", () => {
    const g: Graph = {
      nodes: [
        node("c", "typed-colours", { colours: ["#1F6FEB", "f5a524"] }),
        node("s", "starter-colours", { secondary: ["#0a0"] }),
      ],
      edges: [edge("c", "s", "primary")],
    };
    const s = summarize(g, "s", "th");
    expect(s.lines).toEqual(["สีหลัก: จาก สีที่พิมพ์มา", "สีรอง: #0a0"]);
    expect(s.colours).toEqual(["#1f6feb", "#f5a524", "#00aa00"]);
    expect(summarize(g, "s", "en").lines[0]).toBe("Primary: from สีที่พิมพ์มา");
  });

  it("words a choice by its option and images by their count; shows nothing it was not given", () => {
    const g: Graph = {
      nodes: [
        node("p", "platform-languages", { platform: "both" }),
        node("r", "reference-images", { images: ["a.png", "b.png"] }),
      ],
      edges: [],
    };
    expect(summarize(g, "p", "th").lines).toEqual(["แพลตฟอร์ม: ทั้งเว็บและแอป"]);
    expect(summarize(g, "p", "en").lines).toEqual(["Platform: Web and app"]);
    expect(summarize(g, "r", "th").lines).toEqual(["ภาพ: 2 ภาพ"]);
    expect(summarize(g, "r", "th").colours).toEqual([]);
  });
});

describe("colours", () => {
  it("normalises typed hex codes and rejects anything else", () => {
    expect(normaliseColour(" #1F6FEB ")).toBe("#1f6feb");
    expect(normaliseColour("f5a")).toBe("#ff55aa");
    expect(normaliseColour("blue")).toBeUndefined();
    expect(normaliseColour("#12345")).toBeUndefined();
  });
});

describe("placing", () => {
  it("adds a node of the block with its ports, selected alone", () => {
    const g: Graph = { nodes: [{ ...node("c", "typed-colours"), selected: true }], edges: [] };
    const next = placeBlock(g, block("starter-colours"), "s", { x: 10, y: 20 }, "en");
    const placed = next.nodes.find((n) => n.id === "s");
    expect(placed?.data).toMatchObject({
      title: "Starter colours",
      kind: "direction",
      block: "starter-colours",
    });
    expect(placed?.data.inputs.map((p) => [p.id, p.kind])).toEqual([["primary", "palette"]]);
    expect(placed?.data.outputs.map((p) => [p.id, p.kind])).toEqual([["out", "palette"]]);
    expect(next.nodes.filter((n) => n.selected).map((n) => n.id)).toEqual(["s"]);
    expect(nodeOfBlock(next, "starter-colours")?.id).toBe("s");
    expect(nodeOfBlock(next, "font")).toBeUndefined();
  });

  it("groups every block under its module, in registry order", () => {
    const groups = blocksByModule();
    expect(groups.flatMap((g) => g.blocks)).toHaveLength(BLOCKS.length);
    expect(groups.map((g) => g.module)).toEqual(["brand", "design-system"]);
  });
});
