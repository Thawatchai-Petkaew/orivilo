# ADR 0015: Standards and required controls

- Status: proposed. It becomes accepted when two things hold: the `research` knowledge entry that confirms the pinned versions, the source URLs, the Core Web Vitals thresholds and the PDPA source exists with confidence 0.7 or more (spec ORV-108 decision 9), and slice B of ORV-108 merges into `develop`. Until then no decision here may be cited as decided.
- Date: 2026-10-25
- Decided by: the owner chose the standards and their pinned versions (ORV-108 comment 10158, decision 9), the adopted controls from the surveys (comment 10160) and the rate limit control (comment 10163); the `architect` role wrote the controls from spec ORV-108 v2, task `ORV-108-adr-1`.
- Builds on: ADR 0002 (auth and server-only data access), ADR 0009 (AI through OpenRouter), ADR 0013 (the `/ovl` orchestrator). None is superseded.
- Amends: ADR 0013 decision 3 (roles), see decision 2 below. ADR 0013 is merged and is not rewritten; its Status line points here.

## Context

Product work is about to start. Until now nothing in the repo names a standard the team checks against, so "secure", "accessible" or "fast" in a report has no yardstick, and a reviewer has nothing to cite. Two surveys (allkons, Camp Vibe) and the owner's decisions on ORV-108 picked the standards and a short list of controls every product story must meet.

Three facts shape how this ADR is written:

- **Naming a standard certifies nothing.** A requirement counts as met only when a check that ran backs it (ADR 0013, Context). So every control below says which role and which check covers it today, or `not covered yet`.
- **Most controls have no code yet.** Request ids, the error envelope, masking, classification tags, rate limits and budgets are named here and land with the story that first needs them (spec ORV-108, Out of scope).
- **One AI path exists today.** `readBriefWithAi` in `apps/web/app/directions/actions.ts` calls the `interpret` model through `openRouterComplete` (`packages/intent-engine/src/openrouter.ts`) and checks the answer with `llmInterpreter` and `interpretBrief`. Every other reading is by rules.

How to read each decision: "Covered today" names a role and a check that runs now. A `Confirmation:` line names the check or review that fails when the decision is broken, or says `not confirmed yet` with the follow-up that adds one. A follow-up written as "the story that ..." has no Jira key yet; the main session raises it.

## Decision

### 1. Three standards to check against

| Standard                                                | Version and level | Source                                                                      | Role that checks       | Check that runs today                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OWASP Application Security Verification Standard (ASVS) | 5.0.0, Level 2    | <https://owasp.org/www-project-application-security-verification-standard/> | `security`, `reviewer` | None against ASVS itself. Related checks: `pnpm audit --prod --audit-level high` (blocking); `scan:secrets` and `scan:code` (report mode from slice B); the `access.test.ts` tests of `withWorkspace`                                                                                                                                                                                            |
| OWASP Top 10 for LLM Applications                       | 2025 edition      | <https://genai.owasp.org/llm-top-10/>                                       | `security`, `reviewer` | Tests in `packages/intent-engine/src/llm-interpreter.test.ts` and `interpreter.test.ts` for LLM01 (the brief goes only in the user message), LLM05 (strict schema, quotes must be in the brief, a wrong method or adapter is refused) and LLM10 in part (no fallback model). See "Not done yet" for the rest                                                                                     |
| Web Content Accessibility Guidelines (WCAG)             | 2.2, Level AA     | <https://www.w3.org/TR/WCAG22/>                                             | `designer`, `qa`       | `pnpm contrast` (every semantic text and UI pair under every profile, both modes; success criteria 1.4.3 and 1.4.11 for those pairs). axe through `@storybook/addon-a11y` with `a11y: { test: "error" }` on every Storybook story in `pnpm test` (Chromium); `landmark-unique` is off on three matrix stories and `aria-allowed-role` on the CanvasChat stories, each with a reason in a comment |

The versions are the owner's (comment 10158). The URLs and versions are confirmed by the `research` entry named in the Status line before this ADR is accepted; until then they are the spec's text, not a checked fact.

