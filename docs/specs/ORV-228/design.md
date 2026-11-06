---
issue: ORV-228
spec: docs/specs/ORV-228/spec.md v1.0
task: ORV-228-design-1
date: 2026-11-06
---

# ORV-228 design: Combobox and Multi-select

This file sets the look of `cbx-recipe-1` and `ms-recipe-1`, answers open questions 3, 8, 9 and 13, and gives the builder the CSS and markup per named rule. No answer differs from its default. The look adds no token and no contrast pair. Nine spec amendments are listed for product to take in.

How the look was proven: no Combobox exists yet, so the proposed CSS and static markup were injected into the `base-select--default` story on Storybook (port 6440), under the real tokens, profiles, modes, fonts and locale. Hover and focus are the browser's own states, forced through the Chrome DevTools Protocol. What this does not prove: real Radix positioning and collision (the popup sits in the flow, 4 px under the field, with the three `--radix-popover-*` values set by script), any key or pointer behaviour, any browser but Chromium, and any screen reader.

## Flow

Combobox, local list:

1. Tab or a click puts focus in the input. The field shows its focus edge and no list (Q3).
2. Typing opens the list under the field and filters it. No option is active. Down Arrow, Up Arrow or the pointer makes one active. The chevron is the visible route for a pointer or a finger.
3. Enter or a press chooses. The label fills the input, the list closes, focus stays in the input.
4. Reopening without an edit shows the whole list, with the chosen row filled and checked.
5. No match: the panel stays, with one line in place of the list.

Combobox, async: the panel moves from prompt to pending (ring and text), then to results, no match, or error (triangle and danger ink). The field does not change while it waits.

MultiSelect:

1. With no tags the field looks exactly like an empty Combobox, placeholder included.
2. After a choice the tag appears before the input, the text empties, the list stays open and refills, the chosen rows show their fill and check, and no row is active (Q8).
3. Tags wrap inside the field. The chevron and the clear button stay on the first row. The field grows by one row pitch at a time.
4. Backspace or Left Arrow from an empty input moves focus to the last remove, which shows the focus ring. The field's focus edge goes away, so there is one focus mark on screen (Q9).
5. A removal moves focus by `ms-focus-1`. The field shrinks by a row when a row empties.

## Answers to the open questions

<!-- prettier-ignore -->
| # | Question | Answer | Why |
| --- | --- | --- | --- |
| 3 | When the list opens, as seen on screen | Default (a). Focus by Tab or by a click shows only the field's focus edge, and the page below stays uncovered. The list opens on a text edit, on the keys, and on the chevron. It opens 4 px under the field, on the field's start edge and at the field's width. Screens: `field-*`, scene "Focus by Tab or click" | A keyboard user who tabs through a form must not have the next fields covered. The chevron stays in `--cmp-input-icon` ink, the same as `Select`, so a pointer user sees the same promise of a list |
| 8 | After a choice in Multi-select | Default (a), plus one line on scroll. The tag appears, the text empties, the list stays open, the chosen rows show fill and check, no row is active. If the text was already empty the list keeps its scroll position, because its rows did not change and the next pick is usually near. If the text held a query the list refills from the top. Screens: `multi-*`, scene "Open after a choice" | Several picks in a row is the reason this control exists. A list that jumps to the top after each pick would cost the place the person was reading. Amendment A8 |
| 9 | Tag removes as Tab stops | Default (a). Each remove is a Tab stop and shows the Tag's own ring, a line with an inner halo, concentric with the tag end at sm and md. While a remove or the clear button has focus the field shows no focus edge, so one mark says where focus is. This needs no code: the edge rule is `.ds-input-group:has(.ds-input-group__input:focus-visible)` (`recipes.css` line 385). Screens: `multi-*`, scene "Remove focus sm, remove focus md" | The ring reads clearly at both sizes in all three profiles, light and dark. A form with many tags still costs one stop per tag, which stays the case to watch |
| 13 | The sm Tag remove | Default (a). Measured in the render: 24 by 22 px, and a 24 px circle on its centre stays inside its own tag, in neutral, friendly and professional. The md remove is 24 by 24. The hover ground and the focus ring are concentric with the tag end at sm. Screens: `check-zoom-*`, third scene | The look at sm holds, so no reason appears to change a shared Tag or drop a size |

