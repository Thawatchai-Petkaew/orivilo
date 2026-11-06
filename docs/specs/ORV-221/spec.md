---
issue: ORV-221 (https://tpetkaew.atlassian.net/browse/ORV-221)
lane: L, from the envelope fact (not read in Jira in this role); a new component public API is an L-lane risk flag (AGENTS.md, "Lanes and gates"), so G1 and G2 apply, passed by Claude under the owner's delegation during the POC (ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.3 row 18 ("RadioGroup and Switch")
version: 1.1
---

# ORV-221: RadioGroup and Switch (base)

## Benchmark

The comparison table in the form of `docs/specs/ORV-64/audit.md` section B, one per component, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247). The Untitled UI and shadcn/ui cells are from K-0144 to K-0156 through the synthesis K-0157 (read 2026-11-06). The Ours row is the code on this branch. The Add and Do not copy rows are this spec's choices over K-0157's candidates: each candidate is taken or refused here, and each points to the rule in "Rules" that holds it.

### RadioGroup

<!-- prettier-ignore -->
| Item        | Detail |
| ----------- | ------ |
| Untitled UI | <https://www.untitledui.com/react/components/radio-buttons> (K-0144), <https://www.untitledui.com/react/components/radio-groups> (K-0145). Variants: `RadioGroup` of `RadioButton`; a separate card set: Icon simple, Icon card, Avatar, Payment icon, Radio button, Checkbox. Sizes: sm (default), md; the group's size wins. States: selected, focus-visible, disabled at 50% opacity with a not-allowed cursor; no hover rule and no invalid or required state read. Slots: `label`, `hint` (a click on the hint does not select); card `items` with title, description, icon, avatar or logo. Group name: no visible label, `aria-label` or `aria-labelledby`. Keyboard: React Aria, Tab and arrows. |
| shadcn/ui   | <https://ui.shadcn.com/docs/components/radix/radio-group> (K-0147). Parts: `RadioGroup`, `RadioGroupItem`. Sizes: no size prop; item `size-4`. Examples: Description, Choice Card, Fieldset, Disabled, Invalid, RTL. States: focus-visible ring, `aria-invalid` on each item with `data-invalid` on `Field`, disabled at `opacity-50`. Slots: none; text comes from `Field` parts around each item, wired by hand (K-0149). Group name: `FieldSet` and `FieldLegend`, with no `aria-label` or `aria-labelledby` on the group (K-0149). |
| Ours        | No RadioGroup: `coverage.md` line 18 reads none, and the catalog has no radio entry. `DESIGN.md` section 6 routes a short list where all options show to it, 6 or more options to Select. Near pieces: `DropdownMenuRadioGroup` (menu only); `ToggleGroup` single; `RadioDotIcon`; `Checkbox` (sizes sm, md; own label, description and error; `checkbox.target-min`); `Field` with `useFieldControl` (id, describedBy, invalid, required, disabled). `Field` renders `label htmlFor`, which cannot reach the Radix `div` root (K-0151, K-0156). |
| Add         | Taken: a visible group label tied with `aria-labelledby` (K-0153, K-0155, K-0156): `field-group-1`. `aria-describedby` on the group and on an item for help text (K-0153): `field-group-1`, `radio-api-1`. `aria-invalid` and `aria-required` on the group (K-0151, K-0155): `radio-invalid-1`. A description line per item (K-0144, K-0147): `radio-api-1`. Disable on the group and on one item (K-0150, K-0151): `radio-api-1`, `control-disabled-1`. `orientation` (K-0150), as layout only: `radio-keys-1`. Sizes sm, md (K-0144): `radio-api-1`. Story tests on every arrow key and on Enter (K-0151, K-0153): `radio-keys-1`. Refused for now: the choice card (K-0145, K-0147), because no screen needs it: `radio-forms-1`. |
| Do not copy | `aria-invalid` on each item: deprecated on radio in ARIA 1.2, supported on radiogroup (K-0147, K-0149, K-0155): `radio-invalid-1`. A group with no name of its own: radiogroup requires an accessible name (K-0149, K-0155): `field-group-1`. Disabled by opacity: `DESIGN.md` section 7 asks for reduced contrast of 3.0 or more and recipes read tokens (K-0144, K-0147): `control-disabled-1`. `bg-brand-solid` as the selected fill: AGENTS.md says brand accent never replaces selection semantics (K-0144): `control-tokens-1`. A circle with no text: radio requires an accessible name (K-0144, K-0155): `radio-api-1`. `RadioGroupCheckbox`: a checkbox look on a one-of choice, and `checkbox.yaml` line 12 routes exactly one of a list here (K-0145): `radio-forms-1`. Avatar and Payment icon forms: D.3 row 18 does not name them (K-0145): `radio-forms-1`. `unstable_` parts: the docs warn the API may change (K-0150, K-0151): `no-unstable-1`. Enter to select: APG lists it only as optional in a toolbar, and Radix blocks it (K-0151, K-0153): `radio-keys-1`. |

### Switch

<!-- prettier-ignore -->
| Item        | Detail |
| ----------- | ------ |
| Untitled UI | <https://www.untitledui.com/react/components/toggles> (K-0146). Variants: base, slim, where the thumb is as high as the track and has a border. Sizes: sm (default), md. States: on, on plus hover, focus-visible, disabled at `opacity-50`; no rule for hover when off; no invalid, required or loading state named. Slots: `label` (a string, clicks toggle), `hint` (a click does not flip). `ToggleBase` is a graphic with no behaviour. Name: `aria-label` when no text shows. Form: `name`, `value`. |
| shadcn/ui   | <https://ui.shadcn.com/docs/components/radix/switch> (K-0148). One component. Sizes: `sm`, `default` (default), not listed on the page. Examples: Description, Choice Card, Disabled, Invalid, Size, RTL. States: focus-visible ring; `aria-invalid` on `Switch` with `data-invalid` on `Field`; disabled at `opacity-50` with `data-disabled` on `Field`. Slots: none; `Field` parts around it, wired with `id` and `htmlFor`, in a `Field orientation="horizontal"` (K-0149). The invalid example has no `FieldError` (K-0149). |
| Ours        | No Switch: `coverage.md` line 19 reads none, and the catalog has no switch entry. `DESIGN.md` section 6 routes an on/off setting that applies immediately to it, with "Save feedback and error recovery" to check, and an on/off applied on submit to Checkbox. `dropdown-menu.yaml` line 22: no switch indicator in a menu. The names `toggle.*` and `ds-toggle` are ToggleGroup's (`pairs.ts` lines 694 to 718). `Field`'s label can reach the Radix `button` (K-0152, K-0156), but `Field.tsx` line 63 and `field.yaml` line 8 name Input, Textarea and Select as its controls. `settings-form.tsx` has neither control; its notifications tab holds `fixtures.missingLabel` (lines 152 to 154). |
| Add         | Taken: two sizes (K-0146, K-0148): `switch-api-1`, `switch-size-1`. Label and description tied by `aria-describedby` (K-0146, K-0149, K-0154): `field-row-1`. `name`, `value`, `required` from Radix (K-0152): `switch-api-1`. A set of switches as role group with `aria-labelledby` (K-0154): `settings-example-1`. Story tests on Space and Enter (K-0152, K-0154): `switch-keys-1`. A saving and a failed state, which `DESIGN.md` section 6 asks for and no page read gives: `switch-save-1`. |
| Do not copy | A label that changes with the state: APG calls a fixed label critical (K-0154): `switch-label-1`. A mixed state: APG says binary only, Radix has two states, ARIA 1.2 treats mixed as false (K-0152, K-0154, K-0155): `switch-api-1`. The "Accept terms" invalid Switch: `checkbox.yaml` line 9 routes a single consent line to Checkbox (K-0149): `switch-use-1`. No hover when off: `DESIGN.md` section 7 gives every interactive control a hover change (K-0146): `state-set-1`. Disabled by opacity and a brand fill, as for RadioGroup (K-0146, K-0148): `control-disabled-1`, `control-tokens-1`. `ToggleBase` props for hover and focus: `DESIGN.md` section 7 keeps those states out of public props (K-0146): `switch-api-1`. Error text in `FieldDescription`: our `Field` has `error` with `role="alert"` (K-0149): `field-row-1`. Slim form: D.3 row 18 does not name it (K-0146): `switch-api-1`. `unstable_` parts (K-0152): `no-unstable-1`. |

