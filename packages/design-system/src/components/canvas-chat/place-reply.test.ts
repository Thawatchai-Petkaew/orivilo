/** placeReply and replyTitle (ORV-106 rows 13, 14, 17). */
import { describe, expect, it } from "vitest";
import { GRID } from "../canvas-board/arrange";
import { type BoardNode, connectionProblem, type Graph } from "../canvas-board/graph";
import { placeReply, replyTitle } from "./place-reply";

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
    { ...node("b", 400, { outputs: imageOut }), selected: true },
    node("note", 800),
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
    expect((g.nodes.at(-1) as BoardNode).position.x).toBeGreaterThan(800);
  });

  it("skips gone sources and counts a repeated source once", () => {
    const g = placeReply(base(), { ...reply, sources: ["ghost", "a", "a"] });
    expect(g.edges).toHaveLength(1);
    expect((g.nodes.at(-1) as BoardNode).data.inputs).toHaveLength(1);
  });

  it("uses the position with no source, and the origin without one", () => {
    expect(
      (
        placeReply(base(), { ...reply, sources: [], position: { x: 7, y: 9 } }).nodes.at(
          -1,
        ) as BoardNode
      ).position,
    ).toEqual({ x: 7, y: 9 });
    expect(
      (placeReply(base(), { ...reply, sources: [] }).nodes.at(-1) as BoardNode).position,
    ).toEqual({ x: 0, y: 0 });
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

  it("is deterministic and does not change its input", () => {
    const g = base();
    const copy = structuredClone(g);
    expect(placeReply(g, { ...reply, sources: ["a", "b"] })).toEqual(
      placeReply(g, { ...reply, sources: ["a", "b"] }),
    );
    expect(g).toEqual(copy);
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
