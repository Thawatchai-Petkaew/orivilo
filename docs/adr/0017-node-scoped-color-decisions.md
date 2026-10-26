# ADR 0017: Color decisions are node-scoped, beside the profile vocabulary

- Status: proposed. It becomes accepted when slice A of ORV-20 is merged into `develop`. Slice A also adds a pointer to this ADR on the Status line of ADR 0006; the rest of ADR 0006 is not edited.
- Date: 2026-10-26
- Decided by: G1 of ORV-20, passed by Claude under the owner's POC delegation (ADR 0012 decision 4), chose option (a) of spec open question 2: node-scoped `COLOR_DECISIONS` and this ADR. The `ds-architect` role wrote it (task `ORV-20-adr-1`) from `docs/specs/ORV-20/spec.md` v1.
- Builds on: ADR 0005 (knowledge entry shape), ADR 0007 (status words, fingerprint, curated values over generated ones). Neither is superseded.
- Supersedes: ADR 0006 decision 3, and only that decision. ADR 0006 decisions 1, 2 and 4 to 7 stand as written. Decision 2 gains one condition form under ADR 0006's own change rules (decision 2 below).

## Context

ORV-20 gives the Intent Engine its first topic node: color. The brand CI method (`docs/context/brand/brand-ci-method.md` §3 and §5) decides a signature hue by auditing the category, decides neutrals and canvas from the personality vector, and keeps feedback, selection and focus apart from the brand. The engine already has a closed rule grammar (ADR 0006) that can carry this with sources, three-valued logic and visible ties, which is why the spec puts color into the grammar instead of beside it.

Two parts of the grammar do not fit:

- **ADR 0006 decision 3** ties every action to `DECISION_VOCABULARY` (`shape`, `surfaceTreatment`, `emphasis`, `typeVoice`, `motion`), the list every curated profile declares. `packages/design-system/src/profiles/profiles.test.ts` fails when `DECISIONS` and `DECISION_VOCABULARY` drift, and caps the list at 8 keys. Color decisions (`signature`, `neutral`, `canvas`) are not profile decisions: no curated profile declares a signature hue, the resolver does not pick a profile by one, and the Direction Studio has no row for one.
- **No fact describes a category.** `briefFactsSchema` holds personality, industry, audiences and avoid. A crowd of hues comes from a lineup of competitor colors through a deterministic audit (`auditLineup`), not from the brief.

One fact in the repo shapes the scope rule. Topic is not a reliable scope: the starter rule `emphasis.expressive-signature` in `packages/intent-engine/src/directions.ts`, and the fixtures `emphasis.expressive-signature` and `emphasis.finance-restrained` in `rules.test.ts`, have topic `color` and set the profile keys `emphasis` and `typeVoice`. Spec row 16 forbids fixture edits. So scope follows the keys a rule sets, and topic only adds a check on top.

## Decision

### 1. Two closed vocabularies, scoped by the keys a rule sets

- `DECISION_VOCABULARY` in `rules.ts` is unchanged. It is the **profile scope**: the decisions a curated profile declares, under ADR 0006 decision 3's drift test and cap.
- `COLOR_DECISIONS` is new, exported from the engine beside it. It is the **color scope**, the decisions only the color node makes:

  | Decision    | Values                            |
  | ----------- | --------------------------------- |
  | `signature` | `lime`, `cyan`, `magenta`, `teal` |
  | `neutral`   | `cool`, `near`, `warm`            |
  | `canvas`    | `soft`, `bright`                  |

- The two key sets are disjoint, so a key names exactly one scope.
- An action is `{ set, to }` with `set` from either vocabulary and `to` from that key's values. `decisionRuleSchema` keeps `schemaVersion: "1.0"` and adds three checks in its `superRefine`:
  1. A rule's actions all come from one scope. A rule that sets `emphasis` and `signature` is a parse error at `then`.
  2. A rule that sets a color key has topic `color`. A rule with topic `color` may still set profile keys, so the existing starter rule and fixtures parse unchanged.
  3. A `crowded` condition (decision 2) appears only in a color-scope rule. The profile path never meets a fact it cannot get from a brief.
- Every rule that parsed before this ADR still parses: the new checks only touch keys and a condition form that did not exist. This is why the version stays "1.0", as ADR 0006's change rules allow for an added decision, value or condition form.

ADR 0006's change rule "with the design system's list changed in the same PR" is the drift guard of decision 3, so it binds the profile scope only. Adding a color decision or value changes `COLOR_DECISIONS` and the color tests, and nothing in `packages/design-system`.

