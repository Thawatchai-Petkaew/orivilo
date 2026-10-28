import { describe, expect, it } from "vitest";
import { classifyHex } from "../color-audit";
import {
  CLUSTERS_PER_SCOPE,
  colourAreasOf,
  declaredColoursOf,
  linearChannel,
  oklchOf,
  paletteOf,
  type ColourArea,
} from "./colour";

// ORV-128 tech notes section 8, "Colour": OKLCH, the colour areas of one raster, the palette and the
// declared colours of a stylesheet. The OKLCH numbers below come from Ottosson's published OKLab
// matrices, computed outside the repo (this task), not from the code under test.

/** A raster of `rows` rows of one colour each, 320 wide, every pixel opaque unless `alpha` says otherwise. */
function raster(rows: [hex: string, rows: number][], alpha = 255): Uint8Array {
  const total = rows.reduce((n, [, r]) => n + r, 0);
  const out = new Uint8Array(320 * total * 4);
  let at = 0;
  for (const [hex, count] of rows) {
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    for (let p = 0; p < 320 * count; p++) {
      out.set([rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0, alpha], at);
      at += 4;
    }
  }
  return out;
}

describe("linearChannel and oklchOf", () => {
  it("linearises an sRGB byte on both sides of the 0.04045 knee", () => {
    expect(linearChannel(0)).toBe(0);
    expect(linearChannel(255)).toBeCloseTo(1, 12);
    expect(linearChannel(10)).toBeCloseTo(10 / 255 / 12.92, 12); // 0.0392 is under the knee
    expect(linearChannel(11)).toBeCloseTo(((11 / 255 + 0.055) / 1.055) ** 2.4, 12); // 0.0431 is over it
  });

  it.each([
    ["red", [255, 0, 0], 0.628, 0.2577],
    ["blue", [0, 0, 255], 0.452, 0.3132],
    ["green", [0, 255, 0], 0.8664, 0.2948],
    ["orange", [255, 122, 0], 0.723, 0.1897],
    ["mid grey", [128, 128, 128], 0.5999, 0],
  ] as const)("%s gives its published lightness and chroma, to 4 decimals", (_n, rgb, l, c) => {
    const out = oklchOf(rgb[0], rgb[1], rgb[2]);
    expect(out.lightness).toBeCloseTo(l, 3);
    expect(out.chroma).toBeCloseTo(c, 3);
    expect(out.lightness).toBe(Math.round(out.lightness * 10000) / 10000);
    expect(out.chroma).toBe(Math.round(out.chroma * 10000) / 10000);
  });

  it("white is exactly 1 and 0, black exactly 0 and 0: the floating-point noise stays inside the bounds", () => {
    expect(oklchOf(255, 255, 255)).toEqual({ lightness: 1, chroma: 0 });
    expect(oklchOf(0, 0, 0)).toEqual({ lightness: 0, chroma: 0 });
  });
});

describe("colourAreasOf", () => {
  it("cuts at most CLUSTERS_PER_SCOPE (8) areas", () => {
    expect(CLUSTERS_PER_SCOPE).toBe(8);
    const many = raster(
      [
        "ff0000",
        "00ff00",
        "0000ff",
        "ffff00",
        "ff00ff",
        "00ffff",
        "000000",
        "ffffff",
        "808080",
        "ff7a00",
      ].map((h) => [h, 20] as [string, number]),
    );
    const areas = colourAreasOf(many);
    expect(areas.length).toBeGreaterThan(1);
    expect(areas.length).toBeLessThanOrEqual(CLUSTERS_PER_SCOPE);
  });

  it("gives each colour its pixel share, its band and its OKLCH numbers", () => {
    const areas = colourAreasOf(
      raster([
        ["ff7a00", 140],
        ["ffffff", 60],
      ]),
    );
    expect(areas).toHaveLength(2);
    const orange = areas.find((a) => a.hex === "ff7a00");
    const white = areas.find((a) => a.hex === "ffffff");
    expect(orange?.share).toBe(0.7);
    expect(white?.share).toBe(0.3);
    expect(orange?.band).toBe(classifyHex("#ff7a00"));
    expect(orange?.lightness).toBe(oklchOf(255, 122, 0).lightness);
    expect(orange?.chroma).toBe(oklchOf(255, 122, 0).chroma);
  });

  it("shares are over the opaque pixels, and sum to 1 within floating-point error", () => {
    const areas = colourAreasOf(
      raster([
        ["ff0000", 50],
        ["0000ff", 30],
        ["00ff00", 20],
      ]),
    );
    expect(areas.reduce((s, a) => s + a.share, 0)).toBeCloseTo(1, 12);
  });

  it("a transparent raster gives no area", () => {
    expect(colourAreasOf(raster([["ff0000", 10]], 0))).toEqual([]);
  });

  it("a pixel with alpha 254 is not counted", () => {
    const bytes = raster([["ff0000", 10]]);
    bytes[3] = 254; // the first pixel
    const areas = colourAreasOf(bytes);
    expect(areas[0]?.share).toBe(1);
    expect(areas).toHaveLength(1);
  });
});

