---
id: K-0086
topic: market
claim: Against Google's public Gemini API list prices read on 2026-10-28, our own arithmetic puts Wireflow's resale of Nano Banana Pro at about 1.1 to 2.0 times list and of Nano Banana 2 at about 1.8 to 4.0 times list, and Higgsfield's app resale of Nano Banana Pro at about 0.64 to 1.12 times list and of Nano Banana 2 at about 0.85 to 2.2 times list, depending on plan and resolution; these are markups over list price, not margins, because neither reseller's wholesale price is public, and for the video models compared no vendor list price per second was readable.
source: "https://ai.google.dev/gemini-api/docs/pricing; https://ai.google.dev/gemini-api/docs/video; https://www.wireflow.ai/pricing; https://www.wireflow.ai/docs/nodes/generate--nano_banana_pro.md; https://www.wireflow.ai/docs/nodes/generate--nano_banana_2.md; https://www.wireflow.ai/docs/nodes/generate--openai_gpt_image_2.md; https://www.wireflow.ai/docs/nodes/generate--flux_2_pro.md; https://www.wireflow.ai/docs/nodes/video--veo3_1.md; https://www.wireflow.ai/docs/nodes/video--seedance_2_5.md; https://higgsfield.ai/blog/higgsfield-pricing-explained; https://higgsfield.ai/blog/unlimited-nano-banana-2-plans; https://higgsfield.ai/creator-hub/help-center/credits-and-usage/how-does-auto-refill-work; https://higgsfield.ai/higgsfield-api; https://developers.openai.com/api/docs/pricing; https://docs.bfl.ai/quick_start/pricing.md; https://bfl.ai/pricing"
retrieved: 2026-10-28
confidence: 0.7
applies_to: [ORV-131]
license: link-only
---

## Evidence

Every page was read on 2026-10-28 through a fetch tool that returns page text and quotes of at most about 125 characters. **Every ratio, USD price per image or second, and markup in this entry is our own arithmetic**, written beside the list price and the reseller figure it rests on. Confidence 0.7: each input is read on the seller's own page, but the reseller figures are approximate ("~20 credits"), Wireflow does not say which resolution its image figure is for, and we assume that a model sold under the same name is the same model at the same settings. Price per credit for each plan comes from [[K-0084-wireflow-flat-credit-price-rollover-and-per-node-metering]] and [[K-0085-higgsfield-tiered-credits-no-rollover-and-separate-api-wallet]]; what each platform resells is in [[K-0045-wireflow-third-party-models-in-a-hosted-node-graph]] and [[K-0046-higgsfield-own-models-plus-resold-third-party-models]].

### List prices (Google Gemini API pricing page, "Last updated 2026-10-27 UTC", Standard paid tier)

- **Nano Banana Pro** (`gemini-3-pro-image`): "Equivalent to $0.134 per 1K/2K image" and "$0.24 per 4K image".
- **Nano Banana 2** (`gemini-3.1-flash-image`): "$0.067 per 1K image", "$0.101 per 2K image" and "$0.151 per 4K image".

### Reseller figures

- **Wireflow:** about $0.0135 a credit on each paid plan (K-0084, from $36 / 2,660, $59 / 4,370 and $299 / 22,140). The Nano Banana Pro node page says "~20 credits per images" and names no resolution; the Nano Banana 2 node page says "~20 credits per images" and lists resolutions 0.5K, 1K, 2K and 4K with no cost for each.
- **Higgsfield app:** "outside a window, the price is 2 credits per image, approximately $0.10 at the reference rate of 20 credits per $1." Its cost table (in a post about Nano Banana 2, no model column) gives "2 credits (~$0.10)" at 1K and 2K and "4 credits (~$0.20)" at 4K. Its Starter row reads "Credits only, 2 credits/image" for both the Nano Banana 2 and the Nano Banana Pro columns (blog, 2026-09-21). Price per credit by plan (K-0085): Starter $0.075, Plus $0.049, Ultra $0.043; Auto-Refill $1 = 18 credits, so $0.0556.

### Markup over list: Wireflow (our arithmetic)

20 credits x $0.0135 = about $0.27 an image.

- **Nano Banana Pro:** $0.27 / $0.134 (1K or 2K list) = about 2.0 times; $0.27 / $0.24 (4K list) = about 1.1 times.
- **Nano Banana 2:** $0.27 / $0.067 (1K list) = about 4.0 times; $0.27 / $0.101 (2K list) = about 2.7 times; $0.27 / $0.151 (4K list) = about 1.8 times.

