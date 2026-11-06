---
id: K-0329
topic: design
claim: Untitled UI calls PaginationDot and PaginationLine carousel-style indicators; they take size md or lg (default md) and a framed flag, set no aria attribute of their own and show the current page by a brand-token fill on the dot.
source: "https://www.untitledui.com/react/components/pagination.md; https://raw.githubusercontent.com/untitleduico/react/main/components/application/pagination/pagination-dot.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/pagination/pagination-line.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/pagination/pagination-base.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

> both of which take a size of "md" or "lg" (default "md")

> and a `framed` flag for the translucent pill background

### `pagination-dot.tsx`

- Sizes: md button `h-2 w-2 after:-inset-x-1.5 after:-inset-y-2`, lg button `h-2.5 w-2.5 after:-inset-x-2 after:-inset-y-3`. The `after` insets widen the hit area past the visible dot.
- Base classes: `relative cursor-pointer rounded-full bg-quaternary outline-focus-ring`. Current page adds `bg-fg-brand-primary_alt`.
- With `isBrand`, dots that are not current take `bg-fg-brand-secondary`, and the current dot takes `bg-fg-white`.

### `pagination-line.tsx`

- `sizes` has `md` and `lg` entries; a button is styled `h-1.5 w-full after:-inset-x-1.5 after:-inset-y-2`.

### Both files

- No `aria-*`, `role` or label is set in either file. The root receives `{...props}`.
- Each page is a `Pagination.Item` with `asChild`, so names come from `pagination-base.tsx`.
- `pagination-base.tsx` clones only when `asChild && isValidElement(children)`, and falls back to the `<button role="listitem">` of [[K-0328-untitled-ui-pagination-names-and-button-items]] otherwise. The dot file as read passes no child element, so by our reading its items take that fallback. The line file's child was not quoted.

### What they are for

> Two carousel-style indicators live in their own files: `PaginationDot` and `PaginationLine`

A word search of the page found no slide, gallery or onboarding use beyond that phrase.

## Why it matters for ORIVILO

The page files these two as carousel indicators, not as page navigation for a list. They show no visible number, and the brand fill on the current dot is the fact the benchmark checks against DESIGN.md sections 7 and 8.
