# ORV-84: design notes

Design decisions for ORV-84 (spec: `docs/specs/ORV-84/spec.md`). Each row is a numbered layout change the builder makes as written; the designer proved it rendered before any builder envelope (L-0017).

## Rows

| #   | Target                                                                                                      | Change                                                                                       | Source                                                | Play that proves it                                                                                                                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `CanvasEdge.stories.tsx`, story `InteractionStates`, the `EdgeBoard` in `render` (line 141, `height={560}`) | `height={900}`. Nothing else changes: no colour, no CanvasBoard prop, no CanvasControls code | Finding F2 of sign-off `ORV-84-signoff-1`, spec row 4 | In the existing play, after `focus.focus()`: the focused edge's box grown by the ring reach (outline width plus offset) ends above the top of `canvasElement.querySelector(".ds-controls")`, that is `ring.bottom <= bar.top` |

## Row 1: the focused edge clears the controls bar

### What was wrong

At 560 px the board fits its content by height. xyflow's fit padding 0.2 (`CanvasBoard.tsx` line 1070, `fitViewOptions={{ padding: 0.2 }}`) leaves floor((H - H / 1.2) / 2), that is H / 12, above and below the content: 46 px at 560. The controls bar sits 16 px above the board's bottom edge and is 50 px tall in one row, so it covers the bottom 66 px. The fourth pair's edge (y 488 to 496 with the ring), its label ป้อนเข้า and the source node's port label ข้อความ fell under the bar (bar top 494, measured in the Storybook UI at 1440 x 1000, light and dark).

### The bound

While the fit is height-bound, the bottom margin is H / 12 whatever the width. The whole bottom pair (nodes, port labels, edge ring) must end above the bar with a clearance of at least twice the ring reach (8 px): H / 12 >= 16 + 50 + 8 = 74, so H >= 888. The row takes 900, the next round value. At 900 the fit stays height-bound on the 1140 px canvas of the Storybook UI (it turns width-bound only from H = 995 at that width), the scale is 1.26 and the bottom margin 75 px. Where the canvas is narrow, the fit is width-bound and the margin grows, so a two-row bar (86 px at 360 px) still clears.

### Options weighed

- **Taller board (chosen).** A story-only value, inside this PR's write set; no public API moves.
- **fitView padding.** `CanvasBoard` fixes `fitViewOptions` at padding 0.2 and exposes only `fitView: boolean`. A per-side padding needs a new CanvasBoard prop, a component public API change (L lane, impact list), for one story.
- **Controls position.** The bar's panel position is inside `CanvasControls`; moving it changes every board in every story and in the Studio.
- `chrome={false}` would also clear the overlap, but it is not one of the three and takes the bar out of a story the owner reviews with it.

### Measured, with the change injected

Method: Storybook dev from the worktree at `49771c7` on port 6123; the proposed value injected as CSS on the board wrapper (`div[style="height: 560px;"] { height: 900px !important }`), then the story remounted so fitView and the play run on the new height (`forceRemount` in the Storybook UI, an init script in the bare iframe). Neutral profile, Thai, after the play finished; focus on edge 4. Script: `/tmp/orv-84-design-f2/scripts/probe.mjs`. Values in CSS px, `[left, top, right, bottom]`.

| Frame                                 | Board        | Mode        | Ring of edge 4       | Controls bar        | Bottom nodes end | Overlap                                  |
| ------------------------------------- | ------------ | ----------- | -------------------- | ------------------- | ---------------- | ---------------------------------------- |
| Storybook UI 1440 x 1000              | 560 (before) | light, dark | [493, 488, 647, 496] | [16, 494, 641, 544] | 514              | yes                                      |
| Storybook UI 1440 x 1000              | 900          | light, dark | [449, 785, 691, 793] | [16, 834, 649, 884] | 825              | none, ring 41 px above, nodes 9 px above |
| iframe 360 x 800                      | 900          | light, dark | [135, 564, 225, 572] | [16, 798, 344, 884] | 581              | none                                     |
| iframe 1200 x 900 (the test viewport) | 900          | light       | [479, 785, 721, 793] | [16, 834, 649, 884] | 825              | none                                     |

What the screenshots show:

- Wide, light and dark: four pairs at 126 %, edge 4 in the violet focus stroke with both ring lines, above and below it, whole; the label ป้อนเข้า and both ข้อความ port labels on the board surface with their marks above and below intact; the bar alone in the strip under the pairs. Edge 2 shows the forced hover, edge 3 the selected violet.
- Narrow, light and dark: the pairs at 44 % in the middle of the board, the ring of edge 4 whole and far above the two-row bar.
- Trade-off: in a 360 x 800 frame the 900 px board is 100 px taller than the frame, so the bar sits below the first view and the page scrolls. The pairs and the focused ring stay in the first view; the story's subject is the edges, so this is accepted.

Screenshots (device scale 2; each `-crop` is the bottom pair and the bar):

- `/tmp/orv-84-design-f2/before-light-th-wide.png`
- `/tmp/orv-84-design-f2/before-light-th-wide-crop.png`
- `/tmp/orv-84-design-f2/after-light-th-wide.png`
- `/tmp/orv-84-design-f2/after-light-th-wide-crop.png`
- `/tmp/orv-84-design-f2/after-dark-th-wide.png`
- `/tmp/orv-84-design-f2/after-dark-th-wide-crop.png`
- `/tmp/orv-84-design-f2/after-light-th-narrow.png`
- `/tmp/orv-84-design-f2/after-light-th-narrow-crop.png`
- `/tmp/orv-84-design-f2/after-dark-th-narrow.png`
- `/tmp/orv-84-design-f2/after-dark-th-narrow-crop.png`

### Screens to check in visual QA

`application-canvas-edge--interaction-states` in the Storybook UI at 1440 x 1000 and in the iframe at 360 px, light and dark, neutral profile: the whole ring of edge 4 and the labels ป้อนเข้า and ข้อความ of the fourth pair sit above the controls bar on the surface colour. The fixture text is Thai under both toolbar locales (spec, criteria note), so the English toolbar locale renders the same edges.
