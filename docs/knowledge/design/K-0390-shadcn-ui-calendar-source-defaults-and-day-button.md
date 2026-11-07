---
id: K-0390
topic: design
claim: shadcn/ui's calendar.tsx wraps DayPicker with `showOutsideDays` true, `captionLayout` "label" and `buttonVariant` "ghost", renders each day as a ghost icon Button with data attributes for single selection and range start, middle and end, fills selected days with `bg-primary` and the range middle with `bg-muted`, and takes its month dropdown text from `locale?.code` in `bases/radix` but from "default" in `new-york-v4`.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/radix/ui/calendar.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/calendar.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main`, no commit hash shown.

Both files:

```tsx
showOutsideDays = true,
captionLayout = "label",
buttonVariant = "ghost",
```

`bases/radix/ui/calendar.tsx`:

```tsx
date.toLocaleString(locale?.code, { month: "short" }),
data-day={day.date.toLocaleDateString(locale?.code)}
"size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
```

`new-york-v4/ui/calendar.tsx` uses `toLocaleString("default", { month: "short" })` and `day.date.toLocaleDateString()`.

Day button: a ghost, icon-sized `Button`; a `useEffect` runs `if (modifiers.focused) ref.current?.focus()`. Data attributes: `data-day`, `data-selected-single`, `data-range-start`, `data-range-end`, `data-range-middle`. In `bases/radix`, looks are `data-[selected-single=true]:bg-primary`, `data-[range-start=true]:bg-primary`, `data-[range-middle=true]:bg-muted`, `data-[range-end=true]:bg-primary`, and the focus ring is `group-data-[focused=true]/day:ring-[3px]`.

`classNames` keys that carry a state: `range_start`, `range_middle`, `range_end`, `today`, `outside`, `disabled`, `hidden`. Slot keys include `month_caption`, `dropdowns`, `nav`, `button_previous`, `button_next`, `month_grid`, `weekday`, `week_number`, `day`. `components` overrides `Root`, `Chevron`, `DayButton` (`CalendarDayButton`) and `WeekNumber`. The file defines no `--cell-size`; it only reads it.

## Why it matters for ORIVILO

Our rules keep no shadcn class, so the part that carries over is the slot and state map, not the fills. The two registry files differ on locale, so which one a spec reads matters.
