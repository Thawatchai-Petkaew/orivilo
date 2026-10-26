---
id: K-0017
topic: architecture
claim: screenshot-to-code (abi) is a React/Vite and FastAPI app that sends a screenshot, mockup or recording to one of several vendor models, produces several variants from a mix of models, can let the agent screenshot its own page in headless Chromium to check it, and evaluates prompt and model changes by a person rating outputs 1 to 4, three runs per combination.
source: "https://github.com/abi/screenshot-to-code (README.md); https://raw.githubusercontent.com/abi/screenshot-to-code/main/Evaluation.md"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-109]
license: MIT
---

## Evidence

MIT license, per the repo page. Confidence 0.8: one source (the repo), README and `Evaluation.md` read on branch `main` without a commit hash.

> The app has a React/Vite frontend and a FastAPI backend.

> Screenshot preview (optional) lets the agent render its own generated page in a headless browser and visually check its work.

About variants, the README says that with more keys "the app automatically picks a stronger mix of models per variant".

### The system around the model

- **Model-driven:** reading the image and writing the code. Gemini also extracts real logos and images from the screenshot; Replicate (`z-image-turbo`) generates images.
- **Deterministic:** the output stack (HTML + Tailwind, HTML + CSS, React, Vue, Bootstrap, Ionic) is a fixed option the person picks; the preview render in Playwright with Chromium.
- **Knowledge or retrieval:** none shown beyond the prompt per stack.
- **Structured output:** code as text; no schema shown.
- **Evals and guardrails:** per `Evaluation.md`, screenshots go in `backend/evals_data/inputs`, the stack and model are set in `backend/run_evals.py`, outputs land in `backend/evals_data/outputs`, and a person rates each output 1 to 4 on an `/evals` page. Three runs per model, prompt and stack, averaged.
- **Provenance:** variants side by side let the person compare models; no saved record of which model made which output is described.
- **Human review:** the person picks among variants and iterates.
- **Cost and rate control:** bring-your-own keys (OpenAI, Anthropic, Gemini, Replicate). No rate limit or cost control is described. A hosted version exists at screenshottocode.com; its pricing is not stated on the pages read.
- **Stack:** React/Vite, FastAPI on uvicorn, WebSocket between them, Playwright with Chromium.
- **License:** MIT.

### What the sources do not show

- Any eval results, or how many screenshots the eval set holds.
- The README lists Claude models inconsistently between its model list and its key table, so the exact model set at any date is unclear.
- Any sanitization of generated code before it is previewed.

## Why it matters for ORIVILO

It shows a human-rated eval loop that is cheap to run (a folder of inputs, a scoring page, three runs averaged), which fits ADR 0009's "each job is measured before it ships" without relying on a model judge. Its "stronger mix of models per variant" is the opposite of ADR 0009's one pinned model per job; whether variants across models are worth the trace cost is for the architect.
