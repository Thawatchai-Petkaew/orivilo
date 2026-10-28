---
issue: ORV-139 (https://tpetkaew.atlassian.net/browse/ORV-139)
lane: S (test only, no contract change, no product code change)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-139: wall-clock bounds in the intent-engine heavy tests sized for CI

## Goal

CI run 40746575077 on PR 135 failed `packages/intent-engine/src/page-text.test.ts`, test "a 2 MB meta description is cut to 1,000 characters in time", with 2249.04 ms against `TIME_BOUND_MS` 2000. The bound was sized on one file on the Mac, not on the CI runner under the parallel full suite. This issue resizes every wall-clock bound in the set `bound-set-1` by the rule `bound-size-1`, so each follows `.claude/rules/testing.md` (L-0046, L-0042): it holds on CI and still goes red on the mutant it guards. Only test files change. Nothing here is simulated or mocked beyond the fake network the tests already use.

Decisions it depends on: `.claude/rules/testing.md` (the time limit bullet, L-0046 and L-0042; the flaky test bullet, L-0009), and the POC mode section of `.claude/skills/ovl/SKILL.md` (ORV-137), which keeps L-0046.

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

### bound-size-1

For each assertion in `bound-set-1`, its bound B meets one of:

1. B is at least 10 times L, where L is the slowest elapsed time of that assertion seen in one local run of the full suite (`pnpm test` from the repo root), read through a temporary log that is removed before commit; or
2. B is at least 2 times C, where C is that assertion's elapsed time measured on a CI run, named by its run id.

B is rounded up to a whole 1,000 ms. B also stays below the time the assertion's mutant takes (`bound-mutant-1`). A bound that already meets this rule keeps its value; the evidence row still records L or C.

### bound-mutant-1

Each assertion in `bound-set-1` goes red on the mutant it guards (the defect the test names: a cut removed, a cap lifted, a linear route made to backtrack). The builder applies the mutant to the product code in the working tree, runs the test, sees the elapsed time exceed B, and restores the code. For an `it.each`, one case of the table is enough. When no B satisfies both `bound-size-1` and this rule (the mutant is not slower than the sized bound), the builder stops and reports it in `needs_decision` with the times; no assertion is dropped or weakened to a looser check.

### bound-name-1

A test name or comment that states a time ("within 2 s", "within 10 s", "in time" with a number) states the assertion's bound after the change.

## Acceptance criteria

| #   | Given                                                       | When                           | Then                                                                                                                                                                                                                         | Check                                                                                                                             |
| --- | ----------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The 30 assertion lines of `bound-set-1`                     | The builder hands off          | The report has one `verified` row per assertion: file, test name, L or C (with the run id), the bound before and after                                                                                                       | Count the rows against the table in `bound-set-1`                                                                                 |
| 2   | Each assertion of `bound-set-1`                             | Its bound is read in the diff  | It meets `bound-size-1`                                                                                                                                                                                                      | Recompute from the row of AC 1                                                                                                    |
| 3   | Each assertion of `bound-set-1`                             | Its mutant is applied          | The test goes red on the time assertion, and passes again once the code is restored                                                                                                                                          | One `verified` row per assertion with the mutant and the red elapsed time; `git diff` shows no product file                       |
| 4   | A test in `bound-set-1` whose name or comment states a time | The bound changes              | The text follows `bound-name-1`                                                                                                                                                                                              | `grep -n "within [0-9]* s" packages/intent-engine/src/*.test.ts packages/intent-engine/src/measures/*.test.ts`                    |
| 5   | Each test that holds an assertion of `bound-set-1`          | It is read                     | It passes the file's `HEAVY_TIMEOUT` as the third argument of `it()` or `it.each()`. On `81e95d5` the one without it is the test at `read-page.test.ts` line 741 ("reads the 500 KB file of 5,000 short wildcard rules ...") | Read each test; `pnpm --filter @orivilo/intent-engine exec vitest run --testTimeout=400` and its fail count as one `verified` row |
| 6   | The resized bounds                                          | The page-text file is repeated | It passes                                                                                                                                                                                                                    | `pnpm --filter @orivilo/intent-engine exec vitest run --repeats 4 src/page-text.test.ts`                                          |
| 7   | The branch                                                  | It is checked before handoff   | Only `*.test.ts` files under `packages/intent-engine/src/` changed; the full suite and the gate pass once                                                                                                                    | `git diff --name-only origin/develop...HEAD`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build`                            |

## Worked examples

Both are not run here (no shell in this role); the builder runs them from the repo root on `81e95d5` and reports the output.

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

## Out of scope

- Product code in `packages/intent-engine/src/` (non-test files): no change. A mutant is applied and restored in the working tree only.
- Wall-clock bounds outside `page-text.test.ts` that are not in `bound-set-1`: the 10000 ms bounds at `read-page.test.ts` lines 1190, 1240, 1361, 1380 and the 1000 ms bounds at lines 514 and 521 (on `81e95d5`). The builder may list any that look short in the PR body; they get their own issue.
- The ratio check at `page-text.test.ts` line 1135.
- Bounds in other packages (`design-system`, `apps/web`).
- A change to `.claude/rules/testing.md` or to any hook or guard.

## Open questions (with defaults)

1. Margin when a bound is sized from a CI time. Default: the factor in `bound-size-1`, branch 2. The rule in `testing.md` names "a measured CI time with its run id" and no factor; a bound equal to one CI time would fail on the next slower run.
2. Scope of "the other heavy tests that share that bound". Default: the set as `bound-set-1` lists it; other bounds in those files are out of scope.
3. One constant or literals. Default: the builder may replace a literal with the file's `TIME_BOUND_MS` (or add a second named constant for the 10000 ms bounds) when that keeps every assertion within `bound-size-1`; no rule requires it.

## Changelog

- v1.0: first version, from the ORV-139 description and CI run 40746575077.
