---
issue: ORV-282 (https://tpetkaew.atlassian.net/browse/ORV-282)
parent: ORV-281 (https://tpetkaew.atlassian.net/browse/ORV-281), docs/specs/ORV-281/spec.md v1.1
lane: L (inherited from ORV-281)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode"), a slice spec
version: 1.0
---

# ORV-282: the business nodes on a present board (slice 2 of ORV-281)

## Why

This is a slice. ORV-281 ships in three pull requests (parent spec, "Delivery: three slices"): slice 1 saves the intake and shows the five node views stacked (PR 214), slice 2 puts the business nodes on a read-only present board with a viewer per node, and slice 3 has ORIVILO read the business. This issue is slice 2, made its own Jira issue so that its PR carries its own key. It adds no requirement: every row, rule and string below is copied word for word from `docs/specs/ORV-281/spec.md` v1.1, and the parent stays their source. The parent's "Rows per PR" names this slice's rows as "PR B: rows 22-26".

The parent's intent holds unchanged: the business stage is the start of a board (parent spec, "Delivery: three slices", slice 2). The person who told ORIVILO about their business sees it saved as the first nodes of their board, and opens each node to read what they said, where it was placed, and what is still to ask (parent spec, "Story").

Gates. G1 and G2 for this slice are the parent's: they passed on ORV-281 under the owner's POC delegation (ADR 0012 decision 4), recorded in ORV-281 comment 10673. The same comment decides N1 option (a) of `docs/specs/ORV-281/design.md` section 11: a business node opens without a page count. The parent spec v1.1 records that decision as the one shared component change of this slice ("Impact on contracts" below, and row 23).

What is real and what is simulated: the parent's section "What is real, rule-based and simulated" holds for this slice as written. In this slice: real, the board built from the shared canvas components of PR 211 and the node views of slice 1 inside the viewer; rule-based, not AI, the node states and the placement of answers, both made in slice 1; read by a model, nothing, since no model reading exists before slice 3 and nothing in this slice says ORIVILO reads a business with AI; simulated, nothing in the product, and the Storybook stories run on labelled fixture projects.

This spec is not a guard on a tool call, so the guard frame does not apply.

## Story

As a founder or product owner who is signed in and has saved a business, I open my project and see its five business nodes as the start of my board, read-only, and open each node to read its view (parent spec, "Story" and "Delivery: three slices", slice 2).

## Rules

Copied word for word from the parent spec's "Rules" section: `business-board-1`, the rule this slice builds. The other rules the copied rows lean on are not copied and stay in the parent spec:

- `node-state-1` (parent spec, "Rules"): the state each node shows, the gate line on `positioning`, and the still-to-ask list (rows 23 and 24).
- `honest-business-1` (parent spec, "Rules"): the label each kind of content carries in a node view (row 23, through row 14).

### business-board-1

The project screen shows a read-only board made of the shared canvas components of PR 211, in the present look: `CanvasBoard`, `CanvasNode`, `NodePort`, `CanvasEdge` and `CanvasControls` with `position="center"`, whose dock shows `board.readOnly`. It holds the five nodes and the six edges of "The whole structure", and reads left to right in ORV-126's fill order: `situation`, then `business-core`, `audience` and `competitive-frame`, then `positioning`. Opening a node (`onNodeOpen`, by pointer or keyboard) shows that node's view in `Dialog` with `size="viewer"`: its state, its fields with their content and labels, and its still-to-ask list. Nothing can be dragged, connected or edited. Positions, the node card at rest and the open label are the designer's at G2.

"The whole structure" in this rule is the parent spec's section of that name (`docs/specs/ORV-281/spec.md`, lines 9 to 25). The positions, the node card at rest and the open label are in `docs/specs/ORV-281/design.md` section 6.3 and section 11 (N1, decided as option (a) in ORV-281 comment 10673).

## Impact on contracts

Copied word for word from the parent spec's "Impact on contracts": the one bullet of this slice, which row 23 cites as "Impact on contracts", UI. The other bullets belong to slices 1 and 3.

- **UI, `CanvasNode` open without a count (slice 2, a component public API change, lane L flag).** One additive change to the shared `CanvasNode`: `NodeContent.open` (`packages/design-system/src/components/canvas-board/graph.ts`) becomes `{ count?: number }`. With no `count`, the title row ends with the open glyph only, with no pages word (`node.pages`), and the accessible name is `graph.nodeLabel` in place of `graph.nodeOpenLabel` (`nodeOpenLabel` returns `nodeLabel`); `aria-haspopup="dialog"`, the zoom-in cursor and `onNodeOpen` stay. A business node opens with no page count, because it opens one view, not pages (decision N1 option (a) of the design's section 11, ORV-281 comment 10673; option (b) would show "3 pages" and "1 pages", a false label, AGENTS.md rule 4). The catalog entry `packages/design-system/catalog/application/canvas-node.yaml` changes its `NodeContent.open` rule to say `count` is optional and what shows without it, and the change brings one story in `CanvasNode.stories.tsx`, `OpenWithoutCount` (name a suggestion), in Thai and English, which asserts the glyph, no pages word and the `graph.nodeLabel` name. Every existing caller of `open` passes a count (the `CanvasNode` and `CanvasBoard` stories, among them `OpenNode`, and `graph.test.ts`) and renders as before: the same pages word, glyph and `graph.nodeOpenLabel`. No new copy, no token change.

## Strings

Copied word for word from the parent spec's "Strings" table: the keys the copied rows and `business-board-1` show on the board. The parent's "Strings" stays their home, with its note that each is the copy of record and a draft for the owner's copy review.

<!-- prettier-ignore -->
| Key | English | Thai |
| --- | --- | --- |
| `business.node.situation` | Situation | สถานการณ์ตั้งต้น |
| `business.node.businessCore` | Business core | แก่นธุรกิจ |
| `business.node.audience` | Audience | กลุ่มลูกค้า |
| `business.node.competitiveFrame` | Competitive frame | ตลาดและคู่แข่ง |
| `business.node.positioning` | Positioning | จุดยืน |
| `business.state.skipped` | Skipped for now | ข้ามไว้ก่อน |
| `business.state.gate` | A gate: nothing builds on this until you agree to it. | จุดตัดสินใจ: ยังไม่มีขั้นใดต่อยอดจากตรงนี้จนกว่าคุณจะเห็นชอบ |
| `business.board.lede` | What you told us, placed on the first nodes of your board. Nothing here is confirmed yet. | สิ่งที่คุณเล่า วางไว้บนโหนดแรกของกระดาน ยังไม่มีข้อใดได้รับการยืนยัน |
| `business.board.label` | Business board | กระดานธุรกิจ |

Reused as they are, not new: `board.readOnly` (PR 211), as the parent's "Strings" names it; `graph.nodeLabel` and `graph.nodeOpenLabel`, the shared canvas keys in `packages/design-system/src/i18n/messages/en.ts` and `th.ts` (group `graph`), which the copied "Impact on contracts" bullet names. `business.board.label` is the accessible name of the board region, the `label` of `CanvasBoard` (`business-board-1`), as the parent's "Strings" says. The node view's own strings (field labels, states, `business.label.yourWords`, `business.stillToAsk`, the question copy) are slice 1's and stay in the parent's "Strings".

## Acceptance criteria

Tests use fixtures and a fake network; none reaches the internet or a model (parent spec, "Acceptance criteria"). Screen rows are proven on stories of the board screen on labelled fixture projects, in both languages, and on the page test in `apps/web`. Files and tests per `docs/specs/ORV-281/tech.md` section 12, "Slice 2, PR B (rows 22 to 26)": tasks B1 and B2, tests T26 and T27 of section 13.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 22 | A saved project, slice 2 | They open its board | The read-only present board under `business.board.lede`: five nodes titled Situation, Business core, Audience, Competitive frame and Positioning (สถานการณ์ตั้งต้น, แก่นธุรกิจ, กลุ่มลูกค้า, ตลาดและคู่แข่ง, จุดยืน), six edges, and the dock with "View only" ("ดูอย่างเดียว") | The edges are exactly the six of W2; nothing can be dragged or connected | Story `Board`, play; page test |
| 23 | The board | They click a node; then Tab to another and press Enter, then Space; then Escape | The node's view in the viewer dialog, with the content row 14 names for that node; Escape closes it. Each node's title row ends with the open glyph and no page count, and its accessible name is `graph.nodeLabel` with no page count (`CanvasNode` open without a count, "Impact on contracts", UI) | `onNodeOpen` once per gesture with that node's id; focus returns to the node; the viewport does not move | Story `Board`, play |
| 24 | A board whose project skipped audience, competitors and value | It renders | `business.state.skipped` on Audience, Competitive frame and Positioning, Positioning with its gate line | None | Story `Skipped`, play |
| 25 | The board, keyboard only, light and dark, a 360 px viewport | They Tab through it | Focus visible on the dock and each node in fill order; no horizontal scroll | Zero a11y violations | Stories `Board` and `Narrow`; a11y addon |
| 26 | The slice 2 head | The gate runs | No UI | No new shared component; every story of the canvas components PR 211 changed still passes its play; gate as row 21; `pnpm contrast` unchanged from `develop` | Gate output |

How to read the copied rows:

- "Slice 2" in rows 22 and 26 is this issue's PR; "the slice 2 head" in row 26 reads as the head of this issue's PR. Its PR has no number yet.
- Row 22's "W2" points to W2 of the parent spec's "Worked examples" (`docs/specs/ORV-281/spec.md`, lines 390 to 394): the six edges `situation>business-core`, `situation>audience`, `situation>competitive-frame`, `business-core>positioning`, `audience>positioning`, `competitive-frame>positioning`, as that example's expected output gives them.
- Row 23's "the content row 14 names for that node" points to row 14 of the parent spec (`docs/specs/ORV-281/spec.md`, line 288), which ships in PR 214 (slice 1) and is not copied here. Read it per node: the content row 14 lists for one node view, shown inside the viewer, not the page header row 14 also names.
- Row 23's "Impact on contracts", UI is the bullet copied under "Impact on contracts" above.
- Row 24's "its gate line" is `business.state.gate`, set by `node-state-1` in the parent spec.
- Row 26's "gate as row 21" points to row 21 of the parent spec (`docs/specs/ORV-281/spec.md`, line 295), which ships in PR 214 and is not copied here. "PR 211" in rows 23 and 26 is ORV-274's shared canvas components PR.
- Row 26's "No new shared component" and row 23's change to `CanvasNode` agree: the change is to the existing `CanvasNode`'s API, and no component is added.
- Rows 1 to 21 are slice 1 (PR 214) and rows 27 to 35 are slice 3, so the numbers start at 22 and stop at 26.

## Rows that render nothing

This copied row shows no screen; the parent's list holds it with rows 1-4, 13, 21, 27-30, 32, 34 and 35, which are not in this slice.

- Rows: 26

## Design and tech notes

Not copied. They live in the parent folder:

- Design: `docs/specs/ORV-281/design.md`, section 5 (the node view, used inside the viewer with no heading of its own), section 6.3 (the present board: positions, the graph, the card at rest, the viewer), section 6.4 (the board states of slice 2), section 11 (N1, decided as option (a) in ORV-281 comment 10673) and section 12 (the screens for visual QA of slice 2).
- Tech notes: `docs/specs/ORV-281/tech.md`, section 9 (the "Slice 2" bullet: `boardGraphOf`, the viewer), section 12 ("Slice 2, PR B (rows 22 to 26)"), and tests T26 and T27 in section 13.
- Where the notes disagree with the copied rows: `tech.md` section 9 (line 374) and section 14 (lines 505 and 509) say no shared component changes. The copied "Impact on contracts" bullet and row 23 hold, as parent spec v1.1 change 5 records from ORV-281 comment 10673; the parent's v1.1 changelog lists those tech sections for review.

## Out of scope

- Rows 1 to 21 of the parent spec (PR 214, slice 1: the intake, its checks, the save and the stacked node views) and rows 27 to 35 (slice 3: ORIVILO reads the business).
- Everything the parent spec's "Out of scope" lists.

## Open questions

None. One default: this spec has no "Rows per PR" section, because this issue's PR has no number yet, so the qa walk covers every row of the table above (rows 22, 23, 24, 25 and 26).

## Depends on

- `docs/specs/ORV-281/spec.md` v1.1: its rules (`business-board-1`, `node-state-1`, `honest-business-1`), rows 14, 21 and 22 to 26, "Strings", "Impact on contracts", "Delivery: three slices" and "Worked examples" (W2).
- ORV-281 comment 10673: G1 and G2 under the owner's POC delegation; N1 option (a), `CanvasNode` open without a page count.
- PR 214 (ORV-281 slice 1): the board screen, the node views and the fixtures this slice moves into the board. This slice waits on it (parent spec, "Delivery: three slices").
- ORV-274 spec v2.5 and PR 211: the present board, `onNodeOpen`, `CanvasControls` `position="center"`, `Dialog` `size="viewer"`, `board.readOnly`.
- The parent's "Depends on" list, which holds for this slice as written.

## Worked examples

This slice derives no number of its own. Row 22 cites W2, which lives in the parent spec's "Worked examples" with its `node -e` line and expected output; it is not copied here.

## Changelog

- v1.0 (2026-11-18): first version, task ORV-282-spec-1. The slice spec of ORV-281 for its second PR (the business nodes on a present board with a viewer per node): rows 22-26, the rule `business-board-1`, the slice 2 bullet of "Impact on contracts" and nine strings, copied word for word from the parent spec v1.1; no new requirement, no row reworded or renumbered. Downstream to review: the ORV-282 builder envelopes (tasks B1 and B2 of the parent tech notes), the security envelope if one is raised, and the qa envelope for this issue's PR.
