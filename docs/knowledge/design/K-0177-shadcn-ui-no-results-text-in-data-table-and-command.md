---
id: K-0177
topic: design
claim: shadcn/ui shows no results without Empty in two places read: Data Table renders "No results." in one table cell spanning the columns, and Command renders CommandEmpty over cmdk's Empty, which has role presentation; cmdk's Loading has role progressbar, and shadcn's Command does not export it.
source: "https://ui.shadcn.com/docs/components/radix/data-table; https://ui.shadcn.com/docs/components/radix/command; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/command.tsx; https://raw.githubusercontent.com/pacocoursey/cmdk/main/cmdk/src/index.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, `main` branches (no commit hash shown). Confidence 0.8: each fact was read in the project's own page or file; nothing was rendered.

Data Table (`data-table.tsx` on the page):

```text
<TableRow>
  <TableCell colSpan={columns.length} className="h-24 text-center">
    No results.
  </TableCell>
</TableRow>
```

The tool found no loading state, skeleton, `aria-busy`, `role="status"` or live region in the text it read, and said the page text was truncated, so the rest of the page is unread.

Command: the page's usage sample is `<CommandEmpty>No results found.</CommandEmpty>`, and it does not mention a loading part. In `command.tsx`, `CommandEmpty` wraps `<CommandPrimitive.Empty` with `data-slot="command-empty"` and `className="py-6 text-center text-sm"`, sets no role or aria attribute itself, and the exports hold no `CommandLoading`.

cmdk (`cmdk/src/index.tsx`), as fragments:

```text
state.filtered.count === 0
<Primitive.div ... cmdk-empty="" role="presentation" />
<Primitive.div ... cmdk-loading="" role="progressbar" ...>
aria-valuenow={progress}
aria-label={label}
```

The tool reported that `label` defaults to `'Loading...'` and that Loading wraps its children in a `<div aria-hidden>`.

## Why it matters for ORIVILO

The empty table and the empty search are the no-results cases WCAG's text speaks to (K-0178). In these two sources the text appears without a status role, and the strings are fixed English in the samples.
