---
id: L-0027
date: 2026-10-26
issue: [ORV-20]
what_happened: Reviewer envelope ORV-20-review-1 sat bound for 1 hour 32 minutes with no heartbeat after its start, while the session dispatched and finished other tasks, until the owner closed it as abandoned.
cause: Nothing in the loop lists bound envelopes that have gone silent, so a lost subagent shows up only when someone remembers to wait for it.
rule: Before each dispatch and after any context compaction, the main session lists bound envelopes with no `result.json` and no `closed.json` whose agent has had no heartbeat for 20 minutes, and raises each one in the owner close form.
---

## What happened

ORV-20-review-1 bound to agent `accd7192ba834f654` at `2026-10-26T08:08:34Z`. The heartbeat log (`heartbeat.jsonl` in the records folder) has one line for that agent, its `SubagentStart`, and nothing after it. No tokens were recorded for the run (the metrics report shows reviewer `runs_without_tokens` 1). Between that start and the close, the heartbeat log has 9 other `SubagentStart` and 18 `SubagentStop` lines, so the session kept working.

The owner closed the envelope through the question form at `09:40:41Z` (`closed.json`: `reason` abandoned, `by` owner). The question put the stall down to a context compaction. ORV-20-review-2 started 25 seconds later. The envelope's candidate said "over two hours"; the records show 1 hour 32 minutes.

## Rule

- The main session runs a stall check before each Agent call and as the first step after a compaction or a resumed session. The check lists every task folder with `agent.json`, no `result.json`, no `closed.json`, and no heartbeat line for its `agent_id` in the last 20 minutes.
- Each listed envelope goes to the owner close form (`close-envelope.mjs --owner` flow) in the same turn. No other dispatch of that role happens until the owner answers.
- Until a script does the check, the main session lists those folders with a one-off `ls` and `jq`. A later builder task adds it as a `doctor.mjs stalled` command under its own Jira issue.
- Target: `.claude/skills/ovl/SKILL.md` (dispatch step and the abandoned-envelope section), later `scripts/ovl/doctor.mjs`.

Status: promoted 2026-10-26, into `.claude/skills/ovl/SKILL.md` (section 2, "Stall check before each dispatch", and section 4, the stuck-envelope paragraph); no hook enforces it. The `doctor.mjs stalled` command is not applied: it is a guard file and waits for a later builder issue
