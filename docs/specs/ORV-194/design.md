# ORV-194: design notes

Design decisions for the look rows 5 to 10 of `docs/specs/ORV-194/spec.md` (rule `designer-first-1`). Each row names the fix, its exact values from existing tokens, the play and helper that check it, what else it reaches, and whether it changes a token value or a public API. I rendered every fix by injecting the proposed CSS into the named stories (`page.addStyleTag`). Row 10 is a TypeScript change, so I rendered it by running the proposed fit in the page through the board's own React Flow store. Setup: Storybook at head `d6659a1`, Chromium, reduced motion. The builder states no value that this file does not hold (L-0017).

Scripts and raw numbers: `/tmp/orv-194-design-1/scripts/` (`shoot.cjs`, `sheet.cjs`). Each row's folder `/tmp/orv-194-design-1/r<row>/` holds the injected `after.css` or `fit.js`, the probes and the measurement output (`*.txt`).

## Rows

| Row | Fix in one line                                                                                                                                                                | Token value change                                     | Public API change |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ----------------- |
| 5   | When a shelf is on the board, the status line sits 16 px (`space.inset.md`) above it, through anchor positioning on the shelf                                                  | No                                                     | No                |
| 6   | `type.label.md` and `type.heading.sm` line heights go from 1.6 and 1.5 to 1.7 (`font.line-height.1-7`)                                                                         | **Yes**, two semantic values (route B below avoids it) | No                |
| 7   | Every one-line ellipsis label extends its clip box 4 px (`space.inline.sm`) above and below with a padding and negative margin pair, so no Thai stack is cut                   | No                                                     | No                |
| 8   | The Select listbox is never wider than the space Radix measures (`--radix-select-content-available-width`), and an option description wraps inside it                          | No                                                     | No                |
| 9   | Selected text uses `selection.bg` and `selection.fg` in every boundary (`::selection`)                                                                                         | No                                                     | No                |
| 10  | Every fit (first fit, zoom to fit, zoom to selection, jump to node) adds the height the bottom panels and the task bar cover to its bottom padding, so no node sits under them | No                                                     | No                |

## Row 5: the board status line covers no shelf tile

### What is asked

Two stories in `Application/Block library`: `Narrow` (360, Thai, status "วางบล็อกแล้ว") and `Default` at 1440 with a status. The status line must cover no shelf tile, and shelf and status keep 16 px over the canvas controls, as ORV-192 row 2 set (finding S1 of ORV-192-signoff-2).

### Today (measured, `r5/probe.js`)

ORV-192 row 2 anchored both the shelf and the status line 16 px above the controls. They share one band, so the status pill sits on the first tile:

| Board                                 | Status box (top to bottom) | Shelf box    | Overlap    |
| ------------------------------------- | -------------------------- | ------------ | ---------- |
| 360 by 800 (`Narrow`)                 | 640 to 682                 | 504.6 to 682 | first tile |
| 1440 by 900 (`Default` with a status) | 776 to 818                 | 640.6 to 818 | first tile |

The shelf spans the board between the controls' start and end edges, so moving the status sideways cannot clear it.

### Fix

When the board holds a shelf, the status line stands on the shelf instead of the controls. Its bottom edge sits 16 px (`space.inset.md`) above the shelf's top edge, on the same start edge as the shelf and the controls. Without a shelf, nothing changes: the status stays 16 px above the controls (ORV-192 row 2). The open task list rule stays more specific and keeps its own placement, which is already above the shelf (measured: status bottom 423 before and after).

| #   | File, line (head d6659a1)                                                                                                     | Before                                                                  | After                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | `packages/design-system/src/recipes/recipes.css` line 3062 (`.ds-board .react-flow__panel.ds-shelf`)                          |                                                                         | add `anchor-name: --ds-board-shelf;`                                                                                                                                                                                                                                                                                                                                                                                                     |
| 5.2 | `recipes.css` after the status anchor block of ORV-192 row 2 (lines 4165 to 4171), before the open task list rule (line 4174) |                                                                         | `@supports (anchor-name: --a) { .ds-board:has(.ds-shelf) .ds-board__status { position-anchor: --ds-board-shelf; bottom: calc(anchor(top) + var(--ds-space-inset-md)); } }`, with the comment "With a shelf on the board the status line stands 16 px above the shelf, never on a tile (ORV-194 row 5)". Its specificity (0,3,0) equals the controls rule's, so it must come after that rule. The open task list rule (0,4,0) still wins. |
| 5.3 | `recipes.css` comment above the anchor blocks (line 4162)                                                                     | "... 16 px above the controls at any row count"                         | add "... or above the shelf when there is one (ORV-194 row 5)"                                                                                                                                                                                                                                                                                                                                                                           |
| 5.4 | `src/components/block-library/BlockLibrary.stories.tsx` `expectClear` (line 101)                                              | the `status` clause measures the status bottom against the controls top | the `status` clause measures it against the shelf (`shelfTop - statusBottom` is 16, within 1 px). It also asserts that the status box intersects no `.ds-shelf__tile` box (`getBoundingClientRect`, strict overlap on both axes). The shelf clause does not change.                                                                                                                                                                      |
| 5.5 | `BlockLibrary.stories.tsx`                                                                                                    | `Default` has no status                                                 | new story `WithStatus` (`<ShelfBoard status="วางบล็อกแล้ว" />`, the 1440 case of the spec), whose play calls `expectClear(board, true)`                                                                                                                                                                                                                                                                                                  |

Without anchor support, the browser skips the `@supports` block and the status keeps today's place (the row 2 fallback).

### Measured after (`r5/after.css` injected)

| Board                 | Status bottom   | Shelf top | Gap | Tiles under the status |
| --------------------- | --------------- | --------- | --- | ---------------------- |
| 360 by 800 (`Narrow`) | 488.6           | 504.6     | 16  | none                   |
| 360 by 640            | 328.6           | 344.6     | 16  | none                   |
| 1440 by 900           | 624.6           | 640.6     | 16  | none                   |
| 1200, task bar closed | 550.6           | 566.6     | 16  | none                   |
| 1200, task bar open   | 423 (unchanged) | 566.6     |     | none                   |

The shelf keeps its 16 px over the controls (that rule is unchanged). The status now floats over the canvas, as on a board without a shelf. At 360 it lies over the edge between the two node rows; it is a short-lived polite message, not a control.

### Play and helper

Geometry only, no ink helper: the play from 5.4, run in `Narrow` and `WithStatus`. It fails at head `18763ee`, where the first tile intersects at both widths.

### Reaches

