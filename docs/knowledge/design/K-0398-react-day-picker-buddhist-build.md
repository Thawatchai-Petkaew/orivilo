---
id: K-0398
topic: design
claim: React DayPicker 10.0.2 shows a Buddhist Era year through the separate MIT package `@daypicker/buddhist`, which keeps Gregorian months and weeks, adds 543 to the displayed year only for a listed set of format strings, defaults to locale th, ltr and Thai digits, and takes `enUS` with `numerals="latn"`; the `react-day-picker/buddhist` import belongs to the 9.14.0 docs.
source: "https://daypicker.dev/localization/buddhist; https://daypicker.dev/v9/localization/buddhist; https://raw.githubusercontent.com/gpbl/react-day-picker/main/packages/buddhist/src/buddhist/index.tsx; https://raw.githubusercontent.com/gpbl/react-day-picker/main/packages/buddhist/src/buddhist/lib/format.ts; https://raw.githubusercontent.com/gpbl/react-day-picker/main/packages/buddhist/package.json; https://registry.npmjs.org/@daypicker/buddhist/latest"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Docs at the 10.0.2 selector and at v9; source on `main`, no commit hash shown. Package: `@daypicker/buddhist` 10.0.2, MIT, depends on `@daypicker/react` 10.0.2 and `date-fns` ^4.1.0, peer `react` `>=16.8.0`; the repository and npm agree.

Install and import (10.0.2 docs):

```bash
npm install @daypicker/react @daypicker/buddhist
```

```tsx
import { DayPicker } from "@daypicker/buddhist";
import { DayPicker, enUS } from "@daypicker/buddhist";
<DayPicker locale={enUS} numerals="latn" />;
```

The v9 page imports from `react-day-picker/buddhist` and carries the notice "This is documentation for React DayPicker 9.14.0, which is no longer actively maintained."

From `index.tsx`:

```tsx
 * Months/weeks are Gregorian; displayed year is Buddhist Era (BE = CE + 543).
 * Thai digits are used by default.
 * - `locale`: `th`
 * - `dir`: `ltr`
 * - `numerals`: `thai`
```

From `lib/format.ts`:

```ts
const beYear = date.getFullYear() + 543;
return raw.replace(/(.*)(\d{4})(?!.*\d)/, (_m, pre) => `${pre}${beYear}`);
return dfFormat(date, formatStr, options);
```

The switch cases are `"LLLL y"`, `"LLLL yyyy"`, `"LLLL"`, `"yyyy"`, `"y"`, `"yyyy-MM"`, `"yyyy-MM-dd"`, `"PPP"`, `"PPPP"`. Any other string goes to date-fns unchanged, so by our reading it keeps the Gregorian year. No era word such as พ.ศ. is added in the lines read.

The docs state no default for locale or `dir`; those two come from the file's comment and code. The build swaps `format` through `DateLib`, so the selected value is still a JavaScript `Date` by our reading.

## Why it matters for ORIVILO

This is the library's own route to the Thai year audit D.3 row 28 leaves to the owner. Its default Thai digits differ from CLDR's default for Thai (K-0405), and a format string outside the list shows a Gregorian year beside a Buddhist one.
