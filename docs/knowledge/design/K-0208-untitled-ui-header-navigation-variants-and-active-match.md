---
id: K-0208
topic: design
claim: Untitled UI's Header navigations page shows Simple and Dual-tier headers; an item is active on an exact href match or a prefix match for nested routes, with root excluded and an item's current overriding the match; the second row takes the active item's items or subItems, renders only when it has an item, and is buttons by default or tabs by secondaryType.
source: "https://www.untitledui.com/react/components/header-navigations.md; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/header-navigation.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The page's API reference is a placeholder (`<ApiReference slug="header-navigations" />`), so its props table was not read.

Page:

> an item matches when its `href` equals `activeUrl` exactly

> when `activeUrl` starts with `href + "/"` so nested routes keep the parent highlighted.

> The one exception is a root `href` of `"/"`, which is excluded from the prefix rule and only ever matches exactly

> To override the match for one item, set `current` on that item.

> The secondary row is only rendered when there is at least one sub-item.

- Item fields: `label`, `href`, optional `icon`, `badge`, `current`, `items`.
- `HeaderNavigationBaseProps`: `activeUrl`, `items`, `subItems`, `hideBorder`, `actions`, `centered`, `secondaryType`.
- `secondaryType`: `"buttons"` (default) or `"tabs"`. With tabs, sub-items get only their label, not their `href`, so navigation is the author's to wire.
- `actions` replaces the built-in actions, which include `DropdownAccountButton`.
- `centered` (default `false`): the logo and actions take equal space so the nav sits in the middle, and the search input in the buttons row is not rendered.
- No size or slot is named beyond `items` and `actions`; the only state the page describes is active.

`header-navigation.tsx`:

```ts
const isActive = (item: NavItem) => item.current ?? isItemActive(item.href, activeUrl);
if (href !== "/" && activeUrl.startsWith(href + "/")) return true;
const activeSubNavItems = subItems || activeParent?.items;
const showSecondaryNav = activeSubNavItems && activeSubNavItems.length > 0;
```

Tabs variant: `<Tabs selectedKey={activeTabKey}>` with `<TabList size="sm" type="underline" items={tabItems} className="-mb-px before:hidden" />`.

## Why it matters for ORIVILO

Nested-route matching is the one rule here the sidebar's page does not state: a child route keeps its parent lit, and root is the named exception.
