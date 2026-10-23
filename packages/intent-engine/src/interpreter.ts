import { z } from "zod";
import {
  personalityAxisSchema,
  slugSchema,
  PERSONALITY_AXES,
  type PersonalityAxis,
} from "./knowledge";
import { briefFactsSchema, type BriefFacts } from "./rules";

/**
 * Brief interpreter (ORV-33, handoff §12.2 and §17.2, ADR 0008).
 * An adapter reads a written brief and returns facts the rules can use, with the words each fact
 * came from and the parts it did not understand. Every adapter says how it works: the rule-based
 * one shipped here is a fixed word list, not AI, and its output says so. Any adapter's output,
 * a model's included, is data: it is parsed with the same schema and every quoted span is checked
 * against the brief before anything uses it.
 */

export const BRIEF_MAX_LENGTH = 2000;

export const briefSchema = z
  .object({ text: z.string().trim().min(1).max(BRIEF_MAX_LENGTH) })
  .strict();
export type Brief = z.infer<typeof briefSchema>;

/** How an adapter reaches its answer. The UI must show this next to every interpretation. */
export const interpretMethodSchema = z.enum(["rule-based", "llm"]);
export type InterpretMethod = z.infer<typeof interpretMethodSchema>;

const evidenceSchema = z
  .object({
    start: z.number().int().min(0),
    end: z.number().int().min(1),
    text: z.string().min(1),
  })
  .strict()
  .refine((e) => e.end > e.start && e.end - e.start === e.text.length, "Span and text disagree.");

/** One thing the adapter read in the brief, with the exact words it came from. */
export const findingSchema = z.discriminatedUnion("field", [
  z
    .object({
      field: z.literal("personality"),
      axis: personalityAxisSchema,
      value: z.number().int().min(0).max(100),
      polarity: z.enum(["desired", "avoided"]),
      evidence: evidenceSchema,
    })
    .strict(),
  z
    .object({
      field: z.enum(["industry", "audience", "avoid"]),
      value: slugSchema,
      polarity: z.enum(["desired", "avoided"]),
      evidence: evidenceSchema,
    })
    .strict(),
]);
export type Finding = z.infer<typeof findingSchema>;

/** Something the adapter could not settle. It is shown to the person, never guessed. */
export const uncertaintySchema = z
  .object({
    reason: z.enum(["not-understood", "conflicting"]),
    subject: z.string().min(1),
    evidence: z.array(evidenceSchema).min(1),
  })
  .strict();
export type Uncertainty = z.infer<typeof uncertaintySchema>;

export const interpretationSchema = z
  .object({
    method: interpretMethodSchema,
    adapter: z.object({ id: slugSchema, version: z.string().trim().min(1) }).strict(),
    facts: briefFactsSchema,
    findings: z.array(findingSchema),
    uncertain: z.array(uncertaintySchema),
    /** Axes the brief says nothing about, so the Studio can ask. */
    missing: z.array(personalityAxisSchema),
  })
  .strict();
export type Interpretation = z.infer<typeof interpretationSchema>;

/** What every interpreter implements: the rule-based one now, a model-backed one later. */
export interface InterpreterAdapter {
  readonly id: string;
  readonly version: string;
  readonly method: InterpretMethod;
  interpret(brief: Brief): Promise<unknown>;
}

export type InterpretOutcome =
  | { ok: true; interpretation: Interpretation }
  | {
      ok: false;
      error: "invalid-brief" | "adapter-failed" | "invalid-output" | "evidence-mismatch";
      detail: string;
    };

/**
 * Runs an adapter and trusts nothing it returns: the output must parse, must name the adapter and
 * method that produced it, and every quoted span must be the brief's own words.
 */
