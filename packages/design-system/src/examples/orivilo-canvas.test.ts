import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { Graph } from "../components/canvas-board/graph";
import { contrastRatio } from "../foundations/contrast";
import { SCENE_LOCKUPS } from "../components/logo/assets";
import { messagesFor } from "../i18n/messages/index";
import { tokens } from "../tokens/index";
import {
  type ArtText,
  type Paint,
  BOARDS,
  BOOK,
  BOOK_FRAME,
  CHAPTERS,
  EDGES,
  FRAMES,
  graphOf,
  ICON_SET,
  IMAGES,
  NODES,
  PALETTE,
  PIECES,
  SEQUENCES,
  SHEETS,
  studioGraph,
  type Box,
  type Pt,
  type Quad,
  ADDRESS,
  BRAND_NAME,
  BROWSER,
  CLOCK,
  cellBox,
  coverCrop,
  homography,
  placeOnQuad,
  quadInTile,
  textOf,
  VIOLET,
} from "./orivilo-canvas.data";

const th = messagesFor("th");
const en = messagesFor("en");
const STATIC = resolve(import.meta.dirname, "../../.storybook/static/orv-274");
const MIDDOT = String.fromCharCode(0xb7);
const EM_DASH = String.fromCharCode(0x2014);
const THAI = /[฀-๿]/;

function tally<T>(items: readonly T[], key: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) out[key(item)] = (out[key(item)] ?? 0) + 1;
  return out;
}

/** Every `ArtText` of the pieces and the book pages, with where it sits. */
function allArt(): { where: string; line: ArtText }[] {
  const out: { where: string; line: ArtText }[] = [];
  for (const p of PIECES) {
    const lines = p.content.kind === "type" || p.content.kind === "lines" ? p.content.lines : [];
    lines.forEach((line, i) => out.push({ where: `piece ${p.id} line ${i}`, line }));
  }
  for (const page of BOOK) {
    page.lines.forEach((line, i) => out.push({ where: `page ${page.n} line ${i}`, line }));
  }
  return out;
}

describe("orivilo canvas data, structure (spec rows 19, 23)", () => {
  it("has 31 nodes by chapter and by kind", () => {
    expect(NODES).toHaveLength(31);
    expect(tally(NODES, (n) => n.chapter)).toEqual({
      brief: 8,
      direction: 2,
      logo: 4,
      colour: 6,
      inUse: 2,
      brandbook: 4,
      system: 2,
      product: 3,
    });
    expect(tally(NODES, (n) => n.kind)).toEqual({
      knowledge: 12,
      direction: 2,
      artifact: 16,
      reference: 1,
    });
    expect(new Set(NODES.map((n) => n.id)).size).toBe(31);
  });

  it("has 36 edges: 25 input, 8 reference, 3 derived, and only edge 18 shows its label", () => {
    expect(EDGES).toHaveLength(36);
    expect(tally(EDGES, (e) => e.meaning)).toEqual({ input: 25, reference: 8, derived: 3 });
    expect(EDGES.map((e) => e.n)).toEqual(Array.from({ length: 36 }, (_, i) => i + 1));
    expect(EDGES.filter((e) => e.label !== false).map((e) => e.n)).toEqual([18]);
    expect(EDGES.filter((e) => e.label === false)).toHaveLength(35);
  });

  it("has 14 nodes with open and 8 sequences of 6, 3, 2, 6, 8, 12, 2 and 3 pages", () => {
    expect(NODES.filter((n) => n.open)).toHaveLength(14);
    expect(SEQUENCES.map((s) => s.id)).toEqual([
      "direction",
      "logo",
      "type",
      "palette",
      "inUse",
      "book",
      "system",
      "pages",
    ]);
    expect(SEQUENCES.map((s) => s.pages.length)).toEqual([6, 3, 2, 6, 8, 12, 2, 3]);
    expect(SEQUENCES.reduce((sum, s) => sum + s.pages.length, 0)).toBe(42);
  });

  it("keeps each open.page inside its sequence, and the book parts at 1, 3, 6 and 10", () => {
    for (const n of NODES) {
      if (!n.open) continue;
      const seq = SEQUENCES.find((s) => s.id === n.open?.sequence);
      expect(seq, n.id).toBeDefined();
      expect(n.open.page, n.id).toBeGreaterThanOrEqual(1);
      expect(n.open.page, n.id).toBeLessThanOrEqual(seq?.pages.length ?? 0);
    }
    const parts = ["bb-cover", "bb-logo", "bb-colour", "bb-use"].map((id) => {
      const open = NODES.find((n) => n.id === id)?.open;
      return [open?.page, open?.count];
    });
    expect(parts).toEqual([
      [1, 12],
      [3, 3],
      [6, 4],
      [10, 3],
    ]);
  });

  it("joins ports of the same kind, and every edge steps right", () => {
    const byId = new Map(NODES.map((n) => [n.id, n]));
    for (const e of EDGES) {
      const from = byId.get(e.from.node);
      const to = byId.get(e.to.node);
      expect(from, `edge ${e.n} source`).toBeDefined();
      expect(to, `edge ${e.n} target`).toBeDefined();
      const out = from?.outputs.find((p) => p.id === e.from.port);
      const inn = to?.inputs.find((p) => p.id === e.to.port);
      expect(out, `edge ${e.n} output port`).toBeDefined();
      expect(inn, `edge ${e.n} input port`).toBeDefined();
      expect(out?.kind, `edge ${e.n} kinds`).toBe(inn?.kind);
      expect((from?.x ?? 0) + (from?.width ?? 0), `edge ${e.n} steps right`).toBeLessThan(
        to?.x ?? 0,
      );
    }
  });

  it("gives every node except c-demo a source", () => {
    expect(NODES.filter((n) => n.source === undefined).map((n) => n.id)).toEqual(["c-demo"]);
    for (const n of NODES) if (n.id !== "c-demo") expect(n.source, n.id).toBeTruthy();
  });

  // The columns moved right in ORV-290 row 32 so no port name pill nears another node (4484 to
  // 4912 wide); the two 560 wide sheets and the 480 wide product column grow it to 5372 (spec
  // ORV-309 row 10). At 1440 wide the 0.25 floor frames 5760, so the whole board still fits.
  it("fits the world in 5372 x 2260", () => {
    for (const n of NODES) {
      expect(n.x, n.id).toBeGreaterThanOrEqual(0);
      expect(n.y, n.id).toBeGreaterThanOrEqual(0);
      expect(n.x + n.width, n.id).toBeLessThanOrEqual(5372);
      expect(n.y, n.id).toBeLessThanOrEqual(2260);
    }
  });

  it("names every chapter's nodes among the nodes of that chapter or the product view", () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual([
      "overview",
      "brief",
      "direction",
      "logo",
      "colour",
      "inUse",
      "brandbook",
      "system",
      "product",
    ]);
    const ids = new Set(NODES.map((n) => n.id));
    for (const ch of CHAPTERS) {
      for (const id of ch.nodes) expect(ids.has(id), `${ch.id} ${id}`).toBe(true);
      if (ch.anchor) expect(ch.nodes).toContain(ch.anchor);
    }
  });

  it("builds the frames and the palette the design lists", () => {
    expect(FRAMES.map((f) => [f.id, f.width, f.height, f.start, f.startAt, f.fade])).toEqual([
      ["landing", 1280, 290, 0, undefined, undefined],
      ["app", 1280, 290, 0, undefined, undefined],
      ["guide", 800, 290, 0, '[data-section="foundation"]', true],
    ]);
    expect(PALETTE.map((p) => p.hex)).toEqual([
      "#7A22C7",
      "#B07FEE",
      "#16151D",
      "#F4F4F0",
      "#D9F66F",
    ]);
  });

  it("holds no middot and no em dash in any string of the module", () => {
    const everything = JSON.stringify([
      NODES,
      EDGES,
      CHAPTERS,
      SEQUENCES,
      BOOK,
      PIECES,
      BOARDS,
      IMAGES,
      SHEETS,
      FRAMES,
      PALETTE,
      BOOK_FRAME,
    ]);
    expect(everything).not.toContain(MIDDOT);
    expect(everything).not.toContain(EM_DASH);
  });
});

