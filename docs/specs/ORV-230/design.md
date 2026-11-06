---
issue: ORV-230
spec: docs/specs/ORV-230/spec.md v1.1
task: ORV-230-design-1
date: 2026-11-06
---

# ORV-230 design: Accordion, Separator, Metric and Filter bar

The look of the four components, the answers to open questions 2, 3, 7, 8, 10 and 14, and one row of CSS and markup per selector for the builder. Every value is an existing semantic token or a component token the spec already names. **This design adds no token and no contrast pair.** It adds three recipe classes, all on Metric (A10).

Two answers differ in part from the spec's default: question 2 keeps the ghost Button but not its pill radius (A1, A2), and question 10 keeps the separate tone but moves its Badge (A5, A6). Eight more amendments fill gaps the spec leaves open or correct a look that does not hold once rendered. The tables below assume all of them are taken. Each names its fallback, so a refusal changes a line or two.

How this was proved: no component exists yet, so the proposal was rendered in Storybook on port 6447, inside story `base-button--variants`, with the proposed CSS added by `page.addStyleTag`. The scenes use the real `Button`, `Card`, `Badge`, `Tag`, `Select`, `InputGroup`, `Skeleton`, `Table` and the real Radix `Accordion` and `Separator`, imported from the dev server, and no file under `packages/` changed. **Every figure, count and row in every screenshot is mock data.** The scenes say so on screen.

## Flow

Accordion

1. The person reads a stack of labels, each with a chevron down at the end.
2. They press a label or use the keyboard. The panel fades in under the label, the chevron turns up, and the panel text starts on the label's start edge.
3. They press it again and it closes at once. Under `type="single"` another press moves the open panel to the other item.
4. In a group with `collapsible={false}` the open item stays open: the label keeps its ink, the chevron goes quiet, and nothing reacts to the press.

Separator: the eye crosses a thin line between two blocks, and nothing else happens. It never takes focus.

Metric

1. The person reads the title, then the figure. Tone, if the caller set `betterWhen`, sits beside the figure as a small word.
2. They read the change line below it: a glyph for the direction, then the words.
3. With no data the figure's slot says "ไม่มีข้อมูล" and nothing else moves. While loading, grey shapes hold the same slot.

Filter bar

1. The person types or picks in a control. The list changes at once, a Tag appears for each active filter, and the count at the end changes.
2. They press a Tag's remove, or "ล้างตัวกรอง". The caller moves focus as `filter-clear-1` says.
3. With no result the count says so, the list shows its own empty state, and the clear button stays one press away.

## Answers to the open questions

<!-- prettier-ignore -->
| # | Question | Answer | Why |
| --- | --- | --- | --- |
| 2 | Trigger look | **Differs in part.** Option (a), a ghost `Button` md at full width, with its hover, focus and pairs, but with `shape.media.radius` in place of the pill, and 4 px of air around it (A1, A2) | The spec's worry was right, and line count is what proves it. At one line the pill reads as a long capsule. At three lines of Thai the 999 radius turns the ground into a stadium whose curve runs into the first line's text and the chevron (`compare-q2-spec-as-written-pill.png`). The ground also touches both dividers: 0 px from trigger to divider, so the 3 px halo lies over the line. With the media radius the ground is one rounded card at every line count, the same reason ORV-204 moved `menu.option.radius` to `shape.media.radius` ("one rounded card whatever its line count", `DESIGN.md` v1.58). It stays a profile's token: 12 neutral, 8 professional, 16 friendly. Options (b) and (c) stay out: (b) leaves ragged chevrons, and (c) adds pairs when this one declaration solves it |
| 3 | `collapsible` default on `type="single"` | (a), confirmed: default true. The locked look gains one line (A3) | A person who opened a group expects to close it. The locked state then stays rare, and when it shows, the heading must not read as disabled: its panel is being read. The label keeps `button.ghost.fg` (measured rgb(22, 21, 29), equal to a plain trigger) with `cursor: default`. The spec leaves the chevron in the disabled rule's reach only by accident, so A3 names it: the up glyph takes `button.ghost.fg-disabled` (rgb(91, 90, 102)), which says "this will not close" without greying the heading |
| 7 | A bare line and a labelled divider | (a), confirmed: `Separator` is the bare line | Nothing in this story needs a label. The line is quiet on the canvas and on a card, in both modes (`separator-*`). A label would bring a heading, a second role and a look to design |
| 8 | Default of `decorative` | (a), confirmed: default true, and the two values look the same | Space and the line separate on screen; the role only speaks. Measured roles: `none` by default, `separator` with `decorative={false}`, and `aria-orientation="vertical"` only on a semantic vertical line, as W2 says |
| 10 | What a trend shows when a rise is bad news | **Confirmed in its model, differs in placement.** Option (a): the direction comes from the numbers and the word on a Badge comes from `betterWhen`. The Badge sits beside the figure, not beside the line (A5, A6) | After the line, a Thai change line wraps and the Badge drops onto a third row of its own, so the tiles grow to 219.6 px and go ragged (`compare-q10-badge-after-line.png`). Beside the figure the tile is 195.6 px, the change line keeps one start edge, and the figure and its meaning read together (`compare-q10-badge-beside-figure.png`). The figure stays the loudest thing: 32 px beside a small Badge. With colour removed, a bad rise still reads: up glyph, "เพิ่มขึ้น 2", and the word "แย่ลง" (`metric-greyscale-th-1440.png`) |
| 14 | The clear button at rest | (a), confirmed: mounted and inert | Nothing shifts and focus is never lost. At rest it takes the ghost disabled ink, `text.secondary`, the same ink as the count, so it reads as quiet and not as a fault. Active, it takes `text.primary`. In the `At rest` and `Active` bars of `filter-neutral-light-en-360.png` the two read apart with no red anywhere |

