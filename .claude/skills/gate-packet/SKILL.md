---
name: gate-packet
description: Raise a human gate (G1 Scope, G2 Design or Plan, G3 PR, G4 Staging sign-off, G5 Release) as a Jira comment and move the issue to its review status. Use whenever work reaches a gate.
---

# Gate packet

Post this as a comment on the Jira issue (Atlassian MCP `addOrEditJiraIssueComment`), then transition the issue to the matching review status and stop working on it.

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

| Gate             | Must include                                                 |
| ---------------- | ------------------------------------------------------------ |
| G1 Scope         | spec link, gap list summary, questions                       |
| G2 Design / Plan | spec + design/tech links, impact list                        |
| G3 PR            | PR link, preview URL, quality-gate output, reviewer findings |
| G4 Staging       | staging URL, acceptance criteria walk with evidence per row  |
| G5 Release       | fix version, changelog, migration notes, rollback plan       |

The owner decides by transitioning the issue. Never transition it to an approved status yourself.
