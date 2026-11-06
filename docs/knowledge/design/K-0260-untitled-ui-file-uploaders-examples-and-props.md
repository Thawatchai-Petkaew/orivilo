---
id: K-0260
topic: design
claim: Untitled UI React's File uploaders page shows five examples (own count of its example headings) around FileUpload.DropZone, which takes accept, maxSize, allowsMultiple (default true), hint and isDisabled, and states no size prop and no named slot; its API reference table could not be read.
source: "https://www.untitledui.com/react/components/file-uploaders; https://www.untitledui.com/react/components/file-uploaders.md; https://www.untitledui.com/react/components; https://raw.githubusercontent.com/untitleduico/react/main/components/application/file-upload/file-upload-base.tsx"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters. Confidence 0.75, not 0.8: the page's API reference renders only as a placeholder (`<ApiReference slug="file-uploaders" />`), so the props below come from the FAQ text and the source file on `main`, not from a props table.

> Free and open-source React file upload components built for modern applications and websites.

> These file uploaders are built using React Aria and styled with Tailwind CSS.

- Components index: the Application UI list names "File uploaders" (`https://www.untitledui.com/react/components/file-uploaders`). No entry is named dropzone, drag or attachment.
- Install: `npx untitledui@latest add file-upload-base`.
- Examples on the page: Progress bar, Progress fill, Disabled, Accept image only, Max size limit (five, counted from the page's example headings).
- Exported `FileUpload` keys in the source: `Root`, `List`, `DropZone`, `ListItemProgressBar`, `ListItemProgressFill`.
- `FileUpload.DropZone` props: `accept`, `maxSize`, `allowsMultiple` (the FAQ: "defaults to `true`"), `hint`, `isDisabled`, `className`, `onDropFiles`, `onDropUnacceptedFiles`, `onSizeLimitExceed`.
- List item props in the source: `name`, `size`, `progress`, `failed`, `type`, `className`, `fileIconVariant`, `onDelete`, `onRetry`.
- Variants: the two list items are the only component forms; `fileIconVariant` defaults to `"default"` on the bar item and `"solid"` on the fill item. The file type icon comes only from the `type` prop, with `"empty"` as the fallback.
- Sizes and slots: the page states none. The "Click to upload" `Button` inside the zone is `size="md"` in the source.

## Why it matters for ORIVILO

The Untitled UI row of the benchmark rule reads variants, sizes, states and slots from the page. This entry records that row's frame, with the unread props table named as its limit.
