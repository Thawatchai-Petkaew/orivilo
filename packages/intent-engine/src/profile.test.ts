import { describe, expect, it } from "vitest";
import { designProfileSchema, type DesignProfile } from "./profile";

// The example from the handoff §13.
const handoffExample: DesignProfile = {
  schemaVersion: "1.0",
  profileId: "travel-welcoming",
  profileVersion: 1,
  resolverVersion: "rules-1",
  catalogVersion: "catalog-1",
  status: "draft",
  brand: {
    id: "demo-brand",
    version: 1,
    paletteId: "approved-rose",
    typographyId: "approved-thai-latin",
    lockedFields: ["logo", "identityColor"],
    allowedTreatments: ["flat", "subtle-depth"],
  },
  context: {
    productType: "stay-marketplace",
    surface: "search-results",
    platform: "responsive-web",
    inputMethods: ["touch", "keyboard", "pointer"],
    locales: ["th-TH", "en-US"],
  },
  sourceIntent: {
    desired: ["welcoming", "calm", "discovery"],
    avoided: ["constant-promotion"],
    rationale: "ให้สถานที่เด่นและช่วยเปรียบเทียบได้",
  },
  decisions: {
    shape: "soft",
    density: "comfortable",
    surfaceTreatment: "neutral",
    imagery: "place-first",
    brandExpression: "selective",
    motion: "functional",
  },
  semanticTokenSetId: "travel-welcoming-v1",
  supportedModes: ["light", "dark"],
  patternIds: ["stay-search", "stay-list-map"],
  graphicRecipeIds: ["place-photography"],
  contentRuleSetId: "clear-travel-copy",
  adjustments: [],
  conflicts: [],
  validation: { status: "not-run", checks: [] },
  approval: null,
};

describe("designProfileSchema", () => {
  it("accepts the handoff example", () => {
    expect(designProfileSchema.parse(handoffExample)).toEqual(handoffExample);
  });

  it("round-trips through JSON unchanged", () => {
    const parsed = designProfileSchema.parse(JSON.parse(JSON.stringify(handoffExample)));
    expect(parsed).toEqual(handoffExample);
  });

  it("rejects an unknown schema version", () => {
    expect(designProfileSchema.safeParse({ ...handoffExample, schemaVersion: "2.0" }).success).toBe(
      false,
    );
  });

  it("rejects an approved profile without approval or passing validation", () => {
    const result = designProfileSchema.safeParse({ ...handoffExample, status: "approved" });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["approval", "validation.status"]));
  });

  it("accepts an approved profile with approval and passing validation", () => {
    const approved = {
      ...handoffExample,
      status: "approved",
      validation: { status: "passed", checks: [] },
      approval: { approvedBy: "user-1", approvedAt: "2026-10-21T00:00:00Z" },
    };
    expect(designProfileSchema.safeParse(approved).success).toBe(true);
  });

  it("rejects an empty or duplicated mode list", () => {
    expect(designProfileSchema.safeParse({ ...handoffExample, supportedModes: [] }).success).toBe(
      false,
    );
    expect(
      designProfileSchema.safeParse({ ...handoffExample, supportedModes: ["light", "light"] })
        .success,
    ).toBe(false);
  });
});
