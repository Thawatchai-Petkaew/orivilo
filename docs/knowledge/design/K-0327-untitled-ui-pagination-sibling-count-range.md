---
id: K-0327
topic: design
claim: Untitled UI Pagination computes its own page range from siblingCount (default 1), lists every page while siblingCount times 2 plus 5 is at least total (7 pages at the default, own arithmetic), and past that uses ellipses while keeping the first and last page.
source: "https://www.untitledui.com/react/components/pagination.md; https://raw.githubusercontent.com/untitleduico/react/main/components/application/pagination/pagination-base.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The page and `pagination-base.tsx` agree; they share a publisher, so they count as one source.

> Use `siblingCount`, which defaults to `1`

> while `siblingCount * 2 + 5` is greater than or equal to `total`

> while always keeping the first and last page visible

### Source lines

```tsx
if (totalPageNumbers >= total) {
const showLeftEllipsis = leftSiblingIndex > 2;
const showRightEllipsis = rightSiblingIndex < total - 1;
```

- `totalPageNumbers` is `siblingCount * 2 + 5`. The left edge is `page - siblingCount`, floored at 1; the right edge is `page + siblingCount`, capped at `total`.
- Three cases follow: right ellipsis only, left ellipsis only, or both. Ellipsis entries are objects with `type: "ellipsis"` and a numeric `key`.
- Own arithmetic: at `siblingCount` 1 the threshold is `1 * 2 + 5 = 7`, so a `total` of 7 or fewer lists every page.
- `PaginationCardMinimal` and `PaginationCardAdvanced` do not accept `siblingCount`: they show no number row.

## Why it matters for ORIVILO

This is the one computed range read; shadcn has none ([[K-0331-shadcn-ui-pagination-has-no-range-logic]]). The rule fixes how many pages show before the row shortens, an input for any Pagination story at 360 px.
