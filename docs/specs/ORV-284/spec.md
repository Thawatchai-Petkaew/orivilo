---
issue: ORV-284 (https://tpetkaew.atlassian.net/browse/ORV-284)
lane: M
version: 1
---

# ORV-284: analysis jobs on Anthropic models with the owner's own key, image jobs on an image model

## The whole structure

- **Jobs: 8 named in the repo, 6 of them pinned in code.** `AI_MODELS` in `packages/intent-engine/src/openrouter.ts` (lines 11 to 18) pins 6: `chat`, `instant`, `interpret`, `see`, `logo-vector`, `logo-image`. Two more are decided in ADRs but not in `AI_MODELS` on this branch: `business-read` (ADR 0009 addition of 2026-11-18, ORV-281 slice 3) and `mockup-image` (ADR 0018 decision 2, ADR proposed).
- **Classes under the owner's words: 2.** Analysis or prompt writing goes on an Anthropic model; image generation keeps an image model. Every job falls in one class or is an open question (`anthropic-jobs-1`).
- **Moves by default: 2 of the 8** (`instant`, `see`). Stays: 6 (W1). Jobs with a call path today: 1 (`interpret`). Jobs with a recorded evaluation set today: 1 (`interpret`).
- **Rules: 6** (`anthropic-jobs-1`, `byok-cost-1`, `byok-route-1`, `byok-fail-1`, `eval-rerecord-1`, `real-call-1`). **Acceptance rows: 12**, none renders a screen. **Rows that need a real, paid call: 1 always (row 9), 1 only if the owner changes a model of a job with a recorded set (row 11).** **Open questions: 8.**

## Why

The owner decided on 2026-11-18 (ORV-284): work that analyses, or writes prompts to direct other work, uses Anthropic's models, each chosen by what the job needs and fitting for the MVP and POC, to be changed later; work that generates images keeps a model that can make images. The owner added an Anthropic key to OpenRouter as their own provider key ("BYOK") and reports that their own test passed. No ORIVILO call has yet been looked at for its cost fields under that key.

Three things change with the key, and only one of them is the model map:

- **The model map.** ADR 0009 point 2 pins one model per job from any vendor. Two pinned jobs that read or write text use other makers (`instant` on `inception/mercury-3`, `see` on `google/gemini-4-argon`). Changing a pin is a contract change (ADR 0009 point 2).
- **What the spend cap counts.** The cap sums `usage.cost` per request (ORV-121 `spend-cap-8`, security rule 6). K-0412 (confidence 0.75) records as not stated which amount `usage.cost` holds on a request through the owner's key. Its reading, labelled ours, is that it then holds only OpenRouter's fee, while the provider's charge to the owner's Anthropic account sits in another field. If that reading holds, the cap under-counts every request the owner's key serves, possibly to 0 (W2). This may already apply to `interpret` on staging, since the key was added; it is our reading, not a fact, until row 9 looks at a real answer.
- **Where a request can go.** Every request sets zero retention (`openRouterBody`, line 79), and K-0413 (confidence 0.75) leaves open whether such a request can reach the endpoint where the owner's key applies (`byok-route-1`, open question 4).

**Frame.** This is not a guard that judges a tool call's text. The spend cap is a server control: records and the sum live in our Postgres, written by server code through the restricted role (ORV-121 "Frame"). Its outer bound is held outside our code: the key's credit limit in OpenRouter (ADR 0009 point 7) and, for requests through the owner's key, the owner's provider account (open question 6).

**What is real and what is not.** Nothing new is simulated. The moved jobs `instant` and `see` have no call path, so no screen starts saying they run. Every price below is company-reported by OpenRouter (K-0413) or the list price ADR 0009 recorded on 2026-10-23, not measured by us. Tests never call a model (ADR 0009 point 8); the answers in rows 5 to 8 are constructed fixtures, labelled as such, shaped after the real answer of row 9.

## Story

As the owner paying for AI, I want each analysis job on the Anthropic model that fits it, served through my own Anthropic key where OpenRouter allows it, and image jobs kept on an image model, so that one provider account carries the analysis work, and the spend cap still counts every dollar a call costs me, whichever account pays it.

## Rules

Each rule below is the one home of its outcome. Other sections name the rule only.

### anthropic-jobs-1

The class, today's pin and the default pin of each job. "What it does" is what the repo shows: ADR 0009 point 2's table, ADR 0018 decision 2, or the code named. A job the owner's two classes do not settle is an open question; its default is in the table.

| Job | What it does, as the repo shows it | Call path today | Class | Today | Default | Moves | Why this model |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `chat` | The Studio conversation, streamed (ADR 0009 point 2) | None | Analysis: reads what the person says and answers | `anthropic/claude-sonnet-5.5` | `anthropic/claude-sonnet-5.5` | No | Strong Thai and a long conversation are the job's need (ADR 0009); already Anthropic |
| `instant` | Chips, one-line rewrites, labels, hints while typing (ADR 0009 point 2) | None | Not settled by the owner's words (open question 1) | `inception/mercury-3` | `anthropic/claude-haiku-5.5` | Yes | Short, cheap, frequent: the cheapest live Anthropic tier, 0.10 / 0.50 (K-0413), against Mercury's 0.10 / 0.35 (ADR 0009, 2026-10-23). Speed is not stated in K-0413 |
| `interpret` | Brief and Studio answers to structured facts (ADR 0009 point 2); `readBriefWithAi`, `apps/web/app/directions/actions.ts` line 386 | Yes | Analysis | `anthropic/claude-sonnet-5.5` | `anthropic/claude-sonnet-5.5` | No | Strict JSON and close Thai reading; its 9 recordings come from this model (ADR 0009 addition of 2026-10-30) |
| `business-read` | The six business answers of the ORV-281 intake to readings with exact quotes (ADR 0009 addition of 2026-11-18) | Not on this branch | Analysis | `anthropic/claude-sonnet-5.5` (decided, not in code) | `anthropic/claude-sonnet-5.5` | No | The same reading skill as `interpret` (that addition) |
| `see` | Images to traits, colours and evidence, with the brief in the same call (ADR 0009 point 2); a member of `MODEL_JOBS` (`packages/intent-engine/src/evidence.ts` line 110) | None | Analysis: reads images | `google/gemini-4-argon` | `anthropic/claude-sonnet-5.5` | Yes | Image input is listed on every live Anthropic model (K-0413); the same price as Argon's 2 / 10 of 2026-10-23 and the same tier as `interpret`, whose reading it feeds |
| `logo-vector` | A mark and a wordmark as SVG the person can edit (ADR 0009 point 2) | None | Writes SVG as text; on an Anthropic model under either reading (open question 3) | `anthropic/claude-opus-5.5` | `anthropic/claude-opus-5.5` | No | Few, high-value calls on clean geometry (ADR 0009) |
| `logo-image` | Logo drafts as raster images (ADR 0009 point 2, ADR 0018 decision 2) | None | Image generation | `google/gemini-nano-banana-2.1` | `google/gemini-nano-banana-2.1` | No | Makes images; ADR 0018 decision 2 and its exit test stand |
| `mockup-image` | Touchpoint mockups of the chosen direction (ADR 0018 decision 2, proposed) | None, not in `AI_MODELS` | Image generation | Not pinned | Its ADR 0018 model when its story adds it | No | Makes images; ADR 0018 stands |

The models an analysis job may take, from K-0413 (company-reported, US dollars per million input / output tokens, base endpoints first, regional endpoints after; each with a 1,000,000-token context and image input):

| Model | Price | Endpoints in the zero-retention list that also list `structured_outputs` (K-0413, own count, a lower bound) |
| --- | --- | --- |
| `anthropic/claude-haiku-5.5` | 0.10 / 0.50; 0.11 / 0.55 | 3 |
| `anthropic/claude-sonnet-5.5` | 2 / 10; 2.20 / 11 | 3 |
| `anthropic/claude-opus-5.5` | 4 / 20; 4.40 / 22; 8 / 40 on the fast endpoint | 3 |
| `anthropic/claude-fable-5.2` | 8 / 40; 16 / 80 on the fast endpoint | 0: not an option while every request requires zero retention (W4) |

The image jobs keep their image model and do not use the owner's key, which is an Anthropic key. These pins are the POC's picks: ADR 0009 Consequences ("Price and model changes") revisits them, and each later change is a contract change with its own ADR 0009 addition.

### byok-cost-1

The amount the spend cap counts for one request is never less than what the request cost in total: what OpenRouter took from its credits plus what the provider charged the owner's own account.

- K-0412 records, as company-reported fact, that `usage.cost` is "the total amount charged to your account" and that the upstream inference cost is "the actual cost charged by the upstream AI provider". It records as not stated which amount `usage.cost` holds on a request through the owner's key. Its reading, ours and not stated, puts only OpenRouter's fee in `usage.cost` on such a request: 0 inside a plan's allowance, 5 percent of the OpenRouter price above it (K-0412, company-reported). W2 shows what counting `usage.cost` alone would then miss.
- Which reported amounts make up the total, and how the server tells a request through the owner's key from one on OpenRouter's capacity, is the architect's design, made after the real answer of row 9 and checked against it.
- A request not served through the owner's key counts what `spend-cap-8` counts today, with no charge counted twice.
- A request whose total cannot be read in full (a part missing, null, or not a number) is recorded as not reported, never 0, and adds nothing to the sum, as security rules 6 and 12 and ORV-121 `spend-cap-6` say, with the step line `spend-cap-6` names. What follows if that is every request through the owner's key is open question 7.
- The cap figure, the month, the order of checks and the answer over the cap stay ORV-121's (`spend-cap-2` to `spend-cap-5`); this rule changes only what one record counts.

### byok-route-1

Every chat completions request keeps the provider settings `openRouterBody` sends today (zero retention, data collection denied, `require_parameters`, no fallback provider; ADR 0009 point 4), for every job `anthropic-jobs-1` puts on an Anthropic model, whether or not the owner's key can then serve it. No request drops zero retention to reach the owner's key. `see` moves with this rule from safety retention (ADR 0009 addition of 2026-10-23, which allowed it for Google only) to zero retention, as `interpret`.

K-0413's open point, kept as it is labelled there: the zero-retention list read holds the Anthropic models' Amazon Bedrock and Google endpoints and no first-party Anthropic endpoint, and OpenRouter's ZDR guide says enforcement "Removes first-party Anthropic endpoints (Bedrock and Vertex remain available)" (fact, company-reported). That a request with zero retention on therefore never reaches the endpoint where the owner's key applies is our reading; no page states it. Row 9 reads from a real answer whether the owner's key was used. Changing the setting is open question 4.

### byok-fail-1

When the owner's key fails or is rate limited, what OpenRouter does next is set per key in the owner's OpenRouter account, not in our code. By default OpenRouter falls back to its shared capacity, which spends OpenRouter credits (K-0412, company-reported). Whether our `allow_fallbacks: false` stops that is not stated (K-0412). Our code does this in each case:

- **An answer served on shared capacity** is the same pinned model; it is accepted as any answer is (the `orv160-answer-model` check stands) and counted by `byok-cost-1` as a request not through the owner's key.
- **An error answer** (OpenRouter answers 429, 401 or any other error status) ends the call as a failure: no retry, no other model, the job's fallback of ADR 0009 point 3, and one usage record with its cost not reported (`spend-cap-1`, `spend-cap-6`).

The account setting is open question 5.

### eval-rerecord-1

A job whose pinned model changes, and that has a recorded evaluation set, has that set recorded again from the new model before the change merges, and its replay test passes on the new recordings (ADR 0009 point 2). The jobs with a set: `interpret` today (`packages/intent-engine/src/llm-recorded.json`, 9 cases, recorder `scripts/probe/openrouter-interpret-record.mjs`), and `business-read` once ORV-281 slice 3 lands (22 calls, ADR 0009 addition of 2026-11-18). Under the defaults of `anthropic-jobs-1` neither changes, so no set is recorded again in this story. A moved job with no call path and no set (`instant`, `see`) records nothing here; the story that adds its call path records its first set on the model this story pins. `instant`'s exit test of ADR 0009 point 2 (Mercury's Thai against `openai/gpt-6-luna`) ends with the move.

