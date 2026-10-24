---
id: L-0015
date: 2026-10-25
issue: [ORV-101, ORV-100]
what_happened: In ORV-101 the reviewer's Playwright probe found 2 Critical and 3 Important placement and visibility defects over two review rounds (F1 to F3, R2-1, R2-2), so the builder needed a third rework round that the owner had to grant; the four fix and re-check tasks used 2,620,486 tokens.
cause: The builder's loop ends at tests and the full gate, and the OnBoard play test checked one edge only, so no builder step measured where the moved elements land in a real browser, on the story board or on a shorter one, before handoff.
rule: When an acceptance criterion or design finding says where an element sits or that it stays visible, the builder measures every element the change moves in a real browser, at the story size and at the smallest container size the layout allows, and reports the boxes in `verified` before handoff.
---

## What happened

Numbers from `.orivilo/metrics/taskbar-2026-10-25.md` (`node scripts/ovl/metrics.mjs report ORV-100 ORV-101`) and the per-task figures in `.orivilo/metrics/ORV-101.json`. Findings, heads and checks come from each task's `result.json` under `.orivilo/runs/ORV-101/<task_id>/`.

ORV-101 (TaskBar slice B, PR 95) asks that a jump puts the node inside the board, above an open task bar, selected and focused (AC 14, design D4 and F2). The first build, ORV-101-build-1 (2,046,762 tokens), verified lint, typecheck, test, contrast and build. It ran no browser measurement, and its OnBoard play test asserted only that the node's bottom is at or above the bar's top.

| task             | round | head      | geometry or visibility findings kept                                                                                                 | found by                                       | tokens.total |
| ---------------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ------------ |
| ORV-101-review-1 | 1     | `0f38f49` | F1 Critical (node off the top of the board at min zoom), F2 Important (one-edge test), F3 Important (status pill over the open list) | Playwright probe of the OnBoard story          | 1,722,390    |
| ORV-101-build-3  | 2     |           | fixes F1 to F4                                                                                                                       |                                                | 395,088      |
| ORV-101-review-2 | 2     | `7728d7e` | R2-1 Critical (toolbar lifted over the jumped-to node), R2-2 Important (pill and toolbar off a 480 px and 420 px board)              | Playwright probe at 560, 480 and 420 px boards | 467,451      |
| ORV-101-build-4  | 3     |           | fixes R2-1, R2-2 (third round, owner grant `.orivilo/runs/ORV-101/owner-grant-1.json`)                                               |                                                | 606,966      |
| ORV-101-review-3 | 3     | `797cf34` | none of this kind; approve                                                                                                           | Playwright probe at the three sizes            | 1,150,981    |

The fix and re-check tasks for these findings (build-3, review-2, build-4, review-3) sum to 2,620,486 tokens, n=4. Each defect was a measurement the builder could have taken with the same probe: element boxes against the board and against each other, after the jump, at the story size and at a shorter board. Build-3 added the box checks to OnBoard but measured the 560 px board only, which is why R2-2 appeared one round later. Build-3 and build-4 did show their new tests going red on the old code (L-0002 held).

ORV-100 (slice A) had no finding of this kind; its review-1 findings were logic and motion (R1, R3, R4).

Related: [[L-0001-g3-passed-visual-defects]], [[L-0002-a-test-that-cannot-fail]].

## Rule

In `.claude/agents/builder.md`, "Loop per task", add a step before the handoff gate:

```diff
 3. Refactor, then run the affected tests only: ...
+4. When an acceptance criterion or design finding says where an element sits or that it stays visible (inside a container, above or clear of another element, on a short layout), run a Playwright probe against the built story before handoff, at the story size and at the smallest container size the layout allows. Measure the box of every element the change moves or lifts against the container and against each other, put the numbers in a `verified` row, and make the play test assert every edge the criterion names, not one (L-0015).
-4. Before handoff, run `pnpm lint && pnpm typecheck && pnpm test` once and report its real output.
-5. Commit with a Conventional Commit message that names the issue key.
+5. Before handoff, run `pnpm lint && pnpm typecheck && pnpm test` once and report its real output.
+6. Commit with a Conventional Commit message that names the issue key.
```

The reviewer keeps its own probe; this moves the first measurement earlier and removes no check.

What proves it was done: for each UI issue after promotion whose spec or design names a placement or visibility rule, the round-0 builder `result.json` has a `verified` row with measured boxes at two container sizes.

The `Check:` line names ORV-102 as a provisional key (TaskBar follow-ups, which include the toolbar visibility finding R3-2). Before the measurement it is replaced by every UI issue with a placement or visibility criterion built after promotion, each collected first with `collect <ISSUE>`. With fewer than 5 builder and reviewer tasks in those issues the verdict is `not enough data`.

## Expected saving

- Metric: sum of builder and reviewer `tokens.total` over tasks that fix or re-check a placement or visibility finding, per issue
- Baseline: sum 2,620,486, n=4, from ORV-101 tasks build-3, review-2, build-4 and review-3 (`node scripts/ovl/metrics.mjs report ORV-100 ORV-101`; per-task round and tokens from `.orivilo/metrics/ORV-101.json`)
- Target: 1,000,000 or less per issue, at most one fix and re-check pair, about 60% less; the probe adds an estimated 300,000 to the round-0 builder task, which the target already nets out
- Guard metric: Critical and Important findings kept per first review on a UI PR do not fall (ORV-100-review-1 kept 2, ORV-101-review-1 kept 3), and owner-granted third builder rounds stay at 0 (1 in ORV-101)
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-102`
- Check after: 2026-11-08

Status: promoted 2026-10-25, into `.claude/agents/builder.md` (Loop per task, step 4)
