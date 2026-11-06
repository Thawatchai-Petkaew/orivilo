---
issue: ORV-231
spec: docs/specs/ORV-231/spec.md v1.3
task: ORV-231-design-1
date: 2026-11-06
---

# ORV-231 design: Calendar and Date picker (base)

The look of the day grid, the band and the trigger, the answers to open questions 14, 16 and 17, the proof of the colour pairs, the Copy read aloud, and one row of CSS and markup per rule for the builder.

All three answers confirm the spec's default. All seven pairs the spec names pass their floor. The spec's look still falls short in one place: a range middle day with "no edge" is told from a plain day by colour alone, on a ground of 1.05 to 1.51 against the card, which breaks the spec's own line "Each state differs by more than colour" (amendment 1, L-0019). Eighteen amendments follow, each with old and new text, for product to take in. The tables below assume they are taken in.

What this proposal is: `react-day-picker` is not installed and no Calendar exists, so every screen is proposed CSS and mock markup injected into the `Base/Button` story on Storybook. The token names are real and the fonts, profiles and modes are the real ones. The engine's DOM is not: the markup below is what the recipe needs, and the builder maps it onto the pinned 10.0.2 source (`cal-engine-1` row). Colours were computed from the token sources under each boundary, not read from a screen.

## Flow

1. The person meets a field. Its trigger reads "เลือกวันที่" with a calendar mark at the end edge, on the same start edge as a Select or an Input beside it.
2. The person opens it. The panel opens on the month of the value, else on today. Focus lands on the selected day, or the range start, else today, else the first day that can be pressed (`dp-open-1`).
3. The person moves by pointer or keys. The month heading changes, and the panel keeps its height and its Next button stays under the pointer, whether the month has four, five or six rows.
4. Single: one press commits, the panel closes, focus returns to the trigger, and the trigger reads the short date.
5. Range: the first press shows a lone selected day with no band. The second press draws the band, commits and closes. A press past a blocked day moves the open start.
6. The way out: Escape or a press outside closes the panel and keeps the value. There is no Apply and no Cancel.
7. Typed field: the hint under the label says the form and the year. On blur or Enter a good date becomes the padded form. A bad one stays as typed, and the Field shows what to change.

## Answers to the open questions

All three stay on the default, so nothing here is a change of decision. The padding token of question 16 moves to the calendar (amendment 2), and the width it proves does not change.

<!-- prettier-ignore -->
| # | Question | Answer | Why | Screens |
| --- | --- | --- | --- | --- |
| 14 | Outside days | (a), confirmed: hidden | Option (b) on August 2026 shows 11 extra numbers. Not pressable, they need the disabled look, and then they read as blocked days, which they are not. Telling the two apart would take a third mark. In two months the same date would show twice. An empty cell says nothing false, and the six-row reserve (amendment 4) keeps the shape | `q14-neutral-light-th-1440.png`, `q14-neutral-dark-th-1440.png` |
| 16 | The cell at 360 px | (a), confirmed: `size.touch` cells with `space.inset.sm` padding | Measured: panel 326 under the cap of 328, cell 44 x 44, no horizontal scroll, panel `scrollWidth` 324 of 324. Option (b) buys nothing the fit needs and drops under `DESIGN.md`'s touch minimum. On screen the 8 px margin reads as calm as the 16 px one, since the cell's own air sits around each number | `q16-neutral-light-th-360.png`, `q16-neutral-dark-th-360.png` |
| 17 | The today and disabled marks | (a), confirmed: underline and line through | Option (b) puts a fourth ring in a grid that already has selected, hover and focus, and with colour taken away today reads as selected. The underline sits on the number, so it holds on any ground. Underline 2 px at offset 0.25em with `text-decoration-skip-ink: none`; line through 1 px, so the two never read as one mark. A blocked today shows both lines | `q17-neutral-light-th-1440.png`, `q17-neutral-dark-th-1440.png`, `states-neutral-light-th-1440-gray.png`, `states-professional-dark-th-1440-gray.png` |

## Colour pairs

Exact ratios, floored to two places, from the token sources under the six boundaries. `contrastRatio` in `src/foundations/contrast.ts` rounds to one place, so `recipes.test.ts` will print less. Columns: neutral light, neutral dark, professional light, professional dark, friendly light, friendly dark.

### Proved: the seven the spec names

<!-- prettier-ignore -->
| # | Pair | Floor | NL | ND | PL | PD | FL | FD | Lowest | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | `calendar.fg` on `calendar.bg` | 4.5 | 17.63 | 14.74 | 16.26 | 10.20 | 16.14 | 10.38 | 10.20 | Pass |
| S2 | `calendar.weekday-fg` on `calendar.bg` | 4.5 | 6.59 | 7.04 | 5.34 | 6.78 | 5.36 | 6.75 | 5.34 | Pass |
| S3 | `calendar.fg` on `calendar.day-hover-bg` | 4.5 | 16.01 | 12.48 | 13.97 | 6.81 | 14.19 | 6.94 | 6.81 | Pass |
| S4 | `calendar.day-selected-fg` on `calendar.day-selected-bg` | 4.5 | 7.45 | 5.11 | 8.56 | 10.19 | 6.48 | 10.25 | 5.11 | Pass |
| S5 | `calendar.day-selected-edge` on `calendar.bg` | 3 | 8.24 | 5.65 | 9.07 | 6.71 | 6.84 | 6.98 | 5.65 | Pass |
| S6 | `calendar.day-hover-edge` on `calendar.bg` | 3 | 6.59 | 7.04 | 5.34 | 4.91 | 5.36 | 4.90 | 4.90 | Pass |
| S7 | `calendar.day-disabled-fg` on `calendar.bg` | 3 | 3.62 | 4.48 | 3.54 | 3.35 | 3.54 | 3.33 | 3.33 | Pass |

### Proved: six the recipe also puts together, for `pairs.ts` (amendment 7)

