// The URL analyser of ORV-128 tech notes sections 7 and 8 (slice 1c): `readUrlInput`, the gate in
// front of `readPage` that enforces rule `competitor-not-read-1`, and `analyseUrl`, which turns a safe
// read and an untrusted render snapshot, or none, into sorted evidence items. Pure: no I/O, no clock,
// no random source, no model (row 30). Bytes, the snapshot, the clock reading and the port answers
// come in as arguments.

import { z } from "zod";
import { classifyHex } from "./color-audit";
import { scoreConfidence, type BaseId, type FactorId } from "./confidence";
import {
  EVIDENCE_SCHEMA_VERSION,
  INPUT_ROLES,
  URL_MAX_CHARS,
  compareEvidence,
  evidenceId,
  type InputEvidence,
  type InputRole,
} from "./evidence";
import { BRIEF_MAX_LENGTH, interpretWithRules } from "./interpreter";
import { PERSONALITY_AXES } from "./knowledge";
import { leanOfValue, leansOfMeasures, type RuleValue } from "./leans";
import { pageTextAndPathsOf, wordCount, type TextBlock } from "./page-text";
import { readPage, type ReadPorts, type ReadResult, type RobotsCache } from "./read-page";
import { renderSnapshotSchema, type RenderSnapshot, type RendererBuild } from "./render-snapshot";
import { colourAreasOf, declaredColoursOf, paletteOf } from "./measures/colour";
import {
  bodyPairOf,
  declaredFamiliesOf,
  familySubject,
  meetsFirstScreen,
  textDensity,
} from "./measures/page";

// The engine's tsconfig has no DOM or Node lib, so the one global this file uses is declared here,
// module-scoped, with only the member it reads. It exists in every runtime the engine runs in.
declare class TextDecoder {
  decode(input: Uint8Array): string;
}

/** `analyser.version` of every item: a change to `html-text-1` or to a rule of this file bumps it. */
const ANALYSER_VERSION = "1";

// ---------------------------------------------------------------- the competitor gate

export type UrlInput = { url: string; role: InputRole };
export type NotRead = {
  status: "not-read";
  /** As given, at most URL_MAX_CHARS characters, never fetched; a longer competitor URL is refused (F59). */
  url: string;
  line: "read.notRead.competitor";
};

/**
 * competitor-not-read-1, an allow-list (F54): the only engine export that reaches `readPage`, and
 * only for `own` and `reference`. A `competitor` URL is not read and no port is called for it; a
 * value outside INPUT_ROLES is a bug in the caller and throws. A competitor URL over URL_MAX_CHARS
 * is refused as `readPage` refuses an own URL over it, so no URL is recorded in part (F59).
 */
export async function readUrlInput(
  input: UrlInput,
  ports: ReadPorts,
  robots?: RobotsCache,
): Promise<ReadResult | NotRead> {
  const role: unknown = input.role;
  if (!INPUT_ROLES.some((r) => r === role)) {
    throw new TypeError("readUrlInput: input.role is not one of INPUT_ROLES");
  }
  if (role === "competitor") {
    if (input.url.length > URL_MAX_CHARS) {
      return { status: "refused", reason: "read.refused.address" };
    }
    return { status: "not-read", url: input.url, line: "read.notRead.competitor" };
  }
  return readPage(input.url, ports, robots);
}

// ---------------------------------------------------------------- what was not measured

export const notMeasuredSchema = z
  .object({
    what: z.enum(["colour-area", "contrast-pair", "density", "text-visibility"]),
    reason: z.enum([
      "no-renderer",
      "render-failed",
      "render-budget",
      "snapshot-invalid",
      "no-flat-pair", // a valid render with no flat body pair; only with what contrast-pair (F51)
    ]),
  })
  .strict();
export type NotMeasured = z.infer<typeof notMeasuredSchema>;

