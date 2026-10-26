import { z } from "zod";
import { CHROMATIC_FAMILIES, type ChromaticFamily } from "./color-audit";
import {
  knowledgeTopicSchema,
  personalityAxisSchema,
  slugSchema,
  type PersonalityAxis,
} from "./knowledge";

/**
 * Decision rules, grammar v1.0 (ORV-17, ADR 0006).
 * A rule is data in a closed form: a condition built from a fixed set of tests over the brief,
 * and actions that set one decision to one known value. There is no free text, no expression
 * language and nothing that runs. Every rule names the knowledge entries it rests on.
 */

/** Decisions a rule can set and the values each takes (handoff §12.1). Profiles read the same list. */
export const DECISION_VOCABULARY = {
  shape: ["crisp", "rounded", "soft"],
  surfaceTreatment: ["flat", "bordered"],
  emphasis: ["restrained", "expressive"],
  typeVoice: ["single", "paired"],
  motion: ["quiet", "standard"],
} as const satisfies Record<string, readonly [string, ...string[]]>;

export type DecisionKey = keyof typeof DECISION_VOCABULARY;
export type DecisionValue<K extends DecisionKey = DecisionKey> =
  (typeof DECISION_VOCABULARY)[K][number];
const DECISION_KEYS = Object.keys(DECISION_VOCABULARY) as DecisionKey[];

/**
 * Decisions only the color node makes (ADR 0017). Disjoint from DECISION_VOCABULARY, which stays
 * the list profiles declare: a key names exactly one scope.
 */
export const COLOR_DECISIONS = {
  signature: ["lime", "cyan", "magenta", "teal"],
  neutral: ["cool", "near", "warm"],
  canvas: ["soft", "bright"],
} as const satisfies Record<string, readonly [string, ...string[]]>;

export type ColorDecisionKey = keyof typeof COLOR_DECISIONS;
export type ColorDecisionValue<K extends ColorDecisionKey = ColorDecisionKey> =
  (typeof COLOR_DECISIONS)[K][number];
export const COLOR_KEYS = Object.keys(COLOR_DECISIONS) as ColorDecisionKey[];

export type RuleScope = "profile" | "color";
const ALL_DECISIONS = { ...DECISION_VOCABULARY, ...COLOR_DECISIONS };
const ALL_KEYS = Object.keys(ALL_DECISIONS) as (DecisionKey | ColorDecisionKey)[];
const keyScope = (key: string): RuleScope => (key in COLOR_DECISIONS ? "color" : "profile");

/** What a rule can look at. A missing axis or industry is unknown, not zero. */
export const briefFactsSchema = z
  .object({
    personality: z.partialRecord(personalityAxisSchema, z.number().int().min(0).max(100)),
    industry: slugSchema.nullable(),
    audiences: z.array(slugSchema),
    avoid: z.array(slugSchema),
  })
  .strict();
export type BriefFacts = z.infer<typeof briefFactsSchema>;

/**
 * Brief facts plus the one fact only `auditLineup` sets (ADR 0017). It is not a field of
 * `briefFactsSchema`, so no interpreter, rule-based or model, can supply it.
 */
export type ColorFacts = BriefFacts & { crowded?: readonly string[] | undefined };

const axisValue = z.number().int().min(0).max(100);

export type Condition =
  | { always: true }
  | { axis: PersonalityAxis; atLeast?: number | undefined; atMost?: number | undefined }
  | { industry: string }
  | { audience: string }
  | { avoids: string }
  | { crowded: ChromaticFamily }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

/** Deepest nesting of all, any and not a condition may use. */
export const MAX_CONDITION_DEPTH = 6;

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ always: z.literal(true) }).strict(),
    z
      .object({
        axis: personalityAxisSchema,
        atLeast: axisValue.optional(),
        atMost: axisValue.optional(),
      })
      .strict()
      .refine(
        (c) => c.atLeast !== undefined || c.atMost !== undefined,
        "Give atLeast, atMost or both.",
      )
      .refine(
        (c) => c.atLeast === undefined || c.atMost === undefined || c.atLeast <= c.atMost,
        "atLeast must not exceed atMost.",
      ),
    z.object({ industry: slugSchema }).strict(),
    z.object({ audience: slugSchema }).strict(),
    z.object({ avoids: slugSchema }).strict(),
    z.object({ crowded: z.enum(CHROMATIC_FAMILIES) }).strict(),
    z.object({ all: z.array(conditionSchema).min(1) }).strict(),
    z.object({ any: z.array(conditionSchema).min(1) }).strict(),
    z.object({ not: conditionSchema }).strict(),
  ]),
);

function depth(condition: Condition): number {
  if ("all" in condition) return 1 + Math.max(...condition.all.map(depth));
  if ("any" in condition) return 1 + Math.max(...condition.any.map(depth));
  if ("not" in condition) return 1 + depth(condition.not);
  return 0;
}

