---
id: L-0018
date: 2026-10-25
issue: [ORV-107]
what_happened: In ORV-107 the plays and a reviewer probe passed three visual defects the owner then saw by eye, a 1 px border plus a 1 px outline drawn as one 2 px edge, a gone chip three lines tall beside one-line chips, and a Thai title clipped at the chip's curved edge; the double edge alone took six tasks and 1,843,982 tokens after review-7 approved it.
cause: Each play asserted the one CSS property its fix set (outline width, a box against the wrong ancestor), so it passed whenever the CSS was as written; no shared helper measures what the user sees, the total ink drawn at an edge, a chip's height against its siblings, or glyph ink inside a rounded clip.
rule: A visual criterion about an edge, a height or text that must show is asserted on the rendered result through shared play helpers (edge ink, sibling height parity, glyph clip inside the rounded box, with a Thai sample that has stacked marks), each seen to fail once on the ORV-107 head that had the defect, and a builder change to an edge adds a pixel column at 4x to its L-0015 probe.
---

## What happened

Numbers from `.orivilo/metrics/orv-107-retro.md` (`node scripts/ovl/metrics.mjs report ORV-107`) and the per-task figures in `.orivilo/metrics/ORV-107.json`. Findings, heads and probe output come from each task's `result.json` under `.orivilo/runs/ORV-107/<task_id>/`.

| defect                       | the check that passed it                                                                                                                                                                                                          | found by                                                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| gone words clipped (round 3) | `expectGoneWordsWhole` compared the words' scrollWidth with their own clientWidth and their box with the `li`, not the clipping `.ds-tag__label`; accepted a title 0 px wide. Green in the gate, 2,709 tests passed, at `9c13983` | ORV-107-qa-2, F2 Important, from boxes and screenshots                                                                                                                      |
| three-line chip (round 4)    | no play compared the gone chip's height with a normal chip; label height 59 in English against 39 in Thai                                                                                                                         | ORV-107-review-4 measured it but judged it a spec mismatch; the owner saw an oval                                                                                           |
| Thai title clipped (round 4) | nothing checked glyph ink against the label's rounded clip; the top of the title sat under the pill's curve                                                                                                                       | the owner, from a screenshot (`owner-grant-3.json`)                                                                                                                         |
| double focus edge (round 6)  | the Send play asserted box `outlineStyle` solid and `outlineWidth` 1px, the border separately; ORV-107-review-7 (423,276 tokens) probed the outline at 1 px and the buttons at 2 px, and approved `0f0b4a5`                       | the owner by eye (image 15 of the session), then ORV-107-review-8 R8-C1 Critical: a pixel column at 4x read device rows 14 to 21 in the focus ink, 2 CSS px, light and dark |

Round 5 (ORV-107-build-11) added a height parity assert and `label.scrollHeight` against `clientHeight` inside `CanvasChat.stories.tsx` (`expectGoneChip`). They are local to one file, and `scrollHeight` counts layout overflow only: a tone mark above the line box, or a glyph under a rounded corner, is ink overflow and does not change it, so that assert cannot see the clip the owner saw.

The double edge chain after the approve (review-7, review-8, build-14, review-9, design-3, review-10) sums to 1,843,982 tokens, n=6. The probe that found it, a pixel column across the edge, ran only after the owner looked.

Related: [[L-0002-a-test-that-cannot-fail]], [[L-0015-geometry-defects-found-by-the-reviewer-probe]], [[L-0017-rework-look-decided-in-text]], [[K-0005-proof-must-match-the-claim]].

## Rule

The helpers need a builder story of their own first (lane S, a new Jira issue, one deliverable): `packages/design-system/src/testing/visual-asserts.ts` with its tests, adopted by `CanvasChat.stories.tsx`. The rule is promoted only after that story merges.

- `expectEdgeInk(el, side, px)`: sums every line drawn at that edge from computed style, the border width, plus the outline width when the outline style is not `none` and its offset puts it next to or over the border, plus a box-shadow ring with no blur, and asserts the sum. The helper story shows it reads 2 for the focused `.ds-chat__box` on the `0f0b4a5` CSS.
- `expectSameHeight(el, ...siblings)`: chips, tags and controls in one row have the same rendered height within 0.5 px. The helper story shows it failing for the gone chip in English at 240 px on the `c1c9fad` CSS.
- `expectNoGlyphClip(el)`: for each text node under an ancestor whose overflow is not `visible`, every `Range` client rect lies inside that ancestor's padding box and inside its rounded corners (a point-in-rounded-rectangle test on the computed radii). Stories that use it carry a Thai sample with stacked marks above the line, such as `ปิ่นโต้` and `โลโก้`. The helper story shows it failing for the Thai title on the `c1c9fad` CSS; if it does not, the helper is not done. Honest limit: a font whose marks draw above its own ascent is not seen by a Range rect; the designer's screenshot look ([[L-0019-no-designer-looked-at-the-built-head]]) stays the catch for that.

In `.claude/rules/testing.md`, add:

```diff
 - A test must fail on the real defect. Prove it: break the code, watch the test go red.
+- A visual criterion is asserted on the rendered result, never on the one property a fix sets. An edge, a focus line or a ring uses `expectEdgeInk`; a chip, tag or control beside others uses `expectSameHeight`; text in a box that clips, a pill or a rounded corner uses `expectNoGlyphClip` with a Thai sample that has stacked marks. All three live in `packages/design-system/src/testing/visual-asserts.ts`; a new helper of this kind goes there, not into one stories file (L-0018).
```

In `.claude/agents/builder.md`, "Loop per task", step 4, append:

```diff
-... and make the play test assert every edge the criterion names, not one (L-0015).
+... and make the play test assert every edge the criterion names, not one (L-0015). A change to a border, outline or ring adds to the probe a pixel column across that edge at `deviceScaleFactor` 4, light and dark, and the ink width it reads goes in the same `verified` row (L-0018).
```

What proves it was done: the helpers file exists with tests that fail on the ORV-107 CSS of `0f0b4a5` (edge) and `c1c9fad` (height, glyph clip); after promotion, each UI builder `result.json` that changes an edge has a `verified` row with a pixel ink width.

The `Check:` line names ORV-110 as a provisional key. Before the measurement it is replaced by every UI issue built after promotion, each collected first with `collect <ISSUE>`. With fewer than 5 builder and reviewer tasks in those issues the verdict is `not enough data`.

## Expected saving

- Metric: sum of `tokens.total` over tasks that fix or re-check a visual defect that a passing play or an approving probe had covered, per issue
- Baseline: sum 1,843,982, n=6, from ORV-107 tasks review-7, review-8, build-14, review-9, design-3 and review-10 (`node scripts/ovl/metrics.mjs report ORV-107`; per-task tokens from `.orivilo/metrics/ORV-107.json`)
- Target: 600,000 or less per issue, at most one fix and re-check pair, about 67% less; the helper story is a one-time cost outside this metric
- Guard metric: Critical and Important findings kept per first review on a UI PR do not fall (ORV-107-review-1 kept 2), and visual defects the owner finds after an approve fall from 3 in ORV-107
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-110`
- Check after: 2026-11-08

Status: promoted 2026-10-25, into `packages/design-system/src/testing/visual-asserts.ts`, `.claude/rules/testing.md` and `.claude/agents/builder.md`; Check after: 2026-11-08
