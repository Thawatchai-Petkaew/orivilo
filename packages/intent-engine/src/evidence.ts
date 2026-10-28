import { z } from "zod";
import { CHROMATIC_FAMILIES, hexSchema } from "./color-audit";
import {
  BASE_IDS,
  CONFIDENCE_BASES,
  CONFIDENCE_FACTORS,
  FACTOR_IDS,
  scoreConfidence,
  type FactorId,
} from "./confidence";
import { QUESTION_KEYS } from "./evidence-strings";
import { PERSONALITY_AXES, slugSchema } from "./knowledge";
import { rendererBuildSchema } from "./render-snapshot";
import { fingerprintOf } from "./resolver";

/**
 * The evidence contract (ORV-128 spec "Evidence first", tech notes sections 2, 3 and 5).
 * Every closed list, field name and bound below is the spec's. Pure: no clock, no random, no I/O.
 */
export const EVIDENCE_SCHEMA_VERSION = "1.0";

export const INPUT_KINDS = [
  "website-url",
  "user-html",
  "mood-photo",
  "other-brand-ci",
  "brief-text",
] as const;
export const INPUT_ROLES = ["own", "reference", "competitor"] as const;
export const OBSERVATION_KINDS = [
  "colour-area",
  "colour-declared",
  "contrast-pair",
  "density",
  "font-family",
  "text-span",
  "image-property",
  "industry-candidate",
  "personality-signal",
  "mood-word",
  "brand-name",
  "competitor-name",
  "asset-shown",
] as const;
/** Observation kinds that may carry a quote of the input text. */
export const TEXT_KINDS = [
  "text-span",
  "industry-candidate",
  "personality-signal",
  "mood-word",
  "brand-name",
  "competitor-name",
] as const;
export const MEASURE_UNITS = {
  "area-share": "ratio",
  "hue-family": "band",
  lightness: "oklch-l",
  chroma: "oklch-c",
  "warm-share": "ratio",
  "contrast-ratio": "wcag",
  "text-density": "chars-per-1000px2",
  "element-density": "elements",
  "short-edge-px": "px",
  sharpness: "laplacian-variance",
  "word-count": "words",
  "delta-e": "ciede2000",
} as const;
export type MeasureMetric = keyof typeof MEASURE_UNITS;
/** Written out, not built from PERSONALITY_AXES, so zod sees a literal tuple; a test pins the five to the axes. */
export const READING_TARGETS = [
  "situation.tsic",
  "situation.name",
  "situation.competitors",
  "identity-frame.personality.playful",
  "identity-frame.personality.expressive",
  "identity-frame.personality.structured",
  "identity-frame.personality.warm",
  "identity-frame.personality.premium",
  "look-feel.mood",
  "color.current",
  "competitive-frame.lineup-candidate",
  "reference.asset",
] as const;
export type ReadingTarget = (typeof READING_TARGETS)[number];
/** Spec "Evidence first", Rule ids: four at schema 1.0. A slice that adds a rule making a reading adds its id and bumps the schema by a minor version. */
export const RULE_IDS = [
  "lexicon-1",
  "value-to-lean-1",
  "measure-to-lean-1",
  "tsic-terms-1",
] as const;
export type RuleId = (typeof RULE_IDS)[number];
/** hypothesis-flag-1: the rule hypotheses listed under spec "Hypotheses" (three at schema 1.0). */
export const HYPOTHESIS_RULES = {
  whole: ["measure-to-lean-1", "tsic-terms-1"], // a hypothesis as a whole: the item must say true
  oneValue: ["value-to-lean-1"], // a hypothesis at one value only (40): the item may say true
} as const satisfies Record<string, readonly RuleId[]>;
export const FLAG_KEYS = [
  "conflict",
  "culture.yellow",
  "culture.political",
  "similar-to",
  "tool-default",
  "quality.fewWords",
  "quality.pageIncomplete",
  "quality.imageSmall",
  "quality.imageBlurred",
] as const;
export const MODEL_JOBS = ["interpret", "see"] as const;

/** Each quality factor and the flag that must travel with it (checkItem clause 10). */
const QUALITY_PAIRS = [
  { factor: "few-words", flag: "quality.fewWords" },
  { factor: "page-incomplete", flag: "quality.pageIncomplete" },
  { factor: "image-small", flag: "quality.imageSmall" },
  { factor: "image-blurred", flag: "quality.imageBlurred" },
] as const satisfies readonly { factor: FactorId; flag: (typeof FLAG_KEYS)[number] }[];

const hexId = z.string().regex(/^[0-9a-f]{8}$/);

/** The bound of `source.ref`, and of the whole URL the safe read accepts (tech notes section 6), so the two cannot drift apart. */
export const URL_MAX_CHARS = 2048;
/** The bound of a locator `path`, and of the element path a text block may have (tech notes section 8). */
export const PATH_MAX_CHARS = 500;

