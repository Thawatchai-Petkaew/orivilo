---
id: K-0139
topic: design
claim: shadcn/ui Message Scroller's MessageScrollerButton scrolls to the end (or start) of the transcript, stays in the DOM, and when there is nothing in its direction sets inert, tabIndex -1 and data-active false; the new-york-v4 registry styles it as a secondary icon-sm Button with an ArrowDownIcon and sr-only "Scroll to end", fades, scales and slides it out when inactive with no reduced-motion class, and the docs mark the transcript role log with aria-relevant additions.
source: "https://ui.shadcn.com/docs/components/base/message-scroller; https://ui.shadcn.com/r/styles/new-york-v4/message-scroller.json"
retrieved: 2026-11-02
confidence: 0.8
applies_to: [ORV-217]
license: link-only
---

## Evidence

Read on 2026-11-02 through a fetch tool that returns a summary with short quotes. The docs page was long and was read in two parts (start, then from character 20000); the docs show no prop tables and link to an API reference on the `@shadcn/react` page, which was not reached (npm answered 403). The registry JSON read is the `new-york-v4` style; the Base UI style's registry item was not read. Docs and registry are one publisher and agree, so 0.8. The primitive under the button is K-0140.

### Docs page

> MessageScrollerButton renders a real button. When there is nothing to scroll toward, it sets inert, uses tabIndex={-1}, and exposes data-active="false".

> Calling scrollToEnd, or pressing MessageScrollerButton, re-engages follow-output when autoScroll is enabled.

> MessageScrollerContent marks the transcript as a live region with role="log" and aria-relevant="additions".

- Parts: MessageScrollerProvider, MessageScroller, MessageScrollerViewport, MessageScrollerContent, MessageScrollerItem, MessageScrollerButton; hooks useMessageScroller, useMessageScrollerVisibility, useMessageScrollerScrollable.
- Button: "Scrolls to the start or end of the transcript and is inert until there is content in its direction." The page says inactive controls do not create extra focus stops.
- "Pass `aria-busy` while a turn streams if announcements should wait for the completed message row." `MessageScrollerViewport` "is a labelled, keyboard-focusable scroll region by default."
- The streaming section says a "Jump to latest" action should bring the reader back and resume following; it is not given as the button's built-in text. The page says to "Make it clear when a response is still streaming or when new messages have arrived" and ships no unread count or new-messages indicator.
- Examples: Anchoring Turns, Group Chat, Keeping Context Visible, Streaming Messages, Opening Position, Loading Earlier Messages, Animation, Commands, Transcript Outline, Scroll Status.

### Registry item (`registry/new-york-v4/ui/message-scroller.tsx`)

```tsx
render={render ?? <Button variant={variant} size={size} />}
"data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0"
"transition-[translate,scale,opacity] duration-200 hover:bg-muted hover:text-foreground"
"data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4"
```

- Props: `direction` default `"end"`, `variant` default `"secondary"`, `size` default `"icon-sm"`, plus `className`, `children`, `render`.
- Default children: `ArrowDownIcon` and a `span.sr-only` reading "Scroll to end" for direction end, "Scroll to start" otherwise; no `aria-label`. For start the icon turns 180 degrees.
- Placement: `absolute`, centred on the inline axis, `bottom-4` for end and `top-4` for start.
- Motion: 200 ms transition; inactive uses `duration-400` with an ease-in curve, active an ease-out curve. The class string has no `motion-reduce` class.
- Dependencies: `button` (registry), `cn`, `@shadcn/react`; it imports `lucide-react`.

### Not stated

The visible label (the default is icon only), smooth or instant scroll (see K-0140), the threshold (see K-0140), a count of new messages, where focus goes after a press.

## Why it matters for ORIVILO

This is the closest shadcn match to ORV-217's back-to-latest button: an always-mounted button that becomes inert rather than unmounting, named by sr-only text only.