## Amendments for product to take in

Old text is the spec's, word for word. New text replaces it.

<!-- prettier-ignore -->
| # | Rule | Old text | New text | Why | Fallback if refused |
| --- | --- | --- | --- | --- | --- |
| A1 | `acc-look-1`, paragraph 1 | "The trigger fills the item's width with the label at the start and the chevron at the end (open question 2)." | "The trigger fills the item's width with the label at the start and the chevron at the end (open question 2). The recipe sets its `border-radius` to `--ds-shape-media-radius`, so the ground is one rounded card at every line count, as `menu.option.radius` is (ORV-204)." | Question 2 | Drop one declaration; the stadium of `compare-q2-spec-as-written-pill.png` returns |
| A2 | `acc-look-1`, paragraph 2 | "`accordion.content-gap` from `space.stack.md`, under the content. The content starts on the label's start edge and sets no colour." | "`accordion.content-gap` from `space.stack.md`, under the content. `.ds-accordion__item` has `padding-block` `--ds-space-inline-sm`, and `.ds-accordion__content` has `padding-block-start` `--ds-space-inline-sm`, so the 3 px focus halo clears the divider and the panel's first line. The content starts on the label's start edge and sets no colour." | The halo needs 3 px. Measured 0 as written, 4 with this. Cost: the row pitch grows from 40 to 48 px (49 with the divider) | Drop two declarations; the halo lies over the divider and the hover ground touches it |
| A3 | `acc-look-1`, paragraph 3 | "On the open item of a group with `collapsible={false}`, the recipe keeps `button.ghost.fg` on the label and sets `cursor: default`, since `.ds-button[data-variant="ghost"][aria-disabled="true"]` would otherwise put the disabled ink on the heading of the panel being read." | The same sentence, then: "The chevron takes `button.ghost.fg-disabled`, so the glyph does not promise a close. The two selectors exclude `:disabled`, so an open item that is also `disabled` keeps Button's disabled look." | Question 3. The selector must beat (0,4,0), and an open disabled item carries both attributes | Drop the chevron rule; the chevron matches the label and still promises a close |
| A4 | `sep-look-1` | "A horizontal line is 1 px tall at its parent's width; a vertical line is 1 px wide and stretches to its parent's height; neither shrinks. The 1 px is the raw value `.ds-menu__separator` and `.ds-controls__divider` already use." | "The line is a 1 px border and never a background, because forced colours paint a background out. A horizontal line is `border-block-start` at its parent's width; a vertical line is `border-inline-start`, stretches to its parent's height and is at least `1lh` tall, so it never vanishes in a block parent; neither shrinks. The 1 px is the raw value the private dividers and `--cmp-inspector-divider` lines already use." | A filled 1 px box with the repo's outline form (ORV-201 D13, ORV-222 D4) draws a hollow 3 px double line in forced colours (`compare-sep-forced-colours-outline-form.png`); the border form draws one line (`separator-forced-colours-th-360.png`). In normal colours the two are the same | The outline form, which breaks "one line per edge" under forced colours only |
| A5 | `metric-tone-1` | "Tone shows as a `Badge` at `size="sm"` beside the line, with the word" | "Tone shows as a `Badge` at `size="sm"` beside the figure, in `ds-metric__figure`, with the word" | Question 10 | A `ds-metric__trend` wrapper after the line, and the third row of `compare-q10-badge-after-line.png` |
| A6 | `metric-look-1` | "with the classes `ds-metric`, `ds-metric__change`, `ds-metric__missing`, `ds-metric__note`, and adds no overflow rule." | "with the classes `ds-metric`, `ds-metric__figure`, `ds-metric__change`, `ds-metric__missing`, `ds-metric__note`, `ds-metric__skeleton-value`, `ds-metric__skeleton-change`, and adds no overflow rule. `ds-metric__figure` holds `CardValue` and the Badge. The figure, `ds-metric__missing` and `ds-metric__skeleton-value` take one slot height, the value type's size times its line height, so a tile keeps its shape in every state." | Without the slot a missing tile sits 4.8 px short of its sibling, and the loading shape has no size. Measured with it: 32 px in all ten tiles | Keep `__figure` only when A5 is taken; tiles of one row then differ by state |
| A7 | `metric-data-1`, paragraph 3 | "a `SkeletonGroup` takes the place of the value and the change line; `loading` wins over `value`." | "a `SkeletonGroup` takes the place of the value and the change line: a `Skeleton shape="block"` in `ds-metric__skeleton-value`, and with a `compare` a `Skeleton shape="text"` in `ds-metric__skeleton-change`; `loading` wins over `value`." | The spec names no shape, and a shape with no height renders nothing (seen in the first render) | None; the builder then guesses the shapes |
| A8 | `filter-look-1`, paragraph 1 | "`ds-filter-bar__controls`, `ds-filter-bar__active` and `ds-filter-bar__meta` wrap. No control is hidden at any width, and at 360 px a control may take a row of its own." | "`ds-filter-bar__controls`, `ds-filter-bar__active` and `ds-filter-bar__meta` wrap. The root is an inline-size container named `ds-filter-bar`, so the bar answers to its own width on a canvas or in a card. Each control is `--ds-size-panel-min` wide. Below 480 px of container each region and each control takes a full row, the count stays at the start and the clear button at the end. No control is hidden at any width. `display: none` never reaches the status." | The spec gives no width, and an unsized `InputGroup` and `Select` take uneven widths. A card at 360 px is 278 px inside, so a viewport query would be wrong. The 480 form is Table's (`recipes.css` line 1340) | A viewport media query; a bar in a narrow card on a wide screen then keeps its 240 px controls and its wide form |
| A9 | `filter-api-1`, `FilterBarControls` | "such as an `InputGroup` and a `Select`, each named by the caller." | "such as an `InputGroup` and a `Select` at `size="sm"`, each named by the caller, so a row shares one 32 px height with Tag md and the clear button." | Siblings of one height. Measured 32 for search, select, tag, clear and meta at 360, 768 and 1440 | The default md controls stand 8 px taller than the Tags beside them |
| A10 | "Contract changes and impact", row "Recipe classes" | "`ds-metric` with `__change`, `__missing`, `__note`;" | "`ds-metric` with `__figure`, `__change`, `__missing`, `__note`, `__skeleton-value`, `__skeleton-change`;" | A5, A6, A7 | Follows those three |
| A11 | AC row 15, Check | "label computed `color` equals resolved `--cmp-button-ghost-fg`" | "label computed `color` equals resolved `--cmp-button-ghost-fg`; the chevron's computed `color` equals resolved `--cmp-button-ghost-fg-disabled`; computed `cursor` is `default`" | Proves A3 | Follows A3 |
| A12 | AC row 19, Check | "the chevron's bottom is above the label's top plus the label's computed `line-height`, so it sits beside the first line" | The same, then: "; the trigger's computed `border-radius` equals resolved `--ds-shape-media-radius`, and the trigger's bottom is at least 3 px above the item's divider" | Proves A1 and A2 at the line counts that broke them | Follows A1 and A2 |

