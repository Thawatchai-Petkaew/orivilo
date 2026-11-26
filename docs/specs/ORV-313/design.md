# ORV-313 design: the colour demo reads a brand photograph

Card: ORV-313. Node `c-demo` ("Demo: colours read back" / "ตัวอย่าง: อ่านสีกลับจากภาพ"), chapter 03
Colour of the story `Examples/Prototype: ORIVILO canvas`, joined from `c-pal` by edge 18 (derived).

## The ask and the decision

The owner, 2026-11-26: the picture of a bowl and a block of clay is an example that does not make
sense. Keep the read-colour mechanism, show it on a brand picture.

Decision: the demo reads its colours from `brand-hero`, the brand photograph the canvas already
holds. A person sees a real brand picture with four numbered points on it, and under it the four
colours read at those points, each with its hex and the palette colour it comes close to. The
mechanism reads in one look: a brand picture goes in, its colours come out, and they land on the
palette. `colour-reference` leaves the page. No new picture is made.

## 1. The photograph

| Candidate          | What it shows                                                                                                                           | Verdict                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `brand-hero`       | A founder in a violet studio, in a near-black sweatshirt with the real mark, holding an off-white card; a violet block with cards on it | **Chosen.** It is the brand's own photograph, and three palette colours fill large flat areas: violet (wall and block), ink (sweatshirt), canvas (the card). Read back, they land on the palette at a glance. It is already shown "photo" (no treatment), so its pixels are its colours                                                                   |
| `direction-team`   | Three people placing swatches on a pale table                                                                                           | No. It shows people choosing colours from swatches, so reading colours off it reads as reading the swatches (a picture of the mechanism, not a brand picture). Its violet areas are two small cards; the rest is wood, linen and grey, off the palette. On the canvas it is shown in the violet treatment, so the pixels a viewer sees are not the file's |
| `direction-making` | Hands folding off-white paper on a near-black table                                                                                     | No. Two colours only (ink and paper), no violet: the read row would not show the brand's signature. Shown in the violet treatment on the canvas, so what is read is not what is seen                                                                                                                                                                      |
| `direction-place`  | An empty studio, oak table, black chair, window shadows                                                                                 | No. Warm beige, oak and grey: off the palette; the read row would show colours ORIVILO does not use. Shown in the paper treatment on the canvas                                                                                                                                                                                                           |

The record of `brand-hero` (prompt, check with its one mark, reference, AI label, alt text
`orvCanvas.image.alt.brand-hero`) stays exactly as ORV-274 has it. Nothing of the record changes.

**Shown twice.** `brand-hero` is also the hero piece of the In use board (`u-board`, chapter 04, at
(2328, 174), width 560) and book page 10. `u-board` sits straight above `c-demo`, about 300 design
px of empty board between them. In the 03 chapter view at 1440 x 900 the board ends just above the
top of the view (its bottom at -31 screen px), so the 03 reader sees one copy; in the overview both
show, small, one above the other (`overview-en-light-100.png`). That reads right, not as a repeat:
03 reads the colours back from the brand's own photograph, 04 shows the same photograph in use, and
`c-pal` feeds both (edges 18 and 20). It also costs no new download (the same file).

## 2. Rows the builder builds

Every row keeps the node's id, kind (`reference`), title key, width 360, position (2428, 861),
`pad: "media"`, its one input port and edge 18. No `open`: the node has no preview page, before or
after.

