---
id: K-0285
topic: design
claim: W3C ARIA in HTML gives input type=file no corresponding role, allows no role on it, and allows global aria-* attributes plus aria-disabled, aria-invalid and aria-required, while the progress element has implicit role progressbar.
source: "https://www.w3.org/TR/html-aria/; packages/design-system/src/components/field/Field.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the first 100,000 of 172,302 characters were read, which held both rows.

> No corresponding role

> Global `aria-*` attributes, `aria-disabled`, `aria-invalid` and `aria-required` attributes.

> No `role` other than `progressbar`, which is _NOT RECOMMENDED_.

> Authors _SHOULD NOT_ use the `aria-valuemax` attribute on `progress` elements.

For `input type=file` the allowed roles cell reads "No `role`". The first and second quotes are from that row; the third and fourth are from the `progress` row, whose implicit semantics are `role=progressbar`.

## Why it matters for ORIVILO

A file input may carry `aria-invalid`, the attribute ORIVILO's `Field` passes to its control when it has an error. A role on the input is not allowed.
