---
id: K-0402
topic: design
claim: The APG Grid pattern says a grid has one element in the tab sequence and author-written focus movement, arrows stop at the edges, Home and End go to the first and last cell of the row, Control with Home or End goes to the grid's corners, Page keys move an author-determined number of rows, the selected cell has aria-selected true, and the page never mentions calendars, aria-disabled or aria-multiselectable.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/grid/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, which returned short quotes. The word checks at the end are the tool's reading of the page, not a local search, so they rate as a soft absence.

> Moves focus one cell to the right. If focus is on the right-most cell in the row, focus does not move.

> Moves focus one cell down. If focus is on the bottom cell in the column, focus does not move.

Home: "moves focus to the first cell in the row that contains focus." End: "moves focus to the last cell in the row that contains focus." Control + Home: "moves focus to the first cell in the first row." Control + End: "moves focus to the last cell in the last row." Page Down: "Moves focus down an author-determined number of rows, typically scrolling so the bottom row..." (cut by the tool).

Tab sequence:

> Only one of the focusable elements contained by the grid is included in the page tab sequence

Roles: "The grid container has role grid."; each row has role `row`; `gridcell` is for cells without header information, `columnheader` or `rowheader` for header cells.

> If the grid supports selection, when a cell or row is selected, the selected element has aria-selected set `true`.

> If there is an element in the user interface that serves as a label for the grid, aria-labelledby is set...

Without a visible label, the name is specified "using aria-label". `aria-readonly` may mark a cell or grid where editing is disabled. The tool found no mention of date pickers, calendars, `aria-disabled` or `aria-multiselectable` on this page.

## Why it matters for ORIVILO

The date grid is an application of this pattern with its own keys. Page keys differ (rows here, months in K-0400), and the date example has no Control + Home row in the rows read, so the example governs a calendar's keys and this page governs its roles.
