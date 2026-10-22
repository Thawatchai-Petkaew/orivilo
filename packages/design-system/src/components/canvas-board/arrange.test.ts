/** The E4-3 board rules (spec AC 11 to 14): clipboard, groups, arrange, order, notes. */
import { describe, expect, it } from "vitest";
import {
  absolutePosition,
  addNoteNext,
  alignSelected,
  boundsOf,
  copySelection,
  cutSelection,
  detachIfOutside,
  distributeSelected,
  duplicateSelected,
  GROUP_HEADER_HEIGHT,
  groupSelected,
  groupSummary,
  pasteClipboard,
  reorderSelected,
  toggleCollapseSelected,
  toggleLockSelected,
  ungroup,
} from "./arrange";
import type { BoardEdge, BoardNode, Graph } from "./graph";

const node = (
  id: string,
  x: number,
  y = 0,
  extra: Partial<BoardNode> = {},
  data: Partial<BoardNode["data"]> = {},
): BoardNode => ({
  id,
  type: "orivilo",
  position: { x, y },
  measured: { width: 100, height: 50 },
  data: { title: `node ${id}`, kind: "knowledge", inputs: [], outputs: [], ...data },
  ...extra,
});
const edge = (id: string, source: string, target: string, selected = false): BoardEdge => ({
  id,
  type: "orivilo",
  source,
  target,
  selected,
  data: { meaning: "input" },
});
const sel = (n: BoardNode): BoardNode => ({ ...n, selected: true });
const ids = (g: Graph) => g.nodes.map((n) => n.id);
const selectedIds = (g: Graph) => g.nodes.filter((n) => n.selected).map((n) => n.id);

describe("clipboard", () => {
  const graph: Graph = {
    nodes: [sel(node("a", 0)), sel(node("b", 200)), node("c", 400)],
    edges: [edge("ab", "a", "b"), edge("bc", "b", "c")],
  };

  it("copies the selection with only the edges between selected nodes", () => {
    const clip = copySelection(graph);
    expect(clip.nodes.map((n) => n.id)).toEqual(["a", "b"]);
    expect(clip.edges.map((e) => e.id)).toEqual(["ab"]);
    expect(clip.nodes.every((n) => !n.selected)).toBe(true);
  });

  it("pastes copies with new ids, offset, rewired and selected alone", () => {
    const next = pasteClipboard(graph, copySelection(graph), { x: 48, y: 48 }, (n) => `${n.id}2`);
    expect(ids(next)).toEqual(["a", "b", "c", "a2", "b2"]);
    expect(selectedIds(next)).toEqual(["a2", "b2"]);
    expect(next.nodes.find((n) => n.id === "a2")?.position).toEqual({ x: 48, y: 48 });
    const copied = next.edges.find((e) => e.source === "a2");
    expect(copied?.target).toBe("b2");
    expect(next.edges).toHaveLength(3);
    expect(graph.nodes).toHaveLength(3);
  });

  it("duplicates in one step", () => {
    const next = duplicateSelected(graph, (n) => `${n.id}-dup`);
    expect(ids(next)).toEqual(["a", "b", "c", "a-dup", "b-dup"]);
  });

  it("cuts: the clipboard holds the selection and downstream nodes go stale", () => {
    const { clipboard, graph: next } = cutSelection(graph);
    expect(clipboard.nodes.map((n) => n.id)).toEqual(["a", "b"]);
    expect(ids(next)).toEqual(["c"]);
    expect(next.nodes[0]?.data.status).toBe("stale");
  });
});

