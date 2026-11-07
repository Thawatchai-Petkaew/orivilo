---
id: K-0149
topic: design
claim: shadcn/ui's Field is a plain `div` with role group that passes nothing to its control, so a radio or switch is wired by hand with `id` and `htmlFor`; its radio examples put one Field per item inside RadioGroup and a FieldSet with FieldLegend around it, its fieldset example gives the RadioGroup no `aria-label` or `aria-labelledby`, and its radio and switch invalid examples use no FieldError.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/field.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/radio-group-fieldset.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/radio-group-invalid.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/radio-group-choice-card.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/switch-invalid.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/switch-choice-card.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. These are the example files the docs pages render; the pages themselves truncate the code (K-0147, K-0148).

### Field

- `FieldSet` renders a `<fieldset>`, `FieldLegend` a `<legend>`.
- `Field` renders a `<div>` with `role="group"` and spreads its props onto it. It has no React context, sets no id and passes no `htmlFor`.
- `FieldError` renders a `<div>` with `role="alert"` and returns null without content.
- `FieldLabel` is built on `Label`.

### Radio examples

```tsx
<RadioGroup defaultValue="monthly">
<Field orientation="horizontal" data-invalid>
<RadioGroupItem value="email" id="invalid-email" aria-invalid />
<FieldLabel htmlFor="plus-plan">
<RadioGroupItem value="plus" id="plus-plan" />
```

- Fieldset example: `FieldSet` holds `FieldLegend` (`variant="label"`), `FieldDescription` and `RadioGroup`; each `Field` sits inside the group and pairs one `RadioGroupItem` with one `FieldLabel` by `id` and `htmlFor`.
- In that file no element has `aria-label`, `aria-labelledby` or `aria-describedby`.
- Invalid example: same shape, with `data-invalid` on each `Field` and `aria-invalid` on each `RadioGroupItem`; no `FieldError` and no `aria-describedby`.
- Choice card example: `FieldLabel htmlFor` wraps a horizontal `Field` holding `FieldContent` (`FieldTitle`, `FieldDescription`) and the `RadioGroupItem`, so the card is the label.

### Switch examples

```tsx
<Field orientation="horizontal" className="max-w-sm" data-invalid>
<FieldLabel htmlFor="switch-terms">
<Switch id="switch-terms" aria-invalid />
```

- Invalid example: `FieldContent` holds `FieldLabel` and a `FieldDescription` with "You must accept the terms and conditions to continue."; `Switch` is its sibling inside `Field`; no `FieldError`.
- Choice card example: `FieldLabel htmlFor="switch-share"` wraps a horizontal `Field` holding `FieldContent` and `<Switch id="switch-share" />`.

## Why it matters for ORIVILO

D.3 row 18 of `docs/specs/ORV-64/audit.md` asks for Field wiring. Our `Field` passes wiring through context; shadcn's does not, so its examples show the shape of the markup but not a wiring to copy.
