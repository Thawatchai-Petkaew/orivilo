---
id: K-0325
topic: design
claim: shadcn/ui has no automatic collapse, the caller places BreadcrumbEllipsis by hand, and its registry examples show a static ellipsis, an ellipsis inside a DropdownMenuTrigger, and a responsive trail that keeps 3 items, with a DropdownMenu from 768 px and a Drawer below it.
source: "https://ui.shadcn.com/docs/components/radix/breadcrumb; https://ui.shadcn.com/docs/components/base/breadcrumb; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/examples/breadcrumb-ellipsis.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/examples/breadcrumb-demo.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/examples/breadcrumb-responsive.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The three example files are from the registry; which of them the current docs page renders was not confirmed.

### Docs

> show a collapsed state when the breadcrumb is too long

> displays an ellipsis indicator for collapsed breadcrumb items

> to create a dropdown in the breadcrumb

The Radix page mentions no maximum item count and no automatic collapse.

### `breadcrumb-ellipsis.tsx`

`<BreadcrumbEllipsis />` sits directly in a `BreadcrumbItem`, not in a trigger or button. By our reading, the hidden crumbs cannot be reached in this form.

### `breadcrumb-demo.tsx`

```tsx
<DropdownMenuTrigger className="flex items-center gap-1">
  <BreadcrumbEllipsis className="size-4" />
  <span className="sr-only">Toggle menu</span>
</DropdownMenuTrigger>
```

The menu items are `Documentation`, `Themes` and `GitHub`. The trigger's name comes from the sr-only span beside the hidden ellipsis.

### `breadcrumb-responsive.tsx`

- `const ITEMS_TO_DISPLAY = 3`, with `useMediaQuery("(min-width: 768px)")` choosing the form.
- At that width and up, the middle items go in a `DropdownMenu` opened from an ellipsis trigger, `aria-label="Toggle menu"`. Below it they go in a `Drawer`, `aria-label="Toggle Menu"`.
- `BreadcrumbLink` and `BreadcrumbPage` take `max-w-20 truncate md:max-w-none`, which cuts long labels on small screens.

## Why it matters for ORIVILO

This is the second collapse model read: composition instead of a count prop. It keeps the hidden crumbs reachable through a menu, and it also shows that long labels are a separate problem from long trails.