## Goal

ORIVILO's settings screens need two controls the design system does not have: pick one of a short list with every option in view, and turn a setting on or off with immediate effect (`DESIGN.md` section 6). Today a form falls back on a Select or a Checkbox for both. This story gives the design system `RadioGroup` and `Switch`, each with every state of `DESIGN.md` section 7 that applies, wired through `Field` as audit D.3 row 18 asks, and shows both in the settings form example.

Honest about what is real: both components render real markup and behaviour. The Switch saves nothing by itself: the caller owns the request. The saving and failed stories simulate a save with a fixture, and the settings form example still saves nothing, as its comment says.

## Story

As a person changing workspace settings, I see every choice at once and pick one with mouse or keyboard, and I flip a setting and see whether it took, so I know what the workspace does now and can try again when a save fails.

## Rules

### radio-api-1

`RadioGroup` and `RadioGroupItem` are new public components (`src/components/radio-group/RadioGroup.tsx`), exported from `src/components/index.ts`, with the contract types `RadioGroupProps` and `RadioGroupItemProps`, on the Radix radio group of `radix-ui` (1.5.1, K-0151).

`RadioGroupProps`:

- `value`, `defaultValue`, `onValueChange`, `name`, `required`, `disabled`, `id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `className` (layout only), `children`.
- `size`: `sm`, `md` (default). The group's size wins and an item has no size prop (K-0144).
- `orientation`: `vertical` (default), `horizontal` (`radio-keys-1`).
- `invalid`: sets the error look when no `Field` does (`radio-invalid-1`).

`RadioGroupItemProps`: `value`, `label` (required), `description`, `disabled`, `id`, `className` (layout only).

An item renders the Radix item as the circle, `RadioDotIcon` in its indicator, a real `<label htmlFor>` that is part of the hit area, and the description tied by `aria-describedby`. A click on the description does not select (K-0144). The circle alone is never the control (K-0155, as `CheckboxProps.label`). The label and description follow the choice row of `DESIGN.md` section 4 and read `ds-field__description` as Checkbox does. The circle centres on the first line of its label, as `.ds-checkbox__box` does.

### radio-forms-1

One form: the circle with its label and description. No card form, no checkbox look (`checkbox.yaml` line 12), no Avatar or Payment icon form (K-0145): D.3 row 18 names none of them and no screen needs one.

### radio-keys-1

Keyboard behaviour comes from Radix (K-0151) and meets the APG pattern outside a toolbar (K-0153):

- Tab and Shift + Tab move focus into and out of the group. Focus lands on the checked radio, or on the first radio when none is checked.
- Space checks the focused radio.
- ArrowDown and ArrowRight move to the next radio, ArrowUp and ArrowLeft to the previous one. Each checks the radio it reaches and wraps at the ends. A disabled radio is skipped.
- Enter does nothing (K-0151).

The `orientation` prop sets `data-layout` for the recipe and is not passed to the Radix root. Radix hands it to roving focus, and `getFocusIntent` then drops two of the four arrows (`@radix-ui/react-roving-focus` 1.2.1, `dist/index.mjs` lines 227 to 236, worked example W2), which breaks the APG rule above. K-0151 read `ARROW_KEYS` only; this is that reading's missing half. `loop` stays at its default. No `aria-orientation` is set: the APG page does not name it (K-0153).

### radio-invalid-1

`aria-invalid` sits on the group root only, never on an item (K-0155). It comes from `Field`'s `error` through `useFieldControl`, or from `invalid`. In that state every circle takes the error edge of `control-tokens-1`. `aria-required` sits on the group through Radix `required` (K-0151), from `Field`'s `required` or the group's own prop, and never on an item (K-0155).

### field-group-1

`FieldProps` gains `group`, a boolean. With `group`, `Field` renders its label as `<span id="{id}-label" class="ds-field__label">` with no `for`, because `for` cannot reach a `div` (K-0156). `FieldControlProps` gains `labelId`, set only with `group`, and `useFieldControl` returns it as `labelledBy`. The RadioGroup root takes `aria-labelledby` from its own prop, else from `labelledBy`, and `id`, `aria-describedby` and `disabled` from `useFieldControl`.

A RadioGroup outside a `Field group` needs `aria-label` or `aria-labelledby` (K-0153, K-0155, `field.yaml` line 11). No `fieldset` and `legend`: no source read says a legend names a role radiogroup `div` (K-0157, open point 3), and `aria-labelledby` is the form K-0153 states. Without `group`, `Field`'s markup is unchanged.

### field-row-1

`FieldProps` gains `orientation`: `vertical` (default), `horizontal`, set as `data-orientation`. Horizontal puts the label and the description in the first column, the control at the inline end of the first line, and the error under both, with the DOM order unchanged. The shape is shadcn's `Field orientation="horizontal"` (K-0149), with the wiring ours. The label keeps `for`, which reaches the Radix `button` (K-0152, K-0156). The error stays `Field`'s `error` with `role="alert"`, never the description (K-0149).

### switch-api-1

`Switch` is a new public component (`src/components/switch/Switch.tsx`), exported from `src/components/index.ts`, with the contract type `SwitchProps`, on the Radix switch of `radix-ui` (1.4.1, K-0152).

- `checked` (boolean), `defaultChecked`, `onCheckedChange`, `name`, `value`, `required`, `disabled`, `id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `className` (layout only).
- `size`: `sm`, `md` (default).
- `invalid`: sets the error look when no `Field` does.
- `saving`, `savingLabel`: `switch-save-1`.