<!-- prettier-ignore -->
| # | Pair | Where it shows | Floor | NL | ND | PL | PD | FL | FD | Lowest | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | `calendar.day-selected-edge` on `calendar.day-selected-bg` | The line of the band and the edge of a range end, on the band | 3 | 7.45 | 5.11 | 8.56 | 10.19 | 6.48 | 10.25 | 5.11 | Pass |
| A2 | `calendar.day-hover-edge` on `calendar.day-hover-bg` | A hovered day's edge on its own ground | 3 | 5.99 | 5.96 | 4.58 | 3.27 | 4.71 | 3.27 | 3.27 | Pass |
| A3 | `calendar.day-hover-edge` on `calendar.day-selected-bg` | A hovered selected or middle day | 3 | 5.96 | 6.37 | 5.04 | 7.46 | 5.09 | 7.19 | 5.04 | Pass |
| A4 | `calendar.day-disabled-fg` on `calendar.day-selected-bg` | A controlled value on a blocked day | 3 | 3.27 | 4.05 | 3.34 | 5.08 | 3.36 | 4.89 | 3.27 | Pass |
| A5 | `ds:focus.ring` on `calendar.bg` | A focused day | 3 | 7.09 | 5.65 | 12.44 | 6.71 | 3.51 | 6.28 | 3.51 | Pass |
| A6 | `ds:focus.ring` on `calendar.day-selected-bg` | A focused selected or band day | 3 | 6.41 | 5.11 | 11.74 | 10.19 | 3.33 | 9.22 | 3.33 | Pass |

### Refused: these may not carry a state

<!-- prettier-ignore -->
| # | Pair | Floor it would need | NL | ND | PL | PD | FL | FD | What follows |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | `calendar.day-selected-bg` on `calendar.bg` | 3 | 1.10 | 1.10 | 1.05 | 1.51 | 1.05 | 1.46 | The band's ground alone is no mark. This is what the spec's "no edge" relies on: amendment 1 |
| R2 | `calendar.day-selected-fg` against `calendar.fg` | 3 | 2.14 | 2.60 | 1.79 | 1.51 | 2.35 | 1.48 | Ink alone cannot carry the middle day either, and no colour may carry a state alone |
| R3 | `calendar.day-hover-bg` on `calendar.bg` | 3 | 1.10 | 1.18 | 1.16 | 1.49 | 1.13 | 1.49 | Why hover needs its edge. It has one, so nothing changes |
| R4 | `calendar.day-disabled-fg` on `calendar.day-hover-bg` | 3 | 3.29 | 3.79 | 3.04 | 2.23 | 3.11 | 2.22 | Under the floor in dark. Hover must never reach a disabled day, so `:not(:disabled)` in the hover rule is load-bearing (amendment 13). Not a listed pair, since the two never meet |

The disabled trigger reads the existing pair of `ds-control`, lowest 3.9 under professional light, as Select does. AC row 27's "no new pair" holds: the trigger's open edge (amendment 15) reads `input.border-hover`, already a pair of that recipe.

## The Copy, read aloud

Each row was read aloud with its fixtures filled in, in both languages, as a person would hear it.

<!-- prettier-ignore -->
| Keys | Read as | Verdict |
| --- | --- | --- |
| `calendar.previousMonth`, `nextMonth`, `navigation` | เดือนก่อนหน้า, เดือนถัดไป, เปลี่ยนเดือน. Previous month, Next month, Change month | Natural |
| `calendar.dayToday`, `daySelected`, `dayTodaySelected` | วันนี้ วันศุกร์ที่ 6 พฤศจิกายน พ.ศ. 2569. วันพฤหัสบดีที่ 12 พฤศจิกายน พ.ศ. 2569 เลือกแล้ว. Today, Friday, November 6, 2026 | Natural |
| `calendar.dayRangeStart`, `dayRangeEnd`, `dayRangeMiddle` | วันจันทร์ที่ 9 พฤศจิกายน พ.ศ. 2569 วันเริ่มต้น. ... วันสิ้นสุด. ... อยู่ในช่วงที่เลือก. Monday, November 9, 2026, start of the range | Natural. Two gaps: today inside a range has no key, and a one-day range would say "start" alone (amendment 9) |
| `calendar.weekdayShort*`, `weekdayFull*` | อา. จ. อ. พ. พฤ. ศ. ส., วันอาทิตย์ to วันเสาร์. Su to Sa, Sunday to Saturday | Natural |
| `datePicker.placeholder`, `placeholderRange`, `changeLabel`, `changeRangeLabel`, `range`, `dialog`, `openCalendar` | เลือกวันที่, เลือกช่วงวันที่, เปลี่ยนวันที่ {date}, 9 พ.ย. 2569 ถึง 13 พ.ย. 2569, เลือกวันที่จากปฏิทิน, เปิดปฏิทิน. Choose a date, Open the calendar | Natural. A one-day range reads the date twice in the trigger ("20 พ.ย. 2569 ถึง 20 พ.ย. 2569"), which is true and stays |
| `datePicker.hint`, `errorFormat` | วัน/เดือน/ปี พ.ศ. เช่น 06/11/2569. พิมพ์วันที่เป็น วัน/เดือน/ปี พ.ศ. เช่น 06/11/2569 | Natural, and it reads as Thai, not as a translation (AC row 48) |
| `datePicker.errorYear`, Thai | พิมพ์ปี พ.ศ. 2443 ถึง 2643 เช่น 2569 | Clipped. Read aloud, the year and the bound run together as one number phrase. Needs ระหว่าง: พิมพ์ปี พ.ศ. ระหว่าง 2443 ถึง 2643 เช่น 2569 (amendment 9). The form `{min} ถึง {max}` has a precedent at `th.ts` line 134 |
| `datePicker.errorNoDate`, `errorBounds`, `errorMin`, `errorMax` | ไม่มีวันที่นี้ในปฏิทิน ตรวจวันและเดือนอีกครั้ง. เลือกวันที่ตั้งแต่ 3 พ.ย. 2569 ถึง 24 พ.ย. 2569. เลือกวันที่ตั้งแต่ 3 พ.ย. 2569 เป็นต้นไป. เลือกวันที่ไม่เกิน 24 พ.ย. 2569 | Natural. Each says what is wrong and how to fix it |
| English errors and hint | Type the date as month/day/year, for example 11/06/2026. Type a year from 1900 to 2100, for example 2026. That date is not on the calendar. Check the day and month | Natural. No English string changes. They wrap inside 328 px (`typed-neutral-light-en-360.png`) |
| Fixtures | วันที่ตัดสินใจ, ช่วงวันที่ตัดสินใจ, เลือกวันที่ก่อนบันทึก. Decision date, Decision date range, Choose a date before saving | Natural |