export async function interpretBrief(
  adapter: InterpreterAdapter,
  input: unknown,
): Promise<InterpretOutcome> {
  const brief = briefSchema.safeParse(input);
  if (!brief.success) {
    return { ok: false, error: "invalid-brief", detail: brief.error.issues[0]?.message ?? "" };
  }
  let raw: unknown;
  try {
    raw = await adapter.interpret(brief.data);
  } catch (error) {
    return {
      ok: false,
      error: "adapter-failed",
      detail: error instanceof Error ? error.message : "The adapter failed.",
    };
  }
  const parsed = interpretationSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: "invalid-output",
      detail: `${issue?.path.join(".") ?? ""}: ${issue?.message ?? ""}`,
    };
  }
  const interpretation = parsed.data;
  if (
    interpretation.method !== adapter.method ||
    interpretation.adapter.id !== adapter.id ||
    interpretation.adapter.version !== adapter.version
  ) {
    return {
      ok: false,
      error: "invalid-output",
      detail: "The output names another adapter or method.",
    };
  }
  const spans = [
    ...interpretation.findings.map((f) => f.evidence),
    ...interpretation.uncertain.flatMap((u) => u.evidence),
  ];
  const text = brief.data.text;
  const bad = spans.find((span) => text.slice(span.start, span.end) !== span.text);
  if (bad) {
    return {
      ok: false,
      error: "evidence-mismatch",
      detail: `"${bad.text}" is not at ${bad.start} in the brief.`,
    };
  }
  return { ok: true, interpretation };
}

/**
 * Turns findings into facts the same way for every adapter: one value per axis or the axis is a
 * conflict, one desired industry or it is a conflict, and avoided traits only where the brief negated
 * them. Conflicts join `uncertain`, so no adapter picks between two readings.
 */
export function assembleInterpretation(
  findings: Finding[],
  notUnderstood: Uncertainty[],
  source: Pick<Interpretation, "method" | "adapter">,
): Interpretation {
  const uncertain = [...notUnderstood];
  const facts: BriefFacts = { personality: {}, industry: null, audiences: [], avoid: [] };

  for (const axis of PERSONALITY_AXES) {
    const about = findings.filter(
      (f): f is Extract<Finding, { field: "personality" }> =>
        f.field === "personality" && f.axis === axis,
    );
    const values = [...new Set(about.map((f) => f.value))];
    if (values.length === 1) facts.personality[axis] = values[0] as number;
    else if (values.length > 1) {
      uncertain.push({
        reason: "conflicting",
        subject: `personality.${axis}`,
        evidence: about.map((f) => f.evidence),
      });
    }
  }

  const industries = findings.filter((f) => f.field === "industry" && f.polarity === "desired");
  const industryIds = [...new Set(industries.map((f) => f.value as string))];
  if (industryIds.length === 1) facts.industry = industryIds[0] as string;
  else if (industryIds.length > 1) {
    uncertain.push({
      reason: "conflicting",
      subject: "industry",
      evidence: industries.map((f) => f.evidence),
    });
  }

  const pick = (field: "audience" | "avoid", polarity: "desired" | "avoided") =>
    [
      ...new Set(
        findings
          .filter((f) => f.field === field && f.polarity === polarity)
          .map((f) => f.value as string),
      ),
    ].sort();
  facts.audiences = pick("audience", "desired");
  facts.avoid = pick("avoid", "avoided");

  uncertain.sort((a, b) => (a.evidence[0]?.start ?? 0) - (b.evidence[0]?.start ?? 0));

  return {
    ...source,
    facts,
    findings,
    uncertain,
    missing: PERSONALITY_AXES.filter((axis) => facts.personality[axis] === undefined),
  };
}

// The rule-based adapter.

/** Words the rule-based adapter knows. A term is matched as written: Thai as a substring, Latin as a whole word. */
export type Lexicon = {
  /** Words that ask for more of an axis. */
  axes: Record<PersonalityAxis, readonly string[]>;
  /** Words that ask for less of an axis, such as "formal" for playful. */
  axesLow: Partial<Record<PersonalityAxis, readonly string[]>>;
  industries: Record<string, readonly string[]>;
  audiences: Record<string, readonly string[]>;
  /** Traits a person can ask to stay away from. They count only when the brief negates them. */
  traits: Record<string, readonly string[]>;
  negations: readonly string[];
  /** "Too" words: negated with one of these, the brief wants a little, not none. */
  moderators: readonly string[];
  intensifiers: readonly string[];
};

