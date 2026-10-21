# ORIVILO brand spec v1.1 (working hypothesis)

Status: hypothesis approved by GOLF on 2026-10-21 for continued work ("ดำเนินการต่อเลย เอาตามที่คุณแนะนำ"). Not a cleared brand: see §8 for the tests still open. Supersedes the palette and type sections of `orivilo-brand-identity-v1.md`; the strategy and voice sections there still apply. The visual case study lives on the "ORIVILO brand identity case study" canvas; the method is in `brand-ci-method.md`.

## 1. Idea

A loop that does not close, and the dot it stays connected to. A product keeps becoming; every artifact traces back to the reason it exists.

## 2. Mark

File: `assets/orivilo-mark.svg` (150 × 150 grid, ring outer diameter 135, 7.5 units of margin so the ring never touches the box edge).

| Element | Value                                                                    |
| ------- | ------------------------------------------------------------------------ |
| Ring    | centre (75, 77.5), radius 52.5, stroke 30, round caps; bottom at y = 145 |
| Opening | 80°, centred 55° above the horizontal on the right                       |
| Dot     | radius 15 (half the stroke) on the ring centreline at the opening        |
| Colours | ring ink #16151D or paper #F2F1EC; dot lime #D9F66F                      |
| Small   | ≤ 24 px on light ground: dot becomes violet #7A22C7, stroke 32–34        |
| Clear   | X = 30 units (the stroke) on every side                                  |
| Minimum | 16 px favicon · 24 px UI · 48 px app icon · 8 mm print                   |

Why 55°, not 20°: with the opening on the right the ring read as a "c". Moving it to the upper right and filling it with the dot keeps it an "o". Why the margin: the first export had the outer edge exactly on the box, and the renderer clipped the right side into a straight line.

## 3. Wordmark

File: `assets/orivilo-wordmark.svg` (479 × 150 grid, x-height 100, ascender 135, baseline at y = 100).

Drawn, not typeset, to the owner's reference: lowercase geometric sans, monoline stroke 25, flat (butt) terminals, round i-dots (radius 14), the o is a true circle (radius 37.5, counter 50). Letters: o r i v i l o. The r is a stem with a quarter-circle shoulder cut flat; the v is a pointed polygon with its apex on the baseline; the l is a plain ascender stem. Only the i-dots and the o are round. Never set the name in a font for a logo context; the drawn wordmark is the only form. The wordmark is not used below 20 px high.

## 4. Lockup and balance

File: `assets/orivilo-lockup.svg`.

- Mark box and wordmark box are both 150 high and bottom-aligned, so the ring bottom (y = 145) sits on the wordmark baseline and the ring's outer height (135) equals the ascender.
- Gap between the boxes = 40 units (about 0.27 × ring height).
- Stroke-to-height: mark 30 / 135 = 0.22, wordmark o 25 / 100 = 0.25. The wordmark is slightly heavier on purpose, matching the reference; the mark's round caps make it read a touch lighter than its measure.
- Stacked: mark centred above the wordmark, gap = 0.5 × mark height. One-colour: dot takes the ring colour.

## 5. Colour (sRGB, WCAG 2 ratios computed 2026-10-21)

| Token                | Value   | Pairs checked                                    |
| -------------------- | ------- | ------------------------------------------------ |
| surface.canvas       | #F4F4F0 |                                                  |
| surface.card         | #FFFFFF |                                                  |
| surface.selected     | #F4EEFD | ink 16.0 · violet-700 7.5                        |
| surface.inverse      | #16151D |                                                  |
| text.primary         | #16151D | canvas 16.4 · white 18.1                         |
| text.secondary       | #5B5A66 | canvas 6.2 · white 6.8                           |
| text.body-soft       | #3A394A | canvas 10.2                                      |
| action.primary       | #7A22C7 | white on it 7.3 · as text on canvas 6.6          |
| action.primary-hover | #6B22B0 | white on it 8.5                                  |
| action.primary-press | #3F1366 | white on it 14.0                                 |
| selection.fg         | #6B22B0 | on surface.selected 7.5                          |
| focus.ring           | #16151D | 2 px ring + 2 px white gap, any ground           |
| border.control       | #85838F | white 3.7 · canvas 3.4 (UI floor 3.0)            |
| border.subtle        | #E3E2DC | decorative only                                  |
| brand.signature      | #D9F66F | ink on it 15.0; never text on light ground (1.2) |
| feedback.success     | #0B6E4F | canvas 5.7                                       |
| feedback.warning     | #B54708 | canvas 4.9                                       |
| feedback.danger      | #B42318 | canvas 6.0                                       |
| feedback.info        | #1D6FD6 | canvas 4.4: 18 px+ or bold only; else ink + icon |

Dark set: surface #16151D · card #1E1D26 · text #F2F1EC (card 14.8) · secondary #A9A7B3 (7.0) · action #B07FEE (ink on it 6.1) · lime unchanged.

Proportion 60 canvas / 30 ink and neutrals / 10 lime. Coral from v1 is dropped. Lime, violet, and feedback hues never substitute for each other.

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
| Mark similarity            | Not run. Open-ring-with-dot marks are a common family; the 55° opening and the lime bead carry the difference. Run before any vector refinement.                                                                                      |
| Lineup with outsiders      | Not run. Needs 3 people outside the team.                                                                                                                                                                                             |
| Print 8 mm, embroidery     | Not run.                                                                                                                                                                                                                              |

## 9. Changes from v1

Lime becomes the signature. Violet moves to 272° and deepens (#7A22C7). Canvas goes cool-neutral; coral is dropped. Dark mode, focus ring, hover/pressed, and the Thai fallback stack are added. The wordmark is drawn, lowercase and geometric, instead of set in Manrope. Tokens are mapped to our semantic layer instead of shadcn names.
