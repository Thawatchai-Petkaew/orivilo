---
id: K-0160
topic: design
claim: shadcn/ui's Alert page gives `Alert`, `AlertTitle`, `AlertDescription` and `AlertAction`, the variants `default` and `destructive`, no size, no dismiss and no accessibility text; every registry file read sets `role="alert"` on the root whatever the variant, before the spread props, and the page's warning example gets its colour from custom classes such as `bg-amber-50 dark:bg-amber-950`.
source: "https://ui.shadcn.com/docs/components/alert; https://ui.shadcn.com/docs/components/radix/alert; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/alert.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/alert.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/base/ui/alert.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/styles/style-nova.css"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-222]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes and code it copies. Confidence 0.8: the docs and the registry files of one project. The title and description classes of `new-york-v4` are also in K-0097.

### Page

> Displays a callout for user attention.

> Use AlertAction to add a button or other action element to the alert.

> Use variant="destructive" to create a destructive alert.

> You can customize the alert colors by adding custom classes such as bg-amber-50 dark:bg-amber-950

- Section headings, in order: Installation, Usage, Composition, Basic, Destructive, Action, Custom Colors, RTL, API Reference.
- Composition: an icon, `AlertTitle`, `AlertDescription`, `AlertAction`. The caller passes the icon as a child.
- `Alert` takes `variant`, `"default"` (the default) or `"destructive"`. The other three take `className`.
- `AlertAction` is positioned absolutely in the top right corner.
- Examples: "Account updated successfully" with a check-circle icon in the default variant; "Payment failed" with an alert-circle icon in destructive; "Dark mode is now available" with an Enable button; a subscription warning with a triangle icon and custom classes; an Arabic RTL example.
- The words role, aria, accessibility, screen reader, size, dismiss and close are absent. Warning, success and info appear only inside other words or icon names.
- The page links Base UI, React Aria and Radix UI versions.

### Registry files

```text
<div
  data-slot="alert"
  role="alert"
  className={cn(alertVariants({ variant }), className)}
  {...props}
/>
```

- This root is the same in `new-york-v4`, `bases/radix` and `bases/base`. `role="alert"` sits before `{...props}`, so by our reading a caller's `role` replaces it. The React Aria version was not read.
- `bases/radix` and `bases/base` have variants `cn-alert-variant-default` and `cn-alert-variant-destructive`. `bases/radix` exports four parts; `new-york-v4` exports three, with no `AlertAction`.

- `new-york-v4`: root `grid`, `rounded-lg border px-4 py-3 text-sm`, icon `[&>svg]:size-4`; title `line-clamp-1 min-h-4 font-medium tracking-tight`; description `text-sm text-muted-foreground`.
- `style-nova.css`: root `grid gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm`, icon `size-4` unless the caller sizes it; title `font-medium`; description `text-muted-foreground text-sm text-balance md:text-pretty`.
- `default`: `bg-card text-card-foreground`. `destructive`: `bg-card text-destructive`, with the description at `text-destructive/90` and the icon in `text-current`, in both `new-york-v4` and `style-nova.css`. The ground does not change between the two.
- `style-nova.css`: an alert with an action takes `pr-18`, and `.cn-alert-action` is `absolute top-2 right-2`.

## Why it matters for ORIVILO

This is the shadcn/ui row for Alert. Its only live behaviour is in the source, not the docs: the role is always `alert`, so a calm default message is treated the same as a failure unless the caller changes it.
