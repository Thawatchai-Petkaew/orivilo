---
issue: ORV-24 (draft key E2-1; https://tpetkaew.atlassian.net/browse/ORV-24)
lane: L
version: 1
---

## Why

The owner's requirement (2026-10-21): the token contract must have the three layers of a complete design system, primitive, semantic, and component, like the Untitled UI system he built in Figma, and every layer must be visible. E2-0 shipped only the semantic layer as hand-written CSS. This story makes the token source the single source of truth, tool-neutral (DTCG JSON, importable into Figma Variables through Tokens Studio), generated into CSS, tested, and rendered in Storybook.

## Story

As a designer or agent composing UI, I want every token to live in one of three source files with a visible chain from component to semantic to primitive, so that a value can be changed in one place, the layer rule is enforced by a test, and Storybook shows what each name resolves to in each mode.

## Acceptance criteria

| #   | Given                                                      | When                                               | User sees                                                                                                                                                            | Data effect                                |
| --- | ---------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | `src/tokens/source/primitives.json`                        | Reading it                                         | Seven 12-step colour ramps, radius, space, size, font, shadow, blur, opacity, duration, easing, breakpoints                                                          | DTCG `$type`/`$value` nodes; no references |
| 2   | `semantic.json`                                            | Reading it                                         | Groups surface, text, border, action, selection, focus, brand, feedback, shape, space, size, type, font, elevation, motion, opacity; every colour has light and dark | Values reference primitives only           |
| 3   | `component.json`                                           | Reading it                                         | Slots for button, input, card, tile, nav-item, toolbar, dialog, toast, tooltip, badge, table, checkbox                                                               | Values reference semantic only             |
| 4   | A token references the wrong layer, or a mode is missing   | `pnpm test`                                        | `tokens.test.ts` fails and names the token and the rule                                                                                                              | None                                       |
| 5   | `generated.css` is older than the sources                  | `pnpm test`                                        | The test fails with the command to run                                                                                                                               | None                                       |
| 6   | A declared contrast pair is under its floor in either mode | `pnpm test`                                        | One failing test per pair and mode, naming the colours                                                                                                               | None                                       |
| 7   | Storybook                                                  | Foundations › Primitives                           | Every ramp, scale, and value, with the best contrast ink or white reaches on each colour step                                                                        | None                                       |
| 8   | Storybook                                                  | Foundations › Semantic, toolbar mode light or dark | Every semantic token with its chain in both modes, the current swatch, and the contrast of its pair                                                                  | None                                       |
| 9   | Storybook                                                  | Foundations › Component tokens                     | Every component slot with its chain, plus a spec sheet painted from the tokens alone, labelled as not a component                                                    | None                                       |
| 10  | `DESIGN.md`                                                | Reading §3 and §5                                  | §3 is a snapshot of `semantic.json` and says so; §5 names the three files and prefixes                                                                               | None                                       |

## Rules and bounds

- Prefixes: `--op-` primitive, `--ds-` semantic, `--cmp-` component. Pages and components use `--ds-*` and `--cmp-*` only.
- Modes live on semantic colour tokens as `{ light, dark }`. Primitives and component tokens never carry modes.
- Typography tokens are composites (family, size, line-height, weight, letter-spacing) and expand to five custom properties and a Tailwind `--text-*` entry.
- The build is `scripts/build-tokens.ts`, run by Node's type stripping; the model in `src/tokens/model.ts` is pure and shared with the tests and the stories.
- Ramps are anchored on brand spec v1.1 hexes and interpolated in OKLCH; anchors never move without a brand spec change.

## Out of scope

Figma sync (export to Tokens Studio format is a later story), the `airy` recipe (E2-2), components (E2-4), chart palette (profile group 6).

## Depends on

DESIGN.md v1.1 (mood E), E2-0, ADR 0003. Unblocks E2-2, E2-4.

## Changelog

- v1 (2026-10-21): written and delivered in the same PR at the owner's request; value changes against v1.1 are listed in the DESIGN.md v1.2 change log.
