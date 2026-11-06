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

/**
 * The tags the date formatter gets (spec ORV-231, `date-format-1`). They name the calendar and the
 * digits, so the output never depends on a runtime's default: Thai shows the Buddhist Era year and
 * English the Common Era year, both with Arabic digits (`date-year-1`). `LOCALE_TAGS` stays as it is,
 * so number formats do not change.
 */
export const DATE_TAGS: Record<Locale, string> = {
  th: "th-TH-u-ca-buddhist-nu-latn",
  en: "en-US-u-ca-gregory-nu-latn",
};

/** The first day of the week, 0 for Sunday, from CLDR's `TH` and `US` entries (`cal-week-1`). */
export const WEEK_START: Record<Locale, 0 | 1 | 2 | 3 | 4 | 5 | 6> = { th: 0, en: 0 };

/** Years the shown year runs ahead of the Gregorian one: Buddhist Era 543, Common Era 0 (`date-year-1`). */
export const YEAR_OFFSET: Record<Locale, number> = { th: 543, en: 0 };

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
