"use client";

import type { ReactNode } from "react";
import { type Command, type CommandScope, surfaceCommands } from "../../commands/index";
import { type CommandContext, useBoard } from "../canvas-board/context";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../context-menu/ContextMenu";

/** What was under the pointer or the focus when the menu opened. */
export interface ContextTarget {
  kind: "board" | "node" | "edge";
  id?: string | undefined;
  /** Flow coordinates of the pointer, for `board.add-node`. */
  position?: { x: number; y: number } | undefined;
}

export interface CanvasContextMenuProps {
  target: ContextTarget;
  /** Off in the present variant: right-click does nothing. */
  disabled?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** The surface the menu opens on (the board). */
  children: ReactNode;
}

const SCOPES: Record<ContextTarget["kind"], CommandScope[]> = {
  board: ["board"],
  node: ["node", "selection"],
  edge: ["edge"],
};

const SCOPE_WORD: Record<CommandScope, string> = {
  board: "กระดาน",
  node: "node นี้",
  selection: "สิ่งที่เลือก",
  edge: "สายนี้",
  app: "ทั่วไป",
  panel: "แผง",
};

/** Destructive items go last (catalog DropdownMenu rule). */
const DESTRUCTIVE = new Set<Command["id"]>(["selection.delete", "edge.delete"]);

/**
 * Right-click, long-press or Shift+F10 on the board, a node, an edge or a selection (catalog
 * CanvasContextMenu): the `context-menu` commands of the scopes that apply, available ones only,
 * grouped by scope with the destructive item last; shortcuts as key caps.
 */
export function CanvasContextMenu({
  target,
  disabled,
  onOpenChange,
  children,
}: CanvasContextMenuProps) {
  const board = useBoard();
  const scopes = SCOPES[target.kind];
  const ctx: CommandContext = {};
  if (target.kind === "node" && target.id) ctx.nodeId = target.id;
  if (target.kind === "edge" && target.id) ctx.edgeId = target.id;
  if (target.position) ctx.position = target.position;
  const groups = scopes
    .map((scope) => ({
      scope,
      items: surfaceCommands("context-menu", [scope]).filter((c) => !DESTRUCTIVE.has(c.id)),
    }))
    .filter((g) => g.items.length > 0);
  const destructive = scopes.flatMap((scope) =>
    surfaceCommands("context-menu", [scope]).filter((c) => DESTRUCTIVE.has(c.id)),
  );

  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger disabled={disabled}>{children}</ContextMenuTrigger>
      <ContextMenuContent aria-label={`เมนูของ${SCOPE_WORD[scopes[0] ?? "board"]}`}>
        {groups.map((g, i) => (
          <div key={g.scope} role="group" aria-label={SCOPE_WORD[g.scope]}>
            {i > 0 ? <ContextMenuSeparator /> : null}
            {groups.length > 1 ? <ContextMenuLabel>{SCOPE_WORD[g.scope]}</ContextMenuLabel> : null}
            {g.items.map((c) => (
              <ContextMenuItem
                key={c.id}
                shortcut={c.shortcuts[0]}
                disabled={!board.enabled(c.id, ctx)}
                onSelect={() => board.run(c.id, ctx)}
              >
                {c.label.th}
              </ContextMenuItem>
            ))}
          </div>
        ))}
        {destructive.length > 0 ? (
          <>
            <ContextMenuSeparator />
            {destructive.map((c) => (
              <ContextMenuItem
                key={c.id}
                destructive
                shortcut={c.shortcuts[0]}
                disabled={!board.enabled(c.id, ctx)}
                onSelect={() => board.run(c.id, ctx)}
              >
                {c.label.th}
              </ContextMenuItem>
            ))}
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