/** Paths of every `crowded` condition inside a condition, for error messages. */
function crowdedPaths(condition: Condition, path: (string | number)[]): (string | number)[][] {
  if ("crowded" in condition) return [path];
  if ("all" in condition)
    return condition.all.flatMap((c, i) => crowdedPaths(c, [...path, "all", i]));
  if ("any" in condition)
    return condition.any.flatMap((c, i) => crowdedPaths(c, [...path, "any", i]));
  if ("not" in condition) return crowdedPaths(condition.not, [...path, "not"]);
  return [];
}

const actionSchema = z.discriminatedUnion(
  "set",
  ALL_KEYS.map((key) =>
    z.object({ set: z.literal(key), to: z.enum(ALL_DECISIONS[key]) }).strict(),
  ) as unknown as [z.ZodObject<{ set: z.ZodLiteral<DecisionKey>; to: z.ZodString }>],
);
export type RuleAction =
  | { [K in DecisionKey]: { set: K; to: DecisionValue<K> } }[DecisionKey]
  | { [K in ColorDecisionKey]: { set: K; to: ColorDecisionValue<K> } }[ColorDecisionKey];

export const decisionRuleSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    id: slugSchema,
    version: z.number().int().positive(),
    topic: knowledgeTopicSchema,
    priority: z.number().int().min(0).max(100),
    when: conditionSchema,
    then: z.array(actionSchema).min(1),
    because: z.array(slugSchema).min(1),
  })
  .strict()
  .superRefine((rule, ctx) => {
    if (depth(rule.when) > MAX_CONDITION_DEPTH) {
      ctx.addIssue({
        code: "custom",
        path: ["when"],
        message: `Nest at most ${MAX_CONDITION_DEPTH} levels.`,
      });
    }
    const keys = rule.then.map((action) => action.set);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({ code: "custom", path: ["then"], message: "Set each decision once per rule." });
    }
    const scopes = new Set(keys.map(keyScope));
    if (scopes.size > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["then"],
        message: "Set profile decisions or color decisions in one rule, not both.",
      });
    } else if (scopes.has("color")) {
      if (rule.topic !== "color") {
        ctx.addIssue({
          code: "custom",
          path: ["topic"],
          message: "A rule that sets a color decision has topic color.",
        });
      }
    } else {
      for (const path of crowdedPaths(rule.when, ["when"])) {
        ctx.addIssue({
          code: "custom",
          path,
          message: "The crowded condition is for rules that set color decisions.",
        });
      }
    }
  });

export type DecisionRule = Omit<z.infer<typeof decisionRuleSchema>, "then" | "when"> & {
  when: Condition;
  then: RuleAction[];
};

/** Kleene logic: a test on a fact the brief does not have is unknown, and unknown spreads. */
type Truth = true | false | "unknown";

type Test = { truth: Truth; missing: string[] };

function test(condition: Condition, facts: ColorFacts): Test {
  if ("always" in condition) return { truth: true, missing: [] };
  if ("axis" in condition) {
    const value = facts.personality[condition.axis];
    if (value === undefined)
      return { truth: "unknown", missing: [`personality.${condition.axis}`] };
    const ok =
      (condition.atLeast === undefined || value >= condition.atLeast) &&
      (condition.atMost === undefined || value <= condition.atMost);
    return { truth: ok, missing: [] };
  }
  if ("industry" in condition) {
    if (facts.industry === null) return { truth: "unknown", missing: ["industry"] };
    return { truth: facts.industry === condition.industry, missing: [] };
  }
  if ("audience" in condition)
    return { truth: facts.audiences.includes(condition.audience), missing: [] };
  if ("avoids" in condition) return { truth: facts.avoid.includes(condition.avoids), missing: [] };
  if ("crowded" in condition) {
    if (facts.crowded === undefined) return { truth: "unknown", missing: ["lineup"] };
    return { truth: facts.crowded.includes(condition.crowded), missing: [] };
  }
  if ("not" in condition) {
    const inner = test(condition.not, facts);
    return { truth: inner.truth === "unknown" ? "unknown" : !inner.truth, missing: inner.missing };
  }
  const parts = ("all" in condition ? condition.all : condition.any).map((c) => test(c, facts));
  const decisive = "all" in condition ? false : true;
  if (parts.some((p) => p.truth === decisive)) return { truth: decisive, missing: [] };
  const unknown = parts.filter((p) => p.truth === "unknown");
  if (unknown.length > 0) return { truth: "unknown", missing: unknown.flatMap((p) => p.missing) };
  return { truth: !decisive, missing: [] };
}

export type Decision = { value: string; priority: number; rules: string[]; because: string[] };

