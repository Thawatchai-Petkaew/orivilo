---
issue: ORV-211 (https://tpetkaew.atlassian.net/browse/ORV-211)
spec: docs/specs/ORV-211/spec.md v1.1
task: ORV-211-design-1
date: 2026-11-01
---

# ORV-211 design: EvidenceSpan and EvidenceList

A reading shows what the engine took from the brief. Each fact can show the words it came from, and whether rules or an AI model read them. EvidenceSpan puts one quiet pill after a fact, and the pill opens a small card with the quote. EvidenceList collects every quote behind one count. Both look like the rest of the base set: Tag, Popover and Collapsible, with no new token and no brand colour.

## Flow

1. The reader sees a fact and, after it on the same line, a pill "หลักฐาน" ("Evidence"). If the fact has no usable quote, the pill is replaced by "ไม่มีหลักฐาน" ("No evidence") in secondary ink.
2. A press on the pill (click, Enter or Space) opens a card under it. Focus moves into the card, and its border and halo show.
3. The card shows the quote, with a line on its start edge, and under it one source line: "จากบรีฟของคุณ อ่านด้วยกฎ" or "จากบรีฟของคุณ อ่านด้วยโมเดล AI".
4. Esc closes the card and focus returns to the pill. A click outside also closes it. Hover and focus alone never open it.
5. EvidenceList shows one ghost trigger "ยกมาจากบรีฟ 3 ข้อความ" with a chevron. A press shows the quotes as a list, each with its source line. If no quote is usable, the trigger is replaced by "ไม่มีหลักฐาน" on the same edge and at the same height.

## Answers to the open questions

<!-- prettier-ignore -->
| # | Question | Answer | Why |
| --- | --- | --- | --- |
| 1 | Opening | (a), confirmed: press only (click, Enter, Space), from our `Popover` | The card holds the words a decision rests on, so every reader must reach it: keyboard, screen reader and touch users included. A hover card cannot do that (K-0129). Opening on focus (b) would move focus into the card while the reader tabs along a reading of 10 facts, and it would add a hover-intent layer that has to meet the three SC 1.4.13 conditions (K-0134). A press is one deliberate act, and it shows the same way in every input mode. Measured in the mock: hover and keyboard focus on the pill show only Tag's edge and ring (`states-light-360-th-v2.png` rows "hover" and "focus-visible") |
| 2 | Modal or non-modal card | (a), confirmed: non-modal, our `Popover` as it is | The card has no control in it. A modal would trap focus and hide the page from assistive technology just to show one quote, and the reader often wants to compare the quote with the fact beside it. Non-modal keeps the page readable. Esc and a click outside close the card, and focus returns to the pill (K-0130, K-0133). No Popover API change |
| 3 | Trigger look | (a), confirmed: Tag's toggle form at size sm, label "หลักฐาน" / "Evidence", no icon, no `aria-pressed` (D1 to D5) | It is the system's existing chip control. Its 1 px border, primary ink, pointer, hover edge and focus ring separate it from a status Badge, which has no border and uses secondary ink (`states-light-360-th-v2.png`, row "vs Badge neutral sm"). At 24 px it sits inside a 16 / 1.7 text line without growing it (D4). (b) `link` means "go somewhere" (DESIGN.md §8). (c) numbers are §9 item 7. (d) turns the caller's text into a control and leaves no place for the missing text. An icon was weighed and left out: it would make a third chip form for one component |
| 3, name | Should each pill's accessible name add the fact? | Yes, from the page and not from a new key: the button takes `aria-labelledby="<label id> <fact id>"`, so its name is "หลักฐาน ชื่อแบรนด์: บ้านกาแฟ" / "Evidence Brand name: Baan Coffee" (D6) | A reading has many pills. With one shared name, a screen reader's button list shows "หลักฐาน" ten times, and no reader can tell which fact each one belongs to. With the name built from the visible label, then the fact, each pill gets its own name. No new locale key and no `fact` prop are needed, the fact may stay a ReactNode, and the visible text still starts the name (SC 2.5.3, label in name). Checked: in Chromium's accessibility tree the mock button reads `button "หลักฐาน ชื่อแบรนด์: บ้านกาแฟ"`, and `getByRole("button", { name: "หลักฐาน ชื่อแบรนด์: บ้านกาแฟ", exact: true })` finds 1. This changes AC 1, 2, 4, 7, 11 and 12 (amendment A1) |

## Anatomy

```
EvidenceSpan (inline, in the caller's line of text)
  span.ds-evidence-span
    span#<fact id>                          the caller's children (the fact)
    span.ds-tag.ds-evidence-span__trigger[data-size=sm]
      button.ds-tag__main[aria-labelledby="<label id> <fact id>"]   PopoverTrigger asChild
        span.ds-tag__label#<label id>       evidence.trigger
  (portal) div.ds-popover.ds-evidence-card[role=dialog][aria-label=evidence.cardLabel]
    blockquote.ds-evidence-quote__text      the quote, a text child
    p.ds-evidence-quote__meta               evidence.sourceByRule or evidence.sourceByModel

EvidenceSpan, missing
  span.ds-evidence-span
    <fact>
    span.ds-evidence-span__missing          evidence.missing

EvidenceList
  div.ds-collapsible.ds-evidence-list
    button.ds-button.ds-collapsible__trigger (ghost, md)   count label + chevron
    div.ds-collapsible__content
      ul.ds-evidence-list__items
        li > blockquote.ds-evidence-quote__text + p.ds-evidence-quote__meta

EvidenceList, missing (count 0)
  div.ds-evidence-list
    p.ds-evidence-list__missing             evidence.missing
```

## Visual decisions

Values are tokens. The px values are for neutral and are measured in the mock.

<!-- prettier-ignore -->
| # | Decision | Value (tokens) | Source intent |
| --- | --- | --- | --- |
| D1 | Pill form | Tag toggle form, `data-size="sm"`: height `--cmp-tag-height-sm` (24 px), padding `--cmp-tag-padding-x-sm` (8 px), `type.body.xs`, border `--cmp-tag-border`, ground `--cmp-tag-bg`, ink `--cmp-tag-fg`. No override | `ev-trigger-1`. Contrast comes from Tag's existing pairs |
| D2 | Pill place | `.ds-evidence-span__trigger { vertical-align: baseline; margin-inline-start: var(--ds-space-inline-sm) }` (4 px) | The pill label's baseline sits on the fact's baseline (`span-light-1440-th-v2.png`). The 4 px gap keeps the pill with its fact |
| D3 | Pill wrap | Tag stays one unbroken unit (`inline-flex`, one line). At a narrow width it moves to the next line on its own, after the last word of the fact | `span-light-360-th-v2.png` row "At360, long": a 3-line paragraph, with the pill starting line 3. Keeping it whole is better than splitting the label. The fact cannot be held to the pill, because Thai has no spaces to bind on |
| D4 | Line height held | No rule needed: in a 16 / 1.7 line (27.2 px) the 24 px pill does not grow the line box | Measured line boxes 27.2, 27.2, 27.2 and 81.6 (3 lines) px in every span shot, Thai and English, at 360 and 1440. The text rhythm does not jump where a pill sits |
| D5 | Pill states | Default: Tag's. Hover: `--cmp-tag-border-hover` edge, fill unchanged. Focus-visible: the border in `focus.ring` with its halo (`--_focus-shadow-border`). Open: no change on the pill. Disabled, loading, error, selected: not applicable (no prop for them) | DESIGN.md §7. Open is never shown as selected: `data-selected` and `surface.selected` stay off, so selection keeps its meaning (§8). Open is shown by the card itself, and focus is inside it |
| D6 | Accessible name | `aria-labelledby` on the button: the `useId` of the `ds-tag__label` span, then the `useId` of a plain `span` that wraps `children`. No `aria-label`, and no new key | Q3, name |
| D7 | Missing in a line | `.ds-evidence-span__missing { margin-inline-start: var(--ds-space-inline-sm); color: var(--ds-text-secondary) }`. No space character in the markup; the margin makes the gap | Plain text in the same ink ran into the fact: "อุตสาหกรรม: ร้านกาแฟ ไม่มีหลักฐาน" read as one phrase (`span-light-360-th-v1-spec.png`). Secondary ink at the same size reads as a statement about the fact, not as part of it and not as a blank (`span-light-360-th-v2.png`). Measured colour rgb(91, 90, 102) light and rgb(169, 167, 179) dark. Pair 6.15 light and 7.65 dark on the canvas (neutral) |
| D8 | Card width and gutter | `.ds-evidence-card { max-inline-size: var(--ds-size-panel-default) }` (320 px); `PopoverContent collisionPadding` equal to `space.gutter` (16 px) | W3 caps the card at 320. Without a collision padding, Radix pushes the card flush to the screen edge at 360 px. With 16 px the card sits from 24 to 344 px, so the gutter is kept on both sides (measured, every 360 span shot). At 1440 the card starts at the pill's start edge (`align="start"`, `card-long-dark-1440-en-v2.png`) |
| D9 | Card padding, ground, focus | `.ds-popover`'s own: `--cmp-popover-padding` (16 px), `--cmp-popover-bg`, `--cmp-popover-radius`, `--cmp-popover-shadow`; focus turns the border to `focus.ring` with the halo and keeps the shadow | `states-cardfocus-light-360-en-v2.png`, `states-cardfocus-dark-360-th-v2.png` |
| D10 | Quote | `.ds-evidence-quote__text`: `margin: 0`; `padding-inline-start: var(--ds-space-inline-md)` (8 px); `border-inline-start: 2px solid var(--ds-border-control)`; type `--ds-type-body-md-*` (16 / 1.7); `min-inline-size: 0`; `overflow-wrap: anywhere`; no colour | The spec's `border.subtle` line almost disappeared in dark mode (gray 700 on gray 800). In light mode it was faint, so the 4 px indent looked like a stray offset (`span-dark-1440-en-v1-spec.png`). `border.control` reads in both modes (3.62 light, 4.48 dark on `surface.raised`, neutral). It stays decoration: the `blockquote` element carries the meaning, so no pair is listed, as for dividers. An 8 px indent separates the quote from its line, and the line, the source line and the card padding share one start edge (measured 41 px for both, 360 shots) |
| D11 | Source line | `.ds-evidence-quote__meta`: `margin: 0`; `margin-block-start: var(--ds-space-inline-sm)` (4 px); `color: var(--ds-text-secondary)`; type `--ds-type-body-sm-*` (14 / 1.7) | DESIGN.md §4, title over supporting text: the supporting line is in secondary ink, 4 px under its lead (the Toast action already uses `space.inline.sm` for a 4 px block gap). In primary ink, the source line competed with the quote (`span-dark-1440-en-v1-spec.png`). It is the honest label of AGENTS.md rule 4, so it stays at 4.5 or more: 6.60 light and 7.04 dark on `surface.raised` (neutral) |
| D12 | Quote line counts | 1 line ("ร้านบ้านกาแฟ"), 2 lines ("อยากให้ลูกค้ารู้สึก...เพื่อน" at 360, breaking at the word), 3 lines (`longThai`), and a long Latin token breaking inside the card | `card-long-light-360-th-v2.png`, `span-light-360-th-v2.png`, `card-long-dark-1440-en-v2.png`. The line on the start edge runs the full height at every count, and no Thai mark is cut |
| D13 | List trigger | `Collapsible`'s ghost Button md, unchanged: label `ev-count-1`, the chevron swaps down and up | ORV-203 D2 to D11. Measured height 40 px |
| D14 | List items | `.ds-evidence-list__items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ds-space-stack-md) }` (16 px) | With the spec's 8 px gap, each source line sat 8 px above the next quote and 8 px under its own, so it read as belonging to either (`list-light-360-th-v1-spec.png`). With 4 px under the quote (D11) and 16 px between items, each pair reads as one group (`list-light-360-th-v2.png`). Quote type stays 16 px under the 14 px trigger: the quotes are the content the trigger reveals |
| D15 | List start edge | Collapsible's content padding, unchanged (`calc(var(--cmp-button-padding-x-md) + 1px)`, 17 px) | Measured: label 33, quote line 33, source line 33 px in every 360 list shot. One start edge |
| D16 | List missing | `.ds-evidence-list__missing { display: flex; align-items: center; min-block-size: var(--cmp-button-height-md); margin: 0; padding-inline: calc(var(--cmp-button-padding-x-md) + 1px); color: var(--ds-text-secondary); }` and type `--ds-type-body-sm-*` (14 / 1.7) | It takes the trigger's place, so it keeps the trigger's height (measured 40 and 40 px) and its label edge (text at 33 px, the same as the label). The block around it does not shift when a count drops to 0. Secondary ink, as D7 |
| D17 | Motion | No motion is added. The list keeps Collapsible's fade and its reduced-motion rule; Popover adds none | DESIGN.md §9 item 6 |
| D18 | Profiles and modes | No profile or mode override. Tag, Popover and Button carry the profile's radius and grounds | `span-dark-360-th-v2-friendly.png`, `list-dark-360-th-v2-friendly.png`: Friendly's warm dark ground and radius, with the same layout |

## Builder table: CSS and markup per rule

<!-- prettier-ignore -->
| Rule | Markup | CSS |
| --- | --- | --- |
| `ev-trigger-1` + D6 | `<span className="ds-evidence-span"><span id={factId}>{children}</span><Popover ...><PopoverTrigger asChild><button type="button" className="ds-tag__main" aria-labelledby={`${labelId} ${factId}`}>...` inside `<span className="ds-tag ds-evidence-span__trigger" data-size="sm">`, label `<span className="ds-tag__label" id={labelId}>`. Both ids from `useId` | `.ds-evidence-span { display: inline; }` / `.ds-evidence-span__trigger { vertical-align: baseline; margin-inline-start: var(--ds-space-inline-sm); }` |
| `ev-missing-1` + D7, D16 | Span: `<span className="ds-evidence-span">{children}<span className="ds-evidence-span__missing">{m.evidence.missing}</span></span>`. List: `<div className="ds-evidence-list"><p className="ds-evidence-list__missing">{m.evidence.missing}</p></div>` | D7 and D16 rules as written above |
| `ev-open-1` + D8 | `<PopoverContent className="ds-evidence-card" aria-label={...} collisionPadding={CARD_GUTTER}>`, where `CARD_GUTTER = 16` lives in `span.ts`, with a comment naming `space.gutter` | `.ds-evidence-card { max-inline-size: var(--ds-size-panel-default); }` |
| `ev-card-1` + D10, D11 | As the spec says | `.ds-evidence-quote__text { margin: 0; padding-inline-start: var(--ds-space-inline-md); border-inline-start: 2px solid var(--ds-border-control); font-family: var(--ds-type-body-md-font-family); font-size: var(--ds-type-body-md-font-size); line-height: var(--ds-type-body-md-line-height); font-weight: var(--ds-type-body-md-font-weight); letter-spacing: var(--ds-type-body-md-letter-spacing); min-inline-size: 0; overflow-wrap: anywhere; }` / `.ds-evidence-quote__meta { margin: 0; margin-block-start: var(--ds-space-inline-sm); color: var(--ds-text-secondary); font-family: var(--ds-type-body-sm-font-family); font-size: var(--ds-type-body-sm-font-size); line-height: var(--ds-type-body-sm-line-height); font-weight: var(--ds-type-body-sm-font-weight); letter-spacing: var(--ds-type-body-sm-letter-spacing); }` |
| `ev-list-1` + D14 | As the spec says | `.ds-evidence-list__items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ds-space-stack-md); }` |

## Spec amendments this design needs (L-0019)

The spec writer folds these into v1.1. Each one is a play or a test the builder writes.

<!-- prettier-ignore -->
| # | Spec part | Change | Play or test that proves it |
| --- | --- | --- | --- |
| A1 | `ev-trigger-1`, AC 1, 2, 4, 7, 11, 12 | The button's name is the visible label, then the fact, through `aria-labelledby` (D6). It is no longer just the visible text | `Default` play: `getByRole("button", { name: "หลักฐาน ชื่อแบรนด์: บ้านกาแฟ" })`; `InEnglish`: `"Evidence Brand name: Baan Coffee"` |
| A2 | `ev-missing-1`, `ev-recipe-1`, contract table | Two new recipe classes, `ds-evidence-span__missing` (D7) and `ds-evidence-list__missing` (D16) | AC 9 and 17: `getComputedStyle(missing).color` equals the computed `--ds-text-secondary`. AC 17: the missing block's height equals a sibling md Button's (40 px) |
| A3 | `ev-recipe-1` | The quote line is `border.control`, with an 8 px indent (`space.inline.md`). The source line sits 4 px under the quote (`space.inline.sm`) in `text.secondary`. List items are 16 px apart (`space.stack.md`) | `recipes.test.ts` value checks; AC 16 adds: a meta `top` minus its quote `bottom` equals 4, and the next quote `top` minus the meta `bottom` equals 16 |
| A4 | `ev-recipe-1` "no rule sets a colour", contract "pairs.ts is unchanged", AC 14 and 20 | Two new pairs in `pairs.ts`: `{ recipe: "evidence", slot: "source line", fg: "ds:text.secondary", bg: "popover.bg", floor: TEXT }` and `{ recipe: "evidence", slot: "secondary text on the page", fg: "ds:text.secondary", bg: "ds:surface.canvas", floor: TEXT }` (the missing text and the list source line). No new token | `pnpm contrast` and `recipes.test.ts` over every profile and both modes |
| A5 | `ev-open-1`, AC 12, W3 | `PopoverContent` takes `collisionPadding={CARD_GUTTER}` (16, `space.gutter`) | AC 12 adds: in the 360 px frame the dialog's `left` is 16 or more and its `right` is 344 or less. `span.test.ts`: `CARD_GUTTER` equals `space.gutter` resolved through the token source, as in W3 |

## Screens to check in visual QA

At 360 and 1440, light and dark, Thai and English, neutral, plus one Friendly dark:

1. EvidenceSpan `Default` open: the pill on the fact's baseline; the card under it, with 16 px or more to each screen edge at 360; the quote line, the source line and the card padding on one edge.
2. EvidenceSpan `Keyboard` after Enter: the card's border and halo in `focus.ring`. Before Enter: the pill's ring, no card.
3. EvidenceSpan `ByModel`: the source line reads "อ่านด้วยโมเดล AI" in secondary ink.
4. EvidenceSpan `Missing`: three facts, each with "ไม่มีหลักฐาน" in secondary ink, 4 px after the fact, and no pill.
5. EvidenceSpan `At360` open with `long`: a 3-line quote with the line along its full height, no clipped mark, no horizontal scroll, card at most 320 px.
6. EvidenceList `Default` open: label, quote lines and source lines on one edge; 4 px inside each pair and 16 px between pairs; chevron up.
7. EvidenceList `Empty`: "ไม่มีหลักฐาน" on the label edge at the trigger's 40 px height.
8. Both `RecipesAndModes`: the same layout under neutral, professional and friendly, light and dark.

## Proposal screenshots

The mock: Storybook `base-collapsible--default` (ORV-211 worktree at `c19579c`, port 6421, stopped afterwards). Its boundary content was replaced with the markup of the Anatomy above, using the real Tag, Popover, Button and Collapsible classes. The proposed CSS was injected with `page.addStyleTag`. Globals were `mode`, `locale` and, for one set, `profile:friendly`. The card was placed under its pill as Radix places it, with `align` start and a 16 px collision padding. Folder: the main checkout's `.orivilo/runs/ORV-211/ORV-211-design-1/screenshots/`.

- Final proposal (`-v2`): `span-*`, `card-long-*`, `list-*` at {light, dark} x {360, 1440} x {th, en}; `states-*` and `states-cardfocus-*` at 360, {light, dark} x {th, en}.
- Friendly (`-v2-friendly`): `span-*` and `list-*` at the same 8 combinations.
- The spec as written (`-v1-spec`), for comparison: `span-*` and `list-*` at the same 8 combinations. The missing text there has no rule at all, so it touches the fact.
