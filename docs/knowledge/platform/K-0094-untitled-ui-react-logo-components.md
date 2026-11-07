---
id: K-0094
topic: platform
claim: Untitled UI React ships its own brand as two foundation components with no docs page, UntitledLogo (an HTML div holding the mark SVG, a spacer div and a 97 by 32 wordmark SVG) and UntitledLogoMinimal (a 38 by 38 mark SVG); neither has a variant, size, state, colour, mode or slot prop, both are sized only by a className merged after a default h-8 (lockup) or size-8 (mark), neither carries an accessible name, the wordmark fills with the theme token fg-primary while the mark uses fixed colours, gradients, filters and an embedded base64 WebP image.
source: "https://www.untitledui.com/react/components; https://www.untitledui.com/resources/logos; https://github.com/untitleduico/react; https://github.com/untitleduico/react/tree/main/components/foundations; https://github.com/untitleduico/react/tree/main/components/foundations/logo; https://raw.githubusercontent.com/untitleduico/react/main/components/foundations/logo/untitledui-logo.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/foundations/logo/untitledui-logo-minimal.tsx; https://github.com/untitleduico/react/tree/main/components/application/app-navigation; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/header-navigation.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation-base.tsx; https://github.com/untitleduico/react/tree/main/components/application/app-navigation/sidebar-navigation; https://raw.githubusercontent.com/untitleduico/react/main/components/application/app-navigation/sidebar-navigation/sidebar-slim.tsx; https://raw.githubusercontent.com/untitleduico/react/main/styles/theme.css; https://www.untitledui.com/react/components/sidebar-navigations.md; https://www.untitledui.com/react/components/header-navigations.md; https://www.untitledui.com/react/docs/theming.md; https://tailwindcss.com/docs/height; https://tailwindcss.com/docs/fill; https://tailwindcss.com/docs/theme"
retrieved: 2026-10-31
confidence: 0.8
applies_to: [ORV-118, ORV-64]
license: MIT
---

## Evidence

Untitled UI React's repository states "MIT license" on its GitHub page and describes itself as "the world’s largest collection of open-source React components built with Tailwind CSS and React Aria." Facts below are in our own words with short quotes of code. The code was read on the `main` branch on 2026-10-31; the GitHub page showed no commit hash, so a later read of `main` may differ.

Confidence is 0.8: one publisher's code and site, read through a fetch tool and quoted. Each quoted line of the two logo files was looked for a second time with a yes or no question and found. No code was run and nothing was rendered: sizes and colours are our reading of the classes.

### 1. Where the logo lives, and that the site has no page for it