## States

Selected and focused are different states and read apart: selected is a ground, an ink and a 1 px edge; focus is the ring line with a 3 px halo. Both can hold at once.

### Calendar

<!-- prettier-ignore -->
| State | Look | Carried by, with colour taken away | Notes |
| --- | --- | --- | --- |
| Default | Number in `calendar.fg`, transparent 1 px edge, so no state moves the layout | The number | |
| Hover | `calendar.day-hover-bg` and `calendar.day-hover-edge` | The edge | Never on a disabled or a focused day |
| Focus | Border form of `DESIGN.md` section 7: ring line, halo, `z-index: 1` | The halo | Measured on plain and selected days, also while hovered: ring colour kept, shadow ends `0px 0px 0px 3px`, outline transparent |
| Selected | Ground, ink, 1 px edge | The edge | Hover keeps the ground and turns the edge to `calendar.day-hover-edge`. Selected and hover share a shape, but hover is passing and follows the pointer |
| Today | Underlined number in its own ink | The underline | With no brand colour. Not marked until after mount (`cal-today-1`), and the layout does not move |
| Disabled | `calendar.day-disabled-fg`, 1 px line through | The line | No opacity. `cursor: not-allowed` |
| Range start, end | Selected, on a band that runs inward from the cell's rounded side | The edge and the band's lines | |
| Range middle | Band ground, selected ink, 1 px line above and below, no side line, no radius | The two lines | Hover shows the edge pill over the band |
| Open start | Selected with no band | The edge | `data-range-open` on the root |
| One-day range | One selected day with no band | The edge | |
| Empty | No day selected. Days are ready to press | | The empty cells of a short month stay blank |
| Loading | None. The calendar reads no data | | |
| Error | None of its own. A blocked day is disabled, and the Date picker carries errors | | |
| Success | None. Selected is the answer, with no tick and no message | | |

### Date picker

<!-- prettier-ignore -->
| State | Look | Notes |
| --- | --- | --- |
| Default, empty | `ds-control` with the placeholder in the control's placeholder ink: an invitation, `DESIGN.md` section 7 | A false `value` such as `2026-02-30` shows as empty |
| Filled | `medium`, or `datePicker.range`, in the value ink | A long value wraps; it never truncates |
| Hover | `ds-control`'s hover edge | |
| Focus | `ds-control`'s focus form | Check with `expectFocusBorderForm` in the `KeyboardPath` play |
| Open | `input.border-hover` edge while the panel is open | An invalid trigger stays red while open |
| Disabled | `ds-control`'s disabled ground, `cursor: not-allowed`, opens nothing | |
| Read-only | A read-only `Input`, reading as text, opens nothing | |
| Error | `aria-invalid` red edge, Field error under it | |
| Loading | None. The picker reads no data | |
| Success | None. The value itself says it was taken | No success state without backing data |

## CSS and markup per rule

Every value below is a `--cmp-*` or `--ds-*` name, a private `--_*` local, or `calc` over them, as `.ds-popover` does. All 68 custom properties the proposal reads exist, or are declared in the token block below, except `--radix-popover-content-available-height`, which Radix sets and `recipes.test.ts` allows. The final state of the CSS was checked on the screens; `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/proposed.css` is the exact file.

<!-- prettier-ignore -->
| Rule | Markup | CSS | Play that proves it |
| --- | --- | --- | --- |
| `cal-engine-1` | Slot map below. `showOutsideDays={false}` leaves leading and trailing cells empty; the cell keeps its size so the columns hold | Block "Slots" | `Default`, `MonthShapes`: 30 day buttons, lead cells of W3 |
| `cal-look-1` | Root `div.ds-calendar[lang][data-months]`. Each cell a `td.ds-calendar__day` holding `button.ds-calendar__day-button` | Blocks "Tokens", "Frame", "Day" | `States`, `Today`, `Bounds`, `At360`, `MonthShapes`: calendar height equal across rows 4, 5, 6 |
| `cal-range-1` | Cell attributes `data-range-start`, `data-range-middle`, `data-range-end`; root `data-range-open` while the second press is pending | Block "Band" | `RangeStates`, `Range`, `RangeOrder` |
| `cal-names-1` | Heading `span.ds-calendar__heading[role=status][aria-live=polite]`. Nav `div[role=group].ds-calendar__nav` with two `Button variant="ghost" size="sm" iconOnly` | Block "Frame", the nav rules | `Names`; a nav play reads `document.elementFromPoint` 5 px outside the button and finds it |
| `cal-bounds-1` | Nav buttons take Button's own `disabled` | Block "Day", disabled rules | `Bounds` |
| `dp-api-1` | `button.ds-control.ds-date-trigger[data-size]`, no `data-trigger`, then `span` (value, `data-placeholder` when empty) and `CalendarIcon.ds-control__icon.size-5` at the end. Read-only: `Input readOnly` | Block "Trigger" | `Sizes`: 32, 40, 48 to 0.5 px; `Invalid`; `RangeAt360` |
| `dp-names-1` | The full date sits in a `span.sr-only` whose id joins the trigger's `aria-describedby` | None | `Filled`, `Range` |
| `dp-open-1` | `PopoverContent` with `className="ds-calendar-popover"`, `data-months={months}`, `aria-label`. Calendar inside | Block "Panel" | `At360`: panel 326, `scrollWidth` not above `clientWidth`; `InsideProfile` |
| `dp-typed-1` | `InputGroup` with `.ds-input-group__slot[data-slot=end]` holding `Button size="sm" iconOnly` with `CalendarIcon` | None. Existing recipes | `Typed`, `TypedAt360` |

