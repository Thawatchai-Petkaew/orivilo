# ADR 0009: AI calls go through OpenRouter, with pinned Claude models

- Status: accepted
- Date: 2026-10-23
- Decided by: GOLF (owner) confirmed OpenRouter on 2026-10-23 in the project thread and asked for models that fit text and images; the implementer chose the models, story ORV-62
- Supersedes: the "AI" row of ADR 0001 ("Claude API, server-side only")

## Context

ADR 0001 named the Claude API as the AI provider. The owner already uses OpenRouter and wants every AI call in the product to go through it. ADR 0008 put the brief interpreter behind an adapter, so changing the provider changes one adapter, not its callers.

The Studio needs AI for two kinds of input:

- **Text:** a brief, notes and answers to the Studio's questions.
- **Images:** mood boards, logos, screenshots of a current product, photos of brand material.

It may later need to make images, but no story asks for that yet.

The handoff and AGENTS.md set the limits:

- AI runs on the server only.
- Its output is untrusted data, checked by a schema.
- The UI says what came from AI.
- Personal data stays within PDPA.
- Nothing claims AI works without an implementation and a test.

The Claude Max plan the owner uses for development covers the Claude apps and Claude Code. It does not give an API key for a server to call, so the app needs its own key.

## Decision

1. **One provider: OpenRouter.**
   - The server calls the OpenRouter chat completions endpoint with `fetch`. No SDK, by the lean rule.
   - The call lives in one server-only module, added with the first adapter (ORV-62 part 2). No client code and no `NEXT_PUBLIC_*` variable ever carries the key.
2. **Models are pinned by exact id, one per job,** in one map in that module. Prices are OpenRouter's list prices on 2026-10-23 in US dollars per million tokens, input then output.

   | Job                                                                                     | Model                         | Price       | Why                                                                                      |
   | --------------------------------------------------------------------------------------- | ----------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
   | `interpret`: brief and Studio answers to structured facts (ADR 0008 schema)             | `anthropic/claude-sonnet-5.5` | 2 / 10      | Strong Thai reading and reliable JSON; the reading is the product's core                 |
   | `see`: images (mood board, logo, screenshot) to traits, colours and evidence, same call | `anthropic/claude-sonnet-5.5` | 2 / 10      | Takes text, images and files in one request, so a brief and its mood board read together |
   | `light`: short labels, names, rewording one line of copy                                | `anthropic/claude-haiku-5.5`  | 0.10 / 0.50 | Twenty times cheaper; enough for short, checked text                                     |
   - **Opus is not used by default.** `anthropic/claude-opus-5.5` costs 4 / 20. It is used only if a recorded evaluation shows Sonnet failing a job, and that change is an addition to this ADR.
   - **Model ids never come from the client or from a setting a user can change.**
   - **Changing a pinned model is a contract change.** It needs an impact note in the PR. The interpretation records the adapter id, adapter version and model id, so every saved reading can be traced to the model that made it.

3. **No silent fallback to another model.** A different model reads the same brief differently, and a saved direction must say what read it.
   - When the call fails, times out, returns output that fails the schema, or there is no key, the Studio uses the rule-based reading (ADR 0008).
   - The screen labels which method produced what it shows.
4. **Data stays out of training and storage.** Every request sets OpenRouter's provider preferences to zero data retention (`zdr: true`) and denies data collection (`data_collection: "deny"`). The same is turned on in the OpenRouter account settings.
   - A request with no zero-retention endpoint fails and falls back to the rules, as in point 3. It is never retried without the setting.
   - Only what the job needs is sent. No user id, email or workspace name goes into a prompt.
5. **Images are bounded before they leave the server:**
   - at most 5 per request;
   - PNG, JPEG or WebP, checked by magic bytes;
   - at most 4 MB each;
   - downscaled so the long edge is at most 1568 px;
   - EXIF stripped.
   - They are sent as data URLs or as signed URLs from the private Storage bucket that expire within 5 minutes, never as public links.
6. **Keys and spend:**
   - The key is `OPENROUTER_API_KEY`, set in the Vercel environment and in a local `.env.local` that is never committed. It is never pasted in chat.
   - Preview, staging and production each get their own key, so one can be revoked alone.
   - Each key has a credit limit in OpenRouter, starting at 20 US dollars a month for preview and staging.
7. **Tests never call a model.**
   - Unit and contract tests use recorded responses, kept as fixtures and named as recordings.
   - CI has no OpenRouter key.
   - A manual smoke script may call the real API with a developer's key. It is not part of `pnpm test`.
8. **Everything a model sees or returns is untrusted.**
   - Brief text and text inside images can carry instructions. The system prompt says the input is data.
   - The output goes through the ADR 0008 checks: strict schema, adapter identity, and evidence spans equal to the brief's text.
   - Output is never executed and never used as a prompt for a further call without that check.

## Consequences

- **Typical cost:** a brief reading costs about 1.5 US cents (about 2,000 input and 1,000 output tokens on Sonnet). An image adds about 0.5 cents at 1568 px. Development use stays within a 20 dollar limit.
- **Visible AI use:** the Studio can say "read by AI (Claude Sonnet 5.5)" or "read by rules". Both are true, and the trace shows which.
- **One more processor for PDPA:** OpenRouter and the model host process customer text. The privacy notice must name them before real customers use AI features.
- **Price and model changes:** OpenRouter adds a small margin over direct prices, and prices can change. The pinned map and this table are revisited when a model is retired or prices move.

## Not chosen

- **Calling the Anthropic API directly** (ADR 0001's choice). It is cheaper by the margin and has one less processor. The owner prefers one account for every model and the option to try others behind the same call.
- **Automatic fallback across models.** It hides which model read a brief; see point 3.
- **Using the Claude Max plan for the app.** It is a subscription for people using Claude, not an API for a server, and using it that way breaks its terms.
- **Image generation now.** `google/gemini-nano-banana-2.1` can make images on OpenRouter, at 1.5 / 7.5 for text and 30 for image output. No story needs generated images, and generated brand assets raise licensing questions (a lane L risk flag). It gets its own ADR when a story asks for it.
