---
id: L-0025
date: 2026-10-26
issue: [ORV-20]
what_happened: The builder reported that spec row 12 contradicted ADR 0006 decision 5 and coded to the ADR, but the review was dispatched on the unchanged spec, raised the row as an Important finding, and a product revision followed.
cause: A builder `deviations` line that says a spec row is wrong has no step in the loop, so it reached review as if it were a code note.
rule: When a builder report's `deviations` names a spec row or an AC as wrong, the main session dispatches a product revision on that row before any review envelope, and the review envelope carries the new spec version as a fact.
---

## What happened

Spec `docs/specs/ORV-20/spec.md` v1.0 to v1.2 (ORV-20-spec-1, spec-3) row 12 said every signature rule is under `undecided` with missing `["lineup"]` when the lineup is null. Under ADR 0006 decision 5 (an `all` with one false part is false), six of the eight signature rules are false on ORIVILO's personality alone. Only `color.signature.lime-warm` and `color.signature.cyan-warm-fallback` wait for the lineup. Row 7 of the same spec cites decision 5; row 12 did not apply it.

ORV-20-build-1's first `deviations` line said exactly this, and its test asserts the two rules. The next envelopes were ORV-20-review-1 (stalled, see [[L-0027-stalled-reviewer-went-unnoticed]]) and ORV-20-review-2 (1,268,113 tokens), both on the same spec. Review-2 finding R2-2 (Important) asked for v1.3. ORV-20-product-spec-row12 (616,004 tokens) wrote v1.3, and ORV-20-review-3 rechecked it with the code fixes.

This is the product-spec version of [[L-0021-synthesis-contradicted-its-own-source]]: an every-sentence that was not checked against the rule the document cites.

## Rule

- After a builder result, the main session reads `deviations`. A line that names a spec row, an AC or a spec statement as wrong or as not met by design goes to `product` in a revision envelope that cites the line, the row and the ADR. That envelope runs before the review envelope, which carries a `grep` fact for the new spec version.
- The product agent writes an expected result that says every, all, none or each over a set of rules or ids by listing the members, or by stating the ADR rule that selects them. It adds one `verified` row per such sentence.
- Target: `.claude/skills/ovl/SKILL.md` (after-build step) and `.claude/agents/product.md` (AC table).

Status: promoted 2026-10-26, into `.claude/skills/ovl/SKILL.md` (The loop, step 5) and `.claude/agents/product.md` (Standards, last bullet); no hook enforces it
