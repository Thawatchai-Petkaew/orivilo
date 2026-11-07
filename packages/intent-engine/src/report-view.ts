import type { HueFamily } from "./color-audit";
import type { InputEvidence, InputRole, RuleId } from "./evidence";
import { NOT_MEASURED_REASON_LINES, NOT_MEASURED_WHAT_KEYS } from "./evidence-strings";
import type { PersonalityAxis } from "./knowledge";
import { MAX_STYLESHEETS } from "./read-page";
import type { Report } from "./report";

/**
 * What crosses to the browser from a `Report` (ORV-266 tech notes section 7, rules `report-view-1`,
 * `report-list-1` and `report-source-1`). Keys and values, never resolved text: the screen looks the
 * keys up in the person's language, so a language switch needs no second read. Pure, like `reportOf`.
 */

/** The caps of `report-list-1`: the first entries by report order are kept, and a `*Total` counts all. */
export const REPORT_VIEW_CAPS = { colours: 64, fonts: 16, leans: 6, belowFloor: 6 } as const;

/** `thin-page-1`: a page whose heading and body words sum to under this is thin (the `few-words` bound of ORV-128). */
const THIN_UNDER_WORDS = 20;

/** An index into `sheets`, and the offset of the item's `sheet:<offset>` locator. */
export type SheetSource = { sheet: number; offset: number };

export type QualityKey = Extract<InputEvidence["flags"][number]["key"], `quality.${string}`>;
export type TextKind = "title" | "meta" | "heading" | "body";
export type RefusedLine = Extract<Report, { status: "refused" }>["line"];
export type ReportLine = Extract<Report, { status: "analysed" }>["lines"][number];
export type NotMeasuredLine =
  (typeof NOT_MEASURED_REASON_LINES)[keyof typeof NOT_MEASURED_REASON_LINES]["line"];
export type NotMeasuredWhatKey =
  (typeof NOT_MEASURED_WHAT_KEYS)[keyof typeof NOT_MEASURED_WHAT_KEYS];
export type NotReadReasonKey = NonNullable<
  (typeof NOT_MEASURED_REASON_LINES)[keyof typeof NOT_MEASURED_REASON_LINES]["reason"]
>;

export type ViewReading = {
  evidenceId: string;
  level: "high" | "low";
  quote: string | null; // null only on a measured lean, which needs a render
  path: string | null; // the locator's path, null likewise
  rules: RuleId[];
  confidence: number;
  hypothesis: boolean; // the flag only: `hypothesisNote` is English engine text and never crosses
  reasons: QualityKey[]; // the item's `quality.*` flags
};

export type ReportView =
  | { status: "not-read"; url: string; line: "read.notRead.competitor" }
  | { status: "refused"; url: string; urlCut: boolean; line: RefusedLine }
  | {
      status: "analysed";
      url: string; // the URL read, which is also the page's `source.ref`
      readAt: string; // ISO; the earliest `retrievedAt`, or `ctx.retrievedAt` when the report has no items
      role: InputRole; // from `ctx`, as a report with no items holds no role
      incomplete: boolean; // any item carries `quality.pageIncomplete`
      thin: boolean; // `thin-page-1`
      sheets: string[]; // each stylesheet URL once, at most MAX_STYLESHEETS
      colours: { hex: string; band: HueFamily; at: SheetSource[] }[]; // hex as "#FF7A00"
      coloursTotal: number;
      fonts: { name: string; at: SheetSource[] }[]; // the subject without `declared.`
      fontsTotal: number;
      text: { kind: TextKind; blocks: number; words: number }[];
      personality: {
        axis: PersonalityAxis;
        leans: ViewReading[];
        leansTotal: number;
        belowFloor: ViewReading[];
        belowFloorTotal: number;
      }[]; // the five axes, in `PERSONALITY_AXES` order
      notMeasured: {
        line: NotMeasuredLine;
        what: NotMeasuredWhatKey;
        reason: NotReadReasonKey | null;
      }[];
      lines: ReportLine[];
    };

type Item = InputEvidence;

const TEXT_KINDS_IN_ORDER: readonly TextKind[] = ["title", "meta", "heading", "body"];
const SHEET_PATH = /^sheet:(\d+)$/;
const DECLARED = "declared.";

/** The words a `word-count` measure holds; 0 for an item that has none. */
const wordsOf = (item: Item): number =>
  item.measure?.metric === "word-count" && typeof item.measure.value === "number"
    ? item.measure.value
    : 0;

/** The path of a text or element locator; null for a box or a surface. */
const pathOf = (item: Item): string | null => {
  const locator = item.source.locator;
  return locator.kind === "text" || locator.kind === "element" ? locator.path : null;
};

const qualityKeysOf = (item: Item): QualityKey[] =>
  item.flags.flatMap((f) => (f.key.startsWith("quality.") ? [f.key as QualityKey] : []));

