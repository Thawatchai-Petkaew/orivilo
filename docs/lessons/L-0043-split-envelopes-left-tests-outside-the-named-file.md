---
id: L-0043
date: 2026-10-27
issue: [ORV-132]
what_happened: The ORV-132 slice spec names `evidence.test.ts` for the confidence and strings tests, but the builders put them in `confidence.test.ts` and `evidence-strings.test.ts`, the strings test was still there at the first code review, and the review spent Important finding R1-6 on it.
cause: The main session split the slice into one envelope per module and gave each a `write_set` with only its own module's test file, so no envelope could write the test file the spec names; two builders reported this in `deviations` and the review was dispatched without a fix.
rule: Each builder envelope's `write_set` holds every test file the spec's Tests cell names for its deliverable, and a builder deviation that names a file outside its `write_set` gets a fix envelope before the first code review.
---

## What happened

Records are under `.orivilo/runs/ORV-132/`. The slice spec `docs/specs/ORV-132/spec.md`, "Deliverables in build order", gives each module's tests: `confidence.ts` (second) and `evidence-strings.ts` (third) both test in `evidence.test.ts` (rows 3, 32, 29 and the tech notes S1 test). It also says "a builder may write `confidence.ts` and `evidence-strings.ts` first".

The main session dispatched them in that allowed order, one module per envelope (the [[L-0010-one-builder-task-built-six-deliverables]] rule), and each `write_set` named the module's own test file:

| task                 | `write_set` test file                    | report                                                                                                                                                                   |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `build-confidence-1` | `confidence.test.ts`                     | deviation: "The slice spec and tech notes §14 place these three tests in evidence.test.ts. They are in confidence.test.ts because the write set allowed only that file." |
| `build-strings-1`    | `evidence-strings.test.ts`               | no deviation                                                                                                                                                             |
| `build-evidence-1`   | `evidence.test.ts`, `confidence.test.ts` | moved the confidence tests; deviation: "Row 29 strings test stays in evidence-strings.test.ts (outside write set)"                                                       |

`ORV-132-product-spec-2` then recorded the slice's other deviations in spec v1.1 but not this one. `ORV-132-review-code-1` raised R1-6 (Important): row 29 names a test in `evidence.test.ts` that is in `evidence-strings.test.ts`. `ORV-132-build-rework-1` moved it, in the same task as R1-1 to R1-5 and R1-7 to R1-9 (543,175 tokens for all nine), so this finding's own cost is not in the records.

[[L-0035-fix-reports-named-the-round-2-findings]] sends a fix report's named disagreement to a fix before a re-check. This one was in a build report before the first review, which that rule does not cover.

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, section 2, at the end of the "Builder envelope: one deliverable" bullet (line 85):

```diff
-  full gate, two reviewer passes and the qa walk (L-0010).
+  full gate, two reviewer passes and the qa walk (L-0010). The `write_set` holds every test file the
+  spec's Tests cell names for the deliverable, even when an earlier or later envelope also writes it;
+  the envelopes run one at a time. Before the first code review, each builder deviation that names a
+  file outside its `write_set` gets a fix envelope or a spec revision that records it (L-0043). No
+  hook checks this; it is the main session's duty.
```

What proves it was done: on the next split slice, every test file named in the spec's deliverables table appears in the `write_set` of each envelope whose deliverable it tests, and the first code review raises no finding of a test in a file other than the one the spec names.

No `## Expected saving`: the move shared one rework task with eight other findings, so the batch gives no number for it. Builder fresh has n=5, but the skill asks for a saving the report's numbers back.

Status: promoted 2026-10-27, into `.claude/skills/ovl/SKILL.md` (section 2, end of the "Builder envelope: one deliverable" bullet); Check after: 2026-11-10; no hook enforces it
