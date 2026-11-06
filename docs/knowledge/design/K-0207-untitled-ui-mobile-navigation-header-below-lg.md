---
id: K-0207
topic: design
claim: Below the lg breakpoint every Untitled UI sidebar variant becomes MobileNavigationHeader, a header bar with a button named "Expand navigation menu" that opens a dismissable React Aria modal holding the sidebar with a "Close navigation menu" button; Slim swaps its rail for a labelled NavList there, and that NavList call passes no activeUrl.
source: "https://www.untitledui.com/react/components/sidebar-navigations.md; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/base-components/mobile-header.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation/sidebar-slim.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

Page:

> Each variant wraps its content in `MobileNavigationHeader`, which renders a compact header

`mobile-header.tsx`:

```tsx
<header className="flex h-14 items-center justify-between border-b border-secondary bg-primary p-3 pl-4 lg:hidden">
<AriaButton aria-label="Expand navigation menu" className="group flex items-center justify-center rounded-lg bg-primary p-2 text-fg-secondary ...">
<AriaButton aria-label="Close navigation menu" onPress={() => state.close()} className="fixed top-2.5 right-3 ...">
```

- `AriaDialogTrigger` wraps the header and `AriaModalOverlay isDismissable`, whose class holds `fixed inset-0 z-50 cursor-pointer bg-overlay/70 pr-16 backdrop-blur-md lg:hidden`.
- `AriaModal` holds `w-full max-w-74 cursor-auto will-change-transform`; `AriaDialog` holds `h-dvh outline-hidden focus:outline-hidden`.
- The only semantic container in the file is the `header`: no `nav` element, no sr-only text.
- The menu and close icons cross-fade by `group-aria-expanded:opacity-0` and `group-aria-expanded:opacity-100`.

`sidebar-slim.tsx`, mobile:

```tsx
<MobileNavigationHeader>
<aside className="group flex h-full max-h-full w-full max-w-full flex-col justify-between overflow-y-auto bg-primary pt-4">
<NavList items={items} />
```

The Support and Settings items in that block do get `current={activeUrl === "/support"}` and `current={activeUrl === "/settings"}`.

## Why it matters for ORIVILO

This is the Untitled answer to a small screen: one drawer, reached from one header bar. The fixed "Expand" name and the focus rules for a modal drawer can be read against K-0234.
