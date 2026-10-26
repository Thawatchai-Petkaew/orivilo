---
id: L-0020
date: 2026-10-26
issue: [ORV-109]
what_happened: PR 113 added 14 knowledge entries and its reviewed head `e57ac0d` left the `docs/knowledge/README.md` Index unchanged (review finding F3), so a fix task and a re-check followed.
cause: The survey envelope's `write_set` held only `docs/knowledge/architecture/K-*.md`, the main session dispatched the review without acting on the agent's `needs_decision` about the Index, commit `e57ac0d` also left out the 2 rows the second research task reported, and `pnpm check:knowledge` does not compare the Index with the folder.
rule: `pnpm check:knowledge` fails when an entry under `docs/knowledge/` has no row in the README Index, and until that check lands every research envelope that adds an entry lists `docs/knowledge/README.md` in its `write_set` and one `grep -q <K id> docs/knowledge/README.md` per new entry in `done_when`.
---

## What happened

Records: `.orivilo/runs/ORV-109/<task_id>/` and `.orivilo/metrics/ORV-109.json` (`node scripts/ovl/metrics.mjs report ORV-109`, saved as `.orivilo/metrics/ORV-109-knowledge.md`).

- `ORV-109-research-arch-1` wrote K-0016 to K-0027. Its `write_set` was `["docs/knowledge/architecture/K-*.md"]`. Its report says the Index was not updated because the README is outside the `write_set`, and asks in `needs_decision` who adds the 12 rows.
- `ORV-109-research-media-platforms-1` wrote K-0045 and K-0046. Its `write_set` included `docs/knowledge/README.md`, and its `changed` list reports 2 Index rows added.
- Commit `e57ac0d` (`git show --stat e57ac0d`) holds the 14 entry files and no README change. The same checkout also held ORV-126's K-0028 to K-0044, which add Index rows to the same README; that file is now in a rebase conflict (`git status`: `UU docs/knowledge/README.md`). The records do not say why the README was left out of the commit.
- `ORV-109-review-knowledge-1` returned `request_changes` with F3 (Important): the README says "Keep this table in step with the folder when you add an entry", and the Index still ended at K-0014.
- `scripts/check-knowledge.mjs` reads the README only for its license row; it never reads the Index.

Round 1 found F1, F2 and F3 (Important) and three Suggestions. The rework they caused, `ORV-109-research-fix-review-1` (986,928 tokens) and `ORV-109-review-knowledge-2` (271,540 tokens), used 1,258,468 tokens, 26.7% of the issue's 4,720,075. This sum is shared with [[L-0021-synthesis-contradicted-its-own-source]] and [[L-0022-press-figures-with-no-url-in-source]]; it is not split per finding.

## Rule

1. A check, by a builder story (the script is a guard file the main session cannot edit): `pnpm check:knowledge` reports every `docs/knowledge/<topic>/K-NNNN-*.md` whose file name has no row in the `## Index` table of `docs/knowledge/README.md`, with a test that fails on a fixture entry with no row.
2. Until that check is merged, in `.claude/skills/ovl/SKILL.md`, section 2, after the `write_set` bullet:

```diff
+- **A research envelope that adds a knowledge entry** lists `docs/knowledge/README.md` in its `write_set` and has one `done_when` entry `grep -q <K id> docs/knowledge/README.md` per new entry. A `needs_decision` or deviation about a file outside the `write_set` is answered by a new envelope before the review is dispatched (L-0020).
```

What proves it was done: the next knowledge PR's reviewed head shows a README diff with one Index row per new entry (`git diff --name-only origin/develop...<head> -- docs/knowledge/README.md`), and no review finding on a missing Index row.

Check after: 2026-11-09

Status: promoted 2026-10-26, part 2 only, into `.claude/skills/ovl/SKILL.md` (section 2, after the `write_set` bullet). Part 1 (the `pnpm check:knowledge` Index check in `scripts/check-knowledge.mjs`) is not applied: it is a guard file and waits for a builder story, a follow-up the main session files as its own Jira issue.
