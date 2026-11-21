# ADR 0009: AI calls go through OpenRouter, with one pinned model per job

- Status: accepted
- Date: 2026-10-23
- Decided by: GOLF (owner) confirmed OpenRouter on 2026-10-23 in the project thread, asked that models not be locked to one vendor, and named the jobs (chat, instant elements, images, logo generation); the implementer chose the models, story ORV-62
- Supersedes: the "AI" row of ADR 0001 ("Claude API, server-side only")

## Context

ADR 0001 named the Claude API as the AI provider. The owner already uses OpenRouter, wants every AI call in the product to go through it, and wants each job to use the model that suits it best, from any vendor. ADR 0008 put the brief interpreter behind an adapter, so changing the provider or the model changes one adapter, not its callers.

The end product works in two modes at once:

- **A conversation.** The person talks to the Studio, and it answers and asks back, streamed as it writes.
- **Elements that respond at once.** Suggestion chips, a rewritten line of copy, a label for a swatch, a hint while typing. These must feel instant, so the model's speed matters more than its depth.

Around them, the Studio needs AI to:

- read a brief and the Studio's answers into structured facts (ADR 0008);
- read images: mood boards, current logos, screenshots, photos of brand material;
- make logos: a mark and a wordmark the brand can own and use everywhere.

The handoff and AGENTS.md set the limits:

- AI runs on the server only.
- Its output is untrusted data, checked by a schema.
- The UI says what came from AI.
- Personal data stays within PDPA.
- Nothing claims AI works without an implementation and a test.

The Claude Max plan the owner uses for development covers the Claude apps and Claude Code. It does not give an API key for a server to call, so the app needs its own key.

## Decision

1. **One provider: OpenRouter.**
   - The server calls OpenRouter's chat completions endpoint with `fetch`. No SDK, by the lean rule. Chat and instant elements use its streaming mode.
   - The call lives in one server-only module, added with the first adapter (ORV-62 part 2). No client code and no `NEXT_PUBLIC_*` variable ever carries the key.
2. **One model per job, from any vendor, pinned by exact id** in one map in that module. The choice was made from OpenRouter's full model list on 2026-10-23. Prices are its list prices that day, in US dollars per million tokens, input then output.

   | Job                                                                            | Model                           | Price                | Why                                                                                                                                         |
   | ------------------------------------------------------------------------------ | ------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
   | `chat`: the Studio conversation, streamed                                      | `anthropic/claude-sonnet-5.5`   | 2 / 10               | Strong Thai, follows a long conversation and tool calls well; the conversation is the product's face                                        |
   | `instant`: chips, one-line rewrites, labels, hints while typing                | `inception/mercury-3`           | 0.10 / 0.35          | A diffusion model that writes a whole short answer at once, so it is the fastest on the list; cheap enough to call on every pause in typing |
   | `interpret`: brief and Studio answers to structured facts (ADR 0008 schema)    | `anthropic/claude-sonnet-5.5`   | 2 / 10               | Reliable strict JSON and close Thai reading; the reading is the product's core                                                              |
   | `see`: images to traits, colours and evidence, with the brief in the same call | `google/gemini-4-argon`         | 2 / 10               | Built for mixed input (text, images, files, video), strong at reading colour, layout and text in images                                     |
   | `logo-vector`: a mark and a wordmark as SVG the person can edit                | `anthropic/claude-opus-5.5`     | 4 / 20               | Logos are few and high value, so the strongest reasoning model is worth it for clean, geometric SVG                                         |
   | `logo-image`: concept and mood images for a logo direction                     | `google/gemini-nano-banana-2.1` | 1.5 / 7.5, images 30 | The only model on OpenRouter that returns images; good at following a style and keeping text legible                                        |
   - **The `instant` pick has an exit test.** Mercury's Thai is not proven. Part 2 records a Thai set of instant prompts; if Mercury fails it, `instant` moves to `openai/gpt-6-luna` (0.10 / 0.50), recorded as an addition to this ADR. The test, not a guess, decides.
   - **Each job is measured before it ships.** The story that adds a job records an evaluation set (Thai and English) and keeps it as fixtures; changing that job's model means running the set again.
   - **Model ids never come from the client or from a setting a user can change.**
   - **Changing a pinned model is a contract change.** It needs an impact note in the PR. Every saved result records the adapter id, adapter version and model id, so it can be traced to the model that made it.

