---
issue: ORV-38 (draft key E2-15; https://tpetkaew.atlassian.net/browse/ORV-38)
lane: L
version: 1
---

## Why

Everything the Studio makes today lives in the browser and is gone on reload. Saving a direction, refinements and approvals (E2-12) needs people, workspaces and a database that only the right member can read. ADR 0002 decides how: Better Auth with the organization plugin, server-only data access through one authorization helper, a restricted Postgres role, and row security as a second wall.

## Decisions this spec relies on

- ADR 0001: Supabase Postgres in Singapore, Drizzle, Vercel.
- ADR 0002: Better Auth, server-only access, the authorization helper, default deny, a restricted role, row security keyed by workspace.
- The owner created the Supabase project `orivilo` (2026-10-22) with the Data API off, new tables not exposed, and automatic row security on.

## Parts

| Part | Content                                                                                                                       | Status    |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1    | `packages/db`: Drizzle schema for Better Auth and workspaces, migrations, the restricted role's grants, row security policies | This spec |
| 2    | `packages/auth`: Better Auth with the organization plugin; sign up, sign in, sign out; the first workspace on sign up         | This spec |
| 3    | The authorization helper and its default-deny tests; one real read (the workspace's name) through it                          | This spec |

## Story

As a person on the Studio, I want to sign up, get my own workspace, and know that nobody outside it can read what I save, so I can trust it with brand work.

## Environment (set by the owner, never in chat or in git)

| Name                     | Where                               | Value                                                                                          |
| ------------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Vercel (Preview, Production), local | Transaction pooler (port 6543) as `orivilo_app.<project-ref>`, the restricted role             |
| `MIGRATION_DATABASE_URL` | GitHub Actions secret, local only   | Session pooler (port 5432) as `postgres.<project-ref>`; runs migrations, never reaches the app |
| `BETTER_AUTH_SECRET`     | Vercel (Preview, Production), local | 32 random bytes, base64 (`openssl rand -base64 32`)                                            |
| `BETTER_AUTH_URL`        | Vercel (Production), local          | The app's own origin; on a Vercel preview the code derives it from `VERCEL_URL`                |

`.env.example` lists the names with no values. The app refuses to start a request that needs the database when a variable is missing, and says which one, without printing any value.

## Decisions (technical)

- **Two roles.** `orivilo_app` logs in, has `select, insert, update, delete` on app tables and nothing else: no `bypassrls`, no DDL, no ownership. Migrations run as `postgres` from CI or locally. The role is created once by the owner with a password they choose; the grants live in a migration.
- **Row security.** Every tenant table has `workspace_id` and a policy `workspace_id = current_setting('app.workspace_id', true)::uuid`. The helper sets that value with `set_config(..., true)` inside the transaction it opens, so it never leaks across pooled connections. Better Auth's own tables (user, session, account, verification, organization, member, invitation) get a policy for `orivilo_app` only, since auth must read them before a workspace is known.
- **The helper.** `withWorkspace(request, workspaceId, role, fn)` resolves the session, checks membership and the minimum role, opens a transaction, sets `app.workspace_id`, and passes `fn` a typed db handle. Anything else (no session, not a member, role too low, missing id) throws a typed denial that the route turns into 401 or 403. No other module imports the db client; a lint rule enforces it.
- **Sign in.** Email and password first (see the open question). Passwords are hashed by Better Auth (scrypt). Sign-in is rate limited by Better Auth's limiter.

## Acceptance criteria

| #   | Given                                     | When                                       | Then                                                                                     | Evidence                       |
| --- | ----------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | A new email                               | Signing up                                 | An account and a workspace named after the person exist; they are its owner              | Integration test               |
| 2   | A signed-in owner                         | Reading their workspace through the helper | The workspace name comes back                                                            | Integration test, the app page |
| 3   | No session                                | Calling the helper                         | Denied (401); no query ran                                                               | Unit test                      |
| 4   | A member of workspace A                   | Asking for workspace B                     | Denied (403); no query ran                                                               | Integration test               |
| 5   | `orivilo_app` with `app.workspace_id` = A | Selecting rows of workspace B directly     | Zero rows (row security), proving the second wall holds even if the helper were bypassed | Integration test               |
| 6   | `orivilo_app`                             | Running DDL or `set role postgres`         | Refused                                                                                  | Integration test               |
| 7   | Any module but the helper                 | Importing the db client                    | Lint fails                                                                               | Lint rule and its test         |
| 8   | A missing variable                        | A request that needs the database          | A clear error naming the variable, never its value                                       | Unit test                      |
| 9   | Sign-in, sign-up and the workspace page   | Rendered in Thai and English               | Copy from the locale catalogs; no middot or em dash                                      | `check-i18n`, stories          |

Integration tests run against a throwaway Postgres in CI (a service container), with the same migrations and the same two roles; they never touch the owner's project.

## Open question for the owner

- **How do people sign in first?** Default: email and password, with email verification and password reset added when an email provider is chosen. Other options: Google sign-in (needs a Google OAuth client), or a magic link by email (needs an email provider now).

## Out of scope

- Storage buckets and signed URLs (with the first upload story).
- Invitations by email, member management UI (needs an email provider).
- Saving directions, drafts and versions (E2-12).
- A separate production database; for now the project is staging. Production gets its own project before the first tag.

## Changelog

- v1 (2026-10-22): written after the owner created the Supabase project.
