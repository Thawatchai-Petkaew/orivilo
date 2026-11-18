---
issue: ORV-281 (https://tpetkaew.atlassian.net/browse/ORV-281)
spec: docs/specs/ORV-281/spec.md v1
tech: docs/specs/ORV-281/tech.md (section 9)
task: ORV-281-design-1
author: designer
date: 2026-11-18
---

# ORV-281 design: the project list, the intake and the business board

Three screens in `packages/design-system/src/examples`, built only from catalog components and semantic tokens. No new shared component, token or recipe, except the one API question N1 (slice 2). Nothing here was rendered: card heights in section 6.3 are computed from the tokens and carry slack, and the builder's plays measure them.

**Intent behind the look.** The person reads their own words back, placed and labelled; nothing reads as a finished brand or a verdict. So: one reading column, plain text over cards, the state as a neutral word, no colour for a state, no score but a labelled confidence. The list is an overview (DESIGN.md section 2, airy bento: borderless cards on the canvas); the node view is a reading surface; the board is the present board of ORV-274 as it is.

## 1. Flow

| From           | Action                                 | To                                                  |
| -------------- | -------------------------------------- | --------------------------------------------------- |
| Home           | `home.openBusiness` link               | Project list `/business`                            |
| Project list   | `business.list.new` (header or empty)  | Intake `/business/new`                              |
| Project list   | A project card                         | Board `/business/[projectId]`                       |
| Intake         | `business.intake.submit`, check passes | Pending on the intake, then the board (router push) |
| Intake         | Submit, check fails                    | Same screen, errors on fields, focus on the first   |
| Board, slice 2 | A node: click, Enter or Space          | Viewer dialog of that node; Escape back to the node |
| Intake, Board  | `business.list.heading` link in header | Project list                                        |

## 2. The frame all three share

| Part           | Decision                                                                                                                                                                                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Column         | List, intake and slice 1 board: `@container mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 p-6 wrap-anywhere`, the root of `BrandReportScreen`, so every ORIVILO screen shares one start edge. Slice 2 board: the same without `mx-auto max-w-3xl` (the board needs the width); header and board share the page's start edge |
| Header         | `PageHeader` level 1. Title, description and meta as each screen says. Actions: the screen's link(s), `Button asChild` on an `<a>`                                                                                                                                                                                                 |
| Body text      | Inherits `type.body.md` (16 / 1.7, `text.primary`)                                                                                                                                                                                                                                                                                 |
| Notes, meta    | `text-body-sm text-text-secondary` (14 / 1.7), the `FIELD_NOTE` of `brand-report.tsx`                                                                                                                                                                                                                                              |
| Small headings | `text-label-md` (14 / 1.7, 500, `text.primary`), as the brand report's axis headings                                                                                                                                                                                                                                               |
| Person's text  | Every answer, name, website, quote and model value: a text node inside `<bdi>`, `whitespace-pre-wrap` on answers (the person's line breaks stay), never a link                                                                                                                                                                     |
| Access states  | `access` `signed-out`: `business.signedOut`, then `Button variant="primary" asChild` on `<a href={signInHref}>` with `business.signInLink` (new, section 10). `not-allowed`: `business.notAllowed`. `not-configured`: `business.notConfigured`. Each a `<p>` under the `PageHeader`; no form, no list, no board, no header actions |
| Date           | `business.board.savedAt` with `Intl.DateTimeFormat(DATE_TAGS[locale], { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })`, as `formatReadAt`                                                                                                                                                                   |

## 3. Screen 1: project list (`BusinessListScreen`)

| Width | Layout                                                                                                                                                                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1440  | Column 768 centred. `PageHeader` title `business.list.heading`, action `Button variant="primary"` link `business.list.new` at the row's end. 24 under it, a `ul` grid `grid grid-cols-1 @min-[480px]:grid-cols-2 gap-4`; each `li` holds one card. Cards of a row stretch to one height (grid default) |
| 360   | Column 312. The header's action stacks under the title on the same start edge (PageHeader at 479 and below). One card per row, full width                                                                                                                                                              |

