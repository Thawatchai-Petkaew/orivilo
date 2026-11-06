---
issue: ORV-221
spec: docs/specs/ORV-221/spec.md v1.3
task: ORV-221-design-1, ORV-221-design-2
date: 2026-11-06
---

# ORV-221: RadioGroup and Switch, design

The look of the two controls, decided on rendered proposals. The builder builds from this file; the recipe in "Recipe" is the CSS that was rendered, with the one naming change that section states.

Every proposal image below is static HTML that mirrors the Radix output, with this CSS put in by `page.addStyleTag` over the stories `base-checkbox--checked` and `examples-base-settings-form--default`. Hover, pressed and focus were forced through twin classes in the images and read separately on real pseudo states (D19). The images are Thai only, as the envelope asked. English belongs to sign-off rows 20 and 39, on the real stories.

D22 to D25 are the rework of the sign-off `ORV-221-signoff-1` at head `023cb9c` (findings F1, F2, F3). Their images are not static HTML: they are the real stories at that head with the proposed CSS injected, listed under "Rework screenshots, design 2". The Switch rows are untouched here; the Switch PR is a later PR.

## Flow

RadioGroup, inside a form that saves on submit:

1. The person reads the group label and the help line, and sees every option at once. With no default, no circle holds a dot.
2. A click on a circle or a label, or Tab then Space, or an arrow key, checks one option. The dot moves at once, with no pressed step.
3. The form's button submits. A missing choice comes back as `Field`'s error under the group, and every circle takes the error edge until the caller clears it.

Switch, a setting that applies immediately:

1. The person reads the label and the description, and sees the thumb's place. The label never changes with the state.
2. A click on the Switch or its label, or Space or Enter on it, flips it. The caller sets `checked` to the new value and `saving`.
3. Saving: the thumb is already at its new place, a ring turns in it, focus stays, and further input is stopped.
4. Success: the ring goes and the thumb stays. There is no tick and no saved word, because the component has no backing data for one.
5. Failure: the thumb returns, the ring goes, and `Field`'s error says what went wrong and how to fix it, with the error edge on the track. The next toggle is the retry, and the caller clears the error when it starts.

## Answers to the open questions

All four confirm the spec's default. No rule changes through these answers; the amendments below come from the render, not from the questions.

<!-- prettier-ignore -->
| # | Question | Answer | Why |
| --- | --- | --- | --- |
| 1 | Which token a checked radio and an on switch read | (a) the selection tokens, for both, as `control-tokens-1` | Judged beside a checked Checkbox in one form. Under neutral and professional the two differ by two steps of one hue in light (`#7a22c7` against `#6b22b0`, `#19315e` against `#254582`) and are equal in dark, so shape and fill weight tell the controls apart and the form reads as one family. Friendly is the one real split: a coral tick beside a teal dot and track (`#e05c45` against `#00645b`). That split is the Checkbox's, not the new controls': (b) under friendly puts a coral fill with a dark dot and thumb, close to the warmth of an error, and crosses `DESIGN.md` section 8; (c) gives two hues between the radio and the switch in the same form. Under (a) the radio and the switch share one selection language and the Checkbox is the outlier, which the card in the spec's Out of scope fixes. I recommend opening that card |
| 3 | The saving ring's place in a Switch | In the thumb, as `switch-save-1` | Nothing moves when the ring appears, it works for a bare Switch with no label (row 30), and it needs no `Field` slot. Beside the label the ring's distance from the control follows the label's length: a long label pushes it to the far end of the line, away from what is saving. The ring reads in both modes and on both thumbs |
| 4 | How a radio stays round | (a) the new semantic `shape.round.radius`, as `control-shape-1` | Under professional (b) gives rounded squares that read as checkboxes when the Checkbox stands below them, which is the confusion the circle exists to prevent. (c) clips the halo at the circle's edge. My (c) render also set `border-radius: 0`, which cuts the edge as well; the halo is clipped with or without that line, so the finding on the halo stands and the broken edge is partly my render's |
| 5 | The pressed look of a Switch | (a) `switch.track-press`, off and on, as `control-tokens-1` | Near black in light and near white in dark, for the moment of the press, off and on alike. The thumb stays legible on both (pairs in `control-pairs-1`). (b) shows no change at all and leaves `DESIGN.md` section 7 unmet. AC row 25's word "darkens" is only true in light; see A4 |

Evidence: the `compare` shots, one block per question, each with its options side by side in the same content. `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/sheet-compare.png` holds all of them.

## Visual decisions

