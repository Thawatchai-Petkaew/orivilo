---
issue: ORV-17 (draft key E1-2; https://tpetkaew.atlassian.net/browse/ORV-17)
lane: L (resolver logic)
version: 1
---

## Why

The brand method (§3 to §6) is a set of closed mappings, and the resolver (E2-9) must apply them the same way every time and show conflicts instead of fixing them. Rules written as free text or code would break both, and would let a model's output act as instructions. This story fixes the rule grammar and its evaluator before any node knowledge (E1-4 to E1-6) is written in it.

## Story

As the Intent Engine, I want decision rules in a closed form that parse, validate and evaluate deterministically against a brief, so that a node's decisions trace to the knowledge behind them, a tie between rules is shown to the person instead of picked silently, and a missing input turns into a question rather than a guess.

## Rules and bounds

The grammar and its reasons are ADR 0006. In short:

- Strict objects; conditions only in the eight forms; nesting at most six levels.
- An axis test needs `atLeast`, `atMost` or both, integers 0 to 100, in order.
- `then` has at least one action; each sets a key of `DECISION_VOCABULARY` to one of its values, once per rule.
- `because` has at least one knowledge id; `priority` is an integer 0 to 100.
- Facts: `personality` (optional per axis), `industry` (slug or null), `audiences`, `avoid`.
- Evaluation: Kleene logic; highest priority wins; a tie on different values is a conflict with no value; the losers are kept as overridden; result independent of rule order.
- `checkRuleSet` reports duplicate ids and unknown knowledge ids.
- The design system's `DECISIONS` equals `DECISION_VOCABULARY` (a test in `profiles.test.ts`).

## Design (G2)

```
packages/intent-engine/src/
  rules.ts       DECISION_VOCABULARY, briefFactsSchema, conditionSchema, decisionRuleSchema,
                 evaluateRules, checkRuleSet
  rules.test.ts  five rules from brand-ci-method.md §3; ORIVILO's vector as the main brief
packages/design-system/
  package.json   devDependency on @orivilo/intent-engine (tests only; the Node scripts never import it)
  src/profiles/profiles.test.ts  vocabulary drift check
docs/adr/0006-decision-rule-grammar.md
```

## Acceptance criteria

| #   | Given                                                                        | When              | Then                                                                                          |
| --- | ---------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| 1   | the five fixture rules                                                       | parsed after JSON | each equals its input                                                                         |
| 2   | an unknown decision, an unknown value, no action, a key twice                | parsed            | fails at `then`                                                                               |
| 3   | an extra field on the rule, an action or a condition                         | parsed            | fails; there is no place for free text                                                        |
| 4   | an axis test with no bound, reversed bounds, unknown axis, or an empty `all` | parsed            | fails under `when`                                                                            |
| 5   | nesting six levels, then seven                                               | parsed            | passes, then fails at `when`                                                                  |
| 6   | no reason, a bad id, priority 101                                            | parsed            | fails at that field                                                                           |
| 7   | ORIVILO's vector                                                             | evaluated         | shape is a conflict between crisp and soft; emphasis and typeVoice decided with their reasons |
| 8   | the same brief in finance                                                    | evaluated         | the priority 70 rule decides emphasis; the losing rule is listed as overridden                |
| 9   | two rules that agree                                                         | evaluated         | one decision listing both rules and both reasons                                              |
| 10  | a brief missing axes and industry                                            | evaluated         | nothing fires; each rule lists the facts it needs                                             |
| 11  | all, any and not with unknown parts                                          | evaluated         | Kleene results                                                                                |
| 12  | the rules in any order                                                       | evaluated         | equal results                                                                                 |
| 13  | a duplicate id, a reason not in the corpus                                   | `checkRuleSet`    | both reported, sorted                                                                         |
| 14  | the design system's decision list changes alone                              | `pnpm test`       | the drift test fails                                                                          |

## Out of scope

- Writing the node knowledge as rules (E1-4 to E1-6), turning a written brief into facts (E2-10), and mapping decisions to tokens (E2-9).
- Static overlap analysis between rules; ties are found at evaluation, where the brief is known.
