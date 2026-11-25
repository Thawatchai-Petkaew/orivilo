---
issue: ORV-312 (https://tpetkaew.atlassian.net/browse/ORV-312)
lane: M (a slice card of ORV-309; no shared component API, token, recipe or profile changes)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-312: the phone of piece B shows the node board, not the landing

## Goal

In the story `Examples/Prototype: ORIVILO canvas`, the phone of piece B in the brand in use (the 04
In use board, piece B's own preview page and brandbook page 11) shows ORIVILO's main function, the
node board, in place of the landing at 390.

## Why

On 2026-11-26 the owner looked at the phone on brandbook page 11 (ORV-309 comment 10845). The main
session's reading of the owner's words: the phone shows the system's main function, not the
homepage; the top must not look empty; the first impression shows what the app does; text does not
fill the screen.

The standing rule for the canvas is the owner's comment 10829: an application-level example is
composed from live components, never a generated picture.

The design that answers it is `docs/specs/ORV-312/design.md`, rows 1 to 7. This spec points to its
rows by number and does not restate its numbers, except where an acceptance row names what a person
reads on the screen.

This spec is not a guard on a tool call, so the guard frame does not apply.

## What is real

- **Live:** the phone screen is the catalog components rendered in the story: `TopNavigation`,
  `Logo`, `Avatar`, `CanvasBoard` in its present variant with `CanvasNode` and `CanvasEdge`, and
  `Button` in its intent variant, composed inside `examples/orivilo-canvas.tsx` (design row 1).
- **Sample data:** the board is a fixed sample graph of 4 nodes and 4 edges (design row 2); the
  avatar is the sample person of `orvCanvas.sheet.owner`.
- **Simulated:** the board does not run. Nothing on the phone interprets, generates, opens or
  exports; the button "Open the brand guidebook" sits in an `inert` subtree and does nothing.
- **Image:** the phone picture `scene-phone` of ORV-309, made with AI, unchanged. No new image.

## Story

As the owner showing ORIVILO, I want the phone in the brand in use to show the node board that
ORIVILO is, so that the first look at the phone says what the app does.

## Acceptance criteria

Files the build touches: `packages/design-system/src/examples/orivilo-canvas.tsx`,
`orivilo-canvas.data.ts`, `orivilo-canvas.stories.tsx`, `orivilo-canvas.test.ts`, and the locale
files `en.ts` and `th.ts`. "Design row n" is a row of `docs/specs/ORV-312/design.md`.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Canvas stories `PreviewInUseBoard` page 1 and page 3 and `InUseChapter` (the `u-board` node at 100 percent), English, light and dark stage | A person looks at piece B's phone | The phone shows the app, not a homepage: right under the clock and the camera pill, an app bar with the horizontal ORIVILO logo at the start and the sample person's avatar at the end, then the node board with no empty band above the first node. On the board, top to bottom: the "Brief" node with "Make intent tangible." and "Brand essence", the "Logo" node with the mark, the "Colour" node with its swatches, and the selected "Brand guidebook" node with the violet "Brand guidelines" card, joined by teal and pink edges into its "Image" and "Palette" ports; the badge "View only"; one lime button "Open the brand guidebook" at the bottom end corner of the screen. Every word on the screen is a short label: no headline and no paragraph. On page 3 the caption reads "The board on a phone" with the second line of row 7. At the `u-board` tile size the screen looks like a board of connected nodes | None | Judged by eye in the qa walk, on design Visual QA screens Q1, Q2 and Q5 |
| 2 | Canvas stories `PreviewInUseBoard` page 1 and page 3 and `PreviewBrandbook` page 11, English | Rendering | The phone screen renders the app bar and the board of row 1 | Inside piece B's `[data-phone-screen]`: one `header` holding 0 `button`; one `.ds-board[data-variant="present"]`; 4 `.react-flow__node` with the ids `brief`, `logo`, `colour` and `guide`; 4 `.react-flow__edge`; one `.ds-node[data-selected]`, the guide's; each node's box, mapped to design px by the screen's scale k (worked example W2), within 0.5 of its screen box in design row 2; no element of `OriviloLanding` (no `[data-section]`, no hero title) | Plays of `InUseChapter`, `PreviewInUseBoard` and `BrandbookChapter` |
| 3 | Canvas story `PreviewInUseBoard` page 3, English and Thai | The play samples each edge path every 1/200 of its length with `getPointAtLength`, mapped to design px | Each edge runs in open board and shows no crossing over a node it does not connect | Each `.react-flow__edge-path` stays at least 6 design px from every card (`.ds-node`), handle and label box of each node that is neither its source nor its target (the edge rule of design row 2) | `PreviewInUseBoard` play, English and Thai |
| 4 | The three places of row 2 | The play opens each place 3 times, remounting it | The board shows the same view on every open | The viewport transform is `matrix(1, 0, 0, 1, 0, 0)` and the node boxes of row 2 are equal on every open: the board is placed by number with `fitView={false}`, no `setViewport` and no effect (phone-board-1) | A play that remounts and compares |
| 5 | Canvas stories `InUseChapter` and `BrandbookChapter`, English and Thai | Querying the DOM | One lime button shows on the phone, at the bottom end corner of the screen, under the guidebook card | Exactly 1 `.ds-button[data-variant="intent"]` inside `u-board` and exactly 1 on page 11, each in piece B's phone, in an `inert` subtree, its text "Open the brand guidebook" / "เปิดคู่มือแบรนด์" (`business.board.openGuidebook`); its box within 0.5 design px of the box of design row 4. Page 10 still holds 1, in the landing. The window, the icon and the share card hold 0 (ORV-309 intent-once-1) | Plays of `InUseChapter` and `BrandbookChapter` |
| 6 | Canvas story `PreviewBrandbook` page 11, English and Thai, dark and light stage | Rendering | Over the phone screen, two dashed violet lines show on the screen's start and end edges at 16 and 374 of 390; above the phone the measure shows its ticks on 0, 16, 374 and 390 and reads 16, 358, 16; the title "Layout at 390" / "เลย์เอาต์ที่ 390" stays at the bottom start (design row 5) | The `phone` piece's `grid` is `{ lines: [16, 374], measure: [0, 16, 374, 390] }` (worked example W1) | `PreviewBrandbook` play |
| 7 | The locale catalog | check-i18n, the copy check and the unit test run | Not a screen | `orvCanvas.use.phone` reads "The board on a phone" / "กระดานบนมือถือ"; `orvCanvas.use.phoneSub` reads "Mockup: ORIVILO's own node board at 390, live, with sample data, on an AI phone picture." / "ม็อกอัป: กระดานโหนดของ ORIVILO ที่กว้าง 390 แสดงสดด้วยข้อมูลตัวอย่าง วางบนภาพโทรศัพท์ที่สร้างด้วย AI" (design row 6). No other key changes, no key is added or removed, and `en.ts` and `th.ts` keep the same keys. No middot and no em dash | `orivilo-canvas.test.ts` with check-i18n and the copy check in the gate |
| 8 | Canvas stories `PreviewInUseBoard` page 3 and `PreviewBrandbook` page 11, Thai | Rendering | Every label on the phone shows in Thai: "บรีฟ", "ทำให้เจตนาจับต้องได้" on two lines, "แก่นของแบรนด์", "โลโก้", "สี", "คู่มือแบรนด์", "แนวทางแบรนด์", "ภาพ", "ชุดสี", "ดูอย่างเดียว", "เปิดคู่มือแบรนด์"; no Thai mark is cut | The brief's heading is 2 lines. `expectNoGlyphClip` holds on the brief heading, the guide's title, the badge and the button | Thai twin plays of `PreviewInUseBoard` and `PreviewBrandbook` |
| 9 | Canvas story `MissingImages` | `scene-phone` is missing | Piece B's tile shows the violet flood and the missing label only, as ORV-309 design row 4.5 | No `[data-phone-screen]`, no board and no button in piece B; `u-board` and page 11 hold 0 intent buttons | `MissingImages` play |
| 10 | Canvas story `PreviewAt360`, the board and page 11 | Rendering at 360 | The phone picture renders whole in its tile, with the screen scaled as one, nothing reflowed | The frame's `scrollWidth` equals its `clientWidth` | `PreviewAt360` play |
| 11 | Canvas stories `InUseChapter` and `PreviewBrandbook` page 11 | Querying the DOM | The phone screen shows live components, not a picture of a screen (comment 10829) | Inside each `[data-phone-screen]` there are 0 `img` and 0 `picture`; piece B holds exactly one `img`, the phone picture `scene-phone` | Plays of `InUseChapter` and `PreviewBrandbook` |
| 12 | The data module `orivilo-canvas.data.ts` and the image records | The unit test runs | Not a screen | The counts of ORV-309 row 10 hold unchanged (31 nodes, 36 edges, 14 result nodes, 8 sequences of 42 pages, nine chapter stops). The image ids stay 8: the seven of ORV-274 `images-1` and `scene-phone` | `orivilo-canvas.test.ts` |
| 13 | The PR head against `develop` | Reading the diff of the protected paths | Not a screen | No change under `packages/design-system/src/components/`, `src/tokens/`, `src/recipes/`, `src/profiles/` or `apps/web/`: no new token, recipe class, public API or contrast pair, and nothing under `packages/design-system/.storybook/static` | `git diff --stat origin/develop...HEAD -- packages/design-system/src/components packages/design-system/src/tokens packages/design-system/src/recipes packages/design-system/src/profiles apps/web packages/design-system/.storybook/static` prints nothing |
| 14 | The PR head against `develop` | The reviewer reads the diff | Not a screen | No hunk in `PhoneScene`, `phoneView`, the `scene-phone` record, `HomeScreenPiece` (piece C), `BrowserWindow`, `FieldArt`, `Scene` or `placeOnQuad`, in the `card` and `sign` records, or in `examples/orivilo-landing.tsx` | The reviewer's diff read, recorded in the review |
| 15 | The PR head | Quality gate | Not a screen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm contrast` pass; the contrast output is unchanged | Gate output |

## Rows per PR

- Rows: 1-15

One PR holds every row. It builds on PR 251 of ORV-309 (the phone picture and `PhoneScene`) and
opens after PR 251 is merged; its number is not known yet.

## Rows that render nothing

- Rows: 7, 12-15

## Decided

The main session decided these under the owner's POC delegation (ADR 0012 decision 4), from its
reading of ORV-309 comment 10845 and the design's rows.

### phone-board-1

Piece B's phone screen, in each of the three places that draw piece B (the `u-board` node, piece
B's own preview page, brandbook page 11), is the phone board screen of design rows 1 to 4: an app
bar, a present (read-only) board of fixed sample nodes and edges, and one intent button. It is
composed from catalog components that exist, inside `examples/orivilo-canvas.tsx`, and holds no
image of a screen. The board is placed by number: the view does not depend on a measure, a fit or
an effect, so it is the same on every open. Page 10's field keeps the landing at 390 and its one
intent button.

### Other decisions

- The present variant, not the edit variant, for the phone's board (design, "Why this screen reads
  as the product").
- Page 11's layout grid follows the phone board's margins (design row 5); the title "Layout at 390"
  stays.
- The copy of `orvCanvas.use.phone` and `orvCanvas.use.phoneSub` is design row 6.
- The states are design row 7.

## ORV-309 statements this slice overrides

These statements of `docs/specs/ORV-309/spec.md` v1.3 no longer hold for piece B. Where the two
specs differ on piece B and page 11's grid, this spec holds. The ORV-309 file is not changed by this
slice. The matching statements of `docs/specs/ORV-309/design.md` are the table "In
`docs/specs/ORV-309/design.md`" of `docs/specs/ORV-312/design.md`.

- in-use-1, piece B: "B the phone with `OriviloLanding` at 390 (`phone`): the live landing laid on
  the screen of the phone picture `scene-phone`". New reading: B the phone with ORIVILO's node board
  at 390 (`phone`), phone-board-1, laid on the screen of the phone picture `scene-phone`, the whole
  phone on violet.
- Row 11, User sees: "the phone picture with the live dark landing on its screen". New reading: the
  phone picture with the live node board on its screen, rows 1 and 2 of this spec. The count
  "Exactly one intent button inside `u-board`, in piece B's phone" holds; the button is now the
  phone board's, row 5 of this spec.
- Row 12, User sees: "the phone picture with the live landing and its layout grid (lines at 24 and
  366 of 390, the measure 24, 342, 24)". New reading: the phone picture with the live node board
  and its layout grid, row 6 of this spec. "Page 11 holds 6 placements and one intent button, in
  piece B's phone" holds.
- Open question 3, the `phoneSub` default: "Mockup: ORIVILO's own landing at 390, live, on an AI
  phone picture." and its Thai. New reading: row 7 of this spec, which also changes `use.phone`.
- W5, input "lines ... at 24 and 366 of the 390 screen" with the landing's `px-6` margin of 24,
  expected `24 342 24 366 24`. New reading: W1 of this spec for the grid; the icon set's 24 glyphs
  are unchanged.

These hold unchanged: intent-once-1, canvas-image-1, the rest of in-use-1 (pieces A and C to G,
page 10, page 11's six placements), row 10's counts, row 13's images, row 14 (the new `phoneSub`
does not say the copy is Thai only) and C5.

## Out of scope

- The landing's own layout at 390: the example `OriviloLanding` and its stories `At390` and
  `At390Thai` stay as they are, and page 10's field keeps the landing.
- The recipe scope of the task bar lift and the other follow-ups of ORV-300.
- A new generated picture.
- Any change to the phone picture, `PhoneScene`, the home screen piece (piece C), the card and the
  sign.

## Open questions

None: the design leaves no question open for the owner.

## Depends on

- `docs/specs/ORV-312/design.md`: rows 1 to 7, "Spec statements this changes", "Acceptance rows
  proposed for the slice's short spec", "Visual QA screens" Q1 to Q6.
- `docs/specs/ORV-309/spec.md` v1.3: in-use-1, intent-once-1, canvas-image-1, rows 10 to 14, open
  question 3, W5; ORV-309 design rows 4.2, 4.5 and 4.6.
- ORV-309 comments 10829 (the image rule) and 10845 (the owner's words on the phone).
- PR 251 of ORV-309: the phone picture `scene-phone` and `PhoneScene`, on which this slice builds.
- ADR 0012 decision 4; `DESIGN.md` §9; `.claude/rules/design-system.md`.

## Worked examples

Not run, no shell in this role. Each runs from the repo root with `node -e`.

W1. Page 11's layout grid (row 6). Input: the phone board's start and end edges, design row 5's
`lines: [16, 374]`, on the 390 screen; the margin is 16. Method: the measure is the margin, the
width less two margins, the margin; the end line is the width less the margin. Expected
`16 358 16 374`, integers, no rounding.

```bash
node -e 'const w=390,m=16;console.log(m,w-2*m,m,w-m)'
```

W2. Mapping a node box between design px and page px (row 2). Input: design row 5, page 11's B box
with the screen at x 26.86 and the scale k 0.6325; design row 2, the guide's screen box start x 88.
Method: page x = screen x + design x times k; design x = (page x less screen x) divided by k.
Expected `82.52 88.0`: the page x to two places and the design x back to one place, each rounded to
nearest by `toFixed`.

```bash
node -e 'const x0=26.86,k=0.6325,x=88,p=x0+x*k;console.log(p.toFixed(2),((p-x0)/k).toFixed(1))'
```

## Changelog

- v1.0 (2026-11-26): first version, task ORV-312-spec, from ORV-309 comment 10845 (the owner's
  words and the main session's reading), comment 10829 and `docs/specs/ORV-312/design.md` rows 1 to 7. Rule phone-board-1; rows 1 to 15 from the design's A1 to A9 with A1b, plus the visual row 1,
  the screen image row 11, the counts row 12 and the gate row 15; five ORV-309 statements
  overridden; W1 and W2. To review downstream: the builder, reviewer and qa envelopes of this
  slice's PR; `docs/specs/ORV-309/spec.md` lines 119, 196, 197, 255 and 351 and the
  `docs/specs/ORV-309/design.md` statements the design lists, which this slice does not edit.
