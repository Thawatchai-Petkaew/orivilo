import { z } from "zod";

/**
 * Knowledge entry, schema v1.0 (ORV-16, ADR 0005).
 * One record of what a canvas node knows: a statement in our own words, where it
 * applies, where it came from, how sure we are and when a person last checked it.
 * Records are data. Nothing in them is ever executed (AGENTS.md, data access and security).
 */

/** Lowercase words joined by hyphens, optionally grouped with a dot: `color.semantics-separate`. */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*$/, "Use a lowercase slug.");

/** The topics a canvas node can be expert in. Adding one is an additive change (ADR 0005). */
export const KNOWLEDGE_TOPICS = [
  "brand",
  "logo",
  "color",
  "typography",
  "shape",
  "density",
  "surface",
  "imagery",
  "motion",
  "content",
  "pattern",
] as const;
export const knowledgeTopicSchema = z.enum(KNOWLEDGE_TOPICS);

/** principle: how to do something well. guideline: a checkable do or avoid. pattern: what a kind of product tends to need. reference: a link to an outside example, metadata only. */
export const knowledgeKindSchema = z.enum(["principle", "guideline", "pattern", "reference"]);

/** The five personality axes of the brand brief (brand-ci-method.md §2), each 0 to 100. */
export const PERSONALITY_AXES = ["playful", "expressive", "structured", "warm", "premium"] as const;
export const personalityAxisSchema = z.enum(PERSONALITY_AXES);

const axisValue = z.number().int().min(0).max(100);
const axisRangeSchema = z
  .object({ min: axisValue, max: axisValue })
  .refine((range) => range.min <= range.max, "min must not exceed max.");

/** Text in our own words, Thai, English or both. At least one is required. */
export const knowledgeTextSchema = z
  .object({ th: z.string().trim().min(1).optional(), en: z.string().trim().min(1).optional() })
  .strict()
  .refine((text) => text.th !== undefined || text.en !== undefined, "Write Thai, English or both.");

/** Where an entry applies. An empty list means any; a missing axis means any value on it. */
export const appliesToSchema = z
  .object({
    topics: z.array(knowledgeTopicSchema).min(1),
    industries: z.array(slugSchema),
    audiences: z.array(slugSchema),
    personality: z.partialRecord(personalityAxisSchema, axisRangeSchema),
  })
  .strict();

/**
 * own-words: our summary of principles, which are not owned by anyone.
 * link-only: an outside visual or page kept as a link and metadata, never copied.
 * The open licenses allow importing text with attribution.
 */
export const knowledgeLicenseSchema = z.enum([
  "own-words",
  "link-only",
  "MIT",
  "CC-BY-4.0",
  "CC0-1.0",
]);

export const sourceSchema = z
  .object({
    kind: z.enum(["book", "article", "dataset", "brand-guideline", "product", "owner", "team"]),
    title: z.string().trim().min(1),
    url: z.url({ protocol: /^https$/ }).optional(),
    retrievedAt: z.iso.date().optional(),
    license: knowledgeLicenseSchema,
  })
  .strict()
  .superRefine((source, ctx) => {
    if (source.license === "link-only" && source.url === undefined) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "A link-only source needs its url." });
    }
  });

/**
 * How a confidence was reached. A number without a basis is not allowed (handoff §12.2),
 * and each basis caps the number so an import can never outrank a person's check.
 */
export const confidenceBasisSchema = z.enum([
  "owner-verified",
  "multiple-sources",
  "single-source",
  "imported",
  "hypothesis",
]);
export type ConfidenceBasis = z.infer<typeof confidenceBasisSchema>;

export const CONFIDENCE_CAP: Readonly<Record<ConfidenceBasis, number>> = {
  "owner-verified": 1,
  "multiple-sources": 0.9,
  "single-source": 0.8,
  imported: 0.7,
  hypothesis: 0.4,
};

export const relationSchema = z
  .object({ type: z.enum(["supports", "refines", "contradicts", "supersedes"]), to: slugSchema })
  .strict();

