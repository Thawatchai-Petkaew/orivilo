---
id: K-0246
topic: design
claim: Radix Alert Dialog's docs say it adheres to the Alert and Message Dialogs WAI-ARIA pattern, traps focus, and closes on Esc, moving focus to the trigger; its parts are Root, Trigger, Portal, Overlay, Content, Title, Description, Cancel and Action, Root has no modal prop, Content lists onOpenAutoFocus, onCloseAutoFocus and onEscapeKeyDown but no outside-interaction handler, and Cancel and Action are both buttons that close the dialog and should look different from each other.
source: "https://www.radix-ui.com/primitives/docs/components/alert-dialog"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces.

> Adheres to the Alert and Message Dialogs WAI-ARIA design pattern

> Focus is automatically trapped.

> Esc closes the component automatically.

> A button that closes the dialog. This button should be distinguished visually from `AlertDialog.Action` buttons.

> A button that closes the dialog. These buttons should be distinguished visually from the `AlertDialog.Cancel` button.

Keyboard table: Esc "Closes the dialog and moves focus to `AlertDialog.Trigger`."; Space "Opens/closes the dialog."; Enter does the same; Tab and Shift + Tab move focus. `Title` is the name announced on open, or `aria-label` or `aria-labelledby` on Content; `Description` is the description announced on open, or `aria-describedby` on Content. `Trigger`, `Overlay` and `Content` expose `[data-state]` open or closed. The docs do not say which element takes focus on open.

## Why it matters for ORIVILO

`radix-ui` is already a dependency of the design system, so this primitive is available without a new package. The first-focus rule is in the source, not the docs (K-0247).
