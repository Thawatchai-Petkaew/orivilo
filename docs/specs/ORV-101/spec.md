---
issue: ORV-101 (ORV-100 slice B; https://tpetkaew.atlassian.net/browse/ORV-101)
lane: L (risk flag: component public API), inherited from ORV-100
version: 1
---

## Why

ORV-101 is slice B of the TaskBar (ORV-100): the "Go to node" jump from a job row to the node it made, inside the board. Slice A shipped the bar on its own; this slice lets a person reach a job's result on a large board in one step, as ADR 0004 asks. Jobs still come from a prop and are labelled as mock data or worked out by rules; no job runner exists (AGENTS.md rule 4).

This file is the slice spec the result recorder reads. It adds no requirement of its own.

Not a guard spec; the guard frame (L-0012) does not apply.

## Full spec and gates

- Full spec: `docs/specs/ORV-100/spec.md` v1.6 (story, public API, states, i18n keys, rules and bounds, impact, out of scope, open questions, changelog). Slice B items there: Impact (`jumpToNode(id, options?: JumpOptions)`, `JumpOptions { select?: boolean }`, duration 0 under `prefers-reduced-motion`), changelog v1.4 to v1.6.
- G1: ORV-100 comment 10125. G2: ORV-100 comment 10126. ORV-101 inherits both (ORV-101 comment 10128); no new gate decision is needed for this slice.
- Design: `docs/specs/ORV-100/design.md` (D4, F2).
- Decisions: ADR 0003, ADR 0004, ADR 0009, ADR 0012.

## Acceptance criteria

Rows 14, 15 and 16 of the ORV-100 spec, copied with their numbers and text unchanged. For this slice, row 16 covers the stories `OnBoard`, `OnShortBoard` and `OnBoardReducedMotion`; the slice A stories were accepted with ORV-100.

| #   | Slice | Given                                                  | When                                                                                      | User sees                                                                                                                                                                                                                                                              | Data effect                       |
| --- | ----- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 14  | B     | A job whose `nodeId` is on the board                   | Pressing "ไปที่โหนด" / "Go to node" (name "ไปที่โหนดของ {name}" / "Go to node of {name}") | The board pans and zooms to the node, the node is selected and focused, and the board announces "ไปที่ {title}" / "Jumped to {title}" (existing `board.jumped`)                                                                                                        | Board selection becomes that node |
| 15  | B     | A job with no `nodeId`, or a `nodeId` not on the board | Rendering                                                                                 | No jump button on that row                                                                                                                                                                                                                                             | None                              |
| 16  | A, B  | Every story                                            | Storybook                                                                                 | Stories `application/TaskBar` (id `application-task-bar`) cover every state above with play tests, light and dark, under neutral, Professional and Friendly (`Matrix`), Thai and English; every story's description says its jobs are mock data or worked out by rules | None                              |

## Changelog

- v1 (2026-10-25): slice spec for ORV-101, pointing at ORV-100 spec v1.6 and carrying its rows 14 to 16 (task ORV-101-spec-1). Downstream review: none; the requirements are unchanged.
