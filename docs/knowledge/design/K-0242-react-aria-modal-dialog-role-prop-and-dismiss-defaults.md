---
id: K-0242
topic: design
claim: React Aria's Modal page gives Dialog a role prop of alertdialog or dialog with default dialog, and gives Modal isDismissable and isKeyboardDismissDisabled, both default false; it says focus is not moved into the dialog until the animation completes and has no alert dialog example; Untitled UI's Dialog spreads its AriaDialogProps onto the React Aria Dialog, so the prop type admits that role.
source: "https://react-aria.adobe.com/Modal; https://raw.githubusercontent.com/untitleduico/react/main/components/application/modals/modal.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces. The old URLs `react-spectrum.adobe.com/react-aria/Dialog.html` and `.../examples/destructive-dialog.html` redirect (to `/Modal` and to `/examples/`); `https://react-aria.adobe.com/Dialog` returned 404.

The `role` row of the Dialog table reads, as the tool returned it:

> `"alertdialog" | "dialog" | undefined` | 'dialog' | The accessibility role for the dialog.

> Focus is not moved into the dialog until the animation completes,
> since moving the screen reader cursor may cause scrolling that interrupts the animation.

> Whether to close the modal when the user interacts outside it.

> Whether pressing the escape key to close the modal should be disabled.

```tsx
export const Dialog = (props: AriaDialogProps) => (
    <AriaDialog {...props} className={cx(
```

The examples on the page use an `autoFocus` prop on a TextField; no sentence on the page describes it. Whether an Untitled PRO example sets `role="alertdialog"` was not read (K-0238).

### Not read

- The React Aria destructive dialog example, whose redirect goes to the examples index.

## Why it matters for ORIVILO

Untitled's stack has an alertdialog route by prop, not by a separate component, which is the opposite shape from Radix (K-0247).