| #   | What                      | Target                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Proved by                                                                                                |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| D1  | The picture               | `body: { kind: "demo", image: "brand-hero", points: DEMO_POINTS }`. The whole picture, no crop: `Photo` at 342 x 456 (342 x 1448 / 1086, the size `DemoBody` already derives from the record), flood `PAPER`, as today. The badge stays where it is (8, 8), `Badge variant="warning" size="sm"`, `demo.badge`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `ColourChapter` play: the `c-demo` photo is `[data-photo="brand-hero"]` and measures 342 x 456 at zoom 1 |
| D2  | The points                | Four points, numbered in reading order from top start to bottom end, `x` and `y` in percent of the image (the `DemoPoint` contract unchanged), the hex read from the file (section 3): 1 (14, 22) `#8526CC` violet wall; 2 (29, 38) `#E6DBDA` the card she holds; 3 (50, 55) `#15131E` the sweatshirt; 4 (86, 92) `#7922C1` the violet block. No point on the mark: its dot is about 20 image px wide, less than the square read, and a 22 px disc over it would hide the brand's own mark                                                                                                                                                                                                                                                                                                                                                             | `orivilo-canvas.test.ts` (row A4); reviewer reruns the command of section 3                              |
| D3  | What each point matches   | `DemoPoint` (page-local, not exported) gains `palette: PaletteId`: the palette colour nearest to the read hex by straight RGB distance. Values: violet, canvas, ink, violet. The hex shown is always the read value, never the palette's                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Unit test computes the nearest `PALETTE` entry for each hex and compares                                 |
| D4  | The rings                 | Disc unchanged: 22 px, `rounded-round`, inside `scope("dark")`, `bg-surface-canvas`, numeral `font-body text-label-sm leading-none tabular-nums` (ORV-290 row 31 holds). The ring is now the same in both modes: the ring span takes `scope("light")` and `ring-2 ring-surface-card` (white, `#FFFFFF`). The photograph does not change with the mode, so its ring must not either; the dark-mode `ring-border-subtle` (`#2B2A36`) reads 1.30 : 1 on the sweatshirt at point 3. The ring span carries `data-demo-ring={n}`                                                                                                                                                                                                                                                                                                                             | Contrast in section 4; `Default` and `Dark` plays (row A5)                                               |
| D5  | The read row              | Replaces the five bare swatches. An `ol` (`m-0 flex list-none gap-1 p-0 px-2 pt-2`, `data-demo-reads`), one `li` per point (`flex min-w-0 flex-1 flex-col gap-1`, `data-demo-point={n}`), each holding, top to bottom: the swatch (`aria-hidden`, 20 high, full column width, `border border-border-subtle`, background the read hex); line 1, `flex items-baseline gap-1 font-body text-label-sm leading-none tabular-nums whitespace-nowrap`: the point number in `text-text-secondary`, then the hex in `text-text-primary`; line 2, `font-body text-body-xs text-text-secondary truncate`: `fill(demo.near, { name: palette name })`, the name from `orvCanvas.palette.<id>`. No `title` attribute (the hex is now on the card). Column width at zoom 1: 79 px; the widest line 1, "2 #E6DBDA", fits it (scrollWidth equals clientWidth, measured) | `ColourChapter` play (row A3); `InThai` play runs `expectNoGlyphClip` on line 2                          |
| D6  | The note                  | `MUTED`, `px-2 py-2`, as today; new words in section 5. Four lines in English, three in Thai at 342 px                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Copy check; screenshots                                                                                  |
| D7  | Missing picture           | When `brand-hero` is missing, the photo slot is the existing missing state (the `PAPER` flood, the id and `image.missing`), the badge stays, the **rings are not drawn** (they would mark spots on nothing), and the read row and note stay: the values were read from the file and are data                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `MissingImages` play (row A6)                                                                            |
| D8  | The node's size           | Height at zoom 1 grows from 381 (ORV-274 layout table) to 649 in English and 627 in Thai (measured: photo 456, read row 71). The node keeps its place; nothing sits under it in its column (next node right is `bb-*` at x 2980), the overview has no new overlap, and at 1440 x 900 the 03 chapter view holds the whole node above the dock (node bottom 783, dock top about 835, zoom 86 %)                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `Default` play `expectNoOverlap`; `ColourChapter` play `expectChapterInView`                             |
| D9  | `colour-reference` leaves | See section 6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Unit test; `git diff --name-status` of the static folder                                                 |

## 3. How the hex values were read, and how to read them again

Each value is the mean sRGB of the 11 x 11 pixel square centred on the point (x percent of the
width, y percent of the height, rounded to the nearest pixel) of
`packages/design-system/.storybook/static/orv-274/brand-hero.webp` (1086 x 1448), rounded per
channel, written in upper-case hex. The standard deviation shows each area is flat.

