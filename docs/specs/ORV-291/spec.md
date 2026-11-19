---
issue: ORV-291 (https://tpetkaew.atlassian.net/browse/ORV-291)
lane: L (risk flags: stored workspace data, a new tenant table behind the authorization helper; a new contract on the business nodes, four new nodes with their entry contract, their states and the marks a skip or an unagreed step leaves on them; a model call only if open question 1 is answered (b))
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.3
---

# ORV-291: the brand foundation, personality, architecture, working name and the core idea gate

## The whole plan before this story

The plan is ORV-126's POC set (decision D3) in its fill order for group A ("Fill order", rule 1 for `situation`, then the plan line "With the POC set and group A, the plan is"). Thirteen nodes and the guidebook, fourteen rows, read top down.

<!-- prettier-ignore -->
| Order | Node (ORV-126 no.) | What the product has today | What this story adds | What stays for a later story |
| --- | --- | --- | --- | --- |
| 1 | `situation` (1) | On the business board with the industry and website answers, no entry group (ORV-281, ORV-282, ORV-283; merged into `develop`) | Counts as done for the marks (departure 1); its question `situation.sub-brands` is asked in the Brand architecture view (PR 2) | The entry classifier (ORV-126 slice 2) |
| 2 | `business-core` (3) | The person's answer and the AI reading on the board (ORV-281, ORV-283; in `develop`) | Nothing | A value the person writes or picks (ORV-126 D1 steps 2 and 3) |
| 3 | `audience` (4) | As `business-core` (in `develop`) | Nothing | As `business-core` |
| 4 | `competitive-frame` (5) | As `business-core`, with no competitor colours (in `develop`) | Nothing | The colour lineup; a written or picked value |
| 5 | `positioning` (6) | The gate by hand, write or skip, in review (ORV-285 PR 1, PR 226); drafted options not built (ORV-285 PR 2) | Read as the root the four nodes rest on (`foundation-roots-1`) | ORV-285 PR 2 |
| 6 | `identity-frame` (7) | Not built. ORV-128 has reading targets for the five axes, used by the website report of ORV-266, which stores nothing | PR 1: two proxy questions, the five axes, a skip | Drafted options (open question 1) |
| 7 | `architecture` (8) | Not built | PR 2: one question and a derived value | Groups C and D, portfolios (ORV-126 D2) |
| 8 | `name` (9) | Not built | PR 2: a working name the person gives (D9) | Naming as a strategy output; `ip-screen` |
| 9 | `core-idea` (11) | Not built | PR 3: the second gate, write or skip | Drafted options (open question 1) |
| 10 | `logo-type` (13) | Not built | Nothing | Its own story |
| 11 | `logo-mark` (14) | Not built | Nothing | Its own story (D8, ADR 0018 proposed) |
| 12 | `color` (15) | Rules in the engine (ORV-20 slice A, `color-rules.ts`), no node on the board | Nothing; it reads the axes PR 1 stores once its story puts it on the board | A colour node on the board |
| 13 | `typography` (16) | Not built | Nothing | Its own story |
| 14 | `guidebook` (21) | Not built | Nothing; the positioning, the personality and the core idea are the `foundation` items D4 names | The assembly (ORV-126 slice 4) |

Counts today, on the base of these 14 rows: 4 merged into `develop` (rows 1 to 4), 1 in review (row 5), 1 as engine rules only (row 12), 8 not built (rows 6 to 11, 13, 14). After this story: 9 of the 14 are on the board, 5 are not (`logo-type`, `logo-mark`, `color`, `typography`, `guidebook`). "Worked examples", W1. Rows 1 to 4 are also on staging (`main`): ORV-281, ORV-282 and ORV-283 are in the Jira status Staging (checked by the main session on 2026-11-19).

What is excluded, and why: ORV-126 nodes 2, 10, 12, 17, 18, 19, 20 and 22 are outside the POC set (D3); `verbal` (10) sits between `name` and `core-idea` in the fill order and is out by D4.

## Why

ORV-126 "Fill order", rule 4, puts `identity-frame` and `architecture`, then `name`, then `core-idea` right after the positioning gate, and decision D3 keeps all four in the POC: `architecture` derived only, `name` given only. ORV-285 builds the positioning gate. This story builds the next four nodes on the same business board, so that the person's brand has a personality, a known architecture, a working name and a core idea before any logo, colour or type is decided. The core idea is the second gate: nothing visual should build on it until the person agrees (ORV-126 node 11; Wheeler's "achieve agreement", K-0028, 0.8; an idea comes before visuals, K-0035, 0.75).

Each strategic node follows ORV-126 decision D1: proxy questions a person without a strategy can answer, then (in a later story, open question 1) drafted options, then an allowed skip that leaves the node open and marks what rests on it (K-0036, 0.75). The personality uses the five axes of decision D6 (playful, expressive, structured, warm, premium), kept for the POC because ORV-20's colour rules read them, and marked as a hypothesis: no source read uses them (ORV-126 "Hypotheses"; identity sources K-0032, 0.8, and K-0031, 0.7).

This story is not a guard on a tool call, so the guard frame does not apply.

### What is real, rule-based and simulated

- **Real (once built):** the entry check and the saved entries, the board with the four new nodes and their views, the marks computed from what is stored, the derived architecture, the core idea gate.
- **Rule-based, not AI:** the marks (`foundation-marks-1`), the architecture (`architecture-derive-1`), the stored value of each scale point (`identity-frame-1`), every state and label. No model is called in any of the three PRs.
- **Hypothesis-grade:** the five axes (D6, no source); the words at the two ends of each scale and the five-point scale, which are ours; the 300-character bound of a core idea, ours; the proxy questions, which have no source (ORV-126 "Hypotheses").
- **Not done, and said so:** the name is not screened for trademarks (`business.name.notScreened`); a brand above or below other brands gets no architecture (`business.architecture.notInVersion`); no option is drafted by a model; no colour, logo or type is decided from these values yet.
- **Simulated:** nothing in the product. Storybook stories run on labelled fixture projects.

## Story

As a founder or product owner who is signed in and has a saved business, I want to describe my brand's personality on five plain scales, say whether it sits above or below other brands, give it a working name and agree to the one idea people should remember, each asked in words I can answer without a strategy background and each one I can skip where the method allows, so that the logo, colour and type work that follows starts from a foundation I agreed to, and anything that rests on a step I skipped or have not agreed to yet says so.

## Departures from ORV-126, ORV-281 and ORV-285

<!-- prettier-ignore -->
| No. | Source and what it says | This story | Open question |
| --- | --- | --- | --- |
| 1 | ORV-126 node 1: `situation` is the classifier's output, an entry group | The business project has no classifier (ORV-281 departure 2); `situation` counts as done for the marks on every saved project | 6 |
| 2 | ORV-126 "The propagation rule": marks travel from every require, so the gaps of `business-core`, `audience` and `competitive-frame` would reach every later node | The marks start at `positioning`, which passes on none of its own requires | 7 |
| 3 | ORV-126 node 8 and "The start question": `situation.sub-brands` is asked by the classifier at the start | It is asked in the Brand architecture view | 8 |
| 4 | ORV-126 "The node graph": a node the person gives is never blocked | The person can give `identity-frame` and `core-idea` only while neither has a block cause; `name` follows ORV-126 and can be given at any time | 3 |
| 5 | ORV-126 D9: group A asks for a working name; group B brings its name | No group is classified, so every project asks for a working name, in the Name view | 4 |
| 6 | ORV-126 "Rules and bounds", State: nothing is persisted | Entries are saved per project (`foundation-saved-1`), as ORV-281 departure 1 | none |
| 7 | ORV-281 `business-board-1`: nothing can be edited | The canvas stays read-only; the views of the four nodes hold their controls, as ORV-285 departure 2 | none |

## Rules

### foundation-roots-1

The two nodes the four rest on that this story does not fill, and how each counts for `foundation-marks-1`:

- `situation` counts as done on every saved project (departure 1).
- `positioning` counts by its gate state of ORV-285 `positioning-gate-1`: `given` and `confirmed` count as done; `open` with `skipped` true counts as skipped; every other state (`open`, `open` with `stale` true, `awaiting-choice`) counts as open and not skipped. It passes on none of its own requires (departure 2).

### foundation-marks-1

ORV-126 "The propagation rule", applied to the four nodes in fill order (`identity-frame` 7, `architecture` 8, `name` 9, `core-idea` 11), each reading its ORV-126 requires: `identity-frame` reads `positioning`; `architecture` reads `situation` and `positioning`; `name` reads `positioning` and `architecture`; `core-idea` reads `positioning` and `identity-frame`. The roots count by `foundation-roots-1`. Each node's own status before the rule runs is set by its rule: `identity-frame-1`, `architecture-derive-1`, `working-name-1`, `core-idea-gate-1`. The result per node is a status (`given`, `derived`, `blocked`, `open`, or `open` with `skipped` true) and three lists, `blockedBy`, `provisionalOn` and `unchecked`, each sorted by node number with each node once ("Worked examples", W4). The marks are computed every time the view is built, from what is stored; no mark is stored.

How each result shows, in the view and as the state line of the card:

<!-- prettier-ignore -->
| Result | State line | Mark lines (view only) |
| --- | --- | --- |
| `given` | `business.state.given` on `identity-frame` and `name`; `core-idea` by `core-idea-gate-1` | `business.marks.unchecked` when `unchecked` is not empty |
| `derived` | `business.state.derived` | `strategy.provisional` and `business.marks.restsOn` when `provisionalOn` is not empty; `business.marks.unchecked` when `unchecked` is not empty |
| `blocked` | `business.state.waiting`, naming `blockedBy` | none |
| `open`, `skipped` true | `business.state.skipped` | none |
| `open` | `business.state.empty`; on `architecture` with a stored answer "yes", `business.state.notInVersion` | none |

