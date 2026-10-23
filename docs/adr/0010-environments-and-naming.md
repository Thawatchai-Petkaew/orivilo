# ADR 0010: Four environments, one name for each in every system

- Status: accepted
- Date: 2026-10-23
- Decided by: GOLF (owner) set the flow on 2026-10-23 in the project thread (review on a preview, park the work on staging, approve production), chose that Claude merges into staging once CI is green, and asked for global names that match in every system. ORV-66
- Builds on: ADR 0001 (Vercel, Supabase). The split itself is Jira ORV-63, parked until the POC ends.

## Context

Today one Vercel project builds `main` to orivilo.vercel.app, and Vercel labels it "Production" although it is really staging. There is one Supabase database. The Storybook project is called `orivilo-design-system`. The same place has three names depending on which dashboard you look at, and the owner was not sure whether they were testing on production.

## Decision

1. **Four environments, named the same in Vercel, Supabase, GitHub, Jira, docs and code:**

   | Name          | Job                                   | Built from     | Database                |
   | ------------- | ------------------------------------- | -------------- | ----------------------- |
   | `development` | One person's machine                  | Local tree     | Local Postgres          |
   | `preview`     | Review one PR                         | The PR branch  | The staging database    |
   | `staging`     | Hold merged work until it is released | `main`         | `orivilo-db-staging`    |
   | `production`  | Real users                            | A `v*` git tag | `orivilo-db-production` |

2. **Who moves work between them.**
   - A PR gets a preview whenever it changes files a project deploys (`scripts/vercel-ignore.sh`). Its body links the app and Storybook previews.
   - Claude merges into `main` (staging) once CI is green. The owner reviews on the preview or on staging whenever it suits them.
   - Only the owner releases to production, by approving G5. Agents never tag a release or deploy production (AGENTS.md rule 5).
3. **Service names** follow `orivilo-<part>` for a part that serves every environment (`orivilo-web`, `orivilo-storybook`) and `orivilo-<part>-<environment>` for one that exists per environment (`orivilo-db-staging`, `orivilo-db-production`).
4. **Variables keep one name in every environment** and only the value changes (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `OPENROUTER_API_KEY`). The code reads its environment from one variable, `APP_ENV`, with one of the four names above, added by ORV-63. Vercel's own `VERCEL_ENV` says only `preview` or `production` and is not used to tell staging from production.
5. **Domains** are decided in ORV-63: production keeps the public domain and staging gets a `staging.` name. Whether staging is a Vercel custom environment or a second project depends on the plan decision in the CI/CD plan.

## What changes now, and what waits

- Now: this naming in every new doc, PR, Jira issue and script. Previews per PR (ORV-66).
- With ORV-63, after the POC: rename the Vercel projects, split the database, add `APP_ENV`, move the domains, and update Google OAuth redirect URIs. Renaming a domain breaks sign-in until OAuth is updated, which is why it waits.

## Consequences

- "Production" in a dashboard means real users only after ORV-63. Until then, orivilo.vercel.app is staging under every name we write.
- One more variable (`APP_ENV`) to set per environment.
