---
id: L-0052
date: 2026-11-06
issue: [ORV-217]
what_happened: Review 1 of PR 182 found that a second Copy press with the same result, and every retry after a failure, left the polite status region unchanged and so unannounced (R1, Important), and the rework round that fixed it ran a builder, a re-check and a second designer sign-off.
cause: Spec rule `copy-status-1` and its AC rows checked the status region after one press only, so the builder's plays and the first designer sign-off passed a region whose text never changes on a repeat.
rule: An expected result that reads text from a live region (`role="status"`, `role="alert"`, `aria-live`) also gets a row where the same text is set twice in a row, whose check proves the region is written again, such as a MutationObserver that records two writes.
---

## What happened

Records are under `.orivilo/runs/ORV-217/`; tokens are `tokens.total` from `.orivilo/metrics/ORV-217.json` (`node scripts/ovl/metrics.mjs report ORV-217`, saved as `.orivilo/metrics/orv-217-retro.md`).

- `docs/specs/ORV-217/spec.md` rule `copy-status-1` with AC rows 2, 4, 5 and 6 asserts that the `role="status"` region reads "คัดลอกคำตอบแล้ว" or `chat.copyFailed` after one press. No row presses twice with the same result.
- `ORV-217-review-1` (1,461,269 tokens, head `6cead83`, verdict `request_changes`) raised R1 (Important) at `packages/design-system/src/components/canvas-chat/CanvasChat.tsx:444`. A second press sets the same string, React makes no DOM change, and the region says nothing. This covers a second Copy within 2000 ms, on the same reply or another one, and every retry after a failure, because the failed status never clears.
- The rework round: `ORV-217-build-2` (697,328), `ORV-217-review-2` (563,835, approve on `e8fcadc`) and `ORV-217-signoff-2` (1,236,693, re-shot five stories for a change with no CSS, locale or layout edit). Together that is 2,497,856 tokens, 7.9% of the issue's 31,468,143. The fix added the `CopyAnnouncesEachPress` play.
- K-0114 (role status is a polite live region, `aria-atomic` true) was in the spec's knowledge. It says how a change is read, not that an unchanged text is not read again.

No earlier lesson or rule names live-region repeats: `grep -rn -i 'aria-live\|live region\|polite' .claude/rules .claude/agents/product.md DESIGN.md docs/lessons` at `751f524` finds only three catalog rows of `DESIGN.md` (lines 293, 294 and 300: TaskBar, CanvasChat and Locale structure), and none speaks of a repeated text.

## Rule

Proposed diff, for the owner to approve. No rule file is edited in this retro.

In `.claude/agents/product.md`, section Standards, after the last bullet (line 47):

```diff
+- An expected result that reads text from a live region (`role="status"`, `role="alert"`,
+  `aria-live`) also gets a row where the same text is set twice in a row (a repeat press, a retry
+  after a failure). Its check proves the region is written again, for example a MutationObserver that
+  records two writes (L-0052).
```

What proves it was done: the next spec whose AC reads a live region has a repeat row, and the builder's play for it fails on a build that sets the same text without a reset.

Expected effect, not a measured proposal (n=1, so no `## Expected saving`): the repeat case is built and tested in round 0 and needs no rework round (2,497,856 tokens here). Guard metric: Critical and Important findings on live-region announcements in round 0 reviews stay at 0, and no spec adds such a row without a play that can fail.

Status: proposed