## Visual decisions

<!-- prettier-ignore -->
| # | Decision | Value (tokens) | Source intent |
| --- | --- | --- | --- |
| D1 | One start edge in an Accordion: the label and the panel text | Content `padding-inline` is `button.padding-x.md` plus Button's 1 px border; measured difference 0 | "A panel reads as belonging to its row" (AC 22) |
| D2 | One shape at every line count | `shape.media.radius`. Measured trigger heights 40, 63.78 and 87.58 px, one to three lines, all one rounded card; one line stays 40 (W7) | L-0019; `DESIGN.md` v1.58 |
| D3 | The chevron sits beside the first line | Centre 0.01 px from the first line's centre, bottom 3.91 px above that line's bottom | `acc-look-1`, AC 19 |
| D4 | State shows by shape: chevron down or up, no open ground | No selection ink at all: open is not selected, and focus keeps its line and halo (`AGENTS.md`) | `DESIGN.md` section 7 |
| D5 | A line that divides without shouting | `border.subtle`, 1 px, the same for both `decorative` values | AC 8, `DESIGN.md` section 3.1 |
| D6 | A tile has four rows in fixed order: title, figure, change, note | `card.gap` between them; figure slot 32 px in every state | "Siblings of one height"; AC 34 |
| D7 | The Badge never outshouts the figure | Badge sm beside `type.numeral.md`; the row wraps with a 4 px row gap if a long figure needs it | AC 34 |
| D8 | The change line stays neutral | `text.secondary`, whatever the tone. Colour lives only on the Badge | `metric-tone-1`, `DESIGN.md` section 7 |
| D9 | A wrapped change line breaks at a phrase | `text-wrap: balance`, so "จากสัปดาห์ก่อน" moves as a unit and no word sits alone | Thai is part of the design |
| D10 | Missing reads as a gap and not as a fault | `text.secondary` at `type.body.md`, centred in the figure slot, no icon, no red | AC 34, `metric-data-1` |
| D11 | The bar reads as one tool over its list | No ground, no edge; `filter-bar.gap` and `filter-bar.row-gap`, both 8 px; all parts 32 px | AC 44 |
| D12 | The count and the clear button hold the end of the bar | At 1440 they end the single row. Below 480 px the count takes the start and the clear button the end, and if the count fills the row the button keeps the end edge on its own line | `filter-look-1`; a one-item line must not change sides |
| D13 | A long Tag cuts and keeps its text | Tag's own max width `size.panel.min`, ellipsis, `title` | `tag.yaml`, AC 41 |

