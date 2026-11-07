import { describe, expect, it, vi } from "vitest";
import type { InputEvidence } from "./evidence";
import { EVIDENCE_STRINGS } from "./evidence-strings";
import { PERSONALITY_AXES } from "./knowledge";
import type { ReadResult } from "./read-page";
import { MAX_STYLESHEETS } from "./read-page";
import { reportOf, reportSchema, type Report } from "./report";
import { REPORT_VIEW_CAPS, toReportView, type ReportView } from "./report-view";

// ORV-266 tech notes section 9, tests V1 to V4 (task B4). The pages are recorded in this file and
// analysed by the real analyser; the worst case view is built by hand. Nothing here reads a network.

declare class TextEncoder {
  encode(input: string): Uint8Array; // module-scoped: the engine tsconfig has no DOM lib
}
const enc = new TextEncoder();
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
const SHEET_URL = "https://clinic.example/a.css";
const NOW = "2026-11-07T08:00:00.000Z";
const CTX = { role: "own", retrievedAt: NOW } as const;

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

/** The view of a read through the real analyser and `reportOf`, option D (no render). */
function viewOf(read: Read): { report: Extract<Report, { status: "analysed" }>; view: ReportView } {
  const built = reportOf(PAGE_URL, read, null, { ...CTX, notRendered: "no-renderer" });
  if (!built.ok || built.report.status !== "analysed") throw new Error("no analysed report");
  return { report: built.report, view: toReportView(built.report, CTX) };
}
function analysedView(view: ReportView) {
  if (view.status !== "analysed") throw new Error("not analysed");
  return view;
}

const CSS_A =
  'a{color:#FF7A00;font-family:"Inter",sans-serif}b{color:rgb(255, 122, 0)}c{color:#0000ff}';
const HEAD_A =
  '<!doctype html><html lang="en"><head><title>Bright Clinic</title>' +
  '<meta name="description" content="Warm care for families">' +
  '<link rel="stylesheet" href="/a.css"></head><body>';
const HTML_A =
  HEAD_A +
  "<h1>premium and calm</h1><h2>ไม่หรูหรา</h2><h2>not too premium</h2>" +
  "<p>Opening hours are every day of the week, with walk in visits and check ups for the whole family at the clinic near the market.</p>" +
  "</body></html>";
const READ_A = readOf(HTML_A, [[SHEET_URL, CSS_A]]);

const twenty = (lead: string) => `${lead} ${Array(20).fill("word").join(" ")}`;
/** Two body blocks of 20 words or more, one holding `premium` and one holding `not too premium`. */
const HTML_P =
  HEAD_A +
  "<h1>premium and calm</h1>" +
  `<p>${twenty("A premium finish for every family")}</p>` +
  `<p>${twenty("It feels not too premium to us")}</p>` +
  "</body></html>";

// ---------------------------------------------------------------- the worst case Report, by hand

const LONG_URL = (i: number) =>
  `https://s${i}.example/${"p".repeat(2048 - `https://s${i}.example/`.length)}`;
const PAGE_LONG = LONG_URL(99);
const QUOTE = "ก".repeat(300);
const PATH = `html>body>${"p>".repeat(249)}x`.slice(0, 500);

