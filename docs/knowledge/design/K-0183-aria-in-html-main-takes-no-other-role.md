---
id: K-0183
topic: design
claim: ARIA in HTML (W3C Recommendation, 11 August 2026) allows no role on main other than main, allows heading on h1 to h6 but marks it not recommended, exposes header as banner and footer as contentinfo when they are not inside an article, aside, main, nav or section, and says authors must not use role or aria attributes in a way that conflicts with its tables.
source: "https://www.w3.org/TR/html-aria/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, from the first 100000 of the page's 172302 characters as the tool counted them; the rest was not read. Confidence 0.8: the W3C Recommendation, one source.

Author requirement:

> Authors _MUST NOT_ use the ARIA `role` and `aria-*` attributes in a manner that conflicts with the semantics described in the

The tool cut that sentence there; it goes on to reference the tables of section 4.

Rows of the table:

- `main`: implicit "`role=main`"; allowed "No `role` other than `main`, which is _NOT RECOMMENDED_."
- `h1` to `h6`: implicit "`role=heading`, `aria-level` = the number in the element's tag name"; allowed "Roles: none, presentation or tab. (heading is also allowed, but NOT RECOMMENDED.)"
- `header`: "If not a descendant of an article, aside, main, nav or section element" then "role=banner". The tool summarised the other case as `generic`.
- `footer`: "If not a descendant of an article, aside, main, nav or section element" then "role=contentinfo". The tool summarised the other case as `generic`.

## Why it matters for ORIVILO

By our reading, Untitled UI's two overrides (K-0172) fare differently here: `role="heading"` on its `h1` is allowed but not recommended, while `role="presentation"` on its `main` is not on the allowed list. Its `header` and `footer` sit beside its `main`, so outside any sectioning parent they would be exposed as banner and contentinfo landmarks.
