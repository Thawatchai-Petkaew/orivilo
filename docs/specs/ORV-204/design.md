# ORV-204: design notes

The design for the three look rows of ORV-204, the Select listbox (owner, 2026-11-01). Each row gives today's values from `recipes.css` and the rendered story, the change in existing tokens and recipe classes, numbered builder rows, and the screenshots that show it. I rendered every change by injecting the proposed CSS into the stories with `page.addStyleTag`. Setup: Storybook at develop `d55c46c`, Chromium, device scale 2, reduced motion, neutral profile unless named. The builder states no value that this file does not hold (L-0017).

Screenshots: `.orivilo/runs/ORV-204/ORV-204-design-1/screenshots/` in the main checkout. Names are `<phase>-<story>-<width>-<locale>-<mode>.png`. `before` is develop, `after` is the proposal. The `sheet-*` files put the four locale and mode cells of one story and width side by side. The `*-measures.json` files hold the computed numbers. `altB-step500-*` and `altC16-*` are the routes I rendered and rejected or replaced (rows 1 and 2). The injected CSS is `final-media.css` in the session scratchpad. Its token mapping is the one written in each row below.

The two stories render the same option text in Thai and English, because the options are fixtures. The locale changes only catalog strings, and an open listbox with options shows none. Both locales were still shot, as the standard asks.

## Rows

| Row | Change in one line | Token value change | Public API change |
| --- | --- | --- | --- |
| 1 | The option highlight takes `shape.media.radius` (12 px under neutral) instead of the pill, and the group separator clears a filled option by 12 px (`space.inline.lg`) on both sides | **Yes**, component token `menu.option.radius` | No |
| 2 | The group heading takes 4 px (`space.inline.sm`) above and below its line instead of 8 px, and disabled text moves from the 400 step to the 500 step so it holds 3.0 | **Yes**, semantic `text.disabled` (contract change) | No |
| 3 | The listbox panel takes `shape.overlay.radius` (24 px under neutral), the radius Command and Dialog already use, instead of `shape.media.radius` (12 px) | **Yes**, component token `menu.radius` | No |

## Row 1: the selected two-line option and the group separator

### Today (measured in `before-measures.json`, `base-select--grouped` with Design System selected)

| What | Value | Source |
| --- | --- | --- |
| Option highlight radius | 999 px (pill) | `.ds-menu__option` `border-radius: var(--cmp-menu-option-radius)`, `menu.option.radius` = `{shape.control.radius}` = `radius.full` |
| One-line option height | 40 px | `menu.option.height` = `size.control.md` |
| Two-line option height | 62 px, and 84 px with a three-line Thai description at 360 (`icons-and-descriptions`) | `[data-described]` adds `padding-block: var(--cmp-menu-padding)` |
| Filled option to separator | 8 px | `.ds-menu__separator` `margin-block: var(--cmp-menu-padding)` = `space.inset.sm` |
| Separator to next heading box | 8 px | same margin |

In `before-grouped-360-th-light.png` the selected Design System option is a stadium: a 62 px block with fully round ends. The fill curves away from the left edge where the label starts, so the label looks pushed in. Its flat bottom runs 8 px over the separator line, and the line sticks out past the curved ends on both sides. At 360 with a three-line description (`before-icons-and-descriptions-360-th-light.png`) the stadium grows to an 84 px oval, and its curve cuts in close to the icon and the first and last description lines. The pill works for a 40 px one-line control. It does not hold for a block whose height depends on the line count.

### Change

1. `menu.option.radius` changes from `{shape.control.radius}` to `{shape.media.radius}`. That is 12 px under neutral, 8 px under Professional and 16 px under Friendly. One radius for every line count: a 40 px option reads as a soft rounded bar, and 62 px and 84 px options read as rounded cards. Nested inside the row 3 panel it gives 12 + 8 padding = 20 against 24 under neutral, exactly 8 + 8 = 16 against 16 under Professional, and 16 + 8 = 24 against 32 under Friendly. The inner corner is never rounder than the outer one allows.
2. `.ds-menu__separator` changes from `margin-block: var(--cmp-menu-padding)` to `margin-block: var(--ds-space-inline-lg)`, 12 px on both sides. The line stays centred between its groups, and a filled option above it has 12 px of air.