function item(
  n: number,
  over: {
    ref?: string;
    kind: InputEvidence["observation"]["kind"];
    subject: string;
    locator: InputEvidence["source"]["locator"];
    quote?: string;
    measure?: InputEvidence["measure"];
    reading?: InputEvidence["reading"];
    belowFloor?: boolean;
    hypothesis?: boolean;
    flags?: InputEvidence["flags"];
    retrievedAt?: string;
  },
): InputEvidence {
  return {
    schemaVersion: "1.0",
    id: n.toString(16).padStart(8, "0"),
    analyser: { id: "website-url", version: "1" },
    inputKind: "website-url",
    role: "own",
    source: {
      ref: over.ref ?? PAGE_LONG,
      locator: over.locator,
      contentHash: "0".repeat(64),
      retrievedAt: over.retrievedAt ?? NOW,
      renderer: null,
    },
    observation: {
      kind: over.kind,
      subject: over.subject,
      ...(over.quote === undefined ? {} : { quote: over.quote }),
    },
    measure: over.measure ?? null,
    reading: over.reading ?? null,
    confidence: {
      value: 0.7,
      base: { id: "rule-reading", value: 0.7 },
      factors: [],
    },
    belowFloor: over.belowFloor ?? false,
    fromModel: false,
    model: null,
    basedOn: [],
    ownedBy: "self",
    origin: "input",
    flags: over.flags ?? [],
    hypothesis: over.hypothesis ?? false,
    hypothesisNote: over.hypothesis ? "English engine text" : null,
  };
}

/** 10 sheets, 64 colours and 16 fonts on every sheet, 14 leans and 14 readings below the floor per axis, up to 5,000 items. */
function worstReport(distinct: boolean): Extract<Report, { status: "analysed" }> {
  const items: InputEvidence[] = [];
  let n = 0;
  for (let s = 0; s < MAX_STYLESHEETS; s++) {
    for (let c = 0; c < 64; c++) {
      const hex = (distinct ? s * 64 + c : c).toString(16).padStart(6, "0");
      items.push(
        item(n++, {
          ref: LONG_URL(s),
          kind: "colour-declared",
          subject: hex,
          locator: { kind: "element", path: `sheet:${9_000_000 + c}` },
          measure: { metric: "hue-family", value: "orange", unit: "band" },
        }),
      );
    }
    for (let f = 0; f < 16; f++) {
      const name = `declared.font-${distinct ? s * 16 + f : f}`;
      items.push(
        item(n++, {
          ref: LONG_URL(s),
          kind: "font-family",
          subject: name,
          locator: { kind: "element", path: `sheet:${9_000_000 + f}` },
        }),
      );
    }
  }
  const personality = PERSONALITY_AXES.map((axis) => {
    const leans: { lean: "high" | "low"; evidenceId: string; confidence: number }[] = [];
    for (const belowFloor of [false, true]) {
      for (let k = 0; k < 14; k++) {
        const id = n++;
        items.push(
          item(id, {
            kind: "personality-signal",
            subject: axis,
            quote: QUOTE,
            locator: { kind: "text", path: PATH, start: 0, end: 5 },
            reading: {
              target: `identity-frame.personality.${axis}`,
              value: { lean: "high" },
              by: "rule",
              rules: ["lexicon-1", "value-to-lean-1", "measure-to-lean-1", "tsic-terms-1"],
            },
            belowFloor,
            hypothesis: true,
            flags: [{ key: "quality.fewWords" }, { key: "quality.pageIncomplete" }],
          }),
        );
        if (!belowFloor) {
          leans.push({
            lean: "high",
            evidenceId: id.toString(16).padStart(8, "0"),
            confidence: 0.7,
          });
        }
      }
    }
    return { axis, leans };
  });
  while (items.length < 5000) {
    items.push(
      item(n++, {
        kind: "text-span",
        subject: "body",
        locator: { kind: "text", path: PATH, start: 0, end: 5 },
        measure: { metric: "word-count", value: 7, unit: "words" },
      }),
    );
  }
  return {
    version: "1.0",
    status: "analysed",
    url: PAGE_LONG,
    renderer: null,
    evidence: items,
    notMeasured: [
      { what: "colour-area", reason: "no-renderer" },
      { what: "contrast-pair", reason: "no-renderer" },
      { what: "density", reason: "no-renderer" },
      { what: "text-visibility", reason: "no-renderer" },
    ],
    personality,
    lines: ["report.conflictsNotChecked"],
  };
}

const bytesOf = (view: ReportView): number => enc.encode(JSON.stringify(view)).length;
const LIMIT = 256 * 1024;