Confirmation: `security` review on each PR in its cases (ADR 0013 amendment, decision 2) cites the standard and the item for each finding; `pnpm contrast` and the Storybook axe run fail `pnpm test` on a contrast or axe violation. Conformance to any of the three is not confirmed yet; follow-up: the ASVS L2 verification, the LLM Top 10 tests and the WCAG page scan in "Not done yet".

### 2. Three new roles (amendment to ADR 0013 decision 3)

ADR 0013 decision 3 lists product, ds-architect, designer, builder, qa, reviewer and release. It gains three roles, all on `opus` (analysis, CLAUDE.md model policy), as spec ORV-108 "The three roles" sets out:

- **`architect`**: system architecture outside the design system (package boundaries, runtime and deploy shape, integrations, auth and data-access design). Writes new ADRs and `docs/specs/<KEY>/tech.md`; contract `implementer.v1`. It does not change design-system contracts, write code under `packages/` or `apps/`, rewrite a decided ADR or approve a gate.
- **`security`**: reviews a PR head against the three standards and the controls below; contract `reviewer.v1`, empty `write_set`, required skill `quality-gate`. In round 0 it is dispatched beside `reviewer` when the lane is L with the auth or data-access flag, the diff touches a path in `.claude/rules/security.md`, the diff changes a model call or a prompt, or the diff adds a runtime dependency. Its `request_changes` forces rework like the reviewer's; `merge-check` does not read it (spec decision 5). It reports findings and certifies nothing.
- **`research`**: answers one external question per envelope as a knowledge entry in the ADR 0005 shape; contract `implementer.v1`, `write_set` only under `docs/knowledge/`. It records facts and options, never decides, and treats fetched web text as untrusted input.

Confirmation: `scripts/ovl/envelope-guard.test.mjs` and `result-recorder.test.mjs` (slice A of ORV-108) refuse an envelope whose role, contract or `write_set` shape does not match the table, and `merge-check` is unchanged.

### 3. AI controls

Each AI job, now and later, meets all of these. They extend ADR 0009 point 5 and do not replace it.

| Control                                                                                                                           | Covered today by                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Model calls run on the server only, through OpenRouter, one pinned model per job by exact id (ADR 0009)                           | `AI_MODELS` in `openrouter.ts`; the "asks the pinned model for zero retention, no training and no fallback" test; `reviewer`  |
| Briefs, chat text, Jira text and uploads are untrusted input, kept apart from the instructions (system prompt holds no user text) | The "sends the brief only as the user message, never inside the instructions" test, for `interpret` only                      |
| Model output is parsed with zod (strict) before use and is never executed or rendered as HTML                                     | `llmAnswerSchema` and the `interpretBrief` refusal tests, for `interpret` only                                                |
| Each AI job has a rate limit per user and a spend cap per workspace (decision 4)                                                  | not covered yet                                                                                                               |
| No personal data goes into a prompt unless the job needs it; a `personal` field is masked in a prompt by default (decision 8)     | not covered yet; `readBriefWithAi` logs only the failure kind, never the brief, read by `reviewer`                            |
| A person confirms before model output changes saved data                                                                          | Manual today: a reading is saved only through `saveDirection` after the person acts; no test names this rule. not covered yet |
| AI output is labelled as AI in the UI, with the model                                                                             | `byAi: "Read by AI ({model})"` in the locale catalog and the "labelled as AI with its model" test                             |

Confirmation: the tests named in the table fail `pnpm test` when the `interpret` path breaks its row. For the rows marked `not covered yet`, and for every AI job other than `interpret`, not confirmed yet; follow-up: the story that adds each job carries a test per row, and `security` is dispatched on it (decision 2, "changes a model call or a prompt").

### 4. Rate limit and abuse

