---
id: L-0023
date: 2026-10-26
issue: [ORV-109]
what_happened: None of the three ORV-109 research tasks ran its `done_when` (`pnpm check:knowledge`, `pnpm format:check`) or the report validator; one reported `blocked` for that reason alone, two reported `done` with the gap in `deviations`, and each task has one send-back recorded.
cause: The research agent file grants Read, Grep, Glob, Write, Edit, WebFetch and WebSearch and no shell, while every envelope must carry `done_when` commands and the research report contract tells the agent to run `node scripts/ovl/validate.mjs`, so the envelope asks for checks its role cannot run and no step says who runs them.
rule: The research role keeps no shell, because it reads untrusted web text; the main session runs a research envelope's `done_when` commands on the changed files right after the result is recorded and before any review dispatch, and passes their output to the reviewer envelope as facts, while the research agent reports `done` with static `verified` rows and names the unrun commands in `deviations`.
---

## What happened

Records: `.orivilo/runs/ORV-109/<task_id>/result.json` and `.orivilo/metrics/ORV-109.json`.

| task                                 | done_when                                   | result    | what the report says                                                                 | sent_back |
| ------------------------------------ | ------------------------------------------- | --------- | ------------------------------------------------------------------------------------ | --------- |
| `ORV-109-research-arch-1`            | `pnpm check:knowledge`                      | `done`    | `check:knowledge` and the validator not run, no shell tool; the parent must run both | 1         |
| `ORV-109-research-media-platforms-1` | `pnpm check:knowledge`, `pnpm format:check` | `blocked` | `blocked_on`: done_when not proven, no shell tool; the dispatcher must run them      | 1         |
| `ORV-109-research-fix-review-1`      | `pnpm check:knowledge`, `pnpm format:check` | `done`    | the three commands not run; the `verified` rows are static checks only               | 1         |

`.claude/agents/research.md` lists `tools: Read, Grep, Glob, Write, Edit, WebFetch, WebSearch` and its Report contract says "Check it with `node scripts/ovl/validate.mjs implementer.v1 <file>` before you send it". ORV-109 comment 10203 records the same gap. `sent_back` counts `SubagentStop` blocks from the result recorder (`scripts/ovl/metrics.mjs`); the records do not say why each run was sent back, so this lesson does not claim the missing shell caused them.

No `## Expected saving`: the tokens of a send-back are not split from the run in the records, so no saving is claimed and no re-check date is set. The rule fixes who runs the checks: a `blocked` result that only means "run my checks" stops the loop until the main session reads it.

Giving the role a shell is the other option. It is not proposed: the research agent fetches untrusted web text (AGENTS.md, Data access and security), and a shell would let injected text reach a command line.

## Rule

1. In `.claude/agents/research.md`, Report contract, replace the last sentence:

```diff
-... makes the report invalid, and it is sent back. Check it with `node scripts/ovl/validate.mjs implementer.v1 <file>` before you send it.
+... makes the report invalid, and it is sent back. You have no shell: do not report `blocked` only because a `done_when` command or the validator could not run. Report `done` with static `verified` rows (the fields you checked by reading) and name each unrun command in `deviations`; the main session runs them (L-0023).
```

2. In `.claude/skills/ovl/SKILL.md`, section 4, add a paragraph after the first one:

```diff
+A `research` result is followed by the main session running that envelope's `done_when` commands in the worktree, before any review is dispatched. A failing command goes back to `research` in a new envelope that names the output; a passing run goes into the reviewer envelope as one fact per command (`checked_by` the command itself) (L-0023).
```

What proves it was done: the next research tasks report `done` rather than `blocked` for unrun checks, and the reviewer envelope that follows has one fact per research `done_when` command.

Status: promoted 2026-10-26, into `.claude/agents/research.md` (Report contract) and `.claude/skills/ovl/SKILL.md` (section 4, second paragraph)
