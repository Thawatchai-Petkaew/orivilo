---
id: K-0342
topic: design
claim: shadcn/ui's new-york-v4 Accordion file adds a bottom border per item, one trailing chevron rotated 180 degrees while open, accordion-up and accordion-down animation classes and pt-0 pb-4 content padding, and sets no aria attribute, role, asChild or reduced-motion class; the bases/radix file swaps to two icons, one shown per state, and also sets no aria attribute.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/accordion.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/accordion.tsx; .claude/rules/design-system.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool, `main` branch of `shadcn-ui/ui` (no commit hash shown). Confidence 0.8: two files of one project, quoted in pieces by the fetch tool; not run. The keyframes behind `animate-accordion-up` and `animate-accordion-down` were not read.

### `new-york-v4/ui/accordion.tsx`

```text
import { Accordion as AccordionPrimitive } from "radix-ui"
cn("border-b last:border-b-0", className)
flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all
focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180
pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200
overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down
```

The lines are the primitive import, the item, the trigger (first and last of three pieces), the chevron and the content. The inner div is `cn("pt-0 pb-4", className)`. The trigger's middle piece holds `hover:underline`. Asked for each string, the fetch tool found no `motion-reduce`, `prefers-reduced-motion`, `aria-`, `role` or `asChild` in the file, and one `ChevronDownIcon` in `AccordionTrigger`.

### `bases/radix/ui/accordion.tsx`

Slots: `accordion`, `accordion-item`, `accordion-trigger`, `accordion-trigger-icon`, `accordion-content`. Two icons:

```text
cn-accordion-trigger-icon pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden
cn-accordion-trigger-icon pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline
```

The first is a chevron down, the second a chevron up (`lucide="ChevronDownIcon"`, `lucide="ChevronUpIcon"`). The inner content class holds `h-(--radix-accordion-content-height)`. The fetch tool reported "no explicit aria attributes" other than those class strings.

## Why it matters for ORIVILO

Every ARIA attribute on shadcn's Accordion comes from the primitive (K-0345). The classes are shadcn visual classes, which `.claude/rules/design-system.md` keeps out of our components.
