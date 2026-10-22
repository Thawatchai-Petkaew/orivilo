"use client";

import { Panel, useViewport } from "@xyflow/react";
import { type CommandId, commandById, shortcutsOf, surfaceCommands } from "../../commands/index";
import { useBoard } from "../canvas-board/context";
import { CommandButton } from "../command-button";
import {
  CursorIcon,
  FitIcon,
  HandIcon,
  KeyboardIcon,
  MapIcon,
  MinusIcon,
  PlusIcon,
  RedoIcon,
  SearchIcon,
  UndoIcon,
} from "../icons";
import { Kbd } from "../kbd/Kbd";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group/ToggleGroup";
import { Tooltip } from "../tooltip/Tooltip";

/** The controls' own order; anything else the registry sends to `canvas-controls` goes last. */
const ORDER: CommandId[] = [
  "board.zoom-out",
  "board.zoom-100",
  "board.zoom-in",
  "board.zoom-to-fit",
  "board.zoom-to-selection",
  "board.select-mode",
  "board.pan-mode",
  "board.toggle-minimap",
  "board.undo",
  "board.redo",
  "board.add-node",
  "board.command-menu",
  "board.search",
  "board.shortcut-sheet",
];

const GLYPH: Partial<Record<CommandId, React.ReactNode>> = {
  "board.zoom-out": <MinusIcon className="size-4" />,
  "board.zoom-in": <PlusIcon className="size-4" />,
  "board.zoom-to-fit": <FitIcon className="size-4" />,
  "board.zoom-to-selection": <FitIcon className="size-4 opacity-70" />,
  "board.toggle-minimap": <MapIcon className="size-4" />,
  "board.undo": <UndoIcon className="size-4" />,
  "board.redo": <RedoIcon className="size-4" />,
  "board.add-node": <PlusIcon className="size-4" />,
  "board.command-menu": <SearchIcon className="size-4" />,
  "board.search": <SearchIcon className="size-4 opacity-70" />,
  "board.shortcut-sheet": <KeyboardIcon className="size-4" />,
};

/** Where a divider goes: before these commands. */
const DIVIDE_BEFORE = new Set<CommandId>([
  "board.select-mode",
  "board.toggle-minimap",
  "board.undo",
  "board.add-node",
  "board.command-menu",
]);

export interface CanvasControlsProps {
  className?: string | undefined;
}

/**
 * Zoom, fit, pan or select, minimap, undo, redo, add, find and the shortcut sheet (catalog
 * CanvasControls): every control is a registry command with its shortcut in the tooltip. Sits
 * bottom-left over the board on the glass toolbar. The present variant keeps only what moves
 * the viewport.
 */
export function CanvasControls({ className }: CanvasControlsProps) {
  const board = useBoard();
  const { zoom } = useViewport();
  const available = surfaceCommands("canvas-controls").map((c) => c.id);
  const ids = [
    ...ORDER.filter((id) => available.includes(id)),
    ...available.filter((id) => !ORDER.includes(id)),
  ];
  const shown = ids.filter((id) => board.enabled(id) || !board.readOnly);
  const percent = `${Math.round(zoom * 100)}%`;
  const modeIds: CommandId[] = ["board.select-mode", "board.pan-mode"];
  const hasModes = modeIds.every((id) => shown.includes(id));

  return (
    <Panel
      position="bottom-left"
      className={["ds-toolbar ds-controls", className].filter(Boolean).join(" ")}
      role="toolbar"
      aria-label="เครื่องมือกระดาน"
    >
      {shown.map((id) => {
        const divider = DIVIDE_BEFORE.has(id) ? <span className="ds-controls__divider" /> : null;
        if (id === "board.zoom-100") {
          const command = commandById(id);
          const key = shortcutsOf(id)[0];
          return (
            <Tooltip
              key={id}
              content={
                <span className="inline-flex items-center gap-2">
                  {command.label.th}
                  {key ? <Kbd shortcut={key} /> : null}
                </span>
              }
            >
              <button
                type="button"
                className="ds-controls__zoom"
                aria-label={`${command.label.th}, ตอนนี้ ${percent}`}
                aria-keyshortcuts={key}
                data-command={id}
                disabled={!board.enabled(id)}
                onClick={() => board.run(id)}
              >
                {percent}
              </button>
            </Tooltip>
          );
        }
        if (modeIds.includes(id)) {
          if (!hasModes || id !== "board.select-mode") return null;
          return (
            <span key="modes" className="contents">
              {divider}
              <ToggleGroup
                type="single"
                size="sm"
                aria-label="โหมดชี้"
                value={board.tool}
                onValueChange={(value) => {
                  if (value === "pan") board.run("board.pan-mode");
                  if (value === "select") board.run("board.select-mode");
                }}
              >
                <ToggleGroupItem
                  value="select"
                  aria-label={`${commandById("board.select-mode").label.th} (${shortcutsOf("board.select-mode")[0]})`}
                >
                  <CursorIcon className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="pan"
                  aria-label={`${commandById("board.pan-mode").label.th} (${shortcutsOf("board.pan-mode")[0]})`}
                >
                  <HandIcon className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </span>
          );
        }
        return (
          <span key={id} className="contents">
            {divider}
            <CommandButton
              id={id}
              pressed={id === "board.toggle-minimap" ? board.minimapShown : undefined}
            >
              {GLYPH[id] ?? <PlusIcon className="size-4" />}
            </CommandButton>
          </span>
        );
      })}
    </Panel>
  );
}
