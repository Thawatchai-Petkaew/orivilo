---
id: K-0328
topic: design
claim: Untitled UI Pagination labels its nav Pagination Navigation, gives each page aria-current page and the name Page N, hides the ellipsis and disables Previous and Next at the ends, and renders pages as buttons with role listitem and no list or href.
source: "https://www.untitledui.com/react/components/pagination.md; https://raw.githubusercontent.com/untitleduico/react/main/components/application/pagination/pagination-base.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/pagination/pagination.tsx; https://www.w3.org/TR/wai-aria-1.2/#listitem; https://www.w3.org/TR/html-aria/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

### Page

> The `<nav>` label is hardcoded on `Pagination.Root`, so change it by editing the component.

> Each page button gets `aria-current="page"` when it is the current page

> the previous and next triggers are labelled `"Previous Page"` and `"Next Page"`

> are automatically disabled on the first and last page

> it doesn't use `Pagination.Root` and renders its own `<nav aria-label="Pagination">`

The last quote is about `PaginationCardMinimal`. The page also states that the ellipsis is `aria-hidden`, that a page button has "an aria-label of "Page {value}"", and that `Pagination.NextTrigger` and its siblings take an `ariaLabel` prop.

### Source

- `pagination-base.tsx`: `<nav aria-label="Pagination Navigation" ...>`; ``aria-label={ariaLabel || `Page ${value}`}``; `const isDisabled = direction === "prev" ? currentPage <= 1 : currentPage >= total;`.
- The default item is a `<button>` with `role="listitem"`. It takes no `href`. `pagination-base.tsx` and `pagination.tsx` render no `<ul>`, `<ol>`, `role="list"` or `<li>`.
- The ellipsis is a `<span aria-hidden="true">` with no default text.
- `pagination.tsx` adds `aria-label="Go to previous page"` and `"Go to next page"` on the mobile buttons, so one set of triggers reads differently from the other.

### What the standards say about that markup

- WAI-ARIA 1.2, `listitem`: "Authors MUST ensure elements whose role is `listitem` are contained in, or owned by, an element whose role is `list`."
- ARIA in HTML, `button`: implicit `role=button`; the allowed roles listed do not include `listitem`.

By our reading, the default item breaks both lines and is no longer exposed as a button. Neither page names this component. The `asChild` and render-function forms avoid that default markup.

## Why it matters for ORIVILO

The names and end-state behaviour are direct inputs for the Pagination spec. The item markup is the part the sources argue against, so it is recorded with the two lines that do.
