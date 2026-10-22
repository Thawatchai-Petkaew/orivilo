"use client";

import {
  COMMANDS,
  type CommandScope,
  commandAvailable,
  COMMAND_SCOPES,
} from "../../commands/index";
import { Dialog, DialogContent } from "../dialog/Dialog";
import { Kbd } from "../kbd/Kbd";

export interface ShortcutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SCOPE_WORD: Record<CommandScope, string> = {
  board: "กระดาน",
  selection: "สิ่งที่เลือก",
  node: "node ที่เลือก",
  edge: "สายที่เลือก",
  panel: "ในแผง",
  app: "ทุกที่ใน Studio",
};

/**
 * Every registry command with its keys, grouped by scope (Shift+/). A command from a later story
 * is listed with the story that brings it, never as something that works today (AGENTS.md rule
 * 4). The list is the registry itself, so a new command appears here without a code change.
 */
export function ShortcutSheet({ open, onOpenChange }: ShortcutSheetProps) {
  const scopes = Object.keys(COMMAND_SCOPES) as CommandScope[];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="คีย์ลัดทั้งหมด"
        description="คีย์ทุกตัวมาจากทะเบียนคำสั่งของกระดาน คำสั่งที่ยังไม่มีบอกไว้ว่ามาในเรื่องไหน"
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
                  {SCOPE_WORD[scope]}
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
                          {c.label.th}
                          {available ? null : (
                            <span className="ds-sheet__later">มาใน {c.since}</span>
                          )}
                        </dt>
                        <dd>
                          {c.shortcuts.length === 0 ? (
                            <span className="ds-sheet__none">ไม่มีคีย์</span>
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
