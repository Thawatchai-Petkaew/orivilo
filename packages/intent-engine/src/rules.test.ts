import { describe, expect, it } from "vitest";
import {
  COLOR_KEYS,
  DECISION_VOCABULARY,
  MAX_CONDITION_DEPTH,
  checkRuleSet,
  decisionRuleSchema,
  evaluateRules,
  evaluateScope,
  type BriefFacts,
  type Condition,
  type DecisionRule,
} from "./rules";

// Rules read from docs/context/brand/brand-ci-method.md §3 (axis to design attribute map).
const base = { schemaVersion: "1.0", version: 1, topic: "shape", priority: 50 } as const;

const structuredCrisp: DecisionRule = {
  ...base,
  id: "shape.structured-crisp",
  when: {
    all: [
      { axis: "structured", atLeast: 70 },
      { axis: "playful", atMost: 70 },
    ],
  },
  then: [{ set: "shape", to: "crisp" }],
  because: ["shape.strict-grid-one-radius"],
};
const playfulSoft: DecisionRule = {
  ...base,
  id: "shape.playful-soft",
  when: { axis: "playful", atLeast: 60 },
  then: [{ set: "shape", to: "soft" }],
  because: ["shape.organic-terminals"],
};
const expressiveEmphasis: DecisionRule = {
  ...base,
  id: "emphasis.expressive-signature",
  topic: "color",
  when: { axis: "expressive", atLeast: 60 },
  then: [
    { set: "emphasis", to: "expressive" },
    { set: "typeVoice", to: "paired" },
  ],
  because: ["color.one-signature"],
};
const financeRestrained: DecisionRule = {
  ...base,
  id: "emphasis.finance-restrained",
  topic: "color",
  priority: 70,
  when: { industry: "finance" },
  then: [{ set: "emphasis", to: "restrained" }],
  because: ["color.category-audit"],
};
const premiumQuiet: DecisionRule = {
  ...base,
  id: "motion.premium-quiet",
  topic: "motion",
  when: { any: [{ axis: "premium", atLeast: 70 }, { avoids: "busy-motion" }] },
  then: [{ set: "motion", to: "quiet" }],
  because: ["motion.restraint"],
};
const rules = [structuredCrisp, playfulSoft, expressiveEmphasis, financeRestrained, premiumQuiet];
const knowledge = new Set(rules.flatMap((rule) => rule.because));

// ORIVILO's own vector (brand-ci-method.md §2): Playful 65, Expressive 70, Structured 80, Warm 70, Premium 65.
const orivilo: BriefFacts = {
  personality: { playful: 65, expressive: 70, structured: 80, warm: 70, premium: 65 },
  industry: "design-tools",
  audiences: ["founders"],
  avoid: [],
};

const fails = (patch: Record<string, unknown>) => {
  const result = decisionRuleSchema.safeParse({ ...structuredCrisp, ...patch });
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
};