Only boards that have both a shelf and a status message. No token, no component API. The `Narrow` play's status clause changes as 5.4 says (spec row 5 allows it).

### Rendered

Contact sheet `/tmp/orv-194-design-1/row-5-contact.png`. Before, the status pill covers the lower part of the first tile, in light and dark, at 360 and at 1440. After, the pill sits above the shelf on the shelf's start edge with a band of canvas between them, every tile shows both its lines, and the shelf still floats 16 px over the controls.

- `/tmp/orv-194-design-1/r5/narrow-w360-th-light-before.png`, `/tmp/orv-194-design-1/r5/narrow-w360-th-light-after.png`
- `/tmp/orv-194-design-1/r5/narrow-w360-th-dark-before.png`, `/tmp/orv-194-design-1/r5/narrow-w360-th-dark-after.png`
- `/tmp/orv-194-design-1/r5/default-w1440-th-light-before.png`, `/tmp/orv-194-design-1/r5/default-w1440-th-light-after.png` (status injected)
- `/tmp/orv-194-design-1/r5/default-w1440-th-dark-before.png`, `/tmp/orv-194-design-1/r5/default-w1440-th-dark-after.png`
- `/tmp/orv-194-design-1/r5/taskbar-open-w1200-th-light-before.png`, `/tmp/orv-194-design-1/r5/taskbar-open-w1200-th-light-after.png` (open task list, unchanged)

### Screens to check in visual QA (row 5)

`application-block-library--narrow` at 360 and the new `WithStatus` at 1440, light and dark. Look for: the status pill above the shelf on its start edge, both lines of every tile whole, and 16 px between the shelf and the controls.

## Row 6: wrapped labels and headings keep 1.5 px between lines

### What is asked

A wrapped title set in `type.label.md` (14 / 1.6) or `type.heading.sm` (20 / 1.5) keeps at least 1.5 px between the lowest ink of one line and the highest ink of the next (the ORV-192 row 18 floor). Stories: `Base/Toast` `At360`, `Application/Dialog` `LongContentAt360`, the side sheet title and the Missing inputs prompt question. Checked at 360, Thai, light and dark, under neutral, Professional and Friendly.

### Measured (`r6/gap.cjs`, output `r6/gap.txt` and `r6/gap-dsf.txt`)

Method:

- Each title gets two forced lines in the pair ORV-192 used: ฟูฟูฟูปู่ปู่ฟูฟู (deep lower vowels) in red over ฟื้ฟื้ฟื้ปี๊ปี๊ฟื้ฟื้ (the tallest stacks) in blue.
- In each pixel column, measure the gap from the lowest red ink to the highest blue ink, and take the smallest over all columns.
- Device scale 4, result in CSS px.
- Each element keeps its own font, size and weight; only `line-height` varies.

| Title (story)                                                              | Type      | Today | At 1.6  | At **1.7** |
| -------------------------------------------------------------------------- | --------- | ----- | ------- | ---------- |
| `.ds-toast__title` (`base-toast--at-360`)                                  | 14 at 1.6 | 0     | (today) | **1.51**   |
| `.ds-prompt__question` (`application-missing-inputs-prompt--images-later`) | 14 at 1.6 | 0.5   | (today) | **1.5**    |
| `.ds-dialog__title` (`application-dialog--long-content-at-360`)            | 20 at 1.5 | -2    | 0       | **2**      |
| `.ds-side-sheet__title` (`application-sheet--open`)                        | 20 at 1.5 | -2    | 0       | **2**      |

- The three profiles read the same numbers.
- A negative gap means the ink overlaps: today the ู of one dialog line runs into the ้ of the next.
- At 20 px, 1.6 does not reach the floor. 1.7 (`font.line-height.1-7`, an existing primitive) is the lowest existing value that reaches it at both sizes. It is the same value ORV-192 row 18 chose for running text.

### Two routes

**Route A (recommended): change the token values.**

- `type.label.md` line height 1.6 to 1.7 (22.4 to 23.8 px); `type.heading.sm` 1.5 to 1.7 (30 to 34 px).
- One place fixes the whole class: every label and heading of these two sizes that can wrap, not only the four named titles.
- The survey found more of the class wrapping today: field labels (`base-field--long-label-at-360`, two lines), the progress header (`base-progress--long-label-at-360`, two lines) and card titles (`application-card--long-content-at-360`, three lines). Node, group and inspector titles share the same tokens.
- This is a semantic token value change, so the lane is L (spec open question 1).

**Route B (smallest): change only the four named titles.**

- `.ds-toast__title` and `.ds-prompt__question` take `line-height: var(--ds-type-body-sm-line-height)` (14 / 1.7).
- `.ds-dialog__title` and `.ds-side-sheet__title` take `line-height: var(--ds-type-body-lg-line-height)` (20 / 1.7).
- No token value changes (lane S).
- Costs: the component tokens (`toast.title-type`, `dialog.title-type` and the others) would then state 1.6 or 1.5 while the recipe renders 1.7, and the rest of the class keeps crowding.

Recommended: **A**. The same defect sits in every label and heading of these sizes that can wrap, and A moves no control height (measured below). B is the fallback if the owner wants this card to stay in lane S. In that case the rest of the class becomes a follow-up.

### What each route moves (`r6/impact.cjs`, output `r6/impact.txt`, neutral light)

