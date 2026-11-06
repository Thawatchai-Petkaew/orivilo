# ADR 0020: React DayPicker as the behaviour layer of Calendar, our own visual layer

- Status: accepted, 2026-11-06, on spec ORV-231 v1.0. The decision is the owner's; what confirms it has not run yet (see the Confirmation line).
- Date: 2026-11-06
- Decided by: the owner chose React DayPicker, with a new runtime dependency, a new ADR and a security review (ORV-231 comment 10548), on open question 1 of `docs/specs/ORV-231/spec.md`. The `architect` role wrote this ADR (task `ORV-231-adr-1`).
- Builds on: ADR 0003 decisions 1 and 5, ADR 0004 decisions 1 and 7, ADR 0015 decision 2. None is superseded.
- Adds: one named exception to the sentence "Behavior comes from the `radix-ui` package" in `.claude/rules/design-system.md`.

## Context

ORV-231 gives the design system `Calendar` and `DatePicker` (audit D.3 row 28). Every behaviour base in the package today is `radix-ui`, and the rules take behaviour from it. `radix-ui` cannot supply a calendar: version 1.8.1, the one we pin, lists no calendar, date or time package (K-0394). A month grid, roving focus, Page key arithmetic and range selection have to come from somewhere else, so the question is where.

## Facts and how they were checked

| Fact                                                                                                                                                                                       | Entry                | State                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ----------------------------------------------------- |
| `radix-ui` 1.8.1 lists no calendar, date or time package                                                                                                                                   | K-0394 (0.8)         | Fact (its `package.json` on `main`)                   |
| `react-day-picker` 10.0.2 is MIT, depends on `date-fns` ^4.1.0 and `@date-fns/tz` ^1.4.1, and takes React as a peer from 16.8.0; we are on React 19.3.0                                    | K-0394 (0.8)         | Fact (its repository and npm agree)                   |
| `@date-fns/tz` 1.5.0 is MIT with no dependencies listed                                                                                                                                    | K-0394 (0.8)         | Fact (npm `latest`)                                   |
| `date-fns` 4.1.0 is MIT; npm's latest reads 4.4.0                                                                                                                                          | K-0394 (0.8)         | **Part read.** See the next row                       |
| The dependencies of `date-fns` 4.1.0 and the license of 4.4.0                                                                                                                              | K-0394               | **Not read.** Both files were cut off                 |
| shadcn's Calendar is built on React DayPicker, on the page for its Radix base                                                                                                              | K-0389 (0.8)         | Fact (its docs)                                       |
| DayPicker's source sets the grid, gridcell days with `aria-selected`, a roving tabindex and a polite caption, and maps arrows, Page keys, Home and End; Home and End run by week           | K-0397 (0.8)         | Fact (read on `main` at 10.0.2, no commit hash shown) |
| DayPicker's key map has no Escape, and it has no dialog: those come from the wrapper                                                                                                       | K-0397 (0.8), K-0130 | Fact and our reading                                  |
| DayPicker's props cover single and range modes, `components` overrides, `formatters` and month bounds                                                                                      | K-0395 (0.8)         | Fact (its source)                                     |
| shadcn's site declares `react-day-picker` ^9.7.0 while the registry's `@latest` gives 10.0.2, and v10 moved the non-Gregorian calendars to add-on packages                                 | K-0393 (0.8)         | Fact (site, registry, upgrade page)                   |
| Untitled UI's date pickers are built on React Aria; `react-aria-components` and `@internationalized/date` read Apache-2.0                                                                  | K-0380, K-0386 (0.8) | Fact                                                  |
| React Aria's Home and End run by month in a month view, and it has the fullest calendar system support read                                                                                | K-0387, K-0388 (0.8) | Fact (source and docs)                                |
| The install scripts of the three packages, what they reach at run time, the versions our lockfile will resolve and the size they add to a route's first load                               | none                 | **Not read.** No install was run                      |
| The engine's real DOM. The design proof was mock markup, and the slot names and cell attributes in `docs/specs/ORV-231/design.md` stay an assumption until the builder reads pinned 10.0.2 | `design.md`          | **Not run**                                           |

## Options

From the spec's open question 1.

