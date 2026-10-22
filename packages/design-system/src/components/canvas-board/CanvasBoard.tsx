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
  commandById,
  commandForKey,
  shortcutsOf,
} from "../../commands/index";
import { CanvasEdge } from "../canvas-edge/CanvasEdge";
import { CanvasNode } from "../canvas-node/CanvasNode";
import { cx } from "../cx";
import { SpinnerIcon } from "../icons";
import { BoardContext, type BoardContextValue, type KeyboardConnecting } from "./context";
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

export type BoardVariant = "edit" | "present";

/** What a command the board hands to the shell refers to. */
export interface CommandContext {
  nodeId?: string;
  edgeId?: string;
  /** Flow coordinates for `board.add-node`. */
  position?: { x: number; y: number };
}

export interface CanvasBoardProps {
  graph: Graph;
  /** The whole next graph after any change; the shell owns the document (spec E4-2). */
  onChange?: ((graph: Graph) => void) | undefined;
  /**
   * A registry command the board cannot complete itself: `board.add-node` (with the position),
   * `node.rename` (with the node), `board.undo`, `board.redo`.
   */
  onCommand?: ((command: CommandId, context: CommandContext) => void) | undefined;
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
  className?: string | undefined;
  /** Panels placed over the board (E4-3 onward). */
  children?: ReactNode;
}

const NODE_TYPES: NodeTypes = { orivilo: CanvasNode };
const EDGE_TYPES: EdgeTypes = { orivilo: CanvasEdge };

