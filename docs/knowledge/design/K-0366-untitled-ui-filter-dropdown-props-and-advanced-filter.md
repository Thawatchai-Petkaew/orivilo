---
id: K-0366
topic: design
claim: Untitled UI's FilterDropdown takes filters (rows of id, field, operator, value held by the caller), renderFilterRow, onAddFilter, onRemoveFilter, onFilterChange, onClearAll, onApply, appliedCount (a count badge on the default Filters button), children as a custom trigger that drops appliedCount and isDisabled, and placement (bottom end by default, bottom, bottom start).
source: "https://www.untitledui.com/react/components/filter-bars.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.8: one page, quoted from its FAQ; the API table is a placeholder.

> `filter-dropdown-menu.tsx` exports `FilterDropdown`, `FilterDialog` and `CountBadge` for the advanced filter popover.

> Keep an array of `{ id, field, operator, value }` rows in your own state, pass it as `filters`,
> and render each row's inputs with `renderFilterRow(filter, onChange)`, calling `onChange` with the changed fields.
> Wire up `onAddFilter`, `onRemoveFilter`, `onFilterChange` and `onClearAll`;

> **Apply filter** calls `onApply` with the current rows and closes the popover.

> Pass `appliedCount` to `FilterDropdown` and the default **Filters** button shows it in a badge.

> To use your own trigger, pass it as `children`; `appliedCount` and `isDisabled` then have no effect.

> The popover opens at `"bottom end"` by default, and `placement` also accepts `"bottom"` and `"bottom start"`.

## Why it matters for ORIVILO

Filters apply on a button press here, not on each change, and the count sits on the trigger. Both are options for the designer, to weigh against what the overview and Inspector stories need.
