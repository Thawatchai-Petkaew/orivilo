---
id: L-0022
date: 2026-10-26
issue: [ORV-109]
what_happened: K-0046 stated funding, revenue, founder and refund facts credited to Yahoo Finance, Unite.AI, Grit Daily and a Kavel review, none of them in `source:` and none with a URL (review finding F2); at fix time Yahoo Finance and the Kavel review could not be found, and "head of AI at Snap" was in no source read.
cause: The body named an outlet instead of a page fetched in the task, and nothing compares the outlets a body names with the entry's `source:` field.
rule: Every fact in a research entry rests on a URL in `source:` that was read in the same task; a fact without one is dropped or listed under "did not re-check" with confidence below 0.7, press or company-reported figures say so in their sentence, and the report has one `verified` row per URL with the phrase found there.
---

## What happened

Records: `.orivilo/runs/ORV-109/ORV-109-review-knowledge-1/result.json` (F2) and `.orivilo/runs/ORV-109/ORV-109-research-fix-review-1/result.json`.

- F2 (Important), `docs/knowledge/architecture/K-0046-higgsfield-own-models-plus-resold-third-party-models.md` lines 53 to 58: `source:` (line 5) named higgsfield.ai, aimmediahouse.com and designboom.com only. The Company context credited Yahoo Finance, Unite.AI, Grit Daily and a Kavel review, and the founder line (55) named no source.
- The fix task added The Next Web, Unite.AI and Grit Daily URLs and re-read each figure there on 2026-10-26. Yahoo Finance could not be found, so The Next Web now backs the Series B fact. The Kavel review could not be found, so its quote and plan prices were dropped. "Head of AI at Snap" was in no source read and was replaced by what the sources say. The section now says the figures are press-reported or company-reported and do not carry the entry's 0.8.
- `ORV-109-review-knowledge-2` fetched the three URLs and found each quoted phrase again.

So two outlets and one founder title were in the reviewed entry without a page behind them. The round 1 rework cost (1,258,468 tokens) is shared with [[L-0020-knowledge-index-left-out-of-the-pr]] and [[L-0021-synthesis-contradicted-its-own-source]]. Related: [[K-0005-proof-must-match-the-claim]].

## Rule

In `.claude/agents/research.md`, "What you do", change the third bullet:

```diff
-- Record facts and options, each with its source.
+- Record facts and options, each with its source. Every fact in the body rests on a URL in `source:` that you fetched in this task; a fact you cannot tie to one is dropped or listed under "did not re-check" below 0.7. A press or company-reported figure says so in its sentence and does not carry the entry's confidence. Add one `verified` row per URL with the phrase you found there (L-0022).
```

What proves it was done: the next research report has one `verified` row per `source:` URL, and the review of that PR has no finding of a body fact with no URL in `source:`.

Check after: 2026-11-09

Status: promoted 2026-10-26, into `.claude/agents/research.md` (What you do, third bullet)
