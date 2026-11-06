---
id: L-0050
date: 2026-11-06
issue: [ORV-217]
what_happened: The main session edited `docs/specs/ORV-105/spec.md` AC 11 itself in commit `3584ead`, a file in no ORV-217 envelope's `write_set`, so merge-check refused the first merge of PR 182 and a verify-only product task ran after qa to bring the file into the `write_set` union.
cause: The POC mode bookkeeping bullet ("once before merge, or dropped") names no role and no `write_set`, and the spec revision envelope whose objective asked to record the ORV-105 AC 11 change listed only the ORV-217 spec, so the main session applied the cross-document line itself.
rule: In POC mode a cross-reference or bookkeeping edit runs in a role envelope whose `write_set` names every file it edits, a revision envelope whose objective changes another document's line, or records an impact on another document, lists that document in its `write_set`, and the main session edits only the files merge-check allows it.
---

## What happened

Records are under `.orivilo/runs/ORV-217/`; tokens are `tokens.total` from `.orivilo/metrics/ORV-217.json` (`node scripts/ovl/metrics.mjs report ORV-217`, saved as `.orivilo/metrics/orv-217-retro.md`).

- `ORV-217-spec-4` (product, 523,890 tokens) had `write_set` `docs/specs/ORV-217/spec.md` only. Its objective asked to "record that ORV-105 AC 11's order now has the transcript's own buttons between the transcript and the textarea, as an impact line". Its report listed two lines outside its `write_set` in `needs_decision`: `docs/specs/ORV-105/spec.md:129` (AC 11, new text "Tab reaches the transcript, its own buttons (jump and Copy), then the textarea") and `docs/specs/ORV-217/design.md:225`.
- Commit `3584ead` (2026-11-02T08:47:22Z, "docs(ORV-217): spec v1.3 for the builder deviations, ORV-105 AC 11 tab order") changed `docs/specs/ORV-217/spec.md`, `docs/specs/ORV-217/design.md` and `docs/specs/ORV-105/spec.md`. The main session applied both `needs_decision` lines in the same commit as the role's spec revision.
- `docs/specs/ORV-217/design.md` was in `ORV-217-design-1`'s `write_set`, so the union covered it. `docs/specs/ORV-105/spec.md` was in no bound ORV-217 envelope and is not on merge-check's main-session list (`.claude/skills/ovl/SKILL.md` section 6: `docs/context/handoff.md`, `docs/plans/*.md`, the issue's `jira-issue.md`, `DESIGN.md`), so merge-check refused the first merge of PR 182.
- `ORV-217-spec-105` (product, agent started 2026-11-02T11:24:43Z, after `ORV-217-qa-1`) had `write_set` `docs/specs/ORV-105/spec.md`, confirmed the line and changed nothing (`changed: []`): 128,904 tokens, 6 tool uses, one send-back. The merge then passed.
- The main-session edit skipped the product standard that a requirement change bumps the version and adds a changelog line (`.claude/agents/product.md`, Standards). `ORV-217-spec-105` reported both gaps in `needs_decision` (no changelog line for the AC 11 change; front matter `version: 1.4` while the changelog's last entry is v1.5). At `751f524` neither is fixed: `grep -n 'ORV-217' docs/specs/ORV-105/spec.md` finds only the AC 11 row.

[[L-0040-bookkeeping-follow-ups-one-role-at-a-time]] and [[L-0041-fix-left-stale-text-in-the-other-documents]] route such lines through a role envelope, but POC mode suspends both and replaces them with the bookkeeping bullet, which says when and not who. [[L-0006-main-session-worked-solo]] covers the main session building code; `write-guard` blocks it from `packages/` and `apps/`, not from `docs/specs/`.

## Rule

Proposed diff, for the owner to approve. No rule file is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, section POC mode, Rules (line 56):

```diff
-- Cross-reference and status bookkeeping: once before merge, or dropped.
+- Cross-reference and status bookkeeping: once before merge, or dropped. When it is done, a role does
+  it in an envelope whose `write_set` names every file it edits, so the role's own standards (version
+  and changelog line) apply; the main session edits only the files `merge-check` lets it (section 6).
+  A revision envelope whose objective changes another document's line, or records an impact on
+  another document, lists that document in its `write_set` (L-0050). No hook checks this before
+  the merge.
```

What proves it was done: in the next issue whose spec revision changes another issue's document, that document is in the revising envelope's `write_set`, merge-check's first run on the PR reports no `files outside the write_set union`, and no envelope with `changed: []` is bound only to cover a file already committed.

Expected effect, not a measured proposal (n=1, so no `## Expected saving`): one verify-only task (128,904 tokens here) and one refused merge per occurrence. Guard metric: merge-check refusals for files outside the `write_set` union stay at 0, and every AC change in another issue's spec comes with its changelog line.

Status: proposed
