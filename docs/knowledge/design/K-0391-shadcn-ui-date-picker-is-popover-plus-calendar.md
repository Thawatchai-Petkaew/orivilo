---
id: K-0391
topic: design
claim: shadcn/ui has no DatePicker root component, its Date Picker page composes `Popover` and `Calendar`, and the basic example is an outline Button showing `format(date, "PPP")` from date-fns or the placeholder "Pick a date", with `data-empty` for the empty look, `align="start"` and no accessibility section on the page.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/radix/date-picker.mdx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/date-picker-demo.tsx; https://ui.shadcn.com/docs/components/radix/date-picker"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Source read on `main`, no commit hash shown.

> The Date Picker is built using a composition of the `<Popover />` and the `<Calendar />` components.

> A date picker is built from `Popover` and `Calendar` (there is no `DatePicker` root component):

> A date picker component with range and presets.

Headings in order: Installation, Usage, Composition, Basic, Range Picker, Date of Birth, Input, Time Picker, Natural Language Picker, RTL.

From `date-picker-demo.tsx`:

```tsx
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
data-empty={!date}
```

The trigger is `variant="outline"` with `data-[empty=true]:text-muted-foreground`. `PopoverContent` has `className="w-auto p-0"` and `align="start"`. `Calendar` takes `mode="single"`, `selected={date}`, `onSelect={setDate}`, `defaultMonth={date}`. The `Popover` here has no `open` or `onOpenChange`, and `onSelect` only sets the date, so the lines read show no close on selection.

The rendered page has no accessibility section. Its focus and keyboard behaviour rests on Popover (K-0130) and DayPicker (K-0397).

## Why it matters for ORIVILO

We already ship Popover (`packages/design-system/catalog/base/popover.yaml`, whose `useWhen` names a picker), so this composition needs only a Calendar beneath it.
