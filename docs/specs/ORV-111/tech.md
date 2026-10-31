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

## After

Row 3 of the spec (v1.1). The head is `1a42626` (the helper with the body measure; `git diff --name-only 18763ee HEAD` lists no recipe, token, profile, font or component `.tsx` file, so every control renders as on the base). Chromium, device scale factor 1, neutral profile, light and dark, `fixtures.thai` ("บันทึกการเปลี่ยนแปลง") and `fixtures.latin` ("Save changes"). Each box was read with `measureInkCentre` (the measure `expectInkCentred` judges) in a scratch story file, `src/components/zz-scratch/Scratch.stories.tsx`, with one story per member that rendered the box in both modes. The file was run and then deleted before the commit. The command, run twice from `packages/design-system`:

```bash
pnpm exec vitest run --project storybook src/components/zz-scratch/Scratch.stories.tsx
```

The two runs gave the same 96 readings (24 pairs, 4 readings each). The stories failed on purpose: each play ended by throwing its rows, so that Vitest printed them. The members are the 11 entries of `single-line-control-1`, with `select` split into its trigger and its option (24 box and size pairs). Menu items and the select option were measured in their open menu (Dropdown Menu open and not modal; Context Menu opened with `openContextMenuAt`; Select opened with a click), the toast action in a `ToastRegion` inside a 360 px frame, and a tab and a toggle item in a group of two with the other item selected or pressed.

Each reading is an offset in CSS px, ink centre minus control centre (clause 8); a negative offset is above the centre. Body is the label with U+0E31, U+0E34 to U+0E3A and U+0E47 to U+0E4E removed; ink is the whole label. For English the body removes nothing, so its two readings are one and only one column is given per mode.

<!-- prettier-ignore -->
| Entry | Box measured | Size | Height (px) | Thai light body | Thai light ink | Thai dark body | Thai dark ink | English light | English dark | Body within 1.5 px (clause 9) | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| button | `.ds-button`, primary | sm | 32 | -1.00 | -3.50 | -1.00 | -3.50 | 0.50 | 0.50 | yes | none |
| button | `.ds-button`, primary | md | 40 | -0.50 | -3.00 | -0.50 | -3.00 | 1.00 | 1.00 | yes | none |
| button | `.ds-button`, primary | lg | 48 | -0.50 | -3.00 | -0.50 | -3.00 | 1.00 | 1.00 | yes | none |
| context-menu | `.ds-menu__item` | one size | 40 | -1.50 | -3.50 | -1.50 | -3.50 | 0.00 | 0.00 | yes | none |
| dropdown-menu | `.ds-menu__item` | one size | 40 | -1.50 | -3.50 | -1.50 | -3.50 | 0.00 | 0.00 | yes | none |
| input-group | `.ds-input-group`, its input (note 2) | sm | 32 | -1.50 | -3.50 | -1.50 | -3.50 | 0.00 | 0.00 | yes | none |
| input-group | `.ds-input-group`, its input (note 2) | md | 40 | -1.50 | -4.00 | -1.50 | -4.00 | 0.50 | 0.50 | yes | none |
| input-group | `.ds-input-group`, its input (note 2) | lg | 48 | -1.50 | -4.00 | -1.50 | -4.00 | 0.50 | 0.50 | yes | none |
| input | `.ds-control`, its value | sm | 32 | -1.50 | -3.50 | -1.50 | -3.50 | 0.00 | 0.00 | yes | none |
| input | `.ds-control`, its value | md | 40 | -1.50 | -4.00 | -1.50 | -4.00 | 0.50 | 0.50 | yes | none |
| input | `.ds-control`, its value | lg | 48 | -1.50 | -4.00 | -1.50 | -4.00 | 0.50 | 0.50 | yes | none |
| password-input | `.ds-input-group`, its input, reveal on (note 2) | sm | 32 | -1.50 | -3.50 | -1.50 | -3.50 | 0.00 | 0.00 | yes | none |
| password-input | `.ds-input-group`, its input, reveal on (note 2) | md | 40 | -1.50 | -4.00 | -1.50 | -4.00 | 0.50 | 0.50 | yes | none |
| password-input | `.ds-input-group`, its input, reveal on (note 2) | lg | 48 | -1.50 | -4.00 | -1.50 | -4.00 | 0.50 | 0.50 | yes | none |
| select | `.ds-control[data-trigger]`, the chosen value | sm | 32 | -1.50 | -3.50 | -1.50 | -3.50 | 0.00 | 0.00 | yes | none |
| select | `.ds-control[data-trigger]`, the chosen value | md | 40 | -1.50 | -4.00 | -1.50 | -4.00 | 0.50 | 0.50 | yes | none |
| select | `.ds-control[data-trigger]`, the chosen value | lg | 48 | -1.50 | -4.00 | -1.50 | -4.00 | 0.50 | 0.50 | yes | none |
| select, option | `.ds-menu__option` | one size | 40 | -1.50 | -3.50 | -1.50 | -3.50 | 0.00 | 0.00 | yes | none |
| tabs | `.ds-tabs__trigger`, not selected | sm | 32 | -0.50 | -3.00 | -0.50 | -3.00 | 1.00 | 1.00 | yes | none |
| tabs | `.ds-tabs__trigger`, not selected | md | 40 | -0.50 | -3.00 | -0.50 | -3.00 | 1.00 | 1.00 | yes | none |
| tag | `.ds-tag`, not selected | md | 32 | -1.50 | -3.50 | -1.50 | -3.50 | 0.00 | 0.00 | yes | none |
| toast | `.ds-toast__action` | one size | 32 | -1.50 | -4.00 | -1.50 | -4.00 | 0.00 | 0.00 | yes | none |
| toggle-group | `.ds-toggle__item`, not pressed | sm | 24 | -1.50 | -4.00 | -1.00 | -3.50 | 0.50 | 0.50 | yes | none |
| toggle-group | `.ds-toggle__item`, not pressed | md | 32 | -1.50 | -4.00 | -1.00 | -3.50 | 0.50 | 0.50 | yes | none |