describe("V1: a worst case report gives a view under 256 KB", () => {
  for (const distinct of [false, true]) {
    it(`${distinct ? "640 distinct colours" : "64 colours shared by 10 sheets"}, totals right`, () => {
      const report = worstReport(distinct);
      expect(report.evidence).toHaveLength(5000);
      const view = analysedView(toReportView(report, CTX));
      expect(bytesOf(view)).toBeLessThan(LIMIT);
      // distinct: the 64 kept colours and 16 kept fonts all come from the first sheet, so only it is listed
      expect(view.sheets).toHaveLength(distinct ? 1 : MAX_STYLESHEETS);
      expect(view.colours).toHaveLength(64);
      expect(view.coloursTotal).toBe(distinct ? 640 : 64);
      expect(view.fonts).toHaveLength(16);
      expect(view.fontsTotal).toBe(distinct ? 160 : 16);
      expect(view.personality).toHaveLength(5);
      for (const axis of view.personality) {
        expect(axis.leans).toHaveLength(6);
        expect(axis.leansTotal).toBe(14);
        expect(axis.belowFloor).toHaveLength(6);
        expect(axis.belowFloorTotal).toBe(14);
      }
      if (!distinct) {
        expect(view.colours.every((c) => c.at.length === 10)).toBe(true);
        expect(view.fonts.every((f) => f.at.length === 10)).toBe(true);
      }
    });
  }

  it("pins the caps of report-list-1", () => {
    expect(REPORT_VIEW_CAPS).toEqual({ colours: 64, fonts: 16, leans: 6, belowFloor: 6 });
  });

  it("lists at most MAX_STYLESHEETS stylesheets and drops the sources past them", () => {
    const base = worstReport(false);
    const extra = item(900_000, {
      ref: LONG_URL(10),
      kind: "colour-declared",
      subject: "000000",
      locator: { kind: "element", path: "sheet:5" },
      measure: { metric: "hue-family", value: "ink", unit: "band" },
    });
    const view = analysedView(toReportView({ ...base, evidence: [...base.evidence, extra] }, CTX));
    expect(MAX_STYLESHEETS).toBe(10);
    expect(view.sheets).toHaveLength(10);
    expect(view.sheets).not.toContain(LONG_URL(10));
    expect(view.colours.find((c) => c.hex === "#000000")?.at).toEqual([
      { sheet: 0, offset: 9_000_000 },
      { sheet: 1, offset: 9_000_000 },
      { sheet: 2, offset: 9_000_000 },
      { sheet: 3, offset: 9_000_000 },
      { sheet: 4, offset: 9_000_000 },
      { sheet: 5, offset: 9_000_000 },
      { sheet: 6, offset: 9_000_000 },
      { sheet: 7, offset: 9_000_000 },
      { sheet: 8, offset: 9_000_000 },
      { sheet: 9, offset: 9_000_000 },
    ]);
  });

  it("holds each stylesheet URL once and no URL on a source line", () => {
    const view = analysedView(toReportView(worstReport(false), CTX));
    const json = JSON.stringify(view);
    for (let s = 0; s < MAX_STYLESHEETS; s++) expect(json.split(LONG_URL(s))).toHaveLength(2);
    expect(json.split(PAGE_LONG)).toHaveLength(2); // the page's url, once
  });
});

