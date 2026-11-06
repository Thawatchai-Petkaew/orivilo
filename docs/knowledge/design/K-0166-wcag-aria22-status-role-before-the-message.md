---
id: K-0166
topic: design
claim: WCAG technique ARIA22 uses role=status, with implicit aria-live polite and aria-atomic true, and its test checks that the container has that role before the message occurs and holds the message, with any image equivalent inside it too.
source: "https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-222]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes. Confidence 0.8: the W3C technique page, one source. Role status itself is in K-0114.

> The aria live region role of `status` has an implicit `aria-live` value of `polite`

> The role of `status` also has a default `aria-atomic` value of `true`

Test procedure:

1. "Check that the container destined to hold the status message has a `role` attribute with a value of `status` _before_ the status message occurs."
2. "Check that when the status message is triggered, it is inside the container."
3. "Check that elements or attributes that provide information equivalent to the visual experience for the status message (such as a shopping cart image with proper `alt` text) also reside in the container."

## Why it matters for ORIVILO

Like ARIA19 (K-0165), the test puts the role on the container first. Step 3 keeps a visual equivalent inside the container, so an icon that carries meaning the words do not would need a text equivalent there.
