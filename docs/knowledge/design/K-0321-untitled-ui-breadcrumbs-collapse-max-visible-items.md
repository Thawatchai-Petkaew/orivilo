---
id: K-0321
topic: design
claim: Untitled UI Breadcrumbs collapses a long trail by itself through maxVisibleItems (default 4) into a clickable ellipsis that expands the full trail, 0 turns collapsing off, and the page does not say which crumbs stay visible.
source: "https://www.untitledui.com/react/components/breadcrumbs.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

> `Breadcrumbs` collapses automatically via the `maxVisibleItems` prop, which defaults to `4`.

> passing `maxVisibleItems={0}` disables collapsing entirely.

> a clickable ellipsis item that expands the full trail

> the collapse toggle is labeled "See all breadcrumb items".

- The ellipsis expands the trail in place; the page names no menu, popover or list for the hidden crumbs.
- Not on the page: which crumbs stay when the trail collapses (first, last, how many of each), whether the trail can collapse again after it expands, and any rule tied to viewport width.
- The code was not read: no breadcrumbs component file is in the open repo tree ([[K-0322-untitled-ui-breadcrumbs-accessibility-and-no-open-source]]), so the kept crumbs stay unknown.

## Why it matters for ORIVILO

ORV-64 audit D.3 row 26 asks for a collapsed trail story. This entry gives one of the two collapse models read: a count prop, with an expand in place, and it marks where that model is unspecified.
