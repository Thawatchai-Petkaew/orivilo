import { describe, expect, it } from "vitest";
import { PATH_MAX_CHARS as PATH_MAX_FROM_EVIDENCE } from "./evidence";
import { PATH_MAX_CHARS, renderSnapshotSchema, type RenderSnapshot } from "./render-snapshot";

// ORV-128 tech notes section 7 (F46, F47) and section 14, row 34: the snapshot is untrusted data,
// parsed by a strict, bounded schema. Each case below is one clause of the schema, on a snapshot that
// is valid but for that clause, and asserts the path of the issue.

const BUILD = {
  driver: "playwright",
  driverVersion: "1.56.1",
  browser: "chromium",
  browserVersion: "141.0.7390.37",
};
const raster = (height: number) => ({
  width: 320,
  height,
  rgba: new Uint8Array(320 * height * 4).fill(255),
});
const BOX = { x: 0, y: 0, width: 100, height: 20 };
const TEXT_BOX = {
  path: "html>body>p:nth-of-type(1)",
  box: BOX,
  pair: { color: "#1a1a1a", backdrop: "#ffffff" },
  fontFamily: '"Noto Sans Thai"',
};
type Loose = Record<string, unknown>;
const snapshot = (over: Loose = {}): Loose => ({
  version: "1",
  renderer: BUILD,
  viewport: { width: 1280, height: 800 },
  firstScreen: raster(200),
  fullPage: raster(400),
  textBoxes: [TEXT_BOX],
  elements: [BOX],
  ...over,
});

/** Every distinct issue path, as `a.b.0.c`; an `unrecognized_keys` issue reports its path and, after a colon, the keys. */
function issues(x: unknown): string[] | null {
  const r = renderSnapshotSchema.safeParse(x);
  if (r.success) return null;
  const all = r.error.issues.map((i) =>
    i.code === "unrecognized_keys" ? `${i.path.join(".")}:${i.keys.join(",")}` : i.path.join("."),
  );
  return [...new Set(all)]; // a value can fail two clauses at one path: it counts once
}
const parses = (x: unknown) => issues(x) === null;

describe("a valid snapshot", () => {
  it("parses and keeps its types", () => {
    const r = renderSnapshotSchema.safeParse(snapshot());
    expect(r.success).toBe(true);
    const parsed: RenderSnapshot | undefined = r.data;
    expect(parsed?.textBoxes[0]?.fontFamily).toBe('"Noto Sans Thai"');
  });

  it.each([
    ["version", { version: "2" }],
    ["viewport width", { viewport: { width: 1279, height: 800 } }],
    ["viewport height", { viewport: { width: 1280, height: 801 } }],
    ["a missing renderer", { renderer: undefined }],
    ["an extra key at the root", { screenshot: "x" }],
  ])("%s fails", (_name, over) => {
    expect(parses(snapshot(over))).toBe(false);
  });
});

describe("a raster is 320 wide and its bytes match its size", () => {
  const withFull = (full: unknown) => snapshot({ fullPage: full });
  const withFirst = (first: unknown) => snapshot({ firstScreen: first });

  it("firstScreen.width 319 fails at firstScreen.width", () => {
    const r = { width: 319, height: 200, rgba: new Uint8Array(319 * 200 * 4) };
    expect(issues(withFirst(r))).toEqual(["firstScreen.width"]);
  });

  it("firstScreen.height 199 and 201 fail at firstScreen.height; 200 parses", () => {
    for (const h of [199, 201]) {
      expect(issues(withFirst(raster(h)))).toEqual(["firstScreen.height"]);
    }
    expect(parses(withFirst(raster(200)))).toBe(true);
  });

  it("fullPage.height 0, 2001 and 1.5 fail at fullPage.height; 1 and 2000 parse", () => {
    for (const h of [0, 2001]) expect(issues(withFull(raster(h)))).toEqual(["fullPage.height"]);
    const fractional = { width: 320, height: 1.5, rgba: new Uint8Array(1920) };
    expect(issues(withFull(fractional))).toEqual(["fullPage.height"]);
    for (const h of [1, 2000]) expect(parses(withFull(raster(h)))).toBe(true);
  });

  it("a byte length one short or one over fails at fullPage.rgba", () => {
    const full = raster(400);
    for (const length of [full.rgba.length - 1, full.rgba.length + 1]) {
      const r = { ...full, rgba: new Uint8Array(length) };
      expect(issues(withFull(r))).toEqual(["fullPage.rgba"]);
    }
  });

  it("a plain number array and a Uint8ClampedArray of the right length fail at fullPage.rgba", () => {
    const length = 320 * 400 * 4;
    for (const rgba of [new Array<number>(length).fill(0), new Uint8ClampedArray(length)]) {
      expect(issues(withFull({ width: 320, height: 400, rgba }))).toEqual(["fullPage.rgba"]);
    }
  });

  it("an extra key in a raster fails at the raster's path", () => {
    expect(issues(withFull({ ...raster(400), alpha: 1 }))).toEqual(["fullPage:alpha"]);
    expect(issues(withFirst({ ...raster(200), alpha: 1 }))).toEqual(["firstScreen:alpha"]);
  });
});

