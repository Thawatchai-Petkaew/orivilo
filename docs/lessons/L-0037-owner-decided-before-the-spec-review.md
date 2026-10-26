---
id: L-0037
date: 2026-10-26
issue: [ORV-128]
what_happened: The owner decided D3 (a confidence floor of 0.5) at G1 on the reason that a model reading of 0.6 survives one mild factor, and the first review of PR 118, 49 minutes after the decisions were recorded, found that the spec's own factors put that reading at 0.48, under the floor.
cause: The ovl loop raises the G1 packet as soon as product returns the spec, and the gate-packet skill asks G1 for a spec link, a gap list and questions only, so no reviewer read the spec's numbers before the owner was asked to decide on them.
rule: A lane L G1 packet is raised only after a reviewer pass on the spec head; the packet names that review's task id and lists each open Important finding next to the decision it touches.
---

## What happened

Records are under `.orivilo/runs/ORV-128/`; tokens are `tokens.total` from `.orivilo/metrics/ORV-128.json`.

- `ORV-128-product-spec-2` (2,522,380 tokens, ended 13:53:51 UTC) wrote spec v1 with seven decisions and a recommended option each. D3's reason read that a model reading (base 0.6) survives one mild factor at a floor of 0.5.
- The G1 packet went out as ORV-128 comment 10208, and the owner chose D1 to D7 in comment 10209. `ORV-128-product-spec-3` (154,578 tokens, 13:57:53 to 13:58:19 UTC) recorded them as spec v1.1.
- `ORV-128-review-spec-1` (1,051,926 tokens, started 14:47:19 UTC, envelope facts cite comments 10208 and 10209) was the first review. Its F1 (Important): `node -e 'console.log(0.6*0.8, 0.6*0.7)'` prints `0.48 0.42`, both under 0.5, so "the owner decided D3 on a reason the numbers contradict". F2 and F3 (Important) were also in the v1 spec the owner decided on (see [[L-0038-spec-claims-a-command-disproves]] and [[L-0039-one-rule-stated-in-two-sections]]).
- The fix kept the owner's floor and changed what the reason rested on: `ORV-128-product-spec-4` (1,060,193 tokens) raised the model-reading base from 0.6 to 0.7 as the orchestrator's adjustment under D3 (ORV-128 comment 10215). Spec v1.2 line 318 records it as open for the owner at G2 (`grep -n "orchestrator" docs/specs/ORV-128/spec.md`). The owner has not yet seen the option that was chosen for them.
- `.claude/skills/gate-packet/SKILL.md` (G1 row: "spec link, gap list summary, questions") and `.claude/skills/ovl/SKILL.md` step 4 ask for no review before G1.

Not covered by a promoted lesson: [[L-0030-owner-decision-missing-from-the-spec-envelope]] makes an owner decision reach every document; this lesson is about the spec the owner decides on. [[L-0034-level-5-count-mixed-two-bases]] covers a count fact with no reproducing command, not a decision's reason.

## Rule

Proposed diffs, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, step 4:

```diff
-4. **G1 and G2.** Raise each with the `gate-packet` skill, move the issue, and stop. The owner decides; during the POC Claude passes G1 and G2 under the owner's delegation (ADR 0012 decision 4), and the packet says so.
+4. **G1 and G2.** For lane L, before the G1 packet, dispatch `reviewer` (`reviewer.v1`, docs) on the
+   committed spec head; Important findings go back to `product` before the packet, or each is listed in
+   the packet next to the decision it touches. The later G3 review of that spec is a re-check from the
+   reviewed sha (L-0008, L-0037). No hook checks this; it is the main session's duty. Raise each with
+   the `gate-packet` skill, move the issue, and stop. The owner decides; during the POC Claude passes G1
+   and G2 under the owner's delegation (ADR 0012 decision 4), and the packet says so.
```

In `.claude/skills/gate-packet/SKILL.md`, the "What each gate must contain" table:

```diff
-| G1 Scope         | spec link, gap list summary, questions |
+| G1 Scope         | spec link, gap list summary, questions; for lane L the spec review's task id and its open Important findings, each beside the question it touches (L-0037). No hook checks this |
```

What proves it was done: on the next lane L spec, a `review-spec` result exists with a `started_at` before the G1 packet comment, and the packet names its task id. No hook checks this; it is the main session's duty.

Status: promoted 2026-10-26, into `.claude/skills/ovl/SKILL.md` (The loop, step 4) and `.claude/skills/gate-packet/SKILL.md` ("What each gate must contain" table, the G1 Scope row); no hook enforces it
