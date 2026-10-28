import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_BASES,
  CONFIDENCE_FACTORS,
  CONFIDENCE_VERSION,
  EVIDENCE_FLOOR,
  INDUSTRY_MARGIN_MILLI,
  milli,
  scoreConfidence,
  withinMargin,
  type BaseId,
  type FactorId,
} from "./confidence";
import {
  EVIDENCE_SCHEMA_VERSION,
  HYPOTHESIS_RULES,
  PATH_MAX_CHARS,
  READING_TARGETS,
  RULE_IDS,
  URL_MAX_CHARS,
  compareEvidence,
  evidenceId,
  inputEvidenceSchema,
  type InputEvidence,
} from "./evidence";
import confidenceSource from "./confidence.ts?raw";
import evidenceSource from "./evidence.ts?raw";
import {
  EVIDENCE_STRINGS,
  NOT_MEASURED_REASON_LINES,
  NOT_MEASURED_WHAT_KEYS,
  QUESTION_KEYS,
} from "./evidence-strings";
import stringsSource from "./evidence-strings.ts?raw";
import leansSource from "./leans.ts?raw";
import { PERSONALITY_AXES } from "./knowledge";
import snapshotSource from "./render-snapshot.ts?raw";
import readPageSource from "./read-page.ts?raw";
import pageTextSource from "./page-text.ts?raw";
import colourSource from "./measures/colour.ts?raw";
import pageSource from "./measures/page.ts?raw";
import wuSource from "./measures/wu.ts?raw";
import urlAnalyserSource from "./url-analyser.ts?raw";
import reportSource from "./report.ts?raw";
import { notMeasuredSchema } from "./url-analyser";
import { rendererBuildSchema } from "./render-snapshot";

// ---------------------------------------------------------------- fixtures

type Item = Record<string, unknown>;
const BUILD = {
  driver: "playwright",
  driverVersion: "1.56.1",
  browser: "chromium",
  browserVersion: "141.0.7390.37",
};
const HASH = "a".repeat(64);
const src = (over: Item = {}): Item => ({
  ref: "https://clinic.example/",
  locator: { kind: "surface", scope: "first-screen" },
  contentHash: HASH,
  retrievedAt: "2026-10-27T10:00:00.000Z",
  renderer: BUILD,
  ...over,
});
const textLocator = {
  kind: "text",
  path: "html>body>main:nth-of-type(1)>h1:nth-of-type(1)",
  start: 0,
  end: 7,
};
const MODEL = {
  job: "interpret",
  modelId: "pinned/model-1",
  adapter: { id: "mood-reader", version: "1" },
};

/** A valid colour measure; every test builds from it, then breaks one thing. The id is sealed last. */
const BASE_ITEM: Item = {
  schemaVersion: EVIDENCE_SCHEMA_VERSION,
  analyser: { id: "website-url", version: "1" },
  inputKind: "website-url",
  role: "own",
  source: src(),
  observation: { kind: "colour-area", subject: "blue-primary" },
  measure: { metric: "area-share", value: 0.4, unit: "ratio" },
  reading: null,
  fromModel: false,
  model: null,
  basedOn: [],
  ownedBy: "self",
  origin: "input",
  flags: [],
  hypothesis: false,
  hypothesisNote: null,
};

function item(over: Item = {}, opts: { base?: BaseId; factors?: FactorId[] } = {}): Item {
  const scored = scoreConfidence(opts.base ?? "measure", opts.factors ?? []);
  const merged = {
    ...BASE_ITEM,
    confidence: scored.confidence,
    belowFloor: scored.belowFloor,
    ...over,
  };
  return { ...merged, id: over.id ?? evidenceId(merged as unknown as InputEvidence) };
}

const reading = (over: Item = {}): Item => ({
  target: "identity-frame.personality.premium",
  value: { lean: "high" },
  by: "rule",
  rules: ["lexicon-1", "value-to-lean-1"],
  ...over,
});
const ruleOver = (over: Item = {}): Item => ({
  observation: { kind: "personality-signal", subject: "premium", quote: "premium" },
  source: src({ locator: textLocator, renderer: null }),
  measure: null,
  reading: reading(),
  ...over,
});
const modelOver = (over: Item = {}): Item => ({
  observation: { kind: "mood-word", subject: "calm", quote: "calm" },
  source: src({ locator: textLocator, renderer: null }),
  measure: null,
  reading: { target: "look-feel.mood", value: { word: "calm" }, by: "model" },
  fromModel: true,
  model: MODEL,
  ...over,
});
const ruleItem = (over: Item = {}, factors: FactorId[] = []) =>
  item(ruleOver(over), { base: "rule-reading", factors });
const modelItem = (over: Item = {}, factors: FactorId[] = []) =>
  item(modelOver(over), { base: "model-reading", factors });

