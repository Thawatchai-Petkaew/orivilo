---
id: L-0035
date: 2026-10-26
issue: [ORV-127]
what_happened: Both round 2 findings on PR 115 (F8 Important on K-0048's claim, F9 on the cut-off options entry's claim) had been written into the round 1 fix reports before the re-check was dispatched, and the knowledge fix had spread the old figure into one more line, so a third fix and a third review followed.
cause: F1 named only the spec, so the corrected value went only to the spec fix and the knowledge entries that held the same figure got no envelope for it, and nothing makes the main session act on a fix report's `deviations` and `needs_decision` before a re-check (the rule that does exists only for research envelopes that add an entry).
rule: Before a re-check, the main session greps the PR for the old value of every finding that corrects a value and gives each hit's file to a fix envelope, and turns every line of a fix report's `deviations` or `needs_decision` that names a remaining disagreement into a fix envelope first.
---

## What happened

Records are under `.orivilo/runs/ORV-127/`; tokens are `tokens.total` from `.orivilo/metrics/ORV-127.json`; times are UTC on 2026-10-26.

- `ORV-127-review-docs-1` (ended 13:48:23) raised F1 on `docs/specs/ORV-127/spec.md:20` only: the level 5 row mixes two bases (see [[L-0034-level-5-count-mixed-two-bases]]). At that head `git grep -n "about 1,065\|about 26" e0d5f0e` also hits K-0048 lines 4 and 38.
- `ORV-127-research-fix-review-1` (13:48:38 to 13:50:21, 511,499 tokens) got F3, F4, F6 and F7 with the boundaries "Change only what the findings name" and "Do not touch docs/specs". It corrected line 21 of the cut-off options entry to "about 1,065", the old base, so at `c0e1145` the same grep hits that line too. Its `deviations` says the entry's frontmatter claim still says 408 classes and that "that is a one-line follow-up edit".
- `ORV-127-product-spec-4` (13:54:04 to 13:54:59, 219,744 tokens) fixed F1, F2 and F5 in the spec. Its `needs_decision` says "K-0048's frontmatter claim still says 'about 1,065' against 1,091, so it disagrees with spec v1.2. It is outside this write_set".
- `ORV-127-review-docs-2` started at 13:57:39, 2 minutes 40 seconds later, with both reports in hand. It found F8 Important (K-0048's claim, the needs_decision line above) and F9 (the cut-off options entry's claim, the deviation line above).
- `ORV-127-research-fix-review-2` (121,855 tokens) and `ORV-127-review-docs-3` (197,536 tokens, approve) followed: 319,391 tokens, 3.3% of the issue's 9,794,685, plus F10 and F11, two suggestions about notes that described the round 2 state.

The order of the round 1 fixes already matched [[L-0033-spec-and-adr-fixed-in-parallel]] (knowledge first, then spec), and [[L-0029-fix-walked-only-the-lines-named]] would have dropped the "change only what the findings name" boundary. Both were promoted after these tasks ran (commit `292f321`, 22:49 +07). Neither covers what failed here: the corrected value was decided in the later fix, the earlier fix's files held the same value under a finding that named another file, and both reports said so before the re-check. The existing duty in `.claude/skills/ovl/SKILL.md` ("A `needs_decision` or deviation about a file outside the `write_set` is answered by a new envelope before the review is dispatched") sits under research envelopes that add an entry, so it did not reach a product fix.

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, section 2, after the "Fixes across documents that cite each other" bullet:

```diff
+- **Before a re-check.** For every finding that corrects a value (a count, a code, a date, a name),
+  run `git diff origin/develop...HEAD | grep -n '<old value>'` before the fixes go out, and give each
+  file it hits to a fix envelope with the corrected value as a fact, in the L-0033 order. After the
+  fixes, read every fix report's `deviations` and `needs_decision`; a line that names a file, a line
+  or a value still out of step goes to a new fix envelope before the re-check is dispatched, whatever
+  the role (L-0035). No hook checks this; it is the main session's duty.
```

What proves it was done: on the next PR with a value-correcting finding, the main session's grep and its hits appear as facts in the fix envelopes, no re-check `started_at` precedes a fix whose report names a remaining disagreement, and the re-check raises no finding that a fix report had already named.

Status: promoted 2026-10-26, into `.claude/skills/ovl/SKILL.md` (section 2, "Before a re-check", after the "Fixes across documents that cite each other" bullet); no hook enforces it
