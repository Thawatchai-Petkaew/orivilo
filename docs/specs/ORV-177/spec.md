---
issue: ORV-177 (https://tpetkaew.atlassian.net/browse/ORV-177)
parent: ORV-160 (slice 7a, the first part of slice 7, "Network block and recordings")
lane: L, inherited from ORV-160
version: 1.0
---

# ORV-177: ORV-160 slice 7a, the network block and the recorder

## Why

ORV-177 is slice 7a of ORV-160, the guardrail test set from the OWASP LLM Top 10 2026 for the interpreter path. The parent's "Slices" list, item 7, names slice 7 "Network block and recordings" (config and a script, full review set), with rows 34 to 37, and names a recorder run under `orv160-recorder-run` as its G4 evidence. Slice 7 is split in two because row 35, the recorded replay, needs the fixture file that only a recorder run writes, and that run waits for the owner's confirmation before it starts (`orv160-recorder-run`). Row 35 and the run are ORV-178. This slice, ORV-177, holds the three rows that need no run: row 34 (the network block in the engine and in `apps/web`), and rows 36 and 37 (the recorder script and its test, without a key and with a fake key).

This file is the slice spec of L-0016: a slice issue gets its own spec. It adds no requirement and no gate of its own. The business intent, the story, the frame and the set structure are the parent's ("Why", "Story", "The set this covers").

**This slice makes no model call.** Rows 36 and 37 call the recorder's exported `record` with a spy `fetch` or a fake `fetch` (`orv160-form`), and row 34 asserts that an unstubbed `fetch` is refused. The recorder script is written and tested here, never run with a key: the run, its cost and the fixture file it writes are ORV-178.

**Frame.** Not a hook that judges a tool call's text. Three of the four guard-rail parts the parent's "Frame" names are built here, in part or whole: `orv160-network-block` (row 34); `orv160-recorder-key`, as far as row 37 checks that a key in `env` reaches neither the fixture file nor a written line (the route of a real key into a run is ORV-178's); and `orv160-recorder-output`, as far as the script writes its own fixture file (R's check that its source holds no recording is row 35, ORV-178). Their frame is the parent's "Frame" sentences for them: guard rails for agents that follow the rules, not boundaries. What enforces "tests never call a model" outside the session is named there too (CI sets no OpenRouter key, turbo passes none to the test task).

**What is real.** Row 34 proves that the setup files refuse an unstubbed `fetch` in tests, not that no other route reaches the network. Rows 36 and 37 prove the script's behaviour against a spy and a fake `fetch` with hand-written answers; they say nothing about what the pinned model answers. The parent's "What is real" paragraph holds.

## Parent spec and gates

- Parent spec: `docs/specs/ORV-160/spec.md` v1.2 (changelog line "v1.2 (2026-10-30)").
- G1 and G2: ORV-160 comment 10293, passed under the owner's delegation in POC mode (ADR 0012 decision 4, parent "Lane"). ORV-177 inherits both; no new gate decision is needed for this slice.
- Decisions: the parent's "Depends on".
- Review: the full review set (parent "Slices", item 7); `security` runs on this slice's PR as `orv160-security-dispatch` says.
- G4: the recorder run the parent's "Slices" item 7 names as the G4 evidence is ORV-178's, not this slice's (open question 1).

## Acceptance criteria

Rows 34, 36 and 37 of the parent spec, copied with their numbers, their columns and their text unchanged. The conventions for the Red when column and the exact outcomes are the parent's "Acceptance criteria" opening paragraph. File keys for this slice, from the parent: **G** `packages/intent-engine/src/llm-guardrails.test.ts` (new); **W** `apps/web/app/directions/ai-reading.test.tsx` (new); **P** `scripts/openrouter-interpret-record.test.mjs` (new). G and W already exist on `develop` (slice 2, ORV-172, PR 156, created G; slice 4, ORV-173, PR 157, created W), so this slice extends them; P is new here. `MODEL` is `AI_MODELS.interpret`. The parent's other file keys (C, A, R) belong to other slices; R is row 35's, ORV-178.

<!-- prettier-ignore -->
| # | Entry | Given | When | Who sees what | Data effect | Test and form | Red when | Slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 34 | Network block | A test in the engine and one in `apps/web` that call `fetch(OPENROUTER_URL)` with no stub | The call runs | Operator: each rejects with the message of `orv160-network-block` | No request leaves | G and W, the setup files of `orv160-network-block` | (1) The `setupFiles` entry removed from `packages/intent-engine/vitest.config.ts` (the engine test goes red). (2) The `setupFiles` entry removed from `apps/web/vitest.config.ts` (the `apps/web` test goes red) | 7 |
| 36 | The recorder without a key | The recorder's exported `record` (`orv160-recordings`) | P imports `record` and calls it with `env` `{}`, a spy `fetch`, a temporary fixture path and a line writer | Operator: it returns exit code 1, the writer got exactly one line "OPENROUTER_API_KEY is not set; no call made.", the spy was not called and no file was written | No request leaves | P, `node --test` through `pnpm test:scripts` | The key check removed | 7 |
| 37 | The recorder with a key | `record` with `env` holding `OPENROUTER_API_KEY` `sk-or-v1-test-0000` and a fake `fetch` answering 200 with `model` MODEL and a valid reading for each case | P calls `record`; then again with the fake answering 500 to the first case | Operator: 9 calls, one per case of row 35; the fixture file and every line the writer got hold neither `sk-or-v1-test-0000` nor `Bearer`. On the second run: still 9 calls, and the first case's recorded outcome is `adapter-failed` | The fixture file at the temporary path | P, `node --test` through `pnpm test:scripts` | (1) Each recorded entry gains `key: env.OPENROUTER_API_KEY`. (2) A failed call is retried once | 7 |

Reading notes, no new requirement:

- Row 34's "each" is the two tests its Given names: the one in the engine (G) and the one in `apps/web` (W).
- Row 37's "the case of row 35" and "9 calls": row 35 itself is ORV-178's, and its cases are the briefs of parent rows 1, 2, 3, 4, 5, 18, 27, 30 and 31 (parent row 35's Given, and the parent's worked example "The run cost"). Since row 37 counts 9 calls, the script holds those case briefs from this slice on.
- Row 37's fixture file is the one at the temporary path P passes. `packages/intent-engine/src/llm-recorded.json` is written only by the run, ORV-178.

## Rules and bounds

None of its own. Each rule has one home, the parent's "Rules and bounds"; this list points to it and restates no outcome, threshold or form.

- Named by row 34: `orv160-network-block`.
- Named by rows 36 and 37 and by slice 7's builder envelope (parent "Slices", item 7): `orv160-recordings`, `orv160-recorder-output` and `orv160-recorder-key`. The builder envelope of this slice states `orv160-recorder-output` and `orv160-recorder-key`, as item 7 asks.
- Named by the parent for the run, which is ORV-178's: `orv160-recorder-run`. This slice starts no run, so no confirmation is asked here.
- Named by the parent's "Acceptance criteria" opening paragraph, which these rows follow: `orv160-form` (the Test and form column).
- Named for this slice's review: `orv160-security-dispatch`.

## Worked examples

None of its own: this slice derives no number and adds no method. Row 37's "9 calls" is the case count of the parent's worked example "The run cost" (`orv160-recordings`), whose command prints the count and the run's estimated cost; the parent's "Worked examples" holds the command and expected output, and the main session runs it. This slice spends nothing on a model: the cost that example estimates is ORV-178's.

## Out of scope

- The parent's other 34 rows (1 to 33 and 35), each in the slice its Slice column names; row 35 is ORV-178.
- A recorder run with a real key, its owner confirmation (`orv160-recorder-run`), its cost and the fixture file `packages/intent-engine/src/llm-recorded.json` it writes: ORV-178.
- R (`packages/intent-engine/src/llm-recorded.test.ts`): ORV-178, with row 35.
- Closing `orv160-wallet-gap`: follow-up issue ORV-171 (parent "Out of scope").
- The docs of slice 8 (parent "Slices", item 8).
- Everything under the parent's "Out of scope".

## Open questions

The parent's open questions and their defaults hold (parent "Open questions"); G2 passed on them. Question 6 (where the network block lives) and question 7 (who runs the recorder, decided in ORV-160 comment 10293) are the two this slice touches; question 7's run is ORV-178's. One question on gate evidence, not a requirement:

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | What is ORV-177's G4 evidence, now that the recorder run the parent's "Slices" item 7 names is ORV-178? | (a) the lane L G4 evidence of ADR 0012 for this slice's change (the merged head on staging with its checks green), with the recorder run as ORV-178's G4 evidence; (b) ORV-177 waits at G4 until ORV-178's run | (a) passes the network block and the script on their own evidence and leaves the parent's item 7 text stale until a parent changelog line records the split; (b) holds a change that needs no run behind a run that needs the owner | (a) |

## Depends on

The parent spec `docs/specs/ORV-160/spec.md` v1.2 and its "Depends on"; ORV-160 comment 10293 (G1 and G2, and open question 7, written as `orv160-recorder-run`); ORV-172 and PR 156 (slice 2, which created G); ORV-173 and PR 157 (slice 4, which created W); ORV-178 (row 35 and the recorder run); L-0016 (a slice issue gets its own spec).

## Changelog

- v1.0 (2026-10-30): slice spec for ORV-177, ORV-160 slice 7a, from ORV-160 spec v1.2 (task ORV-177-spec-1). Rows 34, 36 and 37 copied with their numbers, columns and text unchanged, with the parent's file keys for G, W and P and the `MODEL` line; the rules and the worked example are pointers to the parent. Row 35 and the recorder run are ORV-178. No new requirement. Downstream to review: the ORV-177 Jira acceptance (these 3 rows), the ORV-178 spec (row 35, the run, R and the fixture file), the slice's first builder envelope (fact `test -f docs/specs/ORV-177/spec.md`, L-0016, and the statement of `orv160-recorder-output` and `orv160-recorder-key`), and the parent's "Slices" item 7, which still lists rows 34 to 37 and the run as one slice's G4 evidence (open question 1).
