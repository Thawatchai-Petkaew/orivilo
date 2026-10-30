# ADR 0015: Standards and required controls

- Status: accepted, 2026-10-25. The draft waited on a `research` entry for the versions, URLs, thresholds and PDPA source at confidence 0.7 or more (spec ORV-108 decision 9). Two entries now carry them: [[K-0013-pinned-standards-versions-and-sources]] (confidence 0.75) and [[K-0014-owasp-llm-top-10-2026-items-and-changes]] (confidence 0.8). The draft's second condition, slice B merged into `develop`, is met by landing this ADR in the same ORV-108 PR as slice B, not before it.
- Date: 2026-10-25
- Decided by: the owner chose the standards and their pinned versions (ORV-108 comment 10158, decision 9), the adopted controls from the surveys (comment 10160) and the rate limit control (comment 10163). Moving the LLM Top 10 pin from the 2025 to the 2026 edition is decided under the owner's delegation (ORV-108 comment 10164). The `architect` role wrote the controls from spec ORV-108 v2 (tasks `ORV-108-adr-1` and `ORV-108-adr-2`).
- Builds on: ADR 0002 (auth and server-only data access), ADR 0009 (AI through OpenRouter), ADR 0013 (the `/ovl` orchestrator). None is superseded.
- Amends: ADR 0013 decision 3 (roles), see decision 2 below. ADR 0013 is merged and is not rewritten; its Status line points here.

## Context

Product work is about to start. Until now nothing in the repo names a standard the team checks against, so "secure", "accessible" or "fast" in a report has no yardstick, and a reviewer has nothing to cite. Two surveys (allkons, Camp Vibe) and the owner's decisions on ORV-108 picked the standards and a short list of controls every product story must meet.

Three facts shape how this ADR is written:

- **Naming a standard certifies nothing.** A requirement counts as met only when a check that ran backs it (ADR 0013, Context). So every control below says which role and which check covers it today, or `not covered yet`.
- **Most controls have no code yet.** Request ids, the error envelope, masking, classification tags, rate limits and budgets are named here and land with the story that first needs them (spec ORV-108, Out of scope).
- **One AI path exists today.** `readBriefWithAi` in `apps/web/app/directions/actions.ts` calls the `interpret` model through `openRouterComplete` (`packages/intent-engine/src/openrouter.ts`) and checks the answer with `llmInterpreter` and `interpretBrief`. Every other reading is by rules.

How to read each decision: "Covered today" names a role and a check that runs now. A `Confirmation:` line names the check or review that fails when the decision is broken, or says `not confirmed yet` with the Jira issue that adds one: ORV-112 for rate limits and spend caps, ORV-113 for every other control not enforced yet. ORV-113 may split into smaller stories; each split keeps a link back to it.

## Decision

### 1. Three standards to check against

| Standard                                                | Version and level | Source                                                          | Role that checks       | Check that runs today                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------- | ----------------- | --------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OWASP Application Security Verification Standard (ASVS) | 5.0.0, Level 2    | <https://asvs.owasp.org/>                                       | `security`, `reviewer` | None against ASVS itself. Related checks: `pnpm audit --prod --audit-level high` (blocking); `scan:secrets` and `scan:code` (report mode from slice B); the `access.test.ts` tests of `withWorkspace`                                                                                                                                                                                            |
| OWASP GenAI LLM Top 10                                  | 2026 edition      | <https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/> | `security`, `reviewer` | Tests in `packages/intent-engine/src/llm-interpreter.test.ts` and `interpreter.test.ts` for LLM01:2026 in part (the brief goes only in the user message), LLM10:2026 (strict schema, quotes must be in the brief, a wrong method or adapter is refused) and LLM06:2026 in part (no fallback model). See "Not done yet" for the rest                                                              |
| Web Content Accessibility Guidelines (WCAG)             | 2.2, Level AA     | <https://www.w3.org/TR/WCAG22/>                                 | `designer`, `qa`       | `pnpm contrast` (every semantic text and UI pair under every profile, both modes; success criteria 1.4.3 and 1.4.11 for those pairs). axe through `@storybook/addon-a11y` with `a11y: { test: "error" }` on every Storybook story in `pnpm test` (Chromium); `landmark-unique` is off on three matrix stories and `aria-allowed-role` on the CanvasChat stories, each with a reason in a comment |

