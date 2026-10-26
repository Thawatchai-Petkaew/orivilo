# ADR 0006: Decision rules are a closed grammar evaluated in three-valued logic

- Status: accepted. Decision 3 is superseded by [ADR 0017](0017-node-scoped-color-decisions.md) for node-scoped color decisions; the rest stands.
- Date: 2026-10-22
- Decided by: the implementer under the owner's 2026-10-22 policy (agents run G1 to G4; the owner reviews at G5), story ORV-17

## Context

The resolver (E2-9) must give the same output for the same input and show conflicts instead of fixing them silently (handoff §12.3, backlog E2-9). The brand CI method (§3 to §6) is a set of closed mappings from a brief to design attributes. `docs/context/ai-team-skills.md` recommends UI/UX Pro Max's reasoning contract: fixed condition names and typed actions, so rules stay data. AGENTS.md treats knowledge and model output as data, never code. A node must ask for missing inputs instead of improvising (brief, "Collect before generating").

## Decision

1. **A rule is `decisionRuleSchema` v1.0 in `packages/intent-engine/src/rules.ts`.** Fields: `schemaVersion`, `id` (slug), `version`, `topic`, `priority` (0 to 100), `when`, `then`, `because`. Every object is strict.
2. **Conditions come from eight forms and nothing else.** `{ always: true }`, `{ axis, atLeast?, atMost? }` over the five personality axes, `{ industry }`, `{ audience }`, `{ avoids }`, and the combinators `all`, `any`, `not`. Nesting stops at six levels. There is no expression string, regex, script or template anywhere.
3. **Actions set one decision to one known value.** The decisions and values are `DECISION_VOCABULARY`: shape, surfaceTreatment, emphasis, typeVoice, motion, the same list the design system's profiles declare. A design-system test fails if the two lists drift. A rule sets each decision at most once.
4. **Every rule rests on knowledge.** `because` lists at least one knowledge entry id (ADR 0005). `checkRuleSet` reports ids it cannot find and duplicate rule ids.
5. **Missing facts are unknown, not zero.** `evaluateRules` uses Kleene logic: a test on an axis or industry the brief does not have is unknown. `all` is false if any part is false, `any` is true if any part is true, otherwise unknown spreads. A rule that ends unknown does not fire; it is listed under `undecided` with the facts it needs, so the node can ask for them.
6. **Priority decides; a tie is a conflict.** For each decision the highest priority among fired rules wins. Rules at that priority that agree merge their ids and reasons. Rules at that priority that disagree produce a conflict and no value for that decision. Lower-priority rules whose value lost are listed under `overridden`, so the trace keeps what was set aside.
7. **Order never matters.** Rules are sorted by id before evaluation, and every list in the result is sorted, so the same set and the same facts give an equal result.

## Change rules

- Adding a decision, a value, a condition form or a fact is additive and keeps "1.0", with the design system's list changed in the same PR.
- Changing how unknown, priority or ties behave bumps `schemaVersion` and needs a migration note.

## Not chosen

- **An expression language** (JSONLogic, CEL, a mini DSL): more power than the brand method needs, and a door to free text.
- **Unknown as false, or defaulting axes to 50:** it would decide on facts nobody gave. The brand method's default of 50 belongs to the brief interpreter (E2-10), which must label it as a default.
- **First match wins:** it makes the result depend on file order.
