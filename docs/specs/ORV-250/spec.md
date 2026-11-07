---
issue: ORV-250 (https://tpetkaew.atlassian.net/browse/ORV-250), the loading half of ORV-223 (https://tpetkaew.atlassian.net/browse/ORV-223)
lane: L (as ORV-223)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
parent: docs/specs/ORV-223/spec.md v1.6, with docs/specs/ORV-223/design.md
version: 1.0
---

# ORV-250: Loading state (ORV-223 slice)

## Why

ORV-223 asks for one Empty state and one Loading state pattern, so a region with nothing in it and a region that waits read as the same product. The full reasoning is in the Goal of `docs/specs/ORV-223/spec.md` and applies here as written.

Open question 10 of the parent split that story into two PRs by default: the empty half first, then the loading half. PR 190 carried the first half and merged into `develop` (rows 1 to 26 and 44 to 50, `docs/specs/ORV-223/spec.md` "Rows per PR"). This issue is the second half, split out so LoadingState has its own acceptance, its own PR and its own qa walk (L-0016). It adds no requirement and no gate.

What is real and what is not, as the parent's Goal says it: LoadingState renders real markup and reads the locale catalog. Every stop action in the stories is mock, and no press in them runs anything. No screen in `apps/web` mounts CanvasBoard or LoadingState, so no Studio screen changes when this story ends. No screen reader test has been run, so `load-mount-1` and `load-board-1` rest on the W3C pages read, not on a measured announcement.

## Story

As a person using ORIVILO, when a region is waiting I see and hear that it is waiting, in my language, so I always know the product is working.

## What this story uses from ORV-223 (linked, not copied)

- **Spec:** `docs/specs/ORV-223/spec.md` v1.6: the Loading state benchmark, the `load-*` rules, the LoadingState, CanvasBoard, recipe, token and `decorative` rows of "Contract changes and impact", the `board.loading` and `spinner.loading` rows and the four loading fixture rows of "Copy", and W1, W3, W4, W5 and W6 of "Worked examples".
- **Design:** `docs/specs/ORV-223/design.md` (its `spec:` line reads v1.6): step 5 of the Flow, C2 for `loading-state.max-width`, C4, D12 to D14, the LoadingState column of the States table, the `load-*` rows of the builder table, LoadingState's markup, the `.ds-loading-state` and `.ds-board[data-loading] .ds-board__status` recipe text, the `loading-state.*` tokens, the story notes, the `application-loading-state` and `Loading` lines of "Screens to check in visual QA", and the Open points "Loading with the bar open", "A long action label" and "Screen reader". That screens list adds `LiveOff` and `LoadingAt360` to the screens of row 42, and the row stays as copied.
- **Gates:** G1 and G2 passed in ORV-223 comment 10514 and cover this slice, and C1 to C4 of design.md were accepted in ORV-223 comment 10520. G3 is raised on this issue.
- **Already on `develop` from PR 190:**
  - `EmptyState` and `EmptyStateProps`, the `ds-empty-state` recipe, the `empty-state.*` tokens, and `packages/design-system/catalog/application/empty-state.yaml`, whose rules already name `load-use-1`.
  - FeaturedIcon's `neutral` kind and `TaskBarProps.emptyAction`.
  - CanvasBoard's empty overlay, and the rise of design.md D15 and D16. Those rules select `.ds-board__overlay:has(> .ds-empty-state)`, so the loading overlay is not under them.
  - `emptyStateFixtures` in `packages/design-system/src/components/fixtures.ts`, which holds no loading fixture.
- **Also on `develop`, from before PR 190:** `Spinner` with `decorative` and `size="lg"`, `SkeletonGroup`, `Table`, `Matrix`, `MatrixBoard`, `Narrow`, `expectLinesClear`, `expectLabelInkWhole`, `expectFrameCutsNoInk`, the catalog keys `spinner.loading` and `board.loading`.
- **Not there yet, so this story adds it:**
  - `LoadingState`, `LoadingStateProps` and their export.
  - The `ds-loading-state` recipe, the tokens `loading-state.gap` and `loading-state.max-width`, and the `spinner.fg` pair in the place of "overlay text".
  - The four loading fixtures: label, action, done trigger, loaded content.
  - `packages/design-system/catalog/application/loading-state.yaml` and its `coverage.md` row, which reads `none` today.
  - CanvasBoard's loading overlay on LoadingState, its status line text, and the rule that hides that line while the board loads.
  - The leaving of `.ds-board__overlay > p`, `.ds-board__spinner` and the `SpinnerIcon` import of `CanvasBoard.tsx`.
  - The `decorative` wording in `Spinner.tsx` and `spinner.yaml`, and the `canvas-board.yaml` a11y line.
- **Order:** the PR title starts `ORV-250: ...`.

### Line numbers that moved

The parent's line numbers were read before PR 190 merged. The table gives the same place on `develop` at `e7c4b6d`. The rules and rows are unchanged: only the pointer moved. Paths are under `packages/design-system/`.

<!-- prettier-ignore -->
| Cited in the parent by | Target | Parent's line | Line on `develop` |
| --- | --- | --- | --- |
| Row 38 | `.ds-board` clip, `src/recipes/recipes.css` | 1514 | 1935 |
| Row 41, the impact list | Loading state row, `catalog/coverage.md` | 60 | 64 |
| `load-live-1` | "overlay text" pair, `src/recipes/pairs.ts` | 667 | 751 |
| `load-busy-1` | `aria-busy`, `src/components/canvas-board/CanvasBoard.tsx` | 1124 | 1155 |
| `load-board-1` | The status line, `src/components/canvas-board/CanvasBoard.tsx` | 1185 | 1221 |
| `load-board-1` | "One live region", `catalog/application/canvas-board.yaml` | 28 | 29 |
| The impact list | The overlays and the status line, `src/components/canvas-board/CanvasBoard.tsx` | 1173 to 1187 | 1204 to 1223 |
| The impact list | `Loading` story, `src/components/canvas-board/CanvasBoard.stories.tsx` | 118 | 578 |
| The impact list | `.ds-board__overlay p`, now `.ds-board__overlay > p`, `src/recipes/recipes.css` | 1596 | 2017 |
| The impact list | `.ds-board__spinner`, `src/recipes/recipes.css` | 1599 | 2020 |
| design.md, builder table | `data-loading`, `src/components/canvas-board/CanvasBoard.tsx` | 1127 | 1158 |
| design.md, builder table | The later status placement rules, `src/recipes/recipes.css` | 2490, 4240, 4261, 4271, 4278 | 2911, 4929, 4950, 4960, 5029 |
| design.md, Flow | `empty`, `src/components/canvas-board/CanvasBoard.tsx` | 1073 | 1104 |

Those five status rules still set only `bottom` and `position-anchor`, so the builder table's claim that they do not undo the hidden line holds on `develop`. The rule on `.ds-board__status:not(:empty)` at `recipes.css` line 4987 selects the empty form only.

## Acceptance criteria

Rows 27 to 43 keep their numbers from the parent at v1.6. Row by row:

- Rows 27 to 41 and row 43 keep the parent's wording, with no change. None of them asks for a part PR 190 already delivered, so no row drops anything.
- Row 42 differs in its Check cell only: it says ORV-250 where the parent says ORV-223, since this is the issue the sign-off reports on.

Rows 38 and 41 keep the parent's line numbers as copied. "Line numbers that moved" gives the lines on `develop`.

Everything these rows name from outside them is the parent's: row 5, named by row 27, is `docs/specs/ORV-223/spec.md` row 5, and W1, W3, W4, W5 and W6 are the parent's. The opening paragraph of the parent's Acceptance criteria gives the story ids, the locale of the plays, the rule on waits, what "the six boundaries" means, and what a 360 px frame is.

The rows keep the parent's short names. In full, from the repo root:

- `recipes.css`: `packages/design-system/src/recipes/recipes.css`. `recipes.test.ts`: `packages/design-system/src/recipes/recipes.test.ts`.
- `Skeleton.tsx`: `packages/design-system/src/components/skeleton/Skeleton.tsx`. `Table.tsx`: `packages/design-system/src/components/table/Table.tsx`. `Spinner.tsx`: `packages/design-system/src/components/spinner/Spinner.tsx`.
- `coverage.md`: `packages/design-system/catalog/coverage.md`. `canvas-board.yaml`: `packages/design-system/catalog/application/canvas-board.yaml`. `spinner.yaml`: `packages/design-system/catalog/base/spinner.yaml`. `catalog/application/loading-state.yaml`: `packages/design-system/catalog/application/loading-state.yaml`.
- The `src/` paths of row 43's commands are read from `packages/design-system`, where `pnpm --filter @orivilo/design-system exec` runs them.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 27 | Storybook test project, neutral profile, light, Thai | LoadingState `Default` renders with no props | A turning ring with "กำลังโหลด" under it | None. One `role="status"` holding "กำลังโหลด"; the svg is `aria-hidden="true"` (`load-live-1`) | `Default` play: `getAllByRole("status")` length 1 with that text; ring width equals W1's `ring` to 0.5 px; label's top under the ring's bottom; the cap of `load-live-1`: the parent and the width as row 5, on the `.ds-loading-state` root against `--cmp-loading-state-max-width` |
| 28 | Same | LoadingState `WithAction` renders the loading fixture; the person presses "หยุดโหลด" | "กำลังอ่านบรีฟ" under the ring and the button "หยุดโหลด" below | The story's `fn()` is called once. The status holds "กำลังอ่านบรีฟ" and not the button's name | `WithAction` play: status `textContent`; button found by name outside the status; gap equals W5's `md` to 0.5 px |
| 29 | Same | LoadingState `LiveOff` renders `Default` and `live="off"` side by side | The same ring and words twice | None. The `off` root holds no role and the words in a `p` (W3) | `LiveOff` play: `queryAllByRole("status")` length 1, from the `Default` half; ring and label sizes of the two halves equal to 0.5 px |
| 30 | Same | LoadingState `InRegion`: a host region with `aria-busy="true"` shows LoadingState; the person presses "โหลดเสร็จ" | The ring and "กำลังอ่านบรีฟ", then "บรีฟพร้อมแล้ว" | None. `aria-busy` is `true`, then absent on the region (`load-busy-1`); LoadingState's root has no `aria-busy` | `InRegion` play on the attribute before and after |
| 31 | Same, English | LoadingState `InEnglish` renders the states of rows 27, 28 and 29 | "Loading"; "Reading the brief" with "Stop loading"; "Loading" with no role | None | `InEnglish` play |
| 32 | Storybook, a 360 px frame | LoadingState `LongAt360` renders `fixtures.longThai` as `label` with the action | The label wraps under the ring, centred, nothing cut | None | `LongAt360` play: frame `scrollWidth` not above 360; every ancestor of the label up to the frame (`.ds-spinner`, `.ds-loading-state`, any story wrapper) has computed `overflowX` and `overflowY` `visible`; `expectLinesClear` on the label, which wraps; `expectFrameCutsNoInk(label, frame)` |
| 33 | Storybook test project | LoadingState `RecipesAndModes` renders through `Matrix` | The ring, the label and the action in the six boundaries | None. The pair of `load-live-1` passes at its floor | `RecipesAndModes` play: counts as W4; `recipes.test.ts` proves the contrast |
| 34 | The PR head | `pnpm typecheck` runs on the story file | Not a screen | `@ts-expect-error` lines hold for `live="alert"`, a `size` prop and a `children` prop (`load-api-1`) | `pnpm --filter @orivilo/design-system typecheck` output |
| 35 | Storybook test project, neutral profile, light, Thai | CanvasBoard `Loading` renders | The ring and "กำลังโหลดกระดาน" once, centred on the board, with no status pill | None. Region `aria-busy="true"`; exactly one `role="status"` in the region, holding "กำลังโหลดกระดาน", at the hidden box of `load-board-1` | `Loading` play (updated): `getAllByRole("status")` length 1 and its text; its bounding box 1 by 1 px; the overlay label visible |
| 36 | Same | CanvasBoard `LoadingFinishes`: a host outside the region starts with `loading`; the person presses "โหลดเสร็จ" | The overlay goes and the board shows its fixture nodes | None. The status node is the same DOM node before and after; its text is empty after; `aria-busy` is absent (W6) | `LoadingFinishes` play: node identity, `textContent`, attribute |
| 37 | Same, English | CanvasBoard `LoadingInEnglish` renders row 35 | "Loading the board" under the ring | None. The status holds the same words | `LoadingInEnglish` play |
| 38 | Storybook, a 360 px frame | CanvasBoard `LoadingAt360` renders row 35 | The ring and words centred in the frame | None | `LoadingAt360` play: frame `scrollWidth` not above 360; every ancestor of the label up to the board root (`.ds-loading-state__quiet`, `.ds-loading-state`, `.ds-board__overlay`) has computed `overflowX` and `overflowY` `visible`; the root `.ds-board` is the one clip inside the frame (`recipes.css` line 1514), so the label's box lies inside its padding box; `expectLabelInkWhole` on the label, which is one line at this width; `expectFrameCutsNoInk(label, root)` |
| 39 | Storybook test project | CanvasBoard `LoadingRecipesAndModes` renders row 35 through `Matrix` and `MatrixBoard` | The loading board in the six boundaries | None | `LoadingRecipesAndModes` play: counts as W4 |
| 40 | The PR head | A diff and the existing plays run | Not a screen | `Skeleton.tsx` and `Table.tsx` are unchanged and `Spinner.tsx` changes only its comment (`load-mount-1`); `base-spinner`, `base-skeleton` and `application-table` plays stay green | `git diff origin/develop --stat -- packages/design-system/src/components/skeleton/Skeleton.tsx packages/design-system/src/components/table/Table.tsx` prints nothing; the row 43 run |
| 41 | The PR head | `check-catalog` and the i18n checks run | Not a screen | `catalog/application/loading-state.yaml` (story `application-loading-state`, status `draft`, states `[status, live-off, with-action]`, recipes neutral, professional, friendly) resolves and its rules name `load-busy-1`, `load-mount-1` and `load-use-1`; `coverage.md` line 60 reads draft; `canvas-board.yaml` and `spinner.yaml` carry `load-board-1` and `load-live-1`; no middot or em dash | `pnpm --filter @orivilo/design-system test` output |
| 42 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens LoadingState `Default`, `WithAction`, `LongAt360`, `RecipesAndModes`, CanvasBoard `Loading` | A wait that reads as the same product as the empty forms, on the board ground and on a card, in both modes | None | Designer visual sign-off, its PNG paths posted as a Jira comment on ORV-250 by the main session |
| 43 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/loading-state src/components/canvas-board src/components/spinner src/components/skeleton src/components/table` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n src/tokens`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

## Rows that render nothing

- Rows: 34, 40, 41, 43

Row 34 is a type check, row 40 is a diff, row 41 is catalog and copy checks, and row 43 is test runs.

## Rows per PR

The main session adds this PR's line here when it opens (the parent's open question 11).

