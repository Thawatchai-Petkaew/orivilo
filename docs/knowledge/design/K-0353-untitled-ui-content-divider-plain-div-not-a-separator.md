---
id: K-0353
topic: design
claim: Untitled UI's Content divider page says the divider renders a plain div with decorative rules and is not exposed to assistive technology as a separator, tells the author to put a real heading element inside when it opens a new section, and to give any icon-only button in it an aria-label.
source: "https://www.untitledui.com/react/components/content-dividers.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.8: one page, quoted from its FAQ "How do I keep a content divider accessible?"; no code read (K-0368).

> The divider renders a plain `div` and its rules are decorative

> it is not exposed to assistive technology as a separator.

> If it introduces a new section, put a real heading element inside it,

> give any icon-only button in the divider an `aria-label`.

## Why it matters for ORIVILO

This is a stated stance, not a gap: a labelled divider leaves separator semantics out and leans on a heading. By our reading, a child would not be exposed inside `role="separator"` anyway (K-0358).
