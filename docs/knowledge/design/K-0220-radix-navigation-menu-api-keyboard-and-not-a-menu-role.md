---
id: K-0220
topic: design
claim: Radix Navigation Menu has parts Root, Sub, List, Item, Trigger, Content, Link, Indicator and Viewport with delayDuration 200, skipDelayDuration 300 and orientation horizontal; it does not use the WAI-ARIA menu role and points to the W3C Disclosure Navigation example, and it asks for NavigationMenu.Link on every link because its active prop sets aria-current.
source: "https://www.radix-ui.com/primitives/docs/components/navigation-menu"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

> Flexible layout structure with managed tab focus.

> Supports submenus.

> Optional active item indicator.

> Adheres to the navigation role requirements.

The Accessibility section, in the tool's wording: the component does not use the `menu` role because menus and menubars have composite focus management and first-character navigation, which the docs consider unnecessary for website navigation.

Props read:

- Root: `defaultValue`, `value`, `onValueChange`, `delayDuration` (200), `skipDelayDuration` (300), `dir`, `orientation` ("horizontal").
- Sub: `defaultValue`, `value`, `onValueChange`, `orientation` ("horizontal").
- Content: `onEscapeKeyDown`, `onPointerDownOutside`, `onFocusOutside`, `onInteractOutside`, `forceMount`.
- Link: `active` (false), `onSelect`, `asChild`. Indicator and Viewport: `forceMount`.

Keys read:

- Space, Enter: opens content when focus is on a Trigger.
- Tab: moves to the next focusable element.
- ArrowDown: horizontal, enters open Content from an open Trigger; otherwise the next Trigger or Link.
- ArrowUp: the previous Trigger or Link.
- ArrowRight, ArrowLeft: vertical, enters open Content from an open Trigger; otherwise next or previous.
- Home, End: the first or last Trigger or Link.
- Esc: closes open Content and returns focus to its Trigger.

Also read:

- Data attributes: `data-orientation`, `data-state`, `data-disabled`, `data-motion`, `data-active`.
- Variables: `--radix-navigation-menu-indicator-translate-x`, `-y`, `--radix-navigation-menu-viewport-width`, `-height`.
- Examples: vertical, flexible layouts, indicator, submenus (a Sub needs a `defaultValue`), client-side routing with `asChild` and `active`, advanced animation.
- The page says nothing on small screens or touch.

## Why it matters for ORIVILO

This primitive follows the disclosure route the APG example shows, and its arrow, Home and End keys are the ones that example marks as optional (K-0229).
