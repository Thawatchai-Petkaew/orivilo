import { describe, expect, it, vi } from "vitest";
import type { InputEvidence } from "../evidence";
import { evidenceId, inputEvidenceSchema } from "../evidence";
import type { Complete } from "../llm-interpreter";
import { BUSINESS_READ_MODEL, modelReading, readBusiness, ruleBasedReading } from "./read";
import {
  FIXTURE_ANSWER,
  FIXTURE_INTAKE,
  FIXTURE_INTAKE_ID,
  FIXTURE_SAVED_AT,
} from "./read-fixtures";
import {
  BUSINESS_ANSWER_KEYS,
  BUSINESS_READ_FIELDS,
  BUSINESS_READ_REASONS,
  businessReadingSchema,
} from "./reading";

// ORV-281 tech notes section 8.4, "The record"; ORV-283 spec row 32 (the data half): the record a
// reading is saved and replayed as. One test per clause of `businessReadingSchema`.

const { createHash } = (await vi.importActual("node:crypto")) as {
  createHash(algorithm: "sha256"): { update(s: string, enc: "utf8"): { digest(e: "hex"): string } };
};
const sha256Text = (text: string): string =>
  createHash("sha256").update(text, "utf8").digest("hex");

const complete: Complete = () => Promise.resolve(JSON.stringify(FIXTURE_ANSWER));
const { items } = await readBusiness(
  { intake: FIXTURE_INTAKE, intakeId: FIXTURE_INTAKE_ID, savedAt: FIXTURE_SAVED_AT },
  { complete, sha256Text, model: BUSINESS_READ_MODEL },
);
const record = (): Record<string, unknown> =>
  JSON.parse(JSON.stringify(modelReading(FIXTURE_INTAKE_ID, BUSINESS_READ_MODEL, items))) as Record<
    string,
    unknown
  >;
const ok = (x: unknown): boolean => businessReadingSchema.safeParse(x).success;
const asItems = (x: Record<string, unknown>): InputEvidence[] => x["items"] as InputEvidence[];

/** Re-seals an item after a change that the id covers (the id is a hash of the content). */
const sealed = (item: InputEvidence): InputEvidence => ({ ...item, id: evidenceId(item) });

describe("the closed lists", () => {
  it("the seven read fields and the six answer keys, in order", () => {
    expect(BUSINESS_READ_FIELDS).toEqual([
      "situation.name",
      "business-core.offer",
      "business-core.why",
      "audience.customers",
      "audience.problem",
      "competitive-frame.category",
      "competitive-frame.alternatives",
    ]);
    expect(BUSINESS_ANSWER_KEYS).toEqual([
      "idea",
      "industry",
      "customers",
      "problem",
      "competitors",
      "value",
    ]);
  });

  it("the four reasons, in order", () => {
    expect(BUSINESS_READ_REASONS).toEqual([
      "ai-not-configured",
      "ai-failed",
      "ai-rate-limited",
      "ai-spend-cap",
    ]);
  });
});

describe("a rule-based record", () => {
  it.each(BUSINESS_READ_REASONS)("holds the reason %s and nothing else", (reason) => {
    const r = ruleBasedReading(FIXTURE_INTAKE_ID, reason);
    expect(r).toEqual({
      method: "rule-based",
      job: "business-read",
      intakeId: FIXTURE_INTAKE_ID,
      reason,
    });
    expect(businessReadingSchema.parse(JSON.parse(JSON.stringify(r)))).toEqual(r);
  });

  it("refuses a reason outside the four, no reason, items, a model id and another job", () => {
    const base = ruleBasedReading(FIXTURE_INTAKE_ID, "ai-failed");
    expect(ok(base)).toBe(true);
    expect(ok({ ...base, reason: "timeout" })).toBe(false);
    const noReason = Object.fromEntries(Object.entries(base).filter(([key]) => key !== "reason"));
    expect(ok(noReason)).toBe(false);
    expect(ok({ ...base, items: [] })).toBe(false);
    expect(ok({ ...base, modelId: BUSINESS_READ_MODEL })).toBe(false);
    expect(ok({ ...base, job: "interpret" })).toBe(false);
    expect(ok({ ...base, intakeId: "" })).toBe(false);
  });
});

