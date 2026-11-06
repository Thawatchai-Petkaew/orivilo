---
id: K-0152
topic: design
claim: Radix's Switch gives Root and Thumb, Space and Enter toggling, and `data-state` and `data-disabled`; the 1.4.1 build the repo pins renders a `button` with role switch, `aria-checked` and `aria-required`, spreads extra props onto it, has a checked and an unchecked state only, and sets no `aria-invalid`, and the docs say nothing on labelling.
source: "https://www.radix-ui.com/primitives/docs/components/switch; https://unpkg.com/@radix-ui/react-switch@1.4.1/dist/index.mjs; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/switch/src/switch.tsx; pnpm-lock.yaml"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. `pnpm-lock.yaml` line 2108 pins `@radix-ui/react-switch@1.4.1`, under `radix-ui@1.8.1`. The docs page is not versioned.

### Docs

> A control that allows the user to toggle between checked and not checked.

> Toggles the component's state.

> Adheres to the [`switch` role requirements](https://www.w3.org/WAI/ARIA/apg/patterns/switch).

- The Keyboard Interactions table has two rows, Space and Enter, each reading "Toggles the component's state."
- Root props: `asChild`, `defaultChecked`, `checked`, `onCheckedChange`, `disabled`, `required`, `name`, `value` (default `on`). Thumb props: `asChild`.
- Data attributes on both: `data-state` (`checked`, `unchecked`), `data-disabled`.
- Parts prefixed `unstable_` (`unstable_Provider`, `unstable_Trigger`, `unstable_BubbleInput`) may change in a future release.
- The page does not mention labelling, `aria-label`, `aria-labelledby` or `aria-invalid`, and its demo has no `label` element.

### Build and source

```js
role: "switch",
"aria-checked": checked,
"aria-required": required,
```

- The trigger is `Primitive.button` with `...switchProps`, `type="button"`, `data-state={getState(checked)}`, `disabled={disabled}`.
- No `aria-invalid` and no `onKeyDown` in the build; the handlers are `onClick`. There is no mixed or indeterminate state: `getState` returns "checked" or "unchecked".
- The hidden input has `type="checkbox"`, `aria-hidden` and `tabIndex={-1}`, and renders only when the trigger is a form control. On form reset the trigger restores its initial value.

## Why it matters for ORIVILO

The control is a `button`, which a `label` can point at (K-0156), so `Field`'s label reaches it. Enter works with no handler in the file, and `aria-invalid` stays ours to pass.
