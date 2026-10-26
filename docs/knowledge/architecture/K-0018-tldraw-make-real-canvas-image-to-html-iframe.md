---
id: K-0018
topic: architecture
claim: tldraw's Make Real sends a picture of the selected canvas shapes, plus their text and the previous result's HTML, to a vision model through the Vercel AI SDK, asks for one self-contained HTML file with Tailwind, and puts the answer back on the canvas as an iframe shape the person annotates and resubmits; the repo was archived on 2026-02-20.
source: "https://github.com/tldraw/make-real (README, archive banner); https://raw.githubusercontent.com/tldraw/make-real/main/app/prompt.ts; https://raw.githubusercontent.com/tldraw/make-real/main/app/lib/getMessages.ts; https://raw.githubusercontent.com/tldraw/make-real/main/package.json; https://tldraw.dev/blog/make-real-the-story-so-far"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-109]
license: own-words
---

## Evidence

`package.json` says `"license": "MIT"`, but the repo has no LICENSE file (the raw URL returned 404) and the page shows no license, so this file is in our words with short quotes. Confidence 0.8: one publisher (tldraw), its repo and its blog.

The system prompt in `app/prompt.ts` opens:

> You are an expert web developer who specializes in building working website prototypes from low-fidelity wireframes.

From `app/lib/getMessages.ts`, a revision sends the earlier HTML as text, with the earlier screenshot commented out:

```ts
text: prompts.user(preview.props.html);
// image: preview.props.source,
```

The blog says "the website output was just another shape on the tldraw canvas", and that the person pasted their own OpenAI key, which the post calls "usually a _terrible_ idea and security risk".

### The system around the model

- **Model-driven:** the whole prototype; the prompt tells the model to fill gaps with common UX and web design patterns.
- **Deterministic:** building the message. The image, the text found in the selected shapes, an optional grid note (cell size in px) and the previous HTML. The prompt tells the model red marks are annotations, not design.
- **Knowledge or retrieval:** none. Context is the canvas itself plus the previous output.
- **Structured output:** one HTML file as text. `zod` is a dependency, but no schema for the output was read.
- **Evals and guardrails:** none shown.
- **Provenance:** the earlier output stays on the canvas next to the drawing, so the visual history is the trace. No record of model or prompt version was read.
- **Human review:** the core loop. The person draws on top of the result and presses Make Real again.
- **Cost and rate control:** originally the person's own key. Current dependencies include `@vercel/kv`, `@vercel/postgres` and `@vercel/blob`, but no rate-limit code was read.
- **Stack:** Next.js 14.0.1, React 19, `tldraw` ^4.4.0, `ai` ^6.0.90 with `@ai-sdk/anthropic`, `@ai-sdk/google` and `@ai-sdk/openai` (messages typed as the AI SDK's `UserModelMessage`), Tailwind. Forked from `SawyerHood/draw-a-ui`.
- **License:** `package.json` says MIT; no LICENSE file found.

### What the sources do not show

- How the iframe is sandboxed, and whether the key is stored in the browser or sent to tldraw's server (the blog does not say).
- Which model the current version calls by default; the blog speaks of GPT-4V, the dependencies list three vendors.
- Why the repo was archived.

## Why it matters for ORIVILO

Make Real makes the canvas the context and the history: each output sits beside its input, a visible, low-cost form of traceability that a Studio canvas could also offer. It has no validation layer, so it is a reference for interaction, not for checking model output (ADR 0008).
