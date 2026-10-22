/**
 * The pure rules behind the E4-3 commands: duplicate, copy, cut and paste on the board's own
 * clipboard, groups as parent nodes, align, distribute, order, lock and collapse, and a note
 * beside a node. No React, no React Flow runtime, so the shell can run them on a saved board.
 * Positions of children are relative to their group (React Flow's parent rule); every rule that
 * compares nodes works in absolute coordinates and converts back.
 */
import { tokens } from "../../tokens/index";
import { type BoardEdge, type BoardNode, type Graph, removeFromGraph } from "./graph";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function dimension(path: string): number {
  const token = tokens.get("semantic", path);
  if (!token) throw new Error(`semantic ${path} missing`);
  return parseFloat(String(tokens.resolve(token, "light").value));
}

/** Node widths by size from the tokens; the height before a node is measured is one row of ports. */
const WIDTH: Record<string, number> = {
  sm: dimension("size.node.sm"),
  md: dimension("size.node.md"),
  lg: dimension("size.node.lg"),
};
const GRID = dimension("space.grid-gap");
const DEFAULT_HEIGHT = GRID * 5;
/** The group header and its padding, used when a group collapses. */
export const GROUP_HEADER_HEIGHT = GRID * 2;

let counter = 0;
/** A fresh id with the given stem; stable enough for tests, unique within a session. */
export function makeId(stem: string): string {
  counter += 1;
  return `${stem}-${Date.now().toString(36)}${counter}`;
}

/** The size React Flow measured, else the width for the node's size token and a default height. */
export function sizeOf(node: BoardNode): { width: number; height: number } {
  const width =
    node.measured?.width ?? node.width ?? WIDTH[node.data.size ?? "md"] ?? WIDTH["md"] ?? 0;
  const height = node.measured?.height ?? node.height ?? DEFAULT_HEIGHT;
  return { width, height };
}

export function absolutePosition(
  nodes: readonly BoardNode[],
  node: BoardNode,
): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;
  let guard = 0;
  while (parentId && guard < 100) {
    const parent = nodes.find((n) => n.id === parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
    guard += 1;
  }
  return { x, y };
}

/** The absolute rectangle of a node. */
export function rectOf(nodes: readonly BoardNode[], node: BoardNode): Rect {
  return { ...absolutePosition(nodes, node), ...sizeOf(node) };
}

/** The absolute bounds around the given nodes; an empty list gives a zero rect at the origin. */
export function boundsOf(nodes: readonly BoardNode[], ids: readonly string[]): Rect {
  const rects = nodes.filter((n) => ids.includes(n.id)).map((n) => rectOf(nodes, n));
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const right = Math.max(...rects.map((r) => r.x + r.width));
  const bottom = Math.max(...rects.map((r) => r.y + r.height));
  return { x, y, width: right - x, height: bottom - y };
}

export const isGroup = (node: BoardNode): boolean => node.type === "group";

export function childrenOf(nodes: readonly BoardNode[], groupId: string): BoardNode[] {
  return nodes.filter((n) => n.parentId === groupId);
}

/** Selected nodes plus every child of a selected group, in graph order. */
export function selectedWithChildren(graph: Graph): BoardNode[] {
  const ids = new Set(graph.nodes.filter((n) => n.selected).map((n) => n.id));
  for (const n of graph.nodes) if (n.parentId && ids.has(n.parentId)) ids.add(n.id);
  return graph.nodes.filter((n) => ids.has(n.id));
}

export function selectOnly(graph: Graph, ids: readonly string[]): Graph {
  return {
    nodes: graph.nodes.map((n) => ({ ...n, selected: ids.includes(n.id) })),
    edges: graph.edges.map((e) => ({ ...e, selected: false })),
  };
}

/** What copy keeps: nodes in absolute coordinates (parents kept only when copied too) and their internal edges. */
export interface Clipboard {
  nodes: BoardNode[];
  edges: BoardEdge[];
}