## Anatomy

```text
Combobox
.ds-combobox
  .ds-input-group[data-size]
    input.ds-input-group__input[role=combobox]
    span.ds-input-group__slot[data-slot=end]
      Button ghost sm iconOnly          clear, only with clearable and a value
      Button ghost sm iconOnly tabIndex=-1   chevron
  input[type=hidden]                    only with name and a value
  p.sr-only[role=status]

Popup, in the portal, under PortalScope
.ds-menu.ds-combobox__popup
  .ds-combobox__list[role=listbox]      with options, or busy
    .ds-menu__option ...
  .ds-menu__empty[data-tone]            one line, cases 2 to 5 of cbx-status-1

MultiSelect
.ds-combobox
  .ds-input-group[data-multiple][data-size]
    .ds-combobox__values
      ul.ds-combobox__tags[aria-label]  only with one or more tags
        li > Tag
      input.ds-input-group__input[role=combobox]
    span.ds-input-group__slot[data-slot=end]   clear all, chevron
  p.sr-only[role=status]
```

## States

<!-- prettier-ignore -->
| State | Combobox field | Option row | Panel line | MultiSelect field | Tag in the field |
| --- | --- | --- | --- | --- | --- |
| Default | `InputGroup` at rest, placeholder, chevron in `--cmp-input-icon` | Label on `menu.bg` | Not shown when options exist | Same as Combobox with no tags; with tags, tags then input | `Tag` at rest |
| Hover | The group's hover edge. Slot button: ghost hover ground and ghost ink, so ink changes too | Same mark as active (pointer makes it active, `cbx-pointer-1`) | None, it is not a control | Group hover edge | Remove: Tag's hover ground and ink |
| Focus | Input focus: group line and halo. Clear button: Button's line and 3 px halo, inside the field | Active, not chosen: the system's ground (see D12). Active and chosen: fill plus 1 px line and inner halo | None, focus stays in the input | Input focus: group line and halo. Remove or clear focus: no group edge | Remove: Tag's line and inner halo |
| Selected | The label in the input | Chosen: selected fill, selected ink, check at the end. Never the focus shape | None | The tags themselves | No selected look: a tag in the field is a value, not a toggle |
| Disabled | Group disabled ground, chevron and clear disabled, no list | Disabled ink, skipped by keys. Disabled and chosen keeps fill and check, ratio at least 3.0 | None | Group disabled ground, `cursor: not-allowed` | Tag disabled, with a 1 px edge in `--cmp-tag-fg-disabled` (D10) |
| Loading | No change to the field: the panel owns the wait | None: the busy list has no option | Spinner `size="sm"`, `decorative`, then `combobox.pending` | Same as Combobox; tags stay | Unchanged |
| Empty | Placeholder, never a blank | None | `combobox.empty`, `emptyText` or `select.empty`; prompt in async | Placeholder only at zero tags | None rendered |
| Error | Invalid: danger edge and `Field` message | None | Async failure: `WarningIcon`, danger ink, `combobox.error`, wrapped when long | Invalid: danger edge and message; tags keep their look | Unchanged |
| Success | None. The value in the input is the outcome, with no mark of success (`AGENTS.md`) | None | None | The tag is the outcome. Confirmation goes through the status region only, from the real value | None |

Part of every state, not edge cases:

- Thai: the input, tag labels, option labels, descriptions and panel lines all show stacked marks whole, at sm, md and lg (`check-zoom-*`, 3x). The input's text cannot be read by the ink helpers, so these screens are its check (`cbx-ink-1`).
- Long names: an input value ends in the input's ellipsis and leaves the clear button whole. An option label ends in an ellipsis on one line, its description wraps. A tag label ends in an ellipsis with `title`. A panel line with a long query wraps inside the panel. A Latin string with no spaces behaves the same.
- Missing data: no value shows the placeholder, never a blank. A blank option description draws no second line.
- Small screens: every board was rendered at 360 px. The popup keeps the field's width. At 360 px two tags and a clear button can fill a row, so the input takes its own row, which is the row to type in.
- Reduced motion: this design adds no transition and no animation. The chevron does not rotate and the popup does not animate, the same as `Select`. The ring keeps turning by the Spinner's own rule, as it is the only sign of waiting.

