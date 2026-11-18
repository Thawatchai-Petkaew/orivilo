import type { PersonalityAxis, ReportView, ViewReading } from "@orivilo/intent-engine";

/** Hand-made brand reports shared by the stories of the brand report screen and the ORIVILO canvas page. None was read from a page. */
/** `HTML_A` and `CSS_A` of the ORV-20 band: an orange and a blue that falls in the violet band, and one font. */
export const PAGE = "https://clinic.example/";
export const SHEET = "https://clinic.example/a.css";
export const READ_AT = "2026-11-07T03:15:00.000Z";

export const AXES: readonly PersonalityAxis[] = [
  "playful",
  "expressive",
  "structured",
  "warm",
  "premium",
];

export function reading(
  id: string,
  level: "high" | "low",
  quote: string,
  path: string,
  extra: Partial<ViewReading> = {},
): ViewReading {
  return {
    evidenceId: id,
    level,
    quote,
    path,
    rules: ["lexicon-1"],
    confidence: 0.7,
    hypothesis: false,
    reasons: [],
    ...extra,
  };
}

export type AnalysedView = Extract<ReportView, { status: "analysed" }>;
type AxisEntry = AnalysedView["personality"][number];

export function personalityOf(
  by: Partial<Record<PersonalityAxis, Partial<AxisEntry>>>,
): AxisEntry[] {
  return AXES.map((axis) => {
    const given = by[axis] ?? {};
    const leans = given.leans ?? [];
    const belowFloor = given.belowFloor ?? [];
    return {
      axis,
      leans,
      leansTotal: given.leansTotal ?? leans.length,
      belowFloor,
      belowFloorTotal: given.belowFloorTotal ?? belowFloor.length,
    };
  });
}

export const NOT_MEASURED: AnalysedView["notMeasured"] = [
  {
    line: "read.notMeasured",
    what: "read.notMeasured.what.colourArea",
    reason: "read.notRendered.none",
  },
  {
    line: "read.notMeasured",
    what: "read.notMeasured.what.contrast",
    reason: "read.notRendered.none",
  },
  {
    line: "read.notMeasured",
    what: "read.notMeasured.what.density",
    reason: "read.notRendered.none",
  },
  {
    line: "read.notMeasured",
    what: "read.notMeasured.what.textVisibility",
    reason: "read.notRendered.none",
  },
];

/** One quote holding `premium`, one holding `not too premium`, and a heading below the floor. */
export const PREMIUM_BODY = reading(
  "ev-body-1",
  "high",
  "A premium finish for every visit",
  "body > section > p:nth-of-type(1)",
  { confidence: 0.8 },
);
export const PREMIUM_NOT_TOO = reading(
  "ev-body-2",
  "low",
  "Not too premium, just honest care",
  "body > section > p:nth-of-type(2)",
  { rules: ["value-to-lean-1"], confidence: 0.4, hypothesis: true },
);
export const PREMIUM_HEADING = reading(
  "ev-h-1",
  "high",
  "Quiet premium care",
  "body > section > h1",
  {
    confidence: 0.3,
    reasons: ["quality.fewWords"],
  },
);

export const ANALYSED: AnalysedView = {
  status: "analysed",
  url: PAGE,
  readAt: READ_AT,
  role: "own",
  incomplete: false,
  thin: false,
  sheets: [SHEET],
  colours: [
    { hex: "#FF7A00", band: "orange", at: [{ sheet: 0, offset: 41 }] },
    { hex: "#0000FF", band: "violet", at: [{ sheet: 0, offset: 88 }] },
  ],
  coloursTotal: 2,
  fonts: [{ name: "inter", at: [{ sheet: 0, offset: 120 }] }],
  fontsTotal: 1,
  text: [
    { kind: "title", blocks: 1, words: 3 },
    { kind: "meta", blocks: 1, words: 12 },
    { kind: "heading", blocks: 3, words: 9 },
    { kind: "body", blocks: 2, words: 44 },
  ],
  personality: personalityOf({
    premium: {
      leans: [PREMIUM_BODY, PREMIUM_NOT_TOO],
      belowFloor: [PREMIUM_HEADING],
    },
    warm: {
      leans: [
        reading(
          "ev-body-3",
          "high",
          "We welcome every family",
          "body > section > p:nth-of-type(3)",
        ),
      ],
    },
  }),
  notMeasured: NOT_MEASURED,
  lines: ["report.conflictsNotChecked"],
};
