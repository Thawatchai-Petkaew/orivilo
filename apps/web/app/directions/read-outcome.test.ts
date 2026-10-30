import type { Interpretation } from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import { webMessages } from "../../i18n/messages";
import { readingResult } from "./read-outcome";

const { errors } = webMessages.en.saved;
const { wait, failure } = webMessages.en;
const reading = { id: "r" } as unknown as Interpretation;
const ID = "5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f";

// ORV-112 rows 5 and 8: a refusal by a rate limit is a studio notice and never a card notice.
describe("readingResult", () => {
  it("keeps a checked reading and its seal", () => {
    expect(
      readingResult({ ok: true, value: { reading, seal: "s" } }, errors, wait, failure),
    ).toEqual({
      reading,
      seal: "s",
    });
  });

  it.each(["ai-rate-limited", "rate-limited"] as const)("%s yields only a notice", (error) => {
    const result = readingResult(
      {
        ok: false,
        error,
        code: "RATE_LIMITED",
        requestId: ID,
        retryAfter: 720,
        retryable: true,
      },
      errors,
      wait,
      failure,
    );
    expect(result).toEqual({ notice: expect.stringContaining("12 minutes") });
    expect(result).not.toHaveProperty("cardLines");
    expect(JSON.stringify(result)).not.toContain("{wait}");
  });

  it("leaves a plain AI failure to the studio, with no card notice", () => {
    expect(
      readingResult(
        {
          ok: false,
          error: "ai-failed",
          code: "UPSTREAM_FAILED",
          requestId: ID,
          retryable: true,
        },
        errors,
        wait,
        failure,
      ),
    ).toEqual({
      reading: null,
      cardLines: null,
    });
  });

  it("gives a setup problem its own words in the card", () => {
    expect(
      readingResult(
        {
          ok: false,
          error: "ai-not-configured",
          code: "INTERNAL_ERROR",
          requestId: ID,
          retryable: false,
        },
        errors,
        wait,
        failure,
      ),
    ).toEqual({
      reading: null,
      cardLines: [errors["ai-not-configured"], `Reference: ${ID}`],
    });
  });

  it("gives a Thai setup problem its Thai reference line", () => {
    const th = webMessages.th;
    expect(
      readingResult(
        {
          ok: false,
          error: "ai-not-configured",
          code: "INTERNAL_ERROR",
          requestId: ID,
          retryable: false,
        },
        th.saved.errors,
        th.wait,
        th.failure,
      ),
    ).toEqual({
      reading: null,
      cardLines: [th.saved.errors["ai-not-configured"], `รหัสอ้างอิง: ${ID}`],
    });
  });
});
