import { z } from "zod";
import { slugSchema } from "./knowledge";
import {
  DECISION_VOCABULARY,
  briefFactsSchema,
  checkRuleSet,
  decisionRuleSchema,
  evaluateRules,
  type DecisionKey,
  type DecisionRule,
  type RuleSetIssue,
} from "./rules";

/**
 * Deterministic profile resolver (ORV-32, handoff §12.3, ADR 0007).
 * Same input and the same resolver and catalog versions give an equal result, down to its
 * fingerprint. A brand-locked field always holds; anything that disagrees with it is reported as
 * a conflict, never applied and never silently dropped.
 */
export const RESOLVER_VERSION = "rules-1";

const DECISION_KEYS = Object.keys(DECISION_VOCABULARY) as DecisionKey[];

const decisionValues = <T extends z.ZodType>(value: (key: DecisionKey) => T) =>
  Object.fromEntries(DECISION_KEYS.map((key) => [key, value(key)])) as Record<DecisionKey, T>;

/** A full set of decisions, one value per key. */
const fullDecisionsSchema = z
  .object(decisionValues((key) => z.enum(DECISION_VOCABULARY[key])))
  .strict();
/** Some decisions, as a brand locks them. */
export const partialDecisionsSchema = z
  .object(decisionValues((key) => z.enum(DECISION_VOCABULARY[key]).optional()))
  .strict();

/** A hand-made profile the resolver may choose (E2-2). Only its decisions matter here. */
export const curatedProfileSchema = z
  .object({ id: slugSchema, decisions: fullDecisionsSchema })
  .strict();

/** The expert layer (brief, "Two adjustment layers"): a person sets one decision and says why. */
export const adjustmentSchema = z.discriminatedUnion(
  "set",
  DECISION_KEYS.map((key) =>
    z
      .object({
        set: z.literal(key),
        to: z.enum(DECISION_VOCABULARY[key]),
        reason: z.string().trim().min(1),
      })
      .strict(),
  ) as unknown as [
    z.ZodObject<{ set: z.ZodLiteral<DecisionKey>; to: z.ZodString; reason: z.ZodString }>,
  ],
);

export const resolveInputSchema = z
  .object({
    catalogVersion: z.string().trim().min(1),
    facts: briefFactsSchema,
    locked: partialDecisionsSchema,
    adjustments: z.array(adjustmentSchema),
    rules: z.array(decisionRuleSchema),
    knowledgeIds: z.array(slugSchema),
    profiles: z.array(curatedProfileSchema).min(1),
  })
  .strict()
  .superRefine((input, ctx) => {
    const keys = input.adjustments.map((adjustment) => adjustment.set);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: "custom",
        path: ["adjustments"],
        message: "Adjust each decision once.",
      });
    }
    const ids = input.profiles.map((profile) => profile.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", path: ["profiles"], message: "Profile ids must be unique." });
    }
  });

export type ResolveInput = Omit<z.infer<typeof resolveInputSchema>, "rules"> & {
  rules: DecisionRule[];
};

export type ResolvedDecision =
  | { value: string; source: "locked" }
  | { value: string; source: "adjustment"; reason: string }
  | { value: string; source: "rule"; rules: string[]; because: string[] };

export type ResolveConflict =
  | { kind: "rule-tie"; key: DecisionKey; candidates: { value: string; rules: string[] }[] }
  | { kind: "locked"; key: DecisionKey; locked: string; proposed: string; by: string[] };

