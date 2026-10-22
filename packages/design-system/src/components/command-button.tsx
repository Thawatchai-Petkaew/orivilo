"use client";

import type { ReactNode } from "react";
import { type CommandId, commandById, shortcutsOf } from "../commands/index";
import { useWord } from "../i18n/LocaleProvider";
import { Button } from "./button/Button";
import { useBoard } from "./canvas-board/context";
import type { CommandContext } from "./canvas-board/context";
import { Kbd } from "./kbd/Kbd";
import { Tooltip } from "./tooltip/Tooltip";

/** The tooltip of a command button: its label and its first shortcut as key caps. */
export function CommandHint({ id }: { id: CommandId }) {
  const command = commandById(id);
  const key = shortcutsOf(id)[0];
  const word = useWord();
  return (
    <span className="inline-flex items-center gap-2">
      {word(command.label)}
      {key ? <Kbd shortcut={key} /> : null}
    </span>
  );
}

export interface CommandButtonProps {
  id: CommandId;
  context?: CommandContext | undefined;
  /** The glyph; the label comes from the registry. */
  children: ReactNode;
  /** Overrides the registry label (the collapse button says expand when collapsed). */
  label?: string | undefined;
  disabled?: boolean | undefined;
  pressed?: boolean | undefined;
  className?: string | undefined;
}

/**
 * An icon button for one registry command on a floating surface (toolbar, controls): named by
 * the command, its shortcut in the tooltip, enabled by the board's rules, run through the board.
 */
export function CommandButton({
  id,
  context,
  children,
  label,
  disabled,
  pressed,
  className,
}: CommandButtonProps) {
  const board = useBoard();
  const word = useWord();
  const command = commandById(id);
  const name = label ?? word(command.label);
  const key = shortcutsOf(id)[0];
  const off = disabled || !board.enabled(id, context);
  return (
    <Tooltip
      content={
        <span className="inline-flex items-center gap-2">
          {name}
          {key ? <Kbd shortcut={key} /> : null}
        </span>
      }
    >
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={name}
        aria-pressed={pressed}
        aria-keyshortcuts={key}
        data-command={id}
        disabled={off}
        className={className}
        onClick={() => board.run(id, context)}
      >
        {children}
      </Button>
    </Tooltip>
  );
}
