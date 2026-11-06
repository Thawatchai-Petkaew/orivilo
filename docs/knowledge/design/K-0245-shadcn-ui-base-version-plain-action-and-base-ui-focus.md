---
id: K-0245
topic: design
claim: shadcn/ui's Alert Dialog comes in Base UI, React Aria and Radix UI versions with Base UI listed first; in the Base registry file AlertDialogAction is a plain Button with no close of its own and only AlertDialogCancel goes through Close, and Base UI's own page sends first focus to the first tabbable element in the popup, or to the popup when opened by touch, with initialFocus and finalFocus to change it, and states no ARIA role.
source: "https://ui.shadcn.com/docs/components/base/alert-dialog; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/base/ui/alert-dialog.tsx; https://base-ui.com/react/components/alert-dialog; https://base-ui.com/react/components/alert-dialog.md; https://raw.githubusercontent.com/mui/base-ui/master/packages/react/src/alert-dialog/root/AlertDialogRoot.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces. Source on `main` and `master`, no commit hash shown.

```tsx
<Button
  data-slot="alert-dialog-action"
  className={cn("cn-alert-dialog-action", className)}
  {...props}
/>
```

```tsx
<AlertDialogPrimitive.Close
  data-slot="alert-dialog-cancel"
  className={cn("cn-alert-dialog-cancel", className)}
  render={<Button variant={variant} size={size} />}
```

> A dialog that requires a user response to proceed.

> By default, focus moves to the first tabbable element inside the popup, except when the dialog is opened by touch

> Determines the element to focus when the dialog is opened.

> Determines the element to focus when the dialog is closed.

`onOpenChange` reasons include `outside-press` and `escape-key`. `AlertDialogRootProps` omits `modal` and `disablePointerDismissal`, so a caller cannot set them; what the root sets them to sits in `useRenderDialogRoot`, which was not read. The page names no pending or loading state.

### Not read

- shadcn/ui's React Aria version of Alert Dialog.
- Base UI `useRenderDialogRoot` and its popup role.

## Why it matters for ORIVILO

ORIVILO uses `radix-ui`, so the Radix version is the one that applies (K-0247, K-0248). The Base version is recorded because the two differ on first focus and on whether Action closes the dialog.
