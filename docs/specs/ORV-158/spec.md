---
issue: ORV-158 (https://tpetkaew.atlassian.net/browse/ORV-158)
parent: ORV-113 (item 4)
lane: L
version: 1.1
---

# ORV-158: the field classification map (ORV-113 item 4)

## Why

ADR 0015 decision 9 and `.claude/rules/security.md` rule 11 say every column of the `packages/db` schema carries one tag from a closed list (`public`, `internal`, `personal`, `secret`), in one file, `packages/db/src/schema/classification.ts`, typed so an untagged column fails `pnpm typecheck`. Decision 8 (masking), decision 6 (log lines) and decision 3's LLM02:2026 row (prompts) all key off those tags. Today the file does not exist (`grep -rin classif packages/db` finds nothing), so no later control has a list to read, and decision 9's Confirmation line still reads "not confirmed yet; follow-up: ORV-113".

ORV-158 is item 4 of ORV-113 as its own story, as ORV-141 (item 1) and ORV-144 (item 2) were. Jira ORV-158 quotes the item as "Field classification map: packages/db/src/schema/classification.ts, plus a test that every column is tagged".

**Frame.** A typed map and a test over the schema code, not a hook that judges a tool call's text, so it is neither a guard rail nor a boundary in the L-0012 sense. It catches a schema change made by a person or an agent who runs `pnpm typecheck` and `pnpm test`; CI and the quality gate run both on every PR.

**What is real.** Real code and tests, with no runtime consumer yet: nothing masks, hides or drops a value by its tag in this story. A tag records what a column can hold; it does not claim PDPA compliance or conformance to any standard (ADR 0015 decisions 8 and 13).

## Story

As the person who runs ORIVILO, I want every database column to carry one decided tag with its reason, checked by the build, so that the masking, logging and prompt rules of ADR 0015 have one list to read and a new column cannot ship without a decision about what it holds.

## Lane

**L**, for the auth or data access flag: the map is the data access contract that decisions 8 and 9 rest on (which columns may leave the server, reach a log line or a prompt), and ADR 0015 line 151 calls the sibling data access item (404 not 403) L lane for the same flag. The other flags do not apply: no profile or token schema, no semantic token contract, no component public API, no resolver logic, no asset licensing. Jira ORV-158 carries the labels `lane-L` and `security`. The `security` role is dispatched on each PR, as the diff touches `packages/db/**`, a path in `.claude/rules/security.md` (ADR 0015 decision 2).

**Design.** No `design.md`: the story has no UI, no state a person sees and no locale string, and `DESIGN.md` is unaffected. No Thai or English copy changes. Tech notes are needed because a schema contract changes; `ds-architect` writes `docs/specs/ORV-158/tech.md` (POC mode, ORV-137).

**Gates.** G1 and G2 pass under the owner's delegation (ADR 0012 decision 4), except open question 1, which is the owner's. A spec review task runs before the G1 packet (L-0037). G4 evidence is open question 6.

## Acceptance criteria

"Operator" is the developer or agent who runs the commands; no person-facing UI changes. A clause id (T1 to T5, W1 to W5) is defined in the rule named beside it.

<!-- prettier-ignore -->
| # | Given | When | Who sees what | Data effect | Test |
| --- | --- | --- | --- | --- | --- |
| 1 | The schema at `develop` `eeb2e71` and `classification.ts` | `pnpm --filter @orivilo/db typecheck` and `pnpm --filter @orivilo/db test` run | Operator: both pass; `CLASSIFICATION` holds the tables and tags of `orv158-tags`, no more and no fewer | None | `classification.test.ts`, "every exported table and column has one tag" (`orv158-walk` on the real inputs) |
| 2 | `classification.ts` as built | The basis count of `orv158-basis` runs | Operator: the count of `orv158-basis` | None | The grep of `orv158-basis`, quoted in the G3 packet |
| 3 | The fixture of clause T1 (`orv158-type`) | `pnpm --filter @orivilo/db typecheck` runs, then again with T1's mutation | Operator: passes; with the mutation, fails with TS2578 "Unused '@ts-expect-error' directive" at the T1 fixture line; restored, passes | None | The T1 fixture; one `verified` row with the red line |
| 4 | The fixture of clause T2 | The same, with T2's mutation | Operator: as row 3, at the T2 fixture line | None | The T2 fixture; one `verified` row |
| 5 | The fixture of clause T3 | The same, with T3's mutation | Operator: as row 3, at the T3 fixture line | None | The T3 fixture; one `verified` row |
| 6 | The fixture of clause T4 | The same, with T4's mutation | Operator: as row 3, at the T4 fixture line | None | The T4 fixture; one `verified` row |
| 7 | The fixture of clause T5 | The same, with T5's mutation | Operator: as row 3, at the T5 fixture line | None | The T5 fixture; one `verified` row |
| 8 | A scratch edit adds `phone: text("phone")` to `user` in `auth.ts`, the shape a Better Auth regeneration produces | `pnpm --filter @orivilo/db typecheck` runs | Operator: fails in `classification.ts` with an error that names `phone`; restored, passes | None | Scratch mutation; one `verified` row with the error line |
| 9 | `TEST_DATABASE_URL` unset | `pnpm --filter @orivilo/db exec vitest run src/schema/classification.test.ts` runs | Operator: every test in the file runs and passes, none skipped | None | The run's summary line; `grep -c runIf packages/db/src/schema/classification.test.ts` and `grep -c TEST_DATABASE_URL packages/db/src/schema/classification.test.ts` each give 0 |
| 10 | The walk's fixture input for W1 (`orv158-walk`) | The walk compares | Operator: exactly W1's problem, naming the table | None | `classification.test.ts`, one case for W1 |
| 11 | The walk's fixture input for W2 | The walk compares | Operator: exactly W2's problem, naming the entry | None | `classification.test.ts`, one case for W2 |
| 12 | The walk's fixture input for W3 | The walk compares | Operator: exactly W3's problem, naming `table.column` | None | `classification.test.ts`, one case for W3 |
| 13 | The walk's fixture input for W4 | The walk compares | Operator: exactly W4's problem, naming `table.column` | None | `classification.test.ts`, one case for W4 |
| 14 | The walk's fixture input for W5 | The walk compares | Operator: exactly W5's problem, naming `table.column` | None | `classification.test.ts`, one case for W5 |
| 15 | `TAGS` | The test reads it | Operator: equal to `orv158-closed`; with a fifth value added (mutation), red; restored, green | None | `classification.test.ts`, "the tag list is the closed list" |
| 16 | `CLASSIFICATION` | The pins of `orv158-pins` are compared | Operator: equal; with `session.token` retagged `internal`, red; with `account.accountId` retagged `internal`, red; with `organization.metadata` retagged `internal`, red; restored, green | None | `classification.test.ts`, "pins the secret and personal columns" and "keeps decision 9's examples" |
| 17 | `@orivilo/db` | A module imports `CLASSIFICATION`, `TAGS` and `Tag` from the package root, and the test reads the schema barrel's keys | Operator: the import compiles; the barrel holds no classification export (`orv158-export`) | `client.ts`, `drizzle.config.ts`, `schema/index.ts` and `package.json` unchanged | `classification.test.ts`, "the schema barrel does not carry the map"; `git diff --stat` on the four files is empty |
| 18 | PR 141 (ORV-121, the `ai_usage` table) and this story's code PR, in either order | The second one rebases on `develop` | Operator: as `orv158-rebase` says for that order | None | The second PR's `pnpm typecheck` and `classification.test.ts` run, quoted in its G3 packet |
| 19 | The code PR | It is diffed against `develop` | Operator: as `orv158-no-migration` says | No schema or data change | `git diff --stat origin/develop... -- packages/db/migrations packages/db/src/schema/auth.ts packages/db/src/schema/workspace.ts packages/db/src/schema/direction.ts packages/db/src/schema/rate-limit.ts` is empty; `pnpm --filter @orivilo/db generate` writes no file |
| 20 | The code PR on a clean tree | `pnpm quality-gate` runs with `TEST_DATABASE_URL` and `REQUIRE_DB_TESTS=1` exported (L-0047) | Operator: the 11 steps of `scripts/quality-gate.mjs` (format, commits, scripts, lint, secrets, codescan, typecheck, contrast, test, build, audit) pass and a gate record is written | None | The gate record, quoted in the G3 packet |
| 21 | ADR 0015 and the notes of the impact list after the code PR | They are read | Operator: the dated Additions and notes of "Impact list", "Docs" | Docs only | `grep -n '^Addition, .*(ORV-158)' docs/adr/0015-standards-and-required-controls.md` gives two lines |

## Rules and bounds

- **orv158-closed.** The closed tag list is ADR 0015 decision 9's, in this order: `public`, `internal`, `personal`, `secret`. `classification.ts` exports it as the runtime array `TAGS`, and `Tag` is the union of its members. No column is `public` in v1.0: nothing in the schema is meant to be shown to someone outside its workspace. The value stays in the list for later columns.
- **orv158-keys.** `CLASSIFICATION` is keyed by the export name of each table in `packages/db/src/schema/index.ts` (`directionVersion`, `rateLimitCounter`), then by each column's property name in the table's builder object, the keys `getTableColumns` returns (`ipAddress`, `accessToken`), as decision 9's examples write them. SQL names appear only in this spec, for reading.
- **orv158-basis.** Each column has one basis, the reason for its tag, and each basis gives one tag:

  <!-- prettier-ignore -->
  | Basis | The column holds | Tag | Parent category |
  | --- | --- | --- | --- |
  | `person` | A value that names, contacts, locates, pictures or identifies a person or their device | `personal` | personal data |
  | `user-ref` | A user id: the `user` table's own key or a column that holds one, so it points at one person (ORV-121 tech notes line 105) | `personal` | personal data |
  | `hashed-subject` | A keyed hash of a client IP, or a user id (ORV-112 tech notes line 149) | `personal` | personal data |
  | `free-text` | Text or a JSON record a person writes with no limit on what it holds: a brief kept with a model's reading of it, or a record with no named purpose and no shape (`orv158-hold`) | `personal` | AI content for the brief a model reads; personal data for a record no model reads |
  | `credential` | A value that grants access or completes a sign-in step | `secret` | secret or token |
  | `workspace-key` | A workspace id | `internal` | workspace key |
  | `row-key` | A row's own random id, or a reference to a row that is not a person | `internal` | plain |
  | `label` | A short name a person gives a workspace item | `internal` | plain |
  | `amount` | A money amount or its currency code | `internal` | money |
  | `record` | A time, state, role, count, provider name, scope, fingerprint, job or model name, or a workspace's slug or logo (`orv158-hold`) | `internal` | plain |

  In `classification.ts` each column's entry is one line that ends with a comment naming its basis, so this count over the file gives the number of columns (80 at `eeb2e71`, 88 once `ai_usage` is in):

  ```bash
  grep -cE '^[[:space:]]+[A-Za-z]+: "(public|internal|personal|secret)", // (person|user-ref|hashed-subject|free-text|credential|workspace-key|row-key|label|amount|record)$' packages/db/src/schema/classification.ts
  ```

- **orv158-hold.** A column is tagged by what its write paths can put in it, not by what today's rows hold, and when two paths give different tags the more guarded one wins (`personal` over `internal`). A write path is any code that writes the column: this repo's (the sign-up hook, `packages/auth/src/config.ts` line 62), a Better Auth plugin's own store whether enabled or not, and a Better Auth endpoint a signed-in person can call. The organization endpoints are such paths: `organizationPlugin()` is set up with no options (`config.ts` line 43), `apps/web/app/api/auth/[...all]/route.ts` passes every `/api/auth` path to Better Auth, and in Better Auth 1.7.12 (`better-auth/dist/plugins/organization/routes/crud-org.mjs`) `/organization/create` takes `slug` as any string of at least one character (line 14), `logo` as any string (line 16) and `metadata` as `z.record(z.string(), z.any())` (line 17), and `/organization/update` takes the same three (lines 162 to 164). Three cases:
  - Code that writes a person's data into the column gives `person`: `organization.name` (the sign-up hook), `verification.identifier` (the email OTP plugin; open question 8).
  - A person who fills a field with a named purpose (a workspace item's name, URL key or image URL) gives that purpose's basis, `label` or `record`; a person who types their own name or picture into such a field is the masking item's question (open question 3): `project.name`, `direction.name`, `organization.slug`, `organization.logo`.
  - A person who writes a value with no named purpose and no shape gives `free-text`: `organization.metadata`.

- **orv158-tags.** The tag and basis of every column of the 11 tables at `develop` `eeb2e71`, read from `auth.ts` (7 tables, 54 columns), `direction.ts` (2, 17), `workspace.ts` (1, 5) and `rate-limit.ts` (1, 4). The latest Drizzle snapshot, `packages/db/migrations/meta/0005_snapshot.json`, lists the same 11 tables and 80 columns (`grep -c '"primaryKey":'` gives 80).

  <!-- prettier-ignore -->
  | Table | Column (SQL name) | Tag | Basis | Note |
  | --- | --- | --- | --- | --- |
  | `user` | `id` | personal | user-ref | |
  | `user` | `name` | personal | person | |
  | `user` | `email` | personal | person | Decision 9's example |
  | `user` | `emailVerified` (`email_verified`) | internal | record | |
  | `user` | `image` | personal | person | The person's picture URL from Google |
  | `user` | `createdAt` (`created_at`) | internal | record | |
  | `user` | `updatedAt` (`updated_at`) | internal | record | |
  | `session` | `id` | internal | row-key | |
  | `session` | `expiresAt` (`expires_at`) | internal | record | |
  | `session` | `token` | secret | credential | Decision 9's example |
  | `session` | `createdAt` (`created_at`) | internal | record | |
  | `session` | `updatedAt` (`updated_at`) | internal | record | |
  | `session` | `ipAddress` (`ip_address`) | personal | person | Decision 9's example |
  | `session` | `userAgent` (`user_agent`) | personal | person | The person's device |
  | `session` | `userId` (`user_id`) | personal | user-ref | |
  | `session` | `activeOrganizationId` (`active_organization_id`) | internal | workspace-key | |
  | `account` | `id` | internal | row-key | |
  | `account` | `accountId` (`account_id`) | personal | person | Google's id for the person |
  | `account` | `providerId` (`provider_id`) | internal | record | |
  | `account` | `userId` (`user_id`) | personal | user-ref | |
  | `account` | `accessToken` (`access_token`) | secret | credential | Decision 9's example |
  | `account` | `refreshToken` (`refresh_token`) | secret | credential | Decision 9's example |
  | `account` | `idToken` (`id_token`) | secret | credential | Decision 9's example |
  | `account` | `accessTokenExpiresAt` (`access_token_expires_at`) | internal | record | |
  | `account` | `refreshTokenExpiresAt` (`refresh_token_expires_at`) | internal | record | |
  | `account` | `scope` | internal | record | |
  | `account` | `password` | secret | credential | Null today: password sign-in is off (`packages/auth/src/config.ts` line 37) |
  | `account` | `createdAt` (`created_at`) | internal | record | |
  | `account` | `updatedAt` (`updated_at`) | internal | record | |
  | `verification` | `id` | internal | row-key | |
  | `verification` | `identifier` | personal | person | First case of `orv158-hold`: Better Auth's email OTP plugin puts the email in it (`better-auth/dist/plugins/email-otp/routes.mjs` line 142); not enabled today (open question 8) |
  | `verification` | `value` | secret | credential | Better Auth stores the OAuth state with its code verifier here (`better-auth/dist/state.mjs` lines 79 to 84) |
  | `verification` | `expiresAt` (`expires_at`) | internal | record | |
  | `verification` | `createdAt` (`created_at`) | internal | record | |
  | `verification` | `updatedAt` (`updated_at`) | internal | record | |
  | `organization` | `id` | internal | workspace-key | |
  | `organization` | `name` | personal | person | The sign-up hook names the first workspace after the person (see below) |
  | `organization` | `slug` | internal | record | A URL key: the sign-up hook writes `ws-` and the first 12 characters of the id (`config.ts` lines 23 and 62), and a signed-in person can send any slug to Better Auth's organization create and update endpoints; second case of `orv158-hold` |
  | `organization` | `logo` | internal | record | An image URL for the workspace: the sign-up hook writes none, and a signed-in person can send any string to Better Auth's organization create and update endpoints; second case of `orv158-hold` |
  | `organization` | `createdAt` (`created_at`) | internal | record | |
  | `organization` | `metadata` | personal | free-text | Any JSON record a signed-in person sends to Better Auth's organization create and update endpoints, stored as text (`auth.ts` line 84); third case of `orv158-hold`; one tag for the whole value |
  | `member` | `id` | internal | row-key | |
  | `member` | `organizationId` (`organization_id`) | internal | workspace-key | |
  | `member` | `userId` (`user_id`) | personal | user-ref | |
  | `member` | `role` | internal | record | |
  | `member` | `createdAt` (`created_at`) | internal | record | |
  | `invitation` | `id` | internal | row-key | |
  | `invitation` | `organizationId` (`organization_id`) | internal | workspace-key | |
  | `invitation` | `email` | personal | person | |
  | `invitation` | `role` | internal | record | |
  | `invitation` | `status` | internal | record | |
  | `invitation` | `expiresAt` (`expires_at`) | internal | record | |
  | `invitation` | `createdAt` (`created_at`) | internal | record | |
  | `invitation` | `inviterId` (`inviter_id`) | personal | user-ref | |
  | `project` | `id` | internal | row-key | |
  | `project` | `workspaceId` (`workspace_id`) | internal | workspace-key | |
  | `project` | `name` | internal | label | Open question 3 |
  | `project` | `createdBy` (`created_by`) | personal | user-ref | |
  | `project` | `createdAt` (`created_at`) | internal | record | |
  | `direction` | `id` | internal | row-key | |
  | `direction` | `workspaceId` (`workspace_id`) | internal | workspace-key | |
  | `direction` | `name` | internal | label | Open question 3 |
  | `direction` | `createdBy` (`created_by`) | personal | user-ref | |
  | `direction` | `createdAt` (`created_at`) | internal | record | |
  | `direction` | `updatedAt` (`updated_at`) | internal | record | |
  | `directionVersion` (`direction_version`) | `id` | internal | row-key | |
  | `directionVersion` | `directionId` (`direction_id`) | internal | row-key | |
  | `directionVersion` | `workspaceId` (`workspace_id`) | internal | workspace-key | |
  | `directionVersion` | `status` | internal | record | |
  | `directionVersion` | `number` | internal | record | |
  | `directionVersion` | `snapshot` | personal | free-text | The brief, up to 4000 characters, and an optional model reading (`packages/intent-engine/src/saved.ts` lines 23 and 36); one tag for the whole jsonb |
  | `directionVersion` | `fingerprint` | internal | record | |
  | `directionVersion` | `createdBy` (`created_by`) | personal | user-ref | |
  | `directionVersion` | `createdAt` (`created_at`) | internal | record | |
  | `directionVersion` | `approvedBy` (`approved_by`) | personal | user-ref | |
  | `directionVersion` | `approvedAt` (`approved_at`) | internal | record | |
  | `rateLimitCounter` (`rate_limit_counter`) | `key` | personal | hashed-subject | `<limit>:u:<userId>` or `<limit>:ip:<hash>` (`packages/auth/src/rate-limit.ts` lines 112 to 113) |
  | `rateLimitCounter` | `windowStart` (`window_start`) | internal | record | |
  | `rateLimitCounter` | `windowEnd` (`window_end`) | internal | record | |
  | `rateLimitCounter` | `count` | internal | record | |

  `organization.name`: Better Auth's user create hook names the auto-created workspace `user.name || user.email` (`packages/auth/src/config.ts` line 62), so the column can hold a person's name or email address (first case of `orv158-hold`).

  The 8 columns of `ai_usage` (PR 141, ORV-121 tech notes section 2), which join the map by `orv158-rebase`. They agree with ORV-121 tech notes line 105 (`user_id` personal, every other column internal):

  <!-- prettier-ignore -->
  | Table | Column (SQL name) | Tag | Basis | Note |
  | --- | --- | --- | --- | --- |
  | `aiUsage` (`ai_usage`) | `id` | internal | row-key | |
  | `aiUsage` | `workspaceId` (`workspace_id`) | internal | workspace-key | |
  | `aiUsage` | `userId` (`user_id`) | personal | user-ref | A plain id, no foreign key |
  | `aiUsage` | `job` | internal | record | |
  | `aiUsage` | `model` | internal | record | |
  | `aiUsage` | `costMicroUsd` (`cost_micro_usd`) | internal | amount | |
  | `aiUsage` | `currency` | internal | amount | |
  | `aiUsage` | `createdAt` (`created_at`) | internal | record | |

- **orv158-type.** `classification.ts` derives a type `Classification` from the `PgTable` exports of the schema barrel: one required key per table, and under it one required key per column whose value is a `Tag`. `CLASSIFICATION` is written `as const satisfies Classification`. Five type clauses, each failing `pnpm typecheck`:
  - T1: a column of a table has no entry.
  - T2: an entry names a column the table does not have.
  - T3: an entry's value is not a member of `orv158-closed`.
  - T4: a table exported by the barrel has no entry.
  - T5: an entry names a table the barrel does not export.

  Each clause has one fixture under `packages/db/src` (so `pnpm typecheck` checks it; tech notes name the file): a value built from `CLASSIFICATION` with that one defect, checked with `satisfies Classification`, under a `// @ts-expect-error` whose description names the clause. A mutation that weakens the clause in the type (tech notes name one per clause) makes the fixture compile, and `tsc` then reports the directive as unused. The same type makes a Better Auth regeneration of `auth.ts` (pinned at 1.7.12, its line 1) that adds or drops a column fail T1 or T2 on the real map until the map follows.

- **orv158-walk.** A pure test, `packages/db/src/schema/classification.test.ts`: no database, no `TEST_DATABASE_URL`, no `describe.runIf`. It imports the schema barrel, keeps the values for which `is(value, PgTable)` holds (the barrel also exports 6 relations objects and `TENANT_TABLES`), reads each table's columns with `getTableColumns`, and compares both ways with `CLASSIFICATION` through one function that returns a list of problems. Five clauses, each one problem:
  - W1: an exported table with no entry.
  - W2: an entry with no exported table.
  - W3: a column with no entry.
  - W4: an entry with no column.
  - W5: an entry whose value is not in `TAGS`.

  On the real inputs the list is empty. On one fixture input per clause (an in-test table or map with that one defect) the list is exactly that clause's problem. The walk covers at run time what `orv158-type` covers at compile time, because a cast or an `any` can silence a type.

- **orv158-pins.** The test pins the two sets whose loss would leak data: the `table.column` keys tagged `secret` and those tagged `personal` each equal, as sets, the rows of `orv158-tags` with that tag (6 and 21 at `eeb2e71`; 6 and 22 once `ai_usage` is in). It also checks decision 9's examples one by one: `user.email`, `user.name` and `session.ipAddress` are `personal`; `session.token`, `account.accessToken`, `account.refreshToken` and `account.idToken` are `secret`.
- **orv158-export.** `classification.ts` sits at the path decision 9 names but is not re-exported by `schema/index.ts`, so the drizzle `schema` object of `client.ts` and the input of `drizzle.config.ts` stay tables and relations only, and `classification.ts` can read the barrel's types without an import cycle. The package root, `packages/db/src/index.ts`, gains one line exporting `CLASSIFICATION`, `TAGS` and `Tag` for the masking item to consume. No new subpath in `package.json` (open question 4).
- **orv158-rebase.** PR 141 (ORV-121, `feature/ORV-121-ai-spend-cap`) adds `ai_usage` and is not merged. Whichever PR lands second adds or reconciles the 8 `ai_usage` entries:
  - If PR 141 lands first, this story's code PR rebases on it and carries the 8 entries with the tags and basis of the `ai_usage` table above, and `orv158-pins`' personal set gains `aiUsage.userId`.
  - If this story lands first, PR 141's rebase fails `pnpm typecheck` on T4 until it adds the same 8 entries, basis comments and pin. ORV-121 spec line 129 already allows this ("or with this story if that file exists by then").

  The second PR's description names this rule and quotes its typecheck and test run.

- **orv158-no-migration.** The story adds no table, column, constraint or SQL. `packages/db/migrations/**` and the four table files are unchanged, so `.github/workflows/migrate.yml` (paths `packages/db/migrations/**`) does not run, and no data moves.
- No UI text, so no Thai or English copy changes and no locale catalog entry.

## Worked examples

Each line is copied from its source and was not run in this task (no shell); the main session runs them.

- **The counts** (`orv158-tags`, `orv158-basis`, `orv158-pins`; rows 1, 2 and 16). Input: the column keys of `auth.ts`, `direction.ts`, `workspace.ts` and `rate-limit.ts` at `eeb2e71`, and of `ai-usage.ts` in ORV-121 tech notes section 2, with the tag and basis of `orv158-tags`. Counts are whole numbers; no rounding. `mismatch` counts entries whose tag is not their basis's tag.

  ```bash
  node -e 'const TAGS=["public","internal","personal","secret"];const B={person:"personal","user-ref":"personal","hashed-subject":"personal","free-text":"personal",credential:"secret","workspace-key":"internal","row-key":"internal",label:"internal",amount:"internal",record:"internal"};const M={user:{id:"personal user-ref",name:"personal person",email:"personal person",emailVerified:"internal record",image:"personal person",createdAt:"internal record",updatedAt:"internal record"},session:{id:"internal row-key",expiresAt:"internal record",token:"secret credential",createdAt:"internal record",updatedAt:"internal record",ipAddress:"personal person",userAgent:"personal person",userId:"personal user-ref",activeOrganizationId:"internal workspace-key"},account:{id:"internal row-key",accountId:"personal person",providerId:"internal record",userId:"personal user-ref",accessToken:"secret credential",refreshToken:"secret credential",idToken:"secret credential",accessTokenExpiresAt:"internal record",refreshTokenExpiresAt:"internal record",scope:"internal record",password:"secret credential",createdAt:"internal record",updatedAt:"internal record"},verification:{id:"internal row-key",identifier:"personal person",value:"secret credential",expiresAt:"internal record",createdAt:"internal record",updatedAt:"internal record"},organization:{id:"internal workspace-key",name:"personal person",slug:"internal record",logo:"internal record",createdAt:"internal record",metadata:"personal free-text"},member:{id:"internal row-key",organizationId:"internal workspace-key",userId:"personal user-ref",role:"internal record",createdAt:"internal record"},invitation:{id:"internal row-key",organizationId:"internal workspace-key",email:"personal person",role:"internal record",status:"internal record",expiresAt:"internal record",createdAt:"internal record",inviterId:"personal user-ref"},project:{id:"internal row-key",workspaceId:"internal workspace-key",name:"internal label",createdBy:"personal user-ref",createdAt:"internal record"},direction:{id:"internal row-key",workspaceId:"internal workspace-key",name:"internal label",createdBy:"personal user-ref",createdAt:"internal record",updatedAt:"internal record"},directionVersion:{id:"internal row-key",directionId:"internal row-key",workspaceId:"internal workspace-key",status:"internal record",number:"internal record",snapshot:"personal free-text",fingerprint:"internal record",createdBy:"personal user-ref",createdAt:"internal record",approvedBy:"personal user-ref",approvedAt:"internal record"},rateLimitCounter:{key:"personal hashed-subject",windowStart:"internal record",windowEnd:"internal record",count:"internal record"}};const A={aiUsage:{id:"internal row-key",workspaceId:"internal workspace-key",userId:"personal user-ref",job:"internal record",model:"internal record",costMicroUsd:"internal amount",currency:"internal amount",createdAt:"internal record"}};const run=(m)=>{const e=Object.values(m).flatMap((t)=>Object.values(t));const tc=Object.fromEntries(TAGS.map((t)=>[t,0]));const bc=Object.fromEntries(Object.keys(B).map((b)=>[b,0]));let bad=0;for(const v of e){const [t,b]=v.split(" ");tc[t]++;bc[b]++;if(B[b]!==t)bad++}return [Object.keys(m).length+" "+e.length,JSON.stringify(tc),JSON.stringify(bc),"mismatch "+bad]};console.log(run(M).join("\n"));console.log(run({...M,...A}).slice(0,2).join("\n"))'
  # expected:
  # 11 80
  # {"public":0,"internal":53,"personal":21,"secret":6}
  # {"person":9,"user-ref":9,"hashed-subject":1,"free-text":2,"credential":6,"workspace-key":7,"row-key":9,"label":2,"amount":0,"record":35}
  # mismatch 0
  # 12 88
  # {"public":0,"internal":60,"personal":22,"secret":6}
  ```

- **The walk** (`orv158-walk`, rows 1 and 10 to 14). Input: the 4 column keys of `rateLimitCounter` in `rate-limit.ts` lines 11 to 14 with their tags from `orv158-tags`, then one defect per clause. No rounding.

  ```bash
  node -e 'const TAGS=["public","internal","personal","secret"];const compare=(tables,map)=>{const p=[];for(const t of Object.keys(tables))if(!(t in map))p.push("W1 "+t);for(const t of Object.keys(map))if(!(t in tables))p.push("W2 "+t);for(const [t,cols] of Object.entries(tables)){if(!(t in map))continue;const m=map[t];for(const c of cols)if(!(c in m))p.push("W3 "+t+"."+c);for(const [c,tag] of Object.entries(m)){if(!cols.includes(c))p.push("W4 "+t+"."+c);else if(!TAGS.includes(tag))p.push("W5 "+t+"."+c)}}return p};const T={rateLimitCounter:["key","windowStart","windowEnd","count"]};const R={key:"personal",windowStart:"internal",windowEnd:"internal",count:"internal"};const {count,...noCount}=R;const cases={real:[T,{rateLimitCounter:R}],W1:[{...T,aiUsage:["id"]},{rateLimitCounter:R}],W2:[T,{rateLimitCounter:R,ghost:{id:"internal"}}],W3:[T,{rateLimitCounter:noCount}],W4:[T,{rateLimitCounter:{...R,hits:"internal"}}],W5:[T,{rateLimitCounter:{...R,count:"confidential"}}]};for(const [k,[t,m]] of Object.entries(cases))console.log(k,JSON.stringify(compare(t,m)))'
  # expected:
  # real []
  # W1 ["W1 aiUsage"]
  # W2 ["W2 ghost"]
  # W3 ["W3 rateLimitCounter.count"]
  # W4 ["W4 rateLimitCounter.hits"]
  # W5 ["W5 rateLimitCounter.count"]
  ```

- **The basis line** (`orv158-basis`, row 2). Input: the line form of `orv158-basis` and four sample lines in that form. No rounding.

  ```bash
  node -e 'const re=/^[ \t]+[A-Za-z]+: "(public|internal|personal|secret)", \/\/ (person|user-ref|hashed-subject|free-text|credential|workspace-key|row-key|label|amount|record)$/;for (const l of ["    email: \"personal\", // person","    token: \"secret\", // credential","    email: \"personal\",","    email: \"personal\", // persons","    email: \"confidential\", // person"]) console.log(re.test(l))'
  # expected:
  # true
  # true
  # false
  # false
  # false
  ```

- **The write paths** (`orv158-hold`; the `organization.slug`, `logo` and `metadata` rows of `orv158-tags`, row 16). Input: each column's write paths with the source line each is copied from (`config.ts` lines 23 and 62; `crud-org.mjs` lines 13, 14, 16 and 17; the email OTP plugin's `routes.mjs` line 142). A path that writes a person's data gives `person`, one with a named purpose gives that purpose's basis, any other gives `free-text`; the more guarded tag wins. No rounding.

  ```bash
  node -e 'const B={person:"personal","free-text":"personal",label:"internal",record:"internal"};const rank={internal:1,personal:2};const hold=(paths)=>paths.map((p)=>p.personData?"person":p.purpose?p.basis:"free-text").map((b)=>[b,B[b]]).sort((x,y)=>rank[y[1]]-rank[x[1]])[0].join(" ");const C={"organization.name":[{src:"config.ts:62 user.name || user.email",personData:true},{src:"crud-org.mjs:13 z.string().min(1)",purpose:"workspace name",basis:"label"}],"organization.slug":[{src:"config.ts:23 ws- and the id",purpose:"URL key",basis:"record"},{src:"crud-org.mjs:14 z.string().min(1)",purpose:"URL key",basis:"record"}],"organization.logo":[{src:"crud-org.mjs:16 z.string()",purpose:"image URL",basis:"record"}],"organization.metadata":[{src:"crud-org.mjs:17 z.record(z.string(), z.any())"}],"verification.identifier":[{src:"email-otp/routes.mjs:142 the email",personData:true}],"project.name":[{src:"a person names a project",purpose:"project name",basis:"label"}]};for(const [k,v] of Object.entries(C))console.log(k,hold(v))'
  # expected:
  # organization.name person personal
  # organization.slug record internal
  # organization.logo record internal
  # organization.metadata free-text personal
  # verification.identifier person personal
  # project.name label internal
  ```

- **The size** ("Impact list", Size). Input: the estimate per file of the code PR, each rounded to tens: `classification.ts` 120 (88 entry lines, 12 table lines, the type and `TAGS`), `classification.test.ts` 130, the T1 to T5 fixtures 40, `src/index.ts` and the docs of "Impact list", "Docs" 10. The sum adds no rounding.

  ```bash
  node -e 'const S={classification:120,test:130,fixtures:40,exportAndDocs:10};console.log(Object.values(S).reduce((a,b)=>a+b,0))'
  # expected: 300
  ```

## Out of scope

- The mask helper, the unmask permission and its log line (ADR 0015 decision 8), masking in prompts (decision 3, LLM02:2026) and in log lines (decision 6). The tags have no consumer in this story.
- The unmasked values `/account` shows today: the email (`apps/web/app/account/page.tsx` lines 43 and 68) and the workspace name (line 69), which can be the person's name or email (`orv158-tags`, `organization.name`). The masking item takes them.
- The money rule of ADR 0015 decision 12 (bigint and a currency column beside each amount); PR 141's `packages/db/src/schema.test.ts` carries it.
- A tag per field inside `directionVersion.snapshot`; the column has one tag.
- A drift check between the TypeScript schema and the latest migration snapshot; a follow-up issue (open question 7).
- Any schema, migration or data change (`orv158-no-migration`), any retention rule, any `public` column, and any claim of PDPA compliance.
- ORV-113's other items (404 not 403, the page axe scan, the LLM guardrail set).

## Impact list

- **Contract change: the schema's classification.** New `packages/db/src/schema/classification.ts` (`CLASSIFICATION`, `TAGS`, `Tag`, the `Classification` type), its test `classification.test.ts`, and the T1 to T5 fixtures (file named in the tech notes). A table or column added later joins `orv158-tags` and the map in the same PR; `orv158-type` makes `pnpm typecheck` force it. v1.1 changes one tag in this contract: `organization.metadata` from `internal` (`record`) to `personal` (`free-text`), so the `personal` set of `orv158-pins` gains one key; the masking item (decision 8) masks it by default.
- **Package export surface.** `packages/db/src/index.ts` gains one export line (`orv158-export`). Unchanged: `schema/index.ts`, `client.ts`, `drizzle.config.ts`, `package.json` `exports`.
- **Size.** About 300 changed lines with tests (worked example "The size"), under the 400 line mark.
- **Slices.** (1) A docs PR: this spec and `docs/specs/ORV-158/tech.md` by `ds-architect` (the `Classification` type's shape, the fixture file and one mutation per T clause, the walk's function), with G1 and G2. (2) One code PR into `develop` by the builder, with `security`, `reviewer` and `qa` in one round (ORV-146), then the G3 packet.
- **Docs**, each brought up to date in the code PR:
  - ADR 0015 decision 9: a dated paragraph `Addition, <date> (ORV-158).` after its Confirmation line (line 145 at `eeb2e71`) saying the map and its checks exist and which tests confirm the decision; the old line stays as the record, as the Addition at line 97 does.
  - ADR 0015 "Not done yet": a dated paragraph `Addition, <date> (ORV-158).` after the list, never a rewrite of the bullet "Error envelope, PDPA masking, classification tags, uploads, money" (line 189 at `eeb2e71`) saying classification tags now have code and checks. ORV-144 spec v1.2 also waits to update that bullet after its merge; the PR that edits it second re-reads the merged ADR, and PR 141 adds Additions to the same file.
  - `docs/specs/ORV-112/tech.md` line 149: its "When `classification.ts` lands (ORV-113)" note is met by ORV-158, with the same tags.
  - `docs/specs/ORV-121/tech.md` line 105 and `spec.md` line 129 (on PR 141's branch; untracked in this checkout): the tags agree with `orv158-tags`; the PR that lands second, by `orv158-rebase`, notes ORV-158 there.
  - `.claude/rules/security.md` rule 11: unchanged under open question 1's default; option (b) or (c) changes it.
- **`security` role** is dispatched on each PR (`packages/db/**`).

## Open questions

Each has a default. Under the owner's delegation (ADR 0012 decision 4) G1 and G2 pass on the defaults, except question 1, which is the owner's; this spec is written on its default, and the column "Impact" names what another answer changes.

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | The parent issue names six categories (personal data, secret or token, AI content, money, workspace key, plain); ADR 0015 decision 9 decided four tags (`public`, `internal`, `personal`, `secret`). Which does the map carry? | (a) The four tags as the typed value; each column's basis (`orv158-basis`) is a line comment, and each of the six categories is one or more basis ids (the table's last column). (b) The four tags plus a second typed, tested field per column from a closed list of the six categories; a format change to decision 9 by a dated Addition, and security.md rule 11 changes. (c) Six tags in place of the four; supersedes decision 9 with a new ADR | (a) keeps decision 9 as decided; the six categories are readable and counted by grep but not typed. (b) makes the categories testable, doubles each entry and changes a decided format. (c) leaves decision 8 without its `personal` key and gives AI content and money no masking rule | (a), recommended; the owner decides |
| 2 | Are user id columns `personal` or `internal`? (`user.id`, `session.userId`, `account.userId`, `member.userId`, `invitation.inviterId`, `project.createdBy`, `direction.createdBy`, `directionVersion.createdBy`, `directionVersion.approvedBy`, and `aiUsage.userId`) | (a) `personal`, basis `user-ref`; (b) `internal`, as random ids | (a) agrees with ORV-121 tech notes line 105 and ORV-112 tech notes line 149, which treat a user id as pointing at a person; the masking item then masks ids in lists and exports (`packages/auth/src/log.ts` carries no user id today). (b) contradicts both notes | (a) |
| 3 | Are `project.name` and `direction.name` `internal` or `personal`? | (a) `internal`, basis `label`; (b) `personal`, as free text | (b) masks every project and direction name in lists by default | (a); a label that names a person is the masking item's question |
| 4 | Where is the map exported? | (a) The package root, not the schema barrel (`orv158-export`); (b) the schema barrel; (c) a `./classification` subpath, server only | (b) puts a non-table value in drizzle's `schema` object and drizzle-kit's input, and a type cycle. (c) adds a `package.json` export; the column names are already public through the root's schema export | (a) |
| 5 | Does the test pin the `secret` and `personal` sets (`orv158-pins`)? | (a) Yes; (b) the type and the walk only | (b) lets a column move from `secret` to `internal` with no red test | (a) |
| 6 | What is G4 evidence for a story with no UI? | (a) The CI run on `main` that holds the merge, by run id, with `classification.test.ts` passing in its log, and `pnpm --filter @orivilo/db test` on the `main` checkout; (b) skip G4 | ADR 0012 asks lane L for the acceptance criteria walked on staging; there is no page to walk | (a) |
| 7 | Is a check that the schema matches the latest migration snapshot part of this story? | (a) A follow-up issue; it reads the last `_journal.json` entry, not `0005` by name; (b) in this story | (b) adds a second check outside decision 9 and breaks when PR 141 adds `0006` and `0007` unless it reads the journal | (a) |
| 8 | `verification.identifier` holds OAuth state under today's Google sign-in. Tag it by today's use or by what it can hold? | (a) By what it can hold: `personal`, as Better Auth's email OTP plugin stores the email there; (b) `internal` until such a plugin is enabled | (b) needs someone to retag it the day a plugin is turned on, and no check would catch the miss | (a) |

## Depends on

ADR 0015 decision 9 (the tags and the file), decisions 2 (`security` role), 3, 6 and 8 (the consumers), 12 (money, out of scope), 13 (no conformance claim); `.claude/rules/security.md` rule 11; `.claude/rules/testing.md` (one mutation per clause, L-0042); ADR 0012 decision 4 (G1 and G2 under delegation); ORV-113 (parent; item 4 is this story); ORV-112 tech notes line 149 (`rate_limit_counter` tags); ORV-121 tech notes section 2 and line 105, spec line 129, and PR 141 (`ai_usage`); ORV-144 spec v1.2 (the pending "Not done yet" update); Better Auth 1.7.12 (`auth.ts` line 1; its organization create and update endpoints, `better-auth/dist/plugins/organization/routes/crud-org.mjs` lines 13 to 17 and 161 to 164, for `orv158-hold`); drizzle-orm 0.45.4 (`is`, `PgTable`, `getTableColumns`).

## Changelog

- v1.0 (2026-10-30): first spec, ORV-113 item 4 as its own story (task ORV-158-spec-2; task ORV-158-spec-1 stopped before writing a file). Downstream to review: the ORV-158 Jira issue acceptance (rows 1 to 21), the tech notes (to be written by `ds-architect`: the `Classification` type, the fixture file and the T clause mutations), and the documents under "Impact list", "Docs".
- v1.1 (2026-10-30): the reports on head `1b1255a` (task ORV-158-spec-3). Security ORV-158-security-1 S1 (Important), contract change: `organization.metadata` is retagged from `internal` (`record`) to `personal` (`free-text`), as Better Auth's organization create and update endpoints take any JSON record from a signed-in person; the new rule `orv158-hold` states how a write path sets a tag, the `free-text` row of `orv158-basis` is widened to a record with no named purpose and no shape, the `record` row drops metadata, `orv158-pins` counts become 6 and 21 at `eeb2e71`, 6 and 22 with `ai_usage`, row 16 gains the `organization.metadata` mutation, and "The counts" expects internal 53 and 60, personal 21 and 22, `free-text` 2, `record` 35. Security ORV-158-security-1 S2 (Suggestion), no contract change: the `organization.slug` note no longer says "made from the id" alone, and the `slug` and `logo` notes name the client write path and point at `orv158-hold`, second case, for why both stay `internal`; a worked example "The write paths" is added. QA ORV-158-qa-1 approved with no findings. Downstream to review: `packages/db/src/schema/classification.ts` line 71, the personal pin of `classification.test.ts` (lines 117 to 141), `docs/specs/ORV-158/tech.md` (spec version, rule names, the pin count and mutations, the pin line count), PR 153's description and its G3 packet.
