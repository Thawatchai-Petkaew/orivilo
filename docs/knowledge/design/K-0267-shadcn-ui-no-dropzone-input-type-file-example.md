---
id: K-0267
topic: design
claim: The shadcn/ui components list names no dropzone, file input or upload component; its file route is the Input page's "File" example, a plain type="file" input in a Field with file: classes in the registry, with no accept, multiple, limit or drag text.
source: "https://ui.shadcn.com/docs/components; https://ui.shadcn.com/docs/components/radix/input; https://ui.shadcn.com/docs/components/radix/input.md; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/input.tsx"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-227]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the registry file is read on `main`, not pinned to a commit. Confidence 0.75, not 0.8: most of the claim is an absence from the pages read.

> Use the `type="file"` prop to create a file input.

```tsx
<Input id="picture" type="file" />
```

```text
file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
```

- Components list: Attachment is the one file-related entry (K-0268). It has no dropzone, file input or upload entry. Progress, Input, Input Group and Field are listed.
- Input page, "File" example: `FieldLabel` "Picture", `FieldDescription` "Select a picture to upload." No `accept`, `multiple`, limit or drag and drop text.
- The `file:` classes style the browser's own file button; the visible control stays the native input (own reading of the class list).

## Why it matters for ORIVILO

shadcn/ui's list is the second row of the benchmark. It gives one native input and one attachment display, so everything between them, including the drop target and limits, has no shadcn page to read.
