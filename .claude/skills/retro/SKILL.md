---
name: retro
description: Distill reusable lessons from a finished issue into one lesson file each under docs/lessons/, with a ledger row in docs/LESSONS.md, and propose rule changes for the owner to approve. Use when the owner asks for a retro or an issue reaches Done with rework or rejected gates.
---

# Retro

1. Read durable sources only: the PR diff and review threads, the Jira issue and its comments (rejected gates are the richest signal), and `docs/specs/<KEY>/`.
2. Sort each finding. A mistake in our own work is a lesson (this skill). A fact learned from an outside source is a knowledge entry instead: write it under `docs/knowledge/` by the format in `docs/knowledge/README.md`, not here.
3. Search before you write: `docs/LESSONS.md` and `docs/lessons/`. If a lesson already covers the mistake, strengthen that file (add the new issue key to `issue`, add the facts) instead of adding a twin.
4. Write one file per new lesson at `docs/lessons/L-NNNN-<kebab-slug>.md`, in the format of `docs/lessons/README.md`: frontmatter `id`, `date`, `issue`, `what_happened`, `cause`, `rule`, then `## What happened` (checkable facts: Jira keys, PR numbers, files, commands) and `## Rule`, ending `Status: proposed`.
5. Next id: take the highest `L-NNNN` in `docs/lessons/` and add 1, four digits. Never reuse a number, even for a retired file.
6. The `rule` must change the process: a check, a step, a gate item or a command. "Be more careful" is not a rule.
7. Route the rule by scope and name the target: reusable and role-wide → a rule in `.claude/rules/`, an agent file, a skill or AGENTS.md; one-off → the lesson file and ledger only; product decision → `docs/context/`; architecture → a new ADR.
8. Append one ledger row per lesson to `docs/LESSONS.md`, status `proposed`. The Mistake cell ends with the path to the file, such as `(docs/lessons/L-0008-<slug>.md)`; Better rule and Target match the file. Add the lesson to the Index table in `docs/lessons/README.md`.
9. Show the owner the exact rule diff. Never edit a rule file in the retro. Only after the owner approves: apply the diff, set the ledger row and the file's `Status:` to `promoted`, and name the file the rule now lives in.
