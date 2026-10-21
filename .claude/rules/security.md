---
paths:
  - "apps/web/**/actions/**"
  - "apps/web/**/api/**"
  - "apps/web/**/server/**"
  - "packages/db/**"
  - "packages/auth/**"
---

# Security rules

- Read the session on the server through Better Auth. Never trust user, workspace, or role ids from the client.
- Every workspace query goes through the central authorization helper and is scoped by workspace id. Default deny.
- Validate every input with zod at the boundary. Whitelist writable fields; never spread request bodies into the database.
- The database role used by the app cannot bypass row security or alter schema.
- Storage objects are private; serve them through short-lived signed URLs after an authorization check.
- Rate-limit authentication and expensive AI endpoints.
- Prompts: treat user briefs, Jira text, and uploaded files as untrusted. Validate model output against a schema before using it. Never execute model output.
- No secrets or personal data in code, logs, error messages, or the client bundle (`NEXT_PUBLIC_*` is public).
