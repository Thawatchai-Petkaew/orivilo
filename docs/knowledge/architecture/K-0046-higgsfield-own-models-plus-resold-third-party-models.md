---
id: K-0046
topic: architecture
claim: Higgsfield generates with both third-party models (Sora 2, Veo 3.1, Kling, Seedance, Nano Banana Pro and others, also resold through its API) and models it calls its own proprietary ones (DoP, Soul, Popcorn, Cinema Studio), wrapped in an agent harness (Supercomputer) that routes steps across models and tools; no base model is disclosed for any of its own models.
source: "https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-dop; https://higgsfield.ai/; https://higgsfield.ai/higgsfield-api; https://higgsfield.ai/blog/how-we-built-supercomputer; https://aimmediahouse.com/retail/higgsfield-ai-thinks-generative-video-still-lacks-one-critical-thing; https://www.designboom.com/?p=1183949"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-109, ADR-0009]
license: link-only
---

## Evidence

> Yes. Higgsfield DoP is Higgsfield's own proprietary model, alongside Soul, Popcorn, and Cinema Studio.

(help center)

> Image-to-Video (I2V) architecture that blends diffusion models with reinforcement learning

(AIM Media House, 2025-04-06, on DoP)

> Teams already using fal or Replicate can switch by swapping a single key and keep the rest of their code in place.

(higgsfield-api)

All quotes were re-read on 2026-10-26 through a fetch tool that returns page text. Confidence 0.8: Higgsfield's help center and two press pieces (AIM Media House on DoP, designboom on Soul 2) agree that it has proprietary models, and its own pages name the third-party ones. The press pieces repeat company statements, so they are not fully independent. Whether "own" means trained from scratch or post-trained on someone else's base is not shown.

### Third-party models

- **Homepage:** Sora 2, Kling 3.0 and 4.0, Veo 3.1, Seedance 2.5 and Nano Banana Pro. It also says "Supercomputer Agent powered by GPT-6 Astra".
- **API page:** adds Kling O1 and O3, MiniMax Hailuo 2.3, Wan 2.6 to 3.0, Grok Imagine, LTX 2.5, Ideogram 4.0, Recraft 4.1, PixVerse 6, Qwen Image 3 and Z-Image Turbo. Its FAQ also names Veo and GPT Image.
- **Model count:** the API page gives two counts on the same page, "24 frontier models" and "50+ frontier models".

### Own models

- **Named own models:** DoP, Soul, Popcorn and Cinema Studio (help center). The help center says DoP is "trained to understand and control motion, lighting, lens behavior, framing, and spatial composition".
- **DoP:** AIM Media House calls it "Higgsfield DoP I2V-01-preview". It says Higgsfield built and tested it with TensorWave on AMD MI300X GPUs and uses reinforcement learning "after diffusion". No base model is named.
- **Soul 2:** designboom calls Soul 2 proprietary and says it was trained with "preference optimization based on human feedback from art directors, photographers, and concept artists". No base model is named.
- **Further names:** the API page also lists Genjutsu, Happy Horse, Soul 2 and Cinema Studio 4.0. Their origin is not stated, except Soul and Cinema Studio as above.
- **Price gap:** on the API page Soul 2 costs $0.0032 an image. Seedance 2.5 costs $0.2057 a second at list price, or $0.144 at a 30% discount.

### Harness (company blog on Supercomputer)

- **Agent:** Supercomputer is described as "an agentic workspace, not a single AI model" that "takes a goal, breaks it into steps, and routes those steps across the models and tools it needs".
- **Prompt engineering:** a prompt-engineering team turns plain requests into structured instructions. "Skills", written by creatives and prompt engineers, hold model-specific know-how, such as how to prompt a given video model.
- **Visual reference memory:** saved assets, such as a named character, can be recalled later without reloading the whole history into the language model.
- **Canvas:** Supercomputer runs inside Canvas, a workflow builder where the agent can turn a plain description into a workflow.
- **External agents:** MCP gives outside agents access. The homepage offers "Higgsfield MCP for Claude".
- **Products:** the API page lists Ads Studio, product shots, graphic ads and marketplace design workflows. The homepage metadata mentions face swap and "40+ creative AI tools".

### Company context

- **Funding:** a $400M Series B at a $5.4B valuation, led by DST Global and announced on 2026-08-17 (Yahoo Finance). TCV and NVIDIA joined a Series B extension, reported on 2026-10-23 (Unite.AI).
- **Revenue (company-reported):** $700M annualized in August 2026, and over $1B in September 2026 according to Unite.AI.
- **Founder:** Alex Mashrabov, co-founder and CEO, formerly head of AI at Snap.
- **Refunds:** Grit Daily (2026-10-12) reports complaints about "unlimited access to advanced models", tens of thousands of fake accounts blocked, and about $1.35 million refunded. A third-party review (Kavel, a competitor) quotes the help center: "unlimited" means specific models for a set period.
- **Plans:** that review lists Starter $19 with 270 credits, Plus $59 with 1,200 credits a month ($47 billed yearly), and Ultra $129 with 3,000 credits ($99 billed yearly). This is not checked against Higgsfield's own pricing page.

### Claims from the orchestrator's notes that did not re-check

- **DoP launch:** the X post with the 2025-03-31 launch could not be read (HTTP 402).
- **GPU partners:** Nebius as a partner is not in the article read; only TensorWave is.
- **Cinema Studio:** "about 1,296 lens and motion parameters" is not on the pages read.
- **Soul ID and CLI:** neither was found on the pages read.
- **Genjutsu base:** the community guess that it runs on Seedance was not re-read.
- **Unconfirmed company details:** the Series A amount, the CTO's name, the date of the CEO's apology, and the claim that Higgsfield owns its GPUs. The Grit Daily article does not give the apology date, and it describes blocked fake accounts, not bans of paying users.

### Inference (not fact; confidence 0.4)

The orchestrator estimated the split of what users get as about 60 to 70% third-party models, 20 to 25% harness and 10 to 15% own models. It also inferred that the own models are post-trained on undisclosed bases rather than trained from scratch. No source shows usage shares or base models, so this is a lead to check, never grounds for a decision.

## Lessons for ORIVILO's harness

These are options for the architect and the owner, not decisions.

- Model-specific prompting knowledge, written by people and stored as Skills, is something Higgsfield presents as its own layer above bought-in models. That is close to ORIVILO's sourced knowledge entries.
- Own models appear where the company wants control and lower unit cost (Soul 2 at $0.0032 an image), while frontier third-party models are resold for reach.
- Consistency of a character or product across generations (reference memory, saved assets) is a feature the company builds itself, not one it buys from model vendors.
- An agent that writes workflows onto a node canvas, rather than a canvas alone or an agent alone, is Higgsfield's stated design.
- The refund episode shows the risk of plans whose wording ("unlimited") runs ahead of per-generation cost.
- ADR 0009 routes AI through OpenRouter. Whether OpenRouter covers image and video models was not checked here.

## Unknowns

- The base models under DoP, Soul, Popcorn, Cinema Studio and Genjutsu, and how much of their training is Higgsfield's.
- The real share of generations on its own models compared with third-party ones.
- First-party plan pricing, and the wholesale prices it pays for third-party models.
- Whether GPT-6 Astra is the only language model behind Supercomputer. The blog names none, and the homepage names this one.

## Why it matters for ORIVILO

ORV-109 asked where these platforms' images and videos come from. Higgsfield is the mixed case: it resells third-party models, runs models it calls its own, and builds a harness of prompt knowledge, memory and an agent on a canvas. Wireflow (K-0045) is the case with no model of its own.
