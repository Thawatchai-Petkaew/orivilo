---
id: K-0129
topic: design
claim: shadcn/ui and Radix both describe Hover Card as "For sighted users to preview content available behind a link"; Radix states its content "will be inaccessible to keyboard users" and is "Ignored by screen readers", and its source opens on non-touch pointer enter and on focus, closes on pointer leave and blur, sets no role or aria attribute, takes every tabbable inside the content out of the tab order, and defaults to a 700 ms open and 300 ms close delay.
source: "https://ui.shadcn.com/docs/components/hover-card; https://www.radix-ui.com/primitives/docs/components/hover-card; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/hover-card/src/hover-card.tsx"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-211]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: the Radix docs and source agree; shadcn repeats the Radix description. Source read on `main`, no commit hash shown.

### shadcn/ui Hover Card

> For sighted users to preview content available behind a link.

Parts `HoverCard`, `HoverCardTrigger`, `HoverCardContent`. The page offers Base UI, React Aria and Radix UI versions and points to Base UI for the full API; its example uses `delay={100}` and `closeDelay={200}` on the trigger and `side="top"`, `align="start"` on the content. No accessibility or keyboard text beyond the description.

### Radix Hover Card docs

> The hover card is intended for sighted users only, the content will be inaccessible to keyboard users.

Features list: "Ignored by screen readers." Keyboard table: `Tab` "Opens/closes the hover card."; `Enter` "Opens the hover card link". Root `openDelay` default `700`, `closeDelay` default `300`. Trigger: "The link that opens the hover card when hovered."

### Radix Hover Card source

```tsx
<Primitive.a
excludeTouch(context.onClose))}
onFocus={composeEventHandlers(props.onFocus, context.onOpen)}
onBlur={composeEventHandlers(props.onBlur, context.onClose)}
tabbables.forEach((tabbable) => tabbable.setAttribute('tabindex', '-1'));
```

Pointer enter opens through `excludeTouch(context.onOpen)`, so touch does not open it. The only state attribute on trigger and content is `data-state`; the fetch tool reported no role or `aria-*` on either.

## Why it matters for ORIVILO

AI Elements' citation card is this primitive (K-0127), so its carousel arrows and any link in the card are out of the tab order and a touch user cannot open it. An evidence card whose quote and source are the point cannot rest on content that is meant to be skipped.
