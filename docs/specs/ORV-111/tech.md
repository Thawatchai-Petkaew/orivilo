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

Row 3 of the spec (v1.1). The head is this branch after merging `origin/develop` at `891fa02`; `git diff --name-only 18763ee origin/develop` lists no recipe, token, profile, font or member component `.tsx` file, so every control renders as on the base. Chromium, device scale factor 1, neutral profile, Thai locale, light and dark, `fixtures.thai` ("บันทึกการเปลี่ยนแปลง") and `fixtures.latin` ("Save changes").

Each reading is taken in the member's own story, because a reading depends on the box's y position: the label sits on a row of pixels, and a box at a fractional y puts the ink on a different row than the same box at a whole y. The first version of this table was read in a scratch layout that put every box at a whole y, and it read the Input family up to 0.83 px differently from the real stories (md and lg Thai body -1.50 there against -1.28 and -0.67 here, sm -1.50 against -1.89); qa-1 found this (F1, F2). The stories read are `Base/Button Label Centre` (the story the play judges), `Base/Input Sizes`, `Base/Input group Sizes`, `Base/Password input Sizes`, `Base/Select Sizes`, `Base/Select With value` (the option, opened), `Base/Context Menu Closed`, `Base/Dropdown Menu Closed` (both opened), `Base/Tabs Small` and `Default`, `Base/Tag Sizes`, `Base/Toggle Group Sizes`. A check script outside the repo (Playwright, device scale factor 1) sets the label of the box, takes a screenshot of the box and reads the first and last row that differs from the box's ground colour inside the label's columns. The columns are clipped away from the corner curves, so the readings are not the PR helper's (`measureInkCentre`) but the same quantity: ink centre minus control centre in CSS px (clause 8). The command to rerun it, from a Storybook dev server on a free port, is the script with `ONLY=<story id>` to pick stories and `SHIFT=<px>` to move the root down. It is not committed.

Each reading is an offset in CSS px, ink centre minus control centre (clause 8); a negative offset is above the centre. Body is the label with U+0E31, U+0E34 to U+0E3A and U+0E47 to U+0E4E removed; ink is the whole label. For English the body removes nothing, so its two readings are one and only one column is given per mode.

<!-- prettier-ignore -->
| Entry | Box measured | Size | Height (px) | Thai light body | Thai light ink | Thai dark body | Thai dark ink | English light | English dark | Body within 1.5 px (clause 9) | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| button | `.ds-button`, primary | sm | 32 | -1.00 | -3.50 | -1.00 | -3.50 | 0.50 | 0.50 | yes | none |
| button | `.ds-button`, primary | md | 40 | -0.50 | -3.00 | -1.00 | -3.50 | 1.00 | 1.00 | yes | none |
| button | `.ds-button`, primary | lg | 48 | -0.50 | -3.00 | -1.00 | -3.50 | 1.00 | 1.00 | yes | none |
| context-menu | `.ds-menu__item` | one size | 40 | -1.50 | -3.50 | -1.50 | -3.50 | 0.00 | 0.00 | yes | none |
| dropdown-menu | `.ds-menu__item` | one size | 40 | -1.00 | -3.00 | -1.00 | -3.00 | 0.50 | 0.50 | yes | none |
| input-group | `.ds-input-group`, its input (note 2) | sm | 32 | -1.89 | -3.89 | -1.89 | -3.89 | -0.39 | -0.39 | no | ORV-199 |
| input-group | `.ds-input-group`, its input (note 2) | md | 40 | -1.28 | -3.78 | -1.28 | -3.78 | 0.72 | 0.72 | yes | none |
| input-group | `.ds-input-group`, its input (note 2) | lg | 48 | -0.67 | -3.17 | -0.67 | -3.17 | 1.33 | 1.33 | yes | none |
| input | `.ds-control`, its value | sm | 32 | -1.89 | -3.89 | -1.89 | -3.89 | -0.39 | -0.39 | no | ORV-199 |
| input | `.ds-control`, its value | md | 40 | -1.28 | -3.78 | -1.28 | -3.78 | 0.72 | 0.72 | yes | none |
| input | `.ds-control`, its value | lg | 48 | -0.67 | -3.17 | -0.67 | -3.17 | 1.33 | 1.33 | yes | none |
| password-input | `.ds-input-group`, its input, reveal on (note 2) | sm | 32 | -1.89 | -3.89 | -1.89 | -3.89 | -0.39 | -0.39 | no | ORV-199 |
| password-input | `.ds-input-group`, its input, reveal on (note 2) | md | 40 | -1.28 | -3.78 | -1.28 | -3.78 | 0.72 | 0.72 | yes | none |
| password-input | `.ds-input-group`, its input, reveal on (note 2) | lg | 48 | -0.67 | -3.17 | -0.67 | -3.17 | 1.33 | 1.33 | yes | none |
| select | `.ds-control[data-trigger]`, the chosen value | sm | 32 | -1.89 | -3.89 | -1.89 | -3.89 | -0.39 | -0.39 | no | ORV-199 |
| select | `.ds-control[data-trigger]`, the chosen value | md | 40 | -1.28 | -3.78 | -1.28 | -3.78 | 0.72 | 0.72 | yes | none |
| select | `.ds-control[data-trigger]`, the chosen value | lg | 48 | -0.67 | -3.17 | -0.67 | -3.17 | 1.33 | 1.33 | yes | none |
| select, option | `.ds-menu__option` | one size | 40 | -1.50 | -3.50 | -1.50 | -3.50 | 0.00 | 0.00 | yes | none |
| tabs | `.ds-tabs__trigger`, not selected | sm | 32 | -0.50 | -3.00 | -0.50 | -3.00 | 1.00 | 1.00 | yes | none |
| tabs | `.ds-tabs__trigger`, not selected | md | 40 | -0.50 | -3.00 | -0.50 | -3.00 | 1.00 | 1.00 | yes | none |
| tag | `.ds-tag`, not selected | md | 32 | -1.50 | -3.50 | -1.50 | -3.50 | 0.00 | 0.00 | yes | none |
| toast | `.ds-toast__action` (scratch layout, note 5) | one size | 32 | -1.50 | -4.00 | -1.50 | -4.00 | 0.00 | 0.00 | yes | none |
| toggle-group | `.ds-toggle__item`, not pressed | sm | 24 | -1.00 | -3.50 | -1.00 | -3.50 | 0.50 | 0.50 | yes | none |
| toggle-group | `.ds-toggle__item`, not pressed | md | 32 | -1.50 | -4.00 | -1.00 | -3.50 | 0.50 | 0.50 | yes | none |

