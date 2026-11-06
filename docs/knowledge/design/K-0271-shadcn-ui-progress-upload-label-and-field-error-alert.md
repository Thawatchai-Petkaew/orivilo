---
id: K-0271
topic: design
claim: shadcn/ui's Progress page shows an "Upload progress" label in a Field and points to Radix for its props, its FieldError renders with role alert, and invalid input is marked by aria-invalid on the control with data-invalid on the Field for styling.
source: "https://ui.shadcn.com/docs/components/radix/progress; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/field.tsx; https://ui.shadcn.com/docs/components/radix/input; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/input.tsx; packages/design-system/src/components/field/Field.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; registry files are read on `main`, not pinned to a commit.

> Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.

> Use the `aria-invalid` prop to mark the input as invalid.

> To style the invalid state, add the `data-invalid` attribute to the `Field` component.

```text
aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40
```

- Progress page: examples Basic (`<Progress value={33} />`), Label, Controlled, RTL. The Label example wraps the bar in `Field` and `FieldLabel`, reading "Upload progress" with "66%" beside it; its code was cut off in the fetch, so how the label names the bar was not read.
- Progress page: it lists no props and refers to the Radix Progress API (K-0273).
- `FieldError`: `role="alert"`, `data-slot="field-error"`; returns `null` with no content. Several unique messages render as a `<ul>`, one `<li>` each.
- `Field`: `data-[invalid=true]:text-destructive` on its base class; the caller sets `data-invalid`.

## Why it matters for ORIVILO

These are the parts a caller would combine with Attachment (K-0268) for an upload form. `FieldError`'s role matches ORIVILO's `Field`, which also renders its error with role alert.