3. **No silent fallback to another model.** A different model answers the same input differently, and a saved result must say what made it.
   - When a call fails, times out, returns output that fails its schema, or there is no key: `interpret` and `see` use the rule-based reading (ADR 0008); `chat` says it cannot answer now; `instant` shows nothing; `logo-*` says generation failed.
   - The screen labels which method produced what it shows.
4. **Data stays out of training and storage.** Every request sets OpenRouter's provider preferences to zero data retention (`zdr: true`) and denies data collection (`data_collection: "deny"`). The same is turned on in the OpenRouter account settings.
   - A request with no zero-retention endpoint fails as in point 3. It is never retried without the setting.
   - Only what the job needs is sent. No user id, email or workspace name goes into a prompt.
5. **Images are bounded before they leave the server:**
   - at most 5 per request;
   - PNG, JPEG or WebP, checked by magic bytes;
   - at most 4 MB each;
   - downscaled so the long edge is at most 1568 px;
   - EXIF stripped.
   - They are sent as data URLs or as signed URLs from the private Storage bucket that expire within 5 minutes, never as public links.
6. **Generated logos are drafts the person owns the decision on.** Asset licensing is a lane L risk flag, so the logo story runs in lane L.
   - **Vector first.** The deliverable logo is SVG from `logo-vector`: it scales, stays editable and can be checked. Raster images from `logo-image` are concepts and mood only, never the delivered logo file.
   - **SVG is untrusted code.** It is parsed and rebuilt from an allow-list of shapes and attributes: no script, no event handlers, no external links or fonts, no embedded images. Text is outlined to paths, so the logo does not depend on a font licence.
   - **Every generated logo is labelled as AI-made** in the Studio and in the export, with the model ids that made it.
   - **The person is told the limits before using a logo:** AI-made images may not be protected by copyright in every country, and a logo can resemble an existing mark. The Studio does not claim a logo is original, registrable or cleared. A trademark search is the person's step before registering it.
   - **No prompt asks for a living artist's style or another brand's mark.** The prompt builder refuses brand names and artist names typed into a logo request.
   - Generated files are stored in the workspace's private bucket and belong to the workspace, as far as the model terms allow; the terms of each logo model are checked and linked in the logo story's spec.
7. **Keys and spend:**
   - The key is `OPENROUTER_API_KEY`, set in the Vercel environment and in a local `.env.local` that is never committed. It is never pasted in chat.
   - Preview, staging and production each get their own key, so one can be revoked alone.
   - Each key has a credit limit in OpenRouter, starting at 20 US dollars a month for preview and staging.
   - `instant` calls are debounced on the server side of each session (at most one call per 400 ms per person) and capped per person per day, so a stuck client cannot burn the limit.
8. **Tests never call a model.**
   - Unit and contract tests use recorded responses, kept as fixtures and named as recordings.
   - CI has no OpenRouter key.
   - A manual smoke script may call the real API with a developer's key. It is not part of `pnpm test`.
9. **Everything a model sees or returns is untrusted.**
   - Brief text, chat messages and text inside images can carry instructions. The system prompt says the input is data.
   - Structured output goes through the ADR 0008 checks: strict schema, adapter identity, and evidence spans equal to the brief's text.
   - Chat text is shown as text, never as HTML. A tool call a chat model asks for is checked against the tool's schema and the person's role before it runs.
   - Output is never executed and never used as a prompt for a further call without that check.

## Consequences

- **Typical cost:**
  - a brief reading, about 1.5 US cents (2,000 input and 1,000 output tokens on Sonnet);
  - an image read with it, about 0.5 cents more;
  - a chat turn, about 1 cent;
  - an instant element, about 0.005 cents, so a thousand of them cost about 5 cents;
  - a logo round (four SVG drafts on Opus and four concept images), about 20 cents.
    Development use stays within a 20 dollar limit.
