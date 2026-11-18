import { describe, expect, it } from "vitest";
import { webMessages } from "../../i18n/messages";
import { signInLine } from "./sign-in-line";

const { en, th } = webMessages;
const labels = (m: typeof en) => ({
  account: m.account,
  wait: m.wait,
  failure: m.failure,
});

// ORV-122 row 11 and ORV-123 rows 5 and 6: the line under the button, both locales.
describe("the sign-in line", () => {
  it("is empty before any refusal", () => {
    expect(signInLine(null, labels(en))).toBeNull();
  });

  it("says the reason, then the retry sentence with the wait, in English", () => {
    expect(
      signInLine(
        {
          error: "rate-limited",
          code: "RATE_LIMITED",
          requestId: "r1",
          retryAfter: 180,
          retryable: true,
        },
        labels(en),
      ),
    ).toEqual({
      reason: "Too many sign-in attempts from this network.",
      retry: "Try again in 3 minutes.",
    });
  });

  it("says the reason, then the retry sentence with the wait, in Thai", () => {
    expect(
      signInLine(
        {
          error: "rate-limited",
          code: "RATE_LIMITED",
          requestId: "r1",
          retryAfter: 180,
          retryable: true,
        },
        labels(th),
      ),
    ).toEqual({
      reason: "มีการลงชื่อเข้าใช้จากเครือข่ายนี้ถี่เกินไป",
      retry: "ลองใหม่ได้ในอีก 3 นาที",
    });
  });

  it("falls back to the plain failure line", () => {
    expect(
      signInLine(
        { error: "failed", code: "SERVICE_UNAVAILABLE", requestId: "r1", retryable: true },
        labels(en),
      ),
    ).toEqual({ reason: en.account.failed });
    expect(
      signInLine(
        {
          error: "rate-limited",
          code: "RATE_LIMITED",
          requestId: "r1",
          retryAfter: 0,
          retryable: true,
        },
        labels(th),
      ),
    ).toEqual({
      reason: th.account.failed,
    });
    expect(th.account.failed).not.toBe(th.saved.errors.failed);
  });

  // ORV-144 row 15: the reference line for INTERNAL_ERROR only.
  it("an INTERNAL_ERROR state shows the reference, English and Thai", () => {
    const state = {
      error: "failed",
      code: "INTERNAL_ERROR",
      requestId: "req-77",
      retryable: false,
    } as const;
    expect(signInLine(state, labels(en))).toEqual({
      reason: en.account.failed,
      reference: "Reference: req-77",
    });
    expect(signInLine(state, labels(th))).toEqual({
      reason: th.account.failed,
      reference: "รหัสอ้างอิง: req-77",
    });
  });

  it("gives no reference for SERVICE_UNAVAILABLE or a rate limit", () => {
    const unavailable = {
      error: "failed",
      code: "SERVICE_UNAVAILABLE",
      requestId: "req-77",
      retryable: true,
    } as const;
    const limited = {
      error: "rate-limited",
      code: "RATE_LIMITED",
      requestId: "req-77",
      retryAfter: 60,
      retryable: true,
    } as const;
    expect(signInLine(unavailable, labels(en))).not.toHaveProperty("reference");
    expect(signInLine(limited, labels(en))).not.toHaveProperty("reference");
    // A rate limit whose wait is unusable falls back to the failure line, still without a reference.
    expect(signInLine({ ...limited, retryAfter: 0 }, labels(en))).toEqual({
      reason: en.account.failed,
    });
  });
});

// ORV-286 signin-message-1: a failed sign-in is the line before any press; an action state replaces it.
describe("the sign-in line after a failed sign-in", () => {
  it("is the callback line, with no retry or reference, in both locales", () => {
    expect(signInLine(null, labels(en), true)).toEqual({ reason: en.account.callbackFailed });
    expect(signInLine(null, labels(th), true)).toEqual({ reason: th.account.callbackFailed });
  });

  it("stays empty when the sign-in did not fail", () => {
    expect(signInLine(null, labels(en), false)).toBeNull();
    expect(signInLine(null, labels(en))).toBeNull();
  });

  it("gives way to the action's own line once the action returned a state", () => {
    expect(
      signInLine(
        { error: "failed", code: "SERVICE_UNAVAILABLE", requestId: "r1", retryable: true },
        labels(en),
        true,
      ),
    ).toEqual({ reason: en.account.failed });
  });
});
