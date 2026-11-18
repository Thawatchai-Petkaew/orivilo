---
issue: ORV-274 (https://tpetkaew.atlassian.net/browse/ORV-274)
lane: L (component public API and the token contract change in PR 211)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 2.5
---

# ORV-274: ORIVILO from brief to product, a live prototype on one canvas (Storybook)

## Goal

The owner, on the clickable design mock (comment 10651): "อ้าว แล้วไม่ได้ทำเป็น Prototype จริง ๆ ขึ้นมาหรอ?" and "อันนี้มันคือรูปนี่ แต่รูปเก็บไว้นะ แต่ไม่เข้าใจเหมือนกันว่า เราไม่ได้ใช้ Component แล้วก็สร้างออกมาหรอ?"

So the prototype is a real page in Storybook, built from the live catalog components, read left to right on one canvas: brief, direction board, logo, colour, brand in use, brandbook, design system, product (comments 10645, 10646). Each result is its own part and opens a page by page preview. The product stage shows base components, then composed components, then three live pages, Landing first. The page opens in English with Thai complete (comment 10644). The bar is "excellent UI, no UI slop and no AI slop" (comment 10637).

The structure is design revision 4 (`docs/specs/ORV-274/design.md`), with gaps 14 to 19 accepted and gap 13 withdrawn (comment 10649); revision 5 keeps it. The look of the two boards and the 12 brandbook pages, and the image list, are revision 5, accepted with gaps 20 to 23 (comment 10652); revision 5.1 adds the made images and the measured scene corners. The contract is decided in `docs/specs/ORV-274/tech.md` (default 11). It ships in two pull requests: PR 211 changes the shared canvas components, and the Storybook tab icon and the violet dot of the brand SVGs ship with them; PR 212 adds the prototype page.

**What is real and what is simulated.** Real: the catalog components, the `orivilo` profile, `Logo`, `Landing` and `BrandReportScreen`, all rendered live. Copied by hand: ORIVILO's brand data, from its brand documents, with a source per node. Simulated: the flow itself. No engine function runs, and nothing is interpreted, generated or exported on this page. Generated outside the repo: the photographs and blank scenes, made with Codex from prompts recorded in the repo, and the mark on cloth in `brand-hero`, generated from the real mark as a reference. No code in this story calls a model.

## Rules

### live-only-1

Everything the canvas or a preview shows as a component or as a page is the live catalog component rendered in the story: `CanvasBoard`, `CanvasNode`, `NodePort`, `CanvasEdge`, `NodeGroup`, `CanvasControls`, `Dialog`, `Button`, `Badge`, `Field`, `Input`, `RadioGroup`, `Alert`, `Card`, `PageHeader`, `SectionHeader`, `ScrollArea`, `Logo`, `DesignProfileBoundary`, `BrandReportScreen`, `Landing`, and the rest the design's "Components per part" section names. No image file stands in for a component, a story or a page. Image files are only the photographs and scenes of `images-1`; floods, art type and the giant mark are drawn live. The mark and the lockup are the `Logo` component, or SVG drawn from its geometry with the `ds-logo` recipe classes; the one exception is the mark on cloth in `brand-hero` (`images-1`). The product stage nodes are `p-base`, `p-pat`, `p-landing`, `p-form` and `p-report`. The product preview pages are the three pages of the "Product pages" sequence.

### structure-1

The board holds 31 nodes, 40 edges (29 input, 8 reference, 3 derived) and nine chapter stops (Overview plus the eight chapters 00 to 07). A result node is a node whose data has `open`. There are 12 of them. They open seven preview sequences with 6, 3, 2, 6, 8, 12 and 3 pages, in the order the design's "The whole structure" section gives. The direction board has 5 pieces and the brand in use board 7; both boards and the 12 brandbook pages are designed at 1280 by 800 and scaled as one image. Ids, positions, ports and edges are in the design's "The whole structure", "Layout numbers", "Nodes and their data" and "Edges" sections. W1 to W4 work the numbers.

### copy-1

Every UI string comes from the locale catalog, Thai and English together. Page strings go under `orvCanvas` (`packages/design-system/src/i18n/messages/en.ts`, `th.ts`), and shared component strings go under their component's group. The keys and words are in the design's "Copy" section. English is the default locale of the page and its stories. Quotes, the brand's own lines, hex values, version keys, image ids and component names are data and render as written. No middot and no em dash.

### honest-1

Each board and each preview page carries its label once, as the design's "Honest labels" section gives it: mockup, AI image, drawn, sample data, or not tested yet. A board says it on its node card's meta line and on its preview's caption line, never under each tile; the art carries no caption. Every picture with a real thing laid on it says Mockup, and every generated photograph sits under an AI label. No text says that ORIVILO interpreted, generated, screened, tested or exported anything. No trust badge, rating, score or success state appears without backing data.

### images-1

The page uses seven images and no other: kept `brand-hero`, `direction-team` and `colour-reference`; new `direction-making`, `direction-place`, `scene-card` and `scene-sign`. Each is a static file at `packages/design-system/.storybook/static/orv-274/<id>.webp`, at most 400 KB, longest side at most 1600 px. Each has a record in `orivilo-canvas.data.ts`, the one home of its prompt, word for word the text that was sent to Codex: the `v1.prompt.md` the image was made from (the text fence body where the file has one), not the design's brief. The record also holds `treatment` (`violet`, `paper` or `photo`, as that section gives it), `generatedWith`, `generatedOn`, `termsUrl`, and a check: `subject`, `noText` and `noMarks` all pass, a `licence` note, `checkedBy` and `checkedOn`. The one exception to `noMarks` is `brand-hero`: its mark on cloth is generated from the real mark as a reference image, its record names that reference, and its check passes only when exactly one mark shows and it matches the reference. No other prompt asks for a logo. A scene record holds `quad`, the four corners of its blank surface in percent of the image, as measured on the made image in the design's "Nodes and their data" section (04 Brand in use, revision 5.1), convex and inside the image. An image that fails a check is not committed. An `img` carries `width`, `height` and `alt` from `orvCanvas.image.alt.<id>`. Until a file exists, its slot shows the missing state of the design's "States" section and no `img`.

### shared-change-1

Every shared component that PR 211 changes keeps its story and its catalog entry updated in the same PR. Each new state has Thai and English stories, light and dark, and the `RecipesAndModes` matrix covers the present look under its three profiles. Every existing story that renders the changed components still passes its play: the stories in the folders `canvas-board`, `canvas-node`, `node-port`, `canvas-edge`, `canvas-controls`, `node-group`, `mini-map`, `node-toolbar`, `canvas-context-menu`, `command-menu`, `shortcut-sheet`, `task-bar`, `canvas-chat`, `inspector`, `block-library`, `missing-inputs-prompt`, `dialog`, `confirm-dialog`, `combobox` and `button`, the story `foundations/canvas.stories.tsx`, and the examples `workspace`, `members` and `decision-log`. No new shared component.

## Acceptance criteria

Page files (PR 212), all in `packages/design-system/src/examples/`: `orivilo-canvas.tsx`, `orivilo-canvas.data.ts`, `orivilo-canvas.test.ts`, and `orivilo-canvas.stories.tsx` with the title `Examples/Prototype: ORIVILO canvas`. The stories are the ones the design's "For the builder" section lists.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | A present board, one node of each kind (knowledge, direction, artifact, reference) | Rendering at zoom 1, light and dark | The node title as a label above the card, with its kind glyph; one surface with one hairline at the node radius; no header band, no frame inside, no footer source line, no port row of words (design, "The node") | Card border is 1 px `border.subtle`. No header, frame or footer element inside a present node. The label's bottom is at or above the card's top. Edit boards keep the banded node | CanvasNode `Present*` stories, play |
| 2 | Node data `pad: "media"`, then `pad: "text"` or no `pad` | Rendering | Media sit concentric in the card. Text keeps its inset | Media padding resolves to the new component token `node.padding-media` (`space.inset-sm`); text padding to `--cmp-node-padding`. Media radius is the node radius less that padding. `generated.css` is regenerated | CanvasNode `Present*` play; tokens test |
| 3 | A present board | Rest, then hover, then selection of a node | Ports are glyph dots on the card edge, inputs at the start and outputs at the end. Their names and the source line show only on hover, selection or keyboard focus | Port and source pills (`NodeContent.source`) are hidden at rest and shown on hover, on selection and on keyboard focus. Each port keeps its catalog accessible name | NodePort `PresentNames` play |
| 4 | A present node | Hover; select; keyboard focus; focus plus selection | Hover: `--cmp-node-border-hover`. Selected: border plus a 1 px inner outline in `canvas.selection`. Focus: the focus line and halo outside, never the selection look | Computed outline and box-shadow differ between the selected and focused states | CanvasNode `Present*` play (pseudo-states) |
| 5 | Node data `open: { count: 3 }` titled "Logo" / "โลโก้" | Rendering | The label ends with "3 pages" / "3 หน้า" and the new `OpenIcon`. A zoom-in cursor | `aria-haspopup="dialog"`. Accessible name "Logo, 3 pages" / "โลโก้ 3 หน้า", from the canvas message group. `OpenIcon` is exported from `icons.tsx` and is `aria-hidden` | CanvasBoard `OpenNode` play |
| 6 | A `CanvasBoard` with `onNodeOpen` | Click on a result in present (double click in edit); Enter; Space; click on a node without `open` | Nothing moves on the board | `onNodeOpen` is called once with the node id for each open gesture by pointer and by keyboard, and never for a node without `open` | CanvasBoard `OpenNode` play |
| 7 | A present board, then an edit board | Rendering at zoom 0.5 and 1 | Present: a calm `surface.canvas` ground with a `border.subtle` edge and sparse `border.subtle` dots. Edit: unchanged | Present dot pitch on screen is 24 px (`space.grid-gap`, no new token) at both zooms. Edit keeps `surface.board` and `canvas.grid` | CanvasBoard `Present` play |
| 8 | A present board with `data-lod` set to far, mid, then near (a story child writes it) | Rendering | Far: no node labels and no edge label pills. Mid: labels without the page count word, the open glyph stays. Near: everything | The recipe rules under the present board hide what each level drops (design, "Reading distances and levels of detail") | CanvasBoard `LevelsOfDetail` play |
| 9 | A present board, then an edit board | Zoom 0.25, 1 and 2 | Edges stay as thin on screen at every zoom on every board, and their dashes keep their length | `CanvasBoard` writes the private property `--_zi` (1 / zoom) on its root. On every board, stroke width times zoom and each dash length times zoom are equal at the three zooms: present 1.5 px (`edge.width-present`), derived 2.5; edit 2 px (`edge.width`), derived 3. The dash tokens are the on and off lengths `edge.dash.reference-on`, `edge.dash.reference-off`, `edge.dash.derived-on` and `edge.dash.derived-off` | CanvasEdge `KindsAndZoom` play |
| 10 | A present board with one edge per port kind | Rendering, light and dark, three profiles | Each edge takes its source port kind's hue: text `edge.stroke`, image `port.image`, palette `port.palette`, type `port.type`, profile `port.profile`. The port glyph shape sits at both ends | New contrast pairs, those five tokens on `surface.canvas` at the UI floor 3.0, pass under every set in `CONTRAST_SETS`, both modes. Stale, invalid and selected strokes still win. Edit boards stay gray | CanvasEdge `KindsAndZoom` play; `pnpm contrast` |
| 11 | A present board; an edge with `label: false` | Select a node; render the edge | The node's edges go to `edge.width-present-selected`, and every other edge drops to `opacity.disabled`. The hidden label shows no pill; a stale or invalid edge still shows its pill | Chain edges carry `data-chain`, and the board carries `data-has-selection`. The edge keeps its accessible name from `graph.edgeLabel` | CanvasEdge `ChainHighlight` and `LabelHidden` plays |
| 12 | `CanvasControls` with `position="center"` (the default is `start`) and children (a chapter strip of ghost Buttons) on a read-only board | Rendering at 1440 and at 360, Thai and English | One bar at the bottom centre: the read-only word "View only" / "ดูอย่างเดียว" from the board's catalog key `board.readOnly` first, a divider, the children, a divider, then only the four viewport commands: zoom out, the percent, zoom in and fit. The board's corner badge hides. At 360 the bar spans the board less `space.inset-sm`, the children scroll, the read-only word is visually hidden but still read, and only fit stays of the zoom | The bar's centre x is within 1 px of the board's. A ghost Button with `aria-current="true"` takes `selection.bg` and `selection.fg`, with its pair in `pairs.ts`. With no props, every existing story renders as before | CanvasControls `WithChapters` play; Button `GhostCurrent` story; recipes test |
| 13 | `DialogContent size="viewer"` with a long page | Open; Escape; at 360 | The window less one `space.gutter` on each side, padding `space.inset-md`, and a body that fills the height. Close "Close" / "ปิด" | Focus trap, Escape and focus return work as for `sm` and `md`, which are unchanged. `InsideProfile` still holds | Dialog `Viewer` play |
| 14 | PR 211 head | Storybook test project | Stories and catalog per `shared-change-1` | The catalog entries `canvas-node`, `node-port`, `canvas-edge`, `canvas-board`, `canvas-controls`, `dialog` and `button` name the new props, states and stories | `pnpm test`; catalog check |
| 15 | PR 211 head | Reading `DESIGN.md` | Not a screen | The six lines the `needs_decision` of the tech notes' result record (task ORV-274-tech-1) names, file 35 of tech.md's "Impact list": the §3.1 `surface.board`, `canvas.grid`, `canvas.selection` and `edge.stroke` rows, the §3.3 Depth line and the §12 "Canvas set" row, describe the new look. Version bump and changelog line | `grep -n "present board" DESIGN.md` |
| 16 | PR 211 head | Quality gate | Not a screen | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` and `pnpm contrast` pass; check-i18n and the copy check pass | Gate output |
| 17 | `Default` (English, light, 1440) | Rendering | One `h1` "ORIVILO, from brief to product". The description under it. One board. The dock with "View only", rendered by `CanvasControls` from the board's catalog key `board.readOnly`, not from `orvCanvas` | `examples/index.ts` exports the page | `Default` play |
| 18 | `InThai` | Rendering | `h1` "ORIVILO จากโจทย์ถึงผลิตภัณฑ์". The dock "ดูอย่างเดียว", from `board.readOnly` through `CanvasControls`, not from `orvCanvas`. Thai headings in Anuphan, body in Sarabun, from the tokens | `orvCanvas` keys exist in both locales with matching placeholders (`copy-1`) | `InThai` play; check-i18n |
| 19 | The data module | Reading it | Not a screen | Counts per `structure-1`. Every edge joins ports of the same kind and steps right. Every node but `c-demo` has a source line. No middot or em dash | `orivilo-canvas.test.ts` |
| 20 | `Default` | Fit view at 1440 | Chapter titles over the cards; no node labels (far level). Status "Showing the whole board, 31 nodes" / "ดูทั้งกระดาน 31 โหนด" | Zoom is 0.25 or more. No two node rectangles overlap, labels included; stack gaps are 40 or more (design, "Layout numbers") | `Default` play |
| 21 | `Default` | Click "01 Direction" / "01 ทิศทาง"; then Tab to "05 Brandbook" and press Enter; then Overview | The view frames each chapter, then the whole board. Status "Jumped to 01 Direction" / "ไปที่ 01 ทิศทาง" | Only the shown chapter has `aria-current="true"`. The dock has 9 chapter buttons | `Default` play |
| 22 | `Default` | Tab to `bb-colour`, Enter; Right; End; Home; Escape | A dialog "ORIVILO brandbook v1.5" / "แบรนด์บุ๊ก ORIVILO v1.5" at "6 / 12", then 7, then 12 with "Next page" / "หน้าถัดไป" disabled, then 1 with "Previous page" / "หน้าก่อน" disabled. Escape closes | The live region reads "Page 6 of 12" / "หน้า 6 จาก 12". Focus never rests on a disabled button. After close, focus is on `bb-colour` and the viewport is unchanged | `Default` play |
| 23 | `Default` | Click each result node in turn; click the scrim | Each opens its sequence at its own page, as the design's "Nodes and their data" section gives (a brandbook part at its section's first page, a page node at its page) | The count's total equals that sequence's page count (`structure-1`). The scrim closes and focus returns | `Default` play |
| 24 | `DesignSystemChapter` | Rendering | `p-base`: live Button "Read this page" / "อ่านหน้านี้", Badge, Field with Input, RadioGroup and Alert. `p-pat`: live Card, PageHeader, the BrandReportScreen form, SectionHeader, Notice and ReadingCard. Each row is named by its catalog entry | Each sheet's closest `[data-design-profile]` is `orivilo`. The Button's computed `--ds-action-primary` equals the `orivilo` light value (`live-only-1`) | `DesignSystemChapter` play |
| 25 | `ProductChapter`; `PreviewProductPages` | Rendering; open `p-report` | Three page frames, Landing first, then the form, then the analysed report, each live, `inert` and `aria-hidden`. The preview shows the same live pages at their design width, scaled to the stage's width and scrolling in a `ScrollArea`. The report opens at its findings | The report page's `ScrollArea` starts at `[data-report]`, or at the top when that is absent | `ProductChapter` and `PreviewProductPages` plays |
| 26 | The product stage nodes and the product preview pages (`live-only-1`) | Querying the DOM | Not a screen | Zero `img` and zero `picture` elements inside them, and at least one `.ds-button` in each. The test fails when a screenshot replaces a live page | `Default` play, product assertion |
| 27 | `BrandReportScreen` | `headingLevel={3}` in the preview and the canvas frames; no prop in `/read` | Not a screen | The dialog title is an `h2`, so under it the page heading is `h3` and its sections `h4`. The prototype page still has exactly one `h1`. `BrandReportScreen` defaults to 1, so the `apps/web` read page tests pass unchanged. `ANALYSED` moves to `examples/brand-report.fixtures.ts` and `brand-report.stories.tsx` imports it | `PreviewProductPages` play; `apps/web` tests |
| 28 | `DirectionChapter`; `PreviewDirectionBoard` | Rendering; Enter on `d-board`; paging | The board fills its node: five pieces edge to edge, no caption, no swatch, no mark. The preview opens at "1 / 6" with the whole board, then one piece per page at its own aspect, its caption only in the footer. A missing image is its flood with its id and "This image is not here yet" / "ยังไม่มีภาพนี้", no dashed frame | At 1440 the board's box fills the stage height within 2 px. No `Logo`, no element named as the mark, no hex and no swatch inside `d-board` or its preview pages. Each photograph takes its record's `treatment` (`images-1`). One label per `honest-1` | Plays, `MissingImages` story |
| 29 | `InUseChapter`; `PreviewInUseBoard` | Rendering; Enter on `u-board`; paging | Seven pieces edge to edge, the mark in every piece but the phone. The preview opens at "1 / 8" with the whole board, then one piece per page. Scenes keep their aspect, and the lockup stays on each scene's surface at every tile size. A missing scene shows its surface as a flat polygon with the lockup on it | At 1440 the board's box fills the stage height within 2 px. Every mark is `Logo` or its SVG, and nothing is laid on `brand-hero` (`images-1`). The lockup on a scene is placed by its quad (row 40). The phone's `Landing` is live and `inert`; the ink tile's intent `Button` is the only lime and sits in an `inert` subtree. The lockup's construction guides take `text.secondary` of its dark boundary, never `opacity.disabled`. One label per `honest-1` | `InUseChapter` and `PreviewInUseBoard` plays, `MissingImages` story |
| 30 | `BrandbookChapter`; `PreviewBrandbook` | Rendering; paging 1 to 12, English and Thai | Four parts open one 12-page book, each page filling the stage height. The furniture on every page is on one line; no glyph is clipped | Every mark on a page is `Logo` or SVG from its geometry (`live-only-1`). `expectLabelInkWhole` holds on the cover, the openers, the voice page and page 12. Page 11's intent `Button` sits in an `inert` subtree | Plays |
| 31 | The logo, type and palette results | Opening each | The logo preview renders `Logo` live. The type pages use the font tokens. The palette pages are swatches with their name and hex inside | Swatch colours are data, inline with a hairline, never a token change | Plays |
| 32 | Every story of the page | Reading the text | The labels of `honest-1` | No text with "AI read", "generated by ORIVILO", "exported" or a score without data | `Default` play text scan |
| 33 | The image records and files | Reading data and files | Not a screen | Each record and file meets `images-1`, its mark exception and its quads included | `orivilo-canvas.test.ts` |
| 34 | `prefers-reduced-motion: reduce` | Chapter jump; opening the preview | No motion | The chapter view moves with duration 0, and the dialog has no animation or transition | `Default` play under reduced motion |
| 35 | `Default` and `Dark` | Keyboard only, a11y addon | Tab order: the dock, the board, then the nodes in reading order. Focus is visible on each | Zero a11y violations. No element inside a board or a book page takes focus | Plays; a11y addon |
| 36 | `At360` | Rendering in a 360 px frame | The title wraps, and the dock is one row with the chapter strip scrolling and fit | The frame's `scrollWidth` equals its `clientWidth` | `At360` play |
| 37 | Storybook | Opening any story | The browser tab icon is the ORIVILO mark | `logo-assets` writes the favicon as `.storybook/static/favicon.svg`, and Storybook serves it as the tab icon from the static folder; `main.ts` does not change. `assets.test.ts` fails on a stale file | `assets.test.ts` |
| 38 | `docs/context/brand/assets/orivilo-mark.svg` and `orivilo-lockup.svg` | Reading | Not a screen | The dot fills `#7A22C7`; `#D9F66F` appears in neither file | `grep -n -i "D9F66F"` returns nothing |
| 39 | PR 212 head | Quality gate | Not a screen | As row 16. `pnpm contrast` output is unchanged from PR 211 (no new pair) | Gate output |
| 40 | The page-local quad placement helper and the two scene records | Running its unit test | Not a screen | A face rectangle lands on four known corners within 0.01 px. Each scene's measured corners (`images-1`), through its tile's cover crop, fall inside the tile (W5) | `orivilo-canvas.test.ts` |
| 41 | Every board piece and brandbook page, English and Thai | Rendering at 1440 | Art type set large and whole inside its piece or page | Each art line's size is display-lg's font size times its data `k`, with `k` from 0.8 to 5 (no token). No art text box leaves its page or piece in either language, and `expectLabelInkWhole` holds on the direction board's Thai line. Floods and inks in the art records are token names (paper is `surface.canvas`), never a colour value | `Default` play; `orivilo-canvas.test.ts` |

## Rows per PR

- PR 211: rows 1-16, 37-38
- PR 212: rows 17-36, 39-41

The numbers are the next two PR numbers expected on 2026-11-17 (the last opened is 210); the main session corrects them once the PRs are open. Rows 37 and 38 sit in PR 211 (comment 10656): the tab icon and the brand SVG dot ship with the shared components.

## Rows that render nothing

- Rows: 15, 16, 19, 26, 27, 33, 37, 38, 39, 40

## Impact (PR 211 contracts)

- **Tokens:** removed `edge.dash.reference` and `edge.dash.derived` (`semantic.json`), their component tokens and the primitives `dash.dashed` and `dash.dotted`. Added the on and off lengths `edge.dash.reference-on`, `edge.dash.reference-off`, `edge.dash.derived-on` and `edge.dash.derived-off`; `edge.width-present` and `edge.width-present-selected` on the new primitives `size.0-375` and `size.0-625`; the component token `node.padding-media` (`component.json`). `edge.width` and `edge.width-selected` keep their values. `generated.css`; `tokens/canvas.test.ts`, which reads the dashes; `foundations/canvas.stories.tsx`.
- **Contrast pairs:** the port and edge rules of `contrast-pairs.ts` gain `surface.canvas`, so `port.image`, `port.palette`, `port.type`, `port.profile` and `edge.stroke`, among others, are checked on it. Recipe pairs in `pairs.ts`: the node label on `surface.canvas`, the pills on `surface.card`, the read-only word, and ghost `aria-current` (tech.md, "Recipes" and "Contrast pairs").
- **Component props:** `CanvasBoard` `onNodeOpen`; `CanvasControls` `position` (`"start" | "center"`) and `children`; `Dialog` `size: "viewer"` (`DialogSize` is exported from `components/index.ts`); `icons.tsx` `OpenIcon`.
- **Node and edge data:** `NodeContent` gains `open`, `pad` and `source`; `PortSpec` gains `row`; `EdgeContent` gains `label`. Readers of these types, which need no change because the fields are optional: `blocks/index.ts`, `blocks/suggest.ts`, `block-library/fixtures.ts`, `BlockLibrary`, `Inspector`, `MissingInputsPrompt`, `canvas-chat/place-reply.ts`, `NodeToolbar`, `MiniMap`.
- **Catalog keys:** `node.pages` and `graph.nodeOpenLabel` in `en.ts` and `th.ts`.
- **Recipes:** `recipes.css`, the private properties `--_zi`, `--_edge-w` and `--_edge-w-selected`, the edge rules of every board, the present board rules, the node label, source and port name pills, `data-lod`, the centred controls, ghost `aria-current` and `.ds-dialog[data-size="viewer"]`.
- **Brand assets:** the favicon `.storybook/static/favicon.svg` from `logo/assets.ts` (with `assets.test.ts`), and the dot fill of `orivilo-mark.svg` and `orivilo-lockup.svg`.
- **Stories:** every board story with an edge changes pixels, because edges are fixed on screen on every board; tech.md's "Impact list" holds the counted list (224 changed, 139 unchanged). The seven present-board stories re-baseline: CanvasBoard `Present`, CanvasNode `ReadOnly`, NodePort `Disabled`, CanvasControls `Present`, CanvasContextMenu `Present`, ShortcutSheet `FromControl`, CommandMenu `Present`. Every story in `shared-change-1` still passes its play.
- **apps/web: none for PR 211.** The grep of tech.md's "Impact list" returns 8 lines in 4 files, none of which change. PR 212 touches `BrandReportScreen`, which `apps/web/app/read/page.tsx` and `ReadForm.tsx` use, with the default unchanged (row 27).

## Out of scope

- Running any engine function, real interpretation, generation or export, Figma sync.
- Saving the canvas, editing or dragging nodes, connecting ports on this page.
- The font change itself (ORV-275, PR 210); this page takes the fonts from the tokens.
- The app's own screens, an `apps/web` route.
- Any new shared component.

## Defaults taken

1. Gaps 8 (`label: false`) and 9 (ghost `aria-current`), decided in earlier revisions, land in PR 211 with gaps 14 to 19. That way PR 212 changes no shared component.
2. Gap 19 splits in two. PR 211 adds the `data-lod` recipe rules with a story whose child writes the attribute. PR 212 adds the page-local writer and the chapter titles, as the design chose.
3. The page count word and the open accessible name are the catalog keys `node.pages` and `graph.nodeOpenLabel`, because the shared canvas components render them. The `orvCanvas` keys `open.pages`, `open.name`, `dock.viewOnly`, `dock.label` and `preview.close` are dropped (comment 10656).
4. The screen-fixed width and dash lengths (times `--_zi`) apply to every board. The kind hue, the 1.5 px width, no arrow heads and the calm ground apply to present boards only (comment 10656).
5. Both PRs are larger than 400 changed lines. The owner chose two PRs (comment 10651).
6. Design revision 5 is accepted as the look to build under the owner's POC delegation (comment 10652). The two boards, the 12 brandbook pages and the seven images land in PR 212 as content, with gaps 20 to 23 page-local. Rows 28 to 30, 40 and 41 hold that look.
7. No benchmark table is written, since no new component is added. The viewer size and the dock are variants the design's "Gaps" section specifies.
8. `Landing` stays Thai only, and its preview caption and the phone piece's second line say so (`honest-1`).
9. Codex runs from the main session with the exact prompt from the data record: `direction-making` first, as the direction board's trial (made and passed the main session's check), then `direction-place`, `scene-card` and `scene-sign`. Scene corners are measured on the made images. Until a file exists, its slot shows the missing state.
10. Gap 21's photo treatments are page-local utilities in `orivilo-canvas.tsx` (comment 10652), not the two `recipes.css` rules the design's "Gaps" and "For the builder" sections name. The lint rule (`packages/design-system/eslint/no-raw-style-classes.mjs`) bans raw colour, radius, shadow and font classes only, so filter and blend utilities pass on a page. No recipe and no pair is added, and PR 211 carries none.
11. Where design revision 5.1 and `docs/specs/ORV-274/tech.md` disagree on a contract name or value, tech.md wins (comment 10656). The cases: the `CanvasControls` position values (row 12); the present dot pitch (row 7); the zoom property (row 9); `headingLevel` (row 27); a present node label ends in an ellipsis at the card width, where the design lets it run into the gap; the catalog keys (default 3).

