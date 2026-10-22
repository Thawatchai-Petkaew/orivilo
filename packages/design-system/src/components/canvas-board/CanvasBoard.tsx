"use client";

import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  type Connection,
  type EdgeChange,
  type EdgeTypes,
  type FinalConnectionState,
  MarkerType,
  type NodeChange,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
} from "@xyflow/react";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CANVAS_WORDS, type EdgeMeaning } from "../../tokens/canvas";
import { tokens } from "../../tokens/index";
import {
  type CommandId,
  type CommandScope,
  commandAvailable,
  commandById,
  commandForKey,
  shortcutsOf,
} from "../../commands/index";
import { CanvasContextMenu, type ContextTarget } from "../canvas-context-menu/CanvasContextMenu";
import { CanvasControls } from "../canvas-controls/CanvasControls";
import { CanvasEdge } from "../canvas-edge/CanvasEdge";
import { CanvasNode } from "../canvas-node/CanvasNode";
import { CommandMenu, type CommandMenuMode } from "../command-menu/CommandMenu";
import { openContextMenuAt } from "../context-menu/ContextMenu";
import { cx } from "../cx";
import { SpinnerIcon } from "../icons";
import { MiniMap } from "../mini-map/MiniMap";
import { NodeGroup } from "../node-group/NodeGroup";
import { ShortcutSheet } from "../shortcut-sheet/ShortcutSheet";
import {
  addNoteNext,
  type AlignEdge,
  alignSelected,
  type Clipboard,
  copySelection,
  cutSelection,
  detachIfOutside,
  distributeSelected,
  duplicateSelected,
  groupSelected,
  isGroup,
  pasteClipboard,
  reorderSelected,
  selectOnly,
  toggleCollapseSelected,
  toggleLockSelected,
  ungroup,
  ungroupSelected,
} from "./arrange";
import {
  BoardContext,
  type BoardContextValue,
  type BoardTool,
  type CommandContext,
  type KeyboardConnecting,
} from "./context";
import {
  type BoardEdge,
  type BoardNode,
  connectedHandles,
  connectionProblem,
  connectTargets,
  disconnectNode,
  edgeFor,
  edgeLabel,
  type Graph,
  neighbours,
  nodeLabel,
  nudgeSelected,
  portOf,
  removeFromGraph,
  selectAll,
  setEdgeMeaning,
} from "./graph";

export type { CommandContext } from "./context";

export type BoardVariant = "edit" | "present";

export interface CanvasBoardProps {
  graph: Graph;
  /** The whole next graph after any change; the shell owns the document (spec E4-2). */
  onChange?: ((graph: Graph) => void) | undefined;
  /**
   * A registry command the board cannot complete itself: `board.add-node` (with the position),
   * `node.rename` (with the node), `board.undo`, `board.redo`, `app.toggle-mode`.
   */
  onCommand?: ((command: CommandId, context: CommandContext) => void) | undefined;
  /** The shell's history: undo and redo are offered only when it says it can (spec E4-3). */
  canUndo?: boolean | undefined;
  canRedo?: boolean | undefined;
  /** `present` shows the board read-only: nothing moves, connects or deletes. */
  variant?: BoardVariant | undefined;
  loading?: boolean | undefined;
  /** The region's accessible name. */
  label: string;
  /** Shown and announced in the board's status line (generation status from the shell). */
  status?: string | undefined;
  emptyText?: string | undefined;
  /** The consumer's action for an empty board, usually a Button that adds a node. */
  emptyAction?: ReactNode;
  /** Rich node body; a node's `summary` renders when this returns nothing. */
  renderBody?: ((node: BoardNode) => ReactNode) | undefined;
  /** Fit every node into view on mount; on by default. */
  fitView?: boolean | undefined;
  /** The controls, context menu, command menu and shortcut sheet; on by default (E4-3). */
  chrome?: boolean | undefined;
  /** `auto` (default) shows the minimap from ten nodes; Shift+M and the control override it. */
  minimap?: "auto" | boolean | undefined;
  className?: string | undefined;
  /** Panels placed over the board (E4-3 onward). */
  children?: ReactNode;
}

const NODE_TYPES: NodeTypes = { orivilo: CanvasNode, group: NodeGroup };
const EDGE_TYPES: EdgeTypes = { orivilo: CanvasEdge };

/** One grid unit, from `space.grid-gap`; nudge, snap and the dot pitch share it. */
export const GRID_UNIT = (() => {
  const token = tokens.get("semantic", "space.grid-gap");
  if (!token) throw new Error("semantic space.grid-gap missing");
  return parseFloat(String(tokens.resolve(token, "light").value));
})();

/** The minimap appears on its own from this many nodes (catalog MiniMap). */
export const MINIMAP_FROM = 10;

const keysOf = (id: CommandId) => shortcutsOf(id).join(" หรือ ");

