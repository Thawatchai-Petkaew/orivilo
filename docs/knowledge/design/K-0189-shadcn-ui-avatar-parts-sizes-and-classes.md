---
id: K-0189
topic: design
claim: shadcn/ui's Avatar has six parts (own count, Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount), a size prop of default, sm or lg and no variant prop; its new-york-v4 registry file wraps the Radix Avatar and sets no aria or role attribute.
source: "https://ui.shadcn.com/docs/components/avatar; https://ui.shadcn.com/docs/components/radix/avatar; https://ui.shadcn.com/docs/components/radix/avatar.md; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/avatar.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: MIT
---

## Evidence

Read through a fetch tool that returns short quotes. `/docs/components/avatar` describes the Base UI build; the page links separate tabs for Base UI, React Aria and Radix UI. This entry uses the Radix page, since ORIVILO's behaviour comes from the `radix-ui` package. The React Aria tab was not read.

> "An image element with a fallback for representing the user."
> "Use the `size` prop to change the size of the avatar."

### API on the Radix page

`Avatar`: `size` `"default" | "sm" | "lg"`, default `"default"`, and `className`. `AvatarImage`: `src`, `alt`, `className`. `AvatarFallback`, `AvatarBadge`, `AvatarGroup` and `AvatarGroupCount`: `className`. The page points to the "Radix UI documentation" for further props.

### Examples

9 examples (own count, the sentences before each example on the Radix page): Basic, Badge, Badge with Icon, Avatar Group, Avatar Group Count, Avatar Group with Icon, Sizes, Dropdown, RTL.

### Registry file

```text
import { Avatar as AvatarPrimitive } from "radix-ui"
size = "default",
data-size={size}
"group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none
data-[size=lg]:size-10 data-[size=sm]:size-6"
```

- `AvatarImage`: `aspect-square size-full`.
- `AvatarGroup`: `group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background`.
- `AvatarGroupCount`: a circle at `size-8`, `size-10` in a `lg` group and `size-6` in an `sm` group, `bg-muted text-sm text-muted-foreground`.
- 6 parts (own count, the `data-slot` values in this file): `avatar`, `avatar-image`, `avatar-fallback`, `avatar-badge`, `avatar-group`, `avatar-group-count`.
- The fetch reports no `aria-*` and no `role` in the file. It does not set `alt` or a delay.

### States

The page names no disabled, loading or selected state. Its word check found no "aria" and no "screen reader".

## Why it matters for ORIVILO

This fills the shadcn/ui row for variants, sizes and slots. The classes are a reference only: the repo rule keeps no shadcn class (`.claude/rules/design-system.md`).
