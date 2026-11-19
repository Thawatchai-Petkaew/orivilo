---
issue: ORV-288 (https://tpetkaew.atlassian.net/browse/ORV-288)
lane: S (chore, one PR; a security review still runs, because the diff touches `packages/auth` and `apps/web/proxy.ts`, paths in `.claude/rules/security.md`)
version: 1.1
---

# ORV-288: the three follow-ups of the ORV-286 security review

## Why

The security review of PR 219 (task ORV-286-security-1, verdict approve) left three Suggestions. This chore closes them in one PR:

1. **`next` has two known advisories** (ORV-286-sec-2). `apps/web/package.json` pins `next` 16.4.1. `pnpm audit --prod` lists GHSA-mfr8-8qww-v76h and GHSA-vc7v-qv4w-wrv8 for it, both moderate, both patched in 16.4.5. ORIVILO uses none of the features they concern (`use cache`, `unstable_cache`, `cacheComponents`, `rootParams`), so the risk is low; the upgrade keeps the audit clean.
2. **The alias redirect depends on the host Vercel puts in the request URL** (ORV-286-sec-1). `aliasRedirect` in `apps/web/proxy.ts` compares the host of `request.url` with the configured address. Next 16.4.1 builds that URL from the server's bind address unless `trustHostHeader` is on (`resolve-routes.js` line 117). On Vercel it is forced on (ORV-288 comment 10713, which answers ORV-286 open question 5), so there is no loop there. No test records the dependency today, so a change that reads another host, or a platform that reports its bind address, would pass unnoticed until staging.
3. **Better Auth's own logger writes raw request values** (ORV-286-sec-3). ORIVILO sets no `logger` option, so Better Auth 1.7.12 writes through `console.error(formattedMessage, ...args)` (`@better-auth/core` `dist/env/logger.mjs` line 64). On a callback with no state it logs the provider's raw `error` value as an argument (`dist/api/routes/callback.mjs` line 72), so `GET /api/auth/callback/google?error=<value with %0d%0a>` can forge lines in the server log. Some messages hold a request value inside the message text too (`dist/api/middlewares/origin-check.mjs` line 114, `Invalid origin: ${originToValidate}`). This is the Better Auth half of the known gap of ORV-141 open question 6.

This spec is not a guard. Items 2 and 3 are tests and a log adapter for agents and code that follow the rules; none of them is a boundary against a hostile session.

### What is real and what is simulated

Everything here is real code with tests. No UI changes and no copy changes: no string is added to either locale catalog, so no row has Thai or English copy. Tests never call Google.

## Story

As the operator of ORIVILO, I want the web framework on a patch with no known advisory, a test that says which host the alias redirect reads, and Better Auth's log lines in ORIVILO's JSON shape with no request value in them, so that the server log cannot be forged through a sign-in address and the redirect's dependency on the platform is written down.

## Rules

### next-patch-1

`next` and `eslint-config-next` in `apps/web/package.json` are pinned, exactly as today (no range), to the same version: the latest `16.4.x` patch published when the builder runs, and at least `16.4.5` ("Worked examples", W3). `pnpm-lock.yaml` changes with them. No other dependency is bumped by hand; what the lockfile moves for `next`'s own dependencies is listed in the G3 packet.

### proxy-host-1

`aliasRedirect` decides on the host of the request URL (`request.url`, the same value as `request.nextUrl`), never on the `Host` header, `X-Forwarded-Host` or any other request header. The proxy's comment states the platform dependency: on Vercel the request URL carries the host the person used, because Next's `trustHostHeader` is on there (ORV-288 comment 10713); on a server where the request URL carries the bind address, every request would be redirected. The redirect logic of ORV-286 `alias-host-1` does not change.

### ba-log-1

`createAuth` (`packages/auth/src/config.ts`) passes Better Auth a `logger` option with a `log(level, message, ...args)` function and no `level` key. Reason: a `level` of `error`, `warn` or `debug` turns on a second Better Auth path (the router's `onError`, `dist/api/index.mjs` lines 206 to 217) that writes its own raw `console.error` line holding the request's values for every API error, while Better Auth's own default already drops levels below `warn` and the `log` function filters levels itself. That function:

- never reads `args`: not their values, not their count, not their type;
- for `level` `warn` or `error`, writes exactly one line through `writeLine` in `packages/auth/src/log.ts` (the one `console` caller, ORV-141 `orv141-no-console`), with `level` as Better Auth gave it, `requestId` and `route` from the open request context (`"unknown"` outside one, as `logStep` does), `durationMs` `0`, `step` `"better-auth"`, and `outcome` the message closed to `ba-messages-1`;
- for any other level (`info`, `debug`, `success`, or a value outside these) writes nothing.

Never logged by this path: the provider's `error` value, `error_description`, any other callback query value (`state`, `code`), the request's `Origin` or any URL, any header, an email, a name or any other personal data, an error object, its message or its stack. The line holds only the keys `orv141-allow-list` allows; no new key is added.

### ba-messages-1

`outcome` is the message when it is, character for character, one of the string literals Better Auth 1.7.12 passes as the first argument of `logger.warn(` or `logger.error(` in `dist/api/routes/callback.mjs` and `dist/oauth2/state.mjs`, the sign-in callback path; any other message, including every message built from a template, is written as `"unknown"` ("Worked examples", W1). The members, read from those two files:

<!-- prettier-ignore -->
| Message | Where |
| --- | --- |
| `INVALID_CALLBACK_REQUEST` | `callback.mjs` line 52 |
| `State not found` | `callback.mjs` line 72 |
| `Code not found` | `callback.mjs` line 86 |
| `OAuth provider not found` | `callback.mjs` line 91 |
| `No callback URL found` | `callback.mjs` line 106 |
| `Failed to create verification` | `oauth2/state.mjs` line 39 |
| `Failed to parse state` | `oauth2/state.mjs` line 53 |

Excluded: `callback.mjs` line 126 (`missingEmailLogMessage(provider.id)`) and line 155 (`result.error`), whose text is built at run time; they read `"unknown"`. The list lives in `log.ts` as the outcomes of the `better-auth` step in `STEP_OUTCOMES`, so `writeLine`'s existing closure applies it.

## Acceptance criteria

Hosts are the stand-ins of ORV-286: `orivilo.example` is the configured address, `orivilo-alias.example` an alias host. The sentinel `SENTINEL` is the decoded value `x\r\nFORGED someone@example.invalid` (no real address). Test names are suggestions. A row states the values its test asserts; the rule that makes them is defined once, in the section its name points to.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Proven by |
| --- | --- | --- | --- | --- | --- |
| 1 | The PR head | The web package's versions are read | No UI | `next` and `eslint-config-next` show the same exact version, `16.4.5` or a later `16.4.x` (`next-patch-1`); the installed `next` is that version | `grep -n -e '"next"' -e '"eslint-config-next"' apps/web/package.json`; `pnpm --filter @orivilo/web exec node -p "require('next/package.json').version"` |
| 2 | The PR head after `pnpm install --frozen-lockfile` | `pnpm audit --prod --json` runs | No UI | No advisory has the module `next`; GHSA-mfr8-8qww-v76h and GHSA-vc7v-qv4w-wrv8 are gone. Any other advisory it lists is the same as on `develop` and is named in the G3 packet with its id | `pnpm audit --prod --json`, advisories listed by id, module and version |
| 3 | `VERCEL_ENV` `production`, `BETTER_AUTH_URL` `https://orivilo.example` | A request whose URL is `https://orivilo.example/account` and whose headers say `Host: orivilo-alias.example` and `X-Forwarded-Host: orivilo-alias.example` | No UI | Passed on: status 200, no `Location`, the CSP and `x-request-id` headers as today (`proxy-host-1`). A proxy that read either header would answer 307 and fail this row | `apps/web/proxy.test.ts` "reads the request URL's host, not a header" |
| 4 | As row 3 | A request whose URL is `http://127.0.0.1:3000/account`, the form Next builds from a bind address | No UI | 307 to `https://orivilo.example/account` (W2); the test's comment names the dependency of `proxy-host-1` and comment 10713 | `apps/web/proxy.test.ts` "a request URL that reports another address is redirected" |
| 5 | Spies on `console` (`captureLines`) | The Better Auth logger of `ba-log-1` is called with `error`, `State not found` and the arguments `new Error(SENTINEL)` and `{ value: SENTINEL }` | No UI | Exactly one captured call; it passes `expectLineShape`; `level` `error`, `step` `better-auth`, `outcome` `State not found`, `requestId` and `route` `unknown`. No captured argument, turned to text, holds `FORGED`, `someone@example.invalid`, `\r` or `\n`. The test goes red if any argument reaches the line | `packages/auth/src/log.test.ts` "Better Auth line keeps level and message, never an argument" |
| 6 | As row 5 | The logger is called with `warn` and `Invalid origin: https://orivilo-alias.example/x`, then with `error` and `state not found` (lower case) | No UI | Two lines, `level` `warn` then `error`, each `outcome` `unknown` (`ba-messages-1`); no captured text holds `orivilo-alias.example` | `log.test.ts` "a message outside the list is unknown" |
| 7 | As row 5 | The logger is called with `info`, `debug`, `success` and `trace`, each with a message from the list and `SENTINEL` as an argument | No UI | No captured call | `log.test.ts` "levels below warn write nothing" |
| 8 | ORIVILO's auth config through `authRoute`, with the stub limiter store of ORV-286 (`auth-route.test.ts`), spies on `console` | `GET /api/auth/callback/google?error=x%0D%0AFORGED%20someone%40example.invalid` with no `state` | No UI | The auth context's `logger` option is the one `ba-log-1` sets: `log` is `logBetterAuth` and the option has no `level` key. Exactly two captured calls, each passing `expectLineShape`: the Better Auth line (`step` `better-auth`, `outcome` `State not found`, `level` `error`, `route` `api/auth`) and the `api/auth` boundary line, with the same `requestId`. No captured argument holds `FORGED`, `someone@example.invalid`, `\r` or `\n`. The redirect to `/account?error=...` is unchanged (ORV-286 row 1) | `packages/auth/src/auth-route.test.ts` "Better Auth's line goes through the JSON logger" |
| 9 | The PR head | The gate runs | No UI | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm audit --prod` run and their real output is in the G3 packet (row 2 for the audit); `no-console` still allows `console` only in `log.ts`; the diff holds no key, token, secret or real email address | Gate output (`pnpm quality-gate`) and `git diff origin/develop` read for secrets |
| 10 | As row 8 | `POST /api/auth/sign-in/social` with `Origin: http://localhost:3000`, the body `{}` and the header `Content-Type: text/plain; FORGED someone@example.invalid` (the printable part of `SENTINEL`, since a header cannot hold `\r` or `\n`), which Better Auth refuses with an API error | No UI | Status 415 with the error body of ORV-144. Every captured call passes `expectLineShape`, so the log holds only JSON lines (`ba-log-1`); no captured argument, turned to text, holds `FORGED` or `someone@example.invalid`. With `level: "warn"` put back in the `logger` option the test goes red, because Better Auth's raw line holding the `Content-Type` value is captured | `packages/auth/src/auth-route.test.ts` "a request Better Auth refuses leaves only JSON lines" |

## Rows that render nothing

- Rows: 1-10

## Impact on contracts

- **Log line contract (ORV-141).** `STEP_OUTCOMES` in `packages/auth/src/log.ts` gains the step `better-auth` with the outcomes of `ba-messages-1`. No new key; `expectLineShape` and its `KEYS` are unchanged. The step writes at `error` when Better Auth does, which `orv141-step-lines` today forbids for a step: see open question 2. Readers to re-check: `log.test.ts`, `auth-route.test.ts`, `auth.integration.test.ts` (ORV-286 row 2's test, which captures lines).
- **Auth config.** `createAuth` gains the `logger` option. No change to sign-in, the error landing (ORV-286 `signin-failure-1`) or the limiter.
- **Request proxy.** A comment and two tests; no logic change.
- **Dependencies.** `next` and `eslint-config-next`, and `pnpm-lock.yaml`.
- **No change to:** UI, locale catalogs, the database schema, tokens, any component API, the error body (ORV-144).

## Out of scope

- Next.js's own log lines (the other half of ORV-141 open question 6).
- Better Auth messages on paths ORIVILO does not use (email and password, the organization plugin's access control, one-tap); they read `unknown` if they ever appear.
- A minor or major upgrade of `next`, or any other dependency's advisory, including the dev-only `esbuild` one and the accepted GHSA-fc5q-39xc-vjpf (ORV-277).
- The G4 staging walk of ORV-286 row 22; it stays with ORV-286.
- Changing ORV-141's or ORV-286's spec text; the stale lines are listed for the main session.

## Open questions (option, impact, default)

1. **What the line holds of Better Auth's message.** (a) the message closed to `ba-messages-1`, other messages `unknown`; (b) the raw message, as the card reads literally; (c) no message, only the level. Impact: (b) still lets a request value into the log (`origin-check.mjs` line 114 puts the request's `Origin` in the message text), which `orv141-allow-list` forbids; (c) loses which failure happened. Default: (a).
2. **The level of a Better Auth error line.** (a) kept as Better Auth gives it, so a step line may be at `error`, an exception to `orv141-step-lines` for the `better-auth` step only; (b) written at `warn`, so the boundary line stays the only `error` line. Impact: (a) keeps the card's "with level" and may show two `error` lines for one request (a callback failure itself ends `ok`, a 302, so the common case has one); (b) keeps ORV-141's rule but hides that Better Auth saw an error. Default: (a).
3. **Where the message list comes from.** (a) the two callback files of `ba-messages-1`; (b) every string literal Better Auth logs. Impact: (b) is a long list mostly for features ORIVILO does not use. Default: (a).

## Depends on

- ORV-286 (PR 219, merged as `8c7a618`): `alias-host-1`, `signin-failure-1`, row 11; its security review, task ORV-286-security-1, findings ORV-286-sec-1, -sec-2, -sec-3.
- ORV-288 comment 10713: on Vercel `trustHostHeader` is forced on (the answer to ORV-286 open question 5).
- ORV-141: `orv141-allow-list`, `orv141-step-lines`, `orv141-no-console`, open question 6.
- ADR 0015 decision 6 (logs) and decision 13 (no conformance claim); ADR 0002 (Better Auth).

## Worked examples

Run by the main session on 2026-11-18; each printed its expected output. Each line runs from the repo root with `node -e`. Outputs are strings or booleans; nothing is rounded.

- **W1, the closure of `ba-messages-1`.** Members copied from the table, inputs from row 5 and row 6. `node -e 'const L=["INVALID_CALLBACK_REQUEST","State not found","Code not found","OAuth provider not found","No callback URL found","Failed to create verification","Failed to parse state"]; for (const m of ["State not found","Invalid origin: https://orivilo-alias.example/x","state not found"]) console.log(JSON.stringify(m), L.includes(m) ? m : "unknown")'` prints `State not found`, `unknown`, `unknown` after each input. Exact, case-sensitive match.
- **W2, the host compare of rows 3 and 4.** Configured address from `apps/web/proxy.test.ts` line 100. `node -e 'const c=new URL("https://orivilo.example").host; for (const u of ["https://orivilo.example/account","http://127.0.0.1:3000/account"]) console.log(u, new URL(u).host !== c)'` prints `false` then `true` (true means redirected).
- **W3, the version bound of `next-patch-1`.** Inputs: today's `16.4.1` from `apps/web/package.json` line 23, and `16.4.5`. `node -e 'for (const v of ["16.4.1","16.4.5"]) { const [a,b,c]=v.split(".").map(Number); console.log(v, a===16 && b===4 && c>=5) }'` prints `16.4.1 false`, `16.4.5 true`.

## Changelog

- Version 1, 2026-11-18: first version, from the ORV-288 description, comment 10713 and the ORV-286 security review (task ORV-288-spec-1).
- v1.1, 2026-11-19: for the code review's Important finding ORV-288-rev-1 (task ORV-288-review-1), `ba-log-1` passes the `logger` option with no `level` and gives the reason; row 8 expects no `level` key; new row 10 proves that an API error through `authRoute` leaves only JSON lines; the list of rows that render nothing covers 1-10 (task ORV-288-spec-2). Governed lines to review: `packages/auth/src/config.ts` line 49, this spec's `ba-log-1` (line 39 in version 1), `packages/auth/src/auth-route.test.ts` line 542; row 10 adds a test to `auth-route.test.ts`.
