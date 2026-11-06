---
id: K-0219
topic: design
claim: shadcn/ui's Navigation Menu wraps Radix with no variant or size prop beyond viewport (default true) and a shared trigger style; the current link is styled through data-active, the only aria attribute it adds is aria-hidden on the chevron, and the page says nothing on accessibility or small screens beyond md classes in the source.
source: "https://ui.shadcn.com/docs/components/radix/navigation-menu; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/navigation-menu.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

Docs:

> Use the `asChild` prop to compose a custom link component such as Next.js `Link`.

> See the Radix UI Navigation Menu documentation for more information.

Composition: `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`, `NavigationMenuIndicator`. The page has no props list and no text on accessibility, the viewport or mobile.

`navigation-menu.tsx`:

```text
viewport = true
group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium
data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground
flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none
```

- Exports also `NavigationMenuViewport` and `navigationMenuTriggerStyle`.
- `aria-hidden="true"` on the `ChevronDownIcon` is the only aria attribute in the file. There is no sr-only text.
- Responsive classes: `md:absolute md:w-auto` on Content; `w-full` then `md:w-[var(--radix-navigation-menu-viewport-width)]` on Viewport.

## Why it matters for ORIVILO

shadcn has no top bar component: this is a menu of links, with `aria-current` coming from Radix (K-0221). There is no collapse or drawer here for a small screen.
