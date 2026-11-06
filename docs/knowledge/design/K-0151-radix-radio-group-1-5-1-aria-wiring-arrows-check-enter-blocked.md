---
id: K-0151
topic: design
claim: The Radix radio group build the repo pins (1.5.1) renders a `div` with role radiogroup carrying `aria-required` and `aria-orientation` and button items with role radio and `aria-checked`, blocks Enter, and on this reading checks an item reached by any arrow key, which goes beyond the docs' ArrowUp and ArrowLeft rows; the build sets no `aria-invalid`, and extra props spread onto the group and the item.
source: "https://unpkg.com/@radix-ui/react-radio-group@1.5.1/dist/index.mjs; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/radio-group/src/radio-group.tsx; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/radio-group/src/radio.tsx; pnpm-lock.yaml"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. `pnpm-lock.yaml` line 2021 pins `@radix-ui/react-radio-group@1.5.1`, under `radix-ui@1.8.1`. The fetched file carries no version banner; the version rests on the unpkg URL. A search of the installed 1.5.1 package also found the `ARROW_KEYS` line, the Enter line and the `click()` line, and found no `aria-invalid`.

### Build (`index.mjs`)

```js
role: "radiogroup",
"aria-required": required,
"aria-orientation": orientation,
var ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
if (event.key === "Enter") event.preventDefault();
const isDisabled = context.disabled || disabled;
```

- The group is `Primitive2.div` with `...groupProps`; the item is `Primitive.button` with `...radioProps`, with `role: "radio"` and `"aria-checked": checked`.
- No `aria-invalid` appears in the file.
- Exports include `unstable_ItemBubbleInput`, `unstable_ItemProvider` and `unstable_ItemTrigger`.

### Source on `main`

```tsx
// According to WAI ARIA, radio groups don't activate items on enter
```

> We click it to "check" it (instead of updating `context.value`) so that the radio

- Item: `type="button"`, `role="radio"`, `aria-checked={checked}`, `data-state={getState(checked)}`, `data-disabled={disabled ? '' : undefined}`, `disabled={disabled}`.
- Roving focus: `RovingFocusGroup.Item` with `focusable={!disabled}` and `active={checked}`; `loop = true,` is the default.
- Document `keydown` and `keyup` listeners track a held arrow key; on focus with one held, `ref.current?.click();` runs.
- Hidden input: `type="radio"`, `aria-hidden`, `tabIndex={-1}`, rendered behind `{isFormControl && (`.
- Indicator: `<Presence present={forceMount || context.checked}>`.

### Own reading

`ARROW_KEYS` lists four keys (counted in the `var ARROW_KEYS` line of `index.mjs`), and the click on focus does not tell them apart, so ArrowUp and ArrowLeft check the item as ArrowDown and ArrowRight do. That matches K-0153 and goes beyond the rows in K-0150. The behaviour was read from code, not run.

## Why it matters for ORIVILO

A story's keyboard test can assert checking on all arrow keys, not the docs rows. The `div` root matters for labelling (K-0156), and `aria-invalid` is a prop we would pass ourselves.
