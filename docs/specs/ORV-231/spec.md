---
issue: ORV-231 (https://tpetkaew.atlassian.net/browse/ORV-231)
lane: L (a new component public API is an L-lane risk flag, AGENTS.md "Lanes and gates"; G1 and G2 pass under the owner's delegation during the POC, ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.3 row 28 ("Calendar and Date picker")
design: docs/specs/ORV-231/design.md (task ORV-231-design-1, amendments 1 to 18 folded in v1.1)
version: 1.3
---

# ORV-231: Calendar and Date picker (base)

## Benchmark

The comparison table in the form of `docs/specs/ORV-64/audit.md` section B, one per component, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247). Every cell comes from K-0380 to K-0409 and K-0130 (read 2026-11-06), and the Ours row is what K-0409 records for the `orv-231` worktree. The Add and Do not copy rows are this spec's choices from the options K-0409 lists; each points to the rule in "Rules" that holds it. Sources no entry could read are listed under "Not read" and are not filled in here.

### Calendar

<!-- prettier-ignore -->
| Item | Detail |
| ---- | ------ |
| Untitled UI | <https://www.untitledui.com/react/components/date-pickers.md>; its separate Calendars page is an event schedule, a different job (K-0385). Engine: React Aria (K-0380). Variants: Calendar, Calendar card, Range calendar, Range calendar card (K-0380). Sizes: none named on the grid; header buttons are `size-8` (K-0383). States: selected, range start, middle and end, today, highlighted, disabled, outside month, focus-visible, hover (K-0384). Slots: `children` between header and grid, by default a date input and a Today button; `highlightedDates`, which RangeCalendar does not apply (K-0383). Months: two from `md`, one below, at most two grids (K-0383). Bounds: `minValue`, `maxValue`, `isDateUnavailable` (K-0380). Keys and names: from React Aria, with Home and End on the month in a month view (K-0387). No month or year picker in the lines read (K-0383). Week start and calendar system: from React Aria's locale handling (K-0388). |
| shadcn/ui | <https://ui.shadcn.com/docs/components/radix/calendar>. Engine: React DayPicker (K-0389), MIT (K-0394). Variants: `buttonVariant`, default `ghost` (K-0390); modes single, multiple, range (K-0395). Sizes: the `--cell-size` variable (K-0389). States: selected, range start, middle and end, today, outside, disabled, hidden, focused (K-0390, K-0395). Slots: `components`, `formatters`, `classNames`, `footer` (K-0390, K-0395). Months: `numberOfMonths`, default 1 (K-0395). Caption: `label` by default, three dropdown forms (K-0395). Range: `min` and `max` in nights, `excludeDisabled`, `required`, `resetOnSelect` (K-0396). Bounds: `disabled` matchers, `startMonth`, `endMonth` (K-0395). Keys and names, from DayPicker: arrows, Shift, Page keys, Home and End by week; grid, gridcell, `aria-selected`, roving tabindex, polite caption (K-0397). Locale: `locale`, `labels`, `weekStartsOn`, `numerals`, `dir`, `timeZone` (K-0389, K-0399). Thai year: an add-on package the shadcn page does not name (K-0389, K-0393, K-0398). |
| Ours | None: audit A.1 lists Calendar as `none`, `coverage.md` has no Calendar row, and K-0409 found no Calendar, DatePicker, date-picker or DayPicker file in `packages/design-system`. Nearest parts: Button (stable, variants include `ghost`, sizes sm, md, lg, `button.yaml`); `surface.selected` and `selection.fg` (`DESIGN.md` section 7); `focus.ring` (section 8). `icons.tsx` has `ChevronDownIcon` and no ChevronLeft, ChevronRight or Calendar glyph. `en.ts` has no calendar or date string; `format.ts` has no date helper; `locale.ts` tags Thai as `th-TH` with no calendar; `component.json` has no `"calendar"` or `"day"` key. `pnpm-lock.yaml` has 0 lines for the ten date library names K-0409 searched, and `radix-ui` 1.8.1 has no calendar package (K-0394). All K-0409. |
| Add | Single selection and one or two months (K-0395, K-0383, K-0392): `cal-api-1`. Range selection, with a rule for a one-day range (K-0395, K-0396): `cal-range-1`. A look for selected, range start, middle and end, today and disabled, none on colour alone (K-0384, K-0395, `DESIGN.md` section 7): `cal-look-1`. The APG keys with Home and End by week (K-0400, K-0397): `cal-keys-1`. `aria-selected`, a roving tabindex, a polite heading and full weekday names (K-0401, K-0397): `cal-names-1`. Every label in both locales through `labels` and the catalog (K-0399, `AGENTS.md`): `cal-engine-1`. A week start per locale (K-0407, K-0408): `cal-week-1`. The year the owner sets (K-0404, K-0405, K-0406): `date-year-1`, `date-format-1`. Bounds and a blocked day (K-0380, K-0395): `cal-bounds-1`. Chevron glyphs in the order of `DESIGN.md` section 6: the contract table. A new runtime dependency, DayPicker (K-0394): `cal-engine-1`, open question 1. |
| Do not copy | `bg-brand-solid` and `bg-primary` on a selected day (K-0384, K-0390): `DESIGN.md` section 8 gives Selected to `surface.selected`: `cal-look-1`. The brand dot on today (K-0384): section 8 keeps `brand.dot-small` for the mark and the brand badge's bead: `cal-look-1`. `opacity-50` and `text-secondary/50` on outside and disabled days (K-0384, K-0390): section 7 asks disabled to hold 3.0, which needs a contrast proof and not a copied class: `cal-look-1`. shadcn class names and `--cell-size` (K-0390): the rules keep no shadcn class or variable: `cal-look-1`. English names such as Today and selected (K-0383, K-0397): every UI string comes from the locale catalog: `cal-engine-1`. `toLocaleString("default", ...)` in `new-york-v4` (K-0390): by our reading it follows the runtime and not the app's locale: `date-format-1`. The event calendar (K-0385): a schedule of events is not the job in D.3 row 28. The `react-day-picker/buddhist` import (K-0393, K-0398): the v10 upgrade page labels it "Removed import" and 10.0.2 does not export it. The add-on `@daypicker/buddhist` (K-0398): it changes listed format strings only and defaults to Thai digits, so a heading and a trigger could disagree on the year (K-0408): `date-format-1`. |

### Date picker

<!-- prettier-ignore -->
| Item | Detail |
| ---- | ------ |
| Untitled UI | <https://www.untitledui.com/react/components/date-pickers.md>. Variants: Date picker, Date time picker, Date range picker with presets (K-0380). Sizes: trigger `size`, default `sm`, passed to Button (K-0380). States: empty ("Select date", "Select dates"), filled, `isDisabled`, `isReadOnly` (K-0380, K-0381, K-0382). Slots: `onApply` and `onCancel` on a Cancel and Apply footer (K-0381). Commit: stays open, `onChange` fires on every click, Cancel does not restore (K-0381). Range: `{ start, end }`; nine presets in a sidebar from `lg`, three inline below `md`, none shown between them by our reading (K-0382). Value: `DateValue`, converted with `toDate` (K-0380). Names: `aria-label="Date picker"` on the picker and its dialog, English literals (K-0381). Popover: `bottom right`, offset 8 (K-0381). Dialog and focus: from React Aria; its date picker hook was not read (K-0381, K-0387). |
| shadcn/ui | <https://ui.shadcn.com/docs/components/radix/date-picker>. No root component: `Popover` plus `Calendar` (K-0391). Variants: examples Basic, Range Picker, Date of Birth, Input, Time Picker, Natural Language Picker (K-0391). Sizes: none of its own; the sample trigger is an outline Button (K-0391). States: empty through `data-empty` (K-0391). Slots: none of its own, being a composition (K-0391); a `FieldLabel` with `htmlFor` names the range trigger (K-0392). Commit: the date of birth sample closes on select (K-0392); the basic sample shows no close (K-0391). Range: `DateRange`, two months (K-0392). Presets: forward offsets of 0 to 14 days in a `CardFooter` (K-0392). Input: ArrowDown opens, a fixed `en-US` format (K-0392). Format: date-fns `"PPP"` and `"LLL dd, y"` (K-0391, K-0392). Names: sr-only "Select date" (K-0392). Dialog and focus: from Popover (K-0130); the page has no accessibility section (K-0391). |
| Ours | None: `coverage.md` lists Date picker as `none`. Parts ready: Popover (stable; `useWhen` names a picker; focus moves in and returns on close, Escape closes, `popover.yaml`), non-modal by default (K-0130); Button; Input (stable, states include read-only and invalid); InputGroup (draft, `start` and `end` slots, reads label, description and error from `Field`, `input-group.yaml`); Dialog (stable). `DESIGN.md` section 7 lists `empty` for pickers: "Invites an action". Audit A.1 recommends "build; range and presets are a second story". No date formatter or date strings yet (`format.ts`, `en.ts`). All K-0409. |
| Add | `Popover` plus Calendar (K-0391, K-0130): `dp-open-1`, open question 8. A trigger that says the chosen date (K-0401), in both locales: `dp-names-1`. Commit on select (K-0392): `dp-commit-1`, open question 7. Focus back to the trigger on close (K-0400, K-0403, `popover.yaml`): `dp-open-1`. A range value (K-0396): `cal-range-1`. A Gregorian stored value with a display-only year (K-0388, K-0398): `date-value-1`. A text field with the format hint on `aria-describedby` (K-0401), through InputGroup and Field: `dp-typed-1`. An empty state that invites an action (`DESIGN.md` section 7): `dp-api-1`. |
| Do not copy | A value that changes before Apply and a Cancel that keeps it (K-0381): the APG's Cancel "does not update date in date input" (K-0400), so a button named Cancel would read one way and act another: `dp-commit-1`. English literals such as "Select date", "Apply", "Pick a date" and preset labels (K-0381, K-0382, K-0391): every UI string comes from the locale catalog: the Copy table. The fixed `en-US` format (K-0392): it ignores the app's locale: `date-format-1`. `format(date, "PPP")` with a Thai locale alone (K-0391, K-0408): by our reading it shows a Gregorian year: `date-format-1`. `chrono-node` (K-0392): a dependency no audit row asks for. "All time" from January 1, 2000 (K-0382): a fixed date no source ties to our data. The band with no presets between `md` and `lg` (K-0382): by our reading the shortcut vanishes at that width, and presets are out of scope here. `aria-modal` from the APG example on a non-modal Popover (K-0401, K-0403): the APG pattern warns to mark a dialog modal only when code blocks outside interaction and styling obscures the content: `dp-open-1`. |

## Goal

The decision log needs date filters (D.3 row 28), and ORIVILO has no way to pick a date. A Thai reader expects a Buddhist year on screen while the data underneath has to stay one Gregorian date that sorts, compares and travels. This story gives the design system `Calendar` and `DatePicker`, so a person can choose a date or a range with mouse, touch or keyboard, in Thai and English, and the two calendars never mix in stored data.

What is real and what is not, so nobody over-reads it: both components render real markup and real keyboard behaviour. The dates in the stories are mock data from `src/components/fixtures.ts`, and the story docs say so. No Studio screen and no decision log filter uses them when this story ends. No screen reader test has been run. The year on Thai screens is the owner's answer (`date-year-1`). The spec relies on no runtime's default calendar: K-0406 stands at confidence 0.7 and no plain `th-TH` output was read, so `date-format-1` names the calendar and AC rows 1 and 3 prove the output in Node and in the browser. The look in `design.md` was proven on mock markup with proposed CSS, with no real DayPicker DOM and no real Radix positioning; "Design amendments" names what that leaves open and the row that closes it.

The owner chose a runtime dependency (open question 1): `react-day-picker` with `date-fns` and `@date-fns/tz` behind it (K-0394). It brings the `security` review of `.claude/skills/ovl/SKILL.md` step 6 on the PR that adds it, and ADR 0020 on the calendar's behaviour base.

## Story

As a person using ORIVILO, when I need a date or a span of dates I open a calendar in my language, move through it by pointer or keyboard, and see the date the way I read dates, so I can filter or fill in a form without working out the year or wondering what was saved.

## Rules

### date-value-1

Every date in a public prop or callback of `Calendar` and `DatePicker` is `IsoDate`, a `YYYY-MM-DD` string in the Gregorian calendar with no time and no zone, the form fixtures already use (`workspace.tsx` line 57). A range is `DateRange`, `{ start: IsoDate; end: IsoDate }`. No `Date` crosses the API and nothing stored or passed to a callback carries a Buddhist year; that year lives only in what is shown or typed. Two helpers in `src/i18n/date.ts` bridge to the engine: `fromIsoDate` builds a local `Date` from the three numbers, and `toIsoDate` reads them back with local getters, never `toISOString` (W2). A string that is not a real date, such as `2026-02-30`, reads as no value. Bounds compare as strings, since this form sorts in date order.

### date-format-1

`formatDate(value, style, locale)` in `src/i18n/date.ts` is the one way a date becomes text. It reads a new `DATE_TAGS` in `src/i18n/locale.ts` and never `LOCALE_TAGS`:

- `th`: `th-TH-u-ca-buddhist-nu-latn`
- `en`: `en-US-u-ca-gregory-nu-latn`

Styles: `medium` (`dateStyle: "medium"`), `full` (`dateStyle: "full"`), `monthYear` (`month: "long"`, `year: "numeric"`, then only the `month` and `year` parts of `formatToParts`, joined by one space, so the heading never depends on a pattern K-0405 did not find under `availableFormats`). It formats a `Date.UTC` instant with `timeZone: "UTC"`, so the viewer's zone cannot move a plain date. W1 prints the output. Formatters are cached per locale and style, as `format.ts` does. A value that is not a real date gives an empty string: `date-value-1` reads it as no value, so it has no text, and without this check `Date.UTC` would roll `2026-02-30` into March and show a date nobody chose. W12 prints it.

### date-year-1

The owner's call (D.3 row 28, ORV-231 comment 10548), set in one place, `DATE_TAGS` and `YEAR_OFFSET` in `src/i18n/locale.ts`. Thai shows the Buddhist Era year and English the Common Era year, which this spec calls the Gregorian year (`YEAR_OFFSET`: `th` 543, `en` 0). Stored values stay Gregorian (`date-value-1`).

พ.ศ. appears only on the full date and on a year alone, CLDR's Thai patterns (K-0405). `full` carries it; `medium` and `monthYear` carry no era, so the visible date is short and the spoken name says the era. `formatDate` has no year-only style in this story: the one year alone on screen is in `datePicker.errorYear`, whose Thai text writes พ.ศ. before it, and `datePicker.hint` and `datePicker.errorFormat` write it beside ปี. English carries no era word (W1).

Digits are Arabic (0 to 9, the `latn` of `DATE_TAGS`) in both locales. Open questions 2, 3 and 4 hold the options and the answers.

### cal-engine-1

`Calendar` wraps `DayPicker` from `react-day-picker`, pinned exactly at 10.0.2 in `packages/design-system/package.json`, for behaviour only, in the split of ADR 0003 decision 1 and ADR 0004 decision 1.

- No library stylesheet is loaded; `classNames` maps its slots to `ds-calendar__*`, and `components` overrides `Nav` and `Weekdays` (below), and `Day` if the pinned engine sets no range modifier on the cell.
- Every word reaches it from us: `formatters` take `formatDate`, `labels` take the catalog, with `numerals="latn"` and `lang` set (K-0395, K-0399). Thai-run output holds no Latin letter (AC row 3).
- It gets `weekStartsOn` from `cal-week-1`, `today` from `cal-today-1`, `showOutsideDays={false}` and `captionLayout="label"` (K-0395). It gets no `timeZone` prop and no `role` prop.
- `@daypicker/buddhist` is not added, and our code imports nothing from `date-fns` directly.

K-0395 names `formatters` and not its key names, so the builder reads them in the pinned source. If a formatter cannot reach the heading or a day's name, the builder returns `blocked` and never replaces a year inside a string.

The slot map and cell attributes in `design.md` come from K-0390, K-0395 and memory of the engine's v9, not from 10.0.2, so they stay an assumption until the builder reads the pinned source. The builder keeps the rule and changes the mapping, through `classNames`, `components` or the wrapper, and that includes the `components` keys that put our `Button` in the nav (`cal-names-1`). "Design amendments" names the row that proves each one on the pinned engine.

PR 198 read the pinned source and maps it this way. The engine keeps the grid, the roving focus and the keys. `Calendar` draws two parts itself through `components`, because the engine's own form of each does not hold here:

- `Nav` is a `div` with `role="group"`, named `calendar.navigation`, which keeps the `ds-calendar__nav` class and holds the two buttons of `cal-names-1`. The engine draws a `nav` landmark there. Two calendars on one page then carry two landmarks of one name, which axe fails as `landmark-unique` (ORV-231-build-2), and a month grid is not site navigation. The buttons take the native `disabled` of `cal-bounds-1`, where the engine's own buttons use `aria-disabled`.
- `Weekdays` is a `thead` with no `aria-hidden`. The engine hides that row from assistive technology, so its columns could not carry the full names `cal-names-1` asks for.

`Chevron` and `DayButton` are not overridden: our `Nav` draws its own glyphs, and the engine's day button takes its class through `classNames`.

### cal-api-1

`Calendar` is a new public component (`src/components/calendar/Calendar.tsx`), exported from `@orivilo/design-system`, with the contract type `CalendarProps`, a union on `mode` once the range PR lands:

- `mode`: `single` (default) or `range` (`cal-range-1`).
- `value`, `defaultValue`, `onChange`: `IsoDate` in `single`, `DateRange` in `range` (`date-value-1`). Controlled and uncontrolled, as Radix parts are.
- `min`, `max`, `isDateDisabled`: `cal-bounds-1`.
- `today`: `cal-today-1`.
- `defaultMonth`: an `IsoDate` inside the month to open on.
- `months`: `1` (default) or `2`, passed to `numberOfMonths`. The caller chooses; W4 gives the width (open question 13). Two months need a viewport of about 690 px (W10). Under it they stack, and the story docs tell callers to pass `1` below `md`.
- `className` for layout only.

In `single`, pressing the selected day again changes nothing and calls nothing. Clearing a date is the caller's job. There is no `size`, `footer`, `children` or week-number prop.

Until the range PR, `CalendarProps` is single mode only: `mode` is `single` or left out, and the value is an `IsoDate`. The range arm, the `DateRange` value and the range modifiers land with that PR's rows, since a type that accepts `range` with no behaviour behind it would promise what the build does not do. AC row 14's four lines hold under both forms.

### cal-week-1

`WEEK_START` in `src/i18n/locale.ts` holds `{ th: 0, en: 0 }`, Sunday in both locales, from CLDR's `TH` and `US` entries (K-0407) and date-fns's Thai locale (K-0408). It goes to `weekStartsOn`. The week start is never read from `Intl.Locale` at run time, which is new and needs a fallback (K-0407).

### cal-keys-1

In the day grid, the engine's keys (K-0397), which match the APG example (K-0400):

- Left and Right Arrow: one day. Up and Down Arrow: one week.
- Home: the first day of the current week. End: the last day of the current week. The week is the one `cal-week-1` sets.
- Page Up and Page Down: one month, on the same day number, or the month's last day when that number does not exist.
- Shift with Page Up and Page Down: one year.
- Enter and Space: select the focused day.
- A disabled day is passed over (K-0397).

W5 prints the landing dates. Escape belongs to the wrapper (`dp-commit-1`). Key handling is not reimplemented in our code.

### cal-names-1

Each month is a `grid` named by its `monthYear` text, days are `gridcell` with `aria-selected` on selected days only, exactly one day has `tabIndex` 0, and the heading is a polite `status` (K-0397). Each weekday column carries its full name from the catalog and shows its short one (K-0401). A day's name is its `full` date, wrapped in the catalog forms for today, selected and range (Copy). A one-day range takes `calendar.dayRangeSingle`. Today inside a range nests: `calendar.dayToday` wraps the range form, as in วันนี้ {date} วันเริ่มต้น and Today, {date}, start of the range. Previous and next are `Button` `variant="ghost"`, `size="sm"`, `iconOnly`, named from the catalog, inside the group of `cal-engine-1`. A `::after` gives each a press area of `size.touch`, while the look stays `sm`.

### cal-today-1

`today` defaults to the viewer's local date, read after mount with `toIsoDate(new Date())`, since a server render cannot know it (K-0389). Until then no day is marked. A story passes `calendarFixtures.today`, so no play depends on the clock. With no value, the calendar opens on `defaultMonth`, else on `today`, and a month outside `min` and `max` gives way to the nearest month inside them.

The build reads the clock through `useSyncExternalStore` with a server snapshot of `undefined`, so a server render and the render that hydrates it agree and React reports no mismatch. A mount with no server render reads the clock on its first render. Until the clock is read:

- The engine's `today` prop gets `new Date(0)`, since left out it would read its own clock and mark a day the server chose. That instant is a real day: a month showing it, January 1970 (December 1969 west of UTC), would mark it until the clock is read.
- With no `value` and no `defaultMonth`, nothing says which month to open on, so `Calendar` draws an empty `ds-calendar` tile. The tile holds only its padding, so the month arriving moves the page.

No AC row runs a server render, since row 7 passes `calendarFixtures.today`, so this paragraph is read from `Calendar.tsx` and no play proves it.

### cal-bounds-1

`min` and `max` are inclusive. A day outside them, or one `isDateDisabled` returns true for, cannot be pressed or selected. Previous stops at the month of `min` and next at the month of `max`, through `startMonth` and `endMonth` (K-0395).

### cal-look-1

The recipe `ds-calendar` reads these new component tokens, and from existing names only `--ds-focus-ring`, `--ds-space-gutter` and `--cmp-button-height-sm`, beside the shared focus local `--_focus-shadow-border` (`src/tokens/orivilo.css` line 42) and its own local `--_cell`:

- `calendar.bg` from `surface.raised`; `calendar.fg` from `text.primary`; `calendar.weekday-fg` from `text.secondary`.
- `calendar.heading-type` from `type.label.md`; `calendar.weekday-type` from `type.body.xs`; `calendar.day-type` from `type.control.md`.
- `calendar.cell-size` from `size.touch`; `calendar.gap` from `space.stack.sm`; `calendar.months-gap` from `space.stack.lg`; `calendar.day-radius` from `shape.control.radius`.
- `calendar.day-hover-bg` from `surface.hover`; `calendar.day-hover-edge` from `border.control-hover`.
- `calendar.day-selected-bg` from `surface.selected`; `calendar.day-selected-fg` from `selection.fg`; `calendar.day-selected-edge` from `selection.fg`.
- `calendar.day-disabled-fg` from `text.disabled`.
- `calendar.padding` from `space.inset.sm` and `calendar.radius` from `shape.container.radius`, read by `ds-calendar`. `DatePicker` adds `ds-calendar-popover` beside `ds-popover`, which sets the popover's padding to 0 and the calendar's ground to transparent, so the panel stays W4's `at8`. That class sits after `.ds-popover` in `recipes.css`, or its padding wins. `popover.bg` and `calendar.bg` both read `surface.raised`, so the pairs below hold in the panel.
- `calendar.row-gap` from `space.inline.sm`, the gap between day rows.

A month reserves six rows of height, so the panel's height and the Next button hold at four, five and six rows (W10). `fixedWeeks` stays off, so AC row 5's row counts stand.

Under a 360 px viewport the cell shrinks through a local `--_cell`, so reflow holds; from 360 up it is `calendar.cell-size`. In a column narrower than the month the cell narrows and keeps its height, and the day button takes `inline-size: 100%`.

Each state differs by more than colour:

- Hover: the ground and a 1 px edge, never on a disabled or a focused day. On a selected day the ground stays and the edge turns to `calendar.day-hover-edge`. On a range middle day, the edge alone, over the band.
- Selected: the ground, its ink and a 1 px edge.
- Range start and end: selected, with the band running inward. Range middle: the band, with a 1 px `calendar.day-selected-edge` line above and below, no side line and no radius property. The band's ground is on the cell, its line on the cell's `::before`, and the button stays transparent.
- Today: the number underlined in its own ink, on any ground, with no brand colour. The line is 2 px at an offset of 0.25em, with `text-decoration-skip-ink: none`.
- Disabled: `calendar.day-disabled-fg` and a 1 px line through the number. No opacity. A disabled today shows both lines.
- Focus: the border form of `DESIGN.md` section 7, read by `expectFocusBorderForm`.

The recipe sets no `overflow` on the calendar, the grid or the heading. Only the panel with `months={2}` limits its height to the room Radix reports and scrolls inside it. The recipe has no animation; `animate` stays off (K-0395).

`design.md` is the CSS to start from, with two lines changed, since `recipes.test.ts` fails them as raw values (its radius check at line 60, its colour check at line 64). The day button writes `color: var(--cmp-calendar-fg)` for `color: inherit` (`design.md` line 293). The band's `::before` takes its cell's two rounded corners from `calendar.day-radius` through logical corner properties, for `border-radius: inherit` (`design.md` line 369).

`src/recipes/pairs.ts` lists at floor 4.5: `calendar.fg` on `calendar.bg`, `calendar.weekday-fg` on `calendar.bg`, `calendar.fg` on `calendar.day-hover-bg`, `calendar.day-selected-fg` on `calendar.day-selected-bg`. At floor 3: `calendar.day-selected-edge` on `calendar.bg`, `calendar.day-hover-edge` on `calendar.bg`, `calendar.day-disabled-fg` on `calendar.bg`, `calendar.day-selected-edge` on `calendar.day-selected-bg`, `calendar.day-hover-edge` on `calendar.day-hover-bg`, `calendar.day-hover-edge` on `calendar.day-selected-bg`, `calendar.day-disabled-fg` on `calendar.day-selected-bg`, `ds:focus.ring` on `calendar.bg`, `ds:focus.ring` on `calendar.day-selected-bg`.

### cal-range-1

With `mode="range"`:

- The first press sets an open start, named as range start, and calls nothing. The second press completes the range and calls `onChange` once. An open start is never a value.
- A second press on an earlier day swaps the ends, so `start` is never after `end`; the wrapper sorts them whatever the engine returns.
- A second press on the same day is a one-day range, `start` equal to `end` (K-0396).
- A press after a complete range starts a new one (`resetOnSelect`, K-0396).
- A range never covers a disabled day (`excludeDisabled`, K-0396): a second press past one calls nothing and the pressed day becomes the open start.
- The open start survives moving to another month.

An open start is a selected day with no band, through `data-range-open` on the root, which the wrapper sets. A one-day range is one selected day with no band.

`aria-multiselectable` comes from the engine (K-0397). K-0396 quotes only "the range will reset" for `excludeDisabled`, so where the pressed day lands after that reset is this rule and not a read fact: AC row 34 proves it, and the wrapper enforces it if the engine differs.

### dp-api-1

`DatePicker` is a new public component (`src/components/date-picker/DatePicker.tsx`), exported from `@orivilo/design-system`, with the contract type `DatePickerProps`. It takes `mode`, `value`, `defaultValue`, `onChange`, `min`, `max`, `isDateDisabled`, `today` and `months` as `cal-api-1` defines them, and:

- `size`: `sm`, `md` (default), `lg`, on the trigger.
- `disabled`, `invalid`, `readOnly`. `readOnly` renders a read-only `Input` holding the `medium` text and opens nothing (`DESIGN.md` section 7).
- `placeholder`: optional; the default is the catalog's, which invites the action.
- `entry`: `button` (default) or `typed` (`dp-typed-1`).
- `open`, `defaultOpen`, `onOpenChange`, as `Popover`.
- `onTypedError`: `dp-typed-1`.
- `id`, `aria-label`, `aria-describedby`, `className` (layout only).

The trigger is a `button` with the existing `ds-control` recipe, `data-size` and the new class `ds-date-trigger`, without `data-trigger`, wired through `useFieldControl` as Select's trigger is, with `CalendarIcon` as `ds-control__icon` at the end edge. `ds-date-trigger` reads `--ds-space-inline-sm` and `--cmp-input-border-hover`. An empty trigger shows the placeholder in the control's placeholder ink. A filled one shows `medium`, or `datePicker.range` in `range`. The value span sets no `overflow` and does not truncate: in a field narrower than the value it wraps, balanced, and the trigger grows; AC row 39 gives the widest value. While the panel is open the trigger's edge is `input.border-hover`, unless it is invalid.

### dp-names-1

Inside a `Field`, the `<label>` names the trigger, so the date is its description: the trigger's own `aria-describedby` adds a visually hidden node holding the `full` date, or both `full` dates in `range`, beside the Field's ids. Outside a `Field`, with no caller `aria-label`, the trigger's `aria-label` is the placeholder when empty and `datePicker.changeLabel` or `datePicker.changeRangeLabel` when filled (K-0401). The panel takes `aria-label` from `datePicker.dialog`.

### dp-open-1

The panel is `Popover` with `PopoverContent`, non-modal (K-0130, `popover.yaml`), wrapped in `PortalScope` as every Popover is. It has no `aria-modal`, since nothing blocks the page (K-0403). On open, `onOpenAutoFocus` is prevented and focus lands on the selected day, or range start, else on today (K-0400), else, when today cannot be pressed, on the first day of the open month that can. A filled picker opens on the month of its value. On close, focus returns to the trigger, unless a press outside moved it (K-0130).

### dp-commit-1

There is no Apply and no Cancel. In `single`, pressing a day commits it, closes the panel and calls `onChange` once. In `range`, completing the range (`cal-range-1`) does the same. Escape or a press outside closes the panel, keeps the value as it was and drops an open start. The panel holds no other draft.

### dp-typed-1

`entry="typed"` renders `InputGroup`, which the caller places in a `Field`, with an `end` slot `Button` `size="sm"`, `iconOnly`, `CalendarIcon`, named `datePicker.openCalendar`, as the `PopoverTrigger`. `mode="range"` is not offered here: the type refuses it. The caller passes `dateFieldHint(locale, today)` to the Field's `description`, so the hint reaches `aria-describedby` (K-0401). Its `{example}`, and the one in `datePicker.errorFormat`, is `today` in the padded form below; the one in `datePicker.errorYear` is today's year in the locale.

The field accepts the year the locale shows (`date-year-1`). `parseTypedDate(text, locale)` in `src/i18n/date.ts`, on blur and on Enter:

1. Trims and maps Thai digits to Latin. Thai digits are accepted whatever `date-year-1` shows.
2. Reads `day/month/year` in `th` (K-0405, K-0408) and `month/day/year` in `en` (K-0401), day and month in one or two digits, the year in exactly four. Anything else is reason `format`.
3. Subtracts `YEAR_OFFSET`, then requires a Gregorian year from 1900 to 2100 (`TYPED_YEARS` in `src/i18n/date.ts`). Otherwise reason `year`. W6 shows the two windows cannot overlap, so a year from the wrong calendar is refused and never guessed.
4. Requires a date on the calendar. Otherwise reason `noDate`.

On success the text becomes the padded form (two-digit day and month, in the locale's order) and `onChange` fires with the `IsoDate`. A date outside `min` or `max` takes `datePicker.errorBounds` when both are set, and `datePicker.errorMin` or `datePicker.errorMax` when one is. On failure the value and the text stay, and `onTypedError` receives the catalog message for the reason, for the caller's Field `error`; a later success or an edit calls it with `undefined`. Empty text calls `onChange(undefined)`. No source read shows a typed Buddhist year parsed back (K-0409), so this rule is ours; W6 prints it.

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| ------ | ----- | ------ |
| Runtime dependency `react-day-picker` (`cal-engine-1`) | Dependency | `packages/design-system/package.json`, `pnpm-lock.yaml`; brings `date-fns` ^4.1.0 and `@date-fns/tz` ^1.4.1 (K-0394), whose own dependencies were not all read. The PR gets a `security` envelope in round 0 (`.claude/skills/ovl/SKILL.md` step 6) |
| ADR 0020 on the calendar's behaviour base outside `radix-ui` (open question 1), in the form of ADR 0004, and the sentence "Behavior comes from the `radix-ui` package" in `.claude/rules/design-system.md` line 23 | Decision | Written by `architect` (`docs/adr/0020-calendar-engine-react-day-picker.md`); the rule sentence still has to change. ADR 0003 stays as decided |
| `IsoDate`, `DateRange`, `fromIsoDate`, `toIsoDate`, `formatDate`, `parseTypedDate`, `dateFieldHint`, `TYPED_YEARS` (`date-value-1`, `date-format-1`, `dp-typed-1`) | i18n API | New `src/i18n/date.ts`, `date.test.ts`; exports in `src/i18n/index.ts` |
| `DATE_TAGS`, `WEEK_START`, `YEAR_OFFSET` (`date-format-1`, `date-year-1`, `cal-week-1`) | i18n API | `src/i18n/locale.ts`. `LOCALE_TAGS` does not change, so `formatNumber`, `formatPercent` and `collatorFor` do not change |
| `Calendar`, `CalendarProps` (`cal-api-1`, `cal-range-1`) | Component API | New export in `src/components/index.ts`; new `catalog/base/calendar.yaml`; a new row in `coverage.md` |
| `DatePicker`, `DatePickerProps` (`dp-api-1`, `dp-typed-1`) | Component API | New export in `src/components/index.ts`; new `catalog/base/date-picker.yaml`; the `coverage.md` row moves from `none` to `draft` |
| Recipe classes `ds-calendar`, `ds-calendar__*`, `ds-calendar-popover`, `ds-date-trigger` | Recipe | `recipes.css`; `recipes.test.ts` checks every value is a `--cmp-*` or `--ds-*` property. `ds-control` and `ds-popover` do not change |
| The component tokens of `cal-look-1`, among them `calendar.padding` (it replaces `calendar.popover-padding`, which is not added), `calendar.radius` and `calendar.row-gap` | Component token | `component.json`, regenerated `generated.css`; `recipes.css` reads the three in `ds-calendar`, `.ds-calendar__grid` and `.ds-calendar__month`; `calendar.row-gap` adds 4 px per row, so the heights of W10 follow; `pairs.ts` as that rule says; no semantic or profile change |
| New glyphs `ChevronLeftIcon`, `ChevronRightIcon`, `CalendarIcon` (W8) | Icons | `src/components/icons.tsx`, and the glyph count in its comment at line 64 |
| The locale keys of "Copy" | Copy | `src/i18n/messages/th.ts` and `en.ts`; `check-i18n` |
| Fixtures `calendarFixtures` | Story content | `src/components/fixtures.ts`, labelled mock |

Not changed: Popover, Button, Input, InputGroup and Field code, and the decision log example (Out of scope).

### Copy

Catalog keys. `{date}` is a `full` date unless the key says otherwise.

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | ---- | ------- |
| `calendar.previousMonth` | เดือนก่อนหน้า | Previous month |
| `calendar.nextMonth` | เดือนถัดไป | Next month |
| `calendar.navigation` | เปลี่ยนเดือน | Change month |
| `calendar.dayToday` | วันนี้ {date} | Today, {date} |
| `calendar.daySelected` | {date} เลือกแล้ว | {date}, selected |
| `calendar.dayTodaySelected` | วันนี้ {date} เลือกแล้ว | Today, {date}, selected |
| `calendar.dayRangeStart` | {date} วันเริ่มต้น | {date}, start of the range |
| `calendar.dayRangeEnd` | {date} วันสิ้นสุด | {date}, end of the range |
| `calendar.dayRangeMiddle` | {date} อยู่ในช่วงที่เลือก | {date}, in the range |
| `calendar.dayRangeSingle` | {date} เลือกวันเดียว | {date}, a one-day range |
| `calendar.weekdayShortSun` to `Sat`, seven keys in order | อา., จ., อ., พ., พฤ., ศ., ส. (K-0408) | Su, Mo, Tu, We, Th, Fr, Sa (two characters, K-0401) |
| `calendar.weekdayFullSun` to `Sat`, seven keys in order | วันอาทิตย์, วันจันทร์, วันอังคาร, วันพุธ, วันพฤหัสบดี, วันศุกร์, วันเสาร์ | Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday |
| `datePicker.placeholder` | เลือกวันที่ | Choose a date |
| `datePicker.placeholderRange` | เลือกช่วงวันที่ | Choose a date range |
| `datePicker.changeLabel` | เปลี่ยนวันที่ {date} | Change date, {date} |
| `datePicker.changeRangeLabel` | เปลี่ยนช่วงวันที่ {range} | Change date range, {range} |
| `datePicker.range` ({start} and {end} are `medium`, or `full` inside {range}) | {start} ถึง {end} | {start} to {end} |
| `datePicker.dialog` | เลือกวันที่จากปฏิทิน | Choose a date from the calendar |
| `datePicker.openCalendar` | เปิดปฏิทิน | Open the calendar |
| `datePicker.hint` | วัน/เดือน/ปี พ.ศ. เช่น {example} | Month/day/year, for example {example} |
| `datePicker.errorFormat` | พิมพ์วันที่เป็น วัน/เดือน/ปี พ.ศ. เช่น {example} | Type the date as month/day/year, for example {example} |
| `datePicker.errorYear` | พิมพ์ปี พ.ศ. ระหว่าง {min} ถึง {max} เช่น {year} | Type a year from {min} to {max}, for example {year} |
| `datePicker.errorNoDate` | ไม่มีวันที่นี้ในปฏิทิน ตรวจวันและเดือนอีกครั้ง | That date is not on the calendar. Check the day and month |
| `datePicker.errorBounds` ({min} and {max} are `medium`) | เลือกวันที่ตั้งแต่ {min} ถึง {max} | Choose a date from {min} to {max} |
| `datePicker.errorMin` ({min} is `medium`) | เลือกวันที่ตั้งแต่ {min} เป็นต้นไป | Choose a date on or after {min} |
| `datePicker.errorMax` ({max} is `medium`) | เลือกวันที่ไม่เกิน {max} | Choose a date on or before {max} |

The weekday keys come from the catalog and not from `Intl`, since CLDR's abbreviated Thai names in the Buddhist file are the long forms (K-0405) and would not sit in a cell. The Thai wording of K-0399 is the library's and was not used.

Story fixtures, `calendarFixtures`, caller text and not catalog keys, and mock:

<!-- prettier-ignore -->
| Fixture | Value |
| ------- | ----- |
| `today` | `2026-11-06` |
| `selected` | `2026-11-12` |
| `min`, `max` | `2026-11-03`, `2026-11-24` |
| `blocked` | `2026-11-18` |
| `rangeStart`, `rangeEnd` | `2026-11-09`, `2026-11-13` |
| `widestTh`, `widestEn` | `2026-04-28`, `2026-05-28`, each set as both ends of a range (W11) |
| `field` label | วันที่ตัดสินใจ / Decision date |
| `rangeField` label | ช่วงวันที่ตัดสินใจ / Decision date range |
| `invalid` error | เลือกวันที่ก่อนบันทึก / Choose a date before saving |

## Acceptance criteria

Stories: `Base/Calendar` (id `base-calendar`) and `Base/Date picker` (id `base-date-picker`), each a new `*.stories.tsx` beside its component. Plays run in Thai (Storybook preview, `INITIAL_LOCALE` in the test run); an `InEnglish` story nests `LocaleProvider locale="en"`. Waits are `waitFor` on a condition, never a fixed time. Every story passes `calendarFixtures.today`. "The six boundaries" means neutral, professional, friendly, each in light and dark. In the rows that say "the frame rule", the element and every ancestor of it up to and including the frame have computed `overflowX` and `overflowY` `visible`; `expectLabelInkWhole` (one line) or `expectLinesClear` (wrapped), under `inVitest`, proves the ink on that element alone; `expectFrameCutsNoInk(el, frame)`, under `inVitest`, proves nothing from the element up to the frame clips it, and is proven red by restoring a clip that cuts ink with the overflow clause taken out, the proof counting only on that helper's own failure line.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Node, `src/i18n/date.test.ts` | `formatDate` runs on `2026-11-12` and `2020-09-29` in the three styles and two locales | Not a screen | Output equals W1 line for line (`date-format-1`) | Unit test, exact strings; `resolvedOptions()` reads calendar `buddhist` and numbering `latn` for `th`; `2026-02-30` gives W12's output; `grep -n "LOCALE_TAGS" packages/design-system/src/i18n/date.ts` prints nothing |
| 2 | Node, same file, `process.env.TZ` set in turn to `Asia/Bangkok`, `Pacific/Honolulu` and `UTC` | `toIsoDate(fromIsoDate("2026-11-12"))` runs; `fromIsoDate("2026-02-30")` runs | Not a screen | `2026-11-12` in the three zones; `undefined` for the false date (`date-value-1`, W2) | Unit test |
| 3 | Storybook test project, neutral, light, Thai | Calendar `Default` renders November 2026 | The heading "พฤศจิกายน 2569", weekdays "อา." to "ส." in order from Sunday, days 1 to 30 in five rows, nothing from October or December | None | `Default` play: heading text equals W1's in the browser; the seven headers in order; 30 day buttons; no Latin letter in any text node or `aria-label` under the root (`cal-engine-1`) |
| 4 | Same, English | Calendar `InEnglish` renders the states of rows 3, 6, 7, 8 and 11 | "November 2026", "Su" to "Sa", and the day named "Thursday, November 12, 2026, selected" | None | `InEnglish` play: heading, seven headers, `Today, Friday, November 6, 2026` and the selected name found |
| 5 | Storybook test project, neutral, light, Thai | Calendar `MonthShapes` renders February, November and August 2026 | Each month starting under its right weekday, with four, five and six rows, at one calendar height, with Next in one place | None | `MonthShapes` play: rows and leading empty cells equal W3; `expectSameHeight` on the three calendars, whose height equals W10's `calendar`; Next's offset from its calendar's top and end edges is the same in the three; the gap between two day rows equals the resolved `--cmp-calendar-row-gap` |
| 6 | Same | Calendar `Selected`: the person presses day 12, then presses it again | Day 12 selected, named "วันพฤหัสบดีที่ 12 พฤศจิกายน พ.ศ. 2569 เลือกแล้ว" | `onChange` called once with `2026-11-12`; the second press calls nothing (`cal-api-1`) | `Selected` play with `userEvent`; `aria-selected` on one cell only |
| 7 | Same | Calendar `Today` renders with `calendarFixtures.today` | Day 6 underlined and named "วันนี้ วันศุกร์ที่ 6 พฤศจิกายน พ.ศ. 2569" | None | `Today` play: computed `textDecorationLine` includes `underline` on day 6 and on no other day; name found (`cal-look-1`) |
| 8 | Same | Calendar `Bounds` renders `min`, `max` and `blocked`; the person presses day 18 and day 2 | Days 1, 2, 18 and 25 to 30 struck through and not pressable; Previous month and Next month disabled | `onChange` not called (`cal-bounds-1`) | `Bounds` play: the nine day buttons listed are disabled; both nav buttons disabled; `fn()` count 0 |
| 9 | Same | Calendar `Keyboard` starts on `2026-11-12`; the person presses in turn each key W5 names; a second run starts on `2026-01-31` and presses Page Down; a third, in `Bounds`, starts on day 17 and presses Right Arrow | Focus lands on each date W5 prints; in `Bounds` on day 19 | None until Enter; Enter calls `onChange` once (`cal-keys-1`) | `Keyboard` play: `document.activeElement` holds the expected day after each key |
| 10 | Same | Calendar `Names` renders November 2026 with day 12 selected | Nothing new | Roles and names of `cal-names-1`: one `grid` named "พฤศจิกายน 2569", the heading with `role="status"` and `aria-live="polite"`, exactly one day with `tabIndex` 0, weekday headers named "วันอาทิตย์" to "วันเสาร์", a `group` named "เปลี่ยนเดือน" (`cal-engine-1`), buttons named "เดือนก่อนหน้า" and "เดือนถัดไป" | `Names` play: `document.elementFromPoint` 5 px outside the Next month button's look finds that button (`cal-names-1`); a11y addon reports zero violations |
| 11 | Same | Calendar `States`: the person hovers day 10, a disabled day and selected day 12, then tabs to day 12 and hovers it again; a second calendar blocks `today` through `isDateDisabled` | Each state of `cal-look-1` as listed there | None | `States` play: selected computed `backgroundColor`, `color` and `borderColor` equal the resolved `--cmp-calendar-day-selected-*`; hover edge and ground equal theirs; hovered, selected day 12 keeps `--cmp-calendar-day-selected-bg` with the edge `--cmp-calendar-day-hover-edge`, and the disabled day keeps a transparent ground; disabled `textDecorationLine` is `line-through` and `opacity` is `1`; the blocked today's `textDecorationLine` includes `underline` and `line-through`; `expectFocusBorderForm` on focused day 12, without the pointer and with it |
| 12 | Storybook, a 360 px frame | Calendar `At360` renders November 2026, Thai; a second Calendar sits in a 280 px column; the play then sets a 320 px viewport through `page.viewport`, as `atPhoneSize` in `Select.stories.tsx` does | Seven columns of cells at W4's size, nothing cut, no horizontal scroll. In the column the days narrow, keep their height and do not touch. At 320 the cells shrink and the page does not scroll sideways | None | `At360` play: frame `scrollWidth` not above 360; a day's computed width equals W4; the frame rule on the heading with `expectLabelInkWhole`; in the column no day button overlaps the next and a day's height equals W4's `cell`; at 320 a day's width equals W10's `cell320` to 0.5 px and the document's `scrollWidth` is not above 320 |
| 13 | Storybook test project | Calendar `RecipesAndModes` renders through `Matrix` | The selected, today and disabled days in the six boundaries | None. The pairs of `cal-look-1` pass at their floor under the six boundaries | `RecipesAndModes` play: counts equal W9; `recipes.test.ts` proves the contrast, and a new test there finds no `var()` in the `ds-calendar` rules outside the list that opens `cal-look-1` |
| 14 | The PR head | `pnpm typecheck` runs on the story file | Not a screen | `@ts-expect-error` lines hold for `value={new Date()}`, a `DateRange` value with no `mode`, an `IsoDate` value with `mode="range"`, and `months={3}` | `pnpm --filter @orivilo/design-system typecheck` output |
| 15 | The PR head | `check-catalog` and the i18n checks run | Not a screen | `catalog/base/calendar.yaml` (story `base-calendar`, status `draft`, states `[default, hover, focus-visible, selected, today, disabled]`, recipes neutral, professional, friendly) resolves; `coverage.md` has the row; the `calendar.*` keys of "Copy", except the `calendar.dayRange*` keys of row 40, exist in Thai and English; the story docs say the dates are mock and tell callers to pass `months={1}` below `md`; no middot or em dash in those files | `pnpm --filter @orivilo/design-system test` output (check-catalog, `i18n.test.ts`, `check-i18n`) |
| 16 | The PR head | The dependency is read | Not a screen | `react-day-picker` pinned at 10.0.2; no `react-aria`, `@internationalized/date` or `@daypicker/buddhist` added; no import from `date-fns` and no library stylesheet in our source (`cal-engine-1`) | `grep -n '"react-day-picker": "10.0.2"' packages/design-system/package.json` prints one line; `grep -n -e "react-aria" -e "@daypicker/buddhist" -e "internationalized" packages/design-system/package.json` prints nothing; `grep -rn -e "from \"date-fns" -e "react-day-picker/" packages/design-system/src` prints nothing; `grep -rl 'react-day-picker' packages/design-system/src` prints only files under `src/components/calendar/` (ADR 0020 decision 3); the `security` approve on the head |
| 17 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Calendar `Default`, `States`, `Bounds`, `At360`, `RecipesAndModes` | A selected, a today and a disabled day that read apart with the colour taken away | None | Designer visual sign-off, its PNG paths posted on the issue as a Jira comment, since a sign-off has an empty `write_set` and cannot write design.md; the same comment says the built stories hold `design.md`'s answers to open questions 14, 16 and 17 |
| 18 | Storybook test project, neutral, light, Thai | Date picker `Empty` renders in a Field labelled "วันที่ตัดสินใจ", and once with `value="2026-02-30"` | The trigger reads "เลือกวันที่" with its calendar icon | None. The false value shows as empty (`date-value-1`) | `Empty` play: trigger named "วันที่ตัดสินใจ", text "เลือกวันที่" in both renders; a second trigger outside a Field is named "เลือกวันที่" (`dp-names-1`) |
| 19 | Same | Date picker `KeyboardPath`: the person tabs to the trigger with `selected` set and presses Enter, moves with Right Arrow and presses Enter; `Empty` opens the same way; `LateMin`, with `min` set to `2026-12-02`, opens the same way | The panel opens on November 2026 with focus on day 12, or on day 6 when empty; after Enter it closes. `LateMin` opens on "ธันวาคม 2569" with focus on day 2 | `onChange` called once with `2026-11-13`; focus back on the trigger (`dp-open-1`, `cal-today-1`) | `KeyboardPath` and `LateMin` plays: `document.activeElement` at each step; the Tab order inside the panel reaches Previous month, Next month and the focusable day |
| 20 | Same | Date picker `Filled`: the person opens it and presses day 12 | The panel closes and the trigger reads "12 พ.ย. 2569" | `onChange` called once with `2026-11-12`, not a Buddhist year (`dp-commit-1`, `date-value-1`) | `Filled` play: trigger text; accessible description holds "วันพฤหัสบดีที่ 12 พฤศจิกายน พ.ศ. 2569"; outside a Field the name is "เปลี่ยนวันที่ วันพฤหัสบดีที่ 12 พฤศจิกายน พ.ศ. 2569" |
| 21 | Same | Date picker `Dismiss`: with `selected` set the person opens it, moves focus and presses Escape; opens it again and presses a button outside | The panel closes both times and the trigger still reads "12 พ.ย. 2569" | `onChange` not called. After Escape focus is on the trigger, after the outside press on that button (`dp-open-1`, `dp-commit-1`) | `Dismiss` play with `userEvent`; `fn()` count 0; `document.activeElement` asserted |
| 22 | Same | Date picker `NonModal`: the person opens the panel | The page stays readable behind it, with no scrim, and the trigger holds its open edge | The panel has `role="dialog"`, the name "เลือกวันที่จากปฏิทิน" and no `aria-modal`; the trigger has `aria-haspopup="dialog"` and `aria-expanded="true"` | `NonModal` play: `waitFor` the trigger's computed `borderColor` to equal the resolved `--cmp-input-border-hover` while open (`dp-api-1`) |
| 23 | Same | Date picker `Sizes`, `Disabled`, `ReadOnly`, `Invalid` render | Three trigger heights; a disabled trigger that does not open; a read-only "12 พ.ย. 2569" that looks like text and does not open; an invalid trigger with "เลือกวันที่ก่อนบันทึก" under it | `aria-invalid` on the invalid trigger; the Field error linked by `aria-describedby` | One play each: heights equal `size.control.*` to 0.5 px and the three triggers of `Sizes` have no `data-trigger`; a press opens nothing on `Disabled` and `ReadOnly`; `Invalid` border equals the resolved `--cmp-input-border-error`, with the panel closed and with it open |
| 24 | Storybook test project | Date picker `InsideProfile` opens under friendly in dark | The panel in that profile, through the portal | The panel's nearest boundary reads `friendly` and `dark` | `InsideProfile` play, as Popover's |
| 25 | Same, English | Date picker `InEnglish` renders the states of rows 18, 20, 22 and 23 | "Choose a date", "Nov 12, 2026", the panel named "Choose a date from the calendar" and the error "Choose a date before saving" | None | `InEnglish` play: those strings and the name "Change date, Thursday, November 12, 2026" found |
| 26 | Storybook, a 360 px frame | Date picker `At360` renders a Field labelled `fixtures.longThai` with `selected` set, then opens the panel; `TwoMonthsPanel`, with `months={2}`, opens at a 360 by 640 viewport through `page.viewport`, as `atPhoneSize` in `Select.stories.tsx` does | The long label wraps and the panel fits the screen with the whole month in it. With two months they stack and the panel scrolls inside itself | None | `At360` play: panel width equals W4's `at8`, not above its `cap`; panel `scrollWidth` not above `clientWidth`; panel computed padding 0 and the calendar's ground transparent; panel height equals W10's `panel`; the frame rule on the label with `expectLinesClear`, on the trigger value with `expectLabelInkWhole`, and on the heading with `expectLabelInkWhole` and the panel as frame. `TwoMonthsPanel` play, on real Radix positioning: the second month sits below the first; the panel's computed `maxHeight` equals its `--radix-popover-content-available-height`, `overflowY` is `auto` and `scrollHeight` is above `clientHeight`; after a scroll, `document.elementFromPoint` at the second month's last day finds that day |
| 27 | Storybook test project | Date picker `RecipesAndModes` renders the empty and filled triggers through `Matrix` | The two triggers in the six boundaries | None. No new pair: the trigger reads `ds-control` | `RecipesAndModes` play: counts equal W9 |
| 28 | The PR head | `pnpm typecheck` runs on the story file | Not a screen | `@ts-expect-error` lines hold for `value={new Date()}`, `size="xl"` and `entry="other"` | `pnpm --filter @orivilo/design-system typecheck` output |
| 29 | The PR head | `check-catalog` and the i18n checks run | Not a screen | `catalog/base/date-picker.yaml` (story `base-date-picker`, status `draft`, sizes `[sm, md, lg]`, states `[default, hover, focus-visible, open, disabled, read-only, invalid, empty]`, recipes neutral, professional, friendly) resolves; `coverage.md` row reads `draft`; `datePicker.placeholder`, `datePicker.changeLabel` and `datePicker.dialog` exist in Thai and English; no middot or em dash in those files | `pnpm --filter @orivilo/design-system test` output |
| 30 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Date picker `Empty`, `Filled`, `Invalid`, `At360`, `RecipesAndModes` with the panel open | A trigger that sits beside Select as a field does, and a panel that fits at 360 | None | Designer visual sign-off, its PNG paths posted on the issue as a Jira comment, since a sign-off has an empty `write_set` and cannot write design.md |
| 31 | Storybook test project, neutral, light, Thai | Calendar `Range`: the person presses day 9, then day 13 | Day 9 alone, selected with no band, then days 9 to 13 as a band | `onChange` not called after the first press, then once with `{ start: "2026-11-09", end: "2026-11-13" }` (`cal-range-1`) | `Range` play: after the first press the root has `data-range-open` and day 9's cell has a transparent ground; after the second the root has none; `aria-multiselectable` on the grid |
| 32 | Same | Calendar `RangeOrder`: the person presses day 13 then day 9; presses day 20 twice; presses day 3, then day 4 | Each band as pressed | `onChange` with `{ start: "2026-11-09", end: "2026-11-13" }`, then `{ start: "2026-11-20", end: "2026-11-20" }`, then `{ start: "2026-11-03", end: "2026-11-04" }`; the press on day 3 after a complete range starts a new one and calls nothing, so three calls in all | `RangeOrder` play with `fn()` calls asserted in order; after the second press on day 20 its name is "วันศุกร์ที่ 20 พฤศจิกายน พ.ศ. 2569 เลือกวันเดียว", its cell's ground is transparent and its `::before` draws no line |
| 33 | Same | Calendar `RangeStates` renders `rangeStart` to `rangeEnd`, and the person hovers day 11; a second calendar runs from `today` to `rangeStart` | Start and end with an edge all round, the three days between as a band with a line above and below | Day names "วันจันทร์ที่ 9 พฤศจิกายน พ.ศ. 2569 วันเริ่มต้น", "วันศุกร์ที่ 13 พฤศจิกายน พ.ศ. 2569 วันสิ้นสุด", "วันพุธที่ 11 พฤศจิกายน พ.ศ. 2569 อยู่ในช่วงที่เลือก"; in the second calendar "วันนี้ วันศุกร์ที่ 6 พฤศจิกายน พ.ศ. 2569 วันเริ่มต้น" | `RangeStates` play: names; the middle button's `borderColor` is transparent and the start's equals `--cmp-calendar-day-selected-edge`; the start button's ground and the middle cell's ground equal the resolved `--cmp-calendar-day-selected-bg`; the middle cell's `::before` has a 1 px block border and no inline border; hovered, day 11's button has the edge `--cmp-calendar-day-hover-edge` and a transparent ground |
| 34 | Same | Calendar `RangeAcrossMonths`: the person presses 28 November, moves to December, presses 3 December; `RangeBlocked` with `blocked`: presses day 16, then day 20 | The open start survives the move and the band runs to 3 December. Past the blocked day, day 20 becomes the open start | `onChange` once with `{ start: "2026-11-28", end: "2026-12-03" }`; in `RangeBlocked` not called | Both plays with `fn()` asserted |
| 35 | Storybook at 1440 px | Calendar `TwoMonths` renders `months={2}` from November 2026 | "พฤศจิกายน 2569" and "ธันวาคม 2569" side by side | None | `TwoMonths` play: two grids; the width of `.ds-calendar__months` equals W4's `two` |
| 36 | Storybook test project, neutral, light, Thai | Date picker `Range` in a Field labelled "ช่วงวันที่ตัดสินใจ": the person opens it, presses day 9, then day 13 | The trigger first reads "เลือกช่วงวันที่". The panel stays open after day 9, closes after day 13, and the trigger reads "9 พ.ย. 2569 ถึง 13 พ.ย. 2569" | `onChange` once with the range; focus back on the trigger | `Range` play: trigger text; accessible description holds both `full` dates |
| 37 | Same | Date picker `RangeDismiss` with a range set: the person opens it, presses day 20 and presses Escape | The trigger still reads "9 พ.ย. 2569 ถึง 13 พ.ย. 2569" and reopening shows no open start | `onChange` not called (`dp-commit-1`) | `RangeDismiss` play |
| 38 | Same, English | Calendar `InEnglish` and Date picker `InEnglish` add the range states of rows 33 and 36 | "Choose a date range", "Nov 9, 2026 to Nov 13, 2026", and the days named "Monday, November 9, 2026, start of the range", "Today, Friday, November 6, 2026, start of the range" and "Friday, November 20, 2026, a one-day range" | None | `InEnglish` plays |
| 39 | Storybook, a 360 px frame, and the test project | Date picker `RangeAt360` renders the widest value, `widestTh` in Thai and `widestEn` in English (W11), then holds the Thai one in a 200 px field; Calendar and Date picker `RecipesAndModes` add the range states | The whole value on one line in the trigger; in the 200 px field two balanced lines in a taller trigger; the band in the six boundaries | None | `RangeAt360` play: frame `scrollWidth` not above 360; the frame rule on the trigger value with `expectLabelInkWhole` in the full field, and with `expectLinesClear` in the 200 px field, whose trigger is taller than its one-line height; matrix counts equal W9 |
| 40 | The PR head | `pnpm typecheck` and `check-catalog` run | Not a screen | `@ts-expect-error` lines hold for an open range value (`{ start }` alone) and `mode="range"` with an `IsoDate`; both catalog entries add the range states; `datePicker.range`, `datePicker.placeholderRange` and `calendar.dayRange*` exist in Thai and English | `pnpm --filter @orivilo/design-system typecheck` and `test` output |
| 41 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Calendar `RangeStates`, `TwoMonths` and Date picker `Range`, `RangeAt360` | A band whose start, middle and end read apart with the colour taken away | None | Designer visual sign-off, its PNG paths posted on the issue as a Jira comment, since a sign-off has an empty `write_set` and cannot write design.md |
| 42 | Node, `src/i18n/date.test.ts` | `parseTypedDate` runs on the inputs of W6 | Not a screen | Output equals W6 line for line (`dp-typed-1`) | Unit test |
| 43 | Storybook test project, neutral, light, Thai | Date picker `Typed` in a Field with the hint: the person types "12/11/2569" and tabs out; then types "๑๒/๑๑/๒๕๖๙" and presses Enter; opens the calendar | The hint "วัน/เดือน/ปี พ.ศ. เช่น 06/11/2569" under the label; the text stays "12/11/2569" in both cases; the panel opens on พฤศจิกายน 2569 | `onChange` called with `2026-11-12`; the field's `aria-describedby` reaches the hint | `Typed` play; the end button named "เปิดปฏิทิน" |
| 44 | Same | Date picker `TypedErrors`: the person types in turn "12/11/69", "12/11/2026", "29/02/2569", and with `min` and `max` set "01/11/2569"; then with `min` alone and with `max` alone, "01/11/2569" and "30/11/2569" | In turn "พิมพ์วันที่เป็น วัน/เดือน/ปี พ.ศ. เช่น 06/11/2569", "พิมพ์ปี พ.ศ. ระหว่าง 2443 ถึง 2643 เช่น 2569", "ไม่มีวันที่นี้ในปฏิทิน ตรวจวันและเดือนอีกครั้ง", "เลือกวันที่ตั้งแต่ 3 พ.ย. 2569 ถึง 24 พ.ย. 2569", "เลือกวันที่ตั้งแต่ 3 พ.ย. 2569 เป็นต้นไป", "เลือกวันที่ไม่เกิน 24 พ.ย. 2569" | `onChange` not called; `aria-invalid` on the input; typed text kept | `TypedErrors` play |
| 45 | Same, English | Date picker `InEnglish` adds rows 43 and 44 | "Month/day/year, for example 11/06/2026"; typing "11/12/2026" commits, typing "11/12/2569" shows "Type a year from 1900 to 2100, for example 2026" | `onChange` called once with `2026-11-12` | `InEnglish` play |
| 46 | Storybook, a 360 px frame, and the test project | Date picker `TypedAt360` shows the longest error; `RecipesAndModes` adds the typed form | The hint and the error wrap inside the frame; the field in the six boundaries | None | `TypedAt360` play: frame `scrollWidth` not above 360; the frame rule on the error with `expectLinesClear`; matrix counts equal W9 |
| 47 | The PR head | `pnpm typecheck` and `check-catalog` run | Not a screen | `@ts-expect-error` holds for `entry="typed"` with `mode="range"`; `catalog/base/date-picker.yaml` adds the typed form; `datePicker.hint`, `datePicker.openCalendar`, `datePicker.errorFormat`, `datePicker.errorYear`, `datePicker.errorNoDate`, `datePicker.errorBounds`, `datePicker.errorMin` and `datePicker.errorMax` exist in Thai and English | `pnpm --filter @orivilo/design-system typecheck` and `test` output |
| 48 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Date picker `Typed`, `TypedErrors`, `TypedAt360` | A field whose hint says which year it wants, read aloud as Thai | None | Designer visual sign-off, its PNG paths posted on the issue as a Jira comment, since a sign-off has an empty `write_set` and cannot write design.md |
| 49 | The PR head of each PR | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/calendar src/components/date-picker` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n src/tokens`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

Rows 1 to 17 are Calendar, 18 to 30 Date picker, 31 to 41 range, 42 to 48 the typed field, row 49 each PR.

## Rows that render nothing

- Rows: 1, 2, 14, 15, 16, 28, 29, 40, 42, 47, 49

Rows 1, 2 and 42 are unit tests, rows 14, 28, 40 and 47 type and catalog checks, rows 15 and 29 catalog and copy checks, row 16 a dependency read, row 49 test runs.

## Rows per PR

Open question 18 says who adds the lines, and a line is added when its PR opens. By open question 12: the first PR covers rows 1 to 17, the second rows 18 to 30, the third rows 31 to 41, the fourth rows 42 to 48, and each of them row 49.

PR 198 is the first PR. The contract table lands by PR, so it has no `CalendarIcon`, no `datePicker.*` key and no `calendar.dayRange*` key; each comes with the PR whose rows name it. It does carry the `TwoMonths` story, since `months` is part of `cal-api-1`, and row 35 stays with the third PR.

- PR 198: rows 1-17, 49

## Design amendments

Where each of the 18 amendments of `design.md` lives now. The design proof was mock markup with proposed CSS, injected into the `Base/Button` story and rendered in the flow, with no real DayPicker DOM and no real Radix positioning. Its ratios came from the token sources through the designer's own script, not `recipes.test.ts`. So "Engine" below means the amendment rests on a slot name, a cell attribute or a prop of the engine, read from no 10.0.2 source, and "Popover" that it rests on real Radix behaviour. Each stays unproven until the row named passes on pinned 10.0.2; `cal-engine-1` says what the builder does if the DOM differs. "Ours" means our own CSS, copy or wrapper.

<!-- prettier-ignore -->
| Amendment | Home | Rests on | Proved by |
| --------- | ---- | -------- | --------- |
| Amendment 1 | `cal-look-1`, AC row 33 | Engine: the range modifiers reach the cell, and the cell can hold a `::before` | Row 33, `RangeStates` |
| Amendment 2 | `cal-look-1`, AC row 35, contract table | Engine: the `root` and `months` slots. Popover: `ds-calendar-popover` beside `ds-popover` | Row 26, `At360`; row 35, `TwoMonths` |
| Amendment 3 | `cal-look-1`, contract table | Engine: the day grid is a table, which `border-spacing` needs | Row 5, `MonthShapes`, by the measured gap |
| Amendment 4 | `cal-look-1` | Engine: the `month` slot holds the caption and the grid | Row 5, `MonthShapes`; row 26, `At360` |
| Amendment 5 | `dp-api-1`, contract table | Popover: `PopoverTrigger` keeps our class and adds no `data-trigger` | Row 23, `Sizes`; the frame rule of rows 26 and 39 |
| Amendment 6 | `dp-api-1`, AC row 39 | Ours | Row 39, `RangeAt360` |
| Amendment 7 | `cal-look-1` | Ours | Row 13, `recipes.test.ts` |
| Amendment 8 | `cal-range-1`, AC rows 31 and 32 | Engine: the marks on an open start and on a day that is both start and end | Row 31, `Range`; row 32, `RangeOrder` |
| Amendment 9 | Copy, `cal-names-1`, AC rows 32, 33, 38 and 44 | Engine: a day's label can read its modifiers. The `errorYear` text is ours | Rows 32, 33 and 38 for the names; row 44, `TypedErrors`, for the text |
| Amendment 10 | W7, W11, Fixtures, AC row 39 | Ours. The widths were measured on the real fonts, in the mock | Row 39, `RangeAt360` |
| Amendment 11 | `cal-names-1`, AC row 10 | Engine: the `Nav` key of `components` hands our group the `nav` slot's class, and our `Button` is its direct child (`cal-engine-1`) | Row 10, `Names` |
| Amendment 12 | `cal-api-1`, `cal-look-1`, AC rows 15 and 26 | Popover: Radix sets `--radix-popover-content-available-height` on the panel | Row 26, `TwoMonthsPanel`; row 15 for the story docs |
| Amendment 13 | `cal-look-1`, AC rows 11 and 33 | Engine: a disabled day's button has `disabled`, which `:not(:disabled)` reads | Row 8, `Bounds`; row 11, `States`; row 33, `RangeStates` |
| Amendment 14 | `cal-look-1`, AC row 12 | Engine: the `day` and `day_button` slots, and a fixed-layout grid | Row 12, `At360` |
| Amendment 15 | `dp-api-1`, AC rows 22 and 23 | Popover: `data-state="open"` on the trigger | Row 22, `NonModal`; row 23, `Invalid` |
| Amendment 16 | `cal-engine-1` | Engine: whether `classNames` alone reaches the cell | Rows 31 and 33, with the builder's `verified` naming which it took |
| Amendment 17 | `cal-look-1`, `dp-api-1` | Ours | Row 13, the `var()` test |
| Amendment 18 | `cal-look-1`, AC row 11 | Engine: the `today` mark on a disabled cell | Row 11, `States` |

No amendment rests on the engine's key handling. `cal-keys-1` stays a reading of K-0397, row 9 proves it on pinned 10.0.2, and row 19 proves the focus landing of `dp-open-1` under real Radix.

## Out of scope

- Any Studio screen, and the decision log example. Wiring the filter is a follow-up card; K-0409 shows no `examples` entry for either component yet, so both catalog entries stay `draft`.
- Range presets, audit A.1's "second story" (K-0382, K-0392). Open question 11.
- A date and time picker, multiple selection, week numbers and event calendars (K-0380, K-0385, K-0395).
- A clear control on the trigger. The caller clears through `value`.
- A month or year dropdown (open question 15).
- A right-to-left layout (`dir`, K-0389): neither ORIVILO locale needs it.
- A screen reader test. Names and roles are asserted; what a reader says was not heard.
- Any semantic token or profile change, and any `apps/web` change.
- Visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

An answered question keeps its number and options, and its answer replaces the default.

1. The calendar engine. `radix-ui` 1.8.1 has no calendar or date package (K-0394), while the rules take behaviour from it. Options: (a) hand-built on no new dependency and no security review, where we write and prove the grid, roving focus, Page key arithmetic and range ourselves, the work K-0397 shows the library doing, against the reasoning of ADR 0004 decision 7; (b) React DayPicker, what shadcn's Calendar is built on (K-0389), MIT, one direct dependency and two behind it (K-0394), with a `security` review on the first PR and a new ADR, and keys matching the APG (K-0397); (c) React Aria, Untitled's base (K-0380), Apache-2.0, a larger tree (K-0386), the fullest calendar system support (K-0388), but ADR 0003 decision 5 and handoff section 7 forbid mixing bases, and its Home and End run by month (K-0387). Answered (owner, ORV-231 comment 10548): (b), which is `cal-engine-1`, pinned at the v10 major, since the site's ^9.7.0 and the registry's `@latest` differ (K-0393), with ADR 0020 on the calendar's behaviour base and the `security` review.
2. Which year Thai UI shows. Options: (a) Buddhist in Thai and Gregorian in English, CLDR's first preference for Thailand (K-0405); (b) Gregorian in both, simplest, and against that preference; (c) Buddhist with the Gregorian year beside it, which is longer in every trigger. Answered (owner, ORV-231 comment 10548): (a), which is `date-year-1`.
3. Whether พ.ศ. is shown. CLDR writes it in the full date and the year-only form, not in the long, medium or short date (K-0405). DayPicker's add-on shows no era word (K-0398). Options: (a) CLDR's split; (b) on every visible Thai date, which lengthens the trigger and the range value; (c) never, which leaves a typed field's hint to say the year alone. Answered (owner, ORV-231 comment 10548): (a), which is `date-year-1`.
4. Which digits. CLDR defaults Thai to Latin digits (K-0405); DayPicker's Buddhist build defaults to Thai digits (K-0398). Options: (a) Latin in both locales; (b) Thai digits in Thai UI, by changing `nu-latn` to `nu-thai` in `DATE_TAGS`, and `numerals`. Answered (owner, ORV-231 comment 10548): (a), Arabic digits in both languages, which is `date-year-1`.
5. The stored value stays Gregorian. Neither library read stores a Buddhist value by default (K-0388, K-0398). Options: (a) a `YYYY-MM-DD` string; (b) a JavaScript `Date`, which moves a day when serialized east of UTC (W2); (c) a `DateValue` object, which needs React Aria's package (K-0380). A stored Buddhist year is not an option. Default: (a), which is `date-value-1`.
6. The week start. Options: (a) a fixed value per locale from CLDR's data (K-0407, K-0408); (b) `Intl.Locale.getWeekInfo()` at run time, Baseline only since July 2026 and needing a fallback (K-0407); (c) Monday, which CLDR gives neither locale. Default: (a), which is `cal-week-1`.
7. Commit on select, or Apply and Cancel. Options: (a) commit on select (K-0392) with Escape as the way out, as the APG's Enter does (K-0400); (b) Apply and Cancel with a Cancel that really restores (K-0400), two more buttons and a draft to hold; (c) Untitled's form, where the value moves before Apply and Cancel keeps it (K-0381). Default: (a), which is `dp-commit-1`.
8. Popover or modal Dialog. Options: (a) `Popover`, which our catalog names for a picker and shadcn composes (K-0391, K-0130), differing from the APG example on `aria-modal`, Tab wrapping and outside clicks (K-0403); (b) a modal Dialog as the APG example has (K-0401, K-0403), which covers the page for a small task; (c) Dialog at 360 px and Popover above, two paths to prove. Default: (a), which is `dp-open-1`. Where Tab goes past the panel's last control was not read (K-0130) and row 19 asserts only the order inside.
9. Home and End by week or by month. Options: (a) by week, the APG example and DayPicker (K-0400, K-0397); (b) by month, React Aria (K-0387). Default: (a), which is `cal-keys-1`. The APG Grid page's Control with Home and End (K-0402) is not added.
10. Which year a typed field accepts and how a typed Buddhist year parses back. No source shows this (K-0409), and K-0401 only says a hint exists. Options: (a) the year the locale shows, refused outside its window with an error that names the fix; (b) a guess, where a Thai field reads a low year such as 2026 as Gregorian, which makes one text mean two things; (c) Gregorian only, which contradicts the screen beside it; (d) no typed field in this story, dropping the fourth PR. Default: (a), which is `dp-typed-1`.
11. Range in this story or later. Audit A.1 says "range and presets are a second story" (K-0382), while D.3 row 28 makes "Range story passes" the done mark, and a log filter needs a span (K-0392, K-0396). Options: (a) range here as its own PR, presets later; (b) both later, so this card does not meet D.3 row 28; (c) range and presets here, over the size guide. Default: (a), which is `cal-range-1`.
12. How the work splits. About 1,500 changed lines in all (an estimate, not a count), far over the 400-line guide. Options: (a) four PRs split vertically, Calendar first, then Date picker, range, typed field, each with its own stories, catalog state and sign-off; (b) two PRs, Calendar with range and Date picker with typed, each over the guide, with the review sized to it (ORV-146). Default: (a). The Calendar PR is the largest, at about 550 lines (an estimate), since the dependency, `date.ts`, tokens and recipe land together; none of them can land alone under the catalog rule.
13. One or two months. K-0383 shows two from `md` and K-0392 two for range. A width-driven count needs a breakpoint in code, and components cannot read `--op-*`. Options: (a) a `months` prop the caller sets, default one; (b) two from `md` inside the component, through a new semantic breakpoint token; (c) one month only. Default: (a), which is `cal-api-1`.
14. Outside days. K-0390 shows them by default; K-0384 fades them with opacity. Options: (a) hidden, so no extra state or proof is needed and two months never show a date twice; (b) shown and not pressable, with a look the designer proves at 3.0. Answered (designer, `design.md`, "Answers to the open questions"): (a), which is `cal-engine-1`. Shown days would need the disabled look and read as blocked days, and the six-row reserve of `cal-look-1` keeps the shape.
15. A month or year control for far dates. K-0395 offers dropdowns, Untitled shows none (K-0383). Options: (a) none now, since Shift with Page keys and the typed field reach far dates; (b) `captionLayout="dropdown"` with our Select look, needing a Buddhist year list. Default: (a), a follow-up if a date of birth use appears.
16. The cell size at 360 px. `ds-popover` caps width at the viewport less two gutters, so seven cells of `size.touch` do not fit at its 16 px padding (W4). Options: (a) keep `size.touch` and take `space.inset.sm` padding on this panel; (b) `size.control.md` cells and the panel's own padding, below `DESIGN.md`'s touch minimum. Answered (designer, `design.md`, "Answers to the open questions"): (a), which is `cal-look-1`. The padding token moved to the calendar (amendment 2) and the width does not change. The designer measured it on the mock, and row 26 proves it under real Radix.
17. The today and disabled marks. K-0384's dot is ruled out by `DESIGN.md` section 8, and an opacity needs a proof. Options: (a) an underline and a line through the number; (b) an edge on today, which sits close to selected and focus. Answered (designer, `design.md`, "Answers to the open questions"): (a), which is `cal-look-1`. With colour taken away, option (b) reads as selected.
18. The Rows per PR lines. Default: the main session adds a `- PR <n>: rows ...` line in the form `qa-scope-1` reads when each PR opens, with a changelog line.

## Not read

From K-0409, not filled in from memory here:

- Untitled UI API tables on both pages (slug placeholders), `range-preset.tsx`, and the Date time picker example (K-0380, K-0382, K-0385).
- React Aria's arrow-key handler bodies, its date picker hook, and its Thai strings (404) (K-0387).
- shadcn's React Aria Calendar page (404) (K-0389) and the Time Picker sample on its Date Picker page (K-0391).
- `https://daypicker.dev/localization` and `https://daypicker.dev/api/type-aliases/CaptionLayout` (both 404); `https://daypicker.dev/docs/localization` returned an empty page (K-0399).
- DayPicker's `Mode` type in `shared.js` (K-0395).
- date-fns `src/locale/th` on `main` (404), its `format` function, and version 4.4.0's license and Thai files (K-0394, K-0408).
- ECMA-402 past character 200,000, including DateTimeFormat locale data (K-0404).
- The APG example's HTML on CodePen (K-0401).

Also not known from the entries: the key names `formatters` takes (`cal-engine-1`), and any run of `th-TH` or of `DATE_TAGS` on our Node and browser targets (K-0406, K-0409). W1 and AC rows 1 and 3 settle the second. The DOM of `react-day-picker` 10.0.2 and the panel under real Radix positioning were not read or run by the design ("Design amendments").

## Depends on

- `docs/specs/ORV-231/design.md` (task ORV-231-design-1): the look, the CSS, the contrast proof and amendments 1 to 18.
- ORV-231 comment 10548 (the owner's answers to open questions 1 to 4).
- ADR 0020 on the calendar's behaviour base, `react-day-picker` beside `radix-ui`, written by `architect`.
- `docs/knowledge/design/K-0380` to `K-0409` (benchmark and standards, 2026-11-06) and K-0130 (Radix Popover).
- `docs/specs/ORV-64/audit.md` section B (table form), section A.1 lines 43 and 44, section D.3 row 28.
- `DESIGN.md` section 3.3 (size, radius), 6 (icons), 7 (states), 8 (colour roles), 10 (writing in the UI), 11 (design gate).
- `.claude/rules/design-system.md` ("Components": benchmark table, Thai and English stories, Recipes and modes, sign-off; "Tokens and layers") and `.claude/rules/testing.md`.
- ORV-137 comment 10247 (the benchmark table in POC mode); ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms).
- ORV-222 (the form of this spec; `expectFrameCutsNoInk` in `src/testing/visual-asserts.ts`).
- ADR 0003 (behaviour and visual split, no mixed bases), ADR 0004 (a behaviour base outside Radix), ADR 0012 (gates).
- `.claude/skills/ovl/SKILL.md` step 6 (`security` on a new runtime dependency, sign-off order).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`, W8 after `pnpm install`. Dates are `2026-11-12` from `calendarFixtures` and `2020-09-29` from the ICU output in K-0406.

W1. `date-format-1`. Input: the two dates and the two tags of `DATE_TAGS`, with the Gregorian Thai tag once as the control K-0406 quotes. Expected output, nine lines, exact strings, no rounding: `29 ก.ย. 2563`, `29 ก.ย. 2020`, `12 พ.ย. 2569`, `พฤศจิกายน 2569`, `วันพฤหัสบดีที่ 12 พฤศจิกายน พ.ศ. 2569`, `Nov 12, 2026`, `November 2026`, `Thursday, November 12, 2026`, `buddhist latn`. The first two are K-0406's output, the third K-0405's `medium` pattern, and the fifth its `full` pattern; the wide Thai weekday name in the fifth is this spec's expectation, not read in any entry. A line that differs goes back to `product`, and the Copy and AC rows follow the run.

```bash
node -e 'const th="th-TH-u-ca-buddhist-nu-latn",en="en-US-u-ca-gregory-nu-latn",u=(y,m,d)=>new Date(Date.UTC(y,m-1,d)),f=(t,o,x)=>new Intl.DateTimeFormat(t,{...o,timeZone:"UTC"}).format(x),my=(t,x)=>new Intl.DateTimeFormat(t,{year:"numeric",month:"long",timeZone:"UTC"}).formatToParts(x).filter(p=>p.type==="month"||p.type==="year").map(p=>p.value).join(" "),a=u(2026,11,12),b=u(2020,9,29);console.log(f(th,{dateStyle:"medium"},b));console.log(f("th-TH-u-ca-gregory-nu-latn",{dateStyle:"medium"},b));console.log(f(th,{dateStyle:"medium"},a));console.log(my(th,a));console.log(f(th,{dateStyle:"full"},a));console.log(f(en,{dateStyle:"medium"},a));console.log(my(en,a));console.log(f(en,{dateStyle:"full"},a));const r=new Intl.DateTimeFormat(th).resolvedOptions();console.log(r.calendar,r.numberingSystem)'
```

W2. `date-value-1`. Input: 12 November 2026 at local midnight in Bangkok. Expected output, two lines: `2026-11-11T17:00:00.000Z`, which is a different day, then `2026-11-12`.

```bash
TZ=Asia/Bangkok node -e 'const d=new Date(2026,10,12),p=n=>String(n).padStart(2,"0");console.log(d.toISOString());console.log(d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate()))'
```

W3. The month shapes of `cal-week-1`, week from Sunday. Input: February, November and August 2026. Expected output, integers, no rounding: `2026 2 lead 0 days 28 rows 4`, `2026 11 lead 0 days 30 rows 5`, `2026 8 lead 6 days 31 rows 6`.

```bash
node -e 'for(const[y,m]of[[2026,2],[2026,11],[2026,8]]){const lead=new Date(Date.UTC(y,m-1,1)).getUTCDay(),days=new Date(Date.UTC(y,m,0)).getUTCDate();console.log(y,m,"lead",lead,"days",days,"rows",Math.ceil((lead+days)/7))}'
```

W4. The width of `cal-look-1`. Input: `size.touch` is `size.11`, `space.gutter` and `space.inset.md` are `space.4`, `space.inset.sm` is `space.2`, `space.stack.lg` is `space.6` (`semantic.json`, `primitives.json`); `.ds-popover` has a 1 px border and `max-width: calc(100vw - 2 * var(--ds-space-gutter))` (`recipes.css` lines 841 and 843); viewport 360. Expected output, integers, no rounding: `cell 44 grid 308 cap 328 at16 342 at8 326 two 640`. So the panel at 16 px padding is 14 px over the cap and at 8 px is 2 px under it, and `two` is the two grids and their gap, without the panel.

```bash
node -e 'const p=require("./packages/design-system/src/tokens/source/primitives.json"),n=v=>parseInt(v.$value),cell=n(p.size["11"]),g=n(p.space["4"]),s=n(p.space["2"]),gap=n(p.space["6"]),b=1,grid=7*cell;console.log("cell",cell,"grid",grid,"cap",360-2*g,"at16",grid+2*g+2*b,"at8",grid+2*s+2*b,"two",2*grid+gap)'
```

W5. `cal-keys-1`. Input: focus on `2026-11-12`, a Thursday, and once on `2026-01-31`. Expected output, one line: `ArrowRight 2026-11-13 ArrowUp 2026-11-05 Home 2026-11-08 End 2026-11-14 PageDown 2026-12-12 ShiftPageDown 2027-11-12 Clamp 2026-02-28`.

```bash
node -e 'const I=t=>t.toISOString().slice(0,10),D=s=>new Date(s+"T00:00:00Z"),add=(s,n)=>I(new Date(D(s).getTime()+n*864e5)),mon=(s,n)=>{const d=D(s),y=d.getUTCFullYear(),m=d.getUTCMonth()+n,last=new Date(Date.UTC(y,m+1,0)).getUTCDate();return I(new Date(Date.UTC(y,m,Math.min(d.getUTCDate(),last))))},a="2026-11-12",w=D(a).getUTCDay();console.log("ArrowRight",add(a,1),"ArrowUp",add(a,-7),"Home",add(a,-w),"End",add(a,6-w),"PageDown",mon(a,1),"ShiftPageDown",mon(a,12),"Clamp",mon("2026-01-31",1))'
```

W6. `dp-typed-1`. Input: the eight texts below and the windows. Expected output, one result per text: `12/11/2569 th 2026-11-12`, `๑๒/๑๑/๒๕๖๙ th 2026-11-12`, `12/11/2026 th year`, `29/02/2567 th 2024-02-29`, `29/02/2569 th noDate`, `12/11/69 th format`, `11/12/2026 en 2026-11-12`, `11/12/2569 en year`, then `windows 2443 2643 overlap false`. `TYPED_YEARS` is 1900 to 2100; the Buddhist window is those plus 543, no rounding.

```bash
node -e 'const T="๐๑๒๓๔๕๖๗๘๙",lo=1900,hi=2100,o=543,p=(s,l)=>{const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim().replace(/[๐-๙]/g,c=>T.indexOf(c)));if(!m)return"format";const[a,b,y]=m.slice(1).map(Number),[d,n,g]=l==="th"?[a,b,y-o]:[b,a,y];if(g<lo||g>hi)return"year";const t=new Date(Date.UTC(g,n-1,d));if(t.getUTCMonth()!==n-1||t.getUTCDate()!==d)return"noDate";return t.toISOString().slice(0,10)};for(const[s,l]of[["12/11/2569","th"],["๑๒/๑๑/๒๕๖๙","th"],["12/11/2026","th"],["29/02/2567","th"],["29/02/2569","th"],["12/11/69","th"],["11/12/2026","en"],["11/12/2569","en"]])console.log(s,l,p(s,l));console.log("windows",lo+o,hi+o,"overlap",hi>=lo+o)'
```

W7. The longest filled range value, by characters. Input: the last day of each month of 2026 in `medium`, the first longest kept, in the form of `datePicker.range`. Expected output: `31 มี.ค. 2569 ถึง 31 มี.ค. 2569 31`, the value and its length, an integer, no rounding. No entry lists the Thai month forms, so this is the spec's expectation and the run decides. AC row 39 uses the widest by pixels: `28 เม.ย. 2569 ถึง 28 เม.ย. 2569` and `May 28, 2026 to May 28, 2026` (W11). It is a fixture and not a bound: the frame rule in row 39 is the proof.

```bash
node -e 'const f=new Intl.DateTimeFormat("th-TH-u-ca-buddhist-nu-latn",{dateStyle:"medium",timeZone:"UTC"});let s="";for(let m=0;m<12;m++){const t=f.format(new Date(Date.UTC(2026,m+1,0)));if(t.length>s.length)s=t}const v=s+" ถึง "+s;console.log(v,v.length)'
```

W8. The glyphs of the contract table exist in the pinned Lucide (`lucide-react` 1.52.0, `packages/design-system/package.json` line 28). Expected output: `ChevronLeft true`, `ChevronRight true`, `Calendar true`.

```bash
node -e 'const l=require("./packages/design-system/node_modules/lucide-react");for(const g of["ChevronLeft","ChevronRight","Calendar"])console.log(g,Boolean(l[g]))'
```

W9. The matrix counts of AC rows 13, 27, 39 and 46. Input: three profiles and two modes (`matrix.tsx` line 10), one calendar per cell for row 13, two triggers per cell for row 27. Expected output, integers, no rounding: `cells 6 calendars 6 triggers 12`.

```bash
node -e 'const p=["neutral","professional","friendly"],m=["light","dark"],c=p.length*m.length;console.log("cells",c,"calendars",c,"triggers",c*2)'
```

W10. The heights of `cal-look-1` and the two-month viewport of `cal-api-1`. Input: `calendar.cell-size` is `size.11`, `--cmp-button-height-sm` is `size.8`, `calendar.row-gap` is `space.1`, `calendar.gap` and `calendar.padding` are `space.2`, `space.gutter` is `space.4`, `calendar.months-gap` is `space.6` (`primitives.json`, `generated.css`); the formula of `.ds-calendar__month` in `design.md`, two header rows, one gap and six day rows; `.ds-popover`'s 1 px border. Expected output: `month 360 calendar 376 panel 378 twoViewport 690 cell320 38.57`. Integers with no rounding, except `cell320`, rounded to two places. The designer measured 38.56 in the browser, so row 12 reads it to 0.5 px.

```bash
node -e 'const p=require("./packages/design-system/src/tokens/source/primitives.json"),n=v=>parseInt(v.$value),cell=n(p.size["11"]),nav=n(p.size["8"]),row=n(p.space["1"]),s=n(p.space["2"]),g=n(p.space["4"]),gap=n(p.space["6"]),b=1,month=2*nav+s+6*(cell+row),two=14*cell+gap;console.log("month",month,"calendar",month+2*s,"panel",month+2*s+2*b,"twoViewport",two+2*s+2*b+2*g,"cell320",((320-2*g-2*s-2*b)/7).toFixed(2))'
```

W11. The widest range values of AC row 39. Input: `calendarFixtures.widestTh` and `widestEn` through the `medium` style and `datePicker.range`. Expected output, two lines, exact strings, no rounding: `28 เม.ย. 2569 ถึง 28 เม.ย. 2569`, `May 28, 2026 to May 28, 2026`. The pick comes from `design.md` amendment 10, measured at 16 px: 219.7 px and 220 px, against 210.8 px for W7's string. A width needs a browser, so this example proves the strings and not the pick.

```bash
node -e 'const f=(t,d)=>new Intl.DateTimeFormat(t,{dateStyle:"medium",timeZone:"UTC"}).format(new Date(d+"T00:00:00Z")),a=f("th-TH-u-ca-buddhist-nu-latn","2026-04-28"),b=f("en-US-u-ca-gregory-nu-latn","2026-05-28");console.log(a+" ถึง "+a);console.log(b+" to "+b)'
```

W12. The empty string of `date-format-1`. Input: `2026-11-12` from `calendarFixtures`, `2026-02-30` from AC row 2, and two more values that are not real dates, through the check of `src/i18n/date.ts`, copied, in the `medium` style in `th`. Expected output, four lines, exact strings, no rounding: `"2026-11-12" "12 พ.ย. 2569"`, `"2026-02-30" ""`, `"2026-13-01" ""`, `"not a date" ""`.

```bash
node -e 'const parts=v=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v);if(!m)return;const y=+m[1],o=+m[2],d=+m[3],t=new Date(Date.UTC(2000,o-1,d));t.setUTCFullYear(y);if(t.getUTCFullYear()!==y||t.getUTCMonth()!==o-1)return;return[y,o,d]},f=v=>{const p=parts(v);if(!p)return"";const t=new Date(Date.UTC(2000,p[1]-1,p[2]));t.setUTCFullYear(p[0]);return new Intl.DateTimeFormat("th-TH-u-ca-buddhist-nu-latn",{dateStyle:"medium",timeZone:"UTC"}).format(t)};for(const v of["2026-11-12","2026-02-30","2026-13-01","not a date"])console.log(JSON.stringify(v),JSON.stringify(f(v)))'
```

## Changelog

- v1.0 (2026-11-06): first version, from K-0380 to K-0409 and audit D.3 row 28. Downstream to review: `architect` (the new ADR and `.claude/rules/design-system.md` line 23, open question 1), the owner (open questions 1 to 4), the designer (open questions 14, 16 and 17), the builder envelopes (rows per open question 12), the `security` envelope on the first PR, the qa envelope (Rows per PR lines once the PRs exist), `catalog/coverage.md`.
- v1.1 (2026-11-06): takes in amendments 1 to 18 of `design.md` ("Design amendments" places each), the owner's answers to open questions 1 to 4 (ORV-231 comment 10548) and the designer's to 14, 16 and 17. Tokens: `calendar.padding` replaces `calendar.popover-padding`, and `calendar.radius` and `calendar.row-gap` are new. New class `ds-date-trigger`, new key `calendar.dayRangeSingle`, new fixtures `widestTh` and `widestEn`, new examples W10 and W11, two lines of `design.md`'s CSS replaced (`cal-look-1`). No AC row number changes; rows 5, 10 to 13, 15, 17, 22, 23, 26, 31 to 33, 35, 38, 39 and 44 change their text. Downstream to review: `architect` (the pending ADR, written on v1.0), `designer` (`design.md` lines 293 and 369), the builder envelopes (the proving rows of "Design amendments"), the `security` envelope on the first PR, the qa envelope (the changed rows), the sign-offs of rows 17, 30, 41 and 48 (design.md's visual QA table).
- v1.2 (2026-11-06): points at ADR 0020 where v1.1 said the pending ADR, and adds to AC row 16 the check that only `src/components/calendar/` imports the engine (ADR 0020 decision 3). No AC row number changes. Downstream to review: the builder envelope of PR 1, the `security` envelope.
- v1.3 (2026-11-06): records what ORV-231-build-1 and ORV-231-build-2 built, with no new requirement. `cal-engine-1`: the engine keeps the grid, the roving focus and the keys, while `Calendar` draws its own nav group and weekday row, and why; `Chevron` and `DayButton` are not overridden. `date-format-1`: an empty string for a value that is not a real date, new example W12. `cal-today-1`: how the clock is read after mount, and that no play proves a server render. `cal-api-1`: `CalendarProps` is single mode until the range PR. "Rows per PR" gains the PR 198 line. No AC row number changes; rows 1, 10 and 15 change their text to match what the build already asserts, and Amendment 11's "Rests on" follows the group. Downstream to review: `architect` (ADR 0020 decision 7 and its Consequences line on inherited roles), `designer` (`design.md` lines 3, 146 and 162), the qa envelope (the PR 198 line and rows 1, 10 and 15), the builder envelopes of the later PRs (the range arm, `CalendarIcon`, the `datePicker.*` and `calendar.dayRange*` keys).
