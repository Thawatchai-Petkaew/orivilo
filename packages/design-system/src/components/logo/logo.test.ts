/**
 * The Logo's geometry and sizing (ORV-118, rules `logo-geometry-1` and `logo-size-1`, spec rows 1,
 * 3 and 5, worked examples W1 to W5). Every drawn number is compared with the three brand files in
 * `docs/context/brand/assets/`, parsed here. Colours in those files are ignored: the tokens own
 * colour. The render cases are added with the component.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_HEIGHT,
  GEOMETRY,
  type LogoKind,
  MINIMUM,
  RING_STROKE,
  formOf,
  logoSize,
  round2,
} from "./geometry";

const assets = path.join(import.meta.dirname, "../../../../../docs/context/brand/assets");
const read = (file: string) => readFileSync(path.join(assets, file), "utf8");

type Attrs = Record<string, string>;
interface Element {
  tag: string;
  attrs: Attrs;
}

/** The attributes of one start tag, as a name to value map. */
function attrsOf(tag: string): Attrs {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
}

/** Every `path`, `circle` and `polygon` of a fragment, in document order. */
function shapesOf(fragment: string): Element[] {
  return [...fragment.matchAll(/<(path|circle|polygon)\s([^>]*?)\/?>/g)].map((m) => ({
    tag: m[1] ?? "",
    attrs: attrsOf(m[2] ?? ""),
  }));
}