/** What the caller knows and the bytes do not. Trusted caller data, checked when analyseUrl starts (F48). */
export type AnalyserContext = {
  /** The person's role for the URL, as given; checked against INPUT_ROLES (F54). Every item's `role`. */
  role: InputRole;
  /** The read's clock reading, as `z.iso.datetime()` takes it. Every item's `source.retrievedAt`. */
  retrievedAt: string;
  /** Why `snapshot` is null; null when a snapshot is passed. */
  notRendered: "no-renderer" | "render-failed" | "render-budget" | null;
};

export type Analysis =
  | {
      ok: true;
      evidence: InputEvidence[];
      renderer: RendererBuild | null;
      notMeasured: NotMeasured[];
      /** Null under option D (F49); with a valid snapshot, the text boxes whose path names no element. */
      snapshot: { unmatchedPaths: number } | null;
    }
  | { ok: false; error: "id-collision"; ids: string[] }
  | { ok: false; error: "competitor-not-read" };

/** Checks the caller's context; a wrong one is a bug in the caller, never page data (F48, F54, F57). */
function checkContext(ctx: AnalyserContext, snapshot: unknown): void {
  const role: unknown = ctx.role;
  if (!INPUT_ROLES.some((r) => r === role)) {
    throw new TypeError("analyseUrl: ctx.role is not one of INPUT_ROLES");
  }
  if (!z.iso.datetime().safeParse(ctx.retrievedAt).success) {
    throw new TypeError("analyseUrl: ctx.retrievedAt is not an ISO date-time");
  }
  if ((ctx.notRendered === null) !== (snapshot !== null)) {
    throw new TypeError("analyseUrl: ctx.notRendered must be set exactly when snapshot is null");
  }
}

// ---------------------------------------------------------------- items

type Locator = InputEvidence["source"]["locator"];
type Measure = NonNullable<InputEvidence["measure"]>;
type Reading = NonNullable<InputEvidence["reading"]>;

/** What differs between two items; everything else is the analyser's. */
type Draft = {
  ref: string;
  contentHash: string;
  locator: Locator;
  renderer: RendererBuild | null;
  kind: InputEvidence["observation"]["kind"];
  subject: string;
  quote?: string;
  measure: Measure | null;
  reading: Reading | null;
  factors: FactorId[];
  basedOn?: string[];
  hypothesisNote?: string | null;
};

const FACTOR_FLAGS: Partial<Record<FactorId, InputEvidence["flags"][number]["key"]>> = {
  "few-words": "quality.fewWords",
  "page-incomplete": "quality.pageIncomplete",
};

const hueMeasure = (hex: string): Measure => ({
  metric: "hue-family",
  value: classifyHex(`#${hex}`),
  unit: "band",
});

const sheetLocator = (offset: number): Locator => ({ kind: "element", path: `sheet:${offset}` });

/** The path `elementLocator` of a block or an element. */
const elementLocator = (path: string): Locator => ({ kind: "element", path });

