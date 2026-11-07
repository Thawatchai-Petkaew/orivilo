---
id: K-0322
topic: design
claim: Untitled UI treats the last crumb as the current page (a link with aria-current page, disabled and not focusable) and wraps the trail in a nav labelled Breadcrumbs, and no breadcrumbs component file is in its open repo tree, so this rests on the page alone.
source: "https://www.untitledui.com/react/components/breadcrumbs.md; https://www.untitledui.com/react/components/breadcrumbs; https://api.github.com/repos/untitleduico/react/git/trees/main?recursive=1; https://raw.githubusercontent.com/untitleduico/react/main/components/base/dropdown/dropdown-account-breadcrumb.tsx; https://react-aria.adobe.com/Breadcrumbs"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. Confidence 0.75, not 0.8: the code could not be read, and part of the claim is an absence.

### Breadcrumbs page

> treats the last item as the current page

> its link gets `aria-current="page"`, is disabled so it is not focusable

> The trail is wrapped in a `<nav aria-label="Breadcrumbs">`,

> is styled through the `isCurrent` render prop

The page does not describe keyboard interaction.

### Repo tree

- The tree holds one path with "breadcrumb" in it: `components/base/dropdown/dropdown-account-breadcrumb.tsx`. The tree was read in two calls that together cover the whole response, which ends `"truncated":false`.
- `components/application/breadcrumbs/breadcrumbs.tsx` and `components/base/breadcrumbs/breadcrumbs.tsx` both returned 404.
- `DropdownAccountBreadcrumb` is an account switcher with `selectionMode="single"` and `disallowEmptySelection`. The file sets no `aria-*`, `role` or `aria-label`; the trigger's name comes from its text.

### React Aria Breadcrumbs (the base the Untitled page names)

> Place breadcrumbs inside a `<nav>` element with an `aria-label` to create a navigation landmark.

The page's examples hide the chevron with `{!isCurrent && <ChevronRight size={14} />}` and style `[data-current]`. `aria-current`, keyboard interaction and any collapse or overflow behaviour are not on that page.

## Why it matters for ORIVILO

The Untitled last crumb is a link that cannot be reached by keyboard, one of the three current-crumb forms read. Because no code was read, what it renders is known only from the page's words.
