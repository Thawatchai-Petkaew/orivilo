import { describe, expect, it } from "vitest";
import { COLOR_KNOWLEDGE } from "./color-knowledge";
import { checkCorpus, freshness, knowledgeEntrySchema } from "./knowledge";

const EXPECTED_IDS = [
  "color.action-is-functional",
  "color.audit-the-category",
  "color.contrast-computed",
  "color.expressive-signature",
  "color.hue-families",
  "color.light-chroma-gamut",
  "color.premium-canvas",
  "color.roles-before-values",
  "color.semantics-separate",
  "color.warm-leans-hue",
];

describe("color knowledge", () => {
  it("entries parse and hold together", () => {
    expect(COLOR_KNOWLEDGE.map((e) => e.id).sort()).toEqual(EXPECTED_IDS);
    for (const entry of COLOR_KNOWLEDGE) {
      const round = knowledgeEntrySchema.parse(JSON.parse(JSON.stringify(entry)));
      expect(round).toEqual(entry);
      expect(entry.statement.th).toBeTruthy();
      expect(entry.statement.en).toBeTruthy();
      expect(entry.appliesTo.topics).toContain("color");
      expect(entry.appliesTo.industries).toEqual([]);
      expect(entry.status).toBe("draft");
      expect(freshness(entry, "2026-10-26")).toBe("unverified");
    }
    expect(checkCorpus(COLOR_KNOWLEDGE)).toEqual([]);
  });

  it("thresholds are hypotheses capped at 0.4", () => {
    for (const id of [
      "color.hue-families",
      "color.expressive-signature",
      "color.warm-leans-hue",
      "color.premium-canvas",
      "color.action-is-functional",
    ]) {
      const entry = COLOR_KNOWLEDGE.find((e) => e.id === id);
      expect(entry?.confidenceBasis).toBe("hypothesis");
      expect(entry?.confidence).toBeLessThanOrEqual(0.4);
    }
  });

  it("copy has no middot or em dash", () => {
    expect(JSON.stringify(COLOR_KNOWLEDGE)).not.toMatch(/[·—]/);
  });
});
