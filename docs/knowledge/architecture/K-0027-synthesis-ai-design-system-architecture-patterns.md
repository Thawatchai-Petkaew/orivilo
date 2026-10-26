---
id: K-0027
topic: architecture
claim: Across eleven public AI UI generators, token pipelines and color systems read on 2026-10-26, six architecture patterns recur; every project that produces color or tokens people ship does it deterministically except Huemint (K-0024), whose own models treat contrast as a loose target, while every model-driven generator surveyed lacks at least one of a knowledge layer with sources, schema-checked output, or a recorded trace of what made each result.
source: "docs/knowledge/architecture/K-0016-openui-litellm-generator-with-judge-model-evals.md; docs/knowledge/architecture/K-0017-screenshot-to-code-variants-and-human-scored-evals.md; docs/knowledge/architecture/K-0018-tldraw-make-real-canvas-image-to-html-iframe.md; docs/knowledge/architecture/K-0019-v0-composite-model-and-ai-sdk-structured-output.md; docs/knowledge/architecture/K-0020-style-dictionary-dtcg-token-pipeline.md; docs/knowledge/architecture/K-0021-material-color-utilities-hct-deterministic-schemes.md; docs/knowledge/architecture/K-0022-adobe-leonardo-contrast-targeted-palettes.md; docs/knowledge/architecture/K-0023-radix-colors-step-roles-and-apca-guarantee.md; docs/knowledge/architecture/K-0024-huemint-ml-palettes-from-a-contrast-graph.md; docs/knowledge/architecture/K-0025-penpot-mcp-model-runs-code-in-plugin.md; docs/knowledge/architecture/K-0026-hue-agent-skill-design-model-and-validator.md"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-109, ADR-0007, ADR-0008, ADR-0009, ADR-0017]
license: own-words
---

## Evidence

This entry groups what the eleven entries above record; each fact is quoted and sourced there. The grouping is ours. Confidence 0.8: each pattern rests on at least two independent projects, but the survey is small, chosen by hand, and read from public pages only, so "recurs" means "seen more than once here", not "is the industry norm". The claim about the generators lacking a trace is about what their public pages show, not proof that none exists inside them.

### The survey at a glance

| Project                  | Entry  | Decides with          | Knowledge layer                | Output check                 | Evals             |
| ------------------------ | ------ | --------------------- | ------------------------------ | ---------------------------- | ----------------- |
| OpenUI                   | K-0016 | Model                 | None                           | None on UI                   | Model judge       |
| screenshot-to-code       | K-0017 | Model                 | None                           | None shown                   | Human 1 to 4      |
| tldraw Make Real         | K-0018 | Model                 | Canvas only                    | None shown                   | None shown        |
| v0 and the AI SDK        | K-0019 | Model plus rules      | Retrieval, method unshown      | Schema; AutoFix and linter   | Vendor error rate |
| Style Dictionary, DTCG   | K-0020 | Rules                 | Token files                    | Format spec                  | None shown        |
| Material Color Utilities | K-0021 | Algorithm             | Encoded in code                | Contrast built in            | Not read          |
| Adobe Leonardo           | K-0022 | Algorithm             | WCAG targets                   | Contrast is the input        | Not read          |
| Radix Colors             | K-0023 | Curated, hand-tuned   | Step-role contract             | APCA guarantee, steps 11, 12 | Not read          |
| Huemint                  | K-0024 | Own small models      | Training data                  | Loose contrast graph         | None shown        |
| Penpot MCP               | K-0025 | Model runs code       | Live design file               | None; remote mode only       | None shown        |
| Hue                      | K-0026 | Model, human approves | Templates, observed vs derived | Deterministic validator      | None shown        |

### Pattern 1: deterministic core, model at the edge

Seen in K-0020, K-0021, K-0022, K-0023 (no model at all) and in K-0019 and K-0026 (a model proposes, rules or a validator check). Values people ship (hex, tokens, contrast pairs) come from algorithms, curated scales or a fixed pipeline in every project that produces them, with one exception: Huemint (K-0024) generates palettes with its own models and treats its contrast graph as a loose target, not a guarantee.

- **Implies for ORIVILO:** consistent with ADR 0007, ADR 0008 and ADR 0017 (a model reads intent, the resolver decides, hex comes from curated sets). The option the survey adds is algorithmic generation with contrast as the input (K-0021, K-0022) for when curated sets run out; ADR 0007 currently rules generation out.

