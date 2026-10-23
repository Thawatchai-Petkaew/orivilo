/** Home and End move only the focused thumb of a RangeSlider, on the step grid (ORV-77, AC 2 and 4). */
import { describe, expect, it } from "vitest";
import { jumpRange } from "./range";

const b = { min: 0, max: 100, step: 1, minGap: 0 };

describe("jumpRange", () => {
  it("sends the lower thumb to the minimum or up to the upper thumb", () => {
    expect(jumpRange([20, 60], 0, "home", b)).toEqual([0, 60]);
    expect(jumpRange([20, 60], 0, "end", b)).toEqual([60, 60]);
  });

  it("sends the upper thumb to the maximum or down to the lower thumb", () => {
    expect(jumpRange([20, 60], 1, "end", b)).toEqual([20, 100]);
    expect(jumpRange([20, 60], 1, "home", b)).toEqual([20, 20]);
  });

  it("keeps the gap, counted in steps", () => {
    expect(jumpRange([20, 60], 0, "end", { ...b, minGap: 10 })).toEqual([50, 60]);
    expect(jumpRange([20, 60], 1, "home", { ...b, minGap: 10 })).toEqual([20, 30]);
  });

  it("never moves a thumb backwards when it already sits inside the gap", () => {
    expect(jumpRange([55, 60], 0, "end", { ...b, minGap: 10 })).toEqual([55, 60]);
    expect(jumpRange([55, 60], 1, "home", { ...b, minGap: 10 })).toEqual([55, 60]);
  });

  it("lands on the step grid when the range is not a multiple of the step", () => {
    const grid = { min: 0, max: 10, step: 3, minGap: 0 };
    expect(jumpRange([0, 3], 1, "end", grid)).toEqual([0, 9]);
    expect(jumpRange([0, 10], 1, "end", grid)).toEqual([0, 10]);
  });

  it("keeps decimal steps exact", () => {
    const fine = { min: 0, max: 1, step: 0.1, minGap: 3 };
    expect(jumpRange([0.2, 0.7], 0, "end", fine)).toEqual([0.4, 0.7]);
    expect(jumpRange([0.2, 0.7], 1, "home", fine)).toEqual([0.2, 0.5]);
  });
});
