---
id: K-0250
topic: design
claim: WAI-ARIA 1.2 defines alertdialog as a dialog that contains an alert message where initial focus goes to an element within it, with superclass roles alert and dialog and an accessible name required; authors SHOULD make it modal, SHOULD set focus to an active element within it such as a form control or confirmation button, and SHOULD use aria-describedby to reference the alert message.
source: "https://www.w3.org/TR/wai-aria-1.2/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces; lines joined below are consecutive pieces of one sentence.

> A type of dialog that contains an alert message, where initial focus goes to an element within the dialog.

> The alertdialog role goes on the node containing both the alert message and the rest of the dialog.

> Content authors SHOULD make alert dialogs modal by ensuring that, while the alertdialog is shown,
> keyboard and mouse interactions only operate within the dialog.

> When the alert dialog is displayed, authors SHOULD set focus to an active element within the alert dialog,
> such as a form control or confirmation button.

> Authors SHOULD use aria-describedby on an alertdialog to reference the alert message element in the dialog.

> Unlike alert, alertdialog can receive a response from the user.

Characteristics: Superclass Role alert and dialog; Name From author; Accessible Name Required True.

## Why it matters for ORIVILO

This is the normative text for the role. Its example of a focus target names a "confirmation button", while the APG advises the least destructive action for an irreversible step (K-0252, K-0253); K-0259 records the two side by side.