<!-- prettier-ignore -->
| # | Decision | Value (tokens) | Why (source intent) | AC |
| --- | --- | --- | --- | --- |
| D1 | Radio circle | 20 px at md, 16 px at sm; `radio.size`, `radio.size-sm`; 1 px `radio.border` | W1. One size step under the Switch, the same box as `.ds-checkbox__box` | 10 |
| D2 | Circle centres on the first line of its label | `margin-block-start: calc((1lh - size) / 2)`, the control carrying the label's font size and line height | `radio-api-1`. Holds at every line count; measured offset -0.01 px | 10, 12 |
| D3 | Checked radio | `radio.bg-checked` ground, `radio.border-checked` edge, `radio.dot` dot | `control-tokens-1`, Q1. The dot, not the colour, carries the state | 9 |
| D4 | Group rhythm | 8 px between rows (`radio.group-gap`), 8 px circle to text (`radio.gap`), horizontal column gap 16 px (`space.stack.md`) | Choice row of `DESIGN.md` section 4. The column gap reuses a semantic space, so no new token | 1, 11 |
| D5 | Row hover changes the circle's edge, on the content only | `radio.border-hover` unchecked, `radio.border-checked-hover` checked; the group's `align-items: flex-start` keeps a row as wide as its content | Without it a hover would light a circle from a blank spot 1400 px away at 1440 | 8 |
| D6 | Invalid wins over hover | Hover rules exclude `[aria-invalid="true"]`; the error edge stays through hover and focus | Not copied from Checkbox: there the row hover beats the error edge (the finding under this table) | 6, 8 |
| D7 | Switch geometry | Track 44 by 24 and 36 by 20, thumb 20 and 16, inset 2, travel 20 and 16 | W1, `switch-size-1` | 24 |
| D8 | Off and on | Off: `switch.track` with a `switch.thumb` at the start. On: `switch.track-on` with a `switch.thumb-on` at the end | Place carries the state with colour, so it never rests on colour alone; in forced colours the thumb's place alone shows it | 21, 24 |
| D9 | Hover | Off: the track takes `switch.track-hover`. On: a 1 px `switch.edge-on-hover` edge, the fill unchanged | The on fill must stay the selection colour. Excluded under invalid and under focus (D6, D10) | 25 |
| D10 | Focus | The `focus.ring` border with the 3 px halo; on, with the inner line of `--_focus-shadow-fill` | The rule for filled controls. On the on track the border equals the fill, so the halo alone would be the only change (A2). Hover and press never take the focus line away | 25 |
| D11 | Pressed | `switch.track-press` fill, off and on; the edge stays what it was (red under invalid, the focus line under focus) | Q5 | 25 |
| D12 | Invalid | 1 px `switch.edge-error` edge, the fill unchanged | The fill stays honest about off and on. 1 px of red on violet is quiet, and that is accepted: the message under the row carries the state | 27 |
| D13 | Saving ring | In the thumb, thumb size less `space.inline.sm`: 16 at md, 12 at sm, a 2 px margin at both; `switch.ring` stroke | Q3, A1 | 28, 39 |
| D14 | Thumb shape | `calc(switch.radius - inset)`: full round under neutral, 4 px under professional | Concentric with the track, so the 2 px gap is even all round (A3) | 24 |
| D15 | Disabled | `surface.disabled` ground, `text.secondary` thumb and dot, labels in `text.disabled`, cursor `not-allowed`, no opacity | `control-disabled-1`. The thumb and dot look heavier than the label, and that is needed: `text.disabled` on `surface.disabled` would be about 2.85, under the 3.0 floor. Same token as `checkbox.fg-disabled` | 4, 26 |
| D16 | Horizontal Field | Two columns `minmax(0, 1fr) auto`, 16 px gap; the control on row 1, centred on the label's first line; the error across both | `field-row-1`. The row belongs in a form column: the settings form is `max-w-3xl`. At 1440 with no column the Switch sits 1300 px from its label, so the story needs a width wrapper and `field.yaml` should say so | 21, 33, 36 |
| D17 | Bare Switch | No first-line margin, `vertical-align: middle` | The margin lives on the horizontal Field only. On the bare control it would shift an `sm` Switch by 1.9 px in a table row | 30 |
| D18 | Notifications tab | Heading `text-label-md`, help `text-body-sm`, 4 px between them, 24 px down to and between the rows | Rendered in the settings form at 360 and 1440; matches the rhythm of the general tab | 37 |
| D19 | Evidence read on real pseudo states | Neutral light. Hover off `rgb(91, 90, 102)`; on, edge `rgb(22, 21, 29)`, fill kept; press `rgb(22, 21, 29)`; on and focused, hovered, then Space held: edge stays `rgb(122, 34, 199)`; invalid on, hovered, pressed, focused: edge stays `rgb(180, 35, 24)` | The rules below were corrected for this: my first draft let the hover and press rules beat focus and invalid by specificity | 25, 27 |
| D20 | No Field label hover tie on the Switch | The label gets `cursor: pointer`, no hover link to the track | Field's label is shared with other controls; the pointer is enough, and a hover tie would need `:has` for one control | 21 |
| D21 | Disabled empty circle | `surface.disabled` on canvas is under 3.0 | Accepted. It is the same as a disabled Checkbox and Input, and it reads through its label. `control-pairs-1` does not list this pair | 4, 5 |
| D22 | A checked radio under focus draws a 2 px line (F1) | 1 px `focus.ring` border plus a 1 px inner line in `focus.ring` (the local `--_inner`, then `--_focus-shadow-border`), with the 3 px halo touching it, against 1 px at rest. The circle stays 20 and 16 px and the dot stays `radio.dot` at 8 and 6 px; the gap from line to dot goes from 5 to 4 px at md and from 4 to 3 px at sm. No new token. Play: `InteractionStates`, `expectEdgeInk` left, 1 px on `rg-rest-on`, 2 px on `rg-focus-on`, reach 2 | Width carries the change, because colour cannot: `focus.ring` against the rest edge reads only 1.0 to 1.95 over the eight boundaries, and 1.0 is the same colour. Rendered by real focus at md and sm, device scale 1, 2 and 6, under neutral, professional and friendly, light and dark: 2 px of edge ink against 1 px at rest and 1 px today. Chosen over the sign-off's `--_focus-shadow-fill`, which reads the same 2 px but draws the inner line in dot ink: under friendly that is a coral line beside a teal one, two semantics in one line, muddy in both modes. One line in one colour keeps `DESIGN.md` section 3.1's line in `focus.ring`, and the dot alone keeps the selection colour. The form is the Checkbox's (`recipes.css` lines 627 to 631) with another ink, because a radio's ground is a light tint, not its edge colour | 8, 9 |
| D23 | Checked and invalid under focus draws a 2 px red line (F1) | 1 px `radio.border-error` border plus a 1 px inner line in `radio.border-error`, the 3 px halo still from `focus.ring`, the dot kept. Play: `InvalidChecked` and the `invalid-checked` case of `InEnglish`, the shadow starts with the resolved `--cmp-radio-border-error`; `expectEdgeInk` left, 1 px on the unchecked circle, 2 px on the checked one, reach 2 | The sign-off's `:not([aria-invalid])` is refused: it leaves this state with a halo only, which is F1 again. Rendered on `Invalid` by Tab then Space, with four forms side by side: today, a dot line, a ring line and an error line. The dot and ring lines put two colours in one line and take the edge away from D6's "the error edge stays through hover and focus". The red line reads as one line in all six boundaries | 6, 8 |
| D24 | The group root draws no focus (F2) | `.ds-radio-group:focus-visible` sets `outline: none` and `box-shadow: var(--_focus-shadow-none)`. The band goes from a 4 px halo to 0 px; focus shows on a radio only. No token. Play: `Disabled`, the root focused and matching `:focus-visible`, `expectEdgeInk` right, 0 px, reach 6 | Radix gives the root `tabindex` 0, so a click that lands on no control leaves focus on the root. The plays of `Disabled` and `DisabledItem` leave it there at rest, and on a real page a click on a description then any key does the same. The global `:focus-visible` rule then drew a band round the whole group, as tall as the form section and with no meaning. The root is a wrapper, not a control, so `DESIGN.md` section 7's "never removed" stays true of the radios; `.ds-menu__option` and `.ds-input-group__input` set the same pair. `outline: none` is written out although Radix sets it inline, so the rule does not rest on Radix. Tab from a click-focused root leaves the group, and Shift+Tab then lands on the checked radio with its full focus look: that is Radix's behaviour today, the same with or without the band, and this row does not change it | 4, 5 |
| D25 | The focus rows hold the focus look at rest (F3) | `focusVisible: ["#rg-focus", "#rg-focus-on"]` in the same `parameters.pseudo` object as `hover`, in `InteractionStates` and `InEnglish`. The two rows show D22's look with no DOM focus. No change to `.storybook/preview.tsx`. Play: `InteractionStates`, `waitFor` the halo on both rows, `not.toHaveFocus`, the border against `--ds-focus-ring` | As built both focus rows read as rest, because the story names no `focusVisible`. `withPseudoHover` does not carry it: the decorator reads only `pseudo.hover`, adds only `pseudo-hover`, and asks for the sheet rewrite only when `hover` is set. It does not need to: the addon's own decorator adds `pseudo-focus-visible` (seen in the iframe and in Vitest). What matters is the rewrite. A story with `hover` and `focusVisible` passed alone in 5 of 5 runs. A story with `focusVisible` only failed alone in 5 of 5 (`expected 'none' to match / 0px 0px 0px 3px$/`) and passes in the whole file only through an earlier story's rewrite, an order dependency. So the rule: a story that forces `focusVisible` names `hover` in the same object, and reads the held look inside `waitFor`. Extending the decorator also worked, but it is not needed and it is a shared file that triggers the full suite | 8, 15 |

