---
id: K-0138
topic: design
claim: shadcn/ui Bubble has four parts and seven variants (own count of the variant union: default, secondary, muted, tinted, outline, ghost, destructive; default "default"), align start or end, and no size option; it has no action slot and states no copy action, copied or failed state; an interactive bubble renders as a real button or link with a visible focus ring.
source: "https://ui.shadcn.com/docs/components/base/bubble"
retrieved: 2026-11-02
confidence: 0.8
applies_to: [ORV-217]
license: link-only
---

## Evidence

Read on 2026-11-02 through a fetch tool that returns a summary with short quotes; the Base UI tab was read, the React Aria and Radix tabs were not. The seven variants are the values of the `variant` union in the Bubble prop table on that page (own count of that union).

> Displays conversational content in a message bubble.

> Supports variants, alignment, grouping, reactions, and collapsible content.

- Parts: `Bubble`, `BubbleContent`, `BubbleReactions`, `BubbleGroup`.
- `Bubble`: `variant` `"default" | "secondary" | "muted" | "tinted" | "outline" | "ghost" | "destructive"`, default `"default"`; `align` `"start" | "end"`, default `"start"`. `ghost` is "Unframed content for assistant text or rich content"; `destructive` is "A destructive bubble for error or failed actions."
- `BubbleContent`: `render` to render as another element such as a link. `BubbleReactions`: `side` top or bottom (default bottom), `align` start or end (default end).
- Size: no size prop; bubbles size to content up to 80% of the container width, and `ghost` removes that cap.
- Example sections: Variants, Alignment, Bubble Group, Links and Buttons, Reactions, Show More / Collapsible, Tooltip, Popover.
- Accessibility: an interactive bubble is rendered "as a real `<button>` or `<a>`" through `render`; `BubbleContent` ships a visible focus ring; reactions are grouped as one image with an `aria-label`; colour is paired with text, alignment or icons.

### Not stated on the page

A copy action, clipboard behaviour, copied or failed state, keyboard interaction, focus beyond the ring, motion. The "Copy" controls on the page belong to its code blocks.

## Why it matters for ORIVILO

The spec's audit row names Bubble beside Message Scroller. This entry records that Bubble is the message surface only; the copy action's slot is on Message (K-0137).