/** The paths that fail, as the spec writes them; an unknown key reports as the key. */
function failures(x: unknown): string[] | null {
  const r = inputEvidenceSchema.safeParse(x);
  if (r.success) return null;
  // A value out of range fails twice at one path (the bound, then the computed value): one path counts once.
  const paths = r.error.issues.flatMap((i) =>
    i.code === "unrecognized_keys" ? [...i.keys] : [i.path.join(".")],
  );
  return [...new Set(paths)];
}

// ---------------------------------------------------------------- row 1

describe("a valid item", () => {
  const valid: [string, Item][] = [
    ["a colour measure at confidence 1", item()],
    [
      "a 300-character quote",
      ruleItem({
        observation: { kind: "personality-signal", subject: "premium", quote: "q".repeat(300) },
      }),
    ],
    [
      "confidence 0 (tool-default)",
      ruleItem(
        {
          origin: "tool-default",
          flags: [{ key: "tool-default", questionId: "evidence.toolDefault" }],
        },
        ["tool-default"],
      ),
    ],
    ["a fromModel item with its model", modelItem()],
  ];

  it.each(valid)("%s parses, round-trips and carries its computed id", (_name, x) => {
    const parsed = inputEvidenceSchema.parse(x);
    const again = inputEvidenceSchema.parse(JSON.parse(JSON.stringify(parsed)));
    expect(again).toEqual(parsed);
    expect(parsed.id).toBe(evidenceId(parsed));
    expect(parsed.basedOn).toEqual([]);
  });

  it("holds confidence 0 and 1 at the bounds", () => {
    expect(inputEvidenceSchema.parse(valid[2]?.[1]).confidence.value).toBe(0);
    expect(inputEvidenceSchema.parse(valid[0]?.[1]).confidence.value).toBe(1);
  });

  it("pins the five personality targets to the knowledge axes and the rule lists to the spec", () => {
    const axes = READING_TARGETS.filter((t) => t.startsWith("identity-frame.personality.")).map(
      (t) => t.split(".")[2],
    );
    expect(axes).toEqual([...PERSONALITY_AXES]);
  });
});

// ---------------------------------------------------------------- row 2

