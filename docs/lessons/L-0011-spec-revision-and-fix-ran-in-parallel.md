---
id: L-0011
date: 2026-10-24
issue: [ORV-93]
what_happened: After the first PR 2 review of ORV-93, the spec revision v1.2 and the builder fix ran at the same time from the same findings, disagreed on four of them, and a third task, spec v1.3 at 780,414 tokens, had to read the code to make the contract match it.
cause: Nothing orders a spec revision and a builder fix that come from one review, and the revision need not name every finding, so both translated the findings on their own and the one finding v1.2 left out (F6) was decided by the code alone.
rule: When a review's findings or the owner's answers change a spec's contract, the main session dispatches the product revision first, naming every finding id as a contract change or as none, and dispatches the builder fix only after it returns, with the new spec version as a fact.
---

## What happened

Numbers from the batch report `.orivilo/metrics/batch-2026-10-24-b.md` (`node scripts/ovl/metrics.mjs report ORV-93 ORV-76`) and the per-task figures and run times in `.orivilo/metrics/ORV-93.json`. Every product run in the batch was fresh (product fresh n=4, median 633,367, sum 4,066,773).

The ORV-93 spec went from v1.0 to v1.3 in four product tasks (`docs/specs/ORV-93/spec.md`, Changelog):

| task             | version | tokens.total | started  | ended    | context_pointers |
| ---------------- | ------- | ------------ | -------- | -------- | ---------------- |
| ORV-93-spec      | v1.0    | 2,570,151    | 09:11:00 | 09:22:08 | 11               |
| ORV-93-spec-v1-1 | v1.1    | 229,888      | 09:22:47 | 09:24:13 | 3                |
| ORV-93-spec-v1-2 | v1.2    | 486,320      | 10:13:32 | 10:15:59 | 2                |
| ORV-93-spec-v1-3 | v1.3    | 780,414      | 10:18:08 | 10:20:30 | 5                |

v1.1 came before any build, from a gap in the main session's own git writes; it is not part of this lesson.

`ORV-93-pr2-review-1` ended at 10:11:23 with findings F1 to F9 (3 Critical, 2 Important). Then two tasks started 20 seconds apart from that review's `result.json`: `ORV-93-spec-v1-2` at 10:13:32 and the builder fix `ORV-93-pr2-fix` at 10:13:52 (ended 10:17:53, 1,149,880 tokens). The v1.2 envelope listed F1 to F5 and F7 to F9; F6 was not in it. The fix decided F6 in code, added `git switch`, `git stash` and `git reset` to F5, narrowed the F7 `sed` read, and refused a worktree root for F8 with a different error text than v1.2 wrote. v1.3, "the contract now matches the PR 2 rework", changed exactly those four points, and its envelope pointed at `scripts/ovl/write-guard.mjs` and `scripts/ovl/metrics.mjs`, the PR's two largest files. The re-check `ORV-93-pr2-review-2` started at 10:20:52, after v1.3.

The two revision tasks after the review used 1,266,734 tokens, 31.1% of the batch's product tokens. v1.3 alone was 780,414, 19.2%.

## Rule

The owner approved this rule through the question form on 2026-10-24 (ORV-93 comment 10099). It was applied on 2026-10-24.

In `.claude/skills/ovl/SKILL.md`, step 2, add after the Re-check envelope bullet:

```diff
+- **Contract change from a review.** When a review's findings or the owner's answers change the
+  spec's contract, dispatch the `product` revision first and the builder fix only after it returns;
+  never both from one review at once. The revision envelope names every finding id of the review, and
+  the revision records each as a contract change or as no contract change. The fix envelope carries the
+  new spec version as a fact (`checked_by` `grep -n "^- v<version>" docs/specs/<KEY>/spec.md`) and the
+  spec in `context_pointers`. A point where the fix must differ from the spec goes in its `deviations`,
+  and the next revision starts from those lines and the fix diff only (L-0011).
```

What proves it was done: for each review with request_changes after promotion, the records in `.orivilo/runs/<ISSUE>/` show the product revision's `result.json` written before the fix envelope, the fix envelope has the spec version fact, and the revision's `changed` note or the spec changelog names every finding id.

The `Check:` line names ORV-81, ORV-83 and ORV-84, the next issues with builds in `.orivilo/handoff.md`, as provisional keys. Before the measurement after `Check after:`, the list is replaced by every issue with a review that changed the contract after promotion, each collected first with `collect <ISSUE>`, and only tasks started after promotion count. Contract-changing reviews are rare; with fewer than 5 product revision tasks the verdict is `not enough data`.

## Expected saving

- Metric: sum of product `tokens.total` over the spec revisions that follow one review round that changes the contract
- Baseline: 1,266,734 for the one such round in ORV-93 (`ORV-93-spec-v1-2` 486,320 plus `ORV-93-spec-v1-3` 780,414); product fresh median 633,367, n=4, from ORV-93 (`node scripts/ovl/metrics.mjs report ORV-93 ORV-76`, product fresh row; per-task figures from `.orivilo/metrics/ORV-93.json`)
- Target: 600,000 or less per such round, one revision, about 50% less, by removing the reconciliation task that read the code (780,414 here)
- Guard metric: no reviewer or qa finding after the fix names a spec row the code does not match (ORV-93 before: four points corrected by v1.3), and the time from the first review's end to the re-check's start, from `started_at` and `ended_at`, stays at or under 568,577 ms (ORV-93: 10:11:23 to 10:20:52); waiting for the owner is inside that span and is not measured apart
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-81 ORV-83 ORV-84`
- Check after: 2026-11-07

Related: [[L-0010-one-builder-task-built-six-deliverables]].

Status: promoted 2026-10-24, into `.claude/skills/ovl/SKILL.md` (Contract change from a review, step 2)
