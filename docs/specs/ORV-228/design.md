---
issue: ORV-228
spec: docs/specs/ORV-228/spec.md v1.3
task: ORV-228-design-1, reworked by ORV-228-design-2
date: 2026-11-06
---

# ORV-228 design: Combobox and Multi-select

This file sets the look of `cbx-recipe-1` and `ms-recipe-1`, answers open questions 3, 8, 9 and 13, and gives the builder the CSS and markup per named rule. No answer differs from its default. The look adds no token. Two contrast pairs come with the scroll cue of D17. Amendments A1 to A9 are taken in by spec v1.1; A10 to A16 come from the rework of sign-off 1 and are taken in by spec v1.3. Section "Rework from sign-off 1" holds findings F1 and F2.

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
  .ds-combobox__scroll                  ScrollArea.Root type="auto", with options, or busy
    .ds-combobox__list[role=listbox]    ScrollArea.Viewport, the scroll box and the clip frame
      div                               Radix's own wrapper, set to block
        .ds-menu__option ...
    .ds-scroll__bar                     ScrollArea.Scrollbar, only while the list overflows
      .ds-scroll__thumb                 ScrollArea.Thumb
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
- Small screens: every board was rendered at 360 px. The popup keeps the field's width. At 360 px two tags and a clear button can fill a row, so the input takes its own row, which is the row to type in. The field never goes under its least width (D15), and a row of fields stacks when its cells would go under a readable width (D16).
- A long list: a thumb says the list scrolls, at any row height and any available height (D17). A list that fits has no thumb.
- Reduced motion: this design adds no transition and no animation. The chevron does not rotate and the popup does not animate, the same as `Select`. The thumb has no fade and no transition, so it reads the same with reduced motion. The ring keeps turning by the Spinner's own rule, as it is the only sign of waiting.

## Visual decisions

<!-- prettier-ignore -->
| # | Decision | Value (tokens) | Source intent |
| --- | --- | --- | --- |
| D1 | Combobox reads as one control with `Select`: same field height, same start of text, same chevron place and ink | Chevron glyph centre 27 px from the field's end at sm, md and lg in all three profiles, measured against `Select`. Ink `--cmp-input-icon`, 6.78 and above on `input.bg` in neutral | Row 28 "reads as one control with `Select`". The plain ghost Button sat 7 px off and in another ink |
| D2 | Slot buttons are square | Side `--_b`: inner field height less twice `--cmp-input-group-inset`, so 30 at md, 38 at lg (friendly md 34). sm is `--ds-size-icon-lg`, 24 | `cbx-target-1`. At 32 px wide the hover ground was not a square, and it did not match the round or square corner of the field's end |
| D3 | Clear and chevron sit side by side with a gap | Gap `--cmp-input-group-inset`, end margin only on the last button | The slot rule's negative margin applied to both, and they overlapped by 4 px (defect in the spec's approach, A2) |
| D4 | The popup is exactly the field's width, and its height is capped. It promises nothing about the row at its foot | `width` and `min-width` from `--radix-popover-trigger-width`. `max-height: min(available height, --ds-size-panel-default)`, 320 px | A popup that follows its content would jump in width with each letter. At the full available height a 40-option list would cover the screen. How much of a row shows at the foot is not a cue: it moves with the row height, the description lines, the groups and the available height (F2 measured 38 of 44 px, whose text reads whole, and 2.2 of 40 px, with no ink). The scroll cue is D17 and rests on no row count (rewritten for F2) |
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
| D15 | The input has a least width and the field holds it, so the slot never leaves the field and the chevron never leaves Select's place (F1) | Input `width` and `min-width` `--ds-size-control-lg`, 48 px, the least of D11, and it grows from there. `.ds-combobox` with one field takes `min-width: min-content`. Least field, with clear, sm 140, md 149 (friendly 155), lg 161 px. Without clear, 112, 115 (friendly 117), 119 px. Chevron 27.0 px from the end at each of them | Row 28: one control with `Select`, also at the narrowest container. A least width on the input alone would push the slot further out, as the group's own width is `100%`. So the root gives way, and the root is the Popover anchor, which keeps popup and field one width. Measured at 200 to 1440 px: no case under 48 px, no spill, the chevron equal to `Select`'s |
| D16 | Fields of a row stack when the row's cells get under a readable width (F1) | The `Sizes` rows are one column under a 42 rem container (`@2xl`, 672 px) and three at it, by a container query, so the rule follows the story's room and not the screen. `gap-2` inside a size, `gap-8` between sizes when stacked. At 360 px each field is 328 px, and the chevrons of a size sit on one line. At 672 px a lg field is 213 px, with a 100 px input, and the value reads whole | A control's least width keeps it whole, not readable: 48 px shows "Save..." and no more. Stacked, the value reads whole at every size from 280 px up. At 1440 no box moves |
| D17 | A long list says it scrolls with a thumb, the system's own scroll mark (F2) | Radix `ScrollArea` round the list, `type="auto"`: the thumb shows exactly while the list overflows. It sits in the popup's end padding, so never on a row: bar `--cmp-menu-padding`, 8 px, thumb 6 px, 2 px from the popup's outer edge. Its ends stay `--cmp-menu-radius / 2` clear of the corner. Ink at rest `--cmp-scroll-area-thumb-hover`, on hover `--cmp-scroll-area-thumb`, 4.90 and 10.21 at the least. Length follows the share of the list in view, 18 px at the least. No fade, no transition, no change to the row | Sign-off 1, F2, and the QA row of `LongList`: a cue in every profile at every available height. `ScrollArea` is the team's pattern, and it draws the bar itself because overlay bars hide at rest. The thumb gives size and place as well, and needs no row count. It has no fill on a row, no check and no danger ink, so it reads as neither selection nor error. Ink: at rest the system's own `thumb` is 10 to 18 to 1, the strongest ink in the panel, and a long thumb read as a black edge, so it takes the calmer token here and goes stronger on hover. Candidates in "Rework from sign-off 1" |