Route rejected: `menu.option.radius` = `{shape.container.radius}` (16 px). It is exactly concentric under neutral (16 + 8 = 24), and it looks good there (`altC16-*`, `sheet-altC16-*`). Under Professional, though, it puts a 12 px option in a 16 px panel, which is rounder inside than the panel allows (12 + 8 = 20 > 16), and it rounds a crisp profile's options to twice its 6 px control radius. Media radius has neither problem.

### After (`after-*`, `sheet-after-grouped-360.png`, `sheet-after-grouped-1440.png`, `sheet-after-icons-and-descriptions-360.png`, `sheet-after-icons-and-descriptions-1440.png`)

Measured in `after-measures.json`: option radius 12 px, filled option to separator 12 px, separator to next heading box 12 px, at 360 and 1440, in both locales and both modes. The selected Design System option is a rounded card whose straight left edge sits at the panel padding, so the label starts on the same edge as the heading above it. The 84 px three-line option at 360 keeps the same 12 px corners. The fill no longer cuts in near the icon or the first and last lines. The separator now runs square under a straight edge with an even 12 px gap.

### Builder rows

| # | File | Change |
| --- | --- | --- |
| 1.1 | `packages/design-system/src/tokens/source/component.json` | `menu.option.radius` `$value` `{shape.control.radius}` → `{shape.media.radius}`; regenerate with `pnpm --filter @orivilo/design-system tokens` |
| 1.2 | `packages/design-system/src/recipes/recipes.css` `.ds-menu__separator` | `margin-block: var(--cmp-menu-padding)` → `margin-block: var(--ds-space-inline-lg)` |
| 1.3 | `packages/design-system/src/components/select/Select.stories.tsx` | New story `GroupedSelectedDescribed`: `render: () => <Select groups={groups} defaultValue="design-system" />` in `inField`. The play opens the list and checks: the checked option's computed `border-radius` equals the resolved `--ds-shape-media-radius` (12px under neutral); `separator.top - checked.bottom` is 12 and `nextLabel.top - separator.bottom` is 12 (getBoundingClientRect, rounded); then Escape. The visual QA screens are this story and `IconsAndDescriptions` reopened after its play |

## Row 2: group heading spacing and the disabled option

### Today

| What | Value | Source |
| --- | --- | --- |
| Heading box | 35.5 px = 8 + 19.5 line + 8 | `.ds-menu__label` `padding-block: var(--cmp-menu-padding)` |
| Separator to heading text | 16 px (8 margin + 8 padding) | |
| Heading text to its first option's text | 18 px (8 padding + 10 inside the 40 px option) | |
| Heading ink | `menu.label-fg` = `text.tertiary`, `kbd` type | |
| Disabled option ink | `menu.option.fg-disabled` = `text.disabled`: `gray.400` light, `gray.600` dark | `.ds-menu__option[data-disabled]` and its description |
| Disabled contrast on the panel | 2.31 light, 2.46 dark (neutral, computed from the primitives) | `text.disabled` is exempt in `contrast-pairs.ts`, and no recipe pair covers the menu's disabled option |

The heading sits 16 px under the line above it and 18 px over its own options, so it floats between the groups instead of leading its own group (`before-grouped-360-th-light.png`). The disabled "เก็บถาวรแล้ว" is barely there at 2.3 to 1, in both modes (`sheet-before-grouped-1440.png`, `sheet-before-icons-and-descriptions-360.png`).

### Change

