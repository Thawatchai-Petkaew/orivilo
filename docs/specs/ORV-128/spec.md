---
issue: ORV-128 (https://tpetkaew.atlassian.net/browse/ORV-128), layer 1 of the ORV-126 harness
lane: L (a new engine contract every brand node reads, the evidence schema; server-side reads of outside web pages with legal exposure; new model calls and prompts; uploaded files)
version: 1.17
---

# ORV-128: input analysers, harness layer 1

## Evidence first: the shape every analyser emits

Every analyser turns what the person brings into a list of **evidence items**. One item is one thing seen in one input, with what it measures (when code can measure it), what it suggests for the brand, how sure the harness is, and whether a model was involved. Nothing else leaves an analyser: no page copy, no stored image, no free-form summary.

The schema is a strict zod object (`inputEvidenceSchema`, name suggested): an unknown key fails to parse at every level, so a field such as `html`, `css`, `screenshot`, `pageText` or a model's own `score` cannot be stored (row 2). The field-level checks are in the tech notes (`docs/specs/ORV-128/tech.md` §2, `checkItem`).

<!-- prettier-ignore -->
| Field | Type and bound | Meaning |
| --- | --- | --- |
| `schemaVersion` | `"1.0"` | Contract version (ADR 0005 pattern) |
| `id` | 8 hex digits | FNV-1a fingerprint (ADR 0007 decision 5) over the canonical JSON of `analyser`, `source` without `retrievedAt`, `observation`, `measure.metric` and `reading.target`. `source` holds the renderer build, so the build is in the id. The same bytes read again later give the same ids; two different items with one id are an error (`id-collision`), never a silent drop |
| `analyser` | `{ id, version }` | Which analyser made the item, for example `{ id: "website-url", version: "1" }` |
| `inputKind` | `website-url`, `user-html`, `mood-photo`, `other-brand-ci`, `brief-text` | The five input kinds below |
| `role` | `own`, `reference`, `competitor` | What the person said the input is when they gave it: their own brand, a reference they like, or a competitor. Never guessed by the analyser |
| `source` | `{ ref, locator, contentHash, retrievedAt, renderer }` | `ref`: the URL, the upload key or the brief id. `locator`: where in the input, one of four kinds: `text` (`path`, `start`, `end`, a span of the normalised text), `element` (`path`), `box` (`x`, `y`, `width`, `height`, a pixel box in an image) or `surface` (`scope`: `first-screen` or `full-page`). `contentHash`: SHA-256 of the bytes read. `retrievedAt`: ISO date and time, from a clock passed in. `renderer`: the build that rendered the page, `{ driver, driverVersion, browser, browserVersion }` read from the running browser, or `null` when nothing in the item rests on a render |
| `observation` | `{ kind, subject, quote? }` | What was seen, as a closed `kind` (list below) and a `subject` slug. `quote` is the exact input text, 300 characters at most, only for text observations; it must equal the input at `locator` (ADR 0008 decision 2) |
| `measure` | `null` or `{ metric, value, unit }` | A number computed by code from the input (list below); the unit is fixed by the metric. Always `null` when `fromModel` is `true` |
| `reading` | `null` or `{ target, value, by, rules? }` | What the observation suggests for one node input (targets below). `by` is `rule`, with `rules` naming the rule ids that made it from the closed list `RULE_IDS` (below), or `model`. `null` for a pure measure that suggests nothing on its own. The schema checks that `value` has the shape its `target` takes (tech notes §2, the table of value shapes per target) |
| `confidence` | `{ value, base, factors }` | `value` 0 to 1, computed by code under rule `thousandths-1`. `base` is `{ id, value }`; `factors` is a list of `{ id, value }`, so the trace shows the numbers and not only their names (section "Confidence") |
| `belowFloor` | boolean | `true` when `confidence.value` is under the floor (section "Confidence"). The node graph treats the item as absent (section "How evidence feeds the node graph") |
| `fromModel` | boolean | `true` when a model produced the observation or the reading |
| `model` | `null` or `{ job, modelId, adapter: { id, version } }` | Required when `fromModel` is `true`, `null` otherwise. `job` is an ADR 0009 job (`interpret` or `see`); `modelId` is the pinned id |
| `basedOn` | evidence ids | Items this one rests on, for example a model's mood reading resting on measured colours |
| `ownedBy` | `self`, `other`, `unknown` | `other` for another brand's asset (case 3): such an item never suggests a value for the person's own brand |
| `origin` | `input`, `tool-default` | `tool-default` when the value matches a default of the tool that made the input (case 4) |
| `flags` | list of `{ key, questionId? }` | Checks that fired on the item: `conflict`, `culture.yellow`, `culture.political`, `similar-to`, `tool-default`, quality reasons |
| `hypothesis` | boolean | Set by rule `hypothesis-flag-1` (below the reading targets) |
| `hypothesisNote` | `null` or string, 1 to 200 characters | Required (a string) when `hypothesis` is `true`, `null` when it is `false`: names the unsourced rule or number, for example `"lean rule value-to-lean-1: 'not too' read as low"` |

**Observation kinds** (closed list): `colour-area`, `colour-declared`, `contrast-pair`, `density`, `font-family`, `text-span`, `image-property`, `industry-candidate`, `personality-signal`, `mood-word`, `brand-name`, `competitor-name`, `asset-shown`. A `colour-area`, `contrast-pair` or `density` item exists only on a render and always names its `renderer`; a `colour-declared` item rests on the stylesheet bytes alone and its `renderer` is `null`.

**Measures** (closed list, code only): `area-share` (0 to 1 of the rendered surface), `hue-family` (an ORV-20 hue band), `lightness` and `chroma` (OKLCH), `warm-share` (share of area in warm hue bands, as `measure-to-lean-1` names them), `contrast-ratio` (WCAG ratio), `text-density` (characters per 1,000 px² of the first screen), `element-density` (visible elements per first screen), `short-edge-px`, `sharpness` (variance of a Laplacian filter), `word-count` (by `word-count-1`), `delta-e` (CIEDE2000 between two colours).

**Reading targets** (closed list, each mapped to an ORV-126 node; section "How evidence feeds the node graph"): `situation.tsic`, `situation.name`, `situation.competitors`, `identity-frame.personality.<axis>` (value `{ lean: "high" | "low" }`, never a 0 to 100 number), `look-feel.mood` (a word: a slug in schema 1.0; slice 3 narrows it to the closed `mood-1` list as schema 1.1, and a word outside the list becomes `not-understood`), `color.current` (a colour the person's own brand uses now), `competitive-frame.lineup-candidate` (`{ name, hex, label }`, `label` being `own-input` or `reference`), `reference.asset` (another brand's colour or font, for the similarity check only; a font's `family` is 1 to 100 characters after trimming, a hypothesis-grade bound, section "Hypotheses").

**Rule ids** (closed list `RULE_IDS`). The rule ids a reading's `rules` may name. At schema 1.0 the list holds four: `lexicon-1`, `value-to-lean-1`, `measure-to-lean-1` and `tsic-terms-1`. `word-count-1` and `html-text-1` make no reading and are not on it. Each slice that adds a rule making a reading (for example on `color.current`, `competitive-frame.lineup-candidate` or `reference.asset`) adds its id and bumps the schema by a minor version (1.1, 1.2 and so on).

**Rule `hypothesis-flag-1`: when an item is a hypothesis.** `hypothesis` is `true` exactly when the item's reading rests on a rule hypothesis: a rule, or one value of a rule, listed as a rule hypothesis under "Hypotheses". Nothing else sets it: not the confidence table, which every item shares, not a model reading, not a measure. The schema checks the rule part: a reading whose `rules` name a rule that is a hypothesis as a whole must say `true`, and an item whose reading names no rule hypothesis, or that has no reading, must say `false` (row 2). Where only one value of a rule is a hypothesis, the schema allows either, because that value never leaves the analyser; the analyser's test checks it (row 10).

**From a `lexicon-1` value to a lean** (rule `value-to-lean-1`, a hypothesis at 40). `lexicon-1` gives an axis one of five fixed values, not a measurement (`RULE_VALUES` in `packages/intent-engine/src/interpreter.ts`). A value above 50 becomes lean `high`; a value below 50 becomes lean `low`; no value is 50, so each of the five maps. In full: 90 (intensified, "very premium") and 75 (desired, "premium") give `high`; 40 ("not too premium", "ไม่หรูหราเกินไป"), 25 (a low word such as "formal" for playful) and 15 (avoided, "not premium", "ไม่หรูหรา") give `low`. The value 40 is a rule hypothesis (`hypothesis-flag-1`); its reading's `hypothesisNote` says that "not too" asks for a little, not none, and is read as `low` until fixtures or the person show otherwise (row 10). The 0 to 100 value itself never leaves the analyser.

**From measures to a lean** (rule `measure-to-lean-1`, a hypothesis). Read from the rendered first screen, compared in whole thousandths (`thousandths-1`):

- **Warm.** The warm share is the area share of clusters in the ORV-20 bands `red`, `orange` and `yellow`. A warm share of 0.5 or more gives `warm` lean `high`. Version 1 gives no `warm` lean `low`: a mostly white page is not cool.
- **Expressive.** The area-weighted mean OKLCH chroma of the first screen. 0.10 or more gives `expressive` lean `high`; 0.02 or less gives `expressive` lean `low`; between the two gives no reading.
- Each reading rests on a rule hypothesis (`hypothesis-flag-1`) and carries a `hypothesisNote` naming the rule and its threshold, `basedOn` naming the measure, and the measure's `renderer`. Without a render there is no area share, so the rule gives no reading.

## The five analysers

What each one measures by code and what it may read through a model. A model only reads; it never measures and never decides (ADR 0009, K-0027: model at the edge, deterministic core).

### 1. Website URL (`website-url`)

- **Input:** one absolute `https` or `http` URL the person submits, with its `role`.
- **Read:** once, server-side, logged out, after robots.txt, and rendered from the read bytes only (section "Reading a page the person submits").
- **By code:** colour area shares on the rendered first screen and full page (colours clustered by a deterministic quantiser, as Material Color Utilities does without a model, K-0021), each cluster's ORV-20 hue band, lightness and chroma; declared colours from the stylesheets; contrast ratio of the main text and background pairs; text and element density; font families for headings and body; the page text by `html-text-1` as text spans, and its word count by `word-count-1` (section "Page text"); personality signals from that text through the existing rule-based adapter `lexicon-1` (ADR 0008), turned into leans by `value-to-lean-1`; warm and expressive leans from the colour measures by `measure-to-lean-1`. Without a render, only the parts that need no render (section "Reading a page", "Where it runs").
- **Through a model:** industry candidates as TSIC codes, personality signals and mood words from the page text (`interpret` job) and from the rendered first screen (`see` job), each quoting the text or naming the measured items it rests on. Labelled `fromModel`.
- **Feeds:** `situation.tsic`, `identity-frame`, `look-feel`, and `color.current` when `role` is `own`. A URL with `role` `competitor` is not read and feeds nothing (rule `competitor-not-read-1`, section "Another brand's page").
- **Prior art:** Hue turns a brand URL into a design model the person approves and a validator checks (K-0026, 0.8); this analyser stops earlier, at evidence.

### 2. User-generated HTML (`user-html`)

- **Input:** one HTML file the person made, often with an AI page tool, uploaded (UTF-8, 1 MB at most, decision D5).
- **Read:** rendered server-side in a sandbox with scripts off and every network request blocked; never rendered to anyone inline (ADR 0015 decision 11).
- **By code:** the same measures as the URL analyser, plus the tool-default check (case 4) against a pinned list of defaults.
- **Through a model:** the same readings as the URL analyser.
- **Feeds:** as the URL analyser with `role` `own`; a value marked `tool-default` feeds no preference reading.

### 3. General mood photo (`mood-photo`)

- **Input:** up to 10 images per analysis (PNG, JPEG or WebP, decision D5) that carry a feeling, not a brand: a place, a material, a scene.
- **By code:** the palette (quantised clusters with area shares), mean and spread of lightness, mean chroma, warm share, contrast between the darkest and lightest clusters, short edge in pixels, sharpness.
- **Through a model** (`see`): mood words from `mood-1` and personality signals, each naming the measured items it rests on.
- **Feeds:** `identity-frame` and `look-feel` only (case 2). A photo's colours never become `color.current` or a lineup candidate.

### 4. Another brand's CI (`other-brand-ci`)

- **Input:** images of another brand's guidelines or assets, or that brand's URL, which the person gives as inspiration. A URL is read as a reference under D1 (a), which accepts the same risk as ORV-127's user channel (section "Another brand's page"). Every item gets `ownedBy: "other"` and the brand name the person typed.
- **By code:** the palette with area shares and hue bands; font families when the input is a page; the similarity check (case 3).
- **Through a model** (`see`): which assets the images show (`asset-shown`: logo, palette, type specimen, photography, pattern) and mood words. A typeface named from an image is a model reading, never a measure.
- **Feeds:** `reference.asset` for the similarity check, `look-feel.mood` as reference mood, and a `competitive-frame.lineup-candidate` labelled `reference` that the person may add so the hue counts as taken. Never a value for the person's own brand.

### 5. Brief text (`brief-text`)

- **Input:** the person's own text, 1 to 2,000 characters (the ORV-126 inventory bound), carrying a concept, a name and competitors.
- **By code:** `lexicon-1` personality signals with exact spans (ADR 0008); URLs found in the text (a URL pattern, recorded as text, not fetched); word count by `word-count-1`.
- **Through a model** (`interpret`): the brand name, competitor names, industry candidates, personality signals and mood words, each with an evidence span equal to the brief text (ADR 0008 decision 2).
- **Feeds:** proposed inventory facts for the ORV-126 classifier (`concept`, `name`, competitors), `situation.tsic`, `identity-frame`, `look-feel`. A competitor URL in the brief is not read (rule `competitor-not-read-1`).

## The six cases (ORV-128, from ORV-126 comment 10202)

1. **Conflicts become a question** (rule `conflict-question-1`). A conflict is either two items above the floor that give opposite leans on the same target, whether from two analysers or from two blocks of one page, or two industry candidates that `industry-level-1` (section "Industry") does not resolve. The harness does not pick one. Both items get the flag `conflict`, and one conflict asks one question, chosen by its target: a conflict on `situation.tsic` asks `industry.confirm`; a conflict on any other target, the personality axes among them, asks `evidence.conflict`. Both items are the choices, and neither counts as support until the person answers (ADR 0008's `conflicting`, applied across analysers). Industry conflicts are found from slice 2; opposite leans are found by `detectConflicts` from slice 4, and until then the report says so with `report.conflictsNotChecked`.
2. **Photo colours become personality first.** A mood photo's colours describe a feeling, not a brand palette. The photo analyser turns its measures into personality leans and mood words for `identity-frame` and `look-feel`; the colour node then decides from personality and the lineup by its own rules (ORV-20). No photo hex is ever offered as a signature or lineup colour (row 25).
3. **Similarity check for another brand's assets.** Another brand's colours are stored as `reference.asset` with `ownedBy: "other"`. `similarityCheck(candidate, references)` flags a candidate colour that falls in the same ORV-20 hue band as a reference brand's dominant colour and within CIEDE2000 10 of it, and a candidate font with the same family name. A colour shared with other brands is weak as an asset (K-0039, 0.75), and a group of colours can be a registered mark in Thailand (K-0053, 0.7). The check says plainly that logo shapes are not compared.
4. **AI-tool defaults split from preference.** HTML made by an AI page tool carries the tool's defaults (a default palette value, a default font). A value that matches the pinned default list within CIEDE2000 2 is marked `origin: "tool-default"`; its preference reading gets the factor `tool-default`, so it never counts as what the person likes, and the node asks `evidence.toolDefault`. The value stays visible: the person may have chosen it on purpose.
5. **Thai colour culture.** A colour that targets the person's own brand (`color.current`, and later the decided signature) is checked against K-0040 (0.7): a dominant colour in the yellow band gets `culture.yellow`; yellow or red as the only dominant colour gets `culture.political`. Each flag carries a question for the person to confirm, never a ban and never a change to the colour. Colour meaning is learned and culture-bound (K-0038, 0.7), so the flag asks rather than rules.
6. **Low-quality input lowers confidence.** A small or blurred image, a page that loaded only in part, a text with few words: each adds a named factor (section "Confidence") that multiplies confidence down. Items under the floor stay stored and visible with their reason, and the node graph treats them as absent.

## The owner's acceptance test

The owner sends one URL and gets back the business type as a TSIC code, a personality and a mood, each with its reasons and the evidence it rests on.

- **How it runs in the POC:** a command, `pnpm analyse:url <url> --role own|reference|competitor` (name suggested), in the server-only package `packages/page-reader` (ADR 0019 decision 1; slice 1d), prints a report and writes the same report as JSON to standard output with `--json`. It renders on the machine that runs it (section "Reading a page", "Where it runs"). No screen (POC focus is function). Tests run it on recorded fixtures; the live run is a manual smoke recorded in the G3 packet, outside `pnpm test` (ADR 0009 point 8). With `--role competitor` it reads nothing, under rule `competitor-not-read-1` (row 38).
- **What the report holds:**
  - **Industry:** the TSIC code, its matched level (1 to 5), its Thai name and English name as the taxonomy module holds them, the confidence, and the evidence ids; or `ambiguous` with the question `conflict-question-1` names and the choices; or `awaiting-taxonomy` (below).
  - **Personality:** per axis of the five (decision D6 of ORV-126, hypothesis), the lean `high` or `low` or `no signal`, the confidence, and the evidence ids; never a 0 to 100 number.
  - **Mood:** up to five words from `mood-1` with confidence and evidence ids.
  - **Reasons:** for every reading, the rule id or the model id that made it, the quote or measure it rests on, and the factors that lowered its confidence.
  - **Refusals, flags and gaps:** a refusal (robots.txt, a non-public address) instead of any reading; culture, conflict and tool-default flags with their question ids; a "not measured" line for each measure the page lacked a render for; the notes that industry is matched by TSIC name only and, until slice 4, that conflicts are not checked.
- **When it passes:** after slice 3 (section "Delivery"). Slices 1a to 1d give measures and rule-based personality; slice 2 adds the industry; slice 3 adds model readings and mood.

### Industry: TSIC code, matched level and confidence

- **Candidates.** Rule-based: the URL analyser matches its page text blocks (`html-text-1`) against **match terms** derived from the names in the TSIC 2009 module of ORV-127 (whole-word and case-insensitive for Latin, substring for Thai, as `lexicon-1` does), in `matchIndustryTerms(blocks, ctx, taxonomy)` (name suggested). The match runs in the analyser, because evidence holds only quotes and never the page text. Model: up to three TSIC codes from `interpret`, each quoting the text it rests on.
- **Match terms** (rule `tsic-terms-1`, a hypothesis). Official TSIC names rarely appear word for word on a page, because most start with a word for "activities". So a code's Thai name loses a leading `กิจกรรม`, and its English name loses a leading `activities of` (case-insensitive); what remains, trimmed, is the code's match term. For example `86202`, `กิจกรรมคลินิกโรคเฉพาะทาง` (ORV-127 spec, "Count"), gives the term `คลินิกโรคเฉพาะทาง`. A name without that prefix is used whole. Each match is a rule reading with base `rule-reading` (section "Confidence"), quoting the matched text. Derived terms still miss most everyday words (a page says `คลินิกทันตกรรม`, not the TSIC name); a curated term list per code, each term with its source, is a later slice with its own issue. Until it lands the CLI report prints `industry.byNameOnly`.
- **Check.** Every candidate code must exist in the module and be brand-relevant (`isBrandRelevant`, ORV-127 row 3); an excluded or unknown code is dropped and listed as `invalid-code` (row 15).
- **Matched level** (rule `industry-level-1`). `readIndustry(evidence, taxonomy)` keeps `situation.tsic` readings that are not below the floor. A candidate's confidence is the highest among its items; candidates rank by confidence, then by code. The top candidate wins, and the second is listed as an alternative with its confidence, unflagged, whatever its section (row 33). Only when the second is within the margin of the top (`industry-margin-1`, section "Confidence") and differs from it does the harness not pick: if they share a section, the result is their deepest common ancestor at the level where they still agree (for example `86202` and `86201` give class `8620`, level 4), naming both and taking the lower confidence of the two (a hypothesis); if they share no section, the result is `ambiguous` with both as choices, both items flagged `conflict` and the question `conflict-question-1` names (case 1, row 14).
- **Before the taxonomy module exists.** The industry function takes the taxonomy as an argument; given none, it returns `{ status: "awaiting-taxonomy" }` with no code and no guess (row 16). Slice 2 starts only after ORV-127 slice 1 has merged the TSIC 2009 code list; this spec adds no copy of the taxonomy.
- **Industry is context.** The TSIC reading feeds `situation` (for the `touchpoints` story and for `lineupFor`, ORV-127). No rule reads it to pick a colour, a typeface or a logo type (ORV-126 "Rules and bounds").

## Why

The ORV-126 harness assumes a structured inventory and a person who answers questions. Real people arrive with a website, a page an AI tool made for them, a few photos, another brand they admire, or a paragraph. The brief asks ORIVILO to inventory what exists before it starts (brief, "Starting assets vary and are incomplete") and to collect before generating (brief, "Every node carries a knowledge base"). The owner framed the harness in three layers and named this story as layer 1, with its input kinds, its shared evidence shape, six cases and an acceptance test (ORV-126 comment 10202; ORV-128).

Layer 1 makes that input usable without letting it decide: code measures what can be measured, a model may suggest what only reading can find, every item says which it is and how sure it is, and the ORV-126 graph still asks the person before anything becomes a value. Practitioners collect and audit before choosing (K-0028, 0.8; K-0036, 0.75), and a model-driven generator without sources, checked output or a trace is the gap K-0027 (0.8) found across the tools surveyed.

This spec is not a guard. It describes analysers and the evidence they return.

### What is real, rule-based and simulated

- **Real (once built):** the evidence schema, the confidence calculation, the safe single-page read, the page text, every measure, the industry check against the TSIC module, the similarity, culture and tool-default checks, and the feed into the node graph. All deterministic TypeScript with tests, except the page fetch and the renderer, which run server-side in `packages/page-reader` (ADR 0019) and are tested against a fake network and local fixtures.
- **Local only in the POC:** the renderer runs on the machine that runs the command (Playwright with its own Chromium). No deployed route renders a page; a later Vercel route runs without a render until ADR 0019's staging measurement is recorded, and says which measures it could not take.
- **Rule-based, not AI:** `lexicon-1` personality signals, `value-to-lean-1`, `measure-to-lean-1`, the TSIC name match (`tsic-terms-1`), the culture flags. Each says `by: "rule"` with its rule id.
- **Read by a model, labelled:** industry candidates, personality signals and mood words from `interpret` and `see`, from slice 3 on. Each is `fromModel: true` with the pinned model id, and each job ships with its Thai and English evaluation set (ADR 0009). Until a slice ships, nothing may say ORIVILO reads that input with AI.
- **Hypothesis-grade:** the confidence numbers, the lean rules, the match terms, the mood vocabulary, the similarity and roll-up thresholds (section "Hypotheses").
- **Not done, and said so:** no logo shape comparison, no reading of text inside images by code, no PDF, no crawl beyond the one page, no legal clearance of any read (section "Reading a page the person submits").

## Story

As a founder or designer who brings whatever I have (my website, a page an AI tool made for me, photos that feel right, a brand I admire, a few lines about my business and its competitors), I want ORIVILO to measure what can be measured, suggest what my inputs say about my business type, personality and mood, show me which suggestions came from AI and how sure each one is, and ask me when my inputs disagree, so that the brand graph starts from my real material instead of a blank form, while nothing becomes a decision until I confirm it.

## Reading a page the person submits

A URL the person submits, for their own brand or as a reference, is read **once, server-side, logged out, after robots.txt**, and what was fetched is kept **only as evidence items**.

- **Address check (R13 of ORV-127).** `https` or `http` only, and only the default ports 80 and 443 are read: 80 for `http` and 443 for `https`, so a URL that names any other port, `http://example.com:443/` among them, is refused (SEC-133-7). A URL whose username or password is non-empty is refused, so no credential reaches a request or the result (R4). A URL whose whole serialisation, as the WHATWG `URL` writes it (its `href`, percent-encoded), is longer than 2,048 characters is refused. 2,048 characters is the evidence schema's bound on `source.ref` (slice 1a), so no URL this check accepts can fail that schema, and the path and query that `robots-match-1` gets, a part of the URL, are shorter still (SEC-133-R1-1, FU-1). The host must resolve to a public address (no loopback, private, link-local, carrier-grade NAT, multicast or cloud metadata range, IPv4 or IPv6), checked on the address actually connected to. IPv4 also refused: the special-purpose ranges `240.0.0.0/4` (reserved), `198.18.0.0/15` (benchmarking) and `192.0.0.0/24` (IETF protocol assignments) (SEC-133-6). Every check in this bullet runs on every request: the submitted URL, each redirect hop, each robots.txt request and its redirects, and each stylesheet URL; a stylesheet that fails it refuses the whole read with `read.refused.address`. At most 3 redirects. IPv6 refused outright: the unspecified address `::`, `::1`, `fc00::/7`, `fe80::/10`, `ff00::/8`, the deprecated site-local `fec0::/10`, the local-use NAT64 prefix `64:ff9b:1::/48` and Teredo `2001::/32`. An IPv6 address that embeds an IPv4 address is judged by that IPv4 address: IPv4-compatible `::/96`, IPv4-mapped `::ffff:0:0/96`, IPv4-translated `::ffff:0:0:0/96`, NAT64 `64:ff9b::/96` and 6to4 `2002::/16`; so `64:ff9b::a00:5` and `::ffff:0:a00:5` (both `10.0.0.5`) are refused and `64:ff9b::808:808` (`8.8.8.8`) is public. A literal with a zone id, or one that does not parse, is refused (tech notes §6, finding F15).
- **robots.txt (R6, K-0056 at 0.8; RFC 9309).** Fetch `/robots.txt` of the host first, under the Address check above, once a lookup of the host has given an address (Depth bound, The result). Within one analysis the file is read once; a cached copy is never used for more than 24 hours. How the file is read:
  - **Rule `robots-token-1`** (R2). A `user-agent` line's value is matched on its product token: the leading run of letters, digits, underscore and hyphen, compared case-insensitively with `oriviloreader`. So `OriviloReader/1`, `OriviloReader` and `oriviloreader` match, and `Orivilo` and `OriviloReader-Bot` do not. The value `*` names the `*` group. RFC 9309 section 2.2 allows letters, underscore and hyphen in a product token, not digits; keeping digits in the run is a hypothesis-grade reading (section "Hypotheses").
  - **Rule `robots-group-1`** (R1). When any group names the product token (`robots-token-1`), the rules of every group naming it apply, combined, and the `*` group does not; the `*` group applies only when no group names the token (RFC 9309 section 2.2.1). With neither, nothing is disallowed. So an allow in the `*` group never reopens a path the OriviloReader group disallows.
  - **Rule `robots-match-1`** (SEC-133-1, SEC-133-R1-1, SEC-133-R1-3; FU-1, FU-5, FU-6, FU-7). The path is the URL's path and query.
    - **Normalisation.** Before matching, the path and each pattern are normalised as RFC 9309 section 2.2.2 states (K-0056): octets of the pattern outside ASCII are percent-encoded as UTF-8; a reserved character written as itself stays as written and is not percent-encoded; a percent-encoded unreserved character (a letter, a digit, hyphen, period, underscore or tilde) is decoded in both the path and the pattern, and every other percent-encoding stays encoded; percent-encodings compare case-insensitively, so both sides write their hex digits in upper case. The decoding on the pattern side, the hex digits compared case-insensitively and the reserved characters left as written are readings of the RFC (section "Hypotheses"). So `Disallow: /สินค้า` covers the page `/สินค้า`, whose URL is percent-encoded, and `Disallow: /private` covers `/%70rivate`.
    - **Matching.** A pattern is then matched against the path from the path's first character, without a regular expression, in at most (path length times pattern length) steps: `*` matches any run of characters, and a `$` that ends the pattern ends the match (section 2.2.3). A `%2A` or `%24` in a pattern stands for a literal `*` or `$` and matches that character, or its percent-encoding `%2A` or `%24`, in the path (RFC 9309 Figure 6, K-0056; matching the percent-encoding too is a reading, section "Hypotheses"), so `Disallow: /path/file-with-a-%2A.html` covers `https://example.com/path/file-with-a-*.html`, and `Disallow: /a-%2A.html` covers `https://example.com/a-%2A.html`. When more than one rule of the groups `robots-group-1` applies matches the path, the most specific match is used: the rule whose normalised pattern has the most octets; an allow and a disallow of equal length give allow; when no rule matches, the page may be read (section 2.2.2).
    - **Caps.** A pattern longer than 1,000 characters after normalisation is ignored. The rules counted below are the lines whose key is `allow` or `disallow`, in a group or before the first group, an ignored pattern and an empty value included. A robots.txt is treated as complete disallow, failing closed, when it holds more than 5,000 such rules, or when the patterns of those rules hold more than 100,000 characters in all, counted after normalisation. So one check of one path makes at most (total pattern characters times path length) steps, 100,000 times 2,048: a path and query are part of the URL, which the Address check caps at 2,048 characters ("Worked examples").
  - **Answers.** A 2xx is parsed, within the robots.txt size bound of Bounded. A 3xx is followed, under the same bound of 3 redirects and the Address check on every hop, and the file it lands on is parsed (R3); its rules apply in the context of the initial authority, the host of the submitted URL, never to the host the redirect named (RFC 9309 section 2.3.1.2); past the bound the read fails with reason `redirects`, as a page's redirect chain does. A 3xx with no `Location` header has no place to go and is no answer (R1-4). A 4xx means no rules; a 5xx or no answer means complete disallow.
- **Logged out (R9).** No cookies, no authorization header, no form, no login, no CAPTCHA, no rotating address. A URL carrying a username or password never reaches a request (Address check).
- **Named reader (R7).** The user agent carries `OriviloReader/1` and a contact URL (open question on the URL).
- **Bounded.** One page and its own stylesheets: at most 10 stylesheets, the document at most 2 MB and each stylesheet at most 1 MB (cut off past that, with the factor `page-incomplete`), each robots.txt answer at most 500 KiB (a longer one is complete disallow, failing closed, and no part of it is parsed; FU-4), 10 seconds per request, 30 seconds in all. No link is followed and no other page of the site is read. Images, fonts and scripts are not fetched; the colour measures cover what CSS paints, and each says so (open question on images).
- **Depth bound** (SEC-133-3, SEC-133-R1-2, SEC-133-R1-5, F20, F23). Building the tree costs time that grows with the square of its nesting, so the nesting is bounded while the tree is built, and the tree is then walked to a bounded depth.
  - **Nesting count.** While the tree is built, the tree builder's own stack of open elements is counted, through the tree adapter hooks of the pinned tokenizer, `parse5`'s `onItemPush` and `onItemPop` (K-0082). At the push that would make the stack 129 elements deep the parse stops, only the text before that element's start tag is parsed again, and the read carries `page-incomplete`; where the cut falls for an element the tree builder adds with no start tag of its own is in tech notes §6. The count is the tree builder's own, so it needs no list of elements and no reading of the parser's rules: whatever the tree builder nests, inside text it reads as raw text, inside foreign content such as `svg`, or through elements it closes or reopens on its own, is counted as it nests. A tag starts with the ASCII `<`, so the cut is at the same place in the bytes and in the decoded text.
  - **The walk.** The parsed tree is walked to a depth of 128 elements, counting `html` as 1. An element nested deeper gives no stylesheet link and no page text block, and the read carries `page-incomplete`.
  - **The result.** The read always returns its result (read, refused or failed), never an exception. A port that rejects, `resolve` or `request`, counts as no answer to the request it served, and so does a lookup that gives no address; the result carries none of the port's message. The host of the submitted URL and the host of each redirect target of the page are looked up before robots.txt is requested of that host, and such a lookup that gives no address or whose `resolve` rejects fails the read with reason `network`, so `read.refused.robots` is never shown for a host that does not exist (FU-2). Otherwise: for the document (its lookup or its request) the read fails with reason `network`, or `timeout` when the budget ran out; for robots.txt, its redirect targets included, it is no answer under Answers; for a stylesheet it is a stylesheet that failed (Bounded).
- **Kept only as evidence (R11).** The HTML, CSS and rendered image live in memory for the run and are discarded. What is returned is the evidence list: measures, quotes of 300 characters at most that a reading rests on, and the content hash. In the POC nothing is persisted (ORV-126 state is in memory; E2-12 owns persistence).

**Where it runs** ([ADR 0019](../../adr/0019-page-renderer-placement.md), proposed; its Status names slice 1d as the PR that accepts its POC part, see the open question on slice 1c's size).

- **A server-only package.** The reader's network ports and the renderer live in `packages/page-reader`, Node only, never imported by client code. The engine defines the ports and the render snapshot it accepts, parses the snapshot as untrusted data, and never imports the package (ADR 0019 decision 1). The HTML tokenizer that finds stylesheet links and the page text is in the engine, pinned exactly, once a research entry records it (ADR 0019 decision 6).
- **POC: local Playwright.** The command renders with Playwright 1.56.1 and its own bundled Chromium on the machine that runs it. No Vercel function launches a browser in the POC (ADR 0019 decision 3).
- **The renderer never fetches.** It gets only the bytes the read fetched. Every request the browser makes is intercepted: the document and the read stylesheets are answered from memory, everything else is aborted. JavaScript is off, each analysis gets a fresh browser context, and the render runs within what is left of the read's time budget ("Bounded" above) (ADR 0019 decision 2; row 37).
- **Option D is the fallback everywhere, and labelled.** With no renderer, a failed launch, a render past the budget or a render result that fails its schema, the analysis still runs on the read bytes: declared colours, declared font families and the page text. Colour areas, contrast, density and text visibility are listed as not measured, each with its reason (`read.notMeasured`), and nothing from CSS alone is shown as a rendered measure (ADR 0019 decision 4; row 34).
- **Vercel later, behind a measurement.** A later Vercel route renders with `@sparticuz/chromium` and `puppeteer-core` (option B), but only once ADR 0019's staging measurement is recorded there. Until then the route runs option D and says so (ADR 0019 decision 5; K-0081, 0.8). The two builds may lay out a page slightly differently; each rendered item names its build (`source.renderer`), and no claim is made that the two agree.

**How this differs from bulk collection in ORV-127.** ORV-127's automated reader and user channel read many brands' pages to build a shared library other workspaces see; they wait on a Thai lawyer's review of R2, R8, R10 and R14 (ORV-127 decision D2). The single-page read here is started by one person for one page at a time, follows no link, writes no library record, and returns evidence to that person only. The owner chose the lawyer review for bulk reading (ORV-127 comment 10201); that review does not block this single-page case unless the owner says so (decision D1).

**What stays the same.** A program fetching a page is automated access in law terms (ORV-127 decision D3), whatever the volume; robots.txt is a convention, not a permission (K-0056); and the Computer Crime Act's access offences concern systems with an access-prevention measure (K-0054, 0.7), which logged-out public pages are read to avoid. This is our reading, not legal advice. Choosing D1 (a) means the owner accepts the remaining risk for single pages until the lawyer review lands.

**Another brand's page.** Reading any other brand's page because a person named it, whether as a competitor or as a reference they admire, is the same act as ORV-127's user channel (R12: the user names a brand or URL and ORIVILO reads it under R6 to R11). The role label does not change the read. D1 (a) draws the line by purpose, not by kind of read: it accepts that risk for references, which the person names one at a time as inspiration and which only feed the similarity check and a reference mood, and it holds competitor URLs, which feed the lineup the colour node audits, until the lawyer review lands. So a reference URL is read under the rules above; a competitor URL is not read (rule `competitor-not-read-1`, below), and a competitor's colours enter the lineup only by the person or through ORV-127. If the owner wants references to wait too, that changes D1 (a version bump), and analyser 4 then reads uploaded images only.

**Rule `competitor-not-read-1`** (where D1 (a) is enforced). When the input's `role` is `competitor`, neither the URL analyser (slice 1c) nor the command `pnpm analyse:url` (slice 1d) calls `readPage`: no request is made for robots.txt, the page or a stylesheet. The URL is recorded as text in the report, the report prints `read.notRead.competitor`, and no evidence item rests on the page (row 38). This is a check in our own code that a rule-following caller meets; it lifts only when the owner changes D1.

## Page text

The page text always comes from the document bytes, with a render or without one. A render only decides which blocks count as visible; it never adds text. The bytes are the only text a quote can be checked against: the render is untrusted, and the content hash covers the bytes.

**Rule `html-text-1`** (versioned; a change bumps `analyser.version`). Before tokenizing, the document bytes are decoded as UTF-8 by the global `TextDecoder`, with each invalid sequence replaced by U+FFFD rather than refused; a charset the page declares is not honoured in the POC (section "Hypotheses"). The engine's pinned tokenizer parses the document with scripting off, as the JavaScript-off render does, so an element path from one names the same element in the other.

- **Blocks**, in document order: the `title`; the `meta name="description"` content; each `h1` to `h6`; each element of the block list `p`, `li`, `dt`, `dd`, `blockquote`, `figcaption`, `caption`, `td`, `th`, `pre`, `button`, `label`, `summary`; and each other element with a non-whitespace text child and no block ancestor. A block's text is its descendant text without the subtrees of nested blocks.
- **Skipped subtrees:** `head` (except the title and the meta description), `script`, `style`, `template`, `svg`, `iframe`, and any element with the `hidden` attribute or `aria-hidden="true"`. `noscript` is kept, because a JavaScript-off page shows it.
- **Normalised text.** Runs of ASCII whitespace become one space, and the text is trimmed. Locator offsets index this text, and a quote must equal it at its locator (row 9).
- **Body bound.** Body text stops at 5,000 characters, cut at the last whitespace before the limit. The title, the meta description and the headings do not count against it.
- **Heading bound** (SEC-133-4). Heading text shares a bound of its own, 5,000 characters in all over every `h1` to `h6` block, cut at the last whitespace before the limit as body text is. Past it no further heading block is kept, and the page text carries `page-incomplete`. The title and the meta description count against neither bound.
- **Depth.** An element below the depth bound, or after the cut of the Nesting count ("Reading a page the person submits", Depth bound), gives no block.
- **Path bound** (R1-1, SEC-133-R1-4). A block whose element path (its form is in tech notes §8) would be longer than 500 characters, the bound of a locator `path` in the evidence schema, gives no block, and the page text carries `page-incomplete`. The path is not built past that bound: building stops once it passes 500 characters.
- **With a render**, a body or heading block is kept only when the render shows a non-empty box for its path, which drops text hidden by CSS or placed off the page; the title and the meta description are always kept. Kept items carry the render's `renderer`.
- **Without a render**, every block is kept, every item has `renderer: null`, and `text-visibility` is listed as not measured, because text hidden by CSS may be included. Confidence is unchanged: the text is the page's own, and the label says what was not checked.

**Rule `word-count-1`.** A text's word count is the number of word-like segments that `Intl.Segmenter` gives with locale `th` and granularity `word`, so Thai written without spaces is counted in words, not in space-separated runs. The segmenter's data (ICU) comes with the Node build, so the Node version is one of "the same versions" in "Rules and bounds", Determinism. The repo does not pin one Node line yet: `engines` says `>=22` and `.nvmrc` holds `22`. Slice 1b pins one Node line in both `engines` and `.nvmrc` and records the Node and ICU versions beside row 36's count (open question "The Node line").

## Confidence

ADR 0008 rejected a confidence score per finding because no method backed one. Here the number is backed by a method the trace shows: a base per kind of item times named factors, all computed by code. A model's own estimate of its certainty is never read (a `score` key fails the schema, row 2). The owner chose this under D6 (a), and ADR 0008 records it in its "Addition, 2026-10-26: a computed confidence number for input evidence", which states the same bases, factors and rounding as this section.

<!-- prettier-ignore -->
| Base or factor | Value | When |
| --- | --- | --- |
| base `measure` | 1.0 | A code measure with no reading and `fromModel` false |
| base `rule-reading` | 0.7 | A reading by a rule over quotes or measures |
| base `model-reading` | 0.7 | A reading or an observation by a model (every item with `fromModel` true) (0.6 in v1.1; raised in v1.2, see "Owner decisions") |
| `page-incomplete` | times 0.7 | The document or a stylesheet was cut off or failed, a stylesheet past the tenth was not fetched, the document was parsed only up to the cut of the Nesting count or walked only to the depth bound, the heading text was cut at its bound, or a block was dropped by the Path bound |
| `few-words` | times 0.7 | The text a reading rests on has fewer than 20 words by `word-count-1` |
| `image-small` | times 0.5 | The image's short edge is under 512 px |
| `image-blurred` | times 0.6 | Sharpness under the threshold set from fixtures at slice 5 |
| `tool-default` | times 0 | The value matches a pinned tool default (case 4), for a preference reading only |
| `single-signal` | times 0.8 | A model reading that names one quote or measure only |

Every number in this table is a hypothesis (section "Hypotheses"). A change to any of them bumps the method's version, `confidence-1`, and ships with an impact list naming rows 3, 12, 18, 22, 24 and 32.

**Rule `thousandths-1`: how a confidence is computed, rounded and compared.**

1. Factors are sorted by id, and a repeated factor counts once. The product is the base times each factor, left to right in that order, so the order the caller passes never changes the result.
2. The stored `confidence.value` is the product rounded to 3 decimals: `Math.round(product * 1000) / 1000`.
3. Every comparison of a confidence (the floor, the industry margin) and of a measure against a lean threshold (`measure-to-lean-1`) is made in whole thousandths, as integers.
4. Tests compare exact numbers, never "close to". The schema rejects an item whose `confidence.value` or `belowFloor` is not the computed one (row 2).

**The floor** (owner decision D3) is 0.5. An item is `belowFloor` when its value in thousandths is under 500; a value of exactly 0.5 is not below.

**Rule `industry-margin-1`** (a hypothesis). Two industry confidences are within the margin when they differ by 100 thousandths or less, so exactly 0.1 apart is within and anything further apart is not. In doubles `0.8 - 0.7` is a little over 0.1; in thousandths it is exactly 100 ("Worked examples"). `industry-level-1` uses this rule.

**What the numbers do at the floor.** `single-signal` (times 0.8) is the one mild factor; the others are 0.7 or lower. A rule or model reading starts at 0.7. With one mild factor it stays above the floor (0.56). With one strong factor it falls below (0.49). With any two factors it falls below (0.392 at most). A measure (1.0) stays at or above the floor with any one quality factor (0.5 at the lowest, which is not under it) and falls below with two factors of 0.7 (0.49). `tool-default` drops any preference reading to 0. Each product is worked under "Worked examples", and rows 3, 12 and 32 test them. A model reading and a rule reading share the base; the `fromModel` label, the model id and `single-signal` keep them apart.

**Which factors slices 1a to 1d use.** `page-incomplete` goes on every item from a read with a cut, failed or skipped part. `few-words` goes only on readings that rest on the page text. `single-signal`, `image-small`, `image-blurred` and `tool-default` first occur in slices 3, 5 and 6.

## How evidence feeds the node graph

Evidence lands on the ORV-126 node records, in the `evidence` list each node already holds (ORV-126 "Rules and bounds", State). A function `feedEvidence(state, items)` (name suggested) maps each reading's target to its node.

<!-- prettier-ignore -->
| Reading target | ORV-126 node | What the node does with it |
| --- | --- | --- |
| `situation.tsic` | `situation` (1) | Proposes the TSIC code for the person to confirm; used later by `touchpoints` and `lineupFor` |
| `situation.name`, `situation.competitors`, concept | `situation` (1) | Proposes inventory facts; the classifier's rules still decide the group (ORV-126 harness part 1) |
| `identity-frame.personality.<axis>` | `identity-frame` (7) | Evidence beside the proxy questions; the person still sets each axis |
| `look-feel.mood` | `look-feel` (12) | Evidence for the mood direction (node out of the POC; stored, not used) |
| `color.current` | `color` (15) | Shown as the brand's current colours with their hue bands and flags; read by no rule in the POC |
| `competitive-frame.lineup-candidate` | `competitive-frame` (5) | Proposed `{ name, hex, label }` entries; only entries the person confirms join the lineup `auditLineup` reads (ORV-20) |
| `reference.asset` | `color` (15) | Input to `similarityCheck` on the decided signature |

Rules of the feed:

1. **A model never decides, and neither does evidence.** Evidence never sets a node to `given`, `derived`, `decided` or `confirmed`, never fills an input, and is never passed to a decision rule (`decideColor` and the later node rules take no evidence argument). A reading becomes a value only when the person confirms it; the input is then `given` with the evidence ids in its trace (row 19).
2. **Below the floor is absent.** An item with `belowFloor: true` stays in the node's evidence list, shown with its reasons, but counts as no support: the node asks its questions as if the item were not there (row 24).
3. **Conflicts ask.** A `conflict` flag adds to the node's questions the one question `conflict-question-1` names (case 1); neither side counts as support until answered.
4. **The ORV-20 colour node is unchanged.** It still reads only a confirmed lineup and the personality vector. Evidence reaches it as confirmed lineup entries and as values the person set from evidence, never directly. No ORV-20 source file changes.
5. **Each list is sorted by node number, then evidence id**, so the same input gives the same state (ADR 0007 decision 5). Two items from two renderer builds are two items; neither replaces the other.

## Strings (data in the engine, for review by the designer and the owner)

No screen renders these in the POC; the CLI prints the English and the Thai. A later screen takes them through the locale catalog.

- `evidence.fromModel`: en "Read by AI ({model}). Check it before you use it."; th "AI อ่านค่านี้ ({model}) โปรดตรวจสอบก่อนนำไปใช้"
- `evidence.measured`: en "Measured from what you gave us"; th "วัดจากข้อมูลที่คุณให้มา"
- `evidence.belowFloor`: en "Too uncertain to use: {reason}"; th "ยังไม่แน่ชัดพอจะนำไปใช้: {reason}"
- `evidence.conflict`: en "Your inputs point two ways on {subject}. Which is closer to your brand?"; th "ข้อมูลที่คุณให้มาชี้ไปสองทางในเรื่อง{subject} แบบไหนใกล้กับแบรนด์ของคุณมากกว่า"
- `evidence.toolDefault`: en "This looks like a default of the tool that made the page. Did you choose it, or should we set it aside?"; th "ค่านี้ดูเหมือนเป็นค่าเริ่มต้นของเครื่องมือที่สร้างหน้านี้ คุณเลือกเอง หรือให้เราตัดออกไปก่อน"
- `evidence.similarTo`: en "This is close to the colours of {brand}. Using it may make your brand look like theirs."; th "ค่านี้ใกล้เคียงกับสีของ {brand} หากใช้ แบรนด์ของคุณอาจดูคล้ายแบรนด์นั้น"
- `culture.yellow`: en "In Thailand, yellow is widely linked with the monarchy, so people may read your brand that way. Keep it?"; th "ในไทย สีเหลืองมักถูกเชื่อมโยงกับสถาบันพระมหากษัตริย์ คนอาจมองแบรนด์ของคุณในแง่นี้ ยังคงใช้สีนี้ไหม"
- `culture.political`: en "In Thailand, red or yellow used alone has stood for political movements since 2005, so some people may read your brand that way. Keep it?"; th "ในไทย สีแดงหรือสีเหลืองที่ใช้เพียงสีเดียวเคยเป็นสัญลักษณ์ของกลุ่มการเมืองตั้งแต่ปี 2548 บางคนอาจมองแบรนด์ของคุณในแง่นี้ ยังคงใช้สีนี้ไหม"
- `industry.confirm`: en "Which of these is closest to your business?"; th "ข้อใดใกล้เคียงกับธุรกิจของคุณที่สุด"
- `industry.byNameOnly`: en "Business type is matched by TSIC names only, so everyday words may be missed."; th "ประเภทธุรกิจจับคู่จากชื่อใน TSIC เท่านั้น จึงอาจพลาดคำที่ใช้กันทั่วไป"
- `report.conflictsNotChecked`: en "Readings that disagree are not checked yet."; th "ยังไม่ได้ตรวจว่าผลการอ่านขัดแย้งกันหรือไม่"
- `read.refused.robots`: en "This site asks automated readers not to read this page, so we did not read it."; th "เว็บไซต์นี้ขอไม่ให้โปรแกรมอัตโนมัติอ่านหน้านี้ เราจึงไม่ได้อ่าน"
- `read.refused.address`: en "We can read only public web addresses."; th "เราอ่านได้เฉพาะที่อยู่เว็บสาธารณะเท่านั้น"
- `read.notRead.competitor`: en "This is a competitor's page, so we kept its address and did not read it. Reading competitor pages waits for a legal review."; th "หน้านี้เป็นของคู่แข่ง เราจึงเก็บไว้เพียงที่อยู่เว็บและไม่ได้อ่าน การอ่านหน้าเว็บของคู่แข่งต้องรอการตรวจสอบทางกฎหมายก่อน"
- `read.notMeasured`: en "Not measured: {what}. The page was not rendered ({reason})."; th "ไม่ได้วัด: {what} เพราะไม่ได้แสดงผลหน้าเว็บ ({reason})"
- `read.notRendered.none` (reason `no-renderer`): en "no renderer is set up"; th "ยังไม่ได้ตั้งค่าตัวแสดงผล"
- `read.notRendered.failed` (reason `render-failed`): en "the renderer did not start"; th "ตัวแสดงผลเริ่มทำงานไม่สำเร็จ"
- `read.notRendered.budget` (reason `render-budget`): en "the page took too long"; th "หน้าเว็บใช้เวลานานเกินไป"
- `read.notRendered.invalid` (reason `snapshot-invalid`): en "the renderer's result could not be used"; th "ใช้ผลจากตัวแสดงผลไม่ได้"
- `{what}` in `read.notMeasured` takes one of four labels, for colour areas, contrast, density and text visibility. Slice 1c names their keys and drafts their Thai and English for the same review.
- `quality.fewWords`: en "the text has fewer than 20 words"; th "ข้อความมีไม่ถึง 20 คำ"
- `quality.pageIncomplete`: en "part of the page did not load"; th "บางส่วนของหน้าเว็บโหลดไม่สำเร็จ"
- `quality.imageSmall`: en "the image is under 512 px on its short side"; th "ภาพมีด้านสั้นไม่ถึง 512 พิกเซล"
- `quality.imageBlurred`: en "the image is blurred"; th "ภาพไม่คมชัด"

## Delivery: vertical slices

Each slice is one PR of about 400 changed lines, usable through the engine API or the command. Slices after the first three get their own Jira issues, each with a spec that links back here (L-0016). The order follows decision D2. Slice 1 is four PRs, 1a, 1b, 1c and 1d, because its size, estimated in tech notes §12, is well past one PR; every row keeps its number.

<!-- prettier-ignore -->
| Slice | Delivers | Rows | Waits on |
| --- | --- | --- | --- |
| 1a | The evidence schema (locators, `source.renderer`, the id), `thousandths-1`, the floor and `industry-margin-1`, the strings, and the rules `value-to-lean-1` and `measure-to-lean-1` as pure functions | 1, 2, 3, 32, 29 to 31 | D3, D6 (ADR 0008 Addition, 2026-10-26) |
| 1b | The safe single-page read (address check, robots.txt, bounds, logged out) over injected ports; the pinned HTML tokenizer; the page text by `html-text-1` and `word-count-1` | 5, 6, 7, 36, 29 to 31 | 1a; D1; a research entry for the tokenizer (ADR 0019 decision 6); `security` review |
| 1c | The render snapshot contract and the `Renderer` port; colour, contrast, density and font measures; `lexicon-1` and `measure-to-lean-1` readings; the URL analyser with option D and `competitor-not-read-1` | 4, 8 to 12, 34, 35, 38, 29 to 31 | 1b; `security` review |
| 1d | `packages/page-reader` as its own PR right after 1c: the network ports, the local Playwright renderer and the command `pnpm analyse:url`; and the engine's report schema module, `report.ts` (`reportSchema`, tech notes §7, "The report schema"); its merge accepts ADR 0019's POC part (ADR 0019 Status) | 34, 35, 37, 38, 29 to 31 | 1c; a TypeScript runner for the command (open question); `security` review |
| 2 | Industry: match terms from TSIC names, candidates by name match, the code check, matched level and roll-up; `pnpm analyse:url` with measures, personality and industry | 13 to 17, 29 to 31, 33 | ORV-127 slice 1 (the TSIC 2009 code list); 1d |
| 3 | Model readings for the URL analyser through `interpret` and `see`: industry candidates, personality, mood words from `mood-1` (schema 1.1), with evaluation sets; the acceptance test passes | 17, 18, 20, 29 to 31 | D4; ADR 0009 eval sets; `security` review (ADR 0015 decision 2) |
| 4 | Brief text analyser; `detectConflicts` across analysers and within one; Thai culture flags; `feedEvidence` into the ORV-126 state | 19, 21 to 24, 29 to 31 | ORV-126 slice 1 (node ids) for row 24's graph check |
| 5 | Mood photo analyser with image bounds and quality factors | 25, 26, 29 to 31 | D5 |
| 6 | User HTML analyser in the sandbox, with the tool-default list | 27, 29 to 31 | The upload rules of ADR 0015 decision 11 |
| 7 | Another brand's CI analyser and `similarityCheck` | 28, 29 to 31 | D5 |

Function and file names are suggested; a later design may rename them, and each named test keeps its name. The server-only package is slice 1d (open question on slice 1c's size).

## Acceptance criteria

In the POC the person sees the analysers' result through the engine API or the command; no row renders a screen. Every test uses recorded inputs and a fake network; none reaches the internet or a model (ADR 0009 point 8). The renderer tests in `packages/page-reader` render local fixtures only. A row states the values its test asserts; the rule that produces each value is defined once, in the section the rule's name points to.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Test | Slice |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | An evidence item valid at each bound (a 300-character quote, confidence 0 and 1, an empty `basedOn`, a `fromModel` item with its `model`) | Parsing with `inputEvidenceSchema`, then a JSON round trip | Parses; the round trip is deep-equal; its `id` equals the computed id | None | `evidence.test.ts` › "a valid item" | 1a |
| 2 | Items with, in turn: an extra key `html`, `css`, `screenshot`, `pageText` or `score`; `fromModel: true` with a `measure`; `fromModel: true` with `model: null`; `fromModel: false` with a `model`; a 301-character quote; confidence 1.2; a confidence value that is not the computed one (0.9 on base 0.7 with no factors); an unknown `observation.kind` or reading target; `hypothesis: true` with `hypothesisNote: null`; a `colour-area` item with `source.renderer: null`; a `colour-declared` item with a renderer build; a reading with rules `measure-to-lean-1` (a rule hypothesis, `hypothesis-flag-1`) and `hypothesis: false` | Parsing | Each fails with the path of the bad field (`html`, `measure`, `model`, `observation.quote`, `confidence.value`, `confidence.value`, `observation.kind`, `reading.target`, `hypothesisNote`, `source.renderer`, `source.renderer`, `hypothesis`) | None | `evidence.test.ts` › "bounds and forbidden fields" | 1a |
| 3 | A measure with `page-incomplete`; a model reading with `few-words` and `single-signal`; a floor of 0.5 | `scoreConfidence(base, factors)`, returning `{ confidence, belowFloor }` | 0.7 with `belowFloor: false`; 0.392 with `belowFloor: true`; each lists its base and factors with their values, factors in id order | None | `evidence.test.ts` › "confidence is computed, never reported" | 1a |
| 4 | The same recorded page bytes, snapshot and clock twice; then the stylesheets supplied in another order; then the same bytes and snapshot with a later clock | The URL analyser | Deep-equal results with equal ids for the first two; evidence sorted by kind, then locator; with the later clock, equal ids and only `retrievedAt` differs | None | `url-analyser.test.ts` › "same input, same evidence" | 1c |
| 5 | URLs `ftp://a.b`, `javascript:x`, `http://127.0.0.1/`, `http://10.0.0.5/`, `http://169.254.169.254/`, `http://[::1]/`, `http://[::]/`, `http://[64:ff9b::a00:5]/`, a host the fake resolver maps to `192.168.1.2`, a public page that redirects to a private address, `http://user:secret@example.test/`, `https://example.com:6379/`, `http://example.com:443/`, `http://240.0.0.1/`, `http://198.18.0.1/`, `http://192.0.0.170/`, `http://[fec0::1]/`, `http://[::ffff:0:a00:5]/`, a public page that redirects to `http://user:secret@example.test/`, one that redirects to `https://example.com:6379/`, a public page whose stylesheet link is `https://user:secret@example.test/a.css`, and one whose stylesheet link is `https://example.test:8080/a.css`; then `http://[64:ff9b::808:808]/` and `https://example.com:443/`, each serving a public page | `readPage(url)` | Each of the first twenty-two refused with `read.refused.address` and no evidence; the fake network records no request to a non-public address, no request URL holding a username or password, and no request on a port other than 80 or 443; `http://[64:ff9b::808:808]/` is read (its IPv4, `8.8.8.8`, is public) and `https://example.com:443/` is read | None | `read-page.test.ts` › "public addresses only" | 1b |
| 6 | robots.txt that disallows the path for `*`; one that disallows it for `oriviloreader` in lower case; one answering 503; one answering 404; `User-agent: oriviloreader` `Disallow: /`, then `User-agent: *` `Allow: /public`, for the page `/public`; `User-agent: OriviloReader/1` `Disallow: /`; `User-agent: oriviloreader` `Allow: /`, then `User-agent: *` `Disallow: /`; `http://example.test/robots.txt` answering 301 to `https://example.test/robots.txt`, which answers 200 with `User-agent: *` `Allow: /`; a robots.txt answering 301 to `http://10.0.0.5/robots.txt`; `User-agent: *` with `Disallow: /` followed by `*a` 12 times and `b$`, for the page `/` followed by 38 `a` and a `b`, and then for the page `/` followed by 38 `a`; a `Disallow` pattern of 1,001 characters that matches the page path; `User-agent: OriviloReader` with `Disallow: /สินค้า` and `Disallow: /private`, for `https://example.com/สินค้า` and for `https://example.com/%70rivate`; a robots.txt of 500 KB holding 5,000 `Disallow: /*ab` rules and comment lines, for the page `/` followed by 1,999 `a` (a path of 2,000 characters); a robots.txt of 5,001 `Disallow: /x` rules, for the page `/`; a URL of 2,049 characters in all (its `href`); `User-agent: *` with `Disallow: /path/file-with-a-%2A.html`, for `https://example.com/path/file-with-a-*.html`; `User-agent: *` with `Disallow: /a-%2A.html`, for `https://example.com/a-%2A.html`; a robots.txt of 500 KiB plus one byte whose rules allow everything; a robots.txt of 101 `Disallow` rules, each `/` followed by 999 `x` (1,000 characters), for the page `/` | `readPage` | Refused with `read.refused.robots` and no request for the page: the `*` disallow, the lower-case token, the 503, the token group over the `*` allow, `OriviloReader/1`, the pattern ending in `b`, `/สินค้า`, `/%70rivate`, the file of 5,001 rules, the `%2A` pattern, the `/a-%2A.html` pattern for the path holding `%2A`, the file of 500 KiB plus one byte, and the file of 101 patterns of 1,000 characters. Refused with `read.refused.address` and no request to `10.0.0.5`: the robots.txt redirect to it. Refused with `read.refused.address` and no request at all: the URL of 2,049 characters. The page is read: the 404, the token group's allow over the `*` disallow, the robots.txt redirect to `https`, the path of 38 `a`, the 1,001-character pattern, and the 500 KB file of 5,000 rules. Each of the two hostile-pattern cases returns within 1 s; the 500 KB file of 5,000 rules returns within 500 ms | None | `read-page.test.ts` › "robots.txt first" | 1b |
| 7 | A recorded page with 12 linked stylesheets, a 3 MB document, links to other pages and a 4-step redirect chain; then a document of `<body>` and 5,000 nested `div` elements, with a stylesheet link inside the 600th `div`; then five documents of 2 MB: `<body>` and nested `div` elements, `<body>` and `<div></span>` repeated, `<body>` and `<div><script></div></script>` repeated, `<body><style><!--</style>` followed by nested `div` elements, and `<body><svg><style>` followed by nested `g` elements; then the held-depth document of 2 MB: `<body>`, 125 nested `div` elements and `</p>` repeated; then, after robots.txt answered 404, a `resolve` port that rejects on the page's own lookup, and a `request` port that rejects on the page's own request; then a submitted URL whose host the fake resolver maps to no address | `readPage`, inspecting the fake network log | No request carries a cookie or authorization header; every request's user agent holds `OriviloReader/1` and the contact URL; no request URL and no result URL holds a username or password; at most 10 stylesheets fetched; the document cut at 2 MB with `page-incomplete`; no other page and no image, font or script fetched; the fourth redirect refused. The nested document: `readPage` resolves with status `read` and `page-incomplete`, never rejects, and the stylesheet below the depth bound is not fetched. Each of the five 2 MB documents: `readPage` resolves with status `read` and `page-incomplete` within 2 s. The held-depth document: `readPage` resolves with status `read` within 2 s, without `page-incomplete` (nothing is cut: the stack never passes the depth bound). Each rejecting port: `readPage` resolves with status `failed` and reason `network`, never rejects, and no text of the port's error is in the result. The host with no address: `readPage` resolves with status `failed` and reason `network`, the fake network log holds no request (robots.txt included), and the result is not `read.refused.robots` | None | `read-page.test.ts` › "one page, logged out, bounded" | 1b |
| 8 | A recorded fixture page with known colours, text and fonts, and its recorded snapshot | The URL analyser | `colour-area` items whose `area-share` sums to 1 within 0.001 per scope, each with its ORV-20 hue band; a `contrast-ratio` for the body text pair; `text-density` and `element-density`; `font-family` for headings and body; every item `fromModel: false` with a `measure` and a `locator`; every rendered item names the snapshot's `renderer` | None | `url-analyser.test.ts` › "measures by code" | 1c |
| 9 | The result of row 8 | Inspecting every field | No field holds the HTML, the CSS or an image; every quote is 300 characters or fewer and equals the `html-text-1` text of the document bytes at its locator; a snapshot path that is not in the document adds no text; `source.contentHash` is the SHA-256 of the bytes read; nothing is written to disk, Storage or the database | None (in memory) | `url-analyser.test.ts` › "kept only as evidence" | 1c |
| 10 | A fixture page whose heading reads "premium and calm"; another with "ไม่หรูหรา"; a third with "not too premium" | The URL analyser | Readings `identity-frame.personality.premium` lean `high` (from 75), lean `low` (from 15) and lean `low` (from 40), `by: rule` with rules `lexicon-1` and `value-to-lean-1`, `fromModel: false`, each quoting the page text; the first two have `hypothesis: false`, the third `hypothesis: true` (`hypothesis-flag-1`) and a `hypothesisNote` naming the "not too" rule; no item holds the 0 to 100 value | None | `url-analyser.test.ts` › "rule-based personality from page text" | 1c |
| 11 | A fixture page painted 70 percent in warm hue bands | The URL analyser | A reading `identity-frame.personality.warm` lean `high`, `by: rule` with rule `measure-to-lean-1`, `hypothesis: true`, `basedOn` naming the `warm-share` measure | None | `url-analyser.test.ts` › "measured leans are hypotheses" | 1c |
| 12 | A fixture page with 12 words and one stylesheet that fails | The URL analyser with a floor of 0.5 | Its readings carry `few-words` and `page-incomplete`; the `lexicon-1` reading is 0.343 with `belowFloor: true`; the quality reasons are `quality.fewWords` and `quality.pageIncomplete`; colour measures carry `page-incomplete` only | None | `url-analyser.test.ts` › "low quality lowers confidence" | 1c |
| 13 | The TSIC 2009 module of ORV-127, where `86202` is named "กิจกรรมคลินิกโรคเฉพาะทาง", and a fixture page of 20 words or more, fully loaded, whose heading holds "คลินิกโรคเฉพาะทาง" | The URL analyser with the taxonomy, then `readIndustry(evidence, taxonomy)` | The match term "คลินิกโรคเฉพาะทาง" (rule `tsic-terms-1`) is found; code `86202`, level 5, its full names from the module, confidence 0.7, and the evidence id of the quote "คลินิกโรคเฉพาะทาง"; a page holding only "กิจกรรม" matches no code | None | `industry.test.ts` › "a name match gives the code" | 2 |
| 14 | Candidates `86202` (0.7) and `86201` (0.65); then `86202` (0.7) and `56101` (0.65) | `readIndustry` | First: `8620`, level 4, naming both candidates; second: `ambiguous` with question `industry.confirm` and both codes as choices, and a `conflict` flag on both items | None | `industry.test.ts` › "roll up or ask" | 2 |
| 15 | Candidates `84110` (excluded division) and `00000` (unknown) beside a valid `86202` | `readIndustry` | `86202`; the two others listed as `invalid-code`, never returned as the industry | None | `industry.test.ts` › "only real, brand-relevant codes" | 2 |
| 16 | No taxonomy passed | `readIndustry(evidence, null)` | `{ status: "awaiting-taxonomy" }`, no code, no level | None | `industry.test.ts` › "no taxonomy, no guess" | 2 |
| 17 | The recorded fixture site `clinic-th` | `pnpm analyse:url --fixture clinic-th --role own`, and with `--json` | Prints industry (code, level, names, confidence), personality per axis (lean or `no signal`), mood (slice 3 on), and for each reading its rule or model id, its quotes or measures and its factors; the `industry.byNameOnly` line; until slice 4 the `report.conflictsNotChecked` line; the JSON parses with `reportSchema` (tech notes §7, "The report schema"); exit 0 | None | `analyse-url.test.ts` › "the owner's acceptance report"; the live run in the G3 packet | 2, 3 |
| 18 | Recorded `interpret` and `see` answers for the fixture page; then an answer with an extra key `confidence`; then one quoting words not on the page | The URL analyser with model readings on | First: readings with `fromModel: true`, the pinned model ids, label key `evidence.fromModel`, base 0.7; page text sent only as the user message, never in the instructions. Second and third: the whole answer refused, the rule-based readings stand and say `by: rule` | None | `url-analyser.test.ts` › "model readings are labelled and checked" | 3 |
| 19 | An ORV-126 state and model readings above the floor for every personality axis and for `situation.tsic`, none confirmed | `feedEvidence(state, items)`, then `planFill` | Each node's `evidence` lists the items; no node status changes; no input holds a value; `identity-frame` still asks its proxy questions; after the person confirms one reading, that input is `given` with the evidence ids in its trace | Node records in memory only | `evidence-feed.test.ts` › "evidence never decides" | 4 |
| 20 | A `mood-1` fixture holding "calm" and "luxurious", and a recorded model answer with mood words "calm", "luxurious" and "zxq" | Parsing the mood readings | Words in `mood-1` kept; a word outside it listed as `not-understood`, never a reading | None | `url-analyser.test.ts` › "mood words from a closed list" | 3 |
| 21 | The brief "ORIVILO helps Thai founders build a brand. Competitors: Brand X (`https://x.example`), Brand Y" | The brief analyser with a recorded `interpret` answer | Readings `situation.name` "ORIVILO" and `situation.competitors` "Brand X" and "Brand Y", each with a span equal to the brief text, proposed, not given; the URL recorded as text; under D1 (a) no request to `x.example` | None | `brief-analyser.test.ts` › "names proposed, competitor pages not read" | 4 |
| 22 | A brief reading premium lean `high` (0.7) and a URL model reading premium lean `low` with `single-signal` (0.56); then the same with the URL reading also carrying `few-words` (0.392) | Combining both analysers with a floor of 0.5 | First: both flagged `conflict`, `identity-frame` gets `evidence.conflict` with both as choices, neither counts as support. Second: no conflict; the high lean stands; the low one is shown below the floor | None | `evidence-feed.test.ts` › "a conflict becomes a question" | 4 |
| 23 | Own-brand dominant colours: a yellow-band colour beside a teal one; a red-band colour alone; a teal colour alone | The culture check | `culture.yellow` on the first; `culture.political` on the second; nothing on the third; every colour kept, none removed, no node blocked | None | `evidence-feed.test.ts` › "Thai colour culture asks, never bans" | 4 |
| 24 | Items with targets across every row of the feed table, one item below the floor; the ORV-126 graph | `feedEvidence` | Every target maps to a node id in `BRAND_GRAPH`; the below-floor item is listed with its reason and the node's open questions are the same as with no evidence; lists sorted by node number then evidence id | Node records in memory only | `evidence-feed.test.ts` › "below the floor is absent" | 4 |
| 25 | A fixture photo of a warm beach scene | The photo analyser | `image-property` measures (palette, lightness, chroma, `warm-share`, short edge, sharpness); readings only on `identity-frame` and `look-feel`; no item targets `color.current` or `competitive-frame.lineup-candidate` | None | `photo-analyser.test.ts` › "photo colours become personality first" | 5 |
| 26 | A JPEG named `a.png`; a GIF, a HEIC and an SVG; a 5 MB PNG; 11 images; a 400 px wide image; a JPEG with EXIF location | The photo analyser | The JPEG judged by its bytes and read; the GIF, HEIC and SVG refused by content; the 5 MB file refused; the 11th image refused; the small image carries `image-small`; the bytes sent to the recorded `see` call carry no EXIF and a long edge of at most 1568 px | None | `photo-analyser.test.ts` › "image bounds" | 5 |
| 27 | A fixture default list holding `#6366F1` and the font Inter (fixture values, not the pinned list, until slice 6 pins its sources and versions); an uploaded HTML file with a `<script>`, an `<img src>` to an outside host, the colour `#6366F1`, the font Inter, and a colour off the list | The HTML analyser | No script runs and the fake network sees no request; the measures as in row 8; `#6366F1` and Inter carry `origin: tool-default`, their preference readings have factor `tool-default` and confidence 0, and the node gets `evidence.toolDefault`; the other colour feeds `color.current` | None | `html-analyser.test.ts` › "tool defaults are not preference" | 6 |
| 28 | Reference images from "Brand Z" whose dominant colour is a cyan; candidates: a cyan within CIEDE2000 6 of it, a cyan 14 away, and a lime | The reference analyser, then `similarityCheck` | Items with `ownedBy: other` and the brand name; no item targets an own-brand value; a lineup candidate labelled `reference`; the first candidate flagged `evidence.similarTo` naming "Brand Z", the other two not; the result states that logo shapes are not compared | None | `reference-analyser.test.ts` › "another brand's assets are checked, never copied" | 7 |
| 29 | Every key listed under "Strings", the four `{what}` labels once slice 1c names them, and the question keys `evidence.conflict`, `evidence.toolDefault`, `evidence.similarTo`, `culture.yellow`, `culture.political` and `industry.confirm` | Reading their text | Each has non-empty `th` and `en`; neither holds an em dash or a middot | None | `evidence.test.ts` › "every string is Thai and English" | each |
| 30 | The engine modules `evidence`, `confidence`, `evidence-strings`, `leans`, `read-page`, `page-text`, `render-snapshot`, `measures/colour`, `measures/page`, `url-analyser`, `industry` and `evidence-feed` (names suggested) | Scanning their source | None imports `openrouter`, `llm-interpreter`, `@orivilo/page-reader` or a `node:` module, or calls `Math.random` or `Date.now`; only the model-reading adapters import `openrouter`; tests use a fake network and recorded answers | None | `evidence.test.ts` › "measures never call a model" | each |
| 31 | The repo after each slice | `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, and CI | All pass; `pnpm contrast` output unchanged from `develop` | None | Quality gate output in each G3 packet | each |
| 32 | A floor of 0.5 and model readings (base 0.7): one with `single-signal` only; one with `few-words` only; one with `single-signal` and `page-incomplete`; a measure with `image-small` | `scoreConfidence(base, factors)`, returning `{ confidence, belowFloor }` | 0.56 with `belowFloor: false`; 0.49 with `belowFloor: true`; 0.392 with `belowFloor: true`; 0.5 with `belowFloor: false`; each lists its factors; every order of the factor list gives the same value | None | `evidence.test.ts` › "one mild factor stays, two fall" | 1a |
| 33 | Candidates `86202` (0.9) and `56101` (0.6), from different TSIC sections and 0.3 apart | `readIndustry` | Code `86202`, level 5; `56101` listed as an alternative with its confidence; no `conflict` flag, no `industry.confirm` question | None | `industry.test.ts` › "outside the margin the top code wins" | 2 |
| 34 | A recorded read with stylesheets and no snapshot; then a snapshot with an extra key; then a render past the 30 s budget on a fake clock | `analyseUrl(read, null, ctx)`, then with each snapshot case; the CLI on the first | `colour-declared` items, `font-family` items with `sheet:` locators, text spans and `lexicon-1` readings; no `colour-area`, `contrast-pair` or `density`; every item `source.renderer: null`; `notMeasured` lists colour areas, contrast, density and text visibility with reason `no-renderer`, then `snapshot-invalid`, then `render-budget`; nothing repaired, no error; the CLI prints one `read.notMeasured` line per entry with its reason string | None | `url-analyser.test.ts` › "no snapshot: declared colours and the page text", "a bad snapshot runs as option D"; `packages/page-reader` › "out of budget falls back to declared colours" | 1c, 1d |
| 35 | The same bytes and two recorded snapshots that differ only in `renderer`; a local fixture rendered by Playwright 1.56.1 | The URL analyser on each; the local renderer | Every `colour-area` id differs between the two runs and every `colour-declared` id is equal; each rendered item's `source.renderer` equals its snapshot's; the local render names driver `playwright` `1.56.1` and a four-part Chromium version read from the running browser, and every text box path names an element of the tokenized document | None | `url-analyser.test.ts` › "the renderer build is part of the source"; `packages/page-reader` › "the renderer's paths match the tokenizer" | 1c, 1d |
| 36 | A fixture document with a title, a meta description, an `h1`, a `p`, a `script`, a `style`, a `template`, an `svg`, an element with `hidden`, one with `aria-hidden="true"`, a `noscript` holding a `p` (`<noscript><p>Enable JavaScript</p></noscript>`), and body text over 5,000 characters; then the Thai text "อยากให้สนุก"; then a document of `<body>` and 40,000 `<h2>heading text here</h2>`; then a document of `<body>` and 5,000 nested `div` elements whose innermost holds `<p>deep</p>`; then the 2 MB document of nested `div` elements of row 7; then the two 2 MB documents of row 7 that start `<body><style><!--</style>` and `<body><svg><style>`; then the held-depth document of row 7 (`<body>`, 125 nested `div` elements and `</p>` repeated to 2 MB); then a document of `<body>`, 509 nested custom elements each named `x-` followed by 998 `a` (1,000 characters), 5,000 `<p>x</p>` and 5,000 `<h2>x</h2>` | `pageTextOf(bytes)`, then the word count | Blocks for the title, the meta description, the `h1`, the `p` and the `p` inside the `noscript` ("Enable JavaScript") only, in document order, whitespace runs as one space; body text cut on whitespace within 5,000 characters; equal bytes give deep-equal blocks; "อยากให้สนุก" counts 3 words, where splitting on spaces gives 1. The heading page: 294 heading blocks of 4,998 characters in all, the cut reported as `page-incomplete`, returned within 2 s. The nested page: no block for "deep", the cut reported as `page-incomplete`, no exception. The 2 MB nested page, the 2 MB page that starts `<body><style><!--</style>` and the 2 MB page that starts `<body><svg><style>`: each returned within 2 s, the cut reported as `page-incomplete`. The held-depth page: returned within 2 s with the blocks it holds and `incomplete` false (nothing is cut). The page of long names: returned within 2 s, `incomplete` true, and no block whose path is longer than 500 characters | None | `page-text.test.ts` › "html-text-1" | 1b |
| 37 | Local fixtures: a page with an outside image, font, script and iframe URL; a page whose inline script repaints the background; two renders in a row, the first setting a cookie | The local renderer | Zero requests leave the process and only the read URLs are answered; the snapshot keeps the CSS colour; the cookie is absent in the second render | None | `packages/page-reader` › "no request leaves the renderer", "scripts never run", "fresh context per analysis" | 1d |
| 38 | The recorded fixture site `clinic-th` and a fake network that logs every request | The URL analyser with `role` `competitor` over the fake ports; then `pnpm analyse:url --fixture clinic-th --role competitor`, and with `--json` | Zero requests in the fake network log (no robots.txt, no page, no stylesheet); no evidence item rests on the page; the URL recorded as text; the `read.notRead.competitor` line in Thai and English; the JSON parses with `reportSchema` (tech notes §7, "The report schema"); exit 0 | None | `url-analyser.test.ts` › "a competitor URL is not read"; `analyse-url.test.ts` › "a competitor URL is not read" | 1c, 1d |

## Rules and bounds

- **Measures by code, readings labelled.** Colour proportions, contrast, density, fonts, image properties and word counts come from code. Mood words, personality signals and industry candidates may come from a model and then carry `fromModel: true` and the model id. A model never measures, never decides, and its certainty is never read.
- **Purity.** Schema, confidence, page text, measures, the industry check, the similarity, culture and tool-default checks and the feed are pure TypeScript in `packages/intent-engine` that take bytes, a clock reading and port answers as arguments. The page fetch, DNS resolution and the renderer are server-only, in `packages/page-reader` (ADR 0019 decision 1); no client code fetches a page or calls a model.
- **Untrusted input.** Page text, HTML, brief text, text inside images and the renderer's snapshot are data. Text goes only in the user message of a model call, never in the instructions (ADR 0015 decision 3, LLM01:2026); model output and the snapshot are parsed strictly, a failed parse is refused and never repaired, and quotes must equal the input (ADR 0008).
- **Model jobs.** `interpret` keeps zero retention; `see` allows Google's safety retention only (ADR 0009 addition). Each job used here has a rate limit per person through the ORV-112 helper (ADR 0015 decision 4), proposed at slice 3's G1. No silent fallback to another model; on failure the rule-based readings stand (ADR 0009 point 3).
- **Images.** ADR 0009 point 5: PNG, JPEG or WebP by magic bytes, 4 MB each, at most 5 per model request (an analysis of 10 images makes two), long edge at most 1568 px, EXIF stripped, never public links. In the POC the command reads local files; the first upload route carries ADR 0015 decision 11.
- **HTML.** 1 MB at most, rendered with scripts off and network blocked, never served inline.
- **Nothing persisted in the POC.** Results live in memory and on standard output.
- **Determinism.** The code part of a result is the same for the same bytes, clock and versions, the renderer build and the Node version among them; every list is sorted. Two renderer builds are not claimed to agree, and no test compares them.
- **No IP claim.** No result says a colour, font or mark is free to use, unique or cleared; the similarity check covers colours and font names only.
- **Industry is context.** The TSIC reading never feeds a colour, type or logo rule.

## Hypotheses (below confidence 0.7, or no source)

- The confidence bases and every factor value (section "Confidence", table): ours, no source; to be checked against labelled fixtures. The model-reading base is the orchestrator's adjustment (section "Owner decisions").
- **Rule hypotheses**, the members rule `hypothesis-flag-1` reads (three at schema 1.0):
  - `value-to-lean-1` at the value 40 only (section "Evidence first"), its reading of "not too": ours, no source; also the orchestrator's (section "Owner decisions"). Its mapping of 90, 75, 25 and 15 has no source either, but it keeps the direction `lexicon-1` already gives those words, so it is not a member.
  - `measure-to-lean-1` as a whole (section "Evidence first"), its warm bands and its thresholds: no source links measured colour to these axes; a peer-reviewed abstract says hue, saturation and value shift perceived personality (K-0038, 0.7) but its mappings were not read, so no mapping rests on it.
  - `tsic-terms-1` as a whole (section "Industry"): ours, no source; the curated term list per code that replaces it carries a source per term.
- `industry-margin-1` (section "Confidence") and the roll-up taking the lower confidence (`industry-level-1`, section "Industry").
- The tool-default list (case 4, slice 6): its entries, sources and versions are not pinned yet; until they are, `#6366F1` and Inter in row 27 are fixture values, not claims about any tool.
- The similarity threshold (case 3) and the tool-default tolerance (case 4).
- The length bound on a `reference.asset` font `family` (section "Evidence first", the reading targets): ours, no source; the slice 1a build set it. A schema bound, not a rule hypothesis: `hypothesis-flag-1` does not read it.
- The decoding bound in `html-text-1` (section "Page text"): ours, no source on how many submitted pages declare another charset; the slice fixtures may overturn it, and a change is a new version of the rule. A bound, not a rule hypothesis: `hypothesis-flag-1` does not read it.
- The read's resource bounds added in v1.12: the depth bound of 128 elements, lowered from 512 in v1.17 against F23 ("Reading a page the person submits", Depth bound), the 1,000-character pattern bound of `robots-match-1` and the heading bound of `html-text-1` ("Page text"): ours, no source; set against the hostile inputs of security findings SEC-133-1, SEC-133-3 and SEC-133-4. Bounds, not rule hypotheses: `hypothesis-flag-1` does not read them.
- The read's resource bounds added in v1.14, each the orchestrator's call under ADR 0012 decision 4 and open for the owner; bounds, not rule hypotheses, so `hypothesis-flag-1` does not read them:
  - **The 5,000 Allow or Disallow rules** of `robots-match-1`: ours, no source; set against the hostile robots.txt of security finding SEC-133-R1-1. The bound v1.14 put on the path and query became the whole-URL bound of v1.15 (below).
  - **The Nesting count** ("Reading a page the person submits", Depth bound), which in v1.16 replaced the token pre-pass of v1.14 (F20): ours; set against security finding SEC-133-R1-2 and tech notes finding F20. It counts the tree builder's own stack, so its cut cannot differ from the tree the parser builds; a real page that nests past the depth bound is cut there. That `parse5` calls `onItemPush` on every push to its stack of open elements and `onItemPop` on every pop rests on the tree adapter interface of the installed `parse5` 8.0.1, which declares both hooks, and on the tech notes' measurement; K-0082 section 6 records both hooks and their call sites. Rows 7 and 36 time the hostile shapes.
  - **The Path bound** of `html-text-1` ("Page text"): the 500 characters are the evidence schema's own locator bound (slice 1a), not a new number; a block deeper than about 25 levels can pass it on a real page (review finding R1-1), and the slice fixtures may show how often.
- The read's bounds and one reading added in v1.15 ("Owner decisions", Slice 1b review round 1, follow-ups), each the orchestrator's call under ADR 0012 decision 4 and open for the owner; none is a rule hypothesis, so `hypothesis-flag-1` does not read them:
  - **The whole URL of 2,048 characters** (Address check): the evidence schema's own bound on `source.ref` (slice 1a), not a new number; no source on how many real URLs pass it.
  - **The 100,000 pattern characters** of `robots-match-1`: ours, no source; the other option security finding SEC-133-R1-1 named, set so that the step ceiling of one check of one path rests on the pattern characters of the whole file ("Worked examples").
  - **The robots.txt size of 500 KiB** (Bounded): the number the slice 1b build already used (`ROBOTS_MAX_BYTES` in `read-page.ts`); ours, no source. Failing closed past it, where the build parsed the first 500 KiB, is ours too.
  - **The optional-end-tag reading** (FU-8): no longer applies; the count is the tree builder's own stack (v1.16, F20).
- Readings of RFC 9309 (K-0056, 0.8), two added in v1.13, two in v1.15 and one in v1.16, each the orchestrator's call under ADR 0012 decision 4 and open for the owner. None is a rule hypothesis: `hypothesis-flag-1` does not read them, because none makes a reading.
  - **Digits in `robots-token-1`.** The rule keeps digits in the token run, where section 2.2 allows letters, underscore and hyphen only. Our token `oriviloreader` has no digits, so every value that is a valid token under section 2.2 gets the same answer under both readings. The two differ only on a value that is not a valid token, where digits follow the letters, for example `OriviloReader1`: the rule reads its token as `oriviloreader1`, which does not match, where a letters-only run would read `oriviloreader`, which does ("Worked examples", `robots-token-1`). Section 2.2 does not say how to read such a value; we read it as written and do not take another reader's group as ours.
  - **The robots.txt redirect bound.** robots.txt follows the same redirect bound as the page ("robots.txt", Answers), which is below section 2.3.1.2's SHOULD of at least five consecutive redirects. Kept so one page read has one redirect bound. Past it the read fails closed with reason `redirects`, where the RFC MAY treat the file as unavailable, under which a crawler may read any page.
  - **Hex case and decoding in `robots-match-1`** (v1.15). The rule compares the hex digits of a percent-encoding case-insensitively, and decodes a percent-encoded unreserved character on the pattern side as well as the path. RFC 3986 grounds both for URIs: section 2.1 makes hex case equivalent and asks for upper case, section 2.3 names the unreserved set and makes its percent-encoding equivalent, and section 6.2.2 normalises both ways (K-0056, subsection "RFC 3986, the sets and the normalisation"). RFC 9309 section 2.2.2 says matching SHOULD be case sensitive and states the decoding for the URI side only; treating a pattern as a URI path is our reading.
  - **Reserved characters left as written in `robots-match-1`** (v1.15). The rule does not percent-encode a reserved character written as itself, where section 2.2.2 says octets in the reserved range MUST be percent-encoded before the comparison. We read Figure 4 row 1, which keeps `/`, `?` and `=` as written, as the RFC's own practice (K-0056).
  - **A `%2A` or `%24` in the path in `robots-match-1`** (v1.16, F22). Figure 6 shows a pattern's `%2A` covering a written `*` in the URL; it does not say whether the pattern also covers a path that holds `%2A` itself, and RFC 3986 section 2.2 makes a reserved character and its percent-encoding not equivalent (K-0056). The rule matches both and so fails closed: matching the written character only would read `https://example.com/a-%2A.html` under `Disallow: /a-%2A.html`.
- The `image-small` and `image-blurred` thresholds (section "Confidence").
- The five personality axes themselves (ORV-126 decision D6, no source).
- `mood-1`, the closed list of mood words: ours.
- ORV-20's hue bands (engine entry `color.hue-families`, 0.4), which the measures reuse.

## Worked examples

Each line runs as is with `node` and prints the output under it. The author of this spec had no shell; after v1.3 the main session ran all eight lines on Node 22.23.0 with ICU 78.2 (2026-10-27), and every output matched the one shown. The ninth line, `hypothesis-flag-1`, was added in v1.5; the main session ran it on Node 22.23.0 with ICU 78.2 (2026-10-27), and it printed the five lines shown (finding F17). The tenth line, the decoding sentence of `html-text-1`, was added in v1.11; the main session ran it on Node 22.23.0 (2026-10-27), and it printed the output shown. Lines eleven to fifteen (`robots-token-1`, `robots-group-1`, `robots-match-1`, the address ranges, and the port and userinfo checks) and the sixteenth (the heading bound of `html-text-1`) were added in v1.12 by an author with no shell, and v1.13 added one value, `OriviloReader1`, to the `robots-token-1` line; the reviewer re-check `ORV-133-review-code-3` ran lines eleven to sixteen, with the v1.13 value, on Node 22.23.0 with ICU 78.2 (2026-10-27), and every output matched the one shown (finding R1-5). The seventeenth and eighteenth lines (the normalisation of `robots-match-1` and its total bound) were added in v1.14 by an author with no shell; the main session ran both on Node 22.23.0 with ICU 78.2 (2026-10-27), and each printed the output shown (FU-9). v1.15 changed the eighteenth line to the total pattern cap and added a nineteenth, the literal `%2A` and `%24` of `robots-match-1`, by an author with no shell; the main session ran both on Node 22.23.0 with ICU 78.2 (2026-10-27), and each printed the output shown. v1.16 changed the nineteenth line, by an author with no shell, so that it matches a `%2A` or `%24` in the path too and adds the pair `Disallow: /a-%2A.html` and `https://example.com/a-%2A.html` (F22); the main session ran it on Node 22.23.0 with ICU 78.2 (2026-10-27), and it printed the output shown (recorded in v1.17). The robots.txt redirect, the depth bound, the Nesting count and the Path bound have no line, because each needs the tokenizer or a fake network; rows 6, 7 and 36 test them. The slice that ships a rule runs its line and its test again on the Node line slice 1b pins (open question "The Node line"), and a different output is a finding against this spec.

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

**`tsic-terms-1`** (section "Industry"). Thai name of `86202` copied from the ORV-127 spec ("Count") and K-0049; the English name is the ISIC Rev.4 name of class `8620` from K-0048, because no source in this repo holds TSIC's own English name for `86202`.

```sh
node -e 'const t=n=>n.replace(/^กิจกรรม/,"").replace(/^activities of\s+/i,"").trim();const th=t("กิจกรรมคลินิกโรคเฉพาะทาง");console.log(th, "คลินิกโรคเฉพาะทาง".includes(th), "กิจกรรม".includes(th), JSON.stringify(t("Medical and dental practice activities")))'
```

```text
คลินิกโรคเฉพาะทาง true false "Medical and dental practice activities"
```

The English name keeps its whole text, because "activities" ends it rather than leads it (open question on English match terms).

**`industry-level-1` roll-up** (section "Industry"). The longest common prefix cut to a TSIC level length (5, 4, 3 or 2 digits). Codes from row 14.

```sh
node -e 'const up=(a,b)=>{let n=0;while(n<5&&a[n]===b[n])n++;const L=[5,4,3,2].find(l=>l<=n);return L?a.slice(0,L):"section only"};console.log(up("86202","86201"), up("86202","86101"))'
```

```text
8620 86
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

**`html-text-1` whitespace, then `word-count-1`** (section "Page text"). The Thai text is copied from `packages/intent-engine/src/interpreter.test.ts` line 42, wrapped in the whitespace a page would carry; `html-text-1` folds it, and `word-count-1` counts the word-like segments.

```sh
node -e 'const t=(" \n  "+"อยากให้สนุก"+"  ").replace(/[\t\n\f\r ]+/g," ").trim();const w=[...new Intl.Segmenter("th",{granularity:"word"}).segment(t)].filter(s=>s.isWordLike).map(s=>s.segment);console.log(JSON.stringify(t), t.split(" ").length, w.length, w.join("/"))'
```

```text
"อยากให้สนุก" 1 3 อยาก/ให้/สนุก
```

The segment count comes from the ICU data of the Node build (3 on Node 22.23.0, ICU 78.2); if the pinned line splits the text differently, slice 1b records the output and the versions, and row 36 takes the recorded number.

**`html-text-1` decoding** (section "Page text"). The bytes are `<p>`, then E0 B8 AD, the UTF-8 of the first letter of the Thai text at `packages/intent-engine/src/interpreter.test.ts` line 42, then FF, an invalid sequence, then `</p>`. The global `TextDecoder` decodes them as UTF-8; the invalid byte becomes U+FFFD, printed below as the replacement character itself, and the decode does not throw.

```sh
node -e 'console.log(JSON.stringify(new TextDecoder().decode(new Uint8Array([0x3c,0x70,0x3e,0xe0,0xb8,0xad,0xff,0x3c,0x2f,0x70,0x3e]))))'
```

```text
"<p>อ�</p>"
```

No rounding applies: the output is text.

**`robots-token-1`** (section "Reading a page the person submits"). Values copied from review finding R2 (`OriviloReader/1`), row 6 (`oriviloreader`), security finding SEC-133-2 (`OriviloReader`) and the user agent `USER_AGENT` in `packages/intent-engine/src/read-page.ts` line 67 with `CONTACT_URL` from line 66; `Orivilo`, `OriviloReader-Bot` and `*` are the bounds; `OriviloReader1`, added in v1.13, is copied from the research report of task `ORV-133-research-robots-1` and shows the digits reading ("Hypotheses"). Columns: the value, its product token, whether it matches.

```sh
node -e 'const tok=v=>(v.trim().match(/^[A-Za-z0-9_-]+/)||[""])[0].toLowerCase();for(const v of ["OriviloReader/1","oriviloreader","OriviloReader","OriviloReader/1 (+https://github.com/Thawatchai-Petkaew/orivilo)","Orivilo","OriviloReader-Bot","*","OriviloReader1"])console.log(JSON.stringify(v),JSON.stringify(tok(v)),tok(v)==="oriviloreader")'
```

```text
"OriviloReader/1" "oriviloreader" true
"oriviloreader" "oriviloreader" true
"OriviloReader" "oriviloreader" true
"OriviloReader/1 (+https://github.com/Thawatchai-Petkaew/orivilo)" "oriviloreader" true
"Orivilo" "orivilo" false
"OriviloReader-Bot" "oriviloreader-bot" false
"*" "" false
"OriviloReader1" "oriviloreader1" false
```

No rounding applies: the output is text and booleans.

**`robots-group-1`** (section "Reading a page the person submits"). Files A and B copied from review finding R1 and security finding SEC-133-2, C from R2; D and E are the other two sides of the rule. Paths are matched as plain prefixes here, which these inputs need (`robots-match-1` has its own line); the longest match wins, an allow on a tie, and no match allows (the most-octets choice of `robots-match-1`, Matching). Columns: the file, the path, whether the page may be read.

```sh
node -e 'const tok=v=>(v.match(/^[A-Za-z0-9_-]+/)||[""])[0].toLowerCase();const parse=t=>{const g=[];let cur=null,inRules=false;for(const raw of t.split("\n")){const l=raw.replace(/#.*/,"").trim();const i=l.indexOf(":");if(i<0)continue;const k=l.slice(0,i).trim().toLowerCase(),v=l.slice(i+1).trim();if(k==="user-agent"){if(!cur||inRules){cur={agents:[],rules:[]};g.push(cur);inRules=false}cur.agents.push(v)}else if((k==="allow"||k==="disallow")&&cur){inRules=true;cur.rules.push([k,v])}}return g};const pick=g=>{const own=g.filter(x=>x.agents.some(a=>tok(a)==="oriviloreader"));return own.length?own:g.filter(x=>x.agents.includes("*"))};const allows=(t,p)=>{let best=null;for(const x of pick(parse(t)))for(const[k,v]of x.rules)if(v&&p.startsWith(v)&&(!best||v.length>best[1].length||(v.length===best[1].length&&k==="allow")))best=[k,v];return !best||best[0]==="allow"};for(const[n,t,p]of[["A","User-agent: oriviloreader\nDisallow: /\n\nUser-agent: *\nAllow: /public","/public"],["B","User-agent: OriviloReader\nDisallow: /\n\nUser-agent: *\nAllow: /about\n","/about"],["C","User-agent: OriviloReader/1\nDisallow: /","/x"],["D","User-agent: *\nDisallow: /private","/public"],["D","User-agent: *\nDisallow: /private","/private/a"],["E","User-agent: oriviloreader\nAllow: /\n\nUser-agent: *\nDisallow: /","/x"]])console.log(n,p,allows(t,p))'
```

```text
A /public false
B /about false
C /x false
D /public true
D /private/a false
E /x true
```

No rounding applies: the output is booleans.

**`robots-match-1`** (section "Reading a page the person submits"). The hostile pattern and path lengths are copied from security finding SEC-133-1 (`/` and `*a` 12 times and `b$`; a path of 38 `a`); the others are a plain prefix, an end anchor, and a pattern one character over the bound. `null` means the pattern is ignored. The last column says the hostile cases took under 100 ms in all, a wall-clock check, not a rule.

```sh
node -e 'const match=(pat,path)=>{if(pat.length>1000)return null;const end=pat.endsWith("$");const body=end?pat.slice(0,-1):pat;const parts=body.split("*");if(!path.startsWith(parts[0]))return false;let pos=parts[0].length;for(let i=1;i<parts.length;i++){const s=parts[i];if(end&&i===parts.length-1)return path.length-s.length>=pos&&path.endsWith(s);const j=path.indexOf(s,pos);if(j<0)return false;pos=j+s.length}return end?pos===path.length:true};const H="/"+"*a".repeat(12)+"b$";const t=Date.now();const r=[match("/private","/private/a"),match("/*.css$","/a/b.css"),match("/*.css$","/a/b.css?x"),match(H,"/"+"a".repeat(38)),match(H,"/"+"a".repeat(38)+"b"),match(H,"/"+"a".repeat(100000)),match("/"+"x".repeat(1000),"/"+"x".repeat(1000))];console.log(r.map(String).join(" "),Date.now()-t<100)'
```

```text
true true false false true false null true
```

No rounding applies: the output is booleans and `null`.

**`robots-match-1`, the normalisation of RFC 9309 section 2.2.2** (section "Reading a page the person submits"; added in v1.14, run by the main session on Node 22.23.0 with ICU 78.2). The Thai pattern and the `%70rivate` path are copied from security finding SEC-133-R1-3, and the URL's percent-encoded path is the one that finding observed; `/a%2fb%7e` shows a reserved character kept encoded (`%2f`, in upper case) and an unreserved one decoded (`%7e`). The first line is the normalised pattern; then whether the URL's path is already normal, whether it starts with the pattern, the `%70rivate` path normalised, and the bound case.

```sh
node -e 'const norm=s=>s.replace(/[^\x00-\x7f]+/g,c=>encodeURIComponent(c)).replace(/%([0-9A-Fa-f]{2})/g,(m,h)=>{const c=String.fromCharCode(parseInt(h,16));return /[A-Za-z0-9._~-]/.test(c)?c:"%"+h.toUpperCase()});const p=new URL("https://example.com/สินค้า").pathname;console.log(norm("/สินค้า"));console.log(p===norm(p),norm(p).startsWith(norm("/สินค้า")),norm(new URL("https://example.com/%70rivate").pathname),norm("/a%2fb%7e"))'
```

```text
/%E0%B8%AA%E0%B8%B4%E0%B8%99%E0%B8%84%E0%B9%89%E0%B8%B2
true true /private /a%2Fb~
```

So `Disallow: /สินค้า` covers `https://example.com/สินค้า` and `Disallow: /private` covers `https://example.com/%70rivate`. No rounding applies: the output is text and booleans.

**`robots-match-1`, the total bound** (section "Reading a page the person submits"; added in v1.14, changed in v1.15, run by the main session on Node 22.23.0 with ICU 78.2). The two caps copied from their homes: 100,000 pattern characters in all from `robots-match-1` (Caps), and 2,048 characters from the Address check, which caps the whole URL and so the path and query, a part of it. The output is the most steps one check of one path can make.

```sh
node -e 'const T=100000,P=2048;console.log(T*P)'
```

```text
204800000
```

The number is a ceiling, not a timing: row 6 measures the 500 KB file of 5,000 short patterns against a path of 2,000 characters, within 500 ms. No rounding applies: the product is a whole number below 2^53.

**`robots-match-1`, `%2A` and `%24` as literal characters** (section "Reading a page the person submits"; added in v1.15 and run by the main session on Node 22.23.0 with ICU 78.2; changed in v1.16 and run again by the main session on the same versions). The first two pairs of pattern and URL are RFC 9309 Figure 6 as K-0056 quotes it, with the host `example.com` of row 6 in place of `www.example.com`; the third is the pair of row 6 that finding F22 of the tech notes named. The WHATWG `URL` keeps a `*`, a `$` and a `%2A` in a path as written. The line walks the pattern from the path's first character: a pattern's `%2A` or `%24` matches the written `*` or `$`, or the three characters `%2A` or `%24`, in the path (the normalised path writes the hex digits in upper case); any other character matches itself. Columns: the URL's path, whether the pattern covers it, and whether the pattern holds a `*` wildcard.

```sh
node -e 'const lit={"%2A":"*","%24":"$"};const m=(pat,p)=>{let i=0,j=0;while(i<pat.length){const e=pat.slice(i,i+3);if(Object.hasOwn(lit,e)){if(p[j]===lit[e])j+=1;else if(p.startsWith(e,j))j+=3;else return false;i+=3}else if(pat[i]===p[j]){i++;j++}else return false}return true};for(const[pat,url]of[["/path/file-with-a-%2A.html","https://example.com/path/file-with-a-*.html"],["/path/foo-%24","https://example.com/path/foo-$"],["/a-%2A.html","https://example.com/a-%2A.html"]]){const p=new URL(url).pathname;console.log(p,m(pat,p),pat.includes("*"))}'
```

```text
/path/file-with-a-*.html true false
/path/foo-$ true false
/a-%2A.html true false
```

So `Disallow: /path/file-with-a-%2A.html` covers `https://example.com/path/file-with-a-*.html`, and `Disallow: /a-%2A.html` covers `https://example.com/a-%2A.html` (row 6). No rounding applies: the output is text and booleans.

**The address ranges added in v1.12** (section "Reading a page the person submits", Address check). IPv4 and IPv6 inputs copied from security finding SEC-133-6 (`240.0.0.1`, `198.18.0.1`, `192.0.0.170`, `fec0::1`, `::ffff:0:a00:5`); `198.19.255.255` and `feff::1` are the top of their ranges, `198.20.0.1` and `fe80::1` sit just outside them, and `8.8.8.8` is public. For IPv4 the column is the new range it falls in; for IPv6 the columns are whether it is in `fec0::/10` and the IPv4 an IPv4-translated address embeds.

```sh
node -e 'const v4=s=>s.split(".").reduce((a,x)=>a*256+Number(x),0);const inR=(ip,c)=>{const[b,l]=c.split("/");const m=2**(32-Number(l));return Math.floor(v4(ip)/m)===Math.floor(v4(b)/m)};const R=["240.0.0.0/4","198.18.0.0/15","192.0.0.0/24"];for(const ip of ["240.0.0.1","198.18.0.1","198.19.255.255","198.20.0.1","192.0.0.170","8.8.8.8"])console.log(ip,R.find(c=>inR(ip,c))||"none");const ex=s=>{const[a,b]=s.split("::");const A=a?a.split(":"):[],B=b?b.split(":"):[];return[...A,...Array(8-A.length-B.length).fill("0"),...B].map(h=>parseInt(h,16))};for(const s of ["::ffff:0:a00:5","::ffff:0:808:808","fec0::1","feff::1","fe80::1"]){const h=ex(s);const fec=(h[0]&0xffc0)===0xfec0;const tr=h.slice(0,4).every(x=>x===0)&&h[4]===0xffff&&h[5]===0;console.log(s,fec?"fec0::/10":"-",tr?[h[6]>>8,h[6]&255,h[7]>>8,h[7]&255].join("."):"-")}'
```

```text
240.0.0.1 240.0.0.0/4
198.18.0.1 198.18.0.0/15
198.19.255.255 198.18.0.0/15
198.20.0.1 none
192.0.0.170 192.0.0.0/24
8.8.8.8 none
::ffff:0:a00:5 - 10.0.0.5
::ffff:0:808:808 - 8.8.8.8
fec0::1 fec0::/10 -
feff::1 fec0::/10 -
fe80::1 - -
```

So `::ffff:0:a00:5` is refused as `10.0.0.5` and `::ffff:0:808:808` is judged public as `8.8.8.8`; `fe80::1` is refused by `fe80::/10`, not by this line. No rounding applies: the IPv4 arithmetic is on whole numbers below 2^32.

**The port and userinfo checks** (section "Reading a page the person submits", Address check). URLs copied from review finding R4 and security findings SEC-133-5 and SEC-133-7; `https://example.com:443/` and `http://example.com:443/` show that the default port is the scheme's own. The WHATWG `URL` drops a port equal to the scheme's default, so an empty `port` is the default. Columns: the URL, whether it carries a username or password, its port, the verdict.

```sh
node -e 'for(const s of ["http://user:secret@example.test/","https://alice:s3cret@example.com:6379/","https://example.com:6379/","https://example.com:443/","http://example.com:443/","http://example.com/"]){const u=new URL(s);const ui=u.username!==""||u.password!=="";console.log(s,ui,u.port===""?"default":u.port,ui||u.port!==""?"refused":"read")}'
```

```text
http://user:secret@example.test/ true default refused
https://alice:s3cret@example.com:6379/ true 6379 refused
https://example.com:6379/ false 6379 refused
https://example.com:443/ false default read
http://example.com:443/ false 443 refused
http://example.com/ false default read
```

No rounding applies: the output is text and booleans.

**The heading bound of `html-text-1`** (section "Page text"). The page is copied from security finding SEC-133-4: 40,000 headings of `heading text here` (17 characters). The cut is the one `page-text.ts` lines 123 to 133 make for body text, here with its own count. Columns: headings kept, characters kept, whether the bound was reached.

```sh
node -e 'const B=5000,t="heading text here";let used=0,full=false;const kept=[];for(let i=0;i<40000&&!full;i++){const room=B-used;if(t.length<=room){used+=t.length;kept.push(t);continue}full=true;const at=t.lastIndexOf(" ",room);const c=at<0?"":t.slice(0,at).trimEnd();if(c!==""){kept.push(c);used+=c.length}}console.log(kept.length,used,full)'
```

```text
294 4998 true
```

294 headings of 17 characters are 4,998; the 295th has 2 characters of room and no whitespace within them, so it is dropped. No rounding applies: the outputs are whole counts.

## Out of scope

- Any screen or upload UI (POC focus is function).
- Crawling, link following, reading more than the one submitted page, and every ORV-127 channel.
- Reading a competitor's page under D1 (a); the lawyer review in ORV-127 D2.
- A deployed route that renders a page (ADR 0019 decision 5 waits on its staging measurement).
- PDF and other document inputs; video; text recognition inside images by code.
- Comparing logo shapes or any trademark search.
- Persistence of evidence (E2-12) and sharing evidence across workspaces.
- Any change to ORV-20's `auditLineup`, `decideColor` or rules, or to ORV-127's record schema.
- Drafting options from evidence (ORV-126 D1 step 2 stories).

## Owner decisions (decided at G1)

The owner decided D1 to D7 at G1 (ORV-128 comment 10209, on the packet in comment 10208): D1 to D4 as recommended, and D5 to D7 follow the recommended options. A change after G1 bumps this spec's version.

**The orchestrator's adjustment under D3.** ORV-128 comment 10215 records it: the model-reading base of 0.7 (0.6 until v1.2) and rule `value-to-lean-1` are the orchestrator's, not the owner's, made under the owner's D3 so that the reason given for the floor holds ("Confidence", "What the numbers do at the floor"). The floor stays the owner's (D3). The owner confirms or overturns both at G2.

**ADR 0008 under D6 (a).** Written as the [ADR 0008](../../adr/0008-brief-interpreter-adapters.md) "Addition, 2026-10-26: a computed confidence number for input evidence". It is confirmed when slice 1a ships `confidence.ts` with the tests that Addition names.

**G2 design findings.** The tech notes (`docs/specs/ORV-128/tech.md`, "Findings for the spec") list F1 to F19 (F13 and F14 raised against v1.3, applied in v1.4; F15 to F17 raised against v1.5, applied in v1.6; F18 raised by re-check g2-2 finding N4 on 4329e9c, task `ORV-128-review-g2-2`, applied in v1.7; F19 raised against v1.7 by task `ORV-128-design-schema-6`, applied in v1.8). The orchestrator accepted all nineteen under the owner's delegation (ADR 0012 decision 4); the owner did not, and each stays open for the owner at G2. Where each lands in this spec:

<!-- prettier-ignore -->
| # | Accepted as | Where |
| --- | --- | --- |
| F1 | Slice 1 is three PRs, 1a, 1b and 1c, keeping every row (four since v1.5, with 1d; review g2-1 S8 below) | "Delivery"; the Slice column of the rows |
| F2 | Warm bands and thresholds for the measured leans | `measure-to-lean-1` in "Evidence first" |
| F3 | The id covers `analyser`, `source` without `retrievedAt`, `observation`, `measure.metric` and `reading.target`, and the renderer build within `source` (F10). `retrievedAt` is left out by the orchestrator; the owner may put it back | Field `id`; row 4; open question on `retrievedAt` |
| F4 | One question per conflict, chosen by target | `conflict-question-1`, case 1 |
| F5 | The rounding rule; `base` and factors as `{ id, value }`; `rules` on a rule reading; the locator kinds; the lineup label | `thousandths-1` and `industry-margin-1` in "Confidence"; fields `confidence`, `reading`, `source`; reading targets |
| F6 | Thai word count by segmenter | `word-count-1`, "Page text" |
| F7 | `detectConflicts` covers conflicts within one analyser too; the report says when conflicts are not checked | Case 1; slice 4; string `report.conflictsNotChecked`; row 17 |
| F8 | Name matching runs in the analyser | "Industry", Candidates; row 13 |
| F9 | Mood word typed as a slug until slice 3 narrows it | Reading targets; slice 3 |
| F10 | `source.renderer`, in the id; Determinism names the versions | Field `source`; "Rules and bounds", Determinism; rows 2 and 35 |
| F11 | The page text always comes from the bytes | `html-text-1`, "Page text"; rows 9 and 36 |
| F12 | The "not measured" strings | "Strings"; row 34 |
| F13 | The Node version is not pinned yet; the worked examples state the version they ran on | `word-count-1`, "Page text"; "Worked examples"; open question "The Node line" |
| F14 | ADR 0019's POC part is accepted by the PR carrying rows 34, 35 and 37: since v1.5 that is slice 1d, `packages/page-reader` as its own PR right after 1c (ADR 0019 Status; review g2-1 S8) | "Where it runs"; "Delivery", row 1d; open question on slice 1c's size |
| F15 | The address check names the unspecified address, the IPv6 ranges refused outright, and the ranges that embed an IPv4 address and are judged by it; zone ids and unparsable literals are refused (review g2-1 I5) | "Reading a page the person submits", Address check; row 5 |
| F16 | Row 36's `noscript` holds a `p`, so the case fails if the tokenizer reads `noscript` with scripting on (review g2-1 S3) | Row 36 |
| F17 | The ninth worked example was run and matched | "Worked examples", opening paragraph |
| F18 | Base `model-reading` covers every item with `fromModel` true, a model observation with no reading (an `asset-shown` item) included; base `measure` needs `fromModel` false, as tech notes §2 clause 5 checks (re-check g2-2 N4) | "Confidence", the bases' "When" cells |
| F19 | The 1d PR also adds the engine's `report.ts` with `reportSchema` (tech notes §7, "The report schema"), which rows 17 and 38 parse the JSON with; a refused read has no member in it yet | "Delivery", row 1d; rows 17 and 38; open question "A report for a refused read" |

**Review g2-1 findings** (on a36ef5d). Six land in this spec, applied in v1.5. The orchestrator decided each under the owner's delegation (ADR 0012 decision 4); each stays open for the owner at G2.

<!-- prettier-ignore -->
| # | Accepted as | Where |
| --- | --- | --- |
| I2 | D1 (a) gets an enforcement point: the URL analyser and the command never read a competitor URL | Rule `competitor-not-read-1` in "Another brand's page"; string `read.notRead.competitor`; analyser 1 "Feeds"; the command line; row 38 |
| I4 | The `hypothesis` field has one definition the schema can check | Rule `hypothesis-flag-1` in "Evidence first"; its members in "Hypotheses"; rows 2 and 10; "Worked examples" |
| I6 | The Gap list names findings F1 to F14 | "Gap list", Technical |
| S1 | "Delivery" points to tech notes §12 without copying its total | "Delivery" |
| S5 | The closed list of rule ids a reading may name | `RULE_IDS` in "Evidence first" |
| S8 | `packages/page-reader` is its own PR, slice 1d, right after 1c; ADR 0019's POC part is accepted when 1d merges | "Delivery", rows 1c and 1d; rows 34, 35, 37 and 38; open question on slice 1c's size; "Gap list" |

**Slice 1b review round 0** (PR 130 at e21b10a; reviewer task `ORV-133-review-code-2`, R1 to R8; security task `ORV-133-security-2`, SEC-133-1 to SEC-133-7). The orchestrator decided each under the owner's delegation (ADR 0012 decision 4), recorded per L-0013 as a contract change, no contract change, or the id it repeats; applied in v1.12, each open for the owner.

<!-- prettier-ignore -->
| # | Recorded as | Where |
| --- | --- | --- |
| R1 | Contract change: only the groups naming the product token apply; `*` only when none does | Rule `robots-group-1`; row 6 |
| R2 | Contract change: a `user-agent` value is matched on its product token | Rule `robots-token-1`; row 6 |
| R3 | Contract change: a robots.txt redirect is followed under the redirect bound and the Address check, and the file it lands on is parsed | robots.txt, Answers; row 6 |
| R4 | Contract change: a URL with a username or password is refused on every request | Address check; Logged out; rows 5 and 7 |
| R5 | No contract change: a test per clause of `html-text-1` and `word-count-1` and a report for them | The slice 1b fix (tech notes §14) |
| R6 | No contract change: a code comment | `page-text.ts` |
| R7 | Repeats SEC-133-6 | As SEC-133-6 |
| R8 | No contract change: a break-it line | Tech notes §14 row 5 |
| SEC-133-1 | Contract change: robots.txt patterns match in linear time without a regular expression; a pattern over 1,000 characters is ignored | Rule `robots-match-1`; row 6; "Hypotheses" |
| SEC-133-2 | Repeats R1 | As R1 |
| SEC-133-3 | Contract change: the depth bound, and the read always returns its result | Depth bound; `html-text-1`, Depth; `page-incomplete` in "Confidence"; rows 7 and 36; "Hypotheses" |
| SEC-133-4 | Contract change: heading text has a bound of its own | `html-text-1`, Heading bound; `page-incomplete` in "Confidence"; row 36; "Hypotheses" |
| SEC-133-5 | Repeats R4 | As R4 |
| SEC-133-6 | Contract change: four more ranges refused and IPv4-translated addresses judged by their IPv4 | Address check; row 5 |
| SEC-133-7 | Contract change: only the default ports 80 and 443, each for its own scheme | Address check; row 5 |

**RFC 9309 check** (research task `ORV-133-research-robots-1`, which quotes the sections in K-0056 at 0.8; four points). The orchestrator decided each under the owner's delegation (ADR 0012 decision 4), recorded per L-0013; applied in v1.13, each open for the owner.

<!-- prettier-ignore -->
| # | Recorded as | Where |
| --- | --- | --- |
| RFC-1 | No contract change: `robots-token-1` keeps digits in the token run, recorded as a hypothesis-grade reading of section 2.2 | `robots-token-1`; "Hypotheses"; "Worked examples", `robots-token-1` |
| RFC-2 | No contract change: the robots.txt redirect bound stays below section 2.3.1.2's at least five, and fails closed | "Hypotheses" |
| RFC-3 | Contract change: the rules of a robots.txt reached through a redirect apply in the context of the initial authority (section 2.3.1.2) | robots.txt, Answers; row 6 for review |
| RFC-4 | No change: a 5xx or no answer is complete disallow, as section 2.3.1.4 requires | robots.txt, Answers |

**Slice 1b review round 1** (PR 130 at c37f0c8; reviewer task `ORV-133-review-code-3`, R5 still open and R1-1 to R1-5; security task `ORV-133-security-3`, SEC-133-R1-1 to SEC-133-R1-5). The orchestrator decided each under the owner's delegation (ADR 0012 decision 4), recorded per L-0013 as a contract change, no contract change, or the id it repeats; applied in v1.14, each open for the owner.

<!-- prettier-ignore -->
| # | Recorded as | Where |
| --- | --- | --- |
| R5 | No contract change: the fix report carries one L-0042 row per clause of `html-text-1` and `word-count-1`, each naming its mutant and the test that goes red, and records two equivalent mutants with the reasons the round 0 review gave: dropping the `template` skip (`parse5` keeps a template's contents in `.content`, not in its child nodes) and the segmenter locale `th` changed to `en` (ICU 78.2's word break has no Thai tailoring) | The slice 1b fix report (tech notes §14 row 36) |
| R1-1 | Contract change: a block whose path would pass the 500-character locator bound gives no block, the page text carries `page-incomplete`, and the path is not built past the bound | `html-text-1`, Path bound; `page-incomplete` in "Confidence"; row 36; "Hypotheses" |
| R1-2 | Repeats SEC-133-R1-2 | As SEC-133-R1-2 |
| R1-3 | Repeats SEC-133-R1-5 | As SEC-133-R1-5 |
| R1-4 | Contract change: a robots.txt 3xx with no `Location` header is no answer, complete disallow | robots.txt, Answers |
| R1-5 | No contract change: the reviewer re-check ran the six v1.12 lines and the v1.13 value, and every output matched | "Worked examples", opening paragraph |
| SEC-133-R1-1 | Contract change: the Address check refuses a path and query over 2,048 characters, a robots.txt of more than 5,000 Allow or Disallow rules is complete disallow, and `robots-match-1` states its total bound | Address check; `robots-match-1`; row 6; "Hypotheses"; "Worked examples" |
| SEC-133-R1-2 | Contract change: the Nesting pre-pass bounds the parse before the tree is built (replaced in v1.16 by the Nesting count, F20) | Depth bound; `html-text-1`, Depth; `page-incomplete` in "Confidence"; rows 7 and 36; "Hypotheses" |
| SEC-133-R1-3 | Contract change: `robots-match-1` normalises path and pattern as RFC 9309 section 2.2.2 states | `robots-match-1`; row 6; "Worked examples" |
| SEC-133-R1-4 | Repeats R1-1 | As R1-1 |
| SEC-133-R1-5 | Contract change: a port that rejects counts as no answer to the request it served, and the result carries none of its message | Depth bound, The result; row 7 |

**Slice 1b review round 1, follow-ups** (the open points of task `ORV-133-product-parent-6`, which wrote v1.14, and of research tasks `ORV-133-research-rfc-222-1` and `ORV-133-research-rfc-3986-1`, which added two subsections to K-0056, and `ORV-133-research-whatwg-lists-1`, which wrote K-0083; nine points, FU-1 to FU-9). The orchestrator decided each under the owner's delegation (ADR 0012 decision 4), recorded per L-0013 as a contract change, no contract change, or a reading; applied in v1.15, each open for the owner.

<!-- prettier-ignore -->
| # | Recorded as | Where |
| --- | --- | --- |
| FU-1 | Contract change: the Address check refuses a URL whose whole `href` is longer than 2,048 characters, the evidence schema's bound on `source.ref`, in place of the v1.14 bound on the path and query, so no accepted URL fails the schema; the total bound keeps 2,048 as the path ceiling, since a path is shorter than its URL | Address check; `robots-match-1`, Caps; row 6 (the URL of 2,049 characters; the 500 KB timing case on a path of 2,000 characters); "Hypotheses"; "Worked examples", the total bound |
| FU-2 | Contract change: a lookup that gives no address, or a `resolve` that rejects, for the submitted URL's host or the host of a redirect target of the page, fails the read with reason `network` before robots.txt is requested of that host, so `read.refused.robots` is never shown for a host that does not exist (iron rule 4); a robots.txt redirect target that does not resolve stays no answer under Answers, and a stylesheet host that does not resolve stays a failed stylesheet under Bounded | Depth bound, The result; robots.txt (the order); row 7 |
| FU-3 | No contract change: an over-long URL gets `read.refused.address` ("We can read only public web addresses."), which does not say why; no new string in the POC | Address check; "Strings" |
| FU-4 | Contract change: a robots.txt answer is at most 500 KiB, and a longer one is complete disallow, failing closed, where the slice 1b build cut it and parsed the head | Bounded; Answers; row 6 (the file of 500 KiB plus one byte); "Hypotheses" |
| FU-5 | Contract change: the patterns of all Allow and Disallow rules in the file hold at most 100,000 characters, counted after normalisation, and past that the file is complete disallow; the step ceiling becomes total pattern characters times path length. Row 6 also gains a file of 101 patterns of 1,000 characters, added by the spec's author so the cap has a test | `robots-match-1`, Caps; row 6; "Hypotheses"; "Worked examples", the total bound |
| FU-6 | Contract change: `robots-match-1` states, from RFC 9309 sections 2.2.2 and 2.2.3 (K-0056), that the most specific match (most octets) is used, an allow and a disallow of equal length give allow, and `%2A` or `%24` in a pattern matches a literal `*` or `$` (Figure 6) | `robots-match-1`, Matching; row 6 (the `%2A` pattern); "Worked examples", `robots-group-1` (now points to the rule) and the `%2A` line |
| FU-7 | A reading: the hex digits compared case-insensitively and the decoding on the pattern side rest on RFC 3986 sections 2.1, 2.3 and 6.2.2 for URIs, where RFC 9309 section 2.2.2 says SHOULD be case sensitive and names the URI side only; reserved characters left as written, where section 2.2.2 says MUST be encoded, read from Figure 4 row 1 | `robots-match-1`, Normalisation; "Hypotheses" (the readings of RFC 9309) |
| FU-8 | No contract change: the Nesting pre-pass cites K-0083 for its three lists, and `noscript` stays out of the text list because `html-text-1` parses with scripting off. A reading: the 19 elements whose end tag is optional never open a level, open for `security` to probe. No longer applies since v1.16: the Nesting count needs no list (F20) | Depth bound; "Hypotheses"; "Depends on" |
| FU-9 | No contract change: the main session ran the two v1.14 lines on Node 22.23.0 with ICU 78.2 (2026-10-27) and both matched; the changed total-bound line and the new `%2A` line are not run | "Worked examples", opening paragraph and the line labels |

**Slice 1b review round 1, tech notes findings** (findings F20, F21 and F22 of the tech notes, "Findings for the spec", raised against v1.15 by task `ORV-133-design-tech-r1-1`, and the timing point on row 6 that task raised, applied in v1.16; finding F23, "Findings against spec v1.16", raised by task `ORV-133-design-tech-r1-2`, applied in v1.17). The orchestrator decided each under the owner's delegation (ADR 0012 decision 4), recorded per L-0013 as a contract change or no change, each open for the owner.

<!-- prettier-ignore -->
| # | Recorded as | Where |
| --- | --- | --- |
| F20 | Contract change: the Nesting count replaces the Nesting pre-pass. The tree builder's own stack of open elements is counted while the tree is built, through `parse5`'s tree adapter hooks `onItemPush` and `onItemPop` (K-0082); at the push that would make it 513 deep the parse stops, only the text before that element's start tag is parsed again, and the read carries `page-incomplete`. The three element lists (void, optional end tag, text) leave the rule, because the count is the tree builder's own and needs no list; K-0083 stays cited as the record of why a token pre-pass was dropped. Reason: the tech notes measured that a token pass misses the nesting after `<body><style><!--</style>` (a tokenizer in its data state reads the rest as a comment, while the tree builder reads `style` as raw text) and inside `<body><svg><style>` with nested `g` elements (foreign content); `parse5.parse` took 1.1 s on 20,000 nested `div` elements and 5.1 s on 20,000 nested `g` elements, while the stack count cut every 2 MB hostile shape in 2 to 14 ms. The stop moved to the push that would make the stack 129 deep in v1.17 (F23) | Depth bound, Nesting count; `html-text-1`, Depth; `page-incomplete` in "Confidence"; rows 7 and 36 (the two prefixes followed by 2 MB of nesting, each within 2 s with `page-incomplete`); "Hypotheses" (the Nesting count; the optional-end-tag reading of FU-8 no longer applies); "Depends on" |
| F21 | Contract change: the rules cap counts every line whose key is `allow` or `disallow`, in a group or before the first group, an ignored pattern and an empty value included, so the cap counts the file rather than what the parser keeps | `robots-match-1`, Caps |
| F22 | Contract change: a `%2A` or `%24` in a pattern matches the literal character or its percent-encoding `%2A` or `%24` in the path, so `Disallow: /a-%2A.html` covers `https://example.com/a-%2A.html`, which v1.15 read (failing open). A reading of RFC 9309 Figure 6 and RFC 3986 section 2.2 | `robots-match-1`, Matching; row 6 (`Disallow: /a-%2A.html`); "Hypotheses" (the readings of RFC 9309); "Worked examples", the `%2A` line (changed, not run; the main session runs it) |
| Row 6 timing | Contract change: the 500 KB file of 5,000 rules returns within 500 ms instead of 100 ms. Reason: the tech notes measured about 30 ms with the designed matcher and about 73 ms with the slowest plausible one (`String.prototype.indexOf`) on Node 22.23.0 on this machine, and a CI runner may be slower; the `security` re-check may tighten the bound with a measurement on CI | Row 6; "Worked examples", the total bound |
| F23 | Contract change: the depth bound falls from 512 to 128 elements, `html` counting 1, for both parts of the Depth bound: the Nesting count stops at the push that would make the stack 129 deep, and the walk goes to a depth of 128. Rows 7 and 36 gain the held-depth document, `<body>`, 125 nested `div` elements and `</p>` repeated to 2 MB, read within 2 s with nothing cut; its stack holds `html`, `body`, the 125 `div` and, at each `</p>`, the `p` the tree builder adds and closes (K-0082 section 6), 128 elements at most. Reason: the Nesting count bounds the stack, not the work per token. A 2 MB document of `<body>`, nested `div` just under the bound and a repeated end tag the tree builder checks against the whole stack is never cut; the tech notes measured 1.6 to 1.7 s at 509 nested `div` (three runs), about 0.87 s at 254 and about 0.5 s at 126, on Node 22.23.0 (arm64) with `parse5` 8.0.1, where rows 7 and 36 allow 2 s on a CI runner that may be slower. At 128 the cost stays near a quarter of the 2 s bound. The slice fixtures may show real pages that nest deeper than 128 elements; each then carries `page-incomplete`, and a change to the bound is a new version of this spec | Depth bound, Nesting count and The walk; rows 7 and 36 (the held-depth document); "Hypotheses" (the v1.12 bounds) |

ADR 0019 (proposed) decides where the reader and the renderer run, the must-ask the Gap list left for G2 ("Reading a page the person submits", "Where it runs").

<!-- prettier-ignore -->
| # | Question | Options | Decided | Impact |
| --- | --- | --- | --- | --- |
| D1 | Read a single page the person submits before the ORV-127 lawyer review? | (a) yes for the person's own brand and for references; a competitor URL is recorded as text and waits for the review; (b) yes for every role, competitors included; (c) no page read until the review | (a): the person asks for one page at a time, and competitor reading is ORV-127's user channel, which you sent to the lawyer; you carry the remaining risk for single pages | Slices 1b to 1d can ship; rows 21 and 38 (`competitor-not-read-1`); under (c) slices 1b to 3 read recorded fixtures only and the live acceptance run waits |
| D2 | Which analysers in the first slice, and with a model? | (a) evidence schema plus the URL analyser with code measures and rule-based readings, no model; (b) the same plus model readings; (c) schema plus the brief text analyser | (a): it proves the shared shape and the measures offline, and keeps the first model call in a slice with its eval set and `security` review | Slice order in "Delivery"; the acceptance test passes at slice 3 |
| D3 | The confidence floor below which the graph treats evidence as absent | 0.3, 0.5 or 0.6 | 0.5 (owner). The reason, at the base of 0.7, is worked in "Confidence" ("What the numbers do at the floor") and in "Worked examples". The base is the orchestrator's adjustment (comment 10215), open for the owner at G2 | Rows 3, 12, 18, 22, 24, 32 |
| D4 | Show readings to the person, with the from-model label? | (a) show every reading with its label, model id, evidence and confidence, as a suggestion to confirm, once its job's eval set has passed; (b) show code measures only and hide model readings; (c) show nothing until confirmed | (a): honest about what AI read and lets the person correct it (ADR 0015 decision 3, LLM07:2026) | Row 18; the strings; a later screen |
| D5 | Image input size and format limits | (a) ADR 0009 point 5 (PNG, JPEG, WebP by magic bytes, 4 MB, long edge 1568 px, EXIF stripped), at most 10 images per analysis, full confidence from a 512 px short edge; (b) also HEIC and PDF pages; (c) 2 MB and 5 images | (a): it reuses the bounds the model calls already need | Rows 26 and 28 |
| D6 | A computed confidence against ADR 0008's "no confidence score" | (a) a number computed by code from a base and named factors, with an addition to ADR 0008 by the architect at G2; (b) levels only (`measured`, `supported`, `weak`), no number | (a): the method is in the trace and the owner asked for a floor. Recorded in the ADR 0008 Addition of 2026-10-26 | The schema, rows 3 and 12, ADR 0008 |
| D7 | Lane | L or M | L: a new contract every node reads, outside reads and model calls | G1 and G2 under ADR 0012 decision 4 |

## Gap list

- **Business:** closed by ORV-126 comment 10202 and ORV-128 (input kinds, evidence shape, six cases, acceptance test).
- **Functional:** specified above. Assumed: `mood-1` contents (drafted in slice 3, reviewed by the designer and the owner), the copy above.
- **Technical:** closed at G2 by the orchestrator, open for the owner: the renderer and fetcher placement (ADR 0019, proposed); the ADR 0008 Addition of 2026-10-26; findings F1 to F19; the review g2-1 findings that land here (I2, I4, I6, S1, S5, S8). Still open, each with a default under "Open questions": the HTML tokenizer's research entry (slice 1b); a TypeScript runner for the command (slice 1d); the Vercel staging measurement (ADR 0019 decision 5); the tool-default list's pinned sources and versions (slice 6).
- **UX:** not applicable in the POC; strings drafted for review.
- **Data and security:** assumed: nothing persisted; the address check, robots.txt and renderer rules above; `security` reviews slices 1b, 1c, 1d, 3, 5, 6 and 7 (outside reads, new dependencies, model calls, uploads). `.claude/rules/security.md` does not yet list `packages/page-reader/**` (ADR 0019 Consequences, a follow-up for the rule owner).
- **Risk:** single-page reads carry legal exposure the owner accepts under D1 (a); readings rest on hypothesis-grade rules; model readings may be wrong and are labelled; the command and a later route may measure a page slightly differently, and each item names its build.

## Open questions (with the default used until answered)

- **The reader's contact URL.** Default: a page on the ORIVILO domain that the release story publishes, describing the reader and how to opt out; until it exists the user agent carries the repository URL.
- **Images on a read page.** Default: not fetched, so colour measures cover what CSS paints and say so; revisit when the lawyer review lands.
- **The Vercel route's renderer.** Default: option D until ADR 0019's staging measurement is recorded there; the measurement records the Vercel plan and whether fluid compute is on (K-0081).
- **The HTML tokenizer.** Default: `parse5`, pinned exactly in the engine, once a research entry records its licence, version and dependencies (ADR 0019 decision 6); slice 1b waits on it.
- **A TypeScript runner for the command.** Default: chosen at slice 1d with a research entry and a `security` review, or the engine's import style changes (ADR 0019 Consequences).
- **A report for a refused read.** `reportSchema` (tech notes §7, "The report schema") has two members, `not-read` and `analysed`, and none yet for a refused or failed read (finding F19). Default until slice 1d: a third member `refused`, carrying the refusal key (`read.refused.robots` or `read.refused.address`, the strings of rows 5 and 6) and the printed line, so `--json` always writes a report; the slice 1d spec designs it, its fields, its exit code and whether a failed read uses it. Tech notes §7 ("What it does not hold") names this default; the slice 1d spec decides the member's fields, the exit code for a refused read and whether a failed read (row 7) uses it.
- **Slice 1c's size.** Decided at G2 by the orchestrator under ADR 0012 decision 4, open for the owner (review g2-1 S8): `packages/page-reader` is its own PR, slice 1d, right after 1c. 1c is the engine part; 1d carries the network ports, the local renderer, the command, row 34's budget test, the renderer tests of rows 35 and 37, and the command half of row 38. ADR 0019's POC part is accepted when 1d merges into `develop`, not when 1c does (ADR 0019 Status; finding F14). If the owner wants one PR instead, 1c is accepted at the size tech notes §12 estimates for both, and 1d disappears (a version bump).
- **The Node line.** Default: slice 1b pins one Node line in both `engines` and `.nvmrc`, and its G3 packet records `process.versions.node` and `process.versions.icu` beside row 36's count (finding F13). The worked examples were run on Node 22.23.0 with ICU 78.2. The later Vercel route runs Node 24.x (ADR 0019 decision 5, K-0081), whose ICU may segment Thai differently, so that route's slice re-runs the `word-count-1` line and row 36 there and decides whether it may run another Node line; if it does, its `word-count` items may differ as rendered items do across builds.
- **`retrievedAt` in the id.** Default: left out (F3, the orchestrator's call), so a re-read of unchanged bytes keeps its ids. If the owner puts it back at G2, row 4's later-clock case expects new ids.
- **English match terms.** Default: `tsic-terms-1` unchanged. ISIC-style English names end with "activities" rather than start with "activities of" ("Worked examples"), so English names are matched whole until slice 2 checks the module's English names against a fixture page.
- **Whether the TSIC reading also feeds `lineupFor` automatically.** Default: no; the person confirms the code first.

## Depends on

- [ORV-126 spec](../ORV-126/spec.md) v1.4: the three layers, the node graph, the `evidence` field on node records, the propagation rule, decision D1 (nothing filled without the person) and D6 (the five axes, hypothesis).
- [ORV-127 spec](../ORV-127/spec.md) v1.2: the TSIC 2009 module (slice 1) and its Thai and English names, `isBrandRelevant`, collection rules R6 to R13 (R12, the user channel, for another brand's page), decisions D2 and D3, comment 10201.
- ORV-20 (PR 112): the hue bands, `auditLineup` and `decideColor`, which return questions when input is missing.
- ORV-128 comments 10209 (G1 decisions) and 10215 (the orchestrator's adjustment under D3).
- [Tech notes](tech.md): the G2 design for slice 1, findings F1 to F19; findings F20 to F22 and the row 6 timing point, raised against v1.15, and finding F23, raised against v1.16 ("Owner decisions", Slice 1b review round 1, tech notes findings).
- [ADR 0008](../../adr/0008-brief-interpreter-adapters.md) (adapters, evidence spans, `lexicon-1`) and its Addition of 2026-10-26 (a computed confidence number for input evidence); [ADR 0009](../../adr/0009-ai-through-openrouter.md) (jobs `interpret` and `see`, image bounds, no fallback, recorded tests); [ADR 0015](../../adr/0015-standards-and-required-controls.md) (AI controls, rate limits, uploads, dependency review); [ADR 0019](../../adr/0019-page-renderer-placement.md) (proposed: `packages/page-reader`, the renderer never fetches, local Playwright in the POC, option D everywhere as the fallback, the Vercel route behind a staging measurement, the tokenizer in the engine); ADR 0007 (fingerprint); ADR 0012 (gates, decision 4 for the delegated G2); [ADR 0018](../../adr/0018-image-generation-provider.md) (no image is generated here; listed because `see` and the image jobs share the Google model host).
- ORV-112 (rate limit helper).
- Knowledge: K-0026, K-0027 and K-0021 (architecture); K-0081 (platform: a headless Chromium in a Vercel function); K-0082 (platform: `parse5`, the pinned tokenizer, whose tree adapter hooks the Nesting count uses; its section 6 records both hooks and their call sites); K-0028, K-0036, K-0038, K-0039, K-0040 and K-0070 (brand); K-0048, K-0049, K-0053, K-0054 and K-0056 (market); K-0083 (standards).
- `docs/context/orivilo-brief.md` (starting assets vary; collect before generating).
- The WHATWG HTML standard: its list of void elements, its list of elements whose end tag is optional, and the elements its parser reads as text, as K-0083 (0.8) quotes them. No rule names these lists since v1.16; K-0083 stays cited as the record of why the token pre-pass of v1.14 and v1.15 was dropped for the Nesting count ("Reading a page the person submits", Depth bound; F20).

## Downstream review if this spec changes

- ORV-126 spec: its inventory gains proposed facts from evidence and a `tsic` fact on `situation`; its open question on how the TSIC section reaches `touchpoints` gets layer 1 as a proposer; its node record's `evidence` list holds input evidence as one member of a union (tech notes §11).
- ORV-127 spec: the single-page read under D1 is stated beside its channels; no rule of ORV-127 changes.
- ADR 0008 Addition of 2026-10-26: must keep the same bases, factors and rounding as "Confidence".
- ADR 0009: `see` gains its first use; its eval set lands in slice 3.
- ADR 0019: its Status names slice 1d as the PR that accepts the POC part, and its Confirmation line names the tests of rows 34, 35 and 37.
- Tech notes: must follow the id, the strings and the rows of this spec.
- `.claude/rules/security.md`: rule 10 (uploads) applies to slices 5 to 7; the `packages/page-reader/**` path is a follow-up.

## Changelog

- v1 (2026-10-26): first spec. Evidence schema, five analysers, six cases, the owner's acceptance test, the single-page read and how it differs from ORV-127's bulk reading, the confidence method, the feed into the ORV-126 graph and the ORV-20 colour node, seven slices, rows 1 to 31, owner decisions D1 to D7.
- v1.1 (2026-10-26): G1 decisions recorded as decided (ORV-128 comment 10209): D1 (a), D2 (a), D3 0.5, D4 (a), D5 (a), D6 (a), D7 L; the decisions column reads Decided; the ADR 0008 addition for a computed confidence number is decided at G2 by the ds-architect. No row, rule or slice changes. Review: none downstream beyond ADR 0008 at G2.
- v1.2 (2026-10-26): reviewer findings F1 to F8 on PR 118. F1: the model-reading base rises from 0.6 to 0.7 (the orchestrator's adjustment under the owner's D3, floor kept at 0.5, open for the owner at G2); the D3 reason states the real arithmetic; rows 3, 18 and 22 take the new numbers; new row 32 (one mild factor stays, two fall). F2: rule `tsic-terms-1` turns TSIC names into match terms, a curated term list per code is a later slice; row 13 follows it. F3: one industry conflict rule, only pairs within the 0.1 margin ask, in case 1 and "Industry"; new row 33. F4: rule `value-to-lean-1` maps every `lexicon-1` value to a lean, 40 to `low` as a hypothesis; row 10 adds "not too premium". F5: reading a reference brand's page is the same user-named read as ORV-127 R12, and D1 (a) accepts that risk for references while competitor URLs wait. F6: `hypothesisNote` gets its own schema row; row 2 adds its failure. F7: ORV-127 cited at v1.2. F8: row 27's default list is fixture values until G2 pins it; the list joins Hypotheses. Review: builders of slices 1, 2, 3, 4 and 6 (rows 2, 3, 10, 13, 18, 22, 27, 32, 33); ADR 0008 addition at G2 (the bases it describes); the owner at G2 for the base adjustment.
- v1.3 (2026-10-27): G2 design findings F1 to F12 of the tech notes, accepted by the orchestrator under ADR 0012 decision 4 and open for the owner at G2 ("Owner decisions" lists where each lands). F1: slice 1 becomes 1a, 1b and 1c, rows keep their numbers. F2: `measure-to-lean-1` gets its warm bands and thresholds. F3: the id covers `analyser`, `source` without `retrievedAt`, `observation`, `measure.metric` and `reading.target`; row 4 adds a later clock. F4: `conflict-question-1` in case 1. F5: rules `thousandths-1` and `industry-margin-1` in "Confidence"; `{ id, value }` base and factors, `rules`, locator kinds, lineup label. F6 and F11: new section "Page text" with `html-text-1` and `word-count-1`; rows 9 and 36. F7: conflicts within one analyser in slice 4, string `report.conflictsNotChecked`. F8: name matching in the analyser; row 13. F9: mood word as a slug until slice 3. F10: `source.renderer` in the id, Determinism names the versions; rows 2 and 35. F12: the "not measured" strings; row 34. ADR 0019 (proposed) recorded in "Reading a page" ("Where it runs"), "Open questions" and "Depends on"; new row 37 for the renderer that never fetches. ADR 0008 Addition of 2026-10-26 cited for D6; comment 10215 cited as the record of the base adjustment and of `value-to-lean-1`. One home per rule: other sections point to `thousandths-1`, `industry-margin-1`, `industry-level-1`, `conflict-question-1`, `tsic-terms-1`, `value-to-lean-1`, `measure-to-lean-1`, `html-text-1` and `word-count-1` by name; the Hypotheses list and the D3 reason no longer restate numbers. New string `industry.byNameOnly` for the existing name-only note. New section "Worked examples". New open questions: tokenizer, TypeScript runner, slice 1c size, `retrievedAt` in the id, English match terms. Review: the tech notes (§3 `evidenceId` still hashes `retrievedAt`; §9 and §12 against the strings, rows 34 to 37 and 1c's size); ADR 0019's Confirmation line (rows 34, 35, 37); ADR 0008 Addition (rule names); builders of slices 1a, 1b, 1c, 2, 3 and 4 (rows 1 to 14, 17, 29, 30, 32, 34 to 37); the designer and the owner for the new strings; `security` for 1b and 1c; the owner at G2 for F1 to F12, the base and `value-to-lean-1`.
- v1.4 (2026-10-27): G2 design findings F13 and F14 of the tech notes, raised against v1.3. F13: `word-count-1` no longer claims the Node version is pinned (`engines` is `>=22`, `.nvmrc` holds `22`); "Worked examples" says the main session ran all eight lines on Node 22.23.0 with ICU 78.2 and every output matched; new open question "The Node line": slice 1b pins one Node line in `engines` and `.nvmrc` and records the Node and ICU versions beside row 36, and the later Vercel route on Node 24.x re-runs the `word-count-1` line and row 36. F14: "Where it runs" and the open question on slice 1c's size say that ADR 0019's POC part is accepted by the PR carrying rows 34, 35 and 37 (slice 1c, or the `packages/page-reader` PR split right after it), citing ADR 0019 Status. "Owner decisions" lists F13 and F14. No row number, rule, slice or decision changes. Review: the tech notes (F13 and F14 marked applied in "Findings for the spec"; §12 against the 1c split); the slice 1b builder (pin the Node line in `engines` and `.nvmrc`, record the versions beside row 36 in the G3 packet); the slice 1c builder and ADR 0019's Confirmation line (which PR carries rows 34, 35 and 37); the later Vercel route's slice (re-run under Node 24.x); the owner at G2 for F13 and F14.
- v1.5 (2026-10-27): review g2-1 findings that land in the spec (on a36ef5d), each decided by the orchestrator under ADR 0012 decision 4 and open for the owner at G2 ("Owner decisions" lists where each lands). I2: new rule `competitor-not-read-1` in "Another brand's page" enforces D1 (a) in the URL analyser and the command; new string `read.notRead.competitor`; analyser 1 "Feeds" no longer offers a lineup candidate for `competitor`; new row 38. I4: the `hypothesis` field is set by new rule `hypothesis-flag-1`, whose members are the rule hypotheses listed under "Hypotheses" (`measure-to-lean-1`, `tsic-terms-1`, `value-to-lean-1` at 40), never the shared confidence table; row 2 adds a `measure-to-lean-1` reading with `hypothesis: false`; row 10 asserts `false` for the first two readings; a ninth worked example, not run. I6: the Gap list says F1 to F14. S1: "Delivery" points to tech notes §12 without its total. S5: the closed list `RULE_IDS` holds four ids at schema 1.0 and grows by a minor schema version with each slice that adds a rule. S8: `packages/page-reader` is its own PR, slice 1d, right after 1c; ADR 0019's POC part is accepted when 1d merges (ADR 0019 Status); "Delivery" gains the 1d row; rows 34 and 35 move to slices 1c and 1d, row 37 to 1d; the TypeScript runner moves to 1d; `security` reviews 1d. No existing row number, rule home or owner decision changes. Review: the tech notes (§2 `RULE_IDS` without `word-count-1` and a `checkItem` clause for `hypothesis-flag-1`; §7 and §13 the role gate before `readPage` and the CLI's competitor path; §9 the new string; §12 and §14 the 1c and 1d split and rows 34, 35, 37 and 38; "Findings for the spec" for spec v1.5); ADR 0019 (Status and Confirmation against slice 1d and row 38); the slice 1a builder (rows 2 and 10, `RULE_IDS`); the slice 1c and 1d builders (row 38, the split); the designer and the owner for `read.notRead.competitor`; `security` for 1c and 1d; the owner at G2 for I2, I4, I6, S1, S5 and S8.
- v1.6 (2026-10-27): G2 design findings F15 to F17 of the tech notes, raised against v1.5, accepted by the orchestrator under ADR 0012 decision 4 and open for the owner at G2 ("Owner decisions" lists where each lands). F15: the address check in "Reading a page the person submits" refuses the unspecified address `::`, `64:ff9b:1::/48`, Teredo `2001::/32`, zone ids and unparsable literals, and judges `::/96`, `::ffff:0:0/96`, `64:ff9b::/96` and `2002::/16` by the IPv4 they embed; row 5's Given adds `http://[::]/` and `http://[64:ff9b::a00:5]/` (refused) and `http://[64:ff9b::808:808]/` (read). F16: row 36's `noscript` holds a `p` (`<noscript><p>Enable JavaScript</p></noscript>`) and its "User sees" names the `p` inside the `noscript`. F17: "Worked examples" says the ninth line, `hypothesis-flag-1`, was run on Node 22.23.0 with ICU 78.2 and printed the five lines shown. The Gap list and "Depends on" say F1 to F17. No row number, rule home, slice or owner decision changes. Review: the tech notes ("Findings for the spec" marks F15 to F17 applied; §6 and §14 rows 5 and 36 already match); the slice 1b builder (rows 5 and 36); `security` for 1b (the address check); the owner at G2 for F15 to F17.
- v1.7 (2026-10-27): finding F18, raised by re-check g2-2 finding N4 on 4329e9c (task `ORV-128-review-g2-2`) and accepted by the orchestrator under ADR 0012 decision 4, open for the owner at G2. In "Confidence", the "When" of base `model-reading` becomes "A reading or an observation by a model (every item with `fromModel` true)", so a model's `asset-shown` item with no reading takes 0.7, as tech notes §2 clause 5 already checks; the "When" of base `measure` becomes "A code measure with no reading and `fromModel` false". "Owner decisions" lists F18; the Gap list and "Depends on" say F1 to F18. No number, row, rule home, slice or owner decision changes. Review: the tech notes ("Findings for the spec" gains F18, marked applied in spec v1.7); the slice 1a builder (row 2's base cases, `checkItem` clause 5); the slice 7 builder (a model `asset-shown` item scores 0.7); the owner at G2 for F18.
- v1.8 (2026-10-27): finding F19, raised against v1.7 by task `ORV-128-design-schema-6` and accepted by the orchestrator under ADR 0012 decision 4, open for the owner at G2. "Delivery" row 1d also names the engine's report schema module, `report.ts` (`reportSchema`, tech notes §7, "The report schema"); rows 17 and 38 say the JSON parses with `reportSchema` and point to that section. New open question "A report for a refused read": `reportSchema` has no member for a refused or failed read, and the default before slice 1d is a third member `refused` carrying the refusal key (`read.refused.robots`, `read.refused.address`) and the printed line, designed in the slice 1d spec. "Owner decisions" lists F19; the Gap list and "Depends on" say F1 to F19. No number, row number, rule home or owner decision changes. Review: the tech notes ("Findings for the spec" marks F19 applied in spec v1.8; §7 "What it does not hold" and §11's `reportSchema` row against the open question's default); the slice 1d builder and its spec (row 1d's scope, rows 17 and 38, the `refused` member); `security` for 1d; the owner at G2 for F19.
- v1.9 (2026-10-27): three deviations of the slice 1a build (task `ORV-132-build-evidence-1`), accepted by the orchestrator under ADR 0012 decision 4 and open for the owner. Rows 3 and 32: the When cell says `scoreConfidence(base, factors)`, returning `{ confidence, belowFloor }`, as tech notes §4 designs it and the build ships it, in place of a call that took the whole item; Given, outcomes and test names unchanged. "Evidence first", the reading targets: a `reference.asset` font `family` is 1 to 100 characters after trimming, a bound the build set where the spec gave none; "Hypotheses" lists it as a schema bound, not a member of `hypothesis-flag-1`. The field table's `reading` row says the schema checks the shape of `value` per `target`, pointing to the tech notes §2 table. No row number, test name, rule home, slice or owner decision changes. Review: the tech notes (§2, the `reference.asset` row of the value-shape table gains the bound; §4 already matches; clause 9 and §14 row 3 read the result as `.value`, where the build returns `{ confidence, belowFloor }`); `evidence.test.ts` (test names unchanged); the slice 7 builder (the font bound on another brand's CI); ORV-132 spec v1.1.
- v1.10 (2026-10-27): the slice 1b open question on the bytes' character encoding (ORV-133 spec v1, task `ORV-133-product-spec-1`), its default accepted by the orchestrator under ADR 0012 decision 4 and open for the owner. Rule `html-text-1` in "Page text" gains one sentence on how the document bytes are decoded before tokenizing; "Hypotheses" lists that decoding bound, not a member of `hypothesis-flag-1`. No row, number, rule home, slice or owner decision changes. Review: the tech notes (§8 "Page text", the `pageTextOf(documentBytes)` bullet, against the decoding sentence; §1's `page-text.ts` row); the slice 1b builder (`page-text.ts`, row 36's fixture bytes); the slice 1c builder (row 9's quote check reads the same decoded text); ORV-133 spec v1.1; K-0082 ("Byte decoding" names the step this rule now fixes).
- v1.11 (2026-10-27): "Worked examples" gains a tenth line for the decoding sentence of `html-text-1` (L-0038, proposed by task `ORV-133-product-parent-1`), run by the main session on Node 22.23.0; the section's opening paragraph says so. No row, number, rule home, slice or owner decision changes. Review: the slice 1b builder (`page-text.test.ts` may reuse the bytes); ORV-133 spec v1.2, which copies the line.
- v1.12 (2026-10-27): slice 1b review round 0 on PR 130 at e21b10a (R1 to R8, SEC-133-1 to SEC-133-7), decided by the orchestrator under ADR 0012 decision 4 and open for the owner ("Owner decisions" records each as a contract change, no contract change or a repeat, L-0013). In "Reading a page the person submits": the Address check reads only the default ports 80 and 443, each for its own scheme (SEC-133-7), refuses a URL with a username or password (R4, SEC-133-5), refuses `240.0.0.0/4`, `198.18.0.0/15`, `192.0.0.0/24` and `fec0::/10` and judges `::ffff:0:0:0/96` by its IPv4 (SEC-133-6, R7), and runs on every request, robots.txt and stylesheets included; robots.txt gains rules `robots-token-1` (R2), `robots-group-1` (R1, SEC-133-2) and `robots-match-1` (SEC-133-1), and a robots.txt redirect is followed (R3); Logged out points to the Address check; new bullet Depth bound, 512 elements, and the read always returns its result (SEC-133-3). In "Page text", `html-text-1` gains a Heading bound of 5,000 characters in all (SEC-133-4) and a Depth line. The "When" of `page-incomplete` in "Confidence" names the depth and heading cuts; no factor value changes. "Hypotheses" lists the three new bounds. Rows 5, 6, 7 and 36 gain the new cases, numbers and test names kept. "Worked examples" gains six lines, not run (no shell). No string, factor value, slice or owner decision changes. Review: tech notes §6 (`checkAddress` lists, the port and userinfo check, `parseRobots` and `robotsAllows` against the three robots rules, the robots.txt redirect, the depth bound and `ReadResult`) and §8 ("Page text": the heading bound, the depth, how `pageTextOf` reports `page-incomplete`), §14 rows 5, 6, 7 and 36 and the row 5 break-it (R8); `read-page.ts` and `read-page.test.ts`; `page-text.ts` and `page-text.test.ts`; ORV-133 spec v1.4, which copies rows 5, 6, 7 and 36; `security` for the re-review of 1b; ORV-127 spec R6, which still says "for the reader's product token and for `*`".
- v1.13 (2026-10-27): the RFC 9309 check of research task `ORV-133-research-robots-1` (K-0056, 0.8, now quotes sections 2.2, 2.2.1, 2.3.1.2, 2.3.1.3 and 2.3.1.4), four points decided by the orchestrator under ADR 0012 decision 4 and open for the owner ("Owner decisions", RFC 9309 check, RFC-1 to RFC-4). RFC-1: `robots-token-1` keeps digits in the token run and says section 2.2 allows none; "Hypotheses" records why, and that the two readings differ only on a value that is not a valid token, such as `OriviloReader1`; the `robots-token-1` worked example gains that value, not run. RFC-2: "Hypotheses" records the robots.txt redirect bound as below the RFC's SHOULD of at least five, kept so one read has one redirect bound, failing closed past it. RFC-3: robots.txt, Answers says the rules of a file reached through a redirect apply in the context of the initial authority, the host of the submitted URL. RFC-4: the 5xx rule already matches section 2.3.1.4; no change. No string, number, row, slice or owner decision changes. Review: `read-page.ts` (the robots.txt cache keyed by the submitted URL's origin, against RFC-3) and its row 6 test in `read-page.test.ts` (the robots.txt redirect case asserts the landed rules govern the submitted host's page); tech notes §6 (`parseRobots` and the robots.txt redirect against RFC-1 to RFC-3); ORV-133 spec, which cites v1.13; the slice 1b fix, which runs the `robots-token-1` line with its new value.
- v1.14 (2026-10-27): slice 1b review round 1 on PR 130 at c37f0c8 (R5, R1-1 to R1-5, SEC-133-R1-1 to SEC-133-R1-5), decided by the orchestrator under ADR 0012 decision 4 and open for the owner ("Owner decisions", Slice 1b review round 1, each recorded per L-0013). In "Reading a page the person submits": the Address check refuses a path and query over 2,048 characters (SEC-133-R1-1); `robots-match-1` normalises path and pattern as RFC 9309 section 2.2.2 states (SEC-133-R1-3), treats a robots.txt of more than 5,000 Allow or Disallow rules as complete disallow, and states its total bound in place of "linear in the path length" (SEC-133-R1-1); Answers names a 3xx with no `Location` header as no answer (R1-4); the Depth bound gains the Nesting pre-pass (SEC-133-R1-2, R1-2) and says a rejecting port counts as no answer to the request it served, so "never an exception" now covers a port that rejects (SEC-133-R1-5, R1-3). In "Page text", `html-text-1` gains the Path bound (R1-1, SEC-133-R1-4) and its Depth line names the pre-pass cut; a change to `html-text-1`, so the URL analyser's `analyser.version` counts it when slice 1c first ships one. The "When" of `page-incomplete` names the pre-pass cut and the Path bound; no factor value changes. "Hypotheses" lists the four new bounds and the pre-pass's over-estimate. Rows 6, 7 and 36 gain the new cases, numbers and test names kept. "Worked examples" records the reviewer's run of lines eleven to sixteen (R1-5) and gains two lines, not run (no shell). "Owner decisions" records R5's equivalent mutants. "Depends on" names the WHATWG HTML lists. No string, factor value, slice or owner decision changes. Review: `read-page.ts` and `read-page.test.ts` (the path and query bound, the rules cap, the normalisation, the 3xx with no `Location`, the rejecting ports; row 6 and row 7's port cases); `page-text.ts` and `page-text.test.ts` (the Nesting pre-pass in the shared parse, the Path bound in `pathOf`; rows 7 and 36's 2 MB and long-name cases); tech notes §6 (Address check, robots.txt, Depth bound, `ReadPorts`), §8 ("Page text", the `page-incomplete` sentence, the path form) and §14 rows 6, 7 and 36; ORV-133 spec v1.7, which copies rows 6, 7 and 36; K-0056 (no quote of section 2.2.2 yet); the `security` and reviewer re-check of PR 130.
- v1.15 (2026-10-27): the follow-ups of slice 1b review round 1 (FU-1 to FU-9: the open points of task `ORV-133-product-parent-6` and of the research tasks that extended K-0056 and wrote K-0083), decided by the orchestrator under ADR 0012 decision 4 and open for the owner ("Owner decisions", Slice 1b review round 1, follow-ups). In "Reading a page the person submits": the Address check caps the whole URL (`href`) at 2,048 characters, the evidence schema's `source.ref` bound, in place of the path and query (FU-1); robots.txt is requested only after a lookup of the host gave an address, and The result fails the read with `network` for a submitted or redirect-target host with no address or a rejecting `resolve` (FU-2); Bounded caps a robots.txt answer at 500 KiB, past which it is complete disallow, and Answers points there (FU-4); `robots-match-1` is split into Normalisation, Matching and Caps, states that reserved characters stay as written, gains the most-octets choice with allow on a tie, `%2A` and `%24` as literal characters (FU-6) and a cap of 100,000 pattern characters in all, and its step ceiling becomes 100,000 times 2,048 (FU-5); the Nesting pre-pass cites K-0083 and says why `noscript` is not in its text list (FU-8). "Hypotheses" lists the whole-URL bound, the 100,000 characters, the 500 KiB, the optional-end-tag reading (FU-8) and two more readings of RFC 9309 (FU-7). Row 6 gains the `%2A` pattern, the file of 500 KiB plus one byte and the file of 101 patterns of 1,000 characters, its refused URL becomes 2,049 characters in all and its 500 KB timing case a path of 2,000 characters; row 7 gains a host with no address. "Worked examples" records the main session's run of the two v1.14 lines (FU-9), changes the total-bound line and adds a `%2A` line, both not run. "Depends on" cites K-0083. No string (FU-3), factor value, row number, test name, slice or G1 decision changes. Review: `read-page.ts` (`allowedUrl` on the whole `href`, the lookup before robots.txt, `ROBOTS_MAX_BYTES` failing closed, the total pattern cap, the most-octets choice on the normalised pattern, `%2A` and `%24`) and `read-page.test.ts` (rows 6 and 7); tech notes §6 (Address check, `ReadPorts.resolve`, robots.txt, Bounds, Depth bound) and §14 rows 5, 6 and 7, and "Findings for the spec"; ORV-133 spec v1.8, which copies rows 5, 6 and 7; the `security` and reviewer re-check of PR 130 (the optional-end-tag reading of the Nesting pre-pass is open for `security` to probe).
- v1.16 (2026-10-27): the tech notes findings F20, F21 and F22 and the row 6 timing point, raised against v1.15 by task `ORV-133-design-tech-r1-1`, decided by the orchestrator under ADR 0012 decision 4 and open for the owner ("Owner decisions", Slice 1b review round 1, tech notes findings, each a contract change). F20: the Depth bound's Nesting pre-pass is replaced by the Nesting count, which counts the tree builder's own stack of open elements through `parse5`'s `onItemPush` and `onItemPop` while the tree is built, stops at the push that would make it 513 deep and parses only the text before that element's start tag again; the void, optional end tag and text lists leave the rule; `html-text-1`'s Depth line and the "When" of `page-incomplete` name the count's cut; rows 7 and 36 add 2 MB documents that start `<body><style><!--</style>` and `<body><svg><style>`, each within 2 s with `page-incomplete`; "Hypotheses" records the count and says the optional-end-tag reading of FU-8 no longer applies; "Depends on" cites K-0082 for the hooks and keeps K-0083 as the record of why the pre-pass was dropped; the SEC-133-R1-2 and FU-8 rows of "Owner decisions" note the replacement. F21: `robots-match-1`, Caps counts the `allow` and `disallow` lines before the first group and those with an empty value. F22: `robots-match-1`, Matching lets a pattern's `%2A` or `%24` match the percent-encoding in the path too; row 6 adds `Disallow: /a-%2A.html` for `https://example.com/a-%2A.html`, refused; "Hypotheses" adds the reading; the `%2A` worked example gains that pair, not run. Row 6 timing: the 500 KB case returns within 500 ms, not 100 ms, and the total-bound worked example says so. "Worked examples" records the main session's run of the two v1.15 lines on Node 22.23.0 with ICU 78.2 (both matched). No string, factor value, row number, test name, slice or G1 decision changes. Review: `page-text.ts` (the Nesting count in `parseBounded` in place of `nestingCutOf` and its three sets) and `page-text.test.ts` (row 36's two new 2 MB cases; the unit cases that pinned the three sets go); `read-page.ts` (`parseRobots` counting per F21, `robotsAllows` matching `%2A` and `%24` per F22) and `read-page.test.ts` (row 6's new case and its 500 ms bound; row 7's two new 2 MB cases); tech notes §6 (Depth bound, `parseRobots`, `robotsAllows`), §8 (the pre-pass named beside scripting off and in `incomplete`) and §14 rows 6, 7 and 36, and "Findings for the spec" (F20 to F22 applied); K-0082 (record the two tree adapter hooks); ORV-133 spec v1.9, which copies rows 6, 7 and 36; the `security` and reviewer re-check of PR 130 (the count, F21, F22 and the 500 ms bound, which a measurement on CI may tighten).
- v1.17 (2026-10-27): tech notes finding F23, raised against v1.16 by task `ORV-133-design-tech-r1-2`, decided by the orchestrator under ADR 0012 decision 4 and open for the owner ("Owner decisions", Slice 1b review round 1, tech notes findings, a contract change). The depth bound falls from 512 to 128 elements, `html` counting 1: the Depth bound's Nesting count stops at the push that would make the stack 129 deep, and its walk goes to a depth of 128; the Depth bound names F23. Rows 7 and 36 gain the held-depth document (`<body>`, 125 nested `div` elements and `</p>` repeated to 2 MB): row 7 reads it within 2 s without `page-incomplete`, row 36 returns it within 2 s with `incomplete` false; row 7's outcome for its other 2 MB documents now reads "Each of the five 2 MB documents". "Hypotheses" names the bound as 128 elements, lowered from 512 in v1.17. Bookkeeping: "Hypotheses" (the Nesting count) and "Depends on" say K-0082 section 6 records both hooks and their call sites; "Depends on" names F23; "Worked examples" records the main session's run of the v1.16 `%2A` line on Node 22.23.0 with ICU 78.2 (it matched). No string, factor value, row number, test name, slice or G1 decision changes, and no worked example is added. Review: `page-text.ts` (`MAX_DEPTH` to 128) and `page-text.test.ts` (row 36's held-depth case; the boundary, cut-rule and void-element cases and the `MAX_DEPTH` break-its move from 509, 510, 512 and 513 to 125, 126, 128 and 129); `read-page.test.ts` (row 7's held-depth case; the void-link case beyond the row); tech notes section 6 (Depth bound: the Nesting count, the cut, the second parse, the cost and the walk), section 8 and section 14 rows 7 and 36, section 11 (an impact row for v1.17) and "Findings against spec v1.16" (F23 applied); K-0082 section 6 (its worked count names 513); ORV-133 spec v1.10, which copies rows 7 and 36; the `security` and reviewer re-check of PR 130.