export function analyseUrl(
  read: ReadResult & { status: "read" },
  snapshot: unknown | null,
  ctx: AnalyserContext,
): Analysis {
  checkContext(ctx, snapshot);
  if (ctx.role === "competitor") return { ok: false, error: "competitor-not-read" };

  // The snapshot is untrusted data: a snapshot that fails its schema is a failed render, and nothing is repaired.
  let valid: RenderSnapshot | null = null;
  if (snapshot !== null) {
    const parsed = renderSnapshotSchema.safeParse(snapshot);
    if (parsed.success) valid = parsed.data;
  }
  // checkContext made notRendered null exactly when a snapshot came, so this is the caller's reason or snapshot-invalid.
  const notRenderedReason = ctx.notRendered ?? "snapshot-invalid";
  const renderer = valid?.renderer ?? null;

  const textBoxes = new Map((valid?.textBoxes ?? []).map((t) => [t.path, t]));
  const { text, unmatchedPaths } = pageTextAndPathsOf(read.document.bytes, [...textBoxes.keys()]);

  const pageIncomplete = read.incomplete.length > 0 || text.incomplete;
  const drafts: Draft[] = [];
  const page = { ref: read.url, contentHash: read.document.contentHash };

  // ------------------------------------------------ declared colours and, under option D, declared fonts
  for (const sheet of read.stylesheets) {
    const css = new TextDecoder().decode(sheet.bytes);
    for (const c of declaredColoursOf(css)) {
      drafts.push({
        ref: sheet.url,
        contentHash: sheet.contentHash,
        locator: sheetLocator(c.offset),
        renderer: null,
        kind: "colour-declared",
        subject: c.hex,
        measure: hueMeasure(c.hex),
        reading: null,
        factors: [],
      });
    }
    if (valid === null) {
      const seen = new Set<string>();
      for (const f of declaredFamiliesOf(css)) {
        const subject = familySubject("declared", f.family);
        if (subject === null || seen.has(subject)) continue;
        seen.add(subject);
        drafts.push({
          ref: sheet.url,
          contentHash: sheet.contentHash,
          locator: sheetLocator(f.offset),
          renderer: null,
          kind: "font-family",
          subject,
          measure: null,
          reading: null,
          factors: [],
        });
      }
    }
  }

  // ------------------------------------------------ the page text: kept blocks
  const nonEmpty = (b: { width: number; height: number }) => b.width > 0 && b.height > 0;
  /** With a render a heading or body block is kept only when it has a non-empty box; the title and meta always are. */
  const kept: TextBlock[] = text.blocks.filter(
    (b) =>
      valid === null ||
      b.kind === "title" ||
      b.kind === "meta" ||
      nonEmpty(textBoxes.get(b.path)?.box ?? { width: 0, height: 0 }),
  );
  const keptBody = kept.filter((b) => b.kind === "body");
  const keptHeadings = kept.filter((b) => b.kind === "heading");

  // ------------------------------------------------ measures of the render
  const notMeasured: NotMeasured[] = [];
  const renderDrafts: Draft[] = [];
  if (valid !== null) {
    for (const [scope, raster] of [
      ["first-screen", valid.firstScreen],
      ["full-page", valid.fullPage],
    ] as const) {
      for (const area of colourAreasOf(raster.rgba)) {
        const base = {
          ...page,
          locator: { kind: "surface", scope } as const,
          renderer,
          kind: "colour-area" as const,
          subject: area.hex,
          reading: null,
          factors: [],
        };
        renderDrafts.push(
          { ...base, measure: { metric: "area-share", value: area.share, unit: "ratio" } },
          { ...base, measure: { metric: "hue-family", value: area.band, unit: "band" } },
          { ...base, measure: { metric: "lightness", value: area.lightness, unit: "oklch-l" } },
          { ...base, measure: { metric: "chroma", value: area.chroma, unit: "oklch-c" } },
        );
      }
    }
    const firstAreas = colourAreasOf(valid.firstScreen.rgba);
    if (firstAreas.length > 0) {
      const palette = paletteOf(firstAreas);
      const base = {
        ...page,
        locator: { kind: "surface", scope: "first-screen" } as const,
        renderer,
        kind: "colour-area" as const,
        subject: "palette",
        reading: null,
        factors: [],
      };
      renderDrafts.push(
        { ...base, measure: { metric: "warm-share", value: palette.warmShare, unit: "ratio" } },
        { ...base, measure: { metric: "chroma", value: palette.meanChroma, unit: "oklch-c" } },
      );
    }

    const pair = bodyPairOf(
      keptBody.map((b) => ({
        path: b.path,
        length: b.text.length,
        pair: textBoxes.get(b.path)?.pair ?? null,
      })),
    );
    if (pair === null) {
      notMeasured.push({ what: "contrast-pair", reason: "no-flat-pair" });
    } else {
      renderDrafts.push({
        ...page,
        locator: elementLocator(pair.path),
        renderer,
        kind: "contrast-pair",
        subject: pair.subject,
        measure: { metric: "contrast-ratio", value: pair.ratio, unit: "wcag" },
        reading: null,
        factors: [],
      });
    }

    const firstScreen = { kind: "surface", scope: "first-screen" } as const;
    const characters = [...keptHeadings, ...keptBody].reduce((sum, b) => {
      const box = textBoxes.get(b.path)?.box;
      return box !== undefined && meetsFirstScreen(box) ? sum + b.text.length : sum;
    }, 0);
    renderDrafts.push(
      {
        ...page,
        locator: firstScreen,
        renderer,
        kind: "density",
        subject: "first-screen",
        measure: {
          metric: "text-density",
          value: textDensity(characters),
          unit: "chars-per-1000px2",
        },
        reading: null,
        factors: [],
      },
      {
        ...page,
        locator: firstScreen,
        renderer,
        kind: "density",
        subject: "first-screen",
        measure: {
          metric: "element-density",
          value: valid.elements.filter(meetsFirstScreen).length,
          unit: "elements",
        },
        reading: null,
        factors: [],
      },
    );

    // fonts of the kept heading and body blocks, one item per role and subject at the first block
    const roles = [
      ["heading", keptHeadings],
      ["body", keptBody],
    ] as const;
    for (const [role, blocks] of roles) {
      const seen = new Set<string>();
      for (const b of blocks) {
        const family = textBoxes.get(b.path)?.fontFamily;
        const subject = family === undefined ? null : familySubject(role, family);
        if (subject === null || seen.has(subject)) continue;
        seen.add(subject);
        renderDrafts.push({
          ...page,
          locator: elementLocator(b.path),
          renderer,
          kind: "font-family",
          subject,
          measure: null,
          reading: null,
          factors: [],
        });
      }
    }
  } else {
    // in the order of `what` (code point), which is the order the report sorts them in
    for (const what of ["colour-area", "contrast-pair", "density", "text-visibility"] as const) {
      notMeasured.push({ what, reason: notRenderedReason });
    }
  }
  drafts.push(...renderDrafts);

  // ------------------------------------------------ text spans, word counts and readings
  for (const block of kept) {
    drafts.push({
      ...page,
      locator: { kind: "text", path: block.path, start: 0, end: block.text.length },
      renderer,
      kind: "text-span",
      subject: block.kind,
      measure: { metric: "word-count", value: wordCount(block.text), unit: "words" },
      reading: null,
      factors: [],
    });
    const fewWords = wordCount(block.text) < FEW_WORDS;
    for (const finding of lexiconFindings(block.text)) {
      const lean = leanOfValue(finding.value);
      drafts.push({
        ...page,
        locator: {
          kind: "text",
          path: block.path,
          start: finding.start,
          end: finding.end,
        },
        renderer,
        kind: "personality-signal",
        subject: finding.axis,
        quote: block.text.slice(finding.start, finding.end),
        measure: null,
        reading: {
          target: `identity-frame.personality.${finding.axis}` as Reading["target"],
          value: { lean: lean.lean },
          by: "rule",
          rules: ["lexicon-1", "value-to-lean-1"],
        },
        factors: fewWords ? ["few-words"] : [],
        hypothesisNote: lean.note,
      });
    }
  }

  // ------------------------------------------------ build, then the measured leans (they name measure ids)
  const items: InputEvidence[] = drafts.map((d) => build(d, ctx, pageIncomplete));
  const palette = (metric: "warm-share" | "chroma") =>
    items.find((i) => i.observation.subject === "palette" && i.measure?.metric === metric);
  const warm = palette("warm-share");
  const chroma = palette("chroma");
  if (typeof warm?.measure?.value === "number" && typeof chroma?.measure?.value === "number") {
    for (const lean of leansOfMeasures({
      warmShare: warm.measure.value,
      meanChroma: chroma.measure.value,
    })) {
      items.push(
        build(
          {
            ...page,
            locator: { kind: "surface", scope: "first-screen" },
            renderer,
            kind: "personality-signal",
            subject: lean.axis,
            measure: null,
            reading: {
              target: `identity-frame.personality.${lean.axis}`,
              value: { lean: lean.lean },
              by: "rule",
              rules: ["measure-to-lean-1"],
            },
            factors: [],
            basedOn: [lean.metric === "warm-share" ? warm.id : chroma.id],
            hypothesisNote: lean.note,
          },
          ctx,
          pageIncomplete,
        ),
      );
    }
  }

  const ids = new Map<string, number>();
  for (const item of items) ids.set(item.id, (ids.get(item.id) ?? 0) + 1);
  const colliding = [...ids].filter(([, n]) => n > 1).map(([id]) => id);
  if (colliding.length > 0) return { ok: false, error: "id-collision", ids: colliding.sort() };

  items.sort(compareEvidence);
  return {
    ok: true,
    evidence: items,
    renderer,
    notMeasured,
    snapshot: valid === null ? null : { unmatchedPaths },
  };
}

