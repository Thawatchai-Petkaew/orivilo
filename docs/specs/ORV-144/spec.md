---
issue: ORV-144 (https://tpetkaew.atlassian.net/browse/ORV-144)
parent: ORV-113 (item 2)
lane: M
version: 1.2
---

# ORV-144: one error body, its codes and the retry matrix (ORV-113 item 2)

## Why

ADR 0015 decision 7 and `.claude/rules/security.md` rule 14 set one shape for every error the server gives back and one table for what a client does with it. Today the app has three shapes and no table:

1. **`authRoute` builds the body inline.** `packages/auth/src/auth-route.ts` lines 12 to 22 write `{"error": {"code", "message", "requestId", "retryable": true}}` for its own 429 and 503 only, with `retryable` fixed to `true`. Better Auth's own error answers pass through in Better Auth's shape (line 103), and any other throw is rethrown (line 109), so Next.js answers a bare 500 with no `requestId`.
2. **Server actions return an outcome object.** `apps/web/app/directions/actions.ts` returns `{ ok: false, error }` (lines 63 to 66); only the rate limit outcome carries `code` and `retryable` (lines 55 to 61, ORV-112), and none carries `requestId`. Decision 7 says these outcomes "carry the same `code`, `requestId` and `retryable` fields".
3. **Nothing reads a status class.** No client code follows the matrix, a failure the person reports has no id they can quote, and a server action call that fails before an answer arrives leaves the Studio's button loading (survey R3).

ORV-144 is item 2 of ORV-113 as its own story: the helper that builds the body from a closed list of codes, the same fields in server action outcomes, the retry matrix as a client module, and the UI for the shapes. ORV-141 (item 1) made the request id this story puts in the body.

**Frame.** A server-side control and a client module, not a hook that judges a tool call's text, so it is neither a guard rail nor a boundary in the L-0012 sense. What keeps personal data and stacks out of a body is that the message comes from the code list, never from an error object (`orv144-message`); the reviewer and `security` roles read each diff for a body built another way.

**What is real.** Real server and client code with unit tests. One part has no caller in the app today: every client call is a server action, an HTTP `POST` without an idempotency key, so by decision 7 none is retried automatically, and the retry module is proven by its own tests only until a `GET` or keyed caller exists (open question 4). Nothing here claims conformance to ASVS or any other standard (ADR 0015 decision 13).

## Story

As a person using ORIVILO, when something fails I want to read in my language what went wrong and what to do, and, when the fault is on the server, an id I can quote; as the person who runs ORIVILO, I want that id to match the log line ORV-141 writes, and every error body to have one shape with no stack, path or personal data, so that a failure report leads to one line and a client knows from the body alone whether to try again.

## Lane

**M.** The story touches none of the lane table's risk flags: no token or profile schema, no component public API (`DirectionStudio`'s `readWithAi` prop keeps its type), no resolver, and no change to who may read or write what. `authRoute` changes only the body of answers that are already errors. The 404-instead-of-403 change of ADR 0015 decision 10 is L lane and stays out (see "Out of scope"). The `security` role is dispatched on the PR because the diff touches `packages/auth/**`, a path in `.claude/rules/security.md` (ADR 0015 decision 2).

## The set this covers

The survey ran on `feature/ORV-144-error-envelope` at `7112447`. Producers are the places that make an error body or a failure outcome; readers are the places that turn one into what a person sees. Found with: `grep -rl '^"use server"' apps/web` (3 files, 10 server actions), the glob `apps/web/**/route.ts` (1 route file, `GET` and `POST`), `grep -n 'new Response(\|NextResponse\.\|Response.json(' apps packages` outside tests (`auth-route.ts` lines 19 and 43; `apps/web/proxy.ts` line 21 is `NextResponse.next`, not an error), `grep -n 'fetch(' apps packages` (one outbound call), and `grep -n 'createAuthClient\|better-auth/react\|better-auth/client' apps packages` (no match: no client code calls `/api/auth` and parses its body).

### Producers (8)

<!-- prettier-ignore -->
| # | Where | Today | Becomes |
| --- | --- | --- | --- |
| P1 | `packages/auth/src/auth-route.ts` lines 12 to 34 (`envelope`, `rateLimited`, `unavailable`) | Inline body for 429 `RATE_LIMITED` and 503 `SERVICE_UNAVAILABLE`, `retryable: true` fixed | Built by the helper of `orv144-envelope` from `orv144-codes`; same bytes as today for these two |
| P2 | `auth-route.ts` line 103 (`withRequestId(response, ...)`) | Better Auth's own answers pass through with Better Auth's body, error statuses included | An answer with status 400 or more is rewritten by `orv144-route-answers` (open question 1) |
| P3 | `auth-route.ts` line 109 (`throw error`) | Any throw other than `RateLimitUnavailable` is rethrown; Next.js answers a bare 500 | A 500 `INTERNAL_ERROR` body by `orv144-route-answers` (open question 2) |
| P4 | `apps/web/app/directions/actions.ts` lines 43 to 66 and `run`, lines 127 to 191 (7 actions: `listDirections`, `saveDirection`, `approveDirection`, `openVersion`, `exportVersion`, `importDirection`, `readBriefWithAi`) | `{ ok: false, error }`; the rate limit outcome adds `code: "RATE_LIMITED"`, `retryAfter`, `retryable: true` | Every failure outcome carries `code`, `requestId` and `retryable` by `orv144-outcome` |
| P5 | `apps/web/app/account/actions.ts` lines 10 to 11 and 33 to 47 (`signInWithGoogle`) | `{ error: "rate-limited", retryAfter }` or `{ error: "failed" }`; a throw from `signInSocial` (line 44) or the missing URL (line 47) is rethrown | The two states carry `code`, `requestId` and `retryable` by `orv144-outcome`; the throws by open question 9 |
| P6 | `account/actions.ts` lines 55 to 65 (`signOut`) | Returns nothing; a throw from Better Auth's `signOut` is rethrown | Unchanged (no outcome object; open question 9) |
| P7 | `apps/web/i18n/actions.ts` lines 19 to 24 (`setLocale`) | An unknown locale is a refusal that returns nothing and shows nothing | Unchanged: no error shape reaches a person or a client |
| P8 | `packages/intent-engine/src/openrouter.ts` lines 62 to 82 (server to OpenRouter) | A `POST` without an idempotency key; a non-2xx answer throws; never retried | Unchanged; it already follows `orv144-retry` (a `POST` without a key is not retried). Its failure reaches the person as P4's `ai-failed` |

