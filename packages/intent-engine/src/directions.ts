import type { PersonalityAxis } from "./knowledge";
import { interpretWithRules, type Interpretation } from "./interpreter";
import {
  resolveProfile,
  type ResolvedDecision,
  type ResolveInput,
  type Resolution,
} from "./resolver";
import { DECISION_VOCABULARY, type Condition, type DecisionKey, type DecisionRule } from "./rules";

/**
 * Directions from a brief (ORV-34 part 1, handoff §17.3). One call reads the brief with the rule
 * interpreter, resolves it against the curated profiles, and returns two directions: the profile
 * the resolver chose and the one that differs most from it. Every reason is either the brief's own
 * words behind the rule that made a decision, or the lock or adjustment that set it. Nothing is
 * invented and a tie stays a conflict.
 */

/** Where the starter rules come from: the brand method's axis map (brand-ci-method.md §3). */
export const STARTER_KNOWLEDGE_IDS = ["brand-ci-method.axis-map"] as const;

const axisRule = (
  id: string,
  when: Condition,
  then: DecisionRule["then"],
  topic: DecisionRule["topic"],
): DecisionRule => ({
  schemaVersion: "1.0",
  id,
  version: 1,
  topic,
  priority: 50,
  when,
  then,
  because: [...STARTER_KNOWLEDGE_IDS],
});

/** The axis map in rule form, the set E2-9 was proven with. New rules arrive with E1-4 to E1-6. */
export const STARTER_RULES: readonly DecisionRule[] = [
  axisRule(
    "shape.structured-crisp",
    { axis: "structured", atLeast: 70 },
    [{ set: "shape", to: "crisp" }],
    "shape",
  ),
  axisRule(
    "shape.playful-soft",
    { axis: "playful", atLeast: 60 },
    [{ set: "shape", to: "soft" }],
    "shape",
  ),
  axisRule(
    "emphasis.expressive-signature",
    { axis: "expressive", atLeast: 60 },
    [
      { set: "emphasis", to: "expressive" },
      { set: "typeVoice", to: "paired" },
    ],
    "color",
  ),
  axisRule(
    "motion.premium-quiet",
    { axis: "premium", atLeast: 70 },
    [{ set: "motion", to: "quiet" }],
    "motion",
  ),
];

/** A curated profile as the resolver sees it: an id and one value per decision. */
export type CuratedProfile = ResolveInput["profiles"][number];

/** Why one decision holds: rule-made with the brief's words, or set by a lock or adjustment. */
export type DecisionReason =
  | { key: DecisionKey; value: string; source: "rule"; rules: string[]; words: string[] }
  | { key: DecisionKey; value: string; source: "locked" }
  | { key: DecisionKey; value: string; source: "adjustment"; reason: string };

export interface Direction {
  profileId: string;
  role: "recommended" | "contrast";
  decisions: CuratedProfile["decisions"];
  /** Resolved decisions this profile expresses. */
  matches: DecisionKey[];
  /** Resolved decisions it cannot express: what the brief wanted and what the profile has. */
  differs: { key: DecisionKey; wanted: string; has: string }[];
}

export interface DirectionsResult {
  method: "rule-based";
  interpretation: Interpretation;
  resolution: Resolution;
  reasons: DecisionReason[];
  /** Empty when nothing was decided; otherwise the recommended direction, then the contrast. */
  directions: Direction[];
}

export interface RecommendOptions {
  profiles: readonly CuratedProfile[];
  locked?: ResolveInput["locked"];
  adjustments?: ResolveInput["adjustments"];
  rules?: readonly DecisionRule[];
  knowledgeIds?: readonly string[];
  catalogVersion?: string;
}

function axesOf(condition: Condition): PersonalityAxis[] {
  if ("axis" in condition) return [condition.axis];
  if ("all" in condition) return condition.all.flatMap(axesOf);
  if ("any" in condition) return condition.any.flatMap(axesOf);
  if ("not" in condition) return axesOf(condition.not);
  return [];
}

const DECISION_KEYS = Object.keys(DECISION_VOCABULARY) as DecisionKey[];

function direction(
  profile: CuratedProfile,
  role: Direction["role"],
  decided: [DecisionKey, ResolvedDecision][],
): Direction {
  return {
    profileId: profile.id,
    role,
    decisions: profile.decisions,
    matches: decided.filter(([k, d]) => profile.decisions[k] === d.value).map(([k]) => k),
    differs: decided
      .filter(([k, d]) => profile.decisions[k] !== d.value)
      .map(([key, d]) => ({ key, wanted: d.value, has: profile.decisions[key] })),
  };
}

/** Reads a brief and returns the reading, the resolution, the reasons and two directions. */
export function recommendDirections(brief: string, options: RecommendOptions): DirectionsResult {
  const rules = options.rules ?? STARTER_RULES;
  const interpretation = interpretWithRules({ text: brief });
  const resolution = resolveProfile({
    catalogVersion: options.catalogVersion ?? "catalog-1",
    facts: interpretation.facts,
    locked: options.locked ?? {},
    adjustments: options.adjustments ?? [],
    rules: [...rules],
    knowledgeIds: [...(options.knowledgeIds ?? STARTER_KNOWLEDGE_IDS)],
    profiles: [...options.profiles],
  });

  const wordsFor = (axes: PersonalityAxis[]) => [
    ...new Set(
      interpretation.findings
        .filter((f) => f.field === "personality" && axes.includes(f.axis))
        .map((f) => f.evidence.text),
    ),
  ];
  const decided = DECISION_KEYS.flatMap((key) => {
    const d = resolution.decisions[key];
    return d ? [[key, d] as [DecisionKey, ResolvedDecision]] : [];
  });
  const reasons: DecisionReason[] = decided.map(([key, d]) => {
    if (d.source === "locked") return { key, value: d.value, source: "locked" };
    if (d.source === "adjustment") {
      return { key, value: d.value, source: "adjustment", reason: d.reason };
    }
    const axes = rules.filter((r) => d.rules.includes(r.id)).flatMap((r) => axesOf(r.when));
    return { key, value: d.value, source: "rule", rules: d.rules, words: wordsFor(axes) };
  });

  const chosen = options.profiles.find((p) => p.id === resolution.profileId);
  const directions: Direction[] = [];
  if (chosen) {
    directions.push(direction(chosen, "recommended", decided));
    // The contrast differs from the recommended direction in the most decisions; ties keep input order.
    let contrast: CuratedProfile | undefined;
    let most = -1;
    for (const p of options.profiles) {
      if (p.id === chosen.id) continue;
      const apart = DECISION_KEYS.filter((k) => p.decisions[k] !== chosen.decisions[k]).length;
      if (apart > most) {
        most = apart;
        contrast = p;
      }
    }
    if (contrast) directions.push(direction(contrast, "contrast", decided));
  }

  return { method: "rule-based", interpretation, resolution, reasons, directions };
}
