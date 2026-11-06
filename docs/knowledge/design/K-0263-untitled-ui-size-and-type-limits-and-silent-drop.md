---
id: K-0263
topic: design
claim: Untitled UI's drop zone checks size before type on dropped and picked files, sends rejected files to onSizeLimitExceed or onDropUnacceptedFiles, drops oversized files silently when the size callback is missing, and shows a rejection only by turning the unchanged hint text to the error colour.
source: "https://www.untitledui.com/react/components/file-uploaders; https://raw.githubusercontent.com/untitleduico/react/main/components/application/file-upload/file-upload-base.tsx; docs/specs/ORV-64/audit.md; docs/adr/0009-ai-through-openrouter.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the source file is read on `main`, not pinned to a commit.

> Set `maxSize` on `FileUpload.DropZone` to the limit in bytes.

> Oversized files never reach `onDropFiles`; they go to `onSizeLimitExceed`.

> without it oversized files are dropped silently

> Pass the `accept` prop to `FileUpload.DropZone`.

```tsx
isInvalid && "text-error-primary"
```

- Page: `accept` takes the same comma-separated string as a native file input and is checked for both dropped and picked files. Files that do not match go to `onDropUnacceptedFiles`. With `allowsMultiple={false}` only the first file is processed.
- Source, order: each file is checked against `maxSize` first; only files that pass are checked against `accept`.
- Source, defaults: with no `accept` all types pass; with no `maxSize` no size check runs. `hint` falls back to `"SVG, PNG, JPG or GIF (max. 800x400px)"`, which is help text and does not set a limit.
- Source, rejection: `isInvalid` becomes true only when a rejected file is reported and the matching callback is a function, and resets at the start of each `processFiles` call. The zone renders no separate error message, and the hint text stays the same with only its colour changing.
- The props read hold no maximum file count; `allowsMultiple` is the only count control.

## Why it matters for ORIVILO

Row 24 of the ORV-64 build order needs size and type limits shown to match ADR 0009 point 5. This entry records how Untitled UI enforces limits and where its default path leaves a person with no reason.