1. `.ds-menu__label` changes from `padding-block: var(--cmp-menu-padding)` to `padding-block: var(--ds-space-inline-sm)`, 4 px each side. With row 1's 12 px separator margin, the heading box starts 16 px under the line (12 + 4) and ends 4 px over its first option's fill. The heading now reads as the head of the group below it. The first heading in the panel sits 12 px (8 panel padding + 4) from the top edge.
2. **Contract change.** Semantic `text.disabled` moves from the 400 step to the 500 step in both modes, under every profile:

| Profile | Light (was → new) | Dark (was → new) | On `surface.raised` light / dark | On `surface.card` light |
| --- | --- | --- | --- | --- |
| neutral (`semantic.json`) | `gray.400` → `gray.500` | `gray.600` → `gray.500` | 3.62 / 4.48 | 3.72 |
| Professional (`professional.json`, `text.disabled`) | `slate.400` → `slate.500` | `slate.600` → `slate.500` | 3.55 / 3.35 | 3.64 |
| Friendly (`friendly.json`, `text.disabled`) | `cream.400` → `cream.500` | `cream.600` → `cream.500` | 3.54 / 3.33 | 3.66 |

Every value is at least 3.0, the UI floor that a disabled control's text already holds (`control` pair "disabled text", `input.fg-disabled` on `input.bg-disabled`, floor UI in `pairs.ts`). Every value stays well below `text.secondary` (6.60 light and 7.04 dark under neutral) and `text.primary` (17.6 and 15.1), so the option still reads as disabled. It is a grey line with no fill, no brand hue and no check, so it never reads as a selection or an action. It keeps `cursor: not-allowed`, and Radix still skips it on hover and on the arrow keys.

The `text.disabled` exemption in `contrast-pairs.ts` stays. The disabled Tag puts `text.disabled` on `surface.disabled`, where the 500 step gives 2.87 under neutral light. That is better than the 1.9 it gives today, but it is still under 3.0, so that ground stays exempt. The menu pair below is new and is held at 3.0.

Routes rejected:

- `menu.option.fg-disabled` → `{text.secondary}` with no semantic change (`altC16-*` before the 500 step, first `after` run). That is 6.6 to 1. But it is the same ink and nearly the same size as the group heading (`text.tertiary`, which today equals secondary). In the Grouped story the disabled "เก็บถาวรแล้ว" has no icon and starts on the heading's edge, so it read as a third heading. In `IconsAndDescriptions` the whole disabled option became the description ink and lost its disabled look.
- A new semantic token just for menus. The 500 step is the right disabled ink everywhere a label sits on a card or a raised surface, and a second disabled token would split one meaning in two.

### After

`altB-step500-grouped-360-th-light.png` and `altB-step500-icons-and-descriptions-360-th-dark.png` (the 500 step alone), then every `after-*` file. The heading sits tight on its group. "เก็บถาวรแล้ว" and "ไม่รับการเปลี่ยนแปลงอีก" are readable and clearly dimmer than every enabled label and description, in light and dark. The disabled icon (currentColor) follows the same ink. Every Thai mark above and below (เก็, ไม่, ปลี่) is whole in every cell. Professional (`prof-after-media-grouped-1440-en-light.png`) and Friendly (`friendly-after-media-icons-and-descriptions-360-th-light.png`) keep the same order: primary, then secondary, then disabled.

### Builder rows

