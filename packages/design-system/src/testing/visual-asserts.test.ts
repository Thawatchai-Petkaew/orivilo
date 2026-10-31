import { describe, expect, it } from "vitest";
import {
  firstInkRow,
  hexToRgb,
  inkWidth,
  outsideCorner,
  paintMatches,
  viewBoxToBox,
  type Radii,
  type Rgb,
} from "./visual-asserts";

const white: Rgb = [255, 255, 255];
const grey: Rgb = [245, 245, 245];
const blue: Rgb = [30, 90, 220];

describe("inkWidth", () => {
  it("reads a single 1 px edge as 1", () => {
    expect(inkWidth([white, white, blue, grey, grey], 1)).toBe(1);
  });

  it("reads a border and an outline drawn side by side as 2 (the ORV-107 0f0b4a5 edge)", () => {
    expect(inkWidth([white, white, blue, blue, grey, grey], 1)).toBe(2);
  });

  it("divides device pixels by the device pixel ratio", () => {
    expect(inkWidth([white, white, blue, blue, blue, blue, grey, grey], 4)).toBe(1);
  });

  it("does not count a faint antialiasing pixel as ink", () => {
    expect(inkWidth([white, [250, 250, 252], blue, grey, grey], 1)).toBe(1);
  });

  it("refuses an empty line", () => {
    expect(() => inkWidth([], 1)).toThrow();
  });
});

describe("firstInkRow", () => {
  const ground: Rgb = [250, 250, 250];
  const ink: Rgb = [20, 20, 20];

  it("returns the index of the first row with a pixel far from the ground", () => {
    const rows = [
      [ground, ground],
      [ground, ground],
      [ground, ink],
      [ink, ink],
    ];
    expect(firstInkRow(rows, ground)).toBe(2);
  });

  it("returns null for rows of plain ground", () => {
    expect(
      firstInkRow(
        [
          [ground, ground],
          [ground, ground],
        ],
        ground,
      ),
    ).toBeNull();
  });

  it("does not count a faint antialiasing pixel as ink", () => {
    expect(
      firstInkRow(
        [
          [ground, [245, 245, 247]],
          [ground, ink],
        ],
        ground,
      ),
    ).toBe(1);
  });

  it("returns null for no rows", () => {
    expect(firstInkRow([], ground)).toBeNull();
  });
});

const pill = (r: number): Radii => ({
  topLeft: { x: r, y: r },
  topRight: { x: r, y: r },
  bottomRight: { x: r, y: r },
  bottomLeft: { x: r, y: r },
});
const box = { left: 0, top: 0, right: 100, bottom: 40 };

describe("outsideCorner", () => {
  it("accepts a point well inside a pill", () => {
    expect(outsideCorner({ x: 20, y: 20 }, box, pill(20))).toBeNull();
  });

  it("names the corner whose curve cuts a point that is inside the square box", () => {
    expect(outsideCorner({ x: 1, y: 1 }, box, pill(20))).toBe("topLeft");
    expect(outsideCorner({ x: 99, y: 39 }, box, pill(20))).toBe("bottomRight");
  });

  it("accepts the same point when the corner is square", () => {
    expect(outsideCorner({ x: 1, y: 1 }, box, pill(0))).toBeNull();
  });

  it("names a point outside the box", () => {
    expect(outsideCorner({ x: 120, y: 5 }, box, pill(0))).toBe("topRight");
  });
});

describe("viewBoxToBox", () => {
  it("scales a point when the box has the viewBox's aspect ratio", () => {
    expect(viewBoxToBox({ x: 22.5, y: 77.5 }, [0, 0, 128, 128], { width: 64, height: 64 })).toEqual(
      {
        x: 11.25,
        y: 38.75,
      },
    );
  });

  it("subtracts the viewBox origin", () => {
    expect(
      viewBoxToBox({ x: 182, y: -25 }, [100, -50, 200, 100], { width: 100, height: 50 }),
    ).toEqual({
      x: 41,
      y: 12.5,
    });
  });

  it("centres the drawing when the box is wider than the viewBox (meet)", () => {
    expect(viewBoxToBox({ x: 0, y: 0 }, [0, 0, 100, 50], { width: 200, height: 50 })).toEqual({
      x: 50,
      y: 0,
    });
  });

  it("centres the drawing when the box is taller than the viewBox (meet)", () => {
    expect(viewBoxToBox({ x: 50, y: 25 }, [0, 0, 100, 50], { width: 100, height: 100 })).toEqual({
      x: 50,
      y: 50,
    });
  });

  it("refuses a viewBox with no size", () => {
    expect(() => viewBoxToBox({ x: 0, y: 0 }, [0, 0, 0, 10], { width: 10, height: 10 })).toThrow();
  });
});

describe("hexToRgb and paintMatches", () => {
  it("reads #rrggbb in either case", () => {
    expect(hexToRgb("#D9F66F")).toEqual([217, 246, 111]);
    expect(hexToRgb("#d9f66f")).toEqual([217, 246, 111]);
  });

  it("refuses a short or malformed hex", () => {
    expect(() => hexToRgb("#fff")).toThrow();
    expect(() => hexToRgb("D9F66F")).toThrow();
  });

  it("allows a summed difference of 12 and no more", () => {
    expect(paintMatches([217, 246, 111], "#D9F66F")).toBe(true);
    expect(paintMatches([229, 246, 111], "#D9F66F")).toBe(true);
    expect(paintMatches([230, 246, 111], "#D9F66F")).toBe(false);
    expect(paintMatches([223, 252, 111], "#D9F66F")).toBe(true);
    expect(paintMatches([224, 252, 111], "#D9F66F")).toBe(false);
  });
});