### real-call-1

A run that sends real requests to a model costs money. Each such run waits for the owner's confirmation, in a Jira comment on ORV-284, of its bound (the number of calls, no retry, the abort per call) and its estimated cost (W3), as `orv160-recorder-run` asks for the `interpret` recorder. The key reaches the run only from an env file that is never committed, never from a command, a chat or a fixture. The run is outside `pnpm test`. Runs in this story:

- **Always (row 9):** one call on the `interpret` model with one ordinary brief written for the run, holding no personal data; about 1.4 US cents (W3).
- **Only if the owner's answer to open question 3 changes the model of a job with a set (row 11):** that job's recorder, at the bound its ADR addition sets (9 calls for `interpret`).

## Strings

None. No screen changes: the moved jobs have no call path, and `interpret` keeps its model, so its badge "Read by AI (anthropic/claude-sonnet-5.5)" stays as it is.

## Acceptance criteria

Tests use recorded or constructed answers and a fake `fetch`; none reaches a model (ADR 0009 point 8), except the run of row 9 and the conditional run of row 11, each under `real-call-1`. Amounts are US dollars; counted amounts are in millionths of a US dollar (ADR 0015 decision 12, addition of 2026-10-29). Test names are suggestions.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | `AI_MODELS` on the PR head | The pinned-jobs test runs | No UI | Exactly: `chat` `anthropic/claude-sonnet-5.5`, `instant` `anthropic/claude-haiku-5.5`, `interpret` `anthropic/claude-sonnet-5.5`, `see` `anthropic/claude-sonnet-5.5`, `logo-vector` `anthropic/claude-opus-5.5`, `logo-image` `google/gemini-nano-banana-2.1`; and `business-read` `anthropic/claude-sonnet-5.5` if ORV-281 slice 3 merged first (W1) | `openrouter.test.ts` row 12 (`orv160-model-ids`) |
| 2 | The jobs `anthropic-jobs-1` puts on Anthropic models: `chat`, `instant`, `interpret`, `see`, `logo-vector`, and `business-read` when present | A test reads each pinned id | No UI | Each is one of `anthropic/claude-haiku-5.5`, `anthropic/claude-sonnet-5.5`, `anthropic/claude-opus-5.5`; `logo-image` does not start with `anthropic/` | `openrouter.test.ts` "analysis jobs on Anthropic models" |
| 3 | `openRouterBody` with the pinned id of `see`, then of `instant` | The body is built | No UI | `model` is the pinned id; `provider` is exactly `{ zdr: true, data_collection: "deny", require_parameters: true, allow_fallbacks: false }` (`byok-route-1`) | `openrouter.test.ts` "moved jobs keep the provider settings" |
| 4 | The ADR 0009 addition for ORV-284 | The reviewer reads it | No UI | It records: the owner's two classes; the two moves with their K-0413 prices and the date 2026-11-18; the end of `instant`'s Mercury exit test; `see` on zero retention in place of safety retention; that `instant` and `see` record their first set on the new model; `byok-cost-1` as the cap's counting rule. The decided table of point 2 is not rewritten | Reviewer on the ADR diff |
| 5 | A constructed answer through the owner's key, labelled as constructed, reporting OpenRouter's charge as 0 and the provider's charge as 0.014, in the shape row 9's answer shows | The call returns and its cost is recorded | No UI | The counted cost is at least 14000, never 0 (W2) | Test in the module the tech notes name, "counts the provider's charge" |
| 6 | The same, with OpenRouter's charge 0.0007 and the provider's charge 0.014 | The same | No UI | The counted cost is at least 14700 (W2) | The same test file, "counts the fee and the provider's charge" |
| 7 | A constructed answer not through the owner's key reporting `usage.cost` 0.014 | The same | No UI | The counted cost is exactly 14000, as `spend-cap-8` counts today | The same test file, "a credits answer counts as before" |
| 8 | A constructed answer through the owner's key whose provider charge is, in turn, missing, null, and the string `"0.014"` | The same | No UI | Each is recorded with its cost not reported (null, never 0); the sum is unchanged; one `cost-not-reported` step line each (`byok-cost-1`, `spend-cap-6`) | The same test file, "an unreadable total is not reported" |
| 9 | The owner confirmed, in a Jira comment, the bound (1 call, no retry, a 20 s abort) and the cost (about 1.4 US cents, W3) | One real call on the `interpret` model runs under `real-call-1` | No UI | The answer's cost field names and values, whether it reports the owner's key as used, and the provider that served it are recorded in an update of K-0412; no key, brief, answer text or email in that record. The design of `byok-cost-1` cites it | Owner's Jira comment; K-0412 diff; `node scripts/check-knowledge.mjs` |
| 10 | A recorded error answer, status 429, then status 401 | `openRouterComplete` runs | No UI in this row; the person sees the job's fallback of ADR 0009 point 3 as today (for `interpret`, ORV-121 row 7) | It throws; one request, no second; `onCall` once with cost null (`byok-fail-1`) | `openrouter.test.ts` "a failed own key ends the call" |
| 11 | Each job with a recorded set: `interpret`, and `business-read` when present | The gate runs | No UI | The set's recorded model equals the job's pinned id. Under the defaults no set is recorded again. If open question 3 changes such a job's model, its recorder runs under `real-call-1` (9 calls for `interpret`, W3) and the replay passes on the new set (`eval-rerecord-1`) | `llm-recorded.test.ts`; the recorder's output when it runs |
| 12 | The PR head | The gate runs | No UI | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass; no middot and no em dash in changed copy; no key, token or email in any changed file; `node scripts/check-knowledge.mjs` passes | Gate output |

