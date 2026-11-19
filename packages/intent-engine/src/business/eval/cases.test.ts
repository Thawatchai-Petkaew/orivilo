import { describe, expect, it } from "vitest";
import { z } from "zod";
import { wordCount } from "../../page-text";
import { checkIntake } from "../intake";
import { BUSINESS_ANSWER_KEYS, BUSINESS_READ_FIELDS } from "../reading";
import casesJson from "./cases.json";

// ORV-281 tech notes section 8.5: the evaluation cases, written by hand. Fictional businesses, no
// personal data. The recordings (`recorded.json`) and the marks come from the owner-confirmed run
// and a person, in a later task; this file checks the cases alone.

const caseSchema = z
  .object({
    id: z.string().regex(/^(th|en)-i?\d{1,2}$/),
    lang: z.enum(["th", "en"]),
    kind: z.enum(["ordinary", "injection"]),
    answers: z
      .object({
        idea: z.string().min(1).max(2000),
        industry: z.string().min(1).max(2000).optional(),
        customers: z.string().min(1).max(2000).optional(),
        problem: z.string().min(1).max(2000).optional(),
        competitors: z.string().min(1).max(2000).optional(),
        value: z.string().min(1).max(2000).optional(),
      })
      .strict(),
    covers: z.array(z.enum(BUSINESS_READ_FIELDS)),
    marker: z
      .string()
      .regex(/^[A-Z]+\d*$/)
      .optional(),
  })
  .strict();

const cases = z.array(caseSchema).parse(casesJson);
const ordinary = (lang: string) => cases.filter((c) => c.kind === "ordinary" && c.lang === lang);
const injection = (lang: string) => cases.filter((c) => c.kind === "injection" && c.lang === lang);
const THAI = /[฀-๿]/;
const wordsOf = (c: (typeof cases)[number]) =>
  Object.values(c.answers).reduce((n, text) => n + wordCount(text ?? ""), 0);

describe("the evaluation cases", () => {
  it("are 16 ordinary cases, 8 Thai and 8 English, and 6 injection cases, 3 each", () => {
    expect(cases).toHaveLength(22);
    expect([ordinary("th").length, ordinary("en").length]).toEqual([8, 8]);
    expect([injection("th").length, injection("en").length]).toEqual([3, 3]);
    expect(new Set(cases.map((c) => c.id)).size).toBe(22);
  });

  it.each(["th", "en"])(
    "%s: each of the seven read fields is covered by at least 3 ordinary cases",
    (lang) => {
      for (const field of BUSINESS_READ_FIELDS) {
        const n = ordinary(lang).filter((c) => c.covers.includes(field)).length;
        expect(n, `${lang} ${field}`).toBeGreaterThanOrEqual(3);
      }
    },
  );

  it.each(["th", "en"])("%s: short answers are among the ordinary cases", (lang) => {
    expect(ordinary(lang).filter((c) => wordsOf(c) < 20).length).toBeGreaterThanOrEqual(2);
  });

  it("each case is in the language it says, and every ordinary case covers a field it can answer", () => {
    for (const c of cases) {
      const text = Object.values(c.answers).join(" ");
      expect(THAI.test(text), c.id).toBe(c.lang === "th");
    }
    for (const c of ordinary("th").concat(ordinary("en"))) {
      expect(c.covers.length, c.id).toBeGreaterThan(0);
      expect(c.marker, c.id).toBeUndefined();
    }
  });

  it("covers only what the answers can give: a field with no answer behind it is not covered", () => {
    const needs: Record<string, (typeof BUSINESS_ANSWER_KEYS)[number]> = {
      "audience.problem": "problem",
      "competitive-frame.category": "industry",
      "competitive-frame.alternatives": "competitors",
    };
    for (const c of ordinary("th").concat(ordinary("en"))) {
      for (const field of c.covers) {
        const key = needs[field];
        if (key !== undefined) expect(c.answers[key], `${c.id} ${field}`).toBeDefined();
      }
    }
  });

  it("each injection case has its own marker, written in its answers as the thing it asks for", () => {
    const markers = injection("th")
      .concat(injection("en"))
      .map((c) => c.marker);
    expect(new Set(markers).size).toBe(6);
    for (const c of injection("th").concat(injection("en"))) {
      expect(c.marker, c.id).toBeDefined();
      expect(Object.values(c.answers).join(" ")).toContain(c.marker);
    }
  });

  it("every case passes the intake check, and holds no address, link or long number", () => {
    for (const c of cases) {
      expect(checkIntake({ projectName: c.id, ...c.answers }).ok, c.id).toBe(true);
      const text = Object.values(c.answers).join(" ");
      expect(text, c.id).not.toMatch(/@|https?:|www\./i);
      expect(text, c.id).not.toMatch(/\d{9,}/);
    }
  });
});
