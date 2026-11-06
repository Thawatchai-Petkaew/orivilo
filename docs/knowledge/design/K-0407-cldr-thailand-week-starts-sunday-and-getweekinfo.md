---
id: K-0407
topic: design
claim: CLDR 49 gives Thailand and the United States Sunday as the first day and lists no Thai entry in minDays, so the world default of 1 applies by our reading; UTS 35 says firstDay is the day a calendar view shows first; `Intl.Locale.getWeekInfo()` exposes this data with `firstDay` 1 for Monday to 7 for Sunday and MDN marks it Baseline 2026, newly available since July 2026.
source: "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-core/supplemental/weekData.json; https://www.unicode.org/reports/tr35/tr35-dates.html; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getWeekInfo"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. `weekData.json` shows `_cldrVersion` 49. MDN gives no Thai example, so `firstDay: 7` for `th` is our mapping of `sun`, not a quoted output, and it was not run.

```json
"firstDay": { "001": "mon", "GB": "mon", "TH": "sun", "US": "sun" }
"minDays": { "001": "1", "GB": "4" }
```

The JSON above picks these keys out of the larger maps. `weekendStart` and `weekendEnd` have `001` (`sat`, `sun`) and no TH key.

UTS 35:

> The day indicated by `firstDay` is the one that should be shown as the first day of the week in a calendar view.

MDN:

> An integer between 1 (Monday) and 7 (Sunday) indicating the first day of the week for the locale. Commonly 1, 5, 6, or 7.

> An object representing week information associated with the Locale data specified in UTS 35's Week Elements.

> Since July 2026, this feature works across the latest devices and browser versions. This feature might not work in older devices or browsers.

MDN adds that some browser versions shipped this as an accessor property `weekInfo`.

## Why it matters for ORIVILO

Thailand and the United States both start on Sunday in this data, which matches React Aria's default for a region missing from its table (K-0388) and date-fns's Thai locale (K-0408). A week start read from the runtime needs a fallback for older browsers.
