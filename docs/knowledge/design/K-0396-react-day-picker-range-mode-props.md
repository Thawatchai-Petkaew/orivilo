---
id: K-0396
topic: design
claim: React DayPicker's range mode counts `min` and `max` in nights, allows a 0-night range by default, includes disabled dates in a range unless `excludeDisabled` is set, makes a selection required with `required`, and with `resetOnSelect` starts a new range after a completed one.
source: "https://daypicker.dev/selections/range-mode"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, at the 10.0.2 version selector.

| Prop              | Page says                                    |
| ----------------- | -------------------------------------------- |
| `selected`        | "The selected range."                        |
| `onSelect`        | "Event callback when a date is selected."    |
| `required`        | "Make the selection required."               |
| `resetOnSelect`   | "Start a new range after a completed one."   |
| `min`             | "The minimum number of nights in the range." |
| `max`             | "The maximum number of nights in the range." |
| `excludeDisabled` | "Exclude disabled dates from the range."     |

> By default, a range can have a length of 0 nights, meaning the start date can be the same as the end date.

> The range will remain "open" until at least the `min` number of nights are selected.

> In `range` mode, disabled dates are included in the selected range by default.

> If a disabled date is selected, the range will reset.

The last line applies with `excludeDisabled`.

> By default, once a range is complete, clicking another day updates the current `from` or `to`.

The range shape is `from` and `to` (also K-0392); Untitled's is `start` and `end` (K-0382).

## Why it matters for ORIVILO

Audit D.3 row 28's done mark is that the range story passes. These are the range rules that story would prove, including what a one-day filter looks like.
