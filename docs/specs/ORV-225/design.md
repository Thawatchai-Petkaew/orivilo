---
issue: ORV-225 (https://tpetkaew.atlassian.net/browse/ORV-225)
spec: docs/specs/ORV-225/spec.md v1.0
task: ORV-225-design-1
version: 1
---

# ORV-225 design: Sidebar navigation, Top navigation, Page header and Section header

This file covers slices A to F. It answers open questions 3, 6 and 9, gives the builders one numbered table of CSS and markup per rule, and holds the recipe blocks. Every look below was rendered: the CSS in "Recipe blocks" was injected into the real Storybook bundle on port 6433 with the real `recipes.css` and tokens, on markup built from the component classes. Nothing under `packages/` or `apps/` changed. No component exists yet, so these are proposals on real tokens, not proofs of a build.

Where this file and the spec differ, the table "Amendments to the spec" says so by rule and row number. Open question 9 is the one answer that leaves its default, so it waits for a decision. The other amendments are corrections the renders forced.

## Answers to the open questions

<!-- prettier-ignore -->
| Question | Answer | Why |
| --- | --- | --- |
| 3, the current page look | Default a) confirmed. `bg-active` to `surface.selected`, `fg-active` and `bead` to `selection.fg`, bead shape kept | `surface.selected` on the canvas measures 1.00 at worst (neutral light) and 1.10 on raised, so the fill is a soft ground and never the only mark. Ink and bead carry it, and every pair passes in all four sets (table below). Shot under neutral, friendly and professional in both modes |
| 6, a wrapping Page header title | Default a) confirmed, line height 1.7, with one amendment: top padding `space.stack.sm` (8), not the 16 of `text-display-md` | Measured below. At 1.25 lines collide (gap -11.50). At 1.7 they clear (gap 2.50). At 1.7 the ink sits lower in its box, so 16 px of padding is more than the mark needs: 8 px keeps the 6.5 px of DESIGN.md section 4, the title stays where it is, and a one-line title grows by 6.4 px, not W7's 14.4 |
| 9, the top row's `max-w-2xl` beside a full-width Sidebar | Differs from default a). A third option: full width on Sidebar routes only, `max-w-2xl` stays on `/` and `/account` | The default render has three start edges at 1440: logo about 400, Sidebar 24, title 352, and the locale switch ends on no edge. The third option puts the logo on the Sidebar's icon edge, 24 px, and on the screen's `p-6` at 360. `header.spec.ts` reads `/` only, so none of its numbers change. Needs a decision: changes `top-nav-1` and `shell-ia-1` |

Worst contrast pairs across neutral, professional, friendly and orivilo in both modes, computed with `pairs-check.ts` from the token build. None fails.

<!-- prettier-ignore -->
| Pair | Worst | Where | Floor |
| --- | --- | --- | --- |
| `text.secondary` on canvas | 5.10 | professional light | 4.5 |
| `text.secondary` on raised | 5.30 | professional light | 4.5 |
| `text.primary` on hover | 6.80 | professional dark | 4.5 |
| `selection.fg` on selected | 5.10 | neutral dark | 4.5 |
| `selection.fg` on canvas | 6.10 | neutral dark | 4.5 |
| `selection.fg` on raised | 5.70 | neutral dark | 4.5 |
| `selection.fg` on hover | 4.50 | professional dark | 4.5, no margin left |
| `text.primary` on card | 10.20 | worst of the four | 4.5 |

Page header title, measured in Chromium at 32 px, DPR 2.

<!-- prettier-ignore -->
| Form | Box height | Ink top | Ink bottom | Gap between wrapped lines |
| --- | --- | --- | --- | --- |
| `text-display-md` today, 1.25, top 16 | 56 | 7.5 | 48 | -11.50 |
| Proposed, 1.7, top 8 | 62.39 | 6.5 | 47 | 2.50 |

Other line gaps under the `lines-clear-1` floor of 1.0 at DPR 2: section title 1.50, Sidebar label 1.00, which sits exactly on the floor and has no margin. A one-line `sm` label's ink is whole, at item height 32.

## Flow

1. A person lands on a route. The top row shows the logo, the section links and the locale switch. The current section is filled, with a bead.
2. On `/directions` and `/workspace` the Sidebar sits under the row at the start edge, and its current page is filled, with a bead. The top link shows the section, the side link the page.
3. The first Tab shows the skip link over the top row. Enter moves focus to `main`. A second Tab hides it and reaches the home link.
4. Pressing the Sidebar toggle narrows the panel to a rail and the content takes the room, with no animation. Each icon shows its label in a tooltip on hover and focus. The cookie keeps the state.
5. Below 768 px each navigation becomes an icon button. The button opens a drawer at the start edge with the same items in the same order and the current item marked. A press on a link closes it, and Esc returns focus to the opener.
6. On a screen, Page header opens the content and Section header opens each block. Below 480 px the action moves under the title, on the same start edge.

## Source intent

- The task is finding your place and moving on, so the look is calm: one ground, no panel edge, one soft fill. The owner's mood E, airy bento, is borderless.
- Selected is `surface.selected`, by DESIGN.md section 8. Brand accent never replaces selection, so `brand.signature` leaves the nav item (AGENTS.md).
- The bead is the non-colour cue of DESIGN.md section 7. It sits in the padding, so a marked label stays on the same start edge as its siblings.
- Focus keeps its line and halo on a marked row (DESIGN.md section 8), and it is drawn inside the box so a scroll box cannot clip it.
- Thai sets the type: 1.7 on anything that wraps (DESIGN.md section 4, `lines-clear-1`).

## Rules for the builders