describe("groups", () => {
  const graph: Graph = {
    nodes: [sel(node("a", 100, 100)), sel(node("b", 300, 100)), node("c", 600, 100)],
    edges: [edge("bc", "b", "c")],
  };

  it("frames the selection before its children with relative positions", () => {
    const next = groupSelected(graph, "กลุ่ม 1", 24, "g");
    expect(ids(next)).toEqual(["g", "c", "a", "b"]);
    const g = next.nodes[0] as BoardNode;
    expect(g.type).toBe("group");
    expect(g.position).toEqual({ x: 76, y: 76 - GROUP_HEADER_HEIGHT });
    expect(g.width).toBe(300 + 100 - 100 + 48);
    expect(g.height).toBe(50 + 48 + GROUP_HEADER_HEIGHT);
    const a = next.nodes.find((n) => n.id === "a") as BoardNode;
    expect(a.parentId).toBe("g");
    expect(a.position).toEqual({ x: 24, y: 24 + GROUP_HEADER_HEIGHT });
    expect(absolutePosition(next.nodes, a)).toEqual({ x: 100, y: 100 });
    expect(selectedIds(next)).toEqual(["g"]);
  });

  it("needs two nodes", () => {
    const one: Graph = { nodes: [sel(node("a", 0)), node("b", 100)], edges: [] };
    expect(groupSelected(one, "x")).toBe(one);
  });

  it("ungroups to absolute positions and selects the children", () => {
    const grouped = groupSelected(graph, "กลุ่ม 1", 24, "g");
    const next = ungroup(grouped, "g");
    expect(ids(next)).toEqual(["c", "a", "b"]);
    expect(next.nodes.find((n) => n.id === "a")?.position).toEqual({ x: 100, y: 100 });
    expect(next.nodes.find((n) => n.id === "a")?.parentId).toBeUndefined();
    expect(selectedIds(next)).toEqual(["a", "b"]);
  });

  it("summarises children and the edges crossing the frame", () => {
    const grouped = groupSelected(graph, "กลุ่ม 1", 24, "g");
    expect(groupSummary(grouped, "g")).toEqual({ children: 2, edges: 1 });
  });

  it("collapsing a group hides its children and keeps the frame to restore", () => {
    const grouped = groupSelected(graph, "กลุ่ม 1", 24, "g");
    const collapsed = toggleCollapseSelected(grouped);
    const g = collapsed.nodes[0] as BoardNode;
    expect(g.data.collapsed).toBe(true);
    expect(g.height).toBe(GROUP_HEADER_HEIGHT);
    expect(g.data.frame?.height).toBe(50 + 48 + GROUP_HEADER_HEIGHT);
    expect(collapsed.nodes.filter((n) => n.parentId === "g").every((n) => n.hidden)).toBe(true);
    const expanded = toggleCollapseSelected(collapsed);
    expect(expanded.nodes[0]?.height).toBe(50 + 48 + GROUP_HEADER_HEIGHT);
    expect(expanded.nodes[0]?.data.frame).toBeUndefined();
    expect(expanded.nodes.filter((n) => n.parentId === "g").every((n) => n.hidden === false)).toBe(
      true,
    );
  });

  it("a child dragged outside the frame leaves the group", () => {
    const grouped = groupSelected(graph, "กลุ่ม 1", 24, "g");
    const inside = detachIfOutside(grouped, "a");
    expect(inside).toBe(grouped);
    const moved: Graph = {
      ...grouped,
      nodes: grouped.nodes.map((n) => (n.id === "a" ? { ...n, position: { x: -500, y: 0 } } : n)),
    };
    const next = detachIfOutside(moved, "a");
    const a = next.nodes.find((n) => n.id === "a") as BoardNode;
    expect(a.parentId).toBeUndefined();
    expect(a.position).toEqual({ x: 76 - 500, y: 76 - GROUP_HEADER_HEIGHT });
    expect(ids(next).at(-1)).toBe("a");
  });

  it("copies a selected group together with its children", () => {
    const grouped = groupSelected(graph, "กลุ่ม 1", 24, "g");
    const clip = copySelection(grouped);
    expect(clip.nodes.map((n) => n.id)).toEqual(["g", "a", "b"]);
    expect(clip.nodes[1]?.parentId).toBe("g");
    const pasted = pasteClipboard(grouped, clip, { x: 10, y: 10 }, (n) => `${n.id}2`);
    expect(pasted.nodes.find((n) => n.id === "a2")?.parentId).toBe("g2");
  });
});