## Builder table: CSS and markup per rule

All CSS goes in `recipes.css`, after `.ds-menu`, in the block at the end of this section. Every value is a `--ds-*` or `--cmp-*` property, a local `--_*`, a Radix variable or a keyword. `--_h` and `--_focus-shadow-inset` are the recipe locals already in use. `border-radius` reads a local because `recipes.test.ts` asks a radius line to start with `var(`.

<!-- prettier-ignore -->
| Rule | Markup | CSS | Play that proves it |
| --- | --- | --- | --- |
| `cbx-base-1` | `<Popover.Content className="ds-menu ds-combobox__popup" side="bottom" align="start" sideOffset={4} collisionPadding={8}>`. 4 is `Select`'s offset, not `Popover`'s default of 6. `collisionPadding` 8 came with the build: without it the popup ended 0.2 px past a 640 px viewport (ORV-228-build-1, row 22) | `.ds-combobox`, `.ds-combobox__popup` | Row 21, plus a read of the gap in row 4 |
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
| `cbx-recipe-1` | As anatomy. List markup in "Rework from sign-off 1", item 2 | Combobox part of the block | Rows 11, 12, 17, 22 |
| `cbx-stories-1` | Mock note: `<p class="ds-field__description">` as a `Field` child after the control. `Sizes`, `LeastWidth`, `LongListFriendly`, `At360Friendly` as in "Rework from sign-off 1", items 3 to 7. MultiSelect `Sizes` in PR C takes the same stacked rows | None | Rows 12, 17, 22, 30 |
| `cbx-ink-1` | Frames as its table says | `.ds-combobox__list` stays the clip frame, now through the Radix Viewport's inline `overflow-y`. The wrapper Radix adds has no clip. No class in the block adds a clip between a frame and its element | Rows 22, 37, 56 |
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
/* D15: with one field, the root never goes under its content, and it is the popup's anchor. */
.ds-combobox:has(> .ds-input-group > .ds-input-group__input) {
  min-width: min-content;
}
.ds-combobox .ds-input-group > .ds-input-group__input {
  width: var(--ds-size-control-lg);
  min-width: var(--ds-size-control-lg);
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
/* D17: the thumb lives in the popup's end padding. `.ds-scroll` rules come later in this file, so the
   bar's selector carries the attribute to outrank the `.ds-scroll__bar[data-orientation]` width. */
.ds-combobox__scroll {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.ds-combobox__list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
/* Radix wraps the options in a `display: table` div that grows to the widest label. A block keeps
   long labels on their ellipsis, as `.ds-taskbar__scroll` does. The `LongList` play goes red if Radix changes it. */
.ds-combobox__list > div {
  display: block !important;
}
.ds-combobox__scroll > .ds-scroll__bar[data-orientation="vertical"] {
  width: var(--cmp-menu-padding);
  margin-block: calc(var(--cmp-menu-radius) / 2);
  margin-inline-end: calc(-1 * var(--cmp-menu-padding));
}
.ds-combobox__scroll .ds-scroll__thumb {
  background: var(--cmp-scroll-area-thumb-hover);
}
.ds-combobox__scroll .ds-scroll__thumb:hover {
  background: var(--cmp-scroll-area-thumb);
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

The two text rules of `recipes.test.ts` (names the token build declares, no raw colour, radius, shadow or font) were applied by script to this block in a scratch run, and it passes both. The test itself runs on the builder's real file. `field-sizing` is the one property new to `recipes.css`; `@supports` and `min()` are already there. The rules added by ORV-228-design-2 read five names, each declared in `generated.css`: `--ds-size-control-lg`, `--cmp-menu-padding`, `--cmp-menu-radius`, `--cmp-scroll-area-thumb`, `--cmp-scroll-area-thumb-hover`. Their one raw value is `min-content`, a keyword.

## Rework from sign-off 1 (ORV-228-design-2)

Sign-off `ORV-228-signoff-1` asked for changes on head 02ef2ad with two Important findings. This section is the builder's source for both, with D4, D15, D16, D17 and the CSS block above. S1 went to a follow-up and is out of this task.

<!-- prettier-ignore -->
| Finding | What was wrong | Decision | Target | Play that proves it |
| --- | --- | --- | --- | --- |
| F1 | `Sizes` at 360: three columns made each field 98.7 px. Input 6.7, 0, 0 px. Chevron 27, 24.66, 12.66 px from the end, friendly md 18.66. The lg chevron button spilled 6.34 px past the field. Row 17's play ran at the default viewport and could not see it | D15, D16 | Input at least 48 px. Chevron 27.0 px from the end, equal to `Select`'s. Slot inside the field. `Sizes` one column under a 672 px container, the value whole. Least field 140, 149 (friendly 155), 161 px | `Sizes` play run a second time inside `atPhoneSize`; new `LeastWidth` play in a 96 px cell |
| F2 | The foot row showed 38 of 44 px with whole text in friendly `LongList`, and 2.2 of 40 px with no ink in neutral `At360`, so nothing said the list scrolls. D4's 6.86 rows was right arithmetic and a poor cue (L-0019) | D4 rewritten, D17 | A thumb of at least 18 px while `scrollHeight` is above `clientHeight`, none otherwise, in the popup's end padding, off the rows and off the corner | `expectScrollCue` at 40 px rows in `LongList` and `At360`, at 44 px rows in `LongListFriendly` and `At360Friendly`; the negative in `Open` |

Why a thumb, from candidates rendered on the real `LongList` popup. Sheet: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/candidates/compare.png`

<!-- prettier-ignore -->
| Candidate | Verdict | Reason |
| --- | --- | --- |
| Thumb in the end padding | Chosen | Clear in all four profile and mode pairs. Covers nothing. Holds at every height. Also tells how long the list is and where the reader is. It is the system's `ScrollArea` mark |
| Foot fade over the rows | Rejected | The faded row reads like a disabled option, which is a state this list has. It lies over content, and over Thai marks, and an active row under it needs a scroll offset. It needs a script state to go away at the list's end |
| Shade behind the rows, `background-attachment: local` | Rejected | Needs no script, but it renders as a hard band in the token inks, and a chosen or hovered row's ground covers it, which is where the keys put the active row |
| A list height that always cuts through a row's text | Rejected | Row arithmetic again. Descriptions, groups and the available height all move the foot, so no height can promise it. This is the defect F2 names |
| Styled native scrollbar | Rejected | `::-webkit-scrollbar` does nothing on iOS, and an overlay bar hides at rest in Firefox on macOS. The cue must not rest on the platform |

What each item below changes. All paths are under `packages/design-system/src/`.

1. `recipes/recipes.css`: the rules marked D15 and D17 in the CSS block above, in the Combobox part. `recipes/pairs.ts`: the two pairs of "Tokens and contrast", recipe `menu`, floor UI. `catalog/base/combobox.yaml` (package root), the popup rule, gains: "A list that overflows shows the ScrollArea thumb in the popup's end padding." and a new rule: "The field never goes under its least width, 48 px of input plus the slot: 140, 149, 161 px with clear. Stack fields under a row whose cells are narrower."

2. `components/combobox/Combobox.tsx`: import `ScrollArea as ScrollAreaPrimitive` from `radix-ui` beside `Popover`, then in place of the listbox `div`:

```tsx
<ScrollAreaPrimitive.Root type="auto" className="ds-combobox__scroll">
  <ScrollAreaPrimitive.Viewport
    role="listbox"
    id={list.listId}
    aria-label={m.combobox.list}
    className="ds-combobox__list"
  >
    {/* the groups and options, unchanged */}
  </ScrollAreaPrimitive.Viewport>
  <ScrollAreaPrimitive.Scrollbar className="ds-scroll__bar" orientation="vertical">
    <ScrollAreaPrimitive.Thumb className="ds-scroll__thumb" />
  </ScrollAreaPrimitive.Scrollbar>
</ScrollAreaPrimitive.Root>
```

The `.ds-combobox__list` element stays the listbox, the scroll box and the frame of `cbx-ink-1`, so `scrollIntoView`, `scrollTop` and rows 12, 22 and 45 read the same node. The `ScrollArea` component itself does not fit: it sets `role="region"`, a label and a Tab stop on the Viewport, and the list has focus in the input.

3. `components/combobox/Combobox.stories.tsx`, `Sizes`, the render. Only the wrappers and the row's classes change:

```tsx
<div className="@container max-w-3xl">
  <div className="flex flex-col gap-8 @2xl:gap-4">
    {SIZES.map((size, i) => (
      <div
        key={size}
        data-testid={size}
        className="grid grid-cols-1 items-start gap-2 @2xl:grid-cols-3 @2xl:gap-4"
      >
        {/* the Combobox, the Select and the Input, unchanged */}
      </div>
    ))}
  </div>
</div>
```

These are the first container classes in the package. Tailwind 4.3.3 builds them from `@import "tailwindcss"` with no setup, read from its compiler: `.@container` gives `container-type: inline-size`, and `@2xl:` gives `@container (width >= 42rem)`.

4. `Sizes`, the play. Move `fromEnd` to the top of the file, wrap the loop in `const check = async () => { ... }`, and end the play with `await check(); if (inVitest) await atPhoneSize(check);`. Add to the loop, after the chevron's place is read:

```tsx
// F1: the input keeps its least width, the slot stays in the field, the value reads whole.
await expect(input.getBoundingClientRect().width).toBeGreaterThanOrEqual(
  resolvedLength(row, "--ds-size-control-lg"),
);
await expect(chevron.getBoundingClientRect().right).toBeLessThanOrEqual(
  group.getBoundingClientRect().right,
);
const box = input as HTMLInputElement;
await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
```

5. A new twin story, after `Sizes`. A cell narrower than the least field is the case the sign-off's width sweep found, so it gets its own fixture:

```tsx
/** D15: in a cell under the least field, the field keeps its least width and the slot stays in it. */
const leastWidth = twin((c) => ({
  render: (args) => (
    <div className="flex flex-col gap-4">
      {SIZES.map((size, i) => (
        <div key={size} data-testid={size} className="w-24">
          <Combobox
            {...args}
            options={c.options}
            size={size}
            defaultValue={opt(c, "latin")}
            clearable
            aria-label={`${c.label} ${c.sizes[i]}`}
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [i, size] of SIZES.entries()) {
      const row = canvas.getByTestId(size);
      const input = within(row).getByRole("combobox", { name: `${c.label} ${c.sizes[i]}` });
      const group = groupOf(input);
      const chevron = within(row).getByRole("button", { name: c.open });
      await expect(input.getBoundingClientRect().width).toBeGreaterThanOrEqual(
        resolvedLength(row, "--ds-size-control-lg"),
      );
      await expect(chevron.getBoundingClientRect().right).toBeLessThanOrEqual(
        group.getBoundingClientRect().right,
      );
      // Select's chevron place: the field's padding, half the glyph, the border.
      const place =
        resolvedLength(row, "--cmp-input-padding-x") +
        resolvedLength(row, "--ds-size-icon-md") / 2 +
        1;
      await expect(near(fromEnd(group, chevron.querySelector("svg") as SVGElement), place)).toBe(
        true,
      );
      // The root is the anchor, so the popup stays the field's width.
      await userEvent.click(chevron);
      const listbox = await body().findByRole("listbox");
      await waitFor(() =>
        expect(
          near(popupOf(listbox).getBoundingClientRect().width, group.getBoundingClientRect().width),
        ).toBe(true),
      );
      await userEvent.keyboard("{Escape}");
      await closed();
    }
  },
}));
export const LeastWidth: Story = leastWidth.th;
export const LeastWidthInEnglish: Story = leastWidth.en;
```

6. The cue's helper, beside `expectNoClipBetween`. The row height is pinned only under Vitest, because the Storybook toolbar can change the profile of a story:

```tsx
/** D17: while the list overflows a thumb shows in the popup's end padding, whatever the row height. */
async function expectScrollCue(listbox: HTMLElement, rowHeight: number) {
  const row = within(listbox).getAllByRole("option")[0] as HTMLElement;
  if (inVitest) {
    expect(near(row.getBoundingClientRect().height, rowHeight, 0.5), `row of ${rowHeight}`).toBe(
      true,
    );
  }
  await expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
  const popup = popupOf(listbox);
  const thumb = await waitFor(() => {
    const el = popup.querySelector<HTMLElement>(".ds-scroll__thumb");
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
  const box = thumb.getBoundingClientRect();
  const list = listbox.getBoundingClientRect();
  const frame = popup.getBoundingClientRect();
  // Off the rows, inside the popup, clear of its corner, and long enough to read.
  await expect(box.left).toBeGreaterThanOrEqual(list.right);
  await expect(box.right).toBeLessThanOrEqual(frame.right - 1);
  const clear = resolvedLength(popup, "--cmp-menu-radius") / 2;
  await expect(box.top - frame.top).toBeGreaterThanOrEqual(clear);
  await expect(frame.bottom - box.bottom).toBeGreaterThanOrEqual(clear);
  await expect(box.height).toBeGreaterThanOrEqual(18);
  await expect(getComputedStyle(thumb).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  return thumb;
}
```

7. The plays that call it:

- `LongList`: right after `findByRole("listbox")`, `const thumb = await expectScrollCue(listbox, 40); const before = thumb.getBoundingClientRect().top;`. After Down Arrow 30 and the check that the active row is in view: `await expect(thumb.getBoundingClientRect().top).toBeGreaterThan(before);`. Then a press on the bar leaves the field alone: `await userEvent.click(thumb); await expect(input).toHaveFocus(); await expect(body().getByRole("listbox")).toBe(listbox);`. The long label stays on its ellipsis, the proof of the block wrapper: `await expect(listbox.scrollWidth).toBeLessThanOrEqual(listbox.clientWidth);`.
- `LongListFriendly`, new: the `LongList` render inside `<DesignProfileBoundary profile="friendly" mode="light"><div className="bg-surface-canvas p-4 font-body text-text-primary">`, the form of `InsideProfile`. Play: press the chevron, `await expectScrollCue(listbox, 44);`, Escape, `closed()`.
- `At360`: after the `waitFor` on the second field's popup, `await expectScrollCue(listbox, 40);`.
- `At360Friendly`, new: move the frame of `At360` into a `const at360Frame = () => (...)`, and render it in the same friendly boundary. Play, inside `atPhoneSize`: press the second chevron, read the popup as `At360` does with `box.height` below the cap, `await expectScrollCue(listbox, 44);`, Escape, `closed()`.
- `Open`, the negative, before the hover step: `await waitFor(() => expect(popup.querySelector(".ds-scroll__bar") !== null).toBe(listbox.scrollHeight > listbox.clientHeight));`. It reads the overflow on purpose: seven rows fit at 40 px, and overflow by 6 px at 44 px, where the thumb is right to show.

Spec rows stay inside PR 194's `rows 1-29`: the plays above extend rows 12, 17 and 22 (A13 to A15), so no row number is added. Two risk-flag notes for the main session: the recipe and `pairs.ts` change, and `Combobox.tsx` now uses `ScrollArea` from the `radix-ui` it already has, so no dependency is added.

Checked against what sign-off 1 measured. The 160 shots hold 128 with a popup, and the popup rows below read those 128:

<!-- prettier-ignore -->
| Measure | Sign-off 1 | With the proposal |
| --- | --- | --- |
| Popup width and left | Equal to the field | Equal to the field |
| Gap | 4.2 px | 4.2 px, and 4 px in the 6rem cell of `floor-open`, a scene sign-off 1 did not have |
| List height, `LongList` | 302 px | 302 px, popup 320 px |
| Row height | 40, friendly 44 px | 40, friendly 44 px |
| `Sizes` at 1440, field | 245.3 px, heights 32, 40, 48 (friendly md 44) | The same. 0 of 57 boxes moved |
| `Sizes` at 1440, chevron | 27.0 px, equal to `Select` | 27.0 px, equal to `Select` |
| `Sizes` at 1440, pixels | | Recipe rules alone: 0 pixels change, neutral light and friendly dark. Story markup stand-in: 129 to 143 pixels of 1.3 million, by at most 2 of 255 per channel, with no box moved, against 0 in a control run |
| 12 other stories at 360 and 1440 | | 0 boxes moved by the recipe rules, no page overflow |

How this was proven, and what was not:

- The shots are the real Combobox stories on the PR head with the proposed CSS injected. No file under `packages/` changed, so the markup of the proposal is not in those stories.
- In the 160 shots the thumb is a script stand-in: a `.ds-scroll__bar` and `.ds-scroll__thumb` appended to the popup, with Radix's own length and offset formula and the box of the rules above. `story.css` stands in for the Tailwind classes of the `Sizes` change. The `.ds-combobox__list > div` rule was left out of them, since this head has no Radix wrapper for it to hold, and an option row would take it instead.
- The real part ran apart from the stories: `ScrollArea` from Storybook's own bundle, mounted with the proposed markup and CSS, with the proposal first in `<head>` as the worst source order. At 700, 300 and 120 px of room the popup was 320, 300 and 120 px, the list 302, 282 and 102 px. The bar was 8 px wide and 0 px from the list's end. The thumb was 6 px wide, and 18 px at its least. The wrapper computed to `block`, the long label clipped, nothing overflowed sideways, `scrollIntoView` kept the active row inside, and a 4-row list had no bar.
- Not run: the real `Combobox.tsx` with `ScrollArea` in it, keys and a press on the thumb against it, WebKit, iOS and a screen reader. The plays in item 7 are the first run of the keys and the press, so a failure there comes back to this row, not to the builder's judgement.

## Tokens and contrast

No new token. Two new pairs, both UI at 3.0, both for `pairs.ts` (A12): `scroll-area.thumb-hover` and `scroll-area.thumb` on `menu.bg`. The table lists what the look relies on, read from the rendered tokens, as light and dark.

<!-- prettier-ignore -->
| Pair | Neutral | Friendly | Professional | Note |
| --- | --- | --- | --- | --- |
| `input.icon` on `input.bg` | 6.78, 7.04 | 5.54, 6.75 | 5.49, 6.78 | Text and UI floor met |
| `focus.ring` on `menu.option.bg-hover` | 6.45, 4.79 | 3.09, 4.20 | 10.69, 4.48 | Not a contract pair today. Only the option in `needs_decision` would need it |
| `menu.option.fg-disabled` on `menu.option.bg-selected` | 3.28, 4.06 | 3.36, 4.89 | 3.35, 5.09 | At least 3.0; the same combination `Select` has |
| `menu.option.bg-hover` on `menu.bg` | 1.10, 1.18 | 1.14, 1.50 | 1.16, 1.50 | The active ground. See D12 |
| `menu.option.bg-selected` on `menu.bg` | 1.11, 1.10 | 1.05, 1.47 | 1.06, 1.52 | Why the check glyph matters, D7 |
| `scroll-area.thumb-hover` on `menu.bg` | 6.60, 7.04 | 5.37, 4.90 | 5.34, 4.91 | New pair, the thumb at rest, D17 |
| `scroll-area.thumb` on `menu.bg` | 17.64, 14.75 | 16.14, 10.39 | 16.27, 10.21 | New pair, the thumb on hover, D17 |

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

**A10, `cbx-recipe-1`, the field's least width (D15).**
Old: "`.ds-combobox`: block, full width."
New: "`.ds-combobox`: block, full width. With one field, `min-width: min-content`, and its input `width` and `min-width` `--ds-size-control-lg`, so the field holds its least width, the slot stays in the field and the chevron keeps `Select`'s place in any container."

**A11, `cbx-recipe-1`, the list and its thumb (D17).**
Old: "`.ds-combobox__list`: `overflow-y: auto`, `min-height: 0`."
New: "`.ds-combobox__scroll` (Radix `ScrollArea.Root`, `type="auto"`): flex column, `min-height: 0`. `.ds-combobox__list` (its Viewport): `overflow-y: auto`, `min-height: 0`, and Radix's inner wrapper set to block. `.ds-scroll__bar` and `.ds-scroll__thumb` in it take design.md D17: the thumb sits in the popup's end padding, clear of the corner, in `--cmp-scroll-area-thumb-hover` at rest and `--cmp-scroll-area-thumb` on hover, and shows exactly while the list overflows. No row count is promised at the popup's foot."

**A12, `cbx-recipe-1`, the pairs (D17).**
Old: "No new token and no new contrast pair: option, highlighted, selected, description, disabled, empty line, destructive and "checked highlighted ring" are existing `menu` pairs (`pairs.ts` lines 269 to 312, 671 to 692), and the slot buttons' ink is the existing `control` pair `input.icon` on `input.bg` (`pairs.ts` line 253)."
New: "No new token. Option, highlighted, selected, description, disabled, empty line, destructive and "checked highlighted ring" are existing `menu` pairs (`pairs.ts` lines 273 to 318, 676 to 698), and the slot buttons' ink is the existing `control` pair `input.icon` on `input.bg` (`pairs.ts` line 258). Two new `menu` pairs at the UI floor: `scroll-area.thumb-hover` and `scroll-area.thumb` on `menu.bg`."
The same change in "Contract changes and impact", row "Recipe classes", old: "They read `ds-menu__option`, `ds-menu__empty` and `ds-input-group`, so a change to those recipes moves both components. No token in any layer, no profile". New: "They read `ds-menu__option`, `ds-menu__empty`, `ds-input-group` and `ds-scroll__bar`, so a change to those recipes moves both components. Two new pairs in `pairs.ts` (A12). No token in any layer, no profile".

**A13, row 12, the cue (D17).**
Old, in the row's check: "with the field near the top of the frame, the popup's height is 320 px, the cap of A1 on real Radix values (`cbx-keys-1`, `cbx-recipe-1`, W6)".
New: "with the field near the top of the frame, the popup's height is 320 px, the cap of A1 on real Radix values; a thumb shows in the popup's end padding, off the rows, clear of the corner and at least 18 px long, at 40 px rows and, in `LongListFriendly`, at 44 px rows; it moves down with the list; a press on it keeps focus in the input and the list open; `Open` has a thumb only if its list overflows (`cbx-keys-1`, `cbx-recipe-1`, W6)".
Row 12's proof, old: "`LongList` play, `getBoundingClientRect()`". New: "`LongList`, `LongListFriendly` and `Open` plays, `getBoundingClientRect()`".

**A14, row 17, the narrow container (D15, D16).**
Old, in the row's check: "the chevron glyph's centre lies as far from the field's end as the `Select` chevron's, and at rest its computed `color` equals that chevron's (`cbx-recipe-1`, A2)".
New: "the chevron glyph's centre lies as far from the field's end as the `Select` chevron's, and at rest its computed `color` equals that chevron's; the input is at least `--ds-size-control-lg` wide, the slot stays inside the field and the value reads whole; all of this at the default viewport and again at 360 by 640, where the row is one column; `LeastWidth` proves the same in a 96 px cell, with the popup at the field's width (`cbx-recipe-1`, A2, A10)".
Row 17's proof, old: "`Sizes` play, `getBoundingClientRect()`; `expectSameHeight` on the field and a sibling `Input` of its size". New: "`Sizes` and `LeastWidth` plays, `getBoundingClientRect()`; `expectSameHeight` on the field and a sibling `Input` of its size".

**A15, row 22, the cue at a shorter height (D17).**
Old, in the row's check: "height below 320 px, so Radix's available height decides and not the cap."
New: "height below 320 px, so Radix's available height decides and not the cap, and the thumb shows as in row 12, at 40 px rows here and at 44 px rows in `At360Friendly`."
Row 22's proof, old: "`At360` play, `inVitest` guard on the ink helpers". New: "`At360` and `At360Friendly` plays, `inVitest` guard on the ink helpers".

**A16, row 28, the stories opened (F1, F2).**
Old: "The designer opens `Default`, `Open`, `ActiveOnChosen`, `NoMatch`, `Invalid`, `At360`, `RecipesAndModes` on the PR head".
New: "The designer opens `Default`, `Sizes`, `LeastWidth`, `Open`, `ActiveOnChosen`, `LongList`, `NoMatch`, `Invalid`, `At360`, `RecipesAndModes` on the PR head".
`cbx-base-1`, also for A11, old: "Radix gives the position, the portal, the collision handling and Escape." New: "Radix gives the position, the portal, the collision handling and Escape, and `ScrollArea` gives the list's drawn thumb (A11)."

## Known limits

- A choice that adds a row moves the popup down about 36 px under a resting pointer. It is honest to the layout, and the pointer lands on another row. Multi-row picks by pointer will feel this. Left as it is, since moving the popup above the field or pinning it would hide the field that just changed.
- Tags grow the field without bound. A limit on visible tags stays with open question 10.
- `display: contents` on the `ul`: Chromium's accessibility tree keeps the named list and its items (read from an aria snapshot of the render). WebKit was not run. Row 60's addon does not prove this for Safari, so `ms-webkit-1` reads it in WebKit before PR C.
- `field-sizing`: only Chromium was rendered. Without it, by the CSS, the input keeps its least basis and long text scrolls inside it.
- Static injection means popup collision at the screen's bottom edge was not seen. Row 22 proves the sides and the room left at 360 px on the real component.
- A field in a cell narrower than its least width leaves the cell, by design: the field stays whole and the cell gives way. Under `grid-cols-3` the lg field with clear would lie over the next cell. So a caller stacks under about 160 px per cell, and `combobox.yaml` says so. Two columns at 360 px are 156 px: sm and md fit, lg with clear runs 5 px into the gap.
- 48 px of input is the floor of a whole control, not a readable value: it shows "Save..." at every size. `Sizes` stacks for that reason, and a caller's form should too.
- With focus in a 48 px input the value shows its tail, cut at the start ("anges", "d guide"), since the caret sits at the end. This is how any input scrolls its text, it holds only at the floor, and it clears on blur, where the ellipsis returns. `floor-open` shows it.
- D15 covers Combobox only. Its selectors do not reach MultiSelect, where a long tag would raise `min-content` past a 360 px screen. PR C needs its own floor for `.ds-combobox__values`, read at row 56 in a narrow cell. Nothing here proves that floor.
- `Select` has the same gap as F2: its list has no cap and no drawn bar, and a long one shows no cue at rest. This task leaves `Select` alone.
- The neutral `At360` second list still ends in a 2.2 px sliver of row 8, a dot of Thai ink at the foot. A scroll box cuts what it cuts, and the thumb now carries the meaning.
- The thumb on hover goes to the stronger ink, the reverse of `.ds-scroll__thumb` everywhere else, where rest is the stronger. `needs_decision` of ORV-228-design-2 raises whether the source tokens should swap.
- Forced colours were not run. The thumb is a background, so Windows High Contrast may drop it, as it may on every `ScrollArea`.

## Screens to check in visual QA

<!-- prettier-ignore -->
| Story | Rows | Check |
| --- | --- | --- |
| Combobox `Default`, `Sizes`, `LeastWidth`, `Clearable` | 17, 28 | Next to a `Select`: same height, text start and chevron place, at 360 as at 1440. `Sizes` at 360 is stacked and each value reads whole. `LeastWidth`: the slot inside the field, the value on its ellipsis. Clear and chevron do not touch. Focus edge and no list after Tab |
| Combobox `Open`, `ActiveOnChosen`, `Grouped`, `IconsAndDescriptions`, `LongList`, `LongListFriendly` | 11, 12, 28 | Active, chosen, chosen and active read as three. Popup at the field's width, 4 px under it. A thumb in the end padding of every list that overflows, none on a list that fits, whole inside the rounded corner at both ends of the track. Hover in both locales |
| Combobox `NoMatch`, `NoOptions`, `Invalid`, `Disabled`, `At360`, `At360Friendly`, `RecipesAndModes` | 12, 22, 28 | A long Thai query wraps in the panel with marks whole. The danger edge is one line. Disabled has no stray ink. The second field's list shows the thumb, whatever its foot row shows |
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

### Rework set (ORV-228-design-2)

The real Combobox stories with the proposed CSS injected, as the section "Rework from sign-off 1" says. The names are `<scene>-<profile>-<mode>-<width>-<locale>.png`. This folder is scratch too, so the main session keeps what is to outlive the session.

- Contact sheet, all 160 shots with their names: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/contact-sheet.png`
- The shots: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/shots/`
- One sheet per scene, 16 cells each: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/sheets/`

<!-- prettier-ignore -->
| Scene | Story | Proves | Profiles and modes | Widths | Locale | PNGs |
| --- | --- | --- | --- | --- | --- | --- |
| `sizes` | `Sizes` and its English twin | F1: stacked at 360, three columns at 1440, values whole | neutral and friendly, light and dark | 360, 1440 | Thai, English | 16 |
| `floor` | `Sizes` in a 6rem cell, the `LeastWidth` form | F1: input 48 px, slot inside the field, value on its ellipsis | the same | 360, 1440 | Thai, English | 16 |
| `floor-open` | The same, third field open | F1: popup at the field's width at the floor | the same | 360, 1440 | Thai, English | 16 |
| `long-top`, `long-mid`, `long-end` | `LongList` | F2: thumb at the top, at the active row, at the end | the same | 360, 1440 | Thai, English | 48 |
| `at360-list2` | `At360`, second field | F2: thumb whatever the foot row shows | the same | 360, 1440 | Thai, English | 16 |
| `open-short`, `described`, `grouped` | `Open`, `IconsAndDescriptions`, `Grouped` | F2: a list that fits has no thumb, and 7 rows at 44 px have one | the same | 360, 1440 | Thai, English | 48 |

Examples:

- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/sheets/sizes.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/sheets/floor.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/sheets/long-top.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/sheets/at360-list2.png`

Beside the 160:

- The real `ScrollArea` mount, six cells, read after the last CSS change: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/candidates/radix-real-sheet.png`. The chevron's ground in it is the pointer left on the button.
- The thumb in the rounded corner at 4x, before (`corner-a`) and after (`corner-b`), all three profiles: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/zoom/corner-sheet.png`
- Reduced motion against normal, same bytes: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/zoom/motion-reduced-neutral-light.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/zoom/motion-normal-neutral-light.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/zoom/motion-reduced-friendly-dark.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/zoom/motion-normal-friendly-dark.png`
- The thumb on hover: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/zoom/thumb-hover-neutral-light.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/zoom/thumb-hover-friendly-dark.png`
- The friendly foot row of F2 with the thumb in place, at 2x: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/zoom/friendly-foot-with-thumb.png`
- The candidates side by side: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-228-design-2/candidates/compare.png`. Rendered before the ink and corner changes, so its thumb is the near-black one that D17 moved away from. It compares the kinds of cue, not the final thumb.
