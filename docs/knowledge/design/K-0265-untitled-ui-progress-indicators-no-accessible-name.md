---
id: K-0265
topic: design
claim: Untitled UI's progress indicators render role progressbar with aria-valuenow, aria-valuemin and aria-valuemax but give the bar no accessible name, and the page tells the reader to add aria-label or aria-labelledby in their copy of the file.
source: "https://www.untitledui.com/react/components/progress-indicators; https://raw.githubusercontent.com/untitleduico/react/main/components/base/progress-indicators/progress-indicators.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/application/file-upload/file-upload-base.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; source files are read on `main`, not pinned to a commit.

> Each one renders an element with `role="progressbar"` and `aria-valuenow`, `aria-valuemin` and `aria-valuemax`.

> The components don't accept extra props, so if you need an accessible name, add `aria-label` or `aria-labelledby` to that element in your copy of the file.

- Page, `ProgressBar`: `labelPosition` `"right"`, `"bottom"`, `"top-floating"`, `"bottom-floating"`, or left out for no text; `valueFormatter`; `min` and `max` default to 0 and 100 and the value is not clamped.
- Page, other forms: `ProgressBarCircle` and `ProgressBarHalfCircle` with `size` `"xxs"` to `"lg"` and an optional `label`.
- Source, `ProgressBarBase`: `role`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`; no `aria-label`, no `aria-labelledby`, no label prop. The visible value text is not linked to the bar.
- Source, upload fill item: `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}`; the fetch names no other ARIA in `file-upload-base.tsx`.

## Why it matters for ORIVILO

The upload list's bar item uses this `ProgressBar` (K-0261). WAI-ARIA requires a name on progressbar (K-0283), so this is a known gap in the benchmark, stated by the vendor.