describe("a box is whole CSS pixels inside the page", () => {
  const element = (box: Loose) => snapshot({ elements: [box] });
  const at = (name: string, over: Loose) => ({ ...BOX, [name]: undefined, ...over });

  it.each([
    ["x", -1],
    ["x", 1.5],
    ["x", 1281],
    ["x", Number.NaN],
    ["x", Number.POSITIVE_INFINITY],
    ["y", -1],
    ["y", 1.5],
    ["y", 1_000_001],
    ["width", -1],
    ["width", 1.5],
    ["width", 1281],
    ["height", -1],
    ["height", 1.5],
  ])("%s %s fails at its own path under elements.0", (name, value) => {
    expect(issues(element({ ...BOX, [name as string]: value }))).toContain(`elements.0.${name}`);
  });

  it("a text box's x of -1 fails at textBoxes.0.box.x", () => {
    const bad = snapshot({ textBoxes: [{ ...TEXT_BOX, box: { ...BOX, x: -1 } }] });
    expect(issues(bad)).toContain("textBoxes.0.box.x");
  });

  it("the right edge: x 1000 and width 281 fail at width; 280 parses; x 1280 with width 0 parses", () => {
    expect(issues(element({ ...BOX, x: 1000, width: 281 }))).toContain("elements.0.width");
    expect(parses(element({ ...BOX, x: 1000, width: 280 }))).toBe(true);
    expect(parses(element({ ...BOX, x: 1280, width: 0 }))).toBe(true);
  });

  it("the bottom edge: y 999999 and height 2 fail at height; y 0 with height 1000000 parses", () => {
    expect(issues(element({ ...BOX, y: 999_999, height: 2 }))).toContain("elements.0.height");
    expect(parses(element({ ...BOX, y: 0, height: 1_000_000 }))).toBe(true);
  });

  it("an empty box (width 0 or height 0) parses", () => {
    expect(parses(element({ ...BOX, width: 0 }))).toBe(true);
    expect(parses(element({ ...BOX, height: 0 }))).toBe(true);
  });

  it("a box missing a side fails", () => {
    expect(issues(element(at("height", {})))).toContain("elements.0.height");
  });

  it("an extra key in a box fails with unrecognized_keys at elements.0", () => {
    expect(issues(element({ ...BOX, z: 1 }))).toEqual(["elements.0:z"]);
  });

  it("more than 5,000 elements fail at elements", () => {
    expect(issues(snapshot({ elements: Array.from({ length: 5001 }, () => BOX) }))).toEqual([
      "elements",
    ]);
    expect(parses(snapshot({ elements: Array.from({ length: 5000 }, () => BOX) }))).toBe(true);
  });
});

