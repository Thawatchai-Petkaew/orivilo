import {
  type AxisPoint,
  type BusinessView,
  PERSONALITY_AXES,
  type PersonalityAxis,
  type StoredEntry,
  STAND_IN_LINEUP,
  type TypographyScripts,
} from "@orivilo/intent-engine";
import { fixtures } from "../components/fixtures";
import { foundationProject } from "./business-fixtures";
import {
  answeredEntry,
  FIXTURE_NAME,
  givenEntry,
  HOSTILE_NAME,
  LONG_WORKING_NAME,
  lineupEntry,
  logoTypeEntry,
  nameEntry,
  scriptsEntry,
  skippedEntry,
} from "./foundation-fixtures";

/**
 * Fixture data for the brand expression stories (ORV-298, PR 1: Colour; PR 2: Typography). Every project is made by
 * hand to show a state: nobody gave these answers and nothing was saved. Each view goes through the
 * engine's `toBusinessView`, so a story shows what the screen gets from a saved project. The
 * lineups are ORV-20's own fixtures: the brand names are stand-ins, not real brands, and nothing
 * here says what any real brand's colour is.
 */

type Locale = "th" | "en";
type Gate = "open" | "skipped" | "agreed";

/** "Personality at point 4": each of the five axes at the fourth scale point (spec, "Acceptance criteria"). */
export const POINT_4: Record<PersonalityAxis, AxisPoint> = Object.fromEntries(
  PERSONALITY_AXES.map((axis) => [axis, 4 as AxisPoint]),
) as Record<PersonalityAxis, AxisPoint>;

/** The same personality at the second scale point: ORV-20's cool, bright case (W4 case 5). */
export const POINT_2: Record<PersonalityAxis, AxisPoint> = Object.fromEntries(
  PERSONALITY_AXES.map((axis) => [axis, 2 as AxisPoint]),
) as Record<PersonalityAxis, AxisPoint>;

/** The stand-in lineup of ORV-20 row 1: seven entries, violet, near black and orange crowded. */
export const STAND_IN: Array<{ name: string; hex: string }> = STAND_IN_LINEUP.map((row) => ({
  ...row,
}));

/** ORV-20 row 9: two lime entries added, so the lime candidate is crowded and the fallback is used. */
export const WITH_LIME = [
  ...STAND_IN,
  { name: "lime-a", hex: "#C6F432" },
  { name: "lime-b", hex: "#B5E61D" },
];

/** ORV-20 row 11: lime, cyan, magenta and teal each twice, so no candidate is free. */
export const EVERY_CANDIDATE_CROWDED = [
  { name: "lime-a", hex: "#C6F432" },
  { name: "lime-b", hex: "#B5E61D" },
  { name: "cyan-a", hex: "#00C8E0" },
  { name: "cyan-b", hex: "#10D0E8" },
  { name: "magenta-a", hex: "#D020B0" },
  { name: "magenta-b", hex: "#E030C0" },
  { name: "teal-a", hex: "#00C8A0" },
  { name: "teal-b", hex: "#10D0A8" },
];

/** Markup as a competitor's name: it must show as literal text (spec row 11). */
export const HOSTILE_COMPETITOR = "<img src=x onerror=alert(1)>";

/** Thai marks that stack above the line, as a competitor's name (design 4.5). */
export const MARKS_COMPETITOR = "ฟื้ปั้ปี๊ฟื้ ปิ่นโต้";

/** Twenty rows each named with 60 Thai characters and no space: the bound of spec row 14. */
export const NARROW_LINEUP = Array.from({ length: 20 }, (_, i) => {
  const number = String(i + 1).padStart(2, "0");
  return {
    name: `${number}${fixtures.longThai.slice(0, 58)}`,
    hex: `#${(0x5b3fd9 + i * 0x111).toString(16).toUpperCase().padStart(6, "0")}`,
  };
});

const personality = (points: Record<PersonalityAxis, AxisPoint>): StoredEntry =>
  givenEntry({}, points);

