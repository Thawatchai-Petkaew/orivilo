---
issue: ORV-298 (https://tpetkaew.atlassian.net/browse/ORV-298)
lane: L (risk flags: stored workspace data, three new entry kinds in the existing foundation tenant table and a migration per part that widens its pair check; a new contract on the business nodes, three new nodes with their inputs, states and marks; decision rules of the engine shown to a person, a new logo type rule, a new typography rule and an adapter around ORV-20's colour rules; asset licensing, every typeface the typography rule can name)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.5
---

# ORV-298: the expression rules, logo type, colour and typography worked out by fixed rules

## The whole plan before this story

The plan is ORV-126's POC set (decision D3) in its fill order for group A ("Fill order", rule 1 for `situation`, then the plan line "With the POC set and group A, the plan is"). Thirteen nodes and the guidebook, fourteen rows, read top down. State on 2026-11-20.

<!-- prettier-ignore -->
| Order | Node (ORV-126 no.) | What the product has today | What this story adds | What stays for a later story |
| --- | --- | --- | --- | --- |
| 1 | `situation` (1) | On staging: the business board with the industry and website answers (ORV-281, ORV-282, ORV-283) | Nothing | The entry classifier (ORV-126 slice 2) |
| 2 | `business-core` (3) | On staging: the person's answer and the AI reading (ORV-281, ORV-283) | Nothing | A value the person writes or picks |
| 3 | `audience` (4) | On staging, as `business-core` | Nothing | As `business-core` |
| 4 | `competitive-frame` (5) | On staging, as `business-core`, with no competitor colours (`business.competitors.coloursNotRead`) | Part 1: the competitors' main colours, given by the person in the Colour view (`lineup-input-1`, open question 1) | Colours read from competitor sites; a written or picked value |
| 5 | `positioning` (6) | On staging: the gate by hand, write or skip (ORV-285 PR 1); drafted options in build (ORV-292) | Read as a root, through the nodes between (`expression-roots-1`) | ORV-292 |
| 6 | `identity-frame` (7) | On staging: two proxy questions, the five axes, a skip (ORV-291 PR 1: PR 232 into `develop`, release PR 233 into `main`) | Read by Colour and Typography | Drafted options (ORV-291 open question 1) |
| 7 | `architecture` (8) | In build (ORV-295, ORV-291 PR 2) | Read by Logo type (part 3) | Groups C and D |
| 8 | `name` (9) | In build (ORV-295, ORV-291 PR 2) | Read by Logo type for its length (part 3) | Naming as a strategy output; `ip-screen` |
| 9 | `core-idea` (11) | Not built (ORV-296, ORV-291 PR 3, not started) | Nothing; none of the three nodes of this story requires it | ORV-296 |
| 10 | `logo-type` (13) | Not built | Part 3: one question and a rule (`logo-type-1`) | Letterform marks, emblems, dynamic marks; trademark crowding (`ip-screen`) |
| 11 | `logo-mark` (14) | Not built | Nothing | Its own story (D8, ADR 0018 proposed) |
| 12 | `color` (15) | Rules in the engine only (ORV-20 slice A, `color-rules.ts`, `color-audit.ts`), no node on the board | Part 1: the Colour node on the board (`color-node-1`) | The role palette with values per mode (ORV-125, parked); the Thai colour culture check |
| 13 | `typography` (16) | Not built | Part 2: one question and a rule (`typography-node-1`) | More families (open question 4); a personality link (open question 5); the Thai script coverage check |
| 14 | `guidebook` (21) | Not built | Nothing | The assembly (ORV-126 slice 4) |

Counts on the base of these 14 rows: 6 on staging (rows 1 to 6), 0 in develop only, 2 in build (rows 7 and 8), 1 as engine rules only (row 12), 5 not built (rows 9, 10, 11, 13 and 14). This story adds 3 nodes (rows 10, 12 and 13). Once this story, ORV-295 and ORV-296 are all in, 12 of the 14 are on the board and 2 are not (`logo-mark`, `guidebook`). "Worked examples", W1.

What is excluded, and why: ORV-126 nodes 2, 10, 12, 17, 18, 19, 20 and 22 are outside the POC set (D3). `look-feel` (12) opens step 5 of the fill order and is out by D3; ORV-126 node 12 says the three nodes of this story run without it and say so.

## Why

ORV-126 "Fill order", rule 5, puts expression after the strategic core: `look-feel`, then `logo-type` before `logo-mark`, then `color` and `typography`. Decision D3 keeps `logo-type`, `color` and `typography` in the POC, and ORV-126's harness part 4 names them as the nodes decided by closed rules: `color` by ORV-20 slice A (merged as is and wrapped by an adapter, D7), `logo-type` and `typography` in their own stories. This story is those three: on a saved business project, each node works out its decision from values the project already stores, with its reason, asks the person a question when an input is missing, and carries the marks of what it rests on, on the same board and in each node's viewer. `logo-mark` sits between them in the fill order and is its own story (D8): image drafts by a model, which this story never calls.

The decisions come from sources where sources exist: a logo emphasises the name by default and a symbol needs a reason such as a long name, many units or a need for a shorthand (K-0037, 0.85); the colour of a brand is chosen against the category's colours (K-0039, 0.75, the stronger source ORV-126 names for `color.audit-the-category`); Thai text takes a looped style for reading and a loopless style for display, and either pairs with a Latin sans or serif (K-0042, 0.85). The order itself is K-0044 §3 (0.75).

This story is not a guard on a tool call, so the guard frame does not apply.

### What is real, rule-based, hypothesis-grade and simulated

- **Real (once built):** the three inputs the person gives and their saved entries, the three nodes on the board with their views, the decisions computed from what is stored, the marks.
- **Rule-based, not AI:** every decision of this story. Colour by ORV-20's `decideColor` and `auditLineup`, unchanged (`color-node-1`); typography by `typography-node-1` over the families of `typography-families-1`; the logo type by `logo-type-1` with `name-length-1`; the marks by ORV-291 `foundation-marks-1` grown by `expression-marks-1`. Each decision says "Worked out by a fixed rule" and never says AI read or decided it. No part of this story calls a model.
- **Hypothesis-grade:** the five personality axes (ORV-126 D6, no source); ORV-20's thresholds, crowd rule and four candidate colour families (ORV-20 decision 8, engine entries at 0.4); what counts as a long name (`name-length-1`, ours, no source gives a number); any link from personality to a typeface, which this story does not make (open question 5). Each carries its label (`expression-honest-1`).
- **Given by the person, never read:** the competitors' main colours. They are the person's own words about other brands; nothing checks them against those brands' real colours (`business.color.givenByYou`).
- **Not done, and said so:** the colour is a family, not a colour value (`business.color.familyOnly`); every brand gets the same three typeface families in this version (`business.typography.oneChoice`); the logo type is not checked against similar trademarks (`business.logoType.crowdingNotChecked`); letterform marks, emblems and dynamic marks are never chosen (`business.logoType.otherTypes`).
- **Simulated:** nothing in the product. Storybook stories run on labelled fixture projects.

## Story

As a founder or product owner who is signed in and has a saved business with a personality and a working name, I want ORIVILO to work out my logo type, my brand's colour families and my typefaces from what I already gave, ask me only the few facts it still needs (whether I need a small square mark, my competitors' main colours, the scripts my brand writes in), and show each decision with the rule and the reason behind it, so that I see why each choice was made, a missing fact stays a question instead of a guess, and a decision that rests on a step I skipped or have not agreed to says so.

## Departures from ORV-126, ORV-20 and ORV-291

<!-- prettier-ignore -->
| No. | Source and what it says | This story | Open question |
| --- | --- | --- | --- |
| 1 | ORV-126 node 5 and 15: the lineup with each competitor's dominant colour is an input of `competitive-frame`, audited by `auditLineup` | The business project stores no competitor colours (ORV-281 `honest-business-1`); the person gives them in the Colour view, saved as a `competitive-frame` entry (`lineup-input-1`) | 1 |
| 2 | ORV-126 "The propagation rule": `color` requires `competitive-frame`, whose gaps would mark it | `competitive-frame` counts as done for the marks, as ORV-291 counts `situation`; a missing lineup shows only as the colour's question (`expression-roots-1`) | 9 |
| 3 | ORV-126 "Rules and bounds", State: a rule's result is `decided` | The board shows a rule's result with the result `derived` of `foundation-marks-1` and its line "Worked out by a fixed rule"; no new status | none |
| 4 | ORV-126 node 13: five logo types | `logo-type-1` chooses a wordmark or a symbol plus name only, the two K-0037 gives reasons for; the other three are never chosen | 12 |
| 5 | ORV-126 node 13: units to unite come from `architecture` | An answer "yes" leaves `architecture` open (ORV-291 `architecture-derive-1`), so `logo-type` waits; when it runs there is always one unit and the many-units reason never applies | none |
| 6 | ORV-126 node 16: inputs scripts, personality and roles; checks Thai script coverage | The rule reads the scripts and the roles; it reads no axis while one family serves each role and script (`typography-families-1`), and the `identity-frame` require stays; no coverage check runs | 4, 5 |
| 7 | ORV-126 node 16: whether the locale is shown as an assumption is decided in the `typography` story | `typography.scripts` is asked as a question with no preset (`typography-node-1`) | 3 |
| 8 | ORV-126 "Rules and bounds", State: nothing is persisted | The three inputs are saved per project as foundation entries; decisions are computed when the view is built and never stored (`expression-saved-1`) | 2 |
| 9 | ORV-20 "Out of scope": a person who disagrees has no override | Kept: no control changes a decision | 7 |

## Rules

### expression-roots-1

The roots the three nodes rest on, for `foundation-marks-1` as `expression-marks-1` grows it: `situation` and `positioning` count by ORV-291 `foundation-roots-1`, unchanged. `competitive-frame` (ORV-126 node 5) is a third root and counts as done on every saved project (departure 2), with no list of its own. ORV-126 number 5 sorts it in every mark list.

### expression-marks-1

ORV-291 `foundation-marks-1` runs over a graph grown by three nodes, each reading its ORV-126 requires: `logo-type` (13) reads `architecture` and `name`; `color` (15) reads `competitive-frame` and `identity-frame`; `typography` (16) reads `identity-frame`. Fill order and the sort of every list stay by node number. The marks are computed every time the view is built; no mark is stored ("Worked examples", W8).

Each node's own status before the rule runs: `derived` when every decision of the node is made (`color-node-1`, `typography-node-1`, `logo-type-1`); `open` otherwise. None is skippable (ORV-126 row 25).

How each result shows, in the view and as the state line of the card. This table is the one home of the lines of the three nodes; ORV-291's table stays the home of the four foundation nodes.

<!-- prettier-ignore -->
| Result | Decisions shown | State line | Mark lines (view only) |
| --- | --- | --- | --- |
| `blocked` | none | `business.state.waiting`, naming `blockedBy` | none |
| `derived` | every decision | `business.state.derived` | `strategy.provisional` and `business.marks.restsOn` when `provisionalOn` is not empty; `business.marks.unchecked` when `unchecked` is not empty |
| `open`, at least one decision made (`color` only) | the decisions made | `business.state.partly` | as for `derived` |
| `open`, no decision made | none | `business.state.needsAnswer` | none |

`{nodes}` is the list of node titles joined by `Intl.ListFormat` in the page's locale, type `conjunction`, as ORV-291 gives it. The input a node asks for, its saved answer and the colour audit show in every result, `blocked` included.

### expression-entry-1

Three entry kinds join ORV-291 `foundation-entry-1`, parsed the same way (strict, U+0000 dropped then trimmed) and sent through ORV-291 `foundation-door-1` with no change to its steps; step 5 checks the "Allowed when" column below.

<!-- prettier-ignore -->
| Node | Kind | Payload | Allowed when | Part |
| --- | --- | --- | --- | --- |
| `competitive-frame` | `lineup` | `lineup`: ORV-20's `lineupSchema`, unchanged (1 to 20 entries, each `name` and `hex`) | The node holds no `lineup` entry | 1 |
| `typography` | `answered` | `scripts`: one of `thai-latin`, `thai`, `latin` | The node holds no entry | 2 |
| `logo-type` | `answered` | `appIcon`: true or false | The node holds no entry, and the stored name is not long by `name-length-1` | 3 |

None depends on a block cause: each is a fact about the business the person can give while the node waits, as ORV-291 `architecture-derive-1` offers `situation.sub-brands`. A `skipped` kind on any of the three nodes is refused. Each entry is a new row and none is changed; changing an answer once given is out of scope (open question 2). The table's pair check (`node`, `kind`) is widened by each part's migration; the UNIQUE (`project_id`, `node`, `kind`) of ORV-291 tech notes D5 holds, so each input is given once.

### lineup-input-1

The competitors' main colours (part 1), asked in the Colour view.

- **Asked:** `business.question.lineup`, opened by `business.color.give` while `competitive-frame` holds no `lineup` entry, whatever the marks. The editor holds rows of two fields, `business.color.brandName` and `business.color.hex`, one empty row when it opens, `business.color.add` and, per row while the editor holds two or more rows, `business.color.remove` (none on the only row, `design.md` section 11 choice 6); then `business.color.save` and `business.positioning.cancel`, behaving as the editors of ORV-291 `identity-frame-1`. Each row is labelled `business.color.row`, `{n}` the row's place in the list counting from 1; `business.color.remove` takes the row's brand name as `{name}`, and that label while the row's brand name is empty. `business.color.crowdRule` sits under the question. The control for the colour is a text field for `#RRGGBB` by default; a colour picker is the designer's at G2 and adds no shared component in this story.
- **Checked before any call:** a row with both fields empty is not sent; a row with one empty shows `business.color.rowIncomplete`; no complete row shows `business.color.lineupRequired`; a colour that is not `#RRGGBB` shows `business.color.hexInvalid`; a name already in the list, ignoring case, shows `business.color.nameRepeated`; a name over 60 characters shows `business.intake.tooLong` with `{max}` 60; at 20 rows `business.color.add` is not offered and `business.color.lineupMax` shows. The text and the rows stay on every refusal.
- **Stored:** the names trimmed and the colours in upper case, as `lineupSchema` gives them. The names are never taken from the `alternatives` answer, from the AI reading of ORV-283 or from any model output.
- **Shown** under `business.field.lineup`: each name and its colour as text, with `business.color.givenByYou`; then, under `business.field.crowded`, the crowded families of `auditLineup` by their names (`business.color.family.*`) in the audit's order, or `business.color.noneCrowded`, with `business.color.crowdRule`.

### color-node-1

The Colour node (ORV-126 node 15, part 1). An adapter calls ORV-20's `decideColor` with the stored axes and the stored lineup, and changes no ORV-20 source file (ORV-126 "Where ORV-20 sits"; D7).

- **Input:** `facts.personality` the five axes of the newest `given` entry of `identity-frame`, as stored (0, 25, 50, 75 or 100); no axis when the node holds none. `lineup` the stored lineup, or `null`. No industry, audience or other fact goes in (ORV-126 "Rules and bounds": industry is context).
- **Decisions:** `signature`, `neutral` and `canvas`, each made only when `decideColor` gives it, with the rule that fired (the thresholds are ORV-20's "Color rules"; on the five scale points they fall as W3 shows; worked cases in W4). Each shows under its field (`business.field.signature`, `business.field.neutral`, `business.field.canvas`) as its value word (`business.color.family.*`, `business.color.neutral.*`, `business.color.canvas.*`), its reason line and `business.decision.rule` with the rule id. The reason lines:
  - `signature` by a rule of priority 80: `business.color.because.signature`; by a fallback rule of priority 70: `business.color.because.fallback`, `{preferred}` the family the priority 80 rule of the same band and warmth names;
  - `neutral`: `business.color.because.neutral`; `canvas`: `business.color.because.canvas`;
  - the placeholders `{expressive}`, `{warm}` and `{premium}` take the scale point the person chose (`axisPointOf`, 1 to 5).
- **Questions** (ORV-126 "Where ORV-20 sits", the adapter): `lineup` maps to `competitive-frame` and shows `business.color.waitsForLineup` in place of the signature, with `business.color.give` while it is offered; each `personality.<axis>` maps to `identity-frame` and shows `business.color.needsPersonality` once.
- **Open with no question:** when `decideColor` leaves `signature` open with a lineup and every axis given, both candidate families of that band and warmth are crowded; the signature shows `business.color.bothCrowded`. A result `conflicted` or `invalid` shows no decision and `business.color.notDecided`.
- **Status for `expression-marks-1`:** `derived` when the three decisions are made; `open` otherwise.
- **Never:** a hex value other than the ones the person gave; a guessed signature; a value for a decision `decideColor` left open.

### typography-families-1

The curated family list, the one home of every typeface this story can name. A family is listed only with its licence and where that licence is recorded in the repo.

<!-- prettier-ignore -->
| Id | Family | Script and style | Role | Licence | Recorded in the repo |
| --- | --- | --- | --- | --- | --- |
| `sarabun` | Sarabun | Thai, looped (`business.typography.style.looped`) | reading | SIL Open Font License 1.1 | `packages/design-system/src/tokens/fonts/LICENSE-sarabun.txt`; `docs/context/brand/orivilo-brand-spec-v1.1.md` section 6 ("looped Thai", "OFL") |
| `anuphan` | Anuphan | Thai, loopless (`business.typography.style.loopless`) | display | SIL Open Font License 1.1 | `packages/design-system/src/tokens/fonts/LICENSE-anuphan.txt`; `docs/context/brand/orivilo-brand-spec-v1.1.md` section 6 ("loopless Thai", "OFL") |
| `inter` | Inter | Latin, sans serif (`business.typography.style.latinSans`) | reading and display | SIL Open Font License 1.1 | `packages/design-system/src/tokens/fonts/LICENSE-inter.txt`; `docs/context/brand/orivilo-brand-spec-v1.1.md` section 6 ("Inter (Latin)", "OFL") |

Not listed, because no licence text for them is in the repo: the seven other families of ORV-61's mood list in `packages/intent-engine/src/suggest.ts` (IBM Plex Sans Thai, Noto Sans Thai Looped, Prompt, Kanit, Mitr, Mali, Trirong), each marked `OFL-1.1` there as data with a Google Fonts address and no licence file (open question 4). IBM Plex Mono has its licence file but is a code face, not a brand role. The list is data in the engine; the licence name shows as written, in both languages.

### typography-node-1

The Typography node (ORV-126 node 16, part 2).

- **Asked:** `typography.scripts` (key `business.question.scripts`) with three choices, `business.typography.scripts.thaiLatin`, `business.typography.scripts.thai` and `business.typography.scripts.latin`, none chosen when it shows, and a save button, offered while the node holds no entry, whatever the marks. The save button and its refusal reuse `business.architecture.save` and `business.architecture.choiceRequired` (ORV-291 PR 2).
- **Decided:** for each role, `business.field.readingFace` and `business.field.displayFace`, the families of `typography-families-1` whose script the answer names and whose role matches, Thai first, then Latin (W7). Each family shows its name, its style, `business.typography.licence` with its licence and the reason of its role: `business.typography.because.reading` on the Thai reading family, `business.typography.because.display` on the Thai display family, and `business.typography.because.pairing` once when Thai and Latin are both chosen (K-0042). `business.typography.oneChoice` and `business.typography.noPersonalityLink` show with every decision.
- **Status for `expression-marks-1`:** `derived` with an entry; `open` without one.
- **Not used:** the method's 24 px switch and its Thai line heights (ORV-126 D5, no source); any axis of the personality (open question 5).

### name-length-1

What counts as a long name, for `logo-type-1` and the "Allowed when" of `expression-entry-1`: the stored working name of ORV-291 `working-name-1` with every white space character removed, counted in grapheme clusters (`Intl.Segmenter`, granularity `grapheme`), so a Thai consonant with its vowel and tone marks counts once. A name is long when the count is more than 12. The number 12 is ours; no source gives one (ORV-126 "Hypotheses"; `business.logoType.hypothesis`). W5.

### logo-type-1

The Logo type node (ORV-126 node 13, part 3), from K-0037: emphasise the name by default, and a symbol needs a reason.

- **Asked:** `logo-type.app-icon` (key `business.question.appIcon`) with `business.logoType.appIcon.yes` and `business.logoType.appIcon.no`, none chosen when it shows, and the save button and refusal of `typography-node-1`, offered as the "Allowed when" of `expression-entry-1` says.
- **Decided,** only while `name` holds a given name and `architecture` is derived (otherwise `foundation-marks-1` blocks it); the reasons are listed in this order:
  1. the name is long (`name-length-1`): reason `business.logoType.because.longName`;
  2. the answer is "yes": reason `business.logoType.because.appIcon`;
  3. one or both reasons hold: `business.logoType.symbolPlusName` with each reason that holds;
  4. neither holds and the answer is "no": `business.logoType.wordmark` with `business.logoType.because.wordmark`;
  5. neither holds and no answer is stored: no decision; the node asks.
- **Shown with a decision:** `business.logoType.nameLength`, `business.logoType.hypothesis`, `business.logoType.crowdingNotChecked`, `business.logoType.otherTypes` and `business.decision.rule` with `logo-type-1`. W6.
- **Status for `expression-marks-1`:** `derived` with a decision; `open` without one.

### expression-honest-1

The one home of the labels on the three nodes.

<!-- prettier-ignore -->
| Content | Label | When |
| --- | --- | --- |
| A decision of `color`, `typography` or `logo-type` | `business.label.byRule` once per view, and `business.decision.rule` beside each decision | a decision shows |
| A colour decision | `business.color.hypothesis` and `business.color.familyOnly`, once per view | a colour decision shows |
| The competitors' colours | `business.color.givenByYou` | they show |
| A typography decision | `business.typography.oneChoice` and `business.typography.noPersonalityLink` | it shows |
| A logo type decision | `business.logoType.hypothesis`, `business.logoType.crowdingNotChecked`, `business.logoType.otherTypes` | it shows |
| A provisional decision | `strategy.provisional` and `business.marks.restsOn` | by `expression-marks-1` |
| A decision made before what it rests on was agreed | `business.marks.unchecked` | by `expression-marks-1` |

No model output is stored or shown on the three nodes, so none of these AI labels shows on any of them: `evidence.fromModel`, `strategy.draftedOptions`, `business.positioning.draftedBy`, `business.positioning.by.picked`, `business.positioning.by.edited`, `logo-mark.draftLabel`. No text says a decision is final, verified, tested, screened, registered or chosen by AI; no score or number shows other than the scale points in a reason, the name length and its bound. No colour shows as a swatch or value the person did not give. Every name and colour the person gave renders as plain text, never as HTML or a link.

### expression-saved-1

Per project, in the person's workspace: the entries of `expression-entry-1` in ORV-291's foundation table, under its `foundation-saved-1` unchanged (`withWorkspace`, row security, SELECT and INSERT only, the payload tagged `personal`). No new table and no new column. A decision is never stored: it is computed from the stored entries, the positioning gate and the rules each time the view is built (open question 2). Opening a project writes nothing, consumes no limit and calls no model.

### expression-board-1

The three nodes join the read-only business board of ORV-291 `foundation-board-1`, with one edge per require of `expression-marks-1`: `competitive-frame` and `identity-frame` to `color` (part 1); `identity-frame` to `typography` (part 2); `architecture` and `name` to `logo-type` (part 3). Each part adds its node and its edges to the board, and the PR 237 head holds all three (W2). The board still reads left to right in fill order, the three nodes to the right of the foundation nodes (open question 6); positions are the designer's at G2. A card shows its title, its state line and the names of its fields, never a value, an answer or a colour; opening it shows its view in the viewer dialog. At a 1440 px viewport, at the overview fit, every card title is whole, none cut, in Thai and in English, with all twelve cards on the board (W2) and with fewer; how it stays whole is the designer's. At a 360 px viewport `foundation-board-1` holds as written, over the larger set of cards.

## Screens

No new screen. The business board gains three nodes and their views (`expression-board-1`). The controls use existing shared components (`Button`, `RadioGroup`, `Input`); no shared component changes. Layout is the designer's at G2.

## Strings

New keys live in the design-system catalog (`packages/design-system/src/i18n`). Each is the copy of record and a draft for the owner's copy review. None has a middot or an em dash. `typography.scripts` and `logo-type.app-icon` are ORV-126 question ids with no ORV-126 copy, so their copy is new here.

<!-- prettier-ignore -->
| Key | English | Thai | PR |
| --- | --- | --- | --- |
| `business.node.color` | Colour | สี | 1 |
| `business.state.partly` | Partly worked out by fixed rules | ได้จากกฎที่กำหนดไว้บางส่วน | 1 |
| `business.state.needsAnswer` | Waits for your answer | รอคำตอบของคุณ | 1 |
| `business.label.byRule` | Worked out by fixed rules from what you gave. Not decided by AI. | คำนวณด้วยกฎที่กำหนดไว้จากข้อมูลที่คุณให้ ไม่ได้ตัดสินโดย AI | 1 |
| `business.decision.rule` | Rule: {rule} | กฎ: {rule} | 1 |
| `business.question.lineup` | Which brands do customers compare you with, and what is the main colour of each? | ลูกค้าเปรียบเทียบคุณกับแบรนด์ใดบ้าง และแต่ละแบรนด์ใช้สีหลักสีอะไร | 1 |
| `business.field.lineup` | Competitors' main colours | สีหลักของคู่แข่ง | 1 |
| `business.field.crowded` | Crowded colour families | กลุ่มสีที่ซ้ำกัน | 1 |
| `business.field.signature` | Signature colour family | กลุ่มสีประจำแบรนด์ | 1 |
| `business.field.neutral` | Greys | สีเทา | 1 |
| `business.field.canvas` | Background | พื้นหลัง | 1 |
| `business.color.give` | Give competitors' colours | ระบุสีของคู่แข่ง | 1 |
| `business.color.row` | Brand {n} | แบรนด์ที่ {n} | 1 |
| `business.color.brandName` | Brand name | ชื่อแบรนด์คู่แข่ง | 1 |
| `business.color.hex` | Main colour, as # and six characters | สีหลัก เขียนเป็น # ตามด้วยหกตัวอักษร | 1 |
| `business.color.add` | Add a brand | เพิ่มแบรนด์ | 1 |
| `business.color.remove` | Remove {name} | ลบ {name} | 1 |
| `business.color.save` | Save these colours | บันทึกสีเหล่านี้ | 1 |
| `business.color.lineupRequired` | Add at least one brand with its colour, or cancel. | เพิ่มอย่างน้อยหนึ่งแบรนด์พร้อมสีหลัก หรือกดยกเลิก | 1 |
| `business.color.rowIncomplete` | Give both the brand name and its colour, or remove the row. | ใส่ทั้งชื่อแบรนด์และสีหลัก หรือลบแถวนี้ | 1 |
| `business.color.hexInvalid` | Write the colour as # and six characters from 0 to 9 and A to F, for example #5B3FD9. | เขียนสีเป็น # ตามด้วยหกตัวจาก 0 ถึง 9 และ A ถึง F เช่น #5B3FD9 | 1 |
| `business.color.nameRepeated` | This brand is already in the list. | แบรนด์นี้อยู่ในรายการแล้ว | 1 |
| `business.color.lineupMax` | Twenty brands at most. | ใส่ได้ไม่เกินยี่สิบแบรนด์ | 1 |
| `business.color.givenByYou` | Colours you gave. ORIVILO did not read them from these brands. | สีที่คุณระบุเอง ORIVILO ไม่ได้อ่านสีเหล่านี้จากแบรนด์จริง | 1 |
| `business.color.crowdRule` | A colour family counts as crowded when two or more of the brands you gave share it. | กลุ่มสีจะนับว่าซ้ำกันเมื่อแบรนด์ที่คุณระบุตั้งแต่สองแบรนด์ขึ้นไปใช้กลุ่มสีนั้น | 1 |
| `business.color.noneCrowded` | None | ไม่มี | 1 |
| `business.color.family.red` | Red | แดง | 1 |
| `business.color.family.orange` | Orange | ส้ม | 1 |
| `business.color.family.yellow` | Yellow | เหลือง | 1 |
| `business.color.family.lime` | Lime | เขียวมะนาว | 1 |
| `business.color.family.green` | Green | เขียว | 1 |
| `business.color.family.teal` | Teal | เขียวอมฟ้า | 1 |
| `business.color.family.cyan` | Cyan | ฟ้าอมเขียว | 1 |
| `business.color.family.blue` | Blue | น้ำเงิน | 1 |
| `business.color.family.violet` | Violet | ม่วง | 1 |
| `business.color.family.magenta` | Magenta | บานเย็น | 1 |
| `business.color.family.ink` | Near black | เกือบดำ | 1 |
| `business.color.family.paper` | Near white | เกือบขาว | 1 |
| `business.color.neutral.cool` | Cool greys | เทาโทนเย็น | 1 |
| `business.color.neutral.near` | Near neutral greys | เทากลาง | 1 |
| `business.color.neutral.warm` | Warm greys | เทาโทนอุ่น | 1 |
| `business.color.canvas.soft` | Soft off-white, with white cards on it | ขาวนวล มีการ์ดสีขาววางอยู่ด้านบน | 1 |
| `business.color.canvas.bright` | Bright white | ขาวสว่าง | 1 |
| `business.color.because.signature` | Bold at {expressive} of 5 and warm at {warm} of 5 point to {family}, and {family} is not crowded among the colours you gave. | ความโดดเด่นระดับ {expressive} จาก 5 และความอบอุ่นระดับ {warm} จาก 5 ชี้ไปที่กลุ่มสี {family} และกลุ่มสีนี้ไม่ซ้ำกับสีที่คุณระบุ | 1 |
| `business.color.because.fallback` | Bold at {expressive} of 5 and warm at {warm} of 5 point first to {preferred}, which is crowded among the colours you gave, so the next candidate, {family}, is used. | ความโดดเด่นระดับ {expressive} จาก 5 และความอบอุ่นระดับ {warm} จาก 5 ชี้ไปที่กลุ่มสี {preferred} ก่อน แต่กลุ่มสีนั้นซ้ำกับสีที่คุณระบุ จึงใช้ตัวเลือกถัดไป คือ {family} | 1 |
| `business.color.because.neutral` | Warm at {warm} of 5 sets the greys. | ความอบอุ่นระดับ {warm} จาก 5 กำหนดสีเทา | 1 |
| `business.color.because.canvas` | Premium at {premium} of 5 sets the background. | ความหรูหราระดับ {premium} จาก 5 กำหนดพื้นหลัง | 1 |
| `business.color.waitsForLineup` | The signature colour waits for your competitors' colours. | สีประจำแบรนด์รอสีของคู่แข่งจากคุณ | 1 |
| `business.color.bothCrowded` | Both candidate families for this personality, {first} and {second}, are crowded among the colours you gave, so no signature colour is chosen. | กลุ่มสีตัวเลือกทั้งสองของบุคลิกนี้ คือ {first} และ {second} ซ้ำกับสีที่คุณระบุ จึงยังไม่เลือกสีประจำแบรนด์ | 1 |
| `business.color.needsPersonality` | Describe the brand's personality to work out the colours: the colour rules read it. | บอกบุคลิกของแบรนด์ก่อน เพราะกฎสีอ่านค่าจากบุคลิก | 1 |
| `business.color.notDecided` | The colour rules gave no result for this input. | กฎสีไม่ได้ให้ผลสำหรับข้อมูลนี้ | 1 |
| `business.color.hypothesis` | The thresholds and the four candidate colour families are ORIVILO's working rules, not a tested method. | เกณฑ์และกลุ่มสีตัวเลือกทั้งสี่เป็นกฎที่ ORIVILO ใช้ทำงาน ยังไม่ใช่วิธีที่ผ่านการทดสอบ | 1 |
| `business.color.familyOnly` | A colour family, not a final colour value. | เป็นกลุ่มสี ยังไม่ใช่ค่าสีสุดท้าย | 1 |
| `business.node.typography` | Typography | ตัวอักษร | 2 |
| `business.question.scripts` | Which scripts will your brand write in? | แบรนด์ของคุณจะเขียนด้วยอักษรอะไรบ้าง | 2 |
| `business.typography.scripts.thaiLatin` | Thai and Latin | อักษรไทยและอักษรละติน | 2 |
| `business.typography.scripts.thai` | Thai only | อักษรไทยอย่างเดียว | 2 |
| `business.typography.scripts.latin` | Latin only | อักษรละตินอย่างเดียว | 2 |
| `business.field.scripts` | Scripts | อักษรที่ใช้ | 2 |
| `business.field.readingFace` | Reading text | ตัวอักษรเนื้อความ | 2 |
| `business.field.displayFace` | Headlines | ตัวอักษรหัวเรื่อง | 2 |
| `business.typography.style.looped` | Thai, looped | อักษรไทยแบบมีหัว | 2 |
| `business.typography.style.loopless` | Thai, loopless | อักษรไทยแบบไม่มีหัว | 2 |
| `business.typography.style.latinSans` | Latin, sans serif | อักษรละตินแบบไม่มีเชิง | 2 |
| `business.typography.licence` | Licence: {licence} | สัญญาอนุญาต: {licence} | 2 |
| `business.typography.because.reading` | Looped Thai is the style commonly used for body and small text. | อักษรไทยแบบมีหัวเป็นแบบที่นิยมใช้กับเนื้อความและตัวอักษรขนาดเล็ก | 2 |
| `business.typography.because.display` | Loopless Thai is the style commonly used for titles and branding. | อักษรไทยแบบไม่มีหัวเป็นแบบที่นิยมใช้กับหัวเรื่องและงานแบรนด์ | 2 |
| `business.typography.because.pairing` | Either Thai style pairs with a Latin sans serif. | อักษรไทยทั้งสองแบบจับคู่กับอักษรละตินแบบไม่มีเชิงได้ | 2 |
| `business.typography.oneChoice` | This version has one family for each role and script, so every brand gets these families. | เวอร์ชันนี้มีชุดตัวอักษรเพียงชุดเดียวต่อบทบาทและอักษร ทุกแบรนด์จึงได้ชุดเดียวกันนี้ | 2 |
| `business.typography.noPersonalityLink` | Your brand's personality does not choose these families. A link from personality to a typeface would be a working guess, not a tested method. | ชุดตัวอักษรเหล่านี้ไม่ได้เลือกตามบุคลิกของแบรนด์คุณ หากจะโยงบุคลิกเข้ากับแบบตัวอักษร ก็เป็นได้แค่การคาดเดา ไม่ใช่วิธีที่ผ่านการทดสอบ | 2 |
| `business.node.logoType` | Logo type | ประเภทโลโก้ | 3 |
| `business.question.appIcon` | Will your brand need a small square mark on its own, for example an app icon or a profile picture? | แบรนด์ของคุณต้องมีสัญลักษณ์สี่เหลี่ยมเล็ก ๆ ที่ใช้แยกเดี่ยวไหม เช่น ไอคอนแอปหรือรูปโปรไฟล์ | 3 |
| `business.logoType.appIcon.yes` | Yes, it needs one | ต้องมี | 3 |
| `business.logoType.appIcon.no` | No, the name is enough | ไม่ต้อง ใช้ชื่ออย่างเดียวพอ | 3 |
| `business.field.appIcon` | Small square mark | สัญลักษณ์สี่เหลี่ยมเล็ก | 3 |
| `business.field.logoType` | Logo type | ประเภทโลโก้ | 3 |
| `business.logoType.wordmark` | Wordmark: the name itself is the logo | โลโก้ตัวอักษร: ใช้ชื่อแบรนด์เป็นโลโก้ | 3 |
| `business.logoType.symbolPlusName` | Symbol plus name | สัญลักษณ์คู่กับชื่อ | 3 |
| `business.logoType.because.wordmark` | A short name, one brand and no need for a small square mark: the logo puts the name first, because a symbol needs a reason. | ชื่อสั้น แบรนด์เดียว และไม่ต้องใช้สัญลักษณ์สี่เหลี่ยมเล็ก โลโก้จึงเน้นชื่อเป็นหลัก เพราะการมีสัญลักษณ์ต้องมีเหตุผลรองรับ | 3 |
| `business.logoType.because.longName` | A long name is a reason for a symbol as a shorthand. | ชื่อที่ยาวเป็นเหตุผลให้มีสัญลักษณ์ไว้ใช้แทนชื่อ | 3 |
| `business.logoType.because.appIcon` | The need for a small square mark is a reason for a symbol as a shorthand. | ความต้องการสัญลักษณ์สี่เหลี่ยมเล็กเป็นเหตุผลให้มีสัญลักษณ์ไว้ใช้แทนชื่อ | 3 |
| `business.logoType.nameLength` | Your working name {name} has {n} characters; more than {max} counts as long. | ชื่อใช้งาน {name} มี {n} ตัวอักษร เกิน {max} ตัวนับว่ายาว | 3 |
| `business.logoType.hypothesis` | What counts as a long name is ORIVILO's working rule; no source gives a number. | เกณฑ์ว่าชื่อแบบไหนยาวเป็นกฎที่ ORIVILO ใช้ทำงาน ยังไม่มีแหล่งอ้างอิงที่ให้ตัวเลขนี้ | 3 |
| `business.logoType.crowdingNotChecked` | Not checked against similar trademarks. | ยังไม่ได้ตรวจเทียบกับเครื่องหมายการค้าที่คล้ายกัน | 3 |
| `business.logoType.otherTypes` | Letterform marks, emblems and dynamic marks are not worked out by any rule in this version. | โลโก้อักษรย่อ ตราสัญลักษณ์ และโลโก้ที่เปลี่ยนรูปได้ ยังไม่มีกฎรองรับในเวอร์ชันนี้ | 3 |

Reused as they are:

- From ORV-291 PR 1 (on staging): `business.state.waiting`, `business.marks.unchecked`, `business.node.identityFrame`.
- From ORV-291 PR 2 (ORV-295, in build): `business.state.derived`, `business.marks.restsOn`, `strategy.provisional`, `business.architecture.save`, `business.architecture.choiceRequired`, `business.node.architecture`, `business.node.name`. If PR 237 reaches `develop` before ORV-295, it adds the ones it uses with ORV-291's copy word for word, pinned by the same test, and the PR that lands second drops its copy of them on rebase.
- From ORV-285 and ORV-281: `business.positioning.cancel`, `business.positioning.saving`, `business.intake.tooLong`, `business.node.positioning`, `business.node.competitiveFrame`, `board.readOnly`; `saved.errors.signed-out`, `saved.errors.rate-limited`, `saved.errors.failed` (`apps/web/i18n/messages.ts`).

## Acceptance criteria

Tests use fixtures; none reaches the internet or a model. Screen rows are proven on stories of the business board and the node views on labelled fixture projects, in both languages. "Positioning agreed" in a fixture means its newest positioning choice is `written` on the newest intake. "Personality at point 4" means a `given` `identity-frame` entry with each of the five axes 75. "The stand-in lineup" is ORV-20's "Stand-in lineup fixture" (seven entries). Test and story names are suggested. A row states the values its test asserts; the rule that makes them is defined once, in the section its name points to.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | In turn: a `competitive-frame` `lineup` entry with the stand-in lineup; one of 1 entry and one of 20; one whose names are padded with spaces and whose colours are lower case; one of 0 entries; one of 21; two names equal ignoring case; a name of 61 characters; a colour `#12345`, `red` or `#FFF`; an unknown key `source`; a `competitive-frame` `skipped` entry; a `color` entry of any kind | `expression-entry-1` checks it | No UI | The first four parse, the names trimmed and the colours upper case; each other input fails at the path of its field | `foundation.test.ts` › "lineup entry" |
| 2 | A saved Thai fixture project, positioning agreed, personality at point 4, no lineup | They open Colour ("สี") | "Partly worked out by fixed rules" ("ได้จากกฎที่กำหนดไว้บางส่วน"); under "Greys" ("สีเทา") "Warm greys" ("เทาโทนอุ่น") with "Warm at 4 of 5 sets the greys." ("ความอบอุ่นระดับ 4 จาก 5 กำหนดสีเทา") and "Rule: color.neutral.warm"; under "Background" ("พื้นหลัง") "Soft off-white, with white cards on it" with "Premium at 4 of 5 sets the background." and "Rule: color.canvas.soft"; under "Signature colour family" "The signature colour waits for your competitors' colours." ("สีประจำแบรนด์รอสีของคู่แข่งจากคุณ"); "Give competitors' colours" ("ระบุสีของคู่แข่ง"); "Worked out by fixed rules from what you gave. Not decided by AI." ("คำนวณด้วยกฎที่กำหนดไว้จากข้อมูลที่คุณให้ ไม่ได้ตัดสินโดย AI"), `business.color.hypothesis` and `business.color.familyOnly` once each; no mark line | Nothing written on opening; the view's `color` result is `open` with `neutral` `warm` and `canvas` `soft` (W4 case 3) | `view.test.ts` › "colour in the view" › "decides neutral and canvas and keeps the signature open with no lineup"; stories `ColorPartly` and `ColorPartlyEnglish`, play |
| 3 | The project of row 2 | They press "Give competitors' colours", see "Which brands do customers compare you with, and what is the main colour of each?" ("ลูกค้าเปรียบเทียบคุณกับแบรนด์ใดบ้าง และแต่ละแบรนด์ใช้สีหลักสีอะไร") with `business.color.crowdRule`, enter the stand-in lineup and press "Save these colours" ("บันทึกสีเหล่านี้") | "Worked out by a fixed rule" ("ได้จากกฎที่กำหนดไว้"); under "Signature colour family" "Lime" ("เขียวมะนาว") with "Bold at 4 of 5 and warm at 4 of 5 point to Lime, and Lime is not crowded among the colours you gave." and "Rule: color.signature.lime-warm"; the seven names and colours under "Competitors' main colours" ("สีหลักของคู่แข่ง") with "Colours you gave. ORIVILO did not read them from these brands." ("สีที่คุณระบุเอง ORIVILO ไม่ได้อ่านสีเหล่านี้จากแบรนด์จริง"); under "Crowded colour families" Near black, Orange and Violet, in that order, joined by `Intl.ListFormat`; no "Give competitors' colours" | One entry: node `competitive-frame`, kind `lineup`, seven entries, colours upper case, made by the session's user inside `withWorkspace`; no decision stored; the log line holds the route and outcome, no name and no colour | `foundation-actions.test.ts` › "give the lineup", with a spy on the log lines; `foundation.integration.test.ts` › "lineup saved in the workspace"; stories `ColorDecided` and `ColorDecidedEnglish`, play |
| 4 | The lineup editor of row 3 open | They press save with no row filled; with one row holding a name and no colour; with a colour `5B3FD9`; with two rows named "Brand A" and "brand a"; with a name of 61 characters; with 20 rows; then a valid lineup while the action answers `rate-limited`; then "Cancel" ("ยกเลิก") and open it again; then save twice while a save runs | In order: "Add at least one brand with its colour, or cancel."; "Give both the brand name and its colour, or remove the row."; "Write the colour as # and six characters from 0 to 9 and A to F, for example #5B3FD9."; "This brand is already in the list."; "Use 60 characters or fewer." ("ใช้ไม่เกิน 60 ตัวอักษร"); no "Add a brand" and "Twenty brands at most." ("ใส่ได้ไม่เกินยี่สิบแบรนด์"); `saved.errors.rate-limited` with the wait; the rows and text kept each time; on "Cancel" the editor closed, focus on "Give competitors' colours", then one empty row when it opens again; the button disabled with "Saving your choice" and "Cancel" disabled | No action call for the first five or "Cancel"; one call for the double press; nothing saved on `rate-limited` or "Cancel" | Stories `ColorLineupInvalid` and `ColorLineupInvalidEnglish`, play with a stub action |
| 5 | The project of row 3, its lineup the stand-in lineup plus `#C6F432` and `#B5E61D` (ORV-20 row 9) | They open Colour | "Cyan" ("ฟ้าอมเขียว") with "Bold at 4 of 5 and warm at 4 of 5 point first to Lime, which is crowded among the colours you gave, so the next candidate, Cyan, is used." and "Rule: color.signature.cyan-warm-fallback"; Lime among the crowded families | `color` `derived`, `signature` `cyan` (W4 case 2) | `view.test.ts` › "colour in the view" › "a crowded lime gives the fallback with its reason"; story `ColorFallback`, play |
| 6 | A project, positioning agreed, personality at point 4, the lineup of ORV-20 row 11 | They open Colour | "Partly worked out by fixed rules"; under "Signature colour family" "Both candidate families for this personality, Lime and Cyan, are crowded among the colours you gave, so no signature colour is chosen." ("กลุ่มสีตัวเลือกทั้งสองของบุคลิกนี้ คือ เขียวมะนาว และ ฟ้าอมเขียว ซ้ำกับสีที่คุณระบุ จึงยังไม่เลือกสีประจำแบรนด์"); "Warm greys" and "Soft off-white, with white cards on it" with their reasons; no control | `color` `open`, `signature` open, no value invented (W4 case 4) | `view.test.ts` › "colour in the view" › "both candidates crowded leaves the signature open"; story `ColorBothCrowded`, play |
| 7 | Three fixture projects with no lineup: positioning agreed and a `skipped` personality; positioning agreed and no personality entry; positioning with no choice and no personality entry | They open Colour | First: "Waits for your answer" ("รอคำตอบของคุณ") with "Describe the brand's personality to work out the colours: the colour rules read it." ("บอกบุคลิกของแบรนด์ก่อน เพราะกฎสีอ่านค่าจากบุคลิก"), no decision, no mark line. Second: "Waits for Brand personality" ("รอ บุคลิกของแบรนด์ ก่อน"). Third: "Waits for Positioning" ("รอ จุดยืน ก่อน"). In all three, "Give competitors' colours" offered and no decision | `color` results: `open` with `provisionalOn` `identity-frame`; `blocked` by `identity-frame`; `blocked` by `positioning` | `view.test.ts` › "colour in the view" › "waits for the personality, or asks for it once skipped"; stories `ColorWaits` and `ColorWaitsEnglish`, play |
| 8 | Personality at point 4 and the stand-in lineup, with positioning in turn skipped and stale (agreed on intake A, then intake B saved); then positioning skipped and no lineup | They open Colour | Skipped: "Worked out by a fixed rule", "Provisional. This rests on a step you skipped." ("ชั่วคราว เพราะอิงกับขั้นตอนที่คุณข้ามไว้") and "Rests on: Positioning" ("อิงกับ: จุดยืน"). Stale: "Not yet checked against: Positioning" ("ยังไม่ได้ตรวจทานกับ: จุดยืน"). Skipped with no lineup: "Partly worked out by fixed rules" with both provisional lines | `color` results equal W8 cases 2 and 3; the three decisions unchanged by the marks | `view.test.ts` › "expression marks" › "colour takes the marks of W8 cases 2 and 3, with a partial decision too"; story `ColorMarks`, play |
| 9 | `decideColor` results forced in a unit test: `questions` `lineup` and `personality.expressive`; status `conflicted`; status `invalid` | The colour adapter builds the view | No UI | `lineup` listed under `competitive-frame` with the control `give`; `personality.expressive` under `identity-frame`; on `conflicted` and on `invalid` no decision and the line `business.color.notDecided`; `color-rules.ts`, `color-audit.ts`, `color-knowledge.ts` and `rules.ts` unchanged, and `color-rules.test.ts` and `color-audit.test.ts` pass with no edit | `expression.test.ts` › "colour adapter" › "maps each question to its node", "shows no value on a conflicted or invalid result" |
| 10 | In turn: no session; an email not on the approved list; the `write` limit used up; a project of workspace A called by a member of workspace B only; an unknown project id; a project that already holds a lineup | The entry action is called with a valid `lineup` entry | No UI | `signed-out`; `forbidden` with no address and no limit consumed; `rate-limited` with `retryAfter`, code `RATE_LIMITED`; one 404 body for the next two; `invalid-input` for the last, the stored lineup unchanged; nothing saved in any case | `foundation-actions.test.ts` › "lineup door"; `foundation.integration.test.ts` › "another workspace reads as not found", "one lineup per project" |
| 11 | A lineup whose first name is `<img src=x onerror=alert(1)>` | They open Colour | It as literal text; no image, no script, no link | None | Stories `ExpressionUntrustedText` and `ExpressionUntrustedTextEnglish`, play |
| 12 | A saved project, PR 1 head | Its board renders; they Tab to Colour and press Enter, then Escape | Colour ("สี") to the right of Brand personality with its state line and its field names and no value or colour; one more node and two more edges than the board of the base (W2); the view in the viewer dialog; focus back on the card | The new edges are exactly `competitive-frame` to `color` and `identity-frame` to `color` | Stories `Board` and `BoardEnglish`, play; `business-graph.test.ts` › "boardGraphOf in %s" › "adds Colour with its two edges" |
| 13 | A project with a decided colour | They switch the language in the header | Node title, state, field names, family words and reasons in the other language; names and colours as typed; Thai text with no letter spacing | No second save | Stories `ColorSwitchToEnglish` and `ColorSwitchToThai`, play (no remount, no call; computed letter spacing `normal` or `0px` on every element of the view that holds Thai text) |
| 14 | The lineup editor and the decided view, keyboard only, light and dark, a 360 px viewport, 20 rows each named with 60 Thai characters and no spaces | They Tab through the editor and save; then open the view | Focus visible on each control in reading order; each row's two fields named; every line wraps; no horizontal scroll | Zero a11y violations | Stories `ColorNarrow`, `ColorNarrowDark` and `ColorNarrowEnglish`, play with `expectFitsAt360`; a11y addon |
| 15 | A project with a lineup and a personality | Its board is loaded twice, a day apart on a fake clock | No UI | The same view, decisions and marks both times; nothing written, no limit consumed and no model call on loading | `data.test.ts` › "expression replay" › "colour loaded twice gives the same view and writes nothing" |
| 16 | The PR 237 head | The gate runs | No UI | Part 1's migration widens the pair check by (`competitive-frame`, `lineup`) only and adds the check that bounds the lineup (1 to 20 entries, each name 1 to 60 characters, each hex `#RRGGBB`), and `access.test.ts` passes on the table; check-i18n and `apps/web/i18n/messages.test.ts` pass; no middot or em dash in new copy; no new module imports `openrouter` or `llm-interpreter`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass; `pnpm contrast` unchanged from `develop` | Gate output, among others `business-strings.test.ts` › "expression, colour strings"; `expression.test.ts` › "no model import" |
| 17 | In turn: a `typography` `answered` entry with `scripts` `thai-latin`, `thai` and `latin`; `scripts` `chinese`; `scripts` missing; an unknown key `locale`; a `typography` `skipped` entry | `expression-entry-1` checks it | No UI | The first three parse; each other input fails at the path of its field | `foundation.test.ts` › "typography entry" |
| 18 | A saved Thai fixture project, positioning agreed, personality at point 4, no typography entry | They open Typography ("ตัวอักษร"), see "Which scripts will your brand write in?" ("แบรนด์ของคุณจะเขียนด้วยอักษรอะไรบ้าง") with no choice made, choose "Thai and Latin" ("อักษรไทยและอักษรละติน") and press "Save this answer" ("บันทึกคำตอบนี้") | Before: "Waits for your answer". After: "Worked out by a fixed rule"; under "Reading text" ("ตัวอักษรเนื้อความ") Sarabun, "Thai, looped" ("อักษรไทยแบบมีหัว"), "Licence: SIL Open Font License 1.1" and "Looped Thai is the style commonly used for body and small text.", then Inter, "Latin, sans serif" with its licence; under "Headlines" ("ตัวอักษรหัวเรื่อง") Anuphan, "Thai, loopless" with its licence and "Loopless Thai is the style commonly used for titles and branding.", then Inter; "Either Thai style pairs with a Latin sans serif."; `business.typography.oneChoice`, `business.typography.noPersonalityLink` and `business.label.byRule`; no control | One entry: node `typography`, kind `answered`, `scripts` `thai-latin`; no decision stored; the log line holds no answer | `foundation-actions.test.ts` › "answer the scripts"; stories `TypographyDecided` and `TypographyDecidedEnglish`, play |
| 19 | Two fixture projects as row 18 with the answers "Thai only" and "Latin only" | They open Typography | First: Sarabun for reading and Anuphan for headlines, no Inter, no pairing line. Second: Inter for both, no Thai family, no pairing line | Families equal W7 | `expression.test.ts` › "typography" › "families per script"; story `TypographyScripts`, play |
| 20 | The typography question of row 18 | They press "Save this answer" with no choice; then with a choice while the action answers `rate-limited`; then twice while a save runs | "Choose one answer first." ("เลือกหนึ่งคำตอบก่อน"); `saved.errors.rate-limited` with the wait and the choice kept; the button disabled with "Saving your choice" | No call for the first; one call for the double press; nothing saved on `rate-limited` | Stories `TypographyInvalid` and `TypographyInvalidEnglish`, play with a stub action |
| 21 | Four fixture projects with `scripts` `thai-latin`: positioning agreed and a `skipped` personality; positioning stale and a `given` personality; positioning agreed and no personality entry; positioning with no choice and no personality entry | They open Typography | First: the families with "Provisional. This rests on a step you skipped." and "Rests on: Brand personality" ("อิงกับ: บุคลิกของแบรนด์"). Second: the families with "Not yet checked against: Positioning". Third: "Waits for Brand personality", the saved answer, no family. Fourth: "Waits for Positioning", the saved answer, no family | `typography` results equal W8 cases 4, 3 and 5, and `blocked` by `positioning` for the fourth | `view.test.ts` › "expression marks" › "typography"; story `TypographyMarks`, play |
| 22 | `TYPOGRAPHY_FAMILIES` (suggested name) as shipped | A unit test reads it and the repo | No UI | Exactly the three ids of `typography-families-1` (`sarabun`, `anuphan`, `inter`); each has licence `OFL-1.1`, a script, a style, a role and a licence file path that exists in the repo; no id of `SUGGESTION_CANDIDATES` other than `sarabun` and `anuphan` appears; `typography-node-1` imports nothing from `suggest.ts` | `expression.test.ts` › "typography families carry a recorded licence" |
| 23 | In turn, for a `typography` entry: no session; an email not on the approved list; the `write` limit used up; a project of another workspace; an unknown project id; a project that already holds a `typography` entry | The entry action is called with a valid entry | No UI | `signed-out`; `forbidden` with no address and no limit consumed; `rate-limited` with `retryAfter`; one 404 body for the next two; `invalid-input` for the last; nothing saved in any case | `foundation-actions.test.ts` › "typography door" |
| 24 | A saved project, PR 2 head | Its board renders; they Tab to Typography, open it, switch the language, at 360 px in light and dark | Typography ("ตัวอักษร") to the right of Colour; one more node and one more edge than the board of PR 1 (W2); titles, states, field names, styles and reasons in the other language, the family and licence names as written; each view wraps with no horizontal scroll | The new edge is exactly `identity-frame` to `typography`; zero a11y violations | Stories `Board`, `TypographyNarrow` and `TypographySwitchToEnglish`, play; a11y addon |
| 25 | A project with a `typography` entry | Its board is loaded twice, a day apart on a fake clock | No UI | The same view both times; nothing written, no limit consumed and no model call on loading | `data.test.ts` › "expression replay" › "typography" |
| 26 | The PR 237 head | The gate runs | No UI | Gate as row 16, part 2's migration widening the pair check by (`typography`, `answered`) only; `business-strings.test.ts` pins every PR 2 key | Gate output |
| 27 | In turn: a `logo-type` `answered` entry with `appIcon` true and false; `appIcon` "yes" as text; `appIcon` missing; an unknown key `crowding`; a `logo-type` `skipped` entry | `expression-entry-1` checks it | No UI | The first two parse; each other input fails at the path of its field | `foundation.test.ts` › "logo type entry" |
| 28 | The names and answers of W5 and W6 | `name-length-1` and `logo-type-1` run | No UI | The counts, the long or short verdicts and the decisions of W5 and W6 | `expression.test.ts` › "name length", "logo type rule" |
| 29 | A saved Thai fixture project, positioning agreed, the architecture answer "no", the working name "ORIVILO", no `logo-type` entry | They open Logo type ("ประเภทโลโก้"), see "Will your brand need a small square mark on its own, for example an app icon or a profile picture?" with no choice made, choose "No, the name is enough" ("ไม่ต้อง ใช้ชื่ออย่างเดียวพอ") and save | Before: "Waits for your answer". After: "Worked out by a fixed rule"; under "Logo type" "Wordmark: the name itself is the logo" ("โลโก้ตัวอักษร: ใช้ชื่อแบรนด์เป็นโลโก้") with "A short name, one brand and no need for a small square mark: the logo puts the name first, because a symbol needs a reason." and "Rule: logo-type-1"; "Your working name ORIVILO has 7 characters; more than 12 counts as long."; `business.logoType.hypothesis`, `business.logoType.crowdingNotChecked`, `business.logoType.otherTypes`, `business.label.byRule`; under "Small square mark" the answer; no control | One entry: node `logo-type`, kind `answered`, `appIcon` false; no decision stored; the log line holds no name | `foundation-actions.test.ts` › "answer the app icon"; stories `LogoTypeWordmark` and `LogoTypeWordmarkEnglish`, play |
| 30 | The project of row 29 before the answer | They choose "Yes, it needs one" ("ต้องมี") and save | "Symbol plus name" ("สัญลักษณ์คู่กับชื่อ") with "The need for a small square mark is a reason for a symbol as a shorthand." | `appIcon` true; decision `symbol-plus-name` (W6) | Story `LogoTypeSymbol`, play |
| 31 | A project as row 29 with the working name "Chase Manhattan Bank" and no `logo-type` entry | They open Logo type; then the action is called directly with a valid `logo-type` entry | "Symbol plus name" with "A long name is a reason for a symbol as a shorthand." and "Your working name Chase Manhattan Bank has 18 characters; more than 12 counts as long."; no question offered | The direct call is refused as `invalid-input`; nothing saved | `foundation-actions.test.ts` › "a long name needs no app icon answer"; story `LogoTypeLongName`, play |
| 32 | Three fixture projects with no `logo-type` entry: positioning agreed, the answer "no", no name; positioning agreed, the answer "yes", no name; positioning stale, the answer "no", the name "ORIVILO" | They open Logo type | First: "Waits for Name" ("รอ ชื่อแบรนด์ ก่อน"). Second: "Waits for Brand architecture" ("รอ โครงสร้างแบรนด์ ก่อน"). Third: "Waits for Positioning". The question offered in all three, no decision | `logo-type` results: `blocked` by `name` (W8 case 6); `blocked` by `architecture` (W8 case 4); `blocked` by `positioning` (W8 case 3) | `view.test.ts` › "expression marks" › "logo type waits"; story `LogoTypeWaits`, play |
| 33 | Positioning skipped, the answer "no", the name "ORIVILO", `appIcon` false | They open Logo type | "Wordmark: the name itself is the logo", "Provisional. This rests on a step you skipped." and "Rests on: Positioning" | `logo-type` `derived`, `provisionalOn` `positioning` (W8 case 2) | `view.test.ts` › "expression marks" › "logo type provisional"; story `LogoTypeMarks`, play |
| 34 | In turn, for a `logo-type` entry: no session; an email not on the approved list; the `write` limit used up; a project of another workspace; an unknown project id; a project that already holds a `logo-type` entry | The entry action is called with a valid entry | No UI | `signed-out`; `forbidden` with no address and no limit consumed; `rate-limited` with `retryAfter`; one 404 body for the next two; `invalid-input` for the last; nothing saved in any case | `foundation-actions.test.ts` › "logo type door" |
| 35 | A working name `<img src=x onerror=alert(1)>` and `appIcon` false | They open Logo type | The name as literal text in the length line; no image, no script, no link | None | Story `ExpressionUntrustedText`, play |
| 36 | A saved project, PR 3 head, with ORV-295 in `develop`, and a working name of 60 Thai characters with no spaces | Its board renders at 360 px, light and dark, keyboard only; they Tab to Logo type, open it and switch the language | One more node and two more edges than the board of PR 2 (W2): twelve nodes and eighteen edges with ORV-296 in `develop`, eleven and sixteen without; Logo type to the right of the foundation nodes; focus visible; the view wraps with no horizontal scroll; titles, states and the reasons in the other language, and no question, since the name is long by `name-length-1` (`design.md` section 11 choice 8); the name as typed; at a 1440 px viewport, at the overview fit, every card title whole, none cut, in Thai and in English (`expression-board-1`) | The new edges are exactly `architecture` to `logo-type` and `name` to `logo-type`; zero a11y violations | Stories `Board`, `LogoTypeNarrow` and `LogoTypeSwitchToEnglish`, play; a11y addon; in `business-board.stories.tsx`, a play at 1440 in Thai and one in English that prove every card title whole at the overview fit (the builder names them, for example `BoardAt1440` and an English twin) |
| 37 | Fixture projects holding, together, every result of `expression-marks-1` on the three nodes in rows 2, 3, 6, 7, 18, 21, 29 and 32 | They open each view | None of the six AI labels of `expression-honest-1`; no colour value other than ones the person gave; no number other than scale points in a reason, the name length and its bound; no text saying final, verified, tested, screened, registered or chosen by AI | No entry row holds a model id | Story `ExpressionNoAi`, play reads the text; `view.test.ts` › "expression, no AI label" |
| 38 | A project with a lineup, a personality, a `typography` and a `logo-type` entry | Its board is loaded twice, a day apart on a fake clock | No UI | The same view, decisions and marks both times; nothing written, no limit consumed and no model call on loading | `data.test.ts` › "expression replay, all three" |
| 39 | The PR 237 head | The gate runs | No UI | Gate as row 16, part 3's migration widening the pair check by (`logo-type`, `answered`) only; `business-strings.test.ts` pins every PR 3 key | Gate output |

## Rows per PR

- PR 237: rows 1-39

## Rows that render nothing

- Rows: 1, 9, 10, 15-17, 22, 23, 25-28, 34, 38, 39

## Delivery: one PR, three parts

The three parts ship in one PR, PR 237 (comment 10771). Each part closes a node the owner can open, and none calls a model. Function, file and table names are suggestions; each named test keeps its name.

The acceptance table and the Strings table keep the labels PR 1, PR 2 and PR 3 as the names of parts 1, 2 and 3: a "PR n head" or "the board of PR n" in a row is the board with parts 1 to n built, and a "PR n key" or a "PR" column value n is a string of part n.

1. **Part 1, colour (rows 1-16).** `expression-roots-1`, `expression-marks-1` with `color`, the `lineup` entry kind and its migration, `lineup-input-1`, `color-node-1` (the adapter around ORV-20), `expression-honest-1` for colour, the Colour node and its view, the part 1 copy. Done: a person with a described personality sees the brand's colour families worked out with their reasons, and can give the competitors' colours the signature waits for. It needs only ORV-291 PR 1 (PR 232, in `develop`).
2. **Part 2, typography (rows 17-26).** `typography-families-1`, `typography-node-1`, the `typography` entry kind and its migration, the node and its view, the part 2 copy. Done: the board names the brand's Thai and Latin families per role, each with its licence. It builds on part 1 (the grown marks graph, `business.state.needsAnswer` and `business.label.byRule`), and not on ORV-295 or ORV-296.
3. **Part 3, logo type (rows 27-39).** `name-length-1`, `logo-type-1`, the `logo-type` entry kind and its migration, the node and its view, the part 3 copy. Done: the board shows whether the logo is a wordmark or a symbol plus name, and why. It waits on ORV-295 in `develop` (`architecture` and `name`) and builds on part 2; it does not wait on ORV-296, because no node of this story requires `core-idea`.

Each part is likely near 400 changed lines, part 1 past it with the lineup editor; the split follows the nodes, one whole node per part, so PR 237 is well past the 400 lines of one small PR (open question 8).

## Impact on contracts

- **Engine, `packages/intent-engine/src/business`.** `foundation.ts`: three new arms of the entry contract and of `storedEntrySchema` (`expression-entry-1`); the `lineup` arm reuses `lineupSchema` from `color-audit.ts` unchanged. `foundation-marks.ts`: the root `competitive-frame` (`expression-roots-1`), three nodes in `FOUNDATION_NODES`, `FOUNDATION_REQUIRES` and `MARK_NUMBERS`, `entryAllowed` for the three kinds. `view.ts`: three node views with their decisions, reasons, questions and controls; `FoundationStateKey` gains `partly` and `needsAnswer`. New: the colour adapter, `TYPOGRAPHY_FAMILIES` and the typography rule, the name length and logo type rules (a module such as `expression.ts`, the architect's). Readers to re-check: `business-board.tsx`, `business-node-view.tsx`, `business-text.ts`, `business-graph.ts`, `business-board.stories.tsx`, `apps/web/app/business/[projectId]/page.tsx`, `apps/web/app/business/foundation-actions.ts`. Unchanged: `color-rules.ts`, `color-audit.ts`, `color-knowledge.ts`, `rules.ts`, `COLOR_RULES`, `PERSONALITY_AXES`, `suggest.ts`, the intake contract, `MODEL_JOBS`, `AI_MODELS`.
- **Storage.** No new table or column. One migration per part, three in PR 237, widens the pair check of `business_foundation_entry` by its pair; part 1's also adds a check that bounds the lineup; `TENANT_TABLES` and `CLASSIFICATION` unchanged (the payload stays `personal`).
- **Auth and limits.** The existing entry action and route behind `withWorkspace` and the ORV-268 approved list; the `write` limit reused with no new number. `security` reviews PR 237 (ADR 0015 decision 2: server actions and `packages/intent-engine/**`).
- **UI.** The new catalog keys of "Strings"; the business board example screen (`packages/design-system/src/examples`); no new shared component, no shared component change, no token change.
- **Model jobs.** None.

## Out of scope

- `logo-mark` (14): AI image drafts in their own story (D8, ADR 0018 proposed); no model call in this story.
- `look-feel` (12) and every node outside the POC set (D3): out of the POC.
- The UI role palette with values per mode (ORV-125): design-system work, parked under phase 1.
- The guidebook assembly (ORV-126 slice 4): its own story.
- Any model call, and drafted options for any node: the drafting stories of ORV-126 D1.
- Colours read from competitor sites, and a competitor list taken from the `alternatives` answer or its reading: a later story (open question 1).
- The Thai colour culture check (K-0040, 0.7) and the Thai script coverage check: later checks, ORV-126 harness part 5.
- Changing or withdrawing an answer once given, and a person overruling a decision: open questions 2 and 7.
- Letterform marks, emblems, dynamic marks and trademark crowding: no source rule for the first three (K-0037); crowding waits on `ip-screen`.
- Typeface families beyond `typography-families-1`, sizes, weights and line heights: open question 4; the method's numbers have no source (D5).
- The final look of the views (POC focus is function); the designer's G2 notes set the layout.

## Open questions for the owner (one round, with defaults)

1. **Where the colour lineup comes from in this story.** (a) Asked from the person in the Colour view, each competitor's name and main colour typed in (`lineup-input-1`); (b) left missing: the signature stays open with its question, and greys and background are still worked out; (c) a later story that reads competitor sites (ORV-128's analysers), with (b) until then. Impact: (a) adds the lineup editor, about a third of part 1, and relies on colours the person may misremember, labelled `business.color.givenByYou`; (b) shrinks part 1 and no brand gets a signature; (c) adds page reads and their limits. Default: (a).
2. **A decision worked out on each read, or stored.** (a) Worked out from the stored inputs and the current rules each time the view is built; a later rule version changes old projects at once, and the view names the rule; (b) stored as its own entry with its rule version when first worked out, a later rule change shown as a line beside it; (c) stored, and worked out again only when the person asks. On a later change of an input: in this story each input is given once and a stale positioning changes the marks only; once inputs can change (ORV-291 open question 9), (a) follows the newest input at once, (b) and (c) keep the old decision until worked out again. Impact: (b) and (c) add a stored decision shape and a classification. Default: (a).
3. **How the scripts are asked.** (a) A question with three choices and none preset (`typography-node-1`); (b) the page's language as a visible assumption ("Assumed from your language") the person can change; (c) the assumption with the question beside it. Impact: (b) and (c) mix the person's reading language with the brand's scripts, which can differ. Default: (a).
4. **The curated family list and the licence of each family.** (a) The three families of `typography-families-1`, the only ones whose licence text is in the repo; (b) add the seven other families of ORV-61's list once each licence text is committed beside the fonts or recorded in a knowledge entry, with its looped or loopless style and its source; (c) a researched list per ORV-126 D5 (c), before any family is added. Impact: (a) gives every brand the same families (`business.typography.oneChoice`); (b) needs a licence task per family and a decision rule to choose between families of one role. Default: (a).
5. **Personality and typeface.** (a) No link: the rule reads no axis, and `typography` keeps ORV-126's require on `identity-frame` (departure 6); (b) no link, and the require is dropped while no axis is read, so a skipped personality marks nothing on typography; (c) a link labelled as a hypothesis (for example ORV-61's affinities in `suggest.ts`), once open question 4 gives more than one family per role. Impact: (a) shows typography as waiting for, or provisional on, a personality it does not read; (c) rests on a source below 0.7. Default: (a).
6. **Where the three nodes sit.** (a) On the same business board, to the right of the foundation nodes, in fill order; (b) on a second board for expression, linked from the business board; (c) stacked under the board. Impact: (a) adds three cards to a board already cut at 360 px (ORV-291 open question 14). Default: (a). For now `design.md` section 11 choices 1 and 2 place them on this board (comment 10766).
7. **May the person overrule a rule's decision.** (a) Not in this story: the view shows the reasons and no control changes a decision (departure 9); (b) the person may pick another value, stored as given with the rule's decision beside it; (c) an agree or reject step per decision. Impact: (b) and (c) add entry kinds, states and copy, and change the marks of what rests on them. Default: (a).
8. **The order of the PRs.** (a) Colour, typography, logo type: the first two start now, the third waits on ORV-295; (b) ORV-126's fill order, logo type first, all three waiting on ORV-295; (c) colour and typography in one PR, logo type in a second. Impact: (b) holds the story until ORV-295 is in; (c) makes one PR well past 400 lines. Default: (a). For now the three parts are built in order (a) and ship in one PR, PR 237 (comment 10771).
9. **`competitive-frame` in the marks (departure 2).** (a) It counts as done, and a missing lineup shows only as the colour's question; (b) it counts by ORV-281 `node-state-1`: skipped when the competitors answer is empty, which makes colour provisional on it. Impact: (b) starts the marks at a business node, against ORV-291 open question 7's default. Default: (a).
10. **What counts as a long name.** (a) More than 12 grapheme clusters, white space not counted (`name-length-1`); (b) three or more words, which a Thai name written without spaces never reaches; (c) no length rule: the person says whether the name is long. Default: (a).
11. **The app icon question when the name is long.** (a) Not asked: a long name already decides a symbol plus name (`expression-entry-1`); (b) asked anyway, its answer stored and shown as a second reason. Default: (a).
12. **The logo types a rule can choose.** (a) A wordmark or a symbol plus name only (departure 4); (b) also a letterform mark for a short name with the need for a small square mark, a rule of ours with no source. Impact: (b) adds a hypothesis rule and its label. Default: (a).
13. **The Thai of `business.typography.noPersonalityLink`.** (a) The Thai of the Strings table, which says the families were not chosen by the brand's personality and that a link from personality to a typeface would be only a guess, not a tested method; (b) another wording from the owner's copy review, with the same meaning. Default: (a), the Thai now in the Strings table (sign-off ORV-298-signoff-1, F3).
14. **The Thai of `business.color.canvas.soft`.** (a) The Thai of the Strings table, which describes the decided background and gives no instruction; (b) another wording from the owner's copy review, with the same meaning. Default: (a), the Thai now in the Strings table (sign-off ORV-298-signoff-1, F4).

## Depends on

- [ORV-126 spec](../ORV-126/spec.md) v1.4: "Fill order" rule 5 and the group A plan; "The propagation rule"; "Where ORV-20 sits and what it must change"; nodes 5, 12, 13, 15 and 16; "Hypotheses"; "Rules and bounds"; decisions D3, D5, D6, D7 and D8; rows 15 and 25.
- [ORV-291 spec](../ORV-291/spec.md) v1.4: `foundation-roots-1`, `foundation-marks-1`, `foundation-entry-1`, `foundation-door-1`, `foundation-saved-1`, `foundation-board-1`, `foundation-honest-1`, `identity-frame-1`, `architecture-derive-1`, `working-name-1`, "Strings"; PR 232 in `develop`; ORV-295 (its PR 2) for part 3 of this story; tech notes D5 and section 4.1.
- [ORV-20 spec](../ORV-20/spec.md) v1.3 slice A: `decideColor`, `auditLineup`, `lineupSchema`, the "Color rules", the "Stand-in lineup fixture", rows 9 and 11, decisions 4 and 8; [ADR 0017](../../adr/0017-node-scoped-color-decisions.md).
- [ORV-281 spec](../ORV-281/spec.md): `business-board-1`, `honest-business-1`, `node-state-1`; ORV-285 `positioning-gate-1` through `foundation-roots-1`.
- ORV-61 (`suggest.ts`, read only for open questions 4 and 5); ORV-275 (the licence files beside the fonts).
- ORV-268 `read-allow-list-1`; ORV-112 (`LIMITS`, the `write` limit).
- ADR 0002, ADR 0005, ADR 0006, ADR 0007, ADR 0012 (lane L), ADR 0015 decisions 2, 9 and 10; [ADR 0018](../../adr/0018-image-generation-provider.md) (proposed) only for what is out of scope.
- Knowledge: K-0037 (0.85), K-0039 (0.75), K-0040 (0.7), K-0042 (0.85), K-0044 (0.75).

## Worked examples

Not run: this role has no shell. Each line runs from the repo root with `node -e`; the main session runs them and records the result. Inputs are copied from the source each example names. Outputs are integers or strings; no rounding.

W1. The whole plan's counts, from the table "The whole plan before this story" in its row order. States `staging`, `develop`, `build`, `engine` (rules only) and `none`; this story adds rows 10, 12 and 13 (indexes 9, 11, 12), and ORV-296 adds row 9 (index 8). Expected `14 6 0 2 1 5 12 2`: rows, on staging, in develop only, in build, engine only, not built, on the board once this story, ORV-295 and ORV-296 are in, not on it.

```bash
node -e 'const t=["staging","staging","staging","staging","staging","staging","build","build","none","none","none","engine","none","none"];const add=[8,9,11,12];const c=k=>t.filter(x=>x===k).length;const on=t.filter((x,i)=>["staging","develop","build"].includes(x)||add.includes(i)).length;console.log(t.length,c("staging"),c("develop"),c("build"),c("engine"),c("none"),on,t.length-on)'
```

W2. `expression-board-1`: nodes and edges after each part, from the board of ORV-291 with all three of its PRs in (ORV-291 W2, `9/13`), one node and one edge per require. Expected `10/15 11/16 12/18`. On a base without ORV-295 and ORV-296 (ORV-291 PR 1 only, `6/7`), part 1 gives `7/9` and part 2 `8/10`.

```bash
node -e 'const add=[{color:["competitive-frame","identity-frame"]},{typography:["identity-frame"]},{"logo-type":["architecture","name"]}];const run=(n,e,k)=>{const out=[];for(const pr of add.slice(0,k)){n+=1;e+=Object.values(pr).flat().length;out.push(n+"/"+e)}return out.join(" ")};console.log(run(9,13,3));console.log(run(6,7,2))'
```

Expected, two lines: `10/15 11/16 12/18` and `7/9 8/10`. The first line shows the case with ORV-295 and ORV-296 in `develop`; with ORV-295 and without ORV-296 (ORV-291 W2, `8/11`), the board with part 3 is `11/16`, one node and two edges fewer than `12/18` (row 36).

W3. `color-node-1`: where ORV-20's thresholds of the "Color rules" fall on the five scale points, each point stored as `(point - 1) * 25` (ORV-291 W3). Expected, one line per threshold: `expressive deep:1,2,3 light:4,5`, `warm cool:1,2 warm:3,4,5`, `neutral cool:1,2 near:3 warm:4,5`, `canvas bright:1,2,3 soft:4,5`.

```bash
node -e 'const v=p=>(p-1)*25;const g=f=>{const m={};for(const p of [1,2,3,4,5]){const k=f(v(p));(m[k]=m[k]||[]).push(p)}return Object.entries(m).map(([k,ps])=>k+":"+ps.join(",")).join(" ")};console.log("expressive "+g(x=>x>=55?"light":"deep"));console.log("warm "+g(x=>x>=50?"warm":"cool"));console.log("neutral "+g(x=>x<=25?"cool":x>=75?"warm":"near"));console.log("canvas "+g(x=>x>=60?"soft":"bright"))'
```

W4. `color-node-1`: ORV-20's "Color rules" on lineups given as the families of their entries (ORV-20 row 1 for the stand-in lineup; row 9 adds two lime; row 11 crowds every candidate), a family crowded at two entries (ORV-20 decision 4). Six cases: (1) personality at point 4, the stand-in lineup; (2) the same plus two lime; (3) point 4, no lineup; (4) point 4, ORV-20 row 11's lineup; (5) every axis at point 2, the stand-in lineup; (6) point 4, a lineup of one lime entry. Expected `lime warm soft | cyan warm soft | open(lineup) warm soft | open(both-crowded) warm soft | teal cool bright | lime warm soft`.

```bash
node -e 'const decide=(ax,fams)=>{const c={};for(const f of fams||[])c[f]=(c[f]||0)+1;const crowded=fams?Object.keys(c).filter(k=>c[k]>=2):null;const light=ax.expressive>=55,warm=ax.warm>=50;const order=light?(warm?["lime","cyan"]:["cyan","lime"]):(warm?["magenta","teal"]:["teal","magenta"]);const sig=crowded===null?"open(lineup)":(order.find(f=>!crowded.includes(f))||"open(both-crowded)");return sig+" "+(ax.warm<=25?"cool":ax.warm>=75?"warm":"near")+" "+(ax.premium>=60?"soft":"bright")};const p4={expressive:75,warm:75,premium:75};const p2={expressive:25,warm:25,premium:25};const s=["violet","violet","violet","ink","ink","orange","orange"];console.log([decide(p4,s),decide(p4,[...s,"lime","lime"]),decide(p4,null),decide(p4,["lime","lime","cyan","cyan","magenta","magenta","teal","teal"]),decide(p2,s),decide(p4,["lime"])].join(" | "))'
```

W5. `name-length-1` on the name of ORV-126 row 6, two names from the source article behind ORV-126 node 13's reasons for a symbol (one long, one with many units), the Thai title `business.node.name` of ORV-291's "Strings", and 12 and 13 Thai consonants for the bound. Expected `ORIVILO|7|short ; Smithsonian|11|short ; Chase Manhattan Bank|18|long ; ชื่อแบรนด์|7|short ; ก*12|12|short ; ก*13|13|long`.

```bash
node -e 'const seg=new Intl.Segmenter("en",{granularity:"grapheme"});const n=s=>[...seg.segment(s.replace(/\s/gu,""))].length;console.log([["ORIVILO","ORIVILO"],["Smithsonian","Smithsonian"],["Chase Manhattan Bank","Chase Manhattan Bank"],["ชื่อแบรนด์","ชื่อแบรนด์"],["ก*12","ก".repeat(12)],["ก*13","ก".repeat(13)]].map(([l,s])=>l+"|"+n(s)+"|"+(n(s)>12?"long":"short")).join(" ; "))'
```

W6. `logo-type-1` on a name length and an app icon answer (`true`, `false` or none): 7 and false; 7 and true; 18 and none; 18 and true; 7 and none. Expected `wordmark symbol-plus-name(app-icon) symbol-plus-name(long-name) symbol-plus-name(long-name,app-icon) open(logo-type.app-icon)`.

```bash
node -e 'const lt=(len,icon)=>{const r=[];if(len>12)r.push("long-name");if(icon===true)r.push("app-icon");if(r.length)return "symbol-plus-name("+r.join(",")+")";if(icon===false)return "wordmark";return "open(logo-type.app-icon)"};console.log([lt(7,false),lt(7,true),lt(18,undefined),lt(18,true),lt(7,undefined)].join(" "))'
```

W7. `typography-node-1` over `typography-families-1`, per answer. Expected `thai-latin reading=Sarabun+Inter display=Anuphan+Inter | thai reading=Sarabun display=Anuphan | latin reading=Inter display=Inter`.

```bash
node -e 'const F=[{n:"Sarabun",s:"thai",r:["reading"]},{n:"Anuphan",s:"thai",r:["display"]},{n:"Inter",s:"latin",r:["reading","display"]}];const w={"thai-latin":["thai","latin"],thai:["thai"],latin:["latin"]};const pick=(a,role)=>F.filter(f=>w[a].includes(f.s)&&f.r.includes(role)).map(f=>f.n).join("+");console.log(Object.keys(w).map(a=>a+" reading="+pick(a,"reading")+" display="+pick(a,"display")).join(" | "))'
```

W8. `expression-marks-1`: ORV-126 "The propagation rule" (the code of ORV-291 W4) on the grown graph, roots by `expression-roots-1`, printing the three nodes of this story. Six cases: (1) positioning done, personality given, architecture derived, name given, each of the three nodes decided; (2) as 1 with positioning skipped; (3) as 1 with positioning open (stale); (4) positioning done, personality skipped, the architecture answer "yes", no name, typography answered, no other decision; (5) positioning done, no personality, architecture derived, name given, logo type decided, typography answered; (6) as 1 with no name and no logo type decision. Expected, one line per case:
`logo-type:derived color:derived typography:derived`,
`logo-type:derived/provisionalOn=positioning color:derived/provisionalOn=positioning typography:derived/provisionalOn=positioning`,
`logo-type:blocked/blockedBy=positioning color:derived/unchecked=positioning typography:derived/unchecked=positioning`,
`logo-type:blocked/blockedBy=architecture color:open/provisionalOn=identity-frame typography:derived/provisionalOn=identity-frame`,
`logo-type:derived color:blocked/blockedBy=identity-frame typography:blocked/blockedBy=identity-frame`,
`logo-type:blocked/blockedBy=name color:derived typography:derived`.

```bash
node -e 'const R={"identity-frame":["positioning"],architecture:["situation","positioning"],name:["positioning","architecture"],"logo-type":["architecture","name"],color:["competitive-frame","identity-frame"],typography:["identity-frame"]};const num={situation:1,"competitive-frame":5,positioning:6,"identity-frame":7,architecture:8,name:9,"logo-type":13,color:15,typography:16};const srt=s=>[...s].sort((a,b)=>num[a]-num[b]).join(",");const done=x=>x==="done"||x==="given"||x==="derived";const root=st=>({st,pv:[],un:[],bl:[]});const run=(p,s)=>{const o={situation:root("done"),"competitive-frame":root("done"),positioning:root(p)};const out=[];for(const n of Object.keys(R)){const sk=new Set(),bl=new Set(),un=new Set();for(const r of R[n]){const q=o[r];if(q.st==="skipped")sk.add(r);else if(q.st==="blocked")q.bl.forEach(x=>bl.add(x));else if(!done(q.st))bl.add(r);else for(const x of [...q.pv,...q.un])(o[x].st==="skipped"?sk:un).add(x)}let e;if(s[n]==="given")e={st:"given",pv:[],un:[...sk,...bl,...un],bl:[]};else if(bl.size>0)e={st:"blocked",pv:[],un:[],bl:[...bl]};else e={st:s[n],pv:[...sk],un:[...un],bl:[]};o[n]=e;if(["logo-type","color","typography"].includes(n))out.push(n+":"+e.st+(e.bl.length?"/blockedBy="+srt(e.bl):"")+(e.pv.length?"/provisionalOn="+srt(e.pv):"")+(e.un.length?"/unchecked="+srt(new Set(e.un)):""))}return out.join(" ")};const A={"identity-frame":"given",architecture:"derived",name:"given","logo-type":"derived",color:"derived",typography:"derived"};console.log(run("done",A));console.log(run("skipped",A));console.log(run("open",A));console.log(run("done",{"identity-frame":"skipped",architecture:"open",name:"open","logo-type":"open",color:"open",typography:"derived"}));console.log(run("done",{"identity-frame":"open",architecture:"derived",name:"given","logo-type":"derived",color:"open",typography:"derived"}));console.log(run("done",{...A,name:"open","logo-type":"open"}))'
```

## Downstream review if this spec changes

- ORV-126 spec: nodes 5, 13, 15 and 16 (departures 1 to 8), "Where ORV-20 sits" (the adapter is coded here).
- ORV-291 spec and tech notes: `foundation-marks-1` (three more nodes and a third root), `foundation-entry-1` and section 4.1 (three more pairs in the pair check, and the lineup check), `foundation-board-1` (three more cards at 360 px, open question 14 there).
- ORV-20 spec: no change to slice A; its rules now show on a board, so a rule change there changes what a person sees (open question 2).
- ORV-281: `honest-business-1`, the line `business.competitors.coloursNotRead` beside a lineup the person gave.
- The G1 packet (open questions 1 to 12), the architect's tech notes, the designer's notes for the three views, the builder, `security` and qa envelopes for PR 237 and its three parts.

## Changelog

- v1.0 (2026-11-20): first version, task ORV-298-spec-1, from ORV-126 v1.4 ("Fill order" rule 5, "The propagation rule", "Where ORV-20 sits", nodes 5, 13, 15 and 16, decisions D3, D5 to D8), ORV-291 v1.4 and its tech notes, ORV-20 v1.3, ORV-281, the brief, `brand-ci-method.md`, ADR 0018 and the code of `color-rules.ts`, `color-audit.ts`, `knowledge.ts`, `foundation.ts`, `foundation-marks.ts`, `view.ts` and `suggest.ts`. No Jira tool call and no shell in this role, so the state of ORV-285, ORV-291, ORV-292, ORV-295 and ORV-296 was taken from the envelope's facts and the session handoff of 2026-11-20 (ORV-291 PR 1 on staging through release PR 233), and the eight worked examples are not run. Downstream to review: the G1 packet, the architect's tech notes, the designer's notes, the builder, `security` and qa envelopes for PRs 1 to 3.
- v1.1 (2026-11-20): task ORV-298-spec-2, caused by the architect's tech notes section 16 and decision E7. Four statements corrected: `expression-entry-1` and the Storage line of "Impact on contracts" now say each PR's migration widens the pair check only, since the table has no check on `node` alone (ORV-291 tech notes section 4.1); row 16 says PR 1's migration widens the pair check and adds the check that bounds the lineup, and the Storage line says so too; row 36 no longer requires ORV-296 in `develop` and states the board count both ways, with W2 saying which case its result shows. Brought in line with them: the lane line of the front matter, rows 26 and 39 ("the pair check") and the ORV-291 line of "Downstream review". No row number, rule, string, open question, default or worked example result changed. Downstream to review: the architect's tech notes section 16 (its first three points are now spec text), the builder and qa envelopes for PRs 1 and 3.
- v1.2 (2026-11-20): task ORV-298-spec-3, two additions. First, the string `business.color.row` ("Brand {n}", "แบรนด์ที่ {n}", PR 1) in "Strings", and one sentence in `lineup-input-1` that labels each editor row with it and makes it the `{name}` of `business.color.remove` while the row's brand name is empty; caused by `design.md` section 14 and the G2 pass under the owner's POC delegation (comment 10766, default 3). Second, the section "Rows per PR" with the line for PR 237, caused by PR 1 being opened as PR 237. No row number, rule, other string, open question, default or worked example result changed, and no acceptance cell changed. Downstream to review: the builder and qa envelopes for PR 237 (the new key, its use and the Rows per PR line), the architect's tech notes section on the lineup editor (the Remove name on an empty row).
- v1.3 (2026-11-20): task ORV-298-spec-4, caused by the eight owner's choices of `design.md` section 11, passed at G2 under the owner's POC delegation (comment 10766), read in one pass against every rule, acceptance row and open question of the three PRs. Three statements changed: the Asked line of `lineup-input-1` now offers `business.color.remove` per row only while the editor holds two or more rows (choice 6); the User sees cell of row 36 no longer expects the question on Logo type and says none shows, since its 60-character Thai name is long by `name-length-1` (choice 8, and `expression-entry-1` as written); open question 6 gains one clause naming choices 1 and 2 and comment 10766, its options and default unchanged. Every other statement was found consistent with the eight choices. No row number, rule id, string or worked example result changed, and no open question or default was removed or changed. Downstream to review: the builder and qa envelopes for PR 237 (Remove on the only row) and for PR 3 (row 36), the architect's tech notes section on the lineup editor, and `design.md` section 7.4 (`LogoTypeNarrow` names a Save button the long-name state does not show).
- v1.4 (2026-11-20): task ORV-298-spec-5, caused by comment 10771: the three parts ship in one PR, PR 237, under the owner's POC delegation. Changed statements: "Rows per PR" now holds the one line `PR 237: rows 1-39` and no sentence about a later PR; "Delivery" is titled "one PR, three parts", opens with the one PR, gains one paragraph that keeps the labels PR 1, PR 2 and PR 3 of the acceptance table and the Strings table as the names of the parts, names its three items part 1, part 2 and part 3 with their rows and Done lines unchanged, says part 2 and part 3 build on the part before, and says PR 237 is past the 400 lines of one small PR; rows 16, 26 and 39 run on the PR 237 head and name the migration of their part; the lane line says a migration per part; the plan table (rows 4, 7, 8, 10, 12 and 13), the headings of `lineup-input-1`, `color-node-1`, `typography-node-1` and `logo-type-1`, the last column of the `expression-entry-1` table (now "Part") and its pair check sentence, `expression-board-1`, the honesty line "No part of this story calls a model", the ORV-295 copy sentence under "Strings", the Storage and Auth lines of "Impact on contracts", open question 1's impact, the ORV-291 line of "Depends on", the text of W2 and the envelopes line of "Downstream review" say part or PR 237; open question 8 gains one clause naming comment 10771, its options and default unchanged. No row number, rule id, string key or wording, acceptance cell meaning, open question default or worked example result changed. Downstream to review: the qa envelope for PR 237 (rows 1-39), `tech.md` and `design.md` (their per-PR wording, listed in the task report).
- v1.5 (2026-11-20): task ORV-298-spec-6, caused by the visual sign-off ORV-298-signoff-1 of PR 237 at head 02b6cfe, findings F1, F3 and F4. Changed statements: line 249, the Thai of `business.color.canvas.soft` now describes the background ("ขาวนวล มีการ์ดสีขาววางอยู่ด้านบน") and gives no instruction (F4); line 277, the Thai of `business.typography.noPersonalityLink` now says the families were not chosen by the brand's personality and that a link from personality to a typeface would be only a guess, not a tested method (F3); line 195, `expression-board-1` gains one sentence: at a 1440 px viewport, at the overview fit, every card title is whole, in Thai and in English, the means the designer's (F1); line 342, row 36 asserts it in its User sees cell and names, in its Check cell, a play of `business-board.stories.tsx` at 1440 in Thai and one in English; lines 403 and 404, open questions 13 and 14 give the two Thai wordings to the owner's copy review, each with the Thai now in the table as its default. No acceptance row and no worked example quoted either old Thai string. No row number, rule id, string key, English cell, other string, open question or default, Rows per PR, Rows that render nothing, Delivery or worked example result changed; the Suggestion F8 is a follow-up. Downstream to review: the builder envelope for PR 237 (`th.ts` lines 836 and 876, `business-text.test.ts` line 245, the title play at 1440), `design.md` sections 2.4 and 2.5 (the designer's task ORV-298-design-f1), and the qa envelope for row 36.
