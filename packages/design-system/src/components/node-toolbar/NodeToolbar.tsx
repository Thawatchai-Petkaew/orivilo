"use client";

import { NodeToolbar as Primitive, Position } from "@xyflow/react";
import { type CommandId, surfaceCommands } from "../../commands/index";
import { useMessages } from "../../i18n/LocaleProvider";
import { fill, type Messages } from "../../i18n/messages/index";
import { useBoard } from "../canvas-board/context";
import type { BoardNode } from "../canvas-board/graph";
import { CommandButton } from "../command-button";
import { CollapseIcon, CopyIcon, ExpandIcon, LockIcon, TrashIcon, UnlockIcon } from "../icons";

export interface NodeToolbarProps {
  node: Pick<BoardNode, "id" | "data" | "selected">;
}

const GLYPH: Partial<Record<CommandId, (node: NodeToolbarProps["node"]) => React.ReactNode>> = {
  "selection.duplicate": () => <CopyIcon className="size-4" />,
  "selection.lock": (n) =>
    n.data.status === "locked" ? (
      <UnlockIcon className="size-4" />
    ) : (
      <LockIcon className="size-4" />
    ),
  "selection.collapse": (n) =>
    n.data.collapsed ? <ExpandIcon className="size-4" /> : <CollapseIcon className="size-4" />,
  "selection.delete": () => <TrashIcon className="size-4" />,
};

/** The label of a toggling command names the state it moves to, from the catalog. */
const WORD: Partial<
  Record<CommandId, (node: NodeToolbarProps["node"], m: Messages["nodeToolbar"]) => string>
> = {
  "selection.lock": (n, m) => (n.data.status === "locked" ? m.unlock : m.lock),
  "selection.collapse": (n, m) => (n.data.collapsed ? m.expand : m.collapse),
};

/**
 * Actions for the one selected node (catalog NodeToolbar): the `node-toolbar` commands of the
 * registry that this story implements, filtered by what the node can do. React Flow keeps it
 * above the node without scaling with zoom. Hidden when several nodes are selected (their
 * actions live in the context menu) and in the present variant; disabled while the node runs.
 */
export function NodeToolbar({ node }: NodeToolbarProps) {
  const board = useBoard();
  const m = useMessages();
  const visible = Boolean(node.selected) && board.selectedNodeIds.length === 1 && !board.readOnly;
  const running = node.data.status === "running";
  const listed = surfaceCommands("node-toolbar", ["node", "selection"]).filter((c) => GLYPH[c.id]);
  // The destructive action sits last (catalog DropdownMenu rule, applied to every surface).
  const items = [
    ...listed.filter((c) => c.id !== "selection.delete"),
    ...listed.filter((c) => c.id === "selection.delete"),
  ];
  return (
    <Primitive
      nodeId={node.id}
      isVisible={visible}
      position={Position.Top}
      offset={8}
      className="ds-toolbar ds-node-toolbar"
      role="toolbar"
      aria-label={fill(m.nodeToolbar.label, { title: node.data.title })}
      data-running={running ? "" : undefined}
    >
      {items.map((c) => (
        <CommandButton
          key={c.id}
          id={c.id}
          context={{ nodeId: node.id }}
          label={WORD[c.id]?.(node, m.nodeToolbar)}
          disabled={running}
        >
          {GLYPH[c.id]?.(node)}
        </CommandButton>
      ))}
    </Primitive>
  );
}
