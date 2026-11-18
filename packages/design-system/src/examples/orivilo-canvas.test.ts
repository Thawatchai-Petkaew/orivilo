import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { Graph } from "../components/canvas-board/graph";
import { contrastRatio } from "../foundations/contrast";
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
  IMAGES,
  NODES,
  PALETTE,
  PIECES,
  SEQUENCES,
  SHEETS,
  type Box,
  type Pt,
  type Quad,
  cellBox,
  coverCrop,
  homography,
  placeOnQuad,
  quadInTile,
  textOf,
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
    const lines =
      p.content.kind === "type" || p.content.kind === "lines" || p.content.kind === "ink"
        ? p.content.lines
        : [];
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

  it("has 40 edges: 29 input, 8 reference, 3 derived, and only edge 18 shows its label", () => {
    expect(EDGES).toHaveLength(40);
    expect(tally(EDGES, (e) => e.meaning)).toEqual({ input: 29, reference: 8, derived: 3 });
    expect(EDGES.map((e) => e.n)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    expect(EDGES.filter((e) => e.label !== false).map((e) => e.n)).toEqual([18]);
    expect(EDGES.filter((e) => e.label === false)).toHaveLength(39);
  });

  it("has 12 nodes with open and 7 sequences of 6, 3, 2, 6, 8, 12 and 3 pages", () => {
    expect(NODES.filter((n) => n.open)).toHaveLength(12);
    expect(SEQUENCES.map((s) => s.id)).toEqual([
      "direction",
      "logo",
      "type",
      "palette",
      "inUse",
      "book",
      "pages",
    ]);
    expect(SEQUENCES.map((s) => s.pages.length)).toEqual([6, 3, 2, 6, 8, 12, 3]);
    expect(SEQUENCES.reduce((sum, s) => sum + s.pages.length, 0)).toBe(40);
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

  it("fits the world in 4640 x 2260", () => {
    for (const n of NODES) {
      expect(n.x, n.id).toBeGreaterThanOrEqual(0);
      expect(n.y, n.id).toBeGreaterThanOrEqual(0);
      expect(n.x + n.width, n.id).toBeLessThanOrEqual(4640);
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

  it("builds the sheets and frames the design lists", () => {
    expect(SHEETS.base.map((r) => r.id)).toEqual(["button", "badge", "field", "radio", "alert"]);
    expect(SHEETS.composed.map((r) => r.id)).toEqual([
      "card",
      "header",
      "form",
      "section",
      "notice",
    ]);
    expect(FRAMES.map((f) => [f.id, f.width, f.height, f.start])).toEqual([
      ["landing", 1280, 290, 0],
      ["form", 800, 270, 48],
      ["report", 800, 420, "report"],
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

describe("graphOf (spec row 19)", () => {
  it("runs twice with deep-equal results, in both languages", () => {
    for (const m of [th, en]) expect(graphOf(m)).toEqual(graphOf(m));
    const graph = graphOf(th) satisfies Graph;
    expect(graph.nodes).toHaveLength(31);
    expect(graph.edges).toHaveLength(40);
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
    expect(board?.position).toEqual({ x: 724, y: 572 });
    expect(g.nodes.find((n) => n.id === "c-demo")?.data.source).toBeUndefined();
    const pat = g.nodes.find((n) => n.id === "p-pat");
    expect(pat?.data.inputs?.map((p) => p.row)).toEqual([
      "form",
      "form",
      "form",
      "notice",
      "notice",
    ]);
    expect(pat?.data.outputs?.map((p) => p.row)).toEqual([
      "card",
      "header",
      "form",
      "section",
      "notice",
    ]);
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
    expect(g.edges.filter((e) => e.data?.label === false)).toHaveLength(39);
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
    expect(BOARDS.inUse.pieces).toEqual(["hero", "icon", "lockup", "phone", "ink", "card", "sign"]);
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
    for (const a of list) {
      for (const b of list) {
        if (a === b) continue;
        const apart =
          a.box.x + a.box.w + 12 <= b.box.x ||
          b.box.x + b.box.w + 12 <= a.box.x ||
          a.box.y + a.box.h + 12 <= b.box.y ||
          b.box.y + b.box.h + 12 <= a.box.y;
        expect(apart, `${a.piece} and ${b.piece}`).toBe(true);
      }
    }
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
    for (const page of BOOK) if (page.art?.kind === "photo") used.add(page.art.image);
    for (const n of NODES) if (n.body.kind === "demo") used.add(n.body.image);
    expect([...used].sort()).toEqual([...ids].sort());
  });
});

describe("orivilo canvas data, quad helper (spec row 40)", () => {
  const card = IMAGES.find((i) => i.id === "scene-card");
  const sign = IMAGES.find((i) => i.id === "scene-sign");
  const IMG = { w: 1254, h: 1254 };
  const CELL = { w: 246.4, h: 776 / 3 };
  const PAGE = { w: 430, h: 313 };
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
      [card.quad, PAGE, [93.31, 112.21, 312.61, 78.24, 338.41, 205.95, 117.82, 234.76]],
      [sign.quad, PAGE, [71.81, 80.39, 356.04, 45.13, 356.04, 247.66, 71.81, 220.14]],
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
      if (c.kind !== "type" && c.kind !== "lines" && c.kind !== "ink") continue;
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
