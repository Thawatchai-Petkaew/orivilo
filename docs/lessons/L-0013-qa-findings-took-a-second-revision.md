---
id: L-0013
date: 2026-10-24
issue: [ORV-95]
what_happened: In ORV-95 round 1 the reviewer and qa judged the same head in parallel, the spec revision v1.2 started from the review alone 8 seconds before qa returned, and a second revision v1.3 (1,112,050 tokens) followed for qa's findings, three of whose five were already closed by v1.2.
cause: The L-0011 rule orders a revision before the fix and makes it name every finding id of the review, but it does not say to wait for a qa walk running on the same head, so each report got its own revision and its own owner question.
rule: When a reviewer and qa judge the same head in parallel, the product revision waits for both reports, its envelope names every finding id of both, a qa finding that repeats a review finding is recorded as that review id, and the owner gets one question form for both.
---

## What happened

Numbers from `.orivilo/metrics/orv-95.md` (`node scripts/ovl/metrics.mjs report ORV-95`) and the per-task figures and run times in `.orivilo/metrics/ORV-95.json`. Product fresh n=7, median 778,824, sum 8,542,529. [[L-0011-spec-revision-and-fix-ran-in-parallel]] was promoted in commit `50cf9e2` (12:38 UTC), before the ORV-95 spec task started (12:40:11), so round 1 ran under it.

| task             | tokens.total | started  | ended    | from                              |
| ---------------- | ------------ | -------- | -------- | --------------------------------- |
| ORV-95-review-1  | 3,286,000    | 13:16:35 | 13:25:51 | head `8c95e5b`, F1 to F8          |
| ORV-95-qa-1      | 1,900,662    | 13:16:40 | 13:26:48 | head `8c95e5b`, QA-F1 to QA-F5    |
| ORV-95-spec-v1-2 | 1,520,389    | 13:26:40 | 13:33:31 | review-1 and ORV-95 comment 10104 |
| ORV-95-spec-v1-3 | 1,112,050    | 13:33:44 | 13:37:15 | qa-1 and ORV-95 comment 10105     |
| ORV-95-r1-text   | 1,847,940    | 13:37:45 | 13:44:22 | builder rework, after v1.3        |

The v1.3 changelog line records that QA-F1 is review F3, QA-F3 is review F2 and QA-F4 is review F6, "each already closed in v1.2", and that QA-F2's contents API and `createCommitOnBranch` cases are review F4. Only QA-F2's `curl` case and QA-F5 (surviving mutations) were new. The two revisions used 2,632,439 tokens, 30.8% of the issue's product tokens; v1.3 alone was 13.0%. The owner answered two question forms (comments 10104 and 10105) for one head.

Round 2 did it the other way: v1.5 (451,238) started at 14:07:03, after both review-2 (ended 14:06:15) and qa-2 (ended 14:02:54), and named review N1 to N5 and qa QA2-F1 to QA2-F5 in one changelog line from one owner decision (comment 10109). That revision was text only, so its lower cost is not all from the merge.

From qa-1's end (13:26:48) to the builder rework's start (13:37:45) was 657 seconds, through two revisions in a row.

## Rule

In `.claude/skills/ovl/SKILL.md`, step 2, the Contract change bullet, change the second sentence:

```diff
-  never both from one review at once. The revision envelope names every finding id of the review, and
-  the revision records each as a contract change or as no contract change. The fix envelope carries the
+  never both from one review at once. When a reviewer and a qa judged the same head in parallel, the
+  revision waits for both reports and the owner gets one question form for both. The revision envelope
+  names every finding id of each report, and the revision records each as a contract change, as no
+  contract change, or as the review id it repeats (L-0013). The fix envelope carries the
```

What proves it was done: for each head that a reviewer and a qa both judged with `request_changes` after promotion, the records in `.orivilo/runs/<ISSUE>/` show one product revision whose envelope was written after both `result.json` files, and its changelog line names every finding id of both.

The `Check:` line names ORV-98 and ORV-96 as provisional keys. Before the measurement after `Check after:`, the list is replaced by every issue with a head that both a reviewer and a qa sent back after promotion, each collected first with `collect <ISSUE>`, and only tasks started after promotion count. With fewer than 5 product revision tasks the verdict is `not enough data`.

## Expected saving

- Metric: sum of product tokens.total over the spec revisions that answer one head judged by both a reviewer and a qa
- Baseline: 2,632,439 for ORV-95 round 1 (ORV-95-spec-v1-2 1,520,389 plus ORV-95-spec-v1-3 1,112,050); product fresh median 778,824, n=7, from ORV-95 (`node scripts/ovl/metrics.mjs report ORV-95`, product fresh row; per-task figures from `.orivilo/metrics/ORV-95.json`)
- Target: 1,600,000 or less per such head, one revision, about 40% less
- Guard metric: no finding id of either report is missing from the revision's changelog line, and the time from the later of the two reports' end to the builder fix's start stays at or under 657 s (ORV-95 round 1)
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-98 ORV-96`
- Check after: 2026-11-07

Related: [[L-0011-spec-revision-and-fix-ran-in-parallel]], [[L-0012-guard-reviewed-as-a-boundary-before-its-frame]].

Status: promoted 2026-10-24, into `.claude/skills/ovl/SKILL.md` (Contract change from a review, step 2)
