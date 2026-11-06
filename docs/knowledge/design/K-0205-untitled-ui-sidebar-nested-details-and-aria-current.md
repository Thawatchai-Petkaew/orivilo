---
id: K-0205
topic: design
claim: Untitled UI's NavList nests sub-items in a native details element that opens when the active item is inside it, and its NavItemBase link sets aria-current page and a background change on the current item; the lists read render ul and li inside an aside with no nav element, and a subheading is a p, not a heading.
source: "https://www.untitledui.com/react/components/sidebar-navigations.md; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/base-components/nav-list.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/base-components/nav-item.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation/sidebar-simple.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation/sidebar-sections-subheadings.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

Page:

> Give an item an `items` array of `{ label, href, badge? }` objects.

> `NavList` renders those inside a native `<details>` element with a chevron trigger

> Pass the current path to the `activeUrl` prop.

> The sidebar compares it against each item's `href` and highlights the match

The page also says a group opens by itself when the active item is inside it, sub-items show no icon, and the active link carries `aria-current="page"`.

`nav-list.tsx`:

```tsx
<ul className={cx("flex flex-col px-4 pt-5", className)}>
<details key={item.label} open={activeItem?.href === item.href} className="appearance-none py-0.25">
```

- `activeItem` is the item whose own `href` equals `activeUrl` or whose `items` hold a matching `href`.
- Sub-items sit in a `dd` holding a `ul`; each `li` holds `NavItemBase` with `type="collapsible-child"` and `current={activeUrl === childItem.href}`.
- A divider is a `li` holding an `hr`. The file sets no `aria-*` attribute.

`nav-item.tsx`:

```tsx
aria-current={current ? "page" : undefined}
```

- Item types: `collapsible`, `link`, `collapsible-child`. A collapsible item is a `summary` with a `ChevronDown` set `aria-hidden="true"`, flipped by `in-open:-scale-y-100`.
- Current look: `bg-secondary hover:bg-secondary_hover`.
- An `href` starting with `http` adds an external icon.

`sidebar-simple.tsx`: the root is an `aside`; the file has no `nav` and no `role="navigation"`, and NavList's root is a `ul`. The `aside` has no `aria-label`.

`sidebar-sections-subheadings.tsx`: the group label is `<p className="text-xs font-bold text-quaternary uppercase">{group.label}</p>`, each item is compared by `current={item.href === activeUrl}`, and `activeUrl` defaults to `"/"`. The file has no `aria-*` attribute.

## Why it matters for ORIVILO

The nested group needs no script for open and close, and the current page follows the ARIA value the standards name (K-0226). The missing `nav` landmark and the `p` group label are facts to set beside the landmark and heading entries (K-0224, K-0230).
