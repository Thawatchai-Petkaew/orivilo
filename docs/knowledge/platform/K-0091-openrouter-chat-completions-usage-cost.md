---
id: K-0091
topic: platform
claim: OpenRouter's non-streaming chat completions answer reports the call's cost in usage.cost, an optional and nullable number the docs call cost in credits (credits are based in US dollars), sent with no request flag beside native-tokenizer token counts, and GET /api/v1/generation by the answer's id returns total_cost in USD, with no delay stated in OpenRouter's docs.
source: "https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request.md; https://openrouter.ai/docs/api/reference/overview.md; https://openrouter.ai/docs/guides/guides/usage-accounting.md; https://openrouter.ai/docs/api/api-reference/generations/get-generation.md; https://openrouter.ai/docs/faq.md; https://github.com/OpenRouterTeam/skills skills/openrouter-generations/SKILL.md (read at https://raw.githubusercontent.com/OpenRouterTeam/skills/main/skills/openrouter-generations/SKILL.md); https://ocaml.org/p/openrouter_api/0.1.0/openrouter_api/Openrouter_api/Generation/index.html (third party)"
retrieved: 2026-10-29
confidence: 0.8
applies_to: [ORV-121, ADR-0009, ADR-0015, ADR-0018]
license: own-words
---

## Evidence

The first six URLs are OpenRouter's own (docs and its team's skills repo), so they count as one source (cap 0.8). The seventh is a third-party OCaml client and carries none of the entry's confidence. All were read on 2026-10-29 through a fetch tool that returns page text to a reading model, treated as untrusted data; the quotes are the short excerpts it returned. OpenRouter's docs carry no reuse license, so the rest is in our words. This entry answers open question 8 of `docs/specs/ORV-121/spec.md`; [[K-0072-openrouter-image-api-request-and-response]] covers the Image API, not chat.

From the API overview:

> OpenRouter always returns detailed usage information.

> Usage data is always returned for non-streaming.

From the usage accounting guide:

> The `usage: { include: true }` and `stream_options: { include_usage: true }` parameters are deprecated and have no effect.

From the chat completions reference, `stream_options.include_usage`:

> Deprecated: This field has no effect. Full usage details are always included.

## Where the cost is (fact)

- **Endpoint.** `POST https://openrouter.ai/api/v1/chat/completions`; the non-streaming 200 schema is `ChatResult` (chat completions reference).
- **Field.** `usage.cost` on the `ChatUsage` object. Its type is `["number", "null"]`, format `double`, description "Cost of the completion" (chat completions reference). The overview's field list describes it as "Cost in credits (optional)"; the usage accounting guide says "Cost in credits." and "`cost`: The total amount charged to your account".
- **Unit.** The chat pages say credits, not dollars. The FAQ says "OpenRouter uses a credit system where the base currency is US dollars." and "All of the pricing on our site and API is denoted in dollars." No page read states "1 credit = 1 US dollar" in those words; that link is the FAQ's two sentences, not a statement on the chat field. The generation endpoint (below) states USD outright.
- **Sample value.** The `ChatUsage` example in the reference has `cost: 0.0012` and `is_byok: false`.
- **Cost breakdown.** `usage.cost_details` (`CostDetails`, nullable, "Breakdown of upstream inference costs.") requires `upstream_inference_prompt_cost` and `upstream_inference_completions_cost` (numbers) and has optional nullable `upstream_inference_cost` and `server_tool_cost` ("in USD"). The usage accounting guide says `upstream_inference_cost` "is only available for BYOK (Bring Your Own Key) requests" and "For all other requests it will be 0 or null."

## Is a request flag needed (fact)

- No. The overview says usage is always returned for non-streaming, and the usage accounting guide says "No additional parameters are required." The old flags `usage: { include: true }` and `stream_options.include_usage` are documented as deprecated with no effect (quotes above).

## Token counts (fact)

- `ChatUsage` requires `prompt_tokens`, `completion_tokens` and `total_tokens` (integers); `cost`, `cost_details`, `is_byok`, `prompt_tokens_details` (with `cached_tokens`, `cache_write_tokens`, `audio_tokens`, `video_tokens`) and `completion_tokens_details` (with `reasoning_tokens` and others) are optional (chat completions reference).
- The overview says: "Token counts are calculated using the model's native tokenizer." and "Credit usage and model pricing are based on these native token counts."

## When no cost is reported (fact, and what the docs leave open)

- `usage.cost` is not in `ChatUsage`'s required list and its type admits `null`, so both an absent `cost` and `cost: null` are inside the documented schema (chat completions reference).
- `usage` itself is not in `ChatResult`'s required list (`id`, `choices`, `created`, `model`, `object`, `system_fingerprint`), although the overview says usage "is always returned for non-streaming". The schema and the prose differ; the schema allows an answer with no `usage`.
- None of the pages read says when `cost` is null or absent, or whether a reported `0` means a free call. The only "0 or null" sentence is about `upstream_inference_cost` on non-BYOK requests, not about `cost`.

## The generation endpoint as an alternative (fact)

- `GET https://openrouter.ai/api/v1/generation?id=<id>`, summary "Get request & usage metadata for a generation"; `id` is required, at most 128 characters, pattern `^gen-[0-9A-Za-z-]+$` (generation reference).
- The overview says: "You can also use the returned `id` to query for the generation stats ... after the request is complete via the `/api/v1/generation` endpoint." and "This is useful for auditing historical usage or when you need to fetch stats asynchronously." The chat answer's `id` is described as "Unique completion identifier" (chat completions reference).
- Its `data` object requires `total_cost` ("Total cost of the generation in USD", number, not nullable) and `usage` ("Usage amount in USD"), plus `upstream_inference_cost` and `cache_discount` (nullable), `is_byok`, and token fields including `native_tokens_prompt` ("Native prompt tokens as reported by provider") and `native_tokens_completion` (generation reference). The sample has `total_cost` 0.0015 and `usage` 0.0015.
- It documents 200 and 400, 401, 402, 403, 404, 429, 500, 502, 524, 529; 404 reads "Not Found - Resource does not exist." (generation reference). The OpenRouterTeam skill lists 404 as "Generation ID not found" and `total_cost` as "Total cost in USD."
- **Delay.** No OpenRouter page read states a delay before a generation can be fetched; the overview says only "after the request is complete".

### Claims that did not re-check

- A delay of a few seconds before `/api/v1/generation` answers. Only the third-party OCaml client page states it ("stats become queryable a few seconds after the request finishes." and "the endpoint typically takes a couple of seconds after the completion to materialize."). Searched for it on the chat completions reference, the overview, the usage accounting guide, the generation reference, the FAQ and the OpenRouterTeam skill; none states a delay or a time. It carries no confidence and is not grounds for a decision.

## Why it matters for ORIVILO

ORV-121's `spend-cap-8` counts the cost OpenRouter reports; this entry names the field (`usage.cost`), says no flag is needed, and records that the schema allows the cost to be absent or null with no documented meaning, which bears on `spend-cap-6` (cost not reported). Whether to read `usage.cost`, look the cost up later through the generation endpoint, or both, is the architect's call in the tech notes.
