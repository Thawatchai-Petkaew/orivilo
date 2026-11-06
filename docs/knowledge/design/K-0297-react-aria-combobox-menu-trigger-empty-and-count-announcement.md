---
id: K-0297
topic: design
claim: React Aria's ComboBox, the base under Untitled UI's, defaults menuTrigger to "input" with "focus" and "manual" as the other values, offers allowsEmptyCollection and allowsCustomValue, can show multiple selection through a TagGroup value, and its useComboBox hook announces the option count while open when the count changes.
source: "https://react-aria.adobe.com/ComboBox; https://react-aria.adobe.com/TagGroup; https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/combobox/useComboBox.ts; https://github.com/adobe/react-spectrum/tree/main/packages/react-aria/src; docs/adr/0003-shadcn-behavior-own-visual-layer.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the source file is read on `main`, not pinned to a commit and not matched to the version Untitled UI installs. `https://react-spectrum.adobe.com/react-aria/ComboBox.html` redirects to the first URL. Nothing here was run in a browser or with a screen reader.

> `input` (default): popover opens when the user edits the input text.

> `focus`: popover opens when the user focuses the input.

> `manual`: popover only opens when the user presses the trigger button or uses the arrow keys.

> Use `allowsEmptyCollection` to keep the popover open when there are no items available in the list.

> Use the `ComboBoxValue` render prop function to display the selected items as a TagGroup.

```ts
if (state.isOpen && (didOpenWithoutFocusedItem || optionCount !== lastSize.current)) {
```

- `allowsCustomValue`: "Set the `allowsCustomValue` prop to enable entering values that are not in the list." Without it: "By default, the value will be reverted to the selected item on blur."
- `selectionMode` default `'single'`.
- Async: the page says only that ComboBox supports "asynchronous loading" as a ListBox feature; `loadingState`, `useAsyncList`, `ListBoxLoadMoreItem` and `onLoadMore` did not appear in what was read.
- Keyboard: little on the page beyond arrow keys under `manual` and `shouldFocusWrap`, "Whether keyboard navigation is circular."
- Hook: `'aria-autocomplete': 'list'`, `'aria-controls': state.isOpen ? menuProps.id : undefined`, `'aria-activedescendant': focusedItem ? getItemId(state, focusedItem.key) : undefined`.
- Hook announcements: the count through `countAnnouncement` under the condition above, where `didOpenWithoutFocusedItem` is true on opening with no focused item or on an Apple device; a group change through `focusAnnouncement` and the selected option through `selectedAnnouncement`, both on Apple devices only.
- TagGroup page: `renderEmptyState` "Provides content to display when there are no items in the tag list."; `onRemove` "Handler that is called when a user deletes a tag." The page does not name Delete or Backspace, arrow keys, focus after removal or a grid role.

## Why it matters for ORIVILO

Untitled UI's components inherit these behaviours, and its `menuTrigger="focus"` overrides the default. ADR 0003 item 5 keeps React Aria out of ORIVILO, so this entry explains the Untitled row and is not a building option.
