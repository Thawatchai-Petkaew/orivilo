---
id: K-0020
topic: architecture
claim: Style Dictionary builds design tokens through a fixed, model-free nine-step pipeline (parse, merge, preprocess, transform, resolve references, format, act).
source: "https://styledictionary.com/info/architecture/; https://styledictionary.com/info/dtcg/; https://github.com/style-dictionary/style-dictionary; https://www.designtokens.org/TR/2025.10/format/; https://github.com/tokens-studio/sd-transforms"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-109]
license: own-words
---

## Evidence

Style Dictionary is Apache-2.0, the DTCG format is published under the W3C Community Final Specification Agreement, and sd-transforms is MIT. Mixed licenses, so this file is in our words with short quotes. Confidence 0.8: each fact comes from the publisher of that tool or spec, read once.

> As of version 4, Style Dictionary has first-class support for the DTCG format.

The same page says "the latest format 2025.10 does not have full support yet in Style Dictionary". The architecture page names the steps "Parse the config", "Find all token files", "Parse token files", "Deep merge token files", "Run preprocessors over the dictionary", "Transform the tokens", "Resolve aliases / references to other values", "Format the tokens into files" and "Run actions".

The DTCG page for 2025.10 says: "This specification is considered stable." Its status is Final Community Group Report, dated 28 October 2025.

### The system, and where a model would sit

- **Model-driven:** nothing. No page read mentions AI.
- **Deterministic:** all of it. Transforms run in the order the config lists them. In DTCG, a token has a required `$value`, an optional `$type`, `$description` and `$extensions` (reverse-domain keys for vendor data); references are `{group.token}` (whole tokens only) or JSON Pointer `$ref`. The spec says tools "MUST NOT attempt to guess the type of a token by inspecting the contents of its value".
- **Knowledge or retrieval:** not applicable; the token files are the source of truth.
- **Structured output and validation:** the token format is the schema. `$extensions` is the documented place for tool-specific data, such as a trace back to the decision that made a token.
- **Evals and guardrails:** not described on the pages read (no contrast or lint step in the core pipeline).
- **Provenance:** `$description` and `$extensions` can carry it; the format does not require it.
- **Human review:** outside the tool (designers edit tokens in Tokens Studio or files).
- **Cost and rate control:** not applicable.
- **Stack:** JavaScript/Node (Style Dictionary v5 is current per its banner); Tokens Studio's sd-transforms registers on the Style Dictionary object and adds its own transforms (math, color modifiers, typography) on top.
- **License:** Style Dictionary Apache-2.0; sd-transforms MIT; DTCG W3C CG Final Specification Agreement.

### What the sources do not show

- Which parts of DTCG 2025.10 Style Dictionary v5 still lacks.
- Any production product that puts a model in front of this pipeline and how it checks the model's tokens; none of these sources describes one.
- A draft of the next DTCG version (dated 08 September 2026) exists and says not to implement it; it was not read in full.

## Why it matters for ORIVILO

Every tool here keeps token building deterministic and puts intent (and any AI) upstream of the token files. That matches ADR 0007's "tokens come from the chosen profile" and ADR 0017's "hex values are never computed from decisions". If ORIVILO exports DTCG, `$extensions` is the documented slot for the decision trace; whether to use it is for the architect.
