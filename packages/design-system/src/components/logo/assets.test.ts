/**
 * The Logo's generated files (ORV-118 slice B, rules `logo-icon-1` and `logo-asset-1`, spec rows 17
 * to 21): the favicon SVG, the two app icon PNGs and the Storybook brand image. Each case regenerates
 * the files in memory from the drawing and the token source and never writes a file. Row 21 is the
 * freshness case: the committed bytes must equal a fresh render, and a changed token value or a
 * changed drawing number must make exactly the files that read it stale.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { beforeAll, describe, expect, it } from "vitest";
import primitives from "../../tokens/source/primitives.json";
import semantic from "../../tokens/source/semantic.json";
import component from "../../tokens/source/component.json";
import { TokenSet } from "../../tokens";
import { DOT_RADIUS, GEOMETRY, type Geometry, type LogoForm } from "./geometry";
import { REPO_ROOT, logoAssetFiles, staleAssets, type LogoAssetFile } from "./assets";

/** The wasm start and a few renders; sized for the CI runner under the parallel full suite. */
const HEAVY_TIMEOUT = 30_000;

const ICON_SVG = "apps/web/app/icon1.svg";
const ICON_32 = "apps/web/app/icon2.png";
const ICON_180 = "apps/web/app/apple-icon.png";
const STORYBOOK = "packages/design-system/.storybook/static/orivilo-logo.svg";
const ALL = [ICON_SVG, ICON_32, ICON_180, STORYBOOK];

const COMMAND = "pnpm --filter @orivilo/design-system logo-assets";

const text = (file: LogoAssetFile): string => Buffer.from(file.bytes).toString("utf8");
const byPath = (files: readonly LogoAssetFile[], p: string): LogoAssetFile => {
  const file = files.find((f) => f.path === p);
  if (!file) throw new Error(`${p} is not generated`);
  return file;
};
const readCommitted = (p: string): Uint8Array | undefined => {
  try {
    return readFileSync(path.join(REPO_ROOT, p));
  } catch {
    return undefined;
  }
};

interface Png {
  width: number;
  height: number;
  /** RGBA, row by row. */
  rgba: Uint8Array;
}

/** A decoder for what the rasteriser writes: 8-bit RGBA, no interlace. Anything else throws. */
function decodePng(bytes: Uint8Array): Png {
  const buf = Buffer.from(bytes);
  if (buf.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("not a PNG");
  let width = 0;
  let height = 0;
  const idat: Buffer[] = [];
  for (let at = 8; at < buf.length;) {
    const length = buf.readUInt32BE(at);
    const type = buf.subarray(at + 4, at + 8).toString("ascii");
    const data = buf.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0)
        throw new Error("expected 8-bit RGBA without interlace");
    } else if (type === "IDAT") idat.push(data);
    at += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const rgba = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)] ?? 0;
    for (let i = 0; i < stride; i++) {
      const x = raw[y * (stride + 1) + 1 + i] ?? 0;
      const left = i >= 4 ? (rgba[y * stride + i - 4] ?? 0) : 0;
      const up = y > 0 ? (rgba[(y - 1) * stride + i] ?? 0) : 0;
      const upLeft = y > 0 && i >= 4 ? (rgba[(y - 1) * stride + i - 4] ?? 0) : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      rgba[y * stride + i] = (x + predictor) & 0xff;
    }
  }
  return { width, height, rgba };
}

