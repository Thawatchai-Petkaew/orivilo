---
id: K-0137
topic: design
claim: shadcn/ui Message has six parts with one prop besides className (align start or end, default start); it places message actions such as copy, retry or feedback in MessageFooter, shows a copy action as a ghost icon Button with aria-label "Copy", tells authors to give each icon-only action an aria-label, and states no clipboard behaviour, copied or failed state, tooltip, keyboard or focus behaviour.
source: "https://ui.shadcn.com/docs/components/base/message; https://ui.shadcn.com/docs/components"
retrieved: 2026-11-02
confidence: 0.8
applies_to: [ORV-217]
license: link-only
---

## Evidence

Read on 2026-11-02 through a fetch tool that returns a summary with short quotes. The components index lists Message at `/docs/components/base/message`, next to Bubble and Message Scroller; the Base UI tab was read. One page, quoted, so 0.8.

> Displays a message in a conversation, with optional avatar, header, footer, and alignment.

> Place message-level actions in MessageFooter, such as copy, retry, or feedback buttons.

> Action buttons in MessageFooter are usually icon-only, so give each one an aria-label.

> For in-progress messages, use a Marker with role="status" so assistive tech announces the update as it appears.

- Parts: Message, MessageGroup, MessageAvatar, MessageContent, MessageHeader, MessageFooter. MessageFooter: "Displays content below the message, such as status or actions."
- Props: Message `align` `"start" | "end"`, default `"start"`; every part takes `className`. No variants or sizes are listed.
- The accessibility sample shows a `Button` with `variant="ghost"`, `size="icon"`, `aria-label="Copy"` and a `CopyIcon`. The Actions sample imports `CopyIcon` and `RefreshCcwIcon`.
- "Accessibility comes from the content you place inside it."

### Not stated on the page

What the copy button writes, any copied or copy-failed state, a tooltip on actions, whether actions show only on hover, keyboard and focus behaviour. "Failed to send" in a demo is sample text, not a documented state.

## Why it matters for ORIVILO

This is shadcn's only reading for the ORV-217 copy cell: a slot below the message and an icon button with a label, with no result state to compare against.
