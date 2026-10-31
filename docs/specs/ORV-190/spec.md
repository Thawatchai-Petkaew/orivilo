---
issue: ORV-190 (https://tpetkaew.atlassian.net/browse/ORV-190)
lane: S (two recipe rules and Block library stories, no risk flag)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.1
---

# ORV-190: Block library shelf, equal gaps to the left and right board edges

## Why

The owner's request (Jira ORV-190): the Block library shelf (คลังบล็อก / "Block library") sits with equal gaps to the left and right edges of the board, at 360 and 1440, in light and dark mode, with and without the task bar.

What is wrong today, as measured: in a 1440 px board the shelf runs from x 1 to x 1409, so its left gap is 1 px and its right gap 31 px, while the canvas controls sit 16 px in from the left edge.

The cause, read from the code: the shelf is a React Flow `Panel` at `position="bottom-center"` (`BlockLibrary.tsx` line 206). React Flow centres such a panel with `left: 50%; transform: translateX(-15px) translateX(-50%)`, where the `-15px` offsets its own default `margin: 15px` (`@xyflow/react` 12.12.0, `dist/base.css` lines 250 to 264). The shelf recipe sets its own margin, `margin: 0 0 calc(...)` (`recipes.css` line 2935), so the 15 px shift is left with nothing to offset, and the shelf lands 15 px left of centre. Every width shows the same 30 px difference between the two gaps (worked example 1).

While proving the fix, the designer found a second defect in the same shelf: the scrolling row of tiles cuts the focus ring of its first and last tile (design.md row 2). DESIGN.md requires focus to be shown, so this spec takes it in.

The fix stays in the shelf recipe (`recipes.css`: the rule `.ds-board .react-flow__panel.ds-shelf` at line 2924 for design.md row 1, the rule `.ds-shelf__groups` at line 2988 for design.md row 2) and in Block library stories. The CSS is design.md's; this spec states the outcomes. No component API, token or profile changes. Nothing here is simulated, except the mock jobs in the task bar story (marked ข้อมูลตัวอย่าง, as the Task bar stories already are).

## Story

As a person building a design system on the Intent Studio board, I want the Block library shelf centred on the board, on one edge with the canvas controls, with a whole focus ring on every tile, so that the board reads as one aligned surface and I can see where keyboard focus is.

## Acceptance criteria

Story names: `Default` and `RecipesAndModes` are existing stories of `Application/Block library` (id `application-block-library--default`), and design.md writes its plays in `Default`. design.md names no new story (its "with the task bar" frames insert the `.ds-taskbar` markup of the `Application/Task bar` `Collapsed` story into the `Default` board), so `Narrow` and `WithTaskBar` are this spec's names (open questions 1 and 2).

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The storybook test project, viewport 1200 x 900, neutral profile, light | Block library `Default` renders and its play runs, after `ready` | The shelf คลังบล็อก meets `shelf-gap-1` (worked example 1 gives the 1200 px values) and `shelf-edge-1`. No new copy | None | design.md row 1's play: with `b` the `.ds-board` box, `s` the `.react-flow__panel.ds-shelf` box and `c` the `.react-flow__panel.ds-controls` box (`getBoundingClientRect`), the play holds `abs((s.left - b.left) - (b.right - s.right))` to the bound of `shelf-gap-1` and `abs(s.left - c.left)` to the bound of `shelf-edge-1`. Red on `641283a` (gaps 1 and 31, shelf 15 px left of the controls), green on the PR head |
| 2 | The storybook test project, a board 360 px wide | A new Block library story `Narrow` renders and its play runs | The shelf meets `shelf-gap-1` (worked example 1 gives the 360 px values) and `shelf-edge-1`; the shelf title คลังบล็อก and the search field ค้นหาบล็อก stay inside the shelf | None | Its play, the row 1 assertions on the 360 board, red on `641283a` with the new story added (gaps 1 and 31), green on the PR head |
| 3 | The storybook test project, a board with the shelf and the task bar (`งาน` / "Jobs") collapsed as in Task bar `Collapsed`, holding mock jobs | A new Block library story `WithTaskBar` renders and its play runs | The shelf meets `shelf-gap-1` and `shelf-edge-1`, and keeps the height above the bar that `shelf-rise-1` sets | None | Its play, red on `641283a` with the new story added (gaps 1 and 31), green on the PR head |
| 4 | The storybook test project | Block library `Default` and `WithTaskBar` render | The shelf sits at the same height above the board's bottom edge as today (`shelf-rise-1`) | None | A play step on the board bottom less the shelf bottom, green on `641283a` and on the PR head (a guard against the fix moving the shelf up or down) |
| 5 | The storybook test project | Block library `RecipesAndModes` renders and its play runs | Each of the six shelves meets `shelf-gap-1` inside its cell: neutral, professional and friendly, each in light and dark (`Matrix`, `PROFILE_IDS` in `src/profiles/index.ts`) | None | The extended play, red on `641283a`, green on the PR head |
| 6 | Storybook at a 360 and a 1440 px board, light and dark, Thai and English | Block library `Default` and the shelf with the task bar open; Task bar `OnBoard` (no shelf) opens | The shelf meets `shelf-gap-1` (worked example 1 gives the 360 and 1440 px values) and `shelf-edge-1`; the controls and the task bar keep their boxes; in `OnBoard` nothing moves | None | The designer's before and after measurement and screenshots (design.md, section "Measured, with the change injected"), and a measurement on the PR head in the qa or designer report |
| 7 | The storybook test project, Block library `Default` and `Narrow`, after `ready` | The first tile โลโก้ที่มีอยู่ ("Existing logo") takes keyboard focus, then the last tile สองทิศทาง ("Two directions"), each scrolled into view by focus | The focus ring of each tile is whole on four sides (`shelf-ring-1`) and the first tile has not moved. No new copy | None | design.md row 2's play: with `g` the `.ds-shelf__groups` box and `t` the focused tile box and `r` the ring reach of `shelf-ring-1`, `t.left - r >= g.left`, `t.right + r <= g.right`, `t.top - r >= g.top`, `t.bottom + r <= g.bottom`, `:focus-visible` matched, and the first tile's `t.left - s.left` equals the offset `shelf-ring-1` sets. Red on `641283a` (ring cut on the first tile's start and bottom, the last tile's end and bottom), green on the PR head |
| 8 | Storybook at a 360 and a 1440 px board, light and dark, Thai and English | In Block library `Default` the first and then the last tile take keyboard focus | The ring is whole on four sides in all 16 frames (2 widths, 2 modes, 2 locales, first and last tile); Thai tile names keep their marks above and below | None | The designer's focus frames (design.md, section "Measured, with the change injected"), and the same 16 frames on the PR head in the qa or designer report |
| 9 | The PR head | The Block library and Task bar story files and `recipes.test.ts` run | Every play in `src/components/block-library` and `src/components/task-bar` and every test in `src/recipes` passes (the set is what the two commands select) | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/block-library src/components/task-bar` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes`, output in the builder's `verified`; the full suite at the G3 gate |

Rows 1, 2, 3, 5 and 6 are the owner's request (equal gaps at 360 and 1440, light and dark, with and without the task bar); rows 7 and 8 are design.md row 2 (the focus ring); row 4 holds the shelf's height; row 9 keeps the existing checks passing.

## Rules and bounds

### shelf-gap-1

On every board that holds the shelf, the gap from the shelf's left edge to the board's left edge and the gap from its right edge to the board's right edge differ by at most 1 px (sub-pixel layout). When the shelf is as wide as its `max-width` allows (the board width less 2 times `--ds-space-inset-md`), each gap is `--ds-space-inset-md`, 16 px under every registered profile (`PROFILE_IDS`: neutral, professional, friendly; no profile file sets a space token). When the shelf is narrower, it is centred: each gap is half the board width less the shelf width. Values: worked example 1.

### shelf-edge-1

When the shelf is at its `max-width`, its left edge is within 1 px of the canvas controls' left edge (`.react-flow__panel.ds-controls`, which sits `--ds-space-inset-md` from the start edge), and with the task bar the shelf and the bar share both edges. design.md decides this ("Controls and shelf share the start edge: yes"): the shelf stays a centred panel and is not moved to `bottom-left`. The rule holds at the cap only; a narrower shelf is centred by `shelf-gap-1` and leaves the controls' edge (worked example 1, the 1000 px shelf). The 16 tiles are 2940 px of scroll width, so on any board below about 3000 px the shelf is at the cap (design.md).

### shelf-rise-1

The fix moves the shelf sideways only. The distance from the board's bottom edge to the shelf's bottom edge stays what the recipe gives today: `--ds-size-control-md` plus 3 times `--ds-space-inset-md` without the task bar (`recipes.css` line 2935), and that plus the task bar lift `--_lift` with it (lines 3895 and 3905). Under the neutral profile: 88 px and 162 px (worked example 2).

### shelf-ring-1

When a tile in the shelf's scrolling row (`.ds-shelf__groups`) has keyboard focus, the whole focus ring fits inside the row's box on all four sides: the ring reaches 4 px past the tile (the 2 px outline and the 2 px offset of `:focus-visible`, `orivilo.css` lines 32 to 35). This holds for the first and the last tile, and for a tile that focus scrolls into view. The tiles do not move for it: the first tile's left edge stays 17 px inside the shelf's left edge (the 1 px border plus `--cmp-shelf-padding`, 16), and the shelf's height does not change. The row gets no end padding for spacing: at scroll 0 the first tile starts 16 inside the shelf, scrolled to the end the last tile ends 16 inside it, and the tile cut at the end edge is the cue that the row scrolls (design.md, "End padding on the clipped row: no extra spacing"). Values: worked example 3.

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

1. The two gaps of `shelf-gap-1`, today and after the fix. Inputs: the React Flow shift 15 px (`base.css` line 263), `--ds-space-inset-md` 16 px (`generated.css` lines 118 and 265), the shelf at its `max-width` (board less 32 px, `recipes.css` line 2934) in boards of 1440, 360 and 1200 px, and a narrower 1000 px shelf in a 1440 px board. Expected output, integers with no rounding: `1 31 1 31 205 235 16 16 16 16 220 220 16 16`, that is, today's left and right gaps at 1440, 360 and the narrow shelf, then the same three after the fix, then 1200 after the fix. The left gaps after the fix at the cap (16) equal the controls' inset (16), which is `shelf-edge-1`; the narrow shelf's 220 is why that rule holds at the cap only.

   ```bash
   node -e 'const pad=16,rf=15,max=W=>W-2*pad,gaps=(W,w,shift)=>{const l=W/2-shift-w/2;return [l,W-l-w]};console.log(...gaps(1440,max(1440),rf),...gaps(360,max(360),rf),...gaps(1440,1000,rf),...gaps(1440,max(1440),0),...gaps(360,max(360),0),...gaps(1440,1000,0),...gaps(1200,max(1200),0))'
   ```

2. The heights of `shelf-rise-1`. Inputs, neutral profile: `--ds-size-control-md` 40 px (`generated.css` lines 131 and 280), `--ds-space-inset-md` 16 px, `--cmp-taskbar-header-height` 40 px and `--cmp-taskbar-padding-y` 8 px (`generated.css` lines 1272, 1268, 116 and 264), and the 2 px of borders in `--_lift` (`recipes.css` line 3896). Expected output, integers with no rounding: `88 74 162`, that is, the height without the bar, the lift, and the height with the bar.

   ```bash
   node -e 'const control=40,inset=16,insetSm=8,header=40;const rise=control+3*inset,lift=header+2*insetSm+2+inset;console.log(rise,lift,rise+lift)'
   ```

3. The ring check of `shelf-ring-1` on the first tile at 1440, without and with design.md row 2. Inputs: outline 2 px and offset 2 px (`orivilo.css` lines 33 and 34), shelf left edge 16 after design.md row 1 and shelf border 1 px (design.md, "Measured, with the change injected"), `--cmp-shelf-padding` 16 px (`generated.css` line 1164), the bleed `--ds-space-inline-sm` 4 px (`generated.css` line 271, `--op-space-1`), and the tile bottom 535 measured with the groups bottom at the same 535 before the bleed (design.md, section "Row 2"). Expected output, integers and booleans with no rounding: `4 17 33 false false true true`, that is, the ring reach, the first tile's offset inside the shelf, the tile's left edge, then whether the ring fits at the start and the bottom without the bleed, then with it.

   ```bash
   node -e 'const outline=2,offset=2,reach=outline+offset,border=1,pad=16,bleed=4,shelfL=16,tileL=shelfL+border+pad,tileB=535,fits=b=>[tileL-reach>=tileL-b,tileB+reach<=tileB+b];console.log(reach,tileL-shelfL,tileL,...fits(0),...fits(bleed))'
   ```

## Rows per PR

- PR 167: rows 1, 2, 3, 4, 5, 6, 7, 8, 9

## Out of scope

- Follow-up, the designer's finding (design.md, the paragraph "Seen, not in this row"): at 360 the canvas controls wrap to two rows (86 px tall), while the shelf's bottom margin (`shelf-rise-1`) assumes one row, so the shelf covers the top 14 px of the controls bar, with and without the task bar (designer's measurement: shelf bottom 552 against controls top 538; with the bar 478 against 464). It is the same before and after this change, and this PR does not touch it. Default: a new Jira story, opened by the main session; no play in this PR asserts the shelf's vertical place against the controls at 360, so none changes when that story lands.
- The canvas controls, the minimap and the task bar themselves: their place does not change.
- End padding on the tile row: see `shelf-ring-1`.
- Component API, token, profile and `apps/web` changes. design.md row 2 uses the semantic token `--ds-space-inline-sm` directly, so no new token.
- The Inspector `Studio` story, which also holds the shelf: it follows from the same recipe rules and is not checked separately.
- Visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

1. A shelf and task bar story does not exist today (the Task bar `OnBoard` story has no shelf; design.md confirms and injected the `Collapsed` markup instead). Options: (a) add Block library `WithTaskBar`; (b) add the shelf to Task bar `OnBoard`. Default: (a), so the Task bar plays stay as they are.
2. The 360 px check. Options: (a) a Block library `Narrow` story with a 360 px wide board, run by the test project; (b) a measurement at a 360 px window only. Default: (a), so the check runs in CI.
3. The owner's AC draft in Jira ORV-190 was not read here (no Jira tool in this role). Default: the rows above stand, and the main session compares them with the draft before G3.
4. Closed by design.md. Does the shelf's left edge line up with the controls' left edge? Answer: `shelf-edge-1`.
5. Closed by design.md. Does the clipped row of tiles need end padding? Answer: `shelf-ring-1`.

## Depends on

- `docs/specs/ORV-190/design.md` (commit `861cf33`): the recipe CSS of rows 1 and 2, the plays, the measurements and the closed questions 4 and 5.
- `@xyflow/react` 12.12.0 `dist/base.css` lines 250 to 264: the panel margin and the centre shift the fix must offset.
- `DESIGN.md` §11, the design gate the reviewer walks at G3, and its rule that focus is shown.
- `.claude/rules/testing.md`: a play fails on the real defect and asserts the rendered result.

## Changelog

- v1.0 (2026-10-31): first version, from the owner's request and measurement as the envelope carries them (no Jira tool in this role) and a read of `recipes.css`, `BlockLibrary.tsx` and `@xyflow/react` `base.css`. Downstream to review: the builder envelope for ORV-190, and design.md if its row numbers or story names differ from rows 2 and 3.
- v1.1 (2026-10-31): lined up with design.md (`861cf33`). Added rule `shelf-edge-1` (closed question 4) and rule `shelf-ring-1` with AC rows 7 and 8 (design.md row 2, the focus ring; closed question 5); row 1 now carries design.md's play; story names stated (`Default` and `RecipesAndModes` existing, `Narrow` and `WithTaskBar` this spec's, the task bar as in `Collapsed`); row 6 adds Task bar `OnBoard`; the old row 7 is row 9; the designer's 360 overlap of shelf and controls recorded under Out of scope as a follow-up; Goal renamed Why and a Story added. Downstream to review: the builder envelope for ORV-190 (rows 1 to 9, both recipe rules), the qa envelope (rows 6 and 8, the 16 focus frames), and design.md (no change needed: its rows 1 and 2 map to AC rows 1 to 6 and 7 to 8).