describe("the product chapter (spec ORV-309 rows 5, 6, 7, 10 and 14)", () => {
  const product = NODES.filter((n) => n.chapter === "product");

  it("holds p-landing, p-app and p-guide, 480 wide, and no p-form or p-report", () => {
    expect(product.map((n) => [n.id, n.width, n.pad])).toEqual([
      ["p-landing", 480, "media"],
      ["p-app", 480, "media"],
      ["p-guide", 480, "media"],
    ]);
    const ids = new Set([...NODES.map((n) => n.id), ...CHAPTERS.flatMap((c) => c.nodes)]);
    expect(ids.has("p-form")).toBe(false);
    expect(ids.has("p-report")).toBe(false);
    const ends = EDGES.flatMap((e) => [e.from.node, e.to.node]);
    expect(ends).not.toContain("p-form");
    expect(ends).not.toContain("p-report");
    for (const n of product) {
      expect(
        EDGES.some((e) => e.to.node === n.id),
        `${n.id} is fed`,
      ).toBe(true);
    }
  });

  it("opens the landing, the app and the guidebook as pages 1 to 3 of one sequence", () => {
    const pages = SEQUENCES.find((s) => s.id === "pages");
    expect(pages?.pages.map((p) => [p.show, p.caption, p.second])).toEqual([
      [{ live: "landing" }, "node.landing", "product.landingNote"],
      [{ live: "app" }, "node.app", "product.appNote"],
      [{ live: "guide" }, "node.guide", "product.guideNote"],
    ]);
    expect(product.map((n) => [n.body, n.open])).toEqual([
      [
        { kind: "page", page: "landing" },
        { sequence: "pages", page: 1 },
      ],
      [
        { kind: "page", page: "app" },
        { sequence: "pages", page: 2 },
      ],
      [
        { kind: "page", page: "guide" },
        { sequence: "pages", page: 3 },
      ],
    ]);
  });

  it("gives the three frames one height, so the media of the nodes match", () => {
    expect(FRAMES.map((f) => f.height)).toEqual([290, 290, 290]);
    // A 1280 x 800 page scaled to 460 wide is 288 tall: the frame height less its 2 px border.
    expect(Math.round((460 / 1280) * 800) + 2).toBe(290);
  });

  it.each([
    ["en", en],
    ["th", th],
  ] as const)("has the same product copy keys in %s, with no Thai-only claim", (_, m) => {
    const c = m.orvCanvas;
    expect(Object.keys(c.product).sort()).toEqual(
      ["appNote", "badge", "guideNote", "landingBadge", "landingNote"].sort(),
    );
    for (const key of ["landing", "app", "guide"] as const) expect(c.node[key]).toBeTruthy();
    expect(c.node).not.toHaveProperty("form");
    expect(c.node).not.toHaveProperty("report");
    for (const line of [c.use.phoneSub, c.product.landingNote]) {
      expect(line).not.toMatch(/Thai only|ภาษาไทยเท่านั้น/);
    }
  });

  it("names the honest labels the design gives, in both languages", () => {
    expect([en.orvCanvas.product.landingBadge, en.orvCanvas.product.badge]).toEqual([
      "Mockup",
      "Sample data",
    ]);
    expect([th.orvCanvas.product.landingBadge, th.orvCanvas.product.badge]).toEqual([
      "ภาพจำลอง",
      "ข้อมูลตัวอย่าง",
    ]);
    expect(en.orvCanvas.use.phoneSub).toBe(
      "Mockup: ORIVILO's own landing at 390, in English and Thai.",
    );
    expect(en.orvCanvas.product.landingNote).toBe(
      "ORIVILO's own landing page, in English and Thai.",
    );
  });
});

