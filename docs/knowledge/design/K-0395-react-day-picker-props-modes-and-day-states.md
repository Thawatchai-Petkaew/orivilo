---
id: K-0395
topic: design
claim: React DayPicker's props cover single, multiple and range modes, `numberOfMonths` (default 1), four caption layouts, month bounds, `disabled` and `hidden` matchers, `fixedWeeks`, `showWeekNumber`, a `footer` slot, `components` overrides and `formatters`, and it names day states disabled, hidden, outside, focused and today plus selected, range start, middle and end.
source: "https://raw.githubusercontent.com/gpbl/react-day-picker/main/packages/react-day-picker/src/types/props.ts; https://raw.githubusercontent.com/gpbl/react-day-picker/main/packages/react-day-picker/src/UI.ts"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main` at package version 10.0.2 (K-0394), no commit hash shown. `Mode` is imported from `shared.js`, which was not read; the values used in `props.ts` are `"single"`, `"multiple"`, `"range"`.

```ts
captionLayout: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
navLayout: "around" | "after" | undefined;
role: "application" | "dialog" | undefined;
```

> Display always 6 weeks per each month, regardless of the month’s number of weeks.

> Show the outside days (days falling in the next or the previous month).

> Show the week numbers column. Weeks are numbered according to the local week index.

> Apply the `disabled` modifier to the matching days. Disabled days cannot be selected when in a selection mode is set.

> The earliest month to start the month navigation.

Other props read: `defaultMonth`, `month`, `endMonth`, `pagedNavigation`, `reverseMonths`, `hideNavigation`, `disableNavigation`, `reverseYears`, `hideWeekdays`, `animate`, `ISOWeek`, `broadcastCalendar`, `timeZone`, `noonSafe`, `autoFocus`, `today`, `modifiers`, `labels`, `dir`, `lang`.

From `UI.ts`:

```ts
disabled = "disabled",
hidden = "hidden",
outside = "outside",
focused = "focused",
today = "today",
```

```ts
range_end = "range_end",
range_middle = "range_middle",
range_start = "range_start",
selected = "selected",
```

The library has no sizes or visual variants of its own in these files; shadcn adds `buttonVariant` and `--cell-size` (K-0389, K-0390).

## Why it matters for ORIVILO

The state names map closely to what DESIGN.md section 7 asks each to show, and a `footer` or `components` slot is where a preset row or a Today action could sit.