### Slots

The selectors read `data-*` on the cell. Where the pinned engine sets a modifier as a class or not at all, the builder maps it through `classNames` or `components.Day` (amendment 16) and keeps the rule. The slot names on the left are from K-0390 and K-0395 and from memory of the engine's v9. They have not been read in 10.0.2.

<!-- prettier-ignore -->
| Engine slot | Our class or attribute |
| --- | --- |
| `root` | `ds-calendar`, plus `data-range-open` from our wrapper |
| `months` | `ds-calendar__months` |
| `nav` | `ds-calendar__nav`, drawn by `components.Nav` as a `div` with `role="group"` and that class, a child of `months` and absolutely placed, so it spans both months |
| `month` | `ds-calendar__month` |
| `month_caption`, `caption_label` | `ds-calendar__caption`, `ds-calendar__heading` |
| `month_grid` | `ds-calendar__grid` |
| `weekdays`, `weekday` | `ds-calendar__weekdays`, `ds-calendar__weekday` |
| `weeks`, `week` | `ds-calendar__weeks`, `ds-calendar__week` |
| `day` | `ds-calendar__day` |
| `day_button` | `ds-calendar__day-button` |
| modifiers `today`, `selected`, `range_start`, `range_middle`, `range_end` | `data-today`, `data-selected`, `data-range-start`, `data-range-middle`, `data-range-end` on the cell |
| modifier `hidden` | `data-hidden` on the cell, no rule needed |

A range's two ends also carry `data-selected`; a middle day carries `data-range-middle` whether or not the engine also marks it selected, and the middle rule comes after the selected rule to win.

### Tokens

`component.json`, in the spec's names, plus the three new ones (see "New tokens"). `calendar.popover-padding` is gone.

```text
calendar.padding   from space.inset.sm
calendar.radius    from shape.container.radius
calendar.row-gap   from space.inline.sm
```

### Frame

`--_cell` is 44 px from a 360 px viewport up, and shrinks under that so reflow holds.

```css
.ds-calendar {
  --_cell: min(
    var(--cmp-calendar-cell-size),
    calc((100vw - 2 * var(--ds-space-gutter) - 2 * var(--cmp-calendar-padding) - 2px) / 7)
  );
  position: relative;
  inline-size: fit-content;
  max-inline-size: 100%;
  padding: var(--cmp-calendar-padding);
  border-radius: var(--cmp-calendar-radius);
  background: var(--cmp-calendar-bg);
  color: var(--cmp-calendar-fg);
}
.ds-calendar__months {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cmp-calendar-months-gap);
}
.ds-calendar__nav {
  position: absolute;
  inset-block-start: var(--cmp-calendar-padding);
  inset-inline: calc(
    var(--cmp-calendar-padding) + (var(--_cell) - var(--cmp-button-height-sm)) / 2
  );
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}
.ds-calendar__nav > .ds-button {
  position: relative;
  pointer-events: auto;
}
/* The look stays sm; the press area reaches size.touch. */
.ds-calendar__nav > .ds-button::after {
  content: "";
  position: absolute;
  inset: calc((var(--cmp-button-height-sm) - var(--cmp-calendar-cell-size)) / 2);
}
.ds-calendar__month {
  display: flex;
  flex-direction: column;
  gap: var(--cmp-calendar-gap);
  inline-size: calc(7 * var(--_cell));
  min-block-size: calc(
    2 * var(--cmp-button-height-sm) + var(--cmp-calendar-gap) + 6 *
      (var(--_cell) + var(--cmp-calendar-row-gap))
  );
}
.ds-calendar__caption {
  display: flex;
  align-items: center;
  justify-content: center;
  min-block-size: var(--cmp-button-height-sm);
}
.ds-calendar__heading {
  font-family: var(--cmp-calendar-heading-type-font-family);
  font-size: var(--cmp-calendar-heading-type-font-size);
  line-height: var(--cmp-calendar-heading-type-line-height);
  font-weight: var(--cmp-calendar-heading-type-font-weight);
  letter-spacing: var(--cmp-calendar-heading-type-letter-spacing);
}
.ds-calendar__grid {
  inline-size: 100%;
  margin-block: calc(-1 * var(--cmp-calendar-row-gap));
  border-collapse: separate;
  border-spacing: 0 var(--cmp-calendar-row-gap);
  table-layout: fixed;
}
.ds-calendar__weekday {
  block-size: var(--cmp-button-height-sm);
  padding: 0;
  color: var(--cmp-calendar-weekday-fg);
  font-family: var(--cmp-calendar-weekday-type-font-family);
  font-size: var(--cmp-calendar-weekday-type-font-size);
  line-height: var(--cmp-calendar-weekday-type-line-height);
  font-weight: var(--cmp-calendar-weekday-type-font-weight);
  letter-spacing: var(--cmp-calendar-weekday-type-letter-spacing);
  text-align: center;
}
```

### Day

Order matters. The focus and disabled selectors are raised to `.ds-calendar__day > ...` so they beat the selected rule: at `.ds-calendar__day-button:focus-visible` alone, a selected focused day lost its ring, which would fail AC row 11.

