---
id: L-0034
date: 2026-10-26
issue: [ORV-127]
what_happened: The TSIC 2009 level 5 figure "about 1,065 of 1,091" took 1,065 from the NSO workbook's 1,089 codes and set it against the 1,091 the standard states, so the spec and K-0048 mixed two bases, K-0048 rose to 0.85 on it, and review findings F1, F2, F3 and F8 on PR 115 came from it.
cause: The main session counted the primary files itself and handed the derived figure out as a confirmed envelope fact with no base and no command that reproduces it, and the research task that recorded it was told to raise the confidence, so no role recounted it before the G3 review.
rule: A count in an envelope fact names the one file it was counted in and a `checked_by` command that reproduces it; a figure another source states is its own fact and never an operand; a primary PDF or XLSX that research could not read is converted to text in the scratchpad by the main session and counted by research, not by the main session.
---

## What happened

Records are under `.orivilo/runs/ORV-127/`; tokens are `tokens.total` from `.orivilo/metrics/ORV-127.json`. All tasks ran on 2026-10-26 between 09:05 and 14:08 UTC.

- `ORV-127-research-taxonomy-1` (3,464,714 tokens, 35% of the issue's 9,794,685) reported that the NSO TSIC manual, the UNSD ISIC Rev.5 intro, the MSCI methodology and the DBD TSIC guide are PDF or XLSX files its fetch tool could not decode, and asked that "someone with a PDF reader" confirm the per-level counts (`needs_decision`).
- The main session then read the NSO structure page and counted the five-digit list itself (ORV-127 comment 10200). The envelope of `ORV-127-product-spec-1` carried the fact "TSIC 2009 has 21, 88, 243, 441 and 1,091 codes per level; brand-relevant ... 18, 84, 236, 430 and about 1,065". The envelope of `ORV-127-research-tsic-counts-2` carried "The NSO standard states ... 1,091 five-digit industries" and "The NSO comparison workbook lists 1,089 five-digit codes" as two facts, and asked the entry to "raise its confidence to match the evidence" while "the brand-relevant five-digit count stays approximate".
- `ORV-127-research-tsic-counts-2` (226,205 tokens) wrote in `deviations` that it took 1,089 and "about 1,065" from the envelope facts and did not recount them. K-0048 went to confidence 0.85 (`git grep -n '^confidence' e0d5f0e -- docs/knowledge/market/K-0048*`).
- At head `e0d5f0e`, `git grep -n "about 1,065\|about 26" e0d5f0e -- docs/specs/ORV-127 docs/knowledge/market` hits the spec lines 20 and 164 and K-0048 lines 4 and 38.
- `ORV-127-review-docs-1` (1,127,793 tokens) recounted the workbook and found F1 Important (26 excluded is 1,091 minus a 1,065 counted from the 1,089-code workbook, two bases; the workbook holds 24), F2 Important (row 1 asks for 1,091 codes that the named source cannot yield) and F3 Important (0.85 on one publisher, cap 0.8). The residue in K-0048 became F8 in round 2 (see [[L-0035-fix-reports-named-the-round-2-findings]]).

The figure was exact on one base all along: 1,065 of the workbook's 1,089, with 24 excluded. "About" hid that the subtraction crossed two sources. Recounting was cheap once the file was text: the reviewer did it with one script run in round 1.

Related: [[L-0006-main-session-worked-solo]] (the main session did a role's work), [[L-0022-press-figures-with-no-url-in-source]] (a body fact rests on a source read in the same task; promoted after these tasks ran, at commit `9a45df4`, and it would have put the unrecounted figure under `### Claims that did not re-check`) and [[L-0023-research-role-cannot-run-its-checks]] (research has no shell). Neither covers a derived count's base or who counts a primary file.

## Rule

Proposed diffs, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, section 2, after the "Research envelope that adds a knowledge entry" bullet:

```diff
+- **A count in an envelope.** A fact that gives a count names the one file it was counted in, and its
+  `checked_by` reproduces it (`grep -c -E '<pattern>' <file>`). A figure derived from counts (a total
+  minus an exclusion) takes every operand from that one file. A total that another source states is a
+  separate fact and never an operand. A figure that is exact on its base is not written "about". The
+  main session never asks research to raise confidence on a count the main session made (L-0034). No
+  hook checks this; it is the main session's duty.
+- **A primary file research could not read.** When a research report says a PDF or XLSX did not
+  decode, the main session converts it to text in the scratchpad (a mechanical step, no reading for
+  the document) and dispatches research again with the absolute text path in `context_pointers`.
+  Research counts and quotes from that text and records the pattern it counted with (L-0034). No hook
+  checks this; it is the main session's duty.
```

In `.claude/agents/research.md`, under "What you do", add:

```diff
+- A count you record names the file it was counted in and the pattern. A figure derived from two
+  counts takes both from that file; a total another source states is its own sentence with its own
+  source, and the gap between them is an open point. A count from an envelope fact that you did not
+  recount goes under `### Claims that did not re-check` (L-0034, L-0022). No hook checks this.
```

What proves it was done: on the next issue whose documents carry counts, each count fact in the envelopes names one file and a `grep -c` `checked_by`, the research `verified` rows name the file and pattern, and the first review raises no finding of a count that mixes two sources.

Status: promoted 2026-10-26, into `.claude/skills/ovl/SKILL.md` (section 2, "A count in an envelope" and "A primary file research could not read", after the "Research envelope that adds a knowledge entry" bullet) and `.claude/agents/research.md` (What you do, the count bullet); no hook enforces it
