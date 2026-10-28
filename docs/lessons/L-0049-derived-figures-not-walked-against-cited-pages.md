---
id: L-0049
date: 2026-10-28
issue: [ORV-131]
what_happened: PR 132's reviewed head `c33d767` drew four Important findings on K-0084 to K-0087 (`ORV-131-review-1`), each proved with one fetch of a page the entry already cites; two markup ranges in K-0086 left out a row of a table or price row the entry itself cites (F1, F2), a first-party fact sat among the unchecked third-party claims of K-0085 (F3), and two README Index rows gave a price per credit without the own-arithmetic label (F4).
cause: The research steps prove that each cited URL was read (one `verified` row per URL, L-0022) and check a synthesis's universal words against the entries it cites (L-0021), but no step walks a derived range over every row of the page it rests on, searches the cited first-party pages before a claim is set aside as unchecked, or carries a body label into the `claim:` line and the Index row.
rule: Before handoff a research task adds one `verified` row per range naming the rows the cited page lists and the rows used, one per item under `### Claims that did not re-check` naming the first-party pages in `source:` it searched, and one per Index row it adds or changes showing the body's label kept, as a step in `.claude/agents/research.md`, What you do.
---

## What happened

Records: `.orivilo/runs/ORV-131/<task_id>/` and `.orivilo/metrics/ORV-131.json` (`node scripts/ovl/metrics.mjs report ORV-131`, saved as `.orivilo/metrics/ORV-131.md`).

`ORV-131-research-credits-1` wrote K-0084 to K-0087 and four Index rows. Its report has 52 `verified` rows: 39 name a URL read, 8 name the L-0021 claim grep or a K-0087 sentence, 5 name format checks, and none names a range, a set-aside claim or an Index row's label. `ORV-131-review-1` returned `request_changes` on `c33d767` with F1 to F4 (Important) and F5 to F7 (Suggestion):

| Finding | Line at `c33d767`                     | What the entry said                                                                                                         | What a page in its own `source:` states                                                                                                                                                        |
| ------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1      | K-0086 lines 4 and 39                 | Higgsfield Nano Banana Pro at about 0.64 to 1.12 times list; "The 4K credit cost for Nano Banana Pro is not stated"         | The Higgsfield blog `higgsfield-pricing-explained` has a credits table with a Nano Banana Pro 4K row at 4 credits; the range reaches about 1.25                                                |
| F2      | K-0086 lines 4, 19, 31, 33, 70        | Wireflow Nano Banana 2 at about 1.8 to 4.0 times list, "these are the ends of the range"; line 19 quotes three of four rows | Google's Standard row for gemini-3.1-flash-image lists $0.045 per 0.5K image, and line 23 says the Wireflow node lists 0.5K; $0.27 / $0.045 is about 6.0. It carried into K-0087 and the Index |
| F3      | K-0085 line 116                       | "API funds expire after one year" listed among third-party claims that were not fetched                                     | Higgsfield's own API blog, cited and quoted on line 83, says funds expire one year after they are added; K-0087 point 4, the differ list and Options built on the gap                          |
| F4      | `docs/knowledge/README.md` 181 to 182 | "flat $0.0135 a credit" and "$0.075 to $0.043 a credit", no label                                                           | K-0084 says the pricing page states no price per credit, so both are our arithmetic; row 183 shows the label fits in the cell                                                                  |

The envelope objective asked for the markup as "own arithmetic, labelled as such, each figure beside the list price it rests on". `ORV-131-fix-1` closed F1 to F7 on `95995b9`; for F4 it dropped one short phrase from rows 181 and 182 so the label fits the 69-character cell. `ORV-131-review-2` approved `95995b9` with one Suggestion (F8).

Cost, `tokens.total`: `ORV-131-research-credits-1` 8,031,265, `ORV-131-review-1` 1,955,140, `ORV-131-fix-1` 1,132,098 and `ORV-131-review-2` 779,505, 11,898,008 for the issue. The rework (fix and re-check) used 1,911,603 tokens, 16.1% of the issue, shared with the Suggestions F5 to F7 and not split per finding. No `## Expected saving`: this is a mistake lesson, and the research kind has n=2 in the report.

Related: [[L-0022-press-figures-with-no-url-in-source]] made the `### Claims that did not re-check` heading for facts with no URL; F3 is the other direction, a fact with a URL that was not searched. [[L-0021-synthesis-contradicted-its-own-source]] checks a synthesis against the entries it cites, not a range against the rows of a page. [[L-0034-level-5-count-mixed-two-bases]] fixes the base of a count, not the rows a range covers. [[L-0029-fix-walked-only-the-lines-named]] and [[L-0041-fix-left-stale-text-in-the-other-documents]] govern fixes, not the first write; F8 (a fix row citing a K-0085 line that covers packs and Auto-Refill but not Boost) is an L-0029 miss and needs no new rule. [[L-0023-research-role-cannot-run-its-checks]]: research has no shell, so the walk below is done by reading the fetched pages, and the rows are static.

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/agents/research.md`, "What you do", after the count bullet (L-0034):

```diff
+- Before you report, walk each figure you derive and each claim you set aside against the pages in
+  `source:` (L-0049). No hook checks this.
+  - A range (a low and a high end, "about X to Y", "the ends of the range") over a table or price row
+    takes every row that table lists on each cited page that states one (resolution, tier, plan,
+    standard or batch): each row is in the range or named with why it is left out. One `verified` row
+    per range names the page, the rows found and the rows used.
+  - Before a claim goes under `### Claims that did not re-check`, search every first-party page in
+    `source:` (the company's own site, docs, blog or help center) for it. A claim a first-party page
+    states moves into the body with its quote. One `verified` row per item under that heading names
+    the pages searched.
+  - A figure repeated in `claim:` or in the README Index row keeps the label it has in the body (own
+    arithmetic, company-reported, press). When the cell is too short, drop another phrase, never the
+    label. One `verified` row per Index row you add or change.
```

What proves it was done: the next research report that writes a range, a `### Claims that did not re-check` item or an Index row has one `verified` row per range, item and row as above, and its first review has no finding of a range that leaves out a row a cited page lists, a first-party fact among the unchecked claims, or an Index figure without its label.

Status: promoted 2026-10-28, into `.claude/agents/research.md` (What you do, after the count bullet); no hook enforces it
