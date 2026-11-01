---
id: K-0111
topic: design
claim: shadcn/ui's Skeleton is one div with data-slot="skeleton" and the classes animate-pulse rounded-md bg-accent plus the caller's className; shape and size come from className only (no variant, size or shape prop), the page shows Avatar, Card, Text, Form and Table compositions, and neither page nor code sets an aria attribute or a reduced-motion rule.
source: "https://ui.shadcn.com/docs/components/skeleton; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/skeleton.tsx"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-201]
license: MIT
---

## Evidence

Read on 2026-11-01 through a fetch tool, `main` branch of `shadcn-ui/ui` (no commit hash shown). Confidence 0.8: one project, page and registry file agree; nothing was rendered.

### The registry file (`new-york-v4/ui/skeleton.tsx`)

```tsx
className={cn("animate-pulse rounded-md bg-accent", className)}
```

The fetch tool reported a `div` with `data-slot="skeleton"`, other props passed through.

### The page

> Use to show a placeholder while content is loading.

```tsx
<Skeleton className="h-[20px] w-[100px] rounded-full" />
```

Examples named on the page: Avatar (`SkeletonAvatar`), Card, Text (`SkeletonText`), Form (`SkeletonForm`), Table (`SkeletonTable`) and RTL; their code is collapsed in the fetched text. The page lists no props beyond `className`, no accessibility note, and does not mention reduced motion. Tailwind's `animate-pulse` is an opacity loop with no reduced-motion rule of its own (K-0112).

## Why it matters for ORIVILO

ORV-201 benchmarks a shared skeleton against shadcn/ui. shadcn gives a bare shape and leaves the busy state, the hiding from assistive technology and the reduced-motion case to the caller.