The versions are the owner's (comment 10158), with the LLM Top 10 moved to 2026 (comment 10164). What the research entries confirm, and at what confidence:

- **ASVS 5.0.0**, stable release of 30 May 2025; Level 2 means every Level 1 and Level 2 requirement (K-0013 section 1, 0.8). The old project URL now redirects to <https://asvs.owasp.org/>, so the table cites that.
- **OWASP GenAI LLM Top 10 2026**, published 3 August 2026 per the genai.owasp.org resource page; the source repo says 4 August 2026, and K-0014 could not settle which is the formal date. This ADR cites the site's date. A version number (1.0) appears only in an image file name and is not confirmed, so none is cited. The item ids used here are the ones K-0014 lists from `2026/final/` (0.8). The 2026 edition keeps the ten 2025 risks, renames System Prompt Leakage to Hidden Context Exposure and reorders the list.
- **WCAG 2.2**, W3C Recommendation of 5 October 2023, current text 12 December 2024; Level AA per conformance requirement 5.2.1 (K-0013 section 3, 0.8).
- **Core Web Vitals** thresholds in decision 5 match <https://web.dev/articles/vitals> (K-0013 section 4, 0.8).
- **PDPA** dates in decision 8 (K-0013 section 5).

Confirmation: `security` review on each PR in its cases (ADR 0013 amendment, decision 2) cites the standard and the item, by its 2026 id for the LLM Top 10, for each finding; `pnpm contrast` and the Storybook axe run fail `pnpm test` on a contrast or axe violation. Conformance to any of the three is not confirmed yet; follow-up: ORV-113 (the ASVS L2 verification, the LLM Top 10 tests and the WCAG page scan in "Not done yet") and ORV-112 (the LLM06:2026 rate limit and spend cap).

### 2. Three new roles (amendment to ADR 0013 decision 3)

ADR 0013 decision 3 lists product, ds-architect, designer, builder, qa, reviewer and release. It gains three roles, all on `opus` (analysis, CLAUDE.md model policy), as spec ORV-108 "The three roles" sets out:

- **`architect`**: system architecture outside the design system (package boundaries, runtime and deploy shape, integrations, auth and data-access design). Writes new ADRs and `docs/specs/<KEY>/tech.md`; contract `implementer.v1`. It does not change design-system contracts, write code under `packages/` or `apps/`, rewrite a decided ADR or approve a gate.
- **`security`**: reviews a PR head against the three standards and the controls below; contract `reviewer.v1`, empty `write_set`, required skill `quality-gate`. In round 0 it is dispatched beside `reviewer` when the lane is L with the auth or data-access flag, the diff touches a path in `.claude/rules/security.md`, the diff changes a model call or a prompt, or the diff adds a runtime dependency. Its `request_changes` forces rework like the reviewer's; `merge-check` does not read it (spec decision 5). It reports findings and certifies nothing.
- **`research`**: answers one external question per envelope as a knowledge entry in the ADR 0005 shape; contract `implementer.v1`, `write_set` only under `docs/knowledge/`. It records facts and options, never decides, and treats fetched web text as untrusted input.

Confirmation: `scripts/ovl/envelope-guard.test.mjs` and `result-recorder.test.mjs` (slice A of ORV-108) refuse an envelope whose role, contract or `write_set` shape does not match the table, and `merge-check` is unchanged.

### 3. AI controls

Each AI job, now and later, meets all of these. They extend ADR 0009 point 5 and do not replace it.