describe("decisionRuleSchema", () => {
  it("accepts every fixture and round-trips it through JSON", () => {
    for (const rule of rules) {
      expect(decisionRuleSchema.parse(JSON.parse(JSON.stringify(rule)))).toEqual(rule);
    }
  });

  it("only sets known decisions to known values", () => {
    expect(fails({ then: [{ set: "mood", to: "calm" }] })).toEqual(["then.0.set"]);
    expect(fails({ then: [{ set: "shape", to: "bubbly" }] })).toEqual(["then.0.to"]);
    expect(fails({ then: [] })).toEqual(["then"]);
    expect(
      fails({
        then: [
          { set: "shape", to: "crisp" },
          { set: "shape", to: "soft" },
        ],
      }),
    ).toEqual(["then"]);
  });

  it("takes no free text anywhere", () => {
    expect(fails({ note: "make it pop" })).toEqual([""]);
    expect(fails({ then: [{ set: "shape", to: "crisp", why: "x" }] })).toEqual(["then.0"]);
    expect(fails({ when: { prompt: "if it feels luxurious" } })).toEqual(["when"]);
    expect(fails({ when: { axis: "warm", atLeast: 10, label: "x" } })).toEqual(["when"]);
  });

  it("rejects a test with no bound, reversed bounds or an unknown axis", () => {
    expect(fails({ when: { axis: "warm" } })).toEqual(["when"]);
    expect(fails({ when: { axis: "warm", atLeast: 80, atMost: 20 } })).toEqual(["when"]);
    expect(fails({ when: { axis: "spicy", atLeast: 1 } })).toEqual(["when"]);
    expect(fails({ when: { all: [] } })).toEqual(["when.all"]);
  });

  it(`allows nesting up to ${MAX_CONDITION_DEPTH} levels and no deeper`, () => {
    const nest = (levels: number): Condition =>
      levels === 0 ? { always: true } : { not: nest(levels - 1) };
    expect(fails({ when: nest(MAX_CONDITION_DEPTH) })).toEqual([]);
    expect(fails({ when: nest(MAX_CONDITION_DEPTH + 1) })).toEqual(["when"]);
  });

  it("needs a reason, a slug id and a priority from 0 to 100", () => {
    expect(fails({ because: [] })).toEqual(["because"]);
    expect(fails({ id: "Shape Rule" })).toEqual(["id"]);
    expect(fails({ priority: 101 })).toEqual(["priority"]);
  });
});

describe("evaluateRules", () => {
  it("reports ORIVILO's shape tie as a conflict and decides the rest", () => {
    const result = evaluateRules(rules, orivilo);
    expect(result.fired).toEqual([
      "emphasis.expressive-signature",
      "shape.playful-soft",
      "shape.structured-crisp",
    ]);
    expect(result.decisions).toEqual({
      emphasis: {
        value: "expressive",
        priority: 50,
        rules: ["emphasis.expressive-signature"],
        because: ["color.one-signature"],
      },
      typeVoice: {
        value: "paired",
        priority: 50,
        rules: ["emphasis.expressive-signature"],
        because: ["color.one-signature"],
      },
    });
    expect(result.conflicts).toEqual([
      {
        key: "shape",
        priority: 50,
        candidates: [
          { value: "crisp", rules: ["shape.structured-crisp"] },
          { value: "soft", rules: ["shape.playful-soft"] },
        ],
      },
    ]);
    expect(result.undecided).toEqual([]);
  });

  it("lets a higher priority win and keeps the loser in the trace", () => {
    const result = evaluateRules(rules, { ...orivilo, industry: "finance" });
    expect(result.decisions.emphasis?.value).toBe("restrained");
    expect(result.decisions.emphasis?.rules).toEqual(["emphasis.finance-restrained"]);
    expect(result.overridden).toEqual([
      {
        key: "emphasis",
        value: "expressive",
        rule: "emphasis.expressive-signature",
        by: ["emphasis.finance-restrained"],
      },
    ]);
  });

  it("merges rules that agree, with every reason", () => {
    const twin = { ...playfulSoft, id: "shape.warm-soft", because: ["shape.warmth"] };
    const result = evaluateRules([playfulSoft, twin], orivilo);
    expect(result.decisions.shape).toEqual({
      value: "soft",
      priority: 50,
      rules: ["shape.playful-soft", "shape.warm-soft"],
      because: ["shape.organic-terminals", "shape.warmth"],
    });
    expect(result.conflicts).toEqual([]);
  });

  it("asks for missing facts instead of guessing", () => {
    const result = evaluateRules(rules, {
      personality: { playful: 40 },
      industry: null,
      audiences: [],
      avoid: [],
    });
    expect(result.fired).toEqual([]);
    expect(result.decisions).toEqual({});
    expect(result.undecided).toEqual([
      { rule: "emphasis.expressive-signature", missing: ["personality.expressive"] },
      { rule: "emphasis.finance-restrained", missing: ["industry"] },
      { rule: "motion.premium-quiet", missing: ["personality.premium"] },
      { rule: "shape.structured-crisp", missing: ["personality.structured"] },
    ]);
  });

  it("follows three-valued logic for all, any and not", () => {
    const facts: BriefFacts = {
      personality: {},
      industry: null,
      audiences: [],
      avoid: ["busy-motion"],
    };
    const run = (when: Condition) => evaluateRules([{ ...premiumQuiet, id: "probe", when }], facts);
    expect(
      run({ any: [{ axis: "premium", atLeast: 70 }, { avoids: "busy-motion" }] }).fired,
    ).toEqual(["probe"]);
    const deadAll = run({ all: [{ axis: "premium", atLeast: 70 }, { audience: "kids" }] });
    expect([deadAll.fired, deadAll.undecided]).toEqual([[], []]);
    expect(run({ not: { axis: "warm", atLeast: 50 } }).undecided).toEqual([
      { rule: "probe", missing: ["personality.warm"] },
    ]);
    expect(run({ not: { audience: "kids" } }).fired).toEqual(["probe"]);
  });

  it("gives the same answer whatever order the rules come in", () => {
    const facts = { ...orivilo, industry: "finance" };
    const forward = evaluateRules(rules, facts);
    expect(evaluateRules([...rules].reverse(), facts)).toEqual(forward);
    expect(
      evaluateRules([rules[2], rules[0], rules[4], rules[1], rules[3]] as DecisionRule[], facts),
    ).toEqual(forward);
  });

  it("only ever decides values from the vocabulary", () => {
    const result = evaluateRules(rules, orivilo);
    for (const [key, decision] of Object.entries(result.decisions)) {
      expect(DECISION_VOCABULARY[key as keyof typeof DECISION_VOCABULARY]).toContain(
        decision.value,
      );
    }
  });
});

