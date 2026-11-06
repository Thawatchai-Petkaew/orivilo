---
id: K-0384
topic: design
claim: Untitled UI's calendar cell maps React Aria render props to selected, range start, middle and end, today, highlighted, disabled, outside month, focus-visible and hover looks, using a solid brand fill for a selected day, a brand dot for today and highlights, and `opacity-50` for days outside the month, with no `aria-*` attribute of its own.
source: "https://raw.githubusercontent.com/untitleduico/react/main/components/application/date-picker/cell.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main`, no commit hash shown.

```tsx
const markedAsSelected = isSelectionStart || isSelectionEnd || (isSelected && !isDisabled && !isRangeCalendar);
"bg-brand-solid font-medium text-white hover:bg-brand-solid_hover hover:text-white"
isSelected && isRangeCalendar && "bg-secondary",
!isSelected && isTodayDate ? "bg-secondary font-medium hover:bg-secondary_hover" : "",
isOutsideMonth && "opacity-50"
isRangeCalendar && isOutsideMonth && !showOutOfRangeDates && "hidden",
```

States and looks in the file:

- Selected: `bg-brand-solid`, white text, `font-medium`
- Range ends: solid selected style, outer side `rounded-l-full` or `rounded-r-full`
- Range middle: `bg-secondary`, `font-medium` when enabled; month-edge gradients on `after:`
- Today: `bg-secondary`, `font-medium` when not selected, plus the dot
- Highlighted: the same dot as today, `bg-fg-white` on a selected cell, `bg-fg-brand-primary` otherwise
- Disabled: `pointer-events-none`, `text-secondary/50`, dot `opacity-50`; `bg-secondary` when inside a range
- Outside: `opacity-50`; hidden in a range calendar unless `showOutOfRangeDates`
- Focus: cell `z-10`; inner day `outline-2 outline-offset-2 outline-focus-ring`
- Hover: `hover:bg-primary_hover hover:font-medium!`

The file sets no `aria-*` attribute. Selection, disabled and focus semantics come through React Aria (K-0387).

## Why it matters for ORIVILO

This is the fullest state list read for a day cell. DESIGN.md section 8 keeps selected and brand apart, so the state names carry over more readily than the colours do.
