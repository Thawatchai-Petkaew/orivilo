---
id: K-0268
topic: design
claim: shadcn/ui Attachment displays a file or image with media, metadata, upload state and actions through Attachment, Media, Content, Title, Description, Actions, Action, Trigger and Group parts, with three sizes, two orientations and icon or image media, and it does not pick or upload files.
source: "https://ui.shadcn.com/docs/components/radix/attachment; https://ui.shadcn.com/docs/components/attachment; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/attachment.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the registry file is read on `main`, not pinned to a commit.

> Displays a file or image attachment with media, metadata, upload state, and actions.

- Install: `pnpm dlx shadcn@latest add attachment`.
- `Attachment`: `state` `"idle"`, `"uploading"`, `"processing"`, `"error"` or `"done"` (default `"done"`); `size` `"default"`, `"sm"` or `"xs"` (default `"default"`); `orientation` `"horizontal"` or `"vertical"` (default `"horizontal"`); `className`.
- `AttachmentMedia`: `variant` `"icon"` or `"image"` (default `"icon"`).
- `AttachmentAction`: `size` default `"icon-xs"`, variant default `"ghost"` in the registry; the rest spread to `Button`.
- `AttachmentTrigger`: a full-card `button` behind the actions, which opens a link or dialog. The `/radix/attachment` page names `asChild`; the `/attachment` page names `render`.
- `AttachmentGroup`: `snap-x snap-mandatory`, `overflow-x-auto overscroll-x-contain scrollbar-none`, `scroll-fade-x`; children `snap-start`.
- `AttachmentContent`, `AttachmentTitle`, `AttachmentDescription`, `AttachmentActions`: `className` only. `AttachmentDescription` holds secondary metadata such as file type, size or upload status.
- Examples: Image, States, Sizes, Group, Trigger.

The page has no file picking, drag, drop or limit prop: the caller sets `state` and text (K-0269).

## Why it matters for ORIVILO

Attachment is the nearest shadcn/ui match for the upload list's item, not for the picker. The benchmark needs that split stated, since the two sources cover different halves of the control.
