---
id: K-0213
topic: design
claim: shadcn/ui's Sidebar is a composition of a provider and parts; Sidebar takes side left or right, variant sidebar, floating or inset, and collapsible offcanvas, icon or none, inset needs SidebarInset around the main content, and the page makes no accessibility statement.
source: "https://ui.shadcn.com/docs/components/radix/sidebar; https://ui.shadcn.com/docs/components/radix/sidebar.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes, in both the HTML and the `.md` form.

> Sidebars are one of the most complex components to build.

| Property      | Type                              | Description                       |
| ------------- | --------------------------------- | --------------------------------- |
| `side`        | `left` or `right`                 | The side of the sidebar.          |
| `variant`     | `sidebar`, `floating`, or `inset` | The variant of the sidebar.       |
| `collapsible` | `offcanvas`, `icon`, or `none`    | Collapsible state of the sidebar. |

> A collapsible sidebar that slides in from the left or right.

> A sidebar that collapses to icons.

> A non-collapsible sidebar.

- Code defaults: `side` `"left"`, `variant` `"sidebar"`, `collapsible` `"offcanvas"`.
- Provider: `SidebarProvider` with `defaultOpen`, `open`, `onOpenChange`.
- Parts: `SidebarHeader` and `SidebarFooter` (sticky), `SidebarContent` (scrolling), `SidebarGroup` with `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarGroupAction`; `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuAction`, `SidebarMenuSub`, `SidebarMenuBadge`, `SidebarMenuSkeleton`, `SidebarTrigger`, `SidebarRail`, `SidebarInset`.
- `useSidebar`: `state` (`expanded` or `collapsed`), `open`, `setOpen`, `openMobile`, `setOpenMobile`, `isMobile`, `toggleSidebar`.
- Theming uses its own variables (`--sidebar`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`). RTL: `dir="rtl"` on `Sidebar`.
- The `.md` page has no section on cookies or persisted state and no accessibility statement. Its samples hold `sr-only` text such as `<span className="sr-only">More</span>`.

## Why it matters for ORIVILO

shadcn's depth sits in props and parts, where Untitled's sits in layouts (K-0204). This is the shape the benchmark reads for variants, slots and collapse.