`{nodes}` in these lines is the list of node titles (`business.node.*`) joined by `Intl.ListFormat` in the page's locale, type `conjunction`.

### foundation-entry-1

What the person sends, parsed strictly: the project id in UUID form, the node, the kind and the payload of its row; any other key, or a payload key outside its row, refuses the whole input. Text is trimmed after U+0000 is dropped, as `checkIntake` does; an optional answer that is empty after the trim is not given.

<!-- prettier-ignore -->
| Node | Kind | Payload | Allowed when (step 5 of `foundation-door-1`) |
| --- | --- | --- | --- |
| `identity-frame` | `given` | `axes`: the five keys of `PERSONALITY_AXES`, each one of 0, 25, 50, 75 and 100; `person` and `never`: each optional, 1 to 2,000 characters | The node has no block cause and its newest entry is not `given` |
| `identity-frame` | `skipped` | none | The node has no block cause and has no entry |
| `architecture` | `answered` | `subBrands`: true or false | The node has no entry |
| `name` | `given` | `name`: 1 to 60 characters (ORV-126 "Rules and bounds", Inventory) | The node has no entry |
| `core-idea` | `written` | `statement`: 1 to 300 characters; `remember`: optional, 1 to 2,000 characters | The node has no block cause and its newest entry is not `written` |
| `core-idea` | `skipped` | none | The node has no block cause and has no entry |

"Block cause" is a non-empty `blockedBy` of `foundation-marks-1` for that node as if it held no entry. Each entry is a new row; no row is changed or deleted; the newest entry of a node wins (`created_at` desc, `id` desc). Changing a value once given, answered or written is out of scope (open question 9).

### foundation-door-1

The order the server checks an entry in:

1. the session (Better Auth, on the server);
2. the approved list of ORV-268 `read-allow-list-1`;
3. the `write` limit;
4. the entry check (`foundation-entry-1`);
5. through `withWorkspace` in the person's active workspace: the project, its newest intake, its positioning choices (for `positioning-gate-1`) and its foundation entries; then the "Allowed when" column of `foundation-entry-1`. A request that fails it is refused as `invalid-input` and nothing is saved;
6. the save of the entry.

A refusal at steps 1 to 5 saves nothing. A project of another workspace and an unknown project id answer 404 with one body (`.claude/rules/security.md` rule 9). Without a session the answer is `signed-out` (`saved.errors.signed-out`); refused at step 2, `forbidden` with no address in it and no limit consumed, as ORV-268 `read-door-1` gives it; over the `write` limit, `rate-limited` with the wait (`saved.errors.rate-limited`); any other failure, `saved.errors.failed`. No answer, name, statement or axis value reaches a log line or an error body. The split into one or several server actions is the architect's.

### identity-frame-1

The Brand personality node (ORV-126 node 7, PR 1).

- **Asked, in this order, in one editor:** `identity-frame.proxy.person` and `identity-frame.proxy.never` (ORV-126 copy, keys `business.question.person` and `business.question.never`), each optional; then the five axes in the order of `PERSONALITY_AXES` (playful, expressive, structured, warm, premium), each a scale of five points from its low end to its high end (`business.axis.<axis>.low`, `business.axis.<axis>.high`), with `business.identity.hypothesis` above the scales.
- **No preset.** When the editor opens no point is chosen on any scale; a point is a value only when the person chose it. Nothing is ever set to 50 or to any other value by default (ORV-126 node 7: "never 50 on every axis").
- **Stored:** the two answers as evidence and the five axes as the value, point 1 to 5 stored as 0, 25, 50, 75 and 100 ("Worked examples", W3), in the shape of ORV-20's `personality` facts, so the colour story reads them with no change (open question 2).
- **Status for `foundation-marks-1`:** `given` when the newest entry is `given`; `open` with `skipped` true when it is `skipped`; `open` with no entry.
- **Controls:** while the node holds no `given` entry and has no block cause, `business.identity.describe` opens the editor, and `strategy.skip` is offered while the node has no entry. The editor holds `business.identity.save` and `business.positioning.cancel` and behaves as ORV-285 `positioning-choice-1`, "The editors" (Cancel saves nothing and returns focus to the control that opened it; while a save runs both are disabled and the button shows `business.positioning.saving`). Saving with a scale unchosen shows `business.identity.axesRequired`.
- **A skip:** the node stays open with no value, and what rests on it is marked by `foundation-marks-1` (W4, case 4). The colour story, once built, gets no axis from a skipped node.
- **A later change of positioning:** a given personality keeps its values; its marks follow `foundation-marks-1` (W4, case 5).

### architecture-derive-1

The Brand architecture node (ORV-126 node 8, derive only, PR 2).

- **Asked:** `situation.sub-brands` (ORV-126 copy, key `business.question.subBrands`) with two choices, `business.architecture.no` and `business.architecture.yes`, and `business.architecture.save`. Offered while the node holds no entry, whatever the marks, because the answer is an input of `situation`, not the node's value. Saving with no choice shows `business.architecture.choiceRequired`.
- **Derived:** an answer "no" gives the value "single brand, one unit" (ORV-126 node 8), shown as `business.architecture.single` with `business.architecture.because`, rule id `architecture-derive-1`. The value is computed when the view is built and never stored.
- **Status for `foundation-marks-1`:** `derived` with an answer "no"; `open` with an answer "yes" (the node is out of this version, `business.architecture.notInVersion`, open question 11) or with no answer. `foundation-marks-1` then shows `blocked` in place of `derived` while `positioning` is open.
- **Not skippable** (ORV-126 row 25: only the six strategic nodes are).
- **A skip or a later change of positioning:** the stored answer stays and the marks follow `foundation-marks-1` (W4, cases 2 and 5).

### working-name-1

The Name node (ORV-126 node 9, given only, decision D9, PR 2).

- **Asked:** in the Name view, by `business.name.give`, which opens an editor with one text field, `business.name.save` and `business.positioning.cancel`, behaving as the editors of `identity-frame-1`. Offered at any time while the node holds no entry, because a name may come first (ORV-126 group B) and ORV-126 never blocks a given node (open question 4). An empty field on save shows `business.name.required`.
- **Stored:** the trimmed name, 1 to 60 characters ("Worked examples", W5). It is never taken from the project name, from the `situation.name` reading of ORV-283 or from any model output.
- **Shown** wherever the name shows with `business.name.notScreened` (ORV-126 node 9: "working name, not screened").
- **Status:** `given` with an entry, `open` without one. Not skippable.
- **A later change of positioning or architecture:** the name stays; its marks follow `foundation-marks-1` (W4, case 5).

### core-idea-gate-1

The Core idea node, the second gate (ORV-126 node 11, PR 3). The one home of its states and lines.

<!-- prettier-ignore -->
| Stored, and `foundation-marks-1` | Gate state | State line | Gate line |
| --- | --- | --- | --- |
| No `written` entry, a block cause | `blocked` | `business.state.waiting` | `business.state.gate` |
| No entry, no block cause | `open` | `business.state.empty` | `business.state.gate` |
| Newest entry `skipped`, no block cause | `open`, `skipped` true | `business.state.skipped` | `business.state.gate` |
| Newest entry `written` | `given` | `business.state.agreed` | `business.coreIdea.gatePassed` |

- **Asked, in one editor opened by `business.positioning.writeOwn`:** `core-idea.proxy.remember` (ORV-126 copy, key `business.question.remember`), optional, stored as evidence; then the core idea itself, required, 1 to 300 characters; then `business.coreIdea.save` and `business.positioning.cancel`, behaving as the editors of `identity-frame-1`. An empty core idea on save shows `business.coreIdea.statementRequired`.
- **Controls:** in `open`, `business.positioning.writeOwn` and `strategy.skip`; in `open` with `skipped` true, `business.positioning.writeOwn`; in `blocked` and `given`, none.
- **The gate** passes only in `given` (ORV-126 "requires": done is given, kept, derived, decided or confirmed). Changing an agreed core idea is out of scope, as for positioning.
- **Status for `foundation-marks-1`:** `given` with a `written` entry; `open` with `skipped` true; `open`.
- **A later change of positioning or of the personality:** an agreed core idea stays agreed with its gate line; its marks follow `foundation-marks-1` (W4, case 5).

### foundation-honest-1

The one home of the labels on the four nodes.

<!-- prettier-ignore -->
| Content | Label | When |
| --- | --- | --- |
| A proxy answer (`person`, `never`, `remember`) | `business.label.yourWords` | always |
| The five scales | `business.identity.hypothesis`, once in each place it shows | only where the scales show (the editor and the given view), not under an empty Personality field (open question 13) |
| The derived architecture | `business.architecture.because` | the value shows |
| The working name | `business.name.notScreened` | the name shows |
| A core idea | `business.positioning.by.own` | `given` |
| A provisional value | `strategy.provisional` and `business.marks.restsOn` | by `foundation-marks-1` |
| A value given before what it rests on was agreed | `business.marks.unchecked` | by `foundation-marks-1` |

No model output is stored for these nodes in this story, so none of these five AI labels shows on any of them: `evidence.fromModel`, `strategy.draftedOptions`, `business.positioning.draftedBy`, `business.positioning.by.picked`, `business.positioning.by.edited`. No text says a value is verified, tested, right, final, screened or registered, and no number or score shows other than the scale points (`business.identity.point`). Every name, answer and statement renders as plain text, never as HTML or a link.

