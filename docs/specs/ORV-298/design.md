---
issue: ORV-298 (https://tpetkaew.atlassian.net/browse/ORV-298)
spec: docs/specs/ORV-298/spec.md v1.1 (50a4300)
tech: docs/specs/ORV-298/tech.md
task: ORV-298-design-1
author: designer
date: 2026-11-20
---

# ORV-298 design: Colour, Typography and Logo type on the business board

Three cards on the business board and three node views in the existing viewer dialog: Colour (`color`, PR 1), Typography (`typography`, PR 2), Logo type (`logo-type`, PR 3). No new screen, component, token, recipe class or public prop. Every word is a key of the spec's Strings table or one of its reused keys, except one row label that section 14 asks product for. Built from catalog components only: `CanvasBoard` (present variant), `Dialog` with `DialogContent size="viewer"`, `ScrollArea`, `Field`, `Input`, `RadioGroup` with `RadioGroupItem`, `Button`, and `Alert` through the `FailureRegion` of `foundation-parts.tsx`, as ORV-291's views use them.

Every number below was measured on a rendered mock (section 15): the markup written with the classes named here, composed from the design-system source and token CSS of `origin/develop` at `6aea3cf` (ORV-295 and ORV-290 in), under the neutral profile, at 360 and 1440 px, Thai and English, light and dark. Board geometry was computed with React Flow's bezier (control offset half the run, as `getBezierPath`) on the real card heights and checked on the rendered board. Nothing here is built code.

## How to read this file

Each PR's builder reads the shared part, its own part and Common.

<!-- prettier-ignore -->
| Part | Sections | Read by |
| --- | --- | --- |
| A, shared and PR 1 | 1 Flow, 2 Board, 3 Card at rest, 4 View frame and shared parts, 5 Colour | PR 1; sections 1 to 4 also PR 2 and PR 3 |
| B, PR 2 | 6 Typography (with its board stage) | PR 2 |
| C, PR 3 | 7 Logo type (with its board stage) | PR 3 |
| Common | 8 Tokens and classes, 9 DESIGN.md section 9, 10 What the PR 234 sign-off asked not to repeat, 11 Owner's choices, 12 Seen and not changed, 13 Impact, 14 Strings, 15 Rendered proof, 16 Screens for visual QA | every PR |

---

## Part A: shared parts and Colour (PR 1)

## 1. Flow

1. The person opens a saved project's business board. Colour (PR 1), Typography (PR 2) and Logo type (PR 3) sit to the right of the foundation nodes. A card shows its title, its state line and the names of its fields; never a value, an answer, a family word, a hex or a colour.
2. They click a card, or Tab to it and press Enter. The view opens in the viewer dialog with the node title as the dialog title and no description. Focus goes to the view's scroll region (unchanged).
3. The view reads top to bottom: the state line, the mark lines or the ask line when there are any, the fields (decisions first on Colour, the answer first on Typography and Logo type), the honesty labels once, then the one control. One primary action at most.
4. Colour's control opens the lineup editor in place of the fields. Typography and Logo type ask inline: the question is a `RadioGroup` with nothing checked and one Save button, as Brand architecture.
5. Save checks on the client first, then calls. While it runs, Save shows `business.positioning.saving`; nothing else can be pressed.
6. After a save the view shows its new state and focus goes to the view's scroll region, scrolled to its top, so the state line (a polite `role=status`) is read first. No heading takes focus (section 10, F3). Escape closes the dialog and focus returns to the card.

## 2. The board

### 2.1 Positions

World pixels, top left corner of each card; every card `size: "md"`, 320 wide. Columns as ORV-291: 1 at x 0, 2 at 456, 3 at 928, 4 at 1400, 5 at 1888; this story adds column 6 at x 2376 and column 7 at x 2864 (the 488 pitch of columns 4 to 5).

<!-- prettier-ignore -->
| Node | Column | x | y | Card height (world, measured) | Added in |
| --- | --- | --- | --- | --- | --- |
| `situation` | 1 | 0 | 447 | 145.2 | ORV-281 |
| `business-core` | 2 | 456 | 28 | 117.4 | ORV-281 |
| `audience` | 2 | 456 | 340 | 117.4 | ORV-281 |
| `competitive-frame` | 2 | 456 | 652 | 117.4 | ORV-281 |
| `positioning` | 3 | 928 | 326 | 173.0 gate, 149.2 agreed | ORV-281 |
| `identity-frame` | 4, upper lane | 1400 | **-340 from PR 1** (was 160) | 145.2 | ORV-291 PR 1 |
| `architecture` | 4, lower lane | 1400 | 576 | 117.4 | ORV-295 |
| `name` | 5, lower lane | 1888 | 473 | 104.0 | ORV-295 |
| `core-idea` | 5, middle | 1888 | 212 (unchanged, ORV-291 design 2.1) | 173.0 | ORV-296 |
| `color` | 6, upper lane | 2376 | -330 | 200.7 (state line and five field names) | PR 1 |
| `logo-type` | 6, lower lane | 2376 | 552 | 117.4 (two field names, two input ports) | PR 3 |
| `typography` | 7 | 2864 | 0 | 145.7 (three field names) | PR 2 |

Why these places:

- **Brand personality moves up 500 in PR 1.** Its out port (y 232.6 at y 160) is level with Core idea (212 to 385) and two lanes above Name (473 to 577). Colour and Typography both read Brand personality, and every bezier from that port to a card right of column 5 runs into Core idea's card or its title (computed: with every built card fixed, the best place for Colour runs 32 world px into Core idea; without Core idea it passes 5.0 from Name's title band). At y -340 its out port is -267.4: the edges to Colour and Typography run above Core idea's title, and its edge to Core idea becomes a steep S inside the empty gap between columns 4 and 5. Positioning's edge to Brand personality is a steep S inside the gap between columns 3 and 4. This changes ORV-291 design 2.1; it is the owner's to change (section 11, choice 1).
- **An expression lane above the strategic core.** Brand personality, Colour and Typography form the upper lane; Brand architecture, Name and Logo type the lower lane; Core idea sits between them in column 5, fed from both. Competitive frame's out port (710.7) sits 17.7 under Brand architecture, so its edge to Colour climbs between Brand architecture's title and Brand personality's card in column 4 and passes above Core idea's title in column 5.
- **Fill order, left to right.** ORV-126 numbers: Logo type 13, Colour 15, Typography 16. Logo type and Colour share column 6 (lower and upper lane), Typography is column 7: no node sits left of one earlier in fill order. Spec rows 12, 24 and 36 hold: Colour is right of Brand personality, Typography right of Colour, Logo type right of every foundation node (x 2376 against Name's right edge 2208).
- **Tab order** is the node array order, which is `FOUNDATION_NODES` order (fill order): situation, business core, audience, competitive frame, positioning, Brand personality, Brand architecture, Name, Core idea, Logo type, Colour, Typography. PR 3 inserts Logo type before Colour.

### 2.2 Ports and edges

Inputs on the left, outputs on the right, centred on the card at the 40 pitch (`CanvasNode`, unchanged). A node with two sources names each port `from-<source>`. The port order is this table:

<!-- prettier-ignore -->
| Node | Inputs, top to bottom (port label) | Port y (world) | Output |
| --- | --- | --- | --- |
| `identity-frame` | `in` (Positioning) | -267.4 | `out` at -267.4: feeds `color` (PR 1), `typography` (PR 2), `core-idea` (ORV-296) |
| `competitive-frame` | unchanged | unchanged | `out` at 710.7: feeds `positioning` and, from PR 1, `color` |
| `architecture` | unchanged | 614.7, 654.7 | `out` at 634.7: feeds `name` and, from PR 3, `logo-type` |
| `name` | unchanged | 505, 545 | **new in PR 3:** `out` at 525.0, feeds `logo-type` |
| `color` | `from-identity-frame` (Brand personality), `from-competitive-frame` (Competitive frame) | -250.1, -210.1 | none |
| `typography` | `in` (Brand personality) | 72.6 | none |
| `logo-type` | `from-name` (Name), `from-architecture` (Brand architecture) | 590.7, 630.7 | none |

`INPUT_ORDER` gains `color: ["identity-frame", "competitive-frame"]` (PR 1) and `"logo-type": ["name", "architecture"]` (PR 3): both differ from the require order (ORV-126 numbers put Competitive frame before Brand personality and Brand architecture before Name), and the upper source must enter the upper port so no two edges cross at a card. Edges stay `meaning: "input"`, `label: false`.

### 2.3 Clearance of each edge

World px from every other card, and from every other card with its title band, bezier sampled at 400 points, at the stage's fit zoom (title band 27.8 / zoom: 64.7 at 0.430, 76.4 at 0.364) and at the 0.25 floor (111.2). The band is taken full card width, so the numbers understate the room beside a short title.

<!-- prettier-ignore -->
| Edge | Stage | From cards | From cards and titles, fit zoom | At 0.25 | Nearest |
| --- | --- | --- | --- | --- | --- |
| `competitive-frame` to `color` | PR 1 | 58.6 | 48.9 | 15.0 | `positioning` card, `architecture` title |
| `competitive-frame` to `color` | PR 2, 3 | 58.6 | 40.3 | 15.0 | as above |
| `identity-frame` to `color` | PR 1 to 3, with Core idea | 463.8 | 387.5 | 352.6 | `core-idea` |
| `identity-frame` to `color` | PR 1, without Core idea | 724.7 | 660.1 | | `name` |
| `identity-frame` to `typography` | PR 2, 3 | 71.3 | 71.3 | 71.3 | `color` (runs under it) |
| `architecture` to `logo-type` | PR 3 | 54.1 | 54.1 | 54.1 | `name` |
| `name` to `logo-type` | PR 3, with Core idea | 140.2 | 140.2 | 140.2 | `core-idea` |
| `name` to `logo-type` | PR 3, without Core idea | 498.6 | 496.0 | | `architecture` |
| `positioning` to `identity-frame` (moved) | all | 215.2 | 162.5 | | `architecture` |
| `identity-frame` to `core-idea` (moved source) | with Core idea | 194.7 | 118.5 | 83.7 | `name` |
| `positioning` to `core-idea` | with Core idea | 154.7 | 78.6 | | `name` (ORV-291 had 22.2) |

No edge runs under a card at any stage, with or without Core idea. Two ORV-291 edges pass close to a title band at the smaller fit zoom of PR 2 and PR 3 because the band grows as the board zooms out, not because anything moved near them: `situation` to `architecture` 9.1 from Competitive frame's band and `positioning` to `name` 5.0 from Brand architecture's band (ORV-291 2.2 records both, and their crossing at 0.25). Crossings added: Competitive frame to Colour crosses Positioning to Brand architecture and Positioning to Name between columns 3 and 5; Brand personality to Core idea crosses Positioning's edges to Name and Core idea in the gap between columns 4 and 5. None is at a card.

### 2.4 What the overview fit does

Board region unchanged (`h-[70dvh] min-h-[480px]`): 1392 x 630 at 1440, 312 x 630 at 360 (measured on the mock).

<!-- prettier-ignore -->
| Stage | Nodes, edges with ORV-296 (W2) | Without ORV-296 | World box (cards) | Fit at 1440 | At 360 |
| --- | --- | --- | --- | --- | --- |
| Base (`develop`, ORV-295 in) | 9, 13 | 8, 11 | 2208 wide | 0.524 | 0.25 floor |
| PR 1 head | 10, 15 | 9, 13 | x 0 to 2696, y -340 to 769 | 0.430 (width bound) | 0.25 floor |
| PR 2 head | 11, 16 | 10, 14 | x 0 to 3184 | 0.364 (width bound) | 0.25 floor |
| PR 3 head | 12, 18 | 11, 16 | x 0 to 3184 | 0.364 (measured 0.3637 on the mock) | 0.25 floor |

As built (2026-11-20, A2): the story `BoardAt1440` (Examples/Application: Business board) measured the PR 1 fit at 1440 as 0.412, not 0.430. Every card sits inside the board; the figures that scale from 0.430 (title band 64.7 world px) read about 4 percent larger at 0.412.

As built (2026-11-20, B2): the story `BoardAt1440` measured the PR 2 fit at 1440 as 0.3637, which is the 0.364 of the table within 0.01 (ten cards, `typography` at (2864, 0), width bound). At that zoom the gap down column 2 from a card's bottom to the next label's top reads 35.05 screen px, which is 96.3 world px (the positions did not move); the earlier 40 screen px bound of `expectCardsClear` is now read in world px (at least 90), so it no longer depends on the fit.

As built (2026-11-20, C2): the story `BoardAt1440` measured the PR 3 fit at 1440 as 0.3637 on this branch (twelve cards with Core idea of ORV-296, eighteen edges, `logo-type` at (2376, 552)), which is the 0.364 of the PR 3 row within 0.01; Logo type adds no width, so `typography` at (2864, 0) still sets the bound and the fit is the same as PR 2's.

- **1440.** The whole board fits at every stage. At 0.364 a card's body text is about 5 px on screen and reads as texture; the titles stay at their screen size (the label scales by 1/zoom) and carry the overview. That is the overview's job; the view carries the reading.
- **360.** As ORV-291 2.3 (correction of 2026-11-19): the fit stops at `minZoom` 0.25 and centres the world; most cards are outside. The person pans (drag, arrow keys on the focused board), zooms with the controls, or Tabs: focus pans a card into view only when no part of it is in view, so a card partly in view stays cut. Nothing on the page scrolls sideways (`documentElement.scrollWidth` 360, measured). A pan that brings every focused card whole into view stays the ORV-280 follow-up (ORV-291 open question 14 (b)).
- **When the whole board no longer fits** (every 360 frame, and 1440 if more nodes join): the reader uses the canvas controls (zoom out to 25 percent, fit), drags, or Tabs from card to card in fill order; Enter opens the card's view, which is the full-size reading.

### 2.5 Board plays

<!-- prettier-ignore -->
| PR | Story | Play clause and bound |
| --- | --- | --- |
| 1 | `Board` (row 12) | 9 cards and 13 edges on the base without ORV-296, 10 and 15 with it (W2); `identity-frame` at world (1400, -340) and `color` at (2376, -330) read from the node transforms; Colour's `[data-node-state]` text equals the state line and its five `li` equal section 3; no `bdi`, no `#` and no element with an inline background inside any card; `expectPortPillsClear` on Colour, Brand personality and Competitive frame at the fit zoom (the ORV-295 reading, sign-off F1); Enter opens the viewer titled "Colour", Escape returns focus to the card |
| 1 | `BoardAt1440` | viewport zoom 0.430 within 0.01; every card's box inside the board's box |
| 1 | narrow board stories | zoom 0.25 within 0.001; `documentElement.scrollWidth` at most 360; each node focused in fill order overlaps the board's box (ORV-291 B3 as corrected) |
| 2 | `Board` (row 24) | one more card and one more edge than PR 1; `typography` at (2864, 0); `expectPortPillsClear` on Typography; zoom 0.364 within 0.01 at 1440 |
| 3 | `Board` (row 36) | 12 and 18 with ORV-296, 11 and 16 without; `logo-type` at (2376, 552); Name has an `out` handle; `expectPortPillsClear` on Logo type and Name; Tab reaches Logo type after Core idea (or Name) and before Colour; zoom 0.364 within 0.01 |

The ORV-291 and ORV-295 board plays that assert Brand personality at (1400, 160) change to (1400, -340) in PR 1, in the same commit as the position.

### 2.6 Card titles at the overview fit (ORV-298-design-f1)

Answers finding F1 of the visual sign-off `ORV-298-signoff-1` (head 02b6cfe): at the 1440 fit of the twelve-card board four titles ended in the fade, where on `develop` (nine cards, fit 0.5245) every title was whole.

**Cause.** The label above a card is bound to the card: its screen width is 317.95 x zoom (the card's padding box), so 115.64 px at the 0.3637 fit against 166.8 at 0.5245. The kind glyph (14), the open glyph (14) and the label's two 4 px gaps take 36 of it, which leaves the title 79.6 px (measured `clientWidth` 80). The title is `label.sm`, 13 px, Inter with Sarabun, and keeps that size on screen at every zoom (the label scales by 1 / zoom), so a title wider than 80 px fades. Measured at the 1440 fit, `clientWidth` / `scrollWidth`, with the text's own width from a `Range`:

<!-- prettier-ignore -->
| Language | Node | Text width | Before (head 02b6cfe) | After (row a) |
| --- | --- | --- | --- | --- |
| th | `situation` สถานการณ์ตั้งต้น | 91.70 | 80 / 92, cut | 92 / 92 |
| th | `competitive-frame` ตลาดและคู่แข่ง | 81.66 | 80 / 82, cut | 82 / 82 |
| th | `identity-frame` บุคลิกของแบรนด์ | 91.73 | 80 / 92, cut | 92 / 92 |
| th | `architecture` โครงสร้างแบรนด์ | 90.36 | 80 / 90, cut | 90 / 90 |
| th | the other eight | 7.64 to 68.08 | whole | whole |
| en | `business-core` Business core | 87.33 | 80 / 87, cut | 87 / 87 |
| en | `competitive-frame` Competitive frame | 114.80 | 80 / 115, cut | 115 / 115 |
| en | `identity-frame` Brand personality | 109.69 | 80 / 110, cut | 110 / 110 |
| en | `architecture` Brand architecture | 115.06 | 80 / 115, cut | 115 / 115 |
| en | the other eight | 36.41 to 74.59 | whole | whole |

Light and dark measure the same (zoom 0.3637 in all eight 1440 frames).

**Choices weighed** (all measured on the head with the CSS injected):

- **a. The title holds the line on a narrow label (chosen).** When the label is narrower than 10rem on screen, the kind glyph and the open glyph are not drawn and the title has the whole label: 115.64 px at the fit, every title whole in both languages.
- b. A wider label at low zoom (up to the card plus 120 world px): the English titles of Competitive frame and Brand architecture then run into the gap where their own out edge and Positioning to Name climb, 0 px from an edge (the Thai Brand architecture 0.8 px). Loses: an edge through a title.
- c. The title wraps to a second line: the label grows to 43 px and the Competitive frame and Brand architecture labels sit on the edges Situation to Brand architecture and Positioning to Name (0 px, both languages), the bands that 2.3 records at 9.1 and 5.0 world px. Loses: the edges of 2.3 cross titles.
- d. Shorter titles: a product copy change in two languages, the card would name its node otherwise than the view's title, and the next long title fades again. Loses: not a look change, and it moves the problem.
- e. A different fit or card spacing: the fit is width bound; even with no padding it is 1392 / 3184 = 0.437, a 139 px label and 103 px for the title beside the two glyphs, under the 115 the English titles need; tighter columns move the positions of 2.1 and the clearances of 2.3. Loses alone; it is kept as the margin step, row b below.

**Row a, the change.** `packages/design-system/src/recipes/recipes.css`, the present label:

1. In the `.ds-node__label` rule, after `--_label-gap: var(--ds-space-inline-sm);`, add `container: ds-node-label / inline-size;` (the label sets its own inline and block size, so the containment changes no box: label 115.64 x 23.5 before and after).
2. After the rule `.ds-node__label .ds-node__status > svg { flex: none; }`, add:

```css
/* A label narrower than 10rem on screen (a board zoomed out, under 0.503 for an md card) gives the
 * whole line to the title: the kind glyph and the open glyph are not drawn, so a title as wide as the
 * card stays whole (ORV-298-design-f1). The node keeps its accessible name and its zoom-in cursor. */
@container ds-node-label (width < 10rem) {
  .ds-node__label > svg:first-child,
  .ds-node__label .ds-node__open {
    display: none;
  }
}
```

Why 10rem: at 160 px and wider the title keeps at least 124 px beside the two glyphs, more than the longest title (115.06); under 160 it has the whole label. So the title's room never drops below the smaller of the label and 124 px, at any zoom. No new token, recipe class or prop: the query value is a breakpoint, as the recipes' other container queries are (`ds-table`, `ds-section-header`), and the container name sits inside the existing `ds-node` recipe.

What it leaves as it was (measured):

- The label's box, the card positions of 2.1 and every card box: unchanged. The drawn label stays inside the card: its last part ends at least 1.0 px before the card's end (English Brand architecture, the tightest).
- The edges of 2.3: the nearest edge to each title is as far or farther. Thai: Competitive frame 3.6 to 10.5 px, Brand architecture 2.2 to 6.8 px (the glyph that sat next to the edge is gone). English: 3.6 to 3.8 and 2.2 to 2.2 px. No edge runs under a card or through a title.
- The port pills: not touched; on a focused card they show beside the card as before (sheet `sheet-zoom52-focus.png`).
- The focus ring: on the card, the same line and halo; the focused card's label still turns to the primary ink.
- The title size: 13 px on screen; the scale and the clip (4 px above for a Thai mark) are unchanged.
- At two zoom-in steps from the fit (zoom 0.5237, 52 percent) the label is 166.5 px wide, so both glyphs are drawn on all twelve cards and the frame matches the head (light and dark, Thai and English).
- At 360 (zoom 0.25): the label is 79.5 px. Before, the open glyph already wrapped off and the title had 62 px; now it has 80. Thai: cut titles 5 to 4 (Logo type now whole); English: 6 to 4 (Positioning and Typography now whole); every cut title shows more of its text. `documentElement.scrollWidth` 360. The 360 board is no worse than `develop` on any card.
- Other present boards: the rule applies wherever a present label is under 10rem (an md card under zoom 0.503, an sm card under 0.667); an edit board has no label.

**Row b, the margin step (only if CI shows a cut).** On this Mac Chromium, English Brand architecture has 0.58 px to spare (115.06 in 115.64). A renderer that rounds each glyph advance to a whole pixel would make it 116 (estimated from the per-glyph advances), and CI runs the story tests in Chromium on ubuntu-24.04. If the English clause below fails on CI with `scrollWidth` over `clientWidth` on any title, apply in the same PR: `packages/design-system/src/components/canvas-board/CanvasBoard.tsx`, `firstFit` and the `board.zoom-to-fit` command, `freePadding(0.2)` becomes `freePadding(0.15)` (side padding 90 px instead of 116 at a 1392 board). Measured by writing the transform the fit would write: zoom 0.3807, label 121.05 px, English Brand architecture 115 / 115 with 6 px to spare, every title whole in both languages. The 1440 zoom bound of `BoardAt1440` then reads 0.381 within 0.01 and the PR adds a dated as-built note to 2.4. At 360 nothing changes (the fit stays at the 0.25 floor). Row b is not applied when row a passes on CI.

**Contract and files a builder touches** (no token, no recipe class, no public prop):

- `packages/design-system/src/recipes/recipes.css`: row a.
- `packages/design-system/catalog/application/canvas-node.yaml`, the present-board line (it begins "On a present board (board.readOnly) a node is one card"): after "(ORV-280 D4; story PresentNarrowLabels)" insert "; a label narrower than 10rem on screen (a board zoomed out, under 0.503 for an md card) gives the whole line to the title: the kind glyph and the open glyph are not drawn, the node keeps its accessible name and its zoom-in cursor (ORV-298-design-f1; stories Examples/Application: Business board BoardAt1440 and BoardAt1440English)". A changed catalog entry, named here.
- `packages/design-system/src/examples/business-board.stories.tsx`: the plays below. In `expectBoard`, the clause `expect(el.querySelector(".ds-node__open")).toBeVisible()` becomes `not.toBeNull()`: the title row still ends with the open glyph (ORV-282 spec row 23), and it is drawn once the label is 10rem or wider, which `BoardAt1440` proves at 52 percent; the board in a story frame narrower than 1440 sits at a zoom where the glyph is not drawn.
- The rule changes the leave order the catalog line gives (ORV-280 D4, "parts leave from the end"): under 10rem the kind glyph, first in the row, is not drawn. Swept on the head at the 414 px test window, with each play run first: 119 of the 133 stories that draw a present board have a label under 10rem holding a glyph. The plays that read the glyphs and change with this row: `CanvasNode.stories.tsx` `playNarrowLabels` (`PresentNarrowLabels`, `PresentNarrowLabelsInEnglish`: the shown parts are a prefix of the DOM order once the kind glyph and the open glyph are set aside on a label under 160 px, and a part not drawn has `display` `none` instead of sitting on the wrapped line), `playPresentStates`, `playOpenWithoutCount` and `PresentRecipesAndModes`; `CanvasBoard.stories.tsx` `playOpenNode`, `playLevelsOfDetail` and `PresentRecipesAndModes`. Where such a play asserts `.ds-node__open` `toBeVisible()`, it either zooms the board so the label is at least 160 px first, or asserts the glyph is in the row (`not.toBeNull()`) and, on a label under 160 px, has `display` `none`. The builder runs every story of Application/Canvas board, Canvas node, Canvas edge, Canvas controls, Canvas context menu and Node port, and the Business board, Core idea and Prototype ORIVILO canvas examples.

**Plays and bounds.**

<!-- prettier-ignore -->
| Story | Play clause and bound |
| --- | --- |
| `BoardAt1440` (th) and a new `BoardAt1440English` (`args: { view: ENGLISH_VIEW }`, `decorators: [inEnglish]`, the same play with `en`) | after the fit (zoom 0.364 within 0.01): for every card, its `.ds-node__title` has `scrollWidth <= clientWidth` and no `data-cut`; its label's `> svg:first-child` and `.ds-node__open` have computed `display` `none`; the right of the label's last drawn child is at most the card's right plus 0.5. Then two clicks on zoom in (zoom 0.524 within 0.01): every label is at least 160 px wide, both glyphs are drawn (`display` not `none`) and every title still has `scrollWidth <= clientWidth` |
| `NarrowLight`, `NarrowDark`, `NarrowEnglish` (`narrowPlay`) | at zoom 0.25: every title has `scrollWidth <= clientWidth`, or a `clientWidth` of at least the label's width less 1 (the title holds the whole line: 80 against a 79.5 label, where the head gave 62) |

## 3. The card at rest

`renderBody` for the three nodes is the foundation card body, unchanged (`div.flex.flex-col.gap-2` > `p.text-body-sm.text-text-secondary [data-node-state]` > `ul.flex.flex-col.gap-1.text-body-sm` of field names):

<!-- prettier-ignore -->
| Node | Field names, in order | State line, by `expression-marks-1` |
| --- | --- | --- |
| Colour | `business.field.signature`, `business.field.neutral`, `business.field.canvas`, `business.field.lineup`, `business.field.crowded` | `business.state.waiting`, `.derived`, `.partly`, `.needsAnswer` |
| Typography | `business.field.scripts`, `business.field.readingFace`, `business.field.displayFace` | `business.state.waiting`, `.derived`, `.needsAnswer` |
| Logo type | `business.field.appIcon`, `business.field.logoType` | `business.state.waiting`, `.derived`, `.needsAnswer` |

No mark line, ask line, value, family word, brand name, hex, count or colour shows on a card. The field list is the same in every state, so the card height never changes with the data.

## 4. The view frame and shared parts

The ORV-291 view frame holds unchanged (its design section 4.1 anatomy and 4.2 rows): one column, 282 wide at x 33 at 360 and 672 at 1440, every text block and control starting at x 33 (measured in every state of the mock: one start edge); head to fields 24, field to field 24, heading to content 4, buttons `md` 40 tall and 8 apart, a failure notice 12 under the button row. What this story adds:

### 4.1 Anatomy

```text
div.flex.min-w-0.max-w-[42rem].flex-col.gap-6 [data-node=<id>]       the view
  div.flex.flex-col.gap-2 [data-head]                                  the head
    p.text-body-sm.text-text-secondary role=status [data-node-state]   state line
    div.flex.flex-col.gap-1 [data-marks=provisional] > p, p             strategy.provisional, business.marks.restsOn (primary ink)
    p [data-marks=unchecked]                                            business.marks.unchecked (primary ink)
    p [data-ask]                                                        Colour only: needsPersonality or notDecided (primary ink)
  div.flex.flex-col.gap-6 [data-fields]
    DecisionLine: div.flex.min-w-0.flex-col.gap-1 [data-field=<key>]
      h3.self-start.text-label-md                                       field name (no tabIndex)
      p [data-value]                                                    the value word, body size, primary ink
      p.text-body-sm.text-text-secondary                                each reason, in order
      p.text-body-sm.text-text-secondary [data-rule]                    business.decision.rule
    div.flex.flex-col.gap-1 [data-labels] > p.text-body-sm.text-text-secondary ...   the honesty labels, once
    div.flex.min-w-0.flex-col                                           the controls, only with a control to show
      div.flex.flex-wrap.items-center.gap-2 [data-row]                  Button md
      div role=alert > div.mt-3 > Notice variant=danger live=off         FailureRegion
```

`DecisionLine` and `ByRuleLabel` live in `expression-parts.tsx` (tech section 9). `DecisionLine` takes its reasons as a list: Logo type can show two (section 7). The value word is plain body text in the primary ink, its reasons and its rule line the secondary note: the decision reads first, the why under it. No badge, chip, swatch, icon or colour carries a value.

### 4.2 Where each honesty line sits (`expression-honest-1`)

<!-- prettier-ignore -->
| Line | Where | When |
| --- | --- | --- |
| `business.label.byRule` | first line of `[data-labels]`, once per view | any decision shows |
| `business.decision.rule` | last line of each `DecisionLine` (Colour: each of the three; Typography: once in the decision foot, 6.3; Logo type: under the Logo type value) | with each decision |
| `business.color.hypothesis`, `business.color.familyOnly` | `[data-labels]`, after `byRule` | a colour decision shows |
| `business.color.givenByYou` | last line of the Competitors' main colours field | a lineup shows |
| `business.typography.oneChoice`, `business.typography.noPersonalityLink` | `[data-labels]`, after `byRule` | the families show |
| `business.logoType.hypothesis`, `.crowdingNotChecked`, `.otherTypes` | `[data-labels]`, after `byRule` | a logo type shows |
| `strategy.provisional` with `business.marks.restsOn` | the head, under the state line | `provisionalOn` not empty |
| `business.marks.unchecked` | the head | `unchecked` not empty |

The labels block has no heading: it is the view's footnote to the decisions above it, 24 under the last decision field. Every provisional, unchecked or waiting state says in words what it rests on or waits for (the node names through `Intl.ListFormat`); none is told by colour. No AI label, score, rating or recommended mark exists in any state, and the brand accent marks nothing.

### 4.3 A heading never stands alone

Every field heading in every state has a line under it:

- its decision (value, reasons, rule); or, on Colour's signature, the open line (`waitsForLineup` or `bothCrowded`); or
- when nothing is decided or given, `business.state.empty` as a `p.text-body-sm.text-text-secondary` (ORV-291 4.5, the same fallback Brand architecture uses for a decision not yet made).

Fields that show only with content: Colour's Crowded colour families (only with a lineup); Logo type's Small square mark (not shown when the name is long and no answer is stored, because the question is not asked: section 7.1, L8). The labels block shows only with a decision. A read-only view (no `controls`, the read-only stories) shows the same fields with the same fallbacks and no button row; the control wrapper and the failure region render only when there is a control to show, so no empty wrapper adds a gap.

### 4.4 Focus, primary action and what a screen reader hears

<!-- prettier-ignore -->
| Event | Focus goes to | Screen reader hears |
| --- | --- | --- |
| The view opens | the scroll region (unchanged) | the dialog title, then the region's name (the node title) |
| An opener is pressed (Give competitors' colours) | row 1's Brand name input | "Which brands do customers compare you with...? group", "Brand 1, group", "Brand name, edit text" |
| Save with a client problem | the input or the first radio of the problem (one problem shows) | the control's name, "invalid entry", then the error |
| Save while the call runs | stays on Save (`aria-disabled`, `loading`) | "Saving your choice" |
| The call fails (rate limited, signed out, failed) | stays on Save | the notice text once (the region is the alert) |
| A refusal naming the choice (Typography, Logo type) | the first radio, nothing checked | the question, "radio group", the first option, "not checked", the error |
| Cancel (lineup editor) | Give competitors' colours | its name |
| Save succeeds | the scroll region, scrolled to its top | the new state line (polite status), then the region's name |

The primary action per state is listed in each node's state table; every other control is `secondary` or `ghost`.

### 4.5 Plays shared by the three views

- `expectFitsAt360` in both languages on every `*Narrow` story; `documentElement.scrollWidth` at most 360 (measured on the mock: 360 in every state, 20 rows included).
- One start edge: in each state, the left of the state line, every `h3`, every `[data-labels] p`, every `Field` label and every button row equals x 33 at 360 within 0.5 (measured: 33 in every frame).
- `expectNoGlyphClip` on the Thai state line and on the longest Thai reason of the state, through the scroll region.
- Every element of a view holding Thai text has computed `letter-spacing` `normal` or `0px` (measured: none other).

## 5. Colour (`color`, PR 1)

### 5.1 States of the view

<!-- prettier-ignore -->
| # | State (spec row) | State line | Head lines | Fields, in order | Controls (primary in bold) |
| --- | --- | --- | --- | --- | --- |
| C1 | Waits (`blocked`, row 7 second and third) | "Waits for Brand personality" or "Waits for Positioning" | none | Signature, Greys, Background: `business.state.empty`; Competitors' main colours: `business.state.empty` or the lineup (5.2); Crowded colour families with a lineup | **Give competitors' colours** while no lineup is stored |
| C2 | Asks for the personality (`open`, no decision, row 7 first) | `business.state.needsAnswer` | ask line `business.color.needsPersonality` | Signature: `business.color.waitsForLineup` while no lineup, else `business.state.empty`; Greys, Background: `business.state.empty`; lineup as C1 | **Give competitors' colours** while no lineup |
| C3 | Partly (row 2) | `business.state.partly` | none | Signature: `waitsForLineup`; Greys and Background each a `DecisionLine`; labels; lineup `business.state.empty` | **Give competitors' colours** |
| C4 | Lineup editor, opened | as before | as before | the editor (5.3) with one empty row | **Save these colours**, Cancel |
| C5 | Editor, a problem on save (row 4) | as before | as before | the editor, the first problem's line under its field | as C4 |
| C6 | Editor at 20 rows | as before | as before | 20 rows; `business.color.lineupMax` in the place of Add a brand | as C4 |
| C7 | Editor, saving | as before | as before | the editor, unchanged | Save loading; Cancel, Add a brand and each Remove `aria-disabled` |
| C8 | Editor, the call failed (rate limited) | as before | as before | the editor, every row kept | as C4, the notice 12 under the row |
| C9 | Decided (row 3; row 5 the same frame with `business.color.because.fallback`) | `business.state.derived` | none | three `DecisionLine`s; labels; the lineup with `givenByYou`; Crowded colour families | none |
| C10 | Both candidates crowded (row 6) | `business.state.partly` | none | Signature: `business.color.bothCrowded`; Greys, Background decided; labels; the lineup; crowded | none |
| C11 | Provisional (row 8, positioning skipped), derived or partly | `business.state.derived` or `.partly` | `strategy.provisional`, "Rests on: Positioning" | as C9 or C3 | as C9 or C3 |
| C12 | Unchecked (row 8, positioning stale) | `business.state.derived` | "Not yet checked against: Positioning" | as C9 | none |
| C13 | Not decided (`conflicted` or `invalid`, row 9, unit test only) | `business.state.needsAnswer` | ask line `business.color.notDecided` | as C2 | as C2 |
| C14 | Read-only (no `controls`) | by the data | by the data | as the data state, no button row | none |

The ask line sits in the head, in the primary ink, after the state line: it says what the node needs before it can decide, in words, as a mark line says what a value rests on. `waitsForLineup` and `needsPersonality` can show together (tech 6.1): the first under Signature, the second in the head.

Measured at 360 in Thai: C3 is 659 tall, C9 1129 (Thai fixture lineup, one name of 60 characters), C9 at 1440 932.

### 5.2 A saved lineup as text

```text
div.flex.min-w-0.flex-col.gap-1 [data-field=lineup]
  h3.self-start.text-label-md                          business.field.lineup
  dl.grid.min-w-0.grid-cols-[minmax(0,1fr)_auto].gap-x-4.gap-y-1 [data-lineup]
    div.contents                                        one per entry, in the stored order
      dt.min-w-0.whitespace-pre-wrap > bdi              the name, as stored
      dd.text-body-sm.text-text-secondary > bdi         the hex, as stored (upper case)
  p.text-body-sm.text-text-secondary                    business.color.givenByYou
div.flex.min-w-0.flex-col.gap-1 [data-field=crowded]
  h3.self-start.text-label-md                          business.field.crowded
  p                                                     the family words joined by Intl.ListFormat (conjunction), or business.color.noneCrowded
  p.text-body-sm.text-text-secondary                    business.color.crowdRule
```

The name takes every width the hex leaves and wraps (a 60-character Thai name with no spaces wraps on Thai word breaks: 202 wide at 360, the hex column 64 wide 16 to its right, both ending at the column edge 315). A screen reader hears a description list: each name, then its colour as text. The hex is never a CSS value, never a swatch, never a link, never a title attribute; nothing is drawn from it.

### 5.3 The lineup editor

```text
div.@container.flex.min-w-0.flex-col.gap-6 [data-editor=lineup] role=group aria-labelledby=<q> aria-describedby=<rule>
  div.flex.min-w-0.flex-col.gap-1
    p.text-label-md #q                                     business.question.lineup
    p.text-body-sm.text-text-secondary #rule              business.color.crowdRule
  ol.flex.min-w-0.flex-col.gap-6 [data-rows]
    li                                                     one per row
      div.flex.min-w-0.flex-col.gap-2 role=group aria-labelledby=<row label>
        div.flex.min-h-10.min-w-0.items-center.justify-between.gap-2 [data-row-head]
          p.text-label-md #<row label>                     business.color.row "Brand {n}" (section 14)
          Button variant=ghost size=md iconOnly aria-label=business.color.remove > TrashIcon   (only with 2 or more rows)
        div.grid.min-w-0.grid-cols-1.items-start.gap-3.@[32rem]:grid-cols-2
          Field label=business.color.brandName error=(rowIncomplete | nameRepeated | tooLong | lineupRequired)
            Input size=md autoComplete=off
          Field label=business.color.hex error=(rowIncomplete | hexInvalid)
            Input size=md autoComplete=off spellCheck=false
  div.flex.min-w-0.flex-col [data-add]
    Button variant=secondary iconLeading=PlusIcon          business.color.add, or at 20 rows:
    p.text-body-sm.text-text-secondary role=status        business.color.lineupMax
  div.flex.min-w-0.flex-col
    div.flex.flex-wrap.items-center.gap-2 [data-row]      Save these colours (primary), Cancel (secondary)
    FailureRegion
```

Measured layout:

<!-- prettier-ignore -->
| Part | 360 (282 column) | 1440 (672 column) |
| --- | --- | --- |
| Question and rule | 99 tall in Thai (question 2 lines, rule 2), 123 in English | 52 |
| Row, no error | 204: head 40, 8, name field 72, 12, colour field 72 | 120: head 40, 8, the two fields side by side, 330 wide each, 12 apart (container 672 is over 32rem) |
| Row with an error under the colour | 259 in Thai (error 2 lines, 48), 283 in English (3 lines) | 175 (the colour field 127, the name field keeps its 72; both start at the same top) |
| Between rows | 24 | 24 |
| Rows to Add a brand, Add to the Save row | 24, 24 | 24, 24 |
| 20 rows | rows 4528, editor 4763 | rows 2852, editor 3039 |

Every row has the same shape at every count: the head keeps 40 (`min-h-10`) whether the Remove button shows or not, and the two fields start at the same top in the two-column layout, so an error line under one field never moves the other. Everything fits 282 with no horizontal scroll in both languages (measured `scrollWidth` 360); a long name stays on one line inside its input box, which scrolls its own text (the input's `scrollWidth` 449 against 280 for a 60-character Thai name, the page's 360).

Behaviour:

<!-- prettier-ignore -->
| Event | What shows | Focus | Screen reader |
| --- | --- | --- | --- |
| Give competitors' colours | the editor with one empty row; no Remove (one row) | row 1 Brand name | "Which brands...? group, A colour family counts as crowded...", "Brand 1, group", "Brand name, edit text" |
| Add a brand | a new empty row at the end | its Brand name | "Brand n, group, Brand name, edit text" |
| Add the 20th row | the row; Add a brand is replaced by `lineupMax` (`role=status`) | the new row's Brand name | "Twenty brands at most." once |
| Remove (2 or more rows) | the row goes; the rows renumber | the next row's Brand name, or the previous row's when the last was removed | the focused field's group and name |
| Remove at 20 rows | the row goes; Add a brand comes back | as above | as above |
| Save, a problem | the first problem only, by row 4's order: `lineupRequired` under row 1's Brand name; `rowIncomplete` under the empty field of the first such row; `hexInvalid` under that row's colour; `nameRepeated` under the later row's name; `business.intake.tooLong` with 60 under the name; no call | that field | its group, name, "invalid entry", the line |
| Typing in the field that holds the error | the error goes | stays | |
| Save, valid | Save loading; the call | stays on Save | "Saving your choice" |
| The call fails | the notice; every row and value kept | stays on Save | the notice once |
| A refusal with no problems (a lineup already stored elsewhere) | the page's refusal line in the notice; rows kept | stays on Save | the line once |
| Cancel | the editor closes; nothing saved | Give competitors' colours | its name |
| Escape | the dialog closes; the rows stay in `controls.editor` (tech section 9) | the card | |
| Save succeeds | C9, C10 or C11 by the result | the scroll region, top | the new state line |

Keyboard order: per row, Remove (when shown), Brand name, colour; then Add a brand (absent at 20); Save these colours; Cancel. The row head comes first in the DOM, so Remove precedes the row's fields; it is a `ghost` icon button named with the row's brand name, or the row label when the name is empty ("Remove Brand 2", "ลบ แบรนด์ที่ 2").

The colour field is a text field for `#RRGGBB` with no swatch beside it: a swatch would draw a colour from the person's input. A picker is the owner's choice (section 11, choice 4). No placeholder is the label; the label itself gives the form ("Main colour, as # and six characters").

### 5.4 Plays (PR 1)

<!-- prettier-ignore -->
| States | Story | Play clause and bound |
| --- | --- | --- |
| C3 | `ColorPartly`, `ColorPartlyEnglish` (row 2) | state "Partly worked out by fixed rules"; Signature's only line `waitsForLineup`; Greys `[data-value]` "Warm greys" then its reason then "Rule: color.neutral.warm"; `[data-labels]` holds exactly `byRule`, `hypothesis`, `familyOnly` once each; no `[data-marks]`; one button, `data-variant=primary`; `expectInkClearsAbove(reason, value, 2)` on Greys |
| C4, C9 | `ColorDecided`, `ColorDecidedEnglish` (row 3) | Give: focus on row 1 Brand name, one row, no Remove; enter the stand-in lineup with Add a brand (focus on each new row's name); save: state "Worked out by a fixed rule"; seven `dt bdi` names and seven `dd bdi` hexes in order; `givenByYou` last in the field; crowded "Near black, Orange and Violet" in English; no button; focus on `[role=region]`, its `scrollTop` 0 |
| C5 to C8 | `ColorLineupInvalid`, `ColorLineupInvalidEnglish` (row 4) | each save of row 4 shows exactly one `.ds-field__error`, with row 4's line, and focus on its input; at 20 rows no Add button and `lineupMax` once; rate limited: the notice, the rows kept; double press 1 call; Cancel: focus on Give; `expectSameHeight(save, cancel)`; every row head 40 within 0.5 with and without Remove |
| C9 fallback | `ColorFallback` (row 5) | Cyan with the fallback reason; `expectNoGlyphClip` on the Thai reason |
| C10 | `ColorBothCrowded` (row 6) | Signature's only line `bothCrowded`; no button |
| C1, C2 | `ColorWaits`, `ColorWaitsEnglish` (row 7) | three labelled cases (section 10, F5): first, `[data-ask]` `needsPersonality`, no `[data-labels]`; second and third the waiting line; each with one primary button "Give competitors' colours" |
| C11, C12 | `ColorMarks` (row 8) | labelled cases; `[data-marks=provisional]` two lines 4 apart within 0.5, its left equal to the state line's left; `[data-marks=unchecked]` one line |
| untrusted | `ExpressionUntrustedText` (row 11) | the name as literal text inside `bdi`; no `img` in the view |
| switch | `ColorSwitchToEnglish`, `ColorSwitchToThai` (row 13) | the switch is the catalog `Button` (secondary, sm) inside the padded frame (F4); names and hexes unchanged; no remount; letter spacing as 4.5 |
| C6 at 360 | `ColorNarrow`, `ColorNarrowDark`, `ColorNarrowEnglish` (row 14) | 20 rows of 60 Thai characters: `expectFitsAt360`; Tab order as 5.3; `expectFocusBorderForm` on Save, on a Remove and on an input; `expectNoGlyphClip` on a Thai name row |
| C14 | `ColorPartly` read-only arm | no button row, no `role=alert` wrapper |

---

## Part B: Typography (PR 2)

## 6. Typography (`typography`)

### 6.1 The board at stage 2

Typography joins at (2864, 0) with its one edge from Brand personality (section 2). Plays: section 2.5, PR 2.

### 6.2 States of the view

<!-- prettier-ignore -->
| # | State (spec row) | State line | Head lines | Fields, in order | Controls |
| --- | --- | --- | --- | --- | --- |
| T1 | Asks (`open`, no entry, row 18 before) | `business.state.needsAnswer` | none | the question (6.4) in place of Scripts; Reading text, Headlines: `business.state.empty` | **Save this answer** |
| T2 | No choice on save (row 20) | as T1 | none | as T1, `business.architecture.choiceRequired` under the group | as T1 |
| T3 | Saving | as T1 | none | as T1, the choice kept | Save loading, `aria-disabled` |
| T4 | Call failed (rate limited) | as T1 | none | as T1, the choice kept | as T1, the notice |
| T5 | Server refusal naming `payload.scripts` | as T1 | none | as T2, the choice cleared (nothing checked, so the error never contradicts a checked answer) | as T1 |
| T6 | Decided, Thai and Latin (row 18 after) | `business.state.derived` | none | Scripts: the answer; Reading text: Sarabun then Inter; Headlines: Anuphan then Inter; the decision foot with `pairing` and the rule; labels | none |
| T7 | Decided, Thai only (row 19) | as T6 | none | Sarabun; Anuphan; the foot without `pairing` | none |
| T8 | Decided, Latin only (row 19) | as T6 | none | Inter; Inter; the foot without `pairing` | none |
| T9 | Provisional (row 21 first) | as T6 | `strategy.provisional`, "Rests on: Brand personality" | as T6 | none |
| T10 | Unchecked (row 21 second) | as T6 | "Not yet checked against: Positioning" | as T6 | none |
| T11 | Waits, answered (row 21 third and fourth) | "Waits for Brand personality" or "Waits for Positioning" | none | Scripts: the answer; Reading text, Headlines: `business.state.empty` | none |
| T12 | Waits, not answered | the waiting line | none | as T1 (the question is offered whatever the marks) | **Save this answer** |
| T13 | Read-only | by the data | by the data | Scripts: the answer or `business.state.empty`; the rest by the data | none |

### 6.3 A decided family set

```text
div.flex.min-w-0.flex-col.gap-1 [data-field=readingFace]      and the same for displayFace
  h3.self-start.text-label-md                                  business.field.readingFace
  div.flex.min-w-0.flex-col.gap-3 [data-faces]
    div.flex.min-w-0.flex-col.gap-1 [data-face]                one per family, Thai first
      p [data-value]                                           the family name as written (Sarabun)
      p.text-body-sm.text-text-secondary                       business.typography.style.*
      p.text-body-sm.text-text-secondary                       business.typography.licence with the licence name
      p.text-body-sm.text-text-secondary                       because.reading or because.display (the Thai family only)
div.flex.flex-col.gap-1 [data-decision-foot]                   24 under Headlines
  p.text-body-sm.text-text-secondary                           business.typography.because.pairing (Thai and Latin only)
  p.text-body-sm.text-text-secondary [data-rule]               business.decision.rule with typography-node-1
div.flex.flex-col.gap-1 [data-labels]                          byRule, oneChoice, noPersonalityLink
```

The family names are plain text in the page's font, not a specimen set in the family: a specimen needs a font value per family, which the token contract does not hold (section 11, choice 7). Measured: a Thai face block 134 tall at 360 (four lines), 111 at 1440; T6 963 tall at 360 in Thai, 820 at 1440.

### 6.4 The question

```text
div.flex.min-w-0.flex-col.gap-3 [data-field=scripts]
  Field group label=business.question.scripts error=(choiceRequired)
    RadioGroup size=md (vertical) value={choice ?? ""}
      RadioGroupItem value="thai-latin" label=business.typography.scripts.thaiLatin
      RadioGroupItem value="thai"       label=business.typography.scripts.thai
      RadioGroupItem value="latin"      label=business.typography.scripts.latin
  div.flex.min-w-0.flex-col
    div.flex.flex-wrap.items-center.gap-2 [data-row]   Save this answer (primary)
    FailureRegion
```

Measured: the group 98 tall (three items), the Save row 12 under it, Reading text 24 under the row. Nothing is checked when it shows (0 `[aria-checked=true]`). The question is the group's name, so the Scripts heading is not shown while it is asked; once answered, Scripts shows under its heading with the answer word. Screen reader: "Which scripts will your brand write in?, radio group", then "Thai and Latin, radio button, not checked, 1 of 3".

### 6.5 Plays (PR 2)

<!-- prettier-ignore -->
| States | Story | Play clause and bound |
| --- | --- | --- |
| T1, T6 | `TypographyDecided`, `TypographyDecidedEnglish` (row 18) | before: 0 checked, one button, state "Waits for your answer"; choose Thai and Latin, save: state "Worked out by a fixed rule"; Reading text holds two `[data-face]`, Sarabun first; Headlines Anuphan then Inter; `pairing` once; `[data-labels]` holds `byRule`, `oneChoice`, `noPersonalityLink` once each; no button; focus on `[role=region]` |
| T7, T8 | `TypographyScripts` (row 19) | two labelled cases; Thai only: no "Inter", no `pairing`; Latin only: one face per role, "Inter", no Thai family |
| T2 to T5 | `TypographyInvalid`, `TypographyInvalidEnglish` (row 20) | empty save: the error equals `choiceRequired`, focus on the first radio, 0 calls; rate limited (its own case): the notice, the choice still checked; double press 1 call; refusal (its own case, no notice): nothing checked and the error (F2) |
| T9 to T11 | `TypographyMarks` (row 21) | four labelled cases as row 21; provisional pair 4 apart within 0.5 |
| at 360 | `TypographyNarrow` (row 24) | `expectFitsAt360` in both languages; `expectNoGlyphClip` on "อักษรไทยและอักษรละติน" and on the Thai because lines; `expectFocusBorderForm` on Save and on the first radio |
| switch | `TypographySwitchToEnglish` (row 24) | as `ColorSwitchToEnglish`; the family and licence names unchanged |
| T13 | read-only arm | no button row |

---

## Part C: Logo type (PR 3)

## 7. Logo type (`logo-type`)

The board at stage 3: Logo type joins at (2376, 552) with its two edges, and Name gains its `out` port (section 2). Plays: section 2.5, PR 3.

### 7.1 States of the view

<!-- prettier-ignore -->
| # | State (spec row) | State line | Head lines | Fields, in order | Controls |
| --- | --- | --- | --- | --- | --- |
| L1 | Asks (row 29 before) | `business.state.needsAnswer` | none | the question (7.3) in place of Small square mark; Logo type: `business.state.empty` | **Save this answer** |
| L2 | No choice on save | as L1 | none | as L1, `choiceRequired` under the group | as L1 |
| L3 | Saving | as L1 | none | as L1, the choice kept | Save loading |
| L4 | Call failed | as L1 | none | as L1, the choice kept | as L1, the notice |
| L5 | Server refusal naming `payload.appIcon` | as L1 | none | as L2, nothing checked | as L1 |
| L6 | Wordmark (row 29 after) | `business.state.derived` | none | Small square mark: "No, the name is enough"; Logo type: the value, `because.wordmark`, the name length line, the rule; labels | none |
| L7 | Symbol plus name, app icon (row 30) | as L6 | none | Small square mark: "Yes, it needs one"; Logo type: `symbolPlusName`, `because.appIcon`, the length line, the rule; labels | none |
| L8 | Long name, no answer (row 31) | as L6 | none | no Small square mark field (not asked, nothing stored); Logo type: `symbolPlusName`, `because.longName`, the length line, the rule; labels | none |
| L9 | Long name and "yes" (answered before the name was given) | as L6 | none | Small square mark: the answer; Logo type with `because.longName` then `because.appIcon` | none |
| L10 | Waits, not answered (row 32) | "Waits for Name", "Waits for Brand architecture" or "Waits for Positioning" | none | as L1 | **Save this answer** |
| L11 | Waits, answered | the waiting line | none | Small square mark: the answer; Logo type: `business.state.empty` | none |
| L12 | Provisional (row 33) | as L6 | `strategy.provisional`, "Rests on: Positioning" | as L6 | none |
| L13 | Read-only | by the data | by the data | Small square mark: the answer or `business.state.empty`; Logo type by the data | none |

Unchecked has no state here: W8 shows a derived Logo type cannot carry an unchecked mark under this story's roots, so no fixture can reach it and no story claims it (as ORV-295 sign-off F1 asked for A8).

### 7.2 The decided Logo type

```text
div.flex.min-w-0.flex-col.gap-1 [data-field=logoType]
  h3.self-start.text-label-md                          business.field.logoType
  p [data-value]                                       business.logoType.wordmark or .symbolPlusName
  p.text-body-sm.text-text-secondary                   each reason, in logo-type-1's order
  p.text-body-sm.text-text-secondary [data-name-length]  business.logoType.nameLength, {name} as bdi, {n} and {max} as numbers
  p.text-body-sm.text-text-secondary [data-rule]       business.decision.rule with logo-type-1
div.flex.flex-col.gap-1 [data-labels]                  byRule, logoType.hypothesis, crowdingNotChecked, otherTypes
```

The name in the length line is the stored working name inside `bdi` with `whitespace-pre-wrap` on the line: the person's text, never parsed (row 35). Measured: a 60-character Thai name with no spaces wraps the line to 3 lines (71) at 360 and stays inside the column; L8 436 tall at 360 in Thai, 317 at 1440.

### 7.3 The question

As 6.4 with `business.question.appIcon` and two items, `business.logoType.appIcon.yes` then `.no`. Measured: the Thai question 2 lines at 360 (the group starts 56 under the question's top), the group 62 tall, the Save row 12 under it.

### 7.4 Plays (PR 3)

<!-- prettier-ignore -->
| States | Story | Play clause and bound |
| --- | --- | --- |
| L1, L6 | `LogoTypeWordmark`, `LogoTypeWordmarkEnglish` (row 29) | before: 0 checked, state "Waits for your answer"; choose No, save: Logo type value "Wordmark: the name itself is the logo", its reason, the length line with `bdi` "ORIVILO" and "7", "Rule: logo-type-1"; `[data-labels]` holds the four lines once each; Small square mark shows the answer; no button; focus on `[role=region]` |
| L7 | `LogoTypeSymbol` (row 30) | value `symbolPlusName`, one reason, `because.appIcon` |
| L8 | `LogoTypeLongName` (row 31) | no radio, no button, no `[data-field=appIcon]`; reason `because.longName`; the length line holds "Chase Manhattan Bank" and "18" |
| L2 to L5 | `LogoTypeInvalid` (as `TypographyInvalid`) | the same clauses, one refusal per case |
| L10 | `LogoTypeWaits` (row 32) | three labelled cases, each with the question and one primary button |
| L12 | `LogoTypeMarks` (row 33) | provisional pair as 5.4 |
| untrusted | `ExpressionUntrustedText` (row 35) | the name as literal text in the length line's `bdi`; no `img` |
| at 360 | `LogoTypeNarrow` (row 36) | a 60-character Thai name: `expectFitsAt360`; `expectNoGlyphClip` on the length line; `expectFocusBorderForm` on Save |
| switch | `LogoTypeSwitchToEnglish` (row 36) | as the colour switch; the name unchanged |
| all | `ExpressionNoAi` (row 37) | none of the six AI labels; no text "final", "verified", "tested", "screened", "registered"; no number other than the scale points, the length and 12 |

---

## Common

## 8. Tokens and classes used

Only classes already in the catalog's views and in Tailwind's layout set: `flex`, `flex-col`, `flex-wrap`, `grid`, `grid-cols-1`, `grid-cols-[minmax(0,1fr)_auto]`, `@container`, `@[32rem]:grid-cols-2`, `contents`, `items-center`, `items-start`, `justify-between`, `gap-1`, `gap-2`, `gap-3`, `gap-6`, `gap-x-4`, `gap-y-1`, `min-w-0`, `min-h-10`, `max-w-[42rem]`, `self-start`, `whitespace-pre-wrap`, `mt-3`, `pe-3`; type `text-label-md`, `text-body-sm`; ink `text-text-secondary` (FIELD_NOTE) and the inherited primary. Recipes through components only (`ds-button`, `ds-field`, `ds-control`, `ds-radio`, `ds-dialog`, `ds-alert`). No colour, radius, shadow or font utility; no inline style; no new token.

## 9. DESIGN.md section 9, walked

<!-- prettier-ignore -->
| Anti-pattern | Here |
| --- | --- |
| A template look, filler, decorative graphics | none: text, fields and the catalog controls only; no hero, no illustration, no icon other than Plus and Trash on their buttons |
| Brand accent as selection, error or warning | the accent marks nothing; errors are `Field` errors and the danger notice; selection is the radio's own state |
| A success state without data | the decided states show only what the rules gave, with the rule |
| AI implied | `business.label.byRule` in every view with a decision; no AI label anywhere |
| A colour the person did not give | none: no swatch, no hex other than the person's, never a CSS value |
| Thai with letter spacing or clipped marks | measured: no letter spacing on any element; the Thai lines wrap inside their boxes |
| Two primary actions | one per state (tables 5.1, 6.2, 7.1) |
| A focus ring on glyphs | no heading takes focus; the ring is on controls and the scroll region (section 10, F3) |

## 10. What the PR 234 sign-off asked not to repeat

<!-- prettier-ignore -->
| Finding | In these views |
| --- | --- |
| F1, dated as-built notes and unreachable states | the board numbers above are the mock's; a builder who measures otherwise adds a dated note here in the same PR; Logo type's unchecked state is named unreachable and has no story (7.1) |
| F2, a refusal fixture mixing messages | one refusal per story case: a field refusal clears the choice and shows no notice; a failed call keeps the choice and shows only the notice |
| F3, the ring on a focused Thai heading | after a save focus goes to the scroll region; no `h3` has `tabIndex` |
| F4, a bare language switch | the switch stories use the catalog `Button` (secondary, sm) inside the padded frame |
| F5, stacked views with nothing between | every story that stacks cases gives each a labelled case frame or the view's title |
| F6, a stories file named for one node | the new stories live in `expression.stories.tsx` titled "Examples/Application: Brand expression" |

## 11. Owner's choices (defaults this design uses)

1. **Brand personality's place.** Default: it moves to (1400, -340) in PR 1, so the expression lane runs above Core idea (2.1). Options: (b) keep it at (1400, 160) and move Core idea's planned place (ORV-296, not built on screen), with Colour at (2864, 592): it then passes 5.0 world px from Name's title band; (c) a second board for expression (spec open question 6 (b)).
2. **The three card positions** of 2.1: Colour (2376, -330), Logo type (2376, 552), Typography (2864, 0).
3. **The row label** `business.color.row` ("Brand {n}"), which also names Remove on a row with no name (section 14).
4. **A colour picker beside the hex field.** Default: none, the text field only (lineup-input-1); a picker would draw a swatch from the person's input.
5. **Focus after a save** goes to the scroll region, not to a heading, in these three views. ORV-291's four views keep focusing their heading until the shared F3 follow-up decides.
6. **Remove on the only row** is not offered; Cancel closes the editor.
7. **Family names as plain text**, no specimen (needs a font token per family).
8. **The Small square mark field** is not shown when the name is long and nothing is stored. Option: a line saying why it is not asked, which needs a new string.

## 12. Seen on the mock, not changed here

- At 0.364 the card bodies on the board are texture; only the titles read. Shared with every large board; a level-of-detail rule is ORV-280's.
- `business.competitors.coloursNotRead` ("Competitors' colours are not part of this step.") on the Competitive frame view contradicts a stored lineup; the spec lists it for downstream review.
- At 360 the board cuts partly visible cards (ORV-291 2.3 correction); unchanged.

## 13. Impact

- `business-graph.ts`: `BUSINESS_POSITIONS["identity-frame"]` y 160 to -340 (PR 1); three new positions; `INPUT_ORDER` gains `color` (PR 1) and `logo-type` (PR 3).
- `business-board.stories.tsx` and `foundation.stories.tsx`: every assert of Brand personality's position, the node and edge counts, and the fit zooms (0.524 to 0.430 in PR 1, 0.364 in PR 2).
- ORV-296's board: Core idea keeps (1888, 212); its edge from Brand personality now arrives from above (2.3). Its design reading of "Core idea to the right of Brand personality" holds.
- No shared component, token or recipe changes.
- From ORV-298-design-f1 (section 2.6): the present label of `ds-node` in `recipes.css` gains a container and one container query, and the `canvas-node.yaml` present-board line says so; no token, class or prop. Row b, only if CI shows a cut, changes the fit padding of `CanvasBoard` from 0.2 to 0.15 on every board.

## 14. Strings

Every string is a key of the spec, except one this design asks product for:

<!-- prettier-ignore -->
| Key | English | Thai | Used |
| --- | --- | --- | --- |
| `business.color.row` | Brand {n} | แบรนด์ที่ {n} | the label of each row in the lineup editor, and `{name}` in `business.color.remove` when the row's name is empty |

Reused unchanged: `business.state.empty`, `.waiting`, `.derived`, `business.marks.restsOn`, `.unchecked`, `strategy.provisional`, `business.architecture.save`, `.choiceRequired`, `business.positioning.saving`, `.cancel`, `business.intake.tooLong`, and `saved.errors.*` from the page.

## 15. Rendered proof (mock)

A labelled mock page ("MOCK: ORV-298 design proof (not product UI)", every sheet headed "MOCK, not product UI") composed from the catalog components of `origin/develop` 6aea3cf with fixture text. 43 contact sheets, one per state, each holding eight frames (360 and 1440, Thai and English, light and dark), in `.orivilo/runs/ORV-298/ORV-298-design-1/screenshots/`. Measured on all 344 frames: `documentElement.scrollWidth` equal to the window width, no element with letter spacing, every view line and label starting at x 33 (and the second field column at x 375 at 1440), every button 40 tall (radios 20). The only boxes wider than their content are the inputs holding a 60-character name (the input scrolls its own text) and the loading button's visually hidden label.

<!-- prettier-ignore -->
| Design state | Sheet |
| --- | --- |
| Board, each PR head, without and with Core idea | `board_pr_1_core_0`, `board_pr_1_core_1`, `board_pr_2_core_0`, `board_pr_2_core_1`, `board_pr_3_core_0`, `board_pr_3_core_1` |
| C1 to C12 | `c1-waits`, `c2-asks`, `c3-partly`, `c4-editor-one`, `c5-editor-error`, `c6-editor-twenty`, `c7-editor-pending`, `c8-editor-limited`, `c9-decided`, `c10-both-crowded`, `c11-provisional`, `c12-unchecked` |
| C13 not decided, C14 read-only | `c14-not-decided`, `c13-readonly` |
| T1 to T4 | `t1-ask`, `t2-required`, `t3-pending`, `t4-limited` (T5 shows as `t2-required`) |
| T6 to T9 | `t5-decided`, `t6-thai`, `t7-latin`, `t8-provisional` (T10 has the same frame with the unchecked line, as C12) |
| T11, T12, T13 | `t9-waits-answered`, `t10-waits-ask`, `t11-readonly` |
| L1 to L4 | `l1-ask`, `l2-required`, `l3-pending`, `l4-limited` (L5 shows as `l2-required`) |
| L6 to L9 | `l5-wordmark`, `l6-symbol`, `l7-long`, `l12-long-and-yes` |
| L10, L11, L12, L13 | `l8-waits-ask`, `l10-waits-answered`, `l9-provisional`, `l11-readonly` |

The board frames use fixture state lines and field names.

## 16. Screens for visual QA

- Board at each PR head, with and without Core idea, 1440 and 360.
- Card titles at the 1440 fit (2.6): every title whole, no kind or open glyph; at 52 percent both glyphs back on every card; a focused card at the fit; the 360 board against `develop`.
- Colour: C3, C5, C6 (20 rows, Thai, 360), C9, C10, C11.
- Typography: T1, T2, T6, T9.
- Logo type: L1, L6, L8 (60-character Thai name, 360), L12.
- Each in Thai and English, light and dark; focus shown on Save, a Remove, a radio and the scroll region after a save.

## Changelog

- 2026-11-20, ORV-298-design-1: first version.
- 2026-11-20, ORV-298-design-f1: section 2.6, card titles at the overview fit, answering finding F1 of the visual sign-off ORV-298-signoff-1 (the title holds the line on a label under 10rem; a fit padding margin step only if CI shows a cut); impact and visual QA lines added.