## Rules and bounds

This story adds no rule. Each loading rule keeps its one home in "Rules" of `docs/specs/ORV-223/spec.md`, and the list names what each one covers:

- `load-api-1`: the public component and its props.
- `load-live-1`: who speaks, and the recipe, tokens and pair of the column.
- `load-busy-1`: `aria-busy` on the region that waits.
- `load-mount-1`: the order of status and message.
- `load-board-1`: CanvasBoard's loading overlay and its status line.
- `load-use-1`: which waiting form to use, and the catalog text that says so.

The rows also read `spin-live-1` and `spin-motion-1` of ORV-201, which this story changes in no way. `empty-board-1` of the parent says which overlay its rise applies to.

## Out of scope

- All of the parent's Out of scope, as written.
- Rows 1 to 26 and 44 to 50, which merged in PR 190.
- Any change to `EmptyState`, `FeaturedIcon`, `TaskBar`, or the empty form's rules in `recipes.css`.
- The loading overlay's place with the task bar's panel open: open question 1 below.

## Open questions (with defaults)

1. Loading with the bar open. design.md's Open points leave this to the loading PR: `load-board-1` keeps the board's centre, so at 900 by 420 the label would overlap the open card, by the 18.3 px design.md measured on the head's overlay and not on LoadingState. Options: (a) leave the loading overlay as `load-board-1` and `empty-board-1` have it, and take the overlap as a named cost, with no row; (b) widen design.md D16 to the loading overlay, which is a new requirement with new rows, so it needs a parent spec change and a card of its own. Default: (a), since this issue adds no requirement, D15's note not to widen the selector stands, and no story or screen pairs a loading board with an open bar.

