# ORV-87 baseline: subagent use on 2026-10-23

> **Correction, 2026-10-24.** The `subagent_tokens` value in a completion notice is the size of the run's **last** model call: input, cache write, cache read and output of that one call. It is not the total over the run. The collector builder showed this on a sample: the notice said 22,745 = 2 + 557 + 20,954 + 1,232, and the sum over all calls was 91,194 (`docs/specs/ORV-87/samples.md`). So every token figure below is the final context size of a run, not the tokens it used. A resumed run's larger final context is still real, because each later call pays for it, but these figures cannot rank total cost. `scripts/ovl/metrics.mjs collect` counts per call and replaces them.

Measured by the orchestrator from the agent completion notices in session `0baff5a3-4a6a-4d70-99db-b6b7a526f04f`. Each notice carries `subagent_tokens`, `tool_uses` and `duration_ms` for one run. Runs were grouped by words in the run description, so the groups are approximate.

## Totals

- 76 subagent runs
- 5,355,001 tokens
- About 4.7 hours of agent time

## By kind of run

| Kind      | Runs | Tokens    | Tool uses | Minutes |
| --------- | ---- | --------- | --------- | ------- |
| review    | 35   | 2,745,228 | 334       | 83      |
| spec      | 9    | 747,438   | 253       | 39      |
| knowledge | 5    | 673,487   | 300       | 26      |
| other     | 9    | 374,981   | 104       | 13      |
| rework    | 8    | 319,327   | 69        | 16      |
| qa        | 1    | 144,301   | 49        | 8       |
| build     | 1    | 133,210   | 27        | 8       |
| ship      | 4    | 89,040    | 36        | 83      |
| adr       | 1    | 51,376    | 23        | 2       |
| retro     | 2    | 46,137    | 14        | 1       |
| stdin     | 1    | 30,476    | 11        | 2       |

## Largest single runs

| Run                                       | Tokens  | Tool uses | Seconds |
| ----------------------------------------- | ------- | --------- | ------- |
| Review ORV-85 slice A2 (third pass)       | 211,661 | 7         | 242     |
| ORV-82 knowledge README and seed entries  | 206,235 | 44        | 161     |
| Review ORV-85 slice A2 (second pass)      | 197,719 | 15        | 372     |
| Review ORV-81 spec and ADR 0013 (resumed) | 174,819 | 4         | 59      |
| ORV-82 knowledge README and seed entries  | 171,759 | 105       | 499     |

## What this suggests, to be tested by the collector

- Reviews take about half of all tokens.
- A resumed agent re-sends its whole earlier context. Some later review passes used about 200k tokens for fewer than 10 tool uses. A fresh reviewer with a narrow envelope may cost less for a re-check, but this is not yet measured.
- Shipping is dominated by waiting for CI, not by tokens.
- The orchestrator's own tokens are not in these numbers. Only the subagents' are.