/** Where in the input. A discriminated union, so every locator sorts the same way (section 5). */
const locatorSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("text"),
      path: z.string().min(1).max(PATH_MAX_CHARS),
      start: z.int().min(0),
      end: z.int().min(1),
    })
    .strict()
    .refine((l) => l.end > l.start, { message: "end after start", path: ["end"] }),
  z.object({ kind: z.literal("element"), path: z.string().min(1).max(PATH_MAX_CHARS) }).strict(),
  z
    .object({
      kind: z.literal("box"),
      x: z.int().min(0),
      y: z.int().min(0),
      width: z.int().min(1),
      height: z.int().min(1),
    })
    .strict(),
  z.object({ kind: z.literal("surface"), scope: z.enum(["first-screen", "full-page"]) }).strict(),
]);

const HUE_BANDS = [...CHROMATIC_FAMILIES, "ink", "paper"] as const;
const MEASURE_BOUNDS: Partial<Record<MeasureMetric, [number, number]>> = {
  "area-share": [0, 1],
  "warm-share": [0, 1],
  lightness: [0, 1],
  chroma: [0, 0.5],
  "contrast-ratio": [1, 21],
};

/** The unit is fixed by the metric; the value is bounded per metric; `hue-family` holds a band name. */
const measureSchema = z
  .object({
    metric: z.enum(Object.keys(MEASURE_UNITS) as [MeasureMetric, ...MeasureMetric[]]),
    value: z.union([z.number(), z.enum(HUE_BANDS)]),
    unit: z.string(),
  })
  .strict()
  .superRefine((m, ctx) => {
    if (m.unit !== MEASURE_UNITS[m.metric]) {
      ctx.addIssue({ code: "custom", message: "unit fits the metric", path: ["unit"] });
    }
    if (m.metric === "hue-family") {
      if (typeof m.value !== "string") {
        ctx.addIssue({ code: "custom", message: "a hue band name", path: ["value"] });
      }
      return;
    }
    const [min, max] = MEASURE_BOUNDS[m.metric] ?? [0, Infinity];
    if (typeof m.value !== "number" || m.value < min || m.value > max) {
      ctx.addIssue({ code: "custom", message: `a number from ${min} to ${max}`, path: ["value"] });
    }
  });

const tsicCode = z.string().regex(/^(?:[A-U]|\d{2,5})$/);
const nameValue = z.object({ name: z.string().trim().min(1).max(60) }).strict();
const leanValue = z.object({ lean: z.enum(["high", "low"]) }).strict();
const lineupValue = z
  .object({
    name: z.string().trim().min(1).max(60),
    hex: hexSchema,
    label: z.enum(["own-input", "reference"]),
  })
  .strict();
const assetValue = z.union([
  z.object({ asset: z.literal("colour"), hex: hexSchema }).strict(),
  z.object({ asset: z.literal("font"), family: z.string().trim().min(1).max(100) }).strict(),
]);
const VALUE_SHAPES: Record<ReadingTarget, z.ZodType> = {
  "situation.tsic": z.object({ code: tsicCode }).strict(),
  "situation.name": nameValue,
  "situation.competitors": nameValue,
  "identity-frame.personality.playful": leanValue,
  "identity-frame.personality.expressive": leanValue,
  "identity-frame.personality.structured": leanValue,
  "identity-frame.personality.warm": leanValue,
  "identity-frame.personality.premium": leanValue,
  "look-feel.mood": z.object({ word: slugSchema }).strict(),
  "color.current": z.object({ hex: hexSchema }).strict(),
  "competitive-frame.lineup-candidate": lineupValue,
  "reference.asset": assetValue,
};
/** Every shape a reading's value can take; which one fits is decided by the target (checkItem). */
const readingValueSchema = z.union([
  z.object({ code: tsicCode }).strict(),
  nameValue,
  leanValue,
  z.object({ word: slugSchema }).strict(),
  z.object({ hex: hexSchema }).strict(),
  lineupValue,
  assetValue,
]);
const readingTargetSchema = z.enum(READING_TARGETS);

const readingSchema = z.discriminatedUnion("by", [
  z
    .object({
      target: readingTargetSchema,
      value: readingValueSchema,
      by: z.literal("rule"),
      rules: z.array(z.enum(RULE_IDS)).min(1).max(RULE_IDS.length),
    })
    .strict(),
  z
    .object({ target: readingTargetSchema, value: readingValueSchema, by: z.literal("model") })
    .strict(),
]);

