---
name: retro
description: Distill reusable lessons from a finished issue into docs/LESSONS.md and propose rule changes for the owner to approve. Use when the owner asks for a retro or an issue reaches Done with rework or rejected gates.
---

# Retro

1. Read durable sources only: the PR diff and review threads, the Jira issue and its comments (rejected gates are the richest signal), and `docs/specs/<KEY>/`.
2. For each lesson write: mistake → better rule, with the issue key as the reason.
3. Route by scope: reusable and role-wide → a rule in `.claude/rules/` or an agent file; one-off → ledger only; product decision → `docs/context/`; architecture → a new ADR.
4. Search `docs/LESSONS.md` first. Strengthen an existing row instead of adding a twin.
5. Append rows as `proposed`. Show the owner the exact rule diff. Edit rule files only after approval, then mark the row `promoted`.
