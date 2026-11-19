---
issue: ORV-285 (https://tpetkaew.atlassian.net/browse/ORV-285)
spec: docs/specs/ORV-285/spec.md v1.2
tech: docs/specs/ORV-285/tech.md
task: ORV-285-design-1, ORV-285-design-f1
author: designer
date: 2026-11-18
---

# ORV-285 design: the positioning section of the Positioning view, and the Positioning card

One section added to an existing view and one line added to an existing card, both in `packages/design-system/src/examples`, for both PRs of spec v1.0. Built only from catalog components (`Button`, `Field`, `Textarea`, `Alert` through the `Notice` helper of `brand-report.tsx`) and semantic utilities already used by the business screens. No new token, recipe class, component or public prop. One string is missing (N1, section 12).

Every number in this file was measured on a rendered mock (section 13): the section's markup, written with the classes named here, injected into the Positioning viewer of the slice 3 Storybook build (branch `feature/ORV-283-business-read`, head e5a688c), at 360 x 760 and 1440 x 900, Thai and English, light and dark, under the neutral profile. 18 view states and 6 card states, 192 frames, every bound below held on every frame. Nothing here is built code.

**Intent behind the look.** The person reads their own business back and makes one decision: what only they stand for. The ORV-283 sign-off order holds (V2, V3): the person's words and their label first, then field notes, then what a model made, and every model line carries its honest label. So the person's agreed statement sits as plain text under the section heading, exactly like any answer of theirs in the same view; drafted options sit apart in one sunken well with one intro line that says a model drafted them, each option repeats who drafted it and which of the person's own words it rests on; nothing ranks the options, nothing is coloured to recommend one. Calm: one reading column, one well, buttons in the shared recipe, the lime intent button only where the Intent Engine is asked to work (DESIGN.md section 8).

## 1. Flow

```text
Board ─ open Positioning ─▶ viewer: state line, "What only you give", then the section "Positioning statement"
  open (no draft)          ─ Draft options from my answers (PR 2, value given) ─▶ drafting ─▶ awaiting choice │ draft stopped (Notice, same controls)
                           ─ Write my own ─▶ editor ─ Agree ─▶ saving ─▶ given (agreed) │ save failed (Notice, text kept)
                           ─ Skip for now ─▶ skipped (gate open, Write my own and Draft still offered)
  awaiting choice          ─ Use this one ─▶ saving ─▶ confirmed (agreed, picked)
                           ─ Edit this one ─▶ option editor ─ Agree ─▶ confirmed (edited, or picked when unchanged, W4)
                           ─ Write my own ─▶ editor (options stay in view)      ─ Skip for now ─▶ skipped with the options kept
  given │ confirmed        ─ no control (changing an agreed positioning is out of scope)
  stale (later intake)     ─ the old statement with the stale line, the controls of open
Cancel in any editor ─▶ the state before the editor opened, focus back on the opener (N1)
```

## 2. Where it sits

**View.** `business-node-view.tsx`, node `positioning` only. The section is the last child of the view's fields container (`div.flex.flex-col.gap-6`, unchanged), so it sits 24 px under the value field (measured 24 on every frame) and inside the first column of the two-column viewer at 1440 (672 px wide; the second column, "Still to ask", is untouched). At 360 the column is 282 px of text between x 33 and x 315 inside the 294 px region; the scroll bar sits at x 323 (row D3 of ORV-281 holds).

**Card.** `business-board.tsx` `renderBody`, node `positioning` only: the same three parts as every card (state line, field list, gate line), with the gate's state and gate line (section 7).

**Suggested shape for the builder (not a public API).** A `PositioningSection` function in `src/examples` that takes the view's positioning gate, its options and callbacks (`onDraft`, `onChoose`), owned by the example screen. Editor text and the open editor are lifted to `ReadyBoard` state keyed by project, so closing and reopening the viewer in one visit keeps what was typed (a stopped draft's Notice is not kept, `positioning-honest-1`). The architect owns the names in tech.md.

## 3. Anatomy

The section, top to bottom. Every class is a semantic utility or layout utility already in the business examples; `FIELD_NOTE` is `"text-body-sm text-text-secondary"` from `business-text.ts`.

