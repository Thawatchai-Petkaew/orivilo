---
id: L-0001
date: 2026-10-23
issue: [ORV-72, ORV-80]
what_happened: G3 passed visual defects, a Checkbox off-centre since E2-4 from an invalid calc, a cramped sm gap and overlapping story menus.
cause: No one looked at the render; the checks that ran (lint, typecheck, tests, contrast) cannot see position or spacing.
rule: A PR that changes a rendered component attaches a looked-at screenshot or a computed-style check for each visual claim, and the G3 reviewer opens the changed stories before recording the DESIGN.md §11 walk.
---

## What happened

The Checkbox glyph sat off-centre from E2-4 on, because a `calc()` in its recipe was invalid and the browser dropped it. The sm size had a cramped gap, and story menus overlapped. Every one of these passed G3 and was found later (ORV-72, ORV-80). The checks we run are all blind to where a thing is drawn.

## Rule

- The builder attaches, per visual claim, either a screenshot it looked at and describes in one line, or a `getComputedStyle` assertion on the rendered element ([[K-0005-proof-must-match-the-claim]]).
- The G3 reviewer opens every changed story at 360 px in light and dark before it records the DESIGN.md §11 walk, and names the stories it opened.
- A grep of a class name or a token name is not evidence for a visual claim.

Status: proposed (targets `.claude/rules/design-system.md`, Gate section, and the reviewer agent)
