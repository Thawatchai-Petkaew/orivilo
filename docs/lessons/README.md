# Lessons

What went wrong in our own work, why, and the rule that changes the process so it does not happen again. One lesson per file. Knowledge (`docs/knowledge/`) is what we learned from outside sources; a lesson is what we learned from our own mistakes.

## Where lessons live

```text
docs/lessons/L-NNNN-<kebab-slug>.md
```

`L-NNNN` is four digits, taken in order, never reused.

## Format

```markdown
---
id: L-0001
date: 2026-10-23
issue: [ORV-72, ORV-80]
what_happened: One sentence, the visible failure.
cause: One sentence, why it happened, not what happened.
rule: One sentence that says what changes in the process.
---

## What happened

The facts, with Jira keys, PR numbers, files or commands, so a reader can check them.

## Rule

The rule in full: who does what, when, and what proves it was done.

Status: proposed
```

- `issue` lists the Jira keys the lesson came from.
- `rule` must change the process: a check, a step, a gate item or a command. "Be more careful" is not a rule.
- Status is `proposed` until the owner approves the change in the rule file it targets (`.claude/rules/`, an agent file, a skill or AGENTS.md); then it becomes `promoted`, with the file named. This is the same flow as the `retro` skill.
- A lesson that proposes a change for cost or flow adds two sections. `## Expected saving` goes after `## Rule` and is checked by `pnpm check:knowledge`; `## Measured after` is added later, by the improvement run that re-checks it. Spec: `docs/specs/ORV-87/spec.md`, "Improvement loop".

```markdown
## Expected saving

- Metric: median `tokens.total` per reviewer run with round 1 or more
- Baseline: median 2,660,391, n=3, from ORV-81, ORV-85 (`node scripts/ovl/metrics.mjs report ORV-81 ORV-85`)
- Target: median 1,000,000 or less, about 60% less per re-check
- Guard metric: kept Critical and Important findings per review do not fall
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-90 ORV-91`
- Check after: 2026-11-06

## Measured after

- Measured: median 900,000, n=5, from ORV-90, ORV-91 (the Check command), 2026-11-07
- Guard metric: kept Critical and Important findings per review, 2.1 before and 2.2 after
- Verdict: met
```

- The example shows the format only; it is not a measured proposal.
- Seven lines are required in `## Expected saving`, each as `- Name: value`. `Baseline:` has `n=` of 3 or more and cites the command that produced it. `Metric:`, `Baseline:` and `Target:` count `tokens.total` or one of the four kinds, never `reported_total` or a notice figure. `Check:` is one `node scripts/ovl/metrics.mjs <collect|report|session|due> <args>` command in backticks; args are issue keys, `--flag` values and plain names, with no `; & | $` backtick, `<`, `>` or newline. `Check after:` is a date: provisional at the proposal, and the promotion envelope sets it to the promotion date plus 14 days. `Evidence removed:` is `none`, or names the check, review or record the change removes; anything else touches a gate (ADR 0012, ADR 0013), so the proposal says so in its first line and needs an ADR amendment as well as the owner's approval.
- `## Measured after` holds `Measured:` (median, `n=`, issues, the command, the date), `Guard metric:` (its value) and `Verdict:` (`met`, `not met` or `not enough data`). A `not met` verdict comes with a new proposal to revert or change the rule. `node scripts/ovl/metrics.mjs due` lists the promoted lessons past `Check after` that have no `## Measured after`.
- A lesson quotes numbers and task ids, never an excerpt of a transcript.
- Link related knowledge or lessons with wikilinks, such as `[[K-0005-proof-must-match-the-claim]]`. No Dataview queries (see `docs/knowledge/README.md`, Reading in Obsidian).

## Relation to `docs/LESSONS.md`

`docs/LESSONS.md` is the ledger. For each lesson the `retro` skill writes three things: the `L-NNNN` file in this folder, one row in the ledger that points at the file, and one row in the Index below. The ledger row and the file's `Status:` line carry the same status.

## Index

