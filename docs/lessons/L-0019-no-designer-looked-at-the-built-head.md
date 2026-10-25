---
id: L-0019
date: 2026-10-25
issue: [ORV-107]
what_happened: In ORV-107 the reviewer approved two heads whose look the owner rejected by eye (the three-line gone chip with a clipped Thai title at `3251dc5`, the double focus edge at `0f0b4a5`), a qa walk on the first was abandoned, and the eight tasks dispatched after those approves used 9,168,675 tokens.
cause: The loop has no step where the role that owns the look judges the built render; the reviewer and qa test conformance to the spec and design.md, so a spec that prescribes a poor look (row 22 v1.5.2 described the three-line chip) passes every check, and the owner is the first designer to see the head.
rule: For a PR that changes a rendered component, every head the reviewer approves gets a designer visual sign-off from screenshots of each changed story (narrowest and widest container, Thai and English, light and dark) before qa is dispatched, and the G3 packet links that contact sheet so the owner sees the same screenshots before the merge.
---

## What happened

Numbers from `.orivilo/metrics/orv-107-retro.md` (`node scripts/ovl/metrics.mjs report ORV-107`) and the per-task figures in `.orivilo/metrics/ORV-107.json`. Verdicts, heads and findings come from each task's `result.json` under `.orivilo/runs/ORV-107/<task_id>/`; owner answers from `.orivilo/runs/ORV-107/owner-grant-<n>.json`.

The designer ran three tasks in ORV-107: design-1 (5,516,750) and design-2 (2,524,760) wrote design.md before the build, and design-3 (92,228) fixed one doc line. None opened a built head. The reviewer's role is spec compliance and quality; qa's (`.claude/agents/qa.md` step 3) is one light and one dark screenshot per changed stories file, judged against the AC rows. Both judge whether the render matches the documents, not whether it looks right.

| approved head | approved by                | what the owner then saw                                                                                       | tasks that followed                                                                                |
| ------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `3251dc5`     | ORV-107-review-5 (162,560) | an oval three-line chip in a full pill radius, the Thai title's top clipped (`owner-grant-3.json`, 08:03 UTC) | qa-3 abandoned (5,341,901), build-11 (1,210,179), review-6 (1,195,889)                             |
| `0f0b4a5`     | ORV-107-review-7 (423,276) | a 2 px focus edge, border and outline side by side (`owner-grant-5.json`, 08:28 UTC)                          | review-8 (324,861), build-14 (428,479), review-9 (451,492), design-3 (92,228), review-10 (123,646) |

Those eight tasks sum to 9,168,675 tokens, n=8, 14.9% of the issue's 61,564,495. Review-4 had measured the three lines (R4-I1) and offered an owner decision on whether a three-line chip is acceptable; the rework chose to rewrite row 22 to match the render, so every later check passed it. qa-3 was walking that head when the owner's screenshots stopped it.

The overlap with [[L-0017-rework-look-decided-in-text]] (qa-3) and [[L-0018-plays-assert-properties-not-the-render]] (review-8 to review-10) is deliberate: each lesson removes a different cause of the same rounds, so their savings are not additive. L-0017 puts a look in front of the designer before the build, L-0018 makes the plays measure the render, and this lesson puts the built head in front of the designer before qa.

Candidate judged and not proposed as a gate: the owner looking at screenshots before the review. The owner asked for autonomy on merges into `develop`, so this rule gives the owner the designer's contact sheet in the G3 packet instead of a new owner step; L-0017 already puts the mock in the grant form when a round is asked.

Related: [[L-0001-g3-passed-visual-defects]], [[L-0014-qa-walked-a-head-the-recheck-rejected]].

## Rule

In `.claude/skills/ovl/SKILL.md`, "The loop", step 6, add after the first sentence pair:

```diff
 6. **Review and qa.** Round 0: dispatch `qa` (`qa.v1`) and `reviewer` (`reviewer.v1`) on the same head SHA. Round 1 or more: ...
+   When the PR changes a rendered component (a recipe, a `*.stories.tsx` or a component file), qa never walks a head the designer has not signed off: on every head the reviewer approves, dispatch `designer` with `report_contract` `reviewer.v1` for a visual sign-off first, and `qa` only once it approves. At round 0 qa waits for the sign-off instead of running beside the reviewer. A sign-off that requests changes goes back as a visual fix (L-0017) with no qa walk on that head. The G3 packet links the sign-off's screenshots (L-0019).
```

In `.claude/agents/designer.md`, add a section before "Report contract":

```diff
+## Visual sign-off of a built head
+
+When your envelope names `reviewer.v1` and a head SHA, check that head out and take a screenshot of each changed story (`git diff --name-only origin/develop...HEAD`, every `*.stories.tsx`) at the narrowest and the widest container the spec names, in Thai and English, light and dark, into `.orivilo/runs/<ISSUE>/<task_id>/screenshots/`. Open every PNG. Judge the look against design.md and the DESIGN.md §11 walk: one start edge, siblings of one height, a shape that holds at every line count, no clipped glyph (Thai marks above and below), one line per edge, the focus state shown. A finding carries the screenshot as evidence. You judge the look, even where it matches the spec; a spec that prescribes a poor look is a finding against the spec (L-0019).
```

`.claude/agents/qa.md` stays as it is: qa still walks every AC row with its own screenshots. This adds one check and removes none.

What proves it was done: for each UI issue after promotion, every `qa.v1` record has, earlier on the same head, a designer `reviewer.v1` approve whose findings and evidence name screenshot paths.

The `Check:` line names ORV-110 as a provisional key. Before the measurement it is replaced by every UI issue built after promotion, each collected first with `collect <ISSUE>`. With fewer than 5 tasks after an approve the verdict is `not enough data`.

## Expected saving

- Metric: sum of `tokens.total` over tasks dispatched after an approve that the owner overturned by eye, per UI issue, plus the designer sign-off tasks
- Baseline: sum 9,168,675, n=8, from ORV-107 tasks qa-3, build-11, review-6, review-8, build-14, review-9, design-3 and review-10 (`node scripts/ovl/metrics.mjs report ORV-107`; per-task tokens from `.orivilo/metrics/ORV-107.json`)
- Target: 3,000,000 or less per UI issue including the sign-offs, about 67% less; a sign-off is estimated at 500,000 to 1,000,000 tokens and an issue with two approved heads takes two
- Guard metric: visual defects the owner finds after an approve fall from 3 in ORV-107 to 0, and qa tasks per UI issue do not rise above 4 (ORV-107)
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-110`
- Check after: 2026-11-08

Status: promoted 2026-10-25, into `.claude/skills/ovl/SKILL.md` (The loop, steps 6 and 7) and `.claude/agents/designer.md` (Visual sign-off)
