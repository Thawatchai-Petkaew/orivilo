---
issue: ORV-299 (https://tpetkaew.atlassian.net/browse/ORV-299)
lane: S (test files only; no risk flag, see "Lane")
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.1
---

# ORV-299: time guards sized for a loaded CI runner

## Why

The guard of `packages/intent-engine/src/page-text.test.ts` line 808 ("stops the Element count at the push that would be the 1,048,577th", bound 11000 ms) failed on CI twice: 11459.8 ms on run 44556398012 and 13218.4 ms on run 44693919786. Run 44693919786 is PR 239, which changes no file of that test (ORV-299 comment 10775). A red CI run blocks the merge of a PR that did nothing wrong: the G3 gate needs a green CI (ADR 0012), so the delivery loop stops until someone reruns the whole CI job and hopes for a quieter runner. The same pattern, a fixed wall-clock bound sized from earlier CI times, sits in more tests than the one that failed, so this card surveys the whole class and treats every member by one of two rules: a clock that no defect can make red is removed (`orv299-drop-1`), and every other clock is sized by one rule (`orv299-size-1`).

The guard that failed is one of seven whose clock no known defect makes red: each defect they guard goes red on a value line of the same test, or aborts the run out of memory (ORV-139 `mutant-exception-1`, and the comments of the tests of S23 and S24). Sizing those seven clocks up only moves the flake further out; removing them ends it for the two tests that failed most (S11 and S12, the two under a ratio of 1 on run 44693919786) without losing a red mutant. The main session took that answer under the owner's POC delegation in ORV-299 comment 10778 (see "Open questions").

Every time in this spec comes from the step log of run 44693919786 (a slow run: `page-text.test.ts` took 123,101 ms as a file), from ORV-299 comment 10775, or from a time with a run id that a test file or `docs/specs/ORV-139/spec.md` already records. Vitest prints every test of a failed file and, for a passing file, only the tests over 300 ms, each with the ms of the whole test.

This spec is not a guard on a tool call (it changes bounds inside tests), so the guard frame does not apply.

### What is real

Nothing is simulated. The PR removes seven assertion lines and changes numbers, test names and comments in test files; no product behaviour changes.

## Lane

S. The PR changes three test files: `packages/intent-engine/src/page-text.test.ts`, `packages/intent-engine/src/read-page.test.ts` and `packages/auth/src/rate-limit.integration.test.ts` (the bounds marked **removed** and **raised** in the survey, with the test names and comments of `orv299-name-1`), plus this folder. It changes no profile or token schema, no semantic token, no component public API, no resolver, no auth or data access (the auth file is a test; `packages/auth/src/rate-limit.ts` is not touched) and no asset licensing. No product file, locale string, story or catalog entry changes.

Review (ORV-299 comment 10778): one reviewer pass and one security pass, and no qa. The diff holds test files and this folder only, with no UI and no product behaviour for qa to walk, so the reviewer walks the rows; the security pass runs because the diff touches `packages/intent-engine/**`, a path of `.claude/rules/security.md`, and the auth package's tests.

## Story

As the team, I want every wall-clock bound in our tests either removed, where no defect can make it red, or sized for a loaded CI runner by one stated rule, so that CI goes red on a blow-up in the code and not on a slow runner.

## Rules

Each rule is defined here once; the survey, the rows and the other sections point to it by name.

### orv299-class-1

The class is every assertion in test code (a `*.test.ts`, `*.test.tsx` or `*.stories.tsx` file under `packages/` or `apps/`) that holds an upper bound on elapsed wall-clock time: `expect(performance.now() - <start>).toBeLessThan(<bound>)`, `expect(Date.now() - <start>).toBeLessThan(<bound>)`, or `expect(<duration>).toBeLessThan(<bound>)` where the duration was taken from either clock (in today's code the names `ms` and `elapsed`). On the base `d8e9025` the class is the 41 assertions S1 to S41 of the survey. The search that lists it, from the repo root:

```bash
grep -rnE 'expect\((performance\.now\(\)|Date\.now\(\)) - [A-Za-z0-9_]+\)\.toBeLessThan|expect\((ms|elapsed)\)\.toBeLessThan' packages apps --include='*.test.ts' --include='*.test.tsx' --include='*.stories.tsx' --exclude-dir=node_modules
```

Outside the class, and not changed:

- the lower bound `packages/design-system/src/components/canvas-chat/CanvasChat.stories.tsx` line 1553 (`toBeGreaterThanOrEqual(1900)`);
- the two ratio guards, which compare two runs on the same machine: `page-text.test.ts` line 1154 (`many / one` under 3, from the best-of time at line 1148) and `read-page.test.ts` line 1343 (`repeated / baseline` under 5, ORV-139 `bound-ratio-1`);
- durations taken and not asserted: `packages/intent-engine/src/url-analyser.test.ts` line 1673 (the worst case reads `result` only) and `apps/web/server/read-ports.test.ts` line 108 (the drip server's own 10 s run, a fixture);
- `durationMs` in product code (log lines), and wait limits (`waitFor`, `expect.poll` and Playwright timeouts), which wait for a condition and assert no duration.

### orv299-drop-1

A clock upper bound that no defect can make red (no mutant goes red on it, by the record of ORV-139 `mutant-exception-1` or by the test's own comment) is removed, together with its start variable when only that line reads it. Every other assertion of the test stays as it is. The test keeps its heavy timeout argument (`HEAVY_TIMEOUT`, 60,000 ms in both engine files), and that framework timeout is the backstop against a hang.

What is given up: a slowdown of these seven parses that stays under the 60,000 ms framework timeout and changes no value no longer turns CI red. No recorded mutant produces such a slowdown (the record and the comments above), so no recorded red is lost. The defect of S9 and S24 (both work caps lifted) goes red only by the out-of-memory abort or by the framework timeout, as it already did with the clock.

On the base `d8e9025` the rule selects S4, S9, S11, S12, S17, S23 and S24. What each of their tests keeps, so that no test is left without an assertion (lines on `d8e9025`; "start" is the start variable the rule removes with the clock):

<!-- prettier-ignore -->
| Id | Test name line | Lines removed | Lines changed by `orv299-name-1` | Assertions that stay |
| --- | --- | --- | --- | --- |
| S4 | page-text:539 | 542 (start), 544 (clock) | 539 (name) | 541 (the page is within 2 MB), 545 (`out.blocks` is `[]`), 546 (`out.incomplete` is false) |
| S9 | page-text:754 | 757 (start), 759 (clock) | 754 (name) | 756 (the page is within 2 MB), 760 (`out.incomplete` is true) |
| S11 | page-text:803 | 805 (start), 808 (clock) | none | 806 (1,048,572 strays read `['A']`, not incomplete), 807 (1,048,573 strays read `[]`, incomplete) |
| S12 | page-text:814 | 820 and 821 (the comment on the 12 s guard), 822 (start), 824 (clock) | none | 823 (`doc(107)` reads `[]`, incomplete), 825 (`doc(108)` reads `['T']`, incomplete), 826 (`doc(106)` reads `['T']`, incomplete) |
| S17 | page-text:1452 | 1454 (start), 1456 (clock) | 1452 (name) | 1457 (`{ hrefs: [], incomplete: false }`) |
| S23 | read-page:1187 | 1194 (start), 1196 (clock) | 1187 (name), 1189 and 1190 (comment) | 1197 (`r.status` is `read`), 1198 (`incomplete` is `[]`) |
| S24 | read-page:1242 | 1248 (clock) | 1242 (name), 1244 and 1245 (comment), 1247 (`{ r, ms }` becomes `{ r }`; the shared helper `read` at line 1234 keeps its clock, which S25, S26 and S27 read) | 1246 (the page is within 2 MB), 1249 (`r.status` is `read`), 1250 (`incomplete` is `["page-incomplete"]`) |

### orv299-size-1

A clock upper bound in a test guards against a blow-up (work that grows faster than its input); it is never a speed promise. Its value is at least 2 times the slowest CI time seen for that test, rounded up to a whole second (1,000 ms). The CI time is the ms that vitest prints for the whole test, cited with its run id; a time with a run id that the test file or `docs/specs/ORV-139/spec.md` records counts as seen. For an `it.each`, the slowest case counts. A bound with no CI time keeps its value. No bound goes down, and the framework timeout of the test (the file's `HEAVY_TIMEOUT` of 60,000 ms, `SLOW` of 20,000 ms, `LOCK_TIMEOUT` of 30,000 ms, or the package `testTimeout`, 20,000 ms in `packages/auth/vitest.config.ts`) stays above the bound. The rule applies to the 34 bounds that `orv299-drop-1` leaves; the survey's column "New" is this rule applied to them, worked in W1.

### orv299-red-1

Each bound that `orv299-size-1` raises (S27 and S38) still goes red on the defect it guards: on its clock line, by the test's framework timeout, or on another assertion of the same test. The builder applies the mutant named in row 4 to the product code in the working tree, runs the test, records which line or timeout went red and the time, and restores the code. Where the clock at its new size can no longer tell the defect from a loaded runner (the mutant finishes under the new bound with every value assertion green), the test asserts the work count or the cut result as its primary check and the clock stays only as a backstop; the builder reports such a case in `needs_decision` with the times before adding a work-count assertion.

### orv299-name-1

A test name or comment that states a removed bound no longer states it, and a raised bound's test names its new bound and the CI time it was sized from, with the run id. The lines the builder changes, on `d8e9025` (the new wording is given where the words matter; a comment may be worded freely if it says what is listed):

<!-- prettier-ignore -->
| File:line | Today | After the PR |
| --- | --- | --- |
| page-text:25 to 27 | the held-depth page took 8,485 ms (run 40826193643), the re-opened-formatting page 7,287 ms (run 40878076151) | these two times are gone (their bounds are removed); the times of the 5,000 sibling blocks and the 5,000 path lookups stay |
| page-text:28 to 37 | "Each also stays below the time the defect it guards takes ..., except five, the accepted exceptions of `mutant-exception-1`" and the list of the five with their bounds | each bound below still stays below the time of the mutant it guards; five tests hold no clock (ORV-299): they are named by their new names ("returns the held-depth page, with nothing cut", "returns the re-opened-formatting page, cut by the Element count", "stops the Element count at the push that would be the 1,048,577th", "returns the parse of the empty text when the second parse stops too", and stylesheetLinksOf "returns the held-depth page with nothing cut"); why: no mutant goes red on their clock, the defect goes red on a value line or aborts the run out of memory (`mutant-exception-1` in `docs/specs/ORV-139/spec.md` holds the mutants and their times); their value lines stay and `HEAVY_TIMEOUT` is the backstop against a hang |
| page-text:539 | "returns the held-depth page within 17 s, with nothing cut" | "returns the held-depth page, with nothing cut" |
| page-text:754 | "returns the re-opened-formatting page within 15 s, cut by the Element count" | "returns the re-opened-formatting page, cut by the Element count" |
| page-text:820 to 821 | "the 12 s guard is the row's claim for the document that reaches the third parse; ..." | removed (listed under `orv299-drop-1`) |
| page-text:1452 | "returns the held-depth page within 10 s with nothing cut" | "returns the held-depth page with nothing cut" |
| read-page:1187 | "reads the held-depth page within 16 s with nothing cut" | "reads the held-depth page with nothing cut" |
| read-page:1189 to 1190 | "Bound: twice the slowest CI time, 7,508 ms (run 40890047958), rounded up to 16000 (ORV-145). No mutant is slower on this time line; ..." | no clock (ORV-299): no mutant is slower on a time line; the value lines below guard the defect and `HEAVY_TIMEOUT` is the backstop against a hang |
| read-page:1242 | "reads the re-opened-formatting document within 22 s, cut by the Element count" | "reads the re-opened-formatting document, cut by the Element count" |
| read-page:1244 to 1245 | "Bound: twice the slowest CI time, 10,899 ms (run 40915924406), rounded up to 22000 (ORV-145). Lifting both caps aborts ..." | no clock (ORV-299): lifting both caps aborts the run out of memory, red but not on a time line (ORV-139 `mutant-exception-1`); the value lines below guard the defect and `HEAVY_TIMEOUT` is the backstop against a hang |
| read-page:1287 (a new comment line above it) | none | the bound 4000 is 2 times 1,807 ms, the whole test on run 44693919786, rounded up to a whole second (ORV-299) |
| rate-limit.int:224 (a new comment line above it) | none | the bound 2000 is 2 times 928 ms, the whole test on run 44693919786, rounded up to a whole second (ORV-299) |

No other name or comment in the three files states a removed bound: the search for `within 17 s`, `within 15 s`, `within 10 s`, `within 16 s`, `within 22 s`, `12 s guard`, `8,485`, `7,287`, `7,508` and `10,899` on `d8e9025` hits only the lines above.

## Survey

Files: `page-text` = `packages/intent-engine/src/page-text.test.ts`, `read-page` = `packages/intent-engine/src/read-page.test.ts`, `url-analyser` = `packages/intent-engine/src/url-analyser.test.ts`, `colour` = `packages/intent-engine/src/measures/colour.test.ts`, `measures/page` = `packages/intent-engine/src/measures/page.test.ts`, `spend-cap` = `packages/auth/src/spend-cap.integration.test.ts`, `rate-limit.int` = `packages/auth/src/rate-limit.integration.test.ts`, `rate-limit` = `packages/auth/src/rate-limit.test.ts`, `read-ports` = `apps/web/server/read-ports.test.ts`. Lines are on `d8e9025`.

Columns: "Guards" is the defect the clock is there for, by the rule name the test or its describe block uses. "Caught without the clock" says whether another assertion of the same test goes red on that defect, with its line ("by reading" means the spec read the test and the code path; the builder's mutant row confirms it only for the raised bounds and, for S11 and S12, row 5). "CI" is the ms vitest printed for the whole test on run 44693919786 (the slowest case of an `it.each`); "not measured" means the log has no time for it (a passing file prints no test under 300 ms). "Ratio" is the bound over that CI time, to 2 decimals. "Slowest seen" is the input of `orv299-size-1`. "New" is the bound after the PR: **removed** marks the seven `orv299-drop-1` selects, **raised** the two `orv299-size-1` raises, and a plain number a bound the PR keeps (32 of them).

<!-- prettier-ignore -->
| Id | File:line | Bound | Test | Guards | Caught without the clock | CI | Ratio | Slowest seen (source) | New |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | page-text:391 | 5000 (`DESCRIPTION_BOUND_MS`) | "a 2 MB meta description is cut to 1,000 characters in time" | the title and description bound (SEC-4): the cut of a 2 MB description stays linear | no (line 393 catches only a cut removed) | 2218 | 2.25 | 2249 (run 40746575077, file head comment) | 5000 |
| S2 | page-text:411 | 3000 | "keeps 294 of 40,000 headings, 4,998 characters in all, and reports page-incomplete in time" | the heading bound: work stops at the bound | no (lines 412 to 414 catch only a lifted bound) | 958 | 3.13 | 958 | 3000 |
| S3 | page-text:531 | 2000 | "returns the 2 MB page of %s within 2 s, cut and incomplete" (5 cases) | the Nesting count: the parse stops at the 129th open element | no (by reading: the walk still flags depth past 128, so lines 532 and 533 hold) | 502 (nested div elements) | 3.98 | 502 | 2000 |
| S4 | page-text:544 | 17000 | "returns the held-depth page within 17 s, with nothing cut" | the Nesting count on a page held at depth 128 | yes, lines 545 and 546 (ORV-139 `mutant-exception-1`: no time-red mutant) | 6109 | 2.78 | 8485 (run 40826193643) | **removed** |
| S5 | page-text:602 | 2000 | "returns 5,000 p blocks and 5,000 h2 blocks under a long path within 2 s and 10 MB of path, with none kept" | the path bound: no path built past 500 characters | no (line 603 catches a kept block, not a slow path) | 386 | 5.18 | 386 | 2000 |
| S6 | page-text:617 | 4000 | "builds no path past the bound: 30,000 blocks under 125 nested long names are dropped in time" | the path bound: no path built past 500 characters | no (the blocks are dropped with or without the early stop) | 745 | 5.37 | 745 | 4000 |
| S7 | page-text:631 | 2000 | "returns the page of 509 nested long names within 2 s, incomplete, with no path over 500" | the path bound with the Nesting count | no (line 633 catches a path over 500, not a slow one) | 156 | 12.82 | 156 | 2000 |
| S8 | page-text:646 | 4000 | "numbers 5,000 sibling blocks in time" | paths in one pass per parent: numbering stays linear | no (lines 647 and 648 hold; mutant `nc` is red on the clock at 22,132.3 ms, ORV-139 `bound-ci-1`) | 961 | 4.16 | 1527 (run 40890047958) | 4000 |
| S9 | page-text:759 | 15000 | "returns the re-opened-formatting page within 15 s, cut by the Element count" | the Work bound, the Element count and the List steps | no (`mutant-exception-1`: each cap lifted alone stays green; both lifted abort out of memory) | 7742 | 1.94 | 7742 | **removed** |
| S10 | page-text:776 | 2000 | "returns the 2 MB page of %s within 2 s, with nothing of it kept" (3 cases) | the Work bound, the Attribute merge and the Attribute count | yes, line 777 (by reading: no other cut applies to these pages, so a lifted cap leaves `incomplete` false) | 466 (body start tags) | 4.29 | 466 | 2000 |
| S11 | page-text:808 | 11000 | "stops the Element count at the push that would be the 1,048,577th" | the Element count | yes, line 807 (`mutant-exception-1`: `MAX_ELEMENT_PUSHES = 1e18` gives texts `['A']`) | 13267 (the failure; timed window 13218.4) | 0.83 | 13267 (run 44693919786; 11459.8 on run 44556398012) | **removed** |
| S12 | page-text:824 | 12000 | "returns the parse of the empty text when the second parse stops too" | the Element count on the second parse | yes, line 823 (`mutant-exception-1`: texts `['T']`) | 15169 (whole test of three reads; the timed window of one read stayed under 12000) | 0.79 | 15169 | **removed** |
| S13 | page-text:1184 | 13000 | "returns the 2 MB %s within 13 s, cut by the List steps" (3 cases) | the List steps | yes, line 1185 (by reading: a lifted cap leaves `incomplete` false once the slow parse ends inside `HEAVY_TIMEOUT`) | 1745 (adoption move with text) | 7.45 | 1745 | 13000 |
| S14 | page-text:1200 | 18000 | "returns the 2 MB page fostered out of a %s within 18 s, uncut" (3 cases) | the List steps: fostering stays linear | no (the page is uncut either way) | 1859 (table with text and a br) | 9.68 | 1859 | 18000 |
| S15 | page-text:1285 | 10000 | "returns the parse of the empty text when the List steps stop the second parse" | the List steps on the second parse | yes, line 1286 (the mutant `MAX_LIST_STEPS = 1e18` is red on the clock first, 37,722.66 ms, ORV-139) | 1955 | 5.12 | 1955 | 10000 |
| S16 | page-text:1445 | 2000 | stylesheetLinksOf "returns the 2 MB page of %s within 2 s, cut and incomplete" (5 cases) | the Nesting count | no (by reading: the walk still flags depth past 128) | 107 | 18.69 | 107 | 2000 |
| S17 | page-text:1456 | 10000 | stylesheetLinksOf "returns the held-depth page within 10 s with nothing cut" | the Nesting count on a page held at depth 128 | yes, line 1457 (`mutant-exception-1`: no time-red mutant) | 2684 | 3.73 | 2684 | **removed** |
| S18 | page-text:1601 | 4000 (`LOOKUP_BOUND_MS`) | "looks 5,000 paths up in a 2 MB document of br elements within the bound" | pageTextAndPathsOf: the lookup stays linear | no (line 1602 holds; mutant `pm` did not finish, ORV-139) | 1254 | 3.19 | 1654 (run 40713714426) | 4000 |
| S19 | read-page:514 | 1000 | "refuses the path of 38 a and a b within 1 s" | patterns without a regular expression: no backtracking | no (a backtracking matcher gives the same refusal) | not measured | n/a | none | 1000 |
| S20 | read-page:521 | 1000 | "reads the path of 38 a within 1 s" | patterns without a regular expression | no (same) | not measured | n/a | none | 1000 |
| S21 | read-page:749 | 7000 | "reads the 500 KB file of 5,000 short wildcard rules against a path of 2,000 characters within 7 s" | robots-match-1 caps (SEC-133-R1-1, FU-5) | no (line 748 holds with uncapped matching) | 1474 | 4.75 | 1474 | 7000 |
| S22 | read-page:1179 | 2000 | "reads the 2 MB page of %s within 2 s, cut and incomplete" (5 cases) | the Nesting count in a read | no (by reading: the walk still flags depth past 128) | 544 (style that opens a comment; 3 cases not printed) | 3.68 | 544 | 2000 |
| S23 | read-page:1196 | 16000 | "reads the held-depth page within 16 s with nothing cut" | the Nesting count in a read, held at depth 128 | yes, lines 1197 and 1198 (the test's comment: no mutant is slower on the time line) | 6139 | 2.61 | 7508 (run 40890047958, test comment) | **removed** |
| S24 | read-page:1248 | 22000 | "reads the re-opened-formatting document within 22 s, cut by the Element count" | the Work bound in a read | no (both caps lifted abort out of memory, `mutant-exception-1`) | 9211 | 2.39 | 10899 (run 40915924406, test comment) | **removed** |
| S25 | read-page:1262 | 2000 | "reads the 2 MB page of %s within 2 s" (2 cases) | the Attribute merge in a read | yes, line 1264 (by reading, as S10) | 768 (body start tags) | 2.60 | 768 | 2000 |
| S26 | read-page:1273 | 2000 | "reads the 2 MB page of one start tag holding distinct attributes, cut by the Attribute count" | the Attribute count in a read | yes, line 1275 (by reading, as S10) | not measured | n/a | none | 2000 |
| S27 | read-page:1287 | 3000 | "collects stylesheet URLs in one pass and stops at the eleventh" | the Work bound in a read: stylesheet links collected in one pass | no (line 1291 catches a fetch past the tenth sheet, not a slow collection) | 1807 | 1.66 | 1807 | **4000** raised |
| S28 | read-page:1384 | 10000 | "reads %s, cut by the List steps" (3 cases) | the List steps in a read | yes, line 1386 (by reading, as S13) | 2749 (adoption move with text) | 3.64 | 2749 | 10000 |
| S29 | read-page:1403 | 10000 | "reads a page fostered out of %s in linear time, uncut" (3 cases) | the List steps in a read: fostering stays linear | no (the page is uncut either way) | 3647 (table with text and a br) | 2.74 | 3647 | 10000 |
| S30 | url-analyser:1693 | 7000 (`DESCRIPTION_BOUND_MS`) | "a 2 MB meta description gives a bounded number of items, not an id-collision, in time" | SEC-4: the description is bounded before lexicon-1 reads it | no (line 1703 catches only a cut removed; mutant `pw` did not finish, ORV-139) | 2319 | 3.02 | 3005 (ORV-139 comment 10271) | 7000 |
| S31 | url-analyser:1716 | 5000 (`TITLE_BOUND_MS`) | "a 2 MB title is bounded the same way" | SEC-4: the title is bounded before lexicon-1 reads it | no (line 1719 catches only an uncut title) | 2095 | 2.39 | 2109 (run 40878076151) | 5000 |
| S32 | url-analyser:1749 | 3000 (`TIME_BOUND_MS`) | "every stylesheet route is linear through analyseUrl" "%s" (6 cases) | SEC-3 and SEC-4: each stylesheet route stays linear | no (lines 1752 and 1753 catch a lifted cap; mutants `cp` and `ch` did not finish, ORV-139) | 965 (1 MB of distinct hex colours) | 3.11 | 1155 (run 40878076151) | 3000 |
| S33 | colour:390 | 2000 (`TIME_BOUND_MS`) | "component() fails a 1 MB digit run ..." and "hueOf() fails a 1 MB digit run ..." | SEC-3: a number is read in linear time | no (a backtracking reader returns the same null or value) | not measured | n/a | none | 2000 |
| S34 | colour:422 | 4000 (`SHEET_BOUND_MS`) | "every route is linear in a 1 MB sheet" "%s" (12 cases) and "1 MB of distinct hex colours is read once each, in order of offset" | SEC-3: each route of `declaredColoursOf` stays linear | no (lines 451 and 462 to 464 hold for a slow route) | 664 (distinct hex colours) | 6.02 | 664 | 4000 |
| S35 | measures/page:365 | 3000 (`TIME_BOUND_MS`) | "every route is linear in a 1 MB sheet" "%s" (9 cases) and its two named tests | SEC-3: each route of `declaredFamiliesOf` stays linear | no (lines 399, 400 and 408 hold for a slow route) | 408 (font-family: with no end) | 7.35 | 408 | 3000 |
| S36 | spend-cap:429 | 3000 | "check answers unavailable within timeoutMs and leaves no waiting query" | the spend cap check honours `timeoutMs` (300) on a locked table | no (a check that ignores `timeoutMs` waits on the lock and ends at `LOCK_TIMEOUT`, 30,000) | 338 | 8.88 | 338 | 3000 |
| S37 | spend-cap:450 | 3000 | "record rejects within timeoutMs, leaves no waiting query and writes nothing" | the record honours `timeoutMs` (300) on a locked table | no (as S36) | 384 | 7.81 | 384 | 3000 |
| S38 | rate-limit.int:224 | 1000 | "a locked table is unavailable within the bound, and the database drops the work" | the shared rate limit store answers within `timeoutMs` (200) on a locked table | no (with the timer and `lock_timeout` both removed the call waits on the lock and ends at the auth `testTimeout`, 20,000) | 928 (whole test, which also holds a fixed 400 ms wait after the timed window) | 1.08 | 928 | **2000** raised |
| S39 | rate-limit:95 | 250 (`50 + 200`) | "returns unavailable within the timeout, with pruning on" | the limiter's timer with a store that never settles | no (a timer never set leaves the call pending until the auth `testTimeout`) | not measured (its file of 8 tests took 91) | n/a | none | 250 |
| S40 | read-ports:227 | 8000 (`TIMEOUT_BOUND_MS`) | "P4 a body that drips past timeoutMs answers timeout inside a CI-sized bound" | the port's wall clock stops a dripping body (P4) | no (the defect lets the drip run its 10 s; red on the clock) | 302 | 26.49 | 302 | 8000 |
| S41 | read-ports:391 | 8000 (`TIMEOUT_BOUND_MS`) | "a server that accepts and never answers ends as timeout inside a CI-sized bound" | the wall clock is armed before the response (F4) | no (the defect never answers; red on the clock or at `SLOW`, 20,000) | 303 | 26.40 | 303 | 8000 |

Of the 41, the PR removes seven (by `orv299-drop-1`), raises two (S27 and S38, by `orv299-size-1`) and keeps 32. The auth and web files: S36, S37, S40 and S41 time real timers, a database or a loopback server, and each sits at more than 7 times its CI time, so they stay as they are. S38 is the one auth bound with a ratio under 2 (1.08); its printed time includes a wait outside the timed window, and the rule is applied to it as written (open question 3). S39 has no CI time and keeps its value.

## Acceptance criteria

Tests read the files of the branch; none reaches a network beyond loopback. Every row is a test-only check, so every row renders nothing.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The base `d8e9025` and the PR head | The search of `orv299-class-1` runs from the repo root | No UI | On the base: 41 hits, each one survey row S1 to S41 by file and line. On the PR head: 34 hits, each a survey row whose column "New" is not **removed** (a line may move by the edits of `orv299-drop-1` and `orv299-name-1`), and no hit outside the survey | The search of `orv299-class-1`; the builder's `verified` row holds the hit count on both heads and the ids of the 34 |
| 2 | The survey | The builder applies `orv299-size-1` to the bounds `orv299-drop-1` leaves | No UI | Two bounds are raised: S27 3000 to 4000, S38 1000 to 2000. The other 32 keep their value; no bound is lower than on the base. Each framework timeout stays above its bound (`HEAVY_TIMEOUT` 60,000 for S27; the auth `testTimeout` 20,000 for S38) | `git diff -U0 origin/develop -- packages/intent-engine/src packages/auth/src apps/web`; one `verified` row per raised bound with the old value, the new value and its slowest CI time with the run id; W1 |
| 3 | The test of S11 ("stops the Element count at the push that would be the 1,048,577th") on the PR head | The test runs | No UI | It passes, and its body holds no clock assertion and no start variable: lines 805 and 808 of the base are gone, lines 806 and 807 stay | `pnpm --filter @orivilo/intent-engine exec vitest run src/page-text.test.ts -t "stops the Element count at the push that would be the 1,048,577th"`; the hunk of that test in `git diff origin/develop -- packages/intent-engine/src/page-text.test.ts` |
| 4 | S27 and S38 and their mutants, by `orv299-red-1` | The builder applies the mutant, runs the test and restores the code | No UI | S27: a stylesheet collection in `read-page` that costs more than one pass over the links (the builder names the change it made): red on the clock line or at `HEAVY_TIMEOUT`, or reported under `orv299-red-1` with its time. S38: `timeoutMs` multiplied by 15 in `packages/auth/src/rate-limit.ts` line 140 (3,000 ms for the timer and `lock_timeout`): red on the clock line (line 224 on the base) | One `verified` row per bound (two rows) with the mutant, the red line or timeout, and the time; `git diff` after each run shows no product file |
| 5 | The tests of S11 and S12 on the PR head, and the mutant ORV-139 `mutant-exception-1` records for them | The builder sets `MAX_ELEMENT_PUSHES = 1e18` (`packages/intent-engine/src/page-text.ts` line 68), runs each test and restores the code | No UI | S11: red on its value line (line 807 on the base), texts `['A']` instead of `[]`. S12: red on its value line (line 823 on the base), texts `['T']` instead of `[]` | One `verified` row each (two rows) with the red line on the PR head and the time; `git diff` after each run shows no product file |
| 6 | The tests of S4, S9, S17, S23 and S24 | The builder reads the diff of each test | No UI | No mutant is run for them. The hunk of each test removes only its clock line and its start variable (for S24 the `ms` of line 1247) and changes only the name or comment lines `orv299-name-1` lists; every assertion `orv299-drop-1` lists as staying is unchanged | `git diff origin/develop -- packages/intent-engine/src/page-text.test.ts packages/intent-engine/src/read-page.test.ts`; one `verified` row per test (five rows) |
| 7 | The mutant that lifts both `MAX_ELEMENT_PUSHES` and `MAX_LIST_STEPS` (S9 and S24) | The builder plans its mutant runs | No UI | The builder runs no mutant that ORV-139 records as aborting out of memory; the record (both lifted: out of memory, SIGABRT after 13.2 s) stands as the evidence | The builder's `verified` row lists every mutant it ran; none lifts both caps |
| 8 | The engine suite on the base and on the PR head | `pnpm --filter @orivilo/intent-engine exec vitest run --testTimeout=400` runs on each | No UI | The same tests fail it on both heads (the change gives no test new work) | Two counts and the two lists of failing test names in the builder's `verified` rows (a test whose name `orv299-name-1` changes is matched by its new name) |
| 9 | The three test files on the PR head | Their names and comments are read | No UI | By `orv299-name-1`: no name or comment states a removed bound or the time it was sized from, and the head comment of `page-text.test.ts`, the two read-page comments and the two new comment lines name ORV-299 | `grep -n -e "within 17 s" -e "within 15 s" -e "within 10 s" -e "within 16 s" -e "within 22 s" -e "12 s guard" -e "8,485" -e "7,287" -e "7,508" -e "10,899" packages/intent-engine/src/page-text.test.ts packages/intent-engine/src/read-page.test.ts` gives no hit; `grep -n "ORV-299" packages/intent-engine/src/page-text.test.ts packages/intent-engine/src/read-page.test.ts packages/auth/src/rate-limit.integration.test.ts` gives at least one hit in the page-text head comment, three in read-page and one in rate-limit.int |
| 10 | The PR head | The diff is listed | No UI | Only the three test files of "Lane" and files under `docs/specs/ORV-299/` changed | `git diff --name-only origin/develop...HEAD` |
| 11 | The PR head | The gate runs | No UI | It passes. S36 to S38 need the test database; the builder says whether they ran locally (CI runs them with `REQUIRE_DB_TESTS=1`) | `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`, real output in the builder's `verified` rows |
| 12 | The PR | Its CI runs | No UI | The run is green. The PR body lists each of the 41 bounds with its CI time and what happened to it (kept, raised or removed, the survey's column "New"), the PR's own CI run id, and the CI times of the tests of S27 and S38 on that run as a further sample | The PR's CI checks; the PR body |

## Rows that render nothing

- Rows: 1-12

## Out of scope

- Engine code and the work limits themselves (`MAX_ELEMENT_PUSHES`, `MAX_LIST_STEPS` and every other cap); the mutants of rows 4 and 5 are applied and restored, never committed.
- The value of `HEAVY_TIMEOUT` in any file: the highest bound after the PR, S14 at 18000, sits under 60,000, and the seven tests without a clock keep the timeout as it is.
- The bounds outside `orv299-class-1` (the ratio guards, the lower bound, the wait limits).
- A work-count assertion for the seven tests without a clock; `orv299-red-1` covers such an assertion only for a raised bound.
- The wording of `.claude/rules/testing.md` and of the lessons L-0042 and L-0046: if `orv299-drop-1` and `orv299-size-1` prove themselves, a wording change is a retro proposal after the merge.
- The timing flakes of browser plays (Storybook and Playwright), which have their own cards.
- The history in `docs/specs/ORV-139/spec.md`, which records the bounds and test names of its time.

## Open questions

All four are decided in ORV-299 comment 10778, by the main session under the owner's POC delegation (ADR 0012 decision 4). The answer not taken stays in one line as history.

1. **Clocks that no defect makes slow.** Decided: the other answer, which is now the rule `orv299-drop-1`. History: the default of v1.0 kept them as a backstop sized by `orv299-size-1` (S9 to 16000, S11 to 27000, S12 to 31000).
2. **S12 times one read of three.** Falls away: S12 holds no clock after `orv299-drop-1`. History: v1.0 sized it on the whole test (15169, giving 31000), and the other answer split the first read into a test of its own.
3. **S38's printed time includes a fixed 400 ms wait after its window.** Decided: the default, `orv299-size-1` as written, 1000 to 2000. History: the other answer kept 1000 as a named exception at a ratio of 1.08.
4. **The multiple.** Decided: the default, 2, as the ORV-139 rule `bound-ci-1` already used; the next CI samples, listed in the PR body (row 12), show whether 2 holds. History: a multiple of 3 would raise more bounds and needed its own pass of W1.

## Depends on

- ORV-299 (the card), ORV-299 comment 10775 (the CI times) and ORV-299 comment 10778 (the decision on the four open questions and the review passes); CI runs 44556398012 and 44693919786.
- `docs/specs/ORV-139/spec.md`: `bound-ci-1`, `bound-mutant-1`, `mutant-exception-1`, `bound-ratio-1` (the times and mutants this survey reuses).
- `.claude/rules/testing.md`, the time limit bullet; lessons L-0042 and L-0046.
- `docs/adr/0012-jira-states-by-environment.md` decision 4: the main session decides the open questions under the owner's POC delegation.

## Worked examples

Not run in this role: it has no shell. The main session ran W1 of v1.0 and it printed both expected lines of v1.0; line 1 is unchanged, line 2 is new in v1.1 and not run. The line runs from the repo root with `node -e`; the main session or the builder runs it and records the output. Inputs are copied from the survey: per measured row, the bound, its CI time on run 44693919786 and its slowest time seen.

W1. The column "Ratio" over the 36 measured rows, and `orv299-size-1` over the bounds `orv299-drop-1` leaves. Line 1 is each bound over its CI time on run 44693919786, rounded to 2 decimals by `toFixed(2)`. Line 2 skips the seven ids `orv299-drop-1` selects, which leaves 29 measured rows (the other 5 of the 34, S19, S20, S26, S33 and S39, have no CI time and keep their value), and prints each bound the rule changes: the larger of the bound and 2 times the slowest time seen rounded up to a whole 1,000 ms. Expected line 1: `S1:2.25 S2:3.13 S3:3.98 S4:2.78 S5:5.18 S6:5.37 S7:12.82 S8:4.16 S9:1.94 S10:4.29 S11:0.83 S12:0.79 S13:7.45 S14:9.68 S15:5.12 S16:18.69 S17:3.73 S18:3.19 S21:4.75 S22:3.68 S23:2.61 S24:2.39 S25:2.60 S27:1.66 S28:3.64 S29:2.74 S30:3.02 S31:2.39 S32:3.11 S34:6.02 S35:7.35 S36:8.88 S37:7.81 S38:1.08 S40:26.49 S41:26.40`. Expected line 2: `S27:3000 to 4000, S38:1000 to 2000`.

```bash
node -e 'const r=[["S1",5000,2218,2249],["S2",3000,958,958],["S3",2000,502,502],["S4",17000,6109,8485],["S5",2000,386,386],["S6",4000,745,745],["S7",2000,156,156],["S8",4000,961,1527],["S9",15000,7742,7742],["S10",2000,466,466],["S11",11000,13267,13267],["S12",12000,15169,15169],["S13",13000,1745,1745],["S14",18000,1859,1859],["S15",10000,1955,1955],["S16",2000,107,107],["S17",10000,2684,2684],["S18",4000,1254,1654],["S21",7000,1474,1474],["S22",2000,544,544],["S23",16000,6139,7508],["S24",22000,9211,10899],["S25",2000,768,768],["S27",3000,1807,1807],["S28",10000,2749,2749],["S29",10000,3647,3647],["S30",7000,2319,3005],["S31",5000,2095,2109],["S32",3000,965,1155],["S34",4000,664,664],["S35",3000,408,408],["S36",3000,338,338],["S37",3000,384,384],["S38",1000,928,928],["S40",8000,302,302],["S41",8000,303,303]];const gone=new Set(["S4","S9","S11","S12","S17","S23","S24"]);const size=(b,c)=>Math.max(b,Math.ceil(2*c/1000)*1000);console.log(r.map(([k,b,t])=>k+":"+(b/t).toFixed(2)).join(" "));console.log(r.filter(([k,b,,c])=>!gone.has(k)&&size(b,c)!==b).map(([k,b,,c])=>k+":"+b+" to "+size(b,c)).join(", "))'
```

## Changelog

- v1.0 (2026-11-20, task ORV-299-spec-1): first version. The survey of 41 wall-clock upper bounds in test code (S1 to S41) with their CI times on run 44693919786, four named rules, the sizing rule `orv299-size-1` (at least 2 times the slowest CI time seen, rounded up to a whole second, never lower), which changes five bounds in three test files (S9, S11, S12, S27, S38), rows 1 to 9 and four open questions with defaults. No Jira call and no shell in this role; W1 is not run. Downstream to review: the ORV-299 builder, reviewer and qa envelopes.
- v1.1 (2026-11-20, task ORV-299-spec-2): the decision of ORV-299 comment 10778. New rule `orv299-drop-1` removes the seven clock lines no defect can make red (S4, S9, S11, S12, S17, S23, S24) with what each test keeps; `orv299-size-1` now covers the 34 that stay and raises two (S27 to 4000, S38 to 2000); `orv299-red-1` covers those two; `orv299-name-1` lists every name and comment line to change; rows 1 to 12 replace rows 1 to 9; the four open questions are recorded as decided; W1 line 2 skips the removed seven; review is one reviewer pass and one security pass, no qa. Downstream to review: the ORV-299 builder, reviewer and security envelopes (no qa envelope).