export const RULE_LEXICON: Lexicon = {
  axes: {
    playful: ["สนุก", "ขี้เล่น", "สดใส", "fun", "playful", "cheerful"],
    expressive: ["โดดเด่น", "จัดจ้าน", "มีเอกลักษณ์", "bold", "vibrant", "expressive"],
    structured: ["เป็นระเบียบ", "มีโครงสร้าง", "เรียบร้อย", "structured", "organized", "orderly"],
    warm: ["อบอุ่น", "เป็นมิตร", "warm", "friendly", "welcoming"],
    premium: ["หรูหรา", "พรีเมียม", "ระดับสูง", "premium", "luxury", "luxurious", "upscale"],
  },
  axesLow: {
    playful: ["ทางการ", "สุขุม", "จริงจัง", "formal", "serious", "calm"],
    expressive: ["เรียบง่าย", "มินิมอล", "minimal", "understated"],
  },
  industries: {
    finance: ["การเงิน", "ธนาคาร", "finance", "bank", "banking", "fintech"],
    travel: ["ท่องเที่ยว", "ที่พัก", "travel", "hotel", "stay", "stays"],
    healthcare: ["สุขภาพ", "โรงพยาบาล", "คลินิก", "health", "healthcare", "clinic"],
    education: ["การศึกษา", "โรงเรียน", "education", "school", "learning"],
    retail: ["ร้านค้า", "ช้อปปิ้ง", "shop", "shopping", "e-commerce", "retail"],
    "design-tools": ["เครื่องมือออกแบบ", "design tool", "design tools"],
  },
  audiences: {
    families: ["ครอบครัว", "family", "families"],
    kids: ["เด็ก", "kids", "children"],
    teams: ["ทีม", "team", "teams"],
    founders: ["ผู้ก่อตั้ง", "founder", "founders"],
    "older-adults": ["ผู้สูงอายุ", "older adults", "seniors"],
    students: ["นักเรียน", "นักศึกษา", "student", "students"],
  },
  traits: {
    promotions: ["โปรโมชั่น", "ส่วนลด", "promotion", "promotions", "discount", "discounts"],
    "busy-motion": ["แอนิเมชันเยอะ", "เคลื่อนไหวเยอะ", "busy animation", "flashy"],
    clutter: ["รกตา", "แน่นเกินไป", "clutter", "cluttered"],
  },
  negations: ["ไม่", "อย่า", "not", "no", "don't", "avoid", "without"],
  moderators: ["เกินไป", "จนเกิน", "too", "overly"],
  intensifiers: ["มาก", "สุดๆ", "very", "really", "extremely"],
};

/** Values the rule-based adapter gives an axis. Fixed, documented and not a measurement. */
export const RULE_VALUES = {
  intensified: 90,
  desired: 75,
  notTooMuch: 40,
  low: 25,
  avoided: 15,
} as const;

export const RULE_ADAPTER_VERSION = "lexicon-1";

type Clause = { start: number; text: string };

/** Punctuation, a spaced "but" or "and", and any space touching Thai text (Thai separates phrases with a space). */
const CLAUSE_BREAK =
  /[\n.,;!?]|\s+(?:แต่|และ|but|and)\s+|(?<=[\u0E00-\u0E7F])\s+|\s+(?=[\u0E00-\u0E7F])/g;

function clauses(text: string): Clause[] {
  const out: Clause[] = [];
  let last = 0;
  for (const match of text.matchAll(CLAUSE_BREAK)) {
    out.push({ start: last, text: text.slice(last, match.index) });
    last = match.index + match[0].length;
  }
  out.push({ start: last, text: text.slice(last) });
  return out
    .map((c) => {
      const lead = c.text.length - c.text.trimStart().length;
      return { start: c.start + lead, text: c.text.trim() };
    })
    .filter((c) => c.text.length > 0);
}

