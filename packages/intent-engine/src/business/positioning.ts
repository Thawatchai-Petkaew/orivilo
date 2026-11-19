import { z } from "zod";

/**
 * The positioning choice contract and the gate (ORV-285 tech notes sections 3 and 5.1; spec
 * `positioning-choice-1`, `positioning-gate-1`, `positioning-stale-1`). One check the client wrapper,
 * the server action and the service share. Pure code, no AI.
 */

export const POSITIONING_STATEMENT_MAX = 300;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const projectId = z.string().regex(UUID);
const draftId = z.string().regex(UUID);
const option = z.number().int().min(1).max(3);
// The raw cap keeps a padded payload cheap to parse; a trimmed statement at its bound fits under it.
const statement = z
  .string()
  .max(2000)
  .transform((s) => s.trim())
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
