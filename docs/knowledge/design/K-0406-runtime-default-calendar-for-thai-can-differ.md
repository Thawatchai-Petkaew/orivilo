---
id: K-0406
topic: design
claim: ICU output quoted in a W3C i18n thread shows th-u-ca-buddhist as 29 ก.ย. 2563 and th-u-ca-gregory as 29 ก.ย. 2020 for one date, but a 2015 Android ICU patch forced Thai to Gregorian and one project reports Android showing 2026 in Thai, so an explicit calendar is the form the sources show working, and no source read shows plain th-TH output from a run.
source: "https://lists.w3.org/Archives/Public/public-i18n-archive/2020JulSep/0611.html; https://android.googlesource.com/platform/external/icu/+/a8645fb%5E%21/; https://github.com/BurrowSoft/solvymed/pull/105"
retrieved: 2026-11-06
confidence: 0.7
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.7: the output lines are from one 2020 message, the patch is from 2015 and its presence on a current device was not checked, and the Android report is one third-party project's. Nothing was run in this task, which has no shell.

W3C i18n archive, Addison Phillips, 29 Sep 2020 (a GitHub comment mirrored to the list):

```text
th-u-ca-gregory: 29 ก.ย. 2020
th-u-ca-buddhist: 29 ก.ย. 2563
```

> The outputs shown here are from ICU/CLDR.

> The Thai Buddhist calendar is basically a Gregorian calendar with the year changed.

The message has no plain `th` or `th-TH` line.

Android ICU, commit `a8645fbd329986f9ccfead0d16f179743f33a803`, committed 2 Oct 2015:

> Android patch: CLDR data: Force default Gregorian calendar.

In `icu4c/source/data/locales/th.txt` it replaces `default{"buddhist"}` with `default{"gregorian"} // android-changed`, and the test `{ "th_TH", UCAL_DEFAULT, "buddhist" }` with `"gregorian"`.

Project-reported, BurrowSoft solvymed PR #105, merged 28 Sep 2026:

> Android showed 2026 in Thai because Intl's default calendar for `th` isn't Buddhist everywhere.

Its fix maps `th` to `th-TH-u-ca-buddhist`, and its test expectation compares `th-TH-u-ca-gregory` (2026) with that helper (2569). That figure is a project's test expectation, and the PR gives no Android version. 2026 plus 543 is 2569 (own arithmetic, matching K-0398).

### Open points

- Plain `th-TH` under a given engine. ECMA-402 and CLDR together point to Buddhist (K-0404, K-0405), but the sources here show no output and show one platform that differs.
- Which browsers and Android versions ORIVILO meets differ in this way. Whether Chrome on Android uses the platform's ICU was not read.

## Why it matters for ORIVILO

Anything that formats with a bare `th-TH` may show a different year on different devices. A check run on our Node and browser targets would settle this; a spec can also name the calendar so the question does not arise.
