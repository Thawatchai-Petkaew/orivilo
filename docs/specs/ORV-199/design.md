---
issue: ORV-199 (https://tpetkaew.atlassian.net/browse/ORV-199)
base: develop 4de809b
task: ORV-199-design-1
---

# ORV-199: design

The sm Input, Input group, Password input and Select trigger read a Thai body above the `ink-centre-1` bound (ORV-111 spec, 1.5 CSS px) at some box positions. This file names the cause, surveys the class, and gives one fix with its rows, in the form the builder builds from (L-0017). I rendered the fix by injecting its CSS into each story (`page.addStyleTag`).

Setup: Storybook at `4de809b` on port 6199, Chromium through Playwright 1.56.1, device scale 1, reduced motion, neutral profile, Thai locale unless named. Scripts and raw output: `/tmp/orv-199-design-1/scripts/` (`ink.cjs`, `agg.cjs`, `shoot.cjs`, `band.cjs`, `sheet.cjs`). `ink.cjs` is the ORV-111 `tech.md` After loop, ported as written: label columns clipped clear of the corner curves (`textLeft = max(left, box.left + radius)`), rows of the padding box, ground = the most frequent colour, ink = channel distance sum above 48, body = the label with U+0E31, U+0E34 to U+0E3A and U+0E47 to U+0E4E removed. Labels: "บันทึกการเปลี่ยนแปลง" and "Save changes".

## Measured on 4de809b, in the members' own stories

After ORV-194 row 6, the Field label above each box is 23.8 px tall, so the boxes moved down 1.41 px: sm top 47.796875 (was 46.390625), md 127.59375, lg 215.390625. Readings at that y, light and dark identical (`/tmp/orv-199-design-1/head.json`):

| Box (story)                                                 | Size | Line box | Thai body | Thai whole ink       | English |
| ----------------------------------------------------------- | ---- | -------- | --------- | -------------------- | ------- |
| `.ds-control` (`base-input--sizes`)                         | sm   | 23.8     | -1.30     | -3.30                | 0.20    |
| `.ds-input-group` (`base-input-group--sizes`)               | sm   | 23.8     | -1.30     | -3.30                | 0.20    |
| `.ds-input-group` (`base-password-input--sizes`, reveal on) | sm   | 23.8     | -1.30     | -3.30                | 0.20    |
| `.ds-control[data-trigger]` (`base-select--sizes`)          | sm   | 23.8     | -1.30     | -3.80                | 0.20    |
| the same four                                               | md   | 27.2     | -1.09     | -3.59 (Select -4.09) | 0.91    |
| the same four                                               | lg   | 27.2     | -0.89     | -3.39 (Select -3.89) | 1.11    |

At this y the sm boxes pass, 0.20 px inside the bound. That is luck of the layout, not a fix: the reading follows the fraction of the box's y.

### The reading over every y

Text snaps to a whole device pixel while the box may sit at any fraction, so one box reads a range one pixel wide as its y moves. I moved each story's root down by 0 to 15/16 px in sixteenths (`#storybook-root { padding-top }`) and read every member, size and mode (`/tmp/orv-199-design-1/head-sweep16-input-select-light.txt` for Input and Select in light; `head-sweep16.txt` for all four members in both modes; the one-step-per-eighth run `head-sweep.json` shows the four members equal at every step, and `fix-sweep.txt` shows them equal under the fix in both modes):

| Size | Thai body over y | English over y | Worst                                                  |
| ---- | ---------------- | -------------- | ------------------------------------------------------ |
| sm   | -1.86 to -0.92   | -0.36 to 0.58  | **1.86** (the -1.89 of ORV-199 is this range at 46.39) |
| md   | -1.53 to -0.59   | 0.47 to 1.41   | 1.53                                                   |
| lg   | -1.58 to -0.64   | 0.42 to 1.36   | 1.58                                                   |

## Cause

The sm field sets its value in `input.type.sm` = `type.body.sm`, 14 / 1.7, a 23.8 px line box centred in the 30 px content box (`align-items: center`). IBM Plex Sans at 14 px has an 18 px content area. Chromium splits the leading, (23.8 - 18) / 2 = 2.9 px, and floors the top half to 2 px, so the glyphs sit 0.9 px above the centre of the line box. This is the step ORV-194 row 6b found for `type.label.md` at 1.7 (the same 14 px, the same 23.8 px line box). At 1.6 (22.4 px) the split is 2.2 and the floor costs 0.2 px.

It became visible at sm only, because sm is the only field size set at 14 px. md and lg are 16 / 1.7 (27.2 px; by the font metrics, not measured, a 21 px content area, a 3.1 px split and 0.1 px lost).

Why the bound needs the range centred: the Thai body sits 1.5 px above the English label at 14 px (the consonant body and the Latin x-height plus capitals differ). Over all y, Thai covers `[c - 1, c]` and English `[c + 0.5, c + 1.5]`, so both fit inside ±1.5 only when `c` is in `[-0.5, 0]`, and the best `c` is -0.25 (worst 1.25). Today `c` is -0.86. A 1.6 line box moves the glyphs 0.7 px down and puts `c` at -0.23, at the best place.

## Survey: every sm field control in the class

`input.type.sm` (`component.json` line 266) is the only type the sm fields read (`recipes.css` lines 238 to 245 for `.ds-control[data-size="sm"]`, lines 361 to 368 for `.ds-input-group[data-size="sm"]`). Its consumers:

| Consumer                                                                                                                                         | Lines                                        | Wraps?                                            | Reached by the fix                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| Input sm (`<input class="ds-control" data-size="sm">`)                                                                                           | one, by the element                          | no                                                | yes                                                        |
| Select trigger sm (`.ds-control[data-trigger]`, span nowrap with the row 7 clip box)                                                             | one                                          | no (`white-space: nowrap`, line 337)              | yes                                                        |
| Input group sm (`.ds-input-group[data-size="sm"]`), its input and its slots ("THB")                                                              | one                                          | no (input; slots `white-space: nowrap`, line 427) | yes                                                        |
| Password input sm (an Input group)                                                                                                               | one                                          | no                                                | yes                                                        |
| Direction studio sample field (`<span class="ds-control" data-size="sm">`, `DirectionStudio.tsx` line 179, copy "ชื่อโปรเจกต์" / "Project name") | one at 360 and 1440 (box 32 px tall in both) | could in theory, the copy is two words            | yes; same look as the Input sm                             |
| Textarea sm (`.ds-control[data-multiline][data-size="sm"]`)                                                                                      | many                                         | **yes**                                           | **no**: it must keep 14 / 1.7 (ORV-192 row 18), see row F3 |

Nothing in `apps/web` renders a sm field (`grep -rnE '<(Input|InputGroup|PasswordInput|Select|Textarea)[^>]*size="sm"' apps packages` finds stories only).

## Candidates

- **A. A single-line field type at 14 / 1.6 (chosen).** `input.type.sm` reads a new semantic `type.field.sm` (the body.sm family, size, weight and spacing at line height 1.6); Textarea sm keeps `type.body.sm`. Same reasoning as ORV-194 row 6b: in a single-line box the line height only places the line, so it can take the value that centres the body. 1.6 is the value `type.control.md` already uses, so a 14 px single-line control reads one line height whether it holds a label or a value.
- B. 1.5 (21 px): worst 1.48 (Thai -1.48 to -0.55). Inside the bound with no margin. Rejected.
- C. 1.3 (18.2 px): worst 1.39 (Thai -1.05 to -0.11, English 0.45 to 1.39). Rejected: less margin than A, and an 18 px line box is the content area with nothing around it.
- D. Change `type.body.sm` to 1.6: moves every running-text consumer and undoes ORV-192 row 18. Rejected.
- E. A nudge (padding or translate) per control: `fix-once-1` of ORV-111 refuses it. Rejected.
- F. Widen the bound: relaxes a guard. Rejected.

Line-height sweep, sm, light, 16 y steps (`/tmp/orv-199-design-1/lh-1-5.json`, `lh-1-6.json`, `lh-1-3.json`):

| sm line height    | Thai body over y | English over y | Worst    |
| ----------------- | ---------------- | -------------- | -------- |
| 1.7 (today, 23.8) | -1.86 to -0.92   | -0.36 to 0.58  | 1.86     |
| 1.5 (21)          | -1.48 to -0.55   | 0.02 to 0.95   | 1.48     |
| **1.6 (22.4)**    | -1.17 to -0.23   | 0.33 to 1.27   | **1.27** |
| 1.3 (18.2)        | -1.05 to -0.11   | 0.45 to 1.39   | 1.39     |

## Rows

<!-- prettier-ignore -->
| # | Target | Tokens | The play that proves it |
| --- | --- | --- | --- |
| F1 | The body offset of the sm Input, Input group, Password input and Select trigger is inside 1.5 px at every y of the box, with margin: Thai body -1.17 to -0.23, English 0.33 to 1.27, worst 1.27 (0.23 margin), light and dark. In the own stories (top 47.80): Thai body -0.30, whole ink -2.30 (Select -2.80), English 1.20 | New semantic `type.field.sm` (`font.family.plex-sans`, `font.size.14`, `font.line-height.1-6`, `font.weight.400`, `font.letter-spacing.normal`); `input.type.sm` re-points to it | `profiles.test.ts`: the token test of F4. Storybook: a new `Base/Select` story `LabelCentre` (F5), judged by `expectInkCentred(..., { measure: "body" })` |
| F2 | No height moves: every sm box stays 32 px; md 40 and lg 48 do not change (they read `input.type.md` and `-lg`) | `size.control.sm` unchanged | Heights read before and after in all 6 stories at 360 and 1440, th and en, light and dark: 0 differences (`/tmp/orv-199-design-1/shots-facts.json`) |
| F3 | Textarea sm keeps 14 / 1.7 (23.8 px per line), so its wrapped Thai lines keep the ORV-192 row 18 clearance | `type.body.sm`, read directly by the recipe | Computed `line-height` of `.ds-control[data-multiline][data-size="sm"]` in `base-textarea--sizes` is 23.8px after the fix (measured) |
| F4 | No Thai mark is cut: the sm value's ink band keeps its height (ฟื้ปี๊ปุ่มสั่งซื้อฟูปู่ at device scale 4: 20.75 px in Input and Input group, 22.5 in Select, before and after; the band moves down 1 px and its bottom stays 4.25 px above the bottom border) | none | `/tmp/orv-199-design-1/stack-band.txt`; the Select trigger keeps the ORV-194 row 7 clip box |

### F1 to F3: builder table (head `4de809b`)

| #   | File, line                                                                                                                      | Before                                                                                                      | After                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F.1 | `packages/design-system/src/tokens/source/semantic.json`, after line 1067 (the `}` that closes `type.control`, before `"code"`) | none                                                                                                        | `"field": { "sm": { "$type": "typography", "$value": { "fontFamily": "{font.family.plex-sans}", "fontSize": "{font.size.14}", "lineHeight": "{font.line-height.1-6}", "fontWeight": "{font.weight.400}", "letterSpacing": "{font.letter-spacing.normal}" }, "$description": "The value of a single-line field at sm (Input, Input group, Password input, Select trigger). Its line height only places the line box: 1.6 keeps the Thai body and the Latin label inside the ORV-111 ink-centre-1 bound at every box position (ORV-199). A field that wraps (Textarea) takes type.body.sm." } },`                                                                                                                                                                                     |
| F.2 | `packages/design-system/src/tokens/source/component.json` line 268 (`input.type.sm`)                                            | `"{type.body.sm}"`                                                                                          | `"{type.field.sm}"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| F.3 | `src/tokens/generated.css` (generated)                                                                                          | `--cmp-input-type-sm-*` read `--ds-type-body-sm-*` (lines 911 to 915, and the same group in the dark block) | Run `pnpm --filter @orivilo/design-system tokens` and commit the output: the five `--cmp-input-type-sm-*` read `--ds-type-field-sm-*`, a `--ds-type-field-sm-*` block appears in each mode block, and `@theme` gains `--text-field-sm`. No hand edits                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| F.4 | `packages/design-system/src/recipes/recipes.css`, after the `.ds-control[data-multiline]` block (ends line 304)                 | none                                                                                                        | `/* Textarea sm wraps: it keeps body.sm 14 / 1.7 for Thai line clearance (ORV-192 row 18); single-line sm fields read type.field.sm at 1.6 (ORV-199). */` then `.ds-control[data-multiline][data-size="sm"] { line-height: var(--ds-type-body-sm-line-height); }`. The selector has two attributes more than `.ds-control[data-size="sm"]` (line 238), so it wins at any order                                                                                                                                                                                                                                                                                                                                                                                                      |
| F.5 | `src/profiles/profiles.test.ts`: the weight list (line 190, the 400 list) and a new test after the row 6b test (line 268)       | `type.field.sm` not listed                                                                                  | Add `"type.field.sm"` to the 400 list. Add `under ${id}, a single-line sm field value is body.sm at 1.6 (ORV-199)`: `type.field.sm` has the `fontFamily`, `fontSize`, `fontWeight` and `letterSpacing` of `type.body.sm` under every set, and `lineHeight` 1.6. The row 6 and row 18 tests stay as they are                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| F.6 | `Select.stories.tsx`: a new story `LabelCentre` after `Sizes` (line 153)                                                        | none                                                                                                        | Two cells (`data-testid="label-centre-light"` and `-dark`, as `Button` `LabelCentre`), each a `DesignProfileBoundary` with two sm Selects, `options={[{ value: "th", label: fixtures.thai }, { value: "en", label: fixtures.latin }]}`, `defaultValue` `"th"` and `"en"`, `aria-label` from the fixtures. Play, behind `inVitest`: `await expectInkCentred(cell, triggers, { measure: "body" })` per cell. **Depends on ORV-198 item 1**: the sm trigger's padding (12) is narrower than its radius (16), so until the helper clips the corner curves the play passes vacuously (ORV-111 tech.md note 4). Build F.6 after ORV-198 merges; the Input group and Password input boxes hold an `<input>` the helper cannot read (note 2), so the Select carries the guard for the class |
| F.7 | `DESIGN.md` §4: the type table "Body/UI" row (line 135), the rules after line 144, change log v1.58                             | not stated                                                                                                  | Table: append "; 14/1.6 for a single-line sm field value (`type.field.sm`)". Rule after line 144: "A single-line field at sm (Input, Input group, Password input, Select trigger) sets its value in `type.field.sm` (14 / 1.6). At 1.7 the floored half-leading puts the Thai body 1.86 px above the centre at some box positions (ORV-199). Textarea sm wraps and keeps `type.body.sm` (14 / 1.7)." Change log with the impact list below                                                                                                                                                                                                                                                                                                                                          |
| F.8 | `docs/specs/ORV-111/tech.md` line 149 and the four sm rows                                                                      | the four sm rows read "no, ORV-199"                                                                         | Add one line under the table: "ORV-199: the four sm rows read -0.30 Thai body, -2.30 whole ink (Select -2.80) and 1.20 English in their own stories after the fix, and -1.17 to 1.27 over every y." Do not rewrite the measured rows                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Impact list (contract change, lane L, a new semantic token): every sm Input, Input group, Password input, Select trigger and the Direction studio sample field render their value line box at 22.4 px instead of 23.8 px, and the value (and an Input group's slot text and icon row) drops 0.7 px, one device pixel at most. Heights stay 32 px (`size.control.sm`). Textarea sm, md and lg and every md and lg field do not change. No other consumer reads `input.type.sm` (`recipes.css` lines 240 to 244 and 363 to 367 only). No contrast pair changes. No component API changes.

## Seen, not in these rows: md and lg at fractional y

The md and lg fields pass in their own stories (-1.09 and -0.89 Thai body, 0.91 and 1.11 English) but read up to 1.53 (md) and 1.58 (lg) at other y fractions, on the Thai side. At 16 px the Thai body sits 2.0 px above the English label, so over all y the two cover `[c - 1, c]` and `[c + 1, c + 2]`: both fit ±1.5 only at `c = -0.5` exactly, with no margin. No line height reaches margin there; only the bound's treatment of the half device pixel (ORV-111 design R2-1 already adds it) or a 16 px body offset target can. This is a spec question for `ink-centre-1`, not a fix of this issue; I name it for the main session (needs_decision).

## Rendered

Contact sheet `/tmp/orv-199-design-1/contact-sheet.png`: for each of the four members and Textarea, at 360 and 1440, the sm box (scale 3, nearest neighbour), in the order Thai light before, after, Thai dark before, after, English light before, after, English dark before, after (after framed green). A magenta tick left of the box marks the box centre, outside the box. The last row is the stack check at device scale 4.

What the eye reads:

- Before, the Thai consonants of บันทึกการเปลี่ยนแปลง sit with their body above the tick and "Save changes" sits on it. After, both drop one pixel: the Thai body straddles the tick and the English label sits just under it, as the Button md labels do (ORV-111 After).
- The pill, the border, the search icon, "THB" and the chevron keep their place in the box; nothing grows. The stack row shows ฟื้, ปี๊, ซื้อ whole above and ปุ่ม, ฟู, ปู่ whole below, before and after, in light and dark.
- Textarea sm is the same before and after in all eight cells.

Full-story shots, 108 PNGs, `/tmp/orv-199-design-1/shots/<story>-w<360|1440>-<th|en>-<light|dark>-<before|after>.png` for `input-sizes`, `input-group-sizes`, `password-input-sizes`, `select-sizes`, `textarea-sizes`, `direction-studio-default`, and `stack-<input|input-group|select>-sm-dsf4-<light|dark>-<before|after>.png`.

## Screens to check in visual QA (G3)

- `base-input--sizes`, `base-input-group--sizes`, `base-password-input--sizes`, `base-select--sizes` and `base-select--label-centre`: at 360 and the widest canvas, Thai and English, light and dark. The sm value sits one pixel lower than on `4de809b`, its Thai body on the centre, and the box is 32 px.
- `base-textarea--sizes`: sm unchanged, 23.8 px lines.
- `application-direction-studio--default`: the sample field reads as before, one pixel lower, one line.
- A sm field with ฟื้ปี๊ปุ่มสั่งซื้อฟูปู่: no mark cut above or below.

## F-S1: the LabelCentre sweep row stacks its triggers (sign-off ORV-199-signoff-1, head `3ce0fa0`)

The sign-off found that `Base/Select` `LabelCentre` breaks at 360: each sweep row sets the Thai and the English sm trigger side by side, `className="w-60"` does not reach the trigger width (the `.ds-control` recipe sizes it), so at 360 the English trigger runs to x 380.66, past its cell (right edge 344) and the viewport, and the page scrolls sideways (`scrollWidth` 381). At 1440 each trigger is 682 px wide. Both cells also start with the first trigger's border on the boundary's top edge. The ink readings are unaffected; the look is the finding.

<!-- prettier-ignore -->
| # | Target | Tokens | The play that proves it |
| --- | --- | --- | --- |
| F-S1 | Each of the 16 sweep rows is 96 px tall and stacks its two sm triggers, Thai on top at `k/16` px, English below at `k/16 + 44` px (32 px box plus the 12 px gap), so both triggers of a row sit at the same fraction. Every trigger takes the cell width (cell minus 16 px each side) and stays 32 px tall. Each cell has 16 px above the first row and below the last, so no trigger border touches the boundary edge. 16 fractions and 32 triggers per cell are kept | none; layout utilities only (`h-24`, `flex-col`, `items-stretch`, `py-4`), no colour, radius, font or token change | The existing play (`toHaveLength(SWEEP.length * 2)`, `expectInkCentred(..., { measure: "body" })`, `expectLabelInkWhole`) unchanged. Injected render: `scrollWidth` equals the viewport at 360 and 1440, 0 triggers outside their cell, 16 distinct y fractions per page, every trigger 32 px (`node /tmp/orv-199-signoff-1/scripts/lcfix.cjs <playwright>`) |

### F-S1: builder table (head `3ce0fa0`)

| #      | File, line                                                                                                                                          | Before                                                                                                                                                                       | After                                                                                                                                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-S1.1 | `packages/design-system/src/components/select/Select.stories.tsx`, the cell `div` of `LabelCentre` (`data-testid` `label-centre-light` and `-dark`) | `className="flex flex-col bg-surface-canvas px-4"`                                                                                                                           | `className="flex flex-col bg-surface-canvas px-4 py-4"`                                                                                                                                                         |
| F-S1.2 | same story, the sweep row `div` (the one whose `style` sets `paddingTop` to `k / 16` px)                                                            | `className="box-border flex h-12 items-start gap-3"`                                                                                                                         | `className="box-border flex h-24 flex-col items-stretch gap-3"`; keep the `paddingTop` style as it is                                                                                                           |
| F-S1.3 | same story, the `Select` inside the row                                                                                                             | `className="w-60"`                                                                                                                                                           | drop the `className` prop; the trigger takes the row width through `items-stretch`                                                                                                                              |
| F-S1.4 | same story, the JSDoc above `LabelCentre`                                                                                                           | "every row an sm Select with the Thai value and one with the English value, its box `k/16` px below a whole pixel (the row is a fixed 48 px, so the offset does not add up)" | "every row a fixed 96 px holding an sm Select with the Thai value and, 44 px below it, one with the English value, both `k/16` px below a whole pixel (the row height is fixed, so the offset does not add up)" |

The row height stays fixed (96 px is a whole pixel), so the offset of row `k` does not carry into row `k + 1`, as before. 32 + 12 + 32 = 76 px plus at most 15/16 px of padding fits the 96 px row, so no trigger leaves its row.

### F-S1: rendered (proposed CSS injected into `base-select--label-centre` on `3ce0fa0`)

Injected CSS: `[data-testid^="label-centre-"] > div { height: 96px; flex-direction: column; align-items: stretch; } [data-testid^="label-centre-"] { padding-block: 16px; }`, the same layout as F-S1.1 and F-S1.2 (`w-60` had no effect, so leaving it in the injection does not change the render). Storybook on port 6450, device scale 2, reduced motion, top 420 px of the page:

- `/tmp/orv-199-signoff-1/screenshots/proposed-select-label-centre-w360-th-light.png`
- `/tmp/orv-199-signoff-1/screenshots/proposed-select-label-centre-w360-th-dark.png`
- `/tmp/orv-199-signoff-1/screenshots/proposed-select-label-centre-w360-en-light.png`
- `/tmp/orv-199-signoff-1/screenshots/proposed-select-label-centre-w360-en-dark.png`
- `/tmp/orv-199-signoff-1/screenshots/proposed-select-label-centre-w1440-th-light.png`
- `/tmp/orv-199-signoff-1/screenshots/proposed-select-label-centre-w1440-th-dark.png`
- `/tmp/orv-199-signoff-1/screenshots/proposed-select-label-centre-w1440-en-light.png`
- `/tmp/orv-199-signoff-1/screenshots/proposed-select-label-centre-w1440-en-dark.png`

What the eye reads: at 360 every row is a Thai pill (บันทึกการเปลี่ยนแปลง) over an English pill (Save changes), both from x 32 to x 328, one start edge, one height, the chevron at the same inset; 16 px of canvas above the first pill; no sideways scroll. At 1440 the pills run the cell width with the same rhythm (12 px inside a pair, 20 px between pairs). The Thai marks above (ที่, ลี่) are whole. The values do not change with the locale global (they are fixtures), so the th and en frames match; the light and dark frames differ only in the root around the light cell, which the 420 px crop shows first.

Screens to check in visual QA (G3) for F-S1: `base-select--label-centre` at 360 and the widest canvas, Thai and English, light and dark, scrolled to the dark cell as well: no trigger past its cell, no sideways scroll, the first trigger of each cell clear of the boundary edge.
