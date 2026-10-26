---
id: K-0073
topic: platform
claim: The OpenRouter Image API reference lists the provider preferences as allow_fallbacks, ignore, only, options, order and sort, with no zdr and no data_collection field, while the provider routing guide documents zdr and data_collection for chat completions and an account-wide data_collection setting without saying whether either applies to image requests.
source: "https://openrouter.ai/docs/api/api-reference/images/generate-an-image.md; https://openrouter.ai/docs/guides/routing/provider-selection.md"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-126, ADR-0018, ADR-0009]
license: own-words
---

## Evidence

One publisher, two pages, so one source (cap 0.8). Read on 2026-10-26 through a fetch tool that returns page text to a reading model, treated as untrusted data. OpenRouter docs carry no reuse license; the rest is in our words.

From the provider routing guide:

> the request will only be routed to endpoints that have a Zero Data Retention policy

> also available as an account-wide setting in your privacy settings

(the first under `zdr`, the second under `data_collection`)

## What the pages state (fact)

- **Image API.** The schema `ImageGenerationProviderPreferences` has six properties: `allow_fallbacks`, `ignore`, `only`, `options`, `order`, `sort`. Neither `zdr` nor `data_collection` appears in it, nor anywhere else in the request or response schema. The reference lists the schema's properties in full, so the absence is documented.
- **Provider routing guide.** `zdr` is a per-request field that, when true, routes only to endpoints with a zero data retention policy; it works as an OR with the account-wide and guardrail ZDR settings, so a request can add enforcement but cannot turn off an account-level one. `data_collection` takes `allow` (default) or `deny` per request and is also an account-wide privacy setting. The guide scopes the `provider` object to chat completions and says `zdr` filters "model inference endpoints".
- **The image model's own records.** Neither the model page `https://openrouter.ai/google/gemini-nano-banana-2.1` nor its endpoint record shows a training, retention or ZDR field for the Google AI Studio endpoint (read the same day).

## What the pages do not state

- **Whether the account-wide privacy settings (training off, ZDR, provider data policy) are applied to `POST /api/v1/images`.** Neither page names the Image API in its data policy text. An inference that they apply, because the account settings are described as account-wide, is plausible but unconfirmed, and stays below 0.7 until a live call with a developer key shows it (ADR 0018 decision 4 already plans that check).
- **What happens if a request sends `zdr` or `data_collection` to the Image API anyway** (ignored, rejected, or honoured). Not documented; not tested.

## Why it matters for ORIVILO

ADR 0009 point 4 sends `zdr: true` and `data_collection: "deny"` on every request; this entry shows the Image API has no documented place for them, which is why ADR 0018 moves the data policy to the account settings. Whether that move actually covers image calls is still open.
