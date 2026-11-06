---
id: K-0270
topic: design
claim: shadcn/ui's Attachment docs ask for an aria-label on each icon action and on the trigger and for the failure reason in AttachmentDescription so colour does not carry the state alone, while the registry root sets only data-state, with no role, aria-busy, aria-live, aria-invalid or aria-describedby, and no motion-reduce class.
source: "https://ui.shadcn.com/docs/components/radix/attachment; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/attachment.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the registry file is read on `main`, not pinned to a commit.

> AttachmentAction is usually icon-only, so give each one an aria-label describing the action and its target.

> AttachmentTrigger covers the card with no text of its own, so give it an aria-label for what activating it does.

> The trigger sits behind the actions in the stacking order, so an AttachmentAction and the AttachmentTrigger never trap each other.

> For a row of presentational attachments, make the group itself focusable and scrollable by adding tabIndex={0}, role="group", and an aria-label.

> Keep the failure reason in AttachmentDescription so the state is not conveyed by color alone.

- Registry root: `data-slot="attachment"`, `data-state={state}`, and `{...props}`, so a caller can add ARIA; the file sets none of `role`, `aria-busy`, `aria-live`, `aria-invalid`, `aria-describedby`.
- Registry classes: `data-[state=idle]:border-dashed`; `data-[state=error]:border-destructive/30` plus destructive media and description; `group-data-[state=uploading]/attachment:shimmer` and the same for `processing` on the title.
- The `shimmer` class is defined outside this file and was not read; the file has no `motion-reduce` class.
- The docs say nothing on announcing a state change. The samples "Retry upload" and "Cancel upload" (K-0269) name the action without the file, against the docs' own "action and its target" (own reading).

## Why it matters for ORIVILO

The docs' reason-in-text rule answers the same need as SC 3.3.1 (K-0279). The source shows the status change itself reaches assistive technology only if the caller adds a live region (K-0278).
