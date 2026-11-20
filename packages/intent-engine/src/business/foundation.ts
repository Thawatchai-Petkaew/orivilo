import { z } from "zod";
import { PERSONALITY_AXES } from "../knowledge";
import { ANSWER_MAX_CHARS, RAW_MAX_CHARS } from "./intake";

/**
 * The foundation entry contract (ORV-291 tech notes section 3; spec `foundation-entry-1`). One check
 * the client wrapper, the node views, the server action and the service share. Pure code, no AI.
 * PR 1 holds the node `identity-frame`, PR 2 adds `architecture` and `name`; the arm of `core-idea`
 * comes with PR 3.
 */

/** The bound of a working name, in UTF-16 units (ORV-126 "Rules and bounds", Inventory; W5). */
export const WORKING_NAME_MAX = 60;

/** The stored value of each point of a personality scale, on ORV-20's 0 to 100 range (W3). */
export const AXIS_VALUES = [0, 25, 50, 75, 100] as const;
export type AxisValue = (typeof AXIS_VALUES)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const projectId = z.string().regex(UUID);
// U+0000 is dropped, then the text is trimmed, as checkIntake does; the raw cap keeps a padded payload cheap.
const clean = (s: string) => s.replaceAll("\u0000", "").trim();
// Length is counted in UTF-16 units as `checkIntake` counts it; zod's own `max` counts code points.
const within = (max: number) => z.string().refine((s) => s.length <= max);
const required = (max: number) =>
  within(RAW_MAX_CHARS)
    .transform(clean)
    .pipe(z.string().min(1).pipe(within(max)));
const optional = (max: number) =>
  within(RAW_MAX_CHARS).transform(clean).pipe(within(max)).optional();
// An optional answer that is empty after the trim is not given: no key, never an empty string.
const withoutEmpty = <T extends Record<string, unknown>>(payload: T): T =>
  // The filter only removes keys, so the result still fits T's optional keys.
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== "")) as T;

const axisValue = z.literal([...AXIS_VALUES]);
const axes = z
  .object(Object.fromEntries(PERSONALITY_AXES.map((axis) => [axis, axisValue])) as AxesShape)
  .strict();
type AxesShape = Record<(typeof PERSONALITY_AXES)[number], typeof axisValue>;
const none = z.object({}).strict();

const identityEntry = z.discriminatedUnion("kind", [
  z
    .object({
      projectId,
      node: z.literal("identity-frame"),
      kind: z.literal("given"),
      payload: z
        .object({ axes, person: optional(ANSWER_MAX_CHARS), never: optional(ANSWER_MAX_CHARS) })
        .strict()
        .transform(withoutEmpty),
    })
    .strict(),
  z
    .object({
      projectId,
      node: z.literal("identity-frame"),
      kind: z.literal("skipped"),
      payload: none,
    })
    .strict(),
]);

// `architecture-derive-1`: one answer, not skippable.
const architectureEntry = z.discriminatedUnion("kind", [
  z
    .object({
      projectId,
      node: z.literal("architecture"),
      kind: z.literal("answered"),
      payload: z.object({ subBrands: z.boolean() }).strict(),
    })
    .strict(),
]);

// `working-name-1`: the person's own text, given only, not skippable.
const nameEntry = z.discriminatedUnion("kind", [
  z
    .object({
      projectId,
      node: z.literal("name"),
      kind: z.literal("given"),
      payload: z.object({ name: required(WORKING_NAME_MAX) }).strict(),
    })
    .strict(),
]);

// PR 3 adds the arm of `core-idea` here.
const entryInputSchema = z.discriminatedUnion("node", [
  identityEntry,
  architectureEntry,
  nameEntry,
]);

/** The checked entry. Answers are trimmed; length is counted in UTF-16 units, as `checkIntake`. */
export type EntryInput = z.infer<typeof entryInputSchema>;

/** An entry as a screen sends it: `EntryInput` without the project, which the caller knows. */
export type EntryRequest = EntryInput extends infer E
  ? E extends unknown
    ? Omit<E, "projectId">
    : never
  : never;

export type EntryProblem = {
  /** The dotted path of the field (`payload.person`, `kind`); empty when the input is no object. */
  path: string;
  kind: "required" | "too-long" | "invalid" | "unknown-key";
};

