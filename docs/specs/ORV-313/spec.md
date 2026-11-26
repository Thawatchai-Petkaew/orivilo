---
issue: ORV-313 (https://tpetkaew.atlassian.net/browse/ORV-313)
lane: M (a normal story; no shared component API, token, recipe or profile changes)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.1
---

# ORV-313: the colour demo reads the brand photograph

## Goal

In the story `Examples/Prototype: ORIVILO canvas`, the colour read-back demo node `c-demo` (chapter
03 Colour) reads its colours from the brand photograph `brand-hero` in place of the bowl and clay
picture `colour-reference`, and `colour-reference` leaves the page (demo-photo-1).

## Why

On 2026-11-26 the owner wrote on the card that the bowl and clay example does not make sense. In
the card's question form the owner chose to keep the read-colour mechanism and show it on a brand
picture. The main session judged the design's proof of the node, in English and in Thai, and
accepted it under the owner's POC delegation (ADR 0012 decision 4); the owner was sent the two
screens.

The design that answers it is `docs/specs/ORV-313/design.md`: rows D1 to D9 (section 2), the read
method and values (section 3), the copy (section 5), what leaves with `colour-reference` (section
6), the statements it changes (section 7), the proposed rows A1 to A9 (section 8) and the visual QA
screens (section 9). This spec points to its rows by number and restates a number or a hex value
only where a person reads it on the screen. "Design row Dn" is a row of that file.

This spec is not a guard on a tool call, so the guard frame does not apply.

## What is real

- **Image:** the photograph is `brand-hero`, an AI picture the canvas already holds (ORV-274), under
  its AI label (ORV-274 `honest-1`). Its record does not change. No new picture is made.
- **Read values:** the four hex values are read from the pixels of `brand-hero.webp` by the script
  of design section 3 (demo-read-1). They are not typed to match the palette; the read value, not
  the palette's, is what the card shows.
- **Simulated:** the mechanism is not in the product. Nothing on the canvas reads a picture at run
  time: the points and their values are fixed data in `orivilo-canvas.data.ts`. The badge "Mechanism
  demo" and the note say so.
- **The violet:** the owner chose ORIVILO's violet; it was not read from a photograph. The note says
  so.
- **The main risk:** the photograph was itself made from ORIVILO's palette, so reading it back lands
  on the palette by construction. It does not show the mechanism on a picture the system has never
  seen. The node's note says the photo was made by AI from the palette.
- **No model call** anywhere in this story.

## Story

As the owner showing ORIVILO, I want the colour demo to read its colours from a brand photograph, so
that a person sees in one look a brand picture go in, its colours come out, and land on the palette.

## Acceptance criteria

Files the build touches: `packages/design-system/src/examples/orivilo-canvas.tsx`,
`orivilo-canvas.data.ts`, `orivilo-canvas.stories.tsx`, `orivilo-canvas.test.ts`, the locale files
`en.ts` and `th.ts`, and the two deleted files of row 10. Row n comes from design row An as follows:
rows 2 to 9 are A1, A3, A5, A6, A2, A4, A7 and A8; row 9 also takes A7's alt key, and row 10 is
A9 with A7's static folder.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Canvas stories `ColourChapter` and `Default` (the overview), English and Thai, light and dark stage | A person looks at the `c-demo` node | Under the title "Demo: colours read back" / "ตัวอย่าง: อ่านสีกลับจากภาพ" and the badge "Mechanism demo" / "ตัวอย่างกลไก", the brand photograph: a founder in a violet studio, in a near-black sweatshirt with the ORIVILO mark, holding an off-white card, beside a violet block. Four numbered points sit on the wall, the card, the sweatshirt and the block, none on the mark. Under the picture the four colours read at those points, each ending on the palette colour it comes near. The node reads as a brand picture going in and its colours coming out onto the palette: the eye goes picture, point, colour, palette. No bowl and no clay anywhere. In the overview the same photograph shows small in the In use board above, and reads as the same photograph in use, not as a repeat (design section 1) | None | Judged by eye in the qa walk, on the screens of design section 9 (`chapter-en-light-100.png`, `chapter-en-dark-100.png`, `chapter-th-dark-100.png`, `node-en-light-2x.png`, `node-en-dark-2x.png`, `node-th-dark-2x.png`, `node-missing-en-light-2x.png`, `node-missing-en-dark-2x.png`, `overview-en-light-100.png`) and the node in Thai on the light stage, retaken on the build |
| 2 | Canvas story `ColourChapter` (English, light and dark) and `InThai` | Rendering at 1440 x 900 | `c-demo` shows the photograph whole, with no crop, the badge "Mechanism demo" / "ตัวอย่างกลไก" at its top start, four numbered rings, the read row of row 3 and the note: "Not in the product yet. Points 1 to 4 read the colours back from the brand photo, which AI made from ORIVILO's palette. Lime is not in it. The owner chose the violet; it was not read from a photo." / "ยังไม่มีในผลิตภัณฑ์ จุด 1 ถึง 4 อ่านสีกลับจากภาพแบรนด์ที่ AI สร้างจากชุดสีของ ORIVILO ในภาพไม่มีสีเขียวมะนาว และเจ้าของเลือกสีม่วงเอง ไม่ได้อ่านจากภาพ". The whole node sits in the 03 chapter view, above the dock | The `c-demo` photo is `[data-photo="brand-hero"]` and measures as design row D1 gives it at zoom 1. The node keeps its id, kind, title key, width, position, `pad`, input port and edge 18, and has no `open` (design section 2). Its height is design row D8's. No element and no `img` names `colour-reference` | `ColourChapter` play (`expectChapterInView`); `InThai` play; `Default` play (`expectNoOverlap`) |
| 3 | Canvas story `ColourChapter` (English) and `InThai` | Rendering | Under the photograph, four columns numbered 1 to 4. Each holds a swatch of the colour read, then the number and the hex on one line: "1 #8526CC", "2 #E6DBDA", "3 #15131E", "4 #7922C1", then the palette colour it comes near: "≈ Violet", "≈ Canvas", "≈ Ink", "≈ Violet" / "≈ ม่วง", "≈ พื้น", "≈ หมึก", "≈ ม่วง". No distance number and no tooltip | Inside `[data-demo-reads]`, four `[data-demo-point]` in order 1 to 4. Each swatch's computed background equals its point's hex (demo-read-1). Line 1 is one line and its `scrollWidth` equals its `clientWidth`. No swatch has a `title` attribute. In Thai, `expectNoGlyphClip` holds on line 2 | `ColourChapter` play; `InThai` play |
| 4 | Canvas stories `Default` (light) and `Dark` | Rendering | Four discs numbered 1 to 4 on the photograph, each numeral centred in its disc, each disc in a white ring in both modes, clear on the violet wall, the off-white card, the near-black sweatshirt and the violet block | Four `[data-demo-ring]`. The numerals are at `label-sm` and centred (ORV-290 row 31 holds). Each ring's box shadow holds `--ds-surface-card` resolved in a light scope, in light and in dark (design row D4). The `Default` play counts the numerals through `[data-demo-ring]` and finds four, so the read row's numbers are not counted | `Default` and `Dark` plays, with `expectDemoRings` rewritten as design section 8 gives it |
| 5 | Canvas story `MissingImages` | `brand-hero` is missing | In `c-demo`: the paper flood, the id `brand-hero` and "This image is not here yet" / "ยังไม่มีภาพนี้", the badge, and no numbered disc. The read row with its four colours and the note stay (design row D7) | In `c-demo`: zero `[data-demo-ring]`, four `[data-demo-point]`, and no `img` in the photo slot | `MissingImages` play |
| 6 | The data module `orivilo-canvas.data.ts` | The unit test runs | Not a screen | `DEMO_POINTS` holds the four points of design row D2. Each hex is `#` and six upper-case hex digits; each `x` and `y` is above 0 and below 100. Each point's `palette` is the `PALETTE` entry nearest to its hex by straight RGB distance, computed in the test (demo-read-1, W1) | `orivilo-canvas.test.ts` |
| 7 | The file `packages/design-system/.storybook/static/orv-274/brand-hero.webp` | The reviewer runs the command of design section 3 | Not a screen | It prints the four hex values of design row D2, each beside its point (demo-read-1) | The reviewer's run, one `verified` row in the review |
| 8 | The data module and its test | The unit test runs | Not a screen | `ImageId` and `IMAGES` hold the seven ids of demo-photo-1 and no `colour-reference`. The test's id list and treatment map lose `colour-reference`, and its test reads "holds exactly the 7 ids". Each of the seven is still used in a piece, a page or `c-demo`. The `c-demo` body is `{ kind: "demo", image: "brand-hero", points: DEMO_POINTS }`. The node, edge, result node, sequence, page and chapter stop counts of ORV-309 row 10 hold unchanged | `orivilo-canvas.test.ts` |
| 9 | The locale catalog | check-i18n, the copy check and the unit test run | Not a screen | `orvCanvas.demo.note` is changed and `orvCanvas.demo.near` is added, in `en.ts` and `th.ts`, with the words of design section 5. `orvCanvas.image.alt.colour-reference` is removed from both. The keys design section 5 marks Unchanged keep their words. `en.ts` and `th.ts` keep the same keys and placeholders. No middot and no em dash | check-i18n; copy check |
| 10 | The PR head against `develop` | Reading the diff | Not a screen | No change under `packages/design-system/src/components/`, `src/tokens/`, `src/recipes/`, `src/profiles/` or `apps/web/`: no public API, token, recipe class or contrast pair changes. `packages/design-system/package.json` is unchanged (`sharp` is not added). Under `packages/design-system/.storybook/static/` the only change is the deletion of `orv-274/colour-reference.webp` and `orv-274/colour-reference.prompt.md` | `git diff --stat origin/develop...HEAD -- packages/design-system/src/components packages/design-system/src/tokens packages/design-system/src/recipes packages/design-system/src/profiles apps/web packages/design-system/package.json` prints nothing; `git diff --name-status origin/develop...HEAD -- packages/design-system/.storybook/static` lists exactly those two files, both deleted (`D`) |
| 11 | The PR head | Quality gate | Not a screen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm contrast` pass; the contrast output is unchanged (no new pair) | Gate output |

## Rows per PR

One PR holds every row, 1 to 11. When the PR has a number, the main session adds its line here as
a list item in the result recorder's form, `PR <number>: rows 1-11`.

## Rows that render nothing

- Rows: 6-11

## Decided

The main session decided these under the owner's POC delegation (ADR 0012 decision 4), from the
owner's words and choice on the card and the design.

### demo-photo-1

The `c-demo` node reads its colours from `brand-hero`, the brand photograph the canvas already
holds, shown whole (design rows D1 and D2). `colour-reference` leaves the page: its record, its id,
its two files under the static folder and its alt key (design section 6). The canvas then holds
seven image ids: `brand-hero`, `direction-team`, `direction-making`, `direction-place`,
`scene-card`, `scene-sign` and `scene-phone`. No new picture is made. Every other rule of ORV-274
`images-1` holds for the seven.

### demo-read-1

Each point's hex is read from the pixels of `brand-hero.webp` by the method and script of design
section 3, never typed to match the palette; the values are design row D2. Each point names the
`PALETTE` colour nearest to its read hex by straight RGB distance (design row D3). The card shows
the read hex and the palette colour's name, never the palette's hex and never a distance (design
section 3, "Distance shown or not").

### Other decisions

- The ring is the same light ring in both modes, because the photograph does not change with the
  mode (design row D4). It closes ORV-280 follow-up C13.
- With `brand-hero` missing, the rings are not drawn; the read row and the note stay (design row
  D7).
- `brand-hero` shows twice on the board, in `c-demo` and in the In use board; this is kept (design
  section 1).

## ORV-274 and ORV-309 statements this card overrides

These are the statements of design section 7. Where this spec and the files below differ on
`c-demo` or the image list, this spec holds. Their files are not edited by this card.

`docs/specs/ORV-274/design.md`:

- Section 4, the `c-demo` row: "`colour-reference` at 4:3 as media ... five numbered points (22 px
  ink discs with a card ring). Under it five read-back swatches (20 high, hairline), no hex on the
  canvas". New reading: design rows D1, D2, D4 and D5 of ORV-313, rows 2 to 4 of this spec.
- The paragraph under that table: "Demo points ... 1 (25, 33) #7A2FA7 ... 5 (54, 45) #E3E2E0. The
  hex values stay in the data and in the swatches' `title`; the canvas shows the colours only." New
  reading: demo-read-1; the hex is on the card, with no `title`.
- The layout table: "`c-demo` height 381". New reading: design row D8.
- Section 8, the "Colour demo" label. New reading: design section 5.
- Section 9: the `colour-reference` row, "### colour-reference (kept as it is)" with its prompt,
  and the count "3 kept (`brand-hero`, `direction-team`, `colour-reference`)". New reading: removed,
  demo-photo-1.
- Section 10, the `demo.badge` / `note` row. New reading: the note of design section 5, and
  `demo.near` added (row 9).
- Edge 18, "The demo image is made from the palette, not the other way", holds unchanged:
  `brand-hero` was made from the palette.

`docs/specs/ORV-274/spec.md` and `docs/specs/ORV-278/spec.md`:

- `images-1`: "seven images and no other: kept `brand-hero`, `direction-team` and
  `colour-reference`". New reading: the seven of demo-photo-1; every other rule of `images-1` holds.

`docs/specs/ORV-309/spec.md` v1.3:

- Row 13 and its reading of `images-1`, "reads as eight, the seven and `scene-phone`". New reading:
  seven, demo-photo-1 (row 8 of this spec). Row 13's "nothing is changed" under the static folder
  was that PR's bound and is not reopened; this card deletes two files there (row 10).

`docs/specs/ORV-274/tech.md`:

- The `ImageId` union, the images table row and the download loop that name `colour-reference`,
  and "`IMAGES` holds exactly the 7 ids". New reading: demo-photo-1; the sentence is true again, of
  a different seven.

`docs/specs/ORV-280/design.md` and `docs/specs/ORV-290/spec.md` row 31:

- The numerals at `label-sm` hold. The ring rule, "the card's ground in light, the subtle border in
  dark" (and the `expectDemoRings` comment), changes to design row D4 (row 4 of this spec).

## Out of scope

- A new generated picture, and any change to the `brand-hero` record (prompt, check, reference, AI
  label, alt text).
- Reading colours from a picture at run time, or from a picture the system has never seen: the
  mechanism stays a demo with fixed data.
- Showing a distance or a delta E on the card.
- The untracked folder `.claude/generated-images/2026-11-17-orv-274-colour-reference/`, left alone.
- Edits to the ORV-274, ORV-278, ORV-280, ORV-290 and ORV-309 files listed above.
- Any change to a shared component's public API, a token, a recipe or a profile; `apps/web`.

## Open questions (defaults taken)

1. The qa walk's screens. Design section 9 says "the same seven node and chapter screens, plus Thai
   light" and lists nine files. Default: the qa walk retakes the nine files of row 1 and the node
   in Thai on the light stage.

## Depends on

- `docs/specs/ORV-313/design.md` (commit 1ee8285): sections 1 to 9, rows D1 to D9 and A1 to A9.
- The card ORV-313: the owner's words of 2026-11-26 and the choice in its question form.
- `docs/specs/ORV-274/spec.md`: `honest-1`, `images-1`; `docs/specs/ORV-309/spec.md` v1.3: rows 10
  and 13; `docs/specs/ORV-290/spec.md` row 31.
- `packages/design-system/src/examples/orivilo-canvas.data.ts`: `PALETTE`, `IMAGES`, `DEMO_POINTS`.
- ADR 0012 decision 4; `DESIGN.md`; `.claude/rules/design-system.md`.

## Worked examples

Not run, no shell in this role. Each runs from the repo root with `node -e`.

W1. The nearest palette colour of each read value (demo-read-1, row 6). Input: the `PALETTE` hex
values of `orivilo-canvas.data.ts` (violet `#7A22C7`, violetDark `#B07FEE`, ink `#16151D`, canvas
`#F4F4F0`, lime `#D9F66F`) and the read values of design section 3. Method: straight RGB distance,
the smallest wins. Expected four lines, `#8526CC violet 12.7`, `#E6DBDA canvas 36.1`,
`#15131E ink 2.4`, `#7922C1 violet 6.1`: the distance rounded to one place by `toFixed` (no value
sits on a tie), matching design section 3's table.

