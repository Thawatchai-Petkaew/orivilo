---
id: K-0190
topic: design
claim: shadcn/ui's Avatar has one fallback step, AvatarFallback, whose examples all hold text such as CN and none holds an icon; there is no initials prop or icon chain, its image examples use a handle such as @shadcn as alt, and its Dropdown example wraps the Avatar in an icon Button with no aria-label.
source: "https://ui.shadcn.com/docs/components/radix/avatar; https://ui.shadcn.com/docs/components/radix/avatar.md; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/avatar.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/avatar-badge.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: MIT
---

## Evidence

> "A basic avatar component with an image and a fallback."

### Fallback

```text
<AvatarFallback>CN</AvatarFallback>
"flex size-full items-center justify-center rounded-full bg-muted"
"text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs"
```

- Children in the examples: `CN`, `PP`, `LR`, `ER`.
- The word "initials" does not occur on the page. `PlusIcon` occurs only inside `AvatarBadge` and `AvatarGroupCount`, not in a fallback.
- `AvatarFallback`'s only listed prop is `className`. The registry file sets no delay, so the load behaviour is Radix's (K-0193).

Own reading: a chain from initials to an icon is left to the caller, who chooses what goes in `AvatarFallback`. Radix allows any children (K-0192).

### `alt` in the examples

- `alt="@shadcn"` (Basic, Badge, Sizes), `alt="@pranathip"` (Badge with Icon), `alt="@maxleiter"` and `alt="@evilrabbit"` (Avatar Group), `alt="shadcn"` (Dropdown).
- The page gives no rule for the value. The registry file sets no `alt` of its own.

### Dropdown example

```text
<DropdownMenuTrigger asChild>
<Button variant="ghost" size="icon" className="rounded-full">
```

The code holds no `aria-label`. Own reading: the button's only text is the image `alt` or, when the image has not loaded, the fallback text (K-0193).

## Why it matters for ORIVILO

An avatar used alone as a menu trigger has no visible name beside it, so its name comes from what the image or fallback holds. K-0197 and K-0198 hold what the standards say for that case.