- **What is limited.** Sign-in and every AI job (the existing rule in `.claude/rules/security.md`), plus any route that writes to Storage. Each AI job has a limit per user per window and a spend cap per workspace per calendar month in US dollars, counted from OpenRouter's reported usage.
- **Where counters live.** In a store every server instance shares. A counter in process memory does not hold on Vercel functions, which run as many short-lived instances. The default is a Postgres table through the restricted app role, so no new service; a different store needs an addition to this ADR.
- **The answer.** Over a rate limit: status 429, `Retry-After` in seconds, error code `RATE_LIMITED`, `retryable: true` (decision 7). Over the spend cap: the job is not called; where the job has a rule-based fallback (ADR 0009 point 3) the caller keeps it and the UI says so, otherwise 429 with code `AI_SPEND_CAP` and `retryable: false`. The body's `retryable` wins over the status default.
- **The numbers** (requests per window, the window, the cap) are the ones in ORV-108 comment 10163 where it sets them; where it does not, the story that builds the limiter proposes them and records them here as an addition.

Confirmation: not confirmed yet; follow-up: the story that adds the limiter, with a test that the 3rd call over a limit of 2 answers 429 with `Retry-After`, and one that a capped workspace gets the rules' reading without a model call.

### 5. Performance budgets

- **Core Web Vitals**, at the 75th percentile of page loads, split by mobile and desktop: Largest Contentful Paint 2.5 s or less, Interaction to Next Paint 200 ms or less, Cumulative Layout Shift 0.1 or less. These are the "good" thresholds at <https://web.dev/articles/vitals>.
- **Bundle budget.** Each `apps/web` route has a budget for the JavaScript it sends on first load, compressed, read from the production build. The number per route is set from the first baseline measurement on `develop` and recorded here as an addition; a route over its budget fails the check that story adds.
- **Nothing measures either yet.** No report, packet or UI may claim the product meets a Core Web Vital or a bundle budget.

Confirmation: not confirmed yet; follow-up: the story that adds a build-output budget check to `pnpm quality-gate` and CI, and later a field measurement (Vercel Speed Insights or similar, which needs its own decision since it is a service).

### 6. Observability

- **Request id.** Each server action and route handler response carries `x-request-id`. The server makes it (a random id per request); a value sent by the client is never trusted or reused. The same id goes in every log line for that request and in the error body (decision 7).
- **Log lines.** One JSON object per line with at least `level`, `requestId`, `route`, `durationMs` and `outcome`. No secret and no personal data in a log line: a `secret` field is never logged, a `personal` field only in its masked form (decision 8).
- **One log per error.** An error is logged once, at the boundary (the server action or route handler), not at each layer it passes.

Today `readBriefWithAi` logs with `console.error` and a plain string, without a request id. That is the known gap.

Confirmation: not confirmed yet; follow-up: the story that adds the request id and the logger, with a test that a response carries `x-request-id`, that the log line parses as JSON with the five fields, and that a seeded email and token never appear in it.

### 7. API error envelope and retry matrix

Every error response body is:

```json
{
  "error": {
    "code": "<UPPER_SNAKE>",
    "message": "<safe text>",
    "requestId": "<id>",
    "retryable": false
  }
}
```

- `code` is from a closed list kept beside the helper that builds the body; the UI maps it to a catalog string, so the message the person reads is in Thai and English.
- `message` never carries a stack, a query, a file path or personal data.
- Only a GET, or a write that carries an idempotency key, is retried automatically. Any other write is shown to the person and never retried by the client.

| Status                            | Retryable | Client does                                                  |
| --------------------------------- | --------- | ------------------------------------------------------------ |
| 400, 401, 403, 404, 409, 413, 422 | no        | Show the message; the user fixes the input or signs in again |
| 408, 429                          | yes       | Wait for `Retry-After`, or 1 s without it; at most 3 tries   |
| 500                               | no        | Show the message and the requestId; no automatic retry       |
| 502, 503, 504                     | yes       | Back off 0.5 s, 1 s, 2 s with jitter; at most 3 tries        |
| network error, no response        | yes       | Same as 502, 503, 504                                        |

The matrix is the default per status; a body with `retryable: false` is not retried whatever its status (decision 4, spend cap). Server actions that return an outcome object instead of an HTTP error (as `apps/web/app/directions/actions.ts` does today) carry the same `code`, `requestId` and `retryable` fields in it.

Confirmation: not confirmed yet; follow-up: the story that adds the error helper and the client retry, with a test per matrix row and a test that a thrown error's stack and a seeded email do not reach the body.

