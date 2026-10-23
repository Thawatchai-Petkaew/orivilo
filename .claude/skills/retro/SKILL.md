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

## Cost and flow step (after a slice or a batch)

Run when the `ovl` after-merge step dispatches an improvement task (spec: `docs/specs/ORV-87/spec.md`, "Improvement loop"). Run steps 1 to 9 above only for a mistake; this step is about numbers.

1. Read the metrics report named in your envelope and the list from `node scripts/ovl/metrics.mjs due`. Never read a transcript, and never copy text from one: a lesson quotes numbers and task ids only.
2. Propose a change only when you can back it with the report's numbers and the saving is not small. A kind (a role and a start, fresh or resumed) with fewer than 3 tasks in the report gets no proposal; say so in the `deviations` line of your report with its `n`. "No proposal this time" is a valid result: report `done` with `changed: []`.
3. For each proposal write a lesson file as in steps 4 to 8, plus `## Expected saving` after `## Rule`, by the format in `docs/lessons/README.md`. Count `tokens.total` or one of the four kinds, never `reported_total` or a notice figure. Give a `Guard metric:` that names what must not get worse, and `Evidence removed:` as `none` or the check, review or record removed (which touches a gate and needs an ADR amendment). `Baseline:` needs `n=` of 3 or more; `Check after:` is 14 days after promotion; the proposal writes a provisional date (14 days after the proposal) and the promotion envelope (step 9) sets it to the promotion date plus 14 days, with at least 5 comparable tasks, else the verdict is `not enough data`.
4. For each lesson that `due` lists, run its `Check:` command and add `## Measured after` with `Measured:`, `Guard metric:` and `Verdict:`. A verdict of `not met` comes with a new proposal to revert or change the rule.
5. Run `pnpm check:knowledge`. Your `write_set` is lesson paths only (`docs/lessons/L-*.md`, `docs/LESSONS.md`, `docs/lessons/README.md`); you never edit the rule file. The owner approves each proposal through the main session's question form (`Approve L-NNNN` or `Decline`); only then does step 9 apply, in a second envelope whose `write_set` is the rule file (named exactly), the exact lesson file and `docs/LESSONS.md`, which is where it sets `Status: promoted` and `Check after:`. A declined lesson stays `proposed` with a line that says the owner declined it and when.
