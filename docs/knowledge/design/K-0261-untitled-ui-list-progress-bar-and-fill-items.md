---
id: K-0261
topic: design
claim: Untitled UI's upload list is controlled by the caller, who passes name, size in bytes and progress from 0 to 100 to a bar item or a fill item; at 100 the bar item shows "Complete" and the fill item a check icon, and the source renders a ul of motion.li items, formats size as a floored whole number and hard-codes its status strings.
source: "https://www.untitledui.com/react/components/file-uploaders; https://raw.githubusercontent.com/untitleduico/react/main/components/application/file-upload/file-upload-base.tsx; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the source file is read on `main`, not pinned to a commit.

> Update `progress` as your upload reports it.

```tsx
{
  !isComplete && !failed && <p className="text-sm font-medium text-quaternary">Uploading...</p>;
}
```

- Page: the list is controlled, so files stay in the caller's state. At 100 the bar item shows a "Complete" label and the fill item a check icon.
- Source, list: `FileUploadList` renders a `<ul>` with `flex flex-col gap-3` and wraps children in `<AnimatePresence initial={false}>`. Each item is a `<motion.li>` with `layout="position"`.
- Source, bar item: renders `<ProgressBar labelPosition="right" max={100} min={0} value={progress} />` only when the item has not failed. "Uploading..." and "Complete" appear only in this item.
- Source, fill item: a check icon and the percentage at 100; it shows no "Complete" text.
- Source, size text: `getReadableFileSize` returns `"0 KB"` for 0 bytes; otherwise it picks a unit by logarithm base 1024 and returns the floored integer, so 1536 bytes reads 1 KB. No decimals.
- Source, strings: "Uploading...", "Complete", "Failed", "Try again", "Upload failed, please try again" and the delete tooltip are hard-coded; only `hint` is a prop.

## Why it matters for ORIVILO

Row 24 of the ORV-64 build order asks for a list with progress. This is how Untitled UI shows it, including two points a reader checks against ORIVILO's rules: floored sizes beside a size limit, and strings outside a locale catalog.
