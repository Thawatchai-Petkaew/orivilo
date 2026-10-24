# ORV-95 (Jira copy, 2026-10-24)

Summary: /ovl slice C1: merge-guard blocks a merge without recorded qa, reviewer and checks
Labels: epic-E0, lane-L, ops. Sprint: SCRUM Sprint 0 (id 2). Status: Backlog.

## Why

ORV-81 splits the AI team loop into slices; B shipped as ORV-93 (qa agent and write-guard, PRs #84, #85). C1 is next (`docs/plans/master-plan.md` Order step 1). Until it ships, nothing blocks `gh pr merge`: a PR merges on the session's own say-so, and every G3 packet lists changed guard files for the owner by hand. ORV-87 row 25 also waits on it.

## Scope

- `merge-guard` as ORV-81 spec v1.5 Hooks describes: a `gh pr merge` into `develop` is blocked unless the issue's latest `qa.json` approves the PR head, a `reviewer.v1` approve exists on that head, every `gh pr checks` check passes (the owner's Vercel rate-limit waiver rule applies), and the gate report matches; a merge into `main` and a PR that changes guard files need the owner's terminal approval record. Checks run from the develop export, not the branch copy.
- `ovl-doctor` probes it; the `ovl` skill and its Honest limits are updated.
- Owner decision on record (ORV-81 open question 11): the owner merges the C1 PR by hand in the GitHub web UI after reading its G3 packet; the launcher has no fallback.

## Lane

L: a new guard and `.claude/settings.json`. G1 and G2 by Claude under the owner's POC delegation (ADR 0012 decision 4). Follow L-0010 (one deliverable per builder task) and L-0011 (spec revision before the fix).

## Owner decision, 2026-10-24 (question form)

Release of develop (PRs #83 to #87) to staging: "รอก่อน" (wait). The batch waits for the Vercel rate limit to clear and for C1 to join it.
