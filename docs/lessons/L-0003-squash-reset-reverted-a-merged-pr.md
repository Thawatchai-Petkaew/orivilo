---
id: L-0003
date: 2026-10-23
issue: [ORV-77]
what_happened: The first push of ORV-77 (PR #64) was squashed with `git reset --soft origin/develop` after ORV-75 (#63) had merged, and the commit reverted ORV-75's files.
cause: A soft reset keeps the branch's old tree, so every file the newer develop changed shows up in our commit as a change back to the old content.
rule: Squash only after rebasing onto a fresh `origin/develop` (or use `git merge --squash` onto it), and before every push check that `git diff --stat origin/develop HEAD` lists only the story's files.
---

## What happened

ORV-75 (#63) merged into `develop` while ORV-77 was open. The ORV-77 branch was then squashed with `git reset --soft origin/develop` and one new commit. The working tree still held the files as they were before #63, so the first push of PR #64 undid ORV-75's changes: ADR 0012, AGENTS.md, the gate-packet skill, the lead and release agents, the handoff and the master plan.

It was caught before merge with `git diff --stat origin/develop HEAD`, fixed with one `--force-with-lease` push, and explained in a comment on PR #64. The merged squash was correct.

## Rule

- `git fetch`, then `git rebase origin/develop`, then squash. Never `reset --soft` onto a base that moved since the branch was cut.
- Before every push of a rewritten branch, run `git diff --stat origin/develop HEAD`. Any file outside the story's write set stops the push.
- The PR description lists the files changed; the reviewer compares that list with the diff.

Status: proposed (targets AGENTS.md, Git, and `.claude/agents/builder.md`)
