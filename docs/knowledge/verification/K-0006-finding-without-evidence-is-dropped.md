---
id: K-0006
topic: verification
claim: In Allkons a reviewer finding must carry a command that re-runs and its literal output; a finding without that evidence is dropped, not downgraded.
source: "~/My Work/TechFlow/AI-First/allkons-marketplace/.claude/skills/atlas/references/report-contracts.md:53-57"
retrieved: 2026-10-23
confidence: 0.8
applies_to: [ORV-81]
license: internal
---

## Evidence

> **`evidence` is mandatory and it is what makes a finding believable.** Each element is a command the
> orchestrator can paste into Bash, plus that command's actual output. Not "verified", not "confirmed accurate
> to source" [-] a string that re-executes. ... **A finding with no re-executable evidence is
> DROPPED, not downgraded** [-] downgrading is how an unevidenced claim survives as a P2 and gets believed anyway.

## Why it matters for ORIVILO

Our QA and reviewer agents should return findings the lead can re-run. The source also explains the budget: a reviewer told to be terse drops the evidence, not the claim (GAP-102), so the reviewer gets room for evidence.