/** The base and factors are stored as { id, value } pairs, so the trace shows the numbers (finding F5). */
const confidenceSchema = z
  .object({
    value: z.number().min(0).max(1),
    base: z.object({ id: z.enum(BASE_IDS), value: z.number() }).strict(),
    factors: z
      .array(z.object({ id: z.enum(FACTOR_IDS), value: z.number() }).strict())
      .max(FACTOR_IDS.length),
  })
  .strict();

const itemShape = z
  .object({
    schemaVersion: z.literal(EVIDENCE_SCHEMA_VERSION),
    id: hexId,
    analyser: z
      .object({ id: z.enum(INPUT_KINDS), version: z.string().trim().min(1).max(20) })
      .strict(),
    inputKind: z.enum(INPUT_KINDS),
    role: z.enum(INPUT_ROLES),
    source: z
      .object({
        ref: z.string().min(1).max(URL_MAX_CHARS),
        locator: locatorSchema,
        contentHash: z.string().regex(/^[0-9a-f]{64}$/),
        retrievedAt: z.iso.datetime(),
        renderer: rendererBuildSchema.nullable(), // null when nothing in the item rests on a render (finding F10)
      })
      .strict(),
    observation: z
      .object({
        kind: z.enum(OBSERVATION_KINDS),
        subject: slugSchema,
        quote: z.string().min(1).max(300).optional(),
      })
      .strict(),
    measure: measureSchema.nullable(),
    reading: readingSchema.nullable(),
    confidence: confidenceSchema,
    belowFloor: z.boolean(),
    fromModel: z.boolean(),
    model: z
      .object({
        job: z.enum(MODEL_JOBS),
        modelId: z.string().min(1).max(100),
        adapter: z.object({ id: slugSchema, version: z.string().min(1).max(20) }).strict(),
      })
      .strict()
      .nullable(),
    basedOn: z.array(hexId).max(50),
    ownedBy: z.enum(["self", "other", "unknown"]),
    origin: z.enum(["input", "tool-default"]),
    flags: z
      .array(
        z.object({ key: z.enum(FLAG_KEYS), questionId: z.enum(QUESTION_KEYS).optional() }).strict(),
      )
      .max(FLAG_KEYS.length),
    hypothesis: z.boolean(),
    hypothesisNote: z.string().min(1).max(200).nullable(),
  })
  .strict();
export type InputEvidence = z.infer<typeof itemShape>;

/**
 * The id (tech notes section 3): FNV-1a over `analyser`, `source` without `retrievedAt` (the renderer
 * build stays in), `observation`, `measure.metric` and `reading.target`. Nothing else.
 */
export const evidenceId = (
  item: Pick<InputEvidence, "analyser" | "source" | "observation" | "measure" | "reading">,
): string => {
  const { ref, locator, contentHash, renderer } = item.source; // the clock is not part of the id
  return fingerprintOf({
    analyser: item.analyser,
    source: { ref, locator, contentHash, renderer },
    observation: item.observation,
    metric: item.measure?.metric ?? null,
    target: item.reading?.target ?? null,
  });
};

const RENDER_ONLY: readonly string[] = ["colour-area", "contrast-pair", "density"];

