---
issue: ORV-286 (https://tpetkaew.atlassian.net/browse/ORV-286)
lane: L (risk flag: auth and data access; the sign-in failure path of Better Auth and a redirect in the request proxy)
version: 1
---

# ORV-286: a failed sign-in says so, and an alias host is sent to the app's address

## Why

What was seen on staging on 2026-11-18 (ORV-281 comment 10700): a person started Google sign-in on an alias host of the staging deployment. Google sent the callback back to the app's own configured address. Better Auth logged `state_security_mismatch`, and the person landed on the home page, signed out, with no message. Two defects sit in that one walk:

1. **The failure is silent.** Read from Better Auth 1.7.12, the version `packages/auth/package.json` pins (read in the main checkout's install, because this worktree has no `node_modules`): every failure of the OAuth callback redirects to the error address, which is `onAPIError.errorURL` when set and otherwise `<auth base URL>/error` (`dist/api/routes/callback.mjs` line 34, `dist/oauth2/state.mjs` line 48). ORIVILO sets no `onAPIError` (`packages/auth/src/config.ts`). Better Auth's `/error` endpoint, in a production build with no custom error page, answers 302 to `/?error=<code>` (`dist/api/routes/error.mjs` lines 380 to 383). The home page ignores `error`, so the person sees the home page and nothing else. The code `state_security_mismatch` is sent in the address as `state_mismatch` (`dist/oauth2/state.mjs` line 57; "Worked examples", W1).
2. **The alias host breaks sign-in.** `signInWithGoogle` (`apps/web/app/account/actions.ts`) starts sign-in on the host the person is on, and Better Auth's state cookie is set there. Google returns to the callback on the configured address (`baseURL` in `settingsFromEnv`), where that cookie does not exist, so the state check fails (`dist/state.mjs` lines 134 to 140 raise `state_security_mismatch` when the signed state cookie is missing). The fix is to send any request that reaches the app on another host of the same deployment to the configured address before sign-in can start there.

This spec is not a guard. The redirect is a correctness fix for sign-in, not a security boundary; its one security property, that it never sends a person to an address taken from the request (no open redirect), is held by how the target is built (`alias-host-1`) and proven by rows 14 and 15.

### What is real and what is simulated

Everything in this story is real code with tests. Nothing is simulated or rule-based in the product's sense. Google is never called in a test: the callback rows call Better Auth's handler directly with a missing or unmatched state, which fails before any call to Google.

## Story

As a person signing in to ORIVILO, when my Google sign-in does not finish, I want to land back on the sign-in page with a message that tells me it did not finish and how to try again, and I want the app to keep me on its own address so that sign-in does not fail because of the address I opened it on.

## Rules

### signin-failure-1

A **failed sign-in** is any arrival at `/account` whose query has a parameter `error` with a non-empty value ("Worked examples", W2). The value is never rendered, never logged and never matched to pick the copy: every value gives the same message (`signin-message-1`). The table lists the codes Better Auth 1.7.12 can put there on ORIVILO's paths, read from the files it names; the page tests walk each of them and one value outside the list.

<!-- prettier-ignore -->
| Code | Where Better Auth sends it |
| --- | --- |
| `state_not_found` | callback with no `state` (`callback.mjs` lines 71 to 75) |
| `invalid_callback_request` | callback query that fails its schema (`callback.mjs` lines 51 to 54) |
| `state_mismatch` | stored state not found, expired, or `state_security_mismatch` renamed (`state.mjs` lines 57, 124, 144) |
| `state_invalid` | cookie state that cannot be decrypted (`state.mjs` line 110) |
| `internal_server_error` | state parse failure that is not a `StateError` (`oauth2/state.mjs` line 54) |
| `no_code`, `oauth_provider_not_found`, `issuer_missing`, `issuer_mismatch`, `invalid_code`, `nonce_binding_missing`, `unable_to_get_user_info`, `no_callback_url`, `email_not_found`, `email_not_verified` | `OAUTH_CALLBACK_ERROR_CODES` (`oauth2/errors.mjs` lines 9 to 23) |
| `unable_to_link_account`, `email_does_not_match`, `account_already_linked_to_different_user` | the same list; account linking only, which ORIVILO never starts, listed because the page cannot tell |
| `provider_mismatch`, `payload_expired`, `user_creation_failed` | the oAuth proxy's callback (`plugins/oauth-proxy/index.mjs` lines 105 to 150) |
| `access_denied` and any other provider code | the provider's own `error`, passed through (`callback.mjs` line 84); `access_denied` is RFC 6749 section 4.1.2.1's code for a refusal |
| `UNKNOWN` | the `/error` endpoint's stand-in for a code outside `[A-Za-z0-9_-']` (`error.mjs` line 366) |

Excluded: `state_generation_error`, raised when sign-in starts, not on the callback; `signInWithGoogle` already turns a throw there into its `INTERNAL_ERROR` state.

Where the person lands: every failure of the callback, every failure the oAuth proxy's callback raises, and Better Auth's `/error` endpoint send the person to `/account` with the `error` parameter, never to `/` and never to Better Auth's own error page. `/account` is where sign-in starts and where a successful sign-in returns (`callbackURL: "/account"`). How this is set is the architect's (open question 7).

### signin-message-1

On `/account`, in the signed-out view only, a failed sign-in (`signin-failure-1`) shows one notice in the place and look of the sign-in form's existing notice: the badge `account.problem` and the line `account.callbackFailed` ("Strings"). It never shows the `error` value, the `error_description` value, any other query text, or a request id (the callback's request id is not carried to the page). The signed-in view and the not-configured view show no such notice. A successful sign-in returns to `/account` with no `error`, so it shows none. Once the person presses the sign-in button and the action returns a state, the action's own line (`signInLine`) replaces this notice; at most one notice shows. Rendering the notice writes no log line.

### configured-address-1

The **configured address** is the origin of the `baseURL` that `settingsFromEnv` (`packages/auth/src/config.ts`) picks for the same environment when `VERCEL_ENV` is `production`: `BETTER_AUTH_URL` when set, else `https://` and `VERCEL_PROJECT_PRODUCTION_URL`, else `https://` and `VERCEL_URL`. When none is set, there is no configured address. The redirect reads this one pick; it never keeps a second copy of the order that could drift (a test pins the two equal, row 20). `VERCEL_ENV` tells a preview from a deployment that is not one, as `settingsFromEnv` already does; it is not used to tell staging from production (ADR 0010 decision 4).

### alias-host-1

The request proxy (`apps/web/proxy.ts`) answers a request with a redirect when all three hold:

1. `VERCEL_ENV` is `production`;
2. there is a configured address (`configured-address-1`);
3. the host the request was made to differs from the configured address's host (host and port, compared as the URL parser serialises them, "Worked examples", W4).

The redirect:

- **Status:** 307, for every method (open question 1). A 307 keeps the method and is not cached as permanent, so a later change of the configured address cannot leave browsers looping on a cached answer.
- **Target:** the configured address with the request's path and query exactly as received. The target is built by setting the path and query on a URL made from the configured address, never by resolving the request's path against it, so a path that starts with `//` stays a path on the configured address (W5, W6). No value from the request chooses the target's origin: not the `Host` header, not `X-Forwarded-Host`, not a query parameter such as `callbackURL`.
- **Headers:** the `x-request-id` the proxy makes for every answer. The request never reaches a page, an action or Better Auth's handler.

Left alone, passed on as today:

- a request on the configured address's host, so the target of a redirect is never redirected again (no loop);
- every request when `VERCEL_ENV` is `preview`: a preview signs in on its own `VERCEL_URL` through the oAuth proxy (`oAuthProxy` in `config.ts`); its branch alias hosts are open question 3;
- every request when `VERCEL_ENV` is not set, which covers local development on `localhost` and `127.0.0.1`;
- every request when there is no configured address; the proxy never throws for a missing variable;
- the static files the proxy's `matcher` skips (`_next/static`, `_next/image`, `favicon.ico`): no sign-in starts from them.

The auth routes under `/api/auth` get no exception. Google returns to the callback on the configured address, so the callback is never redirected; a callback that does reach an alias host is sent to the configured address with its path and query and fails there by `signin-failure-1`, with the message, because the state cookie was set on the alias.

## Strings

One new key, in `apps/web/i18n/messages.ts` under `account`, both locales together. It is the copy of record and a draft for the owner's copy review. No middot, no em dash.

<!-- prettier-ignore -->
| Key | English | Thai |
| --- | --- | --- |
| `account.callbackFailed` | Sign-in with Google did not finish, so you are not signed in. Press "Sign in with Google" to try again. | ลงชื่อเข้าใช้ด้วย Google ไม่สำเร็จ คุณจึงยังไม่ได้ลงชื่อเข้าใช้ กดปุ่ม "ลงชื่อเข้าใช้ด้วย Google" เพื่อลองอีกครั้ง |

Reused as they are: `account.problem` ("Not done", "ทำไม่สำเร็จ"), the badge of the existing notice; `account.signInWithGoogle`, whose text the message names; `account.failed`, `account.limitReason` and `account.limitRetry`, the action's own lines.

## Acceptance criteria

Tests never call Google. Callback rows call Better Auth's handler through ORIVILO's `createAuth` with test settings; rows 1 and 3 need no database, row 2 runs in `auth.integration.test.ts` against the test database. Proxy rows call `proxy` with a `NextRequest` and a stubbed environment. Hosts in tests are stand-ins: `orivilo.example` is the configured address (copied from `config.test.ts` line 25), `orivilo-alias.example` stands for an alias host of the deployment. Test names are suggestions. A row states the values its test asserts; the rule that makes them is defined once, in the section its name points to.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Proven by |
| --- | --- | --- | --- | --- | --- |
| 1 | ORIVILO's auth config | `GET /api/auth/callback/google` with no query (no `code`, so the IdP-initiated branch of `callback.mjs` line 57 is not taken) | No UI | A redirect whose `Location` path is `/account` and query `error=state_not_found`; not `/`, not `/api/auth/error` (`signin-failure-1`) | Unit test in `packages/auth` "callback failure lands on /account" |
| 2 | A sign-in started through `signInSocial` with `callbackURL: "/account"`, its state stored | The callback is called with that `state` and no state cookie, the staging case | No UI | A redirect to `/account?error=state_mismatch` (W1, W3); no session cookie set | `auth.integration.test.ts` "a missing state cookie lands on /account" |
| 3 | A production build (`NODE_ENV` `production`) of ORIVILO's auth config | `GET /api/auth/error?error=state_mismatch&error_description=x` | No UI | A redirect to `/account` with `error=state_mismatch`; never `Location: /?error=...` and never Better Auth's HTML page | Unit test "the error endpoint forwards to /account" |
| 4 | `/account`, signed out, English | It opens with `?error=<code>` for each code in the `signin-failure-1` table, and for `foo_bar` | The badge "Not done" and "Sign-in with Google did not finish, so you are not signed in. Press "Sign in with Google" to try again." in the notice under the button, once | None | `page.test.tsx` "failed sign-in message", `it.each` over the table |
| 5 | `/account`, signed out, Thai | It opens with `?error=state_mismatch` and with `?error=access_denied` | The badge "ทำไม่สำเร็จ" and "ลงชื่อเข้าใช้ด้วย Google ไม่สำเร็จ คุณจึงยังไม่ได้ลงชื่อเข้าใช้ กดปุ่ม "ลงชื่อเข้าใช้ด้วย Google" เพื่อลองอีกครั้ง" | None | `page.test.tsx` "failed sign-in message, Thai" |
| 6 | `/account`, signed out | It opens with `?error=%3Cimg%20src%3Dx%3E`, with `?error=UNKNOWN&error_description=Access%20blocked%20by%20provider`, and with two `error` values | The same message as row 4; the HTML holds neither `<img`, nor `img src`, nor `UNKNOWN`, nor `Access blocked`, nor any code from the table (`signin-message-1`) | None | `page.test.tsx` "never echoes the address" |
| 7 | `/account`, signed out | It opens with no query, and with `?error=` (empty) | The sign-in form as today, with no notice | None | `page.test.tsx` "no error, no message" |
| 8 | A signed-in person: after a successful sign-in, which returns to `/account` with no `error`; then the same person on `/account?error=state_mismatch` | The page opens | "Signed in as" with the email, the workspace line and "Sign out"; no failure notice either time | None | `page.test.tsx` "signed in shows no failure" |
| 9 | An environment with no database or Google set up | `/account?error=state_mismatch` opens | Only "Sign-in is not available here yet: Google and the database are not set up."; no failure notice | None | `page.test.tsx` "not configured ignores error" |
| 10 | The failure notice of row 4 is showing | They press "Sign in with Google" and the action returns the rate-limited state | Only the action's line: "Too many sign-in attempts from this network." with the wait; the failure notice is gone; one notice in the region | One action call | `SignInForm.test.tsx` "action line replaces the callback notice" |
| 11 | Spies on `console` | Row 6's page with `error_description` renders; row 2's callback runs through `authRoute` | No UI | The page writes no line; the callback writes one `api/auth` line with only the allow-listed keys of ORV-141, and no line holds the code, the description, an email, a name or a token | `page.test.tsx` "no log"; `auth-route` test with `assertLine` from `log-testing.ts` |
| 12 | `VERCEL_ENV` `production`, `BETTER_AUTH_URL` `https://orivilo.example` | `GET` and then `POST` `https://orivilo-alias.example/account` reach the proxy | No UI | Status 307, `Location: https://orivilo.example/account`, an `x-request-id` that is a UUID v4; the request is not passed on (`alias-host-1`) | `proxy.test.ts` "alias host goes to the configured address" |
| 13 | As row 12 | `GET https://orivilo-alias.example/business/p1?tab=a&q=%E0%B8%81` | No UI | `Location: https://orivilo.example/business/p1?tab=a&q=%E0%B8%81`, path and query as received | `proxy.test.ts` "keeps path and query" |
| 14 | As row 12 | In turn: the path `//evil.example/x` on the alias host; the query `?callbackURL=https://evil.example/`; the header `X-Forwarded-Host: evil.example` | No UI | Each `Location` has the origin `https://orivilo.example`: `https://orivilo.example//evil.example/x` (W5), `https://orivilo.example/?callbackURL=https://evil.example/` (query kept as received), `https://orivilo.example/` | `proxy.test.ts` "target origin is only the configured address" |
| 15 | As row 12 | `GET https://orivilo-alias.example/api/auth/callback/google?state=s&code=c` | No UI | 307 to `https://orivilo.example/api/auth/callback/google?state=s&code=c`; no exception for auth routes | `proxy.test.ts` "auth routes get no exception" |
| 16 | As row 12 | `GET https://orivilo.example/account`, which is also the target of row 12 | No UI | No redirect: the request is passed on with the CSP and `x-request-id` headers as today, so no loop | `proxy.test.ts` "configured host passes" |
| 17 | `VERCEL_ENV` `preview`, `VERCEL_URL` set | `GET` on the `VERCEL_URL` host and on another host | No UI | No redirect either time | `proxy.test.ts` "preview is left alone" |
| 18 | No `VERCEL_ENV`, `BETTER_AUTH_URL` `http://localhost:3000` | `GET http://localhost:3000/account` and `GET http://127.0.0.1:3000/account` | No UI | No redirect either time | `proxy.test.ts` "local is left alone" |
| 19 | `VERCEL_ENV` `production` and none of `BETTER_AUTH_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL` | Any request | No UI | No redirect; the proxy does not throw | `proxy.test.ts` "no configured address" |
| 20 | `VERCEL_ENV` `production` with, in turn: `BETTER_AUTH_URL` set; only `VERCEL_PROJECT_PRODUCTION_URL`; only `VERCEL_URL` | The proxy's pick and `settingsFromEnv(db, env).baseURL` are read | No UI | The two origins are equal in each case (`configured-address-1`) | Unit test beside the pick, "same as settingsFromEnv" |
| 21 | The PR head | The gate runs | No UI | `apps/web/i18n/messages.test.ts` passes with `account.callbackFailed` in both locales; the copy check finds no middot or em dash; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass; the proxy bundle does not import the `@orivilo/auth` index | Gate output |
| 22 | Staging, after the release | The owner, or `qa` with the owner's account, opens `/account` on an alias host of the staging deployment and presses "Sign in with Google" | The address bar shows the configured address before the press; sign-in returns to `/account` signed in | One session | G4 walk with screenshots, no secret in them |

## Rows per PR

One PR holds the whole story. Row 22 is walked on staging at G4, after the release.

- PR: rows 1-21

## Rows that render nothing

- Rows: 1-3, 11-21

## Impact on contracts

- **Auth config (lane L, auth flag).** `createAuth` in `packages/auth/src/config.ts` sets where a callback failure lands (`signin-failure-1`), through `onAPIError.errorURL`, the sign-in call's `errorCallbackURL`, or both (open question 7). Readers to re-check: `config.test.ts`, `auth.integration.test.ts`, `auth-route.test.ts`; the oAuth proxy flow for previews (open question 6).
- **Sign-in action.** `signInWithGoogle` may pass `errorCallbackURL: "/account"` beside `callbackURL`; `actions.test.ts` asserts the body it sends.
- **Request proxy.** `apps/web/proxy.ts` gains the redirect of `alias-host-1`. It must not import the `@orivilo/auth` index (its own comment: that pulls Better Auth and the database client into the proxy bundle), so the pick of `configured-address-1` moves to a module both `settingsFromEnv` and the proxy import, or the proxy keeps its own copy pinned by row 20. The architect chooses. `proxy.test.ts` re-checked.
- **Account page.** `apps/web/app/account/page.tsx` reads `searchParams`; `SignInForm` and `sign-in-line.ts` take a starting notice. `page.test.tsx` and `SignInForm.test.tsx` re-checked.
- **Locale catalog.** One key, `account.callbackFailed`, in `apps/web/i18n/messages.ts`, Thai and English.
- **No change to:** the database schema, tokens, any shared component or its API, `ROUTES` and the log line shape (ORV-141), the error body (ORV-144), the `sign-in` limit (ORV-122), the Google OAuth client's redirect URIs.

## Out of scope

- Previews reached on a branch alias host (open question 3).
- Better Auth's own log lines, such as "Failed to parse state"; they stay the known gap of ORV-141 open question 6.
- The home page's handling of `?error=`; after this story nothing sends a failure there.
- A separate message per failure code, including a refusal on Google's screen (open question 2).
- Removing `error` from the address after the message shows (open question 4).
- The production domain and its release (ORV-63).
- Any change to the look of the account page; the notice reuses the existing one.

## Open questions (option, impact, default)

1. **Redirect status.** (a) 307 for every method; (b) 308, permanent and cached by browsers; (c) 301 for GET and HEAD only. Impact: (b) and (c) can leave a browser looping on a cached answer if the configured address later becomes one of today's aliases, which ORV-63 may do. Default: (a).
2. **A message for a refusal.** (a) one message for every code; (b) a second message for `access_denied`. Impact: (b) adds a key and a matched list, and that Google sends `access_denied` when a person cancels on its screen cannot be confirmed from this checkout (it is RFC 6749's code, passed through at `callback.mjs` line 84). The one message is true for a cancel too. Default: (a).
3. **Preview branch aliases.** A preview's `baseURL` is its `VERCEL_URL`, so a sign-in started on its branch alias host can fail the same way. (a) left alone; (b) redirect a preview's other hosts to its `VERCEL_URL`. Impact: (b) changes how previews are opened from pull requests. Default: (a), as the envelope sets.
4. **The `error` parameter after the message.** (a) left in the address, so a reload shows the message again; (b) removed by the client after the first render. Impact: (b) adds client code for a small gain. Default: (a).
5. **For the architect: the host the proxy reads on Vercel.** Whether `request.nextUrl.host` on Vercel is the host the person typed for every alias cannot be confirmed from this checkout. (a) the request URL's host; (b) `X-Forwarded-Host` when Vercel sets it, which is a request value and must then be trusted only on Vercel. Default: (a); row 22 confirms it on staging.
6. **For the architect: where a preview's failed sign-in lands.** Through the oAuth proxy, Google's callback is handled on the configured address (`plugins/oauth-proxy/index.mjs` line 256 reads `stateData.errorURL`, then `onAPIError.errorURL`), so a relative `/account` may land the preview's person on the configured address's account page. Not confirmed from this checkout. (a) accept and cover no preview row; (b) pass an absolute `errorCallbackURL` on the preview's own origin. Default: (a).
7. **For the architect: how the landing is set.** Read from 1.7.12: `onAPIError.errorURL` covers the failures before the state is read (`state_not_found`, `invalid_callback_request`, `callback.mjs` lines 34, 51 to 54 and 71 to 75) and the `/error` endpoint (`error.mjs` lines 372 to 379); a sign-in call's `errorCallbackURL` covers only failures after the state is read. A relative `/account` passes `appendQueryParams` (`@better-auth/core` `dist/utils/url.mjs` lines 40 to 50). (a) `onAPIError.errorURL` `/account`; (b) both it and `errorCallbackURL`. Default: (a), with (b) if open question 6 picks (b).

## Depends on

- ADR 0002, auth and data access (Better Auth, Google sign-in).
- ADR 0010 decision 4, environments: `VERCEL_ENV` says preview or production only.
- ADR 0015 decisions 6 (request id, logs), 7 (error envelope) and 13 (no conformance claim).
- ORV-38 (the account page), ORV-122 (the `sign-in` limit), ORV-141 (log lines; open question 6), ORV-144 (sign-in notice and errors), ORV-63 (the production domain).
- ORV-281 comment 10700, what was seen on staging.

## Worked examples

Not run: this role has no shell. Each line runs from the repo root with `node -e`. Outputs are strings or booleans; nothing is rounded. Hosts are the stand-ins of "Acceptance criteria".

- **W1, the code renamed in the address.** Input copied from `dist/oauth2/state.mjs` line 57. `node -e 'const code="state_security_mismatch"; console.log(code === "state_security_mismatch" ? "state_mismatch" : code)'` prints `state_mismatch`.
- **W2, a failed sign-in by `signin-failure-1`.** `node -e 'for (const q of ["?error=state_mismatch","?error=","?error=%3Cimg%3E","?code=1",""]) console.log(JSON.stringify(q), (new URLSearchParams(q).get("error") ?? "") !== "")'` prints `true`, `false`, `true`, `false`, `false`, one per line after each query.
- **W3, the landing address.** The same steps as `appendQueryParams` (`@better-auth/core` `dist/utils/url.mjs` lines 43 to 49) on `/account`. `node -e 'const u=new URL("/account","https://better-auth.invalid"); u.search=new URLSearchParams({error:"state_mismatch"}).toString(); console.log(u.href.slice(u.origin.length))'` prints `/account?error=state_mismatch`.
- **W4, the host match of `alias-host-1`.** `node -e 'const c=new URL("https://orivilo.example").host; for (const h of ["https://orivilo.example/","https://ORIVILO.example/","https://orivilo-alias.example/","https://orivilo.example:8443/"]) console.log(h, new URL(h).host !== c)'` prints `false`, `false`, `true`, `true`.
- **W5, the target built by setting path and query.** `node -e 'const t=new URL("https://orivilo.example"); t.pathname="//evil.example/x"; t.search=""; console.log(t.origin, t.href)'` prints `https://orivilo.example https://orivilo.example//evil.example/x`.
- **W6, the form `alias-host-1` forbids.** `node -e 'console.log(new URL("//evil.example/x","https://orivilo.example").href)'` prints `https://evil.example/x`: resolving the request's path against the configured address would hand the origin to the request.

## Changelog

- Version 1, 2026-11-18: first version, from ORV-281 comment 10700 and the ORV-286 envelope.
