---
id: K-0142
topic: design
claim: Vercel AI Elements Conversation wraps use-stick-to-bottom's StickToBottom with initial and resize "smooth" and role log; ConversationScrollButton renders only while isAtBottom is false, as an outline icon Button with an ArrowDownIcon, rounded, centred and absolute at bottom-4, calls scrollToBottom() with no options, and has no aria-label, title or sr-only text.
source: "https://elements.ai-sdk.dev/components/conversation; https://raw.githubusercontent.com/vercel/ai-elements/main/packages/elements/src/conversation.tsx; https://raw.githubusercontent.com/stackblitz-labs/use-stick-to-bottom/main/README.md"
retrieved: 2026-11-02
confidence: 0.8
applies_to: [ORV-217]
license: link-only
---

## Evidence

Read on 2026-11-02 through a fetch tool that returns a summary with short quotes; source on `main`, no commit hash shown. Docs page and source agree, one publisher, so 0.8.

### Docs page

> Wraps messages and automatically scrolls to the bottom. Also includes a scroll button that appears when not at the bottom.

- Parts: `Conversation`, `ConversationContent`, `ConversationEmptyState` (title "No messages yet", description "Start a conversation to see messages here"), `ConversationScrollButton`, `ConversationDownload`, `messagesToMarkdown`.
- `ConversationScrollButton`: one prop row, `...props` "spread to the underlying shadcn/ui Button component."
- Features include "Smooth scrolling behavior with configurable animation" and "Accessible with proper ARIA roles for screen readers"; neither is explained. The usage shows `<ConversationScrollButton />` with no props or text.

### Source file

```tsx
!isAtBottom && (
size="icon" type="button" variant="outline" onClick={handleScrollToBottom}
"absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full dark:bg-background dark:hover:bg-muted"
<ArrowDownIcon className="size-4" />
```

(Fragments as the fetch tool quoted them.) `Conversation` passes `initial="smooth"`, `resize="smooth"`, `role="log"` to `StickToBottom`. The button reads `isAtBottom` and `scrollToBottom` from `useStickToBottomContext()` and calls `scrollToBottom()`. No `aria-label`, `title` or sr-only text; a name can come only through spread props. `ConversationDownload` defaults to a `DownloadIcon` with no text or label either. The file sets no focus.

### use-stick-to-bottom README

"Uses a custom implemented smooth scrolling algorithm, featuring velocity-based spring animations"; it "Allows the user to cancel the stickiness at any time by scrolling up"; `scrollToBottom` "returns a `Promise<boolean>`". The README gives no definition or threshold for `isAtBottom`, no instant mode and no license.

### Not stated

The `isAtBottom` threshold, where focus goes when the pressed button unmounts, a new-messages count, reduced motion.

## Why it matters for ORIVILO

The audit's Conversation reading did not record when the button shows, its label or focus. This entry records them: shown whenever not at the bottom, unnamed, smooth, and unmounted with no focus handling.