## Visual decisions

<!-- prettier-ignore -->
| # | Decision | Value (tokens) | Source intent |
| --- | --- | --- | --- |
| D1 | Combobox reads as one control with `Select`: same field height, same start of text, same chevron place and ink | Chevron glyph centre 27 px from the field's end at sm, md and lg in all three profiles, measured against `Select`. Ink `--cmp-input-icon`, 6.78 and above on `input.bg` in neutral | Row 28 "reads as one control with `Select`". The plain ghost Button sat 7 px off and in another ink |
| D2 | Slot buttons are square | Side `--_b`: inner field height less twice `--cmp-input-group-inset`, so 30 at md, 38 at lg (friendly md 34). sm is `--ds-size-icon-lg`, 24 | `cbx-target-1`. At 32 px wide the hover ground was not a square, and it did not match the round or square corner of the field's end |
| D3 | Clear and chevron sit side by side with a gap | Gap `--cmp-input-group-inset`, end margin only on the last button | The slot rule's negative margin applied to both, and they overlapped by 4 px (defect in the spec's approach, A2) |
| D4 | The popup is exactly the field's width, and its height is capped | `width` and `min-width` from `--radix-popover-trigger-width`. `max-height: min(available height, --ds-size-panel-default)`, 320 px | A popup that follows its content would jump in width with each letter. At the full available height a 40-option list would cover the screen. At 320 px the list shows 7.55 rows at 40 px and 6.86 rows at 44 px (measured), so a cut row is the scroll cue in every profile |
| D5 | One panel line form for all statuses | `.ds-menu__empty`, `padding-block: var(--cmp-menu-padding)`, start aligned, gap `--cmp-button-gap`. One line is a 40 px row, wrapped lines stay clear | Thai marks on wrapped lines need the room. The line's text starts on the option text's start edge |
| D6 | Pending, empty and error differ by more than colour | Pending: ring and secondary ink. Empty: text only. Error: `WarningIcon` and `--cmp-menu-option-fg-destructive` | Row 41 "read as three states"; `DESIGN.md` §7. Danger ink alone would not carry the state for a person who cannot read the colour |
| D7 | A chosen row carries a check, as in `Select` | `CheckIcon className="size-4 shrink-0"` at the row's end | Selection must not rest on the fill alone. The spec is silent, and without it the row's fill ratio of 1.05 to 1.52 on the menu ground is all there is (A5) |
| D8 | The chevron stays on the first row, tags wrap in their own box | `.ds-combobox__values` wraps; the end slot sits beside it at the height of one row | With `flex-wrap` on the group itself the slot wraps with the tags, so the chevron would jump as the field grows (A7) |
| D9 | The field's corner stays the same at every row count | `--_corner: min(--cmp-input-radius, h / 2)`: an exact pill at one row, and that same corner at four rows. Tag inset `(h - 2px - tag height) / 2`: 3, 3 and 7 px (friendly md 5), so tags sit concentric with the corner | A radius of 999 px turns a tall field into a stadium whose ends swallow the tags. "A shape that holds at every line count". Field height at rest stays 32, 40 and 48 px (friendly md 44) |
| D10 | Disabled tags keep their edge in the field | `border-color: var(--cmp-tag-fg-disabled)` under `[data-disabled]` | `tag.bg-disabled` equals `input.bg-disabled` and the disabled border equals both, so the pill vanished and the label floated. Ratio 2.23 to 3.79. It is decorative on a disabled control, so it takes no contrast pair, like the rest hairline in `pairs.ts` |
| D11 | The input takes its text start from the field, and the tag height for its own | Height `--_tag-h`: 24, 32 and 32 px. `--_lead` keeps the text at 16 px plus the border with no tags. Least width `--ds-size-control-lg` plus `--_lead`. `field-sizing: content` under `@supports` | With no tags the field must match Combobox to the pixel. A larger least width left a blank second row at 448 px. Typing grows the input and wraps it, so a long query stays readable |
| D12 | An active row keeps the system's ground; only a chosen and active row adds the line | `menu.option.bg-hover`, as `Select`, `DropdownMenu`, `CommandMenu` and `CanvasChat` | The Combobox should read as one with those lists, and the ground is the focus mark in a list by the comment in `recipes.css` (ORV-192 row 9). The ground's ratio is only 1.1 to 1.5 against the menu, so this is raised for the whole system in `needs_decision`, with the option rendered |
| D13 | The panel repeats "พิมพ์เพื่อค้นหา" when the placeholder says the same | As row 30 | It reads a little doubled in the async prompt state, but an empty panel would look broken, and the status text has to exist. Kept |
| D14 | The mock note reads as a note, not a status | `<p class="ds-field__description">` as a child of `Field` after the control | Row 30 asks for it under the field, and `Field`'s `description` prop renders above the control |

