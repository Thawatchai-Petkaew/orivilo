---
id: K-0290
topic: design
claim: Untitled UI React's Select page shows the examples Default, Disabled, Sizes, Icon leading, Avatar leading, Dot leading, Search and Tags, sizes sm, md (default) and lg, disabled, required and invalid states, and items with an icon, avatar, supporting text and a checkmark, checkbox or no selection indicator; Select itself is single selection, and neither the page nor select.tsx handles loading or an empty options list.
source: "https://www.untitledui.com/react/components; https://www.untitledui.com/react/components/select; https://www.untitledui.com/react/components/select.md; https://raw.githubusercontent.com/untitleduico/react/main/components/base/select/select.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/select/select-item.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/select/select-shared.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; source files are read on `main`, not pinned to a commit. The page's API reference renders only as `<ApiReference slug="select" />`, so its props table was not read; the props below come from the FAQ and the source. Nothing here was run in a browser or with a screen reader.

> To disable one option, pass `isDisabled` to that `Select.Item` and it is skipped by the keyboard and can't be selected.

> For selections shown as removable tags, use `TagSelect` from `tag-select.tsx` as in the Tags example

> For a dropdown with checkboxes, use the [multi-select](/react/components/multi-select) component.

- Index: "Select" and "Multi select" have their own pages; the list has no entry named combobox, autocomplete or search.
- Variants: no `variant` prop is named. The eight examples are listed in the claim.
- Sizes: `size` `sm`, `md`, `lg`, default `md`.
- States: `isDisabled` on the field (trigger `cursor-not-allowed opacity-50`) or on one item; `isRequired` adds an asterisk, `hideRequiredIndicator` removes it; `isInvalid` turns the hint to the error style. Focused or open: trigger `ring-2 ring-brand`.
- Field slots: `label`, `hint`, `tooltip` (a help icon beside the label), `icon` (fallback leading icon in the trigger), `placeholder` (default `"Select"`).
- `SelectItemType`: `id` (required), `label`, `avatarUrl`, `isDisabled`, `supportingText`, `icon`.
- Item source: `icon` renders with `data-icon`; `avatarUrl` renders `Avatar` at `xs` and wins over `icon` (page FAQ); `supportingText` is `AriaText slot="description"`; a dot is an element passed as `icon`.
- `selectionIndicator` is `"checkmark"` (default), `"checkbox"` or `"none"`; `selectionIndicatorAlign` is `"left"` or `"right"` (default `"right"`).
- Item states: `state.isFocusVisible` adds `ring-2 ring-focus-ring ring-inset`; `state.isDisabled` adds `cursor-not-allowed opacity-50`.
- Value: `value` and `onChange` or `defaultValue`; `selectedKey` and `onSelectionChange` are deprecated.
- ARIA in these files: only `aria-hidden="true"` on the chevron, avatar, icon and check; roles come from React Aria.
- Loading: not mentioned on the page; none in `select.tsx`. Empty options list: no special handling in `select.tsx`.

## Why it matters for ORIVILO

This is the Untitled UI row's starting point for both tables in [[K-0319-synthesis-combobox-and-multi-select-benchmark]]: search and multiple selection sit in separate components, not in `Select`.
