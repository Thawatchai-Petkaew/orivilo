---
id: K-0298
topic: design
claim: shadcn/ui's Combobox imports its primitive from @base-ui/react in both the radix base file and the new-york-v4 registry file, and its docs on the Radix URL send the API reference to Base UI, so it is not built on Radix, while its Command is built on cmdk.
source: "https://ui.shadcn.com/docs/components/radix/combobox; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/radix/combobox.mdx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/combobox.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/combobox.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/command.tsx; .claude/rules/design-system.md; packages/design-system/package.json"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; registry files are read on `main`, not pinned to a commit.

```tsx
import { Combobox as ComboboxPrimitive } from "@base-ui/react";
```

> See the Base UI documentation for more information.

- That import line is the same in `registry/bases/radix/ui/combobox.tsx` and `registry/new-york-v4/ui/combobox.tsx`.
- The MDX frontmatter links `https://base-ui.com/react/components/combobox` as the doc and `https://base-ui.com/react/components/combobox#api-reference` as the API.
- `Combobox` is an alias for `ComboboxPrimitive.Root`.
- The Radix base's `command.tsx` imports `Command as CommandPrimitive` from `"cmdk"`.
- `ComboboxContent` renders in a Portal inside a Positioner; both are `ComboboxPrimitive` parts in the file.

## Why it matters for ORIVILO

`.claude/rules/design-system.md` line 23 says behaviour comes from the `radix-ui` package, and `packages/design-system/package.json` has `radix-ui` and neither `@base-ui/react` nor `cmdk`. Taking shadcn's Combobox would bring a second primitive base; the open point is in [[K-0319-synthesis-combobox-and-multi-select-benchmark]].
