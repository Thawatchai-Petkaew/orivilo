---
id: K-0175
topic: design
claim: In shadcn/ui's two registry files read, EmptyTitle and EmptyDescription both render a div, so the title is no heading, neither file sets a role or an aria attribute, and the visual values differ by style set, with an icon tile of size-10 and a text-lg title in new-york-v4 against size-8 and text-sm in style-nova.css.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/empty.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/empty.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/styles/style-nova.css"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool, `main` branch of `shadcn-ui/ui` (no commit hash shown). The tool returned both `empty.tsx` files in full, and neither has a `role` or an `aria-*` attribute. Confidence 0.8: one project, its files agree on the elements; nothing was rendered. Styles other than nova were not read.

From `new-york-v4/ui/empty.tsx`:

```text
function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
```

The parts in both files: `Empty`, `EmptyHeader`, `EmptyContent` and `EmptyTitle` are `div`s with `data-slot` values `empty`, `empty-header`, `empty-content` and `empty-title`. `EmptyMedia` is a `div` with `data-slot="empty-icon"` and `data-variant`. `EmptyDescription` is typed as `p` and renders a `div`, as the excerpt shows.

Values in `new-york-v4/ui/empty.tsx`:

- Empty: `gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12`.
- EmptyHeader: `max-w-sm`, `gap-2`.
- EmptyMedia: `mb-2`; `icon` is `size-10`, `rounded-lg`, `bg-muted`, `text-foreground`, svg `size-6`.
- EmptyTitle: `text-lg font-medium tracking-tight`.
- EmptyDescription: `text-sm/relaxed text-muted-foreground`, with underlined links.
- EmptyContent: `max-w-sm`, `gap-4`, `text-sm`.

Values in `style-nova.css`, which `bases/radix/ui/empty.tsx` reaches through `cn-empty` class names:

- `.cn-empty`: `gap-4 rounded-xl border-dashed p-6`.
- `.cn-empty-header`: `gap-2`.
- `.cn-empty-media`: `mb-2`.
- `.cn-empty-media-icon`: `bg-muted text-foreground`, `size-8`, `rounded-lg`, svg `size-4`.
- `.cn-empty-title`: `text-sm font-medium tracking-tight`.
- `.cn-empty-description`: `text-sm/relaxed`.
- `.cn-empty-content`: `gap-2.5 text-sm`.

`border-dashed` sets a border style only; the page's Outline example adds `border` (K-0174).

## Why it matters for ORIVILO

Where Untitled UI's title is an `h1` (K-0172), shadcn's is a plain `div`: one is a heading that may be the wrong level, the other is no heading at all. The two style sets show that these sizes belong to a style, not to the component.