/** spec "Confidence": fewer than 20 words by `word-count-1` is `few-words`. */
const FEW_WORDS = 20;

type LexiconFinding = {
  axis: (typeof PERSONALITY_AXES)[number];
  value: RuleValue;
  start: number;
  end: number;
};

/**
 * The personality findings `lexicon-1` makes in a block's normalised text, with their spans in that
 * text. A block over 2,000 characters is read in parts, each cut at the last whitespace before the
 * limit, and each span is mapped back to the block's offsets. A clause the rules did not understand
 * gives nothing; an axis with two values gives both readings.
 */
function lexiconFindings(blockText: string): LexiconFinding[] {
  const out: LexiconFinding[] = [];
  let from = 0;
  while (from < blockText.length) {
    let end = Math.min(blockText.length, from + BRIEF_MAX_LENGTH);
    if (end < blockText.length) {
      const space = blockText.lastIndexOf(" ", end);
      if (space > from) end = space;
    }
    for (const f of interpretWithRules({ text: blockText.slice(from, end) }).findings) {
      if (f.field !== "personality") continue;
      out.push({
        axis: f.axis,
        value: f.value as RuleValue, // the rule lexicon gives an axis only RULE_VALUES entries (interpreter.ts)
        start: from + f.evidence.start,
        end: from + f.evidence.end,
      });
    }
    from = end;
  }
  return out;
}

