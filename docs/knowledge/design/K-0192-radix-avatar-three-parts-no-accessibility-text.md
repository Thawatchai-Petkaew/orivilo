---
id: K-0192
topic: design
claim: Radix Primitives' Avatar page documents three parts (Root, Image, Fallback), with onLoadingStatusChange on Image and delayMs on Fallback; it lists no sizes, variants, data attributes or status element, and the words alt, aria, initials and accessibility do not occur on it.
source: "https://www.radix-ui.com/primitives/docs/components/avatar"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: MIT
---

## Evidence

> "An image element with a fallback for representing the user."
> "Automatic and manual control over when the image renders."
> "Fallback part accepts any children."
> "Optionally delay fallback rendering to avoid content flashing."

### Parts

> Root: "Contains all the parts of an avatar."
> Image: "The image to render. By default it will only render when it has loaded."
> Fallback: "An element that renders when the image hasn't loaded."
> "you can provide a `delayMs` prop to delay its rendering so it only renders for those with slower connections."

- Root: `asChild` (default `false`).
- Image: `asChild`, `onLoadingStatusChange` (function).
- Fallback: `asChild`, `delayMs` (number).
- No data attributes are documented.

### Word check on the page

- Not present: "alt", "aria", "online", "initials", "accessibility", "icon", "Thai", "Unicode", "grapheme", "script".
- "status" occurs only inside the name `onLoadingStatusChange`.

The one example is "Clickable Avatar with tooltip": `Avatar.Root` inside `Tooltip.Trigger`, with `<Avatar.Root>…</Avatar.Root>` and no image or fallback props shown. The Anatomy shows `<Avatar.Fallback />` with no children.

## Why it matters for ORIVILO

The Radix primitive is what the repo's components build on. It gives load control and nothing visual, so sizes, a status dot and the text alternative are left to the component built on it.
