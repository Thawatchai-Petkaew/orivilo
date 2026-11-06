---
id: K-0194
topic: design
claim: Base UI's Avatar, which shadcn/ui's default page describes, names a profile picture, initials or fallback icon, offers data-loading and data-error, and with keepMounted hides the image from assistive technology until it loads so that the fallback gives the accessible name on its own.
source: "https://base-ui.com/react/components/avatar"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: MIT
---

## Evidence

> "Displays a user’s profile picture, initials, or fallback icon."
> "Rendered when the image fails to load or when no image is provided."
> "With keepMounted, the image and the fallback are both present until the image loads."
> "The image is hidden from assistive technology until then, so the fallback provides the accessible name on its own."
> "An image that failed to load paints a broken-image icon on top of it."

- Root: "Renders a `<span>` element."
- `<Avatar.Image>` "preloads `src` and renders the image only once it has loaded." by default.
- Fallback `delay`: "How long to wait before showing the fallback. Specified in milliseconds." Default 0.
- `keepMounted`: `boolean | undefined`, default `false`.
- Data attributes: `data-loading` "Present while the image is loading", `data-error` "Present when the image failed to load", plus `data-starting-style` and `data-ending-style`.
- Example: `<Avatar.Image keepMounted render={<Image src="/avatar.png" width={32} height={32} alt="" />} />`.
- The hero demo's `Avatar.Fallback` holds `LT`; its `Avatar.Image` has no `alt`.
- "aria" does not occur on the page; "alt" occurs only in code. "Thai", "Unicode" and "grapheme" do not occur.

Base UI's source was not read. ORIVILO's package is Radix, not Base UI (K-0193).

## Why it matters for ORIVILO

Of the pages read, this is the one that says in prose where the accessible name comes from while the fallback shows. It is a statement about Base UI, not about Radix.
