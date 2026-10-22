"use client";

import { isApplePlatform } from "../../commands/index";
import { DEFAULT_LOCALE, type Locale } from "../../i18n/locale";
import { useLocale } from "../../i18n/LocaleProvider";
import { messagesFor, type Messages } from "../../i18n/messages/index";
import { cx } from "../cx";

export interface KbdProps {
  /** A shortcut as the registry spells it: `Mod+Shift+K`, `ArrowUp`, `/`. */
  shortcut: string;
  /** Apple platforms read Mod as Cmd and Alt as Option; detected when omitted. */
  apple?: boolean | undefined;
  className?: string | undefined;
}

/** Keys whose glyph is shorter than their name; the name (from the catalog) stays for screen readers. */
const GLYPHS: Record<string, { glyph: string; name: keyof Messages["kbd"] }> = {
  ArrowUp: { glyph: "↑", name: "arrowUp" },
  ArrowDown: { glyph: "↓", name: "arrowDown" },
  ArrowLeft: { glyph: "←", name: "arrowLeft" },
  ArrowRight: { glyph: "→", name: "arrowRight" },
};

/** The word a key cap shows, by platform (catalog Kbd rule). */
export function keyWord(key: string, apple: boolean): string {
  switch (key) {
    case "Mod":
      return apple ? "Cmd" : "Ctrl";
    case "Alt":
      return apple ? "Option" : "Alt";
    case "Escape":
      return "Esc";
    default:
      return GLYPHS[key]?.glyph ?? key;
  }
}

/** The shortcut as words, for a tooltip or an accessible description: "Cmd Shift K". */
export function shortcutWords(
  shortcut: string,
  apple = isApplePlatform(),
  locale: Locale = DEFAULT_LOCALE,
): string {
  const names = messagesFor(locale).kbd;
  return shortcut
    .split("+")
    .map((k) => {
      const glyph = GLYPHS[k];
      return glyph ? names[glyph.name] : keyWord(k, apple);
    })
    .join(" ");
}

/**
 * A keyboard shortcut hint: one key cap per key, the modifier by platform, arrows as glyphs with
 * their names for screen readers. Keys come from the command registry (catalog Kbd rule).
 */
export function Kbd({ shortcut, apple = isApplePlatform(), className }: KbdProps) {
  const names = messagesFor(useLocale()).kbd;
  const keys = shortcut.split("+");
  return (
    <span className={cx("ds-kbd-group", className)} data-shortcut={shortcut}>
      {keys.map((key, i) => {
        const glyph = GLYPHS[key];
        return (
          <kbd key={`${key}-${i}`} className="ds-kbd">
            {glyph ? (
              <>
                <span aria-hidden>{glyph.glyph}</span>
                <span className="sr-only">{names[glyph.name]}</span>
              </>
            ) : (
              keyWord(key, apple)
            )}
          </kbd>
        );
      })}
    </span>
  );
}
