---
issue: ORV-267 (https://tpetkaew.atlassian.net/browse/ORV-267)
parent: ORV-266 (https://tpetkaew.atlassian.net/browse/ORV-266), docs/specs/ORV-266/spec.md v1.4
lane: L (the parent's lane)
mode: POC mode short spec, for a slice (`.claude/skills/ovl/SKILL.md`, step 2 and section "POC mode")
version: 1.2
---

# ORV-267: the form and the report page, slice B of ORV-266

## Why a slice

The parent's goal holds: one path from a brand's website address to a brand evidence report, which the owner can open on staging. ORV-266 ships that path in two PRs (parent, "Rows per PR"). PR 203 carries rows 1 to 9, the engine and the read ports, on the ORV-266 branch. This slice is the rest, the parent's rows 10 to 36 and its own row 37: the form and the report page, which is the half a person sees.

A branch and its PR carry one issue (`AGENTS.md`, "Git"), so this half has its own key on `feature/ORV-267-report-page`. The qa recorder reads the acceptance table at `docs/specs/<issue>/spec.md`, so the key needs this file (L-0016). The file adds one row, row 37, which proves the credentials clause of `url-input-1`, and changes one test cell, row 34's ("Changelog"). Otherwise the parent stays the home of each rule and string.

PR 204 is the form and the report page: the limit, the log route, the action, the report view, the page and the copy.

The page's readings are rule-based, not AI, and the stories run on labelled fixture reports. The parent's "What is real, rule-based and simulated" holds unchanged.

## Story

As a founder or designer who is signed in, I want to paste a brand's website address and see what its page declares and says, with where each value came from and what was not measured, so that I can trust a brand reading because I can check it.

## Parent and decisions

- **Parent spec:** `docs/specs/ORV-266/spec.md` v1.4. It holds the full text of the rules, "Strings", "Worked examples", "Out of scope" and the open questions.
- **Tech notes:** `docs/specs/ORV-266/tech.md`. This slice is its PR 2: tasks B3, B4 and B5 of section 9, with sections 5, 6 and 7 as their design.
- **G1 and G2:** ORV-266 comment 10603.
- **Where the screen lives:** the screen and its copy live in `packages/design-system`, by the owner's call on the parent card (ORV-266 comment 10603; tech notes D9). The three keys the parent's "Strings" places in `apps/web/i18n/messages.ts` stay there.

## Rules the rows use

Each rule is defined once, under "Rules" in the parent spec, and its full text is there. This slice restates none of them and defines no named rule. Row 37 proves the credentials clause of `url-input-1`.

<!-- prettier-ignore -->
| Rule | Rows that name it |
| --- | --- |
| `url-input-1` | 15, 37 |
| `role-input-1` | None by name; rows 14 and 15 carry the role choice it governs |
| `report-outcome-1` | 29 |
| `thin-page-1` | 27 |
| `report-view-1` | 17, 18, 19, 20, 21 |
| `report-source-1` | 18 |
| `report-list-1` | 31 |
| `report-text-1` | 32 |
| `page-read-limit-1` | 28 |
| `report-not-kept-1` | 35 |

Through these, two rules of `docs/specs/ORV-128/spec.md` apply unchanged: `competitor-not-read-1` through `role-input-1`, and `word-count-1` through `thin-page-1`.

## Acceptance criteria

Rows 10 to 33, 35 and 36 are the parent's rows, word for word, with their numbers. Row 34 is the parent's row with a new Check cell, and row 37 is new in this slice ("Changelog"). A key in a row is in the parent's "Strings" or in its reused list, with its Thai and English. Tests use fake ports or a local server and never reach the internet (ADR 0009 point 8). The page rows are proven on stories `Examples/Application: Brand report` (names suggested), one story per state on a labelled fixture report, in both languages, because a signed-in page cannot be opened on a QA checkout without a Google session. Test names are suggested.

"Worked examples" in a row means the parent's section of that name. "Row 5" in row 26 means the parent's row 5, which PR 203 carries.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 10 | A person who is not signed in | They open `/read` | `brandReport.heading`, the line `brandReport.signedOut` ("Sign in to read a website.", "ลงชื่อเข้าใช้ก่อน แล้วจึงอ่านเว็บไซต์ได้"), and the link `brandReport.signInLink` to `/account`. No form | None | `page.test.tsx` "signed out"; story `SignedOut` |
| 11 | An environment with no auth or database set up | They open `/read` | `brandReport.heading` and `brandReport.notConfigured`. No form | None | `page.test.tsx` "not configured"; `e2e/pages.a11y.spec.ts` gains the page |
| 12 | The form is open and the session has ended, or the action is called with no session | They submit | `saved.errors.signed-out` ("Your session has ended. Sign in again and retry."). The address stays in the field | No port is called | `actions.test.ts` "signed out"; story `SessionEnded` |
| 13 | The home page | It loads | A link `home.openBrandReport` to `/read` | None | `apps/web` home page test |
| 14 | The form, signed in | They submit with an empty field, or with no role chosen | `brandReport.urlRequired`, or `brandReport.roleRequired`, on that field | No call to the server, so no count | Story `Invalid`, play |
| 15 | The form, signed in | They paste ` example.com ` and choose `brandReport.roleOwn` | The report for `https://example.com/`, its `brandReport.pageRead` line naming that URL | `readUrlInput` gets `https://example.com` by `url-input-1` ("Worked examples") | `actions.test.ts` "url input" |
| 16 | A read is running | They press `brandReport.submit` again | The button is disabled, and `brandReport.pending` shows as a status line | One action call only | Story `Pending`, play |
| 17 | An `analysed` report | It shows | Header of `report-view-1`, section 1: the label "Read by fixed rules, not by AI. Confidence numbers come from the same rules, not from a test of accuracy." ("อ่านด้วยกฎที่กำหนดไว้ ไม่ได้ใช้ AI ตัวเลขความมั่นใจก็มาจากกฎเดียวกัน ไม่ได้มาจากการทดสอบความแม่นยำ"), `brandReport.notSaved`, the URL read, the read time and the role | None | Story `Analysed`, play |
| 18 | A report built from `HTML_A` and `CSS_A` | It shows | Colours and Fonts of `report-view-1`, sections 3 and 4: `#FF7A00` orange and `#0000FF` violet (the ORV-20 band, "Worked examples"), `inter`, each with a `brandReport.sourceSheet` line naming `https://clinic.example/a.css` (`report-source-1`); `brandReport.declaredNote`; no word that ranks them | None | Story `Analysed`, play reads the text |
| 19 | The same report | It shows | Text of `report-view-1`, section 5: one line each for title, description, headings and body with their counts, `brandReport.textNote`, and the `brandReport.sourcePage` line. No page text beyond the quotes of readings | None | Story `Analysed`, play |
| 20 | A report from the headings of `HTML_A` and two body blocks of 20 words or more, one holding `premium` and one holding `not too premium` | It shows | Personality of `report-view-1`, section 6: `report.conflictsNotChecked`; five axes; under `premium` the two body leans side by side, each with quote, source, rule ids and confidence; `brandReport.hypothesis` under the "not too premium" lean; the heading readings under `evidence.belowFloor` with "the text has fewer than 20 words" ("ข้อความมีไม่ถึง 20 คำ"); `brandReport.noSignal` under an axis with none; no English `hypothesisNote` text | None | Story `Personality`, play |
| 21 | The report of row 18 | It shows | Not measured of `report-view-1`, section 7: "Not measured: colour areas. The page was not rendered (no renderer is set up)." ("ไม่ได้วัด: สัดส่วนพื้นที่สี เพราะไม่ได้แสดงผลหน้าเว็บ (ยังไม่ได้ตั้งค่าตัวแสดงผล)"), the same for the other three, then `brandReport.notReadIndustryMood` and `brandReport.notReadSources`. Nothing on the page states a business type, a mood, a colour area, a contrast or a density | None | Story `Analysed`, play checks the six lines; the section is present on `Incomplete` and `ThinPage` too |
| 22 | A `refused` report with `read.refused.address` | It shows | Alert `warning`: "We can read only public web addresses." ("เราอ่านได้เฉพาะที่อยู่เว็บสาธารณะเท่านั้น"). No report sections. The address stays in the field | None | Story `RefusedAddress` |
| 23 | A `refused` report with `read.refused.robots` | It shows | Alert `warning`: "This site asks automated readers not to read this page, so we did not read it." ("เว็บไซต์นี้ขอไม่ให้โปรแกรมอัตโนมัติอ่านหน้านี้ เราจึงไม่ได้อ่าน"). No report sections | None | Story `RefusedRobots` |
| 24 | A report with `read.failed.timeout` | It shows | Alert `danger`: `read.failed.timeout` ("This page took too long to answer, so we stopped. Try again later.", "หน้านี้ตอบช้าเกินไป เราจึงหยุดอ่าน ลองใหม่ภายหลัง"). No report sections. The address stays in the field | None | Story `FailedTimeout` |
| 25 | A report of each of `read.failed.network`, `read.failed.redirects`, `read.failed.notHtml` | It shows | Alert `danger` with that line. No report sections | None | Story `FailedOther`, one state per key |
| 26 | The report of row 5 | It shows | `brandReport.incomplete` (Alert `warning`) above the sections, the sections still shown, and under `premium` the reading under `evidence.belowFloor` with "part of the page did not load", and `brandReport.noSignal` | None | Story `Incomplete`, play |
| 27 | `HTML_B` (`url-analyser.test.ts` line 708); heading and body text of 19 words; of 20 words; a page with only a title and a meta description | It shows | `brandReport.thin` (Alert `warning`) on the first, second and fourth, by `thin-page-1` ("Worked examples"), not on the third. The sections still show, with `brandReport.coloursEmpty`, `brandReport.fontsEmpty` or `brandReport.textEmpty` where a section has nothing | None | `report-view.test.ts` "thin page", one case each; story `ThinPage`, play |
| 28 | The person has used up the hourly window of `page-read-limit-1` | They submit, with `retryAfter` 1200 | "Too many requests in a short time, so this was not done. Try again in 20 minutes." ("ส่งคำขอถี่เกินไป จึงยังไม่ได้ทำรายการนี้ ลองใหม่ได้ในอีก 20 นาที") | No port is called; the answer has code `RATE_LIMITED` and `retryAfter` | `actions.test.ts` "rate limit"; `limits.test.ts` pins `page-read-limit-1`; story `RateLimited` |
| 29 | The limit store fails; separately, the read gives no report (`report-outcome-1`) or the action call is rejected | They submit | `brandReport.unavailable`; separately `saved.errors.failed` ("That did not work. Try again.", "ทำไม่สำเร็จ ลองอีกครั้ง"), and the form works again | No port is called when the store fails | `actions.test.ts` "store fails closed" and "no report"; stories `Unavailable` and `Failed` |
| 30 | A `not-read` report | It shows | `brandReport.address` with the address as text, and `read.notRead.competitor`. No report sections | None | Story `NotRead` |
| 31 | A report with 300 distinct colours | It shows | The entries `report-list-1` allows, then `brandReport.more` with the number left out | The whole view stays under 256 KB (tech notes, test V1) | `report-view.test.ts`; story `LongLists`, play |
| 32 | A fixture report whose quote is `<img src=x onerror=alert(1)>` and whose URL ends in `"><script>` | It shows | Both as literal text; no image, no script, no link (`report-text-1`) | None | Story `UntrustedText`, play |
| 33 | An `analysed` report on the page | They press the other language in the header | The same report in the other language: headings, notices, hue labels, axis labels and not-measured lines. Values from the page stay as read. The Thai text has no letter spacing | No second read, no count | A test of the page's client part: a spy on the read action records no second call. Stories `Analysed` and `Incomplete` in both languages |
| 34 | A viewport 360 px wide, a report with a 2,048-character URL, a 500-character element path and a long Thai word with no spaces | It shows, in both languages, light and dark | Every line wraps inside the page; no horizontal scroll | None | Stories `NarrowLight`, `NarrowDark` and `NarrowEnglish`, play on the 360 px frame: the frame is at most 360 px wide, its `scrollWidth` is at most its `clientWidth`, and every element's right edge is inside the frame. The real 360 px viewport check is a Playwright probe in the qa walk, in Thai and English: `document.documentElement.scrollWidth` is at most 360 |
| 35 | A read through the action | It ends, in each result | No UI | No table, migration or file is added by this story; the log line has route `read/analysePage` and outcome `ok`, `limited`, `unavailable` or `failed`, and it and the `page-read` step line hold no address (`report-not-kept-1`) | `actions.test.ts` "log line"; `git diff --stat origin/develop -- packages/db` is empty |
| 36 | The PR head | The gate runs | No UI | Thai and English keys match; no middot or em dash in the new copy; the route's duration limit is above the 30 s of `TOTAL_BUDGET_MS`; no model client is imported on this path | `check-i18n`; `apps/web/i18n/messages.test.ts`; a test on the duration limit; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` |
| 37 | The form, signed in | They submit `https:/user:secret@example.com/` with `brandReport.roleOwn`; separately, with `brandReport.roleCompetitor` | Under both roles, Alert `warning`: "We can read only public web addresses." ("เราอ่านได้เฉพาะที่อยู่เว็บสาธารณะเท่านั้น"), never `read.notRead.competitor`. No report sections. The address stays in the field as the person typed it | `readUrlInput` and `reportOf` each get the trimmed text as written, by `url-input-1`. Both roles end `refused` with `read.refused.address`: role own at `allowedUrl` in `readPage`, role competitor at `syntacticallyAllowed` in `readUrlInput`. No `resolve` or `request` port call. The view is `{ status: "refused", url: "https://example.com/", urlCut: false, line: "read.refused.address" }` | `actions.test.ts` "credentials before url-input-1", with `https:/user:secret@example.com/` under both roles: no `resolve` or `request` call, `readUrlInput` and `reportOf` get the text as written, and `secret` is nowhere in `JSON.stringify(view)` |

## Rows per PR

The recorder reads digits only (`qa-scope-1`).

- PR 204: rows 10-37

## Rows that render nothing

- Rows: 35, 36, 37

Row 35 is an action test and a diff, row 36 is a gate run, and row 37 is an action test. The screen row 37 ends on is row 22's, which story `RefusedAddress` proves.

## Worked examples

This slice derives no number. Its two examples are below: the credentials clause of `url-input-1`, and the address in row 37's view. The other examples behind its rows are in the parent's "Worked examples", and the main session ran them against parent v1.1: `url-input-1` (row 15), "Hue band" and "Font name" (row 18), "Confidence on an incomplete page" (row 26, through the parent's row 5), `thin-page-1` (row 27), and "The wait in row 28".

Task `ORV-267-build-5` ran the first line and it printed the expected text. The second line is new in v1.2 and was not run in this role, which has no shell. The builder runs it and reports a difference.

**`url-input-1`, the credentials clause (row 37).** Input: `https:/user:secret@example.com/` from finding SEC-266-9, then the six forms of the parent's `url-input-1` example. Output: what `readUrlInput` gets, one line each, unrounded text.

```bash
node -e "const c=t=>{try{const u=new URL(t);return Boolean(u.username||u.password)}catch{return false}};const urlOf=t=>/^[a-z][a-z0-9+.-]*:\/\//i.test(t)?t:'https://'+t;for(const s of ['https:/user:secret@example.com/','example.com','  https://clinic.example/  ','HTTP://clinic.example/','localhost:3000','javascript:alert(1)','ftp://example.com/']){const t=s.trim();console.log(c(t)?t:urlOf(t))}"
```

Expected: `https:/user:secret@example.com/`, `https://example.com`, `https://clinic.example/`, `HTTP://clinic.example/`, `https://localhost:3000`, `https://javascript:alert(1)`, `ftp://example.com/`. The first line is the row's case. The other six are the parent's expected lines, unchanged.

**Row 37, the address in the view.** Input: the same text. Output: what `refusedUrlOf` gives by `report-outcome-1`, unrounded text.

```bash
node -e "const o=new URL('https:/user:secret@example.com/').origin;console.log(o==='null'?'':o+'/')"
```

Expected: `https://example.com/`. This is the row's `url`, and `actions.test.ts` line 433 pins it on this branch.

## Out of scope

- Rows 1 to 9, which PR 203 carries under the parent.
- The parent's "Out of scope", unchanged.

## Open questions

None new. The parent's open questions and their defaults stand. Credentials inside the path or query of a clean URL (finding SEC-266-9) are the parent's open question 11, which is that question's one home. Question 7 was about PR 203's copy: the four `read.failed.*` lines in `packages/intent-engine/src/evidence-strings.ts` on this branch hold the parent's words.

## Depends on

- PR 203, the parent's rows 1 to 9. `reportOf` and `apps/web/server/read-ports.ts` are on this branch. Row 37's view needs the `refusedUrlOf` of parent v1.3, which this branch holds from PR 203 at `38e9538`.
- The parent's "Depends on", unchanged. For this PR that includes the `DESIGN.md` §11 design gate and the `security` review.

## Changelog

- v1.2 (2026-11-07): this file now agrees with parent v1.3 and v1.4. No row changes its number or its outcome. Parent `url-input-1` now holds the credentials clause, so row 37's Data effect points to that rule and no longer restates it; the Why, "Rules the rows use" and the first worked example follow. The second worked example now gives the `refusedUrlOf` of parent v1.3, which this branch holds, so its old first line is gone and `actions.test.ts` line 433 replaces the old pin; it was not run. "Depends on" names `38e9538`. The open question on credentials inside the path or query of a clean URL left this file for parent open question 11, and a pointer stays. Parent row 34 stays as it is, and changelog v1.1 here records the difference. "Rows per PR" names PR 204, and its placeholder note is gone. No code changes. Task `ORV-267-spec-3`. Downstream to review: the qa envelope (the Rows per PR line, row 37's Data effect), the `security` envelope of this PR, and `docs/specs/ORV-266/spec.md` and `docs/specs/ORV-266/tech.md` (changed in this task).
- v1.1 (2026-11-07): rows 34 and 37 now differ from the parent. Row 34: only the Check cell changes, because the vitest browser is 1200 px wide, so a play cannot read `document.documentElement.scrollWidth` at 360 (deviation of task `ORV-267-build-3`). Row 37 is new, for finding SEC-266-9 of task `ORV-266-security-2`: `url-input-1` could turn credentials into a path before any check saw them. Every other row stays byte for byte. "Rows per PR", "Rows that render nothing", "Worked examples", "Open questions" and "Depends on" take row 37. Task `ORV-267-spec-2`. Downstream to review: `apps/web/app/read/actions.ts` and `actions.test.ts` (row 37), this branch's base (PR 203 at `9f0ce54`), the builder envelope of row 37, the `security` envelope of this PR, the qa envelope (row 34's Playwright probe, the Rows per PR line), `docs/specs/ORV-266/spec.md` (`url-input-1`, row 34) and `docs/specs/ORV-266/tech.md` (section 5 point 5, test A6).
- v1.0 (2026-11-07): first version, the slice spec of ORV-266 slice B, with rows 10 to 36 copied from parent v1.1. No new requirement, no changed row and no new rule. Task `ORV-267-spec-1`. Downstream to review: the builder envelopes of tasks B3 to B5, and the qa envelope once the Rows per PR line holds the PR number.
