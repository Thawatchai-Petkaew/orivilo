---
issue: ORV-34 (draft key E2-11; https://tpetkaew.atlassian.net/browse/ORV-34)
lane: M
version: 1
---

## Why

The handoff (§17.3, §19, §22) asks for two directions that really differ, on the same task and content, read from the user's brief. Every part exists:

- the rule-based interpreter (E2-10),
- the resolver (E2-9),
- two hand-made profiles (E2-2),
- the reference screen (E2-8),
- profile boundaries (E2-3).

Nothing joins them yet. This story joins them, and shows the reading and the reasons honestly.

## Decisions this spec relies on

- ADR 0007 (resolver precedence) and ADR 0008 (interpreter adapters; the UI says "rule-based").
- The brand method's axis map (`docs/context/brand/brand-ci-method.md` §3). It is the only rule set with a written source today. Its rules ship as the starter set.
- The owner said to go on ("ดำเนินการต่อ", 2026-10-22).

## Parts

| Part | Content                                                                                                        | Status    |
| ---- | -------------------------------------------------------------------------------------------------------------- | --------- |
| 1    | Engine: starter rules and `recommendDirections` (brief to interpretation, resolution, two directions, reasons) | This spec |
| 2    | Studio UI: brief with presets, the reading, two direction cards with mini previews, the shared live preview    | Next      |
| 3    | Refinement controls (§17.4) and the trace inspector (§17.5)                                                    | Later     |

## Story (part 1)

As the Studio, I want one call that takes a brief and returns two directions. Each direction names its profile, the decisions it honours and the ones it cannot, and the words in the brief behind each decision. The UI can then show why the directions differ without inventing reasons.

## Acceptance criteria (part 1)

| #   | Given                                                  | When         | Then                                                                                                                                                                                          | Evidence             |
| --- | ------------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | A brief with known words, such as "เป็นระเบียบ หรูหรา" | Recommending | Method "rule-based". Two directions: first the profile the resolver chose ("recommended"), then the profile that differs most from it ("contrast")                                            | `directions.test.ts` |
| 2   | Each direction                                         | Reading it   | Its decisions; which of them match the resolved decisions; which differ, with the wanted value; for each rule-made decision, the rule ids and the brief's words for the axes those rules read | Tests                |
| 3   | A brief with no known word                             | Recommending | No direction. The resolution says needs-input, and the open questions are listed                                                                                                              | Tests                |
| 4   | A brief whose rules tie (shape crisp against soft)     | Recommending | Both directions are still offered. The tie is listed as a conflict, never settled silently                                                                                                    | Tests                |
| 5   | Locks and adjustments                                  | Passed in    | They reach the resolver unchanged. A lock always holds                                                                                                                                        | Tests                |
| 6   | The same brief twice                                   | Recommending | An equal result and fingerprint                                                                                                                                                               | Tests                |
| 7   | The starter rules                                      | Checked      | `checkRuleSet` reports no issue against the starter knowledge ids                                                                                                                             | Tests                |

## Rules

- Pure TypeScript in `packages/intent-engine`. It takes the curated profiles as input and never imports the design system.
- Two directions at most in part 1. A third waits until there is a third hand-made profile that differs for a reason (handoff §19).
- A reason quotes the brief's own words, taken from the interpretation's evidence. A decision that comes from a lock or an adjustment says so instead.

## Out of scope (part 1)

- Any UI. That is part 2.
- New rules beyond the axis map. They come with E1-4 to E1-6.

## Changelog

- v1 (2026-10-22): parts split; part 1 written.
