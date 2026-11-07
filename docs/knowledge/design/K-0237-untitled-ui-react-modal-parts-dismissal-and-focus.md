---
id: K-0237
topic: design
claim: Untitled UI React builds a modal from ModalOverlay, Modal and Dialog over React Aria with an optional CloseButton; isDismissable is off by default so a backdrop click does nothing, isKeyboardDismissDisabled stops Escape, neither affects a CloseButton, and the page says focus stays inside while open and returns to the previously focused element; modal.tsx adds no size or variant prop, no role and no loading or error state of its own.
source: "https://www.untitledui.com/react/components/modals.md; https://www.untitledui.com/react/components/modals; https://raw.githubusercontent.com/untitleduico/react/main/components/application/modals/modal.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces; passages below are those pieces in page order. The page's API table (`<ApiReference slug="modals" />`) did not come through, so props are from the page text and from `modal.tsx` on `main`, no commit hash shown.

### Dismissal (FAQ)

> Leave `isDismissable` off `ModalOverlay` (it defaults to `false`) so clicking the backdrop does nothing,
> and pass `isKeyboardDismissDisabled` to stop Escape from closing it.
> Neither prop affects a `CloseButton`, so remove that too if the examples you copied include one.

### Accessibility (FAQ)

> Give each `Dialog` an accessible name, either with a React Aria `Heading` using `slot="title"`,
> as the examples do, or with `aria-label`.
> React Aria handles the rest: focus is contained inside the modal while it is open
> and returns to the previously focused element when it closes, and Escape closes it
> unless `isKeyboardDismissDisabled` is set.

### Layout

> Below the `sm` breakpoint the overlay aligns the modal to the bottom of the screen; from `sm` up it is centered.

### Source

```tsx
export const ModalOverlay = (props: AriaModalOverlayProps) => {
export const Modal = (props: AriaModalOverlayProps) => (
export const Dialog = (props: AriaDialogProps) => (
```

`modal.tsx` sets no `role`, no `autoFocus`, no `aria-*` attribute, and has no loading, error or destructive prop. The page and the file do not say where focus lands first.

## Why it matters for ORIVILO

This is the Untitled UI row of the ConfirmDialog benchmark for slots, dismissal and focus. First focus is left to React Aria and the example, so the pages read state no first-focus rule for a destructive modal.
