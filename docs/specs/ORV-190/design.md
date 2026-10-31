# ORV-190: design notes

Design decisions for ORV-190, the owner's request in Jira: the Block library shelf has a wider gap on the right of the board than on the left. Each row is a numbered layout change the builder makes as written; the designer proved it rendered before any builder envelope (L-0017).

## Rows

| #   | Target                                                                  | Change                                                                                                                                                                                                | Source                                                                                                                       | Play that proves it                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `recipes.css`, rule `.ds-board .react-flow__panel.ds-shelf` (line 2924) | Add `transform: translateX(-50%);`. Nothing else in the rule moves; the task bar variant at line 3904 changes only `margin-block-end` and needs no edit                                               | Owner's request in ORV-190 (shelf 1 to 1409 on a 1440 board, controls at x 16)                                               | In `Application/Block library` `Default`, after `ready`: with `b` the `.ds-board` box, `s` the `.react-flow__panel.ds-shelf` box and `c` the `.react-flow__panel.ds-controls` box, `abs((s.left - b.left) - (b.right - s.right)) <= 1` and `abs(s.left - c.left) <= 1`                                                                                                                                                                             |
| 2   | `recipes.css`, rule `.ds-shelf__groups` (line 2988)                     | Add `margin: calc(-1 * var(--ds-space-inline-sm)); padding: var(--ds-space-inline-sm); scroll-padding: var(--ds-space-inline-sm);`, the bleed of `.ds-dialog__body` (line 981) with the semantic step | Seen while proving row 1: the focus ring of the first and the last tile is cut by the scroll row (DESIGN.md: focus is shown) | In `Default`, focus the first tile, then the last tile (`scrollIntoView` by focus): with `g` the `.ds-shelf__groups` box and `t` the focused tile box, the ring reach 4 (2 px outline plus 2 px offset) fits: `t.left - 4 >= g.left`, `t.right + 4 <= g.right`, `t.top - 4 >= g.top`, `t.bottom + 4 <= g.bottom`; and the first tile's left edge is unchanged by the row, `tile.left - s.left` equals `1 + 16` (border plus `--cmp-shelf-padding`) |

The proposed CSS, both rows, tokens and percentages only:

```css
.ds-board .react-flow__panel.ds-shelf {
  /* existing declarations stay */
  transform: translateX(-50%);
}
.ds-shelf__groups {
  /* existing declarations stay */
  margin: calc(-1 * var(--ds-space-inline-sm));
  padding: var(--ds-space-inline-sm);
  scroll-padding: var(--ds-space-inline-sm);
}
```

## Row 1: the shelf sits 16 px from both edges

### What was wrong

`BlockLibrary` renders an xyflow `Panel` at `bottom-center`. xyflow's `base.css` (imported by `src/tokens/orivilo.css` line 17) centres that panel with `left: 50%; transform: translateX(-15px) translateX(-50%)`: the `-15px` undoes xyflow's own `margin: 15px`. Our recipe sets the shelf's inline margin to 0 (`margin: 0 0 calc(...)`) so the shelf can reach `100% - 2 * --ds-space-inset-md` wide, but keeps xyflow's `-15px`. The shelf therefore sits 15 px left of centre. Measured at commit `641283a`: on a 1440 board the shelf is `[1, 1409]`, 1 px from the left edge and 31 px from the right; on a 360 board `[1, 329]`, the same 1 and 31. The computed transform is `matrix(1, 0, 0, 1, -719, 0)`, that is -704 (half of 1408) minus 15.

### The fix and why it wins

`transform: translateX(-50%)` replaces xyflow's two-step shift with the plain half-width shift. The recipe selector and xyflow's `.react-flow__panel.bottom.center` have the same specificity (0,3,0); `recipes.css` is imported after `base.css` (`orivilo.css` lines 17 and 18), so the recipe wins, as its `margin` does today. Computed transform after: `matrix(1, 0, 0, 1, -704, 0)` at 1440 and `-164` at 360.

