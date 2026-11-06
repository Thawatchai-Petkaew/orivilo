---
id: K-0345
topic: design
claim: In Radix's accordion.tsx the Header renders an h3 unless asChild changes it, the Trigger wraps the Collapsible trigger and sets aria-disabled while an item is open and cannot collapse, and the Content wraps the Collapsible content with role region and aria-labelledby pointing at the trigger, set before the caller's props are spread.
source: "https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/accordion/src/accordion.tsx; https://raw.githubusercontent.com/radix-ui/website/main/data/primitives/docs/components/accordion.mdx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool, `main` branch of `radix-ui/primitives` (no commit hash shown). Confidence 0.8: one source file, quoted line by line; not run.

### Header

```tsx
<Primitive.h3
```

> Wraps an Accordion.Trigger. Use the asChild prop to update it to the appropriate heading level for your page.

### Trigger

```tsx
aria-disabled={(itemContext.open && !collapsibleContext.collapsible) || undefined}
id={itemContext.triggerId}
```

The Trigger wraps `CollapsiblePrimitive.Trigger`, so `aria-expanded` and `aria-controls` come from Collapsible (K-0122), including `aria-controls` being set only while open. Single mode defaults to `collapsible = false,`; multiple mode hardcodes `collapsible={true}`. JSDoc: "Whether an accordion item can be collapsed after it has been opened."

### Content

```tsx
<CollapsiblePrimitive.Content
  role="region"
  aria-labelledby={itemContext.triggerId}
  data-orientation={accordionContext.orientation}
  {...collapsibleScope}
  {...contentProps}
```

By our reading, since `{...contentProps}` comes after `role="region"`, a caller's `role` replaces it; this was read, not run.

## Why it matters for ORIVILO

The heading level is a caller's job, since the h3 is only a default. `region` is on every panel, while the APG makes it optional and warns about many open at once (K-0349), which matters only for `type="multiple"`.
