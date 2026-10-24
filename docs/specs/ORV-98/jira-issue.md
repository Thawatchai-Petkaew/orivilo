# ORV-98 (Jira copy, 2026-10-24)

Summary: /ovl slice C2: g3-check guards the Jira move to G3 PR review; jira-transitions.json
Labels: epic-E0, lane-L, ops. Sprint: SCRUM Sprint 0 (id 2). Status: Backlog.

## Why

ORV-81 slice C2 (spec `docs/specs/ORV-81/spec.md` delivery slice 6, AC 45 and 46, Hooks `g3-check`). C1 shipped as ORV-95 (PR #88). Today nothing checks a Jira move to "G3 PR review": a session can move an issue there without the merge and evidence behind it, and an unknown transition id goes through.

## Scope

- `g3-check` (PreToolUse on the Atlassian MCP `transitionJiraIssue` and `executeWrite` tools) blocks a move to G3 PR review unless the issue's PR is merged into `develop` and its G3 evidence holds (the merge-check records), and blocks a transition id not listed in `jira-transitions.json` (fail closed). Checks run from the develop export, like merge-guard.
- `jira-transitions.json` lists this project's transition ids by name.
- Doctor probe; `ovl` skill text.
- It is a guard rail for rule-following agents, as merge-guard is (ORV-95 comment 10109).

## Lane

L. G1 and G2 by Claude under the owner's delegation (ORV-95 comment 10102). Follow L-0010 and L-0011.

## Transition ids (read 2026-10-24 with listJiraIssueTransitions on ORV-93)

| id  | name           | to              |
| --- | -------------- | --------------- |
| 2   | G2 review      | G2 review       |
| 3   | Build          | Build           |
| 4   | G3 PR review   | G3 PR review    |
| 5   | Staging        | Staging         |
| 6   | G4 review      | G4 review       |
| 7   | Release        | Release         |
| 8   | G5 review      | G5 review       |
| 9   | Done           | Done            |
| 10  | Design         | Design          |
| 11  | To Do          | Backlog         |
| 21  | In Progress    | Discovery       |
| 31  | In Review      | G1 Scope review |