Finding outside this story: on a Checkbox, the row hover rule beats the error edge. In the browser an invalid box reads `rgb(180, 35, 24)` at rest and `rgb(91, 90, 102)` under hover (`recipes.css` line 608). The radio does not copy it. It needs its own follow-up card.

Contrast, measured on the proposal: every pair of `control-pairs-1` is at 3.0 or more in eight boundaries (neutral, professional, friendly, orivilo, light and dark). The lowest are `radio.border` on `radio.bg` at 3.33 under friendly dark and 3.35 under professional dark, and 3.38 on canvas under neutral light. `recipes.test.ts` and `pnpm contrast` stay the proof.

## States

Selected and focused are separate rows: a checked control can be focused or not, and each look is defined on its own.

### RadioGroup item

<!-- prettier-ignore -->
| State | Look | Rendered in |
| --- | --- | --- |
| Default | Empty circle, `radio.bg`, `radio.border` | `radio` block States |
| Hover | Edge `radio.border-hover`, from anywhere on the row's content | Same |
| Focus | `focus.ring` border, 3 px halo, circle otherwise unchanged. Only a radio shows focus: the group root draws nothing (D24) | Same, and `InteractionStates` (D25) |
| Selected | Dot on `radio.bg-checked`, `radio.border-checked` edge | Same |
| Selected and hover | Edge `radio.border-checked-hover`, dot unchanged | Same |
| Selected and focus | A 2 px line in `focus.ring` (1 px border, 1 px inner line), 3 px halo, the dot kept (D22) | `InteractionStates` (D25) |
| Selected, error and focus | A 2 px line in `radio.border-error` (1 px border, 1 px inner line), 3 px halo from `focus.ring`, the dot kept (D23) | `InvalidChecked` |
| Disabled | `radio.bg-disabled`, `radio.border-disabled`, `radio.dot-disabled` when checked, labels `text.disabled` | `radio` blocks Disabled, Disabled item |
| Loading | Not applicable (`state-set-1`): the form's button carries it, and `saving` in the example disables the group | Settings form |
| Empty | Not applicable: a group with no option is not rendered. A group with no value shows no dot (row 2) | `radio` block One form |
| Error | Every circle takes `radio.border-error`, through hover and focus; a checked circle under focus is the row "Selected, error and focus"; the message is `Field`'s | `radio` block Invalid |
| Success | None: a radio applies on submit | Not applicable |

### Switch

<!-- prettier-ignore -->
| State | Look | Rendered in |
| --- | --- | --- |
| Default (off) | `switch.track`, `switch.thumb` at the start | `switch` block States |
| Selected (on) | `switch.track-on`, `switch.thumb-on` at the end | Same |
| Hover | Off: `switch.track-hover`. On: `switch.edge-on-hover` edge | Same |
| Pressed | `switch.track-press`, off and on | Same |
| Focus | Off: focus line and halo. On: focus line, inner line and halo | Same |
| Disabled | `switch.track-disabled`, `switch.thumb-disabled`, thumb at its place; `disabled` wins over `saving`, so no ring | `switch` blocks States, Disabled |
| Loading (saving) | Ring in the thumb, `cursor: progress`, hover and press looks off, focus kept | `switch` blocks States, Saving |
| Empty | Not applicable. A missing value reads as off (row 21) | Not applicable |
| Error | `switch.edge-error` edge through hover, press and focus; the message is `Field`'s under both columns | `switch` block Failed save |
| Success | The ring goes and the thumb stays. Nothing else, by rule (`switch-save-1`) | Not applicable |

## Thai, long content, small screens, motion

- Thai marks: `crop-radio-360-long.png` and the `Long content` blocks show no clipped mark at 1.7 line height, and `ปิ่นโต้` keeps its marks above. The proof in rows 12 and 33 is that nothing up to the frame clips, with `expectLinesClear` on the wrapped long Thai label; row 12 also calls `expectFrameCutsNoInk(el, frame)` for the frame clip.
- Long labels: `overflow-wrap: anywhere` on the label, `min-inline-size: 0` down the chain. Page overflow was 0 in all 40 shots of the five scenes under neutral and professional, at 360 and 1440.
- Thai line break: at 360 the Switch description breaks inside โปรเจกต์ (โปรเจ on one line, กต์ on the next) in the `switch-*-360` shots. `Intl.Segmenter` on Thai gives the same pieces (`โปร`, `เจ`, `กต์`), so the word is not in the dictionary the browser uses. It is not caused by the recipe. The real settings form at 360 breaks at a word edge, because its column differs. The sign-off should note it, and it should not count against this look.
- Missing data: no value shows an empty group or an off Switch; no description drops the line and the control stays on the first line.
- Reduced motion: under `prefers-reduced-motion: reduce` the thumb's transition reads 0 s, and `ds-spin` keeps turning at 1 s, as ORV-201 `spin-motion-1` asks.
- Forced colours: the transparent outlines on track and thumb draw both, so the thumb's place shows the state (`zoom-forced-neutral-light.png`, taken before the last edit to the hover and press rules, which touch no rest look).
- D22 at every line count: the long label reads 3 lines at 360 and 2 at 1440, one-line labels are in `Sizes`, and the circle stays on the first line with the line and halo unclipped. Page overflow was 0 in all 18 scenes in all eight rendered boundaries.
- D22 under forced colours (neutral, md, light and dark): shadows drop, so the inner line and halo go, and the transparent outline draws. Rest is a plain circle, focus a heavier line, the dot kept (`sheet-forced.png`).
- D22 under reduced motion: the recipe transitions only `background-color` and `border-color`, so the inner line and halo appear at once. The 0.12 s colour transition that remains is F5's card, not touched here.

