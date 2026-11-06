---
id: K-0212
topic: design
claim: Untitled UI's Breadcrumbs take type text, text-line or button and a chevron or slash divider, collapse past maxVisibleItems (default 4) behind an ellipsis that expands the trail, wrap the trail in nav aria-label "Breadcrumbs", and treat the last item as the current page, a disabled link with aria-current page.
source: "https://www.untitledui.com/react/components/breadcrumbs.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes; two reads. The list under the quotes is the tool's wording of the page.

> `Breadcrumbs` collapses automatically via the `maxVisibleItems` prop, which defaults to `4`.

> Anything beyond that is replaced with a clickable ellipsis item that expands the full trail...

> React Aria's `Breadcrumbs` treats the last item as the current page: its link gets `aria-current="page"`, ...

> The trail is wrapped in a `<nav aria-label="Breadcrumbs">`, and the collapse toggle is labeled "See all breadcrumb items".

- Examples: "Breadcrumbs text", "Breadcrumbs text with line", "Breadcrumbs button", "Account button chevron", "Account button slash".
- `Breadcrumbs`: `type` (`"text"` default, `"text-line"`, `"button"`), `divider` (`"chevron"` default, `"slash"`), `maxVisibleItems`.
- `maxVisibleItems` defaults to `4`. Later items become a clickable ellipsis labelled "See all breadcrumb items"; `maxVisibleItems={0}` turns collapsing off.
- `Breadcrumbs.Item`: `icon`, `avatarSrc`, `divider`. `Breadcrumbs.AccountItem` is controlled: `items`, `selectedKey`, `onSelectionChange`.
- The last item is the current page: its link gets `aria-current="page"`, it is disabled so it takes no focus, and it can be styled through an `isCurrent` render prop.
- No size prop, and no mobile statement on this page. The page header hides the trail on small screens (K-0210).

## Why it matters for ORIVILO

D.3 row 26 asks for Breadcrumb, and a Page header carries one in Untitled UI. K-0228 is the APG rule for the same trail.
