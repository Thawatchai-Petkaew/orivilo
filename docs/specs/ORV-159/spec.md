---
issue: ORV-159 (https://tpetkaew.atlassian.net/browse/ORV-159)
parent: ORV-113 (item 5)
lane: L
version: 1.2
---

# ORV-159: a workspace the caller cannot see answers 404, not 403 (ORV-113 item 5)

## Why

ADR 0015 decision 10 (lines 147 to 153) and `.claude/rules/security.md` rule 9 say a read or write of a resource outside the caller's workspace answers 404 with the same body as a resource that does not exist, so the answer does not show that it exists; 403 is only for a resource the caller can see but may not change. ADR 0015 "Not chosen" (line 211) rejects 403 for non-members because "It tells a caller that a resource exists in another workspace".

Two places break the rule at `develop` `eeb2e71`:

1. **The helper.** `withWorkspace` in `packages/auth/src/access.ts` throws `Denied(403, "not-a-member")` (line 59) when the caller has no member row in the asked workspace. `Denied.status` is typed `401 | 403` (line 9). `apps/web/app/directions/actions.ts` line 211 turns every non-401 `Denied` into the outcome `forbidden` with code `FORBIDDEN`. ADR 0015 line 151 calls this "the one known gap".
2. **Better Auth's own organization routes**, which line 151 does not name. K-0092 (confidence 0.8, read from the installed `better-auth` 1.7.12, not run) records that `/organization/get-organization` and `/organization/get-full-organization` answer a signed-in caller `400 ORGANIZATION_NOT_FOUND` for a missing organization and `403 USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION` for one the caller is not in, by id and by slug, and that `set-active`, `list-members` and `get-active-member-role` do the same by slug. `packages/auth/src/config.ts` line 43 mounts `organizationPlugin()` with no options, and `apps/web/app/api/auth/[...all]/route.ts` serves every `/api/auth` path through `authRoute`, which keeps the status (`packages/auth/src/auth-route.ts` lines 43 to 44). By K-0092 section 4 the pair reaches the caller as 400 `BAD_REQUEST` against 403 `FORBIDDEN`: a signed-in person can tell an existing workspace id from a missing one.

ORV-159 is item 5 of ORV-113 as its own story, as ORV-141 (item 1), ORV-144 (item 2) and ORV-158 (item 4) are. Jira ORV-159 quotes the item as: "withWorkspace answers 404 not found instead of 403 for a workspace the caller cannot see". ORV-113 has one comment (10180, a CSP carry-over) and no owner decision on item 5.

**Frame.** A server-side access control, not a hook that judges a tool call's text, so it is neither a guard rail nor a boundary in the L-0012 sense. What enforces it is server code the caller cannot change: the helper's member lookup, the row security of `inWorkspace` (`packages/db/src/client.ts` line 32), and Better Auth's router, which answers a disabled path before any route runs (K-0092 section 5).

**What is real.** Real code and tests. Two limits, stated so no gate packet overclaims:

- The helper's 404 is dormant in the app today. Every caller passes the session's `activeOrganizationId` (`actions.ts` line 207, `apps/web/app/account/page.tsx` line 29), never a client value, so `not-a-member` happens only when a membership is removed during a live session. The change fixes the helper's contract for a later route that takes a workspace id from a request.
- The Better Auth difference is live today, by K-0092's reading of the code. No one has run it yet; row 15's test is the first run that observes it.

Nothing here claims conformance to ASVS or any other standard (ADR 0015 decision 13).

## Story

As a person signed in to ORIVILO, when I ask for a workspace I am not in, I want the same answer as for a workspace that does not exist, and a line in my language that says what to do next; as the person who runs ORIVILO, I want no route, ours or Better Auth's, to tell a caller that another workspace exists, so that workspace ids cannot be probed.

## Lane

**L**, for the auth or data access flag: the story changes an auth answer and the `Denied` contract of the central authorization helper. ADR 0015 line 198 ("that story is L lane") and ORV-144 spec line 238 fix the lane. No other flag applies: no profile or token schema, no semantic token contract, no component public API, no resolver logic, no asset licensing. Jira ORV-159 carries the labels `lane-L` and `security`. The `security` role is dispatched on each code PR, as the diff touches `packages/auth/**` (ADR 0015 decision 2).

**Docs.** Tech notes are needed because a contract changes (`Denied.status`, the server action outcome, `createAuth`'s options); `architect` writes `docs/specs/ORV-159/tech.md` (POC mode, ORV-137). No `design.md`: the only person-facing change is one catalog line in the existing failure notice of `/directions`, no new component, state or layout; the reviewer walks `DESIGN.md` section 11 at G3 for slice 3.

**Gates.** G1 and G2 pass under the owner's delegation (ADR 0012 decision 4) on the defaults of "Open questions".

## Acceptance criteria

"Operator" is the developer or agent who reads an outcome, a log line or a test. `<id>` is the request's id (ORV-141 `orv141-request-id`). Each row's mutation is the one change to the code that must turn its test red (`.claude/rules/testing.md`, one mutation per clause, L-0042); the builder records each red run as one `verified` row. A rule name in a row points to its one definition under "Rules and bounds".

<!-- prettier-ignore -->
| # | Given | When | Who sees what | Data effect | Test (mutation) |
| --- | --- | --- | --- | --- | --- |
| 1 | `withWorkspace` with no session | It is called for `ws-a` | Operator: rejects with `Denied`, `status: 401`, `reason: "no-session"`; `fn` not called (`orv159-denied`) | No query | `packages/auth/src/access.test.ts`, "denies without a session, with 401, and runs nothing" (today's, line 13). Mutation: line 52 throws 403 |
| 2 | A session, workspace id `undefined`, `null` or `""` | It is called | Operator: `Denied`, `status: 403`, `reason: "no-workspace"`; `fn` not called | No query | `access.test.ts`, "denies a missing workspace id (%s) with 403" (today's, line 27). Mutation: line 53 throws 404 |
| 3 | Chai signed in; Dao's workspace exists and Chai has no member row in it | `withWorkspace` is called for Dao's workspace id, `minRole` `"member"` | Operator: `Denied`, `status: 404`, `reason: "not-a-member"`, message `access denied: not-a-member`; `fn` not called | One select on `member`, nothing else | `packages/auth/src/auth.integration.test.ts` AC 4, line 119 changes from 403 to 404; new `access.test.ts` case with a stub database whose member select resolves to `[]`, "denies a workspace the caller is not in with 404". Mutation: line 59 throws 403 |
| 4 | Chai signed in; the id `9f1c2d3e-0000-4000-8000-000000000000` belongs to no workspace | `withWorkspace` is called for that id | Operator: a `Denied` equal to row 3's in `status`, `reason` and `message` (`orv159-same-answer`) | One select on `member`, nothing else | New `auth.integration.test.ts` case, "a missing workspace id is denied like a foreign one"; the `access.test.ts` stub case of row 3 runs both ids. Mutation: the helper first selects `organization` and throws `Denied(403, "no-workspace")` when no row is found |
| 5 | Eak is a `member` of his workspace | `withWorkspace` is called with `minRole` `"admin"` | Operator: `Denied`, `status: 403`, `reason: "role-too-low"` | One select on `member` | `auth.integration.test.ts`, "denies a role below the one asked for" (today's, line 128). Mutation: line 60 throws 404 |
| 6 | The type of `Denied["status"]` | `pnpm typecheck` runs | Operator: passes only while the status union is exactly `401`, `403` and `404` (`orv159-denied`, the status clause) | None | New `access.test.ts` case, `expectTypeOf<Denied["status"]>().toEqualTypeOf<401 \| 403 \| 404>()` (`packages/auth/tsconfig.json` includes `src`, so test files are type-checked). Mutation: the union gains `500`, or loses `404` |
| 7 | The type of `Denied["reason"]` | `pnpm typecheck` runs | Operator: passes only while the reason union is exactly `no-session`, `no-workspace`, `not-a-member` and `role-too-low` (`orv159-denied`, the reason clause) | None | New `access.test.ts` case, `expectTypeOf<Denied["reason"]>()` against the four literals. Mutation: the union gains `"not-found"` |
| 8 | A signed-in person on `/directions`, Thai or English UI; the service throws `Denied(404, "not-a-member")` | They press "Save draft" / "บันทึกฉบับร่าง" | Person: a danger notice, badge "Not done" / "ทำไม่สำเร็จ", line English "This workspace was not found in your account. Sign in again on the Account page to open a workspace you belong to." / Thai "ไม่พบเวิร์กสเปซนี้ในบัญชีของคุณ ลงชื่อเข้าใช้อีกครั้งที่หน้าบัญชีเพื่อเปิดเวิร์กสเปซที่คุณเป็นสมาชิก", no reference line. Operator: the outcome is `{ ok: false, error: "workspace-not-found", code: "NOT_FOUND", requestId: <id>, retryable: false }`; one boundary line `{ level: "info", outcome: "refused", reason: "workspace-not-found" }` (`orv159-boundary`, `orv159-copy`) | None | `apps/web/app/directions/actions.test.ts` lines 300 and 394 arrange `Denied(404, "not-a-member")` and expect this outcome and line; `apps/web/app/directions/studio-calls.test.ts`, new "a workspace-not-found failure shows its line and no reference"; `apps/web/i18n/wait.test.ts` lines 72 to 78 gain `NOT_FOUND` among the codes with no reference line. Mutation: `run` maps status 404 to `forbidden` |
| 9 | The service throws `Denied(403, "no-workspace")`, then `Denied(403, "role-too-low")` | A person saves | Person: today's line, English "This account is not allowed to do this in this workspace." / Thai "บัญชีนี้ไม่มีสิทธิ์ทำสิ่งนี้ในเวิร์กสเปซนี้". Operator: `error: "forbidden"`, `code: "FORBIDDEN"`, `retryable: false` for both | None | `actions.test.ts`, "each reason maps to its code": its table goes from 17 to 18 cases (line 500) with the `workspace-not-found` case and keeps the `role-too-low` case (line 426); a new case beside it, "a workspace id the session lacks stays forbidden", arranges `Denied(403, "no-workspace")`. Mutation: `run` maps a 403 `Denied` to `workspace-not-found` |
| 10 | The service throws `Denied(401, "no-session")` | A person saves | Operator: `error: "signed-out"`, `code: "UNAUTHENTICATED"` as today | None | `actions.test.ts`, today's case at line 515. Mutation: `run` maps 401 to `workspace-not-found` |
| 11 | `listDirections` returns the outcome of row 8 while `/directions` renders | The page loads, Thai or English | Person: the Studio with the danger notice of row 8 and no reference line | None | New `apps/web/app/directions/page.test.tsx`, which renders `DirectionsPage` with `listDirections` mocked (tech notes T3), "the first notice from the page names a missing workspace". Mutation: `directions/page.tsx` treats `workspace-not-found` as `signed-out` |
| 12 | Fon signed in; Eak's direction id, then the direction id `00000000-0000-4000-8000-000000000000`, which no direction has | `service.read` in Fon's own workspace for each | Operator: both reject with `reason: "not-found"`; through the boundary both give `{ ok: false, error: "not-found", code: "NOT_FOUND", requestId: <id>, retryable: false }` (ADR 0015 line 153's pair) | No row read from Eak's workspace | `packages/auth/src/directions.integration.test.ts` AC 8 (lines 167 to 186) gains the missing id read; `actions.test.ts` today's `not-found` case (line 469). Mutation (tech notes T4): `packages/db/migrations/0003_directions_access.sql` lines 12 and 16, the `USING` clauses of `direction` and `direction_version`, both become `USING (true)`, in the throwaway test database only; AC 8 goes red at the clause, Fon's read of Eak's version id. Two more runs are made and recorded as red: line 16 alone, red only at the last AC 8 assertion, because `service.read` inner-joins `direction` (`packages/auth/src/directions.ts` line 183), whose policy still holds; and the earlier mutation, `withWorkspace` runs `fn` on `deps.db` instead of inside `inWorkspace`, red at setup (Eak's `saveDraft` fails the `WITH CHECK` of lines 12 to 13) |
| 13 | Chai signed in; then Chai's member row is deleted by the admin database handle, and his session still holds that workspace as active | `service.list(c.headers, c.workspaceId)`; then `service.list(f.headers, e.workspaceId)` for another person's workspace | Operator: both reject with `status: 404`, `reason: "not-a-member"` | The session row is unchanged | `directions.integration.test.ts` line 180 changes from `{ status: 403 }` to `{ status: 404, reason: "not-a-member" }`, plus the new removed-member case. Mutation: the helper trusts the session's `activeOrganizationId` and skips the member select |
| 14 | A signed-in person whose `withWorkspace` call on `/account` throws `Denied(404, "not-a-member")`, then `Denied(403, "no-workspace")` | `/account` renders, Thai or English | Person: today's signed-out view: heading "Account and workspace" / "บัญชีและเวิร์กสเปซ", line "Sign in with your Google account; the first time, your own workspace is created for you." / "ลงชื่อเข้าใช้ด้วยบัญชี Google แล้วระบบจะสร้างเวิร์กสเปซของคุณเองให้ในครั้งแรก", button "Sign in with Google" / "ลงชื่อเข้าใช้ด้วย Google" (`orv159-account`) | None | `apps/web/app/account/page.test.tsx`, new "a denied workspace shows the sign-in view" with both throws. Mutation: `page.tsx` line 46 rethrows a `Denied` |
| 15 | Chai signed in through the app's route (`authRoute` around the Better Auth handler) | `GET /api/auth/organization/get-full-organization` with `organizationId` = Dao's workspace id, then the id of row 4, then `organizationSlug` = Dao's slug | Operator: each answers 404 with body `{"error":{"code":"NOT_FOUND","message":"Not found.","requestId":<id>,"retryable":false}}` and `x-request-id` equal to `requestId`; the three bodies are equal once `requestId` is removed (`orv159-auth-paths`) | Chai's session keeps its `activeOrganizationId` (today the route clears it before its 403, K-0092 section 6) | New `auth.integration.test.ts` case, "organization paths answer like a missing path". Mutation: drop `/organization/get-full-organization` from `disabledPaths` (then 403 against 400) |
| 16 | `createAuth` with test settings | Its organization paths are listed from the instance (`auth.api` endpoints whose `path` starts with `/organization/`) | Operator: the instance's `options.disabledPaths` equals that list, 22 paths at `better-auth` 1.7.12 (`orv159-auth-paths`, the selection method) | None | New `auth.integration.test.ts` case, "every organization path the plugin serves is disabled". Mutation: remove `/organization/check-slug` from the list |
| 17 | The staging deployment after slice 4 | `POST /api/auth/organization/set-active` with a JSON body and no session; then, signed in, `GET /api/auth/organization/get-full-organization?organizationId=<own workspace id>` | Operator: both 404 with the `NOT_FOUND` body of row 15 | None | Staging probe, the G4 walk (open question 3); the commands and the answers in the G4 packet |
| 18 | The paths the app does use: `getSession`, `signInSocial`, `signOut` through `auth().api`, and Google sign-in through `/api/auth` | The existing tests run | Operator: they pass unchanged | As today | `auth.integration.test.ts`, `auth-route.test.ts`, `apps/web/app/account/actions.test.ts`, unchanged. Mutation: the list of row 16 gains `/get-session` |
| 19 | ADR 0015 after slice 4 | It is read | Operator: a dated Addition after decision 10's Confirmation (line 153) and one under "Not done yet" (line 190) say what `orv159-adr` gives; lines 151 and 153 keep their text | None | `grep -n '^Addition, ' docs/adr/0015-standards-and-required-controls.md` shows the new lines; `git diff` of the ADR removes no line |
| 20 | The new key of `orv159-copy` in `apps/web/i18n/messages.ts` | `pnpm test` and `pnpm typecheck` run | Operator: both pass: the Thai and English trees have the same key paths and no middot or em dash | None | `apps/web/i18n/messages.test.ts` (today's); `pnpm typecheck` |

## Rules and bounds

- **orv159-denied.** `withWorkspace` keeps its four checks in today's order: session, workspace id, member row, role. Only the member row check changes its status, to 404 (row 3). `Denied` carries the status a route returns; its status union and its reason union are closed (rows 6 and 7). The reason `not-a-member` keeps its name, so the server log and the tests still say which check refused. The class comment (line 7) names the three statuses. The helper still reads only the `member` table before it decides, so it cannot and does not tell a foreign workspace from a missing one (row 4). No migration: the lookup and the table it reads do not change.
- **orv159-boundary.** In `run` (`apps/web/app/directions/actions.ts`), a `Denied` maps by its status alone: 401 to `signed-out`, 404 to `workspace-not-found`, 403 to `forbidden` (rows 8 to 10). `workspace-not-found` joins `ActionError` (15 members to 16), `CODE_OF` with the code `NOT_FOUND` from `orv144-codes` (no new code), and `REASONS` in `packages/auth/src/log.ts` (20 members to 21, the list `packages/auth/src/log.test.ts` line 68 pins). The boundary line's `reason` is the outcome's `error`, as `endingOf` does today. `retry.ts` needs no change: ADR 0015 decision 7 puts 403 and 404 in one no-retry row (line 120).
- **orv159-copy.** One new catalog key, `saved.errors.workspace-not-found`, in the Thai and English trees of `apps/web/i18n/messages.ts`; its two strings are the ones row 8 quotes. It is shown where `saved.errors.*` lines are shown today (the failure notice of `/directions`), with no reference line (`orv144-ui` gives one only for `INTERNAL_ERROR`). No other copy changes. The line says "the Account page" because `/account` offers the sign-in form for this case (`orv159-account`), and a new sign-in starts the session in the person's earliest workspace (`packages/auth/src/config.ts` lines 74 to 84).
- **orv159-same-answer.** "The same body" of ADR 0015 decision 10 means, per caller kind: for the helper, the same `Denied` (`status`, `reason`, `message`) for a workspace the caller is not in and a workspace id that does not exist (rows 3, 4); for a server action, the same outcome for those two, which differ only in `requestId` (row 8); for a route handler, the `NOT_FOUND` body of `orv144-envelope`, which carries no `error` key, so a foreign and a missing resource are equal once `requestId` is removed (row 15). A direction in another workspace and a direction id that does not exist both answer `not-found` through row security (row 12). The outcome key `workspace-not-found` differs from a missing direction's `not-found`: it says which level was not found, never whether a workspace exists (open question 5).
- **orv159-account.** `/account` keeps mapping a `Denied`, of any status, to its signed-out view (row 14). That view's sign-in form is the way back to a workspace the person belongs to.
- **orv159-auth-paths.** `createAuth` (`packages/auth/src/config.ts`) passes Better Auth the top-level option `disabledPaths` (K-0092 section 5). Selection method: every path under `/organization/` that the plugin serves with the app's options; no code in the app calls one (`grep -rn 'auth().api\.\|organization/' apps/web --include='*.ts' --include='*.tsx' --exclude-dir=.next --exclude-dir=node_modules` finds only `getSession`, `signInSocial` and `signOut` calls). At `better-auth` 1.7.12 that is these 22 paths, by file of `better-auth/dist/plugins/organization/` (open question 2):

  <!-- prettier-ignore -->
  | File | Paths under `/organization/` | Shows existence today (K-0092 section 3) |
  | --- | --- | --- |
  | `routes/crud-org.mjs` (8) | `create`, `check-slug`, `update`, `delete`, `get-organization`, `get-full-organization`, `set-active`, `list` | `get-organization`, `get-full-organization` (id and slug), `set-active` (slug), `check-slug` (slug) |
  | `routes/crud-members.mjs` (6) | `remove-member`, `update-member-role`, `get-active-member`, `leave`, `list-members`, `get-active-member-role` | `list-members`, `get-active-member-role` (slug), `update-member-role` (member id) |
  | `routes/crud-invites.mjs` (7) | `invite-member`, `accept-invitation`, `reject-invitation`, `cancel-invitation`, `get-invitation`, `list-invitations`, `list-user-invitations` | `cancel-invitation`, `accept-invitation`, `reject-invitation`, `get-invitation` (invitation id) |
  | `organization.mjs` (1) | `has-permission` | Not read by K-0092 |

  The team routes (`routes/crud-team.mjs`, 9 paths) and the role routes (`routes/crud-access-control.mjs`, 5 paths) are not served without `teams.enabled` and `dynamicAccessControl.enabled` (K-0092 section 1) and are not listed. A disabled path answers 404 with the body `Not Found` before the route, its session check and its database reads run; `authRoute` rewrites it to the `NOT_FOUND` body, as it does for a path with no route (K-0092 sections 4 and 5). Row 16 lists the paths from the instance, so a Better Auth upgrade that adds an organization path fails the test until the list takes it. A later story that needs one of these paths removes it from the list in its own PR, with its own answers for a missing and a foreign id. By K-0092's reading, `disabledPaths` does not block a server-side `auth.api.*` call (not run).

- **orv159-adr.** ADR 0015 is not rewritten (AGENTS.md). Two dated Additions, written in slice 4 by `architect` after the code merges: after line 153, that `not-a-member` answers 404, confirmed by the tests of rows 3, 4, 12, 13 and 15, and that the confirmation sits in `access.test.ts` with a stub database and in the two integration test files, since `access.test.ts` has no database to hold a direction; and that Better Auth's organization routes were a second gap line 151 did not name, closed by `orv159-auth-paths` (K-0092). Under "Not done yet", line 190 gets a dated line that the gap is closed, or names what stays open by the decided defaults. `.claude/rules/security.md` rule 9 keeps its text.
- **Slices.** In this order, each its own PR under about 400 changed lines with tests (estimates rounded to tens, worked example "The size"):
  1. Docs: K-0092 (done, task ORV-159-research-2), this spec, `tech.md` (`architect`). Reviewer approve, no qa.
  2. `packages/auth` helper (rows 1 to 7, 12, 13): `access.ts`, `access.test.ts`, the two integration test files; about 100 lines. Safe alone: `run` still maps any non-401 `Denied` to `forbidden`, so no person sees a change until slice 3. Evidence for rows 3, 4, 12 and 13 is the CI run id, since the integration tests skip without `TEST_DATABASE_URL`.
  3. `apps/web` boundary and copy (rows 8 to 11, 14, 20): `actions.ts`, `log.ts`, `log.test.ts`, `messages.ts`, and the tests rows 8 to 11 and 14 name; about 140 lines. Needs slice 2.
  4. Better Auth paths and bookkeeping (rows 15 to 19): `config.ts`, the `auth.integration.test.ts` cases, the ADR Additions and the docs of "Impact list"; about 180 lines. Independent of slices 2 and 3; the G4 walk follows the staging batch.

## Worked examples

Each line is copied from its source and was not run in this task (no shell); the main session runs them.

- **Reason to status to outcome** (`orv159-denied`, `orv159-boundary`; rows 1 to 10). Input: the four throws of `packages/auth/src/access.ts` lines 52 to 60 with 404 for `not-a-member`, and the map of `orv159-boundary` with `CODE_OF` lines 139 and 140 of `actions.ts`. No rounding.

  ```bash
  node -e 'const DENIED={"no-session":401,"no-workspace":403,"not-a-member":404,"role-too-low":403};const error=s=>s===401?"signed-out":s===404?"workspace-not-found":"forbidden";const CODE={"signed-out":"UNAUTHENTICATED",forbidden:"FORBIDDEN","workspace-not-found":"NOT_FOUND"};for (const [r,s] of Object.entries(DENIED)) console.log(r,s,error(s),CODE[error(s)])'
  # expected:
  # no-session 401 signed-out UNAUTHENTICATED
  # no-workspace 403 forbidden FORBIDDEN
  # not-a-member 404 workspace-not-found NOT_FOUND
  # role-too-low 403 forbidden FORBIDDEN
  ```

- **A foreign and a missing workspace give one answer** (`orv159-same-answer`; rows 3, 4). Input: a model of the helper's checks in `access.ts` lines 51 to 60, the message form of line 12, two member rows like the integration test's, and row 4's id. No rounding.

  ```bash
  node -e 'const members=[{userId:"u-chai",organizationId:"ws-chai",role:"owner"},{userId:"u-dao",organizationId:"ws-dao",role:"owner"}];const ROLES=["member","admin","owner"];const deny=(status,reason)=>({status,reason,message:"access denied: "+reason});const access=(user,ws,min)=>{if(!user)return deny(401,"no-session");if(!ws)return deny(403,"no-workspace");const row=members.find(m=>m.userId===user&&m.organizationId===ws);if(!row)return deny(404,"not-a-member");if(ROLES.indexOf(row.role)<ROLES.indexOf(min))return deny(403,"role-too-low");return "ok"};const a=JSON.stringify(access("u-chai","ws-dao","member"));const b=JSON.stringify(access("u-chai","9f1c2d3e-0000-4000-8000-000000000000","member"));console.log(a);console.log(a===b)'
  # expected:
  # {"status":404,"reason":"not-a-member","message":"access denied: not-a-member"}
  # true
  ```

- **The counts that change** (`orv159-boundary`; row 9). Input: the 15 `ActionError` members of ORV-144 spec line 118, the 20 members of `REASONS` (`packages/auth/src/log.ts` lines 44 to 63) and the 17 cases of `actions.test.ts` line 500 (the 15 members and the two unavailable paths). Each gains one. No rounding.

  ```bash
  node -e 'const ACTION=["signed-out","forbidden","not-configured","failed","ai-failed","ai-not-configured","rate-limited","ai-rate-limited","invalid-input","invalid-file","not-found","no-draft","resolver-changed","profile-missing","fingerprint-mismatch"];const REASONS=20,CASES=ACTION.length+2;console.log(ACTION.length,CASES,ACTION.length+1,REASONS+1,CASES+1)'
  # expected: 15 17 16 21 18
  ```

- **The disabled set** (`orv159-auth-paths`; row 16). Input: the `createAuthEndpoint("/organization/...")` paths of the three served route files and `organization.mjs` line 23 in the installed `better-auth` 1.7.12, and the "shows existence" column of the table, from K-0092 section 3. No rounding.

  ```bash
  node -e 'const ORG=["create","check-slug","update","delete","get-organization","get-full-organization","set-active","list"];const MEMBERS=["remove-member","update-member-role","get-active-member","leave","list-members","get-active-member-role"];const INVITES=["invite-member","accept-invitation","reject-invitation","cancel-invitation","get-invitation","list-invitations","list-user-invitations"];const PLUGIN=["has-permission"];const served=[...ORG,...MEMBERS,...INVITES,...PLUGIN];const SHOWS=["get-organization","get-full-organization","set-active","check-slug","list-members","get-active-member-role","update-member-role","cancel-invitation","accept-invitation","reject-invitation","get-invitation"];console.log(ORG.length,MEMBERS.length,INVITES.length,PLUGIN.length,served.length,SHOWS.length,SHOWS.every(p=>served.includes(p)))'
  # expected: 8 6 7 1 22 11 true
  ```

- **The path match** (`orv159-auth-paths`; rows 15 to 17). Input: a model of K-0092 section 5 (the pathname, the auth base path removed, trailing slashes removed, exact match; method and query play no part), not the library's code. No rounding.

  ```bash
  node -e 'const DISABLED=["/organization/get-full-organization","/organization/set-active"];const norm=(url,base)=>{let p=new URL(url).pathname;if(p.startsWith(base))p=p.slice(base.length);return p.replace(/\/+$/,"")||"/"};for (const u of ["https://orivilo.test/api/auth/organization/get-full-organization?organizationId=x","https://orivilo.test/api/auth/organization/set-active/","https://orivilo.test/api/auth/get-session"]) console.log(DISABLED.includes(norm(u,"/api/auth"))?404:"route runs")'
  # expected:
  # 404
  # 404
  # route runs
  ```

- **The size** ("Rules and bounds", Slices). Input: the three code slice estimates, each already rounded to tens. The sum adds no rounding.

  ```bash
  node -e 'const S={helper:100,boundary:140,authPaths:180};console.log(Object.values(S).reduce((a,b)=>a+b,0))'
  # expected: 420
  ```

## Out of scope

- A route handler in `apps/web` that takes a workspace id from a request, and exporting `errorResponse` for it: ORV-144 tech notes line 104 already decide that the first such route handler adds it to the index in its own PR (open question 8).
- A workspace switcher, invitations or any organization UI. The paths of `orv159-auth-paths` come back one by one with the story that needs them.
- `no-workspace` answers (open question 7) and the role answers: unchanged.
- A link or button in the `/directions` notice; a `not-found.tsx` page.
- Better Auth's own error codes in a body: `authRoute` already drops them (ORV-144 `orv144-route-answers`).
- Rate limits, log line fields other than the new reason, and other ORV-113 items.

## Impact list

- **Contract changes.** `Denied` in `packages/auth/src/access.ts` (status union, class comment, the `not-a-member` throw); the server action outcome of `apps/web/app/directions/actions.ts` (`ActionError`, `CODE_OF`, `run`); `REASONS` in `packages/auth/src/log.ts`; `createAuth`'s options in `packages/auth/src/config.ts`; one catalog key in `apps/web/i18n/messages.ts`. `packages/auth/src/index.ts` is unchanged. No migration.
- **ORV-144 error envelope codes.** No code joins `orv144-codes`: `NOT_FOUND` (404, `retryable: false`, "Not found.") exists at `packages/auth/src/errors.ts` line 14. The `orv144-outcome` map gains the row `workspace-not-found` to `NOT_FOUND`, and its member count goes from 15 to 16.
- **Existing tests that change.** `auth.integration.test.ts` line 119; `directions.integration.test.ts` line 180 and AC 8; `actions.test.ts` lines 300, 394, 408 and 500; `log.test.ts` line 68; `wait.test.ts` lines 72 to 78. New cases in `access.test.ts`, `auth.integration.test.ts`, `studio-calls.test.ts` and `account/page.test.tsx`; a new file, `apps/web/app/directions/page.test.tsx` (row 11).
- **ADR 0015**, by `orv159-adr`: dated Additions after line 153 and at line 190; lines 151, 153, 190, 198 and 211 keep their text.
- **Docs that state today's 403 for a non-member**, to bring up to date in slice 4 (one bookkeeping pass before the merge): `docs/specs/ORV-38/spec.md` lines 46 ("401 or 403") and 56 (AC 4, "Denied (403)"); `docs/specs/ORV-144/spec.md` row 6 (line 79) and the count "15 members" (lines 80 and 118); `docs/specs/ORV-144/tech.md` test rows 6 and 7 (lines 379 and 380); `docs/specs/ORV-141/tech.md` test row 4 (line 309); `docs/specs/ORV-142/spec.md` row 4 (line 42). `docs/specs/ORV-35/spec.md` line 46 is `role-too-low` and stays.
- **`security` role** on each code PR (`packages/auth/**`).

## Open questions

Each has a default; under the owner's delegation (ADR 0012 decision 4) G2 passes on the defaults. Questions 1 to 3 are the research report's three `needs_decision` lines (task ORV-159-research-2).

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | Does ORV-159 cover Better Auth's own organization routes, served through `apps/web/app/api/auth/[...all]/route.ts`, and how? | (a) `disabledPaths` in `createAuth`; (b) a wrapper in `authRoute` that rewrites a 400 or 403 answer under `/api/auth/organization/` to 404 `NOT_FOUND`; (c) an accepted gap, written as a dated ADR 0015 Addition | (a) answers before the route runs, so nothing is read and the caller's active workspace is not cleared; (b) still runs the route and its side effects, and also turns real 400 input errors into 404; (c) leaves the 400 against 403 difference live (K-0092 section 4) | (a), `orv159-auth-paths` |
| 2 | Are `check-slug`, the invitation routes and the existence answers of `update-member-role` in scope, and which paths go in the list? | (a) the 5 paths that show an organization's existence (`get-organization`, `get-full-organization`, `set-active`, `list-members`, `get-active-member-role`); (b) the 11 paths that show any existence (adds `check-slug`, `update-member-role`, `cancel-invitation`, `accept-invitation`, `reject-invitation`, `get-invitation`); (c) the 22 paths the plugin serves | The app calls none of the 22. (a) and (b) leave paths K-0092 did not read (`has-permission`, `list-user-invitations`, `create`) serving, and keep paths no flow uses; (c) is one deny-by-default list that row 16 keeps in step with the library | (c), in scope |
| 3 | Can the staging walk rely on an admin removing another member, which leaves the removed person's sessions unchanged (K-0092 section 6)? | (a) yes: two accounts, an invitation to make the membership, the admin's `remove-member`, then the removed person saves; (b) no staging walk of `not-a-member`: CI proves rows 3, 4, 12 and 13, and the G4 walk is row 17 | The removal path does reach `not-a-member` by K-0092's reading, but setting it up needs a second membership, which over HTTP only the invitation paths make, and question 2's default disables them, with `remove-member` | (b) |
| 4 | Where does the 404 live? | (a) in the helper: `Denied(404, "not-a-member")`; (b) only in each boundary's map, `Denied` stays `401 \| 403` | (b) makes each present and later boundary repeat the map, and `Denied.status` no longer is "what a route returns" (line 7) | (a), `orv159-denied` |
| 5 | What is "the same body" for a server action outcome? | (a) a new key `workspace-not-found` with code `NOT_FOUND` and its own line; (b) reuse `not-found` and its line | (b) is equal byte for byte to a missing direction's outcome but tells a person on page load "This direction was not found in your workspace." when no direction was asked for; (a) differs from it only in `error`, which says which level was not found, and a foreign and a missing workspace still give one outcome | (a), `orv159-same-answer`, `orv159-copy` |
| 6 | What does `/account` show for a 404 `Denied`? | (a) today's signed-out view, with a test; (b) a new view and copy for "no workspace" | (b) is new UI and copy for a case that today arises only after a removal; (a) keeps the sign-in form, which is the way back | (a), `orv159-account` |
| 7 | Does `no-workspace` also answer 404? | (a) no, it stays 403, as ADR 0015 line 151 names only `not-a-member`; (b) yes | With `orv159-auth-paths`, `no-workspace` arises only for a session whose person has no membership; no other workspace's existence is involved | (a) |
| 8 | Is `errorResponse` exported from `@orivilo/auth` now? | (a) no, ORV-144 tech notes line 104; (b) yes | No route handler outside `authRoute` exists to use it | (a) |
| 9 | One PR or three? | (a) slices 2, 3 and 4 as three PRs in order; (b) one PR | About 420 lines with tests in all (worked example "The size"); each slice is under 400 and slice 2 ships safely alone | (a) |

## Depends on

ADR 0015 decision 10 (the rule), decisions 2 (`security` role), 6 (one log line per error), 7 (the body and the matrix) and 13 (no conformance claim); ADR 0002 (the central authorization helper); ADR 0012 decision 4 (G1 and G2 under delegation); `.claude/rules/security.md` rules 2, 9, 14 and 15; K-0092 (Better Auth 1.7.12 organization answers, `disabledPaths`, the removal path); ORV-144 spec (`orv144-codes`, `orv144-outcome`, `orv144-route-answers`, `orv144-ui`) and tech notes line 104; ORV-141 and ORV-142 (the request id and the boundary line); ORV-38 (the helper and AC 4); ORV-137 (POC mode); ORV-113 (parent; item 5 is this story).

## Changelog

- v1.0 (2026-10-30): first spec, ORV-113 item 5 as its own story (task ORV-159-spec-1). Downstream to review: the ORV-159 Jira acceptance (rows 1 to 20), the tech notes (to be written by `architect`: the stub database of row 3, the instance listing of row 16, the slice sizes), ADR 0015 (`orv159-adr`, after the merge) and the docs under "Impact list".
- v1.1 (2026-10-30): rows 11 and 12 and the "Impact list" tests line follow tech notes decisions T3 and T4 (task ORV-159-spec-2): row 11's test is a new `apps/web/app/directions/page.test.tsx`, and row 12's mutation is the `direction_version` `USING (true)` of `0003_directions_access.sql` line 16, with the earlier mutation kept as red at setup. G1 and G2 passed on the defaults of "Open questions" under the owner's delegation, ORV-159 comment 10292. Downstream to review: `tech.md` front matter (`spec ... v1.0`) and its T3 and T4 `needs_decision` notes, the ORV-159 Jira acceptance rows 11 and 12, and the builder envelopes of slices 2 and 3.
- v1.2 (2026-10-30): row 12's mutation becomes the two-policy mutation, `0003_directions_access.sql` lines 12 and 16 both `USING (true)`, red at the clause; the line 16 alone run and the `deps.db` run stay as recorded extra runs (task ORV-169-spec-1, from review finding S1 of task ORV-159-review-1, as `docs/specs/ORV-167/spec.md` "Notes on the rows" records). No other row changes; no requirement is added. Downstream to review: tech notes T4 and section 5 row 12 (changed in the same task), the ORV-159 Jira acceptance row 12, `docs/specs/ORV-167/spec.md` row 12 (a copy of the v1.1 text, kept as QA recorded it), and "Slices" items 2 and 3, which do not yet name ORV-167 and ORV-169.