Card: `Card interactive href={project.href}`, `CardTitle` (a span inside a link) with the name in `<bdi>`, then 4 px under it a `FIELD_NOTE` line `business.board.savedAt`. Name wraps (`wrap-anywhere`), never clamps: a 120-character Thai name with no space breaks across lines. Order: newest first, as the loader sends.

| State      | What shows                                                                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List       | Header with the primary link; the grid                                                                                                                                             |
| Empty      | Header with no action (one primary per view). `EmptyState size="md" level={2} icon={KnowledgeIcon} title={business.list.empty}` with `action` the primary link `business.list.new` |
| Card hover | The Card recipe's edge; focus-visible: the Card's focus line and halo. No selected state                                                                                           |
| Access     | Section 2                                                                                                                                                                          |

## 4. Screen 2: intake (`BusinessIntakeScreen`)

| Width | Layout                                                                                                                                                                                                                                                                  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1440  | Column 768. `PageHeader` title `business.intake.heading`, description `business.intake.lede`, action `Button variant="secondary"` link `business.list.heading`. Then `form noValidate` `flex flex-col gap-6`: the eight fields at the column width, then the submit row |
| 360   | Column 312; fields at full width; the header action stacks under the title. Nothing else changes                                                                                                                                                                        |

Fields, in `intake-fields-1` order. Every field: `Field` with the label, `required` on 1 and 2, `description={business.intake.optional}` on 3 to 8, `error` from the problem.

| #   | Label key                                                         | Control                                                                         |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | `business.intake.projectName`                                     | `Input` md, `autoComplete="off"`                                                |
| 2   | `business.question.offer`                                         | `Textarea` md, `rows={4} maxRows={10}`                                          |
| 3   | `business.intake.industry`                                        | `Textarea` md, `rows={2} maxRows={6}`                                           |
| 4-7 | `business.question.bestCustomer`, `.problem`, `.instead`, `.only` | `Textarea` md, `rows={3} maxRows={10}`                                          |
| 8   | `business.intake.website`                                         | `Input` md, `type="text" inputMode="url" autoComplete="off" spellCheck={false}` |

No `maxLength` and no counter on any Textarea: its count is graphemes, the check counts characters (`checkIntake`), and a Thai answer would pass the counter and fail the check. The bound speaks through `business.intake.tooLong`.

Submit row: `flex flex-col items-start gap-2`: `Button type="submit" variant="primary" loading={pending} disabled={pending}` `business.intake.submit`, then `<p role="status" className={FIELD_NOTE}>` holding `business.intake.pending` while pending. Under it a `role="alert"` container mounted from the first render; a server failure goes in as `Alert variant="danger" live="off"` with the page's resolved text, the brand report's `Notice`.

| State   | What shows                                                                                                                                                                                                                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Default | Empty fields; one primary                                                                                                                                                                                                                                                                                                                  |
| Invalid | Each problem on its field: `required` on 1 `business.intake.nameRequired`, on 2 `business.intake.offerRequired`; `too-long` `business.intake.tooLong` with `max` 120 or 2000; `website` `business.intake.websiteInvalid`. Values stay. Focus moves to the first invalid field in form order. A field's error clears when its value changes |
| Pending | Button loading and disabled; pending line; fields keep their values and stay editable                                                                                                                                                                                                                                                      |
| Failure | Danger Alert under the button (signed-out, rate-limited, failed), values kept                                                                                                                                                                                                                                                              |
| Focus   | Each control's focus line and halo; hover is the control's own edge                                                                                                                                                                                                                                                                        |
| Access  | Section 2; no form                                                                                                                                                                                                                                                                                                                         |

## 5. The node view (`BusinessNodeView`)