Sizes are CSS px under neutral. A profile moves them through its tokens: friendly's rows render 44 tall and its rail wider, and each target stays square because the width reads the same token. Plays are the spec's acceptance rows, so a play reads the token, not the neutral number. Values come from the recipe blocks, which win if a row and a block seem to differ.

### Slice A, Page header

<!-- prettier-ignore -->
| # | Rule | Target | Tokens | Markup or CSS | Proof |
| --- | --- | --- | --- | --- | --- |
| 1 | `page-header-root-1`, `page-header-slots-1` | A `div` root, a missing slot renders no node | None | `div.ds-page-header > div.ds-page-header__row > (div.ds-page-header__text > (hN.ds-page-header__title, p.ds-page-header__description, div.ds-page-header__meta), div.ds-page-header__actions)` | Rows 1, 3, 6 |
| 2 | `header-type-1` | 32 px title, line height 1.7, top padding 8, box 62.39, ink top 6.5 | `type.display.md` size, weight, family, spacing; `type.heading.sm` line height; `space.stack.sm` | Own recipe `.ds-page-header__title`. Do not add `.text-display-md`: it brings the 16 px padding and the 1.25 line | Row 7, gap 2.50 at DPR 2 |
| 3 | `page-header-slots-1` | Text block gap 8, description at most 65ch, meta row gap 8 | `space.stack.sm`, `type.body.md`, `type.body.sm`, `text.secondary`, `space.inline.md` | `.ds-page-header__text`, `__description`, `__meta` | Row 6 |
| 4 | `header-stack-1` | Wide: one row, bottom aligned, gap 16. At 479 and below: a column on one start edge | `space.inset.md` | `@container ds-page-header (max-width: 479px)` on `__row`; a container cannot be styled by its own query, so `__row` is the child that changes | Rows 4, 5 |
| 5 | `reference-adopt-1` | The three inline headers go; the screen's `p-6` and `gap-4` stay | None | `meta` on the workspace screen holds `Badge size="sm"` and its sentence | Row 9 |

### Slice B, Section header

<!-- prettier-ignore -->
| # | Rule | Target | Tokens | Markup or CSS | Proof |
| --- | --- | --- | --- | --- | --- |
| 6 | `section-header-1` | Title row, then `children` 16 below | `space.stack.md` | `div.ds-section-header > (div.ds-section-header__row > (div.ds-section-header__text > (hN.ds-section-header__title, p.ds-section-header__description), div.ds-section-header__actions), children)` | Rows 14, 16 |
| 7 | `header-type-1` | 20 / 1.7 title over 16 / 1.7 description, 8 apart | `type.heading.sm`, `type.body.md`, `space.inline.md` | `.ds-section-header__title`, `__text`, shared `__description` | Rows 13, 18, gap 1.50 at DPR 2 |
| 8 | `header-stack-1` | As row 4 | `space.inset.md` | `@container ds-section-header (max-width: 479px)` | Row 15 |
| 9 | `section-header-1` | With `divider`: 16 below the block, one 1 px line. With `children` the divider does not draw, because Tabs draws its own line and an edge takes one line | `space.stack.md`, `border.subtle` | The component sets `data-divider` only when `divider` is true and `children` is empty | Row 17, plus amendment 7 |
| 10 | `reference-adopt-1` | `actions` holds the live wrapper; the table keeps its name through `captionHidden`; 16 above the title, above the 8 of DESIGN.md section 4 | None | The wrapper keeps `flex min-h-9 flex-wrap items-center gap-3` and `aria-live="polite"`. `actions` always renders here, so the live region stays mounted | Row 20 |

### Slice C, tokens, nav item, Top navigation

<!-- prettier-ignore -->
| # | Rule | Target | Tokens | Markup or CSS | Proof |
| --- | --- | --- | --- | --- | --- |
| 11 | Contract | Three repoints, `bead-size`, and the new `row-radius` | See "Tokens" | `component.json`, then `pnpm --filter @orivilo/design-system tokens` | Row 39 |
| 12 | `nav-size-1` | `sm`: height 32, one line, pill, `type.control.md` | `size.control.sm`, `nav-item.radius` | `a.ds-nav-item[data-size="sm"] > (span.ds-nav-item__bead, span.ds-nav-item__icon, span.ds-nav-item__label, span.ds-nav-item__badge)` | Rows 24, 30 |
| 13 | `nav-look-1` | Rest, hover, marked. A marked item keeps its active colours under the pointer | `nav-item.fg`, `fg-hover`, `bg-hover`, `fg-active`, `bg-active` | `[aria-current]` follows `:hover` in the file | Rows 26, 28 |
| 14 | `nav-focus-1` | 1 px ring, offset -1 px, inset 4 px halo, on marked and unmarked | `focus.ring`, `--_focus-shadow-inset` | The Tabs form, `recipes.css` lines 919 to 923 | Rows 29, 48, amendment 2 |
| 15 | `nav-look-1` | Bead 8 px, in the padding, 4 px off the content, centred on the first line. Absolute, so the label stays on its edge | `nav-item.bead`, `bead-size`, `radius`, `space.inline.sm` | Render `span.ds-nav-item__bead aria-hidden` only on a marked row; a group's only while closed | Rows 26, 40 |
| 16 | `nav-item-1` | Icon 16, centred on the first line; badge `sm`, centred on the first line, at the end of the row | `size.icon.sm`, `badge.height-sm` | `.ds-nav-item__icon`, `__badge` | Row 31 |
| 17 | `top-nav-1` | Row: `nav` then `actions`, 12 between, list gap 4 | `space.inline.lg`, `space.inline.md`, `space.inline.sm` | `header.ds-top-nav > (a.ds-top-nav__skip, div.ds-top-nav__row > (nav.ds-top-nav__nav > (brand, ul.ds-top-nav__list, button.ds-top-nav__opener), div.ds-top-nav__actions))` | Row 24 |
| 18 | `nav-size-1` | One item is at most 240 wide and truncates. The cap sits on the `li`, not the link, or a capped link leaves a gap | `size.panel.min` | `.ds-top-nav__list > li` | Row 30 |
| 19 | `nav-size-1`, `frame-ink-1` | Thai marks whole in a truncated label | `space.inline.sm` | Add `.ds-nav-item[data-size="sm"] .ds-nav-item__label` to the clip list at `recipes.css` line 4715 | Row 30 |
| 20 | `nav-narrow-1` | 767 and below: list and second row hide, opener `sm` with `MenuIcon` shows | None | `@container ds-top-nav (max-width: 767px)` | Row 34 |
| 21 | `top-nav-1` | Second row 4 below the first; start edge of the fill on the logo's edge | `space.inline.sm` | `div.ds-top-nav__row[data-row="sub"]`. Recipes have no `@layer`, so this beats a `pt-4` in `contentClassName` | Row 32 |
| 22 | `top-skip-1` | One opaque bar over the header, inset 4, radius 12, label 16 inside the bar. A small pill left half a word and half an icon showing beside it (seen and rejected) | `space.inline.sm`, `space.inset.md`, `shape.media.radius`, `surface.card`, `text.primary`, `layer.overlay`, `type.control.md` | Focus comes from the global `:focus-visible`. Out of view by `:not(:focus)` | Row 38, amendment 9 |

