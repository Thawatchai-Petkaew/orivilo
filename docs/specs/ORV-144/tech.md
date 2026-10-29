---
issue: ORV-144 (https://tpetkaew.atlassian.net/browse/ORV-144)
spec: docs/specs/ORV-144/spec.md v1.0
task: ORV-144-tech-1
author: architect
date: 2026-10-29
---

# ORV-144 tech notes: one error body, its codes and the retry matrix

These notes turn the spec's "Rules and bounds" into modules, signatures, tests and a build order. They use the spec's rule names (`orv144-envelope`, `orv144-codes`, `orv144-message`, `orv144-outcome`, `orv144-route-answers`, `orv144-retry`, `orv144-ui`) and do not restate their tables; a change to a table is made in the spec first. P1 to P8 and R1 to R7 are the spec's survey rows ("The set this covers").

Sources read for this design: the spec; ADR 0015 decision 7 and its "Not done yet"; `.claude/rules/security.md` rules 8, 14 and 15; ORV-141 tech notes sections 3, 5 and 9; and the repo at `0118bbe`: `packages/auth/src/auth-route.ts`, `log.ts`, `index.ts`, `package.json`, `auth-route.test.ts`, `auth.integration.test.ts`; `apps/web/app/directions/actions.ts`, `actions.test.ts`, `page.tsx`, `SavedStudio.tsx`, `read-outcome.ts`, `read-outcome.test.ts`; `apps/web/app/account/actions.ts`, `actions.test.ts`, `sign-in-line.ts`, `SignInForm.tsx`, `SignInForm.test.tsx`, `page.tsx`; `apps/web/i18n/messages.ts`, `wait.ts`; `apps/web/vitest.config.ts`, `eslint.config.mjs`, `tsconfig.json`; `packages/design-system/tests/check-copy.test.ts`. No external fact is new here: every behaviour of Next.js, Better Auth or the Fetch API these notes rest on is either in ORV-141's tech notes (each `Set-Cookie` survives `new Headers(...)`, a test proves it) or is checked by a test below.

## 1. Decisions in short

### Owner decisions (ORV-144 comment 10268)

Comment 10268 takes open questions 1 to 10 and 12 at their defaults and decides question 11 as one PR, under the owner's delegation (ADR 0012 decision 4). Each question is met here:

<!-- prettier-ignore -->
| Question | Decision | Met in |
| --- | --- | --- |
| 1 | (a) Better Auth's own answers with status 400 or more get the error body, code by status, other headers kept | §3, `asErrorAnswer`; row 4 test |
| 2 | (a) a throw in `authRoute` answers 500 `INTERNAL_ERROR` with row 5's line | §3, the `catch`; row 5 test |
| 3 | (a) 13 codes, one per matrix status; `error` stays the catalog key | §2, `ERROR_CODES`; §4, `CODE_OF` |
| 4 | (a) no client caller retries today; a keyed write carries a non-empty `Idempotency-Key` | §5; §6 (no server action call is wrapped) |
| 5 | (a) 3 retries after the first call | §5, `MAX_RETRIES`; row 17 test |
| 6 | (a) jitter `base × (0.5 + r)` | §5, `retryDelay`; row 18 test |
| 7 | (a) no automatic retry when `Retry-After` is over 10 s | §5, `MAX_WAIT_SECONDS`; row 17 test |
| 8 | (a) the reference line for `INTERNAL_ERROR` only | §6, `referenceLine`; rows 9, 12, 15 tests |
| 9 | (a) `signInWithGoogle`'s two throws return the `INTERNAL_ERROR` state; `signOut` unchanged | §4, account; row 15 test |
| 10 | (a) a network failure on `/account`'s forms stays a recorded gap | §6, R6 (no `catch` added) |
| 11 | (b) one PR, not the default's two slices | §10 and §11: eight builder tasks in one PR |
| 12 | (a) `AI_SPEND_CAP` joins the list with the spend cap story | §2: the list has 13 codes |

### Design decisions

<!-- prettier-ignore -->
| # | Decision | Section | Confirmation |
| --- | --- | --- | --- |
| D1 | The code list and the body helper are `packages/auth/src/errors.ts`, beside `log.ts`, exported from `@orivilo/auth`; no new package | §2 | row 1 test; `pnpm typecheck` |
| D2 | The retry module is `apps/web/client/retry.ts`, a new `client/` folder beside `server/`; a lint rule bans `node:` and `@orivilo/auth` imports there | §5 | rows 16 to 19 tests; the lint samples of §9 |
| D3 | The reference line and the failure lines are two helpers in `apps/web/i18n/wait.ts`, used by `/directions` and `/account` | §6 | rows 9, 12, 15 tests |
| D4 | The `/directions` call handling moves out of `SavedStudio` into `apps/web/app/directions/studio-calls.ts`, so rows 8, 9, 13 and 14 are tested without a DOM (apps/web has no DOM test environment and gains no dependency) | §6 | `SavedStudio.test.tsx` cases |
| D5 | The catalog gets its own copy test, `apps/web/i18n/messages.test.ts`, because the existing i18n and copy checks scan `packages/design-system` only (finding F1) | §6 | row 20 test |
| D6 | One PR (open question 11), built as eight tasks, each one deliverable with its tests | §10 | the G3 packet lists each task's commit |
| D7 | `fetchWithRetry` does not retry a call its caller aborted (finding F3) | §5 | supporting test in `retry.test.ts` |

## 2. The code list and the body helper (`packages/auth/src/errors.ts`)

### Place

<!-- prettier-ignore -->
| Option | For | Against |
| --- | --- | --- |
| (a) `packages/auth/src/errors.ts`, exported from `@orivilo/auth` | Beside `log.ts`, whose request id it carries, and `auth-route.ts`, its first caller; the app already imports `@orivilo/auth` in every server action file; the spec's row 1 names `packages/auth/src/errors.test.ts` | The code list is not about auth |
| (b) a new `packages/errors` | Clean name | A `package.json`, `tsconfig.json`, ESLint and Vitest config for about 60 lines (AGENTS.md rule 6) |
| (c) `apps/web/server/errors.ts` | Near the app's actions | `authRoute` lives in `packages/auth` and could not import it |

**Choice: (a).** The same reasoning as ORV-141's logger place (its tech notes, D2): if a package outside auth needs the list, it moves to its own package in that story.

### Surface

```ts
// packages/auth/src/errors.ts
import { REQUEST_ID_HEADER } from "./log.ts";

/** orv144-codes: the spec's table, in its order. Each entry: status, default retryable, message. */
export const ERROR_CODES = {
  BAD_REQUEST: { status: 400, retryable: false, message: "..." },
  // ... the 13 rows of orv144-codes, messages copied from the spec (orv144-message)
} as const;
export type ErrorCode = keyof typeof ERROR_CODES;

export interface ErrorBody {
  error: { code: ErrorCode; message: string; requestId: string; retryable: boolean };
}

/** orv144-codes: the code of a status of 400 or more; an unlisted 4xx is BAD_REQUEST, an unlisted 5xx INTERNAL_ERROR. */
export function codeOfStatus(status: number): ErrorCode;

/** orv144-envelope and orv144-message: the body, keys in the order code, message, requestId, retryable. */
export function errorBody(code: ErrorCode, requestId: string): ErrorBody;

/**
 * The one writer of an error answer. Status defaults to the code's; `headers` are copied first
 * (each Set-Cookie kept), then `content-type: application/json` and `x-request-id` are set, so
 * neither can come from the copy.
 */
export function errorResponse(
  code: ErrorCode,
  requestId: string,
  init?: { status?: number; headers?: HeadersInit },
): Response;

/** orv144-outcome: the three fields a server action failure adds, `retryable` as the code's literal. */
export function failureFields<C extends ErrorCode>(
  code: C,
  requestId: string,
): { code: C; requestId: string; retryable: (typeof ERROR_CODES)[C]["retryable"] };
```

`index.ts` exports `failureFields` and the type `ErrorCode`. `ERROR_CODES`, `codeOfStatus`, `errorBody` and `errorResponse` stay module exports for `auth-route.ts` and `errors.test.ts`; a later route handler in `apps/web` adds them to the index in its own PR.

`failureFields` returns `retryable` as the code's literal type (`true` for `RATE_LIMITED`), so `RateLimited`'s `retryable: true` in `actions.ts` type-checks from the list, not from a second literal.

**One writer.** `orv144-envelope` says no other code writes an error body. The check is a review command, run by the builder of B2 and by `reviewer` and `security`: `git grep -n -E "error: \{|\"error\":" -- packages/auth apps ':!*.test.ts' ':!*.test.tsx'` prints only `errors.ts` lines (at `0118bbe` it prints one line, `auth-route.ts:19`, the inline body this story removes).

## 3. Route answers (`packages/auth/src/auth-route.ts`, P1 to P3)

`authRoute(handler, options)` keeps its type. Its private `envelope` goes; `rateLimited` and `unavailable` call `errorResponse`:

- **P1.** `rateLimited(requestId, wait)` is `errorResponse("RATE_LIMITED", requestId, { headers: wait ? { "retry-after": wait, "x-retry-after": wait } : {} })`; `unavailable(requestId)` is `errorResponse("SERVICE_UNAVAILABLE", requestId)`. The bytes of both bodies are today's (both codes default to `retryable: true`); rows 2 and 3 widen today's tests to exact keys.
- **P2.** After `handler(request)`, in this order: status 429 goes to `rateLimited` as today; status 400 or more goes to a new private `asErrorAnswer(response, requestId)`; anything else goes through `withRequestId` unchanged, so a 200 or a 302 keeps its body byte for byte. `asErrorAnswer` copies the headers (`new Headers(response.headers)`), deletes `content-type` and `content-length`, cancels the original body (`void response.body?.cancel()`), and returns `errorResponse(codeOfStatus(response.status), requestId, { status: response.status, headers })`. The status stays the handler's: a 418 answers 418 with `BAD_REQUEST`, a 501 answers 501 with `INTERNAL_ERROR`. The ending stays `endingOfStatus(response.status)`, as today.
- **P3.** In the `catch`, `RateLimitUnavailable` answers 503 as today. Any other throw returns `{ value: errorResponse("INTERNAL_ERROR", requestId), ending: { ...endingOfStatus(500), reason: "unexpected", errorName } }`, with `errorName` the error's `name` when it is an `Error`, else `"unknown"` (`writeLine` closes it either way). The work no longer throws, so `atBoundary` writes this ending as the one line, and its own rethrow path is not reached from `authRoute`. `log.ts` does not change.
- The doc comment of `authRoute` drops "any other error is rethrown" and "The handler's body ... pass through unchanged" for answers below 400 only.

## 4. Server action outcomes (P4 to P8)

### Directions (`apps/web/app/directions/actions.ts`, P4)

```ts
import { type ErrorCode, failureFields } from "@orivilo/auth";

export type RateLimited = {
  ok: false;
  error: "rate-limited" | "ai-rate-limited";
  code: "RATE_LIMITED";
  requestId: string;
  retryAfter: number;
  retryable: true;
};
export type Failed = {
  ok: false;
  error: Exclude<ActionError, RateLimited["error"]>;
  code: ErrorCode;
  requestId: string;
  retryable: boolean;
};
/** What a person's failed call carries to the UI. */
export type ActionFailure = Failed | RateLimited;
export type Outcome<T> = { ok: true; value: T } | ActionFailure;
```

- `CODE_OF`, unexported, is `orv144-outcome`'s table for the default path of each member, written `{ ... } satisfies Record<ActionError, ErrorCode>`, so a new `ActionError` member without a code fails `pnpm typecheck`. Its `failed` is `INTERNAL_ERROR` and its `ai-failed` is `UPSTREAM_FAILED`.
- `run` reads `const requestId = requestIdOf(h)` once and passes it both to `atBoundary` and to a private `fail(error, code = CODE_OF[error])`, which returns `{ ok: false, error, ...failureFields(code, requestId) }`. So the outcome's `requestId` is the boundary line's (row 6).
- Branch by branch (ORV-141 tech notes section 5's table): limiter unavailable returns `fail(..., "SERVICE_UNAVAILABLE")`; limited returns the `RateLimited` object with `...failureFields("RATE_LIMITED", requestId)` and `retryAfter`; every other failure branch returns `fail(error)`. Endings do not change (`endingOf` reads only `error`).
- No exported action changes its parameters; every action's return type gains the three fields through `Outcome<T>`.

### Account (`apps/web/app/account/actions.ts`, P5, P6)

```ts
export type SignInState =
  | {
      error: "rate-limited";
      code: "RATE_LIMITED";
      requestId: string;
      retryAfter: number;
      retryable: true;
    }
  | {
      error: "failed";
      code: "SERVICE_UNAVAILABLE" | "INTERNAL_ERROR";
      requestId: string;
      retryable: boolean;
    }
  | null;
```

- `signInWithGoogle` reads `requestIdOf(requestHeaders)` once, as `run` does. The limited and unavailable states spread `failureFields("RATE_LIMITED" | "SERVICE_UNAVAILABLE", requestId)`; their endings do not change.
- `signInSocial` and the missing-URL check move into a `try` inside the work. A throw returns `{ value: { state: { error: "failed", ...failureFields("INTERNAL_ERROR", requestId) } }, ending: { level: "error", outcome: "failed", reason: "unexpected", errorName } }`: the same line as today, and the action returns the state instead of rejecting (open question 9). `redirect(url)` stays after the boundary, outside the `try`, so a granted sign-in still redirects (ORV-141 D5).
- **P6, `signOut`:** unchanged.

### Unchanged producers (P7, P8)

`setLocale` (P7) returns nothing. The OpenRouter call (P8) is a `POST` without a key and is never retried; its failure reaches the person as P4's `ai-failed` with `UPSTREAM_FAILED` (row 11).

## 5. The retry module (`apps/web/client/retry.ts`)

### Place

<!-- prettier-ignore -->
| Option | For | Against |
| --- | --- | --- |
| (a) `apps/web/client/retry.ts`, a new folder beside `server/` | Says what runs where; a lint rule can scope the import ban to the folder | Two config lines: the Vitest `include` and the ESLint scope |
| (b) `apps/web/app/retry.ts` | No config change | `app/` holds routes and their own helpers; a module for every caller sits oddly there |
| (c) `packages/auth/src/retry.ts` behind a subpath export | Beside the code list | `packages/auth` is server code (ADR 0002); the spec bars the module from importing `@orivilo/auth` values |

**Choice: (a).**

### Surface

```ts
// apps/web/client/retry.ts: imports nothing (orv144-retry bars node: and @orivilo/auth)
export const MAX_RETRIES = 3; // open question 5
export const MAX_WAIT_SECONDS = 10; // open question 7

/** One try's result: an answer, or null when the call rejected with no answer. */
export type Answer = {
  status: number;
  retryAfter: string | null;
  retryable: boolean | null;
} | null;

/**
 * orv144-retry as one pure decision (the spec's worked example "The retry decision"): the wait in
 * ms before the next try, or null for none. `retries` is the number already made; `r` is in [0, 1).
 */
export function retryDelay(
  call: { method: string; idempotencyKey: string | null },
  answer: Answer,
  retries: number,
  r: number,
): number | null;

export interface RetryDeps {
  fetch: (input: string | URL, init?: RequestInit) => Promise<Response>;
  sleep: (ms: number) => Promise<void>;
  random: () => number;
}

/**
 * `fetch` with orv144-retry. The input is a URL, never a `Request`, so a body can be sent again.
 * Resolves with the last answer, or rejects with the last error when the last try had no answer.
 */
export function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  deps?: Partial<RetryDeps>,
): Promise<Response>;
```

- `method` is `(init.method ?? "GET").toUpperCase()`; `idempotencyKey` is `new Headers(init.headers).get("idempotency-key")`, counted only when non-empty after trimming.
- `retryable` is read from a clone of the answer (`response.clone().json()`), only when its `content-type` holds `application/json`; a body that does not parse, or has no `error.retryable` boolean, reads as `null`, so the matrix default applies.
- An answer that will be retried has its body cancelled before the wait.
- **Abort (D7).** When `init.signal` is aborted, the error is rethrown at once and not retried: the caller asked to stop. The spec's "a call with no answer" does not say this (finding F3).
- Defaults: `fetch` is `globalThis.fetch`, `sleep` is a `setTimeout` promise, `random` is `Math.random`.

### The import ban

`apps/web/eslint.config.mjs` gains one config object for `client/**/*.{ts,tsx}` (tests ignored): `no-console: "error"`; `no-restricted-imports` with the patterns `node:*`, `@orivilo/auth` and `@orivilo/auth/*` (it reports a single-line import, a multi-line import, a side-effect import and an `export ... from`); and `no-restricted-syntax` on `ImportExpression` whose source starts with `node:` or `@orivilo/auth` (a dynamic `import()`, which `no-restricted-imports` does not report). The ban is stricter than the spec (it bars type imports too); the module needs none. `apps/web/vitest.config.ts` adds `client/**/*.test.ts` to `include`.

### No caller today

No code calls `fetchWithRetry` in this story (open question 4): every client call is a server action, a `POST` without a key. The module is proven by its own tests until the first `GET` or keyed caller adopts it.

## 6. The UI (R1 to R7) and the catalog

### Catalog (`apps/web/i18n/messages.ts`)

A new top-level `failure` group in `th` and `en`, keys `reference` and `network`, the strings of `orv144-ui`. `WebMessages` is `typeof th`, so a key in one language only fails `pnpm typecheck`.

New `apps/web/i18n/messages.test.ts` (D5, finding F1): walks every string of `webMessages.th` and `webMessages.en`; each is non-empty and holds no middot (U+00B7) and no em dash (U+2014); the two have the same key paths. Today's catalog passes it (`grep -c -P "\x{00B7}|\x{2014}" apps/web/i18n/messages.ts` prints 0 at `0118bbe`).

### Helpers (`apps/web/i18n/wait.ts`, D3)

```ts
import type { ErrorCode } from "@orivilo/auth"; // a type only; erased from the client bundle

/** orv144-ui: "Reference: {requestId}" for INTERNAL_ERROR (open question 8), else null. */
export function referenceLine(
  failure: WebMessages["failure"],
  outcome: { code: ErrorCode; requestId: string },
): string | null;

/** A failed call's lines: `errorLine` by its `error`, then the reference line when there is one. */
export function failureLines(
  labels: { errors: SavedErrors; wait: WebMessages["wait"]; failure: WebMessages["failure"] },
  outcome: { error: keyof SavedErrors; code: ErrorCode; requestId: string; retryAfter?: number },
): string[];
```

`referenceLine` fills `{requestId}` with `fill` from `@orivilo/design-system`, the spec's worked example "The reference line". `errorLine` and `formatWait` do not change.

### `/directions` calls (`apps/web/app/directions/studio-calls.ts`, new, D4)

```ts
export interface Notice {
  tone: "info" | "warning" | "danger";
  lines: string[];
}
export interface NoticeLabels {
  errors: WebMessages["saved"]["errors"];
  wait: WebMessages["wait"];
  failure: WebMessages["failure"];
}

/** A failed outcome as a notice: tone danger, `failureLines` (R2, R3). */
export function failureNotice(labels: NoticeLabels, failure: ActionFailure): Notice;

/**
 * One server action call from /directions (R3): busy on, the call once, never retried (a POST
 * without a key, orv144-retry), busy off in `finally`. A failed outcome sets `failureNotice`; a
 * rejected call sets the `failure.network` line. Only the call's rejection is caught; `done` runs
 * as today. Resolves in every case the call can end in.
 */
export function runCall<T>(
  call: () => Promise<Outcome<T>>,
  done: (value: T) => Promise<void> | void,
  ui: { labels: NoticeLabels; setNotice: (n: Notice) => void; setBusy: (on: boolean) => void },
): Promise<void>;

/** R4: the list again; a failure or a rejection keeps the last list and touches no notice. */
export function refreshList(
  list: () => Promise<Outcome<Listing>>,
  setListing: (l: Listing) => void,
): Promise<void>;
```

### Reader by reader

<!-- prettier-ignore -->
| # | Change |
| --- | --- |
| R1 | `page.tsx` `load` returns `{ kind: "error", failure: listing }`; `SavedView`'s error member becomes `{ kind: "error"; failure: ActionFailure }`. The two setup views do not change. The page passes `failure={m.failure}` to `SavedStudio` |
| R2 | `SavedStudio`'s first notice is `failureNotice(labels, view.failure)` |
| R3 | `act` calls `runCall(call, done, { labels, setNotice, setBusy: (on) => setBusy(on ? kind : null) })` inside `startTransition`; the button's `loading` reads `busy` as today |
| R4 | `refresh` is `refreshList(listDirections, setListing)` |
| R5 | `readingResult(result, errors, wait, failure)`: `cardNotice` (a string or null) becomes `cardLines` (a string array or null), the `failureLines` of the outcome, still null for `ai-failed`. `SavedStudio.readWithAi` sets `{ tone: "warning", lines: cardLines }`. The rate limit `notice` does not change |
| R6 | `SignInLabels` gains `failure`; `SignInLine` gains `reference?: string` from `referenceLine`; `SignInNotice` renders it as a second paragraph inside the same `role="status"` region; `account/page.tsx` passes `failure: m.failure`. No `catch` around the form action (open question 10) |
| R7 | Unchanged |

`SavedStudio` keeps its notice region: each line is one paragraph in the `role="status"` live region, so the reference line follows the failure line there.

## 7. Producers and readers, change by change

<!-- prettier-ignore -->
| # | Change | Section | Task |
| --- | --- | --- | --- |
| P1 | `rateLimited`, `unavailable` through `errorResponse`; `envelope` removed | §3 | B2 |
| P2 | An answer of 400 or more through `asErrorAnswer` | §3 | B2 |
| P3 | A throw other than `RateLimitUnavailable` answers 500 `INTERNAL_ERROR` | §3 | B2 |
| P4 | `Outcome`, `RateLimited`, `Failed`, `ActionFailure`; `CODE_OF`; `run` passes `requestId` | §4 | B3 |
| P5 | `SignInState` with the fields; the two throws return the `INTERNAL_ERROR` state | §4 | B6 |
| P6 | Unchanged | §4 | none |
| P7 | Unchanged | §4 | none |
| P8 | Unchanged | §4 | none |
| R1 | The error view keeps the failure | §6 | B5 |
| R2 | `failureNotice` | §6 | B5 |
| R3 | `runCall` | §6 | B5 |
| R4 | `refreshList` | §6 | B5 |
| R5 | `readingResult` returns `cardLines` | §6 | B5 |
| R6 | `referenceLine` under the sign-in button | §6 | B7 |
| R7 | Unchanged | §6 | none |

## 8. Changed signatures

<!-- prettier-ignore -->
| # | Where | Change | Callers affected |
| --- | --- | --- | --- |
| S1 | `packages/auth/src/errors.ts` (new) | `ERROR_CODES`, `ErrorCode`, `ErrorBody`, `codeOfStatus`, `errorBody`, `errorResponse`, `failureFields` | none (new) |
| S2 | `packages/auth/src/index.ts` | exports `failureFields` and the type `ErrorCode` | the two action files, `wait.ts` (type) |
| S3 | `packages/auth/src/auth-route.ts` | `authRoute` unchanged in type; `envelope` removed; `asErrorAnswer` new (private) | the route file, unchanged |
| S4 | `apps/web/app/directions/actions.ts` | `Outcome<T>`, `RateLimited` gain `requestId`; new exported types `Failed`, `ActionFailure`; private `CODE_OF`, `fail` | `page.tsx`, `SavedStudio.tsx`, `read-outcome.ts`, `studio-calls.ts`, their tests |
| S5 | `apps/web/app/account/actions.ts` | `SignInState` gains `code`, `requestId`, `retryable` | `sign-in-line.ts`, `SignInForm.tsx`, their tests |
| S6 | `apps/web/client/retry.ts` (new) | `MAX_RETRIES`, `MAX_WAIT_SECONDS`, `Answer`, `retryDelay`, `RetryDeps`, `fetchWithRetry` | none (open question 4) |
| S7 | `apps/web/i18n/messages.ts` | `failure` group; `WebMessages` gains it | `page.tsx` (both), `SavedStudio`, `SignInForm` |
| S8 | `apps/web/i18n/wait.ts` | new `referenceLine`, `failureLines` | `studio-calls.ts`, `read-outcome.ts`, `sign-in-line.ts` |
| S9 | `apps/web/app/directions/studio-calls.ts` (new) | `Notice`, `NoticeLabels`, `failureNotice`, `runCall`, `refreshList` | `SavedStudio.tsx` |
| S10 | `apps/web/app/directions/read-outcome.ts` | `readingResult(result, errors, wait, failure)`; `cardNotice` becomes `cardLines` | `SavedStudio.tsx` |
| S11 | `SavedStudio` props; `SignInLabels`; `SignInLine` | `failure` prop; `failure` label; `reference?` | the two pages |
| S12 | `apps/web/eslint.config.mjs`, `apps/web/vitest.config.ts` | `client/**` rules and test include | none |

`DirectionStudio` and every other `@orivilo/design-system` API is unchanged (the spec's "Lane").

## 9. Tests by acceptance row

`<id>` is the request's id. "Exact" means `toStrictEqual` on the parsed body plus `Object.keys` at both levels.

<!-- prettier-ignore -->
| Row | File | Test | What it asserts |
| --- | --- | --- | --- |
| 1 | `packages/auth/src/errors.test.ts` (new) | "the code list is the matrix's statuses, one code each" | `ERROR_CODES` equals the spec's 13 rows written out in the test, in order; statuses distinct; `codeOfStatus` for each listed status and for 401, 418, 500, 501, 503 (the worked example "Status to code"); `errorBody("INTERNAL_ERROR", id)` stringifies to the worked example "The body" byte for byte; `errorResponse` sets `content-type` and `x-request-id` over copied values, keeps two `Set-Cookie`, defaults the status and takes an override; `failureFields` gives the code's `retryable` |
| 2 | `packages/auth/src/auth-route.test.ts` | "turns a 429 into Retry-After and the RATE_LIMITED body" (widened) | Both paths (count limited; handler 429 with `X-Retry-After: 7`): 429, `Retry-After`, exact body, `x-request-id` equals `requestId` |
| 3 | `auth-route.test.ts` | "a store failure answers 503 and logs once" (widened) | Exact `SERVICE_UNAVAILABLE` body; the line as ORV-141 row 12 |
| 4 | `auth-route.test.ts` | "an error answer from Better Auth gets the error body" (new) | 401 with Better Auth's body holding `ana@example.com` and two `Set-Cookie`: 401, exact `UNAUTHENTICATED` body, `getSetCookie()` has both, no email in the text, `content-type: application/json`; 400 and 418: `BAD_REQUEST`, status kept; 500: `INTERNAL_ERROR`; 503: `SERVICE_UNAVAILABLE`; 200 and a 302 with a body: text byte for byte as written, `location` kept |
| 5 | `auth-route.test.ts` | "every answer carries the request id and one line" (throw case changed) | The seeded throw resolves to 500 with the exact `INTERNAL_ERROR` body, `requestId` equal to `x-request-id`; the text holds neither `ana@example.com`, `/Users/` nor ` at `; one line `error`, `failed`, `unexpected`, `errorName: "Error"`, `status: 500`. "rethrows any other error and passes a 200 through" becomes "answers any other error with 500 and passes a 200 through" |
| 6 | `apps/web/app/directions/actions.test.ts` | "a failure outcome carries code, requestId and retryable" | `Denied(403)` on save: outcome equals `{ ok: false, error: "forbidden", code: "FORBIDDEN", requestId, retryable: false }`, `requestId` equal to the captured boundary line's |
| 7 | `actions.test.ts` | "each reason maps to its code" | `it.each` over 17 cases: the 15 members (no session; `Denied(403)`; `MissingEnvError`; a plain `Error`; fake `fetch` 500; no `OPENROUTER_API_KEY`; a preloaded `write` and `ai-read` bucket; `DirectionError` with each of its 7 reasons) and the two unavailable paths (save gives `failed`, a reading gives `ai-failed`). Expected code and `retryable` are written in the test from the spec's tables, not read from `ERROR_CODES` |
| 8 | `actions.test.ts`; `apps/web/app/directions/SavedStudio.test.tsx` (new) | "refuses a save, an approval and an import as failed" (widened); "a failed write is shown and not retried" | Outcome `{ error: "failed", code: "SERVICE_UNAVAILABLE", retryable: true, requestId }`. `runCall` with that outcome, English and Thai labels: the call ran once; `setNotice` got tone `danger` and exactly the failed line; `setBusy` got `true` then `false` |
| 9 | `actions.test.ts`; `SavedStudio.test.tsx` | "an unexpected error carries INTERNAL_ERROR and nothing of the error"; "an INTERNAL_ERROR notice shows the reference" | Outcome `failed`, `INTERNAL_ERROR`, `false`; `JSON.stringify` of it holds neither seeded value. `runCall` with that outcome: lines are the failed line then "Reference: <id>" / "รหัสอ้างอิง: <id>" |
| 10 | `actions.test.ts` | the `refused` helper gains `requestId` | Every limited case also asserts `requestId` (a UUID v4 equal to the line's) |
| 11 | `actions.test.ts` | "an AI failure carries UPSTREAM_FAILED and is not retried" | Fake `fetch` answers 500: outcome `ai-failed`, `UPSTREAM_FAILED`, `true`; `fetch` called once |
| 12 | `SavedStudio.test.tsx` | "the first notice from the page keeps the reference" | `renderToStaticMarkup` of `SavedStudio` with an error view holding an `INTERNAL_ERROR` failure, English and Thai: the `role="status"` region holds the badge word, the failed line and the reference line with the id (`./actions` mocked to stubs) |
| 13 | `SavedStudio.test.tsx` | "a call with no answer shows the network line and is not retried" | `runCall` with a call rejecting `new TypeError("Failed to fetch")`: resolves; call once; `setNotice` tone `danger`, lines `[failure.network]` in English and Thai; `setBusy` ends `false` |
| 14 | `SavedStudio.test.tsx` | "a failed refresh keeps the saved notice" | `runCall` whose `done` sets the saved notice then awaits `refreshList` with a rejecting list: resolves; `setListing` not called; the last notice is the saved one; Vitest's unhandled rejection check stays clean |
| 15 | `apps/web/app/account/actions.test.ts`; `sign-in-line.test.ts` | "an error from signInSocial ..." and "a missing URL ..." change from rejects to the state; "an INTERNAL_ERROR state shows the reference" | Limited, unavailable, throw: states carry `RATE_LIMITED`/`true`, `SERVICE_UNAVAILABLE`/`true`, `INTERNAL_ERROR`/`false` and the line's `requestId`; the third resolves and holds no `ana@example.com`; `signInSocial` not called on the first two. `signInLine` gives the reference for the third only, English and Thai; `SignInForm.test.tsx` renders it inside `role="status"` |
| 16 | `apps/web/client/retry.test.ts` (new) | "4xx and 500 are not retried" | `GET`, each of 400, 401, 403, 404, 409, 413, 422, 500: one call, that answer is the result |
| 17 | `retry.test.ts` | "408 and 429 wait for Retry-After" | `sleep` records 2000 then 1000; `Retry-After: 3600` is not retried; four 429s: three retries, the fourth answer is the result. One case runs the default `sleep` under fake timers and advances 2000 ms before the second call happens |
| 18 | `retry.test.ts` | "5xx gateway answers and network errors back off with jitter" | `random` fixed at 0.5: 500, 1000, 2000 for 502, 503, 504 and a rejection; at 0 and 0.75 the worked example "The jitter bounds" values; the fourth result returned (a rejection as the last try rejects) |
| 19 | `retry.test.ts` | "only a GET or a keyed write is retried, and never a retryable false" | `GET` 503 with body `retryable: false`: one call; `POST` 503: one call; `POST` with `Idempotency-Key: k1` 503: retried after 500 ms |
| 20 | `apps/web/i18n/messages.test.ts` (new) | "every catalog string is in Thai and English, without a middot or an em dash" | The walk of §6; `pnpm typecheck` for the key set |

Supporting tests, not rows: `retryDelay` with every case of the worked example "The retry decision" (14 cases, `r = 0.5`); "an aborted call is not retried" (D7); `failureLines` and `referenceLine` in `apps/web/i18n/wait.test.ts`; `readingResult` gives `cardLines` with the reference for `ai-not-configured` and stays null for `ai-failed` (`read-outcome.test.ts`).

**Lint samples (testing rules, import ban).** For `client/**`, the builder of B8 runs one scratch sample per form, each importing `node:fs` and then `@orivilo/auth`: a single-line import, a multi-line import, a side-effect import, a dynamic `import()` and an `export ... from`. `pnpm --filter @orivilo/web lint` fails once per sample, naming the line; the samples are deleted; one `verified` row per form.

**Mutation check.** One mutation per row of `ERROR_CODES` (status, retryable, message), per branch of `codeOfStatus`, per path of `asErrorAnswer` (the 429 order, the 400 bound, each dropped header), per row of `CODE_OF`, per clause of `retryDelay` (method, key, `retryable: false`, the retry count, the 10 s bound, the whole-number check, each status set, the jitter formula) and per branch of `runCall`, each seen red and restored, one `verified` row each (testing rules, L-0042).

**Affected integration test.** `auth.integration.test.ts` line 312 sends a `text/plain` sign-in that Better Auth refuses; that answer now carries the error body. The test asserts the status is not 200, the text has no `RATE_LIMITED` and the header is a UUID v4, all of which still hold. No other assertion there reads a Better Auth error body.

## 10. Build order

One PR (open question 11). One builder deliverable per task; each runs its affected tests (`vitest related --run`), and the main session runs the full gate after B8. B8 changes two config files, so its builder runs the full `apps/web` suite while building (testing rules). The `security` role is dispatched on the PR (`packages/auth/**`, ADR 0015 decision 2).

<!-- prettier-ignore -->
| Task | Deliverable | Write set | Context pointers | Rows | Needs | Size (changed lines with tests) |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | The code list and the body helper (S1, S2) | `packages/auth/src/errors.ts`, `packages/auth/src/errors.test.ts`, `packages/auth/src/index.ts` | spec; these notes §2, §9; `packages/auth/src/log.ts`; `packages/auth/src/auth-route.ts`; `packages/auth/src/index.ts`; ADR 0015 decision 7 | 1 | none | about 130 |
| B2 | `authRoute` answers (S3; P1 to P3) | `packages/auth/src/auth-route.ts`, `packages/auth/src/auth-route.test.ts`, `packages/auth/src/auth.integration.test.ts` (only if an assertion breaks) | spec; these notes §3, §9; `auth-route.ts`; `auth-route.test.ts`; `errors.ts`; `log.ts`; `auth.integration.test.ts` | 2, 3, 4, 5 | B1 | about 110 |
| B3 | Directions outcomes (S4; P4) | `apps/web/app/directions/actions.ts`, `apps/web/app/directions/actions.test.ts`, `apps/web/app/directions/read-outcome.test.ts` (fixtures gain the three fields, no new case) | spec; these notes §4, §9; `actions.ts`; `actions.test.ts`; `read-outcome.test.ts`; `packages/auth/src/errors.ts`; `packages/auth/src/directions.ts` | 6, 7, 8 and 9 (outcome halves), 10, 11 | B1 | about 140 |
| B4 | The catalog keys and the failure lines (S7, S8) | `apps/web/i18n/messages.ts`, `apps/web/i18n/messages.test.ts`, `apps/web/i18n/wait.ts`, `apps/web/i18n/wait.test.ts` | spec `orv144-ui`; these notes §6; `messages.ts`; `wait.ts`; `wait.test.ts`; `packages/design-system/tests/check-copy.test.ts` | 20 | B1 (the `ErrorCode` type) | about 70 |
| B5 | The `/directions` UI (S9 to S11; R1 to R5) | `apps/web/app/directions/studio-calls.ts`, `apps/web/app/directions/SavedStudio.tsx`, `apps/web/app/directions/SavedStudio.test.tsx`, `apps/web/app/directions/page.tsx`, `apps/web/app/directions/read-outcome.ts`, `apps/web/app/directions/read-outcome.test.ts` | spec; these notes §6, §9; `SavedStudio.tsx`; `page.tsx`; `read-outcome.ts`; `wait.ts`; `apps/web/app/account/SignInForm.test.tsx` (the render pattern) | 8 and 9 (UI halves), 12, 13, 14 | B3, B4 | about 190 |
| B6 | The sign-in state (S5; P5) | `apps/web/app/account/actions.ts`, `apps/web/app/account/actions.test.ts`, `apps/web/app/account/sign-in-line.test.ts` and `apps/web/app/account/SignInForm.test.tsx` (fixtures gain the fields, no new case) | spec; these notes §4, §9; `account/actions.ts`; `account/actions.test.ts`; `sign-in-line.test.ts`; `SignInForm.test.tsx` | 15 (operator half) | B1 | about 70 |
| B7 | The sign-in reference line (S11; R6) | `apps/web/app/account/sign-in-line.ts`, `apps/web/app/account/sign-in-line.test.ts`, `apps/web/app/account/SignInForm.tsx`, `apps/web/app/account/SignInForm.test.tsx`, `apps/web/app/account/page.tsx` | spec; these notes §6; `sign-in-line.ts`; `SignInForm.tsx`; `account/page.tsx`; `wait.ts` | 15 (person half) | B4, B6 | about 50 |
| B8 | The retry module and its import ban (S6, S12) | `apps/web/client/retry.ts`, `apps/web/client/retry.test.ts`, `apps/web/vitest.config.ts`, `apps/web/eslint.config.mjs` | spec `orv144-retry` and its two worked examples; these notes §5, §9; ADR 0015 decision 7; `apps/web/vitest.config.ts`; `apps/web/eslint.config.mjs`; `.claude/rules/testing.md` | 16, 17, 18, 19 | none | about 180 |

B1, then B2, B3, B4, B6 and B8 can run in any order (B8 needs nothing); B5 after B3 and B4; B7 after B4 and B6. Each task leaves `pnpm typecheck` green: B3 and B6 update the fixtures their type change breaks, without new cases.

## 11. Size

About 940 changed lines with tests: B1 130, B2 110, B3 140, B4 70, B5 190, B6 70, B7 50, B8 180. This is over the spec's estimate of about 600 ("Impact list", Size), for three reasons: `SavedStudio.test.tsx` covers five rows without a DOM (D4), the retry tests cover four rows plus the 14 decision cases, and the catalog test is new (D5). It is over the 400 line mark; comment 10268 decides one PR anyway (open question 11). The G3 packet lists one commit per task, so a reviewer can read the PR task by task.

## 12. Impact list

### Code

As the spec's "Impact list", plus: `apps/web/app/directions/studio-calls.ts` (new), `apps/web/client/retry.ts` (new, the place the spec left to these notes), `apps/web/app/account/SignInForm.tsx`, `apps/web/app/account/page.tsx`, `apps/web/vitest.config.ts`, `apps/web/eslint.config.mjs`, `packages/auth/src/index.ts`. Unchanged: `apps/web/app/api/auth/[...all]/route.ts`, `packages/auth/src/log.ts`, `apps/web/i18n/actions.ts`, `packages/intent-engine/**`, `packages/design-system/**`.

### Tests that change

As the spec's "Impact list", plus: `apps/web/app/account/SignInForm.test.tsx` (fixtures, and the reference case), `apps/web/i18n/wait.test.ts` (the two helpers). New: `packages/auth/src/errors.test.ts`, `apps/web/app/directions/SavedStudio.test.tsx`, `apps/web/client/retry.test.ts`, `apps/web/i18n/messages.test.ts`. `auth.integration.test.ts` is expected to stay as it is (§9).

## 13. Documents to bring up to date

Each file below is outside this task's write set and is edited by its owner role, after the code lands unless the row says otherwise. Found with `git grep -n -E 'rethrow|rethrown' -- docs .claude`, `git grep -n -i -E 'pass(es)? through|handler writes' -- docs`, `git grep -n -E 'retryable|outcome object|error: "failed"' -- docs`, `git grep -n -i -E 'signInSocial|missing-URL' -- docs`, `git grep -n -i 'check-i18n' -- AGENTS.md .claude docs/adr` and `git grep -n -F '3 tries' -- docs .claude`, each read line by line. A history line (what an earlier story did, true as a record) stays and is listed after the table.

<!-- prettier-ignore -->
| File and line | Today's text (short) | New text (short) | Owner role |
| --- | --- | --- | --- |
| `docs/specs/ORV-144/spec.md 89` (row 16, Test) | "The retry module's test (place in tech notes)" | `apps/web/client/retry.test.ts` | `spec`, now |
| `docs/specs/ORV-144/spec.md 93` (row 20) | "`pnpm check-i18n` and the copy check run ... Existing checks in `pnpm lint` / `pnpm test`" | New `apps/web/i18n/messages.test.ts` and `pnpm typecheck`; no `check-i18n` command exists and neither check scans `apps/web` (F1) | `spec`, now |
| `docs/specs/ORV-144/spec.md 240` | "beside `packages/auth/src/log.ts`, place in tech notes" | `packages/auth/src/errors.ts` | `spec`, now |
| `docs/specs/ORV-144/spec.md 241` | "the retry module and its test (new)" | `apps/web/client/retry.ts` and its test; also `studio-calls.ts`, `SignInForm.tsx`, `account/page.tsx`, the two config files (§12) | `spec`, now |
| `docs/specs/ORV-144/spec.md 243` | "About 600 changed lines ... so it ships as two vertical slices (open question 11)" | About 940 lines (§11); one PR, open question 11 decided (b) in comment 10268 | `spec`, now |
| `docs/specs/ORV-144/spec.md 249` | "G2 passes on the defaults" | On the defaults, except question 11, decided (b) in comment 10268 | `spec`, now |
| `docs/specs/ORV-144/spec.md 264` (open question 11) | Default "(a)" | Decided (b), comment 10268 | `spec`, now |
| `docs/specs/ORV-141/spec.md 83` (row 13) | "the throw writes one `error` line ... and is rethrown as today" | Since ORV-144: answered 500 with the `INTERNAL_ERROR` body; the line also carries `status: 500` (ORV-144 row 5) | `spec` |
| `docs/specs/ORV-141/tech.md 230` | "A missing URL or a throw from `signInSocial` is the boundary's `failed` line and is rethrown, as today." | Since ORV-144 it returns the `INTERNAL_ERROR` state with the same line (ORV-144 open question 9) | `architect` |
| `docs/specs/ORV-141/tech.md 244` | "Every response the work returns, the handler's included, goes through `withRequestId` ... with the same body" | Since ORV-144 an answer of 400 or more gets the error body (ORV-144 `orv144-route-answers`); one below 400 as written | `architect` |
| `docs/specs/ORV-141/tech.md 245` | "Any other throw is the boundary's line, without `status`, and is rethrown (row 13)." | Since ORV-144 it answers 500 `INTERNAL_ERROR`; the line carries `status: 500` | `architect` |
| `docs/specs/ORV-141/tech.md 318` (row 13) | "... line without `status` or the email, and the error is rethrown" | Since ORV-144: a 500 `INTERNAL_ERROR` answer, the line with `status: 500` | `architect` |
| `docs/specs/ORV-112/spec.md 59` | refused call returns `{ ok: false, error, code: "RATE_LIMITED", retryAfter, retryable: true }` | The same plus `requestId` (since ORV-144) | `spec` |
| `docs/specs/ORV-112/spec.md 60` | "Any other error is rethrown, as today." | Since ORV-144 any other error answers 500 `INTERNAL_ERROR`, and Better Auth's own answers of 400 or more carry the error body | `spec` |
| `docs/specs/ORV-112/tech.md 341` | "Any other error is rethrown, as today." | As the row above | `architect` |
| `docs/specs/ORV-112/tech.md 476` | "any other error is rethrown" | "any other error answers 500 `INTERNAL_ERROR` (since ORV-144)" | `architect` |
| `docs/specs/ORV-122/spec.md 52` | "any other error rethrown" | "any other error answered 500 with the `INTERNAL_ERROR` body, and Better Auth's own error answers given the error body (both since ORV-144)" | `spec` |
| `docs/specs/ORV-122/spec.md 61` | "only an error from the Better Auth handler that is not `RateLimitUnavailable` is rethrown" | "... is answered 500 `INTERNAL_ERROR` (rethrown before ORV-144)" | `spec` |
| `docs/specs/ORV-123/spec.md 43` (`orv123-count-guard`) | "returns `{ error: "failed" }` ... an error from `auth().api.signInSocial`, the missing-URL error and Next's `redirect` throw pass through unchanged" | The state also carries `code`, `requestId`, `retryable` (ORV-144); only Next's `redirect` passes through; the other two return the `INTERNAL_ERROR` state since ORV-144 | `spec` |
| `docs/specs/ORV-123/spec.md 51` (Out of scope) | "Errors from `signInSocial`, the missing-URL error and the redirect (they keep today's behaviour)." | Add: ORV-144 later returns the `INTERNAL_ERROR` state for the first two | `spec` |
| `docs/adr/0015-standards-and-required-controls.md 128` | "Confirmation: not confirmed yet; follow-up: ORV-113 ..." | A dated addition after line 128, as ORV-142 added after line 95: the helper, the outcome fields and the retry module exist (ORV-144); confirmed by ORV-144's tests for rows 1 to 19; "at most 3 tries" reads as 3 retries after the first call (ORV-144 open question 5); not yet: no client caller retries, `AI_SPEND_CAP` waits for the spend cap story. Line 128 stays as history | `architect` |
| `docs/adr/0015-standards-and-required-controls.md 189` | "Error envelope, PDPA masking, classification tags, uploads, money: named here, no code and no check (decisions 7 to 12, ORV-113)." | "Error envelope: code and tests (decision 7, ORV-144); no client caller retries yet. PDPA masking, classification tags, uploads, money: named here, no code and no check (decisions 8 to 12, ORV-113)." | `architect` |
| `.claude/rules/security.md 29` (rule 14) | "at most 3 tries" | "at most 3 retries after the first call (ORV-144 open question 5)" | `architect` (the rule mirrors ADR 0015, which names this file under "What this changes in earlier docs") |

**Checked, stays (history or still true):** `docs/specs/ORV-112/spec.md 130, 156`; `docs/specs/ORV-112/tech.md 367, 385, 386, 397, 461`; `docs/specs/ORV-112/design.md 144`; `docs/specs/ORV-122/spec.md 63` (the header on Better Auth's answers, still true); `docs/specs/ORV-123/spec.md 38, 63, 67, 123` (rows and tests of ORV-123 naming the `error` key); `docs/specs/ORV-141/spec.md 95` (it says an entry that rethrows still rethrows; after ORV-144 `authRoute` and `signInWithGoogle` no longer do, which the sentence allows), `99, 183, 217`; `docs/specs/ORV-141/tech.md 30, 120, 206` (about `atBoundary`, which still rethrows), `294, 314`; `docs/specs/ORV-108/spec.md 128, 133, 135` (the matrix as ORV-108 set it); `docs/specs/ORV-112/spec.md 33` ("1 to 3 tries" of a person signing in, another sense); `docs/adr/0015-standards-and-required-controls.md 74, 109, 116, 121, 123, 126` (decided text; the addition at line 128 records the reading of "3 tries"). `AGENTS.md 52` names a `check-i18n` that does not run on `apps/web` (F1); the owner of `AGENTS.md` decides whether it changes, so it is listed here for the main session, not edited.

## 14. Is an ADR needed?

No. No new package, dependency, runtime or service: `errors.ts` is a module in an existing server package (as ORV-141's `log.ts`), and `apps/web/client/` is a folder in the app. ADR 0015 decision 7 already decides the body and the matrix; this story builds them. Its lines 128 and 189 change by a dated addition and a status edit (§13), the form ORV-142 used for decision 6, not a rewrite of the decision.

## Findings for the spec

<!-- prettier-ignore -->
| # | Where in the spec | Finding | This design assumes | Status |
| --- | --- | --- | --- | --- |
| F1 | Row 20; AGENTS.md line 52 | No `pnpm check-i18n` command exists; `check-i18n.test.ts` and `check-copy.test.ts` scan `packages/design-system` only, so no check reads `apps/web/i18n/messages.ts` for a middot, an em dash or a missing language | A new `apps/web/i18n/messages.test.ts` (D5); `pnpm typecheck` covers the key set | Open, for the `spec` role (§13) |
| F2 | "Impact list", Size; open question 11 | The size is about 940 lines, not 600, and comment 10268 decides one PR | §10, §11 | Open, for the `spec` role (§13) |
| F3 | `orv144-retry`, "a call with no answer" | A call the caller aborted has no answer too; retrying it would undo the caller's stop | Not retried; rethrown (D7) | Open, for the `spec` role: add the clause or drop D7 |
| F4 | Rows 8, 9, 13, 14 ("They press") | `apps/web` has no DOM test environment; a click cannot be simulated without a new dependency | The call handling is tested through `runCall` and `refreshList`, the region through row 12's markup (D4) | Open, for the `spec` role: the test column names the method |
| F5 | `orv144-route-answers` | It does not say the status of a rewritten answer stays the handler's | The status stays (a 418 answers 418 with `BAD_REQUEST`); row 4 asserts it | Open, for the `spec` role: one clause |
