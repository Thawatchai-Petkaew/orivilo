import auditSource from "./color-audit.ts?raw";
import fixturesSource from "./color-fixtures.ts?raw";
import knowledgeSource from "./color-knowledge.ts?raw";
import rulesSource from "./color-rules.ts?raw";
import { describe, expect, it } from "vitest";
import { classifyHex, type Lineup } from "./color-audit";
import { STAND_IN_LINEUP } from "./color-fixtures";
import { COLOR_KNOWLEDGE_IDS } from "./color-knowledge";
import { COLOR_RULES, colorInputSchema, decideColor, type ColorInput } from "./color-rules";
import { interpretationSchema } from "./interpreter";
import { resolveProfile } from "./resolver";
import {
  COLOR_DECISIONS,
  DECISION_VOCABULARY,
  checkRuleSet,
  decisionRuleSchema,
  type BriefFacts,
  type DecisionRule,
} from "./rules";

const ORIVILO: BriefFacts = {
  personality: { playful: 65, expressive: 70, structured: 80, warm: 70, premium: 65 },
  industry: null,
  audiences: [],
  avoid: [],
};
const vector = (personality: BriefFacts["personality"]): BriefFacts => ({
  ...ORIVILO,
  personality,
});
const orivilo = (patch: Partial<ColorInput> = {}): ColorInput => ({
  facts: ORIVILO,
  lineup: STAND_IN_LINEUP,
  ...patch,
});
const withLime: Lineup = [
  ...STAND_IN_LINEUP,
  { name: "lime-a", hex: "#C6F432" },
  { name: "lime-b", hex: "#B5E61D" },
];
const everyCandidateCrowded: Lineup = [
  { name: "lime-a", hex: "#C6F432" },
  { name: "lime-b", hex: "#B5E61D" },
  { name: "cyan-a", hex: "#00C8E0" },
  { name: "cyan-b", hex: "#10D0E8" },
  { name: "magenta-a", hex: "#D020B0" },
  { name: "magenta-b", hex: "#E030C0" },
  { name: "teal-a", hex: "#00C8A0" },
  { name: "teal-b", hex: "#10D0A8" },
];

const base = { schemaVersion: "1.0", version: 1, topic: "color", priority: 50 } as const;
const fixtureRule = (patch: Partial<DecisionRule> = {}): DecisionRule => ({
  ...base,
  id: "color.fixture-cyan",
  priority: 80,
  when: { axis: "expressive", atLeast: 55 },
  then: [{ set: "signature", to: "cyan" }],
  because: ["color.audit-the-category"],
  ...patch,
});

const decision = (
  result: ReturnType<typeof decideColor>,
  key: "signature" | "neutral" | "canvas",
) => result.evaluation.decisions[key];

