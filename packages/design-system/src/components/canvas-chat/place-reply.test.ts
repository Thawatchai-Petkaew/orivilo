/** placeReply and replyTitle (ORV-106 rows 13, 14, 17). */
import { describe, expect, it } from "vitest";
import { GRID, rectOf } from "../canvas-board/arrange";
import { type BoardNode, connectionProblem, type Graph } from "../canvas-board/graph";
import { chatFixtures } from "../fixtures";
import { estimateReplyHeight, placeReply, replyTitle } from "./place-reply";

const node = (id: string, x: number, data: Partial<BoardNode["data"]> = {}): BoardNode => ({
  id,
  type: "orivilo",
  position: { x, y: 40 },
  data: { title: `node ${id}`, kind: "knowledge", size: "sm", inputs: [], outputs: [], ...data },
});
const textOut = [{ id: "text", kind: "text" as const, label: "t" }];
const imageOut = [{ id: "image", kind: "image" as const, label: "i" }];

const base = (): Graph => ({
  nodes: [
    { ...node("a", 0, { outputs: textOut }), selected: true },
    { ...node("b", 600, { outputs: imageOut }), selected: true },
    node("note", 1000),
  ],
  edges: [],
});
const reply = { id: "r1", title: "T", text: "body", basis: "rules" as const };

describe("placeReply", () => {
  it("adds a note with the basis, a port and a derived edge, and keeps the selection", () => {
    const g = placeReply(base(), { ...reply, sources: ["a"] });
    const added = g.nodes.at(-1) as BoardNode;
    expect(g.nodes).toHaveLength(4);
    expect(added.data).toMatchObject({ kind: "note", summary: "body", basis: "rules", title: "T" });
    expect(added.selected).toBeUndefined();
    expect(g.nodes.filter((n) => n.selected).map((n) => n.id)).toEqual(["a", "b"]);
    expect(g.edges).toHaveLength(1);
    expect(g.edges[0]).toMatchObject({ source: "a", target: "r1", data: { meaning: "derived" } });
    expect(added.position.x).toBeGreaterThan(0);
    expect(added.position.y).toBe(40);
  });

  it("gives one input port per source, of the source's output kind, and valid edges", () => {
    const g = placeReply(base(), { ...reply, sources: ["a", "b", "note"] });
    const added = g.nodes.at(-1) as BoardNode;
    expect(added.data.inputs.map((p) => p.kind)).toEqual(["text", "image"]);
    expect(g.edges).toHaveLength(2);
    const before = { nodes: g.nodes, edges: [] };
    for (const e of g.edges) {
      expect(
        connectionProblem(before, {
          source: e.source,
          sourceHandle: e.sourceHandle ?? null,
          target: e.target,
          targetHandle: e.targetHandle ?? null,
        }),
      ).toBeNull();
    }
  });

  it("makes no edge for a source without an output but still lands beside it", () => {
    const g = placeReply(base(), { ...reply, sources: ["note"] });
    expect(g.edges).toHaveLength(0);
    expect((g.nodes.at(-1) as BoardNode).data.inputs).toHaveLength(0);
    expect((g.nodes.at(-1) as BoardNode).position.x).toBeGreaterThan(1000);
  });

  it("skips gone sources and counts a repeated source once", () => {
    const g = placeReply(base(), { ...reply, sources: ["ghost", "a", "a"] });
    expect(g.edges).toHaveLength(1);
    expect((g.nodes.at(-1) as BoardNode).data.inputs).toHaveLength(1);
  });

  it("uses the position with no source, and the origin without one", () => {
    expect(
      (
        placeReply(base(), { ...reply, sources: [], position: { x: 7, y: -400 } }).nodes.at(
          -1,
        ) as BoardNode
      ).position,
    ).toEqual({ x: 7, y: -400 });
    const empty: Graph = { nodes: [], edges: [] };
    expect(
      (placeReply(empty, { ...reply, sources: [] }).nodes.at(-1) as BoardNode).position,
    ).toEqual({
      x: 0,
      y: 0,
    });
    expect(placeReply(base(), { ...reply, sources: [] }).edges).toHaveLength(0);
  });

  it("stacks a later reply below the lowest earlier reply from the same source", () => {
    const one = placeReply(base(), { ...reply, sources: ["a"] });
    const two = placeReply(one, { ...reply, id: "r2", sources: ["a"] });
    const first = one.nodes.at(-1) as BoardNode;
    const second = two.nodes.at(-1) as BoardNode;
    expect(second.position.x).toBe(first.position.x);
    expect(second.position.y).toBeGreaterThanOrEqual(first.position.y + GRID);
    const three = placeReply(two, { ...reply, id: "r3", sources: ["a"] });
    expect((three.nodes.at(-1) as BoardNode).position.y).toBeGreaterThan(second.position.y);
  });

  it("steps a covered spot down past one and past two stacked nodes, x unchanged", () => {
    // The spot right of "a" is x 264, y 40: a blocker sits on it.
    const blocker = (id: string, y: number): BoardNode => ({
      ...node(id, 264),
      position: { x: 264, y },
    });
    const one: Graph = { ...base(), nodes: [...base().nodes, blocker("c1", 40)] };
    const landed = placeReply(one, { ...reply, sources: ["a"] }).nodes.at(-1) as BoardNode;
    const c1 = rectOf(one.nodes, blocker("c1", 40));
    expect(landed.position.x).toBe(264);
    expect(landed.position.y).toBe(40 + GRID * Math.ceil(c1.height / GRID));
    expect((landed.position.y - 40) % GRID).toBe(0);
    const two: Graph = { ...one, nodes: [...one.nodes, blocker("c2", 40 + c1.height)] };
    const lower = placeReply(two, { ...reply, sources: ["a"] }).nodes.at(-1) as BoardNode;
    expect(lower.position.x).toBe(264);
    expect(lower.position.y).toBeGreaterThanOrEqual(40 + 2 * c1.height);
    expect(lower.position.y).toBeGreaterThan(landed.position.y);
  });

  it("steps past a node below a gap that fits the default height but not the reply's estimated height", () => {
    // The gap between y 40 and the blocker at y 240 is 200 px: it fits 120, not a long reply.
    const below: BoardNode = { ...node("c", 264), position: { x: 264, y: 240 } };
    const g: Graph = { ...base(), nodes: [...base().nodes, below] };
    const long = "word ".repeat(40);
    expect(estimateReplyHeight(long)).toBeGreaterThan(200);
    const landed = placeReply(g, { ...reply, text: long, sources: ["a"] }).nodes.at(
      -1,
    ) as BoardNode;
    const bottom = 240 + rectOf(g.nodes, below).height;
    expect(landed.position.x).toBe(264);
    expect(landed.position.y).toBeGreaterThanOrEqual(bottom);
    expect((landed.position.y - 40) % GRID).toBe(0);
    // A short reply fits the same gap and stays at the free spot.
    const short = placeReply(g, { ...reply, sources: ["a"] }).nodes.at(-1) as BoardNode;
    expect(estimateReplyHeight("body")).toBeLessThan(200);
    expect(short.position).toEqual({ x: 264, y: 40 });
  });

  it("leaves a free spot as it is", () => {
    const landed = placeReply(base(), { ...reply, sources: ["a"] }).nodes.at(-1) as BoardNode;
    expect(landed.position).toEqual({ x: 264, y: 40 });
  });

  it("steps an unlinked position down when a node covers it, and never meets any node", () => {
    const g = base();
    const at = g.nodes[0] as BoardNode;
    const landed = placeReply(g, {
      ...reply,
      sources: [],
      position: { x: at.position.x + 10, y: at.position.y + 10 },
    }).nodes.at(-1) as BoardNode;
    expect(landed.position.x).toBe(10);
    expect(landed.position.y).toBeGreaterThan(50);
    expect((landed.position.y - 50) % GRID).toBe(0);
    const all = [...g.nodes, landed];
    const r = rectOf(all, landed);
    for (const n of g.nodes) {
      const o = rectOf(all, n);
      const meet =
        r.x < o.x + o.width && r.x + r.width > o.x && r.y < o.y + o.height && r.y + r.height > o.y;
      expect(meet).toBe(false);
    }
  });

  it("is deterministic and does not change its input", () => {
    const g = base();
    const copy = structuredClone(g);
    expect(placeReply(g, { ...reply, sources: ["a", "b"] })).toEqual(
      placeReply(g, { ...reply, sources: ["a", "b"] }),
    );
    expect(g).toEqual(copy);
  });
});