describe("checkRuleSet", () => {
  it("passes when every reason is known and ids are unique", () => {
    expect(checkRuleSet(rules, knowledge)).toEqual([]);
  });

  it("reports a duplicate id and a reason that is not in the corpus", () => {
    const issues = checkRuleSet(
      [
        ...rules,
        { ...playfulSoft },
        { ...premiumQuiet, id: "motion.extra", because: ["motion.gone"] },
      ],
      knowledge,
    );
    expect(issues.map(({ rule, problem }) => [rule, problem])).toEqual([
      ["motion.extra", "unknown-knowledge"],
      ["shape.playful-soft", "duplicate-id"],
    ]);
  });
});

describe("crowded condition", () => {
  const colorRule = (when: Condition): DecisionRule => ({
    ...base,
    id: "color.test",
    topic: "color",
    when,
    then: [{ set: "signature", to: "lime" }],
    because: ["color.audit-the-category"],
  });
  const facts = (crowded?: string[]) => ({
    personality: {},
    industry: null,
    audiences: [],
    avoid: [],
    ...(crowded === undefined ? {} : { crowded }),
  });
  const run = (when: Condition, crowded?: string[]) => {
    const e = evaluateScope([colorRule(when)], facts(crowded), COLOR_KEYS);
    return e.fired.length > 0 ? true : e.undecided.length > 0 ? e.undecided[0]?.missing : false;
  };
  const lime: Condition = { crowded: "lime" };

  it("crowded condition is three-valued", () => {
    expect(run(lime, ["lime"])).toBe(true);
    expect(run(lime, [])).toBe(false);
    expect(run(lime)).toEqual(["lineup"]);
    expect(run({ not: lime })).toEqual(["lineup"]);
    expect(run({ not: lime }, [])).toBe(true);
    expect(run({ all: [lime, { always: true }] })).toEqual(["lineup"]);
    expect(run({ all: [lime, { not: { always: true } }] })).toBe(false);
    expect(run({ any: [lime, { always: true }] })).toBe(true);
    expect(run({ any: [lime, { not: { always: true } }] })).toEqual(["lineup"]);
  });
});