/** One item from its draft: the analyser's fixed fields, the computed confidence and the id. */
function build(d: Draft, ctx: AnalyserContext, pageIncomplete: boolean): InputEvidence {
  const factors: FactorId[] = pageIncomplete ? [...d.factors, "page-incomplete"] : d.factors;
  const base: BaseId = d.reading === null ? "measure" : "rule-reading";
  const scored = scoreConfidence(base, factors);
  const flags = scored.confidence.factors
    .map((f) => FACTOR_FLAGS[f.id])
    .filter((k): k is NonNullable<typeof k> => k !== undefined)
    .sort()
    .map((key) => ({ key }));
  const note = d.hypothesisNote ?? null;
  const item: Omit<InputEvidence, "id"> = {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    analyser: { id: "website-url", version: ANALYSER_VERSION },
    inputKind: "website-url",
    role: ctx.role,
    source: {
      ref: d.ref,
      locator: d.locator,
      contentHash: d.contentHash,
      retrievedAt: ctx.retrievedAt,
      renderer: d.renderer,
    },
    observation:
      d.quote === undefined
        ? { kind: d.kind, subject: d.subject }
        : { kind: d.kind, subject: d.subject, quote: d.quote },
    measure: d.measure,
    reading: d.reading,
    confidence: scored.confidence,
    belowFloor: scored.belowFloor,
    fromModel: false,
    model: null,
    basedOn: d.basedOn ?? [],
    ownedBy: ctx.role === "own" ? "self" : "unknown",
    origin: "input",
    flags,
    hypothesis: note !== null,
    hypothesisNote: note,
  };
  return { ...item, id: evidenceId(item) };
}
