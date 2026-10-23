---
issue: ORV-78 (https://tpetkaew.atlassian.net/browse/ORV-78)
lane: L (risk flag: component public API)
version: 1
---

## Why

Audit D.2 story 17 (`docs/specs/ORV-64/audit.md`, B.9). Studio menus need on/off choices, such as showing the grid or the minimap, and one-of choices, such as sort order or density, inside a menu. `DropdownMenu` has action items only.

## Decisions this spec relies on

- ADR 0003: Radix gives the behaviour (`CheckboxItem`, `RadioGroup`, `RadioItem`, `ItemIndicator`), and the visual layer is ours.
- DESIGN.md §8 and the Checkbox catalog rule: a selection shows a glyph plus a fill, never a fill alone.
- Audit B.9, "Do not copy": no toggle (switch) indicator inside a menu item.

## Story

As a Studio user, I want to turn view options on and off and pick one sort order from the same menu, and see which are on, so that I don't need a separate settings panel for small choices.

## Acceptance criteria

| #   | Given                                   | When                 | Result                                                                                                                          | Evidence                           |
| --- | --------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | A checkbox item, unchecked              | Click or Enter       | It becomes `role="menuitemcheckbox"` with `aria-checked="true"`, shows a check glyph and the selected fill; the menu stays open | `Checkable` play test              |
| 2   | A radio group of three                  | Choose the second    | Only the second is `aria-checked="true"` and shows a dot glyph; the menu closes                                                 | `Checkable` play test              |
| 3   | Checked and unchecked items in one menu | Rendering            | The labels line up: checkable items keep a glyph column whether checked or not; action items keep none                          | `Checkable` story                  |
| 4   | Keyboard                                | Arrows, Enter, Space | The same as action items; Space toggles a checkbox item                                                                         | `Checkable` play test              |
| 5   | Disabled checkable item                 | Rendering and click  | Disabled ink, no toggle                                                                                                         | `Checkable` play test              |
| 6   | Three profiles, two modes               | Rendering            | The selected pair `menu.option.fg-selected` on `menu.option.bg-selected` already passes contrast                                | `RecipesAndModes`, `pnpm contrast` |
| 7   | Catalog, DESIGN.md                      | Checks               | The catalog states gain item-checked; DESIGN.md is bumped                                                                       | `check-catalog`                    |

## Impact (public API, AGENTS.md rule 2)

New exports:

- `DropdownMenuCheckboxItem`: `checked`, `onCheckedChange`, `disabled`, `shortcut`, `closeOnSelect` (false by default), children.
- `DropdownMenuRadioGroup`: `value`, `onValueChange`, children.
- `DropdownMenuRadioItem`: `value`, `disabled`, `shortcut`, children.

A new icon `RadioDotIcon` (Lucide `CircleSmall`, filled with the current ink), plus recipe rules for `.ds-menu__item[data-checkable][data-state="checked"]` (not when disabled), its focus ring when highlighted, and `.ds-menu__indicator`. There are no new tokens. It reuses the `menu.option` selected pair that Select uses, and adds one contrast pair: `focus.ring` on `menu.option.bg-selected`, for a highlighted checked item. `DropdownMenuItem` is unchanged.

## Out of scope

Item icon and avatar slots, and the account-menu pattern (audit B.9 lists them separately). ContextMenu checkable items follow when a story needs them.

## Changelog

- v1 (2026-10-23): spec.
