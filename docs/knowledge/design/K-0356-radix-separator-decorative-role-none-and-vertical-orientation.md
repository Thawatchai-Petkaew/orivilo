---
id: K-0356
topic: design
claim: Radix UI Separator takes asChild, orientation (default horizontal) and decorative (no default); decorative true renders role none, otherwise role separator, and aria-orientation is written only when vertical; data-orientation is always set.
source: "https://www.radix-ui.com/primitives/docs/components/separator; https://raw.githubusercontent.com/radix-ui/website/main/data/primitives/docs/components/separator.mdx; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/separator/src/separator.tsx; pnpm-lock.yaml"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool, `main` branches (no commit hash shown). Confidence 0.8: one publisher, docs and source agree; not run. `pnpm-lock.yaml` pins `@radix-ui/react-separator@1.2.0`.

> Adheres to the separator role requirements

> When true, signifies that it is purely visual, carries no semantic meaning

(The sentence goes on; the fetch tool cut it at the `<Code>` markup.)

### Source

```tsx
const DEFAULT_ORIENTATION = Orientation.Horizontal;
const { decorative, orientation: orientationProp = DEFAULT_ORIENTATION, ...domProps } = props;
const ariaOrientation = orientation === Orientation.Vertical ? orientation : undefined;
const semanticProps = decorative
  ? { role: 'none' }
  : { 'aria-orientation': ariaOrientation, role: 'separator' };
```

`data-orientation={orientation}` is set in both cases. Docs table: `asChild` boolean `false`, `orientation` enum `"horizontal"`, `decorative` boolean with no default.

## Why it matters for ORIVILO

Left alone, Radix exposes a real separator; shadcn flips this (K-0355). Leaving out `aria-orientation` for horizontal fits the implicit value in WAI-ARIA 1.2 (K-0358).
