---
id: K-0045
topic: architecture
claim: Wireflow's public pages name only third-party image, video, audio and 3D models (GPT Image, Nano Banana, Seedream, Flux, Kling, Veo, Seedance and others), run them on its hosted compute behind a node graph, and show no model of its own; custom fine-tuning is claimed only on its enterprise page, without detail.
source: "https://www.wireflow.ai/docs/nodes.md; https://www.wireflow.ai/node-based-video-generation; https://www.wireflow.ai/features/visual-node-editor; https://www.wireflow.ai/pricing; https://www.wireflow.ai/enterprise"
retrieved: 2026-10-26
confidence: 0.75
applies_to: [ORV-109, ADR-0009]
license: link-only
---

## Evidence

> Wireflow runs every model on hosted cloud compute, so you only need a browser.

(node-based-video-generation)

> 100+ AI Models Integrated

> does not write your copy or decide your strategy

(features/visual-node-editor)

> Custom model fine-tuning delivers brand-specific outputs.

(enterprise)

All quotes were re-read on 2026-10-26 through a fetch tool that returns page text, not through a browser. Confidence 0.75: every fact comes from Wireflow's own pages (one source, several pages), and "no model of its own" rests on absence. The pages name no own model, but they would not have to.

### What the pages show

- **Image models named:** GPT Image 2.5 Flare, GPT Image 2.5, GPT Image 2.5 Edit, GPT Image 2, Nano Banana Pro, Nano Banana 2, Seedream 5 Pro, Seedream 4.5, Flux 2 Pro, Ideogram 4.5, Recraft V4, Qwen Image, Krea 2 (node-based-video-generation).
- **Video models named:** Gemini Omni Flash 1.1, Gemini Omni 1.1, Seedance 2.5, Wan 3.0, Wan 2.7, Veo 3.1, Kling O3, Kling Video 3, Kling Motion Control, Hailuo 03, Grok Imagine Video, PixVerse v6, Luma Dream Machine, LTX Video 2.0 (same page).
- **Node catalog:** the docs list 294 nodes, updated 2026-10-26. They include upscalers (Topaz, Clarity, Crystal, FLUX Video Upscale), lip sync (Sync Lipsync v3), talking avatars (VEED Fabric, Kling AI Avatar), speech and music (ElevenLabs, Minimax, HeyGen TTS, Lyria 3 Pro, MMAudio Video Foley), 3D (Hyper3d Rodin, Meshy, Tripo, Trellis 2), and background removal (Bria, BiRefNet, BEN2, Rembg).
- **Logic nodes:** Router, Compare, Image and Text Iterators, Blueprint (a subflow) with an aggregator, a KV Store, and Run Code (marked admin beta).
- **Language model nodes:** Run any LLM, Enhance Prompt and Content Analyzer. No provider is named.
- **Compositing:** Compositor, Video Composite and Masked Composite nodes, plus a Video Editor that costs 0 credits.
- **Access:** "API and MCP access are on every plan", including Free (pricing). The editor page announces that Wireflow is a Claude connector.
- **Pricing:** Starter $36 a month for 2,660 credits, Professional $59 for 4,370, Team $299 for 22,140. That works out to about $0.0135 a credit on every plan (our arithmetic). Seedance 2.5 and Kling Video cost 135 credits per run at the default 5 s and 720p, so about $1.82 a clip, or about $0.36 a second (our arithmetic). The FAQ gives about 30 credits per image as a rough average.

### Claims from the orchestrator's notes that did not re-check

- **Remotion:** "Compose Video, built on Remotion" did not re-check. No node by that name exists in the docs, and "Remotion" appears only in the link path of the Video Editor node.
- **Published workflows:** that every published workflow becomes a REST endpoint and an MCP tool did not re-check. The pages read say only that API and MCP access exist on every plan.
- **Flux LoRA:** the node is listed without a description, so whether it trains or only runs LoRAs is unconfirmed.
- **Team:** the co-founder's name and the absence of funding were not re-read and are left out.

### Inference (not fact; confidence 0.4)

The orchestrator estimated that about 85 to 90% of what a user gets comes from third-party models, 10 to 15% from Wireflow's workflow layer, and none from models of its own. It also estimated a markup of about 1.0 to 1.6 times over model cost. Neither number is measured. No page shows wholesale model prices or generation shares, so treat them as a lead to check, never as grounds for a decision.

## Lessons for ORIVILO's harness

These are options for the architect and the owner, not decisions.

- A product can be all harness. Wireflow's own value is visible only as the node graph, logic nodes, hosted runs, per-run credit pricing and agent access (API, MCP, Claude connector). The models are bought in.
- Many vendors behind one canvas means each node is one model choice. A capability contract per node would let a model be swapped when a vendor changes, which matches the adapter idea in ADR 0009 (K-0027, pattern 3).
- A credit price shown per run before the run is the visible cost control here.
- Wireflow states that it stops at generation and leaves copy and strategy to the user. Strategy and brand reasoning are the layer ORIVILO's Intent Engine aims at.
- ADR 0009 routes AI through OpenRouter. Whether OpenRouter serves image and video models, or whether a separate media adapter is needed, was not checked here.

## Unknowns

- Who hosts the models: Wireflow's own GPUs, the model vendors' APIs, or an aggregator.
- Which language model backs Run any LLM, Enhance Prompt and Content Analyzer.
- Whether the enterprise fine-tuning exists as a product, and on which base models.
- Wholesale model costs, so the real markup.

## Why it matters for ORIVILO

ORV-109 asked where these platforms' images and videos come from. For Wireflow, the public answer is third-party models behind a hosted node graph. That is evidence that a node-and-harness product can stand without its own models. It does not show that such a product holds users.