## Rows that render nothing

- Rows: 1-12

## Rules and bounds

- **Delivery order.** (1) The owner answers the open questions and confirms row 9's run; (2) row 9 runs and K-0412 is updated; (3) the architect writes the tech notes and the ADR 0009 addition; (4) one PR with rows 1 to 8 and 10 to 12, likely well under 400 changed lines.
- **Overshoot.** ORV-121's bound on overshoot stands. Until `byok-cost-1` ships, a request through the owner's key may add less than it cost (our reading, K-0412).
- **No new number.** The cap stays 5 US dollars per workspace per Bangkok month over every job together (`AI_SPEND_CAP_MICRO_USD`, `packages/auth/src/spend-cap.ts` line 9); the rate limits stay ORV-112's.

## Out of scope

- A call path for `chat`, `instant`, `see`, `logo-vector`, `logo-image` or `mockup-image`, and the first evaluation set of any of them.
- A job that writes a prompt for another job (open question 8).
- The image jobs' provider, request shape and data policy (ADR 0018).
- The cap figure, a cap per job, a spend page, warnings before the cap, billing.
- Reconciling records with OpenRouter's activity endpoint; looking costs up later through the generation endpoint (unless open question 7 picks it).
- The owner's account settings in OpenRouter and at Anthropic, beyond recording the owner's answers to open questions 4 to 6.
- Streaming answers and their cost fields.