### foundation-saved-1

Per project, in the person's workspace: the entries of `foundation-entry-1`, each with the node, the kind, the payload, who made it and when. One append-only tenant table is the default; table shapes are the architect's. Every read and write goes through `withWorkspace`; the table carries `workspace_id`, a foreign key to the project in the same workspace, joins `TENANT_TABLES`, has row security, and gives the app role SELECT and INSERT only (ADR 0002; `.claude/rules/security.md` rules 2 and 4). Names, answers and statements are customer content and take a `personal` tag (rule 11). Opening a project reads what was saved and computes the marks; it writes nothing, consumes no limit and calls no model. `business_intake`, `business_reading` and ORV-285's choice table do not change.

### foundation-board-1

The four nodes join the read-only business board of ORV-281 `business-board-1`, with one edge per require of `foundation-marks-1`: `positioning` to `identity-frame`; `situation` and `positioning` to `architecture`; `positioning` and `architecture` to `name`; `positioning` and `identity-frame` to `core-idea`. Each PR adds its nodes and their edges ("Worked examples", W2). The board still reads left to right in fill order, with the four nodes to the right of Positioning (open question 5); positions and the card at rest are the designer's at G2. A card shows its title, its state line, the names of its fields and, on Core idea, its gate line, never an answer or a value; opening it shows its view in the viewer dialog, as for the business nodes. A view shows the state line, the fields with their content and labels, the mark lines and the controls.

**At a 360 px viewport, from PR 1** (open question 14): the board's fit stops at the zoom floor 0.25, so the board is not shown whole. The person pans it (drag, or the arrow keys on the focused board). When Tab reaches a card on the board (six after PR 1, eight after PR 2, nine after PR 3, W2) no part of which is in view, focus brings it into view; a card that is partly in view stays where it is, partly cut by the board's edge. Measured at `3c646c4` after PR 1: Situation and Brand personality stay cut by 59 px each, the other four cards are whole. Every card still takes focus. Nothing on the page scrolls sideways. Checked by the play the designer's notes call B3 (`design.md` section 6.5), the clause of `narrowPlay` in `business-board.stories.tsx` that the stories `NarrowLight`, `NarrowDark` and `NarrowEnglish` run: zoom 0.25 within 0.001; `document.documentElement.scrollWidth` at most 360 (the play's bound is the larger of 360 and the window's inner width); for each node in fill order, after `focus()` the node has focus and its box overlaps the board's box on both axes. It replaces the every-card-inside assert of ORV-285's `narrowPlay`.

## Screens

No new screen. The business board gains the four nodes and their views (`foundation-board-1`). The controls use existing shared components (`Button`, `RadioGroup`, `Input`, `Textarea`); no shared component changes. Layout is the designer's at G2.

## Strings

New keys live in the design-system catalog (`packages/design-system/src/i18n`). Each is the copy of record and a draft for the owner's copy review. None has a middot or an em dash. The four `business.question.*` keys below are ORV-126 copy word for word, and a test pins each to ORV-126.

<!-- prettier-ignore -->
| Key | English | Thai | PR |
| --- | --- | --- | --- |
| `business.node.identityFrame` | Brand personality | บุคลิกของแบรนด์ | 1 |
| `business.node.architecture` | Brand architecture | โครงสร้างแบรนด์ | 2 |
| `business.node.name` | Name | ชื่อแบรนด์ | 2 |
| `business.node.coreIdea` | Core idea | แนวคิดหลัก | 3 |
| `business.question.person` | If your brand were a person, which three words would people use to describe them? | ถ้าแบรนด์ของคุณเป็นคนคนหนึ่ง คนอื่นจะใช้คำสามคำใดบรรยายเขา | 1 |
| `business.question.never` | How should your brand never feel? | แบรนด์ของคุณไม่ควรให้ความรู้สึกแบบไหน | 1 |
| `business.question.subBrands` | Does this brand sit above or below other brands? | แบรนด์นี้อยู่เหนือหรืออยู่ใต้แบรนด์อื่นหรือไม่ | 2 |
| `business.question.remember` | After someone meets your brand, what one thing should they remember? | หลังจากได้รู้จักแบรนด์ของคุณ คุณอยากให้คนจำอะไรได้หนึ่งอย่าง | 3 |
| `business.field.personality` | Personality | บุคลิก | 1 |
| `business.field.person` | Three words for your brand as a person | สามคำที่บรรยายแบรนด์ถ้าเป็นคน | 1 |
| `business.field.never` | How it should never feel | ความรู้สึกที่แบรนด์ไม่ควรให้ | 1 |
| `business.field.subBrands` | Other brands above or below | แบรนด์อื่นที่อยู่เหนือหรือใต้ | 2 |
| `business.field.architecture` | Architecture | โครงสร้าง | 2 |
| `business.field.workingName` | Working name | ชื่อใช้งาน | 2 |
| `business.field.remember` | The one thing to remember | สิ่งเดียวที่อยากให้คนจำ | 3 |
| `business.field.coreIdea` | Core idea | แนวคิดหลัก | 3 |
| `business.axis.playful.low` | Serious | จริงจัง | 1 |
| `business.axis.playful.high` | Playful | ขี้เล่น | 1 |
| `business.axis.expressive.low` | Quiet | เรียบนิ่ง | 1 |
| `business.axis.expressive.high` | Bold | โดดเด่น | 1 |
| `business.axis.structured.low` | Free and loose | อิสระ ยืดหยุ่น | 1 |
| `business.axis.structured.high` | Orderly and precise | เป็นระเบียบ แม่นยำ | 1 |
| `business.axis.warm.low` | Cool and reserved | สุขุม วางตัว | 1 |
| `business.axis.warm.high` | Warm and friendly | อบอุ่น เป็นกันเอง | 1 |
| `business.axis.premium.low` | Everyday and easy to reach | ใช้ได้ทุกวัน เข้าถึงง่าย | 1 |
| `business.axis.premium.high` | Premium and exclusive | หรูหรา พิเศษเฉพาะ | 1 |
| `business.identity.axisLegend` | From {low} to {high} | จาก {low} ถึง {high} | 1 |
| `business.identity.point` | {n} of 5 | ระดับ {n} จาก 5 | 1 |
| `business.identity.hypothesis` | These five scales are ORIVILO's working words for a brand's personality, not a tested method. | สเกลทั้งห้านี้เป็นคำที่ ORIVILO ใช้อธิบายบุคลิกแบรนด์ ยังไม่ใช่วิธีที่ผ่านการทดสอบ | 1 |
| `business.identity.describe` | Describe the personality | บอกบุคลิกของแบรนด์ | 1 |
| `business.identity.save` | Save this personality | บันทึกบุคลิกนี้ | 1 |
| `business.identity.axesRequired` | Choose a point on each of the five scales, or cancel. | เลือกระดับให้ครบทั้งห้าสเกล หรือกดยกเลิก | 1 |
| `business.state.given` | Given by you | คุณกำหนดเอง | 1 |
| `business.state.waiting` | Waits for {nodes} | รอ {nodes} ก่อน | 1 |
| `business.marks.unchecked` | Not yet checked against: {nodes} | ยังไม่ได้ตรวจทานกับ: {nodes} | 1 |
| `business.state.derived` | Worked out by a fixed rule | ได้จากกฎที่กำหนดไว้ | 2 |
| `business.state.notInVersion` | Not in this version | ยังไม่มีในเวอร์ชันนี้ | 2 |
| `business.marks.restsOn` | Rests on: {nodes} | อิงกับ: {nodes} | 2 |
| `business.architecture.no` | No, it stands on its own | ไม่ใช่ แบรนด์นี้อยู่เดี่ยว ๆ | 2 |
| `business.architecture.yes` | Yes, it sits above or below other brands | ใช่ แบรนด์นี้อยู่เหนือหรือใต้แบรนด์อื่น | 2 |
| `business.architecture.save` | Save this answer | บันทึกคำตอบนี้ | 2 |
| `business.architecture.choiceRequired` | Choose one answer first. | เลือกหนึ่งคำตอบก่อน | 2 |
| `business.architecture.single` | Single brand, one unit | แบรนด์เดียว หน่วยเดียว | 2 |
| `business.architecture.because` | Worked out from your answer: this brand does not sit above or below other brands. | ได้จากคำตอบของคุณ: แบรนด์นี้ไม่ได้อยู่เหนือหรือใต้แบรนด์อื่น | 2 |
| `business.architecture.notInVersion` | A brand that sits above or below other brands needs a brand architecture study, which this version does not do yet. | แบรนด์ที่อยู่เหนือหรือใต้แบรนด์อื่นต้องศึกษาโครงสร้างแบรนด์ ซึ่งเวอร์ชันนี้ยังไม่ได้ทำ | 2 |
| `business.name.give` | Give a working name | ตั้งชื่อใช้งาน | 2 |
| `business.name.save` | Use this working name | ใช้ชื่อนี้ | 2 |
| `business.name.required` | Write a working name, or cancel. | เขียนชื่อใช้งาน หรือกดยกเลิก | 2 |
| `business.name.notScreened` | Working name, not screened for trademarks. | ชื่อใช้งานชั่วคราว ยังไม่ได้ตรวจสอบเครื่องหมายการค้า | 2 |
| `business.coreIdea.save` | Agree to this core idea | เห็นชอบแนวคิดหลักนี้ | 3 |
| `business.coreIdea.statementRequired` | Write your core idea before you agree to it, or cancel. | เขียนแนวคิดหลักของคุณก่อนกดเห็นชอบ หรือกดยกเลิก | 3 |
| `business.coreIdea.gatePassed` | You agreed to this core idea. | คุณเห็นชอบแนวคิดหลักนี้แล้ว | 3 |