export function copySelection(graph: Graph): Clipboard {
  const picked = selectedWithChildren(graph);
  const ids = new Set(picked.map((n) => n.id));
  const nodes = picked.map((n) => {
    const keepParent = n.parentId && ids.has(n.parentId);
    const position = keepParent ? n.position : absolutePosition(graph.nodes, n);
    const copy: BoardNode = {
      ...n,
      position,
      selected: false,
      dragging: false,
      data: structuredClone(n.data),
    };
    if (!keepParent) delete copy.parentId;
    return copy;
  });
  const edges = graph.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e) => ({ ...structuredClone(e), selected: false }));
  return { nodes, edges };
}

/**
 * Adds the clipboard's nodes with new ids, offset so they do not sit on the originals, their
 * internal edges rewired, and selects the copies alone.
 */
export function pasteClipboard(
  graph: Graph,
  clip: Clipboard,
  offset: { x: number; y: number } = { x: GRID * 2, y: GRID * 2 },
  idFor: (node: BoardNode) => string = (n) => makeId(n.id),
): Graph {
  if (clip.nodes.length === 0) return graph;
  const map = new Map(clip.nodes.map((n) => [n.id, idFor(n)]));
  const nodes = clip.nodes.map((n) => {
    const id = map.get(n.id) as string;
    const parentId = n.parentId ? map.get(n.parentId) : undefined;
    const copy: BoardNode = {
      ...n,
      id,
      selected: true,
      position: parentId ? n.position : { x: n.position.x + offset.x, y: n.position.y + offset.y },
      data: structuredClone(n.data),
    };
    if (parentId) copy.parentId = parentId;
    else delete copy.parentId;
    return copy;
  });
  const edges = clip.edges.map((e) => ({
    ...e,
    id: makeId(e.id),
    source: map.get(e.source) as string,
    target: map.get(e.target) as string,
  }));
  const base = selectOnly(graph, []);
  return { nodes: [...base.nodes, ...nodes], edges: [...base.edges, ...edges] };
}

export function duplicateSelected(graph: Graph, idFor?: (node: BoardNode) => string): Graph {
  return pasteClipboard(graph, copySelection(graph), undefined, idFor);
}

/** Cut: the clipboard and the graph without the selection (downstream marked stale, as any removal). */
export function cutSelection(graph: Graph): { clipboard: Clipboard; graph: Graph } {
  const clipboard = copySelection(graph);
  const nodeIds = clipboard.nodes.map((n) => n.id);
  const edgeIds = graph.edges.filter((e) => e.selected).map((e) => e.id);
  return { clipboard, graph: removeFromGraph(graph, { nodeIds, edgeIds }) };
}

/**
 * Frames the selected nodes in a new group node placed before them (React Flow's parent rule),
 * with their positions made relative to the frame. Nodes already in a group leave it.
 */
export function groupSelected(
  graph: Graph,
  title: string,
  padding: number = dimension("space.inset.lg"),
  id: string = makeId("group"),
): Graph {
  const picked = graph.nodes.filter((n) => n.selected && !isGroup(n));
  if (picked.length < 2) return graph;
  const ids = picked.map((n) => n.id);
  const b = boundsOf(graph.nodes, ids);
  const frame = {
    x: b.x - padding,
    y: b.y - padding - GROUP_HEADER_HEIGHT,
    width: b.width + padding * 2,
    height: b.height + padding * 2 + GROUP_HEADER_HEIGHT,
  };
  const group: BoardNode = {
    id,
    type: "group",
    position: { x: frame.x, y: frame.y },
    width: frame.width,
    height: frame.height,
    selected: true,
    data: { title, kind: "group", inputs: [], outputs: [] },
  };
  const rest = graph.nodes
    .filter((n) => !ids.includes(n.id))
    .map((n) => ({ ...n, selected: false }));
  const children = picked.map((n) => {
    const abs = absolutePosition(graph.nodes, n);
    return {
      ...n,
      parentId: id,
      selected: false,
      position: { x: abs.x - frame.x, y: abs.y - frame.y },
    };
  });
  // The group goes where its first child was, so reading order stays close to the board.
  const at = graph.nodes.findIndex((n) => ids.includes(n.id));
  const nodes = [...rest.slice(0, at), group, ...rest.slice(at), ...children];
  return { ...graph, nodes };
}

