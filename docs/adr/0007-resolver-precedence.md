# ADR 0007: The resolver applies locks, then the expert layer, then rules, and picks a curated profile

- Status: accepted
- Date: 2026-10-22
- Decided by: the implementer under the owner's 2026-10-22 policy (agents run G1 to G4; the owner reviews at G5), story ORV-32

## Context

The handoff §12.3 asks for `resolveProfile` that returns decisions, adjustments, conflicts and a validation report. The same input with the same resolver and catalog versions must give the same result. Incompatible constraints return a conflict instead of breaking one of them. The handoff also says to start from curated profiles and override only what is supported. The brief adds two layers: intent words, which become rules through the brief interpreter, and an expert layer, where a person sets a value. The brand's locked fields always win. ADR 0006 already makes rule ties visible.

## Decision

1. **`resolveProfile(input)` in `packages/intent-engine/src/resolver.ts`, version `rules-1`.** Input: catalog version, brief facts, locked decisions, expert adjustments (each with a reason), rules, known knowledge ids, and the curated profiles' decisions. The caller passes profiles in, so the engine never imports the design system.
2. **Precedence per decision: locked, then adjustment, then rules.**
   - A locked value always stands.
   - An adjustment or rule value that differs from a lock is a `locked` conflict, naming who proposed it. It is never applied and never dropped.
   - An adjustment wins over rules. Rule values it sets aside are listed under `overridden`.
   - A rule tie (ADR 0006) with no lock or adjustment stays a `rule-tie` conflict.
3. **Status is one word:**
   - `invalid` when the rule set fails `checkRuleSet`. A rule resting on unknown knowledge cannot drive a design.
   - `conflicted` when any conflict exists.
   - `needs-input` when a decision is still open.
   - `resolved` otherwise.

   `open` names the undecided keys. `questions` names the brief facts that would let rules decide.

4. **The closest curated profile is chosen, and its gaps are named.** The score is the number of decided keys it matches. A tie goes to the first id, and the tied ids are listed in `profileTies`. `unsupported` lists decisions the chosen profile does not express, so the person sees what the profile cannot honor. No profile is chosen when nothing is decided.
5. **Fingerprint.** FNV-1a over canonical JSON (sorted keys) of the whole result except itself. Two runs compare by one value. There are no timestamps or approval data, per the handoff §12.3.

## Not chosen

- **Generating token values from decisions.** That is continuous generation, and the handoff puts it after curated profiles. Tokens come from the chosen profile.
- **Letting an adjustment unlock a locked field.** A lock changes only in the brand, so the conflict goes to the person.
- **A cryptographic hash.** The fingerprint is for equality, not security, and FNV keeps the engine free of platform APIs.
