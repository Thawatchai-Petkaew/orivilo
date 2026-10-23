---
issue: ORV-77 (https://tpetkaew.atlassian.net/browse/ORV-77)
lane: L (risk flag: component public API)
version: 1
---

## Why

Audit D.2 story 16 (`docs/specs/ORV-64/audit.md`, B.11). Studio settings need a range with a lower and an upper bound, for example a spacing range or a type size range. `Slider` has one thumb.

## Decisions this spec relies on

- ADR 0003: Radix gives the behaviour (its Slider already takes several thumbs); the visual layer is ours.
- Catalog rule for Slider: the value is always readable as text beside the track, never only by thumb position or on hover (audit B.11, "Do not copy").
- DESIGN.md §7: every state is a story.

## Story

As a Studio user, I want to set a minimum and a maximum on one track, so that I can choose a range without two separate controls that can contradict each other.

## Decision: a new component, not a second mode of `Slider`

`RangeSlider` sits beside `Slider` in `src/components/slider/`. A union type on `Slider` (`number` or `[number, number]`) would make every caller's `value`, `onValueChange` and `format` types conditional. A separate component keeps `Slider` unchanged. Both use the same `ds-slider` recipe.

## Acceptance criteria

| #   | Given                                        | When                              | Result                                                                                                                                                      | Evidence                                                                            |
| --- | -------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | A range of 20 to 60                          | Rendering                         | Two thumbs. The value text reads `20 ถึง 60` (`20 to 60` in English) beside the label, without hover                                                        | `Default` story                                                                     |
| 2   | Focus on the lower thumb                     | Arrow, Page and Home/End keys     | Only the lower thumb moves; the upper keeps its value                                                                                                       | `Keyboard` play test                                                                |
| 3   | The lower thumb at the upper thumb's value   | ArrowRight, or End                | The value stays ordered: lower ≤ upper; the thumbs never swap or cross                                                                                      | `NoCrossing` play test (keyboard); pointer drags rely on Radix `preserveThumbOrder` |
| 4   | `minGap={10}`                                | Moving one thumb toward the other | It stops 10 away                                                                                                                                            | `MinGap` play test, `range.test.ts`                                                 |
| 5   | Each thumb                                   | Screen reader                     | Names "ค่าต่ำสุด ช่วงระยะห่าง" and "ค่าสูงสุด ช่วงระยะห่าง" (`slider.lower` or `slider.upper` plus the label) and its own `aria-valuetext` through `format` | `Default` play test                                                                 |
| 6   | Releasing a thumb                            | Pointer or keyboard               | `onValueCommit` fires once with `[lower, upper]`                                                                                                            | `Commit` play test                                                                  |
| 7   | Disabled, both modes, three profiles, 360 px | Rendering                         | Same states as `Slider`; Thai label wraps without clipping                                                                                                  | `Disabled`, `RecipesAndModes`, `LongLabelAt360`                                     |
| 8   | Catalog, coverage, DESIGN.md, i18n           | Checks                            | Entry `base/range-slider.yaml`, coverage row, DESIGN.md bump, Thai and English strings                                                                      | `check-catalog`, `check-i18n`                                                       |

## Impact (public API, AGENTS.md rule 2)

- New export `RangeSlider` and `RangeSliderProps`:
  - `label`
  - `value?` and `defaultValue?` as `[number, number]`
  - `onValueChange?` and `onValueCommit?`
  - `min`, `max`, `step`, `minGap` (0 by default)
  - `format?`, `disabled`, `name`, `id`, `className`
- `Slider` is unchanged.
- Locale keys: `slider.range` (`{min} ถึง {max}`), `slider.lower` (`ค่าต่ำสุด`), `slider.upper` (`ค่าสูงสุด`); each thumb's name joins its word and the label through `aria-labelledby`.
- No new tokens or contrast pairs. The same `ds-slider` recipe draws two thumbs. The range fill between them is the existing `slider.range` pair.

## Build notes

- Radix 1.6 `preserveThumbOrder` with `minStepsBetweenThumbs` keeps the thumb order, the gap, focus and step rounding for arrows, Page keys and pointer drags. Radix sends Home to the first thumb and End to the last whatever has focus, so each thumb handles those two keys itself through `jumpRange` (`range.ts`, unit-tested).
- `minGap` counts steps, not units. `name` posts one value per thumb.

## Out of scope

- A label-position choice (audit B.11). The value text stays where `Slider` puts it.
- Three or more thumbs.

## Changelog

- v1 (2026-10-23): spec.
- v1.1 (2026-10-23): thumb names through `aria-labelledby`; Radix `preserveThumbOrder` for crossing; Home and End per thumb.
