---
id: K-0141
topic: design
claim: Vercel AI Elements MessageAction is a shadcn Button (default variant ghost, size icon-sm, type button) that renders its label, or the tooltip as fallback, in an sr-only span and wraps itself in a Tooltip only when tooltip is set; the docs' copy example calls navigator.clipboard.writeText with label "Copy" and a size-3 CopyIcon, and neither the docs nor message.tsx has a copied state, a failure path or a toast.
source: "https://elements.ai-sdk.dev/components/message; https://raw.githubusercontent.com/vercel/ai-elements/main/packages/elements/src/message.tsx"
retrieved: 2026-11-02
confidence: 0.8
applies_to: [ORV-217]
license: link-only
---

## Evidence

Read on 2026-11-02 through a fetch tool that returns a summary with short quotes; source on `main`, no commit hash shown. Docs page and source file agree, one publisher, so 0.8.

### Docs page

> A comprehensive suite of components for displaying chat messages, including message rendering, branching, actions, and markdown responses.

- Parts: Message, MessageContent, MessageResponse, MessageActions, MessageAction, MessageBranch, MessageBranchContent, MessageBranchSelector, MessageBranchPrevious, MessageBranchNext, MessageBranchPage, MessageToolbar.
- `MessageAction` props: `tooltip` `string`, "Optional tooltip text shown on hover."; `label` `string`, "Accessible label for screen readers. Also used as fallback if tooltip is not provided."; `...props` spread to the shadcn/ui Button. The table lists no `variant` or `size`.
- `MessageToolbar`: "A container for placing actions and branch selectors below a message."
- Features: "Keyboard accessible with proper ARIA labels."

```tsx
<MessageAction onClick={() => navigator.clipboard.writeText(part.text)} label="Copy">
  <CopyIcon className="size-3" />
</MessageAction>
```

The example (lines joined) has no success feedback and no error handling. The fetch tool reported it on the last assistant message.

### Source file

- `MessageActions`: `<div className={cn("flex items-center gap-1", className)} {...props}>`, no aria.
- `MessageAction`: `variant` default `"ghost"`, `size` default `"icon-sm"`, `<Button size={size} type="button" variant={variant} {...props}>`, then `<span className="sr-only">{label || tooltip}</span>`. With `tooltip`, it nests `TooltipProvider`, `Tooltip`, `<TooltipTrigger asChild>` and `TooltipContent` holding `<p>{tooltip}</p>`; without it, the plain button.
- `MessageToolbar`: `"mt-4 flex w-full items-center justify-between gap-4"`.
- Branch arrows: `aria-label="Previous branch"`, `aria-label="Next branch"`.
- No copied state, no `navigator.clipboard` call and no clipboard error handling in the file.

### Not stated

A copied or failed state, a toast, whether actions show on hover only, focus after a press, the Tooltip's delay (the Tooltip file was not read).

## Why it matters for ORIVILO

ORV-217's AI Elements copy cell said prop names were not recorded; this entry records them. The copy result states in the spec have no counterpart here to compare.