| Control                                                                                                                           | LLM Top 10 2026                | Covered today by                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Model calls run on the server only, through OpenRouter, one pinned model per job by exact id (ADR 0009)                           | LLM04:2026, LLM06:2026 in part | `AI_MODELS` in `openrouter.ts`; the "asks the pinned model for zero retention, no training and no fallback" test; `reviewer`  |
| Briefs, chat text, Jira text and uploads are untrusted input, kept apart from the instructions (system prompt holds no user text) | LLM01:2026                     | The "sends the brief only as the user message, never inside the instructions" test, for `interpret` only                      |
| The system prompt and any hidden context hold no secret, key, permission rule or other workspace's data                           | LLM08:2026                     | not covered yet; `reviewer` reads the prompt text in `llm-interpreter.ts`                                                     |
| Model output is parsed with zod (strict) before use and is never executed or rendered as HTML                                     | LLM10:2026                     | `llmAnswerSchema` and the `interpretBrief` refusal tests, for `interpret` only                                                |
| Each AI job has a rate limit per user and a spend cap per workspace (decision 4)                                                  | LLM06:2026                     | `interpret` only: the spend cap tests in decision 4's addition of 2026-10-29; the `ai-read` rate limit tests (ORV-112)        |
| No personal data goes into a prompt unless the job needs it; a `personal` field is masked in a prompt by default (decision 8)     | LLM02:2026                     | not covered yet; `readBriefWithAi` logs only the failure kind, never the brief, read by `reviewer`                            |
| A person confirms before model output changes saved data                                                                          | LLM03:2026                     | Manual today: a reading is saved only through `saveDirection` after the person acts; no test names this rule. not covered yet |
| AI output is labelled as AI in the UI, with the model                                                                             | LLM07:2026                     | `byAi: "Read by AI ({model})"` in the locale catalog and the "labelled as AI with its model" test                             |

The ids are from K-0014. LLM05:2026 (data and model poisoning) and LLM09:2026 (vector and embedding weaknesses) have no row: the product trains no model and has no retrieval. The story that adds either adds a row here.

Confirmation: the tests named in the table fail `pnpm test` when the `interpret` path breaks its row. For the rows marked `not covered yet`, and for every AI job other than `interpret`, not confirmed yet; follow-up: ORV-112 for the LLM06:2026 row, ORV-113 for the LLM08:2026, LLM02:2026 and LLM03:2026 rows. A story that adds a new AI job carries a test per row, and `security` is dispatched on it (decision 2, "changes a model call or a prompt").

### 4. Rate limit and abuse

- **What is limited.** Sign-in and every AI job (the existing rule in `.claude/rules/security.md`), plus any route that writes to Storage. Each AI job has a limit per user per window and a spend cap per workspace per calendar month in US dollars, counted from OpenRouter's reported usage.
- **Where counters live.** In a store every server instance shares. A counter in process memory does not hold on Vercel functions, which run as many short-lived instances. The default is a Postgres table through the restricted app role, so no new service; a different store needs an addition to this ADR.
- **The answer.** Over a rate limit: status 429, `Retry-After` in seconds, error code `RATE_LIMITED`, `retryable: true` (decision 7). Over the spend cap: the job is not called; where the job has a rule-based fallback (ADR 0009 point 3) the caller keeps it and the UI says so, otherwise 429 with code `AI_SPEND_CAP` and `retryable: false`. The body's `retryable` wins over the status default.
- **The numbers** (requests per window, the window, the cap) are the ones in ORV-108 comment 10163 where it sets them; where it does not, ORV-112 proposes them and records them here as an addition.

Confirmation: not confirmed yet; follow-up: ORV-112, with a test that the 3rd call over a limit of 2 answers 429 with `Retry-After`, and one that a capped workspace gets the rules' reading without a model call.

**Addition, 2026-10-29 (ORV-121): the spend cap figure.** Decided under the owner's delegation (ADR 0012 decision 4, ORV-121 comment 10259), as the defaults of the ORV-121 spec's open questions 1 and 6. ORV-112 split the cap out to ORV-121 (ORV-112 Decision 2), so ORV-121 records the figure here, as "The numbers" above asks. The rules above stay.