```css
.ds-calendar__day {
  position: relative;
  inline-size: var(--_cell);
  block-size: var(--_cell);
  padding: 0;
}
.ds-calendar__day-button {
  position: relative;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  inline-size: 100%;
  block-size: var(--_cell);
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--cmp-calendar-day-radius);
  background: transparent;
  color: var(--cmp-calendar-fg);
  font-family: var(--cmp-calendar-day-type-font-family);
  font-size: var(--cmp-calendar-day-type-font-size);
  line-height: var(--cmp-calendar-day-type-line-height);
  font-weight: var(--cmp-calendar-day-type-font-weight);
  letter-spacing: var(--cmp-calendar-day-type-letter-spacing);
  text-decoration-skip-ink: none;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.25em;
  cursor: pointer;
}
.ds-calendar__day-button:hover:not(:disabled):not(:focus-visible) {
  border-color: var(--cmp-calendar-day-hover-edge);
  background: var(--cmp-calendar-day-hover-bg);
}
.ds-calendar__day[data-today] > .ds-calendar__day-button {
  text-decoration-line: underline;
}
.ds-calendar__day[data-selected] > .ds-calendar__day-button {
  border-color: var(--cmp-calendar-day-selected-edge);
  background: var(--cmp-calendar-day-selected-bg);
  color: var(--cmp-calendar-day-selected-fg);
}
.ds-calendar__day[data-selected]
  > .ds-calendar__day-button:hover:not(:disabled):not(:focus-visible) {
  border-color: var(--cmp-calendar-day-hover-edge);
  background: var(--cmp-calendar-day-selected-bg);
}
/* The Band block goes here, before disabled and focus. */
.ds-calendar__day > .ds-calendar__day-button:disabled {
  color: var(--cmp-calendar-day-disabled-fg);
  text-decoration-line: line-through;
  text-decoration-thickness: 1px;
  cursor: not-allowed;
}
.ds-calendar__day[data-today] > .ds-calendar__day-button:disabled {
  text-decoration-line: underline line-through;
}
.ds-calendar__day > .ds-calendar__day-button:focus-visible {
  z-index: 1;
  border-color: var(--ds-focus-ring);
  outline: 1px solid transparent;
  outline-offset: 0;
  box-shadow: var(--_focus-shadow-border);
}
```

### Band

The ground sits on the cell, so it runs edge to edge across a row. The line sits on the cell's `::before`, so a start or end day's own edge and the band's line share one pixel row: one line per edge. The side of a band left open at a row's or month's end stays square, which reads "continues".

```css
.ds-calendar__day[data-range-middle],
.ds-calendar__day[data-range-start]:not([data-range-end]),
.ds-calendar__day[data-range-end]:not([data-range-start]) {
  background: var(--cmp-calendar-day-selected-bg);
}
.ds-calendar[data-range-open] .ds-calendar__day[data-range-start] {
  background: transparent;
}
.ds-calendar__day[data-range-start]:not([data-range-end]) {
  border-start-start-radius: var(--cmp-calendar-day-radius);
  border-end-start-radius: var(--cmp-calendar-day-radius);
}
.ds-calendar__day[data-range-end]:not([data-range-start]) {
  border-start-end-radius: var(--cmp-calendar-day-radius);
  border-end-end-radius: var(--cmp-calendar-day-radius);
}
.ds-calendar__day[data-range-middle]::before,
.ds-calendar__day[data-range-start]:not([data-range-end])::before,
.ds-calendar__day[data-range-end]:not([data-range-start])::before {
  content: "";
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  border-block: 1px solid var(--cmp-calendar-day-selected-edge);
  /* the cell's two rounded corners, from --cmp-calendar-day-radius through logical corner properties (spec cal-look-1) */
  pointer-events: none;
}
.ds-calendar[data-range-open] .ds-calendar__day[data-range-start]::before {
  content: none;
}
.ds-calendar__day[data-range-middle] > .ds-calendar__day-button {
  border-color: transparent;
  background: transparent;
  color: var(--cmp-calendar-day-selected-fg);
}
.ds-calendar__day[data-range-middle]
  > .ds-calendar__day-button:hover:not(:disabled):not(:focus-visible) {
  border-color: var(--cmp-calendar-day-hover-edge);
  background: transparent;
}
```

### Panel

These sit after `.ds-popover` in `recipes.css`, or its padding wins.

```css
.ds-calendar-popover {
  padding: 0;
}
.ds-calendar-popover > .ds-calendar {
  background: transparent;
}
.ds-calendar-popover[data-months="2"] {
  max-block-size: var(--radix-popover-content-available-height);
  overflow-y: auto;
}
```

### Trigger

`ds-control` already has `min-height`, so a wrapped value grows the trigger and the one-line heights stay 32, 40 and 48.

```css
.ds-date-trigger {
  justify-content: space-between;
  padding-block: var(--ds-space-inline-sm);
  text-align: start;
  text-wrap: balance;
  cursor: pointer;
}
.ds-date-trigger[data-size="sm"] {
  padding-block: calc(var(--ds-space-inline-sm) / 2);
}
.ds-date-trigger:disabled {
  cursor: not-allowed;
}
.ds-date-trigger[data-state="open"]:not([aria-invalid="true"]) {
  border-color: var(--cmp-input-border-hover);
}
```

## New tokens

Three component tokens beyond the spec's list, one removed. No semantic or profile change.

<!-- prettier-ignore -->
| Token | From | Reads | Why | Impact |
| --- | --- | --- | --- | --- |
| `calendar.padding` (replaces `calendar.popover-padding`) | `space.inset.sm` | `ds-calendar` | A Calendar on a page needs a tile's padding too (`standalone-neutral-light-th-1440.png`) | `component.json`, regenerated `generated.css`, `recipes.css` |
| `calendar.radius` | `shape.container.radius` | `ds-calendar` | The same tile, with the profile's own corner | Same |
| `calendar.row-gap` | `space.inline.sm` | `.ds-calendar__grid`, `.ds-calendar__month` | Keeps the lines of stacked band rows two, and lets a 3 px halo clear the next row | Same. Adds 4 px per row, so the month is 360 px tall and the panel 378 at 360 px |

