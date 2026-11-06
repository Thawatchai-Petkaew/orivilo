---
id: K-0334
topic: design
claim: The APG Breadcrumb example uses a nav labelled Breadcrumb around an ordered list, sets aria-current page on the last link, adds the visual separators through CSS so they are not announced, and needs no keyboard handling.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/examples/breadcrumb/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returned these lines as quotes. The example's HTML and `breadcrumb.css` were not in the fetched text, so the markup is known from the page's words only.

> The set of links is structured using an ordered list.

> To prevent screen reader announcement of the visual separators between links, they are added via CSS:

> No keyboard interaction needed.

- `aria-label=Breadcrumb` on `nav`: "Provides a label that describes the type of navigation provided in the `nav` element."
- `aria-current=page` on `a`: "Applied to the last link in the set to indicate that it represents the current page."

## Why it matters for ORIVILO

This is the worked form of the pattern: the last crumb stays a real link, and separators stay out of the accessibility tree without any ARIA attribute on them.
