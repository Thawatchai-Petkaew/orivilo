---
id: K-0388
topic: design
claim: React Aria shows dates in the calendar system its DateFormatter resolves for the locale, overridable by the Unicode calendar extension through `I18nProvider`, while `onChange` keeps the calendar of the value or Gregorian, and `@internationalized/date` has a BuddhistCalendar with one era BE; its week start comes from a `firstDayOfWeek` prop, then the locale, defaulting to Sunday for a region absent from its table, and Thailand is absent.
source: "https://react-aria.adobe.com/DatePicker; https://react-aria.adobe.com/Calendar; https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-stately/src/calendar/useCalendarState.ts; https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/%40internationalized/date/src/calendars/BuddhistCalendar.ts; https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/%40internationalized/date/src/queries.ts; https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/%40internationalized/date/src/weekStartData.ts"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main`, no commit hash shown. No page read shows a Thai example; "Buddhist" is not on the DatePicker page.

From the DatePicker page:

> By default, `DatePicker` displays the value using the calendar system for the user's locale.
> Use `<I18nProvider>` to override the calendar system by setting the Unicode calendar locale extension.
> The `onChange` event always receives a date in the same calendar as the `value` or `defaultValue`
> (Gregorian if no value is provided), regardless of the displayed locale.

From `useCalendarState.ts`:

```ts
let defaultFormatter = useMemo(() => new DateFormatter(props.locale), [props.locale]);
let resolvedOptions = useMemo(() => defaultFormatter.resolvedOptions(), [defaultFormatter]);
() => createCalendar(resolvedOptions.calendar as CalendarIdentifier),
let calendarValue = toCalendar(prev, baseValue?.calendar || new GregorianCalendar());
```

`BuddhistCalendar.ts`: `BUDDHIST_ERA_START = -543`, identifier `'buddhist'`, `getEras()` returns `['BE']`.

Week start, from `queries.ts`:

```ts
let weekStart = firstDayOfWeek ? DAY_MAP[firstDayOfWeek] : getWeekStart(locale);
weekInfo = { firstDay: region ? weekStartData[region] || 0 : 0 };
```

`getWeekStart` first tries `Intl.Locale`'s `getWeekInfo`, then a `-fw-` extension, then `-ca-iso8601`, then the table. `weekStartData.ts` says "Locales starting on Sunday have been removed for compression." It has no TH entry and no US entry, so both read as 0.

The Calendar page says `firstDayOfWeek` and `weeksInMonth` "override the locale-specified defaults".

## Why it matters for ORIVILO

On this route the Thai year follows whatever the runtime's `Intl` resolves (K-0406) unless the locale string fixes it, and the stored value stays Gregorian.
