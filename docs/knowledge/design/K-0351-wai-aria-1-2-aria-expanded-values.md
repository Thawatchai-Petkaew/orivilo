---
id: K-0351
topic: design
claim: WAI-ARIA 1.2 defines aria-expanded as whether a grouping element owned or controlled by this element is expanded or collapsed, with false (collapsed), true (expanded) and undefined as the default (the element owns or controls no expandable grouping element).
source: "https://www.w3.org/TR/wai-aria-1.2/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, characters 330000 to 430000 of the page text. Confidence 0.8: one normative source, quoted.

> Indicates whether a grouping element owned or controlled by this element is expanded or collapsed.

- false: "The grouping element this element owns or controls is collapsed."
- true: "The grouping element this element owns or controls is expanded."
- undefined (default): "The element does not own or control a grouping element that is expandable."

## Why it matters for ORIVILO

By our reading, a header button takes true or false and is never left without the attribute, since it always controls a panel. The APG pattern sets both values (K-0348), and Radix writes `context.open || false` (K-0122).
