---
issue: ORV-142 (https://tpetkaew.atlassian.net/browse/ORV-142)
parent: ORV-141 (docs/specs/ORV-141/spec.md v1.2)
lane: M
version: 1.0
---

# ORV-142: one JSON line per server action, the step lines and the lint rule (ORV-141 slice 2)

## Why

ORV-142 is slice 2 of ORV-141, split out as its own issue by ORV-141 comment 10262 after ORV-141's G2 passed in comment 10261. It adds no requirement: every row below is an ORV-141 row, copied word for word with its number, and every rule it names is defined in the parent spec.

ORV-141 slice 1 made the request id in the proxy, added the logger and put `authRoute` on both. Between the slices the server actions carry the `x-request-id` header but still write today's lines (tech notes section 11). This slice finishes the parent's intent for the place people do their work, saving a direction, reading a brief with AI, signing in and out, and switching the language: each call writes one JSON line with the request's id, its route, its duration and its outcome; the AI failure line stops carrying OpenRouter's own text; a lint rule keeps new `console` calls out; and a staging probe (row 18) checks what the unit tests cannot.

**Frame.** As in the parent spec ("Why", **Frame**): a server-side control, not a hook that judges a tool call's text. The lint rule of row 16 is a guard rail for code written by agents and people who follow the rules, not a boundary.

**What is real.** Real server code with unit tests, as the parent spec's "What is real" says; the tests' fake `fetch` and seeded values are test doubles, not a simulated product feature. Row 18 is the staging probe for the two things the unit tests do not prove.

## Story

The parent's story, unchanged: ORV-141 spec, "Story".

## Parent and decisions

- Parent spec: `docs/specs/ORV-141/spec.md` v1.2. Its "The set this covers", "Call sites to move", "Rules and bounds", "Worked examples" and "Open questions" are the one home for this issue too; this file points to them and does not restate them.
- ORV-141 comment 10261: G2 passed, with slice 1 rows 1, 2, 12 to 15 and slice 2 rows 2 to 11, 15 to 17, and row 18 a staging probe.
- ORV-141 comment 10262: the split; slice 2 is this issue.
- Tech notes: `docs/specs/ORV-141/tech.md` (linked, not copied). Section 5 (boundaries, entry by entry), section 6 (step lines and row 17), section 7 (the lint rule), section 9 (tests by acceptance row), section 10 tasks B4 to B8 and R1 (build order), section 11 (size and slices), section 12 (the documents marked Slice 2).

## Acceptance criteria

Every row's lines follow `orv141-line-shape` and `orv141-allow-list`. The UI copy in every row is today's copy, unchanged by this story; the "Who sees what" column quotes it so a test can check it did not change.

The rows keep their ORV-141 numbers: rows 1, 12, 13 and 14, and the slice 1 parts of rows 2 and 15, are in the ORV-141 spec. A rule name (`orv141-...`) is defined in the ORV-141 spec, "Rules and bounds", and an open question number in a row is the ORV-141 spec's.

<!-- prettier-ignore -->
| # | Given | When | Who sees what | Data effect | Test |
| --- | --- | --- | --- | --- | --- |
| 2 | A request to a server action, and one to `GET /api/auth/get-session`, each with `x-request-id: client-chosen-id` and with `next-router-prefetch: 1` (once) or `purpose: prefetch` (once), headers that make today's matcher skip the proxy | The request is served | Operator: the response's `x-request-id` and every line for the request carry a server-made UUID v4, never `client-chosen-id` (`orv141-request-id`) | None | Test named in the tech notes per path (the matcher, the boundary, or both); in this issue the directions boundary path, the matcher, proxy and `api/auth` paths being ORV-141 row 2 |
| 3 | A signed-in admin, Thai or English UI | They press "Save draft" / "บันทึกฉบับร่าง" and it succeeds | Person: today's `saved.savedDraft` line, English "Saved the draft of {name}" / Thai "บันทึกฉบับร่างของ {name} แล้ว". Operator: one boundary line `{"level":"info", "requestId":<id>, "route":"directions/saveDirection", "durationMs":<integer>, "outcome":"ok"}` and one `rate-limit` step line with the same `requestId` and `route`, `limit: "write"`, `outcome: "allowed"` | None beyond today's save | `apps/web/app/directions/actions.test.ts`, "a call writes one boundary line with the request's id" |
| 4 | A signed-in person who is not a member of the active workspace | They save | Person: today's `saved.errors.forbidden`, English "This account is not allowed to do this in this workspace." / Thai "บัญชีนี้ไม่มีสิทธิ์ทำสิ่งนี้ในเวิร์กสเปซนี้". Operator: one boundary line, `level: "info"`, `outcome: "refused"`, `reason: "forbidden"` | None | `actions.test.ts`, "a refusal is logged as refused with its reason" |
| 5 | A signed-in person; the fake `fetch` answers OpenRouter's 401 with the message `No auth credentials found ana@example.com sk-or-v1-seeded`; the brief contains `ana@example.com` | They press "Read with AI" | Person: the rules' reading and today's line `saved.errors["ai-failed"]`, English "AI could not read the brief, so the rules' reading is used." / Thai "AI อ่านบรีฟไม่สำเร็จ จึงใช้การอ่านตามกฎแทน". Operator: exactly one `error` line for the request: the boundary line, `outcome: "failed"`, `reason: "adapter-failed"`. No line contains `ana@example.com`, `sk-or-v1-seeded` or `OpenRouter answered` | No model output saved, as today | `actions.test.ts`, "an AI failure is logged once at the boundary, without the brief or OpenRouter's text" |
| 6 | The direction service throws `new Error("ana@example.com tok_seeded")` | A person saves | Person: today's `saved.errors.failed`, English "That did not work. Try again." / Thai "ทำไม่สำเร็จ ลองอีกครั้ง". Operator: one boundary line, `level: "error"`, `outcome: "failed"`, `reason: "unexpected"`, `errorName: "Error"`; no line contains `ana@example.com` or `tok_seeded` | None | `actions.test.ts`, "an unexpected error is logged once by name only" |
| 7 | The limiter answers unavailable | A person saves | Person: today's "That did not work. Try again." / "ทำไม่สำเร็จ ลองอีกครั้ง". Operator: one `rate-limit` step line (`level: "info"`, `outcome: "unavailable"`) and one boundary line (`level: "error"`, `outcome: "unavailable"`, `reason: "rate-limit"`), same `requestId` | No data written, as today | `actions.test.ts`, "a store failure is one error line" |
| 8 | A person over the `ai-read` hour limit | They read with AI | Person: today's ORV-112 row 5 notice, English "You have reached the limit for AI readings, so the rules' reading is used. AI can read again in 12 minutes." / Thai "ใช้ AI อ่านบรีฟครบจำนวนที่กำหนดแล้ว จึงใช้การอ่านตามกฎแทน อ่านด้วย AI ได้อีกครั้งในอีก 12 นาที" (wait as computed). Operator: one boundary line, `level: "warn"`, `outcome: "limited"`, `reason: "ai-rate-limited"` | No model call, as today | `actions.test.ts`, "a limited call is logged as limited" |
| 9 | The sign-in count throws `secret detail` (ORV-123 row 1's case) | "Sign in with Google" / "ลงชื่อเข้าใช้ด้วย Google" is pressed | Person: today's notice, badge "Not done" / "ทำไม่สำเร็จ" and line `account.failed`, English "You cannot sign in right now. Try again." / Thai "ตอนนี้ยังลงชื่อเข้าใช้ไม่ได้ ลองใหม่อีกครั้ง". Operator: one boundary line, `level: "error"`, `route: "account/signInWithGoogle"`, `outcome: "unavailable"`, `reason: "rate-limit"`, with `requestId` and `durationMs`; no line contains `secret detail` | `signInSocial` not called, as today | `apps/web/app/account/actions.test.ts`, "a count that throws or rejects returns failed and logs once" (expected keys widened from `orv123-log-line`) |
| 10 | A granted sign-in, then a sign-out | Each action runs | Person: today's redirect to Google, then to `/account`. Operator: one boundary line each, `level: "info"`, `outcome: "ok"`, routes `account/signInWithGoogle` and `account/signOut`. Next's `redirect` is an `ok` outcome, not an error | None | `account/actions.test.ts`, "a redirect is logged as ok" |
| 11 | `setLocale` with `locale=th`, then with `locale=xx` | The switch's form posts | Person: the page in Thai; then nothing changes. Operator: one `info` line each, `outcome: "ok"`, then `outcome: "refused"`, `reason: "invalid-input"`, route `i18n/setLocale` | The locale cookie is set once | `apps/web/i18n/actions.test.ts` (new), "the locale action writes one line" |
| 15 | Every line captured in rows 3 to 13 | Each is checked | Operator: each is one physical line (no newline inside), parses with `JSON.parse`, and has the five keys of `orv141-line-shape` with the types it names | None | Each row's test asserts the shape through one shared helper; in this issue the lines the tests of rows 3 to 11 capture (the three action files and the step lines), the lines of the `log.ts` and `authRoute` tests being ORV-141 row 15 |
| 16 | A file under the paths of `orv141-no-console` with a sample of each form `console.log("x")`, `console.info("x")`, `console.warn("x")`, `console.error("x")`, `console.debug("x")` | `pnpm lint` runs | Operator: lint fails once per form, naming the line; the logger module itself passes | None | The builder runs one sample per form and records the red line per form (`.claude/rules/testing.md`, text guards) |
| 17 | ORV-121 merged into `develop` before or after this story | The second of the two merges | Operator: "ai usage record failed" and "ai usage cost not reported" are step lines by `orv141-step-lines` (`step: "ai-usage"`, `outcome` `record-failed` or `cost-not-reported`), with the request's id; no `console` call remains for them | None | The second story's `actions.test.ts` case for each line; `grep -n "console\." apps/web/app/directions/actions.ts` prints nothing |
| 18 | The release on staging | (a) `curl -si -H 'x-request-id: client-chosen-id' <staging>/api/auth/get-session`; (b) on `/directions`, signed in, press "Save draft" in a browser and read the server action's response headers; (c) find that id in Vercel's log view | (a) and (b): `x-request-id` is a UUID v4, not `client-chosen-id`; (c): the boundary line with that `requestId` shows as one JSON object | None | Staging probe recorded in the G5 packet (open question 7) |

## Rules and bounds

The rules these rows test are defined once, in the ORV-141 spec, "Rules and bounds": `orv141-request-id`, `orv141-line-shape`, `orv141-allow-list`, `orv141-routes`, `orv141-outcomes`, `orv141-reasons`, `orv141-boundary-line`, `orv141-step-lines` and `orv141-no-console`, with the parent's "No UI copy changes" and "Honest limits" bullets. Their worked examples are in the parent spec, "Worked examples". This file defines no rule of its own; a change to a rule is made in the parent spec first.

## Out of scope

- The rows ORV-141 keeps: 1, 12, 13 and 14, and the slice 1 parts of rows 2 and 15 (the matcher, the proxy, the `api/auth` boundary, the logger), which ORV-141 slice 1 built.
- Everything the parent spec's "Out of scope" lists.

## Impact list

- **Code and tests**: the bullets of the parent spec's "Impact list" marked ORV-142 (actions, app server, `client-ip.ts`, lint, and the tests that change with them); the files per task are tech notes section 10, tasks B4 to B8, and the staging probe is task R1.
- **Size**: about 435 changed lines with tests (tech notes section 11), in one PR.
- **`security` role** is dispatched on the PR: the diff touches `packages/auth/**` (`client-ip.ts`, `eslint.config.mjs`), paths in `.claude/rules/security.md` (ADR 0015 decision 2; tech notes section 10).
- **Docs to update**: the rows of tech notes section 12 marked Slice 2 (ORV-112 spec and tech notes, ORV-123 spec, ADR 0015 lines 93, 95 and 186), each by its owner role.

## Open questions

Each has a default; the parent's open questions 1 to 9 are decided in the ORV-141 spec and are not reopened here.

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | Row 17 depends on ORV-121's merge. If ORV-121 is not on `develop` when this issue's QA runs, how is row 17 recorded? | (a) QA records row 17 as carried by ORV-121's PR, with the grep of row 17 run on this PR's head; (b) this issue waits for ORV-121 | (b) ties this issue to another PR's timing; (a) leaves the move to ORV-121's builder, as tech notes section 6 says | (a) |
| 2 | Row 18 (a) probes `/api/auth/get-session`, which ORV-141 alone changes. Does ORV-141's G5 wait for row 18? | (a) no; row 18 runs once, after this issue is on staging, as comments 10261 and 10262 place it, and ORV-141's G5 packet points to it; (b) ORV-141's G5 also runs row 18 (a) | (a) leaves ORV-141 on staging with no recorded probe of the header until this issue lands; (b) is one more `curl` in ORV-141's G5 | (a) |

## Depends on

ORV-141 spec v1.2 (the parent: rules, call sites, worked examples, open questions 1 to 9); ORV-141 comment 10261 (G2) and comment 10262 (the split); `docs/specs/ORV-141/tech.md`; ORV-141 slice 1 merged into `develop` (the logger, the proxy's id); ADR 0015 decisions 2, 6, 8 and 9; ADR 0012 decision 4 (G2 under delegation); ORV-121 (row 17, ORV-121 comment 10260); ORV-112 and ORV-123 specs (rows 8 and 9 quote their copy).

## Changelog

- v1.0 (2026-10-29): first spec, written from ORV-141 spec v1.2 by the split of ORV-141 comment 10262 (task ORV-141-spec-6). Rows 2 to 11 and 15 to 18 copied word for word with their numbers; rows 2 and 15 each gain one clause scoping them to the slice 2 paths. No new requirement. Downstream to review: the ORV-142 Jira issue acceptance (these rows), the first builder envelope for ORV-142 (fact `test -f docs/specs/ORV-142/spec.md`, L-0016).
