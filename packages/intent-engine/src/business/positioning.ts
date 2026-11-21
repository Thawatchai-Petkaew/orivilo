import { z } from "zod";
import type { IntakeAnswers } from "./intake";
import { BUSINESS_ANSWER_KEYS } from "./reading";

/**
 * The positioning choice contract, the gate and the draft record (ORV-285 tech notes sections 3, 4.2
 * and 5.1; spec `positioning-choice-1`, `positioning-gate-1`, `positioning-stale-1`,
 * `positioning-draft-1`). One check the client wrapper, the server action and the service share.
 * Pure code, no AI.
 */

export const POSITIONING_STATEMENT_MAX = 300;

/** Postgres refuses U+0000 in a text column: dropped before the trim, as `checkIntake` does (row 27). */
const NUL = "\u0000";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const projectId = z.string().regex(UUID);
const draftId = z.string().regex(UUID);
const option = z.number().int().min(1).max(3);
// The raw cap keeps a padded payload cheap to parse; a trimmed statement at its bound fits under it.
const statement = z
  .string()
  .max(2000)
  .transform((s) => s.replaceAll(NUL, "").trim())
  .pipe(z.string().min(1).max(POSITIONING_STATEMENT_MAX));

const choiceInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("picked"), projectId, draftId, option }).strict(),
  z.object({ kind: z.literal("edited"), projectId, draftId, option, statement }).strict(),
  z.object({ kind: z.literal("written"), projectId, statement }).strict(),
  z.object({ kind: z.literal("skipped"), projectId }).strict(),
]);

/** The checked choice. A `statement` is trimmed; length is counted in UTF-16 units, as `checkIntake`. */
export type ChoiceInput = z.infer<typeof choiceInputSchema>;

export type ChoiceProblem = {
  /** The dotted path of the field (`statement`, `draftId`, `by`); empty when the input is no object. */
  path: string;
  kind: "required" | "too-long" | "invalid" | "unknown-key";
};

export type ChoiceCheck =
  { ok: true; choice: ChoiceInput } | { ok: false; problems: ChoiceProblem[] };

const valueAt = (source: unknown, path: ReadonlyArray<PropertyKey>): unknown =>
  path.reduce<unknown>(
    (at, key) =>
      typeof at === "object" && at !== null ? (at as Record<PropertyKey, unknown>)[key] : undefined,
    source,
  );

/**
 * Checks what the person sent. Never throws. A problem carries a path and a kind, never the value,
 * so a refusal can be logged and returned without the person's words. An unrecognised key gives one
 * problem at the key's own name.
 */
export function checkChoice(input: unknown): ChoiceCheck {
  const parsed = choiceInputSchema.safeParse(input);
  if (parsed.success) return { ok: true, choice: parsed.data };
  const problems: ChoiceProblem[] = [];
  const seen = new Set<string>();
  const add = (problem: ChoiceProblem) => {
    const id = `${problem.path}:${problem.kind}`;
    if (seen.has(id)) return;
    seen.add(id);
    problems.push(problem);
  };
  for (const issue of parsed.error.issues) {
    const path = issue.path.map(String).join(".");
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys)
        add({ path: [...issue.path, key].join("."), kind: "unknown-key" });
    } else if (issue.path.length === 0) {
      add({ path, kind: "invalid" });
    } else if (path === "statement" && issue.code === "too_big") {
      add({ path, kind: "too-long" });
    } else if (path === "statement" && issue.code === "too_small") {
      add({ path, kind: "required" });
    } else if (valueAt(input, issue.path) === undefined) {
      add({ path, kind: "required" });
    } else {
      add({ path, kind: "invalid" });
    }
  }
  return { ok: false, problems };
}

/** W4: an edit equal to its option after the trim is saved as `picked`, else as `edited`. */
export function settleEdit(optionStatement: string, text: string): "picked" | "edited" {
  return text.trim() === optionStatement ? "picked" : "edited";
}

const iso = z.iso.datetime();
const base = { id: z.string().min(1), intakeId: z.string().min(1), createdAt: iso };
const text = z.string().min(1).max(POSITIONING_STATEMENT_MAX);

/**
 * A choice row read back. Each arm holds exactly the columns of its kind, as the table's shape check
 * does, so a row changed outside the app fails here and never shows as an unchecked statement.
 */
