---
id: K-0403
topic: design
claim: The APG Modal Dialog pattern, under which the date picker example sits, wraps Tab inside the dialog, closes on Escape, moves focus in on open and back to the invoking element on close, requires role dialog with aria-modal true and a label, and warns to mark a dialog modal only when code blocks all outside interaction and styling obscures the content.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, which returned short quotes. The page names two examples: Modal Dialog Example and Date Picker Dialog Example (K-0400).

> Moves focus to the next tabbable element inside the dialog.

> Closes the dialog.

(Tab, wrapping from last to first, and Escape.)

> When a dialog opens, focus moves to an element contained in the dialog.

> When a dialog closes, focus returns to the element that invoked the dialog

(The second holds unless the invoking element no longer exists or the workflow calls for a different target.)

> The element that serves as the dialog container has a role of dialog.

> The dialog container element has aria-modal set to true.

The page warns to mark a dialog modal only when application code blocks all interaction outside it and visual styling obscures that content. A label comes from `aria-labelledby`, which "refers to a visible dialog title", or `aria-label`. The page strongly recommends a visible element with role `button` that closes the dialog.

## Why it matters for ORIVILO

Our Popover is non-modal by default (K-0130), and the APG lists no non-modal dialog pattern (K-0133). A picker in a Popover therefore differs from the APG example on `aria-modal`, Tab wrapping and outside interaction, which the design has to state.
