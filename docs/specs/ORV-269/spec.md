---
issue: ORV-269 (https://tpetkaew.atlassian.net/browse/ORV-269)
lane: S (no risk flag: test code only)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-269: the Select "Label Centre" play stops failing on CI, with the 0 px bar kept

## Goal

This is not a hook on a tool call, so the guard frame of L-0012 does not apply.

The play of `LabelCentre` in `packages/design-system/src/components/select/Select.stories.tsx` (line 219) fails on CI with `<span> cuts 5 px of its Thai stack above the clip box: expected 5 to be +0`. The message comes from `expectLabelInkWhole` in `packages/design-system/src/testing/visual-asserts.ts` (line 1276), which the play calls at line 247 on the value span of the English sm trigger of row 0, with the sample `markStack`. It failed in both attempts of run 42368048817 (develop `fb69719`) and in the first attempt of runs 42364558282 (`bede3e6`) and 42365491388 (`243ff66`), whose reruns passed. The last green develop run was at `fc49b40` (PR 202, ORV-252), which changed `visual-asserts.ts`.

After this story the play passes on CI on its first attempt, and it still fails when a mark really is cut. The fix is test code only. The bar does not move: it is `label-ink-bar-1`.

What is real: the check compares two real screenshots, pixel by pixel. Nothing here is AI and nothing is simulated. The story renders no user text that this story adds, so no Thai or English copy changes.

## Rules and bounds

### label-ink-bar-1

What must not loosen, in `expectLabelInkWhole` and its call in the Select play:

- The cut assertion stays `expect(cut, ...).toBe(0)`: no tolerance in px, no speck rule (`firstInkCut` and `SPECK_*` stay out of this helper), and no retry, `expect.poll` or `waitFor` around the cut assertion itself.
- `reach` stays 8, `INK_DISTANCE` stays 48, and `clipEdgeRow` and `inkCutAbove` keep their arithmetic.
- The Select play still passes `markStack` (`"ฟื้ปี๊ปุ่มสั่งซื้อฟูปู่"`) on the same trigger, in both modes.
- No `retry` option is added to the story, the Vitest config or the CI workflow.

### settle-wait-1

The fix waits for a condition before a shot, never for a fixed time (`.claude/rules/testing.md`, "Wait for conditions, never for fixed time"). A condition is something the page reports, such as `document.fonts.load(<the clone's font>, sample)` resolving, `document.fonts.status === "loaded"`, every animation of `scope.getAnimations({ subtree: true })` finished, or the clone's `getBoundingClientRect()` equal across two animation frames. No `setTimeout`, `sleep`, `waitForTimeout` or delay in ms is added.

## Acceptance criteria

Every row renders nothing new: the story's look stays as it is. The checks are commands, CI runs and the PR body.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The failing logs of the four runs named in Goal | The builder reads them and runs the play with the failure message extended (open question 2) | No UI | The PR body states which assertion fails (file and line), in which mode cell, and one cause from this closed list, with evidence: (a) the font for the sample was not loaded at the first shot, (b) the clone or its scope moved between the two shots, (c) a transition or animation ran between the shots, (d) a real cut of `markStack` by the shipped clip. The evidence names the differing row of each shot, `document.fonts.status`, the count of running animations, and the clone's rect in both shots, from a log line with its run id or a local run | The cause line in the PR body; the reviewer reads the cited log line |
| 2 | The cause of row 1 | The builder reads what changed since the last green run | No UI | The PR body says whether PR 202 or a later merge changed this path, from `git diff 5412841 fc49b40 -- packages/design-system/src/testing packages/design-system/src/components/select` and `git diff --stat fc49b40 fb69719 -- packages/design-system`, quoting the hunk that matters or saying "none" | The two commands, quoted in the PR body |
| 3 | Cause (a), (b) or (c) | The fix lands | No UI | The helper or the play waits per `settle-wait-1` before each shot | `git diff origin/develop -- packages/design-system/src` shows no added line matching `setTimeout\|sleep\|waitForTimeout\|delay` |
| 4 | The PR head | The diff is read | No UI | `label-ink-bar-1` holds | `grep -n "toBe(0)" packages/design-system/src/testing/visual-asserts.ts` still shows the cut assertion; `grep -n "markStack" packages/design-system/src/components/select/Select.stories.tsx` still shows the constant and the call; `git diff origin/develop` adds no `retry`, `expect.poll` or `SPECK_` in `expectLabelInkWhole` |
| 5 | The fix of row 3 and a scratch mutant that forces the cause back: for (a) a `FontFace` for the sample whose load resolves only after the first shot, for (b) the clone's parent moved by 1 px in the animation frame after the clone is put in, for (c) a border colour transition started just before the first shot | The Select play runs on the mutant, once with the fix and once with the fix's wait taken out | No UI | With the wait taken out, the play is red with the `cuts N px` message. With the fix, it is green. The mutant is not committed | Two runs per mutant of the stated cause, quoted with their red and green lines, one `verified` row each |
| 6 | The fix of row 3 and a scratch mutant that makes a real cut: the clone's `padding-top` set to 0 and its `line-height` to 1 | The Select play runs | No UI | Red with the `cuts N px` message, N above 0, so the fix still sees a real cut. The mutant is not committed | One run, quoted with its red line |
| 7 | The PR head | `pnpm --filter @orivilo/design-system exec vitest run --repeats 4 src/components/select/Select.stories.tsx` runs | No UI | Every test of the file passes in all 4 repeats | The command and its pass count |
| 8 | The PR head changes `visual-asserts.ts` | The other callers run | No UI | Each file that calls `expectLabelInkWhole` passes once: `src/testing/visual-asserts.stories.tsx`, and in `src/components/`: `confirm-dialog/ConfirmDialog`, `block-library/BlockLibrary`, `top-navigation/TopNavigation`, `calendar/Calendar`, `task-bar/TaskBar`, `alert/Alert`, `canvas-board/CanvasBoard`, `file-upload/FileUpload`, `featured-icon/FeaturedIcon`, `node-group/NodeGroup`, `tag/Tag`, `breadcrumb/Breadcrumb` (each `.stories.tsx`), plus `src/testing/visual-asserts.test.ts`. This list is the output of `grep -rl "expectLabelInkWhole(" packages/design-system/src` at the spec's base, less the helper and the Select file | `pnpm --filter @orivilo/design-system exec vitest related --run src/testing/visual-asserts.ts` and its pass count; the builder re-runs the grep and reports any file the list misses |
| 9 | Cause (d), a real cut | The builder finds it | No UI | No fix lands in this story. The builder reports `blocked` with the two shots and the cut rows, and changes no component, recipe or token. A real cut is a look change: it goes to the designer first, and this spec gets a new version | The builder's report `blocked_on` |
| 10 | The PR head | The diff is read | No UI | No change to the Select component, its recipe or tokens | `git diff --stat origin/develop` lists only paths under `packages/design-system/src/testing/` and `packages/design-system/src/components/select/Select.stories.tsx`, plus this spec |
| 11 | The PR is open | CI runs on the PR head | No UI | The Storybook test job passes on its first attempt | The run id and its attempt number in the PR body |
| 12 | The PR head | The gate runs | No UI | All checks pass | `pnpm lint && pnpm typecheck && pnpm test && pnpm build`; `pnpm --filter @orivilo/design-system exec vitest run --testTimeout=400` and its count |

## Rows per PR

- PR 207: rows 1-12

## Rows that render nothing

- Rows: 1-12

The story changes test code only. Rows 1 and 2 are evidence in the PR body, rows 3 to 10 are commands and scratch runs, and rows 11 and 12 are CI and the gate.

## Worked examples

**The 5 px of the failure message (rows 1 and 6).** Input: `INK_DISTANCE`, `distance`, `clipEdgeRow` and `inkCutAbove` copied from `packages/design-system/src/testing/visual-asserts.ts` (lines 16, 18, 1193 and 1216), and `reach = 8` from line 1232. Two values are assumed, since no shell read them: the clone's `border-top-width` 0 (a value span has no border) and a device pixel ratio of 1. The shots are a fixture of 24 rows of 4 white pixels, and the visible shot has black ink in row 3. Output: the edge row and the cut, whole numbers, so no rounding applies beyond the `Math.round` of `clipEdgeRow`. This line was not run (not run, no shell). The builder runs it, reads the real border and scale in row 1, and reports any difference.

```bash
node -e "const INK_DISTANCE=48;const distance=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]);const clipEdgeRow=(reach,borderTop,dpr)=>Math.round((reach+borderTop)*dpr);const inkCutAbove=(s,v,aboveRow,dpr)=>{for(let y=0;y<Math.min(aboveRow,s.length,v.length);y++){const a=s[y]??[];const b=v[y]??[];if(b.some((px,x)=>a[x]&&distance(px,a[x])>INK_DISTANCE))return(aboveRow-y)/dpr}return 0};const W=[255,255,255],K=[0,0,0];const shipped=Array.from({length:24},()=>[W,W,W,W]);const visible=shipped.map((r,y)=>y===3?[W,K,K,W]:r);const edge=clipEdgeRow(8,0,1);console.log(edge,inkCutAbove(shipped,visible,edge,1))"
```

Expected: `8 5`. So a cut of 5 reads as ink in the visible shot 5 CSS px above the clone's clip edge, 3 px under the top of the region, where the shipped shot has none. At a ratio of 2 the same cut would sit in device row 6 of an edge at 16.

## Out of scope

- Any change to the Select component, its recipe, `component.json`, `semantic.json` or a profile (row 10). A real cut goes to the designer (row 9).
- `firstInkCut`, `expectFrameCutsNoInk` and their speck rule from PR 202, unless row 2 shows that change is the cause.
- Other flaky plays. A caller of row 8 that fails for its own reason gets its own issue.
- The English trigger's 1.75 px off-centre reading on Linux (ORV-199 `field-sm-sweep-1`).

## Open questions (with defaults)

1. **Where the wait lives.** Default: inside `expectLabelInkWhole`, before each shot, since all 13 other callers of row 8 take the same two shots and can hit the same race. Option: in the Select play only, if row 1 shows the cause is in that story's layout.
2. **Evidence on a Mac.** Chromium on macOS rasters and loads fonts differently from the Linux runner, so the failure may not repeat locally. Default: the builder extends the failure message of the cut assertion with the differing row, `document.fonts.status`, the running animation count and both rects, and keeps it, so any CI failure carries its own evidence. The bar of `label-ink-bar-1` is unchanged by a longer message.
3. **More than one cause.** Default: if row 1 finds two causes from the list, both are fixed in this PR, each with its own mutant in row 5.

## Depends on

- PR 202 (ORV-252), which changed `visual-asserts.ts`; `docs/specs/ORV-252/spec.md`.
- ORV-194 row 7 and ORV-205, where `expectLabelInkWhole` and `clipEdgeRow` come from; ORV-199 row 6 and `field-sm-sweep-1`, where `markStack` and the sweep come from.
- `.claude/rules/testing.md`: wait for conditions, `--repeats 4` for a flaky file, never loop the full suite (L-0009), the visual check through the shared helpers (L-0018), and `--testTimeout=400`.

## Changelog

- v1.0 (2026-11-07): first version. Task `ORV-269-spec-1`. Downstream to review: the builder envelope, and the qa envelope once "Rows per PR" names the PR number.
