/** The board's pure rules (spec E4-2 AC 8, 9; ADR 0004 items 3 and 4). */
import { describe, expect, it } from "vitest";
import {
  type BoardEdge,
  type BoardNode,
  connectTargets,
  connectedHandles,
  connectionProblem,
  disconnectNode,
  downstreamOf,
  edgeFor,
  edgeLabel,
  type Graph,
  neighbours,
  nodeLabel,
  nudgeSelected,
  removeFromGraph,
  selectAll,
  setEdgeMeaning,
} from "./graph";

const node = (id: string, x: number, data: Partial<BoardNode["data"]> = {}): BoardNode => ({
  id,
  type: "orivilo",
  position: { x, y: 0 },
  data: { title: `node ${id}`, kind: "knowledge", inputs: [], outputs: [], ...data },
});

const text = { id: "t", kind: "text", label: "ข้อความ" } as const;
const image = { id: "i", kind: "image", label: "ภาพ" } as const;

const edge = (id: string, source: string, target: string): BoardEdge => ({
  id,
  type: "orivilo",
  source,
  target,
  sourceHandle: "t",
  targetHandle: "t",
  data: { meaning: "input" },
});

/** brief(text out) -> logo(text in, image out) -> palette(image in) ; note has a text input too. */
const graph: Graph = {
  nodes: [
    node("brief", 0, { title: "บรีฟ", kind: "input-block", outputs: [text] }),
    node("logo", 300, { title: "โลโก้", kind: "artifact", inputs: [text], outputs: [image] }),
    node("palette", 600, { title: "ชุดสี", kind: "artifact", inputs: [image] }),
    node("note", 100, { title: "โน้ต", kind: "note", inputs: [text] }),
  ],
  edges: [
    edge("e1", "brief", "logo"),
    { ...edge("e2", "logo", "palette"), sourceHandle: "i", targetHandle: "i" },
  ],
};

describe("labels", () => {
  const brief = graph.nodes[0] as BoardNode;
  const e1 = graph.edges[0] as BoardEdge;
  it("name a node by title and kind, an edge by meaning, source and target", () => {
    expect(nodeLabel(brief.data)).toBe("บรีฟ, บล็อกป้อนข้อมูล");
    expect(edgeLabel(e1, graph.nodes)).toBe("ป้อนเข้า จาก บรีฟ ไป โลโก้");
    expect(edgeLabel({ ...e1, data: { meaning: "reference", stale: true } }, graph.nodes)).toBe(
      "อ้างอิง จาก บรีฟ ไป โลโก้, ล้าสมัย",
    );
  });
});

describe("connectionProblem", () => {
  it("accepts an output to an input of the same kind on another node", () => {
    expect(
      connectionProblem(graph, {
        source: "brief",
        sourceHandle: "t",
        target: "note",
        targetHandle: "t",
      }),
    ).toBeNull();
  });

  it("explains a kind mismatch in the user's words", () => {
    expect(
      connectionProblem(graph, {
        source: "brief",
        sourceHandle: "t",
        target: "palette",
        targetHandle: "i",
      }),
    ).toBe("พอร์ตภาพรับได้เฉพาะภาพ แต่สายนี้ส่งข้อความ");
  });

  it("rejects the same node, a duplicate, a wrong direction and an unknown port", () => {
    expect(
      connectionProblem(graph, {
        source: "logo",
        sourceHandle: "i",
        target: "logo",
        targetHandle: "t",
      }),
    ).toBe("ต่อสายเข้า node ตัวเองไม่ได้");
    expect(
      connectionProblem(graph, {
        source: "brief",
        sourceHandle: "t",
        target: "logo",
        targetHandle: "t",
      }),
    ).toBe("มีสายนี้อยู่แล้ว");
    expect(
      connectionProblem(graph, {
        source: "logo",
        sourceHandle: "t",
        target: "brief",
        targetHandle: "t",
      }),
    ).toBe("สายเริ่มจากพอร์ตส่งและจบที่พอร์ตรับ");
    expect(
      connectionProblem(graph, {
        source: "brief",
        sourceHandle: "x",
        target: "note",
        targetHandle: "t",
      }),
    ).toBe("วางสายบนพอร์ตของ node อื่น");
  });

  it("builds the edge the connection adds", () => {
    const e = edgeFor({ source: "brief", sourceHandle: "t", target: "note", targetHandle: "t" });
    expect(e).toMatchObject({
      source: "brief",
      target: "note",
      type: "orivilo",
      data: { meaning: "input" },
    });
    expect(e.id).toBe("e:brief:t:note:t");
  });
});

