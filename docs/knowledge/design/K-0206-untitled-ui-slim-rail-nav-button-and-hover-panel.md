---
id: K-0206
topic: design
claim: Untitled UI's Slim rail renders each item as NavButton, an icon-only link named by aria-label and a tooltip that marks current by classes only with no aria-current in the file, and the second panel of Slim and Dual-tier shows only while the pointer hovers the sidebar; the Slim file has no onFocus, onKeyDown or aria-expanded.
source: "https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/base-components/nav-button.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation/sidebar-slim.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation/sidebar-dual-tier.tsx; https://www.untitledui.com/react/components/sidebar-navigations.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes; `nav-button.tsx` was read twice, the second time for its whole JSX.

`nav-button.tsx`:

```tsx
<Tooltip isDisabled={!label} title={label} placement={tooltipPlacement}>
  <Pressable>
    <a
      href={href}
      aria-label={label}
      onClick={onClick}
```

```tsx
current && "bg-secondary hover:bg-secondary_hover",
iconOnly ? "size-9" : "px-2 py-1.5",
```

- The text `aria-current` is not in the file. `current` only adds classes to the link, the icon and the text span.
- The icon is `aria-hidden="true"`. With no `children` the link is `size-9` and shows no visible label; `label` reaches only `aria-label` and the tooltip. The tooltip placement defaults to `"right"`.
- `open` is declared ("Whether the collapsible nav item is open.") and never used.

`sidebar-slim.tsx`:

```tsx
<NavButton
  current={currentItem?.href === item.href}
  href={item.href}
  label={item.label || ""}
  icon={item.icon}
  onClick={() => setCurrentItem(item)}
/>
```

```ts
const isSecondarySidebarVisible = isHovering && Boolean(currentItem?.items?.length);
```

`isHovering` is set by `onPointerEnter` and `onPointerLeave` on the desktop wrapper. The file has no `onFocus`, no `onKeyDown` and no `aria-expanded`. A press on a rail item changes the panel's content, not whether it shows.

`sidebar-dual-tier.tsx` has the same visibility line and the same pointer handlers, and starts from `useState(activeItem ?? items[1] ?? items[0])`. The panel animates with a `"spring"` transition, `damping: 26`, `stiffness: 220`. Its only `aria-*` attribute is `aria-label="Search"`.

### Open point

The sidebar page says the active link carries `aria-current="page"`, and `NavItemBase` does (K-0205), but `NavButton` does not. The page does not say whether its sentence covers the Slim rail.

## Why it matters for ORIVILO

A rail is the Untitled answer to a narrow sidebar, and these are the costs read from its file: no visible label, a pointer-only panel and no `aria-current`. SC 2.5.8, SC 2.4.8 and the disclosure pattern are the standards to read them against (K-0235, K-0227, K-0229).
