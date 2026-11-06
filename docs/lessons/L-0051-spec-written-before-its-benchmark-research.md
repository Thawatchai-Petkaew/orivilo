---
id: L-0051
date: 2026-11-06
issue: [ORV-217]
what_happened: The ORV-217 spec wrote its component benchmark before any research and marked the cells no knowledge entry answered as open research needs, so a research task and then a spec revision that only refilled those cells ran before the design.
cause: The spec envelope told product to build the benchmark from the existing entries and mark gaps, and no step has the main session check the benchmark rows against `docs/knowledge/design/` before it dispatches the spec, so the order ORV-201, ORV-203 and ORV-211 used (research first) depended on the main session's choice.
rule: Before a component story's spec envelope, the main session checks each benchmark row against `docs/knowledge/design/`; a row no entry answers gets a research envelope first, and the spec envelope carries the new entry ids and never asks for an open research need cell.
---

## What happened

Records are under `.orivilo/runs/<ISSUE>/`; ORV-217 tokens are `tokens.total` from `.orivilo/metrics/ORV-217.json` (`node scripts/ovl/metrics.mjs report ORV-217`, saved as `.orivilo/metrics/orv-217-retro.md`).

- `ORV-217-spec-1` (product, 2,060,000 tokens): the objective said the benchmark is "built from the existing knowledge entries and audit section C; any cell with no entry is marked as an open research need". Its report's open question 5 named the Untitled UI Messaging, shadcn/ui Bubble and Message Scroller, and AI Elements Message and Conversation cells as open research needs, with the default "one research task adds knowledge entries, then a spec revision fills those cells before the builder envelope".
- `ORV-217-research-1` (2,363,178 tokens) then wrote K-0136 to K-0143.
- `ORV-217-spec-2` (product, 782,316 tokens) revised the spec to v1.1 to "fill every 'open research need' cell of both benchmark tables from K-0136 to K-0143, close open question 5", with one ORV-105 AC 11 note. Its `done_when` counted `open research need` down to 0.
- ORV-201, ORV-203 and ORV-211 ran `research-benchmark` before `spec-1` (envelope times on 2026-11-01, +07: 12:34 before 12:47, 13:51 before 13:58, 22:25 before 22:35). In each, the first spec revision folded the design amendments, and two product tasks ran before `build-1`. ORV-217 had three (`spec-1`, `spec-2`, `spec-3`). Those three issues have no collected metrics, so their tokens are not compared here.

The component benchmark bullet (`.claude/skills/ovl/SKILL.md`, POC mode, and `.claude/rules/design-system.md`) says what the table holds, not when its research runs. No lesson covers the order.

## Rule

Proposed diff, for the owner to approve. No rule file is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, section POC mode, the component benchmark bullet (lines 127 to 132), after "with these rows: ... Do not copy (with the reason).":

```diff
+  Before the spec envelope, check each row against `docs/knowledge/design/` (`git grep -l -i
+  '<system> <component>' docs/knowledge/design`). A row that no entry answers gets a `research`
+  envelope first; the spec envelope then carries those entry ids in `context_pointers` and never asks
+  product to mark a cell as an open research need (L-0051).
```

What proves it was done: in the next component story, the research envelope for any unanswered row is bound before the spec envelope, and `grep -c 'open research need' docs/specs/<KEY>/spec.md` is 0 in the spec's first version.

Expected effect, not a measured proposal (n=1, so no `## Expected saving`): one product revision per such story (782,316 tokens here). Guard metric: every benchmark cell of the first spec version cites a K entry or a URL, and the number of product tasks before `build-1` does not rise.

Status: proposed