/** One grid unit, from `space.grid-gap`; nudge, snap and the dot pitch share it. */
export const GRID_UNIT = (() => {
  const token = tokens.get("semantic", "space.grid-gap");
  if (!token) throw new Error("semantic space.grid-gap missing");
  return parseFloat(String(tokens.resolve(token, "light").value));
})();

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
 * command registry. Controlled: the shell passes the graph and receives the next one.
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
  variant = "edit",
  loading = false,
  label,
  status,
  emptyText = "กระดานยังว่าง",
  emptyAction,
  renderBody,
  fitView = true,
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

  // A new status from the shell replaces whatever the board last said.
  useEffect(() => {
    setMessage("");
  }, [status]);

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
        return {
          ...n,
          type: "orivilo" as const,
          ariaLabel: n.ariaLabel ?? nodeLabel(n.data),
          draggable: !readOnly && !locked && (n.draggable ?? true),
          connectable: !readOnly && !locked,
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

  const context = useMemo<BoardContextValue>(
    () => ({ readOnly, renderBody, connected: connectedHandles(graph.edges), connecting }),
    [readOnly, renderBody, graph.edges, connecting],
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

  const onDelete = useCallback(
    ({ nodes: n, edges: e }: { nodes: BoardNode[]; edges: BoardEdge[] }) => {
      const parts: string[] = [];
      if (n.length > 0) parts.push(`ลบ ${n.length} node`);
      if (e.length > 0) parts.push(`${n.length > 0 ? "และ " : "ลบ "}${e.length} สาย`);
      const stale = graphRef.current.nodes.filter((x) => x.data.status === "stale").length;
      if (n.length > 0 && stale > 0) parts.push(`, ${stale} node ปลายทางล้าสมัย`);
      setMessage(parts.join(" "));
    },
    [],
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

  /** Keyboard connect (catalog NodePort a11y, spec AC 6). */
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

  const pickMessage = (sourceId: string, targets: KeyboardConnecting["targets"], index: number) => {
    const t = targets[index];
    return `ต่อสายจาก ${titleOf(sourceId)}: เป้าหมาย ${t ? titleOf(t.nodeId) : ""} (${index + 1} จาก ${targets.length}) กด Enter เพื่อเชื่อม, Escape เพื่อยกเลิก`;
  };

  const focusNode = (id: string) => {
    wrapper.current?.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`)?.focus();
  };

  const onKeyDownCapture = (event: ReactKeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (isTextInput(target)) return;
    const nodeId = target.closest<HTMLElement>(".react-flow__node")?.dataset["id"];
    const edgeId = target.closest<HTMLElement>(".react-flow__edge")?.dataset["id"];
    const g = graphRef.current;

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
    const done = () => {
      event.preventDefault();
      event.stopPropagation();
    };
    const navigation = command.id === "node.jump-upstream" || command.id === "node.jump-downstream";
    if (readOnly && !navigation) return;

    switch (command.id) {
      case "node.connect":
        if (nodeId) startConnecting(nodeId);
        done();
        return;
      case "selection.nudge":
      case "selection.nudge-far": {
        const selected = g.nodes.filter((n) => n.selected && n.data.status !== "locked").length;
        const delta = DIRECTION_DELTA[event.key];
        if (selected === 0 || !delta) return;
        const units = command.id === "selection.nudge" ? 1 : 10;
        emit(nudgeSelected(g, delta[0] * units * GRID_UNIT, delta[1] * units * GRID_UNIT));
        setMessage(`ขยับ ${selected} node ไป${DIRECTION_WORD[event.key]} ${units} หน่วยกริด`);
        done();
        return;
      }
      case "board.select-all":
        emit(selectAll(g));
        setMessage(`เลือกทั้งหมด ${g.nodes.length} node, ${g.edges.length} สาย`);
        done();
        return;
      case "node.disconnect": {
        if (!nodeId) return;
        const count = g.edges.filter((e) => e.source === nodeId || e.target === nodeId).length;
        emit(disconnectNode(g, nodeId));
        setMessage(`ตัดสาย ${count} เส้นของ ${titleOf(nodeId)}`);
        done();
        return;
      }
      case "edge.kind-input":
      case "edge.kind-reference":
      case "edge.kind-derived": {
        const meaning = MEANING_OF[command.id];
        if (!edgeId || !meaning) return;
        emit(setEdgeMeaning(g, edgeId, meaning));
        setMessage(`ตั้งสายเป็น${CANVAS_WORDS.edge[meaning].th}`);
        done();
        return;
      }
      case "node.jump-upstream":
      case "node.jump-downstream": {
        if (!nodeId) return;
        const side = command.id === "node.jump-upstream" ? "upstream" : "downstream";
        const next = neighbours(g.edges, nodeId, side)[0];
        if (next) focusNode(next);
        else setMessage(side === "upstream" ? "ไม่มี node ต้นทาง" : "ไม่มี node ปลายทาง");
        done();
        return;
      }
      case "board.add-node": {
        if (nodeId || edgeId || !onCommand) return;
        const rect = wrapper.current?.getBoundingClientRect();
        const position = rect
          ? flow.screenToFlowPosition({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            })
          : { x: 0, y: 0 };
        onCommand("board.add-node", { position });
        done();
        return;
      }
      case "node.rename":
        if (!nodeId || !onCommand) return;
        onCommand("node.rename", { nodeId });
        done();
        return;
      case "board.undo":
      case "board.redo":
        if (!onCommand) return;
        onCommand(command.id, {});
        done();
        return;
      default:
        // selection.delete, selection.deselect, node.next and friends: React Flow handles them.
        return;
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
      onKeyDownCapture={onKeyDownCapture}
      onDoubleClick={onDoubleClick}
    >
      <BoardContext.Provider value={context}>
        <ReactFlow<BoardNode, BoardEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={connect}
          onConnectEnd={onConnectEnd}
          onDelete={onDelete}
          isValidConnection={isValidConnection}
          fitView={fitView}
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.25}
          maxZoom={2}
          snapToGrid
          snapGrid={[GRID_UNIT, GRID_UNIT]}
          selectionOnDrag
          panOnDrag={[1, 2]}
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
        >
          <Background variant={BackgroundVariant.Dots} gap={GRID_UNIT} size={1} />
          {children}
        </ReactFlow>
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