## CSS per rule

Recipes go in `recipes.css`, after `.ds-button` and in this order. Font rows mean the five declarations `font-family`, `font-size`, `line-height`, `font-weight`, `letter-spacing` from the named `*-type-*` properties. The rendered form is at `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/harness/proposal.css` and `proposal2.css` beside it. Those files carry three helper properties for the render; the rows below read `--ds-*` directly, so no token is added.

<!-- prettier-ignore -->
| Rule | Selector | Declarations |
| --- | --- | --- |
| `acc-look-1` | `.ds-accordion` | `display: flex; flex-direction: column; min-inline-size: 0;` |
| `acc-look-1`, A2 | `.ds-accordion__item` | `min-inline-size: 0; padding-block: var(--ds-space-inline-sm); border-block-end: 1px solid var(--cmp-accordion-divider);` |
| `acc-look-1` | `.ds-accordion__item:last-child` | `border-block-end: 0;` |
| `acc-heading-1` | `.ds-accordion__heading` | `display: flex; margin: 0; font: inherit;` |
| `acc-look-1`, A1 | `.ds-accordion__trigger` | `inline-size: 100%; align-items: flex-start; justify-content: space-between; white-space: normal; text-align: start; border-radius: var(--ds-shape-media-radius); padding-block: calc((var(--cmp-button-height-md) - 2px - 1lh) / 2);` and font from `--cmp-accordion-trigger-type-*` |
| `acc-look-1` | `.ds-accordion__trigger .ds-button__icon` | `margin-block-start: calc((1lh - var(--cmp-button-icon-size-md)) / 2);` |
| `acc-look-1` | `.ds-accordion__label` | `flex: 1 1 auto; min-inline-size: 0; overflow-wrap: anywhere;` |
| `acc-look-1`, `acc-motion-1`, A2 | `.ds-accordion__content` | `min-inline-size: 0; padding-inline: calc(var(--cmp-button-padding-x-md) + 1px); padding-block-start: var(--ds-space-inline-sm); padding-block-end: var(--cmp-accordion-content-gap); overflow-wrap: anywhere; animation: ds-fade-in var(--ds-motion-feedback-duration) var(--ds-motion-easing);` and font from `--cmp-accordion-content-type-*`. No `display` |
| `acc-motion-1` | `@media (prefers-reduced-motion: reduce) { .ds-accordion__content }`, later in the file | `animation: none;` |
| `acc-look-1`, A3 | `.ds-accordion__trigger.ds-button[data-variant="ghost"][aria-disabled="true"]:not([data-loading]):not(:disabled)` | `color: var(--cmp-button-ghost-fg); cursor: default;` |
| `acc-look-1`, A3 | `.ds-accordion__trigger[aria-disabled="true"]:not(:disabled) .ds-button__icon` | `color: var(--cmp-button-ghost-fg-disabled);` |
| `sep-look-1`, A4 | `.ds-separator` | `flex: none;` |
| `sep-look-1`, A4 | `.ds-separator[data-orientation="horizontal"]` | `inline-size: 100%; block-size: 0; border-block-start: 1px solid var(--cmp-separator-line);` |
| `sep-look-1`, A4 | `.ds-separator[data-orientation="vertical"]` | `align-self: stretch; inline-size: 0; min-block-size: 1lh; border-inline-start: 1px solid var(--cmp-separator-line);` |
| `metric-tone-1`, A5 | `.ds-metric__figure` | `display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-inline-sm) var(--ds-space-inline-md); min-inline-size: 0;` |
| `metric-look-1`, `metric-change-1` | `.ds-metric__change` | `display: flex; align-items: flex-start; gap: var(--ds-space-inline-sm); min-inline-size: 0; margin: 0; color: var(--cmp-metric-change-fg);` and font from `--cmp-metric-change-type-*` |
| `metric-look-1` | `.ds-metric__change > svg` | `flex: none; inline-size: var(--ds-size-icon-sm); block-size: var(--ds-size-icon-sm); margin-block-start: calc((1lh - var(--ds-size-icon-sm)) / 2);` |
| `metric-look-1` | `.ds-metric__change > span` | `min-inline-size: 0; text-wrap: balance;` |
| `metric-look-1` | `.ds-metric__note` | `margin: 0; color: var(--cmp-metric-note-fg);` and font from `--cmp-metric-note-type-*` |
| `metric-data-1`, A6 | `.ds-metric__missing` | `display: flex; align-items: center; margin: 0; min-block-size: calc(var(--cmp-card-value-type-font-size) * var(--cmp-card-value-type-line-height)); color: var(--cmp-metric-missing-fg);` and font from `--cmp-metric-missing-type-*` |
| `metric-data-1`, A7 | `.ds-metric .ds-skeleton-group` | `gap: var(--cmp-card-gap);` |
| `metric-data-1`, A7 | `.ds-metric__skeleton-value` | `block-size: calc(var(--cmp-card-value-type-font-size) * var(--cmp-card-value-type-line-height)); inline-size: 40%;` |
| `metric-data-1`, A7 | `.ds-metric__skeleton-change` | `inline-size: 70%;` |
| `filter-look-1`, A8 | `.ds-filter-bar` | `container: ds-filter-bar / inline-size; display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--cmp-filter-bar-row-gap) var(--cmp-filter-bar-gap); inline-size: 100%; min-inline-size: 0;` |
| `filter-look-1` | `.ds-filter-bar__controls, .ds-filter-bar__active` | `display: flex; flex-wrap: wrap; align-items: center; gap: var(--cmp-filter-bar-row-gap) var(--cmp-filter-bar-gap); min-inline-size: 0;` |
| `filter-look-1`, A8 | `.ds-filter-bar__controls > *` | `flex: none; inline-size: var(--ds-size-panel-min); max-inline-size: 100%;` |
| `filter-look-1`, A8 | `.ds-filter-bar__active` | `flex: 1 1 0; min-inline-size: var(--ds-size-panel-min);` |
| `filter-look-1` | `.ds-filter-bar__meta` | `display: flex; flex-wrap: wrap; align-items: center; gap: var(--cmp-filter-bar-gap); min-block-size: var(--cmp-button-height-sm); margin-inline-start: auto; min-inline-size: 0;` |
| `filter-clear-1`, D12 | `.ds-filter-bar__meta > .ds-button` | `margin-inline-start: auto;` |
| `filter-status-1` | `.ds-filter-bar__count` | `min-inline-size: 0; color: var(--cmp-filter-bar-count-fg);` and font from `--cmp-filter-bar-count-type-*` |
| `filter-look-1`, A8 | `@container ds-filter-bar (max-width: 479px)` | `.ds-filter-bar__controls, .ds-filter-bar__active, .ds-filter-bar__meta { flex: 1 1 100%; }`, `.ds-filter-bar__controls > * { flex: 1 1 100%; inline-size: auto; }`, `.ds-filter-bar__meta { margin-inline-start: 0; }` |