### 2. One condition form and one fact, owned by the audit

- The condition `{ crowded: <family> }` takes one of the ten chromatic families of `color.hue-families`: `red`, `orange`, `yellow`, `lime`, `green`, `teal`, `cyan`, `blue`, `violet`, `magenta`. It is strict like every other form and counts toward the six-level nesting limit like a leaf.
- It reads the fact `crowded`, a sorted list of families (the achromatic `ink` and `paper` may appear in the list; a condition never names them).
- Three values, as ADR 0006 decision 5: true when the family is in `crowded`, false when it is not, unknown when `crowded` is absent, with missing `["lineup"]`. The missing name is `lineup`, not `crowded`, because the lineup is what a person can give; `decideColor` then lists `lineup` in `questions`.
- `crowded` lives in a color facts type, `BriefFacts` plus an optional `crowded`, built only by `decideColor` from `auditLineup`. It is never a field of `briefFactsSchema`, so `interpretationSchema` (strict, built on `briefFactsSchema`) keeps rejecting it, and neither the rule interpreter nor a model can claim a crowd.

### 3. One evaluator, scoped entry points, a scope check

- The evaluation core of ADR 0006 (sort by id, Kleene logic, highest priority wins, a tie is a conflict, lower values listed as overridden, every list sorted) is shared. It runs over the keys of one vocabulary at a time.
- `evaluateRules(rules, facts)` keeps its signature, its result type and its output: it evaluates the profile scope.
- `decideColor(input)` evaluates the color scope with the color facts.
- `checkRuleSet(rules, knowledgeIds, scope?)` gains an optional third argument and a new problem, `wrong-scope`, for a rule whose keys belong to the other scope. Without the argument it behaves exactly as today.
- `decideColor` passes `"color"`, so a profile rule in a color rule set makes the result `invalid`.
- `resolveProfile` passes `"profile"`, a one-argument change in `resolver.ts`, so a color rule handed to the resolver makes its result `invalid`. It is never a rule that fires and silently sets nothing. No existing resolver fixture carries a color-scope rule, so their output, fingerprint included, is equal.

### 4. Determinism

- `auditLineup` and `decideColor` are pure functions in `packages/intent-engine`. They use no `Date`, no `Math.random`, no network, and import no framework, no design-system module, and neither `llm-interpreter` nor `openrouter`.
- The lineup and the rules are sorted before use, so input order never matters. Every list in the audit and the result is sorted.
- The result carries `version: "color-1"`, `method: "rule-based"`, and a `fingerprint`: FNV-1a over the canonical JSON (sorted keys) of the whole result except itself, as ADR 0007 decision 5.
- Hex values are never computed from decisions. Slice B looks them up in curated swatch sets keyed by decision values (ADR 0007, "Not chosen: generating token values").

### 5. Traceability

- Every color `Decision` carries the ids of the rules that won it and the union of their `because` knowledge entry ids. This is the existing `Decision` shape.
- The result keeps `fired`, `overridden`, `conflicts` and `undecided`, so a person sees what was set aside and why.
- A rule that cites an id not in the corpus makes the status `invalid` with the rule and the id named, and returns no decision.
- Status uses ADR 0007's words in its order: `invalid`, `conflicted`, `needs-input`, `resolved`. A decision no rule can make stays open: it is listed in `open` and gets no fallback value. A tie at the top priority is a conflict with each candidate and its rules: nothing is picked silently.
- In slice B, every palette role carries the decision keys that picked its swatch set, the rules behind those decisions and their `because` ids. The action roles also carry `color.action-is-functional`.

### 6. The node never sets locked groups

- Feedback (success, warning, danger, info) and focus are locked groups (`LOCKED_GROUPS` in `packages/design-system/src/profiles/model.ts`, DESIGN.md §8). A profile never overrides them, and the color node never sets them either.
- The palette's roles are exactly the semantic color paths a profile may override. `contractRoles` names `feedback` and `focus` as owned by the contract, with `because: ["color.semantics-separate"]`. Selection keeps its own role and is never the signature hex.
- The decision key `canvas` picks `surface.canvas`. It has nothing to do with the locked `canvas` group, the Studio canvas tokens, and never touches them.
- All four signature values sit outside the feedback families. Spec row 23 proves the separation against the contract's real feedback values, and row 21 proves every one of the 24 palettes against the E0-5 contrast contract.

### 7. What stays as it is, and why