| Point | Image px    | Read      | Std dev (R/G/B) | Nearest palette, RGB distance | Next nearest      |
| ----- | ----------- | --------- | --------------- | ----------------------------- | ----------------- |
| 1     | (152, 319)  | `#8526CC` | 0.0 / 0.0 / 0.0 | violet `#7A22C7`, 12.7        | violetDark, 104.5 |
| 2     | (315, 550)  | `#E6DBDA` | 0.3 / 0.3 / 0.3 | canvas `#F4F4F0`, 36.1        | violetDark, 108.5 |
| 3     | (543, 796)  | `#15131E` | 0.5 / 0.5 / 1.5 | ink `#16151D`, 2.4            | violet, 197.5     |
| 4     | (934, 1332) | `#7922C1` | 0.0 / 0.0 / 0.0 | violet `#7A22C7`, 6.1         | violetDark, 117.0 |

The script (any scratch folder, never committed; `sharp` is already in the store as a dependency of
another package and is not added to `design-system`):

```js
// read-points.mjs: node read-points.mjs <file.webp> <x%>,<y%> ...
import { createRequire } from "node:module";
const require = createRequire(process.env.SHARP_FROM);
const sharp = require("sharp");
const [file, ...pts] = process.argv.slice(2);
const { data, info } = await sharp(file)
  .toColourspace("srgb")
  .raw()
  .toBuffer({ resolveWithObject: true });
const R = 5;
const hex = (v) => Math.round(v).toString(16).padStart(2, "0").toUpperCase();
for (const p of pts) {
  const [xp, yp] = p.split(",").map(Number);
  const cx = Math.round((xp / 100) * info.width);
  const cy = Math.round((yp / 100) * info.height);
  const sum = [0, 0, 0];
  let n = 0;
  for (let y = cy - R; y <= cy + R; y++)
    for (let x = cx - R; x <= cx + R; x++) {
      const i = (y * info.width + x) * info.channels;
      for (let c = 0; c < 3; c++) sum[c] += data[i + c];
      n++;
    }
  console.log(p, `#${sum.map((s) => hex(s / n)).join("")}`);
}
```

Command, from the worktree root:

```bash
SHARP_FROM="$PWD/node_modules/.pnpm/sharp@0.35.5_@types+node@25.9.9/node_modules/sharp/package.json" \
  node <scratch>/read-points.mjs packages/design-system/.storybook/static/orv-274/brand-hero.webp \
  14,22 29,38 50,55 86,92
```

Expected output: `14,22 #8526CC`, `29,38 #E6DBDA`, `50,55 #15131E`, `86,92 #7922C1`.

**Distance shown or not.** The card shows the read hex and "≈ Violet", not a number. A distance
(12.7 RGB units, or a delta E) means nothing to a founder at first look; the read swatch next to the
name already shows how close it is, and the difference between points 1 and 4 (the same violet in
light and in shade) shows that a photograph's colour moves with the light. The distances stay in
this file for the test.

## 4. Contrast of the points on the photograph

Each point needs its disc or its ring at 3 : 1 or more against the area under it (UI rule).

| Point          | Ring `#FFFFFF` | Disc `#16151D` | Old dark ring `#2B2A36` |
| -------------- | -------------- | -------------- | ----------------------- |
| 1 wall         | 6.67           | 2.71           | 2.12                    |
| 2 card         | 1.35           | 13.38          | 10.43                   |
| 3 sweatshirt   | 18.36          | 1.01           | 1.30 (fails)            |
| 4 violet block | 7.47           | 2.43           | 1.89                    |

With the fixed light ring every point passes in both modes. This also closes ORV-280 follow-up C13
(the dark ring at about 1.4 : 1 on the old black paper).

## 5. Copy

| Key                                                                                                    | Change    | English                                                                                                                                                                                              | Thai                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `orvCanvas.demo.note`                                                                                  | Changed   | Not in the product yet. Points 1 to 4 read the colours back from the brand photo, which AI made from ORIVILO's palette. Lime is not in it. The owner chose the violet; it was not read from a photo. | ยังไม่มีในผลิตภัณฑ์ จุด 1 ถึง 4 อ่านสีกลับจากภาพแบรนด์ที่ AI สร้างจากชุดสีของ ORIVILO ในภาพไม่มีสีเขียวมะนาว และเจ้าของเลือกสีม่วงเอง ไม่ได้อ่านจากภาพ |
| `orvCanvas.demo.near`                                                                                  | Added     | `≈ {name}`                                                                                                                                                                                           | `≈ {name}`                                                                                                                                             |
| `orvCanvas.image.alt.colour-reference`                                                                 | Removed   | (both locales)                                                                                                                                                                                       |                                                                                                                                                        |
| `orvCanvas.demo.badge`, `orvCanvas.node.demo`, `orvCanvas.palette.*`, `orvCanvas.image.alt.brand-hero` | Unchanged | Mechanism demo; Demo: colours read back; Violet, Canvas, Ink                                                                                                                                         | ตัวอย่างกลไก; ตัวอย่าง: อ่านสีกลับจากภาพ; ม่วง, พื้น, หมึก                                                                                             |