| # | File | Change |
| --- | --- | --- |
| 2.1 | `packages/design-system/src/recipes/recipes.css` `.ds-menu__label` | `padding-block: var(--cmp-menu-padding)` → `padding-block: var(--ds-space-inline-sm)` |
| 2.2 | `packages/design-system/src/tokens/source/semantic.json` `text.disabled` | light `{color.gray.400}` → `{color.gray.500}`, dark `{color.gray.600}` → `{color.gray.500}` |
| 2.3 | `packages/design-system/src/profiles/source/professional.json` `text.disabled` | light `{color.slate.400}` → `{color.slate.500}`, dark `{color.slate.600}` → `{color.slate.500}` (the `text` block, not `surface.disabled` or `border.disabled`) |
| 2.4 | `packages/design-system/src/profiles/source/friendly.json` `text.disabled` | light `{color.cream.400}` → `{color.cream.500}`, dark `{color.cream.600}` → `{color.cream.500}`; regenerate tokens and profiles |
| 2.5 | `packages/design-system/src/recipes/pairs.ts` | Add `{ recipe: "menu", slot: "disabled option", fg: "menu.option.fg-disabled", bg: "menu.bg", floor: UI }` next to the menu pairs. `pnpm contrast` and `recipes.test.ts` must pass under all three profiles in both modes |
| 2.6 | `DESIGN.md` §3 `text.disabled` row | New values (the 500 step in both modes) and the note "holds 3.0 on card and raised surfaces; exempt on `surface.disabled`". Add a change log line naming ORV-204 rows 1 to 3 and bump the version |
| 2.7 | `GroupedSelectedDescribed` play (row 1.3) | The heading box's computed `padding-top` and `padding-bottom` equal the resolved `--ds-space-inline-sm` (4px); the disabled option's computed `color` equals the resolved `--ds-text-disabled` |

## Row 3: the listbox panel radius against the pill trigger

### Today

| What | Value | Source |
| --- | --- | --- |
| Trigger radius | 999 px (pill) | `input.radius` = `shape.control.radius` |
| Panel radius | 12 px | `.ds-menu` `border-radius: var(--cmp-menu-radius)`, `menu.radius` = `{shape.media.radius}` |
| Panel padding | 8 px | `menu.padding` = `space.inset.sm` |

The panel opens 4 px under a pill and has near-square 12 px corners, so the two shapes do not belong together (`sheet-before-grouped-1440.png`). Command, the other list panel with the same options, already uses `shape.overlay.radius`.

### Change

`menu.radius` changes from `{shape.media.radius}` to `{shape.overlay.radius}`: 24 px under neutral, 16 under Professional, 32 under Friendly. A panel cannot be a pill, and 24 is the roundest semantic radius. It matches Command, Dialog, the chat panel, nodes and groups, so every floating list in the Studio has one corner. Professional's panel moves from 8 to 16 px under a 6 px trigger. It joins that profile's Dialog and Command at 16 and stays exactly concentric with its 8 px options (row 1). That is the one trade-off of the change, and `prof-after-media-grouped-1440-en-light.png` shows it still reads as one calm family.

### After

`after-*` and the four `sheet-after-*`: 24 px corners under the pill trigger, with the 12 px option corners nested 8 px inside. The top-left corner does not cut into the first heading or option, at 360 and 1440, in both modes.

### Builder rows

| # | File | Change |
| --- | --- | --- |
| 3.1 | `packages/design-system/src/tokens/source/component.json` | `menu.radius` `$value` `{shape.media.radius}` → `{shape.overlay.radius}`; regenerate |
| 3.2 | `GroupedSelectedDescribed` play (row 1.3) | The listbox's computed `border-radius` equals the resolved `--ds-shape-overlay-radius` (24px under neutral) |

## What else the change reaches

Every consumer of the menu tokens and classes, found with `grep -rln 'ds-menu\|ds-command\|ds-chat__picker' packages/design-system/src/components` and `grep -n 'cmp-menu-' recipes.css`:

