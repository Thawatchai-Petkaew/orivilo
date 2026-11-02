---
id: K-0140
topic: design
claim: In the @shadcn/react MessageScroller primitive (MIT, version 0.3.1), the Button defaults to direction end, type button and behavior smooth, blurs itself before it scrolls and never calls focus, is active when the content bottom is more than scrollEdgeThreshold (default 8 px) below the viewport and the view is not following, and sets no aria-label; the Viewport defaults to role region, aria-label "Messages" and tabIndex 0, and the Content to role log with aria-relevant additions and no aria-live.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/packages/react/src/message-scroller/components.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/packages/react/src/message-scroller/types.ts; https://raw.githubusercontent.com/shadcn-ui/ui/main/packages/react/src/message-scroller/geometry.ts; https://raw.githubusercontent.com/shadcn-ui/ui/main/packages/react/src/message-scroller/use-message-scroller-controller.ts; https://raw.githubusercontent.com/shadcn-ui/ui/main/packages/react/src/message-scroller/README.md; https://unpkg.com/@shadcn/react/package.json; docs/specs/ORV-217/spec.md"
retrieved: 2026-11-02
confidence: 0.8
applies_to: [ORV-217]
license: link-only
---

## Evidence

Read on 2026-11-02 through a fetch tool, on `main` with no commit hash shown. `package.json`: name `@shadcn/react`, version `0.3.1`, license `MIT`, repository `https://github.com/shadcn-ui/ui.git`, directory `packages/react`. One publisher's source, quoted, so 0.8.

### Button (`components.tsx`)

```tsx
behavior = "smooth",
direction = "end",
type = "button",
inert: !isActive,
tabIndex: isActive ? tabIndex : -1,
event.currentTarget.blur()
```

`isActive` reads the store's `state.end` (or `state.start` for direction start) through `useSyncExternalStore`, and `data-active` is `"true"` or `"false"` from it. A press, when active and not `defaultPrevented`, calls `scrollToEnd({ behavior })` or `scrollToStart({ behavior })` after the `blur()`. The file has no `aria-label`, no `aria-controls`, no `data-direction` mapping and no `focus()` call.

### Edge rule (`types.ts`, `geometry.ts`, `use-message-scroller-controller.ts`)

```ts
// Default scrollEdgeThreshold. Sub-pixel tolerance so edge detection does not
// flicker across engines that round scrollTop differently.
const DEFAULT_SCROLL_EDGE_THRESHOLD = 8
end: contentBottom - viewport.scrollTop - viewport.clientHeight > scrollEdgeThreshold,
```

`contentBottom` comes from the item rects and block padding, not `scrollHeight`. The controller publishes `{ ...nextState, end: false }` while following, so the button is inactive while the view follows. `behavior` is typed `ScrollBehavior` ("Native scroll behavior").

### Viewport and Content (`components.tsx`, `README.md`)

`aria-label={ariaLabel ?? "Messages"}`, `role={role ?? "region"}`, `tabIndex={tabIndex ?? 0}` on the Viewport; `role={role ?? "log"}`, `aria-relevant={ariaRelevant ?? "additions"}` on the Content, with no `aria-live` and no `aria-busy` set by the file. README parts row for the button: "Scroll-to-end/start affordance; auto-hides when caught up"; notable prop `direction`.

### Not read or not stated

Where focus lands after `blur()` is not set by the file (the browser decides). The README does not define "caught up". Tests (`message-scroller.test.tsx`, browser tests) were not read.

## Why it matters for ORIVILO

ORV-217's spec v1.0 sets instant scroll, a 32 px slack (`FOLLOW_SLACK`, W1) and focus to the textarea after a press (`latest-press-1`, `docs/specs/ORV-217/spec.md`). This primitive records another set of choices on the same three points: smooth by default, 8 px, and blur with no focus target.
