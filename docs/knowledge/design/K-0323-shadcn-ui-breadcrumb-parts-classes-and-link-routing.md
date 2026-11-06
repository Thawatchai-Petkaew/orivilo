---
id: K-0323
topic: design
claim: shadcn/ui Breadcrumb is a set of composed parts over nav, ol and li with no variant or size prop, a replaceable separator, and a router link through asChild in the Radix version and render in the Base UI version.
source: "https://ui.shadcn.com/docs/components/radix/breadcrumb; https://ui.shadcn.com/docs/components/base/breadcrumb; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/breadcrumb.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes; the source files came back as listed lines, not whole files.

> Displays the path to the current resource using a hierarchy of links.

```tsx
const Comp = asChild ? Slot.Root : "a";
```

### Parts (docs API list and `new-york-v4/ui/breadcrumb.tsx`)

- `Breadcrumb` is a `nav`; `BreadcrumbList` an `ol`; `BreadcrumbItem` an `li`; `BreadcrumbLink` an `a` or its child with `asChild`; `BreadcrumbPage` a `span`; `BreadcrumbSeparator` an `li`; `BreadcrumbEllipsis` a presentational placeholder.
- Each part has a `data-slot` and merges `className`. The docs say most parts accept `className`, and `BreadcrumbSeparator` also accepts `children`.
- Separator default: `{children ?? <ChevronRight />}`. The docs: "to create a custom separator", shown with a dot icon.

### Classes (`new-york-v4`)

- List: `flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5`. A long trail wraps by default.
- Link: `transition-colors hover:text-foreground`. Page: `font-normal text-foreground`. Ellipsis: `flex size-9 items-center justify-center`.
- `bases/radix` uses hook classes instead (`cn-breadcrumb-list flex flex-wrap items-center wrap-break-word`), and flips the separator icon with `cn-rtl-flip`.

### Routing

- Radix docs: the `asChild` prop on `BreadcrumbLink` takes a routing library's link.
- Base UI docs: "you can use the `render` prop on `<BreadcrumbLink />`".

### States and sizes

Neither the docs read nor the listed source lines name a variant, a size, a disabled state or a loading state.

## Why it matters for ORIVILO

The shadcn trail is structure with no variants, so its variant and size cells are empty. Its `asChild` route matches what the repo's Button already does, which the benchmark table records.
