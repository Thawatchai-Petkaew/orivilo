---
id: K-0021
topic: architecture
claim: Google's Material Color Utilities derives a whole Material color scheme from one source color, or from an image it quantizes and scores, with deterministic algorithms (our reading of its README, which does not use the word; the TypeScript 0.4.0 `QuantizerCelebi` is not deterministic, K-0088) in the HCT color space (hue, chroma, tone on CAM16 and L*), including contrast-level adjustments, in six languages under Apache-2.0 and with no model involved.
source: "https://github.com/material-foundation/material-color-utilities (README); docs/specs/ORV-128/tech.md (§8 Colour, lines 772 to 774; Findings row F41, line 1323)"
retrieved: 2026-10-28
confidence: 0.8
applies_to: [ORV-109, ORV-20]
license: own-words
---

## Evidence

Apache-2.0, not on the README list, so this file is in our words with short quotes. Confidence 0.8: one source, the repo README.

> A new color space (hue, chrome, tone) based on CAM16 x L*, that accounts for viewing conditions.

The README spells the second axis "chrome" there; HCT elsewhere means hue, chroma, tone. Quantize is described as "Turn an image into N colors", using the Celebi, Wu and WSMeans algorithms. Dynamic color is "Obtain colors that adjust based on UI state".

### The system

- **Model-driven:** nothing. The README does not mention AI.
- **Deterministic:** all components, by our reading of the README, which does not use the words deterministic, reproducible or random (re-read 2026-10-28). The TypeScript port's `QuantizerCelebi` in 0.4.0 is not: task ORV-134-design-quantiser-1 measured 20 different results in 20 calls on one 320 x 200 pixel array and 14 in 20 on one 320 x 2000 array, while its `QuantizerWu` gave 1 result in 20 calls at each size (tech notes ORV-128 §8, K-0088). HCT; Quantize (image to N colors); Score (ranks colors by how suitable they are for theming); Scheme (static and dynamic schemes from one color or a core palette); Dynamic color (adjusts for dark theme, style, preferences and contrast); Contrast (measures and finds colors that meet a ratio).
- **Knowledge or retrieval:** the knowledge is encoded as algorithms and constants, not as entries with sources.
- **Structured output:** typed scheme objects in each language.
- **Evals and guardrails:** contrast is built in (the Contrast component, contrast-level scheme variants). Test suites were not read.
- **Provenance:** a scheme is a function of its source color and settings, so the inputs are the trace.
- **Human review:** outside the library (Material Theme Builder is a separate tool, not read here).
- **Cost and rate control:** not applicable.
- **Stack:** C++, Dart, Java, Swift, TypeScript and Kotlin; npm and pub.dev packages.
- **License:** Apache-2.0.

### What the sources do not show

- The exact scoring weights in Score and how dislike or skin-tone rules work; the README does not describe them.
- Whether the six language ports produce identical output for the same input.

## Why it matters for ORIVILO

It is the strongest public example of "intent in, palette out" done with no model at all: one seed or one image, fixed algorithms, contrast as part of the scheme. For the color node (ADR 0017) it is an option for generating or checking swatches, though ADR 0007 and 0017 currently choose curated values over generated ones.
