# ORV-192: design notes

Design decisions for the ORV-192 UI polish batch (the rows of Jira ORV-192 comment 10388). Each row is a numbered look change the builder makes as written; the designer proves it rendered before any builder envelope (L-0017). This file holds the rows the designer has decided; other rows join it as their own tasks decide them.

## Rows

| #   | Target                                                                                                                                                                         | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Source                                                                   | Play that proves it                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | The mark's dot: `packages/design-system/src/components/logo/geometry.ts` (`GEOMETRY.mark.dot.r`, `DOT_RADIUS`), the brand files `orivilo-mark.svg` and `orivilo-lockup.svg`    | Status: **D2 chosen by the owner (2026-10-31, ORV-192 row 5), built.** The dot's radius becomes 21 drawing units in every form (today 17 / 16 / 15, half the stroke); the centre, the ring, the stroke ladder and every colour stay. **The owner then reduced D2 from radius 21 to 19 (2026-10-31, "ลดลงอีก นิด"), built:** radius 19 in every form, clearance 14.48 / 13.48 / 12.48 units, which is 3.09 px at 32, 2.16 px at 24 and 1.33 px at 16 (D2 at 21 gave 12.48 / 11.48 / 10.48 and 2.66 / 1.84 / 1.12) | Owner, ORV-192 comment 10388 row 5: a bigger dot so it balances the ring | `Base/Logo` story `Small sizes`: the dot's `r` is 19 at every height; the 16 px pixel probe reads pixel (8, 3) as the canvas and pixel (13, 5) within 24 of it, light and dark, full colour and one-colour                                                                                                                                          |
| 7   | The type weights: `type.display.*`, `type.heading.*`, `type.numeral.*` in `semantic.json` and the two profile overrides (`friendly.json` heading, `professional.json` display) | Status: **recommended by the designer, for the owner to build and judge live.** Display, heading and numeral go from 600 to 500 (six tokens, plus the four profile overrides that restate them). Label stays 500, body and code stay 400. The ToggleGroup pressed item loses its weight step and keeps its chip, ring and ink. Every new weight has a true face in every stack that sets it (no synthesized or substituted face)                                                                                 | Owner, ORV-192 comment 10391 row 7: the type feels too heavy             | `Foundations/Typography` `Scale`: the display rows and the section heading compute 500, the body rows 400, and `document.fonts.load("500 20px Sarabun", "ก")` returns a Sarabun face; `Base/ToggleGroup` `Single`: the pressed item differs by box-shadow and background, not by weight; the face test in `profiles.test.ts` (builder table row 12) |
| 15  | The display face: `font.display`, `type.display.lg` and `type.display.md` in `semantic.json`, and the Friendly restatement in `friendly.json`                                  | Status: **decided by the owner (comment 10400), built.** Thai headings use the body family, Sarabun, in the neutral standard; Friendly keeps Anuphan; Professional follows the base.                                                                                                                                                                                                                                                                                                                             |
| 1   | `Inspector.stories.tsx`, `Panel` wrapper                                                                                                                                       | `overflow-hidden` joins the class list, so the square panel follows the wrapper curve                                                                                                                                                                                                                                                                                                                                                                                                                            | ORV-189 row 9, comment 10378                                             | Inspector `Selected`: wrapper `overflow` is `hidden`; red before the class                                                                                                                                                                                                                                                                          |
| 3   | `BlockLibrary.stories.tsx`, `Narrow` play                                                                                                                                      | New `expectScrollPadding`: a tile scrolled into view keeps the 4 px `scroll-padding` gap at the end and at the start edge                                                                                                                                                                                                                                                                                                                                                                                        | ORV-190                                                                  | `Narrow`: red (gap 4 off) when `.ds-shelf__groups` loses its `scroll-padding`                                                                                                                                                                                                                                                                       |
| 6   | `BlockLibrary.stories.tsx`, `expectRings`                                                                                                                                      | The play ends with the row scrolled to 0 and no tile focused, asserted                                                                                                                                                                                                                                                                                                                                                                                                                                           | ORV-190 ring play                                                        | `Default`, `Narrow`: red (scrollLeft 1806, 2646) when the reset and blur are dropped                                                                                                                                                                                                                                                                |

## Row 5: mark dot size

### What is asked

The owner asks for a bigger dot so it balances the ring (ORV-192 comment 10388, row 5). Today (brand spec v1.3 section 11, ORV-118 design row 2) the dot's diameter equals the ring stroke in each form: radius 17 in form 16 (stroke 34), 16 in form 24 (stroke 32), 15 in the master (stroke 30), so the radius is 0.5 x the stroke. The rule that set it, "the dot is as wide as the ring", was the owner's fix for a dot that vanished at 16 px; it now reads as too light against the ring at every size. A spec that prescribes a poor look is a finding against the spec (L-0019): the change below supersedes brand spec section 2's "Dot" row.

### Geometry the candidates share

All values in drawing units of the 150 box (`geometry.ts` at head f06727d).

