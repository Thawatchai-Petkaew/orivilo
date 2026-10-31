# ORV-189: design notes

Design decisions for ORV-189, the owner's two Storybook canvas decisions (Jira ORV-189): (1) every board and panel story fills the viewport height and is never shorter than its height today; (2) small components are centred in the canvas, while Matrix grids (Recipes and modes) and other wide stories keep the full width. Each row is a numbered change the builder makes as written; the designer proved it rendered before any builder envelope (L-0017). Storybook preview and story files only: no component, recipe, token or public API changes.

## What is wrong today

Measured in Storybook dev from this worktree (`641283a`, port 6231), neutral profile, after the play ran. Values in CSS px, `[left, top, right, bottom]`.

- **Boards end at a fixed height.** Block library `Default` renders its board 640 px tall (`BlockLibrary.stories.tsx` lines 13 and 18). In the Storybook UI at 1440 x 1300 the canvas is 1440 x 1260, so the lower 620 px are bare surface (the owner's screenshot), and the second row of nodes sits behind the shelf. Every board helper does the same (section "Where heights are set"), and so do the two panels, Canvas chat (`h-[560px]`) and Inspector (`h-[520px]`).
- **Small components sit in the top start corner.** Button `Variants` at 1440 x 800: the row at `[32, 32, 1408, 72]` in a 760 px canvas, 688 px of bare surface under it.
- **A padded story scrolls and shows a white frame in dark mode.** Storybook pads the body of a `padded` story by 1rem outside the mode surface (Storybook 10.6.3 iframe CSS, rule `.sb-show-main.sb-main-padded`), and the surface is `min-h-dvh` inside it. The document is 32 px taller than the canvas (Button `Variants`, 1440 x 800 UI: `scrollHeight` 792 for a 760 canvas) and a 16 px band of the manager's white shows round the dark surface (`button-ui800-dark-en-before.png`). Storybook's own `centered` layout has the same box, worse: the body becomes a flex row and `#storybook-root` takes `margin: auto` and a 1rem padding, so the surface would shrink to its content with white on every side. So the decorator owns padding and centring, and Storybook's box gives way (row 1).

## Rows

<!-- prettier-ignore -->
| # | Target | Change | Source | Play that proves it |
| --- | --- | --- | --- | --- |
| 1 | `packages/design-system/.storybook/preview.css` (new), imported by `preview.tsx` after `../src/tokens/orivilo.css` (line 6) | Two rules. `body.sb-show-main.sb-main-padded, body.sb-show-main.sb-main-centered` get `margin: 0; padding: 0; display: block; min-height: 0`. `body.sb-show-main.sb-main-centered #storybook-root` gets `margin: 0; padding: 0`. Storybook-only CSS; the surface keeps its own `p-4` | Decision 1 (a filled story must not scroll) and decision 2 (`centered` must not shrink the surface); the white band in dark mode | None in the test project (portable stories set no `sb-main-*` class). Visual QA, Storybook UI: the surface starts at `[0, 0]` and `scrollHeight` equals the canvas height for Button `Variants` and Canvas chat `Idle` |
| 2 | `.storybook/preview.tsx`, `withDesignProfile` (lines 25 to 37), the surface `div` (lines 30 to 36) | The surface sets the story-only custom property `--story-fill` by the resolved `layout`: `fullscreen` `100dvh`, `padded` `calc(100dvh - 2rem)`, `centered` `0px`, as an inline `style` (typed `CSSProperties`), not a Tailwind arbitrary class. `centered` also adds `flex flex-col items-center justify-center p-4` to the surface classes. The `padded` and `fullscreen` classes stay as they are | Decisions 1 and 2 | Row 6 plays |
| 3 | `src/components/matrix.tsx`, `Matrix` cell `section` (line 34) | Adds `style={{ "--story-fill": "0px" }}`, so a board or panel inside a Matrix cell keeps its height today and six cells never take six viewports | Decision 2 (a Matrix keeps its look and full width) | Block library `RecipesAndModes` (line 205): add to its play that each of the six `.ds-board` is 520 px tall |
| 4 | `src/components/matrix.tsx`, a new story helper after `Narrow` (line 51) | `export function fillHeight(px: number): string` returning the CSS value max(*px*px, var(--story-fill, 0px)). Every wrapper of section "Where heights are set" takes `style={{ height: fillHeight(n) }}` in place of `style={{ height: n }}` or the class `h-[npx]`. A helper with a `height` prop also takes `fill?: boolean` (default `true`); `fill={false}` keeps the plain `height`. Not named `fill`: `CanvasChat.stories.tsx` already has a `fill` for message templates | Decision 1: fill the viewport, never shorter than today | Row 6 plays |
| 5 | The files of section "Centred files", `meta.parameters.layout` | `"padded"` becomes `"centered"`. Each story of such a file that renders a `Matrix` gets `parameters: { layout: "padded" }` | Decision 2 | Row 6 plays |
| 6 | Proving plays, in the test project (viewport 1200 x 900, `@storybook/addon-vitest` 10.6.3) | Block library `Default` (line 74, play line 76): the `.ds-board` height equals `Math.max(640, innerHeight)`. Canvas chat `Idle` (line 204): the `.ds-chat` height equals `Math.max(560, innerHeight - 32)`. Inspector `Selected` (line 174): the `Panel` wrapper (the parent of `.ds-inspector`) is `Math.max(520, innerHeight - 32)` tall. Button `Variants` (line 27, a new play): the story root's centre equals the surface's centre within 1 px on both axes. Button `RecipesAndModes` (line 361, a new play): the Matrix grid is as wide as the surface less 32 (its own `p-4` inside the surface `p-4`) | Decisions 1 and 2 | Themselves; each fails on `641283a` (the builder records the red run) |
| 7 | The stories of section "Exempt" | `fill={false}`, or the plain height kept, with a one-line doc comment that names why | These stories prove a bound on the height itself | Their plays, unchanged |
| 8 | The play of section "Plays that move" | Reads its expected value from the measured board instead of the constant tied to today's height | Decision 1 changes the board height in the test viewport | Itself |

All values of row 2 are the frame a story may fill: `100dvh` less the `p-4` of a padded surface on both edges. In the test viewport (1200 x 900) that is 900 for a fullscreen story and 868 for a padded one; in the Storybook UI at 1440 x 1300 (canvas 1260) it is 1260 and 1228.

## Where heights are set

Every fixed height in a story file or story helper, and what happens to it. "Fills" means row 4 applies; outside a Matrix the height becomes max(today, frame), inside a Matrix cell it stays today's (row 3).

<!-- prettier-ignore -->
| File and line | Today | Used by | Change |
| --- | --- | --- | --- |
| `src/components/canvas-board/story-shell.tsx` line 19 (`height = 520`) and line 48 (`style={{ height }}`) | 520 default | `Stateful` and `MatrixBoard`: Canvas board (19 stories, line 396 passes 420), Canvas controls, Command menu, Mini map, Node group, Node toolbar, Shortcut sheet, Task bar (lines 438, 490, 523) | Fills; `fill` prop added to `StatefulProps` (line 7). Matrix uses (Canvas board line 379, Canvas context menu line 218, Canvas controls line 116, Command menu line 143, Mini map line 96, Node group line 136, Node toolbar line 123, Shortcut sheet line 77) keep 300 to 360 through row 3 |
| `src/components/block-library/BlockLibrary.stories.tsx` lines 13 and 18 (`ShelfBoard`) | 640 | Six stories; line 208 passes 520 inside a Matrix | Fills; 520 kept in the Matrix |
| `src/components/canvas-node/CanvasNode.stories.tsx` lines 36 and 47 (`NodeBoard`) | 300 default | Lines 89 (360), 120, 167, 477, 496, 524, 556, 589 (320), 303 (380), 456 (420); lines 442 (240) and 625 (`HEIGHT`) are inside a Matrix | Fills; Matrix ones kept |
| `src/components/canvas-edge/CanvasEdge.stories.tsx` lines 61 and 68 (`EdgeBoard`) | 420 default | Lines 142 (900), 187 (300), 209 (240), 234 (340); line 275 (300) inside a Matrix | Fills; `InteractionStates` stays 900 wherever the frame is shorter (ORV-84 row 1 holds) |
| `src/components/node-port/NodePort.stories.tsx` lines 72 and 79 (`PortBoard`) | 360 default | Lines 108, 138 (300), 157 (300); line 241 (300) inside a Matrix. Line 179 is a static lineup with `height: "auto"`, untouched | Fills; Matrix kept |
| `src/components/canvas-context-menu/CanvasContextMenu.stories.tsx` line 181 | 520 (own `div`) | `MentionItemNoShell` | Fills |
| `src/components/canvas-chat/CanvasChat.stories.tsx` line 67 (`Frame`, class `h-[560px]`) | 560 | The panel stories (`Idle` and the other sidebar stories); inside a Matrix in `RecipesAndModes` (line 1108); six side by side in `StartersAtWidths` (line 1068) | Fills (a panel); `h-[560px]` leaves the class list, `style={{ height: fillHeight(560) }}` comes in; `Frame` takes `fill` too; `StartersAtWidths` exempt |
| `src/components/canvas-chat/CanvasChat.stories.tsx` lines 1146 and 1187 (`BoardChat`) | 560 default | `OnBoard`, `Unlinked`, `Mentions` and the `MentionGone*` stories; the floating chat (line 1249, `h-[calc(100%-24px)]`) follows the board | Fills; line 1800 exempt |
| `src/components/inspector/Inspector.stories.tsx` line 60 (`Panel`, class `h-[520px]`) | 520 | `NoSelection`, `Several`, `Selected`, `Empty`, `Sources`, `PlainNode`, `MoodNotRead`; inside a Matrix in `RecipesAndModes` (line 355) | Fills (a panel) |
| `src/components/inspector/Inspector.stories.tsx` line 87 (`Studio`, class `h-[640px]`) | 640 | `AnswerInPanel`, `StudioLayout` (fullscreen, line 253), `Suggestions` | Fills |
| `src/components/missing-inputs-prompt/MissingInputsPrompt.stories.tsx` line 39 (`PromptBoard`) | 320 | Board beside the prompt in a two-column grid | Exempt |
| `src/components/dialog/Dialog.stories.tsx` line 254 (`Frame`, `h-[560px] w-[360px]`) | 560 | `LongContentAt360`, a phone-sized frame for the dialog | Exempt (not a board or a panel) |

## Exempt

Five stories keep their height; each proves a bound on the height itself, shows several frames at once, or has the board as context beside the subject. The sweep (section "Plays that move") checked the page height of every story: outside the Matrix stories, `StartersAtWidths` is the only one that the change makes taller than the viewport (1200 to 1784 at 1200 x 900), and it is on this list.

- `CanvasChat.stories.tsx` line 1800, `MentionsSmallest`: "the smallest chat the layout allows, 380 px tall". `fill={false}`.
- `CanvasChat.stories.tsx` line 1068, `StartersAtWidths`: six chats in a wrapping row (240, 320 and 480 px, Thai and English); filled, each would stand 868 px tall in two rows. `<Frame size={size} fill={false}>` (line 1076).
- `TaskBar.stories.tsx` line 490, `OnShortBoard`: "the jump on a 420 px board". `fill={false}`.
- `MissingInputsPrompt.stories.tsx` line 39, `PromptBoard`: the prompt is the subject and the board sits beside it; filled, the board would stand 868 px tall beside a short prompt, and at 360 px (one column) it would push the prompt below the first view. Plain 320 kept.
- `Dialog.stories.tsx` line 254: a 360 x 560 phone frame, not a board or a panel. Plain class kept.

## Centred files

Decision 2 says small components. The test for "small": centred, the story's `ds-*` elements keep the width they have today. A field component (`w-full` inside a `max-w-md` column) fails it: centred, the column shrinks to the field's intrinsic width (Input 448 to 205, Select 448 to 95, Table to 2), which is not how a host uses it. Measured on every story of each file at 1200 x 900, Thai, light (sweep, section "Method").

<!-- prettier-ignore -->
| File | `layout` line | Matrix stories that take `parameters: { layout: "padded" }` | Width change when centred |
| --- | --- | --- | --- |
| `badge/Badge.stories.tsx` | 23 | `RecipesAndModes` line 182 | none |
| `button/Button.stories.tsx` | 21 | `RecipesAndModes` line 361 | none (1 px on the spinner of `Loading`) |
| `checkbox/Checkbox.stories.tsx` | 11 | `RecipesAndModes` line 162 | the label row shrinks to its text; the box, the label and the focus ring look the same (`checkbox-iframe1440-light-th-after.png`) |
| `kbd/Kbd.stories.tsx` | 12 | `RecipesAndModes` line 84 | none |
| `tag/Tag.stories.tsx` | 12 | `RecipesAndModes` line 123 | none |
| `tooltip/Tooltip.stories.tsx` | 35 | `RecipesAndModes` line 105 | none |
| `popover/Popover.stories.tsx` | 15 | `RecipesAndModes` line 127 | none |
| `toggle-group/ToggleGroup.stories.tsx` | 53 | `RecipesAndModes` line 156 | none |
| `context-menu/ContextMenu.stories.tsx` | 65 | `RecipesAndModes` line 124 | none |
| `dropdown-menu/DropdownMenu.stories.tsx` | 78 | `RecipesAndModes` line 172, `CheckableRecipesAndModes` line 314 | none |
| `toast/Toast.stories.tsx` | 42 | `RecipesAndModes` line 285 | none |
| `scroll-area/ScrollArea.stories.tsx` | 18 | `RecipesAndModes` line 64 | none (fixed 384 px box) |
| `logo/Logo.stories.tsx` (branch `feature/ORV-118-logo`, not on `develop`) | 14 | `OneColour` line 231, `RecipesAndModes` line 306 | not measured here; `Kinds` is a `flex flex-wrap` row of fixed-height SVGs like Badge `Variants`. Whichever of ORV-118 and ORV-189 merges second makes this change |

Stay `padded`, top start, full width (field-width or wide): Input, Input group, Password input, Textarea, Select, Field, Slider, Range slider, Progress, Tabs, Table, Card. Stay as they are: the panel files of section "Where heights are set" (Canvas chat, Inspector, Task bar, Missing inputs prompt are `padded` and fill), Direction studio, Dialog, Sheet, Resizable, the Examples (they render through `Under`, already `min-h-dvh`) and the Foundations pages.

## Plays that move

Method: every one of the 418 component stories ran twice in the Storybook iframe at 1200 x 900 (the test viewport), Thai, light: once as today, once with rows 1 to 5 injected as CSS (centred class for the centred files, `/tmp/orv-189-design/scripts/after.css`). A play failure is the `playFunctionThrewException` event. Script: `/tmp/orv-189-design/scripts/sweep.mjs`; results: `/tmp/orv-189-design/sweep1.log`, `sweep2.log`, `sweep2.json`, `sweep3.json`.

One play fails under the change:

- `CanvasChat.stories.tsx` line 1284, `OnBoard`: `near(floating.height, 536)`, today's 560 board less 12 px at the top and the bottom. Measured 844 at 900. Change: `near(floating.height, box(boardEl(canvasElement)).height - 24)`, and the comment on line 1280 drops "(536)". The rest of that play (lines 1286 to 1346) reads positions relative to the board, the brief node and the chat; it did not run past line 1284 in the sweep, so the builder runs it to the end.

Two more failed only because the sweep centred a whole file: DropdownMenu `RecipesAndModes` and `CheckableRecipesAndModes` (their menu bottom bound, lines 172 and 314). With row 5 they stay `padded`, and both pass so (`sweep3.json`).

Plays that read a position or a size in a story that fills or centres, and that passed under the change (they measure relative to the board, the node or the viewport, so the builder keeps them and the test project confirms):

<!-- prettier-ignore -->
| File | Story and lines |
| --- | --- |
| `block-library/BlockLibrary.stories.tsx` | `PlaceByDrag` 152, 153, 163, 164 |
| `canvas-board/CanvasBoard.stories.tsx` | `Present` 145; `BoxSelecting` 289; `LongContentAt360` 404, 405; `AddNote` 521, 527; `Viewport` 538, 541, 544, 548 |
| `canvas-chat/CanvasChat.stories.tsx` | `Idle` 209 to 264; `Streaming` 471 to 481; `Replied` 553 to 565; `RepliedLines` 593; `Conversation` 821 to 845; `BasisMismatch` 897 to 927; `NarrowestPanel` 971, 976, 978; `WidestPanel` 999, 1000; `English` 1031, 1040, 1041; `Unlinked` 1384 to 1397; `Mentions` 1437 to 1521; `MentionGone` 1651; `MentionsEnglish` 1786 to 1788 |
| `canvas-controls/CanvasControls.stories.tsx` | `Default` 56, 57, 59; `Present` 107 |
| `canvas-edge/CanvasEdge.stories.tsx` | `InteractionStates` 170, 171 (ring above the controls bar, ORV-84 row 1); `Flowing` 250, 251, 255 |
| `canvas-node/CanvasNode.stories.tsx` | `Sizes` 192; `Dragging` 252; `LongContentAt360` 463, 464 |
| `command-menu/CommandMenu.stories.tsx` | `Search` 75; `RunCommand` 93; `Present` 133; `English` 174, 175 |
| `node-group/NodeGroup.stories.tsx` | `Grouped` 41, 42 |
| `node-toolbar/NodeToolbar.stories.tsx` | `Visible` 53, 54 |
| `task-bar/TaskBar.stories.tsx` | `OnBoard` 463 to 479 (`OnShortBoard` 503 to 512 is exempt) |
| `checkbox/Checkbox.stories.tsx` | box centre against the line centre, 73 and 87 (relative) |
| `button/Button.stories.tsx` | link height against the secondary button, 314 and 315 (relative) |
| `toggle-group/ToggleGroup.stories.tsx` | small against medium height, 124 (relative) |

Limits of the sweep: it ran in the dev iframe, not in Vitest's portable stories, and in one locale and mode. The Vitest run has no Storybook body padding today, which the injected row 1 also removes, so the two match on geometry. The builder runs the whole storybook test project, as a preview file changes (`.claude/rules/testing.md`).

## Measured, with the change injected

Method: Storybook dev from this worktree at `641283a` on port 6231. Before: as built. After: rows 1 to 5 injected as CSS (`after.css`), in the Storybook UI with the story remounted (`forceRemount`) so fitView and the play run on the new height, and in the bare iframe through an init script. Storybook UI with the sidebar and the addon panel hidden (`nav=false&panel=false`): the canvas is the window less the 40 px toolbar. Script: `/tmp/orv-189-design/scripts/shots.mjs`.

<!-- prettier-ignore -->
| Story | Frame | Before | After |
| --- | --- | --- | --- |
| Block library `Default` | UI 1440 x 1300 (canvas 1260) | board `[0, 0, 1440, 640]`, 620 px bare below; second node row under the shelf | board `[0, 0, 1440, 1260]`; all six nodes above the shelf, shelf and controls at the foot |
| Block library `Default` | UI 1440 x 800 (canvas 760) | board 640, 120 px bare | board 760; the second node row still runs under the shelf (see "Seen, not in scope") |
| Block library `Default` | iframe 360 x 800 | board 640, 160 px bare | board 800, the shelf and the two-row controls at the foot |
| Canvas chat `Idle` | UI 1440 x 1300 | chat `[32, 32, 352, 592]`, white 16 px band, `scrollHeight` 1292 | chat `[16, 16, 336, 1244]`, `scrollHeight` 1260 |
| Canvas chat `Idle` | UI 1440 x 800 | chat 560 tall, `scrollHeight` 792 | chat `[16, 16, 336, 744]`, no scroll |
| Canvas chat `Idle` | iframe 360 x 800 | chat `[32, 32, 328, 592]` | chat `[16, 16, 336, 784]` |
| Canvas chat `OnBoard` | UI 1440 x 1300 | board 560 tall, the graph cut at the top | board `[16, 16, 1424, 1244]`, chat `[1092, 28, 1412, 1232]`, whole graph in view |
| Inspector `Selected` | UI 1440 x 1300 / 800 | panel `[33, 33, 415, 551]` | panel to 1243 / 743 |
| Inspector `StudioLayout` | UI 1440 x 1300 | board and panel 640 | board and panel 1260 |
| Button `Variants` | UI 1440 x 1300 / 800 | row `[32, 32, 1408, 72]` | row `[245, 610, 1195, 650]` / `[245, 360, 1195, 400]`, centre 720 and 630 / 380 |
| Button `Variants` | iframe 360 x 800 | rows from `[32, 32]` | block `[16, 276, 344, 524]`, centre 400; wrapped rows share one start edge |
| Badge `Variants` | UI 1440 x 1300 | row at `[32, 32]` | row `[470, 618, 970, 642]`, centre 720 and 630 |
| Badge `Variants` | iframe 360 x 800 | two rows at top start | two rows `[16, 372, 344, 428]`, one start edge |
| Button `RecipesAndModes` | UI 1440 x 1300 | grid `[32, 32, 1408, 629]`, white band | grid `[16, 16, 1424, 613]`, two columns, full width |
| Button `RecipesAndModes` | iframe 360 x 800 | one column `[32, 32, 328, 2169]` | one column `[16, 16, 344, 2153]` |

What the screenshots show:

- Block library, light and dark, Thai and English: after, the board meets the bottom edge of the canvas; the dot grid runs to the edge; the shelf, its tiles (บรีฟ, ถามอีก 1 ข้อ, ยังไม่วาง) and the controls sit at the foot with their Thai marks whole. Nothing bare below.
- Canvas chat `Idle`: after, the card runs from 16 px under the toolbar to 16 px above the bottom on the surface colour; the empty line and the composer at its foot; ยังไม่มีข้อความ and คำตอบมาจากกฎที่เขียนไว้ whole. In dark the white band is gone.
- Inspector `Selected`: the panel's border runs the full height; the tabs สรุป, ข้อมูลที่ขาด, ที่มา whole.
- Button and Badge: the row sits in the middle of the canvas in both modes; at 360 px the wrapped rows keep one start edge inside a centred block, and the long Thai labels (บันทึกการเปลี่ยนแปลง) whole. The focus ring of Checkbox `InteractionStates` sits whole in the centred column.
- Button `RecipesAndModes`: unchanged but for the white band, the six cells in two columns at 1440 and one at 360.

Screenshots: `/tmp/orv-189-design/shots/<story>-<frame>-<mode>-<locale>-<before|after>.png` for `blocklib`, `chat`, `chatboard`, `insp`, `inspstudio`, `button`, `badge`, `button360`, `buttonmatrix` (frames `ui1300`, `ui800`, `w360`; English before and after, Thai after), plus `checkbox-iframe1440-*.png`. Contact sheets: `/tmp/orv-189-design/shots/sheet-<story>-ui1300_ui800.png` and `sheet-<story>-w360.png`.

Not rendered: Logo `Kinds`. The Logo story is on `feature/ORV-118-logo`, not in this worktree, and this task starts Storybook from this worktree only.

## Seen, not in scope

- At a 760 px canvas the Block library board fits its graph to the whole board, so the second node row still runs under the shelf; the fit leaves room for a task bar (`CanvasBoard.tsx` line 540) but not for the shelf. A component change (fit padding for the shelf), a follow-up, not a story change.
- Inspector `StudioLayout` at 360 px gives the board 40 px beside a 320 px Resizable panel (`[0, 0, 40, 800]`), today and after. The component's doc says a Sheet on narrow screens; the story uses the Resizable at every width. A follow-up for the story.
- Canvas chat `OnBoard` at 360 px, today: the 320 px floating chat starts at x -4, outside a 296 px board. After row 1 the board is 328 and the chat starts at 12.

## Screens to check in visual QA

In the Storybook UI at 1440 x 1300 and 1440 x 800 (sidebar and panel hidden) and in the iframe at 360 x 800, light and dark, Thai and English, neutral profile:

- `application-block-library--default`, `application-inspector--studio-layout`, `application-canvas-chat--on-board`: the board meets the bottom edge; no bare band; no scroll.
- `application-canvas-chat--idle`, `application-inspector--selected`: the panel runs from 16 px under the top to 16 px above the bottom; no white band in dark.
- `base-button--variants`, `base-badge--variants`, `base-checkbox--interaction-states`, and when ORV-118 is merged `base-logo--kinds`: the content block in the middle of the canvas; wrapped rows share one start edge; the focus ring and Thai marks whole.
- `base-button--recipes-and-modes`: two columns at 1440, one at 360, full width, surface from `[0, 0]`.
- `application-canvas-chat--mentions-smallest`, `application-task-bar--on-short-board`, `application-canvas-chat--starters-at-widths`: still 380, 420 and 560 px tall (exempt).
