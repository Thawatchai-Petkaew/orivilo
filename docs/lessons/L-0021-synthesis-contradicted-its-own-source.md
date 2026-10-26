---
id: L-0021
date: 2026-10-26
issue: [ORV-109]
what_happened: Synthesis entry K-0027 claimed every surveyed project that ships colour or tokens does it deterministically, while K-0024 (Huemint), in its own survey table, makes palettes with its own models (review finding F1), and it stated "none of them checks that a model's claim matches its input" as fact rather than as what the pages read show (F4).
cause: The synthesis claim was written from the pattern the survey suggested, and no step compares a universal word in a synthesis (every, all, none, only) with the `claim:` line of each entry it cites.
rule: Before handoff, a research task that writes a synthesis entry runs `grep -n '^claim:'` over every entry the synthesis cites, and for each sentence with every, all, none or only it names the exception or scopes the sentence to the pages read, with one `verified` row per such sentence.
---

## What happened

Records: `.orivilo/runs/ORV-109/ORV-109-review-knowledge-1/result.json`, findings F1 and F4.

- F1 (Important), `docs/knowledge/architecture/K-0027-synthesis-ai-design-system-architecture-patterns.md` line 4 and Pattern 1 (line 34): "every project that produces color or tokens people ship does it deterministically". Line 28 of the same entry lists "Huemint | K-0024 | Own small models", and K-0024's claim says Huemint generates brand palettes with its own transformer and diffusion models. The entry carried confidence 0.8.
- F4 (Suggestion), K-0027 line 54: "none of them checks that a model's claim matches its input", an inference from public pages written as fact, while line 15 hedges a similar claim.
- `ORV-109-research-fix-review-1` named Huemint as the exception in the claim and in Pattern 1, and rephrased line 54 as "none of the pages read shows a check that ...". `ORV-109-review-knowledge-2` confirmed both against K-0024.

The round 1 rework cost (1,258,468 tokens over the fix and the re-check) is shared with [[L-0020-knowledge-index-left-out-of-the-pr]] and [[L-0022-press-figures-with-no-url-in-source]]. ORV-126's synthesis K-0044 is the next entry of this kind.

## Rule

In `.claude/agents/research.md`, "What you do", add a bullet:

```diff
 - Record facts and options, each with its source.
+- A synthesis entry (one that draws a pattern from other entries) is checked against every entry it cites before you report: run `grep -n '^claim:'` over the cited files, and for each sentence that says every, all, none or only, name the exception or scope the sentence to what the pages read show. Add one `verified` row per such sentence with the entries compared (L-0021).
```

What proves it was done: the next synthesis entry's research report has the `verified` rows, and its review has no finding of a synthesis claim that a cited entry contradicts.

Status: promoted 2026-10-26, into `.claude/agents/research.md` (What you do)
