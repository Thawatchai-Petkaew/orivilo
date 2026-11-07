---
id: K-0408
topic: design
claim: date-fns 4.1.0's Thai locale starts the week on Sunday with `firstWeekContainsDate` 1, formats long dates as "do MMMM y" and short dates as "dd/MM/yyyy", and has no 543 offset or Buddhist era in its localize file, whose era labels are ค.ศ. and คริสต์ศักราช, so `format(date, "PPP")` with this locale alone shows a Gregorian year by our reading.
source: "https://cdn.jsdelivr.net/npm/date-fns@4.1.0/locale/th.js; https://cdn.jsdelivr.net/npm/date-fns@4.1.0/locale/th/_lib/formatLong.js; https://cdn.jsdelivr.net/npm/date-fns@4.1.0/locale/th/_lib/localize.js"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, from the published 4.1.0 package on jsDelivr (the `main` paths tried returned 404; the repository root is now `@date-fns/root`). Version 4.4.0 is latest on npm (K-0394) and its Thai files were not read. `format` itself was not read and nothing was run, so the last clause of the claim is a reading of these three files.

`locale/th.js`:

```js
  options: {
    weekStartsOn: 0 /* Sunday */,
    firstWeekContainsDate: 1,
  },
```

`locale/th/_lib/formatLong.js`:

```js
  full: "วันEEEEที่ do MMMM y",
  long: "do MMMM y",
  medium: "d MMM y",
  short: "dd/MM/yyyy",
```

`locale/th/_lib/localize.js`:

```js
  narrow: ["B", "คศ"],
  abbreviated: ["BC", "ค.ศ."],
  wide: ["ปีก่อนคริสตกาล", "คริสต์ศักราช"],
```

The same file's `short` and `abbreviated` days are `อา.`, `จ.`, `อ.`, `พ.`, `พฤ.`, `ศ.`, `ส.`. The tool found no 543 and no พ.ศ. in the file.

## Why it matters for ORIVILO

shadcn's sample writes `format(date, "PPP")` (K-0391), so passing a Thai locale alone would change the words and not the year. That is why K-0398's build swaps `format` rather than the locale, and it means a formatted date and a calendar heading can disagree on the year if only one is converted.