All 24 pairs pass clause 9 in all four combinations. The largest body offset is 1.50 (Thai), and no pair needs a follow-up issue. Notes:

1. At the bound. 19 of the 24 pairs read -1.50 for the Thai body in light (every pair except the three Button sizes and the two Tabs sizes), and 17 in dark. Clause 9 passes an offset of 1.50 (the bound is inclusive), so these pass with no margin. The readings fall on whole or half rows at device scale factor 1, so one half row more would fail them.
2. Input Group and Password Input. The helper reads the label from the text nodes of the box, and the value of an `<input>` is not a text node, so the group `div` has no text to read. The scratch measured the `<input>` inside the group (`.ds-input-group__input`, which stretches to the group's padding box). Its centre is the group's centre (0.00 px apart on all 12 pairs and modes) and the height column is the group's, so the reading is the one of the group box.
3. A corner reads as ink. The columns of the label are the content box of an `<input>` or the Range over its text. In the first scratch run they fell inside the corner curve of Input, Input Group, Password Input, Select, Tag and the toast action at md and lg (their padding is as wide as the radius): the pixels outside the curve read as ink, the band took the whole padding box and every offset read 0.00 for Thai and English alike, which a play would pass vacuously. The readings above come from a run with `padding-inline: 24px !important` on `.ds-control`, `.ds-input-group`, `.ds-tag` and `.ds-toast__action`, which keeps the label out of the corners and does not change the vertical position of a line. Button, Tabs, Toggle Group, the menus and the select option read correctly without it. A committed play on one of those six would need the helper to clip the region to the rows between the curves; that is not part of this issue.
4. No source changed: the scratch story file is deleted, and `git status` lists only `DESIGN.md` and this file.
