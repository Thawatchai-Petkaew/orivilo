---
id: K-0394
topic: design
claim: React DayPicker reads version 10.0.2 and MIT on its own repository and on npm, depends on `date-fns` ^4.1.0 and `@date-fns/tz` ^1.4.1 with React as a peer from 16.8.0; `@daypicker/react` 10.0.2 is MIT and depends on it; `radix-ui` 1.8.1 lists no calendar or date package, and our lockfile holds none of these.
source: "https://raw.githubusercontent.com/gpbl/react-day-picker/main/packages/react-day-picker/package.json; https://registry.npmjs.org/react-day-picker/latest; https://registry.npmjs.org/@daypicker/react/latest; https://registry.npmjs.org/@date-fns/tz/latest; https://cdn.jsdelivr.net/npm/date-fns@4.1.0/package.json; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/radix-ui/package.json; pnpm-lock.yaml; packages/design-system/package.json"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. The repository's `package.json` and the npm record agree on name, version, license and dependencies.

- `react-day-picker` 10.0.2, MIT, depends on `date-fns` ^4.1.0 and `@date-fns/tz` ^1.4.1 (own repository and npm `latest`)
- `@daypicker/react` 10.0.2, MIT, depends on `react-day-picker` 10.0.2 (npm `latest`)
- `@date-fns/tz` 1.5.0, MIT, no dependencies listed (npm `latest`)
- `date-fns` 4.1.0, MIT, dependencies not read because the file was cut off before them (jsDelivr `package.json`)

Peers of `react-day-picker`: `react` `>=16.8.0`, `@types/react` `>=16.8.0` (optional). Our design system is on `react` 19.3.0 (`packages/design-system/package.json`).

`date-fns` latest on npm reads 4.4.0, taken from the tarball URL; the license of that version was cut off and not read, so 4.1.0 is the one with a license read here.

`radix-ui` 1.8.1 (`packages/react/radix-ui/package.json` on `main`, the version our design system pins): a read of its dependency list found no calendar, date or time package.

Repo: a search of `pnpm-lock.yaml` for `date-fns|day-picker|internationalized/date|react-aria` found 0 matches on 2026-11-06 in the `orv-231` worktree.

## Why it matters for ORIVILO

Our behaviour layer has no calendar primitive, so either route adds a new runtime dependency. This records the DayPicker route's name, version and license for the spec's cost line; K-0386 records the React Aria route's.
