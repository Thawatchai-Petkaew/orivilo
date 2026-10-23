---
id: K-0012
topic: enforcement
claim: Camp Vibes and Allkons both say in prose which skill each role must run, and neither has a hook or script that checks a skill was used.
source: "~/My Work/TechFlow/AI-First/allkons-marketplace/.claude/skills/atlas/SKILL.md:229-237; ~/Claude/Projects/CAMPVIBE/.claude/agents/orchestrator.md:64"
retrieved: 2026-10-23
confidence: 0.75
applies_to: [ORV-81]
license: internal
---

## Evidence

Allkons, the Atlas roles table:

```text
| agent | owns | runs skill(s) | template |
|---|---|---|---|
| `product-owner` | PRD | /write-prd | .claude/library/templates/prd.md |
...
| `ui-developer` | 03-frontend-spec §8-14 + mock TSX + tokens + Design System | /write-frontend-spec [,] /align-spec [,] /revise-mock [,] /ui-quality-gate [,] /ds | 03-frontend-spec.md (Part 2) |
```

Camp Vibes, the orchestrator workflow:

> 4. **Build** [-] after G2, spawn frontend/backend one atomic story at a time, then qa, then security, then run skill `quality-gate`.

## Why it matters for ORIVILO

This is an absence claim, so here is the sweep (case-insensitive search for "skill"):

- `~/Claude/Projects/CAMPVIBE/.claude/hooks/` and `scripts/`: no matches.
- `allkons-marketplace/.claude/hooks/*.py`: one comment naming a file path (`guard-deliverable-writes.py:8`), no check.
- `allkons-marketplace/.codex/hooks/`: one session-start message telling Codex to read the Atlas skill (`atlas_guard.py:74`), no check.
- `allkons-marketplace/.codex/scripts/`: 33 matches in `import_claude.py`, `validate_setup.py` and `probe_codex.py`. All of them import skills, compare skill lists or test that Codex finds them. None checks that a role ran its skill. `atlas_state.py`, which validates envelopes, has none.

Not searched: CI workflows and `lib/` outside `lib/delivery/` in Camp Vibes (`lib/delivery/` has no match). Per [[K-0001-prose-rules-vs-running-gates]], we should expect skipped skills until something checks them, for example a `skills_used` field in our report that QA compares with the role's required skills.
