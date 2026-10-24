/**
 * The board's document model and the pure rules the components apply (ADR 0004 items 3 and 4,
 * spec E4-2): typed ports that accept only their own kind, edges with a meaning, deletion that
 * keeps downstream nodes and marks them stale, and the keyboard connect target list. No React,
 * no React Flow runtime: the shell can run the same rules on a saved board.
 */
import type { Connection, Edge, Node } from "@xyflow/react";
import type { ChatBasis } from "../canvas-chat/CanvasChat";
import { DEFAULT_LOCALE, type Locale, pick } from "../../i18n/locale";
import { fill, messagesFor } from "../../i18n/messages/index";
import {
  CANVAS_WORDS,
  type EdgeMeaning,
  type NodeKind,
  type NodeStatus,
  type PortDirection,
  type PortKind,
} from "../../tokens/canvas";

export type NodeSize = "sm" | "md" | "lg" | "custom";

/** What the engine does in a step; picks the step's icon (ORV-57). */
export type StepTask = "read" | "draft" | "compare" | "generate" | "review";

/** One step of a run, reported by the engine. A node shows steps only when the run sends them. */
export interface NodeStep {
  id: string;
  /** What the step does, in the author's language. */
  label: string;
  task: StepTask;
  state: "done" | "current" | "pending";
}

export interface PortSpec {
  /** Unique within the node; the React Flow handle id. */
  id: string;
  kind: PortKind;
  /** Shown next to the glyph; document content, so the author's language. */
  label: string;
}

/** Plain data, so a board saves as JSON; rich content renders through the board's `renderBody`. */
export type NodeContent = {
  title: string;
  kind: NodeKind;
  /** `custom` takes the width from `node.width`; the resizer is a later story. */
  size?: NodeSize;
  /** Plain-text body when no `renderBody` is given. */
  summary?: string;
  status?: NodeStatus;
  /** When the current run started (ISO 8601); a running node shows the time since. */
  startedAt?: string;
  /** The run's steps, as the engine reports them. */
  steps?: NodeStep[];
  /** What went wrong and how to fix it. */
  error?: string;
  /** Input words a node outside the block registry still needs; a block node derives its own. */
  missing?: string[];
  /** The registry block this node is made from (`catalog/blocks/mvp.yaml`, ORV-44 part 2). */
  block?: string;
  /** The user's answers by input id; a block node's fill state and summary come from these. */
  answers?: Record<string, string | string[]>;
  /** Where a reply on this node came from; set only on a node a chat reply placed (ORV-106). */
  basis?: ChatBasis;
  collapsed?: boolean;
  /** A group's frame while expanded, kept so collapse and expand restore it (E4-3). */
  frame?: { width: number; height: number };
  inputs: PortSpec[];
  outputs: PortSpec[];
};

/** A node on the board: `orivilo` for every kind with ports, `group` for a frame around children (E4-3). */
export type BoardNode = Node<NodeContent, "orivilo" | "group">;

export type EdgeContent = {
  meaning: EdgeMeaning;
  /** The source changed after the target ran. */
  stale?: boolean;
  /** The kinds no longer match (an edit after the connection). */
  invalid?: boolean;
};

export type BoardEdge = Edge<EdgeContent, "orivilo">;

export interface Graph {
  nodes: BoardNode[];
  edges: BoardEdge[];
}

export interface PortRef {
  nodeId: string;
  handleId: string;
}

/** The node's accessible name: title, then kind (catalog CanvasNode a11y). */
export function nodeLabel(content: NodeContent, locale: Locale = DEFAULT_LOCALE): string {
  return fill(messagesFor(locale).graph.nodeLabel, {
    title: content.title,
    kind: pick(CANVAS_WORDS.node[content.kind], locale),
  });
}

function titleOf(nodes: readonly BoardNode[], id: string): string {
  return nodes.find((n) => n.id === id)?.data.title ?? id;
}

/** The edge's accessible name: meaning from source to target, plus its state word (catalog CanvasEdge a11y). */
export function edgeLabel(
  edge: BoardEdge,
  nodes: readonly BoardNode[],
  locale: Locale = DEFAULT_LOCALE,
): string {
  const base = fill(messagesFor(locale).graph.edgeLabel, {
    meaning: pick(CANVAS_WORDS.edge[edge.data?.meaning ?? "input"], locale),
    source: titleOf(nodes, edge.source),
    target: titleOf(nodes, edge.target),
  });
  const state = edgeStateWord(edge, locale);
  return state ? `${base}, ${state}` : base;
}

