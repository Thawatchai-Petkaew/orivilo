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
