---
id: K-0365
topic: design
claim: Untitled UI's filter bar is five layout parts, FilterBar.Root (a wrapping flex row), Content (grows and wraps tabs, search and selects), Actions (content width, buttons), FilterRow (one row of inputs with a remove button calling onRemove) and FilterIconButton, which only handle layout and hold no filter state.
source: "https://www.untitledui.com/react/components/filter-bars.md; packages/design-system/src/examples/decision-log.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.8: one page, quoted from its FAQ.

> The folder has two files. `filter-bar.tsx` exports the `FilterBar` layout parts:
> `FilterBar.Root`, `FilterBar.Content`, `FilterBar.Actions`, `FilterBar.FilterRow` and `FilterBar.FilterIconButton`.

> `FilterBar.Root` is a wrapping flex row.
> Put tabs, search and selects in `FilterBar.Content`, which grows to fill the space and wraps its children,
> and put buttons in `FilterBar.Actions`, which stays at its content width.

> `FilterBar.FilterRow` wraps one row of filter inputs with a remove button that calls `onRemove`.
> These parts only handle layout and hold no filter state.

The fetch tool listed `FilterBar.FilterIconButton` props as `icon`, `label` (required) and `onPress`.

## Why it matters for ORIVILO

The bar is a layout shell over other components (`Tabs`, `Input`, `Select`, `DateRangePicker`, `FilterDropdown`), so its state lives with the caller. That is a shape the repo could compare with its own Tabs-as-filter use in the decision log example.
