import { describe, expect, it } from "vitest";
import {
  RESOLVER_VERSION,
  resolveInputSchema,
  resolveProfile,
  type ResolveInput,
} from "./resolver";
import type { DecisionRule } from "./rules";

const rule = (
  patch: Partial<DecisionRule> & Pick<DecisionRule, "id" | "when" | "then">,
): DecisionRule => ({
  schemaVersion: "1.0",
  version: 1,
  topic: "shape",
  priority: 50,
  because: ["brand-ci-method.axis-map"],
  ...patch,
});

// The brand method's axis map (brand-ci-method.md §3) in rule form.
const rules: DecisionRule[] = [
  rule({
    id: "shape.structured-crisp",
    when: { axis: "structured", atLeast: 70 },
    then: [{ set: "shape", to: "crisp" }],
  }),
  rule({
    id: "shape.playful-soft",
    when: { axis: "playful", atLeast: 60 },
    then: [{ set: "shape", to: "soft" }],
  }),
  rule({
    id: "emphasis.expressive-signature",
    when: { axis: "expressive", atLeast: 60 },
    then: [
      { set: "emphasis", to: "expressive" },
      { set: "typeVoice", to: "paired" },
    ],
  }),
  rule({
    id: "motion.premium-quiet",
    when: { axis: "premium", atLeast: 70 },
    then: [{ set: "motion", to: "quiet" }],
  }),
];

// The two hand-made profiles of E2-2 (packages/design-system/src/profiles/source).
const professional = {
  id: "professional",
  decisions: {
    shape: "crisp",
    surfaceTreatment: "bordered",
    emphasis: "restrained",
    typeVoice: "single",
    motion: "quiet",
  },
} as const;
const friendly = {
  id: "friendly",
  decisions: {
    shape: "soft",
    surfaceTreatment: "flat",
    emphasis: "expressive",
    typeVoice: "paired",
    motion: "standard",
  },
} as const;

const orivilo: ResolveInput = {
  catalogVersion: "catalog-1",
  facts: {
    personality: { playful: 65, expressive: 70, structured: 80, warm: 70, premium: 65 },
    industry: "design-tools",
    audiences: ["founders"],
    avoid: [],
  },
  locked: {},
  adjustments: [],
  rules,
  knowledgeIds: ["brand-ci-method.axis-map"],
  profiles: [professional, friendly],
};

