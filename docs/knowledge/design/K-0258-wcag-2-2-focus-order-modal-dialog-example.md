---
id: K-0258
topic: design
claim: WCAG 2.2 SC 2.4.3 Focus Order (Level A) needs focus order that preserves meaning and operability, and its Understanding page's modal dialog example sets focus within the dialog on open, makes outside content inert, and returns focus on dismiss to the button or the element following it; it does not name which element inside takes focus first.
source: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces; lines joined below are consecutive pieces of one sentence.

> If a web page can be navigated sequentially and the navigation sequences affect meaning or operation,
> focusable components receive focus in an order that preserves meaning and operability.

> When the trigger button is activated, a dialog opens and focus is set within the dialog.

> As long as the dialog is open, all web page content outside the dialog becomes inert and cannot receive focus

> When the dialog is dismissed, focus returns to the button or the element following the button.

The page also lists H102 (the HTML dialog element) as a sufficient technique and F85 (dialogs not adjacent to their trigger in the navigation order) as a failure.

## Why it matters for ORIVILO

WCAG sets the outer rule, focus in on open and back on close. The choice of the safe action as first focus comes from the APG notes (K-0252), not from WCAG.
