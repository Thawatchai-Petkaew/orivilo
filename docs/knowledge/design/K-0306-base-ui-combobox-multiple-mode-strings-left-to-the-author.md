---
id: K-0306
topic: design
claim: Base UI ships no screen reader strings for chips: its docs ask the author to add aria-description on Chip and Input and aria-label on Chips and ChipRemove and to translate them, its ChipRemove source sets no aria attribute, and in multiple mode selecting an item clears the typed filter and closes the popup when the input sits outside it.
source: "https://base-ui.com/react/components/combobox; https://raw.githubusercontent.com/mui/base-ui/master/packages/react/src/combobox/chip-remove/ComboboxChipRemove.tsx; AGENTS.md; packages/design-system/src/i18n/messages/en.ts; packages/design-system/src/i18n/messages/th.ts"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes; the source file is read on `master`, not pinned to a commit. Nothing here was run with a screen reader.

> In order for screen readers to announce how to reach and remove the chips, add `aria-description` to `<Combobox.Chip>` and `<Combobox.Input>`, alongside the `aria-label` on `<Combobox.Chips>` and `<Combobox.ChipRemove>`. Base UI does not ship these strings. Translate them together with the rest of your interface.

> In `multiple` mode, selecting an item clears the typed filter and closes the popup when the input is rendered outside it.

> Visible chips can be limited by slicing the selected values rendered in `<Combobox.Value>`:

```tsx
aria-description="Press Backspace or Delete to remove"
```

- The sample's input description, when items are chosen: `` `${value.length} selected. From the start of the input, press Left Arrow to focus the selected items` ``.
- `ComboboxChipRemove.tsx` sets no `aria-*`; a name has to come from the caller.
- Other headings on the page: "Keeping the filter after selection", "Limiting visible chips", "Input inside popup", "Virtualized".
- Name of a form control: label it with a native `<label>` or `<Field.Label>`, or use `aria-label`.

## Why it matters for ORIVILO

Every UI string here comes from the locale catalog in Thai and English (`AGENTS.md`), and these strings would join it. ORIVILO's `tag.remove` already names a remove button ("Remove {label}", "ลบ {label}").
