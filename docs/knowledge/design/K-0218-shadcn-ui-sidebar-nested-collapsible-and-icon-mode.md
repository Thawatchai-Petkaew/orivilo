---
id: K-0218
topic: design
claim: shadcn/ui nests items by wrapping a SidebarMenuItem or SidebarGroup in Collapsible, and its sidebar-07 block opens a group from defaultOpen={item.isActive} and rotates a chevron on open; SidebarMenuSubButton has size sm or md and isActive, and in icon mode the submenu, its buttons, the action and the badge are hidden, with the group label faded out.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/blocks/sidebar-07/components/nav-main.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx; https://ui.shadcn.com/docs/components/radix/sidebar; packages/design-system/catalog/base/collapsible.yaml"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

`nav-main.tsx` (sidebar-07):

```tsx
defaultOpen={item.isActive}
<SidebarMenuButton tooltip={item.title}>
<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
```

`Collapsible` takes `asChild` and wraps `SidebarMenuItem`; `SidebarMenuSub` sits in `CollapsibleContent`. `defaultOpen` applies only on first render. The trigger is a `SidebarMenuButton` holding the title, so a parent item in this block is a disclosure button, not a link.

`sidebar.tsx`:

```text
group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!
group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0
```

- `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuAction`, `SidebarMenuBadge` and `SidebarGroupAction` each carry `group-data-[collapsible=icon]:hidden`.
- `SidebarMenuSubButton`: `size` `"sm" | "md"` (default `"md"`, `text-xs` and `text-sm`), `isActive` default `false`, `data-active`, default element `a`. `SidebarMenuSub` has a left border.

Docs: a `SidebarGroup` is made collapsible by wrapping it in `Collapsible`, with `SidebarGroupLabel asChild` wrapping `CollapsibleTrigger`.

## Why it matters for ORIVILO

`aria-expanded` here comes from Radix Collapsible (K-0122), not from the sidebar file, so a nested group gets the disclosure wiring ORIVILO's own Collapsible has (catalog `collapsible.yaml`). In icon mode the sub-items have no route to them in this block as read.
