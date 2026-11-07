---
id: L-0044
date: 2026-10-27
issue: [ORV-132]
what_happened: The `confidence.ts` builder envelope restated the return shape of `scoreConfidence` as a flat `{ value, base, factors, belowFloor }` while the tech notes §4 it pointed to give `{ confidence, belowFloor }`, the builder followed the envelope, and the next envelope had to realign the module and its tests first.
cause: The main session wrote the design into the objective in its own words instead of pointing to the tech notes section, so the envelope and the design disagreed and the envelope won.
rule: A builder objective names the tech notes section, clause numbers and spec rows it builds and never restates a signature, return shape, constant or threshold; a value the main session must state is copied word for word with a fact whose `checked_by` greps it in the tech notes.
---

## What happened

Records are under `.orivilo/runs/ORV-132/`; the design is `docs/specs/ORV-128/tech.md` §4, which declares `scoreConfidence(base, factors)` returning `{ confidence: Confidence; belowFloor: boolean }` (line 383).

- `ORV-132-build-confidence-1` objective: "scoreConfidence(base, factors) returning { value, base: { id, value }, factors: [{ id, value }] sorted by id and deduplicated, belowFloor }", in the same sentence as "as docs/specs/ORV-128/tech.md section 4 designs it". The report's deviation: "scoreConfidence returns the flat { value, base, factors, belowFloor } that the envelope asked for. The tech notes §4 sketch shows { confidence, belowFloor }."
- `ORV-132-build-evidence-1` objective opened with "first realign confidence.ts so scoreConfidence returns { confidence: { value, base, factors }, belowFloor } as tech notes section 4 shows (its tests follow)", and its `write_set` took `confidence.ts` and `confidence.test.ts` for it.

The realignment ran inside `build-evidence-1` (1,875,469 tokens), with the evidence schema, so its own cost is not in the records. The other builder objectives also restated parts of the design (the confidence bases, the lean thresholds and warm bands, the six question keys). No report named a disagreement with those copies; `build-leans-1`'s one deviation (two fields added to `MeasuredLean`) was the builder's own choice, not a restatement.

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, section 2, after the "Builder envelope: one deliverable" bullet (line 85):

```diff
+- **Builder objective points to the design.** A builder objective names the tech notes section, the
+  clause numbers and the spec rows it builds, by number. It does not restate a signature, return
+  shape, constant, threshold or list. When it must state one (a value the tech notes leave open), it
+  copies the tech notes text word for word and adds a fact whose `checked_by` is
+  `grep -n -F '<text>' docs/specs/<KEY>/tech.md` (L-0044). No hook checks this; it is the main
+  session's duty.
```

What proves it was done: on the next split slice, no builder objective contains a signature or return shape that is not found verbatim in the tech notes, and no builder report lists a deviation between the envelope and the tech notes.

No `## Expected saving`: one realignment inside a larger task gives no number of its own. Builder fresh has n=5, but the skill asks for a saving the report's numbers back.

Status: promoted 2026-10-27, into `.claude/skills/ovl/SKILL.md` (section 2, "Builder objective points to the design", after the "Builder envelope: one deliverable" bullet); Check after: 2026-11-10; no hook enforces it
