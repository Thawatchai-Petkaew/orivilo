import { describe, expect, it } from "vitest";
import { webMessages } from "../../i18n/messages";
import { signInLine } from "./sign-in-line";

const { en, th } = webMessages;
const labels = (m: typeof en) => ({
  account: m.account,
  wait: m.wait,
  failed: m.saved.errors.failed,
});

// ORV-122 row 11: the line under the button, both locales.
describe("the sign-in line", () => {
  it("is empty before any refusal", () => {
    expect(signInLine(null, labels(en))).toBeNull();
  });

  it("says the wait in English", () => {
    expect(signInLine({ error: "rate-limited", retryAfter: 180 }, labels(en))).toBe(
      "Too many sign-in attempts from this network. Try again in 3 minutes.",
    );
  });

  it("says the wait in Thai", () => {
    expect(signInLine({ error: "rate-limited", retryAfter: 180 }, labels(th))).toBe(
      "มีการลงชื่อเข้าใช้จากเครือข่ายนี้ถี่เกินไป ลองใหม่ได้ในอีก 3 นาที",
    );
  });

  it("falls back to the plain failure line", () => {
    expect(signInLine({ error: "failed" }, labels(en))).toBe(en.saved.errors.failed);
    expect(signInLine({ error: "rate-limited", retryAfter: 0 }, labels(th))).toBe(
      th.saved.errors.failed,
    );
  });
});
