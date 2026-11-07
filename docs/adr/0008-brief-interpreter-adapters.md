# ADR 0008: A brief interpreter is an adapter whose output is checked like untrusted data

- Status: accepted
- Date: 2026-10-22
- Decided by: the implementer under the owner's 2026-10-22 policy (agents run G1 to G4; the owner reviews at G5), story ORV-33

## Context

The handoff §12.2 gives the interpreter its job. It extracts the requirement, context and avoided traits from a brief, and it tells "not too fun" apart from "very fun". It returns structured output that a schema can check, with reasons and the parts it is unsure of. It gives no confidence percentage without a way to measure one. §7 and §19 add a rule-based adapter for the demo, with an LLM adapter later. The state must be labelled honestly, and AGENTS.md rule 4 forbids any AI claim without an implementation and a test. The resolver (ADR 0007) already takes `BriefFacts`.

## Decision

1. **One adapter interface.** `InterpreterAdapter { id, version, method: "rule-based" | "llm", interpret(brief) }` lives in `packages/intent-engine/src/interpreter.ts`. `interpret` is async, so a model-backed adapter fits without changing callers.
2. **Every output is untrusted, whatever produced it.** `interpretBrief(adapter, brief)` checks the output in this order:
   - The brief must parse.
   - The output must parse with `interpretationSchema`, which is strict, so a confidence score or an unknown axis is rejected.
   - The output must name the same adapter id, version and method as the adapter that produced it.
   - Every evidence span must equal the brief's text at that position.
   - The result is `ok` or a typed error. It never throws.
3. **Every fact carries its evidence.** A finding records the field, the value, whether the brief wanted or avoided it, and the exact words with their offsets. What the adapter could not settle goes in `uncertain`:
   - `not-understood`: a phrase with no known term.
   - `conflicting`: one axis or industry read two ways. The fact stays open instead of being picked.
4. **The rule-based adapter is a fixed word list, `lexicon-1`.** Thai terms match as substrings and Latin terms as whole words. Phrases split at punctuation, at a spaced "but" or "and", and at any space next to Thai text.
   - A negation before the term marks it avoided.
   - A "too" word with a negation gives `notTooMuch` (40).
   - An intensifier without a negation gives `intensified` (90).
   - Otherwise a term gives `desired` (75), a low word gives `low` (25), and a negated term gives `avoided` (15).

   These values are documented settings, not measurements. A trait counts as avoided only when the brief negates it.

5. **The method is part of the output.** `method: "rule-based"` comes back with every rule-based interpretation. Any UI that shows an interpretation must show this label. The first UI that does is E2-11, and that story checks the label.

## Not chosen

- **Shipping an LLM adapter now.** There is no implementation to test against yet, so rule 4 keeps it out. Only the interface ships. The tests use a fake adapter, named as a fake, to prove the checks in step 2.
- **A confidence score per finding.** There is no method to back a number, so the handoff rules it out. The finding's evidence and the `uncertain` list do that job.
- **Guessing between conflicting words.** A brief that says both "fun" and "formal" leaves playful open and says so. The Studio asks; the interpreter does not decide.

## Addition, 2026-10-26: a computed confidence number for input evidence

The owner chose option (a) of ORV-128 decision D6 at G1 (ORV-128 comment 10209): input evidence carries a confidence number computed by code. "Not chosen" above rejected a confidence score per finding because no method backed one. This addition records the method that now backs one, for input evidence only (`docs/specs/ORV-128/spec.md`, "Confidence"; `docs/specs/ORV-128/tech.md` §4).

- **Computed, never reported.** `confidence.value` is a base times every named factor, computed by `scoreConfidence(base, factors)` in `packages/intent-engine/src/confidence.ts` (version `confidence-1`), which returns `{ confidence, belowFloor }`. The bases are `measure` 1.0, `rule-reading` 0.7 and `model-reading` 0.7. The factors are `page-incomplete` 0.7, `few-words` 0.7, `image-small` 0.5, `image-blurred` 0.6, `single-signal` 0.8 and `tool-default` 0. Every number is a hypothesis, to be checked against labelled fixtures.
- **One rounding rule.** Factors are multiplied in id order. The product is rounded to 3 decimals. The floor (0.5, owner decision D3) and the 0.1 industry margin are compared in whole thousandths, and exactly 0.1 apart counts as within the margin.
- **The trace shows the method.** Each item stores its base and factors with their values, and the schema rejects an item whose value is not the computed one.
- **A model's certainty is never read.** A `score` or `confidence` key from a model fails the strict schema, as in decision 2.
- **Brief interpretations are unchanged.** Decision 2 still holds for `interpretationSchema`: a brief finding carries no confidence, and its evidence and the `uncertain` list still do that job.
- **Open for the owner at G2.** The model-reading base of 0.7 is the orchestrator's adjustment under D3 (ORV-128 comment 10215). It was raised from 0.6 so that one mild factor keeps a model reading above the floor (0.7 x 0.8 = 0.56), but two factors do not (0.392). The owner may confirm or overturn it at G2. A change to any base, factor or the floor bumps `confidence-1` and ships with an impact list.
- **Not chosen:** levels only (`measured`, `supported`, `weak`, option b). The owner asked for a floor, and a number with its factors in the trace shows why an item fell under it.

Confirmation: in `packages/intent-engine/src`, these tests fail `pnpm test` when the method breaks:

- `evidence.test.ts` › "confidence is computed, never reported", "one mild factor stays, two fall", "the margin is in thousandths and inclusive", and "bounds and forbidden fields" (a reported value that differs from the computed one, and a `score` key);
- `interpreter.test.ts` › "refuses output outside the schema, such as a confidence score", existing, which still rejects a confidence on a brief finding.

Confirmed 2026-10-27: ORV-128 slice 1a (ORV-132, PR 128) merged into `develop` as `a0f67a2` with `confidence.ts` and the tests above.
