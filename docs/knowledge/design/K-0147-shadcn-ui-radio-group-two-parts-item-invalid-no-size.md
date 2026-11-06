---
id: K-0147
topic: design
claim: shadcn/ui's Radio Group has two parts (RadioGroup, RadioGroupItem) and no size prop; its Radix page documents description, choice card, fieldset, per-item disabled, invalid and RTL examples, sets the invalid look through `aria-invalid` on each item, and has no accessibility section.
source: "https://ui.shadcn.com/docs/components/radio-group; https://ui.shadcn.com/docs/components/radix/radio-group; https://ui.shadcn.com/docs/components/base/radio-group; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/radio-group.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/radio-group.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/styles/style-nova.css"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

### Pages

> A set of checkable buttons[-]known as radio buttons[-]where no more than one of the buttons can be checked at a time.

> Use `FieldLabel` to wrap the entire `Field` for a clickable card-style selection.

> Use `FieldSet` and `FieldLegend` to group radio items with a label and description.

> Use `aria-invalid` on `RadioGroupItem` and `data-invalid` on `Field` to show validation errors.

- Install: `pnpm dlx shadcn@latest add radio-group`. The page is offered for Base UI, React Aria and Radix UI.
- Sections on the Radix page: Installation, Usage, Composition, Description, Choice Card, Fieldset, Disabled, Invalid, RTL, API Reference. There is no accessibility section.
- The two variants read differently on Disabled. Radix page: "Use the `disabled` prop on `RadioGroupItem` to disable individual items." Base UI page: "Use the `disabled` prop on `RadioGroup` to disable all items."
- API Reference is a link: "See the Radix UI Radio Group documentation." on the Radix page, "See the Base UI Radio Group documentation." on the Base UI page.
- Usage pairs each `RadioGroupItem` `id` with a `Label` `htmlFor`.

### Registry

- Both files read take the primitive's props and add no `size` prop.
- `new-york-v4`: the group is `grid gap-3`. The item:

```text
aspect-square size-4 shrink-0
border border-input text-primary shadow-xs
focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
aria-invalid:border-destructive aria-invalid:ring-destructive/20
disabled:cursor-not-allowed disabled:opacity-50
```

- The indicator is a filled `CircleIcon` from `lucide-react`, `size-2`, `fill-primary`.
- `bases/radix`: `data-slot` on the group, the item and the indicator; `cn-radio-group w-full`; the item carries `after:absolute after:-inset-x-3 after:-inset-y-2` and `disabled:cursor-not-allowed disabled:opacity-50`.
- `style-nova.css`: `.cn-radio-group` is `grid gap-2`; the item has `flex size-4 rounded-full focus-visible:ring-3 aria-invalid:ring-3`, `data-checked:bg-primary data-checked:text-primary-foreground`, `aria-invalid:border-destructive` and `aria-invalid:aria-checked:border-primary`; the indicator icon is `size-2`.

## Why it matters for ORIVILO

ORV-221 needs the shadcn/ui row. Our package is on the Radix primitives, so the Radix page is the matching variant; where the Base UI page differs, this entry says so. K-0155 is the check on `aria-invalid` placed on the item.
