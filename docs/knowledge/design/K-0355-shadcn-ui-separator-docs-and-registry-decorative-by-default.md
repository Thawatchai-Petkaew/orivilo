---
id: K-0355
topic: design
claim: shadcn/ui's Separator is one part with orientation default horizontal and decorative default true, a 1 px line in bg-border through data attributes, four examples (Vertical, Menu, List, RTL), Base UI, React Aria and Radix versions, no accessibility text, and no size or variant.
source: "https://ui.shadcn.com/docs/components/radix/separator; https://ui.shadcn.com/docs/components/separator; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/separator.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/separator.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool, `main` branch of `shadcn-ui/ui` (no commit hash shown). Confidence 0.8: two docs pages and two registry files that agree; nothing was rendered.

> Visually or semantically separates content.

```tsx
<Separator />
```

Example notes: Vertical uses `orientation="vertical"`; Menu has vertical separators between menu items; List has horizontal separators between list items; RTL links the RTL guide. The API section points at the Radix UI docs on the Radix page and at Base UI on the default page. The page has no props table and no accessibility section.

### `new-york-v4/ui/separator.tsx`

```tsx
orientation = "horizontal",
decorative = true,
data-slot="separator"
"shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
```

### `bases/radix/ui/separator.tsx`

Same defaults and slot; classes `shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch`.

## Why it matters for ORIVILO

`decorative = true` is shadcn's own default, not Radix's (K-0356), so shadcn's separator is out of the accessibility tree unless the caller opts in.
