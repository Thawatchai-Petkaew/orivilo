---
id: L-0041
date: 2026-10-27
issue: [ORV-128]
what_happened: All five findings of the ORV-128 G2 round 2 re-check (N1 to N5 on PR 126) were text in one document that a round 1 fix in another document had made stale or left undefined, and round 3 found one more (S10), so the fixes after round 2 and the third review used 2,997,685 tokens.
cause: Every fix envelope's `done_when` grepped only the file in its own `write_set`, and nothing asked the fix role to search the other documents of the set for the terms its change replaced or introduced, so the drift was found by the reviewer instead of by the fix.
rule: For each name, value, rule or row that a fix adds, removes, renames or narrows, the fix envelope gets a `done_when` `git grep` of the old and new term over every other document in the PR's docs set, and the fix role lists each hit outside its `write_set` in `needs_decision` as `file:line`, old text, new text.
---

## What happened

Records are under `.orivilo/runs/ORV-128/`; tokens are `tokens.total` from `.orivilo/metrics/ORV-128.json`. The docs set of PR 126 is `docs/specs/ORV-128/spec.md`, `docs/specs/ORV-128/tech.md`, `docs/adr/0019-page-renderer-placement.md` and K-0081.

Round 2 (`ORV-128-review-g2-2`, verdict `request_changes`), each finding against the round 1 fix that caused it and that fix's `done_when`:

- N1 (Important), ADR 0019 line 52: `design-schema-4` made `readUrlInput` the only way in (I2) in tech.md; the ADR's `cli.ts` bullet still wired `readPage`. `design-schema-4`'s `done_when` grepped tech.md only.
- N2, ADR 0019 line 37: the options table still restated option D after `arch-renderer-3`'s I1 fix, whose `done_when` grepped only `slice 1d` and `decisions 1 to 4, 6`.
- N3, tech.md line 867: `product-spec-8` added the NAT64 URLs to spec row 5 (F15); tech.md row 5 kept them as extras and missed the one URL that must be read. `product-spec-8`'s `done_when` grepped spec.md only.
- N4, spec.md line 201: `design-schema-4`'s I3 fix gave base model-reading to every `fromModel` item in tech clause 5; the spec's confidence table, the home of the bases, kept the old "When".
- N5, spec.md line 342: `product-spec-7` moved row 38 to slices 1c and 1d asserting "the report schema"; tech.md defined none. A grep of tech.md for the new term would have returned nothing.

Round 3 (`ORV-128-review-g2-3`, verdict `approve`) raised four suggestions; one (S10, tech.md line 885, "about 580 lines" after `design-schema-6` moved the section 12 total to 625) is the same kind of drift, inside one file. S9, S11 and S12 are not drift.

Tokens after the round 2 re-check: `arch-renderer-5` 133,656, `product-spec-9` 423,573, `design-schema-6` 1,220,910, `product-spec-10` 296,930, `design-schema-7` 211,881, `product-spec-11` 80,599 and `review-g2-3` 630,136, sum 2,997,685, 10.0% of the issue's 29,893,601. `design-schema-7` and `product-spec-11` are also counted in [[L-0040-bookkeeping-follow-ups-one-role-at-a-time]]; the two lessons' sums overlap by 292,480.

[[L-0035-fix-reports-named-the-round-2-findings]] (promoted 15:49 UTC, before this batch started at 16:39) has the main session grep the PR for the old value of a finding that corrects a value. It did not reach N1 to N5: the stale terms came from the fix's own design (a new gate, a wider base, a moved row), not from a value the finding named, so only the fix role knew them. [[L-0029-fix-walked-only-the-lines-named]] covers lines one rule governs in one document; [[L-0039-one-rule-stated-in-two-sections]] covers restatements, which explains N2 but not N1, N3, N4 or N5.

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, section 2, after the "Before a re-check" bullet (line 121):

```diff
+- **A fix greps the other documents.** For each name, value, rule or row the fix adds, removes,
+  renames or narrows (from the finding's `expected` and the objective), the fix envelope gets one
+  `done_when` `git grep -n -F '<term>' -- <each other document of the PR's docs set>` for the old term
+  and one for the new term, and its objective asks the role to do the same for every term its own
+  design introduces. Each hit outside the `write_set` goes in the report's `needs_decision` as
+  `file:line`, old text, new text, and the main session sends it with the round's bookkeeping (L-0040)
+  or as a content fix. For `product`, which has no shell, the main session runs these `done_when`
+  lines after the task (L-0041). No hook checks this; it is the main session's duty.
```

In `.claude/agents/product.md` after line 44, `.claude/agents/architect.md` after line 24 and `.claude/agents/ds-architect.md` after line 28:

```diff
+- Before you report a fix, search the other documents of the PR's docs set (spec, tech notes, ADRs,
+  knowledge entries) for each term your change replaces and each term it introduces. List each hit
+  outside your `write_set` in `needs_decision` as `file:line`, old text, new text, and add one
+  `verified` row per term with the search and its hit count (L-0041). No hook checks this.
```

What proves it was done: on the next docs set with a fix round, every fix envelope's `done_when` has a `git grep` over at least one document outside its `write_set`, every fix report has one `verified` row per replaced or introduced term, and the first re-check raises no finding of text that a round 1 fix made stale in another document.

## Expected saving

- Metric: sum of `tokens.total` over the tasks dispatched after the first re-check of a docs set (fixes and later re-checks)
- Baseline: sum 2,997,685, median 296,930, n=7, from ORV-128 tasks arch-renderer-5, product-spec-9, design-schema-6, product-spec-10, design-schema-7, product-spec-11 and review-g2-3 (`node scripts/ovl/metrics.mjs report ORV-128`; per-task tokens from `.orivilo/metrics/ORV-128.json`)
- Target: 1,000,000 or less per docs set, the first re-check approving or raising no stale-text finding
- Guard metric: median `tokens.total` of a round 1 fix task does not rise by more than 20% (baseline median 323,480, n=7: research-renderer-2, arch-renderer-3, product-spec-7, design-schema-4, arch-renderer-4, product-spec-8, design-schema-5), and Important findings per first review do not fall
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-128`
- Check after: 2026-11-10

The `Check:` line names ORV-128 as a provisional key. Before the measurement it is replaced by every docs set reviewed after promotion, each collected first with `collect <ISSUE>`, and only tasks started after promotion count. With fewer than 5 comparable tasks after a first re-check the verdict is `not enough data`.

Status: promoted 2026-10-27, into `.claude/skills/ovl/SKILL.md` (section 2, "A fix greps the other documents", after the "Bookkeeping after the content fixes" bullet), `.claude/agents/product.md` (Standards), `.claude/agents/architect.md` (What you do) and `.claude/agents/ds-architect.md` (Output); Check after: 2026-11-10; no hook enforces it