const numbers = (text: string): number[] => (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
const viewBoxOf = (svg: string): number[] =>
  numbers(attrsOf(/<svg\s[^>]*>/.exec(svg)?.[0] ?? "")["viewBox"] ?? "");

/** The wordmark's two groups: the stroked one (`fill="none"`) and the filled one. */
function wordmarkGroups(svg: string): { strokes: string; fills: string; strokeAttrs: Attrs } {
  const strokes = /<g (fill="none"[^>]*)>([\s\S]*?)<\/g>/.exec(svg);
  const fills = /<g (fill="#[0-9A-Fa-f]+")>([\s\S]*?)<\/g>/.exec(svg);
  if (!strokes || !fills) throw new Error("the wordmark groups are missing");
  return {
    strokes: strokes[2] ?? "",
    fills: fills[2] ?? "",
    strokeAttrs: attrsOf(strokes[1] ?? ""),
  };
}

const n = (value: string | undefined): number => Number(value);

/** The geometry's wordmark strokes, as the brand file's elements read. */
function strokeElements(): { tag: string; attrs: Attrs }[] {
  return GEOMETRY.wordmark.strokes.shapes.map((s) =>
    s.shape === "circle"
      ? { tag: "circle", attrs: { cx: String(s.cx), cy: String(s.cy), r: String(s.r) } }
      : { tag: "path", attrs: { d: s.d } },
  );
}

function expectWordmarkDrawn(svg: string) {
  const { strokes, fills, strokeAttrs } = wordmarkGroups(svg);
  expect(shapesOf(strokes)).toEqual(strokeElements());
  expect(n(strokeAttrs["stroke-width"])).toBe(GEOMETRY.wordmark.strokes.width);
  expect(strokeAttrs["stroke-linecap"]).toBe(GEOMETRY.wordmark.strokes.cap);
  expect(strokeAttrs["stroke-linejoin"]).toBe(GEOMETRY.wordmark.strokes.join);
  const [polygon, ...dots] = shapesOf(fills);
  expect(polygon?.tag).toBe("polygon");
  expect(numbers(polygon?.attrs["points"] ?? "")).toEqual(GEOMETRY.wordmark.fills.polygon.flat());
  expect(
    dots.map((d) => ({
      tag: d.tag,
      cx: n(d.attrs["cx"]),
      cy: n(d.attrs["cy"]),
      r: n(d.attrs["r"]),
    })),
  ).toEqual(GEOMETRY.wordmark.fills.dots.map((d) => ({ tag: "circle", ...d })));
}

function expectMarkDrawn(shapes: Element[], strokeWidth = RING_STROKE.master) {
  const [ring, dot] = shapes;
  const g = GEOMETRY.mark;
  expect(ring?.tag).toBe("path");
  expect(ring?.attrs["d"]).toBe(g.ring.d);
  expect(ring?.attrs["stroke-linecap"]).toBe(g.ring.cap);
  expect(n(ring?.attrs["stroke-width"])).toBe(strokeWidth);
  expect(dot?.tag).toBe("circle");
  expect({ cx: n(dot?.attrs["cx"]), cy: n(dot?.attrs["cy"]), r: n(dot?.attrs["r"]) }).toEqual(
    g.dot,
  );
}

describe("draws each kind as logo-geometry-1 and the brand files", () => {
  const mark = read("orivilo-mark.svg");
  const wordmark = read("orivilo-wordmark.svg");
  const lockup = read("orivilo-lockup.svg");

  it("mark: the viewBox, the ring path with its cap, and the dot", () => {
    expect(viewBoxOf(mark)).toEqual([...GEOMETRY.mark.viewBox]);
    expectMarkDrawn(shapesOf(mark));
  });

  it("mark: the ring path is the arc from start to end around the centre", () => {
    const { ring } = GEOMETRY.mark;
    expect(ring.d).toBe(
      `M ${ring.start.join(" ")} A ${ring.radius} ${ring.radius} 0 1 0 ${ring.end.join(" ")}`,
    );
  });

  it("wordmark: the viewBox, every stroked shape, the stroke, the v and the i-dots", () => {
    expect(viewBoxOf(wordmark)).toEqual([...GEOMETRY.wordmark.viewBox]);
    expectWordmarkDrawn(wordmark);
  });

  it("wordmark: the v and every stem end on the baseline", () => {
    const { baseline, strokes, fills } = GEOMETRY.wordmark;
    expect(Math.max(...fills.polygon.map(([, y]) => y))).toBe(baseline);
    const stems = strokes.shapes
      .filter((s) => s.shape === "path")
      .map((s) => (s.shape === "path" ? s.d : ""));
    for (const d of stems) expect(d).toMatch(new RegExp(`^M \\d+ ${baseline} `));
  });

  it("horizontal: the viewBox, the mark at the origin and the wordmark's translate", () => {
    expect(viewBoxOf(lockup)).toEqual([...GEOMETRY.horizontal.viewBox]);
    const markPart = lockup.slice(0, lockup.indexOf("<g transform"));
    expectMarkDrawn(shapesOf(markPart));
    const translate = /<g transform="translate\(([^)]*)\)"/.exec(lockup)?.[1] ?? "";
    expect(numbers(translate)).toEqual([...GEOMETRY.horizontal.wordmarkAt]);
    expectWordmarkDrawn(lockup.slice(lockup.indexOf("<g transform")));
  });

  it("horizontal: the two 150 boxes are bottom-aligned and 40 apart", () => {
    const [, , , height] = GEOMETRY.horizontal.viewBox;
    const [, wordmarkTop, wordmarkWidth, wordmarkHeight] = GEOMETRY.wordmark.viewBox;
    const [x, y] = GEOMETRY.horizontal.wordmarkAt;
    expect(y + wordmarkTop + wordmarkHeight).toBe(GEOMETRY.mark.viewBox[3]);
    expect(x - GEOMETRY.mark.viewBox[2]).toBe(40);
    expect(x + wordmarkWidth).toBe(GEOMETRY.horizontal.viewBox[2]);
    expect(height).toBe(GEOMETRY.mark.viewBox[3]);
  });

  it("stacked (W5): the mark box is centred above the wordmark box with a gap of 0.5 of the mark box", () => {
    const [, , markWidth, markHeight] = GEOMETRY.mark.viewBox;
    const [, wordmarkTop, wordmarkWidth, wordmarkHeight] = GEOMETRY.wordmark.viewBox;
    const gap = 0.5 * markHeight;
    const markX = (wordmarkWidth - markWidth) / 2;
    const boxTop = markHeight + gap;
    expect(GEOMETRY.stacked.markAt).toEqual([markX, 0]);
    expect(GEOMETRY.stacked.wordmarkAt).toEqual([0, boxTop - wordmarkTop]);
    expect(GEOMETRY.stacked.viewBox).toEqual([0, 0, wordmarkWidth, boxTop + wordmarkHeight]);
    // W5, as the spec prints it: mark x, wordmark box top, wordmark translate y, total height.
    expect(
      [markX.toFixed(2), boxTop, boxTop - wordmarkTop, boxTop + wordmarkHeight].join(" "),
    ).toBe("161.50 225 270 375");
  });
});

describe("W1: both arc ends lie on the ring", () => {
  it("is 52.50 from the centre at both ends", () => {
    const { centre, start, end, radius } = GEOMETRY.mark.ring;
    const distance = ([x, y]: readonly [number, number]) =>
      Math.hypot(x - centre[0], y - centre[1]).toFixed(2);
    expect(`${distance(start)} ${distance(end)}`).toBe("52.50 52.50");
    expect(radius).toBe(52.5);
  });
});

describe("W2: the dot has the same gap to each cap", () => {
  const { ring, dot } = GEOMETRY.mark;
  const toDot = (p: readonly [number, number]) => Math.hypot(p[0] - dot.cx, p[1] - dot.cy);

  it("is the same distance from the dot to both ends, within the 2-decimal rounding of the ends", () => {
    expect(Math.abs(toDot(ring.start) - toDot(ring.end))).toBeLessThan(0.005);
  });

  it("is 5.91, 4.91 and 3.91 units at the three strokes, and 1.26, 0.79 and 0.42 px at 32, 24 and 16", () => {
    const nearest = Math.min(toDot(ring.start), toDot(ring.end));
    const lines = [32, 24, 16].map((height) => {
      const { form } = logoSize("mark", height);
      const stroke = RING_STROKE[form];
      const gap = nearest - (stroke / 2 + dot.r);
      return `${stroke} ${gap.toFixed(2)} ${((gap * height) / GEOMETRY.mark.viewBox[3]).toFixed(2)}`;
    });
    expect(lines).toEqual(["30 5.91 1.26", "32 4.91 0.79", "34 3.91 0.42"]);
  });
});

describe("picks the form from the mark height", () => {
  const HEIGHTS = [12, 16, 19.9, 20, 24, 24.1, 32, 120];

  it("W3: gives the ring stroke 34 34 34 32 32 30 30 30 for the eight heights", () => {
    const strokes = HEIGHTS.map((h) => RING_STROKE[logoSize("mark", h).form]);
    expect(strokes.join(" ")).toBe("34 34 34 32 32 30 30 30");
  });

  it("names the form of each height", () => {
    expect(HEIGHTS.map((h) => logoSize("mark", h).form)).toEqual([
      "16",
      "16",
      "16",
      "24",
      "24",
      "master",
      "master",
      "master",
    ]);
  });

  it("has the three strokes 34, 32 and 30, and no other form", () => {
    expect(RING_STROKE).toEqual({ "16": 34, "24": 32, master: 30 });
  });

  it("draws a stacked lockup in form 24 at 60 and in the master at 60.25", () => {
    expect(logoSize("stacked", 60).form).toBe("24");
    expect(logoSize("stacked", 60.25).form).toBe("master");
  });

  it("takes the mark height of a stacked lockup as height x 150 / 375", () => {
    expect(logoSize("stacked", 50).markHeight).toBe(20);
    expect(logoSize("stacked", 50).form).toBe("24");
    expect(logoSize("stacked", 80).markHeight).toBe(32);
    expect(logoSize("stacked", 60).markHeight).toBe(24);
  });

  it("takes the mark height of a horizontal lockup as its height", () => {
    expect(logoSize("horizontal", 24).markHeight).toBe(24);
    expect(logoSize("horizontal", 20).form).toBe("24");
    expect(logoSize("horizontal", 24.1).form).toBe("master");
  });

  it("always draws a wordmark in the master form, with no mark", () => {
    for (const h of [20, 24, 64])
      expect(logoSize("wordmark", h)).toMatchObject({ form: "master", markHeight: null });
  });

  it("reads the form from the height after it is rounded to 2 decimals", () => {
    expect(logoSize("mark", 19.996)).toMatchObject({ height: 20, form: "24" });
    expect(logoSize("mark", 24.004)).toMatchObject({ height: 24, form: "24" });
    expect(logoSize("mark", 24.006)).toMatchObject({ height: 24.01, form: "master" });
  });

  it("draws the boundaries: below 20 is 16, 20 to 24 is 24, above 24 is the master", () => {
    expect([19.99, 20, 24, 24.01].map(formOf)).toEqual(["16", "24", "24", "master"]);
  });

  it("gives the same answer when asked twice", () => {
    for (const h of HEIGHTS) expect(logoSize("mark", h)).toEqual(logoSize("mark", h));
  });
});

describe("never renders below the kind's minimum", () => {
  const KINDS: LogoKind[] = ["mark", "wordmark", "horizontal", "stacked"];

  it("has the minimums mark 16, wordmark 20, horizontal 20 and stacked 50", () => {
    expect(MINIMUM).toEqual({ mark: 16, wordmark: 20, horizontal: 20, stacked: 50 });
  });

  it("raises mark 12, wordmark 10, horizontal 10 and stacked 30 to their minimums", () => {
    expect(logoSize("mark", 12).height).toBe(16);
    expect(logoSize("wordmark", 10).height).toBe(20);
    expect(logoSize("horizontal", 10).height).toBe(20);
    expect(logoSize("stacked", 30).height).toBe(50);
  });

  it("keeps a height that is exactly the minimum", () => {
    for (const kind of KINDS) expect(logoSize(kind, MINIMUM[kind]).height).toBe(MINIMUM[kind]);
  });

  it("keeps a height just above the minimum", () => {
    for (const kind of KINDS)
      expect(logoSize(kind, MINIMUM[kind] + 0.5).height).toBe(MINIMUM[kind] + 0.5);
  });

  it("raises 0 and -5 to the minimum", () => {
    for (const kind of KINDS)
      for (const h of [0, -5]) expect(logoSize(kind, h).height).toBe(MINIMUM[kind]);
  });

  it("renders NaN and Infinity at the larger of 24 and the minimum", () => {
    expect(DEFAULT_HEIGHT).toBe(24);
    for (const kind of KINDS)
      for (const h of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])
        expect(logoSize(kind, h).height).toBe(Math.max(24, MINIMUM[kind]));
  });

  it("rounds the height to 2 decimals", () => {
    expect(logoSize("mark", 40.126).height).toBe(40.13);
    expect([round2(1.2345), round2(1.236)]).toEqual([1.23, 1.24]);
  });
});

