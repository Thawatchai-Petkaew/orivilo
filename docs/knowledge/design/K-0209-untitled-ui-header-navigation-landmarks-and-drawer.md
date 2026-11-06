---
id: K-0209
topic: design
claim: Untitled UI's desktop header is hidden below lg and replaced by a modal drawer that reuses items but, by the page's own words, shows no active item; in the source its primary row and its default buttons second row are nav elements with no attributes and NavButton items, so neither carries aria-current, and icons and badges appear only in the drawer.
source: "https://www.untitledui.com/react/components/header-navigations.md; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/header-navigation.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/base-components/nav-button.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

Page:

> The full header is hidden below the `lg` breakpoint, and `MobileNavigationHeader` renders a compact bar

> with a menu button that opens a dismissable React Aria modal drawer.

> The drawer reuses the same `items` array through `NavList`

> and adds a search input, Support, Settings and Open in browser links, and a `NavAccountCard`.

> `activeUrl` is not passed to the drawer's `NavList`, so items there are not highlighted as active unless you add it.

The page also says the desktop header renders only each item's label; icons and badges appear only in the drawer. Its one accessibility line is that the header is built with React Aria and Tailwind CSS.

`header-navigation.tsx`:

```tsx
<header className="max-lg:hidden">
<NavButton current={isActive(item)} href={item.href}>
```

- The primary row and the buttons form of the second row sit in `<nav>` elements with no attributes, so a buttons second row means two unnamed `nav` elements. The tabs form sits in a `div`.
- `aria-label` values in the file: "Go to homepage" on the logo link, "Search" on the two inputs. The text `aria-current` is not in the file, and `nav-button.tsx` does not set it either (K-0206).
- The second row sits in a `section` with no name.
- `NavList items={items}` in the drawer passes no `activeUrl`, matching the page.

## Why it matters for ORIVILO

K-0224 and K-0225 ask for a unique name on each repeated `nav`, and K-0226 and K-0227 name `aria-current` for the current item. This entry is what the Untitled header does not ship on those points.