const isLatin = (term: string) => /^[\x20-\x7e]+$/.test(term);
const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every place a term occurs in a clause, Latin terms as whole words and case-insensitive. */
function occurrences(clause: string, term: string): number[] {
  const pattern = isLatin(term)
    ? new RegExp(`(?<![A-Za-z])${escape(term)}(?![A-Za-z])`, "gi")
    : new RegExp(escape(term), "g");
  return [...clause.matchAll(pattern)].map((m) => m.index);
}

function hasAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => occurrences(text, term).length > 0);
}

type Hit = { kind: string; key: string; low: boolean; start: number; end: number };

function hits(clause: string, lexicon: Lexicon): Hit[] {
  const groups: [string, Record<string, readonly string[]>, boolean][] = [
    ["axis", lexicon.axes, false],
    ["axis", lexicon.axesLow as Record<string, readonly string[]>, true],
    ["industry", lexicon.industries, false],
    ["audience", lexicon.audiences, false],
    ["trait", lexicon.traits, false],
  ];
  const found: Hit[] = [];
  for (const [kind, table, low] of groups) {
    for (const [key, terms] of Object.entries(table)) {
      for (const term of terms) {
        for (const at of occurrences(clause, term)) {
          found.push({ kind, key, low, start: at, end: at + term.length });
        }
      }
    }
  }
  // Keep the longest term where two overlap ("design tools" over "design tool").
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: Hit[] = [];
  for (const hit of found) {
    const prev = kept.at(-1);
    if (prev && hit.start < prev.end) continue;
    kept.push(hit);
  }
  return kept;
}

/** Reads a brief with a fixed word list. Deterministic: the same text gives the same answer. */
export function interpretWithRules(brief: Brief, lexicon: Lexicon = RULE_LEXICON): Interpretation {
  const text = brief.text;
  const findings: Finding[] = [];
  const uncertain: Uncertainty[] = [];

  for (const clause of clauses(text)) {
    const clauseHits = hits(clause.text, lexicon);
    if (clauseHits.length === 0) {
      uncertain.push({
        reason: "not-understood",
        subject: "clause",
        evidence: [
          { start: clause.start, end: clause.start + clause.text.length, text: clause.text },
        ],
      });
      continue;
    }
    for (const hit of clauseHits) {
      const before = clause.text.slice(0, hit.start);
      const after = clause.text.slice(hit.end);
      const rest = `${before} ${after}`;
      const negated = hasAny(before, lexicon.negations);
      const moderated = negated && hasAny(rest, lexicon.moderators);
      const intensified = !negated && hasAny(rest, lexicon.intensifiers);
      const evidence = {
        start: clause.start + hit.start,
        end: clause.start + hit.end,
        text: clause.text.slice(hit.start, hit.end),
      };
      const polarity = negated ? ("avoided" as const) : ("desired" as const);
      if (hit.kind === "axis") {
        const wantsMore = hit.low === negated;
        const value = wantsMore
          ? intensified
            ? RULE_VALUES.intensified
            : RULE_VALUES.desired
          : moderated
            ? RULE_VALUES.notTooMuch
            : hit.low
              ? RULE_VALUES.low
              : RULE_VALUES.avoided;
        findings.push({
          field: "personality",
          axis: hit.key as PersonalityAxis,
          value,
          polarity,
          evidence,
        });
      } else {
        const field = hit.kind === "trait" ? "avoid" : (hit.kind as "industry" | "audience");
        findings.push({ field, value: hit.key, polarity, evidence });
      }
    }
  }

  return assembleInterpretation(findings, uncertain, {
    method: "rule-based",
    adapter: { id: "rules", version: RULE_ADAPTER_VERSION },
  });
}

/** The rule-based interpreter as an adapter. Its method is "rule-based", and the UI must say so. */
export const ruleBasedInterpreter: InterpreterAdapter = {
  id: "rules",
  version: RULE_ADAPTER_VERSION,
  method: "rule-based",
  interpret: (brief) => Promise.resolve(interpretWithRules(brief)),
};