/** React Flow's hidden descriptions and live messages, in Thai, with keys from the registry. */
const ARIA = {
  "node.a11yDescription.default": `กด Enter หรือ Space เพื่อเลือก node, ${keysOf("selection.nudge").replaceAll("Arrow", "")} เพื่อขยับ, ${keysOf("node.connect")} เพื่อ${commandById("node.connect").label.th}, ${keysOf("selection.delete")} เพื่อลบ, ${keysOf("selection.deselect")} เพื่อยกเลิกการเลือก`,
  "node.a11yDescription.keyboardDisabled": "",
  "node.a11yDescription.ariaLiveMessage": ({
    direction,
    x,
    y,
  }: {
    direction: string;
    x: number;
    y: number;
  }) => `ขยับ node ไปทาง ${direction} ตำแหน่ง ${x}, ${y}`,
  "edge.a11yDescription.default": `กด Enter หรือ Space เพื่อเลือกสาย, ${keysOf("edge.delete")} เพื่อลบ, ${shortcutsOf("edge.kind-input")[0]} ${shortcutsOf("edge.kind-reference")[0]} ${shortcutsOf("edge.kind-derived")[0]} เพื่อเปลี่ยนความหมาย, ${keysOf("selection.deselect")} เพื่อยกเลิก`,
  "handle.ariaLabel": "พอร์ต",
};
ARIA["node.a11yDescription.keyboardDisabled"] = ARIA["node.a11yDescription.default"];

const DIRECTION_WORD: Record<string, string> = {
  ArrowUp: "ขึ้น",
  ArrowDown: "ลง",
  ArrowLeft: "ซ้าย",
  ArrowRight: "ขวา",
};
const DIRECTION_DELTA: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

const ALIGN_OF: Partial<Record<CommandId, AlignEdge>> = {
  "selection.align-left": "left",
  "selection.align-right": "right",
  "selection.align-top": "top",
  "selection.align-bottom": "bottom",
};
const ALIGN_WORD: Record<AlignEdge, string> = {
  left: "ซ้าย",
  right: "ขวา",
  top: "บน",
  bottom: "ล่าง",
};

/** What the present variant may still run: viewing and finding, never editing (spec AC 17). */
const PRESENT_ALLOWED = new Set<CommandId>([
  "board.zoom-in",
  "board.zoom-out",
  "board.zoom-100",
  "board.zoom-to-fit",
  "board.zoom-to-selection",
  "board.pan-mode",
  "board.select-mode",
  "board.toggle-minimap",
  "board.command-menu",
  "board.search",
  "board.shortcut-sheet",
  "node.jump-upstream",
  "node.jump-downstream",
  "app.open-context-menu",
  "app.toggle-mode",
]);

/** Commands the shell completes (spec E4-3 rule "one runner"). */
const SHELL_COMMANDS = new Set<CommandId>([
  "board.add-node",
  "node.rename",
  "board.undo",
  "board.redo",
  "app.toggle-mode",
]);

function isTextInput(el: Element | null): boolean {
  if (!el) return false;
  return el.matches("input, textarea, select, [contenteditable=''], [contenteditable='true']");
}

function markerColour(edge: BoardEdge): string {
  if (edge.data?.invalid) return "var(--cmp-edge-stroke-invalid)";
  if (edge.data?.stale) return "var(--cmp-edge-stroke-stale)";
  if (edge.selected) return "var(--cmp-edge-stroke-selected)";
  return "var(--cmp-edge-stroke)";
}

const MEANING_OF: Partial<Record<CommandId, EdgeMeaning>> = {
  "edge.kind-input": "input",
  "edge.kind-reference": "reference",
  "edge.kind-derived": "derived",
};

/**
 * The Intent Studio board (ADR 0004): React Flow for viewport, drag, selection, connection and
 * focus order; every visual value from the board, node, port and edge tokens; every key from the
 * command registry. Controlled: the shell passes the graph and receives the next one. One runner
 * (`runCommand`) serves the keyboard, the node toolbar, the controls, both menus and the sheet.
 */
export function CanvasBoard(props: CanvasBoardProps) {
  return (
    <ReactFlowProvider>
      <Board {...props} />
    </ReactFlowProvider>
  );
}

