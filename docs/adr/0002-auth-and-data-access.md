# ADR 0002: Better Auth with server-only data access

- Status: accepted
- Date: 2026-10-21
- Decided by: GOLF (owner), on the recommendation in the project thread

## Context

ORIGO is multi-tenant (workspaces with members and roles) and stores brand assets that customers may consider confidential. Options considered: Supabase Auth with row-level security and client queries, Clerk, Auth.js, Better Auth.

## Decision

- **Better Auth** with the organization plugin for sessions, workspaces, members, invitations, and roles. Data stays in our Postgres; no per-user pricing; TypeScript-first.
- **Only server code touches the database.** No client-side `supabase-js` data queries. Server actions and route handlers call a central authorization helper that resolves the session, the workspace, and the member's role, and denies by default.
- The app connects with a **restricted Postgres role** that cannot bypass row security or change schema. Migrations run with a separate role in CI.
- Row-level security stays enabled on tenant tables as defense in depth, keyed by workspace id.

## Consequences

- One place to audit authorization (the helper) instead of policies spread across client queries.
- We give up Supabase Realtime-from-client convenience; if collaboration needs it later, it gets its own ADR.