describe("bounds and forbidden fields", () => {
  it.each(["html", "css", "screenshot", "pageText", "score"])("an extra key %s fails", (key) => {
    expect(failures({ ...item(), [key]: "x" })).toEqual([key]);
  });

  it.each<[string, Item, string]>([
    [
      "fromModel true with a measure",
      modelItem({ measure: { metric: "area-share", value: 0.4, unit: "ratio" } }),
      "measure",
    ],
    ["fromModel true with model null", modelItem({ model: null }), "model"],
    ["fromModel false with a model", item({ model: MODEL }), "model"],
    [
      "a 301-character quote",
      ruleItem({
        observation: { kind: "personality-signal", subject: "premium", quote: "q".repeat(301) },
      }),
      "observation.quote",
    ],
    [
      "confidence 1.2",
      item({ confidence: { value: 1.2, base: { id: "measure", value: 1 }, factors: [] } }),
      "confidence.value",
    ],
    [
      "a reported confidence (0.9 on base 0.7, no factors)",
      ruleItem({
        confidence: { value: 0.9, base: { id: "rule-reading", value: 0.7 }, factors: [] },
      }),
      "confidence.value",
    ],
    [
      "an unknown observation kind",
      item({ observation: { kind: "vibe", subject: "x" } }),
      "observation.kind",
    ],
    [
      "an unknown reading target",
      ruleItem({ reading: reading({ target: "color.mood" }) }),
      "reading.target",
    ],
    [
      "hypothesis true with hypothesisNote null",
      ruleItem({ hypothesis: true, hypothesisNote: null }),
      "hypothesisNote",
    ],
    [
      "a colour-area with source.renderer null",
      item({ source: src({ renderer: null }) }),
      "source.renderer",
    ],
    [
      "a colour-declared with a renderer build",
      item({
        observation: { kind: "colour-declared", subject: "blue-primary" },
        source: src({ locator: { kind: "element", path: "sheet:https://clinic.example/a.css#3" } }),
      }),
      "source.renderer",
    ],
    [
      "measure-to-lean-1 with hypothesis false",
      ruleItem({ reading: reading({ rules: ["measure-to-lean-1"] }) }),
      "hypothesis",
    ],
    [
      "a rule-reading base on a measure-only item",
      item({}, { base: "rule-reading" }),
      "confidence.base",
    ],
    ["an id that is not evidenceId", item({ id: "00000000" }), "id"],
    [
      "a contentHash changed after the id",
      { ...item(), source: src({ contentHash: "b".repeat(64) }) },
      "id",
    ],
    [
      "a renderer changed after the id",
      { ...item(), source: src({ renderer: { ...BUILD, browserVersion: "142.0.7444.1" } }) },
      "id",
    ],
    [
      "a 0 to 100 number as a lean",
      ruleItem({ reading: reading({ value: { lean: 75 } }) }),
      "reading.value",
    ],
    [
      "another brand's item targeting a personality axis",
      ruleItem({ ownedBy: "other" }),
      "reading.target",
    ],
    ["a quality factor without its flag", item({}, { factors: ["page-incomplete"] }), "flags"],
    ["single-signal on a rule reading", ruleItem({}, ["single-signal"]), "confidence.factors"],
    [
      "factors out of order",
      item({
        confidence: {
          value: 0.49,
          base: { id: "measure", value: 1 },
          factors: [
            { id: "page-incomplete", value: 0.7 },
            { id: "few-words", value: 0.7 },
          ],
        },
        belowFloor: true,
        flags: [{ key: "quality.fewWords" }, { key: "quality.pageIncomplete" }],
      }),
      "confidence.factors",
    ],
    [
      "a factor value of 0.9 for page-incomplete",
      item({
        confidence: {
          value: 0.7,
          base: { id: "measure", value: 1 },
          factors: [{ id: "page-incomplete", value: 0.9 }],
        },
        flags: [{ key: "quality.pageIncomplete" }],
      }),
      "confidence.factors",
    ],
    ["belowFloor true on a computed-false item", item({ belowFloor: true }), "belowFloor"],
    [
      "belowFloor false on a computed-true item",
      ruleItem(
        {
          origin: "tool-default",
          flags: [{ key: "tool-default", questionId: "evidence.toolDefault" }],
          belowFloor: false,
        },
        ["tool-default"],
      ),
      "belowFloor",
    ],
    [
      "a hex value on a personality target",
      ruleItem({ reading: reading({ value: { hex: "#112233" } }) }),
      "reading.value",
    ],
    [
      "hypothesis false with a hypothesisNote",
      item({ hypothesis: false, hypothesisNote: "a note" }),
      "hypothesisNote",
    ],
    ["a quality flag without its factor", item({ flags: [{ key: "quality.fewWords" }] }), "flags"],
    [
      "another brand's item targeting color.current",
      ruleItem({
        ownedBy: "other",
        reading: reading({ target: "color.current", value: { hex: "#112233" } }),
      }),
      "reading.target",
    ],
    [
      "hue-family with a number",
      item({ measure: { metric: "hue-family", value: 0.4, unit: "band" } }),
      "measure.value",
    ],
    ...(
      [
        ["area-share", "ratio", 1.2],
        ["warm-share", "ratio", 1.2],
        ["lightness", "oklch-l", 1.2],
        ["chroma", "oklch-c", 0.6],
        ["contrast-ratio", "wcag", 22],
        ["contrast-ratio", "wcag", 0.5],
      ] as const
    ).map(([metric, unit, value]): [string, Item, string] => [
      `${metric} out of bounds at ${value}`,
      item({ measure: { metric, value, unit } }),
      "measure.value",
    ]),
  ])("%s fails at its path", (_name, x, path) => {
    expect(failures(x)).toEqual([path]);
  });

  it("an item whose retrievedAt alone changed still parses with its old id", () => {
    const x = { ...item(), source: src({ retrievedAt: "2027-01-01T00:00:00.000Z" }) };
    expect(inputEvidenceSchema.safeParse(x).success).toBe(true);
  });

  it("the id ignores key order and covers the metric and the target", () => {
    const a = item() as unknown as InputEvidence;
    const reordered = {
      ...a,
      source: Object.fromEntries(Object.entries(a.source).reverse()),
    } as InputEvidence;
    expect(evidenceId(reordered)).toBe(evidenceId(a));
    const lightness = {
      ...a,
      measure: { metric: "lightness", value: 0.4, unit: "oklch-l" },
    } as InputEvidence;
    expect(evidenceId(lightness)).not.toBe(evidenceId(a));
  });
});

describe("the renderer fits the observation", () => {
  const textSpan = (renderer: unknown) =>
    item({
      observation: { kind: "text-span", subject: "headline", quote: "premium" },
      source: src({ locator: textLocator, renderer }),
    });

  it("a colour-area item with source.renderer null fails at source.renderer", () => {
    expect(failures(item({ source: src({ renderer: null }) }))).toEqual(["source.renderer"]);
  });

  it("a colour-declared item with a build fails there too, and so does a sheet: locator", () => {
    const declared = (renderer: unknown, path: string) =>
      item({
        observation: { kind: "colour-declared", subject: "blue-primary" },
        source: src({ locator: { kind: "element", path }, renderer }),
      });
    expect(failures(declared(BUILD, "sheet:https://clinic.example/a.css#3"))).toEqual([
      "source.renderer",
    ]);
    expect(failures(declared(null, "sheet:https://clinic.example/a.css#3"))).toBeNull();
    const fontOnSheet = item({
      observation: { kind: "font-family", subject: "inter" },
      source: src({ locator: { kind: "element", path: "sheet:https://clinic.example/a.css#4" } }),
    });
    expect(failures(fontOnSheet)).toEqual(["source.renderer"]);
  });

  it("a text-span parses both ways", () => {
    expect(failures(textSpan(null))).toBeNull();
    expect(failures(textSpan(BUILD))).toBeNull();
  });

  it("a build with browserVersion 153 (one part) fails", () => {
    expect(
      failures(item({ source: src({ renderer: { ...BUILD, browserVersion: "153" } }) })),
    ).toEqual(["source.renderer.browserVersion"]);
    expect(rendererBuildSchema.safeParse({ ...BUILD, extra: 1 }).success).toBe(false);
  });
});

