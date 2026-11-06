---
id: K-0348
topic: design
claim: The WAI-ARIA APG Accordion pattern puts each header title in a button that is the only element inside a heading whose aria-level suits the page's information architecture (a native heading tag may be used), sets aria-expanded true while the panel is visible and false while not, and sets aria-controls to the ID of the panel content.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/accordion/accordion-pattern.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool: the published page and its source in `w3c/aria-practices` (`main`, no commit hash shown). Confidence 0.8: one publisher, page and source agree. The source's text was returned in pieces; they are joined here with `...` where a piece ended.

> The title of each accordion header is contained in an element with role button.

> Each accordion header button is wrapped in an element with role heading that has a value set for aria-level ... that is appropriate for the information architecture of the page.

> If the native host language has an element with an implicit heading and aria-level, ... such as an HTML heading tag, a native host language element may be used.

> The button element is the only element inside the heading element. ... That is, if there are other visually persistent elements, they are not included inside the heading element.

> If the accordion panel associated with an accordion header is visible, the header button element ... has aria-expanded set to true. ... If the panel is not visible, aria-expanded is set to false.

> The accordion header button element has aria-controls set to the ID of the element ... containing the accordion panel content.

## Why it matters for ORIVILO

Unlike the Disclosure pattern, where `aria-controls` is optional (K-0123), this bullet has no "optional" word. Radix keeps `aria-controls` only while open (K-0122, K-0345), so a closed header on Radix has none; whether that matters is for the designer and QA.