Entering the catalog word for word from ORV-126 "Missing strategy" (PR 2), pinned by a test: `strategy.provisional` ("Provisional. This rests on a step you skipped." / "ชั่วคราว เพราะอิงกับขั้นตอนที่คุณข้ามไว้").

Reused as they are:

- From ORV-285 (PR 226): `strategy.skip`, `business.positioning.writeOwn`, `business.positioning.cancel`, `business.positioning.saving`, `business.positioning.by.own`, `business.state.agreed`. Their keys name positioning; their copy fits these nodes word for word, so no copy is duplicated.
- From ORV-281: `business.state.gate`, `business.state.skipped`, `business.state.empty`, `business.label.yourWords`, `business.intake.tooLong`, `business.node.positioning`, `business.notAllowed`, `board.readOnly`.
- `saved.errors.signed-out`, `saved.errors.rate-limited` and `saved.errors.failed` (`apps/web/i18n/messages.ts`).

Not reused: `direction.axes.*` names one end of each axis only, and a scale needs both ends.

## Acceptance criteria

Tests use fixtures; none reaches the internet or a model. Screen rows are proven on stories of the business board and the node views on labelled fixture projects, in both languages. "Positioning agreed" in a fixture means its newest positioning choice is `written` on the newest intake (ORV-285 `given`). Test names are suggested. A row states the values its test asserts; the rule that makes them is defined once, in the section its name points to.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | In turn: an `identity-frame` `given` entry with the axes 0, 25, 50, 75 and 100 and `person` and `never` of 1 and of 2,000 characters; one with no `person` and no `never`; one with no `premium`; one with `warm` 60; one with `person` of 2,001 characters; a `skipped` entry with an `axes` key; an entry with an unknown key `score`; an entry for the node `color` | `foundation-entry-1` checks it | No UI | The first two parse; each other input fails at the path of its field | `foundation.test.ts` › "identity-frame entry" › "parses the full entry with an answer of 1 and one of 2,000 characters", "parses an entry with no person and no never, and a skip with an empty payload", "each other input fails at the path of its field" |
| 2 | A saved Thai fixture project, positioning agreed, no foundation entry, signed in and approved | They open Brand personality ("บุคลิกของแบรนด์"), press "Describe the personality" ("บอกบุคลิกของแบรนด์"), answer "If your brand were a person, which three words would people use to describe them?" ("ถ้าแบรนด์ของคุณเป็นคนคนหนึ่ง คนอื่นจะใช้คำสามคำใดบรรยายเขา"), leave "How should your brand never feel?" empty, choose point 4 on each scale and press "Save this personality" ("บันทึกบุคลิกนี้") | The editor opens with no point chosen on any of the five scales, under "These five scales are ORIVILO's working words for a brand's personality, not a tested method." ("สเกลทั้งห้านี้เป็นคำที่ ORIVILO ใช้อธิบายบุคลิกแบรนด์ ยังไม่ใช่วิธีที่ผ่านการทดสอบ"). After the save: "Given by you" ("คุณกำหนดเอง"); under "Personality" ("บุคลิก") five lines such as "From Serious to Playful" ("จาก จริงจัง ถึง ขี้เล่น") with "4 of 5" ("ระดับ 4 จาก 5"); the three words under "Three words for your brand as a person" with "Your words, placed here by fixed rules. Not read by AI."; no control; no mark; none of the AI labels of `foundation-honest-1` | One entry: node `identity-frame`, kind `given`, each axis 75 (W3), `person` trimmed, no `never`, made by the session's user, written inside `withWorkspace`; the log line holds the route and outcome and no answer text or axis value | `foundation-actions.test.ts` › "give the personality" › "answers ok with the node and the kind, saves the trimmed entry in the session's workspace, and logs closed words", with a spy on the log lines; `foundation.integration.test.ts` › "entry saved in the workspace" › "saves one row: node, kind, axes of 75, the person trimmed, no never, made by the session's user"; stories `IdentityGiven` and `IdentityGivenEnglish`, play (the given view, on a fixture); the editor opening with no point chosen and a save that goes through: stories `IdentityInvalid` and `IdentityInvalidEnglish`, play with a stub action |
| 3 | The personality editor of row 2 open | They press "Save this personality" with one scale unchosen; then with a `never` answer of 2,001 characters; then with a valid entry while the action answers `rate-limited`; then press "Cancel" ("ยกเลิก") and open the editor again; then fill it and press save twice while a save runs | "Choose a point on each of the five scales, or cancel." ("เลือกระดับให้ครบทั้งห้าสเกล หรือกดยกเลิก"); "Use 2000 characters or fewer." ("ใช้ไม่เกิน 2000 ตัวอักษร"); `saved.errors.rate-limited` with the wait; each of those three times the chosen points and the text stay; on "Cancel", the editor closed, the view as before it opened and focus on "Describe the personality", then no point chosen and empty fields when it opens again; the button disabled with "Saving your choice" ("กำลังบันทึกสิ่งที่คุณเลือก") and "Cancel" disabled | No action call for the first two or for "Cancel"; one action call for the double press; nothing saved on `rate-limited` or on "Cancel" | Stories `IdentityInvalid` and `IdentityInvalidEnglish` (the unchosen scale, the 2,001 `never`, `rate-limited`, the double press) and `IdentityCancelled` and `IdentityCancelledEnglish` ("Cancel"), plays with a stub action; `ProjectBoard.test.tsx` › "a foundation entry the wrapper refuses before any call" and "a foundation entry that is running". Not asserted by these at `3c646c4`: "Cancel" disabled while a save runs |
| 4 | The project of row 2 before any entry | They press "Skip for now" ("ข้ามไปก่อน"); later they describe the personality and save | First "Skipped for now" ("ข้ามไว้ก่อน") with "Describe the personality" still offered and no "Skip for now"; then the view of row 2 | Two entries, `skipped`, then `given`; the newest wins; no row changed | `foundation-actions.test.ts` › "skip, then give" › "accepts both calls and keeps two rows, the given one newest"; `foundation.integration.test.ts` › "newest wins, in lock order" › "skipped, then given: open returns both, the given one first, and the node's newest entry is the given one"; stories `IdentitySkipped` and `IdentitySkippedEnglish`, play (the skip; the later save is the last step of `IdentityInvalid`) |
| 5 | Three fixture projects with no foundation entry: positioning with no choice; positioning `written` on an older intake (stale); positioning `skipped` | They open Brand personality; then, on the first two, the action is called directly with a valid `given` entry | On the first two: "Waits for Positioning" ("รอ จุดยืน ก่อน"), no "Describe the personality" and no "Skip for now". On the third: "Nothing given yet" ("ยังไม่มีข้อมูล") with both controls | Both direct calls refused as `invalid-input`; nothing saved | `foundation-actions.test.ts` › "waits for positioning" › "with positioning %s: a given and a skipped entry called directly are invalid-input, and nothing is saved" (`none`, `stale`) and "with positioning skipped: both are accepted"; `foundation.integration.test.ts` › "waits for positioning" (three tests); `view.test.ts` › "foundation in the view" › "controls match the door"; `data.test.ts` › "foundation replay" › "gives Brand personality as waiting, with both controls hidden, while positioning is open"; stories `IdentityWaits` and `IdentityWaitsEnglish`, play |
| 6 | Three fixture projects with a `given` personality: positioning agreed; positioning skipped; positioning agreed on intake A and a later intake B saved (stale) | They open Brand personality | First: no mark line. Second and third: "Not yet checked against: Positioning" ("ยังไม่ได้ตรวจทานกับ: จุดยืน"), the five values unchanged and "Given by you" | `identity-frame` results of `foundation-marks-1` equal W4 cases 1, 2 and 5 | `view.test.ts` › "foundation in the view" › "foundation marks" › "gives identity-frame the results of W4 cases 1, 2 and 5 on a given personality", "keeps the five values unchanged and the state given under every mark"; stories `IdentityMarks` and `IdentityMarksEnglish`, play |
| 7 | In turn: no session; an email not on the approved list; the `write` limit used up; a project of workspace A called by a member of workspace B only; an unknown project id; a project whose personality is `given`, sent a `given` and then a `skipped` entry; a project whose newest personality entry is `skipped`, sent a `skipped` entry | The entry action is called with a valid `identity-frame` entry | No UI | `signed-out`; `forbidden` with no address and no limit consumed; `rate-limited` with `retryAfter`, code `RATE_LIMITED`; one 404 body for the next two; `invalid-input` for each of the last three; nothing saved in any case | `foundation-actions.test.ts` › "entry door" and "given stays given"; `foundation.integration.test.ts` › "another workspace reads as not found", "the service's own workspace conditions" and "given stays given"; `access.test.ts` › "limits every tenant table to the workspace set for the transaction" and "business_foundation_entry" › "is a tenant table, and a scoped transaction sees only its own workspace's rows (T9)" |
| 8 | A `given` personality whose `person` answer is `<img src=x onerror=alert(1)>` | They open Brand personality | It as literal text; no image, no script, no link | None | Stories `FoundationUntrustedText` and `FoundationUntrustedTextEnglish`, play |
| 9 | A saved project, PR 1 head | Its board renders; they click Brand personality, then Tab to it and press Enter, then Escape | Six nodes, Brand personality ("บุคลิกของแบรนด์") to the right of Positioning, with its state line and its three field names and no answer; seven edges; the view in the viewer dialog; Escape closes it and focus returns to the node | The edges are exactly ORV-281's six and `positioning` to `identity-frame` (W2) | Stories `Board` and `BoardEnglish`, play (the Tab order over the six nodes; Brand personality's card at world (1400, 160) with its state line, its three field names and no answer; Enter opens the viewer, Escape returns focus to the card); `business-graph.test.ts` › "boardGraphOf in %s" (`th`, `en`) › "has six nodes in fill order, each titled by the catalog and opening with no count" and "has exactly the seven edges of W2, each solid and with no label pill" |
| 10 | A project with a `given` personality | They switch the language in the header | Node title, labels, scale ends, points and state in the other language; the answers as typed; Thai text with no letter spacing | No second save | The English story beside each Brand personality story (`IdentityGivenEnglish` and the others) and `BoardEnglish`, each on an English fixture; `ProjectBoard.test.tsx` › "a foundation entry that was saved or refused" › "a language switch redraws the line and makes no second call". Not asserted by these at `3c646c4`: one given personality switched from Thai to English on one project, and no letter spacing on its Thai text |
| 11 | The personality editor, keyboard only, light and dark, a 360 px viewport, a 2,000-character Thai `never` answer with no spaces | They Tab through the editor, move between points with the arrow keys and save | Focus visible on each control in reading order; each scale named by "From {low} to {high}"; every line wraps; no horizontal scroll | Zero a11y violations | Stories `IdentityNarrowEditor`, `IdentityNarrowEditorDark` and `IdentityNarrowEditorEnglish`, play (Tab order person, never, the first point of each scale, Save, Cancel, each focus visible and no point checked; the focus form on each); `IdentityNarrow` and `IdentityNarrowDark` (a given personality whose two answers are 2,000 Thai characters with no spaces) and `IdentityNarrowEnglish`, play; each runs `expectFitsAt360`: the frame at most 360 wide, its `scrollWidth` at most its `clientWidth`, `document.documentElement.scrollWidth` at most the larger of 360 and the window's inner width; a11y addon. Not asserted by these at `3c646c4`: the arrow keys moving between points, the save at 360, and a 2,000-character answer inside the open editor |
| 12 | A project with a `given` personality | Its board is loaded twice, a day apart on a fake clock | No UI | The same view both times; nothing written, no limit consumed and no model call on loading | `data.test.ts` › "foundation replay" › "loaded twice a day apart gives the same view, and writes nothing, counts no limit, calls no model"; `foundation.integration.test.ts` › "open" › "returns no entry for a project with none, and writes nothing" |
| 13 | The PR 1 head | The gate runs | No UI | The new table is in `TENANT_TABLES` with row security and SELECT and INSERT only for the app role; each new column carries one classification tag, text and payload columns `personal`; `questions.test.ts` pins `identity-frame.proxy.person` and `identity-frame.proxy.never` to ORV-126; check-i18n and `apps/web/i18n/messages.test.ts` pass; no middot or em dash in new copy; no new module imports `openrouter` or `llm-interpreter`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass; `pnpm contrast` unchanged from `develop` | Gate output, which runs among others `access.test.ts` › "business_foundation_entry"; `classification.test.ts` › "pins the secret and personal columns"; `questions.test.ts` › "copy is ORV-126's" › "identity-frame.proxy.person and .never are ORV-126 'Missing strategy' word for word"; `business-strings.test.ts` › "brand personality, strings"; `foundation.test.ts` › "no model import"; `log.test.ts` › "writes a foundation entry line with closed words only" |
| 14 | In turn: an `architecture` `answered` entry with `subBrands` false; one with true; a `name` `given` entry of "  ORIVILO  "; one of 60 Thai characters; `subBrands` "no" as text; a name of 61 characters; a name of white space only; a `name` entry with an unknown key `screened`; an `architecture` `skipped` entry; a `name` `skipped` entry | `foundation-entry-1` checks it | No UI | The first four parse, the name as "ORIVILO" and the Thai name whole (W5); each other input fails at the path of its field | `foundation.test.ts` "architecture and name entries" |
| 15 | A saved Thai fixture project, positioning agreed, no architecture entry | They open Brand architecture ("โครงสร้างแบรนด์"), choose "No, it stands on its own" ("ไม่ใช่ แบรนด์นี้อยู่เดี่ยว ๆ") under "Does this brand sit above or below other brands?" ("แบรนด์นี้อยู่เหนือหรืออยู่ใต้แบรนด์อื่นหรือไม่") and press "Save this answer" ("บันทึกคำตอบนี้") | "Worked out by a fixed rule" ("ได้จากกฎที่กำหนดไว้"); under "Architecture" ("โครงสร้าง") "Single brand, one unit" ("แบรนด์เดียว หน่วยเดียว") with "Worked out from your answer: this brand does not sit above or below other brands." ("ได้จากคำตอบของคุณ: แบรนด์นี้ไม่ได้อยู่เหนือหรือใต้แบรนด์อื่น"); under "Other brands above or below" the answer; no control | One entry: node `architecture`, kind `answered`, `subBrands` false; no derived value stored; the view gives `architecture` `derived` with rule id `architecture-derive-1` | `foundation-actions.test.ts` "answer sub-brands"; `view.test.ts` "architecture derived"; story `ArchitectureDerived`, play |
| 16 | The project of row 15 before the answer; a second one the same | They press "Save this answer" with no choice; on the second, they choose "Yes, it sits above or below other brands" ("ใช่ แบรนด์นี้อยู่เหนือหรือใต้แบรนด์อื่น") and save | First "Choose one answer first." ("เลือกหนึ่งคำตอบก่อน"). On the second: "Not in this version" ("ยังไม่มีในเวอร์ชันนี้") with "A brand that sits above or below other brands needs a brand architecture study, which this version does not do yet." and no value under "Architecture"; the Name card shows "Waits for Brand architecture" ("รอ โครงสร้างแบรนด์ ก่อน") | No action call for the first; one entry with `subBrands` true for the second; `architecture` `open`, `name` `blocked` by `architecture` (W4, case 4) | Story `ArchitectureNotInVersion`, play; `view.test.ts` "architecture yes" |
| 17 | Three fixture projects: positioning with no choice and the answer "no"; positioning skipped and the answer "no"; positioning with no choice and no answer | They open Brand architecture | First: "Waits for Positioning" ("รอ จุดยืน ก่อน") with the saved answer and no "Single brand, one unit". Second: "Single brand, one unit", "Provisional. This rests on a step you skipped." ("ชั่วคราว เพราะอิงกับขั้นตอนที่คุณข้ามไว้") and "Rests on: Positioning" ("อิงกับ: จุดยืน"). Third: "Waits for Positioning" with the question and "Save this answer" still offered | `architecture` results equal W4: `blocked` by `positioning`; `derived`, `provisionalOn` `positioning`; `blocked` by `positioning` | `view.test.ts` "architecture marks"; story `ArchitectureMarks`, play |
| 18 | A saved Thai fixture project, positioning agreed, the architecture answer "no", no name | They open Name ("ชื่อแบรนด์"), press "Give a working name" ("ตั้งชื่อใช้งาน"), type "  ORIVILO  " and press "Use this working name" ("ใช้ชื่อนี้") | Under "Working name" ("ชื่อใช้งาน"): "ORIVILO" with "Working name, not screened for trademarks." ("ชื่อใช้งานชั่วคราว ยังไม่ได้ตรวจสอบเครื่องหมายการค้า"); "Given by you"; no mark; no control | One entry: node `name`, kind `given`, name "ORIVILO"; the log line holds no name | `foundation-actions.test.ts` "give a working name", with a spy on the logger; story `NameGiven`, play |
| 19 | The name editor of row 18 open | They save it empty; then with 61 characters; then press "Cancel"; then type a name and press save twice while a save runs | "Write a working name, or cancel." ("เขียนชื่อใช้งาน หรือกดยกเลิก"); "Use 60 characters or fewer." ("ใช้ไม่เกิน 60 ตัวอักษร") with the text kept; on "Cancel", the editor closed and focus on "Give a working name"; the button disabled with "Saving your choice" | No action call for the first two or "Cancel"; one call for the double press | Story `NameInvalid`, play with a stub action |
| 20 | A fixture project with positioning with no choice and no architecture answer | They open Name, give "ORIVILO" and save | Before: "Waits for Positioning" with "Give a working name" offered. After: "ORIVILO", "Working name, not screened for trademarks.", "Given by you" and "Not yet checked against: Positioning" ("ยังไม่ได้ตรวจทานกับ: จุดยืน") | One `name` entry; `name` `given` with `unchecked` `positioning` (W4, case 5) | `foundation-actions.test.ts` "a name ahead of positioning"; story `NameAhead`, play |
| 21 | In turn, for an `architecture` and a `name` entry: no session; an email not on the approved list; the `write` limit used up; a project of another workspace; an unknown project id; a project whose node already holds an entry | The entry action is called with a valid entry | No UI | `signed-out`; `forbidden` with no address and no limit consumed; `rate-limited` with `retryAfter`; one 404 body for the next two; `invalid-input` for the last; nothing saved in any case | `foundation-actions.test.ts` "architecture and name door" |
| 22 | A `name` entry `<img src=x onerror=alert(1)>` | They open Name | It as literal text; no image, no script, no link | None | Story `FoundationUntrustedText`, play |
| 23 | A saved project, PR 2 head, with the answer "no" and a name of 60 Thai characters with no spaces | Its board renders at 360 px, light and dark; they open Brand architecture and Name; they switch the language | Eight nodes and eleven edges (W2), Brand architecture and Name to the right of Positioning; each view's lines wrap with no horizontal scroll; titles, states and labels in the other language, the name as typed | Zero a11y violations | Stories `Board` and `FoundationNarrow`, play; a11y addon |
| 24 | The PR 2 head | The gate runs | No UI | Gate as row 13; `questions.test.ts` pins `situation.sub-brands` to ORV-126; `business-strings.test.ts` pins `strategy.provisional` to ORV-126 | Gate output |
| 25 | In turn: a `core-idea` `written` entry with a statement of 1 and of 300 characters and `remember` of 1 and of 2,000; one with no `remember`; a statement of white space only; one of 301 characters; `remember` of 2,001; a `skipped` entry with a `statement`; a kind `picked`; an unknown key `draftId` | `foundation-entry-1` checks it | No UI | The first two parse; each other input fails at the path of its field | `foundation.test.ts` "core-idea entry" |
| 26 | A saved Thai fixture project, positioning agreed, a `given` personality, no core idea entry | They open Core idea ("แนวคิดหลัก"), press "Write my own" ("เขียนเอง"), answer "After someone meets your brand, what one thing should they remember?" ("หลังจากได้รู้จักแบรนด์ของคุณ คุณอยากให้คนจำอะไรได้หนึ่งอย่าง"), write a core idea and press "Agree to this core idea" ("เห็นชอบแนวคิดหลักนี้") | Before: "Nothing given yet" ("ยังไม่มีข้อมูล") with "A gate: nothing builds on this until you agree to it." ("จุดตัดสินใจ: ยังไม่มีขั้นใดต่อยอดจากตรงนี้จนกว่าคุณจะเห็นชอบ"). After: under "Core idea" the statement as typed with "Written by you." ("คุณเขียนเอง"); "Agreed" ("เห็นชอบแล้ว") and "You agreed to this core idea." ("คุณเห็นชอบแนวคิดหลักนี้แล้ว") in place of the gate line; the answer under "The one thing to remember" ("สิ่งเดียวที่อยากให้คนจำ") with `business.label.yourWords`; no control | One entry: node `core-idea`, kind `written`, the trimmed statement and `remember`, made by the session's user inside `withWorkspace`; the log line holds no text | `foundation-actions.test.ts` "write the core idea", with a spy on the logger; story `CoreIdeaWritten`, play |
| 27 | The core idea editor of row 26 open | They press "Agree to this core idea" with the core idea empty; then with 301 characters; then with a valid one while the action answers `rate-limited`; then press "Cancel" and open "Write my own" again; then press agree twice while a save runs | "Write your core idea before you agree to it, or cancel." ("เขียนแนวคิดหลักของคุณก่อนกดเห็นชอบ หรือกดยกเลิก"); "Use 300 characters or fewer." ("ใช้ไม่เกิน 300 ตัวอักษร"); `saved.errors.rate-limited` with the wait; the text kept each of those three times; on "Cancel", focus on "Write my own" and empty fields when it opens again; the button disabled with "Saving your choice" and "Cancel" disabled | No action call for the first two or "Cancel"; one call for the double press; nothing saved on `rate-limited` or "Cancel" | Story `CoreIdeaInvalid`, play with a stub action |
| 28 | The project of row 26 before any core idea entry | They press "Skip for now"; later they write their own and agree | First "Skipped for now" with the gate line and "Write my own" still offered, no "Skip for now"; then the view of row 26 | Two entries, `skipped`, then `written`; the newest wins | `foundation-actions.test.ts` "skip, then write"; story `CoreIdeaSkipped`, play |
| 29 | Three fixture projects with no core idea entry: positioning agreed and no personality entry; positioning with no choice and no personality entry; positioning stale and a `given` personality | They open Core idea; then the action is called directly with a valid `written` entry on each | First "Waits for Brand personality" ("รอ บุคลิกของแบรนด์ ก่อน"); second and third "Waits for Positioning" ("รอ จุดยืน ก่อน"); each with the gate line and no control | Each direct call refused as `invalid-input`; nothing saved | `foundation-actions.test.ts` "core idea waits"; story `CoreIdeaWaits`, play |
| 30 | Three fixture projects with a `written` core idea: positioning skipped and a `given` personality; positioning agreed and a `skipped` personality; all agreed on intake A, then a later intake B saved | They open Core idea | Each still "Agreed" with "You agreed to this core idea."; first "Not yet checked against: Positioning"; second "Not yet checked against: Brand personality" ("ยังไม่ได้ตรวจทานกับ: บุคลิกของแบรนด์"); third "Not yet checked against: Positioning" | `core-idea` results equal W4 cases 2, 4 and 5 | `view.test.ts` "core idea marks"; story `CoreIdeaMarks`, play |
| 31 | Four fixture projects, one per row of `core-idea-gate-1`: waiting, open, skipped, agreed | The board renders and they open Core idea on each | On the card and in the view, in order: "Waits for Positioning" with the gate line; "Nothing given yet" with the gate line; "Skipped for now" with the gate line; "Agreed" with "You agreed to this core idea." | None | Stories `CoreIdeaStates`, `CoreIdeaStatesOpen`, `CoreIdeaStatesSkipped`, `CoreIdeaStatesAgreed`, each with its English story, play |
| 32 | In turn: no session; an email not on the approved list; the `write` limit used up; a project of another workspace; an unknown project id; the project of row 26 after its `written` entry, sent a `written` and then a `skipped` entry | The entry action is called with a valid `core-idea` entry | No UI | `signed-out`; `forbidden` with no address and no limit consumed; `rate-limited` with `retryAfter`; one 404 body for the next two; `invalid-input` for both of the last, the newest entry still the first `written`; nothing saved in any case | `foundation-actions.test.ts` "core idea door" and "agreed stays agreed" |
| 33 | A `written` core idea whose statement is `<img src=x onerror=alert(1)>` and whose `remember` is `<script>alert(1)</script>` | They open Core idea | Both as literal text; no image, no script, no link | None | Story `FoundationUntrustedText`, play |
| 34 | A saved project, PR 3 head, with a 300-character Thai core idea with no spaces | Its board renders at 360 px, light and dark, keyboard only; they Tab to Core idea, open it and switch the language | Nine nodes and thirteen edges (W2), Core idea to the right of Brand personality; focus visible; the view wraps with no horizontal scroll; titles, states and gate lines in the other language, the statement as typed | Zero a11y violations | Stories `Board` and `CoreIdeaNarrow`, play; a11y addon |
| 35 | Fixture projects holding, together, every state the four nodes take in rows 2, 4, 15, 16, 18, 26 and 28 | They open each of the four views | None of the five AI labels listed in `foundation-honest-1`; no number other than "n of 5" points; no text saying verified, tested, screened or registered | No entry row holds a model id | Story `FoundationNoAi`, play reads the text; `view.test.ts` "foundation, no AI label" |
| 36 | A project with all four nodes holding an entry | Its board is loaded twice, a day apart on a fake clock | No UI | The same view and marks both times; nothing written, no limit consumed and no model call on loading | `data.test.ts` "foundation replay, all four" |
| 37 | The PR 3 head | The gate runs | No UI | Gate as row 13; `questions.test.ts` pins `core-idea.proxy.remember` to ORV-126 | Gate output |

