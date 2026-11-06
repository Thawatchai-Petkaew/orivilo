---
id: K-0330
topic: design
claim: shadcn/ui Pagination is a set of composed parts over nav, ul and li whose PaginationLink is an anchor on buttonVariants, outline when isActive and ghost otherwise at size icon, with previous and next at size default, and a text prop for those labels in the bases registry.
source: "https://ui.shadcn.com/docs/components/radix/pagination; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/pagination.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/pagination.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes; the source files came back as listed lines, not whole files.

> Pagination with page navigation, next and previous links.

> By default the `<PaginationLink />` component will render an `<a />` tag.

> you'll need to apply the following updates to add the `text` prop:

### Parts

- `Pagination` (`nav`), `PaginationContent` (`ul`, flex row), `PaginationItem` (`li`), `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`.
- The framework tabs on the page are Base UI, React Aria and Radix UI. Only the Radix UI page was read.

### `PaginationLink` (`new-york-v4` and `bases/radix`)

- `isActive?: boolean`; `size = "icon"`; variant `isActive ? "outline" : "ghost"`; `data-active={isActive}`.
- `size` is typed as `Pick<React.ComponentProps<typeof Button>, "size">`.
- The docs have no sentence on `isActive`; it appears only in the sample, `<PaginationLink href="#" isActive>`.

### Previous and next

- `size="default"`, written before `{...props}`, so a caller can change it.
- Below the `sm` breakpoint the word is hidden: `<span className="hidden sm:block">Previous</span>`. The name stays in `aria-label` ([[K-0332-shadcn-ui-pagination-names-and-hidden-ellipsis]]).
- `bases/radix` has `text = "Previous"` and `text = "Next"`. The `new-york-v4` file as read has the words written in, so the two registries differ on this prop.

### Routing

The Next.js section says to change `pagination.tsx` to use `next/link` in place of `<a>`, and that the CLI will automate this.

### States

No disabled prop on `PaginationPrevious` or `PaginationNext` appears in the lines read. The docs name none.

## Why it matters for ORIVILO

shadcn reuses its button styles on real anchors, so page numbers are links rather than buttons, and it reads the current page from one prop. The repo's Button has `asChild` and `link`, and the comparison sits in the benchmark.
