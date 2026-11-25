# ORV-309 design: the prototype canvas shows ORIVILO as a real digital product

Status: proposal for the owner. Designer, 2026-11-25. Nothing here is built yet. Every picture below is a render of real design-system components, tokens, profiles and recipes, made in a scratch app. No colour was invented. No image was generated.

## Source intent

The owner's words of 2026-11-25, in Thai, summarised:

1. The applications on the In use board look plain.
2. The landing should be a cooler page: dark, in English. It may use generated images.
3. The product is made of nodes. The brand guideline should show a digital product brand with modern UX and UI, not only paper and signs.
4. The base and composed components are plain, and there should be many more of them.
5. The prototype should show the landing, the real product website (the node work) and the CI work (the guidebook).
6. "Excellent UI, no UI slop, no AI slop."

How the intent becomes design:

- (2), (3) and (5) make the real product the hero of every chapter. The landing's main visual is ORIVILO's own board, drawn by the real `CanvasBoard`. Photographs are only atmosphere.
- (1) and (3) give the In use board a digital lead: the app window, the landing on a phone, the app icon and the link share image take five of seven cells. Paper and the sign keep two.
- (4) shows the components as they are used. The base sheet shows 18 components in 3 groups with their states. The composed sheet is a working Studio: board, node toolbar, controls, task bar, inspector and the rules chat.
- (6) is met with craft, not decoration. Each chapter has one start edge, one accent per screen, real data or an honest label, and nothing that moves at rest.

ORIVILO is the brand on show here, not a customer, so the ORIVILO profile and its lime intent button may appear inside these previews. See rule change R8.

## Structure, top down

The canvas keeps its 7 chapters and its node count. This design changes 3 of them and adds proof of 1 new example.

| Level                | Today (ORV-274)                          | After ORV-309                                                                                 |
| -------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| Chapters             | 7                                        | 7 (04 In use, 05 Brandbook part 03, 06 Design system and 07 Product change)                   |
| Nodes                | 31                                       | 31                                                                                            |
| Edges                | 40 (29 input, 8 reference, 3 derived)    | 36 (25 input, 8 reference, 3 derived), R1                                                     |
| Result nodes         | 12                                       | 14 (`p-base` and `p-pat` now open pages), R2                                                  |
| Preview sequences    | 7, `[6,3,2,6,8,12,3]` = 40 pages         | 8, `[6,3,2,6,8,12,2,3]` = 42 pages, R2                                                        |
| World                | 4912 x 2260                              | about 5372 x 2260, R3                                                                         |
| In use pieces        | 7                                        | 7, a new mix with digital pieces leading, R4                                                  |
| Brandbook p11 pieces | 7 placements                             | 6 placements; the p10 opener becomes the app window, R4                                       |
| Images               | 7                                        | 7 (default) or 8 if the one brief below is generated, R5                                      |
| New example          | none                                     | `examples/orivilo-landing.tsx`: ORIVILO's own dark landing, English by default, Thai complete |
| Existing `Landing`   | the Thai customer landing in `p-landing` | unchanged as a file and story; it leaves the canvas                                           |

The six proposals below follow the envelope's order. Each has its parts, its layout, its states and a walk of DESIGN.md §9 and §3.3.

## Proposal 1: ORIVILO's own landing (dark, English, Thai complete)

New file `packages/design-system/src/examples/orivilo-landing.tsx`. Export `OriviloLanding({ lang?: "en" | "th" = "en", width?: number })`. It renders inside `DesignProfileBoundary profile={BRAND_PROFILES[0]} mode="dark"`, which is the ORIVILO profile. The example sets no colour of its own. Every surface is a `--ds-*` token.

### Sections, in order (1280 wide; container `max-w-[1184px]`, `px-6` below 720)

