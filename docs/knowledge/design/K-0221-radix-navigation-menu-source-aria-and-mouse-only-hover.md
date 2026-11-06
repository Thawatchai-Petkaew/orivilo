---
id: K-0221
topic: design
claim: Radix NavigationMenu's source renders a nav with a default aria-label "Main" that props can override, a Trigger button with aria-expanded and aria-controls only while open, a Link that sets aria-current page and data-active when active, opens on hover for mouse pointers only, and returns focus to the trigger on dismiss only if focus was in the content.
source: "https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/navigation-menu/src/navigation-menu.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes; two reads of the file.

```tsx
<Primitive.nav
  aria-label="Main"
  data-orientation={orientation}
  dir={direction}
  {...NavigationMenuProps}
  ref={composedRef}
/>
```

`aria-label` comes before the spread, so a passed `aria-label` replaces it.

```tsx
aria-expanded={open}
aria-controls={open ? contentId : undefined}
data-state={getOpenState(open)}
```

```tsx
data-active={active ? '' : undefined}
aria-current={active ? 'page' : undefined}
{...linkProps}
```

```ts
(event) => (event.pointerType === "mouse" ? handler(event) : undefined);
if (content.contains(document.activeElement)) triggerRef.current?.focus();
```

- The List is `Primitive.ul`; `NavigationMenuSub` is `Primitive.div`, so a Sub adds no second `nav`.
- Content has `id={contentId}` and `aria-labelledby={triggerId}`.
- While an item is open, a visually hidden focus proxy renders with `aria-hidden` and `tabIndex={0}`.
- A click on a Link fires `LINK_SELECT`, then `ROOT_CONTENT_DISMISS` unless the select event was prevented or `metaKey` is held.
- Defaults: `delayDuration = 200`, `skipDelayDuration = 300`. Previous-item key: `ArrowLeft`, or `ArrowRight` in RTL.

## Why it matters for ORIVILO

Of the code read for this question, this is the one that wires the landmark, its name, `aria-expanded` and `aria-current` by itself. "Main" is an English default, so a Thai and English catalog names it through the prop.
