import { describe, expect, it } from "vitest";
import {
  BRIEF_MAX_LENGTH,
  RULE_VALUES,
  interpretBrief,
  interpretWithRules,
  interpretationSchema,
  ruleBasedInterpreter,
  type InterpreterAdapter,
  type Interpretation,
} from "./interpreter";
import { resolveProfile } from "./resolver";
import { briefFactsSchema } from "./rules";

const read = (text: string) => interpretWithRules({ text });

// The handoff's end-to-end brief (§18).
const STAY =
  "ค้นหาที่พักครอบครัว เลือกวันและจำนวนผู้เข้าพัก ดูแผนที่ได้ อบอุ่น อ่านง่าย ไม่เน้นโปรโมชั่น";

describe("interpretWithRules", () => {
  it("reads the handoff's stay brief and says what it did not understand", () => {
    const result = read(STAY);
    expect(result.method).toBe("rule-based");
    expect(result.facts).toEqual({
      personality: { warm: RULE_VALUES.desired },
      industry: "travel",
      audiences: ["families"],
      avoid: ["promotions"],
    });
    expect(result.uncertain.map((u) => [u.reason, u.evidence[0]?.text])).toEqual([
      ["not-understood", "เลือกวันและจำนวนผู้เข้าพัก"],
      ["not-understood", "ดูแผนที่ได้"],
      ["not-understood", "อ่านง่าย"],
    ]);
    expect(result.missing).toEqual(["playful", "expressive", "structured", "premium"]);
  });

  it('tells "not too fun" from "very fun" from "not fun"', () => {
    const playful = (text: string) => read(text).facts.personality.playful;
    expect(playful("อยากให้สนุกมาก")).toBe(RULE_VALUES.intensified);
    expect(playful("อยากให้สนุก")).toBe(RULE_VALUES.desired);
    expect(playful("ไม่อยากให้สนุกเกินไป")).toBe(RULE_VALUES.notTooMuch);
    expect(playful("ไม่สนุก")).toBe(RULE_VALUES.avoided);
    expect(playful("Very fun")).toBe(RULE_VALUES.intensified);
    expect(playful("fun, really")).toBe(RULE_VALUES.desired);
    expect(playful("not too playful")).toBe(RULE_VALUES.notTooMuch);
    expect(playful("not playful")).toBe(RULE_VALUES.avoided);
    expect(playful("playful, very much")).toBe(RULE_VALUES.desired);
    expect(playful("playful very much")).toBe(RULE_VALUES.intensified);
  });

  it("keeps a negation inside its own phrase", () => {
    const result = read("ไม่สนุก อบอุ่น");
    expect(result.facts.personality).toEqual({
      playful: RULE_VALUES.avoided,
      warm: RULE_VALUES.desired,
    });
    expect(read("playful not formal").facts.personality).toEqual({ playful: RULE_VALUES.desired });
    expect(read("warm but not playful").facts.personality).toEqual({
      warm: RULE_VALUES.desired,
      playful: RULE_VALUES.avoided,
    });
  });

  it("reads words that ask for less of an axis", () => {
    expect(read("ทางการ").facts.personality).toEqual({ playful: RULE_VALUES.low });
    expect(read("not formal").facts.personality).toEqual({ playful: RULE_VALUES.desired });
    expect(read("minimal and structured").facts.personality).toEqual({
      expressive: RULE_VALUES.low,
      structured: RULE_VALUES.desired,
    });
  });

  it("matches Latin terms as whole words only", () => {
    expect(read("funding").facts.personality).toEqual({});
    expect(read("a design tools company").facts.industry).toBe("design-tools");
    expect(read("a design tools company").findings).toHaveLength(1);
  });

  it("does not match Thai words that only contain a term", () => {
    expect(read("ตกแต่งแบบเรียบร้อย").facts.personality).toEqual({
      structured: RULE_VALUES.desired,
    });
    expect(read("หน้าแรก").uncertain[0]?.reason).toBe("not-understood");
  });

  it("leaves a fact open and says so when the brief disagrees with itself", () => {
    const result = read("สนุก, ทางการ");
    expect(result.facts.personality.playful).toBeUndefined();
    expect(result.uncertain).toEqual([
      {
        reason: "conflicting",
        subject: "personality.playful",
        evidence: [
          { start: 0, end: 4, text: "สนุก" },
          { start: 6, end: 12, text: "ทางการ" },
        ],
      },
    ]);
    const two = read("bank, hotel");
    expect(two.facts.industry).toBeNull();
    expect(two.uncertain[0]?.subject).toBe("industry");
  });

  it("only avoids a trait the brief negates", () => {
    expect(read("มีโปรโมชั่น").facts.avoid).toEqual([]);
    expect(read("no discounts, without flashy").facts.avoid).toEqual(["busy-motion", "promotions"]);
  });

  it("quotes the brief exactly for every finding", () => {
    const text = `  Warm, not too playful.\nไม่เน้นโปรโมชั่น  ${STAY}`;
    const result = read(text);
    for (const span of [
      ...result.findings.map((f) => f.evidence),
      ...result.uncertain.flatMap((u) => u.evidence),
    ]) {
      expect(text.slice(span.start, span.end)).toBe(span.text);
    }
  });

  it("returns output that passes its own schema and feeds the resolver", () => {
    const result = read(STAY);
    expect(interpretationSchema.parse(result)).toEqual(result);
    expect(briefFactsSchema.parse(result.facts)).toEqual(result.facts);
    const resolution = resolveProfile({
      catalogVersion: "catalog-1",
      facts: result.facts,
      locked: {},
      adjustments: [],
      rules: [],
      knowledgeIds: [],
      profiles: [
        {
          id: "friendly",
          decisions: {
            shape: "soft",
            surfaceTreatment: "flat",
            emphasis: "expressive",
            typeVoice: "paired",
            motion: "standard",
          },
        },
      ],
    });
    expect(resolution.status).toBe("needs-input");
  });

  it("gives the same answer every time", () => {
    expect(read(STAY)).toEqual(read(STAY));
  });
});

