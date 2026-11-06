---
id: K-0185
topic: design
claim: Untitled UI React's Avatar takes size xs, sm, md, lg, xl or 2xl (default md) and has no variant prop; its slots are src, initials, placeholderIcon, placeholder, status, verified, count and badge, with border, rounded (default true) and focusable (default false) as options, and AvatarLabelGroup and AvatarProfilePhoto take only sm, md or lg.
source: "https://www.untitledui.com/react/components/avatars.md; https://www.untitledui.com/react/components/avatars; https://github.com/untitleduico/react/tree/main/components/base/avatar; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/avatar.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/avatar-label-group.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/avatar-profile-photo.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/base-components/avatar-add-button.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns summaries and short quotes. Both page URLs returned the raw MDX source. Its API reference is only a placeholder (`<ApiReference slug="avatars" />`), so the rendered props table was not read; the props below come from `avatar.tsx` on the `main` branch instead.

> "`Avatar` accepts a `size` of "xs", "sm", "md", "lg", "xl" or "2xl", defaulting to "md"."
> "`AvatarLabelGroup` and `AvatarProfilePhoto` only accept "sm", "md" and "lg", and both type `size` as required."
> "Pass `rounded={false}`. The avatar then uses small rounded corners instead of a full circle."

### Examples on the page

12 headings (own count, the example headings in `avatars.md` as the fetch listed them): Avatar, Border, Status indicator, Company logo, Verified badge, Placeholder, Initials, Label group, Group, Profile photo, Profile photo placeholder, Profile photo initials.

### `AvatarProps` in `avatar.tsx`

16 properties (own count, the lines of the `AvatarProps` interface as the fetch listed them): `size`, `className`, `contentClassName`, `src` (`string | null`), `alt`, `contrastBorder`, `rounded` (default `true`), `border`, `badge` (`ReactNode`), `status` (`"online" | "offline"`), `verified` (default `false`), `count` (`number`), `initials`, `placeholderIcon` (a component), `placeholder` (`ReactNode`), `focusable` (default `false`). The fetch reports that `contrastBorder` is declared but never used.

### Sizes in `avatar.tsx`

```text
xs: { root: "size-6", rootWithBorder: "p-px", initials: "text-xs font-semibold", icon: "size-4" },
sm: { root: "size-8", rootWithBorder: "p-px", initials: "text-sm font-semibold", icon: "size-5" },
md: { root: "size-10", rootWithBorder: "p-px", initials: "text-md font-semibold", icon: "size-6" },
lg: { root: "size-12", rootWithBorder: "p-[1.5px]", initials: "text-lg font-semibold", icon: "size-7" },
xl: { root: "size-14", rootWithBorder: "p-0.5", initials: "text-xl font-semibold", icon: "size-8" },
"2xl": { root: "size-16", rootWithBorder: "p-0.5", initials: "text-display-xs font-semibold", icon: "size-8" },
```

### Related components

- `AvatarLabelGroup` adds `title`, `subtitle` and `avatarClassName`. Sizes: `sm` title `text-sm`, subtitle `text-xs`; `md` both `text-sm`; `lg` both `text-md`. The subtitle has `truncate`; the title does not.
- `AvatarProfilePhoto`: `sm` `size-18`, `md` `size-24`, `lg` `size-40`.
- Group: no group component; the page wraps avatars in `<div className="flex -space-x-2">` and sets `ring-[1.5px] ring-bg-primary` on each.
- `AvatarAddButton`: `size` `xs`, `sm` or `md` (`size-6`, `size-8`, `size-10`), `title` default "Add user".

The folder also holds `avatar.demo.tsx`, `avatar.story.tsx`, `utils.ts` and `base-components`.

### States

The page and `AvatarProps` name no disabled, loading or selected state. A focus ring is the only interaction state (K-0188). Load failure is K-0186.

## Why it matters for ORIVILO

This fills the Untitled UI row of the Avatar benchmark for variants, sizes and slots. The choice of sizes belongs to the designer.
