import { z } from "zod";
import { inputEvidenceSchema } from "../evidence";
import { slugSchema } from "../knowledge";

/**
 * The record one `business-read` is saved and replayed as (ORV-281 tech notes section 8.4, "The
 * record"; spec `business-saved-1`). Pure: no model, clock or I/O. The service parses a record
 * before the insert and after every read, so a row changed outside the app never shows as a reading.
 */

export const BUSINESS_READ_JOB = "business-read";

/** The six answers the job reads (fields 2 to 7 of `intake-fields-1`), in the order they are sent. */
export const BUSINESS_ANSWER_KEYS = [
  "idea",
  "industry",
  "customers",
  "problem",
  "competitors",
  "value",
] as const;
export type BusinessAnswerKey = (typeof BUSINESS_ANSWER_KEYS)[number];

/** The seven fields marked "reading" or "both" in `business-fields-1`. */
export const BUSINESS_READ_FIELDS = [
  "situation.name",
  "business-core.offer",
  "business-core.why",
  "audience.customers",
  "audience.problem",
  "competitive-frame.category",
  "competitive-frame.alternatives",
] as const;
export type BusinessReadField = (typeof BUSINESS_READ_FIELDS)[number];

/** Why a result has no model reading. Each reason gives one `business.errors.*` string. */
export const BUSINESS_READ_REASONS = [
  "ai-not-configured",
  "ai-failed",
  "ai-rate-limited",
  "ai-spend-cap",
] as const;
export type BusinessReadReason = (typeof BUSINESS_READ_REASONS)[number];

/** 30 readings, each with at most 5 quotes and so at most 5 spans, and the 30 reading items. */
export const BUSINESS_RECORD_MAX_ITEMS = 200;

const intakeId = z.string().min(1).max(100);

const modelRecord = z
  .object({
    method: z.literal("model"),
    job: z.literal(BUSINESS_READ_JOB),
    intakeId,
    modelId: z.string().min(1).max(100),
    adapter: z.object({ id: slugSchema, version: z.string().min(1).max(20) }).strict(),
    promptVersion: z.string().min(1).max(40),
    items: z.array(inputEvidenceSchema).max(BUSINESS_RECORD_MAX_ITEMS),
  })
  .strict();

const ruleBasedRecord = z
  .object({
    method: z.literal("rule-based"),
    job: z.literal(BUSINESS_READ_JOB),
    intakeId,
    reason: z.enum(BUSINESS_READ_REASONS),
  })
  .strict();

const isReadField = (target: string): boolean =>
  (BUSINESS_READ_FIELDS as readonly string[]).includes(target);

export const businessReadingSchema = z
  .discriminatedUnion("method", [modelRecord, ruleBasedRecord])
  .superRefine((record, ctx) => {
    if (record.method !== "model") return;
    const bad = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", message, path });
    const spans = new Set(record.items.filter((i) => i.reading === null).map((i) => i.id));
    record.items.forEach((item, at) => {
      // Every item says which saved answers it read.
      if (item.source.ref !== `intake:${record.intakeId}`) {
        bad(["items", at, "source", "ref"], "the item names this record's intake");
      }
      if (item.reading === null) return;
      // A reading item: on one of the seven, by the job's model and adapter, resting on spans in the list.
      if (!isReadField(item.reading.target)) {
        bad(["items", at, "reading", "target"], "a field the job reads");
      }
      const model = item.model;
      if (model === null || model.job !== BUSINESS_READ_JOB) {
        bad(["items", at, "model", "job"], "the business-read job");
      } else if (
        model.modelId !== record.modelId ||
        model.adapter.id !== record.adapter.id ||
        model.adapter.version !== record.adapter.version
      ) {
        bad(["items", at, "model"], "the record's model and adapter");
      }
      item.basedOn.forEach((id, i) => {
        if (!spans.has(id)) bad(["items", at, "basedOn", i], "a span item of this record");
      });
    });
  });

export type BusinessReading = z.infer<typeof businessReadingSchema>;
