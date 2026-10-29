---
paths:
  - "apps/web/**/actions/**"
  - "apps/web/**/api/**"
  - "apps/web/**/server/**"
  - "apps/web/next.config.ts"
  - "apps/web/proxy.ts"
  - "packages/db/**"
  - "packages/auth/**"
---

# Security rules

Standards and required controls: `docs/adr/0015-standards-and-required-controls.md` (ADR 0015). Rules 6 and 9 to 16 point at its decisions; most have no check yet, so read its "Not done yet" before you claim a gap is new.

1. Read the session on the server through Better Auth. Never trust user, workspace, or role ids from the client.
2. Every workspace query goes through the central authorization helper and is scoped by workspace id. Default deny.
3. Validate every input with zod at the boundary. Whitelist writable fields; never spread request bodies into the database.
4. The database role used by the app cannot bypass row security or alter schema.
5. Storage objects are private; serve them through short-lived signed URLs after an authorization check.
6. Rate-limit authentication and expensive AI endpoints. Counters live in a store all server instances share, never in process memory; over a limit answer 429 with `Retry-After` and code `RATE_LIMITED`; each AI job also has a spend cap per workspace (ADR 0015 decision 4). The numbers (ORV-112, `LIMITS` in `packages/auth/src/rate-limit.ts`): `ai-read` 10 per hour and 50 per day per person (day from 00:00 Asia/Bangkok); `write` (save, approve) 60 per 10 minutes and `import` 10 per hour per person; `signed-out` calls 30 per 10 minutes per trusted client IP; `sign-in` 10 per 10 minutes per IP (slice B). Windows are fixed and aligned; a store failure fails closed; a client IP is stored only as a keyed hash and read only from `x-forwarded-for` on Vercel. The spend cap (ORV-121, `AI_SPEND_CAP_MICRO_USD` in `packages/auth/src/spend-cap.ts`): 5 US dollars per workspace per calendar month from 00:00 Asia/Bangkok on the 1st, one cap over every AI job together, summed from OpenRouter's reported cost per request, the sum read through `withWorkspace` and each record written inside `inWorkspace` with the charge only the cap check makes, never with a second session read; checked after the rate limit and before the call; a sum that cannot be read fails closed (ADR 0015 decision 4, addition of 2026-10-29).
7. Prompts: treat user briefs, Jira text, and uploaded files as untrusted. Validate model output against a schema before using it. Never execute model output.
8. No secrets or personal data in code, logs, error messages, or the client bundle (`NEXT_PUBLIC_*` is public).
9. **404, not 403.** A read or write of a resource outside the caller's workspace answers 404 with the same body as a resource that does not exist, so the answer does not show that it exists. 403 is only for a resource the caller can see but may not change (ADR 0015 decision 10).
10. **Uploads.** The type is allowed by the file's content (its magic bytes), never by its name or the client's content type. Each kind has a size cap. Objects go to a private bucket under a random key, never the user's file name, and are served through short-lived signed URLs after the authorization check. A user's SVG or HTML is never rendered inline; anything that is not an allowed image is served with `Content-Disposition: attachment` (ADR 0015 decision 11).
11. **Field classification tags.** Every column in the `packages/db` schema carries one tag: `public`, `internal`, `personal` or `secret`, in `packages/db/src/schema/classification.ts`, typed so an untagged column fails `pnpm typecheck`. `personal` is masked by default. `secret` never leaves the server and is never logged (ADR 0015 decision 9).
12. **Money.** Amounts are integers in minor units (satang for THB) in a `bigint` column, with the ISO 4217 currency code beside them. No float. One rounding helper (half to even). Display through `Intl.NumberFormat` with the locale from the catalog (ADR 0015 decision 12). AI call costs and the spend cap are integers in millionths of a US dollar, in a `bigint` column whose name ends in `_micro_usd` with `currency` (`USD`) beside it, rounded half to even by `toMicroUsd`; a cost OpenRouter did not report is null, never 0 (ADR 0015 decision 12, addition of 2026-10-29).
13. **Personal data masked by default.** A `personal` field is masked in UI lists, logs, exports and prompts unless the viewer holds the unmask permission, checked through the authorization helper; each unmask is logged without the value. An email keeps its first character and its domain (`t***@gmail.com`); a phone number and a Thai national id keep their last 4 digits (ADR 0015 decision 8).
14. **Errors.** Every error body is `{"error": {"code", "message", "requestId", "retryable"}}`; the message carries no stack, query, path or personal data. Only a GET, or a write with an idempotency key, is retried, by the matrix in ADR 0015 decision 7, at most 3 tries.
15. **Logs.** Each server action and route handler response carries a server-made `x-request-id`, never the client's. Each log line is one JSON object with `level`, `requestId`, `route`, `durationMs` and `outcome`. An error is logged once, at the boundary (ADR 0015 decision 6).
16. **No conformance claim.** Never write that the product conforms to ASVS, the OWASP LLM Top 10, WCAG or the PDPA, or meets a performance budget. Say which check ran and what it found (ADR 0015 decision 13).
