---
id: K-0001
topic: enforcement
claim: In Allkons, rules written as prose caught 0 of 83 recorded gaps, while gates that actually ran caught 7 of 7.
source: "~/My Work/TechFlow/AI-First/allkons-marketplace/.claude/hooks/require-checked-by.py:13 (also .claude/skills/atlas/references/tiered-routing.md §5)"
retrieved: 2026-10-23
confidence: 0.65
applies_to: [ORV-81, ORV-82]
license: internal
---

## Evidence

From the hook's docstring:

> Origin: GAP-072 / 073 / 081. Prose caught 0 of 83 gaps; running gates caught 7 of 7.

From `tiered-routing.md` §5:

> Rules that must always hold go into hooks or scripts, not prose; CLAUDE.md is "advisory" [§2.8].

## Why it matters for ORIVILO

A rule that must always hold should be a hook, a script or a test, not a line in AGENTS.md. The direction is well supported (see [[K-0008-hooks-fail-silently-without-a-heartbeat]] and [[K-0010-campvibe-done-needs-a-verify-role]]).

Confidence is held at 0.65 because the source states the tally but does not show how 83 and 7 were counted. `GAPS.md` GAP-098 uses "7 of 7" for a different count (wrong facts caught by delegates) and warns: "Do not read '7 of 7 caught' as the system working." Cite the direction, not the numbers, until the count is found.
