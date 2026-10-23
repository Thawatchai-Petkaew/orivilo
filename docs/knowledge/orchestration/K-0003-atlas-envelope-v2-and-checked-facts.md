---
id: K-0003
topic: orchestration
claim: An Atlas dispatch is one JSON envelope with one objective (version 2 in the Codex port requires role, write set, report contract and model selection), and every fact carries a checked_by, which the require-checked-by hook enforces by blocking bare-string facts.
source: "~/My Work/TechFlow/AI-First/allkons-marketplace/.codex/references/runtime.md:67-70; .claude/skills/atlas/references/dispatch.md:11-27; .claude/hooks/require-checked-by.py:2-7"
retrieved: 2026-10-23
confidence: 0.8
applies_to: [ORV-81]
license: internal
---

## Evidence

`.codex/references/runtime.md`:

> Require objective, context pointers, boundaries, done criteria, role, write set,
> and report contract. New dispatches also require `envelope_version: 2` and a
> validated `model_selection`; ... Facts carry `checked_by`; unverified claims remain marked UNVERIFIED.

`.claude/hooks/require-checked-by.py`:

> Blocks (exit 2) only when it POSITIVELY finds a `facts` array whose entries are
> bare strings instead of objects carrying `checked_by`.

## Why it matters for ORIVILO

The fields of a v2 envelope, as saved in `.codex/runs/2026-10-03-rfq-0075-logo-multi-qt/author-envelope.json`: `envelope_version`, `task_id`, `objective`, `role`, `report_contract`, `context_pointers`, `boundaries`, `write_set`, `done_when`, `facts`, `model_selection`. A `checked_by` holds the command that was run or the word UNVERIFIED, so an unchecked claim cannot travel as truth. The hook is narrow: it lets through anything it cannot parse, and GAP-098 shows claims then move into the `objective`, which has no check.
