---
id: K-0148
topic: design
claim: shadcn/ui's Switch is one component with `size` sm or default (default), documented with description, choice card, disabled, invalid, size and RTL examples; the invalid state is `aria-invalid` on the Switch and `data-invalid` on the Field, and the `new-york-v4` registry file has no `aria-invalid` class while `style-nova.css` has one.
source: "https://ui.shadcn.com/docs/components/switch; https://ui.shadcn.com/docs/components/radix/switch; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/switch.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/switch.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/styles/style-nova.css; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/switch-sizes.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

### Pages

> A control that allows the user to toggle between checked and not checked.

> Add the `disabled` prop to the `Switch` component to disable the switch.

> Add the `data-disabled` prop to the `Field` component for styling.

> Add the `aria-invalid` prop to the `Switch` component to indicate an invalid state.

> Use the `size` prop to change the size of the switch.

> Card-style selection where `FieldLabel` wraps the entire `Field` for a clickable card pattern.

- Install: `pnpm dlx shadcn@latest add switch`. Offered for Base UI, React Aria and Radix UI.
- Sections on the Radix page: Installation, Usage, Description, Choice Card, Disabled, Invalid, Size, RTL, API Reference. There is no accessibility section. API Reference reads "See the Radix Switch documentation."
- The page does not list the `size` values; the example labels are "Small" and "Default", and `switch-sizes.tsx` passes `size="sm"` and `size="default"`.

### Registry

- Prop: `size?: "sm" | "default"`, `size = "default"`, written to `data-size`.

- `new-york-v4` track: `data-[size=default]:h-[1.15rem] data-[size=default]:w-8`, `data-[size=sm]:h-3.5 data-[size=sm]:w-6`.
- `style-nova.css` track: `data-[size=default]:h-[18.4px] data-[size=default]:w-[32px]`, `data-[size=sm]:h-[14px] data-[size=sm]:w-[24px]`.
- Thumb in both: default `size-4`, sm `size-3`.
- `new-york-v4`: `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`, `disabled:cursor-not-allowed disabled:opacity-50`, and no `aria-invalid` class.
- `bases/radix`: `data-slot="switch"`, `data-slot="switch-thumb"`, `after:absolute after:-inset-x-3 after:-inset-y-2`, `data-disabled:cursor-not-allowed data-disabled:opacity-50`.
- `style-nova.css`: `data-checked:bg-primary data-unchecked:bg-input`, `aria-invalid:border-destructive`, `aria-invalid:ring-destructive/20`, `focus-visible:ring-3 aria-invalid:ring-3`.

## Why it matters for ORIVILO

ORV-221 needs the shadcn/ui row for Switch. A reader of the page alone would not learn the size values, and the two registry forms differ on the invalid look, so both are recorded.