## Recipe

The render declared the tokens in a style tag and read `--ds-type-body-*` directly; the recipe below reads `--cmp-radio-label-type-*` and `--cmp-radio-label-type-sm-*`, which `control-tokens-1` sets to the same values. Every value is a `--cmp-*` or `--ds-*` property or a `calc` of them, for `recipes.test.ts`. `--_focus-shadow-border` and `--_focus-shadow-fill` are the ones in `recipes.css` today.

The inner line of D22 and D23 goes through the local `--_inner`, as `.ds-checkbox__box` does: `recipes.test.ts` line 61 fails any `box-shadow:` line that does not start with `var(`. Each new rule wins by specificity, not by its place: `.ds-radio-group:focus-visible` is 0,2,0 against the global 0,1,0; the checked rule is 0,3,0 against `.ds-radio__control:focus-visible` at 0,2,0; the invalid and checked rule is 0,5,0 and only changes `--_inner`.

### R1: RadioGroup

```css
.ds-radio-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--cmp-radio-group-gap);
  min-inline-size: 0;
}
.ds-radio-group[data-layout="horizontal"] {
  flex-direction: row;
  flex-wrap: wrap;
  column-gap: var(--ds-space-stack-md);
}
.ds-radio-group:focus-visible {
  outline: none;
  box-shadow: var(--_focus-shadow-none);
}
.ds-radio {
  display: flex;
  align-items: flex-start;
  gap: var(--cmp-radio-gap);
  min-inline-size: 0;
  max-inline-size: 100%;
}
.ds-radio__control {
  --_size: var(--cmp-radio-size);
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--_size);
  block-size: var(--_size);
  padding: 0;
  font-size: var(--cmp-radio-label-type-font-size);
  line-height: var(--cmp-radio-label-type-line-height);
  margin-block-start: calc((1lh - var(--_size)) / 2);
  border: 1px solid var(--cmp-radio-border);
  border-radius: var(--cmp-radio-radius);
  background: var(--cmp-radio-bg);
  color: var(--cmp-radio-dot);
  cursor: pointer;
  transition:
    background-color var(--ds-motion-feedback-duration) var(--ds-motion-easing),
    border-color var(--ds-motion-feedback-duration) var(--ds-motion-easing);
}
.ds-radio__control::after {
  content: "";
  position: absolute;
  inset: calc((var(--_size) - var(--cmp-radio-target-min)) / 2 - 1px);
}
.ds-radio__control[data-state="checked"] {
  background: var(--cmp-radio-bg-checked);
  border-color: var(--cmp-radio-border-checked);
}
.ds-radio-group:not([aria-invalid="true"])
  .ds-radio:hover
  .ds-radio__control[data-state="unchecked"]:not([data-disabled]):not(:focus-visible) {
  border-color: var(--cmp-radio-border-hover);
}
.ds-radio-group:not([aria-invalid="true"])
  .ds-radio:hover
  .ds-radio__control[data-state="checked"]:not([data-disabled]):not(:focus-visible) {
  border-color: var(--cmp-radio-border-checked-hover);
}
.ds-radio-group[aria-invalid="true"] .ds-radio__control {
  border-color: var(--cmp-radio-border-error);
}
.ds-radio__control:focus-visible {
  border-color: var(--ds-focus-ring);
  outline: 1px solid transparent;
  outline-offset: 0;
  box-shadow: var(--_focus-shadow-border);
}
.ds-radio__control[data-state="checked"]:focus-visible {
  --_inner: inset 0 0 0 1px var(--ds-focus-ring);
  box-shadow: var(--_inner), var(--_focus-shadow-border);
}
.ds-radio-group[aria-invalid="true"] .ds-radio__control:focus-visible {
  border-color: var(--cmp-radio-border-error);
}
.ds-radio-group[aria-invalid="true"] .ds-radio__control[data-state="checked"]:focus-visible {
  --_inner: inset 0 0 0 1px var(--cmp-radio-border-error);
}
.ds-radio-group .ds-radio__control[data-disabled] {
  background: var(--cmp-radio-bg-disabled);
  border-color: var(--cmp-radio-border-disabled);
  color: var(--cmp-radio-dot-disabled);
  cursor: not-allowed;
}
.ds-radio__label {
  color: var(--cmp-field-label);
  font-family: var(--cmp-radio-label-type-font-family);
  font-size: var(--cmp-radio-label-type-font-size);
  line-height: var(--cmp-radio-label-type-line-height);
  font-weight: var(--cmp-radio-label-type-font-weight);
  letter-spacing: var(--cmp-radio-label-type-letter-spacing);
  overflow-wrap: anywhere;
  cursor: pointer;
}
.ds-radio[data-disabled] .ds-radio__label,
.ds-radio[data-disabled] .ds-field__description {
  color: var(--ds-text-disabled);
}
.ds-radio[data-disabled] .ds-radio__label {
  cursor: not-allowed;
}
.ds-radio-group[data-size="sm"] .ds-radio__control {
  --_size: var(--cmp-radio-size-sm);
  font-size: var(--cmp-radio-label-type-sm-font-size);
  line-height: var(--cmp-radio-label-type-sm-line-height);
}
.ds-radio-group[data-size="sm"] .ds-radio__label {
  font-size: var(--cmp-radio-label-type-sm-font-size);
  line-height: var(--cmp-radio-label-type-sm-line-height);
}
```

