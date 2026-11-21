---
issue: ORV-291 (https://tpetkaew.atlassian.net/browse/ORV-291)
spec: docs/specs/ORV-291/spec.md v1.1 (e62f2cb)
tech: docs/specs/ORV-291/tech.md
task: ORV-291-design-1
author: designer
date: 2026-11-19
---

# ORV-291 design: the four brand foundation nodes on the business board

Four cards on the existing business board and four node views in the existing viewer dialog: Brand personality (`identity-frame`, PR 1), Brand architecture and Name (PR 2), Core idea (PR 3). No new screen, no new component, token, recipe class or public prop, and no new string: every word below is a key of the spec's Strings table or one of its reused keys. Built from catalog components only: `CanvasBoard` (present variant), `Dialog` with `DialogContent size="viewer"`, `ScrollArea`, `Field`, `Textarea`, `Input`, `RadioGroup` with `RadioGroupItem`, `Button`, and `Alert` through the `Notice` helper of `brand-report.tsx`, exactly as the Positioning view of ORV-285 uses them.

Every number in this file was measured on a rendered mock (section 17): the markup written with the classes named here, composed from the PR 226 checkout's design-system source and token CSS (`feature/ORV-285-positioning-gate`, head c651a8e), under the neutral profile, at 360 and 1440 px, Thai and English, light and dark. 54 states, 432 frames. Nothing here is built code.

## How to read this file

Each PR's builder reads the shared part and its own part.

<!-- prettier-ignore -->
| Part | Sections | Read by |
| --- | --- | --- |
| Shared frame | 1 Flow, 2 Board, 3 Card at rest, 4 View frame, 5 Editors | every PR |
| PR 1 | 6 Brand personality | PR 1 |
| PR 2 | 7 Board at stage 2, 8 Brand architecture, 9 Name | PR 2 |
| PR 3 | 10 Board at stage 3, 11 Core idea | PR 3 |
| Common | 12 Tokens and classes, 13 DESIGN.md section 9, 14 Strings, 15 Owner's choices, 16 Seen and not changed, 17 Rendered proof, 18 Screens for visual QA | every PR |

---

## Part A: the shared frame (PR 1 builds it)

## 1. Flow

1. The person opens a saved project's business board. The four nodes sit to the right of Positioning (`foundation-board-1`), each card showing its title, its state line, the names of its fields and, on Core idea, its gate line. A card never shows an answer or a value.
2. They click a card, or Tab to it and press Enter. The node view opens in the viewer dialog, exactly as for the business nodes: the dialog title is the node title; on Core idea the dialog description is the gate line (`business.state.gate`, or `business.coreIdea.gatePassed` once agreed). Focus goes to the view's scroll region (ORV-285 behaviour, unchanged).
3. The view reads top to bottom: the state line, the mark lines when there are any, the fields with their content and labels, then the controls. One primary action at most.
4. A control that asks opens an editor in place of the fields (Brand personality, Name, Core idea) or is the inline choice itself (Brand architecture). Save checks on the client first, then calls; while it runs the save button shows `business.positioning.saving` and nothing else can be pressed.
5. After a save, the view shows the new state; focus lands on the heading of the value field. Escape closes the dialog and focus returns to the card.

## 2. The board

### 2.1 Positions

World pixels, top left corner of each card; every card is `size: "md"`, 320 wide. Columns 4 and 5 are new. Column 4 starts 152 right of Positioning (as the gap between columns 2 and 3), column 5 starts 168 right of column 4 so the wider port pills of "Brand architecture" and "Brand personality" fit between them.

<!-- prettier-ignore -->
| Node | Column | x | y | Card height (world px, measured) | Added in |
| --- | --- | --- | --- | --- | --- |
| `situation` | 1 | 0 | 326 in PR 1, **447 from PR 2** | 145.19 | ORV-281 |
| `business-core` | 2 | 456 | 28 | 117.39 | ORV-281 |
| `audience` | 2 | 456 | 340 | 117.39 | ORV-281 |
| `competitive-frame` | 2 | 456 | 652 | 117.39 | ORV-281 |
| `positioning` | 3 | 928 | 326 | 172.98 gate, 149.19 agreed | ORV-281 |
| `identity-frame` | 4, upper lane | 1400 | 160 | 145 (state line and three field names) | PR 1 |
| `architecture` | 4, lower lane | 1400 | 576 | 117 (state line and two field names, two input ports) | PR 2 |
| `name` | 5, lower lane | 1888 | 473 | 104 (port floor: two input ports) | PR 2 |
| `core-idea` | 5, upper lane | 1888 | 212 | 173 with the gate line on two lines | PR 3 |

Why these places:

- **Two lanes.** The upper lane carries expression (Brand personality, then Core idea), the lower lane structure (Brand architecture, then Name). Each lane's own edge runs short and level: `identity-frame` to `core-idea`, `architecture` to `name`. Positioning's out port (412 gate, 401 agreed) sits between the lanes, so its four edges fan out above and below without crossing each other.
- **Situation moves down in PR 2.** `situation` feeds `architecture` (`foundation-marks-1`). From its current out port (y 398.6) a bezier to column 4 runs 53.9 world px inside `audience` (computed with React Flow's `getBezierPath` and the real card heights). At y 447 its out port is 519.6, in the band between `audience` (bottom 457.4) and `competitive-frame`'s title; the edge then clears every card by at least 64.8. Its three ORV-281 edges still reach their ports. This changes ORV-281 design 6.3 ("`situation` centres on `audience`"); it is listed in section 15.
- **Reading order.** The board still reads left to right by column, and the Tab order is the node array order, which is the fill order: situation, business core, audience, competitive frame, positioning, Brand personality, Brand architecture, Name, Core idea (measured: Tab after the board's edges lands on the nine nodes in that order).

### 2.2 Ports and edges

Inputs on the left side, outputs on the right, grouped and centred on the card at the 40 pitch (`CanvasNode`, unchanged). With more than one source, a port is named `from-<source>` (tech section 9). **The port order is this table, not the order of the engine's edge list**, so an upper source always enters the upper port and no two edges cross at a card.

<!-- prettier-ignore -->
| Node | Inputs, top to bottom (port label) | Port y (world) | Output |
| --- | --- | --- | --- |
| `positioning` | unchanged | 372, 412, 452 | `out` from PR 1 (it feeds `identity-frame`); y 412 gate, 401 agreed |
| `identity-frame` | `in` (Positioning) | 233 | `out` from PR 3 (feeds `core-idea`) |
| `architecture` | `from-positioning` (Positioning), `from-situation` (Situation) | 615, 655 | `out` (feeds `name`) |
| `name` | `from-positioning` (Positioning), `from-architecture` (Brand architecture) | 505, 545 | none |
| `core-idea` | `from-identity-frame` (Brand personality), `from-positioning` (Positioning) | 278, 318 | none |

Edges stay `meaning: "input"`, `label: false`, as the six ORV-281 edges. One crossing exists from PR 2: `situation` to `architecture` crosses `competitive-frame` to `positioning` between columns 2 and 3; no placement of `situation` avoids it without running under a card.

Clearance of each new edge from every other card (world px, bezier sampled at 400 points, real card heights, Positioning in its gate height; the agreed height changes each value by under 1.2):

<!-- prettier-ignore -->
| Edge | From cards | From cards and their titles at fit 0.524 (title band 53) | Nearest |
| --- | --- | --- | --- |
| `positioning` to `identity-frame` | 340.5 | 287.5 | `architecture` |
| `situation` to `architecture` | 64.8 | 28.9 | `competitive-frame` |
| `positioning` to `architecture` | 306.3 | 306.3 | `identity-frame` |
| `positioning` to `name` | 79.7 | 26.7 | `architecture` |
| `architecture` to `name` | 160 | 160 | `core-idea` |
| `identity-frame` to `core-idea` | 194.5 | 141.5 | `name` |
| `positioning` to `core-idea` | 22.2 | 22.2 | `identity-frame` |

At the 0.25 zoom floor the titles grow to about 112 world px tall (1/zoom), and two edges pass through a title band, never through a card: `situation` to `architecture` above `competitive-frame` (30.1 into the band) and `positioning` to `name` above `architecture` (32.3 into the band). The titles are left aligned and short, so the edge passes right of the glyphs in every frame seen; it is recorded in section 15.

### 2.3 What the overview fit does

Measured on the board region of the screen (`h-[70dvh] min-h-[480px]`, unchanged): 1390 x 628 at 1440, 310 x 558 at 360.

<!-- prettier-ignore -->
| Stage | Nodes, edges (W2) | World box | Fit at 1440 | At 360 |
| --- | --- | --- | --- | --- |
| Today (ORV-285) | 5, 6 | 1248 wide | 0.617 (ORV-285 sign-off) | every card inside at 0.25 |
| After PR 1 | 6, 7 | 1720 wide | 0.640 | 0.25 floor, 4 of 6 cards inside, centred |
| After PR 2 | 8, 11 | 2208 wide | 0.524 | 0.25 floor, 3 of 8 inside |
| After PR 3 | 9, 13 | 2208 wide | 0.524 | 0.25 floor, 3 of 9 inside |

- **1440.** The whole board fits at every stage. At 0.524 the titles stay readable (about 15 px on screen); the card text is small (about 7 px). That is the overview's job; the view carries the reading.
- **360.** From PR 1 the board no longer fits whole: the fit stops at `minZoom` 0.25 and centres the world. The person pans (drag, the arrow keys on the focused board), or Tabs: React Flow's `autoPanOnNodeFocus` (on by default, not changed) pans each focused card fully into the board. Measured: after focusing each of the nine cards in turn, each card's box is inside the board's box. Nothing on the page scrolls sideways (`documentElement.scrollWidth` 360).
- **Consequence for the stories.** ORV-285's `narrowPlay` asserts every card inside the board at 360. From PR 1 it becomes the B3 play below. The owner's alternative, a second board (spec open question 5 (b)), is in section 15.

**Correction, 2026-11-19 (task ORV-291-spec-3): the board as builder task A3 built it at `3c646c4`, measured by its plays. Accepted by the main session under the owner's POC delegation (ORV-291 comment 10748); the owner can change both readings.**

- **The fit at 1440, row "After PR 1" of the table.** Measured 0.6167 on the built cards, not 0.640, on a board region of 1392 x 630. A3's reading: the fit is bound by the board's height, not its width; the built cards are taller than the mock's (section 17: its business cards were placeholders about 90 tall), and Brand personality sits inside the height the business nodes already take, so the fit stays ORV-285's 0.617. `BoardAt1440` asserts 0.617 within 0.01 (6.5, B2). The rows "After PR 2" and "After PR 3" (0.524) were measured on the same mock and are not re-measured here; PR 2 measures them.
- **The 360 bullet.** As A3's play found at the installed React Flow, focus pans a card only when no part of it is in view. A card that is partly in view is not moved, so it is not "fully into the board". After PR 1, with each node focused in turn, Situation spans x -35 to 45 against a board from 24 to 336 and Brand personality x 315 to 395: each stays cut by 59 px; the other four cards are fully inside. Each card takes focus and overlaps the board. Nothing on the page scrolls sideways. The "Measured" sentence of the bullet was read on the mock, not on the built board. A pan that brings each focused card fully into view would sit in the shared `CanvasBoard`; it is a follow-up on the second slice card of ORV-280 (spec open question 14 (b)). The spec's `foundation-board-1` (v1.3) states the 360 reading.

**As-built note, 2026-11-20 (task ORV-296-design-notes-1), for finding F1 of the PR 2 visual sign-off (ORV-295-signoff-1): the rows "After PR 2" and "After PR 3" of the table, read on the built board.**

- **After PR 2: 0.524 measured on the built cards at 1440 (`BoardAt1440`), as the mock.** On PR 2 as merged (PR 234, `6aea3cf`), the story `BoardAt1440` in `business-board.stories.tsx` zooms to fit at the 1440 frame and asserts 0.524 within 0.01, with every card inside the board within 0.5; the sign-off read the viewport transform at 0.524457 in all four 1440 frames. Stage 1's 0.617 was bound by the board's height; from PR 2 the wider world, Name at x 1888, sets the fit.
- **After PR 3.** At `39f216a` (task C2), `BoardAt1440` waits for nine nodes and thirteen edges and asserts the same 0.524 within 0.01: the Core idea card at x 1888 does not widen the world. Read from the play's assert; no closer figure was taken at stage 3.

## 3. The card at rest

`renderBody` for a foundation node is the business card body, plus the gate line on Core idea only:

```text
div.flex.flex-col.gap-2
  p.text-body-sm.text-text-secondary [data-node-state]    state line
  ul.flex.flex-col.gap-1.text-body-sm                      one li per field name, in this order
  p.text-body-sm.text-text-secondary                       Core idea only: the gate line
```

<!-- prettier-ignore -->
| Node | Field names, in order | State line, by `foundation-marks-1` |
| --- | --- | --- |
| Brand personality | `business.field.person`, `business.field.never`, `business.field.personality` | `business.state.given`, `.waiting`, `.skipped`, `.empty` |
| Brand architecture | `business.field.subBrands`, `business.field.architecture` | `business.state.derived`, `.waiting`, `.notInVersion`, `.empty` |
| Name | `business.field.workingName` | `business.state.given`, `.waiting`, `.empty` |
| Core idea | `business.field.remember`, `business.field.coreIdea` | `business.state.agreed`, `.waiting`, `.skipped`, `.empty`; gate line `business.state.gate`, or `business.coreIdea.gatePassed` when agreed |

No mark line, answer, name, statement, point or count shows on a card. `{nodes}` in `business.state.waiting` is the `Intl.ListFormat` list of `foundation-marks-1`.

## 4. The view frame (shared by the four views)

The four views render inside the existing viewer (`DialogContent size="viewer"` > `ScrollArea` > `div.pe-3`), with `heading={false}` as the business views. Measured column: 282 wide at x 33 at 360 (the scroll bar at x 323), 672 wide at x 33 at 1440.

### 4.1 Anatomy

```text
div.flex.min-w-0.max-w-[42rem].flex-col.gap-6 [data-node=<id>]     V1 the view
  div.flex.flex-col.gap-2 [data-head]                                V2 the head
    p.text-body-sm.text-text-secondary role=status [data-node-state] state line
    (mark block, at most one kind, section 4.3)
  div.flex.flex-col.gap-6 [data-fields]                              V4 the fields, or the open editor in their place
    div.flex.min-w-0.flex-col.gap-1 [data-field=<field>]             one field
      h3.self-start.text-label-md tabIndex=-1                        field name
      p.whitespace-pre-wrap > bdi                                    content, as typed
      p.text-body-sm.text-text-secondary                             its label, section 4.4
  div.flex.min-w-0.flex-col                                          V5 the controls (only with controls and a control to show)
    div.flex.flex-wrap.items-center.gap-2 [data-row]                 the buttons, md, 40 tall
    div role=alert > div.mt-3 > Notice variant=danger live=off       V6 a failed call
```

### 4.2 Layout rows (all four views)

<!-- prettier-ignore -->
| Row | What | Number, measured |
| --- | --- | --- |
| V1 | The view: one column, start edge at the viewer's content edge | 282 at 360, 672 (42rem) at 1440; start x 33 for every text block and control in every state |
| V2 | Dialog title to state line | 8 (no description); 35 on Core idea, where the gate line is the description between them |
| V2 | State line to first mark line | 8 (`gap-2`) |
| V3 | Between the two lines of the provisional pair | 4 (`gap-1`) |
| V1 | Head to first field, field to field, last field to the button row | 24 each (`gap-6`) |
| V4 | Field name to content, content to its label | 4 (`gap-1`) |
| V5 | Buttons | `Button size="md"`, 40 tall, 8 apart (`gap-2`), they wrap to a second row before they ever scroll |
| V6 | Failure notice | 12 under the row (`mt-3`), full column width |
| V7 | An open editor | replaces the fields block and the button row; the head stays above it |

### 4.3 Mark lines

At most one kind shows (`foundation-marks-1`), inside the head under the state line:

- **Provisional** (derived values only): `strategy.provisional` then `business.marks.restsOn` in `div.flex.flex-col.gap-1`, each a `p.text-body-sm` in the primary ink.
- **Unchecked** (given or derived values): `business.marks.unchecked` as one `p.text-body-sm`, primary ink.

The words carry the meaning. The primary ink sets them apart from the secondary state line, so the caveat is read before the value; no colour, icon, badge or alert box is added, so nothing reads as an error or a warning the person must fix.

### 4.4 Labels on content (`foundation-honest-1`)

<!-- prettier-ignore -->
| Content | Label under it |
| --- | --- |
| A proxy answer (`person`, `never`, `remember`) | `business.label.yourWords` |
| The five scales (given view) | `business.identity.hypothesis` once, under the Personality heading, above the five lines |
| The derived architecture | `business.architecture.because` |
| The working name | `business.name.notScreened` |
| A core idea | `business.positioning.by.own` |

### 4.5 A heading never stands alone (sign-off 1, F1)

Every field heading in every state has a line under it:

- the content with its label; or
- when the field has no content, `business.state.skipped` if the node is skipped, else `business.state.empty`, as a `p.text-body-sm.text-text-secondary`;
- on Brand architecture with the answer "yes", `business.architecture.notInVersion` under Architecture.

A read-only view (no `controls`) shows the same fields with the same fallbacks and no button row. The button row and the failure region render only when the view has a control to show, so no empty wrapper adds a gap.

## 5. Editors: the shared behaviour

As ORV-285 `positioning-choice-1`, "The editors", for every foundation editor:

<!-- prettier-ignore -->
| Event | What shows | Focus goes to | Screen reader hears |
| --- | --- | --- | --- |
| The opener is pressed (Describe, Give a working name, Write my own) | The editor in place of the fields | The editor's first control (the first textarea or the input) | Its label, as typed in the catalog |
| Save with a client error (empty required, too long, a scale unchosen) | The `Field` error under each failing control; no call | The first failing control in DOM order (on a scale, its first radio, which focus does not check) | The control's name, "invalid", then the error (`aria-describedby`) |
| Save while the call runs | Save shows `loading` with `business.positioning.saving`; Save and Cancel take `aria-disabled`; text and radios stay as they are | Stays on Save | "Saving your choice" (the button's loading label) |
| The call fails (`saved.errors.rate-limited` with the wait, `.signed-out`, `.failed`) | `Notice variant="danger"` 12 under the row inside `div role=alert`; every answer and chosen point stays | Stays on Save | The notice text, once (the region is the live alert) |
| Cancel | The editor closes, nothing saved, the view as before; the next open starts empty with no point chosen | The opener | The opener's name |
| Save succeeds | The new state of the view; the editor is gone | The value field's `h3` (`tabIndex=-1`): Personality, Working name, Core idea; on Brand architecture, the Architecture `h3` | The heading, then the person reads on |
| A skip (Skip for now) | `loading` on Skip with the saving label; then the skipped state | The opener that stays offered (Describe the personality, Write my own) | Its name |

The second press while a save runs makes no call (`aria-disabled`, not `disabled`, so focus stays on the button). The client check runs before any call, as `PositioningSection`.

---

## Part B, PR 1: Brand personality

## 6. Brand personality (`identity-frame`)

### 6.1 States of the view

<!-- prettier-ignore -->
| # | State (spec rule) | State line | Mark lines | Fields | Controls (primary first) |
| --- | --- | --- | --- | --- | --- |
| I1 | Waiting (`blocked` by Positioning) | `business.state.waiting` "Waits for Positioning" | none | Three fields, each `business.state.empty` | none |
| I2 | Open, no entry | `business.state.empty` | none | Three fields, each `business.state.empty` | **Describe the personality** (primary), Skip for now (ghost) |
| I3 | Skipped | `business.state.skipped` | none | Three fields, each `business.state.skipped` | **Describe the personality** (primary) |
| I4 | Editor open, nothing chosen | state line of I2 or I3 | none | the editor (6.2) | **Save this personality** (primary), Cancel (secondary) |
| I5 | Editor, a scale left unchosen | as I4 | none | `business.identity.axesRequired` under each unchosen scale | as I4 |
| I6 | Editor, an answer over 2,000 | as I4 | none | `business.intake.tooLong` with 2000 under that textarea | as I4 |
| I7 | Editor, saving | as I4 | none | the editor, unchanged | Save loading, both `aria-disabled` |
| I8 | Editor, the call failed | as I4 | none | the editor, unchanged | as I4, the danger notice under the row |
| I9 | Given | `business.state.given` "Given by you" | none | Person and Never: the answer with `yourWords`, or `business.state.empty` when not given; Personality: 6.3 | none |
| I10 | Given, unchecked (W4 cases 2, 5) | as I9 | `business.marks.unchecked` "Not yet checked against: Positioning" | as I9 | none |
| I11 | Read-only (no `controls`) | the state's own line | as the state | as the state | none |
| I12 | Long content | as I9 | as the state | 2,000-character Thai answers with no spaces wrap inside the column | none |

The hypothesis line shows where the scales show: once in the editor and once in the given view. Under an empty Personality field (I1 to I3) the field shows its fallback only (section 15, item 5).

### 6.2 The personality editor

```text
div.flex.min-w-0.flex-col.gap-6 [data-editor]
  Field label=business.question.person             Textarea size=md rows=3 maxRows=8   (optional, no mark)
  Field label=business.question.never              Textarea size=md rows=3 maxRows=8   (optional, no mark)
  div.flex.min-w-0.flex-col.gap-6 [data-scales]
    p.text-body-sm.text-text-secondary             business.identity.hypothesis (once)
    5 x Field group required label="From {low} to {high}" error=(axesRequired when unchosen after a save)
          RadioGroup size=md (vertical) value={point ?? ""} onValueChange
            RadioGroupItem value="1" label="1 of 5" description={low}
            RadioGroupItem value="2" label="2 of 5"
            RadioGroupItem value="3" label="3 of 5"
            RadioGroupItem value="4" label="4 of 5"
            RadioGroupItem value="5" label="5 of 5" description={high}
  div.flex.min-w-0.flex-col
    div.flex.flex-wrap.items-center.gap-2 [data-row]   Save this personality (primary), Cancel (secondary)
    div role=alert                                      the failure notice
```

The scale, decided with the owner's word "no preset":

- **Unchosen.** The group is controlled with `value=""` from the first render, never `defaultValue` and never `undefined` (an uncontrolled group would keep a stale point across Cancel). Measured: 0 radios with `aria-checked="true"` in each of the five groups; every circle draws the same unchecked border, so no point reads as chosen. Points 1 and 5 carry the end words as their description, which is a line of text under the label, not a mark on the circle.
- **Chosen.** The chosen circle takes the selection tokens through the radio recipe (`data-state=checked`); no brand accent, no bar, no fill along the scale.
- **Focus.** The radio recipe's focus form, a border with a 3 px halo on the circle (measured: `box-shadow` 0 0 0 3px of `focus.ring` at 24 percent, border in the focus colour). A focused unchosen point shows the ring and no dot, so focus never reads as a choice.
- **Keyboard.** Tab order: the person textarea, the never textarea, scale 1 to scale 5 (one stop each), Save, Cancel. Tab enters an unchosen group on point 1 without choosing it; the arrow keys move and choose (Radix radio group); Tab enters a chosen group on its chosen point.
- **Screen reader.** On entering a group: "From Serious to Playful, required, radio group", then "1 of 5, radio button, not checked, Serious". After a save with it unchosen: the group is `aria-invalid` and its description is "Choose a point on each of the five scales, or cancel."
- **Size at 360.** One shape at every width: five rows per scale, the group 216 tall (items 35 apart, 59 for items 1 and 5 with their end word). The editor is 1,827 tall in Thai at 360 and scrolls in the viewer; no horizontal scroll in either language (measured `scrollWidth` equal to `clientWidth` on the page and the region).
- **Why vertical.** A row of five points with end words at both ends needs about 420 px for the longest English pair ("Everyday and easy to reach" to "Premium and exclusive"); at 360 it would wrap into two shapes. The vertical list keeps one shape, a 35 px pitch per point with the label inside the hit area, and the end words beside the points they name.

### 6.3 The given personality

Under the Personality heading, the hypothesis line, then:

```text
dl.mt-2.flex.flex-col.gap-3
  5 x div.flex.min-w-0.flex-col.gap-0.5
        dt.text-body-sm.text-text-secondary   "From Serious to Playful"
        dd                                    "2 of 5"
```

The point is shown as its words only. No dots, bar, slider or filled scale: a drawn scale reads as a rating, which `foundation-honest-1` and DESIGN.md section 9 item 11 rule out.

### 6.4 Focus and the primary action per state

<!-- prettier-ignore -->
| State | Primary | Focus after |
| --- | --- | --- |
| I2 | Describe the personality | Describe: the person textarea. Skip: Describe the personality |
| I3 | Describe the personality | Describe: the person textarea |
| I4 to I8 | Save this personality | Save valid: the Personality `h3`. Invalid: the first failing control (the never textarea for too long; else the first unchosen scale's point 1). Cancel: the opener |
| I1, I9 to I12 | none | not moved |

### 6.5 Plays (PR 1)

Each play names its story (spec acceptance rows) and its measured bound. Visual criteria use the shared helpers of `src/testing/visual-asserts.ts` and `expectFitsAt360` of `business-story-helpers.tsx`, guarded with `inVitest` where they read a screenshot.

<!-- prettier-ignore -->
| States | Story | Play clause and bound |
| --- | --- | --- |
| B1 board, PR 1 | `Board` (row 9) | six cards, seven edges; `identity-frame` at world (1400, 160); its card's `[data-node-state]` text and its three `li` equal section 3; no answer text inside the card; `expectPortPillsClear` on Positioning and Brand personality; Enter opens the viewer titled "Brand personality", Escape returns focus to the card |
| B2 fit at 1440 | `Board` at the 1440 frame | viewport zoom 0.640 within 0.01; every card inside the board |
| B3 fit at 360 | `IdentityNarrow` and the narrow board stories | zoom 0.25 within 0.001; `document.documentElement.scrollWidth` at most 360; for each node in fill order, `node.focus()` then its box inside the board's box within 0.5 (auto-pan); replaces the every-card-inside assert of ORV-285 `narrowPlay` |
| I1 | `IdentityWaits` (row 5) | state line "Waits for Positioning"; three `[data-field]`, each `h3` followed by a `p` with `business.state.empty`; no `button` inside `[data-node]` |
| I2, I3 | `IdentitySkipped` (row 4) | I2: the row holds Describe (primary) and Skip (ghost), `expectSameHeight` (40); Skip: state line "Skipped for now", each field shows "Skipped for now", one button, focus on it |
| I4, I5, I6, I7, I8 | `IdentityInvalid` (row 3) | on open: focus on the person textarea; 0 `[aria-checked="true"]` in each of the five `[role=radiogroup]`; hypothesis `p` once inside `[data-editor]`. Save with one unchosen: that Field's error equals `axesRequired`, the group `aria-invalid`, focus on its first radio, still 0 checked there, 0 calls. 2,001 characters: `tooLong` with 2000, focus on the textarea. Rate limited: the notice holds `saved.errors.rate-limited`, the points and text unchanged. Double press: 1 call, Save `aria-disabled` with the saving label; `expectSameHeight(save, cancel)` |
| I9 | `IdentityGiven` (row 2) | state "Given by you"; five `dt`/`dd` pairs in axis order, each `dd` matching "n of 5"; hypothesis `p` exactly once in the view; `yourWords` under Person; no button; focus on the Personality `h3` after the save; `expectNoGlyphClip` on each `dd` and `expectInkClearsAbove(dd, dt, 2)` |
| I10 | `IdentityMarks` (row 6) | one `[data-marks]` line "Not yet checked against: Positioning" inside `[data-head]`, 8 under the state line (within 0.5) |
| I11 | `IdentityWaits` read-only variant | as I1 with no `[data-row]` and no `[role=alert]` child |
| I12 | `IdentityNarrow` (row 11), `FoundationUntrustedText` (row 8) | `expectFitsAt360`; `expectNoGlyphClip` on the 2,000-character Thai answer; every text block's left equal to the state line's left within 0.5; the untrusted answer as literal text, no `img` |
| all | `IdentityNarrow`, light and dark | Tab order: person, never, five groups, Save, Cancel; `expectFocusBorderForm` on Save and Cancel; the focused radio's border in the focus colour with a 3 px halo; a11y addon zero violations |

**Correction, 2026-11-19 (task ORV-291-spec-3): plays B2 and B3 as builder task A3 built them at `3c646c4` (ORV-291 comment 10748; section 2.3's correction).**

- **B2** is the story `BoardAt1440` in `business-board.stories.tsx`: at the 1440 frame, after zoom to fit, the viewport zoom is 0.617 within 0.01 (measured 0.6167, bound by the board's height), and every card is inside the board within 0.5.
- **B3** is the clause of `narrowPlay` in `business-board.stories.tsx`, run by `NarrowLight`, `NarrowDark` and `NarrowEnglish`; `IdentityNarrow` holds the view, not the board, and does not run it. It asserts: zoom 0.25 within 0.001; `document.documentElement.scrollWidth` at most the larger of 360 and the window's inner width; for each node in fill order, after `node.focus()`, the node has focus and its box overlaps the board's box on both axes, in place of "inside the board's box within 0.5". Situation and Brand personality stay cut by 59 px each (2.3). The follow-up that would restore the inside clause is a pan into view on focus in the shared `CanvasBoard`, on the second slice card of ORV-280. `expectFitsAt360` skips the elements inside `.react-flow__viewport`, so the board's world may pass its frame while the frame itself is checked.
- **The row "all"** runs in `IdentityNarrowEditor`, `IdentityNarrowEditorDark` and `IdentityNarrowEditorEnglish`, which open the editor at 360; `IdentityNarrow` holds the given view with the 2,000-character answers (I12).

---

## Part C, PR 2: Brand architecture and Name

## 7. The board at stage 2

`situation` moves to y 447 (section 2.1) in this PR, `architecture` and `name` join, and the four PR 2 edges with the port order of 2.2. Plays:

- `Board` (row 23): eight cards and eleven edges; the two new cards at (1400, 576) and (1888, 473); `situation` at (0, 447); `expectPortPillsClear` on Brand architecture and Name with every pill shown; fit 0.524 within 0.01 at 1440.
- The B3 clause at 360 with eight nodes.

**As-built note, 2026-11-20 (task ORV-296-design-notes-1), for finding F1 of the PR 2 visual sign-off (ORV-295-signoff-1): the `Board` play as PR 2 built it at `6aea3cf`.**

- **Port pills.** At zoom 1 the whole-list port-pill read holds business core, audience and competitive frame; Positioning's four pills, and Brand architecture's three and Name's two, are read whole at the fit zoom. Why: a pill outside the board's frame is not read, and with eight nodes the world is wider, so the 100 percent view no longer holds Positioning, or the cards of columns 4 and 5, whole. `expectPortPills` in `business-board.stories.tsx` focuses every card at both zooms and runs `expectPortPillsClear` on each; it requires every pill of a card to be read only for the cards named at that zoom: all of them at the fit zoom, the three cards of column 2 at zoom 1.
- **Where the other clauses run.** The fit 0.524 within 0.01 at 1440 is the story `BoardAt1440`, not `Board` (section 2.3's note); the B3 clause at 360 runs in `NarrowLight`, `NarrowDark` and `NarrowEnglish` (section 6.5's correction).

## 8. Brand architecture (`architecture`)

### 8.1 States of the view

<!-- prettier-ignore -->
| # | State | State line | Mark lines | Fields, in order | Controls |
| --- | --- | --- | --- | --- | --- |
| A1 | No answer, open | `business.state.empty` | none | The choice (8.2) in the place of Other brands above or below; Architecture: `business.state.empty` | **Save this answer** (primary) |
| A2 | No answer, waiting | "Waits for Positioning" | none | as A1 (the answer is asked whatever the marks, row 17 third case) | as A1 |
| A3 | No choice on save | as A1 or A2 | none | `business.architecture.choiceRequired` as the Field error | as A1 |
| A4 | Saving | as A1 | none | as A1, the choice kept | Save loading, `aria-disabled` |
| A5 | Call failed | as A1 | none | as A1, the choice kept | as A1, the notice under it |
| A6 | Derived | `business.state.derived` | none | Other brands above or below: `business.architecture.no`; Architecture: `business.architecture.single` with `business.architecture.because` | none |
| A7 | Derived, provisional (Positioning skipped) | as A6 | `strategy.provisional`, `business.marks.restsOn` "Rests on: Positioning" | as A6 | none |
| A8 | Derived, unchecked | as A6 | `business.marks.unchecked` | as A6 | none |
| A9 | Answered "no", waiting | "Waits for Positioning" | none | Other brands: the answer; Architecture: `business.state.empty` (no value while blocked) | none |
| A10 | Answered "yes" | `business.state.notInVersion` | none | Other brands: `business.architecture.yes`; Architecture: `business.architecture.notInVersion` as a secondary line | none |
| A11 | Read-only, no answer | `business.state.empty` | none | both fields `business.state.empty` | none |

The stored answer is shown as the choice's own words with no `yourWords` label: it is a pick between two catalog sentences, not the person's text.

**As-built note, 2026-11-20 (task ORV-296-design-notes-1), for finding F1 of the PR 2 visual sign-off (ORV-295-signoff-1): state A8.** A8 cannot be reached in PR 2: a derived architecture gathers a skipped root as provisional (A7), and its roots, Positioning and Situation, carry no unchecked list, so no fixture under `foundation-marks-1` with PR 2's roots shows a derived, unchecked architecture. The view still shows the unchecked line for any node that carries it: the mark block of section 4.3 is shared, and Name's N8 and Brand personality's I10 show it.

### 8.2 The inline choice (no Cancel)

```text
div.flex.min-w-0.flex-col.gap-3 [data-field=subBrands]
  Field group label=business.question.subBrands error=(choiceRequired)
    RadioGroup size=md (vertical) value={choice ?? ""}
      RadioGroupItem value="no"  label=business.architecture.no
      RadioGroupItem value="yes" label=business.architecture.yes
  div.flex.min-w-0.flex-col
    div.flex.flex-wrap.items-center.gap-2 [data-row]   Save this answer (primary)
    div role=alert                                      the failure notice
```

Measured: the group 62 tall at 360 in Thai (two items 35 apart), the Save row 12 under it, the Architecture field 24 under the row. Unchosen at first: 0 checked. The question is the group's name, so the field heading "Other brands above or below" is not shown while the choice is asked (it would repeat the question); once answered, the field shows under its heading.

Focus: Save valid lands on the Architecture `h3`; no choice lands on the first radio (not checked); a failure keeps focus on Save. Screen reader: "Does this brand sit above or below other brands?, radio group", then "No, it stands on its own, radio button, not checked".

### 8.3 Plays

<!-- prettier-ignore -->
| States | Story | Play clause and bound |
| --- | --- | --- |
| A1, A6 | `ArchitectureDerived` (row 15) | before: 0 checked, one button in the row; choose No and save: state "Worked out by a fixed rule", Architecture `p` "Single brand, one unit" then the `because` line, `expectInkClearsAbove(because, value, 2)`; no button; focus on the Architecture `h3` |
| A3, A10 | `ArchitectureNotInVersion` (row 16) | empty save: the error equals `choiceRequired`, focus on the first radio, 0 calls; Yes: state "Not in this version", the Architecture field's only line is the `notInVersion` sentence; the Name card's state line "Waits for Brand architecture" |
| A2, A7, A8, A9 | `ArchitectureMarks` (row 17) | the three fixtures as row 17; in A7 `[data-marks=provisional]` holds two lines 4 apart (within 0.5), first `strategy.provisional`; the provisional pair's left equals the state line's left |
| A4, A5 | `ArchitectureDerived` with a stub | double press 1 call; rate limited: the notice under the row, the choice still checked |
| all at 360 | `FoundationNarrow` (row 23) | `expectFitsAt360` in both languages; `expectNoGlyphClip` on the Thai radio labels ("ไม่ใช่ แบรนด์นี้อยู่เดี่ยว ๆ"); `expectFocusBorderForm` on Save |

**As-built note, 2026-11-20 (task ORV-296-design-notes-1), for finding F1 of the PR 2 visual sign-off (ORV-295-signoff-1): the row "A2, A7, A8, A9".** `ArchitectureMarks` and `ArchitectureMarksEnglish` in `foundation.stories.tsx`, as built at `6aea3cf`, read three cases: A9 (answered "no", waiting, Architecture `business.state.empty`, no mark, no button), A7 (answered, Positioning skipped: derived, with the provisional pair 4 apart, 8 under the state line and at its left edge, within 0.5) and A2 (no answer, waiting, the question with 0 checked and Save offered). A8 has no story: it cannot be reached in PR 2 (section 8.1's note).

## 9. Name (`name`)

### 9.1 States of the view

<!-- prettier-ignore -->
| # | State | State line | Mark lines | Fields | Controls |
| --- | --- | --- | --- | --- | --- |
| N1 | Open | `business.state.empty` | none | Working name: `business.state.empty` | **Give a working name** (primary) |
| N2 | Ahead (`blocked`, row 20 before) | "Waits for Positioning" or "Waits for Brand architecture" | none | as N1 | **Give a working name** (a name can come first) |
| N3 | Editor | as N1 or N2 | none | the editor (9.2) | **Use this working name** (primary), Cancel |
| N4 | Empty or 61 characters on save | as N3 | none | `business.name.required`, or `business.intake.tooLong` with 60 | as N3 |
| N5 | Saving | as N3 | none | the editor, unchanged | Save loading, both `aria-disabled` |
| N6 | Call failed | as N3 | none | the editor, the text kept | as N3, the notice under the row |
| N7 | Given | `business.state.given` | none | Working name: the name in `bdi`, then `business.name.notScreened` | none |
| N8 | Given, unchecked (row 20 after) | as N7 | `business.marks.unchecked` with Positioning, or Positioning and Brand architecture | as N7 | none |
| N9 | Long name | as N7 | as the state | a 60-character Thai name with no spaces wraps (two lines at 360) | none |
| N10 | Read-only | `business.state.empty` | none | as N1 | none |

### 9.2 The name editor

```text
div.flex.min-w-0.flex-col.gap-3 [data-editor]
  Field label=business.field.workingName required error=(required | tooLong 60)
    Input size=md          (no maxLength: the client check shows tooLong, as the positioning editor)
  div.flex.min-w-0.flex-col
    div.flex.flex-wrap.items-center.gap-2 [data-row]   Use this working name (primary), Cancel (secondary)
    div role=alert
```

`gap-3` because it holds one field, as ORV-285's editor. The `required` mark (" *", `aria-hidden`) and `aria-required` say the name is needed; no other copy is added. Screen reader on open: "Working name, required, edit text".

### 9.3 Plays

<!-- prettier-ignore -->
| States | Story | Play clause and bound |
| --- | --- | --- |
| N1, N3, N7 | `NameGiven` (row 18) | Give: focus on the input; type "  ORIVILO  ", save: the `bdi` text "ORIVILO", `notScreened` under it, state "Given by you", no button, focus on the Working name `h3`; `expectInkClearsAbove(notScreened, name, 2)` |
| N4, N5, N6 | `NameInvalid` (row 19) | empty: `required`, focus on the input, 0 calls; 61 characters: `tooLong` with 60, the text kept; Cancel: focus on Give a working name; double press: 1 call; `expectSameHeight(save, cancel)` |
| N2, N8 | `NameAhead` (row 20) | before: state "Waits for Positioning" and the Give button; after: the name, `notScreened`, "Given by you" and one `[data-marks=unchecked]` line |
| N9 | `FoundationNarrow` (row 23) | `expectFitsAt360`; `expectNoGlyphClip` on the 60-character Thai name; the name's left equals the `h3`'s left |
| untrusted | `FoundationUntrustedText` (row 22) | the name as literal text, no `img` |

---

## Part D, PR 3: Core idea

## 10. The board at stage 3

`core-idea` joins at (1888, 212) with its two edges; the board is 2208 wide as at stage 2, so the fit at 1440 stays 0.524. `Board` (row 34): nine cards, thirteen edges; Core idea's card shows the gate line as its last `p`; `expectPortPillsClear` on Core idea; the B3 clause at 360 with nine nodes; Tab reaches Core idea last.

**As-built note, 2026-11-20 (task ORV-296-design-notes-1): the board at stage 3 as task C2 built it at `39f216a`.**

- **`Board` and `BoardEnglish`** wait for nine cards and thirteen edges, read the edges in W2 order, place Core idea at (1888, 212) and read its card's paragraphs as the state line then the gate line (on this fixture Core idea waits for Positioning, so the gate line is `business.state.gate`); Tab reaches the nine nodes in fill order, Core idea last, then the dock.
- **Port pills.** Core idea's two pills are read whole at the fit zoom, with every other card. At zoom 1 the whole-list read still holds only the three cards of column 2 (section 7's note), so Core idea's pills are not required whole at 100 percent.
- **Where the other clauses run.** The fit at 1440 is `BoardAt1440` (section 2.3's note); the B3 clause with nine nodes runs in `NarrowLight`, `NarrowDark` and `NarrowEnglish`.
- **The gate line on two cards.** `business.state.gate` now shows on Positioning's card and on Core idea's, so the earlier plays that count it, `Skipped` and `NarrowSkipped`, count 2, not 1.

## 11. Core idea (`core-idea`)

### 11.1 States of the view

The gate line is the dialog description in every state; the view does not repeat it.

<!-- prettier-ignore -->
| # | State (`core-idea-gate-1`) | Description | State line | Mark lines | Fields | Controls |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | `blocked` | `business.state.gate` | "Waits for Brand personality" or "Waits for Positioning" | none | both `business.state.empty` | none |
| C2 | `open` | `business.state.gate` | `business.state.empty` | none | both `business.state.empty` | **Write my own** (primary), Skip for now (ghost) |
| C3 | `open`, skipped | `business.state.gate` | `business.state.skipped` | none | both `business.state.skipped` | **Write my own** (primary) |
| C4 | Editor | as C2 or C3 | as C2 or C3 | none | the editor (11.2) | **Agree to this core idea** (primary), Cancel |
| C5 | Empty or 301 on agree | as C4 | as C4 | none | `business.coreIdea.statementRequired`, or `tooLong` with 300; `tooLong` with 2000 on the remember answer | as C4 |
| C6 | Saving | as C4 | as C4 | none | the editor, unchanged | Agree loading, both `aria-disabled` |
| C7 | Call failed | as C4 | as C4 | none | the editor, the text kept | as C4, the notice under the row |
| C8 | `given` | `business.coreIdea.gatePassed` | `business.state.agreed` | none | Remember: the answer with `yourWords`, or `business.state.empty`; Core idea: the statement with `business.positioning.by.own` | none |
| C9 | `given`, unchecked | as C8 | as C8 | `business.marks.unchecked` | as C8 | none |
| C10 | Long content | as C8 | as C8 | as the state | a 2,000-character remember answer and a 300-character Thai statement, no spaces, wrap | none |
| C11 | Read-only | as the state | as the state | as the state | as the state | none |

### 11.2 The core idea editor

```text
div.flex.min-w-0.flex-col.gap-6 [data-editor]
  Field label=business.question.remember                      Textarea size=md rows=3 maxRows=8   (optional, no mark)
  Field label=business.field.coreIdea required error=(...)     Textarea size=md rows=3 maxRows=8
  div.flex.min-w-0.flex-col
    div.flex.flex-wrap.items-center.gap-2 [data-row]           Agree to this core idea (primary), Cancel (secondary)
    div role=alert
```

No `maxLength` and no counter on either textarea: the client check shows `tooLong`, as the positioning editor. Focus on open: the remember textarea. An empty statement on agree: focus on the Core idea textarea.

### 11.3 Plays

<!-- prettier-ignore -->
| States | Story | Play clause and bound |
| --- | --- | --- |
| C2, C4, C8 | `CoreIdeaWritten` (row 26) | before: description equals `state.gate`, state "Nothing given yet", row of two, `expectSameHeight` (40); Write my own: focus on the remember textarea; agree: description `gatePassed`, state "Agreed", the statement then `by.own`, the remember answer then `yourWords`, no button, focus on the Core idea `h3` |
| C5, C6, C7 | `CoreIdeaInvalid` (row 27) | empty: `statementRequired`, focus on the Core idea textarea, 0 calls; 301: `tooLong` with 300; rate limited: the notice, both texts kept; Cancel: focus on Write my own, empty on reopen; double press 1 call |
| C3 | `CoreIdeaSkipped` (row 28) | state "Skipped for now", description `state.gate`, both fields "Skipped for now", one button, focus on it after the skip |
| C1 | `CoreIdeaWaits` (row 29) | the three fixtures' state lines; description `state.gate`; no `button` in `[data-node]` |
| C9 | `CoreIdeaMarks` (row 30) | state "Agreed"; one `[data-marks=unchecked]` line naming the row's node |
| C1, C2, C3, C8 cards | `CoreIdeaStates`, `CoreIdeaStatesOpen`, `CoreIdeaStatesSkipped`, `CoreIdeaStatesAgreed` and their English stories (row 31) | the card's `[data-node-state]` and last `p` equal section 3's table; the view's state line and description equal 11.1 |
| C10 | `CoreIdeaNarrow` (row 34) | `expectFitsAt360`; `expectNoGlyphClip` on the 300-character Thai statement; Tab to the Core idea card, Enter, the view opens |
| all four views | `FoundationNoAi` (row 35) | no text matching the five AI labels of `foundation-honest-1`; no number other than "n of 5"; no `[data-ai-line]` |

**As-built note, 2026-11-20 (task ORV-296-design-notes-1): the Core idea plays as task C2 built them at `39f216a`.**

- **File and host.** The `CoreIdea*` stories live in a new file, `core-idea.stories.tsx` (title "Examples/Application: Core idea"), not in `foundation.stories.tsx`. Each renders the whole `BusinessBoardScreen` with a stub host, because the gate line is the viewer's description and a view alone cannot show it; the play opens the view from the Core idea card (focus, then Enter). `CoreIdeaWaits` and `CoreIdeaMarks` hold their three fixtures on one board, picked by three numbered buttons above it (`data-fixture`), which the play presses in turn. Each Thai `CoreIdea*` story but `CoreIdeaNarrowDark` (the dark frame of `CoreIdeaNarrow`) has an English twin. `FoundationUntrustedText` and `FoundationNoAi` stay in `foundation.stories.tsx`.
- **C2, C4, C8, `CoreIdeaWritten`.** As the row, with one number read elsewhere: the play asserts `expectSameHeight` on the two buttons without the figure, and the 40 (within 0.5) is read on every button in `CoreIdeaStatesOpen` and `CoreIdeaStatesSkipped`. It adds `expectInkClearsAbove(by.own, statement, 2)`, read with focus taken off the heading, because the heading's focus line reaches into the statement's box.
- **C5, C6, C7, `CoreIdeaInvalid`.** Adds a remember answer of 2,001 characters: `tooLong` with 2000 under it, focus on the remember textarea (the first failing control in DOM order, section 5), no call. During the double press Cancel is `aria-disabled` too, and a press on it leaves the editor open.
- **C3, `CoreIdeaSkipped`.** Goes on as spec row 28: Write my own, agree with no remember answer; the Remember field then shows `business.state.empty`.
- **C1, `CoreIdeaWaits`.** The three fixtures read "Waits for Brand personality" (Positioning agreed, no personality entry), "Waits for Positioning" (no positioning choice) and "Waits for Positioning" (positioning stale, personality given); the play also finds no `[data-row]`.
- **C9, `CoreIdeaMarks`.** Each fixture names one node: Positioning (Positioning skipped), Brand personality (personality skipped), Positioning (positioning stale); each also reads the description `gatePassed` and no button.
- **C10, `CoreIdeaNarrow`, `CoreIdeaNarrowDark`, `CoreIdeaNarrowEnglish`.** The board in a 360 container with `expectFitsAt360`; Tab from Name lands on Core idea with `:focus-visible`; the view is opened and read at a 360 x 760 window: the dialog inside 0 to 360, the region's `scrollWidth` at most its `clientWidth`, every block's left at the state line's within 0.5, and `expectNoGlyphClip` on the whole region, not on the statement alone; then the story's language switch redraws card and view in the other language. The fixture holds the 300-character Thai statement and no remember answer (the fixture of spec row 34), so the Remember field reads `business.state.empty`: the 2,000-character remember answer of 11.1 C10 is in no story. This is recorded, not accepted; it is open to a decision.
- **All four views, `FoundationNoAi` and `FoundationNoAiEnglish`.** Six fixture projects, each rendering the four views read-only with their headings, outside the board and the dialog, so the editors and the dialog description are not read. The five AI labels are read as far as the catalog holds them: the prefix of `brandReport.engine["evidence.fromModel"]`, every `business.positioning.by` line other than `own`, and every `strategy` line other than `skip` and `provisional`. The labels for drafted options, drafted by, picked and edited are not catalog keys yet, so those lists are empty today and apply once the keys land. Before the read, the catalog's own negations (`business.identity.hypothesis`, `business.name.notScreened`) and the five "n of 5" points are taken out; then no digit, Latin or Thai, and no claim word (verified, tested, screened, registered, and their Thai words) may remain.
- **Untrusted text (spec row 33).** `FoundationUntrustedText` and its English story now also host the Core idea view: the statement and the remember answer as literal text in a `bdi` with no child element, and no `img`, `script`, `a` or `b` in the view.

---

## Common

## 12. Tokens and classes used

Semantic utilities already used by the business screens: `text-text-primary` (default ink), `text-text-secondary`, `text-body-sm`, `text-label-md`, `bg-surface-canvas`. Recipes through components only: `ds-button` (primary, secondary, ghost; md), `ds-field`, `ds-control` (Textarea, Input), the radio recipe (`ds-radio`, selection tokens for checked, `focus.*` for focus, `border.error` for invalid), `ds-alert` (danger, through `Notice`), the dialog and scroll area recipes. Layout utilities: `flex`, `flex-col`, `flex-wrap`, `items-center`, `self-start`, `min-w-0`, `max-w-[42rem]` (the 42rem column ORV-285 uses), `gap-0.5`, `gap-1`, `gap-2`, `gap-3`, `gap-6`, `mt-2`, `mt-3`, `pe-3`, `whitespace-pre-wrap`. No hex, radius, shadow or font value; no new token.

## 13. DESIGN.md section 9, walked

<!-- prettier-ignore -->
| # | Anti-pattern | Result |
| --- | --- | --- |
| 1 | Default look | Pass: neutral profile; violet only on the primary buttons and the selection of a chosen point |
| 2 | Broadsheet | Pass: 24 between blocks, 1.7 line height for Thai, one column |
| 3 | Card kit | Pass: no new card in the view; fields are plain text blocks |
| 4 | Template chrome | Pass: no caps eyebrow, no middot, no dash fragment, no arrows |
| 5 | Labels that add nothing | Pass: each `h3` has content or a fallback under it (4.5); the question replaces the field heading while it is asked (8.2) |
| 6 | Ambient motion | Pass: none added; reduced motion changes nothing |
| 7 | Numbered markers | Pass: "n of 5" is a point on a scale, the only number shown |
| 8 | Lime or focus misuse | Pass: focus keeps its line and halo on every control (measured on radio, input, button) |
| 9 | Thai set with Latin rules | Pass: no tracking or caps; long Thai wraps without clipping in every frame |
| 10 | Studio style in the preview | Not applicable: the business board is Studio chrome, no preview frame |
| 11 | Fake evidence | Pass: no score, rating, bar, badge, recommended mark or AI label; the scales say they are a hypothesis; the name says it is not screened |
| 12 | Per-page mood patch | Pass: no raw value |

## 14. Strings

No new key. Every visible word is a key of the spec's Strings table or a reused key it names: `business.state.empty`, `.skipped`, `.gate`, `.agreed`, `business.label.yourWords`, `business.intake.tooLong`, `strategy.skip`, `business.positioning.writeOwn`, `.cancel`, `.saving`, `.by.own`, `saved.errors.*`. The required mark is the `Field` component's own " *" (`aria-hidden`), so the optional answers need no "optional" word.

## 15. Owner's choices (defaults this design uses)

1. **Card positions and lanes.** Default: the table of 2.1, two lanes, Core idea in the upper lane of column 5 and Name in the lower lane, so column 5 reads Core idea above Name though Name fills first.
2. **`situation` moves to y 447 in PR 2.** Default: move it; the alternative, leaving it, runs the `situation` to `architecture` edge 53.9 world px under Audience.
3. **The board at 360 no longer shows whole, from PR 1.** Default: the fit stops at 0.25, the person pans, and Tab pans each card into view; `narrowPlay` changes to the B3 clause. Alternative: the foundation nodes on a second board (spec open question 5 (b)). Correction, 2026-11-19 (task ORV-291-spec-3), as built at `3c646c4`: the default stays, read as focus bringing a card into view only when no part of it is in view, so Situation and Brand personality stay cut by 59 px each (2.3); accepted by the main session under the owner's POC delegation (ORV-291 comment 10748), and the owner can change it. A pan into view on focus in the shared `CanvasBoard` is a follow-up on the second slice card of ORV-280; the second board stays open to the owner (spec open question 14).
4. **The overview at 1440 is 0.524 from PR 2.** Default: accept; titles readable, card text small. Alternative: open the board fitted to the newest column.
5. **The hypothesis line shows only where the scales show** (the editor and the given view), not under an empty Personality field. The spec's "always" read as "whenever the scales show".
6. **The scale look.** Default: a vertical `RadioGroup` (md) per scale, labels "n of 5", the end words under points 1 and 5, the group named "From {low} to {high}". Alternatives: `size="sm"` (shorter editor, smaller hit area) or a horizontal row at wide widths (two shapes).
7. **`axesRequired` per unchosen scale.** Default: the error under each unchosen scale (each `Field` error is a live alert, so two unchosen scales announce the sentence twice). Alternative: one error above the button row.
8. **Mark lines as plain primary text.** Default: no `Notice`, no icon. Alternative: `Notice variant="info"` for the provisional pair.

## 16. Seen on the mock, not changed here

- The focus ring of an unchecked radio in dark mode is faint (24 percent halo on a dark surface); it is the catalog's radio focus form and is the same on every radio.
- The board's Tab order passes the edges before the nodes (13 stops at stage 3); `CanvasBoard`'s behaviour, unchanged.
- Sign-off 1 F2 (the viewer region's focus ring over the first text line) applies to these views too; it is fixed on its own card.
- At the 0.25 floor two edges cross a title band (2.2).
- A zero-length arrow key press (Playwright `press`) moves focus to the next point without checking it: Radix checks on focus only while the key is down, and its roving focus moves after a tick. A person's key press checks it (measured with an 80 ms hold). A play that proves "arrows choose" holds the key: `userEvent.keyboard("{ArrowDown>}")`, then `"{/ArrowDown}"`.

## 17. Rendered proof (mock)

A static page built in the scratch area with Vite from the PR 226 checkout's design-system source (`src/components`, `src/tokens/orivilo.css`, `fonts.css`), the classes and components of this file, and a banner on the page that says, in Thai and English, that it is a mock. The four foundation cards render on the real `CanvasBoard` with the real port and edge model; the five business cards carry placeholder bodies (about 90 tall, not 117), so the world-px clearances of 2.2 come from the bezier computation with the real heights, and the mock confirms the shape. View frames were shot 1900 (360) and 1300 (1440) tall so the whole view shows in one frame; the dialog shape is the same at any height.

Contact sheets, one per state, each holding its eight frames (360 and 1440, Thai and English, light and dark) with the measured values in the captions, in `.orivilo/runs/ORV-291/ORV-291-design-1/screenshots/`:

- Board: `board-pr1.png`, `board-pr2.png`, `board-pr3.png`, `board-cards.png`
- Brand personality: `id-waiting`, `id-open`, `id-readonly`, `id-skipped`, `id-edit`, `id-edit_focus`, `id-invalid`, `id-toolong`, `id-pending`, `id-failure`, `id-given`, `id-given-partial`, `id-marks`, `id-long`
- Brand architecture: `ar-open`, `ar-open_focus`, `ar-waiting`, `ar-invalid`, `ar-pending`, `ar-failure`, `ar-readonly`, `ar-derived`, `ar-blocked-answered`, `ar-marks`, `ar-unchecked`, `ar-notinversion`
- Name: `nm-open`, `nm-ahead`, `nm-readonly`, `nm-edit`, `nm-edit_focus`, `nm-invalid`, `nm-pending`, `nm-failure`, `nm-given`, `nm-marks`, `nm-long`
- Core idea: `ci-waiting`, `ci-open`, `ci-open_focus`, `ci-readonly`, `ci-skipped`, `ci-edit`, `ci-invalid`, `ci-pending`, `ci-failure`, `ci-agreed`, `ci-agreed-norem`, `ci-marks`, `ci-long`

Held on every one of the 400 view frames: no horizontal scroll on the page or in the viewer region; every text block and control starting at x 33 (the radio labels at x 61, inside their items); buttons in a row 40 tall; 0 checked radios in an unchosen scale or choice. Keyboard, measured on the editor: Tab goes person, never, one radio per scale (each `aria-checked="false"`), Save, Cancel; a held ArrowDown moves to point 2 and checks it.

## 18. Screens for visual QA

For each PR, the sign-off reads these stories at 360 and at the widest frame, Thai and English, light and dark:

- PR 1: `Board`, `IdentityWaits`, `IdentitySkipped`, `IdentityInvalid` (editor with nothing chosen, an error, saving, a failure), `IdentityGiven`, `IdentityMarks`, `IdentityNarrow`, `FoundationUntrustedText`. Check: no point reads as chosen before a choice; the hypothesis line once; the five "n of 5" lines with no drawn scale; no heading alone; focus on a radio as a ring with no dot.
- PR 2: `Board` (eight cards, `situation` moved, no edge under a card at 1440), `ArchitectureDerived`, `ArchitectureNotInVersion`, `ArchitectureMarks`, `NameGiven`, `NameInvalid`, `NameAhead`, `FoundationNarrow`.
- PR 3: `Board` (nine cards), `CoreIdeaWritten`, `CoreIdeaInvalid`, `CoreIdeaSkipped`, `CoreIdeaWaits`, `CoreIdeaMarks`, `CoreIdeaStates` and its three siblings with their English stories, `CoreIdeaNarrow`, `FoundationNoAi`.

**As-built note, 2026-11-20 (task ORV-296-design-notes-1): the PR 3 line as task C2 built it at `39f216a`.** The `CoreIdea*` stories are in `core-idea.stories.tsx` under "Examples/Application: Core idea", each Thai story but `CoreIdeaNarrowDark` with an English twin. Each renders the board; the view shows only once the Core idea card is opened (focus, then Enter), so a frame of the view is taken after that step. `CoreIdeaWaits` and `CoreIdeaMarks` show their first fixture at rest; fixtures 2 and 3 come from the numbered buttons above the board. `CoreIdeaNarrow` has `CoreIdeaNarrowDark` and `CoreIdeaNarrowEnglish` beside it, and its long fixture holds no remember answer (section 11.3's note). `FoundationUntrustedText` (spec row 33) now shows the Core idea view too. `FoundationNoAi` renders the four views read-only outside the dialog, so its frames show no gate line.

## Changelog

- 2026-11-19, ORV-291-design-1: first version, for spec v1.1 and the three PRs.
- 2026-11-19, task ORV-291-spec-3: dated corrections for what builder task A3 built at `3c646c4` and the decision of ORV-291 comment 10748 (the main session, under the owner's POC delegation): section 2.3, the fit at 1440 measured 0.6167 (asserted 0.617 within 0.01) and the 360 bullet as built (a card partly in view stays cut, 59 px on Situation and on Brand personality); section 6.5, plays B2 and B3 and the stories that run them; section 15 item 3, the default kept with the reading as built. No look, component measure, token or string changed. The spec is now v1.3.
- 2026-11-20, task ORV-296-design-notes-1: dated as-built notes, read from the stories and plays of PR 2 (PR 234, `6aea3cf`) and of PR 3 task C2 (`39f216a`). For finding F1 of the PR 2 visual sign-off: section 2.3 (the fit 0.524 at 1440 after PR 2 and after PR 3), section 7 (which cards' port pills are read whole at zoom 1 and which at the fit zoom, and where the fit and B3 clauses run) and sections 8.1 and 8.3 (A8 cannot be reached in PR 2). For Part D: section 10 (the stage 3 board plays, Core idea's pills at the fit zoom, the gate line counted on two cards), section 11.3 (the new stories file and its board host, each play as built, the long remember answer of C10 in no story, `FoundationNoAi` as far as the catalog holds the labels, Core idea in `FoundationUntrustedText`) and section 18 (the PR 3 line). No look, measure, token or string changed; no story was rendered for these notes.
