---
id: K-0016
topic: architecture
claim: W&B's OpenUI scores generated components with a second model that judges desktop and mobile screenshots on four 1 to 4 criteria in a Weave evaluation.
source: "https://github.com/wandb/openui (README); https://github.com/wandb/openui/tree/main/backend (README); https://raw.githubusercontent.com/wandb/openui/main/backend/openui/server.py; https://raw.githubusercontent.com/wandb/openui/main/backend/openui/eval/evaluate_weave.py"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-109]
license: own-words
---

## Evidence

The repo is Apache-2.0, which is not on the README list, so this file is in our words with short quotes. Confidence is 0.8: one publisher (the repo), read in its README and two source files. The code was read through a fetch tool on branch `main`, without a commit hash; a later commit may differ.

> OpenUI supports OpenAI, Groq, and any model LiteLLM supports such as Gemini or Anthropic (Claude).

The README calls it "a tool we're using at W&B to test and prototype our next generation tooling".

```python
tokens = Usage.tokens_since(user_id, yesterday.date())
if config.ENV == config.Env.PROD and tokens > config.MAX_TOKENS:
```

The judge in `evaluate_weave.py` rates "Contrast: How well the component is displayed in light and dark mode", with media quality, relevance and polish, each 1 to 4, plus a reasoning field.

### The system around the model

- **Model-driven:** the whole UI. The model, any model behind a LiteLLM proxy, turns a text description into live HTML, and converts it to React, Svelte or Web Components on request.
- **Deterministic:** post-processing in the eval harness. Frontmatter (`name`, `emoji`) is parsed, code fences become HTML, and the page is screenshotted on desktop and mobile.
- **Knowledge or retrieval:** none shown. No design-system or token corpus is read.
- **Structured output:** free text with a frontmatter header, no schema on the UI itself. The judge returns JSON with four scores and a reasoning field.
- **Evals and guardrails:** a Weave `Evaluation` over a dataset named `eval:v0`. Generator default `gpt-3.5-turbo`, judge default `gpt-4-turbo` at temperature 0.3 and seed 42. `run_prompt_search()` runs a 10-step prompt search scored on mean polish plus mean relevance. The backend README describes the same loop in words (generate, screenshot, a vision model rates) and says more pipeline detail is "coming soon".
- **Provenance:** Weave tracing turns on only when a W&B API key is present (`weave.init`). No per-output record of model or prompt version is shown in the app.
- **Human review:** the person iterates by asking for changes. There is no approval step.
- **Cost and rate control:** GitHub OAuth (`fastapi_sso`); without a session the chat route returns 401 "Login required to use OpenUI". A daily per-user token total from a `Usage` table caps each signed-in user, enforced only when `ENV` is production, with an HTTP 429 once the cap is passed.
- **Stack:** Python backend run with `uv` (`HTTPException`, `fastapi_sso`), a LiteLLM proxy, an Ollama option, an npm frontend on port 5173, a Tailwind topic tag, Docker and `fly.toml`.
- **License:** Apache-2.0.

### What the sources do not show

- Generated HTML is shown "rendered live", but no page read here says how it is sandboxed or sanitized.
- The size and content of the `eval:v0` dataset, and any measured agreement between the judge model and people.
- The value of `MAX_TOKENS`, and whether the hosted demo still runs.

## Why it matters for ORIVILO

OpenUI is the "model writes everything, a second model grades screenshots" shape: no knowledge layer, no deterministic resolver, quality measured after the fact by a judge whose own accuracy is not shown. It shows two cheap controls ORIVILO's adapters could mirror (a per-user daily token cap, tracing gated on a key) and one thing not to cite as proof (an unvalidated model judge).