| Box (story, width)                                                                      | Today          | Route A        | Route B   |
| --------------------------------------------------------------------------------------- | -------------- | -------------- | --------- |
| `.ds-button` sm, md, lg (`base-button--sizes`, 1200)                                    | 32, 40, 48     | unchanged      | unchanged |
| `.ds-badge` (`base-badge--sizes`)                                                       | 20, 24         | unchanged      | unchanged |
| `.ds-tabs__trigger` (`base-tabs--default`, `base-tabs--long-labels-at-360`)             | 40             | unchanged      | unchanged |
| `.ds-taskbar__header` (`application-task-bar--running`)                                 | 56             | unchanged      | unchanged |
| `.ds-chat__header` (`application-canvas-chat--idle`)                                    | 48             | unchanged      | unchanged |
| `.ds-field` (`base-field--default`)                                                     | 70.4           | 71.8           | unchanged |
| `.ds-field__label`, two lines (`base-field--long-label-at-360`)                         | 44.8           | 47.6           | unchanged |
| `.ds-slider__header` (`base-slider--default`)                                           | 22.4           | 23.8           | unchanged |
| `.ds-progress__header`, two lines (`base-progress--long-label-at-360`)                  | 44.8           | 47.6           | unchanged |
| `.ds-node__header` and `.ds-node` (`application-canvas-node--variants`)                 | 46.7 and 107.7 | 47.5 and 108.6 | unchanged |
| `.ds-group__header` (`application-node-group--grouped`)                                 | 34.7           | 36             | unchanged |
| `.ds-taskbar__row` (`application-task-bar--running`)                                    | 81.9, 82.9     | 83.3, 84.3     | unchanged |
| `.ds-shelf__tile` (`application-block-library--default`, 1440)                          | 68.2           | 69.6           | unchanged |
| `.ds-toast__title`, three lines (`base-toast--at-360`)                                  | 67.2           | 71.4           | 71.4      |
| `.ds-prompt__question` (`application-missing-inputs-prompt--images-later`)              | 22.4           | 23.8           | 23.8      |
| `.ds-side-sheet__header`, `.ds-side-sheet__title` (`application-sheet--open`)           | 65.2, 30       | 69.2, 34       | 69.2, 34  |
| `.ds-dialog__title` (`application-dialog--open`; five lines in `--long-content-at-360`) | 30; 150        | 34; 170        | 34; 170   |
| `.ds-card__title` (`application-card--default`; three lines in `--long-content-at-360`) | 30; 90         | 34; 102        | unchanged |
| `.ds-inspector__title` (`application-inspector--selected`)                              | 30             | 34             | unchanged |

- Under both routes, every control with a height token keeps its height: buttons, badges, tabs, and the task bar and chat headers.
- What grows is text: 1.4 px per 14 px label line and 4 px per 20 px heading line.
- No play pins these heights. A grep of `src/` for `22.4`, `65.2`, `68.2`, `46.7` and `34.7` finds only `canvas-chat/place-reply.ts` line 47 (`REPLY_LINE_HEIGHT = 22.4`) and its test. That constant is a reply note's body line, not one of these tokens.
- The shelf grows 1.4 px. Rows 5 and 10 read the rendered shelf box, so they follow it.

### Builder table (route A)

| #   | File, line (head d6659a1)                                                                                                                                | Before                                    | After                                                                                                                                                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | `packages/design-system/src/tokens/source/semantic.json`, `type.heading.sm.lineHeight` (block at lines 979 to 988)                                       | `{font.line-height.1-5}`                  | `{font.line-height.1-7}`                                                                                                                                                                                                                                                                                                                                                     |
| 6.2 | `semantic.json`, `type.label.md.lineHeight` (block at lines 1033 to 1042)                                                                                | `{font.line-height.1-6}`                  | `{font.line-height.1-7}`; then run the design-system tokens build and commit the generated files                                                                                                                                                                                                                                                                             |
| 6.3 | `src/profiles/profiles.test.ts` lines 238 to 256 ("running text clears Thai marks (row 18)")                                                             | checks `type.body.*` only                 | the same check also covers `type.label.md` and `type.heading.sm` (line height at least 1.7), named "wrapping labels and headings clear Thai marks (ORV-194 row 6)"                                                                                                                                                                                                           |
| 6.4 | `DESIGN.md` §4, the type table (lines 130 to 135) and its rules                                                                                          | label and heading line heights not stated | add the rule: "A label or heading that can wrap is 1.7 too (`type.label.md` 14 / 1.7, `type.heading.sm` 20 / 1.7, ORV-194 row 6). At 1.6 and 1.5, a ู of one line touches the ้ of the next (0 and -2 px measured)." In line 141, replace the "3.5 px (20 / 1.5)" figure with the 20 / 1.7 rise the builder measures. Coordinate with row 3, which edits the same paragraph. |
| 6.5 | `src/testing/visual-asserts.ts`, new export below `expectInkClearsAbove` (line 532)                                                                      | none                                      | `expectLinesClear(el, px = 1.5)`, described below                                                                                                                                                                                                                                                                                                                            |
| 6.6 | Plays: `Toast.stories.tsx` `At360`, `Dialog.stories.tsx` `LongContentAt360`, `Sheet.stories.tsx` `Open`, `MissingInputsPrompt.stories.tsx` `ImagesLater` | none                                      | each calls `await expectLinesClear(<the title or question element>)` behind `inVitest`                                                                                                                                                                                                                                                                                       |

### The helper

`expectLinesClear(el, px = 1.5)`:

1. Insert a shallow clone of `el` (`cloneNode(false)`, so the same classes, recipe and line height) right after `el`, at `el`'s width.
2. Fill it with two forced lines: `<span>ฟูฟูฟูปู่ปู่ฟูฟู</span><br><span>ฟื้ฟื้ฟื้ปี๊ปี๊ฟื้ฟื้</span>`. The first span is coloured `rgb(224, 0, 0)` and the second `rgb(0, 0, 224)`, inline; this is test paint and is never shipped.
3. Take one screenshot of the clone with the internal `shoot`.
4. In each pixel column, take the rows between the lowest red pixel (red channel above both others by more than 40) and the highest blue pixel (blue above both others by more than 40). The gap is the smallest over all columns, in CSS px.
5. Assert `gap >= px - 1 / devicePixelRatio`, then remove the clone in `finally`.

Why the floor subtracts one device pixel: antialiasing. The same rendered gap reads 1 at scale 1 and 1.5 to 2 at scale 4 (`r6/gap-dsf.txt`). The check fails today: 0 or less at scale 1, and under 1 at scale 2. It passes after route A.

It works on a clone, not the title itself, so React's own text nodes are never replaced. The fixture titles of the sheet and the prompt fit one line at 360; the clone still gets two lines.

### Rendered

Contact sheet `/tmp/orv-194-design-1/row-6-contact.png`. I injected route A as `[data-design-profile] { --ds-type-label-md-line-height: var(--op-font-line-height-1-7); --ds-type-heading-sm-line-height: var(--op-font-line-height-1-7); }`. The primitive appears only to emulate the token build.

What the shots show:

- At 360, the dialog title's five Thai lines move from touching to a clear band between lines.
- The toast title's three lines open up, in light and dark.
- The stress pair at device scale 4, before: the ู tails run into the ้ marks in the dialog and sheet titles, and touch them in the toast and prompt.
- After: ground shows between every pair.