describe("paletteOf", () => {
  const area = (hex: string, share: number, chroma: number): ColourArea => ({
    hex,
    share,
    band: classifyHex(`#${hex}`),
    lightness: 0.5,
    chroma,
  });

  it("the warm share is the share of the red, orange and yellow bands, and nothing else", () => {
    const palette = paletteOf([
      area("ff0000", 0.2, 0.2),
      area("ff7a00", 0.2, 0.2),
      area("ffd400", 0.1, 0.2),
      area("0000ff", 0.3, 0.2),
      area("ffffff", 0.2, 0),
    ]);
    expect(palette.warmShare).toBe(0.5);
  });

  it("the mean chroma is weighted by area share", () => {
    const palette = paletteOf([area("ff0000", 0.25, 0.2), area("ffffff", 0.75, 0)]);
    expect(palette.meanChroma).toBe(0.05);
  });

  it("rounds the warm share to 6 decimals and the mean chroma to 4", () => {
    const palette = paletteOf([
      area("ff0000", 0.1234567, 0.12345678),
      area("0000ff", 0.8765433, 0),
    ]);
    expect(palette.warmShare).toBe(0.123457);
    expect(palette.meanChroma).toBe(0.0152);
  });

  it("a sum of shares a hair over 1 still reads 1", () => {
    const palette = paletteOf([area("ff0000", 0.5, 0.5), area("ff7a00", 0.5000000000000002, 0.5)]);
    expect(palette.warmShare).toBe(1);
    expect(palette.meanChroma).toBe(0.5);
  });

  it("an empty list gives 0 and 0", () => {
    expect(paletteOf([])).toEqual({ warmShare: 0, meanChroma: 0 });
  });
});

