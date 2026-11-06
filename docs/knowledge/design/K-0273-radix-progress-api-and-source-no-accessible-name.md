---
id: K-0273
topic: design
claim: Radix Progress takes value (number or null), max and getValueLabel, sets role progressbar with aria-valuetext from a rounded percent, treats a null value as indeterminate with no aria-valuenow, reports data-state complete, indeterminate or loading, and sets no accessible name itself.
source: "https://www.radix-ui.com/primitives/docs/components/progress; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/progress/src/progress.tsx; packages/design-system/src/components/progress/Progress.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the source file is read on `main`, not pinned to a commit.

> Adheres to the `progressbar` role requirements

```tsx
return value == null ? 'indeterminate' : value === maxValue ? 'complete' : 'loading';
```

```tsx
const max = isValidMaxNumber(maxProp) ? maxProp : DEFAULT_MAX;
```

- Root: `role="progressbar"`, `aria-valuemin={0}` fixed, `aria-valuemax` from `max`; `aria-valuenow` and `aria-valuetext` only when the value is a number.
- Default `getValueLabel`: `Math.round((value / max) * 100)` followed by `%`.
- `max` falls back to 100 when it is not a number above 0. Non-numeric, NaN, negative or over-`max` values log a console error and become `null`.
- Root also sets `data-value` and `data-max`; `Indicator` recomputes the same state.
- Name: Root sets no `aria-label` or `aria-labelledby`; the caller's props are spread after the ARIA attributes, so the caller supplies it.
- There is no failed value: the three `data-state` values have no error state (own reading).

## Why it matters for ORIVILO

ORIVILO's `Progress` is built on this primitive, so a failed upload row cannot read its state from Radix; the repo's `status` prop carries it (K-0288).
