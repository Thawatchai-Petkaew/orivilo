---
id: K-0362
topic: design
claim: Untitled UI's Metrics page has no text on loading, empty or skeleton states, no size prop for a card, and no accessibility, screen reader or keyboard notes; the word aria appears only in the library name React Aria, and the API reference is a placeholder.
source: "https://www.untitledui.com/react/components/metrics.md; DESIGN.md"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.75: an absence on one page, by word search of the `.md` text; the API table and demo code were not visible, so the card code may still handle these.

> built using React Aria and styled with Tailwind CSS.

Word check by the fetch tool: "loading", "empty", "skeleton", "screen reader", "accessible" and "keyboard" not found. Its FAQ has seven questions, on variants, positive or negative change, indicator styles, a link under a card, chart data, the icon, and hiding the actions dropdown; none is on states or accessibility. The only size named is the footer button's `sm`.

## Why it matters for ORIVILO

DESIGN.md section 7 expects every state that applies to have a story, so a Metric's states cannot be read off this page. The states row stays empty here.
