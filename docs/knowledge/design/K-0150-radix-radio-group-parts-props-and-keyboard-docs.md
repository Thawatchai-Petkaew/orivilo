---
id: K-0150
topic: design
claim: Radix's Radio Group docs give Root, Item and Indicator with `value`, `disabled`, `required`, `name`, `orientation`, `dir` and `loop` (default true), `data-state` and `data-disabled`, a Tab, Space and arrow key table, and one accessibility sentence naming the WAI-ARIA pattern and roving tabindex; they say nothing on labelling, and the ArrowUp and ArrowLeft rows do not say the item is checked.
source: "https://www.radix-ui.com/primitives/docs/components/radio-group"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The docs page is not versioned; K-0151 reads the build the repo pins.

> Adheres to the Radio Group WAI-ARIA design pattern and uses roving tabindex to manage focus movement among radio items.

> Supports horizontal/vertical orientation.

Rows of the Keyboard Interactions table:

- Tab: "Moves focus to either the checked radio item or the first radio item in the group."
- Space: "When focus is on an unchecked radio item, checks it."
- ArrowDown and ArrowRight, each: "Moves focus and checks the next radio item in the group."
- ArrowUp and ArrowLeft, each: "Moves focus to the previous radio item in the group."

Parts and notes:

- Root props: `asChild`, `defaultValue`, `value`, `onValueChange`, `disabled`, `name`, `required`, `orientation`, `dir`, `loop` (default `true`). Data attribute: `data-disabled`.
- Item props: `asChild`, `value`, `disabled`, `required`. Data attributes: `data-state` (`checked`, `unchecked`), `data-disabled`. Inside a form the Item also renders an input.
- Indicator props: `asChild`, `forceMount`. It renders when the item is checked. Data attributes as for Item.
- Parts prefixed `unstable_` (`unstable_ItemProvider`, `unstable_ItemTrigger`, `unstable_ItemBubbleInput`) decouple the hidden input; the docs warn "their API may change in a future release."
- The page does not mention labelling, `aria-label`, `aria-labelledby` or `aria-invalid`, and its demo has no `label` element.

## Why it matters for ORIVILO

Behaviour in our package comes from `radix-ui`. This is the public API a RadioGroup story would read; the group's name and invalid state are not in it, so they stay our work.
