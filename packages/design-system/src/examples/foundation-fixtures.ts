import {
  ANSWER_MAX_CHARS,
  type AxisPoint,
  type AxisValue,
  axisValueOf,
  type BusinessView,
  type EntryRequest,
  PERSONALITY_AXES,
  type PersonalityAxis,
  type StoredEntry,
} from "@orivilo/intent-engine";
import { fixtures } from "../components/fixtures";
import { foundationProject } from "./business-fixtures";

/**
 * Fixture data for the brand foundation stories (ORV-291 PR 1, Brand personality). Every project is
 * made by hand to show a state: nobody gave these answers and nothing was saved. Each view goes
 * through the engine's `toBusinessView`, so a story shows what the screen gets from a saved project.
 */

const SAVED_AT = "2026-11-19T04:00:00.000Z";

/** The points a fixture personality holds, one per scale in `PERSONALITY_AXES` order. */
export const FIXTURE_POINTS: Record<PersonalityAxis, AxisPoint> = {
  playful: 4,
  expressive: 2,
  structured: 3,
  warm: 5,
  premium: 1,
};

/** What a person wrote in each language: one sentence of their own for each question. */
export const PERSONALITY_ANSWERS = {
  th: {
    person: "เหมือนเพื่อนข้างบ้านที่ชงกาแฟให้เราทุกเช้า พูดน้อยแต่ใส่ใจ",
    never: "ไม่อยากให้ดูหรูจนคนไม่กล้าเดินเข้ามา",
  },
  en: {
    person: "Like the neighbour who brews your coffee every morning, quiet but caring.",
    never: "Never so polished that people hesitate to walk in.",
  },
} as const;

/** Markup in both answers: it must show as literal text (spec row 8). */
export const HOSTILE_ANSWERS = {
  person: "<img src=x onerror=alert(1)>",
  never: "<a href=https://evil.example>click</a>",
} as const;

/** 2,000 Thai characters with no space, the longest an answer keeps (spec row 11). */
export const LONG_PERSONALITY_ANSWER = fixtures.longThai.repeat(40).slice(0, ANSWER_MAX_CHARS);

/** One stored entry, as the table holds it. */
export const givenEntry = (
  answers: { person?: string; never?: string } = {},
  points: Record<PersonalityAxis, AxisPoint> = FIXTURE_POINTS,
): StoredEntry => ({
  id: "entry-given",
  createdAt: SAVED_AT,
  node: "identity-frame",
  kind: "given",
  payload: {
    axes: Object.fromEntries(
      PERSONALITY_AXES.map((axis) => [axis, axisValueOf(points[axis])]),
    ) as Record<PersonalityAxis, AxisValue>,
    ...answers,
  },
});

export const skippedEntry: StoredEntry = {
  id: "entry-skipped",
  createdAt: SAVED_AT,
  node: "identity-frame",
  kind: "skipped",
  payload: {},
};

type Locale = "th" | "en";

/** Positioning is not agreed yet: Brand personality waits for it (spec row 5). */
export const waiting = (locale: Locale): BusinessView => foundationProject(locale, "open");
/** Positioning agreed and no entry: the open state with Describe and Skip (spec row 4). */
export const open = (locale: Locale): BusinessView => foundationProject(locale, "agreed");
/** Positioning agreed and a given personality: nothing left to check against (spec row 2). */
export const given = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [givenEntry(PERSONALITY_ANSWERS[locale])]);
/** A given personality while Positioning is not agreed: the unchecked mark line (spec row 6). */
export const givenUnchecked = (locale: Locale): BusinessView =>
  foundationProject(locale, "open", [givenEntry(PERSONALITY_ANSWERS[locale])]);

/**
 * The view the page would build again after the save, from the same engine function: what a stub
 * action returns in place of the server. A given entry holds only the answers the person typed.
 */
export function afterEntry(locale: Locale, request: EntryRequest): BusinessView {
  const entry: StoredEntry =
    request.kind === "skipped"
      ? skippedEntry
      : {
          id: "entry-given",
          createdAt: SAVED_AT,
          node: "identity-frame",
          kind: "given",
          payload: request.payload,
        };
  return foundationProject(locale, "agreed", [entry]);
}
