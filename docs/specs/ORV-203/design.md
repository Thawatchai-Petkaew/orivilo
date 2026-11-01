---
issue: ORV-203
spec: docs/specs/ORV-203/spec.md v1.0
task: ORV-203-design-1
date: 2026-11-01
---

# ORV-203 design: Collapsible (base)

This design gives the look of the show and hide control and answers spec open questions 1 to 3. It also gives the trigger and content anatomy, with one row of CSS and markup for each rule. Every value is an existing semantic token, an existing Button component token (`--cmp-button-*`, which other recipes already read: `recipes.css` lines 223, 558, 1031) or an existing keyframe. This design adds no token, no colour pair and no locale key.

## Flow

1. Closed: a ghost Button shows the caller's label and a chevron pointing down. Nothing sits under it.
2. The person presses it (click, Enter or Space). The chevron turns to point up, and the content appears under the trigger. It fades in over 120 ms (0 ms when the person asks for less motion).
3. The person presses it again. The content leaves at once with no animation, the chevron points down again, and focus stays on the trigger.
4. Disabled: Button's disabled ink. A press does nothing and the chevron stays down.

Hover and focus never open it (`col-aria-1`).

## Answers to the open questions

| #   | Question               | Answer                                                                                                            | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Open motion            | (a), confirmed: opacity fade on open at `motion.feedback.duration`, none on close, `animation: none` under reduce | Under 2.3.3 an opacity change is not motion (K-0124). It follows a press, so 2.2.2 does not apply (K-0125). It is the fade TaskBar already ships (K-0126). (b) needs `overflow: hidden` while the height grows, which clips the 3 px focus halo of any control inside the content (DESIGN.md §7: focus is "never removed"). It would also bring the overlay duration into a base control and break DESIGN.md §9 item 6 (ambient motion). (c) would make the content appear with a hard jump, while the 120 ms fade marks where the new block came from. Measured: computed `animationName` `ds-fade-in` and `animationDuration` `0.12s` in every non-reduced shot; `none` and `0s` in `neutral-light-360-th-reduced.png` |
| 2   | Trigger look           | (a), confirmed: our ghost `Button` md with a chevron that swaps down and up, plus rows D2 to D5 below             | A ghost pill matches the quiet look of the rest of the Studio. Its hover, focus, pressed and disabled looks and its contrast pairs are already proven (`pairs.ts` unchanged). The state shows by shape: the chevron points down or up, never by colour only (DESIGN.md §7). (b) needs a new recipe part and new pairs, and a full-width row on a card turns every block into the same bar (DESIGN.md §9 item 3, card kit). One change to Button's own form is needed: the label must wrap (D3). Button sets `white-space: nowrap` (`recipes.css` line 32), so a long caller label would overflow at 360 px                                                                                                               |
| 3   | `aria-controls` closed | (a), confirmed: Radix's own, absent while closed                                                                  | The APG makes `aria-controls` optional (K-0123). Keeping it set while closed needs `forceMount`, which the spec leaves out of scope. Nothing visible depends on it, so no screenshot is needed. AC 1 and AC 3 assert that it is absent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Anatomy

```
.ds-collapsible                         column, gap space.stack.sm (8)
  button.ds-button.ds-collapsible__trigger   ghost md, align-self start, label wraps
    {children}  span.ds-button__icon > ExpandIcon | CollapseIcon
  div.ds-collapsible__content           mounted only while open; inset to the label's start edge
```

## Visual decisions

