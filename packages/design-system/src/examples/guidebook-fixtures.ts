import {
  type BusinessView,
  type Guidebook,
  guidebookOf,
  INTAKE_VERSION,
  type SavedBusiness,
  type StoredChoice,
  type StoredDraft,
  type StoredEntry,
  toBusinessView,
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

// ----- the drafted positioning (ORV-307, spec row 20) -----

/** The model id the fixture draft says it was made by: a stand-in string, no model was called. */
export const DRAFT_MODEL = "anthropic/claude-sonnet-5.5";

const DRAFT_INTAKE_ID = "intake-draft";
const DRAFT_ID = "draft-fixture";
const DRAFT_SAVED_AT = "2026-11-21T03:00:00.000Z";

/** The two answers the options quote, and the three drafted options, in each language. */
const DRAFT_TEXT = {
  th: {
    name: "คาเฟ่ริมคลอง",
    idea: "ร้านกาแฟคั่วเองสำหรับคนทำงานในย่านเมืองเก่า",
    value: "เมล็ดกาแฟที่คั่วสดทุกเช้าในร้าน",
    options: [
      "ร้านกาแฟริมคลองที่คั่วเมล็ดสดทุกเช้าสำหรับคนทำงานย่านเมืองเก่า",
      "กาแฟคั่วสดทุกเช้าที่โต๊ะริมคลองสำหรับคนทำงานย่านเมืองเก่า",
      "ร้านคั่วเองริมคลองที่ให้คนย่านเมืองเก่าได้พักกับกาแฟสดทุกเช้า",
    ],
    edited: "ร้านคั่วเองริมคลองที่ให้คนย่านเมืองเก่าได้พักกับกาแฟสดทุกวัน",
  },
  en: {
    name: "Canalside Cafe",
    idea: "A roastery for people who work in the old town.",
    value: "Beans roasted fresh in the shop each morning.",
    options: [
      "A canalside roastery that roasts its beans fresh each morning for the old town's workers.",
      "Fresh-roasted coffee at a quiet canalside table, made each morning for old town workers.",
      "A roastery by the canal where old town workers take a break with fresh coffee each morning.",
    ],
    edited:
      "A roastery by the canal where old town workers take a break with fresh coffee each day.",
  },
} as const;

/** A stored draft of three options, each quoting both answers, as ORV-292's service saves one. */
const storedDraft = (locale: Locale): StoredDraft => {
  const text = DRAFT_TEXT[locale];
  const quote = (answer: "idea" | "value") => ({
    answer,
    start: 0,
    end: text[answer].length,
    text: text[answer],
  });
  return {
    id: DRAFT_ID,
    job: "positioning-draft",
    intakeId: DRAFT_INTAKE_ID,
    modelId: DRAFT_MODEL,
    adapter: { id: "positioning-draft", version: "1" },
    promptVersion: "positioning-prompt-1",
    options: text.options.map((statement) => ({
      statement,
      quotes: [quote("idea"), quote("value")],
    })),
  };
};

/** The choice of the saved project: option 2 picked, the same option edited, or none yet. */
const draftChoice = (locale: Locale, kind: "picked" | "edited" | null): StoredChoice | null =>
  kind === null
    ? null
    : {
        id: "choice-draft",
        intakeId: DRAFT_INTAKE_ID,
        createdAt: DRAFT_SAVED_AT,
        kind,
        statement: kind === "picked" ? DRAFT_TEXT[locale].options[1] : DRAFT_TEXT[locale].edited,
        draftId: DRAFT_ID,
        option: 2,
      };

/**
 * A saved project with a stored draft of three options, run through the engine's view and then
 * `guidebookOf`. No entry is saved while the draft waits, so the foundation waits for Positioning;
 * once a choice is made the whole foundation of the done project is there.
 */
const drafted = (locale: Locale, kind: "picked" | "edited" | null): Guidebook => {
  const text = DRAFT_TEXT[locale];
  const saved: SavedBusiness = {
    project: { id: "fixture", name: text.name, createdAt: DRAFT_SAVED_AT },
    intake: { version: INTAKE_VERSION, idea: text.idea, value: text.value },
    positioning: {
      intakeId: DRAFT_INTAKE_ID,
      choice: draftChoice(locale, kind),
      draft: storedDraft(locale),
    },
    foundation: kind === null ? [] : doneEntries(locale),
  };
  return book(toBusinessView(saved));
};

/** Row 20, first project: a stored draft of three options and no choice. */
export const awaitingChoice = (locale: Locale): Guidebook => drafted(locale, null);

/** Row 20, second project: option 2 picked. */
export const picked = (locale: Locale): Guidebook => drafted(locale, "picked");

/** Design 14, Edited: option 2 edited by the person. */
export const edited = (locale: Locale): Guidebook => drafted(locale, "edited");

/** The statements of the three drafted options and the edited one, for the plays that look for them. */
export const draftTexts = (locale: Locale) => ({
  options: DRAFT_TEXT[locale].options,
  edited: DRAFT_TEXT[locale].edited,
});

/**
 * Every state of rows 1, 2, 4 to 7, 17 to 19 and 20, for the story that reads the text of all of
 * them. The last three hold the one AI label `guidebook-honest-1` allows, on Positioning only.
 */
export const everyState = (locale: Locale): Array<readonly [string, Guidebook]> => [
  ["done", done(locale)],
  ["open-first", openFirst(locale)],
  ["open", open(locale)],
  ["skipped", skipped(locale)],
  ["skipped-steps", skippedSteps(locale)],
  ["stale", stale(locale)],
  ["visual-open", visualOpen(locale)],
  ["awaiting-choice", awaitingChoice(locale)],
  ["picked", picked(locale)],
  ["edited", edited(locale)],
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