Inner error classes are mapped at a boundary and are not bodies: `Denied` (`packages/auth/src/access.ts` lines 8 to 17), `DirectionError` (`packages/auth/src/directions.ts` lines 29 to 31), `RateLimitUnavailable` (`packages/auth/src/rate-limit.ts`), `AiFailed` and `MissingEnvError` (caught in `run`, `actions.ts` lines 169 to 188). They keep their shape.

### Readers (7)

<!-- prettier-ignore -->
| # | Where | Today | Becomes |
| --- | --- | --- | --- |
| R1 | `apps/web/app/directions/page.tsx` lines 15 to 21 (`load`) | Maps `listDirections`' failure to a `SavedView` with its `error` | The `error` view also keeps the outcome's `code` and `requestId` for `orv144-ui` |
| R2 | `SavedStudio.tsx` lines 127 to 129 (first notice from the view) | One `errorLine` | `orv144-ui`, reference line |
| R3 | `SavedStudio.tsx` lines 159 to 173 (`act`) | No `catch`: a rejected call leaves `busy` set and the rejection unhandled | `orv144-ui`, reference line and network line |
| R4 | `SavedStudio.tsx` lines 175 to 178 (`refresh`) | A failure keeps the last list; a rejection is unhandled | A failure or a rejection keeps the last list and changes no notice (`orv144-ui`) |
| R5 | `apps/web/app/directions/read-outcome.ts` lines 15 to 28 and `apps/web/i18n/wait.ts` lines 23 to 34 | `errorLine` by the `error` key | Same key; `orv144-ui` adds the reference line |
| R6 | `apps/web/app/account/SignInForm.tsx` and `sign-in-line.ts` lines 21 to 30 | `signInLine` by the `error` key | `orv144-ui`, reference line (open question 9) |
| R7 | `packages/design-system/src/components/direction-studio/DirectionStudio.tsx` lines 400 to 409 | A rejected `readWithAi` already shows the AI failed line | Unchanged |

A server action or route handler added later joins these tables and `orv144-outcome` or `orv144-route-answers` in the same PR.

## Acceptance criteria

Every body in these rows has the shape of `orv144-envelope`; every code, status and default `retryable` is the one `orv144-codes` gives. A UI line quoted here is the locale catalog's (`apps/web/i18n/messages.ts`, or `packages/design-system/src/i18n` for a `direction.*` key). `<id>` is the request's id from ORV-141 `orv141-request-id`.