export type EntryCheck = { ok: true; entry: EntryInput } | { ok: false; problems: EntryProblem[] };

/**
 * The text paths: a failed length bound there gives `too-long`, a text that is empty after the trim
 * (`too_small`) gives `required`.
 */
const TEXT_PATHS: readonly string[] = ["payload.person", "payload.never", "payload.name"];

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
export function checkEntry(input: unknown): EntryCheck {
  const parsed = entryInputSchema.safeParse(input);
  if (parsed.success) return { ok: true, entry: parsed.data };
  const problems: EntryProblem[] = [];
  const add = (problem: EntryProblem) => problems.push(problem);
  for (const issue of parsed.error.issues) {
    const path = issue.path.map(String).join(".");
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys)
        add({ path: [...issue.path, key].join("."), kind: "unknown-key" });
    } else if (issue.path.length === 0) {
      add({ path, kind: "invalid" });
    } else if (TEXT_PATHS.includes(path) && issue.code === "custom") {
      // On a text path the only custom check is the length bound.
      add({ path, kind: "too-long" });
    } else if (TEXT_PATHS.includes(path) && issue.code === "too_small") {
      add({ path, kind: "required" });
    } else if (valueAt(input, issue.path) === undefined) {
      add({ path, kind: "required" });
    } else {
      add({ path, kind: "invalid" });
    }
  }
  return { ok: false, problems };
}

const iso = z.iso.datetime();
const base = { id: z.string().min(1), createdAt: iso };
const storedText = z.string().min(1).pipe(within(ANSWER_MAX_CHARS));
const storedName = z.string().min(1).pipe(within(WORKING_NAME_MAX));

/**
 * A row read back: the same arms with exact bounds and no transform (a stored text is already
 * clean). A row that fails it is `invalid-stored`, as a choice is.
 */
export const storedEntrySchema = z.discriminatedUnion("node", [
  z.discriminatedUnion("kind", [
    z
      .object({
        ...base,
        node: z.literal("identity-frame"),
        kind: z.literal("given"),
        payload: z
          .object({ axes, person: storedText.optional(), never: storedText.optional() })
          .strict(),
      })
      .strict(),
    z
      .object({
        ...base,
        node: z.literal("identity-frame"),
        kind: z.literal("skipped"),
        payload: none,
      })
      .strict(),
  ]),
  z
    .object({
      ...base,
      node: z.literal("architecture"),
      kind: z.literal("answered"),
      payload: z.object({ subBrands: z.boolean() }).strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      node: z.literal("name"),
      kind: z.literal("given"),
      payload: z.object({ name: storedName }).strict(),
    })
    .strict(),
]);

export type StoredEntry = z.infer<typeof storedEntrySchema>;

/** The newest entry of each node, typed by its node: the slot of a node holds that node's entry. */
export type NewestByNode = {
  [N in StoredEntry["node"]]: Extract<StoredEntry, { node: N }> | null;
};

/** The newest entry of each node (`created_at` desc, then `id` desc), or null. Order-independent. */
export function newestByNode(entries: readonly StoredEntry[]): NewestByNode {
  const newest: Record<StoredEntry["node"], StoredEntry | null> = {
    "identity-frame": null,
    architecture: null,
    name: null,
  };
  for (const entry of entries) {
    const at = newest[entry.node];
    if (at === null || isNewer(entry, at)) newest[entry.node] = entry;
  }
  // Each slot is only ever filled from an entry of its own node, which the loop's key guarantees.
  return newest as NewestByNode;
}

/**
 * Later `createdAt` wins. `createdAt` reaches the engine in milliseconds while the table orders by
 * microseconds, so on equal times the given entry is the newer: the table holds one entry per kind
 * and refuses a skip once a given entry is saved, so a given entry is never the older one. The
 * larger `id` decides only between two entries of one kind, which the table does not hold.
 */
function isNewer(a: StoredEntry, b: StoredEntry): boolean {
  const byTime = Date.parse(a.createdAt) - Date.parse(b.createdAt);
  if (byTime !== 0) return byTime > 0;
  const aSkipped = a.kind === "skipped";
  return aSkipped === (b.kind === "skipped") ? a.id > b.id : !aSkipped;
}
