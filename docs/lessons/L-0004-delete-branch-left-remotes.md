---
id: L-0004
date: 2026-10-23
issue: [ORV-79]
what_happened: "`gh pr merge --squash --delete-branch` run from the main tree left the remote branches of 6 worktree PRs behind."
cause: Likely, not certain, gh deletes the remote branch only when it can delete the local branch from the current tree, and these branches were checked out in other worktrees; nothing checked the remote afterwards.
rule: After a merge, delete the remote branch, the worktree and the local branch as separate commands, then confirm with `git ls-remote --heads origin` that only main, develop and open PR branches remain.
---

## What happened

PRs #61 to #66 were merged with `gh pr merge --squash --delete-branch`, run from the main tree. Each branch was checked out in `.claude/worktrees/*`. gh printed `Deleted branch <name>` for the local branch only. When the D.2 batch was closed (ORV-79), `git branch -a` still listed six remote branches:

- `chore/ORV-73-migrate-path-and-local-setup`
- `chore/ORV-74-platform-mod-key`
- `docs/ORV-75-jira-states-by-environment`
- `feature/ORV-77-range-slider`
- `feature/ORV-78-menu-checkbox-radio`
- `docs/ORV-79-close-d2-batch`

`gh pr list --head <branch> --state merged` confirmed that each one had merged, and `git push origin --delete` removed them. AGENTS.md already says to delete merged branches and check `git branch -a`, but nothing checked that the remote deletion happened.

The cause above is our best reading of gh's behaviour, not something we confirmed.

## Rule

- After each merge: `git push origin --delete <branch>`, `git worktree remove <path>`, `git branch -D <branch>`.
- Then `git fetch --prune` and `git ls-remote --heads origin`. The release report lists the remote branches that remain and why each is still open.
- Do not rely on `--delete-branch` alone for a worktree branch.

Status: proposed (targets AGENTS.md, Git, and `.claude/agents/release.md`)
