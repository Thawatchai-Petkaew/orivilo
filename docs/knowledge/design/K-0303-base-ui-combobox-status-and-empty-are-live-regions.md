---
id: K-0303
topic: design
claim: Base UI's Combobox.Status and Combobox.Empty each render a div with role status, aria-live polite and aria-atomic true whose root must stay mounted, Empty showing its children only when the filtered list is empty, and its list is a listbox (or grid) with aria-multiselectable true in multiple mode.
source: "https://base-ui.com/react/components/combobox; https://raw.githubusercontent.com/mui/base-ui/master/packages/react/src/combobox/status/ComboboxStatus.tsx; https://raw.githubusercontent.com/mui/base-ui/master/packages/react/src/combobox/empty/ComboboxEmpty.tsx; https://raw.githubusercontent.com/mui/base-ui/master/packages/react/src/combobox/list/ComboboxList.tsx; docs/knowledge/design/K-0114-wai-aria-1-2-role-status-is-a-polite-live-region.md; packages/design-system/src/components/command-menu/CommandMenu.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; source files are read on `master`, not pinned to a commit. The license file was not read, so this entry is `link-only`. Nothing here was run in a browser or with a screen reader.

> Displays a status message whose content changes are announced politely to screen readers.

> This component's root element must remain mounted in the DOM to announce changes consistently across screen readers.

> Renders its children only when the list is empty.

> Requires the `items` prop on the root component.

```ts
role: 'status',
'aria-live': 'polite',
'aria-atomic': true,
```

```ts
const children = filteredItems.length === 0 ? childrenProp : null;
```

- The first code lines were read in `ComboboxStatus.tsx` and in `ComboboxEmpty.tsx`.
- Docs advice: do not use `display: none`, `hidden`, `aria-hidden` or conditional rendering on the part itself. "Prefer updating or conditionally rendering its children instead."
- `ComboboxList.tsx`: `role: grid ? 'grid' : 'listbox'`; `aria-multiselectable` is `'true'` when `selectionMode === 'multiple'`, otherwise omitted.
- Parts on the page: Root, Label, InputGroup, Input, Trigger, Icon, Clear, Value, Chips, Chip, ChipRemove, Portal, Backdrop, Positioner, Popup, Arrow, Status, Empty, List, Row, Item, ItemIndicator, Separator, Group, GroupLabel, Collection.
- Root props: `filter`, `filteredItems`, `items`, `multiple` (default `false`), `autoHighlight` (default `false`), `loopFocus` (default `true`), `openOnInputClick` (default `true`), `modal` (default `false`), `virtualized` (default `false`), `limit`, `locale` ("Defaults to the user's runtime locale.").

## Why it matters for ORIVILO

Status and Empty are what shadcn's Combobox rests on, and they fit the role status record in [[K-0114-wai-aria-1-2-role-status-is-a-polite-live-region]]. ORIVILO's CommandMenu keeps a mounted count line the same way (`CommandMenu.tsx` lines 241 to 243).
