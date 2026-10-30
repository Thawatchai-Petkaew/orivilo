---
issue: ORV-141 (https://tpetkaew.atlassian.net/browse/ORV-141)
lane: M
version: 1.4
---

# ORV-141: a server-made request id and one JSON log line per request

## Why

ADR 0015 decision 6 and `.claude/rules/security.md` rule 15 require three things that the app does not do today:

1. **A request id on every response.** Each server action and route handler response carries `x-request-id`, made by the server, never the client's value. Today only `authRoute`'s own 429 and 503 answers carry one (`packages/auth/src/auth-route.ts`, a fresh `randomUUID()` per answer); no server action response and no answer from Better Auth's handler does.
2. **One shape for a log line.** One JSON object per line with `level`, `requestId`, `route`, `durationMs` and `outcome`, and no secret or personal data. Today four of the seven request-time log calls write a plain string or a JSON object without `requestId` (see "Call sites to move").
3. **One log per error, at the boundary.** Today `readBriefWithAi` logs its failure inside the work function, and its text includes OpenRouter's own message (up to 200 characters of third-party text, `packages/intent-engine/src/openrouter.ts` line 82), which no one has checked for personal data.

ORV-141 is item 1 of ORV-113 as its own slice, lane M. The error envelope for server action outcomes, masking and the other ORV-113 items stay in ORV-113.

**Frame.** A server-side control, not a hook that judges a tool call's text. The request id is a correlation id: it is not a secret and grants nothing. What makes it trustworthy is that only server code sets it and a client-sent `x-request-id` is overwritten or ignored on every path into a server action or route handler (`orv141-request-id`). The allow-list in `orv141-allow-list` is enforced by the one logger every request-time line goes through; a direct `console` call elsewhere bypasses it, so `orv141-no-console` adds a lint rule. That lint rule is a guard rail for code written by agents and people who follow the rules, not a boundary: nothing outside the session stops a determined edit that disables it, and the reviewer and `security` roles read each diff for one.

**What is real.** Real server code with unit tests. Two things the unit tests do not prove: that Next.js 16.4.1 joins the header the proxy sets with a server action's own response, and that the lines reach Vercel's log view as one JSON object each. Row 18's staging probe (ORV-142) checks both before ORV-142's G5. Nothing here claims conformance to ASVS or any other standard (ADR 0015 decision 13).

## Story

As the person who runs ORIVILO and reads its logs on Vercel, I want every server action and API answer to carry an id the server made, and every log line for that request to carry the same id in one JSON shape with no personal data, so that when someone reports a failure I can find the one line that says what happened, how long it took and why, without reading anyone's email, brief or token.

## Scope

ORV-141 is slice 1 of this story: the request id (the proxy and its matcher), the logger (`packages/auth/src/log.ts`) and `authRoute`. Slice 2 is its own issue, ORV-142 (`docs/specs/ORV-142/spec.md`), split out by ORV-141 comment 10262 after G2 passed in comment 10261: the step lines, the boundary lines of the three action files, the lint rule, and the staging probe after them. "The set this covers", "Call sites to move", "Rules and bounds", "Worked examples" and "Open questions" stay in this file as the one home for both issues; ORV-142 points to them. The acceptance rows each issue carries are named above the acceptance table.

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
| Call | File and line | Today | Becomes |
| --- | --- | --- | --- |
| C1 | `apps/web/server/rate-limit.ts:14` | `console.log` JSON `{level:"info", route:"rate-limit", limit, outcome, durationMs}` | A step line by `orv141-step-lines` (`step: "rate-limit"`), with the request's `requestId` and `route` |
| C2 | `apps/web/app/directions/actions.ts:113` | `console.error("rate limit unavailable", limit)` | Removed; the boundary line by `orv141-boundary-line` says `outcome: "unavailable"`, `reason: "rate-limit"` |
| C3 | `apps/web/app/directions/actions.ts:137` | `console.error("direction action failed", <error name>)` | Removed; the boundary line says `outcome: "failed"`, `reason: "unexpected"`, `errorName` |
| C4 | `apps/web/app/directions/actions.ts:226` | `console.error("ai reading failed", <kind>, <OpenRouter message>)` inside the work function | Removed; the failure kind travels to the boundary line as `reason`; the OpenRouter message is not logged (open question 4) |
| C5 | `apps/web/app/account/actions.ts:14` | `console.error` JSON `{level, route:"account/sign-in", outcome:"unavailable"}` | Removed; the boundary line says `outcome: "unavailable"`, `reason: "rate-limit"` |
| C6 | `packages/auth/src/auth-route.ts:28` | `console.error` JSON `{level, requestId, route:"auth", outcome:"unavailable"}` with its own id | Removed; the boundary line for `api/auth` says `outcome: "unavailable"`, `reason: "rate-limit"`, `status: 503`, with the request's id |
| C7 | `packages/auth/src/client-ip.ts:33` | `console.warn` JSON `{level:"warn", route:"rate-limit", outcome:"no-trusted-ip"}`, once per process | A step line (`step: "client-ip"`), still once per process, with the `requestId` and `route` of the request that hit it |

Out of this set, and why: `packages/db/src/migrate.ts` and `packages/design-system/scripts/*` run from the command line, not while serving a request.

**ORV-121** (PR 141) writes two `ai-usage` step lines in `apps/web/app/directions/actions.ts`, `record-failed` and `cost-not-reported` (its branch first wrote them as "ai usage record failed" and "ai usage cost not reported"), with no job and no error name, and adds the boundary reasons `spend-cap` and `ai-spend-cap` (ORV-121 comment 10260; ORV-121 tech notes D1 to D3 and D5). ORV-121 merges after ORV-141 and ORV-142, so its builder writes them against the merged logger (row 17).

## Acceptance criteria

Every row's lines follow `orv141-line-shape` and `orv141-allow-list`. The UI copy in every row is today's copy, unchanged by this story; the "Who sees what" column quotes it so a test can check it did not change.

Since the split in ORV-141 comment 10262 this table keeps rows 1, 2, 12, 13, 14 and 15; rows 2 (its directions boundary part), 3 to 11, 15 (its lines from the slice 2 files), 16, 17 and 18 moved to ORV-142 (`docs/specs/ORV-142/spec.md`) with their numbers, so a row number this spec cites that is not in the table below is that row in ORV-142.

<!-- prettier-ignore -->
| # | Given | When | Who sees what | Data effect | Test |
| --- | --- | --- | --- | --- | --- |
| 1 | A `POST` to `/directions` with a `next-action` header and `x-request-id: client-chosen-id` | The proxy runs | Operator: the response carries `x-request-id`, a UUID v4 that is not `client-chosen-id`; the request passed on to the action carries the same value. Person: nothing changes | None | Proxy unit test, "makes the request id and never keeps the client's" |
| 2 | A request to a server action, and one to `GET /api/auth/get-session`, each with `x-request-id: client-chosen-id` and with `next-router-prefetch: 1` (once) or `purpose: prefetch` (once), headers that make today's matcher skip the proxy | The request is served | Operator: the response's `x-request-id` and every line for the request carry a server-made UUID v4, never `client-chosen-id` (`orv141-request-id`) | None | Test named in the tech notes per path (the matcher, the boundary, or both); in this issue the matcher, proxy and `api/auth` paths, the directions boundary path being ORV-142 row 2 |
| 12 | `authRoute` with a count that answers unavailable | `POST /api/auth/sign-in/social` with a JSON body | Operator: 503 with the `SERVICE_UNAVAILABLE` body; the body's `requestId`, the `x-request-id` header and the one boundary line's `requestId` are the same value, the request's id; the line has `level: "error"`, `route: "api/auth"`, `outcome: "unavailable"`, `reason: "rate-limit"`, `status: 503` | No `verification` row | `packages/auth/src/auth-route.test.ts`, "a store failure answers 503 and logs once" (widened) |
| 13 | `authRoute` with a handler that answers 200, then one that throws `new Error("ana@example.com")` | `GET /api/auth/get-session` | Operator: the 200 carries `x-request-id` and writes one `info` line, `outcome: "ok"`, `status: 200`; the throw writes one `error` line, `outcome: "failed"`, `reason: "unexpected"`, `errorName: "Error"`, without `ana@example.com`. Since ORV-144 the throw is answered 500 with the `INTERNAL_ERROR` body and its line also carries `status: 500` (ORV-144 row 5, `orv144-route-answers`); before ORV-144 it was rethrown and the line had no `status` | None | `auth-route.test.ts`, "every answer carries the request id and one line" |
| 14 | The logger called with `level`, `requestId`, `route`, `durationMs`, `outcome`, plus `email: "ana@example.com"`, `token: "sk-or-v1-seeded"`, `detail: "<OpenRouter message>"` and `reason: "OpenRouter answered 401."` | It writes the line | Operator: the line holds only allow-listed keys; `reason` is `"unknown"`; the text contains neither seeded value | None | Logger unit test, "writes only allow-listed keys and closed values" |
| 15 | Every line captured in rows 3 to 13 | Each is checked | Operator: each is one physical line (no newline inside), parses with `JSON.parse`, and has the five keys of `orv141-line-shape` with the types it names | None | Each row's test asserts the shape through one shared helper; in this issue the lines the `log.ts` and `authRoute` tests capture (`log.test.ts`, `auth-route.test.ts`, `auth.integration.test.ts`), the lines of the slice 2 files being ORV-142 row 15 |

## Rules and bounds

- **orv141-request-id.** The server makes one id per request to a server action or route handler: a UUID v4 from `crypto.randomUUID()`. A value the client sends in `x-request-id`, or in any other header, is never used as the id, on every path into those entries, including requests that carry `next-router-prefetch` or `purpose: prefetch` (which today's proxy matcher skips, `apps/web/proxy.ts` lines 22 to 25). The id goes in the response's `x-request-id` header on every answer (success, refusal, redirect, 429, 503, and answers Better Auth's handler writes), in every line logged for that request, and in the `requestId` of `authRoute`'s error bodies, which stop making their own. Where the id is made: open question 1. Page responses may carry the header too; this story does not require or test it.
- **orv141-line-shape.** A line is one JSON object on one physical line, written to standard output (`info`) or standard error (`warn`, `error`). It always has `level` (`"info"`, `"warn"` or `"error"`), `requestId` (the request's id from `orv141-request-id`), `route` (from `orv141-routes`), `durationMs` (a non-negative integer, `Math.round` of the elapsed milliseconds, halves up) and `outcome` (from `orv141-outcomes`). For a boundary line `durationMs` is the time from entering the boundary to writing the line; for a step line it is the step's own time.
- **orv141-allow-list.** A line holds only these keys: the five of `orv141-line-shape`, and optionally `step` (`"rate-limit"`, `"client-ip"`, `"ai-usage"`), `limit` (a `LimitName` from `packages/auth/src/rate-limit.ts`, or `auth-http`, the limit name `betterAuthStorage` in the same file gives Better Auth's counts), `reason` (from `orv141-reasons`), `status` (an integer HTTP status, `api/auth` lines only) and `errorName` (matching `^[A-Z][A-Za-z]{0,39}$`). Any other key the caller passes is dropped. A `route`, `step`, `reason` or `errorName` value outside its list or pattern is written as `"unknown"`. Each of the six keys `outcome`, `requestId`, `level`, `limit`, `status` and `durationMs` also has one fallback for a value outside its list, pattern or type; the six fallbacks are defined in the tech notes, section 3, "How `writeLine` closes a line", and the row 14 test in tech notes section 9 covers each. No key holds an email, name, IP, user id, workspace id, session token, API key, brief text, error message or stack, so no `personal` or `secret` field reaches a line and no mask helper is needed here (ADR 0015 decisions 8 and 9).
- **orv141-routes.** The `route` values are the third column of the table in "The set this covers", and nothing else. The `api/auth` value never holds the path, which the client chooses.
- **orv141-outcomes.** A boundary line's `outcome` is one of `ok`, `refused`, `limited`, `unavailable`, `failed`. A step line's `outcome` is, for `rate-limit`, `allowed`, `limited` or `unavailable`; for `client-ip`, `no-trusted-ip`; for `ai-usage`, `record-failed` or `cost-not-reported`.
- **orv141-reasons.** `reason` is the most specific closed value the boundary knows: an `interpretBrief` failure kind (`adapter-failed`, `invalid-output`, `evidence-mismatch`) for an AI failure; `rate-limit` when the limiter answered unavailable or the count threw; `spend-cap` when the spend cap's monthly sum could not be read, or not in time (ORV-121 `spend-cap-6`); `unexpected` for an error the boundary does not recognise; otherwise a member of the type `ActionError` in `apps/web/app/directions/actions.ts` (which includes `DirectionError["reason"]` and `ReplayRefusal`). `invalid-input` covers `setLocale`'s refused value.
- **orv141-boundary-line.** Each call of an entry in "The set this covers" writes exactly one boundary line when it ends, whatever the outcome, mapped from what the entry returns or throws: a success or Next's `redirect` is `ok` at `info`; a refusal the person can act on (an `ActionError` other than those below, an HTTP 4xx other than 429) is `refused` at `info`; a rate limit or the spend cap (`rate-limited`, `ai-rate-limited`, `ai-spend-cap`, HTTP 429) is `limited` at `warn`; the limiter or count unavailable (HTTP 503 from `authRoute`), or the spend cap's sum unavailable, is `unavailable` at `error`; `failed`, `ai-failed`, `not-configured`, `ai-not-configured`, an HTTP 5xx other than 503, or a throw is `failed` at `error`. A thrown error the entry rethrows today is still rethrown after its line.
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
  node -e 'const REASONS=new Set(["adapter-failed","invalid-output","evidence-mismatch","rate-limit","spend-cap","unexpected"]);for (const r of ["adapter-failed","OpenRouter answered 401."]) console.log(REASONS.has(r)?r:"unknown")'
  # expected:
  # adapter-failed
  # unknown
  ```

- **`limit`** (`orv141-allow-list`, rows 3 and 14). Input: the keys of `LIMITS` in `packages/auth/src/rate-limit.ts` (lines 25 to 35), `auth-http` from `betterAuthStorage` in the same file (line 246), and a free-text value. The `"unknown"` for a value outside the set is the fallback of tech notes section 3. No rounding.

  ```bash
  node -e 'const LIMIT_NAMES=["sign-in","ai-read","write","import","signed-out"];const allowed=new Set([...LIMIT_NAMES,"auth-http"]);for (const l of ["write","auth-http","ana@example.com"]) console.log(allowed.has(l)?l:"unknown")'
  # expected:
  # write
  # auth-http
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

- **The action outcome map** (`orv141-boundary-line`, rows 3, 4, 8 and 5; ORV-121 row 2). Input: outcome objects in the shapes of `Outcome<T>`, `RateLimited` and ORV-121's `SpendCapped` in `apps/web/app/directions/actions.ts`. This covers the returned-outcome path only; the unavailable and thrown paths are known to the boundary before an outcome exists. Row 5's `reason` is then narrowed to the AI failure kind by `orv141-reasons`. No rounding.

  ```bash
  node -e 'const LIMITED=new Set(["rate-limited","ai-rate-limited","ai-spend-cap"]);const FAILED=new Set(["failed","ai-failed","not-configured","ai-not-configured"]);const map=o=>o.ok?{level:"info",outcome:"ok"}:LIMITED.has(o.error)?{level:"warn",outcome:"limited",reason:o.error}:FAILED.has(o.error)?{level:"error",outcome:"failed",reason:o.error}:{level:"info",outcome:"refused",reason:o.error};for (const o of [{ok:true},{ok:false,error:"forbidden"},{ok:false,error:"ai-rate-limited",code:"RATE_LIMITED",retryAfter:120,retryable:true},{ok:false,error:"ai-spend-cap",code:"AI_SPEND_CAP",retryable:false},{ok:false,error:"ai-failed"}]) console.log(JSON.stringify(map(o)))'
  # expected:
  # {"level":"info","outcome":"ok"}
  # {"level":"info","outcome":"refused","reason":"forbidden"}
  # {"level":"warn","outcome":"limited","reason":"ai-rate-limited"}
  # {"level":"warn","outcome":"limited","reason":"ai-spend-cap"}
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
- The rows that moved to ORV-142 (named above the acceptance table) and the work they test: the step lines (C1, C7), the boundary lines of the three action files (C2 to C5), `orv141-no-console`, row 17's ORV-121 lines and the row 18 staging probe. Their spec is `docs/specs/ORV-142/spec.md` (ORV-141 comment 10262); the rules they test keep their one home in this file.

## Impact list

Since ORV-141 comment 10262 each bullet names the issue that carries it: ORV-141 (slice 1) or ORV-142 (slice 2).

- **Proxy** (ORV-141): `apps/web/proxy.ts` (the id, and the matcher change of open question 1).
- **New logger module** (ORV-141) with its unit test, in the place the tech notes choose; it must be importable by `packages/auth` code or receive the id and write function from the app.
- **Actions** (ORV-142): `apps/web/app/directions/actions.ts` (C2 to C4, the boundary line in `run`), `apps/web/app/account/actions.ts` (C5, both actions), `apps/web/i18n/actions.ts` (boundary line).
- **App server** (ORV-142): `apps/web/server/rate-limit.ts` (C1, the step line with the request's id and route).
- **`packages/auth`**: `auth-route.ts` (ORV-141; C6, the request's id in the envelopes, one line per answer), `client-ip.ts` (ORV-142; C7).
- **Lint** (ORV-142): `apps/web/eslint.config.mjs` and `packages/auth/eslint.config.mjs` (`orv141-no-console`).
- **Existing tests that change**: `apps/web/app/account/actions.test.ts` (ORV-142; exact keys of the line, ORV-123), `apps/web/app/directions/actions.test.ts` (ORV-142; the global `console.error` spy), `packages/auth/src/auth-route.test.ts` (ORV-141; the line's `route` value and one line per answer), `packages/auth/src/auth.integration.test.ts` (ORV-141; lines 236 and 265 spy `console.error`; line 304 expects no `x-request-id` on a Better Auth answer, which this story changes), `packages/auth/src/client-ip.test.ts` (ORV-142; line 51, the warn line).
- **Size.** Over 400 changed lines with tests (the estimate is in tech notes section 11), so the story ships as two vertical slices: slice 1 the id, the logger and `authRoute`; slice 2 the step lines, the three action files and the lint rule; row 18 after slice 2. The rows each slice carries and why `authRoute` ships with the proxy and the lint rule ships last are in tech notes section 11. Slice 1 is this issue; slice 2 is ORV-142, its own issue since ORV-141 comment 10262.
- **`security` role** is dispatched on the PR: the diff touches `apps/web/proxy.ts` and `packages/auth/**`, paths in `.claude/rules/security.md` (ADR 0015 decision 2). ORV-142's PR touches `packages/auth/**` too (`client-ip.ts`, `eslint.config.mjs`), so it is dispatched there as well (tech notes section 10).
- **Docs to review** (ORV-141 or ORV-142 by the "Brought up to date in" column of tech notes section 12, Slice 2 being ORV-142; outside this task's write set): ADR 0015 decision 6 "known gap" sentence and its Confirmation, and "Not done yet" (observability); `docs/specs/ORV-122/spec.md` "The log line" and "Request id" bullets; `docs/specs/ORV-123/spec.md` `orv123-log-line` and open question 1; `docs/specs/ORV-112/spec.md` "Rules and bounds" (a log line for a call) and "Out of scope" (the request id helper); `docs/specs/ORV-112/tech.md` `logRateLimit` (line 356); `docs/specs/ORV-108/spec.md` line 164 and row 69 (the proxy matcher skips prefetch requests, which open question 1 changes).

## Open questions

Each has a default; under the owner's delegation (ADR 0012 decision 4) G2 passes on the defaults.

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | Where is the id made for requests the proxy matcher skips (`next-router-prefetch`, `purpose: prefetch`)? | (a) the proxy runs for them too and only skips the CSP work; (b) the boundary makes its own id when the request did not pass the proxy; (c) both | (a) is one place but changes the matcher the CSP relies on; (b) needs a way to know the proxy ran that a client cannot fake | Decided in v1.1: (a), with one change from its wording: the proxy does the CSP work for prefetches too, because Next strips `next-router-prefetch` before the proxy sees the request, so the proxy cannot tell a prefetch from a navigation. The proxy is the only place the id is made; the reasons (b) and (c) cannot hold row 2 are in tech notes section 2 (D1) |
| 2 | Does a successful call write a line? | (a) yes, `info`; (b) only refusals and failures | (b) leaves no `durationMs` for normal calls and no line to find by id after a good save | (a), `orv141-boundary-line` |
| 3 | Is `errorName` logged? | (a) yes, by the pattern in `orv141-allow-list`; (b) no, `reason: "unexpected"` only | (b) loses the one hint today's C3 line gives | (a) |
| 4 | Is OpenRouter's message (C4's third part) kept? | (a) dropped, the failure kind only; (b) kept, cut to 200 characters as today | (b) puts third-party free text in a line, which `orv141-allow-list` forbids; (a) loses the reason OpenRouter gave (no credit, no endpoint) | (a); a numeric `status` from the adapter can be added later as an allow-listed key if the adapter error carries one |
| 5 | Do server action failure outcomes carry `requestId` now? | (a) no, ORV-113's error envelope item adds it with `code` and `retryable`; (b) yes, here | (b) changes the `Outcome` type and every caller, beyond item 1 | (a); the operator matches by the response header |
| 6 | Are Next.js's and Better Auth's own log lines brought into the shape? | (a) no, recorded as a known gap; (b) yes | (b) means a Better Auth logger option and a Next.js instrumentation hook, more than one story | (a), "Honest limits" |
| 7 | Who runs row 18 and when? | (a) the release role or main session, recorded in the G5 packet; (b) the owner | (c) of row 18 needs Vercel log access | (a) for (a) and (b) of row 18; (c) is `owner_verify` in the G5 packet |
| 8 | Do today's `route` values change (`auth`, `account/sign-in`, `rate-limit`)? | (a) yes, to `orv141-routes`; (b) keep them | (b) leaves three naming schemes, and `rate-limit` names a step, not a route | (a); the moved values are listed in "Call sites to move" |
| 9 | Is the lint rule part of this story? | (a) yes, `orv141-no-console`; (b) no, review only | (b) leaves the allow-list open to any new `console` call | (a) |

## Depends on

ADR 0015 decision 6 (observability), decisions 2 (the `security` role), 7 (the error body's `requestId`), 8 and 9 (personal and secret fields), 13 (no conformance claim); `.claude/rules/security.md` rules 8 and 15; ADR 0012 decision 4 (G2 under delegation); ORV-113 (parent; item 1 is this slice); ORV-112 spec v1.5 (the limiter and its line, C1), ORV-122 spec (the `authRoute` envelopes and line, C6), ORV-123 spec v1.0 (`orv123-log-line`, C5); ORV-121 (two step lines, row 17, ORV-121 comment 10260; the reasons `spend-cap` and `ai-spend-cap`, ORV-121 tech notes D1 and D5); ORV-141 comment 10261 (G2 passed, the rows of each slice) and comment 10262 (the split: slice 2 is ORV-142, `docs/specs/ORV-142/spec.md`).

## Changelog

- v1.0 (2026-10-29): first spec, ORV-113 item 1 as its own slice (task ORV-141-spec-1). Downstream to review: the ORV-141 Jira issue acceptance (rows 1 to 18), the tech notes (to be written: open question 1, the logger's place, the size), ADR 0015 decision 6 text and "Not done yet", `docs/specs/ORV-122/spec.md`, `docs/specs/ORV-123/spec.md`, `docs/specs/ORV-112/spec.md` and `docs/specs/ORV-112/tech.md` as listed under "Impact list", ORV-121's PR (row 17).
- v1.1 (2026-10-29): the tech notes' "Findings for the spec" F1 to F4 (task ORV-141-spec-2); no acceptance row changes. F1, contract change: `orv141-allow-list` closes `limit` to `LimitName` plus `auth-http`. F2, contract change: `orv141-allow-list` names a fallback for `outcome`, `requestId`, `level`, `limit`, `status` and `durationMs`, defined in tech notes section 3. F3, contract change: open question 1 decided (a), the proxy matcher passes prefetches and the proxy does the CSP work for them too (tech notes section 2). F4, no contract change: the "Impact list" slice split is the one in tech notes section 11. Downstream to review: `docs/specs/ORV-141/tech.md` (front matter `spec:` version, D6, the F2 sentence in section 3, the first paragraph of section 11, the "Findings for the spec" table), `docs/specs/ORV-108/spec.md` line 164 and row 69 (the matcher), the ORV-141 Jira issue (no acceptance change).
- v1.2 (2026-10-29): the scope split of ORV-141 comment 10262 (task ORV-141-spec-6); no requirement changes. The acceptance table keeps rows 1, 2, 12, 13, 14 and 15; rows 2 (its directions boundary part), 3 to 11, 15 (its lines from the slice 2 files), 16, 17 and 18 move with their numbers and words to `docs/specs/ORV-142/spec.md`, and one sentence above the table names them. Rows 2 and 15 each gain one clause scoping them to the slice 1 paths; no other row, rule, worked example or open question changes. New "Scope" section; "Out of scope", "Impact list" and "Depends on" name ORV-142. Downstream to review: `docs/specs/ORV-141/tech.md` (front matter `spec:` version, D6, sections 6, 7, 10, 11 and 12 where they say "slice 2"), the ORV-141 and ORV-142 Jira issues (acceptance rows per issue), ADR 0015 lines 93, 95 and 186 (now updated by ORV-142). Bookkeeping (task ORV-141-spec-7): "What is real" says row 18's staging probe is ORV-142's and runs before ORV-142's G5, as ORV-142 open question 2's default reads; no requirement change.
- v1.3 (2026-10-29): brought up to date for ORV-144 (its tech notes section 13, task ORV-144-spec-2); the change is ORV-144's requirement (`orv144-route-answers`, ORV-144 open question 2), not this story's. Row 13 says a throw in `authRoute` is answered 500 with the `INTERNAL_ERROR` body and its line carries `status: 500` since ORV-144, with one clause on the rethrow and the line without `status` before it. No other row, rule, worked example or open question changes; ORV-144 lands in one PR, so the row reads true once that PR merges. Downstream to review: `docs/specs/ORV-141/tech.md` lines 230, 244, 245 and 318 (ORV-144 tech notes section 13, architect), `packages/auth/src/auth-route.test.ts` (rebuilt to this in ORV-144, its row 5), the ORV-141 Jira issue acceptance (row 13).
- v1.4 (2026-10-30): brought up to date for ORV-121, from its tech notes revision ORV-121-tech-5 (decisions D1 to D3 and D5, under the owner's delegation, ADR 0012 decision 4; task ORV-121-spec-5); the change is ORV-121's requirement, not this story's, and it rides in ORV-121's PR, which merges after ORV-141 and ORV-142. Contract change: `orv141-reasons` gains `spend-cap`, for a spend cap sum that could not be read (D1), and `orv141-boundary-line` reads `ai-spend-cap` as `limited` at `warn` (D5) and an unreadable spend cap sum as `unavailable` at `error` (D1). "Call sites to move" says ORV-121 writes its two lines as the `ai-usage` step lines `record-failed` and `cost-not-reported`, with no job and no error name (D2, D3), against the merged logger, and "Depends on" names the two reasons. The worked example "The action outcome map" gains the `ai-spend-cap` input and its line, and "A value outside its closed list" gains `spend-cap` in its set, with the same output. No acceptance row, step, step outcome or allow-listed key changes. Downstream to review: `docs/specs/ORV-141/tech.md` lines 91 and 92 (the `REASONS` sketch) and the Directions table of its section 5 (lines 214 to 222, which has no spend cap branch), architect; `packages/auth/src/log.ts` `REASONS` and its comment, and `log.test.ts` "pins the lists the spec names, in order" (ORV-121's builder, ORV-121 tech notes S12). `docs/specs/ORV-142/spec.md` row 17 is met as written.
