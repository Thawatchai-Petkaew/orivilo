---
id: K-0074
topic: platform
claim: On 2026-10-26 OpenRouter's image model list had 61 models including google/gemini-nano-banana-2.1, whose single endpoint google-ai-studio bills 0.00003 US dollars per output image token, accepts n from 1 to 1 only, 0 to 14 input references and resolution 1K, 2K or 4K, and lists no seed and no output_format, while Google prices the same model at 30 US dollars per million image output tokens, about 0.0336 per 1K image.
source: "https://openrouter.ai/api/v1/images/models; https://openrouter.ai/api/v1/images/models/google/gemini-nano-banana-2.1/endpoints; https://ai.google.dev/gemini-api/docs/pricing"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-126, ADR-0018, ADR-0009]
license: own-words
---

## Evidence

Read on 2026-10-26 through a fetch tool that returns page text to a reading model, treated as untrusted data. The two OpenRouter URLs are live JSON records; the Google page says "Last updated 2026-10-22 UTC." **Prices and model lists change without notice; every figure here is as of 2026-10-26 only.**

From the endpoint record, copied as returned:

```text
"n":{"type":"range","min":1,"max":1}
"input_references":{"type":"range","min":0,"max":14}
{"billable":"output_image","unit":"token","cost_usd":0.00003}
```

From Google's pricing page:

> Equivalent to $0.0336 per 1K image

## The model list (fact)

- `GET https://openrouter.ai/api/v1/images/models` returned 61 objects in `data`, counted twice on the same day with the same result. ADR 0018 (Facts, row 4) records 62 for the same date; the list is live, so the difference may be a model added or removed between reads, or a count error in one of the two reads. It does not change the facts below.
- Present in the list: `google/gemini-nano-banana-2.1`, `openai/gpt-image-2`, `black-forest-labs/flux-3-image`, `bytedance-seed/seedream-5-0-pro`, `qwen/qwen-image-3-pro`, and 16 `recraft/` ids, of which 7 have `vector` in the id (for example `recraft/recraft-v4.1-vector`). Google ids beside 2.1 include `google/gemini-3.1-flash-image`, `google/gemini-3-pro-image` and `google/gemini-2.5-flash-image`.
- So more than one model on OpenRouter returns images; ADR 0009's "the only model on OpenRouter that returns images" does not hold on this date.

## The endpoint record for google/gemini-nano-banana-2.1 (fact)

- One endpoint, provider name Google AI Studio, tag and slug `google-ai-studio`.
- One price line: `output_image`, unit `token`, 0.00003 US dollars, which is 30 US dollars per million output image tokens. No input price line is in the record.
- `n`: a range from 1 to 1. **The endpoint accepts one image per request.** The guide says single-image providers reject `n > 1` ([[K-0072-openrouter-image-api-request-and-response]]).
- `input_references`: 0 to 14 (below the API-wide 16).
- `resolution`: `1K`, `2K`, `4K`. `aspect_ratio`: 14 values from `1:8` to `21:9`, including `1:1`.
- Not listed: `seed`, `output_format`. `supports_streaming` is false. `allowed_passthrough_parameters`: `cachedContent`.
- The model object in the list also gives `n` as limited to 1, and input modalities image and text, output image and text.

## Google's price for the same model (fact)

- Model id `gemini-nano-banana-2.1`, paid tier: input 1.50 US dollars per million tokens (text, image, video), output 30.00 per million tokens for images. Per image: 0.0336 at 1K, 0.0504 at 2K, 0.113 at 4K. Image input and output are "Not available" on the free tier.
- The page describes the model as an update to Nano Banana 2 (Gemini 3.1 Flash Image) and claims "accurate text rendering". That is the vendor's claim; nothing here measures it, and nothing here covers Thai text.

## Inference (below 0.7, not for a decision on its own)

- 0.0336 US dollars at 30 per million tokens implies about 1,120 output tokens per 1K image. OpenRouter's per-token price equals Google's, so the OpenRouter cost per 1K image is about the same before OpenRouter's fee on credit purchases, which was not read here.

## Why it matters for ORIVILO

A pinned image model and its job prices rest on these figures. The record's `n` maximum of 1 means a request returns one image on this endpoint, so a round of four drafts takes four requests. This entry records the endpoint; how a decision uses it is for the architect.