/** Positioning agreed, personality at point 4 and no lineup: spec row 2, the partly state. */
export const partly = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [personality(POINT_4)]);

/** The same project after the person gave the lineup of the stories (`entries` after the stub's save). */
export const withLineup = (
  locale: Locale,
  lineup: Array<{ name: string; hex: string }>,
  gate: Gate = "agreed",
  points: Record<PersonalityAxis, AxisPoint> = POINT_4,
): BusinessView => foundationProject(locale, gate, [personality(points), lineupEntry(lineup)]);

/** Spec row 3 after the save: signature Lime by `color.signature.lime-warm`, a decided colour. */
export const decided = (locale: Locale): BusinessView => withLineup(locale, STAND_IN);
/** Spec row 5: Lime is crowded, so Cyan is the fallback. */
export const fallback = (locale: Locale): BusinessView => withLineup(locale, WITH_LIME);
/** Spec row 6: both candidates are crowded, the signature stays open. */
export const bothCrowded = (locale: Locale): BusinessView =>
  withLineup(locale, EVERY_CANDIDATE_CROWDED);
/** Spec row 14: 20 competitors with a 60 character Thai name each. */
export const twenty = (locale: Locale): BusinessView => withLineup(locale, NARROW_LINEUP);
/** Spec row 11: the first competitor's name is markup. */
export const hostile = (locale: Locale): BusinessView =>
  withLineup(locale, [{ name: HOSTILE_COMPETITOR, hex: "#5B3FD9" }, ...STAND_IN.slice(1)]);

/** Spec row 7, first case: positioning agreed and a skipped personality, so the rules ask for it. */
export const asksPersonality = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [skippedEntry]);
/** Spec row 7, second case: positioning agreed and no personality entry, so Colour waits for it. */
export const waitsForPersonality = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed");
/** Spec row 7, third case: positioning with no choice and no personality entry. */
export const waitsForPositioning = (locale: Locale): BusinessView =>
  foundationProject(locale, "open");

/** Spec row 8, first case: positioning skipped, so a decided colour is provisional. */
export const provisional = (locale: Locale): BusinessView =>
  withLineup(locale, STAND_IN, "skipped");
/** Spec row 8, second case: a given personality while positioning is not agreed, so not yet checked. */
export const unchecked = (locale: Locale): BusinessView => withLineup(locale, STAND_IN, "open");
/** Spec row 8, third case: positioning skipped and no lineup, a partly worked out colour. */
export const provisionalPartly = (locale: Locale): BusinessView =>
  foundationProject(locale, "skipped", [personality(POINT_4)]);

// ----- Typography (ORV-298 PR 2) -----

/** Spec row 18, before: positioning agreed, personality at point 4 and no typography entry. */
export const asksScripts = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [personality(POINT_4)]);

/** Spec rows 18 and 19, after the save: the families of the answer, a decided typography. */
export const typographyDecided = (
  locale: Locale,
  scripts: TypographyScripts = "thai-latin",
): BusinessView =>
  foundationProject(locale, "agreed", [personality(POINT_4), scriptsEntry(scripts)]);

/** Spec row 21, first case: positioning agreed and a skipped personality, so the families are provisional. */
export const typographyProvisional = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [skippedEntry, scriptsEntry("thai-latin")]);
/** Spec row 21, second case: a given personality while positioning is not agreed, so not yet checked. */
export const typographyUnchecked = (locale: Locale): BusinessView =>
  foundationProject(locale, "open", [personality(POINT_4), scriptsEntry("thai-latin")]);
/** Spec row 21, third case: positioning agreed, no personality entry and an answer: it waits for Brand personality. */
export const typographyWaitsForPersonality = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [scriptsEntry("thai-latin")]);
/** Spec row 21, fourth case: positioning with no choice, no personality entry and an answer. */
export const typographyWaitsForPositioning = (locale: Locale): BusinessView =>
  foundationProject(locale, "open", [scriptsEntry("thai-latin")]);
