---
id: K-0123
topic: design
claim: The WAI-ARIA APG Disclosure pattern makes the control an element with role button whose aria-expanded is true when the content shows and false when hidden, optionally with aria-controls naming the content, and Enter and Space both toggle it; the pattern page says nothing about animation.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-203]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: one W3C page, read twice.

> A disclosure is a widget that enables content to be either collapsed (hidden) or expanded (visible).

Keyboard Interaction:

> Enter: activates the disclosure control and toggles the visibility of the disclosure content.
> Space: activates the disclosure control and toggles the visibility of the disclosure content.

WAI-ARIA Roles, States, and Properties:

> The element that shows and hides the content has role button.
> When the content is visible, the element with role `button` has aria-expanded set to `true`.
> When the content area is hidden, it is set to `false`.
> Optionally, the element with role `button` has a value specified for aria-controls ... that refers to the element that contains all the content that is shown or hidden.

Examples listed: image description, answers to frequently asked questions, navigation menu, navigation menu with top-level links, card. The page does not mention animation.

## Why it matters for ORIVILO

This is the contract the Collapsible's trigger answers to; Radix states it adheres to it (K-0121) and its source wires it (K-0122). The pattern names no visual state, so open and closed looks are ORIVILO's own.