### R2: horizontal Field

```css
.ds-field[data-orientation="horizontal"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: var(--ds-space-stack-md);
  row-gap: var(--cmp-field-gap);
}
.ds-field[data-orientation="horizontal"] > * {
  grid-column: 1;
  min-inline-size: 0;
}
.ds-field[data-orientation="horizontal"]
  > :not(.ds-field__label, .ds-field__description, .ds-field__error) {
  grid-column: 2;
  grid-row: 1;
}
.ds-field[data-orientation="horizontal"] .ds-switch__track {
  font-size: var(--cmp-field-label-type-font-size);
  line-height: var(--cmp-field-label-type-line-height);
  margin-block-start: calc((1lh - var(--_h)) / 2);
}
.ds-field[data-orientation="horizontal"] > .ds-field__error {
  grid-column: 1 / -1;
}
.ds-field[data-orientation="horizontal"] > label.ds-field__label {
  cursor: pointer;
}
.ds-field[data-orientation="horizontal"][data-disabled] > label.ds-field__label {
  cursor: not-allowed;
}
```

### R3: Switch

```css
.ds-switch {
  --_h: var(--cmp-switch-height);
  --_t: var(--cmp-switch-thumb-size);
  --_inset: calc((var(--_h) - var(--_t)) / 2);
  display: inline-flex;
  flex: none;
  vertical-align: middle;
}
.ds-switch[data-size="sm"] {
  --_h: var(--cmp-switch-height-sm);
  --_t: var(--cmp-switch-thumb-size-sm);
}
.ds-switch__track {
  position: relative;
  flex: none;
  inline-size: calc(var(--_h) + var(--_t));
  block-size: var(--_h);
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--cmp-switch-radius);
  background: var(--cmp-switch-track);
  color: var(--cmp-switch-thumb);
  outline: 1px solid transparent;
  outline-offset: -1px;
  cursor: pointer;
  transition:
    background-color var(--ds-motion-feedback-duration) var(--ds-motion-easing),
    border-color var(--ds-motion-feedback-duration) var(--ds-motion-easing);
}
.ds-switch__track::after {
  content: "";
  position: absolute;
  inset-inline: -1px;
  inset-block: calc((var(--_h) - var(--cmp-switch-target-min)) / 2 - 1px);
}
.ds-switch__thumb {
  position: absolute;
  inset-block-start: calc(var(--_inset) - 1px);
  inset-inline-start: calc(var(--_inset) - 1px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--_t);
  block-size: var(--_t);
  border-radius: calc(var(--cmp-switch-radius) - var(--_inset));
  background: var(--cmp-switch-thumb);
  color: var(--cmp-switch-ring);
  outline: 1px solid transparent;
  outline-offset: -1px;
  transition: transform var(--ds-motion-feedback-duration) var(--ds-motion-easing);
}
.ds-switch__track[data-state="checked"] {
  background: var(--cmp-switch-track-on);
  color: var(--cmp-switch-thumb-on);
}
.ds-switch__track[data-state="checked"] .ds-switch__thumb {
  background: var(--cmp-switch-thumb-on);
  transform: translateX(var(--_t));
}
.ds-switch__track[data-state="unchecked"]:hover:not([data-disabled]):not([aria-busy="true"]) {
  background: var(--cmp-switch-track-hover);
}
.ds-switch__track[data-state="checked"]:hover:not([data-disabled]):not([aria-busy="true"]):not(
    [aria-invalid="true"]
  ):not(:focus-visible) {
  border-color: var(--cmp-switch-edge-on-hover);
}
.ds-switch__track[data-state]:active:not([data-disabled]):not([aria-busy="true"]) {
  background: var(--cmp-switch-track-press);
}
.ds-switch__track[aria-invalid="true"]:not([data-disabled]) {
  border-color: var(--cmp-switch-edge-error);
}
.ds-switch__track:focus-visible {
  border-color: var(--ds-focus-ring);
  outline: 1px solid transparent;
  outline-offset: 0;
  box-shadow: var(--_focus-shadow-border);
}
.ds-switch__track[data-state="checked"]:focus-visible {
  box-shadow: var(--_focus-shadow-fill);
}
.ds-switch__track[aria-invalid="true"]:focus-visible {
  border-color: var(--cmp-switch-edge-error);
}
.ds-switch__track[aria-busy="true"] {
  cursor: progress;
}
.ds-switch__track[data-disabled] {
  background: var(--cmp-switch-track-disabled);
  color: var(--cmp-switch-thumb-disabled);
  cursor: not-allowed;
}
.ds-switch__track[data-disabled] .ds-switch__thumb {
  background: var(--cmp-switch-thumb-disabled);
}
.ds-switch__thumb > .ds-spinner__ring {
  inline-size: calc(var(--_t) - var(--ds-space-inline-sm));
  block-size: calc(var(--_t) - var(--ds-space-inline-sm));
}
@media (prefers-reduced-motion: reduce) {
  .ds-switch__track,
  .ds-switch__thumb {
    transition: none;
  }
}
```

The `:active` selector carries `[data-state]` on purpose: without it the hover rule beats it and a press off shows the hover look. The Switch hover and press rules set one property each, so neither can take away an edge set by invalid or focus.

## Builder table: CSS and markup per rule

