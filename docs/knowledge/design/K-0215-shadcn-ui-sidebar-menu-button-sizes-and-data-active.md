---
id: K-0215
topic: design
claim: shadcn/ui's SidebarMenuButton has variants default and outline and sizes sm, default and lg, renders a button unless asChild, and marks the current item through isActive as data-active with a fill and font-medium; the sidebar file holds no aria-current, so the current page is not exposed unless the author adds it.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx; https://ui.shadcn.com/docs/components/radix/sidebar.md; .claude/rules/design-system.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes; `sidebar.tsx` was read three times, the last time for the JSX of this part and for the string `aria-current`.

Docs:

> By default, the `SidebarMenuButton` renders a button but you can use the `asChild` prop to render a different component such as a `Link` or an `a` tag.

> Use the `isActive` prop to mark a menu item as active.

`sidebar.tsx`:

```tsx
<Comp
  data-slot="sidebar-menu-button"
  data-sidebar="menu-button"
  data-size={size}
  data-active={isActive}
  className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
  {...props}
/>
```

```text
data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground
```

- Sizes: `default` (`h-8 text-sm`), `sm` (`h-7 text-xs`), `lg` (`h-12 text-sm...`); default `default`. Variants: `default`, `outline`; default `default`.
- `tooltip` renders only when passed; its `hidden` is `state !== "collapsed" || isMobile`, so it shows only on a collapsed desktop sidebar.
- `SidebarMenuAction` `showOnHover` defaults to `false`; when true it adds `md:opacity-0` until the item is hovered or focused. The docs name the prop only in a sample.
- `SidebarMenuBadge` and `SidebarMenuAction` are hidden in icon mode. `SidebarMenuSkeleton` picks its width with `Math.floor(Math.random() * 40) + 50`.
- The strings `aria-current` and `aria-expanded` do not occur in the file.

## Why it matters for ORIVILO

`{...props}` means an author can pass `aria-current`, but nothing sets it. K-0226 and K-0227 are the standards on that point; Radix's own Link does set it (K-0221). The random skeleton width is the line to read against "Never randomize style values at render time" in `.claude/rules/design-system.md`.
