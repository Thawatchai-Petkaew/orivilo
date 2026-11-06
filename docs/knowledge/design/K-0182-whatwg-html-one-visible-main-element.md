---
id: K-0182
topic: design
claim: The WHATWG HTML Standard says a document must not have more than one main element without the hidden attribute, and that each main element must be hierarchically correct, its ancestors limited to html, body, div, form without an accessible name, and autonomous custom elements.
source: "https://html.spec.whatwg.org/multipage/grouping-content.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes. Confidence 0.8: the HTML Living Standard, one source. Two fetches returned the second sentence in overlapping halves; it is joined below at the words they share.

> A document must not have more than one main element that does not have the hidden attribute specified.
> A hierarchically correct main element is one whose ancestor elements are limited to html, body, div, form without an accessible name, and autonomous custom elements.
> Each main element must be a hierarchically correct main element.

## Why it matters for ORIVILO

This rule counts the element, not its role. By our reading, `<main role="presentation">` inside a page's `main` stays a second `main` element and is not hierarchically correct, so the override in K-0172 changes what is exposed but not this count.
