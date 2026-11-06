---
id: K-0397
topic: design
claim: React DayPicker says it follows the APG for date pickers; its source sets role grid per month with `aria-multiselectable` in multiple and range modes, gridcell days with `aria-selected`, a roving tabIndex, a polite status on the caption, maps arrows and page keys with Shift for larger steps, and skips disabled and hidden days on keyboard moves up to 365 attempts; day names default to English "Today" and "selected".
source: "https://daypicker.dev/guides/accessibility; https://raw.githubusercontent.com/gpbl/react-day-picker/main/packages/react-day-picker/src/DayPicker.tsx; https://raw.githubusercontent.com/gpbl/react-day-picker/main/packages/react-day-picker/src/labels/labelDayButton.ts; https://raw.githubusercontent.com/gpbl/react-day-picker/main/packages/react-day-picker/src/helpers/getNextFocus.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main` at 10.0.2, no commit hash shown. Docs and source agree on the keys.

> DayPicker follows the ARIA Authoring Practices Guide for date pickers

> Depending on your design, you might need to add more accessibility features.

From `handleDayKeyDown`:

```tsx
ArrowLeft: [e.shiftKey ? "month" : "day", props.dir === "rtl" ? "after" : "before"],
ArrowDown: [e.shiftKey ? "year" : "week", "after"],
PageUp: [e.shiftKey ? "year" : "month", "before"],
Home: ["startOfWeek", "before"],
End: ["endOfWeek", "after"],
```

The map has no Enter, Space or Escape. The docs table says "Enter/Space": "Select the focused day."; the day is a native `button`, so by our reading the browser's click does this.

Roles and states:

```tsx
role="grid"
aria-multiselectable={mode === "multiple" || mode === "range"}
role="gridcell"
aria-selected={modifiers.selected || undefined}
tabIndex={isFocusTarget(day) ? 0 : -1}
```

The root takes `role={props.role}` and has none unless the caller sets it (`application` or `dialog`, K-0395). The caption and the footer have `role="status"` and `aria-live="polite"`. The grid is named by `aria-label` from `labelGrid`, not `aria-labelledby`. Weekdays take `aria-label={labelWeekday(...)}`; no `abbr`. A disabled day is `disabled` unless focused, then `aria-disabled`. Nav takes `aria-label={labelNav()}`; the buttons take `labelPrevious` and `labelNext`.

`labelDayButton.ts`:

```ts
if (modifiers.today) label = `Today, ${label}`;
if (modifiers.selected) label = `${label}, selected`;
```

`getNextFocus.tsx` recurses past a day that is disabled or hidden: `if (attempt > 365) {` returns `undefined`.

## Why it matters for ORIVILO

This is what a DayPicker build inherits. The dialog, its focus return and Escape come from the wrapper instead: Popover (K-0130).
