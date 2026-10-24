---
id: L-0005
date: 2026-10-23
issue: [ORV-79]
what_happened: New Jira issues were not added to the active sprint, so 21 of them never showed on the board.
cause: Creating an issue and adding it to a sprint are two separate Jira actions, and our steps named only the first.
rule: Whoever creates a Jira issue adds it to the active sprint in the same step, and the main session compares the board count with a JQL count before each handoff.
---

## What happened

Issues created through the Atlassian MCP landed in the backlog with no sprint. The board shows the active sprint only, so 21 issues were invisible to the owner while work on them went on.

## Rule

- Creating an issue includes setting its sprint to the active sprint, unless the owner says it is backlog.
- Before a handoff, the main session runs `project = ORV AND sprint IS EMPTY AND statusCategory != Done` and either moves each result into the sprint or names it as backlog in the handoff.

Status: proposed (targets `.claude/skills/ovl/SKILL.md`)