describe("base, quote and tool-default fit the item", () => {
  const assetShown = (base: BaseId) =>
    item(
      {
        observation: { kind: "asset-shown", subject: "logo" },
        source: src({
          locator: { kind: "box", x: 0, y: 0, width: 10, height: 10 },
          renderer: null,
        }),
        measure: null,
        reading: null,
        fromModel: true,
        model: MODEL,
      },
      { base },
    );

  it("clause 5: a model's asset-shown item never gets the measure base", () => {
    expect(failures(assetShown("measure"))).toEqual(["confidence.base"]);
    expect(failures(assetShown("model-reading"))).toBeNull();
    expect(inputEvidenceSchema.parse(assetShown("model-reading")).confidence.value).toBe(0.7);
  });

  it("clause 6: a reading by model with fromModel false fails at fromModel", () => {
    const x = item(modelOver({ fromModel: false, model: null }), { base: "measure" });
    expect(failures(x)).toEqual(["fromModel"]);
  });

  it("clause 6: fromModel true with no reading fails unless the item is asset-shown", () => {
    const x = item(modelOver({ reading: null }), { base: "model-reading" });
    expect(failures(x)).toEqual(["fromModel"]);
  });

  it("clause 15: a base value that is not the table's fails at confidence.base.value", () => {
    const x = ruleItem({
      confidence: { value: 0.7, base: { id: "rule-reading", value: 0.8 }, factors: [] },
    });
    expect(failures(x)).toEqual(["confidence.base.value"]);
  });

  it("clause 16: a text-span quote on an element locator fails at observation.quote", () => {
    const x = item({
      observation: { kind: "text-span", subject: "headline", quote: "premium" },
      source: src({ locator: { kind: "element", path: "html>body>h1" }, renderer: null }),
    });
    expect(failures(x)).toEqual(["observation.quote"]);
  });

  it("clause 4: a quote on a colour observation fails at observation.quote", () => {
    const x = item({ observation: { kind: "colour-area", subject: "blue-primary", quote: "x" } });
    expect(failures(x)).toContain("observation.quote");
  });

  it("clause 4: a quote on a non-text kind with a text locator fails at exactly observation.quote", () => {
    const x = item({
      observation: { kind: "colour-area", subject: "blue-primary", quote: "x" },
      source: src({ locator: textLocator }),
    });
    expect(failures(x)).toEqual(["observation.quote"]);
  });

  it("clause 17: tool-default needs origin tool-default and its flag", () => {
    const flag = [{ key: "tool-default", questionId: "evidence.toolDefault" }];
    expect(failures(ruleItem({ origin: "input", flags: flag }, ["tool-default"]))).toEqual([
      "confidence.factors",
    ]);
    expect(failures(ruleItem({ origin: "tool-default", flags: [] }, ["tool-default"]))).toEqual([
      "confidence.factors",
    ]);
    expect(
      failures(ruleItem({ origin: "tool-default", flags: flag }, ["tool-default"])),
    ).toBeNull();
  });

  it("clause 7: tool-default on an item with no reading fails", () => {
    const flag = [{ key: "tool-default", questionId: "evidence.toolDefault" }];
    const x = item({ origin: "tool-default", flags: flag }, { factors: ["tool-default"] });
    expect(failures(x)).toEqual(["confidence.factors"]);
  });
});