No `label` prop: the name comes from `Field`'s label, or from `aria-label` or `aria-labelledby` where a table header or a row names it (K-0146, K-0154, `field.yaml` line 11). It reads `useFieldControl` for id, description, invalid, required and disabled. Two states only, no mixed (K-0152, K-0154, K-0155). No slim form (K-0146). No public prop for hover or focus (`DESIGN.md` section 7).

### switch-use-1

The catalog entry routes an on/off setting that applies immediately to Switch (`DESIGN.md` section 6). An on/off applied on submit and a single consent line go to Checkbox (`checkbox.yaml` lines 8 and 9), so no story shows a Switch as consent (K-0149). A menu item goes to a checkbox item (`dropdown-menu.yaml` line 22).

### switch-label-1

The label names the setting and never changes with the state (K-0154). Neither the component nor a story prints the current state as a word.

### switch-keys-1

Space and Enter toggle a focused Switch (K-0152, K-0154). A click on the label toggles it; a click on the description does not (K-0146).

### switch-size-1

The geometry comes from the size tokens of `control-tokens-1`: the track is as high as the height token, as wide as the height plus the thumb, and the thumb travels its own width (worked example W1). The track reads `switch.radius` and the thumb `calc(switch.radius - inset)`, concentric with the track so the gap stays even at the corners, and a profile's control shape still reaches both through `shape.control.radius` (W1). The thumb slides over `motion.feedback.duration`, and a `prefers-reduced-motion: reduce` rule in the recipe removes that transition. Track and thumb carry a transparent outline so they stay visible in forced colours, as ORV-201 design.md D13 does for Skeleton.

### switch-save-1

A setting that applies immediately can fail, so Switch has a saving state and leaves the failure to `Field` (open question 3).

- The Switch makes no request. The caller owns the save and passes `checked` as controlled state.
- With `saving`: a decorative `Spinner` sits in the thumb, the button has `aria-busy` and `aria-disabled`, a visually hidden `role="status"` beside the button holds `savingLabel` or the catalog key `switch.saving`, and a click is stopped with `preventDefault`. Radix's `composeEventHandlers` then skips the toggle (`react-switch` 1.4.1 `dist/index.mjs` line 104), for a pointer, the label, Space and Enter alike. The native `disabled` stays off, so focus stays on the Switch, as Button's loading state does (`Button.tsx` lines 60 to 68 and 81 to 96).
- On failure the caller sets `checked` back to the old value, ends `saving`, and gives `Field` an `error` that says what went wrong and how to fix it. The next toggle is the retry, and the caller clears the error when it starts.
- On success `saving` ends and the thumb stays where it is. The component shows no tick and no saved word: it has no backing data for one (AGENTS.md).
- `disabled` wins over `saving`.

### control-tokens-1

What each state reads, as new component tokens over existing semantic tokens. A checked radio and an on switch read the selection tokens (open question 1): `DESIGN.md` section 7 gives selected to `surface.selected` and `selection.fg`, section 8 sets `action.primary` apart from a selection fill, and audit B.4 says checked uses selection tokens. The dot and the thumb's place carry the state too, so it never rests on colour alone.

<!-- prettier-ignore -->
| State | RadioGroup item | Switch |
| --- | --- | --- |
| Rest | `radio.bg` (`surface.card`), `radio.border` (`border.control`) | `switch.track` (`border.control`), `switch.thumb` (`surface.card`) |
| Hover | `radio.border-hover` (`border.control-hover`) | `switch.track-hover` (`border.control-hover`) |
| Checked or on | `radio.bg-checked` (`surface.selected`), `radio.border-checked` (`selection.fg`), `radio.dot` (`selection.fg`) | `switch.track-on` (`selection.fg`), `switch.thumb-on` (`selection.bg`) |
| Hover while checked or on | `radio.border-checked-hover` (`border.strong`) | `switch.edge-on-hover` (`border.strong`) |
| Pressed | Not applicable (`state-set-1`) | `switch.track-press` (`border.strong`) |
| Invalid | `radio.border-error` (`border.error`) | `switch.edge-error` (`border.error`) |
| Disabled | `radio.bg-disabled` (`surface.disabled`), `radio.border-disabled` (`border.disabled`), `radio.dot-disabled` (`text.secondary`) | `switch.track-disabled` (`surface.disabled`), `switch.thumb-disabled` (`text.secondary`) |
| Saving | Not applicable (`state-set-1`) | `switch.ring` (`selection.fg`) |
| Size md | `radio.size` (`size.icon.md`) | `switch.height` (`size.icon.lg`), `switch.thumb-size` (`size.icon.md`) |
| Size sm | `radio.size-sm` (`size.icon.sm`) | `switch.height-sm` (`size.icon.md`), `switch.thumb-size-sm` (`size.icon.sm`) |
| Target | `radio.target-min` (`size.icon.lg`) | `switch.target-min` (`size.icon.lg`) |
| Shape | `radio.radius` (`shape.round.radius`, new) | `switch.radius` (`shape.control.radius`) |
| Text and space | `radio.label-type` (`type.body.md`), `radio.label-type-sm` (`type.body.sm`), `radio.gap` (`space.inline.md`), `radio.group-gap` (`space.stack.sm`) | None: the text is `Field`'s |

The saving ring has no size token: it is the thumb less `space.inline.sm`, 16 at md and 12 at sm, a 2 px margin at both (W1). No 12 px semantic size exists, and `size.icon.xs`, 14 px, would leave 1 px in the sm thumb, which then reads as a ring.

Focus adds no token to this table: both controls take the `focus.ring` border and the `--_focus-shadow-border` halo, as `.ds-checkbox__box` does (`recipes.css` lines 619 to 634), and an invalid edge stays red under focus. An on Switch reads `--_focus-shadow-fill` instead (`orivilo.css` line 43), with `color: switch.thumb-on` on the track, because its border equals its fill and the line alone would not show. That is the filled controls' form: primary Button reads the same property (`recipes.css` lines 183 to 187), and a checked Checkbox draws the same inner line through its own `--_inner` (lines 627 to 631). While focused the inner line touches the thumb, since border and line together fill the 2 px inset (design.md A2). `sm` keeps a target of `*.target-min` around the control, as `checkbox.target-min` does.

### control-shape-1

A radio is round in every profile, because a rounded square reads as a checkbox. `shape.control.radius` is 6 px under Professional (`src/profiles/source/professional.json` line 348), and `clip-path: circle(50%)`, the ORV-201 answer (design.md D11), would clip the focus halo. So `radio.radius` reads a new semantic token `shape.round.radius` on `{radius.full}`, which no profile overrides (open question 4).

### control-disabled-1

Disabled reads the tokens of `control-tokens-1`, never `opacity`. A disabled group disables each item, and one item can be disabled alone. A disabled label reads `text.disabled` and the cursor is `not-allowed`, as `.ds-checkbox[data-disabled]` does.

### state-set-1

The states of `DESIGN.md` section 7, all twelve rows, and where each lands. Each applicable state is a story.

