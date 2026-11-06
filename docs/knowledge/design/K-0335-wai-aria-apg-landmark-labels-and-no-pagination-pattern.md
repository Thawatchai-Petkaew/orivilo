---
id: K-0335
topic: design
claim: The APG Landmark Regions page says each of several navigation landmarks should have a unique label and that the label should not contain the landmark role, and the APG patterns list holds Breadcrumb but no Pagination pattern.
source: "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/; https://www.w3.org/WAI/ARIA/apg/patterns/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

### Landmark Regions

> Navigation landmarks provide a way to identify groups (e.g. lists) of links

> If a page includes more than one navigation landmark, each should have a unique label

> Do not use the landmark role as part of the label.

> Use the HTML nav element to define a navigation landmark.

### Patterns list

Breadcrumb is in the list on `https://www.w3.org/WAI/ARIA/apg/patterns/`; Pagination is not. So the APG gives page navigation no pattern of its own. A word search of the Landmark Regions page found no hit for pagination, paging or breadcrumb, so applying its lines to a `nav` around either component is our reading.

## Why it matters for ORIVILO

A page with a main menu, a breadcrumb and a pagination bar has at least three navigation landmarks, so each needs its own label in Thai and English. The role-word line bears on labels such as "Pagination Navigation".
