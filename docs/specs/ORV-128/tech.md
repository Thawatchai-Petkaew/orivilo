---
issue: ORV-128 (https://tpetkaew.atlassian.net/browse/ORV-128)
spec: docs/specs/ORV-128/spec.md v1.23; slice 1a spec docs/specs/ORV-132/spec.md v1.1; slice 1b spec docs/specs/ORV-133/spec.md v1.16
task: ORV-128-design-schema-1, ORV-128-design-schema-2 (renderer build and text under option D), ORV-128-design-schema-3 (follow spec v1.3), ORV-128-design-schema-4 (follow spec v1.5 and ADR 0019 after review g2-1), ORV-128-design-schema-5 (follow spec v1.6), ORV-128-design-schema-6 (follow spec v1.7 after re-check g2-2), ORV-128-design-schema-7 (follow spec v1.8), ORV-132-design-bookkeeping-1 (follow spec v1.9 and the slice 1a build), ORV-133-design-bookkeeping-1 (follow spec v1.11 and the slice 1b build), ORV-133-design-bookkeeping-2 (follow spec v1.12 and the slice 1b rework), ORV-133-design-bookkeeping-3 (follow spec v1.13, the RFC 9309 check), ORV-133-design-tech-r1-1 (follow spec v1.15 and slice spec v1.8: slice 1b review round 1 and its follow-ups), ORV-133-design-tech-r1-2 (follow spec v1.16 and slice spec v1.9: F20 to F22 and the row 6 timing applied), ORV-133-design-tech-r1-3 (follow spec v1.17 and slice spec v1.10: F23 applied, the depth bound lowered), ORV-133-design-tech-bookkeeping-4 (follow spec v1.18 and slice spec v1.11, and the builder's rework-2 report: F24 and F25), ORV-133-design-tech-bookkeeping-6 (follow spec v1.19 and slice spec v1.12, and the builder fix ORV-133-build-fix-3: GATE-133-1 and GATE-133-2), ORV-133-design-tech-r2-1 (follow spec v1.20 and slice spec v1.13: slice 1b review round 2, the Work bound and its design), ORV-133-design-tech-bookkeeping-7 (follow spec v1.21 and slice spec v1.14: F27 to F31 decided, F30 as option (a)), ORV-133-design-tech-bookkeeping-8 (follow the builder's rework-4 report at f77913b: F32 to F34 decided, no spec change), ORV-133-design-tech-r3-1 (follow spec v1.22 and slice spec v1.15: the row 6 timing on CI recorded; slice 1b review round 3, R3-1 and SEC-133-R3-1, designed as the List steps and raised as F35 to F40)
author: ds-architect
date: 2026-10-28
---

# ORV-128 tech notes: the evidence contract and slice 1 of the input analysers

This is the G2 design for slice 1 of the input analysers. It turns the spec's "Evidence first", "Confidence" and "How evidence feeds the node graph" sections into types, functions and tests. It was checked against these sources:

- ADR 0005 (schema versions), ADR 0007 decision 5 (the fingerprint), ADR 0008 (adapters, evidence spans, `lexicon-1`), ADR 0009 (jobs, recorded tests).
- The engine source: `fingerprintOf` in `resolver.ts`, `RULE_VALUES` and `interpretWithRules` in `interpreter.ts`, `classifyHex` and `hexSchema` in `color-audit.ts`, `slugSchema` and `PERSONALITY_AXES` in `knowledge.ts`.
- Review round 2 of the spec (suggestions S1 and S2), review g2-1 of the G2 design (findings I1 to I6 and S1 to S8) and re-check g2-2 (findings N1 to N5), each with its status under "Findings for the spec".

The spec keeps every closed list, field name, bound and number. Where this design needs something the spec does not say, the gap is listed under "Findings for the spec" at the end, with the change this design assumes.

**One home per rule.** The spec defines each rule once, by name. These notes use the same names and point to the spec's section for every threshold and number; the code below implements a rule, it does not restate it. A change to a rule's numbers is made in the spec first.

<!-- prettier-ignore -->
| Rule | Defined in the spec | Used here |
| --- | --- | --- |
| `thousandths-1` | "Confidence" | §4 `scoreConfidence`, `milli`; §8 `leansOfMeasures`; §14 rows 3, 12, 32 |
| `industry-margin-1` | "Confidence" | §4 `withinMargin`; §10 `readIndustry`; §14 S1 |
| `conflict-question-1` | "The six cases", case 1 | §9; §10 `readIndustry` and `detectConflicts` |
| `industry-level-1` | "Industry", Matched level | §5 Industry; §10 `readIndustry` |
| `html-text-1` | "Page text" | §8 `pageTextOf`, its Heading bound, Depth line and Path bound (`pathOf`); §14 rows 9, 36 |
| `robots-token-1` | "Reading a page the person submits", robots.txt; digits in the token run are a hypothesis-grade reading of RFC 9309 section 2.2 (spec "Hypotheses", RFC-1) | §6 `parseRobots`; §14 row 6 |
| `robots-group-1` | "Reading a page the person submits", robots.txt | §6 `robotsAllows`; §14 row 6 |
| `robots-match-1` | "Reading a page the person submits", robots.txt | §6 `parseRobots` and `robotsAllows`: Normalisation (`robotsNormalise`), Matching (`matchAt` and `findFrom`, a `%2A` or `%24` as a literal; the most octets of the normalised pattern, allow on a tie) and Caps (`ROBOTS_MAX_PATTERN`, `ROBOTS_MAX_RULES`, `ROBOTS_MAX_PATTERN_CHARS`); §14 row 6 |
| `word-count-1` | "Page text" | §4 `few-words`; §8 `word-count`; §14 row 36. Makes no reading, so it is not in `RULE_IDS` (§2) |
| `measure-to-lean-1` | "Evidence first", From measures to a lean | §8 `leansOfMeasures`; §2 `checkItem` clause 14 (a member of `hypothesis-flag-1`); §14 rows 2, 11 |
| `value-to-lean-1` | "Evidence first", From a `lexicon-1` value to a lean | §8 `leanOfValue`; §2 `checkItem` clause 14 (a member at one value); §14 rows 2, 10 |
| `tsic-terms-1` | "Industry", Match terms | §10 `matchIndustryTerms`; §2 `checkItem` clause 14 (a member of `hypothesis-flag-1`); §14 row 13 (slice 2) |
| `hypothesis-flag-1` | "Evidence first", the rule after "Rule ids"; members under "Hypotheses" | §2 `HYPOTHESIS_RULES` and `checkItem` clause 14; §8 `leanOfValue` and the measured leans; §14 rows 2, 10, 11 |
| `competitor-not-read-1` | "Reading a page the person submits", after "Another brand's page" | §7 `readUrlInput` (the one gate before `readPage`) and `analyseUrl`; §9 `read.notRead.competitor`; the command in `cli.ts` (§13, slice 1d) reaches `readPage` only through `readUrlInput`; §14 row 38 |

## 1. Module layout

Everything below lives in `packages/intent-engine/src` and is pure TypeScript. Bytes, a clock reading and network answers come in as arguments. The engine's lint rules (`Math.random`, `Date.now`, framework imports) already apply.

<!-- prettier-ignore -->
| File | Holds | Slice |
| --- | --- | --- |
| `evidence.ts` | Closed lists, `inputEvidenceSchema`, `InputEvidence`, `evidenceId`, `compareEvidence`, `EVIDENCE_SCHEMA_VERSION`; from the slice 1b fix also `URL_MAX_CHARS` (2,048, the bound of `source.ref`) and `PATH_MAX_CHARS` (500, the bound of a locator `path`), which the schema and the read share (§6, §8) | 1a; the two constants 1b |
| `confidence.ts` | `CONFIDENCE_BASES`, `CONFIDENCE_FACTORS`, `EVIDENCE_FLOOR`, `milli`, `scoreConfidence`, `withinMargin`, `CONFIDENCE_VERSION` | 1a |
| `evidence-strings.ts` | `EVIDENCE_STRINGS` (every key under the spec's "Strings", `th` and `en`), `QUESTION_KEYS`; the two maps of §9 and the four `{what}` label keys | 1a; the maps and the `{what}` keys 1c |
| `leans.ts` | Rules `value-to-lean-1` and `measure-to-lean-1` | 1a |
| `read-page.ts` | `checkAddress`, `robotsNormalise`, `parseRobots`, `robotsAllows`, `readPage` over injected ports | 1b |
| `page-text.ts` | `pageTextOf`: the text blocks of the document bytes by rule `html-text-1`, on the same tokenizer as the stylesheet links (§8); `stylesheetLinksOf`; the shared parse `parseBounded`, which counts the tree builder's stack of open elements through `onItemPush` and `onItemPop` (the Nesting count, §6) and runs the Work bound: the Element count in `onItemPush`, the Attribute merge in `adoptAttributes`, and the Attribute count's scan `attributeCut` before the parse (§6) | 1b |
| `render-snapshot.ts` | `rendererBuildSchema` and `RendererBuild`; `renderSnapshotSchema`: what the renderer hands the engine, parsed as untrusted data; the `Renderer` port type | 1a holds only `rendererBuildSchema` and `RendererBuild`; 1c adds the rest |
| `measures/colour.ts` | OKLCH, the quantiser wrapper, hue band through `classifyHex`, warm share, declared colours | 1c |
| `measures/page.ts` | WCAG contrast, text and element density, font families, word count | 1c |
| `url-analyser.ts` | `readUrlInput`: the role gate of `competitor-not-read-1` in front of `readPage`; `analyseUrl`: fetched bytes and a snapshot or `null` in, sorted evidence and the not-measured list out (§7) | 1c |
| `report.ts` | `reportSchema`, `Report`, `REPORT_SCHEMA_VERSION`: the command's `--json` contract (§7, "The report schema") | 1d |
| `industry.ts` | `matchIndustryTerms`, `readIndustry`, the `TsicTaxonomy` port | 2 |
| `evidence-feed.ts` | `detectConflicts`, `feedEvidence` | 4 |

**What slice 1a ships ahead of 1c and leaves to it** (the ORV-132 spec's open-question defaults). `checkItem` clause 13 and §14 row 2 parse `source.renderer`, so 1a ships `render-snapshot.ts` holding only `rendererBuildSchema` and `RendererBuild` as §7 writes them; 1c adds `renderSnapshotSchema` and the `Renderer` port to that file. The two maps of §9 are typed on §7's `NotMeasured`, a 1c type, so 1a ships `EVIDENCE_STRINGS` with the keys of the spec's "Strings" and `QUESTION_KEYS`, and the two maps, the four `{what}` label keys and row 29's map case land in 1c.

**Server-only modules.** The page reader ports (DNS resolution, an HTTP request pinned to a checked address, SHA-256) and the renderer that produces a `RenderSnapshot` are server-only. The engine defines their contracts (`ReadPorts` in §6, `renderSnapshotSchema` in §7) and never imports them. They live in a new server-only package, `packages/page-reader` (§13, ADR 0019), which ships as slice 1d, its own PR right after 1c (spec "Delivery").

**What is reused, read-only.** `fingerprintOf` (`resolver.ts`), `interpretWithRules` and `RULE_VALUES` (`interpreter.ts`), `classifyHex` and `hexSchema` (`color-audit.ts`), and `slugSchema` and `PERSONALITY_AXES` (`knowledge.ts`). None of these files changes. `index.ts` gains the new exports. Slice 1b's, as built: `page-text` whole (`export *`: `TextBlock`, `PageText`, `BODY_MAX_CHARS`, `MAX_DEPTH`, `pageTextOf`, `stylesheetLinksOf`, `wordCount`; neither the Nesting count nor the Work bound adds an export: the hooks, `adoptAttributes`, `attributeCut`, `MAX_ELEMENT_PUSHES`, `MAX_ATTRIBUTES` and `parseBounded` stay inside the module); from `read-page` the types `ReadPorts`, `ReadResult`, `Fetched`, `RobotsRules` and `RobotsCache` and the functions `checkAddress`, `parseRobots` and `robotsAllows`; never `readPage`, so row 38 holds when 1c adds `readUrlInput` (ORV-133 spec, open question "What `index.ts` exports in 1b").

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
```

**`RULE_IDS`** holds the four ids spec "Evidence first" lists. `word-count-1` and `html-text-1` make no reading, so they are not on it (review g2-1 S5). The readings schema 1.0 already allows on `color.current`, `competitive-frame.lineup-candidate` and `reference.asset` come from later slices. Each slice that makes one by a rule adds its rule id here and bumps `EVIDENCE_SCHEMA_VERSION` by a minor version (1.1, 1.2 and so on), as the spec says, so until then a rule reading on those targets cannot be built and nothing pretends otherwise. A change to `HYPOTHESIS_RULES` changes which items parse, so it bumps the minor version too, and it ships with an impact list naming rows 2, 10, 11 and 13.

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

- `path` is an element path such as `html>body>main:nth-of-type(1)>h1:nth-of-type(1)`, in the form §8 records for `TextBlock`.
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
| `reference.asset` | `{ asset: "colour", hex }` or `{ asset: "font", family }`, `family` 1 to 100 characters after trimming (spec "Evidence first", the reading targets; a hypothesis-grade schema bound listed under "Hypotheses") |

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
4. A `quote` is allowed only on a `TEXT_KINDS` observation (path `observation.quote`). Clause 16 adds the locator.
5. The base fits the item (path `confidence.base`), decided by `fromModel` first (review g2-1 I3):
   - `model-reading` whenever `fromModel` is true, whether or not a reading exists, so a model's `asset-shown` item with no reading never gets the base of a code measure ("a model never measures", spec "Rules and bounds");
   - otherwise `rule-reading` when `reading.by` is `rule`;
   - otherwise `measure` (`reading` is null and `fromModel` is false).
6. `fromModel` and the reading agree (path `fromModel`): `fromModel` true means a reading by `model`, unless `reading` is null for an `asset-shown` observation; a reading by `model` means `fromModel` true.
7. `single-signal` appears only with base `model-reading`, and `tool-default` only when `reading` is not null (path `confidence.factors`; clause 17 adds the rest of `tool-default`).
8. Factor ids are unique and in ascending order. Each `{ id, value }` equals the table in `confidence.ts`.
9. `confidence.value` equals `scoreConfidence(base.id, factor ids).confidence.value`, and `belowFloor` equals its `belowFloor` (paths `confidence.value` and `belowFloor`). This is what makes the number computed, never reported (row 3). An item claiming 0.9 with base 0.7 and no factors fails.
10. Each quality factor has its flag, and each quality flag has its factor (path `flags`). The pairs are `few-words` and `quality.fewWords`, `page-incomplete` and `quality.pageIncomplete`, `image-small` and `quality.imageSmall`, `image-blurred` and `quality.imageBlurred`.
11. `ownedBy: "other"` never targets `color.current` or a personality axis (path `reading.target`, case 3).
12. `id` equals `evidenceId(item)` (path `id`), the fingerprint over the fields the spec's `id` row names (§3). `source.retrievedAt` is not part of the id, so an item whose `retrievedAt` alone was changed still parses with its old id, and an item whose `contentHash` or `renderer` was changed fails here.
13. `source.renderer` fits the observation (path `source.renderer`, finding F10):
    - not null for `colour-area`, `contrast-pair` and `density`, which exist only on a render;
    - null for `colour-declared`, and for any item whose locator path starts with `sheet:`, which rest on the stylesheet bytes alone;
    - either for the other kinds. A `text-span` and the readings that quote it carry the renderer that checked the text was visible, or null when no render checked it (§8, finding F11). A measured lean carries the renderer of the measure it rests on.

14. Rule `hypothesis-flag-1` (spec "Evidence first"), the part the schema can check (path `hypothesis`, review g2-1 I4):
    - a reading `by: "rule"` whose `rules` name a member of `HYPOTHESIS_RULES.whole` (`measure-to-lean-1`, `tsic-terms-1`) must say `true`;
    - a reading `by: "rule"` whose `rules` name a member of `HYPOTHESIS_RULES.oneValue` (`value-to-lean-1`) and no whole member may say either. The value 40 that makes it a hypothesis never leaves the analyser, so the analyser's test decides it (row 10, §8 `leanOfValue`);
    - every other item must say `false`: a reading whose `rules` name no member, a reading by `model`, and an item with no reading. The confidence table, which every item shares, never sets it.
15. `confidence.base.value` equals `CONFIDENCE_BASES[base.id]` (path `confidence.base.value`, review g2-1 S4). With clause 8 this makes every number in the trace the table's.
16. A `quote` needs a `text` locator (path `observation.quote`, review g2-1 S4): only a text span lets the quote be checked against the input at its locator (spec field `observation`, ADR 0008 decision 2; row 9).
17. The factor `tool-default` appears only on an item with `origin: "tool-default"` that carries the flag `{ key: "tool-default", questionId: "evidence.toolDefault" }` (path `confidence.factors`, review g2-1 S4; case 4). No slice before 6 sets it, so in slice 1 the clause only refuses.

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

- **What the id covers** follows the spec's `id` row (unchanged since v1.3): `analyser`, `source` without `retrievedAt`, `observation`, `measure.metric` and `reading.target`, with `source.renderer` inside `source`. Nothing else.
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

**Which factors apply.** The spec's "Which factors slices 1a to 1d use" decides it. In code, for the URL analyser:

- `page-incomplete` goes on every item of a `ReadResult` whose `incomplete` list is not empty (§6), or whose page text reports `incomplete` (§8), as spec "Confidence" says for a read with a cut part.
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
  // IP literals, server-only; answers within budgetMs, the time left of the 30 s. An empty array
  // and a rejection are both no answer; readPage catches the rejection and keeps none of its text.
  resolve(host: string, budgetMs: number): Promise<string[]>;
  // A rejection is no answer, caught the same way. truncated is true only when the answer had more
  // than maxBytes bytes, so an answer of exactly maxBytes is whole.
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
export type RobotsRule = {
  allow: boolean;
  pattern: string; // normalised by robotsNormalise; its length is its octets (all ASCII)
  anchored: boolean; // the normalised pattern ends with a written $
  parts: string[]; // split on each written *; a %2A or %24 stays as written, a literal for matchAt
};
export type RobotsRules = { groups: { agents: string[]; rules: RobotsRule[] }[] };
export function checkAddress(ip: string): "public" | "refused";
export function robotsNormalise(s: string): string;
export function parseRobots(text: string): RobotsRules;
export function robotsAllows(rules: RobotsRules, path: string, token: "oriviloreader"): boolean;
export async function readPage(
  url: string,
  ports: ReadPorts,
  robots?: RobotsCache,
): Promise<ReadResult>;
```

- **Address check.** The rule and its lists are the spec's ("Reading a page the person submits", Address check); this bullet says how the 1b build runs it. It runs on every request: the submitted URL, each redirect hop, each robots.txt request and its redirects, and each stylesheet URL. A stylesheet that fails it refuses the whole read with `read.refused.address`. On each request it checks, in order:
  - the URL (`allowedUrl`): `http` or `https`, the scheme's default port only (80 for `http`, 443 for `https`; the WHATWG `URL` writes a default port as `""`, so any non-empty `port` is refused, `http://example.com:443/` among them, SEC-133-7), an empty username and password, so no credential reaches a request or the result (R4, SEC-133-5), and an `href` of at most `URL_MAX_CHARS` (2,048) characters as the WHATWG `URL` writes it (spec Address check; SEC-133-R1-1, FU-1). The checks run in that order, all before `resolve`, so a refused URL makes no lookup and no request. `URL_MAX_CHARS` is imported from `evidence.ts`, where it also bounds `source.ref`, so the read and the schema cannot drift apart;
  - every address `resolve` returns, then the `remoteAddress` the answer reports. One non-public address refuses the whole read.
- **`checkAddress`** covers these ranges:
  - IPv4: loopback, the private ranges, link-local, carrier-grade NAT (`100.64/10`), multicast, `0/8`, `169.254.169.254`, and the special-purpose ranges `240.0.0.0/4` (reserved, the broadcast address among them), `198.18.0.0/15` (benchmarking) and `192.0.0.0/24` (IETF protocol assignments) (SEC-133-6);
  - IPv6, refused outright: the unspecified address `::` (it connects to the local host on Linux and macOS), `::1`, `fc00::/7`, `fe80::/10`, `ff00::/8`, the deprecated site-local `fec0::/10` (SEC-133-6), the local-use NAT64 prefix `64:ff9b:1::/48`, and Teredo `2001::/32`, whose IPv4 is obfuscated and not worth decoding;
  - IPv6 that embeds an IPv4 address, judged by that IPv4 address under the IPv4 list (review g2-1 I5): IPv4-mapped `::ffff:0:0/96`, IPv4-translated `::ffff:0:0:0/96` (SEC-133-6) and IPv4-compatible `::/96` (each the last 32 bits), NAT64 `64:ff9b::/96` (the last 32 bits; `64:ff9b::a00:5` reaches `10.0.0.5` where NAT64 runs) and 6to4 `2002::/16` (bits 16 to 47). So `::127.0.0.1`, `::ffff:0:a00:5` and `64:ff9b::a00:5` are refused, and `64:ff9b::808:808` (`8.8.8.8`) is public. The `::` and `::1` lines of the outright list are kept for clarity: the `::/96` unwrap already judges them as `0.0.0.0` and `0.0.0.1`, which `0/8` refuses, so dropping either line is an equivalent mutant (R8, §14 row 5).
  - `checkAddress` parses the literal into 16 bytes itself (zero compression, an embedded dotted quad), because the engine imports no `node:` module. A literal it cannot parse, or one with a zone id (`fe80::1%en0`), is refused. The order is: parse, refuse the outright list, unwrap an embedded IPv4, then judge. The lists are closed constants in `read-page.ts`; a range added later is a change to the address check that `security` reviews.
- **Requests.** The request port connects to the address that was checked, so a second DNS answer cannot swap it (DNS rebinding). `resolve(host, budgetMs)` receives the time left of the 30 s and must answer within it, so a slow DNS answer stays inside the read's budget (SEC-133-7); the slice 1d port must honour that contract.
- **robots.txt, the order.** Each hop of `walk` runs, in order: `allowedUrl`, the budget check, `addressOf` (the lookup of that hop's host and the Address check on every address), then the `gate`, which for a page or a stylesheet is `robotsOf` of that origin, then `send`. So the host of the submitted URL and the host of each redirect target of the page are looked up before robots.txt is requested of them (spec Depth bound, The result; FU-2): an `addressOf` that finds no address, or whose `resolve` rejects, ends the walk with `failed`/`network` and no request is made, robots.txt included. The robots.txt walk inside `robotsOf` has no gate; a host there (a robots.txt redirect target) that does not resolve ends that walk with `failed`/`network`, which `robotsOf` reads as no answer under Answers. A stylesheet host that does not resolve fails that stylesheet (Bounded). The robots.txt walk resolves its host on its own, so each origin is resolved twice, once for robots.txt and once for the page or stylesheet: one extra `resolve` per origin, so that every robots.txt hop runs the full Address check.
- **robots.txt, the answers** (spec robots.txt, Answers). A robots.txt redirect is followed (R3) through the same walk as a page's redirects: at most 3 hops, the Address check on every hop, past the bound the read fails with `redirects`; its rules apply to the submitted URL's origin (the initial authority, spec "Owner decisions", RFC 9309 check, row RFC-3): `robotsOf` caches them under that origin. `robotsOf` reads the walk's end in this order: a refusal or `redirects` is returned as is; any other failure is complete disallow (`DISALLOW_ALL`, a literal `RobotsRules` of one `*` group holding `Disallow: /`); a 2xx whose answer is `truncated` (more than `ROBOTS_MAX_BYTES`, 500 KiB) is complete disallow and its bytes are neither decoded nor parsed (spec Bounded; FU-4); any other 2xx is decoded by `TextDecoder` and parsed by `parseRobots`; a 4xx is no rules; anything else, a 3xx with no `Location` (R1-4) and a 5xx among them, is complete disallow. `walk` already returns a 3xx with no `Location` as an answer, not a hop, so R1-4 needs no new branch.
- **robots.txt, the rules.** `parseRobots` and `robotsAllows` implement the spec's rules `robots-token-1` (a `user-agent` value matched on its product token), `robots-group-1` (only the groups naming the token apply; `*` only when none does) and `robots-match-1` (its three parts, Normalisation, Matching and Caps), each defined in spec "Reading a page the person submits", robots.txt; the glosses here are short, and the terms are the spec's. What the code adds:
  - **`robotsNormalise(s)`** is the Normalisation of `robots-match-1`, used for both sides: each run of characters outside ASCII is replaced by `encodeURIComponent` of the run (UTF-8, upper-case hex); then each `%` followed by two hex digits is replaced by the character when that octet is unreserved, and otherwise rewritten with upper-case hex digits; a `%` not followed by two hex digits stays. Both steps are one left-to-right pass each, as in the spec's normalisation worked example. `encodeURIComponent` throws only on a lone surrogate, and none reaches it: the robots.txt text comes from `TextDecoder`, which replaces invalid sequences, and a URL's path and query are ASCII.
  - **`parseRobots(text)`**, per line after the comment is cut: a line whose key is `allow` or `disallow` first adds 1 to the rule count, whether or not a group is open and whether or not its value is empty (F21); past `ROBOTS_MAX_RULES` (5,000) it returns `DISALLOW_ALL` at once, reading no further line. Then the value is normalised and its length added to the pattern characters; past `ROBOTS_MAX_PATTERN_CHARS` (100,000) it returns `DISALLOW_ALL` at once. Then a normalised pattern longer than `ROBOTS_MAX_PATTERN` (1,000) is ignored, counted but not kept; an empty value is not kept (it allows everything); any other is kept as a `RobotsRule`, compiled once: `anchored` when it ends with a written `$`, `parts` split on each written `*`, each part kept as normalised, so a `%2A` or `%24` in it stays three characters that `matchAt` reads as a literal (F22). Normalisation runs before the split, so a `%2a` written in lower case is a literal too, and a `%2A` never becomes a wildcard. The caps sit in the parser, so a file past them costs at most 5,001 normalised rule lines within its 500 KiB, and `robotsAllows` never sees an over-long pattern.
  - **`robotsAllows(rules, path, token)`** normalises the path (the URL's `pathname` plus `search`) once per call, takes the groups `robots-group-1` names, and checks each kept rule with `patternMatches`: the first part must match at the path's start; each later part is found by `findFrom` at or after the end of the one before; an anchored pattern's last part must end the path. A part is compared by `matchAt(path, part, at): number`, the end of the part's match that starts at `at`, or `-1`. At a `%2A` or `%24` in the part it takes a written `*` or `$` in the path (1 character) or the same three characters (3), as `robots-match-1`, Matching states (F22), and any other character of the part takes the same character. The path's character at that point decides which, so the match at one start is unique and costs at most the part's length in steps. `findFrom(path, part, from)` returns the end of the first match that starts at or after `from`, or `-1`. That end is also the least, which is the one to keep, since every later part may start anywhere at or after it: a match that started later and ended sooner would have to take with one `*` a literal that the earlier match took with three characters, starting inside those three, where the path holds `2`, `A` or `4`, never `*` or `$`. A search of every part of up to four tokens against every path of up to eight characters over those characters found no case where the two differ (this task). An anchored last part tries only the starts from which its match could end the path, at most 1 plus 2 per literal. So one check stays within the spec's bound of path length times pattern length steps. `matchAt` and `findFrom` loop over char codes, not `String.prototype.indexOf`: on row 6's 500 KB case (5,000 `/*ab` against `/` and 1,999 `a`) `indexOf` took about 73 ms and the 1b char-code loop about 30 ms on Node 22.23.0 (arm64, task `ORV-133-design-tech-r1-1`), a sketch of the loop above 55 to 66 ms on the same machine (this task), and the row allows 2 s (spec "Owner decisions", Slice 1b CI findings). The most specific match is the matching rule with the longest normalised `pattern` (its octets); an allow wins a tie; no match allows.
- **Bounds.** The document may be 2 MB, each stylesheet 1 MB and a robots.txt answer 500 KiB (`ROBOTS_MAX_BYTES`, `500 * 1024` bytes), past which the answer is complete disallow and nothing of it is parsed (spec Bounded; FU-4; the robots.txt answers bullet above). Each request has 10 s, and the whole read has 30 s, measured by `elapsedMs`. At most 10 stylesheets and 3 redirects, for a page, a stylesheet and robots.txt alike.
- **Depth bound** (spec "Reading a page the person submits", Depth bound; SEC-133-3, SEC-133-R1-2, F20, F23). Two parts, both in `page-text.ts`: the Nesting count bounds the parse, and the walk bounds what is read from the tree.
  - **The Nesting count** runs inside the parse. `parseBounded` passes it the default tree adapter extended by the two hooks, `{ ...defaultTreeAdapter, onItemPush, onItemPop, adoptAttributes, insertBefore, insertTextBefore, detachNode }` (the other four methods are the Work bound's Attribute merge and List steps, below), a new object for each parse, so no count outlives its call. K-0082 §6 quotes both declarations and their call sites; `defaultTreeAdapter` is a public export of the pinned `parse5` 8.0.1 and sets neither hook itself. `onItemPush` adds 1 to `depth` and `onItemPop` takes 1 away. In 8.0.1 every change to the length of the stack of open elements goes through exactly one of the two calls, and the document is not on the stack (K-0082 §6), so `depth` is the stack's length, `html` counting 1 as in the walk. The rule and its bound are the spec's (Depth bound, Nesting count): the stop is the push that makes `depth` one more than `MAX_DEPTH` (128 elements, `html` counting 1; F23).
  - **How the parse stops.** A hook runs after the push, so `depth` is already one more than `MAX_DEPTH` inside `onItemPush`, and the only way out of the parse from there is to throw (K-0082 §6). `onItemPush` throws a `NestingStop`, a class private to `page-text.ts` that holds the cut in its field `cut`. The Work bound's Element count, Attribute merge and List steps throw the same class with the same `cut` (below), so one `catch` serves all four stops and the class keeps its name. The field is declared in the class body and assigned in the constructor, not written as a constructor parameter property: `packages/auth/tsconfig.json` sets `erasableSyntaxOnly`, which rejects a parameter property (TS1294), and its `tsc` includes the intent-engine sources (GATE-133-2, a build finding; no design change). `parseBounded` catches it with `instanceof NestingStop` and rethrows anything else untouched. The parser and its half-built tree are dropped: `parseBounded` makes a new `Parser` for each parse (Work bound, The List steps), and nothing of it is kept.
  - **The risk, and what pins it.** No `parse5` source documents throwing from a hook as supported, nor what state the parser is left in, nor that a later version keeps calling the hooks at the same points (K-0082 §6, "What is not documented"). The design rests on the code of 8.0.1, where nothing between the hook and the caller of `tokenizer.write` catches, and on the exact pin of `parse5` (§13, K-0082 option A), so an upgrade is a reviewed change that reruns three checks. The boundary pair beyond row 36 is cut one past `MAX_DEPTH` only if the throw reaches `parseBounded`. The five 2 MB documents of rows 7 and 36 run past 2 s if the hooks stop being called or the throw is swallowed (20,000 nested `div` alone took about 1.1 s, F20). The two cut-rule cases beyond row 36 go red if the location the hook reads moves. The Work bound rests on the same pin, for its throw from `onItemPush`, from `adoptAttributes` and from the three child-list methods of the List steps (K-0082 §7, "What is not documented"), and the List steps rest on two names `parse5` marks internal (Work bound, The List steps, The risk); its own checks are in §14 rows 7 and 36.
  - **Where the cut falls.** The cut is the greatest `sourceCodeLocation.startOffset` among the elements pushed in this parse, the one whose push passed `MAX_DEPTH` included, kept by `onItemPush` as each element arrives; `0` when none had one. For an element made from its own start tag that is the tag's offset, since that tag is the latest token read, so the cut is where the spec puts it. The spec leaves the elements the tree builder pushes with no start tag of its own to this section (K-0082 §6 lists them): a fake element (`_insertFakeElement`: a `tbody`, `tr` or `colgroup` in front of a table cell or column, a `p` for a stray `</p>`, a `br` for `</br>`, and `head` and `body`, which like an implied `html` come only at depth 1 or 2) has a `null` location; a re-opened formatting element (`_reconstructActiveFormattingElements`) carries the offset of its first start tag, which can lie far back. For these the cut is the start of the latest start tag whose element was pushed. An element of the adoption agency never passes `MAX_DEPTH`: its one push (`insertAfter`) follows the removal of the old formatting element from the same stack, so it restores a depth the stack already held; the hook is then passed the top of the stack rather than the new element (K-0082 §6), and the top's offset is already counted. Why the greatest offset and not the pushed element's own: the own offset is missing for a fake element and too early for a re-opened one, while the greatest is a start tag the parse had read in full, at or before the token being read at the stop, which is all the next bullet needs. The offset is a UTF-16 index into the decoded text (K-0082 §5), so slicing at it lands on that tag's `<`, and the spans of `pageTextOf` index the same text, which the slice does not shift.
  - **Why the second parse cannot pass `MAX_DEPTH`.** `parseBounded` parses `text.slice(0, cut)` again with the same hooks. The cut is the start of a start tag, which begins in the tokenizer's data state, so the text before it is the same run of whole tokens the first parse read before that tag, and the tree builder makes the same pushes and pops for them. Those tokens all came before the token that passed `MAX_DEPTH`, so the stack stayed at or below `MAX_DEPTH` through them. Then the end of the text: in 8.0.1, `onEof` pushes only in the modes before `body` (an implied `html`, `head` or `body`, with at most `html` and `head` on the stack) and in the "in table text" mode, where it inserts the pending characters exactly as the next token would have. In the first parse the tag at the cut was that next token, and its element was pushed at or before the stop, so those insertions stayed at or below `MAX_DEPTH` there too. Every other end-of-file step only pops. So the second parse stays at or below `MAX_DEPTH` and never stops. A sketch of the count on Node 22.23.0 (arm64, outside the repo; task `ORV-133-design-tech-r1-2`, rerun at the lowered bound by task `ORV-133-design-tech-r1-3`) bears this out: on the five 2 MB documents of row 7 and the boundary and cut-rule cases of row 36 the second parse never stopped, and its stack peaked at `MAX_DEPTH` or one below it. This argument is about depth: under the Work bound's Element count and List steps the end of the text can add a push the first parse never made, so the second parse can stop (Work bound, The second parse under the Element count; The List steps, The second parse).
  - **If the second parse stops.** `parseBounded` then returns the parse of the empty text with `cut` true. So a call makes at most three parses, the third of nothing, and the read keeps `page-incomplete`. By the argument above neither the Nesting count nor the Attribute merge stops the second parse; the Element count and the List steps can, at the end of the text (Work bound below), so this branch is reachable and has a test for each (§14 row 36, beyond the row; F31, F39). F25 kept it untested when no input reached it; the title's `"long"` branch and the meta description's null-path branch in the head stay untested as F25 decided (a head child's path is a few dozen characters, far inside the Path bound of §8).
  - **Both callers use the same cut**, so `stylesheetLinksOf` never sees a link after it (row 7) and `pageTextOf` never gives a block after it (`html-text-1`, Depth).
  - **Cost.** A cut parse costs the text up to the cut, twice: the five 2 MB documents of row 7 were cut in 0.2 to 2.2 ms, before the Work bound added its scan of the text (about 50 ms on 2 MB, Work bound below). A parse that is not cut holds at most `MAX_DEPTH` elements on the stack, so a token that walks the stack costs at most `MAX_DEPTH` steps for that walk. That bounds the depth, not the work of a token: a character can re-open every active formatting element, each attribute name of a tag is checked against the names before it, and a later `html` or `body` start tag merges its attributes into that element. Those costs are the Work bound's (below), which holds a parse to 1,048,576 pushes, a tag to 256 attribute names, the `html` or `body` element to 256 merged attributes (R2-1, SEC-133-R2-1) and the walks of child lists and of the list of active formatting elements to 268,435,456 steps (R3-1, SEC-133-R3-1). Measured before the Work bound: 2 MB of flat `<p>x` took 231 to 290 ms, and the held-depth document of rows 7 and 36, which holds the stack at `MAX_DEPTH` and walks it with every `</p>`, 488 to 500 ms in five runs (task `ORV-133-design-tech-r1-3`, Node 22.23.0, arm64); with the Work bound's sketch, scan included, 332 ms and 601 ms (this task, same machine). That cost is why the bound is what it is: held just under the old, deeper bound the same document took 1.6 to 1.7 s, 0.8 of the 2 s its rows then allowed (F23). Rows 7 and 36 now allow this document 10 s, a guard against super-linear cost that a loaded CI runner can hold; the five cut documents keep 2 s (GATE-133-1).
  - **The walk.** `stylesheetLinksOf` and `pageTextOf` walk the parsed tree with an explicit stack to `MAX_DEPTH`; an element deeper gives no link and no block and sets `incomplete`, and `readPage` then adds `page-incomplete`. The count does not make the walk redundant: a void element is attached without a push, so one can sit one past `MAX_DEPTH` under a full stack (the void-element cases of rows 7 and 36). No walk recurses, so a deep document cannot overflow the call stack. The walk of a block's text nodes inside `pageTextOf` (`textNodesOf`, §8) has no depth check (R2-2, F26). It is iterative, so no depth overflows the call stack, and no inline element in a block lies deeper than the stack the Nesting count bounds: the builder's search of 400,000 generated documents and the reviewer's four constructs found none. Were one deeper, its text would join a block whose element the main walk reached within `MAX_DEPTH`; a text node gives no block of its own, and the Depth line of `html-text-1` bounds blocks. Its cost stays linear: it stops at a nested block, which the main walk reads on its own, so each node is walked for at most one block. The main session decided this on the builder's rework-2 report; the depth checks of the main walk and of `stylesheetLinksOf` stay.
- **Work bound** (spec "Reading a page the person submits", Work bound; R2-1, SEC-133-R2-1, R3-1, SEC-133-R3-1; K-0082 §7 and §8). Four counts, all in `page-text.ts` and all run by `parseBounded`, so `pageTextOf` and `stylesheetLinksOf` get the same cut. The Element count, the Attribute merge and the List steps run inside the parse, in the same tree adapter object as the Nesting count's hooks, and stop it with the same `NestingStop` and the same `cut`; the Attribute count is a scan of the decoded text before the parse. Three module constants hold the numbers: `MAX_ELEMENT_PUSHES` (1,048,576) and `MAX_ATTRIBUTES` (256, for the Attribute count and the Attribute merge alike), which are the spec's, and `MAX_LIST_STEPS` (268,435,456), the spec's since v1.23 (F35). None is exported; the boundary cases of §14 row 36 pin them.
  - **`parseBounded`, in order.** Decode the bytes as `html-text-1` states; run `attributeCut(text)`, and when it returns an offset keep only the text before it; parse that text through a new `Parser` with `{ ...defaultTreeAdapter, onItemPush, onItemPop, adoptAttributes, insertBefore, insertTextBefore, detachNode }` (The List steps, below); on a stop, parse the text before the stop's cut with a new adapter; on a second stop, return the parse of the empty text (Depth bound, If the second parse stops). `cut` is true when the scan cut the text or any parse stopped, and `pageTextOf` and `stylesheetLinksOf` turn it into `incomplete` as before.
  - **The Element count.** `onItemPush` adds 1 to `pushes` beside `depth` and updates `cut` as before, then throws `NestingStop(cut)` when `depth > MAX_DEPTH` or `pushes > MAX_ELEMENT_PUSHES`: the push that would be the 1,048,577th stops the parse. `onItemPop` lowers `depth` only, so `pushes` never goes down. Every way into the stack calls the hook once (`push` and `insertAfter`, K-0082 §6), so the count sees each element from a start tag, each implied element, each re-opened formatting element (one call per entry re-opened, K-0082 §7 (c)) and the adoption agency's new formatting element. The cut is the rule of "Where the cut falls", unchanged. On the re-opened-formatting document of rows 7 and 36 the stopping push is a re-opened `b`, which carries its first tag's offset, so the cut is the start of the latest `<p>`, the latest start tag whose element was pushed.
  - **The second parse under the Element count.** The tokens before the cut make the same pushes as in the first parse, all before the stopping push, so at most 1,048,576 of them. The end of the text can add one the first parse never made: with a `template` open in `head`, end of file pops the `template` and the `head`, and the after-head mode then pushes an implied `body`. When the text before the cut made exactly 1,048,576 pushes, that `body` is the 1,048,577th, and the second parse stops too. So the third parse, of the empty text, is reachable, through the Element count only (F31). A search with the counts scaled down (depth 6 to 128, pushes 18 to 60, merge 2 to 4) ran five passes of up to 400,000 generated documents; three passes found such a document, each opening with `<template>`, and five more passes of 400,000 with `template` left out of the generator found none (this task). At full scale, `<title>T</title><template>`, 107 `<i></i>`, `<p>`, 120 `<b id=N>` with N from 0 to 119, and `<p>x` 8,700 times (36,668 characters) reach it in about 0.7 s: the stop falls on the `<p>` of the 8,665th `<p>x`, the text before that `<p>` makes exactly 1,048,576 pushes, and the end of that text pushes the `body`. With 106 or 108 `<i></i>` the pushes do not line up and the second parse returns. The implied `body` is pushed at depth 2, so the depth argument above still holds.
  - **The cost at the count.** A sketch of `parseBounded` with the Element count, the Attribute count and the Attribute merge, outside the repo (Node 22.23.0, arm64, `parse5` 8.0.1 from the lockfile; this task), on the 2 MB re-opened-formatting document: the first parse stops at push 1,048,577 with its cut at offset 35,755, the second parse keeps 1,048,468 elements, and the call takes 588 to 711 ms in eight runs, the scan included. Heap, as `heapUsed` after a forced collection before the call: about 411 MB live after the call, and up to about 822 MB sampled during it (every 65,536 pushes) while the first parse's tree waits for collection. The call completes under a 512 MB old-space limit and runs out of memory under 384 MB. The 411 MB is `parseBounded`'s own, with the tree it returns still held. The build measured the same document through `pageTextOf`, which keeps no tree (task `ORV-133-build-rework-4` at f77913b, Node 22.23.0, arm64, a script outside the repo; F33): 561 to 712 ms in ten runs; `heapUsed` right after the call and before a collection, 913 to 943 MB at the default limit and 438 to 458 MB under a 512 MB old-space limit, and 15 MB after a forced collection; the call completes under 512 MB in 3 of 3 runs and runs out of memory under 384 MB in 3 of 3 runs. The time is far inside the 10 s of rows 7 and 36; the spec's "Hypotheses" (the Work bound) states the heap a read needs at the count, which slice 1d checks where the function memory is set (F30). `parseBounded` is private, so slice 1d takes the function memory from the 512 MB pass and the 384 MB failure, not from a live figure (F33). `readPage` parses once (`stylesheetLinksOf`) and slice 1c's `analyseUrl` once more (`pageTextOf`), one after the other, and neither keeps its tree.
  - **The Attribute count.** `attributeCut(text): number`, private to the module, returns the offset of the cut or `-1`. It runs the attribute states of the WHATWG tokenizer, as `parse5`'s tokenizer has them (K-0082 §7 (a)), from every place a tag could start, and keeps those runs in step:
    - _Where a run starts._ At every `<` followed by an ASCII letter, and at every `</` followed by an ASCII letter (an end tag reads attributes the same way, F27), wherever it lies: in text, in a comment, in the text of a `script`, `style`, `title` or `textarea`, or inside another run's attribute value. The run enters the tag name state at the letter, with a count of 0, and its start is the offset of the `<`.
    - _How it steps._ Each character moves each live run by the tokenizer's rules, where whitespace is tab, line feed, form feed, carriage return and space (the tokenizer turns a carriage return into a line feed before it reads). The tag name runs to whitespace (to before name), `/` (to self-closing) or `>` (the end). Before a name, whitespace is skipped, `/` goes to self-closing, `>` ends, and any other character, `=` included, starts a name. A name runs to whitespace (to after name), `/`, `>` or `=` (to before value); `"`, `'` and `<` stay in the name. After a name, whitespace is skipped, `/`, `=` and `>` act as above, and any other character starts a name. Before a value, whitespace is skipped, `"` or `'` opens a quoted value, `>` ends, and any other character starts an unquoted value. A quoted value runs to its own closing quote, whatever lies between (`>`, `<`, whitespace, the other quote). After a quoted value, whitespace goes to before name, `/` and `>` act as above, and any other character starts a name. An unquoted value runs to whitespace (to before name) or `>`. Self-closing ends at `>`, goes to before name on whitespace, stays on `/`, and starts a name on any other character. A character reference moves no run: in a value the tokenizer's reference states read only letters, digits, `#` and `;` and return to the value.
    - _How attribute-like words are counted._ A run adds 1 each time it starts a name, the point where the tokenizer starts an attribute and later checks its name against the tag's earlier names (`_createAttr`, then `_leaveAttrName`, K-0082 §7 (a)). A repeated name counts each time, since the tokenizer compares it each time.
    - _Where a run ends._ At the `>` that would emit its tag, or at the end of the text.
    - _In step._ Two runs in the same state at the same character move alike from then on, so the scan keeps one run per state: the one with the higher count, the earlier start on a tie. There are ten such states (tag name, before name, name, after name, before value, the two quoted values, unquoted value, after a quoted value, self-closing), so the scan is one pass over the text with at most ten steps per character. Three of the ten, before name, after a quoted value and self-closing, have identical rows, so the scan could keep eight; it keeps ten as designed, one per tokenizer state, and the two table mutants that send a closing quote to self-closing instead of to after a quoted value are equivalent (F32, §14 row 36).
    - _The cut._ When a run starts its 257th name, the scan stops and returns that run's start.
    - _Why it counts at least what the tokenizer counts, never fewer._ The tokenizer reads a tag only from a `<` and an ASCII letter, or `</` and one, and from there by the rules above, whatever state it was in before. So each tag it reads is a run the scan started at the same `<`, or one the scan merged into a run with at least its count. If a tag the tokenizer reads would start more than 256 names, a run passes 256 at or before that tag's 257th name, and the parse gets only the text before that run's start. Within that text no run passes 256, so no tag the tokenizer reads there does, and a tag cut short by the end of the text is never emitted. A search of 1,200,000 generated documents (tags with names and quoted values, comments, CDATA, `script`, `style`, `textarea` and `title` text, stray quotes and `>`) with the limit scaled down to 6 parsed each text before its cut with `parse5`, counted the names its tokenizer started per tag, and found none past the limit; earlier passes at limits of 3 to 5 agreed (this task).
    - _Cost._ One linear pass: 42 ms on 2 MB of plain text, 51 to 60 ms on the 2 MB documents of rows 7 and 36, and 70 to 78 ms on 2 MB of `<a`, `</a`, quotes, `=`, `/`, `b` and spaces mixed at random, which keeps the most runs alive (sketch, this task). Each call of `parseBounded` scans again.
    - _What it costs a page._ On a page with no tag-like run outside its tags, the run from each tag's `<` counts exactly that tag's names, and the cut is at that tag's start, as the spec says. Elsewhere it may cut where the tokenizer reads no tag. The spec's honest limit (F28) names the places where the tokenizer reads no tag: a comment, an attribute value, a CDATA section, and the text of an element such as `script`, `style`, `title`, `textarea`, `xmp`, `iframe`, `noembed`, `noframes` or `plaintext`; the scan cuts there whenever a run starts more than 256 names before its `>`. A run that starts at `a<b` in script text counts each whitespace-separated word up to the next `>` outside its quotes. A real tag's run never counts the words inside its own quoted values, so a long `content` or `title` value does not cut (a case in §14 row 36).
  - **The Attribute merge.** The adapter's `adoptAttributes(recipient, attrs)` replaces the default at both of its call sites, `htmlStartTagInBody` and `bodyStartTagInBody` (K-0082 §7 (b)). It keeps, for the parse, a `Map` from recipient to a `Set` of the recipient's attribute names, made from `recipient.attrs` on the first call for that recipient: at most 256 names, since the tag that made the element passed the Attribute count. A call with an empty list returns at once. Otherwise it counts the offered names not in the set; when the set's size plus that count would pass `MAX_ATTRIBUTES`, it throws `NestingStop(cut)`; else it appends those attributes to `recipient.attrs` in the offered order and adds their names to the set, which is the default's effect (it copies only names not yet present). The default's `Set` of every name, built again on each call, is never built.
    - _The check per call._ Each offered name is one lookup in a set of at most 256 names, and the offered list holds at most 256 names (the Attribute count), so the duplicate-name check of one call is at most 256 lookups, and the merges of a parse cost one lookup per attribute of the text. 2 MB of `<html>` tags offered to an `html` that already holds 256 names took 172 ms with one name per tag and 337 ms with 256 per tag, uncut (sketch).
    - _Where it stops._ At the call for the start tag that would pass 256, the latest start tag read. `adoptAttributes` receives the element and the list, not the tag's location (K-0082 §7 (b)), so the stop's cut is the `cut` the hooks keep: the start of the latest start tag whose element was pushed, at or before the merging tag, and the text between the two is not read (F29). On the `<html aN>` and `<body aN>` documents of rows 7 and 36 that is the `<body>` at offset 0, so the read keeps nothing of the page; the sketch returned each in 106 to 107 ms, the scan included.
    - _The second parse._ It reads only text before the cut, so it repeats only merges the first parse made before the stop, each within 256, and the Attribute merge never stops it.
  - **The List steps** (R3-1, SEC-133-R3-1; K-0082 §8; spec Work bound, List steps; F35). The tree adapter's child-list methods walk a parent's whole child list (`indexOf` and `splice`), and the parser walks its list of active formatting elements; two routes repeat those walks once per node, so they grow with the square of the text, and no push marks each step: a void element or a text node is never pushed, and one adoption agency call moves every child of a block. One counter, `steps`, per parse, beside `depth` and `pushes`, adds the length of each such walk, and one module constant, `MAX_LIST_STEPS` (268,435,456, that is 2^28), bounds it. The call that takes `steps` past the bound throws `NestingStop(cut)` with the cut of "Where the cut falls", so the read keeps the text before the latest start tag pushed and carries `page-incomplete`, as under the other counts.
    - _Where it adds._ Four methods of the same adapter object, which is new for each parse:
      - `insertBefore(parent, node, ref)` finds `ref` with `lastIndexOf`, from the end, adds `parent.childNodes.length` minus the index found, then splices `node` in at that index and sets its `parentNode`. The default finds `ref` with `indexOf` from the front. In 8.0.1 the parser calls `insertBefore` only to foster-parent an element (`_fosterParentElement`) and `insertTextBefore` only to foster-parent text (`_insertCharacters`), and in both `ref` is the `table`, which is the last or nearly the last child of its parent while content is fostered out of it. So a fostered node costs the nodes after the table, not every node fostered before it, and the step it adds is that small distance. In 300,000 generated documents the reference was the last child at every call (this task).
      - `insertTextBefore(parent, text, ref)` finds and adds the same way, then, as the default does, appends `text` to the text node just before `ref` or splices in a new text node. It has its own override because the default calls `defaultTreeAdapter.insertBefore` directly, not the adapter's method.
      - `detachNode(node)` adds the length of the child list of the node's parent, when it has one, then calls the default (`indexOf` and `splice(idx, 1)`, at most that length). Its callers move one node at a time: the adoption agency's `_adoptNodes`, which takes the furthest block's first child, detaches it and appends it to the new element until none is left; the adoption agency's detach of its last element; and the frameset's detach of `body` (K-0082 §8 rows 1, 4 and 5).
      - `onItemPush` adds `parser.activeFormattingElements.entries.length`, after its depth and push checks. Each walk of that list costs at most its length: the `unshift` of an addition, the Noah's Ark pass, `removeEntry`, `clearToLastMarker`, the start of a re-open, and `getElementEntry` in the adoption agency's inner loop. By our reading of 8.0.1 each one happens beside a push (an addition follows its element's push, a marker its element's, a re-open is a push) or in the inner loop, which walks elements on the stack, each pushed and each walked at most once per pass before it leaves the stack or is replaced. The list grows only beside a push, and an element waits on a stack of at most 128 between its push and its walk, so the entries added in between cost at most 128 uncounted steps per addition. Row 7 of K-0082 §8 is capped this way, through the pushes, and not by a bound on the list itself. The list can grow without bound: `</template>` while an `object` inside the `template` is open removes only the `object`'s marker (`clearToLastMarker` stops at the first marker), so the `template`'s marker and the entries behind the `object`'s stay after the `template` is popped. `<body>`, then `<template>`, 36 formatting tags (`b`, `big`, `code`, `em`, `font`, `i`, `s`, `small`, `strike`, `strong`, `tt` and `u`, three each) and `<object></template>` repeated to 2 MB, keeps 37 more entries a round, and each later push walks them: 38.8 s at the head, cut by the List steps in 235 to 260 ms.
    - _What it adds nothing for._ The other rows of K-0082 §8, each judged. Row 6, the DOCTYPE find, runs once per parse over the document's children, so it is linear. Rows 8, 9 and 11, the stack, the template mode stack and the attributes, are capped by the Nesting count and the Attribute count. Row 10, the pending character tokens of a table, is inserted by `insertTextBefore` and so counted there; row 12, the tokenizer's strings, grows by appending and is linear. The measurements below hold each row's 2 MB document within 0.8 s.
    - _Why the parse runs through `Parser`._ `onItemPush` must read the formatting list's length, and `parse5.parse` does not hand out its parser. `parseBounded` makes `new Parser<DefaultTreeAdapterMap>({ scriptingEnabled: false, sourceCodeLocationInfo: true, treeAdapter })` in the closure the adapter's methods read, calls `parser.tokenizer.write(text, true)` and returns `parser.document`. In 8.0.1 that is the body of `Parser.parse`, which `parse` calls (`new this(options)`, `parser.tokenizer.write(html, true)`, `return parser.document`), so the tree and every hook call stay the same.
    - _The risk._ `Parser` is exported from the `parse5` root, but its declaration carries `/** @internal */`, and so does `activeFormattingElements` in the type declarations; `entries` is a public field of `FormattingElementList`. So the List steps rest on two internal names beyond the public tree adapter the other counts use. They hold under the exact pin (§13, K-0082 option A); `tsc` fails if either name leaves the declarations, and the stale-marker case of rows 7 and 36 goes past 10 s if the count stops reading the list. The spec's "Hypotheses" (the List steps) and K-0082 §8 record the dependence (F37); an upgrade of `parse5` re-checks it with the other checks of "The risk, and what pins it".
    - _The second parse._ The tokens before the cut make the same calls on the same tree as in the first parse, all before the stopping call, so they add at most `MAX_LIST_STEPS` steps. The end of the text adds steps only where it pushes or inserts: the pending characters of "in table text" are inserted as the tag at the cut inserted them in the first parse, and a pop adds nothing. The one new step is the push of the implied `body` after a `template` in `head` (The second parse under the Element count), which adds the formatting list's length, so a long list of stale entries under that `template` can stop the second parse, and `parseBounded` returns the parse of the empty text (If the second parse stops). A search with the bound scaled down to 1 to 60 steps, 300,000 generated documents in each of three seeds, stopped the second parse only at that push (456, 449 and 440 documents; this task). At full scale, `<title>T</title><template>` and the stale rounds above to 2 MB reach the third parse and give no block, not even "T", `incomplete` true, in 384 to 404 ms for `pageTextOf` and `stylesheetLinksOf` together; with `<body>` before the `<template>` no `body` is implied, the second parse returns and keeps "T", `incomplete` true, in 263 to 322 ms. The spec's Work bound opening names the List steps beside the Element count here (F39).
    - _Why 268,435,456._ The re-opened-formatting document of the Element count adds 125,821,380 steps before the Element count stops it at its own push; 2^28 is about twice that, so each count stops its own documents and the Element count's case and boundary keep their result (at 2^27 the margin is 7%). No plain page measured comes near it: 2 MB of paragraphs, a 2 MB table and the held-depth document add none, a 2 MB page of mixed formatting 49,225, and a 2 MB table with a stray `<br>` in every row 65,881. A step costs 0.5 ns (a `splice`) to 1.45 ns (a `getElementEntry` find), so a parse the count stops costs about 0.4 s for the steps; the slowest document measured at 2^28, the long adoption agency inner loop below, returned in 616 to 780 ms, and at 2^29 the nested-template document took about 1 s.
    - _What it costs a page._ Finding from the end makes foster parenting linear, so a table with stray content in every row is never cut: the 2 MB table with a stray `<br>` per row is read in 183 to 192 ms, uncut, where the head takes 493 to 532 ms. What the bound can cut is a formatting end tag misnested over a block with many direct children: `_adoptNodes` moves them one by one from the front, each `detachNode` adding the children left, so n children add about n²/2 steps. `<body><b><div>`, n `<br>` and `</b><p>after</p>` keep "after" at n = 23,169 (268,412,868 steps) and are cut at n = 23,170 (268,436,038), at the `<div>` (offset 9), with no block. The cut is the latest start tag pushed: when the children are void elements or text, that is the block's own start tag, so the block's text is lost; when they are elements, it is the latest of them, so `<b><div>`, 2 MB of `<p>Paragraph N</p>` and `</b></div>` is cut at its last `<p>` and loses only what follows it (417 to 424 ms; 10.8 s at the head). The spec states it as the List steps' honest limit (F38).
    - _The tree is unchanged._ The overrides build the tree the default adapter builds: 300,000 generated documents in three seeds (formatting and block tags misnested, tables, templates, text and void elements) serialised identically through both (this task). So paths and blocks do not change (§8).
    - _Cost on a plain page._ In one process, nine alternating rounds, the median of the head against the sketch: 2 MB of paragraphs 83 against 80 ms (`stylesheetLinksOf`) and 83 against 84 ms (`pageTextOf`); the 2 MB table 129 against 131 and 139 against 140 ms; the 2 MB formatting page 143 against 143 and 143 against 147 ms; the held-depth document 529 against 535 and 634 against 634 ms. That is within the noise of the run.
  - **What the counts do not see** (the three paths K-0082 §7 lists as unseen, and the Noah's Ark compare its "What the Work bound takes from this" names; each judged; the rows of K-0082 §8 are judged under The List steps, What it adds nothing for).
    - _Elements made by `_appendElement`_ (void elements such as `br`, `img`, `input` and `hr`, and self-closing tags in foreign content) are never pushed. Each comes from a start tag of its own of at least 4 characters (`<br>`, or `<g/>` inside `svg`), so a 2 MB document makes at most 524,288 of them: 2 MB of `<br>` made 524,289 elements in 243 ms, with about 209 MB of heap (sketch). Bounded by the document bound; no count. Where such an element is fostered out of a table or moved by the adoption agency, the walk of its parent's child list is the List steps' (above), not this path's.
    - _The adoption agency's re-created elements_ enter the stack by `replace`, which calls no hook. By K-0082 §7's reading each outer pass re-creates at most three and adds one by `insertAfter`, which the Element count sees, so a parse makes at most three re-created elements per counted push; `AA_OUTER_LOOP_ITER` (8) and `AA_INNER_LOOP_ITER` (3) hold one call to at most 32 elements. A search of 200,000 generated documents of formatting elements, blocks and their end tags found at most 0.64 re-created elements per push (this task). Bounded by the Element count; no count. The detach and the moves of their children are the List steps' (above).
    - _MathML `annotation-xml` attribute reads._ Each time such an element without `encoding` becomes the current node, `_setContextModes` reads its attributes (K-0082 §7 (c)). It holds at most 256 (the Attribute count), and it becomes current only at a push or a pop, of which a parse has at most 1,048,576 pushes and no more pops than pushes, so the reads are at most 256 per push or pop. The parser calls the adapter's hook before `_setContextModes`, so a stop at a push comes before that push's read. 2 MB of `<x></x>` under an `annotation-xml` holding 256 attributes took 371 ms, uncut (sketch). Bounded by the Attribute count and the Element count; no count.
    - _The Noah's Ark compare._ Each `a`, `b`-group or `nobr` start tag runs a pass over the active formatting entries above the last marker, and compares the attributes of each candidate of the same name and attribute count (K-0082 §7 (c)); a re-created element shares its first token's list, so the compare can read one list many times. Each such tag re-opens the entries not yet open before it is pushed, so by our reading of §7 (c) every entry above the marker is then open, and so on the stack: at most 128 by the Nesting count. A compare reads at most 256 attributes (the Attribute count). 2 MB of `<b>` tags of 256 attributes, each closed at once, under 125 open `b` tags of 256 attributes that differ in one value, took 713 to 755 ms, uncut (sketch). Bounded by the Nesting count and the Attribute count; no count.
- **The result** (spec Depth bound, The result; SEC-133-R1-5, FU-2). `readPage` always resolves to a `ReadResult` (read, refused or failed), never rejects. Each `await` of a port sits in its own `try` with a bare `catch {}` that binds no error, so no text of a port's error can reach the result: in `addressOf`, a rejecting `resolve` and an empty answer both return `network` (or `timeout` when `elapsedMs` has reached the 30 s); in `send`, a rejecting `request` returns `failed` with `network` (or `timeout` the same way). The walk then carries that failure to where the spec says it lands: the document fails the read, robots.txt is no answer, a stylesheet is a failed stylesheet. The synchronous ports `sha256` and `elapsedMs` are not wrapped, and `readPage` has no catch-all around its body: a catch-all would report a bug in the engine as `network`, which iron rule 4 forbids.
- **Headers.** Every request sends `user-agent: OriviloReader/1 (+<contact url>)` and nothing else that identifies the reader. It never sends a cookie or an authorization header.
- **Stylesheet links.** Links are taken from the document with an HTML tokenizer, never with a regular expression. §13 places the tokenizer in the engine (`parse5` pinned exactly, K-0082). The page text (§8) is read with the same parse. `stylesheetLinksOf` and `pageTextOf` share one parse function in `page-text.ts`, `parseBounded(bytes): { document, cut: boolean }`, which replaces the 1b build's `parseDocument`: it decodes the bytes as `html-text-1` states, then parses them through `parse5`'s `Parser` (Work bound, The List steps), scripting off, source locations on and the adapter of the Nesting count and the Work bound, and on a stop parses only the text before the cut again (Depth bound above). Each call parses again, so both see the same tree. `stylesheetLinksOf` returns `{ hrefs, incomplete }`: the hrefs as written, in document order, and whether the Nesting count, the Work bound or the walk cut anything. `readPage` resolves each href against the document's URL and keeps the `http` and `https` ones in a `Set` of serialised URLs (`URL.href`), in the order first seen. It stops at the eleventh distinct URL, which is past `MAX_STYLESHEETS` and so sets `page-incomplete`, and fetches the first ten. One pass, one `new URL` per href up to the stop and one set lookup each, where the 1b build checked each URL against a growing array (`hrefs.includes`) and read every link (SEC-133-R2-2). On the 2 MB page of 63,886 distinct links of row 7 the array took 3,585 ms, a set over every link 29 ms, and the set that stops at the eleventh 0.02 ms (sketch, this task); a page that repeats one link 63,886 times never reaches the eleventh and costs 22 ms.
- **Order.** Stylesheets are fetched in document order. The result keys each one by URL, so the analyser never depends on the order in which the answers arrive (row 4).

**The List steps, measured** (task `ORV-133-design-tech-r3-1`; Node 22.23.0, arm64, Apple M4; `parse5` 8.0.1 from the lockfile; scripts outside the repo, run with `tsx` from `packages/intent-engine`). "Head" is the repo's `stylesheetLinksOf` and `pageTextOf` at 29593ea, one run each; the documents that took more than 10 s ran three at a time, so their times carry contention. "List steps" is a sketch of `page-text.ts` with the four methods and `MAX_LIST_STEPS` at 268,435,456, two runs each, one at a time. Each document is 2 MB unless stated. A cut is the stop's offset; the steps are those of the first parse.

<!-- prettier-ignore -->
| K-0082 §8 row or source | Document | Head: links, text | List steps: links, text | With the List steps |
| --- | --- | --- | --- | --- |
| 1, adoption move (SEC-133-R3-1) | `<body><b><div>`, `<br>` 524,283 times, `</b>` | 92,633 ms, 95,620 ms | 365 to 369 ms, 342 to 343 ms | Cut at offset 9, the `<div>` |
| 2, foster-parented elements (SEC-133-R3-1) | `<body><table>`, `<br>` 524,284 times | 19,816 ms, 19,764 ms | 206 to 236 ms, 196 to 203 ms | Uncut, 524,284 steps |
| 3, foster-parented text (SEC-133-R3-1) | `<body>`, `<br>` 349,520 times, `<table>`, `a ` 349,520 times, `<tr>` | 35,020 ms, 35,087 ms | 254 to 256 ms, 339 to 348 ms | Uncut, 699,040 steps |
| 4, adoption agency detach of its last element | `<body><b>`, `<br>` repeated, `<div></b>` | 213 ms, 216 ms | 190 to 204 ms, 200 to 207 ms | Uncut, 524,286 steps |
| 5, frameset detach of `body` | `<head></head>`, `<!---->` repeated, `<div><frameset>` | 58 ms, 54 ms | 67 to 83 ms, 63 ms | Uncut, 299,591 steps |
| 6, DOCTYPE find | `<!---->` repeated, `<!DOCTYPE html>` | 58 ms, 53 ms | 64 to 65 ms, 61 to 63 ms | Uncut, no step |
| 7, active formatting list: nested templates | 124 nested `<template><p>`, level j holding 125 minus j `<b id=jxk>` and `</p>`, then `<b></b>` repeated | 2,580 ms, 2,566 ms (measured alone) | 389 to 397 ms, 314 to 382 ms | Cut at offset 303,968 |
| 7, stale markers | `<body>`, then `<template>`, 36 formatting tags and `<object></template>` repeated | 38,756 ms, 38,235 ms | 235 to 239 ms, 253 to 260 ms | Cut at offset 129,143 |
| 7, stale markers, then the adoption agency | 4,000 stale rounds, then `<b><span><span><span><div></b>` repeated | 14,039 ms, 14,768 ms (cut at the head as well) | 207 to 214 ms, 131 to 164 ms | Cut at offset 129,143 |
| 7, stale markers, then a long inner loop | 300 stale rounds, then `<b>`, 60 `<span>` and `<div></b></div>` repeated | 6,067 ms, 5,268 ms | 768 to 780 ms, 616 to 620 ms | Cut at offset 173,385 |
| 8, stack | The held-depth document of rows 7 and 36 | 511 ms, 605 ms | 519 ms, 657 to 662 ms | Uncut, no step |
| 9, template mode stack | 120 `<template>`, then `</template><template>` repeated | 146 ms, 136 ms | 157 to 159 ms, 138 to 140 ms | Uncut, 11,884,173 steps |
| 10, pending character tokens | `<body><table>`, `a ` repeated, `<tr>` | 275 ms, 437 ms | 293 to 294 ms, 463 to 464 ms | Uncut, 2,097,134 steps |
| 11, attributes | `<p`, 256 names and `>`, repeated | 465 ms, 463 ms | 464 to 470 ms, 451 to 458 ms | Uncut, no step |
| 12, tokenizer strings | `<body><p>`, `x ` repeated | 260 ms, 407 ms | 238 to 268 ms, 327 to 348 ms | Uncut, no step |
| R3-1, foster parenting | `<table>`, `x<br>` repeated | 79,466 ms, 77,153 ms | 237 to 239 ms, 277 to 283 ms | Uncut, 838,858 steps |
| R3-1, adoption move | `<body><b><div>`, `x<br>` repeated, `</b>` | 226,204 ms, 221,957 ms | 330 to 334 ms, 322 to 324 ms | Cut at offset 9 |
| R3-1, adoption move, 1 MB | The same at 1 MB | 59,120 ms, 64,764 ms | 308 to 319 ms, 286 to 297 ms | Cut at offset 9 |
| This task, foster parenting | `<table>`, `x<i></i>` repeated | 29,179 ms, 29,148 ms | 225 to 232 ms, 234 to 237 ms | Uncut, 524,286 steps |
| Element count | The re-opened-formatting document of rows 7 and 36 | 504 ms, 529 ms (cut by the Element count) | 551 to 602 ms, 598 to 599 ms | Cut by the Element count at offset 35,755, after 125,821,380 steps |
| Plain page | A DOCTYPE page of `<p>` paragraphs of lorem text | 102 ms, 93 ms | 108 to 112 ms, 94 to 109 ms | Uncut, no step |
| Plain page | A table of rows `<tr><td>Row N</td><td>...</td><td>ok</td></tr>` | 170 ms, 161 ms | 169 to 175 ms, 164 to 167 ms | Uncut, no step |
| Plain page | Inline `b`, `i`, `a`, `strong`, `em`, `span` and `code`, with misnested `<b>bold <i>both</b> italic</i>` and `<b><p>block</b> after</p>` | 186 ms, 161 ms | 189 to 194 ms, 165 to 167 ms | Uncut, 49,225 steps |
| Plain page | A table of rows `<tr><td>Row N</td></tr><br>`, a stray `<br>` per row | 493 ms, 532 ms | 183 to 185 ms, 190 to 192 ms | Uncut, 65,881 steps |
| Honest limit | `<b><div>`, `<p>Paragraph N</p>` repeated, `</b></div>` | 10,817 ms, 10,544 ms | 417 to 423 ms, 409 to 424 ms | Cut at the last `<p>`, offset 2,097,105 |

## 7. The render snapshot (`render-snapshot.ts`, slices 1a for `rendererBuildSchema` and 1c)

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
  | { ok: false; error: "id-collision"; ids: string[] }
  | { ok: false; error: "competitor-not-read" }; // ctx.role is competitor: competitor-not-read-1, below
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
- **This list is the code of option D, not its rule.** What option D keeps, what it lists as not measured and the four reasons are defined once, in spec "Reading a page the person submits", "Where it runs" (ADR 0019 decision 4 points there too). Any other place in these notes that names option D points here and to that paragraph, and does not list what it keeps (review g2-1 I1).

**The competitor gate (rule `competitor-not-read-1`, spec "Another brand's page", review g2-1 I2).** D1 (a) holds competitor URLs until the lawyer review, so the gate sits in front of the read, in the engine, where every caller has to pass it:

```ts
export type UrlInput = { url: string; role: InputRole }; // role as the person gave it, never guessed
export type NotRead = {
  status: "not-read";
  url: string; // recorded as text, 2,048 characters at most, never fetched
  line: "read.notRead.competitor";
};
/** competitor-not-read-1: the only engine export that reaches readPage. */
export async function readUrlInput(
  input: UrlInput,
  ports: ReadPorts,
  robots?: RobotsCache,
): Promise<ReadResult | NotRead>;
```

- **One gate before any request.** `readUrlInput` checks `input.role` first. For `competitor` it returns `NotRead` and calls neither `readPage` nor any port: no request for robots.txt, the page or a stylesheet, and no DNS lookup. For `own` and `reference` it calls `readPage(input.url, ports, robots)` and returns its result unchanged.
- **The only way in.** `index.ts` exports `readUrlInput` and not `readPage`, so `packages/page-reader` (the command in slice 1d, a later Vercel route) cannot reach the read without passing the gate. `readPage` stays exported from `read-page.ts` for the engine's own tests.
- **A second check on the bytes.** `analyseUrl` returns `{ ok: false, error: "competitor-not-read" }` when `ctx.role` is `competitor`, before it looks at `read`. Bytes of a competitor page that reached the engine some other way still never become evidence.
- **What the report holds.** The command prints the URL as text and the `read.notRead.competitor` line in Thai and English (§9), with no evidence and no `notMeasured` list, and exits 0. `--json` writes the same as the not-read member of `reportSchema` (below; row 38). A competitor URL found in a brief (row 21, slice 4) is recorded the same way and never handed to `readUrlInput`.
- **When it lifts.** Only when the owner changes D1 (a spec version bump). The change is the role check in `readUrlInput` and in `analyseUrl`, and rows 21 and 38 change with it.

**The report schema (`report.ts`, slice 1d; re-check g2-2 N5).** Spec rows 17 and 38 assert that the command's `--json` output "parses with the report schema". This is that schema. It lives in the engine, beside the types it is built from, so the command now and a later Vercel route write the same contract and a test can parse either. The command builds the object and writes it as is; the printed report in Thai and English is the same object with each line key filled from §9.

```ts
export const REPORT_SCHEMA_VERSION = "1.0"; // 1.0 at slice 1d; each member a later slice adds is a minor bump

const notReadReportSchema = z
  .object({
    version: z.literal(REPORT_SCHEMA_VERSION),
    status: z.literal("not-read"), // §7 NotRead, from readUrlInput for a competitor URL
    url: z.string().max(2048), // as the person gave it, never fetched
    line: z.literal("read.notRead.competitor"),
  })
  .strict();

const axisReportSchema = z
  .object({
    axis: personalityAxisSchema, // knowledge.ts, read-only
    leans: z // empty: the report prints "no signal" for the axis
      .array(
        z
          .object({ lean: z.enum(["high", "low"]), evidenceId: z.string(), confidence: z.number() })
          .strict(),
      )
      .max(5000), // the evidence bound; every reading on the axis above the floor, in compareEvidence order; none is picked (spec case 1)
  })
  .strict();

const analysedReportSchema = z
  .object({
    version: z.literal(REPORT_SCHEMA_VERSION),
    status: z.literal("analysed"),
    url: z.string().max(2048), // the URL read, after redirects
    renderer: rendererBuildSchema.nullable(), // analyseUrl's renderer: null under option D
    evidence: z.array(inputEvidenceSchema).max(5000), // analyseUrl's list, sorted (§5)
    notMeasured: z.array(notMeasuredSchema).max(4), // §7 NotMeasured as zod; empty with a valid snapshot
    personality: z.array(axisReportSchema).length(5), // one entry per PERSONALITY_AXES axis, in that order
    lines: z.array(z.enum(["report.conflictsNotChecked"])).max(1), // report lines of §9 keyed here, in this enum's order
    // slice 2 (1.1): industry: industryReadingSchema, the zod form of §10 IndustryReading; "industry.byNameOnly" joins the lines enum
    // slice 3 (1.2): mood, its shape fixed with mood-1 in slice 3
  })
  .strict();

export const reportSchema = z.discriminatedUnion("status", [
  notReadReportSchema,
  analysedReportSchema,
]);
export type Report = z.infer<typeof reportSchema>;
```

- **The two members.** `not-read` is §7's `NotRead` with the version added, and nothing else: no evidence, no `notMeasured`, no personality (row 38). `analysed` is what `analyseUrl` returns when `ok` is true, with the URL, the personality per axis and the report lines added.
- **Which slice adds which member.** Slice 1d: the schema with both members, `version` 1.0, the fields shown, and `lines` holding `report.conflictsNotChecked` (§9). Slice 2: `industry`, required, the zod form of `IndustryReading` (§10), and `industry.byNameOnly` in `lines`; version 1.1. Slice 3: `mood`; version 1.2. Slice 4: `detectConflicts` ships, the command stops writing `report.conflictsNotChecked`, and its enum member stays so a 1.0 to 1.2 report still parses at its own version.
- **Personality per axis.** The `leans` of an axis are its `identity-frame.personality.<axis>` readings above the floor, each with its evidence id and confidence. The report never folds them into one lean: two opposite leans print side by side until slice 4 flags them (spec case 1). Row 17's "lean or `no signal`" is one lean, several, or an empty list.
- **`notMeasured` lines.** The `read.notMeasured` lines are not in `lines`; the command prints one per `notMeasured` entry (§9, row 34), so the entry is written once.
- **What it does not hold.** A refused or failed read (§6 `ReadResult`) has no member in the 1.0 schema shown. The spec's open question "A report for a refused read" (v1.8, finding F19) sets the default for slice 1d: a third member, `refused`, carrying the refusal key (`read.refused.robots` or `read.refused.address`, the strings of rows 5 and 6) and the printed line, so `--json` always writes a report. The slice 1d spec designs that member, its fields, the command's exit code for a refused read and whether a failed read (row 7) uses it; this design adds no field or exit code ahead of it. The report is command output and is not stored, so a version bump has no migration: a reader parses a report at the version it was written with.
- **Determinism.** The same bytes, snapshot, clock and versions give a deep-equal report: `evidence` and each axis's `leans` follow `compareEvidence`, `notMeasured` is sorted by `what`, and `lines` follows its enum. No field holds a time other than the items' own `retrievedAt`.

## 8. Measures and readings (slice 1c)

**Page text (answer to the architect's second question).** The visible text spans come from the tokenized HTML, with a render or without one. A render only decides which of those blocks count as visible (finding F11).

- **One source of text.** `pageTextOf(documentBytes)` in `page-text.ts` (slice 1b) first decodes the bytes as rule `html-text-1` states (spec "Page text": UTF-8 by the global `TextDecoder`, each invalid sequence replaced by U+FFFD), then parses the document with the engine's pinned tokenizer (ADR 0019 decision 6), through the shared parse `parseBounded` (§6), so only the text before the cut of the Nesting count or of the Work bound is parsed. The Work bound's List steps replace three methods of the tree adapter (`insertBefore`, `insertTextBefore`, `detachNode`) and build the tree the default builds (§6, The List steps, The tree is unchanged), so the parse gives the same tree and the same paths. Scripting is off (`parse5`'s `scriptingEnabled: false`), as in the JavaScript-off render; under it the standard leaves `noscript` in the data state (K-0083). Both follow the WHATWG parsing rules, so both build the same tree, and an element path from one names the same element in the other.
- **Rule `html-text-1`** is defined in spec "Page text": the block list, the skipped subtrees, the whitespace rule, the body bound, the Heading bound, the Depth line, and what a render or its absence changes. `pageTextOf` implements it and returns `PageText`, `{ blocks, incomplete }`: `blocks` is `TextBlock[]`, `{ path, kind: "title" | "meta" | "heading" | "body", text, span }` in document order, where `text` is the normalised text that locator offsets index, and `incomplete` is true when the Nesting count, the Work bound, the depth bound of the walk (§6), the Heading bound or the Path bound cut something. A true `incomplete` means the read carries `page-incomplete` (spec "Confidence"), applied as §4 states; the body cut alone leaves it false, because the spec's `page-incomplete` row in "Confidence" names the cuts of the Nesting count, the Work bound, the depth, the heading and the path, and not the body cut. A change to the rule bumps `analyser.version`.
- **The Heading bound and the depth, as built in 1b** (SEC-133-3, SEC-133-4). The Heading bound is the spec's (`html-text-1`, Heading bound): `pageTextOf` keeps a heading counter of its own beside the body counter and cuts with the same whitespace cut, both sized by `BODY_MAX_CHARS`. Past `MAX_DEPTH` (128 elements, `html` counting 1; spec Depth bound, which §6 builds) an element gives no block and sets `incomplete`; so does the cut of the Nesting count or of the Work bound (its four counts, the List steps among them), through `parseBounded`'s `cut`.
- **The Path bound** (spec `html-text-1`, Path bound; R1-1, SEC-133-R1-4). `pathOf(e, cache): string | null` builds the path from the element up to `html`, adding each segment's length and one for each `>`, and returns `null` as soon as the running length passes `PATH_MAX_CHARS` (500, imported from `evidence.ts`, where it bounds a locator `path`), before it computes the next segment's `nth-of-type` index or joins anything; a path of exactly 500 characters is kept. So no path longer than 500 characters is built, and the cost of one path is at most about 500 characters plus one segment. `pathOf` checks the running length twice per segment: after the name and its `>`, and again after the `:nth-of-type(n)` suffix. The second check never changes the result, since `body` and `html` are still to be added and the first check at the next step rejects the same path; it only stops the string work one step earlier. The main session kept it on the builder's rework-2 report, because the spec's Path bound says the path is not built past the bound (F25). `blockOf` computes the block's text first and asks for the path only when the text is not empty; a `null` path means no block, and `pageTextOf` sets `incomplete`. The same holds for the meta description's path. The body and heading counters count only blocks kept, so a dropped block uses none of either bound. `pageTextOf`, `stylesheetLinksOf`, the text-node walk and `pathOf` are iterative (an explicit stack, or a loop up the parents), so no input depth can overflow the call stack. The text-node walk (`textNodesOf`) carries no depth check of its own, as the main session decided on the rework-2 report (R2-2, F26; §6, The walk): no inline element in a block lies deeper than the stack the Nesting count bounds (the builder's search of 400,000 generated documents found none), and the walk is iterative. The depth checks of the main walk and of `stylesheetLinksOf` stay, because a void element and an element the tree builder lifts (after `a`, `table`, `a`, a `td`) can lie deeper than the stack went, and both are tested (§14 rows 7 and 36).
- **One-pass `nth-of-type`** (SEC-133-4). The `:nth-of-type(n)` index of every child of a parent is computed in one pass over that parent's children and cached for the call, so the cost of all paths stays linear in the number of elements; a page of many sibling headings no longer costs a filter per block.
- **The 1b build's `TextBlock`, which slice 1d's renderer must match (row 35).** `span` is `{ start, end }`, offsets into the decoded document: from the start of the block's first text node to the end of its last, and for `meta` the whole `meta` element. `path` joins the element names from `html` down with `>`, and every segment except `html`, `head` and `body` carries `:nth-of-type(n)`, the element's 1-based position among its parent's children of the same name (for example `html>body>main:nth-of-type(1)>h1:nth-of-type(1)`), and is at most 500 characters, the locator bound; an element whose path would be longer gives no block (Path bound above). The renderer's `textBoxes` paths use this same form, or no path matches.
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
- `not-understood` clauses produce no evidence. A `conflicting` axis in one block yields both readings, unflagged. The flag and the question come from `detectConflicts` in slice 4 under `conflict-question-1` (§9). Until then every report prints `report.conflictsNotChecked`, from the first command in slice 1d (§9, review g2-1 S7).

```ts
// leans.ts
export type RuleValue = (typeof RULE_VALUES)[keyof typeof RULE_VALUES];
/** value-to-lean-1 (spec "Evidence first"): every RULE_VALUES entry maps to a lean; hypothesis is true for the "not too" value only (hypothesis-flag-1). */
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
- `hypothesis` is true, with a `hypothesisNote` naming the rule and its threshold: `measure-to-lean-1` is a member of `hypothesis-flag-1` as a whole, and `checkItem` clause 14 refuses `false`.

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
  // report lines (spec v1.3 and v1.5)
  "industry.byNameOnly": { th, en }, // printed while tsic-terms-1 is the only matcher
  "report.conflictsNotChecked": { th, en }, // printed from the first command (slice 1d) until detectConflicts ships (slice 4)
  // refusals and the not-measured line
  "read.refused.robots": { th, en },
  "read.refused.address": { th, en },
  "read.notRead.competitor": { th, en }, // competitor-not-read-1 (spec v1.5)
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

- **Where the report strings sit.** `industry.byNameOnly`, `report.conflictsNotChecked`, `read.notRead.competitor` (v1.5), `read.notMeasured`, the four `read.notRendered.*` reasons and the four `{what}` labels are report lines, not questions: they go in `EVIDENCE_STRINGS` only. `QUESTION_KEYS` keeps the six keys spec row 29 lists, because nothing asks the person to answer a "not measured" or "not read" line.
- **The maps from the result to a line.** `NotMeasured.reason` to its `read.notRendered.*` key and `NotMeasured.what` to its `{what}` label are two closed `Record`s in `evidence-strings.ts`, typed on the `NotMeasured` unions of §7, so a new reason or a new `what` fails the typecheck until it has a string.
- **Who prints the report lines.** `industry.byNameOnly` from slice 2, while `tsic-terms-1` is the only industry matcher (spec "Industry", Match terms). `report.conflictsNotChecked` from the first command, slice 1d, until slice 4 ships `detectConflicts` (spec case 1): the slice 1d report already shows unflagged `lexicon-1` readings that may disagree (§8; review g2-1 S7). `read.notMeasured` from slice 1d, one line per `notMeasured` entry (row 34); slice 1c returns the entries and tests the map. `read.notRead.competitor` from slice 1d, for a `NotRead` result (§7, row 38).
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
| `analyseUrl` | Accepts `null` for the snapshot and returns `notMeasured`; refuses `ctx.role` `competitor` with `competitor-not-read` (§7) | The CLI in `packages/page-reader` (slice 1d); a later Vercel route, which runs option D until ADR 0019's measurement; row 38 |
| `readUrlInput` (task 4, new contract) | The one engine export that reaches `readPage`, with the role gate of `competitor-not-read-1` in front; `index.ts` no longer exports `readPage` (§7) | `cli.ts` in `packages/page-reader` (slice 1d), which calls it instead of `readPage`; a later Vercel route; rows 5 to 7 still test `readPage` inside the engine; row 38 |
| `reportSchema` 1.0 (task 6, new contract) | The command's `--json` output: a `not-read` member and an `analysed` member, and by the spec's default for slice 1d a `refused` member whose fields and exit code the slice 1d spec decides (open question "A report for a refused read"); slice 2 adds `industry` (1.1), slice 3 `mood` (1.2) (§7) | `cli.ts` in `packages/page-reader` (slice 1d); a later Vercel route; rows 17 and 38; slice 2 and 3 builders |
| `RULE_IDS`, `HYPOTHESIS_RULES` (task 4) | `RULE_IDS` drops `word-count-1` and holds the spec's four ids; each later rule reading adds an id with a minor schema bump. `HYPOTHESIS_RULES` names the members of `hypothesis-flag-1` (§2) | Slice 1a builder (rows 2, 10, 11); slice 2 (`tsic-terms-1`, a whole member); slices that add a rule reading on `color.current`, `competitive-frame.lineup-candidate` or `reference.asset` |
| `checkItem` clauses 5, 6 and 14 to 17 (task 4) | Base `model-reading` whenever `fromModel` is true; a `model` reading needs `fromModel`; `hypothesis-flag-1`; base value from the table; a quote needs a `text` locator; `tool-default` factor with its origin and flag (§2) | Row 2's cases; every analyser that builds items (slices 1c to 7): a model's `asset-shown` item (slice 7) scores 0.7, not 1.0; a slice 6 `tool-default` reading must carry the origin and the flag |
| `checkAddress` (task 4) | Refuses `::`, `64:ff9b:1::/48` and Teredo; judges `::/96`, `::ffff:0:0/96`, `64:ff9b::/96` and `2002::/16` by the IPv4 they embed (§6) | Row 5; `security` review of slice 1b |
| `html-text-1` (`page-text.ts`) | New rule: the page text always comes from the document bytes | Rows 9, 10 and 12; slice 2's `matchIndustryTerms`, whose `TextBlock` is this rule's block |
| Slice 1b round 1 and its follow-ups (task `ORV-133-design-tech-r1-1`) | `RobotsRules` holds `RobotsRule` items (the normalised `pattern`, `anchored`, `parts`); `parseRobots` returns `DISALLOW_ALL` past `ROBOTS_MAX_RULES` or `ROBOTS_MAX_PATTERN_CHARS`; `robotsNormalise`, `findFrom` and the Nesting count's hooks in `parseBounded` are new; `robotsOf` no longer parses a robots.txt past `ROBOTS_MAX_BYTES`; `allowedUrl` refuses an `href` over `URL_MAX_CHARS`; port rejections are caught; `pathOf` returns `null` past `PATH_MAX_CHARS`; `parseBounded` replaces `parseDocument`. `evidence.ts` names `URL_MAX_CHARS` and `PATH_MAX_CHARS` where it wrote `2048` and `500`; no schema field or bound changes, so `EVIDENCE_SCHEMA_VERSION` stays (§6, §8) | `read-page.test.ts` and `page-text.test.ts` (rows 6, 7, 36); slice 1c's `analyseUrl`, which may get fewer blocks and `page-incomplete` more often; slice 1d's `node-ports.ts`, whose `request` reports `truncated` only past `maxBytes` and whose `resolve` may answer `[]`; the renderer's `textBoxes` paths (row 35), which never need a path over 500 characters; `security` re-check of PR 130. Profiles, recipes, components and screens: none |
| Spec v1.16 (task `ORV-133-design-tech-r1-2`: F20, F21, F22, row 6 timing) | `page-text.ts`: the Nesting count in `parseBounded` (`onItemPush`, `onItemPop` and the private `NestingStop`) replaces the Nesting pre-pass and its three element sets, and nothing is exported for it. `read-page.ts`: `parseRobots` counts every `allow` and `disallow` line toward `ROBOTS_MAX_RULES` (F21); `RobotsRule.parts` keep `%2A` and `%24` as written, and the new `matchAt` with `findFrom` matches them as literals (F22). No schema field, string, factor or bound of the evidence contract changes, so `EVIDENCE_SCHEMA_VERSION` stays (§6) | `page-text.test.ts` (row 36: the two prefix documents, the 512 and 513 boundary, the two cut-rule cases; the cases that pinned the three sets go) and `read-page.test.ts` (row 6: `/a-%2A.html` and 500 ms, a bound spec v1.22 moved to 2 s; row 7: the two prefix documents); slice 1c's `analyseUrl`, whose `page-incomplete` now follows the tree builder's nesting, not a token count; a site whose robots.txt names `%2A` or `%24` now refuses a page whose path holds that encoding; `security` and reviewer re-check of PR 130. Profiles, recipes, components and screens: none |
| Spec v1.17 (task `ORV-133-design-tech-r1-3`: F23) | `page-text.ts`: `MAX_DEPTH` goes from 512 to 128, so the Nesting count stops at the push that makes the stack 129 deep and the walk goes to 128. Nothing else in the code changes; no schema field, string, factor or bound of the evidence contract changes, so `EVIDENCE_SCHEMA_VERSION` stays (§6) | `page-text.test.ts` (row 36: the depth, `br`, boundary and cut-rule cases at the new numbers, the held-depth document, the `MAX_DEPTH` break-it at 127 and 129) and `read-page.test.ts` (row 7: the void-link case at 126 nested `div`, the held-depth document); a real page nested past 128 elements now reads with `page-incomplete` and gives no link and no text block past the bound, where before that began past 512; slice 1c's `analyseUrl`, whose `page-incomplete` follows; `security` and reviewer re-check of PR 130. Profiles, recipes, components and screens: none |
| Spec v1.20 (task `ORV-133-design-tech-r2-1`: R2-1, R2-2, SEC-133-R2-1, SEC-133-R2-2) | `page-text.ts`: `parseBounded` runs the Work bound, the scan `attributeCut` before the first parse, a `pushes` counter in `onItemPush` beside `depth`, and an `adoptAttributes` override in the same adapter object, the last two stopping with `NestingStop`; two private constants, `MAX_ELEMENT_PUSHES` and `MAX_ATTRIBUTES`, and no export; the third parse of the empty text becomes reachable and gets a test (F31). `read-page.ts`: the stylesheet URLs go into a `Set` and the loop stops at the eleventh distinct `http` or `https` URL. `textNodesOf` keeps no depth check (R2-2, F26). No schema field, string, factor or bound of the evidence contract changes, so `EVIDENCE_SCHEMA_VERSION` stays (§6, §8) | `page-text.test.ts` (row 36: the four Work bound documents, the boundary cases of the three counts, the end-tag case if F27 is accepted, the quoted-value and desync cases of the scan, the third-parse case) and `read-page.test.ts` (row 7: the four Work bound documents and the page of stylesheet links); slice 1c's `analyseUrl`, whose `page-incomplete` now also follows the Work bound; a real page with a tag of more than 256 attribute names, or a tag-like run of as many inside a comment, a text element or an attribute value (F28), now reads only up to it; a page with later `html` or `body` tags merging more than 256 attributes reads only up to the latest start tag pushed before the stop (F29); slice 1d's function memory (F30); the ORV-133 spec, which copies rows 7 and 36; `security` and reviewer re-check of PR 130. Profiles, recipes, components and screens: none |
| Spec v1.21 (task `ORV-133-design-tech-bookkeeping-7`: F27 to F31) | No design beyond the v1.20 row: §6 already starts a scan run at `</` and a letter (F27), cuts the Attribute merge at the latest start tag pushed (F29) and returns the parse of the empty text when the second parse stops (F31); F28 changes only the honest limit's wording, and F30 keeps `MAX_ELEMENT_PUSHES` at 1,048,576 with no code. No schema field, string, factor or bound of the evidence contract changes, so `EVIDENCE_SCHEMA_VERSION` stays (§6) | `page-text.test.ts` (row 36, beyond the row: the end-tag case, now in force, and the third-parse case); a real page with an end tag of more than 256 attribute names now reads only up to it (F27); slice 1d's function memory, set against the heap the spec's "Hypotheses" (the Work bound) states, and its spec when written (F30); the ORV-133 spec, which cites the version; `security` and reviewer re-check of PR 130. Profiles, recipes, components and screens: none |
| Spec v1.22 (task `ORV-133-design-tech-r3-1`: the row 6 timing on CI, Slice 1b CI findings) | No design change: `robotsAllows` and the 500 KB file of 5,000 rules are unchanged, and row 6's time guard on that file goes from 500 ms to 2 s (§6 `robotsAllows`, §14 row 6) | `read-page.test.ts` (row 6: the bound of the 5,000-rule case); the fix report's measured time. Profiles, recipes, components and screens: none |
| The List steps (task `ORV-133-design-tech-r3-1`: R3-1, SEC-133-R3-1; F35 to F40, for the main session) | `page-text.ts`: `MAX_LIST_STEPS` (268,435,456) and a `steps` counter per parse; the adapter gains `insertBefore` and `insertTextBefore` that find the reference from the end, and a `detachNode`, each adding the walk to `steps`, and `onItemPush` adds the length of the list of active formatting elements; `parseBounded` parses through `new Parser` and `tokenizer.write` in place of `parse5.parse`, reading two names `parse5` marks internal (F37). The tree, the cut rule and `incomplete` are unchanged, and the third parse is now reachable through the List steps too (F39). No schema field, string, factor or bound of the evidence contract changes, so `EVIDENCE_SCHEMA_VERSION` stays (§6) | `page-text.test.ts` (row 36) and `read-page.test.ts` (row 7): the List steps documents, the boundary pair and the third-parse case (§14); slice 1c's `analyseUrl`, whose `page-incomplete` now also follows the List steps; a page with a formatting end tag misnested over a block of more than 23,169 direct children is now cut (F38); the spec's Work bound and Depth bound (F35, F36, F38, F39), rows 7 and 36 (F40) and K-0082 §8 (F37); `security` and reviewer re-check of PR 130. Profiles, recipes, components and screens: none |
| `evidenceId` (task 3) | Hashes `source` without `retrievedAt`, as the spec's `id` row says (§3). A re-read of unchanged bytes keeps its ids | Row 4 (later-clock case); `feedEvidence` (slice 4), whose lists no longer gain duplicates on a re-read; the owner at G2, who may put the clock back (then row 4 expects new ids) |
| `EVIDENCE_STRINGS` (tasks 3 and 4) | Every key under the spec's "Strings" (unchanged since v1.5): adds `industry.byNameOnly`, `report.conflictsNotChecked`, `read.notRead.competitor` (task 4), `read.notMeasured`, the four `read.notRendered.*` reasons and four suggested `{what}` label keys (§9). `QUESTION_KEYS` unchanged at six | Designer and owner review of the copy; the CLI (slices 1d and 2); rows 29 and 38 |
| Rule names (tasks 3 and 4) | §2, §4, §7, §8, §9 and §10 name `thousandths-1`, `industry-margin-1`, `conflict-question-1`, `industry-level-1`, `html-text-1`, `word-count-1`, `measure-to-lean-1`, `value-to-lean-1`, `tsic-terms-1`, `hypothesis-flag-1` and `competitor-not-read-1` and point to the spec's section; `withinMargin` loses its `margin` parameter | Builders of slices 1a, 1b, 1c, 1d and 2 |
| ORV-126 state, node record `evidence` field | Must hold input evidence beside proxy answers and references: an entry `{ kind: "input", item: InputEvidence }` in a discriminated union, sorted by node number then id. ORV-126 has no code yet, so its slice 1 defines the union with this member. No ORV-126 rule reads the items | ORV-126 slice 1 builder; `feedEvidence` (slice 4); rows 19, 22 and 24 |
| ORV-20 colour node (`color-audit.ts`, `color-rules.ts`, `color-knowledge.ts`) | Untouched. `classifyHex` and `hexSchema` are imported read-only; `auditLineup` and `decideColor` take no evidence argument. The G3 packet shows an empty `git diff origin/develop -- packages/intent-engine/src/color-*.ts` | ORV-20 owners |
| ADR 0008 | Addition: a computed confidence number for input evidence (D6 a). Decision 2 and the brief `interpretationSchema` are unchanged, and a brief finding still cannot carry a confidence | Every adapter author |
| `resolver.ts`, `interpreter.ts`, `knowledge.ts` | Imported read-only; no change | None |
| `index.ts` | New exports | Engine consumers |
| `packages/intent-engine/package.json` | `@material/material-color-utilities` pinned exact (slice 1c, if accepted); `parse5` 8.0.1 pinned exact, `entities` 8.1.0 held by the lockfile (slice 1b, K-0082 option A) | `security` review (supply chain) |
| Profiles, recipes, components, screens | None. No token, recipe, component or screen changes, and `pnpm contrast` output is unchanged (row 31) | None |

## 12. Budget: slice 1 does not fit 400 lines

These are estimates of production lines, without tests or fixtures:

<!-- prettier-ignore -->
| Part | Files | Lines | Rows |
| --- | --- | --- | --- |
| 1a schema, confidence, strings, lean rules | `evidence.ts` 175 (`HYPOTHESIS_RULES` and `checkItem` clauses 14 to 17 added), `confidence.ts` 60, `evidence-strings.ts` 80 (the v1.3 and v1.5 keys; the two maps of §9 and the four `{what}` keys move to 1c), `render-snapshot.ts` 12 (`rendererBuildSchema` and `RendererBuild` only), `leans.ts` 45, `index.ts` 5 | about 375 | 1, 2, 3, 32, 29 to 31 (and unit tests for `value-to-lean-1` and `measure-to-lean-1`) |
| 1b safe read and page text | `read-page.ts` 320 (address 100 with the IPv6 parser and the embedded IPv4, robots 80, read 140), tokenizer wrapper and link extraction 20, `page-text.ts` 80 | about 420 | 5, 6, 7, 36, 29 to 31 |
| 1c renderer contract, measures, URL analyser | `render-snapshot.ts` 48 (`renderSnapshotSchema` and the `Renderer` port; the build schema shipped in 1a), `evidence-strings.ts` 10 (the two maps of §9 and the four `{what}` keys), `measures/colour.ts` 120 (declared fonts added), `measures/page.ts` 70, `url-analyser.ts` 170 (the not-measured path and `readUrlInput` with its role gate added, text extraction moved to 1b) | about 420 | 4, 8 to 12, 34, 35, 38, 29 to 31 |
| 1d server-only: `packages/page-reader`, and the engine's `report.ts` | `node-ports.ts`, `render-playwright.ts`, `cli.ts` (§13), with the report's not-read path; `report.ts` 45 in the engine (§7, "The report schema") | about 205 | 34, 35, 37, 38, 29 to 31; the live smoke in the G3 packet |

The total is about 1,215 lines for 1a to 1c, or about 1,420 with 1d. The rows per slice are the spec's "Delivery" table. **Four PRs, 1a, 1b, 1c and 1d** (finding F1, accepted in spec v1.3; 1d added in spec v1.5, review g2-1 S8).

- 1a and 1b do not wait on the renderer decision.
- 1c defines the `Renderer` port and tests `analyseUrl` on recorded snapshots; it does not wait on a browser.
- 1d waits on 1c and on a TypeScript runner for the command (spec "Open questions"); its merge accepts ADR 0019's POC part (§13, ADR 0019 Status).
- `security` reviews 1b, 1c and 1d (outside reads, `parse5`, the competitor gate, `playwright`).

**Slice 1d** (spec "Open questions", slice 1c's size, decided at G2 by the orchestrator and open for the owner). `packages/page-reader` is its own PR right after 1c. 1c is the engine part, about 420 lines: rows 4, 8 to 12, the engine halves of 34, 35 and 38, and 29 to 31, with `analyseUrl` tested on recorded snapshots and `readUrlInput` over fake ports. 1d is about 205 lines, `report.ts` included, and carries row 34's budget test, the renderer tests of rows 35 and 37, and the command half of row 38. What the option D result holds is §7's, under spec "Where it runs"; this paragraph only says which PR tests it. ADR 0019's POC part is accepted when 1d merges into `develop`, not when 1c does. If the owner wants one PR instead, 1c is about 580 lines and 1d disappears (a spec version bump).

## 13. Renderer and fetcher placement (architect)

Decided in ADR 0019 (proposed), on K-0081 (0.8). Summary for this design:

- **Where.** A new server-only package, `packages/page-reader` (`@orivilo/page-reader`, Node only). It holds `node-ports.ts` (`ReadPorts` on `node:dns/promises`, `node:http`/`node:https` connected to the checked address, `node:crypto`, `performance.now()`), `render-playwright.ts` and `cli.ts` (`pnpm analyse:url`, whose `--json` report follows `reportSchema`, §7). The engine defines a `Renderer` port, `render(read) => Promise<unknown>`, whose result it parses with `renderSnapshotSchema`, and never imports the package. `apps/web` does not depend on it in the POC.
- **POC renderer.** Playwright pinned exactly at `1.56.1`, the version `packages/design-system` already pins, as a dev dependency, with its own bundled Chromium, on the machine that runs the command. No Vercel function launches a browser in the POC.
- **The renderer never fetches.** It gets the document and stylesheet bytes `readPage` read. Every browser request is intercepted: those URLs are answered from memory, all others are aborted. JavaScript is off; one fresh context per analysis, closed in a `finally`; viewport 1280 x 800; the render uses what is left of the read's 30 s budget by the same `elapsedMs`.
- **Fallback (option D).** Option D is the fallback everywhere the analysis runs, the POC command and a later Vercel route alike, and it is labelled as not rendered. What it keeps, what it lists as not measured and its reasons are defined once, in spec "Reading a page the person submits", "Where it runs"; its code is §7 ("Without a snapshot"). This section adds nothing to either (review g2-1 I1).
- **The role gate.** `cli.ts` calls `readUrlInput`, never `readPage`, so a competitor URL is never fetched. The rule is `competitor-not-read-1` in the spec; its code is §7 ("The competitor gate").
- **Vercel, later slice (option B).** `@sparticuz/chromium` pinned at `153.0.0` with `puppeteer-core` pinned at `25.11.0` (Puppeteer's table pairs it with Chromium 153.0.8010.36, K-0081), Node.js runtime on Node 24.x, `maxDuration` on the route, the same interception rules. Until the staging measurement in ADR 0019's Confirmation line (bundle under 250 MB; 20 analyses of a 10-stylesheet page, 10 cold, each within 30 s and under 1600 MB rss) is recorded, the route runs option D. Options A (pack fetched by URL at cold start) and C (Playwright with an outside Chromium, 156 expected against 153) are not chosen.
- **Tokenizer (§6).** In the engine, pure and pinned, because 1b reads links before any renderer exists and option D has none. Slice 1b pins `parse5` 8.0.1 exactly, with `entities` 8.1.0 held by the lockfile (K-0082 option A), after K-0082 recorded its licence, version and dependencies.

Open points this placement raised, and where each now stands:

- `ds-architect`, the renderer build in the snapshot or the source: answered in §7 ("The renderer build"); both carry it.
- `ds-architect`, text under option D: answered in §8; the text always comes from the document bytes by rule `html-text-1`.
- Implementer at slice 1d: the command needs a TypeScript runner. The engine's extensionless imports do not run under Node's type stripping; a pinned runner would be a new dev dependency that needs an entry and a `security` review (spec "Open questions").
- Rule owner: `.claude/rules/security.md` does not list `packages/page-reader/**` in its paths.

Tests that prove the placement are in §14, not repeated here: row 34's budget test, the renderer tests of rows 35 and 37 and the command half of row 38 (slice 1d, in `packages/page-reader`, local fixtures only, no network, ADR 0009 point 8), and row 30's source scan that keeps `@orivilo/page-reader` and `node:` modules out of the engine.

## 14. Tests that prove determinism and conflicts

Each test names its "break it" check: the change to the code that must turn it red before handoff. Row numbers are the spec's; S1 is the boundary test of `industry-margin-1`. The Slice column follows the spec's "Delivery": the tests in `packages/page-reader` are slice 1d (§12).

<!-- prettier-ignore -->
| Row | Test | Asserts | Break it | Slice |
| --- | --- | --- | --- | --- |
| 1 | `evidence.test.ts` › "a valid item" | Items at each bound parse: a 300-character quote; confidence 0 (`tool-default`) and 1 (`measure`, no factors); an empty `basedOn`; a `fromModel` item with `model`. `JSON.parse(JSON.stringify(x))` parses and is deep-equal. `evidenceId(x) === x.id` | Loosen `max(300)` to 299: red | 1a |
| 2 | `evidence.test.ts` › "bounds and forbidden fields" | One case per bad field, each asserting the issue path: `html`, `css`, `screenshot`, `pageText`, `score` (zod reports `unrecognized_keys` at the root with the key in `keys`; the test asserts the key), `measure`, `model` (both directions), `observation.quote`, `confidence.value`, `observation.kind`, `reading.target`, `hypothesisNote`. Added: a confidence value that is not the computed one (0.9 with base 0.7) fails at `confidence.value`; a `rule-reading` base on a measure-only item fails at `confidence.base`; an id that is not `evidenceId` fails at `id`; an item whose `contentHash` or `source.renderer` was changed after the id was computed fails at `id`, and one whose `retrievedAt` alone was changed still parses (§3) | Remove `.strict()` or one `checkItem` clause: that case goes red. Hash `item.source` whole in `evidenceId`: the `retrievedAt` case goes red | 1a |
| 2 | `evidence.test.ts` › "the renderer fits the observation" | A `colour-area` item with `source.renderer: null` fails at `source.renderer`; a `colour-declared` item with a build fails there too; a `text-span` parses both ways; a build with `browserVersion` "153" (one part) fails | Drop check 13: the first two cases go red | 1a |
| 2 | `evidence.test.ts` › "base, quote and tool-default fit the item" | Clause 5 (I3): an `asset-shown` item with `fromModel: true`, its `model`, no reading and base `measure` fails at `confidence.base`; the same item with base `model-reading` (0.7) parses. Clause 6: a reading `by: "model"` with `fromModel: false` fails at `fromModel`. Clause 15 (S4): base `{ id: "rule-reading", value: 0.8 }` fails at `confidence.base.value`. Clause 16 (S4): a `text-span` quote on an `element` locator fails at `observation.quote`. Clause 17 (S4): a reading with factor `tool-default` and `origin: "input"` fails at `confidence.factors`, and with `origin: "tool-default"` but no `tool-default` flag fails there too | Give base `measure` to every item with no reading: the I3 case goes red. Drop clause 15, 16 or 17: its case goes red | 1a |
| 2 | `evidence.test.ts` › "hypothesis-flag-1" | Clause 14 (I4), on the inputs of the spec's ninth worked example (`rules` of rows 11, 13 and 10, `lexicon-1` alone, a model reading): a `measure-to-lean-1` reading and a `tsic-terms-1` reading with `hypothesis: false` fail at `hypothesis`; a `lexicon-1` + `value-to-lean-1` reading parses with `true` (and its note) and with `false`; a `lexicon-1` reading alone, a model reading and a measure with no reading, each with `hypothesis: true`, fail at `hypothesis`. A unit case pins `HYPOTHESIS_RULES` to the spec's members and checks each is in `RULE_IDS`; another pins `RULE_IDS` to the spec's four ids, without `word-count-1` (S5) | Treat `value-to-lean-1` as a whole member: the `false` case goes red. Let any rule reading say `true`: the `lexicon-1` case goes red | 1a |
| 3 | `evidence.test.ts` › "confidence is computed, never reported" | `scoreConfidence("measure", ["page-incomplete"])` returns a `confidence.value` of 0.7 with `belowFloor: false`. `scoreConfidence("model-reading", ["single-signal", "few-words"])` returns a `confidence.value` of 0.392 with `belowFloor: true`. Factors are listed in id order with their values. `EVIDENCE_FLOOR === 0.5`. Values as the spec's `thousandths-1` worked example prints them | Return the unrounded product: `toBe(0.392)` goes red (0.39199999999999996) | 1a |
| 32 | `evidence.test.ts` › "one mild factor stays, two fall" | Under `thousandths-1`: 0.56 not below; 0.49 below; 0.392 below; `image-small` on a measure gives 0.5, not below. Every permutation of the factor list gives the same value | Change `<` to `<=` in the floor check: the 0.5 case goes red. Drop the factor sort: the permutation case is red if any order differs | 1a |
| S1 | `evidence.test.ts` › "the margin is in thousandths and inclusive" | `industry-margin-1`, inputs from its worked example: `withinMargin(0.7, 0.6)` and `withinMargin(0.8, 0.7)` are true; `withinMargin(0.7, 0.599)` is false; `withinMargin(0.9, 0.6)` is false; `withinMargin(0.7, 0.65)` is true | Compare raw differences (`a - b <= 0.1`): the 0.8 and 0.7 case goes red | 1a |
| 29 | `evidence.test.ts` › "every string is Thai and English" | Every key of `EVIDENCE_STRINGS` (all of spec "Strings", the v1.3 and v1.5 keys `industry.byNameOnly`, `report.conflictsNotChecked`, `read.notRead.competitor`, `read.notMeasured`, the four `read.notRendered.*` and, from 1c, the four `{what}` labels among them) and every `QUESTION_KEYS` entry has non-empty `th` and `en`, with no U+2014 and no U+00B7. `QUESTION_KEYS` equals the six keys of row 29, each a key of `EVIDENCE_STRINGS`. From slice 1c, every `NotMeasured.reason` and every `NotMeasured.what` maps to a key that exists | Add a key with an empty `th`: red. From slice 1c, delete `read.notRendered.budget`: the map case goes red (and the typecheck) | 1a (strings), 1c (the maps), each |
| 30 | `evidence.test.ts` › "measures never call a model" | Source scan of the engine modules spec row 30 lists for imports of `openrouter`, `llm-interpreter`, `@orivilo/page-reader` and any `node:` module, and for `Math.random` and `Date.now`. The test name lists the forms it blocks: single-line import, multi-line import, side-effect import, dynamic `import()`, `export ... from`. One failing fixture per form (L-0024) | Feed each fixture: each red. Add `import "node:dns"` to `url-analyser.ts`: red | 1a, each |
| 5 | `read-page.test.ts` › "public addresses only" | Each of the first twenty-two URLs in row 5 is refused with `read.refused.address` and no evidence: `http://[::]/` (the unspecified address) and `http://[64:ff9b::a00:5]/` (NAT64 for `10.0.0.5`, I5); the userinfo URL `http://user:secret@example.test/` (R4); `https://example.com:6379/` and `http://example.com:443/` (a port that is not the scheme's default, SEC-133-7); `http://240.0.0.1/`, `http://198.18.0.1/`, `http://192.0.0.170/`, `http://[fec0::1]/` and `http://[::ffff:0:a00:5]/` (SEC-133-6); a redirect to a userinfo URL or to port 6379, and a stylesheet link with userinfo or on port 8080, among them. The fake network log has no request to a non-public address, no request URL holding a username or password, and no request on a port other than 80 or 443. `readPage` reads `http://[64:ff9b::808:808]/` (NAT64 for `8.8.8.8`, public), and the fake log shows its `/robots.txt` request before the page request (re-check g2-2 N3); it reads `https://example.com:443/` too. A fake `request` that reports a private `remoteAddress` after a public resolve is refused. `resolve` receives the time left of the 30 s as `budgetMs`. A `checkAddress` unit table: `::127.0.0.1`, `::ffff:10.0.0.5`, `::ffff:0:a00:5`, `2002:a00:5::1` (6to4 for `10.0.0.5`), `64:ff9b:1::1`, `2001::1`, `fec0::1`, `240.0.0.1`, `198.19.255.255`, `192.0.0.170`, `fe80::1%en0` and an unparsable literal are refused; `64:ff9b::808:808`, `::ffff:0:808:808` and `2002:808:808::1` (each `8.8.8.8`) and `198.20.0.1` are public | Skip the `remoteAddress` re-check: that case goes red. Stop unwrapping `::/96`, or drop `0/8`: an I5 case goes red (R8). Stop unwrapping NAT64: `http://[64:ff9b::a00:5]/` goes red. Stop unwrapping `::ffff:0:0:0/96`, or drop one of the four new ranges: its case goes red. Accept any port, or check only the username: the port or password case goes red. Pass a constant instead of the time left to `resolve`: the budget case goes red. Refuse every NAT64 address: the `readPage` read of `http://[64:ff9b::808:808]/` and the `8.8.8.8` unit case go red. Dropping `::` or `::1` from the outright list stays green, an equivalent mutant: the `::/96` unwrap judges them as `0.0.0.0` and `0.0.0.1`, which `0/8` refuses; both lines are kept for clarity (§6) | 1b |
| 6 | `read-page.test.ts` › "robots.txt first" | As row 6, with rules `robots-token-1`, `robots-group-1` and `robots-match-1` (spec "Reading a page the person submits", robots.txt). The fake log shows `/robots.txt` before any page request, and no page request on a refusal: the `*` disallow, the lower-case token, the 503, the token group over the `*` allow (R1, SEC-133-2), `User-agent: OriviloReader/1` (R2), the hostile pattern ending in `b`, `/สินค้า` and `/%70rivate` (Normalisation, SEC-133-R1-3), the file of 5,001 rules (Caps, SEC-133-R1-1), the `%2A` pattern (Matching, FU-6), the `/a-%2A.html` pattern for the path holding `%2A` (Matching, F22), the file of 500 KiB plus one byte (FU-4) and the file of 101 patterns of 1,000 characters (Caps, FU-5). The robots.txt redirect to `http://10.0.0.5/robots.txt` is refused with `read.refused.address` and no request to `10.0.0.5`. The URL of 2,049 characters in all is refused with `read.refused.address`, and the fake log holds no `resolve` and no request (FU-1); a URL of exactly 2,048 characters is requested. The page is read for the 404, the token group's allow over the `*` disallow, the robots.txt redirect to `https` (R3), the path of 38 `a`, the 1,001-character pattern (ignored) and the 500 KB file of 5,000 rules. Each hostile-pattern case returns within 1 s (SEC-133-1); the 500 KB file of 5,000 rules returns within 2 s (spec "Owner decisions", Slice 1b CI findings), and the fix report records its measured time. Beyond the row: `Disallow: /path/foo-%24` covers `https://example.com/path/foo-$` (FU-6), and `Disallow: /*%2A$` covers `/x%2A` and `/x*` but not `/x*y` (F22, an anchored last part holding a literal); `Allow: /pages` with `Disallow: /%70age`, for the page `/pages/x`, is read, because the normalised `/page` has 5 octets to `/pages`'s 6; a robots.txt of exactly 500 KiB is parsed; `robotsNormalise` on the inputs of the spec's normalisation worked example prints its output | Treat 503 as "no rules": red. Let `*` apply beside a named group: the token-over-`*` case goes red. Compare the whole `user-agent` value: the `OriviloReader/1` case goes red. Take a robots.txt redirect as disallow: the redirect-to-`https` case goes red. Turn a refusal on a robots.txt hop into complete disallow: the `10.0.0.5` case goes red. Follow more than 3 robots.txt redirects: the bound case goes red. Search a middle part of a pattern from the start of the path instead of after the part before: a `robots-match-1` case goes red. Drop the 1,000-character pattern bound: the 1,001-character case goes red. Match the pattern as written, without `robotsNormalise`: the `/สินค้า` case goes red. Decode no unreserved percent-encoding: the `/%70rivate` case goes red. Match `%2A` as the text `%2A` only: the `%2A` case goes red. Match `%2A` only against a written `*`: the `/a-%2A.html` case is read, red. Read `%24` as an end anchor: the `%24` case goes red. Rank matches by the pattern as written: the `/%70age` case goes red. Drop `ROBOTS_MAX_RULES`: the 5,001-rule case is read, red. Drop `ROBOTS_MAX_PATTERN_CHARS`: the 101-pattern case is read, red. Cut the answer at `ROBOTS_MAX_BYTES` and parse the head, as the 1b build did: the 500 KiB plus one byte case is read, red. Check only the path and query, or nothing, for length: the 2,049-character case makes a request, red; use `>=` for `>`: the 2,048-character case goes red. The 2 s case is a time guard with no mutant that reliably turns it red: the slowest plausible matcher, `String.prototype.indexOf` in place of `findFrom`, took about 73 ms on Node 22.23.0 (arm64, task `ORV-133-design-tech-r1-1`). Keeping the first match of a part rather than the least end is an equivalent mutant (§6, `robotsAllows`), so no case is listed for it | 1b |
| 7 | `read-page.test.ts` › "one page, logged out, bounded" | As row 7, from the fake log: headers, user agent, no request URL and no result URL holding a username or password, 10 stylesheets, 2 MB cut with `incomplete`, no 4th redirect, no image, font or script URL, no other page. The document of 5,000 nested `div` elements: `readPage` resolves with status `read` and `page-incomplete`, never rejects, and the stylesheet link inside the 600th `div`, below the depth bound, is not fetched (SEC-133-3). The five 2 MB documents (nested `div`; `<div></span>` repeated; `<div><script></div></script>` repeated; `<body><style><!--</style>` then nested `div`; `<body><svg><style>` then nested `g`): each resolves with status `read` and `page-incomplete` within 2 s (Nesting count, SEC-133-R1-2, F20). The held-depth document (`<body>`, 125 nested `div`, then `</p>` repeated to 2 MB, not past `DOCUMENT_MAX_BYTES`), whose every `</p>` pushes a fake `p` to `MAX_DEPTH` and pops it, so the stack is held at the bound and never passes it: `readPage` resolves with status `read`, no cut and no `page-incomplete`, within 10 s (F23, GATE-133-1); the fix report records its measured time. A sketch of the count outside the repo took 488 to 500 ms on it in five runs (Node 22.23.0, arm64, task `ORV-133-design-tech-r1-3`). After robots.txt answered 404, a `resolve` that rejects on the page's own lookup and a `request` that rejects on the page's own request, each with an `Error` whose message is a marker string: each resolves `failed` with `network`, never rejects, and `JSON.stringify` of the result holds no marker (SEC-133-R1-5). A host the fake resolver maps to `[]`: `failed` with `network`, the fake log holds no request, robots.txt included, and the result is not `read.refused.robots` (FU-2). Beyond the row: `<body>`, 126 nested `div` and `<link rel=stylesheet href=a.css>` in the innermost; the link sits at depth 129, but a void element is never pushed, so the count does not stop and only the walk skips it: `a.css` is not fetched, `page-incomplete`. The four 2 MB documents of the Work bound, robots.txt answering 404 for each (R2-1, SEC-133-R2-1; suggested case titles in quotes): the re-opened-formatting document (`<body><p>`, 120 `<b id=N>` with N from 0 to 119, then `<p>x` repeated while the whole stays within `DOCUMENT_MAX_BYTES`) resolves with status `read` and `page-incomplete` within 10 s and never rejects ("reads the re-opened-formatting document, cut by the Element count"); `<body>` then `<html aN>` with N counting from 0, `<body>` then `<body aN>` the same way, and `<body><p` then ` aN` with N counting from 0 and `>x`, each to 2 MB, each resolve with status `read` and `page-incomplete` within 2 s ("... cut by the Attribute merge", twice, and "... cut by the Attribute count"). The sketch of §6 took 588 to 711 ms per parse on the first, 106 to 107 ms on the next two and 2 ms on the last (Node 22.23.0, arm64, this task). The page of stylesheet links (`<head>` then `<link rel=stylesheet href=/N>` with N counting from 0, to 2 MB: 63,886 links): status `read` and `page-incomplete` within 2 s, and the fake log holds exactly 10 stylesheet requests, for `/0` to `/9` in that order (SEC-133-R2-2; "collects stylesheet URLs in one pass and stops at the eleventh"). The List steps documents, robots.txt answering 404 for each (R3-1, SEC-133-R3-1; §6, The List steps, measured; each to 2 MB): the adoption move document (`<body><b><div>`, `<br>` repeated, `</b>`), R3-1's `<body><b><div>`, `x<br>` repeated and `</b>`, and the stale-marker document (`<body>`, then `<template>`, the 36 formatting tags of §6 and `<object></template>` repeated) each resolve with status `read` and `page-incomplete` within 10 s and never reject ("reads the adoption move document, cut by the List steps", "... with text before each line", "reads the stale-marker document, cut by the List steps"); R3-1's foster-parenting document (`<table>`, then `x<br>` repeated) and SEC-133-R3-1's two (`<body><table>`, then `<br>` repeated; `<body>`, `<br>` repeated, `<table>`, `a ` repeated and `<tr>`) each resolve with status `read` and no `page-incomplete` within 10 s ("reads a page fostered out of a table in linear time, uncut", three times). The 10 s guards follow GATE-133-1: the sketch of §6 took 206 to 369 ms per call of `stylesheetLinksOf` on these documents, more than the documents under 2 s, and the head took 19.8 s to 226 s | Raise the stylesheet cap to 12: red. Drop `incomplete` from the walk's depth cut in `stylesheetLinksOf`: the void-link case goes red; drop it from `readPage`'s use of `incomplete`: the nested case goes red. Remove the depth skip: the void-link case fetches `a.css`, red. Parse without the hooks: each 2 MB case goes past 2 s. Count with a token pass in place of the hooks, as the Nesting pre-pass of the 1b fix did: the `<body><style><!--</style>` and `<body><svg><style>` cases go past 2 s. Catch the stop inside `onItemPush` and carry on: each 2 MB case goes past 2 s. Remove the `try` around `resolve` or `request`: `readPage` rejects, red. Put the caught error's message in the result: the marker case goes red. Run the robots.txt gate before `addressOf` on a page hop: the host with no address gives `read.refused.robots`, red. Stop at a `depth` of `MAX_DEPTH` instead of one more: the held-depth case is cut and carries `page-incomplete`, red. The 10 s bound on the held-depth case is a time guard (GATE-133-1): it does not pin the value of `MAX_DEPTH` (raised back to 512, the document still holds the stack at 128 and stays fast); row 36's `MAX_DEPTH` case pins the value. Count pushes but never stop at `MAX_ELEMENT_PUSHES`, or lower `pushes` in `onItemPop`: the re-opened-formatting case runs out of memory or past 10 s (the 2 MB page ran V8 out of a 4 GB heap, R2-1), red. Drop the `adoptAttributes` override: the `<html aN>` and `<body aN>` cases go past 2 s (29,133 ms at 508,896 bytes, SEC-133-R2-1), red. Skip the scan: the one-tag case goes past 2 s (2,501 ms at 268,900 bytes), red. Put back the growing array and `includes`: the page of links goes past 2 s (3,585 ms in the sketch), red; fetch eleven: red. Keep the `Set` and drop the stop at the eleventh: still green (29 ms in the sketch), a mutant this row cannot see, since the stop only saves work no output shows; the fix report lists it as such. Drop the `insertBefore` and `insertTextBefore` overrides, or find the reference from the front as the default does: the three foster-parenting cases go past 10 s (19.8 s, 35.0 s and 79.5 s at the head), red. Drop the `detachNode` step: the two adoption move cases go past 10 s (92.6 s and 226 s at the head), red. Drop the formatting list's length from `onItemPush`: the stale-marker case goes past 10 s (38.8 s at the head), red. | 1b |
| 36 | `page-text.test.ts` › "html-text-1" | A fixture with `script`, `style`, `template`, `svg`, a `hidden` element, an `aria-hidden="true"` element and `<noscript><p>Enable JavaScript</p></noscript>` gives `pageTextOf(bytes).blocks` for the title, the meta description, the headings, the body and the `p` inside the `noscript` (path ending `noscript>p`, text "Enable JavaScript") only, in document order, with the whitespace rule; body text stops at 5,000 characters on whitespace, with `incomplete` false; equal bytes give deep-equal results. `word-count-1` on "อยากให้สนุก" gives 3 where splitting on spaces gives 1, on the Node version the slice records (F13). The Heading bound (SEC-133-4): 40,000 `<h2>heading text here</h2>` give 294 heading blocks of 4,998 characters in all and `incomplete` true, within 2 s. The depth (SEC-133-3): 5,000 nested `div` elements whose innermost holds `<p>deep</p>` give no block for "deep", `incomplete` true and no exception. `MAX_DEPTH` is 128 (test "is 128"). No block can lie at depth 128 or 129: each segment below `body` is at least 17 characters with its `>`, so a block's path passes the Path bound below depth 30 (`html` counting 1), and a path to depth 128 is at least 2,151 characters (F24). The depth lines are asserted where no path is built or the path stays short. `<body>`, 126 nested `div` and `<br>` are not cut by the count (a void element is never pushed), and the walk meets the `br` at depth 129: `incomplete` true; with 125 nested `div` the `br` lies at depth 128 and `incomplete` is false (test "meets a void element one past the bound in the walk, which the count never sees"). Inline text at depth 128 before the stop: `<body><p>A`, 125 `<b>` and `x</p>` give the block "Ax", `incomplete` false (test "keeps the text of an inline element at depth 128"); with 126 `<b>` the last is the 129th open element, so the parse is cut inside the block and gives "A", `incomplete` true (test "cuts the parse inside a block: the text before the element past the bound is kept, the rest is not"); `<p>A`, 125 `<b>`, `x` and then `<b>y</b>` give "Ax", `incomplete` true: the text of the element at depth 128 is kept and that of the one past the bound is not (test "keeps the text of the element at depth 128 that comes before the one past the bound"). `stylesheetLinksOf`, which builds no path: `<body>`, 125 nested `div` and a stylesheet link keep the link at depth 128, `incomplete` false; with 126 nested `div` the void link lies at depth 129, where only the walk drops it; with 127 the last `div` is the 129th open element and the count stops before the link; both give no link, `incomplete` true (test "keeps a link at depth 128 and drops one past the Nesting count"). Rows 7 and 36 of the spec and the Depth and Path bound lines of `html-text-1` assert no block at depth 128 and need no change. 100,000 sibling `p` blocks get their paths in time (one-pass `nth-of-type`). One case per block-list member and per heading level against a control, a span over inline markup, and two titles (R5). The 2 MB nested page of row 7 and its two 2 MB pages that start `<body><style><!--</style>` and `<body><svg><style>`: each returned within 2 s, `incomplete` true (Nesting count, SEC-133-R1-2, F20). The held-depth document of row 7 (`<body>`, 125 nested `div`, then `</p>` repeated to 2 MB): returned within 10 s, not cut, no block (its `p` elements hold no text) and `incomplete` false (F23, GATE-133-1). The page of 509 long names: returned within 2 s, `incomplete` true, no block whose path is longer than 500 characters (Path bound, R1-1). Beyond the row: the 128 and 129 boundary of the Nesting count (test "stops the count at the push that makes the stack 129 deep: the text after it is not read"). `<body>`, 125 nested `div`, `<p>deep</p>`, 125 `</div>` and `<p>after</p>` push 128 at most, so nothing stops and "after" is read; the blocks are "after" alone, because the path of the `p` holding "deep" passes the Path bound (F24), and the case asserts the blocks only, since that drop sets `incomplete`. The same with 126 nested `div` pushes 129 at `<p>deep`, so it gives no block, `incomplete` true (the walk alone would keep "after"). The cut rule (§6, Where the cut falls): `<body>`, 125 nested `div`, `<link rel=stylesheet href=a.css>` and `<table><td>`, where a fake `tbody` makes 129, keeps the link in `stylesheetLinksOf` with `incomplete` true; `<body>`, 124 nested `div`, `<p><b></p><div><link rel=stylesheet href=a.css><div>x`, where a re-opened `b` makes 129, keeps the link with `incomplete` true. A block whose path is exactly 500 characters is kept and one of 501 is not. The fix report carries R5's rows of round 1: one L-0042 row per clause of `html-text-1` and `word-count-1`, with the two equivalent mutants and their reasons (spec "Owner decisions", round 1, R5). The four 2 MB documents of the Work bound of row 7 through `pageTextOf`: the re-opened-formatting page returned within 10 s, `incomplete` true; the `<html aN>`, `<body aN>` and one-tag pages each within 2 s, `incomplete` true (R2-1, SEC-133-R2-1). Beyond the row, the boundaries of the Element count, the Attribute count and the Attribute merge, and the scan's definition (suggested case titles in quotes; each checked on the sketch of §6, this task): `<body><p>A</p>` and 1,048,572 `</p>` make exactly 1,048,576 pushes and give the block "A", `incomplete` false; one more `</p>` makes the 1,048,577th and gives no block, `incomplete` true ("stops the Element count at the push that would be the 1,048,577th"; about 4 MB of text, which `pageTextOf` takes, since the 2 MB bound is `readPage`'s; 333 to 349 ms in the sketch). `<body><p>A</p><p` with 256 distinct names and `>B` gives "A" and "B", `incomplete` false; with 257 names the cut is at that `<p` and gives "A" only, `incomplete` true ("cuts at a tag that starts its 257th attribute name"). The same with `</p` for `<p` ("counts the attribute names of an end tag", F27). A head `<meta name=description content="` with 300 words and `">`, then `<p>A</p>`: the meta block and "A", `incomplete` false ("never counts the words of a tag's own quoted value"). `<!-- <a b="-->`, then `<p` with 257 distinct names and `>x`, then `<p c="y">z`: the run from the comment's `<a` reads a quoted value up to the `"` after `c=`, past the real `<p`, but the run started at that `<p` still passes 256, so no block, `incomplete` true; with 256 names, "x" and "z", `incomplete` false ("starts a run at every tag start, inside another run's quoted value too"). `<html a0><body><p>A</p>`, then `<html b0>` to `<html b254>` and `<p>B</p>`: the `html` element holds 256 names, so "A" and "B", `incomplete` false; with `<html b255>` too it would hold 257, the parse stops, and the cut is the `<p>` of "A", the latest start tag pushed, so no block, `incomplete` true ("stops the Attribute merge at the 257th attribute of html"); the same with `<body a0><p>A</p>` and `<body bN>` ("... of body"). The third parse (F31): `<title>T</title><template>`, 107 `<i></i>`, `<p>`, 120 `<b id=N>` and `<p>x` 8,700 times give no block, not even the title "T", `incomplete` true, within 10 s; with 108 `<i></i>` the second parse returns and the title "T" is the one block ("returns the parse of the empty text when the second parse stops too"). The List steps through `pageTextOf` (R3-1, SEC-133-R3-1; §6, The List steps): the adoption move document and the stale-marker document of row 7 each return within 10 s, `incomplete` true; R3-1's foster-parenting document (`<table>`, then `x<br>` repeated to 2 MB) returns within 10 s with its text and `incomplete` false. Beyond the row (each checked on the sketch of §6, this task): `<body><b><div>`, 23,169 `<br>` and `</b><p>after</p>` add 268,412,868 steps and give "after", `incomplete` false; with 23,170 `<br>` they add 268,436,038, the parse stops at the `detachNode` past the bound, the cut is the `<div>` at offset 9, and there is no block, `incomplete` true ("stops the List steps at the step past 268,435,456"; about 93 KB, 34 to 38 ms in the sketch). `<title>T</title><template>` and the stale rounds of row 7 to 2 MB give no block, not even "T", `incomplete` true, within 10 s; `<title>T</title><body><template>` and the same rounds give "T", `incomplete` true ("returns the parse of the empty text when the List steps stop the second parse", F39). The tree equality of §6 (The tree is unchanged) is the builder's to repeat as a generated-document check outside the suite and record in the fix report | Drop the `hidden` skip: red. Parse with `scriptingEnabled: true`: the `noscript` case goes red, because the `noscript` then holds raw text and no `p` element (S3). Count by `split(" ")`: the Thai case goes red. Leave headings unbounded, or let them share the body counter: the heading case goes red. Set `MAX_DEPTH` to 127 or 129: the "is 128" case goes red (the other depth cases are written from `MAX_DEPTH` and move with it). Drop `incomplete` on the walk's depth cut, drop the walk's depth check, or use `>=` in it: the `<br>` case goes red. In `stylesheetLinksOf`, drop the walk's `incomplete` or its depth check: the link case at 126 nested `div` goes red; use `>=` there: the fake `tbody` cut-rule case goes red. Filter the parent's children per block for `nth-of-type`: the timed case of 100,000 sibling blocks goes red. Drop one block-list member or heading level: its case goes red. Parse without the hooks: each 2 MB case goes past 2 s. Stop at a `depth` of 128: the 125 case loses "after" and the held-depth case is cut, red; stop at 130: the 126 case gives "after", red. Leave the stopping element's own offset out of the cut: the "Ax" then `<b>y` case gives "A", red. Parse the whole text again instead of the text before the cut: the case cut inside a block loses "A", red. Cut at the pushed element's own offset, `0` when it has none: both cut-rule cases lose the link, red. Keep a block whose path passes 500 characters: the long-names case goes red. Build the whole path, then check its length: the long-names case goes past 2 s. Use `>=` for `>` in the path check: the 500-character case goes red. Stop at `pushes >= MAX_ELEMENT_PUSHES`: the 1,048,576 case is cut, red; stop one later: the 1,048,577 case keeps "A", red. Lower `pushes` in `onItemPop`: the re-opened-formatting page is never cut and runs out of memory or past 10 s, red. Cut at 256 names in the scan: the 256 case loses "B", red; at 258: the 257 case keeps "B", red. Count words inside quoted values: the meta case is cut, red. Read a quoted value as one opaque step of a single run, with no run started inside it: the comment case gives "x", red. Start runs at `<` only, not `</` (F27): the end-tag case keeps "B", red. Drop the override, or compare the merged count with `>=`: the html and body merge cases go red (the 256-name case cut, or the 257 case read). Parse the text before the second cut instead of the empty text: the third-parse case gives "T", red; let the second stop escape `parseBounded`: `pageTextOf` throws, red. Raise `MAX_LIST_STEPS` to 268,436,038 or more: the 23,170 case gives "after", red; lower it to 268,412,867 or less: the 23,169 case loses "after", red. Drop the `detachNode` step: the 23,170 case gives "after" and the adoption move case goes past 10 s, red. Drop the formatting list's length from `onItemPush`: the List steps third-parse case gives "T" and the stale-marker case goes past 10 s, red. Drop the `insertBefore` and `insertTextBefore` overrides: the foster-parenting case goes past 10 s, red. Not seen, listed in the fix report: `>=` for `>` in the List steps' check, since no case lands on 268,435,456 exactly (the pair pins the bound to the 23,170 values from 268,412,868 to 268,436,037); and the step that `insertBefore` and `insertTextBefore` add, since the reference was the last child at every call measured, so each adds 1 and dropping it changes no cut. Equivalent, left green (F32, F34): in the scan's step table, `VALUE_DQ` on a double quote and `VALUE_SQ` on a single quote going to `SELF_CLOSING` instead of `AFTER_QUOTED`, because the two states have identical rows (whitespace to before name, `/` to self-closing, `>` ends, anything else starts a name); in `adoptAttributes`, pushing every offered attribute instead of the fresh ones, because a duplicate sits after the original in `recipient.attrs` and `attr()` reads the first match, so no output differs; and not returning early on an empty list, because the filter is empty then | 1b |
| 4 | `url-analyser.test.ts` › "same input, same evidence" | Run twice on the same recorded bytes, snapshot and `retrievedAt`: deep-equal results and equal ids. Run with the stylesheet answers in reversed order: deep-equal. The list equals itself sorted with `compareEvidence`. Run again with a later `retrievedAt`: equal ids, and the two results differ only at `source.retrievedAt` | Sort by array position instead of the locator key, or key stylesheets by index: red. Hash `retrievedAt` into the id: the later-clock case goes red | 1c |
| 8 | `url-analyser.test.ts` › "measures by code" | As row 8. For each scope, the `area-share` values of the `colour-area` items sum to 1 within 0.001; each cluster subject has a `hue-family` item equal to `classifyHex` | Drop a cluster from the output: the sum goes red | 1c |
| 9 | `url-analyser.test.ts` › "kept only as evidence" | Every result parses with `inputEvidenceSchema`; the serialized result contains no `<html`, no `{` from CSS and no raster bytes; each quote equals the `html-text-1` text of the document bytes at its span; `contentHash` equals `createHash("sha256")` of the recorded bytes (in the test); the analyser takes no file system port | Quote the whole block instead of the span: red | 1c |
| 9 | `url-analyser.test.ts` › "the snapshot cannot add text" | A `textBoxes` path that is not in the tokenized document is dropped and counted in `snapshot.unmatchedPaths`; no quote comes from it; a block whose path is missing from `textBoxes` is not kept | Keep blocks without a box: red | 1c |
| 10 | `url-analyser.test.ts` › "rule-based personality from page text" | As row 10, with readings `{ lean }` and `rules: ["lexicon-1", "value-to-lean-1"]`; the "premium" and "ไม่หรูหรา" items have `hypothesis: false`, the "not too premium" item has `hypothesis: true` and the note (`hypothesis-flag-1`); no item holds a number from 0 to 100 at `reading.value` | Map 40 to `high`: red. Set `hypothesis` true for every `value-to-lean-1` reading: the first two cases go red | 1c |
| 11 | `url-analyser.test.ts` › "measured leans are hypotheses" | As row 11; `basedOn` equals the id of the `warm-share` item | Remove `hypothesis` from measured leans: the schema refine and the test go red | 1c |
| 12 | `url-analyser.test.ts` › "low quality lowers confidence" | As row 12. The `lexicon-1` reading is exactly 0.343 under `thousandths-1`, below the floor, with factors `few-words` and `page-incomplete` and flags `quality.fewWords` and `quality.pageIncomplete`. Colour measures carry `page-incomplete` only (0.7) | Apply `few-words` to measures: the colour measure case goes red | 1c |
| 34 | `url-analyser.test.ts` › "no snapshot: declared colours and the page text" | `analyseUrl(read, null, ctx)` returns `colour-declared`, `font-family` with `sheet:` locators, `text-span` items and `lexicon-1` readings; no `colour-area`, `contrast-pair` or `density`; every item has `renderer: null`; `notMeasured` lists the four entries with reason `no-renderer`, sorted; a second run is deep-equal | Take text only from a snapshot: the `text-span` case goes red. Drop `text-visibility` from `notMeasured`: red | 1c |
| 34 | `url-analyser.test.ts` › "a bad snapshot runs as option D" | A snapshot with an extra key, or 5,001 `textBoxes`, gives the option D result with reason `snapshot-invalid`, not an error and not a partial render; `notMeasured` lists the four entries with that reason; every item has `renderer: null` | Repair the snapshot by stripping the key: red | 1c |
| 34 | `packages/page-reader` › "out of budget falls back to declared colours" | With a fake clock past the 30 s budget before the render, the result has `colour-declared` items and no `colour-area`, and `notMeasured` holds the four entries with reason `render-budget`. The CLI on a read with no renderer prints one `read.notMeasured` line per entry, with the `{what}` label and the `read.notRendered.none` text, Thai and English | Drop the fallback: red. Print the reason code instead of its string: the CLI case goes red | 1d |
| 35 | `url-analyser.test.ts` › "the renderer build is part of the source" | Same bytes, two snapshots with identical rasters and boxes that differ only in `renderer`: every `colour-area` id differs between the two runs; every `colour-declared` id is equal; each rendered item's `source.renderer` deep-equals its snapshot's | Leave `renderer` out of `source`: the first case goes red (the ids are equal) | 1c |
| 35 | `packages/page-reader` › "the renderer's paths match the tokenizer" | A local fixture rendered by Playwright 1.56.1: every `textBoxes` path names an element of `pageTextOf`'s tree, and `snapshot.unmatchedPaths` is 0; the snapshot's `renderer.driverVersion` is `1.56.1` and its `browserVersion` has four parts | Build paths without `:nth-of-type`: red | 1d |
| 37 | `packages/page-reader` › "no request leaves the renderer" | A local fixture with an outside image, font, script and iframe URL records zero requests leaving the process; only the read URLs are answered, from memory | Let unmatched requests continue: red | 1d |
| 37 | `packages/page-reader` › "scripts never run" | A fixture whose inline script repaints the background keeps the CSS colour in the snapshot | Turn JavaScript on: red | 1d |
| 37 | `packages/page-reader` › "fresh context per analysis" | A cookie set during the first of two renders is absent in the second | Reuse the context: red | 1d |
| 38 | `url-analyser.test.ts` › "a competitor URL is not read" | `readUrlInput({ url, role: "competitor" }, fakePorts)` returns `{ status: "not-read", url, line: "read.notRead.competitor" }` with the URL as given; the fake log has zero entries (no `resolve`, no robots.txt, no page, no stylesheet). The same URL with `role` `own` reads robots.txt first. `analyseUrl(read, null, { role: "competitor", ... })` returns `competitor-not-read` and no evidence. The engine's `index.ts` exports `readUrlInput` and not `readPage` | Move the role check after `readPage`, or drop it: the log is not empty, red. Export `readPage` from `index.ts`: red. Drop the check in `analyseUrl`: red | 1c |
| 38 | `analyse-url.test.ts` › "a competitor URL is not read" | `pnpm analyse:url --fixture clinic-th --role competitor` over a fake network that logs every request: zero entries; the report prints the URL and the `read.notRead.competitor` line in Thai and English, no evidence and no not-measured line; `--json` parses with `reportSchema` (§7, "The report schema") as its not-read member `{ version: "1.0", status: "not-read", url, line: "read.notRead.competitor" }`; exit 0. A source scan finds no `readPage` in `packages/page-reader` | Call `readPage` from `cli.ts`: the scan and the log go red. Add `evidence: []` to the not-read JSON: the `reportSchema` parse goes red | 1d |

Slice 1 has no cross-item conflict: conflicts land with slices 2 and 4 (rows 14, 22 and 33). Slice 1 proves the two contract conflicts it owns:

- the schema refuses contradictory items instead of repairing them (row 2: `fromModel` against `model` and `measure`, a reported confidence against the computed one);
- the margin rule is exact at its boundary (S1 test);
- an item that claims a render it cannot have, or hides the render it rests on, is refused (check 13), and a bad snapshot is reported as a failed render, never repaired;
- an item whose `hypothesis` disagrees with `hypothesis-flag-1`, or a model item that claims the base of a code measure, is refused (clauses 5 and 14);
- a competitor URL is refused before any request is made, never read and then discarded (row 38).
- a URL with a username or password, or on a port that is not its scheme's default, is refused on every request, never stripped and then read (rows 5 and 7).

Each refusal returns an error with a path; nothing is changed silently.

Determinism is proved by row 4 (same bytes, snapshot and clock give deep-equal results; a later clock keeps every id), row 35 (the renderer build moves rendered ids and leaves byte-only ids alone), row 36 (equal bytes give equal blocks and counts on the recorded Node version) and rows 3 and 32 (every factor order gives the same value).

## Findings for the spec

F1 to F12 were raised against spec v1.2 and applied in v1.3; F13 and F14 were raised against v1.3 and applied in v1.4, F14 settled further in v1.5 as slice 1d. The orchestrator accepted all fourteen under ADR 0012 decision 4, and each stays open for the owner at G2 (spec "Owner decisions" says where each lands). This design follows the spec version its front matter names; v1.9 recorded three deviations of the slice 1a build and raised no finding here, and v1.10 and v1.11 (the decoding of `html-text-1`) raised none either. v1.12 applied review round 0 of slice 1b and raised no finding here; "Slice 1b review round 0 findings" below records where each landed. v1.13 applied the RFC 9309 check and raised no finding here; "RFC 9309 check" below records where each point landed. The slice 1b build settled F13's open part (its Status says how). One status changed with v1.3: F3's "row 4 holds either way" no longer holds, because row 4 now asserts equal ids under a later clock; if the owner puts `retrievedAt` back, row 4's later-clock case expects new ids (§3). F15 to F17 were raised against v1.5 and applied in v1.6, and F18 against v1.6 (re-check g2-2 N4) and applied in v1.7, each accepted by the orchestrator under the same decision and open for the owner at G2. F19 was raised against v1.7 by this design's report schema (§7) and applied in v1.8, accepted by the orchestrator under the same decision and open for the owner at G2. v1.14 applied review round 1 of slice 1b and v1.15 its follow-ups; neither raised a finding here, and the two tables "Slice 1b review round 1 findings" and "Slice 1b review round 1 follow-ups" below record where each landed. F20 to F22 were raised against v1.15 by task `ORV-133-design-tech-r1-1` and applied in v1.16, with the timing point on row 6, in the table "Findings against spec v1.15"; F23 was raised against v1.16 by task `ORV-133-design-tech-r1-2`, in the table "Findings against spec v1.16", and applied in v1.17 by lowering the depth bound. v1.18 recorded RFC 9309 section 2.5 for the robots.txt size and the robots.txt decoding in "Hypotheses" and raised no finding here. F24 and F25, in the table "Findings against spec v1.18", record two decisions of the main session on the builder's rework-2 report; neither needs a spec change. F26, in the same table, records a third, kept in review round 2 (R2-2) with no spec change. F27 to F31 were raised against v1.20 by task `ORV-133-design-tech-r2-1`, in the table "Findings against spec v1.20", and decided by the main session under ADR 0012 decision 4, each open for the owner: F27 and F31 applied in v1.21 as contract changes, F28 and F29 applied there with no contract change, and F30 decided as option (a), the Element count unchanged and the heap a read needs stated in the spec's "Hypotheses". F32 to F34, in the table "Findings against spec v1.21", record three decisions of the main session on the builder's rework-4 report (task `ORV-133-build-rework-4`), each under ADR 0012 decision 4 and open for the owner; none needs a spec change or a code change. v1.22 moved the row 6 timing to 2 s on CI and raised no finding here. F35 to F40, in the last table, are raised against v1.22 by task `ORV-133-design-tech-r3-1` on review round 3 of slice 1b (R3-1, SEC-133-R3-1) and wait for the main session.

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
| # | Where in spec v1.3 | Finding | Proposed change | Status |
| --- | --- | --- | --- | --- |
| F13 | "Page text", `word-count-1` ("the Node version is pinned in `engines`"); "Worked examples" ("runs as is with `node` 24", "None of them was run"); row 36 | The Node version is not pinned: the root `package.json` says `"node": ">=22"`, and CI reads `.nvmrc`, which holds `22`. The worked examples were run by the main session on Node 22.23.0 (ICU 78.2), not on 24, while ADR 0019's later Vercel route runs Node 24.x. `Intl.Segmenter` data comes with the Node build, so row 36's count and every `few-words` decision may differ between the command, CI and that route | Slice 1b pins one Node line in `engines` and `.nvmrc` together and records `process.versions.node` and `process.versions.icu` beside row 36's count in its G3 packet. The spec's "Worked examples" says the Node version they were run on (22.23.0). Whether the Vercel route may run another Node line, and so another ICU, is decided in that route's slice, where `word-count` items would then differ as rendered items do across builds | Applied in v1.4: `word-count-1` in "Page text", "Worked examples", open question "The Node line". Settled by the slice 1b build: root `engines.node` `>=22.23.0 <23` and `.nvmrc` `22`; row 36 ran on Node 22.23.0 with ICU 78.2 (ORV-133 spec, open question "Which Node line"); the Vercel route's Node line stays with that route's slice |
| F14 | "Open questions", slice 1c's size; ADR 0019 status ("accepted when ORV-128 slice 1c merges") | If 1c splits, the renderer tests that ADR 0019's Confirmation line names (row 34's budget test, 35, 37) move to the PR after 1c, so "slice 1c merges" no longer marks the moment they pass | Read ADR 0019's POC acceptance as "when the PR that carries row 34's budget test, 35 and 37 merges" (§12). ADR 0019 is left unchanged by this task; the spec's open question on 1c's size can say so in one clause | Applied in v1.4, settled in v1.5: "Where it runs", "Delivery" row 1d, open question on slice 1c's size; ADR 0019 Status names slice 1d; §12 here |

<!-- prettier-ignore -->
| # | Where in spec v1.5 | Finding | Proposed change | Status |
| --- | --- | --- | --- | --- |
| F15 | "Reading a page the person submits", Address check; row 5 | The rule says "IPv4 or IPv6" but does not say how an IPv6 address that embeds an IPv4 address is judged, and row 5's Given has no IPv6 case beyond `::1`. Review g2-1 I5 found `::`, `::/96` and `64:ff9b::/96` left out | Address check adds: "the unspecified address, and an IPv6 address that embeds an IPv4 address (IPv4-mapped, IPv4-compatible, NAT64, 6to4) judged by that IPv4 address". Row 5's Given adds `http://[::]/` and `http://[64:ff9b::a00:5]/`. §6 and §14 row 5 already test them | Applied in v1.6: "Reading a page the person submits", the Address check line, which also refuses `64:ff9b:1::/48`, Teredo `2001::/32`, zone ids and unparsable literals and judges `2002::/16` by its IPv4; row 5's Given, which also reads `http://[64:ff9b::808:808]/` |
| F16 | Row 36, Given and "User sees" | With scripting on, `parse5` reads `noscript` as raw text, so a `noscript` holding plain text gives the same block either way and row 36's "the `noscript`" cannot catch the scripting setting (review g2-1 S3) | Row 36's Given: "a `noscript` holding a `p`"; "User sees": "the `p` inside the `noscript`". §14 row 36 already uses `<noscript><p>Enable JavaScript</p></noscript>` | Applied in v1.6: row 36, Given and "User sees" |
| F17 | "Worked examples", opening paragraph | It says the ninth line, `hypothesis-flag-1`, "has not been run yet". The main session ran it, and this task ran it again on Node 22.23.0 with ICU 78.2 (2026-10-27): the output matched the five lines shown | "The main session ran all nine lines on Node 22.23.0 with ICU 78.2, and every output matched" | Applied in v1.6: "Worked examples", opening paragraph |

<!-- prettier-ignore -->
| # | Where in spec v1.6 (F18) and v1.7 (F19) | Finding | Proposed change | Status |
| --- | --- | --- | --- | --- |
| F18 | "Confidence", the "When" cells of base `model-reading` and base `measure` | §2 clause 5 gives base `model-reading` to every item with `fromModel` true, a model observation with no reading (an `asset-shown` item, slice 7) included. The spec's "When" read "A reading by a model" and "A code measure with no reading", so that item fell under neither (re-check g2-2 N4) | Base `model-reading`: "A reading or an observation by a model (every item with `fromModel` true)"; base `measure`: "A code measure with no reading and `fromModel` false". No number changes | Applied in v1.7: "Confidence", both "When" cells; "Owner decisions" lists F18 |
| F19 | "Delivery", row 1d; rows 17 and 38 | Rows 17 and 38 assert "the JSON parses with the report schema", and row 1d names only `packages/page-reader`. The schema is now §7's `reportSchema` in the engine's `report.ts`, which the 1d PR adds (about 45 lines; 1d about 205) | Row 1d's scope adds "and the engine's `report.ts` (`reportSchema`, tech notes §7)"; rows 17 and 38 say "parses with `reportSchema` (tech notes §7)" | Applied in v1.8: "Delivery" row 1d names `report.ts` (`reportSchema`); rows 17 and 38 say the JSON parses with `reportSchema` and point to §7, "The report schema"; open question "A report for a refused read"; "Owner decisions" lists F19 |

**Review g2-1 findings** (on a36ef5d): where each was applied, by task. Each was decided by the orchestrator under ADR 0012 decision 4 and stays open for the owner at G2.

<!-- prettier-ignore -->
| # | Finding, short | Applied where | Status |
| --- | --- | --- | --- |
| I1 | Option D restated in more than one place | ADR 0019 decision 4 (task `ORV-128-arch-renderer-3`); here §7 says it is the code of option D and points to spec "Where it runs", and §12's slice paragraph points to §7 instead of naming what option D keeps | Applied: the architect replaced §13's "Fallback (option D)" bullet with a pointer to spec "Where it runs" and §7 (task `ORV-128-arch-renderer-4`) |
| I2 | No enforcement point for D1 (a) | Spec v1.5, rule `competitor-not-read-1`; here §7 `readUrlInput` and the `analyseUrl` check, §9 `read.notRead.competitor`, §11, §14 row 38 | Applied |
| I3 | A model item with no reading got base `measure` | §2 `checkItem` clauses 5 and 6; §14 row 2 "base, quote and tool-default fit the item" | Applied |
| I4 | `hypothesis` had no checkable definition | Spec v1.5, rule `hypothesis-flag-1`; here §2 `HYPOTHESIS_RULES` and clause 14, §8, §14 rows 2 and 10 | Applied |
| I5 | `checkAddress` missed `::`, `::/96` and NAT64 | §6 Address check; §14 row 5; F15 for the spec's wording | Applied here; F15 applied in spec v1.6 |
| I6 | Tech notes behind the spec | Spec v1.5 Gap list; here the front matter and the rule table name v1.5 (v1.6 since task `ORV-128-design-schema-5`, v1.7 since task `ORV-128-design-schema-6`, v1.8 since task `ORV-128-design-schema-7`, v1.9 since task `ORV-132-design-bookkeeping-1`, v1.11 since task `ORV-133-design-bookkeeping-1`, v1.12 since task `ORV-133-design-bookkeeping-2`, v1.13 since task `ORV-133-design-bookkeeping-3`, v1.15 since task `ORV-133-design-tech-r1-1`, v1.16 since task `ORV-133-design-tech-r1-2`, v1.17 since task `ORV-133-design-tech-r1-3`, v1.18 since task `ORV-133-design-tech-bookkeeping-4`, v1.19 since task `ORV-133-design-tech-bookkeeping-6`, v1.20 since task `ORV-133-design-tech-r2-1`, v1.21 since task `ORV-133-design-tech-bookkeeping-7`), F13 to F17 carry their status, and this table | Applied |
| S1 | Spec copied §12's total | Spec v1.5 "Delivery" | Applied; §12's total is now about 1,215, or 1,420 with 1d (1,375 before `report.ts`, N5) |
| S2 | K-0081 cited a wrong spec line | K-0081 | Applied there |
| S3 | Row 36's noscript break-it could not fail | §14 row 36 fixture; F16 for the spec row | Applied here; F16 applied in spec v1.6 |
| S4 | Three `checkItem` gaps | §2 clauses 15, 16 and 17; §14 row 2 | Applied |
| S5 | `RULE_IDS` not in the spec, held `word-count-1` | Spec v1.5 "Rule ids"; here §2 `RULE_IDS` (four ids) | Applied |
| S6 | ADR 0019 POC part named two ways | ADR 0019 Status and Confirmation | Applied there |
| S7 | `report.conflictsNotChecked` from slice 2 against "until slice 4" | §8 and §9: printed from the first command, slice 1d, until slice 4 | Applied |
| S8 | 1c plus page-reader over 400 lines | Spec v1.5 "Delivery" row 1d; ADR 0019 Status; here §1, §12, the §13 test heading and §14's Slice column | Applied |

**Re-check g2-2 findings** (on 4329e9c, task `ORV-128-review-g2-2`): where each was applied, by task. Each was decided by the orchestrator under ADR 0012 decision 4 and stays open for the owner at G2.

<!-- prettier-ignore -->
| # | Finding, short | Applied where | Status |
| --- | --- | --- | --- |
| N1 | ADR 0019 decision 1 had `cli.ts` wire `readPage` | ADR 0019 decision 1, the `cli.ts` bullet now wires `readUrlInput` (task `ORV-128-arch-renderer-5`); here §7 and §13 already said so | Applied there |
| N2 | ADR 0019 option D "Measures" cell said declared colours and fonts only | ADR 0019 Options table, D column, points to spec "Where it runs" (task `ORV-128-arch-renderer-5`) | Applied there |
| N3 | §14 row 5 repeated two URLs and never read the public NAT64 URL | §14 row 5: "each of the first ten URLs" refused, the duplicate extras dropped, `readPage` reads `http://[64:ff9b::808:808]/` with robots.txt first, and the NAT64 break-it fails that read (task `ORV-128-design-schema-6`) | Applied |
| N4 | Spec bases' "When" missed a model observation with no reading | F18; spec v1.7 "Confidence" (task `ORV-128-product-spec-9`) | Applied in spec v1.7 |
| N5 | "The report schema" named in spec rows 17 and 38, defined nowhere | §7 "The report schema" (`reportSchema`, its two members and the slice that adds each field); §1 `report.ts`; §11; §12 row 1d; §13's `cli.ts` pointer; §14 row 38 (task `ORV-128-design-schema-6`) | Applied |

**Slice 1b review round 0 findings** (PR 130 at e21b10a; reviewer task `ORV-133-review-code-2`, R1 to R8; security task `ORV-133-security-2`, SEC-133-1 to SEC-133-7): where each landed. Each was decided by the orchestrator under ADR 0012 decision 4 and stays open for the owner (spec "Owner decisions", slice 1b review round 0). The code landed in f07bb5d, the spec in e4faf86.

<!-- prettier-ignore -->
| # | Finding, short | Applied where | Status |
| --- | --- | --- | --- |
| R1 | The `*` group's allow overrode the token group's disallow | Spec rule `robots-group-1`; `robotsAllows` in `read-page.ts`; here §6 robots.txt and §14 row 6 | Applied |
| R2 | `User-agent: OriviloReader/1` did not match the token | Spec rule `robots-token-1`; `parseRobots` in `read-page.ts`; here §6 robots.txt and §14 row 6 | Applied |
| R3 | A robots.txt redirect was taken as disallow | Spec robots.txt, Answers; the shared redirect walk in `read-page.ts`; here §6 robots.txt (the second resolve per origin) and §14 row 6 | Applied |
| R4 | A URL with userinfo reached the request and the result | Spec Address check and Logged out; `allowedUrl` in `read-page.ts`; here §6 Address check and §14 rows 5 and 7 | Applied |
| R5 | `html-text-1` had no verified row per clause, and some clauses no test | `page-text.test.ts` (one case per block-list member and heading level, a span over inline markup, two titles); the rework builder's report (`ORV-133-build-rework-1`) records one mutant row per clause; here §14 row 36 | Applied |
| R6 | The `TextBlock.path` comment showed an unbuilt form | `page-text.ts` comment; here §8 already gave the built form | Applied there |
| R7 | Special-purpose ranges passed `checkAddress` | Same change as SEC-133-6 | Applied with SEC-133-6 |
| R8 | Row 5's break-it "drop `::`" could not go red | Here §14 row 5 (a mutant that goes red, and the `::` and `::1` lines named as equivalent) and §6 Address check | Applied |
| SEC-133-1 | robots.txt patterns compiled to a backtracking regular expression | Spec rule `robots-match-1` and "Hypotheses"; `patternMatches` and `ROBOTS_MAX_PATTERN` in `read-page.ts`; here §6 robots.txt and §14 row 6 | Applied |
| SEC-133-2 | The token group merged with `*` | Same change as R1 | Applied with R1 |
| SEC-133-3 | Recursive walks overflowed the stack on deep pages | Spec Depth bound and `html-text-1` Depth; iterative walks and `MAX_DEPTH` in `page-text.ts`, `links.incomplete` in `readPage`; here §6 Depth bound, §8 and §14 rows 7 and 36 | Applied |
| SEC-133-4 | Headings unbounded; `nth-of-type` quadratic | Spec `html-text-1` Heading bound; the heading counter and the one-pass index in `page-text.ts`; `pageTextOf` returns `{ blocks, incomplete }`; here §8 and §14 row 36 | Applied |
| SEC-133-5 | Userinfo in the request and in stored evidence | Same change as R4 | Applied with R4 |
| SEC-133-6 | Special-purpose ranges outside the list | Spec Address check (`240.0.0.0/4`, `198.18.0.0/15`, `192.0.0.0/24`, `fec0::/10`, `::ffff:0:0:0/96` judged by its IPv4); `checkAddress` in `read-page.ts`; here §6 and §14 row 5 | Applied |
| SEC-133-7 | Any port accepted; `resolve` had no time limit | Ports: spec Address check, `allowedUrl`, here §6 and §14 row 5. Time limit: `ReadPorts.resolve(host, budgetMs)` in `read-page.ts`, here §6 Requests and §14 row 5; the slice 1d port must answer within `budgetMs` | Applied; the port's timeout lands with slice 1d |

**RFC 9309 check** (research task `ORV-133-research-robots-1`, K-0056 at 0.8; RFC-1 to RFC-4): where each landed. Each was decided by the orchestrator under ADR 0012 decision 4 and stays open for the owner (spec "Owner decisions", RFC 9309 check). Applied in spec v1.13; no code change in this design.

<!-- prettier-ignore -->
| # | Finding, short | Applied where | Status |
| --- | --- | --- | --- |
| RFC-1 | `robots-token-1` keeps digits in the token run, where section 2.2 allows letters, underscore and hyphen only | Spec rule `robots-token-1`, "Hypotheses" and its worked example (`OriviloReader1`); here the rule table's `robots-token-1` row. `parseRobots` unchanged | Recorded as a hypothesis-grade reading; no contract change |
| RFC-2 | The robots.txt redirect bound of 3 is below section 2.3.1.2's at least five | Spec "Hypotheses"; here §6 robots.txt (one bound, past it the read fails with `redirects`) | Recorded; no contract change |
| RFC-3 | The rules of a robots.txt reached through a redirect apply to the initial authority | Spec robots.txt, Answers; here §6 robots.txt (`robotsOf` caches the landed rules under the submitted URL's origin); `read-page.ts` and §14 row 6's redirect-to-`https` case named for review | Applied in the spec and here; the code already keys by that origin |
| RFC-4 | A 5xx or no answer is complete disallow (section 2.3.1.4) | Spec robots.txt, Answers; here §6 robots.txt and §14 row 6 (the 503 case) | No change |

**Slice 1b review round 1 findings** (PR 130 at c37f0c8; reviewer task `ORV-133-review-code-3`, R5 still open and R1-1 to R1-5; security task `ORV-133-security-3`, SEC-133-R1-1 to SEC-133-R1-5): where each landed. Each was decided by the orchestrator under ADR 0012 decision 4 and stays open for the owner (spec "Owner decisions", slice 1b review round 1). Applied in spec v1.14 and here by task `ORV-133-design-tech-r1-1`; the code lands in the builder's round 2.

<!-- prettier-ignore -->
| # | Finding, short | Applied where | Status |
| --- | --- | --- | --- |
| R5 | `html-text-1` and `word-count-1` had no verified row per clause | The slice 1b fix report: one L-0042 row per clause, with the two equivalent mutants and the reasons the spec records (the `template` skip; the segmenter locale `th` changed to `en`); here §14 row 36 | No contract change; closed by the rework-2 report (task `ORV-133-build-rework-2`, commit ec569b8), one L-0042 row per clause of `html-text-1` and `word-count-1`, the `template` skip and the segmenter locale recorded as equivalent |
| R1-1 | A block's path could pass the 500-character locator bound | Spec `html-text-1`, Path bound; here §8 (`pathOf` returns `null` past `PATH_MAX_CHARS`), §11 and §14 row 36 | Contract change; designed here, code at ec569b8 (task `ORV-133-build-rework-2`) |
| R1-2 | Repeats SEC-133-R1-2 | As SEC-133-R1-2 | Repeat |
| R1-3 | Repeats SEC-133-R1-5 | As SEC-133-R1-5 | Repeat |
| R1-4 | A robots.txt 3xx with no `Location` header | Spec robots.txt, Answers; here §6, robots.txt, the answers: `walk` returns such a 3xx as an answer and `robotsOf` reads it as complete disallow, as the 1b build already did | Contract change; no code change |
| R1-5 | The reviewer re-check ran the six v1.12 worked-example lines with the v1.13 value, and all matched | Spec "Worked examples", opening paragraph | No contract change; nothing here |
| SEC-133-R1-1 | robots.txt work had no bound on the rules or the path | Spec Address check and `robots-match-1`, Caps; here §6 (`URL_MAX_CHARS` in `allowedUrl`, `ROBOTS_MAX_RULES` in `parseRobots`, `findFrom`) and §14 row 6 | Contract change; its bound on the path and query became the whole-URL bound of FU-1 |
| SEC-133-R1-2 | The tree was built, at a cost that grows with the square of its nesting, before any depth check | Spec Depth bound, Nesting count (F20); here §6 (`parseBounded` with the hooks), §8 and §14 rows 7 and 36 | Contract change; designed here; the Nesting pre-pass first designed for it was replaced by the Nesting count (F20) |
| SEC-133-R1-3 | robots.txt paths and patterns were compared without normalisation | Spec `robots-match-1`, Normalisation; here §6 (`robotsNormalise`) and §14 row 6 | Contract change |
| SEC-133-R1-4 | Repeats R1-1 | As R1-1 | Repeat |
| SEC-133-R1-5 | A rejecting port made `readPage` reject, with its message | Spec Depth bound, The result; here §6, the result (one `try` per port `await`, a `catch {}` that binds no error) and §14 row 7 | Contract change |

**Slice 1b review round 1 follow-ups** (FU-1 to FU-9; spec "Owner decisions", slice 1b review round 1, follow-ups): where each landed. Each was decided by the orchestrator under ADR 0012 decision 4 and stays open for the owner. Applied in spec v1.15 and here by task `ORV-133-design-tech-r1-1`.

<!-- prettier-ignore -->
| # | Finding, short | Applied where | Status |
| --- | --- | --- | --- |
| FU-1 | The whole `href` at most 2,048 characters, the bound of `source.ref` | Spec Address check and `robots-match-1`, Caps; here §1 and §6 (`URL_MAX_CHARS`, named in `evidence.ts` and used by `allowedUrl`), §11 and §14 row 6. The whole-URL caps of §2 and §7 already said 2,048 and stay | Contract change; settles the open point of task `ORV-133-product-parent-6` on those caps |
| FU-2 | A host with no address fails the read with `network` before robots.txt | Spec Depth bound, The result; here §6, robots.txt, the order (per hop: `allowedUrl`, budget, `addressOf`, gate, `send`) and the result, and §14 row 7 | Contract change; the 1b walk already looked up a page hop's host before its gate, so the code change is the caught rejection and the empty answer |
| FU-3 | An over-long URL gets `read.refused.address`, no string of its own | Spec Address check and "Strings" | No contract change; nothing here |
| FU-4 | A robots.txt answer past 500 KiB is complete disallow, and none of it is parsed | Spec Bounded and Answers; here §6, Bounds and robots.txt, the answers (`robotsOf` reads `truncated` before decoding), and §14 row 6 | Contract change |
| FU-5 | At most 100,000 pattern characters in all | Spec `robots-match-1`, Caps; here §6 (`ROBOTS_MAX_PATTERN_CHARS` in `parseRobots`) and §14 row 6 | Contract change |
| FU-6 | The most octets, allow on a tie, `%2A` and `%24` as literal `*` and `$` | Spec `robots-match-1`, Matching; here §6 (`RobotsRule.parts` and the ranking by the normalised `pattern`) and §14 row 6, with a `%24` case and a most-octets case beyond the row. The 1b comment "The longest match wins" in `read-page.ts` becomes the most octets of the normalised pattern | Contract change; F22 extended it to a `%2A` or `%24` in the path (`matchAt`) |
| FU-7 | Readings: the hex case, the decoding on the pattern side, reserved characters left as written | Spec `robots-match-1`, Normalisation, and "Hypotheses"; here §6 (`robotsNormalise`) | A reading; the design follows it |
| FU-8 | The pre-pass cites K-0083; `noscript` stays out of the text list; the optional-end-tag reading is open for `security` | Spec "Hypotheses"; here §8 (K-0083 beside scripting off) | No contract change; no longer applies, since the Nesting count needs no element list (F20) |
| FU-9 | The two v1.14 worked-example lines ran and matched; the changed total-bound line and the `%2A` line are not run | Spec "Worked examples"; the slice 1b fix runs the two (slice spec "Worked examples") | No contract change; nothing here |

**Findings against spec v1.15** (task `ORV-133-design-tech-r1-1`). Measured on Node 22.23.0 (arm64) with `parse5` 8.0.1 from this repo's lockfile, by scripts outside the repo; no code in the repo changed.

<!-- prettier-ignore -->
| # | Where in spec v1.15 | Finding | Proposed change | Status |
| --- | --- | --- | --- | --- |
| F20 | "Reading a page the person submits", Depth bound, Nesting pre-pass; rows 7 and 36; "Hypotheses", the Nesting pre-pass | `parse5.parse` grows with the square of nesting (10,000 nested `div` took about 0.3 s, 20,000 about 1.1 s). Two short prefixes hide the nesting from any token pass. `<body><style><!--</style>` then nested `div`: a data-state tokenizer, as the pre-pass is written, reads the rest as one comment and finds no level (the pre-pass returned `null` on 2 MB of it), while the tree builder reads the `<!--` as style text and nests every `div`. `<body><svg><style>` then nested `g` and as many `</x>`: a tokenizer switched to a text state at `style` finds no level, while inside `svg` the tree builder reads them as elements (20,000 took about 5.1 s). A hand-written scan has the same two choices at a text element, so it misses one shape or the other | Count the tree builder's own stack instead. `parseBounded` passes `parse5.parse` the default tree adapter plus its `onItemPush` and `onItemPop` hooks, which `parse5` calls on each push to and pop from its stack of open elements; past 512 it throws a private value holding the pushed element's `sourceCodeLocation.startOffset` (the last offset seen, for an element the parser makes without a tag), and `parseBounded` parses the text before that offset again. No element list and no reading of the standard is needed, and the count cannot differ from the parser's. On 2 MB of nested `div`, `<div></span>`, `<div><script></div></script>`, both prefixes above, nested formatting elements and `<table>` with `div`, each was cut in 2 to 14 ms; 2 MB of flat `<p>x` or `<a>x` was not cut and took 250 to 290 ms. The spec's pre-pass rule, its three lists and the optional-end-tag reading (FU-8) would go; rows 7 and 36 keep their cases and add the two prefixes; K-0082 would record the two hooks | Applied in spec v1.16 (contract change); designed in §6, Depth bound |
| F21 | `robots-match-1`, Caps ("the lines whose key is `allow` or `disallow`, in any group") | The rule does not say whether a line before the first `user-agent` line, which is in no group, or a line with an empty value counts toward the 5,000 | Count every line whose key is `allow` or `disallow`, in a group or not, empty value included, so the cap counts the file rather than what the parser keeps. §6 `parseRobots` assumes this | Applied in spec v1.16 (contract change); §6 `parseRobots` |
| F22 | `robots-match-1`, Normalisation and Matching | A `%2A` in a pattern matches a written `*` in the path. A path that holds `%2A` keeps it encoded after normalisation (a reserved character), so no pattern covers it: `Disallow: /a-%2A.html` does not cover `https://example.com/a-%2A.html`, a fail-open on that URL. The same holds for `%24` | Let a literal `*` or `$` read from `%2A` or `%24` also match the three characters `%2A` or `%24` in the path. §6 follows the spec as written until this is decided | Applied in spec v1.16 (contract change); §6 `matchAt` and `findFrom`, §14 row 6 |
| Row 6 timing | Row 6, the time bound on the 500 KB file of 5,000 rules | The bound left little room: the designed matcher took about 30 ms and `String.prototype.indexOf` about 73 ms on Node 22.23.0 (arm64); a CI runner may be slower | Allow 500 ms; the `security` re-check may tighten it with a measurement on CI | Applied in spec v1.16 (contract change); §6 `robotsAllows`, §14 row 6. Spec v1.22 moved the bound to 2 s on three CI runs (Slice 1b CI findings) |

**Findings against spec v1.16** (task `ORV-133-design-tech-r1-2`). Measured on Node 22.23.0 (arm64) with `parse5` 8.0.1 from this repo's lockfile, by a sketch of §6's Nesting count outside the repo; no code in the repo changed.

<!-- prettier-ignore -->
| # | Where in spec v1.16 | Finding | Proposed change | Status |
| --- | --- | --- | --- | --- |
| F23 | "Reading a page the person submits", Depth bound; rows 7 and 36 | The Nesting count bounds the stack, not the work per token. A 2 MB document that holds the stack just under the bound and then repeats a tag the tree builder checks against the whole stack is never cut: `<body>`, 509 nested `div` and `</p>` repeated took 1.6 to 1.7 s in three runs, 0.8 of the 2 s that rows 7 and 36 allow their 2 MB documents; `</li>` repeated took about 1.3 s, and `<p></p>` repeated under 508 nested `div` about 0.9 s. The cost falls in step with the bound: the same `</p>` document under 254 nested `div` took about 0.87 s and under 126 about 0.5 s. `readPage` parses the document once (`stylesheetLinksOf`) and slice 1c's `analyseUrl` once more (`pageTextOf`) | Add the `</p>` document to rows 7 and 36 with a bound a CI runner can hold, which `security` sets from a measurement on CI; or lower the depth bound, a change to `MAX_DEPTH`, the walk and row 36's boundary cases | Applied in spec v1.17 (contract change): the bound lowered to 128. Here §6 Depth bound, §8, §11 and §14 rows 7 and 36, which gain the held-depth document under 125 nested `div`; a sketch of the count outside the repo took 488 to 500 ms on it in five runs (task `ORV-133-design-tech-r1-3`, Node 22.23.0, arm64) |

**Findings against spec v1.18** (task `ORV-133-build-rework-2`, the builder's round 2 rework of slice 1b at ec569b8: its two deviations and three points for decision). Each was decided by the main session under ADR 0012 decision 4 and stays open for the owner; recorded here by task `ORV-133-design-tech-bookkeeping-4`. Neither changes the spec or the code.

<!-- prettier-ignore -->
| # | Where in spec v1.18 | Finding | Proposed change | Status |
| --- | --- | --- | --- | --- |
| F24 | "Page text", `html-text-1`, Depth and Path bound; rows 7 and 36 | §14 row 36 asserted that a block at depth 128 is kept and a block at depth 129 is not and, beyond the row, both blocks for `<body>`, 125 nested `div`, `<p>deep</p>` and `<p>after</p>`. No block can lie that deep: each segment below `body` is at least 17 characters with its `>`, so a block's path passes the Path bound below depth 30 (`html` counting 1), and a path to depth 128 is at least 2,151 characters (task `ORV-133-build-rework-2`, its deviation on the Path bound) | No spec change: the spec's rows 7 and 36 and the Depth and Path bound lines of `html-text-1` assert no block at depth 128. §14 row 36 asserts the depth lines as the builder tested them: a void element past the bound, inline text at depth 128 before the stop, the block after the deep chain, `stylesheetLinksOf`, which builds no path, and the test "is 128" for the constant | Decided by the main session, task `ORV-133-build-rework-2`; applied here (§14 row 36), a tech notes test change only |
| F25 | "Page text", `html-text-1`, Path bound; "Reading a page the person submits", Depth bound | Code that no test can reach or tell apart (task `ORV-133-build-rework-2`, its points for decision): the third parse, of the empty text, in `parseBounded`, unreachable by §6's argument; the title's `"long"` branch and the meta description's null-path branch in the head, which a head child's path of a few dozen characters never reaches; the second length check in `pathOf`, which never changes the result; and in the body cut, `trimEnd` on the cut prefix and `at < 0` against `at <= 0`, which cannot differ because the text is folded before it is cut | Keep each as written, with no test; the fix report lists them as untested branches or equivalent mutants. §6 ("If it stopped anyway") and §8 (the Path bound) record why | Decided by the main session, task `ORV-133-build-rework-2`: kept as written, no test, no spec change. The third parse became reachable under the Element count of spec v1.20 and now has a test (F31; task `ORV-133-design-tech-r2-1`); the other branches keep this decision |
| F26 | "Page text", `html-text-1`, Depth; "Reading a page the person submits", Depth bound, The walk | The builder's second deviation of rework-2: `textNodesOf`, the walk of a block's text nodes, lost its depth check. F24 recorded only the first deviation, though this table's heading takes both (reviewer finding R2-2, task `ORV-133-review-code-4`) | No spec change. §6 (The walk) and §8 (the Path bound) record it: the walk is iterative, no inline element in a block lies deeper than the stack the Nesting count bounds (the builder's 400,000 generated documents and the reviewer's four constructs found none), and a text node gives no block of its own | Decided by the main session on the rework-2 report and kept in review round 2 (spec "Owner decisions", Slice 1b review round 2 findings, R2-2); recorded here by task `ORV-133-design-tech-r2-1`; no code change |

**Gate findings on round 2** (the quality gate on e0ffacc and CI run 40515915999 on PR 130; fix task `ORV-133-build-fix-3`). GATE-133-1 was decided by the orchestrator under ADR 0012 decision 4 and stays open for the owner (spec "Owner decisions", Gate findings on round 2); GATE-133-2 is a build finding with nothing to decide. Recorded here by task `ORV-133-design-tech-bookkeeping-6`; the row for each carries its impact list.

<!-- prettier-ignore -->
| # | Where | Finding | Change | Status |
| --- | --- | --- | --- | --- |
| GATE-133-1 | "Reading a page the person submits", rows 7 and 36 (the held-depth document) | The quality gate on e0ffacc runs the three packages' test tasks at once; its test step took the held-depth document past 2 s twice (`page-text.test.ts`, the `pageTextOf` and `stylesheetLinksOf` cases), while alone it reads in 527 to 581 ms and the five cut documents in 1 to 16 ms. CI run 40515915999 stopped at the typecheck (GATE-133-2) before its tests ran. The guard exists to catch super-linear cost, not to pin throughput | The time guard on the held-depth document moves from within 2 s to within 10 s, for that document only; every other timed case of rows 7 and 36 keeps 2 s. Here §6 (Cost) and §14 rows 7 and 36. The fix task `ORV-133-build-fix-3` sets the three held-depth timing assertions to 10,000 ms and the titles of their cases. Impact: `page-text.test.ts` and `read-page.test.ts` (those three cases); K-0082, whose measurement line names the 2 s limit; the ORV-133 spec, which copies rows 7 and 36; `security` and reviewer re-check of PR 130. No rule, bound, string, factor or schema field changes, so `EVIDENCE_SCHEMA_VERSION` stays. Profiles, recipes, components and screens: none | Applied in spec v1.19 (contract change) and slice spec v1.12 |
| GATE-133-2 | None (the code form of §6's `NestingStop`) | CI run 40515915999 on e0ffacc failed at `pnpm typecheck`: `page-text.ts(62,15)` TS1294, the constructor parameter property `readonly cut` of `NestingStop`. Only `packages/auth/tsconfig.json` sets `erasableSyntaxOnly`, and its `tsc` includes the intent-engine sources. The quality gate's typecheck step on e0ffacc passed from a stale turbo cache; `pnpm typecheck --force` reproduces the error | The fix task `ORV-133-build-fix-3` declares the field in the class body and assigns it in the constructor. Here §6 (How the parse stops) records the form. No rule, bound, string, test or behaviour changes. Impact: `page-text.ts` and the `packages/auth` typecheck, which compiles it. Profiles, recipes, components and screens: none | No spec change; code form only |

**Slice 1b review round 2 findings** (PR 130 at 3274e52; reviewer task `ORV-133-review-code-4`, R2-1 Important and R2-2 Suggestion; security task `ORV-133-security-4`, SEC-133-R2-1 Critical and SEC-133-R2-2 Important): where each landed, with its impact list. Each was decided by the orchestrator under ADR 0012 decision 4 and stays open for the owner (spec "Owner decisions", Slice 1b review round 2 findings). Applied in spec v1.20 and slice spec v1.13, and designed here by task `ORV-133-design-tech-r2-1`; the code lands in the builder's next round.

<!-- prettier-ignore -->
| # | Finding, short | Applied where | Impact | Status |
| --- | --- | --- | --- | --- |
| R2-1 | The Nesting count bounds the stack, not the elements the tree builder makes: re-opened formatting elements gave about 121 elements per 4 bytes, and `readPage` on the 2 MB page ran V8 out of a 4 GB heap | Spec Work bound, Element count; here §6 (Work bound: the Element count, the second parse under it, the cost at the count; Depth bound: Cost, If the second parse stops), §8, §11 and §14 rows 7 and 36; F30, F31 | `page-text.ts` (`pushes` in `onItemPush`, `MAX_ELEMENT_PUSHES`, the third parse now reached); `page-text.test.ts` and `read-page.test.ts` (the re-opened-formatting document, the 1,048,576 boundary, the third-parse case); slice 1c's `analyseUrl`, whose `page-incomplete` follows; slice 1d's function memory (F30); the ORV-133 spec, which copies rows 7 and 36; `security` and reviewer re-check of PR 130. Profiles, recipes, components and screens: none | Contract change; designed here |
| R2-2 | `textNodesOf` lost its depth check in rework-2, and no record said so | Spec: none (no spec change); here §6 (The walk), §8 (the Path bound) and F26 | No code and no test changes; the record only. Profiles, recipes, components and screens: none | No spec change; recorded as the main session's decision (F26) |
| SEC-133-R2-1 | The tokenizer's check of each attribute name against the tag's earlier names, and the merge of each later `html` or `body` tag into that element, grow with the square of the attributes: `<html aN>` took 29,133 ms at 508,896 bytes, and one tag 2,501 ms at 268,900 | Spec Work bound, Attribute count and Attribute merge; here §6 (Work bound: `attributeCut` and its definition, the `adoptAttributes` override and its cut, what the counts do not see), §11 and §14 rows 7 and 36; F27, F28, F29 | `page-text.ts` (`attributeCut`, `adoptAttributes`, `MAX_ATTRIBUTES`); `page-text.test.ts` and `read-page.test.ts` (the `<html aN>`, `<body aN>` and one-tag documents, the boundary, quoted-value, run-start and merge cases); a real page with a tag of more than 256 attribute names, or such a run where the tokenizer reads no tag (F28), now reads only up to it; one whose later `html` or `body` tags pass 256 merged attributes reads only up to the latest start tag pushed (F29); the ORV-133 spec; `security` and reviewer re-check. K-0082 §7 already holds the call sites. Profiles, recipes, components and screens: none | Contract change; designed here |
| SEC-133-R2-2 | `readPage` checked each stylesheet URL against a growing array and read every link: 63,886 distinct links blocked for 3,861 ms | Spec Bounded (unchanged) and row 7; here §6 (Stylesheet links) and §14 row 7 | `read-page.ts` (a `Set` of serialised URLs, the stop at the eleventh distinct one); `read-page.test.ts` (row 7, the page of links); which stylesheets are fetched does not change; `security` re-check. Profiles, recipes, components and screens: none | No contract change; designed here |

**Findings against spec v1.20** (task `ORV-133-design-tech-r2-1`). Measured on Node 22.23.0 (arm64) with `parse5` 8.0.1 from this repo's lockfile, by a sketch of §6's Work bound outside the repo; no code in the repo changed. Each was raised as a proposed change for the main session, not an edit of the spec. The main session decided each under the owner's delegation (ADR 0012 decision 4), recorded per L-0013 as a contract change or no contract change, and each stays open for the owner (spec "Owner decisions", Tech notes findings against v1.20); applied in spec v1.21 and slice spec v1.14, and recorded here by task `ORV-133-design-tech-bookkeeping-7`.

<!-- prettier-ignore -->
| # | Where in spec v1.20 | Finding | Proposed change | Status |
| --- | --- | --- | --- | --- |
| F27 | "Reading a page the person submits", Work bound, Attribute count ("A start tag holding more than 256 attributes") | The tokenizer reads an end tag's attributes the same way and checks each name against the earlier ones (K-0082 §7 (a)). `</p` with 10,000, 20,000 and 40,000 distinct names took 164, 545 and 2,508 ms (58,904 to 268,904 characters), so one end tag of 2 MB would take minutes, and the count as written does not name it | "A tag, start or end, holding more than 256 attributes cuts the text at that tag" | Applied in spec v1.21 (contract change). Here §6 (a run also starts at `</` and a letter) and §14 row 36 (the end-tag case, beyond the row) |
| F28 | Work bound, Attribute count, Honest limit ("inside a comment, a `script` or a `style`") | The scan starts a run wherever a tag could start, so it can also cut inside an attribute value, the text of a `title`, `textarea`, `xmp`, `iframe`, `noembed`, `noframes` or `plaintext`, or a CDATA section. The limit names three of these places | "a run that looks like a tag where the tokenizer reads none (inside a comment, an attribute value, a CDATA section, or the text of an element such as `script`, `style`, `title` or `textarea`) and holds more than 256 words that look like attributes cuts the page there too" | Applied in spec v1.21 (no contract change). Here §6 (What it costs a page) names the same places; the scan and the cut do not change |
| F29 | Work bound, Attribute merge ("the parse stops at that tag"); the Work bound's opening ("where the cut falls for an element with no start tag of its own is in tech notes §6") | The parse stops at that tag, but `adoptAttributes` receives no location (K-0082 §7 (b)), so the cut cannot be that tag's start. It is the start of the latest start tag whose element was pushed, at or before it, and the text between the two is not read; on the `<html aN>` and `<body aN>` documents that is offset 0 | The opening: "where the cut falls for an element with no start tag of its own, and for the Attribute merge, is in tech notes §6". No number changes | Applied in spec v1.21 (no contract change). Here §6 (The Attribute merge, Where it stops) designs the cut |
| F30 | Work bound, Element count; "Hypotheses"; ADR 0019 (where slice 1d's read runs) | The count bounds time (588 to 711 ms per `parseBounded` on the 2 MB re-opened-formatting document) but leaves about 411 MB of heap live at the count, up to about 822 MB sampled during the call; the call runs out of memory under a 384 MB old-space limit and completes under 512 MB. The spec states no memory, so "The read always returns its result" holds only where the heap allows about 512 MB | Either (a) a line in "Hypotheses": a read needs about 0.5 GB of heap at the Element count on Node 22, checked by slice 1d where the function's memory is set; or (b) a lower count. The held-depth document's 524,258 pushes set the floor: 600,000 keeps rows 7 and 36 and lowers the heap at the count by about 43%, but then a 2 MB page of `<p>` (699,050 start tags) is cut, and the "Worked examples" line on the count changes | Decided as option (a) in spec v1.21: the count stays 1,048,576, the heap is in the spec's Hypotheses and slice 1d checks it where the function memory is set. Here §6 (The cost at the count) keeps `MAX_ELEMENT_PUSHES` at 1,048,576 |
| F31 | Work bound ("A parse the count stops costs at most two parses"); Depth bound, Nesting count ("only the text before that element's start tag is parsed again") | Under the Element count the second parse can stop too, at an implied `body` that the end of the text pushes after a `template` in `head` (§6). Nothing is then parsed again: `parseBounded` returns the parse of the empty text, so the read keeps no text and no link. "At most two parses of at most 1,048,576 pushes each" still holds, since the third parses nothing, but no line says what the read keeps | Add to the Work bound: "If the parse of the text before the cut stops as well, which only the Element count allows, the read keeps no text and no link, and carries `page-incomplete`" | Applied in spec v1.21 (contract change). Here §6 (If the second parse stops; The second parse under the Element count) and §14 row 36 (the third-parse case, beyond the row) build and test it; F25's status names the change |

**Findings against spec v1.21** (task `ORV-133-build-rework-4`, the builder's round 4 rework of slice 1b at f77913b: its three points for decision). Each was decided by the main session under ADR 0012 decision 4 and stays open for the owner; recorded here by task `ORV-133-design-tech-bookkeeping-8`. None changes the spec or the code.

<!-- prettier-ignore -->
| # | Where in spec v1.21 | Finding | Proposed change | Status |
| --- | --- | --- | --- | --- |
| F32 | "Reading a page the person submits", Work bound, Attribute count; row 36 | §6 (In step) lists ten scan states, but after a quoted value and self-closing have identical rows (whitespace to before name, `/` to self-closing, `>` ends, anything else starts a name), so the scan could keep nine. Of the builder's 202 table mutants, two stay green: `VALUE_DQ` on a double quote and `VALUE_SQ` on a single quote going to `SELF_CLOSING` instead of `AFTER_QUOTED` (task `ORV-133-build-rework-4`, its L-0042 row on the step table). Before name has the same row as well, so the scan could keep eight; a fuzz of 2,000,000 random short documents, each at limits of 1, 2 and 3, found the same cut as the table for the two mutants and for sending the same two cells to before name, a mutant not in the builder's list (this task) | Keep the ten states as designed, one per tokenizer state, and name the two mutants as equivalent | Decided by the main session, task `ORV-133-build-rework-4`: ten states kept, no spec change, no code change. Here §6 (In step) and §14 row 36 name the two mutants. Impact: the fix report's L-0042 row only. Profiles, recipes, components and screens: none |
| F33 | "Hypotheses", the Work bound; Work bound, Element count | §6 (The cost at the count) gives about 411 MB of heap live after `parseBounded`, which returns the tree. Through `pageTextOf`, which keeps no tree, the builder measured the 2 MB re-opened-formatting document (Node 22.23.0, arm64): 561 to 712 ms in ten runs; `heapUsed` after the call and before a collection 913 to 943 MB at the default limit and 438 to 458 MB under `--max-old-space-size=512`, and 15 MB after a forced collection; completes under 512 MB in 3 of 3 runs and runs out of memory under 384 MB in 3 of 3 runs. `parseBounded` is private, so slice 1d cannot take a live figure from it through the public functions | Record the build's measurement beside the sketch's figures; slice 1d takes the function memory from the 512 MB pass and the 384 MB failure. The spec's "Hypotheses" line on the heap at the Element count stays as it is | Decided by the main session, task `ORV-133-build-rework-4`: no spec change, no code change. Here §6 (The cost at the count) records both measurements and what slice 1d takes. Impact: the slice 1d spec, when written, and its function memory (F30). Profiles, recipes, components and screens: none |
| F34 | "Reading a page the person submits", Work bound, Attribute merge; row 36 | Two mutants of the `adoptAttributes` override stay green and cannot be seen from outside the module: pushing every offered attribute instead of the fresh ones (a duplicate sits after the original in `recipient.attrs`, and `attr()` reads the first match, so no output differs), and not returning early on an empty list (the filter is empty then) (task `ORV-133-build-rework-4`, its L-0042 row on the Attribute merge) | Name the two mutants as equivalent in §14 row 36, beside the two table mutants of F32 | Decided by the main session, task `ORV-133-build-rework-4`: no spec change, no code change. Here §14 row 36 names them. Impact: the fix report's L-0042 row only. Profiles, recipes, components and screens: none |

**Findings against spec v1.22** (task `ORV-133-design-tech-r3-1`: review round 3 of slice 1b, R3-1 and SEC-133-R3-1). Measured on Node 22.23.0 (arm64, Apple M4) with `parse5` 8.0.1 from this repo's lockfile, the head at 29593ea and a sketch of §6's List steps outside the repo; no code in the repo changed. Each was raised as a proposed change for the main session, not an edit of the spec. Decided by the main session and applied in spec v1.23, under the owner's delegation (ADR 0012 decision 4), recorded per L-0013 as a contract change or no contract change, and each stays open for the owner (spec "Owner decisions", Tech notes findings against v1.22); §6 (The List steps, and the table "The List steps, measured") holds the evidence.

<!-- prettier-ignore -->
| # | Where in spec v1.22 | Finding | Proposed change | Status |
| --- | --- | --- | --- | --- |
| F35 | "Reading a page the person submits", Work bound (its opening and its counts) | The Work bound names three costs, but the pinned `parse5` has a fourth class that grows with the square of the text: the walks of lists the counts do not cap (K-0082 §8). The default tree adapter's `insertBefore`, `insertTextBefore` and `detachNode` walk a parent's whole child list, and foster parenting and the adoption agency's `_adoptNodes` call them once per node; the list of active formatting elements can grow without bound through stale markers, and each push walks it. No push marks these steps, so the Element count never stops them. At the head, 2 MB pages took 92.6 s (adoption move), 19.8 s and 35.0 s (fostered elements and text), 38.8 s (stale markers) and 226 s (R3-1's adoption move with text), and the 30 s budget of the read cannot fire inside the synchronous parse. One count bounds the whole class (§6, The List steps), and every row's document and the findings' documents return within 0.8 s on this machine | The opening: "The pinned `parse5` 8.0.1 has four more costs that grow faster than the text: [the three as written]; and the walks of lists that grow with the page, a parent's child list each time a node is inserted before a sibling or detached from it, and the list of active formatting elements at each element pushed. Four counts bound them." A new count after the Attribute merge: "**List steps.** At most 268,435,456 list steps in one parse: a node inserted before a sibling adds the nodes after that sibling, a node detached adds its parent's child count, and an element pushed adds the length of the list of active formatting elements (how is in tech notes §6). The step that would pass the bound stops the parse at the cut of the other counts, and the read carries `page-incomplete`. No plain page measured comes near it: 2 MB of paragraphs, a 2 MB table and the held-depth document add no step." | Applied in spec v1.23 (contract change) |
| F36 | Depth bound ("Nesting is not the only cost of the parse that grows faster than the text; the others are bounded by the Work bound (the next bullet)") | The sentence was false before this change (R3-1: the child-list walks were not bounded), and no measurement can show it of every cost of a parser: what can be shown is the costs found by reading the pinned code, which K-0082 §7 and §8 list | "Nesting is not the only cost of the parse that grows faster than the text; the others found in the pinned `parse5`'s code (K-0082 §7 and §8) are bounded by the Work bound (the next bullet)." | Applied in spec v1.23 (no contract change) |
| F37 | Work bound (the new List steps); "Hypotheses"; K-0082 §8 and option A | The other counts use the public tree adapter. The List steps read the formatting list's length, which `parse5.parse` does not expose, so `parseBounded` makes the parser itself: `Parser`, exported from the root but declared `/** @internal */`, and its `activeFormattingElements`, marked `@internal` in the type declarations (`entries` is public on `FormattingElementList`). Both hold under the exact pin; `tsc` fails if either name leaves the declarations, and the stale-marker case of rows 7 and 36 goes red if the count stops reading the list | A line in "Hypotheses": "The List steps read two names `parse5` 8.0.1 marks internal, the `Parser` class and its list of active formatting elements. They hold under the exact pin, and an upgrade of `parse5` re-checks them." K-0082 §8 gains a line on the dependence (a knowledge edit for the main session). This design reads it as part of the pin K-0082 option A already takes, not a new architecture decision, so it proposes no ADR; the main session decides whether one is needed | Applied in spec v1.23 (no contract change; no ADR, read as part of the K-0082 option A pin) |
| F38 | Work bound (the new List steps), an honest limit; "Worked examples" | A formatting end tag misnested over a block with many direct children moves them one by one, so n children add about n²/2 steps: `<body><b><div>`, 23,169 `<br>` and `</b>` stay within the bound and 23,170 are cut. The cut is the latest start tag pushed, so a block of void elements or text loses its text, and a block of elements loses what follows its last child's start tag. At the head the 2 MB page of `<p>` paragraphs inside a misnested `<b><div>` took 10.8 s; now 0.4 s, cut at its last `<p>`. Foster parenting is never cut by the bound, since it costs the nodes after the table, almost always none | Add to the List steps: "Honest limit: a formatting end tag misnested over a block of more than about 23,000 direct children (`<b><div>`, then many lines, then `</b>`) is cut at the latest start tag before it, with `page-incomplete`, and no exception is made for it." | Applied in spec v1.23 (no contract change) |
| F39 | Work bound, Element count ("If the parse of the text before the cut stops as well, which only the Element count allows, the read keeps no text and no link") | The List steps can stop the second parse too, at the same place: the implied `body` that the end of the text pushes after a `template` in `head`, which adds the formatting list's length. `<title>T</title><template>` and stale rounds to 2 MB reach the third parse: no block, `page-incomplete`, 384 to 404 ms | "If the parse of the text before the cut stops as well, which only the Element count and the List steps allow, the read keeps no text and no link, and carries `page-incomplete`" (move the sentence to the Work bound's opening, since two counts now share it) | Applied in spec v1.23 (contract change) |
| F40 | Rows 7 and 36 | The rows name the documents of the three counts and none of the List steps | Row 7: the adoption move document, R3-1's adoption move with text and the stale-marker document resolve `read` with `page-incomplete` within 10 s; R3-1's foster-parenting document and SEC-133-R3-1's two resolve `read` without `page-incomplete` within 10 s. Row 36: the adoption move and stale-marker documents return within 10 s, `incomplete` true; the foster-parenting document returns within 10 s with its text. The 10 s guard follows GATE-133-1, since these documents cost 0.2 to 0.4 s per call here | Applied in spec v1.23 (contract change) |
