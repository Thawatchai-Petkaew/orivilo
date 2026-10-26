---
id: K-0019
topic: architecture
claim: Vercel describes v0 as a composite model in which retrieval, a fast quick-edit model and a fine-tuned AutoFix model sit around a swappable frontier base model.
source: "https://vercel.com/blog/v0-composite-model-family (2025-06-01); https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-109, ADR-0008, ADR-0009]
license: own-words
---

## Evidence

Vercel's blog and the AI SDK docs are Vercel's copyright, so this file is in our words with short quotes. Confidence 0.8 for what Vercel states: one publisher. **The v0 numbers are vendor-reported on an undisclosed eval set; they stay below 0.7 and are not grounds for a decision.**

From the blog (published 2025-06-01, by Aryaman Khandelwal, Gaspar Garcia, Ido Pesok and Max Leiter):

> The composite model architecture allowed us to upgrade the base model while keeping the rest of the stack stable.

AutoFix is "a pipeline that combines deterministic rules with AI-based corrections". From the AI SDK docs:

> The schema is also used to validate the generated data, ensuring type safety and correctness.

> Partial outputs streamed via `streamText` cannot be validated against your provided schema.

### The system around the model

- **Model-driven:** a base model for new generations and large changes (`v0-1.0-md` on Claude Sonnet 3.7, `v0-1.5-md` on Sonnet 4); a Quick Edit model for narrow edits; `vercel-autofixer-01`, trained with Fireworks AI by reinforcement fine-tuning, which checks the stream during and after generation.
- **Deterministic:** the rule part of AutoFix and a linter on the final output; a system prompt that fixes the response format; summaries of older chat turns.
- **Knowledge or retrieval:** retrieval from documentation, UI examples, uploaded project sources and internal Vercel knowledge before each call. How it retrieves is not described.
- **Structured output:** in the AI SDK, `Output.object`, `Output.array` (with `minItems` and `maxItems`), `Output.choice` (a closed set of strings) and `Output.json` (JSON only, no schema check), on `generateText` and `streamText`. Output is validated against a Zod, Valibot or JSON schema, and a result that does not parse or validate is rejected with `AI_NoObjectGeneratedError`; streamed partial objects are not validated. Errors expose `text`, `response`, `usage` and `cause` for logging. No automatic repair is described.
- **Evals and guardrails:** eval sets built "from common web development tasks", measured as the rate of error-free code. Reported: `v0-1.5-md` 93.87%, `claude-4-opus` 78.43%; AutoFix 86.14% at about 8,130 characters per second. Dataset size and the definition of an error are not given.
- **Provenance:** not described.
- **Human review:** chat iteration in the product, not described as a gate.
- **Cost and rate control:** not described in the pages read.
- **Stack:** v0 itself is closed. The AI SDK is TypeScript with a provider package per vendor (`@ai-sdk/*`).
- **License:** v0 is proprietary. The AI SDK repo's license was not re-read on 2026-10-26; check it before relying on it.

### What the sources do not show

- How retrieval ranks or cites what it found, and whether a generation records which documents it used.
- The eval set, its size, and what counts as an error.
- Any rate limiting or cost control in v0.

## Why it matters for ORIVILO

Two patterns map to ADR 0008 and ADR 0009: a stable pipeline around a swappable base model, and deterministic checks plus targeted model fixes after generation. The AI SDK's behavior (reject on schema failure, no validation of partial streams) matches ADR 0008's rule that every output is checked whole. ADR 0009 chose plain `fetch` over an SDK; this entry does not reopen that.