describe("a model record", () => {
  it("parses and round-trips through JSON", () => {
    expect(ok(record())).toBe(true);
    const parsed = businessReadingSchema.parse(record());
    expect(businessReadingSchema.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(parsed);
  });

  it("holds no reason, no other key, and the one job", () => {
    expect(ok({ ...record(), reason: "ai-failed" })).toBe(false);
    expect(ok({ ...record(), extra: 1 })).toBe(false);
    expect(ok({ ...record(), job: "interpret" })).toBe(false);
    expect(ok({ ...record(), method: "other" })).toBe(false);
  });

  it("bounds: no items is valid, 200 items are valid, 201 are not", () => {
    expect(ok({ ...record(), items: [] })).toBe(true);
    const span = items.find((i) => i.reading === null) as InputEvidence;
    const many = (n: number) =>
      Array.from({ length: n }, (_, i) =>
        sealed({
          ...span,
          source: {
            ...span.source,
            locator: { kind: "text", path: "answer.idea", start: i, end: i + 1 },
          },
        }),
      );
    expect(ok({ ...record(), items: many(200) })).toBe(true);
    expect(ok({ ...record(), items: many(201) })).toBe(false);
  });

  it("bounds the intake id, the model id, the adapter and the prompt version", () => {
    // No items, so only the record's own bound can refuse: the items would refuse a long model id too.
    const bare = (over: Record<string, unknown>) => ({ ...record(), items: [], ...over });
    expect(ok(bare({}))).toBe(true);
    expect(ok(bare({ intakeId: "" }))).toBe(false);
    expect(ok(bare({ intakeId: "i".repeat(100) }))).toBe(true);
    expect(ok(bare({ intakeId: "i".repeat(101) }))).toBe(false);
    expect(ok(bare({ modelId: "" }))).toBe(false);
    expect(ok(bare({ modelId: "m".repeat(100) }))).toBe(true);
    expect(ok(bare({ modelId: "m".repeat(101) }))).toBe(false);
    expect(ok(bare({ promptVersion: "" }))).toBe(false);
    expect(ok(bare({ promptVersion: "p".repeat(40) }))).toBe(true);
    expect(ok(bare({ promptVersion: "p".repeat(41) }))).toBe(false);
    expect(ok(bare({ adapter: { id: "business-read", version: "" } }))).toBe(false);
    expect(ok(bare({ adapter: { id: "business-read", version: "v".repeat(20) } }))).toBe(true);
    expect(ok(bare({ adapter: { id: "business-read", version: "v".repeat(21) } }))).toBe(false);
    expect(ok(bare({ adapter: { id: "Business Read", version: "1" } }))).toBe(false);
  });

  it("refuses an item the evidence schema refuses", () => {
    const bad = { ...asItems(record())[0], confidence: { value: 2 } };
    expect(ok({ ...record(), items: [bad] })).toBe(false);
  });

  it("clause: every reading item's target is one of the seven", () => {
    const first = items.find((i) => i.reading !== null) as InputEvidence;
    const withTarget = (target: string, value: object) =>
      sealed({ ...first, reading: { target, value, by: "model" } as InputEvidence["reading"] });
    const listWith = (x: InputEvidence) =>
      asItems(record()).map((i) => (i.id === first.id ? x : i));
    // Valid evidence on its own, so the record's own clause is what refuses it.
    const other = withTarget("situation.competitors", { name: "x" });
    expect(inputEvidenceSchema.safeParse(other).success).toBe(true);
    expect(ok({ ...record(), items: listWith(other) })).toBe(false);
    const inside = withTarget("audience.problem", { text: "x" });
    expect(inputEvidenceSchema.safeParse(inside).success).toBe(true);
    expect(ok({ ...record(), items: listWith(inside) })).toBe(true);
  });

  it("clause: every item names the intake it read", () => {
    const first = items.find((i) => i.reading === null) as InputEvidence;
    for (const ref of ["intake:another", "intake:", FIXTURE_INTAKE_ID]) {
      const moved = sealed({ ...first, source: { ...first.source, ref } });
      expect(ok({ ...record(), items: [moved] })).toBe(false);
    }
    const reading = items.find((i) => i.reading !== null) as InputEvidence;
    const moved = sealed({ ...reading, source: { ...reading.source, ref: "intake:another" } });
    const list = asItems(record()).map((i) => (i.id === reading.id ? moved : i));
    expect(ok({ ...record(), items: list })).toBe(false);
  });

  it("clause: each basedOn id is a span item in the list", () => {
    const reading = items.find((i) => i.reading !== null) as InputEvidence;
    const other = items.find((i) => i.reading !== null && i.id !== reading.id) as InputEvidence;
    const swap = (basedOn: string[]) =>
      asItems(record()).map((i) => (i.id === reading.id ? { ...i, basedOn } : i));
    expect(ok({ ...record(), items: swap([...reading.basedOn]) })).toBe(true);
    // An id that is in no item.
    expect(ok({ ...record(), items: swap(["00000000"]) })).toBe(false);
    // An id that is a reading item, not a span item.
    expect(ok({ ...record(), items: swap([...reading.basedOn, other.id].sort()) })).toBe(false);
    // A span dropped from the list: its readings point at nothing.
    const gone = reading.basedOn[0];
    const list = asItems(record()).filter((i) => i.id !== gone);
    expect(ok({ ...record(), items: list })).toBe(false);
  });

  it("clause: each model item's model id equals the record's", () => {
    expect(ok({ ...record(), modelId: "anthropic/claude-sonnet-5.4" })).toBe(false);
  });

  it("clause: each model item's adapter id and version equal the record's", () => {
    expect(ok({ ...record(), adapter: { id: "business-reader", version: "1" } })).toBe(false);
    expect(ok({ ...record(), adapter: { id: "business-read", version: "2" } })).toBe(false);
  });

  it("clause: every reading item holds the business-read job", () => {
    const reading = items.find((i) => i.reading !== null) as InputEvidence;
    const other = sealed({
      ...reading,
      model: { ...(reading.model as NonNullable<InputEvidence["model"]>), job: "interpret" },
    });
    const list = asItems(record()).map((i) => (i.id === reading.id ? other : i));
    expect(ok({ ...record(), items: list })).toBe(false);
  });
});
