import { describe, expect, it } from "vitest";
import { inkWidth, outsideCorner, type Radii, type Rgb } from "./visual-asserts";

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
