---
issue: ORV-250
spec: docs/specs/ORV-250/spec.md v1.1
parent design: docs/specs/ORV-223/design.md
task: ORV-250-design-1
head: f8cfb715157680926bd24d835d0a7643762af84e
date: 2026-11-07
---

# ORV-250 design: the wait on a board that has things on it

Settles finding F1 of the sign-off `ORV-250-signoff-1`. The choice is option A: while `loading`, the board's LoadingState sits on a solid plate, on every board. It amends row D11 of `docs/specs/ORV-223/design.md` and leaves that file unedited. Everything else in that file holds, and rows D17 to D20 below continue its numbering.

## The finding, and what rendering it added

F1 saw the ring and the words on live nodes on `LoadingFinishes`. Rendering the two options showed the same defect on three more grounds, and those three are on boards with no node at all. So the question is wider than "a board with nodes".

<!-- prettier-ignore -->
| Ground under the wait | Reached by | No plate, which is head and option B | With the plate |
| --- | --- | --- | --- |
| Nodes and edges | `LoadingFinishes`, 360 and 1440 | Head: ring at 1.08 to 5.6 on the pill (the sign-off's figures), words over port labels. B: nodes held back, so clear | 0 px of flow ink inside the ring's and the words' boxes |
| Toolbar | A board too short for the form, 294 by 240 | Words on "100%" and on the buttons, all 16 cells | Words whole. Plate lies over part of the toolbar (D20) |
| Block library shelf | `EmptyBoardShort`'s board, 360 by 640 | Words on the search field's placeholder, in every cell I opened (9 of 16; the form's box is the same in the rest). Read on the shots: the walker reads text nodes, and a placeholder is not one | Words whole. Plate lies over part of the search field (D20) |
| Open task bar | `EmptyBarOpen`'s board, 900 by 420 and 360 by 420 | The card's edge runs through the words. At 360 in English the words also lie on "No jobs on this board yet" | Words whole. Plate lies over the card's top (D20) |

## The two options, compared

Same story, same cells, only the option varies. Option A injects the CSS of D17. Option B rewrites the story's host in the browser, so the graph stays empty until the press and is then set on the same board.

<!-- prettier-ignore -->
| Question | A: a plate under the form | B: `loading` is for a board with no nodes, and the host holds its nodes back |
| --- | --- | --- |
| Reads on `LoadingFinishes` | Yes, 16 of 16 cells, 5.54 to 7.04 | Yes, 16 of 16 cells, 4.9 to 11.25. It is the calmer screen of the two |
| Reads on toolbar, shelf and open bar | Yes | No: text on text, the row above. A catalog rule about nodes changes nothing on these three |
| Holds if a host ignores the rule | Yes, it is a recipe rule | No. `loading` with nodes stays reachable through the public prop, and a catalog line stops no one |
| A board that reloads while it shows nodes | Nodes stay in place around the plate | The host must empty a board the person is looking at, and it comes back at the press. At 360 the toolbar also goes from three rows to two at the press, as `b__` and `b-after__` show |
| View after the wait | 6 of 6 nodes whole, same transform | 6 of 6 nodes whole, same transform. The fit is not a point against B |
| New contracts | One recipe rule, one pair row | One catalog rule, a changed story host, and the host contract every future caller must keep |

The envelope prefers the option with fewer new contracts when both read on every ground. They do not both read, so that preference does not decide it: A is the only one that meets "every ground the wait can reach". B alone was refused for that reason, not for its look, which is fine on the story it was named for.

## Visual decisions

<!-- prettier-ignore -->
| # | Decision | Value (tokens) | Source intent | Proved by |
| --- | --- | --- | --- | --- |
| D17 | The plate. Amends D11 | `.ds-board__overlay > .ds-loading-state` takes `padding-block` `space.inset.md` (16), `padding-inline` `space.inset.lg` (24), a 1 px `toolbar.border` line, `toolbar.radius` (12 neutral, 16 Friendly, read; 8 Professional by D3, not rendered), `toolbar.bg` solid, `toolbar.shadow`. One line form: 156.3 to 162.9 by 89.8 px. No new token | F1, `DESIGN.md` line 20 and the floor of `load-live-1`. It is the status pill's own form, and the pill is hidden while the board loads (`load-board-1`), so the words stay in a shape the board already has. Solid and not glass, because a blur lets the text under it through | Row 36 |
| D18 | The plate has the toolbar's shadow | `toolbar.shadow` | Light mode puts a white plate on white nodes, on the white card and on the near white toolbar, where `toolbar.border` alone leaves a line that reads as part of the node (`a-flat__neutral-light-th-1440.png`). Every other layer floating on the board has a shadow; the status pill has none because it never lies on anything. Dark shows little of it, and there the line carries the edge | Screens |
| D19 | Always on, on every board, nodes or not | No `:has(.react-flow__node)` | Rendered with that condition, the empty board keeps text on text on the toolbar, the shelf and the open bar. CSS cannot read whether the form meets them. It also keeps one look for a wait, so a graph that arrives mid wait does not change it. Cost: D11's quiet form on an empty board goes (`empty-1440.png`), and I accept that. The plate is calm there, the same size as on a full board | Rows 35, 37 |
| D20 | The plate keeps the board's centre, and may lie over furniture | Offset 0 on both axes in every cell. `load-board-1` and D15's note stand: no rise | A rise is D15 widened, a change to `load-board-1`, and its own rows. Without a rise the plate covers rather than collides. The limits are in "What the plate costs" | Row 35 |

D11 after this change: it holds for the empty form, whose board has nothing on it by definition. It does not hold for the wait. Its reason, "a screen that has nothing on it", was never true of a wait.

D12 and D13 hold. The column inside the plate is unchanged: ring 24, 8, label, 16 to an action. A plate around the whole form is not D13's tile around the ring. The root's cap of 320 now includes the padding and line, so the words' measure on a board is 270 px at most. D14 holds: the plate has no transition.

## States

<!-- prettier-ignore -->
| State | The plate |
| --- | --- |
| default | The ring and the words on it |
| hover | None, not interactive |
| focus | Never focusable. It can hide what is, see "What the plate costs" |
| disabled | Does not apply |
| loading | Is this state |
| empty | The same plate. The form is not an empty form, and D11 still rules the empty one |
| error | The wait ends and the plate goes; a failed load is Alert's |
| success | The wait ends and the plate goes; nothing celebrates |

Selected does not apply. Forced colours: a 1 px black line, white ground, no shadow, ring and words in system ink (`forced-360.png`). Reduced motion: no change, the ring follows `spin-motion-1`. Reduced transparency: nothing to do, the plate is solid.

## The change for the builder

Paths are under `packages/design-system/`.

<!-- prettier-ignore -->
| File | Change |
| --- | --- |
| `src/recipes/recipes.css` | The block below, after `.ds-board__overlay > *` |
| `src/recipes/pairs.ts` | One row after the "ring and label on board" row: `{ recipe: "spinner", slot: "ring and label on the board's plate", fg: "spinner.fg", bg: "toolbar.bg", floor: TEXT }`. The `board.bg` row stays, as `load-live-1` names it |
| `src/testing/visual-asserts.ts` | A new helper, `expectCoversInk`, below |
| `src/components/canvas-board/CanvasBoard.stories.tsx` | The `Loading` and `LoadingFinishes` plays, as rows 35 and 36 below. Line 635 is not touched, so S1 stays a follow-up |
| `catalog/application/canvas-board.yaml` | The `loading` rule at line 26: say the form sits on a plate, and replace "where the label can overlap the card" with "where the plate lies over the card's top" |
| `DESIGN.md` | A change log line. The depth row needs no change: the plate is solid, and the board's floating layers already have a shadow |

```css
/* The wait can land on nodes, the toolbar, the shelf or the open bar, so it brings its own ground: the
 * status pill's form, which is hidden while the board loads (ORV-250 D17). Solid, so nothing shows through. */
.ds-board__overlay > .ds-loading-state {
  padding-block: var(--ds-space-inset-md);
  padding-inline: var(--ds-space-inset-lg);
  border: 1px solid var(--cmp-toolbar-border);
  border-radius: var(--cmp-toolbar-radius);
  background: var(--cmp-toolbar-bg);
  box-shadow: var(--cmp-toolbar-shadow);
}
```

Nothing else changes. No token, no prop, no markup, no string. `CanvasBoard.tsx` and `LoadingState.tsx` stay as they are. The selector needs the overlay, which only the board has, so LoadingState elsewhere and rows 27 to 34 are untouched.

New pair: `spinner.fg` on `toolbar.bg`, floor 4.5.

<!-- prettier-ignore -->
| Cell | Plate | Ring and words on it | Plate on board, decorative |
| --- | --- | --- | --- |
| Neutral light | rgb(255, 255, 255) | 6.78 | 1.13 |
| Neutral dark | rgb(30, 29, 38) | 7.04 | 1.22 |
| Friendly light | rgb(255, 255, 255) | 5.54 | 1.13 |
| Friendly dark | rgb(62, 52, 36) | 6.75 | 1.67 |

`toolbar.bg` is `surface.card`, so this pair resolves to the existing `spinner.fg` on `ds:surface.card` row. The new row is still listed, because `pairs.ts` names what a recipe puts together. Professional is not rendered here; `pnpm contrast` reads it once the row exists.

### `expectCoversInk`

```ts
/**
 * Asserts nothing of `layer` shows through `parts`: `scope` is shot as shipped and with `layer` at
 * `opacity: 0`, and each part's region (`paintRegion`) must differ by no pixel (`paintDifference`).
 * The inline value is put back in `finally`. Runs where Vitest browser mode runs.
 */
export async function expectCoversInk(
  scope: Element,
  parts: readonly Element[],
  layer: HTMLElement,
);
```

Two things I learned by getting it wrong:

- Hide the layer by `opacity`, not `visibility`. React Flow writes `visibility: visible` on every node, so `visibility: hidden` on `.react-flow__viewport` leaves the nodes shown. My first run read 0 px on head at 1440, a pass on the defect.
- Hold the ring still with `withRingsStill`, or the two shots differ by its angle.

Seen in a browser probe, with the same 12 tolerance as `PAINT_TOLERANCE`, over the ring and words' 112 by 54 px box: head differs by 4136 to 4404 px at 360 and 5561 to 5726 px at 1440; with the plate 0 px, in all eight neutral and friendly, light and dark cells at those widths, in Thai. That probe ran in Playwright, not through this helper, which is not written yet. The builder proves the helper red on head.

## Rows

Rows 27 to 34 keep their meaning and their words. Rows 37 to 39 keep their words: each renders row 35, so each gains the plate with nothing to change, and the plate sets no `overflow`, so row 38's clip checks read as before (`overflow` read `visible` on the root in all 16 cells). Rows 35 and 36 change, as A1 and A2 below.

## Amendments to the spec (ask v1.1)

The main session decides these; this file does not change `spec.md`.

**A1. Row 35.**

Old, User sees: "The ring and "กำลังโหลดกระดาน" once, centred on the board, with no status pill".

New, User sees: "The ring and "กำลังโหลดกระดาน" once, on the plate, centred on the board, with no status pill".

Old, Check, ends: "...its bounding box 1 by 1 px; the overlay label visible".

New, Check, ends: "...its bounding box 1 by 1 px; the overlay label visible; the form's centre on the board's centre to 0.5 px on both axes; the ring's and the label's boxes inside the root's padding box by at least the resolved `--ds-space-inset-md` less 0.5 px above and below".

**A2. Row 36.**

Old, User sees: "The overlay goes and the board shows its fixture nodes".

New, User sees: "While the wait runs, the ring and the words sit on the plate over the nodes and nothing of the nodes shows through them. Then the overlay goes and the board shows its fixture nodes".

Old, Check: "`LoadingFinishes` play: node identity, `textContent`, attribute".

New, Check: "`LoadingFinishes` play: before the press, the box of at least one `.react-flow__node` overlaps the root's box, and `expectCoversInk` on the board with the ring and the label as parts and `.react-flow__viewport` as the layer, inside `withRingsStill` and guarded by `inVitest`; then node identity, `textContent`, attribute".

**A3. Open question 1.**

Old: "...so at 900 by 420 the label would overlap the open card, by the 18.3 px design.md measured on the head's overlay and not on LoadingState."

New: "...so at 900 by 420 the plate lies over the open card's top (`docs/specs/ORV-250/design.md` D20)."

The default (a) stands, with the named cost now the plate's. On the words themselves the overlap is gone.

**A4. "What this story uses".** Add `docs/specs/ORV-250/design.md`, and name D11 as amended by D17.

**A5. Version.** `v1.1`, with a changelog line naming F1, D17 to D20, and rows 35 and 36. Rows per PR do not change. Downstream: the builder envelope takes "The change for the builder", and the qa envelope takes rows 35 and 36.

`load-live-1`, `load-board-1` and their parent spec need no change: the first names a pair that stays, and the second keeps the centre.

## What the plate costs

Figures are the same under neutral and Friendly. Sizes other than a story's own were set by resizing the board's host in the page.

- **It hides what is under it, for the length of the wait.** It clears the toolbar from about 222 px tall with one row (900 by 225 gap 1.6, 900 by 220 gap -0.9), 294 with two (arithmetic; 662 by 300 gap 3.1), and 366 with three (294 by 366 gap 0.1, 294 by 365 gap -0.4). So `LoadingAt360` at 360 by 420 is clear, by 27.1 px. On a 360 by 640 shelf board it lies 57.7 px into the shelf and clears it at about 756 (360 by 760 gap 2.3).
- **It takes presses on its box.** The form's root already did, through `.ds-board__overlay > *`. The box grows from about 106 by 56 to 156 by 90. On the short board that covers buttons: at 294 by 240, 2 of 13 tab stops are wholly under it (zoom in, fit to the board) and 5 partly; at 294 by 300, none wholly and 3 partly.
- **A keyboard person can land under it.** The flow stays tabbable during a wait. On `LoadingFinishes` at 360 one edge of the 24 tab stops lies wholly inside the plate's box, and a node 90 percent. At 1440 none lies wholly inside; the most is 66 percent. That is a measure of boxes: I did not render a focused stop under the plate. WCAG 2.2 SC 2.4.11 asks that focus is not entirely hidden, and head does not have this cost, because its form is see through. See the open point.
- **On the open bar it covers the card's top.** At 360 by 420 it cuts the card's title for the length of the wait (`bar-a__neutral-light-th-360.png`). The card's action stays reachable.
- **At the narrow end it is a large shape on a small graph.** At 360 the fit is 28 percent, so the plate covers most of one node (`a__neutral-light-th-360.png`). It is the honest price of words that read at 14 px over a graph drawn at a quarter size.

## Open points

- Focus under the plate. The clean answer is that a board that loads takes no input, by `inert` on the flow while `loading`. That is a behaviour change to CanvasBoard with its own rows, not a look, so it is not in this design. The other way out is to accept the cost for the length of a wait. The main session or the owner decides; this design works under either.
- The rise. D15 widened to the wait would clear the toolbar and the shelf and end the first two costs, at the price of `load-board-1`'s centre and new rows. Not proposed: no screen mounts this board yet, and the plate already reads on those boards.
- Not rendered: Firefox and WebKit are not installed here, and Professional was not in this task. No screen reader run; the plate adds no role or name.

## Screens to check in visual QA

- `application-canvas-board`: `Loading`, `LoadingFinishes`, `LoadingInEnglish`, `LoadingAt360`, `LoadingRecipesAndModes`. The plate on `LoadingFinishes` must show no node ink inside it, and its edge must read against a white node in light and a same colour node in dark.
- By injection or a host, since no story pairs them: the wait on a shelf board and with the open bar, as on the sheets below.

## Evidence

Rendered on 2026-11-07 on the Storybook of head `f8cfb71` built by the sign-off, served on port 6464, Chromium through Playwright, reduced motion on, plays stripped so the wait stays on screen. CSS went in by `addStyleTag`, and option B's host, `loading` on the bar and shelf stories, by a route that rewrites the chunk in the browser. No file under `packages/` changed. 240 shots, 0 page errors, no horizontal overflow, and the form inside the board in every shot that shows it.

All paths sit under `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-250-design-1/`.

- Shots: `shots/<stage>__<profile>-<mode>-<locale>-<width>.png`, for example `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-250-design-1/shots/a__friendly-dark-th-1440.png`.
- Numbers: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-250-design-1/measures.json`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-250-design-1/probe.json`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-250-design-1/probe2.json`.
- Forced colours and stacked Thai marks at 3x: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-250-design-1/probe/`.
- Sheets: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-250-design-1/sheets/`.

<!-- prettier-ignore -->
| Stage, 16 shots each | What it shows |
| --- | --- |
| `a`, `b` | The two options on `LoadingFinishes` |
| `a-after`, `b-after` | The board after the press |
| `a-flat` | The plate with no shadow (D18) |
| `empty-a`, `empty-nodesonly` | The empty board with the plate and with the condition D19 refuses |
| `short-a`, `short-none` | 294 by 240, on the toolbar |
| `bar-a`, `bar-none` | The open bar |
| `shelf-a`, `shelf-none` | The shelf. At both viewports the story's board is 360 by 640 |
| `lines2-a`, `lines4-a` | The label at two lines, and at three or four: root 312 or 320 wide, 113.6, 137.4 and 161.2 tall. The shape holds at each, nothing clipped |

What I opened. Sheets, which show the cells at 1:1 in a crop: `a-360`, `b-360`, `a-1440-neutral`, `a-1440-friendly`, `b-1440-neutral`, `b-1440-friendly`, so all 32 cells of the two options, the 1440 ones cropped to the board's middle; `short-360-th`, `bar-1440-th`, `shelf-360-en`, `shelf-1440-th`, `lines-1440`, `empty-1440`. Alone and whole: `a__neutral-light-th-360`, `a__neutral-light-th-1440`, `a__friendly-dark-th-1440`, `a-flat__neutral-light-th-1440`, `a-flat__friendly-dark-th-1440`, `b__neutral-light-th-360`, `a-after__neutral-light-th-360`, `b-after__neutral-light-th-360`, `short-none`, `short-a`, `bar-none`, `bar-a`, `shelf-none` and `shelf-a` in `neutral-light-th-360`, `empty-a__neutral-light-th-360`, `lines4-a__neutral-light-th-360`, `marks-neutral-light`, `marks-friendly-dark`, `forced-360`. The other 10 sheets, among them `short-360-en`, `bar-360-th`, `bar-360-en`, `lines-360` and `empty-360`, and `forced-1440`, I did not open; their cells are covered by the measures only.