## Builder table: CSS and markup per rule

All CSS goes in `recipes.css`, after `.ds-menu`, in the block at the end of this section. Every value is a `--ds-*` or `--cmp-*` property, a local `--_*`, a Radix variable or a keyword. `--_h` and `--_focus-shadow-inset` are the recipe locals already in use. `border-radius` reads a local because `recipes.test.ts` asks a radius line to start with `var(`.

<!-- prettier-ignore -->
| Rule | Markup | CSS | Play that proves it |
| --- | --- | --- | --- |
| `cbx-base-1` | `<Popover.Content className="ds-menu ds-combobox__popup" side="bottom" align="start" sideOffset={4}>`. 4 is `Select`'s offset, not `Popover`'s default of 6 | `.ds-combobox`, `.ds-combobox__popup` | Row 21, plus a read of the gap in row 4 |
| `cbx-kind-1` | No option has `data-highlighted` until a key or the pointer makes one so | None | Row 2 |
| `cbx-value-1` | Chosen option: `data-state="checked"`. Reopened list: the whole list | D7 | Row 6 |
| `cbx-open-1` | In the end slot, last: `<Button variant="ghost" size="sm" iconOnly tabIndex={-1} aria-label={...} disabled={disabled} onMouseDown={preventDefault}><ChevronDownIcon className="size-5" /></Button>`. `onMouseDown` keeps focus in the input (row 4). No rotation | Slot rules | Rows 3, 4 |
| `cbx-keys-1` | `scrollIntoView({ block: "nearest" })` on the active option, so the list moves only as far as it must | `.ds-combobox__list` | Row 12 |
| `cbx-pointer-1` | The hover mark is `data-highlighted`, no separate `:hover` look | None new | Row 10 |
| `cbx-aria-1` | Option mirrors `Select`: first child `<span>` label; with an icon `<span><span class="ds-menu__option-line"><span class="ds-menu__option-icon" aria-hidden="true">...</span><span class="ds-menu__option-label">...</span></span></span>`; with a description `.ds-menu__option-body` holding the label and `.ds-menu__option-description`; then `<CheckIcon className="size-4 shrink-0" />` when chosen | Chosen and active rule | Rows 5, 11, 16 |
| `cbx-status-1` | `<div class="ds-menu__empty"><span>{text}</span></div>` in the popup after the list, with no role. Live region stays as the rule says | `.ds-menu__empty` rules | Rows 14, 15 |
| `cbx-async-1` | Pending: `<div class="ds-menu__empty"><Spinner decorative size="sm" /><span>{text}</span></div>`. Error: `<div class="ds-menu__empty" data-tone="error"><WarningIcon aria-hidden /><span>{text}</span></div>` | `.ds-menu__empty > svg`, `[data-tone="error"]` | Rows 31, 35, 37 |
| `cbx-api-1` | Clear: `<Button variant="ghost" size="sm" iconOnly aria-label={...}><CloseIcon className="size-4" /></Button>` before the chevron, tabbable, only with a value and not disabled | Slot rules | Rows 17, 18 |
| `cbx-target-1` | None | `--_b` | Row 17: 24, 30, 38 px square |
| `cbx-recipe-1` | As anatomy | Combobox part of the block | Rows 11, 17, 22 |
| `cbx-stories-1` | Mock note: `<p class="ds-field__description">` as a `Field` child after the control | None | Row 30 |
| `cbx-ink-1` | Frames as its table says | `.ds-combobox__list` is the clip frame through `overflow-y: auto`. No class in the block adds a clip between a frame and its element | Rows 22, 37, 56 |
| `ms-api-1` | As anatomy. No `ul` at zero tags. `placeholder` only at zero tags. `onMouseDown` on `.ds-combobox__values`: when `event.target === event.currentTarget`, `preventDefault` and focus the input, since `cursor: text` promises it. Tag size sm in a sm field, md otherwise | MultiSelect part of the block | Rows 43, 44, 48, 54, 56 |
| `ms-choose-1` | `aria-multiselectable="true"`. Keep `scrollTop` when the text was already empty (A8) | None | Rows 44, 45 |
| `ms-keys-1`, `ms-focus-1` | Focus lands on `.ds-tag__remove`, whose own ring shows it. No extra mark on the field | None new | Rows 46 to 48 |
| `ms-target-1` | `Tag` unchanged | None | Row 54 |
| `ms-recipe-1` | As anatomy | MultiSelect part of the block | Rows 54 to 56, 62 |

