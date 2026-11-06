---
id: K-0358
topic: design
claim: WAI-ARIA 1.2 gives separator an implicit aria-orientation of horizontal, defines aria-orientation with values horizontal, vertical and undefined (default, unknown or ambiguous), and marks separator Children Presentational True, under which user agents should not expose the element's descendants.
source: "https://www.w3.org/TR/wai-aria-1.2/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, in three passes over the page text (offsets 30000, 230000 and 380000). Confidence 0.8: one normative source, quoted.

> Elements with the role separator have an implicit aria-orientation value of horizontal.

> Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous.

- horizontal: "The element is oriented horizontally."
- undefined (default): "The element's orientation is unknown/ambiguous."
- vertical: "The element is oriented vertically."

`aria-orientation` "Used in Roles", as the fetch tool gave it, includes `scrollbar`, `select`, `separator`, `slider`, `tablist` and `toolbar`; that list was read from a late chunk and may not be whole.

The separator's characteristics table lists Children Presentational as True. Section 5.2.9:

> The DOM descendants are presentational.

> User agents SHOULD NOT expose descendants of this element through the platform accessibility API.

## Why it matters for ORIVILO

By our reading, a text label or a button placed inside an element with `role="separator"` is not exposed, so a labelled divider cannot be one (K-0353 keeps a plain `div` for its own reason). A vertical line needs `aria-orientation="vertical"`, which Radix writes (K-0356).
