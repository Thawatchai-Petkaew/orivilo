---
issue: ORV-309 (https://tpetkaew.atlassian.net/browse/ORV-309)
lane: M (a normal story; no shared component API, token, recipe or profile changes)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.3
---

# ORV-309: the prototype canvas shows ORIVILO as a real digital product

## Why

On 2026-11-25 the owner looked at the Storybook story `examples-prototype-orivilo-canvas--default`
(the ORV-274 canvas) and wrote four messages in Thai. In short:

1. The application examples look plain. Show the real app we work in. The landing page should be a
   far stronger dark page, in English, and it may use generated images.
2. ORIVILO is a digital product made of nodes. The brand guideline (the In use board and the
   brandbook's In use part) shows the brand only on physical things; it should express a digital
   product brand, with modern UX and UI.
3. The design system chapter takes too few base components and its composed components are plain,
   although the catalog holds far more. The prototype should show the landing, the real product
   (the node work) and the CI work (the brand guidebook).
4. "Go ahead, make it match what I want." Later the same day, comment 10829: on the canvas the
   landing and every application-level example are composed from the real components, never a
   generated picture; the example work in the mood board and the brand book may be generated.

Then the owner sent a brand book made for an app as the reference for the In use board and the
brandbook (comment 10837); the designer's revision 2 of the design answers it, and version 1.1 of
this spec carries its changes. The reference images are third-party work and are not in the repo.

Then the owner asked whether piece C is an app icon and whether it is too big (comment 10839). The
main session decided, under the owner's standing go-ahead, that the icon is drawn at a true
home-screen scale in an icon grid. The visual sign-off of head 4a03cb5 (comment 10840) found the
Colour node covering the Logo node's port row in the window (F2) and page 11's bottom row off the
top row's edges (F5). The designer's revision 3 (design rows 3.1 to 3.3) answers the three, and
version 1.2 of this spec carries its changes.

Then the owner looked at the proof of piece C, a phone drawn from boxes, and said: take a real
iPhone mockup and put it in instead, this looks funny (comment 10842). The main session read it,
under the POC delegation, as one photo-like picture of a blank phone, made with AI, with the live
screens laid on it by code; no Apple file and no Apple logo. One trial render was made and shown to
the owner. The image rule of comment 10829 allows it: the picture is example work of the brand book,
and every screen on it stays live (canvas-image-1). The designer's revision 4 (design rows 4.1 to
4.6) answers it. The same day the main session surveyed the static Storybook build of c20cb1b in
real Google Chrome, headed, at 1440 x 900 (comment 10843): sign-off finding F4, the 07 Product
camera putting a node's badge row under the dock and landing differently from one open to the next,
is still open after rework 1; every chapter story opened directly stayed at one zoomed-out view that
frames no chapter in 20 of 21 opens, and with the dock buttons pressed on the `Default` story the
Logo, Colour and In use chapters gave a different view in one run of three. Version 1.3 of this
spec carries revision 4 and states the camera rule, C12.

The standing bar is the owner's "excellent UI, no UI slop, no AI slop" (ORV-274 comment 10637).
The design that answers it is `docs/specs/ORV-309/design.md` (proposals 1 to 6, "Chapter wiring",
"Copy", "Honest labels"). The main session decided its rule changes and contract needs under the
owner's POC delegation (comment 10830, ADR 0012 decision 4); section "Decided" records them.

This spec is not a guard on a tool call, so the guard frame does not apply.

## What is real

- **Live:** every page, board, sheet and app screen on the canvas is the catalog component rendered
  in the story: `CanvasBoard` and the canvas set, `Button`, `Badge`, the inputs, `Logo`,
  `BusinessBoardScreen`, `GuidebookScreen` and the new example `OriviloLanding`.
- **Sample data:** the app screen shows the sample project of `business-fixtures.ts`
  (`ENGLISH_VIEW`, `THAI_VIEW`); the guidebook shows a sample guidebook; the task bar shows
  `fixtureTaskJobsEn` or `fixtureTaskJobs`; the chat reply on the composed sheet is one fixed sample
  reply labelled "By rules". The Font node's text on the composed sheet comes from the blocks' fixed
  rules on the sample answers (design, proposal 6 and C7).
- **Simulated:** the flow of the canvas. Nothing on the page interprets, generates or exports.
  `OriviloLanding` is a concept page, and its footer says so.
- **Images:** the seven photographs and scenes ORV-274 holds and one new picture made for this
  story, `scene-phone` (a blank phone on violet, made with AI, the owner's ask in comment 10842),
  each under its AI label. No other image is made.
- **No model call** anywhere in this story.

## Story

As the owner showing ORIVILO, I want the prototype canvas to show ORIVILO as the digital product it
is (its own dark landing, the real node app, the brand guidebook it assembles, the components it is
built from, and the brand used on screens first), so that the canvas communicates the brand of a
modern digital product and not of a print shop.

## Decided

### canvas-image-1

From comment 10829. On the canvas, the landing and every application-level example (the app, the
app window, the guidebook, the sheets, the share image) are composed from live components, never an
image of a page or an app. A photograph inside the landing's band is atmosphere, not a picture of
the page, and is allowed (the owner's message 2). Generated images are allowed for the example work
on the direction and In use boards and in the brandbook.

### intent-once-1

From R8 of the design, decided in comment 10830. ORIVILO is the brand on show, so its lime intent
button may appear inside a canvas node, at most one per page: the landing, each sheet, the In use
board and each brandbook page. No signature glow anywhere (R9).

### base-sheet-1

The base sheet (design, proposal 5) shows one live instance of each of these 21 catalog entries,
each labelled with its catalog name in Latin in both languages, grouped in three columns:

- Actions and navigation: `button`, `toggle-group`, `tabs`, `breadcrumb`, `kbd`, `avatar`,
  `featured-icon`.
- Inputs: `field`, `input`, `select`, `checkbox`, `switch`, `slider`, `textarea`.
- Status and feedback: `badge`, `tag`, `radio-group`, `progress`, `alert`, `spinner`, `skeleton`.

The design's sentence "That is 18 entries" counts fewer than its own table names; this list is the
table, and open question 1 records the default.

### in-use-1

The In use board holds the seven pieces of the design's proposal 4, ids in brackets:

- A the app in a browser window (`window`): a tab with the mark as favicon and the name, an address
  bar with `orivilo.vercel.app`, the Studio's `TopNavigation`, the live board in its edit view with
  the Positioning node selected, on violet.
- B the phone with `OriviloLanding` at 390 (`phone`): the live landing laid on the screen of the
  phone picture `scene-phone`, the whole phone on violet (design row 4.3).
- C the app icon on a phone home screen (`icon`): a home screen at true scale (design row 3.1),
  laid on the screen of the same phone picture, the upper part of the phone (design row 4.4); row
  11 holds its measure.
- D the hero photograph (`hero`).
- E the link share card (`share`): a 1.91 : 1 image (ink, the horizontal logo, the giant mark) over
  the share tagline and the address.
- F the card scene (`card`).
- G the sign scene (`sign`).

The lockup tile and the ink tile are dropped. Brandbook page 10 opens with a field of three live
screens at -12 degrees on violet as its art: the landing at 390, the app in a browser, the
guidebook. Page 11 holds six placements: B with its layout grid, A, C, the icon set specimen, F and
G, in the boxes of the design's page 11 table (open question 2).

### Other decisions of comment 10830

Each is decided at the design's default; the design's "Rule changes for the owner" and "Contract
needs" tables hold the detail.

- R1: 36 edges, 25 of them input; edges 26 to 36 are the design's "Chapter wiring" table.
- R2: 14 result nodes; 8 preview sequences of 6, 3, 2, 6, 8, 12, 2 and 3 pages, 42 in all. The new
  seventh sequence is "Design system" (base sheet, composed sheet).
- R3: the world grows to 5372 x 2260 (W3).
- R4: in-use-1.
- R5: images are 8: the seven and `scene-phone`; the landing's band reuses `direction-making`;
  `landing-make` is not made.
- R6: the canvas landing is `OriviloLanding`, English by default with Thai complete. The copy of
  `orvCanvas` `phoneSub` and `landingNote` changes (open question 3).
- R7: Thai display copy may carry U+2060 word joiners, in the Thai `oriviloLanding.title` and
  `oriviloLanding.bandTitle` only.
- R8 and R9: intent-once-1.
- C1: no new recipe. The crop fade is a token-only overlay inside the example if the lint accepts
  it; else the crop is anchored with no fade, and a play asserts that no text box crosses the
  frame's bottom edge.
- C2: `startAt` (a selector) on the canvas example's internal `LiveFrame`; not a public API.
- C3: the composed sheet's Audience to Mood and theme edge has `label: false`.
- C4: plays scroll a node into view before they assert or shoot it.
- C5: the phone is the picture `scene-phone`; its screen is clipped to the picture's measured
  corner, held in the image record; the icon takes `rounded-container` and the camera pill
  `rounded-round`; no raw radius in a class.
- C6: the composed sheet places its `TaskBar` with a bottom inset of `space.6`.
- C9: the base sheet shows `Kbd shortcut="Mod+K"` with "Command menu"; no `CommandMenu`.
- C7 and C8 are product gaps, out of scope.
- C10 and C11 are the design's revision 2 contract needs (the page 10 and 11 art records; the
  nested board read as C4).
- C12, the chapter camera, from sign-off finding F4 and comment 10843. Every chapter story
  (`DirectionChapter`, `LogoChapter`, `ColourChapter`, `InUseChapter`, `BrandbookChapter`,
  `DesignSystemChapter`, `ProductChapter`) and every dock button (the nine of `CHAPTERS` in
  `orivilo-canvas.data.ts`: Overview, 00 Brief, 01 Direction, 02 Logo, 03 Colour, 04 In use, 05
  Brandbook, 06 Design system, 07 Product) frames its chapter with all of the chapter's nodes (its
  record's `nodes`; the Overview's are the whole board) inside the board and above the dock. The
  view of one chapter at one window size is the same on every open, whether the story opens on it
  or its dock button is pressed. It holds on the static Storybook build in real Google Chrome, not
  only on the dev server.

## Acceptance criteria

Files: new `packages/design-system/src/examples/orivilo-landing.tsx` with its stories and test;
`orivilo-canvas.tsx`, `orivilo-canvas.data.ts`, `orivilo-canvas.stories.tsx`,
`orivilo-canvas.test.ts`; the locale files `en.ts` and `th.ts`. Copy keys are the design's "Copy"
section; a row quotes only the honest labels it asserts and the strings a play finds by name.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | `OriviloLanding` story `Default` (English, 1280), toolbar light and dark | Rendering | The eight sections of proposal 1 in order: header, hero, the board, work, band, guidebook, close, footer, on the dark ORIVILO profile in both toolbar modes. One lime button "Start from your brief" in the hero; the close button carries the same words in primary violet. The hero board is ORIVILO's own board, drawn live and present. The work section shows the live `BusinessBoardScreen`, the guidebook section the live `GuidebookScreen`. The footer says "A concept preview with sample projects." Nothing moves at rest; no glow | The root has `lang="en"` and its boundary `data-mode="dark"`. Exactly one `.ds-button[data-variant="intent"]` (intent-once-1). The hero board holds 6 nodes and 6 edges. No rating, score, user count, customer logo, quote or success claim. No `img` but the band photograph (canvas-image-1) | Visual. `Default` play; lint |
| 2 | `OriviloLanding` story `Thai` (1280) | Rendering | The same page in Thai, every string Thai: the hero button "เริ่มจากบรีฟของคุณ", the footer "ตัวอย่างแนวคิด ใช้โปรเจกต์ตัวอย่าง". The work frame shows `THAI_VIEW` and the guidebook its Thai sample. Headings in Anuphan, body in Sarabun at 1.7, no tracking, no caps | The root has `lang="th"`. `expectNoGlyphClip` holds on the title and the band title. Every `oriviloLanding` key exists in both locales | Visual. `Thai` play; check-i18n |
| 3 | `OriviloLanding` stories `At390` (English) and `At390Thai` | Rendering in a 390 px frame | The narrow rules of proposal 1: the title at display-md, the narrow board with logo, colour and guidebook, the app frame hidden so the three points carry the work section, the guidebook frame scaled from 390, buttons that wrap. The Thai title sits on two lines with no word split (R7) | The hero board holds 3 nodes and 2 edges. No `BusinessBoardScreen` is visible. Each button is 48 px high or more. The frame's `scrollWidth` equals its `clientWidth` | Visual. `At390` and `At390Thai` plays |
| 4 | `OriviloLanding` stories `Default` and `MissingImage` | Rendering with the band photograph present, then missing | Present: the `direction-making` photograph in the band beside the text on the violet plane, and "Photograph made with AI." / "ภาพถ่ายนี้สร้างด้วย AI" under the band text. Missing: the band text at full width on the violet plane, no label, no broken image | The AI label is rendered if and only if the band `img` is. The `img` has `width`, `height` and an `alt` from the catalog | Visual. `Default` and `MissingImage` plays |
| 5 | Canvas story `ProductChapter`, English, and the same chapter with the locale Thai | Rendering; the play scrolls `p-app` into view first (C4) | Three nodes top to bottom: "Landing" / "หน้าแรก" (`p-landing`), "The app" / "แอป" (`p-app`), "Brand guidebook" / "คู่มือแบรนด์" (`p-guide`), each 480 wide with media of equal height and one badge row: "Mockup" / "ภาพจำลอง" on `p-landing`, "Sample data" / "ข้อมูลตัวอย่าง" on the other two, each with its note (copy "landing note", "app note", "guide note"). `p-landing` shows `OriviloLanding` in the canvas's language; `p-app` shows the board screen fitted, with no empty top and no cut node; `p-guide` shows the guidebook from its foundation heading. The chapter opens framed as C12 reads, and so does every other chapter | Each live frame is `inert` and `aria-hidden`. The nodes' tops are in that order. The landing frame's `lang` follows the canvas locale. The `p-app` frame keeps an explicit 1280 x 800 box. C12 holds for every chapter: the seven chapter stories and the nine dock buttons it lists, on the static Storybook build in real Google Chrome | Visual. `ProductChapter` play and its Thai twin. For C12: the seven chapter plays, and a headed real Google Chrome survey of the static Storybook build at 1440 x 900 as comment 10843 ran it (each chapter story opened directly three times; the dock buttons pressed on `Default` in three runs), which the builder reports and the sign-off repeats |
| 6 | Canvas story `PreviewProductPages`, English and Thai | Opening the product sequence and paging 1 to 3 | The landing, then the app, then the guidebook, each live at its design width scaled to the stage. The guidebook starts at its "Brand foundation" heading with no Thai mark cut at the top. Each cropped bottom either fades by a token-only overlay or ends between text lines (C1) | The top of `[data-section="foundation"]` is within 24 px of its frame's top in both languages (C2). When there is no fade, no text box crosses the frame's bottom edge. The sequence counts 3 pages | Visual. `PreviewProductPages` play, both languages |
| 7 | The product nodes `p-landing`, `p-app`, `p-guide` and their preview pages | Querying the DOM | Not a screen | `p-app`, `p-guide` and their pages hold zero `img` and zero `picture`. `p-landing` and its page hold exactly one `img`, the band's `direction-making`, with its AI label (canvas-image-1). Each holds at least one `.ds-button` | `ProductChapter` and `PreviewProductPages` plays |
| 8 | Canvas stories `DesignSystemChapter` (light), `DesignSystemChapterDark` and the chapter with the locale Thai | Rendering; then the play focuses "Project name" / "ชื่อโปรเจกต์" | `p-base`, 560 wide, shows the base sheet of proposal 5: three columns "Actions and navigation" / "ปุ่มและการนำทาง", "Inputs" / "ช่องกรอกข้อมูล", "Status and feedback" / "สถานะและการแจ้งเตือน", each item named by its catalog name. The states proposal 5 lists show: default, selected, disabled, loading, an error that says the fix ("Add the full address, starting with https://" / "ใส่ที่อยู่ให้ครบ โดยขึ้นต้นด้วย https://"), and empty (skeleton). After the play the field shows the focus line with its halo, apart from any selected look | The sheet holds one live instance of each entry of base-sheet-1, found by its role or recipe class. The sheet's closest `[data-design-profile]` is `orivilo`, and a `Button`'s `--ds-action-primary` equals the `orivilo` value in the sheet's mode. No intent button on the base sheet | Visual. The three plays |
| 9 | Canvas stories `DesignSystemChapter` and the new `PreviewDesignSystem` | Rendering; opening `p-base`; paging to 2; the play focuses a control on the composed board | `p-pat` shows the working Studio of proposal 6: an edit board with Brief, Brand personality, Audience, Mood and theme, and Font, in the sheet's language; Mood and theme selected with its node toolbar; the canvas controls; the task bar collapsed and clear of the board's attribution (C6); the inspector of the selected node; the chat with one reply marked "By rules" / "ตามกฎ". The preview is "Design system" / "ระบบดีไซน์", 2 pages: the base sheet, then the composed sheet | The composed board holds 5 nodes and 4 edges, and the Audience to Mood and theme edge has `label: false` (C3). The selected node and the focused control differ in computed outline and box-shadow. At most one intent button on the composed sheet (intent-once-1) | Visual. `DesignSystemChapter` and `PreviewDesignSystem` plays |
| 10 | The data module `orivilo-canvas.data.ts` | The unit test runs | Not a screen | 31 nodes, the chapter tally unchanged. 36 edges, numbered 1 to 36: 25 input, 8 reference, 3 derived; edges 26 to 36 as the design's "Chapter wiring" table, each joining ports of one kind and stepping right. 14 result nodes. 8 sequences of 6, 3, 2, 6, 8, 12, 2 and 3 pages, 42 in all. Nine chapter stops. Every node inside 5372 x 2260. The product node ids are `p-landing`, `p-app` and `p-guide`; `p-form` and `p-report` are gone (W1 to W3) | `orivilo-canvas.test.ts` |
| 11 | Canvas stories `InUseChapter`, `PreviewInUseBoard` and `PreviewAt360`, English and Thai | Rendering; opening `u-board`; paging; at 360 | The seven pieces of in-use-1 on the 1280 x 800 grid, the screens first: the app in a browser window with ORIVILO's live board, its address and its navigation, on violet; the phone picture with the live dark landing on its screen; the app icon on a phone home screen; the hero photograph; the link share card: the image with the horizontal logo and the giant mark, the share tagline (`orvCanvas.use.shareTagline`) as its title and the address; then the card and the sign. The preview opens at "1 / 8", then one piece per page. At 360 every piece holds | 7 pieces with the ids of in-use-1. Exactly one intent button inside `u-board`, in piece B's phone, in an `inert` subtree; the window, the icon and the share card hold none. Piece C draws a home screen of 4 columns with one app, ORIVILO, whose icon is 0.15 to 0.17 of the screen's width; the other 19 slots are placeholder shapes; exactly one `img` in the piece, the phone picture, and no `img` on its screen. No two of the six nodes of the window's board (brief, pos, logo, colour, guide, product; design row 3.2) intersect, and every node's port row lies inside its node, on the board, on page 2 and on page 10. B and C are one phone picture; each screen is clipped to the record's corner times the picture's scale and placed by a plain scale and translate (no `matrix3d`, no `perspective`); the app icon is `rounded-container`; the browser is `rounded-container` (C5). Nothing is laid on `brand-hero`. The AI label sits as ORV-274 `honest-1` gives it. At 360 the frame's `scrollWidth` equals its `clientWidth`. With `scene-phone` missing, B and C show the violet flood and the missing label only, and `u-board` holds no intent button | Visual. `InUseChapter`, `PreviewInUseBoard`, `PreviewAt360` and `MissingImages` plays |
| 12 | Canvas stories `BrandbookChapter` and `PreviewBrandbook`, English and Thai | Paging to pages 10 and 11 | Page 10: the ink half with its numeral, section name and page list as today, and the field of three live screens as the art. Page 11: six placements: the phone picture with the live landing and its layout grid (lines at 24 and 366 of 390, the measure 24, 342, 24), the window, the home-screen icon as row 11 reads it, the icon set (24 glyphs, 6 x 4), the card, the sign. The measure sits above the phone and the title "Layout at 390" / "เลย์เอาต์ที่ 390" at the bottom start. The caption's second line on page 11 is `preview.bookSubUse`: "ORIVILO brand guidelines v1.5. Mockups: real screens and the logo on AI pictures." / "แนวทางแบรนด์ ORIVILO v1.5 ม็อกอัป: หน้าจอและโลโก้จริงบนภาพที่สร้างด้วย AI". No glyph clipped | Page 10 holds one intent button, in the landing, in an `inert` subtree, and no `img`. Page 11 holds 6 placements and one intent button, in piece B's phone, in an `inert` subtree. Page 11's boxes are the design's page 11 table: the card ends at 920 and the sign spans 932 to 1232, so each bottom-row box (the icon set, the card, the sign) starts or ends on a top-row edge (360, 920, 932 or 1232). `expectLabelInkWhole` holds on page 10. The book keeps 12 pages, and `bb-use` opens at page 10 with a count of 3. With `scene-phone` missing, page 11's two phones read as row 11's missing state and page 11 holds no intent button (design row 4.5) | Visual. `BrandbookChapter`, `PreviewBrandbook` and `MissingImages` plays; `orivilo-canvas.test.ts` |
| 13 | The image records and the static folder `.storybook/static/orv-274/` | The unit test runs; the PR diff is read | Not a screen | The seven image ids of ORV-274 `images-1` stay and `scene-phone` is added, each used at least once, and no other image is used. Under the static folder only `orv-274/scene-phone.webp` and `orv-274/scene-phone.prompt.md` are added and nothing is changed. Every rendered generated photograph keeps its AI label: `honest-1` on the canvas, the band label in the landing. No `img` shows a page or an app (canvas-image-1) | `orivilo-canvas.test.ts`; `git diff --name-status origin/develop...HEAD -- packages/design-system/.storybook/static` lists exactly those two files, both added (`A`) |
| 14 | The locale catalog | check-i18n, the copy check and the landing unit test run | Not a screen | Every string of the landing and the canvas comes from the catalog: the new group `oriviloLanding` and the `orvCanvas` additions exist in `en.ts` and `th.ts` with the same keys and placeholders. No middot, no em dash. U+2060 appears only in the Thai `oriviloLanding.title` and `oriviloLanding.bandTitle`, never in English (R7). `phoneSub` and `landingNote` no longer say the copy is Thai only (R6) | check-i18n; copy check; `orivilo-landing.test.ts` |
| 15 | The PR head against `develop` | Reading the diff; the tests run | Not a screen | No change under `packages/design-system/src/components/`, `src/tokens/`, `src/recipes/`, `src/profiles/` or `apps/web/`: no public API, token, recipe class or contrast pair changes. No hunk inside `Scene` or `placeOnQuad`, and the `card` and `sign` scene records keep their values, so the ORV-308 lockups are unchanged and its check (each scene face holds an `img` of the lockup and no `svg`) still passes. `examples/landing.tsx` and its story are unchanged | `git diff --stat origin/develop...HEAD -- <the five paths>` is empty; reviewer reads the diff; `orivilo-canvas.test.ts` |
| 16 | The PR head | Quality gate | Not a screen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm contrast` pass; the contrast output is unchanged (no new pair) | Gate output |

## Rows that render nothing

- Rows: 7, 10, 13-16

## ORV-274 statements this spec replaces

These statements of `docs/specs/ORV-274/spec.md` v2.6 no longer hold for the canvas. Where the two
specs differ on the canvas story, this spec holds. ORV-274's file is not changed by this story.

- `live-only-1`, the component list: `Landing` and `BrandReportScreen` leave the canvas; the product
  stage renders `OriviloLanding`, `BusinessBoardScreen` and `GuidebookScreen`. New reading: the
  product stage nodes are `p-base`, `p-pat`, `p-landing`, `p-app` and `p-guide`, and the product
  preview pages are the landing, the app and the guidebook. canvas-image-1 adds to the rule.
- `structure-1`, the counts: 40 edges (29 input), 12 result nodes, seven sequences of 6, 3, 2, 6, 8,
  12 and 3 pages. New reading: row 10 of this spec. The 31 nodes, nine chapter stops, 5 direction
  pieces and 7 In use pieces stand; the In use pieces are in-use-1.
- `copy-1`, "Page strings go under `orvCanvas`": the canvas's strings still do; the landing's go
  under the new group `oriviloLanding`.
- Row 19, "Counts per `structure-1`": read the counts of row 10 of this spec.
- Row 24, the sheets: `p-base` no longer shows "Read this page" with Badge, Field, RadioGroup and
  Alert, and `p-pat` no longer shows Card, PageHeader, the `BrandReportScreen` form, SectionHeader,
  Notice and ReadingCard. New reading: rows 8 and 9 of this spec; the `orivilo` profile check stays.
- Row 25, "Landing first, then the form, then the analysed report", and "the report opens at its
  findings" (`[data-report]`). New reading: rows 5 and 6 of this spec.
- Row 26, "zero `img` and zero `picture`" in every product node and page. New reading: row 7 of
  this spec, which allows the landing's one band photograph.
- Row 27, its canvas half (`headingLevel={3}` in the preview and canvas frames): `BrandReportScreen`
  no longer renders on the canvas. Its `apps/web` half is untouched.
- Row 29, "the mark in every piece but the phone", the phone's live `Landing`, "the ink tile's
  intent `Button` is the only lime", and the lockup's construction guides. New reading: row 11 of
  this spec.
- Row 30, "Page 11's intent `Button`" (the ink tile's) and page 10's photo opener. New reading: row
  12 of this spec.
- Default 8, "`Landing` stays Thai only, and its preview caption and the phone piece's second line
  say so". New reading: R6 in section "Decided" and row 14 of this spec.
- W4, expected `12 7 40`. New reading: W2 of this spec, expected `14 8 42`.
- `images-1`, "seven images and no other": reads as eight, the seven and `scene-phone`; every other
  rule of `images-1` holds for it (webp, at most 400 KB, longest side at most 1600, the prompt word
  for word, the check). New reading: R5 in section "Decided" and row 13 of this spec.

## Open questions (defaults taken)

1. The base sheet count. The design says 18 entries; its table names 21, and each is in
   `packages/design-system/catalog/base/`. Options: (a) the 21 of the table; (b) cut three to
   reach 18. Default (a): the owner asked for more base components, and base-sheet-1 lists them.
2. Brandbook page 11. The design gives page 11 six placements. Options: (a) pieces B to G (the
   window moves to page 10); (b) six chosen by the designer. Default (b), as revision 2 of the
   design chooses them: B with its grid, A, C, the icon set, F, G. D stays on the board; E leaves
   the book (too small at 288). Their boxes are the design's page 11 table, and V8 checks them.
3. Copy the design's "Copy" section does not give. Defaults, which the designer may rewrite at
   sign-off:
   - `phoneSub` (design row 4.5, revision 4: it says the phone picture is made with AI): "Mockup:
     ORIVILO's own landing at 390, live, on an AI phone picture." / "ม็อกอัป: หน้าแรกของ ORIVILO
     เองที่ 390 ของจริง วางบนภาพโทรศัพท์ที่สร้างด้วย AI".
   - `landingNote`: the design's "landing note".
   - The window piece: caption "The app in a browser" / "แอปในเบราว์เซอร์", second line "Mockup: the
     real board screen with ORIVILO's own example board." / "ม็อกอัป: หน้ากระดานจริง
     กับกระดานตัวอย่างของ ORIVILO เอง".
   - The share piece: caption "Link share card" / "การ์ดเมื่อแชร์ลิงก์", second line "Drawn from the
     logo geometry." / "วาดจากโครงสร้างของโลโก้".
   - The icon piece: caption "App icon on a home screen" / "ไอคอนแอปบนหน้าจอโฮม", second line
     `iconSub` (design row 4.5, revision 4: it says the phone picture is made with AI): "Mockup: a
     drawn home screen with the real mark, on an AI phone picture." / "ม็อกอัป:
     หน้าจอโฮมที่วาดขึ้นพร้อมโลโก้จริง วางบนภาพโทรศัพท์ที่สร้างด้วย AI".
   - Revision 4: the new key `preview.bookSubUse` for page 11's caption, its strings in row 12; the
     picture's alt `orvCanvas.image.alt.scene-phone` "A blank phone standing upright on a violet
     backdrop, its display off" / "โทรศัพท์จอดับตั้งตรงบนฉากหลังสีม่วง" (design row 4.1).
   - New keys `studioName`, `grid`, `icons`, `iconsNote` as the design's copy table (revision 2).
   - The keys of the dropped lockup and ink tiles leave both catalogs.
   - Settled by the slice S4 build (comment 10838): `orvCanvas.use.shareTagline` is added for the
     share card's title; `use.drawn` and `use.start`, orphans of the lockup and ink tiles, are
     removed.
4. The landing story title. The design writes `Examples/OriviloLanding`; the examples folder names
   stories by tier. Default: `Examples/Marketing: ORIVILO landing`.
5. The AI label on the In use board. The design's V7 says "AI label on the photo"; ORV-274
   `honest-1` puts one label on the node's meta line and the preview caption, never under a tile.
   Default: `honest-1` holds.

## Out of scope

- C7: the rules do not read a Thai mood answer, so the Thai Font node says it cannot read the mood.
  A follow-up issue for the rules.
- C8: the guidebook has no visual specimens (colour chips, type samples, the logo on grounds). A
  follow-up issue for the guidebook.
- A new generated image other than `scene-phone`, `landing-make` included.
- Any change to the `Scene` function or the scene lockups of ORV-308; hiding the scene lockup at the
  far zoom level (ORV-308 sign-off S1, a follow-up).
- Any change to a shared component's public API, a token, a recipe or a profile.
- The existing `Landing` example file and its own story, which stay as they are.
- `apps/web`.

## Depends on

- `docs/specs/ORV-309/design.md`: proposals 1 to 6, "Chapter wiring", "Copy", "Honest labels",
  "Contract needs", "Rule changes for the owner", "Visual QA screens" V1 to V9, "Build slices" S1 to
  S4; revision 2: "Page 10: the opener", "Page 11: six placements on a tile grid", the copy table "In
  use and part 03 (revision 2)" and "Spec statements this revision changes"; revision 3: rows 3.1
  to 3.3 and the table "Revision 3" under "Spec statements this revision changes"; revision 4:
  rows 4.1 to 4.6, "States, revision 4" and the table "Revision 4" under "Spec statements this
  revision changes".
- ORV-309 comments 10829 (the image rule), 10830 (R1 to R9 and C1 to C9 decided), 10837 (the
  owner's app brand book reference and the designer's revision 2), 10838 (the slice S4 build's
  keys), 10839 (the owner's question on piece C and the decision), 10840 (the visual sign-off
  of 4a03cb5, F1 to F5), 10842 (the owner's ask for a real phone mockup and the main session's
  reading) and 10843 (the survey of the static build of c20cb1b: F4 still open; C12).
- `docs/specs/ORV-274/spec.md` v2.6: `live-only-1`, `structure-1`, `copy-1`, `honest-1`, `images-1`.
- ORV-308 (PR 249): the scene lockup drawn as an image, on which this story builds.
- `packages/design-system/src/examples/business-board.tsx`, `guidebook.tsx`,
  `business-fixtures.ts`, and `components/fixtures.ts` (`fixtureTaskJobsEn`).
- `DESIGN.md` §3.3, §7, §8 and §9; `.claude/rules/design-system.md`; ADR 0012 decision 4; ORV-274
  comment 10637.

## Worked examples

Not run, no shell in this role. Each runs from the repo root with `node -e`. Every output is an
integer, with no rounding, unless the example states its rounding (W6, W8).

W1. Edges by meaning (R1). Input: ORV-274's 29 input, 8 reference and 3 derived edges; the 15 edges
26 to 40 of `orivilo-canvas.data.ts`, all `"input"`, leave; the 11 edges of the design's "Chapter
wiring" table, all input, come in. Expected `36 25`.

```bash
node -e 'const input=29-15+11;console.log(input+8+3,input)'
```

W2. Result nodes and sequences (R2). Input: ORV-274's 12 result nodes (its W4), where `p-form`
and `p-report` are renamed `p-app` and `p-guide` and `p-base` and `p-pat` gain `open`; the design's
sequence lengths. Expected `14 8 42`.

```bash
node -e 'const r=12+2,s=[6,3,2,6,8,12,2,3];console.log(r,s.length,s.reduce((a,b)=>a+b))'
```

W3. World width (R3). Input: the design's product column at x 4892 and the product nodes' width
480 (`size.node.lg`). Expected `5372`.

```bash
node -e 'console.log(4892+480)'
```

W4. Base sheet entries (base-sheet-1), per column and in all. Input: the catalog names per column
of the design's proposal 5 table, as base-sheet-1 lists them (7, 7 and 7). Expected `7 7 7 21`.

```bash
node -e 'const c=[7,7,7];console.log(...c,c.reduce((a,b)=>a+b))'
```

W5. Page 11's layout grid and icon set (row 12). Input: the design's page 11 table, "two dashed
lines ... at 24 and 366 of the 390 screen" with the landing's `px-6` margin of 24, and "a 6 x 4 grid
of 24 glyphs". Expected `24 342 24 366 24`: the measure, the second line, the glyph count.

```bash
node -e 'const w=390,m=24;console.log(m,w-2*m,m,w-m,6*4)'
```

W6. Piece C's icon share and slots (row 11). Input: design row 3.1, "4 columns and 5 rows of 60 x
60 icons" on the 390 wide screen, one of them ORIVILO, kept unchanged in design px by design row
4.4 on the phone picture. Expected `0.154 19`: the icon's width over
the screen's, rounded to three places (inside 0.15 to 0.17), and the placeholder slots, an
integer.

```bash
node -e 'console.log((60/390).toFixed(3),4*5-1)'
```

W7. Page 11's bottom row on the top row's edges (row 12). Input: the design's row 3.3 table, top
row A 360 to 920 and C 932 to 1232; bottom row the icon set 360 to 632, F 644 to 920, G 932 to 1232. Expected `true true true`.

```bash
node -e 'const t=[360,920,932,1232];console.log(...[[360,632],[644,920],[932,1232]].map(([s,e])=>t.includes(s)||t.includes(e)))'
```

W8. Piece B's screen on the board, the `whole` crop (row 11, C5). Input: design row 4.1's webp of
800 x 1600 with the screen at x 95, w 611 and the corner 80, and design row 4.2's board tile of
246.4 x 529.33. Method: `s = max(tile.w / 800, tile.h / 1600)`, `dx = (tile.w - 800 s) / 2`, the
screen's x `dx + 95 s`, its corner `80 s`, its scale `k = 611 s / 390`. Expected
`0.33083 22.30 26.5 0.5183`: s to five places, x to two, the corner to one and k to four, each
rounded to nearest by `toFixed` (no value here sits on a tie), as row 4.2's table gives them.

```bash
node -e 'const w=246.4,h=529.33,s=Math.max(w/800,h/1600),dx=(w-800*s)/2;console.log(s.toFixed(5),(dx+95*s).toFixed(2),(80*s).toFixed(1),(611*s/390).toFixed(4))'
```

## Changelog

- v1.0 (2026-11-25): first version, task ORV-309-spec-1, from the owner's four messages of
  2026-11-25, comment 10829 and the decisions of comment 10830. Rules canvas-image-1,
  intent-once-1, base-sheet-1 and in-use-1; rows 1 to 16; five open questions with defaults. To
  review downstream: the builder envelopes for slices S1 to S4, the designer sign-off envelope (open
  questions 2 and 3, V1 to V9), the qa envelope (every row; no PR number yet), and
  `docs/specs/ORV-309/design.md` where it says 18 entries, `Examples/OriviloLanding` and V7's label.
- v1.1 (2026-11-25): task ORV-309-spec-v1-1, from the owner's app brand book reference (comment 10837) and the design's revision 2, table "In the spec". in-use-1 pieces A, C and E, page 10 and
  page 11; open question 2's default to (b); open question 3's window, share and icon copy and the
  new keys; rows 11 and 12; W5 added. Rows 1 to 10 and 13 to 16, the counts and W1 to W4 unchanged.
  To review downstream: the builder envelope for slice S4, the designer sign-off envelope (V7 to
  V9), the qa envelope (rows 11 and 12), and the locale files `en.ts` and `th.ts`.
- v1.2 (2026-11-25): task ORV-309-spec-v1-2, from the owner's question on piece C (comment 10839),
  the visual sign-off findings F2 and F5 (comment 10840) and design revision 3, table "Revision 3".
  Why gains the comments; in-use-1 piece C is a home screen at true scale; open question 3 records
  the keys the build settled (comment 10838); rows 11 and 12 as that table gives them; W6 and W7
  added. Rows 1 to 10 and 13 to 16, the counts and W1 to W5 unchanged. To review downstream: the
  builder envelope for slice S5, the designer sign-off envelope (V7 to V9), the qa envelope (rows
  11 and 12).
- v1.3 (2026-11-25): task ORV-309-spec-v1-3, from the owner's ask for a real phone mockup (comment
  10842), the survey of the static build that keeps sign-off finding F4 open (comment 10843) and
  design revision 4, table "Revision 4". Why gains the two comments; What is real (Images), R5,
  C5, in-use-1 pieces B and C, rows 11, 12 and 13, open question 3 (`phoneSub`, `iconSub`,
  `preview.bookSubUse`, the `scene-phone` alt), Out of scope, the ORV-274 statement `images-1` and
  Depends on as that table gives them; row 12 also states page 11's missing state (design row
  4.5). New decided item C12, the chapter camera, pointed to from row 5's expected and check cells.
  W6's input names row 4.4; W8 added. Rows 1 to 4, 6 to 10 and 14 to 16, the counts and W1 to W5
  and W7 unchanged. To review downstream: the builder envelope for slice S6 and for the C12 camera
  fix, the designer sign-off envelope (V7 to V9 and F4), the qa envelope (rows 5, 11, 12 and 13),
  `orivilo-canvas.test.ts` (8 image ids), and the MissingImages, chapter and preview plays.
