---
issue: ORV-128 (https://tpetkaew.atlassian.net/browse/ORV-128), layer 1 of the ORV-126 harness
lane: L (a new engine contract every brand node reads, the evidence schema; server-side reads of outside web pages with legal exposure; new model calls and prompts; uploaded files)
version: 1.2
---

# ORV-128: input analysers, harness layer 1

## Evidence first: the shape every analyser emits

Every analyser turns what the person brings into a list of **evidence items**. One item is one thing seen in one input, with what it measures (when code can measure it), what it suggests for the brand, how sure the harness is, and whether a model was involved. Nothing else leaves an analyser: no page copy, no stored image, no free-form summary.

The schema is a strict zod object (`inputEvidenceSchema`, name suggested): an unknown key fails to parse, so a field such as `html`, `css`, `screenshot`, `pageText` or a model's own `score` cannot be stored (row 2).

<!-- prettier-ignore -->
| Field | Type and bound | Meaning |
| --- | --- | --- |
| `schemaVersion` | `"1.0"` | Contract version (ADR 0005 pattern) |
| `id` | string | FNV-1a fingerprint over the canonical JSON of `analyser`, `source` and `observation` (ADR 0007 decision 5), so the same input gives the same id |
| `analyser` | `{ id, version }` | Which analyser made the item, for example `{ id: "website-url", version: "1" }` |
| `inputKind` | `website-url`, `user-html`, `mood-photo`, `other-brand-ci`, `brief-text` | The five input kinds below |
| `role` | `own`, `reference`, `competitor` | What the person said the input is when they gave it: their own brand, a reference they like, or a competitor. Never guessed by the analyser |
| `source` | `{ ref, locator, contentHash, retrievedAt }` | `ref`: the URL, the upload key or the brief id. `locator`: where in the input (a character span for text, an element path for HTML, a pixel box for an image). `contentHash`: SHA-256 of the bytes read. `retrievedAt`: ISO date and time, from a clock passed in |
| `observation` | `{ kind, subject, quote? }` | What was seen, as a closed `kind` (list below) and a `subject` slug. `quote` is the exact input text, 300 characters at most, only for text observations; it must equal the input at `locator` (ADR 0008 decision 2) |
| `measure` | `null` or `{ metric, value, unit }` | A number computed by code from the input (list below). Always `null` when `fromModel` is `true` |
| `reading` | `null` or `{ target, value, by }` | What the observation suggests for one node input (targets below). `by` is `rule` (with the rule id) or `model`. `null` for a pure measure that suggests nothing on its own |
| `confidence` | `{ value, base, factors }` | `value` 0 to 1, computed by code as `base` times every factor in `factors`; each factor names a closed reason (section "Confidence") |
| `belowFloor` | boolean | `true` when `confidence.value` is under the floor (decision D3). The node graph treats the item as absent (section "How evidence feeds the node graph") |
| `fromModel` | boolean | `true` when a model produced the observation or the reading |
| `model` | `null` or `{ job, modelId, adapter: { id, version } }` | Required when `fromModel` is `true`, `null` otherwise. `job` is an ADR 0009 job (`interpret` or `see`); `modelId` is the pinned id |
| `basedOn` | evidence ids | Items this one rests on, for example a model's mood reading resting on measured colours |
| `ownedBy` | `self`, `other`, `unknown` | `other` for another brand's asset (case 3): such an item never suggests a value for the person's own brand |
| `origin` | `input`, `tool-default` | `tool-default` when the value matches a default of the tool that made the input (case 4) |
| `flags` | list of `{ key, questionId? }` | Checks that fired on the item: `conflict`, `culture.yellow`, `culture.political`, `similar-to`, `tool-default`, quality reasons |
| `hypothesis` | boolean | `true` when the rule behind the reading or the confidence numbers has no source at 0.7 or more (section "Hypotheses") |
| `hypothesisNote` | `null` or string, 1 to 200 characters | Required (a string) when `hypothesis` is `true`, `null` when it is `false`: names the unsourced rule or number, for example `"lean rule value-to-lean-1: 'not too' read as low"` |

**Observation kinds** (closed list): `colour-area`, `colour-declared`, `contrast-pair`, `density`, `font-family`, `text-span`, `image-property`, `industry-candidate`, `personality-signal`, `mood-word`, `brand-name`, `competitor-name`, `asset-shown`.

**Measures** (closed list, code only): `area-share` (0 to 1 of the rendered surface), `hue-family` (an ORV-20 hue band), `lightness` and `chroma` (OKLCH), `warm-share` (share of area in warm hue bands), `contrast-ratio` (WCAG ratio), `text-density` (characters per 1,000 px² of the first screen), `element-density` (visible elements per first screen), `short-edge-px`, `sharpness` (variance of a Laplacian filter), `word-count`, `delta-e` (CIEDE2000 between two colours).

**Reading targets** (closed list, each mapped to an ORV-126 node; section "How evidence feeds the node graph"): `situation.tsic`, `situation.name`, `situation.competitors`, `identity-frame.personality.<axis>` (value `{ lean: "high" | "low" }`, never a 0 to 100 number), `look-feel.mood` (a word from the closed `mood-1` list), `color.current` (a colour the person's own brand uses now), `competitive-frame.lineup-candidate` (`{ name, hex }`), `reference.asset` (another brand's asset, for the similarity check only).

**From a `lexicon-1` value to a lean** (rule `value-to-lean-1`, a hypothesis). `lexicon-1` gives an axis one of five fixed values, not a measurement (`RULE_VALUES` in `packages/intent-engine/src/interpreter.ts`). A value above 50 becomes lean `high`; a value below 50 becomes lean `low`; no value is 50, so every one maps. In full: 90 (intensified, "very premium") and 75 (desired, "premium") give `high`; 40 ("not too premium", "ไม่หรูหราเกินไป"), 25 (a low word such as "formal" for playful) and 15 (avoided, "not premium", "ไม่หรูหรา") give `low`. A reading from 40 carries `hypothesis: true` with a `hypothesisNote` saying that "not too" asks for a little, not none, and is read as `low` until fixtures or the person show otherwise (row 10). The 0 to 100 value itself never leaves the analyser.

## The five analysers

What each one measures by code and what it may read through a model. A model only reads; it never measures and never decides (ADR 0009, K-0027: model at the edge, deterministic core).

### 1. Website URL (`website-url`)

- **Input:** one absolute `https` or `http` URL the person submits, with its `role`.
- **Read:** once, server-side, logged out, after robots.txt (section "Reading a page the person submits").
- **By code:** colour area shares on the rendered first screen and full page (colours clustered by a deterministic quantiser, as Material Color Utilities does without a model, K-0021), each cluster's ORV-20 hue band, lightness and chroma; declared colours from the stylesheets; contrast ratio of the main text and background pairs; text and element density; font families declared for headings and body; the visible text (title, meta description, headings, body up to 5,000 characters) as text spans; personality signals from that text through the existing rule-based adapter `lexicon-1` (ADR 0008), turned into leans by `value-to-lean-1`; warm and expressive leans from the colour measures (rules `measure-to-lean-1`, hypothesis).
- **Through a model:** industry candidates as TSIC codes, personality signals and mood words from the page text (`interpret` job) and from the rendered first screen (`see` job), each quoting the text or naming the measured items it rests on. Labelled `fromModel`.
- **Feeds:** `situation.tsic`, `identity-frame`, `look-feel`, and `color.current` when `role` is `own` (or `competitive-frame.lineup-candidate` when `role` is `competitor`, decision D1).
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
- **By code:** `lexicon-1` personality signals with exact spans (ADR 0008); URLs found in the text (a URL pattern, recorded as text, not fetched); word count.
- **Through a model** (`interpret`): the brand name, competitor names, industry candidates, personality signals and mood words, each with an evidence span equal to the brief text (ADR 0008 decision 2).
- **Feeds:** proposed inventory facts for the ORV-126 classifier (`concept`, `name`, competitors), `situation.tsic`, `identity-frame`, `look-feel`. A competitor URL in the brief is read only under decision D1.

## The six cases (ORV-128, from ORV-126 comment 10202)

1. **Conflicts become a question.** When two items above the floor give opposite leans on the same target (one says premium high, another premium low), or the top two industry candidates are within 0.1 of each other in confidence and share no TSIC section, the harness does not pick one. Industry candidates further apart than 0.1 are not a conflict, whatever their sections: the top one wins (section "Industry", row 33). Both items get the flag `conflict`, the node gets the question `evidence.conflict` with both as choices, and neither counts as support until the person answers (ADR 0008's `conflicting`, applied across analysers).
2. **Photo colours become personality first.** A mood photo's colours describe a feeling, not a brand palette. The photo analyser turns its measures into personality leans and mood words for `identity-frame` and `look-feel`; the colour node then decides from personality and the lineup by its own rules (ORV-20). No photo hex is ever offered as a signature or lineup colour (row 25).
3. **Similarity check for another brand's assets.** Another brand's colours are stored as `reference.asset` with `ownedBy: "other"`. `similarityCheck(candidate, references)` flags a candidate colour that falls in the same ORV-20 hue band as a reference brand's dominant colour and within CIEDE2000 10 of it, and a candidate font with the same family name. A colour shared with other brands is weak as an asset (K-0039, 0.75), and a group of colours can be a registered mark in Thailand (K-0053, 0.7). The check says plainly that logo shapes are not compared.
4. **AI-tool defaults split from preference.** HTML made by an AI page tool carries the tool's defaults (a default palette value, a default font). A value that matches the pinned default list within CIEDE2000 2 is marked `origin: "tool-default"`; its preference reading gets the factor `tool-default` (times 0), so it never counts as what the person likes, and the node asks `evidence.toolDefault`. The value stays visible: the person may have chosen it on purpose.
5. **Thai colour culture.** A colour that targets the person's own brand (`color.current`, and later the decided signature) is checked against K-0040 (0.7): a dominant colour in the yellow band gets `culture.yellow`; yellow or red as the only dominant colour gets `culture.political`. Each flag carries a question for the person to confirm, never a ban and never a change to the colour. Colour meaning is learned and culture-bound (K-0038, 0.7), so the flag asks rather than rules.
6. **Low-quality input lowers confidence.** A small or blurred image, a page that loaded only in part, a text with few words: each adds a named factor that multiplies confidence down. Items under the floor stay stored and visible with their reason, and the node graph treats them as absent.

## The owner's acceptance test

The owner sends one URL and gets back the business type as a TSIC code, a personality and a mood, each with its reasons and the evidence it rests on.

- **How it runs in the POC:** a command, `pnpm analyse:url <url> --role own|reference|competitor` (name suggested), prints a report and writes the same report as JSON to standard output with `--json`. No screen (POC focus is function). Tests run it on recorded fixtures; the live run is a manual smoke recorded in the G3 packet, outside `pnpm test` (ADR 0009 point 8).
- **What the report holds:**
  - **Industry:** the TSIC code, its matched level (1 to 5), its Thai name and English name as the taxonomy module holds them, the confidence, and the evidence ids; or `ambiguous` with the question `industry.confirm` and the choices; or `awaiting-taxonomy` (below).
  - **Personality:** per axis of the five (decision D6 of ORV-126, hypothesis), the lean `high` or `low` or `no signal`, the confidence, and the evidence ids; never a 0 to 100 number.
  - **Mood:** up to five words from `mood-1` with confidence and evidence ids.
  - **Reasons:** for every reading, the rule id or the model id that made it, the quote or measure it rests on, and the factors that lowered its confidence.
  - **Refusals and flags:** a refusal (robots.txt, a non-public address) instead of any reading; culture, conflict and tool-default flags with their question ids.
- **When it passes:** after slice 3 (section "Delivery"). Slice 1 gives measures and rule-based personality; slice 2 adds the industry; slice 3 adds model readings and mood.

### Industry: TSIC code, matched level and confidence

- **Candidates.** Rule-based: the page or brief text matched against **match terms** derived from the names in the TSIC 2009 module of ORV-127 (whole-word and case-insensitive for Latin, substring for Thai, as `lexicon-1` does). Model: up to three TSIC codes from `interpret`, each quoting the text it rests on.
- **Match terms** (rule `tsic-terms-1`, a hypothesis). Official TSIC names rarely appear word for word on a page, because most start with a word for "activities". So a code's Thai name loses a leading `กิจกรรม`, and its English name loses a leading `activities of` (case-insensitive); what remains, trimmed, is the code's match term. For example `86202`, `กิจกรรมคลินิกโรคเฉพาะทาง` (ORV-127 spec, "Count"), gives the term `คลินิกโรคเฉพาะทาง`. A name without that prefix is used whole. Each match is a rule reading with base 0.7, quoting the matched text. Derived terms still miss most everyday words (a page says `คลินิกทันตกรรม`, not the TSIC name); a curated term list per code, each term with its source, is a later slice with its own issue. Until it lands the CLI report says the industry match is by TSIC name only.
- **Check.** Every candidate code must exist in the module and be brand-relevant (`isBrandRelevant`, ORV-127 row 3); an excluded or unknown code is dropped and listed as `invalid-code` (row 15).
- **Matched level, one rule.** The top candidate by confidence wins, and the second is listed as an alternative with its confidence, unflagged, whatever its section (row 33). Only when the second is within 0.1 of the top and differs from it does the harness not pick: if they share a section, the result is their deepest common ancestor at the level where they still agree (for example `86202` and `86201` give class `8620`, level 4); if they share no section, the result is `ambiguous` with both as choices, the question `industry.confirm` and a `conflict` flag on both (case 1, row 14). The 0.1 margin is a hypothesis.
- **Before the taxonomy module exists.** The industry function takes the taxonomy as an argument; given none, it returns `{ status: "awaiting-taxonomy" }` with no code and no guess (row 16). Slice 2 starts only after ORV-127 slice 1 has merged the TSIC 2009 code list; this spec adds no copy of the taxonomy.
- **Industry is context.** The TSIC reading feeds `situation` (for the `touchpoints` story and for `lineupFor`, ORV-127). No rule reads it to pick a colour, a typeface or a logo type (ORV-126 "Rules and bounds").

## Why

The ORV-126 harness assumes a structured inventory and a person who answers questions. Real people arrive with a website, a page an AI tool made for them, a few photos, another brand they admire, or a paragraph. The brief asks ORIVILO to inventory what exists before it starts (brief, "Starting assets vary and are incomplete") and to collect before generating (brief, "Every node carries a knowledge base"). The owner framed the harness in three layers and named this story as layer 1, with its input kinds, its shared evidence shape, six cases and an acceptance test (ORV-126 comment 10202; ORV-128).

Layer 1 makes that input usable without letting it decide: code measures what can be measured, a model may suggest what only reading can find, every item says which it is and how sure it is, and the ORV-126 graph still asks the person before anything becomes a value. Practitioners collect and audit before choosing (K-0028, 0.8; K-0036, 0.75), and a model-driven generator without sources, checked output or a trace is the gap K-0027 (0.8) found across the tools surveyed.

This spec is not a guard. It describes analysers and the evidence they return.

### What is real, rule-based and simulated

- **Real (once built):** the evidence schema, the confidence calculation, the safe single-page read, every measure, the industry check against the TSIC module, the similarity, culture and tool-default checks, and the feed into the node graph. All deterministic TypeScript with tests, except the page fetch and the renderer, which run server-side and are tested against a fake network.
- **Rule-based, not AI:** `lexicon-1` personality signals, `measure-to-lean-1`, the TSIC name match, the culture flags. Each says `by: "rule"` with its rule id.
- **Read by a model, labelled:** industry candidates, personality signals and mood words from `interpret` and `see`, from slice 3 on. Each is `fromModel: true` with the pinned model id, and each job ships with its Thai and English evaluation set (ADR 0009). Until a slice ships, nothing may say ORIVILO reads that input with AI.
- **Hypothesis-grade:** the confidence numbers, the measure-to-lean rules, the mood vocabulary, the similarity and roll-up thresholds (section "Hypotheses").
- **Not done, and said so:** no logo shape comparison, no reading of text inside images by code, no PDF, no crawl beyond the one page, no legal clearance of any read (section "Reading a page the person submits").

## Story

As a founder or designer who brings whatever I have (my website, a page an AI tool made for me, photos that feel right, a brand I admire, a few lines about my business and its competitors), I want ORIVILO to measure what can be measured, suggest what my inputs say about my business type, personality and mood, show me which suggestions came from AI and how sure each one is, and ask me when my inputs disagree, so that the brand graph starts from my real material instead of a blank form, while nothing becomes a decision until I confirm it.

## Reading a page the person submits

A URL the person submits, for their own brand or as a reference, is read **once, server-side, logged out, after robots.txt**, and what was fetched is kept **only as evidence items**.

- **Address check (R13 of ORV-127).** `https` or `http` only; the host must resolve to a public address (no loopback, private, link-local, carrier-grade NAT, multicast or cloud metadata range, IPv4 or IPv6), checked again on every redirect and on the address actually connected to. At most 3 redirects.
- **robots.txt (R6, K-0056 at 0.8).** Fetch `/robots.txt` of the host first. Honour a disallow for the product token `OriviloReader` (matched case-insensitively) and for `*`. A 4xx means no rules; a 5xx or no answer means complete disallow. Within one analysis the file is read once; a cached copy is never used for more than 24 hours.
- **Logged out (R9).** No cookies, no authorization header, no form, no login, no CAPTCHA, no rotating address.
- **Named reader (R7).** The user agent carries `OriviloReader/1` and a contact URL (open question on the URL).
- **Bounded.** One page and its own stylesheets: at most 10 stylesheets, the document at most 2 MB and each stylesheet at most 1 MB (cut off past that, with the factor `page-incomplete`), 10 seconds per request, 30 seconds in all. No link is followed and no other page of the site is read. Images, fonts and scripts are not fetched; the colour measures cover what CSS paints, and each says so (open question on images).
- **Kept only as evidence (R11).** The HTML, CSS and rendered image live in memory for the run and are discarded. What is returned is the evidence list: measures, quotes of 300 characters at most that a reading rests on, and the content hash. In the POC nothing is persisted (ORV-126 state is in memory; E2-12 owns persistence).

**How this differs from bulk collection in ORV-127.** ORV-127's automated reader and user channel read many brands' pages to build a shared library other workspaces see; they wait on a Thai lawyer's review of R2, R8, R10 and R14 (ORV-127 decision D2). The single-page read here is started by one person for one page at a time, follows no link, writes no library record, and returns evidence to that person only. The owner chose the lawyer review for bulk reading (ORV-127 comment 10201); that review does not block this single-page case unless the owner says so (decision D1).

**What stays the same.** A program fetching a page is automated access in law terms (ORV-127 decision D3), whatever the volume; robots.txt is a convention, not a permission (K-0056); and the Computer Crime Act's access offences concern systems with an access-prevention measure (K-0054, 0.7), which logged-out public pages are read to avoid. This is our reading, not legal advice. Choosing D1 (a) means the owner accepts the remaining risk for single pages until the lawyer review lands.

**Another brand's page.** Reading any other brand's page because a person named it, whether as a competitor or as a reference they admire, is the same act as ORV-127's user channel (R12: the user names a brand or URL and ORIVILO reads it under R6 to R11). The role label does not change the read. D1 (a) draws the line by purpose, not by kind of read: it accepts that risk for references, which the person names one at a time as inspiration and which only feed the similarity check and a reference mood, and it holds competitor URLs, which feed the lineup the colour node audits, until the lawyer review lands. So a reference URL is read under the rules above; a competitor URL is recorded as text and not fetched, and a competitor's colours enter the lineup only by the person or through ORV-127. If the owner wants references to wait too, that changes D1 (a version bump), and analyser 4 then reads uploaded images only.

## Confidence

ADR 0008 rejected a confidence score per finding because no method backed one. Here the number is backed by a method the trace shows: a base per kind of item times named factors, all computed by code. A model's own estimate of its certainty is never read (a `score` key fails the schema, row 2). Whether this needs an addition to ADR 0008 is decision D6.

<!-- prettier-ignore -->
| Base or factor | Value | When |
| --- | --- | --- |
| base `measure` | 1.0 | A code measure with no reading |
| base `rule-reading` | 0.7 | A reading by a rule over quotes or measures |
| base `model-reading` | 0.7 | A reading by a model (0.6 in v1.1; raised in v1.2, see D3) |
| `page-incomplete` | times 0.7 | The document or a stylesheet was cut off or failed |
| `few-words` | times 0.7 | The text read has fewer than 20 words |
| `image-small` | times 0.5 | The image's short edge is under 512 px |
| `image-blurred` | times 0.6 | Sharpness under the threshold set at G2 from fixtures |
| `tool-default` | times 0 | The value matches a pinned tool default (case 4), for a preference reading only |
| `single-signal` | times 0.8 | A model reading that names one quote or measure only |

Every number in this table is a hypothesis (section "Hypotheses"). The floor is decision D3: 0.5.

**What the numbers do at the floor of 0.5.** `single-signal` (times 0.8) is the one mild factor; the others are 0.7 or lower. A rule or model reading starts at 0.7. With one mild factor it stays above the floor (0.7 times 0.8 = 0.56). With one strong factor it falls below (0.7 times 0.7 = 0.49). With any two factors it falls below (at most 0.7 times 0.8 times 0.7 = 0.392). A measure (1.0) stays at or above the floor with any one quality factor (0.5 at the lowest, which is not under it) and falls below with two factors of 0.7 (0.49). `tool-default` (times 0) drops any preference reading to 0. Rows 3, 12 and 32 hold these numbers. A model reading and a rule reading share the base; the `fromModel` label, the model id and `single-signal` keep them apart.

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
| `competitive-frame.lineup-candidate` | `competitive-frame` (5) | Proposed `{ name, hex }` entries; only entries the person confirms join the lineup `auditLineup` reads (ORV-20) |
| `reference.asset` | `color` (15) | Input to `similarityCheck` on the decided signature |

Rules of the feed:

1. **A model never decides, and neither does evidence.** Evidence never sets a node to `given`, `derived`, `decided` or `confirmed`, never fills an input, and is never passed to a decision rule (`decideColor` and the later node rules take no evidence argument). A reading becomes a value only when the person confirms it; the input is then `given` with the evidence ids in its trace (row 19).
2. **Below the floor is absent.** An item with `belowFloor: true` stays in the node's evidence list, shown with its reasons, but counts as no support: the node asks its questions as if the item were not there (row 24).
3. **Conflicts ask.** A `conflict` flag adds `evidence.conflict` to the node's questions; neither side counts as support until answered (case 1).
4. **The ORV-20 colour node is unchanged.** It still reads only a confirmed lineup and the personality vector. Evidence reaches it as confirmed lineup entries and as values the person set from evidence, never directly. No ORV-20 source file changes.
5. **Each list is sorted by node number, then evidence id**, so the same input gives the same state (ADR 0007 decision 5).

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
- `read.refused.robots`: en "This site asks automated readers not to read this page, so we did not read it."; th "เว็บไซต์นี้ขอไม่ให้โปรแกรมอัตโนมัติอ่านหน้านี้ เราจึงไม่ได้อ่าน"
- `read.refused.address`: en "We can read only public web addresses."; th "เราอ่านได้เฉพาะที่อยู่เว็บสาธารณะเท่านั้น"
- `quality.fewWords`: en "the text has fewer than 20 words"; th "ข้อความมีไม่ถึง 20 คำ"
- `quality.pageIncomplete`: en "part of the page did not load"; th "บางส่วนของหน้าเว็บโหลดไม่สำเร็จ"
- `quality.imageSmall`: en "the image is under 512 px on its short side"; th "ภาพมีด้านสั้นไม่ถึง 512 พิกเซล"
- `quality.imageBlurred`: en "the image is blurred"; th "ภาพไม่คมชัด"

## Delivery: vertical slices

Each slice is one PR of about 400 changed lines, usable through the engine API or the command. Slices after the first get their own Jira issues, each with a spec that links back here (L-0016). The order follows decision D2.

<!-- prettier-ignore -->
| Slice | Delivers | Rows | Waits on |
| --- | --- | --- | --- |
| 1 | The evidence schema and confidence calculation; the URL analyser: safe single-page read, robots.txt, the renderer, colour, contrast, density and font measures, `lexicon-1` and `measure-to-lean-1` readings; the strings | 1 to 12, 29 to 32 | D1, D2, D3, D6; the renderer choice at G2 |
| 2 | Industry: match terms from TSIC names, candidates by name match, the code check, matched level and roll-up; `pnpm analyse:url` with measures, personality and industry | 13 to 17, 29 to 31, 33 | ORV-127 slice 1 (the TSIC 2009 code list) |
| 3 | Model readings for the URL analyser through `interpret` and `see`: industry candidates, personality, mood words from `mood-1`, with evaluation sets; the acceptance test passes | 17, 18, 20, 29 to 31 | D4; ADR 0009 eval sets; `security` review (ADR 0015 decision 2) |
| 4 | Brief text analyser; cross-analyser conflicts; Thai culture flags; `feedEvidence` into the ORV-126 state | 19, 21 to 24, 29 to 31 | ORV-126 slice 1 (node ids) for row 24's graph check |
| 5 | Mood photo analyser with image bounds and quality factors | 25, 26, 29 to 31 | D5 |
| 6 | User HTML analyser in the sandbox, with the tool-default list | 27, 29 to 31 | The upload rules of ADR 0015 decision 11 |
| 7 | Another brand's CI analyser and `similarityCheck` | 28, 29 to 31 | D5 |

If slice 1 runs over the budget at G2, it splits into 1a (schema, confidence, safe read) and 1b (measures and readings), keeping its rows. Function and file names are suggested; the G2 design may rename them, and each named test keeps its name.

## Acceptance criteria

In the POC the person sees the analysers' result through the engine API or the command; no row renders a screen. Every test uses recorded inputs and a fake network; none reaches the internet or a model (ADR 0009 point 8).

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Test | Slice |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | An evidence item valid at each bound (a 300-character quote, confidence 0 and 1, an empty `basedOn`, a `fromModel` item with its `model`) | Parsing with `inputEvidenceSchema`, then a JSON round trip | Parses; the round trip is deep-equal | None | `evidence.test.ts` › "a valid item" | 1 |
| 2 | Items with, in turn: an extra key `html`, `css`, `screenshot`, `pageText` or `score`; `fromModel: true` with a `measure`; `fromModel: true` with `model: null`; `fromModel: false` with a `model`; a 301-character quote; confidence 1.2; an unknown `observation.kind` or reading target; `hypothesis: true` with `hypothesisNote: null` | Parsing | Each fails with the path of the bad field (`html`, `measure`, `model`, `observation.quote`, `confidence.value`, `observation.kind`, `reading.target`, `hypothesisNote`) | None | `evidence.test.ts` › "bounds and forbidden fields" | 1 |
| 3 | A measure with `page-incomplete`; a model reading with `few-words` and `single-signal`; a floor of 0.5 | `scoreConfidence(item)` | 0.7 with `belowFloor: false`; 0.392 (0.7 times 0.7 times 0.8) with `belowFloor: true`; each lists its factors | None | `evidence.test.ts` › "confidence is computed, never reported" | 1 |
| 4 | The same recorded page bytes and clock twice; then the stylesheets supplied in another order | The URL analyser | Deep-equal results with equal ids; evidence sorted by kind, then locator | None | `url-analyser.test.ts` › "same input, same evidence" | 1 |
| 5 | URLs `ftp://a.b`, `javascript:x`, `http://127.0.0.1/`, `http://10.0.0.5/`, `http://169.254.169.254/`, `http://[::1]/`, a host the fake resolver maps to `192.168.1.2`, and a public page that redirects to a private address | `readPage(url)` | Each refused with `read.refused.address` and no evidence; the fake network records no request to a non-public address | None | `read-page.test.ts` › "public addresses only" | 1 |
| 6 | robots.txt that disallows the path for `*`; one that disallows it for `oriviloreader` in lower case; one answering 503; one answering 404 | `readPage` | First three: refused with `read.refused.robots`, no request for the page; the fourth: the page is read | None | `read-page.test.ts` › "robots.txt first" | 1 |
| 7 | A recorded page with 12 linked stylesheets, a 3 MB document, links to other pages and a 4-step redirect chain | `readPage`, inspecting the fake network log | No request carries a cookie or authorization header; every request's user agent holds `OriviloReader/1` and the contact URL; at most 10 stylesheets fetched; the document cut at 2 MB with `page-incomplete`; no other page and no image, font or script fetched; the fourth redirect refused | None | `read-page.test.ts` › "one page, logged out, bounded" | 1 |
| 8 | A recorded fixture page with known colours, text and fonts | The URL analyser | `colour-area` items whose `area-share` sums to 1 within 0.001, each with its ORV-20 hue band; a `contrast-ratio` for the body text pair; `text-density` and `element-density`; `font-family` for headings and body; every item `fromModel: false` with a `measure` and a `locator` | None | `url-analyser.test.ts` › "measures by code" | 1 |
| 9 | The result of row 8 | Inspecting every field | No field holds the HTML, the CSS or an image; every quote is 300 characters or fewer and equals the page text at its locator; `source.contentHash` is the SHA-256 of the bytes read; nothing is written to disk, Storage or the database | None (in memory) | `url-analyser.test.ts` › "kept only as evidence" | 1 |
| 10 | A fixture page whose heading reads "premium and calm"; another with "ไม่หรูหรา"; a third with "not too premium" | The URL analyser | Readings `identity-frame.personality.premium` lean `high` (from 75), lean `low` (from 15) and lean `low` (from 40), `by: rule` with rules `lexicon-1` and `value-to-lean-1`, `fromModel: false`, each quoting the page text; the third has `hypothesis: true` and a `hypothesisNote` naming the "not too" rule; no item holds the 0 to 100 value | None | `url-analyser.test.ts` › "rule-based personality from page text" | 1 |
| 11 | A fixture page painted 70 percent in warm hue bands | The URL analyser | A reading `identity-frame.personality.warm` lean `high`, `by: rule` with rule `measure-to-lean-1`, `hypothesis: true`, `basedOn` naming the `warm-share` measure | None | `url-analyser.test.ts` › "measured leans are hypotheses" | 1 |
| 12 | A fixture page with 12 words and one stylesheet that fails | The URL analyser with a floor of 0.5 | Its readings carry `few-words` and `page-incomplete`; the `lexicon-1` reading is 0.343 with `belowFloor: true`; the quality reasons are `quality.fewWords` and `quality.pageIncomplete` | None | `url-analyser.test.ts` › "low quality lowers confidence" | 1 |
| 13 | The TSIC 2009 module of ORV-127, where `86202` is named "กิจกรรมคลินิกโรคเฉพาะทาง", and a fixture page of 20 words or more, fully loaded, whose heading holds "คลินิกโรคเฉพาะทาง" | `readIndustry(evidence, taxonomy)` | The match term "คลินิกโรคเฉพาะทาง" (the name less its leading "กิจกรรม", rule `tsic-terms-1`) is found; code `86202`, level 5, its full names from the module, confidence 0.7, and the evidence id of the quote "คลินิกโรคเฉพาะทาง"; a page holding only "กิจกรรม" matches no code | None | `industry.test.ts` › "a name match gives the code" | 2 |
| 14 | Candidates `86202` (0.7) and `86201` (0.65); then `86202` (0.7) and `56101` (0.65) | `readIndustry` | First: `8620`, level 4, naming both candidates; second: `ambiguous` with question `industry.confirm` and both codes as choices, and a `conflict` flag on both items | None | `industry.test.ts` › "roll up or ask" | 2 |
| 15 | Candidates `84110` (excluded division) and `00000` (unknown) beside a valid `86202` | `readIndustry` | `86202`; the two others listed as `invalid-code`, never returned as the industry | None | `industry.test.ts` › "only real, brand-relevant codes" | 2 |
| 16 | No taxonomy passed | `readIndustry(evidence, null)` | `{ status: "awaiting-taxonomy" }`, no code, no level | None | `industry.test.ts` › "no taxonomy, no guess" | 2 |
| 17 | The recorded fixture site `clinic-th` | `pnpm analyse:url --fixture clinic-th --role own`, and with `--json` | Prints industry (code, level, names, confidence), personality per axis (lean or `no signal`), mood (slice 3 on), and for each reading its rule or model id, its quotes or measures and its factors; the JSON parses with the report schema; exit 0 | None | `analyse-url.test.ts` › "the owner's acceptance report"; the live run in the G3 packet | 2, 3 |
| 18 | Recorded `interpret` and `see` answers for the fixture page; then an answer with an extra key `confidence`; then one quoting words not on the page | The URL analyser with model readings on | First: readings with `fromModel: true`, the pinned model ids, label key `evidence.fromModel`, base 0.7; page text sent only as the user message, never in the instructions. Second and third: the whole answer refused, the rule-based readings stand and say `by: rule` | None | `url-analyser.test.ts` › "model readings are labelled and checked" | 3 |
| 19 | An ORV-126 state and model readings above the floor for every personality axis and for `situation.tsic`, none confirmed | `feedEvidence(state, items)`, then `planFill` | Each node's `evidence` lists the items; no node status changes; no input holds a value; `identity-frame` still asks its proxy questions; after the person confirms one reading, that input is `given` with the evidence ids in its trace | Node records in memory only | `evidence-feed.test.ts` › "evidence never decides" | 4 |
| 20 | A `mood-1` fixture holding "calm" and "luxurious", and a recorded model answer with mood words "calm", "luxurious" and "zxq" | Parsing the mood readings | Words in `mood-1` kept; a word outside it listed as `not-understood`, never a reading | None | `url-analyser.test.ts` › "mood words from a closed list" | 3 |
| 21 | The brief "ORIVILO helps Thai founders build a brand. Competitors: Brand X (`https://x.example`), Brand Y" | The brief analyser with a recorded `interpret` answer | Readings `situation.name` "ORIVILO" and `situation.competitors` "Brand X" and "Brand Y", each with a span equal to the brief text, proposed, not given; the URL recorded as text; under D1 (a) no request to `x.example` | None | `brief-analyser.test.ts` › "names proposed, competitor pages not read" | 4 |
| 22 | A brief reading premium lean `high` (0.7) and a URL model reading premium lean `low` with `single-signal` (0.56); then the same with the URL reading also carrying `few-words` (0.392) | Combining both analysers with a floor of 0.5 | First: both flagged `conflict`, `identity-frame` gets `evidence.conflict` with both as choices, neither counts as support. Second: no conflict; the high lean stands; the low one is shown below the floor | None | `evidence-feed.test.ts` › "a conflict becomes a question" | 4 |
| 23 | Own-brand dominant colours: a yellow-band colour beside a teal one; a red-band colour alone; a teal colour alone | The culture check | `culture.yellow` on the first; `culture.political` on the second; nothing on the third; every colour kept, none removed, no node blocked | None | `evidence-feed.test.ts` › "Thai colour culture asks, never bans" | 4 |
| 24 | Items with targets across every row of the feed table, one item below the floor; the ORV-126 graph | `feedEvidence` | Every target maps to a node id in `BRAND_GRAPH`; the below-floor item is listed with its reason and the node's open questions are the same as with no evidence; lists sorted by node number then evidence id | Node records in memory only | `evidence-feed.test.ts` › "below the floor is absent" | 4 |
| 25 | A fixture photo of a warm beach scene | The photo analyser | `image-property` measures (palette, lightness, chroma, `warm-share`, short edge, sharpness); readings only on `identity-frame` and `look-feel`; no item targets `color.current` or `competitive-frame.lineup-candidate` | None | `photo-analyser.test.ts` › "photo colours become personality first" | 5 |
| 26 | A JPEG named `a.png`; a GIF, a HEIC and an SVG; a 5 MB PNG; 11 images; a 400 px wide image; a JPEG with EXIF location | The photo analyser | The JPEG judged by its bytes and read; the GIF, HEIC and SVG refused by content; the 5 MB file refused; the 11th image refused; the small image carries `image-small`; the bytes sent to the recorded `see` call carry no EXIF and a long edge of at most 1568 px | None | `photo-analyser.test.ts` › "image bounds" | 5 |
| 27 | A fixture default list holding `#6366F1` and the font Inter (fixture values, not the pinned list, until G2 pins its sources and versions); an uploaded HTML file with a `<script>`, an `<img src>` to an outside host, the colour `#6366F1`, the font Inter, and a colour off the list | The HTML analyser | No script runs and the fake network sees no request; the measures as in row 8; `#6366F1` and Inter carry `origin: tool-default`, their preference readings have factor `tool-default` and confidence 0, and the node gets `evidence.toolDefault`; the other colour feeds `color.current` | None | `html-analyser.test.ts` › "tool defaults are not preference" | 6 |
| 28 | Reference images from "Brand Z" whose dominant colour is a cyan; candidates: a cyan within CIEDE2000 6 of it, a cyan 14 away, and a lime | The reference analyser, then `similarityCheck` | Items with `ownedBy: other` and the brand name; no item targets an own-brand value; a lineup candidate labelled `reference`; the first candidate flagged `evidence.similarTo` naming "Brand Z", the other two not; the result states that logo shapes are not compared | None | `reference-analyser.test.ts` › "another brand's assets are checked, never copied" | 7 |
| 29 | Every string key in "Strings" and every question key an analyser emits | Reading their text | Each has non-empty `th` and `en`; neither holds an em dash or a middot | None | `evidence.test.ts` › "every string is Thai and English" | each |
| 30 | The schema, confidence, measure, industry, check and feed modules | Scanning their source | None imports `openrouter` or `llm-interpreter`, `Math.random` or `Date.now`; only the model-reading adapters import `openrouter`; tests use a fake network and recorded answers | None | `evidence.test.ts` › "measures never call a model" | each |
| 31 | The repo after each slice | `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, and CI | All pass; `pnpm contrast` output unchanged from `develop` | None | Quality gate output in each G3 packet | each |
| 32 | A floor of 0.5 and model readings (base 0.7): one with `single-signal` only; one with `few-words` only; one with `single-signal` and `page-incomplete` | `scoreConfidence(item)` | 0.56 with `belowFloor: false`; 0.49 with `belowFloor: true`; 0.392 with `belowFloor: true`; each lists its factors | None | `evidence.test.ts` › "one mild factor stays, two fall" | 1 |
| 33 | Candidates `86202` (0.9) and `56101` (0.6), from different TSIC sections and 0.3 apart | `readIndustry` | Code `86202`, level 5; `56101` listed as an alternative with its confidence; no `conflict` flag, no `industry.confirm` question | None | `industry.test.ts` › "outside the margin the top code wins" | 2 |

## Rules and bounds

- **Measures by code, readings labelled.** Colour proportions, contrast, density, fonts, image properties and word counts come from code. Mood words, personality signals and industry candidates may come from a model and then carry `fromModel: true` and the model id. A model never measures, never decides, and its certainty is never read.
- **Purity.** Schema, confidence, measures, the industry check, the similarity, culture and tool-default checks and the feed are pure TypeScript in `packages/intent-engine` that take bytes and a clock as arguments. The page fetch, DNS resolution and the renderer are server-only and sit where the G2 design puts them; no client code fetches a page or calls a model.
- **Untrusted input.** Page text, HTML, brief text and text inside images are data. They go only in the user message of a model call, never in the instructions (ADR 0015 decision 3, LLM01:2026); model output is parsed strictly and quotes must equal the input (ADR 0008).
- **Model jobs.** `interpret` keeps zero retention; `see` allows Google's safety retention only (ADR 0009 addition). Each job used here has a rate limit per person through the ORV-112 helper (ADR 0015 decision 4), proposed at slice 3's G1. No silent fallback to another model; on failure the rule-based readings stand (ADR 0009 point 3).
- **Images.** ADR 0009 point 5: PNG, JPEG or WebP by magic bytes, 4 MB each, at most 5 per model request (an analysis of 10 images makes two), long edge at most 1568 px, EXIF stripped, never public links. In the POC the command reads local files; the first upload route carries ADR 0015 decision 11.
- **HTML.** 1 MB at most, rendered with scripts off and network blocked, never served inline.
- **Nothing persisted in the POC.** Results live in memory and on standard output.
- **Determinism.** The code part of a result is the same for the same bytes and clock; every list is sorted.
- **No IP claim.** No result says a colour, font or mark is free to use, unique or cleared; the similarity check covers colours and font names only.
- **Industry is context.** The TSIC reading never feeds a colour, type or logo rule.

## Hypotheses (below confidence 0.7, or no source)

- The confidence bases (1.0, 0.7, 0.7) and every factor value: ours, no source; to be checked against labelled fixtures. The model-reading base of 0.7 was set in v1.2 so that the stated intent of D3 holds (see D3).
- `value-to-lean-1`, and in particular reading "not too" (40) as lean `low`: ours, no source.
- `tsic-terms-1`, the match terms made by dropping a leading `กิจกรรม` or `activities of` from TSIC names: ours, no source; the curated term list per code that replaces it carries a source per term.
- The tool-default list (case 4, slice 6): its entries, sources and versions are not pinned yet (G2 must-ask); until they are, `#6366F1` and Inter in row 27 are fixture values, not claims about any tool.
- `measure-to-lean-1` (warm share to warm, chroma to expressive): no source links measured colour to these axes; a peer-reviewed abstract says hue, saturation and value shift perceived personality (K-0038, 0.7) but its mappings were not read, so no mapping rests on it.
- The five personality axes themselves (ORV-126 decision D6, no source).
- `mood-1`, the closed list of mood words: ours.
- The similarity threshold (CIEDE2000 10 in the same hue band) and the tool-default tolerance (CIEDE2000 2).
- The industry roll-up margin of 0.1.
- The 512 px short edge and the blur threshold.
- ORV-20's hue bands (engine entry `color.hue-families`, 0.4), which the measures reuse.

## Out of scope

- Any screen or upload UI (POC focus is function).
- Crawling, link following, reading more than the one submitted page, and every ORV-127 channel.
- Reading a competitor's page under D1 (a); the lawyer review in ORV-127 D2.
- PDF and other document inputs; video; text recognition inside images by code.
- Comparing logo shapes or any trademark search.
- Persistence of evidence (E2-12) and sharing evidence across workspaces.
- Any change to ORV-20's `auditLineup`, `decideColor` or rules, or to ORV-127's record schema.
- Drafting options from evidence (ORV-126 D1 step 2 stories).

## Owner decisions (decided at G1)

The owner decided D1 to D7 at G1 (ORV-128 comment 10209, on the packet in comment 10208): D1 to D4 as recommended, and D5 to D7 follow the recommended options. A change after G1 bumps this spec's version. In v1.2 the orchestrator, not the owner, raised the model-reading base from 0.6 to 0.7 under the owner's D3, because at 0.6 the reason given for the 0.5 floor did not hold (0.6 times 0.8 = 0.48 is under 0.5); the floor stays the owner's 0.5, and the adjustment is open for the owner at G2. The ADR 0008 addition under D6 (a), for a computed confidence number, is decided at G2 by the ds-architect ([ADR 0008](../../adr/0008-brief-interpreter-adapters.md)).

<!-- prettier-ignore -->
| # | Question | Options | Decided | Impact |
| --- | --- | --- | --- | --- |
| D1 | Read a single page the person submits before the ORV-127 lawyer review? | (a) yes for the person's own brand and for references; a competitor URL is recorded as text and waits for the review; (b) yes for every role, competitors included; (c) no page read until the review | (a): the person asks for one page at a time, and competitor reading is ORV-127's user channel, which you sent to the lawyer; you carry the remaining risk for single pages | Slice 1 can ship; row 21; under (c) slices 1 to 3 read recorded fixtures only and the live acceptance run waits |
| D2 | Which analysers in the first slice, and with a model? | (a) evidence schema plus the URL analyser with code measures and rule-based readings, no model; (b) the same plus model readings; (c) schema plus the brief text analyser | (a): it proves the shared shape and the measures offline, and keeps the first model call in a slice with its eval set and `security` review | Slice order in "Delivery"; the acceptance test passes at slice 3 |
| D3 | The confidence floor below which the graph treats evidence as absent | 0.3, 0.5 or 0.6 | 0.5 (owner). Reason, with the v1.2 base: a model reading starts at 0.7 and survives one mild factor (times 0.8 gives 0.56) but not two (0.7 times 0.8 times 0.7 gives 0.392), nor one strong factor (0.49); a rule reading on a 12-word text drops out (0.49). The base of 0.7 is the orchestrator's adjustment, open for the owner at G2 | Rows 3, 12, 18, 22, 24, 32 |
| D4 | Show readings to the person, with the from-model label? | (a) show every reading with its label, model id, evidence and confidence, as a suggestion to confirm, once its job's eval set has passed; (b) show code measures only and hide model readings; (c) show nothing until confirmed | (a): honest about what AI read and lets the person correct it (ADR 0015 decision 3, LLM07:2026) | Row 18; the strings; a later screen |
| D5 | Image input size and format limits | (a) ADR 0009 point 5 (PNG, JPEG, WebP by magic bytes, 4 MB, long edge 1568 px, EXIF stripped), at most 10 images per analysis, full confidence from a 512 px short edge; (b) also HEIC and PDF pages; (c) 2 MB and 5 images | (a): it reuses the bounds the model calls already need | Rows 26 and 28 |
| D6 | A computed confidence against ADR 0008's "no confidence score" | (a) a number computed by code from a base and named factors, with an addition to ADR 0008 by the architect at G2; (b) levels only (`measured`, `supported`, `weak`), no number | (a): the method is in the trace and the owner asked for a floor | The schema, rows 3 and 12, ADR 0008 |
| D7 | Lane | L or M | L: a new contract every node reads, outside reads and model calls | G1 and G2 under ADR 0012 decision 4 |

## Gap list

- **Business:** closed by ORV-126 comment 10202 and ORV-128 (input kinds, evidence shape, six cases, acceptance test).
- **Functional:** specified above. Assumed: `mood-1` contents (drafted in slice 3, reviewed by the designer and the owner), the copy above.
- **Technical:** must-ask at G2, not G1: the renderer (headless browser on a server function, or a fallback measure of declared colours labelled as such) and where the server-only fetcher lives; the ADR 0008 addition under D6; the tool-default list's pinned sources and versions.
- **UX:** not applicable in the POC; strings drafted for review.
- **Data and security:** assumed: nothing persisted; the address check and robots.txt rules above; `security` reviews slices 1, 3, 5, 6 and 7 (outside reads, model calls, uploads).
- **Risk:** single-page reads carry legal exposure the owner accepts under D1 (a); readings rest on hypothesis-grade rules; model readings may be wrong and are labelled.

## Open questions (with the default used until answered)

- **The reader's contact URL.** Default: a page on the ORIVILO domain that the release story publishes, describing the reader and how to opt out; until it exists the user agent carries the repository URL.
- **Images on a read page.** Default: not fetched, so colour measures cover what CSS paints and say so; revisit when the lawyer review lands.
- **Where the renderer runs.** Default: decided by the architect at G2 against Vercel function limits.
- **Whether the TSIC reading also feeds `lineupFor` automatically.** Default: no; the person confirms the code first.

## Depends on

- [ORV-126 spec](../ORV-126/spec.md) v1.4: the three layers, the node graph, the `evidence` field on node records, the propagation rule, decision D1 (nothing filled without the person) and D6 (the five axes, hypothesis).
- [ORV-127 spec](../ORV-127/spec.md) v1.2: the TSIC 2009 module (slice 1) and its Thai and English names, `isBrandRelevant`, collection rules R6 to R13 (R12, the user channel, for another brand's page), decisions D2 and D3, comment 10201.
- ORV-20 (PR 112): the hue bands, `auditLineup` and `decideColor`, which return questions when input is missing.
- [ADR 0008](../../adr/0008-brief-interpreter-adapters.md) (adapters, evidence spans, `lexicon-1`), [ADR 0009](../../adr/0009-ai-through-openrouter.md) (jobs `interpret` and `see`, image bounds, no fallback, recorded tests), [ADR 0015](../../adr/0015-standards-and-required-controls.md) (AI controls, rate limits, uploads), ADR 0007 (fingerprint), ADR 0012 (gates), [ADR 0018](../../adr/0018-image-generation-provider.md) (no image is generated here; listed because `see` and the image jobs share the Google model host).
- ORV-112 (rate limit helper).
- Knowledge: K-0026, K-0027 and K-0021 (architecture); K-0028, K-0036, K-0038, K-0039, K-0040 and K-0070 (brand); K-0053, K-0054 and K-0056 (market).
- `docs/context/orivilo-brief.md` (starting assets vary; collect before generating).

## Downstream review if this spec changes

- ORV-126 spec: its inventory gains proposed facts from evidence and a `tsic` fact on `situation`; its open question on how the TSIC section reaches `touchpoints` gets layer 1 as a proposer.
- ORV-127 spec: the single-page read under D1 is stated beside its channels; no rule of ORV-127 changes.
- ADR 0008: an addition under D6.
- ADR 0009: `see` gains its first use; its eval set lands in slice 3.
- `.claude/rules/security.md`: rule 10 (uploads) applies to slices 5 to 7.

## Changelog

- v1 (2026-10-26): first spec. Evidence schema, five analysers, six cases, the owner's acceptance test, the single-page read and how it differs from ORV-127's bulk reading, the confidence method, the feed into the ORV-126 graph and the ORV-20 colour node, seven slices, rows 1 to 31, owner decisions D1 to D7.
- v1.1 (2026-10-26): G1 decisions recorded as decided (ORV-128 comment 10209): D1 (a), D2 (a), D3 0.5, D4 (a), D5 (a), D6 (a), D7 L; the decisions column reads Decided; the ADR 0008 addition for a computed confidence number is decided at G2 by the ds-architect. No row, rule or slice changes. Review: none downstream beyond ADR 0008 at G2.
- v1.2 (2026-10-26): reviewer findings F1 to F8 on PR 118. F1: the model-reading base rises from 0.6 to 0.7 (the orchestrator's adjustment under the owner's D3, floor kept at 0.5, open for the owner at G2); the D3 reason states the real arithmetic; rows 3, 18 and 22 take the new numbers; new row 32 (one mild factor stays, two fall). F2: rule `tsic-terms-1` turns TSIC names into match terms, a curated term list per code is a later slice; row 13 follows it. F3: one industry conflict rule, only pairs within the 0.1 margin ask, in case 1 and "Industry"; new row 33. F4: rule `value-to-lean-1` maps every `lexicon-1` value to a lean, 40 to `low` as a hypothesis; row 10 adds "not too premium". F5: reading a reference brand's page is the same user-named read as ORV-127 R12, and D1 (a) accepts that risk for references while competitor URLs wait. F6: `hypothesisNote` gets its own schema row; row 2 adds its failure. F7: ORV-127 cited at v1.2. F8: row 27's default list is fixture values until G2 pins it; the list joins Hypotheses. Review: builders of slices 1, 2, 3, 4 and 6 (rows 2, 3, 10, 13, 18, 22, 27, 32, 33); ADR 0008 addition at G2 (the bases it describes); the owner at G2 for the base adjustment.
