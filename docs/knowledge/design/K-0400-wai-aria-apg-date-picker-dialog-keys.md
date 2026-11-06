---
id: K-0400
topic: design
claim: The APG Date Picker Dialog example opens from a Choose Date button with focus on the selected date or today, moves by arrow keys, sends Home and End to the first and last day of the current week, changes month with Page Up and Down and year with Shift, selects and closes on Space or Enter, and Esc closes it while Cancel closes it without updating the date, each returning focus to the button.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, which returned the rows as short quotes. This is an APG example under the modal dialog pattern, not a pattern of its own (K-0403). The page does not mention disabled dates.

Choose Date button, Space and Enter:

> Open the date picker dialog.
> Move focus to selected date, i.e., the date displayed in the date input text field.
> If no date has been selected, places focus on the current date.

Date grid:

> Moves focus to the same day of the previous week.
> Moves focus to the next day.
> Moves focus to the first day (e.g Sunday) of the current week.
> Moves focus to the last day (e.g. Saturday) of the current week.

(Up Arrow, Right Arrow, Home, End. Down and Left read the same way in reverse.)

Page Up, and Page Down in reverse:

> Changes the grid of dates to the previous month.
> Moves focus to the day of the month that has the same number.
> If that day does not exist, moves focus to the last day of the month.

Shift + Page Up, and Shift + Page Down in reverse:

> Changes the grid of dates to the same month in the previous year.

Date grid, Space and Enter:

> Select the date, close the dialog, and move focus to the "Choose Date" button.
> Update the value of the "Date" input with the selected date.
> Update the accessible name of the "Choose Date" button to include the selected date.

Dialog:

> Closes the dialog and returns focus to the "Choose Date" button.

(Esc.) Tab and Shift + Tab move through "the dialog Tab sequence"; "If focus is on the last button (i.e., "OK"), moves focus to the first button."

Cancel:

> Closes the dialog, moves focus to "Choose Date" button, does not update date in date input.

## Why it matters for ORIVILO

This is the keyboard baseline both libraries compare against. Its Home, End and Cancel are the rows where the libraries read here differ (K-0381, K-0387, K-0397).
