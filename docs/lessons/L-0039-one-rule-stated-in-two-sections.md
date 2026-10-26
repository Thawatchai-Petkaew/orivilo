---
id: L-0039
date: 2026-10-26
issue: [ORV-128]
what_happened: The ORV-128 industry conflict rule was stated in case 1 and in the Industry section with opposite outcomes (F3, round 1), and after a fix told to state it "in both places" the two statements still named different question keys (S2, round 2), which merged open.
cause: The spec restated a rule's outcome in a second section instead of pointing to it, and the main session's fix envelope asked for the rule to be written in both places, so a fix aligned two copies instead of removing one.
rule: A spec states each rule once, in one home section under a rule name, and other sections point to that name without restating its outcome or keys; a fix for a finding that two sections disagree removes the restatement, and its envelope says so.
---

## What happened

Records are under `.orivilo/runs/ORV-128/`.

- `ORV-128-review-spec-1` F3 (Important): spec v1.1 line 87 at head `23e399b` (case 1) said two industry candidates in different TSIC sections become a conflict question; line 111 (Industry) said the top candidate wins unless the second is within 0.1. For `86202` at 0.9 and `56101` at 0.6 the two give opposite results.
- The objective of `ORV-128-product-spec-4` asked to "state one industry conflict rule in both places". Spec v1.2 does: line 90 and line 115 now agree on the margin.
- `ORV-128-review-spec-2` S2 (Suggestion): the restated copy at line 90 gives the node the question `evidence.conflict`, while line 115 and row 14 give `industry.confirm`. `grep -n -E "industry.confirm|evidence.conflict" docs/specs/ORV-128/spec.md` on the merged spec still shows both at lines 90 and 115. A builder of slice 4 meets two keys for one case.
- A rule with a name and one home did not drift in the same review: `tsic-terms-1` and `value-to-lean-1`, added in v1.2, are defined once and referred to by name, and no finding touched them.

Related: [[L-0029-fix-walked-only-the-lines-named]] (a fix walks every line a rule governs; promoted), [[L-0033-spec-and-adr-fixed-in-parallel]] (documents that cite each other). Neither covers one rule restated inside one document.

## Rule

Proposed diffs, for the owner to approve. No file below is edited in this retro.

In `.claude/agents/product.md`, under Standards:

```diff
+- Each rule has one home: a section, with a rule name when other sections need it (`tsic-terms-1`).
+  Another section points to the name and never restates the rule's outcome, threshold or question key.
+  Add one `verified` row per named rule with `grep -n "<rule name>"` showing its one definition (L-0039).
+  No hook checks this.
```

In `.claude/skills/ovl/SKILL.md`, section 2, after the "Fixes across documents that cite each other" bullet:

```diff
+- **A finding that two sections disagree.** The fix envelope names the section that keeps the rule and
+  asks to replace the other statement with a pointer to it; it never asks to state the rule in both
+  places (L-0039). No hook checks this; it is the main session's duty.
```

What proves it was done: on the next spec revision, each named rule has one definition line by `grep -n`, and no review finds two sections of one spec giving different outcomes or keys for one case.

Status: promoted 2026-10-26, into `.claude/agents/product.md` (Standards, the one home bullet) and `.claude/skills/ovl/SKILL.md` (section 2, "A finding that two sections disagree", after the "Fixes across documents that cite each other" bullet); no hook enforces it
