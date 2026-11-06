---
id: K-0284
topic: design
claim: WAI-ARIA 1.2 marks aria-grabbed and aria-dropeffect as deprecated in ARIA 1.1 and advises authors to treat them as deprecated, expecting a new feature to replace them in a future version.
source: "https://www.w3.org/TR/wai-aria-1.2/#aria-grabbed"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters, in the page ranges 300,000 to 400,000 and from 400,000 to its end.

> The `aria-dropeffect` property is expected to be replaced by a new feature in a future version of WAI-ARIA. Authors are therefore advised to treat `aria-dropeffect` as deprecated.

> The `aria-grabbed` state is expected to be replaced by a new feature in a future version of WAI-ARIA. Authors are therefore advised to treat `aria-grabbed` as deprecated.

Both attributes carry the mark "[Deprecated in ARIA 1.1]" in the attribute list. `aria-dropeffect` there "Indicates what functions can be performed when a dragged object is released on the drop target."

## Why it matters for ORIVILO

These are the two ARIA attributes written for drag and drop, and the specification sets them aside, so ARIA 1.2 gives a drop zone no drop state of its own among what was read.
