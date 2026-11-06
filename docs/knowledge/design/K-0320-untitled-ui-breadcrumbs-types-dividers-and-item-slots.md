---
id: K-0320
topic: design
claim: Untitled UI React Breadcrumbs offers three types (text, text-line, button), two dividers (chevron, slash) with a per-item override, icon and avatar item slots and a controlled account item, and its page names no size prop and no disabled item prop.
source: "https://www.untitledui.com/react/components/breadcrumbs.md; https://www.untitledui.com/react/components/breadcrumbs"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The page's API reference is a placeholder (`<ApiReference slug="breadcrumbs" />`) in the fetched text, so the props table was not read.

> Set the `type` prop on `Breadcrumbs` to `"text"`, `"text-line"` or `"button"`,

> Pass `divider="slash"` to `Breadcrumbs` to swap the default `"chevron"` for a slash.

> A single `Breadcrumbs.Item` can still override it with its own `divider` prop.

### Variants

- `type`: `"text"` (default); `"text-line"` "adds top and bottom rules around the trail"; `"button"` "gives each item a padded, hoverable background".
- `divider`: `"chevron"` (default) or `"slash"`, shared through `BreadcrumbsContext`.
- Examples on the page: Breadcrumbs text, Breadcrumbs text with line, Breadcrumbs button, Account button chevron, Account button slash.

### Slots

- `icon` on `Breadcrumbs.Item` takes a component or an element: "Omit the children to get an icon-only crumb", the form used for the home item.
- `avatarSrc` on `Breadcrumbs.Item`: "Yes, pass `avatarSrc` to `Breadcrumbs.Item` with an image URL." It renders an `xs` avatar in a rounded ring, children as the workspace name.
- "Use `Breadcrumbs.AccountItem`, which is fully controlled:" it takes `items` (`id`, `name`, `email`, `avatar`), `selectedKey` and `onSelectionChange`, and renders a `Dropdown` with single selection and `disallowEmptySelection`.

### Not on the page

A size prop (the only size named is the `xs` avatar), a disabled item prop, a loading state, mobile or responsive behaviour, keyboard interaction, and `href` or routing.

## Why it matters for ORIVILO

Design-system rules ask for variants, sizes, states and slots read from the Untitled page before a component story. This is that reading for the breadcrumb trail, with the empty size cell stated rather than left blank.
