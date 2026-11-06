---
id: K-0404
topic: design
claim: Intl.DateTimeFormat takes its calendar from the `calendar` option or the `ca` locale extension, the option winning when both are set, with `numberingSystem` and `nu` working the same way; the default is locale dependent, ECMA-402 takes the first element of a locale's list as that default, and `buddhist` and `gregory`, `thai` and `latn` are supported values.
source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf; https://tc39.es/ecma402/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. MDN and ECMA-402 agree on the default rule. No MDN page read has a Thai or Buddhist example; the tool found "buddhist" only on `supportedValuesOf`. ECMA-402 was read to character 200,000 of about 570,000, so its DateTimeFormat locale data section (11) was not read.

MDN, the constructor page:

> The calendar to use, such as `"chinese"`, `"gregory"`, `"persian"`, and so on. For a list of supported calendar types, see [`Intl.supportedValuesOf()`]; the default is locale dependent.

> This option can also be set through the `ca` Unicode extension key; if both are provided, this `options` property takes precedence.

`numberingSystem` reads the same way with `nu`. `era` takes `"long"`, `"short"`, `"narrow"`.

MDN, `Intl.DateTimeFormat`: `resolvedOptions()` "Returns a new object with properties reflecting the locale and formatting options computed during initialization of the object." Its sample reads `usedOptions.calendar`.

MDN, `supportedValuesOf`:

> Thai Buddhist calendar, proleptic. Month numbers, month codes, and days are the same as in the ISO 8601 calendar, but the epoch year is different. There is one era.

`gregory`: "Gregorian calendar, proleptic." `thai`: Thai digits `๐๑๒๓๔๕๖๗๘๙`. `latn`: Latin digits.

ECMA-402, section 9.1 and ResolveLocale (9.2.7):

> with the first element providing the default value for that key in the locale.

> Let value be keyLocaleData[0].

## Why it matters for ORIVILO

These are the two ways to fix the year without relying on the runtime: `th-TH-u-ca-buddhist` in the tag, or `{ calendar: "buddhist" }`. `LOCALE_TAGS.th` is `th-TH` today (`packages/design-system/src/i18n/locale.ts`), which fixes neither.
