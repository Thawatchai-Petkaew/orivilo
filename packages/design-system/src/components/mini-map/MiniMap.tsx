"use client";

import { MiniMap as Primitive } from "@xyflow/react";
import type { BoardNode } from "../canvas-board/graph";

export interface MiniMapProps {
  className?: string | undefined;
}

/** The recipe fills each class from the minimap tokens; no colour value lives here. */
function nodeClass(node: BoardNode): string {
  if (node.type === "group") return "ds-minimap__group";
  return node.selected ? "ds-minimap__node-selected" : "ds-minimap__node";
}

/**
 * The board's overview, bottom-right (catalog MiniMap): node fills from the node and group
 * tokens, the viewport in `canvas.selection`, pannable and zoomable with a pointer. It is named
 * for screen readers but has no keyboard path; the same navigation lives in CanvasControls.
 * The board hides it under ten nodes unless toggled on (`board.toggle-minimap`).
 */
export function MiniMap({ className }: MiniMapProps) {
  return (
    <Primitive<BoardNode>
      className={["ds-minimap", className].filter(Boolean).join(" ")}
      position="bottom-right"
      pannable
      zoomable
      nodeClassName={nodeClass}
      nodeStrokeWidth={0}
      nodeBorderRadius={4}
      ariaLabel="แผนที่ย่อของกระดาน"
    />
  );
}