|                       | A. Hand-built                                                                    | B. React DayPicker                                                       | C. React Aria                                                                        |
| --------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| New runtime packages  | None                                                                             | One direct, two behind it (K-0394)                                       | A larger tree (K-0386)                                                               |
| Security review       | None                                                                             | On the first PR (ADR 0015 decision 2)                                    | On the first PR (ADR 0015 decision 2)                                                |
| Grid, focus and keys  | Ours to write and prove, the work K-0397 shows the library doing                 | From the library, matching the APG example (K-0397, K-0400)              | From the library, with Home and End by month against the APG's week (K-0387, K-0400) |
| Fit with the rules    | Fits the sentence about `radix-ui`, against the reasoning of ADR 0004 decision 7 | Needs this exception; it is the engine of shadcn's Radix preset (K-0389) | ADR 0003 decision 5 and handoff section 7 forbid it as a second base                 |
| Non-Gregorian display | Ours                                                                             | Ours, through `formatDate` (`date-year-1`)                               | The fullest calendar system support read (K-0388)                                    |

## Decision

### 1. `react-day-picker` provides Calendar's behaviour only

`Calendar` wraps `DayPicker` for the month grid, roving focus, the key map, selection and range selection. Every visual value comes from our recipe, as in ADR 0003 decision 1 and ADR 0004 decision 1: no library stylesheet is loaded, and `classNames` maps the engine's slots to `ds-calendar__*`. Every word comes from us, through `formatters` and `labels`. The rule that holds these is `cal-engine-1` in the spec, which this ADR does not restate.

### 2. It is pinned exactly at 10.0.2

`packages/design-system/package.json` lists `"react-day-picker": "10.0.2"`, with no range, in `dependencies`. The pin is exact because shadcn's site (^9.7.0) and the registry's `@latest` differ and the two majors differ in their exports (K-0393). A version change is its own PR that reruns the spec's Calendar rows.

### 3. The exception is one component wide

The exception names `Calendar` and nothing else.

- Only `Calendar` imports `react-day-picker`. `DatePicker` composes our `Calendar` and never imports the engine.
- `Calendar`'s public props use our own date types (`date-value-1`). No engine type, and no `Date`, reaches a caller, so the engine can be replaced without a change to the public API.
- Everything else stays on `radix-ui`. The panel, its focus return and Escape come from our `Popover` (K-0397, K-0130, `dp-open-1`).
- Any other component that wants a behaviour base outside `radix-ui` needs its own ADR.

### 4. `date-fns` and `@date-fns/tz` stay behind the engine

They arrive only as dependencies of `react-day-picker` (K-0394). Our code imports nothing from either. `@daypicker/buddhist` is not added: a Thai year is ours to show through `formatDate` (`date-year-1`). Their exact pin is the lockfile's, since the engine asks for caret ranges (K-0394).

### 5. `security` reviews the first PR

The PR that adds the dependency meets ADR 0015 decision 2 ("the diff adds a runtime dependency"), so `security` is dispatched beside `reviewer` in round 0. It reads all three packages at the versions the lockfile resolved, and not only the versions K-0394 read: the license, the dependencies, the install scripts and what each reaches at run time. The caret range on `date-fns` may resolve to a version whose license K-0394 did not read, and that version's license and the dependencies of `date-fns` have to be read before the PR merges. A package that fails this read comes back to the owner; it is not swapped for another engine in the PR.

### 6. Why this is not a mixed base

Handoff section 7 says to check which base the shadcn preset uses, to match its API, and never to mix APIs from different bases. ADR 0003 decision 5 refused Untitled UI on that ground. This decision keeps the rule for three reasons:

- `radix-ui` has no calendar (K-0394), so DayPicker replaces nothing `radix-ui` supplies.
- It is the engine under shadcn's own Calendar for the Radix base (K-0389), so the preset pairs the two. React Aria is not, and it is the base ADR 0003 decision 5 names.
- The two APIs never meet inside one component. `DatePicker` places our `Calendar` inside our `Popover`, and each keeps its own behaviour.

It is still a second behaviour source in the package, which is why it is written down as a named exception and not read into ADR 0003.

