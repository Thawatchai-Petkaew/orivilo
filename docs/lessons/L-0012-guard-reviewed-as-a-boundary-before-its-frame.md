---
id: L-0012
date: 2026-10-24
issue: [ORV-95]
what_happened: Two review rounds on the ORV-95 merge-guard kept finding new shell and CLI ways around its text rules, and six tasks (11,977,750 tokens, 39.9% of the issue) went into closing them before the owner reframed the guard as a guard rail and closed the second round with named limits and no code.
cause: The spec never said whether merge-guard was a guard rail for rule-following agents or a boundary against a session that sets out to defeat it, so the review envelope asked for "any way a session can move develop or main past the guard", an open class that a text rule cannot close, and every form found was routed to a builder round.
rule: Before a build, the spec of a guard that judges tool-call text states its frame, guard rail or boundary (and what enforces a boundary outside the session); for a guard rail, the review envelope names the frame, a bypass that only a session set on defeating the guard would type is reported once per class with one probe and goes to Honest limits without a builder round, and only forms a rule-following agent uses go to rework.
---

## What happened

Numbers from `.orivilo/metrics/orv-95.md` (`node scripts/ovl/metrics.mjs report ORV-95`) and the per-task figures in `.orivilo/metrics/ORV-95.json`. Every run was fresh. Finding ids and texts are in the records under `.orivilo/runs/ORV-95/` and in the `docs/specs/ORV-95/spec.md` changelog, v1.2 to v1.6.

Spec v1.0 and v1.1 described merge-guard as the check that blocks a merge without the records; neither said who it guards against. The first review envelope (`ORV-95-review-1`) asked for "any way a session can move develop or main past the guard or forge the records it reads".

| round | task             | tokens.total | findings                  | what the findings were                                                                                |
| ----- | ---------------- | ------------ | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1     | ORV-95-review-1  | 3,286,000    | 4 Critical, 1 Important   | F1 to F4: refspec, push binary, `insteadOf` and `gh api` forms around the text rules                  |
| 1     | ORV-95-qa-1      | 1,900,662    | 2 Important, 3 Suggestion | QA-F1, QA-F3, QA-F4 repeat review F3, F2, F6; QA-F2 adds a `curl` form                                |
| fix   | ORV-95-spec-v1-2 | 1,520,389    |                           | text stage becomes a push allow list, config and API forms block                                      |
| fix   | ORV-95-spec-v1-3 | 1,112,050    |                           | token and host forms (QA-F2)                                                                          |
| fix   | ORV-95-r1-text   | 1,847,940    |                           | builder rework of the text stage                                                                      |
| fix   | ORV-95-r2-export | 1,251,480    |                           | builder rework of the export stage                                                                    |
| 2     | ORV-95-review-2  | 4,219,959    | 3 Critical, 1 Important   | N1 to N5: segment splitting, `gh alias`, short-flag groups, GraphQL from a file, `curl -sX`           |
| 2     | ORV-95-qa-2      | 2,025,932    | 3 Important, 2 Suggestion | QA2-F1 `git replace`, QA2-F2 colon-less refspec; QA2-F3 and QA2-F4 repeat N2 and N5                   |
| 3     | ORV-95-review-3  | 372,107      | 1 Critical, 1 Important   | R3-1, R3-2: the v1.5 limits overstated what a ruleset holds; no new bypass hunted (envelope boundary) |
| 4     | ORV-95-review-4  | 179,503      | 1 Suggestion              | approve                                                                                               |

The six tasks that answered the bypass findings (v1.2, v1.3, R1, R2, review-2, qa-2) used 11,977,750 tokens, 39.9% of the issue's 30,054,298. The allow list that round 1 built opened the round 2 forms: the review-2 envelope asked to "hunt for a new bypass the allow list opened", and it found five. The owner then decided (ORV-95 comment 10109) that merge-guard is a guard rail for rule-following agents, named every second-round finding in Honest limits with no code change and no further builder round, and pointed at GitHub rulesets (ORV-97) as the boundary. From the end of review-1 (13:25:51) to the start of the reframing revision v1.5 (14:07:03) was 2,471 seconds.

After the frame was set, the review-3 envelope said "a finding of the shell-or-CLI-trick class that the v1.5 limits already name is not a new finding". Review-3 used 372,107 tokens and review-4 179,503, against 3,286,000 and 4,219,959 before. This drop is partly because review-3 and review-4 judged a docs-only diff, so it is a sign, not the measured saving.

