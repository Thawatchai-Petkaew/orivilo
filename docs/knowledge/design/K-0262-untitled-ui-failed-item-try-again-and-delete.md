---
id: K-0262
topic: design
claim: In Untitled UI a failed upload is the boolean failed on a list item, which shows an error ring, a "Failed" label or "Upload failed, please try again" and a "Try again" button calling onRetry, with a delete button named "Delete" in every state and no prop for a failure reason.
source: "https://www.untitledui.com/react/components/file-uploaders; https://raw.githubusercontent.com/untitleduico/react/main/components/application/file-upload/file-upload-base.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/buttons/button-utility.tsx; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; source files are read on `main`, not pinned to a commit.

> Set `failed` to `true` on the list item.

```tsx
<Button color="link-destructive" size="sm" onClick={onRetry} className="mt-1.5">
```

- Page: both item forms show an error ring and a "Try again" button that calls `onRetry`; the delete button calls `onDelete` in every state.
- Source, bar item: "Failed" beside an `XCircle` icon; the `ProgressBar` is not rendered once failed.
- Source, fill item: the size line is replaced by "Upload failed, please try again".
- Source, props: `failed` is optional and boolean. The item prop list has no error, reason or message prop, so the failure text is the same for every cause (own reading of the prop list).
- Source, delete: a `ButtonUtility` with `tooltip="Delete"`, the `Trash01` icon and `onClick={onDelete}`. That file sets no `aria-label` itself, but `button-utility.tsx` sets `"aria-label": tooltip`, so the button's name is "Delete", without the file's name. It renders a React Aria Button.

## Why it matters for ORIVILO

"Failed item offers retry" is the check on row 24 of the ORV-64 build order. This entry records one shape of it, and that the shape has no field that could tell a person which limit or error stopped the file.
