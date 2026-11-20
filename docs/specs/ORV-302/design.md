---
issue: ORV-302 (https://tpetkaew.atlassian.net/browse/ORV-302)
spec: docs/specs/ORV-302/spec.md v1.2 (v1.1 by comment 10786; v1.0 at ec6d2fa)
tech: docs/specs/ORV-302/tech.md (6c0abb8, read for file and prop names only)
task: ORV-302-design-1, revised by ORV-302-design-2 and ORV-302-design-r1
author: designer
date: 2026-11-20
---

# ORV-302 design: the first brand guidebook

One new page, `/business/<projectId>/guidebook`, and one new link on the business board. The page is a document a person reads top to bottom: a brand guidebook draft, set as type on the page canvas, not a set of cards, not a dashboard and not a settings screen. No new component, token, recipe class, public prop or string: every word below is a key of the spec's Strings table or a key the catalog already holds. Built from catalog components only: `PageHeader`, `SectionHeader` (with its divider), `Button` (`asChild`, `variant="secondary"`) and the board's `BusinessAccessNotice`; everything else is semantic HTML with the type utilities and Tailwind layout classes named here.

Every number in this file was measured on a rendered mock (section 20): the markup written with the classes named here, composed from this worktree's design-system source and token CSS (`feature/ORV-302-brand-guidebook`, head 6c0abb8), under the neutral profile, at 360 and 1440 px, Thai and English, light and dark. 12 states, 96 frames. Nothing here is built code.

## How to read this file

<!-- prettier-ignore -->
| Reader | Reads |
| --- | --- |
| PR 1 builder (spec rows 1-19, 23) | Sections 1 to 13: flow, intent, page frame, the cover, the lead block, item anatomy, the foundation items (7.1, 7.2), Logo mark as not in this version (7.3), the two lists (8, 9), the back link, the access notices, the board link, and the three visual items Logo type, Colour and Typography (13); then 15 (accessibility), 16 (plays P1 to P21 and P24), 17 (stories, PR 1) |
| PR 2 builder (spec rows 20-22) | Section 14 (the positioning states awaiting choice, picked and edited) only, over the page PR 1 built; then 16 (plays P15 grown, P22, P23), 17 (stories, PR 2) |
| Visual QA | Sections 16, 20 and 21 |

The screen is `GuidebookScreen` in `packages/design-system/src/examples/guidebook.tsx` with its stories in `guidebook.stories.tsx` under the title `Examples/Application: Brand guidebook` (tech.md G9). The `data-*` names below are test hooks for the plays, not props.

## 1. Flow

1. On the board (`/business/<projectId>`), the page header shows `business.board.openGuidebook` as the first action (section 12). Tab or click.
2. A full page load opens `/business/<projectId>/guidebook`. The app header and its language switch stay as on every page. Focus starts at the document start, as on every page load (section 15).
3. The person reads, top to bottom, in the order of `guidebook-sections-1`: the title block, the lead block, the foundation section, the visual section, Not yet confirmed, Not in this guidebook, then the back link. Nothing on the page changes anything; the back link is the one control of the page body.
4. `business.guidebook.backToBoard` loads the board again (a full page load, focus at the document start).
5. A language switch redraws the same page in the other language with no second load of data (tech.md: the guidebook holds keys, never resolved text).
6. Signed out, not allowed or not configured: the page shows its title and the board's notice instead of the content (section 11).

## 2. Source intent, and the reading rhythm it asks for

- **Intent.** The spec's "Screens": one page that reads top to bottom, held to a high bar, "nothing that reads as a template or as made by AI". The honest rule `guidebook-honest-1`: the page says once that rules put it together and that it stays a draft, and no line claims more.
- **What it is.** A brand guidebook draft. A guidebook is read in order, like a printed document: a cover, then chapters, each with its entries. So the page is a single text column on the page canvas, with no sheet, card, tile or panel surface, no imagery, no logo, no swatch, no score, no count and no progress meter.
- **Measure.** One column of 640 px of text at 1440 (`max-w-2xl` with `px-4`, 42rem), the same column as the app header above it, so the logo, the title and every line of the page share one start edge. At 640 px a 16 px Latin line holds about 75 characters and a 20 px line about 60; Thai lines hold a little more. At 360 the column is 328 px.
- **Type ramp of three steps, by role.** The document title at 32 px (`PageHeader`, display-md); the values the person gave or a rule worked out at 20 px (`text-body-lg`) or, for a person's answer under a field name, 16 px (`text-body-md`); every line about a value (its state, its method, its reason, its rule, its labels, its marks, what it waits for) at 14 px (`text-body-sm`, `text-label-md` for entry titles). Section titles sit between them through `SectionHeader`.
- **Done and open, at a glance and in words.** A done item carries a value line at 20 or 16 px in primary ink; an open item carries only 14 px lines, so it reads shorter and quieter before a word is read. In words, every item's second line is its board state ("Agreed", "Worked out by a fixed rule", "Waits for Positioning", "Not in this version"). No colour, chip, icon or weight is the only carrier of the state.
- **Spacing carries the structure, rules carry only the chapters.** 48 between the title block and each section, 32 between entries, 12 inside an entry between its head, its question and its value, 4 between the lines of one group. The only ruled lines are the section dividers of `SectionHeader`.
- **Peer lines, 2026-11-20 (ORV-302-design-r1).** "4 between the lines of one group" holds only where the line changes size, weight or colour. Two lines of one style that are each their own statement (two questions, two notes, two labels, a reason and its rule) are 8 apart. The full rule, its survey and the classes per list are section 6.1.

## 3. Page frame

<!-- prettier-ignore -->
| Part | Markup and classes | Measured |
| --- | --- | --- |
| Route page | `apps/web/app/business/[projectId]/guidebook/page.tsx` renders `<main className="w-full">` around the screen, as the board page does | |
| Screen root | `div` `@container mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-12 px-4 pt-6 pb-12 wrap-anywhere` `data-guidebook` | content left 16 at 360, 400 at 1440; content width 328 and 640; `scrollWidth` equals the viewport in all 96 frames |
| Children, in order | cover (section 4), five `section`s in this order: lead (section 5), foundation (7.1, 7.2), visual (7.3, 13), unconfirmed (8), not held (9); then the back link (section 10) | gap between each 48 |
| A section | `section` `flex min-w-0 flex-col gap-6`, `aria-labelledby="gb-<id>"`, `data-section="<id>"` with ids `business`, `foundation`, `visual`, `unconfirmed`, `notHeld`; first child `SectionHeader` with `id="gb-<id>"`, `title`, `divider`, and on the lead block `description` | section header bottom to first child 24 |
| Items list | `div` `flex min-w-0 flex-col gap-8` inside the foundation and visual sections | entry to entry 32 |

The board is wider (`p-6`, full width) because it holds a map; the guidebook is text and takes the app header's column instead. Both are the spec's "reuse the page header" pattern; the start edge of the guidebook is the app header's (x 16 and x 400), measured equal.

## 4. The title block (cover)

`div` `flex min-w-0 flex-col gap-6` `data-cover`:

1. `PageHeader` with `title={g.title}` (`business.guidebook.title`, the one `h1`), `description={<bdi className="block">{projectName}</bdi>}`, `meta={<span className={FIELD_NOTE}>{savedAt}</span>}` (`business.board.savedAt` with `formatSavedAt`). No `actions`.
2. `div` `flex min-w-0 flex-col gap-3` `data-preface`: `p` `text-body-md` with `business.guidebook.byRule`, then `p` `text-body-md` with `business.guidebook.draftNote`, primary ink.

The preface is the guidebook's honest statement (`guidebook-honest-1`), so it is set as body text a reader reads, not as a 14 px note or an alert: 24 below the saved line, 12 between its two paragraphs. No `Alert`, no icon, no surface. The title is the guidebook's ("Brand guidebook, draft"), the project name its description, so the person sees what this document is before whose it is.

## 5. The lead block

`section` `data-section="business"` with `SectionHeader` `title={business.guidebook.section.business}` `description={business.guidebook.businessNote}` `divider`, then:

`dl` `grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 @[30rem]:grid-cols-2` `data-lead`, four `div` `flex min-w-0 flex-col gap-0.5`, each `dt` `text-label-md` (the node title) and `dd` `FIELD_NOTE` (its board state line), in the order `situation`, `business-core`, `audience`, `competitive-frame`.

- Two columns once the column is 480 px or wider (the 1440 frames: starts at x 400 and x 732, rows 12 apart), one column at 360 (four rows, 12 apart).
- A definition list, not headings: these are four named lines with a state, not entries with content. It is set apart only by its own section title and the note under it, which says that the answers live on the board.
- Nothing else: no answer, no reading (spec open question 6).

## 6. Item anatomy (every foundation and visual item)

`div` `flex min-w-0 flex-col gap-3` `data-item="<id>"` `data-done="true|false"`, children in this order, each present only when it has content:

<!-- prettier-ignore -->
| Part | Markup and classes | Content |
| --- | --- | --- |
| Head | `div` `flex min-w-0 flex-col gap-1` `data-head` | `h3` `self-start text-label-md` (the item title); `p` `FIELD_NOTE` `data-state` (the board state line); an optional note `p` `FIELD_NOTE` (the reason a step is out of this version, the out-of-date line), from 2026-11-20 inside one `div` `mt-1 flex min-w-0 flex-col gap-2` `data-notes` (6.1, R1-3); the mark lines (below) |
| Mark lines | inside the head, after the state line; from 2026-11-20 each mark block takes `mt-1`, 8 below the line above (6.1, R1-4, R1-5) | provisional: `div` `flex flex-col gap-1` `data-marks="provisional"` with the two lines of `provisionalLines` (`strategy.provisional`, `business.marks.restsOn`), each `p` `text-body-sm`; unchecked: `p` `text-body-sm` `data-marks="unchecked"` (`business.marks.unchecked`). Primary ink, 14 px: a mark is a line to read, one step stronger than the state line, never coloured |
| Ask | `div` `flex min-w-0 flex-col gap-1` `data-ask` | `p` `FIELD_NOTE` `business.stillToAsk`; `ul` `flex flex-col gap-2` (was `gap-1`, changed 2026-11-20, 6.1 R1-1), each `li` `text-body-sm` one question in primary ink |
| Value | one block, `data-value` | per item, sections 7 and 13 |

`FIELD_NOTE` is the existing `text-body-sm text-text-secondary` of the business examples. Head to the next block is 12 (measured on every done item of every frame). Typed text (project name, statements, answers, the working name) is a text node in `bdi` with `whitespace-pre-wrap` (tech.md 7.1); a `bdi` that holds a whole value is `block` (`<bdi className="block">`), so a soft wrap's hanging space never pushes its box past the column (section 19, item 2). A `bdi` inside a sentence (the name inside `business.logoType.nameLength`) stays inline.

### 6.1 Peer lines (2026-11-20, ORV-302-design-r1, answers finding R1 of ORV-302-signoff-1)

**Cause.** The rows above set the Ask's questions (`ul` `gap-1`) and section 8 a skipped step's questions the same way: 4 between two questions on a 23.8 px line (14 px at 1.7). The pitch from the last line of one question to the first line of the next was 27.8, the pitch between two lines of one question 23.8, a ratio of 1.17. A Thai question carries no question mark, so once the first question wraps (Brand personality at 360: `business.question.person` takes two lines) the two questions read as one paragraph. English held only because each question ends in "?". The design prescribed the gap, so the fault is the design's (L-0019), and the same gap sat under every stack of one-style lines on the page.

**Rule.** A 14 px line that follows a line of the same size, weight and colour, and is its own statement (a question, a note, a label, a reason, a rule line), starts 8 below it: Tailwind `gap-2` on its stack, or `mt-1` on top of a `gap-1` stack where the markup cannot hold a nested stack (a `dd` inside a `dl` field). 4 (`gap-1`) and 2 (`gap-0.5`) stay only where the boundary changes size, weight or colour (a title to its state line, a field name to its answer, a value to its first note), or where the line above is the one-line name of what follows (a field name above `business.state.empty` or above the hypothesis line; the provisional line above its `business.marks.restsOn` pair, which P8 keeps as one mark and which opens with the run-in label "อิงกับ:" / "Rests on:"). Inside a head, the title and the state line stay 4 apart and every later block of the head (the notes, the provisional pair, the unchecked line) is 8 below the block above it. No new token, recipe class, component, prop or string; 8 is `gap-2`, a step the page already uses (the resting list, the personality points).

**Ladder after the rule.** 2 (an entry's title to its note: lead, not held, resting list), 4 (a style change inside one entry), 8 (peer lines; resting entries; personality points), 12 (the blocks of an item; head to the next block), 16 (fields; not held entries), 24, 32, 48. An entry's peer lines (8) stay clearly inside its blocks (12) and fields (16), and far inside the item rhythm (32) and the sections (48), so the hierarchy reads as before. Measured: the cover to each section 48, header to first child 24, items 32, head to next block 12 in GuidebookSkipped, GuidebookVisualSkipped, GuidebookOpenAsks and GuidebookSkippedSteps at 360 and 1440, before and after.

**Why not the others.**

- A list marker (bullet or dash): it moves the text to about L + 16, a second start edge against P1, it decorates notes and labels that are not a list, and it would mark the two question lists only, not the notes and labels of the same fault.
- A hanging indent of wrapped lines (`pl-4 -indent-4`): every wrapped line gets a second edge at L + 16, the column loses 16 of its 328 px at 360 so Thai wraps more, and a one-line entry gains nothing.
- 12 between questions (`gap-3`): equal to the gap between an item's head and its Ask and between a step's blocks, so each question would read as a block of its own and the Ask would come apart from its lead-in `business.stillToAsk`.

**Survey.** Every stack in the page whose children are lines of text, in GuidebookDone, GuidebookOpen, GuidebookOpenAsks, GuidebookSkipped, GuidebookSkippedSteps, GuidebookStale, GuidebookVisual, GuidebookVisualOpen, GuidebookVisualSkipped, GuidebookUntrustedText and GuidebookNarrow, Thai and English, at 360: 2434 adjacent pairs, each measured on the rendered line boxes (`Range.getClientRects`). Line pitch inside an entry is 23.8 for every 14 px line in both languages. "Gap" is the box gap between two entries, "across" the pitch from the last line of one to the first line of the next.

<!-- prettier-ignore -->
| # | List (selector today) | Where | Wraps at 360 | Before: gap, across, ratio | Verdict | After: gap, across, ratio |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | Ask questions, `[data-ask] > ul` | items waiting for the person (6, 7.2, 13 colour) | th and en: `question.person` 2 lines | 4, 27.8, 1.17 | fail: two questions read as one | 8, 31.8, 1.34 |
| S2 | A skipped step's questions, `[data-step] > ul` (not `[data-rests]`) | section 8 | th and en: `question.person` 2 lines | 4, 27.8, 1.17 | fail, as S1 | 8, 31.8, 1.34 |
| S3 | Head lines, `[data-head]`: state line, notes, marks | every item (6) | en: colour's first note and Logo mark's note 2 lines; th: one line each in the fixtures, notes are free sentences | 4, 27.8, 1.17 between two notes and between the state and a note | fail: two notes, or the state and a note, read as one | 8 below the state for every later block; 8 between notes; 31.8, 1.34 |
| S4 | Provisional pair, `[data-marks=provisional]` | marked items (6) | no: the first line is one line in th and en | 4, 27.8, 1.17 | pass: one mark of two lines; the second opens with the run-in "อิงกับ:" / "Rests on:" | pair unchanged at 4; the pair sits 8 below the line above |
| S5 | Statement labels, the `div` under a statement | positioning, core idea (7.1, 14) | no in PR 1; PR 2's `by.picked` carries a model id | 4, 27.8, 1.17 | fail by the rule: two peer labels, Thai without a stop | 8, 31.8, 1.34 |
| S6 | Architecture notes, `[data-item=architecture] > [data-value]` | 7.1 | th and en: `architecture.because` 2 lines | 4, 27.8, 1.17 | fail by the rule: reason then rule | 8, 31.8, 1.34 |
| S7 | Logo type notes, `[data-item=logo-type] > [data-value]` | 13 | th: a reason 3 lines, the length line 3 lines (GuidebookNarrow) | 4, 27.8, 1.17 | fail: reason, length line and rule read as one paragraph | 8, 31.8, 1.34 |
| S8 | Labels, `[data-labels]` | logo type, colour, typography (13) | th and en: 2 and 3 lines | 4, 27.8, 1.17 | fail: three labels read as one paragraph | 8, 31.8, 1.34 |
| S9 | Colour field, `[data-value] > [data-field]` (signature, neutral, canvas) | 13 | th: the signature reason 2 lines, en 3 | name to family and family to reason change style; reason to rule 4, 27.8, 1.17 | fail by the rule: reason then rule | reason to rule 8, 31.8, 1.34; the rest unchanged |
| S10 | Colour partly notes, `dd` notes in `[data-field=signature]` | 13 | one note in every fixture | 4 | fail by the rule when a view gives two notes | 8 between two note `dd` |
| S11 | Typeface, `[data-face]` | 13 | th and en: the reason 2 lines | family to style changes style; style to licence and licence to reason 4, 27.8, 1.17 | fail by the rule: three notes under the family | family to style 4; notes 8, 31.8, 1.34 |
| S12 | Typography notes, the last `div` of `[data-item=typography] > [data-value]` | 13 | no | 4, 27.8, 1.17 | fail by the rule: pairing reason then rule | 8, 31.8, 1.34 |
| S13 | Answer field, `[data-field=person\|never\|remember]` | 7.1 | th and en: an answer or `yourWords` 2 lines | name, answer, `yourWords` change style at each line; `never` empty: name to `state.empty` 4 | pass: the name is the one-line name of its value | unchanged |
| S14 | Personality field, `[data-field=personality]` and its points `dl` | 7.1 | th and en: the hypothesis 2 lines | name to hypothesis 4 (one-word name); points 8, each a name and a 16 px value | pass | unchanged |
| S15 | Lead lines, `[data-lead]` | 5 | no | title 500 to note 400 at 2; rows 12 | pass: weight change, rows 12 | unchanged |
| S16 | Not in this guidebook, `[data-not-held]` | 9 | th and en: reasons 2 lines | title to reason 2 (weight change); entries 16 | pass | unchanged |
| S17 | Resting list, `[data-rests]` | 8 | no | title to mark 2 (weight change); entries 8 | pass | unchanged |
| S18 | Step head, `[data-step] > div` | 8 | no | `h3` to `state.skipped` 4 (weight and colour change) | pass | unchanged |
| S19 | Preface, `[data-preface]` | 4 | th and en: 2 and 3 lines | 12, 39.2 on a 27.2 line, 1.44 | pass | unchanged |
| S20 | Name value, `[data-item=name] > [data-value]` | 7.1 | no | the name (20) to `notScreened` (14) 4 | pass: one note, style change | unchanged |

After the rule the only same-style pairs under 8 in the 2434 are S4, S13 (`never` empty) and S14 (the hypothesis), each a pass above. The changed pairs reach every line count the fixtures hold (1 then 1, 1 then 2, 1 then 3, 2 then 1, 2 then 2, 2 then 3, 3 then 1, 3 then 2), and each measures gap 8 and across 31.8; the gap does not depend on the line count, so the bound holds at any count. On the ink (2x render, GuidebookOpenAsks th 360 light), the blank between the two lines of the person question is 10.5 and between the two questions 13.5 before, 17.5 after.

**Classes for the builder** (`guidebook.tsx`; the plays read the `data-*` hooks, a new one is `data-notes`):

<!-- prettier-ignore -->
| Row | Function and element | Now | Becomes |
| --- | --- | --- | --- |
| R1-1 | `Ask`, the `ul` | `flex flex-col gap-1` | `flex flex-col gap-2` (the `[data-ask]` `div` stays `gap-1`: lead-in to first question 4) |
| R1-2 | `Unconfirmed`, the questions `ul` of a step | `flex flex-col gap-1` | `flex flex-col gap-2` |
| R1-3 | `Item`, the notes in `[data-head]` | each `Note` a direct child of the head | when `!notesInValue && item.notes.length > 0`: one `div` `mt-1 flex min-w-0 flex-col gap-2` `data-notes` holding the `Note`s |
| R1-4 | `Item`, `[data-marks=provisional]` | `flex flex-col gap-1` | `mt-1 flex flex-col gap-1` |
| R1-5 | `Item`, `p[data-marks=unchecked]` | `text-body-sm` | `mt-1 text-body-sm` |
| R1-6 | `Statement`, the labels `div` | `flex min-w-0 flex-col gap-1` | `flex min-w-0 flex-col gap-2` `data-notes` (the statement to its first label stays 4) |
| R1-7 | `Value`, `architecture` | `p` `architecture.because` and `Rules` direct children of `[data-value]` | the same two inside one `div` `flex min-w-0 flex-col gap-2` `data-notes` after the `text-body-lg` line |
| R1-8 | `LogoTypeValue` | reasons, `[data-name-length]` and `Rules` direct children of `[data-value]` | the same inside one `div` `flex min-w-0 flex-col gap-2` `data-notes` after the decision line |
| R1-9 | `Labels`, `[data-labels]` | `flex min-w-0 flex-col gap-1` | `flex min-w-0 flex-col gap-2` |
| R1-10 | `ColorValue`, `dd[data-rule]` of signature, neutral, canvas | `FIELD_NOTE` | `mt-1` with `FIELD_NOTE` |
| R1-11 | `ColorValue`, the note `dd`s of an open signature | `text-body-sm` | `text-body-sm`, and `mt-1` on every note `dd` after the first |
| R1-12 | `TypographyValue`, `li[data-face]` | family, style, licence, reason as four `p` children | `li` keeps `flex min-w-0 flex-col gap-1`; style, licence and reason move into one `div` `flex min-w-0 flex-col gap-2` `data-notes` after the family |
| R1-13 | `TypographyValue`, the pairing and rules `div` | `flex min-w-0 flex-col gap-1` | `flex min-w-0 flex-col gap-2` `data-notes` |

Nothing else changes: no `gap` of an item, a section, a field list or the screen root, no font, no colour.

**Play clause** (P25 in section 16). A story-local clause `expectPeerLinesApart(root)` in `guidebook.stories.tsx`, measuring rendered line boxes, not a class: for every stack `[data-ask] > ul`, `[data-step] > ul:not([data-rests])`, `[data-notes]`, `[data-labels]`, `[data-head]` (from its state line on) and each colour field's reason and rule `dd`, for every two adjacent children A and B, with `p` the computed line height of A (23.8): the top of B's first line box less the top of A's last line box is at least `1.3 * p` (30.94; measured 31.8, and 27.8 before, so the old look goes red), and B's box top less A's box bottom is at least 7.5. In GuidebookOpenAsks and GuidebookSkippedSteps the clause runs inside `atWindow(360, 900, ...)` in Thai and first asserts that the person question of Brand personality spans at least two line boxes, so the bound is proven at a wrapped line count; GuidebookNarrow runs it in its 360 frame. The builder shows it red once by setting R1-1 back to `gap-1`.

**Rendered proof** is section 20, "Rework render".

## 7. Foundation items (PR 1)

### 7.1 Done

<!-- prettier-ignore -->
| Item | Head: state line | Value block, in order |
| --- | --- | --- |
| `positioning` (gate agreed) | `business.state.agreed` | `p` `text-body-lg whitespace-pre-wrap` with the statement in `bdi block`; then `div` `flex flex-col gap-1` of `p` `FIELD_NOTE`: `business.positioning.by.own`, `business.positioning.gatePassed` |
| `identity-frame` (given) | `business.state.given`, then any marks | `dl` `flex min-w-0 flex-col gap-4`: a field per answer, `div` `flex min-w-0 flex-col gap-1` of `dt` `FIELD_NOTE` (the field name), `dd` `text-body-md` (the answer, `bdi block`, `whitespace-pre-wrap`), `dd` `FIELD_NOTE` `business.label.yourWords`, for `person` then `never`; then the field Personality: `dt` `FIELD_NOTE`, `dd` `FIELD_NOTE` `business.identity.hypothesis`, `dd` with a nested `dl` `mt-2 flex flex-col gap-2` of five `div` `flex flex-col`, each `dt` `FIELD_NOTE` (`business.identity.axisLegend`) and `dd` `text-body-md` (`business.identity.point`, "ระดับ 4 จาก 5"). The five points are the node's own words, as the board shows them; no bar, dot or meter draws them |
| `architecture` (derived) | `business.state.derived`, then any marks | `p` `text-body-lg` `business.architecture.single`; `div` `flex flex-col gap-1` of `p` `FIELD_NOTE`: `business.architecture.because`, then `business.decision.rule` with `architecture-derive-1` (`data-rule`) |
| `name` (given) | `business.state.given`, then any marks | `p` `text-body-lg` with the name in `bdi block`; `p` `FIELD_NOTE` `business.name.notScreened` (4 below) |
| `core-idea` (agreed) | `business.state.agreed`, then any marks | `div` `flex min-w-0 flex-col gap-4`: the statement as on `positioning` with `business.positioning.by.own` and `business.coreIdea.gatePassed`; then a `dl` field of `remember` as on `identity-frame` with `business.label.yourWords` |

A done item with an optional answer missing (a `never` left empty) keeps the field name with `business.state.empty` ("Nothing given yet") as its `dd` `FIELD_NOTE`, so no field name stands alone (`guidebook-item-1` in spec v1.1, this design's choice 7 taken by comment 10786). The done project of spec v1.1 has no `never` answer, so its Brand personality shows this line.

**2026-11-20, ORV-302-design-r1 (section 6.1).** Under a value, two notes are 8 apart: the statement's labels `div` (positioning, core idea) becomes `gap-2` (R1-6), and the architecture item's reason and rule move into a notes `div` `gap-2` after the value line (R1-7). The value line to its first note stays 4. The `name` value (one note) and the fields of `identity-frame` and `core-idea` do not change (6.1, S13, S14, S20).

### 7.2 Open

<!-- prettier-ignore -->
| State | Head | Ask | Value |
| --- | --- | --- | --- |
| Waits for another step (`waiting`) | `business.state.waiting` naming `waitingFor` | none | none (the stored architecture answer is not shown) |
| Waits for the person (`empty`, `skipped`, `needsAnswer`; positioning while the gate is neither agreed nor waiting for a choice) | the board state line | the questions of `guidebook-open-1` (`identity-frame` two, the others one) | none |
| Name, waiting for the person | the board state line only (no question key) | none | none |
| Out of this version (`notInVersion`) | `business.state.notInVersion`, then the note `p` `FIELD_NOTE` `business.architecture.notInVersion` | none | none |
| Positioning out of date (`stale`) | the board state line, then `p` `text-body-sm` `data-marks="stale"` `business.positioning.stale` | `business.question.only` | none, no statement |

An open item holds no line larger than 14 px: that is the at-a-glance difference, and the play measures it (section 16, P6).

### 7.3 Logo mark, the one visual item not in this version (PR 1)

`logo-mark`: head with `business.state.notInVersion` and the note `p` `FIELD_NOTE` `business.guidebook.notYet.logoMark`, as the "Out of this version" row of 7.2; no ask, no value. It keeps this form in both PRs. `logo-type`, `color` and `typography` are built in PR 1 as section 13 gives them. No `business.label.*` "by rule" line on any item: the page says it once in the preface.

## 8. Not yet confirmed

`section` `data-section="unconfirmed"`, `SectionHeader` `business.guidebook.section.unconfirmed` with `divider`, then one of:

<!-- prettier-ignore -->
| State | Content |
| --- | --- |
| No skipped step | `p` `text-body-md` `data-unconfirmed-none` `business.guidebook.unconfirmed.none`. One line under the heading; never an empty section |
| One or more steps | `ul` `flex min-w-0 flex-col gap-8` `data-unconfirmed`, one `li` `flex min-w-0 flex-col gap-3` `data-step="<id>"` per step in node order: `div` `flex flex-col gap-1` of `h3` `text-label-md` (title) and `p` `FIELD_NOTE` `business.state.skipped`; `ul` `flex flex-col gap-2` (was `gap-1`, changed 2026-11-20, 6.1 R1-2) of `li` `text-body-sm` (the questions); then the resting block |
| Step with items resting on it | `div` `flex min-w-0 flex-col gap-2`: `p` `FIELD_NOTE` `business.guidebook.unconfirmed.restsOnIt`; `ul` `flex min-w-0 flex-col gap-2` `data-rests`, each `li` `flex flex-col gap-0.5` of `span` `text-label-md` (item title) and `span` `FIELD_NOTE` (its mark line, `business.marks.restsOn` or `business.marks.unchecked`) |
| Step with nothing resting | `p` `FIELD_NOTE` `business.guidebook.unconfirmed.nothing` alone, with no `restsOnIt` line above it, so no lead-in stands with nothing under it |

**2026-11-20, ORV-302-design-r1 (section 6.1, S2).** The questions `ul` of a step becomes `flex flex-col gap-2` (R1-2): two questions 8 apart, the pitch across them 31.8 on a 23.8 line, so Brand personality's two questions read as two in Thai at 360, where the first wraps to two lines and neither ends in a mark. The step's own blocks stay 12 apart and the steps 32.

Each step is an `h3` so a reader of headings finds each skipped step; the items resting on it are names in a list, not headings, because their own entries sit above in the foundation section.

## 9. Not in this guidebook

`section` `data-section="notHeld"`, `SectionHeader` `business.guidebook.section.notHeld` with `divider`, then `dl` `flex min-w-0 flex-col gap-4` `data-not-held`, eight `div` `flex min-w-0 flex-col gap-0.5`, each `dt` `text-label-md` (`.title`) and `dd` `FIELD_NOTE` (`.reason`), in the order of `guidebook-not-held-1`. The same in every project. Measured 16 between entries.

## 10. The back link

The last child of the screen root, 48 below Not in this guidebook: `div` holding `<Button asChild variant="secondary"><a href={boardHref} data-back>{business.guidebook.backToBoard}</a></Button>`. Start edge x 16 and x 400, 40 tall. It is the one interactive element of the page body. Focus: the button's focus form, a 1 px `focus.ring` border with its 3 px halo (measured: 1 px border, `0 0 0 3px` halo at 24 percent of the focus hue in light and dark, 40 tall).

Why a secondary button and not the `link` variant: on the `link` variant the focus ring hugs the glyphs (padding-inline 0, the ring touched the first and last letters at 3x zoom), so the focus state read as a box drawn on the words. The secondary button matches the board's own navigation action ("Your businesses"), which is also a link set as a secondary button. Owner's choice 5.

## 11. Access notices

Signed out, not allowed, not configured: the same screen root (`gap-6` in place of `gap-12`, there being two children), `PageHeader` with `title={business.guidebook.title}` and no description or meta, then `BusinessAccessNotice` exactly as the board renders it (`business.signedOut` with the `business.signInLink` primary button; `business.notAllowed`; `business.notConfigured`). One `h1`, no section, no back link (there is no board to go back to). Measured: one start edge (16 and 400), no sideways scroll, sign-in link 40 tall with the primary button's focus form (inset ring and halo).

## 12. The board link

`business-board.tsx`, with `guidebookHref` given (tech.md G8): the `PageHeader` `actions` hold two links, in this order:

1. `<Button asChild variant="secondary"><a href={guidebookHref}>{business.board.openGuidebook}</a></Button>`
2. the existing `<Button asChild variant="secondary"><a href={listHref}>{business.list.heading}</a></Button>`

Without `guidebookHref` the header is as today. The board has no primary action, so the guidebook link takes the same secondary form as its neighbour; it is never `primary`.

<!-- prettier-ignore -->
| Width | Thai | English |
| --- | --- | --- |
| 360 | both on one row under the saved line, starts x 24 and x 155, 8 apart, each 40 tall | the two wrap to two rows, 8 apart; the header grows by one row (48) and the board region moves down by 48 |
| 1440 | at the end of the title row, starts x 1176.5 and x 1307.5 | at the end of the title row, starts x 1051 and x 1272 |

The board region keeps its height (`h-[70dvh] min-h-[480px]`), its width, its `fitView` and every card and edge: the link adds no element to it. Keyboard order on the board: app header links, language switch, `business.board.openGuidebook`, `business.list.heading`, then the board.

## 13. The three visual items (PR 1)

Logo type, Colour and Typography, read from ORV-298's views (spec v1.1, comment 10786). Same anatomy (section 6), same spacing. An item of the three that waits for another step (spec row 4: all three wait for Positioning; row 7: Logo type waits for Positioning; row 18: Logo type waits for Name) takes the "Waits for another step" row of 7.2; an item derived with marks (rows 7 and 19) carries them in its head as section 6 gives. Labels of a done visual item sit in their own block after the value: `div` `flex min-w-0 flex-col gap-1` `data-labels`, each `p` `FIELD_NOTE`, 12 below the value.

<!-- prettier-ignore -->
| Item and state | Head | Value block | Labels block |
| --- | --- | --- | --- |
| `logo-type` derived | `business.state.derived`, marks | `p` `text-body-lg` the decision; `div` `flex flex-col gap-1` of `p` `FIELD_NOTE`: its reason, `business.logoType.nameLength` (the name as an inline `bdi`), `business.decision.rule` with `logo-type-1` | `business.logoType.hypothesis`, `business.logoType.crowdingNotChecked`, `business.logoType.otherTypes` |
| `logo-type` waiting | `business.state.waiting` naming the view's `waitingFor` (Name or Positioning) | none | none |
| `logo-type` with the app icon question offered | its state line | `business.question.appIcon` | none |
| `logo-mark` | as section 7.3 | none | none |
| `color` derived | `business.state.derived`, marks | `dl` `flex min-w-0 flex-col gap-4`, one `div` `flex min-w-0 flex-col gap-1` per decision (`signature`, `neutral`, `canvas`): `dt` `FIELD_NOTE` field name, `dd` `text-body-lg` the family, `dd` `FIELD_NOTE` its reason, `dd` `FIELD_NOTE` `data-rule` its rule id by `business.decision.rule` | `business.color.hypothesis`, `business.color.familyOnly` |
| `color` partly | `business.state.partly`, marks | as derived, the undecided field keeping its place: `dt` field name, `dd` `text-body-sm` `business.color.waitsForLineup`, then `dd` `mt-2` holding the Ask of `business.question.lineup` | as derived |
| `color` open | the board state line, then its open line as a note (`business.color.needsPersonality`, `bothCrowded` or `notDecided`) | the Ask of `business.question.lineup` while the view shows `waitsForLineup` | none |
| `typography` derived | `business.state.derived`, marks | `dl` `flex min-w-0 flex-col gap-4` of roles (reading, display): `dt` `FIELD_NOTE` the role, `dd` `ul` `flex flex-col gap-3` of faces, each `li` of `p` `text-body-lg` the family, `p` `FIELD_NOTE` its style, `p` `FIELD_NOTE` `business.typography.licence`, `p` `FIELD_NOTE` its reason (where the view has one); then `div` `flex flex-col gap-1`: `business.typography.because.pairing`, `business.decision.rule` with `typography-node-1` | `business.typography.oneChoice`, `business.typography.noPersonalityLink` |
| `typography` open | `business.state.needsAnswer` line as the board shows it | `business.question.scripts` | none |

**2026-11-20, ORV-302-design-r1 (section 6.1, S7 to S12).** Every run of notes under a value is 8 apart: Logo type's reasons, length line and rule in a notes `div` `gap-2` (R1-8); the labels block `gap-2` (R1-9); a colour field's rule `dd` `mt-1` under its reason (R1-10) and an open signature's second note `dd` `mt-1` (R1-11); a typeface's style, licence and reason in a notes `div` `gap-2` under the family (R1-12); the pairing reason and rule `gap-2` (R1-13). The value line to its first note stays 4, the labels block stays 12 below the value, the fields stay 16 apart and the faces 12.

No colour value, no swatch, no sample of a typeface (the family name is set in the page's own font): the guidebook names a family; showing a sample would claim more than the rule decided (`business.color.familyOnly`). The lineup and the crowded families are not repeated (`guidebook-item-1`).

## 14. PR 2: positioning states

The whole of PR 2's look: three states of the `positioning` item, over ORV-292's view, in the item anatomy of section 6. Nothing else on the page changes.

<!-- prettier-ignore -->
| State | Head | Value |
| --- | --- | --- |
| Awaiting choice | `business.state.awaitingChoice` | none: the state line only, no drafted option, no AI label, no question (`guidebook-open-1` in spec v1.1, this design's choice 6 taken by comment 10786) |
| Picked | `business.state.agreed` | the statement as in 7.1, then `business.positioning.by.picked` with its model id, then `business.positioning.gatePassed` |
| Edited | `business.state.agreed` | as picked with `business.positioning.by.edited` |

The `by.picked` and `by.edited` lines are the one AI label the page may show (`guidebook-honest-1`); they keep `FIELD_NOTE`, the same as `by.own`, so the AI label is neither hidden nor louder than the person's own label.

## 15. Accessibility, language and resilience

- **Landmarks.** The app header (`header` with its `nav`), the page's `main`, five `section`s named by their `h2` (regions). No `aside`, no `footer`.
- **Headings.** One `h1` (the title); five `h2` in the order lead, foundation, visual, unconfirmed, not held; one `h3` per item (five foundation, four visual) and per skipped step. Measured in the done project: `H1 H2 H2 H3 H3 H3 H3 H3 H2 H3 H3 H3 H3 H2 H2`; with positioning skipped one `h3` more under the fourth `h2`.
- **Focusable.** The app header links and the language switch, then the back link. Nothing in the page body but the back link takes focus: no `tabIndex` on any item, list or heading. Access screens: the sign-in link.
- **Focus on open and on return.** Both are full page loads; focus starts at the document start, and no script moves it. The first Tab reaches the app header's first link, as on every page.
- **Motion.** None on the page, so nothing to reduce.
- **Thai.** No letter spacing on any element holding Thai (measured 0 elements in every frame). Every wrapping line uses a 1.7 line height (body and label tokens); no `heading-md` on wrapping text. Thai marks above and below show whole (`expectNoGlyphClip`, section 16).
- **Untrusted text.** Plain text nodes in `bdi`, never HTML, never a link (tech.md 7.1). A 77-character Thai company name with no space wraps inside the column at 360 through `wrap-anywhere` on the root (state `long`, no sideways scroll).
- **Missing data.** Every absent value has its line: an open item its state and question, an empty optional answer `business.state.empty`, an empty list its own sentence (sections 7 and 8).

## 16. Plays and their bounds

Helpers: `atWindow`, `expectFitsAt360`, `textOf` (`business-story-helpers.tsx`); `expectNoGlyphClip`, `expectLinesClear`, `expectFocusBorderForm`, `expectSameHeight` (`testing/visual-asserts.ts`). Narrow stories wrap the screen in the `data-narrow` 360 frame `expectFitsAt360` reads. `L` is the column's content left (16 at 360, 400 at 1440).

<!-- prettier-ignore -->
| # | State | Story | Play clause | Bound (measured) |
| --- | --- | --- | --- | --- |
| P1 | Page frame | `GuidebookDone`, `GuidebookNarrow` | every visible text box's left equals `L`, or `L + 332` inside `[data-lead]` at a column of 480 or more | 16; 400 and 732, within 0.5 |
| P2 | Rhythm | `GuidebookDone` | gap between the cover and each `[data-section]` 48; between foundation items 32; `SectionHeader` bottom to first child 24; `[data-head]` bottom to the next block of each done item 12 | 48, 32, 24, 12, within 0.5 |
| P3 | Cover | `GuidebookDone`, `GuidebookDoneEnglish` | one `h1` with `business.guidebook.title`; `byRule` and `draftNote` once each, in `[data-preface]`, 16 px | 1 and 1; font-size 16px |
| P4 | Lead block | `GuidebookDone` | four `dt` in order `situation`, `business-core`, `audience`, `competitive-frame`; no `dd` beyond the state line; two columns at 1440 (two distinct `left` values), one at 360 | 4 rows; lefts 400 and 732; 16 |
| P5 | Done items | `GuidebookDone` | each foundation item has `[data-value]` whose first line is 20 px (statements, architecture, name) or a `dl` whose answers are 16 px; among the foundation items, the architecture item alone has `[data-rule]` and identity-frame alone has `business.identity.hypothesis` (the visual items' rules and labels are P19's) | 20px or 16px; 1; 1 |
| P6 | Open items | `GuidebookOpen`, `GuidebookOpenEnglish` | no element in a `[data-item][data-done=false]` computes a font-size over 14 px; no `[data-value]` inside one; each waiting-for-the-person item has `[data-ask]` with its questions | max 14px; 0; questions per `guidebook-open-1` |
| P7 | Out of date | `GuidebookStale` | positioning has `[data-marks=stale]` and `[data-ask]`, no `[data-value]` | 1, 1, 0 |
| P8 | Marks | `GuidebookSkipped` | each provisional item has `[data-marks=provisional]` with two lines; each item unchecked has `[data-marks=unchecked]`; mark lines 14 px in primary ink | per W2 case D |
| P9 | Unconfirmed with steps | `GuidebookSkipped`, `GuidebookSkippedSteps` | `[data-step]` in node order; a step with resting items has `restsOnIt` then `[data-rests]`; a step with none has `business.guidebook.unconfirmed.nothing` and no `restsOnIt`; steps 32 apart | per W2 case D (`GuidebookSkipped`) and case B (`GuidebookSkippedSteps`); 32 |
| P10 | Unconfirmed none | `GuidebookDone` | `[data-unconfirmed-none]` present, no `[data-unconfirmed]` | 1, 0 |
| P11 | Not held | `GuidebookDone` | eight `dt` in the order of `guidebook-not-held-1`, 16 apart | 8; 16 |
| P12 | Headings and focus | `GuidebookDone` | heading sequence as section 15; Tab from the document start reaches `[data-back]` after the app header controls; `expectFocusBorderForm` on it; height 40 | sequence equal; 40 |
| P13 | Narrow | `GuidebookNarrow`, `GuidebookNarrowDark`, `GuidebookNarrowEnglish` | `expectFitsAt360`; `expectNoGlyphClip` on the screen root; `expectLinesClear` on one wrapping statement | pass |
| P14 | Untrusted text | `GuidebookUntrustedText`, `GuidebookUntrustedTextEnglish` | the HTML-like and long fixture strings show as text (no element created from them), wrap at 360 with no sideways scroll | `scrollWidth` 360 |
| P15 | No AI, no claim | `GuidebookNoAi` (PR 1: the states of spec rows 1, 2, 4 to 7 and 17 to 19; PR 2 grows it by row 20's states) | the page text holds none of the six AI labels and none of the claim words outside the lines `guidebook-honest-1` lists (in PR 2, `by.picked` and `by.edited` on a picked positioning excepted, P23); no `#` colour value, no digit run beyond the date, the rule ids and model ids, the scale points the personality (`n of 5`) and a colour reason show as their views do, and the name length with its bound in `business.logoType.nameLength` | 0 |
| P16 | Language switch | `GuidebookSwitchToEnglish`, `GuidebookSwitchToThai` | after the switch every heading is in the other language and P1 still holds | as P1 |
| P17 | Board link | `Board` (business board stories) | the guidebook link is the first action and first in Tab order after the header; `expectSameHeight` with the list link; `expectFocusBorderForm`; the board region's height and left are equal to the same story without `guidebookHref` | 40 and 40; region equal within 0.5 |
| P18 | Access | `GuidebookAccess` (spec row 11, first proposed by this design; one story walking the three notices, as the board's access play does with `expectAccessScreen`) | one `h1` with the title, the notice, no `[data-section]`, no `[data-back]` | 1, 0, 0 |
| P19 | Visual items done (PR 1) | `GuidebookVisual`, `GuidebookVisualEnglish` | each of the three has `[data-value]` and `[data-labels]`; `[data-rule]` per decision; no element with a colour value or a swatch; family and licence names as written | per `guidebook-item-1` |
| P20 | Visual items open (PR 1) | `GuidebookVisualOpen` | as P6 on the visual items; colour partly keeps the signature field first with its `[data-ask]` | max 14px outside decided fields |
| P21 | Visual skipped (PR 1) | `GuidebookVisualSkipped` | the visual items' mark lines as P8; their names in `[data-rests]` | per W2 case D |
| P22 | Awaiting choice (PR 2) | `GuidebookAwaitingChoice` | positioning shows `business.state.awaitingChoice` only: no `[data-ask]`, no `[data-value]`, no AI label | 0, 0, 0 |
| P23 | Picked (PR 2) | `GuidebookPicked` | `business.positioning.by.picked` with its model id, 14 px, `text-text-secondary`, the same computed colour as `by.own` in `GuidebookDone` | equal colour |
| P24 | Visual narrow (PR 1) | `GuidebookVisualNarrow`, `GuidebookVisualNarrowDark` | as P13 | pass |
| P25 | Peer lines (2026-11-20, ORV-302-design-r1, 6.1) | `GuidebookOpenAsks` and `GuidebookSkippedSteps` (Thai, inside `atWindow(360, 900, ...)`), `GuidebookNarrow` (Thai, its 360 frame) | `expectPeerLinesApart(root)`: first, the person question of Brand personality spans two or more line boxes (`[data-item=identity-frame] [data-ask] li`, and in GuidebookSkippedSteps also `[data-step=identity-frame] li`); then for every two adjacent children A, B of `[data-ask] > ul`, `[data-step] > ul:not([data-rests])`, `[data-notes]`, `[data-labels]`, `[data-head]` from its `[data-state]` line on, and a colour field's reason and rule `dd`: top of B's first line box less top of A's last line box at least `1.3 * lineHeight(A)`, and B's top less A's bottom at least 7.5 | at least 30.94 (measured 31.8, before 27.8) and at least 7.5 (measured 8, before 4) |

## 17. Stories, title `Examples/Application: Brand guidebook`

- **PR 1 (spec rows 1-19, 23):** `GuidebookDone`, `GuidebookDoneEnglish`, `GuidebookOpen`, `GuidebookOpenEnglish`, `GuidebookSkipped`, `GuidebookSkippedEnglish`, `GuidebookSkippedSteps`, `GuidebookStale`, `GuidebookNoAi` (with the states of rows 1, 2, 4 to 7 and 17 to 19), `GuidebookUntrustedText`, `GuidebookUntrustedTextEnglish`, `GuidebookSwitchToEnglish`, `GuidebookSwitchToThai`, `GuidebookNarrow`, `GuidebookNarrowDark`, `GuidebookNarrowEnglish`, `GuidebookAccess` (spec row 11, P18), `GuidebookVisual`, `GuidebookVisualEnglish`, `GuidebookVisualOpen`, `GuidebookVisualSkipped`, `GuidebookVisualNarrow` and `GuidebookVisualNarrowDark`. In PR 1 the visual section of every story shows Logo type, Colour and Typography as their fixture's view gives them and Logo mark as section 7.3. The board link's play lives in the existing `Board` story of `business-board.stories.tsx`, under the board's own title.
- **PR 2 (spec rows 20-22):** `GuidebookAwaitingChoice` and `GuidebookPicked`; `GuidebookNoAi` grows by row 20's states (spec row 21).

## 18. Checks against DESIGN.md and the frontend-design tells

Checked against the mock, with what changed:

- **Card grid or tiles:** none; items are text on the canvas. Checked, no change.
- **Everything centred:** one start edge, the app header's. Checked.
- **Decoration (icon in a circle, illustration, gradient, glass, logo, swatch):** none. Checked.
- **One weight and size for everything:** a three-step ramp by role (32, 20 or 16, 14). Checked.
- **State as coloured chips or badges:** states are words on the second line of each entry; no `Badge`, no colour carries a state, the brand accent appears only in focus. Checked.
- **Meters, scores, counts:** none; the personality points stay the node's words ("ระดับ 4 จาก 5"). Checked.
- **Rules everywhere:** only the five section dividers. Checked.
- **A heading or lead-in with nothing under it:** found in the first mock: a step with nothing resting showed "What rests on it:" above "Nothing ... rests on it yet". Changed: the `nothing` line stands alone (section 8).
- **Focus that reads as a box on the words:** found on the `link` variant. Changed to the secondary button (section 10).
- **A box past the column:** found: a wrapped statement's inline `bdi` measured 2.2 px past the column at 1440 in English (a soft wrap's hanging space; no ink, no scroll). Changed: a whole-value `bdi` is `block`; re-measured 0 elements past the edge.
- **Siblings of one height:** the board's two actions both 40. **One line per edge:** the section divider is the one line under each section title. **Focus shown:** sections 10 and 12.

## 19. Strings, owner's choices, and things seen and not changed

**Strings.** No new key. Keys used: the spec's Strings table (`business.board.openGuidebook`, `business.guidebook.*`), and the existing `business.board.savedAt`, `business.node.*`, `business.state.*` (with `empty`), `business.stillToAsk`, `business.question.*`, `business.marks.*`, `strategy.provisional`, `business.positioning.*`, `business.coreIdea.gatePassed`, `business.identity.*`, `business.label.yourWords`, `business.architecture.*`, `business.decision.rule`, `business.name.notScreened`, `business.list.heading`, `business.signedOut`, `business.signInLink`, `business.notAllowed`, `business.notConfigured`; the ORV-298 keys the spec names (PR 1: `business.decision.rule`, the three visual node titles, `business.state.partly`, `business.state.needsAnswer` and every other key ORV-298's views show on the three visual items) and the ORV-292 keys (PR 2: `business.positioning.by.picked`, `business.positioning.by.edited`); neither PR copies a key of another story.

**Owner's choices** (each default taken by comment 10786 under the owner's POC delegation, built unless the owner says otherwise; choices 6 and 7 are now spec v1.1 text, so their other option would need a spec change):

1. Reading measure: 640 px column shared with the app header (default); or 576 (`max-w-xl`); or 768 (`max-w-3xl`).
2. The lead block: a two-column definition list under its own section title and note, no surface (default); or one column at every width.
3. The board link's place: first action of the board header (default); or after "Your businesses".
4. The back link: once, at the end of the page, as the spec orders (default); a second one beside the title would need a spec change.
5. The two links' form: secondary button, like the board's own navigation (default); or the `link` variant once its focus ring stops hugging the glyphs.
6. Positioning awaiting a choice (PR 2): the state line alone (default, now `guidebook-open-1` in spec v1.1), since the person's next act is a choice on the board, not an answer; or also `business.stillToAsk` with `business.question.only`.
7. A done item with an optional answer missing: the field name with `business.state.empty` (default, now `guidebook-item-1` in spec v1.1); or the field left out.

**Seen, not changed** (outside this story's files):

1. The `link` variant of `Button` sets its focus ring with no inline padding, so the ring touches the first and last glyphs. A catalog matter; this design avoids it.
2. A `whitespace-pre-wrap` inline `bdi` reports its hanging space in its box width; the board's views use the same pattern and may measure a pixel or two past their frames in a play that reads every element.

## 20. Rendered proof

A mock page (labelled "MOCK, not product UI" in its own banner), built in this task's scratch folder from this worktree's design-system source and token CSS, the neutral profile, with fixture text for a cafe project ("คาเฟ่ริมคลอง", "Canalside Cafe"). The ORV-298 strings (now PR 1) and ORV-292 strings (PR 2) were stand-ins (their English from the spec rows, their Thai written for length only, not copy of record). The sheets were rendered under spec v1.0's split and keep their file names; under spec v1.1 they read as follows. The six sheets `done.png` to `long.png` show the visual section as v1.0's PR 1 had it: Logo type, Colour and Typography as not in this version with a placeholder note that spec v1.1 removed, and in `done.png` a `never` answer the v1.1 done project no longer holds. Their frame, cover, lead block, foundation items, lists and back link are PR 1's as built; their visual section and page heights are not. The PR 1 visual section is the one `pr2-done.png` (done) and `pr2-open.png` (open, colour partly) show; in those two sheets only the positioning item is PR 2's. Each contact sheet holds the 360 frames at 1x (Thai light, Thai dark, English light, English dark) above the 1440 frames at half size. Sheets in `/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO/.orivilo/runs/ORV-302/ORV-302-design-1/screenshots/`:

<!-- prettier-ignore -->
| Sheet | State | Page height, 360 th / 360 en / 1440 th / 1440 en |
| --- | --- | --- |
| `done.png` | done project, nothing skipped | 4297 / 4639 / 3645 / 3734 |
| `skipped.png` | positioning skipped, the rest done, marks shown | 4656 / 5012 / 4039 / 4127 |
| `skipped-steps.png` | positioning, personality and core idea skipped (W2 case B) | 4184 / 4475 / 3601 / 3655 |
| `open.png` | open and waiting items | 3204 / 3423 / 2739 / 2793 |
| `stale.png` | positioning out of date | 4201 / 4532 / 3583 / 3671 |
| `long.png` | 77-character Thai name, long statements | 4961 / 5228 / 4167 / 4221 |
| `pr2-done.png` | the three visual items done (PR 1, spec row 17) with a picked positioning (PR 2, row 20); the file name keeps v1.0's split | 5607 / 6254 / 4907 / 4996 |
| `pr2-open.png` | the visual items open, colour partly (PR 1, row 18) with positioning awaiting a choice (PR 2, row 20); the file name keeps v1.0's split | 3457 / 3781 / 3016 / 3070 |
| `access-signed-out.png`, `access-not-allowed.png`, `access-not-configured.png` | the three notices | one screen |
| `board-link.png` | the board header with the link (focused) | 360 en wraps to two rows |

Measured in all 96 frames: `scrollWidth` equal to the viewport; one start edge (16, or 400 with 732 for the lead block's second column); sections 48 apart; foundation items 32 apart; section header to first item 24; head to value 12; no letter spacing on Thai; the back link 40 tall with a 1 px focus border and a 3 px halo.

Not rendered under spec v1.1 (no render was made in task ORV-302-design-2): the done, open, skipped, stale and long pages with the visual section of PR 1 in place (rows 1, 4, 5, 7, 12), the visual items with their provisional marks and their names in the resting list (row 19), and Logo type's length line holding untrusted text (row 12). Each uses only the anatomy and spacing measured above; the PR 1 stories are their first render, so section 21 lists them.

**Rework render, 2026-11-20 (ORV-302-design-r1, section 6.1).** The running stories of this worktree at head cc5fc68 (Storybook dev server, neutral profile), with the 6.1 classes injected as CSS through `page.addStyleTag` (no tracked file changed; the notes wrappers of R1-3, R1-7, R1-8 and R1-12 emulated by `margin-top: 4px` on each later note of a `gap-1` stack, the same boxes). Each sheet puts before and after side by side, light then dark. Sheets in `/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO/.orivilo/runs/ORV-302/ORV-302-design-r1/screenshots/`:

<!-- prettier-ignore -->
| Sheet | What it shows | Height of the screen root, before / after |
| --- | --- | --- |
| `r1-open-asks-th-360-2x.png`, `r1-open-asks-en-360-2x.png` | GuidebookOpenAsks, Brand personality's Ask at 2x: the wrapped person question and the never question, 4 apart before, 8 after | 360 th 3140 / 3152 |
| `r1-skipped-steps-th-360-2x.png`, `r1-skipped-steps-en-360-2x.png` | GuidebookSkippedSteps at 2x: the Brand personality step under Not yet confirmed, its item's Ask, and Colour's head with two notes (S3) | 360 th 4231 / 4263 |
| `r1-narrow-logo-type-th-360-2x.png`, `r1-narrow-logo-type-en-360-2x.png` | GuidebookNarrow and GuidebookNarrowEnglish, Logo type at 2x: the head marks 8 below the state, the reason, the 3-line length line, the rule (S7) and the labels (S8) | |
| `r1-done-notes-th-360-light-2x.png` | GuidebookDone th light at 2x: positioning labels (S5), architecture (S6), colour fields and labels (S8, S9), typography faces and notes (S11, S12), Logo mark's state and note (S3), Logo type (S7, S8) | |
| `r1-visual-skipped-heads-th-360-2x.png` | GuidebookVisualSkipped th at 2x: heads with the provisional pair and the unchecked line 8 below the state line, the pair itself 4 (S4), colour fields (S9), Brand personality's fields unchanged (S13, S14) | |
| `r1-open-asks-th-360-page.png`, `r1-open-asks-en-360-page.png`, `r1-skipped-steps-th-360-page.png`, `r1-skipped-steps-en-360-page.png`, `r1-narrow-th-360-page.png`, `r1-narrow-en-360-page.png` | the three stories at 360, Thai and English, whole page | |
| `r1-skipped-th-1440-page.png`, `r1-visual-skipped-th-1440-page.png` | GuidebookSkipped and GuidebookVisualSkipped th at 1440, whole page at half size | 1440 th 5594 / 5698 (both) |

Measured before and after in GuidebookSkipped, GuidebookVisualSkipped, GuidebookOpenAsks and GuidebookSkippedSteps at 360 and 1440: the cover to each section 48, section header to first child 24, items and steps 32, head to the next block 12, all unchanged. The page grows by 12 to 104 px, the 8s it adds.

## 21. Screens for visual QA

At 360 and 1440, Thai and English, light and dark. PR 1: `GuidebookDone` (rhythm, start edge, lead block columns, the visual section in place), `GuidebookOpen` (open items read quieter than done ones, the visual items waiting), `GuidebookSkipped` and `GuidebookSkippedSteps` (marks, the resting list, the `nothing` line alone), `GuidebookStale`, `GuidebookUntrustedText` (long Thai at 360, the name inside Logo type's length line), `GuidebookNarrowDark`, `GuidebookAccess`, `GuidebookVisual`, `GuidebookVisualOpen`, `GuidebookVisualSkipped` (marks and the longer resting list), `Board` (the two actions at 360 English wrap cleanly and the board keeps its size). PR 2: `GuidebookAwaitingChoice`, `GuidebookPicked`. In each: the focus on the back link, Thai marks above and below whole, no line past the column. From 2026-11-20 (6.1): in Thai at 360, `GuidebookOpenAsks` and `GuidebookSkippedSteps` (Brand personality's two questions read as two, in the item and in the step), `GuidebookNarrow` (Logo type's notes and labels), `GuidebookVisual` (colour fields, faces, labels) and `GuidebookSkippedSteps` (Colour's two notes): every two peer lines 8 apart, the page rhythm 48, 24, 32, 12 unchanged.

## Changelog

- 2026-11-20, v1.0 (ORV-302-design-1): first design of the guidebook page, its states for both PRs, the board link, the plays and the rendered proof.
- 2026-11-20, v1.1 (ORV-302-design-2): words and labels only, no new render, caused by spec v1.1 and ORV-302 comment 10786. Logo type, Colour and Typography move to PR 1 (sections 7.3, 13, plays P19 to P21 and P24, stories); PR 2 is the drafted positioning only (section 14, P22, P23); the placeholder note of the three visual items is gone and Logo mark alone reads as not in this version; positioning waiting for a choice shows its state line only (7.2, 14); P5, P8, P9, P15 and P18 follow spec v1.1; the reading guide, the strings line, the owner's choices and section 20's sheet labels say which PR shows what.
- 2026-11-20, v1.2 (ORV-302-design-r1): answers finding R1 of the visual sign-off ORV-302-signoff-1 (Thai questions of one step read as one paragraph). New section 6.1, the peer lines rule: two lines of one style that are each their own statement are 8 apart (`gap-2`, or `mt-1` in a `dl` field), surveyed over 20 lists (S1 to S20, 13 changed, rows R1-1 to R1-13); dated additions to sections 2, 6, 7.1, 8 and 13; play P25; the rework render in section 20; front matter on spec v1.2.
