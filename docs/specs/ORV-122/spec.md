---
issue: ORV-122 (https://tpetkaew.atlassian.net/browse/ORV-122)
lane: L
version: 1
---

# ORV-122: shared rate limits for sign-in and Better Auth's routes (ORV-112 slice B)

## Why

ORV-112 slice A put the AI reading, writes and import behind counts every Vercel instance shares. Sign-in is still open: Better Auth 1.7.12 counts `/api/auth/*` in process memory (one map per instance), and `signInWithGoogle` calls `auth().api.signInSocial` from a server action, which Better Auth's router limiter never sees. Each try writes a `verification` row, so an unbounded loop grows that table. ADR 0015 decision 4 and `.claude/rules/security.md` rule 6 require sign-in to be limited in a shared store. The full reasoning is in [ORV-112's Why](../ORV-112/spec.md#why); this story is that spec's slice B, split out so each slice has its own acceptance and its own gates.

**Frame.** A server-side control, not a hook that judges text: counters live in our Postgres and only server code writes them through `orivilo_app` (ADR 0002). Per IP limits rest on one thing outside our code, Vercel's edge overwriting `x-forwarded-for` (K-0015), which row 21's staging probe checks before this story passes G4. A bound against one network, not against a distributed attack.

**What is real.** Real server checks with tests, plus one staging probe run by hand (row 21), not part of `pnpm test`.

## Story

As the workspace owner, I want each network's sign-in attempts and Better Auth requests counted in the store every server instance shares, so that a script cannot loop sign-in or flood `/api/auth/*`, and the person who hits the cap is told in Thai or English how long to wait.

## What this story uses from ORV-112 (linked, not copied)

- **Limits and numbers**: the `sign-in` and `auth-http` rows, windows, `Retry-After` and the burst bound, [ORV-112 spec "Limits and numbers"](../ORV-112/spec.md#limits-and-numbers). The `sign-in` entry already sits in the `LIMITS` map from slice A.
- **The store and the helper**: table, keys (`auth-http:ip:<subject>:<window>x<max>`), IP subject, trusted header, pruning and store failure, [ORV-112 spec "The store and the helper"](../ORV-112/spec.md#the-store-and-the-helper). Store failure applies here as written there: a call answered unavailable does not commit a count later, except a `COMMIT` already on the wire when the timer fired, which over-counts by at most one and still fails closed (ORV-112 comment 10187).
- **The outcome and the UI**: the `authRoute` 429 and 503 bodies, the sign-in notice under the button on `/account` with the `account.problem` badge, the wait format, [ORV-112 spec "The outcome and the UI"](../ORV-112/spec.md#the-outcome-and-the-ui). The strings `account.rateLimited`, `account.problem` and `wait.*` already sit in `apps/web/i18n/messages.ts` from slice A.
- **Decisions** 1 to 9 on ORV-112, in particular 4 (`useActionState` form), 5 (`x-forwarded-for` and its probe), 7 (503 `SERVICE_UNAVAILABLE`) and 8 (buckets per rule), [ORV-112 spec "Decisions"](../ORV-112/spec.md#decisions).
- **Tech notes** `docs/specs/ORV-112/tech.md` (Better Auth `customStorage`, `authRoute`, the probe steps) and **G2 design** `docs/specs/ORV-112/design.md` (the account notice). G1 and G2 for this work were passed on ORV-112.

## Acceptance criteria

Rows keep their numbers and wording from ORV-112 spec v1.4. "This spec" in row 21 is this file.

| #   | Given                                                                                                                                   | When                                                                                                                                                                                                                                                                                    | Result                                                                                                                                                                                                                                                                                                                | Data effect                                                                                                                  | Test                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 11  | One trusted IP has pressed "Sign in with Google" 10 times in this 10 minute window, Thai or English                                     | The button is pressed again on `/account`                                                                                                                                                                                                                                               | The page stays on `/account` and shows: English "Too many sign-in attempts from this network. Try again in 3 minutes." Thai "มีการลงชื่อเข้าใช้จากเครือข่ายนี้ถี่เกินไป ลองใหม่ได้ในอีก 3 นาที"                                                                                                                       | `signInSocial` is not called and no `verification` row is written                                                            | `account/actions.test.ts`, "sign-in over the limit does not start OAuth"; page test for both locales                              |
| 12  | Two `createAuth` instances on the same test database, each handler wrapped in `authRoute`, the clock 1 s after an aligned 10 s boundary | `POST /api/auth/sign-in/social` is sent 4 times, alternating instances, each with `x-forwarded-for: 203.0.113.7` and a different `x-vercel-forwarded-for` and `x-real-ip` every time; then a 5th with a different `x-forwarded-for`                                                     | Requests 1 to 3 answer 200; the 4th answers 429 with a `Retry-After` header between 1 and 9 and the body `{"error": {"code": "RATE_LIMITED", ..., "requestId": <string>, "retryable": true}}`; the 5th answers 200                                                                                                    | One row with key `auth-http:ip:<hmac>:10x3` and `count` 3; `rateLimit.customStorage` is set, so the memory store is not used | `auth.integration.test.ts`, "Better Auth's limiter counts in the shared store"                                                    |
| 20  | The limiter's query throws or times out                                                                                                 | `POST /api/auth/sign-in/social` is sent through `authRoute`, or "Sign in with Google" is pressed on `/account`                                                                                                                                                                          | The route answers 503 with the body `{"error": {"code": "SERVICE_UNAVAILABLE", "message": "Service unavailable. Try again later.", "requestId": <string>, "retryable": true}}`, not a bare 500; the page shows the existing sign-in failure notice in Thai or English                                                 | `signInSocial` is not called; no `verification` row is written                                                               | `auth-route.test.ts`, "a store failure answers 503"; `account/actions.test.ts`, "sign-in fails closed"                            |
| 21  | Slice B deployed to staging, and a second network with a different public IP                                                            | From one machine, 4 `POST /api/auth/sign-in/social` within one 10 s window, each with different forged values in `x-forwarded-for`, `x-vercel-forwarded-for` and `x-real-ip`; then a 5th with no forged header; then, from the second network, a request with request 1's forged values | Request 4 and request 5 answer 429: every request counted under the machine's real IP, which is the only IP request 5 carries, and no forged value picked a bucket. The request from the second network answers 200. If any of this differs, slice B does not pass G4 and this spec changes first with a version bump | Rows in the staging `rate_limit_counter` only; no raw IP stored                                                              | Staging probe, run by the QA role, evidence (commands, status codes, time) in the slice B G4 gate packet; not part of `pnpm test` |
| 23  | Two `createAuth` instances wrapped in `authRoute`, one trusted IP                                                                       | `GET /api/auth/made-up-1` to `/api/auth/made-up-50` are sent, alternating instances                                                                                                                                                                                                     | No answer is 429                                                                                                                                                                                                                                                                                                      | Exactly one row for that IP under the `10x100` rule, with `count` 50; no row per path                                        | `auth.integration.test.ts`, "made-up paths share one bucket per rule"                                                             |

ORV-112 row 14 (no raw IP in any key) reads the table after rows 11, 12 and 23 as well; this story keeps it passing.

## Scope (slice B)

- The `sign-in` limit on `signInWithGoogle`, checked before `signInSocial`, with the notice on `/account` through a small client form with `useActionState`.
- Better Auth's `rateLimit.customStorage` on the shared helper and table, always set, and `advanced.ipAddress.ipAddressHeaders: ["x-forwarded-for"]`; Better Auth's `no-trusted-ip` maps to `unknown`.
- `authRoute` in `packages/auth`, wrapping `GET` and `POST` in the route file: 429 with `Retry-After` and the `RATE_LIMITED` body, 503 with the `SERVICE_UNAVAILABLE` body on a store failure, any other error rethrown.
- The staging header probe (row 21), a G4 condition.

## Rules and bounds

ORV-112's "Rules and bounds" apply unchanged. In short: one helper, no counter in process memory, only `x-forwarded-for` as a single value on Vercel, no raw IP or email in a key or log line, Thai and English together, no middot, no em dash.

## Out of scope

Everything in ORV-112's "Out of scope", and everything ORV-112 slice A delivered (the table, migrations, the helper, the client IP subject, the `ai-read`, `write`, `import` and `signed-out` limits, the directions UI).

## Impact list

- **`packages/auth`**: new `auth-route.ts`; `config.ts` gains `rateLimit.customStorage`, `advanced.ipAddress.ipAddressHeaders: ["x-forwarded-for"]` and test options for the limiter; `index.ts` exports `authRoute`.
- **Route**: `apps/web/app/api/auth/[...all]/route.ts` wraps the handler in `authRoute` for `GET` and `POST`.
- **Actions**: `apps/web/app/account/actions.ts`, `signInWithGoogle(prev, formData)` for `useActionState`, consuming `sign-in` per trusted IP.
- **UI**: `apps/web/app/account/page.tsx` shows the sign-in notice in a polite live region with the `account.problem` badge.
- **Existing tests at risk**: `auth.integration.test.ts` now writes counter rows on every handler call; a test sending more than 3 `/sign-in*` requests per 10 s through the handler must pin its clock or use separate IPs.
- **Specs to review**: ORV-38 (sign-in limited by Better Auth's limiter, which held per instance only), ORV-113 (`SERVICE_UNAVAILABLE` joins its closed list of error codes).

## Open questions

None. Every choice was decided on ORV-112 (G1 and after the architect review). If row 21's probe fails, this spec changes first with a version bump.

## Depends on

[ORV-112](https://tpetkaew.atlassian.net/browse/ORV-112) slice A merged (helper, table, `LIMITS`, client IP, strings), `docs/specs/ORV-112/spec.md` v1.5 (limits, store, outcome and UI, Decisions 1 to 9), `docs/specs/ORV-112/tech.md`, `docs/specs/ORV-112/design.md`, K-0015 (Vercel client IP headers), ORV-113 (error code list), ADR 0002, ADR 0015 decisions 4 and 7, `.claude/rules/security.md` rule 6, spec ORV-38.

## Changelog

- v1 (2026-10-26): split from ORV-112 spec v1.4 by slice. Rows 11, 12, 20, 21 and 23 moved here with their numbers and wording; limits, decisions, tech notes and design linked to ORV-112, not copied. Store failure stated as softened in ORV-112 v1.5 (ORV-112 comment 10187): a call answered unavailable does not commit a count later, except a `COMMIT` already on the wire when the timer fired, which over-counts by at most one and fails closed. Downstream to review: the ORV-122 Jira issue (acceptance from this file), the slice B test plan, `docs/specs/ORV-112/tech.md` slice B steps.
