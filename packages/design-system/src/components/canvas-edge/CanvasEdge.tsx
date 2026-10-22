"use client";

import { EdgeLabelRenderer, type EdgeProps, getBezierPath } from "@xyflow/react";
import type { BoardEdge } from "../canvas-board/graph";
import { edgeStateWord } from "../canvas-board/graph";
import { CANVAS_WORDS } from "../../tokens/canvas";

export type CanvasEdgeProps = EdgeProps<BoardEdge>;

/**
 * A link between two nodes that means input, reference or derived-from (ADR 0004 item 4). The
 * meaning is the dash pattern and the label word; the state (rest, hover, selected, invalid,
 * stale) is the stroke colour (E4-1 tokens). React Flow wraps it in the focusable edge group that
 * carries the accessible name the board computes ("<meaning> จาก <source> ไป <target>").
 */
export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: CanvasEdgeProps) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const meaning = data?.meaning ?? "input";
  const state = edgeStateWord({ id, source: "", target: "", data } as BoardEdge);
  return (
    <>
      <g
        className="ds-edge"
        data-meaning={meaning}
        data-selected={selected ? "" : undefined}
        data-stale={data?.stale ? "" : undefined}
        data-invalid={data?.invalid ? "" : undefined}
      >
        <path className="ds-edge__path react-flow__edge-path" d={path} markerEnd={markerEnd} />
        <path
          className="react-flow__edge-interaction"
          d={path}
          fill="none"
          strokeOpacity={0}
          strokeWidth={20}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          className="ds-edge__label"
          data-meaning={meaning}
          data-state={state ? (data?.invalid ? "invalid" : "stale") : undefined}
          aria-hidden="true"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {CANVAS_WORDS.edge[meaning].th}
          {state ? `, ${state}` : ""}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
