---
id: K-0133
topic: design
claim: The WAI-ARIA APG lists 30 patterns with no popover, non-modal dialog, hover card, citation or footnote among them; Dialog (Modal) mentions non-modal dialogs only to contrast them and sets focus inside on open and back on the invoker on close; the Tooltip pattern, marked work in progress, says tooltips "do not receive focus", Escape dismisses them, and "A hover that contains focusable elements can be made using a non-modal dialog."
source: "https://www.w3.org/WAI/ARIA/apg/patterns/; https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/; https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-211]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: three pages of one W3C guide. The count of 30 is from the patterns index as the fetch tool listed it (Accordion to Window Splitter).

### Patterns index

No pattern is named popover, non-modal dialog, citation, footnote or hover card. The only dialog patterns are "Dialog (Modal)" and "Alert and Message Dialogs".

### Dialog (Modal)

> Like non-modal dialogs, modal dialogs contain their tab sequence.
> When a dialog opens, focus moves to an element contained in the dialog.
> When a dialog closes, focus returns to the element that invoked the dialog unless either:

It also says "unlike most non-modal dialogs, modal dialogs do not provide means for moving keyboard focus outside the dialog window without closing the dialog." Roles: `role` dialog, `aria-modal` true, `aria-labelledby` to "a visible dialog title", optional `aria-describedby`. Escape "Closes the dialog."

### Tooltip

> This design pattern is work in progress; it does not yet have task force consensus.
> Tooltip widgets do not receive focus.
> A hover that contains focusable elements can be made using a non-modal dialog.

"Escape: Dismisses the Tooltip." The tooltip container "has role tooltip" and its trigger "references the tooltip element with aria-describedby."

## Why it matters for ORIVILO

There is no APG pattern for the card a citation pill opens. A card with a link or arrows in it is not a tooltip by this guide; the guide points to a non-modal dialog, which is what Radix Popover is when `modal` is false (K-0130).
