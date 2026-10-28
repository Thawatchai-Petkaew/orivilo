---
id: L-0046
date: 2026-10-28
issue: [ORV-133]
what_happened: Four time limits of PR 130 that passed on the Mac failed on the gate or CI, where the full suite runs every package in parallel (a 2 s guard on e0ffacc, vitest's 5,000 ms default on f77913b, the row 6 robots.txt bound of 500 ms on three CI runs, and a heavy test with no timeout on 769f09e, finding R4-1), and each cost a spec revision or a builder round and an owner grant.
cause: Each limit was set from a run of one test file on the Mac, and no command run before handoff measured the tests under the parallel full suite or listed the heavy tests without a timeout, so vitest's default applied even after an envelope asked for the heavy timeout.
rule: A test that parses a heavy document (one sized at a bound, such as a 2 MB page) passes the file's shared heavy timeout; a wall-clock assertion's bound is at least 10 times the local time measured with the full suite, or a CI measurement; before handoff the builder runs the package with `--testTimeout=400` and gives every test that fails it the heavy timeout.
---

## What happened

Records are under `.orivilo/runs/ORV-133/`; per-task tokens from `.orivilo/metrics/ORV-133.json` (`node scripts/ovl/metrics.mjs report ORV-133`).

| Where                                         | Limit and what ran over it                                                                                                                                               | Tasks it cost (tokens)                                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate on `e0ffacc` (record 13:54:22Z, 27 Oct)  | The 2 s guard on the held-depth document (rows 7 and 36) under load; 557 to 581 ms alone. Finding GATE-133-1 moved it to 10 s (spec ORV-128, "Gate findings on round 2") | `product-parent-11` 1,752,317; `product-parent-12` 293,184; `design-tech-bookkeeping-6` 1,333,817; `build-rework-3` 277,102 (with a TS1294 fix) |
| Gate on `f77913b` (record `ok: false`)        | Three heavy tests over vitest's 5,000 ms default under the parallel full suite; one 2,000 ms guard measured 2,963 ms                                                     | `build-rework-5` 647,469                                                                                                                        |
| CI runs 40534415296, 40556546327, 40623234696 | Row 6 robots.txt bound of 500 ms: 1,011.8, 1,176.7 and 934.9 ms on the runner; passes locally. Moved to 2 s (spec ORV-128 "Slice 1b CI findings", Row 6 timing on CI)    | `product-parent-16` 1,446,862                                                                                                                   |
| CI run 40635628259 on `769f09e`               | A test parsing three 2 MB documents with no timeout argument: 5,585 ms on CI, 701 ms locally (finding R4-1, Critical, `review-code-6`)                                   | `build-rework-7` 800,781; `review-code-7` 390,848                                                                                               |

- Sum 6,942,380 tokens over 8 tasks, median 724,125. Four of the five owner grants named a time limit as the reason for the round (`owner-grant-1.json`, `-3.json`, `-4.json`, `-5.json`).
- `HEAVY_TIMEOUT = 60_000` (`page-text.test.ts:13`, `read-page.test.ts:14`) came from `build-rework-5`. The `build-rework-6` objective said "give every new heavy test the HEAVY_TIMEOUT the round 5 tests use", and R4-1 still listed seven heavy tests without it (`page-text.test.ts` lines 1088, 1097, 1103, 1112, 1127; `read-page.test.ts` lines 999, 1009). An instruction with no command to check it did not hold.
- The ratio seen on R4-1 is about 8 (5,585 ms on CI against 701 ms locally).
- `review-code-7` checked the class with `cd packages/intent-engine && npx vitest run --testTimeout=400`: all 705 tests passed; at `--testTimeout=150` only `read-page.test.ts:741` failed, the robots.txt test that holds its own 2 s bound. One run, under a second, found every member of the class a CI failure had found one at a time.

Related: [[L-0009-full-suite-loops-to-verify-a-flaky-fix]] (verify with affected tests; this probe is one run of one package, not a loop), [[L-0042-break-its-sampled-the-clauses]] (a widened time guard must still go red on its mutant).

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/rules/testing.md`, after the bullet "The full suite always runs where it decides" (line 17):

```diff
+- A time limit is sized for the CI runner under the parallel full suite, not for one file on the Mac
+  (the ratio seen was about 8). A test that parses a heavy document (one sized at a bound, such as a
+  2 MB page) passes the file's shared heavy timeout constant (`HEAVY_TIMEOUT`) as the third argument
+  of `it()` or `it.each()`. A wall-clock assertion's bound is at least 10 times the local time
+  measured while the full suite runs, or a measured CI time with its run id, and it still goes red on
+  the mutant it guards (L-0042). Before handoff the builder runs
+  `pnpm --filter <package> exec vitest run --testTimeout=400`, gives every test that fails it the
+  heavy timeout or a lighter input, and adds one `verified` row with the command and its count. The
+  reviewer runs the same command on a re-check of heavy tests (L-0046). No hook checks this.
```

What proves it was done: no gate or CI failure on a time limit in the next slice that adds heavy tests; each builder report on a package with heavy tests has the `--testTimeout=400` row.

## Expected saving

- Metric: sum of `tokens.total` over tasks whose objective fixes a time limit that failed on the gate or CI (a time guard, a test timeout, a spec time bound)
- Baseline: sum 6,942,380, median 724,125, n=8, from ORV-133 tasks product-parent-11, product-parent-12, design-tech-bookkeeping-6, build-rework-3, build-rework-5, product-parent-16, build-rework-7 and review-code-7 (`node scripts/ovl/metrics.mjs report ORV-133`; per-task tokens from `.orivilo/metrics/ORV-133.json`)
- Target: 1,500,000 or less per slice, with no owner grant whose reason is a time limit
- Guard metric: every wall-clock guard keeps a red break-it row on its mutant (L-0042), and the median `tokens.total` of a fresh builder task does not rise by more than 10% (baseline median 1,349,009.5, n=10, ORV-133)
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-133`
- Check after: 2026-11-11

The `Check:` line names ORV-133 as a provisional key. Before the measurement it is replaced by every slice that adds heavy tests after promotion, each collected first with `collect <ISSUE>`, and only tasks started after promotion count. With fewer than 5 comparable builder tasks the verdict is `not enough data`.

Status: promoted 2026-10-28, into `.claude/rules/testing.md` (after the "The full suite always runs where it decides" bullet); Check after: 2026-11-11; no hook enforces it
