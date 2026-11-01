---
id: K-0132
topic: design
claim: Of the APG patterns a button that opens a panel can follow, Disclosure gives role button, aria-expanded true or false, optional aria-controls, and Enter and Space to toggle, and says nothing of Escape or focus moving in; Button gives Space and Enter, an accessible label, focus moving inside when the button opens a dialog and back when it closes, names aria-haspopup only for a menu button, and the ellipsis as the convention for a button that opens a dialog.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/; https://www.w3.org/WAI/ARIA/apg/patterns/button/"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-211]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: two W3C pages of one guide. The Disclosure page was also read for K-0123.

### Disclosure (Show/Hide)

> Enter: activates the disclosure control and toggles the visibility of the disclosure content.
> Space: activates the disclosure control and toggles the visibility of the disclosure content.
> The element that shows and hides the content has role button.
> When the content is visible, the element with role button has aria-expanded set to true.
> Optionally, the element with role button has a value specified for aria-controls

The page does not mention popovers, `aria-haspopup`, Escape, or focus moving into the content.

### Button

> If activating the button opens a dialog, the focus moves inside the dialog.
> The button has an accessible label.
> However, it can also be provided with aria-labelledby or aria-label.
> If the button is a toggle button, it has an aria-pressed state.
> A common convention for informing users that a button launches a dialog is to append "…" (ellipsis) to the button label.

On closing: "If activating the button closes a dialog, focus typically returns to the button that opened the dialog". On `aria-haspopup`, the page names only the menu button: "a button is revealed to assistive technologies as a menu button if it has the property aria-haspopup" "set to either menu or true." It does not mention `aria-expanded`.

## Why it matters for ORIVILO

A pill that opens a card is a button by both patterns. Which one applies turns on whether the card is a dialog that focus moves into (Button, and K-0130's Radix wiring) or content shown in place (Disclosure, the EvidenceList case).