## Markup per rule

<!-- prettier-ignore -->
| Rule | Part | Markup |
| --- | --- | --- |
| `acc-heading-1`, `acc-aria-1`, `acc-look-1` | Accordion | Radix `Root.ds-accordion` > `Item.ds-accordion__item` > `Header asChild` over `<headingAs>.ds-accordion__heading` > `Trigger asChild aria-controls={panelId}` over `Button variant="ghost" size="md" iconTrailing={ExpandIcon or CollapseIcon} className="ds-accordion__trigger"` > `span.ds-accordion__label`. Then `Content id={panelId} className="ds-accordion__content"` |
| `acc-region-1` | Panel under `type="multiple"` | `role={undefined} aria-labelledby={undefined}` on Radix `Content` |
| `sep-api-1` | Separator | Radix `Separator.Root.ds-separator`, with `orientation` and `decorative` passed through |
| `metric-look-1`, A5, A6 | Metric with a figure | `Card as="article" className="ds-metric"` > `CardTitle`, then `div.ds-metric__figure` > `CardValue` and `Badge size="sm"` when there is a tone, then `p.ds-metric__change` > glyph svg and `span`, then `p.ds-metric__note` |
| `metric-data-1` | Missing | `p.ds-metric__missing` in place of `.ds-metric__figure`; no change line |
| `metric-data-1`, A7 | Loading | `SkeletonGroup` in place of the figure and the change line, holding the shapes of A7; the note stays |
| `filter-api-1`, `filter-status-1`, `filter-clear-1` | Filter bar | `div.ds-filter-bar[role="group"][aria-label]` with direct children `div.ds-filter-bar__controls`, `div.ds-filter-bar__active[role="group"]` (absent with no children), `div.ds-filter-bar__meta` > `span.ds-filter-bar__count[role="status"]` and `Button variant="ghost" size="sm"` |