### 8. Personal data (PDPA): masked by default

- Thailand's Personal Data Protection Act B.E. 2562 (2019) applies to the people whose data the product holds. Source: the Royal Thai Government Gazette text, <https://ratchakitcha.soc.go.th/DATA/PDF/2562/A/069/T_0052.PDF>, confirmed by the `research` entry in the Status line.
- **Masking is the default.** A field classified `personal` (decision 9) is masked in UI lists, logs, exports and prompts unless the viewer holds a permission that unmasks it. The permission is checked through the central authorization helper. Each unmask is logged with the viewer, the field and the time, never the value.
- **Masked forms.** An email keeps its first character and its domain (`t***@gmail.com`). A phone number keeps its last 4 digits. A Thai national id keeps its last 4 digits.
- These are engineering defaults, not legal advice. Nothing here claims PDPA compliance, and no UI or report may say the product is PDPA compliant.

Confirmation: not confirmed yet; follow-up: the story that adds the mask helper and the unmask permission, with a test per masked form, a test that a list without the permission shows only masked values, and a test that an unmask writes a log line.

### 9. Field classification tags

- Every column in the `packages/db` schema carries one tag: `public`, `internal`, `personal` or `secret`.
- **Format.** One file, `packages/db/src/schema/classification.ts`, exports `CLASSIFICATION`, a map from each table to each of its columns to its tag, typed with `satisfies` against the Drizzle table types so a column without a tag fails `pnpm typecheck`. A map beside the tables, not a comment on each column, because `packages/db/src/schema/auth.ts` is generated by Better Auth ("Regenerate rather than edit") and a regeneration would drop inline tags.
- `personal` is masked by default (decision 8), for example `user.email`, `user.name`, `session.ipAddress`. `secret` never leaves the server and is never logged, for example `session.token`, `account.accessToken`, `account.refreshToken`, `account.idToken`.

Confirmation: not confirmed yet; follow-up: the story that adds `classification.ts`, with `pnpm typecheck` failing on an untagged column and a test that walks every exported table with `getTableColumns` and finds a tag for each.

### 10. 404, not 403

A read or write of a resource outside the caller's workspace answers 404 with the same body as a resource that does not exist, so the answer does not show that it exists. 403 is only for a resource the caller can see but may not change (for example a role too low to edit).

Today `withWorkspace` in `packages/auth/src/access.ts` throws `Denied(403, "not-a-member")` for a workspace the caller is not a member of, and `Denied(403, "no-workspace")`. Under this rule the first answers 404 at the boundary. This is the one known gap, and the story that changes it is an L lane change (auth and data access).

Confirmation: not confirmed yet; follow-up: the story that maps `not-a-member` to 404, with a test in `access.test.ts` that a direction in another workspace and a direction id that does not exist give the same status and body.

### 11. Uploads

- The type is allowed by the file's content (its magic bytes), never by its name or the client's content type.
- Each kind has a size cap, set by the story that adds the kind, and checked before the bytes are stored.
- Objects go to a private bucket under a random key, never the user's file name, and are served through short-lived signed URLs after the authorization check (ADR 0002).
- A user's SVG or HTML is never rendered inline. Anything that is not an allowed raster image is served with `Content-Disposition: attachment`.

No upload path exists today.

Confirmation: not confirmed yet; follow-up: the first upload story, with a test that a PNG renamed `.svg` and an SVG renamed `.png` are each judged by content, that an object key holds no part of the file name, and that an SVG response carries `Content-Disposition: attachment`.

### 12. Money

Amounts are integers in minor units (satang for THB) in a `bigint` column, with the ISO 4217 currency code in a column beside them. No float, in the database or in TypeScript (`bigint` or an integer `number` checked with `Number.isSafeInteger`). One rounding helper, half to even. Display through `Intl.NumberFormat` with the locale from the catalog.

No money column exists today.

Confirmation: not confirmed yet; follow-up: the first story that stores an amount, with a test of the rounding helper on halves (0.5, 1.5, 2.5 satang) and a schema test that every amount column has a currency column beside it.

### 13. No conformance claim

