---
id: K-0247
topic: design
claim: In Radix Alert Dialog's source, on main and in the 1.2.1 build the repo's lockfile pins, the root is always modal, the content has role alertdialog, opening cancels the default autofocus and focuses the Cancel button through a ref with no fallback in that handler, pointer and interact outside are prevented and removed from the content props, and onEscapeKeyDown is not overridden, so Escape still closes.
source: "https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/alert-dialog/src/alert-dialog.tsx; https://unpkg.com/@radix-ui/react-alert-dialog@1.2.1/dist/index.mjs; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/core/primitive/src/primitive.tsx; pnpm-lock.yaml"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool. `main` shows no commit hash; the unpkg build 1.2.1 has the same lines in compiled form. `pnpm-lock.yaml` line 9676 pins `@radix-ui/react-alert-dialog` 1.2.1 under `radix-ui` 1.8.1.

```tsx
return <DialogPrimitive.Root {...dialogScope} {...alertDialogProps} modal={true} />;
role="alertdialog"
onOpenAutoFocus={composeEventHandlers(contentProps.onOpenAutoFocus, (event) => {
event.preventDefault();
cancelRef.current?.focus({ preventScroll: true });
onPointerDownOutside={(event) => event.preventDefault()}
```

`onInteractOutside` has the same handler, and the content props omit `'onPointerDownOutside' | 'onInteractOutside'`. `AlertDialogCancel` joins the ref with `useComposedRefs(forwardedRef, cancelRef)`. A caller's `onOpenAutoFocus` runs first and, if it calls `preventDefault`, the Cancel focus is skipped (`composeEventHandlers`, K-0248). The call is optional (`?.`), and the handler has already prevented the default, so with no Cancel mounted this handler moves focus nowhere; what the page does then was not run here.

## Why it matters for ORIVILO

It is the only code read that sends first focus to the safe action by reference, not by DOM order. Our Dialog reaches the same place only through DOM order (K-0249, K-0259).
