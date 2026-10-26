---
id: K-0072
topic: platform
claim: OpenRouter documents a dedicated Image API at POST https://openrouter.ai/api/v1/images that requires model and prompt and returns created, a data array of b64_json images with an optional media_type, and a usage object with cost, and its response schema has no model field.
source: "https://openrouter.ai/docs/guides/overview/multimodal/image-generation.md; https://openrouter.ai/docs/api/api-reference/images/generate-an-image.md"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-126, ADR-0018, ADR-0009]
license: own-words
---

## Evidence

Both pages are OpenRouter's, so they count as one source (cap 0.8). Read on 2026-10-26 through a fetch tool that returns page text to a reading model, treated as untrusted data; the quotes below are the short excerpts it returned. OpenRouter docs carry no reuse license, so the rest is in our words.

From the guide:

> Send a `POST` request to `/api/v1/images` with the model and prompt

> Upper bound on images to generate (1-10); providers may return fewer, and single-image providers reject `n > 1`

From the API reference (operation `createImages`, server `https://openrouter.ai/api/v1`, bearer key):

> Upper bound on the number of images to generate (1-10).

## What the reference states (fact)

- **Request body `ImageGenerationRequest`.** Required: `model`, `prompt` (`minLength` 1). Optional: `aspect_ratio`, `background` (`auto`, `transparent`, `opaque`), `input_references` (image parts as base64 data URLs or HTTP(S) URLs, at most 16 items), `n` (1 to 10 in the description only; the schema sets no numeric bound), `output_compression` (0 to 100, WebP and JPEG), `output_format` (`png`, `jpeg`, `webp`, `svg`), `provider`, `quality`, `resolution` (`512`, `768`, `1K`, `1.5K`, `2K`, `4K`), `seed` (not guaranteed for all providers), `session_id` (at most 256 characters), `size`, `stream` (SSE partial images, native only for OpenAI), `trace`, `user` (at most 256 characters).
- **Response `ImageGenerationResponse`.** Required: `created` (Unix seconds), `data`. Each `data` item has a required `b64_json` and an optional `media_type`. Optional `usage` (`ImageGenerationUsage`). The sample response has one image and `usage` with `completion_tokens` 4175, `cost` 0.04, `prompt_tokens` 0, `total_tokens` 4175.
- **No `model` in the response.** The schema's properties are `created`, `data` and `usage` only; `model` appears only as a request field. Because the reference lists the whole response schema, the absence is a documented fact, not a gap in our reading.

## What the guide adds or leaves out (fact)

- The guide says `media_type` is present "whenever the format is identifiable" and that `usage` reports tokens and cost "when available". Both are conditional, so a response without them is within the documented shape.
- The guide's parameter table does not list `session_id`, `background`, `quality`, `size`, `stream`, `trace` or `output_compression`; the reference does. The reference is the fuller list.
- The guide says the number of reference images "varies by provider"; the reference's 16 is the API-wide cap. A model's own cap is in its endpoint record (see [[K-0074-gemini-nano-banana-2-1-endpoint-and-price]]).

## Why it matters for ORIVILO

ADR 0018 decision 4 builds its request and its zod answer schema on this shape, and its trace rule (the stored record says the model was pinned by request) rests on the response not naming the model. The exact parameter list also tells the logo image story which fields exist to leave out (`user`, `session_id`, `stream`).
