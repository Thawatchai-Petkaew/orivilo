---
issue: ORV-25 (draft key E2-2; https://tpetkaew.atlassian.net/browse/ORV-25)
lane: L
version: 1
---

## Why

Handoff §19 and §20 phase 2: before any shared component exists, prove that two hand-made profiles can change the look of the same token contract while every name, every state, and every contrast pair stays intact. E2-1 delivered the three layers; this story adds the fourth thing the resolver (E2-9) will produce, a profile, and fixes its shape so later customer profiles arrive through the same model. The owner's standard for the work: production grade, real tests, nothing claimed that is not implemented.

## Story

As a designer or agent composing UI, I want to switch between neutral, Professional, and Friendly in Storybook and see the same spec sheet change its look while its states, names, and contrast stay intact, so that I can trust a profile to carry visual expression only.

## Acceptance criteria

| #   | Given                                                                                | When                                               | User sees                                                                                                                                                             | Data effect                                                                                       |
| --- | ------------------------------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | `src/profiles/source/professional.json` and `friendly.json`                          | Reading them                                       | A DTCG-style overlay: `$id`, `$name` (th, en), `$description`, `$decisions`, own `primitives`, and `semantic` overrides carrying `$value` only                        | No new semantic name; feedback and focus absent; every colour has light and dark                  |
| 2   | A profile overrides a name outside the contract, a locked group, or a base primitive | `pnpm test`                                        | `profiles.test.ts` fails naming the profile, the path, and the rule                                                                                                   | None                                                                                              |
| 3   | A profile references a primitive that does not exist, or declares the wrong `$type`  | `pnpm test`                                        | One failing test naming the reference                                                                                                                                 | None                                                                                              |
| 4   | A declared contrast pair is under its floor under either profile in either mode      | `pnpm test`                                        | One failing test per profile, pair, and mode, naming the colours                                                                                                      | None                                                                                              |
| 5   | A profile declares `shape` or `surfaceTreatment` that its tokens contradict          | `pnpm test`                                        | A failing test naming the decision and the values found                                                                                                               | None                                                                                              |
| 6   | `src/profiles/generated.css` is older than the sources                               | `pnpm test`                                        | The test fails with the command to run                                                                                                                                | None                                                                                              |
| 7   | Storybook                                                                            | Toolbar profile set to Professional, then Friendly | Every Foundations page and the spec sheet re-render with the profile's values; the toolbar lists Neutral (base), Professional (สุขุม), Friendly (เป็นมิตร)            | `data-design-profile` on the preview root changes; nothing in a story sets a colour               |
| 8   | Storybook                                                                            | Foundations › Profiles                             | The same spec sheet under each of the three profiles side by side, a nested-boundary fixture, and for the toolbar profile its decisions, own ramps, and override diff | The story's play function reads computed custom properties of each sample and fails on a mismatch |
| 9   | Any profile                                                                          | Looking at feedback, focus, selection, and action  | Feedback and focus unchanged from neutral; selection and action differ from each other and from feedback                                                              | Enforced by `LOCKED_GROUPS` and the contrast pairs                                                |
| 10  | `DESIGN.md`                                                                          | Reading §5 and §12                                 | §5 has a Profile row naming the file, what it may and may not change, and the lane; §12 marks the two profiles real                                                   | None                                                                                              |

## Rules and bounds

- A profile overrides semantic values only. It may add primitive ramps under new paths; it may not change a base primitive, add a semantic name, or override `feedback.*` or `focus.*` (`LOCKED_GROUPS` in `src/profiles/model.ts`). A contract change (a new semantic name every profile must carry) is its own L-lane story with an impact list.
- Overrides keep the base `$type`, `$description`, and contrast declaration; a colour override carries `{ light, dark }` like the base.
- Decisions (`$decisions`) use the vocabulary in `DECISIONS`: shape (crisp, rounded, soft), surfaceTreatment (flat, bordered), emphasis (restrained, expressive), typeVoice (single, paired), motion (quiet, standard). `shape` and `surfaceTreatment` are required and checked against the tokens; the others are declared intent and are labelled so on the Profiles page.
- CSS: each profile emits two blocks, `[data-design-profile="id"]:not([data-mode="dark"])` and `[data-design-profile="id"][data-mode="dark"]` (specificity 0,2,0, above the base blocks). Own primitives are declared in both blocks before the overrides. Component tokens are not repeated: `generated.css` already declares them on `[data-design-profile]`, so they resolve against the profile's semantic values.
- `DesignProfileBoundary` always sets both `data-mode` and `data-design-profile`. A nested boundary resets every semantic value to its own profile, including back to neutral, because a declaration on the element beats inheritance; the Profiles story proves it.
- Ramps for the profiles use the same OKLCH method as E2-1. Hand-made values are interpretations (handoff §18 calibration), not customer brands, and the profile descriptions say so.
- Friendly's `action.primary` carries ink text, not white: a coral bright enough to read as friendly cannot reach 4.5 under white text, so `text.on-action` is `cream.900` and hover lightens one step. Professional keeps white on navy.
- The build is `scripts/build-tokens.ts`, which now writes both generated files from the registered profiles in `src/profiles/index.ts`; JSON sources are imported with `with { type: "json" }` so Node's type stripping and Vite read the same files.
- No density token: `space.row-block.comfortable` and `.compact` stay as named values; a density decision waits for the Table story (E2-6) to show what it governs.

## Out of scope

Components and recipes (E2-4), the Studio's own neutral entry and resolved profile internals (E2-3), portal scope (E2-5), the resolver that produces profiles from a brief (E2-9), export to Tokens Studio, a chart palette (profile group 6), density.

## Depends on

E2-1 (token model, contrast pairs), E2-0 (Storybook, boundary, checks), DESIGN.md v1.2. Unblocks E2-3, E2-4, E2-9.

## Changelog

- v1 (2026-10-21): written and delivered in the same PR at the owner's request, like E2-1. Decisions taken while building: profiles are overlays on the semantic layer rather than full token sets (a full set would let a profile drift from the contract silently); feedback and focus locked by group; shape and surfaceTreatment machine-checked, the rest declared; the Profiles page checks computed CSS in the browser so a missing import or a wrong selector fails `pnpm test`, proven by removing the import and watching the test go red.
