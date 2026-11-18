---
issue: ORV-278 (https://tpetkaew.atlassian.net/browse/ORV-278)
parent: ORV-274 (https://tpetkaew.atlassian.net/browse/ORV-274), docs/specs/ORV-274/spec.md v2.4
lane: L (inherited from ORV-274)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode"), a slice spec
version: 1.0
---

# ORV-278: the ORIVILO canvas prototype page (slice of ORV-274)

## Why

This is a slice. ORV-274 ships in two pull requests (parent spec, Goal): one changes the shared canvas components, and one adds the prototype page. This issue is the second, the page, made its own Jira issue so that the page PR carries its own key. It adds no requirement: every row and rule below is copied word for word from `docs/specs/ORV-274/spec.md` v2.4, and the parent stays their source.

The parent's intent holds unchanged: the prototype is a real page in Storybook, built from the live catalog components, read left to right on one canvas from brief to product (parent spec, Goal, with the owner's words of comments 10637, 10644, 10645, 10646 and 10651).

Gates. G1 and G2 for this slice are the parent's: they passed on ORV-274 in comment 10656, under the owner's POC delegation (ADR 0012 decision 4). The same comment decides that where the design and the tech notes disagree on a contract name or value, the tech notes win (parent spec, Defaults taken, default 11). ORV-274 comment 10660 accepts the built deviations, and the seven images stay as they are.

What is real and what is simulated: the parent Goal's paragraph of that name holds for this page as written. Real: the live catalog components and pages. Copied by hand: ORIVILO's brand data. Simulated: the flow itself; no engine function runs and nothing is interpreted, generated or exported. Generated outside the repo: the photographs and blank scenes. No code in this story calls a model.

This story is not a guard on a tool call, so the guard frame does not apply.

## Story

As the owner, I open `Examples/Prototype: ORIVILO canvas` in Storybook and read ORIVILO from brief to product on one canvas, opening each result page by page (parent spec, Goal).

## Rules

Copied word for word from the parent spec's "Rules" section: the five rules the rows below cite by name. `shared-change-1` belongs to the shared components PR and is not cited here.

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

## Acceptance criteria

Page files (PR 212), all in `packages/design-system/src/examples/`: `orivilo-canvas.tsx`, `orivilo-canvas.data.ts`, `orivilo-canvas.test.ts`, and `orivilo-canvas.stories.tsx` with the title `Examples/Prototype: ORIVILO canvas`. The stories are the ones the design's "For the builder" section lists.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
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
| 39 | PR 212 head | Quality gate | Not a screen | As row 16. `pnpm contrast` output is unchanged from PR 211 (no new pair) | Gate output |
| 40 | The page-local quad placement helper and the two scene records | Running its unit test | Not a screen | A face rectangle lands on four known corners within 0.01 px. Each scene's measured corners (`images-1`), through its tile's cover crop, fall inside the tile (W5) | `orivilo-canvas.test.ts` |
| 41 | Every board piece and brandbook page, English and Thai | Rendering at 1440 | Art type set large and whole inside its piece or page | Each art line's size is display-lg's font size times its data `k`, with `k` from 0.8 to 5 (no token). No art text box leaves its page or piece in either language, and `expectLabelInkWhole` holds on the direction board's Thai line. Floods and inks in the art records are token names (paper is `surface.canvas`), never a colour value | `Default` play; `orivilo-canvas.test.ts` |

How to read the copied rows:

- "PR 212" in the copied text is the parent's name for the page PR, this issue's PR. GitHub PR 212 belongs to ORV-277, so the page PR has no number yet; "PR 212 head" in row 39 reads as the page PR's head, and "PR 211" in row 39 is the parent's shared components PR.
- Row 39's "As row 16" points to row 16 of the parent spec (`docs/specs/ORV-274/spec.md`, line 68), which stays in the parent's shared components PR and is not copied here.
- Rows 37 and 38 (the Storybook tab icon and the brand SVG dot) are the parent's shared components PR, so the numbers jump from 36 to 39.

## Rows that render nothing

These copied rows show no screen; the parent's list holds them with rows 15, 16, 37 and 38, which are not in this slice.

- Rows: 19, 26, 27, 33, 39, 40

## Design and tech notes

Not copied. They live in the parent folder:

- Design: `docs/specs/ORV-274/design.md`, revision 5 with 5.1 to 5.3, under the parent spec's "Depends on".
- Tech notes: `docs/specs/ORV-274/tech.md`, the section "The prototype page", the build order "PR 212: the page", and the tests table "PR 212" under "Tests". Where the design and these notes disagree on a contract name or value, the parent spec's default 11 decides.

## Out of scope

- Rows 1 to 16, 37 and 38 of the parent spec: the shared canvas components, the Storybook tab icon and the brand SVG dot, which ship in the parent's shared components PR.
- Everything the parent spec's "Out of scope" lists.

## Open questions

None. One default: this spec has no "Rows per PR" section, because the page PR has no number yet, so the qa walk covers every row of the table above.

## Depends on

- `docs/specs/ORV-274/spec.md` v2.4, its rules, rows, "Defaults taken" and "Worked examples".
- ORV-274 comments 10656 (G1 and G2 under the owner's POC delegation; the tech notes win on names and values) and 10660 (the built deviations accepted; the seven images stay as they are).
- The parent's "Depends on" list, which holds for this slice as written.

## Worked examples

This slice derives no number of its own. `structure-1` and row 40 cite W1 to W5, which live in the parent spec's "Worked examples" section with their `node -e` lines and expected outputs; they are not copied here.

## Changelog

- v1.0 (2026-11-18): first version, task ORV-278-spec-1. The slice spec of ORV-274 for the prototype page PR: rows 17-36 and 39-41 and the rules `live-only-1`, `structure-1`, `copy-1`, `honest-1` and `images-1`, copied word for word from the parent spec v2.4; no new requirement. Downstream to review: the ORV-278 builder envelopes and the qa envelope for the page PR.