- `/tmp/orv-194-design-1/r6/toast-at-360-w360-th-light-before.png`, `/tmp/orv-194-design-1/r6/toast-at-360-w360-th-light-after.png`, `/tmp/orv-194-design-1/r6/toast-at-360-w360-th-dark-before.png`, `/tmp/orv-194-design-1/r6/toast-at-360-w360-th-dark-after.png`
- `/tmp/orv-194-design-1/r6/dialog-long-content-at-360-w360-th-light-before.png`, `/tmp/orv-194-design-1/r6/dialog-long-content-at-360-w360-th-light-after.png`, `/tmp/orv-194-design-1/r6/dialog-long-content-at-360-w360-th-dark-before.png`, `/tmp/orv-194-design-1/r6/dialog-long-content-at-360-w360-th-dark-after.png`
- `/tmp/orv-194-design-1/r6/sheet-open-w360-th-light-before.png`, `/tmp/orv-194-design-1/r6/sheet-open-w360-th-light-after.png`, `/tmp/orv-194-design-1/r6/sheet-open-w360-th-dark-before.png`, `/tmp/orv-194-design-1/r6/sheet-open-w360-th-dark-after.png`
- `/tmp/orv-194-design-1/r6/prompt-images-later-w360-th-light-before.png`, `/tmp/orv-194-design-1/r6/prompt-images-later-w360-th-light-after.png`, `/tmp/orv-194-design-1/r6/prompt-images-later-w360-th-dark-before.png`, `/tmp/orv-194-design-1/r6/prompt-images-later-w360-th-dark-after.png`
- Stress pair: `/tmp/orv-194-design-1/r6/toast-at-360-stress-w360-dsf4-th-light-before.png`, `/tmp/orv-194-design-1/r6/toast-at-360-stress-w360-dsf4-th-light-after.png`, `/tmp/orv-194-design-1/r6/dialog-long-content-at-360-stress-w360-dsf4-th-light-before.png`, `/tmp/orv-194-design-1/r6/dialog-long-content-at-360-stress-w360-dsf4-th-light-after.png`, `/tmp/orv-194-design-1/r6/sheet-open-stress-w360-dsf4-th-light-before.png`, `/tmp/orv-194-design-1/r6/sheet-open-stress-w360-dsf4-th-light-after.png`, `/tmp/orv-194-design-1/r6/prompt-images-later-stress-w360-dsf4-th-light-before.png`, `/tmp/orv-194-design-1/r6/prompt-images-later-stress-w360-dsf4-th-light-after.png`

### Screens to check in visual QA (row 6)

- `base-toast--at-360`, `application-dialog--long-content-at-360`, `application-sheet--open` and `application-missing-inputs-prompt--images-later`: at 360, Thai, light and dark, in all three profiles. No mark of a wrapped line may touch the line above.
- `base-field--long-label-at-360` and `application-card--long-content-at-360`, which route A reaches.
- `base-button--sizes` and `base-tabs--default`: heights unchanged.

## Row 7: one-line labels never cut a Thai stack

### What is asked

Every one-line label with an ellipsis shows the whole stack of ฟื้ or ปั้. Named: `.ds-shelf__name` in `Application/Block library` `Default`, the task bar job title in `Application/Task bar` `Running`, group titles, and the rest of the class in `recipes.css`. One fix covers every route.

### The class (every `text-overflow: ellipsis` rule in `recipes.css` at head d6659a1)

| Line(s)    | Selector                                                                                                                                 | Ink cut above today (px)                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 333        | `.ds-control[data-trigger] > span:first-child` (Select trigger)                                                                          | 0.92                                                                                          |
| 496        | `.ds-menu__option > span:first-child` (Select option)                                                                                    | 1.75                                                                                          |
| 522        | `.ds-menu__option-label` (option with an icon)                                                                                           | 1.43                                                                                          |
| 536        | `.ds-menu__option-body > span:first-child` (option with a description)                                                                   | same type as 496                                                                              |
| 1278       | `.ds-table__td[data-truncate] > .ds-table__cell`                                                                                         | 2                                                                                             |
| 2162, 2163 | `.ds-menu__item > span:first-child:not(.ds-menu__indicator)`, `.ds-menu__item > .ds-menu__indicator + span` (dropdown and context menus) | not opened in the probe; same type as 496                                                     |
| 2545       | `.ds-command__option > span:first-child`                                                                                                 | 1.5                                                                                           |
| 2684       | `.ds-group__title`                                                                                                                       | 1.99                                                                                          |
| 3211, 3212 | `.ds-shelf__name`, `.ds-shelf__state`                                                                                                    | 1.5 and 2                                                                                     |
| 3848       | `.ds-tag__label`                                                                                                                         | 1.75 (md), 0 (sm)                                                                             |
| 3956, 3957 | `.ds-taskbar__summary`, `.ds-taskbar__name`                                                                                              | 2.5 (summary); the name sits inside the progress label                                        |
| 4058       | `.ds-taskbar__progress .ds-progress__label` (the running job title)                                                                      | 1.71                                                                                          |
| 4567       | `.ds-chat__option > span:first-child`                                                                                                    | 2.25                                                                                          |
| 397, 408   | `.ds-input-group__input` (an `input`)                                                                                                    | excluded: an input clips at its own box whatever `overflow` says, so this fix cannot reach it |

How I measured (`r7/routes.cjs`):

- Replace the label's first text with ปี๊บฟื้นฟูปั้นญู่.
- Take one screenshot as shipped and one with `overflow: visible` on the label, at device scale 4.
- "Cut" is how far the visible ink rises above the label box, which is the part the shipped render cuts. Results: `r7/routes-before.txt`.

Nothing is lost below the box in any route.

The stack's rise per type, the same in all three profiles (`r7/measure.txt`): label.md 1.75 px, label.sm 3, body.sm 1.75, body.xs 1.25, body.md 1, heading.sm 3.5. Row 6 does not remove this: at 14 / 1.7 the rise is still 1.75 px.

The shelf module headings are outside the class: they have no ellipsis, and the shelf row they sit in already extends its clip box 4 px (`.ds-shelf__groups`, lines 3130 to 3141).

### Fix

One rule after the last ellipsis rule lists every route above except the input. Each label's clip box (its padding box) extends 4 px above and below, and an equal negative margin cancels the extra space. Layout does not move, and a stack up to 4 px above the line shows whole. `.ds-shelf__groups` already uses this pattern with the same token, for the focus ring (ORV-190).

