import { describe, expect, it } from "vitest";
import { z } from "zod";
import { interpretBrief, type Interpretation } from "./interpreter";
import { llmInterpreter, type Complete } from "./llm-interpreter";
import { AI_MODELS } from "./openrouter";

/*
 * ORV-160 row 35 (ORV-178): the one recorder run, replayed. Each entry of the fixture holds a brief,
 * the raw text one model answered on one date, and the outcome the recorder saw. Here that raw text
 * goes back through interpretBrief with a fake model, so no test calls a model or the network
 * (ADR 0009 point 8). The test shows that the code's checks give the same outcome on replay as they
 * gave during the run. It says nothing about how the model answers on another date.
 *
 * A recording is untrusted data: this file reads it, never quotes it, and never puts a raw text in
 * an assertion message.
 */

const FIXTURE_PATH = "./llm-recorded.json?raw";
const OWN_SOURCE_PATH = "./llm-recorded.test.ts?raw";

// `?raw` gives a file's text through vite. The path sits in a variable because this package has no
// vite types and no node types for `fs` (the same route as llm-guardrails.test.ts, row 33).
const readText = async (path: string) =>
  ((await import(/* @vite-ignore */ path)) as { default: string }).default;

const CASE_IDS = [
  "row-1",
  "row-2",
  "row-3",
  "row-4",
  "row-5",
  "row-18",
  "row-27",
  "row-30",
  "row-31",
];

const fixtureSchema = z.object({
  model: z.string(),
  date: z.string(),
  cases: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      raw: z.string().nullable(),
      outcome: z.string(),
    }),
  ),
});

const fixtureText = await readText(FIXTURE_PATH);
const fixture = fixtureSchema.parse(JSON.parse(fixtureText));

/** A fake model that returns the recorded text, or throws when the call never returned one. */
function replayModel(raw: string | null): Complete {
  return () =>
    raw === null ? Promise.reject(new Error("No answer was recorded.")) : Promise.resolve(raw);
}

/** Every evidence span of a reading: the findings' own and each `notUnderstood` entry's. */
function spansOf(reading: Interpretation) {
  return [
    ...reading.findings.map((f) => f.evidence),
    ...reading.uncertain.flatMap((u) => u.evidence),
  ];
}

/** The ids of the entries whose raw text, or its JSON-escaped form, appears in the source. */
function pastedIn(source: string, entries: { id: string; raw: string | null }[]) {
  return entries
    .filter(({ raw }) => {
      if (raw === null) return false;
      return source.includes(raw) || source.includes(JSON.stringify(raw).slice(1, -1));
    })
    .map(({ id }) => id);
}

describe("LLM01:2026 recorded answers replayed (row 35, orv160-recorder-output)", () => {
  it("holds one recording for each of the 9 cases, in order", () => {
    expect(fixture.cases.map((c) => c.id)).toStrictEqual(CASE_IDS);
  });

  let spanCount = 0;

  it.each(CASE_IDS)("%s: the replay gives the outcome the recorder wrote", async (id) => {
    const entry = fixture.cases.find((c) => c.id === id);
    if (!entry) throw new Error(`No recording for ${id}.`);

    const adapter = llmInterpreter(AI_MODELS.interpret, replayModel(entry.raw));
    const outcome = await interpretBrief(adapter, { text: entry.text });

    expect(outcome.ok ? "ok" : outcome.error).toBe(entry.outcome);

    if (outcome.ok) {
      for (const span of spansOf(outcome.interpretation)) {
        expect(entry.text.slice(span.start, span.end)).toBe(span.text);
        spanCount += 1;
      }
    }
  });

  it("checked at least one span across the ok readings", () => {
    expect(spanCount).toBeGreaterThan(0);
  });

  it("holds none of the recorded raw texts in its own source, plain or JSON-escaped", async () => {
    expect(pastedIn(await readText(OWN_SOURCE_PATH), fixture.cases)).toStrictEqual([]);
  });

  it("finds a raw text pasted as plain text or as a double-quoted literal, and ignores null", () => {
    // Built at run time from a hand-written answer, so this file never holds it as one string.
    const handWritten = JSON.stringify({ findings: [], notUnderstood: ["a hand-written quote"] });
    const entries = [
      { id: "kept", raw: handWritten },
      { id: "failed", raw: null },
    ];
    expect(pastedIn("const x = 1;", entries)).toStrictEqual([]);
    expect(pastedIn(`const raw = ${handWritten};`, entries)).toStrictEqual(["kept"]);
    expect(pastedIn(`const raw = ${JSON.stringify(handWritten)};`, entries)).toStrictEqual([
      "kept",
    ]);
  });

  it("holds neither sk-or- nor Bearer in the fixture file", () => {
    expect(fixtureText.includes("sk-or-")).toBe(false);
    expect(fixtureText.includes("Bearer")).toBe(false);
  });
});
