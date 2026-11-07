---
id: K-0331
topic: design
claim: shadcn/ui Pagination computes no page range, its docs do not say how to place the ellipsis, its demo writes each page and the ellipsis by hand, and an Icons Only example drops the numbers.
source: "https://ui.shadcn.com/docs/components/radix/pagination; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/examples/pagination-demo.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/pagination.tsx"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. Confidence 0.75, not 0.8: the main fact is an absence.

> Use just the previous and next buttons without page numbers.

```tsx
<PaginationLink href="#">1</PaginationLink>
<PaginationLink href="#" isActive>
<PaginationLink href="#">3</PaginationLink>
<PaginationEllipsis />
```

- The demo's page numbers are literals, and the ellipsis is a static element. Nothing comes from a page count or a loop.
- The docs page shows `PaginationEllipsis` in the composition and usage samples and does not describe computing a page range or placing the ellipsis.
- The parts read in `pagination.tsx` take no `page`, `total` or `siblingCount`: they render what the caller places.
- The docs describe Icons Only as useful for data tables with a rows-per-page selector; the Simple example lists pages 1 to 5.

## Why it matters for ORIVILO

With shadcn, shortening a long range is the caller's job. A shared ORIVILO Pagination would have to choose between that and the computed range of [[K-0327-untitled-ui-pagination-sibling-count-range]], and that choice sits with the designer.
