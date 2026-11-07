---
id: K-0333
topic: design
claim: The WAI-ARIA APG Breadcrumb pattern puts the trail in a labelled navigation landmark, sets aria-current page on a link to the current page, makes aria-current optional when the current page is not a link, and lists keyboard interaction as not applicable.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returned these lines as quotes.

> A breadcrumb trail consists of a list of links to the parent pages of the current page in hierarchical order.

> Breadcrumb trail is contained within a navigation landmark region.

> The landmark region is labelled via aria-label or aria-labelledby.

> The link to the current page has aria-current set to `page`.

> If the element representing the current page is not a link, aria-current is optional.

Keyboard Interaction reads "Not applicable." The pattern also says breadcrumbs "are often placed horizontally before a page's main content." A word search of the page found no hit for collapse, collapsed, truncate, ellipsis, shorten, overflow, wrap or long.

## Why it matters for ORIVILO

ORV-64 audit D.3 row 26 asks that the current page be marked `aria-current`. The pattern requires that for a link and leaves it optional for a non-link, so the wording of the acceptance criterion depends on which form is chosen.