### Pattern 2: one structured source of truth, everything else derived

Seen in K-0020 (token files and a fixed build), K-0026 (`design-model.yaml`), K-0021 (a scheme as a function of one seed). The model, if any, writes the source once; files are derived, not written by the model one by one.

- **Implies for ORIVILO:** the resolver result with its fingerprint (ADR 0007 decision 5) already plays this role. If ORIVILO exports DTCG, `$extensions` is the documented place for the decision trace (K-0020); not decided here.

### Pattern 3: a stable pipeline around a swappable model

Seen in K-0019 (base model upgraded "while keeping the rest of the stack stable"), K-0016 (any model behind LiteLLM), K-0018 (three vendor SDKs behind the AI SDK).

- **Implies for ORIVILO:** matches ADR 0008's adapter and ADR 0009's OpenRouter module. Two projects (K-0016, K-0017) let the provider vary freely or mix models per variant, which ADR 0009 rejects for traceability; the survey shows the convenience, and none of the pages read shows a record of which model made a saved result.

### Pattern 4: check after generation, deterministically first

Seen in K-0019 (schema validation, a linter, rule-based AutoFix), K-0026 (a validator that exits 1, including contrast), K-0017 (the agent screenshots its own page). The schema-check pattern in K-0019 rejects a whole result rather than validating partial streams.

- **Implies for ORIVILO:** ADR 0008's strict schema and evidence spans already go further than the pages read show for any generator surveyed: none of the pages read shows a check that a model's claim matches its input. A model-based fixer (v0's AutoFix) is an option the survey shows; its accuracy figures are vendor-reported and below 0.7.

### Pattern 5: evals are a folder of inputs and a score, by a person or a model

Seen in K-0017 (human, 1 to 4, three runs averaged), K-0016 (a model judge on screenshots, four criteria, plus prompt search), K-0019 (an error-free rate on a private set). None publishes its eval set or its judge's agreement with people.

- **Implies for ORIVILO:** ADR 0009 already asks for a Thai and English eval set per job kept as fixtures. The options are human rating (cheap, trusted, slow) or a model judge (fast, unvalidated); the survey shows no project that measured its judge.

### Pattern 6: the person stays in the loop at named points

Seen in K-0026 (approval of direction and core tokens), K-0018 (annotate and resubmit on the canvas), K-0017 (choose among variants), K-0024 (lock colors and regenerate), K-0022 and K-0023 (the person authors in a web tool).

- **Implies for ORIVILO:** matches ADR 0007's locks and adjustments and the Studio's questions. Hue's split of "observed" from "derived" values (K-0026) is close to ORIVILO's evidence spans and `uncertain` list.

### Where the surveyed projects stop and ORIVILO's design goes further

- **Knowledge with sources and confidence.** No project surveyed keeps knowledge as entries with a source, a date, a license and a confidence that a decision cites. v0 retrieves (method unshown); Hue loads templates; the color libraries encode knowledge in code.
- **Closed decision rules with visible ties.** None of them has a rule grammar whose ties become conflicts (ADR 0006, ADR 0017).
- **Per-result provenance.** None records adapter, version and model per saved result, as ADR 0009 point 2 requires. Make Real's canvas history (K-0018) is the nearest thing.
- **Cost and rate control** is shown only in OpenUI (login plus a daily token cap, K-0016). The others leave it to the person's own key or do not say.

### What the sources do not show

- Closed products (v0's internals, Figma Make, Uizard, Galileo and similar) were not read in detail; only v0 has a public architecture post, and it omits retrieval, provenance and cost.
- No source here measures whether intent-to-design output is good for the brand; every quality number seen is either a model judge, a private eval, or absent.
- Whether a deterministic core costs users anything they would notice (speed, variety) is not shown by any source; Huemint's loose constraints are the only stated trade-off on the generative side.

## Why it matters for ORIVILO

ORV-109 asked how proven projects structure the system behind the model. The survey supports the shape ORIVILO already has (model reads, rules decide, deterministic checks gate, the person approves) and shows that knowledge with sources, closed rules and per-result provenance are not common practice in the projects read, so there is no public reference implementation to copy for them. Which patterns to adopt is for the architect and the owner.
