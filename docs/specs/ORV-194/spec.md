---
issue: ORV-194 (https://tpetkaew.atlassian.net/browse/ORV-194)
lane: L by default (open question 1, row 6)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-194: UI polish batch 2, the 11 follow-ups of ORV-192

## Goal

The follow-ups that PR 169 (ORV-192, merged into `develop` as `18763ee`) left open, in one combined card and one PR, as the owner asked for small look comments (owner, 2026-10-31). Each row keeps its number from the ORV-194 Jira description. This role has no Jira tool, so the row texts below come from the sources that description names, read where they are recorded (open question 2):

- Rows 1 to 4, docs and test fixes: review finding F3 of ORV-192-review-3 (1), finding R4-2 of ORV-192-review-4 (2), finding R5-1 of ORV-192-review-5 with finding S1 of ORV-192-signoff-3 (3), and the ORV-192 spec lines 48 and 66 (4).
- Rows 5 to 10, look rows, each under `designer-first-1`: finding S1 of ORV-192-signoff-2 (5), the four designer notes that the ORV-192 spec lists under Out of scope (6 to 9), and finding ORV-189-QA1-S1 of ORV-189-qa-1 (10).
- Row 11, the local gate: `pnpm quality-gate` does not run `pnpm check:knowledge`, which CI runs. Out of scope here (`gate-file-1`).

Nothing here is simulated: the stories render the real components and the plays read the rendered page. No product behaviour, permission or stored data changes. No new UI string: the copy named below is today's story fixture copy.

## Acceptance criteria

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook docs page of `Base/ToggleGroup` (`base-toggle-group--docs`) | The page renders | The component description says the pressed item is a raised card chip with `text.primary` ink and a soft lift, no ring, as the catalog says (`catalog/base/toggle-group.yaml` line 18). Today it says "a raised card chip with a ring" (`ToggleGroup.stories.tsx` line 58). The description stays in English, as it is today; it is story docs text, not a locale catalog string | `ToggleGroup.stories.tsx` line 58 | `git grep -n "with a ring" -- packages/design-system/src/components/toggle-group` finds nothing; the docs page text read in the qa walk |
| 2 | The storybook test project, `Base/Toast` `Default` | The play focuses the toast root by keyboard | Nothing new (section "Rows that render nothing") | None | `expectFocusElevationForm` (`visual-asserts.ts` line 402) also asserts that the last shadow's colour is its `ink` at `focus.halo-opacity`, not only the shape `/ 0px 0px 0px 4px$/` (line 415). Red when `recipes.css` line 3693 goes back to `var(--_toast-shadow)` (the halo in `toast.fg`, finding R4-2), green on the PR head |
| 3 | The ORV-192 docs and the display rule | A reader looks up how far the highest Thai mark sits under the caption, and how far it rose before row 19 | Criterion 19 of `docs/specs/ORV-192/spec.md` says 8.5 px at 32 / 1.25 (was 9) and 6.5 px or more of ground (was 7; worked example 1); done in this task, spec v1.2. The same "6.5 px or more" replaces "7 px or more" in design.md of ORV-192 (lines 27, 1178, 1184, 1244), `DESIGN.md` line 141 and the comment at `packages/design-system/src/tokens/orivilo.css` line 57. No CSS value, token or play threshold changes (the play floor stays 4 px) | Docs and one CSS comment | `git grep -n -F "7 px or more" -- DESIGN.md docs/specs/ORV-192 packages/design-system/src/tokens/orivilo.css` finds nothing; `grep -n "6.5 px or more" docs/specs/ORV-192/spec.md` finds criterion 19 |
| 4 | `docs/specs/ORV-192/spec.md` | A reader checks whether the built rows still wait for the owner | Line 48 and the rule `pressed-cue-1` (line 66) say the owner approved the built rows live (ORV-192 comment 10406), with the rule `judge-built-1`; done in this task, spec v1.2 | Docs | `grep -n "10406" docs/specs/ORV-192/spec.md` finds lines 48 and 66; `grep -n "wait for the owner" docs/specs/ORV-192/spec.md` finds nothing |
| 5 | Storybook `Application/Block library` `Narrow`, a 360 px board, Thai, light and dark, the shelf open and the board status วางบล็อกแล้ว shown (story fixture, Thai only); and `Default` at 1440 with a status | The story renders | The status line covers no shelf tile: every tile name shows both its lines (today the status pill hides the second line of the first tile, finding S1 of ORV-192-signoff-2). Shelf and status keep 16 px over the canvas controls as row 2 of ORV-192 set. Goes to the designer first (`designer-first-1`) | `recipes.css` `.ds-board__status` or the shelf rules, as design.md of ORV-194 records | The `Narrow` play: the `.ds-board__status` box intersects no `.ds-shelf__tile` box (`getBoundingClientRect`), red on `18763ee`; the status clause of `expectClear` (`BlockLibrary.stories.tsx` line 105) changes only as design.md says; qa screenshots `application-block-library--narrow` at 360 and `--default` at 1440, light and dark |
| 6 | Storybook at 360, Thai: `Base/Toast` `At360` (title `fixtures.longThai` in `type.label.md`, 14 / 1.6), `Application/Dialog` `LongContentAt360` (title `fixtures.longThai` in `type.heading.sm`, 20 / 1.5), the side sheet title and the Missing inputs prompt question, light and dark, under neutral, Professional and Friendly | A title or question wraps to two or more lines | No Thai mark of a line touches the line above it: at least 1.5 px of ground between the lowest ink of one line and the highest ink of the next (the row 18 floor of ORV-192, its design.md line 1240). Today 0.5 px in the toast title and the prompt question, 0 px in dialog and sheet titles (ORV-192 design.md line 1086). Goes to the designer first (`designer-first-1`) | The fix design.md line 1086 names raises the `type.label.md` and `type.heading.sm` line heights, which changes control and header heights across the system: a semantic token value change (lane, open question 1) | A play per story through a `visual-asserts.ts` ink helper (the designer names it in design.md of ORV-194; `firstInkRow`, line 39, reads ink rows), with a Thai sample that puts a deep lower vowel over a tall stack (ORV-192 design.md used ฟู over ฟื้): the line gap is at least 1.5, red on `18763ee`; qa screenshots of the four at 360, Thai, light and dark |
| 7 | Storybook, every one-line label with an ellipsis: `.ds-shelf__name` in `Application/Block library` `Default`, the task bar job title in `Application/Task bar` `Running`, the shelf group titles, and the rest of the class that the designer lists from `recipes.css`; with a Thai name that starts ฟื้ or ปั้ | The label renders in one line | The whole stack shows: no top pixel of ฟื้ or ปั้ is cut by the label's own box (today about 1 px is lost at `type.label.md`, ORV-192 design.md line 1085). One fix for every route of the class. Goes to the designer first (`designer-first-1`) | `recipes.css` rules of the listed labels, as design.md of ORV-194 records | A play through a `visual-asserts.ts` ink helper: the first ink row of the label as shipped equals its first ink row with `overflow: visible` set on it, red on `18763ee`. `expectNoGlyphClip` cannot be the check, because a mark above the font ascent is outside every Range rect (its doc comment, line 480). qa screenshot of `.ds-shelf__name` at device scale 4, light and dark |
| 8 | Storybook `Base/Select` `RichAt360` and `LongOptionAt360`, a 360 px wide viewport, Thai, light and dark | The listbox opens | The open listbox stays inside the viewport on all four sides and scrolls inside itself when its options do not fit (today it runs past the viewport at 360, the designer's report to the main session; no line of ORV-192 design.md records it). Option labels unchanged. Goes to the designer first (`designer-first-1`) | `recipes.css` `.ds-menu` or the listbox content, as design.md of ORV-194 records; a new Select prop is a public API change (lane, open question 1) | The play of each story: the listbox box has `left >= 0`, `top >= 0`, `right <= innerWidth` and `bottom <= innerHeight`, and when `scrollHeight > clientHeight` it scrolls (`overflow-y` not `visible`), red on `18763ee`; qa screenshots at 360 by 640, light and dark |
| 9 | Storybook `Application/Dialog` `Open`, dark, under neutral, Professional and Friendly | The text in the dialog's field is selected (select all) | The selected text reads clearly on its highlight: at least 4.5 between the selected text colour and the highlight colour, in dark and in light. Selection keeps its own semantics; the brand accent never stands in for it. Goes to the designer first (`designer-first-1`) | A `::selection` rule in `recipes.css` or `orivilo.css` with existing `selection.*` tokens, as design.md of ORV-194 records; a new token is a contract change (lane, open question 1) | The play reads `getComputedStyle(field, "::selection")` `color` and `backgroundColor` and asserts `contrastRatio` (`src/foundations/contrast.ts` line 24) of the two is at least 4.5 under the three profiles in both modes, red on `18763ee`; or the pair in `pairs.ts` checked by `pnpm contrast`; qa screenshot of the selection, dark, at 1440 |
| 10 | The storybook test project, `Application/Block library` `Default` on a board 760 px tall and on one 900 px tall (the 1200 by 900 viewport) | The board fits its graph on first render | No node, port or edge label sits under the shelf: the graph fits into the board above the shelf (today the footer of the second node row, port บรีฟ and the edge label, runs under the shelf at 900 px, finding ORV-189-QA1-S1, and at 760 px, ORV-189 spec line 87). Goes to the designer first (`designer-first-1`) | `CanvasBoard.tsx` first fit (`fitViewOptions`, line 1070), as design.md of ORV-194 records; a new CanvasBoard prop is a public API change (lane, open question 1) | The play at both heights: the bottom of every `.react-flow__node` box is at or above the top of the shelf panel box, red on `18763ee`; qa screenshots `application-block-library--default` at 1200 by 900 and 1200 by 760, light and dark |
| 11 | `pnpm quality-gate` on a branch that adds a knowledge entry | The local gate runs | Not built in this card (`gate-file-1`): the gate runs format, commits, scripts, lint, secrets, codescan, typecheck, contrast, test, build and audit (`scripts/quality-gate.mjs` lines 20 to 43), and CI also runs `pnpm check:knowledge` (`.github/workflows/ci.yml` line 50) | None in this card | None in this card; the follow-up card holds the check |

## Rows that render nothing

- Rows: 2, 3, 4, 11

Row 2 changes a test helper, row 3 changes docs and one CSS comment, row 4 changes docs, and row 11 is not built here; none of them changes a pixel on any screen.

## Rows per PR

The main session adds the line `- PR <n>: rows 1-10` here once the ORV-194 PR is open; row 11 is in no PR of this card. Until that line exists, the qa recorder reads every row of the table.

## Rules and bounds

### designer-first-1

Rows 5, 6, 7, 8, 9 and 10 change how something looks, so each goes to `designer` before any builder envelope (`.claude/skills/ovl/SKILL.md`, step 6, "A look change in rework", L-0017). The designer records the fix, its values and the play in `docs/specs/ORV-194/design.md`, one section per row, with screenshots rendered with the proposed CSS injected, light and dark, at the widths each row's Given names. The builder states no CSS value that design.md does not hold. Where design.md tightens a Check, design.md holds and this spec is corrected with a version bump. A row whose fix needs a token or a component public API change says so in design.md, and the lane of open question 1 follows it.

### gate-file-1

Row 11's fix is a step in `scripts/quality-gate.mjs`. That file is not under `.claude/hooks/` or `scripts/ovl/`, but `write-guard` lists it as a guard file (`scripts/ovl/write-guard.mjs` lines 4, 37 and 45; `.claude/skills/ovl/SKILL.md` section 4), and in POC mode a guard changes only through a PR merged with the owner approval line (ORV-137 comment 10246). So row 11 is its own follow-up card, not part of this PR.

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

1. The clearance figure of row 3. Inputs: the caption box bottoms and the ink tops that ORV-192-signoff-3 S1 measured at 360 (`captionBottom 334.11`, `inkTopCss 340.81` for the 56 px row, `captionBottom 909.22`, `inkTopCss 915.92` for the 32 px row) and its 7.2 at 1440 (`.orivilo/runs/ORV-192/ORV-192-signoff-3/result.json`, finding S1 and the third check). Expected output: `6.7 6.7 6.5`, the two gaps rounded to one decimal half up, then the smallest gap rounded down to the half pixel, which is the figure the docs state.

   ```bash
   node -e 'const r=x=>Math.round(x*10)/10;const g=[340.81-334.11,915.92-909.22].map(r);console.log(g.join(" "),Math.floor(Math.min(...g,7.2)*2)/2)'
   ```

## Out of scope

- Row 11 (`gate-file-1`): a follow-up card adds a `knowledge` step running `pnpm check:knowledge` to `GATE_STEPS` in `scripts/quality-gate.mjs`, in the order CI runs it, with the owner approval line.
- The ToggleGroup pressed cue under 3:1 (ORV-192 rule `pressed-cue-1`), which the owner approved live in ORV-192 comment 10406.
- Wrapped display lines (ORV-192 design.md section "Open point, measured: wrapped display and heading lines"): display 56 and 32 at 1.7 is a separate owner call; row 6 covers `type.label.md` and `type.heading.sm` only.
- `apps/web`, visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

1. Lane. Options: (a) L, because row 6's only named fix changes the `type.label.md` and `type.heading.sm` line heights (semantic token values) and rows 8, 9 and 10 may add a prop or a token; (b) S, if design.md of ORV-194 records no token and no public API change for rows 5 to 10; (c) split row 6 into its own card so the rest stays S. Default: (a) until design.md lands, then the main session sets the lane in Jira.
2. Row texts. This role did not read the ORV-194 Jira description (no Jira tool). Options: (a) the rows above, mapped from the sources the description names, in that order; (b) the main session corrects any row whose text differs from the description. Default: (a), and the main session compares the two before G2.
3. Row 11 card. Options: (a) the main session opens it now as a guard-file card; (b) it waits for the next guard batch. Default: (a).

## Depends on

- `docs/specs/ORV-192/spec.md` v1.2: criterion 19, the rules `judge-built-1` and `pressed-cue-1`, and its Out of scope list (rows 3, 4, 6 to 9).
- `docs/specs/ORV-192/design.md`: lines 27, 1085, 1086, 1178, 1184, 1240, 1244 and line 215 (the dark Dialog selection note), and line 615 (the status line and shelf band).
- `docs/specs/ORV-189/spec.md` line 87 and finding ORV-189-QA1-S1 (row 10).
- The review records under the main checkout's `.orivilo/runs/ORV-192/`: `ORV-192-review-3`, `-review-4`, `-review-5`, `-signoff-2` and `-signoff-3` `result.json` (rows 1, 2, 3, 5).
- `packages/design-system/src/testing/visual-asserts.ts` and `.claude/rules/testing.md`: a play for a visual criterion goes through the shared helpers and fails on the real defect.
- `DESIGN.md` §4 (row 3) and the rule that brand never replaces selection semantics (`.claude/rules/design-system.md`, row 9).
- ORV-137 comment 10246 (`gate-file-1`).

## Changelog

- v1.0 (2026-11-01): first version, from the sources the ORV-194 Jira description names (no Jira tool in this role; open question 2). Rows 3 and 4 are done in the ORV-192 spec v1.2 in the same commit, except the row 3 lines outside that file. Downstream to review: the designer envelopes for rows 5 to 10, the builder envelopes for rows 1, 2, 3 and the design.md rows, the qa envelope (rows 1 to 10, with the `## Rows per PR` line), and the row 11 card.