No look of their own, so no row above: `cbx-ime-1`, `cbx-filter-1`, `cbx-copy-1`, `ms-status-1`, `ms-copy-1`. Their strings render through the forms above, and the copy tables stand unchanged.

```css
/* Combobox and MultiSelect (ORV-228). Placed after .ds-menu so these win. */
.ds-combobox {
  display: block;
  width: 100%;
}
.ds-combobox .ds-input-group__slot {
  gap: var(--cmp-input-group-inset);
}
.ds-combobox .ds-input-group__slot > .ds-button {
  --_b: calc(var(--_h) - 2px - 2 * var(--cmp-input-group-inset));
  width: var(--_b);
  min-height: var(--_b);
}
.ds-combobox .ds-input-group[data-size="sm"] .ds-input-group__slot > .ds-button {
  --_b: var(--ds-size-icon-lg);
}
.ds-combobox .ds-input-group__slot[data-slot="end"] > .ds-button {
  margin-inline-end: 0;
}
.ds-combobox .ds-input-group__slot[data-slot="end"] > .ds-button:last-child {
  margin-inline-end: calc((var(--ds-size-icon-md) - var(--_b)) / 2);
}
.ds-combobox .ds-input-group__slot > .ds-button:not(:hover):not(:disabled) {
  color: var(--cmp-input-icon);
}
.ds-combobox__popup {
  display: flex;
  flex-direction: column;
  width: var(--radix-popover-trigger-width);
  min-width: var(--radix-popover-trigger-width);
  max-width: var(--radix-popover-content-available-width);
  max-height: min(var(--radix-popover-content-available-height), var(--ds-size-panel-default));
}
.ds-combobox__list {
  min-height: 0;
  overflow-y: auto;
}
.ds-combobox__popup .ds-menu__empty {
  align-items: flex-start;
  gap: var(--cmp-button-gap);
  padding-block: var(--cmp-menu-padding);
  overflow-wrap: anywhere;
}
.ds-combobox__popup .ds-menu__empty[data-tone="error"] {
  color: var(--cmp-menu-option-fg-destructive);
}
.ds-combobox__popup .ds-menu__empty > svg {
  flex: none;
  inline-size: var(--cmp-menu-option-icon-size);
  block-size: var(--cmp-menu-option-icon-size);
  margin-block-start: calc(
    (
        var(--cmp-menu-option-type-font-size) * var(--cmp-menu-option-type-line-height) -
          var(--cmp-menu-option-icon-size)
      ) /
      2
  );
}
.ds-combobox__popup .ds-menu__option[data-state="checked"][data-highlighted]:not([data-disabled]) {
  outline: 1px solid var(--ds-focus-ring);
  outline-offset: -1px;
  box-shadow: var(--_focus-shadow-inset);
}

/* MultiSelect */
.ds-input-group[data-multiple] {
  --_tag-h: var(--cmp-tag-height-md);
  --_inset: calc((var(--_h) - 2px - var(--_tag-h)) / 2);
  --_corner: min(var(--cmp-input-radius), calc(var(--_h) / 2));
  align-items: flex-start;
  padding-inline-start: 0;
  border-radius: var(--_corner);
  cursor: text;
}
.ds-input-group[data-multiple][data-size="sm"] {
  --_tag-h: var(--cmp-tag-height-sm);
}
.ds-input-group[data-multiple][data-disabled] {
  cursor: not-allowed;
}
.ds-combobox__values {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cmp-tag-gap);
  min-width: 0;
  padding-block: var(--_inset);
  padding-inline-start: var(--_inset);
}
.ds-combobox__tags {
  display: contents;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ds-combobox__tags > li {
  display: flex;
  min-width: 0;
  max-width: 100%;
}
.ds-combobox__values > .ds-input-group__input {
  --_lead: calc(var(--cmp-input-padding-x) - var(--_inset));
  --_least: calc(var(--ds-size-control-lg) + var(--_lead));
  flex: 1 1 var(--_least);
  align-self: center;
  min-width: var(--_least);
  max-width: 100%;
  height: var(--_tag-h);
  padding-inline-start: var(--_lead);
}
@supports (field-sizing: content) {
  .ds-combobox__values > .ds-input-group__input {
    flex-basis: auto;
    field-sizing: content;
  }
}
.ds-input-group[data-multiple][data-disabled] .ds-tag {
  border-color: var(--cmp-tag-fg-disabled);
}
.ds-input-group[data-multiple] .ds-input-group__slot {
  height: calc(var(--_h) - 2px);
}
```

