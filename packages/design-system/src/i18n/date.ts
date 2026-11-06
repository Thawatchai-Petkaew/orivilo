/**
 * Dates as plain text and local days (spec ORV-231, `date-value-1` and `date-format-1`).
 * A date crossing a public API is an `IsoDate`, Gregorian, with no time and no zone; a Buddhist
 * year lives only in what is shown. This module imports no calendar engine.
 */
import { DATE_TAGS, type Locale } from "./locale";

/** `YYYY-MM-DD` in the Gregorian calendar. Compares in date order as a string. */
export type IsoDate = string;

/** Both ends included. */
export type DateRange = { start: IsoDate; end: IsoDate };

export type DateStyle = "medium" | "full" | "monthYear";

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The three numbers of a real date, or undefined: `2026-02-30` is not one. */
function parts(value: IsoDate): [number, number, number] | undefined {
  const m = ISO.exec(value);
  if (!m) return undefined;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const probe = new Date(Date.UTC(2000, mo - 1, d));
  probe.setUTCFullYear(y);
  // A real date reads back its year, month and day. A day past the month's end rolls into the next
  // month, and a day of 00 rolls back onto 29 February 2000, which setUTCFullYear then moves to 1 March
  // in a year that is not a leap year, keeping the month; only the day tells that one (date-value-1).
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) {
    return undefined;
  }
  return [y, mo, d];
}

/** A local-midnight `Date` from the three numbers, for the engine; undefined for a false date. */
export function fromIsoDate(value: IsoDate): Date | undefined {
  const p = parts(value);
  if (!p) return undefined;
  const date = new Date(2000, p[1] - 1, p[2]);
  date.setFullYear(p[0]);
  return date;
}

/** Reads a `Date` back with local getters, never `toISOString`, which moves the day east of UTC. */
export function toIsoDate(date: Date): IsoDate {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  medium: { dateStyle: "medium" },
  full: { dateStyle: "full" },
  monthYear: { month: "long", year: "numeric" },
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(style: DateStyle, locale: Locale): Intl.DateTimeFormat {
  const key = `${locale}:${style}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(DATE_TAGS[locale], { ...OPTIONS[style], timeZone: "UTC" });
    formatters.set(key, f);
  }
  return f;
}

/**
 * The one way a date becomes text. It formats a UTC instant with `timeZone: "UTC"`, so the viewer's
 * zone cannot move a plain date. `monthYear` keeps only the month and year parts, so a heading never
 * depends on a pattern the runtime may write differently. A value that is not a real date gives "".
 */
export function formatDate(value: IsoDate, style: DateStyle, locale: Locale): string {
  const p = parts(value);
  if (!p) return "";
  const instant = new Date(Date.UTC(2000, p[1] - 1, p[2]));
  instant.setUTCFullYear(p[0]);
  const f = formatterFor(style, locale);
  if (style !== "monthYear") return f.format(instant);
  return f
    .formatToParts(instant)
    .filter((part) => part.type === "month" || part.type === "year")
    .map((part) => part.value)
    .join(" ");
}