- The components category page (<https://www.untitledui.com/react/components>) lists no logo component. Its only logo entry is "Logos" under Resources, which links to <https://www.untitledui.com/resources/logos>.
- That Resources page is headed "Free company logos for React" and says: "Download these 100% free fictional placeholder company logos, designed specifically for web and UI design." and "Available as SVG files, React components, and as a Figma library." It shows no React code, import path or prop. These are placeholder logos for mockups, not Untitled UI's own brand.
- The theming doc (`theming.md`) and the sidebar and header navigation docs (`sidebar-navigations.md`, `header-navigations.md`) do not mention `UntitledLogo`, a logo import or how to replace the logo. The header page mentions the logo only in passing ("which pins the nav items next to the logo").
- Untitled UI's own brand is in the repo at `components/foundations/logo/`, which lists two files: `untitledui-logo.tsx` and `untitledui-logo-minimal.tsx`. The same `foundations` folder also holds `featured-icon`, `integration-icons`, `payment-icons`, `social-icons` and four single files. Both listings end in a "View all files" link, so the fetch tool may not have seen every file.

### 2. `UntitledLogo` (the lockup)

```text
export const UntitledLogo = (props: HTMLAttributes<HTMLOrSVGElement>) => {
    return (
        <div {...props} className={cx("flex h-8 w-max items-center justify-start overflow-visible", props.className)}>
            <UntitledLogoMinimal className="aspect-square h-full w-auto shrink-0" />
            <div className="aspect-[0.3] h-full" />
            <svg viewBox="0 0 97 32" fill="none" className="aspect-[3] h-full shrink-0">
```

(Excerpt; the file's comments between these lines are left out.)

- Props: the standard `HTMLAttributes` type only, spread onto the outer `div`. There is no `variant`, `size`, `state`, `tone`, `theme` or `mode` prop. By our reading, `children` passed in is replaced by the JSX children written after the spread, so there is no slot.
- Drawn as: an HTML `div` (flex row) holding three children, not one SVG: the mark component, a spacer `div`, and a wordmark `svg` with `viewBox="0 0 97 32"`. The file's own comments call the mark "Minimal logo" and the 97 by 32 wordmark SVG "Logomark", and the spacer "Gap that adjusts to the height of the container".
- Size: set by the height of the outer `div`. Its default class is `h-8`; a `className` passed in is merged after it through `cx`. Each child takes `h-full` with a fixed aspect ratio (mark `aspect-square`, gap `aspect-[0.3]`, wordmark `aspect-[3]`), so the whole lockup scales with that one height. Tailwind defines `h-<number>` as `height: calc(var(--spacing) * <number>);` and its default theme sets `--spacing: 0.25rem;`; Untitled UI's `theme.css` does not redefine `--spacing:`. So `h-8` is 2rem, which is 32 px at a 16 px root font size (our arithmetic).
- Colour: the fetch tool counted 11 `<path` elements in `untitledui-logo.tsx`, every one with `className="fill-fg-primary"`. Tailwind's fill page says the `--color-*` theme variables drive the colour utilities (`fill-regal-blue` from `--color-regal-blue`). Untitled UI's `theme.css` sets `--color-fg-primary: var(--color-neutral-900);` in its `@theme` block and `--color-fg-primary: var(--color-white);` under `.dark-mode` inside `@layer base`. By our reading, the wordmark is near black in light mode and white in dark mode.
- Accessibility: the file contains none of `aria-`, `role=`, `<title` or `alt`.

### 3. `UntitledLogoMinimal` (the mark only)

```text
export const UntitledLogoMinimal = (props: SVGProps<SVGSVGElement>) => {
    const id = useId();
    return (
        <svg viewBox="0 0 38 38" fill="none" {...props} className={cx("size-8 origin-center scale-[1.2]", props.className)}>
```

- Props: the standard `SVGProps<SVGSVGElement>` type only, spread onto the `svg`. `UntitledLogoMinimal` is the file's only export. No `size`, `variant`, `theme` or `mode` prop.
- Size: default `size-8` (width and height `calc(var(--spacing) * 8)`, Tailwind's height page) with `scale-[1.2]` around the centre; a `className` passed in is merged after them through `cx`.
- Drawn as: one `svg`, `viewBox="0 0 38 38"`. Inside, fixed fills (`fill="white"`, `fill="#000000"`), a linear gradient with `stopColor="#53389E"` and `stopColor="#6941C6"`, radial gradients, drop-shadow `filter` blocks, and an `<image>` whose `href` starts `data:image/webp;base64`, clipped to the lower half. `useId()` makes the gradient, filter and clip ids unique per instance. No fill reads a theme token, so by our reading the mark looks the same in light and dark mode.
- Accessibility: the file contains none of `aria-`, `role=`, `title` or `<title`.

### 4. How Untitled UI's own screens use them

- `header-navigation.tsx`: the fetch tool counted three lines containing "Logo": the import `import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";` and `<UntitledLogo className="h-6" />` twice (mobile menu and desktop header). The desktop one sits inside `<a aria-label="Go to homepage" href="/" ...>`; the mobile one sits in plain `div` and `aside` elements.
- `sidebar-navigation/sidebar-slim.tsx`: imports both, renders `<UntitledLogoMinimal className="size-6" />` inside `<div className="flex justify-center px-3">` and `<UntitledLogo className="h-6" />` inside `<div className="px-4">`, with no `aria-label` on either wrapper.
- `sidebar-navigation-base.tsx` contains no line with "Logo". The other four sidebar files (`sidebar-dual-tier.tsx`, `sidebar-section-dividers.tsx`, `sidebar-sections-subheadings.tsx`, `sidebar-simple.tsx`) were not read.
- So the accessible name, where there is one, comes from the link around the logo, not from the logo.

### 5. The spec's Benchmark row, item by item

`docs/specs/ORV-118/spec.md` line 46 wrote, from memory: two foundation components, a lockup and a mark-only form, sized by `className`, no variants, sizes, states or slots, drawn as an SVG. Against the pages read:

- Two foundation components: matches. `UntitledLogo` and `UntitledLogoMinimal` in `components/foundations/logo/` (section 1).
- A lockup and a mark-only form: matches. The code's own comments name the wordmark SVG "Logomark" and the mark "Minimal logo" (section 2).
- Sized by `className`: matches. Defaults `h-8` (lockup) and `size-8 scale-[1.2]` (mark); Untitled's screens pass `h-6` and `size-6` (sections 2 to 4).
- No variants, sizes, states or slots: matches. No such prop in either file; no slot by our reading (sections 2 and 3).
- Drawn as an SVG: partly. The mark is one SVG that embeds a base64 WebP image; the lockup is an HTML `div` holding two SVGs and a spacer `div` (sections 2 and 3).
- Not in the row, colour and dark mode: the wordmark paths fill with `fg-primary`, which `theme.css` switches under `.dark-mode`; the mark's colours are fixed literals (sections 2 and 3).
- Not in the row, accessible name: neither component sets one; Untitled's header puts `aria-label="Go to homepage"` on the link around it, the slim sidebar sets none (sections 2 to 4).
- Not in the row, docs page: none. The components list has no logo entry; the "Logos" resource is fictional placeholder company logos (section 1).

### What the sources do not say

- No page states a minimum size, a clear space, a small-size form or a one-colour form for Untitled UI's own logo; none was found in the files read.
- Nothing was rendered, so no computed size or colour was observed.

## Why it matters for ORIVILO

`docs/specs/ORV-118/spec.md` open question 9 asks for the Untitled UI benchmark row to be read from its pages before the slice A story is built. This entry is that reading; how the row and the Logo API change, if at all, is for the designer and the architect.