describe("arrange", () => {
  const three: Graph = {
    nodes: [
      sel(node("a", 0, 0)),
      sel(node("b", 300, 40)),
      sel(node("c", 900, 80, { measured: { width: 50, height: 20 } })),
    ],
    edges: [],
  };

  it("aligns on each edge of the bounds", () => {
    expect(boundsOf(three.nodes, ["a", "b", "c"])).toEqual({ x: 0, y: 0, width: 950, height: 100 });
    expect(alignSelected(three, "left").nodes.map((n) => n.position.x)).toEqual([0, 0, 0]);
    expect(alignSelected(three, "right").nodes.map((n) => n.position.x)).toEqual([850, 850, 900]);
    expect(alignSelected(three, "top").nodes.map((n) => n.position.y)).toEqual([0, 0, 0]);
    expect(alignSelected(three, "bottom").nodes.map((n) => n.position.y)).toEqual([50, 50, 80]);
  });

  it("distributes with equal gaps and leaves the ends in place", () => {
    const next = distributeSelected(three, "horizontal");
    expect(next.nodes.map((n) => n.position.x)).toEqual([0, 450, 900]);
    expect(distributeSelected({ ...three, nodes: three.nodes.slice(0, 2) }, "horizontal")).toEqual({
      ...three,
      nodes: three.nodes.slice(0, 2),
    });
  });

  it("skips locked nodes when aligning", () => {
    const locked: Graph = {
      ...three,
      nodes: three.nodes.map((n) =>
        n.id === "c" ? { ...n, data: { ...n.data, status: "locked" } } : n,
      ),
    };
    expect(alignSelected(locked, "left").nodes.map((n) => n.position.x)).toEqual([0, 0, 900]);
  });

  it("aligns across a group in absolute coordinates", () => {
    const graph: Graph = {
      nodes: [
        {
          ...node("g", 100, 100, { type: "group", width: 400, height: 300 }),
          data: { title: "g", kind: "group", inputs: [], outputs: [] },
        },
        sel(node("a", 50, 50, { parentId: "g" })),
        sel(node("b", 700, 0)),
      ],
      edges: [],
    };
    const next = alignSelected(graph, "left");
    expect(next.nodes.find((n) => n.id === "a")?.position.x).toBe(50);
    expect(next.nodes.find((n) => n.id === "b")?.position.x).toBe(150);
  });

  it("orders by zIndex", () => {
    const front = reorderSelected(
      { ...three, nodes: three.nodes.map((n, i) => ({ ...n, selected: i === 0 })) },
      "front",
    );
    expect(front.nodes[0]?.zIndex).toBe(1);
    const back = reorderSelected(front, "back");
    expect(back.nodes[0]?.zIndex).toBe(-1);
  });

  it("locks all, then unlocks all, and toggles collapse", () => {
    const locked = toggleLockSelected(three);
    expect(locked.nodes.every((n) => n.data.status === "locked")).toBe(true);
    expect(toggleLockSelected(locked).nodes.every((n) => n.data.status === undefined)).toBe(true);
    const collapsed = toggleCollapseSelected(three);
    expect(collapsed.nodes.every((n) => n.data.collapsed)).toBe(true);
    expect(toggleCollapseSelected(collapsed).nodes.every((n) => !n.data.collapsed)).toBe(true);
  });

  it("adds a note to the right of a node and selects it alone", () => {
    const next = addNoteNext(three, "a", "n1");
    const note = next.nodes.at(-1) as BoardNode;
    expect(note.data.kind).toBe("note");
    expect(note.position).toEqual({ x: 100 + 24, y: 0 });
    expect(selectedIds(next)).toEqual(["n1"]);
  });
});
