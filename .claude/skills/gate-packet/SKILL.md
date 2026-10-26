---
name: gate-packet
description: Post a gate packet (G1 Scope, G2 Design or Plan, G3 PR, G4 Staging, G5 Release) as a Jira comment and move the issue to its status (ADR 0012). The owner decides G1, G2 and G5; Claude passes G3 and G4 with evidence. Use whenever work reaches a gate.
---

# Gate packet

Post this as a comment on the Jira issue (Atlassian MCP `addOrEditJiraIssueComment`), then move the issue as the table below says (ADR 0012). For a gate the owner decides, stop working on the issue until the owner approves. An approval given in the working thread counts: quote the words and the date in the packet, then move on.

| Gate                    | Post when                                                                            | Move the issue to          | Who decides |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------- | ----------- |
| G1 Scope (L)            | The spec and its questions are ready                                                 | G1 Scope review            | Owner       |
| G2 Design / Plan (M, L) | Design, tech notes and impact list are ready                                         | G2 review                  | Owner       |
| G3 PR (all)             | Full gate, two reviewer passes and CI are green, and the PR is merged into `develop` | G3 PR review               | Claude      |
| G4 Staging (L)          | Its batch is on staging and Claude has walked the AC there                           | G4 review                  | Claude      |
| G5 Release (all)        | During the POC: the batch is on staging. After ORV-63: the release is prepared       | Staging (POC) or G5 review | Owner only  |

```markdown
**<Gate> for <KEY>: <one-line summary>**

Lane: S | M | L
Artifacts: <spec / design / PR / preview URL / staging URL / changelog>
Checks: <real command output summary, or "not run" with reason>
Impact: <contracts, components, screens touched; "none">
Findings: <Critical / Important open items; "none">
Questions: <each with options and the default we use if no answer>
Next if approved: <what happens>
Next if changes requested: <who reworks what>
```

What each gate must contain:

| Gate             | Must include                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1 Scope         | spec link, gap list summary, questions; for lane L the spec review's task id and its open Important findings, each beside the question it touches (L-0037). No hook checks this |
| G2 Design / Plan | spec + design/tech links, impact list                                                                                                                                           |
| G3 PR            | PR link, quality-gate output, reviewer findings (both passes); a preview URL only if a commit asked for `[preview]`                                                             |
| G4 Staging       | staging URL, acceptance criteria walk with evidence per row                                                                                                                     |
| G5 Release       | fix version, changelog, migration notes, rollback plan                                                                                                                          |

The owner decides by moving the issue on (or by saying so in the thread). Never move past a gate the owner decides on your own, and never move an issue to Done.
