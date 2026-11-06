---
id: K-0357
topic: design
claim: WAI-ARIA 1.2 defines separator as a divider between sections of content or groups of menuitems; not focusable, it is a static structural element, superclass structure, related to HTML hr; focusable, it is a moveable widget, and authors must set aria-valuenow and should set aria-valuemin if not 0 and aria-valuemax if not 100.
source: "https://www.w3.org/TR/wai-aria-1.2/; packages/design-system/src/components/resizable/Resizable.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, characters 230000 to 330000 of the page text. Confidence 0.8: one normative source, quoted.

> A divider that separates and distinguishes sections of content or groups of menuitems.

> If a separator is not focusable, it is revealed to assistive technologies as a static structural element.

> a focusable, interactive widget that is also moveable.

> authors MUST set the value of aria-valuenow to a number reflecting the current position of the separator

> Authors SHOULD also provide the value of aria-valuemin if it is not 0 and the value of aria-valuemax if it is not 100.

> authors SHOULD provide an accessible name for each one

The last line applies when there are several focusable separators. Characteristics, as the fetch tool gave them: superclass `structure` (if not focusable), `widget` (if focusable); related concept `<hr>` in HTML; required `aria-valuenow` (if focusable); name from author.

## Why it matters for ORIVILO

A shared Separator is the static case. The focusable case already exists in the repo as the Resizable handle (`packages/design-system/src/components/resizable/Resizable.tsx`, lines 241 to 250).