| #   | Decision                  | Value (tokens)                                                                                                                                                                                                                | Source intent                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Root                      | `display: flex; flex-direction: column; gap: var(--ds-space-stack-sm)` (8 px); `min-inline-size: 0`                                                                                                                           | Contract table. The content sits close under its trigger and reads as part of it                                                                                                                                                                                                                                                                                      |
| D2  | Trigger width             | `align-self: flex-start; max-inline-size: 100%`                                                                                                                                                                               | The pill is as wide as its label, as TaskBar's is. It never grows wider than its column                                                                                                                                                                                                                                                                               |
| D3  | Trigger label wraps       | `white-space: normal; text-align: start`; `padding-block: calc((var(--cmp-button-height-md) - 2px - 1lh) / 2)` (9 px)                                                                                                         | At one line the trigger is exactly 40 px, the same height as any md Button next to it (measured 40 in every shot). At 2, 3 and 4 lines each line gets the same 9 px top and bottom space (measured 62.4, 84.8, 107.2 px). Neutral becomes a stadium shape and professional a 6 px rectangle, and the label stays inside the curve (`neutral-light-360-en.png` item 6) |
| D4  | Chevron on the first line | trigger `align-items: flex-start`; `.ds-collapsible__trigger .ds-button__icon { margin-block-start: calc((1lh - var(--cmp-button-icon-size-md)) / 2) }`                                                                       | The chevron stays next to the first line of the label at every line count. It does not float down the middle of a 3-line block. Measured: icon centre to first-line centre is 0.2 px at 1, 3 and 4 lines                                                                                                                                                              |
| D5  | Chevron swap              | `ExpandIcon` (down) closed, `CollapseIcon` (up) open; no transition, no rotation                                                                                                                                              | `col-trigger-1`. The state shows by shape, and nothing moves                                                                                                                                                                                                                                                                                                          |
| D6  | Content start edge        | `padding-inline: calc(var(--cmp-button-padding-x-md) + 1px)` (17 px)                                                                                                                                                          | One start edge: the content's first glyph lines up with the label's first glyph (Button padding plus its 1 px border). Measured 49 px and 49 px in every shot. Reading `--cmp-button-padding-x-md` keeps them aligned under any profile that changes Button's padding                                                                                                 |
| D7  | Content type              | `type.body.sm` (14 px, line height 1.7): font-family, size, line-height, weight and letter-spacing from `--ds-type-body-sm-*`; no colour (inherits)                                                                           | Without this rule the bare text inherited the 16 px page size and looked larger than its own 14 px semibold label, which turned the order of importance upside down (first render). At 14 px regular under a 14 px semibold label, the label leads and the content explains. Line height 1.7 keeps the Thai marks above and below whole                               |
| D8  | Content long words        | `min-inline-size: 0; overflow-wrap: break-word`                                                                                                                                                                               | A long Latin token with no break point breaks only when it cannot fit. Thai keeps the browser's word breaks                                                                                                                                                                                                                                                           |
| D9  | Open fade                 | `.ds-collapsible__content { animation: ds-fade-in var(--ds-motion-feedback-duration) var(--ds-motion-easing); }` on the bare class (the element exists only while open)                                                       | Q1. Use the bare class, not `[data-state="open"]`, so the reduced-motion rule below (same selector, later in the file) wins. The mock first used `[data-state="open"]`, and the reduce rule on the bare class lost on specificity: `animationName` stayed `ds-fade-in` under emulated reduce                                                                          |
| D10 | Reduced motion            | `@media (prefers-reduced-motion: reduce) { .ds-collapsible__content { animation: none; } }`, placed after D9                                                                                                                  | `col-motion-1`, AC 7                                                                                                                                                                                                                                                                                                                                                  |
| D11 | States                    | Button ghost's own: hover `--cmp-button-ghost-bg-hover` fill and border, focus the border turned to `focus.ring` with its halo, pressed `--cmp-button-ghost-bg-press`, disabled `--cmp-button-ghost-fg-disabled`. No override | DESIGN.md §7. Focus (a line and a halo) and hover (a fill) look different in every shot. Open is not a selected state: it gets no fill and is shown only by the chevron                                                                                                                                                                                               |

States that do not apply: loading, selected, invalid, empty and read-only. The component owns no data. An empty `children` in the content is the caller's case.

## Builder table: CSS and markup per rule

Add these to `packages/design-system/src/recipes/recipes.css` in one block, after the TaskBar block. Write them in this order so D10 comes after D9.

| Rule          | Markup                                                                                                                                                                                                                                                                                                                                 | CSS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| col-api-1     | `<RadixCollapsible.Root className={cx("ds-collapsible", className)} ...>`; `<RadixCollapsible.Content className={cx("ds-collapsible__content", className)}>`                                                                                                                                                                           | `.ds-collapsible { display: flex; flex-direction: column; gap: var(--ds-space-stack-sm); min-inline-size: 0; }` / `.ds-collapsible__content { min-inline-size: 0; padding-inline: calc(var(--cmp-button-padding-x-md) + 1px); overflow-wrap: break-word; font-family: var(--ds-type-body-sm-font-family); font-size: var(--ds-type-body-sm-font-size); line-height: var(--ds-type-body-sm-line-height); font-weight: var(--ds-type-body-sm-font-weight); letter-spacing: var(--ds-type-body-sm-letter-spacing); }` |
| col-trigger-1 | `<RadixCollapsible.Trigger asChild><Button variant="ghost" size="md" className={cx("ds-collapsible__trigger", className)} iconTrailing={open ? <CollapseIcon /> : <ExpandIcon />}>{children}</Button></RadixCollapsible.Trigger>`. Read `open` from the root through a small context or from `data-state`; do not set `aria-*` by hand | `.ds-collapsible__trigger { align-self: flex-start; align-items: flex-start; max-inline-size: 100%; white-space: normal; text-align: start; padding-block: calc((var(--cmp-button-height-md) - 2px - 1lh) / 2); }` / `.ds-collapsible__trigger .ds-button__icon { margin-block-start: calc((1lh - var(--cmp-button-icon-size-md)) / 2); }`                                                                                                                                                                         |
| col-motion-1  | none                                                                                                                                                                                                                                                                                                                                   | `.ds-collapsible__content { animation: ds-fade-in var(--ds-motion-feedback-duration) var(--ds-motion-easing); }` then `@media (prefers-reduced-motion: reduce) { .ds-collapsible__content { animation: none; } }`. No `height`, `width`, `transform` or inset in either rule                                                                                                                                                                                                                                       |

