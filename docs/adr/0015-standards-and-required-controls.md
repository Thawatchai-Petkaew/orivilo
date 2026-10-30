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

Addition, 2026-10-30 (ORV-160). The table's LLM Top 10 row (line 28) and the Confirmation line above stay as the record of 2026-10-25. The LLM Top 10 tests the Confirmation asks of ORV-113 landed as ORV-160 (ORV-113 item 7), one slice per PR merged into `develop`: slice 1, the spec and K-0093 (PR #154, `2d77c30`); slice 2, ORV-172 (PR #156, `eb661ed`); slice 3, ORV-174 (PR #158, `47d52b5`); slice 4, ORV-173 (PR #157, `d8c9fa7`); slice 5, ORV-176 (PR #159, `c054855`); slice 7a, ORV-177 (PR #160, `c068371`); slice 7b, ORV-178 (PR #161, `b7e9d0d`). Slice 6 did not run (ORV-160 spec open question 5, default (a)). Row numbers below are the rows of `docs/specs/ORV-160/spec.md`, "Acceptance criteria". File keys: G `packages/intent-engine/src/llm-guardrails.test.ts`, C `packages/intent-engine/src/openrouter.test.ts`, A `apps/web/app/directions/actions.test.ts` (`describe("the AI reading boundary"`), W `apps/web/app/directions/ai-reading.test.tsx`, R `packages/intent-engine/src/llm-recorded.test.ts`, P `scripts/openrouter-interpret-record.test.mjs`.

On `develop` at `b7e9d0d` these tests cover the 2026 ids for the one path that calls a model, `interpret`:

- LLM01:2026, rows 1 to 5 in G (slice 3) and row 6 in A (slice 4); R replays the answers recorded for rows 1 to 5 (row 35, slice 7b).
- LLM02:2026, rows 7 and 8 in A (slice 4) and rows 9 to 11 in C (slice 2).
- LLM04:2026, rows 12 to 16 in C (slice 2) and row 17 in C (slice 5).
- LLM05:2026, row 18 in G (slice 3).
- LLM06:2026, rows 19 to 22 in G and rows 23 and 24 in C (slice 2), row 25 in A (slice 4) and row 26 in C (slice 5).
- LLM07:2026, row 27 in G (slice 3) and row 28 in W (slice 4).
- LLM08:2026, row 29 in G (slice 2) and row 30 in G (slice 3).
- LLM10:2026, row 31 in G (slice 3) and row 32 in W (slice 4).
- LLM03:2026 and LLM09:2026 have no row (ORV-160 spec, "The set this covers").
- The set's own rows: row 33, the title guard in G (slice 3); row 34, the network block in G and W (slice 7a); row 35, the recorded replay in R (slice 7b); rows 36 and 37, the recorder in P (slice 7a).

These tests fail `pnpm test` when the `interpret` path breaks the row they hold; P runs under `pnpm test:scripts`, which CI runs. They run on fake models, a fake `fetch` and 9 recorded answers, for one job. They are covered by tests with the row numbers above, nothing more: conformance to the OWASP GenAI LLM Top 10 2026 is not confirmed and not claimed (decision 13). What stays open is in "Not done yet", the addition of 2026-10-30 (ORV-160).

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

Addition, 2026-10-30 (ORV-160). The table (rows at lines 57 to 64), line 66 and the Confirmation line above stay as the record of 2026-10-25. For the `interpret` job only, on `develop` at `b7e9d0d`, each row stands as follows. Row numbers, file keys and slice merge commits are those of decision 1's addition of 2026-10-30.

