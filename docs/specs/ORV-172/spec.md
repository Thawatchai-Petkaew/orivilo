---
issue: ORV-172 (https://tpetkaew.atlassian.net/browse/ORV-172)
parent: ORV-160 (slice 2, "Engine bounds and request envelope")
lane: L, inherited from ORV-160
version: 1.0
---

# ORV-172: ORV-160 slice 2, the engine bounds and the request envelope

## Why

ORV-172 is slice 2 of ORV-160, the guardrail test set from the OWASP LLM Top 10 2026 for the interpreter path. The parent's "Slices" list, item 2, names it "Engine bounds and request envelope" (test-only), with rows 9 to 16, 19 to 24 and 29; G is created here and C, created by PR 141, is extended. This slice pins the request the OpenRouter client sends, the provider flags, the pinned model ids and URL, today's answer model check, the answer schema bounds, the brief bound, the output token default, the signal hand-off and the system prompt's hygiene, so that a change to any of them fails `pnpm test`.

This file is the slice spec of L-0016: a slice issue gets its own spec. It adds no requirement and no gate of its own. The business intent, the story, the frame and the set structure are the parent's ("Why", "Story", "The set this covers").

**Frame.** Not a guard spec. The four guard-rail parts the parent's "Frame" names (`orv160-titles`, `orv160-network-block`, `orv160-recorder-output`, `orv160-recorder-key`) are in slices 3 and 7, not here.

**What is real.** Every row here runs on a fake model with a hand-written answer, a fake `fetch`, or a value check (`orv160-form`); no row calls a model or the network. A row proves that the code holds a bound or a flag, not that the model resists an attack. The parent's "What is real" paragraph holds.

## Parent spec and gates

- Parent spec: `docs/specs/ORV-160/spec.md` v1.2 (changelog line "v1.2 (2026-10-30)").
- G1 and G2: ORV-160 comment 10293, passed under the owner's delegation in POC mode (ADR 0012 decision 4, parent "Lane"). ORV-172 inherits both; no new gate decision is needed for this slice.
- Decisions: the parent's "Depends on".
- Review: `security` runs on this slice's PR as `orv160-security-dispatch` says.

## Acceptance criteria

Rows 9 to 16, 19 to 24 and 29 of the parent spec, copied with their numbers, their columns and their text unchanged. The conventions for the Red when column, the exact outcomes and a row that ends in `adapter-failed` are the parent's "Acceptance criteria" opening paragraph. File keys for this slice: **G** `packages/intent-engine/src/llm-guardrails.test.ts` (new); **C** `packages/intent-engine/src/openrouter.test.ts` (created by PR 141, extended here). `MODEL` is `AI_MODELS.interpret`. The parent's other file keys (A, W, R, P) belong to other slices.

<!-- prettier-ignore -->
| # | Entry | Given | When | Who sees what | Data effect | Test and form | Red when | Slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | LLM02:2026 request envelope at the client | `openRouterComplete` with a fake `fetch` answering 200, no `maxTokens`, no `signal` | One call | Operator: the request is `orv160-request-envelope`'s client half | None | C, fake `fetch` | `openrouter.ts` line 97, `"X-Title": "ORIVILO",`, removed | 2 |
| 10 | LLM02:2026 zero retention | As row 9 | One call | Operator: the sent `provider` holds `orv160-flag-zdr` | None | C, fake `fetch` (today's `toEqual` at `llm-interpreter.test.ts` line 212 moves or stays; the mutation row is new) | `openrouter.ts` line 79, `zdr: true,`, becomes `zdr: false,` | 2 |
| 11 | LLM02:2026 no training | As row 9 | One call | Operator: the sent `provider` holds `orv160-flag-data-collection` | None | C, fake `fetch` | `openrouter.ts` line 80, `data_collection: "deny",`, becomes `data_collection: "allow",` | 2 |
| 12 | LLM04:2026 pinned model ids | The module `openrouter.ts` | `AI_MODELS` is read | Operator: it equals `orv160-model-ids` | None | C, value check | `openrouter.ts` line 14, `interpret: "anthropic/claude-sonnet-5.5",`, becomes `interpret: "anthropic/claude-sonnet-5",` | 2 |
| 13 | LLM04:2026 pinned URL | As row 9 | One call | Operator: the URL `fetch` got equals `orv160-url` | None | C, fake `fetch` | `openrouter.ts` line 21, `export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";`, gets the URL `https://openrouter.ai/api/v1/completions` | 2 |
| 14 | LLM04:2026 another model refused | Fake `fetch` answers 200 with `model` `openai/gpt-6-luna`, then with MODEL plus `-20261001` | One call each | Operator: the first throws "OpenRouter answered with another model."; the second resolves (`orv160-answer-model`, today's form) | None | C, fake `fetch` | `openrouter.ts` lines 121 to 123 removed: the `if` that tests `body.model.startsWith(options.model)` and its `throw new Error("OpenRouter answered with another model.");` | 2 |
| 15 | LLM04:2026 no unsupported parameter | As row 9 | One call | Operator: the sent `provider` holds `orv160-flag-require-parameters` | None | C, fake `fetch` | `openrouter.ts` line 81, `require_parameters: true,`, becomes `require_parameters: false,` | 2 |
| 16 | LLM04:2026 no fallback | As row 9 | One call | Operator: the sent `provider` holds `orv160-flag-allow-fallbacks` | None | C, fake `fetch` | `openrouter.ts` line 82, `allow_fallbacks: false,`, becomes `allow_fallbacks: true,` | 2 |
| 19 | LLM06:2026 brief size | A fake model that answers a valid empty reading; a brief at `orv160-bound-brief` of Thai "ก", then one character over it | `interpretBrief` each | Operator: the first is `ok: true` and the fake was called once; the second is `invalid-brief` and the fake was not called | None | G, fake model | `interpreter.ts` line 19, `export const BRIEF_MAX_LENGTH = 2000;`, becomes `2001` | 2 |
| 20 | LLM06:2026 quote size | The brief `"x".repeat(201)`; a fake model answering `notUnderstood` with one quote at `orv160-bound-quote`, then one character over it | `interpretBrief` each | Operator: `ok: true`, then `adapter-failed` | None | G, fake model | `llm-interpreter.ts` line 31, `const quote = z.string().min(1).max(200);`, becomes `.max(201)` | 2 |
| 21 | LLM06:2026 finding count | The brief "fun, very fun"; a fake model answering personality findings quoting "fun" at `orv160-bound-findings`, then one more (worked example "Repeated quotes") | `interpretBrief` each | Operator: `ok: true`, then `adapter-failed` | None | G, fake model | `llm-interpreter.ts` line 72, `.max(40),`, becomes `.max(41),` | 2 |
| 22 | LLM06:2026 not-understood count | The brief "fun, very fun"; a fake model answering `notUnderstood` with "fun" at `orv160-bound-not-understood`, then one more | `interpretBrief` each | Operator: `ok: true`, then `adapter-failed` | None | G, fake model | `llm-interpreter.ts` line 73, `notUnderstood: z.array(quote).max(20),`, becomes `.max(21)` | 2 |
| 23 | LLM06:2026 output tokens | As row 9, then with `maxTokens: 500` | One call each | Operator: the sent `max_tokens` is `orv160-bound-max-tokens`, then 500 | None | C, fake `fetch` | `openrouter.ts` line 99: `options.maxTokens ?? 2000` becomes `options.maxTokens ?? 4000` | 2 |
| 24 | LLM06:2026 signal reaches fetch | As row 9 with `signal: () => marker` (a plain object), then without `signal` | One call each | Operator: `init.signal` is `marker`; then `init` has no `signal` key | None | C, fake `fetch` | `openrouter.ts` line 100, `...(options.signal ? { signal: options.signal() } : {}),`, removed | 2 |
| 29 | LLM08:2026 nothing secret in the prompt | `LLM_SYSTEM_PROMPT` | It is read | Operator: it holds no marker of `orv160-prompt-hygiene` | None | G, value check, one red sample per marker | `llm-interpreter.ts` line 113, the last prompt line `"If the brief reads two ways on one axis, give both findings. Do not choose between them.",`, is followed by a new line `"Key: sk-or-v1-0000",` | 2 |

## Rules and bounds

None of its own. Each rule has one home, the parent's "Rules and bounds"; this list points to it and restates no outcome, threshold or marker.

- Named by the rows: `orv160-request-envelope` (row 9), `orv160-flag-zdr` (row 10), `orv160-flag-data-collection` (row 11), `orv160-model-ids` (row 12), `orv160-url` (row 13), `orv160-answer-model` (row 14, today's form only; the slice 5 form is row 17's), `orv160-flag-require-parameters` (row 15), `orv160-flag-allow-fallbacks` (row 16), `orv160-bound-brief` (row 19), `orv160-bound-quote` (row 20), `orv160-bound-findings` (row 21), `orv160-bound-not-understood` (row 22), `orv160-bound-max-tokens` (row 23), `orv160-prompt-hygiene` (row 29).
- Named by the parent's "Acceptance criteria" opening paragraph, which these rows follow: `orv160-form` (the Test and form column) and `orv160-fallback` (rows 20, 21 and 22 end in `adapter-failed`).
- Named for this slice's review: `orv160-security-dispatch`.

## Worked examples

None of its own: this slice derives no number and adds no method. The rows and the rules above cite four of the parent's worked examples, by their parent titles: "The brief bound" (`orv160-bound-brief`, row 19), "Repeated quotes" (row 21, `orv160-bound-findings`), "The model check" (`orv160-answer-model`, row 14) and "The prompt check" (`orv160-prompt-hygiene`, row 29). The parent's "Worked examples" holds their commands and expected output; the main session runs them.

## Out of scope

- The parent's other 22 rows (1 to 8, 17, 18, 25 to 28 and 30 to 37), each in the slice its Slice column names.
- Any change outside test files: slice 2 is test-only (parent "Slices", item 2), and its fixtures live inline in `*.test.ts` files (`orv160-form`).
- Everything under the parent's "Out of scope".

## Open questions

None new. The parent's open questions and their defaults hold (parent "Open questions"); G2 passed on them.

## Depends on

The parent spec `docs/specs/ORV-160/spec.md` v1.2 and its "Depends on"; ORV-160 comment 10293 (G1 and G2); L-0016 (a slice issue gets its own spec).

## Changelog

- v1.0 (2026-10-30): slice spec for ORV-172, ORV-160 slice 2, from ORV-160 spec v1.2 (task ORV-172-spec-1). Rows 9 to 16, 19 to 24 and 29 copied with their numbers, columns and text unchanged, with the parent's file keys for G and C and the `MODEL` line; the rules and worked examples are pointers to the parent. No new requirement. Downstream to review: the ORV-172 Jira acceptance (these 15 rows) and the slice's first builder envelope (fact `test -f docs/specs/ORV-172/spec.md`, L-0016).
