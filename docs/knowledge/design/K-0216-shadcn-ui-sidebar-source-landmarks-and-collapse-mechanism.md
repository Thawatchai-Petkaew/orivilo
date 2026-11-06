---
id: K-0216
topic: design
claim: shadcn/ui's sidebar.tsx renders no nav and no aside; SidebarInset is the only landmark element, a main, SidebarMenu and SidebarMenuSub are ul, and SidebarGroupLabel is a div; offcanvas collapse moves the container off screen with no inert, aria-hidden or visibility in the file, and the trigger is named by sr-only "Toggle Sidebar".
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes; three reads of the file, one asking directly for each string below.

```tsx
<main
  data-slot="sidebar-inset"
```

```ts
const Comp = asChild ? Slot.Root : "div";
```

```text
left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]
right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]
group-data-[collapsible=offcanvas]:w-0
```

- The strings `<nav`, `<aside`, `aria-current` and `aria-expanded` do not occur in the file.
- Desktop root attributes: `data-state={state}`, `data-collapsible={state === "collapsed" ? collapsible : ""}`, `data-variant`, `data-side`, `data-slot="sidebar"`. The wrapper class holds `group peer hidden text-sidebar-foreground md:block`.
- No `inert`, `aria-hidden` or `visibility` on the desktop sidebar when collapsed. `tabIndex={-1}` appears only on `SidebarRail`.
- `SidebarTrigger`: a button with an sr-only `<span>` "Toggle Sidebar" and no `aria-label`.
- `SidebarRail`: `aria-label="Toggle Sidebar"`, `title="Toggle Sidebar"`, `tabIndex={-1}`, `onClick={toggleSidebar}`.
- `collapsible="none"` renders a plain `div` with `flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground`.

### Open point

Whether links in an off-screen offcanvas sidebar stay in the tab order was not run in a browser. The file sets nothing that removes them, and that is all this entry states.

## Why it matters for ORIVILO

The file leaves the landmark and `aria-expanded` to the author. K-0224 and K-0229 are what the standards name for those two.
