"use client";

import type { NodeProps } from "@xyflow/react";
import { groupSummary } from "../canvas-board/arrange";
import { useBoard } from "../canvas-board/context";
import type { BoardNode } from "../canvas-board/graph";
import { useMessages, useWord } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { CANVAS_WORDS } from "../../tokens/canvas";
import { NodeToolbar } from "../node-toolbar/NodeToolbar";

export type NodeGroupProps = NodeProps<BoardNode>;

/**
 * A named frame around related nodes (catalog NodeGroup): a React Flow parent node, so children
 * move with it and keep their positions relative to it; a child dragged out leaves it. Collapsed,
 * it hides its children and says how many nodes and crossing edges it holds. Deleting a group
 * ungroups it (the board's rule); nothing inside is lost.
 */
export function NodeGroup({ id, data, selected }: NodeGroupProps) {
  const board = useBoard();
  const m = useMessages();
  const word = useWord();
  const summary = data.collapsed ? groupSummary(board.graph, id) : null;
  return (
    <div
      className="ds-group"
      data-selected={selected ? "" : undefined}
      data-collapsed={data.collapsed ? "" : undefined}
      data-readonly={board.readOnly ? "" : undefined}
      data-status={data.status}
    >
      <NodeToolbar node={{ id, data, selected }} />
      <div className="ds-group__header">
        <span className="ds-group__title">{data.title}</span>
        <span className="ds-group__kind">{word(CANVAS_WORDS.node.group)}</span>
        {summary ? (
          <span className="ds-group__summary">
            {fill(m.group.summary, { children: summary.children, edges: summary.edges })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
