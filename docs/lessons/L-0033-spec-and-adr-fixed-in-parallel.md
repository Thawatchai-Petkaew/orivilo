---
id: L-0033
date: 2026-10-26
issue: [ORV-126]
what_happened: On PR 114 the spec, ADR 0018 and the knowledge entries were fixed by three roles at the same time from one review, so the second review found the spec and the ADR describing each other's state before the fixes, and two more fix tasks and a third review followed.
cause: L-0011 orders a product revision before a builder fix, but nothing orders fixes by product, architect and research when one review's findings land in documents that cite each other, so each role edited its file against the others' old text.
rule: When one review's findings land in two or more documents that cite each other, the main session dispatches the fixes one at a time, knowledge first, then the ADR, then the spec, each later envelope carrying the earlier fix's `result.json` path, and each finding id goes to exactly one envelope.
---

## What happened

PR 114 (branch `docs/ORV-126-ci-research`) carried the spec, ADR 0018 and K-0060 to K-0076. Times are UTC on 2026-10-26, from `.orivilo/metrics/ORV-126.json`.

- Before the review, `research-openrouter-images-1` (12:06 to 12:09) wrote K-0074 and K-0076 against ADR 0018 as `arch-image-provider-1` had left it, and `arch-image-provider-2` (13:03:46) then revised the ADR. `product-ci-graph-3` started at 13:04:24. `ORV-126-review-docs-1` found F4 (spec line 540 says the ADR is "not yet written" though it is in the same PR) and F5 (K-0074:55 and K-0076:40 describe a superseded ADR draft).
- `ORV-126-review-docs-1` ended at 13:20:03. Three fixes started within 23 seconds of each other: `product-ci-graph-4` (13:20:30), `arch-image-provider-3` (13:20:40) and `research-fix-review-1` (13:20:53). The research fix lowered K-0028 to 0.8 (S1), so `product-ci-graph-5` (144,659 tokens) ran only to change the spec's "(0.85)" citations of K-0028.
- `ORV-126-review-docs-2` (1,243,208 tokens) found N1 Important (ADR 0018's acceptance condition and the spec's sequence for the logo image story disagree) and N2 (the ADR's impact line and the spec's v1.3 changelog each describe the other before the fixes).
- `arch-image-provider-4` (13:30:16) and `product-ci-graph-6` (13:30:08) again ran in parallel, and `ORV-126-review-docs-3` approved.

The tasks after the round 1 re-check that came from the documents disagreeing used 756,095 tokens: `product-ci-graph-5` 144,659, `arch-image-provider-4` 157,315, `product-ci-graph-6` 259,317 and `review-docs-3` 194,804. The round 1 re-check itself would have run anyway.

This extends [[L-0011-spec-revision-and-fix-ran-in-parallel]] from spec and code to spec, ADR and knowledge entries. It stays a lesson of its own so that L-0011's promoted rule and its `Check:` are not changed.

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, step 2, after the "Contract change from a review" bullet:

```diff
+- **Fixes across documents that cite each other.** When one review's findings land in two or more of a
+  spec, an ADR and knowledge entries, dispatch one fix at a time in this order: `research`
+  (knowledge), then `architect` (ADR), then `product` (spec). Each finding id goes to exactly one
+  envelope. Each later envelope carries the earlier fixes' `result.json` absolute paths in
+  `context_pointers` and their changed files as facts, and its objective asks it to bring every
+  reference to those files up to date. The re-check is dispatched after the last fix (L-0033).
```

What proves it was done: on the next PR with findings in two or more such documents, the `started_at` of each fix in `.orivilo/metrics/<ISSUE>.json` comes after the `ended_at` of the one before it, and the re-check raises no finding that one document describes another's earlier state.

Status: promoted 2026-10-26, into `.claude/skills/ovl/SKILL.md` (section 2, "Fixes across documents that cite each other", after the "Contract change from a review" bullet); no hook enforces it
