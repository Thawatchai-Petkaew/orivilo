---
issue: ORV-62 (https://tpetkaew.atlassian.net/browse/ORV-62)
lane: L
version: 1
---

## Why

The Studio reads a brief only with a fixed word list (ORV-33), so a brief that says the same thing in other words reads as "not understood". The owner set up OpenRouter and asked for AI that reads briefs, takes part in the conversation, answers instantly, reads images and makes logos (ADR 0009). This story makes the first of those real: a brief read by a model, checked as untrusted data, with the rules as the labelled fallback.

## Decisions this spec relies on

- ADR 0008: the adapter interface, the strict output schema, evidence spans equal to the brief, `method` shown in the UI.
- ADR 0009: OpenRouter only, one pinned model per job (`interpret` is `anthropic/claude-sonnet-5.5`), no silent model fallback, zero retention and no training on every request, keys per environment, tests never call a model.

## Story

As a Studio user, I want my brief read by AI when AI is available, so that what I write in my own words is understood, and I can see that AI read it and which words each fact came from.

## Parts

1. **ADR 0009** (PR #44). The decision and the per-job models.
2. **The engine adapter and the client** (this part). Pure TypeScript in `packages/intent-engine`. No UI changes, and nothing calls the model yet.
3. **The Studio uses it.** A server action reads the brief with the key from the environment. The Studio shows "read by AI (model)" or "read by rules". It is checked on staging with the real key.

## Acceptance criteria (part 2)

| #   | Given                                                                                                             | When                                  | Result                                                                                                                                                                      | Evidence                  |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 1   | A brief and a model answer that fits the schema                                                                   | `interpretBrief(llmInterpreter(...))` | Facts assembled exactly as the rules assemble them. `method` is `llm`, and the adapter version names the prompt and the model. Every evidence span is the brief's own words | `llm-interpreter.test.ts` |
| 2   | The model names a level                                                                                           | Mapping                               | The level becomes the rules' documented value (90, 75, 40, 25, 15). No score from the model is accepted                                                                     | Test                      |
| 3   | An axis read two ways                                                                                             | Assembling                            | The axis stays open as `conflicting`; nothing is picked                                                                                                                     | Test                      |
| 4   | An answer with a quote not in the brief, an extra field, a value outside the vocabulary, or text that is not JSON | Reading                               | `adapter-failed`, so the caller falls back to the rules                                                                                                                     | Tests                     |
| 5   | A brief that carries instructions                                                                                 | Building the request                  | The brief goes only in the user message. The system prompt is fixed and says the brief is data                                                                              | Test                      |
| 6   | A call to OpenRouter                                                                                              | Sending                               | The pinned model, `zdr: true`, `data_collection: "deny"`, `allow_fallbacks: false`, strict JSON schema output, temperature 0                                                | Test                      |
| 7   | OpenRouter answers with an error, another model, or no text                                                       | Receiving                             | It throws, and nothing is retried with other settings                                                                                                                       | Tests                     |

## Not in this part

- Any UI, server action or use of `OPENROUTER_API_KEY` (part 3).
- Image reading, chat, instant elements and logos: each has its own story under ADR 0009.
- A recorded evaluation on real model answers: the fixtures here are written by hand and say so. Part 3 records real answers on staging and replaces them.