describe("hypothesis-flag-1", () => {
  const note = { hypothesis: true, hypothesisNote: "rule note" };

  it("pins HYPOTHESIS_RULES to the spec's members, each in RULE_IDS, and RULE_IDS to the four ids", () => {
    expect(HYPOTHESIS_RULES).toEqual({
      whole: ["measure-to-lean-1", "tsic-terms-1"],
      oneValue: ["value-to-lean-1"],
    });
    for (const id of [...HYPOTHESIS_RULES.whole, ...HYPOTHESIS_RULES.oneValue]) {
      expect(RULE_IDS).toContain(id);
    }
    expect([...RULE_IDS]).toEqual([
      "lexicon-1",
      "value-to-lean-1",
      "measure-to-lean-1",
      "tsic-terms-1",
    ]);
  });

  it("a measure-to-lean-1 reading must say true", () => {
    const r = reading({ rules: ["measure-to-lean-1"] });
    expect(failures(ruleItem({ reading: r }))).toEqual(["hypothesis"]);
    expect(failures(ruleItem({ reading: r, ...note }))).toBeNull();
  });

  it("a tsic-terms-1 reading must say true", () => {
    const r = reading({ target: "situation.tsic", value: { code: "86" }, rules: ["tsic-terms-1"] });
    expect(failures(ruleItem({ reading: r }))).toEqual(["hypothesis"]);
    expect(failures(ruleItem({ reading: r, ...note }))).toBeNull();
  });

  it("lexicon-1 plus value-to-lean-1 may say either", () => {
    expect(failures(ruleItem(note))).toBeNull();
    expect(failures(ruleItem())).toBeNull();
  });

  it("a lexicon-1 reading alone, a model reading and a measure with no reading cannot say true", () => {
    expect(failures(ruleItem({ reading: reading({ rules: ["lexicon-1"] }), ...note }))).toEqual([
      "hypothesis",
    ]);
    expect(failures(modelItem(note))).toEqual(["hypothesis"]);
    expect(failures(item(note))).toEqual(["hypothesis"]);
  });
});

describe("sort order", () => {
  it("orders by kind, then locator key, then id", () => {
    const at = (kind: string, locator: unknown, id: string) =>
      ({
        id,
        observation: { kind, subject: "x" },
        source: { locator },
      }) as unknown as InputEvidence;
    const list = [
      at("density", { kind: "surface", scope: "full-page" }, "00000002"),
      at("colour-area", { kind: "box", x: 10, y: 0, width: 1, height: 1 }, "00000003"),
      at("colour-area", { kind: "box", x: 9, y: 0, width: 1, height: 1 }, "00000004"),
      at("colour-area", { kind: "surface", scope: "first-screen" }, "00000005"),
      at("colour-area", { kind: "surface", scope: "first-screen" }, "00000001"),
    ];
    expect([...list].sort(compareEvidence).map((e) => e.id)).toEqual([
      "00000004",
      "00000003",
      "00000001",
      "00000005",
      "00000002",
    ]);
  });
});

// ---------------------------------------------------------------- rows 3, 32 and S1

describe("confidence is computed, never reported", () => {
  it("pins the version, the floor, the bases and the factors", () => {
    expect(CONFIDENCE_VERSION).toBe("confidence-1");
    expect(EVIDENCE_FLOOR).toBe(0.5);
    expect(CONFIDENCE_BASES).toEqual({ measure: 1, "rule-reading": 0.7, "model-reading": 0.7 });
    expect(CONFIDENCE_FACTORS).toEqual({
      "few-words": 0.7,
      "image-blurred": 0.6,
      "image-small": 0.5,
      "page-incomplete": 0.7,
      "single-signal": 0.8,
      "tool-default": 0,
    });
  });

  it("a measure with page-incomplete is 0.7 and not below the floor", () => {
    expect(scoreConfidence("measure", ["page-incomplete"])).toEqual({
      confidence: {
        value: 0.7,
        base: { id: "measure", value: 1 },
        factors: [{ id: "page-incomplete", value: 0.7 }],
      },
      belowFloor: false,
    });
  });

  it("a model reading with few-words and single-signal is 0.392 and below", () => {
    const s = scoreConfidence("model-reading", ["single-signal", "few-words"]);
    expect(s.confidence.value).toBe(0.392);
    expect(s.belowFloor).toBe(true);
    expect(s.confidence.base).toEqual({ id: "model-reading", value: 0.7 });
    expect(s.confidence.factors).toEqual([
      { id: "few-words", value: 0.7 },
      { id: "single-signal", value: 0.8 },
    ]);
  });

  it("rounds to three decimals and prints the spec's worked values", () => {
    expect(scoreConfidence("rule-reading", ["page-incomplete", "few-words"]).confidence.value).toBe(
      0.343,
    );
    expect(scoreConfidence("rule-reading", ["tool-default"])).toMatchObject({
      confidence: { value: 0 },
      belowFloor: true,
    });
    expect(milli(0.7 * 0.7 * 0.8)).toBe(392);
  });
});

