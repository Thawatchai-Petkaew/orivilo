---
issue: ORV-159 (https://tpetkaew.atlassian.net/browse/ORV-159)
spec: docs/specs/ORV-159/spec.md v1.0
task: ORV-159-tech-1
author: architect
date: 2026-10-30
---

# ORV-159 tech notes: 404 for a workspace the caller cannot see

POC mode (ORV-137), short. These notes turn the spec's "Rules and bounds" (`orv159-denied`, `orv159-boundary`, `orv159-copy`, `orv159-same-answer`, `orv159-account`, `orv159-auth-paths`, `orv159-adr`) into exact edits, one test and one mutation per clause, and a build order. Row numbers are the spec's "Acceptance criteria" rows. File and line numbers are at `develop` `eeb2e71`; section 5 says what moves if PR 141 (ORV-121) merges first.

Sources read: the spec; K-0092; ADR 0015 decisions 7 and 10; `.claude/rules/security.md` rules 2, 9, 14, 15; `.claude/rules/testing.md`; at `eeb2e71`: `packages/auth/src/access.ts`, `access.test.ts`, `auth.integration.test.ts`, `directions.integration.test.ts`, `directions.ts`, `config.ts`, `auth-route.ts`, `errors.ts`, `log.ts`, `log.test.ts`, `index.ts`; `packages/db/src/client.ts`, `migrations/0001_access.sql`, `migrations/0003_directions_access.sql`; `apps/web/app/directions/actions.ts`, `actions.test.ts`, `page.tsx`, `SavedStudio.test.tsx`, `studio-calls.test.ts`; `apps/web/app/account/page.tsx`, `page.test.tsx`; `apps/web/i18n/messages.ts`, `wait.ts`, `wait.test.ts`; the installed `better-auth` 1.7.12 (`dist/auth/base.mjs` returns `options` and `api`; `dist/api/index.mjs` line 33 reads each endpoint's `path`; the organization route files list 22 served paths, 14 team and role paths unserved); and the ORV-121 worktree at `fadc57f` for PR 141's edits. No external fact is new: every Better Auth behaviour used here is in K-0092, and rows 15 and 16 are its first run.

## 1. Decisions in these notes

Each is a choice the spec leaves to the tech notes, or a place where a spec row's test cannot see its own mutation.

- **T1. A closed map from status to outcome.** `run` maps a `Denied` through `ERROR_OF_DENIED`, typed `satisfies Record<Denied["status"], Failed["error"]>`, so a status added to `Denied` without a mapping fails `pnpm typecheck`. Same pattern as `CODE_OF` (`actions.ts` lines 133 to 152).
- **T2. A literal path list.** `ORGANIZATION_PATHS` in `config.ts` is a literal `as const` list, not computed from the plugin. Row 16 compares it with the instance's served paths, so a Better Auth upgrade that adds a path fails the test (`orv159-auth-paths`, last paragraph). A computed list would make row 16 true by construction.
- **T3. Row 11 needs a page test.** The spec's row 11 test sits in `SavedStudio.test.tsx`, which renders `SavedStudio` with a `view` it builds itself; its mutation is in `directions/page.tsx` `load()` (lines 15 to 21), which that test never runs. Row 11's test goes into a new `apps/web/app/directions/page.test.tsx` that renders `DirectionsPage` with `listDirections` mocked, on the pattern of `apps/web/app/account/page.test.tsx`. It covers the render too, so `SavedStudio.test.tsx` gains no case. Spec row 11 and "Impact list" line 164 name the old file (`needs_decision`).
- **T4. Row 12's mutation.** The spec's mutation ("`withWorkspace` runs `fn` on `deps.db` instead of inside `inWorkspace`") turns AC 8 red at its setup line, not at the clause: without `app.workspace_id`, Eak's `saveDraft` fails the `WITH CHECK` of `migrations/0003_directions_access.sql` lines 12 to 13, before Fon reads anything. The mutation that reaches the clause ("a foreign direction answers like a missing one") is the row security on `direction_version`: line 16 `USING (true)`, in the throwaway test database only. With it, Fon's read of Eak's version id resolves and the test is red at its assertion. The spec's mutation is still run and recorded as red at setup (`needs_decision`, spec row 12).
- **T5. One mutation per clause.** Rows 3, 8, 13, 14 and 15 hold more than one clause; section 4 gives each its own mutation (testing rules, L-0042). Row 15 is split into two cases so its status clause and its session clause go red on their own.
- **T6. Where the new reason sits.** `workspace-not-found` goes right after `forbidden` in `ActionError`, `CODE_OF`, `REASONS`, `log.test.ts` and both catalog trees. That is a different hunk from both of PR 141's insertions (after `rate-limit` and after `ai-rate-limited`), so either merge order is a clean merge.
- **T7. Integration mutations run locally.** The integration tests skip without `TEST_DATABASE_URL`. The builder runs each integration mutation against a throwaway Postgres 17, the image CI uses (`.github/workflows/ci.yml` line 22): `docker run --rm -d --name orv159-pg -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:17`, then `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55432/postgres pnpm --filter @orivilo/auth exec vitest run src/auth.integration.test.ts src/directions.integration.test.ts`. The green run is also proven by the CI run id (spec "Slices", item 2). Without Docker, the builder lists each unrun integration mutation in `deviations`; rows 3, 4 and 13a still go red locally through the stub test.

## 2. Slice 2: the helper (`packages/auth`)

**`packages/auth/src/access.ts`** (`orv159-denied`):

- Line 7, the class comment, becomes: `/** Access refused. `status` is what a route returns: 401 without a session, 404 for a workspace the caller is not in (the same answer as one that does not exist, ADR 0015 decision 10), 403 otherwise. */` (wrapped at 100 columns).
- Line 9: `readonly status: 401 | 403 | 404;`
- Line 10 (the reason union) unchanged.
- Line 59: `if (!row) throw new Denied(404, "not-a-member");`
- Lines 38 to 43, the doc comment of `withWorkspace`, gain one sentence: "A workspace the person is not in answers 404, like one that does not exist: the check reads only `member`, so it cannot tell the two apart."
- Lines 51 to 60 otherwise unchanged: same four checks, same order, one select on `member`. No migration. `packages/auth/src/index.ts` unchanged.

`apps/web/app/directions/actions.ts` line 211 still compiles (`error.status === 401 ? ... : "forbidden"`), so the 404 reaches a person as `forbidden` until slice 3. That is the spec's "safe alone".

**Tests.**

- `access.test.ts`: a stub database, `stubDb(rows: { member: unknown[]; organization: unknown[] })`. `select().from(table).where().limit()` resolves to the rows of `table` and pushes the table's name onto `stub.from`. Every other key (`transaction`, `execute`, `insert`, `update`) throws like `untouchable` (lines 6 to 10). New cases: `it.each([["Dao's workspace", "ws-dao", [{ id: "ws-dao" }]], ["a missing id", "9f1c2d3e-0000-4000-8000-000000000000", []]])("denies a workspace the caller is not in with 404: %s")`. `member` is `[]` in both. Each asserts `rejects.toBeInstanceOf(Denied)`, `rejects.toMatchObject({ status: 404, reason: "not-a-member", message: "access denied: not-a-member" })`, `fn` not called and `stub.from` equal to `["member"]`. Then two type cases: `expectTypeOf<Denied["status"]>().toEqualTypeOf<401 | 403 | 404>()` and `expectTypeOf<Denied["reason"]>().toEqualTypeOf<"no-session" | "no-workspace" | "not-a-member" | "role-too-low">()`. `pnpm --filter @orivilo/auth typecheck` checks them, since `tsconfig.json` includes `src`.
- `auth.integration.test.ts`: line 119 `{ status: 403, ... }` becomes `{ status: 404, reason: "not-a-member" }`. New case "a missing workspace id is denied like a foreign one": two new people (emails no other case in the file uses; `a@` to `e@` are taken). Chai's `withWorkspace` for Dao's id and for row 4's id. Both reject with `{ status: 404, reason: "not-a-member", message: "access denied: not-a-member" }`, and `fn` never runs.
- `directions.integration.test.ts`: line 180 becomes `.rejects.toMatchObject({ status: 404, reason: "not-a-member" })`. AC 8 (lines 167 to 186) gains `service.read(f.headers, f.workspaceId, "00000000-0000-4000-8000-000000000000")` rejecting with `reason: "not-found"`, beside line 173. New case "a removed member is denied with 404 and keeps the session" (an email the file does not use; `a@` to `h@` and `r@` are taken): sign in, delete the member row with `t.admin`, then `service.list(c.headers, c.workspaceId)` rejects with `{ status: 404, reason: "not-a-member" }`. `auth.api.getSession({ headers: c.headers })` still gives `activeOrganizationId === c.workspaceId`.

## 3. Slice 3: the boundary and the copy (`apps/web`, `packages/auth/src/log.ts`)

**`apps/web/app/directions/actions.ts`** (`orv159-boundary`):

- Line 47: insert `| "workspace-not-found"` after `| "forbidden"`. `ActionError` goes from 15 members to 16.
- Line 140: insert `"workspace-not-found": "NOT_FOUND",` after `forbidden: "FORBIDDEN",`.
- After line 152, a new constant (T1):

  ```ts
  /** orv159-boundary: a `Denied` maps by its status alone; a new status without a row fails `pnpm typecheck`. */
  const ERROR_OF_DENIED = {
    401: "signed-out",
    403: "forbidden",
    404: "workspace-not-found",
  } as const satisfies Record<Denied["status"], Failed["error"]>;
  ```

- Lines 210 to 212 become `if (error instanceof Denied) return ended(fail(ERROR_OF_DENIED[error.status]));`.
- `endingOf` (lines 125 to 131), `LIMITED` and `FAILED` are unchanged: `workspace-not-found` ends as `{ level: "info", outcome: "refused", reason: "workspace-not-found" }`. `retry.ts` is unchanged (ADR 0015 decision 7 puts 404 in the no-retry row). `errors.ts` is unchanged: `NOT_FOUND` is line 14.

**`packages/auth/src/log.ts`**: insert `"workspace-not-found",` after line 50 (`"forbidden",`). `REASONS` goes from 20 to 21. The comment on line 42 stays true ("then every `ActionError` member"). **`log.test.ts`**: the same insertion after line 75.

**`apps/web/i18n/messages.ts`** (`orv159-copy`): `saved.errors["workspace-not-found"]`. Thai after line 151: `"ไม่พบเวิร์กสเปซนี้ในบัญชีของคุณ ลงชื่อเข้าใช้อีกครั้งที่หน้าบัญชีเพื่อเปิดเวิร์กสเปซที่คุณเป็นสมาชิก"`. English after line 335: `"This workspace was not found in your account. Sign in again on the Account page to open a workspace you belong to."`. The type ties the copy to the outcome: `failureLines` (`apps/web/i18n/wait.ts` line 51) takes `error: keyof SavedErrors`, so an `ActionError` member without a catalog key fails `pnpm typecheck` in `apps/web`.

**No code change** in `apps/web/app/directions/page.tsx` (line 20 already sends any other failure to `{ kind: "error" }`), `apps/web/app/account/page.tsx` (line 46 maps any `Denied` to signed-out, `orv159-account`), `studio-calls.ts` or `wait.ts`. Rows 11 and 14 are tests only.

**Tests.**

- `actions.test.ts`: line 300 arranges `new Denied(404, "not-a-member")` and expects `error: "workspace-not-found"` and the line `{ level: "info", outcome: "refused", reason: "workspace-not-found" }`. Line 394 arranges the same, and its `toStrictEqual` (lines 396 to 402) expects `{ ok: false, error: "workspace-not-found", code: "NOT_FOUND", requestId: ID, retryable: false }`. Line 408's comment and lines 499 to 500 go from 17 to 18 cases. A new table row follows "Denied 403" (lines 423 to 427): `name: "Denied 404"`, expected `{ error: "workspace-not-found", code: "NOT_FOUND", retryable: false }`, arranging `Denied(404, "not-a-member")`. A new case follows line 523: "a workspace id the session lacks stays forbidden", arranging `Denied(403, "no-workspace")` and `toStrictEqual` the `forbidden`/`FORBIDDEN` outcome.
- `studio-calls.test.ts`, in `describe("failureNotice")`: `it.each` over en and th, "a workspace-not-found failure shows its line and no reference". `failureNotice(labelsOf(m), { ok: false, error: "workspace-not-found", code: "NOT_FOUND", requestId: ID, retryable: false })` `toStrictEqual({ tone: "danger", lines: [<row 8's literal string>] })`.
- `apps/web/i18n/wait.test.ts` lines 72 to 78 (the `referenceLine` block): add `"NOT_FOUND"` after `"FORBIDDEN"`.
- New `apps/web/app/directions/page.test.tsx` (T3). Mocks: `server-only`; `../../i18n/locale` (`getWebMessages` returns `{ locale, m }` from a hoisted language switch); `./actions` (`listDirections` resolves to row 8's outcome); `@orivilo/design-system/examples` (`WorkspaceScreen: () => null`). `it.each` en/th, "the first notice from the page names a missing workspace": `renderToStaticMarkup(await DirectionsPage())`. The `role="status"` region holds the word ("Not done" / "ทำไม่สำเร็จ"), and its paragraphs are exactly `[m.saved.errors["workspace-not-found"]]`. Use the `statusOf`, `paragraphs` and `text` helpers' shape from `SavedStudio.test.tsx` lines 47 to 50.
- `apps/web/app/account/page.test.tsx`: a hoisted state makes `getSession` return a session and mocks `withWorkspace` from `@orivilo/auth` (`vi.mock` with `importOriginal`, keeping the real `Denied`) to throw. New `it.each` over `[Denied(404, "not-a-member"), Denied(403, "no-workspace")]` × en/th, "a denied workspace shows the sign-in view". `<h1>` holds `m.account.heading`, `form.labels` equals the signed-out labels, and no `signedInAs` text is present.

## 4. Slice 4: Better Auth's organization paths (`packages/auth/src/config.ts`)

**`config.ts`** (`orv159-auth-paths`, K-0092 section 5):

- After line 23 (`slugOf`), a module constant (T2), in the spec's table order:

  ```ts
  /**
   * ORV-159 (K-0092): every path the organization plugin serves with the options below. The app
   * calls none, and some tell a missing workspace from one the caller is not in, so each answers
   * 404 before its route runs. A story that needs one removes it here, with its own answers for a
   * missing and a foreign id.
   */
  const ORGANIZATION_PATHS = [
    "/organization/create",
    "/organization/check-slug",
    "/organization/update",
    "/organization/delete",
    "/organization/get-organization",
    "/organization/get-full-organization",
    "/organization/set-active",
    "/organization/list",
    "/organization/remove-member",
    "/organization/update-member-role",
    "/organization/get-active-member",
    "/organization/leave",
    "/organization/list-members",
    "/organization/get-active-member-role",
    "/organization/invite-member",
    "/organization/accept-invitation",
    "/organization/reject-invitation",
    "/organization/cancel-invitation",
    "/organization/get-invitation",
    "/organization/list-invitations",
    "/organization/list-user-invitations",
    "/organization/has-permission",
  ] as const;
  ```

  (Prettier lays it out one per line; 22 entries.)

- After line 41 (`advanced`): `disabledPaths: [...ORGANIZATION_PATHS],`. This is the top-level option of `BetterAuthOptions`, typed `string[]`, hence the spread.
- The `createAuth` comment (lines 25 to 29) gains: "Better Auth's organization routes are off (`ORGANIZATION_PATHS`); workspaces are read through `withWorkspace` only."
- `settingsFromEnv`, `apps/web/server/auth.ts` and `apps/web/app/api/auth/[...all]/route.ts` are unchanged. `authRoute` already turns the `Not Found` text answer into the `NOT_FOUND` body (`auth-route.ts` lines 43 and 106, `errors.ts` line 14).

**Tests**, all in `auth.integration.test.ts` inside the outer `describe`, with a route `authRoute((r) => auth.handler(r), { consumeSignIn: async () => ({ ok: true }) })`:

- Row 15a, "organization paths answer like a missing path". Two new people, Chai and Dao (unused emails); Dao's slug from `t.admin` (`organization.slug`). Three `GET`s with Chai's cookie: `organizationId=<Dao's id>`, `organizationId=9f1c2d3e-0000-4000-8000-000000000000`, `organizationSlug=<Dao's slug>`. Each answers status 404, `x-request-id` equal to `body.error.requestId`, and a body that `toEqual`s `{ error: { code: "NOT_FOUND", message: "Not found.", requestId: expect.any(String), retryable: false } }`. The three bodies with `requestId` removed are equal.
- Row 15b, "a disabled organization path keeps the caller's active workspace". Chai sends the foreign-id `GET`; then `auth.api.getSession({ headers })` still gives `activeOrganizationId === <Chai's workspace>`.
- Row 16, "every organization path the plugin serves is disabled": `served = Object.values(auth.api)` filtered to a string `path` that starts with `/organization/`, without duplicates. `[...auth.options.disabledPaths].sort()` `toEqual` `served.sort()`, and `served` has length 22.

If a first run contradicts K-0092 (no `path` on an `auth.api` endpoint, or a disabled path that does not answer 404), the builder stops and reports `blocked` with the observed answer. K-0092 is then corrected through a `research` task before any change to the design.

## 5. Tests per row, one mutation per clause

Each mutation is made, seen red on the named test, and restored, with one `verified` row each (testing rules, L-0042). "Local" means it runs without a database; "DB" means it runs against the T7 Postgres.

<!-- prettier-ignore -->
| Row | Clause | Test | Mutation (red) | Run |
| --- | --- | --- | --- | --- |
| 1 | 401 without a session | `access.test.ts` line 13 (today's) | line 52 throws 403 | Local |
| 2 | 403 for a missing id | `access.test.ts` line 27 (today's) | line 53 throws 404 | Local |
| 3a | status 404 | stub case; `auth.integration` line 119 | line 59 throws 403 | Local, DB |
| 3b | reason and message | stub case | line 59 reason `"role-too-low"` | Local |
| 3c | `fn` not called, no transaction | stub case | on `!row`, call `inWorkspace(deps.db, workspaceId, async () => undefined)` before the throw | Local |
| 3d, 4 | one select on `member`; a foreign and a missing id answer alike | stub case (both ids); new integration case | the helper first selects `organization` by id and throws `Denied(403, "no-workspace")` when no row is found | Local, DB |
| 5 | 403 for a low role | `auth.integration` line 128 (today's) | line 60 throws 404 | DB |
| 6 | status union exactly 401, 403, 404 | `expectTypeOf` status case | (a) union gains `500`; (b) union loses `404` | Local (`typecheck`) |
| 7 | reason union exactly four | `expectTypeOf` reason case | union gains `"not-found"` | Local (`typecheck`) |
| 8a | outcome `workspace-not-found` | `actions.test.ts` lines 300, 394 | `ERROR_OF_DENIED[404]` is `"forbidden"` | Local |
| 8b | code `NOT_FOUND` | `actions.test.ts` line 394 | `CODE_OF["workspace-not-found"]` is `"FORBIDDEN"` | Local |
| 8c | line `info` / `refused` | `actions.test.ts` line 300 | add `"workspace-not-found"` to `FAILED` (line 117) | Local |
| 8d | reason in `REASONS` | `log.test.ts` line 68 | drop it from `REASONS` | Local |
| 8e | English line | `studio-calls.test.ts` new case (en) | change one word of the English string | Local |
| 8f | Thai line | same case (th) | change one word of the Thai string | Local |
| 8g | no reference line | `wait.test.ts` line 72; `studio-calls.test.ts` new case | `referenceLine` also fills for `NOT_FOUND` | Local |
| 9 | 403 stays `forbidden` | table row "Denied 403"; new `no-workspace` case | `ERROR_OF_DENIED[403]` is `"workspace-not-found"` | Local |
| 10 | 401 stays `signed-out` | `actions.test.ts` line 513 (today's) | `ERROR_OF_DENIED[401]` is `"workspace-not-found"` | Local |
| 11 | page load shows the notice | new `directions/page.test.tsx` | `page.tsx` `load()` returns `{ kind: "signed-out" }` for `workspace-not-found` | Local |
| 12 | foreign direction answers like a missing one | `directions.integration` AC 8 | (T4) `0003_directions_access.sql` line 16 `USING (true)`; also the spec's mutation, recorded as red at setup | DB |
| 13a | removed member and foreign workspace: 404 | `directions.integration` line 180; new removed-member case | the helper skips the member select and runs `fn` as `owner` | DB (and Local through 3c's stub case) |
| 13b | session unchanged | new removed-member case | the helper sets the person's sessions' `activeOrganizationId` to `null` before its throw | DB |
| 14a | 404 shows sign-in | `account/page.test.tsx` new case | `page.tsx` line 46 maps a `Denied` only when `status !== 404` | Local |
| 14b | 403 shows sign-in | same | line 46 maps only when `status !== 403` | Local |
| 15a | 404 `NOT_FOUND`, equal bodies | new case 15a | drop `/organization/get-full-organization` from `ORGANIZATION_PATHS` | DB |
| 15b | active workspace kept | new case 15b | same mutation (the foreign call clears it, K-0092 section 6) | DB |
| 16 | the list equals the served paths | new case 16 | drop `/organization/check-slug` | DB |
| 18 | used paths still work | `auth.integration` "Better Auth's limiter counts in the shared store" (today's) | the list gains `/sign-in/social`. The spec's `/get-session` mutation turns only row 16 red, since no test calls `/api/auth/get-session` on a real instance (`auth-route.test.ts` lines 210 and 267 use a fake handler); recorded too | DB |
| 20a | Thai and English keys match | `messages.test.ts` (today's); `pnpm typecheck` | drop the Thai key | Local |
| 20b | no middot or em dash | `messages.test.ts` (today's) | put `—` in the English line | Local |

Rows 17 and 19 are not builder tests. Row 17 is the G4 probe on staging after slice 4 (open question 3, default (b)): `curl -si -X POST -H 'content-type: application/json' -d '{}' <staging>/api/auth/organization/set-active`, then, with a signed-in cookie, `curl -si '<staging>/api/auth/organization/get-full-organization?organizationId=<own id>'`. Both must show 404 and the `NOT_FOUND` body; the two answers go into the G4 packet. Row 19 is checked by `grep -n '^Addition, ' docs/adr/0015-standards-and-required-controls.md` and a `git diff` of the ADR that removes no line.

Before handoff, each builder also runs `pnpm --filter <package> exec vitest run --testTimeout=400` and reports the count (testing rules). No test here builds a heavy document.

## 6. If PR 141 (ORV-121) merges first

PR 141 touches none of slice 2's or slice 4's code files. Its overlaps are in slice 3 and the slice 4 docs:

- **`actions.ts`.** `ActionError` gains `"ai-spend-cap"` (15 to 16; with ORV-159, 17). `CODE_OF` moves to lines 160 to 174 and does not list `ai-spend-cap`. The `Denied` map moves to line 233. Make the same three edits, found by text, not line. `ERROR_OF_DENIED` still types against `Failed["error"]`, which PR 141 narrows to exclude `ai-spend-cap`. Its three values are all in it.
- **`log.ts` and `log.test.ts`.** `REASONS` is 22 after PR 141 (`spend-cap`, `ai-spend-cap`); with ORV-159 it is 23. The insertion after `"forbidden"` is line 51 in `log.ts` and line 76 in `log.test.ts`.
- **`actions.test.ts`.** The table is 19 cases (lines 485 and 590 to 591 in PR 141's head); with ORV-159 it is 20. Lines 377 and 471 are today's lines 300 and 394. Two more edits: the fake `spendCap().check` throws `Denied(404, "not-a-member")` for a non-member (PR 141 line 122), and in "AI reading needs a workspace the person belongs to" (lines 846 to 861), the `"other"` case expects `failure("workspace-not-found", "NOT_FOUND", false)` and a line with `reason: "workspace-not-found"`, while the `null` case stays `forbidden`. Split the `it.each` into two cases, or carry the expected error in each tuple.
- **`messages.ts`.** PR 141 adds `ai-spend-cap` after `ai-rate-limited`. The ORV-159 key after `forbidden` is a separate hunk.
- **`errors.ts`.** PR 141 adds `AI_SPEND_CAP` (429). ORV-159 adds no code; `NOT_FOUND` stays the 404 code of `codeOfStatus`.
- **Spend cap tests in `packages/auth`.** `spend-cap.integration.test.ts` (non-member cases at PR 141 lines 207 to 212 and 333 to 342) matches only `name` and `reason`, and `spend-cap.test.ts` line 63 is `no-workspace` (403). Both keep passing after slice 2. No edit.
- **Slice 4 docs.** PR 141 edits ADR 0015 (+22 −3), ORV-141 and ORV-144 specs and tech notes. ADR 0015 lines 151, 153 and 190 and the ORV-144 "15 members" lines may move, and the ORV-144 count becomes 16 before ORV-159 makes it 17. The slice 4 writer finds each place by its text and re-counts.

If ORV-159 slice 3 merges first, PR 141 picks up the same edits on its rebase: the 19-case table becomes 20, `REASONS` 23, and the fake `check` and the non-member reading case change as above.

## 7. Build order and size

One deliverable per task. Each code PR gets `reviewer`, `qa` and `security`, since each touches `packages/auth/**` (ADR 0015 decision 2). Review runs once per PR (POC mode).

1. **`ORV-159-build-2`** (builder): slice 2, section 2. Branch `feature/ORV-159-helper-404` from `develop`. About 130 lines with tests: `access.ts` 8, `access.test.ts` 70, `auth.integration.test.ts` 20, `directions.integration.test.ts` 35. Evidence: the local and DB rows of section 5 for rows 1 to 7, 12 and 13, and the CI run id.
2. **`ORV-159-build-3`** (builder): slice 3, section 3. Starts after slice 2 is on `develop` (its tests construct `Denied(404, ...)`). About 160 lines: `actions.ts` 12, `log.ts` and `log.test.ts` 2, `messages.ts` 4, `actions.test.ts` 30, `studio-calls.test.ts` 20, `wait.test.ts` 1, `directions/page.test.tsx` 55, `account/page.test.tsx` 35. The reviewer walks `DESIGN.md` section 11 for the one catalog line (spec "Lane").
3. **`ORV-159-build-4`** (builder): slice 4 code, section 4. Can start alongside task 1 in its own worktree. It shares only `auth.integration.test.ts`, in other regions, so it rebases on slice 2 if slice 2 merges first. About 100 lines: `config.ts` 35, `auth.integration.test.ts` 65.
4. **`ORV-159-adr-4`** (architect): on task 3's branch, after slices 2 and 3 are on `develop` and task 3's CI is green. It adds the two ADR 0015 Additions of `orv159-adr`, citing the CI run ids of rows 3, 4, 12, 13 and 15, plus the "Not done yet" line. It also updates the docs of spec "Impact list", each found by text (section 6). About 25 lines. Tasks 3 and 4 make one PR.

Total about 415 lines over three PRs, each under 400 (open question 9, default (a)). Then comes the staging batch and the row 17 probe in the G4 packet.

## 8. Open question defaults (ORV-159 comment 10292) and where they are met

| #   | Default                                              | Met in                                                       |
| --- | ---------------------------------------------------- | ------------------------------------------------------------ |
| 1   | (a) `disabledPaths` in `createAuth`                  | Section 4, `config.ts`                                       |
| 2   | (c) the 22 served paths                              | Section 4, `ORGANIZATION_PATHS`; row 16                      |
| 3   | (b) no staging walk of `not-a-member`; G4 is row 17  | Section 5, row 17                                            |
| 4   | (a) the 404 lives in the helper                      | Section 2, `access.ts` line 59                               |
| 5   | (a) a new key `workspace-not-found` with `NOT_FOUND` | Section 3                                                    |
| 6   | (a) `/account` keeps its signed-out view             | Section 3, no change to `account/page.tsx`; rows 14a and 14b |
| 7   | (a) `no-workspace` stays 403                         | Section 2 (line 53 unchanged); rows 2 and 9                  |
| 8   | (a) `errorResponse` not exported                     | Sections 2 and 4, `index.ts` unchanged                       |
| 9   | (a) three PRs in order                               | Section 7                                                    |