describe("estimateReplyHeight", () => {
  it("is never under the measured height of the fixture replies and grows with the text", () => {
    expect(estimateReplyHeight(chatFixtures.reply)).toBeGreaterThanOrEqual(223);
    expect(estimateReplyHeight(chatFixtures.replyEn)).toBeGreaterThanOrEqual(245);
    expect(estimateReplyHeight("word ".repeat(200))).toBeGreaterThan(
      estimateReplyHeight("word ".repeat(20)),
    );
    expect(estimateReplyHeight("")).toBe(estimateReplyHeight("x"));
  });

  it("counts characters, not glyph widths: 60 capitals estimate like 60 lowercase letters (known bound, spec row 30)", () => {
    const capitals = estimateReplyHeight("W".repeat(60));
    expect(capitals).toBe(estimateReplyHeight("i".repeat(60)));
    // Three lines at 20 characters; wide capitals can wrap to four in the browser.
    expect(capitals).toBe(Math.ceil(156 + 3 * 22.4));
  });
});

describe("replyTitle", () => {
  it("names the topic in both languages", () => {
    expect(replyTitle("สรุปแบรนด์", "th")).toBe("คำตอบเรื่อง สรุปแบรนด์");
    expect(replyTitle("Summarise the brand", "en")).toBe("Reply on Summarise the brand");
  });
  it("keeps the first 40 graphemes, counting a Thai cluster once", () => {
    const question = "น้ำ".repeat(50);
    expect(replyTitle(question, "th")).toBe(`คำตอบเรื่อง ${"น้ำ".repeat(40)}`);
  });
  it("folds line breaks into spaces", () => {
    expect(replyTitle("a\n\nb", "en")).toBe("Reply on a b");
  });
});
