# ORV-88 (Jira copy, 2026-10-24)

Summary: /ovl: block SendMessage resumes of subagents; every re-check is a fresh enveloped dispatch
Labels: epic-E0, lane-L, ops. Sprint: SCRUM Sprint 0 (id 2). Status: Backlog.

## Why

The owner decided on 2026-10-23, in the question form for ORV-87 Q7: "ห้าม resume ส่งงานใหม่ทุกครั้ง" (no resume; dispatch new work every time). The reason has two parts.

**A hole in the guard.** A resume goes through `SendMessage` with the agent id. `envelope-guard` only matches the Agent tool, so a resume runs with no envelope at all.

**The cost.** Resumes were the most expensive runs in the ORV-87 baseline. A resumed reviewer re-sends its whole earlier context, about 200k tokens for fewer than 10 tool uses (`docs/specs/ORV-87/baseline.md`).

## Scope

- A PreToolUse hook on `SendMessage` blocks a message to any subagent id recorded under `.orivilo/runs`, or to any agent this session started. Messages to other sessions or to `main` stay allowed if the spec needs them.
- The `ovl` skill says a re-check is a new envelope with a new `task_id`. Its `rework_of` names the earlier task, and the earlier report's file paths go into `context_pointers`.
- Tests: a resume is blocked with exit 2, and a fresh envelope passes.

## Lane

L, because it changes a guard file. G1 and G2 are covered by the owner's decision above and by ORV-81.

## Observed SendMessage tool_input (session transcripts, 2026-10-23)

```json
{ "to": "a4749f50857d699e3", "summary": "Re-review ORV-73 fixes", "message": "Please re-review ..." }
```

`to` is the subagent's agent_id, the same id the result-recorder writes to `.orivilo/runs/<ISSUE>/<task_id>/agent.json` (main checkout).