### Slice D, Sidebar and its drawer

<!-- prettier-ignore -->
| # | Rule | Target | Tokens | Markup or CSS | Proof |
| --- | --- | --- | --- | --- | --- |
| 23 | `nav-size-1` | `md`: at least 40, label wraps, padding from `(height - 1lh) / 2` so one line centres and more lines keep the same padding | `nav-item.height`, `type.label.md` | `align-items: flex-start`, `--_nav-height`, `--_nav-pad` | Rows 42, 49 |
| 24 | Contract, `nav-look-1` | Row radius 12 at every line count. A pill holds one line and turns into a capsule at six lines (seen and rejected) | `nav-item.row-radius` | Sidebar, drawer, rail. `sm` stays on `nav-item.radius` | Rows 42, 49 |
| 25 | `sidebar-flow-1` | Panel 240, padding 16 block and 8 inline, so labels and icons sit at 24. Gap 16 before the toggle. No edge line: it would stop short on a short page, and a border breaks the rail square (39 by 40) and W4 | `size.panel.min`, `space.inset.md`, `space.inset.sm`, `space.stack.md` | `div.ds-sidebar > (nav.ds-sidebar__panel > (button.ds-sidebar__opener, header slot, div.ds-sidebar__groups, footer slot, button.ds-sidebar__toggle), div.ds-sidebar__content)` | Rows 42, 52 |
| 26 | `sidebar-groups-1` | Items 4 apart. Group label 14 / 1.7 secondary, 16 inline. Divider: 4 above, 8 below, one 1 px line | `space.inline.sm`, `space.stack.sm`, `type.body.sm`, `border.subtle` | `div.ds-sidebar__group[data-divider]`, `p.ds-sidebar__label`, `ul.ds-sidebar__list` | Rows 43, 44 |
| 27 | `nav-group-1` | The trigger is a row like any other: same height, edge and radius, chevron at the end on the first line | `nav-item.*`, `button.icon-size.md` | `<Collapsible className="ds-nav-group">`, `<CollapsibleTrigger className="ds-nav-item ds-nav-group__trigger">`. The nav recipes go at the end of `recipes.css`, after line 4796, and the `[data-variant]` compound beats the ghost Button | Rows 45, 46 |
| 28 | `nav-look-1` | An open marked group: ink only, no fill, no bead; hover takes `bg-hover`. A closed marked group: full look | `nav-item.fg-active`, `bg-hover` | The open and hover selectors sit on the group row's `[data-variant]` compound. A plain `.ds-nav-item[aria-current][data-state="open"]:hover` loses to it, and hover then shows nothing (seen in the first render) | Rows 46, 47 |
| 29 | `nav-group-1` | Children 4 apart, labels on 40 (16 + 16 + 8), the parent's label edge | `space.inset.md`, `size.icon.sm`, `space.inline.md` | `.ds-nav-group__content .ds-nav-item` sets `--_nav-pad`; `CollapsibleContent className="ds-nav-group__content"` | Row 46 |
| 30 | `nav-narrow-1` | 767 and below: panel full width, padding 8 top and 24 inline, content under it. Opener `md` with `PanelStartOpenIcon`, so two openers on one screen differ, ink on the 24 edge | `space.inset.sm`, `space.inset.lg`, `button.height-md`, `size.icon.sm` | `@container ds-sidebar (max-width: 767px)`. `.ds-sidebar__content` needs `flex: 0 0 100%`: at `1 1 0` it does not wrap and the page runs to 746 px | Row 53 |
| 31 | `nav-narrow-1`, `nav-size-1` | Drawer: fill from 8, labels at 24 under the title, items at least 44, group and dividers as the panel | `space.inset.md`, `size.touch` | `<SheetContent className="ds-nav-drawer" side="start">`, `ul.ds-nav-drawer__list`, `p.ds-nav-drawer__label` for `subName`; the body bleeds 16 each way | Rows 35, 53 |

### Slice E, the rail