describe("V2: keys and values, no resolved text", () => {
  const { report, view } = viewOf(readOf(HTML_P, [[SHEET_URL, CSS_A]]));
  const v = analysedView(view);

  it("holds all four not-measured entries as keys", () => {
    expect(v.notMeasured).toEqual([
      {
        line: "read.notMeasured",
        what: "read.notMeasured.what.colourArea",
        reason: "read.notRendered.none",
      },
      {
        line: "read.notMeasured",
        what: "read.notMeasured.what.contrast",
        reason: "read.notRendered.none",
      },
      {
        line: "read.notMeasured",
        what: "read.notMeasured.what.density",
        reason: "read.notRendered.none",
      },
      {
        line: "read.notMeasured",
        what: "read.notMeasured.what.textVisibility",
        reason: "read.notRendered.none",
      },
    ]);
    expect(v.lines).toEqual(["report.conflictsNotChecked"]);
  });

  it("carries no word of EVIDENCE_STRINGS and no hypothesisNote text", () => {
    const json = JSON.stringify(v);
    for (const { th, en } of Object.values(EVIDENCE_STRINGS)) {
      expect(json).not.toContain(th);
      expect(json).not.toContain(en);
    }
    const notes = report.evidence.flatMap((i) =>
      i.hypothesisNote === null ? [] : [i.hypothesisNote],
    );
    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) expect(json).not.toContain(note);
  });

  it("maps a no-flat-pair reason to its own line with no reason key", () => {
    const view = analysedView(
      toReportView(
        { ...report, notMeasured: [{ what: "contrast-pair", reason: "no-flat-pair" }] },
        CTX,
      ),
    );
    expect(view.notMeasured).toEqual([
      {
        line: "read.notMeasured.noFlatPair",
        what: "read.notMeasured.what.contrast",
        reason: null,
      },
    ]);
  });
});

