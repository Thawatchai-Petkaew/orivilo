---
id: K-0159
topic: design
claim: Untitled UI React's Featured icons page and source give `FeaturedIcon` the themes light (default), gradient, dark, outline, modern and modern-neue, the colours brand (default in the source), gray, success, warning and error with no info colour, and the sizes sm (default), md, lg and xl, which the page gives as 32, 40, 48 and 56 px containers for every theme except outline; the page names no state and the lines read set no role or aria attribute.
source: "https://www.untitledui.com/react/components/featured-icons; https://www.untitledui.com/react/components/featured-icons.md; https://raw.githubusercontent.com/untitleduico/react/main/components/foundations/featured-icon/featured-icon.tsx; DESIGN.md; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-222]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes and code it copies. The `.md` page renders the API reference as `<ApiReference slug="featured-icons" />` with no table, so props come from the page's FAQ and from the file's `FeaturedIconProps`. Confidence 0.8: page and source file, one publisher.

### Page

> For every theme except `"outline"`, these render 32px, 40px, 48px and 56px containers.

> and falls back to "brand" at runtime.

> All five colors are styled for every theme except "modern-neue",
> which only defines styles for "gray".

> Automatic sizing only applies when you pass a component reference, like `icon={CheckCircle}`.

> They're merged last with `tailwind-merge`

- Install: `npx untitledui@latest add featured-icon`. Examples: one per theme, with `CheckCircle`.
- The page describes no interactive or visual state. The words role, aria, screen reader, decorative, alt and accessible do not appear on it.
- `children` renders inside the container after the icon, and `icon` can be left out for custom content. A React element passed as `icon` keeps its own size, so the caller adds a class such as `size-5`. `className` can change the shape, for example `rounded-lg`.

### Source file

```text
export const FeaturedIcon = (props: FeaturedIconProps) => {
    const { size = "sm", theme: variant = "light", color = "brand", icon: Icon, ...otherProps } = props;
```

- `FeaturedIconProps` types `color` with no `?`, while the destructure gives it the default `"brand"`. That default covers an omitted prop. The page's "falls back" sentence does not say which input it means, and no other fallback showed in the lines the tool copied.
- Root: a `div` that spreads `otherProps` and adds `data-featured-icon`, with `relative flex shrink-0 items-center justify-center`. The icon takes `data-icon`. No `role` and no `aria-*` is set, so nothing marks the icon as decorative or named unless the caller passes it.
- Icon sizes: sm `size-4`, md `size-5`, lg `size-6`, xl `size-7`; the gradient theme sets its own (sm and md `size-4`, lg and xl `size-5`).

Themes, with the sm and xl rows of each `sizes` map:

- light: `rounded-full`, a tint plus a foreground per colour, for example `bg-error-secondary text-featured-icon-light-fg-error`. sm `size-8`, xl `size-14`.
- gradient: an `after` layer inside the tile; base and colours not copied by the tool. sm `size-8 after:size-6`, xl `size-14 after:size-10`.
- dark: solid per colour, for example `bg-error-solid`, with `text-fg-white`, `shadow-xs-skeuomorphic` and a masked inner border. sm `size-8 rounded-md`, xl `size-14 rounded-xl`.
- outline: no fill, `text-fg-error-primary` with two rings at 30% and 10% of that colour. sm `size-4 before:size-6 after:size-8.5`, xl `size-7 before:size-9 after:size-11.5`.
- modern: `bg-primary shadow-xs-skeuomorphic ring-1 ring-primary ring-inset`. sm `size-8 rounded-md`, xl `size-14 rounded-xl`.
- modern-neue: the page gives gray only; base not copied by the tool. sm `size-8 rounded-[8px]`, xl `size-14 rounded-[14px]`.

The page's 32 to 56 px holds for the five themes other than outline. For outline, at the ratio the page gives (`size-8` is 32 px), the centre is 16, 20, 24 and 28 px and the outer ring 34, 38, 42 and 46 px (own arithmetic, from `after:size-8.5` to `after:size-11.5`).

## Why it matters for ORIVILO

This is the Untitled UI row for FeaturedIcon (D.3 row 19 of `docs/specs/ORV-64/audit.md`). Untitled has no info colour, while `DESIGN.md` section 3.1 has `feedback.info.*`, and its default colour is brand.