<!-- prettier-ignore -->
| Rule | Markup | CSS | Notes for the play |
| --- | --- | --- | --- |
| `radio-api-1` | Root: Radix `RadioGroup.Root`, class `ds-radio-group`, with `data-size` and `data-layout`. Item: `<div class="ds-radio" data-disabled?>` holding the Radix item, class `ds-radio__control`, with Indicator `asChild` over `<span class="inline-flex"><RadioDotIcon className="size-4" fill="currentColor" /></span>` (`size-3` at sm, as DropdownMenu line 161), then `<div class="flex min-w-0 flex-col"><label class="ds-radio__label" htmlFor={id}>` and `<p class="ds-field__description" id={descriptionId}>`. A small context in `RadioGroup.tsx` hands `size` and the group's `disabled` to the item, for the icon and for `data-disabled` on the row | R1 | The item's `aria-describedby` is set only with a description. The description is outside the label, so a click on it does not select |
| `radio-forms-1` | One form, as above. No card, no variant prop | None beyond R1 | None |
| `radio-keys-1` | `orientation` becomes `data-layout` only. It is not passed to the Radix root, and no `aria-orientation` is set | `[data-layout="horizontal"]` in R1 | Both orientations run the same four arrow keys |
| `radio-invalid-1` | `aria-invalid="true"` and Radix `required` on the root only | The error rules in R1 read the root's `aria-invalid` | `expectEdgeInk` on the circle: use `left`, an integer edge. `top` is fractional (margin 3.6 px) |
| `field-group-1` | `group`: `<span id="{id}-label" class="ds-field__label">`, no `for`. Root takes `aria-labelledby`, `id`, `aria-describedby`, `disabled` from `useFieldControl` | None: `.ds-field__label` already styles a span | Row 1 asserts the tag `SPAN` |
| `field-row-1` | `data-orientation` on `.ds-field`. DOM order unchanged: label, description, control, error | R2 | Stories at 1440 need a width wrapper (D16) |
| `switch-api-1` | `<span class="ds-switch" data-size>` holding Radix `Switch.Root`, class `ds-switch__track`, holding Radix `Switch.Thumb`, class `ds-switch__thumb` | R3 | `aria-invalid` on the button, from `Field` or `invalid` |
| `switch-use-1` | None: `switch.yaml` routing | None | None |
| `switch-label-1` | No state word anywhere in the component | None | None |
| `switch-keys-1` | Radix handles Space and Enter; the `Field` label's `for` reaches the button. The description has no handler | `cursor: pointer` on the label in R2 | None |
| `switch-size-1` | As `switch-api-1` | `.ds-switch`, `.ds-switch__track`, `.ds-switch__thumb`, the transform rule and the reduced motion block of R3 | The transparent outlines stay at rest; the focus rule resets the offset. The travel is the thumb's `left` on minus off, as `transform` moves the box |
| `switch-save-1` | `<Spinner decorative />` as the thumb's child while `saving`; a sr-only `<span role="status">` beside the button inside `.ds-switch`, rendered only while saving, as Button does. `aria-busy` and `aria-disabled` on the button. When `disabled` is also set, render no ring, no status and no `aria-busy` | `.ds-switch__thumb > .ds-spinner__ring`, `[aria-busy="true"]` in R3 | `size.icon.*` does not set the ring (A1) |
| `control-tokens-1` | None | All of R1 and R3. `component.json` as the spec's table, less the two tokens of A1 | On `expectEdgeInk` for the track: read the side away from the thumb (`right` off, `left` on), or the fill between edge and thumb counts as ink. In `parameters.pseudo` the radio's hover target is `.ds-radio`, the row; the Switch's is the track |
| `control-shape-1` | None | `--cmp-radio-radius` reads `--ds-shape-round-radius`, on `{radius.full}` | Row 13 |
| `control-disabled-1` | `data-disabled` on `.ds-radio`, from the item's own `disabled` or the group's | The disabled rules of R1 and R3. No `opacity` | `.ds-radio-group` in the disabled selector is what makes it beat the checked rule |
| D22, D23 (`control-tokens-1`, `control-pairs-1`) | None | The two checked focus rules of R1. Rewrite the comment above the radio's focus rules (`recipes.css` line 753) to say a checked radio adds the inner line. `pairs.ts`: the two pairs of A7 | `expectFocusBorderForm` passes with and without these rules, so it cannot prove them: use `expectEdgeInk` with reach 2. A reach of 4 counts the halo as ink |
| D24 (`radio-api-1`) | None | The `.ds-radio-group:focus-visible` rule of R1 | Reach 6, not 4: at 4 the first pixel read is the halo and the check reads 0 px on the defect too |
| D25 (AC rows 8, 15) | None. No change to `.storybook/preview.tsx` | None | The `parameters.pseudo` of "Plays for D22 to D25". A story that forces `focusVisible` names `hover` in the same object |

### Plays for D22 to D25

These ran as written on the real package with the stories and the CSS overlaid in memory. `InteractionStates` and `InEnglish` share this `hover`:

```ts
// InteractionStates
pseudo: {
  rootSelector: "body",
  hover: [".ds-radio:has(#rg-hover)", ".ds-radio:has(#rg-hover-on)"],
  focusVisible: ["#rg-focus", "#rg-focus-on"],
},

// InEnglish: the same, with one more focusVisible selector
focusVisible: [
  "#rg-focus",
  "#rg-focus-on",
  "[data-testid='invalid-checked'] .ds-radio__control[data-state='checked']",
],

// InteractionStates play, after the existing lines
for (const id of ["rg-focus", "rg-focus-on"]) {
  await waitFor(() =>
    expect(getComputedStyle(circle(id)).boxShadow, id + " holds the halo").toMatch(/ 0px 0px 0px 3px$/),
  );
  await expect(circle(id)).not.toHaveFocus();
  await expect(getComputedStyle(circle(id)).borderTopColor).toBe(
    resolvedColor(circle(id), "--ds-focus-ring"),
  );
}
if (inVitest) {
  await expectEdgeInk(circle("rg-rest-on"), "left", 1, 2);
  await expectEdgeInk(circle("rg-focus-on"), "left", 2, 2);
}

// Disabled play, at the end
const group = canvas.getByRole("radiogroup", { name: w.label });
group.focus();
await expect(group.matches(":focus-visible")).toBe(true);
if (inVitest) await expectEdgeInk(group, "right", 0, 6);

// New story, before Required
export const InvalidChecked: Story = {
  parameters: {
    pseudo: {
      rootSelector: "body",
      hover: [".ds-radio-group > .ds-radio:first-child"],
      focusVisible: [".ds-radio__control[data-state='checked']"],
    },
  },
  render: () => <Access error defaultValue="members" />,
  play: async ({ canvasElement }) => {
    const on = within(canvasElement).getByRole("radio", { name: w.members });
    const off = within(canvasElement).getByRole("radio", { name: w.organization });
    await waitFor(() => expect(getComputedStyle(on).boxShadow).toMatch(/ 0px 0px 0px 3px$/));
    await expect(getComputedStyle(on).borderTopColor).toBe(
      resolvedColor(on, "--cmp-radio-border-error"),
    );
    await expect(
      getComputedStyle(on).boxShadow.startsWith(resolvedColor(on, "--cmp-radio-border-error")),
    ).toBe(true);
    await expect(on.querySelector("svg")).not.toBeNull();
    if (inVitest) {
      await expectEdgeInk(off, "left", 1, 2);
      await expectEdgeInk(on, "left", 2, 2);
    }
  },
};

// InEnglish: one more case after "invalid", and at the end of the play
["invalid-checked", { error: true, defaultValue: "members" }],

const on = within(canvas.getByTestId("invalid-checked")).getByRole("radio", { name: t.members });
await waitFor(() => expect(getComputedStyle(on).boxShadow).toMatch(/ 0px 0px 0px 3px$/));
await expect(
  getComputedStyle(on).boxShadow.startsWith(resolvedColor(on, "--cmp-radio-border-error")),
).toBe(true);
```

