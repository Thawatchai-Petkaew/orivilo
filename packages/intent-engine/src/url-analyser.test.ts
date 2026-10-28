import { describe, expect, it, vi } from "vitest";
import { classifyHex } from "./color-audit";
import {
  EVIDENCE_SCHEMA_VERSION,
  compareEvidence,
  inputEvidenceSchema,
  type InputEvidence,
} from "./evidence";
import * as engine from "./index";
import { slugSchema } from "./knowledge";
import { pageTextOf } from "./page-text";
import type { ReadPorts, ReadResult } from "./read-page";
import {
  analyseUrl,
  notMeasuredSchema,
  readUrlInput,
  type Analysis,
  type AnalyserContext,
} from "./url-analyser";

// ORV-128 tech notes sections 7 and 8, section 14 rows 4, 8 to 12, 34, 35 and 38 (slice 1c). The
// pages, stylesheets and snapshots are recorded in this file; nothing here reads a network.

declare class TextEncoder {
  encode(input: string): Uint8Array; // module-scoped: the engine tsconfig has no DOM lib
}
const enc = new TextEncoder();
// The engine has no Node type definitions (row 30 keeps node: out of its source), so the test loads
// the one function it needs without a typed import.
const { createHash } = (await vi.importActual("node:crypto")) as {
  createHash(algorithm: "sha256"): { update(b: Uint8Array): { digest(encoding: "hex"): string } };
};
const sha = (b: Uint8Array): string => createHash("sha256").update(b).digest("hex");

type Read = ReadResult & { status: "read" };
const fetched = (url: string, text: string) => {
  const bytes = enc.encode(text);
  return { url, bytes, contentHash: sha(bytes), truncated: false };
};
const PAGE_URL = "https://clinic.example/";
function readOf(
  html: string,
  sheets: [url: string, css: string][] = [],
  incomplete: Read["incomplete"] = [],
): Read {
  return {
    status: "read",
    url: PAGE_URL,
    document: fetched(PAGE_URL, html),
    stylesheets: sheets.map(([u, css]) => fetched(u, css)),
    incomplete,
  };
}

const BUILD = {
  driver: "playwright",
  driverVersion: "1.56.1",
  browser: "chromium",
  browserVersion: "141.0.7390.37",
} as const;
const CTX: AnalyserContext = {
  role: "own",
  retrievedAt: "2026-10-28T10:00:00.000Z",
  notRendered: null,
};
const CTX_D: AnalyserContext = { ...CTX, notRendered: "no-renderer" };

/** A raster 320 wide, `rows` rows of one opaque colour each. */
function raster(rows: [hex: string, count: number][]) {
  const height = rows.reduce((n, [, c]) => n + c, 0);
  const rgba = new Uint8Array(320 * height * 4);
  let at = 0;
  for (const [hex, count] of rows) {
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    for (let p = 0; p < 320 * count; p++) {
      rgba.set([rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0, 255], at);
      at += 4;
    }
  }
  return { width: 320, height, rgba };
}
const WARM_FIRST = raster([
  ["ff7a00", 140],
  ["ffffff", 60],
]); // 70 percent orange
const WARM_FULL = raster([
  ["ff7a00", 140],
  ["ffffff", 260],
]);

const BOX = { x: 40, y: 100, width: 600, height: 40 };
const FLAT = { color: "#1a1a1a", backdrop: "#ffffff" };
type TextBox = { path: string; box: typeof BOX; pair: typeof FLAT | null; fontFamily: string };
const textBox = (path: string, over: Partial<TextBox> = {}): TextBox => ({
  path,
  box: BOX,
  pair: FLAT,
  fontFamily: '"Noto Sans Thai"',
  ...over,
});
type Loose = Record<string, unknown>;
function snapshotOf(textBoxes: TextBox[], over: Loose = {}): Loose {
  return {
    version: "1",
    renderer: BUILD,
    viewport: { width: 1280, height: 800 },
    firstScreen: WARM_FIRST,
    fullPage: WARM_FULL,
    textBoxes,
    elements: [BOX, { ...BOX, y: 900 }],
    ...over,
  };
}

const H1 = "html>body>h1:nth-of-type(1)";
const H2A = "html>body>h2:nth-of-type(1)";
const H2B = "html>body>h2:nth-of-type(2)";
const P1 = "html>body>p:nth-of-type(1)";
const TITLE = "html>head>title:nth-of-type(1)";
const META = "html>head>meta:nth-of-type(1)";

const CSS_A =
  'a{color:#FF7A00;font-family:"Inter",sans-serif}b{color:rgb(255, 122, 0)}c{color:#0000ff}';
const HTML_A =
  '<!doctype html><html lang="en"><head><title>Bright Clinic</title>' +
  '<meta name="description" content="Warm care for families">' +
  '<link rel="stylesheet" href="/a.css"></head><body>' +
  "<h1>premium and calm</h1><h2>ไม่หรูหรา</h2><h2>not too premium</h2>" +
  "<p>Opening hours are every day of the week, with walk in visits and check ups for the whole family at the clinic near the market.</p>" +
  "</body></html>";
const READ_A = readOf(HTML_A, [["https://clinic.example/a.css", CSS_A]]);
const BOXES_A = [
  textBox(H1),
  textBox(H2A),
  textBox(H2B),
  textBox(P1, { fontFamily: '"IBM Plex Sans Thai"' }),
];
const SNAP_A = snapshotOf(BOXES_A);

function ok(a: Analysis) {
  if (!a.ok) throw new Error(`analyseUrl failed: ${a.error}`);
  return a;
}
const run = (read: Read, snapshot: unknown, ctx: AnalyserContext = CTX) =>
  ok(analyseUrl(read, snapshot, ctx));
const ofKind = (items: InputEvidence[], kind: string) =>
  items.filter((i) => i.observation.kind === kind);
const metric = (items: InputEvidence[], m: string) => items.filter((i) => i.measure?.metric === m);
const rulesOf = (item: InputEvidence): readonly string[] =>
  item.reading?.by === "rule" ? item.reading.rules : [];
const without = (item: InputEvidence) => ({
  ...item,
  source: { ...item.source, retrievedAt: "" },
});

describe("the fixture pages", () => {
  it("name the block paths this file uses", () => {
    expect(pageTextOf(READ_A.document.bytes).blocks.map((b) => b.path)).toEqual([
      TITLE,
      META,
      H1,
      H2A,
      H2B,
      P1,
    ]);
  });

  it("parse as valid evidence in every run below", () => {
    for (const result of [run(READ_A, SNAP_A), run(READ_A, null, CTX_D)]) {
      for (const item of result.evidence) {
        expect(inputEvidenceSchema.safeParse(item).error).toBeUndefined();
      }
    }
  });
});

// ---------------------------------------------------------------- row 4

describe("same input, same evidence", () => {
  it("the same bytes, snapshot and clock twice give deep-equal results and equal ids", () => {
    const one = run(READ_A, SNAP_A);
    const two = run(READ_A, SNAP_A);
    expect(two).toEqual(one);
    expect(two.evidence.map((i) => i.id)).toEqual(one.evidence.map((i) => i.id));
    expect(one.evidence.length).toBeGreaterThan(20);
  });

  it("the list equals itself sorted with compareEvidence", () => {
    const { evidence } = run(READ_A, SNAP_A);
    expect([...evidence].reverse().sort(compareEvidence)).toEqual(evidence);
  });

  it("the stylesheets in another order give a deep-equal result", () => {
    const sheets: [string, string][] = [
      ["https://clinic.example/a.css", CSS_A],
      ["https://clinic.example/b.css", "p{color:#ff7a00}h1{color:#123456}"],
    ];
    const forward = run(readOf(HTML_A, sheets), SNAP_A);
    const backward = run(readOf(HTML_A, [...sheets].reverse()), SNAP_A);
    expect(backward).toEqual(forward);
  });

  it("a later clock gives equal ids and differs only at source.retrievedAt", () => {
    const early = run(READ_A, SNAP_A);
    const late = run(READ_A, SNAP_A, { ...CTX, retrievedAt: "2026-10-29T08:30:00.000Z" });
    expect(late.evidence.map((i) => i.id)).toEqual(early.evidence.map((i) => i.id));
    expect(late.evidence.map(without)).toEqual(early.evidence.map(without));
    expect(late.evidence.every((i) => i.source.retrievedAt === "2026-10-29T08:30:00.000Z")).toBe(
      true,
    );
  });

  describe("the ties of tech notes section 8", () => {
    const TWO_BODIES = "<html><body><p>Alpha beta gamma</p><p>Delta omega sigma</p></body></html>"; // 16 and 17 characters; the first padded below
    const html = TWO_BODIES.replace("Alpha beta gamma", "Alpha beta gamma!"); // 17 each
    const P_A = "html>body>p:nth-of-type(1)";
    const P_B = "html>body>p:nth-of-type(2)";

    it("pairs 333333-on-ffffff and 1a1a1a-on-ffffff over as many characters give 1a1a1a-on-ffffff at the first body block holding it", () => {
      const boxes = [
        textBox(P_A, { pair: { color: "#333333", backdrop: "#ffffff" } }),
        textBox(P_B, { pair: { color: "#1a1a1a", backdrop: "#ffffff" } }),
      ];
      const forward = run(readOf(html), snapshotOf(boxes));
      const pair = ofKind(forward.evidence, "contrast-pair");
      expect(pair).toHaveLength(1);
      expect(pair[0]?.observation.subject).toBe("1a1a1a-on-ffffff");
      expect(pair[0]?.source.locator).toEqual({ kind: "element", path: P_B });
      expect(pair[0]?.measure?.value).toBe(17.404);
      const backward = run(readOf(html), snapshotOf([...boxes].reverse()));
      expect(backward).toEqual(forward);
    });

    it('two heading boxes in "Noto Sans Thai" and one in Noto-Sans-Thai give one heading.noto-sans-thai item, at the first of the three blocks', () => {
      const three = "<html><body><h1>One</h1><h2>Two</h2><h2>Three</h2></body></html>";
      const boxes = [
        textBox("html>body>h1:nth-of-type(1)", { fontFamily: "Noto-Sans-Thai" }),
        textBox("html>body>h2:nth-of-type(1)", { fontFamily: '"Noto Sans Thai"' }),
        textBox("html>body>h2:nth-of-type(2)", { fontFamily: '"Noto Sans Thai"' }),
      ];
      const fonts = ofKind(run(readOf(three), snapshotOf(boxes)).evidence, "font-family");
      expect(fonts.map((f) => f.observation.subject)).toEqual(["heading.noto-sans-thai"]);
      expect(fonts[0]?.source.locator).toEqual({
        kind: "element",
        path: "html>body>h1:nth-of-type(1)",
      });
    });

    it("a stylesheet declaring #FF7A00 twice and rgb(255, 122, 0) once gives one colour-declared item at the first offset", () => {
      const css = "a{color:#FF7A00}b{color:rgb(255, 122, 0)}c{color:#FF7A00}";
      const declared = ofKind(
        run(readOf(HTML_A, [["https://clinic.example/a.css", css]]), null, CTX_D).evidence,
        "colour-declared",
      );
      expect(declared).toHaveLength(1);
      expect(declared[0]?.observation.subject).toBe("ff7a00");
      expect(declared[0]?.source.locator).toEqual({
        kind: "element",
        path: `sheet:${css.indexOf("#FF7A00")}`,
      });
    });

    it("two stylesheets declaring it give two items, deep-equal with the stylesheets reversed", () => {
      const sheets: [string, string][] = [
        ["https://clinic.example/a.css", "a{color:#ff7a00}"],
        ["https://clinic.example/b.css", "a{color:#ff7a00}"],
      ];
      const forward = run(readOf(HTML_A, sheets), null, CTX_D);
      const declared = ofKind(forward.evidence, "colour-declared");
      expect(declared).toHaveLength(2);
      expect(new Set(declared.map((d) => d.id)).size).toBe(2);
      expect(run(readOf(HTML_A, [...sheets].reverse()), null, CTX_D)).toEqual(forward);
    });
  });
});

