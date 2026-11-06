---
issue: ORV-226 (https://tpetkaew.atlassian.net/browse/ORV-226)
spec: docs/specs/ORV-226/spec.md v1.1
task: ORV-226-design-1
version: 1.0
---

# ORV-226: ConfirmDialog design

Everything here was rendered on a scratch story built from the real `Dialog` and `Button`, with the CSS of "The recipe block" injected, in Chromium through Playwright, Thai unless a row says English. Nothing under `packages/` was edited. The prototype and its scripts are throwaway files outside the repo; the rows and the block below are what the builder takes.

## Answers to the open questions

No answer differs from its default. Rows are in "Numbered rows".

<!-- prettier-ignore -->
| Question | Answer | Why, from the render | Row |
| --- | --- | --- | --- |
| 2. First focus for a delete | (a) the cancel. Default kept | The line and halo sit on a ghost button with no fill of its own, so the eye lands on the quiet way out while the red button stays the loudest thing on the panel. Enter on a stray key keeps the project | D15 |
| 3. First focus for accepting | (a) the confirm. Default kept | The step can be undone, and the ring on the filled button reads as "this is the expected step". Under the friendly profile in dark mode the two confirm fills are close in colour, so focus and the glyph row, not the fill, tell the forms apart (D10) | D15 |
| 5. Focus after a failed confirm | (a) stays on the confirm. Default kept, plus one addition: when the panel overflows it scrolls to its end so the message is seen, and focus does not move (A3) | The message sits right above the actions, so the eye is already there. Cost: a held Enter can retry once the press settles; accepted, since the failed step did nothing | D21, D22 |
| 9. Close control, cancel while pending | Keep the close control; `disabled` cancel. Default kept | The close control fills the row the glyph needs anyway (D10). The disabled look of cancel and close reads clearly in both modes and both profiles (`destructive-pending` shots) | D17, D18 |

## Flow

1. Closed: the trigger, a secondary Button that names the outcome.
2. Open: title, impact, then the actions. Destructive puts first focus on the cancel, accept on the confirm.
3. Leave: cancel, Escape or the close control closes the panel and focus returns (`confirm-return-1`). A press outside does nothing.
4. Press the confirm: pending. The spinner joins the label, cancel and close go disabled, the panel holds its size and both buttons hold their place.
5. Settled, done: the panel closes. That is the only signal.
6. Settled, failed: the spinner goes, the message appears above the actions, focus stays on the confirm. A press of it is the retry and takes the message away at once. Cancel, Escape and close work again.

## States

<!-- prettier-ignore -->
| State | What it looks like | Where it comes from | Screens |
| --- | --- | --- | --- |
| Closed | The trigger only | Button `secondary` | AC 1 |
| Default, destructive | Danger glyph on its own row with the close control beside it, title, impact, ghost cancel, destructive confirm | D10, D11 | `destructive-open` |
| Default, accept | No glyph, title beside the close control, impact, ghost cancel, primary confirm | D12 | `accept-open` |
| Hover | Inherited from Button, nothing added. The panel has no hover | Button recipe | Not a screen; Button stories prove it |
| Focus | Line with a halo in the profile's focus hue, from Button. A pointer open or press shows no ring in Chromium (`:focus-visible` false) | D16 | Every `-open` shot, opened by keyboard |
| Selected | Not applicable. Nothing in the panel is selected, and focus never borrows a selection look | | |
| Disabled | While pending, the cancel and the close control in Button's disabled look. The confirm is never `disabled` | D18 | `destructive-pending`, `accept-pending` |
| Loading, pending | Spinner before the kept label; the outer box of the confirm and the size of the panel do not change | D8, D18 | `-pending` |
| Empty, impact missing | `dialog.impactMissing` in the impact slot, same type and colour | D14 | `missing-impact` |
| Error, failed | The message in the danger colour above the actions, the confirm ready for a retry | D21 | `-failed`, `long-failed` |
| Success | None by design. Closing is the only signal | D27 | AC 10 |

## Numbered rows

Values are the rendered px with the tokens that give them: `--cmp-dialog-padding` 24, `--cmp-dialog-gap` 16, `--ds-space-stack-sm` 8, `--ds-space-inline-sm` 4, `--ds-size-icon-md` 20, `--cmp-button-height-sm` 32, `--ds-space-inset-md` 16. "360" and "1440" are viewports. The content box of `.ds-confirm` is 278 at 360 and 334 from 416 up, where the panel reaches its 384 cap. Row numbers in the last column are AC rows of the spec, with the amendments of A5 to A12 where the row says so.

<!-- prettier-ignore -->
| # | Rule | Target | CSS or markup | Play that proves it |
| --- | --- | --- | --- | --- |
| D1 | `confirm-api-1` | Panel 328 wide at 360, 384 at 1440, no new visual on any other Dialog | `<DialogContent className="ds-confirm" size="sm" ...>`. Every selector of the block starts at `.ds-confirm`, so `.ds-dialog` callers are untouched | AC 20 width; `Application/Dialog` plays unchanged (AC 23) |
| D2 | `confirm-api-1` | Footer DOM: cancel, confirm, status line, with the close control after the footer | The confirm is the next element sibling of the cancel: `.ds-button + .ds-button` relies on it, and the cancel's `DialogClose` renders no wrapper | AC 3 Tab order |
| D3 | `confirm-api-1` | The panel is the one scroller. No sideways scroll. Its height stays under the recipe's `max-height` (viewport less 32) | `.ds-confirm`: `overflow: hidden auto`, `overscroll-behavior: contain`, `container-type: inline-size`, `padding-block-end: 0` | A5 (AC 20), A11 (row 28) |
| D4 | `confirm-api-1` | Actions stick to the panel's foot and text passes under them. At rest nothing moves: 16 from text to button, 25 from the last button to the panel edge (24 and the border) | `.ds-confirm .ds-dialog__footer`: `position: sticky`, `inset-block-end: 0`, `margin-block-start: calc(-1 * gap)`, `padding-block: gap padding`, `background: var(--cmp-dialog-bg)`. Chromium holds a sticky box inside its scroller's padding, so the foot padding must live on the footer; with it on the panel the footer sat 25 px up and hid the impact's last line while every overflow number passed | A6: footer top at or below the impact's bottom at rest, read from rects; row 28 |
| D5 | `confirm-api-1` | Content box at its cap (334): one row, end aligned, on any viewport from 416 up | Footer buttons `flex: 0 0 auto` under `.ds-confirm`, which also takes the footer off the viewport rule at 480, so a frame shows what a phone shows | Row 30 |
| D6 | `confirm-api-1` | Content box below 334 (viewport below 416, any frame narrower): stacked, cancel above confirm, 8 apart, both the full width (278 by 40 at 360) | `@container (max-width: 333px)`, `flex: 1 0 100%`. 333 is the cap (384) less the padding and the border, less 1; if `max-w-sm` or the dialog padding changes, this number changes with it | AC 20, row 30 |
| D7 | `confirm-copy-1` | A label past the contract wraps inside the panel and never leaves it: 278 by 54.8 on two lines, 278 by 77.2 on three, at 360 | Footer buttons: `min-width: 0`, `max-width: 100%`, `padding-block: var(--ds-space-inline-sm)`, `white-space: normal`. The block padding gives wrapped text 5 px off the button edge; one line stays 40 | Row 29 |
| D8 | `confirm-pending-1` | A press changes no row and moves no button. In the row form the cancel moves 0, the confirm's end edge 0, the label 0. Row gap 32 at rest | `.ds-button + .ds-button:not([data-loading])` under `.ds-confirm`: `margin-inline-start: calc(var(--cmp-button-icon-size-md) + var(--cmp-button-gap))`, `max-width: calc(100% - that)`. The confirm holds the 24 its spinner takes, so the footer measures the same at rest and pending. Both reset in the stacked form | A7 (AC 7, 9), row 30 |
| D9 | `confirm-role-1` | No look | None | AC 2 |
| D10 | `confirm-impact-1` | Destructive: one start edge for glyph, title, impact and footer (41 at 360, 553 at 1440). Glyph row 8 above the title. The title takes the full width, since the close control shares the glyph's row | `.ds-confirm[data-variant="destructive"] .ds-dialog__header`: `flex-direction: column`, `gap: var(--ds-space-stack-sm)`, `padding-inline-end: 0` | A6 (AC 2): left edges equal within 0.5 |
| D11 | `confirm-impact-1` | Glyph centre on the close control's centre (214.8 and 214.8 at 360, 368.8 and 368.8 at 1440) | `.ds-dialog__glyph` `margin-block-start: calc((button-height-sm - icon-md) / 2 + inset-md - dialog-padding)`, which is -2 | A6 (AC 2): centres equal within 0.5 |
| D12 | `confirm-impact-1` | Accept: no glyph, the title keeps Dialog's 32 of end room, so it never runs under the close control | None; the recipe does this | AC 4 |
| D13 | `confirm-impact-1` | Impact 8 under the title, Dialog's description type and colour, 16 above the buttons. Two or three lines at 360 | None; `.ds-dialog__description` and row 17 of ORV-192 stand | AC 2, AC 20 |
| D14 | `confirm-impact-1` | Missing impact: the same slot, type and colour. No warning colour, no empty state | Pattern renders `dialog.impactMissing` as the `description` | AC 18 |
| D15 | `confirm-focus-1` | First focus by variant, panel not scrolled on open (`scrollTop` 0, measured on a short panel) | `focus({ preventScroll: true })` in `onOpenAutoFocus`, so a short panel shows its title first and not its foot (A4) | A4 (AC 3, 4); row 28 |
| D16 | `confirm-focus-1` | Button's line and halo, whole on every side. No clip by the scroller | None. The halo stays inside the 24 of inline padding and the footer's 16 above | AC 3; `-open` shots |
| D17 | `confirm-dismiss-1` | Close control at 16 from the top and the end, unchanged. It scrolls with the content in a short panel, and Tab brings it into view | None | Row 28 |
| D18 | `confirm-pending-1` | Spinner before the kept label; panel height and footer rows equal to rest in all 49 cases measured. Stacked, the label's group re-centres, 12 to the side; the box does not move | `loading`, `loadingLabel`, `disabled` as the spec says, with D8 | A7 |
| D19 | `confirm-pending-1` | Focus on the confirm while pending, on every browser | In the press handler, before cancel is disabled: `if (document.activeElement !== confirm) confirm.focus({ preventScroll: true })` (A2) | AC 7, story `PressFocus`; see "Bounds" |
| D20 | `confirm-outcome-1` | Done: the panel closes with the recipe's motion, nothing more | None | AC 10 |
| D21 | `confirm-failure-1` | Message in the error slot, 14 px, danger colour, directly above the actions. Adds 63.6 to a delete or accept panel at 360 with the two-line fixture. Its wording says it failed and a new line appears, so it is not colour alone (`DESIGN.md` section 7) | None; `.ds-dialog__error` stands | AC 11, 14 |
| D22 | `confirm-failure-1` | In an overflowing panel the message is whole above the footer after the failure, focus unmoved. Five cases measured, 320 by 256 to 640 by 360 | After the message is in the DOM, `panel.scrollTop = panel.scrollHeight`. Instant, no `scrollIntoView`, no smooth scroll. The prototype used `flushSync`; a layout effect keyed on the message serves as well | A3, row 28 |
| D23 | `confirm-failure-1` | The message's arrival and removal re-centre the panel, about 32 each way, with no animation. Accepted: the top of the panel moves, the words do not jump under the pointer | None | AC 12 |
| D24 | `confirm-status-1` | No look. `sr-only` is absolutely placed, so it is no flex item and takes no row | `<span role="status" className="sr-only">` last in the footer | AC 8 |
| D25 | `confirm-return-1` | No look | None | AC 16, 17 |
| D26 | `confirm-copy-1` | A `confirmLabel` is a short verb phrase of one line; a name belongs in `title` | Catalog `rules` line (A10) | AC 25 |
| D27 | `confirm-honest-1` | No tick, no success colour, no toast anywhere in the pattern | None | AC 10 |
| D28 | Long content | Long Thai title and impact wrap at 360 with no clipped mark. Failed at 360 by 560: panel 328 by 489.5, content 488 in 488, so it does not scroll | D3 and D4; the recipe's `overflow-wrap: anywhere` stands | A5 (AC 20) |
| D29 | Long content | Past the panel's height (640 by 360 long, 320 by 256, 360 by 560 with the longest fixture): text scrolls by arrow keys, wheel and touch, actions stay in reach. No divider: the cut line of the text is the cue, so the panel keeps one line per edge | D3 and D4 | Row 28 |
| D30 | Reduced motion | Nothing new moves. The spinner keeps turning by design (spin-motion-1, ORV-201). D22 is instant | None | See "Bounds" for the defect found here |
| D31 | Profiles and modes | No override in any profile. The footer's ground is `--cmp-dialog-bg`, so `pairs.ts` gains nothing | No new token, no new pair | AC 21, 22, `pnpm contrast` |

## The recipe block

For `packages/design-system/src/recipes/recipes.css`, after the dialog rules. Every value is an existing token.

```css
/* Confirm dialog (ORV-226): the panel is its own scroller, so the actions stay in reach. */
.ds-confirm {
  container-type: inline-size;
  overflow: hidden auto;
  overscroll-behavior: contain;
  /* The footer owns the foot padding: a sticky box is held inside its scroller's padding. */
  padding-block-end: 0;
}
/* One start edge: the glyph takes its own row, beside the close control, and the title the full width. */
.ds-confirm[data-variant="destructive"] .ds-dialog__header {
  flex-direction: column;
  gap: var(--ds-space-stack-sm);
  padding-inline-end: 0;
}
.ds-confirm[data-variant="destructive"] .ds-dialog__glyph {
  margin-block-start: calc(
    (var(--cmp-button-height-sm) - var(--ds-size-icon-md)) / 2 + var(--ds-space-inset-md) -
      var(--cmp-dialog-padding)
  );
}
/* The actions stick to the panel's foot. The box takes the gap above them and the padding below, so
 * at rest nothing moves, and scrolled text passes under it. */
.ds-confirm .ds-dialog__footer {
  position: sticky;
  inset-block-end: 0;
  margin-block-start: calc(-1 * var(--cmp-dialog-gap));
  padding-block: var(--cmp-dialog-gap) var(--cmp-dialog-padding);
  background: var(--cmp-dialog-bg);
}
/* The shape follows the panel, not the viewport. A caller's long label wraps inside the panel; it
 * never leaves it. */
.ds-confirm .ds-dialog__footer > .ds-button {
  flex: 0 0 auto;
  min-width: 0;
  max-width: 100%;
  padding-block: var(--ds-space-inline-sm);
  white-space: normal;
}
/* The confirm holds the room its spinner takes, so a press moves neither button and changes no row. */
.ds-confirm .ds-dialog__footer > .ds-button + .ds-button:not([data-loading]) {
  max-width: calc(100% - var(--cmp-button-icon-size-md) - var(--cmp-button-gap));
  margin-inline-start: calc(var(--cmp-button-icon-size-md) + var(--cmp-button-gap));
}
/* Below its cap the panel always stacks, so no label, language or spinner can change the shape. */
@container (max-width: 333px) {
  .ds-confirm .ds-dialog__footer > .ds-button {
    flex: 1 0 100%;
  }
  .ds-confirm .ds-dialog__footer > .ds-button + .ds-button:not([data-loading]) {
    max-width: 100%;
    margin-inline-start: 0;
  }
}
```

The block was not run against `recipes.test.ts`, because this task edits no package file. `@container` with a px width already appears in `recipes.css`; the builder's run is the proof.

## Rendered sizes

<!-- prettier-ignore -->
| Panel height | 360 | From 416 |
| --- | --- | --- |
| Delete, Thai | 276.4 | 228.4 |
| Accept, Thai | 284.4 | 236.4 |
| Delete, Thai, failed | 340 | 292 |
| Accept, Thai, failed | 348 | 300 |
| Delete, English | 337.6 | 228.4 |
| Accept, English | 311.6 | 229.6 |
| Delete, English, failed | 425 | not recorded |
| Accept, English, failed | 399 | not recorded |

Pending equals rest in every cell. Button sizes across a press, 49 cases: viewports 360, 390, 402, 412, 415, 416, 430, 479, 480, 1440, in both languages and both forms, then labels of mid, long and full length at 360, 416 and 1440. No case changed rows, footer height or panel height; no button left the panel. Row form at the cap, confirm width at rest then pending: Thai delete 101.8 then 125.8, Thai accept 168 then 192, English delete 124.3 then 148.3, English accept 134.9 then 158.9.

## Before and after

What the unchanged recipe does with the same content, which is why the spec's "Not changed: `recipes.css`" cannot hold (A1).

<!-- prettier-ignore -->
| Case | Unchanged recipe | With the block |
| --- | --- | --- |
| 320 by 256 (400 percent zoom of 1280 by 1024), delete copy, failed | Footer bottom 284 past the viewport's 256, and the panel does not scroll: the actions cannot be reached | Panel 224 high, footer in view, message whole above it |
| 640 by 360, long content, failed | Footer bottom 379 past 360 | Panel 328 high, footer in view |
| 360 by 560, the longest fixture | Footer 5 px past the panel | Panel scrolls, 596 in 526, footer in view |
| Long label at 360 | Button 365 wide at x -46, leaving panel and viewport | 278 by 54.8, wrapped, inside |
| Mid label at 360, press | Footer goes from one row to two, panel 202.4 to 250.4, shifting 24 | Always stacked, nothing moves |
| English accept at 402 to 415, press | Not measured on the recipe. A first version of this block, with its stack threshold at 319, went from one row to two, panel 229.6 to 277.6, at widths such as 412 that phones use | Stacked at rest already, nothing moves |
| Spinner in the row form | Cancel slides 24 to the start (measured on that first version, whose row is the recipe's) | Cancel, confirm edge and label all stay |
| Destructive start edges | Title 581, impact 553, two edges; glyph centre 3 above the title line | All 553; glyph on the close control's centre |
| AC 20 frame in a 1440 viewport | `@media (min-width: 480px)` keeps the desktop row, buttons 68.7 and 101.8: not what a phone shows | Stacked, 278 by 40 each |

## Visual decisions and their source

<!-- prettier-ignore -->
| Decision | Intent | Source | Options weighed |
| --- | --- | --- | --- |
| The glyph takes its own row in the destructive form | The delete path reads as different before a word is read, by shape and not by fill, with one start edge | AC 26; sign-off "one start edge"; friendly dark, where primary (255,162,143) and destructive (245,138,128) are nearly one colour | A: glyph inline with the title, two start edges, fails sign-off. B: impact indented to the title, narrower column, an orphan word on a third line. C: this one, about 26 px taller. `explore/compare-360.png`, `explore/compare-1440.png` |
| The panel scrolls and the actions stick | The way out and the way forward are always in reach, at any zoom | `DESIGN.md` section 11, nothing clips at 360; SC 1.4.10 reflow case of 320 by 256 | Letting the page scroll is not open under a modal lock |
| Stacked below the cap, row at the cap | One shape per panel width, chosen by the panel, so no label or language decides it | Sign-off "a shape that holds at every line count" | Keeping the wrap of the recipe: measured, it jumps on a press |
| Cancel above confirm when stacked | DOM and visual order agree, and the spec fixes the DOM | `confirm-api-1`, `confirm-focus-1` | Reversing with `order` would split Tab order from reading order |
| The confirm holds its spinner's room | "The spinner keeps the label in place", taken literally in the row form | AC 26 | Row gap 32 at rest, 8 while pending. Read in `sheet-destructive-open-1440.png`: the ghost cancel has no edge at rest unless focused, and the gap reads as a quiet separation of the two choices |
| Ghost cancel kept | Calm; the confirm carries the weight | Spec `confirm-api-1`, `DESIGN.md` section 6 | Secondary cancel: louder, competes with the red |
| No divider above the sticky footer | One line per edge; text cut by the footer is the cue that more lies above | Sign-off "one line per edge" | A divider appears only when scrolled: needs script, for a rare case |
| Failure line left as the recipe has it | The failure reads as failure by words and place, without a new surface | `DESIGN.md` sections 7 and 10 | A tinted box: new tokens and a new pair, no gain in meaning |

## Amendments to the spec

For the main session or product to take into `spec.md` with a version bump. The block needs A1 to hold.

<!-- prettier-ignore -->
| # | Spec row or rule | Change | Why |
| --- | --- | --- | --- |
| A1 | "Contract changes and impact", "Not changed" | `recipes.css` moves to changed: one `.ds-confirm` block, with `className="ds-confirm"` on `DialogContent`. Impact: new recipe class, no token, no pair, no change to any `.ds-dialog` caller; `recipes.test.ts` runs on it. `Dialog` and `Button` stay as the spec says | The table "Before and after" |
| A2 | `confirm-pending-1` | On a press, before cancel is disabled, the pattern focuses the confirm if it is not the active element, with `preventScroll` | Safari and Firefox on macOS may not focus a clicked button, and disabling cancel could then drop focus. General browser knowledge, not run and not in a K entry |
| A3 | `confirm-failure-1` | Add: when the panel overflows, it scrolls to its end after the message renders; focus does not move | Without it the message can sit under the sticky footer |
| A4 | `confirm-focus-1` | The first focus call passes `preventScroll: true` | A short panel must open at its title |
| A5 | AC 20 | Replace "every ancestor ... up to but not including the frame ... `visible`" with: the walk runs to the frame with the panel as its one named exception; the panel's computed `overflow-y` is `auto` and its `scrollHeight` is not above its `clientHeight` for this fixture. Add `expectFrameCutsNoInk(el, frame)` on the title, the impact and the failure line, ink proved as spec row 20 says, and both buttons 278 wide, stacked, 8 apart | The panel is now the scroller on purpose. The check still proves nothing is clipped at this size |
| A6 | AC 2 | Add: glyph, title and impact left edges equal within 0.5; glyph centre equals the close control's centre within 0.5; footer `top` at or below the impact's `bottom`. Keep "a danger glyph before": it holds in reading order | D4, D10, D11. The last check is the one that catches the sticky-padding fault; opening a PNG found it, the overflow numbers did not |
| A7 | AC 7 and 9 | Add: panel height and footer height equal before and during pending; `expectSameHeight` on the two buttons. The row form is proved in a frame, row 30 | D8, D18 |
| A8 | AC 11 and 14 | "its `bottom` is at or above the footer's `top`" takes a tolerance of 0.5. The footer's `top` now includes its 16 padding | Measured 263.3 against 263 when scrolled |
| A9 | AC 26 | Add `ShortPanel`, `LongLabel`, `ShapeHolds` to the designer's list. "Keeps the label in place" means the same words, with no change of footer height or rows; the row form also holds the label's x, the stacked form re-centres it 12 | D18 |
| A10 | Contract table, catalog entry | The `rules` lines add: `confirmLabel` is a short verb phrase that fits one line; names go in `title` | D26 |
| A11 | New row 28 | Story `ShortPanel`: frame 640 by 360, `modal={false}`, long content, failed. Footer inside the panel and the frame; the alert whole above the footer; `scrollTop` 0 on open; ArrowDown on the focused cancel scrolls the panel; focus unmoved after the failure | D3, D4, D15, D22, D29 |
| A12 | New rows 29 and 30 | 29, story `LongLabel`: frames 360 and 416 wide, a confirm label of `fixtures.longThai`. The confirm stays inside the panel, frame `scrollWidth` not above its width, the label wraps. 30, story `ShapeHolds`: frames 412 and 416 wide, English accept, press the confirm. At 412 stacked, at 416 one row; rows, footer height and panel height the same at rest and pending; at 416 the cancel's `left` and the confirm's `right` unchanged within 0.5 | D5 to D8. "Rows per PR" and the row 26 count change with these |

## Screens for visual QA

The designer's sign-off (AC 26) checks these on the built stories, against the same looks as the PNGs below. Root of every path: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-226-design-1/`. These files are temporary and not in git.

- Contact sheet, 64 matrix shots and 20 past it: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-226-design-1/contact-sheet.png`
- Matrix: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-226-design-1/shots/<state>-<profile>-<mode>-<width>.png`, with state `destructive-open`, `destructive-pending`, `destructive-failed`, `accept-open`, `accept-pending`, `accept-failed`, `long-failed`, `missing-impact`; profile `neutral`, `friendly`; mode `light`, `dark`; width `360` (the whole 360 by 640 viewport), `1440` (the panel with a 32 px margin, from 1440 by 900). Thai.
- Per state: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-226-design-1/sheet-<state>-360.png` and `sheet-<state>-1440.png` beside it.
- Past the matrix: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-226-design-1/shots/extra-<name>.png`, with name `short-640x360-top`, `short-640x360-scrolled`, `short-640x360-scrolled-dark`, `zoom-320x256-top`, `zoom-320x256-accept-failed`, `max-360x560-scrolled`, `label-long-360`, `label-long-1440`, `label-full-frame-360`, `frame-360x560-in-1440`, `en-accept-pending-412`, `en-accept-open-1440-dark`, `en-destructive-failed-360`, `en-accept-pending-360`, `en-destructive-failed-1440`, `en-accept-pending-1440`, and the unchanged recipe as `before-short-640x360`, `before-zoom-320x256`, `before-label-long-360`, `before-destructive-1440`.
- The options weighed: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-226-design-1/explore/compare-360.png`, `compare-1440.png`, `wrap-lh16.png`, `wrap-lh17.png` beside them.

What to look for: one start edge in the destructive form; glyph level with the close control; no Thai mark cut in title, impact, failure line or labels; the two buttons one height; focus as a line and halo, never as a fill; the failure above the actions; the footer's text cut clean in `short-` and `zoom-` shots; friendly dark, where only the glyph row and the focus tell delete from accept.

## Bounds

- Chromium only. WebKit is not installed and Firefox was not run, so sticky, container and pointer focus behaviour is unproven there. No real screen reader was run (`confirm-honest-1`).
- 320 by 256: the text window is 71 to 94 px, and the impact can start below the footer with no cut line to hint at it. It is reachable by arrow keys, wheel and touch, and first focus on the cancel keeps Enter safe. Accepted for a 400 percent zoom case.
- Footer type stays `type.control.md` at 1.6, though a button can now wrap and `DESIGN.md` gives a wrapping label 1.7 (deviation). At 1.7 every normal one-line Thai label lifts 1 px, ORV-194 row 6b; wrapping is only a guard for a label past the contract. The wrapped sample at 1.6 stays legible with close marks (`wrap-lh16.png`, `wrap-lh17.png`).
- A pair too long for the row at the cap wraps: both buttons end aligned, and at rest the confirm starts 24 in from the start edge, filling it only while pending (`extra-label-long-1440.png`). Past the contract of D26, so accepted; the footer's size still holds through a press.
- Stacked, a one-line label within 24 of the button's text width wraps only while pending, so the footer grows once. Past D26 as well; not measured.
- 333 in the container query is a number, not a token, and a container query cannot read one. D6 says what it tracks.

## Found here, not in this story

- Reduced motion does not reach inside a boundary. `--ds-motion-*` are redeclared on `[data-mode]`, so the `:root` override at `orivilo.css` line 80 is shadowed; under `prefers-reduced-motion: reduce` the panel's `animation-duration` measured 0.2s. It reaches every overlay and needs its own card.
- A `.ds-dialog` without a body (the Dialog `Destructive` story, `ArchiveDialog`) keeps the overflow and the two start edges of the "Before" column until it moves to ConfirmDialog, the follow-up the spec already names.
- Friendly's dark primary and destructive fills are close. The pattern carries the difference by shape; the colours themselves are a profile matter.

## Changelog

- v1.0 (2026-11-06): first version, on spec v1.0. Open questions 2, 3, 5 and 9 on their defaults; amendments A1 to A12 for the spec.
