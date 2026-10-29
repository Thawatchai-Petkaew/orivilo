---
issue: ORV-141 (https://tpetkaew.atlassian.net/browse/ORV-141)
spec: docs/specs/ORV-141/spec.md v1.2
task: ORV-141-tech-1
author: architect
date: 2026-10-29
---

# ORV-141 tech notes: the request id, the logger and one line per request

These notes turn the spec's "Rules and bounds" into modules, signatures, tests and a build order. They use the spec's rule names (`orv141-request-id`, `orv141-line-shape`, `orv141-allow-list`, `orv141-routes`, `orv141-outcomes`, `orv141-reasons`, `orv141-boundary-line`, `orv141-step-lines`, `orv141-no-console`) and do not restate their lists; a change to a list is made in the spec first.

Sources read for this design (Next.js 16.4.1 as installed in `apps/web/node_modules/next`, not memory):

- `dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`: line 249 (Server Functions are POST requests to the route where they are used; a matcher that skips a path skips them too), line 255 (the proxy runs on the Node.js runtime), line 474 (Next strips `rsc`, `next-router-state-tree` and `next-router-prefetch` from `request.headers` before the proxy sees them), lines 653 to 676 (`missing` and `has` in the matcher).
- `dist/docs/01-app/02-guides/content-security-policy.md` line 135 (the guide recommends skipping prefetches for the CSP proxy).
- `dist/server/web/adapter.js` lines 140 to 149 (the strip) and 388 to 398 (when the proxy overrides request headers, Next adds the stripped Flight headers back, so a prefetch stays a prefetch downstream).
- `dist/server/lib/router-utils/resolve-routes.js` lines 446 to 464 and `dist/server/send-response.js` lines 49 to 50 (the proxy's response headers go on the outgoing response first; a header the route's own `Response` also sets is not appended again, so the proxy's value wins and is not doubled). This is the local server; Vercel is checked by row 18.
- `dist/experimental/testing/server/middleware-testing-utils.d.ts` (`unstable_doesMiddlewareMatch`, the matcher test helper).
- The repo at `d1a20b4` plus the spec commit: the files in the spec's "Call sites to move" and their tests.

## 1. Decisions in short

<!-- prettier-ignore -->
| # | Decision | Section | Confirmation |
| --- | --- | --- | --- |
| D1 | Open question 1: the proxy makes the id for every request its matcher passes, and the matcher no longer skips prefetches (option (a)); the proxy also does the CSP work for them | §2 | `apps/web/proxy.test.ts` matcher and proxy cases (rows 1, 2) |
| D2 | The logger is `packages/auth/src/log.ts`, exported from `@orivilo/auth`; no new package | §3 | review of slice 1; `pnpm typecheck` |
| D3 | Steps get the request's id and route from one `AsyncLocalStorage` that the boundary opens | §3 | rows 3 and 7 tests (a step line carries the boundary's `requestId`) |
| D4 | Each entry states its ending per branch (`Ended<T>`); the boundary helper writes the one line and rethrows a throw | §5 | rows 3 to 13 tests |
| D5 | Next's `redirect` is called after the boundary returns, so no Next internal error type is needed to read it as `ok` | §5 | row 10 test |
| D6 | Two slices, the split the spec's "Impact list" (Size) adopts: slice 1 the id, the logger and `authRoute`; slice 2, ORV-142 since comment 10262 (docs/specs/ORV-142/spec.md), the steps, the three action files and the lint rule | §11 | each PR's diff size in its G3 packet |

Open questions 2 to 9 keep their defaults: (a) each.

## 2. Where the id is made (open question 1)

**Choice: (a).** The proxy is the only place the id is made for a request to a server action or a route handler. Its matcher drops the `missing` conditions, so prefetch requests pass through it too. The boundary reads the proxy's value; it never makes the id that a header carries.

**Why (a), and why (b) and (c) cannot hold row 2:**

1. A server action cannot set its own response header. `headers()` is read-only and Next has no API for a server action's response headers. Only the proxy can put `x-request-id` on a server action's answer. Under (b), a server action request the proxy skipped would get a boundary-made id that no header carries, and row 2 asks for the header. So for server actions the proxy must run on every such request, which is (a).
2. (b) needs the boundary to know whether the proxy ran. Any header the proxy sets, a client can send, so there is no such sign without a signing key shared between the proxy and the app. That is more code and a new secret for no gain once (a) holds.
3. (c) adds (b)'s problem to (a).

**What changes from option (a) as the spec words it.** Option (a) says the proxy "only skips the CSP work" for prefetches. It cannot: Next strips `next-router-prefetch` from `request.headers` before the proxy runs (proxy.md line 474, adapter.js lines 140 to 149), so the proxy cannot tell that kind of prefetch from a navigation. The proxy therefore does the CSP work for prefetches too. Today the matcher already passes every non-prefetch RSC navigation, which is the same kind of request, through the full CSP work; a prefetch now gets the same treatment. The cost is one nonce (16 random bytes) and one string join per prefetch. This departs from the CSP guide's advice (line 135), which is about cost, not correctness. Recorded as a deviation.

**Prefetches stay prefetches.** The proxy overrides request headers (`NextResponse.next({ request: { headers } })`). When it does, Next adds the stripped Flight headers back to the forwarded request (adapter.js lines 388 to 398), so `next-router-prefetch` still reaches the renderer.

**What the matcher still skips.** `_next/static`, `_next/image` and `favicon.ico` (the source pattern is unchanged). No server action or route handler is served there. A client could send a UUID-shaped `x-request-id` on such a path and the boundary would accept it (see `requestIdOf`, §3), but no boundary runs there. The matcher test pins this set (§9, row 2), so a later change to the matcher is a red test, not a silent gap (proxy.md line 251 warns of exactly that).

**The id's format.** `crypto.randomUUID()`, a UUID v4, in the proxy (Node.js runtime, proxy.md line 255).

## 3. The logger module (`packages/auth/src/log.ts`)

### Place

<!-- prettier-ignore -->
| Option | For | Against |
| --- | --- | --- |
| (a) `packages/auth/src/log.ts`, exported from `@orivilo/auth` | `authRoute` and `clientIp` import it directly; the app already depends on `@orivilo/auth`; `limit` is closed against `LIMITS` in the same package; no new package files | The `route` list names app entries inside `packages/auth` |
| (b) a new `packages/log` | Clean name | A `package.json`, `tsconfig.json`, ESLint and Vitest config for about 150 lines (AGENTS.md rule 6); `packages/auth` gains a dependency |
| (c) the logger in `apps/web/server`, a write function passed into `packages/auth` | `packages/auth` stays free of app names | `clientIp`, `authRoute` and the limiter each gain a parameter; step lines still need the request's context; row 12's and 13's tests could only assert calls to a fake |

**Choice: (a).** `packages/auth` already names the app's limits and holds `authRoute`, the one route handler; the route list joins them. If a second package outside auth needs the logger, it moves to its own package then, in that story.

**Not `server-only`.** `packages/auth` is server code (ADR 0002) and its other modules do not import `server-only`; `log.ts` follows them. It imports `node:async_hooks` and `node:crypto`, which a client bundle cannot load, so a client import fails the build.

### Surface (S1 to S6)

```ts
// packages/auth/src/log.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { LIMITS } from "./rate-limit.ts";

export const REQUEST_ID_HEADER = "x-request-id";

// S1: the closed lists, copied from the spec's rules (one constant per rule).
export const ROUTES = [/* orv141-routes, in the spec table's order */] as const;
export type Route = (typeof ROUTES)[number];
export const BOUNDARY_OUTCOMES = ["ok", "refused", "limited", "unavailable", "failed"] as const;
export type BoundaryOutcome = (typeof BOUNDARY_OUTCOMES)[number];
export const STEP_OUTCOMES = {
  "rate-limit": ["allowed", "limited", "unavailable"],
  "client-ip": ["no-trusted-ip"],
  "ai-usage": ["record-failed", "cost-not-reported"],
} as const; // orv141-outcomes
export type Step = keyof typeof STEP_OUTCOMES;
export const REASONS = [
  /* orv141-reasons: the three interpretBrief failure kinds, "rate-limit",
  "unexpected", "invalid-input", and every member of ActionError spelled out */
] as const;
export type Reason = (typeof REASONS)[number];
export type Level = "info" | "warn" | "error";

export interface Ending {
  level: Level;
  outcome: BoundaryOutcome;
  reason?: Reason;
  errorName?: string;
  status?: number;
}
/** What an entry's work returns: the value its caller gets, and how the line reads. */
export interface Ended<T> {
  value: T;
  ending: Ending;
}
export interface RequestContext {
  requestId: string;
  route: Route;
}

// S2: the one function that writes a request-time line, and the only `console` call in scope.
export function writeLine(fields: Record<string, unknown>): void;

// S3: the request's id from the header the proxy set; a fresh UUID v4 when it is missing or not one.
export function requestIdOf(headers: Headers): string;

// S4: the boundary. Opens the request context, runs the work, writes exactly one line, returns or rethrows.
export function atBoundary<T>(context: RequestContext, work: () => Promise<Ended<T>>): Promise<T>;

// S5: a step line, with `requestId` and `route` from the open context.
export function logStep<S extends Step>(fields: {
  step: S;
  outcome: (typeof STEP_OUTCOMES)[S][number];
  durationMs: number;
  level?: "info" | "warn"; // never "error" (orv141-step-lines); default "info"
  limit?: string;
}): void;

// S6: the `api/auth` status map (the spec's worked example), with `status` set.
export function endingOfStatus(status: number): Ending;
```

`packages/auth/src/index.ts` exports `atBoundary`, `logStep`, `requestIdOf`, `REQUEST_ID_HEADER` and the types `Ended`, `Ending`, `Reason`, `Route`. `writeLine` and `endingOfStatus` stay module exports for `log.test.ts` and `auth-route.ts` only.

**Test helper (part of S6).** `packages/auth/src/log-testing.ts`, exposed as `@orivilo/auth/log-testing` (a new `exports` entry in `packages/auth/package.json`, as `@orivilo/db/testing` is). `captureLines()` spies on `console.log`, `console.warn` and `console.error` and returns the lines written; `expectLineShape(line)` is the one shared check row 15 asks for: one string argument per call, no newline inside, `JSON.parse` succeeds, the five keys of `orv141-line-shape` with their types, no key outside `orv141-allow-list`, and the stream matches the level (`info` on `console.log`, `warn` on `console.warn`, `error` on `console.error`). Every test in §9 that captures a line runs it through `expectLineShape`.

### How `writeLine` closes a line

The line is built key by key from `orv141-allow-list` in this order: `level`, `requestId`, `route`, `durationMs`, `outcome`, `step`, `limit`, `reason`, `status`, `errorName`. Any other key is dropped. Then:

- `route`, `step`, `reason`: outside its list, `"unknown"` (spec). `errorName`: not matching `^[A-Z][A-Za-z]{0,39}$`, `"unknown"` (spec).
- `durationMs`: `Math.max(0, Math.round(x))` for a finite number, else `0`.
- `outcome`: with `step`, outside that step's list; without `step`, outside `BOUNDARY_OUTCOMES`: `"unknown"`. `requestId` not a UUID v4: `"unknown"`. `level` outside the three: `"error"`, so a bad level is never quieter. `limit` outside `LimitName` and `auth-http`: `"unknown"`. `status`: kept only when it is an integer from 100 to 599 and `route` is `api/auth`. The spec's `orv141-allow-list` names these fallbacks and points here for the values (finding F2).
- `info` goes to `console.log` (standard output); `warn` to `console.warn` and `error` to `console.error` (standard error).

### The request context

One `AsyncLocalStorage<RequestContext>`, kept on `globalThis` under `Symbol.for("orivilo.request-context")` so a module that Next bundles twice (one copy per server layer) still shares one store. `atBoundary` runs the work inside `store.run(context, work)`. `logStep` reads `store.getStore()`; outside a request (a script, a test without a boundary) it writes `requestId: "unknown"` and `route: "unknown"`, so a step line is never lost and never borrows another request's id.

`atBoundary` in full:

```ts
export async function atBoundary<T>(context: RequestContext, work: () => Promise<Ended<T>>) {
  const started = performance.now();
  const line = (ending: Ending) =>
    writeLine({ ...ending, ...context, durationMs: performance.now() - started });
  let ended: Ended<T>;
  try {
    ended = await store().run(context, work);
  } catch (error) {
    line({
      level: "error",
      outcome: "failed",
      reason: "unexpected",
      errorName: error instanceof Error ? error.name : "unknown",
    });
    throw error;
  }
  line(ended.ending);
  return ended.value;
}
```

`requestIdOf(headers)` returns `headers.get("x-request-id")` when it matches the UUID v4 pattern of the spec's first worked example, else `randomUUID()`. The fallback serves unit tests and any request without the proxy's header; it does not decide trust, the proxy and its matcher test do (§2).

## 4. The proxy (S7)

```ts
// apps/web/proxy.ts
export function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID(); // orv141-request-id
  const nonce = createNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId); // overwrites the client's value
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(CSP_HEADER, csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  response.headers.set(CSP_HEADER, csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

The header name is a literal here, not `REQUEST_ID_HEADER` from `@orivilo/auth`: importing the package index would pull Better Auth and the database client into the proxy bundle. The proxy test asserts the literal equals `REQUEST_ID_HEADER`.

## 5. Boundaries, entry by entry

Every entry in the spec's "The set this covers" calls `atBoundary` once with its `route` from `orv141-routes` and `requestIdOf` of its request headers. Its work returns `Ended<T>`, naming the ending in each branch; a throw is the boundary's `failed`, `unexpected`, `errorName` line and is rethrown. Files with `"use server"` export only async functions, so every helper below stays unexported.

### Directions (`apps/web/app/directions/actions.ts`, S10; C2, C3, C4)

- `run(route: Route, fn, limit?: LimitName): Promise<Outcome<T>>`. It reads `headers()` first (outside the old `try`), then `atBoundary({ requestId: requestIdOf(h), route }, work)`. Each action passes its route, for example `run("directions/saveDirection", ..., "write")`.
- Inside the work, today's branches stay in today's order and return today's outcomes; each now also names its ending:

<!-- prettier-ignore -->
| Branch | Outcome returned (unchanged) | Ending |
| --- | --- | --- |
| Limiter answers unavailable (C2 removed) | `failed`, or `ai-failed` for `ai-read` | `error`, `unavailable`, `reason: "rate-limit"` |
| Limiter answers limited | `RateLimited` | by `endingOf`: `warn`, `limited`, `reason` = its `error` |
| No session, `Denied`, `DirectionError` | `signed-out`, `forbidden`, the error's reason | by `endingOf`: `info`, `refused`, `reason` = its `error` |
| `MissingEnvError` | `not-configured` | by `endingOf`: `error`, `failed`, `reason: "not-configured"` |
| `AiFailed` (C4 removed) | `ai-failed` or `ai-not-configured` | `error`, `failed`, `reason` = the kind: `adapter-failed`, `invalid-output`, `evidence-mismatch`, or `ai-not-configured` |
| Any other throw (C3 removed) | `failed` | `error`, `failed`, `reason: "unexpected"`, `errorName` |
| Success | `{ ok: true, value }` | by `endingOf`: `info`, `ok` |

- `endingOf(outcome: Outcome<unknown>): Ending` is the spec's "action outcome map" worked example. Its `reason` is typed `Reason`, so an `ActionError` member missing from `REASONS` fails `pnpm typecheck`.
- `AiFailed` carries `kind: "adapter-failed" | "invalid-output" | "evidence-mismatch" | "ai-not-configured"`; its `reason` (the `ActionError`) is derived from the kind. `readBriefWithAi` throws `new AiFailed(outcome.error)` after the `invalid-brief` check and no longer logs; `outcome.detail` (OpenRouter's text) is not read (open question 4).
- Behaviour change: a throw from `headers()` itself, which happens only outside a request scope, now leaves the action instead of returning `failed`. No caller does that.

### Account (`apps/web/app/account/actions.ts`, S11; C5)

`signInWithGoogle` runs the count and `signInSocial` inside `atBoundary` (`route: "account/signInWithGoogle"`). Its work returns `{ state }` or `{ redirectTo: url }`; after the boundary returns, the action calls `redirect(redirectTo)` or returns `state`. So the line is written before Next's redirect error exists, and `ok` needs no Next internal type (D5). Endings: granted, `info`, `ok`; limited, `warn`, `limited`, `reason: "rate-limited"`; a count that answers unavailable, throws or rejects, `error`, `unavailable`, `reason: "rate-limit"` (row 9). The private `unavailable()` and its line (C5) go. A missing URL or a throw from `signInSocial` writes the `error`, `failed`, `unexpected`, `errorName` line and, since ORV-144, returns the `INTERNAL_ERROR` state (ORV-144 open question 9); before ORV-144 it was the boundary's `failed` line and was rethrown.

`signOut` runs `auth().api.signOut` inside `atBoundary` (`route: "account/signOut"`, ending `info`, `ok`), then calls `redirect("/account")`.

Behaviour change from ORV-123: a count that answers unavailable without throwing now writes the boundary line too (it wrote none before, ORV-123 open question 2). Every call writes one line under `orv141-boundary-line`.

### Locale (`apps/web/i18n/actions.ts`, S12)

`setLocale` reads `headers()` and runs inside `atBoundary` (`route: "i18n/setLocale"`). An invalid value returns ending `info`, `refused`, `reason: "invalid-input"` and sets no cookie; a valid one sets the cookie, calls `revalidatePath` and returns `info`, `ok`. The return type stays `Promise<void>`.

### The auth route (`packages/auth/src/auth-route.ts`, S13; C6)

- `authRoute(handler, options)` keeps its signature. Per request: `context = { requestId: requestIdOf(request.headers), route: "api/auth" }`, then `atBoundary(context, work)`.
- `envelope(status, code, message, requestId, extra)` takes the request's id instead of calling `randomUUID()`; the body's `requestId` and the `x-request-id` header carry it (row 12).
- Every response the work returns, the handler's included, goes through `withRequestId(response, requestId)`: a new `Response` with the same body, status, status text and a copy of the headers plus `x-request-id`. Copying avoids the immutable headers of `Response.redirect`; `new Headers(response.headers)` keeps each `Set-Cookie` value separate (a test checks two survive). Since ORV-144 only the handler's answers below 400 go through it; a handler answer of 400 or more, and each answer `authRoute` writes itself, is made by `errorResponse`, which sets the same `x-request-id` (ORV-144 `orv144-route-answers`).
- Endings: `endingOfStatus(response.status)` with `status`, and `reason: "rate-limit"` on the 503 that `authRoute` writes itself (a count that answers unavailable or `RateLimitUnavailable` from the handler). A 503 from Better Auth's own code carries no reason. Any other throw answers 500 `INTERNAL_ERROR` with the error body since ORV-144 (ORV-144 `orv144-route-answers`), and its line is `error`, `failed`, `unexpected`, `errorName`, `status: 500` (row 13); before ORV-144 it was the boundary's line, without `status`, and was rethrown.
- `unavailable()` no longer logs (C6).

## 6. Step lines (S8, S9, row 17)

- **C1, `apps/web/server/rate-limit.ts` (S8).** A new export `logRateLimit(r)` calls `logStep({ step: "rate-limit", limit: r.limit, outcome: r.outcome, durationMs: r.durationMs })` at `info`; `limiter()` passes it as `onResult`. The same writer serves Better Auth's counts, whose limit name is `auth-http` (finding F1).
- **C7, `packages/auth/src/client-ip.ts` (S9).** The signature is unchanged. The once-per-process warning becomes `logStep({ step: "client-ip", outcome: "no-trusted-ip", level: "warn", durationMs })`, with `durationMs` measured from the start of `clientIp`. The `warned` flag stays.
- **Row 17, ORV-121.** `ai-usage` and its two outcomes are in `STEP_OUTCOMES` from slice 1. If ORV-121 is on `develop` when slice 2 (ORV-142) starts, task B5 moves its two lines to `logStep({ step: "ai-usage", outcome: "record-failed" | "cost-not-reported", level: "warn", durationMs })`. If ORV-121 merges later, its builder does the same against the merged logger.

## 7. The lint rule (S14, `orv141-no-console`)

```js
// apps/web/eslint.config.mjs, one more config object
{
  files: ["app/**/*.{ts,tsx}", "server/**/*.{ts,tsx}", "i18n/**/*.{ts,tsx}", "proxy.ts"],
  ignores: ["**/*.test.ts", "**/*.test.tsx"],
  rules: { "no-console": "error" },
},

// packages/auth/eslint.config.mjs, one more config object after the current one
{
  files: ["src/**/*.ts"],
  ignores: ["src/**/*.test.ts", "src/log.ts"],
  rules: { "no-console": "error" },
},
```

ESLint's `no-console` reports any member access on the global `console`, so it catches all five forms the spec lists. `src/log.ts` is the one exception. `log-testing.ts` passes `console` as an argument to `vi.spyOn`, which the rule does not report. The rule lands in slice 2 (ORV-142), after the last `console` call in its paths moves (§11).

## 8. Changed signatures

<!-- prettier-ignore -->
| # | Where | Change | Callers affected |
| --- | --- | --- | --- |
| S1 | `packages/auth/src/log.ts` (new) | `ROUTES`, `BOUNDARY_OUTCOMES`, `STEP_OUTCOMES`, `REASONS`, `REQUEST_ID_HEADER` and the types `Route`, `Step`, `Reason`, `Level`, `Ending`, `Ended<T>`, `RequestContext` | none (new) |
| S2 | same | `writeLine(fields: Record<string, unknown>): void` | `atBoundary`, `logStep` |
| S3 | same | `requestIdOf(headers: Headers): string` | `run`, both account actions, `setLocale`, `authRoute` |
| S4 | same | `atBoundary<T>(context, work: () => Promise<Ended<T>>): Promise<T>` | the 10 actions (through `run` for directions), `authRoute` |
| S5 | same | `logStep(fields)` | `logRateLimit`, `clientIp`, ORV-121's two lines |
| S6 | same, `log-testing.ts` (new), `index.ts`, `package.json` | `endingOfStatus(status)`; `captureLines()`, `expectLineShape(line)`; index exports; `exports["./log-testing"]` | tests in `apps/web` and `packages/auth` |
| S7 | `apps/web/proxy.ts` | `proxy` sets `x-request-id` on the forwarded request and the response; `config.matcher` loses `missing` | none in code; `security-headers.test.ts` matcher case |
| S8 | `apps/web/server/rate-limit.ts` | new export `logRateLimit(r)`; `limiter()` uses it as `onResult` | none |
| S9 | `packages/auth/src/client-ip.ts` | body only: the warning through `logStep` | none |
| S10 | `apps/web/app/directions/actions.ts` | private `run(route, fn, limit?)`; private `endingOf`; `AiFailed(kind)`; exported actions unchanged | none outside the file |
| S11 | `apps/web/app/account/actions.ts` | exported actions unchanged; private `unavailable()` removed | none |
| S12 | `apps/web/i18n/actions.ts` | `setLocale` unchanged in type; now reads `headers()` | none |
| S13 | `packages/auth/src/auth-route.ts` | `authRoute` unchanged in type; every answer carries the request's id; `envelope` takes the id | the route file, unchanged |
| S14 | `apps/web/eslint.config.mjs`, `packages/auth/eslint.config.mjs` | `no-console: "error"` in the spec's paths | any later `console` call there |

No exported server action changes its type, and no outcome object gains a field (open question 5).

## 9. Tests by acceptance row

Every line a test captures goes through `expectLineShape` (row 15). "Seeded" values are the row's.

<!-- prettier-ignore -->
| Row | File | Test | What it asserts |
| --- | --- | --- | --- |
| 1 | `apps/web/proxy.test.ts` (new) | "makes the request id and never keeps the client's" | `POST /directions` with `next-action` and `x-request-id: client-chosen-id`: the response's `x-request-id` is a UUID v4, not `client-chosen-id`; `x-middleware-request-x-request-id` equals it and `x-middleware-override-headers` lists `x-request-id`; two calls give two ids; the literal equals `REQUEST_ID_HEADER` |
| 2, matcher | `apps/web/proxy.test.ts` | "runs for prefetches and skips only static files" | `unstable_doesMiddlewareMatch` is true for `/directions` (with `next-action`) and `/api/auth/get-session`, each with `next-router-prefetch: 1` and again with `purpose: prefetch`; false for `/_next/static/x.js`, `/_next/image` and `/favicon.ico`; `config.matcher` equals the one source (replaces the old case in `security-headers.test.ts`) |
| 2, proxy | `apps/web/proxy.test.ts` | "a prefetch gets a server-made id" | The same two requests with the prefetch headers and `client-chosen-id`: a UUID v4, not the client's |
| 2, directions boundary | `apps/web/app/directions/actions.test.ts` | "the line never carries the client's id" | `next/headers` mocked with `x-request-id: client-chosen-id`: the line's `requestId` is a UUID v4, not it; with a UUID v4 header, the line carries that value |
| 2, `api/auth` boundary | `packages/auth/src/auth-route.test.ts` | "never keeps the client's id" | A request with `client-chosen-id`: the answer's header, the body (on a 503) and the line carry one fresh UUID v4 |
| 3 | `actions.test.ts` | "a call writes one boundary line with the request's id" | Signed-in save succeeds; two lines: `rate-limit` step (`limit: "write"`, `outcome: "allowed"`) and the boundary line (`info`, `directions/saveDirection`, `ok`), same `requestId` and `route`; the outcome is today's |
| 4 | `actions.test.ts` | "a refusal is logged as refused with its reason" | `Denied(403)` from the service: one boundary line, `info`, `refused`, `forbidden` |
| 5 | `actions.test.ts` | "an AI failure is logged once at the boundary, without the brief or OpenRouter's text" | Fake `fetch` answers 401 with the seeded message, brief contains `ana@example.com`: exactly one `error` line, `failed`, `adapter-failed`; no captured line contains `ana@example.com`, `sk-or-v1-seeded` or `OpenRouter answered` |
| 6 | `actions.test.ts` | "an unexpected error is logged once by name only" | Service throws `new Error("ana@example.com tok_seeded")`: one line, `error`, `failed`, `unexpected`, `errorName: "Error"`; neither seeded value in any line |
| 7 | `actions.test.ts` | "a store failure is one error line" | Limiter unavailable: step line `info`, `unavailable`; boundary line `error`, `unavailable`, `rate-limit`; same `requestId`; no service call |
| 8 | `actions.test.ts` | "a limited call is logged as limited" | `ai-read` hour full: one boundary line `warn`, `limited`, `ai-rate-limited`; no `fetch` |
| 9 | `apps/web/app/account/actions.test.ts` | "a count that throws or rejects returns failed and logs once" (widened) | Both seeded throws: `{ error: "failed" }`, no `signInSocial`, one line `error`, `account/signInWithGoogle`, `unavailable`, `rate-limit`, with `requestId` and `durationMs`; no `secret detail`. The old "adds no line here" case becomes "a count that answers unavailable writes the same line" |
| 10 | `account/actions.test.ts` | "a redirect is logged as ok" | Granted sign-in, then sign-out: `redirect` mock called with the URL and with `/account`; one `info`, `ok` line each, routes `account/signInWithGoogle` and `account/signOut`; the line is written before `redirect` is called |
| 11 | `apps/web/i18n/actions.test.ts` (new) | "the locale action writes one line" | `locale=th`: cookie set once, one `info`, `ok` line; `locale=xx`: no cookie, one `info`, `refused`, `invalid-input` line; route `i18n/setLocale` |
| 12 | `packages/auth/src/auth-route.test.ts` | "a store failure answers 503 and logs once" (widened) | Request with a UUID v4 `x-request-id`, count unavailable: 503 `SERVICE_UNAVAILABLE`; body `requestId`, header and line `requestId` all equal that id; line `error`, `api/auth`, `unavailable`, `rate-limit`, `status: 503`; handler not called |
| 13 | `auth-route.test.ts` | "every answer carries the request id and one line" | Handler 200 with two `Set-Cookie`: header carries the id, both cookies survive, one `info`, `ok`, `status: 200` line; handler throws `new Error("ana@example.com")`: one `error`, `failed`, `unexpected`, `errorName: "Error"` line without the email; since ORV-144 the answer is 500 `INTERNAL_ERROR` with the error body and the line carries `status: 500` (before ORV-144 the line had no `status` and the error was rethrown) |
| 14 | `packages/auth/src/log.test.ts` (new) | "writes only allow-listed keys and closed values" | The row's input: only allow-listed keys, `reason: "unknown"`, neither seeded value; plus one case per closing rule in §3 (route, step, reason, errorName, outcome, requestId, level, limit, status, durationMs rounding with 237.5 to 238 and a negative to 0), and `logStep` outside a request writing `"unknown"` for `requestId` and `route` |
| 15 | every file above | `expectLineShape` on each captured line | One physical line, parses, five keys with their types, stream matches level |
| 16 | scratch run, recorded in the builder's report | one sample per form | A scratch file in `apps/web/app/` and one in `packages/auth/src/` with the five forms: `pnpm lint` fails once per form, naming the line; `packages/auth/src/log.ts` passes; the samples are deleted |
| 17 | the second of ORV-121 and ORV-141, `actions.test.ts` | one case per line | Each line is an `ai-usage` step with the request's id; `grep -n "console\." apps/web/app/directions/actions.ts` prints nothing |
| 18 | G5 packet | staging probe | (a) and (b) by the release role or main session, (c) `owner_verify` (open question 7). Also checks that `x-request-id` appears once on each answer, which proves Vercel joins the proxy's header the way the local server does (the sources at the top of these notes) |

Supporting tests, not rows: `apps/web/server/rate-limit.test.ts` (new) checks that `limiter()` passes `logRateLimit` as `onResult` (with `server-only`, `@orivilo/db/client` and `createRateLimiter` mocked); `packages/auth/src/client-ip.test.ts` line 51 expects the `client-ip` step line, still once per process. In `actions.test.ts` the limiter fake calls the real `logRateLimit` after each scripted answer (the mock of `../../server/rate-limit` spreads the real module, with `server-only` and `@orivilo/db/client` mocked), so rows 3 and 7 see the step line through the same writer `limiter()` uses.

Mutation check for the builder (`.claude/rules/testing.md`): one mutation per closing rule in §3 and per ending branch in §5, each seen red and restored.

## 10. Build order

One builder deliverable per task. Each task runs the affected tests, then the slice's last task runs the full gate.

<!-- prettier-ignore -->
| Task | Slice | Deliverable | Files | Tests (acceptance rows) | Needs |
| --- | --- | --- | --- | --- | --- |
| B1 | 1 | The logger module and its test helper (S1 to S6) | `packages/auth/src/log.ts`, `log.test.ts`, `log-testing.ts`, `index.ts`, `package.json` | 14, 15 (the helper itself) | none |
| B2 | 1 | The proxy makes the id; the matcher passes prefetches (S7) | `apps/web/proxy.ts`, `apps/web/proxy.test.ts`, `apps/web/security-headers.test.ts` (matcher case moved out) | 1, 2 (matcher and proxy paths) | B1 (`REQUEST_ID_HEADER` in the test) |
| B3 | 1 | `authRoute` on the request's id, one line per answer (S13, C6) | `packages/auth/src/auth-route.ts`, `auth-route.test.ts`, `auth.integration.test.ts` (lines 236 and 265 capture through `captureLines`; line 304 expects a UUID v4 header on a Better Auth answer) | 12, 13, 2 (`api/auth` boundary), 15 | B1 |
| B4 | 2 (ORV-142) | Step lines for the limiter and the client IP (S8, S9, C1, C7) | `apps/web/server/rate-limit.ts`, `apps/web/server/rate-limit.test.ts`, `packages/auth/src/client-ip.ts`, `client-ip.test.ts` | the step halves of 3 and 7 (asserted in B5), 15 | B1 |
| B5 | 2 (ORV-142) | The directions boundary (S10, C2 to C4) | `apps/web/app/directions/actions.ts`, `actions.test.ts` | 2 (directions boundary), 3 to 8, 15; 17 if ORV-121 is on `develop` | B1, B4 |
| B6 | 2 (ORV-142) | The account boundaries (S11, C5) | `apps/web/app/account/actions.ts`, `actions.test.ts` | 9, 10, 15 | B1, B4 |
| B7 | 2 (ORV-142) | The locale boundary (S12) | `apps/web/i18n/actions.ts`, `apps/web/i18n/actions.test.ts` | 11, 15 | B1 |
| B8 | 2 (ORV-142) | The lint rule (S14) | `apps/web/eslint.config.mjs`, `packages/auth/eslint.config.mjs` | 16 | B4 to B7 (no `console` call left in its paths) |
| R1 | after slice 2 (ORV-142) | Staging probe | none (G5 packet) | 18 | ORV-142 on staging |

Both PRs (ORV-141 and ORV-142) touch `apps/web/proxy.ts` or `packages/auth/**`, so the `security` role is dispatched on each (ADR 0015 decision 2).

## 11. Size and slices

Estimated changed lines with tests: B1 about 300, B2 about 70, B3 about 150 (slice 1 about 520); B4 about 60, B5 about 190, B6 about 100, B7 about 70, B8 about 15 (slice 2, ORV-142, about 435). Over 400 in total, so the story splits, as the spec's "Impact list" says. The spec's "Impact list" (Size) takes this split, for two reasons:

1. **`authRoute` must ship with the proxy.** Once the proxy sets `x-request-id` on `/api/auth` answers, the local server keeps the proxy's header and does not append the route's (send-response.js lines 49 to 50). `authRoute`'s own random id would then sit in the 429 and 503 bodies while a different id sits in the header. B3 makes them the same, so it goes in the proxy's PR.
2. **The lint rule cannot pass before the last `console` call moves.** C5 (account) is in slice 2, so row 16 is in slice 2 (both ORV-142).

Between the slices the server actions carry the header but still write today's lines; that state is on `develop` only and is not released alone unless the release batch says so. ORV-141 and ORV-142 are separate issues since comment 10262; whether ORV-141 reaches staging and G5 before ORV-142 is ORV-142 open question 2.

Slice 1: rows 1, 2 (matcher, proxy, `api/auth`), 12 to 15. Slice 2, ORV-142 (docs/specs/ORV-142/spec.md): rows 2 (directions boundary), 3 to 11, 15, 16, 17 as it falls, and row 18 after it.

## 12. Impact list

### Code

As the spec's "Impact list", plus: `apps/web/proxy.test.ts` (new), `apps/web/server/rate-limit.test.ts` (new), `packages/auth/src/log-testing.ts` (new), `packages/auth/package.json` (`exports`), `packages/auth/src/index.ts` (exports). `apps/web/app/api/auth/[...all]/route.ts` is unchanged.

### Tests that change

`apps/web/security-headers.test.ts` ("proxy matcher" case moves to `proxy.test.ts` and loses the prefetch skip); `apps/web/app/directions/actions.test.ts` (the global `console.error` spy becomes `captureLines`; the limiter fake calls `logRateLimit`); `apps/web/app/account/actions.test.ts` (row 9's exact keys; "a count that answers unavailable adds no line here" flips to one line); `packages/auth/src/auth-route.test.ts` (route `api/auth`, one line per answer, the request's id); `packages/auth/src/auth.integration.test.ts` (lines 236, 265, 304); `packages/auth/src/client-ip.test.ts` (line 51).

### Other documents whose log-line text this changes

These are outside this task's write set; each is edited by its owner role. The last column says which slice brings each one up to date: the rows marked Slice 1 were done in slice 1 (this PR) by the task named there, and the rows marked Slice 2 belong to slice 2 (ORV-142): done where a task is named, still to do where none is. "Today's text" is the text before ORV-141.

<!-- prettier-ignore -->
| File and line | Today's text (short) | After ORV-141 | Brought up to date in |
| --- | --- | --- | --- |
| `docs/specs/ORV-112/spec.md:113` | "A log line for a call holds the limit name, the outcome and its duration only." | A `rate-limit` step line with the request's `requestId` and `route`, `step`, `limit`, `outcome`, `durationMs` (ORV-141 `orv141-step-lines`) | Slice 2, ORV-142, task ORV-142-spec-1 |
| `docs/specs/ORV-112/spec.md:121` | "The client retry matrix and the request id helper (ORV-113); this story makes a random request id only for the 429 and 503 bodies." | The request id is made by the proxy (ORV-141); the 429 and 503 bodies carry the request's id | Slice 1, task ORV-141-spec-5 (line 60 too) |
| `docs/specs/ORV-112/tech.md:154` | `{"level":"warn","route":"rate-limit","outcome":"no-trusted-ip"}` | A `client-ip` step line, `level: "warn"`, `outcome: "no-trusted-ip"`, with the request's `requestId` and `route` | Slice 2, ORV-142, task ORV-142-tech-1 |
| `docs/specs/ORV-112/tech.md:356` | `logRateLimit` writes `{"level":"info","route":"rate-limit","limit","outcome","durationMs"}`; "`requestId` joins the line when ORV-113 adds it." | `logRateLimit` writes a `rate-limit` step line through `logStep`, with `requestId` and the entry's `route` (ORV-141) | Slice 2, ORV-142, task ORV-142-tech-1 |
| `docs/specs/ORV-112/tech.md:546` | "sets `x-request-id` on its 429 and 503 and logs one `{level, requestId, route, outcome}` line on a store failure" | Every answer carries the request's `x-request-id`; one boundary line per answer, route `api/auth` | Slice 1, task ORV-141-tech-3 (lines 340 and 341 too) |
| `docs/specs/ORV-122/spec.md:40` (row 20) | the line has "exactly the fields `level`, `requestId`, `route` (`"auth"`) and `outcome`" | The boundary line: `route: "api/auth"`, plus `durationMs`, `reason: "rate-limit"`, `status: 503` | Slice 1, ORV-122 spec v1.5 |
| `docs/specs/ORV-122/spec.md:52` | "`x-request-id` on every 429 and 503 it answers ... one JSON log line by name only on a store failure" | On every answer; one boundary line per answer | Slice 1, ORV-122 spec v1.5 |
| `docs/specs/ORV-122/spec.md:62` | "The log line is the only line `authRoute` writes, one per store failure ... A 429 is not logged" | One boundary line per answer; a 429 is `warn`, `limited` | Slice 1, ORV-122 spec v1.5 |
| `docs/specs/ORV-122/spec.md:63` | "`authRoute` makes one random id per answer ... Answers the Better Auth handler writes are unchanged" | `authRoute` uses the request's id from the proxy; Better Auth's answers carry it too | Slice 1, ORV-122 spec v1.5 |
| `docs/specs/ORV-122/spec.md:77` | "`x-request-id`, the store failure log line" | the request's `x-request-id` on every answer, one boundary line per answer | Slice 1, ORV-122 spec v1.5 |
| `docs/specs/ORV-123/spec.md:44` (`orv123-log-line`) | exactly `level`, `route` (`"account/sign-in"`), `outcome`; "A count that answers `unavailable` without throwing adds no line here" | The boundary line: `route: "account/signInWithGoogle"`, with `requestId`, `durationMs`, `reason: "rate-limit"`; an answered `unavailable` writes it too | Slice 2, ORV-142, task ORV-142-spec-1 |
| `docs/specs/ORV-123/spec.md:54` | "A request id for server actions and their log lines (ORV-113)." | Done by ORV-141 and ORV-142 | Slice 2, ORV-142, task ORV-142-spec-1 |
| `docs/specs/ORV-123/spec.md:63` | "`console.error` is called once per press; the line parses as JSON with exactly the keys and values of `orv123-log-line`" | One boundary line per press with the keys of ORV-142 row 9 (review finding R3-S1) | Slice 2, ORV-142, task ORV-142-spec-1 |
| `docs/specs/ORV-123/spec.md:114` (open question 1) | "(a): `orv123-log-line` has no `requestId`; ORV-113 adds request ids to server actions" | The line carries the request's `requestId` (ORV-141) | Slice 2, ORV-142, task ORV-142-spec-1 (open question 2 too) |
| `docs/adr/0015-standards-and-required-controls.md:93` | "Today `readBriefWithAi` logs with `console.error` and a plain string, without a request id. That is the known gap." | Gap closed by ORV-141 and ORV-142, except Next's and Better Auth's own lines (ORV-141 open question 6) | Slice 2, ORV-142, task ORV-142-tech-1 (a dated addition after line 95; line 93 stays as history) |
| `docs/adr/0015-standards-and-required-controls.md:95` | "Confirmation: not confirmed yet; follow-up: ORV-113 ..." | Confirmed by ORV-141's tests for rows 1, 14 and 15 and ORV-142's row 18 probe | Slice 2, ORV-142, task ORV-142-tech-1 (the same addition; line 95 stays as history; the row 18 probe is still to run) |
| `docs/adr/0015-standards-and-required-controls.md:186` | "Observability, error envelope, ... named here, no code and no check (decisions 6 to 12, ORV-113)." | Observability has code and tests (ORV-141 and ORV-142); the rest stays with ORV-113 | Slice 2, ORV-142, task ORV-142-tech-1 (now lines 188 and 189) |

`.claude/rules/security.md` rule 15 and `docs/specs/ORV-108/spec.md:127` state the requirement this story meets; their text stays.

## 13. Is an ADR needed?

No. No new package, dependency, runtime or service. ADR 0015 decision 6 already decides the control; this story implements it. The logger's place (D2) is a module inside an existing server-only package (ADR 0002), and the matcher change (D1) touches no decided ADR: no ADR records the prefetch skip, which came from Next's CSP guide. ADR 0015 is decided, so its lines 93, 95 and 186 (§12) are not rewritten by this task; how they are updated (a status edit of those three lines, or a short superseding note) is left to the main session.

## Findings for the spec

<!-- prettier-ignore -->
| # | Where in the spec | Finding | This design assumes | Status |
| --- | --- | --- | --- | --- |
| F1 | `orv141-allow-list`, `limit` | Better Auth's counts go through the same `onResult` with the limit name `auth-http` (`packages/auth/src/rate-limit.ts`, `betterAuthStorage`), which is not a `LimitName`. The spec does not say what a `limit` outside `LimitName` becomes | `limit` is closed to `LimitName` plus `auth-http`; anything else is `"unknown"`. The spec adds `auth-http` to the allow-list | Resolved in spec v1.1 |
| F2 | `orv141-allow-list` | It names the fallback only for `route`, `step`, `reason` and `errorName` | §3 adds fallbacks for `outcome`, `requestId`, `level`, `limit`, `status` and `durationMs`; row 14's test covers each | Resolved in spec v1.1 |
| F3 | Open question 1, option (a) | "only skips the CSP work" cannot be built for `next-router-prefetch`, which Next hides from the proxy | The proxy does the CSP work for prefetches too (§2) | Resolved in spec v1.1 (open question 1 decided (a)) |
| F4 | "Impact list", Size | The suggested split puts `authRoute` after the proxy and row 16 before C5 moves | The split in §11 | Resolved in spec v1.1 |