/** Design T12: waiting and not answered, so the question is offered whatever the marks. */
export const typographyWaitsAndAsks = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed");

// ----- Logo type (ORV-298 PR 3) -----

/** The long working name of spec row 31: eighteen characters once the spaces are left out. */
export const CHASE_NAME = "Chase Manhattan Bank";

/** The project every logo type fixture stands on: Brand architecture answered "no", so it is derived. */
const ARCHITECTURE_NO = answeredEntry(false);

/** Spec rows 29 and 30, before: positioning agreed, architecture "no", the name "ORIVILO" and no answer. */
export const asksAppIcon = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [ARCHITECTURE_NO, nameEntry(FIXTURE_NAME)]);

/** Spec rows 29 and 30, after the save: the decided logo type of an answer, for a name. */
export const logoTypeDecided = (
  locale: Locale,
  appIcon: boolean,
  name: string = FIXTURE_NAME,
): BusinessView =>
  foundationProject(locale, "agreed", [ARCHITECTURE_NO, nameEntry(name), logoTypeEntry(appIcon)]);

/** Spec row 31: a long name and no answer: symbol plus name, and no question to ask. */
export const logoTypeLongName = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [ARCHITECTURE_NO, nameEntry(CHASE_NAME)]);

/** Design L9: a long name and a "yes" stored before the name was given: both reasons show. */
export const logoTypeLongNameYes = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [
    ARCHITECTURE_NO,
    nameEntry(CHASE_NAME),
    logoTypeEntry(true),
  ]);

/** Spec row 36: a working name of 60 Thai characters with no space, so the name is long. */
export const logoTypeThaiLongName = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [ARCHITECTURE_NO, nameEntry(LONG_WORKING_NAME)]);

/** Thai marks that stack above the line, as a working name (design 4.5): a short name. */
export const MARKS_NAME = "ฟื้ปั้ปี๊ฟื้ ปิ่นโต้";

/** The same project with a name of marks and the answer "no": the length line holds the stacked marks. */
export const logoTypeMarksName = (locale: Locale): BusinessView =>
  logoTypeDecided(locale, false, MARKS_NAME);

/** Spec row 35: the working name is markup, and the answer is "no". */
export const logoTypeHostile = (locale: Locale): BusinessView =>
  logoTypeDecided(locale, false, HOSTILE_NAME);

/** Spec row 32, first case: positioning agreed, architecture "no", no name: it waits for Name. */
export const logoTypeWaitsForName = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [ARCHITECTURE_NO]);
/** Spec row 32, second case: architecture "yes" leaves it open, so Logo type waits for it. */
export const logoTypeWaitsForArchitecture = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [answeredEntry(true)]);
/** Spec row 32, third case: positioning went stale after it was agreed: it waits for Positioning. */
export const logoTypeWaitsForPositioning = (locale: Locale): BusinessView =>
  foundationProject(locale, "stale", [ARCHITECTURE_NO, nameEntry(FIXTURE_NAME)]);
/** Design L11: waiting and answered, so the answer shows and no decision does. */
export const logoTypeWaitsAnswered = (locale: Locale): BusinessView =>
  foundationProject(locale, "stale", [
    ARCHITECTURE_NO,
    nameEntry(FIXTURE_NAME),
    logoTypeEntry(false),
  ]);

/** Spec row 33: positioning skipped, the answer "no" and a name: the decision is provisional. */
export const logoTypeProvisional = (locale: Locale): BusinessView =>
  foundationProject(locale, "skipped", [
    ARCHITECTURE_NO,
    nameEntry(FIXTURE_NAME),
    logoTypeEntry(false),
  ]);

/** Every expression node decided on one project: a personality, a lineup, a typography and a logo type. */
export const allDecided = (locale: Locale): BusinessView =>
  foundationProject(locale, "agreed", [
    personality(POINT_4),
    lineupEntry(STAND_IN),
    scriptsEntry("thai-latin"),
    ARCHITECTURE_NO,
    nameEntry(FIXTURE_NAME),
    logoTypeEntry(false),
  ]);