| Consumer | Row 1 option radius | Row 1 separator 12 | Row 2 heading 4 | Row 2 disabled ink | Row 3 panel radius | Rendered |
| --- | --- | --- | --- | --- | --- | --- |
| Select (`select/Select.tsx`, `.ds-menu`, `.ds-menu__option`) | Yes | Yes | Yes | Yes | Yes | the two stories above |
| DropdownMenu (`dropdown-menu/DropdownMenu.tsx`, `.ds-menu[data-menu]`, `.ds-menu__item`, shared `menu-item.tsx`) | Yes | Yes | Yes | Yes, items and their `Kbd` | Yes | `reach-before/after-base-dropdown-menu--open-1440-en-light.png`, `...--checkable-...` |
| ContextMenu (`context-menu/ContextMenu.tsx`, same classes) | Yes | Yes | Yes | Yes | Yes | same recipe as DropdownMenu, not shot separately |
| CanvasContextMenu (`canvas-context-menu/`, built on ContextMenu) | Yes | Yes | Yes | Yes | Yes | through ContextMenu |
| Command menu (`command-menu/CommandMenu.tsx`, `.ds-command__option`) | Yes, `menu.option.radius` | No, its own `.ds-command__group` border | No, its own `.ds-command__heading` | Yes, `menu.option.fg-disabled` | No, `command.radius` is already `shape.overlay.radius` | `reach-before/after-application-command-menu--open-1440-en-light.png` |
| CanvasChat node picker (`canvas-chat/`, `.ds-chat__picker`, `.ds-chat__option`) | Yes | No | No | No disabled option | Yes, `menu.radius` | not shot; same tokens as Select |
| Combobox | Not present in `packages/design-system/src/components` | | | | | |

Through the `text.disabled` change (row 2.2 to 2.4), outside the menus: Tabs (`tabs.fg-disabled`, `tabs.count-fg-disabled`), node port label (`port.fg-disabled`), Tag (`tag.fg-disabled`, on `surface.disabled`, stays exempt), the Checkbox label (`.ds-checkbox[data-disabled] .ds-checkbox__label`) and the Field label and description (`.ds-field[data-disabled]`). Each gets a more legible disabled ink and keeps its shape. Visual QA shoots their disabled stories as well.

What I saw in the reach renders: the DropdownMenu separator band grows from 8 + 8 to 12 + 12 between items. It reads airier, which suits mood E. Its checked and disabled "จุดยึด" keeps a grey glyph that reads disabled. The disabled "ไม้บรรทัด" is now readable. In Command, the highlighted "Add node" changes from a pill to a 12 px bar inside the 24 px palette, and the disabled "Zoom to selection" with its keys is readable and still dim.

## States

| State | Look after ORV-204 |
| --- | --- |
| Default | Option on the panel ground, `text.primary` label, `text.secondary` description |
| Hover and keyboard highlight | `menu.option.bg-hover` fill, 12 px corners (row 1) |
| Selected | `menu.option.bg-selected` fill with `selection.fg` label and the check, 12 px corners |
| Selected and highlighted | Unchanged from today (the selected fill). Selected and focused stay different states, as DESIGN.md §7 requires; that is ORV-192's ground and outside these rows |
| Focus on the panel | The border form (`.ds-menu:focus-visible`), now on 24 px corners; the halo follows the radius (`reach-*-dropdown-*`, where the panel holds focus) |
| Disabled | The 500 step ink (row 2), no fill, `not-allowed` |
| Empty | `.ds-menu__empty`, unchanged |
| Loading, error, success | None in a listbox |

## Screens for visual QA

At 360 and 1440, Thai and English, light and dark:

- `base-select--grouped-selected-described` (new, row 1.3)
- `base-select--icons-and-descriptions`, reopened after its play
- `base-select--rich-at-360`
- `base-dropdown-menu--checkable`
- `application-command-menu--open`
- the disabled stories of Tabs, Tag, Checkbox and Field, for the `text.disabled` reach

## Seen but out of scope

- At 360 the listbox runs 6 px wider than the trigger on both sides (`before-icons-and-descriptions-360-th-light.png`, unchanged after). That is ORV-194 row 8's available-width rule, not these rows.
- In the Grouped fixture, Design System has no icon while its siblings do, so its label starts 24 px left of theirs. That comes from the fixture, not the recipe.