describe("declaredColoursOf", () => {
  const hexes = (css: string) => declaredColoursOf(css).map((c) => c.hex);

  it.each([
    ["a 6-digit hex", "a{color:#ff7a00}", ["ff7a00"]],
    ["a 3-digit hex, doubled", "a{color:#f70}", ["ff7700"]],
    ["upper case, lowered", "a{color:#FF7A00}", ["ff7a00"]],
    ["rgb with commas", "a{color:rgb(255, 122, 0)}", ["ff7a00"]],
    ["rgb with spaces", "a{color:rgb(255 122 0)}", ["ff7a00"]],
    ["rgb with percentages", "a{color:rgb(100% 50% 0%)}", ["ff8000"]],
    ["rgb with an alpha of 1", "a{color:rgba(1, 2, 3, 1)}", ["010203"]],
    ["rgb with an alpha of 100 percent", "a{color:rgb(1 2 3 / 100%)}", ["010203"]],
    ["rgb out of range, held to 0 to 255", "a{color:rgb(300, -5, 0)}", ["ff0000"]],
    ["rgb fractions, rounded", "a{color:rgb(254.6, 0.4, 0)}", ["ff0000"]],
    ["an upper-case function name", "a{color:RGB(1, 2, 3)}", ["010203"]],
    ["hsl", "a{color:hsl(30, 100%, 50%)}", ["ff8000"]],
    ["hsl with a deg hue", "a{color:hsl(30deg 100% 50%)}", ["ff8000"]],
    ["hsl with a turn hue", "a{color:hsl(0.5turn 100% 50%)}", ["00ffff"]],
    ["hsl with a negative hue", "a{color:hsl(-120 100% 50%)}", ["0000ff"]],
    ["hsla with an alpha of 1", "a{color:hsla(0, 100%, 50%, 1)}", ["ff0000"]],
    ["hsl with a grad hue", "a{color:hsl(200grad 100% 50%)}", ["00ffff"]],
    ["hsl with a rad hue", "a{color:hsl(3.141592653589793rad 100% 50%)}", ["00ffff"]],
    ["hsl at hue 0", "a{color:hsl(0 100% 50%)}", ["ff0000"]],
    ["hsl at hue 60", "a{color:hsl(60 100% 50%)}", ["ffff00"]],
    ["hsl at hue 120", "a{color:hsl(120 100% 50%)}", ["00ff00"]],
    ["hsl at hue 240", "a{color:hsl(240 100% 50%)}", ["0000ff"]],
    ["hsl at hue 300", "a{color:hsl(300 100% 50%)}", ["ff00ff"]],
    ["hsl at lightness 75 percent", "a{color:hsl(0 100% 75%)}", ["ff8080"]],
    ["hsl at lightness 25 percent", "a{color:hsl(0 100% 25%)}", ["800000"]],
    [
      "hsl with a saturation over 100 percent, held to 100",
      "a{color:hsl(30 150% 50%)}",
      ["ff8000"],
    ],
    ["hsl at hue 180 and lightness 75 percent", "a{color:hsl(180 100% 75%)}", ["80ffff"]],
    [
      "hsl with a saturation over 100 percent at lightness 25, held to 100",
      "a{color:hsl(30 150% 25%)}",
      ["804000"],
    ],
    ["two functions on one line", "a{color:rgb(1,2,3);b:rgb(4,5,6)}", ["010203", "040506"]],
    ["a function before a hex", "a{color:rgb(1,2,3)}b{color:#ff7a00}", ["010203", "ff7a00"]],
    ["hsl with a negative saturation, held to 0", "a{color:hsl(30 -20% 50%)}", ["808080"]],
    [
      "hsl with a lightness over 100 percent, held to 100",
      "a{color:hsl(30 100% 120%)}",
      ["ffffff"],
    ],
    ["hsl with a negative lightness, held to 0", "a{color:hsl(30 100% -10%)}", ["000000"]],
    ["hsl with a hue past 360", "a{color:hsl(390 100% 50%)}", ["ff8000"]],
  ])("reads %s", (_name, css, expected) => {
    expect(hexes(css)).toEqual(expected);
  });

  it.each([
    ["an 8-digit hex", "a{color:#ff7a0080}"],
    ["a 4-digit hex", "a{color:#fff8}"],
    ["a 5-digit hex", "a{color:#fffff}"],
    ["a hex followed by a letter", "a{color:#abcdefg}"],
    ["a hex followed by a hyphen", "a{color:#ffffff-x}"],
    ["a hex followed by an underscore", "a{color:#ffffff_x}"],
    ["a hex followed by a digit past six", "a{color:#1234567}"],
    ["a hex followed by a non-ASCII letter", "a{color:#fffé}"],
    ["rgb with an alpha below 1", "a{color:rgba(1, 2, 3, 0.5)}"],
    ["rgb with a slash alpha below 1", "a{color:rgb(1 2 3 / 50%)}"],
    ["rgb with the none keyword", "a{color:rgb(none 2 3)}"],
    ["rgb with a calc()", "a{color:rgb(calc(1) 2 3)}"],
    ["rgb with two components", "a{color:rgb(1, 2)}"],
    ["hsl with a saturation that is no percentage", "a{color:hsl(30, 1, 50%)}"],
    ["hsl with a lightness that is no percentage", "a{color:hsl(30, 100%, 0.5)}"],
    ["a function name inside another word", "a{color:xrgb(1, 2, 3)}"],
    ["oklch", "a{color:oklch(0.7 0.2 30)}"],
  ])("skips %s", (_name, css) => {
    expect(hexes(css)).toEqual([]);
  });

  it("gives each colour once, at its first occurrence, in order of offset", () => {
    const css = "a{color:#00f}b{color:#FF7A00}c{color:rgb(255, 122, 0)}d{color:#0000ff}";
    expect(declaredColoursOf(css)).toEqual([
      { hex: "0000ff", offset: css.indexOf("#00f") },
      { hex: "ff7a00", offset: css.indexOf("#FF7A00") },
    ]);
  });

  it("takes the earlier of a hex and a function that give one colour", () => {
    const css = "a{color:rgb(255, 122, 0)}b{color:#ff7a00}";
    expect(declaredColoursOf(css)).toEqual([{ hex: "ff7a00", offset: css.indexOf("rgb(") }]);
  });

  it("scans the whole text: a comment that looks like a colour counts", () => {
    expect(hexes("/* #123456 */")).toEqual(["123456"]);
  });

  it("an empty stylesheet gives none", () => {
    expect(declaredColoursOf("")).toEqual([]);
  });
});
