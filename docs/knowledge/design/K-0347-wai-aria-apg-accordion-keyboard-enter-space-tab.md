---
id: K-0347
topic: design
claim: The WAI-ARIA APG Accordion pattern lists Enter or Space (expand a collapsed panel; collapse an expanded one if the implementation supports collapsing), Tab and Shift + Tab through the page Tab sequence; it names no arrow, Home or End key, and neither the word orientation nor animation appears on the page.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/accordion/accordion-pattern.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool: the published page and its source in `w3c/aria-practices` (`main`, no commit hash shown). Confidence 0.8: one publisher, page and source agree.

> An accordion is a vertically stacked set of interactive headings that each contain a title

(The sentence goes on; the fetch tool cut it at its quote limit.)

### Enter or Space

> When focus is on the accordion header for a collapsed panel, expands the associated panel.
> If the implementation allows only one panel to be expanded, and if another panel is expanded, collapses that panel.
> When focus is on the accordion header for an expanded panel, collapses the panel
> if the implementation supports collapsing.
> Some implementations require one panel to be expanded at all times and allow only one panel to be expanded;
> so, they do not support a collapse function.

### Tab and Shift + Tab

> Tab: Moves focus to the next focusable element;
> all focusable elements in the accordion are included in the page Tab sequence.
> Shift + Tab: Moves focus to the previous focusable element;

Asked directly, the fetch tool found no Up Arrow, Down Arrow, Home or End in the Keyboard Interaction section, and neither "orientation", "horizontal" nor "animation" on the page.

## Why it matters for ORIVILO

This is the floor the APG sets for an accordion's keys. Radix adds keys beyond it (K-0344); the page does not say whether those are wanted or not.
