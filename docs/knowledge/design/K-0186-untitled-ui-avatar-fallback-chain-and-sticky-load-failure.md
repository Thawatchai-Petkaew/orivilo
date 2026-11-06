---
id: K-0186
topic: design
claim: Untitled UI's Avatar falls back from src through initials, placeholderIcon and placeholder to a default User01 icon when src is empty or the image fails; it renders the img at once, sets a failed flag from onError, and nothing in avatar.tsx clears that flag when src changes.
source: "https://www.untitledui.com/react/components/avatars.md; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/avatar.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/avatar-profile-photo.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: MIT
---

## Evidence

Read through a fetch tool that returns short quotes; `avatar.tsx` is the `main` branch.

### The page

> "If `src` is empty or the image fails to load, `Avatar` falls back in this order: `initials`, then the"
> "`placeholderIcon` component, then the `placeholder` element, and finally a default `User01` icon."

### The code

```text
const [isFailed, setIsFailed] = useState(false);
const canShowImage = src && !isFailed;
<img data-avatar-img className="size-full object-cover" src={src} alt={alt} onError={() => setIsFailed(true)} />
if (initials) {
if (PlaceholderIcon) {
return placeholder || <User01 className={cx("text-fg-quaternary", styles[size].icon)} />;
```

- The import line is `import { type FC, type ReactNode, useState } from "react";`, and the fetch reports no `useEffect` in the file and nothing that sets `isFailed` back to false.
- `AvatarProfilePhoto` follows the same order (`if (src && !isFailed) {`, `if (initials) {`, `if (PlaceholderIcon) {`, then `placeholder` or `User01`). Whether it clears the flag was not checked.

### Own reading of those lines

- A failed image stays failed for that component instance, so a new `src` does not show until the instance remounts.
- There is no preload: the `img` renders as soon as `src` is set, and the fallback appears only after `onError`. While the image loads, the wrapper's background shows. The page names no loading state.
- `initials` is shown as given; `Avatar` derives nothing from a name (K-0202).

## Why it matters for ORIVILO

Audit D.3 row 21 asks for a fallback chain story. This is the Untitled UI form of that chain, with the failure and retry behaviour stated.
