---
id: K-0144
topic: design
claim: Untitled UI React's Radio buttons page gives a RadioGroup of RadioButton items with sizes sm (default) and md, label and hint text, disable on the group or on one item, and React Aria keyboard support; the page names no invalid, required or orientation prop, and the source file reads selected, disabled and focus-visible but not hover or invalid.
source: "https://www.untitledui.com/react/components; https://www.untitledui.com/react/components/radio-buttons; https://www.untitledui.com/react/components/radio-buttons.md; https://raw.githubusercontent.com/untitleduico/react/main/components/base/radio-buttons/radio-buttons.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The page's API reference renders only as a placeholder (`<ApiReference slug="radio-buttons" />`), so the props table was not read; props below come from the page's FAQ and from the source file.

### Page

> Set `size` on `RadioGroup`; the group's size overrides any `size` set on an individual `RadioButton` inside it.

> Disabled radios render at 50% opacity with a `not-allowed` cursor.

> Leave both out to render only the radio circle.

> React Aria handles keyboard support: Tab moves focus into the group and the arrow keys change the selection.

> `RadioGroup` doesn't render a visible group label, so pass `aria-label` as the examples do,

- Listed under Base components as "Radio buttons", beside "Radio groups" (K-0145) and "Toggles" (K-0146).
- Install: `npx untitledui@latest add radio-buttons`.
- Examples: With label, With label and hint, Disabled, Disabled individual option, Sizes.
- `RadioGroup` props on the page: `defaultValue`, or `value` with `onChange`; `size`; `isDisabled`; `aria-label` or `aria-labelledby`; `className` (default `flex flex-col gap-4`, merged with `tailwind-merge`, so `flex-row` replaces it).
- `RadioButton` props on the page: `value`, `label`, `hint`, `isDisabled`, `size`.
- The words invalid, error, required and orientation do not appear on the page; "horizontally" appears only in a FAQ question on layout.

### Source file

- Exports `RadioButtonBase` (the circle and dot), `RadioButton` (wraps React Aria `Radio`) and `RadioGroup` (wraps React Aria `RadioGroup`, provides the size).
- Circle: `size-4`, `md` adds `size-5`. Dot: `size-1.5`, `md` adds `size-2`.
- Text: `sm` root `gap-2`, label `text-sm font-medium`, hint `text-sm`; `md` root `gap-3`, label `text-md font-medium`, hint `text-md`.
- `isSelected`: the circle takes `bg-brand-solid ring-brand-solid`, the dot goes from `opacity-0` to `opacity-100`.
- `isDisabled`: `cursor-not-allowed opacity-50`, plus `bg-tertiary` when not selected.
- `isFocusVisible`: `outline-2 outline-offset-2 outline-focus-ring`.
- `isHovered` and `isInvalid` are not referenced in the file.
- `hint` sits in a `<span>` whose click handler calls `event.stopPropagation()`, so a click on the hint does not select the radio.
- The file sets no `aria-*` attribute or role; semantics come from React Aria.

## Why it matters for ORIVILO

ORV-221 needs the Untitled UI row of the benchmark table. This entry gives the sizes, states and slots, with the absent invalid state named so the row does not imply it.
