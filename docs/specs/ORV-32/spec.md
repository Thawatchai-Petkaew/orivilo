---
issue: ORV-32 (draft key E2-9; https://tpetkaew.atlassian.net/browse/ORV-32)
lane: L (resolver logic)
version: 1
---

## Why

E1-1 and E1-2 give knowledge and rules. Nothing yet turns them, the brand's locked fields and an expert's adjustments into one decision set and a profile. The Studio's two directions (E2-11) and the approve and export flow (E2-12) both need that answer to be reproducible and honest about what it could not satisfy.

## Story

As the Intent Engine, I want one resolver that takes a brief, the brand's locks, the expert layer's adjustments, the rules and the curated profiles, and returns the decisions with their source, the closest profile, every conflict and the questions still open, so that the same input always gives the same result, a locked field is never overwritten, and nothing is fixed silently.

## Rules and bounds

The precedence and its reasons are ADR 0007. In short:

- Input is strict. Locks and adjustments use only `DECISION_VOCABULARY` values. Each adjustment has a reason, and a key is adjusted at most once. Profiles are complete and have unique ids.
- Precedence is locked, then adjustment, then rule. Anything that disagrees with a lock is a `locked` conflict and is not applied.
- A rule tie with nothing above it is a `rule-tie` conflict.
- The status is `invalid`, `conflicted`, `needs-input` or `resolved`, checked in that order.
- The chosen profile has the most matching decisions. A tie goes to the first id and is listed. Decisions the profile cannot express are listed under `unsupported`.
- The result does not depend on input order. The fingerprint changes when the design result or the catalog version changes.

## Design (G2)

```
packages/intent-engine/src/
  resolver.ts       RESOLVER_VERSION, curatedProfileSchema, resolveInputSchema, resolveProfile
  resolver.test.ts  the brand method's axis rules, the E2-2 profiles' decisions, ORIVILO's vector
packages/design-system/src/profiles/profiles.test.ts
                    the shipped profiles parse as curated profiles
docs/adr/0007-resolver-precedence.md
```

## Acceptance criteria

| #   | Given                                                                   | When        | Then                                                                                   |
| --- | ----------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| 1   | ORIVILO's vector, no locks                                              | resolved    | shape is a rule-tie conflict; emphasis and typeVoice come from rules; friendly chosen  |
| 2   | the same with adjustments for shape, surface and motion                 | resolved    | status resolved; shape from the adjustment with its reason; crisp listed as overridden |
| 3   | emphasis locked restrained, an adjustment and a rule propose expressive | resolved    | emphasis stays restrained; two locked conflicts name the adjustment and the rule       |
| 4   | a lock that agrees with the rule                                        | resolved    | no conflict for that key                                                               |
| 5   | a brief missing axes                                                    | resolved    | needs-input; questions list the missing axes; no profile chosen                        |
| 6   | rules resting on unknown knowledge                                      | resolved    | invalid, with the issues                                                               |
| 7   | an adjustment the closest profile cannot express                        | resolved    | listed under unsupported                                                               |
| 8   | two profiles with the same score                                        | resolved    | the first id is chosen and both are listed as tied                                     |
| 9   | rules and profiles in another order                                     | resolved    | equal result and fingerprint                                                           |
| 10  | another catalog version, or another lock                                | resolved    | a different fingerprint                                                                |
| 11  | an unknown lock value or key, an adjustment with no reason or set twice | parsed      | fails at that field                                                                    |
| 12  | no profile, a duplicate profile, an incomplete profile                  | parsed      | fails at `profiles`                                                                    |
| 13  | the design system's shipped profiles                                    | `pnpm test` | each parses as a curated profile                                                       |

## Out of scope

- Turning a written brief into facts (E2-10) and showing the result in the Studio (E2-11).
- Token generation beyond the chosen profile, persistence, approval and export (E2-12).
