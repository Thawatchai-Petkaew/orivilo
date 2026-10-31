/**
 * The Logo's geometry and sizing (ORV-118, rules `logo-geometry-1` and `logo-size-1`, spec rows 1,
 * 3 and 5, worked examples W1 to W5). Every drawn number is compared with the three brand files in
 * `docs/context/brand/assets/`, parsed here. Colours in those files are ignored: the tokens own
 * colour. The render cases (rows 5, 7, 8) run the component through `renderToStaticMarkup`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import { en } from "../../i18n/messages/en";
import { th } from "../../i18n/messages/th";
import { Logo, type LogoProps } from "./Logo";
import {
  DEFAULT_HEIGHT,
  DOT_RADIUS,
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

  it("opens 110 degrees: the arc is the G2 arc and its lower end is on the horizontal through the centre", () => {
    const { d, centre, start, end } = GEOMETRY.mark.ring;
    expect(d).toBe("M 57.04 28.17 A 52.5 52.5 0 1 0 127.5 77.5");
    expect(start).toEqual([57.04, 28.17]);
    expect(end).toEqual([127.5, 77.5]);
    expect(end[1]).toBe(centre[1]);
    // The angle between the two ends, seen from the centre, is the opening.
    const angle = ([x, y]: readonly [number, number]) =>
      (Math.atan2(centre[1] - y, x - centre[0]) * 180) / Math.PI;
    expect(Math.round(angle(start) - angle(end))).toBe(110);
  });
});

describe("W2: the dot has the same gap to each cap", () => {
  const { ring, dot } = GEOMETRY.mark;
  const toDot = (p: readonly [number, number]) => Math.hypot(p[0] - dot.cx, p[1] - dot.cy);

  it("is the same distance from the dot to both ends, within the 2-decimal rounding of the ends", () => {
    expect(Math.abs(toDot(ring.start) - toDot(ring.end))).toBeLessThan(0.01);
  });

  it("is 18.48, 16.48 and 14.48 units at the three strokes, and 3.94, 2.64 and 1.54 px at 32, 24 and 16", () => {
    const nearest = Math.min(toDot(ring.start), toDot(ring.end));
    const lines = [32, 24, 16].map((height) => {
      const { form } = logoSize("mark", height);
      const stroke = RING_STROKE[form];
      const gap = nearest - (stroke / 2 + DOT_RADIUS[form]);
      return `${stroke} ${gap.toFixed(2)} ${((gap * height) / GEOMETRY.mark.viewBox[3]).toFixed(2)}`;
    });
    expect(lines).toEqual(["30 18.48 3.94", "32 16.48 2.64", "34 14.48 1.54"]);
  });

  it("makes the dot as wide as the ring stroke in each form (34, 32, 30)", () => {
    for (const form of ["16", "24", "master"] as const)
      expect(DOT_RADIUS[form] * 2, `form ${form}`).toBe(RING_STROKE[form]);
    expect(DOT_RADIUS).toEqual({ "16": 17, "24": 16, master: 15 });
    expect(GEOMETRY.mark.dot.r).toBe(DOT_RADIUS.master);
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

// ---------------------------------------------------------------------------------------------
// The render cases: the component's markup (tech.md section 4, "Rendered markup").
// ---------------------------------------------------------------------------------------------

const render = (props: LogoProps = {}, locale: "th" | "en" = "th"): string =>
  renderToStaticMarkup(
    createElement(LocaleProvider, { locale, children: createElement(Logo, props) }),
  );

/** The attributes of the root `<svg>` start tag. */
const rootAttrs = (markup: string): Attrs => attrsOf(/<svg\s[^>]*>/.exec(markup)?.[0] ?? "");

