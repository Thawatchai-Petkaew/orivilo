---
issue: ORV-266 (https://tpetkaew.atlassian.net/browse/ORV-266)
spec: docs/specs/ORV-266/spec.md v1.0
parent: docs/specs/ORV-128/spec.md, "Reading a page the person submits"
adr: docs/adr/0019-page-renderer-placement.md, decision 7
task: ORV-266-arch-1
author: architect
date: 2026-11-07
---

# ORV-266 tech notes: read one URL on a deployed page, with no browser

A signed-in person gives one URL on a page of the deployed app. The server reads that page with the engine's safe read, runs the URL analyser with no renderer (ADR 0019 option D), and shows the report once on the same page. Nothing is saved. No model is called. Acceptance rows are the spec's; these notes hold the design and the tests.

**What is real.** The read and the analysis are real and rule-based. The report never shows colour areas, contrast, density or text visibility, and lists them as not measured. Pages that build their content with JavaScript will probably give thin reports, because only the fetched bytes are read (inference, not measured). No test reaches the internet (ADR 0009 point 8): the port tests talk to a server on loopback that the test itself starts, and a real page is read only in the live check of section 10.

**What was probed.** Every Node behaviour marked "probed" below was run in this task on Node 22.23.0, with scripts outside the repo, against a loopback server. The time and memory of a read on Vercel are not measured anywhere yet.

## 1. Decisions in short

<!-- prettier-ignore -->
| # | Question | Choice | Why not the other way | Confirmed by |
| --- | --- | --- | --- | --- |
| D1 | Where the Node `ReadPorts` live | `apps/web/server/read-ports.ts`, with `import "server-only"`. No new package | ADR 0019 chose a package because the command must run without Next.js. The command is not in this story, so the app folder can hold the file. The path is already under `.claude/rules/security.md` | `read-ports.test.ts`; `security` on PR 1 |
| D2 | How the socket stays on the checked address | `node:http` and `node:https` with a `lookup` that always answers the address `readPage` checked, and `agent: false`. No new dependency | Global `fetch` takes no `lookup`; pinning it needs an `undici` dispatcher, a new runtime dependency with its own review, while the built-ins do the job | Section 3, tests P1 and P9 |
| D3 | Redirects | The port never follows one. It hands the 3xx to the engine, whose `walk` runs every check again on each hop | A client that follows redirects itself would skip the Address check and robots.txt on the hop | Test P3 |
| D4 | Time | `export const maxDuration = 60` in `apps/web/app/read/page.tsx`. The read stops itself at 30 s | Section 4 | `page.test.tsx`; live check |
| D5 | Action shape | One server action, `analysePage(input: unknown)`, in `apps/web/app/read/actions.ts`, called from a client form the way `readBriefWithAi` is. It returns `Outcome<ReportView>` | A route handler would need its own error body and session code for no gain | `read/actions.test.ts` |
| D6 | What crosses to the browser | A bounded `ReportView`, never the whole `Report` | `Report` allows 5,000 items, and K-0081 records a 4.5 MB response bound. Section 7 | `report-view.test.ts` |
| D7 | Rate limit and logs | New limit `page-read`, new route `read/analysePage`, new step `page-read` | Reusing `import` would mix two counts and hide which one a person hit | `limits.test.ts`, `log.test.ts` |
| D8 | How `report.ts` lands | `git cherry-pick -x 8845abe` onto the ORV-266 branch, then add the missing builder `reportOf` | Merging the branch would bring docs that say no deployed route exists | `report.test.ts` |

## 2. The path of one request

1. `apps/web/app/read/page.tsx` (server) reads the session and shows the form, or the sign-in prompt.
2. The form calls `analysePage({ url, role })`. The action checks the session again, counts the limit, then parses the input.
3. `createReadPorts()` makes new ports, and `readUrlInput({ url, role }, ports)` runs the competitor gate and `readPage`. `readPage` stays unexported from the engine, so this is the only way in.
4. `reportOf(...)` turns the read into a `Report` with `snapshot` null and `notRendered: "no-renderer"`.
5. `toReportView(report, locale)` cuts it down, and the action returns it. The bytes, the `Report` and the page text end with the call.

No workspace data is read or written, so no `withWorkspace` call is needed. Session and rate limit are the only access checks (`.claude/rules/security.md` rules 1 and 6).

## 3. Read ports: `apps/web/server/read-ports.ts`

`createReadPorts(deps?)` returns `ReadPorts`. It imports only `node:*`, the `ReadPorts` type and `server-only`, so the later move to `packages/page-reader` is a file move. `deps` holds one test seam, the DNS lookup.

- **`resolve(host, budgetMs)`:** `dns.promises.lookup(host, { all: true, order: "ipv4first" })` raced against a `budgetMs` timer. `addressOf` checks every address and connects to the first, so the order picks the family. IPv4 first, because no entry records whether a Vercel function has an IPv6 route, and IPv4 first is right either way (probed: `order` works on this Node). A host with IPv6 only may then fail, and the report shows the `network` line.
- **`request(r)`:** `http.request` or `https.request` by the URL's scheme, with the URL passed whole, so Node handles brackets on an IPv6 literal.
  - **The pin.** `lookup` ignores the host name and answers `r.address`. It must answer both call forms: Node calls it with `all: true` (probed), and a plain `(null, address, family)` answer then fails with `ERR_INVALID_IP_ADDRESS` (probed). A URL with an IP literal never calls `lookup`, and the engine has checked that literal.
  - **`agent: false`:** a new socket for each request, so a pooled socket made for another address can never answer. It also keeps one socket per read at a time, against the 1,024 file descriptors an instance shares (K-0081).
  - **TLS.** `rejectUnauthorized` is never set. The host name, not the pinned address, stays the name for SNI and the certificate (probed: SNI was `example.test`, a certificate for another name failed with `ERR_TLS_CERT_ALTNAME_INVALID`, and an untrusted one with `DEPTH_ZERO_SELF_SIGNED_CERT`).
  - **`remoteAddress`:** read from `res.socket.remoteAddress` when the response starts. Missing means `{ ok: false, error: "network" }`. The engine then runs `checkAddress` on it.
  - **Timeout.** One wall clock timer of `timeoutMs` over connect, TLS, headers and body, which destroys the request and answers `timeout`. The `timeout` option alone is not enough: it is an idle timer, and it did not fire in 1 s at a 200 ms setting on a body that dripped a byte every 50 ms (probed).
  - **Size.** Stop and destroy on the first byte past `maxBytes`. The body is the first `maxBytes` bytes with `truncated: true`; an answer of exactly `maxBytes` is whole.
  - **Encoding.** Sends `accept-encoding: identity`. An answer with any other `content-encoding` is destroyed and answers `network`: the engine cannot read compressed bytes, and no inflate step means no decompression bomb. On robots.txt this fails closed, as a complete disallow.
  - **Headers.** Lower-case keys, an array value joined by a comma and a space.
  - **Errors.** Every `error` event is `{ ok: false, error: "network" }`, its text dropped.
- **`sha256`:** `createHash("sha256")`, lowercase hex.
- **`elapsedMs`:** `performance.now()` minus the moment `createReadPorts` ran. So ports are made once per analysis and never held in module scope, or the 30 s would run from the cold start.

**Redirects, in full.** `http.request` follows nothing (probed: a 302 came back as a 302 with its `location`). `walk` then takes at most 3 redirects, and each hop runs the URL check, a new lookup with every address checked, the robots.txt gate, a request on its own pinned socket, and the check of the address connected to. A second DNS answer can change nothing: the only address the socket can reach is the one that was checked.

## 4. Time and memory against the function limit

K-0081 records 300 s default and maximum on Hobby and an 800 s maximum on Pro, stated for fluid compute. This project's plan and fluid setting are not checked, so section 10 reads them.

<!-- prettier-ignore -->
| Step | Bound | Source |
| --- | --- | --- |
| Session and limit | A limiter call is at most 2 s (`timeoutMs`); the session read has no bound of its own | `rate-limit.ts` |
| Read, all hops and sheets, one at a time | 30 s; each request at most `min(10 s, what is left)` | `TOTAL_BUDGET_MS`, `REQUEST_TIMEOUT_MS` |
| Analysis, report and view, one CPU block | Not measured on 1 vCPU. One worst case parse took 561 to 712 ms on an arm64 laptop | ORV-128 tech notes §6 |

So `maxDuration` is 60: the 30 s read plus 30 s for everything else, many times the laptop figure and far inside K-0081's limit. The real figure on 1 vCPU comes from the live check. It goes in `page.tsx`, because the docs of the installed Next.js say to set it at the page level for Server Actions (`next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md`, line 18). So the action must be called only from this page. If the setting did not reach the action, K-0081's 300 s default still covers a read. A function stopped by the platform writes no boundary line, and the form treats a rejected call as `failed`.

**Memory (ORV-128 finding F30).** A parse at the Element count needs about 0.5 GB and sampled up to about 822 MB (ORV-128 tech notes §6). A function has 2 GB (K-0081), so one worst case read fits. Fluid compute shares an instance between calls (K-0081), so two worst case reads at once are tight: for the `security` review. The read holds at most 2 MB plus 10 x 1 MB of bytes.

## 5. The server action: `apps/web/app/read/actions.ts`

`"use server"`, one exported async function, `analysePage(input: unknown): Promise<Outcome<ReportView>>`, reusing the `Outcome` type from `directions/actions.ts` by type import only. A small private `run` follows the order of the one in `directions/actions.ts`, inside one `atBoundary`:

1. `auth().api.getSession`.
2. The limit: `page-read` by session user, or `signed-out` by trusted IP when there is no session. Every call counts, whatever its result. A store failure fails closed with `SERVICE_UNAVAILABLE`.
3. No session answers `signed-out`. No port has been called.
4. zod at the boundary: `z.strictObject({ url: z.string().min(1).max(URL_MAX_CHARS), role: z.enum(INPUT_ROLES) })`, a failure being `invalid-input`. Which roles the form offers is the spec's. The URL is passed as typed; `allowedUrl` refuses one with no scheme.
5. Ports, `readUrlInput`, `reportOf`, `toReportView`, and the `page-read` step line.

`directions/actions.ts` keeps its `run` private and unchanged: this story does not refactor it. A refused, failed or not-read read is a **successful call**: the outcome is `ok: true` with a view that says so, because the report is the answer. `reportOf` returning `ok: false` is the outcome `failed`.

**Untrusted data.** Page text and URLs are data only. They render as React text nodes, inside `bdi`, with no `dangerouslySetInnerHTML` and no link on a URL or quote from the page. No page text reaches a prompt, because no model is called. The URL, the host, the page body and the person's data never reach a log line; `writeLine` drops them by its allow-list, and test A5 proves it.

## 6. Limit, route and step entries in `packages/auth`

- `LIMITS` in `rate-limit.ts`: `"page-read"` with `{ seconds: 86_400, max: 50, offsetSeconds: BANGKOK_OFFSET_SECONDS }` and `{ seconds: 3_600, max: 10 }`, the numbers of `ai-read`. One call can make dozens of outbound requests and hold a function for 30 s, and the windows nest under `assertNested`.
- `ROUTES` in `log.ts`: `"read/analysePage"`.
- `STEP_OUTCOMES` in `log.ts`: `"page-read": ["read", "not-read", "refused-address", "refused-robots", "timeout", "network", "redirects", "not-html"]`, written with `logStep`, so the first live reads can be told apart with no URL in a log.

`REASONS` gains nothing: `signed-out`, `rate-limited`, `invalid-input`, `failed`, `not-configured` and `unexpected` are there.

## 7. How `report.ts` lands, and the view

**The cherry-pick.** `8845abe` is code only, five files: `report.ts`, `report.test.ts`, `evidence-strings.ts` (the four `read.failed.*` strings), `evidence.test.ts`, `index.ts`. `git merge-tree` shows it applies to develop at e7c4b6d with no conflict. Leave `790317f` behind: it holds the ORV-128 spec edits and `docs/specs/ORV-135/spec.md`, which say no deployed route exists. When ORV-135 resumes, its rebase drops the same commit.

**`reportOf`, added to `report.ts`.** The branch has the schema and no builder.

```ts
export function reportOf(
  given: string, // the URL as the person gave it
  outcome: ReadResult | NotRead,
  snapshot: unknown | null,
  ctx: AnalyserContext,
):
  | { ok: true; report: Report }
  | { ok: false; error: "id-collision" | "competitor-not-read" | "report-invalid" };
```

It follows rule `report-outcome-1`, minus the exit codes, which are the command's. `not-read` gives the `not-read` member. `refused` and `failed` give the `refused` member, after the rule's two steps on `url` (userinfo dropped, then cut). `read` calls `analyseUrl` and gives `analysed`: `personality` from the `identity-frame.personality.<axis>` readings that are not `belowFloor`, in axis order, and `lines: ["report.conflictsNotChecked"]`. It ends with `reportSchema.safeParse`. `analyseUrl` has no cap at 5,000 items (2,880 sheet items, plus blocks and readings, by reading the code), so a crafted page can give `report-invalid`, and test R3 builds that page. That is a failed call, never a throw. Pure, like the rest of the engine: `ctx.retrievedAt` comes from the action.

The rule's home is `docs/specs/ORV-135/spec.md`, which exists only on `origin/feature/ORV-135-page-reader`. The ORV-266 spec must carry it or the builder has no source on develop.

**`toReportView`, in `apps/web/app/read/report-view.ts`.** The `Report` can pass K-0081's 4.5 MB: at most 5,000 items, each holding a URL of up to 2,048 characters. The view holds, for `analysed`: the URL; the rule-based label; distinct declared colours by hex with count and hue band, at most 64; distinct font families with count, at most 16; the text span and word totals; per axis at most 6 leans with quote, confidence and evidence id; the not-measured lines; whether the page was incomplete; and the total behind each cut list. Text spans carry no page text, so quotes are the only page words shown (`Kept only as evidence`, ORV-128 spec). The `not-read` and `refused` views are their members with the line resolved. All text is resolved on the server in the person's locale, so a client file imports no engine value. The caps are ours and the spec may change them; test V1 holds the whole view under 256 KB.

## 8. Impact list

- `packages/intent-engine`: `report.ts`, `report.test.ts`, `evidence-strings.ts`, `evidence.test.ts`, `index.ts`. A new public export and the `reportOf` contract.
- `packages/auth`: `rate-limit.ts`, `limits.test.ts`, `log.ts`, `log.test.ts`.
- `apps/web`: `server/read-ports.ts`; `app/read/` (`page.tsx`, `ReadForm.tsx`, `actions.ts`, `report-view.ts` and tests); `i18n/messages.ts`.
- No new runtime dependency, table, migration, env var, token, recipe or shared component. The form and report compose catalog components; if the design needs a new shared one, that is its own story.
- `packages/page-reader`: not created here. `docs/adr/0019-page-renderer-placement.md`: decision 7.

## 9. Build tasks, in order

Lint, typecheck and test in every `done_when`. Every task names its tests; each test has a "break it" in the last column.

<!-- prettier-ignore -->
| Task | PR | Files | Delivers | Tests |
| --- | --- | --- | --- | --- |
| B1 | 1 | The five files of `8845abe`; `report.ts`, `report.test.ts` | Cherry-pick, then `reportOf` | R1 to R3 |
| B2 | 1 | `apps/web/server/read-ports.ts`, `read-ports.test.ts` | Section 3 | P1 to P9 |
| B3 | 2 | `packages/auth/src/rate-limit.ts`, `limits.test.ts`, `log.ts`, `log.test.ts` | Section 6 | Pins of the new numbers and names |
| B4 | 2 | `apps/web/app/read/actions.ts`, `report-view.ts` and their tests | Sections 5 and 7 | A1 to A5, V1, V2 |
| B5 | 2 | `apps/web/app/read/page.tsx`, `ReadForm.tsx`, `page.test.tsx`, `i18n/messages.ts` | Form, report page, Thai and English, `maxDuration` | G1 to G4; `messages.test.ts`; `check-i18n` |

PR 1 adds no route, so nothing new is reachable. `security` reviews both PRs: PR 1 matches `.claude/rules/security.md` by path, and PR 2's `packages/auth` diff does too. `app/read/actions.ts` does not match `apps/web/**/actions/**`, so the PR 2 envelope names that file for the review.

<!-- prettier-ignore -->
| Test | Asserts | Break it |
| --- | --- | --- |
| R1 | `reportOf` gives each member for each read outcome, and each parses with `reportSchema` | Change a `line` key |
| R2 | `http://user:secret@example.test/` refused: `user:secret` appears nowhere in the report | Skip step 1 |
| R3 | Over 5,000 items gives `report-invalid` and no throw; a below-floor reading is not a lean | Use `reportSchema.parse` |
| P1 | A URL on `does-not-exist.invalid` with `address: "127.0.0.1"` reaches the loopback server, and `remoteAddress` is that address | Remove `lookup`: `ENOTFOUND` |
| P2 | `lookup` answers both call forms | Answer only the plain form |
| P3 | A 302 comes back as an answer and the server counts one request | Follow `location` |
| P4 | A body dripping past `timeoutMs` answers `timeout` inside a CI-sized bound | Use only the `timeout` option |
| P5 | Exactly `maxBytes` is whole; one byte more is `truncated`, with `maxBytes` bytes | Stop at `>=` |
| P6 | `content-encoding: gzip` answers `network` | Pass the bytes through |
| P7 | Two `createReadPorts` calls made apart each start `elapsedMs` near 0 | Hoist the clock to module scope |
| P8 | `resolve` keeps IPv4 first with a fake lookup, and rejects at `budgetMs` on one that never answers | Drop the race |
| P9 | The options of an https request hold `agent: false` and no `rejectUnauthorized`; through `readUrlInput`, with a test wrapper that moves the socket to loopback, the real `remoteAddress` gives `read.refused.address` | Hard-code the `remoteAddress` the port returns |
| A1 | Signed out: `signed-out`, and no port is called | Move the session check after the read |
| A2 | Over the limit: `rate-limited` with `retryAfter`; store down: `SERVICE_UNAVAILABLE`; no port is called either way | Pass on `unavailable` |
| A3 | `role: "competitor"`: a `not-read` view and zero port calls | Call `readPage` |
| A4 | Refused and failed reads are `ok: true` views; `report-invalid` is `failed`; extra keys are `invalid-input` | Throw on refusal |
| A5 | All log lines of a call hold no URL, host, quote or body text, and one `page-read` step line is written | Add the URL to the step |
| V1 | A worst case `Report` (5,000 items, longest URLs, Thai quotes) gives a view under 256 KB, with the totals right | Remove a cap |
| V2 | An `analysed` view always holds the rule-based label and all four not-measured lines | Drop the label |
| G1 | `maxDuration` is 60 and `dynamic` is `force-dynamic` | Delete the export |
| G2 | Signed out, the page shows the sign-in prompt and no form | Render the form always |
| G3 | A quote holding `<script>` renders as text, and a URL renders with no anchor | Link the URL |
| G4 | While pending the submit control is disabled; a rejected action shows the failed message and enables it again | Drop the catch |

## 10. Live check at G4, after the release PR

The release PR carries develop to main (ADR 0016); develop never deploys. Then, on staging, with results recorded in ADR 0019 as an addition:

1. Google sign-in works. It is unverified on staging.
2. One real https page gives a report; the boundary line gives `durationMs`.
3. `http://169.254.169.254/` gives the refused report at once.
4. Read and record the Vercel plan, the fluid compute setting and the Node line. `apps/web` has no `engines`, so the root's `>=22.23.0 <23` may not reach the project, and K-0081 names 24.x as the default. On anything but 22.x, run the `word-count-1` line there, as the ORV-128 spec's open question "The Node line" asks. Ids do not change; only word counts and the `few-words` factor can.

## 11. For the `security` review

- **Who can reach it.** Better Auth creates an account for any Google sign-in, so any Google account can read pages, at 10 per hour each. There is no cap across people. The read names itself by its user agent and obeys robots.txt.
- **Two worst case parses on one shared instance** (section 4).
- **Address use.** A person can point the reader at any public address; the Address check, the pin and the 30 s are the whole fence. No URL or host is logged, so abuse shows only as a count per person in `rate_limit_counter`.
