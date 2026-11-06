---
id: K-0405
topic: design
claim: CLDR lists Buddhist then Gregorian for Thailand, UTS 35 says the first is the territory's default and that Buddhist is preferred there, CLDR's Thai Buddhist patterns write the era as พ.ศ. in the full date and the year-only form but not in the long, medium or short dates, and Thai numbers default to Latin digits with Thai digits as native.
source: "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-core/supplemental/calendarPreferenceData.json; https://www.unicode.org/reports/tr35/tr35-dates.html; https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-cal-buddhist-full/main/th/ca-buddhist.json; https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-numbers-full/main/th/numbers.json"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, from `main` of `cldr-json`. `calendarPreferenceData.json` shows `_cldrVersion` 49 and `_unicodeVersion` 16.0.0. CLDR's name `gregorian` is `gregory` in a locale tag (K-0404).

```json
"TH": ["buddhist", "gregorian"]
"001": ["gregorian"]
```

UTS 35, Calendar Preference Data:

> The first calendar type in the list is the default calendar type for the territory.

> For Thailand, the Buddhist and Gregorian calendars are both used, and Buddhist is preferred (the default).

`th/ca-buddhist.json`:

```json
"eraNames": { "0": "พุทธศักราช" }, "eraAbbr": { "0": "พ.ศ." }, "eraNarrow": { "0": "พ.ศ." }
"full": "EEEEที่ d MMMM G y", "long": "d MMMM y", "medium": "d MMM y", "short": "d/M/yy"
"y": "G y", "GyMMMd": "d MMM G y", "yyyyMd": "d/M/y"
```

The block above joins values the file holds on separate lines. `dateFormats` holds the second line; `availableFormats` the third. `yMd`, `yMMMd` and `yMMMM` are not keys under `availableFormats` in this file.

`th/numbers.json`:

```json
"defaultNumberingSystem": "latn", "otherNumberingSystems": { "native": "thai" }
```

Weekday abbreviations in the Buddhist file's format set: อาทิตย์, จันทร์, อังคาร, พุธ, พฤหัส, ศุกร์, เสาร์. Those are longer than date-fns's อา., จ. (K-0408).

## Why it matters for ORIVILO

This is the data behind a Thai default, and the pattern list shows that a year on its own carries the era word while a medium date does not. Whether either route reaches these exact strings needs a run (K-0406).
