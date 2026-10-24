---
id: L-0009
date: 2026-10-24
issue: [ORV-76]
what_happened: The ORV-76 builder verified a fix for flaky Storybook stories by running the whole design-system test, about 2,500 tests, five times in a row, and looped for over 30 minutes.
cause: The acceptance criteria asked for five clean runs of the whole suite, and no rule said how to verify a test fix with the affected tests first, so the repeat count was spent on the full suite instead of on the files that flaked.
rule: While building and verifying a fix, run the affected tests (`vitest related` or `--changed origin/develop`; a flaky fix repeats each affected file with `--repeats 4`), then run the full suite once before handoff; the G3 gate and CI always run the full suite, and a change to a config, `package.json`, a shared setup or preview file runs the full suite.
---

## What happened

ORV-76 (macOS Storybook flakes) was dispatched as task `ORV-76-build`, role builder, with the done-when command `pnpm --filter @orivilo/design-system test` and the objective "passes with 0 failures five runs in a row" (ORV-76 comment 10093). The fix changes four stories files in the working tree: `CanvasBoard.stories.tsx`, `BlockLibrary.stories.tsx`, `CanvasContextMenu.stories.tsx` and `MiniMap.stories.tsx` under `packages/design-system/src/components/`.

Each run of the design-system test runs about 2,500 tests (the `checks` and `storybook` projects in `packages/design-system/vite.config.ts`). Five full runs took the builder over 30 minutes of looping (ORV-76 comment 10094). For comparison, the median builder task in the batch ORV-87 to ORV-92 took 146,994 ms, about 2.5 minutes (n=15, `node scripts/ovl/metrics.mjs report ORV-87 ORV-88 ORV-89 ORV-90 ORV-91 ORV-92` and the per-issue files in `.orivilo/metrics/`). `ORV-76-build` is not collected yet, so its own token and duration figures are not quoted here.

Five full runs repeat those four files five times, and the other files, which the fix does not touch, five times too. A flake in one story is found by repeating that story's file, not the whole suite.

Outside sources back the shape of the rule:

- Vitest 5.0.5, the version installed in `packages/design-system`, has `vitest related <files>`, `--changed <ref>` and `--repeats <n>` (https://vitest.dev/guide/cli.html).
- Test impact analysis runs the impacted, previously failing and new tests, and falls back to the full suite when it cannot analyse a change (https://learn.microsoft.com/en-ie/previous-versions/azure/devops/pipelines/test/test-impact-analysis?view=tfs-2017). Our fallback is the same: a config, `package.json`, shared setup or preview change runs the full suite.
- Regression test selection cut the tests run by about half on average in an evaluation on open-source Java programs (https://arxiv.org/pdf/2211.07782).

## Rule

The owner approved the rule and the new ORV-76 acceptance criterion (the affected stories files with `vitest --repeats 4`, then the full design-system test once) on 2026-10-24 (ORV-76 comment 10094). It was applied the same day.

In `.claude/rules/testing.md`, add `**/*.stories.tsx` to the `paths` front matter so the rule loads for story tests, and add:

```diff
+- Verify a fix with the affected tests first, the full suite once. While you build and verify, run only the affected tests: `vitest related <changed files>` or `vitest --changed origin/develop`. A fix for a flaky test repeats each affected file with `--repeats 4`, such as `pnpm --filter @orivilo/design-system exec vitest run --repeats 4 <file>`. Then run the full suite once before handoff. Never loop the full suite to prove a flake is gone (L-0009).
+- The full suite always runs where it decides: the G3 gate (`pnpm quality-gate`) and CI. A change to a config file, a `package.json`, a shared setup file or a Storybook preview file runs the full suite while you build too, because the affected tests cannot be worked out from it.
```

What proves it was done: a builder report for a test fix lists, in `verified`, the `--repeats 4` run of each affected file and one full-suite run, and no more than one full-suite run per verify round; the G3 packet shows the full gate run.

The `Check:` line names ORV-76 only: at promotion it is the one test-fix issue under the rule. Before the measurement after `Check after:`, the list is replaced by every issue with a builder test-fix task after promotion, each collected first with `collect <ISSUE>`, so the median covers at least 5 comparable tasks, else the verdict is `not enough data`.

## Expected saving

- Metric: median `tokens.total` per builder task that fixes or adds tests
- Baseline: median 442,968, n=15, all builder tasks from ORV-87, ORV-88, ORV-89, ORV-90, ORV-91, ORV-92 (`node scripts/ovl/metrics.mjs report ORV-87 ORV-88 ORV-89 ORV-90 ORV-91 ORV-92`, builder fresh row); no test-fix subset has 3 tasks yet
- Target: median 442,968 or less for test-fix builder tasks, so a flaky fix costs no more than a typical build, with the time cut by running about 2,500 tests once instead of five times
- Guard metric: median builder `duration_ms` per test-fix task stays at or below the builder baseline 146,994 ms (n=15, same command), against over 30 minutes for `ORV-76-build`; and no flaky failure the affected runs missed shows up first in the G3 full run or in CI
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-76`
- Check after: 2026-11-07

Status: promoted 2026-10-24, into `.claude/rules/testing.md` (paths front matter and the two verify bullets)
