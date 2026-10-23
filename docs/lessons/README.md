# Lessons

What went wrong in our own work, why, and the rule that changes the process so it does not happen again. One lesson per file. Knowledge (`docs/knowledge/`) is what we learned from outside sources; a lesson is what we learned from our own mistakes.

## Where lessons live

```text
docs/lessons/L-NNNN-<kebab-slug>.md
```

`L-NNNN` is four digits, taken in order, never reused.

## Format

```markdown
---
id: L-0001
date: 2026-10-23
issue: [ORV-72, ORV-80]
what_happened: One sentence, the visible failure.
cause: One sentence, why it happened, not what happened.
rule: One sentence that says what changes in the process.
---

## What happened

The facts, with Jira keys, PR numbers, files or commands, so a reader can check them.

## Rule

The rule in full: who does what, when, and what proves it was done.

Status: proposed
```

- `issue` lists the Jira keys the lesson came from.
- `rule` must change the process: a check, a step, a gate item or a command. "Be more careful" is not a rule.
- Status is `proposed` until the owner approves the change in the rule file it targets (`.claude/rules/`, an agent file, a skill or AGENTS.md); then it becomes `promoted`, with the file named. This is the same flow as the `retro` skill.
- Link related knowledge or lessons with wikilinks, such as `[[K-0005-proof-must-match-the-claim]]`. No Dataview queries (see `docs/knowledge/README.md`, Reading in Obsidian).

## Relation to `docs/LESSONS.md`

`docs/LESSONS.md` is the ledger. For each lesson the `retro` skill writes three things: the `L-NNNN` file in this folder, one row in the ledger that points at the file, and one row in the Index below. The ledger row and the file's `Status:` line carry the same status.

## Index

| Lesson                                       | Issue          | Rule in short                                                      |
| -------------------------------------------- | -------------- | ------------------------------------------------------------------ |
| [[L-0001-g3-passed-visual-defects]]          | ORV-72, ORV-80 | A UI PR shows the render; the reviewer looks at it before G3       |
| [[L-0002-a-test-that-cannot-fail]]           | ORV-78         | A new guard test is seen to fail once before it counts             |
| [[L-0003-squash-reset-reverted-a-merged-pr]] | ORV-77         | No `reset --soft` onto a moved base; the diff lists only our files |
| [[L-0004-delete-branch-left-remotes]]        | ORV-79         | Delete the remote branch by hand and check `ls-remote`             |
| [[L-0005-issues-missing-from-the-sprint]]    | ORV-79         | A new issue joins the active sprint in the same step               |
| [[L-0006-main-session-worked-solo]]          | ORV-81         | Role agents build; a QA agent that did not build accepts           |
| [[L-0007-turbo-cache-hid-skipped-tests]]     | ORV-13         | Test runs for a handoff use `--force`                              |
