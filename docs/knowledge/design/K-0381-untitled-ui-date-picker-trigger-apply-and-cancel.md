---
id: K-0381
topic: design
claim: Untitled UI's DatePicker is a secondary Button with a calendar icon opening a popover dialog that stays open on selection, updates the value on every click, and has Cancel and Apply buttons, where Cancel only closes and does not restore the previous value; its strings "Date picker", "Select date", "Cancel" and "Apply" are English literals in the file.
source: "https://raw.githubusercontent.com/untitleduico/react/main/components/application/date-picker/date-picker.tsx; https://www.untitledui.com/react/components/date-pickers.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main`, no commit hash shown. Docs and source agree on the commit model.

```tsx
<AriaDatePicker aria-label="Date picker" shouldCloseOnSelect={false} {...props} value={value} onChange={setValue}>
const formattedDate = value ? formatter.format(value.toDate(getLocalTimeZone())) : "Select date";
```

The formatter is `useDateFormatter` with `month: "short"`, `day: "numeric"`, `year: "numeric"`. The props add `onApply`, `onCancel` and `size` (default `"sm"`) to React Aria's `DatePickerProps`. The dialog is `AriaDialog` with `aria-label="Date picker"`; the popover is `placement="bottom right"` with `offset={8}`. The footer holds Cancel (`color="secondary"`) then Apply (`color="primary"`), each calling its handler and then `close()`. These two `aria-label` values are the only explicit ARIA in the file.

From the page:

> The popover stays open after a day is picked, and `onChange` fires on every click,
> so the value is already updated before the user presses Apply.

> Cancel only closes the popover and calls `onCancel`;
> it does not restore the previous value, so handle that yourself if you need it.

## Why it matters for ORIVILO

The picker's commit model is a behaviour a spec has to name. Here a value changes before Apply, which differs from the APG example's Cancel (K-0400). The literals show what would have to move to the locale catalog.
