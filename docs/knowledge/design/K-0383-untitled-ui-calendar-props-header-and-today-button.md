---
id: K-0383
topic: design
claim: Untitled UI's Calendar adds `highlightedDates` and a `children` slot to React Aria's props, shows a previous and next header with a default row of date input and an English Today button that both selects and focuses today, and RangeCalendar shows two months from `md` up and one below with at most two month grids.
source: "https://raw.githubusercontent.com/untitleduico/react/main/components/application/date-picker/calendar.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/date-picker/range-calendar.tsx; https://www.untitledui.com/react/components/date-pickers.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main`, no commit hash shown.

```tsx
interface CalendarProps extends AriaCalendarProps<DateValue> {
    /** The dates to highlight. */
    highlightedDates?: DateValue[];
```

The `children` prop comment says: "If not provided, a default layout will be rendered with a date input and a today button."

```tsx
<Button slot="previous" iconLeading={ChevronLeft} size="sm" color="tertiary" className="size-8" />
<AriaHeading className="text-sm font-semibold text-fg-secondary" />
state.setValue(today(getLocalTimeZone()));
state.setFocusedDate(today(getLocalTimeZone()));
```

The previous and next buttons have no `aria-label` in this file; their names come from React Aria (K-0387).

`range-calendar.tsx` adds `showPresetsOnDesktop` and `showOutOfRangeDates` (default false):

```tsx
const visibleDurationMonths = visibleDuration?.months || (isDesktop ? 2 : 1);
```

From the page:

> The layout renders at most two month grids, so use `visibleDuration={{ months: 1 }}` or `visibleDuration={{ months: 2 }}`.

> `RangeCalendar` accepts the prop in its types but doesn't apply it to its cells,
> `DatePicker` and `DateRangePicker` don't expose it, so use `Calendar` directly when you need custom highlights.

No month or year picker control appears in the lines read from `calendar.tsx`.

## Why it matters for ORIVILO

The header, the month count by breakpoint and the Today action are slots a benchmark table compares. The Today button commits a value, so it is an action, not only navigation.
