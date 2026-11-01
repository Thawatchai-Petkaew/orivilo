---
id: K-0131
topic: design
claim: Untitled UI React's components index has no citation, source, reference, footnote, quote, blockquote, popover or hover card entry; the nearest pages are Tooltips (title and description, arrow off, placement top, delay 300, closeDelay 0, opens on hover and focus), Testimonial sections and Content and rich text sections, and neither section page describes a quote, its attribution or any props.
source: "https://www.untitledui.com/react/components; https://www.untitledui.com/react/components/tooltips.md; https://www.untitledui.com/react/marketing/testimonial-sections; https://www.untitledui.com/react/marketing/content-rich-text-sections"
retrieved: 2026-11-01
confidence: 0.75
applies_to: [ORV-211]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.75: an absence, read from one publisher's index; a web search for an Untitled UI citation, quote or sources page returned no `untitledui.com` result. The open-source repo was not listed for this question (its base and application folders are in K-0119).

### Components index

The index lists base components, application UI components, application UI examples, shared page examples, marketing components and marketing examples. The fetch tool, asked for entries named citation, source(s), reference, footnote, quote, blockquote, testimonial, popover or hover card, answered that only "Testimonial sections" (marketing) matches, and none of the others.

### Tooltips (nearest hover content)

> Use `description` to show a second line of text below the `title`
> `arrow` is `false` by default.
> By default the tooltip opens on both hover and focus.

`placement` "defaults to `\"top\"`"; `delay` "defaults to `300`"; `closeDelay` "defaults to `0`"; `trigger` `"focus"` opens on keyboard focus only; `isDisabled` stops it opening. The page does not say whether interactive content may go inside.

### Testimonial and content sections (nearest quote)

> Testimonial sections are great for communicating social proof.
> These content rich text sections are built using React Aria and styled with Tailwind CSS.

Testimonial example names include "Simple centered 01", "Card", "Social cards 01" and "Case study cards"; the page does not say what an item holds. The content sections page shows no blockquote, pull quote, attribution, footnote or citation.

## Why it matters for ORIVILO

ORV-211's benchmark needs an Untitled UI row. There is no component page to read variants, sizes or slots from for either EvidenceSpan or EvidenceList; the row can only record the absence and the tooltip as the nearest hover content (audit B.7 already reads it).
