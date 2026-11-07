---
id: K-0248
topic: design
claim: Radix AlertDialog.Action renders Dialog Close, whose click calls onOpenChange(false) after the caller's onClick unless that handler prevented the default; the API has no pending, loading or error prop, and the docs' async example keeps the dialog open with controlled open, a plain submit button rather than Action, and setOpen(false) after the wait, with no failure path.
source: "https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/alert-dialog/src/alert-dialog.tsx; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/dialog/src/dialog.tsx; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/core/primitive/src/primitive.tsx; https://www.radix-ui.com/primitives/docs/components/alert-dialog"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source on `main`, no commit hash shown.

```tsx
return <DialogPrimitive.Close {...dialogScope} {...actionProps} ref={forwardedRef} />;
onClick={composeEventHandlers(props.onClick, () => context.onOpenChange(false))}
if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) {
<button type="submit">Submit</button>
wait().then(() => setOpen(false));
```

The example is titled "Close after asynchronous form submission". It waits one second, then closes. It does not disable the buttons, block Escape or show an error.

## Why it matters for ORIVILO

A pending or failed confirm has to stay open, and Action closes unless told not to. The primitive leaves pending and failure entirely to the caller, and Escape stays live (K-0247).