export type Resolution = {
  resolverVersion: string;
  catalogVersion: string;
  status: "resolved" | "needs-input" | "conflicted" | "invalid";
  decisions: Partial<Record<DecisionKey, ResolvedDecision>>;
  /** Decisions nothing settled, and the brief facts that would let rules settle them. */
  open: DecisionKey[];
  questions: string[];
  conflicts: ResolveConflict[];
  overridden: { key: DecisionKey; value: string; by: string[] }[];
  /** The curated profile closest to the decisions; ties go to the first id and are listed. */
  profileId: string | null;
  profileTies: string[];
  /** Decisions the chosen profile does not express, so the person sees what it cannot honor. */
  unsupported: { key: DecisionKey; wanted: string; profile: string }[];
  issues: RuleSetIssue[];
  /** FNV-1a of everything above, so two runs can be compared by one value. */
  fingerprint: string;
};

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const uniqueSorted = (items: Iterable<string>) => [...new Set(items)].sort(byText);

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    entries.sort(([a], [b]) => byText(a, b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function resolveProfile(input: ResolveInput): Resolution {
  const issues = checkRuleSet(input.rules, new Set(input.knowledgeIds));
  const evaluation = evaluateRules(input.rules, input.facts);
  const adjustments = new Map(input.adjustments.map((a) => [a.set as DecisionKey, a]));

  const decisions: Resolution["decisions"] = {};
  const conflicts: ResolveConflict[] = [];
  const overridden: Resolution["overridden"] = evaluation.overridden.map(({ key, value, by }) => ({
    key,
    value,
    by,
  }));

  for (const key of DECISION_KEYS) {
    const locked = input.locked[key];
    const adjustment = adjustments.get(key);
    const ruled = evaluation.decisions[key];
    const tie = evaluation.conflicts.find((conflict) => conflict.key === key);
    const proposals = [
      ...(ruled ? [{ value: ruled.value, by: ruled.rules }] : []),
      ...(tie ? tie.candidates.map((c) => ({ value: c.value, by: c.rules })) : []),
    ];

    if (locked !== undefined) {
      decisions[key] = { value: locked, source: "locked" };
      if (adjustment && adjustment.to !== locked) {
        conflicts.push({
          kind: "locked",
          key,
          locked,
          proposed: adjustment.to,
          by: ["adjustment"],
        });
      }
      for (const proposal of proposals) {
        if (proposal.value !== locked) {
          conflicts.push({
            kind: "locked",
            key,
            locked,
            proposed: proposal.value,
            by: proposal.by,
          });
        }
      }
    } else if (adjustment) {
      decisions[key] = { value: adjustment.to, source: "adjustment", reason: adjustment.reason };
      for (const proposal of proposals) {
        if (proposal.value !== adjustment.to) {
          overridden.push({ key, value: proposal.value, by: ["adjustment"] });
        }
      }
    } else if (tie) {
      conflicts.push({ kind: "rule-tie", key, candidates: tie.candidates });
    } else if (ruled) {
      decisions[key] = {
        value: ruled.value,
        source: "rule",
        rules: ruled.rules,
        because: ruled.because,
      };
    }
  }

  const open = DECISION_KEYS.filter((key) => decisions[key] === undefined);
  const questions = uniqueSorted(evaluation.undecided.flatMap((u) => u.missing));

  const decided = Object.entries(decisions) as [DecisionKey, ResolvedDecision][];
  let profileId: string | null = null;
  let profileTies: string[] = [];
  let unsupported: Resolution["unsupported"] = [];
  if (decided.length > 0) {
    const scored = [...input.profiles]
      .sort((a, b) => byText(a.id, b.id))
      .map((profile) => ({
        profile,
        score: decided.filter(([key, d]) => profile.decisions[key] === d.value).length,
      }));
    const best = Math.max(...scored.map((s) => s.score));
    const top = scored.filter((s) => s.score === best);
    const chosen = top[0]?.profile;
    if (chosen) {
      profileId = chosen.id;
      profileTies = top.length > 1 ? top.map((s) => s.profile.id) : [];
      unsupported = decided
        .filter(([key, d]) => chosen.decisions[key] !== d.value)
        .map(([key, d]) => ({ key, wanted: d.value, profile: chosen.decisions[key] }));
    }
  }

  const status: Resolution["status"] =
    issues.length > 0
      ? "invalid"
      : conflicts.length > 0
        ? "conflicted"
        : open.length > 0
          ? "needs-input"
          : "resolved";

  const body: Omit<Resolution, "fingerprint"> = {
    resolverVersion: RESOLVER_VERSION,
    catalogVersion: input.catalogVersion,
    status,
    decisions,
    open,
    questions,
    conflicts,
    overridden: overridden.sort((a, b) => byText(`${a.key}:${a.value}`, `${b.key}:${b.value}`)),
    profileId,
    profileTies,
    unsupported,
    issues,
  };
  return { ...body, fingerprint: fnv1a(canonical(body)) };
}
