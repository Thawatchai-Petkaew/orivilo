---
id: K-0007
topic: verification
claim: Allkons caps review judged by a model at 2 rounds; what is still open after round 2 goes to the human as a list, and only drift a script measures loops to zero.
source: "~/My Work/TechFlow/AI-First/allkons-marketplace/.claude/skills/atlas/references/tiered-routing.md:83 (also SKILL.md:126)"
retrieved: 2026-10-23
confidence: 0.8
applies_to: [ORV-81]
license: internal
---

## Evidence

> 4. **Cap LLM-judged review at 2 rounds.** A reviewer finding Atlas accepts goes back to the author for round 2 without asking; STOP + ask applies to a script-measured FAIL and to what is left after round 2. Loop to zero only on drift a script measures. After round 2, LLM-judged findings still open go to the human as a list, never silently accepted or dropped.

## Why it matters for ORIVILO

A reviewer asked to find gaps "will usually report some, even when the work is sound" (tiered-routing.md:82, section 2 item 3), so model review never converges by itself. The cap keeps a story from looping and puts judgment calls in front of the owner.