export const storedChoiceSchema = z.discriminatedUnion("kind", [
  z
    .object({
      ...base,
      kind: z.literal("picked"),
      statement: text,
      draftId: z.string().min(1),
      option,
    })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal("edited"),
      statement: text,
      draftId: z.string().min(1),
      option,
    })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal("written"),
      statement: text,
      draftId: z.null(),
      option: z.null(),
    })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal("skipped"),
      statement: z.null(),
      draftId: z.null(),
      option: z.null(),
    })
    .strict(),
]);

export type StoredChoice = z.infer<typeof storedChoiceSchema>;

export type GateState = "open" | "awaiting-choice" | "given" | "confirmed";

/**
 * `positioning-gate-1` and `positioning-stale-1` as code. `choice` is the project's newest choice
 * row; `draftOfNewest` is whether a draft of the newest intake is stored.
 */
export function positioningGate(input: {
  newestIntakeId: string;
  choice: StoredChoice | null;
  draftOfNewest: boolean;
}): { state: GateState; skipped: boolean; stale: boolean } {
  const c = input.choice;
  const on = c !== null && c.intakeId === input.newestIntakeId;
  if (on && c.kind === "skipped") return { state: "open", skipped: true, stale: false };
  if (on && c.kind === "written") return { state: "given", skipped: false, stale: false };
  if (on) return { state: "confirmed", skipped: false, stale: false };
  return {
    state: input.draftOfNewest ? "awaiting-choice" : "open",
    skipped: false,
    stale: c !== null && c.kind !== "skipped", // positioning-stale-1
  };
}

/** The one job a draft is saved under; the table's `job` column holds it. */
export const POSITIONING_DRAFT_JOB = "positioning-draft";

const quoteRecord = z
  .object({
    answer: z.enum(BUSINESS_ANSWER_KEYS),
    /** The first place the text occurs in the answer. */
    start: z.number().int().min(0),
    end: z.number(),
    text: z.string().min(1).max(300),
  })
  .strict();

const optionRecord = z
  .object({
    statement: z.string().min(1).max(POSITIONING_STATEMENT_MAX),
    // No minimum: an option with no quote has none on `value` or `idea`, which the check below refuses.
    quotes: z.array(quoteRecord).max(8),
  })
  .strict();

/**
 * One saved draft: the job, the model and adapter that made it, the prompt version, the intake it
 * answers and the checked options in the model's order (option n is index n - 1). A draft is never a
 * value: only a choice row holds a statement the gate counts.
 */
export const positioningDraftSchema = z
  .object({
    job: z.literal(POSITIONING_DRAFT_JOB),
    intakeId: z.string().min(1).max(100),
    modelId: z.string().min(1).max(200),
    adapter: z
      .object({ id: z.string().min(1).max(40), version: z.string().min(1).max(40) })
      .strict(),
    promptVersion: z.string().min(1).max(40),
    options: z.array(optionRecord).min(2).max(3),
  })
  .strict()
  .superRefine((draft, ctx) => {
    const bad = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", message, path });
    const seen = new Set<string>();
    draft.options.forEach((option, at) => {
      option.quotes.forEach((quote, q) => {
        if (quote.end - quote.start !== quote.text.length) {
          bad(["options", at, "quotes", q], "a span as long as its text");
        }
      });
      for (const answer of ["value", "idea"] as const) {
        if (!option.quotes.some((quote) => quote.answer === answer)) {
          bad(["options", at, "quotes"], `a quote on ${answer}`);
        }
      }
      const text = option.statement.trim();
      if (seen.has(text)) bad(["options", at, "statement"], "a statement of its own");
      seen.add(text);
    });
  });

export type PositioningDraft = z.infer<typeof positioningDraftSchema>;

/** A draft read back with its row id, which a `picked` or `edited` choice names. */
export type StoredDraft = PositioningDraft & { id: string };

/**
 * Whether every quote of every option is at its place in the saved answers. The service runs it
 * after each read, so a row changed outside the app opens as invalid, never as unchecked quotes.
 */
export function checkDraftAgainst(draft: PositioningDraft, intake: IntakeAnswers): boolean {
  return draft.options.every((option) =>
    option.quotes.every(
      (quote) => intake[quote.answer]?.slice(quote.start, quote.end) === quote.text,
    ),
  );
}