### The decisions asked

- **Controls and shelf share the start edge: yes.** The controls panel sits at `--ds-space-inset-md` (16) from the start edge; the task bar spans `inset-inline: --ds-space-inset-md`. After row 1 the shelf at its width cap is `[16, 1424]` at 1440 and `[16, 344]` at 360: shelf, controls and task bar start on one edge at 16, and shelf and task bar end on one edge at 16 from the right. The shelf stays a centred panel; it is not moved to `bottom-left`. Its content (16 tiles, 2940 px of scroll width) exceeds the cap on any board below about 3000 px, so in every real frame it is at the cap and the edges meet.
- **End padding on the clipped row: no extra spacing.** The tile row scrolls inside the shelf padding (`--cmp-shelf-padding`, 16). At scroll 0 the first tile starts 16 inside the shelf; scrolled to the end, the last tile ends 16 inside the shelf (measured `[1231, 1407]` in a `[16, 1424]` shelf at 1440). Both ends already mirror; more end padding would break that. The tile cut at the end edge, mid-name, is the cue that the row scrolls, and it stays. What the row did need is room for the focus ring: row 2.

## Row 2: the focused tile's ring stays whole

`.ds-shelf__groups` has `overflow-x: auto`, which clips both axes at its padding box. The tiles fill it edge to edge, so the global focus ring (`orivilo.css` line 32: 2 px outline, 2 px offset, reach 4) is cut on the first tile's start and bottom and on the last tile's end and bottom (measured before: tile `[18, 461, 194, 535]` in groups `[18, 429, 1392, 535]`). The dialog and side sheet bodies already solve this with a bleed (`.ds-dialog__body`, `--cmp-dialog-body-bleed`, which reads `--ds-space-inline-sm`, 4). Row 2 uses the same bleed with the semantic token directly, so no new token and no contract change. The groups box grows 4 on every side into the shelf padding and pads it back: tiles keep their place (first tile at 33 before and after the bleed, shelf height unchanged, `[372, 552]`), the ring has 4 px all round, and `scroll-padding` keeps a focused tile's ring inside the row when focus scrolls it into view.

## Measured, with the change injected

Method: Storybook dev from this worktree at `641283a` on port 6400, bare iframe, neutral profile, viewport 360 x 720 and 1440 x 720 (the story is `layout: fullscreen`, so the board is the frame width, 640 tall), device scale 2. The proposed CSS injected with `page.addStyleTag` after the story finished. "With the task bar": the `Application/Task bar` `Collapsed` story's `.ds-taskbar` markup, rendered in the same locale and mode, inserted into the Block library board, so `.ds-board:has(.ds-taskbar)` (line 3895) lifts the shelf and controls as in the Studio. The `Application/Task bar` `OnBoard` story has no shelf; it is shot as a no-change check. Script: `/tmp/orv-190-design/scripts/probe.mjs`, all results in `/tmp/orv-190-design/results.jsonl`. Values in CSS px, `[left, top, right, bottom]` or `[left, right]`.

| Frame                          | Shelf before        | Gaps before (start, end) | Shelf after          | Gaps after | Controls            | Task bar             |
| ------------------------------ | ------------------- | ------------------------ | -------------------- | ---------- | ------------------- | -------------------- |
| Default, 1440, th and en       | [1, 372, 1409, 552] | 1, 31                    | [16, 372, 1424, 552] | 16, 16     | [16, 574, 649, 624] | none                 |
| Default, 360, th               | [1, 372, 329, 552]  | 1, 31                    | [16, 372, 344, 552]  | 16, 16     | [16, 538, 344, 624] | none                 |
| Default, 360, en (bar wraps)   | [1, 340, 329, 552]  | 1, 31                    | [16, 340, 344, 552]  | 16, 16     | [16, 538, 344, 624] | none                 |
| With task bar, 1440            | [1, 298, 1409, 478] | 1, 31                    | [16, 298, 1424, 478] | 16, 16     | [16, 500, 649, 550] | [16, 566, 1424, 624] |
| With task bar, 360             | [1, 298, 329, 478]  | 1, 31                    | [16, 298, 344, 478]  | 16, 16     | [16, 464, 344, 550] | [16, 566, 344, 624]  |
| Task bar OnBoard, 360 and 1440 | no shelf            |                          | no shelf             |            | unchanged           | unchanged            |