One component for the five nodes, used stacked in slice 1 and inside the viewer in slice 2. Root `@container flex min-w-0 flex-col gap-6`. Prop `heading`: in slice 1 the view draws its own `SectionHeader level={2}`; in the viewer the Dialog title is the heading and the view draws none.

| Part         | Content and look                                                                                                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Heading      | `SectionHeader` title `business.node.*`; on `positioning` its `description` is `business.state.gate`. In the viewer: `DialogContent title`, `description` the gate on `positioning`                                                                 |
| State        | A text line, not a badge (row D1): `p` `FIELD_NOTE` with `business.state.proposed`, `.skipped` or `.empty`, 8 under the heading block. No fill, no colour: a state is not feedback                                                                  |
| AI line (s3) | Only when `view.reading.status` is `rule-based`: a `FIELD_NOTE` `business.label.aiUnavailable`, 8 under the state line, in the same group (row D1)                                                                                                  |
| Fields       | A `div` per field of `business-fields-1`, in order, `flex flex-col gap-1`; fields 24 apart. `h3.text-label-md` with `business.field.*`, then the content (below)                                                                                    |
| Confidence   | Slice 3, once, only when a field of the view holds a reading: `FIELD_NOTE` `business.label.confidence` after the last field                                                                                                                         |
| Still to ask | Only when `stillToAsk` is not empty (never on `situation`). `h3.text-label-md` `business.stillToAsk`, then a `ul` `flex flex-col gap-2` of the question copy (`business.question.*`), body md. No bullets, no numbers: the order carries no meaning |

Field content, top to bottom, 4 px apart unless said:

| Case                             | Shows                                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| An answer                        | The words (body md, `<bdi>`, pre-wrap), then `FIELD_NOTE` `business.label.yourWords`                                                               |
| No answer, no reading            | `FIELD_NOTE` `business.state.skipped` on `audience`, `competitive-frame`, `positioning`; `business.state.empty` elsewhere (reused keys, section 9) |
| `situation.industry` given       | Then `FIELD_NOTE` `business.industry.awaitingTaxonomy`                                                                                             |
| `situation.website` given        | The address as text, then `FIELD_NOTE` `business.website.notRead`                                                                                  |
| `competitive-frame.alternatives` | Always ends with `FIELD_NOTE` `business.competitors.coloursNotRead`                                                                                |
| Readings (slice 3)               | 12 under the person's words, a `ul` `flex flex-col gap-4`, one `li` `flex flex-col gap-1` per reading, in the view's order                         |

One reading (slice 3), top to bottom:

1. Below the floor only: `text-body-sm` (primary ink) `evidence.belowFloor` with the `quality.*` reasons joined by ", ". First, so it is read before the value.
2. `EvidenceSpan item={reading.item}` with the value in `<bdi>` as children: the fact, then the pill that opens the quote.
3. `FIELD_NOTE` `evidence.fromModel` with the saved model id (copy from `EVIDENCE_STRINGS` in the engine).
4. `FIELD_NOTE` `business.state.proposed`, then under it `FIELD_NOTE` `business.reading.confidence` (the number by `formatNumber`), each its own line on the field's start edge (row D1: no badge on the canvas or the dialog).
5. When `spans.length > 1`: `EvidenceList items={reading.spans}`.

### 5.1 Rework rows (visual sign-off)