describe("interpretBrief", () => {
  const fake = (output: unknown, method: "llm" | "rule-based" = "llm"): InterpreterAdapter => ({
    id: "fake-model",
    version: "test-1",
    method,
    interpret: () => Promise.resolve(output),
  });
  const valid = (patch: Partial<Interpretation> = {}): Interpretation => ({
    method: "llm",
    adapter: { id: "fake-model", version: "test-1" },
    facts: { personality: { warm: 80 }, industry: null, audiences: [], avoid: [] },
    findings: [
      {
        field: "personality",
        axis: "warm",
        value: 80,
        polarity: "desired",
        evidence: { start: 0, end: 4, text: "warm" },
      },
    ],
    uncertain: [],
    missing: ["playful", "expressive", "structured", "premium"],
    ...patch,
  });

  it("runs the rule-based adapter and labels it rule-based", async () => {
    const outcome = await interpretBrief(ruleBasedInterpreter, { text: STAY });
    expect(outcome.ok && outcome.interpretation.method).toBe("rule-based");
  });

  it("accepts a model adapter's output only when it parses and quotes the brief", async () => {
    expect(await interpretBrief(fake(valid()), { text: "warm and calm" })).toEqual({
      ok: true,
      interpretation: valid(),
    });
  });

  it("refuses output that makes up a quote", async () => {
    const outcome = await interpretBrief(fake(valid()), { text: "cold and calm" });
    expect(outcome).toMatchObject({ ok: false, error: "evidence-mismatch" });
  });

  it("refuses output outside the schema, such as a confidence score", async () => {
    const outcome = await interpretBrief(fake({ ...valid(), confidence: 0.93 }), { text: "warm" });
    expect(outcome).toMatchObject({ ok: false, error: "invalid-output" });
    const axis = await interpretBrief(
      fake(valid({ facts: { personality: { trust: 90 } } as never })),
      { text: "warm" },
    );
    expect(axis).toMatchObject({ ok: false, error: "invalid-output" });
  });

  it("refuses output that claims another method or adapter", async () => {
    const outcome = await interpretBrief(fake(valid(), "rule-based"), { text: "warm" });
    expect(outcome).toMatchObject({ ok: false, error: "invalid-output" });
    const other = await interpretBrief(
      fake(valid({ adapter: { id: "rules", version: "test-1" } })),
      {
        text: "warm",
      },
    );
    expect(other).toMatchObject({ ok: false, error: "invalid-output" });
  });

  it("reports a failing adapter and an invalid brief instead of throwing", async () => {
    const broken: InterpreterAdapter = {
      ...fake(null),
      interpret: () => Promise.reject(new Error("timeout")),
    };
    expect(await interpretBrief(broken, { text: "warm" })).toEqual({
      ok: false,
      error: "adapter-failed",
      detail: "timeout",
    });
    expect(await interpretBrief(ruleBasedInterpreter, { text: "   " })).toMatchObject({
      ok: false,
      error: "invalid-brief",
    });
    expect(
      await interpretBrief(ruleBasedInterpreter, { text: "x".repeat(BRIEF_MAX_LENGTH + 1) }),
    ).toMatchObject({ ok: false, error: "invalid-brief" });
  });
});
