---
issue: ORV-189 (https://tpetkaew.atlassian.net/browse/ORV-189)
lane: S (Storybook preview and story files only, no risk flag)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-189: Storybook boards fill the viewport, small components centred

## Goal

The owner's two Storybook canvas decisions (Jira ORV-189, as `docs/specs/ORV-189/design.md` line 3 quotes them):

1. Every board and panel story fills the viewport height and is never shorter than its height today.
2. Small components are centred in the canvas, while Matrix grids (Recipes and modes) and other wide stories keep the full width.

The cause (design.md, section "What is wrong today"): each board helper and panel sets a fixed height (Block library `Default` is 640 px in a 1260 px canvas, so 620 px are bare), small components sit in the top start corner, and Storybook pads the body of a `padded` story by 1rem outside the mode surface, so a padded story scrolls by 32 px and shows a white band round the dark surface.

The change stays in the Storybook preview and the story files (design.md rows 1 to 8). No component, recipe, token or public API changes, and no product behaviour changes. Nothing here is simulated: the stories render the real components.

## Acceptance criteria

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The storybook test project, viewport 1200 x 900 | Block library `Default` renders and its play runs | The board is as tall as `fill-height-1` gives for 640 px in a fullscreen frame: it meets the bottom edge, with the shelf and the controls at its foot. No new copy | None | The play of design.md row 6 (`.ds-board` height equals `Math.max(640, innerHeight)`), red on `641283a`, green on the PR head |
| 2 | The storybook test project, viewport 1200 x 900 | Canvas chat `Idle` and Inspector `Selected` render and their plays run | Each panel is as tall as `fill-height-1` gives for its height today (560 and 520 px) in a padded frame; the chat shows its empty line ยังไม่มีข้อความ ถามเรื่องบนบอร์ดได้เลย / "No messages yet. Ask anything about the board" and its composer at the foot | None | The plays of design.md row 6 (`.ds-chat` height `Math.max(560, innerHeight - 32)`, the `Panel` wrapper `Math.max(520, innerHeight - 32)`), red on `641283a`, green on the PR head |
| 3 | Every story of `fill-height-1`, outside a Matrix cell | The story renders in a frame shorter than its height today | The board or panel keeps its height today and never gets shorter | None | A read of the diff: every wrapper of `fill-height-1` takes `fillHeight(n)` with its height today as `n` (worked example 2), and worked example 1 gives 640 at a 600 px frame |
| 4 | Storybook, a story of a file of `centre-1` | Button `Variants` renders and its play runs | The row of buttons sits in the middle of the canvas on both axes; wrapped rows share one start edge | None | The new play of design.md row 6 (the story root's centre equals the surface's centre within 1 px on both axes), red on `641283a` |
| 5 | Storybook, a Matrix story (`matrix-keep-1`) | Button `RecipesAndModes` and Block library `RecipesAndModes` render and their plays run | The Matrix keeps its layout and full width: six cells, two columns at 1440 px, one at 360 px; each Block library cell board stays 520 px tall | None | The plays of design.md rows 3 and 6 (the Button grid is as wide as the surface less 32; each of the six `.ds-board` is 520 px tall) |
| 6 | Storybook, a story of a field-width file (`centre-1`, designer's default) | The story renders | The field stays at the top start of the canvas at the full column width it has today | None | A read of the diff: the `layout` of each field-width file is unchanged; their plays pass (row 8) |
| 7 | Storybook, a story of `exempt-1` (designer's default) | The story renders | It keeps the height `exempt-1` lists for it | None | Their plays, unchanged and passing; the designer's visual QA (design.md, section "Screens to check in visual QA", last line) |
| 8 | The PR head | The whole storybook test project runs (a preview file changes, `.claude/rules/testing.md`) | Every play passes, the Canvas chat `OnBoard` play reading its floating chat height from the measured board (design.md row 8) | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook`, its output in the builder's `verified` |
| 9 | Storybook UI at 1440 x 1300 and 1440 x 800, dark mode, neutral profile | Button `Variants` and Canvas chat `Idle` open | No white band round the surface and no scroll: the surface starts at `[0, 0]` and fills the canvas | None | The measurement of design.md row 1 (`scrollHeight` equals the canvas height), and the designer's screenshots (design.md, section "Screens to check in visual QA") |

Decision 1 is rows 1, 2, 3 and 9 (fill the height, never shorter, and a filled story does not scroll); decision 2 is rows 4, 5 and 6. Rows 6 and 7 hold the designer's defaults (open questions 1 and 2), which the owner may reverse. Row 8 keeps every existing play passing.

## Rules and bounds

### fill-height-1

The stories that fill: each wrapper marked "Fills" in design.md, section "Where heights are set" (the board helpers of Canvas board and its story shell, Block library, Canvas node, Canvas edge, Node port, Canvas context menu, the Canvas chat `Frame` and `BoardChat`, and the Inspector `Panel` and `Studio`), less the stories of `exempt-1`. Each takes the height `max(today, frame)` through `fillHeight(today)` (design.md row 4), where the frame is the one the surface sets by layout (design.md row 2): `fullscreen` the viewport height, `padded` the viewport height less 32 px (the surface `p-4` on both edges), `centered` 0 px. Inside a Matrix cell the frame is 0 px (design.md row 3), so the height stays today's. Values: worked example 1.

### centre-1

The files whose meta `layout` moves from `padded` to `centered` (design.md row 5 and section "Centred files"): Badge, Button, Checkbox, Kbd, Tag, Tooltip, Popover, ToggleGroup, ContextMenu, DropdownMenu, Toast and ScrollArea, and Logo (ORV-118 is on `develop`; ORV-189 merges second, so the Logo change is done in this PR). A small component is one whose `ds-*` elements keep the width they have today when centred. Field-width files fail that test and stay `padded` (designer's default): Input, Input group, Password input, Textarea, Select, Field, Slider, Range slider, Progress, Tabs, Table and Card.

### matrix-keep-1

Each story that renders a `Matrix` in a file of `centre-1` sets `parameters: { layout: "padded" }` (the list is in design.md, section "Centred files"), and a board or panel inside a Matrix cell keeps its height today (`fill-height-1`). A Matrix stays at full width: the surface less its `p-4` on both edges.

### exempt-1

Five stories keep their height (designer's default; each proves a bound on the height itself, shows several frames at once, or has the board beside the subject; design.md, section "Exempt"):

- Canvas chat `MentionsSmallest`: 380 px.
- Canvas chat `StartersAtWidths`: six 560 px frames.
- Task bar `OnShortBoard`: 420 px.
- Missing inputs prompt `PromptBoard`: 320 px.
- Dialog `LongContentAt360`: the 360 x 560 frame.

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

1. Frame and heights of `fill-height-1`, `centre-1` and `matrix-keep-1`. Inputs: the test viewport 1200 x 900 (`@storybook/addon-vitest` 10.6.3, as `docs/specs/ORV-84/spec.md` `surface-padding-1` records); the surface `p-4`, 16 px; today's heights 640 (Block library `ShelfBoard`), 560 (Canvas chat `Frame`) and 520 (Inspector `Panel`) from design.md, section "Where heights are set"; the Storybook UI canvas at 1440 x 1300, 1260 px tall (design.md line 9); a 600 px frame for the never-shorter bound. Expected output, integers with no rounding: `900 868 900 868 868 1168 600 450 1260 1228 640`, that is, the fullscreen and padded frames, the board, chat and panel heights, the Matrix width, the centre, then the board and chat in the 1260 px canvas, then the board in a 600 px frame.

   ```bash
   node -e 'const vw=1200,vh=900,pad=16,fill=(px,frame)=>Math.max(px,frame);const full=vh,padded=vh-2*pad;console.log(full,padded,fill(640,full),fill(560,padded),fill(520,padded),vw-2*pad,vw/2,vh/2,fill(640,1260),fill(560,1260-2*pad),fill(640,600))'
   ```

2. `fillHeight` (design.md row 4) maps today's height to the CSS value. Input: 640, Block library `ShelfBoard` (`BlockLibrary.stories.tsx` lines 13 and 18). Expected output, a string with no rounding: `max(640px, var(--story-fill, 0px))`.

   ```bash
   node -e 'const fillHeight=px=>`max(${px}px, var(--story-fill, 0px))`;console.log(fillHeight(640))'
   ```

## Rows per PR

The main session fills this section once the PR exists, one list line per PR in the form the result recorder reads (`scripts/ovl/result-recorder.mjs`).

## Out of scope

- Component, recipe, token, profile and public API changes, and `apps/web`.
- The Block library fit at a 760 px canvas, where the second node row runs under the shelf (`CanvasBoard.tsx` line 540, a component follow-up).
- Inspector `StudioLayout` at 360 px, which uses the Resizable where the component's doc says a Sheet (a story follow-up).
- A dark mode or second locale run of the plays; dark mode is checked by eye (row 9).
- Visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

1. The five stories of `exempt-1`. Options: (a) keep their height; (b) let them fill too. Default: (a), the designer's; the owner may reverse it.
2. The field-width files of `centre-1`. Options: (a) stay `padded`, top start, full width; (b) centre them, which shrinks Input from 448 to 205 px and Select from 448 to 95 px (design.md, section "Centred files"). Default: (a), the designer's; the owner may reverse it.
3. Follow-ups for the two follow-up items of Out of scope. Options: (a) open them now; (b) leave them to the main session at G3. Default: (b).

## Depends on

- `docs/specs/ORV-189/design.md` rows 1 to 8 and its sections "Where heights are set", "Exempt", "Centred files" and "Plays that move".
- `docs/specs/ORV-84/spec.md` `surface-padding-1`: the surface `p-4` of a padded story, which row 1 of design.md keeps while Storybook's own body padding gives way.
- ADR 0003 (`docs/adr/0003-shadcn-behavior-own-visual-layer.md`): Storybook is the visual half of the catalog.
- `.claude/rules/testing.md`: a test fails on the real defect, and a preview file change runs the full suite.

## Changelog

- v1.0 (2026-10-31): first version, from Jira ORV-189 as design.md quotes it (no Jira tool in this role) and design.md rows 1 to 8. Downstream to review: the builder envelope for ORV-189 (its objective cites rows 1 to 9).
