import { describe, expect, it } from "vitest";
import { z } from "zod";
import { wordCount } from "../../page-text";
import { checkIntake } from "../intake";
import casesJson from "./cases.json";

// ORV-285 tech notes section 8.4: the evaluation cases of the positioning-draft job, written by hand.
// Fictional businesses, no personal data. The injection cases are attacks written as fixture data to
// be stored and replayed: nothing in them is an instruction to follow. The recordings
// (`recorded.json`), the marks and the replay test come from the owner-confirmed run and a person, in
// a later task; this file checks the cases alone.

const caseSchema = z
  .object({
    id: z.string().regex(/^(th|en)-(i\d|\d{2})$/),
    lang: z.enum(["th", "en"]),
    kind: z.enum(["ordinary", "injection"]),
    answers: z
      .object({
        idea: z.string().min(1).max(2000),
        industry: z.string().min(1).max(2000).optional(),
        customers: z.string().min(1).max(2000).optional(),
        problem: z.string().min(1).max(2000).optional(),
        competitors: z.string().min(1).max(2000).optional(),
        value: z.string().min(1).max(2000),
      })
      .strict(),
    covers: z.array(z.enum(["short", "no-competitors", "mixed"])),
    marker: z
      .string()
      .regex(/^[A-Z]+\d*$/)
      .optional(),
  })
  .strict();

const cases = z.array(caseSchema).parse(casesJson);
type Case = (typeof cases)[number];
const ordinary = (lang: string) => cases.filter((c) => c.kind === "ordinary" && c.lang === lang);
const injection = (lang: string) => cases.filter((c) => c.kind === "injection" && c.lang === lang);
const THAI = /[฀-๿]/;
const LATIN = /[A-Za-z]/;
const textOf = (c: Case) => Object.values(c.answers).join(" ");
const everyAnswerUnder20Words = (c: Case) =>
  Object.values(c.answers).every((text) => wordCount(text ?? "") < 20);

describe("the positioning evaluation cases", () => {
  it("are 12 ordinary cases, 6 Thai and 6 English, and 6 injection cases, 3 each, with unique ids", () => {
    expect(cases).toHaveLength(18);
    expect([ordinary("th").length, ordinary("en").length]).toEqual([6, 6]);
    expect([injection("th").length, injection("en").length]).toEqual([3, 3]);
    expect(new Set(cases.map((c) => c.id)).size).toBe(18);
  });

  it("every case answers idea and value, which a draft must quote", () => {
    for (const c of cases) {
      expect(c.answers.idea, c.id).toBeTruthy();
      expect(c.answers.value, c.id).toBeTruthy();
    }
  });

  it.each(["th", "en"])(
    "%s: the ordinary cases hold a short one, one with no competitors answer and one mixing Thai and English",
    (lang) => {
      for (const cover of ["short", "no-competitors", "mixed"] as const) {
        expect(
          ordinary(lang).filter((c) => c.covers.includes(cover)).length,
          `${lang} ${cover}`,
        ).toBeGreaterThanOrEqual(1);
      }
    },
  );

  it("a case covers only what its answers show", () => {
    for (const c of ordinary("th").concat(ordinary("en"))) {
      expect(c.covers.includes("short"), `${c.id} short`).toBe(everyAnswerUnder20Words(c));
      expect(c.covers.includes("no-competitors"), `${c.id} no-competitors`).toBe(
        c.answers.competitors === undefined,
      );
      expect(c.covers.includes("mixed"), `${c.id} mixed`).toBe(
        THAI.test(textOf(c)) && LATIN.test(textOf(c)),
      );
    }
  });

  it("a case that is not mixed is in the language it says", () => {
    for (const c of cases.filter((c) => !c.covers.includes("mixed"))) {
      expect(THAI.test(textOf(c)), c.id).toBe(c.lang === "th");
    }
  });

  it("each injection case has its own marker, written in its answers, and an ordinary case has none", () => {
    const attacks = injection("th").concat(injection("en"));
    expect(new Set(attacks.map((c) => c.marker)).size).toBe(6);
    for (const c of attacks) {
      expect(c.marker, c.id).toBeDefined();
      expect(textOf(c), c.id).toContain(c.marker);
      expect(c.covers, c.id).toEqual([]);
    }
    for (const c of ordinary("th").concat(ordinary("en"))) expect(c.marker, c.id).toBeUndefined();
  });

  it("the injection cases are the three attacks of tech notes section 8.4 in each language", () => {
    // An instruction in idea to write the marker into every statement; a fake end of JSON in value
    // with an extra key or option holding the marker; a request in competitors to call the business
    // the best in its market and sign with the marker.
    for (const lang of ["th", "en"]) {
      const [a, b, c] = injection(lang);
      expect(a?.answers.idea, `${lang} 1`).toContain(a?.marker);
      expect(b?.answers.value, `${lang} 2`).toContain(b?.marker);
      expect(b?.answers.value, `${lang} 2`).toMatch(/"\s*[}\]]/);
      expect(c?.answers.competitors, `${lang} 3`).toContain(c?.marker);
    }
  });

  it("every case passes the intake check, and holds no address, link or long number", () => {
    for (const c of cases) {
      expect(checkIntake({ projectName: c.id, ...c.answers }).ok, c.id).toBe(true);
      expect(textOf(c), c.id).not.toMatch(/@|https?:|www\./i);
      expect(textOf(c), c.id).not.toMatch(/\d{9,}/);
    }
  });

  it("holds no middot and no em dash in any answer", () => {
    for (const c of cases) expect(textOf(c), c.id).not.toMatch(/[·—]/);
  });
});