The two text rules of `recipes.test.ts` (names the token build declares, no raw colour, radius, shadow or font) were applied by script to this block in a scratch run, and it passes both. The test itself runs on the builder's real file. `field-sizing` is the one property new to `recipes.css`; `@supports` and `min()` are already there.

## Tokens and contrast

No new token and no new pair. The table lists what the look relies on, read from the rendered tokens, as light and dark.

<!-- prettier-ignore -->
| Pair | Neutral | Friendly | Professional | Note |
| --- | --- | --- | --- | --- |
| `input.icon` on `input.bg` | 6.78, 7.04 | 5.54, 6.75 | 5.49, 6.78 | Text and UI floor met |
| `focus.ring` on `menu.option.bg-hover` | 6.45, 4.79 | 3.09, 4.20 | 10.69, 4.48 | Not a contract pair today. Only the option in `needs_decision` would need it |
| `menu.option.fg-disabled` on `menu.option.bg-selected` | 3.28, 4.06 | 3.36, 4.89 | 3.35, 5.09 | At least 3.0; the same combination `Select` has |
| `menu.option.bg-hover` on `menu.bg` | 1.10, 1.18 | 1.14, 1.50 | 1.16, 1.50 | The active ground. See D12 |
| `menu.option.bg-selected` on `menu.bg` | 1.11, 1.10 | 1.05, 1.47 | 1.06, 1.52 | Why the check glyph matters, D7 |

## Spec amendments this design needs (L-0019)

For product to take in. Each keeps the rule's intent and changes the text the builder would otherwise follow.

**A1, `cbx-recipe-1`, the popup (D4).**
Old: "`.ds-combobox__popup`, beside `ds-menu`: `min-width: var(--radix-popover-trigger-width)`, `max-width: var(--radix-popover-content-available-width)`, `max-height: var(--radix-popover-content-available-height)`, flex column."
New: "`.ds-combobox__popup`, beside `ds-menu`: `width` and `min-width: var(--radix-popover-trigger-width)`, `max-width: var(--radix-popover-content-available-width)`, `max-height: min(var(--radix-popover-content-available-height), var(--ds-size-panel-default))`, flex column."

