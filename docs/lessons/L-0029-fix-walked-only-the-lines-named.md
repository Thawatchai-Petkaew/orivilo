---
id: L-0029
date: 2026-10-26
issue: [ORV-126]
what_happened: PR 117 took four review rounds because rounds 2 and 3 each found the same bracket count defect in the proposed touchpoint sets entry on lines the previous fix had not checked against the rule.
cause: The round 1 fix envelope limited the work to the lines the finding named, and when the round 2 envelope asked for a walk of every line, one summary row was enough to report it, so a line that broke the rule passed as checked.
rule: A fix for a finding that cites a rule over many lines names the rule and every line it governs, and reports one `verified` row per governed line with the source line it was checked against; the reviewer marks a rule finding's line list as complete or as examples, and the re-check looks for one row per line.
---

## What happened

PR 117 (branch `docs/ORV-126-touchpoints`) added four touchpoint entries, three counts by TSIC section (K-0077 to K-0079) and the proposed touchpoint sets by TSIC section. This lesson names the last one by its title, not its id, because `pnpm check:knowledge` reads every id in a lesson as a citation and that entry sits at 0.6. Its line 26 sets the rule: a bracket number counts the pages that name the touchpoint given, or says it is a merged category. Records are under `.orivilo/runs/ORV-126/`; token figures are from `.orivilo/metrics/ORV-126.json`.

| task                           | tokens.total | what it found or did                                                                                                                                                                         |
| ------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORV-126-review-touchpoints-1   | 819,638      | F2 Important: "several brackets" carry a merged count under a narrower name, with C and N as examples (head `948c661`)                                                                       |
| ORV-126-research-touchpoints-2 | 356,343      | Envelope boundary "Change only what the findings name"; `verified` row "Every changed bracket count matches the source lines"                                                                |
| ORV-126-review-touchpoints-2   | 303,206      | R2-1 Important: the same defect on D, M, Q and S                                                                                                                                             |
| ORV-126-research-touchpoints-3 | 256,650      | Envelope adds "Walk every other section line once more against line 26"; one `verified` row, "Walked lines A to S once more against line 26", that passed K as "merged names joined by 'or'" |
| ORV-126-review-touchpoints-3   | 249,137      | K1 Important on line K, `app icon or splash screen (3)` against K-0078:58-61 `app 3`: "the R2-1 defect on a line the round 2 fix did not touch" (head `a481303`)                             |
| ORV-126-research-touchpoints-4 | 126,355      | Fixed K1 and K2                                                                                                                                                                              |
| ORV-126-review-touchpoints-4   | 104,623      | approve                                                                                                                                                                                      |

Rounds 3 and 4 (the last four rows) used 736,765 tokens, 2.2% of the issue's 33,163,751. The whole PR 117 review chain used 2,215,952.

Two gaps let the defect survive. The first review listed examples without saying so, and the first fix took the list as complete. The second fix was asked to walk every line but reported the walk as one row, which a reader cannot check line by line.

This is the same shape as [[L-0024-source-guard-sampled-one-syntax-form]] (one `verified` row per form, not one for all) and [[L-0021-synthesis-contradicted-its-own-source]] (one row per universal sentence).

## Rule

Proposed diffs, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, step 2, after the "Contract change from a review" bullet:

```diff
+- **Fix for a rule finding.** When a finding says a rule is broken (a counting, format, naming or
+  citation rule that governs many lines), the fix envelope names the rule by file and line and lists
+  every line it governs, not only the lines the finding names; the boundary "change only the lines
+  named" is not used for it. The fix adds one `verified` row per governed line with the source line it
+  was checked against and `meets` or `changed`. A summary row ("walked A to S") does not count (L-0029).
```

In `.claude/agents/reviewer.md`, under Output, add:

```diff
+- A finding that says a rule is broken states whether its line list is `complete` or `examples`. On a
+  re-check of such a finding, look for one `verified` row per governed line in the fix report and
+  raise a missing row as the finding still open (L-0029).
```

In `.claude/agents/research.md`, under "What you do", add:

```diff
+- A fix for a finding about a rule walks every line the rule governs and adds one `verified` row per
+  line, naming the source line it was checked against (L-0029).
```

What proves it was done: on the next research or docs PR with a rule finding, the fix `result.json` has one `verified` row per governed line, and the re-check's `checks_run` names that check.

Status: promoted 2026-10-26, into `.claude/skills/ovl/SKILL.md` (section 2, "Fix for a rule finding", after the "Contract change from a review" bullet), `.claude/agents/reviewer.md` (Output, the rule finding bullet) and `.claude/agents/research.md` (What you do, the rule finding bullet); no hook enforces it
