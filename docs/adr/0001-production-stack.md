# ADR 0001: Production stack

- Status: accepted; the AI row is superseded by ADR 0009 (OpenRouter)
- Date: 2026-10-21
- Decided by: GOLF (owner), on the recommendation in the project thread

## Context

ORIVILO needs a production-ready stack that a small team plus AI agents can run, that popular open-source Next.js projects use (so agents and humans find examples), and that keeps the Intent Engine independent of the web framework.

## Decision

| Concern                      | Choice                                                     | Why                                                                                |
| ---------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Repo                         | Turborepo + pnpm workspaces                                | Separates `apps/web` from the pure-TS `packages/intent-engine`; cached tasks in CI |
| App                          | Next.js App Router, React 19, TypeScript strict            | Most common production React stack; server actions keep data access on the server  |
| UI                           | Tailwind CSS v4 + shadcn/ui                                | Components are source we own, which fits a token-driven design system              |
| Validation                   | zod                                                        | One schema for profile contracts, API boundaries, and model output                 |
| Database                     | Supabase Postgres (Singapore region)                       | Managed Postgres with backups, branching, and storage in one place                 |
| ORM                          | Drizzle                                                    | Typed SQL, readable migrations, works with a restricted role                       |
| Storage                      | Supabase Storage, private buckets, signed URLs             | Brand assets and exports                                                           |
| Auth                         | Better Auth with the organization plugin                   | See ADR 0002                                                                       |
| AI                           | Claude API, server-side only                               | Intent interpretation; output validated with zod                                   |
| Tests                        | Vitest (unit, contract), Playwright (e2e, visual fixtures) |                                                                                    |
| Hosting                      | Vercel                                                     | Preview per PR, staging on `main`, production on tag                               |
| Later, when a story needs it | Sentry, PostHog, Trigger.dev or Inngest, Resend, Stripe    | Not installed now (lean rule)                                                      |

Versions are pinned in `package.json` files. This PR installs only the foundation: Turborepo, Next.js, Tailwind, zod, Vitest, ESLint, Prettier. Database, auth, and AI packages arrive with their first stories.

## Consequences

- Vendor coupling to Supabase is limited to Postgres and Storage, both replaceable.
- The Intent Engine must stay framework-free so it can run in jobs, tests, and future CLIs.
