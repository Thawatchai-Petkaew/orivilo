---
id: K-0385
topic: design
claim: Untitled UI's Calendars page is a separate component from the date picker's Calendar, a schedule of events with month, week and day views, `CalendarEvent` data, nine event colours and a 12-hour clock that is always on, so it answers a different job from picking a date.
source: "https://www.untitledui.com/react/components/calendars.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, which returns short quotes. The API reference is a placeholder (`<ApiReference slug="calendars" />`), so no prop table was read. No keyboard or accessibility section appears in the text returned.

> Powerful and customizable React calendar components built for modern applications and websites.

> `Calendar` accepts a `view` prop of `"month"`, `"week"` or `"day"`, defaulting to `"month"`.

> The `color` field on an event accepts "gray", "brand", "green", "blue", "indigo", "purple", "pink", "orange" or "yellow".

> Times always use a 12-hour clock, though, because the time formatters pass `hour12: true`.

> Wrap the calendar in React Aria's `I18nProvider` to force a specific locale.

The page's FAQ says `view` only seeds internal state, `events` take `id`, `title` and native `Date` `start` and `end`, and the time zone comes from `getLocalTimeZone()`. Install: `npx untitledui@latest add calendar`.

## Why it matters for ORIVILO

Audit A.1 has one Calendar row, and audit D.3 row 28 scopes it to decision log filters, which is a date to choose, not events to show. Naming the two pages apart keeps a benchmark from mixing them.
