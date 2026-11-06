---
id: K-0225
topic: design
claim: ARIA in HTML maps header to banner only when it is not inside article, aside, main, nav or section, and otherwise to generic, nav to navigation, aside to complementary, and section to region only with an accessible name; WHATWG says not all link groups need nav, and WCAG technique H97 distinguishes repeated nav elements with aria-label or aria-labelledby.
source: "https://www.w3.org/TR/html-aria/; https://html.spec.whatwg.org/multipage/sections.html; https://www.w3.org/WAI/WCAG22/Techniques/html/H97"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. Only the first 100000 characters of the ARIA in HTML page were read; the rows below were all in that part.

ARIA in HTML, implicit roles:

- `header`: "If not a descendant of an article, aside, main, nav or section element", `role=banner`; otherwise `role=generic`. `footer` follows the same form with `role=contentinfo`.
- `nav`: `role=navigation`. `aside`: `role=complementary`. `main`: `role=main`.
- `section`: "role=region if the section element has an accessible name"; otherwise `role=generic`.
- `h1` to `h6`: "role=heading, aria-level = the number in the element's tag name".

WHATWG:

> The header element is not sectioning content; it doesn't introduce a new section.

> Not all groups of links on a page need to be in a nav element

> the element is primarily intended for sections that consist of major navigation blocks.

> a section of a page that consists of content that is tangentially related to the content around the aside element

H97:

> When the `nav` element is employed more than once on a page, distinguish the navigation groups

The page goes on to name "an `aria-labelledby` or `aria-label` attribute."

## Why it matters for ORIVILO

A Page header's `header` inside `main` is not a banner by this table, so it adds no landmark. A sidebar in an `aside` is a complementary landmark by default, which K-0224 reads as supporting content, so a side navigation's landmark is a question for the designer.
