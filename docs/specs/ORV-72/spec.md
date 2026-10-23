---
issue: ORV-72 (https://tpetkaew.atlassian.net/browse/ORV-72)
lane: L (risk flag: component public API)
version: 1
---

## Why

Audit D.2 story 15 (`docs/specs/ORV-64/audit.md`, B.4 and B.5). Table row selection and dense lists need a small checkbox. Short notes in the inspector need a small textarea, and a brief with a limit needs a counter that counts what a Thai reader sees: `น้ำ` is one cluster to a reader but three UTF-16 units, so the browser's `maxlength` cuts Thai early and mid-cluster.

## Decisions this spec relies on

- ADR 0003: Radix gives the checkbox behaviour, the visual layer is ours.
- Catalog rule for Checkbox: the label is part of the hit area; checked is a glyph plus fill, never fill alone.
- DESIGN.md §4: Thai and Latin keep size parity; §7: every state a story; §8: danger ink is the only over-limit colour.
- WCAG 2.2 target size (2.5.8): a control's target is at least 24 px, so a 16 px box needs a larger invisible target when its label is visually hidden (Table).

## Story

As a Studio user, I want a small checkbox in tables and a small textarea with a counter that counts Thai the way I read it, so that dense screens stay compact and a limit never cuts a word in half.

## Acceptance criteria

| #   | Given                             | When                    | Result                                                                                                                    | Evidence                                        |
| --- | --------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | `Checkbox size="sm"`              | Rendering               | 16 px box, a 12 px glyph and the small label type; the box's target is at least 24 px                                     | `Sizes` play test                               |
| 2   | `Table selectable`                | Rendering, clicking     | Header and row checkboxes are `sm`; the header still shows indeterminate when some rows are selected                      | Table `Selectable` play test                    |
| 3   | `Textarea size="sm"`              | Rendering               | The small control height and type, same as `Input size="sm"`                                                              | `Sizes` story                                   |
| 4   | `maxLength={10}`, Thai with marks | Typing `น้ำใจ`          | The counter reads `3/10`: grapheme clusters through `Intl.Segmenter`, not UTF-16 units                                    | `countGraphemes` unit test, `Counter` play test |
| 5   | Text past `maxLength`             | Typing                  | Typing is not cut; the counter turns danger ink, the textarea gets `aria-invalid`, and its description says how many over | `OverLimit` play test                           |
| 6   | `showCount` without `maxLength`   | Typing                  | The counter shows the count alone                                                                                         | `CountWithoutLimit` play test                   |
| 7   | No `size`, no `showCount`         | Rendering               | Unchanged: md checkbox, md textarea, no counter                                                                           | Existing stories                                |
| 8   | Every changed part                | Catalog, contrast, i18n | Catalog entries, tokens, recipes, contrast pairs, Thai and English strings; DESIGN.md bump                                | `check-catalog`, `pnpm contrast`, `check-i18n`  |

## Behaviour notes

- **Soft limit.** `maxLength` on Textarea is counted in graphemes and is not forwarded as the native attribute. Typing past it is allowed and shown as invalid; cutting input breaks Thai IME composition and silently loses text. Blocking submit is the form's job. `maxLength` always shows the counter: a limit nobody can see is not a limit.
- **Counter text.** Visible `{count}/{max}` (or `{count}`), tabular figures, hidden from assistive tech. Assistive text through `aria-describedby`, from the locale catalog: `Characters: {count} of {max}` / `ตัวอักษร {count} จาก {max}`, and over the limit one sentence, `Characters: {count} of {max}, {over} over the limit` / `ตัวอักษร {count} จาก {max} เกินมา {over} ตัวอักษร`. Numbers through `formatNumber`. No live region on every keystroke.
- **Checkbox sm.** Box `size.icon.sm` (16 px), label `type.body.sm`, gap `space.inline.sm`; the box centres on the label's first line as md does. The extra target is a transparent pseudo-element, no layout change.

## Impact (public API, AGENTS.md rule 2)

- `CheckboxProps` gains optional `size` (`"sm" | "md"`, default `md`).
- `TextareaProps.size` widens to `"sm" | "md" | "lg"`; gains optional `showCount`. `maxLength` changes meaning to graphemes and a soft limit; no caller passes it today (checked: DirectionStudio, MissingInputsPrompt, examples).
- Table: selection checkboxes render `sm` (visual change in every selectable table).
- New component tokens `checkbox.size-sm`, `checkbox.gap-sm`, `checkbox.label-type` (the md label, same value as before), `checkbox.label-type-sm`, `checkbox.target-min`, `textarea.counter-fg`, `textarea.counter-fg-over`, `textarea.counter-type`, `textarea.counter-gap`; recipes `ds-checkbox[data-size="sm"]`, `ds-textarea`, `ds-textarea__counter`; four contrast pairs (counter and over, on canvas and card). Locale keys `textarea.ratio`, `textarea.count`, `textarea.countOf`, `textarea.countOver`. No semantic token changes.

## Out of scope

Checkbox card and row-selection look (audit B.4 lists only `sm` as needed), submit on Enter (PromptInput, audit C), a hard limit option.

## Changelog

- v1 (2026-10-23): spec.
