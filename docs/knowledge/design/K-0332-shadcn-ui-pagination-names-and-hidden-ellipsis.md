---
id: K-0332
topic: design
claim: shadcn/ui Pagination sets role navigation and aria-label pagination on its nav, aria-current page on the active link, and the names Go to previous page and Go to next page, all overridable, and puts sr-only More pages inside an aria-hidden ellipsis.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/pagination.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/pagination.tsx; https://www.w3.org/TR/html-aria/; https://www.w3.org/TR/wai-aria-1.2/#aria-hidden"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. Both registry files list these lines.

```tsx
role="navigation"
aria-label="pagination"
aria-current={isActive ? "page" : undefined}
aria-label="Go to previous page"
aria-label="Go to next page"
```

- `{...props}` follows `aria-label` on `Pagination`, `PaginationPrevious` and `PaginationNext`, so a caller can replace each name.
- `PaginationEllipsis` is `aria-hidden` and holds `<span className="sr-only">More pages</span>`.
- The visible word in Previous and Next is plain text, so the `aria-label` is what a screen reader gets, and the two do not match word for word.

### Standards lines

- ARIA in HTML, `nav`: implicit `role=navigation`. Setting it again is "also allowed, but NOT RECOMMENDED".
- WAI-ARIA 1.2, `aria-hidden`, value true: "The element is hidden from the accessibility API."

By our reading, the sr-only "More pages" is hidden with its parent, so the span adds nothing for assistive tech. That sentence is ours; no page read states it for this component.

## Why it matters for ORIVILO

The name set is a working example to compare with Untitled's. Every string here is hard-coded English in the file, while ORIVILO keeps every string in the locale catalog.
