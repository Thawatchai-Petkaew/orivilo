---
issue: ORV-111 (https://tpetkaew.atlassian.net/browse/ORV-111)
spec: docs/specs/ORV-111/spec.md (v1.1)
---

# ORV-111: tech notes

## Before

Row 1 of the spec (v1.1). The base is `18763ee` (develop with ORV-192 merged: Sarabun in every profile, the new focus and type tokens, and `layout: "centered"` on the Button stories). The branch holds that base plus the helper (`expectInkCentred`, `measureInkCentre` in `packages/design-system/src/testing/visual-asserts.ts`) and the story `LabelCentre` (`Button.stories.tsx`); `git diff --name-only 18763ee HEAD` lists no recipe, token, profile or font file, so the head renders every control as the base does and the play on the head is the play on the base with the head's story and helper. Chromium, device scale factor 1, neutral profile, `Button variant="primary"`. The v1.0 readings (whole ink, screenshot-width scale, play red) are replaced by this section.

The play is green on the base under the body measure (`ink-centre-1` clause 9, bound 1.5 px):

```bash
pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/button/Button.stories.tsx
```

```text
Test Files  1 passed (1)
     Tests  15 passed (15)
```

The table holds every label in both modes, read with `measureInkCentre` (the measure `expectInkCentred` judges) in a scratch story with the same meta (`layout: "centered"`) and the same markup, deleted before the commit. Per box it gives the body reading and the whole-ink reading. The body is the label with U+0E31, U+0E34 to U+0E3A and U+0E47 to U+0E4E removed (`บนทกการเปลยนแปลง` for the Thai label; the Latin label as it is, so its two readings are one). Body top and body bottom are in CSS px below the top of the border box; an offset is ink centre minus control centre (clause 8), and a negative offset is above the centre. The scale is `devicePixelRatio` (clause 2), so every reading falls on a whole or half row.

<!-- prettier-ignore -->
| Size | Label | Mode | Control height (px) | Body top (px) | Body bottom (px) | Body offset (px) | Whole-ink offset (px) | Body within 1.5 px |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sm | Thai | light | 32 | 9 | 21 | -1.00 | -3.50 | yes |
| sm | English | light | 32 | 10 | 23 | 0.50 | 0.50 | yes |
| md | Thai | light | 40 | 13 | 26 | -0.50 | -3.00 | yes |
| md | English | light | 40 | 14 | 28 | 1.00 | 1.00 | yes |
| lg | Thai | light | 48 | 17 | 30 | -0.50 | -3.00 | yes |
| lg | English | light | 48 | 18 | 32 | 1.00 | 1.00 | yes |
| sm | Thai | dark | 32 | 9 | 21 | -1.00 | -3.50 | yes |
| sm | English | dark | 32 | 10 | 23 | 0.50 | 0.50 | yes |
| md | Thai | dark | 40 | 13 | 25 | -1.00 | -3.50 | yes |
| md | English | dark | 40 | 14 | 28 | 1.00 | 1.00 | yes |
| lg | Thai | dark | 48 | 17 | 29 | -1.00 | -3.50 | yes |
| lg | English | dark | 48 | 18 | 32 | 1.00 | 1.00 | yes |

The heights read 32, 40 and 48 px, as `--cmp-button-height-sm`, `-md` and `-lg` set them. The body of every label sits within 1 px of the centre (largest: Thai -1.00, English 1.00), inside the 1.5 px bound by 0.5 px. The whole ink of a Thai label sits 3.0 to 3.5 px above the centre, and the marks account for the difference; English is unchanged by the body measure. These readings match the candidate A row of design.md ("Candidates rendered"), taken there with the scale fixed at 1.

Cause, in one sentence: a face's vertical metrics, because the baseline of a `.ds-button` label comes from IBM Plex Sans (hhea ascent 1025, descent -275 per 1000 units; `--op-font-family-plex-sans` is "IBM Plex Sans", Sarabun, system-ui) while the Thai glyphs of Sarabun sit on that baseline with nothing below it and with stacked vowel and tone marks about 1.2 em above it, so the ink band of the Thai label (17 to 18 px) ends at the baseline and its centre lies 3 px above the control centre.

A v1.0 reading, kept for the cause: the Thai ink band of the md label in light, split at the top of the tallest consonant that carries no mark. The split is read from the same cell with the label written without its above-marks (`บนทกการเปลยนแปลง`, the consonants and the leading vowels of the label with ั ึ ี ่ removed), in a scratch story deleted before the commit; the full label and the stripped one read in the same screenshot, so they share a scale:

<!-- prettier-ignore -->
| Part | Rows (px below the top of the border box) | Height (px) | Centre (px) | Offset from the control centre at 20 px (px) |
| --- | --- | --- | --- | --- |
| Whole Thai label | 7.85 to 25.81 | 17.96 | 16.83 | -3.17 |
| Consonant body (top of the tallest consonant without a mark to the baseline) | 12.84 to 25.81 | 12.97 | 19.33 | -0.68 |
| Marks above it | 7.85 to 12.84 | 4.99 | 10.35 | not applicable |

The consonant body alone sits 0.68 px above the centre at md in light; the marks add 4.99 px of ink above it and pull the band centre up by 2.50 px. The same stripped label reads -1.07 (sm), -0.68 (md) and -0.81 (lg) in light, and -1.57 (sm) in dark, so at sm the consonants alone were already at or past a 1 px bound; the 1.5 px bound of v1.1 takes that in. The body measure of v1.1 cuts differently (it takes out the marks and keeps every consonant) and its readings are the Before table above. A designer can judge from this whether the offset comes from the stacked marks.

What backs it:

- `.ds-button` is a plain `inline-flex` with `align-items: center` and a token line-height (`recipes.css` lines 15 to 38); no token or recipe rule offsets the label, and light and dark read within 0.5 px of each other (the scale effect above).
- The two faces share a content height (1300 units each: Plex 1025 and -275, Sarabun 1068 and -232), yet a metric override on the Sarabun face moves nothing: a scratch `@font-face` for Sarabun 500 with `ascent-override: 250%`, `descent-override: 0%` and `line-gap-override: 0%`, loaded and set as first family and as second, left the md Thai label at -3.00. This experiment was run on `eeb2e71` and was not run again on `18763ee`; ORV-192 changed `fonts.css` but not the face metrics or the stack order.
- At one size the whole-ink offset of the Thai label and the offset of the English one differ by about 4 px (v1.0 readings: sm -3.51 and 0.48, 3.99 apart; md -3.04 and 0.96, 4.00; lg -3.07 and 0.93, 4.00). Moving the baseline moves both labels by the same amount, so it cannot bring both whole inks inside the 1 px target (a spread of at most 2 px); only a change that moves Thai ink alone could. Under target C the body is judged, and both labels pass on the base (clause 9).
