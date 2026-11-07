import { describe, expect, it } from "vitest";
import { RULE_VALUES } from "./interpreter";
import { leanOfValue, leansOfMeasures } from "./leans";

const summary = (w: number, c: number) =>
  leansOfMeasures({ warmShare: w, meanChroma: c })
    .map((l) => `${l.axis} ${l.lean}`)
    .join(", ") || "none";

describe("value-to-lean-1", () => {
  const expected: Record<string, ["high" | "low", boolean]> = {
    intensified: ["high", false],
    desired: ["high", false],
    notTooMuch: ["low", true],
    low: ["low", false],
    avoided: ["low", false],
  };
  it.each(Object.entries(RULE_VALUES))("maps %s (%i)", (key, value) => {
    const r = leanOfValue(value);
    expect([r.lean, r.hypothesis]).toEqual(expected[key]);
    expect(r.note === null).toBe(!r.hypothesis);
  });
  it("covers every RULE_VALUES entry", () => {
    expect(Object.keys(expected).sort()).toEqual(Object.keys(RULE_VALUES).sort());
  });
  it("notes the 40 hypothesis within 200 characters", () => {
    const note = leanOfValue(RULE_VALUES.notTooMuch).note ?? "";
    expect(note).toContain("value-to-lean-1");
    expect(note.length).toBeLessThanOrEqual(200);
  });
});

describe("measure-to-lean-1", () => {
  it.each([
    [0.7, 0.05, "warm high"],
    [0.5, 0.1, "warm high, expressive high"],
    [0.499, 0.02, "expressive low"],
    [0.2, 0.06, "none"],
  ])("warm %f chroma %f gives %s", (w, c, want) => {
    expect(summary(w, c)).toBe(want);
  });
  it("marks every measured lean a hypothesis with a note naming the rule", () => {
    for (const l of leansOfMeasures({ warmShare: 0.9, meanChroma: 0.2 })) {
      expect(l.hypothesis).toBe(true);
      expect(l.note).toContain("measure-to-lean-1");
      expect(l.note.length).toBeLessThanOrEqual(200);
    }
  });
  it("compares in thousandths, not raw floats", () => {
    // 0.1 - 0.0000000000000001 style drift: the spec's 0.09999999999999998 is 0.1 in thousandths
    expect(summary(0, 0.09999999999999998)).toBe("expressive high");
    expect(summary(0.49999999999999994, 0.020000000000000004)).toBe("warm high, expressive low");
  });
});
