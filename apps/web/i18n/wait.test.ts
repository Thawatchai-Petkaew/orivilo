import { describe, expect, it } from "vitest";
import { webMessages } from "./messages";
import { errorLine, failureLines, formatWait, referenceLine } from "./wait";

// ORV-112 AC 16.
describe("formatWait", () => {
  it.each([
    [1, "1 second", "1 วินาที"],
    [45, "45 seconds", "45 วินาที"],
    [60, "1 minute", "1 นาที"],
    [61, "2 minutes", "2 นาที"],
    [3540, "59 minutes", "59 นาที"],
    [3541, "1 hour", "1 ชั่วโมง"],
    [3599, "1 hour", "1 ชั่วโมง"],
    [3600, "1 hour", "1 ชั่วโมง"],
    [5400, "2 hours", "2 ชั่วโมง"],
  ])("%i seconds", (seconds, en, th) => {
    expect(formatWait(webMessages.en.wait, seconds)).toBe(en);
    expect(formatWait(webMessages.th.wait, seconds)).toBe(th);
  });
});

// ORV-112 rows 5 and 8: the line each refusal shows.
describe("errorLine", () => {
  const line = (l: "en" | "th", error: Parameters<typeof errorLine>[2], retryAfter?: number) =>
    errorLine(webMessages[l].saved.errors, webMessages[l].wait, error, retryAfter);

  it("says the AI limit with the wait in words (row 5)", () => {
    expect(line("en", "ai-rate-limited", 720)).toBe(
      "You have reached the limit for AI readings, so the rules' reading is used. AI can read again in 12 minutes.",
    );
    expect(line("th", "ai-rate-limited", 720)).toBe(
      "ใช้ AI อ่านบรีฟครบจำนวนที่กำหนดแล้ว จึงใช้การอ่านตามกฎแทน อ่านด้วย AI ได้อีกครั้งในอีก 12 นาที",
    );
  });

  it("says the write limit with the wait in words (row 8)", () => {
    expect(line("en", "rate-limited", 240)).toBe(
      "Too many requests in a short time, so this was not done. Try again in 4 minutes.",
    );
    expect(line("th", "rate-limited", 240)).toBe(
      "ส่งคำขอถี่เกินไป จึงยังไม่ได้ทำรายการนี้ ลองใหม่ได้ในอีก 4 นาที",
    );
  });

  it.each([0, -3, Number.NaN, Number.POSITIVE_INFINITY, undefined])(
    "falls back to the plain failure for a wait of %s",
    (retryAfter) => {
      expect(line("en", "rate-limited", retryAfter)).toBe(webMessages.en.saved.errors.failed);
      expect(line("th", "ai-rate-limited", retryAfter)).toBe(webMessages.th.saved.errors.failed);
    },
  );

  it("passes other errors through", () => {
    expect(line("en", "forbidden")).toBe(webMessages.en.saved.errors.forbidden);
  });
});

const ID = "5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f";

// ORV-144 orv144-ui and the worked example "The reference line".
describe("referenceLine", () => {
  it("fills the id for INTERNAL_ERROR only", () => {
    expect(referenceLine(webMessages.en.failure, { code: "INTERNAL_ERROR", requestId: ID })).toBe(
      `Reference: ${ID}`,
    );
    expect(referenceLine(webMessages.th.failure, { code: "INTERNAL_ERROR", requestId: ID })).toBe(
      `รหัสอ้างอิง: ${ID}`,
    );
  });

  it.each([
    "BAD_REQUEST",
    "FORBIDDEN",
    "RATE_LIMITED",
    "UPSTREAM_FAILED",
    "SERVICE_UNAVAILABLE",
  ] as const)("gives none for %s", (code) => {
    expect(referenceLine(webMessages.en.failure, { code, requestId: ID })).toBeNull();
  });
});

describe("failureLines", () => {
  const labels = (l: "en" | "th") => ({
    errors: webMessages[l].saved.errors,
    wait: webMessages[l].wait,
    failure: webMessages[l].failure,
  });

  it("gives the failed line then the reference for INTERNAL_ERROR", () => {
    const outcome = { error: "failed", code: "INTERNAL_ERROR", requestId: ID } as const;
    expect(failureLines(labels("en"), outcome)).toStrictEqual([
      "That did not work. Try again.",
      `Reference: ${ID}`,
    ]);
    expect(failureLines(labels("th"), outcome)).toStrictEqual([
      "ทำไม่สำเร็จ ลองอีกครั้ง",
      `รหัสอ้างอิง: ${ID}`,
    ]);
  });

  it("gives the failed line alone for a code without a reference", () => {
    expect(
      failureLines(labels("en"), { error: "failed", code: "SERVICE_UNAVAILABLE", requestId: ID }),
    ).toStrictEqual(["That did not work. Try again."]);
  });

  it("keeps the wait in words for a rate limit, with no reference", () => {
    expect(
      failureLines(labels("en"), {
        error: "rate-limited",
        code: "RATE_LIMITED",
        requestId: ID,
        retryAfter: 240,
      }),
    ).toStrictEqual([
      "Too many requests in a short time, so this was not done. Try again in 4 minutes.",
    ]);
  });
});