**A2, `cbx-recipe-1`, the slot buttons (D1, D2, D3).**
Old: "`.ds-combobox .ds-input-group[data-size="sm"] .ds-input-group__slot > .ds-button`: `min-height: var(--ds-size-icon-lg)`."
New: "`.ds-combobox .ds-input-group__slot > .ds-button`: square, of side `--_b`, the inner field height less twice `--cmp-input-group-inset`, and `--ds-size-icon-lg` at sm; gap `--cmp-input-group-inset`; only the last button in the end slot takes the end margin, which puts its glyph where `Select`'s chevron sits; ink `--cmp-input-icon` until hover or disabled."

**A3, `cbx-recipe-1`, the panel line (D5).**
Old: "`.ds-combobox__popup .ds-menu__empty`: `overflow-wrap: anywhere`, so a long Thai query wraps; `[data-tone="error"]` reads `--cmp-menu-option-fg-destructive`."
New: "`.ds-combobox__popup .ds-menu__empty`: `overflow-wrap: anywhere`, so a long Thai query wraps; start aligned, gap `--cmp-button-gap`, `padding-block: var(--cmp-menu-padding)`; its `svg` takes the option icon size and sits on the first line; `[data-tone="error"]` reads `--cmp-menu-option-fg-destructive`."

**A4, `cbx-async-1`, pending ring and error glyph (D6).**
Old: "the visible line starts with a `decorative` `Spinner`, since this control owns its status (`spinner.yaml` line 25). A rejection that is not an abort sets the phase to `error`; the next text edit searches again."
New: "the visible line starts with a `decorative` `Spinner` at `size="sm"`, since this control owns its status (`spinner.yaml` line 25). A rejection that is not an abort sets the phase to `error`, and the visible line takes `data-tone="error"` and starts with `WarningIcon`, `aria-hidden`; the next text edit searches again."
Row 35, old: "with the error tone". New: "with the error tone and the warning glyph".

**A5, `cbx-aria-1`, the check glyph (D7).**
Old: "Options use the existing classes and attributes: `ds-menu__option` with `data-highlighted` when active, `data-state="checked"` when chosen, `data-disabled`, `data-described` and `data-icon`."
New: the same sentence, then: "A chosen option shows `CheckIcon className="size-4 shrink-0"` after its label, as `Select.tsx` line 188 does."

**A6, `ms-api-1`, the field (D8, D11).**
Old: "The field is a `div.ds-input-group` in the `.ds-combobox` root, with `data-multiple`, the `ds-input-group__input` class on the input so the group's focus edge works, and the same chevron as `cbx-open-1`. Tags wrap inside it."
New: "The field is a `div.ds-input-group` in the `.ds-combobox` root, with `data-multiple`, the `ds-input-group__input` class on the input so the group's focus edge works, and the same chevron as `cbx-open-1`. The `ul` and the input sit in `.ds-combobox__values`, which wraps, and the end slot stays beside it on the first row. With no tags there is no `ul`. The placeholder shows only with no tags. A press on the ground of `.ds-combobox__values` puts focus in the input."

**A7, `ms-recipe-1`, the recipe (D8 to D11).**
Old: "`.ds-combobox__tags` (flex, wrap, gap from `--cmp-tag-gap`, list reset, `min-width: 0`), and `.ds-input-group[data-multiple]` (`flex-wrap: wrap`, height growing with its rows, block padding and the input's least width from existing `--ds-size-*` and `--ds-space-*` names chosen in design.md)."
New: "`.ds-combobox__values` (flex, wrap, gap from `--cmp-tag-gap`, `min-width: 0`, the inset of design.md D9 as its padding), `.ds-combobox__tags` (`display: contents`, list reset, so the input flows after the last tag), and `.ds-input-group[data-multiple]` (no `flex-wrap`, height growing with its rows, the corner of design.md D9). The input's height and least width are those of design.md D11, the slot's height is one row, and a disabled tag takes the edge of design.md D10."

**A8, `ms-choose-1`, the scroll (Q8).**
Old: "The list stays open, the text empties and no option stays active."
New: "The list stays open, the text empties and no option stays active. When the text was already empty the list keeps its scroll position; when it held a query the list refills from the top."

**A9, row 54, the input's height (D11).**
Old: "the input's height is the field row's".
New: "the input's height equals the tag's: 24, 32 and 32 px".