## Spec amendments

For product to take in. The rule or row each one touches is named.

<!-- prettier-ignore -->
| # | Where | Old | New | Why |
| --- | --- | --- | --- | --- |
| 1 | `cal-look-1`, AC row 33 | "Range middle: the band with no edge and no radius property." AC 33 user sees: "Start and end with an edge, the three days between as a band with none". AC 33 check: "middle `borderColor` differs from the start's; both grounds equal the resolved `--cmp-calendar-day-selected-bg`" | "Range middle: the band, with a 1 px `calendar.day-selected-edge` line above and below, no side line and no radius property. The band's ground is on the cell, its line on the cell's `::before`, and the button stays transparent." AC 33 user sees: "Start and end with an edge all round, the three days between as a band with a line above and below". AC 33 check: "the middle button's `borderColor` is transparent and the start's equals `--cmp-calendar-day-selected-edge`; the start button's ground and the middle cell's ground equal the resolved `--cmp-calendar-day-selected-bg`; the middle cell's `::before` has a 1 px block border and no inline border" | R1 and R2: ground and ink both fall under 3, so a middle day differs from a plain day by colour alone, against "Each state differs by more than colour". With colour taken away the band is still there on a good screen, but faint: under professional light, at 1.05, the ends read as two separate days with a pale patch between. The lines make it one span. Compare the columns "spec" and "proposal" in `band-professional-light-th-1440-gray.png` and `band-neutral-light-th-1440-gray.png` |
| 2 | `cal-look-1`, AC row 35 | "`calendar.popover-padding` from `space.inset.sm`, read only by `ds-calendar-popover`, which `DatePicker` adds beside `ds-popover` so seven cells fit under its width cap at 360 px (W4)." AC 35: "total width equals W4's `two`" | "`calendar.padding` from `space.inset.sm` and `calendar.radius` from `shape.container.radius`, read by `ds-calendar`. `DatePicker` adds `ds-calendar-popover` beside `ds-popover`, which sets the popover's padding to 0 and the calendar's ground to transparent, so the panel stays W4's `at8`." AC 35: "the width of `.ds-calendar__months` equals W4's `two`" | A standalone Calendar has a ground and needs a tile's padding and corner. Width unchanged at 326. Two months measure 640 in the months wrapper and 656 with the padding |
| 3 | `cal-look-1` | (no line) | Add: "`calendar.row-gap` from `space.inline.sm`, the gap between day rows." | Stacked band rows would otherwise merge their lines into one thick rail. See "New tokens" |
| 4 | `cal-look-1` | (no line) | Add: "A month reserves six rows of height, so the panel's height and the Next button hold at four, five and six rows. `fixedWeeks` stays off, so AC row 5's row counts stand." | Measured: calendar 376 and month 360 at rows 4, 5 and 6. Without it the panel jumps and Next moves under the pointer while paging months (`shapes-*`) |
| 5 | `dp-api-1`, the contract table | "The trigger is a `button` with the existing `ds-control` recipe and `data-size`, wired through `useFieldControl` as Select's trigger is, with `CalendarIcon` as `ds-control__icon`." Table: "Recipe classes `ds-calendar`, `ds-calendar__*`, `ds-calendar-popover`" | "The trigger is a `button` with the existing `ds-control` recipe, `data-size` and the new class `ds-date-trigger`, without `data-trigger`, wired through `useFieldControl` as Select's trigger is, with `CalendarIcon` as `ds-control__icon` at the end edge." Table adds `ds-date-trigger` | `.ds-control[data-trigger] > span:first-child` sets `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap` (`recipes.css` lines 337 to 342, and the clip list at line 4767). The spec says the value sets no overflow, and AC rows 26 and 39 run the frame rule on it, so copying Select's trigger fails both. `ds-control` itself does not change |
| 6 | `dp-api-1`, AC row 39 | "The value span sets no `overflow` and does not truncate; W7 gives the longest value." | "The value span sets no `overflow` and does not truncate: in a field narrower than the value it wraps, balanced, and the trigger grows; AC row 39 gives the widest value." AC 39 adds a 200 px field holding that value, read with `expectLinesClear` | The spec does not say what a value does in a narrow field. The widest value fits one line from a field of about 282 px. Under that it takes two lines (`narrow-*`) |
| 7 | `cal-look-1`, `pairs.ts` | "At floor 3: `calendar.day-selected-edge` on `calendar.bg`, `calendar.day-hover-edge` on `calendar.bg`, `calendar.day-disabled-fg` on `calendar.bg`." | Adds at floor 3: `calendar.day-selected-edge` on `calendar.day-selected-bg`, `calendar.day-hover-edge` on `calendar.day-hover-bg`, `calendar.day-hover-edge` on `calendar.day-selected-bg`, `calendar.day-disabled-fg` on `calendar.day-selected-bg`, `ds:focus.ring` on `calendar.bg`, `ds:focus.ring` on `calendar.day-selected-bg` | A1 to A6: pairs the recipe puts together that the list leaves out |
| 8 | `cal-range-1` | (no line) | Add: "An open start is a selected day with no band, through `data-range-open` on the root, which the wrapper sets. A one-day range is one selected day with no band." | A band that opens toward nothing would claim a span not chosen yet |
| 9 | Copy, `cal-names-1`, AC row 44 | `datePicker.errorYear` Thai: "พิมพ์ปี พ.ศ. {min} ถึง {max} เช่น {year}". AC 44: "พิมพ์ปี พ.ศ. 2443 ถึง 2643 เช่น 2569" | "พิมพ์ปี พ.ศ. ระหว่าง {min} ถึง {max} เช่น {year}". AC 44: "พิมพ์ปี พ.ศ. ระหว่าง 2443 ถึง 2643 เช่น 2569". New key `calendar.dayRangeSingle`: `{date} เลือกวันเดียว` / `{date}, a one-day range`. `cal-names-1` adds: "Today inside a range nests: `calendar.dayToday` wraps the range form, as in วันนี้ {date} วันเริ่มต้น and Today, {date}, start of the range." | The read-aloud above |
| 10 | W7, AC row 39 | "AC row 39 uses what prints." AC 39: "renders the longest value of W7" | "AC row 39 uses the widest by pixels: `28 เม.ย. 2569 ถึง 28 เม.ย. 2569` and `May 28, 2026 to May 28, 2026`." AC 39: "renders the widest value" | W7 counts characters. Measured at 16 px: W7's string 210.8 px, `เม.ย.` 219.7 px, English 220 px. Only the pixel widest tests the bound. W7 stays as a character count |
| 11 | `cal-names-1` | "Previous and next are `Button` `variant="ghost"`, `size="sm"`, `iconOnly`, named from the catalog." | Adds: "A `::after` gives each a press area of `size.touch`, while the look stays `sm`." | Measured: 32 x 32 look, a press lands 5 px outside it and not 7, on a 44 px area. A 44 px button would crowd the heading on a 326 px panel |
| 12 | `cal-api-1`, `cal-look-1` | "The caller chooses; W4 gives the width (open question 13)." "The recipe sets no `overflow` on the calendar, the grid or the heading." | Adds to `cal-api-1`: "Two months need a viewport of about 690 px. Under it they stack, and the story docs tell callers to pass `1` below `md`." Adds to `cal-look-1`: "Only the panel with `months={2}` limits its height to the room Radix reports and scrolls inside it." | Without this, stacked months run off a phone with no way to reach the second. AC row 26's frame rule covers one month and is untouched. When stacked, Next sits on the first month, which is accepted for a prop the docs steer away from |
| 13 | `cal-look-1` | "Hover: the ground and a 1 px edge." | "Hover: the ground and a 1 px edge, never on a disabled or a focused day. On a selected day the ground stays and the edge turns to `calendar.day-hover-edge`. On a range middle day, the edge alone, over the band." | R4, and the measured fight between hover and focus on one day |
| 14 | `cal-look-1`, AC row 12 | (no line) | Add: "Under a 360 px viewport the cell shrinks through a local `--_cell`, so reflow holds; from 360 up it is `calendar.cell-size`. In a column narrower than the month the cell narrows and keeps its height." `At360` adds a Calendar in a 280 px column, where no day button overlaps the next. The rest of AC 12 is unchanged | Measured: at a 320 px viewport the cell is 38.56, the document 320 wide. At 360 and up, 44 x 44. In a 280 px column on a 1440 px screen the button fills its 37.7 px cell at 44 tall, with no overlap and the calendar 280 wide, and a selected day turns from a circle into a soft capsule (`column-*`). A fixed button width overlapped its neighbours there, so the button takes `inline-size: 100%` |
| 15 | `dp-api-1` | (no line) | Add: "While the panel is open the trigger's edge is `input.border-hover`, unless it is invalid." | AC row 29 lists `open` as a state, and no rule gives it a look |
| 16 | `cal-engine-1` | "`components` overrides `Chevron` and `DayButton` (K-0390)." | Adds: "and `Day` if the pinned engine sets no range modifier on the cell." | The band lives on the cell. The builder reads the source and drops this if `classNames` reaches the cell alone |
| 17 | `cal-look-1` | "The recipe `ds-calendar` reads only these new component tokens:" | "The recipe `ds-calendar` reads these new component tokens, and from existing names only `--ds-focus-ring`, `--ds-space-gutter` and `--cmp-button-height-sm`:" | The focus form, the viewport cap and the nav's height. `ds-date-trigger` reads `--ds-space-inline-sm` and `--cmp-input-border-hover` |
| 18 | `cal-look-1` | "Disabled: `calendar.day-disabled-fg` and a line through the number. No opacity." | Adds: "A disabled today shows both lines." | Keeps today findable when it is blocked. AC row 7 is unaffected, since day 6 is not disabled in `Today` |