<!-- prettier-ignore -->
| # | Rule | Target | Tokens | Markup or CSS | Proof |
| --- | --- | --- | --- | --- | --- |
| 32 | `sidebar-rail-1` | Panel 56. Target 40 by 40, icon centred, `--_nav-pad` 12 | `nav-item.height`, `space.inset.sm`, `size.icon.sm` | `@container ds-sidebar (min-width: 768px)` with `[data-collapsed]` on the panel, so the state cannot reach the narrow form | Rows 57, 59, 62 |
| 33 | `nav-look-1` | Bead at 0 to 8, 4 off the icon. It passes over the focus line on a focused marked target; the two stay readable, accepted | `nav-item.bead-size` | The bead's own `calc`, from `--_nav-pad` | Row 59 |
| 34 | `sidebar-rail-1` | Labels, badges and chevrons out of view and in the name; group labels gone; dividers kept | None | Clip form in the recipe. `display: none` would drop them from the name | Rows 57, 59 |
| 35 | `sidebar-rail-1` | A group renders closed in the rail and keeps its open state for later, so a marked group shows the full look | None | The component passes `open={false}` while collapsed; amendment 11 | Rows 59, 60 |
| 36 | `sidebar-rail-1` | Toggle at the end edge when wide, centred in the rail. `PanelStartCloseIcon` to collapse, `PanelStartOpenIcon` to expand. No width animation, so nothing to reduce | None | `.ds-sidebar__toggle` | Row 57 |

### Slice F, the shell

<!-- prettier-ignore -->
| # | Rule | Target | Tokens | Markup or CSS | Proof |
| --- | --- | --- | --- | --- | --- |
| 37 | Question 9, needs a decision | On `/directions` and `/workspace` the row is full width with padding 24, so logo, Sidebar icons and, at 360, the screen's title share one edge. Row height and logo top stay 48 and 20 | None | `AppNav` picks `contentClassName` from `usePathname`: `px-6 pt-4` on Sidebar routes, `mx-auto max-w-2xl px-4 pt-4` elsewhere | Rows 64, 65, 68 |
| 38 | `reference-adopt-1` | `InShell` passes the Sidebar-route form | None | Fullscreen story, see builder notes | Row 73 |
| 39 | `top-skip-1` | The skip bar covers the first row on every route | None | Row 22 | Row 70 |

If the owner keeps default a), row 37 falls away: `contentClassName` is always the `max-w-2xl` form and everything else stands.

### Builder notes

- Inline-size containment collapses to zero inside a shrink-to-fit parent. Storybook's `layout: "centered"` is one. Stories of all four parts use `fullscreen` or `padded`.
- Queries are named. An unnamed query would read the nearest container, and these parts nest in each other and in the screen's `@container`.
- `CollapsibleTrigger` renders children straight into `Button`, so bead, icon and label are flex children of the row, and its `iconTrailing` is the chevron.
- `--_nav-height` and `--_nav-pad` are local properties. The `var()` check in `recipes.test.ts` matches `[a-z0-9-]+` only, so they pass it, as `--_focus-shadow-inset` does.
- `SheetContent` takes `className`, so the drawer needs no change to Sheet.
- Reduced motion needs no new rule: `orivilo.css` sets the motion durations to 0 ms.

## Recipe blocks

Add these at the end of `recipes.css`, after the Collapsible block. The order inside matters: the group row must follow `.ds-collapsible__trigger`.

### ds-nav-item