<!-- prettier-ignore -->
| Section 7 state | RadioGroup | Switch |
| --- | --- | --- |
| default | `Default`, `NoValue` | `Default` |
| hover | `InteractionStates` | `InteractionStates`, off and on |
| focus-visible | `InteractionStates` | `InteractionStates`, off and on |
| active/pressed | Not applicable: section 7 names buttons and toggles, and a radio shows checked at once | `InteractionStates`, off and on |
| disabled | `Disabled`, `DisabledItem` | `Disabled`, off and on |
| loading | Not applicable: a radio applies on submit, and the form's button carries the loading state | `Saving`, `SaveFails` (`switch-save-1`) |
| selected | `Checked` | `Default` after the toggle, `Sizes` |
| invalid/error | `Invalid` | `Invalid`, `SaveFails` |
| empty | Not applicable: a group with no option is not rendered | Not applicable: section 7 names lists, tables and pickers |
| read-only | Not applicable: section 7 names inputs; a choice nobody may change is `disabled` | Not applicable, same reason |
| dark mode | `RecipesAndModes` | `RecipesAndModes` |
| profile B | `RecipesAndModes`, `RoundUnderProfessional` | `RecipesAndModes` |

### no-unstable-1

Neither component uses a Radix part prefixed `unstable_` (K-0150, K-0151, K-0152).

### settings-example-1

`src/examples/settings-form.tsx` shows both controls, with fixture content and nothing saved:

- General tab: a `Field group` with a RadioGroup of the three access options, after the default profile Select and before the Checkbox. `errors` gains `access`, shown on the Field. `saving` disables the group.
- Notifications tab: replaces `fixtures.missingLabel` (lines 152 to 154) with a `role="group"` tied by `aria-labelledby` to a heading (K-0154), the help line, and two `Field orientation="horizontal"` each holding a Switch. Each flips locally; the proof of saving and failure lives in the `Base/Switch` stories.
- The members tab is unchanged.

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| --- | --- | --- |
| `RadioGroup`, `RadioGroupItem`, `RadioGroupProps`, `RadioGroupItemProps` (`radio-api-1`) | Component API | New exports in `src/components/index.ts`; new `catalog/base/radio-group.yaml` (story `base-radio-group`, title `Base/Radio group`, status `draft`); `coverage.md` line 18 |
| `Switch`, `SwitchProps` (`switch-api-1`) | Component API | New export in `src/components/index.ts`; new `catalog/base/switch.yaml` (story `base-switch`, status `draft`); `coverage.md` line 19 |
| `FieldProps.group`, `FieldProps.orientation`, `FieldControlProps.labelId`, `useFieldControl` returns `labelledBy` (`field-group-1`, `field-row-1`) | Component API, additive | `Field.tsx` (with the comment at line 63); `field.yaml` (lines 8 and 10, a rule and an a11y line for each prop); `Field.stories.tsx`. The readers of `useFieldControl` are unchanged: Input, PasswordInput, InputGroup, Textarea, Select |
| Semantic token `shape.round.radius` (`control-shape-1`) | Semantic token | `semantic.json`, regenerated `generated.css`; `DESIGN.md` section 3.3 Radius row; no profile file changes; `tokens.test.ts`, `profiles.test.ts` |
| Component token groups `radio.*` and `switch.*` (`control-tokens-1`) | Component token | `component.json`, regenerated `generated.css` (`pnpm --filter @orivilo/design-system tokens`). Neither group exists today; `toggle.*` stays ToggleGroup's |
| Recipe classes `ds-radio-group`, `ds-radio`, `ds-radio__control`, `ds-radio__label`, `ds-switch`, `ds-switch__track`, `ds-switch__thumb`, and `.ds-field[data-orientation="horizontal"]` | Recipe | `recipes.css`; `recipes.test.ts` checks every value is a `--cmp-*` or `--ds-*` property |
| Colour pairs (`control-pairs-1`) | Recipe | `src/recipes/pairs.ts`; `recipes.test.ts` and `pnpm contrast` |
| Locale key `switch.saving` | Copy | `src/i18n/messages/th.ts` and `en.ts`; `check-i18n` |
| Fixtures `radioFixtures` and `switchFixtures` (table "Copy") | Test data | `src/components/fixtures.ts` |
| `SettingsFormProps.errors.access` (`settings-example-1`) | Example | `settings-form.tsx`, `settings-form.stories.tsx` (the `Invalid` play counts three alerts; the docs line 13 names both controls); `catalog/base/radio-group.yaml` and `switch.yaml` name the example |
| Design contract text | Docs | `DESIGN.md` section 4 (choice row names the radio item), section 12 (what is real), version line; `checkbox.yaml` is unchanged |

Not changed: Checkbox and its `checkbox.bg-checked`, ToggleGroup, DropdownMenu, Spinner.

### control-pairs-1

`pairs.ts` lists these, each at the UI floor. `field.label` on `ds:surface.canvas` is already a text pair.

- `radio`: `radio.border` on `radio.bg` and on `ds:surface.canvas`; `radio.border-checked` on `ds:surface.canvas` and on `ds:surface.card`; `radio.dot` on `radio.bg-checked`; `radio.border-error` on `radio.bg`; `radio.dot-disabled` on `radio.bg-disabled`.
- `switch`: `switch.track` and `switch.track-on` on `ds:surface.canvas` and on `ds:surface.card`; `switch.thumb` on `switch.track`, on `switch.track-hover` and on `switch.track-press`; `switch.thumb-on` on `switch.track-on` and on `switch.track-press`; `switch.edge-error` on `ds:surface.canvas` and on `ds:surface.card`; `switch.thumb-disabled` on `switch.track-disabled`; `switch.ring` on `switch.thumb` and on `switch.thumb-on`.

`selection.fg` as a fill clears the floor with a wide margin (worked example W3), and `selection.fg` with `selection.bg` is already held at 4.5 (`DESIGN.md` section 3.1).

### Copy