| Lesson                                                   | Issue                  | Rule in short                                                              |
| -------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| [[L-0001-g3-passed-visual-defects]]                      | ORV-72, ORV-80         | A UI PR shows the render; the reviewer looks at it before G3               |
| [[L-0002-a-test-that-cannot-fail]]                       | ORV-78                 | A new guard test is seen to fail once before it counts                     |
| [[L-0003-squash-reset-reverted-a-merged-pr]]             | ORV-77                 | No `reset --soft` onto a moved base; the diff lists only our files         |
| [[L-0004-delete-branch-left-remotes]]                    | ORV-79                 | Delete the remote branch by hand and check `ls-remote`                     |
| [[L-0005-issues-missing-from-the-sprint]]                | ORV-79                 | A new issue joins the active sprint in the same step                       |
| [[L-0006-main-session-worked-solo]]                      | ORV-81                 | Role agents build; a QA agent that did not build accepts                   |
| [[L-0007-turbo-cache-hid-skipped-tests]]                 | ORV-13                 | Test runs for a handoff use `--force`                                      |
| [[L-0008-recheck-costs-like-a-first-review]]             | ORV-87, ORV-90, ORV-91 | A re-check starts from the previous findings and the rework diff           |
| [[L-0009-full-suite-loops-to-verify-a-flaky-fix]]        | ORV-76                 | Verify a fix with affected tests, the full suite once                      |
| [[L-0010-one-builder-task-built-six-deliverables]]       | ORV-93                 | One builder task per deliverable; split an envelope over 8 pointers        |
| [[L-0011-spec-revision-and-fix-ran-in-parallel]]         | ORV-93                 | After a contract-changing review, the spec revision runs before the fix    |
| [[L-0012-guard-reviewed-as-a-boundary-before-its-frame]] | ORV-95                 | A guard spec states guard rail or boundary; bypass classes become limits   |
| [[L-0013-qa-findings-took-a-second-revision]]            | ORV-95                 | One spec revision waits for both review and qa on one head                 |
| [[L-0014-qa-walked-a-head-the-recheck-rejected]]         | ORV-98, ORV-95, ORV-93 | From round 1, qa walks only a head the reviewer re-check approved          |
| [[L-0015-geometry-defects-found-by-the-reviewer-probe]]  | ORV-101, ORV-100       | The builder measures placement AC in a browser at two sizes before handoff |
| [[L-0016-slice-issue-had-no-spec-of-its-own]]            | ORV-101, ORV-100       | A slice issue gets its own spec file before its first build                |
| [[L-0017-rework-look-decided-in-text]]                   | ORV-107                | A visual fix in rework is mocked by the designer before the build          |
| [[L-0018-plays-assert-properties-not-the-render]]        | ORV-107                | Visual plays measure edge ink, sibling height and glyph clip               |
| [[L-0019-no-designer-looked-at-the-built-head]]          | ORV-107                | A designer signs off screenshots of each approved UI head before qa        |
| [[L-0020-knowledge-index-left-out-of-the-pr]]            | ORV-109                | check:knowledge fails on an entry with no Index row                        |
| [[L-0021-synthesis-contradicted-its-own-source]]         | ORV-109                | A synthesis checks every universal word against the entries it cites       |
| [[L-0022-press-figures-with-no-url-in-source]]           | ORV-109                | Every body fact rests on a URL in `source:` read in the same task          |
| [[L-0023-research-role-cannot-run-its-checks]]           | ORV-109                | The main session runs research done_when before the review                 |
| [[L-0024-source-guard-sampled-one-syntax-form]]          | ORV-20                 | A source-text guard fails once on every syntax form it blocks              |
| [[L-0025-spec-deviation-went-to-review]]                 | ORV-20                 | A builder deviation on a spec row goes to product before review            |
| [[L-0026-gate-database-url-missing-from-the-fact]]       | ORV-20                 | A gate-passed fact names the database URL it ran with                      |
| [[L-0027-stalled-reviewer-went-unnoticed]]               | ORV-20                 | List silent bound envelopes before each dispatch and after compaction      |
| [[L-0028-visual-keyword-rule-on-a-non-ui-story]]         | ORV-20                 | The visual keyword rule applies only to a diff with UI paths               |
