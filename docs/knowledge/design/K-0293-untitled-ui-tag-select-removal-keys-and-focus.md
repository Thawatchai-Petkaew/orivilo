---
id: K-0293
topic: design
claim: Untitled UI's TagSelect is a combobox that shows chosen items as tags before the input; a focused tag button removes on Space, Enter or Backspace but not Delete, arrows move between tags, a keyboard removal moves focus to a neighbour first while a pointer removal moves none, Backspace in an empty input moves to the previous tag without removing it, and the file has no loading state and no no-results text.
source: "https://www.untitledui.com/react/components/select; https://raw.githubusercontent.com/untitleduico/react/main/components/base/select/tag-select.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/select/select.demo.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; source files are read on `main`, not pinned to a commit. Nothing here was run in a browser or with a screen reader. The page says only that `TagSelect` is the choice for removable tags ([[K-0290-untitled-ui-select-sizes-states-and-item-slots]]); everything below is from the source.

```tsx
onPress={() => tagSelectContext.onRemove(new Set([value.id]))}
```

```tsx
if (isFirstTag) {
focusManager?.focusNext({ wrap: false, tabbable: false });
```

```tsx
const { contains } = useFilter({ sensitivity: "base" });
```

- Exports: `TagSelectBase`, `TagSelectTagsValue`, `TagSelect` (with `Item`).
- Props: `selectedItems` (a required `ListData` from `useListData` of `react-stately`), `children`, `items`, `label`, `tooltip`, `hint`, `size` (default `"sm"`), `placeholder` (default `"Search"`), `shortcut`, `icon` (default `SearchLg`), `popoverClassName`, `shortcutClassName`, `onItemInserted`, `onItemCleared`, `valueFormatter`.
- A chosen item: a `span` with an `Avatar`, a label and a `TagCloseX` ([[K-0294-untitled-ui-tag-close-x-size-and-one-fixed-name]]).
- `handleTagKeyDown`, on a focused tag button: `preventDefault` for every key except Tab. Space, Enter and Backspace remove the tag; ArrowLeft and ArrowRight move to the previous and next tag; Escape closes the dropdown. Delete is not handled anywhere in the file.
- `handleInputKeyDown`, acting at caret 0 with an empty input or on an empty value: Backspace and ArrowLeft focus the previous tag; ArrowRight focuses the next tag.
- Focus: a keyboard removal moves focus before removing, to the next element for the first tag and otherwise to the previous one. The `onPress` route moves no focus in this file.
- List: the `filter` callback leaves out chosen items and matches `item.label || item.supportingText`. Choosing an item calls `setFilterText("")`.
- Combobox: `menuTrigger="focus"`, `allowsEmptyCollection`.
- ARIA: the only `aria-*` in the file is `aria-hidden="true"` on the ⌘K hint.
- Not in the file: a loading prop, spinner, `isLoading` or `loadingState`; `renderEmptyState`; any no-results text. The popover can open on an empty list.

## Why it matters for ORIVILO

This is the nearest Untitled UI form to a multi-select with tags, and it answers how a chosen item is removed by keyboard. The Delete gap differs from what its own Tags page states for a TagGroup (K-0294).