AC rows 30, 41 and 48 stand as written, and so do W1 to W6, W8 and W9. Spec v1.1 changed the last clause of row 17 and one sentence of W7 on AC row 39. Reruns matched: W1 all nine lines, W4 `cell 44 grid 308 cap 328 at16 342 at8 326 two 640`, W7 `31 มี.ค. 2569 ถึง 31 มี.ค. 2569 31`.

## If the owner chooses otherwise

This design holds the defaults of open questions 1 to 4. Widths are the widest range value at 16 px, against about 266 px of room in a 328 px trigger.

<!-- prettier-ignore -->
| Question | Option | What changes in the look |
| --- | --- | --- |
| 1, the engine | (a) hand-built or (c) React Aria | The slot map only. The classes, the band and the tokens stay. Not rendered |
| 2, the year | (b) Gregorian in both | No look change. The year keeps its four digits |
| 2, the year | (c) both years | Range value 325.5 px: two lines in every 360 px field, so AC row 39's "one line" must go and the heights of siblings differ when a range is set. Single dates still fit |
| 3, พ.ศ. | (b) on every date | Range value 287 px: over the 266 px, the same two lines and the same change to AC row 39 |
| 3, พ.ศ. | (c) never | No look change. The hint and `errorFormat` say the year alone, so the Copy changes |
| 4, digits | (b) Thai digits | Range value 235.3 px, still one line. The grid holds and the underline stays clear, but the line through sits harder on Thai digits: struck ๑ and ๓ come close at 16 px. That mark would need a second look before this option ships (`q4-neutral-light-th-1440.png`, `q4-neutral-dark-th-1440.png`) |

## Visual decisions and their source

