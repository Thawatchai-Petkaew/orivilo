import { createContext, useContext, type ReactNode } from "react";
import type { BoardNode, PortRef } from "./graph";

/** A keyboard connection in progress (spec E4-2 AC 6): where it starts and which target is picked. */
export interface KeyboardConnecting {
  from: PortRef;
  targets: PortRef[];
  index: number;
}

export interface BoardContextValue {
  /** `present` variant: nothing moves, connects or deletes. */
  readOnly: boolean;
  /** Rich node body; `summary` renders when absent. */
  renderBody: ((node: BoardNode) => ReactNode) | undefined;
  /** Handles an edge touches, `nodeId:handleId`. */
  connected: ReadonlySet<string>;
  connecting: KeyboardConnecting | null;
}

export const BoardContext = createContext<BoardContextValue>({
  readOnly: false,
  renderBody: undefined,
  connected: new Set(),
  connecting: null,
});

export function useBoard(): BoardContextValue {
  return useContext(BoardContext);
}
