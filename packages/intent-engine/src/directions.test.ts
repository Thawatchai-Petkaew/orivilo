import { describe, expect, it } from "vitest";
import {
  recommendDirections,
  STARTER_KNOWLEDGE_IDS,
  STARTER_RULES,
  type CuratedProfile,
} from "./directions";
import { checkRuleSet } from "./rules";

// The two hand-made profiles of E2-2 (packages/design-system/src/profiles/source).
const profiles: CuratedProfile[] = [
  {
    id: "professional",
    decisions: {
      shape: "crisp",
      surfaceTreatment: "bordered",
      emphasis: "restrained",
      typeVoice: "single",
      motion: "quiet",
    },
  },
  {
    id: "friendly",
    decisions: {
      shape: "soft",
      surfaceTreatment: "flat",
      emphasis: "expressive",
      typeVoice: "paired",
      motion: "standard",
    },
  },
];

describe("recommendDirections", () => {
  it("recommends the closest profile and contrasts the other, with the brief's words (AC 1, 2)", () => {
    const result = recommendDirections("เป็นระเบียบ หรูหรา", { profiles });
    expect(result.method).toBe("rule-based");
    expect(result.directions.map((d) => [d.profileId, d.role])).toEqual([
      ["professional", "recommended"],
      ["friendly", "contrast"],
    ]);
    const [recommended, contrast] = result.directions;
    expect(recommended?.matches).toEqual(["shape", "motion"]);
    expect(recommended?.differs).toEqual([]);
    expect(contrast?.differs).toEqual([
      { key: "shape", wanted: "crisp", has: "soft" },
      { key: "motion", wanted: "quiet", has: "standard" },
    ]);
    expect(result.reasons).toEqual([
      {
        key: "shape",
        value: "crisp",
        source: "rule",
        rules: ["shape.structured-crisp"],
        words: ["เป็นระเบียบ"],
      },
      {
        key: "motion",
        value: "quiet",
        source: "rule",
        rules: ["motion.premium-quiet"],
        words: ["หรูหรา"],
      },
    ]);
  });

  it("offers no direction when nothing is read, and lists what is missing (AC 3)", () => {
    const result = recommendDirections("ฟ้าใส", { profiles });
    expect(result.directions).toEqual([]);
    expect(result.resolution.status).toBe("needs-input");
    expect(result.resolution.questions.length).toBeGreaterThan(0);
  });

  it("keeps a rule tie as a conflict while still offering both directions (AC 4)", () => {
    const result = recommendDirections("เป็นระเบียบ สนุก โดดเด่น", { profiles });
    expect(result.resolution.status).toBe("conflicted");
    expect(result.resolution.conflicts).toEqual([
      {
        kind: "rule-tie",
        key: "shape",
        candidates: [
          { value: "crisp", rules: ["shape.structured-crisp"] },
          { value: "soft", rules: ["shape.playful-soft"] },
        ],
      },
    ]);
    expect(result.directions.map((d) => d.profileId)).toEqual(["friendly", "professional"]);
    expect(result.reasons.find((r) => r.key === "emphasis")).toMatchObject({ words: ["โดดเด่น"] });
  });

  it("passes locks and adjustments through; a lock holds and says so (AC 5)", () => {
    const result = recommendDirections("โดดเด่น", {
      profiles,
      locked: { emphasis: "restrained" },
      adjustments: [{ set: "motion", to: "quiet", reason: "แบรนด์สุขุม" }],
    });
    expect(result.resolution.decisions.emphasis).toEqual({ value: "restrained", source: "locked" });
    expect(result.resolution.conflicts).toContainEqual({
      kind: "locked",
      key: "emphasis",
      locked: "restrained",
      proposed: "expressive",
      by: ["emphasis.expressive-signature"],
    });
    expect(result.reasons).toContainEqual({
      key: "emphasis",
      value: "restrained",
      source: "locked",
    });
    expect(result.reasons).toContainEqual({
      key: "motion",
      value: "quiet",
      source: "adjustment",
      reason: "แบรนด์สุขุม",
    });
  });

  it("is deterministic (AC 6)", () => {
    const a = recommendDirections("เป็นระเบียบ หรูหรา", { profiles });
    const b = recommendDirections("เป็นระเบียบ หรูหรา", { profiles: [...profiles].reverse() });
    expect(b.resolution.fingerprint).toBe(a.resolution.fingerprint);
    expect(b.directions.map((d) => d.profileId)).toEqual(a.directions.map((d) => d.profileId));
  });

  it("ships a starter rule set with no issue (AC 7)", () => {
    expect(checkRuleSet(STARTER_RULES, new Set(STARTER_KNOWLEDGE_IDS))).toEqual([]);
  });
});
