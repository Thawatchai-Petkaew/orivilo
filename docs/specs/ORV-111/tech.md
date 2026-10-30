---
issue: ORV-111 (https://tpetkaew.atlassian.net/browse/ORV-111)
spec: docs/specs/ORV-111/spec.md (v1.0)
---

# ORV-111: tech notes

## Before

Row 1 of the spec. The base is `eeb2e71` (develop, no fix). The helper (`expectInkCentred`, `measureInkCentre` in `packages/design-system/src/testing/visual-asserts.ts`) and the story `LabelCentre` (`Button.stories.tsx`) are the ones the PR lands; nothing else differs from the base. Chromium, device scale factor 1, neutral profile, `Button variant="primary"`.

The play is red on the base:

```bash
pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/button/Button.stories.tsx
```

```text
FAIL  |storybook (chromium)| src/components/button/Button.stories.tsx > Label Centre
3 of 6 labels sit more than 1 px from the centre of their control (a negative offset is above it):
<button.ds-button> "บันทึกการเปลี่ยนแปลง", 32 px tall, in neutral light: ink 4.00 to 21.00 px, offset -3.50 px
<button.ds-button> "บันทึกการเปลี่ยนแปลง", 40 px tall, in neutral light: ink 8.00 to 26.00 px, offset -3.00 px
<button.ds-button> "บันทึกการเปลี่ยนแปลง", 48 px tall, in neutral light: ink 12.00 to 30.00 px, offset -3.00 px
Tests  1 failed | 14 passed (15)
```

The failure message lists only the labels that fail, and the play stops at the first mode that fails (light). The table below holds every label in both modes: the same story, read with `measureInkCentre` (the measure `expectInkCentred` judges) in a scratch story that printed all twelve readings and was deleted before the commit. Ink top and ink bottom are in CSS px below the top of the border box; the offset is ink centre minus control centre (clause 8), and a negative offset is above the centre. The pass bound is 1 px either way.

<!-- prettier-ignore -->
| Size | Label | Mode | Control height (px) | Ink top (px) | Ink bottom (px) | Offset (px) | Passes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sm | Thai | light | 32 | 4.00 | 21.00 | -3.50 | no |
| sm | English | light | 32 | 10.00 | 23.00 | 0.50 | yes |
| md | Thai | light | 40 | 8.00 | 26.00 | -3.00 | no |
| md | English | light | 40 | 14.00 | 28.00 | 1.00 | yes |
| lg | Thai | light | 48 | 12.00 | 30.00 | -3.00 | no |
| lg | English | light | 48 | 18.00 | 32.00 | 1.00 | yes |
| sm | Thai | dark | 32 | 4.00 | 21.00 | -3.50 | no |
| sm | English | dark | 32 | 10.00 | 23.00 | 0.50 | yes |
| md | Thai | dark | 40 | 8.00 | 26.00 | -3.00 | no |
| md | English | dark | 40 | 14.00 | 28.00 | 1.00 | yes |
| lg | Thai | dark | 48 | 12.00 | 30.00 | -3.00 | no |
| lg | English | dark | 48 | 18.00 | 32.00 | 1.00 | yes |

The heights read 32, 40 and 48 px, as `--cmp-button-height-sm`, `-md` and `-lg` set them. Light and dark read the same, so the offset does not come from a colour or a mode token. English sits at its pass bound at md and lg (1.00); at a device scale factor of 2 the md English label reads 1.25 and fails, so the bound is tight for English too. The local and CI runs use scale 1.

Cause, in one sentence: a face's vertical metrics, because the baseline of a `.ds-button` label comes from IBM Plex Sans (hhea ascent 1025, descent -275 per 1000 units) while the Thai glyphs of Sarabun sit on that baseline with nothing below it and with stacked vowel and tone marks about 1.2 em above it, so the ink band of the Thai label (17 to 18 px) ends at the baseline and its centre lies 3 px above the control centre.

What backs it:

- `.ds-button` is a plain `inline-flex` with `align-items: center` and a token line-height (`recipes.css` lines 15 to 38); no token or recipe rule offsets the label, and light and dark read the same.
- The two faces share a content height (1300 units each: Plex 1025 and -275, Sarabun 1068 and -232), yet a metric override on the Sarabun face moves nothing: a scratch `@font-face` for Sarabun 500 with `ascent-override: 250%`, `descent-override: 0%` and `line-gap-override: 0%`, loaded and set as first family and as second, left the md Thai label at -3.00.
- At one size the Thai and the English offset differ by 4.00 px (sm -3.50 and 0.50; md and lg -3.00 and 1.00). Moving the baseline moves both labels by the same amount, so it cannot bring both inside 1 px either way (a spread of at most 2 px); only a change that moves Thai ink alone could.