Light and dark give the same boxes. Focus ring (row 2): before, `whole: false` for the first and the last tile at 360 and 1440; after, `whole: true` in all 16 frames (2 widths, 2 modes, 2 locales, first and last tile), `:focus-visible` matched.

What the screenshots show:

- Wide, before: the shelf's left border nearly touches the board edge while a wide strip of board shows on its right; the controls below start 15 px further in than the shelf. After: equal strips of board both sides; the shelf, the controls and the task bar start on one line, and shelf and task bar end on one line.
- Narrow, before: the same 1 px against 31 px; after, shelf, two-row controls and task bar all span 16 to 344. In English the shelf bar wraps the search field under the title and the shelf grows upward; the edges hold at both line counts.
- Light and dark: the glass, border and shadow unchanged; only the position moves. Thai tile names (ไปที่, ผู้ใช้, มู้ดและธีม) whole, marks above and below intact; tile names stay one line with an ellipsis, so the row has one height at any name length.
- Focus, before: the black (light) or white (dark) ring on the first tile lacks its start and bottom lines; on the last tile its end and bottom lines. After: the ring is whole on four sides and the tile has not moved.

Seen, not in this row (no change proposed here): at 360 the controls wrap to two rows (86 tall), and the shelf's bottom margin (`--ds-size-control-md + 3 * --ds-space-inset-md`, 88) assumes one row, so the shelf overlaps the top 14 px of the controls bar, with and without the task bar (shelf bottom 552 against controls top 538; 478 against 464). It is the same before and after rows 1 and 2. It needs its own decision.

Screenshots (device scale 2; `-crop` is the strip from the shelf to the bottom of the board):

- Contact sheets: `/tmp/orv-190-design/sheet-shelf-1440.png`, `/tmp/orv-190-design/sheet-shelf-360.png`, `/tmp/orv-190-design/sheet-shelf-bar-1440.png`, `/tmp/orv-190-design/sheet-shelf-bar-360.png`, `/tmp/orv-190-design/sheet-focus-1440.png`, `/tmp/orv-190-design/sheet-focus-360.png`, `/tmp/orv-190-design/sheet-onboard.png`
- Single frames, `/tmp/orv-190-design/<phase>-<story>-<width>-<mode>-<locale>.png` and the same with `-crop`: phase `before` or `after`; story `shelf` (Default), `shelf-bar` (Default with the task bar) or `onboard` (Task bar OnBoard); width `360` or `1440`; mode `light` or `dark`; locale `th` or `en`. For example `/tmp/orv-190-design/before-shelf-1440-light-th-crop.png` and `/tmp/orv-190-design/after-shelf-bar-360-dark-en-crop.png`.
- Focus frames, `/tmp/orv-190-design/after-focus-<first|last>-<width>-<mode>-<locale>-crop.png` and `/tmp/orv-190-design/before-focus-<first|last>-<width>-light-th-crop.png`.

## Screens to check in visual QA

- `application-block-library--default` in the iframe at 360 and 1440 px, light and dark, Thai and English toolbar locale, neutral profile: the shelf is 16 px from both board edges and starts on the controls' start edge.
- The same story with a tile focused by keyboard, first tile and last tile: the focus ring is whole on four sides.
- A board with the shelf and the task bar together (the Studio board, or the injected frame above until a story shows both): shelf, controls and task bar share the start edge at 16, shelf and task bar share the end edge.