```css
.ds-nav-item {
  --_nav-height: var(--cmp-nav-item-height);
  --_nav-pad: var(--ds-space-inset-md);
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: var(--ds-space-inline-md);
  inline-size: 100%;
  min-block-size: var(--_nav-height);
  padding-block: calc((var(--_nav-height) - 1lh) / 2);
  padding-inline: var(--_nav-pad) var(--ds-space-inset-md);
  border: 0;
  border-radius: var(--cmp-nav-item-row-radius);
  background: transparent;
  color: var(--cmp-nav-item-fg);
  font-family: var(--ds-type-label-md-font-family);
  font-size: var(--ds-type-label-md-font-size);
  line-height: var(--ds-type-label-md-line-height);
  font-weight: var(--ds-type-label-md-font-weight);
  letter-spacing: var(--ds-type-label-md-letter-spacing);
  text-align: start;
  text-decoration: none;
  white-space: normal;
  cursor: pointer;
  transition:
    background-color var(--ds-motion-feedback-duration) var(--ds-motion-easing),
    color var(--ds-motion-feedback-duration) var(--ds-motion-easing);
}
.ds-nav-item[data-size="sm"] {
  --_nav-height: var(--ds-size-control-sm);
  display: inline-flex;
  align-items: center;
  inline-size: auto;
  max-inline-size: 100%;
  block-size: var(--_nav-height);
  min-block-size: 0;
  padding-block: 0;
  border-radius: var(--cmp-nav-item-radius);
  font-family: var(--ds-type-control-md-font-family);
  font-size: var(--ds-type-control-md-font-size);
  line-height: var(--ds-type-control-md-line-height);
  font-weight: var(--ds-type-control-md-font-weight);
  letter-spacing: var(--ds-type-control-md-letter-spacing);
  white-space: nowrap;
}
.ds-nav-item:hover {
  background: var(--cmp-nav-item-bg-hover);
  color: var(--cmp-nav-item-fg-hover);
}
.ds-nav-item[aria-current] {
  background: var(--cmp-nav-item-bg-active);
  color: var(--cmp-nav-item-fg-active);
}
.ds-nav-item:focus-visible {
  outline: 1px solid var(--ds-focus-ring);
  outline-offset: -1px;
  box-shadow: var(--_focus-shadow-inset);
}
.ds-nav-item__bead {
  position: absolute;
  inset-inline-start: calc(
    var(--_nav-pad) - var(--cmp-nav-item-bead-size) - var(--ds-space-inline-sm)
  );
  inset-block-start: calc((var(--_nav-height) - var(--cmp-nav-item-bead-size)) / 2);
  inline-size: var(--cmp-nav-item-bead-size);
  block-size: var(--cmp-nav-item-bead-size);
  border-radius: var(--cmp-nav-item-radius);
  background: var(--cmp-nav-item-bead);
}
.ds-nav-item__icon {
  display: inline-flex;
  flex: none;
  inline-size: var(--ds-size-icon-sm);
  block-size: var(--ds-size-icon-sm);
  margin-block-start: calc((1lh - var(--ds-size-icon-sm)) / 2);
}
.ds-nav-item[data-size="sm"] .ds-nav-item__icon {
  margin-block-start: 0;
}
.ds-nav-item__icon > svg {
  inline-size: 100%;
  block-size: 100%;
}
.ds-nav-item__label {
  flex: 1 1 auto;
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
/* Also add this selector to the clip list above (rules row 19). */
.ds-nav-item[data-size="sm"] .ds-nav-item__label {
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ds-nav-item__badge {
  display: inline-flex;
  flex: none;
  margin-block-start: calc((1lh - var(--cmp-badge-height-sm)) / 2);
}
.ds-nav-item[data-size="sm"] .ds-nav-item__badge {
  margin-block-start: 0;
}

/* The group row: a Collapsible trigger, so these beat the ghost Button. */
.ds-nav-item.ds-nav-group__trigger[data-variant] {
  color: var(--cmp-nav-item-fg);
  border: 0;
  background: transparent;
}
.ds-nav-item.ds-nav-group__trigger[data-variant]:hover {
  background: var(--cmp-nav-item-bg-hover);
  color: var(--cmp-nav-item-fg-hover);
}
.ds-nav-item.ds-nav-group__trigger[data-variant][aria-current] {
  background: var(--cmp-nav-item-bg-active);
  color: var(--cmp-nav-item-fg-active);
}
.ds-nav-item.ds-nav-group__trigger[data-variant][aria-current][data-state="open"] {
  background: transparent;
}
.ds-nav-item.ds-nav-group__trigger[data-variant][aria-current][data-state="open"]:hover {
  background: var(--cmp-nav-item-bg-hover);
}
.ds-nav-item.ds-nav-group__trigger[data-variant]:focus-visible {
  outline: 1px solid var(--ds-focus-ring);
  outline-offset: -1px;
  box-shadow: var(--_focus-shadow-inset);
}
.ds-nav-group__trigger .ds-button__icon {
  margin-block-start: calc((1lh - var(--cmp-button-icon-size-md)) / 2);
}
.ds-nav-group {
  gap: var(--ds-space-inline-sm);
}
.ds-nav-group__content {
  padding-inline: 0;
}
.ds-nav-group__content .ds-nav-item {
  --_nav-pad: calc(var(--ds-space-inset-md) + var(--ds-size-icon-sm) + var(--ds-space-inline-md));
}

.ds-sidebar__list,
.ds-nav-drawer__list,
.ds-top-nav__list {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
  min-inline-size: 0;
}
.ds-sidebar__list,
.ds-nav-drawer__list {
  flex-direction: column;
  gap: var(--ds-space-inline-sm);
}
.ds-sidebar__list > li[data-divider],
.ds-nav-drawer__list > li[data-divider] {
  margin-block-start: var(--ds-space-inline-sm);
  padding-block-start: var(--ds-space-stack-sm);
  border-block-start: 1px solid var(--ds-border-subtle);
}
```

### Top navigation

```css
.ds-top-nav {
  container: ds-top-nav / inline-size;
  position: relative;
  inline-size: 100%;
}
.ds-top-nav__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-inline-lg);
  min-inline-size: 0;
}
.ds-top-nav__row[data-row="sub"] {
  padding-block-start: var(--ds-space-inline-sm);
}
.ds-top-nav__nav {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: var(--ds-space-inline-lg);
  min-inline-size: 0;
}
.ds-top-nav__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--ds-space-inline-md);
}
.ds-top-nav__list {
  align-items: center;
  gap: var(--ds-space-inline-sm);
}
.ds-top-nav__list > li {
  display: flex;
  flex: 0 1 auto;
  min-inline-size: 0;
  max-inline-size: var(--ds-size-panel-min);
}
.ds-top-nav__opener {
  display: none;
}
@container ds-top-nav (max-width: 767px) {
  .ds-top-nav__list,
  .ds-top-nav__row[data-row="sub"] {
    display: none;
  }
  .ds-top-nav__opener {
    display: inline-flex;
  }
}
.ds-top-nav__skip {
  position: absolute;
  inset: var(--ds-space-inline-sm);
  z-index: var(--ds-layer-overlay);
  display: flex;
  align-items: center;
  padding-inline: var(--ds-space-inset-md);
  border-radius: var(--ds-shape-media-radius);
  background: var(--ds-surface-card);
  color: var(--ds-text-primary);
  font-family: var(--ds-type-control-md-font-family);
  font-size: var(--ds-type-control-md-font-size);
  line-height: var(--ds-type-control-md-line-height);
  font-weight: var(--ds-type-control-md-font-weight);
  text-decoration: none;
  white-space: nowrap;
}
.ds-top-nav__skip:not(:focus) {
  clip-path: inset(50%);
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  overflow: hidden;
}
```

### Sidebar and its rail