The `hover` of `InvalidChecked` is not only there for the rewrite: it holds D6, invalid wins over hover, on the first row.

Each play goes red on its defect. All 20 stories pass with the three rules. Without the two checked rules, `InteractionStates` (`draws 1 px of ink, expected 2 px`), `InvalidChecked` and `InEnglish` fail. Without the root rule, `Disabled` fails (`right edge of <div.ds-radio-group> draws 4 px of ink, expected 0 px`). Without the invalid rule, `InvalidChecked` and `InEnglish` fail. `InteractionStates` and `InvalidChecked` also passed alone with `--repeats 4`. These runs add the CSS through a style element, because `recipes.css` reaches the page through an `@import`, past the overlay. So `recipes.test.ts` has not run on these rules: the builder's run is that proof.

`settings-example-1`, outside the table's range but rendered: the Notifications panel is `<div class="flex flex-col gap-6" role="group" aria-labelledby={headingId}>` holding `<div class="flex flex-col gap-1"><h2 class="text-label-md text-text-primary" id={headingId}>` with `<p class="text-body-sm text-text-secondary">`, then the two `Field orientation="horizontal"`.

## Spec amendments this design needs (L-0019)

None of these changes the default of an open question. `spec.md` is outside this task's write set, so product takes them into v1.1 before the builder envelope, or the builder reads this section as the later word. A5 to A9 come from the rework of design 2 and go the same way into the next spec version. They add no token and keep every AC row number, so the "Rows per PR" line of PR 187 stands.

<!-- prettier-ignore -->
| # | Rule | Change | Why | Impact |
| --- | --- | --- | --- | --- |
| A1 | `control-tokens-1`, rows Size md and Size sm | Drop `switch.ring-size` and `switch.ring-size-sm`. The ring is the thumb less `space.inline.sm`: 16 at md, 12 at sm | `size.icon.xs` is 14 px, not 12, and no 12 px semantic size exists. A 14 px ring in a 16 px thumb leaves 1 px, so the thumb reads as a ring | Two fewer tokens in `component.json`. No new token, no pair and no AC row touched |
| A2 | `control-tokens-1`, last paragraph | On a Switch, on, focus reads `--_focus-shadow-fill`, not `--_focus-shadow-border`, with `color: switch.thumb-on` on the track | The border equals the fill, so the line would not show. It is the filled controls' form, as primary Button and the checked Checkbox. The inner line touches the thumb (border 1 px plus line 1 px is the 2 px inset), so the thumb joins the line while focused; I accepted this after the zoom shots | The computed shadow still ends in `0px 0px 0px 3px`, so `expectFocusBorderForm` passes |
| A3 | `switch-size-1` | The thumb's radius is `calc(switch.radius - inset)` | Concentric with the track. A thumb on the track's own 6 px leaves a gap that is uneven at the corners under professional | It still reads `shape.control.radius` through `switch.radius` |
| A4 | AC row 25, "User sees" | "pressed darkens the track" reads "pressed changes the track" | In dark `border.strong` is near white. The check, computed against rest, holds as written | Wording only; qa should read the row this way |
| A5 | `control-tokens-1`, last paragraph (D22, D23) | "both controls take the `focus.ring` border and the `--_focus-shadow-border` halo" gains: a checked radio adds a 1 px inner line through its own `--_inner`, in `focus.ring`, and in `radio.border-error` when the group is invalid | With border and halo alone the checked radio's line does not differ from rest (F1). It is a change of ink from the Checkbox's form, not of form | `recipes.css` only. The shadow still ends in `0px 0px 0px 3px`. No token |
| A6 | AC row 8, "User sees" and "Check"; AC row 15 | Row 8 sees: the focus rows hold the brand line with its halo at rest, the checked one twice the width of the rest row, its dot kept. Row 8 checks: `parameters.pseudo` with `focusVisible` beside `hover`, the held look read inside `waitFor`, `not.toHaveFocus`, `expectEdgeInk` left 1 px against 2 px at reach 2. `expectFocusBorderForm` stays for the real focus path. Row 15: `InEnglish` holds the same two rows | `expectFocusBorderForm` focuses and then blurs, so on its own it passes with the defect and says nothing of the rows at rest (F1, F3) | `RadioGroup.stories.tsx` only. Row 25 of the Switch keeps its wording until the Switch PR |
| A7 | `control-pairs-1`, `radio` list; AC row 19 | Two more pairs at the UI floor: `ds:focus.ring` on `radio.bg-checked` (lowest 3.33, friendly light) and `radio.border-error` on `radio.bg-checked` (lowest 5.79). Both read over the eight boundaries of `CONTRAST_SETS` | The inner line sits on the checked ground, a pair no rule covered. `pairs.ts` lines 306 to 310 are the precedent for `ds:focus.ring` on a selected fill | `pairs.ts`, `recipes.test.ts`, `pnpm contrast`. No token |
| A8 | `radio-api-1`; AC row 4, "Check" | `radio-api-1` gains: the root draws no focus, focus shows on a radio only. Row 4's play adds the root check of D24 | F2. The rule belongs to the component, whatever story shows it | `recipes.css`, `RadioGroup.stories.tsx`. `DESIGN.md` is unchanged: section 7's "never removed" speaks of controls |
| A9 | AC rows 6, 15 and 20 | Row 6 adds the story `InvalidChecked` and its play. Row 15's list adds the `invalid-checked` case. Row 20's list adds `InvalidChecked` | D23 is a state of its own, and `.claude/rules/design-system.md` asks for each state as a story, in Thai and English | `RadioGroup.stories.tsx`, the qa walk of rows 6, 15 and 20 |

## Screens to check in visual QA

Sign-off follows rows 20 and 39 on the real stories, with Thai and English, and uses this list against the proposal shots.

