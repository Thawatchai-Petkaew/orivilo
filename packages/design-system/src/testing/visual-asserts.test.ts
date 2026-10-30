import { describe, expect, it } from "vitest";
import {
  inkCentreOf,
  inkWidth,
  offCentreReport,
  outsideCorner,
  type InkBox,
  type InkCentre,
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

/**
 * ink-centre-1, clauses 3 to 9 (ORV-111): the pure part, on a decoded screenshot given as RGBA
 * bytes. The colours are the ones of worked example 1 of the spec: the ground `action.primary`
 * #7A22C7, the ink `text.on-action` #FFFFFF, a mid-tone pixel over the ink distance and a faint
 * one under it.
 */
const GROUND: Rgb = [122, 34, 199];
const WHITE: Rgb = [255, 255, 255];
const MID: Rgb = [189, 145, 227];
const FAINT: Rgb = [130, 45, 202];

/** An image `width` by `height` px; `paint(x, y)` gives the colour of one pixel, the ground by default. */
function shot(width: number, height: number, paint: (x: number, y: number) => Rgb | undefined) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = paint(x, y) ?? GROUND;
      data.set([r, g, b, 255], (y * width + x) * 4);
    }
  }
  return { data, width };
}

/** The band of one text column, as the rows of worked example 1: a stand-in for a screenshot. */
const rowsOf = (rows: Record<number, Rgb>) => (_x: number, y: number) => rows[y];

/** A 40 px tall box with a 1 px border whose label spans the four columns of the image. */
const control: InkBox = {
  top: 0,
  height: 40,
  borderTop: 1,
  borderBottom: 1,
  textLeft: 0,
  textRight: 4,
};

/** Worked example 1 of the spec: ink rows 11 to 25 with a faint pixel above and a mid-tone one below. */
const thaiRows: Record<number, Rgb> = { 10: FAINT, 25: MID };
for (let y = 11; y <= 24; y++) thaiRows[y] = WHITE;
/** The English twin: a mid-tone pixel above the ink and a faint one below. */
const latinRows: Record<number, Rgb> = { 13: MID, 28: FAINT };
for (let y = 14; y <= 27; y++) latinRows[y] = WHITE;

const read = (image: ReturnType<typeof shot>, at: InkBox = control, scale = 1): InkCentre => {
  const found = inkCentreOf(image, scale, at);
  if (!found) throw new Error("the test image holds no ink");
  return found;
};

