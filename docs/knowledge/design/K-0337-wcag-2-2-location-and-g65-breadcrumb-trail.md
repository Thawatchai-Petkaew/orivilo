---
id: K-0337
topic: design
claim: WCAG 2.2 technique G65 (Providing a breadcrumb trail) lists one related criterion, SC 2.4.8 Location at Level AAA, as sufficient, and it tests two forms of the current location, not a link, or a link identified programmatically such as with aria-current.
source: "https://www.w3.org/WAI/WCAG22/Understanding/location.html; https://www.w3.org/WAI/WCAG22/Techniques/general/G65"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The first read of G65 returned only one branch of the test, so the procedure was fetched again step by step; the steps below are from that second read.

### SC 2.4.8 Location (Level AAA)

> Information about the user's location within a set of web pages is available.

Sufficient techniques listed: G65, G63 (site map), G128 (current location in navigation bars), ARIA26, G127. The Intent and Benefits sections do not mention breadcrumbs; the In Brief summary says "Use breadcrumbs, site maps, or other indicators to give context."

### G65: Providing a breadcrumb trail

> It can be helpful to users to separate the items in the breadcrumb trailing with a visible separator.

Test procedure, steps 5 and 6:

> For a breadcrumb trail that does include the current location:
> Check that all elements except for the current location are implemented as links.
> Check that the current location is not implemented as a link.
> For a breadcrumb trail that does include the current location and it behaves as a link:
> Check that all elements are implemented as links.
> Check that the current location is programmatically identified as such (e.g., using the aria-current attribute).

- Step 4 covers a trail that leaves out the current location: every element is a link.
- Example 1 says the current location is "not implemented as a link to visually and semantically differentiate it."
- G65 applies to all technologies and is listed as sufficient for 2.4.8.
- A word search of G65 found no hit for collapse, collapsed, truncate, truncated, ellipsis, shorten, long trail, overflow or wrap. A word search of the Location page found no hit for collapse, truncate, ellipsis, shorten, overflow or pagination.

## Why it matters for ORIVILO

The page's first read looked like a conflict with the APG; the full test is not one, because step 6 accepts the APG form. A breadcrumb is one sufficient route to an AAA criterion, so these sources do not make a breadcrumb itself a requirement.
