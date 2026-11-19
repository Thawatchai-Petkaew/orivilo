# ORV-280 design: the second polish PR (PR B), one row per look item

Designer task `ORV-280-design-b`, 2026-11-18, for spec v1.2 (`docs/specs/ORV-280/spec.md`, rule `look-row-1`). This file gives every PR B look item its measure (a pixel value, a token, a type step or a tolerance), the selector it applies to, the CSS or story change that reaches it, and the screenshots that prove it. It is written before any PR B builder runs. The builder builds from these rows; the plays assert these measures through `packages/design-system/src/testing/visual-asserts.ts` where a helper fits.

## 1. Method and the screens behind every row

- **Source of the render.** A static Storybook build of `develop` at 6a75c16, served on port 6190 only for this task. Every "now" screenshot is that build as it is. Every "proposed" screenshot is the same story with the row's CSS injected at render time (`page.addStyleTag`), or with the row's fixture or story change swapped into the served chunk (`page.route`), or with the row's DOM order applied by script (C1, S3). No component, style, story, token or string file changed.
- **The matrix.** Each row renders Thai and English, light and dark, at the narrowest and the widest window the story allows (360 and 1440 unless the row names more widths, such as 479, 599, 768 or 1024), with `prefers-reduced-motion: reduce`. A row whose content can reach more than one line count is checked at each count it can reach (B2, B3, D4).
- **Where the screenshots are.** `/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO/.orivilo/runs/ORV-280/ORV-280-design-b/screenshots/` holds every PNG (`<job>__<now|proposed>__<locale>-<mode>-<width>.png`) and each job's measures (`<job>.measure.json`). The contact sheets are in its `sheets/` folder; each row names its sheets. On a sheet, the rows are now and then proposed, Thai and then English, and the columns are the light and dark tiles at each width.
- **Tokens.** Every measure is a semantic token or a type step of `DESIGN.md`: `space.inline-sm` 4, `space.inline-md` 8, `space.inset-sm` 8, `space.inset-md` 16, `space.inset-lg` 24, `space.stack-sm` 8, `space.grid-gap` 24, `shape.container-radius`, `surface.sunken`, `text.secondary`, `border.subtle`, the type steps `label-sm`, `label-md`, `heading-sm`, `display-md`. No per-page hex, radius or font value. Brand accent replaces no error, warning or selection colour. Focus keeps its own shape (a line with a halo, `--_focus-*`).
- **Pixel kinds.** "Screen px" is measured on the page; "world px" is the board's own unit (screen px divided by the zoom).

## 2. Rows, in the spec's order

### Row 10, B15: the "View only" badge clear of every card and dot (`NodePort` `PresentRecipesAndModes`)

- **Measured now.** At 1440 each cell's board is 662 x 300; the badge keeps 85.4 px (Professional), 75.5 px and more to every card, and 79.8 px and more to every port dot; zoom 0.808 to 0.87. At 360 the board is 294 x 300 and the fit zoom drops to 0.454 to 0.524: the badge overlaps the card by 33.3 px and the dot by 18.8 to 24.9 px in every cell (Thai and English, light and dark). No status pill shows at rest in any cell (0 found).
- **Decision.** The story, not the board component, gives the board room under its badge: a cell narrower than 554 px renders its board 540 px tall. The board then fits its nodes at zoom 0.762, below the badge.
- **Change (story).** In `NodePort.stories.tsx`, `PresentRecipesAndModes`: each cell is an inline-size container; its board wrapper is 300 px tall from 554 px up and 540 px below. Proved with:

  ```css
  [data-matrix-cell]:has(.ds-board__mode) {
    container-type: inline-size;
  }
  @container (width < 554px) {
    [data-matrix-cell] > div:has(.ds-board) {
      height: 540px;
    }
  }
  ```

