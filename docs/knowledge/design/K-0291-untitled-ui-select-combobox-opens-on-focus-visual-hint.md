---
id: K-0291
topic: design
claim: Untitled UI's Select.ComboBox hard-codes React Aria's menuTrigger to "focus", so its list opens as soon as the input takes focus; it shows an aria-hidden ⌘K hint with no key listener unless shortcut is false, and its file has no loading state and no text for an empty result.
source: "https://www.untitledui.com/react/components/select; https://raw.githubusercontent.com/untitleduico/react/main/components/base/select/combobox.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the source file is read on `main`, not pinned to a commit. The page has no section for `Select.ComboBox`, only FAQ text and the "Search" example. Nothing here was run in a browser or with a screen reader.

> opens its list as soon as the input is focused

> It also shows a `⌘K` hint on the right by default, which is only a visual label with no shortcut wired up

- Props in the file: `placeholder` (default `"Search"`), `shortcut` (default `true`), `size` (default `"md"`), `items`, `children`, `icon` (overrides the search icon), `shortcutClassName`, `popoverClassName`, `hideRequiredIndicator`, plus React Aria's `ComboBoxProps` other than `children` and `items`, including `label`, `hint`, `tooltip`, `isRequired`, `isInvalid`.
- `menuTrigger` is hard-coded to `"focus"`.
- Built from `ComboBox`, `Group`, `Input`, `ListBox` and `ComboBoxStateContext` of `react-aria-components`.
- Slots: leading icon (default `SearchLg`), the input, an optional shortcut hint, a popover with a listbox, `HintText`.
- The hint: `hidden md:flex`, `pointer-events-none`, `select-none`, `aria-hidden`. The file has no keyboard listener.
- Typed text: an `aria-hidden` overlay span renders the bold match and muted remainder while the input text is transparent; it renders only when `inputValue` is truthy.
- ARIA: no explicit `role` or `aria-*` on the input or listbox, only `aria-hidden` on decoration. Semantics come from React Aria ([[K-0297-react-aria-combobox-menu-trigger-empty-and-count-announcement]]).
- Not in the file: a loading prop, spinner or loading state; an empty-result or "no options" state.

## Why it matters for ORIVILO

The opening rule and the visual-only hint are two behaviours to weigh rather than assume. WCAG on a list that opens on focus is in [[K-0316-wcag-2-2-popup-opened-by-focus]].
