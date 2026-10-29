---
id: K-0004
topic: orchestration
claim: Allkons subagents return a single JSON object under one of three contracts, implementer.v1 (changed, verified, deviations), reviewer.v1 (verdict and evidenced findings) and explorer.v1 (answer and key findings), with no prose around it.
source: "https://bitbucket.org/ThammasornDEV/allkons-marketplace .claude/skills/atlas/references/report-contracts.md:3-51"
retrieved: 2026-10-23
confidence: 0.8
applies_to: [ORV-81]
license: internal
---

## Evidence

> Every dispatched subagent's **entire final message MUST be the JSON object ALONE** ...
> `needs_decision` / `blocked_on` are the escape valves ...

```text
## implementer.v1  (crew authoring agents [,] budget ≤ 500 tokens)
...
## explorer.v1  (read-only exploration [,] budget ≤ 500 tokens; ≤ 1500 for large research)
...
## reviewer.v1  (acceptance / critic / observer [,] budget ≤ 1500 tokens; waived for a Tier B reviewer ...)
```

## Why it matters for ORIVILO

A fixed return shape lets the lead parse a result instead of reading an essay, and the escape valves keep hard news from breaking the format. implementer.v1 also requires an absence claim ("none remain") to name the command, the folder searched and the output.
