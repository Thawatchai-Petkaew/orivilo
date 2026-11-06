---
id: K-0387
topic: design
claim: React Aria, which supplies Untitled UI's accessibility, gives the calendar role application, each grid role grid, each cell role gridcell with aria-selected, aria-disabled, aria-invalid and a roving tabIndex, names cells with today and selected strings, announces the visible range and the selection, and in a month view sends Home and End to the first and last day of the focused month, not the week.
source: "https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/calendar/useCalendarGrid.ts; https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/calendar/useCalendarCell.ts; https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/calendar/useCalendarBase.ts; https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-stately/src/calendar/useCalendarState.ts"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main`, no commit hash shown. The docs pages for Calendar and DatePicker have no keyboard section, so this is from source only. The arrow-key handler bodies and the Thai string file were not read (`packages/react-aria/intl/calendar/th-TH.json` returned 404).

In the two code blocks that carry them, the `//` notes are ours and not in the source.

Keys, from `useCalendarGrid.ts`:

```ts
state.selectFocusedDate(); // Enter and ' '
state.focusPreviousSection(); // PageUp; state.focusPreviousSection(true) on Shift+PageUp
state.focusNextSection(); // PageDown; state.focusNextSection(true) on Shift+PageDown
state.focusSectionEnd(); // End
state.focusSectionStart(); // Home
state.setAnchorDate(null); // Escape, when 'setAnchorDate' in state; then returns false
```

From `useCalendarState.ts`, in a month view:

```ts
focusCell(startOfMonth(focusedDate));
focusCell(endOfMonth(focusedDate));
focusCell(focusedDate.add({ years: 1 }));
```

Roles and states:

```ts
role: 'application',                  // useCalendarBase.ts, calendarProps
role: 'grid',                         // useCalendarGrid.ts, gridProps
'aria-label': [ariaLabel, visibleRangeDescription].filter(Boolean).join(', '),
role: 'gridcell',                     // useCalendarCell.ts
'aria-selected': isSelected || undefined,
'aria-disabled': !isSelectable || undefined,
```

Also `'aria-invalid': isInvalid || undefined` and `tabIndex = isSameDay(date, state.focusedDate) ? 0 : -1`. The grid header is `'aria-hidden': true`, and weekday text defaults to `weekdayStyle` `'narrow'`.

The cell label uses the string keys `todayDateSelected`, `todayDate`, `dateSelected`, `minimumDate`, `maximumDate`, plus `startRangeSelectionPrompt` and `finishRangeSelectionPrompt`; unavailable is not in the label. Buttons take `stringFormatter.format('next')` and `('previous')`. `announce(selectedDateDescription, 'polite', 4000)` runs on a selection, and `announce(visibleRangeDescription)` when focus is not in the calendar.

## Why it matters for ORIVILO

This is what an Untitled-style build inherits rather than writes, and where it departs from the APG example's week-based Home and End (K-0400).