- **Server only, one pinned model** (LLM04:2026, LLM06:2026 in part). Also C rows 12 (`AI_MODELS` is exactly the six pinned jobs), 13 (the one URL), 14 (an answer from another model is refused), 15 (`require_parameters` true) and 16 (`allow_fallbacks` false), slice 2, `eb661ed`; and C row 17, only the pinned id or it plus `-` and 8 digits is accepted, slice 5, `c054855`.
- **Untrusted input kept apart** (LLM01:2026). Also G rows 1 to 5 (a direct override, a multilingual override, a delimiter and JSON escape, words in invisible tag characters, a payload split into Base64 parts), slice 3, `47d52b5`; A row 6, the system prompt and the brief each in its own message at the server action, slice 4, `d8c9fa7`; C row 9, exactly three headers and five body keys, slice 2, `eb661ed`. Cross-modal input has no channel and no test.
- **Hidden context** (LLM08:2026). No longer only read by `reviewer`: G row 29 fails when `LLM_SYSTEM_PROMPT` holds any of the 11 markers of ORV-160 `orv160-prompt-hygiene`, slice 2, `eb661ed`, and G row 30 refuses an answer that quotes the prompt back, slice 3, `47d52b5`. A marker list finds only the markers it lists, so `reviewer` still reads the prompt text.
- **Output parsed, never executed or rendered as HTML** (LLM10:2026). Also G row 31, a markdown image in a quote fails the reading, slice 3, `47d52b5`; W row 32, markup in a quote renders as text, slice 4, `d8c9fa7`.
- **Rate limit and spend cap** (LLM06:2026). Unchanged by ORV-160 (its spec open question 3, default (a)). Beside them the set adds size and time bounds: G rows 19 to 22 (the brief, a quote, the findings and the not-understood quotes) and C rows 23 and 24 (`max_tokens` 2000, the caller's signal), slice 2, `eb661ed`; A row 25 (`AbortSignal.timeout(20_000)`), slice 4, `d8c9fa7`; C row 26 (the answer body counted while it is read and refused past 65,536 bytes), slice 5, `c054855`. One case stays open: "Not done yet", the addition of 2026-10-30 (ORV-160), names it with ORV-171.
- **Personal data in a prompt** (LLM02:2026). Masking before the prompt is still `not covered yet` (decision 8). Tests now hold the rest of the row: A row 7, nothing of the request context (the person's id, the workspace id) reaches OpenRouter, and A row 8, a failed call logs the failure kind, never the brief or its personal data, slice 4, `d8c9fa7`; C rows 10 and 11, `zdr` true and `data_collection` deny, slice 2, `eb661ed`.
- **A person confirms before model output changes saved data** (LLM03:2026). Stays manual and `not covered yet`, by ORV-160 spec open question 5, default (a). Why: this path calls no tool and writes nothing taken from model output. `readBriefWithAi` writes only usage records (the job, the model and the reported cost, ORV-121) and returns a sealed reading, and a reading is saved only through `saveDirection` after the person acts. The 2026 entry's examples each turn on a tool, a downstream permission or an action taken without confirmation, and this path has none. Slice 6, the Storybook play that option (b) would have added, did not run. The first AI job that writes from model output or calls a tool carries the test.
- **AI output labelled as AI** (LLM07:2026). Also W row 28, the label on a rendered AI reading, slice 4, `d8c9fa7`. G row 27, slice 3, `47d52b5`, records the limit: a well-formed wrong reading passes every check, and only this label tells the person a model made it.
- **Line 66.** LLM05:2026 now has one test, G row 18, slice 3, `47d52b5`: a hosted model that quotes words outside the brief, as a model poisoned upstream might, fails the reading through the quote check of the LLM10:2026 row. No row is added, since no new control exists. That LLM05:2026 reaches this path in part, through the hosted model only, is K-0093's reading, adopted by the ORV-160 spec ("The set this covers"). LLM09:2026 stays without a row: no retrieval exists.
- **Line 68.** For `interpret`, the tests named in this addition also fail `pnpm test` when the path breaks their row, and R (row 35, slice 7b, `b7e9d0d`) replays 9 real answers recorded on 2026-10-30 through the same checks. Not confirmed yet: the LLM02:2026 masking and the LLM03:2026 rows, and every AI job other than `interpret`; follow-up ORV-113, as the line says.

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

Addition, 2026-10-30 (ORV-170, recording ORV-144). The Confirmation line above stays as the record of 2026-10-25. ORV-144 (PR #144, merge commit `b861607`) built the error helper and the client retry; this addition states what its code and tests show on `develop` at `46d2492`.

- **The body.** `packages/auth/src/errors.ts` holds the closed code list, `ERROR_CODES`, and the only writers of an error body, `errorBody` and `errorResponse`. The list has 14 codes for 13 statuses: one per status of the matrix above and `AI_SPEND_CAP` (429, `retryable: false`, decision 4, added by ORV-121). `codeOfStatus` gives a status its code; where two codes share a status the first listed is its code, so 429 is `RATE_LIMITED`; an unlisted 4xx is `BAD_REQUEST` and an unlisted 5xx `INTERNAL_ERROR`. `message` is the fixed English text of the code's row, never built from an error object. `packages/auth/src/errors.test.ts` pins the list, the body byte for byte with its key order, and the `content-type` and `x-request-id` headers.
- **The route.** `authRoute` in `packages/auth/src/auth-route.ts` answers its own 429 and 503, every Better Auth answer with status 400 or more, and any other throw (500 `INTERNAL_ERROR`, no longer rethrown) with that body. In `packages/auth/src/auth-route.test.ts`, "every answer carries the request id and one line" throws `ana@example.com at /Users/x/app.ts:12` and finds neither the email, `/Users/` nor `" at "` in the body, and "an error answer from Better Auth gets the error body" finds no seeded email in a rewritten 401. That is the test the line above asks for, a thrown error's stack and a seeded email kept out of the body.
- **Outcome objects.** The failure outcomes of the seven server actions in `apps/web/app/directions/actions.ts` and the states of `signInWithGoogle` in `apps/web/app/account/actions.ts` carry `code`, `requestId` and `retryable` through `failureFields`. Backed by `apps/web/app/directions/actions.test.ts` ("a failure outcome carries code, requestId and retryable", "each reason maps to its code", "an unexpected error carries INTERNAL_ERROR and nothing of the error") and `apps/web/app/account/actions.test.ts` ("an error from signInSocial returns the INTERNAL_ERROR state and logs one failed line"). `signOut` and `setLocale` return no outcome and carry none.
- **The matrix.** `apps/web/client/retry.ts` (`retryDelay`, `fetchWithRetry`) decides each retry. `apps/web/client/retry.test.ts` has a test per matrix row: "4xx and 500 are not retried" (rows 400 to 422 and 500), "408 and 429 wait for Retry-After", "5xx gateway answers and network errors back off with jitter" (the 502, 503, 504 row and the network row), and "only a GET or a keyed write is retried, and never a retryable false" (the rule above the matrix and the body's `retryable: false`).

How ORV-144 reads the decided text, from its open questions taken at their defaults under the owner's delegation (ORV-144 comment 10268, ADR 0012 decision 4):

- "At most 3 tries" is at most 3 retries after the first call, one per listed delay, so a call is made at most 4 times (open question 5, `MAX_RETRIES` in `retry.ts`).
- "Wait for `Retry-After`" holds for a whole number of seconds from 0 to 10. Over 10 s the call is not retried automatically and the person sees the wait; a value that is missing or not a whole number waits 1 s (open question 7, `MAX_WAIT_SECONDS`).
- "With jitter" is `base * (0.5 + r)` ms with `r` in [0, 1), so the listed delays are the middle of each wait: 0.5 s is 250 to 750 ms (open question 6).
- A write "carries an idempotency key" when its request has a non-empty `Idempotency-Key` header (open question 4).
- A call its caller aborted has no answer but is not retried (ORV-144 tech notes D7, test "an aborted call is not retried").
- "The UI maps it to a catalog string": the line a person reads still comes from the outcome's `error` key (ORV-144 open question 3), and `code` decides only whether the reference line with the `requestId` shows, which only `INTERNAL_ERROR` does (open question 8, `referenceLine` in `apps/web/i18n/wait.ts`).

What this does not confirm:

- **No client caller uses `apps/web/client/retry.ts`.** Every client call today is a server action, an HTTP `POST` without an idempotency key, so by this decision none is retried, and the module is proven by its own tests only (ORV-144 open question 4). The retry in use is confirmed when the first `GET` or keyed caller lands with a test.
- A network failure on the `/account` forms shows Next.js's error page, with no body and no `requestId` (ORV-144 open question 10, a recorded gap).
- No automated check stops other code from writing an error body; the `reviewer` and `security` roles read each diff for one (ORV-144 spec, "Frame").

Decision 7 is confirmed for the body, the code list, the outcome fields and the retry decision by the tests named above. The client retry in the app is not confirmed yet; follow-up: the first story with a `GET` or keyed client call.

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

Addition, 2026-10-30 (ORV-158). The map exists at `packages/db/src/schema/classification.ts`, with one entry for every column of every exported table, `ai_usage` included. The type fixtures in `packages/db/src/schema/classification.fixtures.ts` make `pnpm typecheck` fail on each of the five defects of ORV-158 `orv158-type` (a column without an entry, an entry for a column the table does not have, a value outside the closed tag list, a table without an entry, an entry for a table that does not exist). `packages/db/src/schema/classification.test.ts` walks every exported table with `getTableColumns` and pins the `secret` and `personal` columns as sets. The Confirmation line above stays as the record of 2026-10-25. This confirms the tags only; masking (decision 8) is still not built.

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

Addition, 2026-10-30 (ORV-160). The Confirmation line above stays as the record of 2026-10-25. One automated check now holds part of it: the `orv160-titles` guard in `packages/intent-engine/src/llm-guardrails.test.ts` (ORV-160 row 33, slice 3, ORV-174, `47d52b5`) fails `pnpm test` when a `describe`, `it` or `it.each` title in that file contains `conform`, `complian` or `certif` in any case, or when a `describe` title there other than the guard's own does not begin with a 2026 id. It reads the test titles of that one file only. Every other UI text, report, gate packet and PR is still read by `reviewer` and `security`; follow-up ORV-113.

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

Addition, 2026-10-30 (ORV-158). The bullet "Error envelope, PDPA masking, classification tags, uploads, money" stays as the record of 2026-10-29 (ORV-142). On 2026-10-30 its items stand as follows. Classification tags have code and checks (decision 9, the addition above). The error envelope has code and tests from ORV-144: the code list and the body helpers in `packages/auth/src/errors.ts` (`ERROR_CODES`, `errorBody`, `errorResponse`) and the retry module `apps/web/client/retry.ts`, which no client caller uses yet. PDPA masking (decision 8) and uploads (decision 11) have no code. Money has its helper and its schema test only for AI usage amounts (decision 12's addition, ORV-121).

Addition, 2026-10-30 (ORV-170, recording ORV-144). The bullet "Error envelope, PDPA masking, classification tags, uploads, money" stays as the record of 2026-10-29 (ORV-142), and the ORV-158 addition above stays as written. For the error envelope the bullet's "no code and no check" no longer holds: decision 7 has code and tests from ORV-144, listed in decision 7's addition of 2026-10-30 (ORV-170). Still open for it: no client caller uses `apps/web/client/retry.ts`, so no call in the app is retried automatically; a network failure on the `/account` forms has no body and no `requestId` (ORV-144 open question 10); and no automated check stops code other than `errorBody` and `errorResponse` from writing an error body. PDPA masking (decision 8), uploads (decision 11) and money (decision 12) stand as the ORV-158 addition records.

Addition, 2026-10-30 (ORV-160). The bullet "OWASP GenAI LLM Top 10 2026" stays as the record of 2026-10-25. On 2026-10-30, for the one path that calls a model (`readBriefWithAi`, job `interpret`):

- **An adversarial set exists.** The bullet's "No adversarial prompt set exists (ORV-113)" no longer holds. A static hand-written set runs in `pnpm test`: ORV-160 rows 1 to 5, 18, 27, 30 and 31 in `packages/intent-engine/src/llm-guardrails.test.ts` (slice 3, ORV-174, `47d52b5`), and `packages/intent-engine/src/llm-recorded.test.ts` replays the answers a real model gave to those 9 briefs (row 35, slice 7b, ORV-178, `b7e9d0d`). Decision 1's addition of 2026-10-30 lists the tests per 2026 id, and decision 3's the state per control.
- **The recording.** One run of `scripts/probe/openrouter-interpret-record.mjs` on 2026-10-30 made 9 calls to `anthropic/claude-sonnet-5.5` and wrote `packages/intent-engine/src/llm-recorded.json`. 8 cases ended `ok`. `row-5` ended `adapter-failed` with `raw` null: its call failed before an answer reached the interpreter, so it holds no answer. The calls took 1243 to 5454 ms. Every answer named the pinned id exactly. The file shows what one model answered on one date, not how it behaves in general.
- **Still open for LLM01:2026 and the rest.** An adaptive attacker that knows the defence (ORV-160 spec open question 4, default (a)); indirect and cross-modal injection (no such channel exists); stripping invisible characters from a brief before the prompt (open question 11, default (a)); masking personal data before the prompt (decision 8); LLM03:2026 (decision 3's addition of 2026-10-30) and LLM09:2026 (no retrieval); every AI job other than `interpret`. The recordings do not confirm the response bound's value, 65,536 bytes (open question 9), since the recorder keeps the answer text and not the body's byte count, nor the dated model id suffix (open question 10), since no answer carried one. Follow-up: ORV-171.
- **Denial of Wallet through a call the spend cap does not count** (LLM06:2026, ORV-160 `orv160-wallet-gap`). A call aborted at 20 s, or one whose body the 65,536 byte bound refuses, has no reported cost: its usage record holds null and the workspace's month sum adds nothing (decision 12's addition, "No cost is not zero"), while OpenRouter may still bill it. Then only the `ai-read` rate limit and the key's credit limit (ADR 0009 point 7) bound that spend. A brief that asks for the most output the schema allows can need up to 2000 output tokens, and finishing them within 20 s needs at least 100 tokens per second, a speed not measured for the pinned model; the recorded durations are for short answers and do not give it. Closing it changes either ORV-121's decided default for an aborted call or the `max_tokens` and abort values that ORV-121's overshoot bound rests on. Follow-up: ORV-171.

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

Addition, 2026-10-30 (ORV-160). The line above stays. `.claude/rules/security.md` also gains the path `packages/intent-engine/**`, approved by the owner in ORV-160 comment 10293 (ORV-160 spec open question 12, option (a)), so a diff under the engine now meets decision 2's case "the diff touches a path in `.claude/rules/security.md`". ADR 0009 gains an addition of 2026-10-30 on where the `interpret` recordings and the recorder live; it is not rewritten.
