---
id: K-0222
topic: design
claim: shadcn/ui's Breadcrumb is a nav aria-label "breadcrumb" over an ol; BreadcrumbPage is a span with role link, aria-disabled true and aria-current page, the separator is a presentation li, and BreadcrumbEllipsis carries sr-only "More"; the page has no responsive example and no accessibility statement.
source: "https://ui.shadcn.com/docs/components/radix/breadcrumb; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

Docs:

> The `BreadcrumbPage` component displays the current page in the breadcrumb (non-clickable).

> We provide a `<BreadcrumbEllipsis />` component to show a collapsed state when the breadcrumb is too long.

> You can compose `<BreadcrumbItem />` with a `<DropdownMenu />` to create a dropdown in the breadcrumb.

`breadcrumb.tsx`:

```tsx
<nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
role="link" aria-disabled="true" aria-current="page"
```

- `BreadcrumbList` is an `ol`, `BreadcrumbItem` an `li`, neither with ARIA attributes.
- `BreadcrumbSeparator` is an `li` with `role="presentation" aria-hidden="true"`; a custom separator is passed as `children`.
- `BreadcrumbEllipsis` is a `span` with `role="presentation" aria-hidden="true"`, holding `<span className="sr-only">More</span>`.
- `BreadcrumbLink` takes `asChild` for a routing link.

## Why it matters for ORIVILO

APG says `aria-current` is optional when the current page is not a link (K-0228). Both libraries read set it anyway, Untitled on a disabled link (K-0212), shadcn on a span given the link role.
