---
issue: ORV-132 (https://tpetkaew.atlassian.net/browse/ORV-132), slice 1a of ORV-128 (https://tpetkaew.atlassian.net/browse/ORV-128)
parent: docs/specs/ORV-128/spec.md v1.9
lane: L (the evidence schema is a new engine contract every brand node reads; the parent's lane, decision D7)
version: 1.1
---

# ORV-132: the evidence contract, computed confidence and the lean rules (ORV-128 slice 1a)

## Why

People bring a website, a page an AI tool made, photos, another brand or a paragraph, and layer 1 of the ORV-126 harness turns that input into evidence items without letting it decide. Code measures what can be measured, a model may only suggest, and every item says which it is and how sure it is, so the node graph still asks the person before anything becomes a value.

The full reasoning is in [ORV-128's Why](../ORV-128/spec.md#why). This story is that spec's slice 1a (L-0016): the shape every analyser emits, the confidence number computed by code, the strings, and the two lean rules as pure functions, so slices 1b to 7 fill one contract instead of each inventing its own.

**Frame.** This spec is not a guard. It describes pure engine modules and the data they accept or refuse.

**What is real, rule-based and simulated in this slice.**

- **Real (once built):** the strict schema, the id, the confidence calculation and the floor check, the strings as data, and the two lean functions. Deterministic TypeScript in `packages/intent-engine/src` with tests.
- **Rule-based, not AI:** `value-to-lean-1` and `measure-to-lean-1` are rules; nothing in this slice calls a model, reads a page or renders one.
- **Hypothesis-grade:** the confidence bases and factors, both lean rules and `industry-margin-1`, as the parent's "Hypotheses" lists them.
- **Not wired yet:** no analyser calls the lean functions until slice 1c, and no report prints the strings until slice 1d. Nothing in this slice may be described as reading input.

## Story

The parent's story holds unchanged ([ORV-128 "Story"](../ORV-128/spec.md#story)): a founder or designer brings whatever they have, and ORIVILO measures, suggests, labels what came from AI with how sure it is, and asks when inputs disagree, while nothing becomes a decision until they confirm it.

This slice's part of it: as the builder of the analysers and of the ORV-126 node graph, I want one strict evidence item whose confidence is computed and checked, never reported, so that every later analyser emits the same shape and the person later sees honest labels and reasons.

## What this slice uses from ORV-128 (linked, not copied)

- **Spec** `docs/specs/ORV-128/spec.md` v1.9: "Evidence first" (the fields, the value shape per reading target, the closed lists, `RULE_IDS`, `hypothesis-flag-1`, `value-to-lean-1`, `measure-to-lean-1`); "Confidence" (the table, `thousandths-1`, "The floor", `industry-margin-1`, "Which factors slices 1a to 1d use"); "Strings"; "Hypotheses"; "Worked examples"; "Delivery", row 1a.
- **G1 decisions**, ORV-128 comment 10209: the owner decided D1 to D7. This slice rests on D3 (the floor) and D6 (a) (a confidence number computed by code). Comment 10215 records the orchestrator's adjustment under D3 (the model-reading base and `value-to-lean-1`).
- **G2**, the packet in ORV-128 comment 10226, passed in comment 10227 under the owner's delegation (ADR 0012 decision 4), with slice 1 split into 1a to 1d.
- **Tech notes** `docs/specs/ORV-128/tech.md`: §1 (module layout), §2 (`evidence.ts`, `checkItem` clauses 1 to 17), §3 (`evidenceId`), §4 (`confidence.ts`), §5 (sort order, the analyser-output part), §8 (the `leans.ts` part), §9 (`evidence-strings.ts`), §14 (the tests whose Slice column says 1a).
- **ADR 0008**, "Addition, 2026-10-26: a computed confidence number for input evidence". Its Confirmation names the tests of rows 2, 3 and 32 and "the margin is in thousandths and inclusive"; it is confirmed when this slice ships `confidence.ts` with them.

## Deliverables in build order

Each is a pure module in `packages/intent-engine/src` with its tests: no framework import, no `node:` module, no `Math.random` or `Date.now` (row 30). The order is the tech notes §1 order. `evidence.ts` imports `scoreConfidence` and `QUESTION_KEYS`, so a builder may write `confidence.ts` and `evidence-strings.ts` first; the order of the commits is not a requirement.

<!-- prettier-ignore -->
| Step | File | Holds (tech notes) | Rules it implements, by name (home in the parent spec) | Tests |
| --- | --- | --- | --- | --- |
| first | `evidence.ts` | `EVIDENCE_SCHEMA_VERSION`, the closed lists, `RULE_IDS`, `HYPOTHESIS_RULES`, `inputEvidenceSchema` with `checkItem` clauses 1 to 17 (§2); `evidenceId` (§3); `compareEvidence` (§5) | The field `id` ("Evidence first", field table); `hypothesis-flag-1`, its schema part ("Evidence first") | `evidence.test.ts` › "a valid item" (row 1); "bounds and forbidden fields", "the renderer fits the observation", "base, quote and tool-default fit the item", "hypothesis-flag-1" (row 2, tech notes §14) |
| second | `confidence.ts` | `CONFIDENCE_VERSION`, `EVIDENCE_FLOOR`, `CONFIDENCE_BASES`, `CONFIDENCE_FACTORS`, `milli`, `scoreConfidence`, `INDUSTRY_MARGIN_MILLI`, `withinMargin` (§4) | `thousandths-1`, "The floor" and `industry-margin-1` ("Confidence") | `evidence.test.ts` › "confidence is computed, never reported" (row 3); "one mild factor stays, two fall" (row 32); "the margin is in thousandths and inclusive" (tech notes §14, S1) |
| third | `evidence-strings.ts` | `EVIDENCE_STRINGS`, `QUESTION_KEYS` (§9) | None; the text of each key is the parent's "Strings", word for word | `evidence.test.ts` › "every string is Thai and English" (row 29) |
| fourth | `leans.ts` | `leanOfValue`, `leansOfMeasures`, the thresholds as named constants (§8) | `value-to-lean-1` and `measure-to-lean-1` ("Evidence first") | `leans.test.ts` unit cases on the inputs of their worked examples (tech notes §8 and §12) |
| last | `index.ts` | The new exports (§1) | None | Rows 30 and 31 |

Reused read-only, unchanged (tech notes §1): `fingerprintOf` (`resolver.ts`), `RULE_VALUES` (`interpreter.ts`), `hexSchema` and `HueFamily` (`color-audit.ts`), `slugSchema` and `PERSONALITY_AXES` (`knowledge.ts`).

## Acceptance criteria

Rows copied from ORV-128 spec v1.9 with their numbers and wording; this slice adds no row. In the POC the person sees the result through the engine API; no row renders a screen. Every test uses recorded inputs; none reaches the internet or a model (ADR 0009 point 8).

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Test | Slice |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | An evidence item valid at each bound (a 300-character quote, confidence 0 and 1, an empty `basedOn`, a `fromModel` item with its `model`) | Parsing with `inputEvidenceSchema`, then a JSON round trip | Parses; the round trip is deep-equal; its `id` equals the computed id | None | `evidence.test.ts` › "a valid item" | 1a |
| 2 | Items with, in turn: an extra key `html`, `css`, `screenshot`, `pageText` or `score`; `fromModel: true` with a `measure`; `fromModel: true` with `model: null`; `fromModel: false` with a `model`; a 301-character quote; confidence 1.2; a confidence value that is not the computed one (0.9 on base 0.7 with no factors); an unknown `observation.kind` or reading target; `hypothesis: true` with `hypothesisNote: null`; a `colour-area` item with `source.renderer: null`; a `colour-declared` item with a renderer build; a reading with rules `measure-to-lean-1` (a rule hypothesis, `hypothesis-flag-1`) and `hypothesis: false` | Parsing | Each fails with the path of the bad field (`html`, `measure`, `model`, `observation.quote`, `confidence.value`, `confidence.value`, `observation.kind`, `reading.target`, `hypothesisNote`, `source.renderer`, `source.renderer`, `hypothesis`) | None | `evidence.test.ts` › "bounds and forbidden fields" | 1a |
| 3 | A measure with `page-incomplete`; a model reading with `few-words` and `single-signal`; a floor of 0.5 | `scoreConfidence(base, factors)`, returning `{ confidence, belowFloor }` | 0.7 with `belowFloor: false`; 0.392 with `belowFloor: true`; each lists its base and factors with their values, factors in id order | None | `evidence.test.ts` › "confidence is computed, never reported" | 1a |
| 32 | A floor of 0.5 and model readings (base 0.7): one with `single-signal` only; one with `few-words` only; one with `single-signal` and `page-incomplete`; a measure with `image-small` | `scoreConfidence(base, factors)`, returning `{ confidence, belowFloor }` | 0.56 with `belowFloor: false`; 0.49 with `belowFloor: true`; 0.392 with `belowFloor: true`; 0.5 with `belowFloor: false`; each lists its factors; every order of the factor list gives the same value | None | `evidence.test.ts` › "one mild factor stays, two fall" | 1a |
| 29 | Every key listed under "Strings", the four `{what}` labels once slice 1c names them, and the question keys `evidence.conflict`, `evidence.toolDefault`, `evidence.similarTo`, `culture.yellow`, `culture.political` and `industry.confirm` | Reading their text | Each has non-empty `th` and `en`; neither holds an em dash or a middot | None | `evidence.test.ts` › "every string is Thai and English" | each |
| 30 | The engine modules `evidence`, `confidence`, `evidence-strings`, `leans`, `read-page`, `page-text`, `render-snapshot`, `measures/colour`, `measures/page`, `url-analyser`, `industry` and `evidence-feed` (names suggested) | Scanning their source | None imports `openrouter`, `llm-interpreter`, `@orivilo/page-reader` or a `node:` module, or calls `Math.random` or `Date.now`; only the model-reading adapters import `openrouter`; tests use a fake network and recorded answers | None | `evidence.test.ts` › "measures never call a model" | each |
| 31 | The repo after each slice | `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, and CI | All pass; `pnpm contrast` output unchanged from `develop` | None | Quality gate output in each G3 packet | each |

"Strings" in row 29 is the parent's section "Strings" (`docs/specs/ORV-128/spec.md`, the list of keys under that heading). The tests each row names, and the "break it" check for each, are in tech notes §14.

## Rules and bounds

The parent's "Rules and bounds" apply unchanged, in particular "Purity" and "Determinism". This spec defines no rule. Each rule this slice implements keeps its one home in the parent spec, and this spec points to it by name only:

<!-- prettier-ignore -->
| Rule | Home in `docs/specs/ORV-128/spec.md` v1.9 | Implemented in |
| --- | --- | --- |
| `thousandths-1` | "Confidence" | `confidence.ts` (`milli`, `scoreConfidence`); the thresholds of `leans.ts` |
| The floor | "Confidence", "The floor" (owner decision D3) | `confidence.ts` (`EVIDENCE_FLOOR`) |
| `industry-margin-1` | "Confidence" | `confidence.ts` (`withinMargin`) |
| `hypothesis-flag-1` | "Evidence first"; its members under "Hypotheses" | `evidence.ts` (`HYPOTHESIS_RULES`, `checkItem` clause 14) |
| `value-to-lean-1` | "Evidence first", "From a `lexicon-1` value to a lean" | `leans.ts` (`leanOfValue`) |
| `measure-to-lean-1` | "Evidence first", "From measures to a lean" | `leans.ts` (`leansOfMeasures`) |

A change to a number or an outcome of any of these is made in the parent spec first, with its version bump and impact list; this spec then follows.

## Worked examples

Copied as is from the parent's "Worked examples", the lines that belong to the rules this slice implements. The parent records that the main session ran each line on Node 22.23.0 with ICU 78.2 (2026-10-27) and that each printed the output shown. The author of this spec had no shell and did not run them. The slice 1a builder runs each line and its test again (parent "Worked examples"), and a different output is a finding against the parent spec.

**`thousandths-1` and the floor** (section "Confidence"). Factor values copied from the "Confidence" table; factors sorted by id, the product rounded to 3 decimals, the floor compared as `value in thousandths < 500`.

```sh
node -e 'const F={"few-words":0.7,"image-blurred":0.6,"image-small":0.5,"page-incomplete":0.7,"single-signal":0.8,"tool-default":0};const s=(b,f)=>Math.round([...new Set(f)].sort().reduce((p,k)=>p*F[k],b)*1000)/1000;for(const[b,f]of[[0.7,["single-signal"]],[0.7,["few-words"]],[0.7,["single-signal","page-incomplete"]],[0.7,["single-signal","few-words"]],[0.7,["page-incomplete","few-words"]],[1,["page-incomplete"]],[1,["image-small"]],[1,["page-incomplete","few-words"]],[0.7,["tool-default"]]]){const v=s(b,f);console.log(b,f.join("+"),v,Math.round(v*1000)<500)}'
```

```text
0.7 single-signal 0.56 false
0.7 few-words 0.49 true
0.7 single-signal+page-incomplete 0.392 true
0.7 single-signal+few-words 0.392 true
0.7 page-incomplete+few-words 0.343 true
1 page-incomplete 0.7 false
1 image-small 0.5 false
1 page-incomplete+few-words 0.49 true
0.7 tool-default 0 true
```

Why rounding is part of the rule: the unrounded products are not the spec's numbers.

```sh
node -e 'console.log(0.7*0.8, 0.7*0.7, 0.7*0.7*0.8)'
```

```text
0.5599999999999999 0.48999999999999994 0.39199999999999996
```

**`industry-margin-1`** (section "Confidence"). Compared in whole thousandths; exactly 100 apart is within. Inputs from rows 14 and 33 and the bounds of the rule.

```sh
node -e 'const m=x=>Math.round(x*1000);const w=(a,b)=>Math.abs(m(a)-m(b))<=m(0.1);console.log(0.7-0.6, 0.8-0.7, w(0.7,0.6), w(0.8,0.7), w(0.7,0.599), w(0.9,0.6), w(0.7,0.65))'
```

```text
0.09999999999999998 0.10000000000000009 true true false false true
```

**`value-to-lean-1`** (section "Evidence first"). `RULE_VALUES` copied from `packages/intent-engine/src/interpreter.ts` line 281; the last column is `hypothesis`.

```sh
node -e 'const RULE_VALUES={intensified:90,desired:75,notTooMuch:40,low:25,avoided:15};for(const[k,v]of Object.entries(RULE_VALUES))console.log(k,v,v>50?"high":v<50?"low":"none",v===40)'
```

```text
intensified 90 high false
desired 75 high false
notTooMuch 40 low true
low 25 low false
avoided 15 low false
```

**`measure-to-lean-1`** (section "Evidence first"). Thresholds in thousandths; the first input is row 11's warm share of 0.7, the others sit on each bound.

```sh
node -e 'const m=x=>Math.round(x*1000);const lean=(w,c)=>[m(w)>=500?"warm high":null,m(c)>=100?"expressive high":m(c)<=20?"expressive low":null].filter(Boolean).join(", ")||"none";console.log([lean(0.7,0.05),lean(0.5,0.1),lean(0.499,0.02),lean(0.2,0.06)].join(" / "))'
```

```text
warm high / warm high, expressive high / expressive low / none
```

**`hypothesis-flag-1`, the schema part** (section "Evidence first"). Members copied from "Hypotheses": `measure-to-lean-1` and `tsic-terms-1` as a whole, `value-to-lean-1` at one value only. The inputs are the `rules` of row 11, row 13, row 10 and a `lexicon-1` reading alone, and a model reading with no `rules`. The columns are: must say `true`, may say `true`.

```sh
node -e 'const WHOLE=["measure-to-lean-1","tsic-terms-1"],ONE_VALUE=["value-to-lean-1"];const must=r=>r.some(x=>WHOLE.includes(x));const may=r=>must(r)||r.some(x=>ONE_VALUE.includes(x));for(const r of [["measure-to-lean-1"],["tsic-terms-1"],["lexicon-1","value-to-lean-1"],["lexicon-1"],[]])console.log(r.join("+")||"model",must(r),may(r))'
```

```text
measure-to-lean-1 true true
tsic-terms-1 true true
lexicon-1+value-to-lean-1 false true
lexicon-1 false false
model false false
```

Section names and row numbers in these lines are the parent spec's. Rows 10, 11, 13, 14 and 33 belong to later slices; this slice uses their inputs only as unit-test inputs.

## Out of scope

Everything in the parent's "Out of scope", and the other slices of the parent's "Delivery", each with its own issue and spec:

- **1b:** the safe single-page read, the pinned HTML tokenizer, `html-text-1` and `word-count-1` (rows 5, 6, 7, 36); decision D1 applies there.
- **1c:** the render snapshot contract and the `Renderer` port beyond the open question below, the measures, the URL analyser that calls the lean functions, option D, `competitor-not-read-1`, and the four `{what}` label keys (rows 4, 8 to 12, 34, 35, 38).
- **1d:** `packages/page-reader`, the local renderer, the command `pnpm analyse:url` and `report.ts` (rows 34, 35, 37, 38).
- **2:** industry, `tsic-terms-1`, `industry-level-1` and `readIndustry` (rows 13 to 17, 33). This slice ships `withinMargin` only.
- **3:** model readings and `mood-1` (rows 17, 18, 20); decision D4 applies there.
- **4:** the brief text analyser, `detectConflicts`, the culture flags and `feedEvidence` (rows 19, 21 to 24).
- **5, 6 and 7:** the photo, user HTML and other brand's CI analysers and `similarityCheck` (rows 25 to 28); decision D5 applies to slices 5 and 7.

Slices 1b to 7 also carry rows 29 to 31 again, as the parent's "Delivery" says.

## Open questions (with the default used until answered)

- **`rendererBuildSchema` before slice 1c.** Row 2 and `checkItem` clause 13 need `source.renderer` to parse a renderer build, and tech notes §14 tests "a build with `browserVersion` "153" (one part) fails" in 1a; tech notes §1 places `rendererBuildSchema` in `render-snapshot.ts`, slice 1c. Default: this slice adds `render-snapshot.ts` holding only `rendererBuildSchema` and `RendererBuild`, as tech notes §7 writes them, and slice 1c adds the rest of that file. Impact: tech notes §1 and §12 (about 12 lines move into 1a).
- **The two maps from `NotMeasured` to strings.** Tech notes §12 counts "the two maps of §9" in 1a, but they are typed on the `NotMeasured` unions of tech notes §7, a slice 1c type, and the `{what}` keys are named in 1c. Default: this slice ships `EVIDENCE_STRINGS` with the keys of the parent's "Strings" and `QUESTION_KEYS`; the two maps, the four `{what}` keys and row 29's map case land in 1c with `NotMeasured`. Impact: tech notes §9 and §12.
- **Row 30 before the other modules exist.** Default: the scan in this slice covers the modules of row 30's list that exist after it (`evidence`, `confidence`, `evidence-strings`, `leans`, and `render-snapshot` under the first question), with one failing fixture per import form (tech notes §14, row 30); each later slice's module joins the scan when it lands (Slice "each").
- **Owner items still open from G2.** The model-reading base, `value-to-lean-1` and findings F1 to F19 stay open for the owner (parent "Owner decisions"). Default: this slice ships the numbers as the parent states them; a change bumps `confidence-1` in the parent first, with the impact list the parent's "Confidence" names.

## Depends on

- [ORV-128 spec](../ORV-128/spec.md) v1.9 and its [tech notes](../ORV-128/tech.md) (G2 design, findings F1 to F19).
- ORV-128 comments 10209 (G1 decisions D1 to D7), 10215 (the orchestrator's adjustment under D3), 10226 (the G2 packet) and 10227 (G2 passed under the owner's delegation, slice split 1a to 1d).
- [ADR 0008](../../adr/0008-brief-interpreter-adapters.md) and its Addition of 2026-10-26; ADR 0005 (schema versions); ADR 0007 decision 5 (the fingerprint); ADR 0009 point 8 (recorded tests); ADR 0012 decision 4 (the delegated G2).
- Engine source reused read-only: `resolver.ts`, `interpreter.ts`, `color-audit.ts`, `knowledge.ts`.

## Downstream review if this spec changes

- ORV-128 spec, "Delivery" row 1a (the rows and deliverables this spec copies).
- ORV-128 tech notes §1, §7, §9 and §12, against the first three open questions.
- ADR 0008 Addition: its "Not confirmed yet; follow-up" line, once this slice merges with the tests its Confirmation names.
- The ORV-132 Jira issue acceptance (rows 1, 2, 3, 32, 29, 30, 31).

## Changelog

- v1 (2026-10-27): split from ORV-128 spec v1.8 as slice 1a (L-0016). Rows 1, 2, 3, 32, 29, 30 and 31 copied with their numbers and wording; the rules `thousandths-1`, the floor, `industry-margin-1`, `hypothesis-flag-1`, `value-to-lean-1` and `measure-to-lean-1` pointed to by name in the parent; the deliverables `evidence.ts`, `confidence.ts`, `evidence-strings.ts` and `leans.ts` from tech notes §1 to §5, §8, §9 and §14; five worked examples copied as is. Three open questions with defaults on what tech notes place in 1c. Downstream to review: the ORV-132 Jira issue acceptance, tech notes §1, §7, §9 and §12, the slice 1a builder.
- v1.1 (2026-10-27): follows ORV-128 spec v1.9, which records three deviations of the slice 1a build (task `ORV-132-build-evidence-1`). Rows 3 and 32: the When cell says `scoreConfidence(base, factors)`, returning `{ confidence, belowFloor }` (tech notes §4), in place of a call that took the whole item; Given, outcomes and test names unchanged. The value shape per reading target and the `reference.asset` font `family` bound keep their one home in the parent's "Evidence first" (the bound listed under its "Hypotheses"); this spec points to "Evidence first" under "What this slice uses" and restates neither. Parent references move from v1.8 to v1.9. No row number, test name or rule home changes. Review: tech notes §2 (the value-shape table's `reference.asset` row) and §4; `evidence.test.ts` (test names unchanged); the ORV-132 Jira issue acceptance (rows 3 and 32).
