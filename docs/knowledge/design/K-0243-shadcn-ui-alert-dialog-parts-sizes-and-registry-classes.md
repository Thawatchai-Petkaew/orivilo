---
id: K-0243
topic: design
claim: shadcn/ui Alert Dialog composes AlertDialogTrigger and AlertDialogContent with a Header of AlertDialogMedia, Title and Description and a Footer of Cancel and Action, has one size prop of default or sm, and shows Basic, Small, Media, Small with Media, Destructive and RTL examples; the new-york-v4 file wraps Action and Cancel in Button with variant default and outline, stacks the footer reversed on narrow screens, and sets no aria attribute and no loading or pending prop.
source: "https://ui.shadcn.com/docs/components/radix/alert-dialog; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/radix/alert-dialog.mdx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/alert-dialog.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source on `main`, no commit hash shown.

> A modal dialog that interrupts the user with important content and expects a response.

> Use the `size` prop on the `AlertDialogContent` component to control the size of the alert dialog.

> Use the `AlertDialogMedia` component to add a media element such as an icon or image to the alert dialog.

```tsx
size?: "default" | "sm"
data-[size=sm]:max-w-xs
data-[size=default]:sm:max-w-lg
flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid
group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end
mb-2 inline-flex size-16 items-center justify-center rounded-md bg-muted
```

`AlertDialogAction` defaults to `variant = "default"`, `AlertDialogCancel` to `variant = "outline"`, both to `size = "default"`, and both take `Pick<React.ComponentProps<typeof Button>, "variant" | "size">`. The file exports AlertDialog, Action, Cancel, Content, Description, Footer, Header, Media, Overlay, Portal, Title and Trigger under `AlertDialog*` names. The page has no accessibility section and no text on keyboard, focus, loading, pending or errors; it sends the reader to the Radix docs for other props.

## Why it matters for ORIVILO

This is the shadcn/ui row for variants, sizes and slots. The behaviour in that row comes from Radix (K-0247, K-0248), not from shadcn.
