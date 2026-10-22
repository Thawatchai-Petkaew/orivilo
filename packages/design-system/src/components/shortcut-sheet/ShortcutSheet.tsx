"use client";

import {
  COMMANDS,
  type CommandScope,
  commandAvailable,
  COMMAND_SCOPES,
} from "../../commands/index";
import { useMessages, useWord } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { Dialog, DialogContent } from "../dialog/Dialog";
import { Kbd } from "../kbd/Kbd";

export interface ShortcutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Every registry command with its keys, grouped by scope (Shift+/). A command from a later story
 * is listed with the story that brings it, never as something that works today (AGENTS.md rule
 * 4). The list is the registry itself, so a new command appears here without a code change.
 */
export function ShortcutSheet({ open, onOpenChange }: ShortcutSheetProps) {
  const m = useMessages();
  const word = useWord();
  const scopes = Object.keys(COMMAND_SCOPES) as CommandScope[];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={m.sheet.title}
        description={m.sheet.description}
        size="md"
        scrollable
        className="ds-sheet"
      >
        <div className="ds-sheet__scroll">
          {scopes.map((scope) => {
            const items = COMMANDS.filter((c) => c.scope === scope);
            if (items.length === 0) return null;
            return (
              <section key={scope} className="ds-sheet__section" aria-labelledby={`sheet-${scope}`}>
                <h3 id={`sheet-${scope}`} className="ds-sheet__heading">
                  {m.sheet.scope[scope]}
                </h3>
                <dl className="ds-sheet__list">
                  {items.map((c) => {
                    const available = commandAvailable(c);
                    return (
                      <div
                        key={c.id}
                        className="ds-sheet__row"
                        data-command={c.id}
                        data-available={available ? "" : undefined}
                      >
                        <dt>
                          {word(c.label)}
                          {available ? null : (
                            <span className="ds-sheet__later">
                              {fill(m.sheet.since, { story: c.since })}
                            </span>
                          )}
                        </dt>
                        <dd>
                          {c.shortcuts.length === 0 ? (
                            <span className="ds-sheet__none">{m.sheet.noKey}</span>
                          ) : (
                            c.shortcuts.map((s) => <Kbd key={s} shortcut={s} />)
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
