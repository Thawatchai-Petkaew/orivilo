---
issue: ORV-141 (https://tpetkaew.atlassian.net/browse/ORV-141)
lane: M
version: 1.0
---

# ORV-141: a server-made request id and one JSON log line per request

## Why

ADR 0015 decision 6 and `.claude/rules/security.md` rule 15 require three things that the app does not do today:

1. **A request id on every response.** Each server action and route handler response carries `x-request-id`, made by the server, never the client's value. Today only `authRoute`'s own 429 and 503 answers carry one (`packages/auth/src/auth-route.ts`, a fresh `randomUUID()` per answer); no server action response and no answer from Better Auth's handler does.
2. **One shape for a log line.** One JSON object per line with `level`, `requestId`, `route`, `durationMs` and `outcome`, and no secret or personal data. Today four of the seven request-time log calls write a plain string or a JSON object without `requestId` (see "Call sites to move").
3. **One log per error, at the boundary.** Today `readBriefWithAi` logs its failure inside the work function, and its text includes OpenRouter's own message (up to 200 characters of third-party text, `packages/intent-engine/src/openrouter.ts` line 82), which no one has checked for personal data.

ORV-141 is item 1 of ORV-113 as its own slice, lane M. The error envelope for server action outcomes, masking and the other ORV-113 items stay in ORV-113.

**Frame.** A server-side control, not a hook that judges a tool call's text. The request id is a correlation id: it is not a secret and grants nothing. What makes it trustworthy is that only server code sets it and a client-sent `x-request-id` is overwritten or ignored on every path into a server action or route handler (`orv141-request-id`). The allow-list in `orv141-allow-list` is enforced by the one logger every request-time line goes through; a direct `console` call elsewhere bypasses it, so `orv141-no-console` adds a lint rule. That lint rule is a guard rail for code written by agents and people who follow the rules, not a boundary: nothing outside the session stops a determined edit that disables it, and the reviewer and `security` roles read each diff for one.

**What is real.** Real server code with unit tests. Two things the unit tests do not prove: that Next.js 16.4.1 joins the header the proxy sets with a server action's own response, and that the lines reach Vercel's log view as one JSON object each. Row 18's staging probe checks both before G5. Nothing here claims conformance to ASVS or any other standard (ADR 0015 decision 13).

## Story

As the person who runs ORIVILO and reads its logs on Vercel, I want every server action and API answer to carry an id the server made, and every log line for that request to carry the same id in one JSON shape with no personal data, so that when someone reports a failure I can find the one line that says what happened, how long it took and why, without reading anyone's email, brief or token.

## The set this covers

Server actions are the exports of the three files with `"use server"` at the top in `apps/web` (found with `grep -rl '^"use server"' apps/web --include=*.ts` outside `node_modules` and `.next`); route handlers are the `route.ts` files under `apps/web/app`. Today that is 10 server actions and 1 route handler file with 2 methods:

<!-- prettier-ignore -->
| File | Entry | `route` value (`orv141-routes`) |
| --- | --- | --- |
| `apps/web/app/directions/actions.ts` | `listDirections` | `directions/listDirections` |
| same | `saveDirection` | `directions/saveDirection` |
| same | `approveDirection` | `directions/approveDirection` |
| same | `openVersion` | `directions/openVersion` |
| same | `exportVersion` | `directions/exportVersion` |
| same | `importDirection` | `directions/importDirection` |
| same | `readBriefWithAi` | `directions/readBriefWithAi` |
| `apps/web/app/account/actions.ts` | `signInWithGoogle` | `account/signInWithGoogle` |
| same | `signOut` | `account/signOut` |
| `apps/web/i18n/actions.ts` | `setLocale` | `i18n/setLocale` |
| `apps/web/app/api/auth/[...all]/route.ts` | `GET`, `POST` (through `authRoute`) | `api/auth` |

A server action or route handler added later joins this table and `orv141-routes` in the same PR.

## Call sites to move

Request-time log calls on `develop` at `d1a20b4` (found with `grep -rn 'console\.' apps/web/app apps/web/server apps/web/i18n apps/web/proxy.ts packages/auth/src`, test files excluded): 7 calls in 5 files. Each moves to the one logger and takes the shape in `orv141-line-shape`.

<!-- prettier-ignore -->
| # | File and line | Today | Becomes |
| --- | --- | --- | --- |
| C1 | `apps/web/server/rate-limit.ts:14` | `console.log` JSON `{level:"info", route:"rate-limit", limit, outcome, durationMs}` | A step line by `orv141-step-lines` (`step: "rate-limit"`), with the request's `requestId` and `route` |
| C2 | `apps/web/app/directions/actions.ts:113` | `console.error("rate limit unavailable", limit)` | Removed; the boundary line by `orv141-boundary-line` says `outcome: "unavailable"`, `reason: "rate-limit"` |
| C3 | `apps/web/app/directions/actions.ts:137` | `console.error("direction action failed", <error name>)` | Removed; the boundary line says `outcome: "failed"`, `reason: "unexpected"`, `errorName` |
| C4 | `apps/web/app/directions/actions.ts:226` | `console.error("ai reading failed", <kind>, <OpenRouter message>)` inside the work function | Removed; the failure kind travels to the boundary line as `reason`; the OpenRouter message is not logged (open question 4) |
| C5 | `apps/web/app/account/actions.ts:14` | `console.error` JSON `{level, route:"account/sign-in", outcome:"unavailable"}` | Removed; the boundary line says `outcome: "unavailable"`, `reason: "rate-limit"` |
| C6 | `packages/auth/src/auth-route.ts:28` | `console.error` JSON `{level, requestId, route:"auth", outcome:"unavailable"}` with its own id | Removed; the boundary line for `api/auth` says `outcome: "unavailable"`, `reason: "rate-limit"`, `status: 503`, with the request's id |
| C7 | `packages/auth/src/client-ip.ts:33` | `console.warn` JSON `{level:"warn", route:"rate-limit", outcome:"no-trusted-ip"}`, once per process | A step line (`step: "client-ip"`), still once per process, with the `requestId` and `route` of the request that hit it |

Out of this set, and why: `packages/db/src/migrate.ts` and `packages/design-system/scripts/*` run from the command line, not while serving a request.

**ORV-121** (PR 141, not merged) adds two more lines in `apps/web/app/directions/actions.ts`, "ai usage record failed" and "ai usage cost not reported" (ORV-121 comment 10260). Whichever of ORV-121 and ORV-141 merges second moves them (row 17).

## Acceptance criteria

Every row's lines follow `orv141-line-shape` and `orv141-allow-list`. The UI copy in every row is today's copy, unchanged by this story; the "Who sees what" column quotes it so a test can check it did not change.

<!-- prettier-ignore -->
| # | Given | When | Who sees what | Data effect | Test |
| --- | --- | --- | --- | --- | --- |
| 1 | A `POST` to `/directions` with a `next-action` header and `x-request-id: client-chosen-id` | The proxy runs | Operator: the response carries `x-request-id`, a UUID v4 that is not `client-chosen-id`; the request passed on to the action carries the same value. Person: nothing changes | None | Proxy unit test, "makes the request id and never keeps the client's" |
| 2 | A request to a server action, and one to `GET /api/auth/get-session`, each with `x-request-id: client-chosen-id` and with `next-router-prefetch: 1` (once) or `purpose: prefetch` (once), headers that make today's matcher skip the proxy | The request is served | Operator: the response's `x-request-id` and every line for the request carry a server-made UUID v4, never `client-chosen-id` (`orv141-request-id`) | None | Test named in the tech notes per path (the matcher, the boundary, or both) |
| 3 | A signed-in admin, Thai or English UI | They press "Save draft" / "บันทึกฉบับร่าง" and it succeeds | Person: today's `saved.savedDraft` line, English "Saved the draft of {name}" / Thai "บันทึกฉบับร่างของ {name} แล้ว". Operator: one boundary line `{"level":"info", "requestId":<id>, "route":"directions/saveDirection", "durationMs":<integer>, "outcome":"ok"}` and one `rate-limit` step line with the same `requestId` and `route`, `limit: "write"`, `outcome: "allowed"` | None beyond today's save | `apps/web/app/directions/actions.test.ts`, "a call writes one boundary line with the request's id" |
| 4 | A signed-in person who is not a member of the active workspace | They save | Person: today's `saved.errors.forbidden`, English "This account is not allowed to do this in this workspace." / Thai "บัญชีนี้ไม่มีสิทธิ์ทำสิ่งนี้ในเวิร์กสเปซนี้". Operator: one boundary line, `level: "info"`, `outcome: "refused"`, `reason: "forbidden"` | None | `actions.test.ts`, "a refusal is logged as refused with its reason" |
| 5 | A signed-in person; the fake `fetch` answers OpenRouter's 401 with the message `No auth credentials found ana@example.com sk-or-v1-seeded`; the brief contains `ana@example.com` | They press "Read with AI" | Person: the rules' reading and today's line `saved.errors["ai-failed"]`, English "AI could not read the brief, so the rules' reading is used." / Thai "AI อ่านบรีฟไม่สำเร็จ จึงใช้การอ่านตามกฎแทน". Operator: exactly one `error` line for the request: the boundary line, `outcome: "failed"`, `reason: "adapter-failed"`. No line contains `ana@example.com`, `sk-or-v1-seeded` or `OpenRouter answered` | No model output saved, as today | `actions.test.ts`, "an AI failure is logged once at the boundary, without the brief or OpenRouter's text" |
| 6 | The direction service throws `new Error("ana@example.com tok_seeded")` | A person saves | Person: today's `saved.errors.failed`, English "That did not work. Try again." / Thai "ทำไม่สำเร็จ ลองอีกครั้ง". Operator: one boundary line, `level: "error"`, `outcome: "failed"`, `reason: "unexpected"`, `errorName: "Error"`; no line contains `ana@example.com` or `tok_seeded` | None | `actions.test.ts`, "an unexpected error is logged once by name only" |
| 7 | The limiter answers unavailable | A person saves | Person: today's "That did not work. Try again." / "ทำไม่สำเร็จ ลองอีกครั้ง". Operator: one `rate-limit` step line (`level: "info"`, `outcome: "unavailable"`) and one boundary line (`level: "error"`, `outcome: "unavailable"`, `reason: "rate-limit"`), same `requestId` | No data written, as today | `actions.test.ts`, "a store failure is one error line" |
| 8 | A person over the `ai-read` hour limit | They read with AI | Person: today's ORV-112 row 5 notice, English "You have reached the limit for AI readings, so the rules' reading is used. AI can read again in 12 minutes." / Thai "ใช้ AI อ่านบรีฟครบจำนวนที่กำหนดแล้ว จึงใช้การอ่านตามกฎแทน อ่านด้วย AI ได้อีกครั้งในอีก 12 นาที" (wait as computed). Operator: one boundary line, `level: "warn"`, `outcome: "limited"`, `reason: "ai-rate-limited"` | No model call, as today | `actions.test.ts`, "a limited call is logged as limited" |
| 9 | The sign-in count throws `secret detail` (ORV-123 row 1's case) | "Sign in with Google" / "ลงชื่อเข้าใช้ด้วย Google" is pressed | Person: today's notice, badge "Not done" / "ทำไม่สำเร็จ" and line `account.failed`, English "You cannot sign in right now. Try again." / Thai "ตอนนี้ยังลงชื่อเข้าใช้ไม่ได้ ลองใหม่อีกครั้ง". Operator: one boundary line, `level: "error"`, `route: "account/signInWithGoogle"`, `outcome: "unavailable"`, `reason: "rate-limit"`, with `requestId` and `durationMs`; no line contains `secret detail` | `signInSocial` not called, as today | `apps/web/app/account/actions.test.ts`, "a count that throws or rejects returns failed and logs once" (expected keys widened from `orv123-log-line`) |
| 10 | A granted sign-in, then a sign-out | Each action runs | Person: today's redirect to Google, then to `/account`. Operator: one boundary line each, `level: "info"`, `outcome: "ok"`, routes `account/signInWithGoogle` and `account/signOut`. Next's `redirect` is an `ok` outcome, not an error | None | `account/actions.test.ts`, "a redirect is logged as ok" |
| 11 | `setLocale` with `locale=th`, then with `locale=xx` | The switch's form posts | Person: the page in Thai; then nothing changes. Operator: one `info` line each, `outcome: "ok"`, then `outcome: "refused"`, `reason: "invalid-input"`, route `i18n/setLocale` | The locale cookie is set once | `apps/web/i18n/actions.test.ts` (new), "the locale action writes one line" |
| 12 | `authRoute` with a count that answers unavailable | `POST /api/auth/sign-in/social` with a JSON body | Operator: 503 with the `SERVICE_UNAVAILABLE` body; the body's `requestId`, the `x-request-id` header and the one boundary line's `requestId` are the same value, the request's id; the line has `level: "error"`, `route: "api/auth"`, `outcome: "unavailable"`, `reason: "rate-limit"`, `status: 503` | No `verification` row | `packages/auth/src/auth-route.test.ts`, "a store failure answers 503 and logs once" (widened) |
| 13 | `authRoute` with a handler that answers 200, then one that throws `new Error("ana@example.com")` | `GET /api/auth/get-session` | Operator: the 200 carries `x-request-id` and writes one `info` line, `outcome: "ok"`, `status: 200`; the throw writes one `error` line, `outcome: "failed"`, `reason: "unexpected"`, `errorName: "Error"`, without `ana@example.com`, and is rethrown as today | None | `auth-route.test.ts`, "every answer carries the request id and one line" |
| 14 | The logger called with `level`, `requestId`, `route`, `durationMs`, `outcome`, plus `email: "ana@example.com"`, `token: "sk-or-v1-seeded"`, `detail: "<OpenRouter message>"` and `reason: "OpenRouter answered 401."` | It writes the line | Operator: the line holds only allow-listed keys; `reason` is `"unknown"`; the text contains neither seeded value | None | Logger unit test, "writes only allow-listed keys and closed values" |
| 15 | Every line captured in rows 3 to 13 | Each is checked | Operator: each is one physical line (no newline inside), parses with `JSON.parse`, and has the five keys of `orv141-line-shape` with the types it names | None | Each row's test asserts the shape through one shared helper |
| 16 | A file under the paths of `orv141-no-console` with a sample of each form `console.log("x")`, `console.info("x")`, `console.warn("x")`, `console.error("x")`, `console.debug("x")` | `pnpm lint` runs | Operator: lint fails once per form, naming the line; the logger module itself passes | None | The builder runs one sample per form and records the red line per form (`.claude/rules/testing.md`, text guards) |
| 17 | ORV-121 merged into `develop` before or after this story | The second of the two merges | Operator: "ai usage record failed" and "ai usage cost not reported" are step lines by `orv141-step-lines` (`step: "ai-usage"`, `outcome` `record-failed` or `cost-not-reported`), with the request's id; no `console` call remains for them | None | The second story's `actions.test.ts` case for each line; `grep -n "console\." apps/web/app/directions/actions.ts` prints nothing |
| 18 | The release on staging | (a) `curl -si -H 'x-request-id: client-chosen-id' <staging>/api/auth/get-session`; (b) on `/directions`, signed in, press "Save draft" in a browser and read the server action's response headers; (c) find that id in Vercel's log view | (a) and (b): `x-request-id` is a UUID v4, not `client-chosen-id`; (c): the boundary line with that `requestId` shows as one JSON object | None | Staging probe recorded in the G5 packet (open question 7) |

## Rules and bounds

- **orv141-request-id.** The server makes one id per request to a server action or route handler: a UUID v4 from `crypto.randomUUID()`. A value the client sends in `x-request-id`, or in any other header, is never used as the id, on every path into those entries, including requests that carry `next-router-prefetch` or `purpose: prefetch` (which today's proxy matcher skips, `apps/web/proxy.ts` lines 22 to 25). The id goes in the response's `x-request-id` header on every answer (success, refusal, redirect, 429, 503, and answers Better Auth's handler writes), in every line logged for that request, and in the `requestId` of `authRoute`'s error bodies, which stop making their own. Where the id is made (proxy, boundary, or both) is for the tech notes. Page responses may carry the header too; this story does not require or test it.
- **orv141-line-shape.** A line is one JSON object on one physical line, written to standard output (`info`) or standard error (`warn`, `error`). It always has `level` (`"info"`, `"warn"` or `"error"`), `requestId` (the request's id from `orv141-request-id`), `route` (from `orv141-routes`), `durationMs` (a non-negative integer, `Math.round` of the elapsed milliseconds, halves up) and `outcome` (from `orv141-outcomes`). For a boundary line `durationMs` is the time from entering the boundary to writing the line; for a step line it is the step's own time.
- **orv141-allow-list.** A line holds only these keys: the five of `orv141-line-shape`, and optionally `step` (`"rate-limit"`, `"client-ip"`, `"ai-usage"`), `limit` (a `LimitName` from `packages/auth/src/rate-limit.ts`), `reason` (from `orv141-reasons`), `status` (an integer HTTP status, `api/auth` lines only) and `errorName` (matching `^[A-Z][A-Za-z]{0,39}$`). Any other key the caller passes is dropped. A `route`, `step`, `reason` or `errorName` value outside its list or pattern is written as `"unknown"`. No key holds an email, name, IP, user id, workspace id, session token, API key, brief text, error message or stack, so no `personal` or `secret` field reaches a line and no mask helper is needed here (ADR 0015 decisions 8 and 9).
- **orv141-routes.** The `route` values are the third column of the table in "The set this covers", and nothing else. The `api/auth` value never holds the path, which the client chooses.
- **orv141-outcomes.** A boundary line's `outcome` is one of `ok`, `refused`, `limited`, `unavailable`, `failed`. A step line's `outcome` is, for `rate-limit`, `allowed`, `limited` or `unavailable`; for `client-ip`, `no-trusted-ip`; for `ai-usage`, `record-failed` or `cost-not-reported`.
- **orv141-reasons.** `reason` is the most specific closed value the boundary knows: an `interpretBrief` failure kind (`adapter-failed`, `invalid-output`, `evidence-mismatch`) for an AI failure; `rate-limit` when the limiter answered unavailable or the count threw; `unexpected` for an error the boundary does not recognise; otherwise a member of the type `ActionError` in `apps/web/app/directions/actions.ts` (which includes `DirectionError["reason"]` and `ReplayRefusal`). `invalid-input` covers `setLocale`'s refused value.
- **orv141-boundary-line.** Each call of an entry in "The set this covers" writes exactly one boundary line when it ends, whatever the outcome, mapped from what the entry returns or throws: a success or Next's `redirect` is `ok` at `info`; a refusal the person can act on (an `ActionError` other than those below, an HTTP 4xx other than 429) is `refused` at `info`; a rate limit (`rate-limited`, `ai-rate-limited`, HTTP 429) is `limited` at `warn`; the limiter or count unavailable (HTTP 503 from `authRoute`) is `unavailable` at `error`; `failed`, `ai-failed`, `not-configured`, `ai-not-configured`, an HTTP 5xx other than 503, or a throw is `failed` at `error`. A thrown error the entry rethrows today is still rethrown after its line.
- **orv141-step-lines.** Code inside a request writes no line of its own except the three steps in `orv141-allow-list` (`step` key), each at `info` or `warn` and never at `error`, so the boundary line is the only `error` line for a request. One error is logged once, at the boundary (ADR 0015 decision 6). An inner layer passes its failure kind up instead of logging it.
- **orv141-no-console.** ESLint's `no-console` is an error in `apps/web/app/**`, `apps/web/server/**`, `apps/web/i18n/**`, `apps/web/proxy.ts` and `packages/auth/src/**`, test files excepted, with one exception: the logger module. Forms it must catch (the forms in the repo today): `console.log(`, `console.info(`, `console.warn(`, `console.error(`, `console.debug(`.
- No UI copy changes: no string is added to or changed in a locale catalog.
- **Honest limits.** Next.js logs an error a server action or route handler rethrows, and Better Auth writes its own log lines; neither goes through the logger, so their text is outside `orv141-allow-list` (open question 6). Vercel adds its own `x-vercel-id`; it is not our id and is not replaced.

## Worked examples

Each line is copied from its source and was not run in this task (no shell).

- **The id and the client's value** (`orv141-request-id`, rows 1 and 2). Input: the client's `client-chosen-id` from row 1. A random id, so only the format and the inequality are expected. No rounding.

  ```bash
  node -e 'const client="client-chosen-id";const id=crypto.randomUUID();const re=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;console.log(re.test(id),id.length,id!==client,re.test(client))'
  # expected: true 36 true false
  ```

- **`durationMs`** (`orv141-line-shape`), the rounding of `apps/web/server/rate-limit.ts` (`Math.round(r.durationMs)`) on two `performance.now()` readings. Rounding: `Math.round`, halves up, so 237.5 gives 238.

  ```bash
  node -e 'const started=100.25,ended=337.75;console.log(Math.round(ended-started))'
  # expected: 238
  ```

- **The allow-list** (`orv141-allow-list`, rows 5 and 14). Input: row 5's fields with OpenRouter's message in the format of `packages/intent-engine/src/openrouter.ts` line 82 and the seeded values. No rounding.

  ```bash
  node -e 'const KEYS=["level","requestId","route","durationMs","outcome","step","limit","reason","status","errorName"];const fields={level:"error",requestId:"5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f",route:"directions/readBriefWithAi",durationMs:238,outcome:"failed",reason:"adapter-failed",detail:"OpenRouter answered 401. No auth credentials found ana@example.com sk-or-v1-seeded",email:"ana@example.com",token:"sk-or-v1-seeded"};const line=JSON.stringify(Object.fromEntries(Object.entries(fields).filter(([k])=>KEYS.includes(k))));console.log(line);console.log(line.includes("ana@example.com"),line.includes("sk-or-v1-seeded"))'
  # expected:
  # {"level":"error","requestId":"5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f","route":"directions/readBriefWithAi","durationMs":238,"outcome":"failed","reason":"adapter-failed"}
  # false false
  ```

- **A value outside its closed list** (`orv141-allow-list`, row 14). Input: a known kind and row 14's free-text `reason`. The set here holds only the non-`ActionError` members of `orv141-reasons`, enough for the example. No rounding.

  ```bash
  node -e 'const REASONS=new Set(["adapter-failed","invalid-output","evidence-mismatch","rate-limit","unexpected"]);for (const r of ["adapter-failed","OpenRouter answered 401."]) console.log(REASONS.has(r)?r:"unknown")'
  # expected:
  # adapter-failed
  # unknown
  ```

- **`errorName`** (`orv141-allow-list`, rows 6 and 13). Input: the `name` of a plain `Error`, of `DirectionError` (`packages/auth/src/directions.ts` line 33) and a crafted name holding an email. No rounding.

  ```bash
  node -e 'const re=/^[A-Z][A-Za-z]{0,39}$/;for (const n of ["Error","DirectionError","Error: ana@example.com"]) console.log(re.test(n)?n:"unknown")'
  # expected:
  # Error
  # DirectionError
  # unknown
  ```

- **The action outcome map** (`orv141-boundary-line`, rows 3, 4, 8 and 5). Input: outcome objects in the shapes of `Outcome<T>` and `RateLimited` in `apps/web/app/directions/actions.ts`. This covers the returned-outcome path only; the unavailable and thrown paths are known to the boundary before an outcome exists. Row 5's `reason` is then narrowed to the AI failure kind by `orv141-reasons`. No rounding.

  ```bash
  node -e 'const LIMITED=new Set(["rate-limited","ai-rate-limited"]);const FAILED=new Set(["failed","ai-failed","not-configured","ai-not-configured"]);const map=o=>o.ok?{level:"info",outcome:"ok"}:LIMITED.has(o.error)?{level:"warn",outcome:"limited",reason:o.error}:FAILED.has(o.error)?{level:"error",outcome:"failed",reason:o.error}:{level:"info",outcome:"refused",reason:o.error};for (const o of [{ok:true},{ok:false,error:"forbidden"},{ok:false,error:"ai-rate-limited",code:"RATE_LIMITED",retryAfter:120,retryable:true},{ok:false,error:"ai-failed"}]) console.log(JSON.stringify(map(o)))'
  # expected:
  # {"level":"info","outcome":"ok"}
  # {"level":"info","outcome":"refused","reason":"forbidden"}
  # {"level":"warn","outcome":"limited","reason":"ai-rate-limited"}
  # {"level":"error","outcome":"failed","reason":"ai-failed"}
  ```

- **The `api/auth` status map** (`orv141-boundary-line`, rows 12 and 13). Input: the statuses `authRoute` and Better Auth answer with (200, 302, 401, 429, 503) and a 500. No rounding.

  ```bash
  node -e 'const map=s=>s===429?["warn","limited"]:s===503?["error","unavailable"]:s>=500?["error","failed"]:s>=400?["info","refused"]:["info","ok"];for (const s of [200,302,401,429,503,500]) console.log(s,map(s).join(" "))'
  # expected:
  # 200 info ok
  # 302 info ok
  # 401 info refused
  # 429 warn limited
  # 503 error unavailable
  # 500 error failed
  ```

## Out of scope

- `requestId`, `code` and `retryable` in server action outcome objects, the closed error code list and the client retry matrix (ADR 0015 decision 7, ORV-113's error envelope item; open question 5).
- Masking `personal` fields and the unmask permission (ADR 0015 decision 8); no `personal` field is on the allow-list.
- Reformatting Next.js's or Better Auth's own log output (open question 6).
- A paid log service or a log drain (ADR 0015 "Not chosen").
- A request id on page (RSC) responses, and a line per page render.
- Any change to limits, counts, outcomes or UI copy.

## Impact list

- **Proxy**: `apps/web/proxy.ts` (the id, and how requests the matcher skips today are covered).
- **New logger module** with its unit test, in the place the tech notes choose; it must be importable by `packages/auth` code or receive the id and write function from the app.
- **Actions**: `apps/web/app/directions/actions.ts` (C2 to C4, the boundary line in `run`), `apps/web/app/account/actions.ts` (C5, both actions), `apps/web/i18n/actions.ts` (boundary line).
- **App server**: `apps/web/server/rate-limit.ts` (C1, the step line with the request's id and route).
- **`packages/auth`**: `auth-route.ts` (C6, the request's id in the envelopes, one line per answer), `client-ip.ts` (C7).
- **Lint**: `apps/web/eslint.config.mjs` and `packages/auth/eslint.config.mjs` (`orv141-no-console`).
- **Existing tests that change**: `apps/web/app/account/actions.test.ts` (exact keys of the line, ORV-123), `apps/web/app/directions/actions.test.ts` (the global `console.error` spy), `packages/auth/src/auth-route.test.ts` (the line's `route` value and one line per answer), `packages/auth/src/auth.integration.test.ts` (lines 236 and 265 spy `console.error`; line 304 expects no `x-request-id` on a Better Auth answer, which this story changes), `packages/auth/src/client-ip.test.ts` (line 51, the warn line).
- **Size.** Likely near 400 changed lines with tests. If the tech notes estimate more, split vertically: slice 1 the id, the logger and the directions actions (rows 1 to 8, 14 to 16); slice 2 the account and locale actions and `authRoute` (rows 9 to 13); row 18 with the last slice.
- **`security` role** is dispatched on the PR: the diff touches `apps/web/proxy.ts` and `packages/auth/**`, paths in `.claude/rules/security.md` (ADR 0015 decision 2).
- **Docs to review** (outside this task's write set): ADR 0015 decision 6 "known gap" sentence and its Confirmation, and "Not done yet" (observability); `docs/specs/ORV-122/spec.md` "The log line" and "Request id" bullets; `docs/specs/ORV-123/spec.md` `orv123-log-line` and open question 1; `docs/specs/ORV-112/spec.md` "Rules and bounds" (a log line for a call) and "Out of scope" (the request id helper); `docs/specs/ORV-112/tech.md` `logRateLimit` (line 356).

## Open questions

Each has a default; under the owner's delegation (ADR 0012 decision 4) G2 passes on the defaults.

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | Where is the id made for requests the proxy matcher skips (`next-router-prefetch`, `purpose: prefetch`)? | (a) the proxy runs for them too and only skips the CSP work; (b) the boundary makes its own id when the request did not pass the proxy; (c) both | (a) is one place but changes the matcher the CSP relies on; (b) needs a way to know the proxy ran that a client cannot fake | Row 2 must hold; the tech notes choose and say why |
| 2 | Does a successful call write a line? | (a) yes, `info`; (b) only refusals and failures | (b) leaves no `durationMs` for normal calls and no line to find by id after a good save | (a), `orv141-boundary-line` |
| 3 | Is `errorName` logged? | (a) yes, by the pattern in `orv141-allow-list`; (b) no, `reason: "unexpected"` only | (b) loses the one hint today's C3 line gives | (a) |
| 4 | Is OpenRouter's message (C4's third part) kept? | (a) dropped, the failure kind only; (b) kept, cut to 200 characters as today | (b) puts third-party free text in a line, which `orv141-allow-list` forbids; (a) loses the reason OpenRouter gave (no credit, no endpoint) | (a); a numeric `status` from the adapter can be added later as an allow-listed key if the adapter error carries one |
| 5 | Do server action failure outcomes carry `requestId` now? | (a) no, ORV-113's error envelope item adds it with `code` and `retryable`; (b) yes, here | (b) changes the `Outcome` type and every caller, beyond item 1 | (a); the operator matches by the response header |
| 6 | Are Next.js's and Better Auth's own log lines brought into the shape? | (a) no, recorded as a known gap; (b) yes | (b) means a Better Auth logger option and a Next.js instrumentation hook, more than one story | (a), "Honest limits" |
| 7 | Who runs row 18 and when? | (a) the release role or main session, recorded in the G5 packet; (b) the owner | (c) of row 18 needs Vercel log access | (a) for (a) and (b) of row 18; (c) is `owner_verify` in the G5 packet |
| 8 | Do today's `route` values change (`auth`, `account/sign-in`, `rate-limit`)? | (a) yes, to `orv141-routes`; (b) keep them | (b) leaves three naming schemes, and `rate-limit` names a step, not a route | (a); the moved values are listed in "Call sites to move" |
| 9 | Is the lint rule part of this story? | (a) yes, `orv141-no-console`; (b) no, review only | (b) leaves the allow-list open to any new `console` call | (a) |

## Depends on

ADR 0015 decision 6 (observability), decisions 2 (the `security` role), 7 (the error body's `requestId`), 8 and 9 (personal and secret fields), 13 (no conformance claim); `.claude/rules/security.md` rules 8 and 15; ADR 0012 decision 4 (G2 under delegation); ORV-113 (parent; item 1 is this slice); ORV-112 spec v1.5 (the limiter and its line, C1), ORV-122 spec (the `authRoute` envelopes and line, C6), ORV-123 spec v1.0 (`orv123-log-line`, C5); ORV-121 (two more lines, row 17, ORV-121 comment 10260).

## Changelog

- v1.0 (2026-10-29): first spec, ORV-113 item 1 as its own slice (task ORV-141-spec-1). Downstream to review: the ORV-141 Jira issue acceptance (rows 1 to 18), the tech notes (to be written: open question 1, the logger's place, the size), ADR 0015 decision 6 text and "Not done yet", `docs/specs/ORV-122/spec.md`, `docs/specs/ORV-123/spec.md`, `docs/specs/ORV-112/spec.md` and `docs/specs/ORV-112/tech.md` as listed under "Impact list", ORV-121's PR (row 17).
