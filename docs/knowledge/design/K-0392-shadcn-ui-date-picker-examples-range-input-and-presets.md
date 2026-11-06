---
id: K-0392
topic: design
claim: shadcn/ui's examples show a range picker with `numberOfMonths={2}`, a date of birth picker with `captionLayout="dropdown"` that closes on select, a text input that opens on ArrowDown and formats with a fixed "en-US", and calendar presets that add 0, 1, 3, 7 or 14 days to today; the natural language picker needs the `chrono-node` library.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/date-picker-range.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/date-picker-dob.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/date-picker-input.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/calendar-presets.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/radix/date-picker.mdx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main`, no commit hash shown. Examples are samples to copy, not library behaviour.

Range (`date-picker-range.tsx`): state is `DateRange` from `react-day-picker`; the trigger is `id="date-picker-range"`, named by a `FieldLabel` with `htmlFor`, and has no `aria-*`.

```tsx
mode="range"
defaultMonth={date?.from}
numberOfMonths={2}
```

The text format is `"LLL dd, y"`, used for both ends.

Date of birth (`date-picker-dob.tsx`): `captionLayout="dropdown"`, `defaultMonth={date}`, and `onSelect` runs `setDate(date)` then `setOpen(false)`.

Input (`date-picker-input.tsx`):

```tsx
return date.toLocaleDateString("en-US", {
if (e.key === "ArrowDown") {
<span className="sr-only">Select date</span>
```

`isValidDate` returns `!isNaN(date.getTime())`. The Calendar takes `month` and `onMonthChange`, and `onSelect` updates the date and the text, then closes.

Presets (`calendar-presets.tsx`): labels Today, Tomorrow, In 3 days, In a week, In 2 weeks, with values 0, 1, 3, 7, 14. These sit in a `CardFooter` as `variant="outline"`, `size="sm"` buttons.

```tsx
const newDate = addDays(new Date(), preset.value);
```

Natural language (page):

> This component uses the `chrono-node` library to parse natural language dates.

`apps/v4/package.json` reads `chrono-node` ^2.8.2 (K-0393).

## Why it matters for ORIVILO

These are the shadcn range and preset behaviours the benchmark needs. Its presets look forward from today while Untitled's look back (K-0382), and a log filter is the second kind by our reading.
