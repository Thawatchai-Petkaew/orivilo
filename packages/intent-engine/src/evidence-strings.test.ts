import { describe, expect, it } from "vitest";
import { EVIDENCE_STRINGS, QUESTION_KEYS } from "./evidence-strings";

type Entry = { th: string; en: string };

/** Fails with the key and language of the first bad string; used by the test and its break-it. */
export function stringProblems(
  table: Record<string, Entry>,
  questionKeys: readonly string[],
): string[] {
  const problems: string[] = [];
  for (const [key, entry] of Object.entries(table)) {
    for (const lang of ["th", "en"] as const) {
      const text = entry[lang];
      if (text.trim() === "") problems.push(`${key}.${lang} is empty`);
      if (text.includes("—")) problems.push(`${key}.${lang} has an em dash`);
      if (text.includes("·")) problems.push(`${key}.${lang} has a middot`);
    }
  }
  for (const key of questionKeys) {
    if (!(key in table)) problems.push(`${key} is a question key without a string`);
  }
  return problems;
}

// The keys of the ORV-128 spec "Strings" section (the four {what} labels wait for slice 1c).
const SPEC_KEYS = [
  "evidence.fromModel",
  "evidence.measured",
  "evidence.belowFloor",
  "evidence.conflict",
  "evidence.toolDefault",
  "evidence.similarTo",
  "culture.yellow",
  "culture.political",
  "industry.confirm",
  "industry.byNameOnly",
  "report.conflictsNotChecked",
  "read.refused.robots",
  "read.refused.address",
  "read.notRead.competitor",
  "read.notMeasured",
  "read.notRendered.none",
  "read.notRendered.failed",
  "read.notRendered.budget",
  "read.notRendered.invalid",
  "quality.fewWords",
  "quality.pageIncomplete",
  "quality.imageSmall",
  "quality.imageBlurred",
];

describe("evidence strings", () => {
  it("every string is Thai and English", () => {
    expect(stringProblems(EVIDENCE_STRINGS, QUESTION_KEYS)).toEqual([]);
    expect(QUESTION_KEYS).toHaveLength(6);
  });

  it("the key set equals the list the spec Strings section holds", () => {
    expect(Object.keys(EVIDENCE_STRINGS).sort()).toEqual([...SPEC_KEYS].sort());
  });

  it("break-it: an empty th, an em dash and a stray question key are reported", () => {
    const broken = { ...EVIDENCE_STRINGS, "evidence.measured": { th: "", en: "a — b" } };
    expect(stringProblems(broken, [...QUESTION_KEYS, "nope"])).toEqual([
      "evidence.measured.th is empty",
      "evidence.measured.en has an em dash",
      "nope is a question key without a string",
    ]);
  });
});
