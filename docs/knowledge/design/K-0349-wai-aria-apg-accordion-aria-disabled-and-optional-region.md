---
id: K-0349
topic: design
claim: The WAI-ARIA APG Accordion pattern sets aria-disabled true on the header button of a visible panel the accordion does not let collapse, makes role region with aria-labelledby on the panel optional, and says to avoid region where it creates landmark proliferation, such as more than approximately 6 panels expanded at the same time.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/accordion/accordion-pattern.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool: the published page and its source in `w3c/aria-practices` (`main`, no commit hash shown). Confidence 0.8: one publisher, page and source agree. Pieces are joined with `...`.

> If the accordion panel associated with an accordion header is visible, and if the accordion does not permit ... the panel to be collapsed, the header button element has aria-disabled set to true.

> Optionally, each element that serves as a container for panel content has role region and aria-labelledby ... with a value that refers to the button that controls display of the panel.

> Avoid using the region role in circumstances that create landmark region proliferation, ... e.g., in an accordion that contains more than approximately 6 panels that can be expanded at the same time.

> Role region is especially helpful to the perception of structure by screen reader users ... when panels contain heading elements or a nested accordion.

## Why it matters for ORIVILO

Radix does the `aria-disabled` part already, and sets `region` on every panel (K-0345). The "approximately 6" figure is the APG's own example, not a measured limit on the page.
