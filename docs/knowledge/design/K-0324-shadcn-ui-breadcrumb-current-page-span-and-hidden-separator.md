---
id: K-0324
topic: design
claim: shadcn/ui marks the current crumb as a span with role link, aria-disabled true and aria-current page, hides separators and the ellipsis with role presentation and aria-hidden, and names the trail with a nav aria-label of breadcrumb that a caller can override.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/breadcrumb.tsx; https://ui.shadcn.com/docs/components/radix/breadcrumb; https://www.w3.org/TR/wai-aria-1.2/#aria-hidden"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. `new-york-v4` and `bases/radix` list the same `role` and `aria-*` lines for the page, separator and ellipsis parts; the `nav` line below is from `new-york-v4`.

```tsx
return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
```

- `BreadcrumbPage`: `role="link"`, `aria-disabled="true"`, `aria-current="page"` on a `span`. No `href`, so it is not in the tab order by our reading of the part.
- `BreadcrumbSeparator`: `role="presentation"`, `aria-hidden="true"`.
- `BreadcrumbEllipsis`: `role="presentation"`, `aria-hidden="true"`, with `<span className="sr-only">More</span>` inside it.
- `{...props}` comes after `aria-label` on `Breadcrumb`, so a caller can replace the name.
- The docs page does not mention `aria-current`.

### Our reading of the sr-only text

WAI-ARIA 1.2 on `aria-hidden`, value true:

> The element is hidden from the accessibility API.

The spec also counts an element as hidden when it or an ancestor has the attribute set to true. By our reading, the sr-only "More" sits inside a hidden part, so a screen reader does not reach it when the ellipsis stands alone. The sentence is ours; no page read states it for this component.

## Why it matters for ORIVILO

This is a third form of the current crumb, neither a real link nor plain text. The benchmark compares it with what the APG and G65 name.