The rest stay in the parent's Open questions, and their defaults hold:

- 3 (mount order, and `aria-busy` around a status): default in `load-mount-1` and `load-board-1`.
- 5 (the reading of "Both show an action"): default (a), with the slot in `load-api-1`.
- 10 (PR size): this issue is the second PR of its default.
- 11 (the Rows per PR lines): for this PR, see "Rows per PR" above.

## Depends on

- `docs/specs/ORV-223/spec.md` v1.6 and `docs/specs/ORV-223/design.md`, with the K entries, `DESIGN.md` sections and rule files listed in the parent's Depends on.
- ORV-223 comment 10514 (G1 and G2) and comment 10520 (C1 to C4 accepted).
- PR 190 (`EmptyState`, the board's empty overlay and its rise), merged into `develop`.
- ORV-201 (Spinner and Skeleton): `spin-live-1`, `spin-motion-1`.
- ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms).
- L-0016 (a slice with its own issue has its own spec).
- ADR 0003 (Storybook and catalog, no shadcn classes), ADR 0012 (gates).

## Worked examples

This story derives no number and adds no method. W1 (row 27), W3 (row 29), W4 (rows 33 and 39), W5 (row 28) and W6 (row 36) stay in "Worked examples" of `docs/specs/ORV-223/spec.md`.

## Changelog

- v1.0 (2026-11-07): slice spec split from ORV-223 spec v1.6 (L-0016). Rows 27 to 43 copied with their numbers and no new requirement; row 42 names ORV-250 for its Jira comment. "Line numbers that moved" maps the parent's pointers to `develop` at `e7c4b6d`. Open question 1 records the point design.md left to the loading PR, with the default of no change. No Jira tool in this role, so ORV-250 and the G1 and G2 comments were not read; their content comes from the envelope facts and the parent. Downstream to review: the builder envelope (rows 27 to 43, one PR), the qa envelope (the Rows per PR line once the PR exists), and the parent spec, which does not name ORV-250 yet.
