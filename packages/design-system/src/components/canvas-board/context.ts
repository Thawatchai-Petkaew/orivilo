"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CommandId } from "../../commands/index";
import type { BoardNode, Graph, PortRef } from "./graph";

/** A keyboard connection in progress (spec E4-2 AC 6): where it starts and which target is picked. */
export interface KeyboardConnecting {
  from: PortRef;
  targets: PortRef[];
  index: number;
}

/** What a command refers to when a surface runs it. */
export interface CommandContext {
  nodeId?: string;
  edgeId?: string;
  /** Flow coordinates for `board.add-node`. */
  position?: { x: number; y: number };
  /** The key that chose a direction (nudge). */
  key?: string;
}

export type BoardTool = "select" | "pan";

/** What a jump does besides moving the view. */
export interface JumpOptions {
  /** Select the node alone before the jump, the way `node.open` does. Off by default. */
  select?: boolean | undefined;
}

export interface BoardContextValue {
  /** `present` variant: nothing moves, connects or deletes. */
  readOnly: boolean;
  /** Rich node body; `summary` renders when absent. */
  renderBody: ((node: BoardNode) => ReactNode) | undefined;
  /** Handles an edge touches, `nodeId:handleId`. */
  connected: ReadonlySet<string>;
  connecting: KeyboardConnecting | null;
  /** The graph as rendered, for surfaces that list nodes (the command menu) or count groups. */
  graph: Graph;
  selectedNodeIds: readonly string[];
  selectedEdgeIds: readonly string[];
  /** Runs a registry command the way the keyboard would (spec E4-3: one runner). */
  run: (id: CommandId, context?: CommandContext) => void;
  /** Whether a surface may offer the command right now (scope, selection, shell, variant). */
  enabled: (id: CommandId, context?: CommandContext) => boolean;
  /**
   * Pans and zooms to a node, focuses it and announces it (the command menu's `commandMenu.jumpTo`).
   * With `{ select: true }` it selects the node alone first. Duration is 0 under reduced motion.
   */
  jumpToNode: (id: string, options?: JumpOptions) => void;
  tool: BoardTool;
  snap: boolean;
  minimapShown: boolean;
}

export const BoardContext = createContext<BoardContextValue>({
  readOnly: false,
  renderBody: undefined,
  connected: new Set(),
  connecting: null,
  graph: { nodes: [], edges: [] },
  selectedNodeIds: [],
  selectedEdgeIds: [],
  run: () => undefined,
  enabled: () => false,
  jumpToNode: () => undefined,
  tool: "select",
  snap: true,
  minimapShown: false,
});

export function useBoard(): BoardContextValue {
  return useContext(BoardContext);
}
