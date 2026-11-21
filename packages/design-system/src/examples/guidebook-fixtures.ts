import {
  type BusinessView,
  type Guidebook,
  guidebookOf,
  type StoredEntry,
} from "@orivilo/intent-engine";
import { fixtures } from "../components/fixtures";
import type { Locale } from "../i18n/locale";
import { foundationProject, HOSTILE_STATEMENT, LONG_NAME } from "./business-fixtures";
import { POINT_4, STAND_IN } from "./expression-fixtures";
import {
  answeredEntry,
  CORE_IDEA_TEXT,
  coreIdeaEntry,
  coreIdeaSkippedEntry,
  FIXTURE_NAME,
  givenEntry,
  HOSTILE_ANSWERS,
  HOSTILE_CORE_IDEA,
  HOSTILE_NAME,
  LONG_CORE_IDEA,
  LONG_PERSONALITY_ANSWER,
  LONG_WORKING_NAME,
  lineupEntry,
  logoTypeEntry,
  nameEntry,
  scriptsEntry,
  skippedEntry,
} from "./foundation-fixtures";

/**
 * Fixture data for the brand guidebook stories (ORV-302 spec "Acceptance criteria", the done
 * project and its variants). Every project is made by hand to show a state: nobody gave these
 * answers and nothing was saved. Each one goes through the engine's `toBusinessView` and then
 * `guidebookOf`, so a story shows what the page gets from a saved project. The names, statements
 * and lineups are stand-ins, not real brands.
 */

/** The `person` answer of the done project: three words in the person's own words. */
const PERSON = { th: "สุขุม แม่นยำ อบอุ่น", en: "Calm, precise, warm" } as const;

/** The personality of the done project: point 4 on each scale and no `never` answer (spec, "the done project"). */
const personality = (locale: Locale): StoredEntry =>
  givenEntry({ person: PERSON[locale] }, POINT_4);

/** The foundation answers of the done project, in the order the spec lists them (W2 case A). */
const foundationOf = (locale: Locale): StoredEntry[] => [
  personality(locale),
  answeredEntry(false),
  nameEntry(FIXTURE_NAME),
  coreIdeaEntry(CORE_IDEA_TEXT[locale].statement, CORE_IDEA_TEXT[locale].remember),
];

/** The three inputs of the visual items: ORV-20's stand-in lineup, scripts `thai-latin`, no app icon. */
const visualOf = (): StoredEntry[] => [
  lineupEntry(STAND_IN),
  scriptsEntry("thai-latin"),
  logoTypeEntry(false),
];

const doneEntries = (locale: Locale): StoredEntry[] => [...foundationOf(locale), ...visualOf()];

const book = (view: BusinessView): Guidebook => guidebookOf(view);

/** Row 1, 2, 17: the done project, nothing skipped, every item done but Logo mark. */
export const done = (locale: Locale): Guidebook =>
  book(foundationProject(locale, "agreed", doneEntries(locale)));

/** Row 4, first project: a positioning value answer and no choice, no foundation entry. */
export const openFirst = (locale: Locale): Guidebook => book(foundationProject(locale, "open"));

/** Row 4, second project: the same with the architecture answer "no" and the working name. */
export const open = (locale: Locale): Guidebook =>
  book(foundationProject(locale, "open", [answeredEntry(false), nameEntry(FIXTURE_NAME)]));

/** Positioning agreed and nothing else answered: the steps that wait for the person ask their questions. */
export const openAsks = (locale: Locale): Guidebook => book(foundationProject(locale, "agreed"));

/**
 * Rows 5 and 19, W2 case D: the done project with its positioning choice `skipped`, so the
 * foundation and the three visual items rest on it.
 */
export const skipped = (locale: Locale): Guidebook =>
  book(foundationProject(locale, "skipped", doneEntries(locale)));

/** Row 6, W2 case B: positioning, personality and core idea skipped, architecture "no", the name. */
export const skippedSteps = (locale: Locale): Guidebook =>
  book(
    foundationProject(locale, "skipped", [
      skippedEntry,
      answeredEntry(false),
      nameEntry(FIXTURE_NAME),
      coreIdeaSkippedEntry,
    ]),
  );

/** Row 7, W2 case C: the done project agreed on an older intake, then a later one saved. */
export const stale = (locale: Locale): Guidebook =>
  book(foundationProject(locale, "stale", doneEntries(locale)));

/** Row 18: no lineup, no scripts answer, no logo type answer and no working name. */
export const visualOpen = (locale: Locale): Guidebook =>
  book(
    foundationProject(locale, "agreed", [
      personality(locale),
      answeredEntry(false),
      coreIdeaEntry(CORE_IDEA_TEXT[locale].statement, CORE_IDEA_TEXT[locale].remember),
    ]),
  );

/** Every PR 1 state of rows 1, 2, 4 to 7 and 17 to 19, for the story that reads the text of all of them. */
export const everyState = (locale: Locale): Array<readonly [string, Guidebook]> => [
  ["done", done(locale)],
  ["open-first", openFirst(locale)],
  ["open", open(locale)],
  ["skipped", skipped(locale)],
  ["skipped-steps", skippedSteps(locale)],
  ["stale", stale(locale)],
  ["visual-open", visualOpen(locale)],
];

/** Row 12: markup in the project name, the statement, the working name, the core idea and the answer. */
export const untrusted = (locale: Locale): Guidebook => {
  const g = book(
    foundationProject(locale, "agreed", [
      givenEntry({ person: HOSTILE_CORE_IDEA.remember, never: LONG_PERSONALITY_ANSWER }, POINT_4),
      answeredEntry(false),
      nameEntry(HOSTILE_NAME),
      coreIdeaEntry(HOSTILE_CORE_IDEA.statement, HOSTILE_ANSWERS.never),
      ...visualOf(),
    ]),
  );
  return {
    ...g,
    projectName: HOSTILE_NAME,
    foundation: g.foundation.map((item) =>
      item.status === "done" && item.value.id === "positioning"
        ? {
            ...item,
            value: {
              ...item.value,
              statement: { ...item.value.statement, text: HOSTILE_STATEMENT },
            },
          }
        : item,
    ),
  };
};

/**
 * Row 15: the guidebook of row 5 with a 300 character Thai core idea and a 60 character Thai
 * working name, both without a space, and a 120 character project name.
 */
export const long = (locale: Locale): Guidebook => ({
  ...book(
    foundationProject(locale, "skipped", [
      // Thai marks that stack above and below the line, so a clipped glyph shows (design 16, P13).
      givenEntry({ person: `${fixtures.thaiMarks} ${fixtures.thaiMarks2}` }, POINT_4),
      answeredEntry(false),
      nameEntry(LONG_WORKING_NAME),
      coreIdeaEntry(LONG_CORE_IDEA, fixtures.longThai),
      ...visualOf(),
    ]),
  ),
  projectName: LONG_NAME,
});
