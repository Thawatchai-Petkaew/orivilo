"use client";

import type { NodeProps } from "@xyflow/react";
import { useBoard } from "../canvas-board/context";
import type { BoardNode } from "../canvas-board/graph";
import { LockIcon, SpinnerIcon, StaleIcon, WarningIcon } from "../icons";
import { NodePort } from "../node-port/NodePort";
import { useMessages, useWord } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { CANVAS_WORDS } from "../../tokens/canvas";
import { NodeToolbar } from "../node-toolbar/NodeToolbar";

export type CanvasNodeProps = NodeProps<BoardNode>;

/**
 * Anything placed on the board (ADR 0004 item 2): header with title, kind and status, a body per
 * variant, a missing-inputs row, an error row, and the ports in the footer. React Flow renders
 * it inside the focusable node wrapper, which carries the accessible name ("title, kind") and the
 * selection; this component paints every state from the node tokens (E4-1). Status is a word
 * and a glyph, never a tint (catalog rule).
 */
export function CanvasNode({ id, data, selected, dragging }: CanvasNodeProps) {
  const board = useBoard();
  const m = useMessages();
  const word = useWord();
  const kind = word(CANVAS_WORDS.node[data.kind]);
  const status = data.status ? word(CANVAS_WORDS.status[data.status]) : undefined;
  const candidate =
    board.connecting?.targets[board.connecting.index]?.nodeId === id ? "" : undefined;
  const body = board.renderBody?.({ id, type: "orivilo", position: { x: 0, y: 0 }, data });
  const locked = data.status === "locked";

  return (
    <div
      className="ds-node"
      data-kind={data.kind}
      data-size={data.size ?? "md"}
      data-status={data.status}
      data-selected={selected ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
      data-collapsed={data.collapsed ? "" : undefined}
      data-readonly={board.readOnly ? "" : undefined}
      data-error={data.error ? "" : undefined}
      data-missing={data.missing && data.missing.length > 0 ? "" : undefined}
      data-connect-candidate={candidate}
      aria-busy={data.status === "running" ? true : undefined}
    >
      <NodeToolbar node={{ id, data, selected }} />
      <div className="ds-node__header">
        <span className="ds-node__title">{data.title}</span>
        <span className="ds-node__kind">{kind}</span>
        {status ? (
          <span className="ds-node__status" data-status={data.status}>
            {data.status === "running" ? <SpinnerIcon className="ds-spin" /> : null}
            {data.status === "stale" ? <StaleIcon /> : null}
            {data.status === "locked" ? <LockIcon /> : null}
            {status}
          </span>
        ) : null}
      </div>
      {data.collapsed ? null : (
        <div className="ds-node__body">
          {body ?? data.summary ?? <span className="ds-node__empty">{m.node.empty}</span>}
        </div>
      )}
      {data.missing && data.missing.length > 0 ? (
        <p className="ds-node__missing">
          {fill(m.node.missing, { list: data.missing.join(", ") })}
        </p>
      ) : null}
      {data.error ? (
        <p className="ds-node__error">
          <WarningIcon />
          {data.error}
        </p>
      ) : null}
      {data.inputs.length > 0 || data.outputs.length > 0 ? (
        <div className="ds-node__ports">
          <ul className="ds-node__port-list" data-direction="input" aria-label={m.node.inputs}>
            {data.inputs.map((port) => (
              <NodePort key={port.id} port={port} direction="input" disabled={locked} />
            ))}
          </ul>
          <ul className="ds-node__port-list" data-direction="output" aria-label={m.node.outputs}>
            {data.outputs.map((port) => (
              <NodePort key={port.id} port={port} direction="output" disabled={locked} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