describe("renders the markup of logo-api-1", () => {
  it("is React's static output for a mark at 16, with the attribute order fixed", () => {
    expect(render({ kind: "mark", height: 16 })).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" class="ds-logo" data-kind="mark" data-form="16" data-tone="full" viewBox="0 0 150 150" width="16" height="16" role="img" aria-label="ORIVILO"><path class="ds-logo__ring" d="M 57.04 28.17 A 52.5 52.5 0 1 0 127.5 77.5" fill="none" stroke-width="34" stroke-linecap="round"></path><circle class="ds-logo__dot" cx="105.11" cy="34.49" r="17"></circle></svg>',
    );
  });

  it("draws the dot as wide as the ring stroke: r 17, 16 and 15 at the three forms", () => {
    const dotAndRing = (height: number) => {
      const markup = render({ kind: "mark", height });
      const dot = attrsOf(/<circle\s[^>]*>/.exec(markup)?.[0] ?? "");
      const ring = attrsOf(/<path\s[^>]*>/.exec(markup)?.[0] ?? "");
      return `${dot["r"]} ${ring["stroke-width"]}`;
    };
    expect([16, 24, 64].map(dotAndRing)).toEqual(["17 34", "16 32", "15 30"]);
  });

  it("defaults to a horizontal lockup, 24 high, in full tone", () => {
    const a = rootAttrs(render());
    expect([a["data-kind"], a["height"], a["width"], a["data-tone"], a["data-form"]]).toEqual([
      "horizontal",
      "24",
      "106.08",
      "full",
      "24",
    ]);
  });

  it("draws the horizontal wordmark in a translate(190 45) group after the mark at the origin", () => {
    const markup = render({ kind: "horizontal", height: 64 });
    expect(markup).toContain('<g transform="translate(190 45)">');
    expect(markup.indexOf("ds-logo__ring")).toBeLessThan(markup.indexOf("translate(190 45)"));
    expect(rootAttrs(markup)["viewBox"]).toBe("0 0 663 150");
  });

  it("draws the stacked mark in translate(161.5 0) and the wordmark in translate(0 270)", () => {
    const markup = render({ kind: "stacked", height: 80 });
    expect(markup.indexOf('transform="translate(161.5 0)"')).toBeGreaterThan(-1);
    expect(markup.indexOf('transform="translate(161.5 0)"')).toBeLessThan(
      markup.indexOf('transform="translate(0 270)"'),
    );
    expect(rootAttrs(markup)["viewBox"]).toBe("0 0 473 375");
  });

  it("draws the wordmark in a stroked group and a filled group, with no ring and no ds-logo__dot", () => {
    const markup = render({ kind: "wordmark", height: 20 });
    expect(markup).toContain(
      '<g class="ds-logo__strokes" fill="none" stroke-width="24" stroke-linecap="butt" stroke-linejoin="round">',
    );
    expect(markup).toContain('<g class="ds-logo__fills">');
    expect(markup).not.toContain("ds-logo__ring");
    expect(markup).not.toContain("ds-logo__dot");
    const [strokes, fills] = markup.split('<g class="ds-logo__fills">');
    expect(shapesOf(strokes ?? "")).toEqual(strokeElements());
    expect(numbers(shapesOf(fills ?? "")[0]?.attrs["points"] ?? "")).toEqual(
      GEOMETRY.wordmark.fills.polygon.flat(),
    );
    expect(rootAttrs(markup)["data-form"]).toBe("master");
  });

  it("writes the ring stroke of the form the height calls for", () => {
    const stroke = (height: number) =>
      shapesOf(render({ kind: "mark", height }))[0]?.attrs["stroke-width"];
    expect([16, 19.9, 20, 24, 24.1, 120].map(stroke)).toEqual(["34", "34", "32", "32", "30", "30"]);
  });

  it("joins className after ds-logo", () => {
    expect(rootAttrs(render({ className: "ms-2" }))["class"]).toBe("ds-logo ms-2");
  });

  it("carries no colour: no stroke, style or fill other than none, and no hex", () => {
    for (const kind of ["mark", "wordmark", "horizontal", "stacked"] as const) {
      const markup = render({ kind, height: 80, tone: "one-colour" });
      expect(markup, kind).not.toMatch(/\sstroke="/);
      expect(markup, kind).not.toMatch(/\sstyle="/);
      expect(markup, kind).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      const fills = [...markup.matchAll(/\sfill="([^"]*)"/g)].map((m) => m[1]);
      expect(
        fills.every((f) => f === "none"),
        kind,
      ).toBe(true);
    }
  });

  it("passes no prop through to the svg: style, fill, stroke, width and color are dropped", () => {
    const props = { style: { color: "red" }, fill: "red", stroke: "red", width: 999, color: "red" };
    const markup = render({ kind: "mark", height: 40, ...props } as LogoProps);
    expect(markup).toBe(render({ kind: "mark", height: 40 }));
  });

  it("writes data-tone for the recipe and keeps the geometry the same in both tones", () => {
    const full = render({ kind: "horizontal", tone: "full" });
    const one = render({ kind: "horizontal", tone: "one-colour" });
    expect(rootAttrs(one)["data-tone"]).toBe("one-colour");
    expect(one.replace('data-tone="one-colour"', 'data-tone="full"')).toBe(full);
  });

  it("gives the same markup when asked twice", () => {
    expect(render({ kind: "stacked", height: 61 })).toBe(render({ kind: "stacked", height: 61 }));
  });
});

describe("never renders below the kind's minimum (the markup)", () => {
  it("renders mark 12 at 16, wordmark 10 at 20, horizontal 10 at 20 and stacked 30 at 50", () => {
    const heights = (
      [
        ["mark", 12],
        ["wordmark", 10],
        ["horizontal", 10],
        ["stacked", 30],
      ] as const
    ).map(([kind, height]) => rootAttrs(render({ kind, height }))["height"]);
    expect(heights).toEqual(["16", "20", "20", "50"]);
  });

  it("renders NaN and Infinity at the larger of 24 and the minimum, and 0 and -5 at the minimum", () => {
    const at = (kind: LogoKind, height: number) => rootAttrs(render({ kind, height }))["height"];
    for (const kind of ["mark", "wordmark", "horizontal"] as const) {
      expect(at(kind, Number.NaN)).toBe("24");
      expect(at(kind, Number.POSITIVE_INFINITY)).toBe("24");
      expect(at(kind, 0)).toBe(String(MINIMUM[kind]));
      expect(at(kind, -5)).toBe(String(MINIMUM[kind]));
    }
    expect(at("stacked", Number.NaN)).toBe("50");
    expect(at("stacked", Number.POSITIVE_INFINITY)).toBe("50");
    expect(at("stacked", -5)).toBe("50");
  });

  it("writes a data-form that agrees with the written height", () => {
    const a = rootAttrs(render({ kind: "stacked", height: 60 }));
    const b = rootAttrs(render({ kind: "stacked", height: 60.25 }));
    expect([a["data-form"], b["data-form"]]).toEqual(["24", "master"]);
  });
});

describe("names the image from the catalog", () => {
  it("is role=img with the Thai and the English name of the catalog", () => {
    for (const [locale, messages] of [
      ["th", th],
      ["en", en],
    ] as const) {
      const a = rootAttrs(render({}, locale));
      expect(a["role"], locale).toBe("img");
      expect(a["aria-label"], locale).toBe(messages.logo.name);
      expect(a["aria-label"], locale).toBe("ORIVILO");
      expect(a["aria-hidden"], locale).toBeUndefined();
    }
  });

  it("has no title element, so there is one name and no tooltip", () => {
    expect(render()).not.toContain("<title");
  });

  it("names the image in the default Thai locale outside any provider", () => {
    const markup = renderToStaticMarkup(createElement(Logo));
    expect(rootAttrs(markup)["aria-label"]).toBe(th.logo.name);
  });
});

describe("hides a decorative image from assistive tech", () => {
  it("writes aria-hidden=true, with no role and no aria-label", () => {
    for (const kind of ["mark", "wordmark", "horizontal", "stacked"] as const) {
      const a = rootAttrs(render({ kind, decorative: true }));
      expect(a["aria-hidden"], kind).toBe("true");
      expect(a["role"], kind).toBeUndefined();
      expect(a["aria-label"], kind).toBeUndefined();
    }
  });

  it("draws the same shapes named and decorative", () => {
    const strip = (m: string) =>
      m.replace(/ role="img" aria-label="ORIVILO"| aria-hidden="true"/, "");
    expect(strip(render({ kind: "horizontal" }))).toBe(
      strip(render({ kind: "horizontal", decorative: true })),
    );
  });
});