const hexAt = (png: Png, x: number, y: number): string => {
  const at = (y * png.width + x) * 4;
  const [r, g, b, a] = [0, 1, 2, 3].map((i) => png.rgba[at + i] ?? 0);
  if (a !== 255) return `alpha ${a}`;
  return `#${[r, g, b].map((v) => (v ?? 0).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
};
const alphaAt = (png: Png, x: number, y: number): number =>
  png.rgba[(y * png.width + x) * 4 + 3] ?? 0;

/** The `{ ... }` rules of one `<style>` block as a selector to declarations map. */
function rulesOf(css: string): Record<string, string> {
  return Object.fromEntries([...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1], m[2]]));
}
/** The style text outside the media block, and inside `@media (prefers-color-scheme:dark)`. */
function styleOf(svg: string): { light: string; dark: string | undefined } {
  const css = /<style>([\s\S]*?)<\/style>/.exec(svg)?.[1] ?? "";
  const media = /@media \(prefers-color-scheme:dark\)\{([\s\S]*)\}$/.exec(css);
  return { light: media ? css.slice(0, media.index) : css, dark: media?.[1] };
}

/** A token set built from copies of the three sources, with one `brand` colour changed. */
function setWith(
  token: "dot-small" | "signature",
  mode: "light" | "dark",
  value: string,
): TokenSet {
  type Node = { $value: Record<"light" | "dark", unknown> };
  const changed = structuredClone(semantic) as unknown as { brand: Record<string, Node> };
  const node = changed.brand[token];
  if (!node) throw new Error(`brand.${token} is missing`);
  node.$value[mode] = value;
  return new TokenSet(primitives, changed, component);
}

const stale = (fresh: readonly LogoAssetFile[], base: readonly LogoAssetFile[]): string[] =>
  staleAssets(fresh, (p) => base.find((f) => f.path === p)?.bytes);

let base: LogoAssetFile[];
beforeAll(async () => {
  base = await logoAssetFiles();
}, HEAVY_TIMEOUT);

describe("the favicon SVG (rows 17, 18)", () => {
  it("is the mark in form 16, light colours first and dark colours inside the media block", () => {
    const svg = text(byPath(base, ICON_SVG));
    expect(svg).toMatch(/^<svg [^>]*data-kind="mark"/);
    expect(svg).toContain('data-form="16"');
    expect(svg).toContain('stroke-width="34"');
    const { light, dark } = styleOf(svg);
    expect(rulesOf(light)).toMatchObject({
      ".ds-logo__ring,.ds-logo__strokes": "stroke:#16151D",
      ".ds-logo__dot": "fill:#7A22C7",
    });
    expect(dark).toBeDefined();
    expect(rulesOf(dark ?? "")).toMatchObject({
      ".ds-logo__ring,.ds-logo__strokes": "stroke:#F2F1EC",
      ".ds-logo__dot": "fill:#B07FEE",
    });
  });

  it("carries no ground, so the tab shows through", () => {
    expect(text(byPath(base, ICON_SVG))).not.toContain("<rect");
  });
});

describe("the app icons (rows 19, 20)", () => {
  // Pixel probes, in output pixels, derived from W7: the mark box is 2/3 of the side, centred; the
  // dot centre is at (105.11, 34.49) and the ring's left point at (22.5, 77.5) in the 150 unit box.
  const cases = [
    { file: ICON_32, side: 32, dot: [20, 10], ring: [8, 16], centre: [16, 16] },
    { file: ICON_180, side: 180, dot: [114, 57], ring: [48, 92], centre: [90, 90] },
  ] as const;

  it.each(cases)("$file is $side by $side with a transparent corner", ({ file, side }) => {
    const png = decodePng(byPath(base, file).bytes);
    expect([png.width, png.height]).toEqual([side, side]);
    expect(alphaAt(png, 0, 0)).toBe(0);
  });

  it.each(cases)("$file paints the ground, the ring and the dot", ({ file, dot, ring, centre }) => {
    const png = decodePng(byPath(base, file).bytes);
    expect(hexAt(png, centre[0], centre[1])).toBe("#16151D");
    expect(hexAt(png, ring[0], ring[1])).toBe("#F2F1EC");
    expect(hexAt(png, dot[0], dot[1])).toBe("#B07FEE");
  });

  it("draws the 32 px icon in form 24 and the 180 px icon in the master form", () => {
    // The ring's width across its left side, read from the pixels: the red channel runs from the
    // ground (#16) to the ring (#F2), so its sum over a row is the ring's width in pixels. Form 24
    // is 32 units on a 21.33 px box (4.55 px, 4.50 measured on row 15); form 16 would read 4.75 and the master 4.19. The master
    // form is 30 units on a 120 px box (24 px).
    const width = (file: string, y: number, to: number): number => {
      const png = decodePng(byPath(base, file).bytes);
      let sum = 0;
      for (let x = 0; x < to; x++)
        sum += ((png.rgba[(y * png.width + x) * 4] ?? 0) - 0x16) / (0xf2 - 0x16);
      return sum;
    };
    expect(Math.abs(width(ICON_32, 15, 14) - 4.5)).toBeLessThan(0.1);
    expect(Math.abs(width(ICON_180, 92, 90) - 24)).toBeLessThan(0.1);
  });
});

describe("the Storybook brand image", () => {
  it("is the horizontal lockup at height 24 in form 24, light colours only", () => {
    const svg = text(byPath(base, STORYBOOK));
    expect(svg).toMatch(/^<svg [^>]*data-kind="horizontal"/);
    expect(svg).toContain('height="24"');
    expect(svg).toContain('width="106.08"');
    expect(svg).toContain('data-form="24"');
    const { light, dark } = styleOf(svg);
    expect(dark).toBeUndefined();
    expect(rulesOf(light)).toMatchObject({ ".ds-logo__dot": "fill:#7A22C7" });
  });
});

describe("the committed assets are fresh (row 21)", () => {
  it(
    "generates the four files, in order, with equal bytes on two generations",
    async () => {
      expect(base.map((f) => f.path)).toEqual(ALL);
      const again = await logoAssetFiles();
      expect(stale(again, base)).toEqual([]);
      for (const f of again)
        expect(Buffer.from(f.bytes).equals(Buffer.from(byPath(base, f.path).bytes))).toBe(true);
    },
    HEAVY_TIMEOUT,
  );

  it("matches the committed files, or names each stale path and the command", () => {
    const paths = staleAssets(base, readCommitted);
    expect(paths, `Stale logo assets: ${paths.join(", ")}. Run: ${COMMAND}`).toEqual([]);
  });

  it(
    "changes exactly icon1.svg and the Storybook image when the light value of brand.dot-small changes",
    async () => {
      const files = await logoAssetFiles(setWith("dot-small", "light", "#112233"));
      expect(stale(files, base)).toEqual([ICON_SVG, STORYBOOK]);
    },
    HEAVY_TIMEOUT,
  );

  it(
    "changes exactly icon1.svg and icon2.png when the dark value of brand.dot-small changes",
    async () => {
      const files = await logoAssetFiles(setWith("dot-small", "dark", "#112233"));
      expect(stale(files, base)).toEqual([ICON_SVG, ICON_32]);
    },
    HEAVY_TIMEOUT,
  );

  it(
    "changes exactly apple-icon.png when the dark value of brand.signature changes",
    async () => {
      const files = await logoAssetFiles(setWith("signature", "dark", "#112233"));
      expect(stale(files, base)).toEqual([ICON_180]);
    },
    HEAVY_TIMEOUT,
  );

  it(
    "changes all four when the dot radius the drawing reads changes",
    async () => {
      const radii = DOT_RADIUS as Record<LogoForm, number>;
      const saved = { ...radii };
      for (const form of Object.keys(radii) as LogoForm[]) radii[form] = 17;
      try {
        const files = await logoAssetFiles();
        expect(stale(files, base)).toEqual(ALL);
      } finally {
        Object.assign(radii, saved);
      }
    },
    HEAVY_TIMEOUT,
  );

  it(
    "changes all four when the geometry changes",
    async () => {
      const moved: Geometry = {
        ...GEOMETRY,
        mark: {
          ...GEOMETRY.mark,
          ring: { ...GEOMETRY.mark.ring, d: "M 57.04 28.17 A 52.5 52.5 0 1 0 127.5 80" },
        },
      };
      const files = await logoAssetFiles(undefined, moved);
      expect(stale(files, base)).toEqual(ALL);
    },
    HEAVY_TIMEOUT,
  );
});

describe("a colour the generator cannot resolve", () => {
  /** A token set whose `logo.ink` component token is changed by `change`. */
  function setWithInk(change: (node: Record<string, unknown>) => void): TokenSet {
    const changed = structuredClone(component) as unknown as {
      logo: Record<string, Record<string, unknown>>;
    };
    change(changed.logo["ink"] ?? {});
    return new TokenSet(primitives, semantic, changed);
  }

  it("throws with the token path when the token is missing", async () => {
    const set = setWithInk((node) => {
      delete node["$value"];
      delete node["$type"];
    });
    await expect(logoAssetFiles(set)).rejects.toThrow('component token "logo.ink" is missing');
  });

  it("throws with the token path when the token is not a colour", async () => {
    const set = setWithInk((node) => {
      node["$type"] = "number";
    });
    await expect(logoAssetFiles(set)).rejects.toThrow('component token "logo.ink" is not a colour');
  });

  it("throws with the token path when a colour token resolves to no string", async () => {
    const set = setWithInk((node) => {
      node["$value"] = 5;
    });
    await expect(logoAssetFiles(set)).rejects.toThrow('"logo.ink" does not resolve to a colour');
  });
});

describe("staleAssets", () => {
  const file = (p: string, s: string): LogoAssetFile => ({ path: p, bytes: Buffer.from(s) });
  it("lists a path whose committed bytes differ or are missing, and none that match", () => {
    const fresh = [file("a", "1"), file("b", "2"), file("c", "3")];
    const committed: Record<string, Uint8Array> = { a: Buffer.from("1"), b: Buffer.from("x") };
    expect(staleAssets(fresh, (p) => committed[p])).toEqual(["b", "c"]);
  });
});
