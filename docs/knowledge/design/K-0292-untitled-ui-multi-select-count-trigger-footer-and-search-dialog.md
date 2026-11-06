---
id: K-0292
topic: design
claim: Untitled UI's MultiSelect is a button that opens a popover dialog holding a search field and a multiple-selection listbox; its trigger shows a count and never the chosen labels, so a chosen item has no remove control of its own, the footer's Reset and Select all do nothing until the caller wires them, the empty state has a title, a description and a Clear search button, and the file has no loading state.
source: "https://www.untitledui.com/react/components/multi-select; https://www.untitledui.com/react/components/multi-select.md; https://raw.githubusercontent.com/untitleduico/react/main/components/base/select/multi-select.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/select/select.demo.tsx; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; source files are read on `main`, not pinned to a commit. The page's API reference renders only as `<ApiReference slug="multi-select" />`, so the props below come from the FAQ and the source. Nothing here was run in a browser or with a screen reader.

> The dropdown footer renders by default (`showFooter` defaults to `true`)

> A button whose callback is omitted still renders but does nothing.

> Use controlled state, because the trigger's count is read from `selectedKeys` only

> The trigger drops to 50% opacity and can no longer open the popover.

```tsx
onReset={() => setSelectedKeys(new Set())}
```

- Examples: Multi-select example, Default, With leading icon, Disabled, Sizes. Install: `npx untitledui@latest add select`.
- Sizes: `sm`, `md` (default), `lg`; the size also scales the search field and the footer buttons.
- Props in the file: `items`, `children`, `selectedKeys`, `defaultSelectedKeys`, `onSelectionChange`, `isDisabled`, `isRequired`, `isInvalid`, `popoverClassName`, `className`, `onReset`, `onSelectAll`, `showFooter` (default `true`), `showSearch` (default `true`), `emptyStateTitle`, `emptyStateDescription`, `selectedCountFormatter` (default `"{count} selected"`), `supportingText`, `icon`. `placeholder` defaults to `"Select"`.
- Structure: `AriaButton` trigger, `AriaDialogTrigger`, a popover with `<AriaDialog className="outline-hidden">`, `AriaAutocomplete` with the `contains` filter, `AriaSearchField` with `aria-label="Search"` and `autoFocus`, and a listbox with `selectionMode="multiple"` and `aria-label={label || "Options"}`.
- Trigger: the count (`Set.size`, or the item count for `"all"`) through `selectedCountFormatter`, then `supportingText`, or the placeholder when nothing is chosen. No chosen label is shown.
- Removal: no per-item control in the file. An item is unchosen in the listbox; the footer's Reset clears what the caller's `onReset` clears.
- Checkbox: `multi-select.tsx` sets no indicator and `MultiSelect.Item` is `SelectItem` unchanged, so its default is the checkmark ([[K-0290-untitled-ui-select-sizes-states-and-item-slots]]); the demos repeat `selectionIndicator="checkbox" selectionIndicatorAlign="left"` on each item.
- Empty: `renderEmptyState` returns `MultiSelectEmptyState`, title default "No results found", description default "Please try a different search term.", and a "Clear search" link button passed only when the search value is non-empty. It shows on no search results or an empty `items` array.
- Keyboard and accessibility: the page states neither; the file has no key handlers and leaves them to React Aria.
- Loading: no prop, spinner or state in the file, and nothing on the page.

## Why it matters for ORIVILO

This is one of Untitled UI's two multi-select forms; [[K-0293-untitled-ui-tag-select-removal-keys-and-focus]] is the other. Row 25 of the ORV-64 build order names tag entry, which this count-only form does not show.
