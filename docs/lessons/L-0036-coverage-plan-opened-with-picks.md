---
id: L-0036
date: 2026-10-26
issue: [ORV-127]
what_happened: The main session's first plan for the category colour lineup library opened with hand-picked categories, and the owner rejected it for a top-down plan on a standard taxonomy with the order inside each level taken from data.
cause: Intake has no step that asks, for work whose aim is coverage of a set, what the whole set is, how many members it has per level and which source ranks them, so the plan started from examples.
rule: When a request's aim is coverage of a set (categories, touchpoints, sections, rules), the plan and the spec open with the whole structure, its source, the count per level on one base and the exclusions, and name a data source for the order inside a level; a named member appears only as an example of a data row.
---

## What happened

- The owner rejected the first plan, which opened with hand-picked categories (ORV-127; the fact is recorded in the retro envelope `ORV-127-retro-1` with `checked_by` the issue URL). The owner then chose TSIC 2009 and a top-down, breadth-first plan (ORV-127 comment 10199, cited in `docs/specs/ORV-127/spec.md` line 245).
- The next envelopes carried the correction as a boundary. `ORV-127-research-taxonomy-1` was asked for the real counts per level and a ranking source. `ORV-127-product-spec-1` carried the fact "The owner rejected plans that open with hand-picked categories; order inside a level must come from data" and the boundary "Open the spec with the structure and the counts per level, then method, then priorities; name no category as a pick".
- The spec says the same in its own words at line 32 ("not from a hand-picked list of categories") and builds the method on it (line 51, "Method: top-down, breadth-first"; row 21, `nextWork` in rank order).
- The rejected plan's tokens are the main session's and are not split per task in `.orivilo/metrics/ORV-127-category-lineups.md`, so the lesson gives no token figure.

ORV-126's touchpoint sets per TSIC section were another plan of coverage over the same tree. A rule at intake reaches both kinds of work. The count per level must also name its base ([[L-0034-level-5-count-mixed-two-bases]]).

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/discover/SKILL.md`, step 2, after the gap list sentence:

```diff
+   When the aim is coverage of a set (categories, touchpoints, sections, rules), the first gap to
+   close is the structure: the standard or source that defines the whole set, its count per level on
+   one base, what is excluded and why, and the data source that orders members inside a level. The
+   spec opens with that structure, then the method, then priorities; a named member appears only as an
+   example of a data row, never as a pick (L-0036). No hook checks this.
```

What proves it was done: the next spec whose aim is coverage opens with a structure section that names the source, the counts per level and the ranking source before any named member, and the owner does not reject its plan for starting from picks.

Status: promoted 2026-10-26, into `.claude/skills/discover/SKILL.md` (step 2, the coverage paragraph after the gap list sentence); no hook enforces it
