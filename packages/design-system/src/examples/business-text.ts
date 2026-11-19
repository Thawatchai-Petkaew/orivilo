import {
  BUSINESS_FIELDS,
  type BusinessFieldId,
  type BusinessFieldReading,
  type BusinessNodeId,
  type BusinessReadReason,
  type InputEvidence,
  type IntakeField,
  PROXY_QUESTIONS,
  type ProxyQuestionId,
} from "@orivilo/intent-engine";
import type { EvidenceItem } from "../components/index";
import { DATE_TAGS, type Locale } from "../i18n/locale";
import { fill, type Messages } from "../i18n/messages/index";

/**
 * Looks the engine's keys up in the catalog for the three business screens (ORV-281 tech notes
 * section 9). The engine holds keys, never resolved text; `business-strings.test.ts` proves every
 * key below resolves in both languages and equals the catalog entry the engine names.
 */

type Business = Messages["business"];

const NODE_KEY = {
  situation: "situation",
  "business-core": "businessCore",
  audience: "audience",
  "competitive-frame": "competitiveFrame",
  positioning: "positioning",
} as const satisfies Record<BusinessNodeId, keyof Business["node"]>;

export function nodeTitle(m: Messages, id: BusinessNodeId): string {
  return m.business.node[NODE_KEY[id]];
}

type Tail<T, P extends string> = T extends `${P}${infer K}` ? K : never;
type FieldKey = Tail<(typeof BUSINESS_FIELDS)[number]["labelKey"], "business.field.">;
type QuestionKey = Tail<(typeof PROXY_QUESTIONS)[number]["key"], "business.question.">;

/** Both records are built from the engine's tables, whose keys the two `Tail` types above close. */
const FIELD_KEY = Object.fromEntries(
  BUSINESS_FIELDS.map((f) => [f.id, f.labelKey.slice("business.field.".length)]),
) as Record<BusinessFieldId, FieldKey & keyof Business["field"]>;

const QUESTION_KEY = Object.fromEntries(
  PROXY_QUESTIONS.map((q) => [q.id, q.key.slice("business.question.".length)]),
) as Record<ProxyQuestionId, QuestionKey & keyof Business["question"]>;

export function fieldLabel(m: Messages, field: BusinessFieldId): string {
  return m.business.field[FIELD_KEY[field]];
}

export function questionText(m: Messages, id: ProxyQuestionId): string {
  return m.business.question[QUESTION_KEY[id]];
}

/** The label of each intake field, in the catalog entry `INTAKE_FIELDS` names. */
export function intakeLabel(m: Messages, key: IntakeField): string {
  switch (key) {
    case "projectName":
      return m.business.intake.projectName;
    case "idea":
      return m.business.question.offer;
    case "industry":
      return m.business.intake.industry;
    case "customers":
      return m.business.question.bestCustomer;
    case "problem":
      return m.business.question.problem;
    case "competitors":
      return m.business.question.instead;
    case "value":
      return m.business.question.only;
    case "website":
      return m.business.intake.website;
  }
}

/** The date a project was saved, as `formatReadAt` of the brand report shows a read: Bangkok time. */
export function formatSavedAt(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(DATE_TAGS[locale], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

/** Notes, meta: the `FIELD_NOTE` of the brand report. */
export const FIELD_NOTE = "text-body-sm text-text-secondary";

/** The line `business-read-1` gives for each reason a result has no model reading. */
export function readReasonLine(m: Messages, reason: BusinessReadReason): string {
  switch (reason) {
    case "ai-not-configured":
      return m.business.errors.aiNotConfigured;
    case "ai-failed":
      return m.business.errors.aiFailed;
    case "ai-rate-limited":
      return m.business.errors.aiRateLimited;
    case "ai-spend-cap":
      return m.business.errors.aiSpendCap;
  }
}

/**
 * "Read by AI (model). Check it before you use it." from the catalog key
 * `brandReport.engine["evidence.fromModel"]`, the model the saved record names. The key holds the
 * engine's line word for word (`brand-report-strings.test.ts` pins it), as `belowFloorLine` reads
 * its own (ORV-287 row 8).
 */
export function fromModelNote(m: Messages, modelId: string): string {
  return fill(m.brandReport.engine["evidence.fromModel"], { model: modelId });
}

/**
 * "Too uncertain to use: the text has fewer than 20 words", from the brand report's catalog table of
 * the engine's lines, which holds `evidence.belowFloor` and the `quality.*` reasons.
 */
export function belowFloorLine(m: Messages, reading: BusinessFieldReading): string {
  return fill(m.brandReport.engine["evidence.belowFloor"], {
    reason: reading.quality.map((key) => m.brandReport.engine[key]).join(", "),
  });
}

/** An evidence item as `EvidenceSpan` takes it: a quote of the brief, or none when it is not one. */
export function briefItem(item: InputEvidence): EvidenceItem | undefined {
  return item.inputKind === "brief-text" ? { ...item, inputKind: "brief-text" } : undefined;
}

/** The items of a list that are quotes of the brief. */
export function briefItems(items: readonly InputEvidence[]): EvidenceItem[] {
  return items.flatMap((item) => briefItem(item) ?? []);
}

/**
 * The quotes a reading drew on, as the reading's own: a model reading's quotes say an AI model read
 * them, as its pill card does (ORV-283, row D6). The record keeps each span's own `fromModel`.
 */
export function readingQuotes(reading: BusinessFieldReading): EvidenceItem[] {
  return briefItems(reading.spans).map((item) => ({ ...item, fromModel: reading.item.fromModel }));
}
