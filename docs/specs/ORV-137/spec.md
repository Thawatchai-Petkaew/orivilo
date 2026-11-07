---
issue: ORV-137 (https://tpetkaew.atlassian.net/browse/ORV-137)
lane: S (docs only in this PR; the guard change is PR 2, ORV-137 comment 10246)
version: 1.1
---

# ORV-137: POC mode, the lean delivery rules for the main session (PR 1)

## Goal

The owner switched the POC to lean delivery on 2026-10-28 ("เปลี่ยนเลย"). The rules are in the ORV-137 description, section "In effect now", and have been followed since that date from the session's memory. This PR writes them into the repo, so every session reads the same rules from the `ovl` skill: one "POC mode" section that states the rules, names by lesson id each main-session duty it suspends and each it keeps, and ends when the owner says the POC is over.

It also writes the owner's component benchmark rule (ORV-137 comment 10247), which holds in POC mode too: a component is compared with Untitled UI and shadcn/ui before it is built. This matches the ORV-64 goal of variant depth comparable to Untitled UI (`docs/specs/ORV-64/audit.md` line 5).

Split (ORV-137 comment 10246): this PR is description item 1, docs only, merged on a reviewer approve and green CI. Item 2 (the rework count) is PR 2 on a later branch, merged with the owner approval line. Item 3 is folded into ORV-136.

## Acceptance criteria

| #   | Criterion                                                                                                                                                                                                                                                                                                                                                                                                                           | Check                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | `.claude/skills/ovl/SKILL.md` has a `## POC mode` section that states each rule of the description's "In effect now" list. The only additions are the `merge-check` sentence and the reading of the G3 evidence "two reviewer passes" in POC mode (review ORV-137-review-1, S-2 and I-2).                                                                                                                                           | `grep -n "POC mode" .claude/skills/ovl/SKILL.md`; read against the description |
| 2   | The section lists by lesson id each main-session duty of the loop and section 2 that POC mode suspends, and each it keeps. The kept list holds tests, `security` on every step 6 trigger (untrusted input, auth or data access, a path in `.claude/rules/security.md`, a model call or prompt, a new runtime dependency), no secrets, honesty labels, the quality gate, CI, merge-check, L-0025, L-0029, L-0045, L-0046 and L-0047. | Read the section                                                               |
| 3   | The section says that hooks and guards run unchanged, that a guard changes only with the owner approval line at merge, and that POC mode ends when the owner says the POC is over.                                                                                                                                                                                                                                                  | Read the section                                                               |
| 4   | The section states the component benchmark rule of comment 10247 as kept: the comparison table in the form of ORV-64 audit section B with the rows Untitled UI (with the URL), shadcn/ui, Ours, Add and Do not copy (with the reason), and the story's Thai and English stories for every variant and state, the Recipes and modes matrix and a designer visual sign-off.                                                           | Read the section                                                               |
| 5   | `.claude/rules/design-system.md` has the same benchmark rule as one bullet under Components.                                                                                                                                                                                                                                                                                                                                        | `grep -n "Untitled UI" .claude/rules/design-system.md`                         |
| 6   | `AGENTS.md` has one pointer line to the POC mode section, which also says how the G3 evidence "two reviewer passes" of rule 5 reads in POC mode, and stays under 100 lines.                                                                                                                                                                                                                                                         | `grep -n "POC mode" AGENTS.md`; `grep -c '' AGENTS.md`                         |
| 7   | No guard file, script or hook changes; every changed file is Markdown, so the PR is docs only.                                                                                                                                                                                                                                                                                                                                      | `git diff --name-only origin/develop...HEAD`                                   |
| 8   | No em dash and no middot in the changed text; Prettier clean.                                                                                                                                                                                                                                                                                                                                                                       | `pnpm format:check`                                                            |

## Out of scope

- Description item 2: the rework count change in the envelope guard. PR 2, later branch, needs the owner approval line at merge (comment 10246).
- Description item 3: the qa recorder rule, folded into ORV-136 (comment 10246).
- Any rule beyond the description and comments 10246 and 10247, including the improvement loop's cadence during the POC.
- Removing the POC mode section when the POC ends: a docs PR at that time.
- Editing ADR 0012 or the `gate-packet` skill: the POC mode section and the `AGENTS.md` pointer line say how their "two reviewer passes" reads in POC mode.

## Changelog

- v1.0: first version, description item 1 and comment 10247.
- v1.1: review ORV-137-review-1 on head 1a62f60. I-1: `security` keeps every step 6 trigger (AC 2). I-2: the G3 evidence "two reviewer passes" reads as the reviewer approve on the merged head (with, for a code PR, the qa approve on it, ADR 0013), plus a re-check for Critical or Important findings, and the G3 packet reports the passes that ran (AC 1, AC 6). I-3: L-0025 kept with its original duty (AC 2). S-1: L-0029 kept (AC 2). S-2: the `merge-check` sentence names the qa approve and the gate record for a code PR only, and a fix pushed after the approve needs a reviewer pass on the new head (AC 1).