```css
.ds-sidebar {
  container: ds-sidebar / inline-size;
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  inline-size: 100%;
}
.ds-sidebar__panel {
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-direction: column;
  gap: var(--ds-space-stack-md);
  inline-size: var(--ds-size-panel-min);
  padding-block: var(--ds-space-inset-md);
  padding-inline: var(--ds-space-inset-sm);
}
.ds-sidebar__content {
  flex: 1 1 0;
  min-inline-size: 0;
}
.ds-sidebar__groups {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-inline-sm);
}
.ds-sidebar__group {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-inline-sm);
}
.ds-sidebar__group[data-divider] {
  margin-block-start: var(--ds-space-inline-sm);
  padding-block-start: var(--ds-space-stack-sm);
  border-block-start: 1px solid var(--ds-border-subtle);
}
.ds-sidebar__label {
  margin: 0;
  padding-block: var(--ds-space-inline-sm);
  padding-inline: var(--ds-space-inset-md);
  color: var(--cmp-nav-item-fg);
  font-family: var(--ds-type-body-sm-font-family);
  font-size: var(--ds-type-body-sm-font-size);
  line-height: var(--ds-type-body-sm-line-height);
  font-weight: var(--ds-type-body-sm-font-weight);
  letter-spacing: var(--ds-type-body-sm-letter-spacing);
  overflow-wrap: anywhere;
}
.ds-sidebar__toggle {
  align-self: flex-end;
}
.ds-sidebar__opener {
  display: none;
  margin-inline-start: calc((var(--ds-size-icon-sm) - var(--cmp-button-height-md)) / 2);
}
@container ds-sidebar (max-width: 767px) {
  .ds-sidebar__panel {
    flex: 0 0 100%;
    inline-size: 100%;
    padding-block: var(--ds-space-inset-sm) 0;
    padding-inline: var(--ds-space-inset-lg);
  }
  .ds-sidebar__content {
    flex: 0 0 100%;
  }
  .ds-sidebar__groups,
  .ds-sidebar__toggle {
    display: none;
  }
  .ds-sidebar__opener {
    display: inline-flex;
  }
}
@container ds-sidebar (min-width: 768px) {
  .ds-sidebar__panel[data-collapsed] {
    inline-size: calc(var(--cmp-nav-item-height) + 2 * var(--ds-space-inset-sm));
  }
  .ds-sidebar__panel[data-collapsed] .ds-nav-item {
    --_nav-pad: calc((var(--cmp-nav-item-height) - var(--ds-size-icon-sm)) / 2);
    inline-size: var(--cmp-nav-item-height);
    block-size: var(--cmp-nav-item-height);
    padding-inline: var(--_nav-pad);
    gap: 0;
  }
  .ds-sidebar__panel[data-collapsed] .ds-nav-item__label,
  .ds-sidebar__panel[data-collapsed] .ds-nav-item__badge,
  .ds-sidebar__panel[data-collapsed] .ds-nav-group__trigger .ds-button__icon {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .ds-sidebar__panel[data-collapsed] .ds-sidebar__label {
    display: none;
  }
  .ds-sidebar__panel[data-collapsed] .ds-sidebar__toggle {
    align-self: center;
  }
}
```

### The drawer

```css
.ds-nav-drawer .ds-side-sheet__body {
  margin-inline: calc(-1 * var(--ds-space-inset-md));
  padding-inline: 0;
}
.ds-nav-drawer .ds-nav-item {
  --_nav-height: var(--ds-size-touch);
}
.ds-nav-drawer__label {
  margin: 0;
  padding-block: var(--ds-space-stack-sm) var(--ds-space-inline-sm);
  padding-inline: var(--ds-space-inset-md);
  color: var(--cmp-nav-item-fg);
  font-family: var(--ds-type-body-sm-font-family);
  font-size: var(--ds-type-body-sm-font-size);
  line-height: var(--ds-type-body-sm-line-height);
  font-weight: var(--ds-type-body-sm-font-weight);
}
```

### Page header

```css
.ds-page-header {
  container: ds-page-header / inline-size;
  inline-size: 100%;
  min-inline-size: 0;
}
.ds-page-header__row,
.ds-section-header__row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--ds-space-inset-md);
}
.ds-page-header__text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--ds-space-stack-sm);
  min-inline-size: 0;
}
.ds-page-header__title {
  margin: 0;
  padding-block-start: var(--ds-space-stack-sm);
  color: var(--ds-text-primary);
  font-family: var(--ds-type-display-md-font-family);
  font-size: var(--ds-type-display-md-font-size);
  line-height: var(--ds-type-heading-sm-line-height);
  font-weight: var(--ds-type-display-md-font-weight);
  letter-spacing: var(--ds-type-display-md-letter-spacing);
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.ds-page-header__description,
.ds-section-header__description {
  margin: 0;
  max-inline-size: 65ch;
  color: var(--ds-text-secondary);
  font-family: var(--ds-type-body-md-font-family);
  font-size: var(--ds-type-body-md-font-size);
  line-height: var(--ds-type-body-md-line-height);
  font-weight: var(--ds-type-body-md-font-weight);
  letter-spacing: var(--ds-type-body-md-letter-spacing);
}
.ds-page-header__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-inline-md);
  margin: 0;
  color: var(--ds-text-secondary);
  font-family: var(--ds-type-body-sm-font-family);
  font-size: var(--ds-type-body-sm-font-size);
  line-height: var(--ds-type-body-sm-line-height);
  font-weight: var(--ds-type-body-sm-font-weight);
}
.ds-page-header__actions,
.ds-section-header__actions {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-inline-md);
  max-inline-size: 100%;
}
@container ds-page-header (max-width: 479px) {
  .ds-page-header__row {
    flex-direction: column;
    align-items: flex-start;
  }
  .ds-page-header__text {
    flex: none;
    inline-size: 100%;
  }
}
```

### Section header

