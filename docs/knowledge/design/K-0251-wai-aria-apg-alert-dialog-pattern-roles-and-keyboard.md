---
id: K-0251
topic: design
claim: The WAI-ARIA APG Alert Dialog pattern is a modal dialog that interrupts the user's workflow to communicate an important message and acquire a response, with action confirmation prompts and error message confirmations as examples; the container has role alertdialog and aria-modal true, a name through aria-labelledby when there is a visible title, and aria-describedby on the alert message, and its keyboard section points to the modal dialog pattern.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces; lines joined below are consecutive pieces of one sentence.

> An alert dialog is a modal dialog that interrupts the user's workflow to communicate an important message
> and acquire a response.

> Examples include action confirmation prompts and error message confirmations.

> The alertdialog role enables assistive technologies and browsers to distinguish alert dialogs from other dialogs
> so they have the option of giving alert dialogs special treatment, such as playing a system alert sound.

> The dialog container element has aria-modal set to true.

> The element with role alertdialog has a value set for aria-describedby that refers to the element
> containing the alert message.

> See the keyboard interaction section for the modal dialog pattern.

The page has no note on initial focus of its own.

## Why it matters for ORIVILO

"Action confirmation prompts" names this pattern for what the audit calls ConfirmDialog. Our Dialog renders role dialog (K-0249).
