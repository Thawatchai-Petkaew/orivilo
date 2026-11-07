---
id: K-0181
topic: design
claim: WAI-ARIA 1.2 says an author should mark no more than one element with the main role within any document or application, and that role heading requires aria-level to give the proper nesting level.
source: "https://www.w3.org/TR/wai-aria-1.2/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, from the `main` and `heading` role definitions. Confidence 0.8: the W3C Recommendation, one source.

`main`:

> A landmark containing the main content of a document.
> Within any document or application, the author SHOULD mark no more than one element with the main role.

`heading`:

> A heading for a section of the page.

Under its required properties the tool returned "MUST use the aria-level attribute to indicate the proper nesting level."

## Why it matters for ORIVILO

A component that renders a `main` (K-0172) inside a page that has one goes against this SHOULD unless the caller overrides it. K-0182 gives the HTML rule and K-0183 the rule on which overrides are allowed.
