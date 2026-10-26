---
id: K-0023
topic: architecture
claim: Radix Colors gives every scale twelve steps with fixed roles (1 to 2 backgrounds, 3 to 5 component backgrounds, 6 to 8 borders, 9 to 10 solid fills, 11 to 12 text), guarantees steps 11 and 12 reach APCA Lc 60 and Lc 90 on step 2 of the same scale, and its custom palette tool derives new scales from the Radix scales without documenting the method.
source: "https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale; https://www.radix-ui.com/colors/docs/overview/custom-palettes; https://github.com/radix-ui/colors (README)"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-109, ORV-20]
license: own-words
---

## Evidence

The `radix-ui/colors` repo is MIT ("Licensed under the MIT License", copyright WorkOS); the docs site carries no stated license, so this file is in our words with short quotes. Confidence 0.8: one publisher (Radix/WorkOS), docs and repo.

> Steps `11` and `12` are designed for text.

The same page says those steps are "guaranteed to Lc 60 and Lc 90 APCA contrast ratio on top of a step `2` background". The custom palette page says generated scales "are based on the Radix Colors scales themselves".

### The system

- **Model-driven:** nothing.
- **Deterministic:** fixed, hand-tuned scales; the custom tool takes "a couple reference colors" in any CSS format (including Display P3) and returns steps 1 to 12, alpha variants, wide-gamut values with sRGB fallbacks, and surface, indicator and track colors for Radix Themes.
- **Knowledge or retrieval:** the knowledge is the step-role contract: each step has one job.
- **Structured output:** CSS custom properties.
- **Evals and guardrails:** the stated APCA guarantee for steps 11 and 12 on step 2.
- **Provenance:** not applicable.
- **Human review:** the person picks reference colors and trims the output.
- **Cost and rate control:** not applicable.
- **Stack:** TypeScript and CSS; the docs site is a Next.js project (from a search result, not re-read).
- **License:** MIT for the colors repo.

### What the sources do not show

- The algorithm of the custom palette tool. A search did not find its source in the official website repo; a third-party package (`radix-theme-generator`) reimplements it with OKLCH and colorjs.io, which is not Radix's own statement.
- Contrast guarantees for any step other than 11 and 12, or for custom scales (the page says only that contrast is similar "as long as you use a reasonable background color").

## Why it matters for ORIVILO

Radix's step roles are a closed contract between a color and its use, the same idea as ORIVILO's semantic roles and locked groups (ADR 0017 decision 6). It is also an example of a guarantee stated per role pair, which is what `pnpm contrast` checks.