- **Visible AI use:** the Studio can say "read by AI (Claude Sonnet 5.5)", "image read by AI (Gemini 4 Argon)", "made by AI" or "read by rules". Each is true, and the trace shows which.
- **More processors for PDPA:** OpenRouter and each model host (Anthropic, Google, Inception) process customer content. The privacy notice must name them before real customers use AI features.
- **Mixed vendors:** each job's answers differ in style. Prompts and evaluation sets are kept per job, not shared.
- **Price and model changes:** OpenRouter adds a small margin over direct prices, and prices and models change. The pinned map and this table are revisited when a model is retired, a clearly better one appears, or prices move.

## Not chosen

- **One vendor for every job** (the first version of this ADR pinned only Claude models). The owner asked for the best model per job; speed and image output are better served elsewhere.
- **Calling a vendor API directly** (ADR 0001's choice). It is cheaper by the margin and has one less processor. The owner prefers one account for every model and the option to switch behind the same call.
- **OpenRouter's automatic routers** (`openrouter/auto` and similar). They pick the model per request, which hides what made a result; see point 3.
- **Automatic fallback across models.** Same reason.
- **Using the Claude Max plan for the app.** It is a subscription for people using Claude, not an API for a server, and using it that way breaks its terms.
- **A raster image as the delivered logo.** It does not scale, cannot be edited as shapes and is harder to check; raster stays for concepts.

## Addition, 2026-10-23: safety retention for Google models

OpenRouter's privacy settings show that from 2026-10-18 Google models are served only by endpoints that keep prompts for a short time for abuse monitoring ("safety retention"). With zero retention only, `see` and `logo-image` could not run at all. The owner set the account to allow safety retention for Google and for other models, and kept training off everywhere.

- **`interpret` and `chat` stay zero retention.** Their requests keep `zdr: true`, and they are where customer text is longest.
- **`see` and `logo-image` (Google) allow safety retention only.** Their requests deny data collection, so no training, but do not require zero retention. The story that adds each job sets this in its request and tests it.
- **The privacy notice says so:** images and logo prompts may be kept by Google for a short time for safety monitoring and are never used for training.
- `instant` and `logo-vector` keep zero retention unless their exit tests show no zero-retention endpoint, which is then recorded here.

## Addition, 2026-10-30 (ORV-160): where the `interpret` recordings and the recorder live

Points 2 and 8 stay as written, lines 49 and 81 included. ORV-160, the guardrail test set of ORV-113 item 7, records where those lines stand for `interpret` on `develop` at `b7e9d0d`, by the slice that landed each part.

- **"The story that adds a job records an evaluation set (Thai and English) and keeps it as fixtures" (point 2).** For `interpret`, what is kept now is a guardrail set, not a measure of how well the model reads an ordinary brief. `packages/intent-engine/src/llm-guardrails.test.ts` holds hand-written answers to briefs written to attack the path (ORV-172, `eb661ed`, and ORV-174, `47d52b5`). `packages/intent-engine/src/llm-recorded.json` holds 9 cases recorded from `anthropic/claude-sonnet-5.5` on 2026-10-30, one per brief for 9 of those briefs, one of them in Thai: 8 with an answer and `row-5` with none (its adapter threw, so no answer text reached the interpreter, `raw` null; the record keeps no reason); and `packages/intent-engine/src/llm-recorded.test.ts` replays them (ORV-178, `b7e9d0d`). Changing the `interpret` model means running the recorder again. A Thai and English set that measures reading quality for `interpret` is not recorded yet.
- **"Unit and contract tests use recorded responses, kept as fixtures and named as recordings" (point 8).** The recordings are `llm-recorded.json`, written only by the recorder with `JSON.stringify`; nobody types or pastes one into source. They are model output, so untrusted (point 9): replayed, never followed or run (ORV-160 `orv160-recorder-output`).
- **"Tests never call a model" (point 8).** Now held by the test setups: `packages/intent-engine/vitest.setup.ts` and `apps/web/vitest.setup.ts` replace `globalThis.fetch` with one that rejects with "Network is blocked in tests (ADR 0009 point 8)." (ORV-177, `c068371`, ORV-160 row 34). A test that needs `fetch` stubs one.
- **"A manual smoke script may call the real API with a developer's key. It is not part of `pnpm test`" (point 8).** For `interpret` that script is `scripts/probe/openrouter-interpret-record.mjs` (ORV-177, `c068371`), run by hand outside turbo. The key reaches it only through `node --env-file=.env.recorder`, a file never committed, and never appears in a command, a chat or a fixture (ORV-160 `orv160-recorder-key`). Each run waits for the owner to confirm its bound (9 calls, no retry, a 20 s abort per call) and its cost (`orv160-recorder-run`, decided by the owner in ORV-160 comment 10293). Its test, `scripts/openrouter-interpret-record.test.mjs` (ORV-160 rows 36 and 37), uses a fake `fetch` and a stand-in key and runs under `pnpm test:scripts`, which CI runs; the script is not part of `pnpm test`.

## Addition, 2026-11-18 (ORV-281): the `business-read` job

- Decided by: the architect, on the default of open question 2 of `docs/specs/ORV-281/spec.md` (option (a), a new pinned job with its own evaluation set), with G1 passed under the owner's POC delegation (ORV-281 comment 10669). Open for the owner at G2.
- Design: `docs/specs/ORV-281/tech.md`, section 8.

Points 1 to 9 and the additions above stay as written. The decided table of point 2 is not rewritten; the new job's row is this one:

| Job                                                                                                                 | Model                         | Price  | Why                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `business-read`: the six business answers of the ORV-281 intake to readings with exact quotes, on seven node fields | `anthropic/claude-sonnet-5.5` | 2 / 10 | The same reading skill as `interpret`: strict JSON and exact Thai quotes, which its recordings of 2026-10-30 show it gives. A job of its own, because prompts and evaluation sets are kept per job (Consequences, "Mixed vendors") and this one changes at its own rate |

- **The price** is the table's of 2026-10-23, not read again for this addition. A reading is about 1.1 US cents for a typical intake and under 5 cents at the worst case (six answers of 2,000 Thai characters, 3,000 output tokens), inferred from that price, not measured.
- **Retention.** As `interpret`: every request sets zero data retention and denies data collection, with no fallback (point 4, and the addition of 2026-10-23, whose rule that `interpret` stays zero retention this job follows). Only the given answers among the six are sent, in the user message. The project name, the website, the person's id and email and the workspace are never sent.
- **No fallback** (point 3). When the call fails, times out, has no key, returns an answer that fails its checks, or is stopped by the `ai-read` limit or the spend cap, no other model is tried. The person's answers, placed on their nodes by fixed rules, stand alone, and the board says why AI did not read.
- **Recorded result.** Each saved reading records the job, the model id, the adapter id and version and the prompt version (point 2, last bullet).
- **Limits.** The `ai-read` limit and the one spend cap per workspace (ADR 0015 decision 4) apply as they stand. No new number.
- **The evaluation set** (point 2). 16 ordinary cases (8 Thai, 8 English), each of the seven read fields covered by at least 3 cases per language, and 6 injection cases (3 per language), kept as fixtures with one recording per case from the pinned model. The recorder follows the `interpret` recorder of the addition of 2026-10-30: run by hand, the key only from an env file never committed, 22 calls, no retry, a 20 s abort per call, and the owner confirms the bound and the cost before each run.
- **The exit test.** The job ships when its replay test passes: every recording replays to a reading or to a refused answer; no injection case gives an accepted reading that follows its instruction; and the G3 packet of the story reports, per field and language, how many readings a person marked right, wrong or unclear, with no pass claim. A threshold, if the owner sets one, is recorded here as a further addition. Changing this job's model means recording the set again.
- **A later job** that drafts ORIVILO's own analysis from the same answers is a separate job with its own addition and its own evaluation set.

Confirmation: not confirmed yet; follow-up: PR C of ORV-281 (the slice that reads the business), where `openrouter.test.ts` pins `AI_MODELS["business-read"]` to `anthropic/claude-sonnet-5.5`, `business-read.test.ts` › "untrusted input" asserts zero retention, denied data collection and the absence of the project name, website, ids and workspace in the request, and `business-read-eval.test.ts` replays the recorded set; the G3 packet of that PR reports the marks.

## Addition, 2026-11-18 (ORV-283): who marked the `business-read` evaluation set

Every line above stays as written, the addition of 2026-11-18 (ORV-281) and its Confirmation line included. Its exit test reads, from here on, as row 34 of `docs/specs/ORV-283/spec.md` has it. Design: `docs/specs/ORV-281/tech.md`, section 8.5.

- **Who marked.** Each mark of the evaluation set records who made it, `person` or `ai-agent`. `business-read-eval.test.ts` refuses a mark with no value or another value.
- **What the G3 packet reports.** Per field and language, the right, wrong and unclear marks as two separate counts, by a person and by an AI agent, never added together. Marks by an AI agent are labelled "Marked by an AI agent, not a person." and never reported as a person's. No pass claim.
- **When it counts as confirmed.** Only when every accepted reading has a mark by a person and the replay test passes on those marks. Until then the exit test is not confirmed. The marks now in the set are by an AI agent (finding F-1 of review ORV-283-review-1); who marks is open question 11 of the spec, asked in ORV-283 comment 10708.

Confirmation: not confirmed yet; follow-up: the ORV-283 builder fix adds the who-marked key to the mark schema and to `marks.json`, and the G3 packet of the ORV-283 PR prints the split; confirmed by a further dated addition once a person has marked every accepted reading and `business-read-eval.test.ts` passes.

## Addition, 2026-11-18 (ORV-284): analysis jobs on Anthropic models, image jobs on an image model, and what the cap counts under the owner's key

- Status: decided by the architect on the defaults of open questions 1 to 8 of `docs/specs/ORV-284/spec.md` v1, with G1 passed under the owner's POC delegation as lane L (ORV-284 comment 10712). Open for the owner at G2. The one real call of the spec's row 9 waits for the owner's confirmation.
- Design: `docs/specs/ORV-284/tech.md`.

Points 1 to 9 and the additions above stay as written. The decided table of point 2 is not rewritten; the rows below replace two of its pins from this date.

**The owner's decision, 2026-11-18 (ORV-284), as the spec records it in "Why".** Work that analyses, or writes prompts to direct other work, uses Anthropic's models, each chosen by what the job needs and fitting for the MVP and POC, to be changed later; work that generates images keeps a model that can make images. The owner added an Anthropic key to OpenRouter as their own provider key ("BYOK"). The Jira text was not read in this task; the spec is the record cited.

**Two classes.** Every job falls in one:

- **Analysis or prompt writing, on an Anthropic model:** `chat`, `instant`, `interpret`, `business-read`, `see`, `logo-vector` (the spec's `anthropic-jobs-1`). `logo-vector` writes SVG as text and stays on `anthropic/claude-opus-5.5`. No job writes a prompt for another job today; ADR 0018 decision 3 (only deterministic code writes an image prompt) stands, and a story that adds such a job amends it.
- **Image generation, on an image model:** `logo-image` stays on `google/gemini-nano-banana-2.1`; `mockup-image` takes its ADR 0018 model when its story adds it. Neither uses the owner's key, which is an Anthropic key.

**Two moves.** Prices are company-reported by OpenRouter on 2026-11-18 (K-0413, confidence 0.75), US dollars per million input / output tokens, base endpoints then regional endpoints. They are not measured by us.

| Job       | Was (2026-10-23)                   | Now                           | Price on 2026-11-18      | Why                                                                                                                                                        |
| --------- | ---------------------------------- | ----------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instant` | `inception/mercury-3`, 0.10 / 0.35 | `anthropic/claude-haiku-5.5`  | 0.10 / 0.50; 0.11 / 0.55 | Short, cheap and frequent: the cheapest live Anthropic tier. K-0413 states no speed figure, so the speed point 2 gave for Mercury is not claimed for Haiku |
| `see`     | `google/gemini-4-argon`, 2 / 10    | `anthropic/claude-sonnet-5.5` | 2 / 10; 2.20 / 11        | Image input is listed on every live Anthropic model (K-0413); the same tier as `interpret`, whose reading it feeds, at the price Argon had on 2026-10-23   |

- **`instant`'s exit test ends.** Point 2's test (Mercury's Thai against `openai/gpt-6-luna`) never ran, because `instant` has no call path; it ends with the move. `openai/gpt-6-luna` is no longer the named way out.
- **`see` moves to zero retention.** The addition of 2026-10-23 let `see` allow safety retention because only Google served it. On an Anthropic model `see` sends what `interpret` sends: `zdr: true`, `data_collection: "deny"`, `require_parameters: true`, `allow_fallbacks: false` (point 4). That addition's safety retention now covers `logo-image` only.
- **First sets on the new models.** Neither moved job has a call path or an evaluation set. The story that adds the call path of `instant` or `see` records that job's first set (point 2) on the model pinned here. A set that fails moves the pin through a further addition, as point 2 asks.
- **The jobs that stay** keep their pins, so no set is recorded again: `interpret`'s 9 recordings (addition of 2026-10-30) and `business-read`'s set (addition of 2026-11-18, ORV-281) stay valid.
- **Earlier text this replaces, not rewritten:** in Consequences, "Visible AI use" will read "image read by AI (Claude Sonnet 5.5)" once `see` has a call path; "More processors for PDPA" loses Inception, and under zero retention K-0413 lists only Amazon Bedrock and Google endpoints for the three Anthropic tiers, so those are the hosts that may serve the analysis jobs.

**Zero retention against the owner's key (open point, K-0413).** The zero-retention list K-0413 read holds the Anthropic models' Amazon Bedrock and Google endpoints and no first-party Anthropic endpoint, and OpenRouter's ZDR guide says enforcement "Removes first-party Anthropic endpoints (Bedrock and Vertex remain available)" (company-reported). That a request with zero retention therefore never reaches the endpoint where the owner's Anthropic key applies is our reading; no page states it. This addition keeps zero retention on every request anyway (point 4; spec open question 4, default (a)): no request drops it to reach the owner's key. The spec's row 9 reads from one real answer whether the owner's key was used.

**When the owner's key fails.** What OpenRouter does next is the per-key setting in the owner's account, by default "Use shared capacity" (K-0412; spec open question 5, default (a)). Our code adds nothing: an answer from shared capacity is the same pinned model and is checked and counted like any answer; an error status ends the call with no retry and no other model (point 3) and records no reported cost.

**What the spend cap counts (the spec's `byok-cost-1`).** One request counts what it cost in total, whichever account paid. From the fields K-0412 documents (company-reported, confidence 0.75):

- an answer whose `usage.is_byok` is `false` counts `usage.cost`, as ORV-121 counts today; the `cost_details` parts are not added, since they are the parts of that cost;
- an answer whose `usage.is_byok` is `true` counts `usage.cost` (OpenRouter's fee, or 0 inside the plan's allowance) plus `usage.cost_details.upstream_inference_cost` (the provider's charge to the owner's account), summed exactly and rounded once, half to even, at the millionth (ADR 0015 decision 12, addition of 2026-10-29), and only when the fee is below the provider's charge, as K-0412's reading has it;
- any other answer (no boolean `is_byok`, a part missing, null or not a number, a provider charge of 0, or a fee not below the provider's charge) records no amount: null, never 0, adding nothing to the sum.

The design and the exact field each check reads are in the tech notes, section 4. ADR 0015 decision 4's "The sum" names `usage.cost` alone; the tech notes give the text of a further addition there, which waits for the owner, as does the wording of security rule 6.

**Exit test of this addition.** (1) The spec's row 9: one real call on the `interpret` model, after the owner confirms its bound and cost, shows `usage.is_byok` as a boolean and the cost fields the counting reads, recorded in K-0412. If it shows other fields, the tech notes are revised before the counting ships. If it shows `is_byok` false, the reading above on zero retention holds, and the `is_byok` true branch stays unconfirmed by a real answer until one is seen. (2) The first evaluation set of `instant` and of `see` on the model pinned here, in the story that wires each.

Confirmation: not confirmed yet; follow-up: PR 1 of ORV-284, where `openrouter.test.ts` row 12 (`orv160-model-ids`) pins the two new ids, "analysis jobs on Anthropic models" fails on any analysis job off the three Anthropic tiers, and "moved jobs keep the provider settings" fails when `see` or `instant` drops zero retention; then PR 2 of ORV-284, where the counting tests of rows 5 to 8 fail on a cap that counts `usage.cost` alone or counts a charge twice, and K-0412 records the answer of row 9.

## Addition, 2026-11-19 (ORV-292, PR 2 of ORV-285): the `positioning-draft` job

- Status: decided by the architect on the default of open question 6 of `docs/specs/ORV-285/spec.md` v1.2 (option (a)), under the owner's policy of 2026-11-18 for jobs that analyse or write (the addition of 2026-11-18, ORV-284), with G1 and G2 passed under the owner's POC delegation (ORV-285 comment 10717). ORV-292 is the slice card that delivers PR 2 of ORV-285. The recorder run of the evaluation set waits for the owner's confirmation.
- Design: `docs/specs/ORV-285/tech.md`, section 8; the slice: `docs/specs/ORV-292/spec.md`.

Points 1 to 9 and the additions above stay as written. The text below is the one section 9 of those tech notes drafted, except that the price line and the retention line, which also takes in the owner's key and what the spend cap counts, follow the ORV-284 addition of 2026-11-18. The decided table of point 2 is not rewritten; the new job's row is this one:

| Job                                                                                                                                                 | Model                         | Price             | Why                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `positioning-draft`: two or three positioning statements from the six business answers of the ORV-281 intake, each with the exact words it rests on | `anthropic/claude-sonnet-5.5` | 2 / 10; 2.20 / 11 | The job writes short Thai and English sentences under a strict schema with exact quotes, the skill `interpret` and `business-read` already show on this model. A job of its own, because its prompt and evaluation set change at their own rate (Consequences, "Mixed vendors") |

- **The price** is the one the ORV-284 addition records for this model on 2026-11-18 (K-0413, company-reported), base endpoints then regional endpoints, not read again. A draft is about 1 US cent for a typical intake and under 5 cents at the worst case, both inferred at the base price, not measured; a regional endpoint costs a tenth more.
- **Retention, the owner's key and the cap.** As `business-read` and `interpret`, and as the ORV-284 addition keeps it for every analysis job: every request sends `zdr: true`, `data_collection: "deny"`, `require_parameters: true` and `allow_fallbacks: false` (point 4), and no request drops zero retention to reach the owner's Anthropic key, so whether that key serves a draft is read from the answer, not chosen by our code. When the owner's key fails, the per-key setting in the owner's account decides what OpenRouter does next; our code adds no retry and no other model. A draft counts toward the one spend cap by the rule the ORV-284 addition records ("What the spend cap counts"), once the counting of PR 2 of ORV-284 is built; until then by `usage.cost`, as ORV-121 counts every job. Only the given answers among the six are sent, in the user message; no project name, website, person's id or email, workspace, reading, earlier draft or choice.
- **No fallback** (point 3). When the call fails, times out, has no key, returns an answer that fails its checks, or is stopped by the `ai-read` limit or the spend cap, no other model is tried and no draft is stored; the person writes their own or skips, and the screen says why no options were drafted.
- **A draft is never a value.** The options are stored as proposals labelled as drafted by AI with the model id; only the person's pick or edit makes a statement, copied on the server from the stored draft. A draft feeds no other prompt.
- **Recorded result.** Each stored draft records the job, the model id, the adapter id and version and the prompt version (point 2, last bullet).
- **Limits.** The `ai-read` limit and the one spend cap per workspace apply as they stand; one draft per intake, no retry, 3,000 output tokens.
- **The evaluation set** (point 2). 12 ordinary cases (6 Thai, 6 English: short answers, no competitors answer, mixed Thai and English among them) and 6 injection cases (3 per language), with one recording per case from the pinned model. The recorder runs by hand, the key only from an env file never committed, 18 calls, no retry, a 20 s abort per call, after the owner confirms the bound and the cost. That run has not been made and waits for the owner's confirmation.
- **The exit test.** The job ships when `positioning-draft-eval.test.ts` passes: every recording replays to a draft or a refused answer; no injection case gives an accepted statement holding its marker; every accepted option has one person's mark. The G3 packet reports per language the faithful, adds-a-claim and unclear marks and the refused count, with no pass claim. Changing this job's model means recording the set again.
- **Not decided yet.** Who marks the options faithful, adds a claim or unclear is an open owner answer (`docs/specs/ORV-292/spec.md`, "What is real, and what waits for the owner"); until it is given and the marks exist, the exit test is not met.

Confirmation: not confirmed yet; follow-up: ORV-292 builds the job, where `openrouter.test.ts` pins `AI_MODELS["positioning-draft"]` to `anthropic/claude-sonnet-5.5`, `positioning-draft.test.ts` › "untrusted input" asserts the request's contents, retention and single call, and `positioning-draft-eval.test.ts` replays the recorded set; none of these assertions exists yet. Its G3 packet reports the marks, and a further dated addition confirms this one once the owner-confirmed recording and the marks exist and the replay test passes.

## Addition, 2026-11-21 (ORV-292): the `positioning-draft` evaluation set, recorded and marked

Every line above stays as written, the addition of 2026-11-19 (ORV-292, PR 2 of ORV-285) and its Confirmation line included. Three of that addition's lines read differently from here on: the recorder run that its Status line and its "The evaluation set" bullet say waits for the owner's confirmation was confirmed and made; "every accepted option has one person's mark" in its "The exit test" bullet reads as "The exit test, from here on" below; and "Not decided yet" on who marks is decided by the rule `positioning-draft-marks-1` of `docs/specs/ORV-292/spec.md` v1.5. Design: `docs/specs/ORV-285/tech.md`, section 8.4.

- **The recording.** The owner confirmed the recorder run on 2026-11-21 (ORV-292 comment 10817). It was made once, on head 8e22340: 18 calls, no retry, one recording per case, each from the pinned model `anthropic/claude-sonnet-5.5`. `positioning-eval/recorded.json` holds the 18 recordings as the recorder wrote them, committed in a5a5a98. A second run, or a run after a change of this job's prompt or model, needs the owner's confirmation of its bound and its cost again.
- **Who marked.** A team of three AI reviewers, each working alone on the replayed options and the answers of a case. The mark of an option is the mark at least two of them give, and `unclear` when no two agree (`positioning-draft-marks-1`). Each mark in `positioning-eval/marks.json` records who made it under `markedBy`, `person` or `ai-agent`, as the `business-read` set does (addition of 2026-11-18, ORV-283), and `positioning-draft-eval.test.ts` refuses a mark with no value or another value. All 54 marks in the set are `ai-agent`; none is a person's. The owner chose this in ORV-292 comment 10817, which holds the owner's words and the main session's reading of them; if the owner meant a person, the marks are redone and `recorded.json` stays.
- **The exit test, from here on.** The job ships when `positioning-draft-eval.test.ts` passes: every recording replays to a draft or a refused answer; no injection case gives an accepted statement holding its marker; every accepted option has exactly one mark, and each mark carries `markedBy`. The G3 packet reports per language the faithful, adds-a-claim and unclear counts by who made the mark, never added together, and the refused count. Marks by an AI agent are labelled "Marked by an AI agent, not a person." and never reported as a person's. No pass claim and no threshold; a threshold, if the owner sets one, is recorded as a further addition. Changing this job's model still means recording the set again.
- **The result, as the test pins it at a5a5a98.** All 18 recordings replay to an accepted draft of three options; none is refused, and no injection case has its marker in an accepted statement. Thai: faithful 23, adds-a-claim 3, unclear 1. English: faithful 24, adds-a-claim 3, unclear 0. Marks by a person: 0 in every count. Refused: 0 in both languages. These are counts of marks made by AI reviewers, not a measure of the drafts' quality.
- **What this does not show.** No person has marked the set. Each mark is a judgement by AI reviewers of whether a statement says only what the answers say; the quote check proves only that each quote is in the answers. The owner chose AI marks for the POC and may ask for a person's marks; those come in their own task, as their own count, and the exit test then asks for one mark per accepted option for each `markedBy` value (`positioning-draft-marks-1`, "Building the evaluation test").

Confirmation: confirmed for the evaluation set only, by these checks: the owner-confirmed recording exists (`recorded.json`, 18 recordings, each naming `anthropic/claude-sonnet-5.5`, committed in a5a5a98); the marks exist, made by the markers the owner chose (`marks.json`, 54 marks, each `markedBy` `ai-agent`); and `positioning-draft-eval.test.ts` exists at a5a5a98 and passed in the main session's run of the `packages/intent-engine` suite on that head. The G3 packet of ORV-292 reports the marks as above. Not confirmed here: the quality of the drafts, any mark by a person, a CI run of the test, and the other assertions named in the Confirmation line of the addition of 2026-11-19 (`openrouter.test.ts` and `positioning-draft.test.ts`), which this addition does not check.