<!-- prettier-ignore -->
| # | Given | When | Who sees what | Data effect | Test |
| --- | --- | --- | --- | --- | --- |
| 1 | The code list module | Its exports are read | Operator: exactly the 13 codes of `orv144-codes`, each with the status, default `retryable` and message of its row | None | New `packages/auth/src/errors.test.ts`, "the code list is the matrix's statuses, one code each" |
| 2 | `authRoute` with a count that answers limited, and one with a handler that answers 429 with `X-Retry-After: 7` | `POST /api/auth/sign-in/social` with a JSON body | Operator: 429, `Retry-After` as today, body exactly `{"error":{"code":"RATE_LIMITED","message":"Too many requests. Try again later.","requestId":<id>,"retryable":true}}` with no other key at either level, `x-request-id` equal to `requestId` | No `verification` row | `packages/auth/src/auth-route.test.ts`, "turns a 429 into Retry-After and the RATE_LIMITED body" (widened to exact keys) |
| 3 | `authRoute` with a count that answers unavailable | The same request | Operator: 503, body exactly `{"error":{"code":"SERVICE_UNAVAILABLE","message":"Service unavailable. Try again later.","requestId":<id>,"retryable":true}}`; one boundary line as ORV-141 row 12 | No `verification` row | `auth-route.test.ts`, "a store failure answers 503 and logs once" (widened to exact keys) |
| 4 | `authRoute` with a handler that answers 401 with Better Auth's body `{"code":"UNAUTHORIZED","message":"ana@example.com"}` and two `Set-Cookie` values; then handlers answering 400, 418, 500 and 503 the same way; then 200 and 302 | `GET /api/auth/get-session` | Operator: 401 with the `UNAUTHENTICATED` body, both cookies kept, no `ana@example.com` in the body; 400 and 418 with `BAD_REQUEST`; 500 with `INTERNAL_ERROR`; 503 with `SERVICE_UNAVAILABLE`; the 200 and 302 bodies byte for byte as the handler wrote them | None | `auth-route.test.ts`, "an error answer from Better Auth gets the error body" (open question 1) |
| 5 | `authRoute` with a handler that throws `new Error("ana@example.com at /Users/x/app.ts:12")` | `GET /api/auth/get-session` | Operator: 500, body exactly the `INTERNAL_ERROR` body with `requestId` equal to `x-request-id`; the body contains neither `ana@example.com`, `/Users/` nor ` at `; the call does not reject. One boundary line, `level: "error"`, `outcome: "failed"`, `reason: "unexpected"`, `errorName: "Error"`, `status: 500` | None | `auth-route.test.ts`, "every answer carries the request id and one line" (its throw case changes from rethrown to the 500 body, open question 2) |
| 6 | A signed-in person who is not a member of the active workspace, Thai or English UI | They press "Save draft" / "บันทึกฉบับร่าง" | Person: today's line, English "This account is not allowed to do this in this workspace." / Thai "บัญชีนี้ไม่มีสิทธิ์ทำสิ่งนี้ในเวิร์กสเปซนี้", with no reference line. Operator: the outcome is `{ ok: false, error: "forbidden", code: "FORBIDDEN", requestId: <id>, retryable: false }`, and its `requestId` equals the boundary line's | None | `apps/web/app/directions/actions.test.ts`, "a failure outcome carries code, requestId and retryable" |
| 7 | The 15 members of `ActionError` and the two unavailable paths, each forced in turn | The action runs | Operator: each outcome's `code` and `retryable` are the ones the table in `orv144-outcome` gives for its `error` and path | None | `actions.test.ts`, "each reason maps to its code" (one case per table row) |
| 8 | The limiter answers unavailable | A person saves | Person: today's line in the notice, badge "Not done" / "ทำไม่สำเร็จ", line English "That did not work. Try again." / Thai "ทำไม่สำเร็จ ลองอีกครั้ง", no reference line. Operator: `code: "SERVICE_UNAVAILABLE"`, `retryable: true`; `saveDirection` was called once | No data written | `actions.test.ts` (the outcome) and new `apps/web/app/directions/SavedStudio.test.tsx`, "a failed write is shown and not retried", through `runCall` of `apps/web/app/directions/studio-calls.ts` (`apps/web` has no DOM test environment, so the press itself is not simulated) |
| 9 | The direction service throws `new Error("ana@example.com tok_seeded")` | A person saves, Thai or English UI | Person: badge "Not done" / "ทำไม่สำเร็จ", then English "That did not work. Try again." and "Reference: <id>" / Thai "ทำไม่สำเร็จ ลองอีกครั้ง" and "รหัสอ้างอิง: <id>", in the notice's live region. Operator: `code: "INTERNAL_ERROR"`, `retryable: false`; `JSON.stringify` of the outcome contains neither seeded value | None | `actions.test.ts`, "an unexpected error carries INTERNAL_ERROR and nothing of the error"; `SavedStudio.test.tsx`, "an INTERNAL_ERROR notice shows the reference", through `runCall` |
| 10 | A person over the `write` limit | They save | Person: today's ORV-112 line, English "Too many requests in a short time, so this was not done. Try again in 10 minutes." / Thai "ส่งคำขอถี่เกินไป จึงยังไม่ได้ทำรายการนี้ ลองใหม่ได้ในอีก 10 นาที" (wait as computed), no reference line. Operator: the ORV-112 outcome plus `requestId` | No data written | `actions.test.ts`, the `refused` helper gains `requestId` |
| 11 | A signed-in person; the fake `fetch` answers OpenRouter's 500 | They press "Read with AI" / "ให้ AI อ่าน" | Person: the rules' reading and today's line `direction.aiFailed`, English "AI could not read it, so this is the rules' reading" / Thai "AI อ่านไม่สำเร็จ จึงแสดงการอ่านตามกฎแทน". Operator: `code: "UPSTREAM_FAILED"`, `retryable: true`; `readBriefWithAi` and `fetch` were each called once | No model output saved | `actions.test.ts`, "an AI failure carries UPSTREAM_FAILED and is not retried" |
| 12 | `listDirections` returns an `INTERNAL_ERROR` outcome while `/directions` renders | The page loads, Thai or English | Person: the notice shows "That did not work. Try again." / "ทำไม่สำเร็จ ลองอีกครั้ง" and the reference line with the outcome's `requestId` | None | `SavedStudio.test.tsx`, "the first notice from the page keeps the reference" |
| 13 | A signed-in person on `/directions`; `saveDirection` rejects with `new TypeError("Failed to fetch")` | They press "Save draft" | Person: badge "Not done" / "ทำไม่สำเร็จ", line English "Could not reach ORIVILO. Check your connection, then try again." / Thai "ติดต่อ ORIVILO ไม่ได้ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง"; the button leaves its loading state; `saveDirection` was called once | None | `SavedStudio.test.tsx`, "a call with no answer shows the network line and is not retried", through `runCall` with a rejecting call |
| 14 | A save that succeeds, then `listDirections` rejects during the refresh | The save ends | Person: "Saved the draft of {name}" / "บันทึกฉบับร่างของ {name} แล้ว" stays; the list keeps its last state; no unhandled rejection | None | `SavedStudio.test.tsx`, "a failed refresh keeps the saved notice", through `runCall` whose `done` awaits `refreshList` with a rejecting list |
| 15 | The sign-in count answers limited, then unavailable, then `signInSocial` throws `new Error("oauth down ana@example.com")` | "Sign in with Google" / "ลงชื่อเข้าใช้ด้วย Google" is pressed each time | Person: today's limited notice (ORV-122 row 11) and today's failed line, English "You cannot sign in right now. Try again." / Thai "ตอนนี้ยังลงชื่อเข้าใช้ไม่ได้ ลองใหม่อีกครั้ง"; on the third, the failed line and the reference line. Operator: the states carry `RATE_LIMITED`/`true`, `SERVICE_UNAVAILABLE`/`true`, `INTERNAL_ERROR`/`false`, each with `requestId`; the third does not reject and holds no `ana@example.com` | `signInSocial` not called on the first two | `apps/web/app/account/actions.test.ts` ("oauth down" and "did not return a URL" change from rejects to the `INTERNAL_ERROR` state, open question 9) and `sign-in-line.test.ts`, "an INTERNAL_ERROR state shows the reference" |
| 16 | The retry module, a `GET`, answers 400, 401, 403, 404, 409, 413, 422 and 500 in turn | It decides | No retry for each: the first answer is the result, one call | None | New `apps/web/client/retry.test.ts`, "4xx and 500 are not retried" |
| 17 | The retry module, a `GET`, answers 429 with `Retry-After: 2`, then 408 with none, then 429 with `Retry-After: 3600` | It decides | Waits 2000 ms, then 1000 ms; the third is not retried (open question 7); after 3 retries the fourth answer is the result | None | Retry module test, "408 and 429 wait for Retry-After" (fake timers) |
| 18 | The retry module, a `GET`, answers 502, 503, 504, and a call that rejects with no answer | It decides, with the random source fixed | Waits within the bounds `orv144-retry` gives for retries 1, 2 and 3, then returns the fourth result | None | Retry module test, "5xx gateway answers and network errors back off with jitter" |
| 19 | The retry module: a `GET` answered 503 with body `retryable: false`; a `POST` answered 503; a `POST` with `Idempotency-Key: k1` answered 503 | It decides | No retry; no retry; retried as a `GET` | None | Retry module test, "only a GET or a keyed write is retried, and never a retryable false" |
| 20 | The new catalog keys of `orv144-ui`, in `apps/web/i18n/messages.ts` | `pnpm test` and `pnpm typecheck` run | Both pass: every string of the catalog's Thai and English trees is non-empty and holds no middot and no em dash, and the two trees have the same key paths (a key in one language only also fails `pnpm typecheck`) | None | New `apps/web/i18n/messages.test.ts`, "every catalog string is in Thai and English, without a middot or an em dash"; `pnpm typecheck` for the key set. No `check-i18n` command exists, and the existing i18n and copy checks scan `packages/design-system` only |

