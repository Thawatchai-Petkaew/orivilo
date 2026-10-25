import { describe, expect, it } from "vitest";
import { webMessages } from "./messages";
import { formatWait } from "./wait";

// ORV-112 AC 16.
describe("formatWait", () => {
  it.each([
    [1, "1 second", "1 วินาที"],
    [45, "45 seconds", "45 วินาที"],
    [60, "1 minute", "1 นาที"],
    [61, "2 minutes", "2 นาที"],
    [3600, "1 hour", "1 ชั่วโมง"],
    [5400, "2 hours", "2 ชั่วโมง"],
  ])("%i seconds", (seconds, en, th) => {
    expect(formatWait(webMessages.en.wait, seconds)).toBe(en);
    expect(formatWait(webMessages.th.wait, seconds)).toBe(th);
  });
});