describe("decideColor", () => {
  it("ORIVILO decides lime, near, soft", () => {
    const result = decideColor(orivilo());
    expect(result.method).toBe("rule-based");
    expect(result.version).toBe("color-1");
    expect(result.status).toBe("resolved");
    expect(result.open).toEqual([]);
    expect(result.questions).toEqual([]);
    expect(decision(result, "signature")).toEqual({
      value: "lime",
      priority: 80,
      rules: ["color.signature.lime-warm"],
      because: [
        "color.audit-the-category",
        "color.expressive-signature",
        "color.light-chroma-gamut",
        "color.semantics-separate",
        "color.warm-leans-hue",
      ],
    });
    expect(decision(result, "neutral")).toMatchObject({
      value: "near",
      rules: ["color.neutral.near"],
      because: ["color.roles-before-values", "color.warm-leans-hue"],
    });
    expect(decision(result, "canvas")).toMatchObject({
      value: "soft",
      rules: ["color.canvas.soft"],
      because: ["color.premium-canvas", "color.roles-before-values"],
    });
    // The fallback sits below the winner and is shown, not hidden.
    expect(result.evaluation.overridden).toEqual([
      {
        key: "signature",
        value: "cyan",
        rule: "color.signature.cyan-warm-fallback",
        by: ["color.signature.lime-warm"],
      },
    ]);
  });

  it("a crowded lime moves the signature", () => {
    const result = decideColor(orivilo({ lineup: withLime }));
    expect(decision(result, "signature")).toMatchObject({
      value: "cyan",
      priority: 70,
      rules: ["color.signature.cyan-warm-fallback"],
    });
    expect(result.evaluation.fired).not.toContain("color.signature.lime-warm");
  });

  it("personality moves signature, neutrals and canvas", () => {
    const run = (patch: BriefFacts["personality"]) =>
      decideColor(orivilo({ facts: vector({ ...ORIVILO.personality, ...patch }) }));
    expect(decision(run({ expressive: 30, warm: 30 }), "signature")?.value).toBe("teal");
    expect(decision(run({ expressive: 30, warm: 80 }), "signature")?.value).toBe("magenta");
    expect(decision(run({ warm: 20 }), "neutral")?.value).toBe("cool");
    expect(decision(run({ warm: 80 }), "neutral")?.value).toBe("warm");
    expect(decision(run({ premium: 50 }), "canvas")?.value).toBe("bright");
  });

  it("neutral, canvas and signature bands switch at their edges", () => {
    const at = (personality: BriefFacts["personality"]) =>
      decideColor(orivilo({ facts: vector({ ...ORIVILO.personality, ...personality }) }));
    expect(decision(at({ warm: 25 }), "neutral")?.value).toBe("cool");
    expect(decision(at({ warm: 26 }), "neutral")?.value).toBe("near");
    expect(decision(at({ warm: 74 }), "neutral")?.value).toBe("near");
    expect(decision(at({ warm: 75 }), "neutral")?.value).toBe("warm");
    expect(decision(at({ premium: 60 }), "canvas")?.value).toBe("soft");
    expect(decision(at({ premium: 59 }), "canvas")?.value).toBe("bright");
    expect(decision(at({ expressive: 55 }), "signature")?.value).toBe("lime");
    expect(decision(at({ expressive: 54 }), "signature")?.value).toBe("magenta");
    expect(decision(at({ warm: 49 }), "signature")?.value).toBe("cyan");
    expect(decision(at({ warm: 50 }), "signature")?.value).toBe("lime");
  });

  it("every candidate crowded leaves the signature open", () => {
    const result = decideColor(orivilo({ lineup: everyCandidateCrowded }));
    expect(result.audit?.crowded).toEqual(["cyan", "lime", "magenta", "teal"]);
    expect(decision(result, "signature")).toBeUndefined();
    expect(result.evaluation.fired.filter((id) => id.startsWith("color.signature."))).toEqual([]);
    expect(result.open).toEqual(["signature"]);
    expect(result.status).toBe("needs-input");
    expect(decision(result, "neutral")?.value).toBe("near");
    expect(decision(result, "canvas")?.value).toBe("soft");
  });

  it("a missing input becomes a question", () => {
    const noLineup = decideColor(orivilo({ lineup: null }));
    expect(noLineup.audit).toBeNull();
    expect(noLineup.questions).toContain("lineup");
    expect(noLineup.status).toBe("needs-input");
    expect(noLineup.open).toEqual(["signature"]);
    // The rules that apply to a warm, expressive brand wait for the lineup; the others are
    // already false on the personality alone.
    expect(
      noLineup.evaluation.undecided
        .filter((u) => u.rule.startsWith("color.signature."))
        .map((u) => [u.rule, u.missing]),
    ).toEqual([
      ["color.signature.cyan-warm-fallback", ["lineup"]],
      ["color.signature.lime-warm", ["lineup"]],
    ]);
    expect(decision(noLineup, "neutral")?.value).toBe("near");
    expect(decision(noLineup, "canvas")?.value).toBe("soft");

    const rest = { ...ORIVILO.personality };
    delete rest.expressive;
    const noAxis = decideColor(orivilo({ facts: vector(rest) }));
    expect(noAxis.questions).toContain("personality.expressive");
    expect(noAxis.questions).not.toContain("lineup");
    expect(decision(noAxis, "signature")).toBeUndefined();
    expect(noAxis.open).toEqual(["signature"]);
  });

  it("a tie is a conflict", () => {
    const result = decideColor(orivilo({ rules: [...COLOR_RULES, fixtureRule()] }));
    expect(result.status).toBe("conflicted");
    expect(result.evaluation.conflicts).toEqual([
      {
        key: "signature",
        priority: 80,
        candidates: [
          { value: "cyan", rules: ["color.fixture-cyan"] },
          { value: "lime", rules: ["color.signature.lime-warm"] },
        ],
      },
    ]);
    expect(decision(result, "signature")).toBeUndefined();
  });

  it("unknown knowledge makes the result invalid", () => {
    const rules = [
      ...COLOR_RULES,
      fixtureRule({ id: "color.fixture-bad", because: ["color.gone"] }),
    ];
    const result = decideColor(orivilo({ rules }));
    expect(result.status).toBe("invalid");
    expect(result.issues).toEqual([
      expect.objectContaining({ rule: "color.fixture-bad", problem: "unknown-knowledge" }),
    ]);
    expect(result.issues[0]?.detail).toContain("color.gone");
    expect(result.evaluation.decisions).toEqual({});
  });

  it("same input, same output", () => {
    const cases: ColorInput[] = [
      orivilo(),
      orivilo({ lineup: withLime }),
      orivilo({ facts: vector({ ...ORIVILO.personality, expressive: 30, warm: 30 }) }),
      orivilo({ lineup: everyCandidateCrowded }),
      orivilo({ lineup: null }),
      orivilo({ rules: [...COLOR_RULES, fixtureRule()] }),
    ];
    for (const input of cases) {
      const rules = input.rules ?? COLOR_RULES;
      const first = decideColor(input);
      const shuffled = decideColor({
        ...input,
        rules: [...rules].reverse(),
        lineup: input.lineup === null ? null : [...input.lineup].reverse(),
      });
      expect(shuffled).toEqual(first);
      expect(shuffled.fingerprint).toBe(first.fingerprint);
      expect(decideColor(input).fingerprint).toBe(first.fingerprint);
    }
    // A different input gives a different fingerprint.
    expect(decideColor(orivilo({ lineup: withLime })).fingerprint).not.toBe(
      decideColor(orivilo()).fingerprint,
    );
  });
});

