---
id: K-0176
topic: design
claim: shadcn/ui's nearest loading pattern is the Spinner page's Empty example, which puts a Spinner in EmptyMedia with variant icon above the title "Processing your request" and a small outline Cancel button; the example file sets no role or aria attribute, so its only announcement is the Spinner's own role status and fixed English aria-label "Loading".
source: "https://ui.shadcn.com/docs/components/radix/spinner; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/examples/spinner-empty.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/spinner.tsx; docs/knowledge/design/K-0110-shadcn-ui-spinner-status-role-on-the-icon.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, `main` branch of `shadcn-ui/ui` (no commit hash shown). Confidence 0.8: one project, its page and its files agree; nothing was rendered. K-0110 noted this example in passing; this entry reads its file.

From `spinner-empty.tsx`:

```text
<EmptyMedia variant="icon">
<Spinner />
<EmptyTitle>Processing your request</EmptyTitle>
<EmptyDescription>
<EmptyContent>
<Button variant="outline" size="sm">
```

The description text is "Please wait while we process your request. Do not refresh the page." and the button label is "Cancel". The tool reported that the file contains no `role`, `aria-*` or `aria-busy` attribute. The page's headings are Installation, Usage, Customization, Size, Button, Badge, Input Group, Empty and RTL.

From `ui/spinner.tsx`, re-read on this date:

```text
role="status"
aria-label="Loading"
className={cn("size-4 animate-spin", className)}
```

Empty itself has no loading part (K-0174).

## Why it matters for ORIVILO

shadcn builds a loading state from its empty layout: the same slots, with a spinner as the media and a cancel action. The title and description are not in the status element, so by our reading of the file they are not what a screen reader is told; the region also has no `aria-busy`.
