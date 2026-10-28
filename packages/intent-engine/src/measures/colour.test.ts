import { describe, expect, it } from "vitest";
import { classifyHex } from "../color-audit";
import {
  CLUSTERS_PER_SCOPE,
  colourAreasOf,
  component,
  declaredColoursOf,
  hueOf,
  linearChannel,
  oklchOf,
  paletteOf,
  type ColourArea,
} from "./colour";

declare const performance: { now(): number }; // the engine tsconfig has no DOM lib; a timer for the time bounds
/** The framework timeout of a test that guards a time bound: above the bound, so vitest never pre-empts the guard. */
const HEAVY_TIMEOUT = 60_000;
/** The time bound of a stylesheet measure on 1 MB, sized for CI (SEC-3). */
const TIME_BOUND_MS = 2000;
const MB = 1024 * 1024;

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

  it("keeps the warm share as computed and rounds the mean chroma to 4", () => {
    const palette = paletteOf([
      area("ff0000", 0.1234567, 0.12345678),
      area("0000ff", 0.8765433, 0),
    ]);
    expect(palette.warmShare).toBe(0.1234567);
    expect(palette.meanChroma).toBe(0.0152);
  });

  it("does not round the warm share to 6 decimals first (S-10): 2,497 of 4,999 stays under 0.4995", () => {
    const palette = paletteOf([area("ff0000", 2497 / 4999, 0.2), area("0000ff", 2502 / 4999, 0.2)]);
    expect(palette.warmShare).toBe(2497 / 4999);
    expect(Math.round(palette.warmShare * 1000)).toBe(499);
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

  describe("only in declaration values (S-7)", () => {
    it.each([
      ["an id selector of 6 letters", "#facade{color:red}"],
      ["an id selector of 3 letters", "#bad{color:red}"],
      ["a commented-out declaration", "a{/* color:#123456 */}"],
      ["a comment between declarations", "a{color:red;/* #123456 */margin:0}"],
      ["a comment outside every block", "/* #123456 */ a{margin:0}"],
      ["an svg reference in url()", "a{fill:url(#add)}"],
      ["a quoted svg reference in url()", 'a{fill:url("#add")}'],
      ["a string", 'a::after{content:"#123456"}'],
      ["a single-quoted string", "a::after{content:'#123456'}"],
      ["an upper-case URL(", "a{fill:URL(#add)}"],
      ["a nested selector", "a{#facade:hover{margin:0}}"],
      ["an at-rule prelude", "@media (min-width:600px) and (color:#123456){a{margin:0}}"],
      ["an unclosed comment", "a{color:red}/* #123456"],
      ["an unclosed comment inside a value", "a{color:/* #123456"],
      ["a nested selector with a colour after its colon", "a{&:is(#facade, .b){margin:0}}"],
      ["a nested selector cut by a string after a colour", 'a{&:is(#facade, [x="y"]){margin:0}}'],
      ["a condition of an @import", '@import "x.css" (color:#123456);'],
      ["a colour function in a comment", "a{/* rgb(1, 2, 3) */}"],
    ])("skips %s", (_name, css) => {
      expect(hexes(css)).toEqual([]);
    });

    it.each([
      ["a value ended by a brace with no semicolon", "a{color:#123456}", ["123456"]],
      ["a custom property", "a{--brand:#123456}", ["123456"]],
      ["a value after a comment inside it", "a{color:/* x */#123456}", ["123456"]],
      ["a value after a string inside it", 'a{background:"x" #123456}', ["123456"]],
      [
        "both colours of a gradient",
        "a{background:linear-gradient(#111, #222)}",
        ["111111", "222222"],
      ],
      ["a declaration inside @media", "@media print{a{color:#123456}}", ["123456"]],
      ["a declaration after a nested rule", "a{b{margin:0}color:#123456}", ["123456"]],
      ["a colour after a url() in one value", "a{background:url(x.png) #123456}", ["123456"]],
      [
        "a url() with a semicolon in it",
        "a{background:url(data:image/png;base64,AAA) #123456}",
        ["123456"],
      ],
      ["a function that only ends in url", "a{color:xurl(#123456)}", ["123456"]],
      ["a value cut off by the end of the sheet", "a{color:#123456", ["123456"]],
      ["a colour before a comment, in the same value", "a{color:#123456/* x */}", ["123456"]],
      ["a function after a url() on one line", "a{background:url(x) rgb(1, 2, 3)}", ["010203"]],
    ])("reads %s", (_name, css, expected) => {
      expect(hexes(css)).toEqual(expected);
    });

    it("gives the offset in the whole text for a colour after a comment", () => {
      const css = "a{/* c */color:#123456}";
      expect(declaredColoursOf(css)).toEqual([{ hex: "123456", offset: css.indexOf("#") }]);
    });

    it("a string with an escaped quote and a brace in it does not end the block", () => {
      expect(hexes('a{content:"\\"}";color:#123456}')).toEqual(["123456"]);
    });

    it.each(["\n", "\r", "\f"])(
      "a string ends before the line break %j, so an unclosed one does not swallow the sheet",
      (lineBreak) => {
        expect(hexes(`a{content:'oops${lineBreak}color:#123456}`)).toEqual(["123456"]);
      },
    );
  });

  describe("a colour function token over 64 characters (SEC-3)", () => {
    it("reads a token of 64 characters and skips one of 65", () => {
      const at = (n: number) => `a{color:rgb(${"0".repeat(n - 3)}255, 0, 0)}`;
      expect(hexes(at(64))).toEqual(["ff0000"]);
      expect(hexes(at(65))).toEqual([]);
    });

    it("applies to every token of rgb and hsl, the fourth one too", () => {
      const long = "0".repeat(70);
      expect(hexes(`a{color:rgb(1, ${long}1, 3)}`)).toEqual([]);
      expect(hexes(`a{color:rgb(1, 2, ${long}1)}`)).toEqual([]);
      expect(hexes(`a{color:rgba(1, 2, 3, ${long}1)}`)).toEqual([]);
      expect(hexes(`a{color:hsl(${long}30, 100%, 50%)}`)).toEqual([]);
      expect(hexes(`a{color:hsl(30, ${long}100%, 50%)}`)).toEqual([]);
      expect(hexes(`a{color:hsl(30, 100%, ${long}50%)}`)).toEqual([]);
    });
  });

  describe("one way to read a number (SEC-3)", () => {
    it.each([
      ["a leading dot", "a{color:rgb(.5e3, 0, 0)}", ["ff0000"]],
      ["a hue with a leading dot", "a{color:hsl(.5turn 100% 50%)}", ["00ffff"]],
      ["a trailing dot", "a{color:rgb(255., 0, 0)}", ["ff0000"]],
      ["a signed exponent", "a{color:rgb(2.55e+2, 0, 0)}", ["ff0000"]],
      ["a plus sign", "a{color:rgb(+255, 0, 0)}", ["ff0000"]],
      ["an upper-case exponent", "a{color:rgb(2.55E2, 0, 0)}", ["ff0000"]],
      ["a hue with a unit after an exponent", "a{color:hsl(1e1turn 100% 50%)}", ["ff0000"]],
    ])("reads %s", (_name, css, expected) => {
      expect(hexes(css)).toEqual(expected);
    });

    it.each([
      ["two dots", "a{color:rgb(1.5.5, 0, 0)}"],
      ["an exponent with no digits", "a{color:rgb(1e, 0, 0)}"],
      ["a sign alone", "a{color:rgb(+, 0, 0)}"],
      ["a dot alone", "a{color:rgb(., 0, 0)}"],
      ["a unit on an rgb number", "a{color:rgb(1px, 0, 0)}"],
      ["a hue with an unknown unit", "a{color:hsl(30px 100% 50%)}"],
    ])("skips %s", (_name, css) => {
      expect(hexes(css)).toEqual([]);
    });
  });

  describe("a number is read in linear time even when the cap on a token is not (SEC-3)", () => {
    // `declaredColoursOf` skips a token over 64 characters before it reads a number, so these call the
    // readers of one token directly: the number form alone must not backtrack on a long run.
    const timedToken = (read: () => number | null) => {
      const started = performance.now();
      const out = read();
      expect(performance.now() - started).toBeLessThan(TIME_BOUND_MS);
      return out;
    };

    it(
      "component() fails a 1 MB digit run with a bad tail at once, and reads a good one",
      () => {
        expect(timedToken(() => component(`${"1".repeat(MB - 64)}x`, 255))).toBeNull();
        expect(timedToken(() => component(`${"1".repeat(MB - 64)}.x`, 255))).toBeNull();
        expect(timedToken(() => component(`${"1".repeat(MB - 64)}e`, 255))).toBeNull();
        expect(timedToken(() => component(`${"0".repeat(MB - 64)}5%`, 1))).toBe(0.05);
      },
      HEAVY_TIMEOUT,
    );

    it(
      "hueOf() fails a 1 MB digit run with a bad tail at once, and reads a good one",
      () => {
        expect(timedToken(() => hueOf(`${"1".repeat(MB - 64)}x`))).toBeNull();
        expect(timedToken(() => hueOf(`${"1".repeat(MB - 64)}.x`))).toBeNull();
        expect(timedToken(() => hueOf(`${"0".repeat(MB - 64)}30deg`))).toBe(30);
      },
      HEAVY_TIMEOUT,
    );
  });

  describe("every route is linear in a 1 MB sheet (SEC-3)", () => {
    const timed = (css: string) => {
      expect(css.length).toBeLessThanOrEqual(MB);
      const started = performance.now();
      const out = declaredColoursOf(css);
      const elapsed = performance.now() - started;
      expect(elapsed).toBeLessThan(TIME_BOUND_MS);
      return out;
    };

    it.each([
      [
        "rgb with a 1 MB digit run that fails at its tail",
        (n: number) => `a{color:rgb(${"1".repeat(n)}x,1,1)}`,
      ],
      [
        "hsl with a 1 MB digit run that fails at its tail",
        (n: number) => `a{color:hsl(${"1".repeat(n)}x 1% 1%)}`,
      ],
      ["a 1 MB run of digits and dots", (n: number) => `a{color:rgb(${"1.".repeat(n / 2)}x,1,1)}`],
      [
        "rgb with a 1 MB hue-like unit run",
        (n: number) => `a{color:hsl(${"1".repeat(n)}deg1 1% 1%)}`,
      ],
      ["a 1 MB run of spaces inside rgb", (n: number) => `a{color:rgb(1${" ".repeat(n)}x)}`],
      ["a 1 MB run of commas inside rgb", (n: number) => `a{color:rgb(1${", ".repeat(n / 2)}x)}`],
      ["a 1 MB run of rgb( with no end", (n: number) => `a{color:${"rgb(".repeat(n / 4)}`],
      ["a 1 MB run of hex-like text", (n: number) => `a{color:${"#abcdefg ".repeat(n / 9)}}`],
      ["1 MB of unclosed comments", (n: number) => `a{${"/*".repeat(n / 2)}}`],
      ["1 MB of unclosed strings", (n: number) => `a{${"'x\n".repeat(n / 4)}}`],
      ["1 MB of url( with no end", (n: number) => `a{${"url(".repeat(n / 4)}}`],
      ["1 MB of colons and open braces", (n: number) => `a{${":{".repeat(n / 2)}}`],
    ])(
      "%s",
      (_name, make) => {
        expect(timed(make(MB - 64))).toEqual([]);
      },
      HEAVY_TIMEOUT,
    );

    it(
      "1 MB of distinct hex colours is read once each, in order of offset",
      () => {
        const n = 131_000;
        const css = `a{b:${Array.from({ length: n }, (_, i) => `#${i.toString(16).padStart(6, "0")}`).join(" ")}}`;
        const out = timed(css);
        expect(out).toHaveLength(n);
        expect(out[0]?.hex).toBe("000000");
        expect(out.at(-1)?.hex).toBe((n - 1).toString(16).padStart(6, "0"));
      },
      HEAVY_TIMEOUT,
    );
  });

  it("an empty stylesheet gives none", () => {
    expect(declaredColoursOf("")).toEqual([]);
  });
});