describe("W4: width follows from the viewBox ratio", () => {
  it("is 106.08 for a horizontal 24, 63.07 for a wordmark 20 and 100.91 for a stacked 80", () => {
    const widths = [
      logoSize("horizontal", 24),
      logoSize("wordmark", 20),
      logoSize("stacked", 80),
    ].map((s) => s.width.toFixed(2));
    expect(widths).toEqual(["106.08", "63.07", "100.91"]);
  });

  it("is the height for a mark, and 64 high gives the Kinds story widths", () => {
    expect(logoSize("mark", 16).width).toBe(16);
    expect(logoSize("horizontal", 64).width).toBe(282.88);
    expect(logoSize("wordmark", 64).width).toBe(201.81);
    expect(logoSize("stacked", 64).width).toBe(80.73);
  });

  it("has a mark of 32 inside a stacked 80 and of 20 inside a stacked 50, and a header clear space of 4.80", () => {
    const stacked80 = logoSize("stacked", 80).markHeight ?? 0;
    const stacked50 = logoSize("stacked", 50).markHeight ?? 0;
    const header = logoSize("horizontal", 24).markHeight ?? 0;
    const clearSpace = (header * RING_STROKE.master) / GEOMETRY.mark.viewBox[3];
    expect([stacked80.toFixed(2), stacked50.toFixed(2), clearSpace.toFixed(2)]).toEqual([
      "32.00",
      "20.00",
      "4.80",
    ]);
  });
});
