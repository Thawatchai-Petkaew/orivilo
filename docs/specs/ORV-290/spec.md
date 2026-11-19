---
issue: ORV-290 (https://tpetkaew.atlassian.net/browse/ORV-290)
parent: ORV-280 (https://tpetkaew.atlassian.net/browse/ORV-280), docs/specs/ORV-280/spec.md v1.3
lane: L for the shared canvas component items D1, D2, D3, D4, D5 and S3; S for the other items
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode"), a slice spec
version: 1.0
---

# ORV-290: the canvas look items of the second polish PR (slice 1 of ORV-280 PR B)

## Why

This is a slice. ORV-280 is the one combined polish card for the canvas, the prototype page and the business screens. Its first PR, PR 220 (rows 1 to 9 and 11 to 18), is merged into `develop` as 01e0ad0. Its second PR, PR B, holds row 10 and rows 19 to 45 (parent spec, "Delivery"). PR B is delivered as two slice cards. This card, ORV-290, takes the look items that touch only the shared canvas components and the ORIVILO canvas prototype page. Rows 19, 24, 26 and 33 to 41 wait for a second slice card, created after ORV-285 PR 1 merges, because they change business board and business screen files that ORV-285 is changing.

It adds no requirement. Every acceptance row below is copied from `docs/specs/ORV-280/spec.md` v1.3 with its number and its cells, and the parent stays their source. Only row 42's Items, Given and sign-off cells name this slice ("How to read the copied rows").

Gates. G1 and G2 are the parent's: the G2 Plan of ORV-280 passed under the owner's POC delegation (ADR 0012 decision 4) on 2026-11-18, in ORV-280 comment 10711. It says PR B is lane L for its shared component items and that the designer goes first. The designer's rows are in `docs/specs/ORV-280/design.md`, written before any PR B builder runs (rule `look-row-1` of the parent spec). In this slice the lane L items are D1, D2, D3, D4, D5 and S3, which change `CanvasEdge`, `CanvasBoard`, `CanvasNode`, `NodePort` and `NodeGroup`; the other items change stories, fixtures and the prototype page.

What is real and what is simulated: nothing in this slice adds a capability. The stories run on fixture data, placement stays rule-based, and no text here says that a model read anything.

This spec is not a guard on a tool call, so the guard frame does not apply.

## Story

As the owner, I want the canvas look follow-ups of ORV-280 closed in one PR now, without waiting on the business screen work of ORV-285, so that the shared canvas components and the ORIVILO prototype page read cleanly in Thai and English, light and dark, at 360 and at 1440.

## Acceptance criteria

Tests use fixtures and run offline. No test reaches a model or the internet. Each look row's measure is the designer's row in `docs/specs/ORV-280/design.md` ("Where each row's measure lives").

<!-- prettier-ignore -->
| # | Items | Given | When | User sees | Data effect | Proven by |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | B15 | `NodePort` `PresentRecipesAndModes`, all six cells (three profiles, two modes), Thai and English | Rendering at 360 and at 1440 | The "View only" ("ดูอย่างเดียว") corner badge sits clear of every card and port dot; at rest no status pill (such as "Fitted 1 node to the view", "พอดีจอ 1 โหนด") lies over a card or a port dot | In every cell at 360 and at 1440 the badge's rect keeps a gap of 0 or more to every `.ds-node` rect and every `.ds-port__handle` rect; at rest no status pill rect meets a `.ds-node` or `.ds-port__handle` rect; the board component is unchanged; how the story gets there (board height, fit, card place) and any wider clearance are the designer's row for B15, recorded before the builder runs (`look-row-1`) | `PresentRecipesAndModes` play, passing in Storybook under a 360 and a 1440 window |
| 20 | D1 | A present board below zoom 1 (`KindsAndZoom` state rows at fit view) | Rendering | Every edge label pill shows whole, never under a card | The designer's row for D1 (`look-row-1`) | `KindsAndZoom` play |
| 21 | D2 | `ChainHighlight` (a selected node) and `PresentNames` (short column gaps) | Hover or select a node | A shown port name pill or source pill covers no other pill and no edge label | `expectPillsClear` also measures shown `.ds-port__label` and `.ds-node__source`; the designer's row for D2 | `ChainHighlight` and `PresentNames` plays |
| 22 | D3 | `NodeGroup` `Grouped`, the edit board, Thai | Rendering | The stale pill sits where the designer's row puts it relative to the group frame, not hanging under it | The designer's row for D3 | `Grouped` play |
| 23 | D4 | A present node with a long Thai title | Rendering at the zooms of `PresentNarrowLabels` | No empty gap shows after the ellipsis | The designer's row for D4 | `PresentNarrowLabels` play |
| 25 | D5 | A focused edge on a present board; the preview stage | Tab to an edge; open a preview | The focused edge shows the focus shape, a line with a halo, never the selected look; the stage corners follow the designer's row | The designer's row for D5 | `CanvasEdge` and `Dialog` `Viewer` plays |
| 27 | C2 | The palette preview, pages 2 to 6 | Paging | The swatch name and its hex read larger than today (heading-md and code-md) | The designer's row for C2 confirms the steps that sign-off 1 named (display-md for the name, heading-sm size for the hex) | Palette preview play: computed font size equals the step's token |
| 28 | C4 | Paper pages and paper tiles on the light stage | Rendering | Each page shows its bounds | The designer's row for C4 (sign-off 1 suggests a `border.subtle` hairline) | Plays on the brandbook and board previews |
| 29 | C5 | The form frame in 06 Design system | Rendering | The "Brand evidence report" heading shows whole | `expectNoGlyphClip` holds on the heading inside its frame | `DesignSystemChapter` play |
| 30 | C6 | The preview under 600 px | Rendering at 360 | The pager sits centred under the caption | The designer's row for C6; `expectInkCentred` or a centre check | `At360` or the preview play under a 360 window |
| 31 | C10 | The `c-demo` node | Rendering | The point numerals read at the step the designer's row names | The computed font size equals that step's token | `Default` play |
| 32 | B14 | `orivilo-canvas` `Default` (English) and `InThai` | Rendering at the fit zoom and at 1 | No port name pill comes nearer than 8 world px to another node's card or dot | `expectPortPillsClear` runs on the prototype board; the nodes it names move per the designer's row, and the design's "Layout numbers" record the new positions | `Default` and `InThai` plays |
| 42 | B14, B15, C2, C4-C6, C10, D1-D4, D5 (the two parts row 25 holds), S1-S3 | The ORV-290 PR head | Quality gate | Not a screen | As row 18 of the parent spec, and the designer's visual sign-off on this slice's PR | Gate output; sign-off |
| 43 | S1 | `CanvasEdge` `KindsAndZoom` and `KindsAndZoomInEnglish`, the edit board | Rendering at every zoom the story shows (row 9's 0.25, 1 and 2, and the fit zoom) | Stacked cards read as separate cards at every zoom, with a gap the person can see between them | The vertical gap between stacked cards is at least the designer's row for S1 (`look-row-1`; the sign-off suggests 16 world px or more, a fixture gap of 163 or more, W4); row 9's no-intersection, width and dash assertions hold | `KindsAndZoom` play |
| 44 | S2 | `NodePort` `KindsInEnglish` and `ConnectedInEnglish` | Rendering in English | Every node title and port row name reads in English, as "Strings" gives S2's copy ("All kinds", "Source", "Target"; "text", "image", "palette", "type", "profile"); the Thai stories `Kinds` and `Connected` keep "ทุกชนิด", "ต้นทาง", "ปลายทาง" and the Thai port names; the look follows the designer's row for S2 (`look-row-1`) | The visible text (`innerText`) of each English story's board holds no Thai character; the handle names of row 2 hold unchanged | `KindsInEnglish` and `ConnectedInEnglish` plays |
| 45 | S3 | `CanvasBoard` `OpenNode` and `OpenNodeInEnglish`: the third board without `onNodeOpen`, and the boards with it | Rendering | What the designer's row for S3 decides (`look-row-1`). By default (open question 8): on the board without `onNodeOpen` the node shows no open glyph and keeps its page count as content ("3 pages", "3 หน้า"); on a board with `onNodeOpen` the glyph shows as today | By default `.ds-node__open` is absent from every node of a board without `onNodeOpen` and visible on an open node of a board with it; every `CanvasNode` and `CanvasBoard` story that asserts `.ds-node__open` passes; `canvas-node.yaml` states the rule beside its `aria-haspopup` line (row 4) | `OpenNode` and `OpenNodeInEnglish` plays; `CanvasNode` plays |

How to read the copied rows:

- Row 42 is the parent's row 42 cut to this slice. Its Items cell names this slice's 15 items: B14, B15, C2, C4, C5, C6, C10, D1, D2, D3, D4, the two parts of D5 that row 25 holds (the focused edge and the stage corners), S1, S2 and S3. Its Given reads the head of this slice's PR, and its sign-off is the designer's visual sign-off on this slice's PR. The parent's row 42 items that are not here (B1 to B7, B9 to B11, B13, B17, B18, C1, C3, and D5's 360 dock part of row 24) go to the second slice card.
- "Row 18" (row 42), "row 9" (row 43), "row 2" (row 44) and "row 4" (row 45) are rows of the parent spec, merged in PR 220 and not copied here.
- `look-row-1`, "Strings" (row 44), "W4" (row 43) and "open question 8" (row 45) are the parent spec's rule, section, worked example and open question of those names. The design's "Layout numbers" (row 32) is the table of `docs/specs/ORV-274/design.md` section 3.
- Row 45's "By default" is settled: the designer's row for S3 takes option (a) of open question 8.

### Where each row's measure lives

Each look row points to its section of `docs/specs/ORV-280/design.md`, section 2:

- Row 10: "Row 10, B15: the "View only" badge clear of every card and dot".
- Row 20: "Row 20, D1: an edge pill is drawn only where it is whole and clear".
- Row 21: "Row 21, D2: a shown pill covers no other pill".
- Row 22: "Row 22, D3: the stale pill drawn over the group frame".
- Row 23: "Row 23, D4: no empty gap after a cut Thai title".
- Row 25: "Row 25, D5: the focused edge, and the stage corners".
- Row 27: "Row 27, C2: the palette preview names and hex read larger".
- Row 28: "Row 28, C4: paper pages show their bounds".
- Row 29: "Row 29, C5: the "Brand evidence report" heading shows whole".
- Row 30: "Row 30, C6: the pager centred under 600".
- Row 31: "Row 31, C10: the `c-demo` point numerals at `label-sm`".
- Row 32: "Row 32, B14: no port pill within 8 world px of another node".
- Row 42: "Rows 18 and 42: gates", and section 3, "Screens for visual QA", items 1, 3, 4, 6, 7, 8 and 11 for the screens of this slice.
- Row 43: "Row 43, S1: stacked cards read as separate cards".
- Row 44: "Row 44, S2: the English stories read in English".
- Row 45: "Row 45, S3: no open glyph on a board that cannot open".

## Rows per PR

- PR 230: rows 10, 20-23, 25, 27-32, 42-45

## Rows that render nothing

- Rows: 42

## Decisions taken for this slice

Taken on 2026-11-19 by the main session under the owner's POC delegation (ADR 0012 decision 4), on the open points of `docs/specs/ORV-280/design.md` section 4. The owner can change any of them.

- **D1 (row 20).** At the 0.25 fit zoom an edge shows its line only, and its pill returns on zoom.
- **C4 (row 28).** The page hairline token is `border.subtle`.
- **B14 (row 32).** The prototype board grows to about 4912 world px wide, and the overview fit at 1440 lands on the 0.25 floor.
- **B15 (row 10).** The story height route: a cell under 554 px renders its board 540 px tall, and the board component is unchanged.

The other points of design section 4 (B11, B10 and B17, B3) belong to rows of the second slice card and stay open.

## No-look item: review S1 of PR 220

Review S1 of PR 220 (ORV-280 comment 10720, carried in comment 10728): the nodes memo of `CanvasBoard` depends on the identity of `onNodeOpen`, so a page that passes an inline handler remaps every node on each render. This PR fixes it as `docs/specs/ORV-280/design.md` section 2, "Review S1: no look, for the builder", gives it: a `canOpen` boolean read from `onNodeOpen`, used where the node data is mapped and in the memo's dependency list in place of the handler. It adds no row and changes nothing a person sees. Proven by: `pnpm typecheck` passes, and the `CanvasBoard` `OpenNode` and `OpenNodeInEnglish` plays pass unchanged.

## Out of scope

- Rows 19, 24, 26 and 33 to 41 of the parent spec, and their items C1, C3, D5's 360 dock part, B1 to B7, B9 to B11, B13, B17 and B18: the second slice card, after ORV-285 PR 1 merges.
- Rows 1 to 9 and 11 to 18 of the parent spec: PR 220, merged.
- Everything the parent spec's "Out of scope" lists (B8, B12 and N1 Deferred, the zoom-in cursor without `onNodeOpen`).
- Any new feature, screen, token or locale key (S2's English titles are story fixture data, parent "Strings").

## Depends on

- `docs/specs/ORV-280/spec.md` v1.3: rules `look-row-1` and `polish-split-1`, rows 2, 4, 9 and 18, "Strings", "Delivery", open question 8 and W4.
- `docs/specs/ORV-280/design.md`: section 2 (the rows above and "Review S1"), section 3 and section 4 with the four decisions of 2026-11-19.
- ORV-280 comment 10711 (the G2 Plan under the owner's POC delegation), comment 10720 (review of PR 220, S1 and S2) and comment 10728 (the G3 packet of PR 220).
- PR 220, merged into `develop` as 01e0ad0 (rows 2, 4, 9 and 18, and the third board without `onNodeOpen` of row 45).
- Slice 3 of ORV-281, ORV-283, on this branch (`polish-split-1`).
- `docs/specs/ORV-274/spec.md` v2.5 and `design.md` section 3 ("Layout numbers"); `DESIGN.md`; `.claude/rules/design-system.md` and `.claude/rules/testing.md` (`packages/design-system/src/testing/visual-asserts.ts`).
- ADR 0012 decision 4 (the owner's POC delegation).

## Changelog

- v1.0 (2026-11-19): first version, task ORV-290-spec-1. The slice spec of ORV-280 PR B for the shared canvas components and the ORIVILO canvas prototype page: rows 10, 20 to 23, 25, 27 to 32 and 43 to 45 copied from the parent spec v1.3 with their numbers and cells, and row 42 cut to this slice's items and sign-off; no new requirement, no row renumbered. Records the four decisions of design section 4 (D1, C4, B14, B15) and review S1 of PR 220 as a no-look item. To review downstream: the ORV-290 builder envelope (its objective cites these rows and the design sections), the designer's sign-off envelope, the reviewer and qa envelopes for this slice's PR.