No UI text, report, gate packet or PR may say the product conforms to ASVS, the LLM Top 10, WCAG or the PDPA, or meets a performance budget. A report may say which check ran and what it found.

Confirmation: `reviewer` and `security` read each PR for such a claim (AGENTS.md iron rule 4); no automated check yet.

## Not done yet

- **ASVS 5.0.0 Level 2:** no requirement-by-requirement verification, no penetration test, no threat model. The scans are pattern rules in report mode; a clean scan is not a security claim.
- **OWASP LLM Top 10 2025:** one path calls a model today (`readBriefWithAi`, job `interpret`). Tests exist for LLM01 in part (brief only in the user message), LLM05 (strict schema and quote check) and LLM10 in part (no fallback). No test exists for LLM02 (sensitive information disclosure), LLM03 (supply chain), LLM04 (data and model poisoning), LLM06 (excessive agency), LLM07 (system prompt leakage), LLM08 (vector and embedding weaknesses; no retrieval exists), LLM09 (misinformation), and LLM10 has no rate limit or spend cap (decision 4). No adversarial prompt set exists.
- **WCAG 2.2 AA:** automated checks are `pnpm contrast` for semantic text and UI pairs and axe on Storybook stories. axe finds only part of WCAG. No axe scan runs on `apps/web` pages, no keyboard walk is recorded, no screen reader pass is done, and success criteria such as 2.4.11 (focus not obscured) and 2.5.8 (target size) have no check.
- **Performance:** nothing measures Core Web Vitals or bundle size (decision 5).
- **Observability, error envelope, PDPA masking, classification tags, rate limit, uploads, money:** named here, no code and no check (decisions 4 and 6 to 12).
- **404 not 403:** `withWorkspace` answers 403 for a non-member today (decision 10).
- **Privacy notice:** ADR 0009 requires it to name OpenRouter and each model host before real customers use AI features. Not written.

## Consequences

- Every product story has a list to be checked against, and a reviewer can cite "ADR 0015 decision 7" instead of a preference.
- Most controls are promises until their story lands. The "Not done yet" list is the honest state, and the `security` role reads it before claiming a gap is new.
- Stories that add an AI job, an upload, a money field or a new table carry more tests than before (one per row of the decision they touch).
- 404 instead of 403 for non-members changes an auth answer; that story is L lane.
- Rate-limit counters in Postgres add a write per limited request. If that shows in latency, a shared cache is a later addition with its own cost.
- The standards are pinned. When OWASP or W3C publishes a new version, moving to it is a new ADR.

## Not chosen

- **Certifying against a standard** (an ASVS audit, a WCAG conformance statement). Out of scope for ORV-108; it needs a human audit and evidence this team does not yet produce.
- **ASVS Level 1.** Too thin for a multi-tenant product that holds confidential brand assets; Level 3 is for high-assurance systems and costs more than this product needs now.
- **A paid observability or rate-limit service** (Sentry, Datadog, Upstash). No new paid service in ORV-108; the defaults above need none. Each can be proposed later in its own ADR.
- **Inline tags on each column.** Lost on the next Better Auth schema regeneration (decision 9).
- **Floats or decimal strings for money.** Floats lose satang; decimal strings push parsing into every caller.
- **403 for non-members.** It tells a caller that a resource exists in another workspace.

## What this changes in earlier docs

- **ADR 0013, decision 3.** Read it with the three roles in decision 2 above. ADR 0013's Status line gains one sentence that points here; nothing else in it changes.
- **ADR 0009, point 5.** The AI controls in decision 3 extend it. ADR 0009 is not rewritten.
- **`.claude/rules/security.md`.** Gains the rules of decisions 4 and 6 to 13, each pointing here, as numbered rules 6 and 9 to 16, and the paths `apps/web/next.config.ts` and `apps/web/proxy.ts`.
- **Spec ORV-108 v2, AC row 14.** It says no automated axe scan runs. axe does run on every Storybook story (`packages/design-system/.storybook/preview.tsx`, `a11y: { test: "error" }`); none runs on `apps/web` pages. This ADR records the observed state; the spec's next version should match it.
