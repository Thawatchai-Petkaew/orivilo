---
id: L-0040
date: 2026-10-27
issue: [ORV-128]
what_happened: In the ORV-128 G2 design round (PR 126), four writing-role tasks did only bookkeeping that another task's report had raised (a version number, a status row, a stale pointer), each report raising the next, for 882,079 tokens, and review g2-1 spent an Important finding (I6) on tech.md naming an old spec version.
cause: The main session dispatched each fix report's `needs_decision` line as its own envelope as soon as it arrived, and tech.md names the spec version in body text, so every spec version bump (v1.3 to v1.8) made a tech.md pass due.
rule: The main session holds every report line that only brings a reference, a version number, a status row or a pointer up to date until all content fixes of the round are back, then sends one envelope per role that holds them all before the re-check; tech.md and an ADR name the spec version in one place only and cite the spec by section name and row number elsewhere.
---

## What happened

Records are under `.orivilo/runs/ORV-128/`; tokens are `tokens.total` from `.orivilo/metrics/ORV-128.json` (collected for `node scripts/ovl/metrics.mjs report ORV-128`, saved as `.orivilo/metrics/orv128-g2.md`). Times are UTC on 2026-10-26. The G2 batch is 24 tasks for 22,691,493 tokens: `arch-renderer-1` to `-5`, `design-schema-1` to `-7`, `product-spec-5` to `-11`, `research-renderer-1` and `-2`, `review-g2-1` to `-3`.

Report-to-report chains, each link a `needs_decision` line in one report that became the next envelope:

- `design-schema-4` (ended 17:45:32) could not touch tech.md section 13 (the architect's section) and named its option D bullet as I1's last open spot. `arch-renderer-4` started 18 seconds later (323,480 tokens). Its report named the I1 status row in the ds-architect's part of the same file, and `design-schema-5` (266,119 tokens) ran to mark it and move the front matter to spec v1.6.
- `design-schema-6` raised F19; `product-spec-10` (17:59:47) applied it and its report said tech.md section 7 now disagreed; `design-schema-7` (18:01:14, 211,881 tokens) moved tech.md to v1.8 and its report said the spec's closing sentence was stale; `product-spec-11` (18:02:27, 80,599 tokens) changed that one sentence. Three hops in under three minutes.
- `product-spec-9`'s report asked for the F18 row in tech.md; that one was folded into `design-schema-6` with N3 and N5, and no task of its own ran.

The four tasks that did only bookkeeping (`design-schema-5`, `design-schema-7`, `arch-renderer-4`, `product-spec-11`) used 882,079 tokens, 2.95% of the issue's 29,893,601, median 239,000. The main session's own context for the four extra dispatches and reads is not split per task and is not counted here.

Version references: four of seven `design-schema` objectives begin "bring tech.md up to spec v1.N" (`-3`, `-5`, `-6`, `-7`), one per spec bump. At merge commit `82488eb`, `grep -o -E 'spec v1\.[0-9]+' docs/specs/ORV-128/tech.md` counts 23 mentions over six versions (v1.2 to v1.8), and review g2-1 raised I6 (Important) because the front matter and rule table named v1.3 while the spec was v1.4. ADR 0019 still cites "spec v1.4" on lines 3 and 115 after the spec reached v1.8; no review round caught it.

[[L-0035-fix-reports-named-the-round-2-findings]] makes the main session act on every such line before the re-check; this lesson does not change that. It changes when and how those lines are sent: once, together, per role.

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, section 2, after the "Before a re-check" bullet (line 121):

```diff
+- **Bookkeeping after the content fixes.** A report line (`needs_decision` or `deviations`) that only
+  brings a reference, a version number, a status or findings row, or a pointer in another document up to
+  date is bookkeeping. Do not dispatch it alone. Hold it until every content fix of the round is back,
+  then send one envelope per role in the L-0033 order that owns a named document, with every held line as a fact
+  (`file:line`, old text, new text), before the re-check (L-0035 still applies). A line that changes a
+  rule, a field, a closed list or a number a test asserts is a content fix and is dispatched as now. A
+  finding whose spots sit in two roles' sections of one file goes to one envelope whose `write_set`
+  covers every spot (L-0040). No hook checks this; it is the main session's duty.
```

In `.claude/agents/ds-architect.md`, section Output, after line 28, and in `.claude/agents/architect.md`, section Output, after line 36:

```diff
+tech.md names the spec version once, in its `spec:` front matter; an ADR names it once, in its Status
+line. Everywhere else cite the spec by section name and row number, never "spec v1.N". A changelog or
+findings-status row may name the version it was applied in, because that is history (L-0040).
```

What proves it was done: in the next docs set with a review round, no writing-role task's objective is only a version bump or a status row while another task of the same role in that round is still to come; each role gets at most one bookkeeping envelope per round, and `grep -c -E 'spec v1\.[0-9]+' docs/specs/<KEY>/tech.md` counts only the front matter and history rows.

## Expected saving

- Metric: sum of `tokens.total` over writing-role tasks (product, architect, ds-architect) whose objective only brings a version number, a status row or a pointer up to date, or closes a spot another task's report named, per review round of a docs set
- Baseline: sum 882,079, median 239,000, n=4, from ORV-128 tasks design-schema-5, design-schema-7, arch-renderer-4 and product-spec-11 (`node scripts/ovl/metrics.mjs report ORV-128`; per-task tokens from `.orivilo/metrics/ORV-128.json`)
- Target: at most one bookkeeping task per role per review round, and 440,000 or less in total per docs set (half the baseline)
- Guard metric: re-check findings that name a stale reference, version or status row stay at 0 per re-check (review g2-1 had 1, I6), and no re-check starts while a held bookkeeping line is unsent
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-128`
- Check after: 2026-11-10

The `Check:` line names ORV-128 as a provisional key, since its slices 1a to 1d revise the same spec and tech notes. Before the measurement it is replaced by every docs set reviewed after promotion, each collected first with `collect <ISSUE>`, and only tasks started after promotion count. With fewer than 5 comparable writing-role fix tasks the verdict is `not enough data`.

Status: promoted 2026-10-27, into `.claude/skills/ovl/SKILL.md` (section 2, "Bookkeeping after the content fixes", after the "Before a re-check" bullet), `.claude/agents/ds-architect.md` (Output) and `.claude/agents/architect.md` (Output); Check after: 2026-11-10; no hook enforces it
