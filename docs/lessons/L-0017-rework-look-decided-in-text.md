---
id: L-0017
date: 2026-10-25
issue: [ORV-107]
what_happened: In ORV-107 two rework fixes to how the chat looks were decided by the main session in envelope and form text, never mocked or seen by the designer before the build, and both shipped a look the owner rejected by eye (a three-line gone chip in a full pill radius, then a 1 px border beside a 1 px outline); the round 4 chain alone used 6,887,720 tokens over five tasks.
cause: The ovl loop routes every finding straight to a builder envelope, so when the fix is a visual decision the main session writes the CSS or the layout in prose, the owner grants the round from that prose, and the first render anyone looks at is the built head.
rule: A finding or owner comment whose fix changes how something looks goes to the designer first, who records the change in design.md and screenshots it rendered (the proposed CSS injected into the story) before any builder envelope, and the owner's grant form for that round links those screenshots.
---

## What happened

Numbers from `.orivilo/metrics/orv-107-retro.md` (`node scripts/ovl/metrics.mjs report ORV-107`) and the per-task figures in `.orivilo/metrics/ORV-107.json`. Objectives come from each task's `envelope.json`, findings from `result.json`, under `.orivilo/runs/ORV-107/<task_id>/`. Owner answers are the hook records `.orivilo/runs/ORV-107/owner-grant-<n>.json`.

ORV-107 (CanvasChat slice C, PR 100) had 7 builder rework rounds and 5 owner grants. The designer ran three tasks: design-1 and design-2 wrote design.md v1 and v2 before the build, and design-3 fixed one doc line in round 7. No designer task saw a rework fix before it was built.

| step                   | task or record                    | what decided the look                                                                                                                         | tokens.total |
| ---------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| qa finding             | ORV-107-qa-2, row 22 fail         | English at 240 px clips the gone words                                                                                                        |              |
| round 4 grant          | `owner-grant-2.json`              | the main session's question: "let that chip wrap to two lines"; the owner granted on that text                                                |              |
| round 4 build          | ORV-107-build-10                  | envelope prose: wrap the label, title on line 1, gone words on line 2, inside the Tag's full pill radius                                      | 437,690      |
| re-check               | ORV-107-review-4, R4-I1 Important | renders three lines in English (label height 59 against 39 in Thai); offers "get an owner decision" or correct the spec                       | 796,272      |
| spec matched to render | ORV-107-spec-2                    | the main session chose to rewrite row 22 to the three-line render (v1.5.2)                                                                    | 149,297      |
| re-check               | ORV-107-review-5, approve         | spec text only                                                                                                                                | 162,560      |
| qa walk                | ORV-107-qa-3, abandoned           | the owner's screenshots showed an oval blob and a clipped Thai title                                                                          | 5,341,901    |
| round 5 undo           | ORV-107-build-11                  | `owner-grant-3.json`: back to a one-line chip, warning text under the chip row                                                                | 1,210,179    |
| round 6 build          | ORV-107-build-13                  | envelope prose: "set the outline in `.ds-chat__box:has(textarea:focus)` to 1px solid", while the box's 1 px border already took the focus ink | 159,162      |
| round 7                | ORV-107-review-8 to review-10     | `owner-grant-5.json`: border only, no outline; see [[L-0018-plays-assert-properties-not-the-render]]                                          |              |

The round 4 chain (build-10, review-4, spec-2, review-5, qa-3) sums to 6,887,720 tokens, n=5, 11.2% of the issue's 61,564,495. Each step checked the build against prose; none put the proposed look on screen before it was built. A screenshot of the wrap CSS injected into `MentionGoneNarrowEnglish` would have shown three lines in a pill before round 4 started. A zoomed screenshot of the round 6 rule would have shown a 2 px edge.

Every one of the five grant forms described its visual fix in text only. Two of those fixes rendered a look the owner rejected once he saw it: the wrap of `owner-grant-2.json` (reverted in round 5) and the 1 px ring of `owner-grant-4.json`, which the round 6 envelope turned into an outline beside the border (redone in round 7). The one-line chip of `owner-grant-3.json` held.

Related: [[L-0001-g3-passed-visual-defects]], [[L-0015-geometry-defects-found-by-the-reviewer-probe]], [[L-0019-no-designer-looked-at-the-built-head]].

## Rule

In `.claude/skills/ovl/SKILL.md`, section 2, add a bullet after "Contract change from a review":

```diff
+- **Visual fix from a finding.** When a finding or an owner comment needs a change to how something
+  looks (layout, wrap, line count, size, radius, border, outline, ring, colour, type), dispatch
+  `designer` before any builder envelope. The designer writes the change as a numbered row in
+  `docs/specs/<KEY>/design.md` (target px, tokens, the play that proves it) and renders it: a Playwright
+  screenshot of each affected story with the proposed CSS injected (`page.addStyleTag`), at the
+  narrowest and widest container the spec names, Thai and English, light and dark, under
+  `.orivilo/runs/<ISSUE>/<task_id>/screenshots/`, each opened and described in `verified`. The builder
+  envelope carries the design.md version as a fact and those screenshots in `context_pointers`; it
+  never states a CSS value or a layout that design.md does not hold. A question form that asks the
+  owner for a round for a visual fix names those screenshot paths, so the owner grants a look, not a
+  sentence (L-0017).
```

In `.claude/agents/designer.md`, Output, add:

```diff
 `docs/specs/<KEY>/design.md` with flow, states, the visual decisions and their source intent, and the screens to check in visual QA.
+
+For a visual fix during rework, the design.md row comes with screenshots of the proposed CSS injected into each affected story (narrowest and widest container, Thai and English, light and dark), opened and described in `verified`, before any builder builds it. Check the render at every line count the content can reach, not the one the fixture shows (L-0017).
```

The reviewer re-check and qa stay as they are; this moves the first look before the build and removes no check.

What proves it was done: for each UI issue after promotion, every builder rework envelope that changes CSS in a recipe or story has, earlier in the same issue, a designer task whose `verified` rows name screenshot paths of the injected change.

The `Check:` line names ORV-110 (board node restyle, the next chat-adjacent UI issue) as a provisional key. Before the measurement it is replaced by every UI issue with a visual rework round after promotion, each collected first with `collect <ISSUE>`. With fewer than 5 such tasks the verdict is `not enough data`.

## Expected saving

- Metric: sum of `tokens.total` over tasks that build, re-check, walk or revert a visual fix decided during rework, per issue
- Baseline: sum 6,887,720, n=5, from ORV-107 tasks build-10, review-4, spec-2, review-5 and qa-3 (`node scripts/ovl/metrics.mjs report ORV-107`; per-task tokens from `.orivilo/metrics/ORV-107.json`)
- Target: 2,000,000 or less per issue, about 70% less; the designer mock adds an estimated 500,000 to 1,000,000 per visual fix, which the target already nets out
- Guard metric: owner-granted rounds per UI issue do not rise (5 in ORV-107), and owner-reverted visual fixes per UI issue fall from 2 to 0
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-110`
- Check after: 2026-11-08

Status: proposed
