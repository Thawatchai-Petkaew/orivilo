---
id: K-0343
topic: design
claim: Radix UI Accordion has Root (type required, value, defaultValue, onValueChange, collapsible default false, disabled, dir, orientation default vertical), Item (value required, disabled), Header, Trigger and Content (forceMount), with data-state, data-disabled and data-orientation on the item parts; collapsible applies when type is single.
source: "https://www.radix-ui.com/primitives/docs/components/accordion; https://raw.githubusercontent.com/radix-ui/website/main/data/primitives/docs/components/accordion.mdx; pnpm-lock.yaml"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool: the docs page and its source file in `radix-ui/website` (`main`, no commit hash shown). Confidence 0.8: one publisher, page and source agree. `pnpm-lock.yaml` pins `radix-ui@1.8.1` and `@radix-ui/react-accordion@1.3.1`; whether the docs describe that exact version was not stated on the page.

> A vertically stacked set of interactive headings that each reveal an associated section of content.

- Root: `asChild` boolean `false`; `type` enum, required; `value`, `defaultValue` string (single) or string[] `[]` (multiple); `onValueChange` function; `collapsible` boolean `false`; `disabled` boolean `false`; `dir` enum `"ltr"`; `orientation` enum `"vertical"`.
- Item: `asChild` boolean `false`; `disabled` boolean `false`; `value` string, required.
- Header: `asChild` boolean `false`.
- Trigger: `asChild` boolean `false`.
- Content: `asChild` boolean `false`; `forceMount` boolean.

> Determines whether one or multiple items can be opened at the same time.

> When type is "single", allows closing content when clicking trigger for an open item.

> When true, prevents the user from interacting with the accordion and all its items.

(`type`, `collapsible`, `disabled` on Root.) Root carries `[data-orientation]`. Item, Header, Trigger and Content carry `[data-state]` `"open" | "closed"`, `[data-disabled]` and `[data-orientation]`. Example headings: Expanded by default, Allow collapsing all items, Multiple items open at the same time, Rotated icon when open, Horizontal orientation, Animating content size.

## Why it matters for ORIVILO

These are the props an Accordion on the `radix-ui` package gets. `collapsible` is off by default, so with `type="single"` an open item cannot be closed unless the caller turns it on (K-0345, K-0349).