<!-- prettier-ignore -->
| Decision | Intent it serves | Source |
| --- | --- | --- |
| Selected is `surface.selected` with an edge, never brand fill | Brand accent never replaces selection | `AGENTS.md`, `DESIGN.md` section 8, the spec's Do not copy |
| The day's shape follows `shape.control.radius` | A profile changes expression by shape, not colour alone: neutral and friendly show circles and capsules, professional a calm 6 px corner | `DESIGN.md` section 3.3; `states-professional-light-th-1440.png` |
| Every state has a non-colour carrier | Read apart with colour taken away | `DESIGN.md` section 7, AC rows 17 and 41 |
| The band is a capsule, with lines above and below and square open ends | Start, middle and end read as one span; a span crossing a row reads as continuing | Amendment 1; `range-neutral-light-th-1440.png` |
| A 4 px gap between rows | One line per edge, and the focus halo clears the row below | Amendment 3 |
| The month reserves six rows | Siblings of one height, a shape that holds at every line count | Amendment 4, L-0017 |
| The trigger's icon at the end edge, the value at the start | One start edge beside Select and Input | `picker-neutral-light-th-1440.png`, AC row 30 |
| A wrapped value, never an ellipsis | A date cut short is a wrong date | `dp-api-1` |
| No animation or transition on days | Nothing to reduce under reduced motion, and a calm grid | `cal-look-1` |
| The heading and weekdays stay in `type.label.md` and `type.body.xs` | Thai upper marks and พฤ. clear without any extra line height | `cal-look-1`, `shapes-*` |

## Screens to check in visual QA

The sign-off of AC rows 17, 30, 41 and 48 runs on the built stories. This table says what to look for. The PNGs below it are the proposal to hold those stories against.

<!-- prettier-ignore -->
| Story | Check | Proposal screens |
| --- | --- | --- |
| Calendar `States`, `Today`, `Bounds` | Selected, today, disabled and focus read apart in grey; focus shows on a selected day; a blocked today shows two lines | `states-*` |
| Calendar `MonthShapes` | One height at 4, 5, 6 rows; Next does not move | `shapes-*` |
| Calendar `RangeStates`, `TwoMonths` | Band continuous across a row; two lines between stacked rows; ends rounded on one side; open tail at a row's end; the first month's Previous and the last month's Next | `range-*`, `two-*`, `band-*-gray` |
| Calendar `At360`, Date picker `At360` | 44 px cells, panel 326, heading whole, no horizontal scroll | `picker-*-360`, `q16-*` |
| Date picker `Empty`, `Filled`, `Invalid`, `Sizes`, `ReadOnly`, `Disabled` | Same start edge and heights as Select and Input; read-only reads as text; red holds while open | `picker-*` |
| Date picker `RangeAt360` and the 200 px field | One line at the widest value; two balanced lines when narrower; Thai marks whole | `picker-*-360`, `narrow-*` |
| Date picker `Typed`, `TypedErrors`, `TypedAt360` | Hint and errors wrap inside the frame; the end button sits in the group; Thai read aloud | `typed-*` |
| Calendar on a page, and in a 280 px column | A padded tile, in dark too; days narrow without touching | `standalone-*`, `column-*` |

Friendly holds the tightest pairs (S6, S7, A6), so look there first when a colour reads weak: `states-friendly-*`, `range-friendly-*`.

### Contact sheet and PNGs

Contact sheet: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/contact-sheet.png`. It holds all 94 screens, grouped by scene. The exact CSS is `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/proposed.css`.

File names read scene, profile, mode, locale, width, and `-gray` when the colour is taken away. Every screen rendered from the final CSS at device scale 2.

- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/band-neutral-dark-th-1440-gray.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/band-neutral-light-th-1440-gray.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/band-professional-dark-th-1440-gray.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/band-professional-light-th-1440-gray.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/column-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/column-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/column-professional-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/column-professional-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/narrow-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/narrow-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/narrow-professional-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/narrow-professional-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-neutral-dark-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-neutral-dark-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-neutral-light-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-neutral-light-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-professional-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-professional-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-professional-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/picker-professional-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/q14-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/q14-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/q16-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/q16-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/q17-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/q17-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/q4-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/q4-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-friendly-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-friendly-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-neutral-dark-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-neutral-dark-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-neutral-light-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-neutral-light-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-professional-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-professional-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-professional-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/range-professional-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/shapes-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/shapes-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/shapes-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/shapes-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/shapes-professional-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/shapes-professional-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/shapes-professional-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/shapes-professional-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/standalone-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/standalone-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-friendly-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-friendly-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-neutral-dark-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-neutral-dark-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-neutral-dark-th-1440-gray.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-neutral-light-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-neutral-light-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-neutral-light-th-1440-gray.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-professional-dark-th-1440-gray.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-professional-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-professional-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-professional-light-th-1440-gray.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-professional-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/states-professional-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/two-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/two-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/two-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/two-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/two-professional-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/two-professional-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/two-professional-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/two-professional-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-neutral-dark-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-neutral-dark-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-neutral-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-neutral-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-neutral-light-en-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-neutral-light-en-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-neutral-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-neutral-light-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-professional-dark-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-professional-dark-th-360.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-professional-light-th-1440.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-231-design-1/screens/typed-professional-light-th-360.png`

## Limits and follow-ups

- The engine's DOM was not read, since `react-day-picker` is absent. The slot names and cell attributes are an assumption until the builder reads the pinned 10.0.2.
- The panel was rendered in the flow at its offset, not through Radix positioning. `At360` and `InsideProfile` prove the real thing.
- The still pictures use forced `.is-hover` and `.is-focus` classes that copy the rules. The measures of focus and hover ran with real pointer and keyboard on the mock markup.
- Nothing here was heard through a screen reader. The Copy was read by this role and not tested with Thai readers.
- Follow-up outside this story: in `InputGroup`, an icon-only `sm` button in a `md` group measures 32 x 30, from `.ds-input-group__slot > .ds-button`. This exists today, shows in `typed-*`, and this spec does not change InputGroup.
