import { describe, expect, it } from "vitest";
import orv126 from "../../../../docs/specs/ORV-126/spec.md?raw";
import { PROXY_QUESTIONS } from "./questions";

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

  it("holds the eight ids: the six the intake lists, then the two of Brand personality", () => {
    expect(PROXY_QUESTIONS.map((q) => q.id)).toEqual([
      "business-core.proxy.offer",
      "business-core.proxy.why",
      "audience.proxy.best-customer",
      "audience.proxy.problem",
      "competitive-frame.proxy.instead",
      "positioning.proxy.only",
      "identity-frame.proxy.person",
      "identity-frame.proxy.never",
    ]);
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