Four of the 24 pairs fail clause 9 in their own story: Input, Input group, Password input and Select at sm. Each reads a Thai body of -1.89 px (whole ink -3.89) in light and dark, 0.39 px outside the 1.5 px bound; English reads -0.39. Their box sits at a top of 46.390625 px under the Field label (22.4 px line height), and the same boxes read -1.50 for the body when the root is moved down 0.61 px (top 47.00). The cause is that the body of a sm single-line field already sits 1.5 px above the centre with no margin, so a fractional y tips it over. The other 20 pairs pass in their own story; the largest is the Thai body at -1.50 (Context Menu, Select option, Tag, and Toggle Group md in light) and the next is Input, Input group, Password input and Select at md at -1.28. The follow-up for the four sm field controls is ORV-199 (https://tpetkaew.atlassian.net/browse/ORV-199); this issue changes no source (fix-once-1). Notes:

1. At the bound. The pairs that read -1.50 pass with no margin, because clause 9 includes the bound. Readings in own stories fall on steps of 0.61 px for the field controls (the fractional y) and on half rows elsewhere, so one half row more would fail the pairs that read -1.50.
2. Input Group and Password Input. The helper reads the label from the text nodes of the box, and the value of an `<input>` is not a text node, so the group `div` has no text to read. The check script set and read the `<input>` inside the group (`.ds-input-group__input`, which stretches to the group's padding box). Its centre is the group's centre and the height column is the group's, so the reading is the one of the group box. The Input group rows read the same as the Input rows because both boxes sit at the same y in their stories.
3. Positions. The sm box of the four field stories is at top 46.390625 px, the md box at 124.78125 px and the lg box at 211.171875 px (getBoundingClientRect, light). Button in `Base/Button Label Centre` sits on whole rows (centred layout), so its readings equal the Before table: md and lg read -0.50 in light and -1.00 in dark. The first version of this table read -0.50 for those dark cells, from the scratch layout.
4. A corner reads as ink. In the first version's scratch run the label's columns fell inside the corner curve of Input, Input Group, Password Input, Select, Tag and the toast action at md and lg (their padding is as wide as the radius): the pixels outside the curve read as ink and the band took the whole padding box, so every offset read 0.00 for Thai and English alike, which a play would pass vacuously. The check script clips the columns to the label's range inside the radius, which keeps the label out of the corners. A committed play on one of those members would need the helper to clip the region to the rows between the curves; that is not part of this issue.
5. Toast. The toast action read 0.00 for every label in the check script's own-story read, which is not a measurement (the cause was not investigated; note 4 is the likely one). The toast row keeps the scratch-layout reading of the first version (padding of 24 px forced on the action, a `ToastRegion` in a 360 px frame); it was not re-read in the story, so its y dependence is open and it is the one row of the table not read in its own story.
6. No source changed: `git status` lists only `DESIGN.md` and this file.
