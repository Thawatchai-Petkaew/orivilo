import { z } from "zod";
import { URL_MAX_CHARS } from "../evidence";
import type { ProxyQuestionId } from "./questions";

/**
 * The business intake contract (ORV-281 tech notes section 3; spec `intake-fields-1` and
 * `website-input-1`). One check the form and the server action share. Pure code, no AI.
 */

export const INTAKE_VERSION = "intake-1";

/** Raw cap before the trim: keeps a padded payload cheap to parse. A trimmed answer always fits. */
export const RAW_MAX_CHARS = 8000;
export const NAME_MAX_CHARS = 120;
export const ANSWER_MAX_CHARS = 2000;

/** The eight fields of `intake-fields-1`, in its order. `place` is where a given answer lands. */
export const INTAKE_FIELDS = [
  {
    key: "projectName",
    question: "business.intake.projectName",
    required: true,
    max: NAME_MAX_CHARS,
    place: null,
    proxy: null,
  },
  {
    key: "idea",
    question: "business.question.offer",
    required: true,
    max: ANSWER_MAX_CHARS,
    place: { node: "business-core", field: "offer" },
    proxy: "business-core.proxy.offer",
  },
  {
    key: "industry",
    question: "business.intake.industry",
    required: false,
    max: ANSWER_MAX_CHARS,
    place: { node: "situation", field: "industry" },
    proxy: null,
  },
  {
    key: "customers",
    question: "business.question.bestCustomer",
    required: false,
    max: ANSWER_MAX_CHARS,
    place: { node: "audience", field: "customers" },
    proxy: "audience.proxy.best-customer",
  },
  {
    key: "problem",
    question: "business.question.problem",
    required: false,
    max: ANSWER_MAX_CHARS,
    place: { node: "audience", field: "problem" },
    proxy: "audience.proxy.problem",
  },
  {
    key: "competitors",
    question: "business.question.instead",
    required: false,
    max: ANSWER_MAX_CHARS,
    place: { node: "competitive-frame", field: "alternatives" },
    proxy: "competitive-frame.proxy.instead",
  },
  {
    key: "value",
    question: "business.question.only",
    required: false,
    max: ANSWER_MAX_CHARS,
    place: { node: "positioning", field: "value" },
    proxy: "positioning.proxy.only",
  },
  {
    key: "website",
    question: "business.intake.website",
    required: false,
    max: URL_MAX_CHARS,
    place: { node: "situation", field: "website" },
    proxy: null,
  },
] as const satisfies ReadonlyArray<{
  key: string;
  question: string;
  required: boolean;
  max: number;
  place: { node: string; field: string } | null;
  proxy: ProxyQuestionId | null;
}>;

export type IntakeField = (typeof INTAKE_FIELDS)[number]["key"];

const KEYS = INTAKE_FIELDS.map((f) => f.key);

const raw = z.string().max(RAW_MAX_CHARS).optional();

/** What the form sends: eight optional strings, nothing else. An unknown key fails the input. */
export const intakeInputSchema = z
  .object({
    projectName: raw,
    idea: raw,
    industry: raw,
    customers: raw,
    problem: raw,
    competitors: raw,
    value: raw,
    website: raw,
  })
  .strict();

export type IntakeProblem = {
  /** Null only for `unknown-key`. */
  field: IntakeField | null;
  kind: "required" | "too-long" | "website" | "unknown-key";
};

/** The checked intake. A field that was not given is left out, never empty or undefined. */
export type IntakeAnswers = {
  idea: string;
  industry?: string | undefined;
  customers?: string | undefined;
  problem?: string | undefined;
  competitors?: string | undefined;
  value?: string | undefined;
  website?: string | undefined;
};

export type Intake = IntakeAnswers & { projectName: string };

export type WebsiteResult = { ok: true; href: string | null } | { ok: false };

const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/** Postgres refuses U+0000 in a text column and no form sends it by intent: dropped before the trim. */
const NUL = "\u0000";

/**
 * `website-input-1`: trim; empty is not given (`href` null); put `https://` in front when there is
 * no scheme; keep the parser's `href` only for http or https, within 2,048 characters, with no
 * credentials. Nothing is fetched.
 */
export function websiteOf(text: string): WebsiteResult {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true, href: null };
  const candidate = SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (candidate.length > URL_MAX_CHARS) return { ok: false };
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false };
  if (url.username !== "" || url.password !== "") return { ok: false };
  return { ok: true, href: url.href };
}

export type IntakeCheck = { ok: true; intake: Intake } | { ok: false; problems: IntakeProblem[] };

const isKey = (value: unknown): value is IntakeField =>
  typeof value === "string" && (KEYS as string[]).includes(value);

/**
 * Checks what the form sent. Never throws. A problem carries a field and a kind, never the value,
 * so a refusal can be logged and returned without the person's words. U+0000 is dropped from each
 * value before the trim. A value that is not a string
 * is reported as `required`: the answer in the form the field takes is missing.
 */
export function checkIntake(input: unknown): IntakeCheck {
  const source: unknown =
    typeof input === "object" && input !== null && !Array.isArray(input) ? input : {};
  const parsed = intakeInputSchema.safeParse(source);
  if (!parsed.success) {
    const problems: IntakeProblem[] = [];
    const seen = new Set<string>();
    const add = (problem: IntakeProblem) => {
      const id = `${problem.field}:${problem.kind}`;
      if (seen.has(id)) return;
      seen.add(id);
      problems.push(problem);
    };
    for (const issue of parsed.error.issues) {
      const head = issue.path[0];
      if (issue.code === "unrecognized_keys") add({ field: null, kind: "unknown-key" });
      else if (isKey(head))
        add({ field: head, kind: issue.code === "too_big" ? "too-long" : "required" });
    }
    return { ok: false, problems };
  }

  const problems: IntakeProblem[] = [];
  const intake: Record<string, string> = {};
  for (const field of INTAKE_FIELDS) {
    const text = (parsed.data[field.key] ?? "").replaceAll(NUL, "").trim();
    if (text === "") {
      if (field.required) problems.push({ field: field.key, kind: "required" });
      continue;
    }
    if (field.key === "website") {
      const site = websiteOf(text);
      if (!site.ok || site.href === null) problems.push({ field: "website", kind: "website" });
      else intake.website = site.href;
      continue;
    }
    if (text.length > field.max) {
      problems.push({ field: field.key, kind: "too-long" });
      continue;
    }
    intake[field.key] = text;
  }
  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, intake: intake as Intake };
}

const answer = z.string().min(1).max(ANSWER_MAX_CHARS);

/**
 * The stored form: the same shape without the name (it lives on `project`), versioned. The service
 * parses it again on every read, so a row changed outside the app fails, never shows as unchecked
 * text. The website must be exactly what `websiteOf` keeps.
 */
export const storedIntakeSchema = z
  .object({
    version: z.literal(INTAKE_VERSION),
    idea: answer,
    industry: answer.optional(),
    customers: answer.optional(),
    problem: answer.optional(),
    competitors: answer.optional(),
    value: answer.optional(),
    // `websiteOf` holds the 1 and 2,048 character bounds: an empty or longer text is refused by it.
    website: z
      .string()
      .refine((w) => {
        const site = websiteOf(w);
        return site.ok && site.href === w;
      })
      .optional(),
  })
  .strict();

export type StoredIntake = z.infer<typeof storedIntakeSchema>;