- Ring: centre (75, 77.5), radius 52.5, arc `M 57.04 28.17 A 52.5 52.5 0 1 0 127.5 77.5` (opening 110 degrees, centred at 55 degrees), round caps, stroke 34 / 32 / 30 by form. Unchanged in every candidate.
- Today's dot centre (105.11, 34.49) is on the ring centreline at 55 degrees, 48.48 units from each cap's centre.
- Clearance (dot edge to cap edge) = distance from the dot centre to a cap centre, minus half the stroke, minus the dot radius. The two caps are equidistant from the dot in every candidate (within 0.01), so one number per form is given.
- The px column converts clearance at the smallest height of each form: 16 px for form 16, 20 px for form 24, 24.1 px for the master (factor height / 150).
- The wordmark's i-dots are radius 15 on a stem of 24, so they are 1.25 x their stroke across: the letters already carry a dot heavier than their line.

### Candidates

Ratio = dot radius / ring stroke (0.5 means the dot is as wide as the stroke).

| #   | Candidate                                        | Form   | Stroke | Dot r | Ratio | Dot centre                                              | Clearance (units) | Clearance px at the form's smallest height | Dot across, px (16 / 20 / 24 / 48 / 120) |
| --- | ------------------------------------------------ | ------ | ------ | ----- | ----- | ------------------------------------------------------- | ----------------- | ------------------------------------------ | ---------------------------------------- |
| Now | Dot as wide as the stroke                        | 16     | 34     | 17    | 0.5   | (105.11, 34.49) kept                                    | 14.48             | 1.54 at 16                                 | 3.63 at 16                               |
|     |                                                  | 24     | 32     | 16    | 0.5   | kept                                                    | 16.48             | 2.20 at 20                                 | 4.27 at 20, 5.12 at 24                   |
|     |                                                  | master | 30     | 15    | 0.5   | kept                                                    | 18.48             | 2.97 at 24.1                               | 9.6 at 48, 24 at 120                     |
| D1  | 1.2 x the stroke                                 | 16     | 34     | 20.4  | 0.6   | kept                                                    | 11.08             | 1.18 at 16                                 | 4.35 at 16                               |
|     |                                                  | 24     | 32     | 19.2  | 0.6   | kept                                                    | 13.28             | 1.77 at 20                                 | 5.12 at 20, 6.14 at 24                   |
|     |                                                  | master | 30     | 18    | 0.6   | kept                                                    | 15.48             | 2.49 at 24.1                               | 11.52 at 48, 28.8 at 120                 |
| D2  | **One dot, radius 21, every form** (recommended) | 16     | 34     | 21    | 0.62  | kept                                                    | 10.48             | 1.12 at 16                                 | 4.48 at 16                               |
|     |                                                  | 24     | 32     | 21    | 0.66  | kept                                                    | 11.48             | 1.53 at 20                                 | 5.6 at 20, 6.72 at 24                    |
|     |                                                  | master | 30     | 21    | 0.7   | kept                                                    | 12.48             | 2.01 at 24.1                               | 13.44 at 48, 33.6 at 120                 |
| D3  | Radius 24, centre moved out                      | 16     | 34     | 24    | 0.71  | (108.5, 29.65), moved 5.91 out along the 55 degree line | 10.48             | 1.12 at 16                                 | 5.12 at 16                               |
|     |                                                  | 24     | 32     | 24    | 0.75  | moved, as above                                         | 11.48             | 1.53 at 20                                 | 6.4 at 20, 7.68 at 24                    |
|     |                                                  | master | 30     | 24    | 0.8   | moved, as above                                         | 12.48             | 2.01 at 24.1                               | 15.36 at 48, 38.4 at 120                 |

D3's centre is moved so its clearances equal D2's; that isolates size from spacing. Its dot top is at y = 5.65, above the ring's top edge (y = 10 in the master, 8 in form 16) and inside the 7.5-unit box margin the brand spec keeps (section 2); its outer reach from the ring centre is 82.41 against the ring's 67.5. D2's dot top is y = 13.49, below the ring's top edge; its reach is 73.5, so it stands 6 units proud of the ring's outer circle at 55 degrees, as any dot wider than the stroke on the centreline does.

Dot area against today's master: D1 1.44 x, D2 1.96 x, D3 2.56 x.

### 16 px at device scale 1 (the favicon case the dot size was last changed for)

The SVG rasterised onto a 16 x 16 canvas at scale 1 over the canvas colour; numbers are the RGB distance from the canvas (0 is pure canvas), light / dark, full colour and one-colour gave the same within 4. Source: `/tmp/orv-192-dot/probe2.txt`.

| #   | Pixel (8, 3), toward the upper cap | Pixel (8, 4) | Pixel (13, 5), toward the lower cap | Pixel (12, 5), today's story probe | Read                                                                   |
| --- | ---------------------------------- | ------------ | ----------------------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| Now | 0 / 0                              | 0 / 0        | 0 / 0                               | 14 / 14                            | Parted                                                                 |
| D1  | 0 / 0                              | 0 / 0        | 0 / 0                               | 123 / 138 (inside the dot now)     | Parted                                                                 |
| D2  | 7 / 6 (10 / 9 one-colour)          | 0 / 0        | 1 / 1 (2 / 0 one-colour)            | 145 / 163 (inside the dot now)     | Parted: a canvas pixel on each side of the dot                         |
| D3  | 0 / 0                              | 0 / 0        | 54 / 60 (83 / 80 one-colour)        | 180 / 202                          | Joined toward the lower cap in one-colour; the dot sits above the ring |

