---
id: K-0399
topic: design
claim: React DayPicker defaults to locale enUS and Latin digits, takes its week start from a date-fns locale unless `weekStartsOn` overrides it, and its own `th` locale file adds Thai labels for days, next and previous month, month and year dropdowns, navigation, grid and week numbers, with no `weekStartsOn` of its own.
source: "https://daypicker.dev/localization/changing-locale; https://raw.githubusercontent.com/gpbl/react-day-picker/main/packages/react-day-picker/src/types/props.ts; https://raw.githubusercontent.com/gpbl/react-day-picker/main/packages/react-day-picker/src/locale/th.ts"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main` at 10.0.2, no commit hash shown. `https://daypicker.dev/localization` returned 404, so the section index was not read; the sibling pages are named on the Persian page's sidebar.

> Set the locale. Default is `en-US`.

> First day of the week (0 = Sunday, 1 = Monday, etc.).

> January day that must fall in the first week of the year.

> Numbering system for labels and formatted text.

From `props.ts`:

> The index of the first day of the week (0 - Sunday). Overrides the locale's

`numerals` defaults to `latn` and `locale` to `enUS`; `firstWeekContainsDate` is `1 | 4`.

`src/locale/th.ts` labels, as returned:

- `labelDayButton`: the date as `"PPPP"`, with the prefix `วันนี้, ` when today and the suffix `, เลือกแล้ว` when selected
- `labelMonthDropdown`: เลือกเดือน
- `labelYearDropdown`: เลือกปี
- `labelNext`: ไปเดือนถัดไป
- `labelPrevious`: ไปเดือนก่อนหน้า
- `labelNav`: แถบนำทาง
- `labelGrid`: month and year through `formatMonthYear`
- `labelWeekNumberHeader`: หมายเลขสัปดาห์

The file has no `weekStartsOn`; the week start reaches it from date-fns (K-0408). The Thai wording above is the library's and has not been read by a Thai reviewer here.

## Why it matters for ORIVILO

Every UI string has to come from our locale catalog, so these labels show which names a Thai build must supply. `labels` is the prop that takes them.