<!-- prettier-ignore -->
| Key or fixture | Thai | English |
| --- | --- | --- |
| `switch.saving` (catalog) | กำลังบันทึก | Saving |
| `radioFixtures.label` | ใครเข้าเวิร์กสเปซนี้ได้ | Who can open this workspace |
| `radioFixtures.help` | มีผลกับทุกโปรเจกต์ในเวิร์กสเปซนี้ | Applies to every project in this workspace |
| `radioFixtures.members` | เฉพาะสมาชิก | Members only |
| `radioFixtures.membersHelp` | คนที่ทีมเชิญเท่านั้น | Only people the team invited |
| `radioFixtures.organization` | ทุกคนในองค์กร | Everyone in the organization |
| `radioFixtures.organizationHelp` | ทุกคนที่ใช้อีเมลขององค์กร | Anyone with an organization email |
| `radioFixtures.link` | ทุกคนที่มีลิงก์ | Anyone with the link |
| `radioFixtures.linkHelp` | ใครก็ตามที่ได้รับลิงก์นี้ | Anyone who receives this link |
| `radioFixtures.error` | เลือกว่าใครเข้าเวิร์กสเปซนี้ได้ก่อนบันทึก | Choose who can open this workspace before you save |
| `switchFixtures.setLabel` | อีเมลแจ้งเตือน | Email notifications |
| `switchFixtures.setHelp` | การเปลี่ยนแปลงในหน้านี้มีผลทันที ไม่ต้องกดบันทึก | Changes here apply right away, with no need to save |
| `switchFixtures.comments` | แจ้งเตือนเมื่อมีความเห็นใหม่ | Notify me about new comments |
| `switchFixtures.commentsHelp` | ส่งอีเมลเมื่อมีคนแสดงความเห็นในโปรเจกต์ของคุณ | Sends an email when someone comments on your project |
| `switchFixtures.jobs` | แจ้งเตือนเมื่องานเสร็จ | Notify me when a job finishes |
| `switchFixtures.jobsHelp` | ส่งอีเมลเมื่องานที่คุณเริ่มเสร็จหรือล้มเหลว | Sends an email when a job you started finishes or fails |
| `switchFixtures.saveError` | บันทึกการตั้งค่าไม่สำเร็จ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง | We could not save this setting. Check your connection, then try again |

## Acceptance criteria

