---
id: K-0121
topic: design
claim: Radix UI Collapsible has Root (asChild, defaultOpen, open, onOpenChange, disabled), Trigger (asChild) and Content (asChild, forceMount for animation libraries); every part carries data-state open or closed and data-disabled, Content exposes --radix-collapsible-content-height and --radix-collapsible-content-width, Space and Enter open and close it, and the docs animate height with 300ms ease-out keyframes.
source: "https://www.radix-ui.com/primitives/docs/components/collapsible; https://raw.githubusercontent.com/radix-ui/website/main/data/primitives/docs/components/collapsible.mdx"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-203]
license: MIT
---

## Evidence

Read on 2026-11-01 through a fetch tool: the docs page and its source file in `radix-ui/website` (`main`, no commit hash shown). Confidence 0.8: one publisher, page and source agree.

### Parts and props

> An interactive component which expands/collapses a panel.

| Part    | Props (type, default)                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Root    | `asChild` boolean `false`; `defaultOpen` boolean; `open` boolean; `onOpenChange` `(open: boolean) => void`; `disabled` boolean |
| Trigger | `asChild` boolean `false`                                                                                                      |
| Content | `asChild` boolean `false`; `forceMount` boolean                                                                                |

> When true, prevents the user from interacting with the collapsible.

(`disabled`, Root.)

> Used to force mounting when more control is needed. Useful when controlling animation with React animation libraries.

(`forceMount`, Content, from the `.mdx` source; the rendered page shows only the table row.)

### Data attributes and CSS variables

Root, Trigger and Content each list `[data-state]` `"open" | "closed"` and `[data-disabled]` "Present when disabled". Content lists:

> --radix-collapsible-content-width: The width of the content when it opens/closes
> --radix-collapsible-content-height: The height of the content when it opens/closes

### Animation example

The example sets `overflow: hidden` on the content and, by `data-state`:

```text
animation: slideDown 300ms ease-out;
animation: slideUp 300ms ease-out;
```

with `@keyframes slideDown` and `@keyframes slideUp` moving `height` between 0 and `var(--radix-collapsible-content-height)`. Neither the page nor the source mentions `prefers-reduced-motion`.

### Accessibility

> Adheres to the Disclosure WAI-ARIA design pattern.

Keyboard: `Space` "Opens/closes the collapsible."; `Enter` "Opens/closes the collapsible."

## Why it matters for ORIVILO

ORIVILO components take behaviour from the `radix-ui` package (`.claude/rules/design-system.md`), so these props, attributes and the height variable are what a Collapsible built on it gets. The 300ms example has no reduced-motion rule, so that stance is ours to set (K-0124).
