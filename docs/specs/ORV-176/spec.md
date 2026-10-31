---
issue: ORV-176 (https://tpetkaew.atlassian.net/browse/ORV-176)
parent: ORV-160 (slice 5, "Client hardening")
lane: L, inherited from ORV-160
version: 1.0
---

# ORV-176: ORV-160 slice 5, the client hardening

## Why

ORV-176 is slice 5 of ORV-160, the guardrail test set from the OWASP LLM Top 10 2026 for the interpreter path. The parent's "Slices" list, item 5, names it "Client hardening" (source change, tech notes first, full review set), with rows 17 and 26: `orv160-bound-response` (the byte count while reading, and the cost a refused body records) and the slice 5 form of `orv160-answer-model`. C, created by PR 141, is extended. This slice makes the OpenRouter client refuse an answer body larger than the response bound and an answer from a model id the pinned id only starts with, and pins both so that a change to either fails `pnpm test`.

This file is the slice spec of L-0016: a slice issue gets its own spec. It adds no requirement and no gate of its own. The business intent, the story, the frame and the set structure are the parent's ("Why", "Story", "The set this covers").

**Source change, tech notes next.** Unlike slices 2 to 4, this slice changes source, not only tests: `packages/intent-engine/src/openrouter.ts` and the contract the parent's "Impact list" names under "Contract change, slice 5 only" (`FetchLike`, the model check, the cost a refused body records, and their consumers). The parent's "Lane" says tech notes are written before slice 5, the one slice that changes a contract. They are `docs/specs/ORV-176/tech.md`, written next by the architect, before any builder envelope (open question 1 below on where they live).

**Frame.** Not a guard spec. The four guard-rail parts the parent's "Frame" names (`orv160-titles`, `orv160-network-block`, `orv160-recorder-output`, `orv160-recorder-key`) are in slices 3 and 7, not here.

**What is real.** Both rows run on a fake `fetch` with a hand-written answer (`orv160-form`); no row calls a model or the network. A row proves that the client holds the bound and the model check, not that OpenRouter or the model ever sends such an answer. The response bound is the parent's proposed figure, which rests on an assumed bytes-per-token ceiling (parent open question 9, worked example "The response bound"); the dated suffix form of the model check is an assumption until a recorded answer shows it (parent open question 10). The parent's "What is real" paragraph holds.

## Parent spec and gates

- Parent spec: `docs/specs/ORV-160/spec.md` v1.2 (changelog line "v1.2 (2026-10-30)").
- G1 and G2: ORV-160 comment 10293, passed under the owner's delegation in POC mode (ADR 0012 decision 4, parent "Lane"). ORV-176 inherits both; no new gate decision is needed for this slice.
- Decisions: the parent's "Depends on".
- Review: the full review set (parent "Slices", item 5); `security` runs on this slice's PR as `orv160-security-dispatch` says.

## Acceptance criteria

Rows 17 and 26 of the parent spec, copied with their numbers, their columns and their text unchanged. The conventions for the Red when column, the exact outcomes and a refusal that reaches a person are the parent's "Acceptance criteria" opening paragraph. File key for this slice: **C** `packages/intent-engine/src/openrouter.test.ts` (created by PR 141, extended here). `MODEL` is `AI_MODELS.interpret`. The parent's other file keys (G, A, W, R, P) belong to other slices.

<!-- prettier-ignore -->
| # | Entry | Given | When | Who sees what | Data effect | Test and form | Red when | Slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 17 | LLM04:2026 exact model | Fake `fetch` answers 200 with `model` MODEL plus `-evil`, then MODEL plus `-20261001` | One call each | Operator: the first throws "OpenRouter answered with another model."; the second resolves (`orv160-answer-model`, slice 5 form) | None | C, fake `fetch` | The slice 5 model check (today's `openrouter.ts` line 121) back to `!body.model.startsWith(options.model)` | 5 |
| 26 | LLM06:2026 response size | A fake `fetch` whose 200 body arrives in chunks with no `Content-Length`, one byte over `orv160-bound-response`; then one whose `Content-Length` says 100 while its body is one byte over; then one at the bound | One call each | Operator: the first two throw once the bytes read pass the bound, before the body is parsed, and `onCall` gets `costMicroUsd` null; the third resolves. Person: a refused one reaches them as `orv160-fallback` | None | C, fake `fetch` | (1) The slice 5 size check removed. (2) The size check reads only `Content-Length` (the chunked body resolves) | 5 |

## Rules and bounds

None of its own. Each rule has one home, the parent's "Rules and bounds"; this list points to it and restates no outcome, threshold or form.

- Named by the rows: `orv160-answer-model` (row 17, the slice 5 form only; today's form is row 14's, slice 2) and `orv160-bound-response` (row 26).
- Named by the parent's "Acceptance criteria" opening paragraph and by row 26, which these rows follow: `orv160-form` (the Test and form column) and `orv160-fallback` (row 26's Person cell).
- Named by `orv160-bound-response` for a refused body's cost: `orv160-wallet-gap`. This slice does not close it (see "Out of scope").
- Named for this slice's review: `orv160-security-dispatch`.

## Worked examples

None of its own: this slice derives no number and adds no method. The rows and the rules above cite two of the parent's worked examples, by their parent titles: "The model check" (`orv160-answer-model`, row 17) and "The response bound" (`orv160-bound-response`, row 26). The parent's "Worked examples" holds their commands and expected output; the main session runs them.

## Out of scope

- The parent's other 35 rows (1 to 16, 18 to 25 and 27 to 37), each in the slice its Slice column names.
- Closing `orv160-wallet-gap`: follow-up issue ORV-171 (parent "Out of scope").
- Stripping invisible characters from a brief, recording real answers, and the docs of slice 8 (parent "Slices", items 7 and 8, and parent open question 11).
- Everything under the parent's "Out of scope".

## Open questions

The parent's open questions and their defaults hold (parent "Open questions"); G2 passed on them. Questions 9 (the response bound) and 10 (the model check form) are the two this slice builds on. One question on where a document lives, not a requirement:

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | Where do the slice 5 tech notes live? | (a) `docs/specs/ORV-176/tech.md`, as the task that wrote this file names; (b) `docs/specs/ORV-160/tech.md`, as the parent's "Impact list" ("Contract change, slice 5 only") names | (a) leaves the parent's pointer stale until a parent changelog line updates it; (b) keeps the parent's pointer and puts a slice's notes under its parent's key | (a) |

## Depends on

The parent spec `docs/specs/ORV-160/spec.md` v1.2 and its "Depends on"; ORV-160 comment 10293 (G1 and G2); L-0016 (a slice issue gets its own spec); the tech notes `docs/specs/ORV-176/tech.md` (to be written, before code).

## Changelog

- v1.0 (2026-10-30): slice spec for ORV-176, ORV-160 slice 5, from ORV-160 spec v1.2 (task ORV-176-spec-1). Rows 17 and 26 copied with their numbers, columns and text unchanged, with the parent's file key for C and the `MODEL` line; the rules and worked examples are pointers to the parent. No new requirement. Downstream to review: the ORV-176 Jira acceptance (these 2 rows), the tech notes `docs/specs/ORV-176/tech.md` (written next by the architect), the slice's first builder envelope (fact `test -f docs/specs/ORV-176/spec.md`, L-0016), and the parent's "Impact list" pointer to `docs/specs/ORV-160/tech.md` (open question 1).