describe("V3: every value carries its source", () => {
  const A = viewOf(READ_A);
  const a = analysedView(A.view);

  it("lists the colours and fonts of CSS_A, each at its stylesheet and offset", () => {
    expect(a.sheets).toEqual([SHEET_URL]);
    expect(a.colours.map((c) => [c.hex, c.band])).toEqual([
      ["#FF7A00", "orange"],
      ["#0000FF", "violet"],
    ]);
    expect(a.fonts.map((f) => f.name)).toEqual(["inter"]);
    expect(a.coloursTotal).toBe(2);
    expect(a.fontsTotal).toBe(1);
    const offsetOf = (i: InputEvidence) =>
      i.source.locator.kind === "element"
        ? Number(i.source.locator.path.slice("sheet:".length))
        : -1;
    for (const c of a.colours) {
      const items = A.report.evidence.filter(
        (i) =>
          i.observation.kind === "colour-declared" &&
          `#${i.observation.subject.toUpperCase()}` === c.hex,
      );
      expect(items.length).toBeGreaterThan(0);
      expect(c.at).toEqual(
        items.map((i) => ({ sheet: a.sheets.indexOf(i.source.ref), offset: offsetOf(i) })),
      );
    }
    const inter = A.report.evidence.filter((i) => i.observation.subject === "declared.inter");
    expect(a.fonts[0]?.at).toEqual(
      inter.map((i) => ({ sheet: a.sheets.indexOf(i.source.ref), offset: offsetOf(i) })),
    );
  });

  it("reads each lean and below-floor reading from its item, and the page url is its source.ref", () => {
    const { report, view } = viewOf(readOf(HTML_P, [[SHEET_URL, CSS_A]]));
    const v = analysedView(view);
    const premium = v.personality.find((p) => p.axis === "premium");
    expect(premium?.leans.map((l) => l.level).sort()).toEqual(["high", "low"]);
    for (const axis of v.personality) {
      for (const r of [...axis.leans, ...axis.belowFloor]) {
        const it = report.evidence.find((i) => i.id === r.evidenceId);
        expect(it).toBeDefined();
        expect(it?.source.ref).toBe(v.url);
        expect(r.quote).toBe(it?.observation.quote ?? null);
        expect(r.path).toBe(it?.source.locator.kind === "text" ? it.source.locator.path : null);
        expect(r.rules).toEqual(it?.reading?.by === "rule" ? it.reading.rules : []);
        expect(r.confidence).toBe(it?.confidence.value);
        expect(r.hypothesis).toBe(it?.hypothesis);
        expect(r.reasons).toEqual(
          it?.flags.map((f) => f.key).filter((k) => k.startsWith("quality.")),
        );
      }
    }
    const hypotheses = premium?.leans.filter((l) => l.hypothesis) ?? [];
    expect(hypotheses).toHaveLength(1);
    expect(hypotheses[0]?.level).toBe("low");
    expect(hypotheses[0]?.quote).toContain("premium");
  });

  it("never counts a below-floor item as a lean", () => {
    // HTML_A's readings all rest on blocks of under 20 words, so they are below the floor.
    const premium = a.personality.find((p) => p.axis === "premium");
    expect(a.personality.map((p) => p.axis)).toEqual([...PERSONALITY_AXES]);
    expect(premium?.leans).toEqual([]);
    expect(premium?.leansTotal).toBe(0);
    expect(premium?.belowFloorTotal).toBeGreaterThan(0);
    expect(premium?.belowFloor.every((r) => r.reasons.includes("quality.fewWords"))).toBe(true);
    const leanIds = new Set(A.report.personality.flatMap((p) => p.leans.map((l) => l.evidenceId)));
    for (const p of a.personality) {
      for (const r of p.belowFloor) expect(leanIds.has(r.evidenceId)).toBe(false);
    }
  });

  it("takes role and readAt from ctx when the report has no items, and the earliest retrievedAt otherwise", () => {
    const empty: Report = {
      version: "1.0",
      status: "analysed",
      url: PAGE_URL,
      renderer: null,
      evidence: [],
      notMeasured: [],
      personality: PERSONALITY_AXES.map((axis) => ({ axis, leans: [] })),
      lines: ["report.conflictsNotChecked"],
    };
    const view = analysedView(
      toReportView(empty, { role: "reference", retrievedAt: "2026-11-07T09:00:00.000Z" }),
    );
    expect(view.role).toBe("reference");
    expect(view.readAt).toBe("2026-11-07T09:00:00.000Z");
    expect(view.colours).toEqual([]);
    expect(view.text).toEqual([]);

    const first = item(1, {
      kind: "text-span",
      subject: "body",
      locator: { kind: "text", path: "p", start: 0, end: 1 },
      retrievedAt: "2026-11-07T07:00:00.000Z",
    });
    const second = item(2, {
      kind: "text-span",
      subject: "body",
      locator: { kind: "text", path: "q", start: 0, end: 1 },
      retrievedAt: "2026-11-07T07:30:00.000Z",
    });
    const mixed = analysedView(
      toReportView(
        { ...empty, evidence: [second, first] },
        { role: "reference", retrievedAt: NOW },
      ),
    );
    expect(mixed.readAt).toBe("2026-11-07T07:00:00.000Z");
    expect(mixed.role).toBe("reference");
  });

  it("sets incomplete from the quality flag and lists the text lines in the order title, meta, heading, body", () => {
    expect(a.incomplete).toBe(false);
    expect(a.text.map((t) => t.kind)).toEqual(["title", "meta", "heading", "body"]);
    expect(a.text.find((t) => t.kind === "heading")?.blocks).toBe(3);
    const incomplete = analysedView(
      viewOf(readOf(HTML_A, [[SHEET_URL, CSS_A]], ["page-incomplete"])).view,
    );
    expect(incomplete.incomplete).toBe(true);
  });

  it("lists only declared colours and fonts, never a render's", () => {
    const empty = worstReport(false);
    const declared = item(1, {
      ref: SHEET_URL,
      kind: "colour-declared",
      subject: "ff0000",
      locator: { kind: "element", path: "sheet:3" },
      measure: { metric: "hue-family", value: "red", unit: "band" },
    });
    const area = item(2, {
      kind: "colour-area",
      subject: "00ff00",
      locator: { kind: "surface", scope: "first-screen" },
      measure: { metric: "hue-family", value: "green", unit: "band" },
    });
    const rendered = item(3, {
      kind: "font-family",
      subject: "body.ibm-plex",
      locator: { kind: "element", path: "html>body>p" },
    });
    const view = analysedView(
      toReportView(
        {
          ...empty,
          evidence: [declared, area, rendered],
          personality: empty.personality.map((p) => ({ ...p, leans: [] })),
        },
        CTX,
      ),
    );
    expect(view.colours).toEqual([{ hex: "#FF0000", band: "red", at: [{ sheet: 0, offset: 3 }] }]);
    expect(view.fonts).toEqual([]);
    expect(view.sheets).toEqual([SHEET_URL]);
  });

  it("sums the word counts of each text kind", () => {
    for (const t of a.text) {
      const spans = A.report.evidence.filter(
        (i) => i.observation.kind === "text-span" && i.observation.subject === t.kind,
      );
      expect(t.blocks).toBe(spans.length);
      expect(t.words).toBe(
        spans.reduce((n, i) => n + (typeof i.measure?.value === "number" ? i.measure.value : 0), 0),
      );
      expect(t.words).toBeGreaterThan(0);
    }
    expect(a.text.find((t) => t.kind === "title")?.words).toBe(2);
    expect(a.text.find((t) => t.kind === "meta")?.words).toBe(4);
  });

  it("keeps a not-read and a refused report as they are", () => {
    const notRead = toReportView(
      {
        version: "1.0",
        status: "not-read",
        url: "https://rival.example/",
        line: "read.notRead.competitor",
      },
      { role: "competitor", retrievedAt: NOW },
    );
    expect(notRead).toEqual({
      status: "not-read",
      url: "https://rival.example/",
      line: "read.notRead.competitor",
    });
    for (const urlCut of [false, true]) {
      const refused = reportSchema.parse({
        version: "1.0",
        status: "refused",
        url: "http://127.0.0.1/",
        urlCut,
        key: "read.refused.address",
        line: "read.refused.address",
      });
      expect(toReportView(refused, CTX)).toEqual({
        status: "refused",
        url: "http://127.0.0.1/",
        urlCut,
        line: "read.refused.address",
      });
    }
  });

  it("caps the colours at 64 with the total of all, from 300 distinct colours (row 31)", () => {
    const css = Array.from(
      { length: 300 },
      (_, i) => `a${i}{color:#${(i + 1).toString(16).padStart(6, "0")}}`,
    ).join("");
    const view = analysedView(viewOf(readOf(HTML_A, [[SHEET_URL, css]])).view);
    expect(view.colours).toHaveLength(64);
    expect(view.coloursTotal).toBe(256); // the analyser's own cap per sheet
    expect(bytesOf(view)).toBeLessThan(LIMIT);
  });
});

describe("V4: thin-page-1", () => {
  const page = (body: string) =>
    `<html><head><title>Calm clinic</title><meta name="description" content="Warm care for families"></head><body>${body}</body></html>`;
  const words = (n: number) => Array(n).fill("word").join(" ");
  const thinOf = (html: string) => analysedView(viewOf(readOf(html)).view).thin;

  it("HTML_B is thin (9 words)", () => {
    expect(
      thinOf(
        "<html><head><title>Calm clinic</title></head><body><p>Premium care for every family, open all week long.</p></body></html>",
      ),
    ).toBe(true);
  });
  it("19 words of heading and body are thin", () => {
    expect(thinOf(page(`<h1>${words(9)}</h1><p>${words(10)}</p>`))).toBe(true);
  });
  it("20 words of heading and body are not thin", () => {
    expect(thinOf(page(`<h1>${words(10)}</h1><p>${words(10)}</p>`))).toBe(false);
  });
  it("a page with only a title and a meta description is thin, however long they are", () => {
    expect(
      thinOf(
        `<html><head><title>${words(30)}</title><meta name="description" content="${words(30)}"></head><body></body></html>`,
      ),
    ).toBe(true);
  });
});