function readingOf(level: "high" | "low", confidence: number, item: Item | undefined): ViewReading {
  return {
    evidenceId: item?.id ?? "",
    level,
    quote: item?.observation.quote ?? null,
    path: item === undefined ? null : pathOf(item),
    rules: item?.reading?.by === "rule" ? [...item.reading.rules] : [],
    confidence,
    hypothesis: item?.hypothesis ?? false,
    reasons: item === undefined ? [] : qualityKeysOf(item),
  };
}

/** Groups items by subject, in the order each subject first appears (the report's order). */
function groupBySubject(items: Item[]): Map<string, Item[]> {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const group = groups.get(item.observation.subject);
    if (group === undefined) groups.set(item.observation.subject, [item]);
    else group.push(item);
  }
  return groups;
}

export function toReportView(
  report: Report,
  ctx: { role: InputRole; retrievedAt: string },
): ReportView {
  if (report.status === "not-read") {
    return { status: "not-read", url: report.url, line: report.line };
  }
  if (report.status === "refused") {
    return { status: "refused", url: report.url, urlCut: report.urlCut, line: report.line };
  }

  const items = report.evidence;
  const byId = new Map(items.map((i) => [i.id, i]));

  // Each stylesheet URL once: a source line holds an index into this list, never the URL.
  const sheets: string[] = [];
  const sheetIndex = new Map<string, number>();
  const sourcesOf = (group: Item[]): SheetSource[] =>
    group.flatMap((item) => {
      const match = SHEET_PATH.exec(pathOf(item) ?? "");
      if (match === null) return [];
      let sheet = sheetIndex.get(item.source.ref);
      if (sheet === undefined) {
        if (sheets.length >= MAX_STYLESHEETS) return [];
        sheet = sheets.push(item.source.ref) - 1;
        sheetIndex.set(item.source.ref, sheet);
      }
      return [{ sheet, offset: Number(match[1]) }];
    });

  const colourGroups = [
    ...groupBySubject(
      items.filter(
        (i) =>
          i.observation.kind === "colour-declared" &&
          i.measure?.metric === "hue-family" &&
          typeof i.measure.value === "string",
      ),
    ),
  ];
  const colours = colourGroups.slice(0, REPORT_VIEW_CAPS.colours).map(([subject, group]) => ({
    hex: `#${subject.toUpperCase()}`,
    band: group[0]?.measure?.value as HueFamily, // the filter above kept hue-family measures holding a band name
    at: sourcesOf(group),
  }));

  const fontGroups = [
    ...groupBySubject(
      items.filter(
        (i) => i.observation.kind === "font-family" && i.observation.subject.startsWith(DECLARED),
      ),
    ),
  ];
  const fonts = fontGroups.slice(0, REPORT_VIEW_CAPS.fonts).map(([subject, group]) => ({
    name: subject.slice(DECLARED.length),
    at: sourcesOf(group),
  }));

  const spans = items.filter((i) => i.observation.kind === "text-span");
  const text = TEXT_KINDS_IN_ORDER.flatMap((kind) => {
    const of = spans.filter((i) => i.observation.subject === kind);
    return of.length === 0
      ? []
      : [{ kind, blocks: of.length, words: of.reduce((sum, i) => sum + wordsOf(i), 0) }];
  });
  const thinWords = spans
    .filter((i) => i.observation.subject === "heading" || i.observation.subject === "body")
    .reduce((sum, i) => sum + wordsOf(i), 0);

  const personality = report.personality.map((entry) => {
    const target = `identity-frame.personality.${entry.axis}`;
    const below = items.flatMap((item) =>
      item.belowFloor && item.reading?.target === target && "lean" in item.reading.value
        ? [readingOf(item.reading.value.lean, item.confidence.value, item)]
        : [],
    );
    return {
      axis: entry.axis,
      leans: entry.leans
        .slice(0, REPORT_VIEW_CAPS.leans)
        .map((l) => readingOf(l.lean, l.confidence, byId.get(l.evidenceId))),
      leansTotal: entry.leans.length,
      belowFloor: below.slice(0, REPORT_VIEW_CAPS.belowFloor),
      belowFloorTotal: below.length,
    };
  });

  return {
    status: "analysed",
    url: report.url,
    readAt: items.map((i) => i.source.retrievedAt).sort()[0] ?? ctx.retrievedAt,
    role: ctx.role,
    incomplete: items.some((i) => i.flags.some((f) => f.key === "quality.pageIncomplete")),
    thin: thinWords < THIN_UNDER_WORDS,
    sheets,
    colours,
    coloursTotal: colourGroups.length,
    fonts,
    fontsTotal: fontGroups.length,
    text,
    personality,
    notMeasured: report.notMeasured.map((n) => ({
      line: NOT_MEASURED_REASON_LINES[n.reason].line,
      what: NOT_MEASURED_WHAT_KEYS[n.what],
      reason: NOT_MEASURED_REASON_LINES[n.reason].reason,
    })),
    lines: report.lines,
  };
}
