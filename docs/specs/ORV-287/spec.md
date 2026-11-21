---
issue: ORV-287 (https://tpetkaew.atlassian.net/browse/ORV-287)
follows: ORV-283 (https://tpetkaew.atlassian.net/browse/ORV-283), docs/specs/ORV-283/spec.md v1.1, slice 3 of ORV-281
lane: L (a new migration changes the stored shape check of the tenant table `business_reading`; `businessService.open` changes how a project opens, which is data access)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.2
---

# ORV-287: seven follow-ups of the business read, as one PR

## Why

The business read (ORV-283, slice 3 of the business-first story ORV-281) merged with seven Suggestions left open from its reviews. None of them blocked that review. Each one either leaves a test that cannot go red, lets a wrong line reach a person, or lets the database hold a row the app would never write. This card closes all seven in one PR, so that the business read is as tight as its reviews asked before later jobs build on it.

The sources, read as data and checked against the code on this branch:

- Code review 1 of ORV-283 (`ORV-283-review-1`, verdict request changes on head `e5a688c`): findings S-1 to S-6. Its finding F-1 (who marked the evaluation set) was settled in ORV-283 itself (ORV-283 spec v1.1, row 34) and is not part of this card.
- Security review 1 of ORV-283 (`ORV-283-security-1`, verdict approve): finding ORV-283-sec-1. Its finding ORV-283-sec-2 (an aborted call that records no cost) sits on ORV-171 and is not part of this card.

Gates. Lane L: the card changes the stored shape check of a tenant table and how the workspace service opens a project. G1 and G2 are raised on this spec; during the POC Claude passes them under the owner's delegation (ADR 0012 decision 4).

This spec is not a guard on a tool call, so the guard frame does not apply.

### What changes for a person

- A project whose saved AI reading has gone bad opens with its answers, as a project with no reading does, instead of a "not found" page (S-3).
- In an environment with no AI key, saving a project no longer uses up the person's AI reading limit, so the board never says "You have reached the limit for AI readings" when AI is simply not set up (S-4).
- Nothing else is visible. The line "Read by AI (model). Check it before you use it." keeps its words in both languages and moves into the locale catalog, where the copy check reads it (S-5). The rest are tests (S-1, S-2, S-6) and a database check (ORV-283-sec-1).

### What is real

Every item is deterministic code, tests, a database check or wording. No new model call, no prompt change, no new model job and no recorder run. The only string that moves is `evidence.fromModel`, with its Thai and English words unchanged. Tests replay recordings and fake the network; none reaches a model (ADR 0009 point 8). Stories run on labelled fixture projects.

## Story

As a founder or product owner who is signed in, I want my business project to open with my own answers even when its saved AI reading cannot be used, and the board to say "AI is not set up" rather than "limit reached" when there is no AI, so that what the board tells me about AI is always true.

## Rules

Each rule below is defined here once; the rows and the other sections point to it by name.

### orv287-mark-cover-1

The converse half of clause 4 of the evaluation test (`business-read-eval.test.ts`). For every replay of kind `accepted`, take each reading item (`readingItems`) and its key: the case id, the item's `reading.target`, and its value by `valueOf`. For each distinct key, count the reading items with that key across the accepted replays (normally 1) and the marks of `eval/marks.json` with the same `caseId`, `target` and `value`. When the two counts differ, the clause gives one problem line `<caseId> <target> <value>: marks <m>, readings <r>`. Clause 4 passes only when both halves give no line: today's half (each mark names an accepted reading) and this one. Worked example W2.

### orv287-key-first-1

In `apps/web/server/business-read.ts`, the server reads `OPENROUTER_API_KEY` before step 6 of the parent rule `business-door-1` (ORV-281 spec). With no key, the saved record is `rule-based` with the reason `ai-not-configured`, and steps 6, 7 and 8 do not run: no `ai-read` count is consumed, the spend cap is not read, no model is called and no usage is recorded. The step line is `business-read` with the outcome `not-configured`, as today. With a key, the order of `.claude/rules/security.md` rule 6 is unchanged: the `ai-read` limit, then the spend cap, then the one call.

### orv287-unparsed-reading-1

When the newest intake of a project parses (`storedIntakeSchema`) and its `business-read` row does not parse (`businessReadingSchema`), `businessService.open` (`packages/auth/src/business.ts`) does not throw. It returns the project and the intake with `reading: null`, and writes one step line: step `business-read`, outcome `stored-invalid` (a new member of the closed list `STEP_OUTCOMES["business-read"]` in `packages/auth/src/log.ts`), level `warn`. The line carries only the closed fields `logStep` writes; no project id, intake id, project name, answer, email, model id or stored text. The row is neither changed nor deleted. The loader `loadProject` (`apps/web/app/business/data.ts`) answers `ready` with a view whose `reading.status` is `none` and ends with its boundary line `ok`, so the screen shows what it shows for a project that has no reading: the person's words under `business.label.yourWords`, with no AI line and no `business.label.aiUnavailable`. Opening still never calls the model, counts no limit and writes no reading. Unchanged: an intake row that does not parse answers `not-found` with the error boundary line `failed`; a project of another workspace and an unknown id answer the same `not-found` (`.claude/rules/security.md` rule 9).

### orv287-shape-1

A new migration, with the next free number at build time, replaces the check `business_reading_shape` of migration 0010 (line 23) with this expression, in one `ALTER TABLE "business_reading"` statement that drops the old check and adds the new one under the same name. Migration 0010 is not edited.

```sql
("method" = 'model') = ("reason" is null and "model_id" is not null and "adapter_id" is not null and "adapter_version" is not null and "prompt_version" is not null)
and ("method" <> 'rule-based' or ("evidence" = '[]'::jsonb and "reason" is not null and "model_id" is null and "adapter_id" is null and "adapter_version" is null and "prompt_version" is null))
and ("method" <> 'model' or (case when jsonb_typeof("evidence") = 'array' then jsonb_array_length("evidence") <= 200 else false end))
```

- The first line is today's clause, kept.
- The second line: a `rule-based` row has `evidence` `'[]'` (kept), a reason, and all four model columns null: `model_id`, `adapter_id`, `adapter_version`, `prompt_version`.
- The third line: a `model` row has evidence whose `jsonb_typeof` is `array`, of at most 200 items, the record's `BUSINESS_RECORD_MAX_ITEMS` (`reading.ts` line 46). The `case` keeps `jsonb_array_length` from ever running on an object or a scalar, so a bad row fails with the check violation `23514` on `business_reading_shape`, never with another error.
- No clause on `job`. Tech notes section 11 (`docs/specs/ORV-281/tech.md` line 408) keeps room for a later job to write rows in `business_reading` with its own `job` value, and `access.test.ts` already writes `other-job`, `cross-job` and `reason-<reason>` rows to prove the one-per-job rule and the policy. A `job = 'business-read'` clause would close that room. The column keeps its length check of 1 to 40 (`business_reading_job_check`), and `businessReadingSchema` keeps the job closed to `business-read` on every write and read.
- `packages/db/src/schema/business.ts` declares the same expression, so `pnpm --filter @orivilo/db generate` writes no further migration.

**Rows already stored.** Before the new check is added, this read-only query counts the stored rows it would refuse; the expected count is 0:

```sql
select count(*) from business_reading where not (<the expression above>);
```

The builder runs it on the local development database at `develop`'s head, holding rows written through the app, and records the count. Whoever runs the staging migration runs it there first. If a stored row would break the check, `ADD CONSTRAINT` validates it and fails, the migration fails, and nothing changes: the drop and the add are one statement, so a failed add leaves the old check in place. If PostgreSQL refuses the drop and the add of one name in one statement, the builder puts the two statements in one explicit transaction in the migration file and records it as a `verified` row. That is safe on staging, because only the app role writes these rows, through `saveReading`, after `businessReadingSchema` (which writes a reason and four null model columns for a `rule-based` record and the items array for a `model` record, `business.ts` lines 127 to 140). Worked example W1.

**As built (ORV-293, 2026-11-19).** Migration 0014 (`0014_business_reading_shape_tight.sql`) is two statements, a drop and then an add, where this rule words one. As the PR 229 body and its reviews (ORV-287-sec-1, ORV-287-review-1-S1) state, the migrator runs each migration file in one transaction, so a failed add leaves the old check in place all the same; this line does not check the library itself. The staging run "Migrate staging" of release PR 231 passed on 2026-11-19, so no stored row broke the check; the count of stored rows was not measured, because no agent connects to the staging database.

## Acceptance criteria

Tests use fixtures, a fake network and recorded or typed model answers; none reaches a model (ADR 0009 point 8). The database rows run with `REQUIRE_DB_TESTS=1` against the test database. Test names are suggested. Each row states the values its test asserts. A row for a test-only item (rows 1, 2 and 9) is proven by its named test seen red first, on today's code or on the named mutant, then green.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The replays of the evaluation set and, in turn: `marks.json` as stored; `marks.json` without its first mark (`th-01`, `situation.name`, "ครัวบ้านไร่"); `marks.json` with its third mark (`th-01`, `competitive-frame.alternatives`, "ข้าวกล่องหน้าปากซอย") twice | Clause 4 runs with `orv287-mark-cover-1` | No UI | `[]` for the stored marks; `["th-01 situation.name ครัวบ้านไร่: marks 0, readings 1"]` for the second; `["th-01 competitive-frame.alternatives ข้าวกล่องหน้าปากซอย: marks 2, readings 1"]` for the third. Today's half of clause 4 keeps its four refusals (no case, a refused answer, another target, another value). The G3 counts of ORV-283 row 34 are unchanged | `business-read-eval.test.ts` "clause 4: each accepted reading has exactly one mark" and "clause 4 sees a missing and a repeated mark"; the second is red first on today's clause 4, which gives `[]` for both |
| 2 | An `OPENROUTER_API_KEY`, and a fake network whose model reply is, in turn, each answer of ORV-283 row 28: an extra key `confidence`; a quote not in the answers; a reading on `positioning.value`; a reading on `situation.industry` | They submit a valid intake (`createProject`) | No UI | Each time: the action answers `{ ok: true, value: { projectId } }`; one project and one intake saved; one fetch, to the pinned model with `allow_fallbacks` false, and no other; the saved record is `{ method: "rule-based", job: "business-read", intakeId, reason: "ai-failed" }`; one step line `business-read` with outcome `refused` and level `warn`; the usage recorded once. The engine test "refused answers" no longer builds a rule-based record itself (`business-read.test.ts` lines 317 to 324 go) | `actions.test.ts` "a refused answer" as `it.each` over the four answers; red first on the mutant that saves `ai-not-configured` for a refusal in `apps/web/server/business-read.ts` (all four red), then restored |
| 3 | A saved project whose `business_reading` row the owner role changed, in turn: evidence `[{ "not": "an item" }]`; `model_id` `other/model` (the two rows of today's T40 tests) | `businessService.open` runs for a member of the workspace | No UI | By `orv287-unparsed-reading-1`: `open` resolves with the project, its newest intake and `reading: null`; one line `{ step: "business-read", outcome: "stored-invalid", level: "warn" }`; no line holds `Tam`, `tampered@example.com`, `an item`, `other/model`, the project id or the intake id; the row is byte-equal before and after. `STEP_OUTCOMES["business-read"]` holds nine outcomes, `stored-invalid` the ninth | `business.integration.test.ts` "opens a project whose reading no longer parses, with no reading (T40)", both cases, with a spy on the logger, red first on today's throw; `log.test.ts` (T41) |
| 4 | In turn: a project whose newest intake row was changed so it no longer parses; a project of another workspace; an unknown id | `businessService.open`, then `loadProject`, runs | No UI | Unchanged by this card: `open` throws `invalid-stored` for the first and `not-found` for the other two; `loadProject` answers `not-found` for all three, the first with the boundary line `{ outcome: "failed", level: "error", reason: "failed" }`, the other two with `{ outcome: "refused", reason: "not-found" }`; the page calls `notFound()` with the one 404 body | `business.integration.test.ts` T11 "shows a row changed outside the app as invalid" and T12; `data.test.ts`; `[projectId]/page.test.tsx` "a stored row that fails its own check is the same 404, and an error line", its stored row now an intake row |
| 5 | The service of row 3: a project with its intake and `reading: null` after a row that no longer parses | They open the project's page, then a node of its board | The board under the lede with no "AI did not read these answers, so only your own words are shown." ("AI ไม่ได้อ่านคำตอบเหล่านี้ จึงแสดงเฉพาะคำของคุณเอง") and no "Read by AI" line; in a node, each given answer under "Your words, placed here by fixed rules. Not read by AI." ("คำของคุณเอง วางไว้ตรงนี้ด้วยกฎที่กำหนดไว้ ไม่ได้ให้ AI อ่าน"), as for a project with no reading | `loadProject` answers `{ access: "ready", view }` with `view.reading` `{ status: "none" }` and its boundary line `ok`; no model call, no limit counted, nothing written | `data.test.ts` "a stored reading that no longer parses opens with no reading" (it replaces "answers the page's one 404 for a stored reading that no longer parses, with an error line"); `[projectId]/page.test.tsx`, in `en` and `th`; stories `Viewers` and `ViewersEnglish` (a view with reading status `none`), play, as they are |
| 6 | No `OPENROUTER_API_KEY`, and in turn: the `ai-read` count at 0; the `ai-read` count at the max of its first window (as today's "the ai-read limit used up" case sets it); the `ai-read` store down for the `ai-read` count; the spend cap `capped` | They submit a valid intake (`createProject`) | No UI | By `orv287-key-first-1`, each time: the saved record is `rule-based` with the reason `ai-not-configured`, never `ai-rate-limited`, `ai-spend-cap` or `ai-failed`; the `ai-read` counter in the fake store is unchanged (absent in the first case, at the max in the second); `state.order` holds one `consume` (the `write` limit) and no `spend-check`; no fetch; no usage; one step line `not-configured` | `actions.test.ts` "no key" as `it.each` over the four; each case is red first on today's order (the counter at 1; then `ai-rate-limited`, `ai-failed` and `ai-spend-cap`) |
| 7 | An `OPENROUTER_API_KEY` and a model reply that parses (the recorded answer of today's tests) | They submit a valid intake | No UI | `state.order` holds, after `save`: the `ai-read` `consume`, then `spend-check`, then the one model call, then `usage`, then `save-reading`; the `ai-read` counter goes up by one; the record is `model` | `actions.test.ts` "steps 6 to 9 start only after the save committed", extended with the order of the model call |
| 8 | The fixture of ORV-283 row 33 (the stories `Readings` and `ReadingsEnglish`) | They open Audience | Under each reading, word for word as today: "Read by AI (anthropic/claude-sonnet-5.5). Check it before you use it." in English and "AI อ่านค่านี้ (anthropic/claude-sonnet-5.5) โปรดตรวจสอบก่อนนำไปใช้" in Thai | None. The line is read from the catalog key `brandReport.engine["evidence.fromModel"]` in `packages/design-system/src/i18n/messages/en.ts` and `th.ts`, not from the engine's `EVIDENCE_STRINGS`; `fromModelNote` takes the messages as `belowFloorLine` does | Stories `Readings` and `ReadingsEnglish`, play, as they are; `brand-report-strings.test.ts`: the word-for-word test covers the new key, and "holds every key" lists `evidence.fromModel` with a comment that the business board reads it; `business-strings.test.ts` "the AI line reads the catalog": with a messages object whose `evidence.fromModel` line is changed, `fromModelNote` returns the changed line, red first on today's `fromModelNote`; `packages/design-system/tests/check-i18n.test.ts` "have the same keys in every locale" and "spell the same placeholders for every key", over the new key and its `{model}` slot in `en.ts` and `th.ts` |
| 9 | The two fixture records the reading stories use (`THAI_READ_VIEW` and `ENGLISH_READ_VIEW`, built by `readingOf` in `business-fixtures.ts`), and for each the same readings written as a typed model answer | `readBusiness` runs on that answer through a fake completion, with the intake id `fixture`, the fixtures' saved time and a hash function that returns the fixtures' hash | No UI | The items of `readBusiness`'s record deep-equal the fixture record's items, in the same order. When the test is red on today's fixtures, `readingOf` is corrected to match the adapter, never the reverse | `business-fixtures.test.ts` "story fixtures match the adapter"; red first on the mutant that drops the `single-signal` factor in `readingOf`, then restored |
| 10 | The migration of `orv287-shape-1` applied | The owner role inserts a `rule-based` row with `reason` null and the four model columns null | No UI | Refused with `23514` on `business_reading_shape` | `access.test.ts` "refuses a rule-based record with no reason (T9)", red first without the second line's `reason is not null` |
| 11 | As row 10 | The owner role inserts a `rule-based` row with the reason `ai-failed` and, in turn, only `model_id` `m`; only `adapter_id` `a`; only `adapter_version` `1`; only `prompt_version` `p` | No UI | Refused each time with `23514` on `business_reading_shape` | `access.test.ts`, one case per column; each red first without its column's `is null` in the second line |
| 12 | As row 10 | The owner role inserts a `model` row with the four model columns set and, in turn, evidence `{"x":1}`; `"text"`; `1` | No UI | Refused each time with `23514` on `business_reading_shape`, and no other error code | `access.test.ts`, one case per value; each red first without the third line |
| 13 | As row 10 | The owner role inserts a `model` row with evidence of 201 items, then one with 200 items | No UI | The first refused with `23514` on `business_reading_shape`; the second kept, with its evidence as written | `access.test.ts` "refuses evidence past 200 items" and "keeps evidence of 200 items"; the first red first with the bound at 201 |
| 14 | The PR head | The database tests and the gate run | No UI | One new migration file and its meta, numbered after the last migration on `develop` at build time; `git diff origin/develop -- packages/db/migrations/0010_business_reading.sql` is empty; `pnpm --filter @orivilo/db generate` writes nothing new; every existing `business_reading` case of `access.test.ts` (each refusal of lines 444 to 472, the four reasons kept, the model row at its longest bounds) passes unchanged; the query of "Rows already stored" gives 0 on the builder's database | `access.test.ts`; `migrate.test.ts`; the builder's `verified` rows with the generate output and the query count; gate output |

## Rows per PR

- PR 229: rows 1-14

## Rows that render nothing

- Rows: 1-4, 6, 7, 9-14

Rows 5 and 8 render; both are proven on existing stories and, for row 5, the page test.

## Docs bookkeeping

Written by the builder in this PR, in `docs/specs/ORV-281/tech.md`, as dated additions or corrections of a statement this card makes wrong. They add no row. Each is proven by a grep that the reviewer reads.

- **Section 5.2, the caps.** Already true on this branch: line 178 ("Bounds, as built") names the record's caps of 100 (`modelId`) and 20 (`adapter.version`) beside the columns' 200 and 40 (tech notes v1.1). No edit. Proven by: `grep -n "at 100 characters" docs/specs/ORV-281/tech.md` gives one line in section 5.2 that also names 20, 200 and 40.
- **Section 5.2, the shape check.** Line 175 describes the check of migration 0010. A dated line under it names this card's migration and states the three lines of `orv287-shape-1` by pointing to this spec. Proven by: `grep -n "ORV-287" docs/specs/ORV-281/tech.md` shows the line in section 5.2.
- **Section 14, `packages/db`.** Already true on this branch: line 506 says `src/index.ts` does not change and names the `beforeMigrations` hook and `TEST_ROLE_LOCK` of `src/testing/database.ts`. A dated line adds this card's migration. Proven by: `grep -n "TEST_ROLE_LOCK" docs/specs/ORV-281/tech.md` gives the section 14 line, which also says `src/index.ts` does not change.
- **Section 6.1, the order.** The step 8 row (line 200) says the key is checked at step 8. A dated correction states `orv287-key-first-1` by its name: the key is read first, and with none steps 6 to 8 do not run. Proven by: `grep -n "orv287-key-first-1" docs/specs/ORV-281/tech.md` gives a line in section 6.1.
- **Section 6.2, a reading that does not parse.** Line 213 says such a project answers the 404 and calls that "decided here as built", with S-3 a follow-up. A dated correction states `orv287-unparsed-reading-1` by its name and keeps the 404 for an intake row that does not parse. Proven by: `grep -n "orv287-unparsed-reading-1" docs/specs/ORV-281/tech.md` gives a line in section 6.2, and `grep -n "decided here as built" docs/specs/ORV-281/tech.md` gives no line.
- **Section 13, the tests.** T32 no longer claims the rule-based record (row 2 of this spec proves it in `actions.test.ts`); T38 names the converse half of clause 4; T40 names the two cases of row 3; T41 says nine outcomes; T42 names the four no-key cases of row 6. Proven by: `grep -n -E "^. T(32|38|40|41|42) ." docs/specs/ORV-281/tech.md` shows the five rows, and the reviewer reads each against this spec's row.
- **Code comments.** The doc comment of `loadProject` (`apps/web/app/business/data.ts` lines 119 and 120), the doc comment of `open` (`packages/auth/src/business.ts`) and the head comment of `apps/web/server/business-read.ts` (lines 20 and 21, which name the steps in order) follow the code.

## Defaults taken

Each is a default the owner can change. What another answer changes is named beside it.

1. **A reading that does not parse (S-3).** Default: `orv287-unparsed-reading-1`, the project opens as one with no reading, and the line is a `warn` step line. Other answers: (a) keep the 404 and record it as decided: rows 3 and 5 go, row 4 stays, and the 6.2 bookkeeping item records the 404 instead; (b) show it as a `rule-based` `ai-failed` result: row 5 shows `business.label.aiUnavailable` and "AI could not read your answers, so only your own words are shown.", which tells the person AI failed when it did read; (c) an `error` boundary line in place of the `warn` step line: row 3's line changes, and the boundary line of a project that opened says `error` while its outcome is `ok`.
2. **The key before the limit (S-4).** Default: `orv287-key-first-1`. Other answer: keep today's order and note it in tech notes 6.1: rows 6 and 7 go, and with no key the board says the limit is reached after ten saves in an hour.
3. **No `job` clause (ORV-283-sec-1).** Default: left out, for the reasons in `orv287-shape-1`. Other answer: add `job = 'business-read'`: one more refusal row, the room tech notes section 11 keeps for a later job in this table closes, and the `access.test.ts` cases that write `other-job`, `cross-job` and `reason-<reason>` rows are rewritten on a second intake each.
4. **A stored row that would break the new check.** Default: the migration fails and nothing changes. Other answer: add the check `NOT VALID` and validate it in a later migration once the rows are fixed: row 14 changes, and until then old rows are not held to it.
5. **The fixtures (S-6).** Default: pin `readingOf` against `readBusiness` in a test (row 9). Other answer: build the story records with `readBusiness` and a fake completion at module load: `business-fixtures.ts` needs a top-level `await` and a hash function that runs in the browser, and `readingOf` goes; row 9 then proves the fixtures by their stories.
6. **The problem line of `orv287-mark-cover-1` (S-1).** Default: it names the case, field and value with both counts, so a missing and a repeated mark read apart. Any other wording changes only row 1's expected strings.

## Out of scope

- Finding F-1 of `ORV-283-review-1` (who marks the evaluation set): settled in ORV-283 spec v1.1, row 34 and open question 11.
- Finding ORV-283-sec-2 (an aborted call that records no cost): on ORV-171.
- The other bookkeeping notes of `ORV-283-review-1` (the ADR 0009 Confirmation line, who marks in tech notes 8.5, the extra story names of T44, the `coverage.md` row, the recorder run before G3): settled in ORV-283 or tech notes v1.1.
- Re-reading the answers of a project whose reading does not parse, and deleting or rewriting such a row: the row stays, and its intake keeps no reading.
- A `job` clause on `business_reading` (default 3).
- Any new model call, prompt change, model job, limit or number.

## Depends on

- `docs/specs/ORV-283/spec.md` v1.1: rows 28, 31, 33 and 34, and "Strings".
- `docs/specs/ORV-281/spec.md`: the rule `business-door-1` (steps 6 to 9), `business-saved-1`, `honest-business-1`.
- `docs/specs/ORV-281/tech.md`: sections 5.2, 6.1, 6.2, 11, 13 (T32, T38, T40 to T42) and 14.
- The review records `ORV-283-review-1` (S-1 to S-6) and `ORV-283-security-1` (ORV-283-sec-1).
- `packages/db/migrations/0010_business_reading.sql` line 23, decided and not edited.
- PR 226 (ORV-285, in review), which adds migrations 0012 and 0013, for the migration number only.
- `.claude/rules/security.md` rules 6, 9 and 15; ADR 0009 point 8; ADR 0012 decision 4.

## Worked examples

Run by the main session on 2026-11-19: W1 and W2 each print the expected line. Each line runs from the repo root with `node -e`. No rounding: the outputs are words and counts.

W1. `orv287-shape-1`, the three lines in JavaScript over eight rows `[method, reason, model_id, adapter_id, adapter_version, prompt_version, evidence]`: the four rows of finding ORV-283-sec-1's `psql` run, copied from its evidence (`rule-based` with no reason; `rule-based` with `ai-failed` and the model columns `m`, `a`, `1`, `p`; `model` with evidence `{"x":1}`; `model` with evidence `"text"`); the `rule-based` base row of `access.test.ts` (line 350); its `model` row with the evidence of line 489; a `model` row with 201 items; one with 200. Expected `refused refused refused refused kept kept refused kept`.

```bash
node -e 'const A=n=>Array.from({length:n},(_,i)=>({id:"x"+i}));const rows=[["rule-based",null,null,null,null,null,[]],["rule-based","ai-failed","m","a","1","p",[]],["model",null,"m","a","1","p",{x:1}],["model",null,"m","a","1","p","text"],["rule-based","ai-failed",null,null,null,null,[]],["model",null,"test/model","business-read","1","business-prompt-1",[{id:"x",text:"กกก"}]],["model",null,"m","a","1","p",A(201)],["model",null,"m","a","1","p",A(200)]];const k=([me,re,...rest])=>{const cols=rest.slice(0,4),ev=rest[4];const old=(me==="model")===(re===null&&cols.every(c=>c!==null))&&(me!=="rule-based"||JSON.stringify(ev)==="[]");const rb=me!=="rule-based"||(re!==null&&cols.every(c=>c===null));const md=me!=="model"||(Array.isArray(ev)&&ev.length<=200);return old&&rb&&md?"kept":"refused"};console.log(rows.map(k).join(" "))'
```

W2. `orv287-mark-cover-1` on the first four marks of `packages/intent-engine/src/business/eval/marks.json` (lines 2 to 29, all of case `th-01`), taken as the accepted readings and then as the marks: as they are, without the first, and with the third twice. Today's clause 4 passing on the stored file shows that each of the four names an accepted reading. Expected `[[],["th-01 situation.name ครัวบ้านไร่: marks 0, readings 1"],["th-01 competitive-frame.alternatives ข้าวกล่องหน้าปากซอย: marks 2, readings 1"]]`.

```bash
node -e 'const R=[["th-01","situation.name","ครัวบ้านไร่"],["th-01","competitive-frame.alternatives","แอปสั่งอาหารเดลิเวอรี่"],["th-01","competitive-frame.alternatives","ข้าวกล่องหน้าปากซอย"],["th-01","competitive-frame.alternatives","ร้านสะดวกซื้อ"]];const k=a=>a.join("|");const cover=M=>[...new Set(R.map(k))].flatMap(key=>{const r=R.filter(x=>k(x)===key).length,n=M.filter(x=>k(x)===key).length;return n===r?[]:[key.split("|").join(" ")+": marks "+n+", readings "+r]});console.log(JSON.stringify([cover(R),cover(R.slice(1)),cover([...R,R[2]])]))'
```

## Changelog

- v1.0 (2026-11-19): first version, task ORV-287-spec-1. Seven follow-ups of the business read in one PR: S-1 to S-6 of `ORV-283-review-1` and ORV-283-sec-1 of `ORV-283-security-1`, as rows 1 to 14, four named rules and six defaults; the docs bookkeeping in `docs/specs/ORV-281/tech.md` as a section with no row. Two bookkeeping items the envelope named (the caps of section 5.2 and the `packages/db` line of section 14) are already true on this branch since tech notes v1.1, so they are a grep and no edit. The `job` clause the security finding offered as optional is left out (default 3). No Jira tool call and no shell in this role; the main session ran the worked examples, and both print the expected line. Downstream to review: the ORV-287 builder envelope (rows 1 to 14 and the bookkeeping), the `security` and reviewer envelopes and the qa envelope of this PR; outside this task's write set, ORV-283 spec row 28's Check cell, ORV-281 spec row 28's Check cell and the rule `business-door-1`, listed for the main session.
- v1.1 (2026-11-19, task ORV-287-spec-2): row 8's Check cell names the check that runs in place of "`check-i18n` passes", which the builder of rows 1, 8 and 9 (task ORV-287-b3-tests-catalog) reported as a statement with no command behind it: the repo has no `check-i18n` script, but the test file `packages/design-system/tests/check-i18n.test.ts` runs in the design-system suite, and its tests "have the same keys in every locale" and "spell the same placeholders for every key" fail on the new key missing from `en.ts` or `th.ts` or on its `{model}` slot spelled in one only. That file's scan "carries no Thai string outside the catalog" does not walk `src/examples`, where `fromModelNote` lives, so row 8 does not name it; a line hard-coded in `fromModelNote` is caught by `business-strings.test.ts` "the AI line reads the catalog", which row 8 already names. Rows 1 to 14 keep their numbers and every other cell. The pointer edits this spec's v1.0 left for the main session are written in `docs/specs/ORV-283/spec.md` v1.2, `docs/specs/ORV-281/spec.md` v1.5 and `docs/specs/ORV-281/design.md` v1.6. Downstream to review: the reviewer and qa envelopes of this PR (row 8's Check cell).
- v1.2 (2026-11-19, task ORV-293-spec-1, card ORV-293): one dated line under `orv287-shape-1`, "As built (ORV-293, 2026-11-19)": migration 0014 is two statements where the rule words one, the migrator's one transaction per file as PR 229 and its reviews state it, and the passing staging run of 2026-11-19 with the count of stored rows not measured. The rule's text, rows 1 to 14 and every other section are unchanged. Downstream to review: none in this card's code; `docs/specs/ORV-281/tech.md` section 5.2 holds the same dated line.
