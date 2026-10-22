---
issue: ORV-33 (draft key E2-10; https://tpetkaew.atlassian.net/browse/ORV-33)
lane: L (AI claims)
version: 1
---

## Why

The resolver (ORV-32) takes brief facts, but a person writes a brief in words. Something has to turn "warm, easy to read, no promotions" into facts the rules can use. It also has to be honest about how it did that and about what it did not understand. The handoff's MVP ships a rule-based interpreter and an interface for a model-backed one later.

## Story

As the Intent Engine, I want one interpreter interface and a rule-based adapter that read a Thai or English brief into facts, each with the words it came from, and that list what they could not understand or found contradictory, so that the Studio can show and correct the reading, and no output, a future model's included, is used before it is checked.

## Rules and bounds

The decision and its reasons are ADR 0008. In short:

- The brief is 1 to 2,000 characters after trimming.
- The output is strict. It has the method, the adapter id and version, the facts, the findings with evidence, the uncertain items and the missing axes. It has no confidence score.
- Each evidence span must equal the brief's text at its offsets, or the output is refused.
- The output must name the adapter and method that ran.
- An axis or industry read two ways stays open and is listed as `conflicting`. A phrase with no known term is listed as `not-understood`.
- A trait is avoided only when the brief negates it.
- The rule values are fixed: intensified 90, desired 75, not too much 40, low 25, avoided 15.

## Design (G2)

```
packages/intent-engine/src/
  interpreter.ts       briefSchema, interpretationSchema, InterpreterAdapter, interpretBrief,
                       RULE_LEXICON, RULE_VALUES, interpretWithRules, ruleBasedInterpreter
  interpreter.test.ts  the handoff's stay brief, negation and degree, conflicts, a fake model adapter
docs/adr/0008-brief-interpreter-adapters.md
```

## Acceptance criteria

| #   | Given                                                            | When             | Then                                                                                  |
| --- | ---------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| 1   | the handoff's stay brief in Thai                                 | read by rules    | travel, families, warm and promotions avoided; three phrases listed as not understood |
| 2   | "สนุกมาก", "สนุก", "ไม่อยากให้สนุกเกินไป", "ไม่สนุก" and English | read by rules    | 90, 75, 40 and 15 for playful                                                         |
| 3   | a negation in one phrase and another word in the next            | read by rules    | the negation stays in its phrase                                                      |
| 4   | "formal", "minimal"                                              | read by rules    | the axis is set low                                                                   |
| 5   | "funding", "ตกแต่ง", "หน้าแรก"                                   | read by rules    | no false match on a longer word                                                       |
| 6   | "สนุก, ทางการ" or two industries                                 | read by rules    | the fact stays open and the uncertainty quotes both words                             |
| 7   | a trait mentioned without a negation                             | read by rules    | not added to avoid                                                                    |
| 8   | any brief                                                        | read by rules    | every evidence span equals the brief's text at its offsets                            |
| 9   | the rule-based output                                            | parsed           | passes its own schema and the resolver's facts schema; method is `rule-based`         |
| 10  | a fake model adapter quoting words that are not in the brief     | `interpretBrief` | `evidence-mismatch`                                                                   |
| 11  | a fake model adapter adding a confidence score or unknown axis   | `interpretBrief` | `invalid-output`                                                                      |
| 12  | output naming another method or adapter                          | `interpretBrief` | `invalid-output`                                                                      |
| 13  | an adapter that throws, an empty brief, a brief over 2,000       | `interpretBrief` | `adapter-failed` or `invalid-brief`, never a throw                                    |

## Assumptions (no answer needed to start)

- The "UI labels it rule-based" part of done lands with the first UI that shows an interpretation, E2-11. This story puts the method in every output and makes the label required in ADR 0008. Default if the owner disagrees: add a small label component in a follow-up.
- Locked fields come from the brand form, not from the brief's text, so the interpreter does not read them.

## Out of scope

- A model-backed adapter, its prompt and its spend limit. That is a later story, gated by rule 4.
- Showing and editing the interpretation in the Studio (E2-11).