## Rules and bounds

- **orv144-envelope.** An error body is a JSON object with one key, `error`, whose value has exactly four keys: `code` (a member of `orv144-codes`), `message` (by `orv144-message`), `requestId` (the request's id, ORV-141 `orv141-request-id`) and `retryable` (a boolean). The response has `content-type: application/json` and `x-request-id` equal to `requestId`. One helper beside the code list builds it; no other code writes an error body.
- **orv144-codes.** The closed list holds one code per status the matrix of ADR 0015 decision 7 names, kept beside the helper. A status the list does not name maps by class: another 4xx to `BAD_REQUEST`, another 5xx to `INTERNAL_ERROR`. `retryable` is the matrix's default for the status. A new code joins the list, this table and its test in the PR that first makes it (for example `AI_SPEND_CAP`, open question 12).

  <!-- prettier-ignore -->
  | Code | Status | Retryable | Message |
  | --- | --- | --- | --- |
  | `BAD_REQUEST` | 400 | false | The request is not valid. |
  | `UNAUTHENTICATED` | 401 | false | Sign in to continue. |
  | `FORBIDDEN` | 403 | false | This action is not allowed. |
  | `NOT_FOUND` | 404 | false | Not found. |
  | `TIMEOUT` | 408 | true | The request took too long. Try again. |
  | `CONFLICT` | 409 | false | The request conflicts with the current state. |
  | `PAYLOAD_TOO_LARGE` | 413 | false | The request is too large. |
  | `INVALID_INPUT` | 422 | false | The input is not valid. |
  | `RATE_LIMITED` | 429 | true | Too many requests. Try again later. |
  | `INTERNAL_ERROR` | 500 | false | Something went wrong on our side. |
  | `UPSTREAM_FAILED` | 502 | true | A service we depend on failed. Try again later. |
  | `SERVICE_UNAVAILABLE` | 503 | true | Service unavailable. Try again later. |
  | `UPSTREAM_TIMEOUT` | 504 | true | A service we depend on did not answer in time. Try again later. |

- **orv144-message.** `message` is the fixed English text of its code's row above, read by code, not shown to people (as ORV-112 decided for the two bodies of today). It is never built from an error object, a third party's text, a query, a path or a request value, so no stack, path or personal data can reach it.
- **orv144-outcome.** A server action failure outcome keeps its `error` key (the catalog key the UI reads and the log's `reason`) and adds `code`, `requestId` (the same value the boundary line holds) and `retryable`. A rate limit outcome keeps `retryAfter`. The map, for the 15 members of `ActionError` (`signed-out`, `forbidden`, `not-configured`, `failed`, `ai-failed`, `ai-not-configured`, `rate-limited`, `ai-rate-limited`, `invalid-input`, `invalid-file`, `not-found`, `no-draft`, `resolver-changed`, `profile-missing`, `fingerprint-mismatch`) and for `signInWithGoogle`'s states:

  <!-- prettier-ignore -->
  | `error` | Path | Code |
  | --- | --- | --- |
  | `signed-out` | any | `UNAUTHENTICATED` |
  | `forbidden` | any | `FORBIDDEN` |
  | `not-found` | any | `NOT_FOUND` |
  | `no-draft` | any | `CONFLICT` |
  | `invalid-input`, `invalid-file`, `resolver-changed`, `profile-missing`, `fingerprint-mismatch` | any | `INVALID_INPUT` |
  | `rate-limited`, `ai-rate-limited` | over a limit | `RATE_LIMITED` |
  | `failed`, `ai-failed` | the limiter or count answered unavailable | `SERVICE_UNAVAILABLE` |
  | `ai-failed` | an `interpretBrief` failure kind (`adapter-failed`, `invalid-output`, `evidence-mismatch`) | `UPSTREAM_FAILED` |
  | `failed`, `not-configured`, `ai-not-configured` | a throw the boundary does not recognise, or a missing setting | `INTERNAL_ERROR` |

  `retryable` is the code's default from `orv144-codes`. `setLocale` and `signOut` return no outcome and are outside this rule (P6, P7).

- **orv144-route-answers.** Every answer `authRoute` gives with status 400 or more carries the body of `orv144-envelope`: its own 429 and 503 as today; Better Auth's own error answers rewritten, with the code of their status by `orv144-codes`, keeping every other header (each `Set-Cookie` included) except `content-type` and `content-length` (open question 1), and keeping the handler's status: a 418 answers 418 with `BAD_REQUEST`, a 501 answers 501 with `INTERNAL_ERROR`; and a throw other than `RateLimitUnavailable` answered as 500 `INTERNAL_ERROR` instead of rethrown, with the boundary line `outcome: "failed"`, `reason: "unexpected"`, its `errorName` and `status: 500` (open question 2). Answers below 400 pass through unchanged.
- **orv144-retry.** One client module decides whether to try a call again; it imports nothing from `node:` and no value from `@orivilo/auth`. A call is retried only when all hold: it is a `GET`, or a write whose request carries a non-empty `Idempotency-Key` header (open question 4); the body does not say `retryable: false`; fewer than 3 retries were made after the first call (open question 5). Then, by the answer: 408 or 429 waits `Retry-After` seconds when it is a whole number from 0 to 10, 1 s when it is missing or not a whole number, and is not retried when it is over 10 (open question 7); 502, 503, 504 and a call with no answer wait `500 × 2^n × (0.5 + r)` ms, rounded with `Math.round`, where `n` is the number of retries already made (0, 1, 2) and `r` is a random number in [0, 1) (open question 6). Any other status is not retried. A call its caller aborted (the request's `signal` is aborted) is not retried, though it has no answer: its error is the result at once, since the caller asked to stop (tech notes D7, the supporting test "an aborted call is not retried"). When no retry is left, the last answer is the result.
- **orv144-ui.** The person reads the line the catalog gives for the outcome's `error`, as today. Two lines are new, in a new `failure` group of `apps/web/i18n/messages.ts`:

  <!-- prettier-ignore -->
  | Key | English | Thai |
  | --- | --- | --- |
  | `failure.reference` | Reference: {requestId} | รหัสอ้างอิง: {requestId} |
  | `failure.network` | Could not reach ORIVILO. Check your connection, then try again. | ติดต่อ ORIVILO ไม่ได้ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง |

  `failure.reference` follows the failure line, in the same notice and live region, when the outcome's `code` is `INTERNAL_ERROR` (matrix row 500; open question 8): on `/directions` (R2, R3, R5) and under the sign-in button (R6). The two setup views of `/directions` (`signed-out`, `not-configured`) are states, not failure notices, and get no reference. `failure.network` is the notice line when a server action call from `/directions` rejects (R3); the button leaves its loading state. A rejected refresh (R4) keeps the last list and the current notice. No server action call is retried automatically, by `orv144-retry`, since each is a `POST` without an idempotency key.

- No other UI copy changes. The catalog lines quoted in rows 6, 8 to 13 and 15 are today's.

## Worked examples

Each line is copied from its source and was not run in this task (no shell).

- **Reason to code** (`orv144-outcome`, rows 6 to 11 and 15). Input: the 15 `ActionError` members from `apps/web/app/directions/actions.ts` lines 43 to 52 with `DirectionError["reason"]` (`packages/auth/src/directions.ts` line 30) and `ReplayRefusal` expanded, and the unavailable path of `run` (lines 145 to 149). No rounding.

  ```bash
  node -e 'const MAP={"signed-out":"UNAUTHENTICATED",forbidden:"FORBIDDEN","not-found":"NOT_FOUND","no-draft":"CONFLICT","invalid-input":"INVALID_INPUT","invalid-file":"INVALID_INPUT","resolver-changed":"INVALID_INPUT","profile-missing":"INVALID_INPUT","fingerprint-mismatch":"INVALID_INPUT","rate-limited":"RATE_LIMITED","ai-rate-limited":"RATE_LIMITED",failed:"INTERNAL_ERROR","not-configured":"INTERNAL_ERROR","ai-not-configured":"INTERNAL_ERROR","ai-failed":"UPSTREAM_FAILED"};const code=(error,unavailable)=>unavailable?"SERVICE_UNAVAILABLE":MAP[error];console.log(Object.keys(MAP).length);for (const [e,u] of [["forbidden",false],["no-draft",false],["fingerprint-mismatch",false],["ai-failed",false],["failed",true],["ai-failed",true]]) console.log(e,u,code(e,u))'
  # expected:
  # 15
  # forbidden false FORBIDDEN
  # no-draft false CONFLICT
  # fingerprint-mismatch false INVALID_INPUT
  # ai-failed false UPSTREAM_FAILED
  # failed true SERVICE_UNAVAILABLE
  # ai-failed true SERVICE_UNAVAILABLE
  ```

- **Status to code, with the class fallback** (`orv144-codes`, rows 1 and 4). Input: the statuses of the matrix in ADR 0015 decision 7 (lines 118 to 124) and row 4's 401, 418, 500, 503, plus 501. No rounding.

  ```bash
  node -e 'const BY={400:"BAD_REQUEST",401:"UNAUTHENTICATED",403:"FORBIDDEN",404:"NOT_FOUND",408:"TIMEOUT",409:"CONFLICT",413:"PAYLOAD_TOO_LARGE",422:"INVALID_INPUT",429:"RATE_LIMITED",500:"INTERNAL_ERROR",502:"UPSTREAM_FAILED",503:"SERVICE_UNAVAILABLE",504:"UPSTREAM_TIMEOUT"};const code=s=>BY[s]??(s<500?"BAD_REQUEST":"INTERNAL_ERROR");console.log(Object.keys(BY).length);for (const s of [401,418,500,501,503]) console.log(s,code(s))'
  # expected:
  # 13
  # 401 UNAUTHENTICATED
  # 418 BAD_REQUEST
  # 500 INTERNAL_ERROR
  # 501 INTERNAL_ERROR
  # 503 SERVICE_UNAVAILABLE
  ```

- **The body** (`orv144-envelope`, `orv144-message`, rows 5 and 9). Input: the `INTERNAL_ERROR` row and the request id of ORV-141's worked example. No rounding.

  ```bash
  node -e 'const LIST={INTERNAL_ERROR:{retryable:false,message:"Something went wrong on our side."}};const body=(code,requestId)=>JSON.stringify({error:{code,message:LIST[code].message,requestId,retryable:LIST[code].retryable}});const out=body("INTERNAL_ERROR","5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f");console.log(out);console.log(out.includes("ana@example.com"),out.includes(" at "))'
  # expected:
  # {"error":{"code":"INTERNAL_ERROR","message":"Something went wrong on our side.","requestId":"5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f","retryable":false}}
  # false false
  ```

- **The retry decision** (`orv144-retry`, rows 16 to 19). Input: the matrix rows of ADR 0015 decision 7 and the cases of rows 16 to 19; `r` fixed at 0.5. Delay in milliseconds, `Math.round`, halves up; `null` means no retry.

  ```bash
  node -e 'const decide=({method,key=false,status,retryable,retryAfter,retries=0},r=0.5)=>{if(method!=="GET"&&!key)return null;if(retryable===false)return null;if(retries>=3)return null;if(status===408||status===429){if(retryAfter===undefined||!/^\d+$/.test(retryAfter))return 1000;const s=Number(retryAfter);return s>10?null:s*1000}if(status===null||status===502||status===503||status===504)return Math.round(500*2**retries*(0.5+r));return null};const cases=[{method:"GET",status:404},{method:"GET",status:500},{method:"GET",status:429,retryAfter:"2"},{method:"GET",status:408},{method:"GET",status:429,retryAfter:"soon"},{method:"GET",status:429,retryAfter:"3600"},{method:"GET",status:503},{method:"GET",status:503,retries:1},{method:"GET",status:503,retries:2},{method:"GET",status:503,retries:3},{method:"GET",status:null},{method:"GET",status:503,retryable:false},{method:"POST",status:503},{method:"POST",key:true,status:503}];for (const c of cases) console.log(JSON.stringify(c),decide(c))'
  # expected:
  # {"method":"GET","status":404} null
  # {"method":"GET","status":500} null
  # {"method":"GET","status":429,"retryAfter":"2"} 2000
  # {"method":"GET","status":408} 1000
  # {"method":"GET","status":429,"retryAfter":"soon"} 1000
  # {"method":"GET","status":429,"retryAfter":"3600"} null
  # {"method":"GET","status":503} 500
  # {"method":"GET","status":503,"retries":1} 1000
  # {"method":"GET","status":503,"retries":2} 2000
  # {"method":"GET","status":503,"retries":3} null
  # {"method":"GET","status":null} 500
  # {"method":"GET","status":503,"retryable":false} null
  # {"method":"POST","status":503} null
  # {"method":"POST","key":true,"status":503} 500
  ```

- **The jitter bounds** (`orv144-retry`, row 18). Input: `r` at 0, 0.5 and 0.75 (values exact in binary, so no rounding edge), retries 0 to 2. Milliseconds, `Math.round`. A delay lies in [0.5, 1.5) times 500, 1000 and 2000.

  ```bash
  node -e 'for (const r of [0,0.5,0.75]) console.log(r,[0,1,2].map(n=>Math.round(500*2**n*(0.5+r))).join(" "))'
  # expected:
  # 0 250 500 1000
  # 0.5 500 1000 2000
  # 0.75 625 1250 2500
  ```

- **The reference line** (`orv144-ui`, rows 9, 12 and 15). Input: the two `failure.reference` strings and the id above, filled the way `fill` in `@orivilo/design-system` fills `{name}`. No rounding.

  ```bash
  node -e 'const id="5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f";for (const t of ["Reference: {requestId}","รหัสอ้างอิง: {requestId}"]) console.log(t.replace("{requestId}",id))'
  # expected:
  # Reference: 5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f
  # รหัสอ้างอิง: 5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f
  ```

- **The size** ("Impact list", Size; open question 11). Input: the per task sizes of tech notes section 11 (B1 to B8, changed lines with tests). Each is already an estimate rounded to tens; the sum adds no rounding.

  ```bash
  node -e 'const B={B1:130,B2:110,B3:140,B4:70,B5:190,B6:70,B7:50,B8:180};console.log(Object.values(B).reduce((a,b)=>a+b,0))'
  # expected: 940
  ```

## Out of scope

- 404 instead of 403 for a workspace the caller is not a member of (ADR 0015 decision 10). It changes an auth answer, is L lane, and stays in ORV-113.
- A client caller that retries automatically: none exists (open question 4). The first `GET` or keyed write adopts the module.
- An idempotency key on any write, and the server side that would honour it.
- `AI_SPEND_CAP` and the spend cap (ADR 0015 decision 4, open question 12).
- A network failure on `/account`'s forms and a throw from `signOut` (open questions 9 and 10).
- An `error.tsx` page for Next.js's own errors, and Next.js's and Better Auth's own log lines (ORV-141 open question 6).
- Masking, classification tags, uploads and money (ORV-113 items for decisions 8, 9, 11 and 12).
- Any change to limits, counts, log lines (beyond row 5's ending) or existing UI copy.

## Impact list

- **Contract change: the error body and the server action outcome.** New: the code list and body helper `packages/auth/src/errors.ts` (beside `log.ts`, exported from `packages/auth/src/index.ts`) with its test `errors.test.ts`; `packages/auth/src/auth-route.ts` (P1 to P3); `apps/web/app/directions/actions.ts` (`Outcome`, `RateLimited`, `run`); `apps/web/app/account/actions.ts` (`SignInState`, P5).
- **Client**: the retry module `apps/web/client/retry.ts` and its test `retry.test.ts` (new), with `apps/web/vitest.config.ts` and `apps/web/eslint.config.mjs` (the `client/**` test include and import ban); `apps/web/app/directions/studio-calls.ts` (new), `page.tsx`, `SavedStudio.tsx`, `read-outcome.ts`, `apps/web/i18n/wait.ts`, `apps/web/app/account/sign-in-line.ts`, `SignInForm.tsx`, `apps/web/app/account/page.tsx`; `apps/web/i18n/messages.ts` (the `failure` group, Thai and English) and its new test `messages.test.ts` (row 20).
- **Existing tests that change**: `packages/auth/src/auth-route.test.ts` (row 13 of ORV-141 stops expecting a rethrow), `packages/auth/src/auth.integration.test.ts` (any assertion on a Better Auth error body), `apps/web/app/directions/actions.test.ts` (every `toEqual` on a failure outcome gains three fields), `read-outcome.test.ts`, `apps/web/app/account/actions.test.ts` ("oauth down" and "did not return a URL"), `sign-in-line.test.ts`. New: `apps/web/app/directions/SavedStudio.test.tsx`.
- **Size.** About 940 changed lines with tests, task by task in tech notes section 11 (worked example "The size"), over the 400 line mark. It ships as one PR anyway: open question 11 is decided (b) in ORV-144 comment 10268, and the G3 packet lists one commit per task.
- **`security` role** is dispatched on each PR (`packages/auth/**`).
- **Docs to review**, status. Brought up to date in spec v1.1 (task ORV-144-spec-2), the spec rows: `docs/specs/ORV-141/spec.md` row 13 (ORV-141 spec v1.3), `docs/specs/ORV-112/spec.md` line 60 (ORV-112 spec v1.8), `docs/specs/ORV-122/spec.md` lines 52 and 61 (ORV-122 spec v1.6), `docs/specs/ORV-123/spec.md` line 51 (ORV-123 spec v1.2). Brought up to date in commit 3b911a0, the tech rows: `docs/specs/ORV-141/tech.md` lines 230, 244, 245 and 318; `docs/specs/ORV-112/tech.md` lines 341 and 476. Brought up to date in spec v1.2 (task ORV-144-spec-book-1): `docs/specs/ORV-122/spec.md` row 25's Result (ORV-122 spec v1.7). Waiting for the merge: ADR 0015 decision 7 Confirmation (line 128) and "Not done yet" (line 189).

## Open questions

Each has a default; under the owner's delegation (ADR 0012 decision 4) G2 passes on the defaults, except question 11. ORV-144 comment 10268 takes questions 1 to 10 and 12 at their defaults and decides question 11 as (b), one PR.

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | Are Better Auth's own error answers (status 400 or more) rewritten into the envelope? | (a) yes, code by status, other headers kept; (b) no, a recorded gap | (b) leaves rule 14's "every error body" untrue on `/api/auth`; (a) is safe because no client code parses Better Auth's body (survey grep: no `createAuthClient`), and the OAuth flow uses redirects, not 4xx | (a), `orv144-route-answers` |
| 2 | Does `authRoute` answer a throw with a 500 body instead of rethrowing? | (a) yes, `INTERNAL_ERROR` with the line of row 5; (b) rethrow as today | (b) gives a bare Next.js 500 with no `requestId`; (a) changes ORV-141 row 13's "rethrown as today" | (a) |
| 3 | How fine are the codes? | (a) one per matrix status, 13, with `error` staying the catalog key; (b) one per `ActionError` reason | ORV-112 already shares `RATE_LIMITED` between two reasons; (b) adds about 15 codes the matrix does not distinguish | (a), `orv144-codes` |
| 4 | Which client calls retry automatically, and what marks a keyed write? | (a) none today: every call is a server action `POST` without a key; the module is tested per row, and a keyed write is one with a non-empty `Idempotency-Key` header; (b) the read actions (`listDirections`, `openVersion`, `exportVersion`) count as `GET`; (c) no module until a caller exists | (b) contradicts decision 7's "Only a GET" and needs an ADR 0015 addition; (c) leaves ORV-113 item 2's matrix unbuilt | (a) |
| 5 | "At most 3 tries": 3 retries or 3 calls? | (a) 3 retries after the first call, one per listed delay (0.5 s, 1 s, 2 s); (b) 3 calls, 2 retries | (b) never uses the matrix's third delay | (a) |
| 6 | Which jitter? | (a) `base × (0.5 + r)`, a delay within half of its base either way; (b) full jitter, `base × r` | (b) can retry at once; (a) keeps the listed delays as the middle | (a) |
| 7 | Is an automatic wait for `Retry-After` bounded? | (a) no automatic retry over 10 s; the person sees the wait, as today; (b) wait any length | Our `ai-read` and `import` limits answer up to an hour; (b) would hold a call that long | (a) |
| 8 | Which codes show the reference line? | (a) `INTERNAL_ERROR` only, matrix row 500; (b) every 5xx code | (b) adds the id to retryable failures the matrix does not name | (a) |
| 9 | `signInWithGoogle`'s throws (`signInSocial`, the missing URL) and `signOut`'s | (a) `signInWithGoogle` returns the `INTERNAL_ERROR` state with the reference; `signOut` unchanged; (b) both rethrow as today (ORV-123 "Out of scope") | (b) shows Next.js's error page with no id; `signOut` returns no outcome, so decision 7's outcome rule does not reach it | (a) |
| 10 | A network failure on `/account`'s forms | (a) recorded gap, Next.js's error page as today; (b) catch it in `SignInForm` | (b) wraps a `useActionState` action whose redirect handling under a `catch` is not verified on Next.js 16.4.1 | (a) |
| 11 | How is the story sliced? | (a) slice 1: the code list and helper, `authRoute`, the directions outcomes and the `/directions` UI (rows 1 to 14, 20); slice 2 as a child issue, as ORV-142 was: the sign-in state and the retry module (rows 15 to 19); (b) one PR | (b) is about 940 lines with tests (tech notes section 11), over the 400 line mark | Decided (b), one PR, in ORV-144 comment 10268; the default was (a) |
| 12 | Does `AI_SPEND_CAP` join the list now? | (a) with the spend cap story, which first makes it; (b) now | (b) adds a code with no producer | (a) |

## Depends on

ADR 0015 decision 7 (the body and the matrix), decisions 2 (`security` role), 4 (`RATE_LIMITED`, `AI_SPEND_CAP`, body `retryable` wins), 6 (one log per error), 13 (no conformance claim); `.claude/rules/security.md` rules 8, 14 and 15; ADR 0012 decision 4 (G2 under delegation); ORV-144 comment 10268 (the open questions decided); the tech notes `docs/specs/ORV-144/tech.md` (the places, the size, D4, D5 and D7); ORV-113 (parent; item 2 is this story); ORV-141 and ORV-142 (the request id, `atBoundary`, the boundary line); ORV-112 and ORV-122 specs (the two bodies of today, `SERVICE_UNAVAILABLE`, the rate limit outcome and its copy); ORV-123 spec (the sign-in failure line and its out of scope item).

## Changelog

- v1.0 (2026-10-29): first spec, ORV-113 item 2 as its own story (task ORV-144-spec-1). Downstream to review: the ORV-144 Jira issue acceptance (rows 1 to 20), the tech notes (to be written: the helper's and the retry module's place, the slice sizes of open question 11), and the documents under "Impact list", "Docs to review".
- v1.1 (2026-10-29): the tech notes' "Findings for the spec" F1 to F5 and ORV-144 comment 10268 (task ORV-144-spec-2). Comment 10268: open question 11 decided (b), one PR, and questions 1 to 10 and 12 at their defaults ("Open questions" intro and question 11). F1, requirement change: row 20 is checked by a new `apps/web/i18n/messages.test.ts` and `pnpm typecheck`, since no `check-i18n` command exists and the existing i18n and copy checks scan `packages/design-system` only. F2, no requirement change: Size is about 940 lines (tech notes section 11, worked example "The size"), one PR. F3, contract change: `orv144-retry` does not retry a call its caller aborted. F4, no requirement change: the Test column of rows 8, 9, 13 and 14 names `runCall` and `refreshList` of `studio-calls.ts`, as `apps/web` has no DOM test environment. F5, no requirement change (row 4 already expected it): `orv144-route-answers` says a rewritten answer keeps the handler's status. Row 16 and the Impact list name the places the tech notes chose (`packages/auth/src/errors.ts`, `apps/web/client/retry.ts`, `studio-calls.ts`, the two config files). The spec rows of "Docs to review" are brought up to date in this task (ORV-141 spec v1.3, ORV-112 spec v1.8, ORV-122 spec v1.6, ORV-123 spec v1.2). Downstream to review: `docs/specs/ORV-144/tech.md` (front matter `spec:` version, the status column of "Findings for the spec", the spec rows of section 13), the ORV-144 Jira issue acceptance (rows 8, 9, 13, 14, 16 and 20), `AGENTS.md` line 52 (`check-i18n` does not run on `apps/web`, the main session decides).
- v1.2 (2026-10-29): bookkeeping for ORV-144 as built (task ORV-144-spec-book-1), no requirement change. "Impact list", "Docs to review" now states each document's status: the spec rows brought up to date in v1.1, the tech rows in commit 3b911a0, ORV-122 spec row 25's Result in ORV-122 spec v1.7 (this task), and ADR 0015 lines 128 and 189 waiting for the merge. `AGENTS.md` line 52 now names both catalog checks, `check-i18n` for `packages/design-system` and `apps/web/i18n/messages.test.ts` for `apps/web` (v1.1's F1), in this task. No row, rule or copy changes. Downstream to review: ADR 0015 lines 128 and 189 (architect, after the merge).
