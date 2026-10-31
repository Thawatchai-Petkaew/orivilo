# ORIVILO brand spec v1.3 (working hypothesis)

Status: hypothesis approved by GOLF on 2026-10-21 for continued work ("ดำเนินการต่อเลย เอาตามที่คุณแนะนำ"). Not a cleared brand: see §8 for the tests still open. Supersedes the palette and type sections of `orivilo-brand-identity-v1.md`; the strategy and voice sections there still apply. The visual case study lives on the "ORIVILO brand identity case study" canvas; the method is in `brand-ci-method.md`. v1.2 (2026-10-31): the signature is violet (owner, ORV-118 comment 10336); see §10. v1.3 (2026-10-31): the mark's opening is 110° and the dot is as wide as the stroke (owner, ORV-118 comments 10375 and 10376); see §11.

## 1. Idea

A loop that does not close, and the dot it stays connected to. A product keeps becoming; every artifact traces back to the reason it exists.

## 2. Mark

File: `assets/orivilo-mark.svg` (150 × 150 grid, ring outer diameter 135, 7.5 units of margin so the ring never touches the box edge).

| Element | Value                                                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------------------------- |
| Ring    | centre (75, 77.5), radius 52.5, stroke 30, round caps; bottom at y = 145                                                  |
| Opening | 110°, centred 55° above the horizontal on the right; the lower end is on the horizontal through the centre, (127.5, 77.5) |
| Dot     | diameter equals the stroke (radius 15 in the master) on the ring centreline at the opening                                |
| Colours | ring ink #16151D or paper #F2F1EC; dot violet #7A22C7 on paper, #B07FEE on ink                                            |
| Small   | ≤ 24 px: stroke 32 to 34 and the dot grows with it (diameter 32 to 34, radius 16 to 17); the dot keeps its colour         |
| Clear   | X = 30 units (the stroke) on every side                                                                                   |
| Minimum | 16 px favicon · 24 px UI · 48 px app icon · 8 mm print                                                                    |

Why 110°: see §11. Why 55°, not 20°: with the opening on the right the ring read as a "c". Moving it to the upper right and filling it with the dot keeps it an "o". Why the margin: the first export had the outer edge exactly on the box, and the renderer clipped the right side into a straight line.

## 3. Wordmark

File: `assets/orivilo-wordmark.svg` (473 × 150 grid, x-height 100, ascender 137, baseline at y = 100). Proportions measured from the owner's reference image (stroke, counters, letter gaps, dot size and gap, v apex) and redrawn at x-height 100.

Drawn, not typeset, to the owner's reference: lowercase geometric sans, monoline stroke 24, flat (butt) terminals, round i-dots (radius 15, 10 above the stem), the o is a true circle (radius 40, outer 104, counter 56). Letters: o r i v i l o. The r is one stroke: the stem rises to 42 and bends through a radius-30 arc into a short flat arm cut square at the right, so there is no separate upright reaching the x-height; the v is a polygon whose point is cut flat by the baseline (20 wide), inner notch at 58% of the x-height; letter gaps 7 · 7 · 5 · 5 · 11 · 13 (round forms get the wider gaps); the l is a plain ascender stem. Only the i-dots and the o are round. Never set the name in a font for a logo context; the drawn wordmark is the only form. The wordmark is not used below 20 px high.

## 4. Lockup and balance

File: `assets/orivilo-lockup.svg`.

- Mark box and wordmark box are both 150 high and bottom-aligned, so the ring bottom (y = 145) sits on the wordmark baseline and the ring's outer height (135) equals the ascender.
- Gap between the boxes = 40 units (about 0.27 × ring height).
- Stroke-to-height: mark 30 / 135 = 0.22, wordmark o 24 / 104 = 0.23. The wordmark is slightly heavier on purpose, matching the reference; the mark's round caps make it read a touch lighter than its measure.
- Stacked: mark centred above the wordmark, gap = 0.5 × mark height. One-colour: dot takes the ring colour.

## 5. Colour (sRGB, WCAG 2 ratios computed 2026-10-21)

| Token                | Value   | Pairs checked                                            |
| -------------------- | ------- | -------------------------------------------------------- |
| surface.canvas       | #F4F4F0 |                                                          |
| surface.card         | #FFFFFF |                                                          |
| surface.selected     | #F4EEFD | ink 16.0 · violet-700 7.5                                |
| surface.inverse      | #16151D |                                                          |
| text.primary         | #16151D | canvas 16.4 · white 18.1                                 |
| text.secondary       | #5B5A66 | canvas 6.2 · white 6.8                                   |
| text.body-soft       | #3A394A | canvas 10.2                                              |
| action.primary       | #7A22C7 | white on it 7.3 · as text on canvas 6.6                  |
| action.primary-hover | #6B22B0 | white on it 8.5                                          |
| action.primary-press | #3F1366 | white on it 14.0                                         |
| selection.fg         | #6B22B0 | on surface.selected 7.5                                  |
| focus.ring           | #16151D | 2 px ring + 2 px white gap, any ground                   |
| border.control       | #85838F | white 3.7 · canvas 3.4 (UI floor 3.0)                    |
| border.subtle        | #E3E2DC | decorative only                                          |
| brand.signature      | #7A22C7 | white on it 7.3; canvas 6.6; never text, never an action |
| feedback.success     | #0B6E4F | canvas 5.7                                               |
| feedback.warning     | #B54708 | canvas 4.9                                               |
| feedback.danger      | #B42318 | canvas 6.0                                               |
| feedback.info        | #1D6FD6 | canvas 4.4: 18 px+ or bold only; else ink + icon         |