| #   | Finding                                                                                                                                                                                                                     | Decision and target                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Tokens                                                                                                                      | Play that proves it                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | V1 of sign-off ORV-281-signoff-1 (Important): the neutral sm badge's fill (`surface.sunken`) is about 1.03:1 on `surface.canvas` in neutral light, so no pill shows and the state word starts 8 px inside the column's edge | **The state is a line of text, not a badge.** Why: the state is meta of the node, the same voice as the page header's saved-at line and the fields' own "skipped" and "nothing given yet" notes; a pill needs a fill that separates from the canvas (3:1) under every profile and mode, and no neutral fill does that today without a new token. Text has no fill, so its ink sits on the start edge everywhere, on the canvas and inside the viewer dialog alike. **Builder, `business-node-view.tsx`:** drop the `Badge` import; replace the `SectionHeader` block and the `<div><Badge …/></div>` with one `<div className="flex min-w-0 flex-col gap-2">` holding `{heading ? <SectionHeader …/> : null}` (unchanged) then `<p className={FIELD_NOTE} data-node-state={node.state}>{m.business.state[node.state]}</p>`. In the viewer (`heading={false}`) the group holds the state line alone. Target: state ink x equal to the h2's x (0 px), 8 px from the header block's bottom to the state line, 24 px from the state line to the first field label, one line at 312 and at 768 in Thai and English | `type.body.sm` (14 / 1.7), `text.secondary`, on `surface.canvas`; gap 8 (`gap-2`, layout). No new token, recipe, key or API | In `business-board.stories.tsx` the two `.ds-badge` queries (the saved play and the skipped play's `state` helper) become `[data-node-state]`, asserting the text and `data-node-state` equal to `node.state`. Add to the saved play, per node: no `.ds-badge` inside `[data-node]`; the state's text range left equals the h2's left within 1 px; the state's top minus the `.ds-section-header` bottom is 8 within 1 px. Runs in `Saved`, `SavedEnglish`, `Skipped`, `SkippedEnglish` |

Rendered for D1 with the change applied in a reverted scratch edit (ORV-281-design-2, 48 screenshots, `Saved` and `Skipped` in Thai and English, neutral, professional and friendly, light and dark, at 360 and 1440): ink offset from the h2 0 px on all five nodes of every frame, gap under the header 8, gap to the first field 24, one line each, `scrollWidth` 360 at 360; `text.secondary` on `surface.canvas` 6.15 and 7.65 (neutral light, dark), 5.11 and 9.28 (professional), 5.14 and 9.23 (friendly). Slice 2's card at rest (section 6.3) still names a Badge on `surface.card`; that is outside D1 and gets the same 3:1 check when slice 2 is designed.

Container widths of the view: under 960 px one column. At 960 and over (the viewer at 1440) a grid `grid-cols-[minmax(0,42rem)_minmax(0,20rem)] gap-x-12`: state, AI line, fields and confidence in the first column; still to ask in the second, top aligned with the state. Each column keeps one start edge; no line of body text runs past 42rem.

## 6. Screen 3: project board (`BusinessBoardScreen`)

### 6.1 Header, every slice

`PageHeader` title the project name (`<bdi>`, wraps), description `business.board.lede`, meta `FIELD_NOTE` `business.board.savedAt`, action `Button variant="secondary"` link `business.list.heading`. Slice 3 with `reading.status` `rule-based`: 24 under the header, `Alert variant="info" live="off"` title `business.label.aiUnavailable`, description the reason's `business.errors.*` line.

### 6.2 Slice 1: stacked views

Column 768 (360: 312). Under the header, the five `BusinessNodeView`s with `heading`, in fill order, `flex flex-col gap-12` (48 between nodes, no line between them: space separates, the section heading names). One column at both widths.

### 6.3 Slice 2: the present board

Board block: `CanvasBoard variant="present"`, full width of the column, `h-[70dvh] min-h-[480px]`, `label` `business.board.label` (new), `minimap={false}`, `fitView`, `onNodeOpen`, `renderBody`. Inside it `CanvasControls position="center"` with no children: the dock shows `board.readOnly` and the four viewport commands. No `data-lod` writer: labels show at every zoom and the gaps below are sized for it.

**Graph** (`boardGraphOf(view)`): nodes in fill order (Tab order follows it, row 25), each `type: "orivilo"`, `data`: `title` `business.node.*`, `kind: "knowledge"`, `size: "md"` (320, `size.node.md`), `pad: "text"`, `open` (see N1), no `status`, `basis` or `source`.