| #   | File, line (head d6659a1)                                                                                                                                                                                                                                                    | Before | After                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | `packages/design-system/src/recipes/recipes.css`, after the `.ds-chat__option > span:first-child` rule (line 4567)                                                                                                                                                           |        | the comment `/* One-line labels clip at their padding box, and Sarabun's tallest stack (ปี๊, ฟื้) rises up to 3 px above a label line. Every ellipsis label pads its clip box 4 px out and cancels the space with a negative margin: no layout moves and no mark is cut (ORV-194 row 7). */`, then the rule `.ds-control[data-trigger] > span:first-child, .ds-menu__option > span:first-child:not(.ds-menu__option-body), .ds-menu__option-label, .ds-menu__option-body > span:first-child, .ds-table__td[data-truncate] > .ds-table__cell, .ds-menu__item > span:first-child:not(.ds-menu__indicator), .ds-menu__item > .ds-menu__indicator + span, .ds-command__option > span:first-child, .ds-group__title, .ds-shelf__name, .ds-shelf__state, .ds-tag__label, .ds-taskbar__summary, .ds-taskbar__name, .ds-taskbar__progress .ds-progress__label, .ds-chat__option > span:first-child { padding-block: var(--ds-space-inline-sm); margin-block: calc(-1 * var(--ds-space-inline-sm)); }` |
| 7.2 | `src/testing/visual-asserts.ts`, new export                                                                                                                                                                                                                                  | none   | `expectLabelInkWhole(el, sample = "ฟื้ปั้ปี๊ฟื้")`, described below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 7.3 | Plays: `BlockLibrary.stories.tsx` `Default` (the first tile's `.ds-shelf__name`), `TaskBar.stories.tsx` `Running` (`.ds-taskbar__progress .ds-progress__label`), `NodeGroup.stories.tsx` `Grouped` (`.ds-group__title`), `Tag.stories.tsx` `Sizes` (the md `.ds-tag__label`) | none   | `await expectLabelInkWhole(el)` behind `inVitest`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 7.4 | `DESIGN.md` §4 rules                                                                                                                                                                                                                                                         |        | add "A one-line label that truncates joins the clip-box rule in `recipes.css` (ORV-194 row 7). A new ellipsis selector left out of it cuts Thai stacks."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

`.ds-menu__option > span:first-child:not(.ds-menu__option-body)` is the form row 8 gives line 496, and the list above uses it.

Cascade: the rule comes last in the file. A grep of `padding-block` and `margin-block` in `recipes.css` finds no declaration on any listed selector, so the rule overrides nothing.

### The helper

`expectLabelInkWhole(el, sample)`:

1. Insert a shallow clone of `el` (`cloneNode(false)`, same classes) holding `sample` after `el`, in the same parent so the same recipe applies.
2. Screenshot the region from 8 px above to 8 px below the clone's border box twice: once as shipped, and once with `overflow: visible` set inline on the clone.
3. Assert that `firstInkRow` (line 39, ground taken from the region's top-left pixel) is the same in both shots.
4. Remove the clone in `finally`.

It fails at head `18763ee`: in each listed story the visible shot starts 1.5 to 2.5 px higher. It passes with 7.1: `r7/routes-after.txt` shows 0 lost on every measured route. `expectNoGlyphClip` cannot do this check; its own doc comment (line 480) says it cannot see marks above the font ascent.

### Reaches

Layout: none.

- `r7/heights.cjs` (output `r7/heights.txt`) compares each label's parent, grandparent and great-grandparent box with and without 7.1. They match on every route, with one exception: where a listed element holds another listed element (the progress label holds the task bar name; the option body holds the icon label), the outer one's own padding box shows 8 px taller. Its margin box and its parents are unchanged.
- Whole-story pixel diffs (`r7/pixdiff.txt`) differ in 0 to 37 px per story, all of them restored mark pixels at label tops. A layout shift would change thousands.

No token, no API.

### Rendered

Contact sheet `/tmp/orv-194-design-1/row-7-contact.png`, device scale 4, label text ฟื้นฟูปั้นปี๊บ.

- Before: the ้ over ฟื้ and ปั้, and the ๊ over ปี๊, are cut flat at the top of the shelf name, the task bar job title and the group title, in light and dark.
- After: every mark shows its full shape, each label stays where it was, and the tile, row and header keep their heights.

- `/tmp/orv-194-design-1/r7/shelf-name-w1440-dsf4-th-light-before.png`, `/tmp/orv-194-design-1/r7/shelf-name-w1440-dsf4-th-light-after.png`, `/tmp/orv-194-design-1/r7/shelf-name-w1440-dsf4-th-dark-before.png`, `/tmp/orv-194-design-1/r7/shelf-name-w1440-dsf4-th-dark-after.png`
- `/tmp/orv-194-design-1/r7/taskbar-title-w1200-dsf4-th-light-before.png`, `/tmp/orv-194-design-1/r7/taskbar-title-w1200-dsf4-th-light-after.png`, `/tmp/orv-194-design-1/r7/taskbar-title-w1200-dsf4-th-dark-before.png`, `/tmp/orv-194-design-1/r7/taskbar-title-w1200-dsf4-th-dark-after.png`
- `/tmp/orv-194-design-1/r7/group-title-w1200-dsf4-th-light-before.png`, `/tmp/orv-194-design-1/r7/group-title-w1200-dsf4-th-light-after.png`, `/tmp/orv-194-design-1/r7/group-title-w1200-dsf4-th-dark-before.png`, `/tmp/orv-194-design-1/r7/group-title-w1200-dsf4-th-dark-after.png`

### Screens to check in visual QA (row 7)

`.ds-shelf__name` in `application-block-library--default` at device scale 4, light and dark (the spec's screenshot), plus `application-task-bar--running` and `application-node-group--grouped`. Look for whole marks and unchanged tile and header heights.

## Row 8: the Select listbox stays inside the viewport at 360

### What is asked

`Base/Select` `RichAt360` and `LongOptionAt360` at 360 by 640, Thai, light and dark. The open listbox stays inside the viewport on all four sides and scrolls inside itself when its options do not fit. Option labels are unchanged.

### Today (`r8/probe.js`)

The listbox's right edge is at **596.7** (`RichAt360`) and **572.7** (`LongOptionAt360`) on a 360 px viewport.

Why: `.ds-menu` (`recipes.css` lines 449 to 459) has `min-width: var(--radix-select-trigger-width)` and no maximum, so the content sizes to its longest line. That is the long Thai label, plus the descriptions in `RichAt360`. Radix measures the available width and exposes it as `--radix-select-content-available-width` (340 px here). The vertical direction already works: `max-height` uses `--radix-select-content-available-height`, and the Radix viewport scrolls.

A second fault shows once the width is capped: descriptions never wrap. `.ds-menu__option-body` also matches `.ds-menu__option > span:first-child` (line 496, specificity 0,2,1), which beats its own rule (lines 531 to 535, 0,1,0). The body therefore takes `white-space: nowrap` and `overflow: hidden`, and the description inherits `nowrap`.

### Fix

| #   | File, line (head d6659a1)                                                                          | Before                                                        | After                                                                                                                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.1 | `recipes.css`, `.ds-menu` (lines 449 to 459)                                                       | `max-height` only                                             | add `max-width: var(--radix-select-content-available-width);` beside `max-height`. Outside a Select the variable is undefined, so `max-width` computes to `none`, today's value.                                                                                              |
| 8.2 | `recipes.css` line 496                                                                             | `.ds-menu__option > span:first-child {`                       | `.ds-menu__option > span:first-child:not(.ds-menu__option-body) {`, so the label rule no longer lands on the body                                                                                                                                                             |
| 8.3 | `recipes.css`, `.ds-menu__option-body` (lines 531 to 535)                                          | `display: flex; flex-direction: column; white-space: normal;` | add `flex: 1; min-width: 0;`, so the body takes the option's width and its description wraps (the description already has `overflow-wrap: anywhere`, line 551)                                                                                                                |
| 8.4 | `src/components/select/Select.stories.tsx` `RichAt360` (line 232) and `LongOptionAt360` (line 278) | no geometry check                                             | each play opens the list and asserts the `.ds-menu` box has `left >= 0`, `top >= 0`, `right <= innerWidth` and `bottom <= innerHeight`. When the Radix viewport has `scrollHeight > clientHeight`, it also asserts its `overflow-y` is not `visible`. Then it presses Escape. |

Labels keep their single line and ellipsis, now cut at the capped width. Each description wraps under its label, on the label's start edge. No TSX changes: no Select prop and no `collisionPadding`.

### Measured after (`r8/after.css`)

| Story, viewport               | Listbox left to right   | Inside | Scrolls                                                                         |
| ----------------------------- | ----------------------- | ------ | ------------------------------------------------------------------------------- |
| `RichAt360`, 360 by 640       | 10 to 350               | yes    | not needed                                                                      |
| `LongOptionAt360`, 360 by 640 | 10 to 350               | yes    | not needed                                                                      |
| `RichAt360`, 360 by 320       | 10 to 350, bottom 310.1 | yes    | yes: Radix viewport `scrollHeight` 334 > `clientHeight` 202, `overflow-y: auto` |
| `IconsAndDescriptions`, 1440  | 545 wide                | yes    | unchanged from today                                                            |

In `RichAt360`, options whose description now wraps grow from 62.4 to 84.5 px.

### Play and helper

Geometry and computed style only (8.4). It fails at head `18763ee`, where the right edges sit at 596.7 and 572.7 against 360.

### Reaches

Every Select listbox at every width. The cap applies only when the content is wider than the available space, so nothing changes at 1440 (measured). Dropdown and context menus (`.ds-menu[data-menu]`, line 2137) set `min-width: max-content`, which this row does not touch (see "Seen, not in these rows"). No token, no API.

### Rendered

Contact sheet `/tmp/orv-194-design-1/row-8-contact.png`.

- Before: both listboxes run off the right edge at 360, in light and dark.
- After: each listbox lines up with the trigger's edges, descriptions wrap under their labels, and at 360 by 320 the list scrolls inside its frame.
- In English the same holds.
- At 1440, the `IconsAndDescriptions` listbox is unchanged.

- `/tmp/orv-194-design-1/r8/rich-at-360-360x640-th-light-before.png`, `/tmp/orv-194-design-1/r8/rich-at-360-360x640-th-light-after.png`, `/tmp/orv-194-design-1/r8/rich-at-360-360x640-th-dark-before.png`, `/tmp/orv-194-design-1/r8/rich-at-360-360x640-th-dark-after.png`
- `/tmp/orv-194-design-1/r8/long-option-at-360-360x640-th-light-before.png`, `/tmp/orv-194-design-1/r8/long-option-at-360-360x640-th-light-after.png`, `/tmp/orv-194-design-1/r8/long-option-at-360-360x640-th-dark-before.png`, `/tmp/orv-194-design-1/r8/long-option-at-360-360x640-th-dark-after.png`
- `/tmp/orv-194-design-1/r8/rich-at-360-360x320-th-light-after.png`, `/tmp/orv-194-design-1/r8/rich-at-360-360x640-en-light-after.png`
- `/tmp/orv-194-design-1/r8/icons-and-descriptions-1440-th-light-before.png`, `/tmp/orv-194-design-1/r8/icons-and-descriptions-1440-th-light-after.png`

### Screens to check in visual QA (row 8)

- `base-select--rich-at-360` and `base-select--long-option-at-360`, opened at 360 by 640, light and dark. Look for: the listbox inside the screen on the trigger's edges, descriptions wrapped, labels on one line with an ellipsis.
- `base-select--icons-and-descriptions`, opened at 1440: unchanged.

## Row 9: selected text reads on its highlight

### What is asked

`Application/Dialog` `Open`, dark, three profiles. Selected text in the field reads at 4.5 or more on its highlight, in dark and in light. Selection keeps its own semantics; the brand accent never stands in.

### Today

Nothing in `src/` sets a `::selection` rule, so the browser paints its own highlight. `getComputedStyle(field, "::selection")` reports a transparent `backgroundColor` in all six profile and mode cases (`r9/probe.js`). In dark, the result is a light grey band under light ink: the selected name all but disappears.

### Fix

Use the existing selection pair in every boundary, portals included (each portal opens its own boundary): `selection.bg` for the highlight and `selection.fg` for the selected text. The pair is already guarded: `src/tokens/contrast-pairs.ts` line 78 (`selection.fg` on `selection.bg`, text floor 4.5) runs under every profile in both modes in `pnpm contrast`. No new token.

| Profile      | Light | Dark  |
| ------------ | ----- | ----- |
| neutral      | 7.45  | 5.12  |
| Professional | 8.57  | 10.20 |
| Friendly     | 6.49  | 10.26 |

These are the contrasts of `selection.fg` on `selection.bg`. All six pass 4.5.

Why `selection.fg` rather than keeping the text colour (`text.primary` on `selection.bg` reads 13.4 to 16): against the field ground, the highlight alone is faint (1.09 to 1.52). Text kept in `text.primary` would show the selection mostly as a tint the eye can miss. `selection.fg` changes the ink colour too, the same two cues the system already uses for a selected option or row (DESIGN.md line 196).

| #   | File, line (head d6659a1)                                                                       | Before                          | After                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9.1 | `packages/design-system/src/tokens/orivilo.css`, after the boundary type block (lines 48 to 54) |                                 | `/* Selected text uses the selection pair, not the browser's highlight, so it reads at 4.5 or more in every profile and mode (ORV-194 row 9). Never the brand accent. */ [data-design-profile] ::selection, [data-design-profile]::selection { background-color: var(--ds-selection-bg); color: var(--ds-selection-fg); }`                                                                                                                              |
| 9.2 | `src/testing/visual-asserts.ts`, new export                                                     |                                 | `cssColorToHex(value: string): string \| null`: converts `rgb(r, g, b)`, or `rgba(r, g, b, 1)`, to `#rrggbb`; returns `null` for any alpha under 1, so a transparent highlight fails the play. `contrastRatio` (`src/foundations/contrast.ts` line 24) takes hex.                                                                                                                                                                                       |
| 9.3 | `src/components/dialog/Dialog.stories.tsx` `Open` play (line 124)                               |                                 | after the existing checks: `const s = getComputedStyle(input, "::selection")`. Assert `cssColorToHex(s.color)` equals the hex of `resolvedColor(input, "--ds-selection-fg")`, and `cssColorToHex(s.backgroundColor)` equals the hex of `--ds-selection-bg`. Assert `contrastRatio` of the two is at least 4.5. It fails at `18763ee` (transparent highlight). `pnpm contrast` holds the other profile and mode cases; the play proves the rule applies. |
| 9.4 | `DESIGN.md` §3, the `selection.fg` row (line 76)                                                | "Text and icon on selection.bg" | add "and selected text (`::selection`, ORV-194 row 9)"                                                                                                                                                                                                                                                                                                                                                                                                  |

### Reaches

Every text selection inside a boundary, in the app and in Storybook, inputs included: the highlight and ink become the profile's selection pair instead of the browser's. No token value, no API. The rule names the selection tokens, never `text.brand` or `action.*`, so a profile that separates the two follows selection.

### Rendered

Contact sheet `/tmp/orv-194-design-1/row-9-contact.png`. Each shot is the field with all its text selected, at 1440 and device scale 3, clipped to the field.

- Before, in dark: the browser's light grey band under near-white ink, in all three profiles.
- After: the band is the profile's selection tint and the name is in the selection ink, readable in all six cases.
- In light: before is the same grey band; after is a pale tint with coloured ink.

- `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-neutral-dark-before.png`, `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-neutral-dark-after.png`, `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-neutral-light-before.png`, `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-neutral-light-after.png`
- `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-professional-dark-before.png`, `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-professional-dark-after.png`, `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-professional-light-before.png`, `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-professional-light-after.png`
- `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-friendly-dark-before.png`, `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-friendly-dark-after.png`, `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-friendly-light-before.png`, `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-friendly-light-after.png`
- Whole dialog: `/tmp/orv-194-design-1/r9/dialog-open-w1440-th-neutral-dark-after-full.png`

### Screens to check in visual QA (row 9)

`application-dialog--open` with the field's text selected: dark at 1440 in neutral, Professional and Friendly, and light once. Look for the selected name in the selection ink on the selection tint.

## Row 10: the first fit keeps every node above the shelf

### What is asked

`Application/Block library` `Default` on a 760 px and a 900 px tall board, 1200 wide. On first render the board fits its graph with no node, port or edge label under the shelf (finding ORV-189-QA1-S1).

### Today (`r10/probe.js`)

`CanvasBoard.tsx` line 1070 passes `fitViewOptions={{ padding: 0.2 }}`. xyflow centres the graph in the whole board and does not see the panels on top of it.

| Board       | Shelf top | Lowest node bottom | Nodes under the shelf |
| ----------- | --------- | ------------------ | --------------------- |
| 1200 by 900 | 640.6     | 661                | 2                     |
| 1200 by 760 | 500.6     | 591                | 3                     |

### Fix

Add one helper inside `CanvasBoard.tsx` that gives every fit the free part of the board. Each side keeps the padding xyflow would use. The bottom side also gets how far the highest bottom overlay reaches up from the board's bottom edge. The overlays are the bottom panels (`.react-flow__panel.bottom`: the controls and the shelf) and the task bar (`.ds-taskbar`). `jumpToNode` already does this for the task bar (lines 539 to 553); this extends it to the panels and to every fit.

```ts
/** Per-side padding for a fit: xyflow's own for `base` on each side, plus, on the bottom, the
 * board height that the bottom panels and the task bar cover, so no node lands under them
 * (ORV-194 row 10). xyflow reads a number padding p as floor((V - V / (1 + p)) / 2) per side. */
const freePadding = (base: number) => {
  const el = wrapper.current;
  if (!el) return base;
  const rect = el.getBoundingClientRect();
  const side = (v: number) => Math.floor((v - v / (1 + base)) / 2);
  const overlays = [...el.querySelectorAll<HTMLElement>(".react-flow__panel.bottom, .ds-taskbar")];
  const cover = Math.max(0, ...overlays.map((o) => rect.bottom - o.getBoundingClientRect().top));
  const y = side(rect.height);
  const x = side(rect.width);
  return { top: `${y}px`, right: `${x}px`, bottom: `${y + Math.ceil(cover)}px`, left: `${x}px` };
};
```

| #    | File, line (head d6659a1)                                                                            | Before                                                                     | After                                                                                                                                                                                                                                                                                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10.1 | `packages/design-system/src/components/canvas-board/CanvasBoard.tsx`, beside `jumpToNode` (line 531) |                                                                            | add `freePadding` as above                                                                                                                                                                                                                                                                                                                                                                      |
| 10.2 | `CanvasBoard.tsx` lines 1069 and 1070                                                                | `fitView={fitView}` and `fitViewOptions={{ padding: 0.2 }}` on `ReactFlow` | remove both. Run the first fit once the nodes are measured: `const measured = useNodesInitialized();` (import it from `@xyflow/react`, lines 8 to 19), a `fitted` ref, and an effect `if (fitView && measured && !fitted.current) { fitted.current = true; void flow.fitView({ padding: freePadding(0.2) }); }`. xyflow keeps nodes hidden until they are measured, so no unfitted frame shows. |
| 10.3 | `CanvasBoard.tsx` line 672 (`board.zoom-to-fit`)                                                     | `padding: 0.2`                                                             | `padding: freePadding(0.2)`, `duration` unchanged                                                                                                                                                                                                                                                                                                                                               |
| 10.4 | `CanvasBoard.tsx` lines 676 to 680 (`board.zoom-to-selection`)                                       | `padding: 0.3`                                                             | `padding: freePadding(0.3)`                                                                                                                                                                                                                                                                                                                                                                     |
| 10.5 | `CanvasBoard.tsx` lines 539 to 553 (`jumpToNode`)                                                    | the `bar`, `side` and `cover` lines, and `padding: bar ? {...} : 0.5`      | `padding: freePadding(0.5)`. `nodes`, `duration` and `maxZoom: 1` stay. The comment says the panels join the task bar on the bottom side. Left and right now come from the board width instead of its height.                                                                                                                                                                                   |
| 10.6 | `CanvasBoard.tsx` line 131 (doc of the `fitView` prop)                                               | "Fit every node into view on mount; on by default."                        | "Fit every node into the part of the board no panel covers, on mount; on by default." The prop's name, type and default do not change.                                                                                                                                                                                                                                                          |
| 10.7 | `BlockLibrary.stories.tsx`                                                                           | `ShelfBoard` sizes only through `fillHeight(height)`                       | `ShelfBoard` takes an optional `fixed` flag that sets `height: ${height}px`. A new story `ShortBoard` renders it 760 px tall. The `Default` and `ShortBoard` plays assert, after `ready`, that every `.react-flow__node` box's `bottom` is at or above the shelf panel's `top`. Both fail at `18763ee` (661 > 640.6, 591 > 500.6).                                                              |

### Measured after (`r10/fit.js`)

`r10/fit.js` runs this exact padding through the board's React Flow store and `panZoom.setViewport`, using the same math as xyflow's `getViewportForBounds`.

| Board                      | Zoom after                                       | Lowest node bottom, shelf top | Gap  |
| -------------------------- | ------------------------------------------------ | ----------------------------- | ---- |
| 1200 by 900                | 0.893 (unchanged; the graph is limited by width) | 564, 640.6                    | 76.7 |
| 1200 by 760                | 0.791                                            | 436.8, 500.6                  | 63.8 |
| 1440 by 900                |                                                  |                               | 75.9 |
| 360 by 800 (`Narrow`)      |                                                  |                               | 67.3 |
| 360 by 640                 |                                                  |                               | 54.3 |
| 1200 by 900, task bar open |                                                  |                               | 75.8 |

No node sits under the shelf in any case.

### Reaches

- Every `CanvasBoard` with `fitView` on. The controls are a bottom panel, so a board without a shelf now also fits above its controls.
  - `application-canvas-board--default` at 1440 by 900: zoom 0.99 to 0.904; lowest node 825 (9 px above the controls at 834) to 759.
  - At 360 by 800: unchanged.
- Plays that read the zoom do not pin the first fit. `CanvasBoard.stories.tsx` (`zoomOf`, line 527) and `TaskBar.stories.tsx` (`viewportScale`, line 39) compare the zoom before and after an action.
- No token, no public API: `fitView` keeps its name, type and default; only its padding becomes aware of the panels.

### Rendered

Contact sheet `/tmp/orv-194-design-1/row-10-contact.png`.

- Before, at 1200 by 900: the second node row's footer, port and edge label run under the shelf. At 760, the lower part of that row is under it. Light and dark.
- After: both rows sit above the shelf with canvas between, slightly smaller at 760.
- At 360, the graph sits above the shelf's band.

- `/tmp/orv-194-design-1/r10/default-1200x900-th-light-before.png`, `/tmp/orv-194-design-1/r10/default-1200x900-th-light-after.png`, `/tmp/orv-194-design-1/r10/default-1200x900-th-dark-before.png`, `/tmp/orv-194-design-1/r10/default-1200x900-th-dark-after.png`
- `/tmp/orv-194-design-1/r10/default-1200x760-th-light-before.png`, `/tmp/orv-194-design-1/r10/default-1200x760-th-light-after.png`, `/tmp/orv-194-design-1/r10/default-1200x760-th-dark-before.png`, `/tmp/orv-194-design-1/r10/default-1200x760-th-dark-after.png`
- `/tmp/orv-194-design-1/r10/default-1440x900-th-light-after.png`, `/tmp/orv-194-design-1/r10/narrow-360x800-th-light-after.png`, `/tmp/orv-194-design-1/r10/narrow-360x640-th-light-after.png`
- Board without a shelf: `/tmp/orv-194-design-1/r10/canvas-board-default-1440x900-th-light-before.png`, `/tmp/orv-194-design-1/r10/canvas-board-default-1440x900-th-light-after.png`, `/tmp/orv-194-design-1/r10/canvas-board-default-360x800-th-light-before.png`, `/tmp/orv-194-design-1/r10/canvas-board-default-360x800-th-light-after.png`

### Screens to check in visual QA (row 10)

- `application-block-library--default` at 1200 by 900 and the new `ShortBoard` at 1200 by 760, light and dark: no node, port or edge label under the shelf.
- `application-canvas-board--default` at 1440: the graph above the controls.

## Contact sheets

- Row 5: `/tmp/orv-194-design-1/row-5-contact.png`
- Row 6: `/tmp/orv-194-design-1/row-6-contact.png`
- Row 7: `/tmp/orv-194-design-1/row-7-contact.png`
- Row 8: `/tmp/orv-194-design-1/row-8-contact.png`
- Row 9: `/tmp/orv-194-design-1/row-9-contact.png`
- Row 10: `/tmp/orv-194-design-1/row-10-contact.png`

## Corrections for the spec

- Row 6: the 1.5 px floor reads as `1.5 - 1 / devicePixelRatio` in the helper, to absorb one device pixel of antialiasing (the same gap reads 1 at scale 1 and 1.5 at scale 4).
- Row 5: the `Narrow` play's status clause now measures 16 px above the shelf, not the controls, when a shelf is present.
- Row 10: the play needs a 760 px story (`ShortBoard`), since `ShelfBoard` fills the viewport.

## Seen, not in these rows

- Dropdown and context menus (`.ds-menu[data-menu]`, `recipes.css` line 2137) use `min-width: max-content`, so a long item can run past a 360 screen as the Select did. `min-width` beats any `max-width`, so row 8 does not reach them. Not measured here: their stories open only inside a play. Follow-up: the same cap using `--radix-dropdown-menu-content-available-width` and `--radix-context-menu-content-available-width`.
- Text selected inside a selected option or row sits on the same `selection.bg` ground, so there only the ink colour shows it. Rare; noted for the owner.
- With rows 5 and 10 built, at 1200 by 760 the status line stands 16 px above the shelf, over the free band that row 10 leaves under the graph (63.8 px). It covers no control.

## Lane

Lane: L, row 6. Route A changes the line height values of `type.label.md` and `type.heading.sm`, which are semantic tokens. Rows 5, 7, 8, 9 and 10 change no token value and no public API. If the owner picks route B for row 6, every row is S.
