---
id: K-0364
topic: design
claim: Untitled UI's Filter bars page shows 13 examples (own count), eight bars (Simple, Tabs and search, Tabs and date picker, Date filters, Dropdowns, Dropdowns and date picker, Advanced filter inactive and active), three filter dropdown menus (empty state, inactive, active) and two slideout menus (empty state, active); apart from an isDisabled prop, those example names are the only states the page gives.
source: "https://www.untitledui.com/react/components; https://www.untitledui.com/react/components/filter-bars.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.8: one page; the demo code is not in the page text (`<ComponentCode component="filter-bar/FilterBarSimpleDemo" />`), and the API reference is a placeholder (`<ApiReference slug="filter-bars" />`).

Install: `npx untitledui@latest add filter-bar`. The slideout menus are iframe previews:

```text
npx untitledui@latest add slideout-menus/filters-advanced-menu
```

As the fetch tool gave them: Tabs and search has tabs for categories plus a search input; Date filters has quick-select period buttons, a dropdown and a date range picker; Advanced filter is a field, operator and value interface with removable rows. Index: "Filter bars" at `https://www.untitledui.com/react/components/filter-bars`, the only filter entry.

On states, the fetch tool found no text on loading, empty results only in example titles, clearing only as the `onClearAll` handler, and disabled only in the `isDisabled` sentence (K-0366).

## Why it matters for ORIVILO

The empty, inactive and active names are example titles, so what each looks like must be taken from the page's previews, which were not rendered here.
