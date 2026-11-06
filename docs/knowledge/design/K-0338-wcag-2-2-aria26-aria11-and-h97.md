---
id: K-0338
topic: design
claim: WCAG 2.2 technique ARIA26 uses aria-current to expose a highlighted current item and is sufficient for SC 1.3.1 and 2.4.8, while ARIA11 and H97 say repeated navigation regions are told apart by aria-label or aria-labelledby, and none of the three names pagination or breadcrumbs.
source: "https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA26; https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA11; https://www.w3.org/WAI/WCAG22/Techniques/html/H97"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The tool reported that ARIA26 mentions neither pagination nor breadcrumbs, and word searches of ARIA11 and H97 found no hit for pagination, paging, breadcrumb or breadcrumbs.

### ARIA26: Using `aria-current` to identify the current item in a set

> the highlighted item has an `aria-current` attribute with a suitable value

- The technique exposes "the element that is usually only visually highlighted".
- Example 1 uses the `page` value "to programmatically identify the current page that the user is on."
- Related criteria: 1.3.1 Info and Relationships (sufficient) and 2.4.8 Location (sufficient).

### ARIA11: Using ARIA landmarks to identify regions of a page

> identical roles should be named using a valid technique for labeling regions.

- Example 2 labels two navigation landmarks with `aria-labelledby` to their visible headings; Example 3 uses `aria-label` when no visible text can serve.

### H97: Grouping related links using the nav element

> The objective of this technique is to group navigation links using the HTML `nav` element.

> distinguish the navigation groups by using an `aria-labelledby` or `aria-label` attribute

- Test: "links that are visually grouped and represent a section of the page are enclosed in a `nav` element."
- Related criteria: 1.3.1 (sufficient) and 2.4.1 Bypass Blocks (advisory).

## Why it matters for ORIVILO

ARIA26 ties `aria-current` to a Level A criterion as well as the AAA one, through 1.3.1, so a visible current-page mark has a programmatic counterpart in the techniques. How it applies to a page number is our reading.