## Rows that render nothing

- Rows: 1, 7, 12-14, 21, 24, 25, 32, 36, 37

## Rows per PR

- PR 232: rows 1-13

## Delivery: three PRs

Each PR closes a piece the owner can open, and none calls a model. Function, file and table names are suggestions; each named test keeps its name.

1. **PR 1, the brand personality (rows 1-13).** The foundation table and its migration with row security, the entry contract (`foundation-entry-1`) for `identity-frame`, the entry action (`foundation-door-1`), `foundation-roots-1` and `foundation-marks-1`, `identity-frame-1`, the Brand personality node on the board and its view, the copy of PR 1. Done: after the positioning gate is passed or skipped, a person can describe the brand's personality on five scales, or skip it, and the board shows what it rests on.
2. **PR 2, the architecture and the working name (rows 14-24).** The two entry kinds, `architecture-derive-1`, `working-name-1`, their nodes and views, the copy of PR 2. Done: the board shows the brand's architecture worked out from one answer, and the working name with its label.
3. **PR 3, the core idea gate (rows 25-37).** The `core-idea` entry kinds, `core-idea-gate-1`, its node and view, `foundation-honest-1` over all four nodes, the copy of PR 3. Done: a person can agree to the one idea the visuals will express, or skip it, and the foundation of ORV-126 D4 (positioning, personality, core idea) is on the board.

