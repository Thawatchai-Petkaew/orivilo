---
id: K-0244
topic: design
claim: shadcn/ui's Radix Destructive example sets AlertDialogAction to variant destructive and AlertDialogCancel to outline, tints AlertDialogMedia with destructive classes, titles the dialog "Delete chat?" and puts the impact in the description ("This will permanently delete this chat conversation"), which also holds a link; it names the action Delete, and shows no pending or failure state.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/alert-dialog-destructive.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/radix/alert-dialog.mdx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source on `main`, no commit hash shown.

> Use the `AlertDialogAction` component to add a destructive action button to the alert dialog.

```tsx
<AlertDialogTitle>Delete chat?</AlertDialogTitle>
  This will permanently delete this chat conversation. View{" "}
  <a href="#">Settings</a> delete any memories saved during this chat.
<AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
<AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
<AlertDialogAction variant="destructive">Delete</AlertDialogAction>
```

The Basic example's sentence in the docs is "A basic alert dialog with a title, description, and cancel and continue buttons."

## Why it matters for ORIVILO

This is the shadcn/ui cell for destructive treatment and impact text: impact is free text in the description, with no separate slot.
