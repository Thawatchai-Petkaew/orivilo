---
id: K-0412
topic: platform
claim: OpenRouter's docs state (company-reported) that a BYOK request costs a fee of 5% of the normal OpenRouter price, taken from OpenRouter credits above a plan allowance ($25,000 a month on pay-as-you-go), call usage.cost "the total amount charged to your account" and cost_details.upstream_inference_cost "the actual cost charged by the upstream AI provider", and by default fall back to OpenRouter's shared capacity, which spends credits, when every key fails or is rate limited; no page read states which amount usage.cost holds on a BYOK request.
source: "https://openrouter.ai/docs/guides/overview/auth/byok.md; https://openrouter.ai/docs/faq.md; https://openrouter.ai/docs/guides/guides/usage-accounting.md; https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request.md; https://openrouter.ai/docs/api/api-reference/generations/get-generation.md; https://openrouter.ai/docs/api/api-reference/analytics/get-user-activity.md; https://openrouter.ai/docs/guides/routing/provider-selection.md; https://www.vantage.sh/integrations/openrouter (third party); .claude/rules/security.md"
retrieved: 2026-11-18
confidence: 0.75
applies_to: [ORV-284, ORV-121, ADR-0009, ADR-0015]
license: own-words
---

## Evidence

The first seven URLs are OpenRouter's own docs, so they count as one source (cap 0.8). The entry sits at 0.75 because its central question, what `usage.cost` holds on a BYOK request, is answered by no page read; that point is recorded as not stated, and the reading offered below is labelled as ours. The Vantage page is a third-party integration page and carries none of the entry's confidence. All pages were read on 2026-11-18 through a fetch tool that returns page text to a reading model, treated as untrusted data; the quotes are the short excerpts it returned. OpenRouter's docs carry no reuse license, so the rest is in our words. Every figure below is company-reported by OpenRouter, not measured by us. This entry adds BYOK to [[K-0091-openrouter-chat-completions-usage-cost]], which was written before BYOK was in use.

From the BYOK guide:

> The cost of using custom provider keys on OpenRouter is 5% of what the same model/provider would cost normally on OpenRouter

> and will be deducted from your OpenRouter credits.

From the usage accounting guide, section Cost Breakdown:

> `cost`: The total amount charged to your account

> `cost_details.upstream_inference_cost`: The actual cost charged by the upstream AI provider

## The fee and where it is taken from (fact, company-reported)

- **Rate.** 5% of what the same model and provider would cost on OpenRouter, "deducted from your OpenRouter credits" (BYOK guide). The FAQ says the same: "Usage above the allowance has a fee of 5% of what the same model and provider would normally cost on OpenRouter." and "This fee is deducted from your OpenRouter credits."
- **Allowance.** "The free allowance is plan-dependent and measured by list-price inference cost, not request count" (BYOK guide). The FAQ: "Pay-as-you-go includes $25,000 per month with no BYOK fee," and "Enterprise allowances are custom." Those are the two plans either page names; no other plan row was found on them.
- **Who bills the inference.** The BYOK guide says "Using provider keys enables direct control over rate limits and costs via your provider account." and the FAQ "This allows you to manage your rate limits and costs directly with the provider". Neither page says in so many words that the provider, not OpenRouter, bills the inference tokens; that is our reading of these two sentences.
- **Budgets.** "By default, BYOK inference spend does not count toward guardrail budgets." and, for workspace budgets, "By default BYOK spend does not count toward them." Each can be switched on with "Include BYOK spend" or `include_byok_in_budgets` (BYOK guide).

## What the response reports (fact)

- **`usage.cost`.** In the chat completions reference, `ChatUsage.cost` is `["number", "null"]`, format `double`, "Cost of the completion", not required. The usage accounting guide calls it "Cost in credits" and "`cost`: The total amount charged to your account". The FAQ says "OpenRouter uses a credit system where the base currency is US dollars."
- **`usage.is_byok`.** `boolean`, "Whether a request was made using a Bring Your Own Key configuration", not required (chat completions reference).
- **`usage.cost_details`.** `CostDetails` requires `upstream_inference_prompt_cost` and `upstream_inference_completions_cost` (numbers, no description) and has optional nullable `upstream_inference_cost` (no description in the schema) and `server_tool_cost` ("Metered server-tool execution cost (for example, shell sandbox time) billed for this request, in USD.") (chat completions reference).
- **What `upstream_inference_cost` means.** The usage accounting guide: "`cost_details.upstream_inference_cost`: The actual cost charged by the upstream AI provider", split into "`upstream_inference_prompt_cost` and `upstream_inference_completions_cost` on Chat Completions". It adds: "When obtaining usage information via generation ID, the `upstream_inference_cost` field is only available for BYOK (Bring Your Own Key) requests." and "For all other requests it will be 0 or null."
- **Generation endpoint.** `GET https://openrouter.ai/api/v1/generation` returns `total_cost` ("Total cost of the generation in USD", number), `usage` ("Usage amount in USD"), `upstream_inference_cost` ("Cost charged by the upstream provider", nullable), `is_byok` ("Whether this used bring-your-own-key") and `provider_responses` ("List of provider responses for this generation, including fallback attempts"), each item with `status` ("HTTP status code from the provider") and `is_byok` (generation reference).
- **Activity endpoint.** `GET https://openrouter.ai/api/v1/activity` ("Get user activity grouped by endpoint") reports two separate amounts per row: `usage`, "Total cost in USD (OpenRouter credits spent)", and `byok_usage_inference`, "BYOK inference cost in USD (external credits spent)" (activity reference).