The specificity of `.ds-collapsible__trigger` (0,1,0) ties with `.ds-button` (0,1,0). The Collapsible block comes later in the file, so it wins; `[data-size]` rules on Button set `min-height` and `padding-inline` only and leave `padding-block` alone. If the builder moves the block above Button, use `.ds-button.ds-collapsible__trigger`.

## Spec amendments this design needs (L-0019)

1. Contract table, recipe row: add the trigger wrap and first-line chevron (D3, D4) and the content inset and type (D6, D7, D8). There is still no new token and no new pair, and `recipes.test.ts` already accepts `calc()`, `1lh` and `2px` (see `recipes.css` lines 438 and 594).
2. AC 11 (`At360`): add a second Collapsible whose trigger label is `fixtures.longThai`. Assert the trigger's `scrollWidth` is not above its `clientWidth`, its height is above 40 (wrapped), and `expectNoGlyphClip` passes on it. The spec's short label never wraps, so without this the D3 wrap goes unproven, and Button's `nowrap` would overflow 360 px.
3. AC 6 and AC 7: the fade rule and the reduce rule both use the bare `.ds-collapsible__content` (D9). The stylesheet walk should look for that exact selector in both places.

## Screens to check in visual QA

`Default`, `Keyboard` (focus), `Open`, `Disabled`, `At360`, `InEnglish` and `RecipesAndModes` at 360 and 1440 px, Thai and English, light and dark. Check these:

- The chevron points down when closed and up when open.
- The focus line and halo show on the trigger and look different from hover.
- The content's first glyph sits on the label's start edge.
- The trigger is 40 px at one line, and the chevron stays on the first line at 2 or more lines.
- Thai marks above and below are whole in the label and the content.
- The page never scrolls sideways at 360.
- The content does not fade under reduced motion.

## Proposal screenshots

Rendered on Storybook port 6421 (stopped afterwards). The proposed CSS was injected with `page.addStyleTag`, and the mock markup (real `ds-button` ghost md classes, lucide chevron paths) replaced the surface of `base-button--with-icons`. Device scale 2. Each shot holds:

1. Closed, focused by Tab
2. Open
3. Hover (forced)
4. Disabled
5. Open with long content
6. Long label closed, hover forced
7. Longer label open (4 lines at 360)
8. Open inside a `ds-card`

Folder: `/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO/.orivilo/runs/ORV-203/ORV-203-design-1/screenshots/`

- `neutral-light-360-th.png`, `neutral-light-360-en.png`, `neutral-light-1440-th.png`, `neutral-light-1440-en.png`
- `neutral-dark-360-th.png`, `neutral-dark-360-en.png`, `neutral-dark-1440-th.png`, `neutral-dark-1440-en.png`
- `professional-light-360-th.png`, `professional-light-1440-th.png`, `professional-dark-360-th.png`, `professional-dark-1440-th.png`
- `neutral-light-360-th-reduced.png` (emulated `prefers-reduced-motion: reduce`)

Measured in all thirteen:

- Document `scrollWidth` equals the viewport (360 or 1440).
- Trigger heights are 40 px at one line, 62.4 at two (1440), and 84.8 and 107.2 at three and four lines (360).
- Label and content start edges are both 49 px.
- The chevron centre is within 0.2 px of the first-line centre.
- Content `fontSize` is 14 px.
- The trigger radius is 999 px (neutral) and 6 px (professional).
- Content animation is `ds-fade-in 0.12s`, and `none 0s` under reduce.

The rendered shots used `overflow-wrap: anywhere` on the content. D8 specifies `break-word`, which differs only for a run with no break point, so it changes nothing in these fixtures.