- **`DECISION_VOCABULARY` and the cap of 8 in `profiles.test.ts`.** The cap keeps the profile vocabulary small enough for a person to compare directions. Color decisions are not part of that comparison, so they do not count toward it. With them, the list would hold eight keys and leave no room for the next profile decision. `COLOR_DECISIONS` is held to the same spirit by its own test: at most 8 keys, at least 2 values each.
- **`briefFactsSchema`.** It is the contract between the brief interpreters (ADR 0008, ADR 0009) and the rules. A field there is a field a model may fill. A crowd is measured from a lineup, so it stays out of that contract (decision 2).

## Consequences

- The grammar now has two scopes, and the next topic nodes, brand (ORV-19, E1-4) and Thai and Latin type (ORV-21, E1-6), follow the same pattern: a closed node vocabulary disjoint from the others, keys that fix the scope, and their own entry point. Each new node adds its vocabulary to the scope check. A generic registry of node scopes is not built until a second node needs one (AGENTS.md, Lean).
- Color decisions do not reach profiles, the resolver's matching, the Direction Studio or the token build. Wiring the palette into those is a separate story with its own contract change.
- Locks and expert adjustments (ADR 0007 decision 2) do not apply to color decisions in ORV-20. A person who disagrees with a color result has no override yet; spec, Out of scope.
- `resolver.ts` takes a one-argument change (decision 3), where the spec's impact list says "No change expected". The spec's impact row for `resolver.ts` and its Grammar additions item 2, which says topic `color` sets color keys, need a v2 wording to match decision 1.
- The thresholds and the hue bands rest on knowledge entries with basis `hypothesis` (confidence at most 0.4). Changing one is a versioned change of that entry and its rules, not of this ADR.

## Alternatives considered

- **Add `signature`, `neutral` and `canvas` to `DECISION_VOCABULARY`** (spec open question 2, option b). Every curated profile, the resolver's decision schema and the Direction Studio would have to carry decisions they do not use, and the profile list would reach the cap of 8. Not chosen.
- **A separate color algorithm outside the grammar** (option c). It loses the three-valued logic, the visible ties, `undecided` with the facts it needs, and the `because` trace, which is what ORV-20 exists for. Not chosen.
- **Scope by topic alone** (topic `color` means color keys). It breaks the starter rule `emphasis.expressive-signature` and two `rules.test.ts` fixtures, all topic `color` with profile keys, which spec row 16 forbids editing. Not chosen. Topic stays as a second check (decision 1, check 2).
- **Put `crowded` in `briefFactsSchema`.** A model-backed interpreter could then claim a crowd it never measured. Not chosen.
- **Let `crowded` appear in profile rules.** It would make every such rule unknown under the resolver and ask a brief for a lineup the profile path never audits. Not chosen.
- **Bump `schemaVersion` to "2.0".** Nothing that was valid becomes invalid, and unknown, priority and ties behave as before, so ADR 0006's change rules call this additive. Not chosen.
- **Leave the resolver ignoring color rules.** A color rule would show in `fired` and set nothing, a silent drop. Not chosen.

## Confirmation

Confirmation: in `packages/intent-engine/src`, `rules.test.ts` › "crowded condition is three-valued" fails when the `crowded` form stops being three-valued or stops naming `lineup`. `color-rules.test.ts` › "existing contracts unchanged" (`DECISION_VOCABULARY` equal to its v1.0 value), "crowded only comes from the audit" (`interpretationSchema` rejects facts carrying `crowded`), "rule-based, no model", "same input, same output" (shuffled rules and lineup, equal result and fingerprint), "a tie is a conflict", "unknown knowledge makes the result invalid", "every candidate crowded leaves the signature open" and "a missing input becomes a question" fail `pnpm test` when decisions 2 to 5 break. `color-audit.test.ts` › "order never matters" covers the audit. Slice A adds four scope tests to `color-rules.test.ts`, named here so the G3 packet can point at them: "the two vocabularies are disjoint and small", "a rule cannot mix scopes" (with a topic `color` rule that sets only profile keys still parsing), "crowded only in color rules", and "a rule of the other scope makes the result invalid" (both `decideColor` and `resolveProfile`). `packages/design-system/src/profiles/profiles.test.ts` › "is small and each entry has at least two values" and "matches the Intent Engine's list" keep failing on any color key added to `DECISION_VOCABULARY`. Decision 6 is confirmed by slice B: `color-palette.test.ts` › "every value is traceable" and `packages/design-system/src/tokens/color-node-contrast.test.ts` › "every palette the color node can produce passes the contrast contract" and "brand stays apart from feedback". Until slice B merges, decision 6 is not confirmed yet; follow-up: ORV-20 slice B.