The note keeps the three honest facts: not in the product yet, the photo is an AI image made from
the palette (the photograph's AI label under `honest-1`), and the owner chose the violet. "Lime is
not in it" answers the question a viewer asks next to `c-pal` (five colours there, four reads here).
The Thai was written as Thai; "สีม่วง" is kept as one phrase so the line does not break between
"สี" and "ม่วง". No middot, no em dash.

## 6. `colour-reference` leaves

Nothing else uses it (git grep: only the data record, the test lists and the alt keys). The builder
changes, in the same PR:

- Delete `packages/design-system/.storybook/static/orv-274/colour-reference.webp` and
  `colour-reference.prompt.md`.
- `orivilo-canvas.data.ts`: drop `"colour-reference"` from `ImageId` and its `IMAGES` record;
  `c-demo` body per D1; `DEMO_POINTS` per D2 and D3; the `DemoPoint` type gains `palette`. The
  `c-demo` comment stays true (a mechanism demo, no source line).
- `orivilo-canvas.test.ts`: the image id list and the treatment map lose `colour-reference` (8 ids
  become 7); "uses every image in a piece, a page or c-demo" holds unchanged.
- `en.ts`, `th.ts`: section 5.
- `orivilo-canvas.tsx` `DemoBody`: D4, D5, D7.
- `orivilo-canvas.stories.tsx`: the plays of section 8.
- The image count everywhere is now seven: the six photographs of ORV-274 kept plus `scene-phone`.
  `.claude/generated-images/2026-11-17-orv-274-colour-reference/` is untracked and is left alone.

## 7. Spec statements this changes

ORV-274 `design.md`:

- Section 4, `c-demo` row: "`colour-reference` at 4:3 as media ... five numbered points (22 px ink
  discs with a card ring). Under it five read-back swatches (20 high, hairline), no hex on the
  canvas". New: D1, D2, D4, D5 of this file.
- The paragraph under that table: "Demo points ... 1 (25, 33) #7A2FA7 ... 5 (54, 45) #E3E2E0. The
  hex values stay in the data and in the swatches' `title`; the canvas shows the colours only."
  New: section 3; the hex is on the card, no `title`.
- Layout table: `c-demo` height 381. New: 649 English, 627 Thai (D8).
- Section 8, "Colour demo" label. New: section 5.
- Section 9: the `colour-reference` row, "### colour-reference (kept as it is)" and its prompt, and
  the count "3 kept (`brand-hero`, `direction-team`, `colour-reference`)". New: removed (section 6).
- Section 10, `demo.badge` / `note` row: the note now as section 5; `demo.near` added.
- Edge 18 ("The demo image is made from the palette, not the other way") stays true: `brand-hero`
  was made from the palette. Unchanged.

ORV-274 `spec.md` and ORV-278 `spec.md`, `images-1`: "seven images and no other: kept
`brand-hero`, `direction-team` and `colour-reference`". ORV-309 `spec.md` row 13 and its reading of
`images-1` ("reads as eight, the seven and `scene-phone`"). New reading: seven, `brand-hero`,
`direction-team`, `direction-making`, `direction-place`, `scene-card`, `scene-sign`,
`scene-phone`; every other rule of `images-1` holds. ORV-309 row 13's "nothing is changed under the
static folder" was that PR's bound and is not reopened; this card deletes two files there.

ORV-274 `tech.md`: the `ImageId` union, the images table row and the download loop that name
`colour-reference`, and "`IMAGES` holds exactly the 7 ids" (true again, a different seven).

ORV-280 `design.md` and ORV-290 `spec.md` row 31: the numerals at `label-sm` hold. The ring rule
("the card's ground in light, the subtle border in dark", the `expectDemoRings` comment) changes to
D4; follow-up C13 is closed by it.