describe("resolveProfile", () => {
  it("shows ORIVILO's shape tie, decides the rest and picks the closest profile", () => {
    const result = resolveProfile(orivilo);
    expect(result.status).toBe("conflicted");
    expect(result.resolverVersion).toBe(RESOLVER_VERSION);
    expect(result.conflicts).toEqual([
      {
        kind: "rule-tie",
        key: "shape",
        candidates: [
          { value: "crisp", rules: ["shape.structured-crisp"] },
          { value: "soft", rules: ["shape.playful-soft"] },
        ],
      },
    ]);
    expect(result.decisions).toEqual({
      emphasis: {
        value: "expressive",
        source: "rule",
        rules: ["emphasis.expressive-signature"],
        because: ["brand-ci-method.axis-map"],
      },
      typeVoice: {
        value: "paired",
        source: "rule",
        rules: ["emphasis.expressive-signature"],
        because: ["brand-ci-method.axis-map"],
      },
    });
    expect(result.open).toEqual(["shape", "surfaceTreatment", "motion"]);
    expect(result.profileId).toBe("friendly");
    expect(result.unsupported).toEqual([]);
  });

  it("lets the expert layer settle the tie, and keeps what it set aside", () => {
    const result = resolveProfile({
      ...orivilo,
      adjustments: [
        { set: "shape", to: "soft", reason: "Owner prefers the open loop's softness" },
        { set: "surfaceTreatment", to: "flat", reason: "Generous space, no boxes" },
        { set: "motion", to: "standard", reason: "Product UI, not a showcase" },
      ],
    });
    expect(result.status).toBe("resolved");
    expect(result.decisions.shape).toEqual({
      value: "soft",
      source: "adjustment",
      reason: "Owner prefers the open loop's softness",
    });
    expect(result.overridden).toEqual([{ key: "shape", value: "crisp", by: ["adjustment"] }]);
    expect(result.conflicts).toEqual([]);
    expect(result.profileId).toBe("friendly");
    expect(result.unsupported).toEqual([]);
  });

  it("holds a locked field and reports every proposal against it", () => {
    const result = resolveProfile({
      ...orivilo,
      locked: { emphasis: "restrained" },
      adjustments: [{ set: "emphasis", to: "expressive", reason: "Try the bolder accent" }],
    });
    expect(result.decisions.emphasis).toEqual({ value: "restrained", source: "locked" });
    expect(result.conflicts.filter((c) => c.kind === "locked")).toEqual([
      {
        kind: "locked",
        key: "emphasis",
        locked: "restrained",
        proposed: "expressive",
        by: ["adjustment"],
      },
      {
        kind: "locked",
        key: "emphasis",
        locked: "restrained",
        proposed: "expressive",
        by: ["emphasis.expressive-signature"],
      },
    ]);
    expect(result.status).toBe("conflicted");
  });

  it("raises no conflict when a proposal agrees with the lock", () => {
    const result = resolveProfile({
      ...orivilo,
      locked: { emphasis: "expressive", shape: "soft" },
    });
    expect(result.conflicts.filter((c) => c.key === "emphasis")).toEqual([]);
    expect(result.conflicts).toEqual([
      {
        kind: "locked",
        key: "shape",
        locked: "soft",
        proposed: "crisp",
        by: ["shape.structured-crisp"],
      },
    ]);
  });

  it("asks for what the brief is missing", () => {
    const result = resolveProfile({
      ...orivilo,
      facts: { personality: { playful: 30 }, industry: null, audiences: [], avoid: [] },
    });
    expect(result.status).toBe("needs-input");
    expect(result.questions).toEqual([
      "personality.expressive",
      "personality.premium",
      "personality.structured",
    ]);
    expect(result.decisions).toEqual({});
    expect(result.profileId).toBeNull();
  });

  it("refuses to resolve on a rule that rests on unknown knowledge", () => {
    const result = resolveProfile({ ...orivilo, knowledgeIds: [] });
    expect(result.status).toBe("invalid");
    expect(result.issues.map((issue) => issue.problem)).toEqual([
      "unknown-knowledge",
      "unknown-knowledge",
      "unknown-knowledge",
      "unknown-knowledge",
    ]);
  });

  it("names what the chosen profile cannot express", () => {
    const result = resolveProfile({
      ...orivilo,
      adjustments: [{ set: "shape", to: "crisp", reason: "Strict grid" }],
    });
    expect(result.profileId).toBe("friendly");
    expect(result.unsupported).toEqual([{ key: "shape", wanted: "crisp", profile: "soft" }]);
  });

  it("lists a profile tie instead of hiding it", () => {
    const result = resolveProfile({
      ...orivilo,
      rules: [],
      adjustments: [{ set: "shape", to: "rounded", reason: "Middle ground" }],
    });
    expect(result.profileId).toBe("friendly");
    expect(result.profileTies).toEqual(["friendly", "professional"]);
  });

  it("gives an equal result and fingerprint whatever the input order", () => {
    const a = resolveProfile(orivilo);
    const b = resolveProfile({
      ...orivilo,
      rules: [...rules].reverse(),
      profiles: [friendly, professional],
    });
    expect(b).toEqual(a);
    expect(b.fingerprint).toMatch(/^[0-9a-f]{8}$/);
  });

  it("changes the fingerprint when the design result or the catalog changes", () => {
    const base = resolveProfile(orivilo).fingerprint;
    expect(resolveProfile({ ...orivilo, catalogVersion: "catalog-2" }).fingerprint).not.toBe(base);
    expect(resolveProfile({ ...orivilo, locked: { motion: "quiet" } }).fingerprint).not.toBe(base);
  });
});

describe("resolveInputSchema", () => {
  const fails = (patch: Record<string, unknown>) => {
    const result = resolveInputSchema.safeParse({ ...orivilo, ...patch });
    return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
  };

  it("accepts the fixture input after a JSON round trip", () => {
    expect(resolveInputSchema.parse(JSON.parse(JSON.stringify(orivilo)))).toEqual(orivilo);
  });

  it("rejects locks and adjustments outside the vocabulary", () => {
    expect(fails({ locked: { shape: "blobby" } })).toEqual(["locked.shape"]);
    expect(fails({ locked: { mood: "calm" } })).toEqual(["locked"]);
    expect(fails({ adjustments: [{ set: "shape", to: "soft" }] })).toEqual([
      "adjustments.0.reason",
    ]);
    expect(
      fails({
        adjustments: [
          { set: "shape", to: "soft", reason: "a" },
          { set: "shape", to: "crisp", reason: "b" },
        ],
      }),
    ).toEqual(["adjustments"]);
  });

  it("needs complete, uniquely named profiles", () => {
    expect(fails({ profiles: [] })).toEqual(["profiles"]);
    expect(fails({ profiles: [friendly, { ...friendly }] })).toEqual(["profiles"]);
    expect(
      fails({ profiles: [{ id: "half", decisions: { shape: "soft" } }] }).every((p) =>
        p.startsWith("profiles.0.decisions"),
      ),
    ).toBe(true);
  });
});