- **The figure.** 5 US dollars per workspace per calendar month, one cap over every AI job together, not one per job. In code it is `AI_SPEND_CAP_MICRO_USD = 5_000_000` in `packages/auth/src/spend-cap.ts`, in millionths of a US dollar (decision 12, addition of 2026-10-29). It is set on the server and is the same for every workspace; no client, request or workspace member sets it.
- **The month.** A calendar month in Asia/Bangkok, from 00:00 on the 1st (`monthOf` in the same file), as ORV-112 starts its day.
- **The sum.** OpenRouter's reported `usage.cost` for each request (K-0091), one `ai_usage` row per request. The sum is read through `withWorkspace`. Each row is written inside `inWorkspace`, scoped to the workspace of the charge that only the cap check makes after its `withWorkspace` passed, with no second session read, so a sign-out or a membership removed during the call does not drop a paid request (`docs/specs/ORV-121/tech.md` §4). A request with no reported cost adds nothing (decision 12, addition of 2026-10-29).
- **The answer.** Checked after the rate limit and before the call. For `interpret`, a capped workspace keeps the rules' reading and gets the outcome `ai-spend-cap` with code `AI_SPEND_CAP`, the request's `requestId` and `retryable: false`. A sum that cannot be read within 2 seconds fails closed: the outcome is `ai-failed` with code `SERVICE_UNAVAILABLE`, the request's `requestId` and `retryable: true`. Each AI job that gains a call path writes the same record and is checked against the same cap.
- **Why 5.** At about 1.4 US cents an `interpret` reading, 5 dollars is about 357 readings, and the 20 dollar preview and staging key of ADR 0009 point 7 covers four capped workspaces; a 20 dollar cap would equal the whole key and never stop a workspace before the key does.

