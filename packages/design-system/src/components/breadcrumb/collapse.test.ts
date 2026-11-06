import { describe, expect, it } from "vitest";
import { collapseTrail } from "./collapse";

describe("collapseTrail (ORV-229, crumb-collapse-1, worked example W1)", () => {
  it.each([
    [3, 4, [0, 1, 2], []],
    [4, 4, [0, 1, 2, 3], []],
    [6, 4, [0, 3, 4, 5], [1, 2]],
    [6, 0, [0, 1, 2, 3, 4, 5], []],
    [6, 1, [0, 5], [1, 2, 3, 4]],
    [5, 2.5, [0, 2, 3, 4], [1]],
  ])("%i crumbs at maxVisible %f keep %j and hide %j", (count, max, kept, hidden) => {
    expect(collapseTrail(count, max)).toEqual({ kept, hidden });
  });

  it("reads no argument, a negative number and NaN as the default of 4", () => {
    const four = collapseTrail(6, 4);
    expect(collapseTrail(6)).toEqual(four);
    expect(collapseTrail(6, -1)).toEqual(four);
    expect(collapseTrail(6, Number.NaN)).toEqual(four);
  });

  it("hides nothing in an empty trail", () => {
    expect(collapseTrail(0, 4)).toEqual({ kept: [], hidden: [] });
  });
});
