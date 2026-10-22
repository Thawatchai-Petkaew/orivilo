"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { PortalScope } from "../../boundary/DesignProfileBoundary";
import { type Command, type CommandScope, surfaceCommands } from "../../commands/index";
import { CANVAS_WORDS } from "../../tokens/canvas";
import { useBoard } from "../canvas-board/context";
import { Kbd } from "../kbd/Kbd";
import { SearchIcon } from "../icons";

export type CommandMenuMode = "commands" | "nodes";

export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `nodes` opens on the board search (Mod+F): node entries first and the field says so. */
  mode?: CommandMenuMode | undefined;
}

const SCOPE_WORD: Record<CommandScope, string> = {
  board: "กระดาน",
  selection: "สิ่งที่เลือก",
  node: "node",
  edge: "สาย",
  app: "ทั่วไป",
  panel: "แผง",
};

type Entry =
  | { kind: "command"; command: Command; enabled: boolean; text: string }
  | { kind: "node"; id: string; title: string; word: string; text: string };

/** Case-insensitive substring match over Thai and English labels and node titles. */
export function matches(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q === "" || text.toLowerCase().includes(q);
}

/**
 * Search and run any command, or jump to a node by title (catalog CommandMenu, Mod+K). A dialog
 * with combobox semantics: the field controls the listbox, arrows move the active option, Enter
 * runs it, Escape closes. Every available `command-menu` command is listed grouped by scope; a
 * command the board cannot run now is shown disabled, never hidden, so the list is the same each
 * time. The palette is the one place the direction allows glass.
 */
export function CommandMenu({ open, onOpenChange, mode = "commands" }: CommandMenuProps) {
  const board = useBoard();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  // What to do once the dialog has closed: Radix's focus trap is still active while it closes,
  // so a node focused earlier would lose focus again. A jump keeps its node; a command lets
  // focus return to the opener unless it moves focus itself.
  const pending = useRef<Entry | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open, mode]);

  const commands = useMemo(
    () =>
      surfaceCommands("command-menu")
        .filter((c) => !board.readOnly || board.enabled(c.id))
        .map<Entry>((c) => ({
          kind: "command",
          command: c,
          enabled: board.enabled(c.id),
          text: `${c.label.th} ${c.label.en}`,
        })),
    [board],
  );
  const nodes = useMemo(
    () =>
      board.graph.nodes.map<Entry>((n) => ({
        kind: "node",
        id: n.id,
        title: n.data.title,
        word: CANVAS_WORDS.node[n.data.kind].th,
        text: `${n.data.title} ${CANVAS_WORDS.node[n.data.kind].th}`,
      })),
    [board.graph.nodes],
  );

  const results = useMemo(() => {
    const list = mode === "nodes" ? [...nodes, ...commands] : [...commands, ...nodes];
    return list.filter((e) => matches(e.text, query));
  }, [commands, nodes, mode, query]);

  const groups = useMemo(() => {
    const out: { key: string; label: string; entries: { entry: Entry; index: number }[] }[] = [];
    results.forEach((entry, index) => {
      const key = entry.kind === "node" ? "nodes" : entry.command.scope;
      const label = entry.kind === "node" ? "ไปที่ node" : SCOPE_WORD[entry.command.scope];
      let group = out.find((g) => g.key === key);
      if (!group) {
        group = { key, label, entries: [] };
        out.push(group);
      }
      group.entries.push({ entry, index });
    });
    return out;
  }, [results]);

  const choose = (entry: Entry | undefined) => {
    if (!entry) return;
    if (entry.kind === "command" && !entry.enabled) return;
    pending.current = entry;
    onOpenChange(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      setActive((a) => (results.length === 0 ? 0 : (a + 1) % results.length));
      event.preventDefault();
    } else if (event.key === "ArrowUp") {
      setActive((a) => (results.length === 0 ? 0 : (a - 1 + results.length) % results.length));
      event.preventDefault();
    } else if (event.key === "Enter") {
      choose(results[active]);
      event.preventDefault();
    } else if (event.key === "Home") {
      setActive(0);
      event.preventDefault();
    } else if (event.key === "End") {
      setActive(Math.max(0, results.length - 1));
      event.preventDefault();
    }
  };

  const activeId = results.length > 0 ? `${listId}-${active}` : undefined;
  const placeholder = mode === "nodes" ? "ค้นหา node บนกระดาน" : "พิมพ์คำสั่งหรือชื่อ node";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <PortalScope>
          <DialogPrimitive.Overlay className="ds-dialog__scrim" />
          <DialogPrimitive.Content
            className="ds-command"
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              input.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              const entry = pending.current;
              pending.current = null;
              if (!entry) return;
              if (entry.kind === "node") {
                event.preventDefault();
                board.jumpToNode(entry.id);
              } else {
                if (entry.command.id.startsWith("node.jump")) event.preventDefault();
                board.run(entry.command.id);
              }
            }}
          >
            <DialogPrimitive.Title className="sr-only">ค้นหาคำสั่ง</DialogPrimitive.Title>
            <div className="ds-command__field">
              <SearchIcon className="size-5 shrink-0" />
              <input
                ref={input}
                type="text"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls={results.length > 0 ? listId : undefined}
                aria-activedescendant={activeId}
                aria-autocomplete="list"
                aria-label={placeholder}
                className="ds-command__input"
                placeholder={placeholder}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
              />
              <Kbd shortcut="Escape" />
            </div>
            {results.length === 0 ? (
              <p className="ds-command__empty">ไม่พบคำสั่งหรือ node ที่ตรงกับ "{query}"</p>
            ) : (
              <div id={listId} role="listbox" aria-label="ผลลัพธ์" className="ds-command__list">
                {groups.map((g) => (
                  <div key={g.key} role="group" aria-label={g.label} className="ds-command__group">
                    <div className="ds-command__heading" aria-hidden>
                      {g.label}
                    </div>
                    {g.entries.map(({ entry, index }) =>
                      entry.kind === "node" ? (
                        <div
                          key={`node-${entry.id}`}
                          id={`${listId}-${index}`}
                          role="option"
                          aria-selected={index === active}
                          className="ds-command__option"
                          data-active={index === active ? "" : undefined}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => choose(entry)}
                        >
                          <span>
                            ไปที่ {entry.title}
                            <span className="ds-command__meta">{entry.word}</span>
                          </span>
                        </div>
                      ) : (
                        <div
                          key={entry.command.id}
                          id={`${listId}-${index}`}
                          role="option"
                          aria-selected={index === active}
                          aria-disabled={entry.enabled ? undefined : true}
                          className="ds-command__option"
                          data-active={index === active ? "" : undefined}
                          data-command={entry.command.id}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => choose(entry)}
                        >
                          <span>{entry.command.label.th}</span>
                          {entry.command.shortcuts[0] ? (
                            <Kbd
                              shortcut={entry.command.shortcuts[0]}
                              className="ds-command__kbd"
                            />
                          ) : null}
                        </div>
                      ),
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="sr-only" role="status" aria-live="polite">
              {results.length} ผลลัพธ์
            </p>
          </DialogPrimitive.Content>
        </PortalScope>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