describe("one mild factor stays, two fall", () => {
  const cases: [BaseId, FactorId[], number, boolean][] = [
    ["model-reading", ["single-signal"], 0.56, false],
    ["model-reading", ["few-words"], 0.49, true],
    ["model-reading", ["single-signal", "page-incomplete"], 0.392, true],
    ["measure", ["image-small"], 0.5, false],
    ["measure", ["page-incomplete", "few-words"], 0.49, true],
  ];

  it.each(cases)("%s with %j is %d", (base, factors, value, below) => {
    const s = scoreConfidence(base, factors);
    expect(s.confidence.value).toBe(value);
    expect(s.belowFloor).toBe(below);
    expect(s.confidence.factors.map((f) => f.id)).toEqual([...new Set(factors)].sort());
  });

  it("every order and repeat of the factor list gives the same result", () => {
    const orders: FactorId[][] = [
      ["single-signal", "page-incomplete"],
      ["page-incomplete", "single-signal"],
      ["page-incomplete", "single-signal", "page-incomplete"],
    ];
    const [first, ...rest] = orders.map((f) => scoreConfidence("model-reading", f));
    for (const s of rest) expect(s).toEqual(first);
  });
});

describe("the margin is in thousandths and inclusive", () => {
  it("holds the margin as 100 thousandths", () => {
    expect(INDUSTRY_MARGIN_MILLI).toBe(100);
  });

  it("exactly 0.1 apart is within, further is not", () => {
    expect(withinMargin(0.7, 0.6)).toBe(true);
    expect(withinMargin(0.8, 0.7)).toBe(true);
    expect(withinMargin(0.7, 0.599)).toBe(false);
    expect(withinMargin(0.9, 0.6)).toBe(false);
    expect(withinMargin(0.7, 0.65)).toBe(true);
  });
});

// ---------------------------------------------------------------- the bounds the safe read shares (tech notes sections 6 and 8)

describe("the URL and path bounds the safe read shares", () => {
  it("are 2,048 and 500", () => {
    expect(URL_MAX_CHARS).toBe(2048);
    expect(PATH_MAX_CHARS).toBe(500);
  });

  it("source.ref takes URL_MAX_CHARS characters and refuses one more, at source.ref", () => {
    const ref = (n: number) => `https://clinic.example/${"a".repeat(n - 23)}`;
    expect(ref(URL_MAX_CHARS)).toHaveLength(URL_MAX_CHARS);
    expect(failures(item({ source: src({ ref: ref(URL_MAX_CHARS) }) }))).toBeNull();
    expect(failures(item({ source: src({ ref: ref(URL_MAX_CHARS + 1) }) }))).toEqual([
      "source.ref",
    ]);
  });

  it("a text locator path takes PATH_MAX_CHARS characters and refuses one more, at source.locator.path", () => {
    const text = (n: number) =>
      ruleItem({
        source: src({
          locator: { ...textLocator, path: `html>body>${"p".repeat(n - 10)}` },
          renderer: null,
        }),
      });
    expect(failures(text(PATH_MAX_CHARS))).toBeNull();
    expect(failures(text(PATH_MAX_CHARS + 1))).toEqual(["source.locator.path"]);
  });

  it("an element locator path takes PATH_MAX_CHARS characters and refuses one more, at source.locator.path", () => {
    const element = (n: number) =>
      item({
        source: src({ locator: { kind: "element", path: `html>body>${"p".repeat(n - 10)}` } }),
      });
    expect(failures(element(PATH_MAX_CHARS))).toBeNull();
    expect(failures(element(PATH_MAX_CHARS + 1))).toEqual(["source.locator.path"]);
  });
});

// ---------------------------------------------------------------- row 30

/** Drops comments and keeps strings, so a word in a comment never fires the scan. */
const stripComments = (code: string): string =>
  code.replace(
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    (_m, str: string | undefined) => str ?? "",
  );