describe("connectTargets", () => {
  it("lists compatible, unconnected inputs on other nodes, nearest first", () => {
    expect(connectTargets(graph, { nodeId: "brief", handleId: "t" })).toEqual([
      { nodeId: "note", handleId: "t" },
    ]);
    const without = { ...graph, edges: [] };
    expect(connectTargets(without, { nodeId: "brief", handleId: "t" })).toEqual([
      { nodeId: "note", handleId: "t" },
      { nodeId: "logo", handleId: "t" },
    ]);
  });

  it("is empty from an input port or an unknown node", () => {
    expect(connectTargets(graph, { nodeId: "note", handleId: "t" })).toEqual([]);
    expect(connectTargets(graph, { nodeId: "nope", handleId: "t" })).toEqual([]);
  });
});

describe("removeFromGraph", () => {
  it("removes the node and its edges, keeps downstream nodes and marks them stale", () => {
    const next = removeFromGraph(graph, { nodeIds: ["brief"] });
    expect(next.nodes.map((n) => n.id)).toEqual(["logo", "palette", "note"]);
    expect(next.nodes.find((n) => n.id === "logo")?.data.status).toBe("stale");
    expect(next.nodes.find((n) => n.id === "palette")?.data.status).toBe("stale");
    expect(next.nodes.find((n) => n.id === "note")?.data.status).toBeUndefined();
    expect(next.edges.map((e) => e.id)).toEqual(["e2"]);
    expect(next.edges[0]?.data?.stale).toBe(true);
  });

  it("removes an edge alone without touching a node", () => {
    const next = removeFromGraph(graph, { edgeIds: ["e1"] });
    expect(next.nodes).toHaveLength(4);
    expect(next.nodes.every((n) => n.data.status === undefined)).toBe(true);
    expect(next.edges.map((e) => e.id)).toEqual(["e2"]);
  });

  it("marks downstream from the edges as they were before, when the caller dropped them first", () => {
    const edgesGone = { ...graph, edges: [] };
    const next = removeFromGraph(edgesGone, { nodeIds: ["brief"] }, graph.edges);
    expect(next.nodes.find((n) => n.id === "logo")?.data.status).toBe("stale");
    expect(
      removeFromGraph(edgesGone, { nodeIds: ["brief"] }).nodes[0]?.data.status,
    ).toBeUndefined();
  });

  it("walks downstream transitively", () => {
    expect([...downstreamOf(graph.edges, ["brief"])].sort()).toEqual(["logo", "palette"]);
    expect(neighbours(graph.edges, "logo", "upstream")).toEqual(["brief"]);
    expect(neighbours(graph.edges, "logo", "downstream")).toEqual(["palette"]);
  });
});

describe("edits", () => {
  it("nudges only selected nodes", () => {
    const g = { ...graph, nodes: graph.nodes.map((n, i) => ({ ...n, selected: i === 1 })) };
    const next = nudgeSelected(g, 24, -24);
    expect(next.nodes[1]?.position).toEqual({ x: 324, y: -24 });
    expect(next.nodes[0]?.position).toEqual({ x: 0, y: 0 });
  });

  it("selects everything, disconnects one node, changes a meaning", () => {
    expect(selectAll(graph).nodes.every((n) => n.selected)).toBe(true);
    expect(selectAll(graph).edges.every((e) => e.selected)).toBe(true);
    expect(disconnectNode(graph, "logo").edges).toEqual([]);
    expect(setEdgeMeaning(graph, "e1", "derived").edges[0]?.data?.meaning).toBe("derived");
    expect(setEdgeMeaning(graph, "e1", "derived").edges[1]?.data?.meaning).toBe("input");
  });

  it("lists the handles edges touch", () => {
    expect([...connectedHandles(graph.edges)].sort()).toEqual([
      "brief:t",
      "logo:i",
      "logo:t",
      "palette:i",
    ]);
  });
});
