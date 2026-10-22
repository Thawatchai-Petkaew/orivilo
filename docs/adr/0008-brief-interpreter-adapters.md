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
