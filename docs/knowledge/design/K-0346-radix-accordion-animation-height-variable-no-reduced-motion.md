---
id: K-0346
topic: design
claim: Radix UI Accordion exposes --radix-accordion-content-height and --radix-accordion-content-width as aliases of the Collapsible variables, its docs animate height with 300ms ease-out keyframes and rotate the chevron with a 300ms transition, and the docs source does not mention prefers-reduced-motion.
source: "https://www.radix-ui.com/primitives/docs/components/accordion; https://raw.githubusercontent.com/radix-ui/website/main/data/primitives/docs/components/accordion.mdx; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/accordion/src/accordion.tsx; packages/design-system/catalog/base/collapsible.yaml"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.8: one publisher, docs and source agree; nothing was rendered.

### Variables

```tsx
'--radix-accordion-content-height': 'var(--radix-collapsible-content-height)',
'--radix-accordion-content-width': 'var(--radix-collapsible-content-width)',
```

The docs page describes them as the content's height and width as it opens or closes.

### Animation example

```text
animation: slideDown 300ms ease-out;
animation: slideUp 300ms ease-out;
transition: transform 300ms;
```

The keyframes move height between 0 and `var(--radix-accordion-content-height)`; the third line is the rotated icon example. The fetch tool found no mention of `prefers-reduced-motion` in the `.mdx`.

## Why it matters for ORIVILO

This is the same example shape as Radix Collapsible (K-0121). Our Collapsible's catalog entry says "No height, width or transform animates" (`packages/design-system/catalog/base/collapsible.yaml`), so the example does not match what the repo already chose there.
