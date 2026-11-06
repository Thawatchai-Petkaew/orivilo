---
id: K-0299
topic: design
claim: shadcn/ui's Combobox page gives the parts Combobox, Input, Content, Empty, List, Item, Group, Label, Collection, Separator, Chips, Chip, ChipsInput, Value, Trigger and Clear and the examples Basic, Multiple, Clear Button, Groups, Custom Items, Invalid, Disabled, Auto Highlight, Popup, Input Group and RTL; it names no size prop, no Async example and no keyboard text.
source: "https://ui.shadcn.com/docs/components/radix/combobox; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/radix/combobox.mdx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/combobox.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/combobox.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; registry files are read on `main`, not pinned to a commit. The page has no props table; the example code on the page was cut off in what the fetch returned. Nothing here was run in a browser or with a screen reader.

> Autocomplete input with a list of suggestions.

> Use the `showClear` prop to show a clear button.

> Use the `autoHighlight` prop to automatically highlight the first item on filter.

> Use the `aria-invalid` prop to make the combobox invalid.

> You can trigger the combobox from a button or any other component by using the `render` prop.

- Props on the page: `items`, `itemToStringValue`, `multiple`, `value`, `onValueChange`, `showClear`, `aria-invalid`, `disabled`, `autoHighlight`, `render`, `placeholder`.
- `ComboboxInput`: `showTrigger` (default `true`), `showClear` (default `false`), `disabled` (default `false`).
- `ComboboxContent`: `side` `"bottom"`, `sideOffset` `6`, `align` `"start"`, `alignOffset` `0`, `anchor`.
- `ComboboxItem`: a check through `ItemIndicator`; `data-highlighted:bg-accent`. `ComboboxClear`: a ghost `icon-xs` `InputGroupButton`.
- Slots: `data-slot` on each part; `InputGroupAddon` inside `ComboboxInput` for an addon ("Input Group" example).
- Empty: `ComboboxEmpty`, sample text "No items found."; class `hidden ... group-data-empty/combobox-content:flex`, so CSS shows it when the content is empty.
- RTL: an Arabic example and a pointer to the RTL guide.
- Sizes: no size prop on the page or in the parts read.
- Keyboard and ARIA: no statement on the page beyond `aria-invalid`; neither registry file sets `aria-*` or key handlers.
- Async: no example; the example file's multiple sample has no async code.

## Why it matters for ORIVILO

This is the shadcn/ui row of the Combobox table. Its states, keyboard and async behaviour have to be read one layer down, in Base UI ([[K-0303-base-ui-combobox-status-and-empty-are-live-regions]], [[K-0304-base-ui-combobox-async-search-sample]]).
