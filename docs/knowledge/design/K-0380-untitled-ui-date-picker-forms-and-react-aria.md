---
id: K-0380
topic: design
claim: Untitled UI's Date pickers page shows seven examples (own count of its example headings), is built with React Aria and Tailwind CSS, holds values as `DateValue` objects from `@internationalized/date` rather than JavaScript `Date`, restricts dates through `minValue`, `maxValue` and `isDateUnavailable`, and gives its trigger a `size` prop that defaults to "sm".
source: "https://www.untitledui.com/react/components/date-pickers.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, which returns short quotes. The page's API reference is a placeholder (`<ApiReference slug="date-pickers" />`), so no prop table was read; props below come from the FAQ on the page and from the source entries K-0381 to K-0384.

> Free and open-source React date picker components built for modern applications and websites.
> These date pickers are built using React Aria and styled with Tailwind CSS.

Example headings on the page (seven, own count of the headings under the examples section of `date-pickers.md`): Date picker, Date time picker, Date range picker with presets, Calendar, Calendar card, Range calendar, Range calendar card.

Value:

> It works with `DateValue` objects from `@internationalized/date`, not JavaScript `Date` [-] create one with helpers like `today(getLocalTimeZone())`
> or `parseDate("2025-01-31")`.
> To hand the value to an API, convert it back with `value.toDate(getLocalTimeZone())`.

Restricting dates:

> All React Aria date picker props are forwarded, so use `minValue` and `maxValue` to bound the range
> and `isDateUnavailable` to disable individual days such as weekends or booked dates.
> `isDisabled` and `isReadOnly` work the same way on the whole field.

Size:

> Both `DatePicker` and `DateRangePicker` take a `size` prop that is passed to the underlying `Button`, and it defaults to `"sm"`.

Install (page): `npx untitledui@latest add date-picker`, or by hand `@internationalized/date` and `@react-aria/i18n` plus the copied files. The word "keyboard" and any accessibility section do not appear in the text returned.

## Why it matters for ORIVILO

This is the Untitled UI row of the benchmark `.claude/rules/design-system.md` asks for. It names a different engine from the rest of our stack: React Aria, not Radix.