| Node                | x   | y   | Inputs (`kind: "text"`, label)                                                                                                          | Output (`kind: "text"`, label)          |
| ------------------- | --- | --- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `situation`         | 0   | 326 | none                                                                                                                                    | `out`: `business.node.situation`        |
| `business-core`     | 464 | 28  | `in`: `business.node.situation`                                                                                                         | `out`: `business.node.businessCore`     |
| `audience`          | 464 | 340 | `in`: `business.node.situation`                                                                                                         | `out`: `business.node.audience`         |
| `competitive-frame` | 464 | 652 | `in`: `business.node.situation`                                                                                                         | `out`: `business.node.competitiveFrame` |
| `positioning`       | 928 | 326 | `from-business-core`, `from-audience`, `from-competitive-frame`, in that order (top to bottom), labelled with their source node's title | none                                    |

Edges, `type: "orivilo"`, `data: { meaning: "input", label: false }` (the solid stroke and the port glyphs carry it; six pills would crowd the turn into Positioning; the accessible name stays): `situation:out` to the `in` of each column 2 node; each column 2 `out` to its own `from-*` port on `positioning`. The port order matches the column order, so no two edges cross.

**Card at rest** (`renderBody`), one `div` `flex flex-col gap-2`: the state as a `FIELD_NOTE` text line, no badge (row D2, section 6.5); a `ul` `flex flex-col gap-1 text-body-sm` of the node's field labels (`business.field.*`) in the node's own `text.primary`, so the card says what the node holds; on `positioning` a last `p` `FIELD_NOTE` with `business.state.gate` (row 24). The card shows no answer text: each answer must carry `business.label.yourWords`, which belongs in the view, and fixed text keeps the heights known. The label above the card is CanvasNode's: Knowledge glyph, title, open glyph.