```css
.ds-section-header {
  container: ds-section-header / inline-size;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-stack-md);
  inline-size: 100%;
  min-inline-size: 0;
}
.ds-section-header[data-divider] {
  padding-block-end: var(--ds-space-stack-md);
  border-block-end: 1px solid var(--ds-border-subtle);
}
.ds-section-header__text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--ds-space-inline-md);
  min-inline-size: 0;
}
.ds-section-header__title {
  margin: 0;
  color: var(--ds-text-primary);
  font-family: var(--ds-type-heading-sm-font-family);
  font-size: var(--ds-type-heading-sm-font-size);
  line-height: var(--ds-type-heading-sm-line-height);
  font-weight: var(--ds-type-heading-sm-font-weight);
  letter-spacing: var(--ds-type-heading-sm-letter-spacing);
  overflow-wrap: anywhere;
  text-wrap: balance;
}
@container ds-section-header (max-width: 479px) {
  .ds-section-header__row {
    flex-direction: column;
    align-items: flex-start;
  }
  .ds-section-header__text {
    flex: none;
    inline-size: 100%;
  }
}
```

The Page header block holds the shared `__row`, `__description` and `__actions` selectors. Slice A lands them with the Section header names already listed, or slice B adds its names to the three selectors. Either order gives this CSS.

## Tokens

<!-- prettier-ignore -->
| Token | Today | Proposed | In the spec's table |
| --- | --- | --- | --- |
| `nav-item.bg-active` | `{surface.card}` | `{surface.selected}` | Yes |
| `nav-item.fg-active` | `{text.primary}` | `{selection.fg}` | Yes |
| `nav-item.bead` | `{brand.signature}` | `{selection.fg}` | Yes |
| `nav-item.bead-size` | None | `{space.inline.md}` | Yes |
| `nav-item.row-radius` | None | `{shape.media.radius}` | No, new here |

`nav-item.radius` stays `{shape.control.radius}`. It keeps the `sm` pill and the bead, which stays round under professional (6 on an 8 px bead).

Impact of `nav-item.row-radius`: `component.json` gains one key, `generated.css` regenerates, and `.ds-nav-item` reads it. Nothing else reads it, since the recipe is new. No semantic token, primitive or profile changes, and no value moves on an existing reader. The precedent is ORV-204's `menu.option.radius`. `spec-sheet.tsx` keeps `nav-item.radius` on its sample, which is one line tall, so it needs no edit for this token.

## Amendments to the spec

<!-- prettier-ignore -->
| # | Rule or row | Spec says | Change | Why |
| --- | --- | --- | --- | --- |
| 1 | `header-type-1`, open question 6, W7's last figure | "`text-display-md` with its top padding", a one-line title grows 14.40 | Top padding `space.stack.sm`, and `.text-display-md` is not used. A one-line title grows 6.39 | Measured table above. Slice A adds one sentence to DESIGN.md section 4 line 141 for this title form |
| 2 | Rows 29, 48 | `expectFocusBorderForm` passes | A computed read, or a new `expectFocusInsetForm`: outline 1 px in `focus.ring`, offset -1px, inset halo | `nav-focus-1` asks for the inset form. `expectFocusBorderForm` needs a 1 px ring border, a transparent outline and an outer halo (`/ 0px 0px 0px 3px$/`), so it cannot pass |
| 3 | W4, `nav-narrow-1`, row 73 | Expected `767 480 false`, the table stays a table | Expected `767 478 true`. The Table takes its narrow form at containers 768 and 769, and is a table from 770. No CSS change | `.ds-table__frame` has 1 px borders: measured width 480, `clientWidth` 478 at container 768. The narrow form shows the same data |
| 4 | Contract row `pairs.ts`, row 39 | Five pairs | Nine, adding `nav-item.fg-active` on `ds:surface.canvas`, on `side-sheet.bg` and on `nav-item.bg-hover`, and `ds:text.primary` on `ds:surface.card` for the skip link, if `pairs.ts` holds no such row for this recipe | An open marked group shows `fg-active` on no fill and on hover, and a drawer sits on `side-sheet.bg` |
| 5 | Contract row of recipe classes | Lists 13 classes | Adds `ds-top-nav__nav`, `__actions`, `__opener`; `ds-sidebar__content`, `__groups`, `__group`, `__list`, `__opener`; `ds-nav-item__icon`; `ds-nav-group`, `__trigger`, `__content`; `ds-nav-drawer`, `__label`; `ds-page-header__row`, `__text`, `__description`, `__meta`, `__actions`; `ds-section-header__row`, `__text`, `__description`, `__actions`; `data-row="sub"` on the row | The blocks above need them |
| 6 | `nav-narrow-1`, `header-stack-1` | `@container (max-width: ...)` | Named queries `ds-top-nav`, `ds-sidebar`, `ds-page-header`, `ds-section-header` | The parts nest, so an unnamed query reads the wrong container |
| 7 | `section-header-1` | `divider` draws one edge under the block | Not drawn when `children` render | Tabs draws its own line, and one edge takes one line. Row 17 stands: `WithDivider` has no children |
| 8 | Contract rows `nav-item.*` | Three repoints and `bead-size` | Adds `nav-item.row-radius` | Section "Tokens" |
| 9 | `top-skip-1`, row 38 | "sits above the row" | Reads as over the row: an opaque bar covers the header while it has focus, and leaves with the next Tab | The pill left a cut word beside it. Focus sits on the bar, so SC 2.4.11 holds. Row 38's data checks stand |
| 10 | `nav-narrow-1`, contract row of icons | The icon of the opener is not named | Top navigation `MenuIcon`, Sidebar `PanelStartOpenIcon` (reused) | On `/workspace` at 360 both openers show, and each needs its own shape |
| 11 | `sidebar-rail-1`, rows 59, 60 | Silent on an open group in the rail | A group renders closed in the rail and keeps its open state for when the Sidebar widens. A marked group in the rail takes the full look | Children have no icon, so they cannot stand in a rail |
| 12 | `top-nav-1`, `shell-ia-1`, open question 9 | The shell keeps its `max-w-2xl` row | Rules row 37. Waits for a decision | See "Answers" |

