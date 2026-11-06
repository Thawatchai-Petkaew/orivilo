---
id: K-0393
topic: design
claim: shadcn/ui is MIT, its calendar registry item installs `react-day-picker@latest` and `date-fns` while its own site declares `react-day-picker` ^9.7.0, and its Persian instruction names `react-day-picker/persian`, a path the DayPicker v10 upgrade page lists as a removed import and the 10.0.2 exports map does not hold.
source: "https://ui.shadcn.com/r/styles/new-york-v4/calendar.json; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/package.json; https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/radix/calendar.mdx; https://daypicker.dev/upgrading; https://registry.npmjs.org/react-day-picker/latest"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool.

Registry item `calendar` (`calendar.json`): type `registry:ui`, `dependencies` `cn`, `react-day-picker@latest`, `date-fns`; `registryDependencies` `button`.

`apps/v4/package.json`: `react-day-picker` ^9.7.0, `date-fns` ^4.1.0, `chrono-node` ^2.8.2, `react-aria-components` 1.20.0, `@base-ui/react` 1.6.0, `radix-ui` ^1.4.3.

License file:

> MIT License

> Copyright (c) 2023 shadcn

The Calendar page, Persian section:

```diff
- import { DayPicker } from "react-day-picker"
+ import { DayPicker } from "react-day-picker/persian"
```

The DayPicker upgrade page:

> Non-Gregorian calendars moved to separate add-on packages.

> The `react-day-picker` package name remains available in v10 for compatibility, so existing imports can still work.

Its calendar tables map `react-day-picker/persian` to `@daypicker/persian` and `react-day-picker/buddhist` to `@daypicker/buddhist`, each labelled "Removed import", as they do the ethiopic, hebrew and hijri paths. The npm record for `react-day-picker` 10.0.2 has neither `./persian` nor `./buddhist` in `exports`.

Own reading: the registry's `@latest` resolved to 10.0.2 on this date, while the docs' subpath and the site's ^9.7.0 belong to v9, so a fresh install and the Persian instruction do not match. No install was run here.

## Why it matters for ORIVILO

A Thai year on this route is not a `react-day-picker/buddhist` import under v10. The Buddhist route needs the add-on (K-0398), and a spec has to pin one major version.