Dark set: surface #16151D · card #1E1D26 · text #F2F1EC (card 14.8) · secondary #A9A7B3 (7.0) · action #B07FEE (ink on it 6.1) · signature #B07FEE (ink on it 6.1); lime #D9F66F is the intent action only.

Proportion 60 canvas / 30 ink and neutrals / 10 violet and lime, lime under 2. Coral from v1 is dropped. Lime, violet, and feedback hues never substitute for each other.

## 6. Typography

| Role    | Family                                      | Weights       |
| ------- | ------------------------------------------- | ------------- |
| Display | Anuphan (loopless Thai + Latin)             | 600, 700      |
| Body/UI | IBM Plex Sans + IBM Plex Sans Thai (looped) | 400, 500, 600 |
| Mono    | IBM Plex Mono                               | 400, 500      |

Stack: `"Anuphan", "IBM Plex Sans Thai", system-ui, sans-serif` for display; `"IBM Plex Sans", "IBM Plex Sans Thai", system-ui, sans-serif` for body. All four on Google Fonts, OFL.

Scale (px / line-height): 56 / 1.2 · 32 / 1.25 · 20 / 1.5 · 16 / 1.7 · 14 / 1.6. Display line-height was 1.1 in the case study; the browser specimen (§8) showed tone marks touching the line box at 56 px, so 1.2 is the rule. Looped below 24 px, loopless above. No letter-spacing and no text-transform on Thai. Thai takes the mixed line's line-height.

## 7. Radius, space, motion

Radius s 6 · m 10 · l 14 · xl 22. Space on an 8-px scale. Motion 120 / 200 / 320 ms, one ease-out, `prefers-reduced-motion` honoured.

## 8. Tests

| Test                       | Result 2026-10-21                                                                                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mixed-script specimen      | Run in headless Chromium with the real font files at 14/16/20/32/56 px. No clipping; weight parity holds at 400/500/600; display at 1.1 is tight, rule set to 1.2. Screenshot: `thai-latin-specimen-1x.png` in project files.         |
| 16 px favicon on a tab bar | Run. Violet dot reads on a light tab; lime dot does not (as designed); lime on a dark tab reads.                                                                                                                                      |
| Contrast                   | Every pair in §5 computed by script. Not yet in CI.                                                                                                                                                                                   |
| Name screen (preliminary)  | Web search only. Near names exist: ORIVO (Norway company), Orvibo (smart-home brand), ORIVON (Indian trademark filing), OVILON (US filing). Not a conflict check; needs DIP Thailand classes 9 and 42 and WIPO Global Brand Database. |
| Mark similarity            | Not run. Open-ring-with-dot marks are a common family; the 55° opening and the dot carry the difference. Run before any vector refinement.                                                                                            |
| Lineup with outsiders      | Not run. Needs 3 people outside the team.                                                                                                                                                                                             |
| Print 8 mm, embroidery     | Not run.                                                                                                                                                                                                                              |

## 9. Changes from v1

Lime becomes the signature. Violet moves to 272° and deepens (#7A22C7). Canvas goes cool-neutral; coral is dropped. Dark mode, focus ring, hover/pressed, and the Thai fallback stack are added. The wordmark is drawn, lowercase and geometric, instead of set in Manrope. Tokens are mapped to our semantic layer instead of shadcn names.

## 10. Changes in v1.2

The signature is violet (owner, ORV-118 comment 10336). The mark's dot is #7A22C7 on paper and #B07FEE on ink, the same values as the primary action (`action.primary`) in the ORIVILO profile; `brand.signature` stays a separate token, so brand presence and action never share a reader. Lime #D9F66F is spent only on the intent action (`action.intent`), one button per screen. This replaces "Lime becomes the signature" in §9.

The §8 favicon result of 2026-10-21 (violet reads on a light tab, lime does not) now holds at every size: the dot is violet in every form, so the small form (§2) no longer switches its colour and changes only the stroke. On ink the dot takes #B07FEE (ink on it 6.1).

## 11. Changes in v1.3

The owner kept the mark and asked for two changes (ORV-118 comment 10375) and picked the gap of G2 (comment 10376). At 16 px and 20 px the dot was hard to see: it was 3.2 px and 4.0 px across and 0.42 px and 0.66 px from the upper cap, so at device scale 1 it shared a pixel with the cap and in one colour it fused into the ring.

The dot's diameter now equals the ring stroke in each form: 34 in form 16 (radius 17), 32 in form 24 (radius 16), 30 in the master (radius 15, as drawn in the brand files). The opening widens from 80° to 110°, one arc in every form: `M 57.04 28.17 A 52.5 52.5 0 1 0 127.5 77.5`. The dot's centre (105.11, 34.49), the ring's centre and radius, the round caps, the stroke ladder 34 / 32 / 30 and every colour are unchanged. The gap between the dot and a cap is 1.54 px at 16 px and 2.2 px at 20 px, and at 16 px and scale 1 the pixel toward the upper cap is the canvas.

A wider opening is a little more like a spinner's arc; the lineup with three outsiders (§8) stays the test for that read. The two brand files `orivilo-mark.svg` and `orivilo-lockup.svg` draw the master and carry the new arc with the dot at radius 15.
