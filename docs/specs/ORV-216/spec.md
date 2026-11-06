---
issue: ORV-216 (https://tpetkaew.atlassian.net/browse/ORV-216)
lane: S (no risk flag: no token name or value, no component API, no resolver logic changes)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.2
depends on: ORV-52 (PR 180, the `orivilo` brand profile and `BRAND_PROFILES`)
---

# ORV-216: ORV-52 follow-ups, the brand profile inside the contrast check and the base set named as such

## Goal

Three follow-ups of ORV-52 (PR 180), items 1 to 3 of the Jira issue:

1. Reviewer R1-S1. `scripts/check-contrast.ts` (line 15) and `src/tokens/contrast-pairs.test.ts` (line 21) build their sets from `neutral` plus `profiles` only, so `BRAND_PROFILES` (today `orivilo`, `src/profiles/index.ts` line 38) is outside `pnpm contrast` and outside the `unexplainedColours` and `staleExemptions` checks. This story puts every brand profile inside both (`orv216-sets-1`).
2. Reviewer R1-S2. ORV-52 spec AC row 2 named `profiles.test.ts` as the source of the contrast pairs; the source is `src/tokens/contrast-pairs.test.ts` (`checkContrast`). Fixed in `docs/specs/ORV-52/spec.md` v1.2, and in `.claude/rules/design-system.md` line 20, which credits `profiles.test.ts` with every contrast pair per profile and mode (row 7 below checks both and holds the new sentence).
3. The words "ORIVILO profile" were written, before ORV-52, to mean the base set (`neutral`, no file). Now that a profile with the id `orivilo` exists, they read as that profile. They are reworded to "the base set (neutral)" (`orv216-words-1`, the rewording list below).

Nothing here is simulated or AI: a script, a test and wording. All paths below are inside `packages/design-system/` unless they start at the repo root.

Files this PR changes: `src/profiles/index.ts`, `scripts/check-contrast.ts`, `src/tokens/contrast-pairs.test.ts`, `src/tokens/source/semantic.json` (two `$description` strings), `catalog/base/logo.yaml`, and at the repo root `DESIGN.md`, `docs/context/brand/orivilo-brand-spec-v1.1.md`, `docs/specs/ORV-118/tech.md`, `docs/specs/ORV-52/spec.md`, `.claude/rules/design-system.md` and this spec. It changes no `*.stories.tsx` file (Out of scope, the stories files line).

## Rules

- `orv216-sets-1`. The contrast sets are one list, `CONTRAST_SETS`, defined once in `src/profiles/index.ts`: `{ id: "neutral", set: tokens }` first, then one entry per element of `profiles` in its order, then one entry per element of `BRAND_PROFILES` in its order, each `{ id: p.id, set: p.tokens }`. Today that is four sets: `neutral`, `professional`, `friendly`, `orivilo` (worked example 2). `scripts/check-contrast.ts` and `src/tokens/contrast-pairs.test.ts` both import it and build no list of their own; the floor check (`checkContrast`), `unexplainedColours` and `staleExemptions` run over every member. `profiles`, `PROFILE_IDS`, `CURATED_PROFILES` and both `generated.css` files are unchanged (`orv52-scope-1` holds). The header comments of both files say "the neutral set, every profile and every brand profile".
- `orv216-words-1`. Item 3 changes words only. The closed list of places is the rewording list below, found by a search of the whole repo for "ORIVILO profile" in any letter case, less w-13, which is left for a follow-up (the w-13 line under the list). In every one the words mean the base set, so each becomes "the base set (neutral)"; a sentence that would turn false gets a further change, named in its row. No token name and no token value changes: in `src/tokens/source/semantic.json` only two `$description` strings change, so the tokens build writes both `generated.css` files byte for byte as today. DESIGN.md gets v1.60 and one change log line; the brand spec and the ORV-118 tech notes keep their version (the meaning does not change).

## Acceptance criteria

No product UI changes, so no new copy. `P` is the pair count `pnpm contrast` prints first on its summary line (`semanticPairs(tokens).length`); every set has the same token paths, so each set gives `P` pairs per mode.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | `CONTRAST_SETS` per `orv216-sets-1` | `pnpm contrast` | Nothing (a terminal line) | None | Exit 0; the last line reads `P pairs x 4 sets x 2 modes = 8P checks, 0 under floor, 0 unexplained;` (one set more than today's `x 3 sets`, worked example 1); the `lowest` part is the same as before the change, because `orivilo` renders the base values and the reduce keeps the first minimum |
| 2 | Row 1 | `cd packages/design-system && node scripts/check-contrast.ts --all` | Nothing | None | `grep -c '^pass  orivilo '` on the output prints `2P`; `grep -c '^FAIL'` prints 0 |
| 3 | `contrast-pairs.test.ts` reading `CONTRAST_SETS` | `pnpm --filter @orivilo/design-system exec vitest run src/tokens/contrast-pairs.test.ts -t "orivilo (light\|dark):"` | Nothing | None | `2P` tests run and pass, one per pair and mode under `orivilo` |
| 4 | Row 3's file and the script | `grep -n "CONTRAST_SETS" scripts/check-contrast.ts src/tokens/contrast-pairs.test.ts`, `grep -c 'id: "neutral"' scripts/check-contrast.ts src/tokens/contrast-pairs.test.ts`, and the test "names every semantic colour token in a pair or in the exemption list, and nothing else" run with `-t` | Nothing | None | An import of `CONTRAST_SETS` in each file; 0 `id: "neutral"` literals in each; the test passes, so `unexplainedColours` and `staleExemptions` are `[]` for `neutral`, `professional`, `friendly` and `orivilo` |
| 5 | `CONTRAST_SETS` | A new test in `contrast-pairs.test.ts`, "the contrast sets are neutral, every profile and every brand profile", runs | Nothing | None | `CONTRAST_SETS.map((s) => s.id)` equals `[...PROFILE_IDS, ...BRAND_PROFILES.map((p) => p.id)]`, today `["neutral", "professional", "friendly", "orivilo"]` (worked example 2) |
| 6 | The `...BRAND_PROFILES` entries removed from `CONTRAST_SETS` (a scratch mutation, restored after) | Row 5's test and `pnpm contrast` run | Nothing | None | Row 5's test fails and its diff names `"orivilo"`; the summary line reads `x 3 sets`. The builder adds one `verified` row with the red line; after the restore rows 1 and 5 pass again |
| 7 | `docs/specs/ORV-52/spec.md` v1.2, and `.claude/rules/design-system.md` line 20 reworded | `grep -n 'contrast-pairs.test.ts' docs/specs/ORV-52/spec.md`, ``grep -c 'The contrast pairs `profiles.test.ts`' docs/specs/ORV-52/spec.md``, `grep -c -F 'checks every rule and every contrast pair' .claude/rules/design-system.md` and ``grep -n -F 'and `src/tokens/contrast-pairs.test.ts` checks every contrast pair under every set of `CONTRAST_SETS` in both modes' .claude/rules/design-system.md`` | Nothing | None | Row 2 (line 40) and the 1.2 changelog line name `src/tokens/contrast-pairs.test.ts` (`checkContrast`); the second command prints 0; line 5 reads `version: 1.2`. The third prints 0; the fourth prints line 20 only. The sentence "`profiles.test.ts` checks every rule and every contrast pair per profile and mode." becomes "`profiles.test.ts` checks every rule per profile, and `src/tokens/contrast-pairs.test.ts` checks every contrast pair under every set of `CONTRAST_SETS` in both modes."; the rest of line 20 and the rest of the file are unchanged (the sets are the members `orv216-sets-1` names) |
| 8 | The rewording list applied | `git grep -n -i 'orivilo profile' -- . ':!docs/specs/ORV-216/'` and `git grep -c -F 'the base set (neutral)' -- . ':!docs/specs/ORV-216/'`, then `git diff --name-only origin/develop -- '*.stories.tsx'` | Nothing | None | The first prints exactly one line, and it starts with `packages/design-system/src/components/logo/Logo.stories.tsx:18:` (w-13, left for a follow-up), so no other place is left; the second prints `DESIGN.md:2`, `docs/context/brand/orivilo-brand-spec-v1.1.md:1`, `docs/specs/ORV-118/tech.md:6`, `packages/design-system/catalog/base/logo.yaml:1`, `packages/design-system/src/tokens/source/semantic.json:2` (12 places, w-1 to w-12) and no `Logo.stories.tsx` line; the third prints nothing (no stories file changes) |
| 9 | Rows 1 to 8 done | `pnpm --filter @orivilo/design-system tokens && git diff --exit-code -- packages/design-system/src/tokens/generated.css packages/design-system/src/profiles/generated.css`; `git diff -U0 origin/develop -- packages/design-system/src/tokens/source/semantic.json \| grep -E '^[-+] ' \| grep -vc '"\$description"'`; then `pnpm lint && pnpm typecheck && pnpm test && pnpm build` | Nothing | None | The first exits 0 (no CSS value changes); the second prints 0 (every changed line of `semantic.json` is a `$description`); the gate is green |

## Rows per PR

- PR 183: rows 1-9

## Rows that render nothing

- Rows: 1-9

This PR renders nothing: a script, a test, token descriptions, a catalog note, a rules line and docs. The only text that changes where a person can read it is Storybook docs text: the two `$description` strings show in the Semantic foundations table, read from `semantic.json`, so no stories file changes. No layout, colour, component or app page changes; row 8 checks the text by command.

## Rewording list (`orv216-words-1`)

Search: `git grep -n -i 'orivilo profile'` over the whole repo (DESIGN.md, `docs`, `packages`, `apps`, `.claude`, AGENTS.md), and a wider `git grep -n -i -E 'orivilo`?\s+profile'`for the backtick form. The two searches find 14 places: 12 change in this PR (w-1 to w-12), 1 is left for a follow-up (w-13, the line under the list) and 1 stays. Lines are as of`751f524`.

Truth checks behind the new sentences, read from `src/profiles/source/`: the base set has `action.primary`, `brand.signature` and `brand.dot-small` all at violet.600 (light) and violet.400 (dark) (`semantic.json` lines 388, 561, 591); `orivilo.json` sets `brand.signature` and `brand.dot-small` to the same and inherits `action.primary`; `professional.json` has `action.primary` navy.800 and navy.300 against `brand.signature` navy.700 and navy.400; `friendly.json` has coral.500 and coral.300 against coral.400 and coral.400. So "shares violet with action.primary ... only" is true of the base set and `orivilo` and of nothing else, and w-4 names both.

<!-- prettier-ignore -->
| Id | Place | As it is | As it becomes |
| --- | --- | --- | --- |
| w-1 | `DESIGN.md:21` (§2) | "Violet is the signature (owner, ORV-118): the mark's dot, a bead and one highlight plane (`brand.signature`), the same value as the one primary action (`action.primary`) in the ORIVILO profile, and still a separate token." | "Violet is the signature (owner, ORV-118): the mark's dot, a bead and one highlight plane (`brand.signature`), the same value as the one primary action (`action.primary`) in the base set (neutral), and still a separate token." |
| w-2 | `DESIGN.md:225` (§8) | "Brand presence and Act share one value in the ORIVILO profile (violet.600 and violet.400, owner, ORV-118) and stay two tokens: no component reads both, and `tokens.test.ts` fails when they drift apart." | "Brand presence and Act share one value in the base set (neutral), violet.600 and violet.400 (owner, ORV-118), and stay two tokens: no component reads both, and `tokens.test.ts` fails when they drift apart." Still true: `tokens.test.ts` line 153 checks the shared value under neutral |
| w-3 | `docs/context/brand/orivilo-brand-spec-v1.1.md:102` | "The mark's dot is #7A22C7 on paper and #B07FEE on ink, the same values as the primary action (`action.primary`) in the ORIVILO profile; `brand.signature` stays a separate token, so brand presence and action never share a reader." | "The mark's dot is #7A22C7 on paper and #B07FEE on ink, the same values as the primary action (`action.primary`) in the base set (neutral); `brand.signature` stays a separate token, so brand presence and action never share a reader." |
| w-4 | `packages/design-system/src/tokens/source/semantic.json:567` (`brand.signature` `$description`) | "The signature colour: the mark dot above 24 px, a bead, one highlight plane; never text and never an action; shares violet with action.primary in the ORIVILO profile only (ORV-118)" | "The signature colour: the mark dot above 24 px, a bead, one highlight plane; never text and never an action; shares violet with action.primary only in the base set (neutral) and in orivilo, the brand profile that copies its values (ORV-118, ORV-52)" (the further change: "only" now covers two sets, see the truth checks) |
| w-5 | `packages/design-system/src/tokens/source/semantic.json:597` (`brand.dot-small` `$description`) | "The mark's dot at 24 px and below (logo forms 16 and 24), at least 3.0 on the canvas under every profile; equal to brand.signature in the ORIVILO profile; read by logo.dot-small and badge.dot.brand (the brand badge's bead)" | "The mark's dot at 24 px and below (logo forms 16 and 24), at least 3.0 on the canvas under every profile; equal to brand.signature in the base set (neutral); read by logo.dot-small and badge.dot.brand (the brand badge's bead)" |
| w-6 | `packages/design-system/catalog/base/logo.yaml:24` | "... in forms 16 and 24 the dot reads brand.dot-small (violet in both modes under the ORIVILO profile; another profile sets its own)" | "... in forms 16 and 24 the dot reads brand.dot-small (violet in both modes in the base set (neutral); another profile sets its own)" |
| w-7 | `docs/specs/ORV-118/tech.md:104` (quotes the `brand.dot-small` JSON) | The w-5 "as it is" string | The w-5 "as it becomes" string |
| w-8 | `docs/specs/ORV-118/tech.md:114` | "The `brand.signature` description becomes "(the w-4 as it is string)" (section 13)." | The same sentence quoting the w-4 "as it becomes" string |
| w-9 | `docs/specs/ORV-118/tech.md:573` | "`brand.signature`: "(the w-4 as it is string)"." | The same line quoting the w-4 "as it becomes" string |
| w-10 | `docs/specs/ORV-118/tech.md:684` (the "After" cell of DESIGN.md line 21) | The w-1 "as it is" sentence, inside the quoted cell | The w-1 "as it becomes" sentence; the rest of the cell is unchanged |
| w-11 | `docs/specs/ORV-118/tech.md:690` (the "After" cell of DESIGN.md §8) | The w-2 "as it is" sentence | The w-2 "as it becomes" sentence |
| w-12 | `docs/specs/ORV-118/tech.md:716` | "... becomes "(violet in both modes under the ORIVILO profile; another profile sets its own)"." | "... becomes "(violet in both modes in the base set (neutral); another profile sets its own)"." |
| left | `docs/specs/ORV-52/spec.md:40` (row 2, Given cell, found only by the backtick search) | "The `orivilo` profile" | Left unchanged: it means the new `orivilo` profile |

- w-13, left for a follow-up. `packages/design-system/src/components/logo/Logo.stories.tsx:18` (the Logo docs page lead): "Under the ORIVILO profile the dot is violet at every size." would become "In the base set (neutral) the dot is violet at every size." Reason: a PR that changes a stories file needs a designer visual sign-off and light and dark qa screenshots of that story (`.claude/skills/ovl/SKILL.md`, Visual sign-off, L-0019), and one docs sentence does not earn that round. It goes to the follow-up issue named in Out of scope; this PR leaves the line as it is, and row 8 expects it.

DESIGN.md also goes from v1.59 to v1.60 (line 1) with one change log line after line 344: "Change log: v1.60 (2026-11-06) ORV-216: §2 and §8 name the set where `brand.signature` and `action.primary` share one violet by its id, neutral, the base set, since ORV-52 added a brand profile with the id `orivilo`. Wording only: no token, value, contrast pair, component or profile file changes." That line stays outside row 8's counts on purpose (it has neither searched phrase).

## Worked examples

1. Check counts (row 1, row 2). Input: `P` = 97, from the last recorded summary, `docs/specs/ORV-118/tech.md` line 727 ("x 3 sets x 2 modes = 582 checks", 582 / 6 = 97). The builder reads today's `P` from the line before the change; the method stays. Integers, no rounding.

   ```bash
   node -e 'const P=97;console.log(JSON.stringify({before:P*3*2,after:P*4*2,orivilo:P*2}))'
   ```

   Expected: `{"before":582,"after":776,"orivilo":194}`.

2. The set ids `orv216-sets-1` gives (row 5). Input: the ids of `profiles` in order (`src/profiles/index.ts` lines 17 to 20, `$id` of `professional.json` and `friendly.json`) and of `BRAND_PROFILES` (line 38, `$id` of `orivilo.json`). No rounding.

   ```bash
   node -e 'const profiles=["professional","friendly"],brand=["orivilo"];console.log(JSON.stringify(["neutral",...profiles,...brand]))'
   ```

   Expected: `["neutral","professional","friendly","orivilo"]`.

## Out of scope

- Item 4 of ORV-216: the owner confirms diffs d-7, d-8 and d-10 of the ORV-52 spec (line heights 20 / 1.5 and 14 / 1.6, the 8 px space scale; ORV-52 open question 2). It stays an open owner decision; nothing here changes those tokens.
- Removing `orivilo.test.ts` row 2 (contrast under `orivilo`), which row 3 now repeats. It stays as ORV-52's own proof.
- Showing `orivilo` in the toolbar, `Matrix`, `PROFILE_IDS` or the Studio (`orv52-scope-1`).
- The stories files line. The two stories files, `src/components/logo/Logo.stories.tsx:18` (w-13) and `src/foundations/profiles.stories.tsx:212`, go to one follow-up issue, for the reason on the w-13 line under the rewording list. Line 212 credits `profiles.test.ts` with the contrast pairs ("Every declared contrast pair is tested under each profile in both modes by profiles.test.ts."); the follow-up names `contrast-pairs.test.ts` there. `.claude/rules/design-system.md:20`, the same misattribution, is fixed in this PR (row 7).

## Open questions

None open.

1. Closed on (a), its default, decided by the main session under the owner's POC delegation (2026-11-06). Where the one list lives. (a) `CONTRAST_SETS` in `src/profiles/index.ts`, beside the two lists it joins; not re-exported from the package index. (b) A function in `src/tokens/contrast-pairs.ts`, which would then import the profiles. Reason for (a): `contrast-pairs.ts` stays free of profile imports.

## Depends on

- ORV-52 spec v1.2 (`orv52-scope-1`, `BRAND_PROFILES`); ORV-14 (E0-5, one pair source for the script and the test).
- ORV-118 (violet signature, owner comment 10336), the sentences item 3 rewords.

## Changelog

- 1.0 (2026-11-06): first version.
- 1.1 (2026-11-06): two main-session decisions on ORV-216-spec-1. w-13 (`Logo.stories.tsx:18`) leaves this PR for one follow-up issue with `profiles.stories.tsx:212`, so the PR changes no stories file: the rewording list holds w-1 to w-12, row 8 expects the one w-13 line and 12 places, Rows that render nothing drops the story text. `.claude/rules/design-system.md:20` is fixed in this PR: row 7 gains its check and new sentence, and the rules file joins the files this PR changes. Open question 1 closes on (a). Rows 1 to 6 and `orv216-sets-1` are unchanged. Review downstream: the builder envelope for rows 7 and 8 (add the rules line, do not edit `Logo.stories.tsx`), the qa walk of rows 7 and 8, and the follow-up issue to be raised for the two stories files.
- 1.2 (2026-11-06): form only, by the main session. The two row lists take the form the result recorder reads (numbers and `a-b` ranges split by commas): "rows 1 to 9" becomes "rows 1-9", and the note that followed the Rows list moves into the paragraph under it. No row, rule or check changes.
