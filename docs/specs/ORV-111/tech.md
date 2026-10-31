---
issue: ORV-111 (https://tpetkaew.atlassian.net/browse/ORV-111)
spec: docs/specs/ORV-111/spec.md (v1.0)
---

# ORV-111: tech notes

## Before

Row 1 of the spec. The base is `18763ee` (develop with ORV-192 merged: Sarabun in every profile, the new focus and type tokens, and `layout: "centered"` on the Button stories). The branch holds that base plus the helper (`expectInkCentred`, `measureInkCentre` in `packages/design-system/src/testing/visual-asserts.ts`) and the story `LabelCentre` (`Button.stories.tsx`); no recipe, token or font file differs from the base. Chromium, device scale factor 1, neutral profile, `Button variant="primary"`. The earlier readings were taken on `eeb2e71`; this section replaces them.

The play is red on the base:

```bash
pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/button/Button.stories.tsx
```

```text
FAIL  |storybook (chromium)| src/components/button/Button.stories.tsx > Label Centre
3 of 6 labels sit more than 1 px from the centre of their control (a negative offset is above it):
<button.ds-button> "บันทึกการเปลี่ยนแปลง", 32 px tall, in neutral light: ink 3.99 to 20.98 px, offset -3.51 px
<button.ds-button> "บันทึกการเปลี่ยนแปลง", 40 px tall, in neutral light: ink 7.96 to 25.96 px, offset -3.04 px
<button.ds-button> "บันทึกการเปลี่ยนแปลง", 48 px tall, in neutral light: ink 11.94 to 29.93 px, offset -3.07 px
Test Files  1 failed (1)
     Tests  1 failed | 14 passed (15)
```

Every other story in the file passes (14 of 15). The failure message lists only the labels that fail, and the play stops at the first mode that fails (light). The table below holds every label in both modes: the same story, read with `measureInkCentre` (the measure `expectInkCentred` judges) in a scratch story with the same meta (`layout: "centered"`) and the same markup, which printed all twelve readings and was deleted before the commit. Ink top and ink bottom are in CSS px below the top of the border box; the offset is ink centre minus control centre (clause 8), and a negative offset is above the centre. The pass bound is 1 px either way.

<!-- prettier-ignore -->
| Size | Label | Mode | Control height (px) | Ink top (px) | Ink bottom (px) | Offset (px) | Passes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sm | Thai | light | 32 | 3.99 | 20.98 | -3.51 | no |
| sm | English | light | 32 | 9.99 | 22.98 | 0.48 | yes |
| md | Thai | light | 40 | 7.96 | 25.96 | -3.04 | no |
| md | English | light | 40 | 13.96 | 27.95 | 0.96 | yes |
| lg | Thai | light | 48 | 11.94 | 29.93 | -3.07 | no |
| lg | English | light | 48 | 17.93 | 31.92 | 0.93 | yes |
| sm | Thai | dark | 32 | 3.99 | 20.98 | -3.51 | no |
| sm | English | dark | 32 | 9.99 | 22.98 | 0.48 | yes |
| md | Thai | dark | 40 | 7.96 | 24.96 | -3.54 | no |
| md | English | dark | 40 | 13.96 | 27.95 | 0.96 | yes |
| lg | Thai | dark | 48 | 11.94 | 28.93 | -3.57 | no |
| lg | English | dark | 48 | 17.93 | 31.92 | 0.93 | yes |

The heights read 32, 40 and 48 px, as `--cmp-button-height-sm`, `-md` and `-lg` set them. The readings are no longer whole numbers: with `layout: "centered"` the screenshot scope shrinks to its content, its CSS width is fractional, and the scale (screenshot width over CSS width) is a little over 1, so a row boundary falls between two pixel rows. That moves a reading by up to 0.5 px between light and dark (md Thai bottom 25.96 in light, 24.96 in dark; before the centred layout the two modes read the same). The sign and size of the failure do not change: Thai sits 3.0 to 3.6 px above the centre, English 0.5 to 1.0 px below it. English passes at md and lg by a margin of 0.04 to 0.07 px (0.96, 0.93).

Cause, in one sentence: a face's vertical metrics, because the baseline of a `.ds-button` label comes from IBM Plex Sans (hhea ascent 1025, descent -275 per 1000 units; `--op-font-family-plex-sans` is "IBM Plex Sans", Sarabun, system-ui) while the Thai glyphs of Sarabun sit on that baseline with nothing below it and with stacked vowel and tone marks about 1.2 em above it, so the ink band of the Thai label (17 to 18 px) ends at the baseline and its centre lies 3 px above the control centre.

The Thai ink band of the md label in light, split at the top of the tallest consonant that carries no mark. The split is read from the same cell with the label written without its above-marks (`บนทกการเปลยนแปลง`, the consonants and the leading vowels of the label with ั ึ ี ่ removed), in a scratch story deleted before the commit; the full label and the stripped one read in the same screenshot, so they share a scale:

<!-- prettier-ignore -->
| Part | Rows (px below the top of the border box) | Height (px) | Centre (px) | Offset from the control centre at 20 px (px) |
| --- | --- | --- | --- | --- |
| Whole Thai label | 7.85 to 25.81 | 17.96 | 16.83 | -3.17 |
| Consonant body (top of the tallest consonant without a mark to the baseline) | 12.84 to 25.81 | 12.97 | 19.33 | -0.68 |
| Marks above it | 7.85 to 12.84 | 4.99 | 10.35 | not applicable |

The consonant body alone sits 0.68 px above the centre at md in light and passes; the marks add 4.99 px of ink above it and pull the band centre up by 2.50 px. The same stripped label reads -1.07 (sm), -0.68 (md) and -0.81 (lg) in light, and -1.57 (sm) in dark, so at sm the body alone is already at or past the bound. A designer can judge from this whether the offset comes from the stacked marks.

What backs it:

- `.ds-button` is a plain `inline-flex` with `align-items: center` and a token line-height (`recipes.css` lines 15 to 38); no token or recipe rule offsets the label, and light and dark read within 0.5 px of each other (the scale effect above).
- The two faces share a content height (1300 units each: Plex 1025 and -275, Sarabun 1068 and -232), yet a metric override on the Sarabun face moves nothing: a scratch `@font-face` for Sarabun 500 with `ascent-override: 250%`, `descent-override: 0%` and `line-gap-override: 0%`, loaded and set as first family and as second, left the md Thai label at -3.00. This experiment was run on `eeb2e71` and was not run again on `18763ee`; ORV-192 changed `fonts.css` but not the face metrics or the stack order.
- At one size the Thai and the English offset differ by about 4 px (sm -3.51 and 0.48, 3.99 apart; md -3.04 and 0.96, 4.00; lg -3.07 and 0.93, 4.00). Moving the baseline moves both labels by the same amount, so it cannot bring both inside 1 px either way (a spread of at most 2 px); only a change that moves Thai ink alone could.