Stories: `Base/Radio group` (id `base-radio-group`) and `Base/Switch` (id `base-switch`), each a new `*.stories.tsx` beside its component. Plays run in Thai; an `InEnglish` story nests `LocaleProvider locale="en"` with the English column of "Copy". A play for a visual criterion uses the helpers of `src/testing/visual-asserts.ts` (`.claude/rules/testing.md`).

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook test project, neutral, light, Thai | `Default` renders a `Field group` with three items, `defaultValue` `members` | "ใครเข้าเวิร์กสเปซนี้ได้" (Who can open this workspace) over "มีผลกับทุกโปรเจกต์ในเวิร์กสเปซนี้" (Applies to every project in this workspace), three rows with a circle, a label and a description, a dot on "เฉพาะสมาชิก" (Members only) | None. One radiogroup named by the label and described by the help; three radios, each named by its label and described by its description (`radio-api-1`, `field-group-1`) | `Default` play: `getByRole("radiogroup", { name })`, `toHaveAccessibleDescription` on the group and on each radio, `getAllByRole("radio")` length 3, `.ds-field__label` tag `SPAN` with no `for` |
| 2 | Same | `NoValue` renders with no `defaultValue` (the missing value), then Tab, then Space | No dot, then the focus ring on "เฉพาะสมาชิก" (Members only), then its dot | Value `members` | `NoValue` play: no radio checked, `userEvent.tab()` and `toHaveFocus` on the first radio, Space, `toBeChecked` |
| 3 | Same | `Keyboard` and `KeyboardHorizontal` render, and the play presses ArrowDown, ArrowRight, ArrowUp, ArrowLeft, Enter and Tab | The dot follows the focus and wraps from the last row to the first and back; Enter changes nothing | Value follows `radio-keys-1` in both orientations (W2, row `unset`) | Both plays: after each arrow the reached radio has focus and is checked, one step past each end wraps, Enter leaves the value, Tab leaves the group |
| 4 | Same | `Disabled` renders a disabled group with `organization` checked, and the play clicks a label | Three rows in disabled ink, the dot still on "ทุกคนในองค์กร" (Everyone in the organization), nothing moves | None. Each radio `toBeDisabled`; `.ds-radio` computed `opacity` 1 (`control-disabled-1`) | `Disabled` play, with computed `backgroundColor` against `resolvedColor(el, "--cmp-radio-bg-disabled")` |
| 5 | Same | `DisabledItem` renders with `link` disabled, and the play clicks its label and presses ArrowDown from `organization` | "ทุกคนที่มีลิงก์" (Anyone with the link) stays empty; the arrow lands on "เฉพาะสมาชิก" (Members only) | Value `members`; the disabled radio is skipped | `DisabledItem` play |
| 6 | Same | `Invalid` renders `Field error` | "เลือกว่าใครเข้าเวิร์กสเปซนี้ได้ก่อนบันทึก" (Choose who can open this workspace before you save) in the error ink, and each circle with the error edge | None. The group has `aria-invalid="true"` and no radio has it; the group's description holds the message; one `role="alert"` (`radio-invalid-1`) | `Invalid` play, with `expectEdgeInk` on one circle and computed `borderColor` against `--cmp-radio-border-error` |
| 7 | Same | `Required` renders `Field required` | The label with its star | None. The group has `aria-required="true"`, no radio has it; the group's name holds no star | `Required` play |
| 8 | Same | `InteractionStates` renders a rest, a hover and a focus row, unchecked and checked | The hover row's edge changes; the focus rows show the brand line with its halo and the checked one keeps its dot | None (`control-tokens-1`) | `InteractionStates` play: `parameters.pseudo` as Checkbox lines 106 to 125, computed `borderColor` of hover against rest, `expectFocusBorderForm` on both focus rows |
| 9 | Same | `Checked` renders one checked and one unchecked radio | The checked circle holds a dot on the selected ground with the selection edge; the other is empty | None. The indicator svg exists only in the checked radio (`control-tokens-1`) | `Checked` play: computed `backgroundColor` and `borderColor` against `--cmp-radio-bg-checked` and `--cmp-radio-border-checked` through `resolvedColor` |
| 10 | Same | `Sizes` renders `sm` and `md` | Two groups, the small circle with smaller text, each circle centred on its first line | None. Circle sizes equal W1's `radio` line to 0.5 px; the `sm` target equals `radio.target-min` | `Sizes` play: boxes by `getBoundingClientRect`, target by `elementFromPoint` as Checkbox lines 90 to 97 |
| 11 | Same | `Horizontal` renders the group in a wide frame, then `HorizontalAt360` in `Narrow` | One row of options, wrapping at 360 px with no sideways scroll | None | Both plays: first and second circle `top` equal in `Horizontal`; frame `scrollWidth` equals `clientWidth` in `HorizontalAt360` |
| 12 | Storybook, a 360 px frame | `LongContentAt360` renders an item with `fixtures.longThai` as label and `fixtures.longLatin` as description, and one with `fixtures.thaiMarks` | The text wraps beside the circle, no sideways scroll, no clipped Thai marks | None | `LongContentAt360` play: frame `scrollWidth` equals `clientWidth`, `expectNoGlyphClip` on the labels |
| 13 | Storybook, Professional, light | `RoundUnderProfessional` renders through `Under` | A round circle, next to a Field input with Professional's control radius | None. Width equals height and computed `borderTopLeftRadius` equals the resolved `--ds-shape-round-radius` (`control-shape-1`) | `RoundUnderProfessional` play |
| 14 | Storybook test project, Thai | `InForm` renders the group with `name` `access` in a `<form>`, the play moves the value, then resets | The dot moves, then returns to "เฉพาะสมาชิก" (Members only) | `new FormData(form).get("access")` is `organization`, then `members` after `form.reset()` | `InForm` play |
| 15 | Same, English | `InEnglish` renders Default, NoValue, Checked, InteractionStates, Sizes `sm` and `md`, Horizontal, Disabled, DisabledItem, Invalid and Required | The same rows with the English column of "Copy": "Who can open this workspace", "Members only", "Choose who can open this workspace before you save" | None | `InEnglish` play: each group found by its English name, the alert text in English |
| 16 | Storybook test project | `RecipesAndModes` renders through `Matrix` | Unchecked, checked, invalid, disabled and `sm` rows in six boundaries: neutral, professional, friendly, each in light and dark | None | `RecipesAndModes` play: six cells; contrast is row 19 |
| 17 | `Base/Field`, Thai | `GroupControl` renders, and every existing `Base/Field` story renders | `GroupControl` as row 1; the others as today | None. Without `group`, the label stays a `<label>` whose `for` equals the control's id (`field-group-1`) | `GroupControl` play, plus one assertion in `EveryControl`; existing plays unchanged and green |
| 18 | `Examples/Base: Settings form` | `Default`, `Invalid` with `errors.access`, and `Saving` render | The general tab holds "ใครเข้าเวิร์กสเปซนี้ได้" (Who can open this workspace) with its three options; `Invalid` adds its message; `Saving` greys the group | None. Fixture content, nothing saved (`settings-example-1`) | `Default` play finds the radiogroup by name; `Invalid` play counts three alerts; `Saving` play: each radio `toBeDisabled`; `LongContentAt360` stays green |
| 19 | The PR head | `check-catalog`, the i18n checks, `recipes.test.ts`, `tokens.test.ts` and `pnpm contrast` run | Not a screen | `catalog/base/radio-group.yaml` resolves its story; `coverage.md` line 18 reads `draft`, `base-radio-group`; `shape.round.radius` and `radio.*` pass the layer tests; every `radio` pair of `control-pairs-1` passes under each set of `CONTRAST_SETS` (neutral, professional, friendly, orivilo) in both modes | `pnpm --filter @orivilo/design-system test` and `pnpm contrast` output |
| 20 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `Default`, `Checked`, `InteractionStates`, `Invalid`, `Disabled`, `Sizes`, `Horizontal` and Settings form `Default` | One circle language, a clear checked state beside a Checkbox in the same form, Thai that reads as Thai | None | Designer visual sign-off with screenshots in design.md, with the answers to open questions 1 and 4 |
| 21 | Storybook test project, neutral, light, Thai | `Default` renders a `Field orientation="horizontal"` around a Switch with no `defaultChecked` (the missing value), and the play clicks the label, then the description | "แจ้งเตือนเมื่อมีความเห็นใหม่" (Notify me about new comments) over "ส่งอีเมลเมื่อมีคนแสดงความเห็นในโปรเจกต์ของคุณ" (Sends an email when someone comments on your project), the Switch at the end of the line; the thumb moves on the label click and stays on the description click | `aria-checked` `true` after the label click, unchanged after the description click (`switch-keys-1`, `field-row-1`) | `Default` play: `getByRole("switch", { name })`, `toHaveAccessibleDescription`, both clicks |
| 22 | Same | `Keyboard` renders, and the play presses Tab, Space, Enter | The focus ring, then the thumb moves on each key | `aria-checked` flips on Space and again on Enter (`switch-keys-1`) | `Keyboard` play |
| 23 | Same | `FixedLabel` renders, and the play toggles | The label stays "แจ้งเตือนเมื่อมีความเห็นใหม่" (Notify me about new comments) | None. The accessible name is identical in both states (`switch-label-1`) | `FixedLabel` play compares the name before and after |
| 24 | Same | `Sizes` renders `sm` and `md`, off and on | Two switches of each size, the thumb at the start when off and at the end when on | None. Track, thumb and thumb travel equal W1's `md` and `sm` lines to 0.5 px; the `sm` target equals `switch.target-min` | `Sizes` play: boxes by `getBoundingClientRect`, travel as the thumb's `left` on minus off; target by `elementFromPoint` |
| 25 | Same | `InteractionStates` renders rest, hover, pressed and focus, off and on | Hover changes the ink or the edge, pressed changes the track, focus shows the brand line with its halo | None (`control-tokens-1`) | `InteractionStates` play: `parameters.pseudo` for hover and active, computed `backgroundColor` or `borderColor` against rest, `expectFocusBorderForm` on both focus rows |
| 26 | Same | `Disabled` renders off and on, and the play clicks both | Disabled ink, the thumb at the start and at the end, nothing moves | None. Each `toBeDisabled`; `.ds-switch` computed `opacity` 1 (`control-disabled-1`) | `Disabled` play, with the thumb's `left` differing between the two |
| 27 | Same | `Invalid` renders `Field error` with `switchFixtures.saveError` | "บันทึกการตั้งค่าไม่สำเร็จ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง" (We could not save this setting. Check your connection, then try again) under the row, and the error edge on the track | None. The switch has `aria-invalid="true"` and the message in its description; one `role="alert"` | `Invalid` play, with `expectEdgeInk` on the track |
| 28 | Same | `Saving` renders `checked` and `saving`, and the play clicks, then presses Space and Enter | A turning ring in the thumb, and nothing moves | `aria-checked` unchanged; `aria-busy` and `aria-disabled` `true`; focus stays on the Switch; exactly one `role="status"` holds "กำลังบันทึก" (Saving) (`switch-save-1`) | `Saving` play, with `.ds-spin` inside the thumb |
| 29 | Same | `SaveFails` renders a fixture host held by a latch; the play toggles, releases the failure, then toggles again and releases a success | The thumb moves and the ring turns; the thumb returns and the failure message shows; on the retry the message goes and the thumb stays, with no tick and no saved word | Simulated save. `aria-checked` returns to the old value, `aria-invalid="true"`, focus on the Switch; then `aria-checked` holds the new value and no `role="alert"` remains (`switch-save-1`) | `SaveFails` play with `findBy` waits, no fixed time |
| 30 | Same | `Bare` renders one Switch with `aria-label` and one with `aria-labelledby`, no `Field` | Two switches with no visible label of their own | None. Each has a name; the a11y addon reports zero violations (`switch-api-1`) | `Bare` play: `getByRole("switch", { name })` for both, with the names `switchFixtures.jobs` and `switchFixtures.comments` |
| 31 | Same | `InForm` renders a Switch with `name` `comments` in a `<form>`, and the play toggles | The thumb moves | `new FormData(form).get("comments")` is `null` off and `on` on | `InForm` play |
| 32 | Same | `ReducedMotion` renders | The thumb moves with no slide under reduced motion, and the ring keeps turning in `Saving` | None. A `prefers-reduced-motion: reduce` rule removes the transition from `.ds-switch__thumb`, and none stops `.ds-spin` (`switch-size-1`, ORV-201 `spin-motion-1`) | `ReducedMotion` play: the stylesheet walk of `Spinner.stories.tsx` lines 97 to 112 |
| 33 | Storybook, a 360 px frame | `LongContentAt360` renders `Field orientation="horizontal"` with `fixtures.longThai` as label, `fixtures.longLatin` as description and `fixtures.longThai` as error, and one with `fixtures.thaiMarks` as label | The text wraps in its column, the Switch stays at the end of the first line, no sideways scroll, no clipped Thai marks | None | `LongContentAt360` play: frame `scrollWidth` equals `clientWidth`, the Switch's right edge inside the frame, `expectNoGlyphClip` on both labels |
| 34 | Same as row 21, English | `InEnglish` renders Default, InteractionStates, Sizes `sm` and `md`, off and on, Disabled, Invalid, Saving and SaveFails | The English column of "Copy": "Notify me about new comments", "Saving", "We could not save this setting. Check your connection, then try again" | None. The status holds "Saving" | `InEnglish` play |
| 35 | Storybook test project | `RecipesAndModes` renders through `Matrix` | Off, on, invalid, disabled, saving and `sm` rows in six boundaries: neutral, professional, friendly, each in light and dark | None | `RecipesAndModes` play: six cells; contrast is row 38 |
| 36 | `Base/Field`, Thai | `Horizontal` renders a Switch and `HorizontalInvalid` adds an error | The row of row 21, and the error under both columns | None. DOM order label, description, control, error (`field-row-1`) | `Horizontal` and `HorizontalInvalid` plays |
| 37 | `Examples/Base: Settings form` | `Notifications` opens the tab, and the play toggles one Switch; `NotificationsAt360` renders it in `Narrow` | "อีเมลแจ้งเตือน" (Email notifications), "การเปลี่ยนแปลงในหน้านี้มีผลทันที ไม่ต้องกดบันทึก" (Changes here apply right away, with no need to save) and two Switch rows; no "ไม่มีข้อมูล" in the tab; no sideways scroll at 360 px | None. Fixture, nothing saved. One `role="group"` named by the heading; two switches inside it (`settings-example-1`) | `Notifications` and `NotificationsAt360` plays |
| 38 | The PR head | `check-catalog`, the i18n checks, `recipes.test.ts`, `tokens.test.ts` and `pnpm contrast` run | Not a screen | `catalog/base/switch.yaml` resolves its story; `coverage.md` line 19 reads `draft`, `base-switch`; `switch.saving` exists in Thai and English; every `switch` pair of `control-pairs-1` passes under each set of `CONTRAST_SETS` (neutral, professional, friendly, orivilo) in both modes; no middot or em dash in either locale file | `pnpm --filter @orivilo/design-system test` and `pnpm contrast` output |
| 39 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `Default`, `Sizes`, `InteractionStates`, `Disabled`, `Invalid`, `Saving`, `SaveFails` and Settings form `Notifications` | A clear off and on in each profile, the ring legible in the thumb, Thai that reads as Thai | None | Designer visual sign-off with screenshots in design.md, with the answers to open questions 1, 3 and 5 |
| 40 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/radio-group src/components/switch src/components/field src/components/input src/components/textarea src/components/select src/examples` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n src/tokens`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

