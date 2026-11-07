---
id: L-0042
date: 2026-10-27
issue: [ORV-132]
what_happened: The first code review of ORV-132 slice 1a (PR 128) found five Important test gaps (R1-1 to R1-5) by applying one mutation per clause, after the builders of `evidence.ts` and `evidence-strings.ts` had reported their break-it checks red and restored, and the rework, the re-check and the second qa walk used 2,044,373 tokens.
cause: Each builder chose which clauses to break, because the envelope asked for "each break-it run once" and the tech notes' break-it read "remove one `checkItem` clause", so no step required one mutation for every clause, half-clause and closed list the module defines.
rule: A builder of a schema or guard module lists every clause the design numbers or names (each half of a two-part clause, each closed list's exact members, each bound), applies one mutation per clause before handoff, adds one `verified` row per clause with the test that went red, and writes the missing test for any mutation that survives; the reviewer checks the rows and raises a missing clause as a finding.
---

## What happened

Records are under `.orivilo/runs/ORV-132/`; tokens are `tokens.total` from `.orivilo/metrics/ORV-132.json` (`node scripts/ovl/metrics.mjs report ORV-132`, saved as `.orivilo/metrics/orv132-slice-1a.md`). The design is `docs/specs/ORV-128/tech.md` §2 (`checkItem` clauses 1 to 17), §9 (strings) and §14 (the break-it column); the slice spec is `docs/specs/ORV-132/spec.md`.

Four builder envelopes built the slice: `build-confidence-1`, `build-strings-1`, `build-leans-1` and `build-evidence-1`. Each objective asked for its break-it checks "run once and reported", and each report listed them red and restored:

- `build-evidence-1` (1,875,469 tokens): "drop clause 13 halves red (2 each); clause 5 red (2); clauses 15, 16, 17 red (1 each)", plus `.strict()`, `max(300)` and `retrievedAt` in the id. That is 5 of the 17 clauses by number.
- `build-strings-1` (139,797 tokens): "empty th, em dash and stray question key are reported as exactly three problems". The break-it fed a helper; it did not change `QUESTION_KEYS`.
- `build-confidence-1` and `build-leans-1` ran one mutation per rule they built (4 and 2); no finding touched their modules.

The tech notes §14 row 2 break-it reads "Remove `.strict()` or one `checkItem` clause: that case goes red". "One" was read as any one.

`ORV-132-review-code-1` (3,755,015 tokens, verdict `request_changes`) copied the package at `9f3f87d` to its scratchpad, applied each mutation alone, ran the three slice test files and restored the file. Survivors:

| finding | module                | clause                                                  | mutation that stayed green              |
| ------- | --------------------- | ------------------------------------------------------- | --------------------------------------- |
| R1-1    | `evidence.ts`         | 4 (quote only on a text kind)                           | M1 drop clause 4                        |
| R1-2    | `evidence.ts`         | 8 (factor ids unique and ascending, values the table's) | M2a order and unique, M2b factor values |
| R1-3    | `evidence.ts`         | 9, the `belowFloor` half                                | M3                                      |
| R1-4    | `evidence.ts`         | the value-fits-target check                             | M4                                      |
| R1-5    | `evidence-strings.ts` | `QUESTION_KEYS` equals the six keys                     | M5 swap one key                         |

Suggestion R1-7 lists five more survivors (clause 3 and clause 10 in one direction, clause 11 on `color.current`, `hue-family` with a number, the measure bounds). The sixth Important finding, R1-6, is a test in the wrong file and is [[L-0043-split-envelopes-left-tests-outside-the-named-file]].

`ORV-132-build-rework-1` (543,175 tokens) added the tests and ran each finding's mutation once: red for all of them. `ORV-132-review-code-2` (631,385) and `ORV-132-qa-2` (869,813) approved. Sum after the first code review 2,044,373, 15.6% of the issue's 13,116,608.

[[L-0002-a-test-that-cannot-fail]] asks for one red run per guard test, and [[L-0024-source-guard-sampled-one-syntax-form]] asks a text guard for one failing sample per syntax form. Both were met here; neither asks for one mutation per clause of a schema, so the builders' sample passed both and still left five clauses untested.

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/agents/builder.md`, "Loop per task", after step 5 (line 20):

```diff
+6. When the task builds a schema or a guard module (a zod schema with refinements, a validator, a
+   closed list, a check function), list every clause the design numbers or names: each numbered check,
+   each half of a two-part check, each closed list's exact members and order, each bound. Before
+   handoff apply one mutation per clause (delete or invert it, swap one list member, move a bound by
+   one), run the module's tests, and restore. Add one `verified` row per clause with the mutation and
+   the test that went red. A mutation that stays green gets its test before handoff, never a
+   deviation. A break-it in the design that reads "one clause" means each clause (L-0042). No hook
+   checks this.
```

Steps 6 and 7 become 7 and 8.

In `.claude/rules/testing.md`, after the guard bullet (line 19):

```diff
+- A schema or guard module is proven clause by clause: one mutation per numbered check, per half of a
+  two-part check, per closed list and per bound, each seen red and restored, one `verified` row each.
+  A sample of clauses is not enough (L-0042, widens L-0002). No hook checks this.
```

In `.claude/agents/reviewer.md`, "Pass 2: quality", after "Tests fail on the real defect" (line 25):

```diff
+- For a schema or guard module, the builder's report has one `verified` row per clause the design
+  numbers or names. A clause with no row is a finding (L-0042). Your own mutation run stays yours to
+  choose; this check does not replace it.
```

The other candidate, making the reviewer's mutation run standard for contract modules, is not proposed: it would move the same work to the most expensive task of the batch (`review-code-1`, 3,755,015) and still cost a rework round, while the builder run finds the gap before the review.

What proves it was done: on the next slice with a schema or guard module, the builder report has one `verified` row per clause of the design, and the first code review raises no Important finding whose evidence is a surviving mutation.

## Expected saving

- Metric: sum of `tokens.total` over the tasks dispatched after the first code review of a slice (rework, re-check, second qa walk)
- Baseline: sum 2,044,373, median 631,385, n=3, from ORV-132 tasks build-rework-1, review-code-2 and qa-2 (`node scripts/ovl/metrics.mjs report ORV-132`; per-task tokens from `.orivilo/metrics/ORV-132.json`)
- Target: 700,000 or less per slice, the first code review raising no Important finding from a surviving mutation
- Guard metric: median `tokens.total` of a fresh builder task does not rise by more than 30% (baseline median 235,355, n=5: build-confidence-1, build-strings-1, build-leans-1, build-evidence-1, build-rework-1), and suggestions from surviving mutations in the first code review do not rise above 5 (R1-7)
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-132`
- Check after: 2026-11-10

The `Check:` line names ORV-132 as a provisional key. Before the measurement it is replaced by every slice with a schema or guard module built after promotion, each collected first with `collect <ISSUE>`, and only tasks started after promotion count. With fewer than 5 comparable tasks the verdict is `not enough data`. The batch is one slice, so the baseline is a sign, not proof.

Status: promoted 2026-10-27, into `.claude/agents/builder.md` (Loop per task, step 6; former steps 6 and 7 are now 7 and 8), `.claude/rules/testing.md` (after the source-text guard bullet) and `.claude/agents/reviewer.md` (Pass 2: quality, after "Tests fail on the real defect"); Check after: 2026-11-10; no hook enforces it