## Known limits

- A choice that adds a row moves the popup down about 36 px under a resting pointer. It is honest to the layout, and the pointer lands on another row. Multi-row picks by pointer will feel this. Left as it is, since moving the popup above the field or pinning it would hide the field that just changed.
- Tags grow the field without bound. A limit on visible tags stays with open question 10.
- `display: contents` on the `ul`: Chromium's accessibility tree keeps the named list and its items (read from an aria snapshot of the render). WebKit was not run. Row 60's addon does not prove this for Safari, so `ms-webkit-1` reads it in WebKit before PR C.
- `field-sizing`: only Chromium was rendered. Without it, by the CSS, the input keeps its least basis and long text scrolls inside it.
- Static injection means popup collision at the screen's bottom edge was not seen. Row 22 proves the sides and the room left at 360 px on the real component.

## Screens to check in visual QA

<!-- prettier-ignore -->
| Story | Rows | Check |
| --- | --- | --- |
| Combobox `Default`, `Sizes`, `Clearable` | 17, 28 | Next to a `Select`: same height, text start and chevron place. Clear and chevron do not touch. Focus edge and no list after Tab |
| Combobox `Open`, `ActiveOnChosen`, `Grouped`, `IconsAndDescriptions`, `LongList` | 11, 28 | Active, chosen, chosen and active read as three. Popup at the field's width, 4 px under it. A cut row at the foot of a long list. Hover in both locales |
| Combobox `NoMatch`, `NoOptions`, `Invalid`, `Disabled`, `At360`, `RecipesAndModes` | 22, 28 | A long Thai query wraps in the panel with marks whole. The danger edge is one line. Disabled has no stray ink |
| Combobox `Async`, `AsyncPending`, `AsyncEmpty`, `AsyncError` | 41 | Ring, plain text and triangle read as three states. The mock note reads as a note, under the field |
| MultiSelect `Default`, `Sizes` | 54, 62 | With no tags, the same pixels as Combobox. With tags, the same field height. Tags concentric with the corner at sm, md, lg and friendly md |
| MultiSelect `Open`, `ManyTagsAt360` | 56, 62 | The chevron stays on the first row. The corner does not change with the row count. No blank row unless the input has taken it to type |
| MultiSelect `Invalid`, `Disabled`, `RecipesAndModes` | 55, 62 | Disabled tags keep their pill. A remove ring at sm stays concentric, and the field shows no edge while it has focus |

For every story: the eight shots of visual sign-off, and Thai stacks at 3x in the input, which no helper can read.

## Proposal screenshots

All under `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-1/`. The names are `<board>-<profile>-<mode>-<width>-<locale>.png`. This folder is scratch, so the main session keeps the contact sheet if it is to outlive the session.

- Contact sheet, every proposal screen with its name: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-1/contact-sheet.png`

<!-- prettier-ignore -->
| Set | Profiles and modes | Widths | Locale | PNGs |
| --- | --- | --- | --- | --- |
| Asked for | neutral and friendly, light and dark | 360, 1440 | Thai | 32 |
| Extra | professional, dark | 360, 1440 | Thai | 8 |
| Extra | neutral, light | 360, 1440 | English | 8 |
| 3x Thai stacks and sm remove, `check-zoom-*` | neutral and friendly, light and dark | 480 | Thai | 4 |
| 3x focus rings, `ring-*` | neutral light, neutral dark, friendly dark, professional dark | 520 | Thai | 4 |
| Option for the owner, `alt-active-list-neutral-light-1440-th.png` | neutral, light | 1440 | Thai | 1 |

The four boards are `field` (states, sizes, beside `Select`), `list` (open, active, chosen, grouped, icons, 40 options), `status` (no match, long query, no options, prompt with the mock note, pending, error) and `multi` (empty to five tags, sizes, focus, hover, typing, invalid, disabled, open after a choice). Examples:

- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-1/field-neutral-light-1440-th.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-1/list-friendly-dark-360-th.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-1/status-neutral-dark-1440-th.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-1/multi-friendly-light-360-th.png`
