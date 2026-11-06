---
id: K-0180
topic: design
claim: The WAI-ARIA APG Feed pattern sets aria-busy true on the feed while articles are added or removed and warns that it must return to false when the operation ends or the changes may not become visible to some assistive technology users; the page says nothing about an empty feed or no results.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/feed/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, joined as it returned them. Confidence 0.8: the W3C APG page, one source.

> When `article` elements are being added to or removed from the `feed` container
> the `feed` element has aria-busy set to `true` during the update operation.
> Note that it is extremely important that `aria-busy` is set to `false` when the operation is complete
> or the changes may not become visible to some assistive technology users.

Asked for it, the tool reported that the page says nothing about an empty feed or no results.

## Why it matters for ORIVILO

The page is about a feed, not any region, but it states the risk of a stuck `aria-busy`: K-0113 says assistive technologies may ignore changes while it is true, and this page says what that can cost.