- **Measure for the play.** In every cell at 360 and at 1440: badge rect to every `.ds-node` and `.ds-port__handle` rect, gap 0 or more (proposed: 124.8 px to the card and 143.1 px to the dot at 360; unchanged 75.5 px and more at 1440); no `[role=status]` pill with text at rest.
- **Seen.** At 360 the badge sits alone in the top right corner and the Professional card starts well under it, whole, with its dots; at 1440 nothing moves. Thai "ดูอย่างเดียว" and English "View only" both clear. Light and dark alike.
- **Sheet.** `sheets/r10-b15.sheet.png`.
- **Corrected 2026-11-19 (`ORV-290-design-2`, built by `ORV-290-b2-stories-page` at 7b45e65).**
  - _Where the container sits._ The story cannot put a container on the `Matrix` cell, so the container is the board's own wrapper in the story's `PortBoard` (`NodePort.stories.tsx`, `PortBoard` with `roomBelow`, lines 85 to 123: an `@container` div around the board, whose wrapper takes `h-(--board-height) @max-[554px]:h-(--room)`, with `roomBelow={540}` in `PresentRecipesAndModes`). The wrapper and the cell share one content box width, so the 554 bound and the 540 height are the ones above; the `[data-matrix-cell]` selectors of the CSS block are not used.
  - _What the play reads._ In the window the story opens in, every `[role=status]` text is empty and the badge clears every card and dot (`expectBoardChromeClear(cell)`). Then in a 360 and a 1440 window each board is fitted again by its own key (Shift+1, padding 0.2, because the board fits only on mount) and the badge alone is read (`expectBoardChromeClear(cell, 0, ".ds-board__mode")`), not the status line that key raises (see "Open points of ORV-290 builder B2" in section 4, point 1).
  - _Measured at 7b45e65_ (B2's Playwright probe on the dev Storybook, device scale 4, the first fit): 360, boards 294 x 540 at zoom 0.7625, badge to card 112.7 to 131.9 px, to dot 137.1 to 144.1 px (proposed above: 124.8 and 143.1); 1024, boards 454 x 540, 48.5 to 86.4 and 86.3 to 105.3 px; 1440, boards 662 x 300, 75.4 to 94.0 and 69.3 to 88.7 px. Every gap in all six cells is above 0.
  - _Statements corrected._ "Measured now" above describes `develop` at 6a75c16 before the change: its "294 x 300" and "0.454 to 0.524" are the old 300 px board at 360, not the built one. The built 360 board is 294 x 540 at 0.7625, which is the Decision's 0.762. Its "79.8 px and more to every port dot" at 1440 is replaced by 69.3 px, B2's read, which agrees with the 69 px sign-off ORV-280-signoff-1 measured on `develop` (spec v1.2, item B15). Both stay above 0.
- **Changed 2026-11-19 (`ORV-290-design-3`): the status line a fit key raises, clear of every card and dot.** Answers point 1 of "Open points of ORV-290 builder B2" (section 4). The 540 under 554 values above are replaced by 720 under 720; the route stays the story height route of decision B15, and the board component is unchanged.
  - _Measured at 7b45e65_ (this task, Playwright on this worktree's dev Storybook, after the story's own play, which presses each board's fit key, Shift+1). The status line sits 16 px (`space.inset-md`) above the toolbar and is 41.8 px tall, so its top is 57.8 px above the toolbar's top. The fit keeps the card only `floor(H / 12)` px above the toolbar (xyflow's 0.2 padding; `freePadding` adds the toolbar, not the line), 45 px on a 540 board and 25 px on a 300 board. So: at 360 (boards 294 x 540, zoom 0.7625, toolbar 122 px tall in three rows) the line overlaps the card by 6.1 to 11.3 px in every cell, Thai and English; at 1440 (boards 662 x 300, zoom 0.754 to 0.870) the card is centred across, and the English line "Fitted 1 node to the view" (194.7 px wide, its right edge 211.7 px from the board's left) overlaps the card by 1.4 to 19.9 px and the dots by 6.6 to 17.4 px; the Thai line "พอดีจอ 1 โหนด" (121.6 px) clears them by 53.2 and 47.1 px. Point 1 named only 360; 1440 in English fails too.
  - _Decision._ A board narrower than 720 px is 720 px tall; from 720 px up it stays 300 px. Two facts set the numbers. (1) On a 720 board the fit's own padding is `floor(720 / 12)` = 60 px, more than the 57.8 px the line stands above the toolbar, so the fitted card always ends at least 2.2 px above the line, at every width, profile and locale; where the card is fitted by width, as at every width under 720, it is centred and the gap is larger. (2) On a 300 board the card is fitted by height and centred across, and it clears the English line sideways only from a board of 714 px (Professional, the widest card, 278.5 px plus a 6 px dot); 720 keeps 3 px. Both locales keep one line: the line wraps only on a board under 227 px (32 px of insets plus 194.7), and the narrowest board is 294.
  - _Change (story only)._ In `packages/design-system/src/components/node-port/NodePort.stories.tsx`: in `PortBoard`, the wrapper class `h-(--board-height) @max-[554px]:h-(--room)` becomes `h-(--board-height) @max-[720px]:h-(--room)`, and its doc comment says 720 for 554; in `PresentRecipesAndModes`, `roomBelow={540}` becomes `roomBelow={720}`. In its play, after `refit(board)` in the 360 and 1440 loop, `await expect(expectBoardChromeClear(cell, 0, ".ds-board__mode")).toBe(1)` becomes `await expect(expectBoardChromeClear(cell)).toBe(2)`: the default chrome reads the badge and the status line, and 2 proves the line holds its text, so the check is never empty; the comment above the loop says the status line is read after the fit too. Nothing else changes: no component, recipe, token, locale key or prop. The at rest reads stay as they are.
  - _Measure for the play._ In every cell, at 360 and at 1440, after the board's own fit key: the badge rect and the status line rect (`.ds-board__mode` and `[role=status]` with text) each keep a gap of 0 or more to every `.ds-node` and `.ds-port__handle` rect, 2 rects read per cell. Red on today's story: at 360 the status line is -11.3 px from the Friendly card (Thai, as Vitest runs, and English).
  - _Proved with_ (injected before the story mounts, by `page.addInitScript`; the story's own play then ran unchanged):

    ```css
    @container (width < 720px) {
      .\@container > div:has(> .ds-board) {
        height: 720px !important;
      }
    }
    ```

  - _Measured with the change_ (after the play's fit key, all six cells, both global modes alike, since each cell sets its own mode). 360: boards 294 x 720, zoom 0.7625 (unchanged); status line to card 71.7 to 83.9 px, to dot 96.1 px; badge to card 209.7 to 221.9 px, to dot 234.1 px. 1440: boards 662 x 720, zoom 1.7188 (was 0.754 to 0.870); status line to card 29.0 to 56.5 px, to dot 84.0 px; badge to card 95.0 to 122.5 px, to dot 150.0 px. Sweep in English (the longer line) over windows 360, 400, 440, 480, 500, 520, 553, 600, 619, 700, 760, 785, 786, 790, 820, 1023, 1024, 1100, 1280 and 1440: every gap above 0; the least are at 786, the first 720 board that stays 300 tall, status line to card 9.1 px and to dot 3.0 px, and at 785 (719 x 720) 10.6 px to the card. 0 console errors.
  - _Built measures this changes._ Row 10's "the 294 x 540 board at 360" becomes 294 x 720 (zoom 0.7625 unchanged). At 1440 the board becomes 662 x 720 at zoom 1.7188, not 662 x 300 at 0.754 to 0.870. The badge measure holds with more room: 209.7 px to the card and 234.1 px to the dot at 360 (was 112.7 and 137.1), 95.0 and 150.0 px at 1440 (was 75.4 and 69.3).
  - _Seen._ At 360 the card sits mid board with the badge far above it, and "Fitted 1 node to the view" / "พอดีจอ 1 โหนด" stands on its own between the card's foot and the toolbar, 70 px or more of board around it; Thai marks whole. At 1440 the six boards are tall and the card is drawn at 172 percent, a large card in each cell; the line sits alone above the toolbar, 29 px or more under the card. Light and dark cells alike. The cost: the story is taller, 4825 px at 360 (was 3745) and 2421 px at 1440 (was 1161), and the card at 1440 reads as a zoomed in preview. Outside this row and unchanged: at 360 the three row toolbar covers the top of the "React Flow" attribution in the bottom right corner (follow-up D17, section 4).
  - _Screenshots_ in `/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO/.orivilo/runs/ORV-290/ORV-290-design-3/screenshots/`: the whole story after the play, `proposed__<th|en>-<light|dark>-<360|1440>.png` (8) and `now__<th|en>-light-<360|1440>.png` (4); the six cells side by side, `sheets/proposed__<th|en>-<light|dark>-<360|1440>.sheet.png` (8) and `sheets/now__<th|en>-light-<360|1440>.sheet.png` (4).

### Row 19, C1: the centre dock is the first Tab stop

- **Measured now.** From the page start, the first Tab stop is the board section (`SECTION.ds-board`, "กระดานธุรกิจ" / "Business board", "กระดาน ORIVILO จากโจทย์ถึงผลิตภัณฑ์" / "ORIVILO board, from brief to product"); the edges and nodes follow; the dock comes last. At 360 the board's focus ring is out of the first screen.
- **Decision.** For `CanvasControls position="center"` the dock panel comes first in the board's DOM order, so Tab reaches the dock's buttons in their visual order, then the board region, its edges and nodes. The focus look stays the button focus recipe: a 1 px line with a 3 px halo (`--_focus-*`), plus the button's tooltip.
- **Change (component).** `CanvasBoard` renders the centre dock's `Panel` before the flow's other children. No CSS can move Tab order; the screenshots apply the order by script (the dock panel moved to the flow's first child).
- **Measure for the play.** First Tab stop is inside `.ds-controls`: "ซูมออก" / "Zoom out" on the business board at 1440, "ซูมให้เห็นทั้งกระดาน" / "Zoom to fit" at 360 (where the zoom-out button is folded), "ภาพรวม" / "Overview" on the prototype page; its box-shadow is the focus halo (`0 0 0 3px` of the focus colour), and it is in the window.
- **Seen.** The focused first dock button shows the line and halo and its tooltip above the dock, in the first screen at 360 and 1440, Thai and English, light and dark.
- **Sheet.** `sheets/r19-c1.sheet.png`.

### Row 20, D1: an edge pill is drawn only where it is whole and clear

- **Measured now.** `KindsAndZoom` present board at fit: at 1440 (zoom 0.483) all 18 edge pills show and 6 (Thai) to 12 (English) of them meet a card, a title line or a port dot, worst overlap 19.9 to 25.2 screen px; at 360 (zoom 0.25) 7 (Thai) or 11 (English) show and overlap by up to 17.7 px.
- **Decision (the rule).** A pill is drawn only where it is whole and clear by `space.inline-sm` (4 screen px) of every card, title line, port dot and every pill already kept. Order of keeping: (1) the port and source pills of the pointed node (hover or focus), (2) edge pills that carry a state (stale, missing), (3) meaning-only edge pills, (4) any other shown port pill. A pill that fails is hidden (`visibility: hidden`, it stays in the accessible name of its edge); the edge keeps its kind colour and dash.
- **Change (component).** A layout pass in `CanvasBoard` (present variant) after each viewport change: reads pill and solid rects, applies the order above, sets `data-hidden` on the pills that fail; CSS `.ds-edge__label[data-hidden], .ds-port__label[data-hidden] { visibility: hidden; }`.
- **Measure for the play.** `expectPillsClear` with 4 px: no drawn pill within 4 px of a solid or of another drawn pill. Proposed: 1440, 16 (Thai) or 11 (English) pills drawn, worst clearance 13.1 / 6.9 px, 0 failures; 360, 0 pills drawn, 0 failures.
- **Seen.** At 1440 the pills that remain sit whole in the corridors between cards; the ones that would sit on a card are gone, and their edges still read by colour and dash. At 360 the board at fit shows only lines, no word on any edge: tidy, but the meaning words are gone at that zoom (needs decision D1, section 4).
- **Sheets.** `sheets/r20-d1.sheet.png` (now and proposed), `sheets/r20-d1-now.sheet.png`.
- **Corrected 2026-11-19 (`ORV-290-design-2`, built by `ORV-290-b1-canvas` at 92a42c1).** The rule as built in `packages/design-system/src/components/canvas-board/pill-layout.ts` (`hiddenPills`, `pillTier`, `layoutPills`, `usePillLayout`), run by `CanvasBoard` on a present board only (`usePillLayout(wrapper, readOnly)`, `readOnly` is `variant === "present"`):
  - Only edge pills keep the 4 px from solids (`.ds-node`, `.ds-node__label`, `.ds-port__handle`). Port name and source pills keep it from every pill already kept, not from solids: a port pill sits beside its own card and dot, so a solids test would hide every one. The decision's "clear of every card, title line, port dot" holds for edge pills.
  - A tier 1 pill (a pill of the pointed node) is always kept, never tested. "Pointed" is the node under `:hover` or `:focus-visible`; a selected node that is not pointed is tier 4, as row 21 decides.
  - The clearance is the number 4 (`CLEARANCE`, the value of `space.inline-sm`), not read from the token at run time. The pass reruns in the next frame after a style or class change in the board (a zoom, a pan, a selection), a pointer or focus move, a resize or a font load, and takes its marks off when it stops.
  - The CSS rule is `.ds-board[data-variant="present"]` before each of the three pill selectors (`recipes.css` lines 3014 to 3018); the port pill's selector outweighs the rule that shows it on hover, selection and focus.
  - `expectPillsClear` takes the clearance as its second argument (default 4) and also measures port name and source pills against solids and every other drawn pill.

### Row 21, D2: a shown pill covers no other pill

- **Measured now.** `ChainHighlight` with node b selected, at 1440: b's port pills meet the edge pills, "ป้อนเข้า / ข้อความ" overlap 2.6 px, "reference / ข้อความ" overlap 11.1 px. `PresentNames` with p1 hovered: "ข้อความ / ข้อความ" overlap 32.8 px at 1440, "image / image" 15.9 px.
- **Decision.** Row 20's order decides who yields: a pointed node's names win; a selected but not pointed node's port names yield to edge pills; pills of one node never hide each other (they are its own rows).
- **Measure for the play.** `expectPillsClear` also measures shown `.ds-port__label` and `.ds-node__source`: 0 overlaps between pills of different nodes or between a pill and an edge pill. Proposed: `ChainHighlight` 4 edge pills, 0 port pills, worst clearance 45.2 (English) / 61.1 (Thai) px; `PresentNames` at 1440 7 pills, worst 9.8 px, 0 failures. At 360 (zoom 0.31) the two rows of p1 sit 2.4 px apart, one node's own rows, not an overlap.
- **Seen.** The chain reads cleanly: the edge words stay, the selected node shows its ring, its port names come back on hover. In `PresentNames` the hovered node's names show whole and its neighbour's name pill that sat under them is gone.
- **Sheet.** `sheets/r21-d2.sheet.png`.

### Row 22, D3: the stale pill drawn over the group frame (`NodeGroup` `Grouped`)

- **Measured now.** The group node draws above the edge layer (`z-index` 0 against the edge layer), so the part of each edge pill inside the group's bounds sits under the group surface: "ป้อนเข้า, ล้าสมัย" / "input, stale" overlaps the frame by 13 / 5.2 px at 1440 and is cut at its left; "input" at the group's lower edge is cut the same way.
- **Decision.** The group node sits under the edges: `z-index: -1` on `.react-flow__node-group` (the group frame is a ground, not a card).
- **Change (CSS).** `.ds-board .react-flow__node-group { z-index: -1; }` (React Flow writes the node's z-index inline; the component sets the group node's `zIndex: -1` in its node data instead of CSS `!important`).
- **Measure for the play.** Computed `z-index` of `.react-flow__node-group` is `-1`; the centre and both ends of every edge pill hit the pill itself (`elementFromPoint`).
- **Seen.** The stale pill "ป้อนเข้า, ล้าสมัย" and "input, stale" read whole over the group's edge, in light and dark, Thai and English; the cards inside the group still draw above the edges.
- **Sheet.** `sheets/r22-d3.sheet.png`.
- **Corrected 2026-11-19 (`ORV-290-design-2`, built by `ORV-290-b1-canvas`).** `CanvasBoard.tsx` line 435 gives a group node `zIndex: -1` only when its record sets no `zIndex` of its own; a record that sets one keeps it. No CSS `z-index` rule was added.

### Row 23, D4: no empty gap after a cut Thai title (`PresentNarrowLabels`)

- **Measured now.** A long title "บริษัทพั..." ends in an ellipsis followed by an empty run before the next part ("ตามกฎ", "By rules") at every zoom of the story; the ellipsis plus the gap reads as a hole in the label line.
- **Decision.** No ellipsis on a node title. A cut title fades out over its last 2em and keeps `space.inline-sm` (4) before the next part.
- **Change (CSS plus one attribute).**

  ```css
  .ds-node__label .ds-node__title {
    text-overflow: clip;
  }
  .ds-node__label .ds-node__title[data-cut] {
    margin-inline-end: var(--ds-space-inline-sm);
    mask-image: linear-gradient(to right, currentColor calc(100% - 2em), transparent);
  }
  ```

  The node sets `data-cut` when `scrollWidth > clientWidth + 0.5` (a `ResizeObserver` on the title).

- **Measure for the play.** On a cut title: `text-overflow` is `clip`, the gap from the title's right to the next shown part is 4 px within 0.5 px.
- **Seen.** "บริษัทพัฒ" and "Anuphan-and" fade into the next part with a short even space; Thai upper and lower marks stay whole. At every zoom and both modes.
- **Sheet.** `sheets/r23-d4.sheet.png`.
- **Corrected 2026-11-19 (`ORV-290-design-2`, built by `ORV-290-b1-canvas`).**
  - The title's own `margin-inline-end: var(--ds-space-inline-sm)` is not built: with the label's own 4 px flex gap it measured 8 px between a cut title and the next part. The 4 px is the label's gap alone (`recipes.css` lines 2907 to 2923: `text-overflow: clip` on `.ds-node__label .ds-node__title`, and only the `mask-image` on `[data-cut]`). The play's 4 within 0.5 px holds.
  - `CanvasNode.tsx` sets `data-cut` when `scrollWidth > clientWidth`, with no 0.5 slack (both are whole numbers), and measures again on a `ResizeObserver` and on the font set's `loadingdone` event (a font load does not change the title's box, so the observer alone cannot see it).
  - The ellipsis assertion in `CanvasNode.stories.tsx` (near line 787) now asserts `clip`.

### Row 24, D5, B10, B17: the dock at 360

**D5, the chapter strip shows it scrolls.**

- **Now.** At 360 the strip cuts a chapter chip at the end with a hard edge; nothing says more chips follow.
- **Change (CSS).** A scroll hint mask, `space.inset-md` (16) wide, at each end that has more to scroll:

  ```css
  @property --_fade-s {
    syntax: "<length>";
    inherits: false;
    initial-value: 0px;
  }
  @property --_fade-e {
    syntax: "<length>";
    inherits: false;
    initial-value: 0px;
  }
  @keyframes ds-strip-fade {
    0% {
      --_fade-s: 0px;
      --_fade-e: var(--ds-space-inset-md);
    }
    2%,
    98% {
      --_fade-s: var(--ds-space-inset-md);
      --_fade-e: var(--ds-space-inset-md);
    }
    100% {
      --_fade-s: var(--ds-space-inset-md);
      --_fade-e: 0px;
    }
  }
  .ds-controls__children {
    mask-image: linear-gradient(
      to right,
      transparent,
      currentColor var(--_fade-s),
      currentColor calc(100% - var(--_fade-e)),
      transparent
    );
  }
  @supports (animation-timeline: scroll()) {
    .ds-controls__children {
      animation: ds-strip-fade linear both;
      animation-timeline: scroll(self inline);
    }
  }
  ```

  Under reduced motion the mask still tracks the scroll (it is driven by scroll position, not by time).

- **Seen.** At the start the last chip fades out at the right; in the middle both ends fade; at the end only the left fades. Thai and English, light and dark.

**B10, the person can see the board is view only.**

- **Now.** Under 480 the dock hides the "View only" word (`.ds-controls__mode` is visually hidden); a dock without chapters shows only the fit button.
- **Change (CSS, under `@media (width < 480px)` on `.ds-controls[data-position="center"]`).** `.ds-controls__mode` shows (static position, `padding-inline: var(--ds-space-inline-md)`) with its divider; a dock without `.ds-controls__children` takes `inline-size: auto` and keeps zoom out, the zoom readout and zoom in; `.ds-controls__zoom` gets `white-space: nowrap`.
- **Measure.** The word box is 77 x 20 (English "View only") and 78 x 20 (Thai "ดูอย่างเดียว"); it stays in the accessible tree; the dock fits inside the board with `space.inset-sm` at each side at 360.

**B17, the React Flow attribution clear of the dock.**

- **Now.** At 360 the attribution sits bottom right and overlaps the dock by 18.1 px on the business board and 10.1 px on the narrow board; its letters show through the dock's glass.
- **Change (CSS).** `.ds-board:has(.ds-controls[data-position="center"]) .react-flow__attribution { top: 0; bottom: auto; }`
- **Measure for the play.** At 360 and 480 the attribution rect intersects no `.ds-controls` rect and no `.ds-board__status` rect.
- **Contract change.** This moves the 360 rule of `canvas-controls.yaml` line 21 and `docs/specs/ORV-274/spec.md` row 12 (the dock under 480 keeps the mode word and its zoom trio); both get a line in the same PR.
- **Seen.** The attribution sits small at the board's top right, away from cards; the dock reads "ดูอย่างเดียว | − 100% +" / "View only | − 100% +" whole on one line.
- **Sheets.** `sheets/r24-dock.sheet.png`, `sheets/r24-dock-band.sheet.png`, `sheets/r24-attr-top.sheet.png`.

### Row 25, D5: the focused edge, and the stage corners

**A focused edge shows the focus shape, never the selected look.**

- **Now.** A focused edge takes the selected stroke (the `:focus-visible` branch of the selected rule) and a box outline around the edge's whole bounding box, so focus reads as selection plus a stray rectangle.
- **Change.** Drop `:focus-visible` from the selected-stroke rule; `.react-flow__edge:focus-visible { outline: none; opacity: 1; }`. The edge draws three `path.ds-edge__focus` under its own path, same `d`, `stroke-linecap: round`, `pointer-events: none`:
  - halo, `stroke: var(--_focus-halo)`, width `(W + 10px) * var(--_zi)`;
  - line, `stroke: var(--ds-focus-ring)`, width `(W + 4px) * var(--_zi)`;
  - fill, `stroke: var(--cmp-board-bg)`, width `(W + 2px) * var(--_zi)`;
    where W is the edge width and `--_zi` the inverse zoom, so the shape is a 1 px line on each side and a 3 px halo at any zoom.
- **Measure for the play.** The focused edge's path keeps its kind stroke and width; its outline style is `none`; the three focus parts exist with the widths above.
- **Seen.** The focused edge is traced by a thin focus line with a soft halo along its curve, its own colour and dash still visible inside; no rectangle. At fit and at zoom 1, light and dark.

**The stage corners.**

- **Now.** The preview stage uses the container radius (16) inside a viewer panel of the same radius, inset 17 px: the inner corner looks fatter than the outer one.
- **Change (CSS).** `.ds-dialog[data-size="viewer"] [data-stage] { border-radius: max(0px, calc(var(--cmp-dialog-radius) - var(--ds-space-inset-md))); }` gives 8 px.
- **Measure.** Stage radius equals the panel radius less `space.inset-md`, within 1 px; inset 17 px.
- **Seen.** The two corners run parallel, the stage reads as set into the panel.
- **Sheets.** `sheets/r25-edge-focus.sheet.png`, `sheets/r25-stage.sheet.png`.
- **Corrected 2026-11-19 (`ORV-290-design-2`, built by `ORV-290-b1-canvas` at 92a42c1).** The focused edge as built (`recipes.css` lines 2213 to 2222 and 3042 to 3080, `CanvasEdge.tsx` lines 108 to 119):
  - No `outline: none` is written: React Flow's own sheet already sets it, and the play asserts `none`. What is dropped is the global focus rule's box shadow, by `box-shadow: var(--_focus-shadow-none)` on `.ds-board .react-flow__edge:focus-visible` (`recipes.test.ts` bans a raw `none`).
  - `opacity: 1` sits on `.ds-edge` under `.ds-board[data-variant="present"][data-has-selection] .react-flow__edge:focus-visible`, the case where the other edges step back; on the wrapper it changed nothing.
  - The fill part strokes `var(--_ground)`, a private property set to `--cmp-board-bg` on an edit board and to `--ds-surface-canvas` on a present board, whose ground is not `--cmp-board-bg`.
  - W is `--_fw`, the width the edge's own path draws at: the base width, the selected width for a derived, selected or `data-selected` edge, the present selected width for a chained or hovered edge, and `2 x selected - base` for a chained or hovered derived edge. So the shape stays a 1 px line and a 3 px halo on every edge state.
  - The edge's own path is `path.ds-edge__path` without React Flow's `react-flow__edge-path` class: React Flow's sheet draws the selected stroke on `.react-flow__edge.selectable:focus-visible .react-flow__edge-path`, so removing `:focus-visible` from our rule alone left the selected look. Nothing else reads that class; the recipe sets the stroke, width, fill and cap. The right-click target in `CanvasContextMenu.stories.tsx` (line 117) is `.react-flow__edge-interaction`, as the first path is now a focus part with no pointer events.
  - Measured at zoom 1, one pixel column across edge ab at a quarter of its length (Playwright, device scale 4, built story, light and dark), in CSS px: ground 3.25, halo 3, line 1, ground 1, own stroke 1.5, ground 1, line 1, halo 3, ground 3.25. The stroke reads rgb(91, 90, 102) light and rgb(169, 167, 179) dark, the kind colour, not the selected violet. The in-suite play shoots at one device px per CSS px and reads the outer runs 3 and 1 and the core as one piece, 3.5 within 1. `FocusedEdgeHovered` shows hover by the pseudo-states addon's class, not a pointer.
  - The stage radius is `--_stage-radius: calc(var(--cmp-dialog-radius) - var(--ds-space-inset-md))` (`recipes.css` lines 1517 to 1519) without `max(0px, ...)`: a negative radius computes to 0, and the `Viewer` play sets a 4 px panel and reads 0. Measured: stage inset 17 px, its corners the panel radius less 16.

### Row 26, C3, B11, B18

**C3, the prototype at 360 shows its start with the dock in the first screen.**

- **Now.** At 360 and 479 the board is a fixed height below the header; the page's first screen ends before the dock, and the view opens on the middle of the world.
- **Change.** The page's `main` is a grid, `grid-template-rows: auto minmax(30rem, 1fr)`, `min-block-size: 100dvh`; the board fills the row. When the overview fit sits at the zoom floor (0.25, the board does not fit), the first view starts at the world start: the first card's left at the board's left plus `space.grid-gap` (24), the vertical middle unchanged.
- **Measure.** The dock's bottom is inside the window (proposed: ends at 735 of 760); the first card's left is the board's left plus 24 within 1 px.
- **Seen.** The first screen shows the brief column at the left with its title, and the dock at the bottom.

**B18, the outer business cards keep an inset at 360.**

- **Now.** At 360 and 479 the cards run to the board's frame: inset 0 at the start and 0 at the end.
- **Change.** Under 480 the board runs full bleed (`margin-inline: calc(-1 * var(--ds-space-inset-lg))` on its wrapper, no side borders, radius 0) and the fit keeps `space.inset-lg` (24) between the outer cards and the screen edge.
- **Measure.** Start and end inset 24 within 1 px (proposed 24 / 24).
- **Seen.** The cards sit on the page column, same as the header text above.

**B11, at 100 percent at 1440 the dock covers no card.**

- **Now.** After the 100% command, 1 card sits under the dock.
- **Change.** After the zoom-to-100 command, the view moves up or down by the least distance that leaves the dock, plus `space.inset-sm` (8) above and below, in a gap between cards.
- **Measure.** Cards under the dock: 0 (proposed 0).
- **Seen.** The cards above and below the dock are whole. The 1:1 content is taller than the free area, so the move is vertical only (needs decision B11).
- **Sheets.** `sheets/r26-c3.sheet.png`, `sheets/r26-b18.sheet.png`, `sheets/r26-b11.sheet.png`.

### Row 27, C2: the palette preview names and hex read larger

- **Now.** In `PaletteSpecimen` (`examples/orivilo-canvas.tsx` lines 1498 and 1499) the name is `heading-md` (24) and the hex `code-md` (14). On screen at 1440 they read at 21.1 and 12.3 px.
- **Change.** Name `font-display text-display-md` (32); hex `font-mono text-heading-sm` (the heading-sm size and line height, mono face).
- **Measure for the play.** Computed font size of the name equals `--ds-type-display-md-font-size`, the hex equals `--ds-type-heading-sm-font-size`. On screen at 1440: 28.2 and 17.6 px; at 360 (art scale 0.192): 6.1 and 3.8 px, the art is a thumbnail there and the story pages it larger on tap.
- **Seen.** Pages 2 to 6: the swatch name reads as the page's title, the hex as a clear second line; no wrap in Thai or English names.
- **Sheet.** `sheets/r27-c2.sheet.png`.

### Row 28, C4: paper pages show their bounds

- **Now.** A paper page on the light stage meets the stage with no edge; where both are near white, the page has no bound.
- **Change (CSS).** `[data-stage] [data-art-frame]::after { content: ""; position: absolute; inset: 0; z-index: 1; border: 1px solid var(--ds-border-subtle); pointer-events: none; }`
- **Measure.** The hairline's computed colour is `border.subtle` (rgb(227, 226, 220) light); it shows on paper pages and paper tiles, light and dark.
- **Seen.** In light a quiet hairline draws the page edge, barely visible at sheet scale but clear at 1:1; in dark the page already stands off the stage and the line adds nothing loud. The `border.control` alternative (`r28-c4-tokens`) reads heavier, like a form field (needs decision C4).
- **Sheets.** `sheets/r28-c4.sheet.png`, `sheets/r28-c4-corner.sheet.png`, `sheets/r28-c4-tokens.sheet.png`.
- **Corrected 2026-11-19 (`ORV-290-design-2`, built by `ORV-290-b2-stories-page` at 7b45e65).**
  - _Statement corrected: the Measure._ A computed colour does not prove the line is drawn: a mutant with the `::after` at opacity 0 kept the computed style and stayed green on it. The measure that replaces it is a pixel read across the page edge: `expectEdgeColour` (new in `visual-asserts.ts`) reads, at one device px per CSS px, outside 4, line 1, inside 4 px, on `PreviewDirectionBoard` (light) and the new `PreviewDirectionBoardDark` (dark). B2's probe at device scale 4 reads 1 CSS px of rgb(227, 226, 220) in light and rgb(43, 42, 54) in dark on the top, left, bottom and right edges, at 1440 and 1200 light, 1440 and 360 dark. `expectEdgeInk` cannot see this line (46 apart from the stage over RGB, under its threshold of 48). The 12 brandbook pages are read by computed style only, because on a dark page the line lies near the page colour and a pixel read has no ground to tell it from.
  - _Built as written:_ the rule is the generic `[data-stage] [data-art-frame]::after` (`recipes.css` lines 1521 to 1530), so any art frame inside any stage draws the line, not only the viewer dialog's; `catalog/application/dialog.yaml` says so. Token `border.subtle`, decision C4.
- **Corrected 2026-11-19 (`ORV-290-design-4`, finding R28-1 of visual sign-off `ORV-290-signoff-1`, Important, at head a940557).** The line follows the shape of the page it bounds.
  - _Statement corrected: the Change._ One square box over the art frame is right only where the page is a square sheet. Two kinds of page sit in an art frame. Square sheets: the 12 brandbook pages, the 3 logo pages, the 2 type pages, the 6 palette pages. Rounded tiles: page 1 of the direction board and page 1 of the in-use board are boards of `.rounded-media` tiles (5 and 7 tiles, 12 design px gutters, `BoardArt`), and direction pages 2 to 6 and in-use pages 2 to 8 are one `.rounded-media` tile each (`PieceArt`). Over a tile the square line leaves stage between the line and the tile at every outer corner, and on a board it also crosses every gutter that meets the edge with stage on both sides (5 on the direction board) and leaves the same wedge at the tile corners beside each gutter.
  - _Routes weighed._ (a) The frame line takes the tile's radius times the scale: right for a single tile, but on a board the line still crosses the gutters and leaves wedges at the corners beside them; rejected. (b) The rounded page draws the line itself: each tile at the top of the page draws a 1 CSS px line on its own edge with its own radius, and the frame draws none; square sheets keep the frame line as built. Chosen: the only route with no stage between the line and the page at any corner of a board. (c) No line on tiles: row 28 asks each page to show its bounds, and the paper tile of the direction board ("ให้ไอเดียมีตัวตน" / "Give your ideas a world.") is near white on the near white stage; rejected.
  - _Change (CSS), `packages/design-system/src/recipes/recipes.css`, after the rule at lines 1521 to 1530, which stays as it is:_

    ```css
    /* A page made of rounded tiles draws its bounds on each tile, not on the frame (ORV-290 row 28,
     * R28-1). The colour is resolved on the frame, in the stage's mode, because a tile carries its
     * own art mode; the width is divided by the art's scale so it draws 1 CSS px at every size. */
    [data-stage] [data-art-frame] {
      --_page-line-colour: var(--ds-border-subtle);
    }
    [data-stage] [data-art-frame]:has(> * > .rounded-media, > * > [data-board-art])::after {
      content: none;
    }
    [data-stage] [data-art-frame] > * > .rounded-media::after,
    [data-stage] [data-art-frame] > * > [data-board-art] > [data-piece] > .rounded-media::after {
      --_page-line: inset 0 0 0 calc(1px / var(--_art-scale)) var(--_page-line-colour);
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      border-radius: var(--ds-shape-media-radius);
      box-shadow: var(--_page-line);
      pointer-events: none;
    }
    ```

  - _Change (markup), `packages/design-system/src/examples/orivilo-canvas.tsx`:_ `ArtFrame` (line 268) adds the private property to its style, `style={{ width, height: (width * design.h) / design.w, "--_art-scale": String(scale) } as CSSProperties}`, the form `CanvasNode.tsx` line 254 uses for `--_ports`; `BoardArt`'s root div (line 928) gains `data-board-art=""`. No token, no prop, no locale key, no component API. The `ArtFrame`s inside canvas nodes (lines 1723 and 1973) sit in no stage, so the rules leave them alone.
  - _Why these values._ The radius is `--ds-shape-media-radius`, the token `.rounded-media` reads (`--radius-media` in `tokens/generated.css` line 1893), resolved in the tile's own scope, so it equals the tile's radius under every profile; `border-radius: inherit` is not used because `recipes.test.ts` takes any radius that is not a `var()` for a literal. The line is an inset spread, not a border: Chrome snaps a border width to whole device px before the art's scale applies, so `calc(1px / scale)` as a border drew 0.835 CSS px at 1440 (1.198 design px snapped to 1) and 0.961 at 360 (5.203 snapped to 5); the spread is not snapped and draws 1.000 at every scale. The colour is resolved on the frame because a tile is a `Flood` in its own art mode: read inside the tile, `--ds-border-subtle` on the dark stage gave the light rgb(227, 226, 220).
  - _Drawn width._ 1 CSS px at every scale measured: 0.1922 (both boards at 360), 0.3122 (direction page 2 at 360), 0.8012 and 0.8287 (direction board at 1440, English and Thai, the caption lines differ), 0.835 (in-use board at 1440), 1.3421 (direction page 2 at 1440). The design width of the line is `1 / scale` px (5.203 at 360, 1.198 to 1.248 at 1440). The tile edges sit at fractional px, so at device scale 3 the line covers 3 device px split over 3 or 4 with anti-aliasing; on a dark tile on the light stage the outermost device px is the tile's own edge blending with the stage, as on any rounded tile (`sheets/r28-fix__corner-br-360-zoom.sheet.png`).
  - _Measure for the play_ (`expectPaperBounds` in `orivilo-canvas.stories.tsx`, line 1107, splits by page kind):
    - Square sheet (the brandbook pages in `pageBook`, unchanged): the frame's `::after` content is not `none`, `position: absolute`, border 1 px of `resolvedColor(frame, "--ds-border-subtle")`, `pointer-events: none`.
    - Tile page (`PreviewDirectionBoard`, `PreviewDirectionBoardDark`, `PreviewInUseBoard`): the frame's `::after` content is `none`. For each edge tile (every `[data-board-art] > [data-piece] > .rounded-media`, or the frame's single `.rounded-media`) its `::after` has content `""`, `pointer-events: none`, each of the four corner radii equal to the tile's own (`getComputedStyle(tile).borderTopLeftRadius` and the other three), and a `box-shadow` that is `inset`, coloured `resolvedColor(frame, "--ds-border-subtle")`, whose spread times the art scale (the frame's width over its first child's `offsetWidth`) is 1 within 0.02. The visible radius of line and page is that radius times the scale: 9.61 CSS px at 1440 English, 9.94 Thai, 2.31 at 360.
    - Pixel read, both kinds: `expectEdgeColour(frame, ["top", "right", "bottom", "left"], colour, 1)` stays as it is, because each edge's midpoint lies on an edge tile that meets the frame edge. Measured after the change, at device scale 1 and 4, on `PreviewDirectionBoard` 1440 and 1200 and `PreviewDirectionBoardDark` 1440 and 360: outside 4 px of stage, 1 CSS px of rgb(227, 226, 220) light or rgb(43, 42, 54) dark, then page. This read is the mutant guard: a tile line at opacity 0 fails it.
    - Corner read, for the sign-off at device scale 3 or more, not for the play: from 2 CSS px outside the frame's corner along the diagonal into the page, no stage-coloured pixel (within 6 over RGB) follows the first line or page pixel. At device scale 1, the Vitest scale, a line pixel blended with a near white page reads as the stage colour (measured on the top-left tile), so a play reading there would be unreliable; the radius equality above is the play's corner check.
  - _Measured, before (a940557) and after (the CSS injected and the markup set by script), device scale 3, the top-left corner diagonal in steps of 1/3 CSS px (S stage, L line, P page):_

    | Story, width                                            | Frame line before, after          | Tile radius on screen | Tile line before, after                      | Top-left diagonal before | After         | Top-edge gutter at x 794 design                   |
    | ------------------------------------------------------- | --------------------------------- | --------------------- | -------------------------------------------- | ------------------------ | ------------- | ------------------------------------------------- |
    | `PreviewDirectionBoard` light, 1440, English            | square, 1 px, radius 0; none      | 9.61                  | none; 1.000 px, radius 9.61                  | S6 L3 S5 P28             | S14 L2 P26    | line rgb(227, 226, 220); stage rgb(242, 241, 236) |
    | `PreviewDirectionBoard` light, 1440, Thai               | the same                          | 9.94                  | none; 1.000 px, radius 9.94                  | S7 L3 S5 P27             | S15 P1 L1 P25 | line; stage                                       |
    | `PreviewDirectionBoardDark`, 1440                       | the same                          | 9.61                  | none; 1.000 px, radius 9.61, rgb(43, 42, 54) | S6 L3 S5 P28             | S14 L2 P26    | line rgb(43, 42, 54); stage rgb(6, 5, 9)          |
    | `PreviewDirectionBoard` light, 360                      | the same                          | 2.31                  | none; 1.000 px, radius 2.31                  | S6 L3 P33                | S8 L2 P32     | line; stage                                       |
    | Direction page 2 (one tile), light, 1440                | the same                          | 16.11                 | none; 1.000 px, radius 16.11                 | S6 L3 S10 P23            | S19 P1 L2 P20 | none on a single tile                             |
    | `PreviewInUseBoard` light, 1440                         | the same                          | 10.02                 | none; 1.000 px, radius 10.02                 | S7 L3 S5 P27             | S15 P1 L1 P25 | (its gutters lie elsewhere)                       |
    | `PreviewBrandbook` page 6, light and dark, 1440 and 360 | square, 1 px, radius 0; unchanged | no tile               | none; none                                   | S6 L3 P33                | S6 L3 P33     | none                                              |

    Before, every rounded tile at 1440 shows 5 steps (about 2.4 CSS px on the diagonal) of stage between the square line and the tile, 10 to 11 steps (about 4.9 CSS px) on the larger single tile; at 360 the 2.31 px corner leaves less than one device px. After, the line meets the page directly at all four corners in every frame where the page differs from the stage. The top-right tile of the direction board is the near white paper tile: its pixels lie within 6 of the stage colour, so only the line tells them apart, which is this row's purpose; its corner is read on the screenshot.

  - _Stories where an art frame sits in a stage, and what the rule does there._ Only `Stage` in `orivilo-canvas.tsx` (line 2172) renders `[data-stage]` around an art frame; the `Dialog` stories `Viewer`, `ViewerInEnglish` and `ViewerAt360` have a stage and no art frame, and the product pages (`PreviewProductPages`, `PreviewProductPagesScrollbar`) are live screens with no art frame: no change in any of these.
    - Tile lines, frame line off: `PreviewDirectionBoard`, `PreviewDirectionBoardDark` (board, then pages 2 to 6 in the play), `PreviewInUseBoard` (board, pages 2 to 8), `MissingImages` (the in-use board with missing photographs: each tile keeps its flood and draws its line), and `Default`, whose play opens all 40 preview pages.
    - Frame line unchanged, square: `PreviewBrandbook`, `PreviewAt360`, `BrandbookChapter`, `InThai` (the book through `bb-cover`), `LogoChapter` (logo and type pages), `ColourChapter` (palette pages), and the book, logo, type and palette pages of `Default`. Book page 11 holds tiles too, but its tiles are inside the page (`[data-book-page] > [data-piece]`) and match neither selector; the page keeps one frame line.
  - _Builder notes._ `expectPaperBounds` and its two callers at lines 1277 and 1301 change as the measure above says; `catalog/application/dialog.yaml` line 29 reads "A [data-art-frame] inside a [data-stage] draws a 1 px border.subtle line over its own edge; a page of rounded tiles draws it on each tile with the tile's own radius, so no stage shows between the line and the page (ORV-290 row 28)". Token `border.subtle`, decision C4, unchanged.
  - _Seen._ On the light stage each board tile now carries its own quiet line that turns its corners with it; the paper tile "ให้ไอเดียมีตัวตน" reads as a page; the gutters show bare stage with no line across them. In dark the line is the dark `border.subtle` and stays quiet. The brandbook pages look as before. Thai and English, 1440 and 360.
  - _Proof._ PNGs in `/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO/.orivilo/runs/ORV-290/ORV-290-design-4/screenshots/`, named `<before|after>__<page>__<mode>-<locale>-<width>__<preview|corner-tl|corner-br>.png` for `direction-board` (light and dark, English and Thai, 1440 and 360), `brandbook-p6` (the same matrix), `direction-piece-p2` and `in-use-board` (light and dark, English, 1440 and 360); 144 frames. Sheets in its `sheets/` folder: `r28-fix__corner-tl-1440.sheet.png`, `r28-fix__corner-br-1440.sheet.png`, `r28-fix__corner-tl-360.sheet.png`, `r28-fix__corner-br-360.sheet.png`, `r28-fix__preview-1440.sheet.png`, `r28-fix__preview-360.sheet.png`, `r28-fix__corner-1440-zoom.sheet.png`, `r28-fix__corner-br-360-zoom.sheet.png`. The Thai frames come from `InThai` with the node opened by Enter (`d-board`, `bb-cover`), as the preview stories fix the locale to English.

### Row 29, C5: the "Brand evidence report" heading shows whole

- **Now.** The form frame in 06 Design system starts the brand report form at 48 design px (`examples/orivilo-canvas.data.ts` line 1274, `start: 48`); the heading is cut at its top (7.3 screen px at 1440, 3.5 at 360).
- **Change (fixture).** `start: 8`.
- **Measure for the play.** `expectNoGlyphClip` on the heading inside its frame; 16 design px of air above the heading.
- **Seen.** The heading reads whole with air above it in Thai and English.
- **Sheet.** `sheets/r29-c5.sheet.png`.

### Row 30, C6: the pager centred under 600

- **Now.** `examples/orivilo-canvas.tsx` line 2313, `justify-self-start min-[600px]:justify-self-center`: at 360 the pager sits 90.6 px left of the centre, at 599 210.1 px.
- **Change.** `justify-self-center` at every width.
- **Measure for the play.** Pager centre minus footer centre is 0 within 1 px.
- **Seen.** The pager sits under the caption in the middle at 360 and 599.
- **Sheet.** `sheets/r30-c6.sheet.png`.

### Row 31, C10: the `c-demo` point numerals at `label-sm`

- **Now.** The numeral span (`examples/orivilo-canvas.tsx` lines 1927 and 1928) carries both `{...scope("dark")}` and `text-label-sm`; the scope resets the type, so the numerals render at 16 px, weight 400, line height 27.2.
- **Change.** Move `scope("dark")` to the outer disc, or keep it and put the numeral in an inner span with `text-label-sm tabular-nums`, line height 1.
- **Measure for the play.** Computed font size equals `--ds-type-label-sm-font-size` (13), weight 500, line height 13.
- **Seen.** The numerals are smaller and centred in the 22 px disc with even air. In dark the disc's ring (`ring-surface-card`) disappears on the black paper at point 3, an extra note for the builder (keep the ring on `border.subtle` in dark).
- **Sheet.** `sheets/r31-c10.sheet.png`.
- **Corrected 2026-11-19 (`ORV-290-design-2`, built by `ORV-290-b2-stories-page` at 7b45e65).** Built with the second route: `scope("dark")` stays on the disc, and the numeral is an inner span `font-body text-label-sm leading-none tabular-nums` (`examples/orivilo-canvas.tsx` line 1944); computed 13 px, line height 13. The "extra note" on the ring is read as dark only: the ring is `ring-border-subtle` when the page is dark and `ring-surface-card` when it is light (line 1929, from the page's mode), so light is unchanged. Measured in dark: the ring reads rgb(43, 42, 54) (was rgb(30, 29, 38)). Whether that ring is strong enough on the black paper is point 4 of "Open points of ORV-290 builder B2" in section 4.

### Row 32, B14: no port pill within 8 world px of another node

- **Measured now.** Scanning every node's pills on `orivilo-canvas` `Default` and `InThai`: 41 pills in each language come nearer than 8 world px to another node's card or dot; the p-pat pills ("BrandReportScreen form", "SectionHeader" and others) sit under the p-form card.
- **Decision.** The columns move right; y is unchanged. Each column's shift is the least that clears every pill of the earlier columns by 8 world px, planned with a 12 px margin so the Thai widths at the rendered zoom also clear.

  | Ids                                            | x now | x new |
  | ---------------------------------------------- | ----- | ----- |
  | b-\* brief column                              | 0     | 0     |
  | b-pos, b-name, d-attr                          | 352   | 392   |
  | d-board                                        | 724   | 804   |
  | l-idea, l-build, l-hist, c-why, c-hist, c-prop | 1356  | 1460  |
  | l-logo, t-type, c-pal, c-con                   | 1704  | 1880  |
  | u-board                                        | 2136  | 2328  |
  | c-demo                                         | 2236  | 2428  |
  | bb-\*                                          | 2768  | 2980  |
  | p-base                                         | 3200  | 3464  |
  | p-pat                                          | 3572  | 3876  |
  | p-landing, p-form, p-report                    | 4004  | 4432  |

- **Change (fixture).** The `x` values of `NODES` in `examples/orivilo-canvas.data.ts`; the "Layout numbers" table of `docs/specs/ORV-274/design.md` section 3 records the new x in the same PR.
- **Measure for the play.** `expectPortPillsClear(node, 8)` on the prototype board in English and Thai: 0 pills under 8 world px (proposed 0 and 0).
- **Effect.** The world grows from 4484 to about 4912 wide; the fit at 1440 moves from 0.261 to 0.25 (the floor) and the whole board still shows (needs decision B14).
- **Seen.** The p-pat pills sit whole in a wider corridor between p-pat and p-form; no column touches the next; the board reads as the same eight chapters with a little more air.
- **Sheets.** `sheets/r32-b14.sheet.png`, `sheets/r32-b14-pat.sheet.png`.
- **Corrected 2026-11-19 (`ORV-290-design-2`, built by `ORV-290-b2-stories-page` at 7b45e65).**
  - The x values are built as the table gives them (`examples/orivilo-canvas.data.ts`; `b-pos` and `b-name` take their 392 through `briefNode`), and `docs/specs/ORV-274/design.md` section 3 records them.
  - The world is 4912 wide exactly (`p-landing`, `p-form` and `p-report` at 4432 plus 480), not "about". `orivilo-canvas.test.ts` bounds it at 4912 x 2260 (was 4640, the ORV-274 budget). At the 0.25 floor it needs a 1228 px board: a 1440 window shows it whole; the old 1200 test window (board 1168) no longer does, so the `Default` play runs its Overview step in a 1440 window. B2 reports the whole world from about a 1240 px window up; from its own figures (a 1228 px board, 32 px of page margin at 1200) the bound lies between 1240 and 1260.
  - The Measure is called as `expectPortPillsClear(el, 8, Number.NEGATIVE_INFINITY)` (`orivilo-canvas.stories.tsx` line 471), on every node focused in turn, in English and Thai: 0 pills under 8 world px to another node's card, title line or dot. The pill to pill bound is switched off because the three input pills of `p-pat` that share the row `form` (Button, Field and RadioGroup) draw over each other, a gap of -32.1 world px; that is a defect inside one node, already on `develop`, and not this row's measure (point 3 of "Open points of ORV-290 builder B2" in section 4).

### Row 33, B1: still-to-ask questions read apart from the person's words

- **Now.** The questions block (`examples/business-node-view.tsx` lines 169 to 178) is a heading and a list in `text.primary`, the same ink and step as the answers above; the questions read like field labels.
- **Change.** The block becomes a `surface.sunken` panel with `space.inset-md` padding and `shape.container-radius`; the questions take `text.secondary`; the heading stays `label-md` in `text.primary`.
- **Measure for the play.** Panel background is `surface.sunken`; question colour is `text.secondary` (rgb(91, 90, 102) light, rgb(169, 167, 179) dark, was rgb(22, 21, 29) and rgb(242, 241, 236)).
- **Copy.** No change. The Thai question "ทำไมคุณถึงเริ่มทำสิ่งนี้ ตอบสั้น ๆ หนึ่งหรือสองประโยคก็พอ" carries no question mark; "ทำไม" carries the question, as Thai writes it.
- **Seen.** The questions sit in a soft inset panel under the answers, quieter than the person's words, in Thai and English, light and dark, at 360 and 1440.
- **Sheets.** `sheets/r33-b1.sheet.png`, `sheets/r33-b1-now.sheet.png`.

### Row 34, B2: the header's action on the title line

- **Now.** `.ds-page-header__row` aligns its items to the end, so the action sits at the bottom of the text block: beside the lede, 42.4 px below the title line's centre (`WithActions`), 74.2 and 101.4 px on the business board at 1440.
- **Change (recipe).**

  ```css
  .ds-page-header__row {
    align-items: flex-start;
  }
  .ds-page-header__actions {
    padding-block-start: var(--ds-space-stack-sm);
    min-block-size: calc(
      var(--ds-space-stack-sm) + var(--ds-type-display-md-font-size) *
        var(--ds-type-heading-sm-line-height)
    );
  }
  @container ds-page-header (max-width: 479px) {
    .ds-page-header__actions {
      padding-block-start: 0;
      min-block-size: 0;
    }
  }
  ```

- **Measure for the play.** Action centre minus the title's first line centre: 0 within 1 px (proposed 0 in every story); the action meets no lede line. Wrapped actions (`ManyActions`) keep their rows; under 480 the actions stay under the text.
- **Seen.** One-line and two-line titles both carry the action on their first line; the lede runs under the title alone. The `PageHeader` stories render in a wide frame, so the `Narrow` story is the 360 check.
- **Sheets.** `sheets/r34-b2-ph.sheet.png`, `sheets/r34-b2-long.sheet.png`, `sheets/r34-b2-many.sheet.png`, `sheets/r34-b2-board.sheet.png`.

### Row 35, B3: the intake lede names the two required fields

- **Now.** Thai leaves "ไว้" alone on its last line at 768, 1024 and 1440; the lede says only the first question is required, but two are.
- **Copy (proposed, for the owner's review).**
  - Thai: "ตอบด้วยคำของคุณเอง ต้องตอบชื่อโปรเจกต์และสิ่งที่คุณขายหรือเสนอ ข้ออื่นเว้นว่างได้ และกระดานจะแสดงว่าข้ามไว้"
  - English: "Answer in your own words. The project name and what you sell or offer are required. Leave any other question empty and the board shows it as skipped."
- **Change (recipe).** `.ds-page-header__description { text-wrap: pretty; }` with B2.
- **Measure for the play.** At 1440 no Thai line holds one word alone; `docs/specs/ORV-281/spec.md` line 210 holds the new copy.
- **Seen.** Thai at 768 to 1440: 2 lines, the last "กระดานจะแสดงว่าข้ามไว้"; at 360: 3 lines. English at 1440: 3 lines, the last "as skipped."; at 360: 5 lines.
- **Sheet.** `sheets/r35-b3.sheet.png`.

### Row 36, B4: the saved-at line at the card's bottom

- **Now.** In a row of cards of unequal content the saved-at line follows its content: insets from the card bottom 25 and 59 px in row 2 (spread 34).
- **Change (CSS).** `ul > li > .ds-card[data-interactive] > p:last-child { margin-block-start: auto; }` (the card is a flex column).
- **Measure for the play.** The saved-at lines of one row share a bottom within 0.5 px (proposed 25 and 25, spread 0).
- **Seen.** The dates line up across each row at 1440; at 360 the single column is unchanged.
- **Sheet.** `sheets/r36-b4.sheet.png`.

### Row 37, B5: the FixtureNote on the column at 360

- **Now.** `FixtureNote` (`examples/business-story-helpers.tsx` line 37) is `p-4`: its ink starts at 16 against the screen's column at 24.
- **Change.** `padding-inline: var(--ds-space-inset-lg)` (24) on the note.
- **Measure for the play.** At 360 the note's first ink left equals the column's left (proposed 24 and 24).
- **Seen.** On the board, intake and list at 360 the note starts on the same line as the heading. At 1440 the note sits at 24 against a centred column; that is out of this item's scope.
- **Sheets.** `sheets/r37-b5-board.sheet.png`, `sheets/r37-b5-intake.sheet.png`, `sheets/r37-b5-list.sheet.png`.

### Row 38, B6: the board's signed-out and not-allowed screens

- **Look.** The four new stories follow the intake's signed-out screen as it is: the screen heading at `display-md`, one sentence at `body-md`, one primary link, on the page column (left 24 at 360, the centred column at 1440), no `.ds-board`. Signed out: "ลงชื่อเข้าใช้ก่อน แล้วจึงเล่าเรื่องธุรกิจของคุณได้" / "Sign in to tell us about your business." with "ไปหน้าลงชื่อเข้าใช้" / "Go to sign in". Not allowed: "ตอนนี้ส่วนนี้เปิดให้เฉพาะบัญชีที่ได้รับอนุมัติ และบัญชีนี้ยังไม่อยู่ในรายชื่อ" / "This is open only to approved accounts for now, and this account is not one of them.", with no link.
- **Measure for the play.** No `.ds-board`; heading, sentence and link share one start edge.
- **Seen (reference).** The intake signed-out screen: heading, sentence and link on one edge at 24 (360) and 360 (1440), Thai and English, light and dark; Thai marks whole.
- **Sheet.** `sheets/r38-b6.sheet.png` (the pattern, rendered from the intake stories; the board stories do not exist yet).

### Row 39, B7: no look

Data only: the list and the board read one source, `business_intake.created_at`.

### Row 40, B9: the scroll focus ring crosses no glyph

- **Now.** `.ds-scroll__viewport:focus-visible` draws an inset 4 px halo (`--_focus-shadow-inset`), and the content starts at the viewport's edge: in the viewer the ink sits 3 px from the top and 0 from the left, so the ring crosses the Thai upper marks of "ยังไม่ได้ยืนยัน". `ScrollArea` `Default`: ink left 0.
- **Change (recipe).** The scroll content gets `padding: var(--ds-space-inline-sm)` (4, the halo width); inside a dialog the scroll root takes `margin: calc(-1 * var(--ds-space-inline-sm))`, so the text keeps the dialog title's start edge and the ring sits 4 px outside it.

  ```css
  .ds-scroll__viewport > div {
    padding: var(--ds-space-inline-sm);
  }
  .ds-dialog .ds-scroll {
    margin: calc(-1 * var(--ds-space-inline-sm));
  }
  ```

- **Measure for the play.** With the viewport focused, the ink inset is 4 px or more on every side (proposed top 7, left 4); `expectNoGlyphClip` on the first line.
- **Seen.** The ring runs clear around the text; the Thai state line reads whole above and below; the text still starts under the title.
- **Sheets.** `sheets/r40-b9.sheet.png`, `sheets/r40-b9-scroll.sheet.png`.

### Row 41, B13: no look

The `heading` prop, its default and its `SectionHeader` branch leave `business-node-view.tsx`; the views render as before.

### Row 43, S1: stacked cards read as separate cards (`CanvasEdge` `KindsAndZoom`, edit board)

- **Change (fixture).** Stack gap 110 to 172.
- **Measure for the play.** The vertical gap between stacked cards is 25.4 world px or more (16 or more asked); on screen 11.2 px at 360 (zoom 0.441) and 35.4 px at 1440 (zoom 1.393).
- **Seen.** Each card stands apart with a visible band of ground at every zoom; the row 9 edges still draw clear.
- **Sheet.** `sheets/r43-s1.sheet.png`.
- **Corrected 2026-11-19 (`ORV-290-design-2`, built by `ORV-290-b2-stories-page` at 7b45e65).** _Statement corrected:_ the old pitch of the edit board was 150, the default `gap` of the story's `pairs()` (`CanvasEdge.stories.tsx` line 29), which left 3.4 world px between stacked cards, not 110. Built: `STACK_GAP = 172` (line 691) passed to the `KindsAndZoom` edit board only; a collapsed card is 146.6 world px tall, so the gap is 25.4 world px, 6.4 screen px at the 0.25 floor. The present board's `kindGrid` pitch of 110 is unchanged: a probe of its columns found no pair of cards under 25.3 world px. The play asserts 25.3 world px or more (25.4 less 0.1 for rounding) at zooms 0.25, 0.5, 1 and 2, over 4 stacked pairs.

### Row 44, S2: the English stories read in English

- **Change (story).** `KindsInEnglish` and `ConnectedInEnglish` use "All kinds", "Source", "Target" and the English port names "text", "image", "palette", "type", "profile"; `Kinds` and `Connected` keep "ทุกชนิด", "ต้นทาง", "ปลายทาง" and the Thai port names.
- **Measure for the play.** The board's `innerText` in each English story holds no Thai character.
- **Seen.** English: "Source", "Target", "text", "image" in their rows, the dots and edge unchanged. Thai story unchanged.
- **Sheets.** `sheets/r44-s2-kinds.sheet.png`, `sheets/r44-s2-connected.sheet.png`, `sheets/r44-s2-thai.sheet.png`.

### Row 45, S3: no open glyph on a board that cannot open

- **Decision.** Option (a) of open question 8: a board without `onNodeOpen` shows no `.ds-node__open`; the node keeps its page count as content ("3 หน้า" / "3 pages"). A board with `onNodeOpen` shows the glyph as today.
- **Measure for the play.** `.ds-node__open` absent on every node of the board without `onNodeOpen`, visible on the open node of a board with it.
- **Seen.** On the bare board "โลโก้ 3 หน้า" and "Logo 3 pages" end cleanly at the page count; the edit board keeps the glyph. Thai and English, light and dark.
- **Sheet.** `sheets/r45-s3.sheet.png` (the bare board simulated on the view board, as PR A's third board is not on `develop`).

### Rows 18 and 42: gates

No look. Row 42 adds the designer's visual sign-off on PR B, judged against this file.

### Review S1: no look, for the builder

`CanvasBoard`: `const canOpen = Boolean(onNodeOpen)`, used at line 419 and in the dependency list at line 427, in place of the repeated test.

## 3. Screens for visual QA

The sign-off on PR B checks, at 360 and 1440, Thai and English, light and dark:

1. `NodePort` `PresentRecipesAndModes` (row 10).
2. `CanvasBoard` dock stories, `orivilo-canvas` `Default` and `InThai`, `business-board` `Board`: first Tab stop (row 19).
3. `CanvasEdge` `KindsAndZoom` at fit, `ChainHighlight`, `NodePort` `PresentNames` (rows 20, 21, 43).
4. `NodeGroup` `Grouped` (row 22); `PresentNarrowLabels` (row 23).
5. `CanvasControls` `WithChaptersAt360` at start, middle and end; `business-board` `NarrowLight`; `orivilo-canvas` `At360` (rows 24, 26).
6. A focused edge on `CanvasBoard` `Present`; the viewer stage (row 25).
7. The palette preview pages 2 to 6, the brandbook and both boards' previews, `DesignSystemChapter`, `PreviewAt360` at 360 and 599, `ColourChapter` (rows 27 to 31).
8. `orivilo-canvas` with every node's pills shown (row 32).
9. `business-board` `Viewers`, `ViewerAt360`, `ViewerAt1440`; `ScrollArea` stories focused (rows 33, 40).
10. Every `PageHeader` story, `business-intake` at 768, 1024, 1440, `business-list`, every `business-*` story at 360 (rows 34 to 37), and the four new board stories (row 38).
11. `NodePort` `KindsInEnglish`, `ConnectedInEnglish`, `Kinds`; `CanvasBoard` `OpenNode` and `OpenNodeInEnglish` (rows 44, 45).

Added 2026-11-19 (`ORV-290-design-2`), for the sign-off on head 7b45e65:

- Item 1: in Storybook the `PresentRecipesAndModes` play runs too, and outside the Vitest runner `atWindow` runs its check in the reader's own window (`testing/window.ts`), so the play presses each board's fit key and its status line stays on screen after it. Shoot the story after the play and check that line against the cards (section 4, "Open points of ORV-290 builder B2", point 1).
- Item 6: the focused edge is in `CanvasEdge` `FocusedEdge`, `FocusedEdgeInEnglish` and `FocusedEdgeHovered`; the stage in `Dialog` `Viewer`, `ViewerInEnglish` and `ViewerAt360`.
- Item 7: the paper bounds in dark are in the new `orivilo-canvas` `PreviewDirectionBoardDark`; check the `c-demo` rings in dark on `Default` with the dark mode, at point 3 (point 4).
- Item 8: `orivilo-canvas` `Default` at 1440 for the Overview (the whole 4912 world at 0.25), and once at 1280 to see the narrowest window that still shows it whole (point 2).
- Item 1, added 2026-11-19 (`ORV-290-design-3`): once row 10's change of that date is built, the boards under 720 px are 720 px tall; shoot `PresentRecipesAndModes` after the play at 360 and 1440 and check that the status line and the badge each stand clear of every card and dot (the proposed render is in that task's `sheets/proposed__*.sheet.png`).
- Item 7, added 2026-11-19 (`ORV-290-design-4`): once row 28's correction of that date is built, shoot the four corners of the page, at device scale 3 or more, in `PreviewDirectionBoard` (light, English), `PreviewDirectionBoardDark`, the direction board opened from `InThai` (node `d-board`, light and dark), `PreviewInUseBoard` at page 1 and at page 2 (one tile), and `PreviewBrandbook` (light and dark), at 360 and 1440. Check that on every tile page the line turns each corner with the tile and no stage shows between the line and the tile, that no line crosses a gutter between tiles, that the paper tile ("ให้ไอเดียมีตัวตน") shows its bound, that the dark stage's line is the dark `border.subtle`, and that the brandbook page keeps its one square line. The proposed render is in that task's `sheets/r28-fix__*.sheet.png`.
- `CanvasBoard` `PillLayoutPass` and the `visual-asserts` stories (`PillsClearAmongPills`, `GlyphClipThrough`, `EdgeColour`, `BoardChromeClear`) are test pages built by hand to prove the helpers, not looks of the product; they need no look judgement.

## 4. Needs decision

Four of these are decided for slice ORV-290 on 2026-11-19, by the main session under the owner's POC delegation (ADR 0012 decision 4); the owner can change any of them. The others stay open for the second slice card.

- **B14.** The board grows from 4484 to about 4912 world px wide; at 1440 the overview fit lands on the 0.25 floor. Accept, or tighten the corridors and keep 0.261. **Decided for slice ORV-290 (2026-11-19): accept.** The board grows to about 4912 world px wide and the overview fit at 1440 lands on the 0.25 floor.
- **B15.** The story height route (540 under 554) keeps the board component unchanged as row 10 asks. A board-level fit that reserves the badge's corner would fix every narrow present board; it is a component change outside row 10. **Decided for slice ORV-290 (2026-11-19): the story height route**, 540 px under 554 px, with the board component unchanged.
  - _Values changed 2026-11-19 (`ORV-290-design-3`)._ The route stands; its values become 720 px under 720 px, so the status line a fit key raises also clears every card and dot at 360 and 1440 (row 10, "Changed 2026-11-19"). The same values in `docs/specs/ORV-290/spec.md` (decision B15) are the main session's to note.
- **B11.** At 100 percent the 1:1 content is taller than the free area, so the dock clearance is reached by a vertical move only; a card can still pass under the dock while the person pans.
- **D1.** At the 0.25 fit (360) every edge pill fails the clearance and the board shows lines only, its kinds by colour and dash. Accept, or show the state pills (stale, missing) even at the floor. **Decided for slice ORV-290 (2026-11-19): accept.** At the 0.25 fit an edge shows its line only, and its pill returns on zoom.
- **C4.** The hairline token: `border.subtle` (proposed, quiet) or `border.control` (stronger, reads like a field). **Decided for slice ORV-290 (2026-11-19): `border.subtle`.**
- **B10 and B17.** The change to the 360 dock rule (`canvas-controls.yaml` line 21, `docs/specs/ORV-274/spec.md` row 12).
- **B3.** The proposed Thai and English lede copy, for the owner's review.

### Open points of ORV-290 builder B2, answered 2026-11-19 (`ORV-290-design-2`)

Builder `ORV-290-b2-stories-page` left four points at head 7b45e65. Each answer is accept, follow-up item or change needed. The four decisions D1, C4, B14 and B15 above stand as written.

1. **Row 10: the status line a person's fit key raises, at 360. Change needed.**
   - _Measure._ After Shift+1 at 360 the status line "Fitted 1 node to the view" ("พอดีจอ 1 โหนด"), bottom left, overlaps the card by 11.2 px (neutral, light, the 540 px board; B2).
   - _Why before the merge._ The line is not brief: `CanvasBoard` keeps the message until the next command or a new `status` from the shell (`message` state, cleared only at line 389). Outside the Vitest runner `atWindow` runs its check in the reader's own window, so in Storybook the play itself presses the fit key on every board and leaves that line over the card. That is the state the visual sign-off renders, and it is the look sign-off ORV-280-signoff-1 rejected (F2, "a fit status pill over the card's corner in every cell", spec v1.2 item B15). Row 10's text covers only the board at rest, so the play passes, but the look does not.
   - _Wanted._ In every cell of `NodePort` `PresentRecipesAndModes`, at 360 and at 1440, after the board's own fit key: the status line's rect keeps a gap of 0 or more to every `.ds-node` and `.ds-port__handle` rect, the same bound as the badge, with the board component unchanged (decision B15). The route (the story's board height under 554, or another story route) is a design row of its own, rendered at 360 and 1440, Thai and English, light and dark, before any builder (L-0017); the component route is follow-up D16 below.
   - _Answered 2026-11-19 (`ORV-290-design-3`)._ The route is row 10's "Changed 2026-11-19": boards under 720 px are 720 px tall, and the play reads the status line after the fit key. At 1440 the English line overlapped too (1.4 to 19.9 px to the card); the change clears both widths.
2. **Row 32, B14: the 4912 world fits whole only from a window of about 1240 to 1260 px. Accept.**
   - _Measure._ 4912 x 0.25 is a 1228 px board. Before, 4484 x 0.25 was 1121, about a 1153 px window. A 1280, 1366 or 1440 window still shows the whole world at the Overview; from about 1153 to 1260 the Overview now sits at the floor with the world's ends past the board.
   - _Why._ Decision B14 accepts the 0.25 floor at 1440, and under the bound the board does what `docs/specs/ORV-274/design.md` section 2 already gives for 360: the floor, the start in view, pan or a chapter button. The start view under the floor is item C3 of the second slice card. Nothing to build.
3. **Row 32: the three `p-pat` input pills that share one row. Follow-up item C12.**
   - _Measure._ Button, Field and RadioGroup sit on the row `form` and draw over each other, a gap of -32.1 world px (B2); Badge and Alert share the row `notice` the same way and are not yet measured.
   - _Why not now._ It is a defect inside one node, already on `develop`, outside this slice's rows; row 32's measure is the distance to other nodes, and it holds. The names show only while `p-pat` is pointed, selected or focused.
4. **Row 31: the `c-demo` ring in dark. Accept for this PR; follow-up item C13.**
   - _Measure._ The dark ring is `border.subtle`, rgb(43, 42, 54) (gray-700). Computed from the token hex, not rendered: about 1.3 to 1 against the disc's own ground (`surface.canvas` dark, gray-900) and about 1.4 to 1 against gray-950, the darkest paper grey. The old `surface.card` ring (gray-800) was lower.
   - _Why accept now._ Row 31 asks for the numeral's step, and it holds (13 px). The numeral, `text.primary` on the disc, carries the point; the discs are `aria-hidden` and the numbered list under the image names each point. The ring bounds the disc, it is not the meaning.

### Follow-up items for the second slice card of ORV-280 (rows 19, 24, 26, 33 to 41)

Added 2026-11-19 (`ORV-290-design-2`). The second slice card's spec gives them rows; each needs its own design row, rendered, before a builder.

- **C12.** One `p-pat` row holds several input ports (`form`: Button, Field, RadioGroup; `notice`: Badge, Alert), so their name pills draw over each other (-32.1 world px for `form`). Wanted: the pills of one node keep `expectPortPillsClear`'s default pill to pill bound (7.5) on every node of `Default` and `InThai`, so the prototype plays can drop `Number.NEGATIVE_INFINITY`. Route to design: one row per input port, or one pill per shared row naming its ports.
- **C13.** The `c-demo` disc ring in dark reads about 1.4 to 1 on the black paper. Wanted: 3 to 1 or more against the paper under the disc, from an existing token, quiet next to the photograph. `border.control` (gray-500) computes about 4.9 to 1 against gray-900 and 5.5 to 1 against gray-950, and may read loud; render both before choosing.
- **D16.** On every present board, a status line a fit command raises lies over the cards when the board is short: the fit's bottom padding (`freePadding` in `CanvasBoard`) counts the bottom panels and the task bar, not the status line. Wanted: after a fit, the status line keeps a gap of 0 or more to every card and dot. A component change (lane L), the board-level route that decision B15 set aside for row 10.
- **D17.** Added 2026-11-19 (`ORV-290-design-3`). On a present board at 360 the three row toolbar (122 px tall, bottom left) covers the top of the "React Flow" attribution in the bottom right corner, in every cell of `NodePort` `PresentRecipesAndModes` (seen at 7b45e65, before and after row 10's change). Wanted: the attribution whole and clear of the toolbar at every width. Route to design.

## 5. Changelog

- 2026-11-18, `ORV-280-design-b`: first version; rows 10 and 19 to 45 with their measures, CSS and sheets.
- 2026-11-19, `ORV-290-spec-1`: section 4 marks D1, C4, B14 and B15 as decided for slice ORV-290 (main session, under the owner's POC delegation, ADR 0012 decision 4; the owner can change them). No measure, row or sheet changed.
- 2026-11-19, `ORV-290-design-2`: the design brought to head 7b45e65 of the ORV-290 slice before its visual sign-off and code review, from the reports of builder tasks `ORV-290-b1-canvas` (92a42c1) and `ORV-290-b2-stories-page` (7b45e65) and the built files. Dated corrections in rows 10, 20, 22, 23, 25, 28, 31, 32 and 43, among them the three statements B2 found wrong (row 43's old pitch, 150 not 110; row 28's proof, a pixel read, not a computed colour; row 10's 294 x 300 at 0.454, the old board, the built one 294 x 540 at 0.7625) and row 10's dot gap at 1440 (69.3, not 79.8). Section 3 names the new stories for the sign-off. Section 4 answers B2's four open points (row 10's fit status line: change needed; the 4912 world: accept; `p-pat`'s shared rows: follow-up C12; the `c-demo` ring in dark: accept, follow-up C13) and lists C12, C13 and D16 for the second slice card. No look changed; D1, C4, B14 and B15 stand as written.
- 2026-11-19, `ORV-290-design-3`: row 10 changed for point 1 of B2's open points: boards under 720 px are 720 px tall (was 540 under 554) and the play reads the status line after the fit key, so it clears every card and dot at 360 and 1440 (it overlapped by up to 11.3 px at 360 and, in English, 19.9 px at 1440); rendered by injection, Thai and English, light and dark. B15's values noted, point 1 answered, follow-up D17 added. The board component is unchanged.
- 2026-11-19, `ORV-290-design-4`: row 28 corrected for finding R28-1 of visual sign-off `ORV-290-signoff-1` (Important): a page of rounded tiles (the direction and in-use boards and their single tile pages) draws its line on each tile, 1 CSS px at every scale, with the tile's own radius and the frame line off, so no stage shows between the line and the page at any corner and no line crosses a gutter; square pages keep the frame line. CSS and markup given with their values, the play's measure split by page kind, before and after measured and rendered by injection (light and dark, Thai and English, 360 and 1440). Section 3 item 7 names the screens for the next sign-off. Token `border.subtle` (C4) unchanged; no token, prop or locale key added.