/** checkItem clauses 1 to 17 (tech notes section 2). Each issue sits at the path row 2 names. */
function checkItem(item: InputEvidence, ctx: z.RefinementCtx) {
  const bad = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: "custom", message, path });
  const { reading, confidence, observation, source, flags } = item;
  const factorIds = confidence.factors.map((f) => f.id);
  const hasFactor = (id: FactorId) => factorIds.includes(id);

  // 1 to 3
  if (item.fromModel !== (item.model !== null))
    bad(["model"], "model is set exactly when fromModel is true");
  if (item.fromModel && item.measure !== null) bad(["measure"], "a model never measures");
  if (item.hypothesis !== (item.hypothesisNote !== null)) {
    bad(["hypothesisNote"], "a note exactly when hypothesis is true");
  }

  // 4 and 16
  if (observation.quote !== undefined) {
    if (!(TEXT_KINDS as readonly string[]).includes(observation.kind)) {
      bad(["observation", "quote"], "a quote only on a text observation");
    }
    if (source.locator.kind !== "text")
      bad(["observation", "quote"], "a quote needs a text locator");
  }

  // value fits its target
  if (reading !== null && !VALUE_SHAPES[reading.target].safeParse(reading.value).success) {
    bad(["reading", "value"], "the value fits the target");
  }

  // 5, decided by fromModel first
  const base = item.fromModel
    ? "model-reading"
    : reading?.by === "rule"
      ? "rule-reading"
      : "measure";
  if (confidence.base.id !== base) bad(["confidence", "base"], `the base is ${base}`);

  // 6
  if (item.fromModel) {
    if (reading?.by !== "model" && !(reading === null && observation.kind === "asset-shown")) {
      bad(["fromModel"], "a model item holds a reading by model");
    }
  } else if (reading?.by === "model") {
    bad(["fromModel"], "a reading by model means fromModel");
  }

  // 7
  if (hasFactor("single-signal") && confidence.base.id !== "model-reading") {
    bad(["confidence", "factors"], "single-signal only on a model reading");
  }
  if (hasFactor("tool-default") && reading === null) {
    bad(["confidence", "factors"], "tool-default only on a reading");
  }

  // 8 and 15
  const sorted = [...new Set(factorIds)].sort();
  if (sorted.length !== factorIds.length || sorted.some((id, i) => id !== factorIds[i])) {
    bad(["confidence", "factors"], "factor ids unique and in ascending order");
  }
  if (confidence.factors.some((f) => f.value !== CONFIDENCE_FACTORS[f.id])) {
    bad(["confidence", "factors"], "factor values are the table's");
  }
  if (confidence.base.value !== CONFIDENCE_BASES[confidence.base.id]) {
    bad(["confidence", "base", "value"], "the base value is the table's");
  }

  // 9
  const scored = scoreConfidence(confidence.base.id, factorIds);
  if (confidence.value !== scored.confidence.value) {
    bad(["confidence", "value"], "the confidence is the computed one");
  }
  if (item.belowFloor !== scored.belowFloor) bad(["belowFloor"], "belowFloor is the computed one");

  // 10
  for (const { factor, flag } of QUALITY_PAIRS) {
    if (hasFactor(factor) !== flags.some((f) => f.key === flag)) {
      bad(["flags"], `${factor} and ${flag} go together`);
    }
  }

  // 11
  if (
    item.ownedBy === "other" &&
    reading !== null &&
    (reading.target === "color.current" ||
      (PERSONALITY_AXES as readonly string[]).includes(reading.target.split(".")[2] ?? ""))
  ) {
    bad(
      ["reading", "target"],
      "another brand's item never suggests a value for the person's brand",
    );
  }

  // 12
  if (item.id !== evidenceId(item)) bad(["id"], "the id is the computed one");

  // 13
  const sheetLocator =
    (source.locator.kind === "text" || source.locator.kind === "element") &&
    source.locator.path.startsWith("sheet:");
  if (RENDER_ONLY.includes(observation.kind) && source.renderer === null) {
    bad(["source", "renderer"], "this observation exists only on a render");
  } else if ((observation.kind === "colour-declared" || sheetLocator) && source.renderer !== null) {
    bad(["source", "renderer"], "this observation rests on the stylesheet bytes alone");
  }

  // 14
  const rules = reading?.by === "rule" ? reading.rules : [];
  const whole = rules.some((r) => (HYPOTHESIS_RULES.whole as readonly string[]).includes(r));
  const oneValue = rules.some((r) => (HYPOTHESIS_RULES.oneValue as readonly string[]).includes(r));
  if (whole ? !item.hypothesis : !oneValue && item.hypothesis) {
    bad(["hypothesis"], whole ? "a rule hypothesis must say true" : "no rule hypothesis, so false");
  }

  // 17
  if (
    hasFactor("tool-default") &&
    !(
      item.origin === "tool-default" &&
      flags.some((f) => f.key === "tool-default" && f.questionId === "evidence.toolDefault")
    )
  ) {
    bad(["confidence", "factors"], "tool-default needs origin tool-default and its flag");
  }
}

export const inputEvidenceSchema = itemShape.superRefine(checkItem);

/** By code point, the order the engine uses for every text key. */
const byText = (a: string, b: string): number => {
  const x = Array.from(a);
  const y = Array.from(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const d = (x[i]?.codePointAt(0) ?? 0) - (y[i]?.codePointAt(0) ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return x.length === y.length ? 0 : x.length < y.length ? -1 : 1;
};

const pad7 = (n: number): string => String(n).padStart(7, "0");

/** The locator as a sortable key (section 5). */
function locatorKey(l: InputEvidence["source"]["locator"]): string {
  switch (l.kind) {
    case "surface":
      return `surface|${l.scope}`;
    case "box":
      return `box|${pad7(l.x)}|${pad7(l.y)}|${pad7(l.width)}|${pad7(l.height)}`;
    case "element":
      return `element|${l.path}`;
    case "text":
      return `text|${l.path}|${pad7(l.start)}|${pad7(l.end)}`;
  }
}

/** Analyser output order: observation kind, then locator key, then id as the tiebreak, so the order is total. */
export function compareEvidence(
  a: Pick<InputEvidence, "id" | "observation" | "source">,
  b: Pick<InputEvidence, "id" | "observation" | "source">,
): number {
  return (
    byText(a.observation.kind, b.observation.kind) ||
    byText(locatorKey(a.source.locator), locatorKey(b.source.locator)) ||
    byText(a.id, b.id)
  );
}
