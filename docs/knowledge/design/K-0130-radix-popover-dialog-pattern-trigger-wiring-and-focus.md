---
id: K-0130
topic: design
claim: shadcn/ui Popover is "triggered by a button" with parts Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle and PopoverDescription; Radix Popover "Adheres to the Dialog WAI-ARIA design pattern", defaults to modal false, toggles on Space and Enter and closes on Esc back to the trigger; its source gives the trigger type button, aria-haspopup dialog, aria-expanded and aria-controls only while open, gives the content role dialog, does not trap focus when non-modal, and returns focus to the trigger on close only when the user did not interact outside.
source: "https://ui.shadcn.com/docs/components/popover; https://www.radix-ui.com/primitives/docs/components/popover; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/popover/src/popover.tsx"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-211]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: Radix docs and source agree; shadcn adds layout parts only. Source read on `main`, no commit hash shown.

### shadcn/ui Popover

> Displays rich content in a portal, triggered by a button.

Parts: Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription. Examples: Basic, Align, With Form, RTL. "Use the `align` prop on `PopoverContent` to control the horizontal alignment" (Start, Center, End). Versions: Base UI, React Aria, Radix UI; the API defers to "the Base UI Popover documentation". No accessibility or keyboard notes on the page.

### Radix Popover docs

> Adheres to the Dialog WAI-ARIA design pattern

Keyboard: `Space` and `Enter` "Opens/closes the popover."; `Tab` and `Shift + Tab` move focus; `Esc` "Closes the popover and moves focus to `Popover.Trigger`." Root `modal` is `boolean`, default `false`. Content has `onOpenAutoFocus`, `onEscapeKeyDown`, `onInteractOutside`. The page lists `[data-state]` on the trigger and no aria attribute.

### Radix Popover source

```tsx
aria-haspopup="dialog"
aria-expanded={context.open}
aria-controls={context.open ? context.contentId : undefined}
if (!hasInteractedOutsideRef.current) context.triggerRef.current?.focus();
onMountAutoFocus={onOpenAutoFocus}
trapped={trapFocus}
```

The trigger also has `type="button"` and `data-state`; the content has `role="dialog"` and `id={context.contentId}`. The non-modal content passes `trapFocus={false}`. `onOpenAutoFocus` is passed through to `FocusScope` in the non-modal case; the file read does not show where `FocusScope` puts focus on mount.

## Why it matters for ORIVILO

Our Popover is this primitive (`packages/design-system/src/components/popover/Popover.tsx`). It is the click-opened, keyboard-reachable route for an evidence card, with the dialog wiring given by the primitive rather than by hand.