## Which number `usage.cost` holds on a BYOK request (not stated)

- None of the seven OpenRouter pages read states whether `usage.cost` on a BYOK chat answer is the 5% fee alone, the fee plus the provider's charge, or 0 inside the allowance. The usage accounting guide does not mention the fee; the BYOK guide and the FAQ do not mention `usage.cost`.
- None of the samples shows a BYOK request: the `ChatUsage` sample has `cost: 0.0012`, `is_byok: false`, `upstream_inference_cost: null`, `upstream_inference_prompt_cost: 0.0008`, `upstream_inference_completions_cost: 0.0004` (chat completions reference); the generation sample has `is_byok: false` with `upstream_inference_cost: 0.0012` and `total_cost: 0.0015` (generation reference).
- **Open point.** The generation sample's non-null `upstream_inference_cost` on a non-BYOK request differs from the guide's sentence that the field is "only available for BYOK" requests and "0 or null" otherwise. The docs do not resolve it.
- **Our reading, not a stated fact.** Three stated facts point one way: `cost` is "the total amount charged to your account", the BYOK fee is "deducted from your OpenRouter credits", and the activity endpoint keeps "OpenRouter credits spent" apart from "BYOK inference cost in USD (external credits spent)". Read together, `usage.cost` on a BYOK answer would carry only what OpenRouter takes from credits (the fee, or 0 inside the allowance), and the provider's charge would sit in `usage.cost_details.upstream_inference_cost` (or the generation endpoint's `upstream_inference_cost`). No page states this; it is not grounds for a decision until a real BYOK answer is looked at.

## When the BYOK key fails or is rate limited (fact)

- **Order.** "Prioritized keys are tried first, then OpenRouter endpoints, then Fallback keys." A prioritized key is "attempted in order, before falling back to OpenRouter endpoints"; a fallback key is "tried only after OpenRouter endpoints have been attempted, in order." (BYOK guide).
- **Default on failure.** "By default, if all keys in both sections encounter a rate limit or failure," then "OpenRouter will fall back to using shared OpenRouter endpoints." and "Shared capacity spends OpenRouter credits." (BYOK guide).
- **The per-key setting.** Each prioritized key has a "Shared capacity fallback" setting: "Use shared capacity (default): OpenRouter tries your key first, then falls back to OpenRouter endpoints on failures."; the second level means "never fall back to OpenRouter endpoints on this provider", "which may result in rate limit errors if your keys are exhausted", while "Models outside the filter can still fall back to OpenRouter endpoints on this provider."; the third means "never spend OpenRouter credits on this provider, even for models outside the key's Models filter" (BYOK guide).
- **Other providers.** "Other providers can still serve the request unless you restrict them" (BYOK guide). The provider routing guide says "BYOK endpoints are automatically prioritized when you have API keys configured for a provider", that with `order` "within each provider you name, your own key is tried before OpenRouter's shared capacity", and that `allow_fallbacks` is "Whether to allow backup providers when the primary is unavailable." with default `true`.
- **Several keys.** "If the first key fails, it falls through to the next matching key before falling back to shared capacity." (BYOK guide).
- **Seeing what happened.** The BYOK guide's debugging section points to the generation's raw metadata: "look for the `provider_responses` field, which shows the HTTP status code from each provider attempt." It lists 400, 401 (invalid or revoked key), 403, 429 (rate limit) and 500.
- **Not stated.** No page read says whether a request that fell back to shared capacity reports `is_byok: false` in `usage`, or that its `usage.cost` is then the full OpenRouter price. "Shared capacity spends OpenRouter credits" is the only sentence on its cost.

## Third party (no confidence)

- The Vantage integration page says "Credits show what OpenRouter charges you, including platform fees on bring-your-own-key traffic." and "BYOK shows the inference spend OpenRouter reports for keys you hold with the upstream provider." This agrees with our reading above but is not OpenRouter's statement.

### Claims that did not re-check

- That the owner added an Anthropic key to OpenRouter as a prioritized BYOK key on 2026-11-18 and moved analysis and prompt-writing jobs to Anthropic models (ORV-284). This comes from the task envelope; the Jira issue was not read in this task. It is context, not a fact of this entry.

## Why it matters for ORIVILO

Security rule 6 in `.claude/rules/security.md` sums the spend cap "from OpenRouter's reported cost per request", and rule 12 records a cost OpenRouter did not report as null, never 0. If `usage.cost` on a BYOK answer holds only OpenRouter's fee (our reading, not stated), a cap that sums `usage.cost` alone would count the fee and miss the provider's charge, which the docs place in `usage.cost_details.upstream_inference_cost`; a request that falls back to shared capacity spends OpenRouter credits instead. Which field or sum the cap counts, and whether to look at a real BYOK answer first, is the architect's call.
