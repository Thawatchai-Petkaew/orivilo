---
id: L-0014
date: 2026-10-24
issue: [ORV-98, ORV-95, ORV-93]
what_happened: In ORV-98 round 1 qa approved head `941b553` (ORV-98-qa-2, 1,695,795 tokens) while the parallel reviewer re-check sent the same head back, so qa walked again at `1611c95` (ORV-98-qa-3, 1,168,778 tokens) after a docs-only fix.
cause: Step 6 of the ovl skill dispatches qa and the reviewer on the same head in every round, and `merge-guard` needs a qa record on the merge head, so a qa walk on a head the cheaper reviewer re-check rejects is spent and must be run again.
rule: From round 1 on, the reviewer re-check runs first and qa is dispatched only on a head that re-check approved; round 0 keeps qa and the reviewer in parallel, as L-0013 assumes.
---

## What happened

Numbers from `.orivilo/metrics/batch-2026-10-24-c.md` (`node scripts/ovl/metrics.mjs report ORV-98 ORV-99`) and the per-task figures, rounds and run times in `.orivilo/metrics/ORV-98.json`, `.orivilo/metrics/ORV-95.json` and `.orivilo/metrics/ORV-93.json`. Verdicts and head SHAs come from each task's `result.json` under `.orivilo/runs/<ISSUE>/<task_id>/`.

ORV-98, PR 89, after the first builder rework (ORV-98-r1-fix):

| task            | round | head      | verdict         | tokens.total | started  | ended    |
| --------------- | ----- | --------- | --------------- | ------------ | -------- | -------- |
| ORV-98-review-2 | 1     | `941b553` | request_changes | 1,151,726    | 15:08:10 | 15:13:20 |
| ORV-98-qa-2     | 1     | `941b553` | approve         | 1,695,795    | 15:08:17 | 15:13:21 |
| ORV-98-review-3 | 1     | `1611c95` | approve         | 127,084      | 15:14:49 | 15:15:22 |
| ORV-98-qa-3     | 1     | `1611c95` | approve         | 1,168,778    | 15:14:56 | 15:20:33 |

The fix between the two heads was ORV-98-skill-v1-2 (226,677 tokens), skill text and a spec changelog line. The qa-3 envelope was already diff-based: it pointed at qa-2's `result.json`, named the docs-only diff `941b553..HEAD` as a fact and carried the untouched AC rows from the previous walk. It still used 1,168,778 tokens, 9.2 times the reviewer re-check on the same diff, because the qa contract runs the full `pnpm quality-gate` on every head (`.claude/agents/qa.md`, step 2) and `merge-guard` reads a qa record for the merge head only (`scripts/ovl/merge-check.mjs`, `qaProblems`). A narrower qa envelope does not remove that cost; a qa walk that is not needed does.

The same pattern in the earlier batch: ORV-95-qa-3 approved `2969ee1` (2,192,605 tokens) while ORV-95-review-3 sent `2969ee1` back, and the PR moved on to `43f2b66` (ORV-95-review-4, approve).

Qa tokens over tasks with round 1 or more, per issue:

| issue  | qa tasks with round 1 or more        | sum       |
| ------ | ------------------------------------ | --------- |
| ORV-93 | pr2-qa-1 1,669,858, pr2-qa-2 391,137 | 2,060,995 |
| ORV-95 | qa-2 2,025,932, qa-3 2,192,605       | 4,218,537 |
| ORV-98 | qa-2 1,695,795, qa-3 1,168,778       | 2,864,573 |

Median 2,864,573, n=3. Two of the six walks (ORV-95-qa-3 and ORV-98-qa-2, 3,888,400 tokens together) judged a head that a parallel reviewer re-check rejected. Reviewer re-checks with round 1 or more in ORV-98 cost 1,151,726 and 127,084 (L-0008 envelope), against a qa median of 1,695,795 (qa fresh, n=3, this batch).

The qa walks found things in those rounds: ORV-95-qa-2 kept 3 Important findings on a head the reviewer also rejected, and ORV-93-pr2-qa-1 kept 1. Running qa after the reviewer moves those findings later; it must not lose them, which is why the guard metric counts them and the rework rounds.

Related: [[L-0008-recheck-costs-like-a-first-review]], [[L-0013-qa-findings-took-a-second-revision]].

## Rule

In `.claude/skills/ovl/SKILL.md`, step 6, change the first sentence:

```diff
-6. **Review and qa.** Dispatch `qa` (`qa.v1`) and `reviewer` (`reviewer.v1`) on the same head SHA. Findings go back to `builder` as a new envelope; after round 2, ask the form (section 3). A docs-only PR has no qa; the reviewer walks its AC rows.
+6. **Review and qa.** Round 0: dispatch `qa` (`qa.v1`) and `reviewer` (`reviewer.v1`) on the same head SHA. Round 1 or more: dispatch the reviewer re-check first, and `qa` only on a head that re-check approved; a re-check that requests changes sends the head back with no qa walk on it (L-0014). Findings go back to `builder` as a new envelope; after round 2, ask the form (section 3). A docs-only PR has no qa; the reviewer walks its AC rows.
```

Round 0 is unchanged, so L-0013 (one revision for a head both judged in parallel) still applies there. A qa walk on a later head is still a full walk with the full gate, and `merge-guard` still needs its record on the merge head.

What proves it was done: for each issue with a builder rework after promotion, every qa task with round 1 or more in `.orivilo/runs/<ISSUE>/` started after a reviewer `result.json` with verdict `approve` on the same `head_sha`.

The `Check:` line names ORV-94 and ORV-96 as provisional keys. Before the measurement after `Check after:`, the list is replaced by every issue with a builder rework after promotion, each collected first with `collect <ISSUE>`, and only tasks started after promotion count. With fewer than 5 qa tasks with round 1 or more the verdict is `not enough data`.

## Expected saving

- Metric: sum of qa `tokens.total` over tasks with round 1 or more, per issue
- Baseline: median 2,864,573, n=3, from ORV-93, ORV-95, ORV-98 (`node scripts/ovl/metrics.mjs report ORV-93 ORV-95 ORV-98`, qa row; per-task round and tokens from `.orivilo/metrics/<ISSUE>.json`)
- Target: median 1,800,000 or less per issue, about one qa walk per issue after round 0, about 37% less
- Guard metric: kept qa Critical and Important findings per issue do not fall, builder rework rounds per issue do not rise above the baseline (ORV-93 2, ORV-95 2, ORV-98 1)
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-94 ORV-96`
- Check after: 2026-11-07

Status: promoted 2026-10-24, into `.claude/skills/ovl/SKILL.md` (The loop, step 6)
