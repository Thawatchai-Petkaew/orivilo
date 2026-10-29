import { describe, expect, it } from "vitest";
import { webMessages } from "../../i18n/messages";
import { signInLine } from "./sign-in-line";

const { en, th } = webMessages;
const labels = (m: typeof en) => ({
  account: m.account,
  wait: m.wait,
});

// ORV-122 row 11 and ORV-123 rows 5 and 6: the line under the button, both locales.
describe("the sign-in line", () => {
  it("is empty before any refusal", () => {
    expect(signInLine(null, labels(en))).toBeNull();
  });

  it("says the reason, then the retry sentence with the wait, in English", () => {
    expect(signInLine({ error: "rate-limited", retryAfter: 180 }, labels(en))).toEqual({
      reason: "Too many sign-in attempts from this network.",
      retry: "Try again in 3 minutes.",
    });
  });

  it("says the reason, then the retry sentence with the wait, in Thai", () => {
    expect(signInLine({ error: "rate-limited", retryAfter: 180 }, labels(th))).toEqual({
      reason: "มีการลงชื่อเข้าใช้จากเครือข่ายนี้ถี่เกินไป",
      retry: "ลองใหม่ได้ในอีก 3 นาที",
    });
  });

  it("falls back to the plain failure line", () => {
    expect(signInLine({ error: "failed" }, labels(en))).toEqual({ reason: en.account.failed });
    expect(signInLine({ error: "rate-limited", retryAfter: 0 }, labels(th))).toEqual({
      reason: th.account.failed,
    });
    expect(th.account.failed).not.toBe(th.saved.errors.failed);
  });
});
