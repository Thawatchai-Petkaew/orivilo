---
issue: ORV-205 (https://tpetkaew.atlassian.net/browse/ORV-205)
lane: S (a flaky test; no token, recipe or component change unless row 5 applies)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-205: the TaskBar Running play gives the same verdict on every CI run

## Goal

Storybook story Base/Task bar, `Running` (`packages/design-system/src/components/task-bar/TaskBar.stories.tsx`, lines 102 to 129) ends its play with `expectLabelInkWhole` on the first `.ds-taskbar__progress .ds-progress__label` (ORV-194 row 7). On CI that check sometimes fails and sometimes passes on the same code. A check that flips teaches the team to rerun red runs, so it stops guarding anything.

The goal has two halves, and the fix must keep both (rule `taskbar-verdict-1`):

1. The play gives the same verdict on every CI run of the same head.
2. The play still goes red when the label's clip box really cuts the Thai marks above the line.

Nothing in this issue is simulated: the play reads real screenshots in Chromium through Vitest browser mode. The task bar jobs in the story are mock data, as the story already says.

## What is known

- The failure line, from CI: `cuts 2 px of its Thai stack above the label line` (`visual-asserts.ts` line 1234, the second `expect` of `expectLabelInkWhole`).
- Failed: PR 175, run 41283990380, TaskBar `Running` failed in both attempts with that line (envelope fact, checked against <https://github.com/Thawatchai-Petkaew/orivilo/actions/runs/41283990380>).
- Passed: develop run 41282025377 at `d55c46c` (envelope fact, <https://github.com/Thawatchai-Petkaew/orivilo/actions/runs/41282025377>). ORV-205 in Jira lists the other runs; this role has no Jira tool, so the builder reads that list there.
- The play never fails on the Mac (envelope fact). CI runs on Linux.
- How the helper reads the label (`visual-asserts.ts` lines 1194 to 1238): it puts a shallow clone of the label, holding `ฟื้ปั้ปี๊ฟื้`, after the label; shoots a region from 8 px above to 8 px below the clone twice, once as shipped and once with `overflow: visible` inline; sets the line at `Math.round((8 + paddingTop) * scale)`; and `inkCutAbove` (lines 1169 to 1183) reports the distance from the first row above the line where any pixel differs between the two shots by more than `INK_DISTANCE`. Any pixel that changes between the two shots for another reason counts as a cut.
- The recipe the label gets (`packages/design-system/src/recipes/recipes.css`): `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` (lines 4149 to 4153) and `padding-block: var(--ds-space-inline-sm); margin-block: calc(-1 * var(--ds-space-inline-sm))` (lines 4689 to 4693, shared with `.ds-chat__option > span:first-child`).
- The story renders three jobs: a known length, a value past the maximum, and an unknown length (`fixtureJobs.runningUnknown`), whose progress moves (the `RunningReducedMotion` story exists because the recipe switches a sweep and a retry spinner off under reduced motion).

## Builder's first task

Before any fix, find why the reading of `expectLabelInkWhole` on `span.ds-progress__label` changes between runs, from a read of the play, the progress and task bar recipe and the helper, and name the cause with evidence (rule `taskbar-cause-1`). The cause is not known. Candidates to rule in or out, none assumed:

- Something in the shot region that changes between the two shots for a reason other than `overflow` (motion from the job rows, a caret, a transition, a scrollbar).
- The Thai font not yet loaded, or a different fallback, when one shot is taken and loaded for the other.
- Rounding of the line row (`Math.round` on a fractional `paddingTop` or a fractional box top on Linux) that puts the line one or two rows off, so rows of the label's own line count as "above".
- A real clip: on Linux the font's marks reach past the padding the recipe gives, so the clip box does cut 2 px on some layouts.

## Rules

### taskbar-cause-1

The cause counts as named when the PR body states it in one sentence and shows evidence that it explains both the red and the green runs: a reading on the failing setup (the CI log of a debug run, or a Linux run such as the Playwright Linux image) that shows the differing rows and what drew them, and the same reading after the fix. A fix whose cause is "timing" with no reading of what changed between the two shots is not a named cause.

### taskbar-verdict-1

The fix keeps both halves of the Goal. It must not make the check pass by widening `INK_DISTANCE`, lowering the bound of 0, retrying the assertion until it passes, skipping the check on CI or on Linux, or removing the `expectLabelInkWhole` call. A fix inside `expectLabelInkWhole` or its helpers holds for every play that calls them, so the builder runs every story file that calls the helper (search `expectLabelInkWhole` under `packages/design-system/src`).

## Acceptance criteria

<!-- prettier-ignore -->
| # | Given | When | What the user sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The head of the ORV-205 branch | The builder reads the play, the recipe lines above and `expectLabelInkWhole` and takes the reading on the failing setup | No UI; the PR body | The PR body names the cause by `taskbar-cause-1` | The reviewer finds the one-sentence cause and its before and after readings in the PR body |
| 2 | The fix | `pnpm --filter @orivilo/design-system exec vitest run --project storybook --repeats 4 src/components/task-bar/TaskBar.stories.tsx`, then, when the fix touches the helper, the same command on each other story file that calls `expectLabelInkWhole` (on `d55c46c`: `tag/Tag.stories.tsx`, `node-group/NodeGroup.stories.tsx`, `block-library/BlockLibrary.stories.tsx`) | No UI | None | Every run passes, every repeat, and the PR body pastes the summary lines. The Mac never failed, so this row alone does not prove the flake gone; row 4 does |
| 3 | The fix, plus a scratch mutation that cuts the marks: in `recipes.css` the `.ds-taskbar__progress .ds-progress__label` selector is taken out of the rule at lines 4689 to 4693, so the label has no block padding and `overflow: hidden` cuts the stack | The row 2 command runs on the TaskBar file without `--repeats` | No UI | The mutation is restored before the commit | The `Running` play fails with `cuts N px of its Thai stack above the label line`, N above 0, and passes once restored. Both outputs go in the PR body (`taskbar-verdict-1`, half 2) |
| 4 | The PR's head on GitHub | CI runs, and the main session reruns the same head once (attempt 2) | No UI | None | Both CI attempts on the same head pass, with their run ids and attempt numbers in the PR body. The failing run 41283990380 failed in both attempts, so two green attempts are the bar |
| 5 | Only if row 1 names a real visual clip on Linux (the recipe's padding does not hold the marks of the real font) | The builder changes the recipe for the label so the marks fit, through semantic or component tokens only (`.claude/rules/design-system.md`) | Storybook Base/Task bar `Running` and `RecipesAndModes` show the job title `ฟื้ ปั้ ปี๊` with its whole stack of marks, at 360 px and at full width, in light and dark | The recipe change; if it is in the shared rule at lines 4689 to 4693, the chat option is in its impact list | A designer signs off on screenshots of those stories, Thai and English, both modes; rows 2 to 4 pass on the changed recipe. When row 1 names a cause that is not a visual clip, this row is not applicable and the PR says so |

## Rows per PR

The ORV-205 PR is not open yet; the main session writes its number into this line when it opens.

One PR for rows 1 to 5; the main session adds the PR line when the PR opens.

## Rows that render nothing

- Row 1: a reading and a sentence in the PR body.
- Row 2: test runs.
- Row 3: a scratch mutation and test runs.
- Row 4: CI runs.

Row 5 renders, when it applies, and needs its screenshots.

## Out of scope

- Other flaky tests, unless the cause of row 1 is in a helper they share; then only that helper's change, by `taskbar-verdict-1`.
- Any change to the bound, `INK_DISTANCE`, the sample or the region reach of `expectLabelInkWhole` made only to turn the play green.
- A token, profile or component API change. A recipe change only under row 5.
- Visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

1. The full list of failing and passing runs is in Jira ORV-205, which this role cannot read. Default: the builder reads it and cites at least one failing and one passing run id in the PR body next to the row 1 reading.
2. How to reproduce on Linux when the Mac never fails. Options: (a) the Playwright Linux container locally; (b) a debug commit on the PR that logs the differing rows from CI. Default: (a) when Docker is available, else (b), with the debug code removed before the merge.
3. If row 5 applies, the lane may need to move from S to M (a visual recipe change). Default: the main session re-checks the lane when row 1 names a visual clip, before the builder changes the recipe.

## Depends on

- `docs/specs/ORV-194/spec.md` row 7, the check this play carries.
- `packages/design-system/src/testing/visual-asserts.ts` lines 1162 to 1238, `inkCutAbove` and `expectLabelInkWhole`.
- `.claude/rules/testing.md`: a test fails on the real defect; a flaky fix repeats the affected file with `--repeats 4`; wait for conditions, never for fixed time.
- `DESIGN.md` §11, the design gate, for row 5 only.

## Changelog

- v1.0 (2026-11-01): first version, from the envelope facts (failure line, run 41283990380 failed in both attempts, run 41282025377 at `d55c46c` passed, the Mac never fails) and a read of the play, the recipe and the helper. No Jira tool in this role. Downstream to review: the builder envelope for ORV-205 (rows 1 to 5, rules `taskbar-cause-1` and `taskbar-verdict-1`) and the qa envelope (Rows per PR, Rows that render nothing).
