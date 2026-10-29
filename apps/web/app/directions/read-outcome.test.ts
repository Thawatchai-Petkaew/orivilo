import type { Interpretation } from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import { webMessages } from "../../i18n/messages";
import { readingResult } from "./read-outcome";

const { errors } = webMessages.en.saved;
const { wait } = webMessages.en;
const reading = { id: "r" } as unknown as Interpretation;

// ORV-112 rows 5 and 8: a refusal by a rate limit is a studio notice and never a card notice.
describe("readingResult", () => {
  it("keeps a checked reading and its seal", () => {
    expect(readingResult({ ok: true, value: { reading, seal: "s" } }, errors, wait)).toEqual({
      reading,
      seal: "s",
    });
  });

  it.each(["ai-rate-limited", "rate-limited"] as const)("%s yields only a notice", (error) => {
    const result = readingResult(
      { ok: false, error, code: "RATE_LIMITED", retryAfter: 720, retryable: true },
      errors,
      wait,
    );
    expect(result).toEqual({ notice: expect.stringContaining("12 minutes") });
    expect(result).not.toHaveProperty("cardNotice");
    expect(JSON.stringify(result)).not.toContain("{wait}");
  });

  // ORV-121 row 2: the over-cap outcome is a studio notice in the person's language (C1), never a card notice.
  it.each(["en", "th"] as const)("a spent AI budget yields only a notice (%s)", (locale) => {
    const { errors: localized } = webMessages[locale].saved;
    const result = readingResult(
      { ok: false, error: "ai-spend-cap", code: "AI_SPEND_CAP", retryable: false },
      localized,
      webMessages[locale].wait,
    );
    expect(result).toEqual({ notice: localized["ai-spend-cap"] });
    expect(result).not.toHaveProperty("cardNotice");
  });

  it("leaves a plain AI failure to the studio, with no card notice", () => {
    expect(readingResult({ ok: false, error: "ai-failed" }, errors, wait)).toEqual({
      reading: null,
      cardNotice: null,
    });
  });

  it("gives a setup problem its own words in the card", () => {
    expect(readingResult({ ok: false, error: "ai-not-configured" }, errors, wait)).toEqual({
      reading: null,
      cardNotice: errors["ai-not-configured"],
    });
  });
});