Confirmation: for `interpret`, these tests fail `pnpm test` when the path breaks the cap: in `apps/web/app/directions/actions.test.ts`, under "the spend cap on an AI reading", "a capped workspace gets the rules' reading without a model call" (the test this decision's Confirmation asks for), "the call that crosses the cap completes, the next is refused", "the cap is per workspace", "a new Bangkok month starts at zero", "the cap check fails closed" and "the rate limit answers before the cap"; in `packages/auth/src/spend-cap.test.ts`, "the cap" > "is 5 US dollars in millionths", which fails when the figure changes; and, when a test database is configured (`HAS_TEST_DATABASE`), `packages/auth/src/spend-cap.integration.test.ts` "sums only this workspace's records in this month and skips nulls". For every other AI job, not confirmed yet: none has a call path; the story that adds one carries the same tests.

### 5. Performance budgets

- **Core Web Vitals**, at the 75th percentile of page loads, split by mobile and desktop: Largest Contentful Paint 2.5 s or less, Interaction to Next Paint 200 ms or less, Cumulative Layout Shift 0.1 or less. These are the "good" thresholds at <https://web.dev/articles/vitals>.
- **Bundle budget.** Each `apps/web` route has a budget for the JavaScript it sends on first load, compressed, read from the production build. The number per route is set from the first baseline measurement on `develop` and recorded here as an addition; a route over its budget fails the check that story adds.
- **Nothing measures either yet.** No report, packet or UI may claim the product meets a Core Web Vital or a bundle budget.

Confirmation: not confirmed yet; follow-up: ORV-113, which adds a build-output budget check to `pnpm quality-gate` and CI, and later a field measurement (Vercel Speed Insights or similar, which needs its own decision since it is a service).

### 6. Observability

- **Request id.** Each server action and route handler response carries `x-request-id`. The server makes it (a random id per request); a value sent by the client is never trusted or reused. The same id goes in every log line for that request and in the error body (decision 7).
- **Log lines.** One JSON object per line with at least `level`, `requestId`, `route`, `durationMs` and `outcome`. No secret and no personal data in a log line: a `secret` field is never logged, a `personal` field only in its masked form (decision 8).
- **One log per error.** An error is logged once, at the boundary (the server action or route handler), not at each layer it passes.

Today `readBriefWithAi` logs with `console.error` and a plain string, without a request id. That is the known gap.

Confirmation: not confirmed yet; follow-up: ORV-113, which adds the request id and the logger, with a test that a response carries `x-request-id`, that the log line parses as JSON with the five fields, and that a seeded email and token never appear in it.

Addition, 2026-10-29 (ORV-141 and ORV-142). The two lines above stay as the record of 2026-10-25. The gap they name is closed: the proxy makes the request id and sets `x-request-id` (ORV-141), and the `api/auth` route handler (ORV-141), every server action, the limiter and the client IP read (ORV-142) write their lines through one logger, `packages/auth/src/log.ts`, with the request's `requestId` and `route`. Still open: Next.js's and Better Auth's own log lines do not go through the logger (ORV-141 open question 6, recorded as a known gap). Decision 6 is confirmed by ORV-141's tests for rows 1, 14 and 15; the staging probe, ORV-142 row 18, is still to run, and until it passes the header on a Vercel response is not confirmed.

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

Confirmation: not confirmed yet; follow-up: ORV-113, which adds the error helper and the client retry, with a test per matrix row and a test that a thrown error's stack and a seeded email do not reach the body.

### 8. Personal data (PDPA): masked by default

- Thailand's Personal Data Protection Act B.E. 2562 (2019) applies to the people whose data the product holds. Per K-0013 section 5 (confidence 0.75 for these dates), read from the regulator's page <https://www.pdpc.or.th/3442/>: the Act was published in the Royal Gazette on 27 May 2019 and has been in force in every section since 1 June 2022. The Gazette text itself (volume 136, part 69 Gor; a copy at <https://ratchakitcha.soc.go.th/documents/17082307.pdf>) and the section 2 schedule were not read, so they sit below 0.7 and nothing here rests on them. The Thai Gazette text is the binding one; no official English translation was found.
- **Masking is the default.** A field classified `personal` (decision 9) is masked in UI lists, logs, exports and prompts unless the viewer holds a permission that unmasks it. The permission is checked through the central authorization helper. Each unmask is logged with the viewer, the field and the time, never the value.
- **Masked forms.** An email keeps its first character and its domain (`t***@gmail.com`). A phone number keeps its last 4 digits. A Thai national id keeps its last 4 digits.
- These are engineering defaults, not legal advice. Nothing here claims PDPA compliance, and no UI or report may say the product is PDPA compliant.

Confirmation: not confirmed yet; follow-up: ORV-113, which adds the mask helper and the unmask permission, with a test per masked form, a test that a list without the permission shows only masked values, and a test that an unmask writes a log line.

### 9. Field classification tags

- Every column in the `packages/db` schema carries one tag: `public`, `internal`, `personal` or `secret`.
- **Format.** One file, `packages/db/src/schema/classification.ts`, exports `CLASSIFICATION`, a map from each table to each of its columns to its tag, typed with `satisfies` against the Drizzle table types so a column without a tag fails `pnpm typecheck`. A map beside the tables, not a comment on each column, because `packages/db/src/schema/auth.ts` is generated by Better Auth ("Regenerate rather than edit") and a regeneration would drop inline tags.
- `personal` is masked by default (decision 8), for example `user.email`, `user.name`, `session.ipAddress`. `secret` never leaves the server and is never logged, for example `session.token`, `account.accessToken`, `account.refreshToken`, `account.idToken`.

Confirmation: not confirmed yet; follow-up: ORV-113, which adds `classification.ts`, with `pnpm typecheck` failing on an untagged column and a test that walks every exported table with `getTableColumns` and finds a tag for each.

### 10. 404, not 403

A read or write of a resource outside the caller's workspace answers 404 with the same body as a resource that does not exist, so the answer does not show that it exists. 403 is only for a resource the caller can see but may not change (for example a role too low to edit).

Today `withWorkspace` in `packages/auth/src/access.ts` throws `Denied(403, "not-a-member")` for a workspace the caller is not a member of, and `Denied(403, "no-workspace")`. Under this rule the first answers 404 at the boundary. This is the one known gap; ORV-113 carries it, and the change is L lane (auth and data access).

Confirmation: not confirmed yet; follow-up: ORV-113, which maps `not-a-member` to 404, with a test in `access.test.ts` that a direction in another workspace and a direction id that does not exist give the same status and body.

### 11. Uploads

- The type is allowed by the file's content (its magic bytes), never by its name or the client's content type.
- Each kind has a size cap, set by the story that adds the kind, and checked before the bytes are stored.
- Objects go to a private bucket under a random key, never the user's file name, and are served through short-lived signed URLs after the authorization check (ADR 0002).
- A user's SVG or HTML is never rendered inline. Anything that is not an allowed raster image is served with `Content-Disposition: attachment`.

No upload path exists today.

Confirmation: not confirmed yet; follow-up: ORV-113 sets the upload rules as a test list, and the first upload story carries it, with a test that a PNG renamed `.svg` and an SVG renamed `.png` are each judged by content, that an object key holds no part of the file name, and that an SVG response carries `Content-Disposition: attachment`.

### 12. Money

Amounts are integers in minor units (satang for THB) in a `bigint` column, with the ISO 4217 currency code in a column beside them. No float, in the database or in TypeScript (`bigint` or an integer `number` checked with `Number.isSafeInteger`). One rounding helper, half to even. Display through `Intl.NumberFormat` with the locale from the catalog.

No money column exists today.

Confirmation: not confirmed yet; follow-up: ORV-113 sets the money rules as a test list, and the first story that stores an amount carries it, with a test of the rounding helper on halves (0.5, 1.5, 2.5 satang) and a schema test that every amount column has a currency column beside it.

**Addition, 2026-10-29 (ORV-121): AI usage amounts in millionths of a US dollar.** Decided under the owner's delegation (ADR 0012 decision 4, ORV-121 comment 10258), as the default of the ORV-121 spec's open question 2. The rule above stays; this adds one unit for one kind of amount.

- **What it covers.** The cost of an AI call as OpenRouter reports it, and the spend cap per workspace (decision 4). Nothing a customer pays or is shown as a price; those stay in minor units as above.
- **The unit.** An integer count of millionths of a US dollar, in a `bigint` column whose name ends in `_micro_usd`, with `currency` (`USD`) beside it. Cents would round a reading of about 1.4 cents to 1 cent, an under-count of about 29 percent per call.
- **The rounding.** Half to even at the millionth, by one helper (`toMicroUsd` in `packages/intent-engine/src/money.ts`), applied to the shortest decimal text of the reported number, never to float arithmetic (K-0091 for the field; `docs/specs/ORV-121/tech.md` §3).
- **No cost is not zero.** A cost OpenRouter did not report is stored as null and adds nothing to a sum; it is never stored as 0.

Confirmation: `packages/intent-engine/src/money.test.ts`, built on the ORV-121 branch, fails `pnpm test` when `toMicroUsd` does not round 0.5, 1.5 and 2.5 millionths to 0, 2 and 2 or does not give `14000 12 14 13 5000000` for the spec's worked example 2, and `packages/db/src/schema.test.ts`, built on the same branch, fails it when a `_micro_usd` column has no `currency` column in its table.

### 13. No conformance claim

No UI text, report, gate packet or PR may say the product conforms to ASVS, the OWASP GenAI LLM Top 10, WCAG or the PDPA, or meets a performance budget. A report may say which check ran and what it found.

Confirmation: `reviewer` and `security` read each PR for such a claim (AGENTS.md iron rule 4); no automated check yet, follow-up ORV-113.

## Not done yet

- **ASVS 5.0.0 Level 2:** no requirement-by-requirement verification, no penetration test, no threat model. The scans are pattern rules in report mode; a clean scan is not a security claim.
- **OWASP GenAI LLM Top 10 2026:** one path calls a model today (`readBriefWithAi`, job `interpret`). Tests exist for LLM01:2026 in part (brief only in the user message; the 2026 entry also covers cross-modal injection, which has no test), LLM10:2026 (strict schema and quote check; the 2026 entry also covers insecure generated code, which the product does not produce) and LLM06:2026 in part (no fallback). No test exists for LLM02:2026 (sensitive information disclosure), LLM03:2026 (excessive agency), LLM04:2026 (supply chain), LLM05:2026 (data and model poisoning), LLM07:2026 (misinformation), LLM08:2026 (hidden context exposure) or LLM09:2026 (vector and embedding weaknesses; no retrieval exists), and LLM06:2026 has its rate limit (ORV-112) and spend cap (decision 4, addition of 2026-10-29) for `interpret` only. No adversarial prompt set exists (ORV-113).
- **WCAG 2.2 AA:** automated checks are `pnpm contrast` for semantic text and UI pairs and axe on Storybook stories. axe finds only part of WCAG. No axe scan runs on `apps/web` pages, no keyboard walk is recorded, no screen reader pass is done, and success criteria such as 2.4.11 (focus not obscured) and 2.5.8 (target size) have no check (ORV-113).
- **Correction to spec ORV-108 v2, AC row 14.** The row says no automated axe scan runs. The first draft of this ADR checked and found that axe does run on every Storybook story (`packages/design-system/.storybook/preview.tsx`, `a11y: { test: "error" }`, inside `pnpm test`). What is missing is an axe scan of `apps/web` pages, as the WCAG line above says. This ADR records the observed state; the spec is not edited here.
- **Performance:** nothing measures Core Web Vitals or bundle size (decision 5, ORV-113).
- **Rate limit and spend cap:** the spend cap exists for the `interpret` job, 5 US dollars per workspace per Bangkok calendar month, with the tests named in decision 4's addition of 2026-10-29 (ORV-121). No other AI job has a call path yet. The rate limit's figures are in `.claude/rules/security.md` rule 6 (ORV-112) and are not yet recorded here as an addition. The cap is per workspace, and workspace creation is not limited: `organizationPlugin()` in `packages/auth/src/config.ts` is set up with no options, so any signed-in person can create more workspaces, each with its own 5 dollar cap (the ORV-121 security review read this from the installed Better Auth 1.7.12). Across workspaces the only bound is the OpenRouter key's credit limit (ADR 0009 point 7), and "Why 5" in decision 4's addition holds only while no one does that. Follow-up: limit workspace creation or add a monthly bound per person (ORV-140).
- **Observability:** code and tests (decision 6, ORV-141 and ORV-142). Open: the staging probe (ORV-142 row 18) and Next.js's and Better Auth's own log lines (ORV-141 open question 6).
- **Error envelope, PDPA masking, classification tags, uploads, money:** named here, no code and no check (decisions 7 to 12, ORV-113).
- **404 not 403:** `withWorkspace` answers 403 for a non-member today (decision 10, ORV-113).
- **Privacy notice:** ADR 0009 requires it to name OpenRouter and each model host before real customers use AI features. Not written.

## Consequences

- Every product story has a list to be checked against, and a reviewer can cite "ADR 0015 decision 7" instead of a preference.
- Most controls are promises until their story lands. The "Not done yet" list is the honest state, and the `security` role reads it before claiming a gap is new.
- Stories that add an AI job, an upload, a money field or a new table carry more tests than before (one per row of the decision they touch).
- 404 instead of 403 for non-members changes an auth answer; that story is L lane.
- Rate-limit counters in Postgres add a write per limited request. If that shows in latency, a shared cache is a later addition with its own cost.
- The standards are pinned. When OWASP or W3C publishes a new version, moving to it is a new ADR. The LLM Top 10 move from 2025 to 2026 happened before this ADR was accepted, so it is part of this ADR and not a supersession.
- Any test, comment or finding that cites an LLM Top 10 id uses the 2026 id. A 2025 id in new text is a review finding.

## Not chosen

- **Certifying against a standard** (an ASVS audit, a WCAG conformance statement). Out of scope for ORV-108; it needs a human audit and evidence this team does not yet produce.
- **Staying on the LLM Top 10 2025.** It was the owner's first pin (comment 10158), but the 2026 edition was already published when this ADR was accepted (K-0013 section 2), and it keeps the same ten risks, so the move costs only renumbering.
- **ASVS Level 1.** Too thin for a multi-tenant product that holds confidential brand assets; Level 3 is for high-assurance systems and costs more than this product needs now.
- **A paid observability or rate-limit service** (Sentry, Datadog, Upstash). No new paid service in ORV-108; the defaults above need none. Each can be proposed later in its own ADR.
- **Inline tags on each column.** Lost on the next Better Auth schema regeneration (decision 9).
- **Floats or decimal strings for money.** Floats lose satang; decimal strings push parsing into every caller.
- **403 for non-members.** It tells a caller that a resource exists in another workspace.

## What this changes in earlier docs

- **ADR 0013, decision 3.** Read it with the three roles in decision 2 above. ADR 0013's Status line gains one sentence that points here; nothing else in it changes.
- **ADR 0009, point 5.** The AI controls in decision 3 extend it. ADR 0009 is not rewritten.
- **`.claude/rules/security.md`.** Gains the rules of decisions 4 and 6 to 13, each pointing here, as numbered rules 6 and 9 to 16, and the paths `apps/web/next.config.ts` and `apps/web/proxy.ts`.