describe("no random source on the colour path", () => {
  it("analyseUrl returns ok with its colour-area items and never calls Math.random", () => {
    const spy = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Math.random was called");
    });
    try {
      const result = run(READ_A, SNAP_A);
      expect(ofKind(result.evidence, "colour-area").length).toBeGreaterThan(0);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});

// ---------------------------------------------------------------- row 8

describe("measures by code", () => {
  const { evidence, renderer } = run(READ_A, SNAP_A);

  it("names the snapshot's renderer on every rendered item, and on no declared colour", () => {
    expect(renderer).toEqual(BUILD);
    const rendered = evidence.filter((i) => i.observation.kind !== "colour-declared");
    expect(rendered.length).toBeGreaterThan(0);
    expect(
      rendered.every(
        (i) => i.source.renderer !== null && i.source.renderer.driver === "playwright",
      ),
    ).toBe(true);
    expect(ofKind(evidence, "colour-declared").every((i) => i.source.renderer === null)).toBe(true);
  });

  it("every item is not from a model and has a locator; one without a reading has a measure unless it is a font", () => {
    for (const item of evidence) {
      expect(item.fromModel).toBe(false);
      expect(item.model).toBeNull();
      expect(item.source.locator).toBeDefined();
      expect(item.schemaVersion).toBe(EVIDENCE_SCHEMA_VERSION);
      expect(item.analyser).toEqual({ id: "website-url", version: "1" });
      expect(item.inputKind).toBe("website-url");
      if (item.reading === null && item.observation.kind !== "font-family") {
        expect(item.measure).not.toBeNull();
      }
      if (item.observation.kind === "font-family") {
        expect(item.measure).toBeNull();
        expect(item.reading).toBeNull();
      }
    }
  });

  it.each(["first-screen", "full-page"] as const)(
    "the %s area shares sum to 1 within 0.001",
    (scope) => {
      const shares = metric(ofKind(evidence, "colour-area"), "area-share").filter(
        (i) =>
          i.source.locator.kind === "surface" &&
          i.source.locator.scope === scope &&
          i.observation.subject !== "palette",
      );
      expect(shares.length).toBeGreaterThan(0);
      expect(Math.abs(shares.reduce((s, i) => s + Number(i.measure?.value), 0) - 1)).toBeLessThan(
        0.001,
      );
    },
  );

  it("each cluster subject has four measures, and its hue-family is classifyHex", () => {
    const areas = ofKind(evidence, "colour-area").filter(
      (i) => i.observation.subject !== "palette",
    );
    const subjects = new Set(areas.map((i) => i.observation.subject));
    expect(subjects).toEqual(new Set(["ff7a00", "ffffff"]));
    for (const scope of ["first-screen", "full-page"]) {
      for (const subject of subjects) {
        const mine = areas.filter(
          (i) =>
            i.observation.subject === subject &&
            i.source.locator.kind === "surface" &&
            i.source.locator.scope === scope,
        );
        expect(mine.map((i) => i.measure?.metric).sort()).toEqual([
          "area-share",
          "chroma",
          "hue-family",
          "lightness",
        ]);
        expect(metric(mine, "hue-family")[0]?.measure?.value).toBe(classifyHex(`#${subject}`));
      }
    }
  });

  it("every subject passes slugSchema", () => {
    for (const item of evidence)
      expect(slugSchema.safeParse(item.observation.subject).success).toBe(true);
  });

  it('the heading family "Noto Sans Thai" gives heading.noto-sans-thai and the body family "IBM Plex Sans Thai" body.ibm-plex-sans-thai', () => {
    const fonts = ofKind(evidence, "font-family");
    expect(fonts.map((f) => f.observation.subject).sort()).toEqual([
      "body.ibm-plex-sans-thai",
      "heading.noto-sans-thai",
    ]);
    expect(
      fonts.find((f) => f.observation.subject === "heading.noto-sans-thai")?.source.locator,
    ).toEqual({
      kind: "element",
      path: H1,
    });
    expect(
      fonts.find((f) => f.observation.subject === "body.ibm-plex-sans-thai")?.source.locator,
    ).toEqual({
      kind: "element",
      path: P1,
    });
  });

  it("the warm-share and mean chroma items have subject palette and locator surface first-screen", () => {
    const palette = ofKind(evidence, "colour-area").filter(
      (i) => i.observation.subject === "palette",
    );
    expect(palette.map((i) => i.measure?.metric).sort()).toEqual(["chroma", "warm-share"]);
    for (const item of palette)
      expect(item.source.locator).toEqual({ kind: "surface", scope: "first-screen" });
    expect(metric(palette, "warm-share")[0]?.measure).toEqual({
      metric: "warm-share",
      value: 0.7,
      unit: "ratio",
    });
  });

  it("the contrast-pair item has the body pair's subject, an element locator and the WCAG ratio", () => {
    const pair = ofKind(evidence, "contrast-pair");
    expect(pair).toHaveLength(1);
    expect(pair[0]?.observation.subject).toBe("1a1a1a-on-ffffff");
    expect(pair[0]?.source.locator).toEqual({ kind: "element", path: P1 });
    expect(pair[0]?.measure).toEqual({ metric: "contrast-ratio", value: 17.404, unit: "wcag" });
  });

  it("the density items are subject first-screen at surface first-screen, one per metric", () => {
    const density = ofKind(evidence, "density");
    expect(density.map((i) => i.measure?.metric).sort()).toEqual([
      "element-density",
      "text-density",
    ]);
    for (const item of density) {
      expect(item.observation.subject).toBe("first-screen");
      expect(item.source.locator).toEqual({ kind: "surface", scope: "first-screen" });
    }
    expect(metric(density, "element-density")[0]?.measure?.value).toBe(1); // the box at y 900 is below the first screen
    const characters = pageTextOf(READ_A.document.bytes)
      .blocks.filter((b) => b.kind === "heading" || b.kind === "body")
      .reduce((n, b) => n + b.text.length, 0);
    expect(metric(density, "text-density")[0]?.measure?.value).toBeCloseTo(characters / 1024, 10);
  });

  it("a text box below the first screen counts toward no density", () => {
    const low = textBox(P1, { box: { ...BOX, y: 800 } });
    const result = run(
      readOf("<html><body><p>Some text here</p></body></html>"),
      snapshotOf([low], { elements: [{ ...BOX, y: 800 }] }),
    );
    const density = ofKind(result.evidence, "density");
    expect(metric(density, "text-density")[0]?.measure?.value).toBe(0);
    expect(metric(density, "element-density")[0]?.measure?.value).toBe(0);
  });
});

// ---------------------------------------------------------------- row 9

describe("kept only as evidence", () => {
  const result = run(READ_A, SNAP_A);

  it("every item parses with inputEvidenceSchema and the serialized result holds no page, no CSS and no raster", () => {
    for (const item of result.evidence)
      expect(inputEvidenceSchema.safeParse(item).success).toBe(true);
    const json = JSON.stringify(result);
    expect(json).not.toContain("<html");
    expect(json).not.toContain("<body");
    expect(json).not.toContain("sans-serif");
    expect(json).not.toContain("Opening hours are every day");
    expect(json).not.toContain("color:#");
    expect(json).not.toContain("rgba");
    expect(json).not.toContain("255,255,255,255");
  });

  it("each quote equals the html-text-1 text of the document bytes at its span", () => {
    const blocks = pageTextOf(READ_A.document.bytes).blocks;
    const quoted = result.evidence.filter((i) => i.observation.quote !== undefined);
    expect(quoted.length).toBeGreaterThan(3);
    for (const item of quoted) {
      const l = item.source.locator;
      if (l.kind !== "text") throw new Error("a quote needs a text locator");
      const block = blocks.find((b) => b.path === l.path);
      expect(block?.text.slice(l.start, l.end)).toBe(item.observation.quote);
      expect((item.observation.quote ?? "").length).toBeLessThanOrEqual(300);
    }
    // a quote is the span, not the whole block: "premium" out of "premium and calm"
    const premium = quoted.find(
      (i) =>
        i.source.locator.kind === "text" &&
        i.source.locator.path === H1 &&
        i.observation.subject === "premium",
    );
    expect(premium?.observation.quote).toBe("premium");
  });

  it("contentHash is the SHA-256 of the recorded bytes: the document for the page, the sheet for its colours", () => {
    const documentHash = createHash("sha256").update(enc.encode(HTML_A)).digest("hex");
    const sheetHash = createHash("sha256").update(enc.encode(CSS_A)).digest("hex");
    for (const item of result.evidence) {
      const declared = item.observation.kind === "colour-declared";
      expect(item.source.contentHash).toBe(declared ? sheetHash : documentHash);
      expect(item.source.ref).toBe(declared ? "https://clinic.example/a.css" : PAGE_URL);
    }
  });

  it("takes three arguments and no file system port", () => {
    expect(analyseUrl.length).toBe(3);
  });
});

describe("the snapshot cannot add text", () => {
  const html =
    "<html><body><h1>Heading</h1><p>Friendly <span>care</span> for the whole family</p></body></html>";
  const span = `${P1}>span:nth-of-type(1)`;
  const GHOSTS = [
    textBox("html>body>p:nth-of-type(99)"),
    textBox("html>body>x-made-up:nth-of-type(1)"),
  ];

  it("counts a path that names no element, and not one on a span inside a block", () => {
    const withGhosts = run(readOf(html), snapshotOf([textBox(P1), textBox(span), ...GHOSTS]));
    expect(withGhosts.snapshot).toEqual({ unmatchedPaths: 2 });
    const without = run(readOf(html), snapshotOf([textBox(P1), textBox(span)]));
    expect(without.snapshot).toEqual({ unmatchedPaths: 0 });
  });

  it("no quote and no text-span comes from a dropped path", () => {
    const result = run(readOf(html), snapshotOf([textBox(P1), ...GHOSTS]));
    const paths = result.evidence.flatMap((i) =>
      i.source.locator.kind === "text" ? [i.source.locator.path] : [],
    );
    expect(paths.every((p) => p === P1 || p.startsWith("html>head"))).toBe(true);
  });

  it("a block whose path is missing from textBoxes is not kept", () => {
    const result = run(readOf(html), snapshotOf([textBox(P1)]));
    const spans = ofKind(result.evidence, "text-span");
    expect(spans.map((s) => s.observation.subject)).toEqual(["body"]);
    expect(spans[0]?.source.locator).toMatchObject({ kind: "text", path: P1 });
  });

  it("a block whose box is empty is not kept, with either side 0", () => {
    for (const box of [
      { ...BOX, width: 0 },
      { ...BOX, height: 0 },
    ]) {
      const result = run(readOf(html), snapshotOf([textBox(P1, { box })]));
      expect(ofKind(result.evidence, "text-span")).toEqual([]);
    }
  });

  it("the title and the meta description are kept with no text box", () => {
    const page =
      '<html><head><title>T one</title><meta name="description" content="M two"></head><body></body></html>';
    const spans = ofKind(run(readOf(page), snapshotOf([])).evidence, "text-span");
    expect(spans.map((s) => s.observation.subject).sort()).toEqual(["meta", "title"]);
    expect(spans.every((s) => s.source.renderer !== null)).toBe(true);
  });
});

// ---------------------------------------------------------------- row 10

describe("rule-based personality from page text", () => {
  const readings = (items: InputEvidence[]) =>
    items.filter((i) => i.reading !== null && i.source.locator.kind === "text");
  const at = (items: InputEvidence[], path: string, axis: string) =>
    readings(items).filter(
      (i) =>
        i.source.locator.kind === "text" &&
        i.source.locator.path === path &&
        i.observation.subject === axis,
    );

  for (const [name, result] of [
    ["with a render", run(READ_A, SNAP_A)],
    ["without a render", run(READ_A, null, CTX_D)],
  ] as const) {
    describe(name, () => {
      it('"premium and calm" reads premium high from 75, quoting premium, with no hypothesis', () => {
        const [item] = at(result.evidence, H1, "premium");
        expect(item?.reading).toEqual({
          target: "identity-frame.personality.premium",
          value: { lean: "high" },
          by: "rule",
          rules: ["lexicon-1", "value-to-lean-1"],
        });
        expect(item?.observation.quote).toBe("premium");
        expect(item?.hypothesis).toBe(false);
        expect(item?.hypothesisNote).toBeNull();
        expect(item?.fromModel).toBe(false);
      });

      it('"ไม่หรูหรา" reads premium low from 15, with no hypothesis', () => {
        const [item] = at(result.evidence, H2A, "premium");
        expect(item?.reading?.value).toEqual({ lean: "low" });
        expect(item?.observation.quote).toBe("หรูหรา");
        expect(item?.hypothesis).toBe(false);
      });

      it('"not too premium" reads premium low from 40, as a hypothesis with the not-too note (hypothesis-flag-1)', () => {
        const [item] = at(result.evidence, H2B, "premium");
        expect(item?.reading?.value).toEqual({ lean: "low" });
        expect(item?.hypothesis).toBe(true);
        expect(item?.hypothesisNote).toContain("value-to-lean-1");
        expect(item?.hypothesisNote).toContain("not too");
      });

      it("no reading holds a number from 0 to 100", () => {
        for (const item of readings(result.evidence)) {
          expect(Object.keys(item.reading?.value ?? {})).toEqual(["lean"]);
        }
      });
    });
  }

  it("a clause the rules did not understand gives no evidence", () => {
    const page = "<html><body><p>Quarterly opening hours and prices</p></body></html>";
    const items = run(readOf(page), null, CTX_D).evidence;
    expect(readings(items)).toEqual([]);
    expect(ofKind(items, "text-span")).toHaveLength(1);
  });

  it("an axis with two values in one block gives both readings, unflagged", () => {
    const page = "<html><body><h1>premium, not premium</h1></body></html>";
    const found = readings(run(readOf(page), null, CTX_D).evidence).filter(
      (i) => i.observation.subject === "premium",
    );
    expect(found.map((i) => (i.reading?.value as { lean: string }).lean).sort()).toEqual([
      "high",
      "low",
    ]);
    expect(
      found.every((i) => i.flags.length === 0 || i.flags.every((f) => f.key !== "conflict")),
    ).toBe(true);
  });

  it("a block over 2,000 characters is read in parts and each span maps back to the block", () => {
    const filler = (n: number) => "lorem ".repeat(n);
    const text = `premium ${filler(330)}premium ${filler(100)}premium`;
    const page = `<html><body><p>${text}</p></body></html>`;
    const items = run(readOf(page), null, CTX_D).evidence;
    const found = readings(items).filter((i) => i.observation.subject === "premium");
    const expected = [...text.matchAll(/premium/g)].map((m) => m.index);
    expect(text.length).toBeGreaterThan(2000);
    expect(
      found
        .map((i) => (i.source.locator.kind === "text" ? i.source.locator.start : -1))
        .sort((a, b) => a - b),
    ).toEqual(expected);
    expect(Math.max(...expected)).toBeGreaterThan(2000);
    for (const item of found) {
      const l = item.source.locator;
      if (l.kind !== "text") throw new Error("text locator");
      expect(text.slice(l.start, l.end)).toBe("premium");
      expect(item.observation.quote).toBe("premium");
    }
  });
});

// ---------------------------------------------------------------- row 11

describe("measured leans are hypotheses", () => {
  const { evidence } = run(READ_A, SNAP_A);
  const measured = evidence.filter((i) => rulesOf(i).includes("measure-to-lean-1"));

  it("a page painted 70 percent warm reads warm high by measure-to-lean-1, as a hypothesis based on the warm-share item", () => {
    const warm = measured.find((i) => i.observation.subject === "warm");
    const share = evidence.find((i) => i.measure?.metric === "warm-share");
    expect(warm?.reading).toEqual({
      target: "identity-frame.personality.warm",
      value: { lean: "high" },
      by: "rule",
      rules: ["measure-to-lean-1"],
    });
    expect(warm?.hypothesis).toBe(true);
    expect(warm?.hypothesisNote).toContain("measure-to-lean-1");
    expect(warm?.basedOn).toEqual([share?.id]);
    expect(warm?.source.locator).toEqual({ kind: "surface", scope: "first-screen" });
    expect(warm?.measure).toBeNull();
    expect(warm?.confidence.value).toBe(0.7);
  });

  it("a mean chroma of 0.10 or more reads expressive high, based on the chroma palette item", () => {
    const expressive = measured.find((i) => i.observation.subject === "expressive");
    const chroma = evidence.find(
      (i) => i.observation.subject === "palette" && i.measure?.metric === "chroma",
    );
    expect(expressive?.reading?.value).toEqual({ lean: "high" });
    expect(expressive?.basedOn).toEqual([chroma?.id]);
    expect(expressive?.hypothesis).toBe(true);
  });

  it("a mean chroma between 0.02 and 0.10 and no warm area gives no measured lean", () => {
    const muted = raster([["6a8fb5", 200]]); // blue, chroma about 0.06
    const result = run(READ_A, snapshotOf(BOXES_A, { firstScreen: muted, fullPage: muted }));
    const chroma = result.evidence.find(
      (i) => i.observation.subject === "palette" && i.measure?.metric === "chroma",
    );
    expect(Number(chroma?.measure?.value)).toBeGreaterThan(0.02);
    expect(Number(chroma?.measure?.value)).toBeLessThan(0.1);
    expect(result.evidence.filter((i) => rulesOf(i).includes("measure-to-lean-1"))).toEqual([]);
  });

  it("a mean chroma of 0.02 or less reads expressive low", () => {
    const grey = raster([["808080", 200]]);
    const low = run(READ_A, snapshotOf(BOXES_A, { firstScreen: grey, fullPage: grey }));
    const lean = low.evidence.find(
      (i) =>
        i.reading?.target === "identity-frame.personality.expressive" &&
        rulesOf(i).includes("measure-to-lean-1"),
    );
    // 808080 has a mean chroma of 0, which is at or under 0.02
    expect(lean?.reading?.value).toEqual({ lean: "low" });
  });
});

// ---------------------------------------------------------------- row 12

describe("low quality lowers confidence", () => {
  const HTML_B =
    "<html><head><title>Calm clinic</title></head><body><p>Premium care for every family, open all week long.</p></body></html>"; // 12 words in all
  const read = readOf(
    HTML_B,
    [["https://clinic.example/a.css", "a{color:#ff7a00}"]],
    ["page-incomplete"],
  );
  const { evidence } = run(read, snapshotOf([textBox(P1)]));

  it("the lexicon-1 reading is exactly 0.343, below the floor, with both factors and both flags", () => {
    const reading = evidence.find(
      (i) => rulesOf(i).includes("lexicon-1") && i.observation.subject === "premium",
    );
    expect(reading?.confidence.value).toBe(0.343);
    expect(reading?.belowFloor).toBe(true);
    expect(reading?.confidence.factors.map((f) => f.id)).toEqual(["few-words", "page-incomplete"]);
    expect(reading?.flags.map((f) => f.key)).toEqual([
      "quality.fewWords",
      "quality.pageIncomplete",
    ]);
  });

  it("the colour measures carry page-incomplete only: 0.7, with the one flag", () => {
    const colours = ofKind(evidence, "colour-area").concat(
      ofKind(evidence, "colour-declared"),
      ofKind(evidence, "density"),
    );
    expect(colours.length).toBeGreaterThan(5);
    for (const item of colours) {
      expect(item.confidence.value).toBe(0.7);
      expect(item.confidence.factors.map((f) => f.id)).toEqual(["page-incomplete"]);
      expect(item.flags.map((f) => f.key)).toEqual(["quality.pageIncomplete"]);
      expect(item.belowFloor).toBe(false);
    }
  });

  it("a text-span word count carries page-incomplete only, never few-words (it is a measure)", () => {
    for (const item of ofKind(evidence, "text-span")) {
      expect(item.confidence.factors.map((f) => f.id)).toEqual(["page-incomplete"]);
    }
  });

  it("a measured lean is a rule reading with page-incomplete only", () => {
    const lean = evidence.find((i) => rulesOf(i).includes("measure-to-lean-1"));
    expect(lean?.confidence.value).toBe(0.49);
    expect(lean?.confidence.factors.map((f) => f.id)).toEqual(["page-incomplete"]);
  });

  it("a complete read of a block with 20 words or more has no few-words and 0.7", () => {
    const words = Array.from({ length: 19 }, (_v, i) => `word${i}`).join(" ");
    const page = `<html><body><p>premium ${words}</p></body></html>`; // 20 words in all
    const item = run(readOf(page), null, CTX_D).evidence.find((i) => i.reading !== null);
    expect(item?.confidence.value).toBe(0.7);
    expect(item?.flags).toEqual([]);
  });

  it("a block of 19 words has few-words", () => {
    const words = Array.from({ length: 18 }, (_v, i) => `word${i}`).join(" ");
    const page = `<html><body><p>premium ${words}</p></body></html>`;
    const item = run(readOf(page), null, CTX_D).evidence.find((i) => i.reading !== null);
    expect(item?.confidence.factors.map((f) => f.id)).toEqual(["few-words"]);
    expect(item?.confidence.value).toBe(0.49);
  });

  it("the page text cut by a bound (the text's own incomplete) gives page-incomplete too", () => {
    const deep = `<html><head><title>Premium clinic</title></head><body><p>premium</p>${"<div>".repeat(130)}<p>deep</p></body></html>`;
    const read = readOf(deep);
    expect(read.incomplete).toEqual([]); // only the text's own flag is set
    const item = run(read, null, CTX_D).evidence;
    expect(item.length).toBeGreaterThan(0);
    expect(item.every((i) => i.confidence.factors.some((f) => f.id === "page-incomplete"))).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------- row 34

const FOUR = (reason: string) =>
  ["colour-area", "contrast-pair", "density", "text-visibility"].map((what) => ({ what, reason }));

describe("no snapshot: declared colours and the page text", () => {
  const first = run(READ_A, null, CTX_D);

  it("keeps declared colours, declared fonts with sheet locators, text spans and lexicon readings", () => {
    const kinds = new Set(first.evidence.map((i) => i.observation.kind));
    expect([...kinds].sort()).toEqual([
      "colour-declared",
      "font-family",
      "personality-signal",
      "text-span",
    ]);
    const fonts = ofKind(first.evidence, "font-family");
    expect(fonts.map((f) => f.observation.subject)).toEqual(["declared.inter"]);
    expect(fonts[0]?.source.locator).toEqual({
      kind: "element",
      path: `sheet:${CSS_A.indexOf('"Inter"')}`,
    });
    expect(
      ofKind(first.evidence, "colour-declared")
        .map((c) => c.observation.subject)
        .sort(),
    ).toEqual(["0000ff", "ff7a00"]);
    expect(ofKind(first.evidence, "text-span")).toHaveLength(6); // title, meta, three headings and the paragraph
  });

  it("has no colour-area, contrast-pair or density, and every item has renderer null", () => {
    expect(
      first.evidence.some((i) =>
        ["colour-area", "contrast-pair", "density"].includes(i.observation.kind),
      ),
    ).toBe(false);
    expect(first.evidence.every((i) => i.source.renderer === null)).toBe(true);
    expect(first.renderer).toBeNull();
    expect(first.evidence.some((i) => rulesOf(i).includes("measure-to-lean-1"))).toBe(false);
  });

  it("lists the four entries with reason no-renderer, sorted by what, and snapshot null", () => {
    expect(first.notMeasured).toEqual(FOUR("no-renderer"));
    expect(first.snapshot).toBeNull();
  });

  it("keeps every block, hidden by CSS or not", () => {
    expect(
      ofKind(first.evidence, "text-span")
        .map((s) => s.observation.subject)
        .sort(),
    ).toEqual(["body", "heading", "heading", "heading", "meta", "title"]);
  });

  it("a second run is deep-equal", () => {
    expect(run(READ_A, null, CTX_D)).toEqual(first);
  });

  it("one declared font per stylesheet and subject, at the first declaration", () => {
    const css = 'a{font-family:Inter}b{font-family:"inter", serif}c{font-family:Georgia}';
    const fonts = ofKind(
      run(readOf(HTML_A, [["https://clinic.example/a.css", css]]), null, CTX_D).evidence,
      "font-family",
    );
    expect(fonts.map((f) => f.observation.subject).sort()).toEqual([
      "declared.georgia",
      "declared.inter",
    ]);
    expect(fonts.find((f) => f.observation.subject === "declared.inter")?.source.locator).toEqual({
      kind: "element",
      path: `sheet:${css.indexOf("Inter")}`,
    });
  });

  it.each(["render-failed", "render-budget"] as const)(
    "lists the four entries with the caller's reason %s",
    (reason) => {
      expect(run(READ_A, null, { ...CTX, notRendered: reason }).notMeasured).toEqual(FOUR(reason));
    },
  );
});

describe("a bad snapshot runs as option D", () => {
  const good = snapshotOf(BOXES_A);
  const shortRaster = { ...good, fullPage: { ...WARM_FULL, rgba: WARM_FULL.rgba.slice(0, -1) } };
  const injected = snapshotOf([{ ...textBox(P1), text: "INJECTED TEXT" } as TextBox]);
  const cases: [string, unknown][] = [
    ["an extra key", { ...good, extra: 1 }],
    [
      "5,001 textBoxes",
      {
        ...good,
        textBoxes: Array.from({ length: 5001 }, (_v, i) =>
          textBox(`html>body>p:nth-of-type(${i + 1})`),
        ),
      },
    ],
    ["a fullPage.rgba one byte short", shortRaster],
    ["a text box with a text key", injected],
    ["a version of 2", { ...good, version: "2" }],
    ["something that is no object", "snapshot"],
    ["an array", []],
  ];

  it.each(cases)(
    "%s gives the option D result with snapshot-invalid, repaired in no way",
    (_n, snapshot) => {
      const result = run(READ_A, snapshot);
      expect(result.notMeasured).toEqual(FOUR("snapshot-invalid"));
      expect(result.snapshot).toBeNull();
      expect(result.renderer).toBeNull();
      expect(result.evidence.every((i) => i.source.renderer === null)).toBe(true);
      expect(
        result.evidence.some((i) =>
          ["colour-area", "contrast-pair", "density"].includes(i.observation.kind),
        ),
      ).toBe(false);
      expect(JSON.stringify(result)).not.toContain("INJECTED");
      expect(result.evidence.map((i) => i.observation.kind)).toContain("text-span");
      expect(ofKind(result.evidence, "text-span")).toHaveLength(6);
    },
  );

  it("is the same result as option D with no renderer, but for the reason", () => {
    const bad = run(READ_A, { ...good, extra: 1 });
    expect(bad.evidence).toEqual(run(READ_A, null, CTX_D).evidence);
  });
});

describe("no flat body pair: contrast is not measured", () => {
  const NONE = [{ what: "contrast-pair", reason: "no-flat-pair" }];
  const cases: [string, TextBox[]][] = [
    ["every kept body box has a null pair", [textBox(H1), textBox(P1, { pair: null })]],
    ["the only pair is on a heading box", [textBox(H1), textBox(P1, { pair: null })]],
    [
      "the only pair is on a body block whose box is empty",
      [textBox(H1, { pair: null }), textBox(P1, { box: { ...BOX, width: 0 } })],
    ],
    ["there is no kept body block at all", [textBox(H1)]],
  ];

  it.each(cases)("%s: no contrast-pair item and the one no-flat-pair entry", (_n, boxes) => {
    const result = run(READ_A, snapshotOf(boxes));
    expect(ofKind(result.evidence, "contrast-pair")).toEqual([]);
    expect(result.notMeasured).toEqual(NONE);
    expect(result.renderer).toEqual(BUILD);
    expect(ofKind(result.evidence, "colour-area").length).toBeGreaterThan(0);
    expect(ofKind(result.evidence, "density")).toHaveLength(2);
    for (const entry of result.notMeasured)
      expect(notMeasuredSchema.safeParse(entry).success).toBe(true);
  });

  it("one kept body box given a pair gives one contrast-ratio item and nothing unmeasured", () => {
    const result = run(READ_A, snapshotOf([textBox(H1, { pair: null }), textBox(P1)]));
    expect(metric(result.evidence, "contrast-ratio")).toHaveLength(1);
    expect(result.notMeasured).toEqual([]);
  });

  it("the entries of option D parse with notMeasuredSchema too, and an unknown reason does not", () => {
    for (const entry of FOUR("render-budget"))
      expect(notMeasuredSchema.safeParse(entry).success).toBe(true);
    expect(notMeasuredSchema.safeParse({ what: "contrast-pair", reason: "other" }).success).toBe(
      false,
    );
    expect(notMeasuredSchema.safeParse({ what: "colour", reason: "no-renderer" }).success).toBe(
      false,
    );
    expect(
      notMeasuredSchema.safeParse({ what: "density", reason: "no-renderer", x: 1 }).success,
    ).toBe(false);
  });
});

describe("notMeasuredSchema is two closed lists, strict", () => {
  it("names the four things and the five reasons, in this order", () => {
    expect(notMeasuredSchema.shape.what.options).toEqual([
      "colour-area",
      "contrast-pair",
      "density",
      "text-visibility",
    ]);
    expect(notMeasuredSchema.shape.reason.options).toEqual([
      "no-renderer",
      "render-failed",
      "render-budget",
      "snapshot-invalid",
      "no-flat-pair",
    ]);
  });

  it("takes every pair of one thing and one reason, rejects a missing half and a stray key", () => {
    for (const what of notMeasuredSchema.shape.what.options) {
      for (const reason of notMeasuredSchema.shape.reason.options) {
        expect(notMeasuredSchema.safeParse({ what, reason }).success).toBe(true);
      }
    }
    expect(notMeasuredSchema.safeParse({ what: "density" }).success).toBe(false);
    expect(notMeasuredSchema.safeParse({ reason: "no-renderer" }).success).toBe(false);
  });
});

describe("the context is checked first", () => {
  const call =
    (ctx: unknown, snapshot: unknown = null, read: Read = READ_A) =>
    () =>
      analyseUrl(read, snapshot, ctx as AnalyserContext);

  it("retrievedAt 2026-10-28 and yesterday throw the clock's TypeError", () => {
    for (const retrievedAt of ["2026-10-28", "yesterday"]) {
      expect(call({ ...CTX_D, retrievedAt })).toThrow(
        new TypeError("analyseUrl: ctx.retrievedAt is not an ISO date-time"),
      );
    }
  });

  it("a null snapshot with notRendered null, and a valid snapshot with notRendered no-renderer, throw the mismatch", () => {
    const message = "analyseUrl: ctx.notRendered must be set exactly when snapshot is null";
    expect(call({ ...CTX, notRendered: null }, null)).toThrow(new TypeError(message));
    expect(call({ ...CTX, notRendered: "no-renderer" }, SNAP_A)).toThrow(new TypeError(message));
  });

  it("a role of Competitor and of an empty string throw the role's TypeError", () => {
    for (const role of ["Competitor", "", undefined, "OWN"]) {
      expect(call({ ...CTX_D, role })).toThrow(
        new TypeError("analyseUrl: ctx.role is not one of INPUT_ROLES"),
      );
    }
  });

  it("a role of competitor with a bad clock throws the clock's error, not competitor-not-read", () => {
    expect(call({ ...CTX_D, role: "competitor", retrievedAt: "yesterday" })).toThrow(
      new TypeError("analyseUrl: ctx.retrievedAt is not an ISO date-time"),
    );
  });

  it("a bad clock and a read whose document getter throws a marker give the clock's error", () => {
    const hostile = {
      status: "read",
      url: PAGE_URL,
      get document(): never {
        throw new Error("MARKER read.document was touched");
      },
      stylesheets: [],
      incomplete: [],
    } as unknown as Read;
    expect(call({ ...CTX_D, retrievedAt: "yesterday" }, null, hostile)).toThrow(
      new TypeError("analyseUrl: ctx.retrievedAt is not an ISO date-time"),
    );
  });

  it("every item of a valid run has the context's role and retrievedAt", () => {
    const result = run(READ_A, SNAP_A, {
      ...CTX,
      role: "reference",
      retrievedAt: "2026-01-02T03:04:05Z",
    });
    expect(result.evidence.length).toBeGreaterThan(0);
    for (const item of result.evidence) {
      expect(item.role).toBe("reference");
      expect(item.source.retrievedAt).toBe("2026-01-02T03:04:05Z");
    }
  });

  it("an own page is owned by self and a reference page by unknown, and both parse", () => {
    for (const [role, owned] of [
      ["own", "self"],
      ["reference", "unknown"],
    ] as const) {
      const result = run(READ_A, SNAP_A, { ...CTX, role });
      for (const item of result.evidence) {
        expect(item.ownedBy).toBe(owned);
        expect(inputEvidenceSchema.safeParse(item).success).toBe(true);
      }
    }
  });

  it("two items with one id are an id-collision, listing the ids", () => {
    const sheet = ["https://clinic.example/a.css", "a{color:#ff7a00}"] as [string, string];
    const result = analyseUrl(readOf(HTML_A, [sheet, sheet]), null, CTX_D);
    expect(result.ok).toBe(false);
    if (!result.ok && result.error === "id-collision") {
      expect(result.ids).toHaveLength(1);
      expect(result.ids[0]).toMatch(/^[0-9a-f]{8}$/);
    } else {
      throw new Error("expected an id-collision");
    }
  });
});

describe("details of the items", () => {
  const { evidence } = run(READ_A, SNAP_A);

  it("a text-span item locates the whole block and counts its words", () => {
    const spans = ofKind(evidence, "text-span");
    const h1 = spans.find((s) => s.source.locator.kind === "text" && s.source.locator.path === H1);
    expect(h1?.source.locator).toEqual({
      kind: "text",
      path: H1,
      start: 0,
      end: "premium and calm".length,
    });
    expect(h1?.measure).toEqual({ metric: "word-count", value: 3, unit: "words" });
    expect(h1?.observation).toEqual({ kind: "text-span", subject: "heading" });
    const thai = spans.find(
      (s) => s.source.locator.kind === "text" && s.source.locator.path === H2A,
    );
    expect(Number(thai?.measure?.value)).toBeGreaterThanOrEqual(1);
  });

  it("every item is from the input, with no tool default", () => {
    for (const item of evidence) {
      expect(item.origin).toBe("input");
      expect(item.flags.every((f) => f.key.startsWith("quality."))).toBe(true);
    }
  });

  it("a first screen with no opaque pixel has no palette item and no measured lean", () => {
    const clear = { width: 320, height: 200, rgba: new Uint8Array(320 * 200 * 4) };
    const result = run(READ_A, snapshotOf(BOXES_A, { firstScreen: clear }));
    expect(result.evidence.filter((i) => i.observation.subject === "palette")).toEqual([]);
    expect(result.evidence.filter((i) => rulesOf(i).includes("measure-to-lean-1"))).toEqual([]);
    expect(
      ofKind(result.evidence, "colour-area").every(
        (i) => i.source.locator.kind === "surface" && i.source.locator.scope === "full-page",
      ),
    ).toBe(true);
  });

  it("the pair over more characters wins over the lower subject, by the characters of the blocks", () => {
    const html =
      "<html><body><p>short one</p><p>a much longer paragraph of body text</p></body></html>";
    const boxes = [
      textBox("html>body>p:nth-of-type(1)", { pair: { color: "#1a1a1a", backdrop: "#ffffff" } }),
      textBox("html>body>p:nth-of-type(2)", { pair: { color: "#333333", backdrop: "#ffffff" } }),
    ];
    const pair = ofKind(run(readOf(html), snapshotOf(boxes)).evidence, "contrast-pair");
    expect(pair.map((p) => p.observation.subject)).toEqual(["333333-on-ffffff"]);
  });

  it("an empty declared font family gives no item", () => {
    const css = 'a{font-family:""}b{font-family:}';
    expect(
      ofKind(
        run(readOf(HTML_A, [["https://clinic.example/a.css", css]]), null, CTX_D).evidence,
        "font-family",
      ),
    ).toEqual([]);
  });

  it("a font under a render is the first kept block's, and a block with no box gives none", () => {
    const html = "<html><body><h1>One</h1><h2>Two</h2></body></html>";
    const result = run(
      readOf(html),
      snapshotOf([textBox("html>body>h2:nth-of-type(1)", { fontFamily: "Inter" })]),
    );
    const fonts = ofKind(result.evidence, "font-family");
    expect(fonts.map((f) => f.observation.subject)).toEqual(["heading.inter"]);
    expect(fonts[0]?.source.locator).toEqual({
      kind: "element",
      path: "html>body>h2:nth-of-type(1)",
    });
  });
});

// ---------------------------------------------------------------- row 35

describe("the renderer build is part of the source", () => {
  const other = { ...BUILD, driverVersion: "1.57.0" };
  const one = run(READ_A, snapshotOf(BOXES_A));
  const two = run(READ_A, snapshotOf(BOXES_A, { renderer: other }));

  it("every colour-area id differs between the two runs", () => {
    const ids = (items: InputEvidence[]) => ofKind(items, "colour-area").map((i) => i.id);
    expect(ids(one.evidence).length).toBeGreaterThan(0);
    expect(ids(one.evidence).filter((id) => ids(two.evidence).includes(id))).toEqual([]);
  });

  it("every colour-declared id is equal", () => {
    const ids = (items: InputEvidence[]) =>
      ofKind(items, "colour-declared")
        .map((i) => i.id)
        .sort();
    expect(ids(one.evidence)).toEqual(ids(two.evidence));
    expect(ids(one.evidence).length).toBeGreaterThan(0);
  });

  it("each rendered item's source.renderer deep-equals its snapshot's", () => {
    expect(two.renderer).toEqual(other);
    for (const [result, build] of [
      [one, BUILD],
      [two, other],
    ] as const) {
      for (const item of result.evidence) {
        if (item.observation.kind === "colour-declared") expect(item.source.renderer).toBeNull();
        else expect(item.source.renderer).toEqual(build);
      }
    }
  });
});

// ---------------------------------------------------------------- row 38

describe("a competitor URL is not read", () => {
  function fakePorts() {
    const log: string[] = [];
    const resolved: string[] = [];
    const ports: ReadPorts = {
      async resolve(host) {
        resolved.push(host);
        return ["93.184.216.34"];
      },
      async request(r) {
        log.push(r.url);
        const body = r.url.endsWith("/robots.txt") ? "" : "<html><body><p>Hello</p></body></html>";
        return {
          ok: true,
          status: r.url.endsWith("/robots.txt") ? 404 : 200,
          headers: { "content-type": "text/html" },
          body: enc.encode(body),
          truncated: false,
          remoteAddress: r.address,
        };
      },
      sha256: sha,
      elapsedMs: () => 0,
    };
    return { ports, log, resolved };
  }
  const URL_ = "https://rival.example/";

  it("returns NotRead with the URL as given and calls no port", async () => {
    const { ports, log, resolved } = fakePorts();
    const out = await readUrlInput({ url: URL_, role: "competitor" }, ports);
    expect(out).toEqual({ status: "not-read", url: URL_, line: "read.notRead.competitor" });
    expect(log).toEqual([]);
    expect(resolved).toEqual([]);
  });

  it.each(["own", "reference"] as const)(
    "the same URL with role %s reads robots.txt first",
    async (role) => {
      const { ports, log } = fakePorts();
      const out = await readUrlInput({ url: URL_, role }, ports);
      expect(out.status).toBe("read");
      expect(log[0]).toBe("https://rival.example/robots.txt");
      expect(log).toContain(URL_);
    },
  );

  it.each([["Competitor"], [""], [undefined], ["OWN"], [null]])(
    "the role %j throws and calls no port",
    async (role) => {
      const { ports, log, resolved } = fakePorts();
      await expect(readUrlInput({ url: URL_, role } as never, ports)).rejects.toThrow(
        new TypeError("readUrlInput: input.role is not one of INPUT_ROLES"),
      );
      expect(log).toEqual([]);
      expect(resolved).toEqual([]);
    },
  );

  it("a competitor URL of 2,049 characters is refused as an own one is, with no port called", async () => {
    const { ports, log, resolved } = fakePorts();
    const url = `https://rival.example/${"a".repeat(2049 - URL_.length)}`;
    expect(url).toHaveLength(2049);
    expect(await readUrlInput({ url, role: "competitor" }, ports)).toEqual({
      status: "refused",
      reason: "read.refused.address",
    });
    expect(log).toEqual([]);
    expect(resolved).toEqual([]);
  });

  it("one of 2,048 characters is NotRead with the URL unchanged", async () => {
    const { ports, log } = fakePorts();
    const url = `https://rival.example/${"a".repeat(2048 - URL_.length)}`;
    expect(url).toHaveLength(2048);
    expect(await readUrlInput({ url, role: "competitor" }, ports)).toEqual({
      status: "not-read",
      url,
      line: "read.notRead.competitor",
    });
    expect(log).toEqual([]);
  });

  it("an own URL of 2,049 characters is refused too, so every long URL is refused whatever its role", async () => {
    const { ports } = fakePorts();
    const url = `https://rival.example/${"a".repeat(2049 - URL_.length)}`;
    expect(await readUrlInput({ url, role: "own" }, ports)).toEqual({
      status: "refused",
      reason: "read.refused.address",
    });
  });

  it("passes the robots cache on to the read", async () => {
    const { ports } = fakePorts();
    const robots = new Map();
    await readUrlInput({ url: URL_, role: "own" }, ports, robots);
    expect(robots.size).toBe(1);
  });

  it("analyseUrl on the bytes of a competitor page returns competitor-not-read and no evidence", () => {
    expect(analyseUrl(READ_A, null, { ...CTX_D, role: "competitor" })).toEqual({
      ok: false,
      error: "competitor-not-read",
    });
    expect(analyseUrl(READ_A, SNAP_A, { ...CTX, role: "competitor" })).toEqual({
      ok: false,
      error: "competitor-not-read",
    });
  });

  it("the engine's index exports readUrlInput and analyseUrl, and neither readPage nor quantizeWu", () => {
    expect(typeof engine.readUrlInput).toBe("function");
    expect(typeof engine.analyseUrl).toBe("function");
    expect("readPage" in engine).toBe(false);
    expect("quantizeWu" in engine).toBe(false);
  });
});

// ---------------------------------------------------------------- cases that pin single choices

describe("the choices of the analyser, one at a time", () => {
  const areaShares = (items: InputEvidence[], scope: string) =>
    metric(ofKind(items, "colour-area"), "area-share")
      .filter(
        (i) =>
          i.source.locator.kind === "surface" &&
          i.source.locator.scope === scope &&
          i.observation.subject !== "palette",
      )
      .map((i) => [i.observation.subject, i.measure?.value] as const)
      .sort();

  it("the first-screen and the full-page areas come from their own rasters", () => {
    const { evidence } = run(READ_A, SNAP_A);
    expect(areaShares(evidence, "first-screen")).toEqual([
      ["ff7a00", 0.7],
      ["ffffff", 0.3],
    ]);
    expect(areaShares(evidence, "full-page")).toEqual([
      ["ff7a00", 0.35],
      ["ffffff", 0.65],
    ]);
  });

  it("a declared colour carries the hue family of its colour, whatever the colour", () => {
    const { evidence } = run(READ_A, null, CTX_D);
    const declared = ofKind(evidence, "colour-declared");
    expect(declared.map((c) => [c.observation.subject, c.measure])).toEqual([
      ["ff7a00", { metric: "hue-family", value: "orange", unit: "band" }],
      ["0000ff", { metric: "hue-family", value: "violet", unit: "band" }],
    ]);
  });

  it("the title and the meta description are not headings: they add no density and no font", () => {
    const boxes = [
      textBox(H1),
      textBox(P1, { fontFamily: '"IBM Plex Sans Thai"' }),
      textBox(TITLE, { fontFamily: "Title Face" }),
      textBox(META, { fontFamily: "Meta Face" }),
    ];
    const { evidence } = run(READ_A, snapshotOf(boxes));
    const subjects = ofKind(evidence, "font-family").map((f) => f.observation.subject);
    expect(subjects.sort()).toEqual(["body.ibm-plex-sans-thai", "heading.noto-sans-thai"]);
    const chars = pageTextOf(READ_A.document.bytes)
      .blocks.filter((b) => b.path === H1 || b.path === P1)
      .reduce((n, b) => n + b.text.length, 0);
    expect(metric(ofKind(evidence, "density"), "text-density")[0]?.measure?.value).toBeCloseTo(
      chars / 1024,
      10,
    );
    // the title and the meta are still kept as text spans
    expect(
      ofKind(evidence, "text-span")
        .map((i) => i.observation.subject)
        .sort(),
    ).toEqual(["body", "heading", "meta", "title"]);
  });

  it("the contrast pair names the first block that has the winning pair", () => {
    const html =
      "<html><body><p>First paragraph of the page.</p><p>Second paragraph of the page.</p></body></html>";
    const second = "html>body>p:nth-of-type(2)";
    const result = run(readOf(html), snapshotOf([textBox(P1), textBox(second)]));
    expect(ofKind(result.evidence, "contrast-pair")[0]?.source.locator).toEqual({
      kind: "element",
      path: P1,
    });
  });

  it("a block of exactly 20 words has no few-words and one of 19 has it", () => {
    const text = (n: number) =>
      `<p>${Array.from({ length: n }, (_v, i) => (i === 0 ? "premium" : `w${i}`)).join(" ")}</p>`;
    const flags = (n: number) =>
      run(readOf(`<html><body>${text(n)}</body></html>`), null, CTX_D)
        .evidence.filter((i) => i.reading !== null)
        .map((i) => i.confidence.factors.map((f) => f.id));
    expect(flags(20)).toEqual([[]]);
    expect(flags(19)).toEqual([["few-words"]]);
  });

  describe("a block over 2,000 characters is read in parts cut at a space", () => {
    const read = (body: string) =>
      run(readOf(`<html><body><p>${body}</p></body></html>`), null, CTX_D).evidence.filter(
        (i) => i.reading !== null && i.observation.kind === "personality-signal",
      );
    const spans = (items: InputEvidence[]) =>
      items.map((i) =>
        i.source.locator.kind === "text" ? [i.source.locator.start, i.source.locator.end] : [],
      );

    it("keeps a word at the start of the block and one at its end, each at its own offsets", () => {
      const body = `premium ${"a ".repeat(1500)}premium`;
      const items = read(body);
      expect(items.map((i) => i.observation.quote)).toEqual(["premium", "premium"]);
      expect(spans(items)).toEqual([
        [0, 7],
        [body.lastIndexOf("premium"), body.length],
      ]);
    });

    it("a part holds at most 2,000 characters: a negation just past the limit still reaches its word", () => {
      const leanOf = (body: string) =>
        read(body).map((i) => (i.reading?.by === "rule" ? i.reading.value : null));
      const negated = leanOf("not premium");
      expect(negated).not.toEqual(leanOf("premium"));
      const body = `${"a ".repeat(999)}not premium`; // "not" at 1,998 to 2,000, a space at 2,001
      expect(body.slice(1998, 2001)).toBe("not");
      expect(body[2001]).toBe(" ");
      expect(leanOf(body)).toEqual(negated);
    });

    it("cuts at the last space, so a word over the limit is kept whole", () => {
      const body = `${"a ".repeat(997)}premium tail`; // premium sits across offset 2,000
      expect(body.indexOf("premium")).toBe(1994);
      const items = read(body);
      expect(items.map((i) => i.observation.quote)).toEqual(["premium"]);
      expect(spans(items)).toEqual([[1994, 2001]]);
    });
  });
});

// ---------------------------------------------------------------- slice 1c security rework: SEC-3, SEC-4, SEC-5

declare const performance: { now(): number }; // the engine tsconfig has no DOM lib; a timer for the time bounds
/** The framework timeout of a test that guards a time bound: above the bound, so vitest never pre-empts the guard. */
const HEAVY_TIMEOUT = 60_000;
/** The time bound of a route on 1 MB, sized for CI. */
const TIME_BOUND_MS = 2000;
/** The bounds of the 2 MB meta description and the 2 MB title tests, sized for CI the way `TIME_BOUND_MS` is (ORV-139): at least 10 times the slowest local time seen while `pnpm test` ran. */
const DESCRIPTION_BOUND_MS = 6000;
const TITLE_BOUND_MS = 4000;
const MB = 1024 * 1024;

const sheetUrl = (i: number) => `https://clinic.example/s${i}.css`;
const hexAt = (i: number) => `#${i.toString(16).padStart(6, "0")}`;
/** A stylesheet of `n` rules, each with one distinct colour, the first being `from`. */
const coloursSheet = (n: number, from = 0x100000) =>
  Array.from({ length: n }, (_, i) => `a{color:${hexAt(from + i)}}`).join("");
const familiesSheet = (n: number, prefix = "fam") =>
  Array.from({ length: n }, (_, i) => `a{font-family:${prefix}${i}}`).join("");
const pageIncomplete = (item: InputEvidence) =>
  item.flags.some((f) => f.key === "quality.pageIncomplete");
const timedAnalysis = (read: Read, snapshot: unknown = null, ctx: AnalyserContext = CTX_D) => {
  const started = performance.now();
  const result = analyseUrl(read, snapshot, ctx);
  const elapsed = performance.now() - started;
  return { result, elapsed };
};

describe("a competitor URL is held to the syntax check of an own one (SEC-5)", () => {
  const noPort = {
    async resolve(): Promise<string[]> {
      throw new Error("a port was called");
    },
    async request(): Promise<never> {
      throw new Error("a port was called");
    },
    sha256: () => {
      throw new Error("a port was called");
    },
    elapsedMs: () => {
      throw new Error("a port was called");
    },
  } as unknown as ReadPorts;
  const refused = { status: "refused", reason: "read.refused.address" };

  it.each([
    ["a username and a password", "https://user:secret@rival.example/"],
    ["a username only", "https://user@rival.example/"],
    ["a password only", "https://:secret@rival.example/"],
    ["javascript:", "javascript:alert(1)"],
    ["ftp:", "ftp://rival.example/file"],
    ["file:", "file:///etc/passwd"],
    ["data:", "data:text/html,<p>x</p>"],
    ["no scheme", "rival.example/page"],
    ["text that is no URL", "not a url"],
    ["an empty string", ""],
  ])("%s is refused as read.refused.address, with no port called", async (_name, url) => {
    expect(await readUrlInput({ url, role: "competitor" }, noPort)).toEqual(refused);
  });

  it("the same userinfo and scheme are refused for an own URL, so the two branches agree", async () => {
    for (const url of ["https://user:secret@rival.example/", "javascript:alert(1)"]) {
      expect(await readUrlInput({ url, role: "own" }, noPort)).toEqual(refused);
    }
  });

  it.each([
    "http://rival.example/",
    "https://rival.example/path?q=1#top",
    "HTTPS://RIVAL.EXAMPLE/",
    "https://rival.example:8443/",
  ])("%s is recorded as given, with no port called", async (url) => {
    expect(await readUrlInput({ url, role: "competitor" }, noPort)).toEqual({
      status: "not-read",
      url,
      line: "read.notRead.competitor",
    });
  });
});

describe("the context names why there is no render (S-9)", () => {
  it.each(["banana", "", "snapshot-invalid", "no-flat-pair", undefined, 0, false])(
    "a notRendered of %j with no snapshot throws a TypeError",
    (notRendered) => {
      expect(() =>
        analyseUrl(READ_A, null, { ...CTX, notRendered } as unknown as AnalyserContext),
      ).toThrow(
        new TypeError(
          "analyseUrl: ctx.notRendered is not null and not one of no-renderer, render-failed or render-budget",
        ),
      );
    },
  );

  it.each(["no-renderer", "render-failed", "render-budget"] as const)("%s is taken", (reason) => {
    expect(run(READ_A, null, { ...CTX, notRendered: reason }).notMeasured[0]?.reason).toBe(reason);
  });
});

describe("declared colours are read in declaration values only (S-7)", () => {
  it("an id selector, a commented-out declaration and an svg reference give no item", () => {
    const css = "#facade { color: red } /* #bad */ a { fill: url(#add) }";
    const result = run(readOf(HTML_A, [["https://clinic.example/a.css", css]]), null, CTX_D);
    expect(ofKind(result.evidence, "colour-declared")).toEqual([]);
  });

  it("a colour in a declaration still gives its item at its offset", () => {
    const css = "/* #bad */ a { color: #123456 }";
    const items = ofKind(
      run(readOf(HTML_A, [["https://clinic.example/a.css", css]]), null, CTX_D).evidence,
      "colour-declared",
    );
    expect(items.map((i) => [i.observation.subject, i.source.locator])).toEqual([
      ["123456", { kind: "element", path: `sheet:${css.indexOf("#123456")}` }],
    ]);
  });
});

describe("a declared family that names no font gives no item (S-8)", () => {
  it("a var() value, a CSS-wide keyword and an @font-face descriptor give none", () => {
    const css =
      "@font-face{font-family:'X Brand'} body{font-family: var(--font-sans, Inter)} p{font-family:inherit} q{font-family:Georgia}";
    const items = ofKind(
      run(readOf(HTML_A, [["https://clinic.example/a.css", css]]), null, CTX_D).evidence,
      "font-family",
    );
    expect(items.map((i) => i.observation.subject)).toEqual(["declared.georgia"]);
  });
});

describe("a stylesheet gives at most 256 colours and 32 families (SEC-4)", () => {
  const sheetItems = (result: ReturnType<typeof run>, kind: string, url: string) =>
    ofKind(result.evidence, kind).filter((i) => i.source.ref === url);

  it("256 distinct colours are all kept and not flagged; 257 keep the first 256 by offset, each flagged", () => {
    const full = run(readOf(HTML_A, [[sheetUrl(0), coloursSheet(256)]]), null, CTX_D);
    const fullItems = sheetItems(full, "colour-declared", sheetUrl(0));
    expect(fullItems).toHaveLength(256);
    expect(fullItems.some(pageIncomplete)).toBe(false);

    const over = run(readOf(HTML_A, [[sheetUrl(0), coloursSheet(257)]]), null, CTX_D);
    const items = sheetItems(over, "colour-declared", sheetUrl(0));
    expect(items).toHaveLength(256);
    expect(items.every(pageIncomplete)).toBe(true);
    expect(items.map((i) => i.observation.subject).sort()).toEqual(
      Array.from({ length: 256 }, (_, i) => hexAt(0x100000 + i).slice(1)).sort(),
    );
  });

  it("the same colour written 300 times is one colour, not a cap", () => {
    const css = "a{color:#123456}".repeat(300);
    const result = run(readOf(HTML_A, [[sheetUrl(0), css]]), null, CTX_D);
    const items = sheetItems(result, "colour-declared", sheetUrl(0));
    expect(items).toHaveLength(1);
    expect(pageIncomplete(items[0] as InputEvidence)).toBe(false);
  });

  it("32 distinct families are all kept and not flagged; 33 keep the first 32 by offset, each flagged", () => {
    const full = run(readOf(HTML_A, [[sheetUrl(0), familiesSheet(32)]]), null, CTX_D);
    const fullItems = sheetItems(full, "font-family", sheetUrl(0));
    expect(fullItems).toHaveLength(32);
    expect(fullItems.some(pageIncomplete)).toBe(false);

    const over = run(readOf(HTML_A, [[sheetUrl(0), familiesSheet(33)]]), null, CTX_D);
    const items = sheetItems(over, "font-family", sheetUrl(0));
    expect(items).toHaveLength(32);
    expect(items.every(pageIncomplete)).toBe(true);
    expect(items.map((i) => i.observation.subject).sort()).toEqual(
      Array.from({ length: 32 }, (_, i) => `declared.fam${i}`).sort(),
    );
  });

  it("the same family written 100 times is one family, not a cap", () => {
    const result = run(
      readOf(HTML_A, [[sheetUrl(0), "a{font-family:Inter}".repeat(100)]]),
      null,
      CTX_D,
    );
    const items = sheetItems(result, "font-family", sheetUrl(0));
    expect(items).toHaveLength(1);
    expect(pageIncomplete(items[0] as InputEvidence)).toBe(false);
  });

  it("a sheet past the family cap flags its colours too, and a sheet past the colour cap its families", () => {
    const manyFamilies = `a{color:#123456}${familiesSheet(33)}`;
    const a = run(readOf(HTML_A, [[sheetUrl(0), manyFamilies]]), null, CTX_D);
    expect(sheetItems(a, "colour-declared", sheetUrl(0)).every(pageIncomplete)).toBe(true);

    const manyColours = `a{font-family:Inter}${coloursSheet(257)}`;
    const b = run(readOf(HTML_A, [[sheetUrl(0), manyColours]]), null, CTX_D);
    const families = sheetItems(b, "font-family", sheetUrl(0));
    expect(families).toHaveLength(1);
    expect(families.every(pageIncomplete)).toBe(true);
  });

  it("only the sheet past a cap is flagged: another sheet and the page text are not", () => {
    const result = run(
      readOf(HTML_A, [
        [sheetUrl(0), coloursSheet(257)],
        [sheetUrl(1), "a{color:#654321}"],
      ]),
      null,
      CTX_D,
    );
    expect(sheetItems(result, "colour-declared", sheetUrl(0)).every(pageIncomplete)).toBe(true);
    expect(sheetItems(result, "colour-declared", sheetUrl(1)).some(pageIncomplete)).toBe(false);
    expect(ofKind(result.evidence, "text-span").some(pageIncomplete)).toBe(false);
  });

  it("with a render the families of a sheet are not items, so 33 of them flag nothing", () => {
    const css = `a{color:#123456}${familiesSheet(33)}`;
    const result = run(readOf(HTML_A, [[sheetUrl(0), css]]), SNAP_A);
    const items = sheetItems(result, "colour-declared", sheetUrl(0));
    expect(items).toHaveLength(1);
    expect(pageIncomplete(items[0] as InputEvidence)).toBe(false);
  });

  it("an item of a sheet past a cap has confidence 0.7 with the one factor", () => {
    const result = run(readOf(HTML_A, [[sheetUrl(0), coloursSheet(257)]]), null, CTX_D);
    const item = sheetItems(result, "colour-declared", sheetUrl(0))[0] as InputEvidence;
    expect(item.confidence.value).toBe(0.7);
    expect(item.confidence.factors.map((f) => f.id)).toEqual(["page-incomplete"]);
    expect(item.flags.map((f) => f.key)).toEqual(["quality.pageIncomplete"]);
  });

  it("a read that is already incomplete does not carry the factor twice", () => {
    const read = readOf(HTML_A, [[sheetUrl(0), coloursSheet(257)]], ["page-incomplete"]);
    const item = sheetItems(
      run(read, null, CTX_D),
      "colour-declared",
      sheetUrl(0),
    )[0] as InputEvidence;
    expect(item.confidence.factors.map((f) => f.id)).toEqual(["page-incomplete"]);
    expect(inputEvidenceSchema.safeParse(item).success).toBe(true);
  });

  it(
    "the worst case, 10 sheets of 1 MB and a 2 MB document with a description of 1.7 MB, gives fewer than 5,000 items and no id-collision",
    () => {
      const sheets = Array.from({ length: 10 }, (_, s) => {
        const colours = coloursSheet(60_000, s * 131_072);
        const families = familiesSheet(30_000, `f${s}x`);
        return [sheetUrl(s), (colours + families).slice(0, MB)] as [string, string];
      });
      const description = "we are calm and friendly not bold ".repeat(52_000);
      const html = `<html><head><title>${"calm ".repeat(40_000)}</title><meta name="description" content="${description}"></head><body><p>x</p></body></html>`;
      expect(html.length).toBeLessThanOrEqual(2 * MB);
      const { result } = timedAnalysis(readOf(html, sheets));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.evidence.length).toBeLessThan(5000);
      expect(new Set(result.evidence.map((i) => i.id)).size).toBe(result.evidence.length);
      expect(ofKind(result.evidence, "colour-declared")).toHaveLength(2560);
      expect(ofKind(result.evidence, "font-family")).toHaveLength(320);
    },
    HEAVY_TIMEOUT,
  );
});

describe("the title and the description are bounded before lexicon-1 reads them (SEC-4)", () => {
  const text = "we are calm and friendly not bold ".repeat(61_000);

  it(
    "a 2 MB meta description gives a bounded number of items, not an id-collision, in time",
    () => {
      const html = `<meta name="description" content="${text.slice(0, 2 * MB - 100)}"><p>x</p>`;
      const { result, elapsed } = timedAnalysis(readOf(html));
      expect(elapsed).toBeLessThan(DESCRIPTION_BOUND_MS);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const signals = ofKind(result.evidence, "personality-signal");
      expect(signals.length).toBeGreaterThan(0);
      expect(signals.length).toBeLessThan(200);
      const span = ofKind(result.evidence, "text-span").find(
        (i) => i.observation.subject === "meta",
      );
      expect(span?.source.locator).toMatchObject({ kind: "text", start: 0 });
      expect(span?.source.locator.kind === "text" && span.source.locator.end).toBeLessThanOrEqual(
        1000,
      );
      expect(result.evidence.every(pageIncomplete)).toBe(true);
    },
    HEAVY_TIMEOUT,
  );

  it(
    "a 2 MB title is bounded the same way",
    () => {
      const html = `<title>${text.slice(0, 2 * MB - 100)}</title><p>x</p>`;
      const { result, elapsed } = timedAnalysis(readOf(html));
      expect(elapsed).toBeLessThan(TITLE_BOUND_MS);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(ofKind(result.evidence, "personality-signal").length).toBeLessThan(200);
      expect(result.evidence.every(pageIncomplete)).toBe(true);
    },
    HEAVY_TIMEOUT,
  );

  it("a description within 1,000 characters is read whole and the items are not flagged", () => {
    const html = `<meta name="description" content="${"we are calm and friendly not bold ".repeat(28)}"><p>x</p>`;
    const result = run(readOf(html), null, CTX_D);
    expect(result.evidence.some(pageIncomplete)).toBe(false);
  });
});

describe("every stylesheet route is linear through analyseUrl (SEC-3, SEC-4)", () => {
  it.each([
    [
      "1 MB of distinct hex colours",
      () => `a{b:${Array.from({ length: 131_000 }, (_, i) => hexAt(i)).join(" ")}}`,
    ],
    ["1 MB of font-family: with no end", () => "font-family:a ".repeat(MB / 14 - 8)],
    ["a 1 MB run of spaces in one family", () => `font-family:a${" ".repeat(MB - 64)}b`],
    ["rgb( with a 1 MB digit run", () => `a{color:rgb(${"1".repeat(MB - 64)}x,1,1)}`],
    ["hsl( with a 1 MB digit run", () => `a{color:hsl(${"1".repeat(MB - 64)}x 1% 1%)}`],
    ["1 MB of one repeated family", () => "a{font-family:Inter}".repeat(MB / 20 - 8)],
  ])(
    "%s",
    (_name, make) => {
      const css = make();
      expect(css.length).toBeLessThanOrEqual(MB);
      const { result, elapsed } = timedAnalysis(readOf(HTML_A, [[sheetUrl(0), css]]));
      expect(elapsed).toBeLessThan(TIME_BOUND_MS);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(ofKind(result.evidence, "colour-declared").length).toBeLessThanOrEqual(256);
      expect(ofKind(result.evidence, "font-family").length).toBeLessThanOrEqual(32);
      for (const item of result.evidence) {
        expect(inputEvidenceSchema.safeParse(item).success).toBe(true);
      }
    },
    HEAVY_TIMEOUT,
  );
});
