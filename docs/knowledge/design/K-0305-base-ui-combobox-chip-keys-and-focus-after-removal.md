---
id: K-0305
topic: design
claim: Base UI's chips sit outside the tab order; on a chip, Backspace or Delete removes it and moves focus to the chip now at that place, the new last chip or the input, while the remove button's press sends focus to the input, the previous-chip arrow from caret 0 reaches the last chip, and Backspace in an empty input removes the last chip at once.
source: "https://raw.githubusercontent.com/mui/base-ui/master/packages/react/src/combobox/chip/ComboboxChip.tsx; https://raw.githubusercontent.com/mui/base-ui/master/packages/react/src/combobox/chip-remove/ComboboxChipRemove.tsx; https://raw.githubusercontent.com/mui/base-ui/master/packages/react/src/combobox/utils/parts.ts; https://raw.githubusercontent.com/mui/base-ui/master/packages/react/src/combobox/input/ComboboxInput.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; source files are read on `master`, not pinned to a commit. The docs page describes no Backspace or arrow behaviour, so this is from the source. Nothing here was run in a browser or with a screen reader.

```ts
const nextIndex = index >= chipCount - 1 ? chipCount - 2 : index;
return nextIndex >= 0 ? nextIndex : undefined;
```

```ts
store.context.inputRef.current?.focus();
```

> Commit the removal before focusing so `chipsRef` reflects the remaining chips.

- Chip: `tabIndex: -1`; `'aria-disabled': disabled || undefined`; `'aria-readonly': readOnly || undefined`.
- On a chip, the previous-chip and next-chip keys come from `getChipNavigationKeys(direction)`: arrow keys that swap in `rtl`. From the first or last chip they go to the input.
- Backspace and Delete: remove, then focus `chipsRef.current[nextIndex]`, or the input when `nextIndex` is `undefined`.
- Enter, Space and a single printable character: focus the input. ArrowDown and ArrowUp: open the popup and focus the input.
- Remove button: a `<button>` with `tabIndex: -1`. `onMouseDown` calls `event.preventDefault()`. Enter or Space on it, or a click, calls `removeChip`, then focus goes to the input, not to a neighbour.
- Input: with chips and an empty input, `event.key === 'Backspace'` removes the last chip. The previous-chip key at caret 0 focuses the last chip.
- IME: `onCompositionStart`, `onCompositionEnd`, `isComposingRef`; an `event.which === 229` check returns early.

## Why it matters for ORIVILO

The question asks how a chosen item is removed. Base UI and Untitled UI differ on two points: Backspace in an empty input (removes here, moves focus in [[K-0293-untitled-ui-tag-select-removal-keys-and-focus]]) and Delete on a chip (handled here, not there). No standard read settles either ([[K-0313-wai-aria-apg-has-no-tag-or-multi-value-combobox-pattern]]).