<!-- prettier-ignore -->
| Part | Element and classes | Shows when |
| --- | --- | --- |
| Section | `div.flex.min-w-0.flex-col.gap-3`, `data-field="positioning.statement"` | a statement exists or controls are given (`positioning.statement !== null \|\| controls !== undefined`); with neither, the section is not in the DOM (row F1-a, S0) |
| A. Lead group | `div.flex.min-w-0.flex-col.gap-1` | with the Section |
| A1. Heading | `h3.text-label-md.self-start`, `tabIndex={-1}`, id for `aria-labelledby`, text `business.field.statement` | with the Section |
| A2. Stale line | `p.text-body-sm` (primary ink, the voice of ORV-281 `belowFloor`), `business.positioning.stale` | `stale` true |
| A3. Statement | `p.whitespace-pre-wrap` holding `<bdi>{statement}</bdi>`, body type, primary ink | `given`, `confirmed`, `stale` |
| A4. Who wrote it | `p` with `FIELD_NOTE`: `business.positioning.by.own`, `by.picked` or `by.edited` with the draft's saved model id | `given`, `confirmed` (never with `stale`) |
| A5. Needs value | `p` with `FIELD_NOTE`, `business.positioning.needsValue` | PR 2, value answer empty, gate not passed |
| B. Drafted well | `div role="group" aria-labelledby={intro id}` `.flex.min-w-0.flex-col.gap-4.rounded-container.bg-surface-sunken.p-4` | a draft of the newest intake, gate not passed |
| B1. Intro | `p` with `FIELD_NOTE`, id, `strategy.draftedOptions`, once | with B |
| B2. Options | `ul.flex.flex-col.gap-4` of `li.flex.min-w-0.flex-col.gap-1`; from the second `li` on, add `border-t border-border-subtle pt-4` | with B |
| B3. Option name | `h4.text-label-md`, id, `business.positioning.option` with `{n}` | each option |
| B4. Option statement | `p.whitespace-pre-wrap` holding `<bdi>` | each option |
| B5. Drafted by | `p` with `FIELD_NOTE`, `business.positioning.draftedBy` with the draft's saved model id | each option |
| B6. Rests on | `div.mt-2.flex.min-w-0.flex-col.gap-1`: `p` with `FIELD_NOTE` `business.positioning.restsOn`, then `ul.flex.flex-col.gap-2` of `li.flex.min-w-0.flex-col`, each `p.text-body-sm.whitespace-pre-wrap` holding `<q><bdi>{quote}</bdi></q>` then `p` with `FIELD_NOTE` holding the `business.field.*` label of the quote's answer | each option |
| B7. Option actions | `div.mt-3` holding a row: `Button variant="secondary"` `business.positioning.pick`, `Button variant="ghost"` `business.positioning.edit` | each option, no editor open |
| C. Controls | `div.flex.min-w-0.flex-col` | gate not passed |
| C1. Rows | one row = `div.flex.flex-wrap.items-center.gap-2`; when Draft is offered, two rows in `div.flex.flex-col.gap-2`: row 1 Draft alone, row 2 the rest | no editor open |
| C2. Editor | `div.flex.min-w-0.flex-col.gap-3`: `Field label={business.positioning.writeOwn} error=…` around `Textarea size="md" rows={3} maxRows={8}` (no `maxLength`), then a row: `Button variant="primary"` `business.positioning.save`, `Button variant="secondary"` cancel (N1) | Write my own pressed |
| C3. Status | `div role="status"`, mounted from first render (alert-mount-1); a stopped draft adds `div.mt-3` holding `Notice variant="info"` | always with C |
| C4. Alert | `div role="alert"`, mounted from first render; a failed save adds `div.mt-3` holding `Notice variant="danger"` | always with C |

