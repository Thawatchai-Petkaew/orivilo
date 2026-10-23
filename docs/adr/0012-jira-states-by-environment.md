# ADR 0012: Jira states by environment

- Status: accepted
- Date: 2026-10-23
- Decided by: GOLF (owner) in the working thread on 2026-10-23. The owner chose option A in the workflow map (https://claude.ai/artifact/Khs4wrv5biK9otWSyr8fuj): keep the Jira workflow, and give each status the meaning of the environment its work is in. ORV-75
- Builds on: ADR 0010 (environments and names), ADR 0011 (develop parks merged work). Neither is superseded.

## Context

Jira project ORV has 12 statuses, and its transitions are open from any status to any other. They were drawn before ADR 0011. Since then, merged work waits in `develop`, staging moves in batches, and production does not exist until ORV-63.

Three problems followed:

1. Work merged into `develop` had no status that said so.
2. Lane L and M issues skipped Discovery, G1, Design and G2 in Jira.
3. AGENTS.md and ADR 0011 disagreed on who passes G3.

## Decision

1. **Every status means one place the work is in.** No Jira admin change is needed.

   | Status          | Environment                                     | Enters when                                                          | Moved by                                 |
   | --------------- | ----------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------- |
   | Backlog         | Jira only                                       | The issue exists with acceptance criteria                            | Claude                                   |
   | Discovery       | Worktree                                        | The spec is being written (lanes M, L)                               | Claude                                   |
   | G1 Scope review | Worktree                                        | The spec and its open questions are posted as a G1 packet (lane L)   | Claude                                   |
   | Design          | Worktree                                        | G1 is approved (L), or design starts (M)                             | Claude, after the owner's G1 for L       |
   | G2 review       | Worktree                                        | Design, tech notes and impact list are posted as a G2 packet (M, L)  | Claude                                   |
   | Build           | Worktree, localhost                             | G2 is approved (M, L), or lane S starts                              | Claude, after the owner's G2 for M and L |
   | G3 PR review    | `develop`                                       | Full gate, reviewer and CI pass, and the PR is merged into `develop` | Claude                                   |
   | Staging         | `main` (staging)                                | The release PR that carries it is merged into `main`                 | Claude                                   |
   | G4 review       | `main` (staging)                                | Claude has walked the AC on staging with evidence (lane L)           | Claude                                   |
   | Release         | `v*` tag                                        | After ORV-63 only                                                    | Claude                                   |
   | G5 review       | `v*` tag                                        | After ORV-63 only                                                    | Claude                                   |
   | Done            | Staging during the POC; production after ORV-63 | The owner signs G5                                                   | Owner                                    |

2. **Who passes each gate.** This table is the one rule. AGENTS.md shows the same rule grouped by lane (G2 is called Plan for lane M).

   | Gate       | S    | M    | L   | Decided by                                       |
   | ---------- | ---- | ---- | --- | ------------------------------------------------ |
   | G1 Scope   | skip | skip | yes | The owner                                        |
   | G2 Design  | skip | yes  | yes | The owner                                        |
   | G3 PR      | yes  | yes  | yes | Claude: full gate, two reviewer passes, CI green |
   | G4 Staging | skip | skip | yes | Claude: the AC walked on staging, with evidence  |
   | G5 Release | yes  | yes  | yes | The owner only                                   |

   An owner's approval in the working thread counts. Claude records it in the gate packet with the words used and the date. Claude never moves an issue past a gate the owner decides, unless the owner said so.

3. **During the POC, G5 happens on staging.** The owner tests on staging or on `localhost` and moves an issue from Staging (or G4 review for lane L) to Done. Release, G5 review and a production Done start with ORV-63.

## Consequences

- Each issue's status shows where its code is. "G3 PR review" reads oddly for merged work. Option B, a status "In develop", is deferred to ORV-63, when the workflow changes anyway.
- Lane L and M issues take a few more Jira moves. In return, every gate has a dated record.
- AGENTS.md (rule 5 and the lane table), ADR 0011, `.claude/rules/design-system.md`, the `gate-packet` skill, the `lead` and `release` agents, `handoff.md` and the workflow map (https://claude.ai/artifact/Khs4wrv5biK9otWSyr8fuj) agree with this ADR.
