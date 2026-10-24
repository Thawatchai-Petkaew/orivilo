---
id: L-0010
date: 2026-10-24
issue: [ORV-93]
what_happened: One builder task, ORV-93-pr2-build, built six deliverables of ORV-93 PR 2 and used 3,709,117 tokens, 47.6% of the batch's builder tokens, with about 92,000 cached tokens read per API call against a median of 38,017 for the batch's builders.
cause: The main session wrote one builder envelope for the whole PR, with 13 context pointers and 17 write_set entries, so every one of its 38 API calls carried the context of all six deliverables.
rule: The main session gives a builder task one deliverable, with only the pointers and write_set that deliverable needs, and splits an envelope with more than 8 context pointers before it dispatches it unless a fact says why the parts cannot be built apart.
---

## What happened

Numbers from the batch report `.orivilo/metrics/batch-2026-10-24-b.md` (`node scripts/ovl/metrics.mjs report ORV-93 ORV-76`) and the per-task figures in `.orivilo/metrics/ORV-93.json` and `.orivilo/metrics/ORV-76.json`. Every builder run in the batch was fresh (builder fresh n=7, median 672,982).

The envelope of `ORV-93-pr2-build` asked for six things in one task: the hook stdin samples (spec row 33), `write-guard` by TDD (rows 1 to 26), its launcher and the `.claude/settings.json` entry (row 27), the doctor probe (rows 28, 29), `metrics.mjs session --out` (row 21) and the `ovl` skill text (row 35). It had 13 context pointers and 17 write_set entries. The merged PR #85 changed 16 files, 1,569 lines added.

Builder tasks, `tokens.total`, API calls, `cache_read` per API call, context pointers:

| task               | tokens.total | api_calls | cache_read per call | context_pointers |
| ------------------ | ------------ | --------- | ------------------- | ---------------- |
| ORV-93-pr1-build   | 672,982      | 12        | 49,670              | 10               |
| ORV-93-pr1-build-2 | 162,655      | 6         | 21,229              | 5                |
| ORV-93-pr2-build   | 3,709,117    | 38        | 92,183              | 13               |
| ORV-93-pr2-fix     | 1,149,880    | 22        | 48,037              | 5                |
| ORV-93-pr2-qa-fix  | 277,556      | 11        | 21,867              | 5                |
| ORV-76-build       | 1,557,309    | 39        | 38,017              | 6                |
| ORV-76-build-2     | 263,366      | 10        | 23,119              | 6                |

Sum 7,792,865; `ORV-93-pr2-build` is 47.6% of it. `cache_read` is 92.9% of the builder tokens (7,237,600). A run's cache read grows with its calls times the context each call carries. `ORV-76-build` made about as many calls (39), but each carried about 38,000 cached tokens, and it used 1,557,309 tokens. Its cost came from looping the full suite, which L-0009 covers; it is not counted as evidence here.

The PR 2 work after the build went on in the same shape: the first review, `ORV-93-pr2-review-1`, used 2,081,468 tokens and found 3 Critical and 2 Important; the fix `ORV-93-pr2-fix` used 1,149,880 and the qa fix `ORV-93-pr2-qa-fix` 277,556. The builder sum for PR 2 is 5,136,553.

This is one large task, so it is a sign, not proof. The rule below is checked against the same numbers on the next slices with three or more deliverables.

## Rule

The owner approved this rule through the question form on 2026-10-24 (ORV-93 comment 10099). It was applied on 2026-10-24.

In `.claude/skills/ovl/SKILL.md`, step 2, add after the Re-check envelope bullet:

```diff
+- **Builder envelope: one deliverable.** A builder task builds one deliverable: one module with its
+  tests, one hook with its launcher and settings entry, or one doc change. A slice with more gets one
+  builder task per deliverable, dispatched in build order, each with only the `context_pointers` and
+  `write_set` that deliverable needs. A builder envelope with more than 8 `context_pointers` is split
+  before dispatch, unless one fact says why its parts cannot be built apart. The PR still gets one
+  full gate, two reviewer passes and the qa walk (L-0010).
```

What proves it was done: each builder envelope in `.orivilo/runs/` for a slice dispatched after promotion has 8 `context_pointers` or fewer, or a fact that says why not, and the slice's spec rows are spread over more than one builder task when it has three or more deliverables.

The `Check:` line names ORV-81, ORV-83 and ORV-84, the next issues with builds in `.orivilo/handoff.md`, as provisional keys. Before the measurement after `Check after:`, the list is replaced by every issue with a builder slice of three or more deliverables dispatched after promotion, each collected first with `collect <ISSUE>`, and only tasks started after promotion count, so the comparison covers at least 5 builder tasks, else the verdict is `not enough data`.

## Expected saving

- Metric: `tokens.total` of the largest builder task per PR, and the sum of builder `tokens.total` over the tasks that build one slice of three or more deliverables
- Baseline: largest builder task 3,709,117 (`ORV-93-pr2-build`, 38 API calls, `cache_read` 92,183 per call) against builder fresh median 672,982, n=7, from ORV-93, ORV-76 (`node scripts/ovl/metrics.mjs report ORV-93 ORV-76`, builder fresh row; per-task figures from `.orivilo/metrics/ORV-93.json`)
- Target: no builder task above 1,500,000 `tokens.total` on such a slice, and its split tasks sum to 2,200,000 or less, about 1,500,000 (40%) less than `ORV-93-pr2-build`; estimate from 38 calls at the `cache_read` per call of `ORV-93-pr2-fix` (48,037, 5 pointers) plus three fresh starts
- Guard metric: kept Critical and Important findings in the PR's first review do not rise above 5 (`ORV-93-pr2-review-1`), and the builder sum per PR with its fix tasks does not rise above 5,136,553 (`ORV-93-pr2-build`, `ORV-93-pr2-fix`, `ORV-93-pr2-qa-fix`)
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-81 ORV-83 ORV-84`
- Check after: 2026-11-07

Related: [[L-0008-recheck-costs-like-a-first-review]] (the same cause, a wide envelope, on reviewer re-checks), [[L-0009-full-suite-loops-to-verify-a-flaky-fix]].

Status: promoted 2026-10-24, into `.claude/skills/ovl/SKILL.md` (Builder envelope: one deliverable, step 2)
