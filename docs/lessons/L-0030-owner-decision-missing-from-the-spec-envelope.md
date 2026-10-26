---
id: L-0030
date: 2026-10-26
issue: [ORV-126]
what_happened: The first review of PR 114 found four of its eight Important findings in the spec and ADR 0018 not following the owner's decisions in ORV-126 comments 10198 and 10202, and the spec never named 10202 at all.
cause: The main session put an owner comment into the envelope of the role it was dispatching at that moment, not into every envelope whose document the comment changes, and no step mapped each sentence of the comment to a line in the document.
rule: Before a product or architect envelope for an issue, the main session lists the owner's decision comments on that issue that the document does not yet cite, gives each one a fact and a `grep -n "<comment id>"` `done_when`, and the revision adds one `verified` row per requirement sentence naming the line that meets it or the recorded deviation.
---

## What happened

The owner recorded the G1 decisions on ORV-126 in comment 10198 and the three-layer harness frame in comment 10202. Records are under `.orivilo/runs/ORV-126/`.

- Comment 10202 is a fact in `ORV-126-arch-image-provider-1` (started 10:11:04 UTC), and ADR 0018 cites it. No product envelope before the review carries it: `ORV-126-product-ci-graph-1`, `-2` and `-3` (the last started 13:04:24 UTC, about three hours later). `grep -l 10202 .orivilo/runs/ORV-126/*/envelope.json` lists `product-ci-graph-4` as the first product envelope with it, after the review.
- `ORV-126-review-docs-1` (2,590,623 tokens) returned 8 Important findings. F1: the spec never names comment 10202 while ADR 0018 in the same PR acts on it (evidence `grep -n -i -E '10202|TSIC|layer|analyser|mockup' docs/specs/ORV-126/spec.md`, exit 1). F2: the spec's fill order puts the logo before colour, against 10198's frame, without recording a decision. F3: 10198's "cost is estimated before each run" is in neither the spec nor the ADR. F6: the ADR caps a mockup round at four touchpoints while the owner's own example in 10202 has five.
- F2 and F3 rest on comment 10198, which `product-ci-graph-2` did carry as a fact. A fact alone did not make the revision account for each requirement in the comment.
- The fixes were `ORV-126-product-ci-graph-4` (1,291,870 tokens, F1, F2, F4, F7) and `ORV-126-arch-image-provider-3` (329,389 tokens, F3, F6, S2). The share spent on the owner comment findings cannot be split from the other findings. Spec v1.3 now has a "Three layers (comment 10202)" section and lists comments 10198, 10202 and 10205 (`grep -n -E "10198|10202|10205" docs/specs/ORV-126/spec.md`).

Related: [[L-0011-spec-revision-and-fix-ran-in-parallel]], [[L-0025-spec-deviation-went-to-review]].

## Rule

Proposed diffs, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, step 2, after the "Contract change from a review" bullet:

```diff
+- **Owner decisions reach every document they change.** Before a `product` or `architect` envelope
+  for an issue, list the owner's decision comments on that issue that the target document does not cite
+  yet (`grep -n "<comment id>" <doc>`). Each becomes a fact (`checked_by` `ORV-<n> comment <id>`) and a
+  `done_when` entry `grep -n "<comment id>" <doc>`. When one comment changes a spec and an ADR, both
+  envelopes carry it (L-0030). No hook checks this; it is the main session's duty.
```

In `.claude/agents/product.md` and `.claude/agents/architect.md`, under Standards, add:

```diff
+- For each owner comment in your facts, add one `verified` row per requirement sentence in it, naming
+  the line of your document that meets it, or the line that records a deviation as a decision with the
+  comment id. A requirement you cannot place goes in `needs_decision` (L-0030).
```

What proves it was done: on the next issue with owner decisions in Jira, each product and architect envelope after the decision has the comment as a fact, and the first review raises no finding that a document is silent on or departs from an owner comment without a recorded decision.

Status: promoted 2026-10-26, into `.claude/skills/ovl/SKILL.md` (section 2, "Owner decisions reach every document they change"), `.claude/agents/product.md` (Standards, the owner comment bullet) and `.claude/agents/architect.md` (What you do, the owner comment bullet, since that file has no Standards section); no hook enforces it