## Tokens, pairs and impact

No token and no pair beyond the spec's lists. `--ds-shape-media-radius`, `--ds-space-inline-sm`, `--ds-space-inline-md`, `--ds-size-icon-sm` and `--ds-size-panel-min` exist, and a recipe may read them, as `.ds-collapsible` and `.ds-skeleton` do. The only contract change beyond the spec is A10: three recipe classes, in `recipes.css`, checked by `recipes.test.ts`, with no effect on any other component.

The spec's pairs, and the locked state's, computed through the token code `recipes.test.ts` uses:

<!-- prettier-ignore -->
| Pair | Floor | Lowest | Neutral light, dark | Professional light, dark | Friendly light, dark |
| --- | --- | --- | --- | --- | --- |
| `metric.change-fg`, `note-fg`, `missing-fg` on `card.bg` | 4.5 | 5.50 | 6.80, 7.00 | 5.50, 6.80 | 5.50, 6.80 |
| `filter-bar.count-fg` on `surface.canvas` | 4.5 | 5.10 | 6.10, 7.60 | 5.10, 9.30 | 5.10, 9.20 |
| `filter-bar.count-fg` on `surface.card` | 4.5 | 5.50 | 6.80, 7.00 | 5.50, 6.80 | 5.50, 6.80 |
| Locked chevron, `button.ghost.fg-disabled` on `surface.canvas` | 3.0 | 5.10 | 6.10, 7.60 | 5.10, 9.30 | 5.10, 9.20 |
| Locked label, `button.ghost.fg` on `surface.canvas` | 4.5 | 14.00 | 16.40, 16.00 | 15.60, 14.00 | 15.50, 14.20 |
| `separator.line` on `surface.canvas`, not listed, for the record | none | 1.20 | 1.20, 1.30 | 1.30, 2.10 | 1.30, 2.00 |
| `separator.line` on `surface.card`, not listed, for the record | none | 1.20 | 1.30, 1.20 | 1.40, 1.50 | 1.40, 1.50 |