## Open questions for the owner (one round, with defaults)

1. **`instant`'s class and model.** The owner's two classes name analysis, prompt writing and image generation; chips, rewrites, labels and hints are none of these by name. Options: (a) treat it as text work and move it to `anthropic/claude-haiku-5.5` (0.10 / 0.50); (b) keep `inception/mercury-3` (0.10 / 0.35 on 2026-10-23) with its Thai exit test; (c) `anthropic/claude-sonnet-5.5` (2 / 10). Impact: (a) and (c) end the Mercury exit test and put every text job on one provider account; (a) has no stated speed figure (K-0413); (c) costs 20 times (a) per input token. **Default: (a).**
2. **`see`'s model.** Options: (a) `anthropic/claude-sonnet-5.5` (2 / 10); (b) `anthropic/claude-haiku-5.5` (0.10 / 0.50); (c) `anthropic/claude-opus-5.5` (4 / 20); (d) keep `google/gemini-4-argon`, reading images as outside "analysis". Impact: (a) to (c) take `see` to zero retention (`byok-route-1`); no option has a measured image reading in the repo, and the story that wires `see` records the first set either way. **Default: (a).**
3. **The models of the jobs that stay** (`chat`, `interpret`, `business-read`, `logo-vector`). Options: (a) keep them as `anthropic-jobs-1` shows; (b) `interpret` and `business-read` to `anthropic/claude-haiku-5.5` for cost, which re-records `interpret`'s 9 cases (about 0.6 US cents, W3) and `business-read`'s 22; (c) treat `logo-vector` as image generation and move it to an image model, which needs its own research and ADR. Impact: (b) risks the strict JSON and exact Thai quotes the current recordings show. **Default: (a).**
4. **Zero retention against the owner's key** (K-0413 open point, `byok-route-1`). Options: (a) keep zero retention on every request and accept that the owner's key may not be used, which row 9 shows; (b) drop zero retention for Anthropic jobs to reach the first-party endpoint, which goes against ADR 0009 point 4 and needs the owner's own ADR addition, with Anthropic's retention terms read first (no knowledge entry holds them); (c) the owner adds a provider key for a provider in the zero-retention list (Amazon Bedrock or Google Vertex), which K-0412 and K-0413 do not cover. Impact: (a) may leave the analysis calls on OpenRouter credits, counted as today. **Default: (a).**
5. **When the owner's key fails or is rate limited** (`byok-fail-1`). Options: (a) keep OpenRouter's default per-key setting, "Use shared capacity", so the call goes on with the same model on credits; (b) set the key never to fall back, so the call fails and the job's fallback applies. Impact: (a) keeps the reading working and spends credits within the key's credit limit; (b) keeps all analysis spend on the owner's account and shows more rule-based readings when the key is limited. **Default: (a).**
6. **The outer bound for spend through the owner's key.** K-0412 says BYOK inference spend does not count toward OpenRouter's guardrail budgets by default and can be included with "Include BYOK spend"; whether the key's credit limit of ADR 0009 point 7 is such a budget is not stated. Options: (a) the owner turns on "Include BYOK spend" for each environment's key; (b) leave it off and rely on limits in the owner's provider account. Impact: with neither, a cap that under-counts has no outer bound. **Default: (a).**
7. **If row 9 shows the provider's charge cannot be read from the answer.** Options: (a) record null as `byok-cost-1` says and ship, so the cap counts nothing for requests through the owner's key; (b) the owner pauses the key in OpenRouter until a design reads the charge, so requests run on credits and are counted as today; (c) the architect designs a later look-up of the charge through OpenRouter's generation endpoint (ORV-121 open question 3, option c), a second call per request. Impact: (a) leaves the cap blind for those requests; (b) defers the use of the key; (c) adds a call and a job. **Default: (b), then (c) as a follow-up story.**
8. **"Writes prompts to direct other work."** No job in the repo writes a prompt for another job, and ADR 0018 decision 3 says only deterministic code writes an image prompt (a model step that rewrites or enhances the prompt is under its "Not chosen"). Options: (a) no such job in this story; the class applies when a story adds one, and that story amends ADR 0018 decision 3 if the prompt is for an image job; (b) add one now. **Default: (a).**

