import { describe, expect, it } from "vitest";
import { quantizeWu, type Cluster } from "./wu";

// ---------------------------------------------------------------- the rasters
// Two page-like RGBA rasters from a seeded generator (ORV-134 comment 10239 point 3): no binary
// fixture file, no Math.random. Bands of flat colour, a card, a gradient, a noisy "photo" and
// text-like strokes; the top right corner is transparent and the first pixel is a one-off colour. The generator must stay erasable
// TypeScript: the scratch run that recorded 0.4.0's colours (EXPECTED_04 below) loads this block as it is.

// BEGIN GENERATOR
/** mulberry32: a 32-bit seeded generator, numbers in [0, 1). */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rgb = [number, number, number];

function pageRaster(seed: number, width: number, height: number, bandHeight: number): Uint8Array {
  const next = seeded(seed);
  const colour = (): Rgb => [
    Math.floor(next() * 256),
    Math.floor(next() * 256),
    Math.floor(next() * 256),
  ];
  const palette = [colour(), colour(), colour(), colour(), colour(), colour()];
  const at = (i: number): Rgb => palette[i] ?? [0, 0, 0];
  const byte = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const band = Math.floor(y / bandHeight) % 5;
    for (let x = 0; x < width; x++) {
      let [r, g, b] = at(0);
      if (band === 1) [r, g, b] = x >= 40 && x < width - 40 ? at(2) : at(1);
      if (band === 2) {
        const t = x / (width - 1);
        const [r0, g0, b0] = at(3);
        const [r1, g1, b1] = at(4);
        [r, g, b] = [byte(r0 + (r1 - r0) * t), byte(g0 + (g1 - g0) * t), byte(b0 + (b1 - b0) * t)];
      }
      if (band === 3) {
        const [pr, pg, pb] = at(5);
        [r, g, b] = [
          byte(pr + (next() - 0.5) * 48),
          byte(pg + (next() - 0.5) * 48),
          byte(pb + (next() - 0.5) * 48),
        ];
      }
      if (band === 4 && x % 7 < 2) [r, g, b] = [20, 24, 32];
      if (x === 0 && y === 0) [r, g, b] = [201, 17, 99]; // a one-off first pixel, so the reversed order differs
      const corner = x >= width - 8 && y < 8;
      rgba.set([r, g, b, corner ? 0 : 255], (y * width + x) * 4);
    }
  }
  return rgba;
}
// END GENERATOR

const RASTERS = [
  { name: "320 x 200", raster: pageRaster(134_200, 320, 200, 40) },
  { name: "320 x 2000", raster: pageRaster(1_342_000, 320, 2000, 100) },
] as const;

const hexOf = (c: Pick<Cluster, "red" | "green" | "blue">): string =>
  [c.red, c.green, c.blue].map((v) => v.toString(16).padStart(2, "0")).join("");

/** RGBA bytes from `[r, g, b, a]` pixels. */
const rgbaOf = (pixels: number[][]): Uint8Array => Uint8Array.from(pixels.flat());

const reversed = (rgba: Uint8Array): Uint8Array => {
  const out = new Uint8Array(rgba.length);
  const n = rgba.length / 4;
  for (let i = 0; i < n; i++) out.set(rgba.subarray(i * 4, i * 4 + 4), (n - 1 - i) * 4);
  return out;
};

/** The opaque pixels and the distinct opaque colours of a raster. */
function describeRaster(rgba: Uint8Array): { opaque: number; distinct: number } {
  const colours = new Set<number>();
  let opaque = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] !== 255) continue;
    opaque++;
    colours.add(((rgba[i] ?? 0) << 16) | ((rgba[i + 1] ?? 0) << 8) | (rgba[i + 2] ?? 0));
  }
  return { opaque, distinct: colours.size };
}

// ---------------------------------------------------------------- row 4

describe("same pixels, same clusters", () => {
  it.each(RASTERS)(
    "$name: two calls and the reversed pixel order give one result",
    ({ raster }) => {
      const first = quantizeWu(raster, 8);
      expect(first.length).toBeGreaterThan(1);
      expect(quantizeWu(raster, 8)).toEqual(first);
      expect(quantizeWu(reversed(raster), 8)).toEqual(first);
    },
  );
});

// ---------------------------------------------------------------- row 8