export const knowledgeEntrySchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    id: slugSchema,
    version: z.number().int().positive(),
    kind: knowledgeKindSchema,
    status: z.enum(["draft", "verified", "retired"]),
    statement: knowledgeTextSchema,
    do: z.array(knowledgeTextSchema),
    avoid: z.array(knowledgeTextSchema),
    severity: z.enum(["must", "should", "may"]),
    appliesTo: appliesToSchema,
    keywords: z.array(z.string().trim().min(1)),
    sources: z.array(sourceSchema).min(1),
    confidence: z.number().min(0).max(1),
    confidenceBasis: confidenceBasisSchema,
    verifiedAt: z.iso.date().nullable(),
    verifiedBy: z.string().min(1).nullable(),
    relations: z.array(relationSchema),
  })
  .strict()
  .superRefine((entry, ctx) => {
    const cap = CONFIDENCE_CAP[entry.confidenceBasis];
    if (entry.confidence > cap) {
      ctx.addIssue({
        code: "custom",
        path: ["confidence"],
        message: `Confidence on basis ${entry.confidenceBasis} is capped at ${cap}.`,
      });
    }
    if (entry.status === "verified" && (entry.verifiedAt === null || entry.verifiedBy === null)) {
      ctx.addIssue({
        code: "custom",
        path: ["verifiedAt"],
        message: "A verified entry records when and by whom.",
      });
    }
    if (entry.kind === "reference") {
      if (entry.sources.some((source) => source.license !== "link-only")) {
        ctx.addIssue({
          code: "custom",
          path: ["sources"],
          message: "A reference keeps outside work as a link only.",
        });
      }
    }
    if (entry.relations.some((relation) => relation.to === entry.id)) {
      ctx.addIssue({
        code: "custom",
        path: ["relations"],
        message: "An entry cannot relate to itself.",
      });
    }
  });

export type KnowledgeEntry = z.infer<typeof knowledgeEntrySchema>;
export type KnowledgeTopic = z.infer<typeof knowledgeTopicSchema>;
export type PersonalityAxis = z.infer<typeof personalityAxisSchema>;

/** Days after its last check that an entry needs a person to look again. */
export const REVIEW_AFTER_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * fresh: checked within REVIEW_AFTER_DAYS of `today`. stale: older. unverified: never checked.
 * `today` is an ISO date passed in, so the answer is reproducible.
 */
export function freshness(
  entry: Pick<KnowledgeEntry, "verifiedAt">,
  today: string,
): "fresh" | "stale" | "unverified" {
  if (entry.verifiedAt === null) return "unverified";
  const age = (Date.parse(today) - Date.parse(entry.verifiedAt)) / DAY_MS;
  if (Number.isNaN(age)) throw new Error(`knowledge: not an ISO date: ${today}`);
  return age > REVIEW_AFTER_DAYS ? "stale" : "fresh";
}

export type CorpusIssue = {
  id: string;
  problem: "duplicate-id" | "unknown-relation" | "relation-to-retired" | "supersede-cycle";
  detail: string;
};

/**
 * Checks a set of entries as a whole: ids are unique, every relation points at an entry
 * in the set, live entries do not lean on retired ones, and supersedes never loops.
 * Returns the problems in a stable order; an empty list means the corpus holds together.
 */
export function checkCorpus(entries: readonly KnowledgeEntry[]): CorpusIssue[] {
  const issues: CorpusIssue[] = [];
  const byId = new Map<string, KnowledgeEntry>();
  for (const entry of entries) {
    if (byId.has(entry.id)) {
      issues.push({ id: entry.id, problem: "duplicate-id", detail: `${entry.id} appears twice.` });
    } else {
      byId.set(entry.id, entry);
    }
  }
  for (const entry of byId.values()) {
    for (const relation of entry.relations) {
      const target = byId.get(relation.to);
      if (target === undefined) {
        issues.push({
          id: entry.id,
          problem: "unknown-relation",
          detail: `${entry.id} ${relation.type} ${relation.to}, which is not in the corpus.`,
        });
      } else if (
        target.status === "retired" &&
        entry.status !== "retired" &&
        relation.type !== "supersedes"
      ) {
        issues.push({
          id: entry.id,
          problem: "relation-to-retired",
          detail: `${entry.id} ${relation.type} ${relation.to}, which is retired.`,
        });
      }
    }
  }
  const supersedes = (id: string): string[] =>
    (byId.get(id)?.relations ?? []).filter((r) => r.type === "supersedes").map((r) => r.to);
  for (const start of byId.keys()) {
    const seen = new Set<string>();
    const stack = supersedes(start);
    for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
      if (next === start) {
        issues.push({
          id: start,
          problem: "supersede-cycle",
          detail: `${start} ends up superseding itself.`,
        });
        break;
      }
      if (seen.has(next)) continue;
      seen.add(next);
      stack.push(...supersedes(next));
    }
  }
  return issues.sort((a, b) =>
    a.id === b.id ? a.problem.localeCompare(b.problem) : a.id.localeCompare(b.id),
  );
}
