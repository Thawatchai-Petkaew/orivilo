---
id: K-0228
topic: design
claim: The WAI-ARIA APG Breadcrumb pattern puts the trail in a navigation landmark labelled by aria-label or aria-labelledby, sets aria-current page on a link to the current page, makes aria-current optional when the current page is not a link, and has no keyboard interaction of its own.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

> A breadcrumb trail consists of a list of links to the parent pages of the current page in hierarchical order.

> Breadcrumb trail is contained within a navigation landmark region.

> The landmark region is labelled via aria-label or aria-labelledby.

> The link to the current page has aria-current set to `page`.

> If the element representing the current page is not a link, aria-current is optional.

Keyboard Interaction: "Not applicable."

## Why it matters for ORIVILO

A breadcrumb in a Page header is one more `nav` on the page, so it joins the unique-label rule (K-0224) and the count of landmarks.
