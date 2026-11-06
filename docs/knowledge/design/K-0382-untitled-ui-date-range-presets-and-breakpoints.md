---
id: K-0382
topic: design
claim: Untitled UI's DateRangePicker takes a `{ start, end }` value and has nine presets (the page's figure, matching nine keys in the file) shown in a sidebar from `lg` up, while below `md` the page lists three inline presets; week presets follow the locale's first day of the week and "All time" starts at January 1, 2000.
source: "https://raw.githubusercontent.com/untitleduico/react/main/components/application/date-picker/date-range-picker.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/date-picker/range-calendar.tsx; https://www.untitledui.com/react/components/date-pickers.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main`, no commit hash shown. `range-preset.tsx` was not read.

From the page:

> Its value is an object of `DateValue`s shaped `{ start, end }`.

> From the `lg` breakpoint up it shows nine presets in a sidebar
> and below `md` it shows Last week, Last month and Last year as inline buttons instead.
> The week presets use the current locale's first day of the week.

From `date-range-picker.tsx`, the `presets` object (nine keys, own count of keys in that object):

```tsx
thisWeek: { label: "This week", value: { start: startOfWeek(now, locale), end: endOfWeek(now, locale) } },
start: startOfWeek(now, locale).subtract({ weeks: 1 }),
thisYear: { label: "This year", value: { start: startOfMonth(now.set({ month: 1 })), end: endOfMonth(now.set({ month: 12 })) } },
start: now.set({ year: 2000, month: 1, day: 1 }),
```

Labels in order: Today, Yesterday, This week, Last week, This month, Last month, This year, Last year, All time.

The trigger reads `Select dates` when empty, otherwise `${formattedStartDate} – ${formattedEndDate}`. The picker and its dialog take `aria-label="Date range picker"`, and it sets `shouldCloseOnSelect={false}`. The sidebar is `w-38`; the footer's start and end inputs are hidden below `md`; Cancel and Apply are `sm`.

Own reading of `range-calendar.tsx`: inline presets render on `(showPresetsOnDesktop || !isDesktop) && presets`, with `isDesktop = useBreakpoint("md")`. So between `md` and `lg` neither the sidebar nor the inline row shows unless `showPresetsOnDesktop` is set. The page does not state that band.

## Why it matters for ORIVILO

Audit A.1 calls range and presets a second story. This is the fullest preset set read, every label an English literal, and it shows that presets depend on the week start (K-0388).