1. `Base/Radio group`: `Default`, `Checked`, `InteractionStates`, `Invalid`, `InvalidChecked`, `Disabled`, `Sizes`, `Horizontal`, `HorizontalAt360`, `LongContentAt360`, `RoundUnderProfessional`.
2. `Base/Switch`: `Default`, `Sizes`, `InteractionStates`, `Disabled`, `Invalid`, `Saving`, `SaveFails`, `Bare`, `LongContentAt360`.
3. `Base/Field`: `GroupControl`, `Horizontal`, `HorizontalInvalid`.
4. `Examples/Base: Settings form`: `Default`, `Invalid`, `Saving`, `Notifications`, `NotificationsAt360`.

Look for:

- The circle and the track centred on the first line at every line count, Thai and Latin.
- A checked radio and an on Switch beside the Checkbox under friendly: the coral and teal split is expected until the Checkbox card lands.
- The ring legible on both thumbs, light and dark, at sm.
- Hover on an invalid or a focused Switch: the edge does not change.
- No clipped Thai mark in `ปิ่นโต้` and the long labels. The break inside โปรเจกต์ is a dictionary matter, not a finding.
- A checked radio under focus: one 2 px line in `focus.ring` in every profile, in light and dark, at md and sm, the dot kept and not touching the line (D22). In `InvalidChecked`, one 2 px red line, with the halo in the brand (D23).
- `InteractionStates` and `InEnglish`: both focus rows show the look at rest with no click (D25).
- `Disabled` and `DisabledItem` as their plays leave them, and a click on a description then a key in `Default` and the settings form: no band round the group (D24).

## Rework screenshots, design 2

Folder: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-2/`. It is a session scratchpad, so these files may not outlive the session.

These are the real stories at `023cb9c` in Storybook, with the R1 rules put in by `page.addStyleTag`. Each scene reached its state this way: the `*-focus` scenes by a real Tab, `invalid-focus` by Tab then Space; `disabled-rest` and `disabled-item-rest` as their plays leave them; `default-click` and `settings-click` by a real click on a description and then a key; `interaction` and `english` through the `updateGlobals` channel event with the pseudo object, because the stories at this head do not name `focusVisible`. `interaction-before` and `disabled-*-before` show the head as built. The `english` scene is the `InEnglish` story; every other scene is Thai. The `invalid-checked` case of `InEnglish` is proven by its play, not by a screenshot.

Names: `crops/<scene>-<profile>-<mode>-<width>.png` and `shots/` for the full pages, 18 capture scenes in eight boundaries: `neutral` and `professional`, `light` and `dark`, `360` and `1440`, device scale 2. The scenes `default-click-back` and `settings-click-back` are Tab then Shift+Tab after a click. The comparison sheets add `friendly`.

The PNGs were judged through the sheets below, not one file at a time. In `sheet-disabled-rest*.png` and `sheet-disabled-item-rest*.png` the 1440 cells are small, so the band there was also read as a computed shadow in all eight boundaries. The white strip beside a 360 cell is the sheet's column, not the render.

<!-- prettier-ignore -->
| Sheet | Shows | Path |
| --- | --- | --- |
| Contact sheet | The F1 comparison and the invalid forms on top, then every scene in its eight boundaries | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-2/contact-sheet.png` |
| F1 forms, md | Rest, today, F1a dot ink, F1b `focus.ring`, device scale 6 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-2/f1-compare/sheet-md-x6.png` |
| F1 forms, sm | The same, device scale 6 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-2/f1-compare/sheet-sm-x6.png` |
| F1 forms, md, real pixels | The same, device scale 1, enlarged | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-2/f1-compare/sheet-md-x1.png` |
| F1 forms, sm, real pixels | The same, device scale 1, enlarged | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-2/f1-compare/sheet-sm-x1.png` |
| Checked and invalid forms | Today, dot line, ring line, error line | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-2/f1-invalid/sheet-invalid.png` |
| Focus, per scene | `sheet-default-focus.png`, `sheet-sizes-md-focus.png`, `sheet-sizes-sm-focus.png`, `sheet-long-focus.png`, `sheet-horizontal-focus.png`, `sheet-settings-focus.png`, `sheet-invalid-focus.png` | The folder above |
| Root band, per scene | `sheet-disabled-rest-before.png`, `sheet-disabled-rest.png`, `sheet-disabled-item-rest-before.png`, `sheet-disabled-item-rest.png` | The folder above |
| After a click, per scene | `sheet-default-click.png`, `sheet-default-click-tab.png`, `sheet-default-click-back.png`, `sheet-settings-click.png`, `sheet-settings-click-tab.png`, `sheet-settings-click-back.png` | The folder above |
| Held rows, per scene | `sheet-interaction-before.png`, `sheet-interaction.png`, `sheet-english.png` | The folder above |
| Forced colours | Rest and focus, neutral, light and dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-2/sheet-forced.png` |

## Proposal screenshots

Folder: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/`. It is a session scratchpad, so these files may not outlive the session. The sign-off makes its own screenshots from the real stories.

Names: `<scene>-<profile>-<mode>-<width>.png` in that folder, Thai.

- Scenes `radio`, `switch`, `compare`, `settings-general`, `settings-notifications`: profiles `neutral` and `professional`, modes `light` and `dark`, widths `360` and `1440`.
- Scenes `compare` and `settings-general` also under `friendly`, for Q1.

<!-- prettier-ignore -->
| Sheet | Path |
| --- | --- |
| Contact sheet, all scenes | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/contact-sheet.png` |
| RadioGroup | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/sheet-radio.png` |
| Switch | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/sheet-switch.png` |
| Open questions 1, 3, 4, 5 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/sheet-compare.png` |
| Settings form, general | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/sheet-settings-general.png` |
| Settings form, notifications | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/sheet-settings-notifications.png` |
| Zoom, neutral light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/zoom-neutral-light.png` |
| Zoom, neutral dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/zoom-neutral-dark.png` |
| Zoom, professional light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/zoom-professional-light.png` |
| Zoom, professional dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/zoom-professional-dark.png` |
| Zoom, friendly light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/zoom-friendly-light.png` |
| Zoom, friendly dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/zoom-friendly-dark.png` |
| Forced colours | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/zoom-forced-neutral-light.png` |
| Long Thai, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-221-design-1/crop-radio-360-long.png` |