/** The stale word or the `graph.invalid` message when the edge carries that state; otherwise empty. */
export function edgeStateWord(edge: BoardEdge, locale: Locale = DEFAULT_LOCALE): string {
  if (edge.data?.invalid) return messagesFor(locale).graph.invalid;
  if (edge.data?.stale) return pick(CANVAS_WORDS.status.stale, locale);
  return "";
}

export function portOf(
  nodes: readonly BoardNode[],
  ref: { nodeId: string; handleId: string | null | undefined },
): { port: PortSpec; direction: PortDirection } | undefined {
  const node = nodes.find((n) => n.id === ref.nodeId);
  if (!node || !ref.handleId) return undefined;
  const input = node.data.inputs.find((p) => p.id === ref.handleId);
  if (input) return { port: input, direction: "input" };
  const output = node.data.outputs.find((p) => p.id === ref.handleId);
  return output ? { port: output, direction: "output" } : undefined;
}

/** True when an edge already joins these two handles. */
export function hasEdge(edges: readonly BoardEdge[], c: Connection): boolean {
  return edges.some(
    (e) =>
      e.source === c.source &&
      e.target === c.target &&
      (e.sourceHandle ?? null) === (c.sourceHandle ?? null) &&
      (e.targetHandle ?? null) === (c.targetHandle ?? null),
  );
}

/**
 * Why a connection cannot be made, in the user's words, or null when it can: an output to an
 * input, same kind, different nodes, not yet connected (spec E4-2 AC 9). React Flow's
 * `isValidConnection` and the keyboard path both call it.
 */
export function connectionProblem(
  graph: Graph,
  c: Connection,
  locale: Locale = DEFAULT_LOCALE,
): string | null {
  const m = messagesFor(locale).graph;
  if (c.source === c.target) return m.selfLoop;
  const from = portOf(graph.nodes, { nodeId: c.source, handleId: c.sourceHandle });
  const to = portOf(graph.nodes, { nodeId: c.target, handleId: c.targetHandle });
  if (!from || !to) return m.otherNode;
  if (from.direction !== "output" || to.direction !== "input") return m.direction;
  if (from.port.kind !== to.port.kind) {
    return fill(m.kindMismatch, {
      want: pick(CANVAS_WORDS.port[to.port.kind], locale),
      got: pick(CANVAS_WORDS.port[from.port.kind], locale),
    });
  }
  if (hasEdge(graph.edges, c)) return m.exists;
  return null;
}

/** The id an added edge takes, stable for the same handles. */
export function edgeId(c: Connection): string {
  return `e:${c.source}:${c.sourceHandle ?? ""}:${c.target}:${c.targetHandle ?? ""}`;
}

/** A new input edge for a valid connection; the caller checked `connectionProblem` first. */
export function edgeFor(c: Connection, meaning: EdgeMeaning = "input"): BoardEdge {
  return {
    id: edgeId(c),
    type: "orivilo",
    source: c.source,
    target: c.target,
    sourceHandle: c.sourceHandle ?? null,
    targetHandle: c.targetHandle ?? null,
    data: { meaning },
  };
}

function distance(a: BoardNode, b: BoardNode): number {
  return Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y);
}

/**
 * Where a keyboard connection from `from` may land: every input port of the same kind on another
 * node that is not yet connected to it, nearest node first (catalog NodePort a11y).
 */
export function connectTargets(graph: Graph, from: PortRef): PortRef[] {
  const source = graph.nodes.find((n) => n.id === from.nodeId);
  const port = portOf(graph.nodes, from);
  if (!source || !port || port.direction !== "output") return [];
  const out: { ref: PortRef; d: number }[] = [];
  for (const node of graph.nodes) {
    if (node.id === source.id) continue;
    for (const input of node.data.inputs) {
      const c: Connection = {
        source: source.id,
        sourceHandle: from.handleId,
        target: node.id,
        targetHandle: input.id,
      };
      if (connectionProblem(graph, c) === null) {
        out.push({ ref: { nodeId: node.id, handleId: input.id }, d: distance(source, node) });
      }
    }
  }
  return out.sort((a, b) => a.d - b.d).map((o) => o.ref);
}

