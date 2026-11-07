---
id: K-0401
topic: design
claim: The APG Date Picker Dialog example names its button "Choose Date", then "Change Date, DATE_STRING" after a choice, ties the format hint to the textbox with aria-describedby, uses a modal dialog with aria-label, a polite live month and year heading, a grid named by aria-labelledby, a roving tabindex with aria-selected on the chosen date only, and full day names through `abbr` on abbreviated headers.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, which returned the rows as short quotes. The page links to CodePen for the HTML, which was not read.

Choose Date button:

> The initial value of accessible name is "Choose Date".

> When users select a date, the accessible name is changed to "Change Date, DATE_STRING"

Textbox, with the hint "(date format: mm/dd/yyyy)":

> The description of the date format is associated with the text input via `aria-describedby`, making it available to assistive technologies as an accessible description.

Dialog: role `dialog`, `aria-modal="true"` ("Indicates the dialog is modal."), `aria-label="string"` ("Defines the accessible name for the dialog.").

Month and year `h2`, `aria-live="polite"`:

> When the month and/or year changes the content of the h2 element is updated.
> Indicates the h2 should be automatically announced by screen readers.

Grid (`table`): role `grid`, and `aria-labelledby="ID_REFERENCE"` ("Identifies the element that provides the accessible name for the grid.").

Cells (`td`):

> Makes the cell focusable and includes it in the dialog Tab sequence.
> Makes the cell focusable and excludes it from the dialog Tab sequence.
> Identifies the cell containing the currently selected date, i.e., the date value present in the date input.

(`tabindex="0"`, `tabindex="-1"`, `aria-selected="true"`.) Month and year buttons take an `aria-label` such as "Next Year".

Weekday headers:

> To facilitate compact visual design in the calendar, the day names in the column headers are abbreviated to two characters.

The `abbr` attribute carries the full name. The keyboard help `div` is also `aria-live="polite"`, shown after a delay.

## Why it matters for ORIVILO

A date input's format hint and a trigger that speaks the chosen date are names neither library's page sets out for a composed picker. In Thai the format hint also has to say which year it wants.
