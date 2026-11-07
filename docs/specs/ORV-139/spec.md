---
issue: ORV-139 (https://tpetkaew.atlassian.net/browse/ORV-139)
lane: S (test only, no contract change, no product code change)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.3
---

# ORV-139: wall-clock bounds in the intent-engine heavy tests sized for CI

## Goal

CI run 40746575077 on PR 135 failed `packages/intent-engine/src/page-text.test.ts`, test "a 2 MB meta description is cut to 1,000 characters in time", with 2249.04 ms against `TIME_BOUND_MS` 2000. The bound was sized on one file on the Mac, not on the CI runner under the parallel full suite. This issue resizes the wall-clock bounds of the set `bound-set-1` by the rules `bound-size-1` and `bound-ci-1`, so each follows `.claude/rules/testing.md` (L-0046, L-0042): it holds on CI and still goes red on the mutant it guards. One assertion of the set is guarded by a ratio instead (`bound-ratio-1`), and five go red on a value assertion instead of the time line (`mutant-exception-1`). Only test files change. Nothing here is simulated or mocked beyond the fake network the tests already use.

Decisions it depends on: `.claude/rules/testing.md` (the time limit bullet, L-0046 and L-0042; the flaky test bullet, L-0009), the POC mode section of `.claude/skills/ovl/SKILL.md` (ORV-137), which keeps L-0046, and `docs/adr/0012-jira-states-by-environment.md` decision 4 (the owner's delegation, used in "Decisions taken under the owner's delegation" below).

## Rules

### bound-set-1

The set is every wall-clock assertion matched by these searches on commit `81e95d5`, 30 assertion lines in all:

| File (under `packages/intent-engine/src/`) | Search                                         | Lines on `81e95d5`                                                                             | Count |
| ------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----- |
| `page-text.test.ts`                        | `toBeLessThan\((TIME_BOUND_MS\|2000\|10000)\)` | 372, 392, 512, 525, 583, 598, 612, 627, 740, 757, 789, 805, 1165, 1181, 1268, 1424, 1435, 1580 | 18    |
| `measures/page.test.ts`                    | `toBeLessThan\((TIME_BOUND_MS\|2000)\)`        | 359                                                                                            | 1     |
| `measures/colour.test.ts`                  | `toBeLessThan\((TIME_BOUND_MS\|2000)\)`        | 388, 420                                                                                       | 2     |
| `url-analyser.test.ts`                     | `toBeLessThan\((TIME_BOUND_MS\|2000)\)`        | 1690, 1713, 1746                                                                               | 3     |
| `read-page.test.ts`                        | `toBeLessThan\((TIME_BOUND_MS\|2000)\)`        | 747, 1175, 1254, 1265, 1279, 1321                                                              | 6     |

In `page-text.test.ts` the set holds every bound (2000 and 10000 ms). In the other four files it holds the bounds that share the failing bound, 2000 ms (as `TIME_BOUND_MS` or the literal). An assertion inside a helper (`timed`, `timedToken`, `timedAnalysis` call sites, `readAt`, `readWith`, `read`) counts once, and its local time is the slowest case that runs through it. The ratio check at `page-text.test.ts` line 1135 (`many / one` below 3) is a ratio of two times, not a wall-clock bound, and is not in the set.

After this issue 29 of the 30 lines are wall-clock bounds (18 + 1 + 2 + 3 + 5). The thirtieth, `read-page.test.ts` line 1321, is no longer a wall-clock bound: `bound-ratio-1` replaces it.

### bound-size-1

For each of the 29 wall-clock assertions of `bound-set-1` (every line of its table except `read-page.test.ts` line 1321), its bound B meets one of:

1. B is at least 10 times L, where L is the slowest elapsed time of that assertion seen in one local run of the full suite (`pnpm test` from the repo root), read through a temporary log that is removed before commit; or
2. B is at least 2 times C, where C is that assertion's elapsed time measured on a CI run, named by its run id.

B is rounded up to a whole 1,000 ms. B also stays below the time the assertion's mutant takes (`bound-mutant-1`). A bound that already meets this rule keeps its value; the evidence row still records L or C. Where a CI time is known, `bound-ci-1` applies as well.

### bound-ci-1

Where a CI time C of a wall-clock assertion of `bound-set-1` is known, its B also meets branch 2 of `bound-size-1` on the slowest C seen, whichever branch sized it first (qa-2 F4 and F5 in `.orivilo/runs/ORV-139/ORV-139-qa-2/result.json`: bounds met by branch 1 alone sat under twice a CI time). C is the slowest time per test name in the logs of the CI runs read on ORV-139: the 29 runs build-4 read (ids 40671477959 to 40878076151, `.orivilo/runs/ORV-139/ORV-139-build-4/result.json`) and run 40890047958 on `ac091de`, which review-3 read as well (`.orivilo/runs/ORV-139/ORV-139-review-3/result.json`); or a time recorded on ORV-139. Vitest logs a test's time only above 300 ms and logs the whole test, so a logged C is at least the time of the assertion's timed span, and a test it does not list ran under 300 ms.

Seven bounds rise to meet it, each below its mutant time where a time-red mutant exists (`bound-mutant-1`). Build-4 raised all seven on `29ca63b`. Review-3 found a slower C for two of them, so they rise again: the sibling-blocks row from 3000 to 4000 (R3-2) and the re-opened-formatting row from 13000 to 15000 (R3-1). The column "B required" is the value v1.3 requires; line numbers are on `29ca63b`, and the test names are the ones `bound-name-1` requires after the change:

| File                   | Line on `81e95d5` | Line on `29ca63b` | Test name after the change                                                              | C, slowest CI time (source)      | B on `47f7dab` to B required        | Mutant time                                     |
| ---------------------- | ----------------- | ----------------- | --------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------- | ----------------------------------------------- |
| `page-text.test.ts`    | 525               | 544               | "returns the held-depth page within 17 s, with nothing cut"                             | 8,485 ms (run 40826193643)       | 12000 to 17000                      | see `mutant-exception-1`                        |
| `page-text.test.ts`    | 627               | 646               | "numbers 5,000 sibling blocks in time"                                                  | 1,527 ms (run 40890047958)       | 2000 to 4000                        | `nc`: 42,267.8 ms (build-1), 22,132.3 ms (R3-2) |
| `page-text.test.ts`    | 740               | 759               | "returns the re-opened-formatting page within 15 s, cut by the Element count"           | 7,287 ms (run 40878076151)       | 10000 to 15000                      | see `mutant-exception-1`                        |
| `page-text.test.ts`    | 1580              | 1601              | "looks 5,000 paths up in a 2 MB document of br elements within the bound"               | 1,654 ms (run 40713714426)       | `LOOKUP_BOUND_MS` 3000 to 4000      | `pm`: no finish (build-1)                       |
| `url-analyser.test.ts` | 1690              | 1693              | "a 2 MB meta description gives a bounded number of items, not an id-collision, in time" | 3,005 ms (ORV-139 comment 10271) | `DESCRIPTION_BOUND_MS` 6000 to 7000 | `pw`: no finish (build-1)                       |
| `url-analyser.test.ts` | 1713              | 1716              | "a 2 MB title is bounded the same way"                                                  | 2,109 ms (run 40878076151)       | `TITLE_BOUND_MS` 4000 to 5000       | `pw`: no finish (build-1)                       |
| `url-analyser.test.ts` | 1746              | 1749              | "1 MB of distinct hex colours", slowest case of the linear routes                       | 1,155 ms (run 40878076151)       | `TIME_BOUND_MS` 2000 to 3000        | `cp` and `ch`: no finish (build-1)              |

Worked example 6 derives the seven bounds. The hex-colours C (R3-3) changes from the 1,042 ms build-4 recorded, and its bound of 3000 still holds. The other 22 wall-clock assertions (the lines of the `bound-set-1` table that are not in this table, without `read-page.test.ts` line 1321) meet it at their bound on `47f7dab`, unchanged; build-4 records C for each. One of them meets it on an estimate, not a CI measure: `page-text.test.ts` line 805 (824 on `29ca63b`) times one of three reads, so its C is one third of the three-read test total (worked example 8).

### bound-mutant-1

Each assertion in `bound-set-1` goes red on the mutant it guards (the defect the test names: a cut removed, a cap lifted, a linear route made to backtrack). The builder applies the mutant to the product code in the working tree or a scratch copy, runs the test, sees the elapsed time exceed B (for `bound-ratio-1`, the ratio exceed its bound), and restores the code. For an `it.each`, one case of the table is enough. When no B satisfies both `bound-size-1` and this rule (the mutant is not slower than the sized bound), the builder stops and reports it in `needs_decision` with the times; no assertion is dropped or weakened to a looser check unless a decision recorded in "Decisions taken under the owner's delegation" accepts it. The accepted exceptions to this rule are the five assertions of `mutant-exception-1`.

#### mutant-exception-1

Five assertions of `bound-set-1` have no mutant that goes red on their time line. Each keeps a bound that meets `bound-size-1` and `bound-ci-1` and is guarded against its defect by the value assertions of the same test. Lines are on `81e95d5`; on `29ca63b` their time lines are 544, 759, 808, 824 and 1456, in table order. Test names and B after are on `29ca63b`, except the row for 740, which shows the name and the 15000 that v1.3 requires (R3-1; the C behind the rows for 525 and 740 is in `bound-ci-1`); mutant times are from `.orivilo/runs/ORV-139/ORV-139-build-1/result.json` (build) and `.orivilo/runs/ORV-139/ORV-139-qa-1/result.json` (qa, run on `d160f71`).

| Line in `page-text.test.ts` | Test name at the handoff                                                      | L, B after       | Mutant tried and its measured time                                                                                                                  | Reason it is not red on time                                                                                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 525                         | "returns the held-depth page within 17 s, with nothing cut"                   | 1143.3 ms, 17000 | None found; no time measured (build)                                                                                                                | The document stays 128 deep with 500,000 empty p; no code change the builder tried makes it slow without changing what the test asserts. `docs/specs/ORV-128/tech.md` calls this bound a time guard that pins no value |
| 740                         | "returns the re-opened-formatting page within 15 s, cut by the Element count" | 945.2 ms, 15000  | `MAX_ELEMENT_PUSHES` lifted alone: 1,856.5 ms; `MAX_LIST_STEPS` lifted alone: 1,330.9 ms; both lifted: out of memory (SIGABRT) after 13.2 s (build) | Each cap lifted alone stays under B; both lifted aborts the run, red but not on the time line                                                                                                                          |
| 789                         | "stops the Element count at the push that would be the 1,048,577th"           | 1053.2 ms, 11000 | `MAX_ELEMENT_PUSHES = 1e18`: 841 ms, red on the value line (795 on `d160f71`), texts `['A']` instead of `[]` (qa, build)                            | The mutant changes the value the test asserts and is not slower than B                                                                                                                                                 |
| 805                         | "returns the parse of the empty text when the second parse stops too"         | 1122.4 ms, 12000 | `MAX_ELEMENT_PUSHES = 1e18`: 261 ms, red on the value line (811 on `d160f71`), texts `['T']` instead of `[]` (qa, build)                            | As line 789                                                                                                                                                                                                            |
| 1435                        | "stylesheetLinksOf: returns the held-depth page within 10 s with nothing cut" | 622.1 ms, 10000  | None found; no time measured (build)                                                                                                                | As line 525                                                                                                                                                                                                            |

`page-text.test.ts` line 1268 (List steps, second parse) is not an exception: its time line now runs before the value lines, and the mutant `MAX_LIST_STEPS = 1e18` goes red on it at 37,722.66 ms (`.orivilo/runs/ORV-139/ORV-139-build-2/result.json`).

### bound-ratio-1

The test at `read-page.test.ts` line 1321 on `81e95d5` ("reads a page that repeats one link 63,886 times as one stylesheet, never reaching the eleventh") has no wall-clock bound. It asserts that the fastest of 3 reads of the page of repeated `<link rel=stylesheet href=/x>` over the fastest of 3 reads of a page of the same size of `<link rel=icon href=/x>` is below 5. Its net log and status checks stay.

Why not a wall-clock bound: under the parallel full suite the read took 2,575.75 ms and 2,147.75 ms (qa, `d160f71`, 2 of 3 runs red against 2000), so `bound-size-1` needs B of at least 26,000 ms, and the mutant `hl` (`stylesheetLinksOf` rebuilds its list per link) takes 11,693.1 ms (build). No B meets `bound-size-1` and `bound-mutant-1` together. A ratio of two reads on the same machine slows alike under load. The mutant `hl` gives a ratio of 36.84 (build-2), red on the ratio line; a quiet machine gives about 1 (build-2).

### bound-name-1

A test name or comment that states a time ("within 2 s", "within 10 s", "in time" with a number) states the assertion's bound after the change.

## Decisions taken under the owner's delegation

- On ORV-139 (2026-10-29) the orchestrator accepted `mutant-exception-1` (qa finding F3 in ORV-139-qa-1; builder `needs_decision` in ORV-139-build-1) and `bound-ratio-1` (qa finding F1; builder `needs_decision` in ORV-139-build-2) under the owner's delegation, `docs/adr/0012-jira-states-by-environment.md` decision 4. The owner can take this back at any time.

## Acceptance criteria

| #   | Given                                                                                                                                        | When                          | Then                                                                                                                                                                                                                            | Check                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The 30 assertion lines of `bound-set-1`                                                                                                      | The builder hands off         | The report has one `verified` row per line: for the 29 wall-clock assertions, file, test name, L or C (with the run id), the bound before and after; for the line of `bound-ratio-1`, the ratio, its bound and the loaded times | Count the rows against the table in `bound-set-1`                                                                                 |
| 2   | Each of the 29 wall-clock assertions of `bound-set-1`                                                                                        | Its bound is read in the diff | It meets `bound-size-1` and `bound-ci-1`                                                                                                                                                                                        | Recompute from the row of AC 1                                                                                                    |
| 3   | Each assertion of `bound-set-1` except the five of `mutant-exception-1` (`page-text.test.ts` lines 525, 740, 789, 805 and 1435 on `81e95d5`) | Its mutant is applied         | The test goes red on its time assertion (for `bound-ratio-1`, the ratio line), and passes again once the code is restored                                                                                                       | One `verified` row per assertion with the mutant and the red elapsed time or ratio; `git diff` shows no product file              |
| 4   | A test in `bound-set-1` whose name or comment states a time                                                                                  | The bound changes             | The text follows `bound-name-1`                                                                                                                                                                                                 | `grep -n "within [0-9]* s" packages/intent-engine/src/*.test.ts packages/intent-engine/src/measures/*.test.ts`                    |
| 5   | Each test that holds an assertion of `bound-set-1`                                                                                           | It is read                    | It passes the file's `HEAVY_TIMEOUT` as the third argument of `it()` or `it.each()`. On `81e95d5` the one without it is the test at `read-page.test.ts` line 741 ("reads the 500 KB file of 5,000 short wildcard rules ...")    | Read each test; `pnpm --filter @orivilo/intent-engine exec vitest run --testTimeout=400` and its fail count as one `verified` row |
| 6   | The resized bounds and the ratio                                                                                                             | The three files are repeated  | They pass                                                                                                                                                                                                                       | `pnpm --filter @orivilo/intent-engine exec vitest run --repeats 4 src/{page-text,read-page,url-analyser}.test.ts`                 |
| 7   | The branch                                                                                                                                   | It is checked before handoff  | Only `*.test.ts` files under `packages/intent-engine/src/` and this spec changed; the full suite and the gate pass once                                                                                                         | `git diff --name-only origin/develop...HEAD`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build`                            |
| 8   | Each assertion of `mutant-exception-1`                                                                                                       | It is read in the diff        | Its bound meets `bound-size-1` and `bound-ci-1`, and the `page-text.test.ts` header comment names it as having no time-red mutant                                                                                               | Read the header comment of `page-text.test.ts`; the mutant rows of `mutant-exception-1`                                           |

## Worked examples

None is run here (no shell in this role); the builder runs each from the repo root and reports the output. Examples 1 and 2 run on `81e95d5`.

1. The search of `bound-set-1` for `page-text.test.ts`, an integer count with no rounding. Expected output: `18`.

   ```bash
   node -e "const s=require('fs').readFileSync('packages/intent-engine/src/page-text.test.ts','utf8');console.log((s.match(/toBeLessThan\((TIME_BOUND_MS|2000|10000)\)/g)||[]).length)"
   ```

2. The search of `bound-set-1` for the other four files, integer counts in table order. Expected output: `1 2 3 6`.

   ```bash
   node -e "const fs=require('fs');const d='packages/intent-engine/src/';console.log(['measures/page.test.ts','measures/colour.test.ts','url-analyser.test.ts','read-page.test.ts'].map(f=>(fs.readFileSync(d+f,'utf8').match(/toBeLessThan\((TIME_BOUND_MS|2000)\)/g)||[]).length).join(' '))"
   ```

3. `bound-size-1`, branch 2, for the failing test, with C = 2249.04 ms from CI run 40746575077, rounded up to a whole 1,000 ms. Expected output: `5000` (the floor for that assertion if the builder sizes it from the CI time).

   ```bash
   node -e "console.log(Math.ceil(2*2249.04/1000)*1000)"
   ```

4. Why `bound-ratio-1` has no wall-clock B: `bound-size-1`, branch 1, on the slowest loaded time 2575.752542 ms (qa, `d160f71`), rounded up to a whole 1,000 ms, against the mutant time 11693.1 ms (build). Expected output: `26000 false` (the sized bound, and whether it stays below the mutant).

   ```bash
   node -e "const B=Math.ceil(10*2575.752542/1000)*1000;console.log(B,B<11693.1)"
   ```

5. The lean of `bound-ratio-1` on the mutant ratio 36.844249128296276 (build-2, `read-page.test.ts:1338`), no rounding. Expected output: `false` (not below 5, so red).

   ```bash
   node -e "console.log(36.844249128296276<5)"
   ```

6. `bound-ci-1`, the seven raised bounds: branch 2 of `bound-size-1` on the C of each row of its table, in table order (8485, 1527, 7287, 1654, 3005, 2109 and 1155 ms), rounded up to a whole 1,000 ms. Expected output: `17000 4000 15000 4000 7000 5000 3000`.

   ```bash
   node -e "console.log([8485,1527,7287,1654,3005,2109,1155].map(c=>Math.ceil(2*c/1000)*1000).join(' '))"
   ```

7. The deviation from qa-2 F5 (held-depth row): twice its C of 8485 ms (run 40826193643), no rounding, and whether the 13000 that F5 asked for is under it. Expected output: `16970 true`.

   ```bash
   node -e "console.log(2*8485,13000<2*8485)"
   ```

8. The estimate of `bound-ci-1` for `page-text.test.ts` line 805: one third of the slower three-read test total on record, 12982 ms (run 40760007382, qa-2 F5; build-4 read 12955 ms in run 40826193643), doubled and rounded to a whole ms, and whether it is under B 12000. Expected output: `8655 true`.

   ```bash
   node -e "const c=12982/3;console.log(Math.round(2*c),2*c<12000)"
   ```

9. The two out-of-scope `read-page.test.ts` bounds build-4 found short: branch 2 of `bound-size-1` on 7501 ms (run 40824425394) and 9325 ms (run 40878076151, R3-3), rounded up to a whole 1,000 ms. Expected output: `16000 19000`.

   ```bash
   node -e "console.log([7501,9325].map(c=>Math.ceil(2*c/1000)*1000).join(' '))"
   ```

## Out of scope

- Product code in `packages/intent-engine/src/` (non-test files): no change. A mutant is applied and restored in the working tree or a scratch copy only.
- Wall-clock bounds outside `page-text.test.ts` that are not in `bound-set-1`: the 10000 ms bounds at `read-page.test.ts` lines 1190, 1240, 1361, 1380 and the 1000 ms bounds at lines 514 and 521 (on `81e95d5`). The builder may list any that look short in the PR body; they get their own issue. Build-4 found two of them short on CI: line 1190 (1194 on `29ca63b`, "reads the held-depth page within 10 s with nothing cut") ran 7,501 ms in run 40824425394, and line 1240 (1244 on `29ca63b`, "reads the re-opened-formatting document, cut by the Element count") ran 9,325 ms in run 40878076151 (R3-3; build-4 recorded 7,416 ms in run 40835251401), so `bound-ci-1` would not hold for their 10000; it would need 16000 and 19000 (worked example 9). They stay out of scope here and go to their own issue.
- The ratio check at `page-text.test.ts` line 1135.
- Bounds in other packages (`design-system`, `apps/web`).
- A change to `.claude/rules/testing.md` or to any hook or guard.

## Open questions (with defaults)

1. Margin when a bound is sized from a CI time. Default: the factor in `bound-size-1`, branch 2. The rule in `testing.md` names "a measured CI time with its run id" and no factor; a bound equal to one CI time would fail on the next slower run.
2. Scope of "the other heavy tests that share that bound". Default: the set as `bound-set-1` lists it; other bounds in those files are out of scope.
3. One constant or literals. Default: the builder may replace a literal with the file's `TIME_BOUND_MS` (or add a second named constant for the 10000 ms bounds) when that keeps every assertion within `bound-size-1`; no rule requires it.

## Changelog

- v1.0: first version, from the ORV-139 description and CI run 40746575077.
- v1.1: qa F1 and F3 (ORV-139-qa-1) and builder ORV-139-build-2 `needs_decision`. Adds `mutant-exception-1` (five page-text assertions guarded by value assertions, with mutant times and reasons), `bound-ratio-1` (the 63,886-link read-page test guarded by a ratio below 5), and the record of their acceptance under ADR 0012 decision 4. `bound-set-1` now states 29 wall-clock bounds after the change; `bound-size-1` covers those 29; `bound-mutant-1` allows a scratch copy and points to the exceptions; AC 1, 2, 3, 6 and 7 changed; AC 8 added; worked examples 4 and 5 added. Downstream to review: PR 136 body (section "Decisions taken under the owner's delegation", which still names six exceptions), the `page-text.test.ts` header comment (lines 20 to 31 of the working tree), the `read-page.test.ts` comment at lines 1323 to 1328 (it says "60 for the defect"; build-2 measured 36.84), and the qa re-check of AC 1, 2, 3, 6 and 8.
- v1.2: qa-2 F4 and F5 (ORV-139-qa-2) and builder ORV-139-build-4 (commit `29ca63b`). Adds `bound-ci-1` (a bound with a known CI time also meets branch 2 of `bound-size-1` on the slowest one) with the seven bounds build-4 raised: F4's sibling blocks, F5's held-depth and re-opened-formatting rows, and beyond them `LOOKUP_BOUND_MS`, `DESCRIPTION_BOUND_MS`, `TITLE_BOUND_MS` and the url-analyser `TIME_BOUND_MS`. The `mutant-exception-1` rows for lines 525 and 740 now read 17000 ("within 17 s") and 13000 ("within 13 s"), and the section names their lines on `29ca63b`, which the longer header comment moved down by 4 from `47f7dab`. Goal, `bound-size-1`, AC 2 and AC 8 point to `bound-ci-1`; AC 6 repeats `url-analyser.test.ts` too, whose bounds build-4 changed; Out of scope names the two short read-page bounds; worked examples 6 to 9 added. Deviation: F5 asked for 13000 on the held-depth row; build-4 set 17000 because 13000 is under twice its CI time of 8,485 ms (worked example 7). Out of scope, for their own issue: the `read-page.test.ts` 10000 ms bounds build-4 found short (7,501 and 7,416 ms on CI). Downstream to review: PR 136 body (the bounds and test names of the exception rows, and the seven raised bounds), the qa re-check of AC 1, 2, 4, 6 and 8 on `29ca63b`, the rows of `docs/specs/ORV-128/spec.md`, `docs/specs/ORV-128/tech.md` and `docs/specs/ORV-133/spec.md` that still say the held-depth and re-opened-formatting pages return within 10 s, and a new Jira issue for the two read-page bounds.
- v1.3: review-3 R3-1, R3-2 and R3-3 (ORV-139-review-3, slowest C read from the CI logs up to run 40890047958). R3-1: the re-opened-formatting row of `bound-ci-1` takes C 7,287 ms (run 40878076151) and B 15000 ("within 15 s"), and its `mutant-exception-1` row reads 15000 and "within 15 s". R3-2: the sibling-blocks row takes C 1,527 ms (run 40890047958, on `ac091de`) and B 4000; the `nc` mutant ran 22,132.3 ms in review-3, so 4000 still goes red on time. R3-3: the hex-colours row takes C 1,155 ms (run 40878076151), its B 3000 unchanged; the read-page re-opened-formatting C in Out of scope and worked example 9 becomes 9,325 ms (run 40878076151), which needs 19000, not 15000. `bound-ci-1` names run 40890047958 as a C source and says which two rows rose again; its table column now shows the B v1.3 requires; worked examples 6 and 9 output `17000 4000 15000 4000 7000 5000 3000` and `16000 19000`. The v1.2 line above keeps the values v1.2 stated. Downstream to review: `packages/intent-engine/src/page-text.test.ts` line 646 (3000 to 4000), line 754 and header line 33 ("within 13 s" to "within 15 s"), line 759 (13000 to 15000), header line 26 ("6,437 ms (run 40835251401)" to "7,287 ms (run 40878076151)") and header line 27 ("1,495 ms (run 40713714426)" to "1,527 ms (run 40890047958)"); `packages/intent-engine/src/url-analyser.test.ts` line 1431 ("1,042 ms on CI run 40835251401" to "1,155 ms on CI run 40878076151"); PR 136 body (the two bounds, and R3-4: the exception bounds meet `bound-size-1` and `bound-ci-1`); the qa re-check of AC 2, 4, 6 and 8; and the new Jira issue for the two read-page bounds (16000 and 19000).
