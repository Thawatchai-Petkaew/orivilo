import { describe, expect, it } from "vitest";
import { BRIEF_MAX_LENGTH, interpretBrief } from "./interpreter";
import { LLM_SYSTEM_PROMPT, llmInterpreter, type Complete } from "./llm-interpreter";
import { AI_MODELS } from "./openrouter";

/*
 * ORV-160 guardrail rows that run on a fake model (orv160-form). The model answers below are
 * written by hand in the shape the schema asks for. They are not recordings of a real call: CI has
 * no key and no test calls a model or the network (ADR 0009 point 8). A row proves that the code
 * holds a bound, not that the model resists an attack. Later slices add their rows to this file.
 */

const MODEL = AI_MODELS.interpret;

/** A fake model call that answers with a fixed text and counts its calls. */
function fake(answer: unknown) {
  const calls: Parameters<Complete>[0][] = [];
  const complete: Complete = (request) => {
    calls.push(request);
    return Promise.resolve(JSON.stringify(answer));
  };
  return { calls, adapter: llmInterpreter(MODEL, complete) };
}

const EMPTY_READING = { findings: [], notUnderstood: [] };

describe("brief size (row 19, orv160-bound-brief)", () => {
  it("reads a brief of 2000 Thai characters and refuses one of 2001 before any model call", async () => {
    expect(BRIEF_MAX_LENGTH).toBe(2000);

    const atBound = fake(EMPTY_READING);
    const ok = await interpretBrief(atBound.adapter, { text: "ก".repeat(2000) });
    expect(ok.ok).toBe(true);
    expect(atBound.calls).toHaveLength(1);

    const over = fake(EMPTY_READING);
    const refused = await interpretBrief(over.adapter, { text: "ก".repeat(2001) });
    expect(refused).toMatchObject({ ok: false, error: "invalid-brief" });
    expect(over.calls).toHaveLength(0);
  });
});

describe("quote size (row 20, orv160-bound-quote)", () => {
  it("accepts a quote of 200 characters and fails the reading on 201", async () => {
    const text = "x".repeat(201);

    const atBound = fake({ findings: [], notUnderstood: ["x".repeat(200)] });
    expect((await interpretBrief(atBound.adapter, { text })).ok).toBe(true);

    const over = fake({ findings: [], notUnderstood: ["x".repeat(201)] });
    expect(await interpretBrief(over.adapter, { text })).toMatchObject({
      ok: false,
      error: "adapter-failed",
    });
  });
});

// The brief "fun, very fun" holds "fun" twice, so a quote of "fun" repeated 40 or 41 times still
// finds a place each time (worked example "Repeated quotes": the lookup wraps to the first place).
const REPEATED = "fun, very fun";
const funFinding = { field: "personality", axis: "playful", level: "desired", quote: "fun" };

describe("finding count (row 21, orv160-bound-findings)", () => {
  it("accepts 40 findings and fails the reading on 41", async () => {
    const atBound = fake({
      findings: Array.from({ length: 40 }, () => funFinding),
      notUnderstood: [],
    });
    expect((await interpretBrief(atBound.adapter, { text: REPEATED })).ok).toBe(true);

    const over = fake({
      findings: Array.from({ length: 41 }, () => funFinding),
      notUnderstood: [],
    });
    expect(await interpretBrief(over.adapter, { text: REPEATED })).toMatchObject({
      ok: false,
      error: "adapter-failed",
    });
  });
});

describe("not-understood count (row 22, orv160-bound-not-understood)", () => {
  it("accepts 20 quotes and fails the reading on 21", async () => {
    const atBound = fake({ findings: [], notUnderstood: Array.from({ length: 20 }, () => "fun") });
    expect((await interpretBrief(atBound.adapter, { text: REPEATED })).ok).toBe(true);

    const over = fake({ findings: [], notUnderstood: Array.from({ length: 21 }, () => "fun") });
    expect(await interpretBrief(over.adapter, { text: REPEATED })).toMatchObject({
      ok: false,
      error: "adapter-failed",
    });
  });
});

// The 11 markers of orv160-prompt-hygiene, compared against the lowercased prompt.
const PROMPT_MARKERS = [
  "sk-or-",
  "bearer",
  "api key",
  "secret",
  "password",
  "openrouter",
  "process.env",
  "workspace",
  "organization",
  "permission",
  "@",
] as const;

const markersIn = (prompt: string) =>
  PROMPT_MARKERS.filter((marker) => prompt.toLowerCase().includes(marker));

describe("nothing secret in the prompt (row 29, orv160-prompt-hygiene)", () => {
  it("holds no marker", () => {
    expect(PROMPT_MARKERS).toHaveLength(11);
    expect(markersIn(LLM_SYSTEM_PROMPT)).toEqual([]);
  });

  it.each(PROMPT_MARKERS)("the check finds the marker %s when the prompt holds it", (marker) => {
    expect(markersIn(`${LLM_SYSTEM_PROMPT}\nKey: ${marker.toUpperCase()}v1-0000`)).toEqual([
      marker,
    ]);
  });
});
