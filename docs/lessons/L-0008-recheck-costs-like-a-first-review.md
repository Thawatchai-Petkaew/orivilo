---
id: L-0008
date: 2026-10-24
issue: [ORV-87, ORV-90, ORV-91]
what_happened: A reviewer re-check (round 1 or more) used more tokens than a first review, median 505,823.5 against 402,289.5, though it had only a rework diff to judge.
cause: A re-check starts fresh with an envelope as wide as the first review (median 7 context pointers against 5), so it rebuilds the whole PR context instead of starting from the previous findings and the rework diff.
rule: A reviewer envelope with round 1 or more points at the previous review's result record and the rework diff, carries the reviewed sha as a fact, and the reviewer starts from `git diff <reviewed sha>..HEAD`, runs the same gate commands, and opens unchanged files only when the diff or a finding leads there.
---

## What happened

Numbers from the batch ORV-85, 86, 87, 89, 90, 91, 92 (`.orivilo/metrics/batch-2026-10-24.md` and the per-issue files `.orivilo/metrics/<ISSUE>.json`, written by `node scripts/ovl/metrics.mjs collect <ISSUE>`). Every reviewer run in the batch was fresh (reviewer fresh n=14, resumed n=0).

Reviewer tasks with round 1 or more, `tokens.total`, context pointers, kept Critical and Important findings:

| task                   | round | tokens.total | context_pointers | critical + important |
| ---------------------- | ----- | ------------ | ---------------- | -------------------- |
| ORV-87-report-review-2 | 1     | 536,954      | 7                | 0                    |
| ORV-90-review-2        | 1     | 175,736      | 5                | 0                    |
| ORV-91-loop-review-2   | 1     | 622,176      | 9                | 2                    |
| ORV-91-loop-review-3   | 2     | 849,576      | 8                | 1                    |
| ORV-91-loop-review-4   | 3     | 272,058      | 5                | 1                    |
| ORV-91-loop-review-5   | 4     | 474,693      | 7                | 0                    |

Median 505,823.5, n=6, sum 2,931,193: 31.7% of the batch's reviewer tokens (9,237,319).

First reviews (round 0) for comparison: ORV-87-report-review-1 1,212,938, ORV-90-review-1 219,339, ORV-91-loop-review-1 525,575, ORV-92-zod-review-1 279,004. Median 402,289.5, n=4, median 5 context pointers. The four ORV-89 reviewer tasks have no recorded round (outcome `abandoned`) and are left out of both groups.

The session report (`.orivilo/metrics/session-0baff5a3.md`) shows that resuming is not the fix either: reviewer resumed runs median 589,723 (n=21) against reviewer fresh 576,547.5 (n=28). Those are runs, not tasks, and most predate this batch, so they are context, not the baseline.

The re-checks still found things: 4 Important findings over 6 re-checks, all in ORV-91 rounds 1 to 3. A narrower start must not lose those, which is why the guard metric below counts them.

## Rule

Two edits. The owner approved both through the question form on 2026-10-24 (ORV-91 comment 10081) and ruled that a diff-based re-check still counts as a reviewer pass under ADR 0012, so `Evidence removed` stays `none`. Both were applied on 2026-10-24.

In `.claude/skills/ovl/SKILL.md` (how the main session writes a reviewer envelope), add:

```diff
+- **Re-check envelope** (reviewer, round 1 or more). `context_pointers` name the previous review's
+  `.orivilo/runs/<ISSUE>/<previous review task_id>/result.json`, the rework task's report and the spec;
+  not the full pointer list of the first review. One fact is the sha the previous review judged
+  (`checked_by`: `git rev-parse <sha>`).
```

In `.claude/agents/reviewer.md`, add after "Pass 2: quality":

```diff
+## Re-check (round 1 or more)
+
+Start from the previous review's findings and `git diff <reviewed sha>..HEAD`. For each finding, say
+fixed (with the command or line) or still open. Review the new diff in full by passes 1 and 2. Run the
+same gate commands as the first review. Open a file the diff did not touch only when a finding or the
+diff leads there. The verdict covers the whole PR at `head_sha`.
```

What proves it was done: each reviewer envelope with round 1 or more in `.orivilo/runs/` lists the previous review's `result.json`, and its report's `checks_run` holds the `git diff <sha>..HEAD` command.

The `Check:` line below still names ORV-93 as a provisional key: at promotion no issue has had a re-check under the rule yet. The first issue with re-checks under the rule replaces ORV-93 in the `Check:` line once it is known, before the measurement after `Check after:`.

## Expected saving

- Metric: median `tokens.total` per reviewer task with round 1 or more
- Baseline: median 505,823.5, n=6, from ORV-87, ORV-90, ORV-91 (`node scripts/ovl/metrics.mjs collect ORV-91`, and the same for ORV-87 and ORV-90; the round and tokens columns)
- Target: median 300,000 or less, about 40% less per re-check, about 1.2M tokens on a batch with 6 re-checks
- Guard metric: kept Critical and Important findings per re-check do not fall below the baseline 0.67 (4 over 6), and no finding a re-check missed is raised by a later round on unchanged lines
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs collect ORV-93`
- Check after: 2026-11-07

Status: promoted 2026-10-24, into `.claude/skills/ovl/SKILL.md` (Re-check envelope, step 2) and `.claude/agents/reviewer.md` (Re-check, after Pass 2)
