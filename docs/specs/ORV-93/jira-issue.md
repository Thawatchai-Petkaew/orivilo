# ORV-93 (Jira copy, 2026-10-24)

Summary: /ovl slice B: write-guard and the qa agent with its qa.v1 contract
Labels: epic-E0, lane-L, ops. Sprint: SCRUM Sprint 0 (id 2). Status: Backlog.

## Why

ORV-81 (spec `docs/specs/ORV-81/spec.md`, Rules and bounds, step 4) splits the AI team loop into slices. Slice B is next in the master plan (`docs/plans/master-plan.md`, Order step 1). Until it ships:

- nothing blocks the main session from writing a deliverable (`packages/`, `apps/`), a guard file (`.claude/hooks/`, `scripts/ovl/`, `.claude/settings.json`) or a record (`.orivilo/runs/`, `.quality-gate/`), so a session can still work solo or forge a `qa.json` (lesson L-0006);
- there is no `qa` agent to verify UI against the acceptance criteria, so G3 has only the reviewer.

The `ovl` skill's Honest limits list the holes this closes: `close-envelope --owner` and a hand-written `allow` line in `.orivilo/heartbeat.jsonl`.

## Scope

- `write-guard` (PreToolUse on Write, Edit, MultiEdit, NotebookEdit and Bash), as ORV-81 Hooks describes, with ORV-81 AC 25 to 32, 53 and 65.
- The `qa` agent (`.claude/agents/qa.md`) and the `qa.v1` contract wired into `result-recorder` and `envelope-guard`, as ORV-81 Roles and the `qa.v1` section describe.
- `ovl-doctor` probes `write-guard`; the `ovl` skill and its Honest limits are updated.
- Tests feed recorded stdin samples, as for the other hooks.

## Open points for the spec

- Which paths the main session still writes itself: `.orivilo/handoff.md`, `docs/` plan and handoff files, Jira-copy files under `docs/specs/`.
- How `metrics.mjs` and `doctor.mjs` (plain script runs that write under `.orivilo/`) stay allowed.

## Lane

L: it adds a guard file, changes `.claude/settings.json` and adds an agent and a report contract. Under ADR 0012 decision 4, Claude passes G1 and G2 during the POC on the owner's delegation.
