---
issue: ORV-190 (https://tpetkaew.atlassian.net/browse/ORV-190)
lane: S (one recipe rule and Block library stories, no risk flag)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-190: Block library shelf, equal gaps to the left and right board edges

## Goal

The owner's request (Jira ORV-190): the Block library shelf (คลังบล็อก / "Block library") sits with equal gaps to the left and right edges of the board, at 360 and 1440, in light and dark mode, with and without the task bar.

What is wrong today, as measured: in a 1440 px board the shelf runs from x 1 to x 1409, so its left gap is 1 px and its right gap 31 px, while the canvas controls sit 16 px in from the left edge.

The cause, read from the code: the shelf is a React Flow `Panel` at `position="bottom-center"` (`BlockLibrary.tsx` line 206). React Flow centres such a panel with `left: 50%; transform: translateX(-15px) translateX(-50%)`, where the `-15px` offsets its own default `margin: 15px` (`@xyflow/react` 12.12.0, `dist/base.css` lines 250 to 264). The shelf recipe sets its own margin, `margin: 0 0 calc(...)` (`recipes.css` line 2935), so the 15 px shift is left with nothing to offset, and the shelf lands 15 px left of centre. Every width shows the same 30 px difference between the two gaps (worked example 1).

The fix stays in the shelf recipe (`recipes.css`, the rule at line 2924 and its task bar variant at line 3904) and in Block library stories. The CSS itself, and whether the shelf's left edge should line up with the controls' left edge and whether the clipped row of cards needs end padding, are decided in `docs/specs/ORV-190/design.md` (written in parallel by the designer); this spec does not decide them. No component API, token or profile changes. Nothing here is simulated, except the mock jobs in the task bar story (marked ข้อมูลตัวอย่าง, as the Task bar stories already are).

## Acceptance criteria

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The storybook test project, viewport 1200 x 900, neutral profile, light | Block library `Default` renders and its play runs | The shelf คลังบล็อก has the same gap to the left and the right edge of the board, as `shelf-gap-1` sets (worked example 1 gives the 1200 px values). No new copy | None | A new play step on the shelf and `.ds-board` boxes (`getBoundingClientRect`), red on `641283a` (gaps 1 and 31), green on the PR head |
| 2 | The storybook test project, a board 360 px wide | A new Block library story (`Narrow`, designer's default for the name) renders and its play runs | The shelf meets `shelf-gap-1` (worked example 1 gives the 360 px values); the shelf title คลังบล็อก and the search field ค้นหาบล็อก stay inside the shelf | None | Its play, red on `641283a` with the new story added (gaps 1 and 31), green on the PR head |
| 3 | The storybook test project, a board with the shelf and the task bar (`งาน` / "Jobs") holding mock jobs | A new Block library story (`WithTaskBar`, designer's default for the name) renders and its play runs | The shelf meets `shelf-gap-1` and keeps the height above the bar that `shelf-rise-1` sets | None | Its play, red on `641283a` with the new story added (gaps 1 and 31), green on the PR head |
| 4 | The storybook test project | Block library `Default` and `WithTaskBar` render | The shelf sits at the same height above the board's bottom edge as today (`shelf-rise-1`) | None | A play step on the board bottom less the shelf bottom, green on `641283a` and on the PR head (a guard against the fix moving the shelf up or down) |
| 5 | The storybook test project | Block library `RecipesAndModes` renders and its play runs | Each of the six shelves meets `shelf-gap-1` inside its cell: neutral, professional and friendly, each in light and dark (`Matrix`, `PROFILE_IDS` in `src/profiles/index.ts`) | None | The extended play, red on `641283a`, green on the PR head |
| 6 | Storybook at a 1440 px board, light and dark, Thai and English | Block library `Default` and `WithTaskBar` open | The shelf meets `shelf-gap-1` (worked example 1 gives the 1440 px values), with the controls and the task bar where they are today | None | The designer's before and after screenshots and measurement (design.md), and a measurement on the PR head in the qa or designer report |
| 7 | The PR head | The Block library and Task bar story files and `recipes.test.ts` run | Every play and every recipe check passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/block-library src/components/task-bar` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes`, output in the builder's `verified`; the full suite at the G3 gate |

Rows 1, 2, 3, 5 and 6 are the owner's request (equal gaps at 360 and 1440, light and dark, with and without the task bar); row 4 holds the shelf's height; row 7 keeps the existing checks passing.

## Rules and bounds

### shelf-gap-1

On every board that holds the shelf, the gap from the shelf's left edge to the board's left edge and the gap from its right edge to the board's right edge differ by at most 1 px (sub-pixel layout). When the shelf is as wide as its `max-width` allows (the board width less 2 times `--ds-space-inset-md`), each gap is `--ds-space-inset-md`, 16 px under every registered profile (no profile file sets a space token). When the shelf is narrower, it is centred: each gap is half the board width less the shelf width. Values: worked example 1.

### shelf-rise-1

The fix moves the shelf sideways only. The distance from the board's bottom edge to the shelf's bottom edge stays what the recipe gives today: `--ds-size-control-md` plus 3 times `--ds-space-inset-md` without the task bar (`recipes.css` line 2935), and that plus the task bar lift `--_lift` with it (lines 3895 and 3905). Under the neutral profile: 88 px and 162 px (worked example 2).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

1. The two gaps of `shelf-gap-1`, today and after the fix. Inputs: the React Flow shift 15 px (`base.css` line 263), `--ds-space-inset-md` 16 px (`generated.css` lines 118 and 265), the shelf at its `max-width` (board less 32 px, `recipes.css` line 2934) in boards of 1440, 360 and 1200 px, and a narrower 1000 px shelf in a 1440 px board. Expected output, integers with no rounding: `1 31 1 31 205 235 16 16 16 16 220 220 16 16`, that is, today's left and right gaps at 1440, 360 and the narrow shelf, then the same three after the fix, then 1200 after the fix.

   ```bash
   node -e 'const pad=16,rf=15,max=W=>W-2*pad,gaps=(W,w,shift)=>{const l=W/2-shift-w/2;return [l,W-l-w]};console.log(...gaps(1440,max(1440),rf),...gaps(360,max(360),rf),...gaps(1440,1000,rf),...gaps(1440,max(1440),0),...gaps(360,max(360),0),...gaps(1440,1000,0),...gaps(1200,max(1200),0))'
   ```

2. The heights of `shelf-rise-1`. Inputs, neutral profile: `--ds-size-control-md` 40 px (`generated.css` lines 131 and 280), `--ds-space-inset-md` 16 px, `--cmp-taskbar-header-height` 40 px and `--cmp-taskbar-padding-y` 8 px (`generated.css` lines 1272, 1268, 116 and 264), and the 2 px of borders in `--_lift` (`recipes.css` line 3896). Expected output, integers with no rounding: `88 74 162`, that is, the height without the bar, the lift, and the height with the bar.

   ```bash
   node -e 'const control=40,inset=16,insetSm=8,header=40;const rise=control+3*inset,lift=header+2*insetSm+2+inset;console.log(rise,lift,rise+lift)'
   ```

## Rows per PR

The main session fills this section once the PR exists, one list line per PR in the form the result recorder reads (`scripts/ovl/result-recorder.mjs`).

## Out of scope

- Whether the shelf's left edge lines up with the controls' left edge, and whether the clipped row of cards gets end padding: design.md decides both, and a change they need is added to this spec only if it moves an AC row.
- The canvas controls, the minimap and the task bar themselves: their place does not change.
- Component API, token, profile and `apps/web` changes.
- The Inspector `Studio` story, which also holds the shelf: it follows from the same recipe rule and is not checked separately.
- Visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

1. A shelf and task bar story does not exist today (the Task bar `OnBoard` story has no shelf). Options: (a) add Block library `WithTaskBar`; (b) add the shelf to Task bar `OnBoard`. Default: (a), so the Task bar plays stay as they are.
2. The 360 px check. Options: (a) a Block library `Narrow` story with a 360 px wide board, run by the test project; (b) a measurement at a 360 px window only. Default: (a), so the check runs in CI.
3. The owner's AC draft in Jira ORV-190 was not read here (no Jira tool in this role). Default: the rows above stand, and the main session compares them with the draft before G3.

## Depends on

- `docs/specs/ORV-190/design.md`: the recipe CSS, the controls alignment and the cards row (written in parallel).
- `@xyflow/react` 12.12.0 `dist/base.css` lines 250 to 264: the panel margin and the centre shift the fix must offset.
- `DESIGN.md` §11, the design gate the reviewer walks at G3.
- `.claude/rules/testing.md`: a play fails on the real defect and asserts the rendered result.

## Changelog

- v1.0 (2026-10-31): first version, from the owner's request and measurement as the envelope carries them (no Jira tool in this role) and a read of `recipes.css`, `BlockLibrary.tsx` and `@xyflow/react` `base.css`. Downstream to review: the builder envelope for ORV-190, and design.md if its row numbers or story names differ from rows 2 and 3.
