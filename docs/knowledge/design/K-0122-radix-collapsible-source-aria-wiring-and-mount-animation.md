---
id: K-0122
topic: design
claim: In Radix's collapsible.tsx the Trigger renders a type="button" with aria-expanded, disabled and aria-controls pointing at a useId content id only while open; the Content stays out of the DOM when closed unless forceMount, is hidden when not open, measures its size with getBoundingClientRect into the two CSS variables, and skips the animation on first render when it starts open.
source: "https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/collapsible/src/collapsible.tsx"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-203]
license: MIT
---

## Evidence

Read on 2026-11-01 through a fetch tool, `main` branch of `radix-ui/primitives` (no commit hash shown, version not read). Confidence 0.8: one source file, quoted by the fetch tool line by line; not run.

### Trigger

```tsx
type="button"
aria-controls={context.open ? context.contentId : undefined}
aria-expanded={context.open || false}
data-state={getState(context.open)}
data-disabled={context.disabled ? '' : undefined}
disabled={context.disabled}
```

### Content

```tsx
contentId={useId()}
<Presence present={forceMount || context.open}>
const isOpen = context.open || isPresent;
id={context.contentId}
hidden={!isOpen}
const rect = node.getBoundingClientRect();
```

The style sets `--radix-collapsible-content-height` (and width) to the measured pixels. A ref starts as the open state (`const isMountAnimationPreventedRef = React.useRef(isOpen);`); until a `requestAnimationFrame` clears it, transition and animation durations are set to `0s` and `node.style.animationName = 'none';`.

## Why it matters for ORIVILO

The primitive already wires the APG attributes (K-0123), with one difference: `aria-controls` is dropped while closed, because the content is not mounted. A Collapsible on Radix gets this wiring for free; a page-open-on-load panel does not animate in.