describe("a text box names a path, a pair and a family, and holds no text", () => {
  const box = (over: Loose) => snapshot({ textBoxes: [{ ...TEXT_BOX, ...over }] });
  const pair = (over: Loose) => box({ pair: { ...TEXT_BOX.pair, ...over } });

  it.each([
    ["an empty path", ""],
    ["a path of 501 characters", `html>${"p".repeat(PATH_MAX_CHARS - 4)}`],
    ["a path without html first", "body>p"],
    ["an empty segment", "html>>p"],
    ["a trailing >", "html>body>"],
    ["a trailing space", "html>body>p "],
  ])("%s fails at textBoxes.0.path", (_name, path) => {
    expect(issues(box({ path }))).toEqual(["textBoxes.0.path"]);
  });

  it.each([
    ["a path of 500 characters", `html>${"p".repeat(PATH_MAX_CHARS - 5)}`],
    ["an element named p:x", "html>body>p:x:nth-of-type(1)"],
    ["an element name holding U+00A0", "html>body>p x:nth-of-type(1)"],
  ])("%s parses", (_name, path) => {
    expect(parses(box({ path }))).toBe(true);
  });

  it("the 500 and 501 character paths are the lengths they say", () => {
    expect(`html>${"p".repeat(PATH_MAX_CHARS - 5)}`).toHaveLength(PATH_MAX_CHARS);
    expect(`html>${"p".repeat(PATH_MAX_CHARS - 4)}`).toHaveLength(PATH_MAX_CHARS + 1);
  });

  it.each(["#FF7A00", "#ff7a0", "#ff7a0080", "rgb(255,122,0)", "ff7a00"])(
    "pair.color %s fails at textBoxes.0.pair.color",
    (color) => {
      expect(issues(pair({ color }))).toEqual(["textBoxes.0.pair.color"]);
    },
  );

  it("pair.backdrop #FFFFFF fails at textBoxes.0.pair.backdrop", () => {
    expect(issues(pair({ backdrop: "#FFFFFF" }))).toEqual(["textBoxes.0.pair.backdrop"]);
  });

  it("a pair without a backdrop fails there too", () => {
    expect(issues(box({ pair: { color: "#1a1a1a" } }))).toEqual(["textBoxes.0.pair.backdrop"]);
  });

  it("a pair with an extra key fails with unrecognized_keys at textBoxes.0.pair", () => {
    expect(issues(pair({ alpha: 1 }))).toEqual(["textBoxes.0.pair:alpha"]);
  });

  it("a null pair parses", () => {
    expect(parses(box({ pair: null }))).toBe(true);
  });

  it("an empty fontFamily and one of 101 characters fail at textBoxes.0.fontFamily; 100 parse", () => {
    expect(issues(box({ fontFamily: "" }))).toEqual(["textBoxes.0.fontFamily"]);
    expect(issues(box({ fontFamily: "a".repeat(101) }))).toEqual(["textBoxes.0.fontFamily"]);
    expect(parses(box({ fontFamily: "a".repeat(100) }))).toBe(true);
  });

  it("two text boxes with one path fail at textBoxes; with different paths they parse", () => {
    expect(issues(snapshot({ textBoxes: [TEXT_BOX, TEXT_BOX] }))).toEqual(["textBoxes"]);
    const other = { ...TEXT_BOX, path: "html>body>p:nth-of-type(2)" };
    expect(parses(snapshot({ textBoxes: [TEXT_BOX, other] }))).toBe(true);
  });

  it("more than 5,000 text boxes fail at textBoxes", () => {
    const many = (n: number) =>
      Array.from({ length: n }, (_v, i) => ({
        ...TEXT_BOX,
        path: `html>body>p:nth-of-type(${i + 1})`,
      }));
    expect(issues(snapshot({ textBoxes: many(5001) }))).toEqual(["textBoxes"]);
    expect(parses(snapshot({ textBoxes: many(5000) }))).toBe(true);
  });

  it("a text key fails with unrecognized_keys at textBoxes.0", () => {
    expect(issues(box({ text: "hello" }))).toEqual(["textBoxes.0:text"]);
  });

  it("PATH_MAX_CHARS from render-snapshot and from evidence is 500 both times", () => {
    expect(PATH_MAX_CHARS).toBe(500);
    expect(PATH_MAX_FROM_EVIDENCE).toBe(500);
  });
});
