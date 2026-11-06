---
id: K-0326
topic: design
claim: Untitled UI React Pagination ships six composed forms plus dot and line indicators, controlled by page, total and onPageChange, with rounded and align options, a rows-per-page Select of 10, 25, 50 and 100, a page input and first and last jumps, and no size prop on the number forms.
source: "https://www.untitledui.com/react/components/pagination.md; https://raw.githubusercontent.com/untitleduico/react/main/components/application/pagination/pagination.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/pagination/pagination-base.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The page's API reference is a slug placeholder, so the props table was not read; the source file filled the gaps named here.

> and render a `Select` with 10, 25, 50 and 100 options

> renders an editable page number input and first/last page jump buttons

> The `rounded` prop, which switches the number buttons from `rounded-lg` to `rounded-full`

> fall back to page = 1 and total = 10 when you omit them

### Forms

- `pagination.tsx` exports `PaginationPageDefault`, `PaginationPageMinimalCenter`, `PaginationCardDefault`, `PaginationCardMinimal`, `PaginationButtonGroup`, `PaginationCardAdvanced`.
- `Pagination` in `pagination-base.tsx` exports Root, PrevTrigger, NextTrigger, Item, Ellipsis and Context. Root props: `page`, `total`, `siblingCount?`, `onPageChange?`, `children`, `style?`, `className?`.
- `Pagination.Item` takes `asChild` and a render function as `children`.

### Options

- `align` on `PaginationCardMinimal` and `PaginationButtonGroup`: left (default), center, right. On `PaginationCardAdvanced`: space-between (default), center.
- `rounded` applies to `PaginationPageDefault`, `PaginationPageMinimalCenter` and `PaginationCardDefault`.
- `pageSize` (default 10) and `onPageSizeChange` on `PaginationCardMinimal` and `PaginationCardAdvanced`. Their selects are named `aria-label="Page Size"`.
- For a router, the page says to read the page from "a URL search param, for example" and push a new URL in `onPageChange`, with `total` as `Math.ceil(totalItems / pageSize)`.

### Small screens (source only; the page says nothing on mobile)

- `MobilePagination` is `flex items-center justify-between md:hidden`, with Previous and Next around `Page {page} of {total}`. The number row is `hidden justify-center gap-0.5 md:flex`.

### Controls as read in `pagination.tsx`

- The page input in `PaginationCardAdvanced`: `onChange={(event) => onPageChange?.(Number(event.target.value))}`, `aria-label="Page"`. It has no `onKeyDown`, `onBlur` or Enter handling, so it commits on every change.
- The first and last jump buttons (`ChevronLeftDouble`, `ChevronRightDouble`) have no `aria-label` in the file.
- Selected number: `isSelected && "bg-primary_hover text-secondary"`.

### Not on the page

A size prop on the number forms, a disabled page, a loading state and keyboard interaction.

## Why it matters for ORIVILO

This fills the variants, slots and states cells for page navigation. The small-screen form and the two control details come from code, so they are the facts the Untitled page alone would have missed.