describe("clusters are boxes with their counts", () => {
  it.each(RASTERS)(
    "$name: at most 8 boxes, counts sum to the opaque pixels, one hex each",
    ({ raster }) => {
      const { opaque, distinct } = describeRaster(raster);
      expect(distinct).toBeGreaterThan(1000);
      expect(opaque).toBeLessThan(raster.length / 4);
      const clusters = quantizeWu(raster, 8);
      expect(clusters.length).toBeGreaterThan(1);
      expect(clusters.length).toBeLessThanOrEqual(8);
      expect(clusters.reduce((sum, c) => sum + c.count, 0)).toBe(opaque);
      expect(new Set(clusters.map(hexOf)).size).toBe(clusters.length);
    },
  );

  it("gives three flat colours far apart exactly, with their counts", () => {
    const red = Array.from({ length: 100 }, () => [255, 0, 0, 255]);
    const green = Array.from({ length: 50 }, () => [0, 255, 0, 255]);
    const blue = Array.from({ length: 10 }, () => [0, 0, 255, 255]);
    const clusters = quantizeWu(rgbaOf([...red, ...green, ...blue]), 8);
    expect([...clusters].sort((a, b) => b.count - a.count)).toEqual([
      { red: 255, green: 0, blue: 0, count: 100 },
      { red: 0, green: 255, blue: 0, count: 50 },
      { red: 0, green: 0, blue: 255, count: 10 },
    ]);
  });

  it("gives one cluster for one colour", () => {
    const flat = Array.from({ length: 30 }, () => [12, 200, 99, 255]);
    expect(quantizeWu(rgbaOf(flat), 8)).toEqual([{ red: 12, green: 200, blue: 99, count: 30 }]);
  });

  it("does not count a pixel with alpha 254", () => {
    const pixels = [
      [255, 0, 0, 255],
      [0, 255, 0, 254],
    ];
    expect(quantizeWu(rgbaOf(pixels), 8)).toEqual([{ red: 255, green: 0, blue: 0, count: 1 }]);
  });

  it("gives an empty list for a raster with no opaque pixel", () => {
    expect(
      quantizeWu(
        rgbaOf([
          [10, 20, 30, 0],
          [40, 50, 60, 254],
        ]),
        8,
      ),
    ).toEqual([]);
    expect(quantizeWu(new Uint8Array(0), 8)).toEqual([]);
  });

  it("gives one box, its mean colour and its count, when only one cluster is allowed", () => {
    expect(
      quantizeWu(
        rgbaOf([
          [0, 0, 0, 255],
          [254, 254, 254, 255],
        ]),
        1,
      ),
    ).toEqual([{ red: 127, green: 127, blue: 127, count: 2 }]);
  });
});

// ---------------------------------------------------------------- row 8, 0.4.0

// The cluster colours of `new QuantizerWu().quantize(argbPixels, 8)` from @material/material-color-utilities
// 0.4.0 (tarball dist.integrity sha512-dlq6VExJReb8dhjj3a/yTigr3ncNwoFmL5Iy2ENtbDX03EmNeOEdZ+vsaGrj7RTuO+mB7L58II4LCsl4NpM8uw==),
// in the order it returns them, on the two rasters above. Recorded once by a scratch run outside the
// repo (named in the ORV-134 PR 1 report); this test imports no package. The two small cases below
// were recorded by the same run.
const EXPECTED_04: Record<string, string[]> = {
  "320 x 200": ["141820", "8729e1", "bc2c72", "c47a59", "bc1de2", "4a0744", "dc7a4c", "dc7a64"],
  "320 x 2000": ["141820", "9414c3", "103ecf", "26a251", "d1517b", "145cfb", "942cc3", "3a956f"],
};

describe("the port gives 0.4.0's colours", () => {
  it.each(RASTERS)("$name", ({ name, raster }) => {
    expect(quantizeWu(raster, 8).map(hexOf)).toEqual(EXPECTED_04[name]);
  });

  it("keeps cutting the other boxes when one box cannot be cut", () => {
    // Eight shades inside one 5-bit cell (8,000 pixels) have the largest variance and no cut position;
    // red wins with no cut there, so the cut is refused and the two small groups are cut next.
    const pixels: number[][] = [];
    for (let shade = 0; shade < 8; shade++) {
      for (let i = 0; i < 1000; i++) pixels.push([shade, 0, 0, 255]);
    }
    for (const red of [100, 108]) pixels.push([red, 100, 100, 255], [red, 100, 100, 255]);
    expect(quantizeWu(rgbaOf(pixels), 3).map(hexOf)).toEqual(["040000", "646464", "6c6464"]);
  });

  it("cuts the box of the lower index when two boxes have the same variance", () => {
    // Two pairs of colours, each pair 64 apart in blue: after the cut between the pairs the two boxes
    // have equal variance, and the left one is cut.
    const pixels: number[][] = [];
    const colours: [number, number][] = [
      [0, 0],
      [0, 64],
      [200, 0],
      [200, 64],
    ];
    for (const [red, blue] of colours) {
      for (let i = 0; i < 10; i++) pixels.push([red, 0, blue, 255]);
    }
    expect(quantizeWu(rgbaOf(pixels), 3).map(hexOf)).toEqual(["000000", "c80020", "000040"]);
  });
});