describe("inkCentreOf", () => {
  it("reads the two columns of worked example 1 as -1.50 above the centre and 0.50 below, 'false true'", () => {
    const thai = read(shot(4, 40, rowsOf(thaiRows)));
    const latin = read(shot(4, 40, rowsOf(latinRows)));
    expect(
      `${thai.offset.toFixed(2)} ${latin.offset.toFixed(2)} ${thai.centred} ${latin.centred}`,
    ).toBe("-1.50 0.50 false true");
  });

  it("gives the ink top and the ink bottom in CSS px below the top of the box (clause 6)", () => {
    // Ink rows 11 to 25: the band runs from row 11 to row 26, one past the last ink row.
    expect(read(shot(4, 40, rowsOf(thaiRows)))).toMatchObject({ inkTop: 11, inkBottom: 26 });
  });

  it("takes the ground as the most frequent colour, not the first pixel of the region (clause 4)", () => {
    // The first pixel of the region (column 0, row 1) is white. Judged against it, every fill pixel
    // would be ink and the band would run to the bottom of the box. Judged against the fill, the
    // white pixel is ink and the band starts at row 1.
    const image = shot(4, 40, (x, y) => (x === 0 && y === 1 ? WHITE : rowsOf(thaiRows)(x, y)));
    expect(read(image)).toMatchObject({ inkTop: 1, inkBottom: 26 });
  });

  it("gives a tie between two colours to the one that reaches the top count first (clause 4)", () => {
    // Two rows of two pixels: the fill row and a white row, two pixels of each colour.
    const tiny: InkBox = { ...control, height: 2, borderTop: 0, borderBottom: 0, textRight: 2 };
    const image = shot(2, 2, (_x, y) => (y === 1 ? WHITE : undefined));
    expect(read(image, tiny)).toMatchObject({ inkTop: 1, inkBottom: 2 });
  });

  it("counts a pixel as ink only when its distance from the ground is over 48 (clause 5)", () => {
    const ground: Rgb = [100, 100, 100];
    const at = (colours: Record<number, Rgb>) => shot(4, 40, (_x, y) => colours[y] ?? ground);
    // Row 10 is 48 away (not ink), row 11 is 49 away (ink): the band starts at row 11.
    expect(read(at({ 10: [148, 100, 100], 11: [149, 100, 100] }))).toMatchObject({ inkTop: 11 });
    // The distance sums the three channels: 16 + 16 + 17 = 49 is ink, 16 + 16 + 16 = 48 is not.
    expect(read(at({ 10: [116, 116, 116], 11: [116, 116, 117] }))).toMatchObject({ inkTop: 11 });
    // Below the ground counts too: the distance is absolute.
    expect(read(at({ 10: [52, 100, 100], 11: [51, 100, 100] }))).toMatchObject({ inkTop: 11 });
  });

  it("runs the band from the first ink row to the last, plus one row (clause 6)", () => {
    const image = shot(4, 40, rowsOf({ 12: WHITE, 20: WHITE }));
    expect(read(image)).toMatchObject({ inkTop: 12, inkBottom: 21, offset: -3.5 });
  });

  it("ignores ink outside the columns of the label, such as an icon (clause 3)", () => {
    // The label spans columns 0 to 3; an icon at columns 6 and 7 reaches from row 3 to row 36.
    const label = rowsOf(latinRows);
    const image = shot(8, 40, (x, y) => (x >= 6 && y >= 3 && y <= 36 ? WHITE : label(x, y)));
    expect(read(image)).toMatchObject({ inkTop: 13, inkBottom: 28 });
  });

  it("ignores the border rows and reads only the padding box (clause 3)", () => {
    // White border rows would pull the band to the edges of the box if they were read.
    const image = shot(4, 40, (x, y) => (y === 0 || y === 39 ? WHITE : rowsOf(latinRows)(x, y)));
    expect(read(image)).toMatchObject({ inkTop: 13, inkBottom: 28 });
  });

  it("rounds the columns outward and the rows inward, so no half-covered row is read (clause 3)", () => {
    // Top 8.5 and a 1 px border put the padding box at 9.5 to 47.5. Rows 9 and 47 are half border.
    const at: InkBox = { ...control, top: 8.5, textLeft: 10.5, textRight: 20.2 };
    const ink = (cells: [number, number][]) => {
      const set = new Set(cells.map(([x, y]) => `${x},${y}`));
      return shot(30, 60, (x, y) => (set.has(`${x},${y}`) ? WHITE : undefined));
    };
    // Inside: row 10 and row 46 are whole padding rows; column 10 and column 20 hold the label.
    expect(
      read(
        ink([
          [15, 10],
          [15, 46],
        ]),
        at,
      ),
    ).toMatchObject({ inkTop: 1.5, inkBottom: 38.5 });
    // Outside: row 9 and row 47 are half border; columns 9 and 21 lie past the label's columns.
    expect(
      inkCentreOf(
        ink([
          [15, 9],
          [15, 47],
        ]),
        1,
        at,
      ),
    ).toBeNull();
    expect(
      inkCentreOf(
        ink([
          [9, 20],
          [21, 20],
        ]),
        1,
        at,
      ),
    ).toBeNull();
    // The label's own first and last columns are read.
    expect(read(ink([[10, 20]]), at)).toMatchObject({ inkTop: 11.5 });
    expect(read(ink([[20, 20]]), at)).toMatchObject({ inkTop: 11.5 });
  });

  it("does not read past the right edge of the image into the next row (clause 3)", () => {
    // The label's columns run two past the 4 px image. Read as a flat array, those two columns of
    // row 19 would be the first two pixels of row 20, where the white pixel is.
    const image = shot(4, 40, (x, y) => (x === 0 && y === 20 ? WHITE : undefined));
    expect(read(image, { ...control, textRight: 6 })).toMatchObject({ inkTop: 20, inkBottom: 21 });
  });

  it("stays inside the image on every side, so no pixel is read from another row (clause 3)", () => {
    const only = (cells: [number, number][]) => {
      const set = new Set(cells.map(([x, y]) => `${x},${y}`));
      return shot(4, 40, (x, y) => (set.has(`${x},${y}`) ? WHITE : undefined));
    };
    // Above the image: a box that starts 5 px above it. Rows -4 to -1 would read as black.
    expect(read(only([[0, 20]]), { ...control, top: -5 })).toMatchObject({
      inkTop: 25,
      inkBottom: 26,
    });
    // Below the image: a box 60 px tall. Rows 40 to 58 would read as black.
    expect(read(only([[0, 20]]), { ...control, height: 60 })).toMatchObject({
      inkTop: 20,
      inkBottom: 21,
    });
    // Left of the image: the last pixel of row 19 would be read as the pixel left of row 20.
    expect(inkCentreOf(only([[3, 19]]), 1, { ...control, textLeft: -1, textRight: 1 })).toBeNull();
    // Right of the image: the first pixel of row 21 would be read as the pixel right of row 20.
    expect(inkCentreOf(only([[0, 21]]), 1, { ...control, textLeft: 3, textRight: 5 })).toBeNull();
  });

  it("returns null when the region holds no ink", () => {
    expect(
      inkCentreOf(
        shot(4, 40, () => undefined),
        1,
        control,
      ),
    ).toBeNull();
  });

  it("returns null when the region has no pixel to read, with no ground to find (clause 4)", () => {
    const image = shot(4, 40, rowsOf(thaiRows));
    expect(inkCentreOf(image, 1, { ...control, textRight: 0 })).toBeNull();
    expect(inkCentreOf(image, 1, { ...control, height: 2 })).toBeNull();
  });

  it("converts device px to CSS px with the scale (clause 6)", () => {
    // At scale 2 the box is 80 device rows tall: ink rows 23 to 51 are CSS rows 11.5 to 26.
    const rows: Record<number, Rgb> = {};
    for (let y = 23; y <= 51; y++) rows[y] = WHITE;
    const image = shot(8, 80, rowsOf(rows));
    expect(read(image, { ...control, textRight: 4 }, 2)).toMatchObject({
      inkTop: 11.5,
      inkBottom: 26,
      offset: -1.25,
    });
  });

  it("measures the ink centre against the centre of the box, the top plus half the height (clause 7)", () => {
    // The same ink in a box that starts 5 px lower and is 50 px tall: its centre is at 5 + 25 = 30.
    const image = shot(4, 60, rowsOf(thaiRows));
    const lower: InkBox = { ...control, top: 5, height: 50 };
    // Ink rows 11 to 25 give a centre at (11 + 26) / 2 = 18.5; the box centre is 30.
    expect(read(image, lower)).toMatchObject({ inkTop: 6, inkBottom: 21, offset: -11.5 });
  });

  it("reports the offset to 2 decimals, a negative one above the centre (clause 8)", () => {
    // A box 0.333 px down: the ink top is 11 - 0.333, the ink bottom 26 - 0.333.
    const found = read(shot(4, 41, rowsOf(thaiRows)), { ...control, top: 0.333 });
    expect(found).toMatchObject({ inkTop: 10.67, inkBottom: 25.67, offset: -1.83 });
  });

  it("passes an offset of 1 either way and fails one past it (clause 9)", () => {
    // Ink rows 10 to 27 centre at 19 (offset -1), rows 12 to 29 at 21 (offset 1), rows 12 to 28 at 20.5.
    const band = (first: number, last: number) => {
      const rows: Record<number, Rgb> = {};
      for (let y = first; y <= last; y++) rows[y] = WHITE;
      return read(shot(4, 40, rowsOf(rows)));
    };
    expect(band(10, 27)).toMatchObject({ offset: -1, centred: true });
    expect(band(12, 29)).toMatchObject({ offset: 1, centred: true });
    expect(band(10, 26)).toMatchObject({ offset: -1.5, centred: false });
    expect(band(13, 29)).toMatchObject({ offset: 1.5, centred: false });
  });

  it("judges the offset as reported, to 2 decimals (clause 9)", () => {
    // 1.004 reports as 1.00, so it passes; 1.01 reports as 1.01, so it fails.
    const rows: Record<number, Rgb> = {};
    for (let y = 12; y <= 29; y++) rows[y] = WHITE;
    const image = shot(4, 41, rowsOf(rows));
    expect(read(image, { ...control, top: -0.004 })).toMatchObject({ offset: 1, centred: true });
    expect(read(image, { ...control, top: -0.01 })).toMatchObject({ offset: 1.01, centred: false });
  });
});

describe("offCentreReport", () => {
  const reading = (name: string, offset: number, centred: boolean) => ({
    name,
    inkTop: 11,
    inkBottom: 26,
    offset,
    centred,
  });

  it("says nothing when every label is centred", () => {
    expect(offCentreReport([reading("a", 0.5, true), reading("b", -1, true)])).toBe("");
  });

  it("lists each failing box with its offset and leaves the centred ones out", () => {
    const report = offCentreReport([
      reading('<button.ds-button> "Thai", 32 px tall, in neutral light', -1.5, false),
      reading('<button.ds-button> "Latin", 32 px tall, in neutral light', 0.5, true),
      reading('<button.ds-button> "Thai", 48 px tall, in neutral dark', -2.25, false),
    ]);
    expect(report).toContain("2 of 3");
    expect(report).toContain(
      '"Thai", 32 px tall, in neutral light: ink 11.00 to 26.00 px, offset -1.50 px',
    );
    expect(report).toContain(
      '"Thai", 48 px tall, in neutral dark: ink 11.00 to 26.00 px, offset -2.25 px',
    );
    expect(report).not.toContain("Latin");
  });
});