New evidence for [[L-0008-recheck-costs-like-a-first-review]]: the review-2 envelope followed that rule (it pointed at the previous result and the rework diff `8c95e5b..HEAD`) and still cost 4,219,959, more than review-1's 3,286,000, because its objective also asked for a new bypass hunt. A re-check scoped to the previous findings stays cheap only when the frame limits what a new hunt counts as.

Not a repeat of [[L-0011-spec-revision-and-fix-ran-in-parallel]]: here the revision ran before the fix as L-0011 asks; the cost came from what the findings were routed to.

## Rule

Two changes, both before a guard PR is built.

1. In `.claude/agents/product.md`, Standards, add:

```diff
+- A spec for a guard (a hook that judges a tool call's text: Bash, `gh`, an MCP tool) says in its Why
+  which frame it has: a guard rail for agents that follow the rules, or a boundary against a session
+  that sets out to defeat it. A boundary names what enforces it outside the session (a server rule, a
+  credential the session does not hold); a text rule alone is never a boundary. The spec lists the
+  forms a rule-following agent uses (the commands in skills, agent files and AGENTS.md) as the forms
+  the guard must catch (L-0012).
```

2. In `.claude/skills/ovl/SKILL.md`, step 2, add after the Contract change bullet:

```diff
+- **Review of a guard-rail spec.** When the spec frames a guard as a guard rail, the reviewer
+  envelope's objective names the frame and asks for (a) forms a rule-following agent uses that pass
+  the guard and (b) bypass classes, each reported once with one probe. A finding of kind (a) goes to
+  rework as usual. A finding of kind (b) goes to the spec's Honest limits in the next revision, with no
+  builder round, unless the owner decides otherwise in the question form. A re-check envelope says
+  that a bypass of a class already named in Honest limits is not a new finding (L-0012).
```

What proves it was done: for the next guard spec (ORV-98 `g3-check`, then ORV-96), the spec's Why states the frame before G2, the first review envelope's objective names it, and each kind (b) finding appears in Honest limits with no builder task whose `rework_of` answers only kind (b) findings.

The reviewer still hunts and reports every bypass class it finds, so no review is removed; only the routing of a class finding changes from a builder round to a named limit, which is what the owner decided for ORV-95 in comment 10109.

The `Check:` line names ORV-98 and ORV-96, the next guard issues, as provisional keys. Before the measurement after `Check after:`, the list is replaced by every guard PR reviewed after promotion, each collected first with `collect <ISSUE>`, and only tasks started after promotion count. With fewer than 5 tasks after a first review verdict on guard PRs, the verdict is `not enough data`.

## Expected saving

- Metric: sum of tokens.total per guard PR over the spec revisions, builder rework, re-check reviews and qa walks that answer bypass findings after the first review verdict
- Baseline: 11,977,750 in ORV-95 over n=6 tasks (ORV-95-spec-v1-2, ORV-95-spec-v1-3, ORV-95-r1-text, ORV-95-r2-export, ORV-95-review-2, ORV-95-qa-2), 39.9% of the issue's 30,054,298; reviewer and qa runs before the frame median 2,655,966, n=4 (`node scripts/ovl/metrics.mjs report ORV-95`, per-task figures from `.orivilo/metrics/ORV-95.json`)
- Target: 4,000,000 or less per guard PR, about 65% less: one fix round for kind (a) forms, one revision that names the kind (b) classes, one re-check
- Guard metric: kept Critical and Important kind (a) findings (spec compliance and forms a rule-following agent uses) per first review do not fall, and every bypass class a review or qa reports appears in the spec's Honest limits before G3; the time from the first review verdict to the last re-check's start stays at or under 2,471 s (ORV-95: review-1 end to v1.5 start)
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-98 ORV-96`
- Check after: 2026-11-07

Related: [[L-0008-recheck-costs-like-a-first-review]], [[L-0011-spec-revision-and-fix-ran-in-parallel]], [[L-0013-qa-findings-took-a-second-revision]].

Status: promoted 2026-10-24, into `.claude/agents/product.md` (Standards, guard frame) and `.claude/skills/ovl/SKILL.md` (Review of a guard-rail spec, step 2)
