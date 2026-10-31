import { describe, expect, it } from "vitest";
import {
  colorsMatch,
  cssColorToHex,
  firstInkRow,
  hexToRgb,
  inkCutAbove,
  inkWidth,
  linesFloor,
  linesGap,
  lastShadowColor,
  outsideCorner,
  paintMatches,
  parseCssColor,
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

describe("parseCssColor", () => {
  it("reads rgb and rgba in comma and space forms", () => {
    expect(parseCssColor("rgb(10, 20, 30)")).toEqual([10, 20, 30, 1]);
    expect(parseCssColor("rgba(10, 20, 30, 0.25)")).toEqual([10, 20, 30, 0.25]);
    expect(parseCssColor("rgb(10 20 30 / 0.25)")).toEqual([10, 20, 30, 0.25]);
  });

  it("reads color(srgb) on 0 to 1 as 0 to 255", () => {
    expect(parseCssColor("color(srgb 1 0 0.5 / 0.25)")).toEqual([255, 0, 127.5, 0.25]);
    expect(parseCssColor("color(srgb 0 0 0)")).toEqual([0, 0, 0, 1]);
  });

  it("refuses a colour it does not read", () => {
    expect(() => parseCssColor("#fff")).toThrow();
    expect(() => parseCssColor("color(display-p3 1 0 0)")).toThrow();
  });
});

describe("cssColorToHex", () => {
  it("converts an opaque rgb and rgba to #rrggbb", () => {
    expect(cssColorToHex("rgb(107, 34, 176)")).toBe("#6b22b0");
    expect(cssColorToHex("rgba(244, 238, 253, 1)")).toBe("#f4eefd");
    expect(cssColorToHex("color(srgb 1 0 0.5)")).toBe("#ff0080");
  });

  it("returns null for any alpha under 1, so a transparent highlight fails the play", () => {
    expect(cssColorToHex("rgba(0, 0, 0, 0)")).toBeNull();
    expect(cssColorToHex("rgba(244, 238, 253, 0.99)")).toBeNull();
    expect(cssColorToHex("rgb(10 20 30 / 0.5)")).toBeNull();
  });
});

describe("lastShadowColor", () => {
  it("returns the colour of the last shadow in the list", () => {
    expect(
      lastShadowColor(
        "rgba(0, 0, 0, 0.1) 0px 1px 2px 0px, color(srgb 0.1 0.2 0.3 / 0.25) 0px 0px 0px 4px",
      ),
    ).toBe("color(srgb 0.1 0.2 0.3 / 0.25)");
    expect(lastShadowColor("rgb(1, 2, 3) 0px 0px 0px 4px")).toBe("rgb(1, 2, 3)");
  });

  it("refuses a list that has no leading colour", () => {
    expect(() => lastShadowColor("none")).toThrow();
  });
});

describe("colorsMatch", () => {
  it("allows 1.5 on a channel and 0.015 on alpha, and no more", () => {
    expect(colorsMatch([10, 20, 30, 0.25], [11.5, 20, 30, 0.26])).toBe(true);
    expect(colorsMatch([10, 20, 30, 0.25], [11.6, 20, 30, 0.25])).toBe(false);
    expect(colorsMatch([10, 20, 30, 0.25], [10, 20, 30, 0.27])).toBe(false);
  });

  it("tells a halo in another ink from the right one", () => {
    expect(colorsMatch([20, 80, 200, 0.4], [250, 250, 250, 0.4])).toBe(false);
  });
});

describe("linesFloor", () => {
  it("takes one device pixel off the floor (lines-clear-1, worked example 2)", () => {
    expect([1, 2, 4].map((d) => linesFloor(1.5, d))).toEqual([0.5, 1, 1.25]);
  });

  it("passes the readings design.md records and fails the one of today", () => {
    expect(1 >= linesFloor(1.5, 1)).toBe(true);
    expect(1.5 >= linesFloor(1.5, 4)).toBe(true);
    expect(0 >= linesFloor(1.5, 1)).toBe(false);
  });
});

describe("linesGap", () => {
  const g: Rgb = [250, 250, 250];
  const red: Rgb = [224, 0, 0];
  const blu: Rgb = [0, 0, 224];

  it("counts the ground rows between the lowest red and the highest blue", () => {
    expect(linesGap([[red], [g], [g], [blu]], 1)).toBe(2);
  });

  it("divides device rows by the device pixel ratio", () => {
    expect(linesGap([[red], [g], [g], [g], [g], [g], [g], [blu]], 4)).toBe(1.5);
  });

  it("reads 0 when the two inks touch and a negative value when they overlap", () => {
    expect(linesGap([[red], [blu]], 1)).toBe(0);
    expect(linesGap([[red], [blu], [red], [blu]], 1)).toBe(-2);
  });

  it("takes the smallest gap over all columns", () => {
    expect(
      linesGap(
        [
          [red, red],
          [g, g],
          [g, blu],
          [blu, g],
        ],
        1,
      ),
    ).toBe(1);
  });

  it("does not count a faint antialiasing pixel as ink", () => {
    expect(linesGap([[red], [[250, 220, 220]], [g], [blu]], 1)).toBe(2);
    expect(linesGap([[red], [g], [[220, 220, 250]], [g], [blu]], 1)).toBe(3);
  });

  it("counts a pixel as red or blue only when its channel stands more than 40 above both others", () => {
    expect(linesGap([[[81, 40, 40]], [g], [[40, 40, 81]]], 1)).toBe(1);
    expect(linesGap([[[80, 40, 40]], [g], [[40, 40, 80]]], 1)).toBeNull();
  });

  it("skips a column with only one colour and gives null when none has both", () => {
    expect(
      linesGap(
        [
          [red, g],
          [g, g],
          [blu, blu],
        ],
        1,
      ),
    ).toBe(1);
    expect(linesGap([[red], [g]], 1)).toBeNull();
    expect(linesGap([], 1)).toBeNull();
  });
});

describe("inkCutAbove", () => {
  const ground: Rgb = [250, 250, 250];
  const ink: Rgb = [20, 20, 20];
  const border: Rgb = [227, 227, 227];
  const shot = (inkAt: number | null, rows = 10) =>
    Array.from({ length: rows }, (_, y) => (y === inkAt ? [ground, ink] : [ground, ground]));

  it("reads 0 when both shots draw the same rows above the line", () => {
    expect(inkCutAbove(shot(3), shot(3), 6, 1)).toBe(0);
  });

  it("reads how high the visible shot draws above the line that the shipped one does not, in CSS px", () => {
    expect(inkCutAbove(shot(null), shot(4), 6, 1)).toBe(2);
    expect(inkCutAbove(shot(6), shot(2), 8, 4)).toBe(1.5);
  });

  it("takes the highest differing row when several differ", () => {
    const visible = shot(4).map((row, y) => (y === 3 ? [ground, ink] : row));
    expect(inkCutAbove(shot(null), visible, 6, 1)).toBe(3);
  });

  it("ignores ink on or below the line, which clipping never cuts", () => {
    expect(inkCutAbove(shot(null), shot(6), 6, 1)).toBe(0);
    expect(inkCutAbove(shot(null), shot(8), 6, 1)).toBe(0);
  });

  it("does not count a line both shots share, such as a tag's border above the label", () => {
    const withBorder = (rows: Rgb[][]) => rows.map((row, y) => (y === 2 ? [border, border] : row));
    expect(inkCutAbove(withBorder(shot(null)), withBorder(shot(5)), 6, 1)).toBe(1);
    expect(inkCutAbove(withBorder(shot(null)), withBorder(shot(null)), 6, 1)).toBe(0);
  });

  it("does not count a faint antialiasing pixel as a difference", () => {
    const faint: Rgb = [240, 240, 240];
    const visible = shot(null).map((row, y) => (y === 4 ? [ground, faint] : row));
    expect(inkCutAbove(shot(null), visible, 6, 1)).toBe(0);
  });
});