## Gap list

- **Business:** closed by the owner's words on ORV-284. Assumed: open questions 1, 3 and 8.
- **Functional:** the map and the counting rule above. Assumed: open questions 2 and 5.
- **Technical:** for the architect after row 9: which fields make up the total, how a request through the owner's key is told apart, where the counting lives, the ADR 0009 addition, and whether ADR 0015 decision 4's addition of 2026-10-29 needs a further addition for "The sum".
- **UX:** not applicable; no screen changes.
- **Data and security:** assumed: open questions 4, 6 and 7. `security` reviews the PR (the diff touches `packages/intent-engine/**`, security rules preamble).
- **Risk:** K-0412 and K-0413 sit at 0.75 and leave the two central points unstated; row 9 is the only check of either.

## Worked examples

Not run: this role has no shell. Each line runs from the repo root with `node -e`. Outputs are exact integers or strings; no rounding is needed in W1, W2 and W4; W3 is exact in integer millionths.

W1. `anthropic-jobs-1` on `AI_MODELS` as copied from `openrouter.ts` lines 12 to 17: the moves, then the jobs left off Anthropic. Expected `2 instant inception/mercury-3>anthropic/claude-haiku-5.5 see google/gemini-4-argon>anthropic/claude-sonnet-5.5 logo-image`.