PR 1 waits on ORV-285 PR 1 (PR 226) in `develop`, because `foundation-roots-1` reads `positioning-gate-1`. PR 2 and PR 3 each wait on PR 1. Each is likely near or past 400 changed lines; the split follows the fill order, one whole node or pair per PR.

## Impact on contracts

- **Engine, `packages/intent-engine/src/business`.** New: the entry contract (`foundation-entry-1`), the marks function (`foundation-marks-1`, the first code of ORV-126's propagation rule, on six nodes; ORV-126 slice 3 may take it over with the same node ids), the architecture rule, the core idea gate state. `PROXY_QUESTIONS` (`questions.ts`) gains `identity-frame.proxy.person`, `identity-frame.proxy.never` and `core-idea.proxy.remember`, and the copy of `situation.sub-brands` gets a pinned home beside it. `BusinessView` (`view.ts`) gains the four nodes with their status, marks, content and controls; whether `BUSINESS_NODES` and `BUSINESS_EDGES` (`place.ts`) grow or a second list is added is the architect's. Readers to re-check: `business-board.tsx`, `business-node-view.tsx`, `business-text.ts`, `business-graph.ts` (`BUSINESS_POSITIONS`), `business-board.stories.tsx`, `apps/web/app/business/[projectId]/page.tsx`. Unchanged: the intake contract, `placeIntake`, `nodeStates`, the evidence contract, `EVIDENCE_SCHEMA_VERSION`, `MODEL_JOBS`, `AI_MODELS`, ORV-20's colour rules and `PERSONALITY_AXES`.
- **Storage.** One new tenant table (default), append-only, with `workspace_id`, a foreign key to the project in the same workspace, row security, SELECT and INSERT only, `TENANT_TABLES` and `CLASSIFICATION` entries, and its migration (PR 1). Table shapes are the architect's.
- **Auth and limits.** The entry action or actions behind `withWorkspace` and the ORV-268 approved list; new route names in `ROUTES` (`packages/auth/src/log.ts`); the `write` limit reused with no new number. `security` reviews each PR (ADR 0015 decision 2: server actions and `packages/intent-engine/**`).
- **UI.** The new catalog keys of "Strings", `strategy.provisional` entering the catalog as ORV-126's copy, the business board example screen (`packages/design-system/src/examples`); no new shared component, no shared component change, no token change.
- **Model jobs.** None in this story. Under open question 1 (b), a new pinned job, its ADR 0009 addition under ORV-284 and its evaluation set.

## Out of scope

- Options drafted by a model for `identity-frame` and `core-idea` (open question 1); the brand brief.
- Changing or withdrawing any value once given, answered or written; deleting an entry (open question 9).
- Every node after `core-idea`: `logo-type`, `logo-mark`, `color`, `typography`, `guidebook`; reading the axes into colour decisions on the board.
- `verbal` (D4); naming as a strategy output; trademark screening.
- An architecture for a brand above or below other brands; groups C and D.
- The entry classifier and the marks of the business nodes (departures 1 and 2).
- The final look of the views (POC focus is function); the designer's G2 notes set the layout.

## Open questions for the owner (one round, with defaults)

1. **Drafted options (D1 step 2) for the personality and the core idea.** (a) Later stories, one per node as ORV-126 D1 "Impact" plans, after ORV-285 PR 2 has proven the drafting pattern on positioning; (b) the core idea's drafts as a fourth PR of this story, on the pattern of ORV-285 PR 2, with a new pinned job on an Anthropic model through OpenRouter under ORV-284, its ADR 0009 addition, its evaluation set and a recorder run the owner confirms first, the personality's later; (c) both in this story. Impact: (b) and (c) add a model call, labels and an evaluation set, and pass the bound of three PRs; drafting the personality turns words into scale points, a reading of a hypothesis vocabulary. Default: (a).
2. **How the five axes are asked.** (a) A scale of five points per axis with its two ends named in plain words, stored as 0, 25, 50, 75 and 100 (`identity-frame-1`); (b) a slider of 0 to 100 per axis, which needs an unset state so that no value is preset; (c) paired choices, two short descriptions per axis, mapped to a value by a rule; (d) a reading of the two proxy answers into the axes by a model, with exact quotes. Impact: (b) changes the editor; (c) adds copy and a rule; (d) adds a model job and labels, and presents a hypothesis vocabulary as a reading. Default: (a).
3. **May the personality and the core idea be given while positioning is not agreed.** (a) ORV-126 as written: given at any time, with the gap listed under `unchecked`; (b) only while the node has no block cause: positioning agreed or skipped, and for the core idea the personality given or skipped; while positioning is open or stale they wait (`foundation-entry-1`, departure 4); (c) only once positioning is agreed, a skip blocking too, which departs from ORV-126 D1 step 3. Impact: (a) contradicts the Positioning card's own line "A gate: nothing builds on this until you agree to it." Default: (b).
4. **Where the working name is asked.** (a) In the Name view, at any time (`working-name-1`); (b) as an optional field on the intake, which changes ORV-281 `intake-fields-1` and the intake contract; (c) in the Name view with the project name offered as a one-press choice. Default: (a).
5. **Where the four nodes sit.** (a) On the same business board, to the right of Positioning, in fill order; (b) on a second board for the brand foundation, linked from the business board; (c) stacked under the board. Default: (a).
6. **`situation` without a classifier (departure 1).** (a) It counts as done for every saved project; (b) it stays open until ORV-126 slice 2 exists, which blocks the architecture until then. Default: (a).
7. **The gaps of the business nodes (departure 2).** (a) The marks start at positioning; (b) the full propagation, with `business-core`, `audience` and `competitive-frame` counted open until a story lets the person give them a value, so every foundation node lists them under `unchecked`. Default: (a).
8. **Where `situation.sub-brands` is asked (departure 3).** (a) In the Brand architecture view; (b) on the intake form. Default: (a).
9. **Changing a value.** (a) Out of this story, as for positioning; (b) the personality and the name may be given again, the newest winning, and an agreed core idea reopens when the personality changes after it. Default: (a).
10. **The bound of a core idea.** (a) 1 to 300 characters, as a positioning statement; (b) 1 to 120 characters, closer to one line. Default: (a).
11. **A brand above or below other brands.** (a) The architecture stays open with `business.architecture.notInVersion`, and the name waits on it or lists it as unchecked; (b) one more question on the number of units, and a rule to derive "endorsed" or "house of brands", which ORV-126 gives no rule for in groups A and B. Default: (a).
12. **The board's lede.** `business.board.lede` says "Nothing here is confirmed yet." while agreed gates show under it. (a) Unchanged in this story; (b) a new line once any gate is passed. Default: (a).
13. **Where the hypothesis line of the five scales shows.** (a) Where `foundation-honest-1` places it, the designer's reading of v1.1's "always" (`design.md` section 15 item 5); (b) in every state of the Brand personality view, also above the empty Personality field while the node waits, is open or is skipped. Impact: (b) adds the line to states I1 to I3 of `design.md` section 6.1 and to their plays; no data, rule or string changes. Default: (a), accepted at G2 under the owner's POC delegation (ORV-291 comment 10741); the owner has not ruled on it and may change it.
14. **The business board at a 360 px viewport.** (a) What `foundation-board-1` states for 360 px, as built at `3c646c4` (`design.md` sections 2.3, 6.5 and 15 item 3); (b) a pan into view on focus in the shared `CanvasBoard`, so each card Tab reaches is shown whole, a follow-up on the second slice card of ORV-280; (c) the four nodes on a second board linked from the business board (open question 5 (b)), so the business board keeps ORV-285's every-card-inside check at 360. Impact: (a) changes ORV-285's `narrowPlay` story; (b) changes a shared component, so every story that uses `CanvasBoard` is checked, and the B3 play then asserts each focused card inside the board; (c) adds a board, its place in the page and its stories, and changes `foundation-board-1` and the Check cells of rows 9, 23 and 34. Default: (a). The designer's first reading (each focused card fully in view) was accepted at G2 under the owner's POC delegation (ORV-291 comment 10741); the reading as built was accepted by the main session under the same delegation (ORV-291 comment 10748), with (b) as the follow-up and (c) left open to the owner. The owner has not ruled on it and may change it.

## Depends on

- [ORV-126 spec](../ORV-126/spec.md) v1.4: "Fill order" rule 4 and the group A plan; "The propagation rule"; "Missing strategy" (D1, the proxy questions of nodes 7 and 11, `strategy.skip`, `strategy.provisional`); nodes 1, 7, 8, 9 and 11; "The start question" (`situation.sub-brands`); "Rules and bounds" (Inventory `name`, State); "Hypotheses"; decisions D1, D3, D4, D6 and D9; row 25.
- ORV-285 spec v1.2, on the branch of PR 226: `positioning-gate-1`, `positioning-choice-1` "The editors", "Strings". PR 1 of this story waits on PR 226 in `develop`.
- [ORV-281 spec](../ORV-281/spec.md) v1.4: `business-board-1`, `honest-business-1`, "Strings", departure 1; ORV-282 (the board and the viewer); ORV-283 (the reading of `situation.name`, never used as the working name).
- ORV-20 slice A: `PERSONALITY_AXES` (`knowledge.ts`) and the `personality` facts its colour rules read (`color-rules.ts`, `rules.ts`).
- ORV-268 `read-allow-list-1`, `read-door-1`; ORV-112 (`LIMITS`, the `write` limit).
- ORV-284: the owner's policy of 2026-11-18 on Anthropic models, for open question 1 only.
- ADR 0002, ADR 0012 (lane L), ADR 0015 decisions 2, 9 and 10; [ADR 0009](../../adr/0009-ai-through-openrouter.md) only under open question 1 (b).
- Knowledge: K-0028 (0.8), K-0031 (0.7), K-0032 (0.8), K-0035 (0.75), K-0036 (0.75).

## Worked examples

Run by the main session on 2026-11-19: the five outputs match the expected lines below. Each line runs from the repo root with `node -e`. Inputs are copied from the source each example names; outputs are integers or strings, no rounding.

W1. The whole plan's counts, from the table "The whole plan before this story" in its row order. States: `develop`, `review`, `engine` (rules only) and `none`; this story adds rows 6 to 9 (indexes 5 to 8). Expected `14 4 1 1 8 9 5`: rows, in `develop`, in review, engine only, not built, on the board after this story, not on the board after it.

```bash
node -e 'const t=["develop","develop","develop","develop","review","none","none","none","none","none","none","engine","none","none"];const add=[5,6,7,8];const c=k=>t.filter(x=>x===k).length;const on=t.filter((x,i)=>x==="develop"||x==="review"||add.includes(i)).length;console.log(t.length,c("develop"),c("review"),c("engine"),c("none"),on,t.length-on)'
```

W2. Nodes and edges on the board after each PR: ORV-281's five nodes and six edges, plus one node and one edge per require of `foundation-board-1`. Expected `6/7 8/11 9/13`.

```bash
node -e 'const add=[{"identity-frame":["positioning"]},{architecture:["situation","positioning"],name:["positioning","architecture"]},{"core-idea":["positioning","identity-frame"]}];let n=5,e=6;const out=[];for(const pr of add){n+=Object.keys(pr).length;e+=Object.values(pr).flat().length;out.push(n+"/"+e)}console.log(out.join(" "))'
```

W3. `identity-frame-1`, the stored value of each point of a scale, on ORV-20's 0 to 100 range. Expected `0 25 50 75 100`.

```bash
node -e 'console.log([1,2,3,4,5].map(p=>(p-1)*25).join(" "))'
```

W4. `foundation-marks-1`: ORV-126 "The propagation rule" on the four nodes, with the roots of `foundation-roots-1`. Five cases: (1) positioning done, the personality and the name given, the architecture answered "no", the core idea given; (2) the same with positioning skipped; (3) positioning open and nothing else stored; (4) positioning done, the personality skipped, the architecture answered "yes", no name, the core idea given; (5) the stored values of case 1 with positioning open (stale). Expected, one line per case:
`identity-frame:given architecture:derived name:given core-idea:given`,
`identity-frame:given/unchecked=positioning architecture:derived/provisionalOn=positioning name:given/unchecked=positioning core-idea:given/unchecked=positioning`,
`identity-frame:blocked/blockedBy=positioning architecture:blocked/blockedBy=positioning name:blocked/blockedBy=positioning core-idea:blocked/blockedBy=positioning`,
`identity-frame:skipped architecture:open name:blocked/blockedBy=architecture core-idea:given/unchecked=identity-frame`,
`identity-frame:given/unchecked=positioning architecture:blocked/blockedBy=positioning name:given/unchecked=positioning core-idea:given/unchecked=positioning`.

```bash
node -e 'const R={"identity-frame":["positioning"],architecture:["situation","positioning"],name:["positioning","architecture"],"core-idea":["positioning","identity-frame"]};const num={situation:1,positioning:6,"identity-frame":7,architecture:8,name:9,"core-idea":11};const srt=s=>[...s].sort((a,b)=>num[a]-num[b]).join(",");const done=x=>x==="done"||x==="given"||x==="derived";const run=(p,s)=>{const o={situation:{st:"done",pv:[],un:[],bl:[]},positioning:{st:p,pv:[],un:[],bl:[]}};const out=[];for(const n of Object.keys(R)){const sk=new Set(),bl=new Set(),un=new Set();for(const r of R[n]){const q=o[r];if(q.st==="skipped")sk.add(r);else if(q.st==="blocked")q.bl.forEach(x=>bl.add(x));else if(!done(q.st))bl.add(r);else for(const x of [...q.pv,...q.un])(o[x].st==="skipped"?sk:un).add(x)}let e;if(s[n]==="given")e={st:"given",pv:[],un:[...sk,...bl,...un],bl:[]};else if(bl.size>0)e={st:"blocked",pv:[],un:[],bl:[...bl]};else e={st:s[n],pv:[...sk],un:[...un],bl:[]};o[n]=e;out.push(n+":"+e.st+(e.bl.length?"/blockedBy="+srt(e.bl):"")+(e.pv.length?"/provisionalOn="+srt(e.pv):"")+(e.un.length?"/unchecked="+srt(new Set(e.un)):""))}return out.join(" ")};const G={"identity-frame":"given",architecture:"derived",name:"given","core-idea":"given"};console.log(run("done",G));console.log(run("skipped",G));console.log(run("open",{"identity-frame":"open",architecture:"open",name:"open","core-idea":"open"}));console.log(run("done",{"identity-frame":"skipped",architecture:"open",name:"open","core-idea":"given"}));console.log(run("open",G))'
```

W5. `working-name-1`, the trim and the bound of 1 to 60 characters (ORV-126 "Rules and bounds", Inventory), counted as JavaScript string length as `intake.ts` counts, on the name of ORV-126 row 6 padded with spaces, 60 and 61 Thai characters, and spaces only. Expected `ok:7 ok:60 refused refused`.

```bash
node -e 'console.log(["  ORIVILO  ","ก".repeat(60),"ก".repeat(61),"   "].map(s=>{const t=s.trim();return t.length>=1&&t.length<=60?"ok:"+t.length:"refused"}).join(" "))'
```

## Downstream review if this spec changes

- ORV-126 spec: nodes 7, 8, 9 and 11 ("drafted options later"), "Rules and bounds" State (in memory), "The propagation rule" (now coded for six nodes, `foundation-marks-1`), by departures 1 to 6.
- ORV-281 spec: `business-board-1` (five nodes and six edges), by `foundation-board-1`; ORV-281 design section 5 (the node view).
- ORV-285 spec: `positioning-gate-1`, read as a root here; the `business.positioning.*` keys this story reuses on other nodes.
- The G1 packet (open questions 1 to 12), the architect's tech notes, the designer's notes for the four views, the builder, `security` and qa envelopes for the three PRs.

## Changelog

- v1.0 (2026-11-19): first version, task ORV-291-spec-1, from ORV-126 v1.4 ("Fill order", "The propagation rule", "Missing strategy", nodes 1, 7, 8, 9 and 11, decisions D1, D3, D4, D6 and D9), ORV-285 v1.2 (PR 226 branch), ORV-281 v1.4, ORV-283 v1.1, the brief, `brand-ci-method.md`, ADR 0009 and the code of `questions.ts`, `intake.ts`, `place.ts`, `view.ts`, `color-rules.ts`, `knowledge.ts` and the business board example. No Jira tool call and no shell in this role, so ORV-291 and ORV-284 were taken from the envelope's facts; the main session then ran the five worked examples (all match) and checked that plan rows 1 to 4 are on staging. Downstream to review: the G1 packet, the architect's tech notes, the designer's notes, the builder, `security` and qa envelopes for PRs 1 to 3.
- v1.1 (2026-11-19): one Check cell, from the architect (task ORV-291-tech-1), accepted by the main session under the owner's POC delegation. Row 24: `strategy.provisional` is pinned to ORV-126 by `business-strings.test.ts`, not by `questions.test.ts`, because the engine holds no catalog line and cannot import the design system; `strategy.skip` is pinned the same way by ORV-285. `questions.test.ts` still pins `situation.sub-brands`. No row number, rule, string, bound, default or open question changed. Downstream to review: tech notes tests T31 and T33, which already read this way.
- v1.2 (2026-11-19): two readings of the designer's notes, accepted at G2 under the owner's POC delegation (ORV-291 comment 10741), task ORV-291-spec-2. `foundation-honest-1`, the row of the five scales: where the hypothesis line shows, in the words of `design.md` section 15 item 5, in place of "always" and "once per view". `foundation-board-1` gains what holds at a 360 px viewport from PR 1 (`design.md` sections 2.3 and 15 item 3), checked by the B3 play. Open questions 13 and 14 hold both as defaults the owner can change. No acceptance row rested on "always", so none changed; no row renumbered, no string, bound, rule outcome or other default changed. Downstream to review: the A3 builder envelope (stories `IdentityNarrow` and `Board`, ORV-285's `narrowPlay` in `business-board.stories.tsx`), the qa envelope and the G3 packet of PR 1, the next owner packet (open questions 13 and 14), `design.md` section 15 item 5 (it quotes v1.1's "always"), ORV-281 design D4a (its 360 reasoning rests on every card inside the board).
- v1.3 (2026-11-19): task ORV-291-spec-3, the documents brought to what builder tasks A2 (`aeb12f0`) and A3 (`3c646c4`) built for PR 1, under the decision of ORV-291 comment 10748 (the main session, under the owner's POC delegation; the owner can change it). `foundation-board-1`, at 360 px: focus brings a card into view only when no part of it is in view, so a card partly in view stays cut (Situation and Brand personality by 59 px each, measured by A3's play); the B3 play asserts zoom 0.25, no sideways scroll, and that every focused card takes focus and overlaps the board, and it runs in the narrow board stories, not in `IdentityNarrow` (A3's deviation on design 2.2 and 6.5 B3). Open question 14 gains (b), a pan into view on focus in the shared `CanvasBoard` as a follow-up on the second slice card of ORV-280; the second board becomes (c). The Check cells of rows 1 to 13 name the test titles and stories as they exist at `3c646c4`, read from the test and story files; row 9's `business-graph.test.ts` "foundation edges" does not exist and is replaced by the titles that hold its asserts; rows 3, 10 and 11 name what their tests do not assert. No Shown or Data effect cell of rows 1 to 13 states anything a deviation of A2 or A3 names as wrong, so none changed. No row renumbered; rows 14 to 37 unchanged; no string, bound, rule outcome or other default changed; no requirement added. Downstream to review: `design.md` sections 2.3, 6.5 and 15 item 3 and `tech.md` sections 3, 4, 8, 9 and 13 (corrected in the same task), the qa envelope and the G3 packet of PR 1, the next owner packet (open question 14), the second slice card of ORV-280, ORV-281 design D4a.
