---
issue: ORV-121 (https://tpetkaew.atlassian.net/browse/ORV-121)
lane: L
version: 1.0
---

# ORV-121: AI spend cap per workspace, with a usage record per model call

## Why

ADR 0015 decision 4 requires every AI job to have a spend cap per workspace per calendar month in US dollars, counted from OpenRouter's reported usage. ORV-112 added the per-person rate limit and split the cap out to this story (ORV-112 Decision 2). Today nothing holds:

- **One AI call path exists, and it records no cost.** `readBriefWithAi` (`apps/web/app/directions/actions.ts`) calls the `interpret` job (`AI_MODELS.interpret`, `anthropic/claude-sonnet-5.5`) through `openRouterComplete` (`packages/intent-engine/src/openrouter.ts`). `openRouterComplete` returns only the answer text (`Complete` in `llm-interpreter.ts` is `Promise<string>`), so whatever OpenRouter reports about the call's cost is dropped.
- **The only money bound is shared.** ORV-112's `ai-read` limit (10 per hour, 50 per day per person) bounds one person. Nothing bounds a workspace: ten people each under their own limit can spend the key's monthly credit limit (ADR 0009 point 7, 20 US dollars for preview and staging), which every workspace in that environment shares.
- **The AI path never resolves a workspace.** `run(fn, "ai-read")` passes the session's `activeOrganizationId` to `fn`, but `readBriefWithAi`'s `fn` ignores it and calls no `withWorkspace` (`packages/auth/src/access.ts`). A cap per workspace needs the workspace the call is charged to, checked on the server.

**Frame.** This is a server-side control, not a hook that judges text. The usage records and the monthly sum live in our Postgres and are written only by server code through the restricted `orivilo_app` role (ADR 0002). The browser holds no record, no cap value and no credential to the store, and a workspace member cannot raise the cap. It is a bound on what one workspace spends through the product, not on the key: the key's own credit limit in OpenRouter (ADR 0009 point 7) stays the outer bound, held outside our code.

**What is real and what is not.** The cap is a real server check with tests. The reading a capped workspace keeps is the existing rule-based reading (ADR 0009 point 3), labelled "Read by rules" / "อ่านตามกฎ" as today. Tests never call a model (ADR 0009 point 8): they use recorded OpenRouter answers that carry a cost, named as recordings; a cost in a test is a recorded value, not a live price. Nothing here claims conformance to the OWASP LLM Top 10 (ADR 0015 decision 13); it adds the spend cap half of the LLM06:2026 row of ADR 0015 decision 3, with the tests named below.

## Story

As the workspace owner paying for AI, I want each workspace's AI spend in a month counted from what OpenRouter reports and stopped at a cap, so that one workspace cannot use up the AI budget of the whole environment, and the people in a capped workspace keep working with the rules' reading and are told why in Thai or English.

## Rules and bounds

Each rule below is the one home of its outcome. Other sections name the rule only.

- **spend-cap-1 (what is counted).** Every request the server sends to OpenRouter for an AI job writes one usage record. Of the six jobs in `AI_MODELS` (`chat`, `instant`, `interpret`, `see`, `logo-vector`, `logo-image`), only `interpret` has a call path today (`readBriefWithAi`); the story that wires any of the other five writes the same record and is counted against the same cap. A call stopped before it reaches OpenRouter writes no record: stopped by the session read, the `ai-read` rate limit, the workspace check (`spend-cap-5`), the cap (`spend-cap-3`), a missing `OPENROUTER_API_KEY`, or a brief that `interpretBrief` refuses before the adapter runs. A request that reached OpenRouter is recorded whatever happens after: an answer refused by `llmInterpreter` or `interpretBrief` (not JSON, outside `llmAnswerSchema`, a quote not in the brief, another model) was still paid.
- **spend-cap-2 (the month).** A month is a calendar month in Asia/Bangkok: it starts at 00:00 on the 1st, Bangkok time (17:00 UTC on the last day of the month before; Thailand has no daylight saving), as ORV-112 starts its day (`BANGKOK_OFFSET_SECONDS` in `packages/auth/src/rate-limit.ts`). A record belongs to the month of the time the server writes it. A new month starts at a sum of 0; no record is deleted or changed for that (worked example 1).
- **spend-cap-3 (the check and the answer).** Before each model call the server reads the workspace's sum of reported costs for the current month (`spend-cap-2`). The order is fixed: the session, the `ai-read` rate limit (ORV-112, unchanged), the workspace (`spend-cap-5`), the cap, then the call. A call refused by the rate limit never reads the cap.
  - If the sum is at or above the cap (`spend-cap-4`), the job is not called. For `interpret` the action returns `{ ok: false, error: "ai-spend-cap", code: "AI_SPEND_CAP", retryable: false }`; the studio keeps the rules' reading and shows the `saved.errors["ai-spend-cap"]` line in the note row under "Read with AI", with the word `direction.aiNotice` ("Check this" / "โปรดตรวจดู") above it, as ORV-112 shows a rate-limit notice, and not also in the card's notice region. Nothing retries it.
  - A job without a rule-based fallback answers status 429 with code `AI_SPEND_CAP` and `retryable: false` (ADR 0015 decision 4). No such job is called today; the first story that wires one carries this answer and its test.
  - If the sum is below the cap, the call goes ahead, even when its cost will take the sum past the cap.
- **spend-cap-4 (the cap value).** One cap in US dollars, the same for every workspace, set on the server: never from the client, a workspace member or a request. It is one cap per workspace over every AI job together, not one per job; each record names its job so a per-job cap can come later. The figure is open question 1.
- **spend-cap-5 (whose workspace).** The call is charged to the session's active workspace (`activeOrganizationId`), checked through `withWorkspace` with minimum role `member`, as every other directions action does. A workspace id from the client never picks the workspace. Without an active workspace, or for a person who is not a member of it, the job is not called, nothing is recorded, and the action returns `forbidden` as the other actions do.
- **spend-cap-6 (failures).** If the month's sum cannot be read, or reading it takes longer than 2 seconds (the bound ORV-112 uses for its store), the job is not called and the action returns `ai-failed`: the cap fails closed, as the rate limit does. A request that reached OpenRouter and came back without a reported cost (an error status, a timeout, a network error, an answer without the cost field) is recorded with its cost marked as not reported, never as 0, and that record adds nothing to the sum (open question 3). If writing the record fails after an answer, the reading is kept and the failure is logged by error name only (open question 4).
- **spend-cap-7 (the record).** A usage record can answer: which workspace, which person (Better Auth's user id from the session), which job and pinned model id, when the server wrote it, and the cost OpenRouter reported or that none was reported. It holds no brief, prompt, answer text, email or IP, and neither does any log line about it. Amounts are integers, never floats (ADR 0015 decision 12); the unit is open question 2. Records are workspace data: written and read only by server code through the authorization helper, inside a transaction scoped to the workspace (`inWorkspace`), with row security keyed by workspace id (ADR 0002). The app role may insert and select records and may not update or delete them; no other role holds a grant. The table, columns and migrations are the tech notes' to design.
- **spend-cap-8 (the reported cost).** The amount counted is the cost OpenRouter reports for that request, in US dollars, never a price worked out from ADR 0009's table or a token count. Which field of the chat completions answer carries it is not yet in a knowledge entry (K-0072 covers `usage.cost` on the Image API only); open question 8.

Bounds:

- **Overshoot.** The check is before the call, so a workspace can end a month above its cap by the cost of the calls that were already past the check when the sum reached it, plus any calls with no reported cost (`spend-cap-6`). One `interpret` call is about 1.4 US cents (worked example 3), and ORV-112 caps each person at 10 calls an hour. Accepted at these numbers.
- **The month is fixed and aligned**, not rolling: a workspace capped on the 30th can read with AI again on the 1st.
- **Thai and English copy together, no middot, no em dash.**

## Copy

One new catalog string and five existing ones. The ids are used in the acceptance rows.

- **C1** (new), `saved.errors["ai-spend-cap"]` in `apps/web/i18n/messages.ts`, beside `ai-failed` and `ai-rate-limited`. English: "This workspace has used its AI budget for this month, so the rules' reading is used. AI can read again when the new month starts." Thai: "เวิร์กสเปซนี้ใช้งบ AI ของเดือนนี้ครบแล้ว จึงใช้การอ่านตามกฎแทน อ่านด้วย AI ได้อีกครั้งเมื่อขึ้นเดือนใหม่"
- **C2** (existing), `saved.errors["ai-failed"]`. English: "AI could not read the brief, so the rules' reading is used." Thai: "AI อ่านบรีฟไม่สำเร็จ จึงใช้การอ่านตามกฎแทน"
- **C3** (existing), `saved.errors.forbidden`. English: "This account is not allowed to do this in this workspace." Thai: "บัญชีนี้ไม่มีสิทธิ์ทำสิ่งนี้ในเวิร์กสเปซนี้"
- **N1** (existing), `direction.aiNotice`, the word above a note: "Check this" / "โปรดตรวจดู"
- **B1** (existing), the heading badge `byRulesOnly`: "Read by rules" / "อ่านตามกฎ"
- **B2** (existing), the heading badge `byAi`: "Read by AI ({model})" / "อ่านโดย AI ({model})"

## Acceptance criteria

Rows run with an injected clock and a test cap of 0.05 US dollars unless a row says otherwise. "A call" is one call the fake `fetch` (the `fetchSpy` of `apps/web/app/directions/actions.test.ts`) sees; it answers with a recorded OpenRouter answer whose reported cost is 0.014 US dollars unless a row says otherwise. Amounts are US dollars. The row notes and the tests follow the table.

| #   | Given                                       | When                                   | User sees                              | Data effect                            |
| --- | ------------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- |
| 1   | A member of W; W's sum is 0                 | They read with AI                      | The AI reading; badge B2               | 1 call; 1 record of 0.014; sum 0.014   |
| 2   | W's sum is 0.05; Thai or English UI         | They read with AI on `/directions`     | Rules' reading, badge B1; notice C1    | 0 calls; no record; outcome O1         |
| 3   | W's sum is 0.049                            | They read with AI twice                | AI reading, then notice C1             | 1 call; sum 0.063                      |
| 4   | P in W (sum 0.05) and X (sum 0), active X   | P reads with AI                        | The AI reading                         | Record is X's; W's sum unchanged       |
| 5   | W's records worth 0.05 at 16:59:59Z, 31 Oct | Reads at 16:59:59Z, then 17:00:00Z     | Notice C1, then the AI reading         | New record in November; October kept   |
| 6   | An answer with cost 0.014 that is refused   | They read with AI                      | Line C2; rules' reading kept           | 1 record of 0.014; sum +0.014          |
| 7   | No cost reported (500, abort, no field)     | They read with AI                      | Line C2; rules' reading kept           | 1 record, cost not reported; sum same  |
| 8   | The month's sum cannot be read in time      | They read with AI                      | Line C2; rules' reading kept           | 0 calls; no record                     |
| 9   | The record write throws after an answer     | They read with AI                      | The AI reading                         | No record; 1 log line, error name only |
| 10  | No active workspace, or not a member        | They call `readBriefWithAi`            | Card notice C3; rules' reading kept    | 0 calls; no record                     |
| 11  | Over `ai-read`'s hour limit; W sum 0.05     | They read with AI                      | ORV-112's `ai-rate-limited` notice     | Sum never read; no record              |
| 12  | A brief holding `ORV121-MARKER`             | Rows 1, 6 and 7 run with it            | As in those rows                       | Marker in no record, no console call   |
| 13  | Records of A and B; fresh migrations        | Scoped to A; app role updates, deletes | Not applicable                         | Only A's rows; update, delete refused  |
| 14  | The new string                              | `pnpm lint` runs                       | Thai and English, no middot or em dash | None                                   |

Row notes:

- **Row 1** (`spend-cap-1`, `spend-cap-7`). The record is W's, the person's, job `interpret`, model `anthropic/claude-sonnet-5.5`, cost 0.014.
- **Row 2** (`spend-cap-3`). This is ADR 0015 decision 4's confirmation test. N1 sits above C1 in the note row under "Read with AI", and C1 is not also in the card's notice region; "Read with AI" is enabled again. O1 is the over-cap outcome `spend-cap-3` names. Both locales are checked.
- **Row 3** (`spend-cap-3`, Bounds: overshoot). The first read gets an AI reading and takes the sum past the cap; the second makes no call.
- **Row 4** (`spend-cap-5`). P is a member of W and X, with X as the session's active workspace.
- **Row 5** (`spend-cap-2`, worked example 1). The times are `2026-10-31T16:59:59Z` and `2026-10-31T17:00:00Z`, by the injected clock; a member reads at each.
- **Row 6** (`spend-cap-1`). Three runs, each answer carrying a cost of 0.014: not JSON; JSON outside `llmAnswerSchema`; a quote not in the brief. Each run adds one record of 0.014.
- **Row 7** (`spend-cap-6`). Three runs: status 500; an answer without the cost field; a `fetch` that rejects as an aborted request. Each run adds one record with its cost marked not reported, never 0.
- **Row 8** (`spend-cap-6`). Two runs: reading the sum throws; reading the sum takes longer than the bound `spend-cap-6` sets.
- **Row 9** (`spend-cap-6`). The log line holds the error's class name and no brief, key or amount.
- **Row 10** (`spend-cap-5`). Two runs: no active workspace; an active workspace the person is not a member of. The outcome is `forbidden`.
- **Row 11** (`spend-cap-3`, order). The notice is ORV-112's, with its wait, and not C1.
- **Row 12** (`spend-cap-7`). The marker appears in no usage record and in no argument of any `console` call.
- **Row 13** (`spend-cap-7`). In a transaction scoped to A, only A's records come back. `orivilo_app` is refused an update and a delete. Row security is on, and the only grantees on the table are its owner and `orivilo_app`.

Tests (names are proposals; the builder keeps them or names the one it wrote):

- Rows 1 to 12: `apps/web/app/directions/actions.test.ts`, one test per row: "a reading records its reported cost", "a capped workspace gets the rules' reading without a model call", "the call that crosses the cap completes, the next is refused", "the cap is per workspace", "a new Bangkok month starts at zero", "a refused answer still counts its cost", "a call with no reported cost is recorded as not reported", "the cap check fails closed", "a failed record keeps the paid reading", "AI reading needs a workspace the person belongs to", "the rate limit answers before the cap", "no brief text in a record or a log line". Row 2 also in `read-outcome.test.ts`, both locales.
- Row 13: `access.test.ts` and `migrate.test.ts` in `packages/db`.
- Row 14: `check-i18n` and the copy check in `pnpm lint`.

## Worked examples

Not run in this task (no shell). Each is one `node -e` line; the expected output is what the spec requires.

1. **Month bounds** (`spend-cap-2`). Input: the two instants of row 5. For each, the start and the end (exclusive) of its Bangkok month, as ISO strings, exact to the millisecond, no rounding. Expected output, two lines: `2026-09-30T17:00:00.000Z 2026-10-31T17:00:00.000Z` then `2026-10-31T17:00:00.000Z 2026-11-30T17:00:00.000Z`.

```bash
node -e 'const B=7*3600e3;for(const s of ["2026-10-31T16:59:59Z","2026-10-31T17:00:00Z"]){const b=new Date(Date.parse(s)+B);const y=b.getUTCFullYear(),m=b.getUTCMonth();console.log(new Date(Date.UTC(y,m,1)-B).toISOString(),new Date(Date.UTC(y,m+1,1)-B).toISOString())}'
```

2. **Amount to an integer** (open question 2, default unit: millionths of a US dollar). Input: the reported cost as the decimal text of the JSON number; `0.014` is worked example 3's call cost, the others test the rounding. Rounded half to even at the millionth (ADR 0015 decision 12, one rounding rule). Expected output: `14000 12 14 13 5000000`.

```bash
node -e 'const toMicro=s=>{const [i,f=""]=s.split(".");const d=(f+"0000000").slice(0,7);let m=BigInt(i+d.slice(0,6));const r=Number(d[6]);const rest=/[1-9]/.test(f.slice(7));if(r>5||(r===5&&(rest||m%2n===1n)))m+=1n;return m};console.log(["0.014","0.0000125","0.0000135","0.00001251","5"].map(x=>String(toMicro(x))).join(" "))'
```

3. **The default cap in readings** (open question 1). Input: ADR 0009's `interpret` price (2 and 10 US dollars per million input and output tokens) and its typical reading (2,000 input and 1,000 output tokens), the ORV-112 day limit of 50 readings per person, the 20 US dollar key limit of ADR 0009 point 7, and the default cap of 5 US dollars, all in millionths of a dollar. Printed: the cost of one reading (ADR 0009 rounds it to "about 1.5 US cents"), whole readings under the cap (rounded down), one person's most in a day, the days one person needs to reach the cap (two decimals, rounded half up by `toFixed`), and how many capped workspaces the key covers. Expected output: `14000 357 700000 7.14 4`.

```bash
node -e 'const read=2000*2+1000*10,cap=5_000_000,day=50*read;console.log(read,Math.floor(cap/read),day,(cap/day).toFixed(2),20_000_000/cap)'
```

## Out of scope

- A page or report that shows a workspace its spend, warnings before the cap (for example at 80 percent), and any email or alert.
- A cap set per workspace, a top-up, billing or any charge to a customer. No money is taken from anyone; the cap only stops calls.
- The cost estimate before an image round and its check against the remaining cap (ADR 0018 decision 4); that is the logo image story's, and it reads this story's sum.
- Pruning or archiving usage records.
- The client retry matrix and the request id (ORV-113). Classification tags for the new columns land with ORV-113's `classification.ts`, or with this story if that file exists by then.
- Reconciling records with OpenRouter's own activity log.

## Open questions (option, impact, default)

1. **The cap figure.** Options: 5, 10 or 20 US dollars per workspace per month. Impact: at about 1.4 US cents a reading, 5 dollars is 357 readings, and one person at ORV-112's day limit reaches it in about 7 days; the 20 dollar staging key covers 4 capped workspaces (worked example 3). 20 dollars equals the whole key, so the cap would never stop a workspace before the key does. **Default: 5 US dollars.**
2. **The integer unit for amounts.** ADR 0015 decision 12 says minor units (cents for US dollars). Options: (a) cents; (b) millionths of a US dollar, an integer with the currency code `USD` beside it. Impact: (a) rounds a 1.4 cent reading to 1 cent, an under-count of about 29 percent per call (0.4 of 1.4); (b) keeps every reported digit to the millionth and is an addition to decision 12 that the architect records. **Default: (b)**, rounded half to even (worked example 2).
3. **A request with no reported cost.** Options: (a) record it as not reported and add nothing to the sum; (b) add a fixed estimate (1.4 cents for `interpret`); (c) look the cost up from OpenRouter later. Impact: (a) can under-count by the calls that time out or fail after OpenRouter started work; (b) counts calls OpenRouter may not bill; (c) adds a second call and a job to run it. **Default: (a)**, as ADR 0018 decision 4 stores a missing `usage.cost` as unknown, never zero (`spend-cap-6`).
4. **The record write fails after a paid answer.** Options: (a) keep the reading and log; (b) discard the reading and return `ai-failed`. Impact: (a) the sum misses that call; (b) throws away a reading the workspace paid for. **Default: (a)** (`spend-cap-6`).
5. **When AI comes back, in the notice.** Options: (a) "when the new month starts", no date; (b) the date of the 1st in the person's language. Impact: (b) needs a Thai date format (Buddhist year or not) for one line. **Default: (a)** (Copy).
6. **One cap for every job or one per job.** Options: (a) one cap per workspace over every AI job; (b) a cap per job per workspace. Impact: ADR 0015 decision 4 reads "each AI job has ... a spend cap per workspace", which (a) meets by applying the one cap to each job; (b) needs a figure per job, and only one job is called today. **Default: (a)** (`spend-cap-4`).
7. **Size.** The story touches a migration pair, the model call's return, the action, the helper and one string, so it may pass about 400 changed lines. Options: one PR; or two vertical slices, (i) the record and its cost (rows 1, 6, 7, 9, 12, 13) and (ii) the cap (rows 2 to 5, 8, 10, 11, 14). **Default: one PR**; the builder splits as (i) and (ii) if the diff passes about 400 lines.
8. **Where OpenRouter reports the cost on chat completions.** No knowledge entry covers it. Options: a `research` entry on OpenRouter's chat completions answer (the `usage` object and whether its cost field needs a request flag) before the tech notes; or the architect reads it while writing them. **Default: a `research` entry first**, and the tech notes cite it (`spend-cap-8`).

## Tech notes

Needed, from the `architect`, before build (POC mode: a contract changes). The contracts: `Complete` and `openRouterComplete` in `packages/intent-engine` return the reported cost beside the answer text (callers: `llmInterpreter` and its tests); `Outcome` in `apps/web/app/directions/actions.ts` gains the `ai-spend-cap` failure (callers: `SavedStudio.tsx`, `read-outcome.ts`); a new table with its generated and access migrations in `packages/db`; the sum and record helper behind the authorization helper.

## Decisions

- **ORV-121 comment 10258**, decided under the owner's delegation (ADR 0012 decision 4, POC mode of ORV-137): lane L, POC mode, and the four spec defaults: the cap is per workspace per calendar month in US dollars from OpenRouter's reported usage (`spend-cap-2`, `spend-cap-4`, `spend-cap-8`); over the cap the job is not called and the rule-based fallback is kept and labelled (`spend-cap-3`, rows 2 and 3); `AI_SPEND_CAP` with `retryable: false` where no fallback exists (`spend-cap-3`); the default budget figure is an open question with a default (open question 1).
- **ADR 0015 decision 4**: the cap, its unit and its answer, counters in a store every instance shares (Postgres through the restricted role), and the confirmation test that a capped workspace gets the rules' reading without a model call (row 2).
- **ORV-112 Decision 2** (G1, open question 2, default b): the spend cap split from ORV-112 into this story.
- **This spec's choice, not yet the owner's:** the `interpret` outcome carries `code: "AI_SPEND_CAP"` and `retryable: false` although `interpret` has a fallback, because ADR 0015 decision 7 asks outcome objects to carry the same `code` and `retryable` fields, and a later retry helper then reads one code (`spend-cap-3`).

## Depends on

ADR 0002 (server-only data access, restricted role, row security by workspace), ADR 0009 (points 3, 7 and 8: rule-based fallback, key credit limit, tests on recordings; the `interpret` price), ADR 0012 decision 4 (delegation), ADR 0015 decisions 3, 4, 7, 12 and 13, ADR 0018 decisions 4 and 7 (a missing `usage.cost` stored as unknown; image jobs counted against this cap later), spec ORV-112 (the `ai-read` limit, the action order in `run`, the note row and `direction.aiNotice`, the 2 second store bound, the Bangkok day), ORV-113 (error codes list, retry matrix, request id, classification tags), `.claude/rules/security.md` rules 2, 6, 8 and 12.

## Changelog

- v1.0 (2026-10-29): first spec. Downstream to review once accepted: ADR 0015 decision 3 (LLM06:2026 row), decision 4 (Confirmation and an addition with the cap figure), decision 12 (the unit of open question 2) and "Not done yet"; `.claude/rules/security.md` rule 6 (the cap figure); ADR 0018 decision 7 (it says ORV-121 reads the `usage.cost` stored by the image record; under `spend-cap-1` every AI request writes this story's usage record); the tech notes `docs/specs/ORV-121/tech.md` (to write).
