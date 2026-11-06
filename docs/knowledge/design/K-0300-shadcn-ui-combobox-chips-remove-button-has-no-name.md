---
id: K-0300
topic: design
claim: shadcn/ui's multi-select is Combobox with multiple, ComboboxChips, a ComboboxValue render function mapped to ComboboxChip, ComboboxChipsInput and a popup anchored by useComboboxAnchor; each chip has a ghost icon-xs remove button (showRemove default true), 24 px inside a 22 px high chip in the new-york-v4 file (own arithmetic), and neither the registry files nor the example give that button a name.
source: "https://ui.shadcn.com/docs/components/radix/combobox; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/combobox.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/combobox.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/button.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/examples/combobox-example.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; registry files are read on `main`, not pinned to a commit. The `cn-combobox-chip*` classes of the radix base live in style files that were not read, so the sizes come from the new-york-v4 file. Nothing here was run in a browser or with a screen reader.

```tsx
<ComboboxChips ref={anchor}>
```

```tsx
<ComboboxChip key={value}>{value}</ComboboxChip>
```

```tsx
render={<Button variant="ghost" size="icon-xs" />}
```

```text
"icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
```

- Own arithmetic, Tailwind's 4 px step: `size-6` is 24 px, `h-[calc(--spacing(5.5))]` is 22 px. The button carries `-ml-1`.
- Chip classes: `bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground`. The remove button: `opacity-50 hover:opacity-100`.
- `ComboboxChip` takes `showRemove` (default `true`) and renders `ComboboxPrimitive.ChipRemove`.
- Name: none of `ComboboxClear`, the remove button or the trigger sets an `aria-label` in either file, and the Multiple example sets no `aria-*` attribute. Its Invalid sample sets `<ComboboxChipsInput aria-invalid="true" />`.
- The page does not explain chip removal; the key behaviour is in Base UI ([[K-0305-base-ui-combobox-chip-keys-and-focus-after-removal]]), which asks the author for the name ([[K-0306-base-ui-combobox-multiple-mode-strings-left-to-the-author]]).

## Why it matters for ORIVILO

This is the shadcn/ui row of the Multi-select table. Copying the markup as it stands would leave the remove button with no name, so the Base UI note has to travel with it.