```bash
node -e 'const now={chat:"anthropic/claude-sonnet-5.5",instant:"inception/mercury-3",interpret:"anthropic/claude-sonnet-5.5",see:"google/gemini-4-argon","logo-vector":"anthropic/claude-opus-5.5","logo-image":"google/gemini-nano-banana-2.1"};const next={...now,instant:"anthropic/claude-haiku-5.5",see:"anthropic/claude-sonnet-5.5"};const m=Object.keys(now).filter(k=>now[k]!==next[k]);console.log(m.length,m.map(k=>k+" "+now[k]+">"+next[k]).join(" "),Object.keys(next).filter(k=>!next[k].startsWith("anthropic/")).join(","))'
```

W2. `byok-cost-1` on one typical `interpret` reading: 2,000 input and 1,000 output tokens (ADR 0009 Consequences) at `anthropic/claude-sonnet-5.5`'s base price 2 / 10 (K-0413), in millionths of a US dollar; the BYOK fee 5 percent of that price (K-0412). Printed: the provider's charge, the fee above the allowance, the total inside the allowance, the total above it, then what `usage.cost` alone would count under K-0412's reading (ours, not stated), inside and above the allowance. Expected `14000 700 14000 14700 0 700`.

```bash
node -e 'const p=2000*2+1000*10,fee=p*5/100;console.log(p,fee,p+0,p+fee,0,fee)'
```

