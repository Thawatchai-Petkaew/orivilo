---
id: K-0022
topic: architecture
claim: Adobe Leonardo generates color scales from target contrast ratios against a background, deterministically, by interpolating between key colors in a chosen color space with D3 Color, and its output often lands slightly above the target because WCAG ratios are minimums and not every ratio is reachable in RGB.
source: "https://github.com/adobe/leonardo (README); https://github.com/adobe/leonardo/tree/main/packages/contrast-colors (README)"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-109, ORV-20]
license: own-words
---

## Evidence

Apache-2.0 ("This project is licensed under the Apache V2 License."), not on the README list, so this file is in our words with short quotes. Confidence 0.8: one publisher (Adobe), the repo and its package README.

> Authoring adaptive color palettes for generating color based on a desired contrast ratio.

The `contrast-colors` README defines `Color` with `colorKeys` ("List of specific colors to interpolate between in order to generate a full lightness scale of the color"), `ratios`, `colorspace` and `smooth`, and `Theme` as a "Class function used to generate adaptive contrast-based colors" with `colors`, `lightness`, `contrast`, `saturation` and `output`.

### The system

- **Model-driven:** nothing.
- **Deterministic:** all of it. The person states the constraint (contrast ratios against a background) and the tool solves for colors; `generateContrastColors()` and `createScale()` are the core functions.
- **Knowledge or retrieval:** the WCAG minimum contrast rule, built into the targets.
- **Structured output:** a typed theme object with named ratios.
- **Evals and guardrails:** contrast is the input, so every output meets it by construction (rounded up where exact values are not reachable).
- **Provenance:** a theme is a function of its key colors, ratios and color space.
- **Human review:** the leonardocolor.io web app is where people author and adjust scales.
- **Cost and rate control:** not applicable.
- **Stack:** JavaScript, D3 Color (with modules such as CIE CAM02), npm package `@adobe/leonardo-contrast-colors`.
- **License:** Apache-2.0.

### What the sources do not show

- APCA or any contrast formula other than WCAG 2; neither README read mentions one.
- How lightness and saturation settings interact with the ratios in detail.

## Why it matters for ORIVILO

Leonardo is "contrast as the input, not a check afterwards". ORIVILO now checks contrast after choosing values (`pnpm contrast`, ADR 0017 decision 6); Leonardo shows the other option, solving for values that meet the contrast contract. Which to use for future palettes is for the architect.