## 8. Proposed acceptance rows for the card's short spec

| #   | Where                                    | Expected                                                                                                                                                                                                                   | Check                                                                                |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| A1  | `ColourChapter`, English, light and dark | `c-demo` shows `brand-hero` whole at 342 x 456 (zoom 1), the warning badge, four rings, the read row and the note; no `colour-reference` anywhere                                                                          | `ColourChapter` play; screenshots of section 9                                       |
| A2  | Data                                     | `DEMO_POINTS` holds the four points of D2; each hex is `#` and six upper-case hex digits; `x` and `y` in (0, 100); each `palette` is the nearest `PALETTE` entry by RGB distance                                           | `orivilo-canvas.test.ts`                                                             |
| A3  | The read row                             | Four `[data-demo-point]` in order 1 to 4; each swatch's background is its hex; its text holds the number, the hex and `≈` with the palette name in the story's locale; line 1 is one line and does not overflow its column | `ColourChapter` play; `InThai` play with `expectNoGlyphClip` on line 2               |
| A4  | Pixel truth                              | The command of section 3 prints the four hex values of D2                                                                                                                                                                  | Reviewer runs it; one `verified` row                                                 |
| A5  | Rings, both modes                        | Four `[data-demo-ring]`, numerals at `label-sm` and centred (row 31 holds); each ring's box shadow holds the light `--ds-surface-card` in light and in dark                                                                | `Default` and `Dark` plays (`expectDemoRings` rewritten, scoped to `data-demo-ring`) |
| A6  | Missing picture                          | With `brand-hero` missing, the `c-demo` slot shows the flood, `brand-hero` and the missing line, no `[data-demo-ring]`, and the read row still has four points                                                             | `MissingImages` play                                                                 |
| A7  | Images                                   | `IMAGES` holds seven ids, `colour-reference` not among them; its webp and prompt file are deleted; the alt key is gone in both locales                                                                                     | `orivilo-canvas.test.ts`; check-i18n; `git diff --name-status`                       |
| A8  | Copy                                     | `demo.note` as section 5 in both locales; `demo.near` added in both; no middot, no em dash                                                                                                                                 | check-i18n; copy check                                                               |
| A9  | Bounds                                   | No change under `src/components`, `src/tokens`, `src/recipes`, `src/profiles` or `apps/web`                                                                                                                                | `git diff --stat` of those paths is empty                                            |

Play changes the builder must make: the `Default` play's numeral filter (`/^[1-5]$/` on every
childless `span` of the node) now also catches the numbers of the read row; select the numerals
through `[data-demo-ring]` and expect four. `expectDemoRings` selects through `[data-demo-ring]`,
expects four, and the `Dark` play passes `--ds-surface-card` resolved in a light scope.

## 9. Proof and screens for visual QA

Rendered in headed Google Chrome from a scratch copy of the static build with this design written
into the copy (no worktree touched). Files:

- `chapter-en-light-100.png`, `chapter-en-dark-100.png`, `chapter-th-dark-100.png`: the 03 chapter
  at 1440 x 900, scale 1, the whole node in view above the dock.
- `node-en-light-2x.png`, `node-en-dark-2x.png`, `node-th-dark-2x.png`: the node alone at zoom 1,
  device scale 2.
- `node-missing-en-light-2x.png`, `node-missing-en-dark-2x.png`: the missing state (D7).
- `overview-en-light-100.png`: the whole board, no new overlap.

Visual QA after the build checks the same seven node and chapter screens, plus Thai light.

## 10. Critique (frontend-design)

- Reads as a demo, not decoration: the badge names it, the numbers tie each ring to one read, and
  the read row ends on palette names, so the eye goes picture, point, colour, palette.
- Numbered markers are a real sequence here (ring n is read n), not template numbering.
- The hex uses the body face with tabular figures, not monospace for data labels.
- One accessory removed: the swatch `title` tooltip, now that the hex is on the card. The colour of
  the badge, the ring and the disc stay as they were; the only new ink is the read row's text.
- Risk kept in view: line 1 is tight (79 px column). Row A3 guards the overflow; if a later font
  change breaks it, line 1 drops to `text-body-xs` before the column or the number goes.
