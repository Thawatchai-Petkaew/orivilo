/** Locale-aware formatting through `Intl`, one cached formatter per locale (spec ORV-39). */
import { DEFAULT_LOCALE, LOCALE_TAGS, type Locale } from "./locale";

const numbers = new Map<Locale, Intl.NumberFormat>();
const percents = new Map<Locale, Intl.NumberFormat>();
const collators = new Map<Locale, Intl.Collator>();

export function formatNumber(value: number, locale: Locale = DEFAULT_LOCALE): string {
  let f = numbers.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE_TAGS[locale]);
    numbers.set(locale, f);
  }
  return f.format(value);
}

/** `ratio` 1 is 100%; the board's zoom shows whole percents. */
export function formatPercent(ratio: number, locale: Locale = DEFAULT_LOCALE): string {
  let f = percents.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE_TAGS[locale], { style: "percent", maximumFractionDigits: 0 });
    percents.set(locale, f);
  }
  return f.format(ratio);
}

/** The collator a sorted list uses: numeric, accent and case insensitive, in the locale's order. */
export function collatorFor(locale: Locale = DEFAULT_LOCALE): Intl.Collator {
  let c = collators.get(locale);
  if (!c) {
    c = new Intl.Collator(LOCALE_TAGS[locale], { numeric: true, sensitivity: "base" });
    collators.set(locale, c);
  }
  return c;
}
