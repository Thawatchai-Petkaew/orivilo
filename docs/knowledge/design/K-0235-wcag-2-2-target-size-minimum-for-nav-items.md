---
id: K-0235
topic: design
claim: WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA, asks for pointer targets of at least 24 by 24 CSS pixels, with exceptions for spacing, an equivalent control, inline targets, user agent control and essential presentation.
source: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

> The size of the target for pointer inputs is at least 24 by 24 CSS pixels, except when:

> Undersized targets (those less than 24 by 24 CSS pixels) are positioned so that

> The function can be achieved through a different control on the same page that meets this criterion;

> The target is in a sentence or its size is otherwise constrained by the line-height of non-target text;

> The size of the target is determined by the user agent and is not modified by the author;

> A particular presentation of the target is essential or is legally required for the information being conveyed.

## Why it matters for ORIVILO

Icon-only rail items and small sub-items are the targets this reads on. Tailwind classes such as `size-9` and `h-7` were read as classes in K-0206 and K-0215; their pixel sizes were not read, so no pass or fail is recorded here.
