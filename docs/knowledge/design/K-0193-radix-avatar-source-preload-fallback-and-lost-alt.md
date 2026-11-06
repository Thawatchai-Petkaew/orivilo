---
id: K-0193
topic: design
claim: The source of @radix-ui/react-avatar 1.3.1, the version in the repo's lockfile, preloads src with window.Image, mounts the img only once loaded, shows Fallback in every other status, resets on a new src, sets no aria or role attribute, and passes alt only through to the img, so the alt text leaves the page while Fallback shows.
source: "https://unpkg.com/@radix-ui/react-avatar@1.3.1/dist/index.mjs; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/avatar/src/avatar.tsx; pnpm-lock.yaml"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: MIT
---

## Evidence

`pnpm-lock.yaml` lists `@radix-ui/react-avatar@1.3.1` (lines 1677 and 9679, under `radix-ui`). The quotes are from the built file of that version on unpkg; the `main` source on GitHub gave the same statuses, listeners, render conditions and `crossOrigin` lines.

### Status

```text
const image = new window.Image();
image.addEventListener("load", handleLoad);
image.addEventListener("error", handleError);
return image.complete ? image.naturalWidth > 0 ? ImageLoadingStatus.Loaded : ImageLoadingStatus.Error
  : ImageLoadingStatus.Loading;
```

- Four statuses: `idle`, `loading`, `loaded`, `error`.
- Inside `if (!src) {` the status becomes `Error`, so a missing `src` shows the fallback.
- Cleanup removes both listeners and calls `setLoadingStatus(ImageLoadingStatus.Idle);`. The effect depends on `[src, crossOrigin, referrerPolicy, setLoadingStatus]`, so a new `src` starts over.

### Render

```text
imageLoadingStatus === ImageLoadingStatus.Loaded ? /* @__PURE__ */ jsx(Primitive.img, { ...imageProps,
return canRender && context.imageLoadingStatus !== ImageLoadingStatus.Loaded ?
const [canRender, setCanRender] = React.useState(delayMs === void 0);
const timerId = window.setTimeout(() => setCanRender(true), delayMs);
```

- Root and Fallback render `span`; Image renders `img`.
- The fetch reports no `aria-*` and no `role`.
- `alt` is never named: `const { __scopeAvatar, src, onLoadingStatusChange, ...imageProps } = props;` carries it in the spread to the `img`.
- A second image under one root warns in development: "Avatar: Only one `Avatar.Image` component should be rendered per `Avatar.Root`, but multiple were detected."

### Own reading of those lines

- With no `delayMs` the fallback shows at once, also while the image loads, then leaves when it has loaded.
- With `delayMs` nothing shows until the timer ends, also after an early failure.
- While the fallback shows, no `img` is mounted and `alt` is nowhere in the output. What assistive technology gets is the fallback's own content: initials as read text, or an icon.

## Why it matters for ORIVILO

A name passed only as `alt` is lost on load failure, so a person's picture standing alone would be named by its initials. How the name survives is a design question; this entry only records the mechanism.
