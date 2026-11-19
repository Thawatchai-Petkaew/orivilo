---
issue: ORV-280 (https://tpetkaew.atlassian.net/browse/ORV-280)
lane: S for PR A; L for the PR B items marked "lane L" under "Impact on contracts"
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.3
---

# ORV-280: one polish batch for the canvas, the prototype page and the business screens

## Why

ORV-280 is the one combined polish card. The owner's rule of 2026-10-31 says small UI comments go into one card and one PR series, not one issue each. The card collects the follow-ups that reviews of PR 211 (ORV-274, shared canvas components), PR 213 (ORV-278, the ORIVILO canvas page), PR 214 (ORV-281 slice 1) and PR 216 (ORV-282, slice 2) left open. Closing them makes the canvas say the right words to a screen reader, keeps its tests honest, makes the docs match the build, and fixes the look faults that designers and QA found.

The card holds 44 items (W1): D1 to D15 from the description, C1 to C11 and B1 to B18 from its 11 comments, copied on 2026-11-18. The task envelope said 48. The id ranges hold 44, and this spec counts by the ids. Each item was checked against this checkout (develop at c30b53c). None is fixed yet, so nothing is Dropped.

The designer's sign-off ORV-280-signoff-1 on PR 220 (head b90a69f) adds three Suggestions, F3, F4 and F5, as PR B items S1, S2 and S3. They are not card items, so W1 still counts 44, and "Sorting" counts them apart (W3).

The owner's POC focus is function (ORV-137 comment 10246). The screen flow and the final look wait. A look item that only a later look pass can settle may therefore be left out with its reason: `polish-split-1` calls it Deferred, and B12 is one ("Sorting").

What is real and what is simulated: nothing in this batch adds a capability. The business screens' stories run on labelled fixture projects, as in ORV-281. Placement stays rule-based, and no text here says that a model read anything.

This spec is not a guard on a tool call, so the guard frame does not apply.

## Story

As the owner, I want the review follow-ups of the canvas, the prototype page and the business board closed in at most two PRs. PR A carries what needs no look decision. PR B carries the look items, which the designer settles first. Then the card can close and the next feature starts from a clean base.

## Rules

### polish-split-1

An item goes to **PR A** when both hold: it needs no look decision (it fixes words or accessible names, tests, code tidiness, a story fixture or docs wording), and it touches no file that slice 3 (ORV-283) changes. Slice 3 changes `packages/design-system/src/examples/business-*` and `apps/web/app/business/**`. Any other item goes to **PR B**, which is built after slice 3 merges into `develop`. An item that waits for a later look pass or for a security decision is **Deferred** and stays on the Jira card. An item that this checkout already fixes is **Dropped**, with the line that shows it. PR A edits only the `node`, `port`, `graph` and `board` groups of the locale files and never the `business` group.

### look-row-1

A PR B look item states the outcome the person sees. The measure (a pixel value, a token, a type step, a tolerance) belongs to the designer's row for that item in `docs/specs/ORV-280/design.md`, written before any PR B builder runs. A play for such a row asserts the designer's measure through the helpers in `packages/design-system/src/testing/visual-asserts.ts` where one fits (`.claude/rules/testing.md`).

## Sorting

One line per item id. The counts are PR A 15, PR B 30 (27 card items, and S1 to S3 from the sign-off), Deferred 2, Dropped 0 (W3). "Slice 3 file" means a file that `polish-split-1` names.

<!-- prettier-ignore -->
| Item | Goes to | Reason | Row |
| --- | --- | --- | --- |
| D1 | PR B | Look: edge label pills under cards below zoom 1 | 20 |
| D2 | PR B | Look: port and source pills overlap; the `expectPillsClear` extension lands with the fix, or it goes red | 21 |
| D3 | PR B | Look: the stale pill under the group frame in Thai | 22 |
| D4 | PR B | Look: the gap after a Thai ellipsis in the present label | 23 |
| D5 | PR B | Look: the 360 dock scroll hint, the attribution, the edge focus shape and the stage radius | 24, 25 |
| D6 | PR A | Story fixture: the edit board's node spacing in `CanvasEdge.stories.tsx` line 644 (`gap: 110`); clearing an overlap needs no look decision | 9 |
| D7 | PR A | Words: `node.pages` and `graph.nodeOpenLabel` need a form for one | 1 |
| D8 | PR A | Accessible names: `NodePort.tsx` line 80 joins two words with no space; `graph.edgeLabel` doubles "from" for a derived edge | 2, 3 |
| D9 | PR A | Accessible name: `CanvasBoard.tsx` lines 417 to 419 set `aria-haspopup` whenever a node has `open` | 4 |
| D10 | PR A | Test: `playOpenNode` (`CanvasBoard.stories.tsx` lines 1500 to 1570) reads no viewport transform | 6 |
| D11 | PR A | Test: the fit-view branch at `CanvasBoard.stories.tsx` lines 911 to 914 never runs at the 1200 px frame | 7 |
| D12 | PR A | Test: the flaky `NodePort` plays | 8 |
| D13 | PR A | Docs wording on the dock order | 15 |
| D14 | PR A | Docs wording on edge widths and Impact A | 16 |
| D15 | PR A | Docs wording on the page PR's number | 17 |
| C1 | PR B | The shared board's Tab order; the business board play `expectTabOrder` (`business-board.stories.tsx` lines 427 to 450, a slice 3 file) asserts nodes then dock, so it must change with it | 19 |
| C2 | PR B | Look: the palette preview's type steps | 27 |
| C3 | PR B | Look: what the 360 fit frames on the prototype page | 26 |
| C4 | PR B | Look: a page edge on the light stage | 28 |
| C5 | PR B | Look: the form frame crops a heading | 29 |
| C6 | PR B | Look: the pager's place under 600 px | 30 |
| C7 | PR A | Code tidy in `orivilo-canvas.tsx`: lines 1802, 2103 and 2002 | 11 |
| C8 | PR A | Test: the honesty scan at `orivilo-canvas.stories.tsx` line 597 runs after every dialog has closed | 12 |
| C9 | PR A | Code fix: `orivilo-canvas.tsx` lines 2202 and 2203 stop the re-apply on wheel, pointerdown, keydown and touchstart only, never on a scroll | 13 |
| C10 | PR B | Look: `orivilo-canvas.tsx` line 1928 sets the point numeral at `text-label-sm`. The design table names a numeral step for list rows (`docs/specs/ORV-274/design.md` lines 253 and 257), not for a point disc, so the designer names it | 31 |
| C11 | PR A | Test: the `DesignSystemChapter` story (`orivilo-canvas.stories.tsx` line 1028) pins no mode, and its probe sets `data-mode` light at line 1051 | 14 |
| B1 | PR B | Look, on the node view (`business-node-view.tsx`, a slice 3 file) | 33 |
| B2 | PR B | Look: a shared `PageHeader` change across its stories | 34 |
| B3 | PR B | Copy plus a look outcome: the new lede must also leave no lone word at 1440 Thai on the intake story (a slice 3 file) | 35 |
| B4 | PR B | Look, on the project list (`business-list.tsx`, a slice 3 file) | 36 |
| B5 | PR B | Story chrome in `business-story-helpers.tsx` (a slice 3 file) | 37 |
| B6 | PR B | Stories in `business-board.stories.tsx` (a slice 3 file) | 38 |
| B7 | PR B | Data in `apps/web/app/business/data.ts` lines 105 and 137 (a slice 3 file) | 39 |
| B8 | Deferred | A security decision, not polish. It stays on the Jira card until a project delete is first written: `packages/db/migrations/0008_business.sql` line 32 is `ON DELETE cascade`, and the grant of `0001_access.sql` line 33 stays | none |
| B9 | PR B | Look: the shared `ScrollArea` focus outline | 40 |
| B10 | PR B | Look: the dock at 360 on the business board | 24 |
| B11 | PR B | Look: the dock over a card at 100 percent, 1440 | 26 |
| B12 | Deferred | Accepted for the POC as a map (reading happens in the viewer). Only a later look pass can raise the zoom floor or the pitch (ORV-137 comment 10246) | none |
| B13 | PR B | Code tidy in `business-node-view.tsx` (a slice 3 file): its only caller, `business-board.tsx` line 144, passes `heading={false}` | 41 |
| B14 | PR B | Node positions on the prototype board belong to the design's "Layout numbers" | 32 |
| B15 | PR B | Look, moved from PR A in v1.2: the `NodePort` `PresentRecipesAndModes` card sits under the board's corner badge at 360. PR 220's fix (a 420 px board, refitted by the play's fit key) cleared it at 360, but sign-off ORV-280-signoff-1 (F1, F2) measured the badge 2 px into the Professional card and 1 px into its dot at 1440 (`develop`: 75 and 69 px clear), and a fit status pill over the card's corner in every cell (21 px in at 360). Clearing the badge at both widths changes the look, so `polish-split-1` sends it to PR B | 10 |
| B16 | PR A | Words: `board.fitAll` needs a form for one, and its Thai carries the English word "node". `board.fitSelection` has the same two faults (`th.ts` line 503), so it is fixed with it | 5 |
| B17 | PR B | Look: the attribution under the dock, on the business board (a slice 3 file) | 24 |
| B18 | PR B | Look: the fit inset at 360 on the business board | 26 |
| S1 | PR B | Sign-off ORV-280-signoff-1 F3, added in v1.2. Look: the `CanvasEdge` `KindsAndZoom` edit board (`CanvasEdge.stories.tsx` line 654, the default gap of 150) leaves 3.4 world px between stacked cards, 0.85 screen px at zoom 0.25 (W4) | 43 |
| S2 | PR B | Sign-off F4, added in v1.2. Story fixture copy with a look outcome: `NodePort` `KindsInEnglish` and `ConnectedInEnglish` show Thai fixture titles and port names beside English chrome | 44 |
| S3 | PR B | Sign-off F5, added in v1.2. Look and behaviour: a node on a board without `onNodeOpen` still shows the open glyph (`.ds-node__open`, `CanvasNode.tsx` line 200) and its page count | 45 |

## Strings

Each line is the copy of record for this batch, Thai and English together. B3's lede is a draft for the owner's copy review. Existing keys are in `packages/design-system/src/i18n/messages/en.ts` and `th.ts`. "New" means the key does not exist yet.

<!-- prettier-ignore -->
| Key | Item | English | Thai | Change |
| --- | --- | --- | --- | --- |
| `node.pagesOne` | D7 | 1 page | 1 หน้า | New |
| `graph.nodeOpenLabelOne` | D7 | {title}, 1 page | {title} 1 หน้า | New |
| `port.handleName` | D8 | {kind} {direction} | {direction}{kind} | New. With the words of `CANVAS_WORDS` it reads "text input port" and "พอร์ตรับข้อความ" (the Thai is unchanged) |
| `graph.edgeLabelDerived` | D8 | derived from {source} to {target} | สร้างจาก {source} ไป {target} | New. The name of a derived edge; the state word follows as today |
| `board.fitAllOne` | B16 | Fitted 1 node to the view | พอดีจอ 1 โหนด | New |
| `board.fitAll` | B16 | Fitted {count} nodes to the view | พอดีจอ {count} โหนด | Thai changed (was "พอดีจอ {count} node") |
| `board.fitSelectionOne` | B16 | Fitted 1 selected node to the view | พอดีจอกับ 1 โหนดที่เลือก | New |
| `board.fitSelection` | B16 | Fitted {count} selected nodes to the view | พอดีจอกับ {count} โหนดที่เลือก | Thai changed (was "พอดีจอกับ {count} node ที่เลือก") |
| `business.intake.lede` | B3 | Answer in your own words. The project name and what you sell or offer are required. Leave any other question empty and the board shows it as skipped. | ตอบด้วยคำของคุณเอง ต้องตอบชื่อโปรเจกต์และสิ่งที่คุณขายหรือเสนอ ข้ออื่นเว้นว่างได้ และกระดานจะแสดงว่าข้ามไว้ | Both changed, PR B |

The one-forms are used when the count is exactly 1. Every other count keeps the existing key. Thai has no plural, so each Thai one-form reads like its general form with 1.

S2's copy is story fixture data in `NodePort.stories.tsx`, not a locale key. The English stories take the titles "All kinds", "Source" and "Target" where the Thai stories keep "ทุกชนิด", "ต้นทาง" and "ปลายทาง", and the port names of `CANVAS_WORDS.port[kind].en` ("text", "image", "palette", "type", "profile") where the Thai stories keep `.th` ("ข้อความ", "ภาพ", "ชุดสี", "ตัวอักษร", "โปรไฟล์"). The English titles are a draft for the owner's copy review.

## Acceptance criteria

Tests use fixtures and run offline. No test reaches a model or the internet. Rows 1 to 9 and 11 to 18 are PR A; row 10 and rows 19 to 45 are PR B ("Delivery").

<!-- prettier-ignore -->
| # | Items | Given | When | User sees | Data effect | Proven by |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | D7 | A node with `open: { count: 1 }`, English, then Thai; and one with `count: 3` | It renders on a present board at near level | The title row ends "1 page" ("1 หน้า"); the count-3 node still says "3 pages" ("3 หน้า") | `nodeOpenLabel` returns "Logo, 1 page" and "โลโก้ 1 หน้า" for count 1, and "Logo, 3 pages" for count 3 | `graph.test.ts` cases for counts 1 and 3 in both locales; a `CanvasNode` story play on a count-1 node |
| 2 | D8 | A text input port and an output port, English, then Thai | Its handle's accessible name is read | No UI change | English names read "text input port" and "text output port", and "text input port, connected" when connected; the Thai names stay "พอร์ตรับข้อความ" and "พอร์ตรับข้อความ, เชื่อมอยู่" | A `NodePort` English play asserting the names; the Thai play unchanged |
| 3 | D8 | A derived edge from Palette to Demo, English, then Thai; an input edge | Its accessible name is computed | No UI change; the edge's pill keeps "derived from" ("สร้างจาก") | The derived name is "derived from Palette to Demo" ("สร้างจาก Palette ไป Demo"), with no doubled "from" or "จาก"; the input edge keeps `graph.edgeLabel`; a stale or invalid state word still follows after a comma | `graph.test.ts` `edgeLabel` cases; the `CanvasEdge.stories.tsx` line 827 assertion updated |
| 4 | D9 | A board holding a node with `open`, once without `onNodeOpen` and once with it | It renders | No UI change | Without `onNodeOpen` the node's wrapper has no `aria-haspopup`; with it, `aria-haspopup="dialog"` as today | `CanvasBoard` `OpenNode` play; the `CanvasNode.stories.tsx` plays at lines 841 and 1037 pass `onNodeOpen` or assert its absence |
| 5 | B16 | A board with one node, that node also selected; a board with six nodes, all six selected; English, then Thai. No `CanvasBoard` story fixture holds 31 nodes, and the general form takes the count alone, so six proves it | Fit all; fit selection | The status line reads "Fitted 1 node to the view" ("พอดีจอ 1 โหนด"), "Fitted 6 nodes to the view" ("พอดีจอ 6 โหนด"), "Fitted 1 selected node to the view" ("พอดีจอกับ 1 โหนดที่เลือก"), "Fitted 6 selected nodes to the view" ("พอดีจอกับ 6 โหนดที่เลือก"); none of the four Thai fit lines (`board.fitAll`, `board.fitAllOne`, `board.fitSelection`, `board.fitSelectionOne`) holds the word "node". Other Thai lines that hold it are item N1 ("Out of scope") | None | `CanvasBoard` plays at lines 1362 and 1367 updated, plus a one-node English case |
| 6 | D10 | `OpenNode` and `OpenNodeInEnglish`; each also carries a third board without `onNodeOpen`, the fixture row 4 reads | Each open gesture (Enter, Space, click on present; double click and Enter on edit) | No UI change | After each gesture the `.react-flow__viewport` transform equals its value before the gesture; a mutant that pans on open turns the play red | `CanvasBoard` `OpenNode` play |
| 7 | D11 | `CanvasBoard` `Present` | The play runs in the test project | No UI change | Under Vitest, where the window can be set, the fit-view `expectPillsClear` check runs at least once: the play sets a 1920 by 1200 window, where the fit zoom is 1 or more (the `atWindow` pattern), and asserts that zoom before it checks. In the static Storybook the window cannot be set, and the play keeps its zoom-guarded branch | `CanvasBoard` `Present` play |
| 8 | D12 | `NodePort` `Kinds`, `Connected` and `Disabled` | `pnpm --filter @orivilo/design-system exec vitest run --repeats 4` on `NodePort.stories.tsx` | No UI change | Every repeat passes; the fix waits on conditions, never on fixed time | Command output in the builder report |
| 9 | D6 | `CanvasEdge` `KindsAndZoom` and `...InEnglish`, the edit board | Rendering at zoom 0.25, 1 and 2 | The edit board's nodes stand apart, none over another | No two node rectangles intersect; the width and dash assertions at lines 583 to 592 hold unchanged | `KindsAndZoom` play |
| 10 | B15 | `NodePort` `PresentRecipesAndModes`, all six cells (three profiles, two modes), Thai and English | Rendering at 360 and at 1440 | The "View only" ("ดูอย่างเดียว") corner badge sits clear of every card and port dot; at rest no status pill (such as "Fitted 1 node to the view", "พอดีจอ 1 โหนด") lies over a card or a port dot | In every cell at 360 and at 1440 the badge's rect keeps a gap of 0 or more to every `.ds-node` rect and every `.ds-port__handle` rect; at rest no status pill rect meets a `.ds-node` or `.ds-port__handle` rect; the board component is unchanged; how the story gets there (board height, fit, card place) and any wider clearance are the designer's row for B15, recorded before the builder runs (`look-row-1`) | `PresentRecipesAndModes` play, passing in Storybook under a 360 and a 1440 window |
| 11 | C7 | `orivilo-canvas.tsx` | Reading the source | No UI change; the page renders as before | The history mark's dot reads the lime record of `PALETTE`, the type sample reads `TYPE_SAMPLE` exported from `orivilo-canvas.data.ts`, and the badge text reads the profile id; `grep -n "#D9F66F" orivilo-canvas.tsx` and `grep -n "Aa กข" orivilo-canvas.tsx` print nothing, and line 2002's bare `orivilo` text is gone | grep; `Default`, `InThai` and `DesignSystemChapter` plays pass unchanged |
| 12 | C8 | `Default` | Each of the 12 result nodes opens its sequence. The first node of each sequence pages through all its pages; a later node of a shared sequence only opens it | No UI change | The honesty scan of line 597 runs on the open dialog's text at each of the 40 preview pages (W2), as well as on the board; a mutant that puts "score" on one preview page turns the play red | `Default` play |
| 13 | C9 | `PreviewProductPagesScrollbar`, the report preview opened at its findings | The reader scrolls the area by any route (wheel, keys, touch or a scrollbar drag), then the content resizes | The area stays where the reader left it | Any `scroll` event the re-apply did not cause itself stops the re-apply; a programmatic `scrollTop` change stands in for the scrollbar drag; a mutant without the scroll stop turns the play red | `PreviewProductPagesScrollbar` play |
| 14 | C11 | `DesignSystemChapter`, with the toolbar on light and on dark | The play runs | No UI change | The probe takes the sheet's own `data-mode` (read from the sheet's closest `[data-mode]`), so the colour check passes in both modes; a `DesignSystemChapterDark` story with `globals: { mode: "dark" }` runs the same play | Both plays |
| 15 | D13 | `docs/specs/ORV-274/tech.md` lines 165 and 1141, `CanvasControls.tsx` line 84, `catalog/application/canvas-controls.yaml` line 21 | Reading them | Not a screen | Each states the built order as row 12 of `docs/specs/ORV-274/spec.md` (line 64) gives it: on a read-only board the read-only word, a divider, the children, a divider, then the four viewport commands | `grep -n "divider"` on the four files |
| 16 | D14 | `docs/specs/ORV-274/tech.md` line 60 and Impact A (line 911), `DESIGN.md` line 102 | Reading them | Not a screen | Line 60 names the edit board's derived width, `edge.width-selected`, 3 px on screen; the `edge.stroke` row of `DESIGN.md` names the widths of `docs/specs/ORV-274/spec.md` row 9 (present 1.5 and derived 2.5, edit 2 and derived 3); `git show --stat 8347e98` lists `scripts/build-logo-assets.ts` with a one comment line change, so it is listed in Impact A with the count in its heading updated, and line 901's "No code change" reads "No code change beyond one comment line"; `DESIGN.md` gets a version bump and a changelog line | grep; the `git show` output in the builder report |
| 17 | D15 | `docs/specs/ORV-274/spec.md` (12 hits of "PR 212"), `tech.md` (7), `design.md` (4) | Reading them | Not a screen | Each file carries one note: "PR 212" in this file names the page PR, which merged as PR 213 under ORV-278; GitHub PR 212 is ORV-277. The spec bumps to v2.6 with a changelog line | `grep -n "PR 213"` on the three files |
| 18 | D6-D15, C7-C9, C11, B16 | PR A head | Quality gate | Not a screen | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass; check-i18n, the copy check and `apps/web/i18n/messages.test.ts` pass; `pnpm contrast` unchanged from `develop` | Gate output |
| 19 | C1 | A board with the centre dock (`CanvasControls position="center"`): the `CanvasBoard` dock stories, the ORIVILO canvas page and the business board | Keyboard only, Tab from the page start | Tab reaches the dock first (its buttons in order), then the board, its edges and the nodes in reading order, each with visible focus | `docs/specs/ORV-278/spec.md` row 35 (line 76) and its departure note (line 87) return to the parent's dock first, with a v1.3 changelog line; ORV-274 spec line 87, tech.md line 762 and design.md line 807 then hold as written | `CanvasBoard` dock play; `orivilo-canvas` `Default` and `Dark` plays; `business-board.stories.tsx` `expectTabOrder` |
| 20 | D1 | A present board below zoom 1 (`KindsAndZoom` state rows at fit view) | Rendering | Every edge label pill shows whole, never under a card | The designer's row for D1 (`look-row-1`) | `KindsAndZoom` play |
| 21 | D2 | `ChainHighlight` (a selected node) and `PresentNames` (short column gaps) | Hover or select a node | A shown port name pill or source pill covers no other pill and no edge label | `expectPillsClear` also measures shown `.ds-port__label` and `.ds-node__source`; the designer's row for D2 | `ChainHighlight` and `PresentNames` plays |
| 22 | D3 | `NodeGroup` `Grouped`, the edit board, Thai | Rendering | The stale pill sits where the designer's row puts it relative to the group frame, not hanging under it | The designer's row for D3 | `Grouped` play |
| 23 | D4 | A present node with a long Thai title | Rendering at the zooms of `PresentNarrowLabels` | No empty gap shows after the ellipsis | The designer's row for D4 | `PresentNarrowLabels` play |
| 24 | D5, B10, B17 | The dock at 360 on the prototype page and on the business board | Rendering; Tab through | The chapter strip shows it scrolls; the person can see the board is view only; the React Flow attribution stays clear of the dock and none of its text shows through | The attribution's rect intersects no dock rect at 360 and at 480; the read-only name stays in the accessible tree; the designer's row for each item, and any change to the 360 rule of `canvas-controls.yaml` line 21 and `docs/specs/ORV-274/spec.md` row 12 | `CanvasControls` `WithChaptersAt360` play; `business-board` `NarrowLight` play; `orivilo-canvas` `At360` play |
| 25 | D5 | A focused edge on a present board; the preview stage | Tab to an edge; open a preview | The focused edge shows the focus shape, a line with a halo, never the selected look; the stage corners follow the designer's row | The designer's row for D5 | `CanvasEdge` and `Dialog` `Viewer` plays |
| 26 | C3, B11, B18 | The prototype page at 360; the business board at 360 and at 100 percent at 1440 | First render; zoom to 100 percent | The prototype shows its start with the dock in the first screen; the outer business cards keep an inset from the board frame at 360, as at 1280; at 100 percent at 1440 the dock covers no card | The designer's row for each item | `orivilo-canvas` `At360` play; `business-board` `NarrowLight` and `Board` plays |
| 27 | C2 | The palette preview, pages 2 to 6 | Paging | The swatch name and its hex read larger than today (heading-md and code-md) | The designer's row for C2 confirms the steps that sign-off 1 named (display-md for the name, heading-sm size for the hex) | Palette preview play: computed font size equals the step's token |
| 28 | C4 | Paper pages and paper tiles on the light stage | Rendering | Each page shows its bounds | The designer's row for C4 (sign-off 1 suggests a `border.subtle` hairline) | Plays on the brandbook and board previews |
| 29 | C5 | The form frame in 06 Design system | Rendering | The "Brand evidence report" heading shows whole | `expectNoGlyphClip` holds on the heading inside its frame | `DesignSystemChapter` play |
| 30 | C6 | The preview under 600 px | Rendering at 360 | The pager sits centred under the caption | The designer's row for C6; `expectInkCentred` or a centre check | `At360` or the preview play under a 360 window |
| 31 | C10 | The `c-demo` node | Rendering | The point numerals read at the step the designer's row names | The computed font size equals that step's token | `Default` play |
| 32 | B14 | `orivilo-canvas` `Default` (English) and `InThai` | Rendering at the fit zoom and at 1 | No port name pill comes nearer than 8 world px to another node's card or dot | `expectPortPillsClear` runs on the prototype board; the nodes it names move per the designer's row, and the design's "Layout numbers" record the new positions | `Default` and `InThai` plays |
| 33 | B1 | A business node view with still-to-ask questions, Thai and English | Opening it | The questions read apart from the person's words, not like field labels | The designer's row for B1 | `business-board` `Viewers` play |
| 34 | B2 | Every `PageHeader` story, and the business screens at 1440 | Rendering | The header's action sits on the title line, not beside the lede | The designer's row for B2; every `PageHeader` story's play passes | `PageHeader` plays; `business-intake` play at 1440 |
| 35 | B3 | The intake at 1440, Thai and English | Rendering | The lede of "Strings" (`business.intake.lede`), which names the two required fields; in Thai no line holds one word alone | `docs/specs/ORV-281/spec.md` line 210 updated to the new copy | `business-intake` play at 1440; check-i18n |
| 36 | B4 | A row of project cards of unequal content | Rendering | Each card's saved-at line sits at the card's bottom | The saved-at lines of one row share a bottom within the designer's tolerance | `business-list` play |
| 37 | B5 | The business stories at 360 | Rendering | The FixtureNote starts on the screen's column | The note's left equals the column's left | `business-*` story plays at 360 |
| 38 | B6 | The board screen, signed out and not allowed, Thai and English | Rendering | Stories `SignedOut`, `SignedOutEnglish`, `NotAllowed`, `NotAllowedEnglish`: the screen's heading, then "Sign in to tell us about your business." ("ลงชื่อเข้าใช้ก่อน แล้วจึงเล่าเรื่องธุรกิจของคุณได้") with the link "Go to sign in" ("ไปหน้าลงชื่อเข้าใช้"), or "This is open only to approved accounts for now, and this account is not one of them." ("ตอนนี้ส่วนนี้เปิดให้เฉพาะบัญชีที่ได้รับอนุมัติ และบัญชีนี้ยังไม่อยู่ในรายชื่อ") | No `.ds-board` renders | The four plays |
| 39 | B7 | A project saved at 23:30 Bangkok time | Opening the list, then the board | The list and the board show the same saved date | Both read one source, `business_intake.created_at` (with time zone) | `apps/web/app/business/page.test.tsx` and `[projectId]/page.test.tsx` |
| 40 | B9 | The viewer dialog at 360 and 1440 on the business board and on the prototype page; the `ScrollArea` stories | Open (the scroll region takes focus) | The focus outline crosses no glyph of the content, and the Thai upper marks of the state line stay whole | `expectNoGlyphClip` or the designer's row for B9; every `ScrollArea` story's play passes | `business-board` `ViewerAt360` and `ViewerAt1440`; `ScrollArea` plays |
| 41 | B13 | `business-node-view.tsx` | Reading the source | Not a screen | The `heading` prop, its default and its `SectionHeader` branch are gone; `grep -n "heading" business-node-view.tsx` shows no prop; the views render as before | grep; typecheck; `business-board` plays |
| 42 | B1-B7, B9-B11, B13-B15, B17, B18, C1-C6, C10, D1-D5, S1-S3 | PR B head | Quality gate | Not a screen | As row 18, and the designer's visual sign-off on PR B | Gate output; sign-off |
| 43 | S1 | `CanvasEdge` `KindsAndZoom` and `KindsAndZoomInEnglish`, the edit board | Rendering at every zoom the story shows (row 9's 0.25, 1 and 2, and the fit zoom) | Stacked cards read as separate cards at every zoom, with a gap the person can see between them | The vertical gap between stacked cards is at least the designer's row for S1 (`look-row-1`; the sign-off suggests 16 world px or more, a fixture gap of 163 or more, W4); row 9's no-intersection, width and dash assertions hold | `KindsAndZoom` play |
| 44 | S2 | `NodePort` `KindsInEnglish` and `ConnectedInEnglish` | Rendering in English | Every node title and port row name reads in English, as "Strings" gives S2's copy ("All kinds", "Source", "Target"; "text", "image", "palette", "type", "profile"); the Thai stories `Kinds` and `Connected` keep "ทุกชนิด", "ต้นทาง", "ปลายทาง" and the Thai port names; the look follows the designer's row for S2 (`look-row-1`) | The visible text (`innerText`) of each English story's board holds no Thai character; the handle names of row 2 hold unchanged | `KindsInEnglish` and `ConnectedInEnglish` plays |
| 45 | S3 | `CanvasBoard` `OpenNode` and `OpenNodeInEnglish`: the third board without `onNodeOpen`, and the boards with it | Rendering | What the designer's row for S3 decides (`look-row-1`). By default (open question 8): on the board without `onNodeOpen` the node shows no open glyph and keeps its page count as content ("3 pages", "3 หน้า"); on a board with `onNodeOpen` the glyph shows as today | By default `.ds-node__open` is absent from every node of a board without `onNodeOpen` and visible on an open node of a board with it; every `CanvasNode` and `CanvasBoard` story that asserts `.ds-node__open` passes; `canvas-node.yaml` states the rule beside its `aria-haspopup` line (row 4) | `OpenNode` and `OpenNodeInEnglish` plays; `CanvasNode` plays |

## Rows that render nothing

- Rows: 2-4, 6-8, 11, 12, 14-18, 41, 42

## Delivery

- PR A holds rows 1 to 9 and 11 to 18: D6 to D15, C7 to C9, C11 and B16. It may start now, on `develop` at c30b53c.
- PR 220 leaves the story `PresentRecipesAndModes` as it is on `develop` (board height, no fit key in the play, no badge clearance assertion); the flake fix of row 8 in the same file stays.
- PR B holds row 10 and rows 19 to 45: D1 to D5, C1 to C6, C10, B1 to B7, B9 to B11, B13 to B15, B17, B18, and S1 to S3. Its order is set by `look-row-1` (the designer's rows first) and `polish-split-1` (after slice 3, ORV-283).
- PR B is delivered as two slice cards, each with its own slice spec that holds its own rows. ORV-290 (`docs/specs/ORV-290/spec.md`) holds rows 10, 20 to 23, 25, 27 to 32 and 43 to 45, with the gate row 42 for its items: the shared canvas components and the ORIVILO canvas prototype page. A second slice card, created after ORV-285 PR 1 merges, holds rows 19, 24, 26 and 33 to 41, with the gate row 42 for its items, because those rows change business board and business screen files that ORV-285 is changing.
- PR A is PR 220, and "Rows per PR" holds its line. The two PRs of PR B get no line here: each slice spec holds its own rows.

## Rows per PR

- PR 220: rows 1-9, 11-18

## Impact on contracts

- **String keys (PR A, lane S):** new `node.pagesOne`, `graph.nodeOpenLabelOne`, `port.handleName`, `graph.edgeLabelDerived`, `board.fitAllOne` and `board.fitSelectionOne`; Thai changed for `board.fitAll` and `board.fitSelection` ("Strings"). Both locale files, with matching placeholders.
- **String key (PR B):** `business.intake.lede`, both locales. Its copy of record moves from `docs/specs/ORV-281/spec.md` line 210.
- **Catalog entries (PR A):** `catalog/application/canvas-node.yaml` line 50 says `aria-haspopup` is set only when the board has `onNodeOpen` (D9). `node-port.yaml` line 26 gives the English form of the handle name (D8). `canvas-edge.yaml` line 28 gives the derived edge's form (D8). `canvas-controls.yaml` line 21 states the built order (D13). These are wording changes with no API change.
- **Component public API:** none in PR A. In PR B, `BusinessNodeView` loses its `heading` prop (B13). It is an example component in `src/examples`, not a catalog entry, and its one caller passes `false`.
- **Shared look or behaviour (PR B, lane L for these items):**
  - `CanvasBoard` and `CanvasControls`: the dock's Tab order (C1), and the dock at 360 with any change to `canvas-controls.yaml` line 21 and ORV-274 row 12 (D5, B10).
  - `CanvasEdge`: label pills below zoom 1 (D1) and edge focus (D5).
  - `NodePort` and `CanvasNode`: pill clearance (D2) and the label after an ellipsis (D4).
  - `NodeGroup`: the stale pill (D3).
  - `PageHeader`: the action's place (B2).
  - `ScrollArea`: the focus outline (B9).
  - `CanvasNode` and `CanvasBoard`: the open glyph only where the board can open the node (S3), with `canvas-node.yaml`. If the board tells the node through a new field of its node data, that field is a public API change and its row lists the impact.
  - Each of these shared changes goes through every story of its component, and through the catalog entry where a rule changes.
- **Tokens, recipes for colour, contrast pairs:** none expected. If a designer's row needs a new token, that row says so, and the change is an L lane contract change with its own impact list.

## Out of scope

- B8 (Deferred): the delete rule of `business_intake`. It stays on the Jira card as a security decision.
- B12 (Deferred): the zoom floor and the pitch of the business board at 360.
- N1 (Deferred, found while building PR 220): the English word "node" in the other Thai lines of `packages/design-system/src/i18n/messages/th.ts`, 41 values at this checkout besides the four fit lines of row 5 (for example `board.deletedNodes`, "ลบ {count} node", and `graph.selfLoop`, "ต่อสายเข้า node ตัวเองไม่ได้"). It is not in the collected follow-ups of the card, and it needs the owner's word on the Thai term across the whole catalog before any line changes. It is not a card item, so the counts of "Sorting" leave it out.
- The zoom-in cursor on an open node without `onNodeOpen` (D9 names only `aria-haspopup`).
- Any new feature, screen or flow; anything slice 3 (ORV-283) builds.

## Open questions

1. **D8 in Thai.** The item says "Thai unchanged", but the Thai derived name doubles "จาก" as well ("สร้างจาก จาก A ไป B", from `th.ts` line 448 with `canvas.ts` line 63). Options: (a) fix both through `graph.edgeLabelDerived`; (b) English only. Default (a).
2. **C1, which order wins.** Options: (a) move the dock first on boards with the centre dock, as `docs/specs/ORV-274/design.md` line 807 designs it; (b) keep the built order and rewrite ORV-274 spec line 87, tech.md line 762 and design.md line 807 to it in PR A. Default (a).
3. **D14, Impact A.** Options: (a) list `scripts/build-logo-assets.ts` only if `git show --stat 8347e98` shows PR 211 changed it; (b) list it anyway. Default (a).
4. **D15, the form of the fix.** Options: (a) one note per file; (b) replace the 23 hits with "PR 213". Default (a), because a note keeps the record of the plan.
5. **B7, the source.** Options: (a) the list reads the intake's saved time (`business_intake.created_at`, with time zone); (b) keep `project.created_at` and record in `docs/specs/ORV-281/tech.md` that the list reads it under a UTC session. Default (a).
6. **B10, the word at 360.** Options: (a) the designer makes "view only" visible at 360 and records the change to ORV-274 row 12; (b) keep it visually hidden, as row 12 decided, and close B10 by design. Default (a).
7. **PR B size.** PR B holds 30 items, and may pass the 400-line guide. Options: (a) one PR B, and the designer's rows may move a residual (D1 or D4, the F1 and F2 residuals of ORV-274) to Deferred with its reason; (b) a third PR. Default (a), because the card allows at most two PRs.
8. **S3, the open glyph on a board that cannot open.** Options: (a) the glyph shows only when the board has `onNodeOpen`, and the page count stays as content; (b) the glyph shows wherever a node has `open`, and the designer's row records why. Default (a): a cue to open a view the board cannot open promises an action that does not exist, the same reason row 4 drops `aria-haspopup`. The zoom-in cursor stays out of scope ("Out of scope").

## Depends on

- The owner's rule of 2026-10-31 (one card, one PR series for small UI comments) and ORV-137 comment 10246 (POC focus is function).
- `docs/specs/ORV-274/spec.md` v2.5 (rows 9, 12 and 35), `tech.md` and `design.md`.
- `docs/specs/ORV-278/spec.md` v1.2 (rows 20 and 35, `structure-1`).
- `docs/specs/ORV-281/spec.md` v1.1 ("Strings", `intake-fields-1`) and `docs/specs/ORV-282/spec.md` v1.1.
- `DESIGN.md` v1.75 and `.claude/rules/design-system.md`.
- Slice 3, ORV-283 (`polish-split-1`).

## Worked examples

- W1, the item count. Input: the id ranges of the items file (D1 to D15, C1 to C11, B1 to B18). `node -e "console.log(15 + 11 + 18)"` prints `44`, a whole count with no rounding.
- W2, the preview pages of row 12. Input: `structure-1` of `docs/specs/ORV-278/spec.md` line 37, "6, 3, 2, 6, 8, 12 and 3 pages". `node -e "console.log([6,3,2,6,8,12,3].reduce((a,b)=>a+b,0))"` prints `40`, a whole count with no rounding.
- W3, the sort. Input: the "Goes to" column of "Sorting". `node -e "const a=['D6','D7','D8','D9','D10','D11','D12','D13','D14','D15','C7','C8','C9','C11','B16'], d=['B8','B12'], s=['S1','S2','S3']; console.log(a.length, 44 - a.length - d.length + s.length, d.length)"` prints `15 30 2`, whole counts with no rounding (PR B: 44 - 15 - 2 = 27 card items, plus 3 sign-off items).
- W4, the stacked gap of S1. Input: the sign-off's `edge-zoom.cjs` check in `.orivilo/runs/ORV-280/ORV-280-signoff-1/result.json`, "card height 146.6 world px" on the default gap of 150, and its suggested gap of 16 world px. `node -e "const g=150-146.6; console.log(g.toFixed(1), (g*0.25).toFixed(2), Math.ceil(146.6+16))"` prints `3.4 0.85 163`: the gap in world px to one decimal, the gap in screen px at zoom 0.25 to two decimals, and the fixture gap rounded up to a whole world px.

## Changelog

- v1.0 (2026-11-18): first version, task ORV-280-spec-1. Sorts the 44 items of ORV-280 into PR A (16), PR B (26) and Deferred (2), with 42 rows. To review downstream: the designer's `docs/specs/ORV-280/design.md` (PR B rows), the PR A builder envelope, then the PR B builder envelope after ORV-283 merges, and the qa envelopes. These files change in PR A or PR B and are listed for review: `docs/specs/ORV-274/spec.md`, `tech.md` and `design.md`; `docs/specs/ORV-278/spec.md` (row 35); `docs/specs/ORV-281/spec.md` (line 210); `DESIGN.md` (line 102); and the catalog entries named under "Impact on contracts".
- v1.1 (2026-11-18): task ORV-280-spec-2. Rows 5, 6, 7, 10, 12 and 16 now state what PR 220 built, as the deviations of builder task ORV-280-a1-first-batch report it: row 5 proves the general fit lines with six nodes and six selected (no `CanvasBoard` story fixture holds 31) and limits its Thai claim to the four fit lines; row 6 names the third board without `onNodeOpen`; row 7 runs the fit check under Vitest, with the zoom-guarded branch kept in the static Storybook; row 10 grows the story's board from 300 to 420 px instead of moving a card; row 12 pages each sequence once, through its first node; row 16 records the one comment line in `scripts/build-logo-assets.ts`. Adds N1 under "Out of scope" (Deferred, not a card item) and "Rows per PR" with PR 220's line. No row added, removed or renumbered; no new string, token, component or requirement; the counts of "Sorting" and the worked examples are unchanged. To review downstream: the reviewer and qa envelopes for PR 220.
- v1.2 (2026-11-18): task ORV-280-spec-3, after sign-off ORV-280-signoff-1 (request_changes, F1 and F2 on head b90a69f) and ORV-280 comment 10711. B15 and its row 10 move from PR A to PR B, because PR 220's fix changed the look: at 1440 the "View only" badge met the Professional card and its dot, and the play's fit key left a status pill over the card and a port dot in every cell. Row 10 keeps its number and now states what PR B must reach at 360 and 1440; PR 220 leaves `PresentRecipesAndModes` as on `develop`, with row 8's flake fix kept. Adds the sign-off's Suggestions F3, F4 and F5 as PR B items S1, S2 and S3 with rows 43, 44 and 45, S2's fixture copy under "Strings", S3 under "Impact on contracts", open question 8 and W4. Counts: PR A 16 to 15, PR B 26 to 30 (W3); rows 18 and 42 list their items to match; "Rows per PR" reads `rows 1-9, 11-18`. No row removed or renumbered. To review downstream: the PR 220 builder rework envelope, the designer's `docs/specs/ORV-280/design.md` (rows for B15, S1, S2 and S3, before any PR B builder runs), the PR B builder envelope, and the qa envelopes for both PRs.
- v1.3 (2026-11-19): task ORV-290-spec-1. "Delivery" records that PR B is delivered as two slice cards, each with its own slice spec: ORV-290 with rows 10, 20 to 23, 25, 27 to 32 and 43 to 45 and its part of row 42, and a second card, created after ORV-285 PR 1 merges, with rows 19, 24, 26 and 33 to 41 and its part of row 42; the two PRs of PR B take no "Rows per PR" line here. Row 13 names the story that proves it, `PreviewProductPagesScrollbar`, in place of `PreviewProductPages` (review S2 of PR 220, ORV-280 comment 10720). No other row changed; no row added, removed or renumbered; no new requirement; the counts of "Sorting" and the worked examples are unchanged. To review downstream: `docs/specs/ORV-290/spec.md`, the ORV-290 builder and qa envelopes, the second slice card's spec when it is written, and the decisions marked in `docs/specs/ORV-280/design.md` section 4.