The spec's front matter still says "design: none yet". The next spec version picks this file up, with these rows.

## States

Selected and focused are different states. Here selected is the current page, shown by fill, ink and bead; focus is a line and halo. Both show together on a marked row.

<!-- prettier-ignore -->
| State | Nav item | Top navigation | Sidebar | Page header | Section header |
| --- | --- | --- | --- | --- | --- |
| Default | `fg`, no fill | Row with logo, items, actions | Panel 240 | Title, slots given | Title, slots given |
| Hover | `fg-hover` on `bg-hover`; a marked item keeps active colours; an open marked group takes `bg-hover` | Per item | Per item | None of its own | None of its own |
| Focus | Inset line and halo, on marked rows too | Skip bar with the global focus form | Per item; toggle and opener take Button's form | Actions own theirs | Actions own theirs |
| Selected | Fill, ink, bead; open group: ink only; `aria-current` `page` or `true` | One mark per list | One mark per list, group ink too | None | None |
| Disabled | Not built: an unbuilt route is not listed (`nav-item-1`) | None | None | Actions own theirs | Actions own theirs |
| Loading | Not built: items are static props (`nav-item-1`) | None | None | The caller's | The caller's |
| Empty | Missing icon or badge renders no node | No items: logo and actions, no opener | No groups: no `nav`, `children` only | Title only | Title only |
| Error | None: a link has no failure of its own | None | None | Caller's meta row | Caller's |
| Success | None | None | None | None | None |
| Narrow | Drawer height 44 | Opener and drawer | Opener and drawer | Column at 479 | Column at 479 |
| Rail | 40 by 40, label in the name, tooltip | Not applicable | 56 wide | Not applicable | Not applicable |

## Content that decides the shape

<!-- prettier-ignore -->
| Case | What holds it | Seen in |
| --- | --- | --- |
| Thai stacked marks | 1.7 lines; clip list on `sm`; no `overflow` on a wrapping label | `sheet-page-header-360.png`, `sheet-sidebar-1440.png`, `sheet-section-header-360.png` |
| Line counts | Sidebar item at one, two, four and six lines with its icon, bead and badge on the first line; title at one to ten lines at 360; `sm` always one | `sheet-sidebar-1440.png`, `sheet-page-header-360.png` |
| Long name, no spaces | `overflow-wrap: anywhere` on wrapping text; ellipsis on `sm` | `sheet-top-nav-1440.png`, `sheet-sidebar-1440.png` |
| Latin twin | Same blocks, shot in English | Files with `-en-` in the name |
| Missing data | No badge, no icon, no description, no actions, no items: no node, no gap | First rows of each sheet |
| 360 px | One row at the top, a stacked header, the table's narrow form, no sideways scroll | `sheet-shell-360.png` |
| Reduced motion | Durations go to 0 ms through the tokens; the rail has no animation | Read from `orivilo.css`, not shot |

## Screens for visual QA

Everything sits under `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/`. The scratchpad is temporary, so a sign-off shoots again from the built stories. The CSS the shots used is in `rig/proposal.css` there.

<!-- prettier-ignore -->
| Sheet | Shows |
| --- | --- |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/contact-sheet.png | Every shot, neutral and friendly, light and dark, Thai, 360 and 1440, with the English and professional spot sets |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-page-header-360.png | Page header at 360: slots, one to ten lines, the stack |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-page-header-1440.png | Page header at 1440: action on the last line's bottom edge |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-section-header-360.png | Section header at 360: actions, tabs, divider, long titles |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-section-header-1440.png | Section header at 1440 |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-top-nav-360.png | Top navigation at 360 with the skip bar |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-top-nav-1440.png | Top navigation at 1440: rest, marked, badge, icons, long labels, hover and focus, two rows, no items, skip bar |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-sidebar-1440.png | Sidebar: simple, labels, dividers, nested, closed marked group, line counts, hover and focus |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-narrow-and-drawers.png | Both drawers and the Sidebar's narrow row at 360 |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-rail.png | The rail: rest, marked, closed marked group, hover, focus, tooltip |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-shell-1440.png | The real workspace story in the proposed shell, with question 9's default first |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-shell-rail.png | The same shell with the rail |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/sheet-shell-360.png | The same shell at 360 |

Single shots are named `<scene>-<profile>-<mode>-<locale>-<width>.png` in that folder. For question 9, compare these two:

- /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/q9-default-max-w-2xl-neutral-light-th-1440.png
- /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-225-design-1/shell-neutral-light-th-1440.png

For each story of `stories-1`, sign-off checks at 360 and 1280: one start edge per block; marked labels on the same edge as their siblings; rows that hold their radius at six lines; no cut Thai mark, above or below; one line per edge (`WithTabs`, dividers); focus on marked and unmarked rows; the skip bar with nothing showing beside it; `InShell` at containers 768, 769 and 770, where the table turns (amendment 3).

## Seen but out of scope

- The empty `min-h-9` live wrapper leaves 36 px of blank above the table at 360, as it does today. Removing it would push the table down under a person's thumb on their first selection, so it stays.
- The content column on `/workspace` is centred by `max-w-5xl mx-auto`, so its start edge at 1440 lines up with nothing in the shell. That is the screen's own column, and a change would be the shell redesign the spec rules out.
- `selection.fg` on hover is exactly 4.50 under professional dark, and the Sidebar label's line gap is exactly 1.00. Both pass with no margin, so a later token change can fail them.
- In forced colours the fill and the bead's background drop out, so the current item would show no mark. Not rendered here. It needs its own look at the whole system, not one component.
- The second row's labels start 16 past the logo, because its fill starts on the logo's edge. No route uses the two-row form yet.
