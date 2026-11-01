---
id: K-0112
topic: design
claim: Tailwind CSS's animate-spin is spin 1s linear infinite (a full rotation) and animate-pulse is pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite (opacity to 0.5 at the midpoint); neither class carries a reduced-motion rule, and Tailwind's docs tell authors to add motion-safe or motion-reduce themselves, with a spinner as the example.
source: "https://tailwindcss.com/docs/animation"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-201]
license: MIT
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: one first-party page.

```text
animation: var(--animate-spin); /* spin 1s linear infinite */ @keyframes spin { to { transform: rotate(360deg); } }
animation: var(--animate-pulse); /* pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite */ @keyframes pulse { 50% { opacity: 0.5; } }
```

> For situations where the user has specified that they prefer reduced motion, you can conditionally apply animations and transitions using the `motion-safe` and `motion-reduce` variants:

The example that follows puts `motion-safe:animate-spin` on the svg of a disabled "Processing" button.

## Why it matters for ORIVILO

Both shadcn components (K-0110, K-0111) and Untitled UI's spinner (K-0108) use these classes bare, so none of them changes under reduced motion unless the caller adds a rule. Whether Untitled UI's `theme.css` redefines `--animate-spin` was not read.
