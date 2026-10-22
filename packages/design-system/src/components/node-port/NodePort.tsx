"use client";

import { Handle, Position, useConnection, useNodeId } from "@xyflow/react";
import { useBoard } from "../canvas-board/context";
import type { PortSpec } from "../canvas-board/graph";
import { useMessages, useWord } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { CANVAS_WORDS, type PortDirection, type PortShape, portShape } from "../../tokens/canvas";

export type PortState =
  "idle" | "connecting" | "valid-target" | "invalid-target" | "connected" | "disabled";

export interface NodePortProps {
  port: PortSpec;
  direction: PortDirection;
  /** The node is locked: the port shows and names itself but takes no connection. */
  disabled?: boolean | undefined;
}

const PATHS: Record<PortShape, string> = {
  circle: "M8 1.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 0 1 0-13z",
  square: "M2 2h12v12H2z",
  diamond: "M8 1l7 7l-7 7l-7-7z",
  triangle: "M8 1.5l7 13H1z",
  hexagon: "M4.5 1.5h7l3.5 6.5l-3.5 6.5h-7L1 8z",
};

/** The glyph of a port kind: its shape, filled with its colour, ringed with the node ground. */
export function PortGlyph({ shape }: { shape: PortShape }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" className="ds-port__glyph">
      <path d={PATHS[shape]} />
    </svg>
  );
}

/**
 * A connection point on a node, typed by the data it carries (ADR 0004 item 4). Shape and colour
 * come from the port tokens (E4-1); the accessible name reads direction and kind. React Flow's
 * Handle gives it pointer connection; the keyboard path starts from the node (C) and the board
 * marks the picked target through context. Rendered only inside a CanvasNode.
 */
export function NodePort({ port, direction, disabled = false }: NodePortProps) {
  const nodeId = useNodeId() ?? "";
  const board = useBoard();
  const m = useMessages();
  const word = useWord();
  const shape = portShape(port.kind);
  const key = `${nodeId}:${port.id}`;
  const pointer = useConnection();

  let state: PortState = "idle";
  if (board.readOnly || disabled) {
    state = "disabled";
  } else if (pointer.inProgress) {
    const from = pointer.fromHandle;
    if (from.nodeId === nodeId && (from.id ?? "") === port.id) state = "connecting";
    else if (from.nodeId !== nodeId && from.type === "source" && direction === "input") {
      const fromNode = pointer.fromNode as { data?: { outputs?: PortSpec[] } };
      const fromKind = fromNode.data?.outputs?.find((p) => p.id === from.id)?.kind;
      state = fromKind === port.kind ? "valid-target" : "invalid-target";
    } else state = "invalid-target";
  } else if (board.connecting) {
    const { from, targets, index } = board.connecting;
    const picked = targets[index];
    if (from.nodeId === nodeId && from.handleId === port.id) state = "connecting";
    else if (picked && picked.nodeId === nodeId && picked.handleId === port.id)
      state = "valid-target";
    else state = "invalid-target";
  } else if (board.connected.has(key)) {
    state = "connected";
  }

  const portName = `${word(CANVAS_WORDS.direction[direction])}${word(CANVAS_WORDS.port[port.kind])}`;
  const name =
    state === "connected"
      ? fill(m.port.connected, { port: portName })
      : state === "disabled"
        ? fill(m.port.disabled, { port: portName })
        : portName;

  return (
    <li className="ds-port" data-kind={port.kind} data-direction={direction} data-state={state}>
      <Handle
        type={direction === "input" ? "target" : "source"}
        position={direction === "input" ? Position.Left : Position.Right}
        id={port.id}
        isConnectable={state !== "disabled"}
        role="img"
        aria-label={name}
        className="ds-port__handle"
        data-port-shape={shape}
      >
        <PortGlyph shape={shape} />
      </Handle>
      <span className="ds-port__label">{port.label}</span>
    </li>
  );
}
