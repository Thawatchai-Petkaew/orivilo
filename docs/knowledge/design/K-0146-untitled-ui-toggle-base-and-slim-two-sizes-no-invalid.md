---
id: K-0146
topic: design
claim: Untitled UI React's Toggles page gives a Toggle on React Aria Switch with sizes sm (default) and md, a slim form, label and hint text, a disabled state and a non-interactive ToggleBase; the page names no invalid, required or loading state and no keyboard behaviour, and the source darkens the track on hover only when the toggle is on.
source: "https://www.untitledui.com/react/components; https://www.untitledui.com/react/components/toggles; https://www.untitledui.com/react/components/toggles.md; https://raw.githubusercontent.com/untitleduico/react/main/components/base/toggle/toggle.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The API reference renders as a placeholder (`ApiReference slug="toggles"`), so the props table was not read; props below come from the page's FAQ and from the source file.

### Page

> Set `slim` to `true` for a slimmer variant.

> The thumb is the same height as the track and has a border,

> The size changes the switch dimensions and the size of the label and hint text.

> The component is a React Aria `Switch`, so clicking the label also toggles it.

> Pass an `aria-label` that describes the setting, for example `aria-label="Enable notifications"`

> React Aria's `Switch` renders a visually hidden checkbox input, so pass `name`

> Yes, `ToggleBase` is exported separately and renders only the track and thumb.

- Listed under Base components as "Toggles"; the index has no entry with "switch" in its name.
- Install: `npx untitledui@latest add toggle`.
- Examples: Base, With label, With label and hint, Disabled, Sizes, Slim, Slim with label and hint.
- Props on the page: `size`, `slim`, `isSelected` with `onChange` (receives the new boolean), `defaultSelected`, `isDisabled`, `label`, `hint`, `aria-label`, `name`, `value`.
- `ToggleBase` is not interactive; the caller passes `isSelected`, `isHovered`, `isFocusVisible` and `isDisabled`.
- The words invalid, error, required, loading and keyboard do not appear on the page.

### Source file

| Form       | Track            | Knob     | Knob when on    |
| ---------- | ---------------- | -------- | --------------- |
| default sm | `h-5 w-9 p-0.5`  | `size-4` | `translate-x-4` |
| default md | `h-6 w-11 p-0.5` | `size-5` | `translate-x-5` |
| slim sm    | `h-4 w-8`        | `size-4` | `translate-x-4` |
| slim md    | `h-5 w-10`       | `size-5` | `translate-x-5` |

- Text: `sm` root `gap-2`, label `text-sm font-medium`, hint `text-sm`; `md` root `gap-3`, label `text-md font-medium`, hint `text-md`.
- `isSelected`: track `bg-brand-solid`. With `isHovered` as well: `bg-brand-solid_hover`. Off plus hover has no rule in the file.
- `isDisabled`: `cursor-not-allowed opacity-50`. `isFocusVisible`: `outline-2 outline-offset-2`.
- Track transition `duration-150 ease-linear`.
- `label` is typed `string` and rendered in a `<p>`; `hint` is a node in a `<span>` that stops click propagation, so a click on the hint does not flip the toggle.
- The file sets no `aria-*` attribute; semantics come from React Aria `Switch`.

## Why it matters for ORIVILO

ORV-221 needs the Untitled UI row for Switch. Untitled calls it Toggle, while "toggle" in our catalog already means ToggleGroup, so the names need care when the row is read.