export type Evaluation<K extends string = DecisionKey> = {
  /** Decisions that one value won outright. */
  decisions: Partial<Record<K, Decision>>;
  /** Decisions where rules of the same top priority disagree. No value is chosen for these. */
  conflicts: {
    key: K;
    priority: number;
    candidates: { value: string; rules: string[] }[];
  }[];
  /** Lower-priority rules whose value lost, kept so the trace shows what was set aside. */
  overridden: { key: K; value: string; rule: string; by: string[] }[];
  /** Rules whose condition held, sorted by id. */
  fired: string[];
  /** Rules that could not be decided, with the facts the brief still needs. */
  undecided: { rule: string; missing: string[] }[];
};

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const uniqueSorted = (items: Iterable<string>) => [...new Set(items)].sort(byText);

/**
 * The shared core, run over the keys of one scope. The result depends only on the set of rules
 * and the facts: input order never matters. The highest priority wins a decision; a tie between
 * different values is a conflict and leaves the decision open, never silently picked.
 */
export function evaluateScope<K extends DecisionKey | ColorDecisionKey>(
  rules: readonly DecisionRule[],
  facts: ColorFacts,
  keys: readonly K[],
): Evaluation<K> {
  const sorted = [...rules]
    .filter((rule) => rule.then.every((action) => (keys as readonly string[]).includes(action.set)))
    .sort((a, b) => byText(a.id, b.id));
  const fired: DecisionRule[] = [];
  const undecided: Evaluation["undecided"] = [];
  for (const rule of sorted) {
    const result = test(rule.when, facts);
    if (result.truth === true) fired.push(rule);
    else if (result.truth === "unknown")
      undecided.push({ rule: rule.id, missing: uniqueSorted(result.missing) });
  }

  const evaluation: Evaluation<K> = {
    decisions: {},
    conflicts: [],
    overridden: [],
    fired: fired.map((rule) => rule.id),
    undecided,
  };

  for (const key of keys) {
    const votes = fired.flatMap((rule) =>
      rule.then
        .filter((action) => action.set === key)
        .map((action) => ({ rule, value: action.to as string })),
    );
    if (votes.length === 0) continue;
    const top = Math.max(...votes.map((vote) => vote.rule.priority));
    const winners = votes.filter((vote) => vote.rule.priority === top);
    const values = uniqueSorted(winners.map((vote) => vote.value));
    const winnerIds = uniqueSorted(winners.map((vote) => vote.rule.id));
    if (values.length > 1) {
      evaluation.conflicts.push({
        key,
        priority: top,
        candidates: values.map((value) => ({
          value,
          rules: uniqueSorted(
            winners.filter((vote) => vote.value === value).map((vote) => vote.rule.id),
          ),
        })),
      });
    } else {
      evaluation.decisions[key] = {
        value: values[0] as string,
        priority: top,
        rules: winnerIds,
        because: uniqueSorted(winners.flatMap((vote) => vote.rule.because)),
      };
    }
    for (const vote of votes) {
      if (vote.rule.priority < top && !values.includes(vote.value)) {
        evaluation.overridden.push({ key, value: vote.value, rule: vote.rule.id, by: winnerIds });
      }
    }
  }
  return evaluation;
}

/** Evaluates the profile scope: the rules that set decisions a curated profile declares. */
export function evaluateRules(rules: readonly DecisionRule[], facts: BriefFacts): Evaluation {
  return evaluateScope(rules, facts, DECISION_KEYS);
}

export type RuleSetIssue = {
  rule: string;
  problem: "duplicate-id" | "unknown-knowledge" | "wrong-scope";
  detail: string;
};

/**
 * Checks a rule set as a whole: ids are unique and every `because` names a known entry. With a
 * scope, a rule that sets a decision of the other scope is a problem instead of a rule that fires
 * and sets nothing (ADR 0017).
 */
export function checkRuleSet(
  rules: readonly DecisionRule[],
  knowledgeIds: ReadonlySet<string>,
  scope?: RuleScope,
): RuleSetIssue[] {
  const issues: RuleSetIssue[] = [];
  const seen = new Set<string>();
  for (const rule of [...rules].sort((a, b) => byText(a.id, b.id))) {
    if (seen.has(rule.id)) {
      issues.push({ rule: rule.id, problem: "duplicate-id", detail: `${rule.id} appears twice.` });
      continue;
    }
    seen.add(rule.id);
    if (scope !== undefined && rule.then.some((action) => keyScope(action.set) !== scope)) {
      issues.push({
        rule: rule.id,
        problem: "wrong-scope",
        detail: `${rule.id} sets a decision outside the ${scope} scope.`,
      });
    }
    for (const id of rule.because) {
      if (!knowledgeIds.has(id)) {
        issues.push({
          rule: rule.id,
          problem: "unknown-knowledge",
          detail: `${rule.id} rests on ${id}, which is not in the corpus.`,
        });
      }
    }
  }
  return issues;
}