/** Removes the group, keeps its children at their absolute positions and selects them. */
export function ungroup(graph: Graph, groupId: string): Graph {
  const group = graph.nodes.find((n) => n.id === groupId && isGroup(n));
  if (!group) return graph;
  const nodes = graph.nodes
    .filter((n) => n.id !== groupId)
    .map((n) =>
      n.parentId === groupId
        ? (() => {
            const next: BoardNode = {
              ...n,
              position: absolutePosition(graph.nodes, n),
              selected: true,
              hidden: false,
            };
            delete next.parentId;
            return next;
          })()
        : { ...n, selected: false },
    );
  return { nodes, edges: graph.edges.map((e) => ({ ...e, selected: false })) };
}

/** Ungroups every selected group. */
export function ungroupSelected(graph: Graph): Graph {
  return graph.nodes
    .filter((n) => n.selected && isGroup(n))
    .reduce((g, group) => ungroup(g, group.id), graph);
}

/** How a collapsed group reads: its children and the edges that cross its frame. */
export function groupSummary(graph: Graph, groupId: string): { children: number; edges: number } {
  const ids = new Set(childrenOf(graph.nodes, groupId).map((n) => n.id));
  const edges = graph.edges.filter((e) => ids.has(e.source) !== ids.has(e.target)).length;
  return { children: ids.size, edges };
}

/**
 * A child dragged outside its group's frame leaves the group (catalog NodeGroup rule). Returns
 * the graph unchanged when the node is inside, has no group, or the group is missing.
 */
export function detachIfOutside(graph: Graph, nodeId: string): Graph {
  const node = graph.nodes.find((n) => n.id === nodeId);
  const parent = node?.parentId ? graph.nodes.find((n) => n.id === node.parentId) : undefined;
  if (!node || !parent) return graph;
  const size = sizeOf(node);
  const frame = sizeOf(parent);
  const inside =
    node.position.x + size.width > 0 &&
    node.position.y + size.height > 0 &&
    node.position.x < frame.width &&
    node.position.y < frame.height;
  if (inside) return graph;
  const abs = absolutePosition(graph.nodes, node);
  const free: BoardNode = { ...node, position: abs };
  delete free.parentId;
  // Out of the group means after it in the array, still a valid order for React Flow.
  const nodes = graph.nodes.filter((n) => n.id !== nodeId);
  return { ...graph, nodes: [...nodes, free] };
}

export function toggleLockSelected(graph: Graph): Graph {
  const selected = graph.nodes.filter((n) => n.selected);
  const allLocked = selected.length > 0 && selected.every((n) => n.data.status === "locked");
  return {
    ...graph,
    nodes: graph.nodes.map((n) => {
      if (!n.selected) return n;
      const data = { ...n.data };
      if (allLocked) delete data.status;
      else data.status = "locked";
      return { ...n, data };
    }),
  };
}

/**
 * Collapses expanded selected nodes, expands collapsed ones (all one way, by the first). A group
 * that collapses hides its children and shrinks to its header; expanding restores the frame.
 */
export function toggleCollapseSelected(graph: Graph): Graph {
  const first = graph.nodes.find((n) => n.selected);
  if (!first) return graph;
  const collapse = !first.data.collapsed;
  const groups = new Set(graph.nodes.filter((n) => n.selected && isGroup(n)).map((n) => n.id));
  return {
    ...graph,
    nodes: graph.nodes.map((n) => {
      if (n.parentId && groups.has(n.parentId)) return { ...n, hidden: collapse };
      if (!n.selected) return n;
      if (isGroup(n)) {
        const size = sizeOf(n);
        if (collapse) {
          return {
            ...n,
            height: GROUP_HEADER_HEIGHT,
            data: { ...n.data, collapsed: true, frame: size },
          };
        }
        const frame = n.data.frame ?? size;
        const data = { ...n.data, collapsed: false };
        delete data.frame;
        return { ...n, height: frame.height, width: frame.width, data };
      }
      return { ...n, data: { ...n.data, collapsed: collapse } };
    }),
  };
}