describe("existing contracts unchanged", () => {
  it("existing contracts unchanged", () => {
    expect(DECISION_VOCABULARY).toEqual({
      shape: ["crisp", "rounded", "soft"],
      surfaceTreatment: ["flat", "bordered"],
      emphasis: ["restrained", "expressive"],
      typeVoice: ["single", "paired"],
      motion: ["quiet", "standard"],
    });
  });

  it("crowded only comes from the audit", () => {
    expect(
      colorInputSchema.safeParse({ facts: { ...ORIVILO, crowded: ["lime"] }, lineup: null })
        .success,
    ).toBe(false);
    const parsed = interpretationSchema.safeParse({
      method: "rule-based",
      adapter: { id: "rules", version: "1" },
      facts: { ...ORIVILO, crowded: ["lime"] },
      findings: [],
      uncertain: [],
      missing: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rule-based, no model", () => {
    for (const source of [auditSource, knowledgeSource, rulesSource, fixturesSource]) {
      const imports = source
        .split("\n")
        .filter((line) => /^\s*(import|export)\b.*from\b/.test(line));
      expect(imports.join("\n")).not.toMatch(/llm-interpreter|openrouter|design-system/);
      expect(source).not.toMatch(/Date\.now|new Date|Math\.random|fetch\(/);
    }
    expect(decideColor(orivilo()).method).toBe("rule-based");
  });

  it("the stand-in lineup classifies as the spec says", () => {
    expect(STAND_IN_LINEUP.map((e) => classifyHex(e.hex))).toEqual([
      "violet",
      "violet",
      "violet",
      "ink",
      "ink",
      "orange",
      "orange",
    ]);
  });
});

describe("color rules", () => {
  it("rules parse and rest on known knowledge", () => {
    for (const rule of COLOR_RULES) {
      expect(decisionRuleSchema.parse(rule)).toEqual(rule);
      expect(rule.topic).toBe("color");
      expect(rule.because.length).toBeGreaterThan(0);
      expect(JSON.stringify(rule.when)).not.toMatch(/"industry"|"audience"/);
    }
    expect(checkRuleSet(COLOR_RULES, new Set(COLOR_KNOWLEDGE_IDS), "color")).toEqual([]);
  });
});

describe("scopes", () => {
  const pathsOf = (rule: unknown) => {
    const parsed = decisionRuleSchema.safeParse(rule);
    return parsed.success ? null : parsed.error.issues.map((i) => i.path.join("."));
  };

  it("the two vocabularies are disjoint and small", () => {
    const profileKeys = Object.keys(DECISION_VOCABULARY);
    const colorKeys = Object.keys(COLOR_DECISIONS);
    expect(colorKeys.filter((key) => profileKeys.includes(key))).toEqual([]);
    expect(colorKeys.length).toBeLessThanOrEqual(8);
    for (const values of Object.values(COLOR_DECISIONS)) {
      expect(values.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("a rule cannot mix scopes", () => {
    const mixed = fixtureRule({
      id: "color.mixed",
      then: [
        { set: "emphasis", to: "expressive" },
        { set: "signature", to: "cyan" },
      ],
    });
    expect(pathsOf(mixed)).toEqual(["then"]);
    expect(pathsOf(fixtureRule({ id: "type.signature", topic: "typography" }))).toEqual(["topic"]);
    const starter = fixtureRule({
      id: "emphasis.expressive-signature",
      then: [
        { set: "emphasis", to: "expressive" },
        { set: "typeVoice", to: "paired" },
      ],
    });
    expect(decisionRuleSchema.parse(starter)).toEqual(starter);
  });

  it("crowded only in color rules", () => {
    const crowded = { crowded: "lime" } as const;
    const profileRule = (when: DecisionRule["when"]) =>
      fixtureRule({ id: "emphasis.crowded", when, then: [{ set: "emphasis", to: "restrained" }] });
    expect(pathsOf(profileRule(crowded))).toEqual(["when"]);
    expect(pathsOf(profileRule({ not: crowded }))).toEqual(["when.not"]);
    expect(pathsOf(profileRule({ all: [{ always: true }, crowded] }))).toEqual(["when.all.1"]);
    expect(pathsOf(profileRule({ any: [crowded] }))).toEqual(["when.any.0"]);
    expect(pathsOf(fixtureRule({ when: crowded }))).toBeNull();
    // Only the ten chromatic families can be named.
    expect(pathsOf({ ...fixtureRule(), when: { crowded: "ink" } })).not.toBeNull();
  });

  it("a rule of the other scope makes the result invalid", () => {
    const near = COLOR_RULES.find((r) => r.id === "color.neutral.near") as DecisionRule;
    const profileInColor: DecisionRule = {
      ...near,
      id: "emphasis.fixture-profile",
      then: [{ set: "emphasis", to: "restrained" }],
    };
    const colored = decideColor(orivilo({ rules: [...COLOR_RULES, profileInColor] }));
    expect(colored.status).toBe("invalid");
    expect(colored.issues).toEqual([
      expect.objectContaining({ rule: "emphasis.fixture-profile", problem: "wrong-scope" }),
    ]);
    expect(colored.evaluation.decisions).toEqual({});

    const canvas = COLOR_RULES.find((r) => r.id === "color.canvas.soft") as DecisionRule;
    const resolved = resolveProfile({
      catalogVersion: "test",
      facts: ORIVILO,
      locked: {},
      adjustments: [],
      rules: [canvas],
      knowledgeIds: [...COLOR_KNOWLEDGE_IDS],
      profiles: [
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
      ],
    });
    expect(resolved.status).toBe("invalid");
    expect(resolved.issues).toEqual([
      expect.objectContaining({ rule: "color.canvas.soft", problem: "wrong-scope" }),
    ]);

    // Without a scope argument the check is what it was.
    expect(checkRuleSet([canvas, profileInColor], new Set(COLOR_KNOWLEDGE_IDS))).toEqual([]);
  });
});
