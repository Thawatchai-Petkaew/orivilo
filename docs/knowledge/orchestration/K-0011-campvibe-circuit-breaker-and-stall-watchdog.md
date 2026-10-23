---
id: K-0011
topic: orchestration
claim: Camp Vibes sends a story back to Discovery after 2 gate rejections, and presumes a build dispatch stalled after about 15 minutes with no completion and no new commits or file changes.
source: "~/Claude/Projects/CAMPVIBE/.claude/agents/orchestrator.md:131 and 143-145"
retrieved: 2026-10-23
confidence: 0.8
applies_to: [ORV-81]
license: internal
---

## Evidence

> A code-writing dispatch that goes silent [-] no completion notification **and** no new commits/file mtimes [-] past ~15 min (build work) or ~25 min (research) is presumed stalled, not just slow.

> **2 gate rejections on the same story = STOP rework.** A third rework attempt on the same spec is a shaping defect, not an execution defect [-] the story re-enters Discovery to re-shape the spec ...
>
> - The ticket DB's `regressionRound` column is the counter ...

## Why it matters for ORIVILO

A third rework on the same spec usually means the spec is wrong, so the product agent should reshape it. A stalled dispatch is killed and re-dispatched from what is already on the branch, never restarted from scratch (CAM-268, a dispatch that died silently).
