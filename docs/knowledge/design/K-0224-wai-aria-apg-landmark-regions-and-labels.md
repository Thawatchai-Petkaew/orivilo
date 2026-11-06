---
id: K-0224
topic: design
claim: The WAI-ARIA APG says all perceivable content belongs in a landmark, a repeated landmark type takes a unique label without the role word in it, a page may have one banner and should have one main, complementary landmarks are top level, and seven or fewer landmarks is the rule of thumb; WCAG technique ARIA11 tests the same uniqueness.
source: "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/; https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/; https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html; https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/complementary.html; https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/; https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA11; apps/web/i18n/messages.ts"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The APG and technique ARIA11 agree on the label rule, but both are W3C pages, so they are not counted as independent and the confidence stays at 0.8.

Landmark Regions practice:

> provide each instance of that landmark with a unique label.

> Do not use the landmark role as part of the label.

- Banner: from `header` when its context is `body`; each page may have one.
- Main: from `main`; each page should have one.
- Navigation: from `nav`; no count. For identical link sets, "use the same label for each `navigation` landmark."
- Complementary: from `aside`.
- Region: from `section` with an accessible name; it must have a label.

> If an area begins with a heading element (e.g. `h1-h6`) it can be used as the label for the area

Landmarks pattern:

> For optimum value, a general rule of thumb is that a page contains seven or fewer landmark regions.

Navigation example:

> When there is more than one navigation landmark on a page, each should have a unique label.

Complementary example:

> `complementary` landmarks should be top level landmarks (e.g. not contained within any other landmarks).

> If the complementary content is not related to the main content, a more general role should be assigned (e.g. `region`).

Names and Descriptions practice:

> Do NOT include a WAI-ARIA role name in the accessible name.

> Use `aria-labelledby` if a visible label is present, otherwise use `aria-label`.

ARIA11:

> If the same type of landmark appears multiple times on the page, check that each one is given a unique and meaningful accessible name

The navigation example page does not address a `nav` nested in another landmark.

## Why it matters for ORIVILO

D.3 row 22 puts a top and a side navigation in the same shell, so these are the label rules for both, in both languages. The shell's one `nav` is named "Main" and "เมนูหลัก" today (`apps/web/i18n/messages.ts`); a second one needs a name of its own.