### 7. When the engine cannot do what the spec asks

`cal-engine-1` sends the builder back as `blocked` if a formatter cannot reach the heading or a day's name, and never lets a year be replaced inside a string. A `blocked` there, or any other point where pinned 10.0.2 breaks a spec rule, returns to the `architect` and the owner. This ADR holds no fallback engine.

## Consequences

- **Three new packages in the runtime tree of `packages/design-system`,** which `apps/web` depends on. No screen uses `Calendar` when this story ends. The size they will add to a route's first load has not been measured, and ADR 0015 decision 5 has no budget number yet to hold it against.
- **Part of the tree is pinned only by the lockfile.** `date-fns` and `@date-fns/tz` move inside their caret ranges when the lockfile is regenerated.
- **We inherit the engine's keys and roles.** K-0397 read them from source and the docs say more may be needed for a given design, so the spec's rows prove them on our build and not on the library's word. No screen reader test has run (spec, "Out of scope").
- **A sibling of `Calendar` costs an ADR.** A time picker or a Date time picker on another engine does not ride on this exception.
- **Upgrades stay mechanical while the split stays strict.** A move off 10.0.2 rereads K-0395 and K-0397 against the new source and reruns the rows. Row 3 of the spec fails if a later version brings a default English word we do not replace.

## Not chosen

- **A. Hand-built.** No dependency and no review, but we would write and prove the grid, roving focus, Page key arithmetic and range ourselves, the work K-0397 shows the library doing. ADR 0004 decision 7 turned down writing our own canvas for the same reason: no product value in redoing behaviour.
- **C. React Aria.** The fullest calendar system support read (K-0388) and Apache-2.0 on the packages read (K-0386), but ADR 0003 decision 5 and handoff section 7 forbid a second base, it brings a larger tree (K-0386), and its Home and End run by month against the APG example (K-0387, K-0400).
- **DayPicker at ^9.7.0, as shadcn's site declares.** The registry already installs v10, and the two majors differ (K-0393).
- **`@daypicker/buddhist`.** It adds 543 only for a listed set of format strings and defaults to Thai digits (K-0398), while `date-year-1` keeps the year in one place of ours.

## What this changes in earlier docs

- **`.claude/rules/design-system.md`.** The sentence "Behavior comes from the `radix-ui` package" gains this exception.
- **ADR 0003 and ADR 0004.** Not edited. Their behaviour and visual split is what this ADR applies.
- **The rule that a shared component "is built on a shadcn primitive"** in `.claude/rules/design-system.md` is not changed here. Its wording waits for the owner.
- **`docs/specs/ORV-64/audit.md`, the Date picker row of section A.1.** Range moves into ORV-231 and presets stay a second story, so the row now agrees with the audit's own D.3 row 28. This follows the default of the spec's open question 11 and is not part of the engine decision.

## Impact list

- `packages/design-system/package.json`: `react-day-picker` at exactly 10.0.2 in `dependencies`.
- `pnpm-lock.yaml`: `react-day-picker`, `date-fns`, `@date-fns/tz` and whatever those bring.
- `packages/design-system/src/components/calendar/`: the only importer of the engine (decision 3).
- `.claude/rules/design-system.md`, the sentence named above.
- The contract changes for `Calendar` and `DatePicker` themselves are the spec's, in its impact list.

Confirmation: not confirmed yet; follow-up: the first ORV-231 PR, which carries the spec's rows 1 to 17. Row 16 confirms the pin, that `@daypicker/buddhist` is not added and that our source imports no `date-fns` and no library stylesheet, and its evidence includes the `security` approve on the head of that PR (decision 5). Row 14 fails `pnpm typecheck` when a `Date` is accepted as a value. Row 3 fails when the engine's own English words reach a Thai screen, and rows 9 and 10 when the keys and names are not what `cal-keys-1` and `cal-names-1` say; the range behaviour is row 31, in the third PR. Three parts have no automated check, and `reviewer` reads the diff for them: that only `Calendar` imports the engine (decision 3), that no engine type reaches a public prop, and, after that PR, that the pin stays exact, since row 16 is a read at one head and `merge-check` does not read `security` (ADR 0015 decision 2).
