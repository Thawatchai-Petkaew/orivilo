---
issue: ORV-67 (https://tpetkaew.atlassian.net/browse/ORV-67)
lane: L (risk flag: component public API)
version: 1
---

## Why

The owner chose "Base first" on 2026-10-23: base components get Untitled UI-level depth where a variant has a functional meaning, never for decoration. Today a page that needs an icon in a button, a search field with an icon, or a password field has to hand-build it, and every hand-built copy drifts. This story covers audit sections B.1 and B.2 (`docs/specs/ORV-64/audit.md`), stories 9 and 10 of section D.2.

## Decisions this spec relies on

- ADR 0003: Radix and shadcn give the behaviour, the visual layer is ours.
- DESIGN.md §8: `text.link` for "go somewhere"; the brand accent never replaces error, selection or focus.
- The audit's "do not copy" list: no `xl` button, no brand-coloured link, no help tooltip that hides on error.

## Story

As a Studio user, I want buttons that show an icon next to their words and fields that hold an icon, a unit or an action, so that common controls look and behave the same on every screen.

## Acceptance criteria

| #   | Given                                         | When                                        | Result                                                                                                                                                                                                                                                   | Evidence                                            |
| --- | --------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | `Button` with `iconLeading` or `iconTrailing` | Rendering                                   | The icon sits before or after the label at the size of the button's size, with `aria-hidden`; the button's name is still its label; while `loading`, the spinner replaces the leading icon only                                                          | Button stories, play test                           |
| 2   | `Button` with `variant="link"`                | Rendering, hover, focus                     | Text in `text.link`, underline on hover, no fill and no border, focus ring from `focus.ring`; the same height as other sizes so it lines up in a row                                                                                                     | Stories, contrast pairs                             |
| 3   | `InputGroup` with `start` or `end`            | Rendering an icon, a text addon or a Button | One control outline around all parts; focus on the input draws the focus ring around the whole group; invalid and disabled states cover the whole group; a text addon is read with the input (`aria-describedby`)                                        | InputGroup stories, play test                       |
| 4   | `InputGroup` with a `shortcut`                | Rendering                                   | A `Kbd` shows the key at the end, `aria-hidden`, and the input's `aria-keyshortcuts` carries it                                                                                                                                                          | Story, play test                                    |
| 5   | `PasswordInput`                               | Pressing the reveal button                  | Type toggles between password and text; the button is a real button named "แสดงรหัสผ่าน" / "Show password", then "ซ่อนรหัสผ่าน" / "Hide password", with `aria-pressed`; focus stays in the field                                                         | Play test                                           |
| 6   | Every new part                                | Catalog and Storybook                       | Button entry gains the new variant and slots; new entries `InputGroup` and `PasswordInput` (draft); stories in both modes under three profiles and at 360 px; tokens, recipes, contrast pairs; coverage.md; DESIGN.md bump; copy from the locale catalog | `check-catalog`, `pnpm contrast`, storybook project |

## Rules and bounds

- Icons come from the existing icon module (Lucide first, DESIGN.md §6); 16 px for sm and md, 20 px for lg.
- `iconOnly` stays as it is (a required `aria-label`); `iconLeading` and `iconTrailing` are ignored when `iconOnly` is set.
- The link variant has no `intent` or `destructive` form.
- An addon never carries the error message; `Field` does.
- No middot and no em dash in any copy.

## Impact (public API, AGENTS.md rule 2)

- `ButtonVariant` gains `link`; `ButtonProps` gains `iconLeading` and `iconTrailing`. Existing calls do not change.
- New exports: `InputGroup`, `PasswordInput` and their prop types.
- New component tokens for the link button and the input group; new recipes and contrast pairs. No semantic token changes.

## Out of scope

Number stepper, tag input, xs button size, Select option icons (later depth stories in the audit).

## Changelog

- v1 (2026-10-23): spec.