Every larger dot covers pixel (12, 5), so the story's second probe moves to (13, 5), and D2's faint antialias at (8, 3) moves the first probe to (8, 4). At 20 px (form 24) D1 and D3 show canvas on both sides; D2 shows canvas toward the upper cap and #E8DFEC light, #241E32 dark (distance 25, 27) on the line toward the lower cap, at a clearance of 1.53 px.

### Chosen: D2, one dot of radius 21 in every form (recommended by the designer, chosen by the owner)

- Balance. At 48 and 120 px the dot at 0.7 x the master stroke reads as a counterweight to the ring's heavy lower body, set in the opening, where today's dot reads as a crumb broken off the ring end. D1 (1.44 x the area) is a change the eye barely registers at 24 and 48 px, so it does not answer "bigger". D3 starts to read as a satellite riding above the ring, the "c." read of the rejected ORV-118 candidate B3, and breaks the box margin.
- One dot. The small forms thicken the ring (34, 32) and keep the dot at 21, so the dot grows against the ring where the ring grows and the opening stays clear: 1.12 px at 16 px with a canvas pixel on each side at scale 1, in light, dark and one-colour. A per-form dot ratio would shrink the 16 px clearance to 0.82 px at 0.7 x stroke 34 and bring back the fused dot the owner reported in ORV-118 comment 10374.
- The dot stays on the ring centreline at the opening (brand spec section 1: "the dot it stays connected to"); only its size changes.
- Trade-off: the clearance at 16 px drops from 1.54 to 1.12 px and at 20 px from 2.2 to 1.53 px. Both keep a canvas pixel toward the upper cap; toward the lower cap at 20 px the lightest pixel is about 10 percent ink in full colour. If the owner wants more air, D1 keeps 1.18 / 1.77 px with less weight.

### Wordmark i-dots: they stay

Mark only, as the owner's comment names. The i-dots (radius 15 on a 24 stem, 1.25 x the stroke across) already sit heavier than their line, and they are ink, not the signature colour, so in the lockup they are not siblings of the violet mark dot. Growing them to the mark's 0.7 ratio (radius 16.8) would push their top to y = -41.8 against the wordmark box top at -45 and close the 10-unit gap above the stems unless the dots move. In the 24 and 48 px lockups on the sheet D2's mark dot reads as the brand accent, a step larger than the i-dots, without crowding the ascender line.

### What the builder changed (D2, chosen by the owner)

| Where                                                                               | Before                                                                              | After                                                                                                                                                                         |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `geometry.ts` `GEOMETRY.mark.dot` (line 87)                                         | `r: 15`                                                                             | `r: 21`; cx 105.11, cy 34.49 unchanged                                                                                                                                        |
| `geometry.ts` `DOT_RADIUS` (lines 150 to 155)                                       | `{ "16": 17, "24": 16, master: 15 }`, comment "half the ring's stroke"              | `{ "16": 21, "24": 21, master: 21 }`, comment: one dot in every form, 0.7 x the master stroke (ORV-192 row 5). `drawing.ts` is unchanged                                      |
| `logo.test.ts` W2 (lines 205 to 213)                                                | `["30 18.48 3.94", "32 16.48 2.64", "34 14.48 1.54"]`                               | `["30 12.48 2.66", "32 11.48 1.84", "34 10.48 1.12"]` and the test title to match                                                                                             |
| `logo.test.ts` (lines 216 to 221)                                                   | the dot is as wide as the stroke in each form                                       | the dot is radius 21 in every form and `GEOMETRY.mark.dot.r` equals `DOT_RADIUS.master`                                                                                       |
| `logo.test.ts` markup snapshot (line 373)                                           | `r="17"`                                                                            | `r="21"`                                                                                                                                                                      |
| `Logo.stories.tsx` `Small sizes` play (lines 252 to 262)                            | dot diameter equals the stroke; radii `"17 17 17 16 16 15 15 15"`                   | the dot's `r` is 21 at every height; radii `"21 21 21 21 21 21 21 21"`                                                                                                        |
| `Logo.stories.tsx` pixel probe (lines 284 to 287)                                   | `off(8, 3)` is 0, `off(12, 5)` within 24                                            | `off(8, 4)` is 0, `off(13, 5)` within 24; comment cites ORV-192 row 5                                                                                                         |
| `docs/context/brand/assets/orivilo-mark.svg` line 3, `orivilo-lockup.svg` line 4    | `r="15"`                                                                            | `r="21"`. `orivilo-wordmark.svg` unchanged                                                                                                                                    |
| Brand spec (`orivilo-brand-spec-v1.1.md`), becomes v1.4 with a section 12           | section 2 "Dot": diameter equals the stroke; "Small": the dot grows with the stroke | "Dot": radius 21 (diameter 42, 1.4 x the master stroke) on the ring centreline at the opening, in every form; "Small": the stroke grows to 32 and 34, the dot stays radius 21 |
| `docs/specs/ORV-118/spec.md` `logo-geometry-1`, `logo-size-1`, play row 3 (line 19) | the dot's diameter equals the form's stroke; radii 17, 17, 17, 16, 16, 15, 15, 15   | the dot is radius 21 in every form; radii all 21                                                                                                                              |
| `docs/specs/ORV-118/tech.md` markup example and W2 numbers                          | `r="17"`, gaps 18.48, 16.48, 14.48                                                  | `r="21"`, gaps 12.48, 11.48, 10.48                                                                                                                                            |
| `catalog/base/logo.yaml` rule (line 24)                                             | "in each form the dot's diameter equals the ring stroke (34, 32, 30)"               | "the dot is radius 21 in every form"                                                                                                                                          |