/** An intent button in source: `variant="intent"`, `variant={"intent"}`, `variant: "intent"`. */
const INTENT_BUTTON = /variant\s*[=:]\s*\{?\s*["'`]intent["'`]/g;
const countIntent = (source: string) => source.match(INTENT_BUTTON)?.length ?? 0;

describe("the design system sheets (spec ORV-309 rows 8, 9, 10 and 14)", () => {
  const source = readFileSync(resolve(import.meta.dirname, "orivilo-canvas.tsx"), "utf8");
  const sheetCode = (from: string, to: string) =>
    source.slice(source.indexOf(from), source.indexOf(to));

  it("shows the 21 catalog entries of base-sheet-1 in three columns of seven, in order", () => {
    expect(SHEETS.base.map((c) => [c.id, c.entries])).toEqual([
      ["actions", ["Button", "ToggleGroup", "Tabs", "Breadcrumb", "Kbd", "Avatar", "FeaturedIcon"]],
      ["inputs", ["Field", "Input", "Select", "Checkbox", "Switch", "Slider", "Textarea"]],
      ["display", ["Badge", "Tag", "RadioGroup", "Progress", "Alert", "Spinner", "Skeleton"]],
    ]);
    expect(SHEETS.base.flatMap((c) => c.entries)).toHaveLength(21);
  });

  it("names a live instance for every entry, and each name is a catalog entry", () => {
    const catalog = readFileSync(resolve(import.meta.dirname, "../../catalog/coverage.md"), "utf8");
    const code = sheetCode("function BaseSheet", "function ComposedSheet");
    for (const name of SHEETS.base.flatMap((c) => c.entries)) {
      expect(code, `${name} instance`).toMatch(new RegExp(`\\n    ${name}: `));
      expect(catalog.toLowerCase(), `${name} in the catalog`).toContain(name.toLowerCase());
    }
  });

  it("has no intent button on the base sheet and at most one on the composed sheet", () => {
    expect(countIntent(sheetCode("function BaseSheet", "function ComposedSheet"))).toBe(0);
    expect(
      countIntent(sheetCode("function ComposedSheet", "function SheetBody")),
    ).toBeLessThanOrEqual(1);
    // The guard blocks each spelling of the prop, so each one is a red sample.
    for (const sample of [
      '<Button variant="intent">',
      "<Button variant={'intent'}>",
      "<Button variant={`intent`}>",
      '{ variant: "intent" }',
    ]) {
      expect(countIntent(sample), sample).toBe(1);
    }
    expect(countIntent('<Button variant="primary">')).toBe(0);
  });

  it("builds the composed board: five nodes, four edges, Mood selected, Audience to Mood unlabelled", () => {
    const { nodes, edges } = SHEETS.composed;
    expect(nodes.map((n) => n.id)).toEqual(["brief", "personality", "audience", "mood", "font"]);
    expect(nodes.filter((n) => n.selected).map((n) => n.id)).toEqual(["mood"]);
    expect(edges.map((e) => `${e.from}>${e.to}`)).toEqual([
      "brief>audience",
      "personality>mood",
      "audience>mood",
      "mood>font",
    ]);
    expect(edges.filter((e) => e.label === false).map((e) => `${e.from}>${e.to}`)).toEqual([
      "audience>mood",
    ]);
  });

  it.each([
    ["en", en],
    ["th", th],
  ] as const)("turns the composed sheet into a graph in %s", (locale, m) => {
    const g = studioGraph(locale, m);
    expect(g.nodes).toHaveLength(5);
    expect(g.edges).toHaveLength(4);
    expect(g.nodes.filter((n) => n.selected).map((n) => n.id)).toEqual(["mood"]);
    expect(g.edges.find((e) => e.id === "audience-mood")?.data?.label).toBe(false);
    expect(g.edges.find((e) => e.id === "brief-audience")?.data?.label).toBeUndefined();
    expect(studioGraph(locale, m)).toEqual(g);
  });

  it("wires edges 26 to 36 as the design's chapter wiring table lists them", () => {
    expect(
      EDGES.filter((e) => e.n >= 26).map((e) => [
        e.n,
        `${e.from.node}:${e.from.port}`,
        `${e.to.node}:${e.to.port}`,
        e.meaning,
      ]),
    ).toEqual([
      [26, "bb-cover:profile", "p-base:profile", "input"],
      [27, "p-base:actions", "p-pat:actions", "input"],
      [28, "p-base:inputs", "p-pat:inputs", "input"],
      [29, "p-base:display", "p-pat:display", "input"],
      [30, "p-base:actions", "p-landing:parts", "input"],
      [31, "p-pat:board", "p-landing:parts", "input"],
      [32, "p-pat:board", "p-app:parts", "input"],
      [33, "p-pat:panels", "p-app:parts", "input"],
      [34, "p-base:inputs", "p-app:parts", "input"],
      [35, "p-base:actions", "p-guide:parts", "input"],
      [36, "p-base:display", "p-guide:parts", "input"],
    ]);
  });

  it("makes p-base and p-pat 560 wide result nodes that open the system sequence", () => {
    const nodes = NODES.filter((n) => n.chapter === "system");
    expect(nodes.map((n) => [n.id, n.width, n.x, n.y, n.pad, n.open])).toEqual([
      ["p-base", 560, 3464, 96, "media", { sequence: "system", page: 1 }],
      ["p-pat", 560, 4136, 96, "media", { sequence: "system", page: 2 }],
    ]);
    expect(nodes.map((n) => n.body)).toEqual([
      { kind: "sheet", sheet: "base" },
      { kind: "sheet", sheet: "composed" },
    ]);
    expect(nodes[0]?.outputs.map((p) => p.id)).toEqual(["actions", "inputs", "display"]);
    expect(nodes[1]?.inputs.map((p) => p.id)).toEqual(["actions", "inputs", "display"]);
    expect(nodes[1]?.outputs.map((p) => p.id)).toEqual(["board", "panels"]);
    expect(SEQUENCES.find((s) => s.id === "system")?.pages.map((p) => p.show)).toEqual([
      { sheet: "base" },
      { sheet: "composed" },
    ]);
  });

  it("puts the product column at x 4892 and keeps its rows", () => {
    expect(
      NODES.filter((n) => n.chapter === "product").map((n) => [n.id, n.x, n.y, n.width]),
    ).toEqual([
      ["p-landing", 4892, 28, 480],
      ["p-app", 4892, expect.any(Number), 480],
      ["p-guide", 4892, expect.any(Number), 480],
    ]);
  });

  it("keeps the 06 and 07 chapters framing the sheets", () => {
    const system = CHAPTERS.find((c) => c.id === "system");
    expect(system?.nodes).toEqual(["p-base", "p-pat"]);
    expect(CHAPTERS.find((c) => c.id === "product")?.nodes).toEqual([
      "p-base",
      "p-pat",
      "p-landing",
      "p-app",
      "p-guide",
    ]);
  });

  it.each([
    ["en", en],
    ["th", th],
  ] as const)("keeps the same sheet copy keys in %s as in English", (_, m) => {
    const keys = (o: unknown, prefix = ""): string[] =>
      typeof o === "object" && o !== null
        ? Object.entries(o).flatMap(([k, v]) => keys(v, `${prefix}${k}.`))
        : [prefix];
    expect(keys(m.orvCanvas.sheet)).toEqual(keys(en.orvCanvas.sheet));
    expect(keys(m.orvCanvas.port)).toEqual(keys(en.orvCanvas.port));
    expect(m.orvCanvas.preview.designSystem).toBeTruthy();
    expect(m.orvCanvas).not.toHaveProperty("part");
    for (const text of keys(m.orvCanvas.sheet)) expect(text).toBeTruthy();
  });

  it("says the chat is by rules and keeps the sheet copy plain in both languages", () => {
    expect(th.orvCanvas.sheet.badge.rules).toBe("ตามกฎ");
    expect(en.orvCanvas.sheet.field.name).toBe("Project name");
    expect(th.orvCanvas.sheet.field.name).toBe("ชื่อโปรเจกต์");
    const all = JSON.stringify([en.orvCanvas.sheet, th.orvCanvas.sheet]);
    expect(all).not.toContain(MIDDOT);
    expect(all).not.toContain(EM_DASH);
    expect(THAI.test(JSON.stringify(en.orvCanvas.sheet))).toBe(false);
  });
});

describe("graphOf (spec row 19)", () => {
  it("runs twice with deep-equal results, in both languages", () => {
    for (const m of [th, en]) expect(graphOf(m)).toEqual(graphOf(m));
    const graph = graphOf(th) satisfies Graph;
    expect(graph.nodes).toHaveLength(31);
    expect(graph.edges).toHaveLength(36);
  });

  it("fills title, ports, size, pad, open count, source and row", () => {
    const g = graphOf(en);
    const book = g.nodes.find((n) => n.id === "bb-colour");
    expect(book?.data.open).toEqual({ count: 4 });
    expect(book?.data.size).toBe("custom");
    const board = g.nodes.find((n) => n.id === "d-board");
    expect(board?.data.open).toEqual({ count: 6 });
    expect(board?.data.pad).toBe("media");
    expect(board?.width).toBe(560);
    expect(board?.position).toEqual({ x: 804, y: 572 });
    expect(g.nodes.find((n) => n.id === "c-demo")?.data.source).toBeUndefined();
    const pat = g.nodes.find((n) => n.id === "p-pat");
    expect(pat?.data.inputs?.map((p) => p.id)).toEqual(["actions", "inputs", "display"]);
    expect(pat?.data.outputs?.map((p) => p.id)).toEqual(["board", "panels"]);
    for (const n of g.nodes) {
      expect(n.data.title, n.id).toBeTruthy();
      expect(n.data.source, n.id).toBe(NODES.find((r) => r.id === n.id)?.source);
      const ids = [...(n.data.inputs ?? []), ...(n.data.outputs ?? [])].map((p) => p.id);
      expect(new Set(ids).size, n.id).toBe(ids.length);
    }
  });

  it("names edges e<n> and uses port ids as handles", () => {
    const g = graphOf(th);
    const e18 = g.edges.find((e) => e.id === "e18");
    expect(e18?.sourceHandle).toBe("palette");
    expect(e18?.targetHandle).toBe("palette");
    expect(e18?.data?.label).toBeUndefined();
    expect(g.edges.filter((e) => e.data?.label === false)).toHaveLength(35);
  });

  it("resolves a row's name in both languages", () => {
    expect(textOf(en, { axis: "playful" })).toBe(en.direction.axes.playful);
    expect(textOf(th, { copy: "wall.page", params: { page: "03" } })).toContain("03");
  });
});

describe("orivilo canvas data, boards and book (spec rows 28, 29, 30)", () => {
  const boxes = (board: "direction" | "inUse"): { id: string; box: Box }[] =>
    PIECES.filter((p) => p.board === board).map((p) => ({ id: p.id, box: p.box }));
  const EPS = 1e-6;

  it("holds 5 direction and 7 in use pieces, in the board order", () => {
    expect(boxes("direction")).toHaveLength(5);
    expect(boxes("inUse")).toHaveLength(7);
    expect(BOARDS.direction.pieces).toEqual(["people", "line", "place", "making", "type"]);
    expect(BOARDS.inUse.pieces).toEqual([
      "window",
      "phone",
      "icon",
      "hero",
      "share",
      "card",
      "sign",
    ]);
  });

  for (const board of ["direction", "inUse"] as const) {
    it(`keeps the ${board} pieces inside 1280 x 800, apart, and 12 from their neighbours`, () => {
      const list = boxes(board);
      for (const { id, box } of list) {
        expect(box.x, id).toBeGreaterThanOrEqual(-EPS);
        expect(box.y, id).toBeGreaterThanOrEqual(-EPS);
        expect(box.x + box.w, id).toBeLessThanOrEqual(1280 + EPS);
        expect(box.y + box.h, id).toBeLessThanOrEqual(800 + EPS);
      }
      for (const a of list) {
        for (const b of list) {
          if (a.id === b.id) continue;
          const apartX = a.box.x + a.box.w <= b.box.x + EPS || b.box.x + b.box.w <= a.box.x + EPS;
          const apartY = a.box.y + a.box.h <= b.box.y + EPS || b.box.y + b.box.h <= a.box.y + EPS;
          expect(apartX || apartY, `${a.id} overlaps ${b.id}`).toBe(true);
        }
      }
      // The nearest neighbour to the right of, and below, each piece sits exactly 12 away.
      for (const a of list) {
        const rightGaps = list
          .filter(
            (b) =>
              b.id !== a.id &&
              b.box.x >= a.box.x + a.box.w - EPS &&
              b.box.y < a.box.y + a.box.h - EPS &&
              a.box.y < b.box.y + b.box.h - EPS,
          )
          .map((b) => b.box.x - (a.box.x + a.box.w));
        if (rightGaps.length > 0)
          expect(Math.min(...rightGaps), `${a.id} right`).toBeCloseTo(12, 6);
        const belowGaps = list
          .filter(
            (b) =>
              b.id !== a.id &&
              b.box.y >= a.box.y + a.box.h - EPS &&
              b.box.x < a.box.x + a.box.w - EPS &&
              a.box.x < b.box.x + b.box.w - EPS,
          )
          .map((b) => b.box.y - (a.box.y + a.box.h));
        if (belowGaps.length > 0)
          expect(Math.min(...belowGaps), `${a.id} below`).toBeCloseTo(12, 6);
      }
    });
  }

  it("covers the in use grid: 5 columns of 246.4 and 3 rows with 12 gutters", () => {
    expect(cellBox({ col: 0, row: 0, cols: 1, rows: 1 })).toEqual({
      x: 0,
      y: 0,
      w: 246.4,
      h: 776 / 3,
    });
    const last = cellBox({ col: 3, row: 2, cols: 2, rows: 1 });
    expect(last.x + last.w).toBeCloseTo(1280, 6);
    expect(last.y + last.h).toBeCloseTo(800, 6);
  });

  it("keeps the book page 11 pieces inside the page, apart, 12 from each other", () => {
    const page = BOOK.find((p) => p.n === 11);
    expect(page?.art?.kind).toBe("pieces");
    const list = page?.art?.kind === "pieces" ? page.art.pieces : [];
    expect(list).toHaveLength(6);
    for (const { box } of list) {
      expect(box.x + box.w).toBeLessThanOrEqual(1280);
      expect(box.y + box.h).toBeLessThanOrEqual(800);
    }
    const name = (p: (typeof list)[number]) => ("piece" in p ? p.piece : p.specimen);
    for (const a of list) {
      for (const b of list) {
        if (a === b) continue;
        const apart =
          a.box.x + a.box.w + 12 <= b.box.x ||
          b.box.x + b.box.w + 12 <= a.box.x ||
          a.box.y + a.box.h + 12 <= b.box.y ||
          b.box.y + b.box.h + 12 <= a.box.y;
        expect(apart, `${name(a)} and ${name(b)}`).toBe(true);
      }
    }
  });

  it("places the six placements of page 11 in the design's boxes, the phone with its grid", () => {
    const page = BOOK.find((p) => p.n === 11);
    const list = page?.art?.kind === "pieces" ? page.art.pieces : [];
    expect(
      list.map((p) => [
        "piece" in p ? p.piece : p.specimen,
        p.box.x,
        p.box.y,
        p.box.w,
        p.box.h,
        "variant" in p ? p.variant : undefined,
      ]),
    ).toEqual([
      ["phone", 48, 82, 300, 646, "grid"],
      ["window", 360, 82, 560, 317, undefined],
      ["icon", 932, 82, 300, 317, undefined],
      ["icons", 360, 411, 272, 317, undefined],
      ["card", 644, 411, 288, 317, undefined],
      ["sign", 944, 411, 288, 317, undefined],
    ]);
  });

  it("holds the 24 glyphs of the icon set in the design's order, 6 across and 4 down", () => {
    expect(ICON_SET).toHaveLength(24);
    expect(ICON_SET.length / 6).toBe(4);
    expect(ICON_SET.join(" ")).toBe(
      [
        "Cursor Hand Plus Search Undo Redo",
        "InputBlock Knowledge Artifact Reference Direction Note",
        "ReadStep DraftStep CompareStep GenerateStep Eye Group",
        "Chat Send Upload Copy Trash Fit",
      ].join(" "),
    );
    expect(new Set(ICON_SET).size).toBe(24);
    const page = BOOK.find((p) => p.n === 11);
    const set = page?.art?.kind === "pieces" ? page.art.pieces.find((p) => "specimen" in p) : null;
    expect(set && "glyphs" in set ? set.glyphs : []).toEqual(ICON_SET);
  });

  it("draws the phone's layout grid at 24 and 366 of 390, the measure 24, 342, 24", () => {
    const phone = PIECES.find((p) => p.id === "phone");
    if (phone?.content.kind !== "phone") throw new Error("no phone");
    const { lines, measure } = phone.content.grid;
    expect(phone.content.screenWidth).toBe(390);
    expect(lines).toEqual([24, 366]);
    expect(measure).toEqual([0, 24, 366, 390]);
    expect(measure.slice(1).map((end, i) => end - (measure[i] ?? 0))).toEqual([24, 342, 24]);
  });

  it("opens page 10 with a field of three live screens at -12 degrees on violet", () => {
    const art = BOOK.find((p) => p.n === 10)?.art;
    expect(art?.kind).toBe("field");
    if (art?.kind !== "field") return;
    expect(art.ground).toEqual(VIOLET);
    expect(art.group).toEqual({ x: 10, y: -40, w: 680, h: 960, rotate: -12 });
    expect(art.phone).toEqual({ at: [40, 150], width: 250 });
    expect(art.column).toEqual({ at: [314, 40], gap: 24, window: 560, guidebook: 250 });
  });

  it("gives the In use board the design's seven pieces on the grid, the screens first", () => {
    const cells = PIECES.filter((p) => p.board === "inUse").map((p) => [p.id, p.box]);
    expect(cells).toEqual([
      ["window", cellBox({ col: 0, row: 0, cols: 3, rows: 2 })],
      ["phone", cellBox({ col: 3, row: 0, cols: 1, rows: 2 })],
      ["icon", cellBox({ col: 4, row: 0, cols: 1, rows: 1 })],
      ["hero", cellBox({ col: 4, row: 1, cols: 1, rows: 2 })],
      ["share", cellBox({ col: 0, row: 2, cols: 2, rows: 1 })],
      ["card", cellBox({ col: 2, row: 2, cols: 1, rows: 1 })],
      ["sign", cellBox({ col: 3, row: 2, cols: 1, rows: 1 })],
    ]);
    // Cells per piece, from the box: the digital pieces take 11 of the 15, the photograph 2, the
    // card and the sign 1 each.
    const count = (box: Box) =>
      Math.round((box.w + 12) / 258.4) * Math.round((box.h + 12) / (776 / 3 + 12));
    const take = (ids: string[]) =>
      PIECES.filter((p) => ids.includes(p.id)).reduce((sum, p) => sum + count(p.box), 0);
    expect(take(["window", "phone", "icon", "share"])).toBe(11);
    expect(take(["hero"])).toBe(2);
    expect(take(["card", "sign"])).toBe(2);
  });

  it("holds 12 book pages numbered 1 to 12 in four parts", () => {
    expect(BOOK.map((p) => p.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const range = (part: string) => BOOK.filter((p) => p.part === part).map((p) => p.n);
    expect(range("cover")).toEqual([1, 2]);
    expect(range("logo")).toEqual([3, 4, 5]);
    expect(range("colour")).toEqual([6, 7, 8, 9]);
    expect(range("use")).toEqual([10, 11, 12]);
    expect(BOOK_FRAME.size).toEqual({ w: 1280, h: 800 });
  });
});

describe("orivilo canvas data, images (spec row 33)", () => {
  const ids = [
    "brand-hero",
    "direction-team",
    "colour-reference",
    "direction-making",
    "direction-place",
    "scene-card",
    "scene-sign",
  ];
  const TREATMENT: Record<string, string> = {
    "brand-hero": "photo",
    "direction-team": "violet",
    "colour-reference": "photo",
    "direction-making": "violet",
    "direction-place": "paper",
    "scene-card": "photo",
    "scene-sign": "photo",
  };

  /** The pixel size from the RIFF header of a WebP: a VP8, VP8L or VP8X chunk. */
  function webpSize(bytes: Buffer): { w: number; h: number } {
    expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
    expect(bytes.toString("ascii", 8, 12)).toBe("WEBP");
    const chunk = bytes.toString("ascii", 12, 16);
    if (chunk === "VP8 ") {
      return { w: bytes.readUInt16LE(26) & 0x3fff, h: bytes.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === "VP8L") {
      const bits = bytes.readUInt32LE(21);
      return { w: (bits & 0x3fff) + 1, h: ((bits >>> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8X") {
      return { w: bytes.readUIntLE(24, 3) + 1, h: bytes.readUIntLE(27, 3) + 1 };
    }
    throw new Error(`unknown WebP chunk ${chunk}`);
  }

  /** The prompt of a prompt file: the body of its `text` fence, or the whole file. */
  function promptOf(file: string): string {
    const raw = readFileSync(file, "utf8");
    const fence = /```text\n([\s\S]*?)\n```/.exec(raw);
    return (fence?.[1] ?? raw).replace(/\n$/, "");
  }

  /** The cross product of each corner turn of a quad. */
  function turns(q: Quad): number[] {
    return q.map((p, i) => {
      const a = q[(i + 1) % 4] as Pt;
      const b = q[(i + 2) % 4] as Pt;
      return (a[0] - p[0]) * (b[1] - a[1]) - (a[1] - p[1]) * (b[0] - a[0]);
    });
  }

  it("holds exactly the 7 ids", () => {
    expect(IMAGES.map((i) => i.id).sort()).toEqual([...ids].sort());
  });

  for (const id of ids) {
    it(`${id}: file, size, header, prompt, alt, check`, () => {
      const rec = IMAGES.find((i) => i.id === id);
      if (!rec) throw new Error(`no record ${id}`);
      const webp = resolve(STATIC, `${id}.webp`);
      expect(rec.file).toBe(`/orv-274/${id}.webp`);
      expect(existsSync(webp)).toBe(true);
      expect(statSync(webp).size).toBeLessThanOrEqual(400 * 1024);
      const size = webpSize(readFileSync(webp));
      expect(size).toEqual({ w: rec.width, h: rec.height });
      expect(Math.max(size.w, size.h)).toBeLessThanOrEqual(1600);

      expect(rec.promptFile).toBe(`${id}.prompt.md`);
      const promptPath = resolve(STATIC, rec.promptFile);
      expect(existsSync(promptPath)).toBe(true);
      expect(promptOf(promptPath)).toBe(rec.prompt);

      expect(th.orvCanvas.image.alt[id as keyof typeof th.orvCanvas.image.alt]).toBeTruthy();
      expect(en.orvCanvas.image.alt[id as keyof typeof en.orvCanvas.image.alt]).toBeTruthy();
      expect(rec.treatment).toBe(TREATMENT[id]);

      expect(rec.check.subject.length).toBeGreaterThan(0);
      expect(rec.check.noText).toBe(true);
      expect(rec.check.licence.length).toBeGreaterThan(0);
      expect(rec.check.checkedBy.length).toBeGreaterThan(0);
      expect(rec.check.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(rec.generatedWith.length).toBeGreaterThan(0);
      expect(rec.generatedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(rec.termsUrl).toMatch(/^https:\/\//);

      if (id === "brand-hero") {
        expect(rec.check.noMarks).toEqual({ exactlyOne: true, matchesReference: true });
        expect(rec.reference).toBeTruthy();
        expect(rec.prompt.split("\n").some((l) => l.startsWith("The mark:"))).toBe(true);
      } else {
        expect(rec.check.noMarks).toBe(true);
        expect(rec.reference).toBeUndefined();
        const constraints = rec.prompt.split("\n").find((l) => l.startsWith("Constraints:"));
        expect(constraints, "Constraints line").toBeDefined();
        expect(constraints).toContain("No");
        expect(constraints).toContain("logos");
      }
    });
  }

  it("gives a quad to the two scenes only, in 0 to 100 and convex", () => {
    expect(IMAGES.filter((i) => i.quad).map((i) => i.id)).toEqual(["scene-card", "scene-sign"]);
    for (const rec of IMAGES) {
      if (!rec.quad) continue;
      for (const [x, y] of rec.quad) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      }
      const t = turns(rec.quad);
      expect(t.every((v) => v > 0) || t.every((v) => v < 0), rec.id).toBe(true);
    }
  });

  it("uses every image in a piece, a page or c-demo", () => {
    const used = new Set<string>();
    for (const p of PIECES) {
      if (p.content.kind === "photo" || p.content.kind === "scene") used.add(p.content.image);
    }
    for (const n of NODES) if (n.body.kind === "demo") used.add(n.body.image);
    expect([...used].sort()).toEqual([...ids].sort());
  });
});

describe("orivilo canvas data, quad helper (spec row 40)", () => {
  const card = IMAGES.find((i) => i.id === "scene-card");
  const sign = IMAGES.find((i) => i.id === "scene-sign");
  const IMG = { w: 1254, h: 1254 };
  const CELL = { w: 246.4, h: 776 / 3 };
  const PAGE = { w: 288, h: 317 }; // page 11's card and sign tiles
  const FACES = { card: { w: 350, h: 200 }, sign: { w: 600, h: 300 } };

  /** A projective map (row major, 9 values) applied to a point. */
  function apply(h: readonly number[], [x, y]: Pt): Pt {
    const w = (h[6] ?? 0) * x + (h[7] ?? 0) * y + (h[8] ?? 1);
    return [
      ((h[0] ?? 0) * x + (h[1] ?? 0) * y + (h[2] ?? 0)) / w,
      ((h[3] ?? 0) * x + (h[4] ?? 0) * y + (h[5] ?? 0)) / w,
    ];
  }
  const near = (a: Pt, b: Pt) => {
    expect(Math.abs(a[0] - b[0])).toBeLessThanOrEqual(0.01);
    expect(Math.abs(a[1] - b[1])).toBeLessThanOrEqual(0.01);
  };
  const corners = (f: { w: number; h: number }): Pt[] => [
    [0, 0],
    [f.w, 0],
    [f.w, f.h],
    [0, f.h],
  ];

  it("covers a tile with the larger scale, centred", () => {
    expect(coverCrop({ w: 246.4, h: 776 / 3 }, IMG).s).toBeCloseTo(776 / 3 / 1254, 9);
    const wide = coverCrop({ w: 200, h: 100 }, { w: 100, h: 100 });
    expect(wide).toEqual({ s: 2, dx: 0, dy: -50 });
    const tall = coverCrop({ w: 100, h: 200 }, { w: 100, h: 100 });
    expect(tall).toEqual({ s: 2, dx: -50, dy: 0 });
    // A non-square image: x scales by the width, y by the height (the two scenes are square).
    const q = quadInTile(
      [
        [50, 50],
        [100, 50],
        [100, 100],
        [50, 100],
      ],
      { w: 100, h: 100 },
      { w: 200, h: 100 },
    );
    expect(q[0]).toEqual([50, 50]);
    expect(q[2]).toEqual([150, 100]);
  });

  it("maps the face corners onto the card and sign tile quads within 0.01 px", () => {
    for (const [rec, face, tile] of [
      [card, FACES.card, CELL],
      [card, FACES.card, PAGE],
      [sign, FACES.sign, CELL],
      [sign, FACES.sign, PAGE],
    ] as const) {
      if (!rec?.quad) throw new Error("no quad");
      const target = quadInTile(rec.quad, tile, IMG);
      const h = homography(face, target);
      expect(h).toHaveLength(9);
      expect(h[8]).toBe(1);
      corners(face).forEach((p, i) => near(apply(h, p), target[i] as Pt));
    }
  });

  it("maps a square onto a known trapezoid", () => {
    const trapezoid: Quad = [
      [20, 0],
      [80, 0],
      [100, 100],
      [0, 100],
    ];
    const h = homography({ w: 100, h: 100 }, trapezoid);
    corners({ w: 100, h: 100 }).forEach((p, i) => near(apply(h, p), trapezoid[i] as Pt));
    // The centre of the square lands on the centre line, nearer the narrow (far) top edge.
    const centre = apply(h, [50, 50]);
    expect(centre[0]).toBeCloseTo(50, 6);
    expect(centre[1]).toBeCloseTo(37.5, 6);
  });

  it("gives placeOnQuad as a matrix3d whose 16 numbers map the same corners", () => {
    if (!card?.quad || !sign?.quad) throw new Error("no quad");
    for (const [rec, face, tile] of [
      [card, FACES.card, CELL],
      [sign, FACES.sign, PAGE],
    ] as const) {
      if (!rec.quad) throw new Error("no quad");
      const css = placeOnQuad(rec.quad, face, tile, IMG);
      const match = /^matrix3d\(([^)]+)\)$/.exec(css);
      expect(match).not.toBeNull();
      const m = (match?.[1] ?? "").split(",").map(Number);
      expect(m).toHaveLength(16);
      const target = quadInTile(rec.quad, tile, IMG);
      corners(face).forEach(([x, y], i) => {
        const w = (m[3] ?? 0) * x + (m[7] ?? 0) * y + (m[15] ?? 1);
        near(
          [
            ((m[0] ?? 0) * x + (m[4] ?? 0) * y + (m[12] ?? 0)) / w,
            ((m[1] ?? 0) * x + (m[5] ?? 0) * y + (m[13] ?? 0)) / w,
          ],
          target[i] as Pt,
        );
      });
    }
  });

  it("gives the W5 table in tile px for the board cell and book page 11", () => {
    if (!card?.quad || !sign?.quad) throw new Error("no quad");
    const W5: [Quad, { w: number; h: number }, number[]][] = [
      [card.quad, CELL, [50.0, 102.69, 181.92, 82.26, 197.44, 159.08, 64.74, 176.41]],
      [sign.quad, CELL, [37.06, 83.55, 208.04, 62.34, 208.04, 184.17, 37.06, 167.62]],
      [card.quad, PAGE, [54.29, 125.85, 215.96, 100.81, 234.98, 194.96, 72.36, 216.19]],
      [sign.quad, PAGE, [38.44, 102.39, 247.98, 76.4, 247.98, 225.7, 38.44, 205.42]],
    ];
    for (const [quad, tile, expected] of W5) {
      const got = quadInTile(quad, tile, IMG).flatMap((p) => [...p]);
      got.forEach((v, i) => expect(Math.abs(v - (expected[i] ?? 0))).toBeLessThanOrEqual(0.01));
      for (const [x, y] of quadInTile(quad, tile, IMG)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(tile.w);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(tile.h);
      }
    }
  });
});

describe("orivilo canvas data, art (spec row 41)", () => {
  const art = allArt();

  it("sets every k between 0.8 and 5", () => {
    const withK = art.filter(({ line }) => "k" in line.size);
    expect(withK.length).toBeGreaterThan(10);
    for (const { where, line } of withK) {
      const k = "k" in line.size ? line.size.k : 0;
      expect(k, where).toBeGreaterThanOrEqual(0.8);
      expect(k, where).toBeLessThanOrEqual(5);
    }
  });

  it("gives Thai lines no leading other than display", () => {
    const thai = art.filter(({ line }) =>
      ("data" in line.text ? line.text.data : textOf(th, line.text)).match(THAI),
    );
    expect(thai.length).toBeGreaterThan(3);
    for (const { where, line } of thai) {
      if ("data" in line.text) expect(line.leading ?? "display", where).toBe("display");
    }
  });

  it("uses leading 1.05 on page 1's title only", () => {
    const hits = art.filter(({ line }) => line.leading === 1.05).map(({ where }) => where);
    expect(hits).toEqual(["page 1 line 0"]);
  });

  it("holds no colour value in PIECES, BOOK or BOARDS: every paint is a token name", () => {
    const text = JSON.stringify([PIECES, BOOK, BOARDS]);
    expect(text).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(text).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch)\(/i);
  });

  /** The hex a paint resolves to in the base profile: the art's floods and inks keep their own mode. */
  const hexOfPaint = (paint: Paint): string => {
    const token = tokens.get("semantic", paint.token);
    if (!token) throw new RangeError(`no semantic token ${paint.token}`);
    return String(tokens.resolve(token, paint.mode).value);
  };

  /** Every art line with the flood it sits on: a piece's flood, a page's ground, a field's swatch. */
  function linesOnFloods(): { where: string; line: ArtText; flood: string }[] {
    const out: { where: string; line: ArtText; flood: string }[] = [];
    for (const p of PIECES) {
      const c = p.content;
      if (c.kind !== "type" && c.kind !== "lines") continue;
      c.lines.forEach((line, i) =>
        out.push({ where: `piece ${p.id} line ${i}`, line, flood: hexOfPaint(p.flood) }),
      );
    }
    for (const page of BOOK) {
      page.lines.forEach((line, i) => {
        let flood: string;
        if (page.layout === "grounds" && Array.isArray(page.ground)) {
          // Page 5: line i sits on third i of the page.
          flood = hexOfPaint(page.ground[i] as Paint);
        } else if (page.layout === "palette") {
          // Page 7: lines 0-1, 2-3, 4-5, 6 and 7 sit on the swatches canvas, ink, violet, violetDark
          // and lime, whose colours are the palette's own hex values.
          const swatch = [0, 0, 1, 1, 2, 2, 3, 4][i];
          const entry = PALETTE.find((e) => e.id === page.swatches?.[swatch ?? -1]);
          if (!entry) throw new RangeError(`page 7 line ${i} has no swatch`);
          flood = entry.hex;
        } else {
          flood = hexOfPaint(page.ground as Paint);
        }
        out.push({ where: `page ${page.n} line ${i}`, line, flood });
      });
    }
    return out;
  }

  // The contrast script reads one boundary's pairs; the art mixes modes (a light ink on a palette
  // hex), so the pairs it sets are checked here (review R1-5).
  it("reads every art line at 4.5 or more on the flood it sits on", () => {
    const pairs = linesOnFloods();
    expect(pairs.length).toBeGreaterThan(60);
    for (const { where, line, flood } of pairs) {
      const ratio = contrastRatio(hexOfPaint(line.ink), flood);
      expect(ratio, `${where}: ${hexOfPaint(line.ink)} on ${flood}`).toBeGreaterThanOrEqual(4.5);
      if (line.accent) {
        const accent = contrastRatio(hexOfPaint(line.accent.ink), flood);
        expect(accent, `${where} accent`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("names every paint with a token and a mode", () => {
    const paints: unknown[] = [];
    JSON.stringify([PIECES, BOOK], (_k, v: unknown) => {
      if (typeof v === "object" && v !== null && "token" in v) paints.push(v);
      return v;
    });
    expect(paints.length).toBeGreaterThan(30);
    for (const p of paints) {
      expect(p).toMatchObject({
        token: expect.any(String),
        mode: expect.stringMatching(/^(light|dark)$/),
      });
    }
  });
});

describe("orivilo canvas data, the scene lockups are images of generated files (ORV-308, rows 1 and 3)", () => {
  const scenes = PIECES.flatMap((p) =>
    p.content.kind === "scene" ? [{ id: p.id, ...p.content }] : [],
  );

  it("has a generated lockup for the card and the sign, and no other scene", () => {
    expect(scenes.map((s) => s.id)).toEqual(["card", "sign"]);
    expect(SCENE_LOCKUPS.map((l) => l.id)).toEqual(["card", "sign"]);
  });

  it.each(scenes)(
    "$id: the file, the width, the tone and the mode follow the scene record",
    (scene) => {
      const generated = SCENE_LOCKUPS.find((l) => l.id === scene.id);
      expect(generated, `${scene.id} lockup`).toBeDefined();
      expect(generated?.width).toBeCloseTo(scene.lockup.width * scene.face.w, 9);
      expect(generated?.tone).toBe(scene.lockup.tone);
      expect(generated?.mode).toBe(scene.lockup.mode);
      expect(scene.lockup.file).toBe(`/orv-274/${generated?.path.split("/").pop()}`);
    },
  );

  it.each(scenes)(
    "$id: the committed file is the lockup at the record's size and tone",
    (scene) => {
      const file = resolve(STATIC, scene.lockup.file.replace("/orv-274/", ""));
      expect(existsSync(file)).toBe(true);
      const svg = readFileSync(file, "utf8");
      const width = scene.lockup.width * scene.face.w;
      expect(svg).toMatch(/^<svg [^>]*data-kind="horizontal"/);
      expect(svg).toContain(`data-tone="${scene.lockup.tone}"`);
      expect(Number(/ width="([\d.]+)"/.exec(svg)?.[1])).toBeCloseTo(width, 1);
      expect(Number(/ height="([\d.]+)"/.exec(svg)?.[1])).toBeCloseTo((width * 150) / 663, 1);
      // The colours sit inside the file: an image does not read the page's custom properties.
      expect(svg).toContain("<style>");
      expect(svg).not.toContain("var(--");
    },
  );
});

describe("the In use board and brandbook part 03 (spec ORV-309 rows 11, 12, 13 and 14)", () => {
  const source = readFileSync(resolve(import.meta.dirname, "orivilo-canvas.tsx"), "utf8");
  const between = (from: string, to: string) => {
    const a = source.indexOf(from);
    const b = source.indexOf(to);
    expect(a, from).toBeGreaterThanOrEqual(0);
    expect(b, to).toBeGreaterThan(a);
    return source.slice(a, b);
  };
  // The code of the digital pieces (A, B, C, E), the icon set specimen and page 10's field.
  const pieces = between("const ICON_BY_NAME", "/** A board at 1280 x 800");
  const field = between("/** One live screen of page 10's field", "function Opener(");
  const digital = pieces + field;

  /**
   * Every way a digital piece could show an image of a page or an app, or call a model or an image
   * service: an img tag, a picture tag, an svg image tag, a next/image Image, a CSS url() or
   * backgroundImage, a fetch call, a request object, an OpenRouter name, a new Image().
   */
  const IMAGE_FORMS: [string, RegExp][] = [
    ["img tag", /<img\b/],
    ["picture tag", /<picture\b/],
    ["svg image tag", /<image\b/],
    ["next/image Image", /<Image\b/],
    ["css url()", /\burl\(/],
    ["backgroundImage style", /\bbackground-?[iI]mage\b/],
    ["fetch call", /\bfetch\s*\(/],
    ["XMLHttpRequest", /\bXMLHttpRequest\b/],
    ["openrouter name", /openrouter/i],
    ["new Image()", /\bnew\s+Image\s*\(/],
  ];
  const imageForm = (text: string) => IMAGE_FORMS.filter(([, re]) => re.test(text)).map(([n]) => n);

  it("draws no image of a page or an app and calls no model or image service (canvas-image-1)", () => {
    expect(imageForm(digital)).toEqual([]);
    // Each form is a red sample of the guard.
    const samples: Record<string, string> = {
      "img tag": '<img src="/shot.png" />',
      "picture tag": "<picture><source /></picture>",
      "svg image tag": '<svg><image href="/shot.png" /></svg>',
      "next/image Image": '<Image src="/shot.png" alt="" />',
      "css url()": 'style={{ background: "url(/shot.png)" }}',
      "backgroundImage style": "style={{ backgroundImage: shot }}",
      "fetch call": 'await fetch("/api/image")',
      XMLHttpRequest: "new XMLHttpRequest()",
      "openrouter name": 'const host = "https://openrouter.ai"',
      "new Image()": "const shot = new Image()",
    };
    expect(Object.keys(samples).sort()).toEqual(IMAGE_FORMS.map(([n]) => n).sort());
    for (const [name, sample] of Object.entries(samples)) {
      expect(imageForm(sample), name).toContain(name);
    }
  });

  it("holds no intent button in the window, the icon, the share card, the icon set or the field", () => {
    expect(countIntent(digital)).toBe(0);
    expect(countIntent(source)).toBeLessThanOrEqual(1);
  });

  it("draws no raw radius, shadow, colour or font in the digital pieces (C5)", () => {
    expect(digital).not.toMatch(
      /\bborderRadius\b|\bboxShadow\b|#[0-9a-fA-F]{3,8}\b|rgba?\(|fontFamily/,
    );
    expect(digital).not.toMatch(/rounded-\[|shadow-\[|bg-\[|text-\[|font-\[/);
  });

  it("gives the phones' bodies rounded-overlay and their screens, the icon and the browser rounded-container (C5)", () => {
    const phone = between("function PhonePiece", "function HomeScreenPiece");
    const home = between("function HomeScreenPiece", "function SharePiece");
    const browser = between("function BrowserWindow", "function PhonePiece");
    // The body is the ink flood that is `relative rounded-overlay shadow-overlay`; the screen is
    // the clipped box inside it.
    expect(phone).toMatch(/className="relative rounded-overlay shadow-overlay"/);
    expect(phone).toMatch(/className="absolute overflow-hidden rounded-container"/);
    expect(home).toMatch(/className="absolute rounded-overlay shadow-overlay"/);
    expect(home).toMatch(/className="absolute rounded-container"/);
    expect(home).toMatch(/className="flex items-center justify-center rounded-container"/);
    expect(browser).toMatch(/rounded-container border border-border-subtle bg-surface-sunken/);
    expect(browser).toMatch(/rounded-t-media/);
    expect(browser).toMatch(/rounded-control/);
  });

  it("builds the window from the Studio's own parts: TopNavigation and the live CanvasBoard", () => {
    const browser = between("function BrowserWindow", "function PhonePiece");
    expect(browser).toMatch(/<TopNavigation\b/);
    expect(browser).toMatch(/<CanvasBoard\b/);
    expect(browser).toMatch(/heroGraph\(/);
    expect(browser).toMatch(/heroBody\(/);
    expect(browser).toMatch(/n\.id === "pos"/); // the Positioning node is the selected one
    expect(browser).toMatch(/<Avatar\b/);
    expect(browser).toMatch(/<Logo kind="mark"/);
    expect(browser).toMatch(/<Logo kind="horizontal"/);
  });

  it("shows page 10's landing and the board of the field and the guidebook, in three screens", () => {
    expect(field.match(/<FieldScreen\b/g)).toHaveLength(3);
    expect(field).toMatch(/<OriviloLanding\b/);
    expect(field).toMatch(/<BrowserWindow\b/);
    expect(field).toMatch(/<GuidebookScreen\b/);
  });

  it("keeps the English and Thai In use keys the same, with the lockup and ink tiles' keys gone", () => {
    const keys = (m: typeof en) => Object.keys(m.orvCanvas.use).sort();
    expect(keys(th)).toEqual(keys(en));
    for (const key of [
      "window",
      "windowSub",
      "icon",
      "iconSub",
      "share",
      "shareSub",
      "shareTagline",
      "studioName",
      "grid",
      "icons",
      "iconsNote",
    ]) {
      expect(en.orvCanvas.use, key).toHaveProperty(key);
      expect(th.orvCanvas.use, key).toHaveProperty(key);
    }
    for (const key of ["lockup", "ink", "inkSub", "start"]) {
      expect(en.orvCanvas.use, key).not.toHaveProperty(key);
      expect(th.orvCanvas.use, key).not.toHaveProperty(key);
    }
  });

  it("words the captions and the notes as the design's copy table gives them", () => {
    const e = en.orvCanvas.use;
    const t = th.orvCanvas.use;
    expect([e.window, e.windowSub]).toEqual([
      "The app in a browser",
      "Mockup: the real board screen with ORIVILO's own example board.",
    ]);
    expect([e.icon, e.iconSub]).toEqual(["App icon on a home screen", "Drawn with the real mark."]);
    expect([e.share, e.shareSub]).toEqual(["Link share card", "Drawn from the logo geometry."]);
    expect([e.studioName, e.grid, e.icons, e.iconsNote]).toEqual([
      "Studio",
      "Layout at 390",
      "Icons",
      "Lucide, stroke 2.4 on a 24 grid",
    ]);
    expect([t.window, t.windowSub]).toEqual([
      "แอปในเบราว์เซอร์",
      "ม็อกอัป: หน้ากระดานจริง กับกระดานตัวอย่างของ ORIVILO เอง",
    ]);
    expect([t.icon, t.iconSub]).toEqual(["ไอคอนแอปบนหน้าจอโฮม", "วาดด้วยโลโก้จริง"]);
    expect([t.share, t.shareSub]).toEqual(["การ์ดเมื่อแชร์ลิงก์", "วาดจากโครงสร้างของโลโก้"]);
    expect([t.studioName, t.grid, t.icons, t.iconsNote]).toEqual([
      "สตูดิโอ",
      "เลย์เอาต์ที่ 390",
      "ไอคอน",
      "Lucide เส้นหนา 2.4 บนกริด 24",
    ]);
    for (const line of [...Object.values(e), ...Object.values(t)]) {
      expect(line).not.toContain(MIDDOT);
      expect(line).not.toContain(EM_DASH);
    }
  });

  it("gives every In use piece a caption and a second line that exist in both languages", () => {
    for (const piece of PIECES.filter((p) => p.board === "inUse")) {
      for (const key of [piece.caption, piece.second]) {
        const [, leaf] = key.split(".");
        expect(en.orvCanvas.use, key).toHaveProperty(leaf ?? "");
        expect(th.orvCanvas.use, key).toHaveProperty(leaf ?? "");
      }
    }
  });

  it("keeps the brand's data lines out of the catalog: name, address, clock, browser size", () => {
    expect([BRAND_NAME, ADDRESS, CLOCK]).toEqual(["ORIVILO", "orivilo.vercel.app", "9:41"]);
    expect(BROWSER).toEqual({ w: 1180, h: 600 });
  });
});