Because the page gives one figure for all resolutions, the true ratio at a given resolution is unknown; these are the ends of the range.

### Markup over list: Higgsfield app (our arithmetic)

2 credits cost $0.086 on Ultra (2 x $0.043), $0.098 on Plus, $0.111 at the Auto-Refill rate, and $0.150 on Starter. 4 credits cost $0.172 on Ultra and $0.300 on Starter.

- **Nano Banana Pro at 1K or 2K, 2 credits:** $0.086 / $0.134 = about 0.64 times (Ultra); $0.098 / $0.134 = about 0.73 times (Plus); $0.111 / $0.134 = about 0.83 times (Auto-Refill); $0.150 / $0.134 = about 1.12 times (Starter). The 4K credit cost for Nano Banana Pro is not stated on the pages read.
- **Nano Banana 2 at 1K, 2 credits:** $0.086 / $0.067 = about 1.28 times (Ultra) to $0.150 / $0.067 = about 2.24 times (Starter).
- **Nano Banana 2 at 2K, 2 credits:** $0.086 / $0.101 = about 0.85 times (Ultra) to $0.150 / $0.101 = about 1.49 times (Starter).
- **Nano Banana 2 at 4K, 4 credits:** $0.172 / $0.151 = about 1.14 times (Ultra) to $0.300 / $0.151 = about 1.99 times (Starter).

Higgsfield's own blog makes the same comparison at its reference rate: about $0.10 against Google's $0.067 at 1K, about the same as $0.101 at 2K, and about $0.20 against $0.151 at 4K, and notes that Google's listed prices exclude input tokens. Within an Unlimited window the credit cost of an included model is zero (K-0085), so these ratios apply only outside such windows.

A ratio below 1 means the reseller charges less than the public list price. The pages read do not say why: a negotiated wholesale price, a batch or discount tier, or a loss on that model are all possible, and none is shown.

### Not computed, and why

- **Veo 3.1:** Wireflow states "~64 credits per seconds" (about $0.86 a second, our arithmetic). Google's Gemini API pricing page read shows no Veo price, and its video page says the Veo 3.1 Preview models were shut down on October 22, 2026. No list price was read, so no markup.
- **Seedance 2.5:** Wireflow states "~27 credits per second" (about $0.36 a second, our arithmetic). No ByteDance or BytePlus list price was fetched. Between the two resellers only (not a markup over list): Higgsfield's API lists Seedance 2.5 at "$0.144 / sec" against an original "$0.2057", so Wireflow's app rate is about 1.8 times Higgsfield's original API rate and about 2.5 times its discounted rate (our arithmetic, resolutions not matched).
- **GPT Image 2:** Wireflow states "~44 credits per images" (about $0.59, our arithmetic). OpenAI's pricing page lists gpt-image-2 per million tokens only (Standard image output "$30.00"), and the tokens per image were not read.
- **Flux 2 Pro:** Wireflow states "~10 credits per processed megapixels" (about $0.135 a megapixel, our arithmetic). BFL's docs state "1 credit = $0.01 USD" but neither BFL page read showed the FLUX.2 [pro] figure.

### What these numbers are not

- They are not margins. Wholesale prices are not public: neither Wireflow nor Higgsfield says what it pays Google or any other vendor, or whether it calls the vendor directly or through an aggregator (K-0045 and K-0046 list this as unknown).
- They are not a whole-platform markup. Each covers one model at one setting, outside bonuses, packs, Unlimited windows and unused credits.

### Claims that did not re-check

These carry no confidence and are not grounds for a decision.

- Third-party pages found by search put Veo 3.1 on the Gemini API at $0.40 a second at 720p and 1080p. Google's own pages read did not show it.
- Third-party guides put Seedance 2.5 on BytePlus at token rates (for example $10.70 per million tokens) that convert to about $0.23 a second at 720p. No BytePlus page was fetched.
- A search summary said BFL lists FLUX.2 [pro] "from $0.03" for text to image. The two BFL pages fetched did not show the figure.

## Why it matters for ORIVILO

ORV-131 asks what these platforms charge over the models they resell. On the one model family where a public list price was readable, our arithmetic ranges from below list to about four times list, varying with platform, plan and resolution. This entry records arithmetic, not a pricing decision for ORIVILO.
