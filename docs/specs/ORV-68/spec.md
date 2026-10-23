---
issue: ORV-68 (https://tpetkaew.atlassian.net/browse/ORV-68)
lane: L (risk flag: component public API)
version: 2
---

## Why

The owner chose "Base first" on 2026-10-23. This story covers stories 11, 12 and 13 of section D.2 in `docs/specs/ORV-64/audit.md`: a Select whose options say more than one word, a Badge that can show a dot or an icon, and Tabs that run down the side of an Inspector with an icon and a count.

## Decisions this spec relies on

- ADR 0003: Radix gives the behaviour, the visual layer is ours.
- DESIGN.md §8: feedback colours carry status, `selection.*` carries selection, the brand accent never replaces either.
- AGENTS.md: never render a count or a status without backing data.

## Story

As a Studio user, I want options that explain themselves, status labels I can scan, and side tabs that show how many items each holds, so that I choose and navigate without opening every item.

## Acceptance criteria

| #   | Given                                        | When                  | Result                                                                                                                                                                                                                       | Evidence                                            |
| --- | -------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | `SelectOption` with `icon` and `description` | Opening the list      | The icon sits before the label (`aria-hidden`); the description is a second line in `text.secondary`; the option's accessible name is the label, and the description is read as its description                              | Select stories, play test                           |
| 2   | The trigger after a choice                   | Rendering             | Shows the icon and the label only, never the description, so the trigger keeps one line                                                                                                                                      | Play test                                           |
| 3   | `groups` instead of `options`                | Opening the list      | Each group has a heading that labels it (`role="group"` with `aria-labelledby`); type-ahead and arrow keys run across groups; an empty group is not rendered                                                                 | Grouped story, play test                            |
| 4   | `Badge` with `dot`                           | Rendering             | A dot before the word in the variant's feedback colour (from component tokens only); the dot is `aria-hidden`, so the word carries the meaning; `brand` and `neutral` dots are allowed                                       | Badge stories, token test                           |
| 5   | `Badge` with `icon`                          | Rendering             | The icon sits before the word, `aria-hidden`, sized for the badge size; `dot` and `icon` together is a type error                                                                                                            | Stories, typecheck                                  |
| 6   | `Tabs` with `orientation="vertical"`         | Arrow keys            | Up and Down move between tabs, Left and Right do nothing; the list sits beside the panel; the selected tab shows a 2 px edge on its inner side in `selection` colour, distinct from the focus ring                           | Vertical story, play test                           |
| 7   | `TabsTrigger` with `icon` and `count`        | Rendering             | Icon before the label (`aria-hidden`); the count after it as text, read with the tab ("Decisions 12"; a separating comma breaks the name match the axe rule checks); a count of 0 still shows; no count prop, no count shown | Stories, play test                                  |
| 8   | Every changed part                           | Catalog and Storybook | Catalog entries gain the new props; stories in both modes under three profiles and at 360 px; tokens, recipes and contrast pairs; coverage.md; DESIGN.md bump; any new copy from the locale catalog                          | `check-catalog`, `pnpm contrast`, storybook project |

## Rules and bounds

- Icons from the existing icon module; 16 px in md, 14 px in sm.
- A Select keeps the single-value contract. No multi-select, no search (later stories).
- `options` and `groups` are mutually exclusive in the type.
- A count is a number the caller passes; the component never computes or invents one. Above 999 it shows "999+" with the full number in `title`.
- No middot and no em dash in any copy.

## Impact (public API, AGENTS.md rule 2)

- `SelectOption` gains `icon` and `description`; `SelectProps` gains `groups` (`{ label, options }[]`) as an alternative to `options`. Existing calls do not change.
- `BadgeProps` gains `dot` or `icon`. Existing calls do not change.
- `TabsProps` passes `orientation` through (Radix already has it); `TabsTriggerProps` gains `icon` and `count`.
- New component tokens for badge dots, select option description and tabs count; new recipes and contrast pairs. One new semantic token, `size.icon.xs` (14 px, over the new primitive `size.icon-3-5`), for icons in sm badges and tabs; nothing read the 14 px size before. No existing semantic token changes.

## Out of scope

Combobox, multi-select, closable tabs, tab overflow menus, Badge counts on avatars.

## Changelog

- v1 (2026-10-23): spec.
- v2 (2026-10-23): build findings. The tab name reads "Decisions 12"; one new semantic size token `size.icon.xs`.
