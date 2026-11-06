---
id: K-0165
topic: design
claim: WCAG technique ARIA19 uses role=alert, which it treats as equivalent to aria-live=assertive, to tell assistive technology of an input error, and its test expects an empty error container with that role in the DOM on page load, with the message injected into it after the error.
source: "https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA19; packages/design-system/src/components/field/Field.tsx; packages/design-system/src/components/checkbox/Checkbox.tsx; packages/design-system/src/components/dialog/Dialog.tsx; packages/design-system/src/components/sheet/Sheet.tsx; packages/design-system/src/components/table/Table.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-222]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes. Confidence 0.8: the W3C technique page, one source. A technique is one sufficient way to meet a criterion, not the criterion itself.

> The purpose of this technique is to notify Assistive Technologies (AT) when an input error occurs.

> The error container must be present in the DOM on page load

> The following example uses role=alert which is equivalent to using `aria-live=assertive`.

Example 1 headline: "Injecting error messages into a container with role=alert already present in the DOM".

Test procedure:

1. "Determine that an empty error container with `role=alert` or `aria-live=assertive` attribute is present"
2. "Trigger the error that causes the content in the live region to appear or update."
3. "Determine that the error message was injected into the already present error container."

## Why it matters for ORIVILO

`Field`, `Checkbox`, `Dialog`, `Sheet` and `Table` each mount a `role="alert"` node together with its message, so the node is not there first. Whether that announces reliably is not tested in any source read; this technique's test describes a different order.
