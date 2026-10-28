---
id: L-0045
date: 2026-10-28
issue: [ORV-133, ORV-128]
what_happened: Four review rounds of PR 130 each found a new route of one resource-exhaustion class in the page reader (recursion and sibling walks, then parse cost in nesting and robots.txt rule count, then element, attribute and link counts, then list walks in the tree adapter), and each route cost a spec revision, a design round and a builder round until a research task listed every route and one bound closed the class in one round.
cause: Each fix envelope asked to bound the route the finding named, and each research envelope asked one narrow question about that route, so no task listed the other routes of the class before a bound was designed.
rule: A Critical or Important finding of a risk class (resource exhaustion, injection, auth bypass, path or address escape) first gets a research envelope that lists every route of the class in the code it runs on, by a stated search method; then one design, one spec revision and one builder round cover the list; and every later re-check envelope names the surveyed list.
---

## What happened

Records are under `.orivilo/runs/ORV-133/`; the batch report is `.orivilo/metrics/orv133-slice-1b.md` (`node scripts/ovl/metrics.mjs report ORV-133`), per-task tokens from `.orivilo/metrics/ORV-133.json`. PR 130 merged into `develop` as `c1b5349`.

The class is resource exhaustion on hostile input in `packages/intent-engine/src/page-text.ts` and `read-page.ts`: the robots.txt matcher and the parse5 parse of the page. Routes found, by review round:

| Round | Review tasks                  | Routes of the class found                                                                                                                 | Research asked before the bound                                                        |
| ----- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 0     | `review-code-2`, `security-2` | SEC-133-1 (robots.txt pattern backtracking, Critical), SEC-133-3 (recursion per depth), SEC-133-4 (sibling walk, quadratic)               | none                                                                                   |
| 1     | `review-code-3`, `security-3` | SEC-133-R1-2 (parse quadratic in nesting, Critical), R1-1 (path length), R1-2 (the same parse cost), SEC-133-R1-1 (robots.txt rule count) | `research-parse5-hooks-1`: one question, the stack hooks                               |
| 3     | `review-code-4`, `security-4` | SEC-133-R2-1 (attribute scans, Critical), R2-1 (element count), SEC-133-R2-2 (stylesheet href list, quadratic)                            | `research-parse5-work-1`: one question, attributes and formatting elements (K-0082 §7) |
| 5     | `review-code-5`, `security-5` | SEC-133-R3-1 (tree adapter child-list walks, Critical), R3-1 (the same walks)                                                             | `research-parse5-lists-1`: "list EVERY routine" whose cost grows with an uncapped list |
| 6     | `review-code-6`, `security-6` | none; `security-6` approved                                                                                                               | none; K-0082 §8 holds twelve rows, found by three stated code searches                 |

So 4 of the issue's 6 Critical findings and 8 of its 17 Important findings were routes of this one class.

- After `research-parse5-lists-1` (4,872,139 tokens) listed every routine by search pattern (K-0082 section 8, line 288), `design-tech-r3-1` was asked to design "ONE bound that covers the whole class", the List steps (spec ORV-128 Work bound, as `product-parent-17` revised it), and `build-rework-6` built it in one round. `security-6` approved the next head, and the reviewer's later rejection (R4-1) was a test timeout, not a route.
- Fix cycles between re-checks (all spec, design, research, builder and bookkeeping tasks of the round): round 1, 18 tasks, 62,816,031 tokens (it also holds non-class findings: SEC-133-R1-3 percent-encoding, R1-3 port rejections); round 3, 9 tasks, 39,185,854; round 5, the survey cycle, 7 tasks, 37,655,974. The re-checks of rounds 3, 5 and 6 add 6,763,453, 6,504,102 and 10,478,569.
- Two of the five owner grants paid for rounds of this class: `owner-grant-2.json` (round 4, the Work bound) and `owner-grant-4.json` (round 6, which built the List steps; see [[L-0048-grant-form-asked-before-the-verdict]]).
- The owner approved the method in the working thread on 2026-10-28, before `research-parse5-lists-1` was dispatched.

Related: [[L-0012-guard-reviewed-as-a-boundary-before-its-frame]] (a bypass class of a guard rail is reported once; this lesson is for a boundary, where every route must be closed), [[L-0029-fix-walked-only-the-lines-named]] (the same shape for lines of a rule), [[L-0024-source-guard-sampled-one-syntax-form]].

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, section 2, after the "Review of a guard-rail spec" bullet (line 153):

```diff
+- **A risk-class finding.** When a `security` or reviewer finding of Critical or Important severity
+  is one route of a risk class (resource exhaustion: a cost that grows faster than the input or with
+  an uncapped count; injection; auth bypass; path or address escape), the next envelope is `research`,
+  before any spec, design or builder envelope. Its objective asks for every route of the class in the
+  code the slice runs on (the pinned dependency included), each with file, line and a quote, and the
+  search method that found them (the patterns run and their hit counts), recorded in one knowledge
+  section. Then one design task covers every listed route with one bound or a named set of bounds,
+  one spec revision carries the findings and the design's spec findings, and one builder round builds
+  it. Every later reviewer and `security` envelope names that knowledge section as a context pointer
+  and says a route outside the list is a new finding that also names the search that missed it
+  (L-0045). No hook checks this; it is the main session's duty.
```

What proves it was done: in the next slice with a risk-class finding, the first envelope after the review is a `research` envelope whose objective asks for every route and whose result names its search patterns; the class closes in one fix cycle; no re-check finds a route the list holds.

## Expected saving

- Metric: sum of `tokens.total` over the fix tasks between the first re-check that finds a further route of a risk class and the re-check that approves the class
- Baseline: sum 139,657,859, n=34, from ORV-133 fix cycles after rounds 1, 3 and 5 (18, 9 and 7 tasks; round 1 also holds non-class findings) (`node scripts/ovl/metrics.mjs report ORV-133`; per-task tokens from `.orivilo/metrics/ORV-133.json`)
- Target: 40,000,000 or less per class, one fix cycle after the survey (the round 5 cycle, which ran in this order, used 37,655,974 over 7 tasks)
- Guard metric: Critical and Important findings of the class on the closing `security` re-check stay at 0 (security-6: 0), and no surveyed route is moved to Honest limits without the owner's decision
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-133`
- Check after: 2026-11-11

The `Check:` line names ORV-133 as a provisional key. Before the measurement it is replaced by every issue with a risk-class finding after promotion (the next ORV-128 slices read hostile pages and model output), each collected first with `collect <ISSUE>`, and only tasks started after promotion count. With fewer than 5 comparable fix tasks after a risk-class finding the verdict is `not enough data`.

Status: promoted 2026-10-28, into `.claude/skills/ovl/SKILL.md` (section 2, "A risk-class finding", after the "Review of a guard-rail spec" bullet); Check after: 2026-11-11; no hook enforces it
