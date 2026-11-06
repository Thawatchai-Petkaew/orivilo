---
id: K-0301
topic: design
claim: shadcn/ui's Command uses cmdk and its page states no keyboard, loading or accessibility behaviour; its components list has Select, Native Select, Combobox and Command and no Tag, Chip or Multi Select; and the registry's combobox-demo sample still composes Popover with Command, setting role="combobox" on a Button and closing on selection.
source: "https://ui.shadcn.com/docs/components/radix/command; https://ui.shadcn.com/docs/components; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/command.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/examples/combobox-demo.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; registry files are read on `main`, not pinned to a commit. Whether a live docs page still shows `combobox-demo.tsx` was not read: the Combobox page's Basic example is the Base UI form ([[K-0298-shadcn-ui-combobox-is-built-on-base-ui-on-the-radix-tab]]).

> The <Command /> component uses the cmdk component by Dip.

```tsx
<CommandEmpty>No framework found.</CommandEmpty>
```

```tsx
onSelect={(currentValue) => {
  setValue(currentValue === value ? "" : currentValue)
  setOpen(false)
}}
```

- Parts: `Command`, `CommandDialog`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `CommandSeparator`, `CommandShortcut`. Examples: Basic, Shortcuts, Groups, Scrollable, RTL.
- `CommandDialog`: `title` default `"Command Palette"` and `description` default `"Search for a command to run..."`, both `sr-only`; `showCloseButton` default `false`.
- `CommandEmpty` has no default text. `CommandItem` shows a check when `data-checked` is true and hides it when the item holds a shortcut. `command.tsx` sets no `aria-*`.
- Sample: `role="combobox"` and `aria-expanded={open}` on the trigger `Button`; `Popover`, `PopoverTrigger`, `PopoverContent`; `<CommandInput placeholder="Search framework..." className="h-9" />`.
- Page: API reference defers to cmdk; no props, keyboard, loading or accessibility text.

Own reading: in the sample the Button has role combobox and cmdk's input has role combobox too ([[K-0302-cmdk-roles-keys-empty-and-loading]]), so two elements carry that role while the popover is open. This was not run.

## Why it matters for ORIVILO

This sample composes a searchable select from a popover and cmdk. It is a second building option beside the Base UI one, with the role question above.