const BLOCKED_SPECIFIER = /openrouter|llm-interpreter|^@orivilo\/page-reader|^node:/;
const IMPORT_FORMS: Record<string, RegExp> = {
  // import x from "m", import { a,\n b } from "m", export * from "m", export { a } from "m"
  "single-line, multi-line and export-from":
    /\b(?:import|export)\b[^;'"]*?\bfrom\s*["']([^"']+)["']/g,
  "side-effect import": /\bimport\s*["']([^"']+)["']/g,
  "dynamic import()": /\bimport\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
};

/** What a module does that a measure never may: a blocked import in any form, Math.random, Date.now. */
function violations(source: string): string[] {
  const code = stripComments(source);
  const found: string[] = [];
  for (const [form, pattern] of Object.entries(IMPORT_FORMS)) {
    for (const m of code.matchAll(pattern)) {
      if (BLOCKED_SPECIFIER.test(m[1] ?? "")) found.push(`${form}: ${m[1]}`);
    }
  }
  if (/\bMath\s*(?:\.\s*random\b|\[\s*["'`]random["'`]\s*\])/.test(code)) found.push("Math.random");
  if (/\bDate\s*(?:\.\s*now\b|\[\s*["'`]now["'`]\s*\])/.test(code)) found.push("Date.now");
  return found;
}

// Later slices add their module here when it lands (spec row 30, Slice "each").
const SCANNED: Record<string, string> = {
  evidence: evidenceSource,
  confidence: confidenceSource,
  "evidence-strings": stringsSource,
  leans: leansSource,
  "render-snapshot": snapshotSource,
  "read-page": readPageSource,
  "page-text": pageTextSource,
  "measures/wu": wuSource,
  "measures/colour": colourSource,
  "measures/page": pageSource,
  "url-analyser": urlAnalyserSource,
  report: reportSource, // not named in row 30's list; ORV-135 decision 5 adds it to the scan
};

describe("measures never call a model", () => {
  // Forms it blocks: single-line import, multi-line import, side-effect import, dynamic import(), export ... from.
  const fixtures: [string, string][] = [
    ["a single-line import of openrouter", 'import { callModel } from "./openrouter";'],
    ["a multi-line import of llm-interpreter", 'import {\n  a,\n  b,\n} from "./llm-interpreter";'],
    ["a side-effect import of a node: module", 'import "node:dns";'],
    ["a dynamic import() of the page reader", 'const r = await import("@orivilo/page-reader");'],
    ["an export ... from openrouter", 'export * from "./openrouter";'],
    ["an export { } from a node: module", 'export { readFile } from "node:fs";'],
    ["a template-literal dynamic import()", "const r = await import(`./openrouter`);"],
    ["a Math.random call", "const x = Math.random();"],
    ["a bracket Math.random call", 'const x = Math["random"]();'],
    ["a bracket Date.now call", "const t = Date[`now`]();"],
    ["a Date.now call", "const t = Date.now();"],
  ];

  it.each(fixtures)("flags %s", (_name, code) => {
    expect(violations(code)).not.toEqual([]);
  });

  it("ignores a comment that names a blocked word and an allowed import", () => {
    expect(violations('// uses Math.random\nimport { z } from "zod";\n/* Date.now */')).toEqual([]);
  });

  it.each(Object.entries(SCANNED))("%s has none", (_name, text) => {
    expect(violations(text)).toEqual([]);
  });
});

// ---------------------------------------------------------------- row 29

type Entry = { th: string; en: string };

/** The problems of a string table: an empty string, an em dash, a middot, a question key without a string. */
function stringProblems(table: Record<string, Entry>, questionKeys: readonly string[]): string[] {
  const problems: string[] = [];
  for (const [key, entry] of Object.entries(table)) {
    for (const lang of ["th", "en"] as const) {
      const text = entry[lang];
      if (text.trim() === "") problems.push(`${key}.${lang} is empty`);
      if (text.includes("\u2014")) problems.push(`${key}.${lang} has an em dash`);
      if (text.includes("\u00b7")) problems.push(`${key}.${lang} has a middot`);
    }
  }
  for (const key of questionKeys) {
    if (!(key in table)) problems.push(`${key} is a question key without a string`);
  }
  return problems;
}

// The keys of the ORV-128 spec "Strings" section, with the four {what} labels and read.notMeasured.noFlatPair of slice 1c,
// and the four read.failed.* keys of the ORV-135 spec "Strings this slice adds".
const SPEC_KEYS = [
  "evidence.fromModel",
  "evidence.measured",
  "evidence.belowFloor",
  "evidence.conflict",
  "evidence.toolDefault",
  "evidence.similarTo",
  "culture.yellow",
  "culture.political",
  "industry.confirm",
  "industry.byNameOnly",
  "report.conflictsNotChecked",
  "read.refused.robots",
  "read.refused.address",
  "read.failed.timeout",
  "read.failed.network",
  "read.failed.redirects",
  "read.failed.notHtml",
  "read.notRead.competitor",
  "read.notMeasured",
  "read.notRendered.none",
  "read.notRendered.failed",
  "read.notRendered.budget",
  "read.notRendered.invalid",
  "read.notMeasured.what.colourArea",
  "read.notMeasured.what.contrast",
  "read.notMeasured.what.density",
  "read.notMeasured.what.textVisibility",
  "read.notMeasured.noFlatPair",
  "quality.fewWords",
  "quality.pageIncomplete",
  "quality.imageSmall",
  "quality.imageBlurred",
];

describe("evidence strings", () => {
  it("every string is Thai and English", () => {
    expect(stringProblems(EVIDENCE_STRINGS, QUESTION_KEYS)).toEqual([]);
    expect([...QUESTION_KEYS]).toEqual([
      "evidence.conflict",
      "evidence.toolDefault",
      "evidence.similarTo",
      "culture.yellow",
      "culture.political",
      "industry.confirm",
    ]);
  });

  it("the four read.failed.* keys hold the copy the ORV-135 spec drafts", () => {
    expect(EVIDENCE_STRINGS["read.failed.timeout"]).toEqual({
      th: "หน้านี้ใช้เวลาอ่านนานเกินไป เราจึงหยุดอ่าน",
      en: "The page took too long to read, so we stopped.",
    });
    expect(EVIDENCE_STRINGS["read.failed.network"]).toEqual({
      th: "เราดึงหน้านี้ไม่ได้ เว็บไซต์ไม่ตอบหรือส่งข้อผิดพลาดกลับมา",
      en: "We could not get this page. The site did not answer or sent an error.",
    });
    expect(EVIDENCE_STRINGS["read.failed.redirects"]).toEqual({
      th: "ที่อยู่นี้ส่งต่อไปยังที่อยู่อื่นหลายครั้งเกินไป เราจึงหยุดอ่าน",
      en: "This address sent us on to other addresses too many times, so we stopped.",
    });
    expect(EVIDENCE_STRINGS["read.failed.notHtml"]).toEqual({
      th: "ที่อยู่นี้ไม่ใช่หน้าเว็บที่เราอ่านได้",
      en: "This address is not a web page we can read.",
    });
  });

  it("the key set equals the list the spec Strings section holds", () => {
    expect(Object.keys(EVIDENCE_STRINGS).sort()).toEqual([...SPEC_KEYS].sort());
  });

  it("break-it: an empty th, an em dash and a stray question key are reported", () => {
    const broken = { ...EVIDENCE_STRINGS, "evidence.measured": { th: "", en: "a \u2014 b" } };
    expect(stringProblems(broken, [...QUESTION_KEYS, "nope"])).toEqual([
      "evidence.measured.th is empty",
      "evidence.measured.en has an em dash",
      "nope is a question key without a string",
    ]);
  });
});

describe("the strings a NotMeasured entry prints (slice 1c, F51)", () => {
  const reasons = notMeasuredSchema.shape.reason.options;
  const whats = notMeasuredSchema.shape.what.options;

  it("every reason maps to a line key and every what to a label key, and each key exists", () => {
    expect(Object.keys(NOT_MEASURED_REASON_LINES).sort()).toEqual([...reasons].sort());
    expect(Object.keys(NOT_MEASURED_WHAT_KEYS).sort()).toEqual([...whats].sort());
    for (const reason of reasons) {
      const { line, reason: filled } = NOT_MEASURED_REASON_LINES[reason];
      expect(line in EVIDENCE_STRINGS).toBe(true);
      if (filled !== null) expect(filled in EVIDENCE_STRINGS).toBe(true);
    }
    for (const what of whats) expect(NOT_MEASURED_WHAT_KEYS[what] in EVIDENCE_STRINGS).toBe(true);
  });

  it("each option D reason prints read.notMeasured with its read.notRendered reason", () => {
    expect(NOT_MEASURED_REASON_LINES).toMatchObject({
      "no-renderer": { line: "read.notMeasured", reason: "read.notRendered.none" },
      "render-failed": { line: "read.notMeasured", reason: "read.notRendered.failed" },
      "render-budget": { line: "read.notMeasured", reason: "read.notRendered.budget" },
      "snapshot-invalid": { line: "read.notMeasured", reason: "read.notRendered.invalid" },
    });
  });

  it("no-flat-pair prints read.notMeasured.noFlatPair and has no reason to fill", () => {
    expect(NOT_MEASURED_REASON_LINES["no-flat-pair"]).toEqual({
      line: "read.notMeasured.noFlatPair",
      reason: null,
    });
    expect(EVIDENCE_STRINGS["read.notMeasured.noFlatPair"].en).toContain("{what}");
    expect(EVIDENCE_STRINGS["read.notMeasured.noFlatPair"].th).toContain("{what}");
    expect(EVIDENCE_STRINGS["read.notMeasured.noFlatPair"].en).not.toContain("{reason}");
  });

  it("the four labels are the ones the spec drafts", () => {
    expect(NOT_MEASURED_WHAT_KEYS).toEqual({
      "colour-area": "read.notMeasured.what.colourArea",
      "contrast-pair": "read.notMeasured.what.contrast",
      density: "read.notMeasured.what.density",
      "text-visibility": "read.notMeasured.what.textVisibility",
    });
    expect(EVIDENCE_STRINGS["read.notMeasured.what.colourArea"]).toEqual({
      th: "สัดส่วนพื้นที่สี",
      en: "colour areas",
    });
    expect(EVIDENCE_STRINGS["read.notMeasured.what.contrast"]).toEqual({
      th: "ความต่างระหว่างสีตัวอักษรกับสีพื้นหลัง",
      en: "text and background contrast",
    });
    expect(EVIDENCE_STRINGS["read.notMeasured.what.density"]).toEqual({
      th: "ความหนาแน่นของเนื้อหา",
      en: "content density",
    });
    expect(EVIDENCE_STRINGS["read.notMeasured.what.textVisibility"]).toEqual({
      th: "ข้อความที่มองเห็นได้",
      en: "which text is visible",
    });
  });
});
