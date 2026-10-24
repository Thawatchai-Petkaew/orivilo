---
id: L-0016
date: 2026-10-25
issue: [ORV-101, ORV-100]
what_happened: ORV-101 (TaskBar slice B) was built, reviewed and walked by qa with no `docs/specs/ORV-101/spec.md`, so the qa result could not be recorded, a qa walk was abandoned and a slice spec, a reviewer re-check and a new qa walk followed on a new head; 2,311,110 tokens over three tasks.
cause: The slice got its own Jira key when it was split from ORV-100, but no step makes the split also write the slice's spec, while the result recorder, the trace rule and every envelope read `docs/specs/<issue>/spec.md`.
rule: When a slice becomes its own Jira issue, the product task that splits it writes `docs/specs/<slice key>/spec.md` (why, a pointer to the parent spec and its gates, the slice's acceptance rows copied with their numbers) before the slice's first builder envelope, and that envelope has a `test -f` fact for it.
---

## What happened

Numbers from `.orivilo/metrics/taskbar-2026-10-25.md` (`node scripts/ovl/metrics.mjs report ORV-100 ORV-101`) and the per-task figures in `.orivilo/metrics/ORV-101.json`. Envelopes, facts and closures come from `.orivilo/runs/ORV-101/<task_id>/`.

ORV-100's spec held 17 acceptance rows split into slice A (the bar, PR 94) and slice B (the jump). Slice B became ORV-101, which inherits ORV-100's G1 and G2 (ORV-101 comment 10128). ORV-101-build-1's `context_pointers` name `docs/specs/ORV-100/spec.md` and `design.md` only; no ORV-101 spec existed. During PR 95 the slice's changes were written as ORV-100 spec revisions v1.4 to v1.6.

| task             | head      | what happened                                                                                                                                                                                     | tokens.total |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| ORV-101-qa-1     | `797cf34` | walked AC 14 to 16; closed by the owner as abandoned with no recorded result                                                                                                                      | 1,237,308    |
| ORV-101-qa-2     | `b7368bd` | re-walk; closed by the owner as abandoned with no recorded result                                                                                                                                 | 2,019,559    |
| ORV-101-spec-1   |           | wrote `docs/specs/ORV-101/spec.md`; its first fact: the recorder reads the AC table of `docs/specs/<envelope issue>/spec.md`, and that file did not exist (`scripts/ovl/result-recorder.mjs:106`) | 165,092      |
| ORV-101-review-5 | `3296ece` | re-checked the spec-only diff                                                                                                                                                                     | 126,459      |
| ORV-101-qa-3     | `3296ece` | walked AC 14 to 16 again, all pass                                                                                                                                                                | 1,842,344    |

The tasks this lesson counts are qa-2, spec-1 and review-5: 2,311,110 tokens, n=3. Qa-1 is not counted, because its record does not say why it was closed. Qa-3 is not counted, because one qa walk on the merge head is needed in any case. Qa-3's own blocker, the recorder reading a story title from the file path (QA3-1), is a recorder defect tracked in ORV-94 (comment 10130) and is not part of this lesson.

ORV-94 also lists "a slice spec not found" as a recorder defect. If the recorder learns to read a parent spec, the tokens above would not have been spent either way. This lesson is the process side: every issue has its own spec folder (AGENTS.md, `docs/specs/<ISSUE-KEY>/`), so the slice's PR links its own spec, and the slice's revisions stop changing another issue's spec front matter (qa finding QA1-1 on the ORV-100 spec version is what moved the head from `797cf34` to `b7368bd`).

Related: [[L-0010-one-builder-task-built-six-deliverables]], [[L-0011-spec-revision-and-fix-ran-in-parallel]].

## Rule

In `.claude/skills/ovl/SKILL.md`, "The loop", step 2 (Discover), add a sentence at the end:

```diff
-2. **Discover** (M, L). Dispatch `product` with the `discover` skill; it writes `docs/specs/<KEY>/spec.md` with acceptance criteria and open questions.
+2. **Discover** (M, L). Dispatch `product` with the `discover` skill; it writes `docs/specs/<KEY>/spec.md` with acceptance criteria and open questions. When a slice becomes its own Jira issue, the same `product` task writes `docs/specs/<slice key>/spec.md` (why, the parent spec and its G1 and G2 comments, the slice's acceptance rows copied with their numbers and no new requirement), and the slice's first builder envelope carries the fact `test -f docs/specs/<slice key>/spec.md` (L-0016).
```

The slice spec adds no requirement and no gate; the parent's G1 and G2 still apply. A revision for a slice's review finding is written in the slice spec's changelog.

What proves it was done: for each slice issue created after promotion, `git log --diff-filter=A -- docs/specs/<slice key>/spec.md` shows the file added before the first builder commit on the slice branch, and no qa task of that issue is closed with no recorded result for a missing spec.

The `Check:` line names ORV-102 as a provisional key. Before the measurement it is replaced by every slice issue created after promotion, each collected first with `collect <ISSUE>`. With fewer than 5 tasks in those issues the verdict is `not enough data`.

## Expected saving

- Metric: sum of `tokens.total` over tasks spent because a slice issue had no spec of its own (qa tasks closed with no recorded result for a missing spec, a slice spec written after the first qa walk, and the re-check of the head it made), per slice issue
- Baseline: sum 2,311,110, n=3, from ORV-101 tasks qa-2, spec-1 and review-5 (`node scripts/ovl/metrics.mjs report ORV-100 ORV-101`; per-task tokens from `.orivilo/metrics/ORV-101.json`)
- Target: 0 per slice issue; the slice spec moves into the split, an estimated 170,000 tokens once (spec-1 used 165,092)
- Guard metric: the slice spec's acceptance rows match the parent's rows cell for cell (ORV-101-review-5 checked this), and each slice still gets one qa walk with a recorded result on its merge head
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-102`
- Check after: 2026-11-08

Status: promoted 2026-10-25, into `.claude/skills/ovl/SKILL.md` (The loop, step 2)