export type AlignEdge = "left" | "right" | "top" | "bottom";

/** Lines selected nodes up on one edge of their common bounds, in absolute coordinates. */
export function alignSelected(graph: Graph, edge: AlignEdge): Graph {
  const picked = graph.nodes.filter((n) => n.selected && n.data.status !== "locked");
  if (picked.length < 2) return graph;
  const b = boundsOf(
    graph.nodes,
    picked.map((n) => n.id),
  );
  return {
    ...graph,
    nodes: graph.nodes.map((n) => {
      if (!picked.includes(n)) return n;
      const r = rectOf(graph.nodes, n);
      const parent = absolutePosition(graph.nodes, { ...n, position: { x: 0, y: 0 } });
      let x = r.x;
      let y = r.y;
      if (edge === "left") x = b.x;
      if (edge === "right") x = b.x + b.width - r.width;
      if (edge === "top") y = b.y;
      if (edge === "bottom") y = b.y + b.height - r.height;
      return { ...n, position: { x: x - parent.x, y: y - parent.y } };
    }),
  };
}

/** Spreads selected nodes so the gaps between them are equal along one axis. */
export function distributeSelected(graph: Graph, axis: "horizontal" | "vertical"): Graph {
  const picked = graph.nodes.filter((n) => n.selected && n.data.status !== "locked");
  if (picked.length < 3) return graph;
  const rects = picked.map((n) => ({ node: n, rect: rectOf(graph.nodes, n) }));
  const main = axis === "horizontal" ? "x" : "y";
  const extent = axis === "horizontal" ? "width" : "height";
  rects.sort((a, b) => a.rect[main] - b.rect[main]);
  const first = rects[0]?.rect;
  const last = rects[rects.length - 1]?.rect;
  if (!first || !last) return graph;
  const span = last[main] + last[extent] - first[main];
  const total = rects.reduce((sum, r) => sum + r.rect[extent], 0);
  const gap = (span - total) / (rects.length - 1);
  let cursor = first[main];
  const moved = new Map<string, number>();
  for (const r of rects) {
    moved.set(r.node.id, cursor);
    cursor += r.rect[extent] + gap;
  }
  return {
    ...graph,
    nodes: graph.nodes.map((n) => {
      const to = moved.get(n.id);
      if (to === undefined) return n;
      const parent = absolutePosition(graph.nodes, { ...n, position: { x: 0, y: 0 } });
      return {
        ...n,
        position:
          main === "x"
            ? { x: to - parent.x, y: n.position.y }
            : { x: n.position.x, y: to - parent.y },
      };
    }),
  };
}

/** Puts selected nodes above (front) or below (back) every other node by `zIndex`. */
export function reorderSelected(graph: Graph, where: "front" | "back"): Graph {
  const z = graph.nodes.map((n) => n.zIndex ?? 0);
  const next = where === "front" ? Math.max(0, ...z) + 1 : Math.min(0, ...z) - 1;
  return {
    ...graph,
    nodes: graph.nodes.map((n) => (n.selected ? { ...n, zIndex: next } : n)),
  };
}

/** A note one grid unit to the right of the node, selected alone. */
export function addNoteNext(
  graph: Graph,
  nodeId: string,
  id: string = makeId("note"),
  title = "โน้ต",
): Graph {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return graph;
  const r = rectOf(graph.nodes, node);
  const note: BoardNode = {
    id,
    type: "orivilo",
    position: { x: r.x + r.width + GRID, y: r.y },
    selected: true,
    data: { title, kind: "note", size: "sm", inputs: [], outputs: [] },
  };
  const base = selectOnly(graph, []);
  return { ...base, nodes: [...base.nodes, note] };
}
