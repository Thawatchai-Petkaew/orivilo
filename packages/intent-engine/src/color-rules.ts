import { z } from "zod";
import { auditLineup, lineupSchema, type ChromaticFamily, type LineupAudit } from "./color-audit";
import { COLOR_KNOWLEDGE_IDS } from "./color-knowledge";
import { fingerprintOf } from "./resolver";
import {
  COLOR_KEYS,
  briefFactsSchema,
  checkRuleSet,
  evaluateScope,
  type ColorDecisionKey,
  type Condition,
  type DecisionRule,
  type Evaluation,
  type RuleSetIssue,
} from "./rules";

/**
 * The color node's decisions (ORV-20, ADR 0017). Rule-based, not AI: a lineup and a personality
 * vector go in, closed rules with sources decide the signature hue, the neutral family and the
 * canvas, and each decision names the rules and knowledge entries behind it. Same input, same
 * output, fingerprint included. No model is called here.
 */
export const COLOR_NODE_VERSION = "color-1";

const base = { schemaVersion: "1.0", version: 1, topic: "color" } as const;

const SIGNATURE_BECAUSE = [
  "color.audit-the-category",
  "color.expressive-signature",
  "color.warm-leans-hue",
  "color.semantics-separate",
];
const LIGHT_BECAUSE = [...SIGNATURE_BECAUSE, "color.light-chroma-gamut"];

const signatureRule = (
  id: string,
  priority: number,
  band: "light" | "deep",
  warm: "warm" | "cool",
  family: ChromaticFamily,
  to: "lime" | "cyan" | "magenta" | "teal",
): DecisionRule => {
  const when: Condition = {
    all: [
      band === "light" ? { axis: "expressive", atLeast: 55 } : { axis: "expressive", atMost: 54 },
      warm === "warm" ? { axis: "warm", atLeast: 50 } : { axis: "warm", atMost: 49 },
      { not: { crowded: family } },
    ],
  };
  return {
    ...base,
    id,
    priority,
    when,
    then: [{ set: "signature", to }],
    because: band === "light" ? LIGHT_BECAUSE : SIGNATURE_BECAUSE,
  };
};

const axisRule = (
  id: string,
  when: Condition,
  then: DecisionRule["then"],
  because: string[],
): DecisionRule => ({ ...base, id, priority: 50, when, then, because });

const NEUTRAL_BECAUSE = ["color.warm-leans-hue", "color.roles-before-values"];
const CANVAS_BECAUSE = ["color.premium-canvas", "color.roles-before-values"];

export const COLOR_RULES: readonly DecisionRule[] = [
  signatureRule("color.signature.lime-warm", 80, "light", "warm", "lime", "lime"),
  signatureRule("color.signature.cyan-warm-fallback", 70, "light", "warm", "cyan", "cyan"),
  signatureRule("color.signature.cyan-cool", 80, "light", "cool", "cyan", "cyan"),
  signatureRule("color.signature.lime-cool-fallback", 70, "light", "cool", "lime", "lime"),
  signatureRule("color.signature.magenta-warm", 80, "deep", "warm", "magenta", "magenta"),
  signatureRule("color.signature.teal-warm-fallback", 70, "deep", "warm", "teal", "teal"),
  signatureRule("color.signature.teal-cool", 80, "deep", "cool", "teal", "teal"),
  signatureRule("color.signature.magenta-cool-fallback", 70, "deep", "cool", "magenta", "magenta"),
  axisRule(
    "color.neutral.cool",
    { axis: "warm", atMost: 25 },
    [{ set: "neutral", to: "cool" }],
    NEUTRAL_BECAUSE,
  ),
  axisRule(
    "color.neutral.near",
    { axis: "warm", atLeast: 26, atMost: 74 },
    [{ set: "neutral", to: "near" }],
    NEUTRAL_BECAUSE,
  ),
  axisRule(
    "color.neutral.warm",
    { axis: "warm", atLeast: 75 },
    [{ set: "neutral", to: "warm" }],
    NEUTRAL_BECAUSE,
  ),
  axisRule(
    "color.canvas.soft",
    { axis: "premium", atLeast: 60 },
    [{ set: "canvas", to: "soft" }],
    CANVAS_BECAUSE,
  ),
  axisRule(
    "color.canvas.bright",
    { axis: "premium", atMost: 59 },
    [{ set: "canvas", to: "bright" }],
    CANVAS_BECAUSE,
  ),
];

/** `lineup: null` means the category was not given. Rules and knowledge default to the node's own. */
export const colorInputSchema = z
  .object({ facts: briefFactsSchema, lineup: lineupSchema.nullable() })
  .strict();

export type ColorInput = z.infer<typeof colorInputSchema> & {
  rules?: readonly DecisionRule[];
  knowledgeIds?: readonly string[];
};

export type ColorDecisionResult = {
  version: typeof COLOR_NODE_VERSION;
  method: "rule-based";
  status: "resolved" | "needs-input" | "conflicted" | "invalid";
  /** Null when no lineup was given. */
  audit: LineupAudit | null;
  evaluation: Evaluation<ColorDecisionKey>;
  /** Decisions no rule settled, or only a tie did. No fallback value is invented for them. */
  open: ColorDecisionKey[];
  /** Facts a person could still give: sorted, `lineup` included when the lineup is missing. */
  questions: string[];
  issues: RuleSetIssue[];
  /** FNV-1a of everything above, so two runs can be compared by one value. */
  fingerprint: string;
};

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Throws a ZodError when `facts` or `lineup` break `colorInputSchema`. */
export function decideColor(raw: ColorInput): ColorDecisionResult {
  const input = { ...raw, ...colorInputSchema.parse({ facts: raw.facts, lineup: raw.lineup }) };
  const rules = input.rules ?? COLOR_RULES;
  const knowledgeIds = new Set(input.knowledgeIds ?? COLOR_KNOWLEDGE_IDS);
  const issues = checkRuleSet(rules, knowledgeIds, "color");
  const audit = input.lineup === null ? null : auditLineup(input.lineup);

  const evaluation: Evaluation<ColorDecisionKey> =
    issues.length > 0
      ? { decisions: {}, conflicts: [], overridden: [], fired: [], undecided: [] }
      : evaluateScope(
          rules,
          audit === null ? input.facts : { ...input.facts, crowded: audit.crowded },
          COLOR_KEYS,
        );

  const open = COLOR_KEYS.filter((key) => evaluation.decisions[key] === undefined).sort(byText);
  const questions = [
    ...new Set([
      ...evaluation.undecided.flatMap((u) => u.missing),
      ...(audit === null ? ["lineup"] : []),
    ]),
  ].sort(byText);
  const status: ColorDecisionResult["status"] =
    issues.length > 0
      ? "invalid"
      : evaluation.conflicts.length > 0
        ? "conflicted"
        : open.length > 0
          ? "needs-input"
          : "resolved";

  const body: Omit<ColorDecisionResult, "fingerprint"> = {
    version: COLOR_NODE_VERSION,
    method: "rule-based",
    status,
    audit,
    evaluation,
    open,
    questions,
    issues,
  };
  return { ...body, fingerprint: fingerprintOf(body) };
}
