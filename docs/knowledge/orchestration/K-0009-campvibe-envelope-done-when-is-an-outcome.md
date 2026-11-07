---
id: K-0009
topic: orchestration
claim: Camp Vibes dispatches with a small envelope {ticket, spec, files, deltas, done_when}, and done_when states an outcome a command proves, not the shape of the code (CAM-670).
source: "https://github.com/Thawatchai-Petkaew/campvibe .claude/rules/efficiency.md:43 and 82-86 (also .claude/agents/orchestrator.md:116)"
retrieved: 2026-10-23
confidence: 0.8
applies_to: [ORV-81]
license: internal
---

## Evidence

> State it as an **outcome the command's output proves**, not as the shape of the code you expect [-] a criterion that greps for an implementation detail pre-commits the agent to a solution you have not verified is possible (CAM-670). Target ≤ ~300 tokens.

```text
{ "ticket": "CAM-401", "spec": "docs/specs/host-os/lead-inbox/CAM-401-parse-line-leads/story.md",
  "files": ["lib/leads/parser.ts", "__tests__/cam-401-*.test.ts"],
  "deltas": ["owner chose option B at G1: dedupe by phone, not name"],
  "done_when": ["npx vitest run __tests__/cam-401-parser.test.ts → all pass", "grep 'dedupeByPhone' lib/leads/parser.ts → ≥1"] }
```

## Why it matters for ORIVILO

Our envelope's `done_when` should name a command and the result that proves the outcome. In CAM-670 a code-shape criterion (`onDelete: SetNull`) was impossible in Prisma, and the agent had to refute it before shipping the right fix. Note that Camp Vibes' own example still greps for a function name, the shape it warns against.