function Board({
  graph,
  onChange,
  onCommand,
  canUndo = false,
  canRedo = false,
  variant = "edit",
  loading = false,
  label,
  status,
  emptyText = "กระดานยังว่าง",
  emptyAction,
  renderBody,
  fitView = true,
  chrome = true,
  minimap = "auto",
  className,
  children,
}: CanvasBoardProps) {
  const readOnly = variant === "present";
  const flow = useReactFlow<BoardNode, BoardEdge>();
  const wrapper = useRef<HTMLElement>(null);
  // The working copy: React Flow fires edge and node changes for one deletion in two calls in one
  // tick, so each handler reads and writes here; `rendered` is the graph of the last render, the
  // basis for "what was connected before this deletion".
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const rendered = useRef(graph);
  rendered.current = graph;
  const [message, setMessage] = useState("");
  const [connecting, setConnecting] = useState<KeyboardConnecting | null>(null);
  const [tool, setTool] = useState<BoardTool>("select");
  const [snap, setSnap] = useState(true);
  const [minimapOverride, setMinimapOverride] = useState<boolean | null>(null);
  const [commandMenu, setCommandMenu] = useState<CommandMenuMode | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<ContextTarget>({ kind: "board" });
  // The board's own clipboard (spec AC 12): never the system clipboard.
  const [clipboard, setClipboard] = useState<Clipboard | null>(null);

  // A new status from the shell replaces whatever the board last said.
  useEffect(() => {
    setMessage("");
  }, [status]);

  // The override is for this board state; a new document starts from the rule again.
  useEffect(() => {
    setMinimapOverride(null);
  }, [minimap]);

  const minimapShown =
    minimapOverride ?? (minimap === "auto" ? graph.nodes.length >= MINIMAP_FROM : minimap);

  const emit = useCallback(
    (next: Graph) => {
      graphRef.current = next;
      onChange?.(next);
    },
    [onChange],
  );

  const titleOf = (id: string) => graphRef.current.nodes.find((n) => n.id === id)?.data.title ?? id;

  const nodes = useMemo(
    () =>
      graph.nodes.map((n) => {
        const locked = n.data.status === "locked";
        const group = n.type === "group";
        return {
          ...n,
          type: group ? ("group" as const) : ("orivilo" as const),
          ariaLabel: n.ariaLabel ?? nodeLabel(n.data),
          draggable: !readOnly && !locked && (n.draggable ?? true),
          connectable: !readOnly && !locked && !group,
          deletable: !readOnly && !locked,
        };
      }),
    [graph.nodes, readOnly],
  );

  const edges = useMemo(
    () =>
      graph.edges.map((e) => ({
        ...e,
        type: "orivilo" as const,
        ariaLabel: edgeLabel(e, graph.nodes),
        deletable: !readOnly,
        markerEnd: { type: MarkerType.ArrowClosed, color: markerColour(e), width: 14, height: 14 },
      })),
    [graph.edges, graph.nodes, readOnly],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<BoardNode>[]) => {
      const g = graphRef.current;
      const removed = changes.filter((c) => c.type === "remove").map((c) => c.id);
      const kept = changes.filter((c) => c.type !== "remove");
      let next: Graph = { nodes: applyNodeChanges(kept, g.nodes), edges: g.edges };
      if (removed.length > 0) {
        next = removeFromGraph(next, { nodeIds: removed }, rendered.current.edges);
      }
      emit(next);
    },
    [emit],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<BoardEdge>[]) => {
      const g = graphRef.current;
      const removed = changes.filter((c) => c.type === "remove").map((c) => c.id);
      const kept = changes.filter((c) => c.type !== "remove");
      let next: Graph = { nodes: g.nodes, edges: applyEdgeChanges(kept, g.edges) };
      if (removed.length > 0) next = removeFromGraph(next, { edgeIds: removed });
      emit(next);
    },
    [emit],
  );

  /**
   * Deleting a group ungroups it and keeps every node inside (spec AC 11): the group leaves the
   * graph here, its children stay, and React Flow removes only what is left in the list.
   */
  const onBeforeDelete = useCallback(
    ({ nodes: n, edges: e }: { nodes: BoardNode[]; edges: BoardEdge[] }) => {
      const groups = n.filter(isGroup);
      if (groups.length === 0) return Promise.resolve(true);
      const groupIds = new Set(groups.map((g) => g.id));
      let next = graphRef.current;
      for (const g of groups) next = ungroup(next, g.id);
      emit(next);
      const names = groups.map((g) => g.data.title).join(", ");
      setMessage(`แยกกลุ่ม ${names} แล้ว node ข้างในยังอยู่`);
      const keep = n.filter(
        (x) => !groupIds.has(x.id) && !(x.parentId && groupIds.has(x.parentId) && !x.selected),
      );
      const keptIds = new Set(keep.map((x) => x.id));
      // Edges React Flow gathered for the children stay with them; only selected edges and
      // edges of nodes that still go are removed.
      const edges = e.filter((x) => x.selected || keptIds.has(x.source) || keptIds.has(x.target));
      return Promise.resolve({ nodes: keep, edges });
    },
    [emit],
  );

  const onDelete = useCallback(
    ({ nodes: n, edges: e }: { nodes: BoardNode[]; edges: BoardEdge[] }) => {
      if (n.length === 0 && e.length === 0) return;
      const parts: string[] = [];
      if (n.length > 0) parts.push(`ลบ ${n.length} node`);
      if (e.length > 0) parts.push(`${n.length > 0 ? "และ " : "ลบ "}${e.length} สาย`);
      const stale = graphRef.current.nodes.filter((x) => x.data.status === "stale").length;
      if (n.length > 0 && stale > 0) parts.push(`, ${stale} node ปลายทางล้าสมัย`);
      setMessage(parts.join(" "));
    },
    [],
  );

  /** A child dragged out of its group's frame leaves the group (spec AC 11). */
  const onNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: BoardNode) => {
      if (!node.parentId) return;
      const g = graphRef.current;
      const next = detachIfOutside(g, node.id);
      if (next !== g) {
        emit(next);
        setMessage(`${node.data.title} ออกจากกลุ่มแล้ว`);
      }
    },
    [emit],
  );

  const connect = useCallback(
    (c: Connection) => {
      const g = graphRef.current;
      emit({ ...g, edges: [...g.edges, edgeFor(c)] });
      setMessage(`เชื่อม ${titleOf(c.source)} ไป ${titleOf(c.target)} แล้ว`);
    },
    [emit],
  );

  const isValidConnection = useCallback(
    (c: Connection | BoardEdge) =>
      connectionProblem(graphRef.current, {
        source: c.source,
        sourceHandle: c.sourceHandle ?? null,
        target: c.target,
        targetHandle: c.targetHandle ?? null,
      }) === null,
    [],
  );

  const onConnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      if (state.isValid || !state.fromHandle) return;
      const g = graphRef.current;
      const from = { nodeId: state.fromHandle.nodeId, handleId: state.fromHandle.id ?? null };
      const kind = portOf(g.nodes, from)?.port.kind;
      if (state.toHandle) {
        const to = { nodeId: state.toHandle.nodeId, handleId: state.toHandle.id ?? null };
        const [src, dst] = state.fromHandle.type === "source" ? [from, to] : [to, from];
        const why = connectionProblem(g, {
          source: src.nodeId,
          sourceHandle: src.handleId,
          target: dst.nodeId,
          targetHandle: dst.handleId,
        });
        setMessage(why ?? "");
        return;
      }
      setMessage(
        kind ? `วางสายบนพอร์ตที่รับ${CANVAS_WORDS.port[kind].th}ได้` : "วางสายบนพอร์ตของ node อื่น",
      );
    },
    [],
  );

  const pickMessage = (sourceId: string, targets: KeyboardConnecting["targets"], index: number) => {
    const t = targets[index];
    return `ต่อสายจาก ${titleOf(sourceId)}: เป้าหมาย ${t ? titleOf(t.nodeId) : ""} (${index + 1} จาก ${targets.length}) กด Enter เพื่อเชื่อม, Escape เพื่อยกเลิก`;
  };

  /** Keyboard connect (catalog NodePort a11y, spec E4-2 AC 6). */
  const startConnecting = (nodeId: string) => {
    const g = graphRef.current;
    const node = g.nodes.find((n) => n.id === nodeId);
    const first = node?.data.outputs[0];
    if (!node || !first) {
      setMessage(`${titleOf(nodeId)} ไม่มีพอร์ตส่ง`);
      return;
    }
    const from = { nodeId, handleId: first.id };
    const targets = connectTargets(g, from);
    if (targets.length === 0) {
      setMessage(`ไม่มี node ที่รับ${CANVAS_WORDS.port[first.kind].th}ได้`);
      return;
    }
    setConnecting({ from, targets, index: 0 });
    setMessage(pickMessage(nodeId, targets, 0));
  };

  const nodeElement = (id: string) =>
    wrapper.current?.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`) ?? null;

  const focusNode = (id: string) => {
    nodeElement(id)?.focus();
  };

  const jumpToNode = (id: string) => {
    const node = graphRef.current.nodes.find((n) => n.id === id);
    if (!node) return;
    void flow.fitView({ nodes: [{ id }], duration: 200, maxZoom: 1, padding: 0.5 });
    focusNode(id);
    setMessage(`ไปที่ ${node.data.title}`);
  };

  /** The centre of the board in flow coordinates, where a keyboard add puts a node. */
  const centre = () => {
    const rect = wrapper.current?.getBoundingClientRect();
    return rect
      ? flow.screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      : { x: 0, y: 0 };
  };

  /** The graph with the context's node selected alone when it is not part of the selection. */
  const withTarget = (g: Graph, ctx: CommandContext): Graph => {
    if (!ctx.nodeId) return g;
    const node = g.nodes.find((n) => n.id === ctx.nodeId);
    return node && !node.selected ? selectOnly(g, [node.id]) : g;
  };

  const selectedNodes = (g: Graph) => g.nodes.filter((n) => n.selected);

  /** The node a node-scoped command means: the context's, else the one selected node. */
  const targetNode = (g: Graph, ctx: CommandContext): BoardNode | undefined => {
    if (ctx.nodeId) return g.nodes.find((n) => n.id === ctx.nodeId);
    const picked = selectedNodes(g);
    return picked.length === 1 ? picked[0] : undefined;
  };

  const targetEdge = (g: Graph, ctx: CommandContext): BoardEdge | undefined => {
    if (ctx.edgeId) return g.edges.find((e) => e.id === ctx.edgeId);
    const picked = g.edges.filter((e) => e.selected);
    return picked.length === 1 ? picked[0] : undefined;
  };

  /** Whether a surface may offer the command now (spec E4-3 AC 5 to 9, 17). */
  const enabled = (id: CommandId, ctx: CommandContext = {}): boolean => {
    const command = commandById(id);
    if (!commandAvailable(command)) return false;
    if (readOnly && !PRESENT_ALLOWED.has(id)) return false;
    if (SHELL_COMMANDS.has(id) && !onCommand) return false;
    const g = graphRef.current;
    const picked = selectedNodes(g);
    const node = targetNode(g, ctx);
    switch (id) {
      case "board.undo":
        return canUndo;
      case "board.redo":
        return canRedo;
      case "board.paste":
        return clipboard !== null && clipboard.nodes.length > 0;
      case "board.zoom-to-selection":
        return picked.length > 0;
      case "selection.group":
        return picked.length >= 2 && !picked.some(isGroup);
      case "selection.ungroup":
        return picked.some(isGroup) || (node ? isGroup(node) : false);
      case "selection.distribute-horizontal":
      case "selection.distribute-vertical":
        return picked.length >= 3;
      case "selection.align-left":
      case "selection.align-right":
      case "selection.align-top":
      case "selection.align-bottom":
        return picked.length >= 2;
      case "selection.delete":
        return picked.length > 0 || g.edges.some((e) => e.selected) || Boolean(node);
      case "node.connect":
        return Boolean(node) && (node?.data.outputs.length ?? 0) > 0;
      case "node.disconnect":
        return Boolean(node) && g.edges.some((e) => e.source === node?.id || e.target === node?.id);
      case "selection.collapse":
        return picked.length > 0 || Boolean(node);
      default:
        break;
    }
    switch (command.scope) {
      case "node":
        return Boolean(node);
      case "selection":
        return picked.length > 0 || Boolean(node);
      case "edge":
        return Boolean(targetEdge(g, ctx));
      default:
        return true;
    }
  };

  /**
   * The one runner (spec E4-3). Returns true when the board acted, false when the command belongs
   * to React Flow (delete, deselect, focus order) or nothing applies, so the keyboard handler
   * knows whether to stop the event.
   */
  const runCommand = (id: CommandId, ctx: CommandContext = {}): boolean => {
    const g = graphRef.current;
    const node = targetNode(g, ctx);
    if (id === "node.connect" && ctx.key && node && node.data.outputs.length === 0 && !readOnly) {
      // From the keyboard the user hears why; a surface simply does not offer the command.
      setMessage(`${node.data.title} ไม่มีพอร์ตส่ง`);
      return true;
    }
    if (!enabled(id, ctx)) return false;
    const picked = selectedNodes(g);
    const count = (next: Graph) => next.nodes.filter((n) => n.selected).length;
    switch (id) {
      case "board.zoom-in":
        void flow.zoomIn({ duration: 150 });
        setMessage("ซูมเข้า");
        return true;
      case "board.zoom-out":
        void flow.zoomOut({ duration: 150 });
        setMessage("ซูมออก");
        return true;
      case "board.zoom-100":
        void flow.zoomTo(1, { duration: 150 });
        setMessage("ซูม 100%");
        return true;
      case "board.zoom-to-fit":
        void flow.fitView({ padding: 0.2, duration: 200 });
        setMessage(`พอดีจอ ${g.nodes.length} node`);
        return true;
      case "board.zoom-to-selection":
        void flow.fitView({
          nodes: picked.map((n) => ({ id: n.id })),
          padding: 0.3,
          duration: 200,
        });
        setMessage(`พอดีจอกับ ${picked.length} node ที่เลือก`);
        return true;
      case "board.pan-mode":
        setTool("pan");
        setMessage("โหมดเลื่อนกระดาน ลากเพื่อเลื่อน");
        return true;
      case "board.select-mode":
        setTool("select");
        setMessage("โหมดเลือก ลากเพื่อเลือกหลาย node, กด Space ค้างเพื่อเลื่อน");
        return true;
      case "board.toggle-minimap":
        setMinimapOverride(!minimapShown);
        setMessage(minimapShown ? "ซ่อนแผนที่ย่อ" : "แสดงแผนที่ย่อ");
        return true;
      case "board.toggle-snap":
        setSnap(!snap);
        setMessage(snap ? "ปิดการดูดเข้ากริด" : "เปิดการดูดเข้ากริด");
        return true;
      case "board.command-menu":
        setCommandMenu("commands");
        return true;
      case "board.search":
        setCommandMenu("nodes");
        return true;
      case "board.shortcut-sheet":
        setSheetOpen(true);
        return true;
      case "app.open-context-menu": {
        const el =
          (ctx.nodeId ? nodeElement(ctx.nodeId) : null) ??
          (document.activeElement instanceof HTMLElement &&
          wrapper.current?.contains(document.activeElement)
            ? document.activeElement
            : wrapper.current?.querySelector<HTMLElement>(".react-flow__pane")) ??
          null;
        if (!el) return false;
        openContextMenuAt(el);
        return true;
      }
      case "board.select-all":
        emit(selectAll(g));
        setMessage(`เลือกทั้งหมด ${g.nodes.length} node, ${g.edges.length} สาย`);
        return true;
      case "selection.duplicate": {
        const next = duplicateSelected(withTarget(g, ctx));
        emit(next);
        setMessage(`ทำซ้ำ ${count(next)} node แล้ว`);
        return true;
      }
      case "selection.copy": {
        const clip = copySelection(withTarget(g, ctx));
        setClipboard(clip);
        setMessage(`คัดลอก ${clip.nodes.length} node ไว้บนกระดาน`);
        return true;
      }
      case "selection.cut": {
        const cut = cutSelection(withTarget(g, ctx));
        setClipboard(cut.clipboard);
        emit(cut.graph);
        setMessage(`ตัด ${cut.clipboard.nodes.length} node ไว้บนกระดาน`);
        // The focused node may be gone; the board keeps the keyboard so paste works at once.
        if (ctx.nodeId && cut.clipboard.nodes.some((n) => n.id === ctx.nodeId)) {
          wrapper.current?.focus();
        }
        return true;
      }
      case "board.paste": {
        if (!clipboard) return false;
        const next = pasteClipboard(g, clipboard);
        emit(next);
        setMessage(`วาง ${clipboard.nodes.length} node แล้ว`);
        return true;
      }
      case "selection.group": {
        const n = g.nodes.filter(isGroup).length + 1;
        const title = `กลุ่ม ${n}`;
        const next = groupSelected(g, title);
        emit(next);
        setMessage(`จัดกลุ่ม ${picked.length} node เป็น ${title}`);
        return true;
      }
      case "selection.ungroup": {
        const next = ungroupSelected(withTarget(g, ctx));
        emit(next);
        setMessage("แยกกลุ่มแล้ว node ข้างในยังอยู่");
        return true;
      }
      case "selection.lock": {
        const target = withTarget(g, ctx);
        const next = toggleLockSelected(target);
        const locking = target.nodes.some((n) => n.selected && n.data.status !== "locked");
        emit(next);
        setMessage(`${locking ? "ล็อก" : "ปลดล็อก"} ${count(next)} node แล้ว`);
        return true;
      }
      case "selection.collapse": {
        const target = withTarget(g, ctx);
        const next = toggleCollapseSelected(target);
        const collapsing = target.nodes.some((n) => n.selected && !n.data.collapsed);
        emit(next);
        setMessage(`${collapsing ? "ย่อ" : "ขยาย"} ${count(next)} node แล้ว`);
        return true;
      }
      case "selection.align-left":
      case "selection.align-right":
      case "selection.align-top":
      case "selection.align-bottom": {
        const edge = ALIGN_OF[id];
        if (!edge) return false;
        emit(alignSelected(g, edge));
        setMessage(`จัดแนว${ALIGN_WORD[edge]} ${picked.length} node`);
        return true;
      }
      case "selection.distribute-horizontal":
        emit(distributeSelected(g, "horizontal"));
        setMessage(`กระจายแนวนอน ${picked.length} node`);
        return true;
      case "selection.distribute-vertical":
        emit(distributeSelected(g, "vertical"));
        setMessage(`กระจายแนวตั้ง ${picked.length} node`);
        return true;
      case "selection.bring-to-front":
        emit(reorderSelected(withTarget(g, ctx), "front"));
        setMessage("ย้ายมาหน้าสุด");
        return true;
      case "selection.send-to-back":
        emit(reorderSelected(withTarget(g, ctx), "back"));
        setMessage("ย้ายไปหลังสุด");
        return true;
      case "selection.delete": {
        // From a key, React Flow deletes through `deleteKeyCode`; from a surface the board asks it.
        if (ctx.key) return false;
        const ids = withTarget(g, ctx)
          .nodes.filter((n) => n.selected)
          .map((n) => ({ id: n.id }));
        const edgeIds = g.edges.filter((e) => e.selected).map((e) => ({ id: e.id }));
        void flow.deleteElements({ nodes: ids, edges: edgeIds });
        return true;
      }
      case "edge.delete": {
        if (ctx.key) return false;
        const edge = targetEdge(g, ctx);
        if (!edge) return false;
        void flow.deleteElements({ edges: [{ id: edge.id }] });
        return true;
      }
      case "node.add-note": {
        if (!node) return false;
        emit(addNoteNext(g, node.id));
        setMessage(`เพิ่มโน้ตข้าง ${node.data.title}`);
        return true;
      }
      case "node.connect":
        if (!node) return false;
        focusNode(node.id);
        startConnecting(node.id);
        return true;
      case "selection.nudge":
      case "selection.nudge-far": {
        const movable = picked.filter((n) => n.data.status !== "locked").length;
        const delta = ctx.key ? DIRECTION_DELTA[ctx.key] : undefined;
        if (movable === 0 || !delta) return false;
        const units = id === "selection.nudge" ? 1 : 10;
        emit(nudgeSelected(g, delta[0] * units * GRID_UNIT, delta[1] * units * GRID_UNIT));
        setMessage(
          `ขยับ ${movable} node ไป${DIRECTION_WORD[ctx.key ?? ""] ?? ""} ${units} หน่วยกริด`,
        );
        return true;
      }
      case "node.disconnect": {
        if (!node) return false;
        const n = g.edges.filter((e) => e.source === node.id || e.target === node.id).length;
        emit(disconnectNode(g, node.id));
        setMessage(`ตัดสาย ${n} เส้นของ ${node.data.title}`);
        return true;
      }
      case "edge.kind-input":
      case "edge.kind-reference":
      case "edge.kind-derived": {
        const meaning = MEANING_OF[id];
        const edge = targetEdge(g, ctx);
        if (!edge || !meaning) return false;
        emit(setEdgeMeaning(g, edge.id, meaning));
        setMessage(`ตั้งสายเป็น${CANVAS_WORDS.edge[meaning].th}`);
        return true;
      }
      case "node.jump-upstream":
      case "node.jump-downstream": {
        if (!node) return false;
        const side = id === "node.jump-upstream" ? "upstream" : "downstream";
        const next = neighbours(g.edges, node.id, side)[0];
        if (next) focusNode(next);
        else setMessage(side === "upstream" ? "ไม่มี node ต้นทาง" : "ไม่มี node ปลายทาง");
        return true;
      }
      case "board.add-node":
        onCommand?.("board.add-node", { position: ctx.position ?? centre() });
        return true;
      case "node.rename":
        if (!node) return false;
        onCommand?.("node.rename", { nodeId: node.id });
        return true;
      case "board.undo":
      case "board.redo":
      case "app.toggle-mode":
        onCommand?.(id, {});
        return true;
      default:
        // selection.deselect, node.next and friends: React Flow handles them.
        return false;
    }
  };

  const runRef = useRef(runCommand);
  runRef.current = runCommand;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const jumpRef = useRef(jumpToNode);
  jumpRef.current = jumpToNode;
  const run = useCallback((id: CommandId, ctx?: CommandContext) => {
    runRef.current(id, ctx);
  }, []);
  const can = useCallback((id: CommandId, ctx?: CommandContext) => enabledRef.current(id, ctx), []);
  const jump = useCallback((id: string) => jumpRef.current(id), []);

  const selectedNodeIds = useMemo(
    () => graph.nodes.filter((n) => n.selected).map((n) => n.id),
    [graph.nodes],
  );
  const selectedEdgeIds = useMemo(
    () => graph.edges.filter((e) => e.selected).map((e) => e.id),
    [graph.edges],
  );

  const context = useMemo<BoardContextValue>(
    () => ({
      readOnly,
      renderBody,
      connected: connectedHandles(graph.edges),
      connecting,
      graph,
      selectedNodeIds,
      selectedEdgeIds,
      run,
      enabled: can,
      jumpToNode: jump,
      tool,
      snap,
      minimapShown,
    }),
    // `enabled` reads the latest graph, clipboard and shell flags through a ref; the surfaces must
    // render again when any of them changes, so they are dependencies here on purpose.
    [
      readOnly,
      renderBody,
      graph,
      connecting,
      selectedNodeIds,
      selectedEdgeIds,
      run,
      can,
      jump,
      tool,
      snap,
      minimapShown,
      clipboard,
      canUndo,
      canRedo,
      onCommand,
    ],
  );

  const onKeyDownCapture = (event: ReactKeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (isTextInput(target)) return;
    const nodeId = target.closest<HTMLElement>(".react-flow__node")?.dataset["id"];
    const edgeId = target.closest<HTMLElement>(".react-flow__edge")?.dataset["id"];

    if (connecting) {
      const delta = DIRECTION_DELTA[event.key];
      if (delta) {
        const step = delta[0] + delta[1] > 0 ? 1 : -1;
        const index =
          (connecting.index + step + connecting.targets.length) % connecting.targets.length;
        setConnecting({ ...connecting, index });
        setMessage(pickMessage(connecting.from.nodeId, connecting.targets, index));
      } else if (event.key === "Enter") {
        const t = connecting.targets[connecting.index];
        if (t) {
          connect({
            source: connecting.from.nodeId,
            sourceHandle: connecting.from.handleId,
            target: t.nodeId,
            targetHandle: t.handleId,
          });
        }
        setConnecting(null);
      } else if (event.key === "Escape") {
        setConnecting(null);
        setMessage("ยกเลิกการต่อสาย");
      } else {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const scopes: CommandScope[] = nodeId
      ? ["node", "selection", "board", "app"]
      : edgeId
        ? ["edge", "selection", "board", "app"]
        : ["board", "app"];
    const command = commandForKey(event, scopes);
    if (!command) return;
    const ctx: CommandContext = { key: event.key };
    if (nodeId) ctx.nodeId = nodeId;
    if (edgeId) ctx.edgeId = edgeId;
    if (runCommand(command.id, ctx)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  /** What a right-click or Shift+F10 is on; an unselected node is selected first (spec AC 8). */
  const onContextMenuCapture = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const nodeId = target.closest<HTMLElement>(".react-flow__node")?.dataset["id"];
    const edgeId = target.closest<HTMLElement>(".react-flow__edge")?.dataset["id"];
    const position = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    if (nodeId) {
      const g = graphRef.current;
      if (!g.nodes.find((n) => n.id === nodeId)?.selected) emit(selectOnly(g, [nodeId]));
      setMenuTarget({ kind: "node", id: nodeId, position });
    } else if (edgeId) {
      setMenuTarget({ kind: "edge", id: edgeId });
    } else {
      setMenuTarget({ kind: "board", position });
    }
  };

  const onDoubleClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (readOnly || !onCommand) return;
    const target = event.target as HTMLElement;
    if (!target.classList.contains("react-flow__pane")) return;
    onCommand("board.add-node", {
      position: flow.screenToFlowPosition({ x: event.clientX, y: event.clientY }),
    });
  };

  const empty = !loading && graph.nodes.length === 0;

  const flowElement = (
    <ReactFlow<BoardNode, BoardEdge>
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={connect}
      onConnectEnd={onConnectEnd}
      onBeforeDelete={onBeforeDelete}
      onDelete={onDelete}
      onNodeDragStop={onNodeDragStop}
      isValidConnection={isValidConnection}
      fitView={fitView}
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.25}
      maxZoom={2}
      snapToGrid={snap}
      snapGrid={[GRID_UNIT, GRID_UNIT]}
      selectionOnDrag={tool === "select"}
      panOnDrag={tool === "pan" ? true : [1]}
      panActivationKeyCode="Space"
      selectionMode={SelectionMode.Partial}
      zoomOnDoubleClick={false}
      deleteKeyCode={readOnly ? null : [...shortcutsOf("selection.delete")]}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
      nodesFocusable
      edgesFocusable
      elementsSelectable
      ariaLabelConfig={ARIA}
      className="ds-board__flow"
      data-tool={tool}
    >
      <Background variant={BackgroundVariant.Dots} gap={GRID_UNIT} size={1} />
      {chrome ? <CanvasControls /> : null}
      {chrome && minimapShown ? <MiniMap /> : null}
      {children}
    </ReactFlow>
  );

  return (
    <section
      ref={wrapper}
      tabIndex={0}
      aria-label={label}
      aria-busy={loading ? true : undefined}
      className={cx("ds-board", className)}
      data-variant={variant}
      data-loading={loading ? "" : undefined}
      data-empty={empty ? "" : undefined}
      data-connecting={connecting ? "" : undefined}
      data-snap={snap ? "" : undefined}
      onKeyDownCapture={onKeyDownCapture}
      onContextMenuCapture={chrome ? onContextMenuCapture : undefined}
      onDoubleClick={onDoubleClick}
    >
      <BoardContext.Provider value={context}>
        {chrome ? (
          <CanvasContextMenu target={menuTarget} disabled={readOnly}>
            <div className="ds-board__surface">{flowElement}</div>
          </CanvasContextMenu>
        ) : (
          flowElement
        )}
        {chrome ? (
          <>
            <CommandMenu
              open={commandMenu !== null}
              onOpenChange={(open) => {
                if (!open) setCommandMenu(null);
              }}
              mode={commandMenu ?? "commands"}
            />
            <ShortcutSheet open={sheetOpen} onOpenChange={setSheetOpen} />
          </>
        ) : null}
      </BoardContext.Provider>
      {readOnly ? <span className="ds-board__mode">ดูอย่างเดียว</span> : null}
      {loading ? (
        <div className="ds-board__overlay">
          <SpinnerIcon className="ds-spin ds-board__spinner" />
          <p>กำลังโหลดกระดาน</p>
        </div>
      ) : null}
      {empty ? (
        <div className="ds-board__overlay">
          <p>{emptyText}</p>
          {emptyAction}
        </div>
      ) : null}
      <p className="ds-board__status" role="status" aria-live="polite">
        {message || status || ""}
      </p>
    </section>
  );
}
