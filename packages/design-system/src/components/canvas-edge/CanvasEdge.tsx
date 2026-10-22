"use client";

import {
  type ConnectionLineComponentProps,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import { useBoard } from "../canvas-board/context";
import type { BoardEdge, BoardNode } from "../canvas-board/graph";
import { edgeStateWord, feedsRunning } from "../canvas-board/graph";
import { useLocale, useWord } from "../../i18n/LocaleProvider";
import { CANVAS_WORDS } from "../../tokens/canvas";

export type CanvasEdgeProps = EdgeProps<BoardEdge>;

/**
 * The AI gradient from source to target in board coordinates, plus the light that travels along
 * the path (ORV-57). Only while data flows: an edge feeding a running node, or the line being
 * drawn. Selection, stale and invalid strokes are never replaced by it.
 */
function Flow({
  id,
  path,
  from,
  to,
}: {
  id: string;
  path: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}) {
  const gradient = `ds-edge-flow-${id}`;
  return (
    <>
      <defs>
        <linearGradient
          id={gradient}
          gradientUnits="userSpaceOnUse"
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
        >
          <stop offset="0" className="ds-edge__flow-start" />
          <stop offset="1" className="ds-edge__flow-end" />
        </linearGradient>
      </defs>
      <path className="ds-edge__flow" d={path} stroke={`url(#${gradient})`} />
      <path className="ds-edge__light" d={path} pathLength={100} />
    </>
  );
}

/**
 * A link between two nodes that means input, reference or derived-from (ADR 0004 item 4). The
 * meaning is the dash pattern and the label word; the state (rest, hover, selected, invalid,
 * stale) is the stroke colour (E4-1 tokens). React Flow wraps it in the focusable edge group that
 * carries the accessible name the board computes (`graph.edgeLabel`: meaning, source, target).
 */
export function CanvasEdge({
  id,
  source,
  target,
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
  const word = useWord();
  const meaning = data?.meaning ?? "input";
  const state = edgeStateWord({ id, source: "", target: "", data } as BoardEdge, useLocale());
  const board = useBoard();
  const flowing = feedsRunning(board.graph, { id, source, target, data } as BoardEdge);
  return (
    <>
      <g
        className="ds-edge"
        data-meaning={meaning}
        data-selected={selected ? "" : undefined}
        data-stale={data?.stale ? "" : undefined}
        data-invalid={data?.invalid ? "" : undefined}
        data-flowing={flowing ? "" : undefined}
      >
        <path className="ds-edge__path react-flow__edge-path" d={path} markerEnd={markerEnd} />
        {flowing ? (
          <Flow
            id={id}
            path={path}
            from={{ x: sourceX, y: sourceY }}
            to={{ x: targetX, y: targetY }}
          />
        ) : null}
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
          {word(CANVAS_WORDS.edge[meaning])}
          {state ? `, ${state}` : ""}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

/** The line drawn while connecting by pointer: the AI gradient with its travelling light (ORV-57). */
export function CanvasConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps<BoardNode>) {
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });
  return (
    <g className="ds-edge" data-flowing="" data-connecting="">
      <Flow id="connecting" path={path} from={{ x: fromX, y: fromY }} to={{ x: toX, y: toY }} />
    </g>
  );
}
