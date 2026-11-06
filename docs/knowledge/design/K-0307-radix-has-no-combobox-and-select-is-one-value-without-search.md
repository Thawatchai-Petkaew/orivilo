---
id: K-0307
topic: design
claim: Radix Primitives' packages/react folder listing has no combobox, listbox or autocomplete package and its Combobox request (issue 1342) was closed with no written maintainer statement on the page; Radix Select takes one value, has role combobox with aria-autocomplete none on its trigger and type-ahead, and has no multiple option and no text input for filtering.
source: "https://github.com/radix-ui/primitives/tree/main/packages/react; https://github.com/radix-ui/primitives/issues/1342; https://www.radix-ui.com/primitives/docs/components/select; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/select/src/select.tsx; packages/design-system/package.json; packages/design-system/src/components/select/Select.tsx"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-228]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the source file is read on `main`, not pinned to a commit and not matched to the `radix-ui` 1.8.1 ORIVILO installs. Confidence 0.75, not 0.8: most of the claim is an absence, and the folder page ends with "View all files". Nothing here was run in a browser or with a screen reader.

> Adheres to the ListBox WAI-ARIA design pattern.

> See the W3C Select-Only Combobox example for more information.

> Typeahead support.

```tsx
aria-autocomplete="none"
```

```tsx
aria-selected={isSelected && isFocused}
```

- Packages: the listing includes `select`, `popover`, `menu`, `dialog` and `collection`.
- Issue 1342, "[New Primitive] `Combobox`": "closed this as completed" on January 25, 2025, then locked. The page shows no written maintainer comment; the latest community comment read, from November 21, 2024, points to shadcn's Combobox.
- Select parts: Root, Trigger, Value, Icon, Portal, Content, ScrollUpButton, ScrollDownButton, Viewport, Item, ItemText, ItemIndicator, Group, Label, Separator, Arrow.
- Keys (paraphrased table): Space and Enter open from the Trigger and select on an item; ArrowDown and ArrowUp open from the Trigger and move on an item; Esc closes and returns focus to the Trigger.
- Source: trigger `role="combobox"`, `aria-controls` only while open, `aria-expanded={context.open}`; content `role="listbox"`; item `role="option"`. A code comment ties the `aria-selected` form to VoiceOver stutter.
- Type-ahead: a printable key calls `handleTypeaheadSearch(event.key)`; the string resets one second after the last key.
- `SelectProps` takes one `value` string, with no `multiple`. The only rendered `select` is a hidden form element. Multi-select and search are not mentioned on the page.

## Why it matters for ORIVILO

`Select.tsx` wraps this primitive, so it is the select-only form of [[K-0308-wai-aria-apg-combobox-kinds-and-autocomplete-forms]]. Search and multiple values have no Radix part to wrap, which is the gap behind the primitive question in [[K-0319-synthesis-combobox-and-multi-select-benchmark]].