**How the gap was sized.** Card height = 2 border + 32 padding + 23.8 state line + 8 + lines x 23.8 (`type.body.sm` 14 x 1.7) + (lines - 1) x 4 (row D2: the badge's wrapper already drew a 23.8 line box, so the text line keeps the height):

| Node            | Lines                      | Card height (measured, D2) | Port floor (catalog rule) |
| --------------- | -------------------------- | -------------------------- | ------------------------- |
| `situation`     | 3                          | 145.2                      | 64                        |
| column 2 (each) | 2                          | 117.4                      | 64                        |
| `positioning`   | 1 field + 8 + gate 2 lines | 145.2                      | 112 (three inputs)        |

Column 2 pitch 312 (13 grid units): from a card's bottom to the next card's top is 312 - 117.4 = 194.6 world px. The next card's label sits in that space: about 28 at zoom 1, growing by 1 / zoom below it (`--_ls`), so about 70 at 0.4 and 112 at the 0.25 floor. The stack gap left clear of the label, in world px:

| Zoom | Label | Clear | Clear if a field label wraps (+24, Linux's taller text) |
| ---- | ----- | ----- | ------------------------------------------------------- |
| 1    | 28    | 167   | 143                                                     |
| 0.4  | 70    | 125   | 101                                                     |
| 0.25 | 112   | 83    | 59                                                      |

Every case is over 40 world px; ORV-278 needed 68 card to card at zoom 1, this gives 195. On screen the clear gap is the world value times the zoom: measured 171 at zoom 1 and 96.5 at the 1440 fit zoom (0.617), but 25.2 at the 360 floor (0.25), under 40 (see row D2's rendered note). `situation` and `positioning` centre on `audience` (y 340 + 57 - 71 = 326). Columns 144 apart (6 grid units), room for a port name pill (about 120) beside a dot. World about 1248 x 766.

| Viewport   | Board      | Fit zoom (estimate) | Reads                                                                                                                                                                               |
| ---------- | ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1440 x 900 | 1392 x 630 | about 0.58          | All five cards and labels; card text small but legible                                                                                                                              |
| 360 x 760  | 312 x 532  | 0.25 (the floor)    | A map: the five cards at 80 px with their titles above at screen size; reading happens in the viewer. Dock spans the board, zoom steps hidden, fit stays (CanvasControls under 480) |

**Viewer.** `onNodeOpen(id)` sets the open id. `Dialog open onOpenChange` with `DialogContent size="viewer"` (title and description per section 5), body `ScrollArea label={node title}` holding `BusinessNodeView heading={false}`. `onOpenAutoFocus`: prevent default, focus the ScrollArea viewport (arrow keys scroll it). `onCloseAutoFocus`: prevent default, focus the node's element with `preventScroll: true`, so focus returns to the node and the viewport does not move (row 23). Close control last, the catalog's. No pager: one node, one view.

### 6.4 Board states

| State             | Slice | What shows                                                                                     |
| ----------------- | ----- | ---------------------------------------------------------------------------------------------- |
| Saved             | 1     | Header, five stacked views                                                                     |
| Board             | 2     | Header, board, dock with `board.readOnly`                                                      |
| Node hover        | 2     | `node.border-hover`, port name pills                                                           |
| Node focus        | 2     | The node's focus line and halo outside; never the selected outline                             |
| Node selected     | 2     | Not reachable as a goal: a click opens. The board's own selected look if it occurs             |
| Viewer open       | 2     | Dialog over the scrim; the view; Escape closes                                                 |
| Skipped           | 1, 2  | `business.state.skipped` on Audience, Competitive frame, Positioning; their fields say skipped |
| Readings          | 3     | Section 5, one reading list per field                                                          |
| AI unavailable    | 3     | Info Alert under the header; the AI line in each view; the person's words only                 |
| Untrusted text    | 1-3   | Markup shows as literal text; the website is not a link                                        |
| Access, not found | 1     | Section 2; not found is the app's 404 page, the same for every cause                           |

### 6.5 Rework rows (slice 2)

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Decision and target                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Tokens                                                                                                                                                                                                                                                        | Play that proves it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D2  | D1's open question (ORV-282-design-1): slice 2's card at rest names a neutral sm `Badge` on `surface.card`. Measured on the built card at the fit zoom, 48 renders: the badge fill (`surface.sunken`) against `surface.card` is 1.13 and 1.22 (neutral light, dark), 1.20 and 1.65 (professional), 1.17 and 1.64 (friendly), all far under 3:1, so no pill shows and the state word starts 8 px inside the field names' start edge. No existing neutral surface token gives 3:1 on `surface.card` and keeps the text pair | **The state is a text line, the same voice as D1 in the viewer, not a badge.** One voice: the state reads as a meta line on the board card, in the viewer dialog and on the slice 1 page alike. **Builder, `business-board.tsx` `renderBody`:** drop the `Badge` import; replace `<div><Badge variant="neutral" size="sm">…</Badge></div>` with `<p className={FIELD_NOTE} data-node-state={node.state}>{m.business.state[node.state]}</p>`; drop `text-text-secondary` from the `ul` (it stays `flex flex-col gap-1 text-body-sm`), so the field names take the node's `text.primary` and the state and gate are the only secondary lines; the gate `p` becomes `className={FIELD_NOTE}`. Rejected: the state line and the names both secondary (the state reads as the first field name). Target, at zoom 1, every node, Thai and English: state ink x equal to the first field name's ink x (0 px); 8 from the state line's bottom to the `ul` top; one line (23.8 world px); card heights unchanged, 145.2 (`situation`, `positioning`) and 117.4 (column 2) | `type.body.sm` (14 / 1.7); `text.secondary` for the state and the gate, `text.primary` (`--cmp-node-fg`) for the field names, on `surface.card` (`--cmp-node-bg`); gap 8 (`gap-2`, layout). `type.label.sm` leaves the card. No new token, recipe, key or API | In `business-board.stories.tsx`: the `.ds-badge` query in `expectBoard` (the card) and in the skipped play's `state` helper become `[data-node-state]`, asserting its text is `m.business.state[node.state]` and its `data-node-state` equals `node.state`. Add to `expectBoard`, per node at zoom 1: no `.ds-badge` inside `.ds-node`; the state's text range left equals the first `li`'s text range left within 1 px; the `ul` top minus the state's bottom is 8 within 1 px (both divided by the zoom). `expectCardsClear` stays. The viewer's `.ds-badge` query in `expectViewer` follows D1 when slice 1 merges. Runs in `Board`, `BoardEnglish`, `Skipped`, `SkippedEnglish` |

Rendered for D2 with the change applied in a reverted scratch edit (ORV-282-design-1; `Board` and `Skipped`, Thai and English, neutral, professional and friendly, light and dark, 360 and 1440; 48 measured renders, 48 screenshots under `.orivilo/runs/ORV-282/ORV-282-design-1/screenshots/`, prefix `b__` for the decision, `variantA__` and `variantB__` for the comparison): state ink minus first field ink 0 px on all five nodes of every render; state line 23.8 world px (one line); state to list 8; card heights 145.19 and 117.39 world px, the same as with the badge; `text.secondary` on `surface.card` 6.78 and 7.04 (neutral light, dark), 5.49 and 6.78 (professional), 5.54 and 6.75 (friendly); `scrollWidth` 360 at 360, 1440 at 1440. Column 2, card bottom to the next label top on screen: 171.1 at zoom 1 and 96.5 at the 1440 fit zoom (0.617, the estimate said 0.58). At 360 the fit zoom is the 0.25 floor and that gap is 25.2 screen px, under 40; the row does not change it (the card height did not move), and section 12's bound is checked by `expectCardsClear` at 1440 only. Focus on a node keeps its line and halo, not the selected outline, in both modes and languages; Thai marks clear on every line.

The board at 360 is a map: it fits at the 0.25 floor, its node titles may truncate and reading happens in the viewer (decision of ORV-282 comment 10686, point 1). The 40 px gap bound of section 12 applies at zoom 1 and at the 1440 fit zoom, not at the 360 fit zoom.

## 7. Tokens used

Semantic only, through components and the token utilities above: `surface.canvas` (page and present board), `surface.card` (cards, nodes, dialog), `border.subtle` / `border.card`, `text.primary`, `text.secondary`, `text.link` (Button link), `action.primary` (one per screen: the list's new link or the intake's submit; the board has none), `focus.ring` with `focus.halo-opacity`, `feedback.danger.*` (field errors, failure Alert), `feedback.info.*` (AI unavailable Alert), `edge.stroke` and `port.text` (present board), `size.node.md`, `space.grid-gap`, `type.body.md`, `type.body.sm`, `type.label.md`. No `action.intent`: nothing on these screens asks the engine to run.

## 8. DESIGN.md section 9, walked

| #   | Tell                            | Result                                                                                                                    |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cream-serif / near-black-acid   | Absent: neutral profile, no lime on any screen                                                                            |
| 2   | Broadsheet                      | Absent: body 16 / 1.7, 24 and 48 gaps                                                                                     |
| 3   | Card kit                        | Justified once: project cards are the list's units (airy bento). Views, fields and readings are text on the page, no card |
| 4   | Template chrome                 | Absent: no caps, no middot, no mono labels, no arrows on links                                                            |
| 5   | One accented word; empty labels | Absent: every heading names content; field labels are the content's name                                                  |
| 6   | Ambient motion                  | Absent: no entry animation (the viewer has none), no hover transitions added                                              |
| 7   | Numbered markers                | Absent: fields and questions carry no numbers or bullets                                                                  |
| 8   | Lime as status; focus removed   | Absent: states are neutral words; focus from the components                                                               |
| 9   | Thai set with Latin rules       | Absent: no tracking or transform; 1.7 on every wrapping line                                                              |
| 10  | Studio style in a preview       | Not applicable: no preview frame                                                                                          |
| 11  | Fake evidence                   | Absent: confidence only with its label; no success state; AI named only where a reading exists                            |
| 12  | Per-page mood patch             | Absent: no raw colour, radius or font; `h-[70dvh] min-h-[480px]` is layout                                                |

## 9. Reused keys (not new)

`business.state.skipped` and `business.state.empty` also mark an empty field (section 5). `board.readOnly` in the dock. `business.list.heading` as the back link text. `evidence.fromModel`, `evidence.belowFloor`, `quality.fewWords` from `EVIDENCE_STRINGS`.

## 10. New strings (for the product owner)

| Key                    | English        | Thai                | Why                                                                                            |
| ---------------------- | -------------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| `business.signInLink`  | Go to sign in  | ไปหน้าลงชื่อเข้าใช้ | The spec's signed-out state names a sign-in link with no key; copy of `brandReport.signInLink` |
| `business.board.label` | Business board | กระดานธุรกิจ        | `CanvasBoard` requires `label`, the region's accessible name                                   |

## 11. Needs decision

**N1, slice 2 only: the open label.** `NodeContent.open` takes `{ count }`; the card label then shows "{count} pages" and the accessible name is `graph.nodeOpenLabel` ("{title}, {count} pages"). A business node opens one view, not pages. (a) Recommended: make `count` optional in the shared `CanvasNode`; without it the label shows the open glyph only and the name is `graph.nodeLabel` ("Situation, Knowledge"), with `aria-haspopup="dialog"` saying it opens. Additive, no new copy; a public API change of `CanvasNode` (lane L flag), its catalog rule and one story. (b) Keep the API with `count` = the node's field count: "3 pages" is false, and Positioning reads "1 pages". Slices 1 and 3 do not wait on it.

## 12. Screens for visual QA

Each at 360 and 1440, Thai and English, light and dark.

| Story                                                   | Check                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `List`, `ListEmpty`                                     | One start edge with the header; cards of a row one height; a 120-character Thai name wraps, no clip                                                                                                                      |
| `SignedOut` (and not allowed, not configured)           | Header then one paragraph; no form                                                                                                                                                                                       |
| Intake default, `Invalid`, `Pending`, failure           | Long Thai question labels wrap at 1.7, marks clear; errors under their fields; focus on the first invalid                                                                                                                |
| `Saved`, `Skipped`, `UntrustedText`, `Narrow` (slice 1) | Each view: the state line on the h2's start edge, 8 under the header (D1), fields 24 apart, notes in secondary ink; a 2,048-character website wraps; `scrollWidth` at most 360                                           |
| `Board`, `Skipped`, `Narrow` (slice 2)                  | Measured gap from each card's bottom to the next card's top 40 or more with labels included, at zoom 1 and at the 1440 fit zoom (at 360 the board is a map, section 6.5); edges do not cross; dock word; focus on a node |
| Viewer per node (slice 2)                               | Title and gate description; two columns at 1440, one at 360; body scrolls; focus back on the node                                                                                                                        |
| `Readings`, `AiUnavailable` (slice 3)                   | Below-floor line first; the pill opens the quote; one confidence note per view; the info Alert under the header                                                                                                          |

## Changelog

- v1 (2026-11-18): first design for slices 1 to 3 from spec v1 and tech section 9. Nothing rendered; heights computed from tokens with slack, to be measured by the plays.
- v1.1 (2026-11-18, ORV-281-design-2): row D1, the node state is a `FIELD_NOTE` text line under the heading instead of a neutral badge (sign-off V1); the AI line and the reading row follow it. Rendered: 48 screenshots under `.orivilo/runs/ORV-281/ORV-281-design-2/screenshots/`.
- v1.2 (2026-11-18, ORV-282-design-1): row D2, the node state on the board card is a `FIELD_NOTE` text line instead of a neutral badge (its fill measured 1.13 to 1.65 on `surface.card`), field names in `text.primary`; section 6.3 heights measured (145.2 and 117.4) and the gap table restated. Rendered: screenshots under `.orivilo/runs/ORV-282/ORV-282-design-1/screenshots/`.