```bash
node -e 'const P={violet:"#7A22C7",violetDark:"#B07FEE",ink:"#16151D",canvas:"#F4F4F0",lime:"#D9F66F"},rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),d=(a,b)=>Math.hypot(...rgb(a).map((v,i)=>v-rgb(b)[i]));for(const h of ["#8526CC","#E6DBDA","#15131E","#7922C1"]){const [id,v]=Object.entries(P).map(([k,p])=>[k,d(h,p)]).sort((a,b)=>a[1]-b[1])[0];console.log(h,id,v.toFixed(1))}'
```

W2. The image pixel of each point (demo-read-1, row 7). Input: `brand-hero.webp` at 1086 x 1448
and the points of design row D2 in percent. Method: x percent of the width and y percent of the
height, each rounded to the nearest pixel by `Math.round`. Expected
`152 319 315 550 543 796 934 1332`, the "Image px" column of design section 3.

```bash
node -e 'const w=1086,h=1448;console.log(...[[14,22],[29,38],[50,55],[86,92]].flatMap(([x,y])=>[Math.round(x/100*w),Math.round(y/100*h)]))'
```

W3. The photo's height at zoom 1 (row 2, design row D1). Input: the photo width 342 and the file's
1086 x 1448. Expected `456`, exact, no rounding.

```bash
node -e 'console.log(342*1448/1086)'
```

## Changelog

- v1.0 (2026-11-26): first version, task ORV-313-spec, from the card ORV-313 (the owner's words and
  choice of 2026-11-26) and `docs/specs/ORV-313/design.md` (1ee8285). Rules demo-photo-1 and
  demo-read-1; rows 1 to 11 from the design's A1 to A9, plus the visual row 1, the counts and
  image ids row 8 and the gate row 11; the statements of design section 7 overridden; one open
  question with its default; W1 to W3. To review downstream: the builder, reviewer and qa envelopes
  of this card's PR; the ORV-274, ORV-278, ORV-280, ORV-290 and ORV-309 statements listed above,
  which this card does not edit.
- v1.1 (2026-11-26): task ORV-313-spec-v1-1, a form fix with no change of requirement. Under
  "Rows per PR" the line `- Rows: 1-11`, which the result recorder rejects there, is removed; the
  section says in prose that one PR holds every row, and the line is added in the recorder's form
  `- PR <n>: rows <list>` once the PR has a number. To review downstream: the qa envelope of this
  card's PR.