The last two rows are decoration: space separates and the role speaks, as `sep-look-1` says. AC 1's `expectEdgeInk` reads pixels, and `border.subtle` on the canvas differs by 55 against its limit of 48, so it passes with a margin of 7.

## States

"None" means the state does not exist for the part, on purpose. Selected and focused are never one look.

<!-- prettier-ignore -->
| State | Accordion | Separator | Metric | Filter bar |
| --- | --- | --- | --- | --- |
| Default | Closed: chevron down, panel `hidden` | The line | Title, figure, optional change and note | At rest: controls, count, inert clear |
| Hover | Button ghost: `surface.hover` with its `border.subtle` edge, in the media radius | None | None; the tile is not a control | Each control's own; inert clear shows none |
| Focus | Button's line and 3 px halo, whole, in the media radius, on the trigger | None; it never takes focus | None | Each control's own; the inert clear stays focusable; the `container` clips no halo |
| Selected or open | Open: chevron up and the panel, no ground, no selection ink | None | None | Active: a Tag per filter and the clear button in `text.primary` |
| Disabled | Item or root: Button's disabled look, skipped by arrows. Locked open item: label keeps its ink, chevron quiet, `cursor: default` | None | None | Clear at rest through `aria-disabled`; controls by the caller |
| Loading | None; a panel's content is the caller's | None | Title and note stay; flat grey shapes hold the slots, still in every motion setting, as `skeleton.yaml` says | Status holds nothing while `resultCount` is `undefined`; the bar stays usable |
| Empty | A group with no items renders no row | None | `ds-metric__missing` in the slot; no change line, no Badge. `0` is a real figure | No active filter: the active region is absent. No result: `filterBar.resultsNone`, and the list shows its own empty state |
| Error | None; the component validates nothing | None | None; a failed read reaches it as `undefined` and shows as missing, which never claims a number | None; the caller's list owns a failed load |
| Success | None | None | Only the word "ดีขึ้น" on a success Badge, and only when `betterWhen` and both numbers back it | None; the count is plain text |

Other conditions:

- **Thai marks.** Trigger and content sit at line height 1.7, and marks above and below stay whole in every Thai screenshot. A figure's 32 px slot holds digits only, as `CardValue` demands, and "ไม่มีข้อมูล" fits it at 27.2 px.
- **Long names.** `fixtures.longThai` and `fixtures.longLatin` wrap in the label and panel through `overflow-wrap: anywhere`, and in the tile through `.ds-card`. A Tag cuts with an ellipsis.
- **Missing data.** See the Empty row. An unknown count leaves the status mounted and empty, and the clear button still holds the end edge.
- **Small screens.** No horizontal overflow at 360, 768 or 1440 px in any shot, by `scrollWidth`.
- **Reduced motion.** The fade is the only motion in the four components, and it goes off with `animation: none`. Nothing animates a size.
- **Forced colours.** The separator keeps one line through its border, and the Accordion dividers are borders too. A trigger's edge and focus line come from Button's transparent border and outline, which this design does not change. Only the separator was rendered under forced colours.

## Screens to check in visual QA

The stories of AC 8, 22, 34 and 44, at 360 and 1440 px, light and dark, Thai and English. What to look at in each:

<!-- prettier-ignore -->
| Story | Look for | Proof from this design |
| --- | --- | --- |
| Separator `Default`, `Vertical`, `Semantic`, `At360`, `RecipesAndModes` | One quiet line on the canvas and on a card; the vertical line as tall as the row; 1 px at every scale | `separator-*`; forced colours in `separator-forced-colours-th-360.png` |
| Accordion `Default`, `OneAtATime`, `Multiple`, `At360` | Rounded ground at one, two and three lines; label and panel on one start edge; hover ground clear of the dividers | `accordion-*`, `compare-q2-*` |
| Accordion keyboard focus on a two-line trigger | Line and halo whole, clear of the divider and of the panel's first line | `accordion-neutral-dark-th-360.png`, third item |
| Accordion `Disabled`, `NotCollapsible` | Disabled reads grey; locked keeps its ink and only the chevron goes quiet; the two read apart | `accordion-neutral-dark-th-360.png`, card and last group |
| Metric `Trends`, `RiseIsBad`, `Missing`, `Loading`, `At360`, `RecipesAndModes`, decision log | Tiles of one row at one height; one 32 px figure slot; no third row for the Badge; a bad rise with colour removed; missing as a gap | `metric-*`, `compare-q10-*`, `metric-greyscale-th-1440.png` |
| Filter bar `Default`, `ApplyOnChange`, `NoResults`, `At360`, `RecipesAndModes` | One height on a row; count and clear at the ends; the clear button at the end when the count wraps; inert clear quiet and not red | `filter-*` |

The screenshots, all mock data, each opened and read. The contact sheet holds them all, and each `sheet-*` holds one component.

- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/contact-sheet.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/sheet-accordion.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/sheet-filter.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/sheet-metric.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/sheet-separator.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/compare-q10-badge-after-line.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/compare-q10-badge-beside-figure.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/compare-q2-proposal-radius.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/compare-q2-spec-as-written-pill.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/compare-sep-forced-colours-outline-form.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-friendly-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-friendly-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-neutral-light-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-neutral-light-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-professional-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-professional-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-professional-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/accordion-professional-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/filter-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/filter-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/filter-neutral-light-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/filter-neutral-light-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/filter-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/filter-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/filter-neutral-light-th-768.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/filter-professional-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/filter-professional-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/filter-professional-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/filter-professional-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/metric-greyscale-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/metric-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/metric-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/metric-neutral-light-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/metric-neutral-light-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/metric-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/metric-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/metric-professional-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/metric-professional-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/metric-professional-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/metric-professional-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/separator-forced-colours-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/separator-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/separator-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/separator-neutral-light-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/separator-neutral-light-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/separator-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/separator-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/separator-professional-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/separator-professional-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/separator-professional-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-230-design-1/separator-professional-light-th-360.png`

## Left out on purpose

- **An Accordion inside a Card.** Its label sits 17 px inside the card title's start edge, because the ghost trigger keeps its inset, while the divider and hover ground do share the title's edge. A negative margin would fix it, but no story of this PR needs it (`AGENTS.md` rule 6). The Inspector follow-up card must decide this when it composes the two.
- **Content to divider gap.** It is 20 px (`accordion.content-gap` 16, plus the item's 4). Kept, because the spec names the token.
- **Dense panels.** A2 makes each row 8 px taller. If the Inspector needs tighter groups, that is a density decision for its own card.
- **Table below 480 px.** With no rows on a neutral light card, or at the top of its stacked form, Table draws a short top line (`filter-neutral-light-en-360.png`). That is existing Table behaviour, out of scope here, and it will show in the sign-off of AC 39 and 44.
- **Filter bar near 768 px.** A long Tag makes the active region take a second line and the meta a third, ending at the end edge (`filter-neutral-light-th-768.png`). Accepted: it stays orderly and the order never changes.
- **Decision log notes.** They move from an inherited 16 px to `type.body.sm`, as `metric-look-1` says. The tile gets quieter under the figure, which is intended, and AC 34 checks it.

## Evidence that changes a builder's risk

- Radix wiring ran here, in place of being read (spec open question 4): `aria-controls` resolves to a `hidden` element on every closed trigger, `aria-disabled="true"` lands on a locked open item, and `disabled` on a disabled one. The fallback of question 4 is not needed by this evidence; row 9's play stays the proof.
- A closed panel keeps its `role="region"` attribute while `hidden`: four raw attributes in a group with one open. `queryAllByRole` skips hidden elements, so row 10's length of 1 should hold; that play has not run.
- No screen reader was run, and no play or `recipes.test.ts` run touches this proposal. It is a render, not a build.
