---
id: K-0204
topic: design
claim: Untitled UI React's Sidebar navigations page shows five sidebar variants (Simple, Dual-tier, Slim, Section dividers, Sections subheadings) that all take items and activeUrl, states no size, no state list and no slot list, and states no control that shrinks the desktop sidebar; the public source sets a main width of 280, 280, 68, 276 and 276 px, and 256 px for the second panel of Dual-tier and Slim.
source: "https://www.untitledui.com/react/components/sidebar-navigations.md; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation/sidebar-simple.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation/sidebar-dual-tier.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation/sidebar-slim.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation/sidebar-section-dividers.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation/sidebar-sections-subheadings.tsx"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. Confidence 0.75, not 0.8: the "no size, no toggle" part is an absence, and the page's API reference was not in the fetched text, so its props table was not read. The source is the public `untitleduico/react` repo at `main`; the page does not say it matches that repo line for line.

Page:

> They all take an `items` array and an `activeUrl`

> `SidebarNavigationSimple` and `SidebarNavigationDualTier` accept a `featureCard` prop that takes any React node

> Every item follows the `NavItemType` type: `label` (required), plus optional `href`, `icon` (a component, not an element)

- Examples: Simple, Dual-tier, Slim, Sections dividers, Sections subheadings.
- Featured cards: 13 by own count of the headings under "Featured cards" on the `.md` page (Progress bar, Progress circle, Image, Cookie preferences, Referral link, Onboarding steps, Upgrade CTA, Support CTA, Event CTA, Message, Current projects, Free trial CTA, QR code).
- Item fields the FAQ names: `label`, `href`, `icon`, `badge` (any node; a string or number is wrapped in a gray pill), `items`, `divider`. `icon` is required on every item in Slim.
- Simple only: `showAccountCard` (default `true`), `footerItems`, `hideBorder`.

Source widths and props:

- `sidebar-simple.tsx`: `const MAIN_SIDEBAR_WIDTH = 280;`. Props beyond `activeUrl` and `items`: `footerItems`, `featureCard`, `showAccountCard`, `hideBorder`, `className`, `avatarRounded`.
- `sidebar-dual-tier.tsx`: `const MAIN_SIDEBAR_WIDTH = 280;`, `const SECONDARY_SIDEBAR_WIDTH = 256;`. Props: `footerItems`, `featureCard`, `hideBorder`, `selectedAccountId`, `accountItems`.
- `sidebar-slim.tsx`: `const MAIN_SIDEBAR_WIDTH = 68;`, `const SECONDARY_SIDEBAR_WIDTH = 256;`. Props: `footerItems`, `hideBorder`, `hideRightBorder`.
- `sidebar-section-dividers.tsx`: `const MAIN_SIDEBAR_WIDTH = 276;`. Items may be `NavItemDividerType`.
- `sidebar-sections-subheadings.tsx`: `const MAIN_SIDEBAR_WIDTH = 276;`. `items: Array<{ label: string; items: NavItemType[] }>`.

From `lg` up the sidebar is a fixed column: the Simple desktop wrapper is `hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex`.

### Not stated on the page

Sizes, a state list, a slot list, a sidebar width, and a toggle or rail that a person presses to shrink the desktop sidebar.

## Why it matters for ORIVILO

This is the Untitled UI side of the Sidebar navigation benchmark in ORV-225: its depth sits in five fixed layouts and one item shape, not in size or variant props.
