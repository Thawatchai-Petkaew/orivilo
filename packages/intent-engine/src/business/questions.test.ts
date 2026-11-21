import { describe, expect, it } from "vitest";
import orv126 from "../../../../docs/specs/ORV-126/spec.md?raw";
import { PROXY_QUESTIONS, START_QUESTIONS } from "./questions";

// ORV-281 tech notes section 13, T4. ORV-126 "Missing strategy" is the home of the copy.

const LINE = /^- `([a-z-]+\.proxy\.[a-z-]+)`: en "([^"]*)"; th "([^"]*)"$/gm;
const home = new Map<string, { en: string; th: string }>();
for (const m of orv126.matchAll(LINE)) {
  home.set(m[1] ?? "", { en: m[2] ?? "", th: m[3] ?? "" });
}

describe("copy is ORV-126's", () => {
  it("reads the proxy question lines of ORV-126", () => {
    expect(home.size).toBeGreaterThanOrEqual(8);
  });

  it("holds the nine ids: the six the intake lists, the two of Brand personality, then the core idea's", () => {
    expect(PROXY_QUESTIONS.map((q) => q.id)).toEqual([
      "business-core.proxy.offer",
      "business-core.proxy.why",
      "audience.proxy.best-customer",
      "audience.proxy.problem",
      "competitive-frame.proxy.instead",
      "positioning.proxy.only",
      "identity-frame.proxy.person",
      "identity-frame.proxy.never",
      "core-idea.proxy.remember",
    ]);
  });

  // ORV-291 tech notes section 13, T42; spec row 37: the core idea question is ORV-126's words.
  it("core-idea.proxy.remember is ORV-126 'Missing strategy' word for word", () => {
    const expected = {
      en: "After someone meets your brand, what one thing should they remember?",
      th: "หลังจากได้รู้จักแบรนด์ของคุณ คุณอยากให้คนจำอะไรได้หนึ่งอย่าง",
      key: "business.question.remember",
    } as const;
    const q = PROXY_QUESTIONS.find((p) => p.id === "core-idea.proxy.remember");
    expect(q).toMatchObject(expected);
    expect(home.get("core-idea.proxy.remember")).toEqual({ en: expected.en, th: expected.th });
  });

  // ORV-291 tech notes section 13, T24; spec row 13: the two personality questions are ORV-126's words.
  it("identity-frame.proxy.person and .never are ORV-126 'Missing strategy' word for word", () => {
    const wording = {
      "identity-frame.proxy.person": {
        en: "If your brand were a person, which three words would people use to describe them?",
        th: "ถ้าแบรนด์ของคุณเป็นคนคนหนึ่ง คนอื่นจะใช้คำสามคำใดบรรยายเขา",
        key: "business.question.person",
      },
      "identity-frame.proxy.never": {
        en: "How should your brand never feel?",
        th: "แบรนด์ของคุณไม่ควรให้ความรู้สึกแบบไหน",
        key: "business.question.never",
      },
    } as const;
    for (const [id, expected] of Object.entries(wording)) {
      const q = PROXY_QUESTIONS.find((p) => p.id === id);
      expect(q, id).toMatchObject(expected);
      expect(home.get(id), id).toEqual({ en: expected.en, th: expected.th });
    }
  });

  it.each(PROXY_QUESTIONS.map((q) => [q.id, q] as const))(
    "%s equals its Thai and English line in ORV-126",
    (id, q) => {
      const line = home.get(id);
      expect(line).toBeDefined();
      expect(q.en).toBe(line?.en);
      expect(q.th).toBe(line?.th);
    },
  );

  it("has no middot and no em dash, and a catalog key each", () => {
    for (const q of PROXY_QUESTIONS) {
      expect(`${q.en}${q.th}`).not.toMatch(/[·—]/);
      expect(q.key).toMatch(/^business\.question\.[a-zA-Z]+$/);
    }
  });
});

// ORV-291 tech notes section 13, T31; spec row 24. ORV-126 "The start question" is the home of the copy.
describe("start question", () => {
  const START = /`situation\.sub-brands`[^:\n]*: en "([^"]*)"; th "([^"]*)"/;
  const line = orv126.match(START);

  it("finds the line of ORV-126", () => {
    expect(line).not.toBeNull();
  });

  it("holds one question, situation.sub-brands, and it stays out of the proxy questions", () => {
    expect(START_QUESTIONS.map((q) => q.id)).toEqual(["situation.sub-brands"]);
    expect(PROXY_QUESTIONS.map((q) => q.id)).not.toContain("situation.sub-brands");
    expect(PROXY_QUESTIONS).toHaveLength(9);
  });

  it("situation.sub-brands equals ORV-126 'The start question' word for word", () => {
    const [q] = START_QUESTIONS;
    expect(q?.en).toBe("Does this brand sit above or below other brands?");
    expect(q?.th).toBe("แบรนด์นี้อยู่เหนือหรืออยู่ใต้แบรนด์อื่นหรือไม่");
    expect(q?.key).toBe("business.question.subBrands");
    expect(q?.en).toBe(line?.[1]);
    expect(q?.th).toBe(line?.[2]);
  });

  it("has no middot and no em dash", () => {
    for (const q of START_QUESTIONS) expect(`${q.en}${q.th}`).not.toMatch(/[·—]/);
  });
});