## Depends on

- `docs/specs/ORV-274/design.md` revision 5, accepted (comment 10652, default 6), sections "The look first", "The whole structure", "Reading distances and levels of detail", "Layout numbers", "Nodes and their data", "Edges", "Components per part", "Honest labels", "Images", "Copy", "States", "Gaps" and "For the builder". Where its "Images" section says `image-check-1` of spec v1.0, read `images-1` of this spec. Revision 5.1 for the made images and the measured scene corners ("Nodes and their data", 04 Brand in use).
- `docs/specs/ORV-274/tech.md`, sections "Contract: tokens", "Contract: components", "Recipes", "Contrast pairs", "Impact list", "Build order" and "Tests", decided under default 11.
- ORV-274 comments 10637, 10644, 10645, 10646, 10649, 10650, 10651, 10652, 10656.
- ORV-275 (fonts, PR 210), ORV-267 (`BrandReportScreen`), ORV-118 (`logo-assets`), ORV-52 (`BRAND_PROFILES`).
- `DESIGN.md`, `.claude/rules/design-system.md`, ADR 0003 (Storybook is the catalog's visual half), ADR 0004 (canvas vocabulary), AGENTS.md rules 2 and 4.

## Worked examples

Not run here (no shell in this role). Each runs from the repo root with `node -e`. The input of W1 to W4 is copied from the design's "The whole structure" section, revision 5; their outputs are integers, with no rounding.

W1. Nodes by chapter (00 to 07) and by kind. Expected `31 31`.

```bash
node -e 'const ch=[8,2,4,6,2,4,2,3],kind={knowledge:12,direction:2,artifact:16,reference:1};console.log(ch.reduce((a,b)=>a+b),Object.values(kind).reduce((a,b)=>a+b))'
```

W2. Edges by meaning. Expected `40`.

```bash
node -e 'const m={input:29,reference:8,derived:3};console.log(m.input+m.reference+m.derived)'
```

W3. Chapter stops, Overview plus the chapters. Expected `9`.

```bash
node -e 'const chapters=["00","01","02","03","04","05","06","07"];console.log(1+chapters.length)'
```

W4. Result nodes and sequences. Expected `12 7 40`.

```bash
node -e 'const r=["d-board","l-logo","t-type","c-pal","u-board","bb-cover","bb-logo","bb-colour","bb-use","p-landing","p-form","p-report"],s=[6,3,2,6,8,12,3];console.log(r.length,s.length,s.reduce((a,b)=>a+b))'
```

W5. Row 40's cover crop: `scene-card`'s measured corners (the design's "Nodes and their data", 04 Brand in use, revision 5.1) on its 1254 by 1254 image (its "Images" section) in a 246.4 by 776/3 tile (the board cell), in tile px, rounded to two decimals with `toFixed(2)` (no value sits on a half). Expected `50.00,102.69 181.92,82.26 197.44,159.08 64.74,176.41`, all inside the tile.

```bash
node -e 'const tw=246.4,th=776/3,iw=1254,ih=1254,s=Math.max(tw/iw,th/ih),dx=(tw-iw*s)/2,dy=(th-ih*s)/2,c=[[21.7,39.7],[72.7,31.8],[78.7,61.5],[27.4,68.2]];console.log(c.map(([x,y])=>(dx+x/100*iw*s).toFixed(2)+","+(dy+y/100*ih*s).toFixed(2)).join(" "))'
```

## Changelog

- v1.0 (2026-11-17): first version, from the owner's request on ORV-274. Downstream to review: the builder envelopes for slices A, B and C, the designer sign-off envelope (row 19 and `image-check-1`), the qa envelope (Rows per PR once PRs exist), and `examples/brand-report.tsx` if open question 1 stays at (a).
- v2.0 (2026-11-17): rewritten for the live prototype (comment 10651) on design revision 4 with gaps 14 to 19 accepted (comment 10649). The structure is now 31 nodes, 40 edges, nine chapter stops and 12 result nodes with paged previews, plus a three-level product stage. It ships as PR 211 (shared canvas components) and PR 212 (the page). Rules `live-only-1`, `structure-1`, `copy-1`, `honest-1`, `images-1`, `shared-change-1`. Lane moves to L. Downstream to review: the builder envelopes for PR 211 and PR 212, the designer sign-off envelopes, the qa envelopes (Rows per PR), `docs/specs/ORV-274/design.md` revision 5 (rows 28 to 30 and default 6), the `DESIGN.md` lines of row 15, and the catalog entries of row 14.
- v2.1 (2026-11-17): brought in line with design revision 5, accepted with gaps 20 to 23 (comment 10652). Goal names revision 5 and the mark on cloth. `live-only-1`: image files are only photographs and scenes, with the `brand-hero` exception. `structure-1`: sequences 6, 3, 2, 6, 8, 12 and 3 pages (were 11 and 7 for the two boards; 40 pages, was 44), boards of 5 and 7 pieces, 1280 by 800; nodes, edges, chapter stops and result nodes did not move. `honest-1`: one label per board or page, no caption under a tile. `images-1`: the list of 7, `treatment`, scene `quad`, the `brand-hero` mark exception. Rows 28, 29, 30, 33 and 35 changed; rows 40 (quad helper) and 41 (art type) added, PR 212 is rows 17-41; rows 20, 22 and 23 checked and hold as written. Defaults 3 (revision 5's "Copy" still lists `open.*` under `orvCanvas`; the default wins), 6, 8 and 9 changed; default 10 added (gap 21 page-local). W4 now `12 7 40`; W5 added. PR 211 rows 1-16 and its impact list are unchanged: revision 5 keeps gaps 14 to 19 word for word. Downstream to review: tech.md, the PR 212 builder envelopes, the designer sign-off envelope, the qa envelope (Rows per PR).
- v2.2 (2026-11-17): brought in line with the decided tech notes (comment 10656) and design revision 5.1. Goal: revision 5.1, tech.md, and the tab icon and brand SVG dot in PR 211. `images-1`: scene corners are the measured ones. Rows 3 (`PresentNames`, keyboard focus), 7 (24 px, `space.grid-gap`), 9 (`--_zi`, every board, `edge.width-present`, the on and off dash tokens, `KindsAndZoom`), 10 (`KindsAndZoom`), 11 (`edge.width-present-selected`, `ChainHighlight`), 12 (`center` against `start`, `board.readOnly`, four viewport commands, `GhostCurrent`), 15 (the six DESIGN.md lines), 17 and 18 (dock word from `board.readOnly`), 27 (`headingLevel` 3), 37 (`favicon.svg`, no `main.ts` change) and 40 (measured corners) changed; rows 8 and 14 hold. Rows per PR: PR 211 rows 1-16, 37-38; PR 212 rows 17-36, 39-41. Impact list renamed to tech.md's tokens, fields and keys, with the brand assets and every board story changing pixels. Defaults 3 and 4 changed; default 11 added. W5 uses the measured card corners. Downstream to review: the PR 211 and PR 212 builder envelopes, the designer sign-off envelope, the qa envelopes (new Rows per PR).
- v2.3 (2026-11-17): three corrections raised by the tech notes task ORV-274-tech-2. `images-1`: the treatment values are `violet`, `paper` or `photo` (were `duo` violet and `mono` paper). `images-1`: a record's prompt is word for word the text sent to Codex, the `v1.prompt.md` the image was made from (the text fence body where the file has one), not the design's brief. W5: the tile is 246.4 by 776/3 (the board cell, was 258.7), and the expected output is `50.00,102.69 181.92,82.26 197.44,159.08 64.74,176.41`. No row, rule name or Rows per PR line changed. Downstream to review: the PR 212 builder envelopes.
- v2.4 (2026-11-17): one correction raised by the tech notes task ORV-274-tech-3, on the built behaviour accepted in comment 10660. Row 9's data effect now names the derived edge widths: present 1.5 px (`edge.width-present`), derived 2.5; edit 2 px (`edge.width`), derived 3 (was one width per board). No other row, rule name or Rows per PR line changed. Downstream to review: the qa envelope for PR 211.
- v2.5 (2026-11-18): one correction from qa task ORV-274-pr211-qa-1, finding F1. Row 12's User sees cell now orders the centre dock as tech.md decides and the build renders it: the read-only word first, a divider, the children, a divider, then only the four viewport commands (was the children, a divider, then the read-only word). The main session decided it under the owner's POC delegation (comment 10656, the tech notes win): the honest label leads the bar and cannot scroll away with the chapter strip. No other row, rule name, number or Rows per PR line changed. Downstream to review: the qa re-walk of row 12 and the reviewer re-check of PR 211.
