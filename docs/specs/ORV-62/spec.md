---
issue: ORV-62 (https://tpetkaew.atlassian.net/browse/ORV-62)
lane: L
version: 2
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

## Acceptance criteria (part 3)

| #   | Given                                                        | When                             | Result                                                                                                                                                      | Evidence                                                 |
| --- | ------------------------------------------------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 8   | A signed-in person with a brief in the Studio                | Pressing "ให้ AI อ่าน"           | The `interpret` model reads the brief on the server. The reading replaces the rules' reading, and the badge says "อ่านโดย AI (anthropic/claude-sonnet-5.5)" | `ReadWithAi` story; checked on staging with the real key |
| 9   | An AI reading on screen                                      | Editing the brief                | The reading returns to the rules and says "อ่านตามกฎ", and the button is offered again. Typing never calls the model                                        | `ReadWithAi` story                                       |
| 10  | No key, a timeout, an error, or output that fails the checks | Pressing the button              | A status line says AI could not read, and the rules' reading stays. Only the failure kind is logged                                                         | `AiFails` story; action code                             |
| 11  | An AI reading                                                | Saving, then opening the version | The snapshot keeps the reading as an input, so it replays to the same fingerprint without calling the model again. Opening shows the AI badge               | `saved.test.ts`; integration test                        |
| 12  | A save that carries a reading                                | The server checks it             | The reading must carry the seal the server gave it (HMAC with the auth secret). A reading the client wrote, changed or sealed with another key is refused   | `directions.integration.test.ts`                         |
| 13  | A snapshot whose reading quotes words not in its brief       | Parsing                          | Refused as invalid                                                                                                                                          | `saved.test.ts`                                          |
| 14  | A signed-out visitor                                         | Viewing the Studio               | No AI button, since every call costs money                                                                                                                  | `SavedStudio` passes `readWithAi` only when signed in    |

Known limits of part 3:

- **Imported files are not sealed.** An imported file keeps whatever reading it carries, as long as the reading quotes its own brief and replays. The file is the person's own export, and the trace shows the reading's adapter and model.
- **No per-person rate limit yet.** The OpenRouter account budget caps spend. A per-person limit comes with the `instant` job, which calls far more often.

## Not in this part

- Image reading, chat, instant elements and logos: each has its own story under ADR 0009.
- A recorded evaluation on real model answers: the fixtures here are written by hand and say so. Part 3 records real answers on staging and replaces them.
