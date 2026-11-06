---
id: K-0352
topic: design
claim: Untitled UI's Content divider page (the index has no Separator entry) gives a required type prop with three values, single-line, dual-line and background-fill, no default, children that may be a text label, a Button or a ButtonGroup, a className merged on a w-full root, and four examples; the page names no size, orientation or disabled state.
source: "https://www.untitledui.com/react/components; https://www.untitledui.com/react/components/content-dividers.md; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.8: one page, quoted; the API reference is a placeholder (`<ApiReference slug="content-dividers" />`) and the demo code is not in the page text, so props beyond the FAQ were not read.

Install: `npx untitledui@latest add content-divider`, or copy from `application/content-divider`. Examples: Content divider example, Single line, Dual line, Background fill.

> The `type` prop accepts `"single-line"`, `"dual-line"` and `"background-fill"`.

> There is no default [-] `type` is required, so you always pick one explicitly.

> Only `"single-line"` draws a rule on each side of the children;
> `"dual-line"` centers them between a top and bottom border,
> and `"background-fill"` centers them on a filled, rounded bar.

> Anything you pass as `children` is rendered in the divider: a text label, a `Button`, or a `ButtonGroup` all work.

> The `className` prop is merged onto the root element, so Tailwind utilities override the built-in styles

> The root is `w-full`, so constrain the width by wrapping it in a container of the size you want.

Word check by the fetch tool: "vertical", "orientation", "disabled", "hr" and "role" are not on the page; "size" appears only in the width sentence.

## Why it matters for ORIVILO

The audit maps Separator to Untitled's Content dividers (`docs/specs/ORV-64/audit.md`, line 66). The page's component carries content between rules, which is a different job from a bare line (K-0355), and that gap belongs in the benchmark's Untitled UI row.
