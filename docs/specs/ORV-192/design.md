# ORV-192: design notes

Design decisions for the ORV-192 UI polish batch (the rows of Jira ORV-192 comment 10388). Each row is a numbered look change the builder makes as written; the designer proves it rendered before any builder envelope (L-0017). This file holds the rows the designer has decided; other rows join it as their own tasks decide them.

## Rows

| #   | Target                                                                                                                                                                      | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Source                                                                   | Play that proves it                                                                                                                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | The mark's dot: `packages/design-system/src/components/logo/geometry.ts` (`GEOMETRY.mark.dot.r`, `DOT_RADIUS`), the brand files `orivilo-mark.svg` and `orivilo-lockup.svg` | Status: **D2 chosen by the owner (2026-10-31, ORV-192 row 5), built.** The dot's radius becomes 21 drawing units in every form (today 17 / 16 / 15, half the stroke); the centre, the ring, the stroke ladder and every colour stay. **The owner then reduced D2 from radius 21 to 19 (2026-10-31, "ลดลงอีก นิด"), built:** radius 19 in every form, clearance 14.48 / 13.48 / 12.48 units, which is 3.09 px at 32, 2.16 px at 24 and 1.33 px at 16 (D2 at 21 gave 12.48 / 11.48 / 10.48 and 2.66 / 1.84 / 1.12) | Owner, ORV-192 comment 10388 row 5: a bigger dot so it balances the ring | `Base/Logo` story `Small sizes`: the dot's `r` is 19 at every height; the 16 px pixel probe reads pixel (8, 3) as the canvas and pixel (13, 5) within 24 of it, light and dark, full colour and one-colour |

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
