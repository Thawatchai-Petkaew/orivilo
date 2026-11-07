---
id: K-0120
topic: design
claim: shadcn/ui's Collapsible is three parts (Collapsible, CollapsibleTrigger, CollapsibleContent) with open and onOpenChange for control; the docs offer Base UI, React Aria and Radix UI versions and send the API to each library's docs, and the Radix registry file adds only a data-slot attribute to each part, with no class, no animation and no size or variant.
source: "https://ui.shadcn.com/docs/components/collapsible; https://ui.shadcn.com/docs/components/radix/collapsible; https://ui.shadcn.com/docs/components/base/collapsible; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/collapsible.tsx"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-203]
license: MIT
---

## Evidence

Read on 2026-11-01 through a fetch tool, `main` branch of `shadcn-ui/ui` (no commit hash shown). Confidence 0.8: one project, three docs pages and one registry file that agree; nothing was rendered.

### The docs pages

> An interactive component which expands/collapses a panel.

```text
Collapsible
├── CollapsibleTrigger
└── CollapsibleContent
```

The usage example puts plain text in `CollapsibleTrigger` ("Can I use this in my project?") and in `CollapsibleContent`. Controlled state uses `<Collapsible open={open} onOpenChange={setOpen}>`. Examples: Basic ("Product details" card with `ChevronDownIcon`), Settings Panel ("Use a trigger button to reveal additional settings."), File Tree ("Use nested collapsibles to build a file tree."), RTL, Controlled State.

The default page links three versions, `/docs/components/base/collapsible`, `/docs/components/aria/collapsible` and `/docs/components/radix/collapsible`. The API section is one sentence: "See the Base UI documentation for more information." on the default and Base pages, "See the Radix UI documentation for more information." on the Radix page. No page has a props table, an accessibility section, a `data-state` mention or an animation class.

### The registry file (`new-york-v4/ui/collapsible.tsx`)

> import { Collapsible as CollapsiblePrimitive } from "radix-ui"

The fetch tool reported `data-slot` values `"collapsible"`, `"collapsible-trigger"` and `"collapsible-content"`, each part spreading its props, and "None is added" for className or animation classes; no `cn` merge.

### Claims that did not re-check

- The fetch tool flagged that the file reads `CollapsiblePrimitive.CollapsibleTrigger` and `CollapsiblePrimitive.CollapsibleContent`; whether `radix-ui` exports those names was not checked against the `radix-ui` package. Pages searched: the three docs pages and the registry file in `source:`.

## Why it matters for ORIVILO

ORV-203 benchmarks a shared Collapsible against shadcn/ui. shadcn ships no look, no motion and no ARIA of its own here; everything comes from the primitive (K-0121, K-0122).