Rows 1 to 20 are the RadioGroup with `Field group`; rows 21 to 39 the Switch with `Field orientation`; row 40 both.

## Rows that render nothing

- Rows: 19, 38, 40

## Rows per PR

The main session adds one line per PR when it opens, in the form `qa-scope-1` reads (`scripts/ovl/result-recorder.mjs`), per open question 6. Under its default the first PR takes rows 1 to 20 and 40, and the second rows 21 to 40.

## Out of scope

- Moving Checkbox from `action.primary` to the selection tokens (`component.json` line 895), though audit B.4 asks for them: a separate card, after the answer to open question 1.
- The choice card, and any radio form beyond `radio-forms-1`.
- A real save: no server action, no data, no Toast or success message from Switch.
- Right to left layout (shadcn's RTL examples, K-0147, K-0148).
- ToggleGroup's catalog line on radio semantics in single mode (K-0153 sets a toolbar apart from a form).
- Any profile file, `apps/web`, or visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

1. Which token a checked radio and an on switch read. Options: (a) the selection tokens, for both controls; (b) `action.primary`, as `checkbox.bg-checked` reads (`component.json` line 895), which gives one look with Checkbox but crosses `DESIGN.md` section 8; (c) (a) for the radio and (b) for the switch, reading on as an action rather than a selection. Closed in v1.1: (a), the default, which is `control-tokens-1` (design.md, "Answers to the open questions", row 1). K-0144 and K-0146 use a brand fill, refused above, and K-0157 open point 1 left this to the designer, who judged it beside a checked Checkbox in one form. Under (a) a checked radio and a checked Checkbox differ in one form until the card in Out of scope lands, and friendly is the one real split; rows 20 and 39 look at that on the real stories.
2. Own label or Field wiring. Options: (a) `Field` is the one source of the group's label, the Switch's label, the help and the error, and each radio item keeps its own label and description; (b) both carry their own label, description and error as Checkbox does (K-0144, K-0146, `checkbox.yaml` line 22), which needs a recorded deviation from D.3 row 18; (c) both ways at once, which gives two routes to one result. Default: (a), which is `field-group-1`, `field-row-1` and `switch-api-1`: D.3 row 18 asks for Field wiring, our `Field` passes it through context where shadcn's does not (K-0149), and the Radix roots decide the shape (K-0151, K-0152, K-0156).
3. A saving or failed state for Switch. Options: (a) `saving` on the Switch, with the failure through `Field`'s `error`; (b) no state on the component: the caller sets `disabled` and reports elsewhere, which drops focus (K-0152) and leaves no status; (c) flip at once and revert silently, which fails `DESIGN.md` section 7 "announces status". Closed in v1.1: (a), the default, which is `switch-save-1` (design.md, "Answers to the open questions", row 3). No page read shows such a state (K-0146, K-0148, K-0152), so this answers `DESIGN.md` section 6 "Save feedback and error recovery" and rests on Button's loading state. The designer kept the ring in the thumb, the default, over beside the label.
4. How a radio stays round. Options: (a) a new semantic `shape.round.radius`; (b) `shape.control.radius`, a rounded square under Professional; (c) `clip-path` as ORV-201 design.md D11, which clips the halo. Closed in v1.1: (a), the default, which is `control-shape-1`, an L-lane contract change with its impact listed above (design.md, "Answers to the open questions", row 4). No entry in K-0144 to K-0156 covers a profile's shape; K-0144 and K-0147 draw a plain circle.
5. The pressed look of a Switch. `DESIGN.md` section 7 asks for `action.primary-press` or an equivalent, and no page read shows a pressed state (K-0146, K-0148). Options: (a) `switch.track-press`, off and on; (b) no pressed look, which leaves section 7 unmet. Closed in v1.1: (a), the default, which is `control-tokens-1` (design.md, "Answers to the open questions", row 5).
6. PR size. By estimate, about 900 changed lines per component with its stories, over the 400-line guide. Options: (a) two PRs split vertically, RadioGroup with `Field group` first, then Switch with `Field orientation`; (b) one PR with the review sized to it (ORV-146), as ORV-201 comment 10465 decided there. Default: (a). No entry in K-0144 to K-0157 bears on this: it is a delivery question, not a design one. The main session decides and adds the Rows per PR lines.

## Depends on

- `docs/knowledge/design/K-0144` to `K-0157` (benchmark, standards and synthesis, 2026-11-06).
- `docs/specs/ORV-64/audit.md` section B (table form, B.4 on checked) and section D.3 row 18 (the story and its done-when).
- `DESIGN.md` section 3 (tokens), section 4 (choice row), section 6 (routing), section 7 (states), section 8 (colour roles), section 11 (design gate).
- `.claude/rules/design-system.md` ("Components", "Tokens and layers"), `.claude/rules/testing.md` (visual plays).
- ORV-137 comment 10247 (the benchmark table in POC mode); ORV-138 `qa-scope-1` (the Rows per PR form); ORV-146 (review by size).
- ADR 0003 (Storybook and catalog, no shadcn classes), ADR 0012 (gates).
- ORV-201 (`Spinner`, `spin-motion-1`, design.md D11 and D13).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

W1. The sizes of `control-tokens-1` and `switch-size-1`. Input: `size.icon.sm`, `.md`, `.lg` reference `size.icon-4`, `icon-5`, `icon-6` (`semantic.json` lines 875 to 885), whose values are `16px`, `20px`, `24px` (`primitives.json` lines 557 to 567). `space.inline.sm` references `space.1` (`semantic.json` lines 810 to 813), whose value is `4px` (`primitives.json` lines 463 to 466). `shape.control.radius` under Professional references `radius.6` (`professional.json` line 348), whose value is `6px` (`primitives.json` lines 425 to 428). The track is the height plus the thumb wide, the inset is half of the height less the thumb, the travel is the track less the thumb less both insets, the ring is the thumb less `space.inline.sm`, and the thumb's radius is `switch.radius` less the inset. Under neutral, friendly and orivilo `switch.radius` is `radius.full`, `999px` (`semantic.json` line 743, `primitives.json` line 455), so the result stays far above half the thumb and the thumb is a full round. Expected output, integers, no rounding, the track and the travel matching Untitled's `h-6 w-11` and `h-5 w-9` with `translate-x-5` and `translate-x-4` (K-0146):

```text
radio md 20 sm 16 target 24
md track 44x24 thumb 20 inset 2 travel 20 ring 16
sm track 36x20 thumb 16 inset 2 travel 16 ring 12
thumb radius professional 4
```

```bash
node -e 'const P=require("./packages/design-system/src/tokens/source/primitives.json");const p=P.size;const v=k=>parseInt(p[k].$value);const gap=parseInt(P.space["1"].$value);console.log("radio md",v("icon-5"),"sm",v("icon-4"),"target",v("icon-6"));const g=(n,h,t)=>console.log(n,"track",(h+t)+"x"+h,"thumb",t,"inset",(h-t)/2,"travel",(h+t)-t-(h-t),"ring",t-gap);g("md",v("icon-6"),v("icon-5"));g("sm",v("icon-5"),v("icon-4"));console.log("thumb radius professional",parseInt(P.radius["6"].$value)-(v("icon-6")-v("icon-5"))/2)'
```

W2. The method of `radio-keys-1`: what roving focus does with each arrow key for each `orientation` it receives. Input: `MAP_KEY_TO_FOCUS_INTENT` and `getFocusIntent`, copied from `@radix-ui/react-roving-focus` 1.2.1 `dist/index.mjs` lines 212 to 236. Expected output: with `orientation` unset all four keys move, which is why the prop stays off the Radix root.

```text
unset ArrowLeft=prev ArrowUp=prev ArrowRight=next ArrowDown=next
vertical ArrowLeft=none ArrowUp=prev ArrowRight=none ArrowDown=next
horizontal ArrowLeft=prev ArrowUp=none ArrowRight=next ArrowDown=none
```

```bash
node -e 'const m={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next"};const f=(k,o)=>o==="vertical"&&["ArrowLeft","ArrowRight"].includes(k)||o==="horizontal"&&["ArrowUp","ArrowDown"].includes(k)?"none":m[k];for(const o of [undefined,"vertical","horizontal"])console.log(o??"unset",...Object.keys(m).map(k=>k+"="+f(k,o)))'
```

W3. The margin of `control-pairs-1`: `selection.fg` as a fill on `surface.canvas` and `surface.card`, lowest ratio over neutral, friendly and professional in both modes. The orivilo set holds neutral's values (`orivilo.json` lines 45 to 58, and it sets no canvas or card). Input: the hex values of `primitives.json` lines 12, 44, 48, 78, 90 and of `friendly.json` and `professional.json`. Expected output, rounded to two decimals, computed by hand and to be confirmed by the run: `lowest neutral dark card 5.65`. The floor is 3.0; `recipes.test.ts` stays the proof.

```bash
node -e 'const L=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};const r=(a,b)=>{const[x,y]=[L(a),L(b)].sort((m,n)=>n-m);return (x+.05)/(y+.05)};const s={"neutral light":["#6B22B0","#F4F4F0","#FFFFFF"],"neutral dark":["#B07FEE","#16151D","#1E1D26"],"friendly light":["#00645B","#F9F6F2","#FFFFFF"],"friendly dark":["#8AD1C7","#241D13","#3E3424"],"professional light":["#254582","#F5F7F9","#FFFFFF"],"professional dark":["#A0C1FE","#1B1E23","#30363D"]};let lo=[99];for(const[n,[f,cv,cd]]of Object.entries(s))for(const[g,b]of [["canvas",cv],["card",cd]]){const v=r(f,b);if(v<lo[0])lo=[v,n,g]}console.log("lowest",lo[1],lo[2],lo[0].toFixed(2))'
```

## Changelog

- v1.0 (2026-11-06): first version, from K-0144 to K-0157 and audit D.3 row 18. Downstream to review: the designer envelope (design.md, open questions 1, 3, 4 and 5), the builder envelopes (split per open question 6), the qa envelope (Rows per PR lines once the PRs exist), `catalog/coverage.md`, `DESIGN.md` sections 3.3, 4 and 12.
- v1.1 (2026-11-06): takes in amendments A1 to A4 of design.md, which came from the render. A1 drops `switch.ring-size` and `switch.ring-size-sm`, because `size.icon.xs` is 14 px and no 12 px semantic size exists. A2 gives an on Switch `--_focus-shadow-fill`, because its border equals its fill. A3 makes the thumb's radius concentric with the track. A4 reads "changes" in row 25, because `border.strong` is near white in dark. W1 gains the ring and the thumb's radius. Closes open questions 1, 3, 4 and 5 with design.md's answers, each the default. Downstream to review: the builder envelopes (`component.json` and the recipe, two fewer tokens), the qa envelope (rows 24 and 25, W1's new output), design.md's `spec:` line (still reads v1.0).
