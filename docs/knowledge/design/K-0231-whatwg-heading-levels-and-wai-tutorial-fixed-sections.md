---
id: K-0231
topic: design
claim: The WHATWG HTML outline rule says a heading must be at most one level deeper than the heading before it and that a document with headings should have a heading of level 1; the W3C WAI tutorial says skipping ranks should be avoided where possible, is allowed when closing subsections, and that headings in fixed sections such as sidebars keep their ranks whatever the content area uses.
source: "https://html.spec.whatwg.org/multipage/sections.html; https://www.w3.org/WAI/tutorials/page-structure/headings/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

WHATWG, section 4.3.11 Headings and outlines:

> If a document has one or more headings, at least a single heading within the outline should have a heading level of 1.

> Each heading following another heading lead in the outline must have a heading level that is less than, equal to, or 1 greater than lead's heading level.

> The following example is non-conforming:

The example is an `<h1>Apples</h1>` followed by a `<section>` with `<h3>Taste</h3>`; the corrected version uses `<h2>Taste</h2>`.

WAI tutorial, Headings:

> Skipping heading ranks can be confusing and should be avoided where possible.

> It is ok to skip ranks when closing subsections.

> the heading ranks should not change depending on the ranks in the content area.

The last quote is about sidebars and other fixed sections. The tutorial does not state a one h1 per page rule; its examples each show one.

## Why it matters for ORIVILO

An h2 Section header straight under an h1 Page header meets this rule, and a Section header at a fixed h2 under another h2 meets it too. A fixed heading rank in a sidebar is the case the tutorial names, and neither library's group label is a heading (K-0205, K-0216).
