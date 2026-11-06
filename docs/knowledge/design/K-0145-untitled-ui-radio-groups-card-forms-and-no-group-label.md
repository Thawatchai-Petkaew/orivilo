---
id: K-0145
topic: design
claim: Untitled UI React's Radio groups page is a separate set of card-style one-of-a-list components taking an `items` array and sizes sm (default) and md, with disable set per item and no visible group label; the page names no invalid, required or hover state, and its component files and API table were not read.
source: "https://www.untitledui.com/react/components; https://www.untitledui.com/react/components/radio-groups"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-221]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. Confidence 0.75, not 0.8: only the page text was read. The API reference renders as a placeholder, and a guess at the source path (`components/base/radio-groups/radio-groups.tsx`) returned 404, so the component files were not read.

> Powerful and customizable React radio group components built for modern applications and websites.

> Every variant supports `"sm"` and `"md"` through the `size` prop.

> Set `disabled: true` on an item to disable it.

> `RadioGroupCheckbox` uses a checkbox-style indicator, but it still behaves as a radio group.

> The components don't render a visible group label, so pass `aria-label` as the examples do

> Keyboard support comes from React Aria: Tab moves focus into the group and the arrow keys change the selection.

- Install: `npx untitledui@latest add radio-groups`.
- Examples: Icon simple, Icon card, Avatar, Payment icon, Radio button, Checkbox.
- Components: `RadioGroupIconSimple`, `RadioGroupIconCard`, `RadioGroupAvatar`, `RadioGroupPaymentIcon`, `RadioGroupRadioButton`, `RadioGroupCheckbox`.
- `items`: most forms use `value`, `title`, `secondaryTitle`, `description` and `icon`; `RadioGroupAvatar` uses `id`, `name`, `username`, `title` and `avatarUrl`; `RadioGroupPaymentIcon` uses `value`, `title`, `description` and a `logo` node.
- `size` default is `"sm"`; `"md"` uses larger text, indicators and icons.
- Selection: `defaultValue`, or `value` with `onChange`. The value is the item's `value`, or its `id` for `RadioGroupAvatar`.
- `className` default is `flex flex-col gap-3`, merged with `tailwind-merge`.
- The words invalid, error, required and hover do not appear on the page. Hover, focus and checked looks are not described.

## Why it matters for ORIVILO

The envelope names radio button, radio group and toggle pages. This entry is the radio group page, kept apart from K-0144 because it is a different component set; a choice-card form would come from here and from K-0147.
