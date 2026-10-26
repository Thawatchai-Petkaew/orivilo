---
issue: ORV-128 (https://tpetkaew.atlassian.net/browse/ORV-128)
spec: docs/specs/ORV-128/spec.md v1.3
task: ORV-128-design-schema-1, ORV-128-design-schema-2 (renderer build and text under option D), ORV-128-design-schema-3 (follow spec v1.3)
author: ds-architect
date: 2026-10-27
---

# ORV-128 tech notes: the evidence contract and slice 1 of the input analysers

This is the G2 design for slice 1 of the input analysers. It turns the spec's "Evidence first", "Confidence" and "How evidence feeds the node graph" sections into types, functions and tests. It was checked against these sources:

- ADR 0005 (schema versions), ADR 0007 decision 5 (the fingerprint), ADR 0008 (adapters, evidence spans, `lexicon-1`), ADR 0009 (jobs, recorded tests).
- The engine source: `fingerprintOf` in `resolver.ts`, `RULE_VALUES` and `interpretWithRules` in `interpreter.ts`, `classifyHex` and `hexSchema` in `color-audit.ts`, `slugSchema` and `PERSONALITY_AXES` in `knowledge.ts`.
- Review round 2 of the spec (suggestions S1 and S2).

The spec keeps every closed list, field name, bound and number. Where this design needs something the spec does not say, the gap is listed under "Findings for the spec" at the end, with the change this design assumes.

**One home per rule.** Spec v1.3 defines each rule once, by name. These notes use the same names and point to the spec's section for every threshold and number; the code below implements a rule, it does not restate it. A change to a rule's numbers is made in the spec first.

<!-- prettier-ignore -->
| Rule | Defined in spec v1.3 | Used here |
| --- | --- | --- |
| `thousandths-1` | "Confidence" | §4 `scoreConfidence`, `milli`; §8 `leansOfMeasures`; §14 rows 3, 12, 32 |
| `industry-margin-1` | "Confidence" | §4 `withinMargin`; §10 `readIndustry`; §14 S1 |
| `conflict-question-1` | "The six cases", case 1 | §9; §10 `readIndustry` and `detectConflicts` |
| `industry-level-1` | "Industry", Matched level | §5 Industry; §10 `readIndustry` |
| `html-text-1` | "Page text" | §8 `pageTextOf`; §14 rows 9, 36 |
| `word-count-1` | "Page text" | §4 `few-words`; §8 `word-count`; §14 row 36 |
| `measure-to-lean-1` | "Evidence first", From measures to a lean | §8 `leansOfMeasures`; §14 row 11 |
| `value-to-lean-1` | "Evidence first", From a `lexicon-1` value to a lean | §8 `leanOfValue`; §14 row 10 |
| `tsic-terms-1` | "Industry", Match terms | §10 `matchIndustryTerms`; §14 row 13 (slice 2) |

## 1. Module layout

Everything below lives in `packages/intent-engine/src` and is pure TypeScript. Bytes, a clock reading and network answers come in as arguments. The engine's lint rules (`Math.random`, `Date.now`, framework imports) already apply.

<!-- prettier-ignore -->
| File | Holds | Slice |
| --- | --- | --- |
| `evidence.ts` | Closed lists, `inputEvidenceSchema`, `InputEvidence`, `evidenceId`, `compareEvidence`, `EVIDENCE_SCHEMA_VERSION` | 1a |
| `confidence.ts` | `CONFIDENCE_BASES`, `CONFIDENCE_FACTORS`, `EVIDENCE_FLOOR`, `milli`, `scoreConfidence`, `withinMargin`, `CONFIDENCE_VERSION` | 1a |
| `evidence-strings.ts` | `EVIDENCE_STRINGS` (every key under the spec's "Strings", `th` and `en`), `QUESTION_KEYS` | 1a |
| `leans.ts` | Rules `value-to-lean-1` and `measure-to-lean-1` | 1a |
| `read-page.ts` | `checkAddress`, `parseRobots`, `robotsAllows`, `readPage` over injected ports | 1b |
| `page-text.ts` | `pageTextOf`: the text blocks of the document bytes by rule `html-text-1`, on the same tokenizer as the stylesheet links (§8) | 1b |
| `render-snapshot.ts` | `renderSnapshotSchema` and `rendererBuildSchema`: what the renderer hands the engine, parsed as untrusted data; the `Renderer` port type | 1c |
| `measures/colour.ts` | OKLCH, the quantiser wrapper, hue band through `classifyHex`, warm share, declared colours | 1c |
| `measures/page.ts` | WCAG contrast, text and element density, font families, word count | 1c |
| `url-analyser.ts` | `analyseUrl`: fetched bytes and a snapshot or `null` in, sorted evidence and the not-measured list out | 1c |
| `industry.ts` | `matchIndustryTerms`, `readIndustry`, the `TsicTaxonomy` port | 2 |
| `evidence-feed.ts` | `detectConflicts`, `feedEvidence` | 4 |

**Server-only modules.** The page reader ports (DNS resolution, an HTTP request pinned to a checked address, SHA-256) and the renderer that produces a `RenderSnapshot` are server-only. The engine defines their contracts (`ReadPorts` in §6, `renderSnapshotSchema` in §7) and never imports them. They live in a new server-only package, `packages/page-reader` (§13, ADR 0019).

**What is reused, read-only.** `fingerprintOf` (`resolver.ts`), `interpretWithRules` and `RULE_VALUES` (`interpreter.ts`), `classifyHex` and `hexSchema` (`color-audit.ts`), and `slugSchema` and `PERSONALITY_AXES` (`knowledge.ts`). None of these files changes. `index.ts` gains the new exports.

## 2. The evidence schema (`evidence.ts`)

The schema is strict at every level. An unknown key fails with its path, so `html`, `css`, `screenshot`, `pageText` or `score` cannot be stored (row 2).

```ts
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
export const RULE_IDS = [
  "lexicon-1",
  "value-to-lean-1",
  "measure-to-lean-1",
  "tsic-terms-1",
  "word-count-1",
] as const;
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
```

The five personality targets are written out, not built from `PERSONALITY_AXES`, so zod sees a literal tuple. A test checks that the five equal `PERSONALITY_AXES`, so a sixth axis cannot be added silently.

**Locator** (where in the input). This is a discriminated union, so every locator sorts the same way (§5):

```ts
const locatorSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("text"),
      path: z.string().min(1).max(500),
      start: z.int().min(0),
      end: z.int().min(1),
    })
    .strict()
    .refine((l) => l.end > l.start, "end after start"),
  z.object({ kind: z.literal("element"), path: z.string().min(1).max(500) }).strict(),
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
```

- `path` is an element path such as `html>body>main>h1:nth-of-type(1)`.
- For a declared colour, `path` is `sheet:<stylesheet url>#<rule index>`. The stylesheet is named by its URL, not by its place in the list (row 4).

**Measure.** The unit is fixed by the metric (`MEASURE_UNITS`), and a refine rejects any other unit. The value is bounded per metric:

- 0 to 1 for `area-share` and `warm-share`;
- 0 to 1 for `lightness`;
- 0 to 0.5 for `chroma`;
- 1 to 21 for `contrast-ratio`;
- 0 or more for every other metric.

`hue-family` is the exception. Its value is a band name (`HueFamily` from `color-audit.ts`), not a number.

**Reading.** A discriminated union on `by`:

```ts
const readingSchema = z.discriminatedUnion("by", [
  z
    .object({
      target: readingTargetSchema,
      value: readingValueSchema,
      by: z.literal("rule"),
      rules: z.array(z.enum(RULE_IDS)).min(1).max(4),
    })
    .strict(),
  z
    .object({ target: readingTargetSchema, value: readingValueSchema, by: z.literal("model") })
    .strict(),
]);
```

A refine checks that the shape of `value` fits its `target`:

<!-- prettier-ignore -->
| Target | Value |
| --- | --- |
| `situation.tsic` | `{ code }`: a section letter `A` to `U`, or 2 to 5 digits |
| `situation.name`, `situation.competitors` | `{ name }`: 1 to 60 characters, trimmed |
| `identity-frame.personality.<axis>` | `{ lean: "high" \| "low" }`. A number never fits, so a 0 to 100 value cannot leave the analyser |
| `look-feel.mood` | `{ word }`: a slug until `mood-1` lands in slice 3, which narrows it to the closed list (schema 1.1) |
| `color.current` | `{ hex }`: `hexSchema` |
| `competitive-frame.lineup-candidate` | `{ name, hex, label: "own-input" \| "reference" }` |
| `reference.asset` | `{ asset: "colour", hex }` or `{ asset: "font", family }` |

**Confidence.** The base and factors are stored as `{ id, value }` pairs, so the trace shows the numbers and not only their names (finding F5):

```ts
const confidenceSchema = z
  .object({
    value: z.number().min(0).max(1),
    base: z.object({ id: z.enum(BASE_IDS), value: z.number() }).strict(),
    factors: z
      .array(z.object({ id: z.enum(FACTOR_IDS), value: z.number() }).strict())
      .max(FACTOR_IDS.length),
  })
  .strict();
```

**The item:**

```ts
export const inputEvidenceSchema = z
  .object({
    schemaVersion: z.literal(EVIDENCE_SCHEMA_VERSION),
    id: z.string().regex(/^[0-9a-f]{8}$/),
    analyser: z
      .object({ id: z.enum(INPUT_KINDS), version: z.string().trim().min(1).max(20) })
      .strict(),
    inputKind: z.enum(INPUT_KINDS),
    role: z.enum(INPUT_ROLES),
    source: z
      .object({
        ref: z.string().min(1).max(2048),
        locator: locatorSchema,
        contentHash: z.string().regex(/^[0-9a-f]{64}$/),
        retrievedAt: z.iso.datetime(),
        renderer: rendererBuildSchema.nullable(), // §7; null when nothing in the item rests on a render (finding F10)
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
    basedOn: z.array(z.string().regex(/^[0-9a-f]{8}$/)).max(50),
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
  .strict()
  .superRefine(checkItem);
export type InputEvidence = z.infer<typeof inputEvidenceSchema>;
```

**`checkItem`.** Each check reports at the path row 2 names:

1. `fromModel` true means `model` is not null, and false means `model` is null (path `model`).
2. `fromModel` true means `measure` is null (path `measure`).
3. `hypothesis` true means `hypothesisNote` is a string, and false means it is null (path `hypothesisNote`).
4. A `quote` is allowed only on a `TEXT_KINDS` observation (path `observation.quote`).
5. The base fits the item (path `confidence.base`):
   - `measure` when `reading` is null;
   - `rule-reading` when `reading.by` is `rule`;
   - `model-reading` when `reading.by` is `model`.
6. `fromModel` true means a reading by `model`, unless `reading` is null for an `asset-shown` observation.
7. `single-signal` appears only with base `model-reading`, and `tool-default` only when `reading` is not null (path `confidence.factors`).
8. Factor ids are unique and in ascending order. Each `{ id, value }` equals the table in `confidence.ts`.
9. `confidence.value` equals `scoreConfidence(base.id, factor ids).value`, and `belowFloor` equals its `belowFloor` (paths `confidence.value` and `belowFloor`). This is what makes the number computed, never reported (row 3). An item claiming 0.9 with base 0.7 and no factors fails.
10. Each quality factor has its flag, and each quality flag has its factor (path `flags`). The pairs are `few-words` and `quality.fewWords`, `page-incomplete` and `quality.pageIncomplete`, `image-small` and `quality.imageSmall`, `image-blurred` and `quality.imageBlurred`.
11. `ownedBy: "other"` never targets `color.current` or a personality axis (path `reading.target`, case 3).
12. `id` equals `evidenceId(item)` (path `id`), the fingerprint over the fields the spec's `id` row names (§3). `source.retrievedAt` is not part of the id, so an item whose `retrievedAt` alone was changed still parses with its old id, and an item whose `contentHash` or `renderer` was changed fails here.
13. `source.renderer` fits the observation (path `source.renderer`, finding F10):
    - not null for `colour-area`, `contrast-pair` and `density`, which exist only on a render;
    - null for `colour-declared`, and for any item whose locator path starts with `sheet:`, which rest on the stylesheet bytes alone;
    - either for the other kinds. A `text-span` and the readings that quote it carry the renderer that checked the text was visible, or null when no render checked it (§8, finding F11). A measured lean carries the renderer of the measure it rests on.

Confidence 1.2 still fails first on `max(1)` at `confidence.value`, as row 2 asks.

## 3. The id (`evidenceId`)

```ts
export const evidenceId = (
  item: Pick<InputEvidence, "analyser" | "source" | "observation" | "measure" | "reading">,
): string => {
  const { retrievedAt: _clock, ...source } = item.source; // the clock is not part of the id
  return fingerprintOf({
    analyser: item.analyser,
    source, // ref, locator, contentHash, renderer
    observation: item.observation,
    metric: item.measure?.metric ?? null,
    target: item.reading?.target ?? null,
  });
};
```

- **What the id covers** follows the spec v1.3 `id` row: `analyser`, `source` without `retrievedAt`, `observation`, `measure.metric` and `reading.target`, with `source.renderer` inside `source`. Nothing else.
- `fingerprintOf` is the ADR 0007 decision 5 fingerprint: FNV-1a over canonical JSON with sorted keys, 8 hex digits. The same input gives the same id, whatever the key order of the object passed in.
- **`retrievedAt` is excluded** (finding F3, accepted in spec v1.3; open for the owner at G2). `contentHash` already marks a change in the bytes, so the same bytes read again later keep their ids and a node's evidence list does not grow duplicates. `retrievedAt` stays on the item, for the trace. Row 4's later-clock case proves it: equal ids, and only `retrievedAt` differs. If the owner puts the clock back into the id at G2, this function hashes `item.source` whole and row 4's later-clock case expects new ids instead.
- **Metric and target** are in the id because one colour cluster is one observation with four measures (area share, hue band, lightness, chroma), and one quoted span can carry one measure and one reading. Without them, these items would share an id.
- **The renderer build is in the id**, because it is part of `source` (finding F10). The id covers no measured value, so without the build an area share from one Chromium and a slightly different one from another would carry one id. With it, the two are two items, and neither replaces the other silently. Items that rest on the bytes alone (`renderer: null`) keep one id whichever renderer ran, or none.
- **A shared id is an error, not a drop.** FNV-1a has 32 bits. `analyseUrl` checks that the ids are unique. Two different items with one id return `{ ok: false, error: "id-collision", ids }` and nothing is dropped silently. A unit test drives this check with a stubbed list.

## 4. Confidence (`confidence.ts`), answering S1

```ts
// Every number below is copied from spec "Confidence" (the table, "The floor", industry-margin-1).
export const CONFIDENCE_VERSION = "confidence-1";
export const EVIDENCE_FLOOR = 0.5; // owner decision D3
export const CONFIDENCE_BASES = {
  measure: 1.0,
  "rule-reading": 0.7,
  "model-reading": 0.7,
} as const;
export const CONFIDENCE_FACTORS = {
  "few-words": 0.7,
  "image-blurred": 0.6,
  "image-small": 0.5,
  "page-incomplete": 0.7,
  "single-signal": 0.8,
  "tool-default": 0,
} as const; // keys in ascending order

/** Thousandths, as an integer: the one place a confidence or a lean threshold becomes comparable (thousandths-1). */
export const milli = (x: number): number => Math.round(x * 1000);

/** thousandths-1: sort and dedupe the factors, multiply, round, compare the floor in thousandths. */
export function scoreConfidence(
  base: BaseId,
  factors: readonly FactorId[],
): {
  confidence: Confidence;
  belowFloor: boolean;
};

/** industry-margin-1: compared in thousandths; the margin is the rule's, never an argument. */
export const INDUSTRY_MARGIN_MILLI = 100;
export const withinMargin = (a: number, b: number): boolean =>
  Math.abs(milli(a) - milli(b)) <= INDUSTRY_MARGIN_MILLI;
```

**Rule `thousandths-1`** (spec "Confidence") is how a confidence is computed, rounded and compared; every comparison in the engine goes through `milli`. The implementation choices it leaves to this design:

- `scoreConfidence` sorts the factor ids by code point and drops repeats before it multiplies, so the caller's order never matters.
- The stored value is `milli(product) / 1000`. `Math.round` on a non-negative number is the same in every JavaScript engine, so the stored value is deterministic.
- `belowFloor` is `milli(value) < milli(EVIDENCE_FLOOR)`; the spec's "The floor" says where the boundary falls.
- Tests compare exact numbers (`toBe`), never `toBeCloseTo`. The spec's "Worked examples" list the products and the unrounded doubles that make rounding part of the rule.

**Rule `industry-margin-1`** (spec "Confidence") is `withinMargin`. The margin is a named constant in thousandths, not a parameter, so no caller can pass another number; a change to it is a change to the rule, made in the spec first. The spec's "Worked examples" give the boundary pairs the S1 test (§14) asserts.

**Floor as a constant.** The floor is the owner's number (D3), so it is a constant and not an argument. Each item's `belowFloor` is checked against it by the schema. Where rows 3, 12 and 32 say "a floor of 0.5", a test pins `EVIDENCE_FLOOR` to the spec's value.

**Which factors apply.** The spec's "Which factors slices 1a to 1c use" decides it. In code, for the URL analyser:

- `page-incomplete` goes on every item of a `ReadResult` whose `incomplete` list is not empty (§6).
- `few-words` goes only on readings that rest on the page text (`lexicon-1` readings), decided by `word-count-1` over the text the reading rests on, its block (§8).
- `single-signal`, `image-*` and `tool-default` do not occur in slice 1. Their rows land with slices 3, 5 and 6.

**Changing a number.** A value in either table is part of the contract. A change bumps `CONFIDENCE_VERSION` and the schema's minor version, and it ships with an impact list naming rows 3, 12, 18, 22, 24 and 32.

## 5. Sort order

**Analyser output** (row 4, "sorted by kind, then locator"): `compareEvidence(a, b)` compares these in turn.

1. `observation.kind`, by code point (`byText`).
2. The locator key, compared by code point:
   - `surface|<scope>`;
   - `box|<x>|<y>|<w>|<h>`, numbers zero-padded to 7 digits;
   - `element|<path>`;
   - `text|<path>|<start>|<end>`, start and end zero-padded to 7 digits.
3. The id, as a tiebreak, so the order is total.

`basedOn` and `flags` are sorted by code point. `factors` are sorted by id.

**Industry** (slice 2): the ranking `industry-level-1` names (spec "Industry", Matched level), implemented as `milli(confidence)` descending, then the code by code point, ascending.

**Feed** (slice 4): each node's evidence list is sorted by node number, then by evidence id (spec "How evidence feeds the node graph", rule 5). Questions are sorted by node number, then question key, then the first evidence id.

## 6. The safe read (`read-page.ts`, slice 1b)

```ts
export type ReadPorts = {
  resolve(host: string): Promise<string[]>; // IP literals, server-only
  request(r: {
    url: string;
    address: string;
    headers: Record<string, string>;
    maxBytes: number;
    timeoutMs: number;
  }): Promise<
    | {
        ok: true;
        status: number;
        headers: Record<string, string>;
        body: Uint8Array;
        truncated: boolean;
        remoteAddress: string;
      }
    | { ok: false; error: "timeout" | "network" }
  >;
  sha256(bytes: Uint8Array): string; // lowercase hex
  elapsedMs(): number; // monotonic, for the 30 s budget
};
export type ReadResult =
  | {
      status: "read";
      url: string;
      document: Fetched;
      stylesheets: Fetched[];
      incomplete: IncompleteReason[];
    }
  | { status: "refused"; reason: "read.refused.address" | "read.refused.robots" }
  | { status: "failed"; reason: "timeout" | "network" | "redirects" | "not-html" };
export type Fetched = { url: string; bytes: Uint8Array; contentHash: string; truncated: boolean };
export function checkAddress(ip: string): "public" | "refused";
export function parseRobots(text: string): RobotsRules;
export function robotsAllows(rules: RobotsRules, path: string, token: "oriviloreader"): boolean;
export async function readPage(
  url: string,
  ports: ReadPorts,
  robots?: RobotsCache,
): Promise<ReadResult>;
```

- **Address check.** `readPage` checks every address returned by `resolve` and the `remoteAddress` each answer reports. It does this again after each redirect. One non-public address refuses the whole read. `checkAddress` covers these ranges:
  - IPv4: loopback, the private ranges, link-local, carrier-grade NAT (`100.64/10`), multicast, `0/8`, broadcast and `169.254.169.254`;
  - IPv6: `::1`, `fc00::/7`, `fe80::/10`, `ff00::/8`, and IPv4-mapped addresses, judged as their IPv4 form.
- **Requests.** The request port connects to the address that was checked, so a second DNS answer cannot swap it (DNS rebinding).
- **Bounds.** The document may be 2 MB and each stylesheet 1 MB. Each request has 10 s, and the whole read has 30 s, measured by `elapsedMs`. At most 10 stylesheets and 3 redirects.
- **Headers.** Every request sends `user-agent: OriviloReader/1 (+<contact url>)` and nothing else that identifies the reader. It never sends a cookie or an authorization header.
- **Stylesheet links.** Links are taken from the document with an HTML tokenizer, never with a regular expression. §13 places the tokenizer in the engine (a pinned `parse5`, once researched). The page text (§8) is read with the same parse, so the document is tokenized once.
- **Order.** Stylesheets are fetched in document order. The result keys each one by URL, so the analyser never depends on the order in which the answers arrive (row 4).

## 7. The render snapshot (`render-snapshot.ts`, slice 1c)

The renderer's output is untrusted data that comes from the page, so the engine parses it with a strict, bounded schema. It carries no text: the page text comes from the document bytes (§8).

```ts
export const rendererBuildSchema = z
  .object({
    driver: z.enum(["playwright", "puppeteer-core"]), // closed; a new driver is a minor schema bump
    driverVersion: z.string().regex(/^\d+\.\d+\.\d+$/), // the exact pinned package version
    browser: z.literal("chromium"),
    browserVersion: z.string().regex(/^\d+\.\d+\.\d+\.\d+$/), // four parts, as the browser reports it
  })
  .strict();
export type RendererBuild = z.infer<typeof rendererBuildSchema>;

export const renderSnapshotSchema = z
  .object({
    version: z.literal("1"),
    renderer: rendererBuildSchema,
    viewport: z.object({ width: z.literal(1280), height: z.literal(800) }).strict(),
    firstScreen: rasterSchema, // RGBA, downsampled to 320 x 200
    fullPage: rasterSchema, // RGBA, 320 wide, at most 2000 high
    textBoxes: z.array(textBoxSchema).max(5000), // { path, box, color, backdrop, fontFamily }: each visible element that holds text
    elements: z.array(boxSchema).max(5000), // visible element boxes, for element density
  })
  .strict();

export type Renderer = { render(read: ReadResult & { status: "read" }): Promise<unknown> }; // ADR 0019 decision 1
```

**The renderer build (answer to the architect's first question).** Both the snapshot and every item that rests on it name the build.

- **In the snapshot**, `renderer` is required. The adapter in `packages/page-reader` fills it at run time:
  - `driverVersion` from the driver package's own `package.json`;
  - `browserVersion` from `browser.version()`. Playwright returns the bare four-part number. Puppeteer returns a product prefix (`HeadlessChrome/` or `Chrome/`), which the adapter strips.
  - A constant typed into the adapter is not used. A browser installed at the wrong version then shows in the evidence instead of hiding behind the pin.
- **In the evidence**, `source.renderer` copies the snapshot's build onto every item that rests on the render (§2 check 13). It is in the id (§3).
- **Why both.** The snapshot is discarded after the run (spec, "Kept only as evidence"), so a build named only there would be lost. The evidence list is what ORV-126 nodes keep. A per-run header would not survive the feed either: `feedEvidence` takes items, not runs.
- **Why not `analyser.version`.** The analyser version names our code. The renderer build names a third-party binary that changes on its own schedule. Folding both into one string would collapse two dimensions and hide which one moved.
- **Determinism, restated.** The code part of a result is the same for the same bytes, clock and versions, and the renderer build is one of the versions (finding F10). The POC command (Playwright 1.56.1 and its bundled Chromium) and a later Vercel route (`puppeteer-core` 25.11.0 and Chromium 153.0.8010.36) may give slightly different area shares. This design does not claim they agree, and no test compares them. Items that rest on the bytes alone (declared colours, declared fonts, and the page text when no render checked it) are the same across both.

**Parsing the snapshot.**

- A `textBoxes` path that does not name an element of the tokenized document (§8) is dropped and counted in `snapshot.unmatchedPaths`. The renderer therefore cannot add text or point a quote at something the bytes do not hold.
- A snapshot that fails the schema is a failed render. The analysis runs without it (below), with the reason `snapshot-invalid`. Nothing in it is repaired.
- Images, fonts and scripts are never present, because the read did not fetch them. Every colour measure therefore covers only what CSS paints, and the CLI says so.

**Without a snapshot (option D, ADR 0019 decision 4).** `analyseUrl` accepts `null`:

```ts
export function analyseUrl(
  read: ReadResult & { status: "read" },
  snapshot: unknown | null, // null: no renderer, a failed launch or an exhausted budget
  ctx: AnalyserContext, // role, retrievedAt, the failure reason when snapshot is null
):
  | {
      ok: true;
      evidence: InputEvidence[];
      renderer: RendererBuild | null;
      notMeasured: NotMeasured[];
    }
  | { ok: false; error: "id-collision"; ids: string[] };
export type NotMeasured = {
  what: "colour-area" | "contrast-pair" | "density" | "text-visibility";
  reason: "no-renderer" | "render-failed" | "render-budget" | "snapshot-invalid";
};
```

- **With no snapshot**, the result holds:
  - `colour-declared` items;
  - `font-family` items, one per distinct first family declared in the read stylesheets, each with a `sheet:` locator and no heading or body role;
  - the page text blocks, as `text-span` items, with the `word-count` measure, the `lexicon-1` readings and, in slice 2, the industry match (§8).
- **`notMeasured`** lists `colour-area`, `contrast-pair`, `density` and `text-visibility`, each with the one reason, sorted by `what`. Every item has `renderer: null`. The CLI prints one `read.notMeasured` line per entry, with `{what}` and `{reason}` filled from §9 (finding F12; row 34).
- **With a valid snapshot**, `notMeasured` is empty and `renderer` is the snapshot's build.

## 8. Measures and readings (slice 1c)

**Page text (answer to the architect's second question).** The visible text spans come from the tokenized HTML, with a render or without one. A render only decides which of those blocks count as visible (finding F11).

- **One source of text.** `pageTextOf(documentBytes)` in `page-text.ts` (slice 1b) parses the document with the engine's pinned tokenizer (ADR 0019 decision 6). Scripting is off (`parse5`'s `scriptingEnabled: false`), as in the JavaScript-off render. Both follow the WHATWG parsing rules, so both build the same tree, and an element path from one names the same element in the other.
- **Rule `html-text-1`** is defined in spec "Page text": the block list, the skipped subtrees, the whitespace rule, the body bound, and what a render or its absence changes. `pageTextOf` implements it and returns `TextBlock[]`, `{ path, kind: "title" | "meta" | "heading" | "body", text }` in document order, where `text` is the normalised text that locator offsets index. A change to the rule bumps `analyser.version`.
- **With a snapshot**, `analyseUrl` keeps a body or heading block only when its `path` is among the snapshot's `textBoxes` with a non-empty box. Kept items carry `source.renderer`.
- **Without a snapshot**, every block is kept, every item has `renderer: null`, and `notMeasured` lists `text-visibility` (§7).
- **Why not from the render only.** Option D would then lose the text, the `word-count`, every `lexicon-1` reading and, in slice 2, the industry match. Those need no browser. The bytes are also the only text the engine can check a quote against: the snapshot is untrusted, and the hash covers the bytes, not the render.
- **Why not the render's `innerText`.** CSS `text-transform` and the layout's whitespace rules would make the same bytes read differently per renderer build. Text items would then differ between the command and the Vercel route for reasons that are not in the page.

**Colour.**

- The quantiser makes at most 8 clusters per scope. The proposal is `QuantizerCelebi` from `@material/material-color-utilities`, pinned to an exact version: Apache-2.0, deterministic and model-free (K-0021). The alternative is an in-engine Wu quantiser of about 150 lines; the budget in §12 assumes the dependency.
- Each cluster is one `colour-area` observation, with subject `<hex6>` (for example `ff7a00`) and locator `surface`. It has four items: `area-share`, `hue-family` (`classifyHex`, the ORV-20 band), `lightness` and `chroma` (OKLCH). The area shares of each scope sum to 1, and row 8 checks within 0.001.
- **Warm share** is the area share of clusters in the warm bands `measure-to-lean-1` names (spec "Evidence first"), read from `classifyHex`.
- **Declared colours** come from hex, `rgb()` and `hsl()` values in the stylesheets. Each is a `colour-declared` item with a `hue-family` measure. Any other colour syntax is skipped and counted on the item `colour-declared.skipped`.

**Page.**

- `contrast-ratio`: the WCAG ratio of the body pair, meaning the `color` and `backdrop` pair that covers the most body characters.
- `text-density`: characters of the kept text blocks whose `textBoxes` box meets the first screen, per 1,000 px² of the 1280 x 800 viewport.
- `element-density`: visible elements that intersect the first screen.
- `font-family`: with a snapshot, one item per distinct first computed family (from `textBoxes`) for headings and for body, with an element locator and `source.renderer`. Without one, the declared families described in §7. In both cases the family is lowercased with the quotes removed.
- `word-count`: rule `word-count-1` (spec "Page text"), one `Intl.Segmenter` built once per analysis and counting `isWordLike` segments. Its output depends on the Node version's ICU data (finding F13).

**Personality from the text** (`lexicon-1` with `value-to-lean-1`).

- `interpretWithRules` accepts at most 2,000 characters (`BRIEF_MAX_LENGTH`). Each text block is therefore read on its own. A block longer than 2,000 characters is split at the last whitespace before the limit, and spans are mapped back to the block's offsets.
- Each personality finding becomes one `personality-signal` item. Its subject is the axis, its quote is the finding's exact span, and its locator is `text` with the block path.
- The reading is `{ by: "rule", rules: ["lexicon-1", "value-to-lean-1"] }`. The 0 to 100 value is dropped at this point.
- `not-understood` clauses produce no evidence. A `conflicting` axis in one block yields both readings, unflagged. The flag and the question come from `detectConflicts` in slice 4 under `conflict-question-1` (§9), and until then the report prints `report.conflictsNotChecked`.

```ts
// leans.ts
export type RuleValue = (typeof RULE_VALUES)[keyof typeof RULE_VALUES];
/** value-to-lean-1 (spec "Evidence first"): every RULE_VALUES entry maps to a lean; the "not too" value is the hypothesis. */
export function leanOfValue(value: RuleValue): {
  lean: "high" | "low";
  hypothesis: boolean;
  note: string | null;
};

export type MeasuredLean = {
  axis: "warm" | "expressive";
  lean: "high" | "low";
  metric: "warm-share" | "chroma";
};
/** measure-to-lean-1 (spec "Evidence first"): thresholds compared with milli() under thousandths-1; every result a hypothesis. */
export function leansOfMeasures(m: { warmShare: number; meanChroma: number }): MeasuredLean[];
```

The thresholds live as named constants in `leans.ts`, each with a comment naming `measure-to-lean-1`; the spec's "Worked examples" give the boundary inputs row 11 and the `leans.test.ts` unit cases assert. Each measured lean is one `personality-signal` item:

- its locator is `surface first-screen`;
- `basedOn` names the measure it rests on;
- `hypothesis` is true, with a `hypothesisNote` naming the rule and its threshold, as the spec asks.

## 9. Strings and question keys, answering S2

`evidence-strings.ts` holds two exports. The text of every key is the spec's, word for word, under "Strings"; this section names the keys and where each one sits, not the copy.

```ts
/** Every key under spec "Strings". `{ th, en }` stands for the spec's text, copied word for word. Row 29 reads all of them. */
export const EVIDENCE_STRINGS = {
  // labels on an item
  "evidence.fromModel": { th, en }, // {model}
  "evidence.measured": { th, en },
  "evidence.belowFloor": { th, en }, // {reason}: one of the quality.* strings
  // questions (also in QUESTION_KEYS)
  "evidence.conflict": { th, en }, // {subject}
  "evidence.toolDefault": { th, en },
  "evidence.similarTo": { th, en }, // {brand}
  "culture.yellow": { th, en },
  "culture.political": { th, en },
  "industry.confirm": { th, en },
  // report lines (spec v1.3)
  "industry.byNameOnly": { th, en }, // printed while tsic-terms-1 is the only matcher
  "report.conflictsNotChecked": { th, en }, // printed until detectConflicts ships (slice 4)
  // refusals and the not-measured line
  "read.refused.robots": { th, en },
  "read.refused.address": { th, en },
  "read.notMeasured": { th, en }, // {what}, {reason}
  "read.notRendered.none": { th, en }, // reason no-renderer
  "read.notRendered.failed": { th, en }, // reason render-failed
  "read.notRendered.budget": { th, en }, // reason render-budget
  "read.notRendered.invalid": { th, en }, // reason snapshot-invalid
  // {what} labels for read.notMeasured: keys suggested here; slice 1c fixes them and drafts the copy
  "read.notMeasured.what.colourArea": { th, en }, // NotMeasured.what colour-area
  "read.notMeasured.what.contrast": { th, en }, // contrast-pair
  "read.notMeasured.what.density": { th, en }, // density
  "read.notMeasured.what.textVisibility": { th, en }, // text-visibility
  // reasons below the floor
  "quality.fewWords": { th, en },
  "quality.pageIncomplete": { th, en },
  "quality.imageSmall": { th, en },
  "quality.imageBlurred": { th, en },
} as const satisfies Record<string, { th: string; en: string }>;

/** The keys a flag's questionId may hold (spec row 29). A subset of EVIDENCE_STRINGS. */
export const QUESTION_KEYS = [
  "evidence.conflict",
  "evidence.toolDefault",
  "evidence.similarTo",
  "culture.yellow",
  "culture.political",
  "industry.confirm",
] as const;
```

- **Where the v1.3 strings sit.** `industry.byNameOnly`, `report.conflictsNotChecked`, `read.notMeasured`, the four `read.notRendered.*` reasons and the four `{what}` labels are report lines, not questions: they go in `EVIDENCE_STRINGS` only. `QUESTION_KEYS` keeps the six keys spec row 29 lists, because nothing asks the person to answer a "not measured" line.
- **The maps from the result to a line.** `NotMeasured.reason` to its `read.notRendered.*` key and `NotMeasured.what` to its `{what}` label are two closed `Record`s in `evidence-strings.ts`, typed on the `NotMeasured` unions of §7, so a new reason or a new `what` fails the typecheck until it has a string.
- **Who prints the report lines.** `industry.byNameOnly` from slice 2, while `tsic-terms-1` is the only industry matcher (spec "Industry", Match terms). `report.conflictsNotChecked` from slice 2 until slice 4 ships `detectConflicts` (spec case 1). `read.notMeasured` from slice 1c, one line per `notMeasured` entry (row 34).
- **The `{what}` keys** are this design's suggestion, matched to the `NotMeasured.what` values. The spec leaves naming them to slice 1c, which drafts their Thai and English for the designer's and the owner's review; row 29 covers them once they land.

**One key per conflict, chosen by target.** Rule `conflict-question-1` (spec "The six cases", case 1) decides which question a conflict asks. In code it sets the flag on both items: `{ key: "conflict", questionId: "industry.confirm" }` for a conflict on `situation.tsic`, `{ key: "conflict", questionId: "evidence.conflict" }` for any other target. One conflict is about one target, so an item never carries both.

## 10. Slice 2 and slice 4 signatures

```ts
// industry.ts (slice 2)
export interface TsicTaxonomy {
  // satisfied by ORV-127 slice 1's module
  readonly version: string;
  node(
    code: string,
  ):
    { code: string; level: 1 | 2 | 3 | 4 | 5; section: string; th: string; en: string } | undefined;
  isBrandRelevant(code: string): boolean;
}
/** tsic-terms-1 (spec "Industry", Match terms): match terms from the module's names, matched as lexicon-1 matches. */
export function matchIndustryTerms(
  blocks: readonly TextBlock[], // html-text-1 blocks (§8)
  ctx: AnalyserContext,
  taxonomy: TsicTaxonomy,
): InputEvidence[];
export type IndustryReading =
  | { status: "awaiting-taxonomy" }
  | { status: "no-signal"; invalid: InvalidCode[] }
  | {
      status: "matched";
      code: string;
      level: 1 | 2 | 3 | 4 | 5;
      th: string;
      en: string;
      confidence: number;
      evidenceIds: string[];
      rolledUpFrom: string[];
      alternatives: { code: string; confidence: number }[];
      invalid: InvalidCode[];
    }
  | {
      status: "ambiguous";
      question: "industry.confirm";
      choices: { code: string; confidence: number; evidenceIds: string[] }[];
      invalid: InvalidCode[];
    };
export type InvalidCode = { code: string; reason: "invalid-code"; evidenceIds: string[] };
export function readIndustry(
  evidence: readonly InputEvidence[],
  taxonomy: TsicTaxonomy | null,
): { reading: IndustryReading; evidence: InputEvidence[] };
```

`readIndustry` works in this order:

1. It returns `awaiting-taxonomy` when `taxonomy` is null (row 16).
2. It drops unknown and non-brand-relevant codes into `invalid` (spec "Industry", Check; row 15).
3. It applies rule `industry-level-1` (spec "Industry", Matched level): which readings count, a candidate's confidence, the ranking (§5), when the top code wins (row 33), when it rolls up (row 14) and when it asks. The margin test is `withinMargin`, rule `industry-margin-1` (§4).
4. The roll-up's "deepest common ancestor" is computed as the longest common prefix of the two codes cut to a TSIC level length, or the section when only the section agrees; the spec's "Worked examples" give the cases. `rolledUpFrom` lists both codes.
5. An `ambiguous` result flags both items under `conflict-question-1` (§9).

The id does not cover flags, so flagging does not change an id.

```ts
// evidence-feed.ts (slice 4)
export const TARGET_NODE: Record<ReadingTarget, NodeId>; // the spec's feed table
export function detectConflicts(items: readonly InputEvidence[]): InputEvidence[];
export function feedEvidence(
  state: BrandState,
  items: readonly InputEvidence[],
): {
  state: BrandState;
  questions: { node: NodeId; questionId: QuestionKey; evidenceIds: string[] }[];
  unmapped: string[];
};
```

`feedEvidence` is pure: it returns a new state and leaves the old one untouched. It follows the spec's feed rules 1 to 5:

- it never changes a node's status or an input;
- items below the floor are listed with their reasons, and count as no support;
- the lists are sorted as in §5.

## 11. Impact list

<!-- prettier-ignore -->
| What | Change | Who reads it |
| --- | --- | --- |
| `inputEvidenceSchema` 1.0 (new contract) | New | Every ORV-126 node's `evidence` list; every later analyser (slices 2 to 7); the CLI report |
| `source.renderer` and check 13 (task 2) | New field in `source`, so in the id. Rendered items name the build; byte-only items carry `null` | Spec field table (F10); `user-html` (slice 5), which renders too; `mood-photo` and `other-brand-ci` set `null`; `feedEvidence` (slice 4) keeps items from two builds as two items |
| `renderSnapshotSchema` 1 and `Renderer` port (new contract) | `renderer` build required; `textBoxes` without text replaces text blocks | `packages/page-reader` (ADR 0019): `render-playwright.ts` now, `render-chromium.ts` later, each fills the build at run time |
| `analyseUrl` | Accepts `null` for the snapshot and returns `notMeasured` | The CLI in `packages/page-reader`; a later Vercel route, which runs option D until ADR 0019's measurement |
| `html-text-1` (`page-text.ts`) | New rule: the page text always comes from the document bytes | Rows 9, 10 and 12; slice 2's `matchIndustryTerms`, whose `TextBlock` is this rule's block |
| `evidenceId` (task 3) | Hashes `source` without `retrievedAt`, as the spec v1.3 `id` row says (§3). A re-read of unchanged bytes keeps its ids | Row 4 (later-clock case); `feedEvidence` (slice 4), whose lists no longer gain duplicates on a re-read; the owner at G2, who may put the clock back (then row 4 expects new ids) |
| `EVIDENCE_STRINGS` (task 3) | Every key under spec v1.3 "Strings": adds `industry.byNameOnly`, `report.conflictsNotChecked`, `read.notMeasured`, the four `read.notRendered.*` reasons and four suggested `{what}` label keys (§9). `QUESTION_KEYS` unchanged at six | Designer and owner review of the copy; the CLI (slices 1c and 2); row 29 |
| Rule names (task 3) | §4, §8, §9 and §10 name `thousandths-1`, `industry-margin-1`, `conflict-question-1`, `industry-level-1`, `html-text-1`, `word-count-1`, `measure-to-lean-1`, `value-to-lean-1` and `tsic-terms-1` and point to the spec's section; `withinMargin` loses its `margin` parameter | Builders of slices 1a, 1b, 1c and 2 |
| ORV-126 state, node record `evidence` field | Must hold input evidence beside proxy answers and references: an entry `{ kind: "input", item: InputEvidence }` in a discriminated union, sorted by node number then id. ORV-126 has no code yet, so its slice 1 defines the union with this member. No ORV-126 rule reads the items | ORV-126 slice 1 builder; `feedEvidence` (slice 4); rows 19, 22 and 24 |
| ORV-20 colour node (`color-audit.ts`, `color-rules.ts`, `color-knowledge.ts`) | Untouched. `classifyHex` and `hexSchema` are imported read-only; `auditLineup` and `decideColor` take no evidence argument. The G3 packet shows an empty `git diff origin/develop -- packages/intent-engine/src/color-*.ts` | ORV-20 owners |
| ADR 0008 | Addition: a computed confidence number for input evidence (D6 a). Decision 2 and the brief `interpretationSchema` are unchanged, and a brief finding still cannot carry a confidence | Every adapter author |
| `resolver.ts`, `interpreter.ts`, `knowledge.ts` | Imported read-only; no change | None |
| `index.ts` | New exports | Engine consumers |
| `packages/intent-engine/package.json` | `@material/material-color-utilities` pinned exact (slice 1c, if accepted); `parse5` pinned exact (slice 1b, if §13 places link extraction in the engine) | `security` review (supply chain) |
| Profiles, recipes, components, screens | None. No token, recipe, component or screen changes, and `pnpm contrast` output is unchanged (row 31) | None |

## 12. Budget: slice 1 does not fit 400 lines

These are estimates of production lines, without tests or fixtures:

<!-- prettier-ignore -->
| Part | Files | Lines | Rows |
| --- | --- | --- | --- |
| 1a schema, confidence, strings, lean rules | `evidence.ts` 150, `confidence.ts` 60, `evidence-strings.ts` 85 (the v1.3 keys and the two maps of §9 added), `leans.ts` 45, `index.ts` 5 | about 345 | 1, 2, 3, 32, 29 to 31 (and unit tests for `value-to-lean-1` and `measure-to-lean-1`) |
| 1b safe read and page text | `read-page.ts` 300 (address 80, robots 80, read 140), tokenizer wrapper and link extraction 20, `page-text.ts` 80 | about 400 | 5, 6, 7, 36, 29 to 31 |
| 1c renderer contract, measures, URL analyser | `render-snapshot.ts` 60, `measures/colour.ts` 120 (declared fonts added), `measures/page.ts` 70, `url-analyser.ts` 150 (the not-measured path added, text extraction moved to 1b) | about 400 | 4, 8 to 12, 34, 35, 37, 29 to 31 |
| 1c, server-only: `packages/page-reader` | `node-ports.ts`, `render-playwright.ts`, `cli.ts` (§13) | about 150 | 34 (budget test), 35 and 37 (renderer tests); the live smoke in the G3 packet |

The total is about 1,145 lines with the server-only part outside it, or about 1,295 with it. The rows per slice are the spec's "Delivery" table. **Three PRs, 1a, 1b and 1c** (finding F1, accepted in spec v1.3).

- 1a and 1b do not wait on the renderer decision.
- 1c waits on ADR 0019's POC part (§13).
- `security` reviews 1b and 1c (outside reads, `parse5`, `playwright`).

**Slice 1c's size** (spec "Open questions", default). 1c ships the engine part and `packages/page-reader` together, about 550 production lines by the table above. Only if the diff runs well over about 400 lines does `packages/page-reader` move to its own PR right after 1c, carrying row 35's and row 37's renderer tests and row 34's budget test ("out of budget falls back to declared colours"). The engine part of 1c then still ships rows 4, 8 to 12, the engine halves of 34 and 35, and 29 to 31, with `analyseUrl` tested on recorded snapshots; ADR 0019's POC part is accepted only when the PR that carries the renderer tests merges.

## 13. Renderer and fetcher placement (architect)

Decided in ADR 0019 (proposed), on K-0081 (0.8). Summary for this design:

- **Where.** A new server-only package, `packages/page-reader` (`@orivilo/page-reader`, Node only). It holds `node-ports.ts` (`ReadPorts` on `node:dns/promises`, `node:http`/`node:https` connected to the checked address, `node:crypto`, `performance.now()`), `render-playwright.ts` and `cli.ts` (`pnpm analyse:url`). The engine defines a `Renderer` port, `render(read) => Promise<unknown>`, whose result it parses with `renderSnapshotSchema`, and never imports the package. `apps/web` does not depend on it in the POC.
- **POC renderer.** Playwright pinned exactly at `1.56.1`, the version `packages/design-system` already pins, as a dev dependency, with its own bundled Chromium, on the machine that runs the command. No Vercel function launches a browser in the POC.
- **The renderer never fetches.** It gets the document and stylesheet bytes `readPage` read. Every browser request is intercepted: those URLs are answered from memory, all others are aborted. JavaScript is off; one fresh context per analysis, closed in a `finally`; viewport 1280 x 800; the render uses what is left of the read's 30 s budget by the same `elapsedMs`.
- **Fallback (option D).** No renderer, a failed launch or an exhausted budget: the analysis runs on the read bytes and gives declared colours and declared font families only. The report lists area share, contrast and density as "not measured: the page was not rendered". Nothing from CSS alone is shown as a rendered measure.
- **Vercel, later slice (option B).** `@sparticuz/chromium` pinned at `153.0.0` with `puppeteer-core` pinned at `25.11.0` (Puppeteer's table pairs it with Chromium 153.0.8010.36, K-0081), Node.js runtime on Node 24.x, `maxDuration` on the route, the same interception rules. Until the staging measurement in ADR 0019's Confirmation line (bundle under 250 MB; 20 analyses of a 10-stylesheet page, 10 cold, each within 30 s and under 1600 MB rss) is recorded, the route runs option D. Options A (pack fetched by URL at cold start) and C (Playwright with an outside Chromium, 156 expected against 153) are not chosen.
- **Tokenizer (§6).** In the engine, pure and pinned, because 1b reads links before any renderer exists and option D has none. `parse5` is the candidate; 1b adds it after a `research` entry records its licence, version and dependencies.

Open points this placement raises, for the owners named:

- `ds-architect`: should `renderSnapshotSchema` or the evidence source name the renderer build (driver and Chromium version)? The POC and a later Vercel route render with different Chromium builds, so area shares may differ slightly between them.
- `ds-architect`: under option D, are visible text spans also taken from the tokenized HTML, or only from a render?
- Implementer at 1c: the command needs a TypeScript runner. The engine's extensionless imports do not run under Node's type stripping; a pinned runner would be a new dev dependency that needs an entry and a `security` review.
- Rule owner: `.claude/rules/security.md` does not list `packages/page-reader/**` in its paths.

Tests that prove the placement (slice 1c, in `packages/page-reader`, local fixtures only, no network, ADR 0009 point 8):

<!-- prettier-ignore -->
| Test | Asserts | Break it |
| --- | --- | --- |
| "no request leaves the renderer" | A fixture page with an outside image, font, script and iframe URL records zero outgoing requests; only the read URLs are answered | Let unmatched requests continue: red |
| "scripts never run" | A fixture whose inline script repaints the background keeps the CSS colour in the snapshot | Turn JavaScript on: red |
| "fresh context per analysis" | A cookie or storage item set during the first render is absent in the second | Reuse the context: red |
| "out of budget falls back to declared colours" | With `elapsedMs` past 30 s, the result has `colour-declared` items, no `colour-area`, and the report's "not measured" line | Drop the fallback: red |
| "the engine never imports the reader" | No file under `packages/intent-engine/src` imports `@orivilo/page-reader` or a `node:` module | Add such an import: red (lint rule) |

## 14. Tests that prove determinism and conflicts

Each test names its "break it" check: the change to the code that must turn it red before handoff. Row numbers are spec v1.3's; S1 is the boundary test of `industry-margin-1`. The Slice column follows the spec's "Delivery"; "(page-reader)" marks the tests that move with `packages/page-reader` if 1c splits (§12).

<!-- prettier-ignore -->
| Row | Test | Asserts | Break it | Slice |
| --- | --- | --- | --- | --- |
| 1 | `evidence.test.ts` › "a valid item" | Items at each bound parse: a 300-character quote; confidence 0 (`tool-default`) and 1 (`measure`, no factors); an empty `basedOn`; a `fromModel` item with `model`. `JSON.parse(JSON.stringify(x))` parses and is deep-equal. `evidenceId(x) === x.id` | Loosen `max(300)` to 299: red | 1a |
| 2 | `evidence.test.ts` › "bounds and forbidden fields" | One case per bad field, each asserting the issue path: `html`, `css`, `screenshot`, `pageText`, `score` (zod reports `unrecognized_keys` at the root with the key in `keys`; the test asserts the key), `measure`, `model` (both directions), `observation.quote`, `confidence.value`, `observation.kind`, `reading.target`, `hypothesisNote`. Added: a confidence value that is not the computed one (0.9 with base 0.7) fails at `confidence.value`; a `rule-reading` base on a measure-only item fails at `confidence.base`; an id that is not `evidenceId` fails at `id`; an item whose `contentHash` or `source.renderer` was changed after the id was computed fails at `id`, and one whose `retrievedAt` alone was changed still parses (§3) | Remove `.strict()` or one `checkItem` clause: that case goes red. Hash `item.source` whole in `evidenceId`: the `retrievedAt` case goes red | 1a |
| 2 | `evidence.test.ts` › "the renderer fits the observation" | A `colour-area` item with `source.renderer: null` fails at `source.renderer`; a `colour-declared` item with a build fails there too; a `text-span` parses both ways; a build with `browserVersion` "153" (one part) fails | Drop check 13: the first two cases go red | 1a |
| 3 | `evidence.test.ts` › "confidence is computed, never reported" | `scoreConfidence("measure", ["page-incomplete"])` is `{ value: 0.7 }`, not below the floor. `scoreConfidence("model-reading", ["single-signal", "few-words"])` is 0.392, below the floor. Factors are listed in id order with their values. `EVIDENCE_FLOOR === 0.5`. Values as the spec's `thousandths-1` worked example prints them | Return the unrounded product: `toBe(0.392)` goes red (0.39199999999999996) | 1a |
| 32 | `evidence.test.ts` › "one mild factor stays, two fall" | Under `thousandths-1`: 0.56 not below; 0.49 below; 0.392 below; `image-small` on a measure gives 0.5, not below. Every permutation of the factor list gives the same value | Change `<` to `<=` in the floor check: the 0.5 case goes red. Drop the factor sort: the permutation case is red if any order differs | 1a |
| S1 | `evidence.test.ts` › "the margin is in thousandths and inclusive" | `industry-margin-1`, inputs from its worked example: `withinMargin(0.7, 0.6)` and `withinMargin(0.8, 0.7)` are true; `withinMargin(0.7, 0.599)` is false; `withinMargin(0.9, 0.6)` is false; `withinMargin(0.7, 0.65)` is true | Compare raw differences (`a - b <= 0.1`): the 0.8 and 0.7 case goes red | 1a |
| 29 | `evidence.test.ts` › "every string is Thai and English" | Every key of `EVIDENCE_STRINGS` (all of spec "Strings", the v1.3 keys `industry.byNameOnly`, `report.conflictsNotChecked`, `read.notMeasured`, the four `read.notRendered.*` and, from 1c, the four `{what}` labels among them) and every `QUESTION_KEYS` entry has non-empty `th` and `en`, with no U+2014 and no U+00B7. `QUESTION_KEYS` equals the six keys of row 29, each a key of `EVIDENCE_STRINGS`. Every `NotMeasured.reason` and every `NotMeasured.what` maps to a key that exists | Add a key with an empty `th`: red. Delete `read.notRendered.budget`: the map case goes red (and the typecheck) | 1a, each |
| 30 | `evidence.test.ts` › "measures never call a model" | Source scan of the engine modules spec row 30 lists for imports of `openrouter`, `llm-interpreter`, `@orivilo/page-reader` and any `node:` module, and for `Math.random` and `Date.now`. The test name lists the forms it blocks: single-line import, multi-line import, side-effect import, dynamic `import()`, `export ... from`. One failing fixture per form (L-0024) | Feed each fixture: each red. Add `import "node:dns"` to `url-analyser.ts`: red | 1a, each |
| 5 | `read-page.test.ts` › "public addresses only" | Each URL in row 5 gives `refused` with `read.refused.address`. The fake network log has no request to a non-public address. A fake `request` that reports a private `remoteAddress` after a public resolve is refused | Skip the `remoteAddress` re-check: the last case goes red | 1b |
| 6 | `read-page.test.ts` › "robots.txt first" | As row 6. The fake log shows `/robots.txt` before any page request, and no page request on a refusal | Treat 503 as "no rules": red | 1b |
| 7 | `read-page.test.ts` › "one page, logged out, bounded" | As row 7, from the fake log: headers, user agent, 10 stylesheets, 2 MB cut with `incomplete`, no 4th redirect, no image, font or script URL, no other page | Raise the stylesheet cap to 12: red | 1b |
| 36 | `page-text.test.ts` › "html-text-1" | A fixture with `script`, `style`, `template`, `svg`, a `hidden` element, an `aria-hidden="true"` element and a `noscript` gives blocks for the title, the meta description, the headings, the body and the `noscript` only, in document order, with the whitespace rule; body text stops at 5,000 characters on whitespace; equal bytes give deep-equal blocks. `word-count-1` on "อยากให้สนุก" gives 3 where splitting on spaces gives 1, on the Node version the slice records (F13) | Drop the `hidden` skip: red. Parse with `scriptingEnabled: true`: the `noscript` case goes red. Count by `split(" ")`: the Thai case goes red | 1b |
| 4 | `url-analyser.test.ts` › "same input, same evidence" | Run twice on the same recorded bytes, snapshot and `retrievedAt`: deep-equal results and equal ids. Run with the stylesheet answers in reversed order: deep-equal. The list equals itself sorted with `compareEvidence`. Run again with a later `retrievedAt`: equal ids, and the two results differ only at `source.retrievedAt` | Sort by array position instead of the locator key, or key stylesheets by index: red. Hash `retrievedAt` into the id: the later-clock case goes red | 1c |
| 8 | `url-analyser.test.ts` › "measures by code" | As row 8. For each scope, the `area-share` values of the `colour-area` items sum to 1 within 0.001; each cluster subject has a `hue-family` item equal to `classifyHex` | Drop a cluster from the output: the sum goes red | 1c |
| 9 | `url-analyser.test.ts` › "kept only as evidence" | Every result parses with `inputEvidenceSchema`; the serialized result contains no `<html`, no `{` from CSS and no raster bytes; each quote equals the `html-text-1` text of the document bytes at its span; `contentHash` equals `createHash("sha256")` of the recorded bytes (in the test); the analyser takes no file system port | Quote the whole block instead of the span: red | 1c |
| 9 | `url-analyser.test.ts` › "the snapshot cannot add text" | A `textBoxes` path that is not in the tokenized document is dropped and counted in `snapshot.unmatchedPaths`; no quote comes from it; a block whose path is missing from `textBoxes` is not kept | Keep blocks without a box: red | 1c |
| 10 | `url-analyser.test.ts` › "rule-based personality from page text" | As row 10, with readings `{ lean }` and `rules: ["lexicon-1", "value-to-lean-1"]`; the "not too premium" item has `hypothesis: true` and the note; no item holds a number from 0 to 100 at `reading.value` | Map 40 to `high`: red | 1c |
| 11 | `url-analyser.test.ts` › "measured leans are hypotheses" | As row 11; `basedOn` equals the id of the `warm-share` item | Remove `hypothesis` from measured leans: the schema refine and the test go red | 1c |
| 12 | `url-analyser.test.ts` › "low quality lowers confidence" | As row 12. The `lexicon-1` reading is exactly 0.343 under `thousandths-1`, below the floor, with factors `few-words` and `page-incomplete` and flags `quality.fewWords` and `quality.pageIncomplete`. Colour measures carry `page-incomplete` only (0.7) | Apply `few-words` to measures: the colour measure case goes red | 1c |
| 34 | `url-analyser.test.ts` › "no snapshot: declared colours and the page text" | `analyseUrl(read, null, ctx)` returns `colour-declared`, `font-family` with `sheet:` locators, `text-span` items and `lexicon-1` readings; no `colour-area`, `contrast-pair` or `density`; every item has `renderer: null`; `notMeasured` lists the four entries with reason `no-renderer`, sorted; a second run is deep-equal | Take text only from a snapshot: the `text-span` case goes red. Drop `text-visibility` from `notMeasured`: red | 1c |
| 34 | `url-analyser.test.ts` › "a bad snapshot runs as option D" | A snapshot with an extra key, or 5,001 `textBoxes`, gives the option D result with reason `snapshot-invalid`, not an error and not a partial render; `notMeasured` lists the four entries with that reason; every item has `renderer: null` | Repair the snapshot by stripping the key: red | 1c |
| 34 | `packages/page-reader` › "out of budget falls back to declared colours" | With a fake clock past the 30 s budget before the render, the result has `colour-declared` items and no `colour-area`, and `notMeasured` holds the four entries with reason `render-budget`. The CLI on a read with no renderer prints one `read.notMeasured` line per entry, with the `{what}` label and the `read.notRendered.none` text, Thai and English | Drop the fallback: red. Print the reason code instead of its string: the CLI case goes red | 1c (page-reader) |
| 35 | `url-analyser.test.ts` › "the renderer build is part of the source" | Same bytes, two snapshots with identical rasters and boxes that differ only in `renderer`: every `colour-area` id differs between the two runs; every `colour-declared` id is equal; each rendered item's `source.renderer` deep-equals its snapshot's | Leave `renderer` out of `source`: the first case goes red (the ids are equal) | 1c |
| 35 | `packages/page-reader` › "the renderer's paths match the tokenizer" | A local fixture rendered by Playwright 1.56.1: every `textBoxes` path names an element of `pageTextOf`'s tree, and `snapshot.unmatchedPaths` is 0; the snapshot's `renderer.driverVersion` is `1.56.1` and its `browserVersion` has four parts | Build paths without `:nth-of-type`: red | 1c (page-reader) |
| 37 | `packages/page-reader` › "no request leaves the renderer" | A local fixture with an outside image, font, script and iframe URL records zero requests leaving the process; only the read URLs are answered, from memory | Let unmatched requests continue: red | 1c (page-reader) |
| 37 | `packages/page-reader` › "scripts never run" | A fixture whose inline script repaints the background keeps the CSS colour in the snapshot | Turn JavaScript on: red | 1c (page-reader) |
| 37 | `packages/page-reader` › "fresh context per analysis" | A cookie set during the first of two renders is absent in the second | Reuse the context: red | 1c (page-reader) |

Slice 1 has no cross-item conflict: conflicts land with slices 2 and 4 (rows 14, 22 and 33). Slice 1 proves the two contract conflicts it owns:

- the schema refuses contradictory items instead of repairing them (row 2: `fromModel` against `model` and `measure`, a reported confidence against the computed one);
- the margin rule is exact at its boundary (S1 test);
- an item that claims a render it cannot have, or hides the render it rests on, is refused (check 13), and a bad snapshot is reported as a failed render, never repaired.

Each refusal returns an error with a path; nothing is changed silently.

Determinism is proved by row 4 (same bytes, snapshot and clock give deep-equal results; a later clock keeps every id), row 35 (the renderer build moves rendered ids and leaves byte-only ids alone), row 36 (equal bytes give equal blocks and counts on the recorded Node version) and rows 3 and 32 (every factor order gives the same value).

## Findings for the spec

F1 to F12 were raised against spec v1.2. Spec v1.3 takes all twelve, accepted by the orchestrator under ADR 0012 decision 4 and open for the owner at G2 (spec "Owner decisions" says where each lands); this design now follows v1.3. One status changed with it: F3's "row 4 holds either way" no longer holds, because row 4 now asserts equal ids under a later clock; if the owner puts `retrievedAt` back, row 4's later-clock case expects new ids (§3). F13 and F14 are raised against v1.3.

<!-- prettier-ignore -->
| # | Where in spec v1.2 | Finding | Proposed change |
| --- | --- | --- | --- |
| F1 | "Delivery", slice 1 and the split note | Slice 1 is about 1,115 production lines (§12). A split into 1a and 1b leaves 1b at about 800 | Split into 1a (schema, confidence, strings, lean rules), 1b (safe read and page text) and 1c (renderer contract, measures, URL analyser), keeping rows 1 to 12 and 29 to 32 |
| F2 | "Hypotheses", `measure-to-lean-1`; row 11 | The rule names its axes but no thresholds and no warm bands | Warm bands `red`, `orange` and `yellow`. Warm `high` at warm share 0.5 or more, and no warm `low` in `-1`. Expressive `high` at area-weighted mean OKLCH chroma 0.10 or more, `low` at 0.02 or less. Each is a hypothesis listed in "Hypotheses" |
| F3 | Field table, `id` | Over `analyser`, `source` and `observation` alone, the four measures of one colour cluster, or a measure and a reading on one span, share an id. Including `source.retrievedAt` also gives a re-read of unchanged bytes new ids, so a node's evidence list grows duplicates | The id covers `analyser`, `source` without `retrievedAt` (`contentHash` already marks a change), `observation`, `measure.metric` and `reading.target`. This design assumes the metric and target. Keeping `retrievedAt` is the owner's call; row 4 holds either way |
| F4 | Case 1 (line 90), S2 | Case 1 says a conflict asks `evidence.conflict`, while "Industry" and row 14 say `industry.confirm` | Case 1: a conflict on `situation.tsic` asks `industry.confirm`; any other target asks `evidence.conflict`. One question per conflict (§9) |
| F5 | "Confidence", S1; field `confidence` | The spec has no rounding rule. `base` and `factors` are named, but their shape is not | Add the §4 rule: round to 3 decimals; compare the floor and the margin in thousandths; exactly 0.1 apart is within. `base` and each factor are `{ id, value }`; `reading` carries `rules` when `by` is `rule`. Also name the locator union (§2) and the `lineup-candidate` label |
| F6 | `few-words`, "fewer than 20 words" | The spec does not say how to count Thai text, which has no spaces. A whitespace count would mark most Thai pages `few-words` | Rule `word-count-1`: the word-like segments of `Intl.Segmenter("th", { granularity: "word" })`. The ICU data version is part of "same versions", so the Node version is pinned in `engines` |
| F7 | Delivery, slice 4 "cross-analyser conflicts" | Two blocks of one page can give opposite leans on one axis. Slice 1 has no conflict detection, so the slice 1 report shows both, unflagged | Slice 4's `detectConflicts` covers conflicts within one analyser too. The CLI (slice 2) prints "conflicts are not checked yet" until slice 4 |
| F8 | Row 13, `readIndustry(evidence, taxonomy)` | Evidence holds only quotes that a reading rests on, never the page text, so `readIndustry` cannot find a match term on its own | Name matching runs in the analyser as `matchIndustryTerms(blocks, ctx, taxonomy)`. Row 13's "When" becomes "the URL analyser with the taxonomy, then `readIndustry`" |
| F9 | Reading targets, `look-feel.mood`; row 20 | `look-feel.mood` needs `mood-1`, which slice 3 drafts | Slice 1 types the mood word as a slug; slice 3 narrows it to `mood-1` as schema 1.1, with a migration that drops any item outside the list to `not-understood` |
| F10 | Field table, `source`; "Rules and bounds", "Determinism" | ADR 0019 renders with two Chromium builds (Playwright 1.56.1's own now, Chromium 153.0.8010.36 through `puppeteer-core` 25.11.0 later). Area shares may differ slightly between them. The spec's `source` does not name the renderer, and "same bytes and clock" does not cover the browser | `source` gains `renderer`: `{ driver, driverVersion, browser, browserVersion }` or `null`, filled from the running browser, part of the id (§2, §3, §7). "Determinism" reads "the same bytes, clock and versions, the renderer build among them". No claim that two builds agree |
| F11 | Analyser 1, "By code", "the visible text"; row 9 | The spec does not say where the text comes from. Under option D there is no render, so "visible" cannot be checked, and text taken from a render only would lose the word count, the `lexicon-1` readings and the industry match | The text always comes from the document bytes by rule `html-text-1` (§8). A render only filters it to the visible blocks. Without a render, `notMeasured` lists `text-visibility`. Row 9's quote check compares against the `html-text-1` text |
| F12 | "Strings"; ADR 0019 decision 4 | ADR 0019 requires a "not measured: the page was not rendered" line with a reason, and the spec has no key for it | Add for review by the designer and the owner. `read.notMeasured`: en "Not measured: {what}. The page was not rendered ({reason})."; th "ไม่ได้วัด: {what} เพราะไม่ได้แสดงผลหน้าเว็บ ({reason})". Reasons: `read.notRendered.none` en "no renderer is set up", th "ยังไม่ได้ตั้งค่าตัวแสดงผล"; `read.notRendered.failed` en "the renderer did not start", th "ตัวแสดงผลเริ่มทำงานไม่สำเร็จ"; `read.notRendered.budget` en "the page took too long", th "หน้าเว็บใช้เวลานานเกินไป"; `read.notRendered.invalid` en "the renderer's result could not be used", th "ใช้ผลจากตัวแสดงผลไม่ได้". `{what}` takes one of four labels (colour areas, contrast, density, text visibility), with keys named at 1c. Row 29 covers them all |

<!-- prettier-ignore -->
| # | Where in spec v1.3 | Finding | Proposed change |
| --- | --- | --- | --- |
| F13 | "Page text", `word-count-1` ("the Node version is pinned in `engines`"); "Worked examples" ("runs as is with `node` 24", "None of them was run"); row 36 | The Node version is not pinned: the root `package.json` says `"node": ">=22"`, and CI reads `.nvmrc`, which holds `22`. The worked examples were run by the main session on Node 22.23.0 (ICU 78.2), not on 24, while ADR 0019's later Vercel route runs Node 24.x. `Intl.Segmenter` data comes with the Node build, so row 36's count and every `few-words` decision may differ between the command, CI and that route | Slice 1b pins one Node line in `engines` and `.nvmrc` together and records `process.versions.node` and `process.versions.icu` beside row 36's count in its G3 packet. The spec's "Worked examples" says the Node version they were run on (22.23.0). Whether the Vercel route may run another Node line, and so another ICU, is decided in that route's slice, where `word-count` items would then differ as rendered items do across builds |
| F14 | "Open questions", slice 1c's size; ADR 0019 status ("accepted when ORV-128 slice 1c merges") | If 1c splits, the renderer tests that ADR 0019's Confirmation line names (row 34's budget test, 35, 37) move to the PR after 1c, so "slice 1c merges" no longer marks the moment they pass | Read ADR 0019's POC acceptance as "when the PR that carries row 34's budget test, 35 and 37 merges" (§12). ADR 0019 is left unchanged by this task; the spec's open question on 1c's size can say so in one clause |
