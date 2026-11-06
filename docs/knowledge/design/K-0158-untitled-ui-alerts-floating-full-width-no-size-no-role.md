---
id: K-0158
topic: design
claim: Untitled UI React's Alerts page gives two components, `AlertFloating` and `AlertFullWidth`, in the colours default, brand, gray, error, warning and success, with a colour-picked featured icon, a string title, a description cut to one line from the `md` breakpoint up, and optional confirm and dismiss actions; it names no size, no role, no live region and no keyboard behaviour, its API table is a placeholder, and the public repo's `components/application` folder lists no alerts.
source: "https://www.untitledui.com/react/components/alerts; https://www.untitledui.com/react/components/alerts.md; https://api.github.com/repos/untitleduico/react/contents/components/application; https://raw.githubusercontent.com/untitleduico/react/main/components/base/buttons/close-button.tsx; docs/knowledge/design/K-0096-untitled-ui-title-and-supporting-text-pair.md; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-222]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes, and strips some backticks. Confidence 0.75: page text only. The API reference renders as `<ApiReference slug="alerts" />` with no table in what the tool returned, so props below come from the page's FAQ. K-0096 records two API cells for this page ("The title of the alert." and "The description of the alert."); today's read did not return them.

> Only `AlertFullWidth` accepts the `actionType` and `className` props.

> the alert has no dismiss affordance at all when `onClose` is omitted.

> The same string is also passed to the `CloseButton` as its accessible `label`

> Keep the description short, since it is truncated to a single line from the `md` breakpoint up.

> while `title` must be a plain `string`.

### Page

- Forms: `AlertFloating`, a rounded card with a border and shadow placed inside the layout; `AlertFullWidth`, an edge-to-edge banner with its content centred in a `max-w-container` wrapper.
- `color`: `default` (the default), `brand`, `gray`, `error`, `warning`, `success`. Examples: one per form and colour.
- Icon by colour: InfoCircle for default, brand and gray; AlertCircle for error and warning; CheckCircle for success.
- Slots: featured icon (picked by `color`), `title` (string), `description` (node, so JSX and links are allowed), an action row that renders only when `onConfirm` or `onClose` is passed.
- Actions: `onConfirm` with `confirmLabel`, which the FAQ gives as required on both forms; `onClose` adds a text dismiss action and a small `CloseButton`; `dismissLabel` defaults to "Dismiss".
- `CloseButton` position: top right in `AlertFloating`; in `AlertFullWidth` absolute in the corner on mobile, inline beside the actions from `md` up.
- `actionType` (`AlertFullWidth` only): `button` (default) gives secondary and primary buttons that stack on mobile; `link` gives link-gray and link-color buttons on one row.
- The words role, aria-live, announce, screen reader, keyboard and focus do not appear on the page. Size, sm, lg, loading, disabled and hover do not appear as alert options; `md` appears only as a breakpoint.

### Repo

- The GitHub listing of `components/application` holds 12 names (app-navigation, carousel, charts, date-picker, empty-state, file-upload, loading-indicator, modals, pagination, slideout-menus, table, tabs): no alerts. The alert's own markup, classes and any role it sets are therefore unread.
- `close-button.tsx`: `aria-label={label || "Close"}`, so the label falls back to English "Close" when none is given.

## Why it matters for ORIVILO

This is the Untitled UI row for Alert (D.3 row 19 of `docs/specs/ORV-64/audit.md`). The page does not say whether the alert announces itself, and the code that would say was not found in the public repo, so that cell stays unknown. Error and warning share one icon here, so on the icon alone only colour tells them apart.
