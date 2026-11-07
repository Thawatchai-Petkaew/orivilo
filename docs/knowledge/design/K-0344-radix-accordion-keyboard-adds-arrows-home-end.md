---
id: K-0344
topic: design
claim: Radix UI Accordion's keyboard table lists Space, Enter, Tab and Shift + Tab, and adds ArrowDown and ArrowUp (vertical), ArrowRight and ArrowLeft (horizontal), Home and End between triggers; its source skips disabled triggers, wraps at both ends and swaps left and right in RTL.
source: "https://www.radix-ui.com/primitives/docs/components/accordion; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/accordion/src/accordion.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool, `main` branch of `radix-ui/primitives` (no commit hash shown). Confidence 0.8: one publisher, docs page and source agree; not run.

### Docs page

> Adheres to the Accordion WAI-ARIA design pattern

- `Space`, `Enter`: "When focus is on an Accordion.Trigger of a collapsed section, expands the section."
- `Tab`: "Moves focus to the next focusable element."
- `Shift + Tab`: "Moves focus to the previous focusable element."
- `ArrowDown`: "Moves focus to the next Accordion.Trigger when orientation is vertical."
- `ArrowUp`: "Moves focus to the previous Accordion.Trigger when orientation is vertical."
- `ArrowRight`: "Moves focus to the next Accordion.Trigger when orientation is horizontal."
- `ArrowLeft`: "Moves focus to the previous Accordion.Trigger when orientation is horizontal."
- `Home`: "When focus is on an Accordion.Trigger, moves focus to the first Accordion.Trigger."
- `End`: "When focus is on an Accordion.Trigger, moves focus to the last Accordion.Trigger."

### Source

```tsx
const ACCORDION_KEYS = ["Home", "End", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
const triggerCollection = collection.filter(([, item]) => !item.element.disabled);
const isDirectionLTR = direction === Direction.LTR;
const clampedIndex = nextIndex % triggerCount;
```

Past the last trigger `nextIndex = homeIndex;`, before the first `nextIndex = endIndex;`. The fetch tool reported that in RTL the left and right handlers swap `movePrev()` and `moveNext()`.

## Why it matters for ORIVILO

The arrow, Home and End keys go beyond the APG page, which lists Enter, Space, Tab and Shift + Tab (K-0347). An Accordion on Radix gets them whether or not a spec asks for them, so its story has them to prove.
