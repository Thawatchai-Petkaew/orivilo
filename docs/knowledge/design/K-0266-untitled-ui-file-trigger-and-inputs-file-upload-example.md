---
id: K-0266
topic: design
claim: Untitled UI has a second file route, a FileTrigger that clones one child to open a display none file input with props for accepted types, multiple files, camera and directories, and its Inputs page lists a "File upload" example with no text and an unread API table.
source: "https://raw.githubusercontent.com/untitleduico/react/main/components/base/file-upload-trigger/file-upload-trigger.tsx; https://www.untitledui.com/react/components/inputs"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the source file is read on `main`, not pinned to a commit. Confidence 0.75, not 0.8: the Inputs page gives a demo name only (`FileUploadInputDemo`), its code was not shown, and its API reference is a placeholder (`<ApiReference slug="inputs" />`). The fetch does not show which demo uses `FileTrigger`.

```tsx
import { filterDOMProps } from "@react-aria/utils";
```

- Purpose, from its doc comment: it lets a user "access the file system with any pressable React Aria or React Spectrum component".
- Props: `acceptedFileTypes` (to `accept`), `allowsMultiple`, `defaultCamera` (to `capture`), `onSelect` (a `FileList` or `null`), `acceptDirectory` (adds `webkitdirectory`), `children`.
- Wiring: `React.Children.only(children)`, then the child is cloned with an `onClick` that calls `input?.click()`. The input is rendered beside the child with `display: none`.
- Same file twice: the input's `onClick` clears its value before the dialog opens, so choosing the same file again still fires `onChange`.
- Inputs page: heading "File upload", no description, no FAQ on file inputs.

## Why it matters for ORIVILO

A retry or re-pick that chooses the same file depends on the value being cleared. `FileTrigger` hides the input differently from the drop zone (K-0264), which matters beside MDN's note on hiding file inputs (K-0286).
