/**
 * The locales the design system speaks (spec ORV-39). Thai is the default and the source of
 * every catalog; English is the second; a third locale is one more entry here and one more
 * catalog file per package. Nothing else in the package knows the list.
 */
export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "th";

/** The BCP 47 tag `Intl` gets for each locale. */
export const LOCALE_TAGS: Record<Locale, string> = { th: "th-TH", en: "en-US" };

/** What each locale calls itself, for a switch. */
export const LOCALE_NAMES: Record<Locale, string> = { th: "ไทย", en: "English" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** A word in every locale, the shape the registry labels and `CANVAS_WORDS` already use. */
export type Localized<T = string> = Record<Locale, T>;

/** The word for a locale. */
export function pick<T>(words: Localized<T>, locale: Locale): T {
  return words[locale];
}
