---
id: K-0223
topic: design
claim: shadcn/ui's components index has no page header, section header, navbar or app shell entry, the nearest being the dashboard-01 block's site header, a header with SidebarTrigger, a vertical Separator and an h1; Radix has no Sidebar primitive by the folder list read and a 404 at the page URL tried.
source: "https://ui.shadcn.com/docs/components; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/blocks/dashboard-01/components/site-header.tsx; https://github.com/radix-ui/primitives/tree/main/packages/react; https://www.radix-ui.com/primitives/docs/components/sidebar"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. Confidence 0.75: the claim is an absence. The tool notes that the GitHub tree page ends with a "View all files" link, so its 59 folders (the tool's count) may not be the whole list.

- Index names near this subject: Breadcrumb, Menubar, Navigation Menu, Sheet, Sidebar, Tabs. No name contains "Page Header", "Section Header", "Header", "Top Navigation", "Navbar" or "App Shell".
- `https://www.radix-ui.com/primitives/docs/components/sidebar` returned HTTP 404.
- The `packages/react` folders read include `collapsible`, `dialog`, `menubar`, `navigation-menu`, `tabs`, `toolbar`; no name holds "sidebar".

`site-header.tsx` (dashboard-01):

```tsx
<SidebarTrigger className="-ml-1" />
<h1 className="text-base font-medium">Documents</h1>
```

The root is `<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b ...`. The `Separator` has `orientation="vertical"` and `mx-2 data-[orientation=vertical]:h-4`. The one action is a ghost `Button` with `asChild`, `size="sm"`, `hidden sm:flex`.

## Why it matters for ORIVILO

The Page header and Section header rows of the benchmark have no shadcn component to read, and shadcn's Sidebar is shadcn's own composition, not a Radix primitive. The shadcn cells for those rows say so, and the block is the only code read.