Unchanged: the dot's centre, so the stories' colour probe at (105.11, 34.49) stays inside the dot; the ring, its caps and the stroke ladder; the box, the clear space and the lockup offsets (the dot's top at 13.49 stays below the ring's top edge); every token and contrast pair (the dot's colour is not touched). The favicon, app icons and Storybook brand image come from `drawing.ts`, so they follow when they are next generated.

### Rendered

Method: the mark drawn from `geometry.ts` values (ring arc, stroke ladder, dot centre) with each candidate's radius and centre, by `/tmp/orv-192-dot/marks.mjs`, in a scratch page shot with Playwright 1.56.1 Chromium at device scale 2, reduced motion (`/tmp/orv-192-dot/render.mjs`). Colours are the neutral profile's (`src/tokens/generated.css`): canvas #F4F4F0 light, #16151D dark; ring #16151D light, #F2F1EC dark; dot #7A22C7 light, #B07FEE dark. The 1x cells are the SVG drawn onto a canvas of the mark's own size and shown enlarged without smoothing. The lockup draws the wordmark from `GEOMETRY.wordmark` unchanged at `wordmarkAt` (190, 45).

Side by side, Now, D1, D2, D3 at one height (with the 1x enlargement at 16 and 24):

- `/tmp/orv-192-dot/side-16px-light.png`, `/tmp/orv-192-dot/side-16px-dark.png`
- `/tmp/orv-192-dot/side-24px-light.png`, `/tmp/orv-192-dot/side-24px-dark.png`
- `/tmp/orv-192-dot/side-48px-light.png`, `/tmp/orv-192-dot/side-48px-dark.png`
- `/tmp/orv-192-dot/side-120px-light.png`, `/tmp/orv-192-dot/side-120px-dark.png`

Sheets: `/tmp/orv-192-dot/sheet-light.png`, `/tmp/orv-192-dot/sheet-dark.png` (every candidate at 16, 20, 24, 48 and 120 px, 16 px 1x, 16 px one-colour 1x, 20 px 1x, the horizontal lockup at 24 and 48 px), and both stacked as the contact sheet `/tmp/orv-192-dot/contact-sheet.png`.

What the renders show:

- Now: at 120 px the dot is exactly as wide as the two caps either side of it, so it reads as a third cap end rather than a counterweight, and the ring outweighs it.
- D1: a slightly fuller dot; at 24 and 48 px it is hard to tell from Now.
- D2: at 48 and 120 px the dot fills the opening's centre as a clear counterweight, with air on both sides; at 16 px 1x it is a separate square of violet with canvas round it, in light, dark and one-colour; in the 24 and 48 px lockups it is a step larger than the i-dots and reads as the accent.
- D3: the dot rides above the ring's top line at 48 and 120 px and starts to read as a separate satellite; at 16 px one-colour it touches the lower cap.

### Screens to check in visual QA (D2 is built)

- `base-logo--small-sizes`, `base-logo--kinds` and `base-logo--one-colour` at 360 and 1440, light and dark, under neutral, Professional and Friendly, device scale 1 and 2: at 16 and 20 px the dot stands apart from both caps in full colour and one-colour; at 120 px the dot sits on the ring centreline and below the ring's top edge.
- The favicon and the 32 px app icon in a browser tab bar, light and dark.
- The Storybook manager header (horizontal lockup at 24) and `/account` (stacked at 80): the mark dot reads larger than the i-dots and nothing crowds the ascender line.

## Row 7: type weights

### What row 7 asks

The owner says the type feels too heavy (ORV-192 comment 10391, row 7). This section lists every type token with its weight today and checks which weights the loaded font files carry. It then gives one recommended weight per token, with the reason. The owner builds the recommendation and judges it live.

### Weights today

Source: `semantic.json` lines 931 to 1062 at head 9349d7c, plus the profile overrides in `src/profiles/source`. Neutral is the base set. A profile column is empty where that profile does not restate the token.

| Token        | Stack (neutral) | Size / line-height | Weight today | Friendly override  | Professional override |
| ------------ | --------------- | ------------------ | ------------ | ------------------ | --------------------- |
| `display.lg` | Anuphan         | 56 / 1.2           | 600          |                    | Plex Sans stack, 600  |
| `display.md` | Anuphan         | 32 / 1.25          | 600          |                    | Plex Sans stack, 600  |
| `heading.md` | Plex Sans stack | 24 / 1.3           | 600          | Anuphan stack, 600 |                       |
| `heading.sm` | Plex Sans stack | 20 / 1.5           | 600          | Anuphan stack, 600 |                       |
| `body.lg`    | Plex Sans stack | 20 / 1.5           | 400          |                    |                       |
| `body.md`    | Plex Sans stack | 16 / 1.7           | 400          |                    |                       |
| `body.sm`    | Plex Sans stack | 14 / 1.6           | 400          |                    |                       |
| `label.md`   | Plex Sans stack | 14 / 1.6           | 500          |                    |                       |
| `label.sm`   | Plex Sans stack | 13 / 1.5           | 500          |                    |                       |
| `code.md`    | Plex Mono stack | 14 / 1.6           | 400          |                    |                       |
| `numeral.lg` | Plex Sans stack | 40 / 1             | 600          |                    |                       |
| `numeral.md` | Plex Sans stack | 32 / 1             | 600          |                    |                       |

The stacks come from `primitives.json` `font.family`:

- Anuphan stack: `Anuphan, "IBM Plex Sans Thai", system-ui, sans-serif`.
- Plex Sans stack: `"IBM Plex Sans", Sarabun, system-ui, sans-serif`.
- Plex Mono stack: `"IBM Plex Mono", ui-monospace, monospace`.

Three places set a weight outside the tokens:

- `typography.stories.tsx` puts `font-semibold` (600) on the display rows, the page title and the section heading (lines 14, 19, 34 and 50).
- `Resizable.stories.tsx` line 9 puts `font-semibold` on its fixture title.
- The ToggleGroup pressed item reads `--ds-type-heading-sm-font-weight` (`recipes.css` line 2198).

### Which weights the loaded files carry

Read from the files in `src/tokens/fonts` with fontTools (the `fvar` axis and the `OS/2` weight class), and from the `@font-face` rules in `fonts.css`. A browser uses a variable face only inside the range its `@font-face` declares.

| Face               | Used for                                | Files                                                             | Weights a true face exists for                                                       |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Anuphan            | Latin and Thai of the Anuphan stack     | `anuphan-latin`, `-latin-ext`, `-thai`: variable, axis 100 to 700 | any value 400 to 700 (declared `400 700`)                                            |
| IBM Plex Sans      | Latin and digits of the Plex Sans stack | `plex-sans-latin`, `-latin-ext`: variable, axis 100 to 700        | any value 400 to 600 (declared `400 600`; the browser clamps anything outside it)    |
| Sarabun            | Thai of the Plex Sans stack (ORV-58)    | `sarabun-400-thai`, `-500-`, `-600-`: static, Thai subset only    | 400, 500, 600                                                                        |
| IBM Plex Sans Thai | second in the Anuphan stack             | static 400, 500, 600, Thai and Latin subsets                      | 400, 500, 600; used only for a glyph Anuphan lacks, so no probed text rendered in it |
| IBM Plex Mono      | Latin of the Plex Mono stack            | `plex-mono-400-latin`, `-500-latin`: static, Latin only           | 400, 500                                                                             |

The Thai face of the Plex Sans stack is Sarabun, not IBM Plex Sans Thai. The stack has named Sarabun second since ORV-58, and the probes below found Sarabun on every Thai run in body, label and heading text.

This limits the weights each token can safely take:

- **Plex Sans stack: only 400, 500 and 600 are safe.** A value between them splits the line. At 450, the Latin draws in Plex Sans at 450, but the Thai draws in Sarabun at 500, because CSS font matching takes the next weight up to 500. The Thai then looks heavier than the Latin beside it, which breaks DESIGN.md §4 (Thai and Latin on one line must match). 300 is declared by no face, so it renders as 400: it changes nothing.
- **Anuphan stack:** any value from 400 to 700 is safe.
- **Plex Mono stack:** 400 or 500. Thai in code has no face in this stack and falls to the system font (Ayuthaya on macOS in the probe). That is already true today, and this row does not change it.
- **Across profiles:** a token keeps one value under every profile. So a token that two profiles set in different stacks must suit both. That covers display (Anuphan, and Plex Sans under Professional) and heading (Plex Sans, and Anuphan under Friendly), so they can take only 400, 500 or 600.

### Recommended weights

| Token                           | Today | Row 7   | Reason                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------- | ----- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `display.lg`, `display.md`      | 600   | **500** | Display is the largest ink on a screen, so the owner sees this step first. Not 400: `display.md` sets page titles (the Typography page title at 32). At 400 that title reads lighter than the 20 px section heading at 500 under it (rendered and rejected, below). 500 has a true face in Anuphan (`Anuphan-Regular_Medium`) and in the Professional stack (Plex Sans Medium, Sarabun Medium) |
| `heading.md`, `heading.sm`      | 600   | **500** | One step lighter still keeps headings above body. `heading.sm` and `body.lg` are both 20 / 1.5 in the same stack, so weight is the only difference between a 20 px heading and 20 px text, and 400 would erase it. 500 has a true face in both stacks (Sarabun Medium and Plex Sans Medium, and Anuphan Medium under Friendly)                                                                 |
| `numeral.lg`, `numeral.md`      | 600   | **500** | Bento numerals at 32 and 40 px stay the strongest thing in a tile through their size. At 600 they read as slabs beside titles at 500. `IBMPlexSans-Medium` renders them (probe)                                                                                                                                                                                                                |
| `label.md`                      | 500   | 500     | Labels name controls. At 400, a ghost button (no fill and no border, like the card's open action) and a field label read as running text                                                                                                                                                                                                                                                       |
| `label.sm`                      | 500   | 500     | Button `sm` reads `label.sm`, while `md` and `lg` read `label.md`. At 400 the small button looks visibly lighter than its siblings in `Base/Button` `Sizes` (rendered and rejected, below). The two label tokens move together or not at all                                                                                                                                                   |
| `body.lg`, `body.md`, `body.sm` | 400   | 400     | Already the lightest declared face. 300 renders as 400 in this stack (see above), and 400 is the lightest weight looped Thai can take at 14 px                                                                                                                                                                                                                                                 |
| `code.md`                       | 400   | 400     | Plex Mono 400 is the lightest file loaded                                                                                                                                                                                                                                                                                                                                                      |

After row 7 the scale uses two weights. 500 is for anything that names something: display, heading, label and numeral. 400 is for running text: body and code. Among the naming roles, size sets the rank: display 56 and 32, numeral 40 and 32, heading 24 and 20, label 14 and 13.

**ToggleGroup pressed item.** Today the pressed item is 600 (the heading weight) and the other items are 500 (the label weight). After row 7 both are 500. The pressed item still has the raised card chip, its 1 px ring, and `text.primary` ink against `text.secondary`. That is still more than colour, as the catalog rule asks, and a text item no longer changes width when it is pressed. The recipe drops the weight line rather than point at a heavier token, for two reasons: no semantic weight above 500 is left, and the items are usually icons (catalog rule 2).

**Seen, but not part of row 7:**

- `label.sm` (500) also sets text that is not a label: `chat.meta-type`, the chat notice under the composer, `taskbar.meta-type`, `tooltip.type`, `menu.option.description-type` and `edge.label-type`. If the canvas still reads heavy after row 7, the next step is to point those component tokens at `body.sm`. That is a mapping change, not a weight change.
- The Typography story's display rows use the `font-display` family, not the display token's family, so under Professional they stay in Anuphan.
- In dark mode, the Dialog's selected input text is hard to read on its selection highlight.

This row changes none of the three.

### What the builder changes

Line numbers are at head 9349d7c.

| #   | Where                                                                                                                                                                                              | Before                                                                                                                                                                                  | After                                                                                                                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `packages/design-system/src/tokens/source/semantic.json` lines 939, 949 (`type.display.lg`, `.md`)                                                                                                 | `"fontWeight": "{font.weight.600}"`                                                                                                                                                     | `"fontWeight": "{font.weight.500}"`                                                                                                                                                                                                                                                                                                 |
| 2   | `semantic.json` lines 961, 971 (`type.heading.md`, `.sm`)                                                                                                                                          | `{font.weight.600}`                                                                                                                                                                     | `{font.weight.500}`                                                                                                                                                                                                                                                                                                                 |
| 3   | `semantic.json` lines 1049, 1059 (`type.numeral.lg`, `.md`)                                                                                                                                        | `{font.weight.600}`                                                                                                                                                                     | `{font.weight.500}`                                                                                                                                                                                                                                                                                                                 |
| 4   | `src/profiles/source/friendly.json` lines 415, 424 (heading md, sm)                                                                                                                                | `{font.weight.600}`                                                                                                                                                                     | `{font.weight.500}`. Without this change, Friendly sets its headings back to 600                                                                                                                                                                                                                                                    |
| 5   | `src/profiles/source/professional.json` lines 360, 369 (display lg, md)                                                                                                                            | `{font.weight.600}`                                                                                                                                                                     | `{font.weight.500}`                                                                                                                                                                                                                                                                                                                 |
| 6   | `src/tokens/generated.css` and `src/profiles/generated.css`                                                                                                                                        | `--ds-type-{display,heading,numeral}-*-font-weight: var(--op-font-weight-600)`                                                                                                          | Regenerate with `pnpm --filter @orivilo/design-system tokens`; never edit these files by hand. They then read `var(--op-font-weight-500)`. `primitives.json` does not change (`font.weight.600` stays for other uses)                                                                                                               |
| 7   | `src/foundations/typography.stories.tsx` lines 14, 19, 34                                                                                                                                          | `font-display text-display-lg font-semibold` and `... text-display-md font-semibold` (the display rows and the page title)                                                              | Drop `font-semibold`. The `text-display-*` utility already carries the token weight (checked: without the class, the rows compute today's 600, and 500 under row 7)                                                                                                                                                                 |
| 8   | `typography.stories.tsx` lines 15, 20                                                                                                                                                              | `spec: "56 / 1.2, weight 600"`, `"32 / 1.25, weight 600"`                                                                                                                               | `"56 / 1.2, weight 500"`, `"32 / 1.25, weight 500"`                                                                                                                                                                                                                                                                                 |
| 9   | `typography.stories.tsx` line 50 (section heading)                                                                                                                                                 | `font-display text-body-lg font-semibold`                                                                                                                                               | `font-display text-heading-sm`: the same 20 / 1.5, with the weight from `heading.sm` (checked: 600 today, 20 px, 30 px line). The `Scale` play also checks that the display rows and this heading compute 500, the body rows compute 400, and `document.fonts.load("500 20px Sarabun", "ก")` returns a Sarabun face                 |
| 10  | `src/components/resizable/Resizable.stories.tsx` line 9                                                                                                                                            | `<p className="m-0 font-semibold">`                                                                                                                                                     | `<p className="m-0 text-label-md">`: a block name takes the label type, and a story sets no literal weight                                                                                                                                                                                                                          |
| 11  | ToggleGroup: `src/recipes/recipes.css` lines 2194 and 2198; `ToggleGroup.stories.tsx` lines 75 to 79; `component.json` line 1621 (`toggle.$description`); `catalog/base/toggle-group.yaml` line 18 | Comment "the chip, its ring and a heavier weight"; `font-weight: var(--ds-type-heading-sm-font-weight)`; the play asserts that the pressed weight is greater; "a ring and heavier text" | Comment "the chip and its ring"; the weight line deleted; the play asserts that the pressed item's background differs from the other item's (the box-shadow assertion stays); "a ring and `text.primary` ink" in the description and in the catalog rule                                                                            |
| 12  | `src/profiles/profiles.test.ts` (new case)                                                                                                                                                         | No test ties a weight to a loaded face                                                                                                                                                  | For the base set and every profile, each `type.*` weight is one its stack carries: Anuphan 400 to 700, Plex Sans stack 400, 500 or 600, Plex Mono 400 or 500. This test guards the substitution rule above                                                                                                                          |
| 13  | `DESIGN.md` lines 22 and 127                                                                                                                                                                       | "big numerals set in the body face at weight 600"; "use the body face at weight 600"                                                                                                    | weight 500                                                                                                                                                                                                                                                                                                                          |
| 14  | `DESIGN.md` §4 table lines 133 and 134, the header version, the change log                                                                                                                         | Display weights "600, 700"; Body/UI "400, 500, 600"                                                                                                                                     | Display "500 (faces 400 to 700)"; Body/UI "400, 500 (faces 400, 500, 600)". New v1.45 entry: display, heading and numeral go from 600 to 500 (ORV-192 row 7), and the toggle pressed item drops its weight step. Impact: every card, dialog, inspector, side sheet and direction title, the bento numerals, and the Typography page |

Unchanged:

- Every size, line-height, letter-spacing and family.
- Every colour and contrast pair. No pair depends on weight, and no weight reaches the 700 that counts as bold for large text.
- `profiles.test.ts` line 178, which sets 700 in a made-up override and still passes.

### Rendered (row 7)

**Method.** `/tmp/orv-192-weight/scripts/shoot.cjs` drives Playwright 1.56.1 Chromium against Storybook on `http://localhost:6400`, which serves this worktree. Settings: viewport 1024 wide, device scale 2, reduced motion, neutral profile, each shot clipped to the story's content.

- Before is the story as it is.
- After injects `/tmp/orv-192-weight/scripts/after.css` with `page.addStyleTag`. That sets `--ds-type-{display-lg,display-md,heading-md,heading-sm,numeral-lg,numeral-md}-font-weight: 500` on every element. It also sets the Typography story's `font-semibold` rows to their token weight (builder rows 7 and 9).

**Contact sheet:** `/tmp/orv-192-weight/contact-sheet.png`. It shows every story in Thai and English, light and dark, before and after.

**Side-by-side pairs** are under `/tmp/orv-192-weight/pairs/`, one file per story, locale and mode, named `<story>__<th|en>__<light|dark>__pair.png` (32 files). They cover:

- `base-button--variants`
- `base-button--sizes`
- `application-card--default`
- `application-dialog--open`
- `application-inspector--selected`
- `application-canvas-chat--idle`
- `application-block-library--default`
- `foundations-typography--scale`

The ToggleGroup has its own pair, `base-toggle-group--single__all__pair.png`. The single shots behind the pairs are `/tmp/orv-192-weight/<story>__<locale>__<mode>__<before|after>.png` (72 files).

**Rendered and rejected:**

- `/tmp/orv-192-weight/rejected/base-button--sizes__th__light__labelsm400.png`: `label.sm` at 400, where the small button is lighter than its siblings. Compare with `/tmp/orv-192-weight/rejected/base-button--sizes__th__light__before.png`.
- `/tmp/orv-192-weight/rejected/foundations-typography--scale__th__light__display400.png`: display at 400, where the 32 px page title is lighter than the section heading. Compare with `/tmp/orv-192-weight/rejected/foundations-typography--scale__th__light__after.png`.

**What the renders show:**

- **Typography:** the 56 and 32 display rows lose their slab look and still lead the page. The section heading stays above the 20 px body row through weight alone. The 56 px Thai and Latin line keeps its two lines.
- **Card, Dialog, Inspector:** the title steps down from 600 to 500 and still leads the body text under it, in Thai and English, light and dark. The change is smaller in Thai than in Latin, because Sarabun's 500 and 600 are closer together than Plex Sans's.
- **Button Variants, Canvas chat, Block library:** no visible change, because their text is set in label and body (probed: the chat title is `Sarabun-Medium`, the shelf and node text `Sarabun-Regular`, the edge labels `Sarabun-Medium`).
- **ToggleGroup:** the pressed item keeps its chip and ring. These items are icons, so the weight step was never visible here.

**Faces and geometry.** The probe is `/tmp/orv-192-weight/scripts/probe.cjs` (CDP `CSS.getPlatformFontsForNode`); its output is in `/tmp/orv-192-weight/faces.txt`.

- **Before:** the display rows are `Anuphan-Regular_SemiBold`, the card title is `Sarabun-SemiBold` and `IBMPlexSans-SemiBold`, and the bento values are `IBMPlexSans-SemiBold`.
- **After, neutral:** the display rows are `Anuphan-Regular_Medium`, the card and dialog titles are `Sarabun-Medium` with `IBMPlexSans-Medium`, and the bento values are `IBMPlexSans-Medium`.
- **After, Friendly:** the card and dialog titles are `Anuphan-Regular_Medium`.
- **After, Professional:** the titles are `Sarabun-Medium` and `IBMPlexSans-Medium`.
- Every face is a named Medium instance or file, so nothing is synthesized or substituted.
- **Heights** (`/tmp/orv-192-weight/measure.txt`): in all eight stories, every button, heading, dialog, card, inspector and chat box keeps its height before and after, at 360 and 1024 wide, in Thai and English.

### Screens to check in visual QA (once built)

- `foundations-typography--scale` at 360 and 1440, light and dark, Thai and English, under neutral, Professional and Friendly. Check that the display rows and the section heading are at 500, the body rows at 400, and the Thai marks above and below are whole at 56 px.
- `application-card--default`, `application-card--bento`, `application-dialog--open`, `application-inspector--selected`: the title at 500 leads the body text, and the bento numerals are at 500.
- `base-button--sizes` and `base-button--variants`: unchanged, with all three sizes at one weight.
- `base-toggle-group--single` and `base-toggle-group--thai-centred`: the pressed item reads through its chip and ring, and a text item keeps its width when pressed.
- The Friendly profile on Card and Dialog (headings in Anuphan at 500), and Professional on the Typography display rows.

## Row 15: Thai headings in Sarabun

### Decision

The owner decided (Jira ORV-192 comment 10400): Thai headings use the body family, Sarabun, in our standard only. The standard is the neutral set in `semantic.json`; Friendly keeps Anuphan. This reverses the display half of the ORV-58 split (Anuphan at 24 px and above), and it supersedes the row 7 notes that call display "Anuphan" in the base set.

### What changes

| Token                                     | Base before           | Base after              | Friendly                        | Professional                  |
| ----------------------------------------- | --------------------- | ----------------------- | ------------------------------- | ----------------------------- |
| `font.display`                            | `font.family.anuphan` | `font.family.plex-sans` | restated, `font.family.anuphan` | none, follows the base        |
| `type.display.lg` (56 / 1.2, weight 500)  | Anuphan stack         | Plex Sans stack         | restated, Anuphan stack         | own override, Plex Sans stack |
| `type.display.md` (32 / 1.25, weight 500) | Anuphan stack         | Plex Sans stack         | restated, Anuphan stack         | own override, Plex Sans stack |

Size, line-height, weight and letter-spacing are untouched. The Friendly restatement copies the old base values for these two types, so Friendly renders exactly as before.

### Result in the three profiles

- **Neutral (the standard):** `font-display` and display-size Thai render `"IBM Plex Sans", "Sarabun"`: Latin and digits in Plex Sans, Thai in looped Sarabun 500. A heading's Thai now matches the Thai in the text under it.
- **Professional:** no new override. Its `type.display.*` were already the Plex Sans stack, but `font.display` followed the base (Anuphan), so a `font-display` line and a `text-display-*` line could disagree. Both are now Plex Sans, so display headings are consistent.
- **Friendly:** `font.display` and `type.display.*` are restated with Anuphan, next to its existing Anuphan `type.heading.*`. Display and heading are both Anuphan, as before.

### Why this is allowed

`font` and `type` are not in `LOCKED_GROUPS`, and both names exist in the base set, so the friendly override is a new value for existing semantic names, which the profile rules permit.

### Guard

`profiles.test.ts` "display face (row 15)": under neutral, Professional and Friendly, the first two families of `font.display`, `type.display.lg` and `type.display.md` are `IBM Plex Sans`, `Sarabun` under neutral and Professional, and `Anuphan`, `IBM Plex Sans Thai` under Friendly. The Typography `Scale` play reads the computed family of the two display rows (`/^"IBM Plex Sans", Sarabun,/`) and loads Sarabun at 500 and 56 px for a Thai glyph, as it already does at 500 and 20 px.

### Screens to check in visual QA

- `foundations-typography--scale` under neutral and Professional: the display rows and the title are Sarabun Medium for Thai; under Friendly they are Anuphan Medium.
- Any story that shows a display-size Thai title (direction titles, canvas titles) under neutral: the Thai is looped, with tone marks whole at 56 px.
