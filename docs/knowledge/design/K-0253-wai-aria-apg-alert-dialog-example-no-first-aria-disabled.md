---
id: K-0253
topic: design
claim: The APG Alert Dialog Example asks "Are you sure you want to discard all of your notes?", names the dialog from its heading, references the prompt through aria-describedby, sets first focus on the No button because it is the least destructive action and Discard cannot be undone, closes on No or Escape, and uses aria-disabled instead of the disabled attribute so disabled buttons stay in the Tab sequence.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/examples/alertdialog/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces; lines joined below are consecutive pieces of one sentence.

> Focus is automatically set to the first focusable element inside the dialog, which is the "No" `button`.

> This is the least destructive action, so focusing "No" helps prevent users from accidentally confirming
> the destructive "Discard" action, which cannot be undone.

> When the buttons are disabled, `aria-disabled` is used instead of the HTML `disabled` attribute
> so the buttons will remain in the page Tab sequence.

> Activating the "no" button or pressing escape closes the dialog.

The `aria-disabled` sentence does not speak of a pending state. As read, the example has no pending or failure step inside the dialog; a successful save raises a short alert.

## Why it matters for ORIVILO

It is the W3C's worked confirm: the safe button sits first in the DOM and is the first focus. The same placement is what our Dialog relies on (K-0249).
