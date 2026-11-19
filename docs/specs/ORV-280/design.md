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

## 4. Needs decision

- **B14.** The board grows from 4484 to about 4912 world px wide; at 1440 the overview fit lands on the 0.25 floor. Accept, or tighten the corridors and keep 0.261.
- **B15.** The story height route (540 under 554) keeps the board component unchanged as row 10 asks. A board-level fit that reserves the badge's corner would fix every narrow present board; it is a component change outside row 10.
- **B11.** At 100 percent the 1:1 content is taller than the free area, so the dock clearance is reached by a vertical move only; a card can still pass under the dock while the person pans.
- **D1.** At the 0.25 fit (360) every edge pill fails the clearance and the board shows lines only, its kinds by colour and dash. Accept, or show the state pills (stale, missing) even at the floor.
- **C4.** The hairline token: `border.subtle` (proposed, quiet) or `border.control` (stronger, reads like a field).
- **B10 and B17.** The change to the 360 dock rule (`canvas-controls.yaml` line 21, `docs/specs/ORV-274/spec.md` row 12).
- **B3.** The proposed Thai and English lede copy, for the owner's review.

## 5. Changelog

- 2026-11-18, `ORV-280-design-b`: first version; rows 10 and 19 to 45 with their measures, CSS and sheets.
