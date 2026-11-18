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
    expect(home.size).toBeGreaterThanOrEqual(6);
  });

  it("holds the six ids, in the order the intake lists them", () => {
    expect(PROXY_QUESTIONS.map((q) => q.id)).toEqual([
      "business-core.proxy.offer",
      "business-core.proxy.why",
      "audience.proxy.best-customer",
      "audience.proxy.problem",
      "competitive-frame.proxy.instead",
      "positioning.proxy.only",
    ]);
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