| #   | Section   | Parts (catalog entry, props)                                                                                                                                                                                                                                                                                                                                                                                                          | Layout and tokens                                                                                                                                                                          |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Header    | `logo` `Logo kind="horizontal" height={24} decorative`; 3 nav links `text-label-md text-text-secondary`; `button` `Button variant="ghost" size="sm"` Sign in                                                                                                                                                                                                                                                                          | `py-5`, nav `gap-8`, hidden under 720                                                                                                                                                      |
| 2   | Hero      | `h1` `font-display text-display-lg` (56/1.2), `text-display-md` under 720, `text-balance`; lede `text-body-lg text-text-secondary`; the one intent button `Button variant="intent" size="lg"` inside `<span data-design-profile="neutral" data-mode="light" className="contents">`; `Button variant="secondary" size="lg"` See how it works                                                                                           | 2 columns `1fr 1fr` from 960, `gap-16`, `pt-14`; one column below, `gap-6`, `pt-12`                                                                                                        |
| 3   | The board | `canvas-board` `CanvasBoard variant="present" chrome={false} minimap={false} label=… renderBody=…`; 6 `canvas-node` (`size: "custom"`, `pad` text or media), 6 `canvas-edge` `{ type: "orivilo", data: { meaning: "input", label: false } }`, `node-port` kinds text, image, palette, profile. Bodies use `logo`, `input` `Input size="sm"`, `button` `Button variant="primary" size="sm"`, `badge` `Badge variant="brand" size="sm"` | height 440, `pt-12`; caption `text-body-sm text-text-secondary` `mt-3`. Under 720 the narrow graph has 3 nodes and 2 edges (logo, colour, guidebook) at height 400                         |
| 4   | Work      | `BusinessBoardScreen access="ready" view={ENGLISH_VIEW or THAI_VIEW}` scaled from 1280 into a 760 wide frame, height 500, `rounded-container border border-border-subtle`; `h2 text-display-md`; 3 points, each `border-t border-border-subtle py-5`, `h3 text-heading-sm`, `text-body-md text-text-secondary`                                                                                                                        | `grid-cols-[1fr_360px]` from 960, `gap-16`, `pt-28`. Under 720 the app frame is hidden (a 1280 app scaled to 342 is unreadable) and the 3 points carry the section                         |
| 5   | Band      | `h2 font-display text-display-lg text-brand-ink`, `text-body-lg text-brand-ink`, AI label `text-body-xs text-brand-ink`; one photograph `object-cover min-h-[360px]`                                                                                                                                                                                                                                                                  | full bleed, `mt-28`, `background: var(--ds-brand-signature)` in a `data-design-profile="neutral" data-mode="light"` scope (#7A22C7 with brand ink). 2 columns from 960; text `px-12 py-24` |
| 6   | Guidebook | `GuidebookScreen access="ready" guidebook={done(lang)}` in a frame scaled from 760 (390 under 720), height 460 (480), cropped with the bottom fade (contract need C1)                                                                                                                                                                                                                                                                 | `grid-cols-[360px_1fr]` from 960, text `pt-10`                                                                                                                                             |
| 7   | Close     | `h2 text-display-md text-balance max-w-[760px]`; `Button variant="primary" size="lg"` with the same words as the hero button                                                                                                                                                                                                                                                                                                          | `py-28`, `gap-8`                                                                                                                                                                           |
| 8   | Footer    | `Logo kind="horizontal" height={20}`, tagline and the concept label, `text-body-sm text-text-secondary`                                                                                                                                                                                                                                                                                                                               | `border-t border-border-subtle py-8`                                                                                                                                                       |

Why this shape. The first screen says what ORIVILO is in one line and shows it at once: the board is ORIVILO's own work, from brief to product, built from the parts a customer will use. The work section shows the real app screen, not a drawing of it. The violet band is the one brand plane on the page and carries the essence "Make intent tangible." The guidebook shows the CI work. There is no feature grid, no logo wall, no testimonials and no numbers, because ORIVILO has no data for them.

### Narrow (390) rules

- `h1` drops to `text-display-md`. Thai display copy keeps U+2060 word joiners inside words that the line breaker would split: `ไอ|เดีย|มี|ตัว|ตน` and `ได้|จริง` in the title, `จับ|ต้อง|ได้` in the band title (R7).
- The board uses the narrow graph: logo (0,0, w150), colour (0,230, w150) and guidebook (200,100, w200). The guidebook cover drops the large mark and lets the title run to 85%.
- The app frame is hidden; the guidebook frame scales from 390.
- Buttons wrap. They never shrink below `size.control.min-height` lg 48.

### States

| State                  | What shows                                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default                | The render below                                                                                                                                                |
| Hover, focus, disabled | The `button` recipe's own states. In the story the buttons are real and focusable; inside a canvas node the whole preview is inert (`tabIndex={-1}`, View only) |
| Photograph missing     | The band shows its text column at full width on the violet plane, and the AI label is not rendered (the label belongs to the photo, never alone)                |
| Board data missing     | Not possible: the board is a fixed example graph. The story `MissingImages` keeps the band rule above                                                           |
| Guidebook gaps         | `GuidebookScreen` already says "not decided yet" for empty parts; the crop shows them as they are                                                               |
| Reduced motion         | Nothing on the page animates. The board is present (no drag, no running gradient)                                                                               |
| Thai                   | Complete; Anuphan headings, Sarabun body at 1.7, no tracking                                                                                                    |

### Rendered proof (dark, 2x)

- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p1-landing-en-dark-full.png`: the full page at 1280.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p1-landing-en-dark-first-screen.png`: the first screen at 1280 x 800.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p1-landing-th-dark-full.png`: Thai, full page at 1280.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p1-landing-en-dark-390-full.png`: English at 390, full page.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p1-landing-th-dark-390-full.png`: Thai at 390, full page.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p1-landing-en-dark-390-first-screen.png`: English at 390, first screen.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p1-landing-th-dark-390-first-screen.png`: Thai at 390, first screen; the title sits on two clean lines.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p1-landing-en-dark-390-hero.png`: the narrow board, English.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p1-landing-th-dark-390-hero.png`: the narrow board, Thai.

### DESIGN.md walk

| Check                               | Result       | Reason                                                                                                                               |
| ----------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| §9.1 near-black with acid accent    | pass         | Lime is one button on the page (the hero). The close button is primary violet. Violet is a plane, not a glow. No signature glow      |
| §9.2 broadsheet                     | pass         | 28-unit section spacing, pill controls, rounded media and containers                                                                 |
| §9.3 card kit                       | pass         | The only rounded boxes are the board (container 16) and two frames (container 16); the points are hairline rows, not cards           |
| §9.4 template chrome                | pass         | No eyebrow, no caps, no middot, no arrows on links, no monospace labels                                                              |
| §9.5 one accented word              | pass         | Headlines are one colour                                                                                                             |
| §9.6 ambient motion                 | pass         | No reveal or hover animation added                                                                                                   |
| §9.7 numbered markers               | pass         | The 3 points are not numbered                                                                                                        |
| §9.8 lime as status, violet as tint | pass         | Lime is an action only; violet is the brand signature at full strength; focus comes from `focus.*`                                   |
| §9.9 Thai set with Latin rules      | pass         | Thai at 1.7, no tracking, no caps; word joiners keep words whole                                                                     |
| §9.10 Studio style in a preview     | pass by R8   | The lime button is ORIVILO's own intent on ORIVILO's own page, not a customer preview. R8 asks the owner to confirm                  |
| §9.11 fake evidence                 | pass         | No counts, ratings, logos of customers or quotes. "A concept preview with sample projects." in the footer; the AI label on the photo |
| §9.12 per-page mood patch           | pass with C1 | The crop fade needs a mask colour today; C1 moves it into a recipe                                                                   |
| §3.3 radius                         | pass         | Pills 999; board and frames container 16; photo bleeds full width with no radius; no media inside a radius-less parent               |
| §3.3 depth                          | pass         | Flat; `border.subtle` marks the frames in dark; no shadow; no glow                                                                   |
| §3.3 space                          | pass         | 4, 8, 12, 16, 24, 32, 48 steps; section gaps 112 (`pt-28`) are layout, not a new token                                               |
| §3.3 size                           | pass         | Buttons lg 48; nodes 220 to 280 wide on the hero board, custom size                                                                  |
| §3.3 motion                         | pass         | Nothing loops; reduced motion has nothing to remove                                                                                  |

## Proposal 2: the product node for the real app (`p-app`)

`p-form` becomes `p-app`. Its body is the real `BusinessBoardScreen access="ready" view={ENGLISH_VIEW or THAI_VIEW}` inside a 1280 x 800 design frame scaled into the node's media slot (460 x 288). Under it, one row: `Badge variant="warning" size="sm"` "Sample data" (the same honest badge the canvas uses today at `orivilo-canvas.tsx` 1943, 2044, 2129) and a one-line note `text-body-xs text-text-secondary`.

Node: `kind: "artifact"`, `size: "custom"`, `width: 480` (`size.node.lg`), `pad: "media"`, `open: { count: 1 }`. Inputs: Board and Panels from `p-pat`, Inputs from `p-base` (edges in R1).

The inner board must be fitted at its real 1280 x 800 size. In the proof it fits only when the outer node is inside the viewport at mount; a story play scrolls the node into view before it asserts or shoots (C4).

Proof:

- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p2-p3-product-nodes-en-dark.png`: the three product nodes (Landing, The app, Brand guidebook) on a present board, English.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p2-p3-product-nodes-th-dark.png`: the same in Thai.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p2-product-app-en-dark.png`: the app page as it opens from the node, 1280.

Walk: §9.3 pass (each node has one media slot and one label row; the nodes keep the canvas's node shape, not a new card). §9.10 pass (the app is ORIVILO's own product in the neutral Studio shell). §9.11 pass ("Sample data" badge and "Sample project." note). §3.3 radius pass (media 12 inside the node's container 16). Depth pass (nodes on a present board keep the `border.subtle` hairline). Size pass (480 = `size.node.lg`). Motion pass.

## Proposal 3: the product node for the CI work (`p-guide`)

`p-report` becomes `p-guide`. Its body is the real `GuidebookScreen access="ready" guidebook={done(lang)}` from an 800 wide design, starting at the "Brand foundation" heading (`[data-section="foundation"]`) and fading out over the last 40 px (C1, C2). Same badge row: "Sample data", note "Assembled by fixed rules. Sample project." The cover of the guidebook already says it is rule-based; the note says it again where the crop hides the cover.

Why from the foundation heading: the cover is mostly one violet plane, and the landing's guidebook node already shows a cover. The foundation section shows the CI work itself: positioning, personality and the reason under each.

Proof:

- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p3-product-guide-en-dark.png`: the crop starts at the heading, English.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p3-product-guide-th-dark.png`: the same heading in Thai, at the same place; the Thai marks of the first line are whole.
- The node itself is in the two `p2-p3-product-nodes-*` PNGs above.

Walk: §9.9 pass (no Thai glyph is cut at the top edge, because the crop starts at an element, not a pixel). §9.11 pass. §9.12 pass with C1. §3.3 as proposal 2.

The `p-landing` node (third product node) shows `OriviloLanding` at 1280, with `Badge` "Mockup" and the note "ORIVILO's own landing page, in English and Thai." In a Thai canvas the node shows the Thai landing.

## Proposal 4: the In use board, digital first

Still 7 pieces on the 1280 x 800 grid (cols x 0, 258.4, 516.8, 775.2, 1033.6; rows y 0, 270.67, 541.33; cell 246.4 x 258.67; gutter 12), every piece `rounded-media`.

| Piece | Cells (col, row)   | What                                                                                                                                                                                                                | Source                                                                  |
| ----- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| A     | c0 to c2, r0 to r1 | The app window: ORIVILO's board in its shell (`Logo kind="mark"`, `Breadcrumb`, `Tabs` with `TabsList size="sm"`, `Avatar size="sm"`, the hero board), dark, on a violet flood, bleeding off the end and the bottom | `AppWindow`, new, in the canvas example                                 |
| B     | c3, r0 to r1       | A phone with the narrow dark landing at 390 on a paper flood                                                                                                                                                        | `OriviloLanding width={390}`                                            |
| C     | c4, r0             | The app icon: the mark on an ink square, on violet                                                                                                                                                                  | `Logo kind="mark"`                                                      |
| D     | c4, r1 to r2       | The hero photograph                                                                                                                                                                                                 | existing `brand-hero.webp`, AI label kept                               |
| E     | c0 to c1, r2       | The link share image: ink, the horizontal logo, the tagline in `text-display-md`, a giant ring in the brand signature running off the edge                                                                          | geometry from `logo/geometry` (`GEOMETRY`, `RING_STROKE`, `DOT_RADIUS`) |
| F     | c2, r2             | The card scene                                                                                                                                                                                                      | existing `scene-card.webp`, lockup by ORV-308, unchanged                |
| G     | c3, r2             | The sign scene                                                                                                                                                                                                      | existing `scene-sign.webp`, lockup by ORV-308, unchanged                |

Dropped: the lockup tile and the ink tile. Both now live inside other pieces: the lockup is on the share image, and ink is the ground of the icon and the share image.

One intent button on the board: the landing in the phone carries it; the app window has none.

Proof:

- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p4-inuse-en-dark.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p4-inuse-th-dark.png`

Walk: §9.1 pass (one lime button, small, in the phone). §9.3 pass (pieces differ in size, ground and content; no shadow except the phone and icon, which are objects on a surface, `shadow-overlay`). §9.7 pass (no numbers). §9.10 pass (ORIVILO is the brand). §9.11 pass (AI label on the photo; the phone and window carry the sample project). §3.3 radius pass (media 12 per piece); the phone and icon corners are object geometry, see C5. Motion pass.

## Proposal 5: the base components sheet

A 1280 x 800 sheet inside `DesignProfileBoundary profile={ORIVILO}`, three columns, each `Column` with a `text-heading-sm` title and items labelled with their catalog name (`text-label-sm text-text-secondary`). Catalog names stay in Latin in both languages because they are code names.

| Column                 | Catalog entries and props                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actions and navigation | `button`: `variant` primary, secondary, ghost; `destructive size="sm"`; `primary size="sm" loading loadingLabel`; `secondary size="sm" disabled`; `link size="sm"`. `toggle-group`: `ToggleGroup type="single" size="sm"` with 2 items (in a `flex` wrapper so it does not stretch). `tabs`: `TabsList size="sm"`, a trigger with `count={3}`. `breadcrumb`: 2 `BreadcrumbLink`. `kbd`: `Kbd shortcut="Mod+K"`. `avatar`: `Avatar name size="md"`. `featured-icon`: `variant` info and success, `size="md"` |
| Inputs                 | `field` + `input`: `required`; `error` with a message that says how to fix it. `field` + `select`. `checkbox` with `label defaultChecked`. `switch` with `aria-label`. `slider` with `label defaultValue={16} max={24}`. `field` + `textarea`: `rows={3} maxLength={280} showCount`                                                                                                                                                                                                                         |
| Status and feedback    | `badge`: brand, success "Agreed", warning "Sample data", info "Rule-based". `tag`: 3 with the first `defaultSelected`. `radio-group`: 2 `RadioGroupItem` with labels. `progress`: `label value={60}`. `alert`: `variant="info" title description` ("Read by rules, no AI"). `spinner`: `size="sm" label labelHidden`. `skeleton`: `shape="text"` twice                                                                                                                                                      |

That is 18 entries with default, hover-ready, selected, disabled, loading, error and empty (skeleton) visible. The focus state is not in a still; the story play focuses "Project name" and the QA shot captures the ring (V5).

Proof:

- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p5-base-en-dark.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p5-base-en-light.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p5-base-th-dark.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p5-base-th-light.png`

Walk: §9.2 pass (air between items, `gap-6`). §9.3 pass (no card per item; columns are separated by space and one hairline). §9.4 pass (labels are catalog names in sentence form, no caps). §9.8 pass (warning badge means sample, success means agreed, never lime). §9.9 pass (Thai field labels and values at 1.7; the long Thai brief wraps in the textarea). §9.11 pass (the badges describe the sample, not an outcome). §3.3 pass (controls pill, inputs pill per recipe, alert container 16; sizes sm 32 and md 40).

## Proposal 6: the composed components sheet

A 1280 x 800 sheet: a working Studio, edit variant.

| Area              | Catalog entries and props                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Board (880 wide)  | `canvas-board` `CanvasBoard label minimap={false}` (edit, chrome on), 5 nodes from real blocks through `nodeForBlock(blockById(id), id, pos, lang)`: Brief, Brand personality, Audience, Mood and theme (selected), Font, with answers in the right language. 4 `canvas-edge` input edges; Audience to Mood has `label: false` (C3). `node-toolbar` over the selected node. `canvas-controls`. `task-bar` `TaskBar jobs={fixtureTaskJobsEn or fixtureTaskJobs} defaultExpanded={false}` |
| Panels (400 wide) | `inspector` `Inspector graph onAnswer` for the selected node, in a `rounded-container border border-border-card` box. `canvas-chat` `CanvasChat variant="sidebar" basis="rules" onAsk` with one rules reply in the sheet's language                                                                                                                                                                                                                                                     |

States on the sheet: selected node (selection ring), unselected, waiting (Audience waits for Brief answers), Font with an open answer, rules reply in the chat with its "By rules" basis, task bar collapsed. Focus is shown by a play (V6).

Proof:

- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p6-composed-en-dark.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p6-composed-en-light.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p6-composed-th-dark.png`
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-309-design/shots/p6-composed-th-light.png`

Findings seen in these renders (not blockers for the design, each in Contract needs): the React Flow attribution is half covered by the task bar at the bottom edge (C6); the Thai Font node reads "ยังอ่านมู้ดไม่ออก" because the rules do not read a Thai mood answer (C7).

Walk: §9.3 pass (board, inspector and chat are three different surfaces). §9.6 pass (no running gradient: no job is running at rest). §9.8 pass (selection keeps its own ring; focus is separate). §9.10 pass (neutral Studio shell around ORIVILO's profile). §9.11 pass (the chat answer is labelled as rules, not AI). §3.3 pass (overlay toolbar radius 24 per recipe, container 16, node sizes from blocks).

## Chapter wiring (06 and 07)

- `p-base` and `p-pat` keep their ids, become 560 wide result nodes (`open: { count: 2 }`) showing the two sheets scaled from 1280 x 800, and open one new 2-page sequence "Design system" (base, composed). `p-base` outputs 3 ports: Actions, Inputs, Display. `p-pat` takes the same 3 as inputs and outputs Board and Panels. Port `kind` stays what edges 27 to 31 use today.
- Product column: `p-landing`, `p-app`, `p-guide`, 480 wide, each `open: { count: 1 }` into the existing 3-page product sequence (now landing, app, guidebook).
- Positions: `p-base` x 3464, `p-pat` x 4136, the product column x 4892. The world grows to about 5372 wide (R3).

Edges 26 to 36 (replacing 26 to 40), all `meaning: "input"`:

| #   | From               | To          |
| --- | ------------------ | ----------- |
| 26  | `bb-cover` profile | `p-base`    |
| 27  | `p-base` actions   | `p-pat`     |
| 28  | `p-base` inputs    | `p-pat`     |
| 29  | `p-base` display   | `p-pat`     |
| 30  | `p-base` actions   | `p-landing` |
| 31  | `p-pat` board      | `p-landing` |
| 32  | `p-pat` board      | `p-app`     |
| 33  | `p-pat` panels     | `p-app`     |
| 34  | `p-base` inputs    | `p-app`     |
| 35  | `p-base` actions   | `p-guide`   |
| 36  | `p-base` display   | `p-guide`   |

## Copy (English and Thai)

All strings go to the locale catalog with the example (`packages/design-system/src/i18n`, new group `oriviloLanding` and additions to the canvas group). Sentence case, no middot, no em dash.

### Landing

| Key        | English                                                                                                                                                                       | Thai                                                                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nav        | Product / How it works / Guidebook                                                                                                                                            | ผลิตภัณฑ์ / วิธีทำงาน / คู่มือแบรนด์                                                                                                                                             |
| signIn     | Sign in                                                                                                                                                                       | เข้าสู่ระบบ                                                                                                                                                                      |
| title      | Give your ideas a world.                                                                                                                                                      | ให้ไอเดียมีตัวตน และไปต่อได้จริง (with word joiners, R7)                                                                                                                         |
| lede       | ORIVILO turns a business brief into a brand and a product, on one board of connected nodes. Every piece keeps the reason it was made, so the next change starts from the why. | ORIVILO เปลี่ยนบรีฟธุรกิจให้เป็นแบรนด์และผลิตภัณฑ์ บนกระดานเดียวที่ทุกโหนดเชื่อมถึงกัน ทุกชิ้นงานจำได้ว่าเกิดขึ้นเพราะอะไร การแก้ครั้งต่อไปจึงเริ่มจากเหตุผล ไม่ใช่เริ่มจากศูนย์ |
| start      | Start from your brief                                                                                                                                                         | เริ่มจากบรีฟของคุณ                                                                                                                                                               |
| see        | See how it works                                                                                                                                                              | ดูวิธีทำงาน                                                                                                                                                                      |
| boardNote  | ORIVILO's own board, from brief to product.                                                                                                                                   | กระดานของ ORIVILO เอง ตั้งแต่บรีฟถึงผลิตภัณฑ์                                                                                                                                    |
| workTitle  | Work where the decisions are.                                                                                                                                                 | ทำงานตรงที่การตัดสินใจเกิดขึ้น                                                                                                                                                   |
| point 1    | Every answer is a node. / Your brief, your audience and your positioning each sit on the board, joined to what they feed.                                                     | ทุกคำตอบคือโหนด / บรีฟ กลุ่มเป้าหมาย และจุดยืนของแบรนด์ อยู่บนกระดาน เชื่อมกับสิ่งที่มันส่งต่อไป                                                                                 |
| point 2    | AI drafts, you decide. / Positioning options arrive drafted by AI and name the model that wrote them. Pick one, edit it or write your own.                                    | AI ร่าง คุณตัดสิน / ตัวเลือกจุดยืนที่ AI ร่างมา บอกชัดว่าโมเดลไหนเป็นคนเขียน จะเลือก แก้ หรือเขียนเองก็ได้                                                                       |
| point 3    | Rules you can read. / The brand guidebook is put together from the board by fixed rules, and its cover says so.                                                               | กฎที่อ่านออก / คู่มือแบรนด์ประกอบขึ้นจากกระดานด้วยกฎที่ตายตัว และบอกไว้ตั้งแต่หน้าปก                                                                                             |
| appNote    | The board screen with a sample project.                                                                                                                                       | หน้ากระดานกับโปรเจกต์ตัวอย่าง                                                                                                                                                    |
| bandTitle  | Make intent tangible.                                                                                                                                                         | ทำให้เจตนาจับต้องได้ (with word joiners, R7)                                                                                                                                     |
| bandText   | A loop that does not close, and the dot it stays connected to. A product keeps becoming.                                                                                      | วงที่ไม่ปิด กับจุดที่ยังเชื่อมอยู่เสมอ ผลิตภัณฑ์ที่เติบโตต่อไปได้                                                                                                                |
| aiPhoto    | Photograph made with AI.                                                                                                                                                      | ภาพถ่ายนี้สร้างด้วย AI                                                                                                                                                           |
| guideTitle | A guidebook that remembers why.                                                                                                                                               | คู่มือแบรนด์ที่จำได้ว่าเพราะอะไร                                                                                                                                                 |
| guideText  | Logo type, colour and type, each with the answer it came from. What is not decided yet says so.                                                                               | ประเภทโลโก้ สี และตัวอักษร มาพร้อมคำตอบที่เป็นที่มา ส่วนที่ยังไม่ได้ตัดสินใจก็บอกไว้ตรง ๆ                                                                                        |
| closeTitle | Bring a brief. Leave with a board you can build on.                                                                                                                           | เอาบรีฟมา แล้วกลับไปพร้อมกระดานที่สร้างต่อได้                                                                                                                                    |
| tagline    | From intent to identity to product.                                                                                                                                           | จากเจตนา สู่ตัวตน สู่ผลิตภัณฑ์                                                                                                                                                   |
| concept    | A concept preview with sample projects.                                                                                                                                       | ตัวอย่างแนวคิด ใช้โปรเจกต์ตัวอย่าง                                                                                                                                               |

### Hero board

| Key                    | English                                                                           | Thai                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| label                  | ORIVILO's own board, from brief to product                                        | กระดานของ ORIVILO เอง ตั้งแต่บรีฟถึงผลิตภัณฑ์                                         |
| brief / briefText      | Brief / Make intent tangible.                                                     | บรีฟ / ทำให้เจตนาจับต้องได้                                                           |
| briefMeta              | Brand essence                                                                     | แก่นของแบรนด์                                                                         |
| positioning / text     | Positioning / A brand-to-product workspace where every decision keeps its reason. | จุดยืนของแบรนด์ / พื้นที่ทำงานจากแบรนด์สู่ผลิตภัณฑ์ ที่ทุกการตัดสินใจยังมีเหตุผลกำกับ |
| agreed                 | Agreed                                                                            | ตกลงแล้ว                                                                              |
| logo, colour           | Logo, Colour                                                                      | โลโก้, สี                                                                             |
| guidebook / guideTitle | Brand guidebook / Brand guidelines                                                | คู่มือแบรนด์ / แนวทางแบรนด์                                                           |
| product / start        | Product / Start a project                                                         | ผลิตภัณฑ์ / เริ่มโปรเจกต์                                                             |
| ports                  | Text, Image, Palette, Profile                                                     | ข้อความ, ภาพ, ชุดสี, โปรไฟล์                                                          |

### Sheets, product nodes and ports

| Key                   | English                                                                                               | Thai                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| actions               | Actions and navigation                                                                                | ปุ่มและการนำทาง                                                                             |
| inputs                | Inputs                                                                                                | ช่องกรอกข้อมูล                                                                              |
| status                | Status and feedback                                                                                   | สถานะและการแจ้งเตือน                                                                        |
| buttons               | Start a project / Open the board / Skip / Remove node / Saving / Publish / Read the guidebook         | เริ่มโปรเจกต์ / เปิดกระดาน / ข้ามไปก่อน / ลบโหนด / กำลังบันทึก / เผยแพร่ / อ่านคู่มือแบรนด์ |
| views                 | Board / List / Guidebook / History / Projects / Command menu                                          | กระดาน / รายการ / คู่มือแบรนด์ / ประวัติ / โปรเจกต์ / เมนูคำสั่ง                            |
| fields                | Project name / Website address / Language / Brief                                                     | ชื่อโปรเจกต์ / ที่อยู่เว็บไซต์ / ภาษา / บรีฟ                                                |
| siteError             | Add the full address, starting with https://                                                          | ใส่ที่อยู่ให้ครบ โดยขึ้นต้นด้วย https://                                                    |
| options               | English / Thai / Thai and English / Dark mode / Corner radius                                         | อังกฤษ / ไทย / ไทยและอังกฤษ / โหมดมืด / ความโค้งของมุม                                      |
| briefValue            | A workspace that turns a brief into a brand and a product, and keeps the reason behind each decision. | พื้นที่ทำงานที่เปลี่ยนบรีฟให้เป็นแบรนด์และผลิตภัณฑ์ และเก็บเหตุผลของทุกการตัดสินใจไว้       |
| radio                 | Whose website is this? / My own brand / A competitor                                                  | เว็บไซต์นี้เป็นของใคร / แบรนด์ของฉันเอง / คู่แข่ง                                           |
| badges                | Agreed / Sample data / Rule-based                                                                     | ตกลงแล้ว / ข้อมูลตัวอย่าง / ตามกฎ                                                           |
| voice tags            | Thoughtful / Clear / Reasoned                                                                         | รอบคอบ / ชัดเจน / มีเหตุผล                                                                  |
| owner (sample person) | Mali Srisuk                                                                                           | มะลิ ศรีสุข                                                                                 |
| progress, spinner     | Reading the page / Loading the board                                                                  | กำลังอ่านหน้าเว็บ / กำลังโหลดกระดาน                                                         |
| alert                 | Read by rules, no AI / These numbers come from fixed rules, not from a test of accuracy.              | อ่านตามกฎ ไม่ได้ใช้ AI / ตัวเลขเหล่านี้มาจากกฎที่ตายตัว ไม่ใช่ผลทดสอบความแม่นยำ             |
| studio                | Studio, sample board                                                                                  | สตูดิโอ กระดานตัวอย่าง                                                                      |
| rules reply           | Mood and theme has a feeling and a personality. Its audience still needs the main users.              | มู้ดและธีมมีความรู้สึกและบุคลิกแล้ว ส่วนกลุ่มผู้ใช้ยังต้องบอกว่าใครคือผู้ใช้หลัก            |
| node titles           | Landing / The app / Brand guidebook                                                                   | หน้าแรก / แอป / คู่มือแบรนด์                                                                |
| landing note + badge  | ORIVILO's own landing page, in English and Thai. / Mockup                                             | หน้าแรกของ ORIVILO เอง มีทั้งภาษาไทยและอังกฤษ / ภาพจำลอง                                    |
| app note + badge      | The real board screen. Sample project. / Sample data                                                  | หน้ากระดานจริง โปรเจกต์ตัวอย่าง / ข้อมูลตัวอย่าง                                            |
| guide note + badge    | Assembled by fixed rules. Sample project. / Sample data                                               | ประกอบขึ้นด้วยกฎที่ตายตัว โปรเจกต์ตัวอย่าง / ข้อมูลตัวอย่าง                                 |
| ports                 | Actions / Inputs / Display / Board / Panels                                                           | ปุ่ม / ช่องกรอก / การแสดงผล / กระดาน / แผงข้าง                                              |
| sequence              | Design system                                                                                         | ระบบดีไซน์                                                                                  |
| share tagline         | Give your ideas a world.                                                                              | ให้ไอเดียมีตัวตน                                                                            |

## Honest labels

| Where                                 | Label                                                                                               |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Every present board                   | "View only" pill (existing)                                                                         |
| `p-landing`                           | `Badge` "Mockup"                                                                                    |
| `p-app`, `p-guide`                    | `Badge` "Sample data" and a note naming the sample project                                          |
| Guidebook, everywhere                 | "Assembled by fixed rules" (its cover already says so)                                              |
| Landing band photo, In use hero photo | "Photograph made with AI."; not rendered when the photo is missing                                  |
| Landing footer                        | "A concept preview with sample projects."                                                           |
| Composed chat                         | `basis="rules"` shows "By rules"                                                                    |
| Not used anywhere                     | trust badge, rating, discount, countdown, customer logos, user counts, a success state without data |

## Image briefs

One brief. The budget allows four; one is enough, because the product is the visual. Until it is generated, the band uses the existing `direction-making.webp` (already AI-labelled), and the image count stays at 7 (R5).

### landing-make

- File: `apps/web/public/orv-274/landing-make.webp` or the existing image folder the canvas reads; 1448 x 1086 (4:3), webp.
- Where it sits: the end half of the violet band on the landing, `object-cover`, full height of the band (min 360). Under 960 it sits full width under the band text.
- Prompt: "Close photograph of two hands bending a strip of off-white paper into an open loop, with a small paper disc resting just above the gap of the loop, on a matte near-black table. Soft window light from the left, shallow depth of field, calm and precise, muted colour, natural skin. No text, no letters, no numbers, no logo, no screen, no device, no watermark."
- Rule: no text, no logo, no screen. The photo never carries the brand mark; the open loop only echoes it.
- Label: "Photograph made with AI." under the band text.

## Contract needs

| #   | Need                                                                                                                                                  | Reason                                                                                                                                                    | Fallback                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| C1  | A crop fade recipe, `ds-crop-fade` with `data-edge="bottom"`, mask length `space.12` (48) in both the landing and the node (the proof used 56 and 40) | The mask needs a colour keyword (`#000` or `black`) in a page today; §9.12 and the no-raw-value lint forbid it                                            | No fade: the crop is anchored only (C2), and a play asserts no text box crosses the frame's bottom edge         |
| C2  | `startAt` (a selector) on the canvas's internal `LiveFrame`, measured with a `ResizeObserver`; example-internal, not a public API                     | A numeric start cuts Thai and English at different lines; anchoring to `[data-section="foundation"]` puts the heading at the same place in both languages | A numeric `start` per language, pinned by a play that checks the heading's top is within 24 px of the frame top |
| C3  | `NodeToolbar` covers an incoming edge label when the selected node sits under it                                                                      | Seen on the composed sheet                                                                                                                                | `label: false` on that edge (used in the proof)                                                                 |
| C4  | A nested `CanvasBoard` in a scaled frame fits only when it is in the viewport at mount                                                                | `p-app` showed an empty top and cut nodes when the node mounted off screen                                                                                | Plays scroll the node into view before they assert or shoot; the frame keeps an explicit 1280 x 800 box         |
| C5  | Device geometry for the phone and app icon (corner ratio 0.15 and 0.225 of width) is object drawing, not UI radius                                    | §3.3 radius tokens are for UI levels; a phone is a drawn object                                                                                           | Phone `rounded-overlay` (24) and icon `rounded-container` (16), slightly less real, no raw value                |
| C6  | The React Flow attribution sits under the `TaskBar` at the bottom edge                                                                                | It is half covered on the composed sheet                                                                                                                  | The sheet places the `TaskBar` with a bottom inset of `space.6` so the attribution stays clear                  |
| C7  | The rules do not read a Thai mood answer ("สงบและมั่นใจ"), so the Thai Font node says it cannot read the mood                                         | Product gap, seen in `p6-composed-th-*`                                                                                                                   | Keep it: it is the honest current state. Open a follow-up for the rules                                         |
| C8  | The guidebook has no visual specimens (colour chips, type samples, the logo on grounds)                                                               | The CI work would read richer with them; it is a product change, not this story                                                                           | Show the guidebook as it is, from the foundation heading                                                        |
| C9  | `CommandMenu` has no `container` prop to open inside a frame                                                                                          | A command palette would show the Studio better                                                                                                            | `Kbd shortcut="Mod+K"` with "Command menu" on the base sheet (used)                                             |

No new token, no new semantic name, no glow and no `display.xl` are proposed.

## Rule changes for the owner

| #   | Rule today                                                                    | Options                                                                                                                                                                                | Default                                                            |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| R1  | 40 edges (29 input)                                                           | (a) 36 edges, 25 input, the table above; (b) keep 40 by adding 4 more product feeds                                                                                                    | (a): every edge says something true; 4 extra feeds would be filler |
| R2  | 12 results, 7 sequences, 40 pages                                             | (a) 14 results, 8 sequences, 42 pages; (b) keep `p-base` and `p-pat` as non-opening nodes                                                                                              | (a): the sheets are worth opening at full size                     |
| R3  | World 4912 x 2260                                                             | (a) about 5372 x 2260; (b) keep the width and shrink the sheets to 480                                                                                                                 | (a): at 480 the sheet text is too small to read                    |
| R4  | In use: 7 pieces with lockup and ink tiles; brandbook p11 has 7 placements    | (a) the new 7 (window, phone, icon, hero photo, share, card, sign), p10 opener the app window, p11 6 placements; (b) keep the old mix and swap two tiles                               | (a)                                                                |
| R5  | 7 images                                                                      | (a) stay at 7, reuse `direction-making.webp` in the band; (b) 8 with `landing-make`                                                                                                    | (a) until the owner asks for generation                            |
| R6  | The canvas landing is Thai only (`en.ts` 1235 `phoneSub`, 1341 `landingNote`) | (a) the new landing in English by default with Thai complete, copy at 1235 and 1341 changes; (b) Thai default                                                                          | (a), as the owner asked for English                                |
| R7  | Copy is plain text                                                            | (a) Thai display copy may carry U+2060 word joiners, checked by `check-i18n` as allowed; (b) shorten the Thai                                                                          | (a): the Thai title reads best as written                          |
| R8  | §9.10 no Studio violet or lime in a preview frame                             | (a) ORIVILO's own pages (landing, app, guidebook) may show its lime intent button inside a canvas node, because ORIVILO is the brand on show; (b) the landing uses primary violet only | (a), one lime button per screen still holds                        |
| R9  | Signature glow at most once per screen                                        | No change: the proposals use none                                                                                                                                                      | unchanged                                                          |

## Visual QA screens

The reviewer checks these in Storybook, dark and light, Thai and English, at the narrowest and widest width each story allows.

| #   | Story (title, name)                                      | Widths    | What to check                                                                                                             |
| --- | -------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------- |
| V1  | `Examples/OriviloLanding` Default, Thai, At390           | 390, 1280 | One start edge; one lime button; Thai title on two lines at 390 with no split word; band photo and AI label together      |
| V2  | `Examples/OriviloLanding` MissingImage                   | 390, 1280 | Band text full width, no AI label                                                                                         |
| V3  | `Examples/OriviloCanvas` ProductChapter                  | default   | 3 nodes at 480, equal media heights, one badge row each, the app board fitted                                             |
| V4  | `Examples/OriviloCanvas` PreviewProductPages             | default   | 3 pages: landing, app, guidebook; the guidebook starts at its foundation heading                                          |
| V5  | `Examples/OriviloCanvas` DesignSystemChapter, Dark       | default   | Sheets readable at 560; play focuses "Project name": the focus ring (line with halo) shows and reads apart from selection |
| V6  | `Examples/OriviloCanvas` PreviewDesignSystem (new)       | default   | 2 pages; the composed board shows selection and, after the play, focus on a control                                       |
| V7  | `Examples/OriviloCanvas` InUseChapter, PreviewInUseBoard | default   | 7 pieces on the grid, one intent button, AI label on the photo, ORV-308 lockups unchanged                                 |
| V8  | `Examples/OriviloCanvas` BrandbookChapter                | default   | p10 opener is the app window; p11 has 6 placements                                                                        |
| V9  | `Examples/OriviloCanvas` PreviewAt360, MissingImages     | 360       | The new pieces hold at 360; missing images show no orphan label                                                           |

## Build slices

In build order. Each slice is one builder task and closes with `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`.

### S1: ORIVILO's own landing

- Files: new `packages/design-system/src/examples/orivilo-landing.tsx` (with the narrow hero graph and bodies), `orivilo-landing.stories.tsx` (Default, Thai, At390, MissingImage, both modes), locale messages `oriviloLanding` in `src/i18n` (en and th), catalog example entry if examples are listed.
- Tests and plays: the story plays count 1 intent button (`[data-variant="intent"]`), 6 nodes at 1280 and 3 at 390, the AI label present only with the photo, `lang` attribute per language. `check-i18n` passes with word joiners (R7).

### S2: the product chapter (07)

- Files: `orivilo-canvas.data.ts` (product nodes near lines 1894 to 1960: `p-form` to `p-app`, `p-report` to `p-guide`; sequence anchors near 1337 to 1360), `orivilo-canvas.tsx` (`PageBody` and `LivePage` near 2105 to 2135; `LiveFrame` `startAt`, C2; the fade, C1 or its fallback), `en.ts` and `th.ts` (1235 `phoneSub`, 1341 `landingNote`, new notes and badges).
- Tests: `orivilo-canvas.test.ts` 94 (results and sequences, after S3), 163 (chapter names if a title changes), 182 (builds the frames), 618 (W5 table rows for the product pages).
- Plays: `orivilo-canvas.stories.tsx` 1332 ProductChapter (3 nodes, badges, the app board fitted after scroll, C4), 1491 to 1537 PreviewProductPages (landing, app, guidebook; heading within 24 px of the top), 664 (paged keys).

### S3: the design-system sheets (06)

- Files: `orivilo-canvas.tsx` (base and composed sheets, the new 2-page sequence), `orivilo-canvas.data.ts` (`p-base` and `p-pat` as 560 wide results, ports, positions x 3464 and 4136, product column x 4892, edges 26 to 36), messages (sheet copy).
- Tests: 65 (31 nodes, unchanged), 86 (40 to 36 edges, input 29 to 25), 94 (12 to 14 results, 7 to 8 sequences, `[6,3,2,6,8,12,2,3]`), 154 (world fits about 5372 x 2260), 182 (sheets build).
- Plays: 136 (node count), 389 and 541 (dock counts if the dock lists results), 664 (40 to 42 paged keys), 1289 (`p-pat` live frames: was 5, now the composed sheet's parts), 1314 and 1323 DesignSystemChapter and Dark (focus play, V5), new PreviewDesignSystem (V6).

### S4: In use and brandbook part 03 (04, 05)

- Files: `orivilo-canvas.tsx` (In use board: `AppWindow`, phone with `OriviloLanding width={390}`, icon, share image; card and sign scenes untouched), `orivilo-canvas.data.ts` (piece list), brandbook p10 and p11 placements.
- Tests: 287 (5 direction and 7 in-use pieces, the new ids), 295 (pieces inside 1280 x 800), 339 (in-use grid cells), 351 (book page 11: its piece count changes to the 6 placements), 373 (12 book pages, unchanged), 438 (7 image ids, unchanged under R5 default), 502 (every image used: the lockup and ink tiles no longer use an image, check none is orphaned).
- Plays: 117 (no image where none is expected), 1012 to 1043 InUseChapter (7 pieces, 1 intent), 1082 BrandbookChapter (p10 opener, p11 placements), 1407 PreviewInUseBoard, 1582 PreviewAt360, 1611 MissingImages.
