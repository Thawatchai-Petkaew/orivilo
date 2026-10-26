---
id: K-0024
topic: architecture
claim: Huemint generates brand palettes with its own small models (a transformer over a 4096-token color codebook and a diffusion model, beside a random baseline) conditioned on a contrast graph in CIE Delta-E and on locked colors, treats the graph as a loose target rather than a guarantee, scores each palette for filtering, and states the models have no awareness of context.
source: "https://huemint.com/about/"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-109, ORV-20]
license: own-words
---

## Evidence

Huemint is closed source; the about page is the only source and carries no reuse license, so this file is in our words with short quotes. Confidence 0.8: one source read and quoted.

The page says "each contrast value is defined using CIE Delta-E", on a scale from 0 (not connected) to 100 (maximum contrast). The API is free for non-commercial use, "provided 'as is'".

### The system

- **Model-driven:** palette generation. A transformer treats a palette as a tiny image, quantizes pixels into a 4096-token codebook built with K-means, encodes the contrast graph as input tokens, and samples with top-p 0.8 at a default temperature of 1.2. A diffusion model based on OpenAI's Improved DDPM takes the adjacency matrix as an embedding; higher temperature stops denoising early.
- **Deterministic:** the random baseline samples from a designer color distribution and keeps the top 1% closest to the requested contrast; the scores used to filter (negative log likelihood, sum of squared differences, or largest absolute difference, by model).
- **Knowledge or retrieval:** the training distribution of designer palettes; no retrieval. Color roles (background, foreground, accent) are inferred.
- **Structured output:** 2 to 12 colors per palette; up to 50 results (transformer) or 5 (diffusion).
- **Evals and guardrails:** the contrast graph is not enforced exactly; over- or under-constrained graphs are handled by largely ignoring some values. The diffusion model was retrained with locked colors as an input after overwriting outputs at each step caused failures.
- **Provenance:** not described.
- **Human review:** the person locks colors and regenerates.
- **Cost and rate control:** temperature 0 to 2.4 in the API; no rate limits stated.
- **Stack:** not stated beyond the model types.
- **License:** proprietary service; API free for non-commercial use.

### What the sources do not show

- Training data size and source, and any measured quality.
- Any accessibility check on the output; Delta-E is not a WCAG or APCA contrast ratio.
- The page itself names the gap: the models do not know whether a design holds a person or a warning message.

## Why it matters for ORIVILO

Huemint is the clearest public case of a model generating palettes directly, and it states its own limits: constraints are loose, contrast is perceptual distance rather than legibility, and there is no context. In ORIVILO's terms its output would be a candidate that still needs the contrast contract and the locked groups (ADR 0017 decision 6) checked deterministically.
