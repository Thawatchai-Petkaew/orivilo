---
id: K-0389
topic: design
claim: shadcn/ui's Calendar page says the component is built on React DayPicker, defers its API to that library's docs, shows single and range modes, a dropdown month and year caption, presets, date and time, booked dates, a `--cell-size` variable, week numbers, RTL and a `timeZone` prop, tells readers how to swap in the Persian calendar, and never uses the word Buddhist.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/radix/calendar.mdx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/base/calendar.mdx; https://ui.shadcn.com/docs/components/radix/calendar"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, from the MDX source on `main` (no commit hash shown) and the rendered Radix page, which the tool cut off at "Booked dates". The page offers Base UI, React Aria and Radix UI versions. The Base UI MDX has the same headings and the same About sentence. The React Aria MDX path tried (`components/react-aria/calendar.mdx`) returned 404, so that version was not read.

> The `Calendar` component is built on top of [React DayPicker](https://react-day-picker.js.org).

> See the [React DayPicker](https://react-day-picker.js.org) documentation for more information on the `Calendar` component.

> The Calendar component accepts a `timeZone` prop to ensure dates are displayed and selected in the user's local timezone.

> You can customize the size of calendar cells using the `--cell-size` CSS variable.

> Use `showWeekNumber` to show week numbers.

Headings in order: Installation, Usage, About, Date Picker, Persian / Hijri / Jalali Calendar, Selected Date (With TimeZone), Basic, Range Calendar, Month and Year Selector, Presets, Date and Time Picker, Booked dates, Custom Cell Size, Week Numbers, RTL, API Reference, Changelog, RTL Support.

The rendered page adds that the time zone is detected in a `useEffect` to avoid hydration mismatches. The RTL section says to "pass both the `locale` and `dir` props to the Calendar component" and to "import the locale from `react-day-picker/locale`". The page has no accessibility or keyboard section. A word search of both MDX files for "Buddhist" found none.

## Why it matters for ORIVILO

This is the shadcn/ui row of the benchmark. Most behaviour sits in React DayPicker (K-0395 to K-0397), and the page's only calendar swap is Persian, so a Thai year has no shadcn instruction of its own.
