---
id: K-0269
topic: design
claim: shadcn/ui Attachment has five upload states and no progress prop; its States sample shows progress only as description text, and retry, cancel and remove only as AttachmentAction buttons the caller adds, with aria-labels "Retry upload", "Cancel upload" and "Remove" plus the file name.
source: "https://ui.shadcn.com/docs/components/radix/attachment; https://ui.shadcn.com/docs/components/radix/attachment.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters. The source writes a middot in two sample strings; it is `[,]` below.

> Upload failed. Try again.

> Uploading [,] 64%

> Uploaded [,] 1.8 MB

| `state`      | Sample description          | Sample action `aria-label`                    |
| ------------ | --------------------------- | --------------------------------------------- |
| `idle`       | "Ready to upload"           | "Remove selected-file.pdf"                    |
| `uploading`  | "Uploading [,] 64%"         | "Cancel upload"                               |
| `processing` | "Processing document"       | "Remove market-research.pdf"                  |
| `error`      | "Upload failed. Try again." | "Retry upload", "Remove financial-model.xlsx" |
| `done`       | "Uploaded [,] 1.8 MB"       | "Remove uploaded-report.pdf"                  |

- The `error` row's retry action uses `RefreshCwIcon`.
- Page: `uploading` and `processing` shimmer the title; `error` switches to a destructive treatment.
- The API lists no value or progress prop; "64%" exists only in the sample text. A bar would be a separate `Progress` (K-0271).
- `idle` reads "Ready to upload" and takes a dashed border in the registry (K-0270), a queued state Untitled UI's item does not name (K-0261).

## Why it matters for ORIVILO

This is shadcn/ui's whole answer for list, progress, failed and retry: a display with five states and caller-written text. "Processing" and "cancel" are items the Untitled UI page does not show (K-0261, K-0262).