Quote field labels by answer key: idea `business.field.offer`, industry `business.field.industry`, customers `business.field.customers`, problem `business.field.problem`, competitors `business.field.alternatives`, value `business.field.value`. The quote marks come from `<q>` (the browser's quotes for the page language), never typed into the copy.

**Why two rows when Draft is offered.** In one wrapping row the ghost "Skip for now" would start a line at 360 with no visible edge, and Draft (the lime intent button) would sit beside its alternatives as if it were one of three equal choices. Draft alone on row 1, then the person's own paths on row 2, reads as "ask the engine, or do it yourself", with one start edge at x 33 (measured on every row, every frame).

**Why the section can be absent (F1).** A viewer opened without controls (every board story built before this story, and any read-only surface) has nothing to offer under the heading when no statement exists either: the heading would stand alone, an empty label that DESIGN.md section 9 item 5 forbids, where every other field without an answer shows a fallback line. So the heading shows only when something sits under it: a statement (A3, with A2 or A4), or the controls (C). With neither, the view ends after the value field exactly as on develop.

## 4. The drafted options, set apart from the person's words

1. **Place.** The person's statement (A3) is never inside the well; drafted text (B4) is never outside it. After a pick or an edit is agreed, the well is gone and the chosen text moves to A3 with the label that says the model drafted it (A4, `by.picked` or `by.edited`).
2. **Surface.** One well on `surface.sunken` with `shape.container.radius` (light: gray.100 on the gray.50 viewer; dark: gray.950 on gray.800). It is a quiet ground, not a card (no border, no shadow), so the person's own answers above stay on the viewer's ground. The well holds every option; options are divided by one `border.subtle` hairline, not by three cards (DESIGN.md section 9, card kit).
3. **Words.** `strategy.draftedOptions` opens the well once; every option repeats `business.positioning.draftedBy` with the saved model id, so a person who scrolls to option 3 still reads who wrote it; every option lists the person's own words it rests on, each with the name of the answer it came from. No score, no rank word, no "recommended", no number but the option's name.
4. **No recommended mark.** Each option's "Use this one" is `secondary`, the same weight for all; no option is `primary` and no option is first by colour. The section's one primary (or intent) button stays in the controls outside the well (section 5).
5. **Names, not ranks.** "Option 1, 2, 3" names the option so a button can say which one it acts on (DESIGN.md section 9 item 7 is justified: the number is a label, the order is the draft's, not a quality order).

## 5. States of the view

The state line is the existing `p[data-node-state]` at the top of the view, with `FIELD_NOTE`; it gains `role="status"` so a change of state is announced. The dialog's description is `business.positioning.gatePassed` in `given` and `confirmed`, else `business.state.gate`.

<!-- prettier-ignore -->
| # | State (gate, marks) | State line | Section shows, in order | Primary | Focus after the action that led here | A screen reader hears |
| --- | --- | --- | --- | --- | --- | --- |
| S0 | no controls given and no statement (any gate state; a read-only viewer such as `Board`) | as on develop | nothing: no Section, no heading; the value field is the last child of the fields container (row F1-a) | none | (opening the viewer: the region, unchanged) | the view as on develop, no "Positioning statement" |
| S1 | `open`, PR 1, value given | `business.state.proposed` | A1; C: one row [Write my own `primary`] [Skip for now `ghost`] | Write my own | (opening the viewer: the region, unchanged) | heading "Positioning statement", then two buttons |
| S1b | `open`, PR 1, value empty | `business.state.skipped` | as S1 | Write my own | as S1 | as S1 |
| S2 | `open`, PR 2, value given, no draft | `business.state.proposed` | A1; C: row 1 [Draft options from my answers `intent`]; row 2 [Write my own `secondary`] [Skip for now `ghost`] | Draft (intent) | as S1 | heading, then "Draft options from my answers", "Write my own", "Skip for now" |
| S3 | `open`, PR 2, value empty | `business.state.skipped` | A1, A5; C: one row [Write my own `primary`] [Skip for now `ghost`]; no Draft | Write my own | as S1 | heading, the needs-value line, two buttons |
| S4 | drafting (request running) | unchanged | as S2 with Draft `loading` (children and `loadingLabel` `business.positioning.drafting`), Write my own and Skip `aria-disabled` | Draft (busy) | stays on Draft (Button `loading` keeps focus) | "Drafting options" from the Button's role=status |
| S5 | draft stopped | unchanged | as S2, then in C3 a `Notice variant="info"` with `business.positioning.errors.*` by reason; no well, no AI label | Draft | stays on Draft | the Notice text, once, from C3 role=status |
| S6 | `awaiting-choice` | `business.state.awaitingChoice` | A1; B (intro, 2 or 3 options, each B3 to B7); C: one row [Write my own `secondary`] [Skip for now `ghost`] | none | after Draft succeeds: A1 heading | "Waiting for your choice" (state line), then heading "Positioning statement" |
| S7 | `open`, `skipped` true, no draft, PR 2 with value | `business.state.skipped` | A1; C: row 1 [Draft `intent`]; row 2 [Write my own `secondary`]; no Skip | Draft (intent) | after Skip succeeds: Write my own | "Skipped for now" (state line) |
| S7b | `open`, `skipped` true, PR 1, or value empty | `business.state.skipped` | A1 (A5 in PR 2 when value empty); C: one row [Write my own `primary`] | Write my own | after Skip: Write my own | as S7 |
| S8 | `open`, `skipped` true, a draft stored | `business.state.skipped` | A1; B as S6; C: one row [Write my own `secondary`] | none | after Skip: Write my own | as S7 |
| S9 | write-own editor | unchanged | A1; (B kept when a draft is stored, its option actions kept); C2 replaces C1: label "Write my own", textarea, [Agree `primary`] [Cancel `secondary`] | Agree | Write my own pressed: the textarea | "Write my own, edit text" |
| S10 | option editor | unchanged | A1; B with option n's B3 and B4 replaced by a `Field` labelled "Option {n}" holding a `Textarea` seeded with the option's statement; B5, B6 stay under it; then [Agree `primary`] [Cancel `secondary`]; the other options lose B7; C1 hidden | Agree | Edit this one pressed: that textarea, caret at the end | "Option 1, edit text, …" |
| S11 | invalid (empty, or over 300 characters after the trim) | unchanged | as S9 or S10 with the Field error: `business.positioning.statementRequired`, or `business.intake.tooLong` with max 300; no action call | Agree | the textarea | the error, from the Field's role=alert |
| S12 | saving | unchanged | as S9 or S10 with Agree `loading` (`business.positioning.saving`), Cancel and every other button `aria-disabled`; for "Use this one" and "Skip for now" the pressed button itself takes `loading` with `business.positioning.saving` | the busy button | stays on the pressed button | "Saving your choice" |
| S13 | save failed | unchanged | as S9 or S10 with the text kept, then in C4 a `Notice variant="danger"` with the app's resolved `saved.errors.*` text (rate-limited with the wait, signed-out, failed) | Agree | stays on Agree (or the pressed button) | the error, once, from C4 role=alert |
| S14 | `given` | `business.state.agreed` | A1, A3, A4 `by.own`; no B, no C | none | after Agree succeeds: A1 heading | "Agreed" (state line), then heading |
| S15 | `confirmed` | `business.state.agreed` | A1, A3, A4 `by.picked` or `by.edited` with the model id; no B, no C | none | after Use this one or Agree succeeds: A1 heading | as S14 |
| S16 | `stale` (choice on an older intake) | `business.state.proposed` (or `awaitingChoice` with a draft of the newest intake) | A1, A2, A3 (no A4); then B when a draft of the newest intake is stored; then C as S2 (or S6) | as S2 or S6 | (opening the viewer) | heading, "Your business answers changed after you agreed to this. Check it again.", the old statement |

Cancel (S9, S10, S11, S13) returns to the state before the editor opened, keeps nothing typed, and puts focus back on the button that opened it ("Write my own", or that option's "Edit this one").

**Named controls.** "Use this one" and "Edit this one" are named by `aria-labelledby={buttonId + " " + h4Id}`, so a reader hears "Use this one Option 1" (Thai "ใช้ข้อนี้ ตัวเลือกที่ 1"). No new string.

**One primary per view.** S2, S5, S7, S16 use the lime `intent` variant for Draft, the one Intent Engine action of the screen, and keep every other button `secondary` or `ghost`, so no violet primary competes with it. S1, S3, S7b use `primary` for Write my own because no engine action is offered. S6 and S8 have none: the decision is among the options, and a primary would read as a recommendation. Editors use `primary` for Agree.

## 6. Controls and their states

<!-- prettier-ignore -->
| Control | Default | Hover | Focus | Disabled | Loading | Error | Success |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Draft options from my answers (`Button intent`) | lime pill, 40 px | recipe hover | global `:focus-visible` line and halo (focus.ring), border form | not rendered when not offered (S3, gate passed, draft stored); `aria-disabled` while another request runs | `loading`, label `business.positioning.drafting`, focus kept | S5 Notice info in C3, button stays enabled | S6, focus to A1 |
| Write my own (`Button primary` or `secondary`) | per section 5 | recipe | as above | `aria-disabled` during S4, S12 | not used (no request) | none | S9, focus to the textarea |
| Skip for now (`Button ghost`) | text button | recipe | as above | `aria-disabled` during S4, S12 | `loading` with `business.positioning.saving` | S13 Notice danger in C4 | S7 or S8, focus to Write my own |
| Use this one (`Button secondary`) | per option | recipe | as above | `aria-disabled` during S4, S12 | `loading` with `business.positioning.saving` | S13 Notice danger in C4 | S15, focus to A1 |
| Edit this one (`Button ghost`) | per option | recipe | as above | `aria-disabled` during S12 | not used | none | S10, focus to its textarea |
| Textarea (`Field` + `Textarea md`) | 3 rows, grows to 8 | control hover border | control focus border (focus.ring) | not used | stays editable but its Agree is busy; text kept | Field error with role=alert, `aria-invalid` (S11) | not applicable |
| Agree to this positioning (`Button primary`) | in editor | recipe | as above | none | `loading` with `business.positioning.saving`; a second press is ignored (one action call) | S11 (client) or S13 (server) | S14 or S15, focus to A1 |
| Cancel (`Button secondary`, N1) | in editor | recipe | as above | `aria-disabled` during S12 | not used | none | closes the editor, focus to the opener |

Selected and focused never look alike: no control here has a selected state; the focused one carries the focus line and halo only.

## 7. The card at rest

`renderBody` for `positioning`, unchanged structure (`div.flex.flex-col.gap-2`):

1. state line, `p` with `FIELD_NOTE`, `data-node-state`: the State shown of `positioning-gate-1` (proposed, skipped, awaitingChoice, agreed);
2. the field list, `ul.flex.flex-col.gap-1.text-body-sm`: the node's field labels ("What only you give"), then one more `li` with `business.field.statement`;
3. gate line, `p` with `FIELD_NOTE`: `business.state.gate`, or `business.positioning.gatePassed` in `given` and `confirmed`.

No statement text on the card (an answer must carry its label, which belongs in the view, ORV-281 section 6.3). No AI label on the card: the card never shows drafted text.

Measured on the built card, world units (rendered height divided by the board zoom), every frame:

<!-- prettier-ignore -->
| Card state | State line | Gate line | Lines (state / statement label / gate) | Height (was 145.19) | Fit zoom 360 / 1440 |
| --- | --- | --- | --- | --- | --- |
| open, value given | Not confirmed yet / ยังไม่ได้ยืนยัน | gate | 1 / 1 / 2 | 172.98 | 0.25 / 0.617 |
| open, value empty | Skipped for now / ข้ามไว้ก่อน | gate | 1 / 1 / 2 | 172.98 | 0.25 / 0.617 |
| awaiting choice | Waiting for your choice / รอให้คุณเลือก | gate | 1 / 1 / 2 | 172.98 | 0.25 / 0.617 |
| skipped | Skipped for now / ข้ามไว้ก่อน | gate | 1 / 1 / 2 | 172.98 | 0.25 / 0.617 |
| agreed | Agreed / เห็นชอบแล้ว | gatePassed | 1 / 1 / 1 | 149.19 | 0.25 / 0.617 |
| stale | Not confirmed yet / ยังไม่ได้ยืนยัน | gate | 1 / 1 / 2 | 172.98 | 0.25 / 0.617 |

The state ink starts at the field ink (0 px). The fit zoom does not change, so the board's fit and the graph's y (326) hold. Under the friendly profile the agreed card sits under its 160 floor and the floor holds it (inferred from ORV-281 section 6.3, not measured).

## 8. Layout numbers per state (rows for the builder)

All x are in the 360 viewer (region x 21 to 315 plus `pe-3`; text from x 33); at 1440 the same x 33 holds and the column is 672 wide. Every button is 40 px tall (`md`).

<!-- prettier-ignore -->
| Row | State | Target | Measured on the mock |
| --- | --- | --- | --- |
| P1 | all | state line ink x = value h3 ink x = section h3 ink x = statement ink x (0 px) | 33 / 33 / 33 / 33 at 360 and 1440, every frame |
| P2 | all | section top 24 px under the value field's bottom (`gap-6`) | 24 |
| P3 | S1, S1b | one row, 2 buttons, one line at 360 | Thai right 222.6, English right 284 (column right 315) |
| P4 | S2, S5, S16 | two rows 8 px apart (`gap-2`); each one line at 360 | row 1 right 236.8 th, 272.8 en; row 2 right 222.6 th, 284 en |
| P5 | S3 | A5 4 px under A1 (`gap-1`), controls 12 px under A5 (`gap-3`) | section 127.4 th, 151.2 en at 360 |
| P6 | S4 | Draft `loading` keeps its width class; one line at 360 | row 1 right 186 th, 198.2 en |
| P7 | S5, S13 | Notice 12 px under the last row (`mt-3`), full column width | 282 at 360, 672 at 1440 |
| P8 | S6, S8, S10 | well left = section left (x 33), width = column (282 / 672), padding 16 (`p-4`): intro and option ink at x 49 | left 33, width 282 / 672, ink 49 |
| P9 | S6 | well gap 16 between intro and list and between options; hairline then 16 (`pt-4`) above options 2 and 3 | option heights 360: en 568.5, 590.1, 475.5; th 442.7, 515.3, 400.7; 1440: en 391.7, 437.1, 326; th 364.5, 437.1, 298.8 |
| P10 | S6 | quote rows 8 apart (`gap-2`); B6 8 under B5 (`mt-2`); B7 12 under B6 (`mt-3`); B7 one line at 360 with both buttons at x 49 start | one line in both languages |
| P11 | S6 | C row 12 under the well (`gap-3`), starts at x 33 | 33 |
| P12 | S9 to S13 | editor: label, textarea, row 12 apart (`gap-3`); the Agree and Cancel row is one line where it fits, wraps to two at 360 English (Agree, 8 px gap and Cancel together exceed 282), both still at x 33 | Thai one line; English two lines at 360, one at 1440 |
| P13 | S14, S15 | A3 4 under A1, A4 4 under A3 (`gap-1`), no controls | section 137.2 th, 164.3 en (S14 at 360) |
| P14 | S16 | A2 4 under A1, A3 4 under A2, controls 12 under A3 | section 261 th, 288.1 en at 360 |
| P15 | 360, every state | region scrollWidth = clientWidth (294); document scrollWidth = 360; every text rect's right at most bar left minus 4 plus 0.5 (319.5) | max 319.1 English (a trailing space, as the existing value field), 313.4 Thai |
| P16 | S14 long | a 300-character Thai statement with no spaces wraps inside the column, no overflow | 8 lines at 360 and 4 at 1440, section 273.1 at 360 |

### Rework rows from visual sign-off 1

Visual sign-off 1 (task ORV-285-signoff-1, head d59484a) requested one change, F1: a viewer with no controls and no statement ended in a bare heading. The row below is the look the builder builds; it changes no other row of this file.

<!-- prettier-ignore -->
| Row | Rule (S0) | Target | Measure | Proof play | Rendered target |
| --- | --- | --- | --- | --- | --- |
| F1-a | Render `PositioningSection` only when `positioning.statement !== null \|\| controls !== undefined` (the guard of `business-node-view.tsx`, today `node.id === "positioning" && positioning !== undefined` at line 441 of head d59484a, kept and joined with this condition). With a statement and no controls the section stays as built (A1, A3, A4; A2 when stale); with controls it stays as built in every state S1 to S16 | A viewer with neither renders as on develop: no `[data-field="positioning.statement"]`, no h3 "Positioning statement" / "ข้อความจุดยืน"; the fields container (`div.flex.flex-col.gap-6`) holds the value field alone, so the first column ends at the value field's label "Your words, placed here by fixed rules. Not read by AI." / "คำของคุณเอง วางไว้ตรงนี้ด้วยกฎที่กำหนดไว้ ไม่ได้ให้ AI อ่าน" | The 24 Positioning viewer pairs of the sign-off's pixel diff (6 board stories, 360 x 760 and 1440 x 900, light and dark) match develop pixel for pixel, 0 differing pixels; at head d59484a each differed only by the bare heading (diff box x 17 to 97, y 322 to 340 at 360; the heading's section 23.8 tall, 24 under the value field, one child). Every other row of section 8 (P1 to P16) is unchanged because each is measured with controls or a statement | In `Board` and `BoardEnglish`: open the Positioning viewer, assert `dialog.querySelector('[data-field="positioning.statement"]')` is null and no element of the dialog has the text of `business.field.statement`. In `PositioningStatesAgreed` (and its English story): open the viewer, assert the same selector is present and holds A3 with the fixture's statement | The develop half of `/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO/.orivilo/runs/ORV-285/ORV-285-signoff-1/screenshots/sheet__develop-vs-pr__positioning-viewer-without-controls.png` (left column: `Board` and `BoardEnglish` at 360, light and dark, origin/develop); the right column is the rejected look. No new render: the fix restores develop's render |

## 9. One play per state, with its measured bound

Story names are the spec's (acceptance rows). Helpers are `src/testing/visual-asserts.ts`; screenshot helpers run under `inVitest`.

<!-- prettier-ignore -->
| State | Story | Play clause and bound |
| --- | --- | --- |
| S0 | `Board`, `BoardEnglish` (no controls, no statement); `PositioningStatesAgreed`, `PositioningStatesAgreedEnglish` (statement) | row F1-a: in `Board` and `BoardEnglish` the open viewer has no `[data-field="positioning.statement"]` and no `business.field.statement` text; in `PositioningStatesAgreed` the selector is present with A3 |
| S1, S1b, S7b, S14 card | four states stories, one fixture each, in spec v1.2 row 5's order: `PositioningStates` (value given, no choice), `PositioningStatesValueEmpty` (value empty, no choice), `PositioningStatesSkipped` (newest choice `skipped`), `PositioningStatesAgreed` (newest choice `written`), each with its English story (`PositioningStatesEnglish`, `PositioningStatesValueEmptyEnglish`, `PositioningStatesSkippedEnglish`, `PositioningStatesAgreedEnglish`) | per story, its one fixture: the card's `[data-node-state]` text and its last `p` equal the table of section 7; card height divided by zoom within 1 of 172.98 (gate) or 149.19 (agreed); the view's P1 (all four inks equal within 0.5) and P2 (24 within 0.5); `expectSameHeight` on the row's buttons (40) |
| S1 to S14 | `PositioningWritten` | press Write my own: `document.activeElement` is the textarea; type and Agree: A3 text equals the trimmed input, A4 is `by.own`, `document.activeElement` is the h3, the state line reads `business.state.agreed`; `expectNoGlyphClip(A3)`, `expectInkClearsAbove(A4, A3, 4)` |
| S11, S12, S13 | `PositioningInvalid` | empty Agree: the Field error equals `statementRequired`, `aria-invalid="true"`, focus on the textarea, 0 action calls; 301 characters: `business.intake.tooLong` with 300; rate-limited stub: C4 holds `saved.errors.rate-limited` with the wait and the textarea keeps the text; two presses while saving: 1 call, Agree has `data-loading` and `aria-disabled`; `expectSameHeight(agree, cancel)` |
| S7, S7b | `PositioningSkipped` | Skip: the state line reads `business.state.skipped`, the gate line shows, Skip is gone, focus is on Write my own; then write and agree: S14 |
| S16 | `PositioningStale` | A2 is above A3 (A2 bottom less than A3 top), A2 text equals `business.positioning.stale`; no A4, no `business.state.agreed`, no `gatePassed` anywhere in the dialog; A2 ink x = A3 ink x (0 within 0.5) |
| S14 hostile | `PositioningUntrustedText` | the statement's `textContent` equals the fixture; no `img`, `script` or `a` inside the section |
| all at 360 | `PositioningNarrow` | P15 bounds through `expectFitsAt360`; `expectNoGlyphClip` on the 300-character Thai statement; Tab order Draft or Write my own, then the rest, in DOM order; `expectFocusBorderForm` on each button as `Button.stories` does; a11y addon zero violations |
| S4, S5 | `PositioningDraftStopped` | one case per reason: during the stub, Draft has `data-loading` and focus; after: C3 holds the `business.positioning.errors.*` text of the reason, focus is still on Draft, no `[role="group"]` well and no `draftedBy` or `strategy.draftedOptions` text; Write my own and Skip enabled; the Notice's left = column left (0 within 0.5) |
| S3 | `PositioningNeedsValue` | no button named `business.positioning.draft`; A5 text equals `needsValue`; Write my own has `data-variant="primary"` |
| S6, S15, S8 | `PositioningOptions` | the well's left equals the h3's left (0 within 0.5), its width equals the column; intro once; per option: `draftedBy` with the fixture model id, every quote `li` has a field label, `expectSameHeight(use, edit)`; no element text matching a score or a percent; Use this one on option 2: A3 equals option 2, A4 is `by.picked` with the model id, the well is gone, focus on the h3; Skip then Use (row 21): S8 keeps the well, then S15 |
| S10 | `PositioningEdit` | Edit this one on option 1: the textarea value equals option 1, focus on it with `selectionStart` equal to its length; other options have no Use or Edit button; C1 is not in the DOM; Agree changed: A4 `by.edited`; Agree unchanged: A4 `by.picked` |
| S6 hostile | `PositioningUntrustedDraft` | option statement and quote `textContent` equal the fixtures; no `img`, `script` or `a` inside the well |
| S1, S14, S7 no draft | `PositioningNoDraft` | the dialog's text contains none of `strategy.draftedOptions`, `draftedBy`, `by.picked`, `by.edited` (with the model filled in); after a stopped draft and a reopen, no C3 Notice |

## 10. Tokens and classes used

Semantic utilities: `bg-surface-sunken`, `rounded-container` (`shape.container.radius`), `border-border-subtle`, `text-text-secondary` (in `FIELD_NOTE`), the type utilities `text-label-md` and `text-body-sm`. Layout: `flex`, `flex-col`, `flex-wrap`, `items-center`, `min-w-0`, `self-start`, `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6`, `p-4`, `pt-4`, `mt-2`, `mt-3`, `border-t`, `whitespace-pre-wrap`. Recipes reached through components only: `ds-button` (intent, primary, secondary, ghost; md), `ds-field`, `ds-control` (Textarea md), `ds-alert` (info, danger). Focus: the global `:focus-visible` rule (`focus.ring`, halo). No colour, radius, shadow or font value is written by the section. The mock's built CSS lacked `self-start` and `pt-3` only because the slice 3 build had no source using them; the builder's build generates them (`pt-3` is not used by this design).

## 11. DESIGN.md section 9, walked

<!-- prettier-ignore -->
| # | Tell | Here |
| --- | --- | --- |
| 1 | Cream serif, near black with acid | absent: neutral profile, lime on one button at most |
| 2 | Broadsheet | absent: one hairline between options only, radii kept |
| 3 | Card kit | absent: one sunken well, no card per option, no shadow |
| 4 | Template chrome | absent: no caps, no middot, no arrows |
| 5 | One accented word, empty labels | absent: every label names a field or a source |
| 6 | Ambient motion | absent: no transition added; the Button spinner follows reduced motion |
| 7 | Numbered markers | justified: "Option {n}" is a name used by the buttons, not a rank |
| 8 | Lime as status, focus removed | absent: lime only on Draft; focus is the global line and halo |
| 9 | Thai set with Latin rules | absent: no tracking or transform, 1.7 line heights |
| 10 | Studio style in a preview | not applicable: Studio screen, not a customer preview |
| 11 | Fake evidence | absent: every model line says a model drafted it, with the saved model id; no score |
| 12 | Per-page mood patch | absent: semantic utilities only |

## 12. Strings

Every string is a key of the spec's Strings table or a reused key it names. One is missing:

- **N1, `business.positioning.cancel`**: en "Cancel", th "ยกเลิก". Closes an editor (S9, S10) without saving. The spec offers no way out of an editor except Agree; without Cancel a person who opened "Edit this one" by mistake can leave only by closing the viewer. Smallest option: add the key. Fallback if declined: no Cancel button; the editor stays open until Agree or until the viewer closes, and closing the viewer drops the editor (focus returns to the card as today).
- Note for the product role: `business.positioning.statementRequired` says "or skip for now", and Skip is not inside the editor; with N1, Cancel then Skip is the path. A wording that does not point at a hidden button is the product's call.

## 13. Rendered proof (mock)

The mock is labelled as a mock on its own page: every frame carries a dashed box with "MOCK of the ORV-285 design: the statement section is injected into the slice 3 viewer. Nothing here is built." (Thai: "ภาพจำลอง (mock) ของงานออกแบบ ORV-285: ส่วนข้อความจุดยืนถูกใส่เข้าไปในหน้าต่างดูของ slice 3 ยังไม่มีโค้ดจริง"), and every sheet's title starts with "MOCK". Sheets in `.orivilo/runs/ORV-285/ORV-285-design-1/screenshots/` (local, not in git), each holding the 8 frames of one state (360 and 1440, Thai and English, light and dark):

- `contact-sheet.png`: every state, one frame each;
- view: `sheet__view__open-pr1.png` (S1), `open.png` (S2), `needs-value.png` (S3), `drafting.png` (S4), `draft-stopped.png` (S5), `awaiting.png` (S6), `focus-pick.png` (S6, keyboard focus on "Use this one"), `skipped.png` (S7), `skipped-draft.png` (S8), `write-own.png` (S9), `edit-option.png` (S10), `invalid.png` (S11), `saving.png` (S12), `save-failed.png` (S13), `given.png` (S14), `long.png` (S14, 300 Thai characters), `confirmed.png` (S15), `stale.png` (S16), each named `sheet__view__<state>.png`;
- card: `sheet__card__open.png`, `value-empty.png`, `awaiting.png`, `skipped.png`, `agreed.png`, `stale.png`, each named `sheet__card__<state>.png`.

## 14. Seen on the mock, not changed here

- The page root's `wrap-anywhere` may break an unknown Thai word mid-word when a line is full (seen once, "ร้า|นกาแฟ" at 360); it is the existing rule of every business screen, not this section's.
- The model id wraps at its hyphen ("anthropic/claude-" then "sonnet-5.5") at 360; it stays whole on one line at 1440.
- The `Notice` helper passes `description=""`, which keeps an empty description line under the title and adds bottom space; shared with every Notice of the business screens (follow-up for the Alert owner, not for this story).

## 15. Screens for visual QA

1. S6 at 360 Thai light and dark: the well's edge, the hairlines, the quote rows, both buttons per option on one line, no glyph clip in Thai marks above and below.
2. S2 and S16 at 360 English: Draft alone on row 1, the second row starting at x 33, the lime button the only colour.
3. S10 at 360 English: the option editor, other options without buttons, the Agree and Cancel row on two lines with one start edge.
4. S13 at 360 Thai and English: the danger Notice under the editor, the text kept.
5. S14 long at 360 Thai: the 300-character statement wrapped inside the column, no horizontal scroll.
6. The card at 1440 Thai and English, light and dark: 172.98 and 149.19 high, the statement label as the last field.
7. Keyboard: Tab through S2 and S6; every focus shows the line and halo; after Agree, focus on the heading.
8. S0 (row F1-a): the Positioning viewer of `Board` and `BoardEnglish` at 360 and 1440, Thai and English, light and dark, ends after the value field's label with no bare "Positioning statement" heading, pixel for pixel as on develop; and `PositioningStatesAgreed` still shows the section with its statement.

## Changelog

- v1.0 (2026-11-18): first design for spec v1.0, both PRs: section anatomy, 16 view states and 6 card states with measured bounds from a rendered mock, one play per state; N1 (cancel key) open.
- v1.1 (2026-11-19): task ORV-285-design-f1, finding F1 of visual sign-off 1 (head d59484a): section 3's Section, A and A1 show when a statement exists or controls are given, not always, with the reason; new state S0 in section 5 (no controls, no statement: no section, as on develop); new row F1-a under section 8 (guard, target, measure, proof play, rendered target = the develop half of the sign-off's comparison sheet); section 9 gains the S0 play and names the four states stories with their English stories as built (spec v1.2 row 5) in place of one `PositioningStates`; section 15 gains screen 8. No other measure changed.