W3. `real-call-1` cost estimates from list prices (K-0413 base endpoints, in hundredths of a US dollar per million tokens) on the typical reading of W2, in millionths of a US dollar: one call on Sonnet (row 9), then 9 calls of the `interpret` recorder on Haiku, Sonnet and Opus (row 11, open question 3). Expected `14000 6300 126000 252000`, that is 1.4 US cents, then 0.63, 12.6 and 25.2 US cents.

```bash
node -e 'const c=(i,o)=>(2000*i+1000*o)/100;console.log(c(200,1000),9*c(10,50),9*c(200,1000),9*c(400,2000))'
```

W4. Which live Anthropic models can serve a strict `json_schema` request with zero retention on: the "ZDR and SO" column of K-0413's table, copied in its row order. Printed: how many can, how many cannot, and the ones that cannot. Expected `12 4 anthropic/claude-opus-4.1,anthropic/claude-fable-5.2,anthropic/claude-fable-5.1,anthropic/claude-fable-5`.

```bash
node -e 'const t=[["haiku-5.5",3],["haiku-4.5",6],["sonnet-5.5",3],["sonnet-5",3],["sonnet-4.6",6],["sonnet-4.5",4],["opus-5.5",3],["opus-5",3],["opus-4.8",3],["opus-4.7",3],["opus-4.6",3],["opus-4.5",3],["opus-4.1",0],["fable-5.2",0],["fable-5.1",0],["fable-5",0]];const no=t.filter(([,n])=>n===0).map(([m])=>"anthropic/claude-"+m);console.log(t.length-no.length,no.length,no.join(","))'
```

## Depends on

- [ADR 0009](../../adr/0009-ai-through-openrouter.md): points 2 (one pinned model per job, evaluation sets, a pin change is a contract change), 3 (no fallback model), 4 (zero retention), 7 (keys and credit limits), 8 (tests never call a model); the additions of 2026-10-23, 2026-10-30 and 2026-11-18.
- [ADR 0015](../../adr/0015-standards-and-required-controls.md): decision 4 and its addition of 2026-10-29 (the cap, the sum); decision 12 and its addition of 2026-10-29 (millionths, null never 0).
- [ADR 0018](../../adr/0018-image-generation-provider.md): decisions 2 and 3 (image jobs and their prompt frame).
- [ORV-121 spec](../ORV-121/spec.md) v1.3: `spend-cap-1` to `spend-cap-8`.
- ORV-160 spec: `orv160-model-ids`, `orv160-answer-model`, `orv160-recorder-run`.
- [ORV-281 spec](../ORV-281/spec.md) v1.3: the `business-read` job (slice 3).
- Knowledge: K-0091 (0.8), K-0412 (0.75), K-0413 (0.75).
- `.claude/rules/security.md` rules 6 and 12.

## Downstream review if this spec changes

- ADR 0009: a new addition (row 4); its point 2 `instant` exit test and its addition of 2026-10-23 on `see` are not rewritten, the addition supersedes them.
- ORV-160 spec `orv160-model-ids` and `openrouter.test.ts` row 12: the two new ids.
- ORV-121 spec `spend-cap-8`, ADR 0015 decision 4's addition of 2026-10-29 ("The sum"), and security rule 6 ("summed from OpenRouter's reported cost per request"): the counted amount of `byok-cost-1`.
- K-0412: the update of row 9.

## Changelog

- v1 (2026-11-18): first version, from the owner's decision on ORV-284 and a read of ADR 0009, ADR 0015, ADR 0018, K-0091, K-0412, K-0413, `openrouter.ts`, `openrouter.test.ts`, `spend-cap.ts`, ORV-121 and ORV-281. No Jira tool and no shell in this task, so ORV-284 was not read directly and no worked example was run. Downstream to review: the owner's answers (open questions 1 to 8) and confirmation of row 9's run; the research task that updates K-0412 from row 9; the architect's tech notes and ADR 0009 addition; the builder, `security` and reviewer envelopes for the PR; the items under "Downstream review if this spec changes".
