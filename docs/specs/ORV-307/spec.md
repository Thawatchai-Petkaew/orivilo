---
issue: ORV-307 (https://tpetkaew.atlassian.net/browse/ORV-307)
parent: ORV-302 (https://tpetkaew.atlassian.net/browse/ORV-302), docs/specs/ORV-302/spec.md v1.3
lane: L (the parent's lane and risk flags: a page that reads a saved project's stored workspace data through the existing loader and the central authorization helper, and the engine contract of the guidebook assembly over the business view)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode"), a slice spec
version: 1.0
---

# ORV-307: the drafted positioning in the brand guidebook (slice 2 of ORV-302, PR 2)

## Why

This is a slice. ORV-302 builds the first brand guidebook in two PRs (parent spec, "Delivery: two PRs"). PR 1, the guidebook of the foundation and the visual items (rows 1 to 19 and 23), is PR 244, merged into `develop`. This card, ORV-307, is PR 2, the drafted positioning: the guidebook shows a positioning that waits for the person to choose among drafted options as waiting, never as a decision, and shows a picked option with the label the board shows.

PR 1 had a rejecting verdict and a rework round, so this second PR of new work runs on a card of its own, ORV-307, rather than on ORV-302.

The split into two PRs was decided under the owner's POC delegation in ORV-302 comment 10786: PR 1 waited on ORV-298 in `develop`, and PR 2 waits on ORV-292 (positioning options drafted by AI) in `develop`. ORV-292 is now in `develop`, and this branch starts from that `develop`.

ORV-292's code review recorded as Suggestion R3 (ORV-292 comment 10813) that a picked AI draft shows on the guidebook with no label until this slice lands. So this slice merges into `develop` before the next release from `develop` to `main`.

Rows 20 to 22 below are copied from `docs/specs/ORV-302/spec.md` v1.3 with their numbers and their cells, unchanged, and the parent stays their source. This slice adds no requirement and no row.

Gates. G1 is the parent's. It covers rows 20 to 22 and the parent's twelve open questions with their defaults, and passed under the owner's POC delegation (ADR 0012 decision 4) in ORV-302 comment 10785. The design of this slice is already written in the parent's tech notes: section 8 (PR 2: the drafted positioning), the tasks B1 and B2 of section 12, and the tests T36, T37, T40 and T41 of section 13; and in the parent's design, section 14 (PR 2: positioning states) with the plays P15 (grown), P22 and P23 of section 16.

This spec is not a guard on a tool call, so the guard frame does not apply.

### What is real

- **Real once built:** the two positioning states of the guidebook over ORV-292's view as merged, waiting for a choice and picked, and the label line of a picked statement on the guidebook screen.
- **Rule-based, not AI:** the guidebook is assembled by fixed rules from the stored entries of one saved project (parent `guidebook-assembly-1`). This slice makes no model call: opening the guidebook calls no model.
- **Drafted by AI, labelled:** the one AI label the page can show is the board's label on a positioning the person picked or edited from drafted options, with the saved model id (parent `guidebook-honest-1`, open question 10 default (a)). The drafted text itself came from ORV-292's model call, made earlier on the board, not from this slice.
- **Not shown:** a draft that waits for a choice shows no option text and no AI label on the guidebook.
- **Simulated:** nothing in the product. Stories run on labelled fixture projects; tests use fixtures and never reach a model.

## Story

As a founder or product owner who is signed in and has asked ORIVILO to draft positioning options on my board, I want my brand guidebook to show that positioning as waiting for my choice until I pick one, and then to show the one I picked with the label that says AI drafted it and I picked it, so that a drafted option is never read as a decision and I always know which words a model drafted.

## Acceptance criteria

Tests use fixtures; none reaches the internet or a model. Screen rows are proven on stories of the guidebook screen on labelled fixture projects, in both languages. Test and story names are suggested. A row states the values its test asserts; the rule that makes them is defined once, in the parent spec section its name points to ("How to read the copied rows").

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 20 | ORV-292 in `develop`; a project with a stored draft of three options and no choice; then option 2 picked | They open the guidebook; then again after the pick | First: Positioning "รอให้คุณเลือก" ("Waiting for your choice") with no "Still to ask", no question, no option statement and no AI label; the foundation items that are not given "Waits for Positioning". Then: Positioning with option 2's statement, the label the board shows, "Drafted by AI (anthropic/claude-sonnet-5.5) and picked by you.", "Agreed"; options 1 and 3 nowhere on the page | First: `positioning` open with gate `awaiting-choice`; then `positioning` method `ai-draft-picked`; no draft text in the data while no option is picked | `guidebook.test.ts` › "a draft is not a decision"; stories `GuidebookAwaitingChoice` and `GuidebookPicked`, play |
| 21 | Fixture projects holding, together, every state of row 20 | They read each guidebook | As row 9, with the one exception of `guidebook-honest-1` on the picked positioning of row 20 only | As row 9, the model id inside the picked label excepted (open question 10) | Story `GuidebookNoAi` (grown by the states of row 20), play |
| 22 | The PR 2 head, with ORV-292 in `develop` | The gate runs | No UI | Gate as row 16; PR 2 adds no key of its own; `business.positioning.by.picked` and `business.positioning.by.edited` are ORV-292's keys in `develop`, read and not copied | Gate output |

### How to read the copied rows

- "PR 2" (row 22) is this slice's PR, the second PR of the parent's "Delivery: two PRs".
- "Row 9" (row 21) and "row 16" (row 22, "Gate as row 16") are rows of the parent spec, merged with PR 244 and not copied here. Row 9 defines what "no AI label, no claim" asserts; row 16 defines what the gate asserts.
- `guidebook-honest-1` (row 21, and the six AI labels it lists) is the parent spec's rule of that name, defined once there, with its one exception for a picked or edited positioning. The parent's `guidebook-open-1` (its bullet "Positioning waiting for a choice") and `guidebook-item-1` (its `positioning` row, the method `ai-draft-picked`) define the two states of row 20.
- "Open question 10" (row 21) is the parent spec's open question 10, with its default (a): the guidebook shows the board's label on a picked positioning.
- The label "Drafted by AI (anthropic/claude-sonnet-5.5) and picked by you." (row 20) is `business.positioning.by.picked` with the fixture's saved model id, as ORV-292's row 18 shows it on the board. The edited label, `business.positioning.by.edited`, is part of the parent's `guidebook-item-1` and the parent design section 14; no copied row names an edited fixture.
- The test names (`guidebook.test.ts` › "a draft is not a decision") and the story names (`GuidebookAwaitingChoice`, `GuidebookPicked`, `GuidebookNoAi`) are the parent's; the parent tech notes section 13 maps them to T36, T37, T40 and T41.

## Rows that render nothing

- Rows: 22

## Out of scope

- Any change to ORV-292's view, catalog keys or stories: this slice reads them as ORV-292 left them in `develop`.
- Any new catalog key (row 22).
- Rows 1 to 19 and 23 of the parent spec: PR 244, in `develop`.
- Pressing "Draft options from my answers" on staging: that is a real model call, and it needs the owner's confirmation.
- Everything the parent's "Out of scope" lists.

## Depends on

- `docs/specs/ORV-302/spec.md` v1.3: rows 9, 16 and 20 to 22; the rules `guidebook-assembly-1`, `guidebook-item-1`, `guidebook-open-1` and `guidebook-honest-1`; "Delivery: two PRs"; open question 10 with its default (a).
- `docs/specs/ORV-302/tech.md`: section 8 (PR 2: the drafted positioning), the tasks B1 and B2 of section 12, the tests T36, T37, T40 and T41 of section 13.
- `docs/specs/ORV-302/design.md`: section 14 (PR 2: positioning states) and the plays P15, P22 and P23 of section 16.
- `docs/specs/ORV-292/spec.md` v1.5: rows 17 to 19 and 24 (the drafted options, their labels, "Waiting for your choice"), in `develop`.
- ORV-302 comment 10785 (G1 under the owner's POC delegation) and comment 10786 (the split into two PRs).
- ORV-292 comment 10813 (Suggestion R3 of its code review: the guidebook shows a picked draft with no label until this slice lands).
- ADR 0012 decision 4 (the owner's POC delegation of G1 and G2).

## Changelog

- v1.0 (2026-11-21): first version, task ORV-307-spec-1. The slice spec of ORV-302 PR 2: rows 20 to 22 copied from the parent spec v1.3 with their numbers and cells, no requirement added, no row added and no row renumbered; row 22 under "Rows that render nothing", as in the parent. No Jira tool call and no shell in this role, so the gate comments and the state of `develop` were taken from the envelope's facts. To review downstream: the B1 and B2 builder envelopes of the parent tech notes section 12, the `security`, reviewer, designer sign-off and qa envelopes of this slice's PR.