/** Node ids reachable downstream of `ids` through edges (not including `ids`). */
export function downstreamOf(edges: readonly BoardEdge[], ids: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...ids];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    for (const e of edges) {
      if (e.source === id && !seen.has(e.target) && !ids.includes(e.target)) {
        seen.add(e.target);
        queue.push(e.target);
      }
    }
  }
  return seen;
}

/** The ids one step upstream or downstream of a node, in edge order. */
export function neighbours(
  edges: readonly BoardEdge[],
  id: string,
  side: "upstream" | "downstream",
): string[] {
  const out: string[] = [];
  for (const e of edges) {
    const other =
      side === "upstream" ? (e.target === id ? e.source : null) : e.source === id ? e.target : null;
    if (other && !out.includes(other)) out.push(other);
  }
  return out;
}

/**
 * Removes nodes and edges. Edges touching a removed node go with it; a node downstream of a
 * removed node stays and is marked stale, and so are the edges it feeds (ADR 0004 item 3).
 * Removing an edge alone removes no node.
 */
export function removeFromGraph(
  graph: Graph,
  remove: { nodeIds?: readonly string[]; edgeIds?: readonly string[] },
  /** The edges as they were before this deletion began, when the caller already dropped some. */
  edgesBefore: readonly BoardEdge[] = graph.edges,
): Graph {
  const nodeIds = new Set(remove.nodeIds ?? []);
  const edgeIds = new Set(remove.edgeIds ?? []);
  const stale = downstreamOf(edgesBefore, [...nodeIds]);
  const nodes = graph.nodes
    .filter((n) => !nodeIds.has(n.id))
    .map((n) => (stale.has(n.id) ? { ...n, data: { ...n.data, status: "stale" as const } } : n));
  const edges = graph.edges
    .filter((e) => !edgeIds.has(e.id) && !nodeIds.has(e.source) && !nodeIds.has(e.target))
    .map((e) =>
      stale.has(e.source)
        ? { ...e, data: { ...(e.data ?? { meaning: "input" }), stale: true } }
        : e,
    );
  return { nodes, edges };
}

/** An edge feeds a node the engine is working on, so it shows data flowing (ORV-57). */
export function feedsRunning(graph: Graph, edge: BoardEdge): boolean {
  if (edge.data?.stale || edge.data?.invalid) return false;
  return graph.nodes.find((n) => n.id === edge.target)?.data.status === "running";
}

/** Minutes and seconds since `startedAt`, or nothing when there is no start or it is in the future. */
export function elapsedSince(startedAt: string | undefined, now: number): string | undefined {
  if (!startedAt) return undefined;
  const start = Date.parse(startedAt);
  if (Number.isNaN(start) || start > now) return undefined;
  const seconds = Math.floor((now - start) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Moves every selected node by the given offset. */
export function nudgeSelected(graph: Graph, dx: number, dy: number): Graph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) =>
      n.selected ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } } : n,
    ),
  };
}

export function selectAll(graph: Graph, selected = true): Graph {
  return {
    nodes: graph.nodes.map((n) => ({ ...n, selected })),
    edges: graph.edges.map((e) => ({ ...e, selected })),
  };
}

/** Removes every edge that touches the node; the node stays. */
export function disconnectNode(graph: Graph, id: string): Graph {
  return { ...graph, edges: graph.edges.filter((e) => e.source !== id && e.target !== id) };
}

export function setEdgeMeaning(graph: Graph, id: string, meaning: EdgeMeaning): Graph {
  return {
    ...graph,
    edges: graph.edges.map((e) =>
      e.id === id ? { ...e, data: { ...(e.data ?? {}), meaning } } : e,
    ),
  };
}

/** Handles an edge touches, as `nodeId:handleId`, for the port's `connected` state. */
export function connectedHandles(edges: readonly BoardEdge[]): Set<string> {
  const out = new Set<string>();
  for (const e of edges) {
    out.add(`${e.source}:${e.sourceHandle ?? ""}`);
    out.add(`${e.target}:${e.targetHandle ?? ""}`);
  }
  return out;
}
